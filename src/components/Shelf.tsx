import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  title: string;
  /** Explainability tag — why this shelf exists. */
  explanation?: string;
  seeAllTo?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Shelf({ title, explanation, seeAllTo, action, children }: Props) {
  return (
    <section className="mb-8 reveal">
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">{title}</h2>
          {explanation && <p className="text-xs text-ink-400 mt-0.5 truncate">{explanation}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {seeAllTo && (
            <Link to={seeAllTo} className="text-xs font-semibold text-ember-400 hover:text-ember-300">
              See all
            </Link>
          )}
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-2 px-2 snap-x">{children}</div>
    </section>
  );
}
