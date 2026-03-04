import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Lock, Unlock, Globe, Clock, User,
  ChevronRight, RefreshCw, Search, Filter, DoorOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { roomsService } from '../services/roomsService.js';

const TABS = [
  { id: 'public', label: 'Public Rooms', icon: <Globe size={16} /> },
  { id: 'my', label: 'My Rooms', icon: <User size={16} /> }
];

function RoomsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('public');
  const [rooms, setRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const publicRooms = await roomsService.getPublicRooms();
      setRooms(publicRooms);

      if (isAuthenticated) {
        const myRoomsData = await roomsService.getMyRooms();
        setMyRooms(myRoomsData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchRooms();

    const unsubscribe = roomsService.subscribeToRoomsList((payload) => {
      fetchRooms();
    });

    return () => unsubscribe();
  }, [fetchRooms]);

  const filteredRooms = (activeTab === 'public' ? rooms : myRooms).filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = async (room) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/rooms' } });
      return;
    }

    if (room.is_private) {
      const password = prompt('Enter room password:');
      if (!password) return;
      try {
        await roomsService.joinRoom(room.id, password);
        navigate(`/room/${room.id}`);
      } catch (err) {
        alert(err.message);
      }
    } else {
      try {
        await roomsService.joinRoom(room.id);
        navigate(`/room/${room.id}`);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getDisplayRooms = () => {
    if (searchQuery) return filteredRooms;
    if (activeTab === 'public') return rooms;
    return myRooms;
  };

  return (
    <div className="rooms-page">
      <div className="rooms-header">
        <div className="header-content">
          <div className="header-title">
            <Users size={32} className="header-icon" />
            <div>
              <h1>Study Rooms</h1>
              <p>Join others and focus together</p>
            </div>
          </div>

          <motion.button
            className="create-room-btn"
            onClick={() => isAuthenticated ? setShowCreateModal(true) : navigate('/login')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={20} />
            Create Room
          </motion.button>
        </div>

        <div className="rooms-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rooms-content">
        {loading ? (
          <div className="rooms-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={32} />
            </motion.div>
          </div>
        ) : error ? (
          <div className="rooms-error">
            <p>{error}</p>
            <button onClick={fetchRooms}>Retry</button>
          </div>
        ) : (
          <div className="rooms-grid">
            <AnimatePresence mode="popLayout">
              {getDisplayRooms().map((room, index) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={index}
                  onJoin={() => handleJoinRoom(room)}
                />
              ))}
            </AnimatePresence>

            {getDisplayRooms().length === 0 && (
              <div className="empty-rooms">
                <DoorOpen size={48} />
                <h3>No rooms found</h3>
                <p>{searchQuery ? 'Try a different search' : 'Create a room to get started'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(room) => navigate(`/room/${room.id}`)}
      />
    </div>
  );
}

function RoomCard({ room, index, onJoin }) {
  const participantCount = room.participant_count?.[0]?.count || 0;
  const isFull = participantCount >= room.max_participants;

  return (
    <motion.div
      className="room-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      layout
    >
      <div className="room-header">
        <div className="room-privacy">
          {room.is_private ? (
            <Lock size={14} className="private" />
          ) : (
            <Unlock size={14} className="public" />
          )}
        </div>
        <span className={`room-status ${room.status}`}>{room.status}</span>
      </div>

      <h3 className="room-name">{room.name}</h3>
      {room.description && (
        <p className="room-description">{room.description}</p>
      )}

      <div className="room-meta">
        <div className="meta-item">
          <Users size={14} />
          <span>{participantCount}/{room.max_participants}</span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>{new Date(room.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {room.creator && (
        <div className="room-creator">
          {room.creator.avatar_url ? (
            <img src={room.creator.avatar_url} alt={room.creator.username} />
          ) : (
            <div className="creator-avatar">
              {room.creator.display_name?.[0] || room.creator.username[0]}
            </div>
          )}
          <span>{room.creator.display_name || room.creator.username}</span>
        </div>
      )}

      <motion.button
        className={`join-room-btn ${isFull ? 'full' : ''}`}
        onClick={onJoin}
        disabled={isFull}
        whileHover={!isFull ? { scale: 1.02 } : {}}
        whileTap={!isFull ? { scale: 0.98 } : {}}
      >
        {isFull ? 'Full' : 'Join Room'}
        <ChevronRight size={16} />
      </motion.button>
    </motion.div>
  );
}

function CreateRoomModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const room = await roomsService.createRoom({
        name,
        description,
        isPrivate,
        password: isPrivate ? password : null,
        maxParticipants
      });
      onCreated(room);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="modal-content create-room-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <h2>Create Study Room</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Late Night Study Group"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this room about?"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Max Participants</label>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                />
              </div>

              <div className="form-group checkbox">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <Lock size={16} />
                  Private Room
                </label>
              </div>

              {isPrivate && (
                <motion.div
                  className="form-group"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter room password"
                    required={isPrivate}
                  />
                </motion.div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RoomsPage;
