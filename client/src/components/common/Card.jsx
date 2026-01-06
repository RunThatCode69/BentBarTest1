import React from 'react';
import '../../styles/components.css';

const Card = ({
  children,
  title,
  subtitle,
  footer,
  clickable = false,
  onClick,
  className = ''
}) => {
  const cardClass = `card ${clickable ? 'card-clickable' : ''} ${className}`;

  return (
    <div className={cardClass} onClick={clickable ? onClick : undefined}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h4 className="card-title">{title}</h4>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
