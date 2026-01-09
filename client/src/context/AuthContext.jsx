import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setProfile(response.data.profile);
        } catch (err) {
          localStorage.removeItem('token');
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      // Clear any existing session before logging in
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);

      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);

      // Fetch full profile
      const profileResponse = await api.get('/auth/me');
      setProfile(profileResponse.data.profile);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const registerCoach = async (data) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/coach', data);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);

      // Fetch full profile
      const profileResponse = await api.get('/auth/me');
      setProfile(profileResponse.data.profile);

      return { success: true, user: userData, team: response.data.team };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const registerAthlete = async (data) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/athlete', data);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);

      // Fetch full profile
      const profileResponse = await api.get('/auth/me');
      setProfile(profileResponse.data.profile);

      return { success: true, user: userData, team: response.data.team };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const registerTrainer = async (data) => {
    try {
      setError(null);
      const response = await api.post('/auth/register/trainer', data);
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);

      // Fetch full profile
      const profileResponse = await api.get('/auth/me');
      setProfile(profileResponse.data.profile);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Continue with logout even if request fails
    }
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setProfile(response.data.profile);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, []);

  const clearError = () => setError(null);

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    logout,
    registerCoach,
    registerAthlete,
    registerTrainer,
    refreshProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
