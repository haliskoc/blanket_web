import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Share2, Copy, Check, Twitter, Facebook, Link2, X
} from 'lucide-react';
import { userProfileService } from '../services/userProfileService.js';

function ShareProfileButton({ username, stats }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${username}`;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? <Check size={18} /> : <Copy size={18} />,
      action: async () => {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    },
    {
      name: 'Twitter',
      icon: <Twitter size={18} />,
      action: () => {
        const text = `Check out my Podomodro profile! ${stats ? `${stats.totalPomodoros} pomodoros completed` : ''}`;
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
          '_blank'
        );
      }
    },
    {
      name: 'Facebook',
      icon: <Facebook size={18} />,
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
          '_blank'
        );
      }
    }
  ];

  return (
    <>
      <motion.button
        className="share-profile-btn"
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 size={18} />
        Share Profile
      </motion.button>

      {showModal && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          />
          <motion.div
            className="modal-content share-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="modal-header">
              <h3>Share Profile</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="share-link">
              <Link2 size={16} />
              <input type="text" value={profileUrl} readOnly />
            </div>

            <div className="share-options">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.name}
                  className="share-option"
                  onClick={option.action}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option.icon}
                  <span>{option.name}</span>
                </motion.button>
              ))}
            </div>

            {stats && (
              <div className="share-preview">
                <h4>Preview</h4>
                <div className="preview-card">
                  <span className="preview-name">@{username}</span>
                  <div className="preview-stats">
                    <span>{stats.totalPomodoros} pomodoros</span>
                    <span>{stats.currentStreak} day streak</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </>
  );
}

export default ShareProfileButton;
