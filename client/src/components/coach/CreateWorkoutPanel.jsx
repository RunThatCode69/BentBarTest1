import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import './CreateWorkoutPanel.css';

const CreateWorkoutPanel = ({ workoutPrograms = [], teams = [], onCreateNew }) => {
  const navigate = useNavigate();

  const handleProgramClick = (program) => {
    // Navigate to workouts page with team and program pre-selected
    const teamId = program.assignedTeams?.[0] || 'unassigned';
    navigate(`/coach/workouts?team=${teamId}&program=${program.id}`);
  };

  // Get team name from team ID
  const getTeamName = (teamIds) => {
    if (!teamIds || teamIds.length === 0) return 'Unassigned';
    const teamId = teamIds[0]; // Get first assigned team
    const team = teams.find(t => t.id === teamId || t.id === teamId?.toString());
    return team ? team.teamName : 'Unassigned';
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
              onClick={() => handleProgramClick(program)}
            >
              <div className="program-info">
                <span className="program-name">{program.programName}</span>
                <span className="program-team">{getTeamName(program.assignedTeams)}</span>
              </div>
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
