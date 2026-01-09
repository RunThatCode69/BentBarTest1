import React from 'react';
import { Link } from 'react-router-dom';
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
  href,
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

  const content = loading ? (
    <>
      <span className="spinner spinner-sm" style={{ marginRight: '8px' }} />
      Loading...
    </>
  ) : (
    children
  );

  // If href is provided, render as a Link
  if (href && !disabled && !loading) {
    return (
      <Link to={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
