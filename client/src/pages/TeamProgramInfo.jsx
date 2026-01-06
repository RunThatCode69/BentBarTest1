import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import './TeamProgramInfo.css';

const TeamProgramInfo = () => {
  const navigate = useNavigate();

  const features = [
    'Unlimited athletes per team',
    'Workout calendar and scheduling',
    'Athlete progress tracking',
    'One-rep max calculations',
    'Exercise library with videos',
    'Team access codes',
    'Multiple team support',
    'Stats and leaderboards'
  ];

  return (
    <div className="team-info-page">
      <nav className="team-info-nav">
        <Link to="/" className="nav-logo">Bar Bend</Link>
        <Link to="/signup" className="nav-back">← Back to Programs</Link>
      </nav>

      <div className="team-info-content">
        <div className="info-section">
          <h1>Team Programs for Schools</h1>
          <p className="lead">
            The complete workout management solution for universities, colleges, and high schools.
          </p>

          <div className="pricing-box">
            <span className="price">$200</span>
            <span className="period">/ month</span>
            <p className="pricing-note">Starting price for team programs</p>
          </div>

          <h3>Features included:</h3>
          <ul className="features-list">
            {features.map((feature, index) => (
              <li key={index}>
                <span className="check-icon">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="partner-note">
            <h3>Want to learn more?</h3>
            <p>Sign up to be contacted by our partner <strong>Moffitt Method</strong> for a personalized demo and consultation.</p>
          </div>
        </div>

        <div className="signup-section">
          <div className="signup-card">
            <h2>Ready to get started?</h2>
            <p>Choose your role to create an account:</p>

            <Button
              variant="primary"
              block
              onClick={() => navigate('/signup/coach')}
            >
              Sign Up as Coach
            </Button>

            <div className="divider">
              <span>or</span>
            </div>

            <Button
              variant="outline"
              block
              onClick={() => navigate('/signup/athlete')}
            >
              Join as Athlete
            </Button>

            <p className="hint-text">
              Athletes need an access code from their coach to join a team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamProgramInfo;
