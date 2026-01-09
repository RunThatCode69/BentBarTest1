import React from 'react';
import '../../styles/components.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const inputClass = `form-input ${error ? 'is-error' : ''} ${className}`;

  // For number inputs, filter out non-numeric characters
  const handleChange = (e) => {
    if (type === 'number') {
      // Allow only digits, decimal point, and minus sign
      const newValue = e.target.value;
      // If the value contains invalid characters, don't update
      if (newValue !== '' && !/^-?\d*\.?\d*$/.test(newValue)) {
        return;
      }
    }
    onChange(e);
  };

  // Block invalid keys on keydown for number inputs
  const handleKeyDown = (e) => {
    if (type === 'number') {
      // Allow: backspace, delete, tab, escape, enter, decimal point, minus
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }

      // Allow the keys in our list
      if (allowedKeys.includes(e.key)) {
        return;
      }

      // Block anything that's not a digit
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    }

    // Call any existing onKeyDown handler
    if (props.onKeyDown) {
      props.onKeyDown(e);
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClass}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
};

export default Input;
