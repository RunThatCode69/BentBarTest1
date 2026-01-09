import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AthleteStatsPanel from './AthleteStatsPanel';
import CreateWorkoutPanel from './CreateWorkoutPanel';
import AthleteCenterPanel from './AthleteCenterPanel';
import Button from '../common/Button';
import Modal from '../common/Modal';
import './CoachDashboard.css';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Team name editing state
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [savingTeamName, setSavingTeamName] = useState(false);

  // Add team modal state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSport, setNewTeamSport] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [addTeamError, setAddTeamError] = useState(null);


  const fetchDashboard = async () => {
    try {
      const response = await api.get('/coach/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Refresh dashboard data (used after program assignment changes)
  const handleProgramUpdated = () => {
    fetchDashboard();
  };

  // Start editing a team name
  const handleStartEditTeam = (team) => {
    setEditingTeamId(team.id);
    setEditingTeamName(team.teamName);
  };

  // Cancel editing
  const handleCancelEditTeam = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  // Save team name
  const handleSaveTeamName = async (teamId) => {
    if (!editingTeamName.trim()) return;

    setSavingTeamName(true);
    try {
      await api.put(`/coach/teams/${teamId}`, { teamName: editingTeamName.trim() });

      // Update local state
      setDashboardData(prev => ({
        ...prev,
        teams: prev.teams.map(t =>
          t.id === teamId ? { ...t, teamName: editingTeamName.trim() } : t
        )
      }));

      setEditingTeamId(null);
      setEditingTeamName('');
    } catch (err) {
      console.error('Failed to update team name:', err);
      alert('Failed to update team name. Please try again.');
    } finally {
      setSavingTeamName(false);
    }
  };

  // Handle Enter key to save
  const handleTeamNameKeyDown = (e, teamId) => {
    if (e.key === 'Enter') {
      handleSaveTeamName(teamId);
    } else if (e.key === 'Escape') {
      handleCancelEditTeam();
    }
  };

  // Open add team modal
  const handleOpenAddTeam = () => {
    setNewTeamName('');
    setNewTeamSport('');
    setAddTeamError(null);
    setShowAddTeamModal(true);
  };

  // Close add team modal
  const handleCloseAddTeam = () => {
    setShowAddTeamModal(false);
    setNewTeamName('');
    setNewTeamSport('');
    setAddTeamError(null);
  };

  // Create new team
  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !newTeamSport.trim()) {
      setAddTeamError('Please enter both team name and sport');
      return;
    }

    setAddingTeam(true);
    setAddTeamError(null);

    try {
      await api.post('/coach/teams', {
        teamName: newTeamName.trim(),
        sport: newTeamSport.trim()
      });

      // Success - close modal and refresh dashboard
      setShowAddTeamModal(false);
      setNewTeamName('');
      setNewTeamSport('');
      fetchDashboard();
    } catch (err) {
      if (err.response?.data?.code === 'TEAM_LIMIT_REACHED') {
        setAddTeamError('You have reached your team limit. Please purchase additional team slots to add more teams.');
      } else {
        setAddTeamError(err.response?.data?.message || 'Failed to create team. Please try again.');
      }
    } finally {
      setAddingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-lg"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="coach-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {dashboardData.coach.firstName}!</h1>
          <p className="subtitle">{dashboardData.coach.schoolName}</p>
        </div>
        <div className="header-center">
          {dashboardData.teams.map(team => (
            <div key={team.id} className="team-badge">
              <div className="team-name-row">
                {editingTeamId === team.id ? (
                  <div className="team-name-edit">
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      onKeyDown={(e) => handleTeamNameKeyDown(e, team.id)}
                      className="team-name-input"
                      autoFocus
                    />
                    <button
                      className="team-edit-btn save"
                      onClick={() => handleSaveTeamName(team.id)}
                      disabled={savingTeamName}
                    >
                      ✓
                    </button>
                    <button
                      className="team-edit-btn cancel"
                      onClick={handleCancelEditTeam}
                      disabled={savingTeamName}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="team-name">{team.teamName}</span>
                    <button
                      className="team-edit-icon-btn"
                      onClick={() => handleStartEditTeam(team)}
                      title="Edit team name"
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
              <span className="athlete-count">{team.athleteCount} athletes</span>
              <span className="access-code">Code: {team.accessCode}</span>
            </div>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddTeam}>
          + Add Team
        </Button>
      </div>

      <div className="dashboard-grid">
        {/* Team Workouts - First position */}
        <div className="dashboard-panel workouts-panel">
          <CreateWorkoutPanel
            workoutPrograms={dashboardData.workoutPrograms || []}
            teams={dashboardData.teams || []}
            onCreateNew={() => navigate('/coach/workouts/create')}
            onProgramUpdated={handleProgramUpdated}
          />
        </div>

        {/* Stats - Second position */}
        <div className="dashboard-panel stats-panel">
          <AthleteStatsPanel
            stats={dashboardData.athleteStats}
            onViewAll={() => navigate('/coach/stats')}
          />
        </div>

        {/* Athlete Center - Third position */}
        <div className="dashboard-panel athlete-center-panel">
          <AthleteCenterPanel
            athletes={dashboardData.athletes || []}
            workouts={dashboardData.upcomingWorkouts || []}
          />
        </div>
      </div>

      {/* Add Team Modal */}
      <Modal
        isOpen={showAddTeamModal}
        onClose={handleCloseAddTeam}
        title="Add New Team"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseAddTeam}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleAddTeam}
              loading={addingTeam}
              disabled={!newTeamName.trim() || !newTeamSport.trim()}
            >
              Create Team
            </Button>
          </>
        }
      >
        <div className="add-team-form">
          {addTeamError && (
            <div className="add-team-error">
              {addTeamError}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="teamName">Team Name</label>
            <input
              id="teamName"
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g., Varsity Football"
              className="form-input"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="teamSport">Sport</label>
            <input
              id="teamSport"
              type="text"
              value={newTeamSport}
              onChange={(e) => setNewTeamSport(e.target.value)}
              placeholder="e.g., Football"
              className="form-input"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CoachDashboard;
