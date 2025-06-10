
import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import { v4 as uuidv4 } from 'uuid';
import { FaPaperclip, FaSmile, FaMapMarkerAlt, FaMoon, FaSun, FaSearch, FaTrash, FaVideo, FaPhone, FaEllipsisV, FaCheck, FaCheckDouble, FaUserPlus, FaSignOutAlt, FaMicrophone, FaStop, FaRegImage } from 'react-icons/fa';
import { MdSend, MdNotifications, MdGroup, MdPerson, MdLocationOn, MdFileCopy } from 'react-icons/md';
import { BsThreeDotsVertical, BsArrowLeft } from 'react-icons/bs';
import { RiChatDeleteLine } from 'react-icons/ri';
import { BiBlock } from 'react-icons/bi';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

import './App.css';

const socket = io('http://192.168.1.6:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket']
});

function Appchat() {
  // Estados principales
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [contactos, setContactos] = useState({});
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [numeroUsuario, setNumeroUsuario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [nuevoNumero, setNuevoNumero] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [inputText, setInputText] = useState(''); 
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('all'); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [location, setLocation] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [onlineStatus, setOnlineStatus] = useState('online');
  const [showUserProfile, setShowUserProfile] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState([]);
  const [groups, setGroups] = useState([]);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [messageReplies, setMessageReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    preview: true,
    vibrate: false
  });
  const [messageHistory, setMessageHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [userPresence, setUserPresence] = useState({});
  const [messageEditId, setMessageEditId] = useState(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessage, setForwardMessage] = useState(null);
  const [forwardTo, setForwardTo] = useState([]);
  const [showMobileUserList, setShowMobileUserList] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioChunks, setAudioChunks] = useState([]);
  const [privateChats, setPrivateChats] = useState({});
  const [activePrivateChat, setActivePrivateChat] = useState(null);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [showContactsList, setShowContactsList] = useState(false);

  // Referencias
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioElementRef = useRef(null);
  const messageInputRef = useRef(null);
  const recorderRef = useRef(null);
  const notificationSoundRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Efectos
  useEffect(() => {
    // Conexión al socket
    socket.on('connect', () => {
      setConnectionStatus('connected');
      setShowConnectionStatus(true);
      setTimeout(() => setShowConnectionStatus(false), 2000);
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      setShowConnectionStatus(true);
    });

    socket.on('reconnecting', (attempt) => {
      setConnectionStatus(`reconnecting (${attempt})`);
      setShowConnectionStatus(true);
    });

    socket.on('reconnect_failed', () => {
      setConnectionStatus('failed');
      setShowConnectionStatus(true);
    });

    // Manejo de mensajes
    socket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
      
      if (notificationSettings.sound && message.from !== username) {
        notificationSoundRef.current.play();
      }
    });

    socket.on('users', (usersList) => {
      setUsers(usersList);
    });

    socket.on('typing', ({ user, isTyping }) => {
      setTypingUsers(prev => 
        isTyping 
          ? [...prev.filter(u => u !== user), user] 
          : prev.filter(u => u !== user)
      );
    });

    socket.on('userStatus', (statusUpdates) => {
      setUserPresence(prev => ({ ...prev, ...statusUpdates }));
    });

    // Limpieza
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.off('users');
      socket.off('typing');
      socket.off('userStatus');
    };
  }, [username, notificationSettings.sound]);

  useEffect(() => {
    // Autenticación automática para desarrollo
    const devUsername = 'Usuario' + Math.floor(Math.random() * 1000);
    setUsername(devUsername);
    socket.emit('login', devUsername);
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Funciones
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;

    const newMessage = {
      id: uuidv4(),
      from: username,
      to: selectedUser,
      text: message,
      timestamp: new Date(),
      status: 'sent'
    };

    socket.emit('message', newMessage);
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setMessageHistory(prev => [...prev, message]);
    setHistoryIndex(-1);
    setShowEmojiPicker(false);
    scrollToBottom();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'ArrowUp' && message === '' && messageHistory.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < messageHistory.length - 1 ? historyIndex + 1 : messageHistory.length - 1;
      setHistoryIndex(newIndex);
      setMessage(messageHistory[messageHistory.length - 1 - newIndex]);
    } else if (e.key === 'ArrowDown' && message === '' && historyIndex >= 0) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMessage(newIndex >= 0 ? messageHistory[messageHistory.length - 1 - newIndex] : '');
    } else {
      socket.emit('typing', { user: username, isTyping: true });
      typingTimeout();
    }
  };

  const typingTimeout = useCallback(() => {
    const timer = setTimeout(() => {
      socket.emit('typing', { user: username, isTyping: false });
    }, 2000);
    return () => clearTimeout(timer);
  }, [username]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowMobileUserList(false);
    setUnreadCounts(prev => ({ ...prev, [user]: 0 }));
  };

  const onEmojiClick = (emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const changeStatus = (status) => {
    setOnlineStatus(status);
    socket.emit('statusChange', status);
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles.map(file => ({
      id: uuidv4(),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'file'
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setAudioChunks(chunks);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = () => {
    if (audioUrl) {
      const audioMessage = {
        id: uuidv4(),
        from: username,
        to: selectedUser,
        audio: audioUrl,
        timestamp: new Date(),
        status: 'sent'
      };
      
      socket.emit('audioMessage', audioMessage);
      setMessages(prev => [...prev, audioMessage]);
      setAudioUrl('');
      setAudioChunks([]);
    }
  };

  const formatDate = (date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Ayer ' + format(date, 'HH:mm');
    } else {
      return format(date, 'dd/MM/yyyy HH:mm');
    }
  };

  const formatRelativeTime = (date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const filteredMessages = messages.filter(msg => 
    (selectedUser === 'all' || msg.from === selectedUser || msg.to === selectedUser || msg.to === 'all') &&
    (messageSearch === '' || msg.text?.toLowerCase().includes(messageSearch.toLowerCase()))
  );

  const renderMessageItem = (msg, index, isPrivate = false) => {
    const isCurrentUser = msg.from === username;
    const isGroupMessage = msg.to === 'all';
    const showHeader = index === 0 || 
                      messages[index - 1].from !== msg.from || 
                      new Date(msg.timestamp) - new Date(messages[index - 1].timestamp) > 60000;

    return (
      <div 
        key={msg.id} 
        className={`message ${isCurrentUser ? 'sent' : 'received'} ${showHeader ? 'with-header' : ''}`}
      >
        {showHeader && !isCurrentUser && (
          <div className="message-header">
            <span className="message-sender">{msg.from}</span>
            <span className="message-time">{formatDate(new Date(msg.timestamp))}</span>
          </div>
        )}
        
        <div className="message-content">
          {msg.text && <div className="message-text">{msg.text}</div>}
          {msg.audio && (
            <audio 
              controls 
              src={msg.audio} 
              className="message-audio"
              ref={isCurrentUser ? audioElementRef : null}
            />
          )}
          <div className="message-status">
            {isCurrentUser && (
              <>
                {msg.status === 'sent' && <FaCheck className="status-icon" />}
                {msg.status === 'delivered' && <FaCheckDouble className="status-icon" />}
                {msg.status === 'read' && <FaCheckDouble className="status-icon read" />}
              </>
            )}
            <span className="message-time-right">
              {format(new Date(msg.timestamp), 'HH:mm')}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizado condicional del área de mensajes
  const renderMessagesArea = () => {
    if (activePrivateChat) {
      const currentPrivateChatMessages = privateChats[activePrivateChat] || [];
      return currentPrivateChatMessages.length === 0 ? (
        <div className="no-messages">
          No hay mensajes todavía. ¡Envía el primero!
        </div>
      ) : (
        currentPrivateChatMessages.map((msg, index) => renderMessageItem(msg, index, true))
      );
    } else if (selectedUser) {
      return filteredMessages.length === 0 ? (
        <div className="no-messages">
          {messageSearch ? 
            'No se encontraron mensajes que coincidan con tu búsqueda' : 
            'No hay mensajes todavía. ¡Envía el primero!'}
        </div>
      ) : (
        filteredMessages.map((msg, index) => renderMessageItem(msg, index))
      );
    } else {
      return (
        <div className="no-chat-selected-message">
          <div className="welcome-message">
            <h2>Bienvenido a AG Connect</h2>
            <p>Selecciona un chat para comenzar a conversar</p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <MdGroup className="feature-icon" />
                <h3>Grupos</h3>
                <p>Crea grupos con tus amigos, familia o compañeros de trabajo.</p>
              </div>
              <div className="welcome-feature">
                <MdPerson className="feature-icon" />
                <h3>Chat Privado</h3>
                <p>Conversaciones uno a uno con total privacidad.</p>
              </div>
              <div className="welcome-feature">
                <FaMapMarkerAlt className="feature-icon" />
                <h3>Ubicación</h3>
                <p>Comparte tu ubicación en tiempo real.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`chat-app ${darkMode ? 'dark' : ''}`}>
      {/* Barra de conexión */}
      {showConnectionStatus && (
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? 'Conectado' : 
           connectionStatus === 'disconnected' ? 'Desconectado' :
           connectionStatus.startsWith('reconnecting') ? 'Reconectando...' : 'Error de conexión'}
        </div>
      )}
      
      {/* Barra superior */}
      <div className="chat-header">
        <div className="header-left">
          <button 
            className="mobile-menu-button" 
            onClick={() => setShowMobileUserList(!showMobileUserList)}
          >
            <BsArrowLeft />
          </button>
          <div className="chat-title">AG Connect</div>
        </div>
        
        <div className="header-controls">
          <div className="user-status">
            <select 
              value={onlineStatus} 
              onChange={(e) => changeStatus(e.target.value)}
              className={`status-select ${onlineStatus}`}
            >
              <option value="online">En línea</option>
              <option value="away">Ausente</option>
              <option value="busy">Ocupado</option>
              <option value="offline">Desconectado</option>
            </select>
          </div>
          
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="settings-button"
            title="Configuración"
          >
            <BsThreeDotsVertical />
          </button>
        </div>
      </div>

      {/* Configuración flotante */}
      {showSettings && (
        <div className="settings-panel">
          <h3>Configuración</h3>
          <div className="setting-item">
            <label>Sonido de notificaciones</label>
            <input 
              type="checkbox" 
              checked={notificationSettings.sound} 
              onChange={() => setNotificationSettings(prev => ({ ...prev, sound: !prev.sound }))} 
            />
          </div>
          <div className="setting-item">
            <label>Vista previa de mensajes</label>
            <input 
              type="checkbox" 
              checked={notificationSettings.preview} 
              onChange={() => setNotificationSettings(prev => ({ ...prev, preview: !prev.preview }))} 
            />
          </div>
          <div className="setting-item">
            <label>Vibración</label>
            <input 
              type="checkbox" 
              checked={notificationSettings.vibrate} 
              onChange={() => setNotificationSettings(prev => ({ ...prev, vibrate: !prev.vibrate }))} 
            />
          </div>
          <button 
            className="logout-button"
            onClick={() => {
              socket.emit('logout');
              setIsLoggedIn(false);
              setUsername('');
            }}
          >
            <FaSignOutAlt /> Cerrar sesión
          </button>
        </div>
      )}

      {/* Modal para añadir contacto */}
      {showAddContactModal && (
        <div className="add-contact-modal">
          <div className="modal-content">
            <h3>Añadir nuevo contacto</h3>
            <div className="input-group">
              <label>Nombre:</label>
              <input 
                type="text" 
                value={newContactName} 
                onChange={(e) => setNewContactName(e.target.value)} 
                placeholder="Nombre del contacto"
              />
            </div>
            <div className="input-group">
              <label>Número:</label>
              <input 
                type="text" 
                value={newContactNumber} 
                onChange={(e) => setNewContactNumber(e.target.value)} 
                placeholder="Número de teléfono"
              />
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowAddContactModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={() => {
                  if (newContactName && newContactNumber) {
                    setContacts(prev => [...prev, {
                      id: uuidv4(),
                      name: newContactName,
                      number: newContactNumber
                    }]);
                    setNewContactName('');
                    setNewContactNumber('');
                    setShowAddContactModal(false);
                  }
                }}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="main-content">
        {/* Sidebar - Lista de usuarios/grupos */}
        <div className={`sidebar ${showSidebar ? 'visible' : ''} ${showMobileUserList ? 'mobile-visible' : ''}`}>
          <div className="sidebar-header">
            <div className="user-profile">
              <div className="profile-avatar">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>{username}</h3>
                <p className={`status ${onlineStatus}`}>
                  {onlineStatus === 'online' ? 'En línea' : 
                   onlineStatus === 'away' ? 'Ausente' : 
                   onlineStatus === 'busy' ? 'Ocupado' : 'Desconectado'}
                </p>
              </div>
            </div>
            <div className="sidebar-search">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar chats o contactos..."
                onChange={(e) => setMessageSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-tabs">
            <button 
              className={`tab-button ${!showContactsList ? 'active' : ''}`}
              onClick={() => setShowContactsList(false)}
            >
              <MdPerson /> Chats
            </button>
            <button 
              className={`tab-button ${showContactsList ? 'active' : ''}`}
              onClick={() => setShowContactsList(true)}
            >
              <FaUserPlus /> Contactos
            </button>
          </div>

          <div className="sidebar-content">
            {showContactsList ? (
              <div className="contacts-list">
                <button 
                  className="add-contact-button"
                  onClick={() => setShowAddContactModal(true)}
                >
                  <FaUserPlus /> Añadir contacto
                </button>
                {contacts.length === 0 ? (
                  <div className="no-contacts">
                    No tienes contactos añadidos
                  </div>
                ) : (
                  contacts.map(contact => (
                    <div 
                      key={contact.id} 
                      className="contact-item"
                      onClick={() => {
                        setActivePrivateChat(contact.number);
                        setSelectedUser(null);
                        setShowMobileUserList(false);
                      }}
                    >
                      <div className="contact-avatar">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="contact-info">
                        <h4>{contact.name}</h4>
                        <p>{contact.number}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="chats-list">
                  <div 
                    className={`chat-item ${selectedUser === 'all' ? 'active' : ''}`}
                    onClick={() => handleUserSelect('all')}
                  >
                    <div className="chat-avatar group">
                      <MdGroup />
                    </div>
                    <div className="chat-info">
                      <h4>Chat General</h4>
                      <p className="last-message">
                        {messages.length > 0 ? 
                          `${messages[messages.length - 1].from}: ${messages[messages.length - 1].text?.substring(0, 20)}...` : 
                          'No hay mensajes'}
                      </p>
                    </div>
                    {unreadCounts['all'] > 0 && (
                      <span className="unread-count">{unreadCounts['all']}</span>
                    )}
                  </div>

                  {users.filter(u => u !== username).map(user => (
                    <div 
                      key={user} 
                      className={`chat-item ${selectedUser === user ? 'active' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="chat-avatar">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <div className="chat-info">
                        <h4>{user}</h4>
                        <p className={`status ${userPresence[user] || 'offline'}`}>
                          {userPresence[user] === 'online' ? 'En línea' : 
                           userPresence[user] === 'away' ? 'Ausente' : 
                           userPresence[user] === 'busy' ? 'Ocupado' : 'Desconectado'}
                        </p>
                      </div>
                      {unreadCounts[user] > 0 && (
                        <span className="unread-count">{unreadCounts[user]}</span>
                      )}
                    </div>
                  ))}
                </div>

                <button 
                  className="new-group-button"
                  onClick={() => setShowGroupModal(true)}
                >
                  <MdGroup /> Nuevo grupo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Área de chat principal */}
        <div className="chat-main">
          {/* Encabezado del chat */}
          {activePrivateChat || selectedUser ? (
            <div className="chat-info">
              <div className="chat-header-info">
                {activePrivateChat ? (
                  <>
                    <div className="chat-avatar">
                      {contacts.find(c => c.number === activePrivateChat)?.name.charAt(0).toUpperCase() || 'C'}
                    </div>
                    <div className="chat-details">
                      <h3>{contacts.find(c => c.number === activePrivateChat)?.name || activePrivateChat}</h3>
                      <p>Contacto</p>
                    </div>
                  </>
                ) : selectedUser === 'all' ? (
                  <>
                    <div className="chat-avatar group">
                      <MdGroup />
                    </div>
                    <div className="chat-details">
                      <h3>Chat General</h3>
                      <p>
                        {typingUsers.length > 0 ? 
                          `${typingUsers[0]} está escribiendo...` : 
                          `${users.length} miembros`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="chat-avatar">
                      {selectedUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-details">
                      <h3>{selectedUser}</h3>
                      <p className={`status ${userPresence[selectedUser] || 'offline'}`}>
                        {userPresence[selectedUser] === 'online' ? 'En línea' : 
                         userPresence[selectedUser] === 'away' ? 'Ausente' : 
                         userPresence[selectedUser] === 'busy' ? 'Ocupado' : 'Desconectado'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="chat-actions">
                <button title="Llamar">
                  <FaPhone />
                </button>
                <button title="Videollamada">
                  <FaVideo />
                </button>
                <button 
                  title="Más opciones"
                  onClick={() => setShowUserProfile(activePrivateChat || selectedUser)}
                >
                  <FaEllipsisV />
                </button>
              </div>
            </div>
          ) : (
            <div className="no-chat-selected">
              <h3>Selecciona un chat para comenzar</h3>
              <p>Elige una conversación existente o inicia una nueva</p>
            </div>
          )}

          {/* Mensajes fijados */}
          {pinnedMessages.length > 0 && selectedUser === 'all' && (
            <div className="pinned-messages-bar">
              <div className="pinned-header">
                <MdFileCopy /> Mensajes fijados
              </div>
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="pinned-message">
                  <div className="pinned-content">
                    <strong>{msg.from}:</strong> {msg.text?.substring(0, 30)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Área de mensajes */}
          <div className="messages">
            {renderMessagesArea()}
            <div ref={messagesEndRef} />
          </div>

          {/* Indicador de que alguien está escribiendo */}
          <div className="typing-indicator">
            {typingUsers.length > 0 && (
              <p>
                {typingUsers.length > 1 
                  ? `${typingUsers.join(', ')} están escribiendo...` 
                  : `${typingUsers[0]} está escribiendo...`}
              </p>
            )}
          </div>

          {/* Respondiendo a mensaje */}
          {replyingTo && (
            <div className="reply-preview">
              <div className="reply-info">
                <span>Respondiendo a {replyingTo.from}</span>
                <button onClick={() => setReplyingTo(null)}>×</button>
              </div>
              <div className="reply-content">
                {replyingTo.text?.substring(0, 50)}{replyingTo.text?.length > 50 ? '...' : ''}
              </div>
            </div>
          )}

          {/* Editando mensaje */}
          {messageEditId && (
            <div className="edit-message-preview">
              <div className="edit-info">
                <span>Editando mensaje</span>
                <button onClick={() => setMessageEditId(null)}>×</button>
              </div>
              <input
                type="text"
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const updatedMessages = messages.map(msg => 
                      msg.id === messageEditId ? { ...msg, text: editedMessage } : msg
                    );
                    setMessages(updatedMessages);
                    setMessageEditId(null);
                    setEditedMessage('');
                  }
                }}
              />
            </div>
          )}

          {/* Archivos adjuntos */}
          {files.length > 0 && (
            <div className="attachments-preview">
              {files.map(file => (
                <div key={file.id} className="attachment-item">
                  <div className="attachment-info">
                    {file.type === 'image' ? (
                      <img 
                        src={URL.createObjectURL(file.file)} 
                        alt="Preview" 
                        className="attachment-preview"
                      />
                    ) : (
                      <div className="file-icon">
                        <FaPaperclip />
                      </div>
                    )}
                    <span className="file-name">{file.file.name}</span>
                    <span className="file-size">
                      {(file.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button 
                    className="remove-attachment"
                    onClick={() => removeFile(file.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Área de entrada de mensajes */}
          {(activePrivateChat || selectedUser) && (
            <div className="message-input-area">
              <div className="input-actions">
                <button 
                  onClick={() => fileInputRef.current.click()}
                  title="Adjuntar archivo"
                >
                  <FaPaperclip />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    multiple
                  />
                </button>
                <button 
                  onClick={() => imageInputRef.current.click()}
                  title="Enviar imagen"
                >
                  <FaRegImage />
                  <input 
                    type="file" 
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    multiple
                  />
                </button>
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Emojis"
                >
                  <FaSmile />
                </button>
                <button 
                  onClick={() => setShowLocationModal(true)}
                  title="Ubicación"
                >
                  <FaMapMarkerAlt />
                </button>
              </div>

              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}

              <div className="message-input-container">
                <textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (e.target.value) {
                      socket.emit('typing', { user: username, isTyping: true });
                      typingTimeout();
                    } else {
                      socket.emit('typing', { user: username, isTyping: false });
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows="1"
                />
                {isRecording ? (
                  <button 
                    className="send-button recording"
                    onClick={stopRecording}
                    title="Detener grabación"
                  >
                    <FaStop />
                  </button>
                ) : message.trim() || files.length > 0 || audioUrl ? (
                  <button 
                    className="send-button"
                    onClick={handleSubmit}
                    title="Enviar mensaje"
                  >
                    <MdSend />
                  </button>
                ) : (
                  <button 
                    className="send-button"
                    onClick={startRecording}
                    title="Grabar audio"
                  >
                    <FaMicrophone />
                  </button>
                )}
              </div>

              {audioUrl && (
                <div className="audio-preview">
                  <audio controls src={audioUrl} ref={audioElementRef} />
                  <button 
                    className="send-audio-button"
                    onClick={sendAudioMessage}
                  >
                    Enviar audio
                  </button>
                  <button 
                    className="cancel-audio-button"
                    onClick={() => {
                      setAudioUrl('');
                      setAudioChunks([]);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de ubicación */}
      {showLocationModal && (
        <div className="location-modal">
          <div className="modal-content">
            <h3>Compartir ubicación</h3>
            <div className="location-options">
              <button 
                className="location-option"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setLocation({
                          lat: position.coords.latitude,
                          lng: position.coords.longitude
                        });
                      },
                      (error) => {
                        console.error('Error obteniendo ubicación:', error);
                      }
                    );
                  }
                }}
              >
                <MdLocationOn /> Ubicación actual
              </button>
              <button className="location-option">
                <FaMapMarkerAlt /> Seleccionar en mapa
              </button>
            </div>
            {location && (
              <div className="location-preview">
                <img 
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=400x200&markers=color:red%7C${location.lat},${location.lng}&key=YOUR_API_KEY`} 
                  alt="Ubicación"
                />
                <button 
                  className="send-location-button"
                  onClick={() => {
                    const locationMessage = {
                      id: uuidv4(),
                      from: username,
                      to: selectedUser,
                      location,
                      timestamp: new Date(),
                      status: 'sent'
                    };
                    socket.emit('locationMessage', locationMessage);
                    setMessages(prev => [...prev, locationMessage]);
                    setShowLocationModal(false);
                    setLocation(null);
                  }}
                >
                  Enviar ubicación
                </button>
              </div>
            )}
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowLocationModal(false);
                  setLocation(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de creación de grupo */}
      {showGroupModal && (
        <div className="group-modal">
          <div className="modal-content">
            <h3>Crear nuevo grupo</h3>
            <div className="input-group">
              <label>Nombre del grupo:</label>
              <input 
                type="text" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)} 
                placeholder="Nombre del grupo"
              />
            </div>
            <div className="group-members">
              <h4>Seleccionar miembros:</h4>
              {users.filter(u => u !== username).map(user => (
                <div key={user} className="member-item">
                  <input 
                    type="checkbox" 
                    id={`user-${user}`}
                    checked={selectedUsersForGroup.includes(user)}
                    onChange={() => {
                      setSelectedUsersForGroup(prev => 
                        prev.includes(user) 
                          ? prev.filter(u => u !== user) 
                          : [...prev, user]
                      );
                    }}
                  />
                  <label htmlFor={`user-${user}`}>
                    <div className="member-avatar">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <span>{user}</span>
                  </label>
                </div>
              ))}
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowGroupModal(false);
                  setNewGroupName('');
                  setSelectedUsersForGroup([]);
                }}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={() => {
                  if (newGroupName && selectedUsersForGroup.length > 0) {
                    const newGroup = {
                      id: uuidv4(),
                      name: newGroupName,
                      members: [...selectedUsersForGroup, username],
                      admin: username
                    };
                    setGroups(prev => [...prev, newGroup]);
                    setShowGroupModal(false);
                    setNewGroupName('');
                    setSelectedUsersForGroup([]);
                  }
                }}
                disabled={!newGroupName || selectedUsersForGroup.length === 0}
              >
                Crear grupo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de perfil de usuario/grupo */}
      {showUserProfile && (
        <div className="profile-modal">
          <div className="modal-content">
            <div className="profile-header">
              <div className="profile-avatar">
                {showUserProfile === 'all' ? (
                  <MdGroup className="group-icon" />
                ) : (
                  showUserProfile.charAt(0).toUpperCase()
                )}
              </div>
              <h3>
                {showUserProfile === 'all' ? 'Chat General' : showUserProfile}
              </h3>
              {showUserProfile !== 'all' && (
                <p className={`status ${userPresence[showUserProfile] || 'offline'}`}>
                  {userPresence[showUserProfile] === 'online' ? 'En línea' : 
                   userPresence[showUserProfile] === 'away' ? 'Ausente' : 
                   userPresence[showUserProfile] === 'busy' ? 'Ocupado' : 'Desconectado'}
                </p>
              )}
            </div>

            <div className="profile-actions">
              {showUserProfile !== 'all' && (
                <>
                  <button className="profile-action">
                    <FaPhone /> Llamar
                  </button>
                  <button className="profile-action">
                    <FaVideo /> Videollamada
                  </button>
                </>
              )}
              <button className="profile-action">
                <FaSearch /> Buscar en la conversación
              </button>
              {showUserProfile !== 'all' && (
                <>
                  <button className="profile-action">
                    <BiBlock /> Bloquear
                  </button>
                  <button className="profile-action danger">
                    <RiChatDeleteLine /> Eliminar chat
                  </button>
                </>
              )}
            </div>

            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowUserProfile(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reenvío de mensajes */}
      {showForwardModal && forwardMessage && (
        <div className="forward-modal">
          <div className="modal-content">
            <h3>Reenviar mensaje</h3>
            <div className="forward-message-preview">
              <strong>{forwardMessage.from}:</strong> {forwardMessage.text}
            </div>
            <div className="forward-recipients">
              <h4>Seleccionar destinatarios:</h4>
              <div className="recipients-list">
                {users.filter(u => u !== username).map(user => (
                  <div key={user} className="recipient-item">
                    <input 
                      type="checkbox" 
                      id={`forward-to-${user}`}
                      checked={forwardTo.includes(user)}
                      onChange={() => {
                        setForwardTo(prev => 
                          prev.includes(user) 
                            ? prev.filter(u => u !== user) 
                            : [...prev, user]
                        );
                      }}
                    />
                    <label htmlFor={`forward-to-${user}`}>
                      <div className="recipient-avatar">
                        {user.charAt(0).toUpperCase()}
                      </div>
                      <span>{user}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowForwardModal(false);
                  setForwardMessage(null);
                  setForwardTo([]);
                }}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button"
                onClick={() => {
                  forwardTo.forEach(user => {
                    const forwardedMessage = {
                      ...forwardMessage,
                      id: uuidv4(),
                      to: user,
                      forwarded: true
                    };
                    socket.emit('message', forwardedMessage);
                    setMessages(prev => [...prev, forwardedMessage]);
                  });
                  setShowForwardModal(false);
                  setForwardMessage(null);
                  setForwardTo([]);
                }}
                disabled={forwardTo.length === 0}
              >
                Reenviar ({forwardTo.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones */}
      <div className="notifications">
        {notifications.map((notif) => (
          <div key={notif.id} className="notification">
            <strong>{notif.from}:</strong> {notif.message}
          </div>
        ))}
      </div>
      
      {/* Audio para notificaciones */}
      <audio ref={notificationSoundRef} src="/notification.mp3" preload="auto" />
    </div>
  );
}

export default Appchat;