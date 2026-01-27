/**
 * Toast Notification Component
 * Displays temporary success/error/info messages
 */

import { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-700';
      case 'error':
        return 'bg-red-600 border-red-700';
      case 'warning':
        return 'bg-yellow-600 border-yellow-700';
      case 'info':
        return 'bg-blue-600 border-blue-700';
      default:
        return 'bg-stone-600 border-stone-700';
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 ${getColors()} border-4 p-4 max-w-md shadow-lg animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <span className="text-2xl">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-white font-semibold">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-stone-200 font-bold text-xl"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
