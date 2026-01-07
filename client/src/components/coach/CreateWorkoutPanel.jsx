import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import './CreateWorkoutPanel.css';

const CreateWorkoutPanel = ({ workoutPrograms = [], onCreateNew }) => {
  const navigate = useNavigate();

  const handleProgramClick = (programId) => {
    navigate(`/coach/workouts/${programId}`);
  };

  return (
    <div className="create-panel-container">
      <div className="panel-header">
        <h3>Team Workouts</h3>
        <Button variant="primary" size="sm" onClick={onCreateNew}>
          + New Program
        </Button>
      </div>

      <div className="programs-list">
        {workoutPrograms.length > 0 ? (
          workoutPrograms.map(program => (
            <div
              key={program.id}
              className="program-item"
              onClick={() => handleProgramClick(program.id)}
            >
              <span className="program-name">{program.programName}</span>
              <svg
                className="program-arrow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))
        ) : (
          <div className="no-programs">
            <p>No workout programs yet</p>
            <p className="hint">Create your first program to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWorkoutPanel;
