import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Dropdown from './Dropdown';
import api from '../../services/api';
import './WorkoutDayViewer.css';

const WorkoutDayViewer = ({
  isOpen,
  onClose,
  workout,
  exercises = [],
  onSave,
  onExerciseCreated,
  canEdit = false // If false, no edit button shown (for athletes)
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [dayWorkout, setDayWorkout] = useState({
    date: '',
    dayOfWeek: '',
    title: '',
    exercises: []
  });

  // Track if changes were made (for showing save button)
  const [hasChanges, setHasChanges] = useState(false);

  // Editing individual exercise state
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [newExercise, setNewExercise] = useState({
    exerciseId: '',
    exerciseName: '',
    notes: '',
    youtubeUrl: '',
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

  useEffect(() => {
    if (workout) {
      setDayWorkout(workout);
    }
  }, [workout]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setHasChanges(false);
      setEditingExerciseIndex(null);
      setEditingExercise(null);
    }
  }, [isOpen]);

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

  const handleSetConfigChange = (index, field, value) => {
    setNewExercise(prev => {
      const newConfigs = [...prev.setConfigs];
      newConfigs[index] = { ...newConfigs[index], [field]: value };
      return { ...prev, setConfigs: newConfigs };
    });
  };

  const addSetConfig = () => {
    setNewExercise(prev => ({
      ...prev,
      setConfigs: [...prev.setConfigs, { sets: '', reps: '', percentage: '', weight: '' }]
    }));
  };

  const removeSetConfig = (index) => {
    if (newExercise.setConfigs.length <= 1) return;
    setNewExercise(prev => ({
      ...prev,
      setConfigs: prev.setConfigs.filter((_, i) => i !== index)
    }));
  };

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
    const firstConfig = newExercise.setConfigs[0];
    if (!newExercise.exerciseName || !firstConfig.sets || !firstConfig.reps) {
      return;
    }

    const validConfigs = newExercise.setConfigs.filter(c => c.sets && c.reps).map(c => ({
      sets: parseInt(c.sets),
      reps: c.reps,
      percentage: c.percentage ? parseFloat(c.percentage) : null,
      weight: c.weight ? parseFloat(c.weight) : null
    }));

    const totalSets = validConfigs.reduce((sum, c) => sum + c.sets, 0);

    const exercise = {
      exerciseId: newExercise.exerciseId,
      exerciseName: newExercise.exerciseName,
      notes: newExercise.notes,
      youtubeUrl: newExercise.youtubeUrl,
      order: dayWorkout.exercises.length + 1,
      setConfigs: validConfigs,
      sets: totalSets,
      reps: validConfigs[0].reps,
      percentage: validConfigs[0].percentage,
      weight: validConfigs[0].weight
    };

    setDayWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));

    setNewExercise({
      exerciseId: '',
      exerciseName: '',
      notes: '',
      youtubeUrl: '',
      setConfigs: [{ sets: '', reps: '', percentage: '', weight: '' }]
    });
  };

  const handleRemoveExercise = (index) => {
    setDayWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // Start editing an individual exercise
  const handleStartEditExercise = (index) => {
    const exercise = dayWorkout.exercises[index];
    setEditingExerciseIndex(index);
    setEditingExercise({
      ...exercise,
      setConfigs: exercise.setConfigs && exercise.setConfigs.length > 0
        ? exercise.setConfigs.map(c => ({
            sets: c.sets?.toString() || '',
            reps: c.reps || '',
            percentage: c.percentage?.toString() || '',
            weight: c.weight?.toString() || ''
          }))
        : [{
            sets: exercise.sets?.toString() || '',
            reps: exercise.reps || '',
            percentage: exercise.percentage?.toString() || '',
            weight: exercise.weight?.toString() || ''
          }]
    });
  };

  // Cancel editing an exercise
  const handleCancelEditExercise = () => {
    setEditingExerciseIndex(null);
    setEditingExercise(null);
  };

  // Save edited exercise
  const handleSaveEditExercise = () => {
    if (!editingExercise) return;

    const validConfigs = editingExercise.setConfigs.filter(c => c.sets && c.reps).map(c => ({
      sets: parseInt(c.sets),
      reps: c.reps,
      percentage: c.percentage ? parseFloat(c.percentage) : null,
      weight: c.weight ? parseFloat(c.weight) : null
    }));

    if (validConfigs.length === 0) return;

    const totalSets = validConfigs.reduce((sum, c) => sum + c.sets, 0);

    const updatedExercise = {
      ...editingExercise,
      setConfigs: validConfigs,
      sets: totalSets,
      reps: validConfigs[0].reps,
      percentage: validConfigs[0].percentage,
      weight: validConfigs[0].weight
    };

    setDayWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === editingExerciseIndex ? updatedExercise : ex
      )
    }));

    setEditingExerciseIndex(null);
    setEditingExercise(null);
    setHasChanges(true);
  };

  // Handle editing exercise set config changes
  const handleEditSetConfigChange = (index, field, value) => {
    setEditingExercise(prev => {
      const newConfigs = [...prev.setConfigs];
      newConfigs[index] = { ...newConfigs[index], [field]: value };
      return { ...prev, setConfigs: newConfigs };
    });
  };

  // Add set config to editing exercise
  const handleEditAddSetConfig = () => {
    setEditingExercise(prev => ({
      ...prev,
      setConfigs: [...prev.setConfigs, { sets: '', reps: '', percentage: '', weight: '' }]
    }));
  };

  // Remove set config from editing exercise
  const handleEditRemoveSetConfig = (index) => {
    if (editingExercise.setConfigs.length <= 1) return;
    setEditingExercise(prev => ({
      ...prev,
      setConfigs: prev.setConfigs.filter((_, i) => i !== index)
    }));
  };

  const handleMoveExercise = (index, direction) => {
    const newExercises = [...dayWorkout.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newExercises.length) return;

    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    newExercises.forEach((ex, i) => {
      ex.order = i + 1;
    });

    setDayWorkout(prev => ({ ...prev, exercises: newExercises }));
  };

  // Drag and drop handlers (desktop only)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
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

    newExercises.forEach((ex, i) => {
      ex.order = i + 1;
    });

    setDayWorkout(prev => ({ ...prev, exercises: newExercises }));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    onSave(dayWorkout);
    setIsEditing(false);
  };

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
        if (onExerciseCreated) {
          onExerciseCreated(createdExercise);
        }
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

  const getExercisePrescription = (exercise) => {
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      return formatSetConfigs(exercise.setConfigs);
    }
    let prescription = `${exercise.sets} x ${exercise.reps}`;
    if (exercise.percentage) prescription += ` @ ${exercise.percentage}%`;
    if (exercise.weight) prescription += ` @ ${exercise.weight} lbs`;
    return prescription;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${formatDate(dayWorkout.date)}`}
      size="lg"
      footer={
        isEditing ? (
          <div className="modal-footer-with-add">
            <Button
              variant="outline"
              onClick={() => document.getElementById('add-exercise-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              + Add Exercise
            </Button>
            <div className="modal-footer-right">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel Edit</Button>
              <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        ) : hasChanges ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="workout-day-viewer">
        {/* Edit button for coaches */}
        {canEdit && !isEditing && (
          <div className="viewer-header">
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit This Workout
            </Button>
          </div>
        )}


        {/* View Mode - Show exercises with edit/delete options for coaches */}
        {!isEditing && (
          <div className="viewer-exercises">
            {dayWorkout.exercises && dayWorkout.exercises.length > 0 ? (
              dayWorkout.exercises.map((exercise, index) => (
                <div key={index} className="viewer-exercise-item">
                  {editingExerciseIndex === index && editingExercise ? (
                    // Inline edit form for this exercise
                    <div className="viewer-exercise-edit-form">
                      <div className="edit-form-header">
                        <span className="edit-form-title">Editing: {editingExercise.exerciseName}</span>
                      </div>
                      <div className="edit-set-configs">
                        {editingExercise.setConfigs.map((config, configIndex) => (
                          <div key={configIndex} className="edit-set-config-row">
                            <Input
                              label="Sets"
                              className={configIndex === 0 ? '' : 'hide-label-desktop'}
                              type="number"
                              value={config.sets}
                              onChange={(e) => handleEditSetConfigChange(configIndex, 'sets', e.target.value)}
                              placeholder="3"
                            />
                            <Input
                              label="Reps"
                              className={configIndex === 0 ? '' : 'hide-label-desktop'}
                              value={config.reps}
                              onChange={(e) => handleEditSetConfigChange(configIndex, 'reps', e.target.value)}
                              placeholder="5"
                            />
                            <Input
                              label="%"
                              className={configIndex === 0 ? '' : 'hide-label-desktop'}
                              type="number"
                              value={config.percentage}
                              onChange={(e) => handleEditSetConfigChange(configIndex, 'percentage', e.target.value)}
                              placeholder="75"
                            />
                            <Input
                              label="lbs"
                              className={configIndex === 0 ? '' : 'hide-label-desktop'}
                              type="number"
                              value={config.weight}
                              onChange={(e) => handleEditSetConfigChange(configIndex, 'weight', e.target.value)}
                              placeholder="135"
                            />
                            {editingExercise.setConfigs.length > 1 && (
                              <button
                                type="button"
                                className="edit-remove-config-btn"
                                onClick={() => handleEditRemoveSetConfig(configIndex)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="edit-add-config-btn"
                          onClick={handleEditAddSetConfig}
                        >
                          + Add Set Row
                        </button>
                      </div>
                      <Input
                        label="Notes"
                        value={editingExercise.notes || ''}
                        onChange={(e) => setEditingExercise(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes"
                      />
                      <div className="edit-form-actions">
                        <Button variant="ghost" size="sm" onClick={handleCancelEditExercise}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSaveEditExercise}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Normal display
                    <>
                      <div className="viewer-exercise-number">{index + 1}</div>
                      <div className="viewer-exercise-content">
                        <div className="viewer-exercise-header">
                          <span className="viewer-exercise-name">{exercise.exerciseName}</span>
                          {exercise.youtubeUrl && (
                            <a
                              href={exercise.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="viewer-video-link"
                            >
                              Watch Demo
                            </a>
                          )}
                        </div>
                        <div className="viewer-exercise-prescription">
                          {getExercisePrescription(exercise)}
                        </div>
                        {exercise.notes && (
                          <p className="viewer-exercise-notes">{exercise.notes}</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="viewer-exercise-actions">
                          <button
                            className="viewer-action-btn edit"
                            onClick={() => handleStartEditExercise(index)}
                            title="Edit exercise"
                          >
                            ✎
                          </button>
                          <button
                            className="viewer-action-btn delete"
                            onClick={() => handleRemoveExercise(index)}
                            title="Remove exercise"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="viewer-no-exercises">
                <p>No exercises scheduled for this day</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode - Show editable list with add form */}
        {isEditing && (
          <div className="editor-section">
            <h4>Exercises</h4>

            {dayWorkout.exercises.length > 0 && (
              <div className="editor-exercises-list">
                {dayWorkout.exercises.map((ex, index) => (
                  <div
                    key={index}
                    className={`editor-exercise-row ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <span className="editor-drag-handle" title="Drag to reorder">⋮⋮</span>
                    <span className="editor-exercise-order">{index + 1}</span>
                    <div className="editor-exercise-details">
                      <span className="editor-exercise-name">{ex.exerciseName}</span>
                      <span className="editor-exercise-prescription">
                        {getExercisePrescription(ex)}
                      </span>
                      {ex.notes && <span className="editor-exercise-notes">{ex.notes}</span>}
                    </div>
                    <div className="editor-exercise-actions">
                      <button
                        className="editor-action-btn move-btn"
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="editor-action-btn move-btn"
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === dayWorkout.exercises.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="editor-action-btn delete"
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

            <div id="add-exercise-section" className="add-exercise-form">
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
        )}
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

export default WorkoutDayViewer;
