import { useState, useCallback } from 'react';
import api from '../services/api';

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkouts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/workouts?${queryString}` : '/workouts';
      const response = await api.get(endpoint);
      setWorkouts(response.data.workouts);
      return response.data.workouts;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch workouts');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/workouts/${id}`);
      setCurrentWorkout(response.data.workout);
      return response.data.workout;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch workout');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkout = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/workouts', data);
      setWorkouts(prev => [...prev, response.data.workout]);
      return { success: true, workout: response.data.workout };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create workout';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkout = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/workouts/${id}`, data);
      setWorkouts(prev => prev.map(w => w._id === id ? response.data.workout : w));
      setCurrentWorkout(response.data.workout);
      return { success: true, workout: response.data.workout };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update workout';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWorkout = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(prev => prev.filter(w => w._id !== id));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete workout';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addWorkoutDay = useCallback(async (workoutId, dayData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/workouts/${workoutId}/days`, dayData);
      setCurrentWorkout(response.data.workout);
      return { success: true, workout: response.data.workout };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add workout day';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const assignToTeam = useCallback(async (workoutId, teamId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/workouts/${workoutId}/assign/${teamId}`);
      return { success: true, workout: response.data.workout };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to assign workout to team';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    workouts,
    currentWorkout,
    loading,
    error,
    fetchWorkouts,
    fetchWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    addWorkoutDay,
    assignToTeam,
    clearError
  };
};
