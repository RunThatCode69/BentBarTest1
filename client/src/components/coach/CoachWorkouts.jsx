import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import Calendar from '../common/Calendar';
import './CoachWorkouts.css';

const CoachWorkouts = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('threeWeeks');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workoutsRes, teamsRes] = await Promise.all([
          api.get('/workouts'),
          api.get('/coach/teams')
        ]);

        setWorkouts(workoutsRes.data.workouts);
        setTeams(teamsRes.data.teams);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    findAndSetWorkout(date);
  };

  const findAndSetWorkout = (date) => {
    // Find workout for this date
    const workout = workouts.find(w => {
      return w.workouts?.some(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === targetDate.getTime();
      });
    });

    if (workout) {
      const dayWorkout = workout.workouts.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === targetDate.getTime();
      });

      setSelectedWorkout({
        ...dayWorkout,
        programName: workout.programName,
        programId: workout._id
      });
    } else {
      setSelectedWorkout(null);
    }
  };

  // Handle day expansion - switch to day view when clicking a day
  const handleDayExpand = (date) => {
    setSelectedDate(date);
    setView('daily');
    findAndSetWorkout(date);
  };

  // Get programs filtered by selected team
  const programsForSelectedTeam = selectedTeam
    ? workouts.filter(w => w.assignedTeams?.some(t => {
        // Handle both populated objects and plain IDs
        const teamId = t._id || t;
        return teamId === selectedTeam || teamId?.toString() === selectedTeam;
      }))
    : [];

  // Get the active program to display in calendar
  const activeProgram = selectedProgram
    ? workouts.find(w => w._id === selectedProgram)
    : null;

  // Build calendar workouts from the active program only
  const getCalendarWorkouts = () => {
    if (!activeProgram) return [];

    const programWorkouts = [];
    activeProgram.workouts?.forEach(day => {
      programWorkouts.push({
        date: day.date,
        title: day.title || activeProgram.programName,
        exercises: day.exercises
      });
    });
    return programWorkouts;
  };

  const teamOptions = teams.map(t => ({
    value: t._id,
    label: t.teamName
  }));

  const programOptions = programsForSelectedTeam.map(w => ({
    value: w._id,
    label: w.programName
  }));

  // Reset program selection when team changes
  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
    setSelectedProgram(''); // Reset program when team changes
    setSelectedWorkout(null);
  };

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
    setSelectedWorkout(null);
  };

  return (
    <div className="coach-workouts-page">
      <div className="page-header">
        <div>
          <h1>Workout Programs</h1>
          <p>View and manage your team's workout schedules</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/coach/workouts/create')}>
          Create New Program
        </Button>
      </div>

      <div className="workouts-toolbar">
        <div className="program-selectors">
          <Dropdown
            name="team"
            value={selectedTeam}
            onChange={handleTeamChange}
            options={teamOptions}
            placeholder="Select Team"
          />
          <Dropdown
            name="program"
            value={selectedProgram}
            onChange={handleProgramChange}
            options={programOptions}
            placeholder={selectedTeam ? "Select Program" : "Select team first"}
            disabled={!selectedTeam}
          />
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'daily' ? 'active' : ''}`}
            onClick={() => setView('daily')}
          >
            Day
          </button>
          <button
            className={`toggle-btn ${view === 'weekly' ? 'active' : ''}`}
            onClick={() => setView('weekly')}
          >
            Week
          </button>
          <button
            className={`toggle-btn ${view === 'threeWeeks' ? 'active' : ''}`}
            onClick={() => setView('threeWeeks')}
          >
            3 Weeks
          </button>
          <button
            className={`toggle-btn ${view === 'monthly' ? 'active' : ''}`}
            onClick={() => setView('monthly')}
          >
            Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading workouts...</p>
        </div>
      ) : (
        <div className="workouts-content">
          <div className="calendar-section">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              workouts={getCalendarWorkouts()}
              view={view}
              onViewChange={setView}
              onDayExpand={handleDayExpand}
            />
          </div>

          <div className="workout-detail">
            {selectedWorkout ? (
              <>
                <div className="detail-header">
                  <h3>{selectedWorkout.title || 'Workout'}</h3>
                  <span className="detail-date">
                    {new Date(selectedWorkout.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/coach/workouts/${selectedWorkout.programId}`)}
                  >
                    Edit Program
                  </Button>
                </div>

                <div className="exercises-list">
                  {selectedWorkout.exercises?.map((exercise, index) => (
                    <div key={index} className="exercise-item">
                      <div className="exercise-order">{index + 1}</div>
                      <div className="exercise-info">
                        <span className="exercise-name">{exercise.exerciseName}</span>
                        <span className="exercise-details">
                          {exercise.sets} x {exercise.reps}
                          {exercise.percentage && ` @ ${exercise.percentage}%`}
                          {exercise.weight && ` @ ${exercise.weight} lbs`}
                        </span>
                        {exercise.notes && (
                          <span className="exercise-notes">{exercise.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedDate ? (
              <div className="no-workout">
                <p>No workout scheduled</p>
                <Button variant="outline" onClick={() => navigate('/coach/workouts/create')}>
                  Add Workout
                </Button>
              </div>
            ) : (
              <div className="no-workout">
                <p>Select a date to view workout details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachWorkouts;
