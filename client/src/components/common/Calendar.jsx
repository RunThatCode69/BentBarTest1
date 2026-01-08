import React, { useState } from 'react';
import './Calendar.css';

const Calendar = ({
  selectedDate,
  onDateSelect,
  workouts = [],
  view = 'threeWeeks',
  onViewChange,
  onDayExpand
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

  const getThreeWeeksDays = (date) => {
    const start = new Date(date);
    // Start from the beginning of the current week
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 21; i++) { // 3 weeks = 21 days
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({ date: d, isCurrentMonth: true });
    }
    return days;
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(currentDate);
    if (view === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'threeWeeks') {
      newDate.setDate(newDate.getDate() + (direction * 21));
    } else if (view === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const getWorkoutForDate = (date) => {
    return workouts.find(w => {
      const workoutDate = new Date(w.date);
      // Normalize both dates to midnight local time for comparison
      workoutDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === targetDate.getTime();
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

  const formatThreeWeeksRange = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 20);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const formatDayTitle = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleDayClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleDayDoubleClick = (date) => {
    // Double-click expands to day view
    if (onDayExpand && view !== 'daily') {
      onDayExpand(date);
    }
  };

  const getDays = () => {
    switch (view) {
      case 'daily':
        return [{ date: currentDate, isCurrentMonth: true }];
      case 'weekly':
        return getWeekDays(currentDate);
      case 'threeWeeks':
        return getThreeWeeksDays(currentDate);
      case 'monthly':
      default:
        return getDaysInMonth(currentDate);
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'daily':
        return formatDayTitle(currentDate);
      case 'weekly':
        return formatWeekRange(currentDate);
      case 'threeWeeks':
        return formatThreeWeeksRange(currentDate);
      case 'monthly':
      default:
        return formatMonth(currentDate);
    }
  };

  const days = getDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate number of rows for grid
  const getRowCount = () => {
    if (view === 'threeWeeks') return 3;
    if (view === 'weekly') return 1;
    if (view === 'daily') return 1;
    return 6; // monthly
  };

  return (
    <div className={`calendar calendar-${view}`}>
      <div className="calendar-header">
        <button className="calendar-nav" onClick={() => navigateCalendar(-1)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="calendar-title">{getTitle()}</span>
        <button className="calendar-nav" onClick={() => navigateCalendar(1)}>
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
            Day
          </button>
          <button
            className={`calendar-view-btn ${view === 'weekly' ? 'active' : ''}`}
            onClick={() => onViewChange('weekly')}
          >
            Week
          </button>
          <button
            className={`calendar-view-btn ${view === 'threeWeeks' ? 'active' : ''}`}
            onClick={() => onViewChange('threeWeeks')}
          >
            3 Weeks
          </button>
          <button
            className={`calendar-view-btn ${view === 'monthly' ? 'active' : ''}`}
            onClick={() => onViewChange('monthly')}
          >
            Month
          </button>
        </div>
      )}

      {view !== 'daily' && (
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
      )}

      <div
        className={`calendar-days calendar-days-${view}`}
        style={{ '--row-count': getRowCount() }}
      >
        {days.map((day, index) => {
          const workout = getWorkoutForDate(day.date);
          const exercises = workout?.exercises || [];
          const displayExercises = exercises.slice(0, 5);
          const remainingCount = exercises.length - 5;

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
              onClick={() => handleDayClick(day.date)}
              onDoubleClick={() => handleDayDoubleClick(day.date)}
            >
              <div className="calendar-day-header">
                <span className="calendar-day-number">{day.date.getDate()}</span>
                {view === 'daily' && (
                  <span className="calendar-day-name">
                    {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </span>
                )}
              </div>

              {workout && (
                <div className="calendar-workout-content">
                  <div className="calendar-exercises">
                    {displayExercises.map((exercise, i) => (
                      <div key={i} className="calendar-exercise-preview">
                        <span className="exercise-preview-name">{exercise.exerciseName}</span>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="calendar-exercise-more">
                        +{remainingCount} more exercise{remainingCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
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
