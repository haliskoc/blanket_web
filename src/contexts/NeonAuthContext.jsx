import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { neonClient } from '../lib/neonClient';

const NeonAuthContext = createContext(null);

export const NeonAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      neonClient.setToken(token);
      loadUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const data = await neonClient.getMe();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to load user:', error);
      neonClient.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      const data = await neonClient.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, username, displayName) => {
    try {
      setIsLoading(true);
      const data = await neonClient.register(email, password, username, displayName);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    neonClient.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await neonClient.getMe();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [isAuthenticated]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    client: neonClient,
  };

  return (
    <NeonAuthContext.Provider value={value}>
      {children}
    </NeonAuthContext.Provider>
  );
};

export const useNeonAuth = () => {
  const context = useContext(NeonAuthContext);
  if (!context) {
    throw new Error('useNeonAuth must be used within a NeonAuthProvider');
  }
  return context;
};

export default NeonAuthContext;
