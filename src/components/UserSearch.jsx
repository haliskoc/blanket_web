import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, UserPlus, Check, Clock, User
} from 'lucide-react';
import { friendsService } from '../services/friendsService.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function UserSearch({ isOpen, onClose }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState({});

  const searchUsers = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || !isAuthenticated) return;

    setLoading(true);
    try {
      const users = await friendsService.searchUsers(searchQuery);
      setResults(users);

      const statuses = {};
      for (const user of users) {
        const status = await friendsService.checkFriendshipStatus(user.id);
        statuses[user.id] = status;
      }
      setFriendshipStatuses(statuses);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query) searchUsers(query);
      else setResults([]);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchUsers]);

  const handleSendRequest = async (userId) => {
    try {
      await friendsService.sendFriendRequest(userId);
      setFriendshipStatuses(prev => ({
        ...prev,
        [userId]: { status: 'sent', friendshipId: null }
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const getActionButton = (user) => {
    const status = friendshipStatuses[user.id];

    if (!status || status.status === 'none') {
      return (
        <motion.button
          className="btn-add"
          onClick={() => handleSendRequest(user.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <UserPlus size={16} />
          Add
        </motion.button>
      );
    }

    switch (status.status) {
      case 'accepted':
        return (
          <button className="btn-status friends" disabled>
            <Check size={14} />
            Friends
          </button>
        );
      case 'sent':
        return (
          <button className="btn-status pending" disabled>
            <Clock size={14} />
            Sent
          </button>
        );
      case 'received':
        return (
          <button className="btn-status respond" disabled>
            <UserPlus size={14} />
            Respond
          </button>
        );
      default:
        return (
          <motion.button
            className="btn-add"
            onClick={() => handleSendRequest(user.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus size={16} />
            Add
          </motion.button>
        );
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
            className="modal-content user-search-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="modal-header">
              <h2>Find Friends</h2>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by username or display name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button className="clear-btn" onClick={() => setQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="search-results">
              {loading ? (
                <div className="search-loading">
                  <div className="spinner" />
                  <p>Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="results-list">
                  {results.map((user, index) => (
                    <motion.div
                      key={user.id}
                      className="result-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className="user-avatar"
                        onClick={() => navigate(`/u/${user.username}`)}
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.display_name?.[0] || user.username[0]}
                          </div>
                        )}
                      </div>

                      <div
                        className="user-info"
                        onClick={() => navigate(`/u/${user.username}`)}
                      >
                        <span className="user-name">
                          {user.display_name || user.username}
                        </span>
                        <span className="user-username">@{user.username}</span>
                      </div>

                      {getActionButton(user)}
                    </motion.div>
                  ))}
                </div>
              ) : query ? (
                <div className="no-results">
                  <User size={48} />
                  <p>No users found</p>
                  <span>Try a different search term</span>
                </div>
              ) : (
                <div className="search-hint">
                  <Search size={48} />
                  <p>Search for users</p>
                  <span>Type a username to find friends</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UserSearch;
