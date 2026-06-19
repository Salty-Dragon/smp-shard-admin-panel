/**
 * Loading Spinner Component
 * Displays a loading indicator, themed to match the website.
 */

import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function Spinner({ size = 'medium', message }: SpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6';
      case 'medium':
        return 'w-10 h-10';
      case 'large':
        return 'w-14 h-14';
      default:
        return 'w-10 h-10';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${getSizeClasses()} text-green-400 animate-spin`} role="status" aria-label="Loading" />
      {message && <p className="mt-4 text-gray-400 text-sm">{message}</p>}
    </div>
  );
}
