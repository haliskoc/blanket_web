import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, RefreshCw, WifiOff, Check } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

// PWA Install Prompt Component
export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check if user has previously dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : null;
    const now = Date.now();
    
    // Show again after 7 days if dismissed
    const shouldShow = !dismissedTime || (now - dismissedTime > 7 * 24 * 60 * 60 * 1000);
    
    if (isInstallable && shouldShow && !isInstalled) {
      // Delay showing the prompt for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    const result = await promptInstall();
    setIsInstalling(false);
    
    if (result.success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
    dismissInstall();
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="pwa-install-prompt"
      >
        <div className="pwa-prompt-content">
          <div className="pwa-prompt-icon">
            <img src="/icon-192.svg" alt="Podomodro" width="48" height="48" />
          </div>
          <div className="pwa-prompt-text">
            <h3>Add Podomodro to Home Screen</h3>
            <p>Install for quick access and offline use</p>
          </div>
          <div className="pwa-prompt-actions">
            <button 
              className="pwa-prompt-btn install"
              onClick={handleInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <RefreshCw size={18} className="spin" />
              ) : (
                <>
                  <Download size={18} />
                  Install
                </>
              )}
            </button>
            <button 
              className="pwa-prompt-btn dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// PWA Update Prompt Component
export function PWAUpdatePrompt() {
  const { updateAvailable, updateApp, dismissUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="pwa-update-banner"
    >
      <div className="pwa-update-content">
        <RefreshCw size={20} className="pwa-update-icon" />
        <span>A new version is available!</span>
        <button className="pwa-update-btn" onClick={updateApp}>
          <Check size={16} />
          Update Now
        </button>
        <button 
          className="pwa-update-dismiss"
          onClick={dismissUpdate}
          aria-label="Dismiss update"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

// Offline Indicator Component
export function OfflineIndicator() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="offline-indicator"
    >
      <WifiOff size={16} />
      <span>You're offline</span>
    </motion.div>
  );
}

// PWA Status Badge Component (for settings page)
export function PWAStatusBadge() {
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  if (isInstalled) {
    return (
      <div className="pwa-status-badge installed">
        <Check size={14} />
        <span>Installed</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button 
        className="pwa-status-badge installable"
        onClick={promptInstall}
      >
        <Download size={14} />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <div className="pwa-status-badge unsupported">
      <span>Web Version</span>
    </div>
  );
}

// Combined PWA Manager (can be added to App)
export function PWAManager() {
  return (
    <>
      <OfflineIndicator />
      <PWAUpdatePrompt />
      <PWAInstallPrompt />
    </>
  );
}

export default PWAInstallPrompt;
