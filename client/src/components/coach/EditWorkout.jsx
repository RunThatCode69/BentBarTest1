import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Calendar from '../common/Calendar';
import WorkoutEditor from './WorkoutEditor';
import api from '../../services/api';
import './EditWorkout.css';

const EditWorkout = () => {
  const { programId } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    fetchProgramAndExercises();
  }, [programId]);

  const fetchProgramAndExercises = async () => {
    try {
      setLoading(true);
      const [programRes, exercisesRes] = await Promise.all([
        api.get(`/workouts/${programId}`),
        api.get('/exercises')
      ]);
      setProgram(programRes.data);
      setExercises(exercisesRes.data);
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
    const existingWorkout = program.dailyWorkouts?.find(
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
      const existingIndex = prev.dailyWorkouts?.findIndex(
        dw => new Date(dw.date).toDateString() === new Date(workout.date).toDateString()
      );

      let newDailyWorkouts;
      if (existingIndex >= 0) {
        newDailyWorkouts = [...prev.dailyWorkouts];
        newDailyWorkouts[existingIndex] = workout;
      } else {
        newDailyWorkouts = [...(prev.dailyWorkouts || []), workout];
      }

      return { ...prev, dailyWorkouts: newDailyWorkouts };
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

  const getWorkoutDates = () => {
    if (!program?.dailyWorkouts) return [];
    return program.dailyWorkouts
      .filter(dw => dw.exercises && dw.exercises.length > 0)
      .map(dw => new Date(dw.date));
  };

  if (loading) {
    return (
      <div className="edit-workout-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading program...</div>
        </div>
      </div>
    );
  }

  if (error && !program) {
    return (
      <div className="edit-workout-page">
        <Navbar />
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
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Edit Workout Program</h1>
            <p className="subtitle">Modify your workout program and daily exercises</p>
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

        <div className="edit-workout-content">
          <div className="program-details">
            <Card>
              <h3>Program Details</h3>
              <div className="form-grid">
                <Input
                  label="Program Name"
                  value={program?.name || ''}
                  onChange={(e) => handleProgramChange('name', e.target.value)}
                  placeholder="e.g., Summer Strength Program"
                />
                <Input
                  label="Description"
                  value={program?.description || ''}
                  onChange={(e) => handleProgramChange('description', e.target.value)}
                  placeholder="Brief description of the program"
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={program?.startDate?.split('T')[0] || ''}
                  onChange={(e) => handleProgramChange('startDate', e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={program?.endDate?.split('T')[0] || ''}
                  onChange={(e) => handleProgramChange('endDate', e.target.value)}
                />
              </div>
            </Card>

            <Card>
              <h3>Program Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">
                    {program?.dailyWorkouts?.filter(dw => dw.exercises?.length > 0).length || 0}
                  </span>
                  <span className="stat-label">Workout Days</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {program?.dailyWorkouts?.reduce((acc, dw) => acc + (dw.exercises?.length || 0), 0) || 0}
                  </span>
                  <span className="stat-label">Total Exercises</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {program?.assignedTeams?.length || 0}
                  </span>
                  <span className="stat-label">Teams Assigned</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="program-calendar">
            <Card>
              <h3>Workout Calendar</h3>
              <p className="calendar-hint">Click on a date to add or edit exercises</p>
              <Calendar
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                highlightedDates={getWorkoutDates()}
                minDate={program?.startDate ? new Date(program.startDate) : null}
                maxDate={program?.endDate ? new Date(program.endDate) : null}
              />
            </Card>
          </div>
        </div>

        <WorkoutEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedWorkout(null);
          }}
          workout={selectedWorkout}
          exercises={exercises}
          onSave={handleSaveWorkout}
        />
      </div>
    </div>
  );
};

export default EditWorkout;
