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

  // Assignment confirmation state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentAction, setAssignmentAction] = useState(null); // { program, team, isAssigning }
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Navigate to workout calendar when clicking on program
  const handleProgramClick = (program) => {
    const teamId = program.assignedTeams?.[0] || 'unassigned';
    navigate(`/coach/workouts?team=${teamId}&program=${program.id}`);
  };

  // Get team info from team ID
  const getAssignedTeam = (teamIds) => {
    if (!teamIds || teamIds.length === 0) return null;
    const teamId = teamIds[0];
    return teams.find(t => t.id === teamId || t.id === teamId?.toString());
  };

  const handleDeleteClick = (e, program) => {
    e.stopPropagation();
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

  // Handle clicking on assignment badge
  const handleAssignmentClick = (e, program) => {
    e.stopPropagation();
    const assignedTeam = getAssignedTeam(program.assignedTeams);

    if (assignedTeam) {
      // Program is assigned - ask to unassign
      setAssignmentAction({
        program,
        team: assignedTeam,
        isAssigning: false
      });
      setShowAssignModal(true);
    } else if (teams.length === 1) {
      // Only one team - assign to it directly
      setAssignmentAction({
        program,
        team: teams[0],
        isAssigning: true
      });
      setShowAssignModal(true);
    } else if (teams.length > 1) {
      // Multiple teams - show team selection
      setAssignmentAction({
        program,
        team: null,
        isAssigning: true,
        selectingTeam: true
      });
      setShowAssignModal(true);
    }
  };

  // Select a team to assign to
  const handleTeamSelect = (team) => {
    setAssignmentAction(prev => ({
      ...prev,
      team,
      selectingTeam: false
    }));
  };

  // Confirm assignment/unassignment
  const handleAssignmentConfirm = async () => {
    if (!assignmentAction || !assignmentAction.team) return;

    setSavingAssignment(true);
    try {
      const { team, program, isAssigning } = assignmentAction;

      await api.put(`/coach/teams/${team.id}/program`, {
        programId: isAssigning ? program.id : null
      });

      if (onProgramUpdated) {
        onProgramUpdated();
      }

      setShowAssignModal(false);
      setAssignmentAction(null);
    } catch (err) {
      console.error('Failed to update assignment:', err);
      alert('Failed to update assignment. Please try again.');
    } finally {
      setSavingAssignment(false);
    }
  };

  // Get the modal title based on action
  const getModalTitle = () => {
    if (!assignmentAction) return '';
    if (assignmentAction.selectingTeam) return 'Select Team';
    return assignmentAction.isAssigning ? 'Assign Program' : 'Unassign Program';
  };

  // Get the modal content based on action
  const getModalContent = () => {
    if (!assignmentAction) return null;

    const { program, team, isAssigning, selectingTeam } = assignmentAction;

    if (selectingTeam) {
      return (
        <div className="team-select-list">
          <p>Select a team to assign "<strong>{program.programName}</strong>" to:</p>
          <div className="team-options">
            {teams.map(t => {
              // Check if this team already has a program assigned
              const teamHasProgram = workoutPrograms.some(
                p => p.id !== program.id && p.assignedTeams?.includes(t.id)
              );
              const existingProgram = teamHasProgram
                ? workoutPrograms.find(p => p.id !== program.id && p.assignedTeams?.includes(t.id))
                : null;

              return (
                <button
                  key={t.id}
                  className="team-option-btn"
                  onClick={() => handleTeamSelect(t)}
                >
                  <span className="team-option-name">{t.teamName}</span>
                  {teamHasProgram && (
                    <span className="team-option-warning">
                      (will replace "{existingProgram?.programName}")
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (isAssigning) {
      // Check if the team already has a different program
      const existingProgram = workoutPrograms.find(
        p => p.id !== program.id && p.assignedTeams?.includes(team.id)
      );

      return (
        <>
          <p>Are you sure you want to assign "<strong>{program.programName}</strong>" to <strong>{team.teamName}</strong>?</p>
          {existingProgram && (
            <p style={{ marginTop: 'var(--spacing-2)', color: 'var(--color-warning)', fontSize: '14px' }}>
              This will unassign "{existingProgram.programName}" from {team.teamName}.
            </p>
          )}
        </>
      );
    } else {
      return (
        <p>Are you sure you want to unassign "<strong>{program.programName}</strong>" from <strong>{team.teamName}</strong>?</p>
      );
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
          workoutPrograms.map(program => {
            const assignedTeam = getAssignedTeam(program.assignedTeams);
            return (
              <div
                key={program.id}
                className="program-item"
                onClick={() => handleProgramClick(program)}
              >
                <div className="program-info">
                  <span className="program-name">{program.programName}</span>
                </div>
                <div className="program-actions">
                  <button
                    className={`assignment-badge ${assignedTeam ? 'assigned' : 'unassigned'}`}
                    onClick={(e) => handleAssignmentClick(e, program)}
                    title={assignedTeam ? 'Click to unassign' : 'Click to assign'}
                  >
                    {assignedTeam ? `Assigned: ${assignedTeam.teamName}` : 'Unassigned'}
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
            );
          })
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

      {/* Assignment Confirmation Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignmentAction(null);
        }}
        title={getModalTitle()}
        footer={
          assignmentAction?.selectingTeam ? (
            <Button variant="ghost" onClick={() => {
              setShowAssignModal(false);
              setAssignmentAction(null);
            }}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => {
                setShowAssignModal(false);
                setAssignmentAction(null);
              }}>
                Cancel
              </Button>
              <Button
                variant={assignmentAction?.isAssigning ? 'primary' : 'warning'}
                onClick={handleAssignmentConfirm}
                loading={savingAssignment}
              >
                {assignmentAction?.isAssigning ? 'Assign' : 'Unassign'}
              </Button>
            </>
          )
        }
      >
        {getModalContent()}
      </Modal>
    </div>
  );
};

export default CreateWorkoutPanel;
