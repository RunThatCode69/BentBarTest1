import React from 'react';
import '../../styles/components.css';

const Button = ({
  children,
  type = 'button',
  variant = 'default',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const blockClass = block ? 'btn-block' : '';

  const classes = [baseClass, variantClass, sizeClass, blockClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner spinner-sm" style={{ marginRight: '8px' }} />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
