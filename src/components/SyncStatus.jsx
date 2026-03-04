import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, CloudOff, Check, RefreshCw, AlertCircle, 
  WifiOff, Clock, ArrowUp, ArrowDown 
} from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import './SyncStatus.css';

export default function SyncStatus() {
  const { 
    syncStatus, 
    lastSyncedAt, 
    isCloudEnabled, 
    pendingChanges, 
    isOnline,
    SYNC_STATUS,
    forceSync 
  } = useSync();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return <RefreshCw size={14} className="spinning" />;
      case SYNC_STATUS.SYNCED:
        return <Check size={14} />;
      case SYNC_STATUS.ERROR:
        return <AlertCircle size={14} />;
      case SYNC_STATUS.OFFLINE:
        return <WifiOff size={14} />;
      case SYNC_STATUS.CONFLICT:
        return <AlertCircle size={14} />;
      default:
        return isCloudEnabled ? <Cloud size={14} /> : <CloudOff size={14} />;
    }
  };

  const getStatusText = () => {
    if (!isCloudEnabled) return 'Local only';
    if (!isOnline) return 'Offline';
    
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return 'Syncing...';
      case SYNC_STATUS.SYNCED:
        return 'Synced';
      case SYNC_STATUS.ERROR:
        return 'Sync error';
      case SYNC_STATUS.OFFLINE:
        return 'Offline';
      case SYNC_STATUS.CONFLICT:
        return 'Conflict detected';
      default:
        return 'Ready to sync';
    }
  };

  const getStatusClass = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return 'syncing';
      case SYNC_STATUS.SYNCED:
        return 'synced';
      case SYNC_STATUS.ERROR:
      case SYNC_STATUS.CONFLICT:
        return 'error';
      case SYNC_STATUS.OFFLINE:
        return 'offline';
      default:
        return isCloudEnabled ? 'idle' : 'disabled';
    }
  };

  const formatLastSync = () => {
    if (!lastSyncedAt) return 'Never synced';
    
    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const canSync = isCloudEnabled && isOnline && syncStatus !== SYNC_STATUS.SYNCING;

  return (
    <div className={`sync-status ${getStatusClass()}`}>
      <AnimatePresence mode="wait">
        <motion.button
          key={syncStatus}
          className="sync-indicator"
          onClick={canSync ? forceSync : undefined}
          disabled={!canSync}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          whileHover={canSync ? { scale: 1.05 } : undefined}
          whileTap={canSync ? { scale: 0.95 } : undefined}
          title={canSync ? 'Click to sync now' : getStatusText()}
        >
          {getStatusIcon()}
          <span className="sync-text">{getStatusText()}</span>
          
          {pendingChanges > 0 && (
            <span className="pending-badge">
              {pendingChanges}
            </span>
          )}
        </motion.button>
      </AnimatePresence>

      {lastSyncedAt && (
        <span className="last-sync">
          <Clock size={12} />
          {formatLastSync()}
        </span>
      )}
    </div>
  );
}

export function SyncStatusCompact() {
  const { syncStatus, isCloudEnabled, SYNC_STATUS } = useSync();

  if (!isCloudEnabled) return null;

  const getIcon = () => {
    switch (syncStatus) {
      case SYNC_STATUS.SYNCING:
        return <RefreshCw size={16} className="spinning" />;
      case SYNC_STATUS.SYNCED:
        return <Check size={16} className="success" />;
      case SYNC_STATUS.ERROR:
      case SYNC_STATUS.CONFLICT:
        return <AlertCircle size={16} className="error" />;
      case SYNC_STATUS.OFFLINE:
        return <WifiOff size={16} className="offline" />;
      default:
        return <Cloud size={16} />;
    }
  };

  return (
    <div className={`sync-status-compact ${syncStatus}`}>
      {getIcon()}
    </div>
  );
}
