import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', {
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="error-state">
              <div className="error-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Invalid Link</h2>
              <p>This password reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="request-new-btn">
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>

          <h1 className="reset-password-title">Reset Password</h1>

          {success ? (
            <div className="success-state">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Password Reset Successfully!</h2>
              <p>Your password has been changed. You can now log in with your new password.</p>
              <Button
                variant="primary"
                onClick={() => navigate('/')}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              <p className="reset-password-subtitle">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="reset-password-form">
                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}

                <Input
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                />

                <div className="password-requirements">
                  <p>Password must:</p>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'met' : ''}>
                      Be at least 8 characters long
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  block
                  loading={loading}
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
