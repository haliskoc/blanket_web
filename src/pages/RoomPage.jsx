import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Mic, MicOff, Settings, LogOut,
  Play, Pause, Clock, Crown, MoreVertical, Send, X,
  Volume2, VolumeX, UserPlus, Copy, Check
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { roomsService } from '../services/roomsService.js';

const FOCUS_STATUSES = {
  idle: { label: 'Idle', color: '#6b7280' },
  focusing: { label: 'Focusing', color: '#10b981' },
  break: { label: 'On Break', color: '#f59e0b' },
  offline: { label: 'Offline', color: '#374151' }
};

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [focusStatus, setFocusStatus] = useState('idle');
  const [roomTimer, setRoomTimer] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/room/${roomId}` } });
      return;
    }

    loadRoomData();
    const interval = setInterval(updateLastSeen, 30000);

    return () => {
      clearInterval(interval);
      roomsService.leaveRoom(roomId);
    };
  }, [roomId, isAuthenticated]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = roomsService.subscribeToRoom(roomId, {
      onParticipantChange: (payload) => {
        loadParticipants();
      },
      onNewMessage: (message) => {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    if (room?.timer_started_at && room?.timer_duration) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(room.timer_started_at).getTime()) / 1000);
        const remaining = room.timer_duration * 60 - elapsed;

        if (remaining <= 0) {
          setRoomTimer(null);
          clearInterval(timer);
        } else {
          setRoomTimer({
            remaining,
            type: room.timer_type,
            total: room.timer_duration * 60
          });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room]);

  const loadRoomData = async () => {
    try {
      const [roomData, participantsData, messagesData] = await Promise.all([
        roomsService.getRoom(roomId),
        roomsService.getRoomParticipants(roomId),
        roomsService.getMessages(roomId)
      ]);

      setRoom(roomData);
      setParticipants(participantsData);
      setMessages(messagesData);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const data = await roomsService.getRoomParticipants(roomId);
      setParticipants(data);
    } catch (err) {
      console.error('Failed to load participants:', err);
    }
  };

  const updateLastSeen = async () => {
    try {
      await roomsService.updateParticipantStatus(roomId, focusStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      await roomsService.sendMessage(roomId, content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLeaveRoom = async () => {
    await roomsService.leaveRoom(roomId);
    navigate('/rooms');
  };

  const handleStartTimer = async (duration, type) => {
    try {
      await roomsService.startRoomTimer(roomId, duration, type);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStopTimer = async () => {
    try {
      await roomsService.stopRoomTimer(roomId);
      setRoomTimer(null);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isHost = participants.find(p => p.userId === user?.id)?.role === 'host';
  const currentUser = participants.find(p => p.userId === user?.id);

  if (isLoading) {
    return (
      <div className="room-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Clock size={48} />
        </motion.div>
        <p>Joining room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error">
        <p>{error}</p>
        <button onClick={() => navigate('/rooms')}>Back to Rooms</button>
      </div>
    );
  }

  return (
    <div className="room-page">
      <RoomHeader
        room={room}
        participantCount={participants.filter(p => p.status === 'online').length}
        onLeave={handleLeaveRoom}
        onToggleChat={() => setShowChat(!showChat)}
        showChat={showChat}
        isHost={isHost}
        onShowSettings={() => setShowSettings(true)}
      />

      <div className="room-layout">
        <div className={`room-main ${showChat ? 'with-chat' : 'full-width'}`}>
          {roomTimer && (
            <RoomTimer
              timer={roomTimer}
              isHost={isHost}
              onStop={handleStopTimer}
            />
          )}

          <ParticipantsGrid
            participants={participants}
            currentUserId={user?.id}
            onStatusChange={setFocusStatus}
            currentStatus={focusStatus}
          />

          <RoomControls
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            focusStatus={focusStatus}
            onStatusChange={setFocusStatus}
            isHost={isHost}
            onStartTimer={handleStartTimer}
            roomTimer={roomTimer}
          />
        </div>

        <AnimatePresence>
          {showChat && (
            <motion.div
              className="room-chat"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              <ChatBox
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={user}
                messagesEndRef={messagesEndRef}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showSettings && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
          isHost={isHost}
        />
      )}
    </div>
  );
}

function RoomHeader({ room, participantCount, onLeave, onToggleChat, showChat, isHost, onShowSettings }) {
  const [copied, setCopied] = useState(false);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="room-header-bar">
      <div className="room-info">
        <h1>{room?.name}</h1>
        <div className="room-meta">
          <Users size={14} />
          <span>{participantCount} online</span>
        </div>
      </div>

      <div className="room-actions">
        <motion.button
          className="action-btn"
          onClick={copyRoomLink}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </motion.button>

        <motion.button
          className={`action-btn ${showChat ? 'active' : ''}`}
          onClick={onToggleChat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageSquare size={18} />
        </motion.button>

        {isHost && (
          <motion.button
            className="action-btn"
            onClick={onShowSettings}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={18} />
          </motion.button>
        )}

        <motion.button
          className="action-btn leave"
          onClick={onLeave}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </header>
  );
}

function RoomTimer({ timer, isHost, onStop }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((timer.total - timer.remaining) / timer.total) * 100;

  return (
    <div className={`room-timer ${timer.type}`}>
      <div className="timer-progress" style={{ width: `${progress}%` }} />
      <div className="timer-content">
        <Clock size={20} />
        <span className="timer-label">{timer.type === 'focus' ? 'Focus' : 'Break'} Time</span>
        <span className="timer-value">{formatTime(timer.remaining)}</span>
        {isHost && (
          <button onClick={onStop} className="timer-stop">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function ParticipantsGrid({ participants, currentUserId, onStatusChange, currentStatus }) {
  const onlineParticipants = participants.filter(p => p.status === 'online');

  return (
    <div className="participants-grid">
      {onlineParticipants.map((participant) => (
        <ParticipantCard
          key={participant.id}
          participant={participant}
          isCurrentUser={participant.userId === currentUserId}
          onStatusChange={onStatusChange}
          currentStatus={currentStatus}
        />
      ))}

      {onlineParticipants.length === 0 && (
        <div className="no-participants">
          <Users size={48} />
          <p>No one is online</p>
        </div>
      )}
    </div>
  );
}

function ParticipantCard({ participant, isCurrentUser, onStatusChange, currentStatus }) {
  const status = FOCUS_STATUSES[participant.focusStatus || 'idle'];

  return (
    <motion.div
      className={`participant-card ${isCurrentUser ? 'current-user' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      layout
    >
      <div className="participant-avatar">
        {participant.avatarUrl ? (
          <img src={participant.avatarUrl} alt={participant.username} />
        ) : (
          <div className="avatar-placeholder">
            {participant.displayName?.[0] || participant.username[0]}
          </div>
        )}
        <div className="status-indicator" style={{ background: status.color }} />
      </div>

      <div className="participant-info">
        <span className="participant-name">
          {participant.displayName || participant.username}
          {isCurrentUser && <span className="you-badge">You</span>}
          {participant.role === 'host' && <Crown size={12} className="host-badge" />}
        </span>
        <span className="participant-status" style={{ color: status.color }}>
          {status.label}
        </span>
      </div>

      {isCurrentUser && (
        <select
          className="status-select"
          value={currentStatus}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          {Object.entries(FOCUS_STATUSES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      )}
    </motion.div>
  );
}

function RoomControls({ isMuted, onToggleMute, focusStatus, onStatusChange, isHost, onStartTimer, roomTimer }) {
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  const timerOptions = [
    { duration: 25, label: '25 min', type: 'focus' },
    { duration: 50, label: '50 min', type: 'focus' },
    { duration: 5, label: '5 min break', type: 'break' },
    { duration: 15, label: '15 min break', type: 'break' }
  ];

  return (
    <div className="room-controls">
      <div className="control-group">
        <motion.button
          className={`control-btn ${isMuted ? 'active' : ''}`}
          onClick={onToggleMute}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{isMuted ? 'Muted' : 'Mic'}</span>
        </motion.button>
      </div>

      {isHost && !roomTimer && (
        <div className="control-group timer-group">
          <motion.button
            className="control-btn primary"
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={20} />
            <span>Start Timer</span>
          </motion.button>

          <AnimatePresence>
            {showTimerMenu && (
              <motion.div
                className="timer-menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {timerOptions.map((option) => (
                  <button
                    key={`${option.type}-${option.duration}`}
                    onClick={() => {
                      onStartTimer(option.duration, option.type);
                      setShowTimerMenu(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ChatBox({ messages, onSendMessage, currentUser, messagesEndRef }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <MessageSquare size={16} />
        <span>Room Chat</span>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.user?.id === currentUser?.id ? 'own' : ''}`}
          >
            <div className="message-header">
              {msg.user?.avatarUrl ? (
                <img src={msg.user.avatarUrl} alt={msg.user.username} />
              ) : (
                <div className="message-avatar">
                  {msg.user?.displayName?.[0] || msg.user?.username?.[0]}
                </div>
              )}
              <span className="message-author">
                {msg.user?.displayName || msg.user?.username}
              </span>
              <span className="message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="message-content">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function RoomSettingsModal({ room, onClose, isHost }) {
  if (!isHost) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Room Settings</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p>Room settings coming soon...</p>
        </div>
      </motion.div>
    </div>
  );
}

export default RoomPage;
