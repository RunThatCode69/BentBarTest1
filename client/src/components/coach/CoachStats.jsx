import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Dropdown from '../common/Dropdown';
import './CoachStats.css';

const CoachStats = () => {
  const [stats, setStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    teamId: '',
    athleteId: '',
    exerciseId: ''
  });

  // Edit state for 1RMs
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get('/coach/teams');
        const fetchedTeams = response.data.teams;
        setTeams(fetchedTeams);

        // Auto-select team if coach only has one
        if (fetchedTeams.length === 1) {
          setFilters(prev => ({ ...prev, teamId: fetchedTeams[0]._id }));
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.teamId) params.append('teamId', filters.teamId);
        if (filters.athleteId) params.append('athleteId', filters.athleteId);
        if (filters.exerciseId) params.append('exerciseId', filters.exerciseId);

        const response = await api.get(`/coach/stats?${params}`);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (filters.teamId) {
      const fetchAthletes = async () => {
        try {
          const response = await api.get(`/coach/teams/${filters.teamId}/athletes`);
          setAthletes(response.data.athletes);
        } catch (err) {
          console.error('Failed to fetch athletes:', err);
        }
      };

      const fetchExercises = async () => {
        try {
          const response = await api.get(`/stats/available-exercises/${filters.teamId}`);
          setExercises(response.data.exercises);
        } catch (err) {
          console.error('Failed to fetch exercises:', err);
        }
      };

      fetchAthletes();
      fetchExercises();
    } else {
      setAthletes([]);
      setExercises([]);
      setFilters(prev => ({ ...prev, athleteId: '', exerciseId: '' }));
    }
  }, [filters.teamId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));

    if (name === 'teamId') {
      setFilters(prev => ({ ...prev, athleteId: '', exerciseId: '' }));
    }
  };

  // Start editing a 1RM value
  const startEdit = (stat, index) => {
    if (stat.type !== '1RM') return; // Only allow editing 1RMs
    setEditingId(`${stat.athleteId}-${stat.exerciseName}-${index}`);
    setEditValue(stat.value.toString());
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Save edited 1RM
  const saveEdit = async (stat) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/coach/athletes/${stat.athleteId}/max`, {
        exerciseName: stat.exerciseName,
        exerciseId: stat.exerciseId,
        oneRepMax: newValue
      });

      // Update local state
      setStats(prev => prev.map((s, i) => {
        if (s.athleteId === stat.athleteId &&
            s.exerciseName === stat.exerciseName &&
            s.type === '1RM') {
          return { ...s, value: newValue, date: new Date().toISOString() };
        }
        return s;
      }));

      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('Failed to update max:', err);
      alert('Failed to update max');
    } finally {
      setSaving(false);
    }
  };

  // Handle Enter key to save
  const handleKeyDown = (e, stat) => {
    if (e.key === 'Enter') {
      saveEdit(stat);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const teamOptions = [
    { value: '', label: 'All Teams' },
    ...teams.map(t => ({ value: t._id, label: t.teamName }))
  ];

  const athleteOptions = [
    { value: '', label: 'All Athletes' },
    ...athletes.map(a => ({ value: a._id, label: `${a.firstName} ${a.lastName}` }))
  ];

  const exerciseOptions = [
    { value: '', label: 'All Exercises' },
    ...exercises.map(e => ({ value: e.exerciseId, label: e.exerciseName }))
  ];

  return (
    <div className="coach-stats-page">
      <div className="page-header">
        <h1>Athlete Statistics</h1>
        <p>View and analyze your athletes' progress</p>
      </div>

      <div className="filters-bar">
        <Dropdown
          name="teamId"
          value={filters.teamId}
          onChange={handleFilterChange}
          options={teamOptions.slice(1)}
          placeholder="All Teams"
        />
        <Dropdown
          name="athleteId"
          value={filters.athleteId}
          onChange={handleFilterChange}
          options={athleteOptions.slice(1)}
          placeholder="All Athletes"
          disabled={!filters.teamId}
        />
        <Dropdown
          name="exerciseId"
          value={filters.exerciseId}
          onChange={handleFilterChange}
          options={exerciseOptions.slice(1)}
          placeholder="All Exercises"
          disabled={!filters.teamId}
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading stats...</p>
        </div>
      ) : (
        <div className="stats-table-container">
          {stats.length === 0 ? (
            <div className="empty-state">
              <p>No stats found</p>
              <span>Stats will appear as athletes log their lifts</span>
            </div>
          ) : (
            <table className="table stats-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Team</th>
                  <th>Exercise</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => {
                  const rowId = `${stat.athleteId}-${stat.exerciseName}-${index}`;
                  const isEditing = editingId === rowId;

                  return (
                    <tr key={rowId}>
                      <td className="athlete-name">{stat.athleteName}</td>
                      <td>{stat.teamName}</td>
                      <td>{stat.exerciseName}</td>
                      <td className="stat-value">
                        {isEditing ? (
                          <div className="edit-value-container">
                            <input
                              type="number"
                              className="edit-value-input"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, stat)}
                              autoFocus
                              disabled={saving}
                            />
                            <span className="edit-unit">lbs</span>
                            <button
                              className="edit-save-btn"
                              onClick={() => saveEdit(stat)}
                              disabled={saving}
                            >
                              {saving ? '...' : '✓'}
                            </button>
                            <button
                              className="edit-cancel-btn"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            className={stat.type === '1RM' ? 'editable-value' : ''}
                            onClick={() => startEdit(stat, index)}
                            title={stat.type === '1RM' ? 'Click to edit' : ''}
                          >
                            {stat.value} lbs
                            {stat.reps && <span className="reps"> x {stat.reps}</span>}
                            {stat.type === '1RM' && <span className="edit-hint">✎</span>}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${stat.type === '1RM' ? 'badge-primary' : 'badge-gray'}`}>
                          {stat.type}
                        </span>
                      </td>
                      <td className="stat-date">
                        {new Date(stat.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default CoachStats;
