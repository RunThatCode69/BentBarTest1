import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import api from '../../services/api';
import './CreateWorkoutPanel.css';

const CreateWorkoutPanel = ({ workoutPrograms = [], teams = [], onCreateNew, onProgramDeleted, onProgramUpdated }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Assignment popup state
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);

  const handleProgramClick = (program) => {
    // Show assignment popup instead of navigating
    setSelectedProgram(program);
    setShowAssignPopup(true);
  };

  const handleViewProgram = (e, program) => {
    e.stopPropagation();
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

  const handleDeleteClick = (e, program) => {
    e.stopPropagation(); // Prevent navigation
    setProgramToDelete(program);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/workouts/${programToDelete.id}`);
      setShowDeleteModal(false);
      setProgramToDelete(null);
      if (onProgramDeleted) {
        onProgramDeleted(programToDelete.id);
      }
    } catch (err) {
      console.error('Failed to delete program:', err);
      alert('Failed to delete program. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Check if program is assigned to a specific team
  const isProgramAssignedToTeam = (program, teamId) => {
    return program?.assignedTeams?.includes(teamId) || false;
  };

  // Handle team assignment toggle
  const handleTeamAssignment = async (teamId) => {
    if (!selectedProgram || savingAssignment) return;

    setSavingAssignment(true);
    try {
      const isCurrentlyAssigned = isProgramAssignedToTeam(selectedProgram, teamId);

      // If assigning, use this team; if unassigning, use null
      const newProgramId = isCurrentlyAssigned ? null : selectedProgram.id;

      await api.put(`/coach/teams/${teamId}/program`, {
        programId: newProgramId
      });

      // Update local state - need to refresh programs
      if (onProgramUpdated) {
        onProgramUpdated();
      }

      // Update selectedProgram to reflect the change
      if (isCurrentlyAssigned) {
        setSelectedProgram(prev => ({
          ...prev,
          assignedTeams: prev.assignedTeams.filter(id => id !== teamId)
        }));
      } else {
        setSelectedProgram(prev => ({
          ...prev,
          assignedTeams: [...(prev.assignedTeams || []), teamId]
        }));
      }
    } catch (err) {
      console.error('Failed to update team assignment:', err);
      alert('Failed to update assignment. Please try again.');
    } finally {
      setSavingAssignment(false);
    }
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
              <div className="program-actions">
                <button
                  className="view-program-btn"
                  onClick={(e) => handleViewProgram(e, program)}
                  title="View program"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  className="delete-program-btn"
                  onClick={(e) => handleDeleteClick(e, program)}
                  title="Delete program"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-programs">
            <p>No workout programs yet</p>
            <p className="hint">Create your first program to get started</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Program"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              loading={deleting}
            >
              Delete Program
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete "<strong>{programToDelete?.programName}</strong>"?</p>
        <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          This will permanently remove the program and all its workouts. This action cannot be undone.
        </p>
      </Modal>

      {/* Team Assignment Popup */}
      <Modal
        isOpen={showAssignPopup}
        onClose={() => {
          setShowAssignPopup(false);
          setSelectedProgram(null);
        }}
        title="Assign Program to Team"
        footer={
          <Button variant="ghost" onClick={() => {
            setShowAssignPopup(false);
            setSelectedProgram(null);
          }}>
            Done
          </Button>
        }
      >
        <div className="assignment-popup">
          <p className="assignment-program-name">{selectedProgram?.programName}</p>
          <p className="assignment-hint">Check a team to assign this program. Only one program per team.</p>

          <div className="team-assignment-list">
            {teams.map(team => {
              const isAssigned = isProgramAssignedToTeam(selectedProgram, team.id);
              return (
                <label
                  key={team.id}
                  className={`team-assignment-item ${isAssigned ? 'assigned' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => handleTeamAssignment(team.id)}
                    disabled={savingAssignment}
                  />
                  <span className="team-assignment-name">{team.teamName}</span>
                  <span className={`team-assignment-status ${isAssigned ? 'assigned' : ''}`}>
                    {isAssigned ? 'Assigned' : 'Not assigned'}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateWorkoutPanel;
