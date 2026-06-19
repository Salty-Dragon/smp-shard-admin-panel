/**
 * Modal Component
 * Generic modal dialog for forms and content, themed to match the website.
 */

import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export default function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'max-w-md';
      case 'medium':
        return 'max-w-2xl';
      case 'large':
        return 'max-w-4xl';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`glass-strong border border-green-500/30 rounded-2xl ${getSizeClasses()} w-full max-h-[90vh] overflow-y-auto glow-green-sm`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-green-500/15">
              <h2 className="text-xl font-bold text-green-400 text-glow">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white rounded-lg p-1 hover:bg-white/5 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
