import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, X, Check, Search, MessageCircle,
  MoreVertical, Trash2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { friendsService } from '../services/friendsService.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function FriendList({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequests, setShowRequests] = useState(false);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadFriends();
      loadRequests();
    }
  }, [isOpen, isAuthenticated]);

  const loadFriends = async () => {
    try {
      const data = await friendsService.getFriends();
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        friendsService.getPendingRequests(),
        friendsService.getSentRequests()
      ]);
      setRequests({ incoming, outgoing });
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendsService.acceptFriendRequest(requestId);
      loadFriends();
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendsService.rejectFriendRequest(requestId);
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await friendsService.cancelRequest(requestId);
      loadRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await friendsService.removeFriend(friendshipId);
      loadFriends();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalRequests = requests.incoming.length + requests.outgoing.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="friend-list-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="friend-list-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="friend-list-header">
              <div className="header-tabs">
                <button
                  className={`header-tab ${!showRequests ? 'active' : ''}`}
                  onClick={() => setShowRequests(false)}
                >
                  <Users size={18} />
                  Friends
                  <span className="count">{friends.length}</span>
                </button>
                <button
                  className={`header-tab ${showRequests ? 'active' : ''}`}
                  onClick={() => setShowRequests(true)}
                >
                  <UserPlus size={18} />
                  Requests
                  {totalRequests > 0 && <span className="badge">{totalRequests}</span>}
                </button>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="friend-list-content">
              {showRequests ? (
                <FriendRequests
                  requests={requests}
                  onAccept={handleAcceptRequest}
                  onReject={handleRejectRequest}
                  onCancel={handleCancelRequest}
                />
              ) : (
                <FriendsList
                  friends={friends}
                  loading={loading}
                  onRemove={handleRemoveFriend}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FriendsList({ friends, loading, onRemove }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="friends-loading">
        <div className="spinner" />
        <p>Loading friends...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="friends-empty">
        <Users size={48} />
        <p>No friends yet</p>
        <span>Search for users to add friends</span>
      </div>
    );
  }

  return (
    <div className="friends-list">
      {friends.map((friend) => (
        <motion.div
          key={friend.friendshipId}
          className="friend-item"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          layout
        >
          <div
            className="friend-avatar"
            onClick={() => navigate(`/u/${friend.username}`)}
          >
            {friend.avatarUrl ? (
              <img src={friend.avatarUrl} alt={friend.username} />
            ) : (
              <div className="avatar-placeholder">
                {friend.displayName?.[0] || friend.username[0]}
              </div>
            )}
          </div>

          <div
            className="friend-info"
            onClick={() => navigate(`/u/${friend.username}`)}
          >
            <span className="friend-name">
              {friend.displayName || friend.username}
            </span>
            <span className="friend-username">@{friend.username}</span>
          </div>

          <div className="friend-actions">
            <motion.button
              className="action-btn"
              onClick={() => navigate(`/u/${friend.username}`)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle size={16} />
            </motion.button>
            <motion.button
              className="action-btn danger"
              onClick={() => onRemove(friend.friendshipId)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 size={16} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FriendRequests({ requests, onAccept, onReject, onCancel }) {
  return (
    <div className="requests-container">
      {requests.incoming.length > 0 && (
        <div className="requests-section">
          <h4>Incoming Requests</h4>
          {requests.incoming.map((request) => (
            <motion.div
              key={request.requestId}
              className="request-item incoming"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="request-user">
                {request.avatarUrl ? (
                  <img src={request.avatarUrl} alt={request.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {request.displayName?.[0] || request.username[0]}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">
                    {request.displayName || request.username}
                  </span>
                  <span className="request-time">
                    <Clock size={12} />
                    {new Date(request.sentAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="request-actions">
                <motion.button
                  className="btn-accept"
                  onClick={() => onAccept(request.requestId)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check size={16} />
                </motion.button>
                <motion.button
                  className="btn-reject"
                  onClick={() => onReject(request.requestId)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {requests.outgoing.length > 0 && (
        <div className="requests-section">
          <h4>Sent Requests</h4>
          {requests.outgoing.map((request) => (
            <motion.div
              key={request.requestId}
              className="request-item outgoing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="request-user">
                {request.avatarUrl ? (
                  <img src={request.avatarUrl} alt={request.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {request.displayName?.[0] || request.username[0]}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">
                    {request.displayName || request.username}
                  </span>
                  <span className="request-status">Pending</span>
                </div>
              </div>
              <motion.button
                className="btn-cancel"
                onClick={() => onCancel(request.requestId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {requests.incoming.length === 0 && requests.outgoing.length === 0 && (
        <div className="requests-empty">
          <UserPlus size={48} />
          <p>No pending requests</p>
        </div>
      )}
    </div>
  );
}

export default FriendList;
