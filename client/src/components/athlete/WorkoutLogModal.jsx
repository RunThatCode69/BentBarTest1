import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import api from '../../services/api';
import './WorkoutLogModal.css';

const WorkoutLogModal = ({
  isOpen,
  onClose,
  workout,
  date
}) => {
  const [logData, setLogData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [expandedExercises, setExpandedExercises] = useState({});

  // Initialize log data when workout changes
  useEffect(() => {
    if (isOpen && workout) {
      if (workout.exercises && workout.exercises.length > 0) {
        initializeLogData();
      } else {
        setLogData([]);
        setLoading(false);
      }
    }
  }, [workout, isOpen]);

  const initializeLogData = async () => {
    if (!workout || !workout.exercises) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Try to fetch existing log for this date
    try {
      const dateStr = new Date(date).toISOString().split('T')[0];
      const response = await api.get(`/athlete/workout-log/${dateStr}`);

      if (response.data.workoutLog && response.data.workoutLog.exercises) {
        // Merge existing log with workout exercises
        const existingLog = response.data.workoutLog;
        const mergedData = workout.exercises.map(exercise => {
          const existingExercise = existingLog.exercises.find(
            e => e.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase()
          );

          if (existingExercise && existingExercise.sets) {
            return {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              youtubeUrl: exercise.youtubeUrl,
              prescription: getPrescriptionText(exercise),
              sets: existingExercise.sets.map((set, idx) => ({
                setNumber: set.setNumber || idx + 1,
                prescribedReps: set.prescribedReps || getPrescribedReps(exercise, idx),
                prescribedWeight: set.prescribedWeight || getCalculatedWeight(exercise, idx),
                completedReps: set.completedReps,
                completedWeight: set.completedWeight
              }))
            };
          }

          // No existing log, create empty sets
          return createExerciseLogEntry(exercise);
        });

        setLogData(mergedData);
      } else {
        // No existing log, initialize from workout
        const initialData = workout.exercises.map(exercise => createExerciseLogEntry(exercise));
        setLogData(initialData);
      }
    } catch (err) {
      // No existing log, initialize from workout
      const initialData = workout.exercises.map(exercise => createExerciseLogEntry(exercise));
      setLogData(initialData);
    }

    setLoading(false);
  };

  const createExerciseLogEntry = (exercise) => {
    // Calculate total sets from setConfigs or use sets field
    let totalSets = exercise.sets || 3;
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      totalSets = exercise.setConfigs.reduce((sum, config) => sum + (config.sets || 0), 0);
    }

    // Create individual set entries
    const sets = [];
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      let setNumber = 1;
      exercise.setConfigs.forEach(config => {
        for (let i = 0; i < (config.sets || 1); i++) {
          sets.push({
            setNumber: setNumber++,
            prescribedReps: config.reps || '',
            prescribedWeight: calculateWeight(exercise, config),
            prescribedPercentage: config.percentage,
            completedReps: null,
            completedWeight: null
          });
        }
      });
    } else {
      // Simple sets/reps structure
      for (let i = 0; i < totalSets; i++) {
        sets.push({
          setNumber: i + 1,
          prescribedReps: exercise.reps || '',
          prescribedWeight: exercise.calculatedWeight || exercise.weight,
          prescribedPercentage: exercise.percentage,
          completedReps: null,
          completedWeight: null
        });
      }
    }

    return {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      youtubeUrl: exercise.youtubeUrl,
      prescription: getPrescriptionText(exercise),
      sets
    };
  };

  const calculateWeight = (exercise, config) => {
    // If exercise has calculatedWeight from athlete's 1RM, use that
    if (exercise.calculatedWeight && config.percentage) {
      // Recalculate based on this config's percentage
      const oneRM = exercise.calculatedWeight / ((exercise.setConfigs?.[0]?.percentage || exercise.percentage || 100) / 100);
      return Math.round(oneRM * (config.percentage / 100));
    }
    return config.weight || exercise.calculatedWeight || null;
  };

  const getPrescriptionText = (exercise) => {
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      return exercise.setConfigs.map(config => {
        let str = `${config.sets}x${config.reps}`;
        if (config.percentage) str += ` @${config.percentage}%`;
        return str;
      }).join(', ');
    }
    let text = `${exercise.sets} x ${exercise.reps}`;
    if (exercise.percentage) text += ` @ ${exercise.percentage}%`;
    return text;
  };

  const getPrescribedReps = (exercise, setIndex) => {
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      let currentSet = 0;
      for (const config of exercise.setConfigs) {
        if (setIndex < currentSet + config.sets) {
          return config.reps;
        }
        currentSet += config.sets;
      }
    }
    return exercise.reps || '';
  };

  const getCalculatedWeight = (exercise, setIndex) => {
    if (exercise.calculatedWeight) return exercise.calculatedWeight;
    if (exercise.setConfigs && exercise.setConfigs.length > 0) {
      let currentSet = 0;
      for (const config of exercise.setConfigs) {
        if (setIndex < currentSet + config.sets) {
          return config.weight || null;
        }
        currentSet += config.sets;
      }
    }
    return exercise.weight || null;
  };

  // Calculate estimated 1RM using Brzycki formula
  const calculateEstimated1RM = (weight, reps) => {
    if (!weight || !reps || reps <= 0 || reps > 12) return null;
    // Brzycki formula: 1RM = weight / (1.0278 - (0.0278 * reps))
    const estimated = weight / (1.0278 - (0.0278 * reps));
    return Math.round(estimated);
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    setLogData(prev => {
      const newData = [...prev];
      newData[exerciseIndex] = {
        ...newData[exerciseIndex],
        sets: newData[exerciseIndex].sets.map((set, idx) =>
          idx === setIndex
            ? { ...set, [field]: value === '' ? null : parseFloat(value) }
            : set
        )
      };
      return newData;
    });
    setSaveMessage('');
  };

  const toggleExercise = (index) => {
    setExpandedExercises(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const dateStr = new Date(date).toISOString();

      await api.post('/athlete/workout-log', {
        date: dateStr,
        workoutProgramId: workout.programId,
        exercises: logData.map(ex => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          totalSetsCompleted: ex.sets.filter(s => s.completedWeight !== null || s.completedReps !== null).length
        }))
      });

      setSaveMessage('Saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Failed to save workout log:', err);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasAnyData = logData.some(ex =>
    ex.sets.some(s => s.completedWeight !== null || s.completedReps !== null)
  );

  if (!workout) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(date)}
      size="lg"
      footer={
        <div className="workout-log-footer">
          {saveMessage && <span className={`save-message ${saveMessage === 'Saved!' ? 'success' : 'error'}`}>{saveMessage}</span>}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={!hasAnyData}>
            Save Workout
          </Button>
        </div>
      }
    >
      <div className="workout-log-modal">
        {loading ? (
          <div className="workout-log-loading">Loading...</div>
        ) : (
          <>
            {workout.programName && (
              <div className="workout-log-program">{workout.programName}</div>
            )}

            <div className="workout-log-exercises">
              {logData.map((exercise, exerciseIndex) => {
                const isExpanded = expandedExercises[exerciseIndex];
                const completedSets = exercise.sets.filter(s => s.completedWeight !== null || s.completedReps !== null).length;

                return (
                  <div key={exerciseIndex} className={`workout-log-exercise ${isExpanded ? 'expanded' : ''}`}>
                    <div
                      className="exercise-header clickable"
                      onClick={() => toggleExercise(exerciseIndex)}
                    >
                      <div className="exercise-info">
                        <span className="exercise-number">{exerciseIndex + 1}</span>
                        <div className="exercise-name-section">
                          <span className="exercise-name">{exercise.exerciseName}</span>
                          <span className="exercise-prescription">{exercise.prescription}</span>
                        </div>
                      </div>
                      <div className="exercise-header-right">
                        {completedSets > 0 && (
                          <span className="sets-completed">{completedSets}/{exercise.sets.length}</span>
                        )}
                        {exercise.youtubeUrl && (
                          <a
                            href={exercise.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="exercise-video-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Demo
                          </a>
                        )}
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="sets-table">
                        <div className="sets-header">
                          <span className="set-col">Set</span>
                          <span className="target-col">Target</span>
                          <span className="input-col">Weight (lbs)</span>
                          <span className="input-col">Reps</span>
                          <span className="est-col">Est. 1RM</span>
                        </div>

                        {exercise.sets.map((set, setIndex) => {
                          const est1RM = calculateEstimated1RM(set.completedWeight, set.completedReps);
                          return (
                            <div key={setIndex} className="set-row">
                              <span className="set-col set-number">{set.setNumber}</span>
                              <span className="target-col">
                                {set.prescribedWeight ? `${set.prescribedWeight} lbs` : ''}
                                {set.prescribedPercentage ? ` @${set.prescribedPercentage}%` : ''}
                                {' x '}{set.prescribedReps}
                              </span>
                              <div className="input-col">
                                <input
                                  type="number"
                                  className="log-input"
                                  placeholder={set.prescribedWeight || '—'}
                                  value={set.completedWeight ?? ''}
                                  onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'completedWeight', e.target.value)}
                                />
                              </div>
                              <div className="input-col">
                                <input
                                  type="number"
                                  className="log-input"
                                  placeholder={set.prescribedReps || '—'}
                                  value={set.completedReps ?? ''}
                                  onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'completedReps', e.target.value)}
                                />
                              </div>
                              <span className="est-col">
                                {est1RM ? (
                                  <span className="est-1rm-value">~{est1RM} lbs</span>
                                ) : (
                                  <span className="est-1rm-empty">—</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {logData.length === 0 && (
                <div className="no-exercises">
                  <p>No exercises scheduled for this day</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WorkoutLogModal;
