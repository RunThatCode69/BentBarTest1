import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import api from '../../services/api';
import './WorkoutEditor.css';

const WorkoutEditor = ({ isOpen, onClose, workout, exercises = [], onSave, onChange, onExerciseCreated }) => {
  const [dayWorkout, setDayWorkout] = useState({
    date: '',
    dayOfWeek: '',
    exercises: []
  });

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [newExercise, setNewExercise] = useState({
    exerciseId: '',
    exerciseName: '',
    notes: '',
    youtubeUrl: '',
    // Complex set programming - array of set configurations
    setConfigs: [{ sets: '', reps: '', percentage: '', weight: '' }]
  });

  // Create Exercise Modal state
  const [showCreateExerciseModal, setShowCreateExerciseModal] = useState(false);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [newExerciseForm, setNewExerciseForm] = useState({
    name: '',
    category: '',
    youtubeUrl: '',
    description: ''
  });

  // Only sync from props when modal opens (isOpen changes to true)
  // Don't sync on every workout prop change to avoid overwriting local edits
  useEffect(() => {
    if (isOpen && workout) {
      setDayWorkout(workout);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to update workout and notify parent
  const updateWorkout = (updater) => {
    setDayWorkout(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      // Notify parent of change for live calendar update
      if (onChange) {
        onChange(updated);
      }
      return updated;
    });
  };

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

  // Handle set configuration changes
  const handleSetConfigChange = (index, field, value) => {
    setNewExercise(prev => {
      const newConfigs = [...prev.setConfigs];
      newConfigs[index] = { ...newConfigs[index], [field]: value };
      return { ...prev, setConfigs: newConfigs };
    });
  };

  // Add another set configuration row
  const addSetConfig = () => {
    setNewExercise(prev => ({
      ...prev,
      setConfigs: [...prev.setConfigs, { sets: '', reps: '', percentage: '', weight: '' }]
    }));
  };

  // Remove a set configuration row
  const removeSetConfig = (index) => {
    if (newExercise.setConfigs.length <= 1) return;
    setNewExercise(prev => ({
      ...prev,
      setConfigs: prev.setConfigs.filter((_, i) => i !== index)
    }));
  };

  // Format set configurations for display
  const formatSetConfigs = (setConfigs) => {
    if (!setConfigs || setConfigs.length === 0) return '';
    return setConfigs.map(config => {
      let str = `${config.sets}x${config.reps}`;
      if (config.percentage) str += ` @${config.percentage}%`;
      if (config.weight) str += ` @${config.weight}lbs`;
      return str;
    }).join(', ');
  };

  const handleAddExercise = () => {
    // Validate at least first set config has sets and reps
    const firstConfig = newExercise.setConfigs[0];
    if (!newExercise.exerciseName || !firstConfig.sets || !firstConfig.reps) {
      return;
    }

    // Filter out empty set configs and process them
    const validConfigs = newExercise.setConfigs.filter(c => c.sets && c.reps).map(c => ({
      sets: parseInt(c.sets),
      reps: c.reps,
      percentage: c.percentage ? parseFloat(c.percentage) : null,
      weight: c.weight ? parseFloat(c.weight) : null
    }));

    // Calculate total sets for backwards compatibility
    const totalSets = validConfigs.reduce((sum, c) => sum + c.sets, 0);

    const exercise = {
      exerciseId: newExercise.exerciseId,
      exerciseName: newExercise.exerciseName,
      notes: newExercise.notes,
      youtubeUrl: newExercise.youtubeUrl,
      order: dayWorkout.exercises.length + 1,
      // Store complex set configs
      setConfigs: validConfigs,
      // Backwards compatibility fields (uses first config's values)
      sets: totalSets,
      reps: validConfigs[0].reps,
      percentage: validConfigs[0].percentage,
      weight: validConfigs[0].weight
    };

    updateWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));

    // Reset form
    setNewExercise({
      exerciseId: '',
      exerciseName: '',
      notes: '',
      youtubeUrl: '',
      setConfigs: [{ sets: '', reps: '', percentage: '', weight: '' }]
    });
  };

  const handleRemoveExercise = (index) => {
    updateWorkout(prev => ({
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

    updateWorkout(prev => ({ ...prev, exercises: newExercises }));
  };

  // Drag and drop handlers (desktop only)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight delay to allow the drag image to be captured
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newExercises = [...dayWorkout.exercises];
    const [draggedItem] = newExercises.splice(draggedIndex, 1);
    newExercises.splice(dropIndex, 0, draggedItem);

    // Update order numbers
    newExercises.forEach((ex, i) => {
      ex.order = i + 1;
    });

    updateWorkout(prev => ({ ...prev, exercises: newExercises }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(dayWorkout);
  };

  // Handle creating a new exercise
  const handleCreateExercise = async () => {
    if (!newExerciseForm.name.trim()) return;

    setCreatingExercise(true);
    try {
      const response = await api.post('/exercises', {
        name: newExerciseForm.name,
        category: newExerciseForm.category || 'accessory',
        youtubeUrl: newExerciseForm.youtubeUrl || null,
        description: newExerciseForm.description || null
      });

      if (response.data.success || response.data.exercise) {
        const createdExercise = response.data.exercise;
        // Notify parent to refresh exercises list
        if (onExerciseCreated) {
          onExerciseCreated(createdExercise);
        }
        // Pre-select the newly created exercise
        setNewExercise(prev => ({
          ...prev,
          exerciseId: createdExercise._id,
          exerciseName: createdExercise.name,
          youtubeUrl: createdExercise.youtubeUrl || ''
        }));
        setShowCreateExerciseModal(false);
        setNewExerciseForm({ name: '', category: '', youtubeUrl: '', description: '' });
      }
    } catch (err) {
      console.error('Failed to create exercise:', err);
      alert('Failed to create exercise. Please try again.');
    } finally {
      setCreatingExercise(false);
    }
  };

  const exerciseOptions = exercises.map(ex => ({
    value: ex._id,
    label: ex.name
  }));

  const categoryOptions = [
    { value: 'upper_body', label: 'Upper Body' },
    { value: 'lower_body', label: 'Lower Body' },
    { value: 'olympic', label: 'Olympic Lifts' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio/Conditioning' },
    { value: 'accessory', label: 'Accessory' }
  ];

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
        <div className="exercises-section">
          <h4>Exercises</h4>

          {dayWorkout.exercises.length > 0 && (
            <div className="exercises-list">
              {dayWorkout.exercises.map((ex, index) => (
                <div
                  key={index}
                  className={`exercise-row ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
                  <span className="exercise-order">{index + 1}</span>
                  <div className="exercise-details">
                    <span className="name">{ex.exerciseName}</span>
                    <span className="prescription">
                      {ex.setConfigs && ex.setConfigs.length > 0
                        ? formatSetConfigs(ex.setConfigs)
                        : `${ex.sets} x ${ex.reps}${ex.percentage ? ` @ ${ex.percentage}%` : ''}${ex.weight ? ` @ ${ex.weight} lbs` : ''}`
                      }
                    </span>
                    {ex.notes && <span className="notes">{ex.notes}</span>}
                  </div>
                  <div className="exercise-actions">
                    <button
                      className="action-btn move-btn"
                      onClick={() => handleMoveExercise(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      className="action-btn move-btn"
                      onClick={() => handleMoveExercise(index, 'down')}
                      disabled={index === dayWorkout.exercises.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleRemoveExercise(index)}
                      title="Remove exercise"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="add-exercise-form">
            <div className="add-exercise-header">
              <h5>Add Exercise</h5>
              <button
                type="button"
                className="create-exercise-link"
                onClick={() => setShowCreateExerciseModal(true)}
              >
                + Create New Exercise
              </button>
            </div>

            <Dropdown
              label="Exercise"
              value={newExercise.exerciseId}
              onChange={handleExerciseSelect}
              options={exerciseOptions}
              placeholder="Select an exercise"
            />

            <div className="set-configs-section">
              <div className="set-configs-header">
                <span className="set-configs-label">Set Programming</span>
                <button
                  type="button"
                  className="add-set-config-btn"
                  onClick={addSetConfig}
                >
                  + Add Set
                </button>
              </div>

              {newExercise.setConfigs.map((config, index) => (
                <div key={index} className="set-config-row">
                  <div className="exercise-inputs">
                    <Input
                      label={index === 0 ? "Sets" : ""}
                      type="number"
                      value={config.sets}
                      onChange={(e) => handleSetConfigChange(index, 'sets', e.target.value)}
                      placeholder="3"
                      min="1"
                    />
                    <Input
                      label={index === 0 ? "Reps" : ""}
                      value={config.reps}
                      onChange={(e) => handleSetConfigChange(index, 'reps', e.target.value)}
                      placeholder="5 or 8-10"
                    />
                    <Input
                      label={index === 0 ? "% of 1RM" : ""}
                      type="number"
                      value={config.percentage}
                      onChange={(e) => handleSetConfigChange(index, 'percentage', e.target.value)}
                      placeholder="75"
                      min="0"
                      max="120"
                    />
                    <Input
                      label={index === 0 ? "Weight (lbs)" : ""}
                      type="number"
                      value={config.weight}
                      onChange={(e) => handleSetConfigChange(index, 'weight', e.target.value)}
                      placeholder="135"
                    />
                  </div>
                  {newExercise.setConfigs.length > 1 && (
                    <button
                      type="button"
                      className="remove-set-config-btn"
                      onClick={() => removeSetConfig(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <p className="set-config-hint">
                Add multiple rows for complex programming (e.g., 3@50%, 3@60%, 3@70%)
              </p>
            </div>

            <Input
              label="Notes"
              value={newExercise.notes}
              onChange={(e) => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes for athletes"
            />

            <Input
              label="Video Example"
              value={newExercise.youtubeUrl}
              onChange={(e) => setNewExercise(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />

            <Button
              variant="outline"
              onClick={handleAddExercise}
              disabled={!newExercise.exerciseName || !newExercise.setConfigs[0].sets || !newExercise.setConfigs[0].reps}
            >
              Add Exercise
            </Button>
          </div>
        </div>
      </div>

      {/* Create Exercise Modal */}
      <Modal
        isOpen={showCreateExerciseModal}
        onClose={() => setShowCreateExerciseModal(false)}
        title="Create New Exercise"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateExerciseModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateExercise} loading={creatingExercise}>Create Exercise</Button>
          </>
        }
      >
        <Input
          label="Exercise Name"
          value={newExerciseForm.name}
          onChange={(e) => setNewExerciseForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Barbell Row"
          autoFocus
          required
        />
        <Dropdown
          label="Category"
          value={newExerciseForm.category}
          onChange={(e) => setNewExerciseForm(prev => ({ ...prev, category: e.target.value }))}
          options={categoryOptions}
          placeholder="Select a category"
        />
        <Input
          label="Video Example URL"
          value={newExerciseForm.youtubeUrl}
          onChange={(e) => setNewExerciseForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
          placeholder="https://youtube.com/watch?v=..."
        />
        <Input
          label="Description"
          value={newExerciseForm.description}
          onChange={(e) => setNewExerciseForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the exercise"
        />
      </Modal>
    </Modal>
  );
};

export default WorkoutEditor;
