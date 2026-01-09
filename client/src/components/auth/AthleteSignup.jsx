import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import './AuthForms.css';

const AthleteSignup = () => {
  const navigate = useNavigate();
  const { registerAthlete, error, clearError } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);
  const [teamInfo, setTeamInfo] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    accessCode: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    clearError();

    // Clear team info if access code changes
    if (name === 'accessCode') {
      setTeamInfo(null);
    }
  };

  const validateAccessCode = async () => {
    if (!formData.accessCode) {
      setFormErrors(prev => ({ ...prev, accessCode: 'Access code is required' }));
      return false;
    }

    setValidatingCode(true);
    try {
      const response = await api.post('/teams/validate-code', {
        accessCode: formData.accessCode
      });

      if (response.data.valid) {
        setTeamInfo(response.data.team);
        setFormData(prev => ({ ...prev, schoolName: response.data.team.schoolName }));
        return true;
      }
    } catch (err) {
      setFormErrors(prev => ({
        ...prev,
        accessCode: 'Invalid access code. Please check with your coach.'
      }));
    }
    setValidatingCode(false);
    return false;
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';

    // Password validation - collect all failing requirements
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      if (formData.password.length < 8) passwordErrors.push('at least 8 characters');
      if (!/[A-Z]/.test(formData.password)) passwordErrors.push('an uppercase letter');
      if (!/[a-z]/.test(formData.password)) passwordErrors.push('a lowercase letter');
      if (!/[0-9]/.test(formData.password)) passwordErrors.push('a number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) passwordErrors.push('a special character');

      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleValidateCode = async () => {
    const isValid = await validateAccessCode();
    if (isValid) {
      setValidatingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!teamInfo) {
      setFormErrors(prev => ({
        ...prev,
        accessCode: 'Please validate your access code first'
      }));
      return;
    }

    setLoading(true);

    const result = await registerAthlete(formData);

    if (result.success) {
      navigate('/athlete/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="nav-logo">Bar Bend</Link>
        <Link to="/signup" className="nav-back">← Back</Link>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Join Your Team</h1>
            <p>Step {step} of 2</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          {step === 1 && (
            <div className="auth-form">
              <h2>Personal Information</h2>

              <div className="form-row">
                <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={formErrors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={formErrors.lastName}
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                hint="Min 8 chars, uppercase, lowercase, number, special character"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                required
              />

              <Button variant="primary" block onClick={handleNextStep}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="auth-form">
              <h2>Team Access Code</h2>
              <p className="section-hint">Your coach will provide this code</p>

              <div className="access-code-input">
                <Input
                  label="Access Code"
                  name="accessCode"
                  value={formData.accessCode}
                  onChange={handleChange}
                  error={formErrors.accessCode}
                  placeholder="Enter 6-character code"
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                {!teamInfo && (
                  <Button
                    variant="outline"
                    onClick={handleValidateCode}
                    loading={validatingCode}
                    disabled={!formData.accessCode}
                  >
                    Verify
                  </Button>
                )}
              </div>

              {teamInfo && (
                <div className="team-verified">
                  <div className="verified-badge">
                    <span className="check">✓</span>
                    Team Verified
                  </div>
                  <div className="team-details">
                    <p><strong>Team:</strong> {teamInfo.teamName}</p>
                    <p><strong>Sport:</strong> {teamInfo.sport}</p>
                    <p><strong>School:</strong> {teamInfo.schoolName}</p>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!teamInfo}
                >
                  Join Team
                </Button>
              </div>
            </div>
          )}

          <p className="auth-footer">
            Already have an account? <Link to="/">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AthleteSignup;
