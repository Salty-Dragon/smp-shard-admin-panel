/**
 * Button — themed to match the v1rtopia website.
 *
 * Variants:
 *  - primary:   solid green, black text (main call to action)
 *  - secondary: outlined green on transparent
 *  - danger:    outlined red on transparent
 *  - ghost:     subtle, low-emphasis action
 *
 * Usage:
 *   import Button from '@/components/Button';
 *   <Button variant="primary" onClick={handleClick}>Save</Button>
 */

import React from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  title?: string;
  'aria-label'?: string;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-green-500 hover:bg-green-400 text-black font-semibold hover:glow-green-sm',
  // success kept as an alias of primary for backward compatibility
  success:
    'bg-green-500 hover:bg-green-400 text-black font-semibold hover:glow-green-sm',
  secondary:
    'border border-green-500/50 text-green-400 hover:bg-green-500/10 font-medium',
  danger:
    'border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium',
  ghost:
    'text-gray-300 hover:text-white hover:bg-white/5 font-medium',
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  title,
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;
