import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Calendar from '../common/Calendar';
import WorkoutDayViewer from '../common/WorkoutDayViewer';
import api from '../../services/api';
import './AthleteWorkouts.css';

const AthleteWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Day viewer modal state
  const [showDayViewer, setShowDayViewer] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

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

  const getWorkoutForDate = (date) => {
    return workouts.find(
      w => new Date(w.date).toDateString() === date.toDateString()
    );
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const workout = getWorkoutForDate(date);
    if (workout) {
      setViewingWorkout(workout);
    } else {
      // Create empty workout structure for display
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      setViewingWorkout({
        date: date.toISOString(),
        dayOfWeek,
        title: '',
        exercises: []
      });
    }
    setShowDayViewer(true);
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
        <div className="page-content">
          <div className="loading">Loading workouts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-workouts-page">
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
            <Card>
              <Calendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                highlightedDates={getWorkoutDates()}
              />
            </Card>
          </div>
        ) : (
          <div className="list-view">
            <Card>
              <h2>Upcoming Workouts</h2>
              {getUpcomingWorkouts().length > 0 ? (
                <div className="workouts-list">
                  {getUpcomingWorkouts().map((workout, index) => (
                    <div
                      key={index}
                      className="workout-list-item"
                      onClick={() => handleDateSelect(new Date(workout.date))}
                    >
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
                        <h4>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</h4>
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
                  <p>No upcoming workouts scheduled</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Day Viewer Modal - Read-only for athletes */}
      {showDayViewer && viewingWorkout && (
        <WorkoutDayViewer
          isOpen={showDayViewer}
          onClose={() => {
            setShowDayViewer(false);
            setViewingWorkout(null);
          }}
          workout={viewingWorkout}
          canEdit={false}
        />
      )}
    </div>
  );
};

export default AthleteWorkouts;
