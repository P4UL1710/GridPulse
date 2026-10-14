import React, { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister, authGetMe, authUpdateBudget } from '../services/api';
import { playChime, toggleAudio, isAudioEnabled } from '../services/audio';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('gp_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('gp_theme') || 'light');
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [currentPortal, setCurrentPortal] = useState('customer'); // 'customer' or 'admin'
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gp_theme', theme);
  }, [theme]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const login = async (email, password) => {
    try {
      const user = await authLogin(email, password);
      setCurrentUser(user);
      localStorage.setItem('gp_user', JSON.stringify(user));
      if (user.role === 'admin') {
        setCurrentPortal('admin');
      } else {
        setCurrentPortal('customer');
      }
      playChime('good');
      showToast(`Welcome back, ${user.name}!`);
      return user;
    } catch (err) {
      playChime('warn');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const user = await authRegister(userData);
      setCurrentUser(user);
      localStorage.setItem('gp_user', JSON.stringify(user));
      setCurrentPortal('customer');
      playChime('good');
      showToast(`Account registered successfully for ${user.name}!`);
      return user;
    } catch (err) {
      playChime('warn');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('gp_user');
    setCurrentUser(null);
    setCurrentPortal('customer');
    showToast('Signed out successfully.');
  };

  const updateBudget = async (low, high) => {
    try {
      await authUpdateBudget(low, high);
      const updated = { ...currentUser, budget_low: low, budget_high: high };
      setCurrentUser(updated);
      localStorage.setItem('gp_user', JSON.stringify(updated));
      playChime('good');
      showToast('Monthly energy budget updated.');
    } catch (err) {
      showToast('⚠️ Failed to update budget.');
    }
  };

  const toggleThemeMode = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSound = () => {
    const newState = toggleAudio();
    setAudioOn(newState);
    showToast(newState ? '🔔 Audio alerts enabled' : '🔕 Audio alerts muted');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentPortal,
        setCurrentPortal,
        theme,
        toggleThemeMode,
        audioOn,
        toggleSound,
        toastMessage,
        showToast,
        login,
        register,
        logout,
        updateBudget
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
