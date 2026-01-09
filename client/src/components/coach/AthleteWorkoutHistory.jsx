import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import api from '../../services/api';
import './AthleteWorkoutHistory.css';

const AthleteWorkoutHistory = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedLogs, setExpandedLogs] = useState({});

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coach/teams');
      setTeams(response.data.teams || []);
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChange = async (teamId) => {
    setSelectedTeam(teamId);
    setSelectedAthlete('');
    setWorkoutLogs([]);

    if (!teamId) {
      setAthletes([]);
      return;
    }

    try {
      const response = await api.get(`/coach/teams/${teamId}/athletes`);
      setAthletes(response.data.athletes || []);
    } catch (err) {
      console.error('Failed to load athletes:', err);
      setAthletes([]);
    }
  };

  const handleAthleteChange = async (athleteId) => {
    setSelectedAthlete(athleteId);
    if (!athleteId) {
      setWorkoutLogs([]);
      return;
    }

    await fetchWorkoutLogs(athleteId);
  };

  const fetchWorkoutLogs = async (athleteId) => {
    try {
      setLogsLoading(true);
      // Get last 3 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const response = await api.get(`/coach/athletes/${athleteId}/workout-logs`, {
        params: {
          startDate: startDate.toISOString().split('T')[0]
        }
      });
      setWorkoutLogs(response.data.workoutLogs || []);
    } catch (err) {
      console.error('Failed to load workout logs:', err);
      setWorkoutLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchTeamWorkoutLogs = async () => {
    if (!selectedTeam) return;

    try {
      setLogsLoading(true);
      setSelectedAthlete('all');

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const response = await api.get(`/coach/teams/${selectedTeam}/workout-logs`, {
        params: {
          startDate: startDate.toISOString().split('T')[0]
        }
      });
      setWorkoutLogs(response.data.workoutLogs || []);
    } catch (err) {
      console.error('Failed to load team workout logs:', err);
      setWorkoutLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleLog = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  // Calculate estimated 1RM using Brzycki formula
  const calculateEstimated1RM = (weight, reps) => {
    if (!weight || !reps || reps <= 0 || reps > 12) return null;
    const estimated = weight / (1.0278 - (0.0278 * reps));
    return Math.round(estimated);
  };

  const getCompletedSetsCount = (exercise) => {
    if (!exercise.sets) return 0;
    return exercise.sets.filter(s => s.completedWeight !== null || s.completedReps !== null).length;
  };

  const getTotalSetsCount = (exercise) => {
    if (!exercise.sets) return 0;
    return exercise.sets.length;
  };

  if (loading) {
    return (
      <div className="athlete-workout-history-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="athlete-workout-history-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1>Athlete Workout History</h1>
          <p className="subtitle">View workout logs for your athletes</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <Card className="filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                <option value="">Select a team...</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Athlete</label>
              <select
                value={selectedAthlete}
                onChange={(e) => handleAthleteChange(e.target.value)}
                disabled={!selectedTeam}
              >
                <option value="">Select an athlete...</option>
                {athletes.map(athlete => (
                  <option key={athlete._id} value={athlete._id}>
                    {athlete.firstName} {athlete.lastName}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="view-all-btn"
              onClick={fetchTeamWorkoutLogs}
              disabled={!selectedTeam}
            >
              View All Team Logs
            </button>
          </div>
        </Card>

        {logsLoading ? (
          <div className="loading">Loading workout logs...</div>
        ) : workoutLogs.length === 0 ? (
          <Card>
            <div className="no-history">
              <span className="no-history-icon">📝</span>
              <h3>No Workout Logs Found</h3>
              <p>
                {!selectedTeam
                  ? 'Select a team and athlete to view their workout history.'
                  : !selectedAthlete
                  ? 'Select an athlete to view their workout history.'
                  : 'This athlete has not logged any workouts yet.'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="history-list">
            {workoutLogs.map((log) => {
              const isExpanded = expandedLogs[log._id];
              const totalExercises = log.exercises?.length || 0;
              const completedExercises = log.exercises?.filter(e => getCompletedSetsCount(e) > 0).length || 0;

              return (
                <Card key={log._id} className="history-card">
                  <div
                    className={`history-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleLog(log._id)}
                  >
                    <div className="history-date-info">
                      <span className="history-date">{formatDate(log.date)}</span>
                      {log.athleteName && (
                        <span className="history-athlete">{log.athleteName}</span>
                      )}
                      <span className="history-stats">
                        {completedExercises}/{totalExercises} exercises logged
                      </span>
                    </div>
                    <div className="history-header-right">
                      {log.isCompleted && (
                        <span className="completed-badge">Completed</span>
                      )}
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="history-exercises">
                      {log.exercises?.map((exercise, exerciseIndex) => (
                        <div key={exerciseIndex} className="history-exercise">
                          <div className="exercise-header">
                            <span className="exercise-number">{exerciseIndex + 1}</span>
                            <span className="exercise-name">{exercise.exerciseName}</span>
                            <span className="exercise-completion">
                              {getCompletedSetsCount(exercise)}/{getTotalSetsCount(exercise)} sets
                            </span>
                          </div>

                          {exercise.sets && exercise.sets.length > 0 && (
                            <div className="sets-table">
                              <div className="sets-header">
                                <span className="set-col">Set</span>
                                <span className="weight-col">Weight</span>
                                <span className="reps-col">Reps</span>
                                <span className="est-col">Est. 1RM</span>
                              </div>
                              {exercise.sets.map((set, setIndex) => {
                                const hasData = set.completedWeight !== null || set.completedReps !== null;
                                const est1RM = calculateEstimated1RM(set.completedWeight, set.completedReps);
                                return (
                                  <div
                                    key={setIndex}
                                    className={`set-row ${hasData ? 'has-data' : 'no-data'}`}
                                  >
                                    <span className="set-col">{set.setNumber || setIndex + 1}</span>
                                    <span className="weight-col">
                                      {set.completedWeight !== null ? `${set.completedWeight} lbs` : '—'}
                                    </span>
                                    <span className="reps-col">
                                      {set.completedReps !== null ? set.completedReps : '—'}
                                    </span>
                                    <span className="est-col">
                                      {est1RM ? (
                                        <span className="est-1rm-value">~{est1RM} lbs</span>
                                      ) : (
                                        <span className="est-empty">—</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {log.notes && (
                        <div className="workout-notes">
                          <strong>Notes:</strong> {log.notes}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteWorkoutHistory;
