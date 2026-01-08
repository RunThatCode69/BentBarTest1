import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import Modal from '../common/Modal';
import api from '../../services/api';
import './CreateWorkoutPanel.css';

const CreateWorkoutPanel = ({ workoutPrograms = [], teams = [], onCreateNew, onProgramDeleted }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    </div>
  );
};

export default CreateWorkoutPanel;
