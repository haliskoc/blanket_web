import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Target, Clock, Flame, Calendar, Share2,
  Lock, Globe, Award, TrendingUp, GitBranch,
  UserPlus, MessageCircle, ArrowLeft
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { userProfileService } from '../services/userProfileService.js';
import { friendsService } from '../services/friendsService.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [activityData, setActivityData] = useState([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userProfileService.getPublicProfile(username);
      setProfile(data);

      if (isAuthenticated && user) {
        setIsOwnProfile(user.id === data.id);
        const status = await friendsService.checkFriendshipStatus(data.id);
        setFriendshipStatus(status.status);
      }

      if (data.privacy?.showHistory) {
        const activity = await userProfileService.getUserActivityHistory(data.id, 30);
        setActivityData(formatActivityData(activity));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityData = (activity) => {
    return activity.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      pomodoros: day.pomodoro_count || 0,
      focusTime: Math.floor((day.focus_time || 0) / 60)
    })).reverse();
  };

  const handleAddFriend = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/u/${username}` } });
      return;
    }

    try {
      await friendsService.sendFriendRequest(profile.id);
      setFriendshipStatus('sent');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShare = async () => {
    const url = await userProfileService.getSharedProfileUrl(username);
    if (navigator.share) {
      navigator.share({
        title: `${profile.displayName || profile.username} on Podomodro`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Target size={48} />
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <h2>Profile not found</h2>
        <p>{error}</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  if (!profile.isPublic && !isOwnProfile) {
    return (
      <div className="profile-private">
        <Lock size={64} />
        <h2>This profile is private</h2>
        <p>Only friends can view this profile</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="public-profile-page">
      <motion.div
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>

        <div className="profile-avatar-large">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.username} />
          ) : (
            <div className="avatar-placeholder">
              {profile.displayName?.[0] || profile.username[0]}
            </div>
          )}
        </div>

        <h1 className="profile-name">{profile.displayName || profile.username}</h1>
        <p className="profile-username">@{profile.username}</p>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-actions">
          {!isOwnProfile && (
            <>
              {friendshipStatus === 'none' && (
                <motion.button
                  className="btn-primary"
                  onClick={handleAddFriend}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <UserPlus size={18} />
                  Add Friend
                </motion.button>
              )}
              {friendshipStatus === 'sent' && (
                <button className="btn-secondary" disabled>
                  Request Sent
                </button>
              )}
              {friendshipStatus === 'received' && (
                <button className="btn-primary" disabled>
                  Respond to Request
                </button>
              )}
              {friendshipStatus === 'accepted' && (
                <button className="btn-secondary" disabled>
                  <MessageCircle size={18} />
                  Friends
                </button>
              )}
            </>
          )}

          <motion.button
            className="btn-secondary"
            onClick={handleShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Share2 size={18} />
            Share
          </motion.button>
        </div>
      </motion.div>

      {profile.privacy?.showStats && profile.stats && (
        <motion.div
          className="profile-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2>Statistics</h2>
          <div className="stats-grid">
            <StatCard
              icon={<Target size={24} />}
              label="Total Pomodoros"
              value={profile.stats.total_pomodoros || 0}
              color="#3b82f6"
            />
            <StatCard
              icon={<Clock size={24} />}
              label="Focus Time"
              value={`${Math.floor((profile.stats.total_focus_time || 0) / 60)}h`}
              color="#10b981"
            />
            <StatCard
              icon={<Flame size={24} />}
              label="Current Streak"
              value={`${profile.stats.current_streak || 0} days`}
              color="#f59e0b"
            />
            <StatCard
              icon={<Trophy size={24} />}
              label="Best Streak"
              value={`${profile.stats.longest_streak || 0} days`}
              color="#8b5cf6"
            />
          </div>
        </motion.div>
      )}

      {profile.privacy?.showHistory && activityData.length > 0 && (
        <motion.div
          className="profile-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Activity (Last 30 Days)</h2>
          <div className="activity-chart">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorPomodoros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pomodoros"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorPomodoros)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {profile.privacy?.showAchievements && profile.achievements && (
        <motion.div
          className="profile-achievements"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {profile.achievements.map(achievement => (
              <div key={achievement.id} className="achievement-card">
                <span className="achievement-icon">{achievement.icon || '🏆'}</span>
                <span className="achievement-name">{achievement.name}</span>
                <span className="achievement-date">
                  {new Date(achievement.earned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="profile-joined">
        <Calendar size={14} />
        <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <motion.div
      className="stat-card"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="stat-icon" style={{ color }}>{icon}</div>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </motion.div>
  );
}

export default PublicProfilePage;
