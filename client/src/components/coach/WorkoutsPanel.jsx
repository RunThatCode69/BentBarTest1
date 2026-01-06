import React from 'react';
import './WorkoutsPanel.css';

const WorkoutsPanel = ({ workouts = [], teams = [], onViewAll }) => {
  const today = new Date();

  const formatDate = (date, index) => {
    const d = new Date(today);
    d.setDate(d.getDate() + index);

    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get workouts for the next 3 days
  const getWorkoutsForDay = (dayOffset) => {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    return workouts.filter(workout => {
      return workout.workouts?.some(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === targetDate.getTime();
      });
    });
  };

  // Get exercises for a specific day from all workouts
  const getExercisesForDay = (dayOffset) => {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    targetDate.setHours(0, 0, 0, 0);

    const exercises = [];
    workouts.forEach(workout => {
      workout.workouts?.forEach(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        if (workoutDate.getTime() === targetDate.getTime()) {
          w.exercises?.forEach(ex => {
            exercises.push({
              ...ex,
              programName: workout.programName
            });
          });
        }
      });
    });

    return exercises;
  };

  return (
    <div className="workouts-panel-container" onClick={onViewAll}>
      <div className="panel-header">
        <h3>Upcoming Workouts</h3>
        <span className="view-all">View Calendar →</span>
      </div>

      <div className="workouts-preview">
        {[0, 1, 2].map(dayOffset => {
          const exercises = getExercisesForDay(dayOffset);

          return (
            <div key={dayOffset} className="day-column">
              <div className="day-header">
                <span className={`day-label ${dayOffset === 0 ? 'today' : ''}`}>
                  {formatDate(today, dayOffset)}
                </span>
              </div>
              <div className="day-exercises">
                {exercises.length === 0 ? (
                  <span className="rest-day">Rest Day</span>
                ) : (
                  exercises.slice(0, 4).map((ex, index) => (
                    <div key={index} className="exercise-preview">
                      <span className="exercise-name">{ex.exerciseName}</span>
                      <span className="exercise-details">
                        {ex.sets}x{ex.reps} {ex.percentage ? `@ ${ex.percentage}%` : ''}
                      </span>
                    </div>
                  ))
                )}
                {exercises.length > 4 && (
                  <span className="more-exercises">+{exercises.length - 4} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutsPanel;
