import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AthleteCenterPanel.css';

const AthleteCenterPanel = ({ athletes = [], workouts = [] }) => {
  const navigate = useNavigate();

  // Calculate days since last login
  const getDaysSinceLogin = (lastLogin) => {
    if (!lastLogin) return null;
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffTime = Math.abs(now - loginDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get athletes who haven't logged in recently (7+ days)
  const inactiveAthletes = athletes.filter(athlete => {
    const daysSince = getDaysSinceLogin(athlete.lastLogin);
    return daysSince === null || daysSince >= 7;
  });

  // Get athletes with missed workouts (simplified - athletes who haven't completed recent workouts)
  const getMissedWorkouts = () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const notifications = [];

    // Check each athlete for missed workouts
    athletes.forEach(athlete => {
      // If athlete has incomplete workouts in the past 3 days, add notification
      if (athlete.missedWorkouts && athlete.missedWorkouts > 0) {
        notifications.push({
          type: 'missed_workout',
          athlete: athlete,
          message: `missed ${athlete.missedWorkouts} workout${athlete.missedWorkouts > 1 ? 's' : ''}`,
          priority: 'high'
        });
      }
    });

    return notifications;
  };

  // Build notifications list
  const buildNotifications = () => {
    const notifications = [];

    // Add inactive athlete notifications
    inactiveAthletes.forEach(athlete => {
      const days = getDaysSinceLogin(athlete.lastLogin);
      notifications.push({
        type: 'inactive',
        athlete: athlete,
        message: days === null ? 'has never logged in' : `hasn't logged in for ${days} days`,
        priority: days === null || days >= 14 ? 'high' : 'medium'
      });
    });

    // Add missed workout notifications
    const missedNotifications = getMissedWorkouts();
    notifications.push(...missedNotifications);

    // Sort by priority (high first)
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const notifications = buildNotifications();

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'inactive':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
      case 'missed_workout':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  return (
    <div className="athlete-center-container">
      <div className="panel-header">
        <h3>Athlete Center</h3>
        <span className="notification-count">
          {notifications.length} alert{notifications.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <div
              key={index}
              className={`notification-item ${getPriorityClass(notification.priority)}`}
              onClick={() => navigate('/coach/athletes')}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <span className="athlete-name">
                  {notification.athlete.firstName} {notification.athlete.lastName}
                </span>
                <span className="notification-message">{notification.message}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>All athletes are on track!</p>
            <span className="hint">No alerts at this time</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteCenterPanel;
