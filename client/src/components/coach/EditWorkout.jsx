import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import Calendar from '../common/Calendar';
import WorkoutEditor from './WorkoutEditor';
import api from '../../services/api';
import { DEFAULT_EXERCISES, mergeExercises } from '../../constants/defaultExercises';
import './EditWorkout.css';

const EditWorkout = () => {
  const { id: programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [teams, setTeams] = useState([]);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES);
  const [customExercises, setCustomExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [calendarView, setCalendarView] = useState('threeWeeks');

  useEffect(() => {
    fetchProgramAndExercises();
  }, [programId]);

  const fetchProgramAndExercises = async () => {
    try {
      setLoading(true);
      const [programRes, exercisesRes, teamsRes] = await Promise.all([
        api.get(`/workouts/${programId}`),
        api.get('/exercises').catch(err => {
          console.error('Failed to fetch custom exercises:', err);
          return { data: { exercises: [] } };
        }),
        api.get('/coach/teams').catch(err => {
          console.error('Failed to fetch teams:', err);
          return { data: { teams: [] } };
        })
      ]);
      setProgram(programRes.data.workout || programRes.data);
      setTeams(teamsRes.data?.teams || []);

      // Merge custom exercises with defaults
      const apiExercises = exercisesRes.data?.exercises || [];
      setCustomExercises(apiExercises);
      setExercises(mergeExercises(apiExercises));
    } catch (err) {
      setError('Failed to load program');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramChange = (field, value) => {
    setProgram(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);

    // Find existing workout for this date
    const existingWorkout = program.workouts?.find(
      dw => new Date(dw.date).toDateString() === date.toDateString()
    );

    if (existingWorkout) {
      setSelectedWorkout(existingWorkout);
    } else {
      // Create new workout for this date
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      setSelectedWorkout({
        date: date.toISOString(),
        dayOfWeek,
        title: '',
        exercises: []
      });
    }

    setEditorOpen(true);
  };

  const handleSaveWorkout = (workout) => {
    setProgram(prev => {
      const existingIndex = prev.workouts?.findIndex(
        dw => new Date(dw.date).toDateString() === new Date(workout.date).toDateString()
      );

      let newWorkouts;
      if (existingIndex >= 0) {
        newWorkouts = [...prev.workouts];
        newWorkouts[existingIndex] = workout;
      } else {
        newWorkouts = [...(prev.workouts || []), workout];
      }

      return { ...prev, workouts: newWorkouts };
    });

    setEditorOpen(false);
    setSelectedWorkout(null);
  };

  const handleSaveProgram = async () => {
    try {
      setSaving(true);
      await api.put(`/workouts/${programId}`, program);
      navigate('/coach/workouts');
    } catch (err) {
      setError('Failed to save program');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Get workouts for calendar display (same format as CreateWorkout)
  const calendarWorkouts = program?.workouts?.map(w => ({
    date: w.date,
    exercises: w.exercises
  })) || [];

  const teamOptions = [
    { value: '', label: 'Unassigned (No Team)' },
    ...teams.map(t => ({
      value: t._id,
      label: t.teamName
    }))
  ];

  if (loading) {
    return (
      <div className="edit-workout-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading program...</p>
        </div>
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="edit-workout-page">
        <div className="page-content">
          <div className="error-message">{error}</div>
          <Button onClick={() => navigate('/coach/workouts')}>
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-workout-page">
      <div className="page-header">
        <div>
          <h1>{program?.programName || 'Edit Program'}</h1>
          <p>Click on a date to add or edit exercises</p>
        </div>
        <div className="header-actions">
          <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveProgram}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Program'}
          </Button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="program-settings">
        <Input
          label="Program Name"
          value={program?.programName || ''}
          onChange={(e) => handleProgramChange('programName', e.target.value)}
          placeholder="e.g., Summer Strength Program"
        />

        <Input
          label="Start Date"
          type="date"
          value={program?.startDate?.split('T')[0] || ''}
          onChange={(e) => handleProgramChange('startDate', e.target.value)}
        />

        <Dropdown
          label="Assigned Team"
          value={program?.assignedTeams?.[0] || ''}
          onChange={(e) => handleProgramChange('assignedTeams', e.target.value ? [e.target.value] : [])}
          options={teamOptions}
          placeholder="Select a team (optional)"
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

      {/* Workout Editor Modal */}
      {editorOpen && selectedWorkout && (
        <WorkoutEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedWorkout(null);
          }}
          workout={selectedWorkout}
          exercises={exercises}
          onSave={handleSaveWorkout}
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

export default EditWorkout;
