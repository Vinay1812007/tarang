import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** Consistent expressive screen header — display title, compact subtitle. */
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-display tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-meta text-ink-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
