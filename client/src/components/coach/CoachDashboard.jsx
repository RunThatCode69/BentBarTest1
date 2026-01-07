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
              <span className="team-name">{team.teamName}</span>
              <span className="athlete-count">{team.athleteCount} athletes</span>
              <span className="access-code">Code: {team.accessCode}</span>
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
