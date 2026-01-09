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

  useEffect(() => {
    fetchSettings();
  }, []);

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

          {/* Account Section */}
          <Card>
            <div className="settings-section-header">
              <h2>Account</h2>
            </div>
            <div className="account-info">
              <p className="account-note">
                Need to change your email or password? Contact support for assistance.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
