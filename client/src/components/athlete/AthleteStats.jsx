import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { DEFAULT_EXERCISES, mergeExercises } from '../../constants/defaultExercises';
import './AthleteStats.css';

const AthleteStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [editingMax, setEditingMax] = useState(null); // exercise name being edited
  const [editValue, setEditValue] = useState('');
  const [savingMax, setSavingMax] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, exercisesRes] = await Promise.all([
        api.get('/athlete/stats'),
        api.get('/athlete/exercises').catch(() => ({ data: { customExercises: [] } }))
      ]);

      // Transform maxes array to oneRepMaxes object for compatibility
      const maxesArray = statsRes.data.maxes || [];
      const oneRepMaxes = {};
      maxesArray.forEach(max => {
        if (max.exerciseName && max.oneRepMax) {
          oneRepMaxes[max.exerciseName] = max.oneRepMax;
        }
      });

      setStats({
        ...statsRes.data,
        oneRepMaxes
      });

      // Merge custom exercises with defaults
      const customExercises = exercisesRes.data?.customExercises || [];
      setExercises(mergeExercises(customExercises));
    } catch (err) {
      setError('Failed to load stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get the max value for an exercise
  const getMaxForExercise = (exerciseName) => {
    return stats?.oneRepMaxes?.[exerciseName] || null;
  };

  // Handle selecting an exercise from dropdown
  const handleExerciseSelect = (e) => {
    const exerciseName = e.target.value;
    setSelectedExercise(exerciseName);
    setEditingMax(null);
    setEditValue('');

    if (exerciseName) {
      const currentMax = getMaxForExercise(exerciseName);
      if (!currentMax) {
        // No max exists, start editing immediately
        setEditingMax(exerciseName);
      }
    }
  };

  // Start editing a max
  const handleStartEdit = (exerciseName) => {
    setEditingMax(exerciseName);
    setEditValue(getMaxForExercise(exerciseName) || '');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMax(null);
    setEditValue('');
  };

  // Save a single max
  const handleSaveMax = async (exerciseName) => {
    // Validate input
    if (!editValue || editValue.trim() === '') {
      setError('Please enter a value');
      return;
    }

    const maxValue = parseFloat(editValue);
    if (isNaN(maxValue) || maxValue <= 0) {
      setError('Please enter a valid number');
      return;
    }

    setError(''); // Clear any previous errors
    setSavingMax(true);

    try {
      const response = await api.put('/athlete/stats/max', {
        exerciseName,
        oneRepMax: maxValue
      });

      console.log('Save max response:', response);

      // Update local state
      setStats(prev => ({
        ...prev,
        oneRepMaxes: {
          ...prev.oneRepMaxes,
          [exerciseName]: maxValue
        }
      }));

      setEditingMax(null);
      setEditValue('');
      setSelectedExercise('');
    } catch (err) {
      console.error('Save max error:', err);
      setError(err.response?.data?.message || 'Failed to save max');
    } finally {
      setSavingMax(false);
    }
  };

  // Handle Enter key to save
  const handleKeyDown = (e, exerciseName) => {
    if (e.key === 'Enter') {
      handleSaveMax(exerciseName);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="athlete-stats-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading stats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-stats-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Your Statistics</h1>
            <p className="subtitle">Track your progress and personal records</p>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="stats-content">
          {/* Overview Stats */}
          <Card>
            <h2>Overview</h2>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="overview-icon">🏋️</span>
                <div className="overview-info">
                  <span className="overview-value">{stats?.workoutsCompleted || 0}</span>
                  <span className="overview-label">Total Workouts</span>
                </div>
              </div>

              <div className="overview-item">
                <span className="overview-icon">📅</span>
                <div className="overview-info">
                  <span className="overview-value">{stats?.currentStreak || 0}</span>
                  <span className="overview-label">Current Streak</span>
                </div>
              </div>

              <div className="overview-item">
                <span className="overview-icon">🔥</span>
                <div className="overview-info">
                  <span className="overview-value">{stats?.longestStreak || 0}</span>
                  <span className="overview-label">Longest Streak</span>
                </div>
              </div>

              <div className="overview-item">
                <span className="overview-icon">💪</span>
                <div className="overview-info">
                  <span className="overview-value">{stats?.totalSets || 0}</span>
                  <span className="overview-label">Total Sets</span>
                </div>
              </div>

              <div className="overview-item">
                <span className="overview-icon">⚡</span>
                <div className="overview-info">
                  <span className="overview-value">{(stats?.totalVolume || 0).toLocaleString()}</span>
                  <span className="overview-label">Total Volume (lbs)</span>
                </div>
              </div>

              <div className="overview-item">
                <span className="overview-icon">📊</span>
                <div className="overview-info">
                  <span className="overview-value">{stats?.exercisesLogged || 0}</span>
                  <span className="overview-label">Exercises Logged</span>
                </div>
              </div>
            </div>
          </Card>

          {/* One Rep Maxes */}
          <Card>
            <h2>One Rep Maxes</h2>

            {/* Dropdown on left, Max entry on right */}
            <div className="max-entry-row">
              {/* Exercise Dropdown - Left */}
              <div className="exercise-selector">
                <select
                  value={selectedExercise}
                  onChange={handleExerciseSelect}
                  className="exercise-dropdown"
                >
                  <option value="">Select an exercise...</option>
                  {exercises.map(ex => {
                    const hasMax = getMaxForExercise(ex.name);
                    return (
                      <option key={ex._id} value={ex.name}>
                        {ex.name} {hasMax ? `(${hasMax} lbs)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Max Display/Edit - Right */}
              <div className="max-entry-box">
                {selectedExercise ? (
                  editingMax === selectedExercise ? (
                    // Editing mode - show input
                    <div className="max-edit-inline">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, selectedExercise)}
                        placeholder="Enter 1RM"
                        className="max-input"
                        autoFocus
                      />
                      <span className="max-unit">lbs</span>
                      <button
                        className="save-max-btn"
                        onClick={() => handleSaveMax(selectedExercise)}
                        disabled={savingMax}
                      >
                        {savingMax ? '...' : 'Save'}
                      </button>
                      {getMaxForExercise(selectedExercise) && (
                        <button
                          className="cancel-max-btn"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    // Display mode - show current max with edit button
                    <div className="max-value-display">
                      <span className="max-value">{getMaxForExercise(selectedExercise)} lbs</span>
                      <button
                        className="edit-max-btn"
                        onClick={() => handleStartEdit(selectedExercise)}
                      >
                        Edit
                      </button>
                    </div>
                  )
                ) : (
                  <div className="max-placeholder">
                    <span>Select an exercise to view or enter max</span>
                  </div>
                )}
              </div>
            </div>

            {/* All Recorded Maxes */}
            {stats?.oneRepMaxes && Object.keys(stats.oneRepMaxes).length > 0 && (
              <div className="recorded-maxes">
                <h3>Your Recorded Maxes</h3>
                <div className="maxes-display-grid">
                  {Object.entries(stats.oneRepMaxes).map(([exercise, value]) => (
                    <div
                      key={exercise}
                      className={`max-display-item ${selectedExercise === exercise ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setEditingMax(null);
                      }}
                    >
                      <span className="exercise-name">{exercise}</span>
                      <span className="exercise-max">{value} lbs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!stats?.oneRepMaxes || Object.keys(stats.oneRepMaxes).length === 0) && !selectedExercise && (
              <div className="no-maxes">
                <p>No one rep maxes recorded yet.</p>
                <p className="hint">Select an exercise above to add your first max!</p>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <h2>Recent Activity</h2>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="activity-list">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'workout' ? '🏋️' : '💪'}
                    </div>
                    <div className="activity-info">
                      <span className="activity-title">{activity.title}</span>
                      <span className="activity-details">{activity.details}</span>
                    </div>
                    <span className="activity-date">{formatDate(activity.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activity">
                <p>No recent activity to show.</p>
                <p className="hint">Complete workouts to see your activity here!</p>
              </div>
            )}
          </Card>

          {/* Team Info */}
          {stats?.team && (
            <Card>
              <h2>Team Information</h2>
              <div className="team-info">
                <div className="team-detail">
                  <span className="label">Team Name</span>
                  <span className="value">{stats.team.name}</span>
                </div>
                <div className="team-detail">
                  <span className="label">Coach</span>
                  <span className="value">{stats.team.coachName}</span>
                </div>
                <div className="team-detail">
                  <span className="label">Joined</span>
                  <span className="value">{formatDate(stats.team.joinedAt)}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AthleteStats;
