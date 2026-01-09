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

  // Date filter state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // Default to current month
  const [selectedDay, setSelectedDay] = useState('');

  // Generate year options (last 3 years)
  const yearOptions = [];
  for (let y = currentDate.getFullYear(); y >= currentDate.getFullYear() - 2; y--) {
    yearOptions.push(y);
  }

  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate day options based on selected month/year
  const getDaysInMonth = (year, month) => {
    if (!month) return 31;
    return new Date(year, month, 0).getDate();
  };

  const dayOptions = [];
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  for (let d = 1; d <= daysInMonth; d++) {
    dayOptions.push(d);
  }

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

  // Build date range based on filters
  const getDateRange = () => {
    let startDate, endDate;

    if (selectedDay && selectedMonth) {
      // Specific day selected
      startDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
      endDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    } else if (selectedMonth) {
      // Specific month selected
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0); // Last day of month
    } else {
      // Default to last 30 days of selected year
      const today = new Date();
      if (selectedYear === today.getFullYear()) {
        // Current year - last 30 days
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      } else {
        // Past year - last 30 days of that year
        endDate = new Date(selectedYear, 11, 31);
        startDate = new Date(selectedYear, 11, 1);
      }
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const fetchWorkoutLogs = async (athleteId) => {
    try {
      setLogsLoading(true);
      const { startDate, endDate } = getDateRange();

      const response = await api.get(`/coach/athletes/${athleteId}/workout-logs`, {
        params: { startDate, endDate }
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
      const { startDate, endDate } = getDateRange();

      const response = await api.get(`/coach/teams/${selectedTeam}/workout-logs`, {
        params: { startDate, endDate }
      });
      setWorkoutLogs(response.data.workoutLogs || []);
    } catch (err) {
      console.error('Failed to load team workout logs:', err);
      setWorkoutLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Refetch when date filters change (only if athlete/team already selected)
  useEffect(() => {
    if (selectedAthlete === 'all' && selectedTeam) {
      fetchTeamWorkoutLogs();
    } else if (selectedAthlete && selectedAthlete !== 'all') {
      fetchWorkoutLogs(selectedAthlete);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
    if (selectedDay > getDaysInMonth(parseInt(year), selectedMonth)) {
      setSelectedDay('');
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month ? parseInt(month) : '');
    setSelectedDay('');
  };

  const handleDayChange = (day) => {
    setSelectedDay(day ? parseInt(day) : '');
  };

  const clearDateFilters = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedDay('');
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

          {/* Date Filters */}
          <div className="date-filters-section">
            <div className="date-filters-row">
              <div className="filter-group">
                <label>Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                >
                  <option value="">All Months</option>
                  {monthOptions.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => handleDayChange(e.target.value)}
                  disabled={!selectedMonth}
                >
                  <option value="">All Days</option>
                  {dayOptions.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <button className="clear-date-btn" onClick={clearDateFilters}>
                Reset Dates
              </button>
            </div>

            <div className="filter-summary">
              Showing: {selectedMonth ? monthOptions.find(m => m.value === selectedMonth)?.label : 'Last 30 days'}
              {selectedDay ? ` ${selectedDay},` : ','} {selectedYear}
            </div>
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
