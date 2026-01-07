import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Modal from '../common/Modal';
import Calendar from '../common/Calendar';
import WorkoutEditor from './WorkoutEditor';
import './CreateWorkout.css';

const CreateWorkout = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [program, setProgram] = useState({
    programName: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedTeams: [],
    workouts: []
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [currentDayWorkout, setCurrentDayWorkout] = useState(null);

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
          api.get('/coach/teams'),
          api.get('/exercises')
        ]);

        setTeams(teamsRes.data.teams);
        setExercises(exercisesRes.data.exercises);
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

  const handleSaveDayWorkout = (dayWorkout) => {
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

    setShowEditor(false);
    setCurrentDayWorkout(null);
  };

  const handlePublish = async () => {
    if (!program.programName || program.workouts.length === 0) {
      alert('Please add a program name and at least one workout day');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/workouts', {
        ...program,
        isPublished: true
      });

      if (response.data.success) {
        navigate('/coach/workouts');
      }
    } catch (err) {
      console.error('Failed to save program:', err);
      alert('Failed to save program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!program.programName) {
      setShowNameModal(true);
      return;
    }

    setSaving(true);
    try {
      await api.post('/workouts', {
        ...program,
        isPublished: false
      });
      alert('Draft saved successfully');
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle creating a new team
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setCreatingTeam(true);
    try {
      const response = await api.post('/teams', {
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
      alert('Failed to create team. Please try again.');
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
    title: w.title || 'Workout',
    exercises: w.exercises
  }));

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
      <div className="page-header">
        <div>
          <h1>{program.programName || 'New Workout Program'}</h1>
          <p>Click on a date to add exercises</p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} loading={saving}>
            Save Draft
          </Button>
          <Button variant="primary" onClick={handlePublish} loading={saving}>
            Publish Program
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

        <div className="date-range">
          <Input
            label="Start Date"
            type="date"
            value={program.startDate}
            onChange={(e) => setProgram(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={program.endDate}
            onChange={(e) => setProgram(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

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
          view="monthly"
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
          onExerciseCreated={(newExercise) => {
            setExercises(prev => [...prev, newExercise]);
          }}
        />
      )}
    </div>
  );
};

export default CreateWorkout;
