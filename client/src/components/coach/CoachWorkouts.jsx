import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
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

  // Assign team modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [programToAssign, setProgramToAssign] = useState(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workoutsRes, teamsRes] = await Promise.all([
          api.get('/workouts'),
          api.get('/coach/teams')
        ]);

        setWorkouts(workoutsRes.data.workouts);
        const fetchedTeams = teamsRes.data.teams;
        setTeams(fetchedTeams);

        // Auto-select team if coach only has one team
        if (fetchedTeams.length === 1) {
          setSelectedTeam(fetchedTeams[0]._id);
        }
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
  const programsForSelectedTeam = selectedTeam === 'unassigned'
    ? workouts.filter(w => !w.assignedTeams || w.assignedTeams.length === 0)
    : selectedTeam
      ? workouts.filter(w => w.assignedTeams?.some(t => {
          // Handle both populated objects and plain IDs
          const teamId = t._id || t;
          return teamId === selectedTeam || teamId?.toString() === selectedTeam;
        }))
      : [];

  // Assign program to team
  const handleAssignTeam = async () => {
    if (!programToAssign || !assignTeamId) return;

    setAssigning(true);
    try {
      await api.put(`/workouts/${programToAssign._id}`, {
        ...programToAssign,
        assignedTeams: [assignTeamId]
      });

      // Update local state
      setWorkouts(prev => prev.map(w =>
        w._id === programToAssign._id
          ? { ...w, assignedTeams: [assignTeamId] }
          : w
      ));

      setShowAssignModal(false);
      setProgramToAssign(null);
      setAssignTeamId('');
      setSelectedTeam(assignTeamId);
      setSelectedProgram(programToAssign._id);
    } catch (err) {
      console.error('Failed to assign team:', err);
      alert('Failed to assign team. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (program) => {
    setProgramToAssign(program);
    setAssignTeamId('');
    setShowAssignModal(true);
  };

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

  const teamOptions = [
    { value: 'unassigned', label: 'Unassigned Programs' },
    ...teams.map(t => ({
      value: t._id,
      label: t.teamName
    }))
  ];

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
                  <div className="detail-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/coach/workouts/${selectedWorkout.programId}`)}
                    >
                      Edit Program
                    </Button>
                    {selectedTeam === 'unassigned' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openAssignModal(workouts.find(w => w._id === selectedWorkout.programId))}
                      >
                        Assign to Team
                      </Button>
                    )}
                  </div>
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

      {/* Assign to Team Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Program to Team"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAssignTeam}
              disabled={!assignTeamId}
              loading={assigning}
            >
              Assign to Team
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 'var(--spacing-4)' }}>
          Assign "<strong>{programToAssign?.programName}</strong>" to a team. Athletes on that team will be able to see this workout program.
        </p>
        <Dropdown
          label="Select Team"
          value={assignTeamId}
          onChange={(e) => setAssignTeamId(e.target.value)}
          options={teams.map(t => ({ value: t._id, label: t.teamName }))}
          placeholder="Choose a team"
        />
      </Modal>
    </div>
  );
};

export default CoachWorkouts;
