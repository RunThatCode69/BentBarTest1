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

  // Assign team modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [programToAssign, setProgramToAssign] = useState(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Move program modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [moving, setMoving] = useState(false);

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

  // When clicking a date, switch to day view
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setView('daily');
  };

  // Get programs filtered by selected team
  const programsForSelectedTeam = selectedTeam === 'unassigned'
    ? workouts.filter(w => !w.assignedTeams || w.assignedTeams.length === 0)
    : selectedTeam
      ? workouts.filter(w => w.assignedTeams?.some(t => {
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

  // Move program to new start date
  const handleMoveProgram = async () => {
    if (!activeProgram || !newStartDate) return;

    setMoving(true);
    try {
      const workoutDates = activeProgram.workouts
        ?.map(w => new Date(w.date))
        .sort((a, b) => a - b);

      if (!workoutDates || workoutDates.length === 0) {
        alert('No workouts to move');
        return;
      }

      const oldStartDate = workoutDates[0];
      const newStart = new Date(newStartDate);
      const diffMs = newStart.getTime() - oldStartDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Shift all workout dates by the difference
      const updatedWorkouts = activeProgram.workouts.map(w => {
        const oldDate = new Date(w.date);
        const newDate = new Date(oldDate.getTime() + diffDays * 24 * 60 * 60 * 1000);
        return {
          ...w,
          date: newDate.toISOString(),
          dayOfWeek: newDate.toLocaleDateString('en-US', { weekday: 'long' })
        };
      });

      const updatedProgram = {
        ...activeProgram,
        workouts: updatedWorkouts,
        startDate: new Date(newStartDate).toISOString()
      };

      await api.put(`/workouts/${activeProgram._id}`, updatedProgram);

      // Update local state
      setWorkouts(prev => prev.map(w =>
        w._id === activeProgram._id ? updatedProgram : w
      ));

      setShowMoveModal(false);
      setNewStartDate('');
    } catch (err) {
      console.error('Failed to move program:', err);
      alert('Failed to move program. Please try again.');
    } finally {
      setMoving(false);
    }
  };

  const openMoveModal = () => {
    if (activeProgram?.workouts?.length > 0) {
      const earliestDate = activeProgram.workouts
        .map(w => new Date(w.date))
        .sort((a, b) => a - b)[0];
      setNewStartDate(earliestDate.toISOString().split('T')[0]);
    }
    setShowMoveModal(true);
  };

  // Build calendar workouts from the active program only
  const getCalendarWorkouts = () => {
    if (!activeProgram) return [];

    return activeProgram.workouts?.map(day => ({
      date: day.date,
      title: day.title || activeProgram.programName,
      exercises: day.exercises
    })) || [];
  };

  // Get workout for selected date (for day view)
  const getSelectedDayWorkout = () => {
    if (!activeProgram || !selectedDate) return null;

    return activeProgram.workouts?.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === targetDate.getTime();
    });
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

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
    setSelectedProgram('');
  };

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
  };

  const selectedDayWorkout = getSelectedDayWorkout();

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
        <div className="toolbar-left">
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
          {selectedTeam === 'unassigned' && selectedProgram && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAssignModal(activeProgram)}
            >
              Assign to Team
            </Button>
          )}
          {selectedProgram && (
            <Button
              variant="outline"
              size="sm"
              onClick={openMoveModal}
            >
              Move Program
            </Button>
          )}
        </div>

        <div className="toolbar-right">
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
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading workouts...</p>
        </div>
      ) : view === 'daily' && selectedDate ? (
        // Day View - Full workout details
        <div className="day-view-container">
          <div className="day-view-header">
            <div className="day-view-title">
              <h2>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h2>
              {activeProgram && <span className="program-name">{activeProgram.programName}</span>}
            </div>
            <div className="day-view-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView('threeWeeks')}
              >
                Back to Calendar
              </Button>
              {activeProgram && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/coach/workouts/${activeProgram._id}`)}
                >
                  Edit Program
                </Button>
              )}
            </div>
          </div>

          {selectedDayWorkout ? (
            <div className="day-workout-content">
              {selectedDayWorkout.title && (
                <h3 className="workout-title">{selectedDayWorkout.title}</h3>
              )}
              <div className="exercises-full-list">
                {selectedDayWorkout.exercises?.map((exercise, index) => (
                  <div key={index} className="exercise-full-item">
                    <div className="exercise-number">{index + 1}</div>
                    <div className="exercise-details-full">
                      <span className="exercise-name-full">{exercise.exerciseName}</span>
                      <div className="exercise-params">
                        <span className="param">
                          <strong>{exercise.sets}</strong> sets
                        </span>
                        <span className="param">
                          <strong>{exercise.reps}</strong> reps
                        </span>
                        {exercise.percentage && (
                          <span className="param">
                            <strong>{exercise.percentage}%</strong> intensity
                          </span>
                        )}
                        {exercise.weight && (
                          <span className="param">
                            <strong>{exercise.weight}</strong> lbs
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="exercise-notes-full">{exercise.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-workout-day">
              <p>No workout scheduled for this day</p>
              {activeProgram && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/coach/workouts/${activeProgram._id}`)}
                >
                  Add Workout to This Day
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Calendar View (Week/3 Weeks/Month)
        <div className="calendar-container">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            workouts={getCalendarWorkouts()}
            view={view}
            onViewChange={setView}
          />
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

      {/* Move Program Modal */}
      <Modal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        title="Move Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowMoveModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleMoveProgram}
              disabled={!newStartDate}
              loading={moving}
            >
              Move Program
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 'var(--spacing-4)' }}>
          Move "<strong>{activeProgram?.programName}</strong>" to a new start date. All workout dates will shift accordingly while maintaining the same schedule pattern.
        </p>
        <div style={{ marginBottom: 'var(--spacing-2)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-1)', fontWeight: 500 }}>
            New Start Date
          </label>
          <input
            type="date"
            value={newStartDate}
            onChange={(e) => setNewStartDate(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--spacing-2)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
        </div>
        {activeProgram?.workouts?.length > 0 && (
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-2)' }}>
            This program has {activeProgram.workouts.length} workout day{activeProgram.workouts.length !== 1 ? 's' : ''}.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default CoachWorkouts;
