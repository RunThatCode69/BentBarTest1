import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AthleteStatsPanel from './AthleteStatsPanel';
import CreateWorkoutPanel from './CreateWorkoutPanel';
import AthleteCenterPanel from './AthleteCenterPanel';
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

  // Program assignment state
  const [assigningProgramTeamId, setAssigningProgramTeamId] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [savingProgram, setSavingProgram] = useState(false);

  useEffect(() => {
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

    fetchDashboard();
  }, []);

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

  // Start assigning a program
  const handleStartAssignProgram = (team) => {
    setAssigningProgramTeamId(team.id);
    setSelectedProgramId(team.assignedProgram?.id || '');
  };

  // Cancel program assignment
  const handleCancelAssignProgram = () => {
    setAssigningProgramTeamId(null);
    setSelectedProgramId('');
  };

  // Save program assignment
  const handleSaveProgram = async (teamId) => {
    setSavingProgram(true);
    try {
      await api.put(`/coach/teams/${teamId}/program`, {
        programId: selectedProgramId || null
      });

      // Update local state
      const selectedProgram = dashboardData.workoutPrograms.find(p => p.id === selectedProgramId);
      setDashboardData(prev => ({
        ...prev,
        teams: prev.teams.map(t =>
          t.id === teamId
            ? { ...t, assignedProgram: selectedProgram ? { id: selectedProgram.id, name: selectedProgram.programName } : null }
            : t
        )
      }));

      setAssigningProgramTeamId(null);
      setSelectedProgramId('');
    } catch (err) {
      console.error('Failed to assign program:', err);
      alert('Failed to assign program. Please try again.');
    } finally {
      setSavingProgram(false);
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
        <div>
          <h1>Welcome, {dashboardData.coach.firstName}!</h1>
          <p className="subtitle">{dashboardData.coach.schoolName}</p>
        </div>
        <div className="team-info">
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
              <div className="team-program-row">
                {assigningProgramTeamId === team.id ? (
                  <div className="team-program-edit">
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className="program-select"
                    >
                      <option value="">No Program</option>
                      {dashboardData.workoutPrograms.map(program => (
                        <option key={program.id} value={program.id}>
                          {program.programName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="team-edit-btn save"
                      onClick={() => handleSaveProgram(team.id)}
                      disabled={savingProgram}
                    >
                      ✓
                    </button>
                    <button
                      className="team-edit-btn cancel"
                      onClick={handleCancelAssignProgram}
                      disabled={savingProgram}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="team-program-display">
                    <span className="program-label">Program:</span>
                    <span className={`program-name ${!team.assignedProgram ? 'no-program' : ''}`}>
                      {team.assignedProgram?.name || 'None'}
                    </span>
                    <button
                      className="team-edit-icon-btn"
                      onClick={() => handleStartAssignProgram(team)}
                      title="Change program"
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Team Workouts - First position */}
        <div className="dashboard-panel workouts-panel">
          <CreateWorkoutPanel
            workoutPrograms={dashboardData.workoutPrograms || []}
            teams={dashboardData.teams || []}
            onCreateNew={() => navigate('/coach/workouts/create')}
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
    </div>
  );
};

export default CoachDashboard;
