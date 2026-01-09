import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './AthleteDashboard.css';

const AthleteDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completedExercises, setCompletedExercises] = useState([]);
  const [exerciseResults, setExerciseResults] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, dashboardRes] = await Promise.all([
        api.get('/athlete/stats'),
        api.get('/athlete/dashboard')
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
      setTodayWorkout(dashboardRes.data.todayWorkout);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeight = (exercise) => {
    if (exercise.weight) {
      return exercise.weight;
    }
    if (exercise.percentage && stats?.oneRepMaxes) {
      const oneRM = stats.oneRepMaxes[exercise.exerciseId];
      if (oneRM) {
        return Math.round(oneRM * (exercise.percentage / 100));
      }
    }
    return null;
  };

  const handleExerciseComplete = async (exerciseIndex, result) => {
    try {
      await api.post('/athlete/log-exercise', {
        date: new Date().toISOString(),
        exerciseId: todayWorkout.exercises[exerciseIndex].exerciseId,
        exerciseName: todayWorkout.exercises[exerciseIndex].exerciseName,
        setsCompleted: result.sets,
        repsCompleted: result.reps,
        weightUsed: result.weight,
        notes: result.notes
      });

      setCompletedExercises(prev => [...prev, exerciseIndex]);
    } catch (err) {
      console.error('Failed to log exercise:', err);
    }
  };

  const handleResultChange = (exerciseIndex, field, value) => {
    setExerciseResults(prev => ({
      ...prev,
      [exerciseIndex]: {
        ...prev[exerciseIndex],
        [field]: value
      }
    }));
  };

  const formatOneRM = (exerciseName) => {
    if (!stats?.oneRepMaxes) return 'N/A';
    const value = stats.oneRepMaxes[exerciseName];
    return value ? `${value} lbs` : 'N/A';
  };

  if (loading) {
    return (
      <div className="athlete-dashboard">
        <Navbar />
        <div className="dashboard-content">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-dashboard">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.firstName || 'Athlete'}!</h1>
          <p className="subtitle">Track your progress and crush today's workout</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="dashboard-grid">
          {/* Top Half - Stats Section */}
          <section className="stats-section">
            <Card>
              <div className="section-header">
                <h2>Your Stats</h2>
                <Button variant="outline" size="sm" href="/athlete/stats">
                  View All Stats
                </Button>
              </div>

              <div className="stats-grid">
                <div className="stat-card primary">
                  <span className="stat-icon">🏋️</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.workoutsCompleted || 0}</span>
                    <span className="stat-label">Workouts Completed</span>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">📅</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.currentStreak || 0}</span>
                    <span className="stat-label">Day Streak</span>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">💪</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.totalSets || 0}</span>
                    <span className="stat-label">Total Sets</span>
                  </div>
                </div>

                <div className="stat-card">
                  <span className="stat-icon">⚡</span>
                  <div className="stat-info">
                    <span className="stat-value">{stats?.totalVolume || 0}</span>
                    <span className="stat-label">Total Volume (lbs)</span>
                  </div>
                </div>
              </div>

              {stats?.oneRepMaxes && Object.keys(stats.oneRepMaxes).length > 0 && (
                <div className="one-rm-section">
                  <h3>One Rep Maxes</h3>
                  <div className="one-rm-grid">
                    {Object.entries(stats.oneRepMaxes).map(([exercise, value]) => (
                      <div key={exercise} className="one-rm-item">
                        <span className="exercise-name">{exercise}</span>
                        <span className="exercise-value">{value} lbs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* Bottom Half - Today's Workout */}
          <section className="workout-section">
            <Card>
              <div className="section-header">
                <h2>Today's Workout</h2>
                <Button variant="outline" size="sm" href="/athlete/workouts">
                  View Schedule
                </Button>
              </div>

              {!todayWorkout || todayWorkout.exercises?.length === 0 ? (
                <div className="no-workout">
                  <span className="no-workout-icon">😴</span>
                  <h3>Rest Day</h3>
                  <p>No workout scheduled for today. Take it easy and recover!</p>
                </div>
              ) : (
                <div className="workout-content">
                  <div className="exercises-list">
                    {todayWorkout.exercises.map((exercise, index) => {
                      const isCompleted = completedExercises.includes(index);
                      const calculatedWeight = calculateWeight(exercise);
                      const result = exerciseResults[index] || {
                        sets: exercise.sets,
                        reps: exercise.reps,
                        weight: calculatedWeight
                      };

                      return (
                        <div
                          key={index}
                          className={`exercise-item ${isCompleted ? 'completed' : ''}`}
                        >
                          <div className="exercise-header">
                            <span className="exercise-number">{index + 1}</span>
                            <div className="exercise-info">
                              <span className="exercise-name">{exercise.exerciseName}</span>
                              <span className="exercise-prescription">
                                {exercise.sets} x {exercise.reps}
                                {exercise.percentage && ` @ ${exercise.percentage}%`}
                                {calculatedWeight && ` (${calculatedWeight} lbs)`}
                              </span>
                            </div>
                            {exercise.youtubeUrl && (
                              <a
                                href={exercise.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="video-link"
                              >
                                📹 Demo
                              </a>
                            )}
                          </div>

                          {exercise.notes && (
                            <p className="exercise-notes">{exercise.notes}</p>
                          )}

                          {!isCompleted && (
                            <div className="exercise-log">
                              <div className="log-inputs">
                                <div className="log-field">
                                  <label>Sets</label>
                                  <input
                                    type="number"
                                    value={result.sets}
                                    onChange={(e) => handleResultChange(index, 'sets', e.target.value)}
                                    min="0"
                                  />
                                </div>
                                <div className="log-field">
                                  <label>Reps</label>
                                  <input
                                    type="text"
                                    value={result.reps}
                                    onChange={(e) => handleResultChange(index, 'reps', e.target.value)}
                                  />
                                </div>
                                <div className="log-field">
                                  <label>Weight</label>
                                  <input
                                    type="number"
                                    value={result.weight || ''}
                                    onChange={(e) => handleResultChange(index, 'weight', e.target.value)}
                                    placeholder="lbs"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleExerciseComplete(index, result)}
                              >
                                Complete
                              </Button>
                            </div>
                          )}

                          {isCompleted && (
                            <div className="completed-badge">
                              ✓ Completed
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {completedExercises.length === todayWorkout.exercises.length && (
                    <div className="workout-complete">
                      <span className="complete-icon">🎉</span>
                      <h3>Workout Complete!</h3>
                      <p>Great job finishing today's workout!</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AthleteDashboard;
