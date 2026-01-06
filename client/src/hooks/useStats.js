import { useState, useCallback } from 'react';
import api from '../services/api';

export const useStats = () => {
  const [stats, setStats] = useState([]);
  const [maxes, setMaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For coaches - get team stats
  const fetchTeamStats = useCallback(async (teamId, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(options).toString();
      const endpoint = queryString
        ? `/stats/team/${teamId}?${queryString}`
        : `/stats/team/${teamId}`;
      const response = await api.get(endpoint);
      setStats(response.data.stats);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch team stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // For athletes - get personal stats
  const fetchAthleteStats = useCallback(async (athleteId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/stats/athlete/${athleteId}`);
      setStats(response.data.recentStats || []);
      setMaxes(response.data.maxes || []);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch athlete stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // For athletes - log a new stat
  const logStat = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/stats/log', data);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to log stat';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get exercise leaderboard
  const fetchExerciseLeaderboard = useCallback(async (teamId, exerciseId, exerciseName) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (exerciseId) params.append('exerciseId', exerciseId);
      if (exerciseName) params.append('exerciseName', exerciseName);

      const response = await api.get(`/stats/exercises/${teamId}?${params}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leaderboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available exercises for filtering
  const fetchAvailableExercises = useCallback(async (teamId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/stats/available-exercises/${teamId}`);
      return response.data.exercises;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exercises');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    stats,
    maxes,
    loading,
    error,
    fetchTeamStats,
    fetchAthleteStats,
    logStat,
    fetchExerciseLeaderboard,
    fetchAvailableExercises,
    clearError
  };
};
