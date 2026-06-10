import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface Props {
  label: string;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
}

/** Standardized icon button: consistent hit area, alignment, and weight. */
export function IconButton({ label, onClick, active, size = 'md', className, children }: Props) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors shrink-0',
        size === 'sm' && 'w-8 h-8',
        size === 'md' && 'w-10 h-10',
        size === 'lg' && 'w-12 h-12',
        active ? 'text-ember-400' : 'text-ink-300 hover:text-ink-100',
        'hover:bg-ink-700/70 active:scale-95',
        className,
      )}
    >
      {children}
    </button>
  );
}
