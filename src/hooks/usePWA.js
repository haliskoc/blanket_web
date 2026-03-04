import { useEffect, useState, useCallback } from 'react';

// PWA Installation Prompt Hook
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check if app is installed
  useEffect(() => {
    const checkInstalled = () => {
      // Check if running as standalone PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://');
      
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('Podomodro was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle service worker registration and updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setServiceWorkerRegistration(registration);

        // Listen for new service worker installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show update prompt
                setUpdateAvailable(true);
              }
            });
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
          window.location.reload();
        }
      });
    }
  }, []);

  // Prompt user to install PWA
  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      return { success: false, error: 'Install prompt not available' };
    }

    try {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        return { success: true };
      } else {
        return { success: false, error: 'User dismissed the install prompt' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [installPrompt]);

  // Dismiss install prompt (don't show again this session)
  const dismissInstall = useCallback(() => {
    setIsInstallable(false);
  }, []);

  // Update the app (skip waiting and reload)
  const updateApp = useCallback(() => {
    if (serviceWorkerRegistration && serviceWorkerRegistration.waiting) {
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
  }, [serviceWorkerRegistration]);

  // Dismiss update notification
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  // Check for updates manually
  const checkForUpdates = useCallback(async () => {
    if (serviceWorkerRegistration) {
      try {
        await serviceWorkerRegistration.update();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Service worker not registered' };
  }, [serviceWorkerRegistration]);

  return {
    // Installation
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall,
    
    // Offline status
    isOffline,
    
    // Updates
    updateAvailable,
    updateApp,
    dismissUpdate,
    checkForUpdates,
    
    // Service Worker
    serviceWorkerRegistration
  };
}

// Hook to manage app visibility (background/foreground)
export function useAppVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

// Hook to handle push notifications (if needed in future)
export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return { success: false, error: 'Notifications not supported' };
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return { success: result === 'granted', permission: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, error: 'Push notifications not supported' };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return { success: true, subscription: existingSubscription };
      }

      // Note: You'll need to provide your VAPID public key
      // const newSubscription = await registration.pushManager.subscribe({
      //   userVisibleOnly: true,
      //   applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
      // });
      // setSubscription(newSubscription);
      
      return { success: false, error: 'Push subscription requires VAPID key setup' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush
  };
}

export default usePWA;
