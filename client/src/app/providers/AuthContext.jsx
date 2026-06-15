import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/api';
import { getStoredToken, storeToken, clearStoredToken } from '@/lib/storage/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(getStoredToken()));
  const navigate = useNavigate();

  // Restore session from stored token on mount
  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) { setIsRestoringSession(false); return; }
    apiRequest('/auth/me', { token: storedToken })
      .then((data) => setUser(data.user))
      .catch(() => {
        clearStoredToken();
        setTokenState(null);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  const isAuthed = Boolean(token && user);
  const isAdmin = Boolean(user?.isAdmin);

  function setToken(newToken) {
    storeToken(newToken);
    setTokenState(newToken);
  }

  function login(data) {
    storeToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }

  const logout = useCallback(() => {
    clearStoredToken();
    setTokenState(null);
    setUser(null);
    navigate('/');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    try {
      const data = await apiRequest('/auth/me', { token });
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, setUser,
      token, setToken,
      isAuthed, isAdmin, isRestoringSession,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
