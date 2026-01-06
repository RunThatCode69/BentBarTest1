import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import './WorkoutEditor.css';

const WorkoutEditor = ({ isOpen, onClose, workout, exercises = [], onSave }) => {
  const [dayWorkout, setDayWorkout] = useState({
    date: '',
    dayOfWeek: '',
    title: '',
    exercises: []
  });

  const [newExercise, setNewExercise] = useState({
    exerciseId: '',
    exerciseName: '',
    sets: '',
    reps: '',
    percentage: '',
    weight: '',
    notes: '',
    youtubeUrl: ''
  });

  useEffect(() => {
    if (workout) {
      setDayWorkout(workout);
    }
  }, [workout]);

  const handleExerciseSelect = (e) => {
    const selectedId = e.target.value;
    const selectedExercise = exercises.find(ex => ex._id === selectedId);

    if (selectedExercise) {
      setNewExercise(prev => ({
        ...prev,
        exerciseId: selectedExercise._id,
        exerciseName: selectedExercise.name,
        youtubeUrl: selectedExercise.youtubeUrl || ''
      }));
    }
  };

  const handleAddExercise = () => {
    if (!newExercise.exerciseName || !newExercise.sets || !newExercise.reps) {
      return;
    }

    const exercise = {
      ...newExercise,
      order: dayWorkout.exercises.length + 1,
      sets: parseInt(newExercise.sets),
      percentage: newExercise.percentage ? parseFloat(newExercise.percentage) : null,
      weight: newExercise.weight ? parseFloat(newExercise.weight) : null
    };

    setDayWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));

    // Reset form
    setNewExercise({
      exerciseId: '',
      exerciseName: '',
      sets: '',
      reps: '',
      percentage: '',
      weight: '',
      notes: '',
      youtubeUrl: ''
    });
  };

  const handleRemoveExercise = (index) => {
    setDayWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleMoveExercise = (index, direction) => {
    const newExercises = [...dayWorkout.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newExercises.length) return;

    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];

    // Update order
    newExercises.forEach((ex, i) => {
      ex.order = i + 1;
    });

    setDayWorkout(prev => ({ ...prev, exercises: newExercises }));
  };

  const handleSave = () => {
    onSave(dayWorkout);
  };

  const exerciseOptions = exercises.map(ex => ({
    value: ex._id,
    label: ex.name
  }));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Workout for ${formatDate(dayWorkout.date)}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Workout</Button>
        </>
      }
    >
      <div className="workout-editor">
        <Input
          label="Workout Title (optional)"
          value={dayWorkout.title}
          onChange={(e) => setDayWorkout(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Lower Body Strength"
        />

        <div className="exercises-section">
          <h4>Exercises</h4>

          {dayWorkout.exercises.length > 0 && (
            <div className="exercises-list">
              {dayWorkout.exercises.map((ex, index) => (
                <div key={index} className="exercise-row">
                  <span className="exercise-order">{index + 1}</span>
                  <div className="exercise-details">
                    <span className="name">{ex.exerciseName}</span>
                    <span className="prescription">
                      {ex.sets} x {ex.reps}
                      {ex.percentage && ` @ ${ex.percentage}%`}
                      {ex.weight && ` @ ${ex.weight} lbs`}
                    </span>
                    {ex.notes && <span className="notes">{ex.notes}</span>}
                  </div>
                  <div className="exercise-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleMoveExercise(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleMoveExercise(index, 'down')}
                      disabled={index === dayWorkout.exercises.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleRemoveExercise(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="add-exercise-form">
            <h5>Add Exercise</h5>

            <Dropdown
              label="Exercise"
              value={newExercise.exerciseId}
              onChange={handleExerciseSelect}
              options={exerciseOptions}
              placeholder="Select an exercise"
            />

            <div className="exercise-inputs">
              <Input
                label="Sets"
                type="number"
                value={newExercise.sets}
                onChange={(e) => setNewExercise(prev => ({ ...prev, sets: e.target.value }))}
                placeholder="5"
                min="1"
              />
              <Input
                label="Reps"
                value={newExercise.reps}
                onChange={(e) => setNewExercise(prev => ({ ...prev, reps: e.target.value }))}
                placeholder="5 or 8-10"
              />
              <Input
                label="% of 1RM"
                type="number"
                value={newExercise.percentage}
                onChange={(e) => setNewExercise(prev => ({ ...prev, percentage: e.target.value }))}
                placeholder="75"
                min="0"
                max="120"
              />
              <Input
                label="Fixed Weight"
                type="number"
                value={newExercise.weight}
                onChange={(e) => setNewExercise(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="135"
                hint="Optional"
              />
            </div>

            <Input
              label="Notes"
              value={newExercise.notes}
              onChange={(e) => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes for athletes"
            />

            <Input
              label="YouTube URL"
              value={newExercise.youtubeUrl}
              onChange={(e) => setNewExercise(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />

            <Button
              variant="outline"
              onClick={handleAddExercise}
              disabled={!newExercise.exerciseName || !newExercise.sets || !newExercise.reps}
            >
              Add Exercise
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WorkoutEditor;
