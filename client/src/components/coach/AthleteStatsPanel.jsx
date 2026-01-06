import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import './AthleteStatsPanel.css';

const AthleteStatsPanel = ({ stats = [], onViewAll }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-cycle through stats
  useEffect(() => {
    if (stats.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % stats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [stats.length]);

  const currentStats = stats.slice(currentIndex, currentIndex + 3);

  // If we don't have enough stats, wrap around
  const displayStats = currentStats.length < 3
    ? [...currentStats, ...stats.slice(0, 3 - currentStats.length)]
    : currentStats;

  return (
    <div className="stats-panel-container" onClick={onViewAll}>
      <div className="panel-header">
        <h3>Athlete Statistics</h3>
        <span className="view-all">View All →</span>
      </div>

      <div className="stats-carousel">
        {stats.length === 0 ? (
          <div className="empty-stats">
            <p>No athlete stats yet</p>
            <span>Stats will appear as athletes log their lifts</span>
          </div>
        ) : (
          <div className="stats-cards">
            {displayStats.map((stat, index) => (
              <div key={`${stat.athleteId}-${stat.exerciseName}-${index}`} className="stat-card">
                <div className="stat-athlete">
                  <span className="athlete-name">{stat.athleteName}</span>
                  <span className="team-sport">{stat.teamName}</span>
                </div>
                <div className="stat-exercise">
                  <span className="exercise-name">{stat.exerciseName}</span>
                  <span className="exercise-value">{stat.oneRepMax} lbs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.length > 3 && (
        <div className="carousel-indicators">
          {Array.from({ length: Math.ceil(stats.length / 3) }).map((_, i) => (
            <span
              key={i}
              className={`indicator ${Math.floor(currentIndex / 3) === i ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(i * 3);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AthleteStatsPanel;
