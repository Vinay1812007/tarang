import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { FALLBACK_ART } from '@/utils/images';
import { PlayIcon } from './Icons';

interface Props {
  to: string;
  image: string;
  title: string;
  subtitle?: string;
  round?: boolean;
  /** Fill the parent cell (grid layouts) instead of fixed shelf width. */
  fluid?: boolean;
  onPlay?: () => void;
}

export function MediaCard({ to, image, title, subtitle, round, fluid, onPlay }: Props) {
  return (
    <Link
      to={to}
      data-deter-context
      className={cn(
        'group rounded-2xl p-2.5 hover:bg-ink-850 transition-colors animate-fade-up',
        fluid ? 'w-full' : 'w-36 sm:w-40 shrink-0',
      )}
    >
      <div className="relative">
        <img
          src={image || FALLBACK_ART}
          onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_ART)}
          alt=""
          loading="lazy"
          className={cn('w-full aspect-square object-cover shadow-lg', round ? 'rounded-full' : 'rounded-xl')}
        />
        {onPlay && (
          <button
            aria-label={`Play ${title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPlay();
            }}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
          >
            <PlayIcon className="w-5 h-5 ml-0.5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold truncate">{title}</p>
      {subtitle && <p className="text-xs text-ink-300 truncate">{subtitle}</p>}
    </Link>
  );
}
