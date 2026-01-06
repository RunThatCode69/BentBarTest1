import React, { useState } from 'react';
import './Calendar.css';

const Calendar = ({
  selectedDate,
  onDateSelect,
  workouts = [],
  view = 'monthly',
  onViewChange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Add previous month's days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getWeekDays = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({ date: d, isCurrentMonth: true });
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const getWorkoutForDate = (date) => {
    return workouts.find(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === new Date(selectedDate).toDateString();
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const days = view === 'weekly' ? getWeekDays(currentDate) : getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={() => navigateMonth(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="calendar-title">
          {view === 'weekly' ? formatWeekRange(currentDate) : formatMonth(currentDate)}
        </span>
        <button className="calendar-nav" onClick={() => navigateMonth(1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {onViewChange && (
        <div className="calendar-views">
          <button
            className={`calendar-view-btn ${view === 'daily' ? 'active' : ''}`}
            onClick={() => onViewChange('daily')}
          >
            Daily
          </button>
          <button
            className={`calendar-view-btn ${view === 'weekly' ? 'active' : ''}`}
            onClick={() => onViewChange('weekly')}
          >
            Weekly
          </button>
          <button
            className={`calendar-view-btn ${view === 'monthly' ? 'active' : ''}`}
            onClick={() => onViewChange('monthly')}
          >
            Monthly
          </button>
        </div>
      )}

      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>

      <div className={`calendar-days ${view === 'weekly' ? 'weekly' : ''}`}>
        {days.map((day, index) => {
          const workout = getWorkoutForDate(day.date);
          const dayClasses = [
            'calendar-day',
            !day.isCurrentMonth && 'other-month',
            isToday(day.date) && 'today',
            isSelected(day.date) && 'selected',
            workout && 'has-workout'
          ].filter(Boolean).join(' ');

          return (
            <div
              key={index}
              className={dayClasses}
              onClick={() => onDateSelect && onDateSelect(day.date)}
            >
              <span className="calendar-day-number">{day.date.getDate()}</span>
              {workout && (
                <div className="calendar-workout-preview">
                  <span className="calendar-workout-title">{workout.title || 'Workout'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
