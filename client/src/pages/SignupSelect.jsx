import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupSelect.css';

const SignupSelect = () => {
  const navigate = useNavigate();

  return (
    <div className="signup-select-page">
      <nav className="signup-nav">
        <Link to="/" className="nav-logo">Bar Bend</Link>
      </nav>

      <div className="signup-select-content">
        <h1>Choose Your Program</h1>
        <p className="subtitle">Select the option that best fits your needs</p>

        <div className="program-cards">
          <div className="program-card" onClick={() => navigate('/signup/team')}>
            <div className="card-icon">🏫</div>
            <h2>Teams & Schools</h2>
            <p className="card-subtitle">For Universities, Colleges, and High Schools</p>
            <p className="card-description">
              Manage entire athletic programs with team-based workout assignments. Perfect for coaches overseeing multiple athletes.
            </p>
            <span className="card-link">Learn More →</span>
          </div>

          <div className="program-card" onClick={() => navigate('/signup/trainer')}>
            <div className="card-icon">💪</div>
            <h2>Personal Trainers</h2>
            <p className="card-subtitle">For Independent Trainers & Gyms</p>
            <p className="card-description">
              Manage your clients with customized workout programs. Ideal for personal trainers and small gym owners.
            </p>
            <span className="card-link">Get Started →</span>
          </div>
        </div>

        <div className="athlete-signup">
          <p>Are you an athlete looking to join your team?</p>
          <Link to="/signup/athlete" className="athlete-link">
            Sign up as an Athlete →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupSelect;
