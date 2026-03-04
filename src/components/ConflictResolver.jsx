import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, ArrowLeft, ArrowRight, Check, X, Cloud } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import './ConflictResolver.css';

export default function ConflictResolver() {
  const { conflicts, resolveConflict, SYNC_STATUS, syncStatus } = useSync();

  if (!conflicts || conflicts.length === 0) return null;

  const getConflictPreview = (conflict) => {
    switch (conflict.type) {
      case 'task':
        return {
          title: `Task: ${conflict.local.text || conflict.remote.text || 'Untitled'}`,
          local: `Updated: ${new Date(conflict.local.updated_at || conflict.local.created_at).toLocaleString()}`,
          remote: `Updated: ${new Date(conflict.remote.updated_at).toLocaleString()}`,
        };
      default:
        return {
          title: 'Unknown Conflict',
          local: 'Local version',
          remote: 'Cloud version',
        };
    }
  };

  return (
    <motion.div 
      className="conflict-resolver"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="conflict-header">
        <GitMerge size={20} />
        <div className="conflict-title">
          <h3>Sync Conflicts Detected</h3>
          <p>{conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} need resolution</p>
        </div>
      </div>

      <div className="conflict-list">
        {conflicts.map((conflict) => {
          const preview = getConflictPreview(conflict);
          
          return (
            <motion.div 
              key={conflict.id}
              className="conflict-item"
              layout
            >
              <div className="conflict-info">
                <span className="conflict-type">{conflict.type}</span>
                <span className="conflict-name">{preview.title}</span>
              </div>

              <div className="conflict-versions">
                <div className="version local">
                  <div className="version-header">
                    <ArrowLeft size={14} />
                    <span>Local</span>
                  </div>
                  <span className="version-time">{preview.local}</span>
                </div>

                <div className="version-divider">VS</div>

                <div className="version remote">
                  <div className="version-header">
                    <Cloud size={14} />
                    <span>Cloud</span>
                  </div>
                  <span className="version-time">{preview.remote}</span>
                </div>
              </div>

              <div className="conflict-actions">
                <button 
                  className="resolve-btn keep-local"
                  onClick={() => resolveConflict(conflict.id, 'local')}
                  title="Keep local version"
                >
                  <Check size={16} />
                  Keep Local
                </button>
                <button 
                  className="resolve-btn keep-remote"
                  onClick={() => resolveConflict(conflict.id, 'remote')}
                  title="Use cloud version"
                >
                  <ArrowRight size={16} />
                  Use Cloud
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="conflict-footer">
        <p>
          <strong>Note:</strong> By default, the most recent version wins. 
          Only intervene if you want to keep a specific version.
        </p>
      </div>
    </motion.div>
  );
}


