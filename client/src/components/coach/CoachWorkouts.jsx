import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import Calendar from '../common/Calendar';
import WorkoutDayViewer from '../common/WorkoutDayViewer';
import { DEFAULT_EXERCISES, mergeExercises } from '../../constants/defaultExercises';
import './CoachWorkouts.css';

const CoachWorkouts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [workouts, setWorkouts] = useState([]);
  const [teams, setTeams] = useState([]);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [customExercises, setCustomExercises] = useState([]);
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

  // Delete program modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Day viewer modal state
  const [showDayViewer, setShowDayViewer] = useState(false);
  const [viewingWorkout, setViewingWorkout] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workoutsRes, teamsRes, exercisesRes] = await Promise.all([
          api.get('/workouts'),
          api.get('/coach/teams'),
          api.get('/exercises').catch(() => ({ data: { exercises: [] } }))
        ]);

        setWorkouts(workoutsRes.data.workouts);
        const fetchedTeams = teamsRes.data.teams;
        setTeams(fetchedTeams);

        // Merge custom exercises with defaults
        const apiExercises = exercisesRes.data?.exercises || [];
        setCustomExercises(apiExercises);
        setExercises(mergeExercises(apiExercises));

        // Check for URL params to pre-select team and program
        const urlTeam = searchParams.get('team');
        const urlProgram = searchParams.get('program');

        if (urlTeam) {
          setSelectedTeam(urlTeam);
        } else if (fetchedTeams.length === 1) {
          // Auto-select team if coach only has one team
          setSelectedTeam(fetchedTeams[0]._id);
        }

        if (urlProgram) {
          setSelectedProgram(urlProgram);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

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

  // Get workout for a specific date
  const getWorkoutForDate = (date) => {
    if (!activeProgram || !date) return null;

    return activeProgram.workouts?.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === targetDate.getTime();
    });
  };

  // When clicking a date, open the day viewer modal
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const workout = getWorkoutForDate(date);
    if (workout) {
      setViewingWorkout(workout);
    } else {
      // Create empty workout for this date
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      setViewingWorkout({
        date: date.toISOString(),
        dayOfWeek,
        title: '',
        exercises: []
      });
    }
    setShowDayViewer(true);
  };

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

  // Delete program
  const handleDeleteProgram = async () => {
    if (!activeProgram) return;

    setDeleting(true);
    try {
      await api.delete(`/workouts/${activeProgram._id}`);

      // Update local state
      setWorkouts(prev => prev.filter(w => w._id !== activeProgram._id));
      setSelectedProgram('');
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete program:', err);
      alert('Failed to delete program. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Build calendar workouts from the active program only
  const getCalendarWorkouts = () => {
    if (!activeProgram) return [];

    return activeProgram.workouts?.map(day => ({
      date: day.date,
      exercises: day.exercises
    })) || [];
  };

  // Save workout from day viewer
  const handleSaveWorkout = async (updatedWorkout) => {
    if (!activeProgram) return;

    try {
      const existingIndex = activeProgram.workouts?.findIndex(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(updatedWorkout.date);
        targetDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === targetDate.getTime();
      });

      let newWorkouts;
      if (existingIndex >= 0) {
        newWorkouts = [...activeProgram.workouts];
        newWorkouts[existingIndex] = updatedWorkout;
      } else {
        newWorkouts = [...(activeProgram.workouts || []), updatedWorkout];
      }

      const updatedProgram = {
        ...activeProgram,
        workouts: newWorkouts
      };

      await api.put(`/workouts/${activeProgram._id}`, updatedProgram);

      // Update local state
      setWorkouts(prev => prev.map(w =>
        w._id === activeProgram._id ? updatedProgram : w
      ));

      setShowDayViewer(false);
      setViewingWorkout(null);
    } catch (err) {
      console.error('Failed to save workout:', err);
      alert('Failed to save workout. Please try again.');
    }
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openMoveModal}
              >
                Move Program
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Program
              </Button>
            </>
          )}
        </div>

        <div className="toolbar-right">
          <div className="view-toggle">
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
      ) : (
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

      {/* Delete Program Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDeleteProgram}
              loading={deleting}
            >
              Delete Program
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete "<strong>{activeProgram?.programName}</strong>"?</p>
        <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          This will permanently remove the program and all its workouts. This action cannot be undone.
        </p>
      </Modal>

      {/* Day Viewer Modal */}
      {showDayViewer && viewingWorkout && (
        <WorkoutDayViewer
          isOpen={showDayViewer}
          onClose={() => {
            setShowDayViewer(false);
            setViewingWorkout(null);
          }}
          workout={viewingWorkout}
          exercises={exercises}
          onSave={handleSaveWorkout}
          onExerciseCreated={(newExercise) => {
            const updatedCustom = [...customExercises, newExercise];
            setCustomExercises(updatedCustom);
            setExercises(mergeExercises(updatedCustom));
          }}
          canEdit={!!activeProgram}
        />
      )}
    </div>
  );
};

export default CoachWorkouts;
