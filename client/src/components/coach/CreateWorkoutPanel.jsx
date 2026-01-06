import React from 'react';
import Button from '../common/Button';
import './CreateWorkoutPanel.css';

const CreateWorkoutPanel = ({ teams = [], onCreateNew }) => {
  return (
    <div className="create-panel-container">
      <div className="panel-header">
        <h3>Create New Workout Program</h3>
      </div>

      <div className="create-content">
        <div className="create-main">
          <div className="create-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h4>Design Your Training Program</h4>
          <p>Create a customized workout schedule with exercises, sets, reps, and percentages.</p>
          <Button variant="primary" onClick={onCreateNew}>
            Create New Program
          </Button>
        </div>

        <div className="create-sidebar">
          <h5>Assign to Teams</h5>
          <div className="team-list">
            {teams.map(team => (
              <div key={team.id} className="team-item">
                <span className="team-name">{team.teamName}</span>
                <span className="team-sport">{team.sport}</span>
              </div>
            ))}
          </div>
          {teams.length === 0 && (
            <p className="no-teams">No teams created yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWorkoutPanel;
