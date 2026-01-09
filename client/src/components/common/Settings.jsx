import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Navbar from './Navbar';
import Card from './Card';
import Button from './Button';
import './Settings.css';

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email change state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' or 'verify'
  const [savingEmail, setSavingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(null);

  // Team management state (coaches only)
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamCoaches, setTeamCoaches] = useState([]);
  const [teamAthletes, setTeamAthletes] = useState([]);
  const [isTeamOwner, setIsTeamOwner] = useState(false);
  const [loadingTeamData, setLoadingTeamData] = useState(false);
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [addingCoach, setAddingCoach] = useState(false);
  const [removingCoachId, setRemovingCoachId] = useState(null);
  const [removingAthleteId, setRemovingAthleteId] = useState(null);

  useEffect(() => {
    fetchSettings();
    checkPendingEmailChange();
    if (user?.role === 'coach') {
      fetchTeams();
    }
  }, [user?.role]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      setSettings(response.data.settings);
      setFirstName(response.data.settings.firstName);
      setLastName(response.data.settings.lastName);
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    setSavingProfile(true);

    try {
      const response = await api.put('/settings/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      setSettings(prev => ({
        ...prev,
        firstName: response.data.profile.firstName,
        lastName: response.data.profile.lastName
      }));

      setSuccess('Profile updated successfully!');
      setEditingProfile(false);

      // Refresh the profile in auth context
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(settings.firstName);
    setLastName(settings.lastName);
    setEditingProfile(false);
    setError('');
  };

  // Check for pending email change on load
  const checkPendingEmailChange = async () => {
    try {
      const response = await api.get('/settings/email/pending');
      if (response.data.hasPending) {
        setPendingEmail(response.data.pendingEmail);
        setEmailStep('verify');
        setEditingEmail(true);
      }
    } catch (err) {
      // Ignore errors - just means no pending change
    }
  };

  // Request email change - sends code to current email
  const handleRequestEmailChange = async () => {
    setError('');
    setSuccess('');

    if (!newEmail || !newEmail.trim()) {
      setError('Please enter a new email address');
      return;
    }

    setSavingEmail(true);
    try {
      await api.post('/settings/email/request-change', {
        newEmail: newEmail.trim()
      });
      setPendingEmail(newEmail.trim());
      setEmailStep('verify');
      setSuccess('Verification code sent to your current email address');
    } catch (err) {
      console.error('Request email change error:', err);
      setError(err.response?.data?.message || 'Failed to request email change');
    } finally {
      setSavingEmail(false);
    }
  };

  // Verify the code and complete email change
  const handleVerifyEmailChange = async () => {
    setError('');
    setSuccess('');

    if (!verificationCode || verificationCode.trim().length !== 8) {
      setError('Please enter the 8-digit verification code');
      return;
    }

    setSavingEmail(true);
    try {
      const response = await api.post('/settings/email/verify', {
        code: verificationCode.trim()
      });

      // Update local state
      setSettings(prev => ({
        ...prev,
        email: response.data.newEmail
      }));

      setSuccess('Email updated successfully!');
      setEditingEmail(false);
      setEmailStep('input');
      setNewEmail('');
      setVerificationCode('');
      setPendingEmail(null);

      // Refresh profile
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err) {
      console.error('Verify email change error:', err);
      setError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setSavingEmail(false);
    }
  };

  // Cancel pending email change
  const handleCancelEmailChange = async () => {
    try {
      await api.delete('/settings/email/cancel');
    } catch (err) {
      // Ignore errors
    }
    setEditingEmail(false);
    setEmailStep('input');
    setNewEmail('');
    setVerificationCode('');
    setPendingEmail(null);
    setError('');
  };

  // Team management functions (coaches only)
  const fetchTeams = async () => {
    try {
      const response = await api.get('/coach/teams');
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Fetch teams error:', err);
    }
  };

  const fetchTeamData = async (teamId) => {
    if (!teamId) {
      setTeamCoaches([]);
      setTeamAthletes([]);
      setIsTeamOwner(false);
      return;
    }

    setLoadingTeamData(true);
    try {
      const [coachesRes, athletesRes] = await Promise.all([
        api.get(`/coach/teams/${teamId}/coaches`),
        api.get(`/coach/teams/${teamId}/athletes`)
      ]);

      setTeamCoaches(coachesRes.data.coaches || []);
      setTeamAthletes(athletesRes.data.athletes || []);
      setIsTeamOwner(coachesRes.data.isOwner || false);
    } catch (err) {
      console.error('Fetch team data error:', err);
      setError('Failed to load team data');
    } finally {
      setLoadingTeamData(false);
    }
  };

  const handleTeamSelect = (e) => {
    const teamId = e.target.value;
    setSelectedTeamId(teamId);
    setError('');
    setSuccess('');
    fetchTeamData(teamId);
  };

  const handleAddCoach = async () => {
    if (!newCoachEmail.trim()) {
      setError('Please enter a coach email');
      return;
    }

    setAddingCoach(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/coach/teams/${selectedTeamId}/coaches`, {
        email: newCoachEmail.trim()
      });
      setSuccess(response.data.message || 'Coach added successfully');
      setNewCoachEmail('');
      fetchTeamData(selectedTeamId);
    } catch (err) {
      console.error('Add coach error:', err);
      setError(err.response?.data?.message || 'Failed to add coach');
    } finally {
      setAddingCoach(false);
    }
  };

  const handleRemoveCoach = async (coachIdToRemove) => {
    if (!window.confirm('Are you sure you want to remove this coach from the team?')) {
      return;
    }

    setRemovingCoachId(coachIdToRemove);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/coach/teams/${selectedTeamId}/coaches/${coachIdToRemove}`);
      setSuccess(response.data.message || 'Coach removed successfully');
      fetchTeamData(selectedTeamId);
    } catch (err) {
      console.error('Remove coach error:', err);
      setError(err.response?.data?.message || 'Failed to remove coach');
    } finally {
      setRemovingCoachId(null);
    }
  };

  const handleRemoveAthlete = async (athleteId, athleteName) => {
    if (!window.confirm(`Are you sure you want to remove ${athleteName} from the team? Their workout data will be preserved.`)) {
      return;
    }

    setRemovingAthleteId(athleteId);
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/coach/teams/${selectedTeamId}/athletes/${athleteId}`);
      setSuccess(response.data.message || 'Athlete removed successfully');
      fetchTeamData(selectedTeamId);
    } catch (err) {
      console.error('Remove athlete error:', err);
      setError(err.response?.data?.message || 'Failed to remove athlete');
    } finally {
      setRemovingAthleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <Navbar />
        <div className="page-content">
          <div className="loading">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <h1>Settings</h1>
          <p className="subtitle">Manage your account settings</p>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="settings-content">
          {/* Profile Section */}
          <Card>
            <div className="settings-section-header">
              <h2>Profile</h2>
              {!editingProfile && (
                <button
                  className="edit-btn"
                  onClick={() => setEditingProfile(true)}
                >
                  Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    maxLength={50}
                  />
                </div>
                <div className="form-actions">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-display">
                <div className="profile-field">
                  <span className="field-label">Name</span>
                  <span className="field-value">{settings?.firstName} {settings?.lastName}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Email</span>
                  <span className="field-value">{settings?.email}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Role</span>
                  <span className="field-value capitalize">{settings?.role}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">School</span>
                  <span className="field-value">{settings?.schoolName}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Payment Methods Section - Coaches Only */}
          {user?.role === 'coach' && (
            <Card>
              <div className="settings-section-header">
                <h2>Payment Methods</h2>
              </div>

              <div className="payment-section">
                <div className="payment-status">
                  <div className="status-item">
                    <span className="status-label">Subscription Status</span>
                    <span className={`status-value ${settings?.paymentStatus}`}>
                      {settings?.paymentStatus === 'active' ? 'Active' :
                       settings?.paymentStatus === 'pending' ? 'Pending' : 'Inactive'}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Teams Subscribed</span>
                    <span className="status-value">{settings?.paidTeams || 0} team(s)</span>
                  </div>
                </div>

                <div className="payment-methods-list">
                  <div className="no-payment-methods">
                    <div className="stripe-placeholder">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      <h3>Payment Integration Coming Soon</h3>
                      <p>Stripe payment integration will be available here.</p>
                      <p className="price-info">$200 per team per year</p>
                    </div>
                  </div>
                </div>

                <div className="payment-actions">
                  <Button variant="primary" disabled>
                    + Add Payment Method
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Team Management Section - Coaches Only */}
          {user?.role === 'coach' && (
            <Card>
              <div className="settings-section-header">
                <h2>Team Management</h2>
              </div>

              <div className="team-management-section">
                {/* Team Selector */}
                <div className="form-group">
                  <label>Select Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={handleTeamSelect}
                    className="team-select"
                  >
                    <option value="">-- Select a team --</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>
                        {team.teamName} ({team.schoolName})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeamId && (
                  <>
                    {loadingTeamData ? (
                      <div className="team-loading">Loading team data...</div>
                    ) : (
                      <>
                        {/* Owner Badge */}
                        {isTeamOwner && (
                          <div className="owner-badge">
                            You are the owner of this team
                          </div>
                        )}

                        {/* Coaches Section */}
                        <div className="team-subsection">
                          <h3>Coaches ({teamCoaches.length}/5)</h3>
                          <div className="team-members-list">
                            {teamCoaches.map(coach => (
                              <div key={coach._id} className="team-member-item">
                                <div className="member-info">
                                  <span className="member-name">
                                    {coach.firstName} {coach.lastName}
                                  </span>
                                  <span className={`member-role ${coach.role}`}>
                                    {coach.role === 'owner' ? 'Owner' : 'Assistant'}
                                  </span>
                                </div>
                                {isTeamOwner && coach.role !== 'owner' && (
                                  <button
                                    className="remove-member-btn"
                                    onClick={() => handleRemoveCoach(coach._id)}
                                    disabled={removingCoachId === coach._id}
                                  >
                                    {removingCoachId === coach._id ? 'Removing...' : 'Remove'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add Coach Form - Owner Only */}
                          {isTeamOwner && teamCoaches.length < 5 && (
                            <div className="add-member-form">
                              <input
                                type="email"
                                value={newCoachEmail}
                                onChange={(e) => setNewCoachEmail(e.target.value)}
                                placeholder="Enter coach email"
                                className="add-member-input"
                              />
                              <Button
                                variant="primary"
                                onClick={handleAddCoach}
                                disabled={addingCoach}
                              >
                                {addingCoach ? 'Adding...' : 'Add Coach'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Athletes Section */}
                        <div className="team-subsection">
                          <h3>Athletes ({teamAthletes.length})</h3>
                          {teamAthletes.length === 0 ? (
                            <p className="no-members">No athletes on this team yet.</p>
                          ) : (
                            <div className="team-members-list athletes-list">
                              {teamAthletes.map(athlete => (
                                <div key={athlete._id} className="team-member-item">
                                  <div className="member-info">
                                    <span className="member-name">
                                      {athlete.firstName} {athlete.lastName}
                                    </span>
                                  </div>
                                  {isTeamOwner && (
                                    <button
                                      className="remove-member-btn"
                                      onClick={() => handleRemoveAthlete(athlete._id, `${athlete.firstName} ${athlete.lastName}`)}
                                      disabled={removingAthleteId === athlete._id}
                                    >
                                      {removingAthleteId === athlete._id ? 'Removing...' : 'Remove'}
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {isTeamOwner && (
                            <p className="athlete-note">
                              Removing an athlete from the team will preserve their workout data.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {!selectedTeamId && teams.length === 0 && (
                  <p className="no-teams-message">You don't have any teams yet.</p>
                )}
              </div>
            </Card>
          )}

          {/* Account Section - Email Change */}
          <Card>
            <div className="settings-section-header">
              <h2>Email Address</h2>
              {!editingEmail && (
                <button
                  className="edit-btn"
                  onClick={() => setEditingEmail(true)}
                >
                  Change Email
                </button>
              )}
            </div>

            {editingEmail ? (
              <div className="email-change-form">
                {emailStep === 'input' ? (
                  <>
                    <p className="email-change-info">
                      Current email: <strong>{settings?.email}</strong>
                    </p>
                    <div className="form-group">
                      <label>New Email Address</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                      />
                    </div>
                    <p className="email-change-note">
                      A verification code will be sent to your current email address.
                    </p>
                    <div className="form-actions">
                      <Button
                        variant="primary"
                        onClick={handleRequestEmailChange}
                        disabled={savingEmail}
                      >
                        {savingEmail ? 'Sending...' : 'Send Verification Code'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleCancelEmailChange}
                        disabled={savingEmail}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="email-change-info">
                      Changing to: <strong>{pendingEmail}</strong>
                    </p>
                    <p className="email-change-note">
                      Enter the 8-digit code sent to <strong>{settings?.email}</strong>
                    </p>
                    <div className="form-group">
                      <label>Verification Code</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Enter 8-digit code"
                        maxLength={8}
                        className="verification-code-input"
                      />
                    </div>
                    <div className="form-actions">
                      <Button
                        variant="primary"
                        onClick={handleVerifyEmailChange}
                        disabled={savingEmail}
                      >
                        {savingEmail ? 'Verifying...' : 'Verify & Update Email'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleCancelEmailChange}
                        disabled={savingEmail}
                      >
                        Cancel
                      </Button>
                    </div>
                    <button
                      className="resend-code-btn"
                      onClick={() => {
                        setEmailStep('input');
                        setNewEmail(pendingEmail);
                        setVerificationCode('');
                      }}
                      disabled={savingEmail}
                    >
                      Didn't receive the code? Try again
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="email-display">
                <div className="profile-field">
                  <span className="field-label">Current Email</span>
                  <span className="field-value">{settings?.email}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Account Info Section */}
          <Card>
            <div className="settings-section-header">
              <h2>Password</h2>
            </div>
            <div className="account-info">
              <p className="account-note">
                Need to change your password? Contact support for assistance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
