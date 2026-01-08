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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // DEBUG: On-screen logging
  const [debugLogs, setDebugLogs] = useState([]);
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-19), `[${timestamp}] ${message}`]);
  };

  const [program, setProgram] = useState({
    programName: '',
    startDate: new Date().toISOString().split('T')[0],
    assignedTeams: [],
    workouts: []
  });
  const [programId, setProgramId] = useState(null); // Track saved draft ID

  const [selectedDate, setSelectedDate] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
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
        // Fetch teams and custom exercises separately to handle errors independently
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

        // Get custom exercises from API and merge with defaults
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

  const handleDateSelect = (date) => {
    setSelectedDate(date);

    // If program doesn't have a name yet, show the modal
    if (!program.programName) {
      setShowNameModal(true);
      return;
    }

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

  const handleSaveProgramName = () => {
    if (!program.programName.trim()) return;
    setShowNameModal(false);

    // Now open the editor for the selected date
    if (selectedDate) {
      setCurrentDayWorkout({
        date: selectedDate.toISOString(),
        dayOfWeek: selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
        title: '',
        exercises: []
      });
      setShowEditor(true);
    }
  };

  // Update program workouts (used for both live changes and final save)
  const updateProgramWorkout = (dayWorkout) => {
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

      return { ...prev, workouts: newWorkouts };
    });
  };

  // Auto-save draft to database
  const saveDraftToDatabase = async (updatedProgram) => {
    if (!updatedProgram.programName) return;

    try {
      if (programId) {
        // Update existing draft
        await api.put(`/workouts/${programId}`, {
          ...updatedProgram,
          isDraft: true,
          isPublished: false
        });
      } else {
        // Create new draft
        const response = await api.post('/workouts', {
          ...updatedProgram,
          isDraft: true,
          isPublished: false
        });
        if (response.data.success && response.data.workout?._id) {
          setProgramId(response.data.workout._id);
        }
      }
    } catch (err) {
      console.error('Failed to auto-save draft:', err);
    }
  };

  // Live update as exercises are added/removed
  const handleWorkoutChange = (dayWorkout) => {
    addDebugLog(`handleWorkoutChange called! exercises: ${dayWorkout?.exercises?.length || 0}`);
    // Update program state with the new workout data
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
      addDebugLog(`program.workouts updated: ${newWorkouts.length} days, total exercises: ${newWorkouts.reduce((sum, w) => sum + (w.exercises?.length || 0), 0)}`);

      // Auto-save to database
      saveDraftToDatabase(updatedProgram);

      return updatedProgram;
    });
  };

  const handleSaveDayWorkout = (dayWorkout) => {
    // Final save already happened via onChange, just close editor
    setShowEditor(false);
    setCurrentDayWorkout(null);
  };

  const handlePublish = async () => {
    // Check program name exists
    if (!program.programName) {
      alert('Please add a program name');
      return;
    }

    // Check that at least one workout day has exercises
    const workoutsWithExercises = program.workouts.filter(w => w.exercises && w.exercises.length > 0);
    if (workoutsWithExercises.length === 0) {
      alert('Please add at least one workout day with exercises');
      return;
    }

    if (program.assignedTeams.length === 0) {
      alert('Please assign this program to a team before publishing. Use "Save to My Programs" if you want to save it without assigning to a team.');
      return;
    }

    setSaving(true);
    try {
      if (programId) {
        // Update existing draft to published
        await api.put(`/workouts/${programId}`, {
          ...program,
          isDraft: false,
          isPublished: true
        });
      } else {
        // Create new published program
        await api.post('/workouts', {
          ...program,
          isPublished: true
        });
      }
      navigate('/coach/workouts');
    } catch (err) {
      console.error('Failed to save program:', err);
      alert('Failed to save program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToMyPrograms = async () => {
    // Check program name exists
    if (!program.programName) {
      alert('Please add a program name');
      return;
    }

    // Check that at least one workout day has exercises
    const workoutsWithExercises = program.workouts.filter(w => w.exercises && w.exercises.length > 0);
    if (workoutsWithExercises.length === 0) {
      alert('Please add at least one workout day with exercises');
      return;
    }

    setSaving(true);
    try {
      if (programId) {
        // Update existing draft
        await api.put(`/workouts/${programId}`, {
          ...program,
          assignedTeams: [],
          isDraft: false,
          isPublished: false,
          isSavedProgram: true
        });
      } else {
        // Create new saved program
        await api.post('/workouts', {
          ...program,
          assignedTeams: [],
          isPublished: false,
          isSavedProgram: true
        });
      }
      navigate('/coach/workouts');
    } catch (err) {
      console.error('Failed to save program:', err);
      alert('Failed to save program. Please try again.');
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
        alert('You have reached your team limit. Please purchase additional team slots to add more teams.');
      } else {
        alert('Failed to create team. Please try again.');
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  const teamOptions = teams.map(t => ({
    value: t._id,
    label: t.teamName
  }));

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

  // DEBUG: Log when calendarWorkouts changes
  useEffect(() => {
    addDebugLog(`calendarWorkouts render: ${calendarWorkouts.length} days with exercises: ${calendarWorkouts.map(w => w.exercises?.length || 0).join(',')}`);
  }, [calendarWorkouts.length, JSON.stringify(calendarWorkouts.map(w => w.exercises?.length))]);

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
      {/* DEBUG PANEL - Remove after fixing */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '300px',
        background: '#1a1a2e',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '11px',
        padding: '10px',
        borderRadius: '8px',
        overflow: 'auto',
        zIndex: 9999,
        border: '2px solid #00ff00'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>
          DEBUG PANEL - program.workouts: {program.workouts.length} |
          calendarWorkouts: {calendarWorkouts.length}
        </div>
        {debugLogs.map((log, i) => (
          <div key={i} style={{ borderBottom: '1px solid #333', padding: '2px 0' }}>{log}</div>
        ))}
        {debugLogs.length === 0 && <div>Waiting for events...</div>}
      </div>

      <div className="page-header">
        <div>
          <h1>{program.programName || 'New Workout Program'}</h1>
          <p>Click on a date to add exercises</p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveToMyPrograms} loading={saving}>
            Save to My Programs
          </Button>
          <Button variant="primary" onClick={handlePublish} loading={saving}>
            Publish to Team
          </Button>
        </div>
      </div>

      <div className="program-settings">
        <Input
          label="Program Name"
          value={program.programName}
          onChange={(e) => setProgram(prev => ({ ...prev, programName: e.target.value }))}
          placeholder="e.g., Fall Strength Program"
        />

        <Input
          label="Start Date"
          type="date"
          value={program.startDate}
          onChange={(e) => setProgram(prev => ({ ...prev, startDate: e.target.value }))}
        />

        <Dropdown
          label="Assign to Team"
          value={program.assignedTeams[0] || ''}
          onChange={(e) => setProgram(prev => ({
            ...prev,
            assignedTeams: e.target.value ? [e.target.value] : []
          }))}
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

      {/* Name Modal */}
      <Modal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Name Your Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNameModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProgramName}>Save & Continue</Button>
          </>
        }
      >
        <Input
          label="Program Name"
          value={program.programName}
          onChange={(e) => setProgram(prev => ({ ...prev, programName: e.target.value }))}
          placeholder="e.g., Fall Strength Program"
          autoFocus
        />
        <Dropdown
          label="Assign to Team"
          value={program.assignedTeams[0] || ''}
          onChange={(e) => setProgram(prev => ({
            ...prev,
            assignedTeams: e.target.value ? [e.target.value] : []
          }))}
          options={teamOptions}
          placeholder="Select a team"
          showCreateNew={true}
          createNewLabel="+ Create New Team"
          onCreateNew={() => setShowCreateTeamModal(true)}
        />
      </Modal>

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
          onDebug={addDebugLog}
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
