/**
 * Toast Notification Component
 * Displays temporary success/error/info messages, themed to match the website.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, type LucideIcon } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const TOAST_STYLES: Record<ToastProps['type'], { icon: LucideIcon; accent: string; border: string }> = {
  success: { icon: CheckCircle2, accent: 'text-green-400', border: 'border-green-500/40' },
  error: { icon: XCircle, accent: 'text-red-400', border: 'border-red-500/40' },
  warning: { icon: AlertTriangle, accent: 'text-yellow-400', border: 'border-yellow-500/40' },
  info: { icon: Info, accent: 'text-blue-400', border: 'border-blue-500/40' },
};

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const { icon: Icon, accent, border } = TOAST_STYLES[type];

  return (
    <motion.div
      className={`fixed bottom-4 right-4 z-50 glass-strong border ${border} rounded-xl p-4 max-w-md shadow-2xl`}
      role="alert"
      initial={{ opacity: 0, x: 40, y: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${accent}`} />
        <p className="flex-1 text-gray-100 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white rounded p-0.5 hover:bg-white/5 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
