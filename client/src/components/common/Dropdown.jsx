import React from 'react';
import '../../styles/components.css';

const Dropdown = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  showCreateNew = false,
  createNewLabel = '+ Create New',
  onCreateNew,
  ...props
}) => {
  const selectClass = `form-input form-select ${error ? 'is-error' : ''} ${className}`;

  const handleChange = (e) => {
    if (e.target.value === '__create_new__' && onCreateNew) {
      e.target.value = value; // Reset to previous value
      onCreateNew();
      return;
    }
    onChange(e);
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={selectClass}
        {...props}
      >
        <option value="">{placeholder}</option>
        {showCreateNew && (
          <option value="__create_new__" className="create-new-option">
            {createNewLabel}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
};

export default Dropdown;
