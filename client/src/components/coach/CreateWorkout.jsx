import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import Calendar from '../common/Calendar';
import WorkoutEditor from './WorkoutEditor';
import { DEFAULT_EXERCISES, mergeExercises } from '../../constants/defaultExercises';
import './CreateWorkout.css';

const CreateWorkout = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [customExercises, setCustomExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default end date is 3 weeks from start
  const getDefaultEndDate = () => {
    const end = new Date();
    end.setDate(end.getDate() + 21);
    return end.toISOString().split('T')[0];
  };

  const [program, setProgram] = useState({
    programName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: getDefaultEndDate(),
    assignedTeams: [],
    workouts: []
  });
  const [programId, setProgramId] = useState(null);

  // Show setup modal immediately - user MUST create program first
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [creatingProgram, setCreatingProgram] = useState(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentDayWorkout, setCurrentDayWorkout] = useState(null);
  const [calendarView, setCalendarView] = useState('threeWeeks');

  // Create Team Modal state
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, exercisesRes] = await Promise.all([
          api.get('/coach/teams').catch(err => {
            console.error('Failed to fetch teams:', err);
            return { data: { teams: [] } };
          }),
          api.get('/exercises').catch(err => {
            console.error('Failed to fetch exercises:', err);
            return { data: { exercises: [] } };
          })
        ]);

        const fetchedTeams = teamsRes.data?.teams || [];
        setTeams(fetchedTeams);

        // Auto-select team if coach only has one
        if (fetchedTeams.length === 1) {
          setProgram(prev => ({
            ...prev,
            assignedTeams: [fetchedTeams[0]._id]
          }));
        }

        const apiExercises = exercisesRes.data?.exercises || [];
        setCustomExercises(apiExercises);
        setExercises(mergeExercises(apiExercises));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create the program in the database immediately
  const handleCreateProgram = async () => {
    if (!program.programName.trim()) {
      alert('Please enter a program name');
      return;
    }

    setCreatingProgram(true);
    try {
      const response = await api.post('/workouts', {
        ...program,
        isDraft: false,
        isPublished: false,
        isSavedProgram: true
      });

      if (response.data.success && response.data.workout?._id) {
        setProgramId(response.data.workout._id);
        setShowSetupModal(false);
      } else {
        alert('Failed to create program. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create program:', err);
      alert('Failed to create program. Please try again.');
    } finally {
      setCreatingProgram(false);
    }
  };

  const handleDateSelect = (date) => {
    // Program must be created first
    if (!programId) {
      setShowSetupModal(true);
      return;
    }

    setSelectedDate(date);

    // Find existing workout for this date
    const existingWorkout = program.workouts.find(w => {
      const workoutDate = new Date(w.date);
      workoutDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === targetDate.getTime();
    });

    if (existingWorkout) {
      setCurrentDayWorkout(existingWorkout);
    } else {
      setCurrentDayWorkout({
        date: date.toISOString(),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        title: '',
        exercises: []
      });
    }

    setShowEditor(true);
  };

  // Save workout changes to database
  const saveToDatabase = async (updatedProgram) => {
    if (!programId) return;

    try {
      await api.put(`/workouts/${programId}`, updatedProgram);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  // Live update as exercises are added/removed
  const handleWorkoutChange = (dayWorkout) => {
    // Update currentDayWorkout to keep it in sync (prevents stale data)
    setCurrentDayWorkout(dayWorkout);

    setProgram(prev => {
      const existingIndex = prev.workouts.findIndex(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        const targetDate = new Date(dayWorkout.date);
        targetDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === targetDate.getTime();
      });

      const newWorkouts = [...prev.workouts];
      if (existingIndex >= 0) {
        newWorkouts[existingIndex] = dayWorkout;
      } else {
        newWorkouts.push(dayWorkout);
      }

      const updatedProgram = { ...prev, workouts: newWorkouts };
      saveToDatabase(updatedProgram);
      return updatedProgram;
    });
  };

  const handleSaveDayWorkout = () => {
    setShowEditor(false);
    setCurrentDayWorkout(null);
  };

  const handlePublish = async () => {
    if (!programId) return;

    if (program.assignedTeams.length === 0) {
      alert('Please assign this program to a team before publishing.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/workouts/${programId}`, {
        ...program,
        isDraft: false,
        isPublished: true
      });
      navigate('/coach/workouts');
    } catch (err) {
      console.error('Failed to publish:', err);
      alert('Failed to publish program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle creating a new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setCreatingTeam(true);
    try {
      const response = await api.post('/coach/teams', {
        teamName: newTeamName,
        sport: newTeamSport || 'general'
      });

      if (response.data.success || response.data.team) {
        const newTeam = response.data.team;
        setTeams(prev => [...prev, newTeam]);
        setProgram(prev => ({
          ...prev,
          assignedTeams: [newTeam._id]
        }));
        setShowCreateTeamModal(false);
        setNewTeamName('');
        setNewTeamSport('');
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      if (err.response?.data?.code === 'TEAM_LIMIT_REACHED') {
        alert('You have reached your team limit.');
      } else {
        alert('Failed to create team. Please try again.');
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  // Team options with "Unassigned" option
  const teamOptions = [
    { value: '', label: 'Unassigned (Save to My Programs)' },
    ...teams.map(t => ({
      value: t._id,
      label: t.teamName
    }))
  ];

  const sportOptions = [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'baseball', label: 'Baseball' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'track', label: 'Track & Field' },
    { value: 'wrestling', label: 'Wrestling' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'general', label: 'General/Other' }
  ];

  // Get workouts for calendar display
  const calendarWorkouts = program.workouts.map(w => ({
    date: w.date,
    exercises: w.exercises
  }));

  // Debug: log what we're passing to Calendar
  console.log('Calendar workouts:', calendarWorkouts);

  if (loading) {
    return (
      <div className="create-workout-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-workout-page">
      {/* Setup Modal - Shows immediately */}
      <Modal
        isOpen={showSetupModal}
        onClose={() => navigate('/coach/workouts')}
        title="Create New Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreateProgram}
              loading={creatingProgram}
              disabled={!program.programName.trim()}
            >
              Create Program
            </Button>
          </>
        }
      >
        <Input
          label="Program Name"
          value={program.programName}
          onChange={(e) => setProgram(prev => ({ ...prev, programName: e.target.value }))}
          placeholder="e.g., Fall Strength Program"
          autoFocus
          required
        />
        <div style={{ marginTop: 'var(--spacing-3)' }}>
          <Dropdown
            label="Assign to Team"
            value={program.assignedTeams[0] || ''}
            onChange={(e) => setProgram(prev => ({
              ...prev,
              assignedTeams: e.target.value ? [e.target.value] : []
            }))}
            options={teamOptions}
            placeholder="Select a team or leave unassigned"
            showCreateNew={true}
            createNewLabel="+ Create New Team"
            onCreateNew={() => setShowCreateTeamModal(true)}
          />
        </div>
        <p style={{ marginTop: 'var(--spacing-3)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          You can always change the team assignment later.
        </p>
      </Modal>

      {/* Only show main content after program is created */}
      {programId && (
        <>
          <div className="page-header">
            <div>
              <h1>{program.programName}</h1>
              <p>Click on a date to add exercises</p>
            </div>
            <div className="header-actions">
              <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>
                Done
              </Button>
              {program.assignedTeams.length > 0 && (
                <Button variant="primary" onClick={handlePublish} loading={saving}>
                  Publish to Team
                </Button>
              )}
            </div>
          </div>

          <div className="program-settings">
            <Input
              label="Program Name"
              value={program.programName}
              onChange={(e) => {
                const newName = e.target.value;
                setProgram(prev => {
                  const updated = { ...prev, programName: newName };
                  saveToDatabase(updated);
                  return updated;
                });
              }}
              placeholder="e.g., Fall Strength Program"
            />

            <Input
              label="Start Date"
              type="date"
              value={program.startDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setProgram(prev => {
                  const updated = { ...prev, startDate: newDate };
                  saveToDatabase(updated);
                  return updated;
                });
              }}
            />

            <Dropdown
              label="Assign to Team"
              value={program.assignedTeams[0] || ''}
              onChange={(e) => {
                const teamId = e.target.value;
                setProgram(prev => {
                  const updated = {
                    ...prev,
                    assignedTeams: teamId ? [teamId] : []
                  };
                  saveToDatabase(updated);
                  return updated;
                });
              }}
              options={teamOptions}
              placeholder="Select a team"
              showCreateNew={true}
              createNewLabel="+ Create New Team"
              onCreateNew={() => setShowCreateTeamModal(true)}
            />
          </div>

          <div className="calendar-container">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              workouts={calendarWorkouts}
              view={calendarView}
              onViewChange={setCalendarView}
            />
          </div>
        </>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        title="Create New Team"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateTeamModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTeam} loading={creatingTeam}>Create Team</Button>
          </>
        }
      >
        <Input
          label="Team Name"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="e.g., Varsity Football"
          autoFocus
          required
        />
        <Dropdown
          label="Sport"
          value={newTeamSport}
          onChange={(e) => setNewTeamSport(e.target.value)}
          options={sportOptions}
          placeholder="Select a sport"
        />
      </Modal>

      {/* Workout Editor Modal */}
      {showEditor && currentDayWorkout && (
        <WorkoutEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setCurrentDayWorkout(null);
          }}
          workout={currentDayWorkout}
          exercises={exercises}
          onSave={handleSaveDayWorkout}
          onChange={handleWorkoutChange}
          onExerciseCreated={(newExercise) => {
            const updatedCustom = [...customExercises, newExercise];
            setCustomExercises(updatedCustom);
            setExercises(mergeExercises(updatedCustom));
          }}
        />
      )}
    </div>
  );
};

export default CreateWorkout;
