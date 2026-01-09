import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Calendar from '../common/Calendar';
import WorkoutDayViewer from '../common/WorkoutDayViewer';
import api from '../../services/api';
import './AthleteWorkouts.css';

const AthleteWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [programName, setProgramName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('threeWeeks');

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
      const workoutsData = response.data.workouts || [];
      setWorkouts(workoutsData);

      // Get program name from first workout if available
      if (workoutsData.length > 0 && workoutsData[0].programName) {
        setProgramName(workoutsData[0].programName);
      }
    } catch (err) {
      setError('Failed to load workouts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format workouts for Calendar component (same format as coach)
  const getCalendarWorkouts = () => {
    return workouts
      .filter(w => w.exercises && w.exercises.length > 0)
      .map(w => ({
        date: w.date,
        exercises: w.exercises
      }));
  };

  const getWorkoutForDate = (date) => {
    return workouts.find(w => {
      const workoutDate = new Date(w.date);
      workoutDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === targetDate.getTime();
    });
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
        </div>

        {/* Program Badge */}
        {programName ? (
          <div className="program-badge">
            <span className="program-badge-icon">📋</span>
            <span className="program-badge-name">{programName}</span>
          </div>
        ) : (
          <div className="program-badge no-program">
            <span className="program-badge-icon">⚠️</span>
            <span className="program-badge-name">No Program Assigned</span>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <div className="calendar-container">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            workouts={getCalendarWorkouts()}
            view={view}
            onViewChange={setView}
          />
        </div>
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
