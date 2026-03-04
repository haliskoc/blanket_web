import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Globe, Clock, Flame, Target,
  ChevronDown, Medal, Crown, Star, TrendingUp,
  Calendar, Award, Filter, Share2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { leaderboardService } from '../services/leaderboardService.js';
import { friendsService } from '../services/friendsService.js';
import { userProfileService } from '../services/userProfileService.js';

const PERIODS = [
  { id: 'weekly', label: 'Weekly', icon: <Calendar size={16} /> },
  { id: 'monthly', label: 'Monthly', icon: <Calendar size={16} /> },
  { id: 'allTime', label: 'All Time', icon: <Trophy size={16} /> }
];

const CATEGORIES = [
  { id: 'pomodoros', label: 'Pomodoros', icon: <Target size={16} /> },
  { id: 'focusTime', label: 'Focus Time', icon: <Clock size={16} /> },
  { id: 'streak', label: 'Streak', icon: <Flame size={16} /> }
];

const BADGES = [
  { rank: 1, icon: '👑', color: '#FFD700', bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
  { rank: 2, icon: '🥈', color: '#C0C0C0', bg: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 100%)' },
  { rank: 3, icon: '🥉', color: '#CD7F32', bg: 'linear-gradient(135deg, #E6A15C 0%, #CD7F32 100%)' }
];

function LeaderboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState('weekly');
  const [category, setCategory] = useState('pomodoros');
  const [scope, setScope] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (scope === 'friends' && isAuthenticated) {
        data = await leaderboardService.getFriendsLeaderboard(period, category, 50);
      } else {
        data = await leaderboardService.getGlobalLeaderboard(period, category, 50);
      }
      setLeaderboard(data);

      if (isAuthenticated && user) {
        const rank = await leaderboardService.getUserRank(user.id, period, category);
        setUserRank(rank);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period, category, scope, isAuthenticated, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formatValue = (value, category) => {
    switch (category) {
      case 'focusTime':
        return `${Math.floor(value / 60)}h ${value % 60}m`;
      case 'pomodoros':
        return value.toLocaleString();
      case 'streak':
        return `${value} days`;
      default:
        return value;
    }
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const badge = BADGES[rank - 1];
      return (
        <div className="rank-badge" style={{ background: badge.bg }}>
          <span className="rank-icon">{badge.icon}</span>
        </div>
      );
    }
    return <span className="rank-number">{rank}</span>;
  };

  return (
    <div className="leaderboard-page">
      <motion.div
        className="leaderboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-content">
          <div className="header-title">
            <Trophy size={32} className="header-icon" />
            <div>
              <h1>Leaderboard</h1>
              <p>Compete with others and climb the ranks</p>
            </div>
          </div>

          {isAuthenticated && userRank && (
            <motion.div
              className="user-rank-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="rank-info">
                <span className="rank-label">Your Rank</span>
                <span className="rank-value">
                  {userRank.rank ? `#${userRank.rank}` : 'Unranked'}
                </span>
              </div>
              <div className="rank-divider" />
              <div className="rank-info">
                <span className="rank-label">Total Users</span>
                <span className="rank-value">{userRank.totalUsers?.toLocaleString() || 0}</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="filters-section">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${scope === 'global' ? 'active' : ''}`}
              onClick={() => setScope('global')}
            >
              <Globe size={16} />
              Global
            </button>
            {isAuthenticated && (
              <button
                className={`filter-tab ${scope === 'friends' ? 'active' : ''}`}
                onClick={() => setScope('friends')}
              >
                <Users size={16} />
                Friends
              </button>
            )}
          </div>

          <button
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className={showFilters ? 'rotate' : ''} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filter-dropdown"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="filter-group">
                <label>Period</label>
                <div className="filter-options">
                  {PERIODS.map(p => (
                    <button
                      key={p.id}
                      className={`filter-option ${period === p.id ? 'active' : ''}`}
                      onClick={() => setPeriod(p.id)}
                    >
                      {p.icon}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <div className="filter-options">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      className={`filter-option ${category === c.id ? 'active' : ''}`}
                      onClick={() => setCategory(c.id)}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="leaderboard-content">
        {loading ? (
          <div className="leaderboard-loading">
            <motion.div
              className="loading-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={32} />
            </motion.div>
            <p>Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="leaderboard-error">
            <p>{error}</p>
            <button onClick={fetchLeaderboard}>Try Again</button>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <motion.div
                className="podium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {[
                  { rank: 2, data: leaderboard[1], height: 140 },
                  { rank: 1, data: leaderboard[0], height: 180 },
                  { rank: 3, data: leaderboard[2], height: 120 }
                ].map(({ rank, data, height }) => (
                  <motion.div
                    key={rank}
                    className={`podium-item rank-${rank}`}
                    style={{ height }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: rank * 0.1 }}
                  >
                    <div className="podium-avatar">
                      {data.avatarUrl ? (
                        <img src={data.avatarUrl} alt={data.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {data.displayName?.[0] || data.username[0]}
                        </div>
                      )}
                      <span className="podium-rank">{BADGES[rank - 1].icon}</span>
                    </div>
                    <span className="podium-name">
                      {data.displayName || data.username}
                    </span>
                    <span className="podium-value">
                      {formatValue(data.value, category)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Full List */}
            <motion.div
              className="leaderboard-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  className={`leaderboard-item ${entry.isCurrentUser ? 'current-user' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="item-rank">
                    {getRankBadge(entry.rank)}
                  </div>

                  <div className="item-user">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.username} className="user-avatar" />
                    ) : (
                      <div className="user-avatar placeholder">
                        {entry.displayName?.[0] || entry.username[0]}
                      </div>
                    )}
                    <div className="user-info">
                      <span className="user-name">
                        {entry.displayName || entry.username}
                        {entry.isCurrentUser && <span className="you-badge">You</span>}
                      </span>
                      <span className="user-username">@{entry.username}</span>
                    </div>
                  </div>

                  <div className="item-stats">
                    <div className="stat-item">
                      <Target size={14} />
                      <span>{entry.totalPomodoros?.toLocaleString() || 0}</span>
                    </div>
                    <div className="stat-item">
                      <Flame size={14} />
                      <span>{entry.currentStreak || 0}</span>
                    </div>
                  </div>

                  <div className="item-value">
                    {formatValue(entry.value, category)}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {leaderboard.length === 0 && (
              <div className="empty-state">
                <Trophy size={48} className="empty-icon" />
                <h3>No data yet</h3>
                <p>Start focusing to appear on the leaderboard!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPage;
