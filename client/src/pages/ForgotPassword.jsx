import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>

          <h1 className="forgot-password-title">Forgot Password?</h1>

          {success ? (
            <div className="success-state">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Check Your Email</h2>
              <p>
                If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="check-spam">
                Don't see it? Check your spam folder.
              </p>
              <Link to="/" className="return-login-btn">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="forgot-password-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="forgot-password-form">
                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  block
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
