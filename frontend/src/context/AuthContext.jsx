import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('progressiq_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to load user info', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('progressiq_token', newToken);
    localStorage.setItem('progressiq_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('progressiq_token', newToken);
    localStorage.setItem('progressiq_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('progressiq_token');
    localStorage.removeItem('progressiq_user');
    setToken(null);
    setUser(null);
  };

  const seedDemo = async () => {
    const res = await api.post('/auth/seed');
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        seedDemo,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
