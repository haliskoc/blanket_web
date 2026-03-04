import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, CloudOff, Download, Upload, Trash2, 
  AlertTriangle, Check, X, ChevronDown, ChevronUp,
  User, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import './CloudBackupSettings.css';

export default function CloudBackupSettings() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { 
    isCloudEnabled, 
    setIsCloudEnabled, 
    lastSyncedAt,
    syncStatus,
    forceSync,
    clearCloudData,
    exportCloudData,
    SYNC_STATUS
  } = useSync();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggleCloud = async () => {
    if (isCloudEnabled) {
      // Disabling cloud
      setIsCloudEnabled(false);
      setMessage('Cloud sync disabled. Your data remains local.');
    } else {
      // Enabling cloud
      if (!isAuthenticated) {
        setMessage('Please sign in to enable cloud sync');
        return;
      }
      setIsCloudEnabled(true);
      setMessage('Cloud sync enabled');
      await forceSync();
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportCloudData();
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `podomodro-cloud-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('Cloud data exported successfully');
      }
    } catch (err) {
      setMessage('Failed to export cloud data');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleClearCloud = async () => {
    setLoading(true);
    try {
      await clearCloudData();
      setMessage('Cloud data cleared successfully');
      setShowConfirmClear(false);
    } catch (err) {
      setMessage('Failed to clear cloud data');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="cloud-settings">
      <button 
        className="settings-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="toggle-header">
          <Cloud size={20} />
          <span>Cloud Sync</span>
          {isCloudEnabled ? (
            <span className="status-badge enabled">Enabled</span>
          ) : (
            <span className="status-badge disabled">Disabled</span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="settings-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {message && (
              <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            {/* Cloud Toggle */}
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Enable Cloud Sync</span>
                <span className="setting-desc">
                  Sync your data across all your devices
                </span>
              </div>
              <button 
                className={`toggle-switch ${isCloudEnabled ? 'active' : ''}`}
                onClick={handleToggleCloud}
                disabled={!isAuthenticated}
              >
                <div className="toggle-knob" />
              </button>
            </div>

            {!isAuthenticated && (
              <div className="auth-prompt">
                <AlertTriangle size={16} />
                <span>Sign in to use cloud sync</span>
              </div>
            )}

            {isAuthenticated && (
              <>
                {/* User Info */}
                <div className="user-info">
                  <div className="user-avatar">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="user-details">
                    <span className="user-name">
                      {user.user_metadata?.full_name || user.email}
                    </span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <button 
                    className="icon-btn logout-btn"
                    onClick={signOut}
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>

                {/* Last Sync */}
                <div className="sync-info">
                  <div className="info-row">
                    <span>Last synced</span>
                    <span className="info-value">{formatDate(lastSyncedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span>Status</span>
                    <span className={`info-value status-${syncStatus}`}>
                      {syncStatus}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="cloud-actions">
                  <button 
                    className="action-btn"
                    onClick={forceSync}
                    disabled={syncStatus === SYNC_STATUS.SYNCING || !isCloudEnabled}
                  >
                    <Upload size={16} />
                    Sync Now
                  </button>

                  <button 
                    className="action-btn secondary"
                    onClick={handleExport}
                    disabled={loading}
                  >
                    <Download size={16} />
                    Export Cloud Data
                  </button>

                  <button 
                    className="action-btn danger"
                    onClick={() => setShowConfirmClear(true)}
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    Clear Cloud Data
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Clear Dialog */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmClear(false)}
          >
            <motion.div
              className="confirm-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="confirm-icon">
                <AlertTriangle size={32} />
              </div>
              <h3>Clear Cloud Data?</h3>
              <p>
                This will delete all your data from the cloud. 
                Your local data will remain unchanged.
              </p>
              <div className="confirm-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm"
                  onClick={handleClearCloud}
                  disabled={loading}
                >
                  {loading ? 'Clearing...' : 'Clear Cloud Data'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
