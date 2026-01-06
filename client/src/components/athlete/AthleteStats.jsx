import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './AthleteStats.css';

const AthleteStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMaxes, setEditingMaxes] = useState(false);
  const [newMaxes, setNewMaxes] = useState({});
  const [savingMaxes, setSavingMaxes] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/athlete/stats');
      setStats(response.data);
      setNewMaxes(response.data.oneRepMaxes || {});
    } catch (err) {
      setError('Failed to load stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMaxChange = (exercise, value) => {
    setNewMaxes(prev => ({
      ...prev,
      [exercise]: value ? parseFloat(value) : ''
    }));
  };

  const handleAddExercise = () => {
    const exerciseName = prompt('Enter exercise name:');
    if (exerciseName && exerciseName.trim()) {
      setNewMaxes(prev => ({
        ...prev,
        [exerciseName.trim()]: ''
      }));
    }
  };

  const handleSaveMaxes = async () => {
    try {
      setSavingMaxes(true);
      const cleanedMaxes = {};
      Object.entries(newMaxes).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          cleanedMaxes[key] = parseFloat(value);
        }
      });

      await api.put('/athlete/stats', { oneRepMaxes: cleanedMaxes });
      setStats(prev => ({ ...prev, oneRepMaxes: cleanedMaxes }));
      setEditingMaxes(false);
    } catch (err) {
      setError('Failed to save maxes');
      console.error(err);
    } finally {
      setSavingMaxes(false);
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
            <div className="card-header-with-action">
              <h2>One Rep Maxes</h2>
              {!editingMaxes ? (
                <Button variant="outline" size="sm" onClick={() => setEditingMaxes(true)}>
                  Edit Maxes
                </Button>
              ) : (
                <div className="edit-actions">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingMaxes(false);
                    setNewMaxes(stats?.oneRepMaxes || {});
                  }}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveMaxes}
                    disabled={savingMaxes}
                  >
                    {savingMaxes ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {editingMaxes ? (
              <div className="maxes-edit-grid">
                {Object.entries(newMaxes).map(([exercise, value]) => (
                  <div key={exercise} className="max-edit-item">
                    <Input
                      label={exercise}
                      type="number"
                      value={value}
                      onChange={(e) => handleMaxChange(exercise, e.target.value)}
                      placeholder="Enter weight"
                      hint="lbs"
                    />
                  </div>
                ))}
                <button className="add-exercise-btn" onClick={handleAddExercise}>
                  + Add Exercise
                </button>
              </div>
            ) : (
              <div className="maxes-display-grid">
                {stats?.oneRepMaxes && Object.keys(stats.oneRepMaxes).length > 0 ? (
                  Object.entries(stats.oneRepMaxes).map(([exercise, value]) => (
                    <div key={exercise} className="max-display-item">
                      <span className="exercise-name">{exercise}</span>
                      <span className="exercise-max">{value} lbs</span>
                    </div>
                  ))
                ) : (
                  <div className="no-maxes">
                    <p>No one rep maxes recorded yet.</p>
                    <Button variant="outline" onClick={() => setEditingMaxes(true)}>
                      Add Your Maxes
                    </Button>
                  </div>
                )}
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
