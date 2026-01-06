import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import Calendar from '../common/Calendar';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './AthleteWorkouts.css';

const AthleteWorkouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    if (workouts.length > 0 && selectedDate) {
      const workout = workouts.find(
        w => new Date(w.date).toDateString() === selectedDate.toDateString()
      );
      setSelectedWorkout(workout || null);
    }
  }, [selectedDate, workouts]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/athlete/workouts');
      setWorkouts(response.data);
    } catch (err) {
      setError('Failed to load workouts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutDates = () => {
    return workouts
      .filter(w => w.exercises && w.exercises.length > 0)
      .map(w => new Date(w.date));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUpcomingWorkouts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return workouts
      .filter(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate >= today && w.exercises && w.exercises.length > 0;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 7);
  };

  if (loading) {
    return (
      <div className="athlete-workouts-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading workouts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-workouts-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Workout Schedule</h1>
            <p className="subtitle">View your assigned workouts and upcoming training</p>
          </div>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {viewMode === 'calendar' ? (
          <div className="calendar-view">
            <div className="calendar-section">
              <Card>
                <Calendar
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  highlightedDates={getWorkoutDates()}
                />
              </Card>
            </div>

            <div className="workout-details-section">
              <Card>
                <h2>{formatDate(selectedDate)}</h2>
                {selectedWorkout ? (
                  <div className="workout-details">
                    {selectedWorkout.title && (
                      <h3 className="workout-title">{selectedWorkout.title}</h3>
                    )}

                    <div className="exercises-list">
                      {selectedWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="exercise-item">
                          <div className="exercise-header">
                            <span className="exercise-number">{index + 1}</span>
                            <div className="exercise-info">
                              <span className="exercise-name">{exercise.exerciseName}</span>
                              <span className="exercise-prescription">
                                {exercise.sets} x {exercise.reps}
                                {exercise.percentage && ` @ ${exercise.percentage}%`}
                                {exercise.weight && ` @ ${exercise.weight} lbs`}
                              </span>
                            </div>
                            {exercise.youtubeUrl && (
                              <a
                                href={exercise.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="video-link"
                              >
                                Watch Demo
                              </a>
                            )}
                          </div>
                          {exercise.notes && (
                            <p className="exercise-notes">{exercise.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-workout">
                    <span className="no-workout-icon">😴</span>
                    <p>No workout scheduled for this day</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        ) : (
          <div className="list-view">
            <Card>
              <h2>Upcoming Workouts</h2>
              {getUpcomingWorkouts().length > 0 ? (
                <div className="workouts-list">
                  {getUpcomingWorkouts().map((workout, index) => (
                    <div key={index} className="workout-list-item">
                      <div className="workout-date-badge">
                        <span className="month">
                          {new Date(workout.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="day">
                          {new Date(workout.date).getDate()}
                        </span>
                        <span className="weekday">
                          {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="workout-info">
                        <h4>{workout.title || 'Workout'}</h4>
                        <p className="exercise-count">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </p>
                        <div className="exercise-preview">
                          {workout.exercises.slice(0, 3).map((ex, i) => (
                            <span key={i} className="exercise-tag">
                              {ex.exerciseName}
                            </span>
                          ))}
                          {workout.exercises.length > 3 && (
                            <span className="more-tag">
                              +{workout.exercises.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-workouts">
                  <span className="no-workout-icon">📅</span>
                  <p>No upcoming workouts scheduled</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteWorkouts;
