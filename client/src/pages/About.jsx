import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  const features = [
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor athlete performance with comprehensive statistics and personal records.'
    },
    {
      icon: '📅',
      title: 'Workout Calendar',
      description: 'Plan and schedule workouts with an intuitive calendar interface.'
    },
    {
      icon: '👥',
      title: 'Team Management',
      description: 'Manage multiple teams, sports, and athletes all in one place.'
    },
    {
      icon: '📱',
      title: 'Access Anywhere',
      description: 'Athletes can view their workouts and log stats from any device.'
    },
    {
      icon: '🎯',
      title: 'Calculated Weights',
      description: 'Automatically calculate weights based on percentage of 1RM.'
    },
    {
      icon: '🔒',
      title: 'Secure Access',
      description: 'Team access codes ensure only authorized athletes join your program.'
    }
  ];

  return (
    <div className="about-page">
      <nav className="about-nav">
        <Link to="/" className="nav-logo">TeamBuilder</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link active">About</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>
      </nav>

      <section className="about-hero">
        <div className="container">
          <h1>Transform Your Team's Training</h1>
          <p>TeamBuilder is the modern solution for coaches and athletes to manage workouts, track progress, and achieve their goals together.</p>
        </div>
      </section>

      <section className="about-mission">
        <div className="container">
          <h2>Our Mission</h2>
          <p>We believe that every athlete deserves access to professional-grade training tools. Our platform eliminates the chaos of spreadsheets and word documents, replacing them with a streamlined, intuitive system that keeps everyone on the same page.</p>
        </div>
      </section>

      <section className="about-features">
        <div className="container">
          <h2>Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join coaches and athletes who are already transforming their training.</p>
          <Link to="/signup" className="cta-button">Sign Up Now</Link>
        </div>
      </section>

      <footer className="about-footer">
        <div className="container">
          <p>&copy; 2024 TeamBuilder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
