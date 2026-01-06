import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import Input from '../common/Input';
import Dropdown from '../common/Dropdown';
import PaymentForm from '../payment/PaymentForm';
import './AuthForms.css';

const CoachSignup = () => {
  const navigate = useNavigate();
  const { registerCoach, error, clearError } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    organizationType: '',
    sport: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const organizationTypes = [
    { value: 'university', label: 'University' },
    { value: 'college', label: 'College' },
    { value: 'high_school', label: 'High School' }
  ];

  const sports = [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'soccer', label: 'Soccer' },
    { value: 'baseball', label: 'Baseball' },
    { value: 'softball', label: 'Softball' },
    { value: 'volleyball', label: 'Volleyball' },
    { value: 'track', label: 'Track & Field' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'wrestling', label: 'Wrestling' },
    { value: 'tennis', label: 'Tennis' },
    { value: 'golf', label: 'Golf' },
    { value: 'lacrosse', label: 'Lacrosse' },
    { value: 'hockey', label: 'Hockey' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    clearError();
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Password requirements
    if (!/[A-Z]/.test(formData.password)) errors.password = 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(formData.password)) errors.password = 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(formData.password)) errors.password = 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      errors.password = 'Password must contain a special character';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.schoolName) errors.schoolName = 'School name is required';
    if (!formData.organizationType) errors.organizationType = 'Organization type is required';
    if (!formData.sport) errors.sport = 'Sport is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    const result = await registerCoach(formData);

    if (result.success) {
      navigate('/coach/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="nav-logo">TeamBuilder</Link>
        <Link to="/signup" className="nav-back">← Back</Link>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Coach Account</h1>
            <p>Step {step} of 3</p>
          </div>

          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className="step-line"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
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
              <h2>School Information</h2>

              <Input
                label="School/Organization Name"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                error={formErrors.schoolName}
                placeholder="e.g., State University"
                required
              />

              <Dropdown
                label="Organization Type"
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                options={organizationTypes}
                error={formErrors.organizationType}
                required
              />

              <h2 style={{ marginTop: 'var(--spacing-6)' }}>Team Information</h2>

              <Dropdown
                label="Sport/Team Type"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                options={sports}
                error={formErrors.sport}
                required
              />

              <div className="form-actions">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleNextStep}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="auth-form">
              <h2>Payment Information</h2>
              <p className="payment-note">Team programs starting at $200/month</p>

              <PaymentForm />

              <div className="form-actions">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={loading}>
                  Create Account
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

export default CoachSignup;
