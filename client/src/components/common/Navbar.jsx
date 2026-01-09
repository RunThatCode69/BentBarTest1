import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (user?.role === 'coach') {
      return [
        { path: '/coach/dashboard', label: 'Dashboard' },
        { path: '/coach/workouts', label: 'Workouts' },
        { path: '/coach/athlete-history', label: 'Athlete Logs' },
        { path: '/coach/stats', label: 'Stats' }
      ];
    }
    if (user?.role === 'athlete') {
      return [
        { path: '/athlete/dashboard', label: 'Dashboard' },
        { path: '/athlete/workouts', label: 'Workouts' },
        { path: '/athlete/history', label: 'History' },
        { path: '/athlete/stats', label: 'My Stats' }
      ];
    }
    if (user?.role === 'trainer') {
      return [
        { path: '/trainer/dashboard', label: 'Dashboard' },
        { path: '/trainer/workouts', label: 'Workouts' }
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : user?.email;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user?.role === 'coach' ? '/coach/dashboard' : user?.role === 'athlete' ? '/athlete/dashboard' : '/'} className="navbar-logo">
          <span className="logo-text">Bar Bend</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-profile">
          <button
            className="profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="profile-avatar">
              {profile?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <span className="profile-name">{displayName}</span>
            <svg className={`profile-arrow ${dropdownOpen ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-name">{displayName}</span>
                <span className="dropdown-role">{user?.role}</span>
              </div>
              <div className="dropdown-divider" />
              <Link
                to={`/${user?.role}/settings`}
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="2" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M2.93 2.93l1.41 1.41M11.66 11.66l1.41 1.41M2.93 13.07l1.41-1.41M11.66 4.34l1.41-1.41" />
                </svg>
                Settings
              </Link>
              <button className="dropdown-item" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h1v6h-1a1 1 0 100 2h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                  <path d="M6.293 5.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10H2a1 1 0 110-2h5.586L6.293 6.707a1 1 0 010-1.414z" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
