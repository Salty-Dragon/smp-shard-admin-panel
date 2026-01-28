/**
 * Loading Spinner Component
 * Displays a loading indicator
 */

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function Spinner({ size = 'medium', message }: SpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-6 h-6 border-2';
      case 'medium':
        return 'w-12 h-12 border-4';
      case 'large':
        return 'w-16 h-16 border-4';
      default:
        return 'w-12 h-12 border-4';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${getSizeClasses()} border-stone-700 border-t-green-400 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      ></div>
      {message && (
        <p className="mt-4 text-stone-400 text-sm">{message}</p>
      )}
    </div>
  );
}
