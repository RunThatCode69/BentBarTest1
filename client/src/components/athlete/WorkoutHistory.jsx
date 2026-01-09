import React, { useState, useEffect } from 'react';
import Navbar from '../common/Navbar';
import Card from '../common/Card';
import api from '../../services/api';
import './WorkoutHistory.css';

const WorkoutHistory = () => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogs, setExpandedLogs] = useState({});

  // Date filter state - default to current month
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // Default to current month
  const [selectedDay, setSelectedDay] = useState(''); // Empty means all days

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
    fetchWorkoutHistory();
  }, [selectedYear, selectedMonth, selectedDay]);

  const fetchWorkoutHistory = async () => {
    try {
      setLoading(true);

      // Build date range based on filters
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
        // Just year or default (last 3 months)
        startDate = new Date(selectedYear, 0, 1);
        endDate = new Date(selectedYear, 11, 31);
      }

      const response = await api.get('/athlete/workout-logs', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      });
      setWorkoutLogs(response.data.workoutLogs || []);
    } catch (err) {
      setError('Failed to load workout history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(parseInt(year));
    // Reset day if it exceeds days in new month
    if (selectedDay > getDaysInMonth(parseInt(year), selectedMonth)) {
      setSelectedDay('');
    }
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month ? parseInt(month) : '');
    setSelectedDay(''); // Reset day when month changes
  };

  const handleDayChange = (day) => {
    setSelectedDay(day ? parseInt(day) : '');
  };

  const clearFilters = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth('');
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
      <div className="workout-history-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading workout history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-history-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1>Workout History</h1>
          <p className="subtitle">View your past workouts and logged data</p>
        </div>

        {/* Date Filter */}
        <Card className="date-filter-card">
          <div className="date-filter-row">
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

            <button className="clear-filter-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          <div className="filter-summary">
            Showing: {selectedMonth ? monthOptions.find(m => m.value === selectedMonth)?.label : 'All'}
            {selectedDay ? ` ${selectedDay},` : ','} {selectedYear}
          </div>
        </Card>

        {error && <div className="error-banner">{error}</div>}

        {workoutLogs.length === 0 ? (
          <Card>
            <div className="no-history">
              <span className="no-history-icon">📝</span>
              <h3>No Workout History Yet</h3>
              <p>Start logging your workouts to see your history here.</p>
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

export default WorkoutHistory;
