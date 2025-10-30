
import React from 'react';

interface IconButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  'aria-label': string;
  disabled?: boolean;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, children, 'aria-label': ariaLabel, disabled = false, className = '' }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
};

export default IconButton;
