/**
 * Card — glass panel matching the v1rtopia website theme.
 *
 * Dark translucent surface, green-tinted border, rounded corners and a soft
 * green glow on hover. Use for any boxed content region.
 */
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds a subtle green glow + border highlight on hover. */
  interactive?: boolean;
}

export default function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'glass rounded-2xl border border-green-500/20 p-6',
        interactive && 'transition-all hover:border-green-500/40 hover:glow-green-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
