import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();
  const { login, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');

    const result = await login(formData.email, formData.password);

    if (result.success) {
      if (result.user.role === 'coach') {
        navigate('/coach/dashboard');
      } else if (result.user.role === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (result.user.role === 'trainer') {
        navigate('/trainer/dashboard');
      }
    } else {
      setFormError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="welcome-page">
      <div className="welcome-hero">
        <div className="hero-content">
          <div className="hero-image">
            <img src="/team-photo.jpg" alt="Athletes training together" />
          </div>
          <h1 className="hero-title">The platform coaches trust.</h1>
          <p className="hero-subtitle">All your workouts in one place.</p>
          <div className="hero-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
        </div>
      </div>

      <div className="welcome-login">
        <div className="login-content">
          <h2 className="login-title">Welcome Back</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            {(formError || error) && (
              <div className="alert alert-error">
                {formError || error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              variant="default"
              block
              loading={loading}
            >
              Log In
            </Button>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="signup-section">
            <p className="signup-text">New here?</p>
            <Button
              variant="outline"
              block
              onClick={() => navigate('/signup')}
            >
              Sign up for new account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
