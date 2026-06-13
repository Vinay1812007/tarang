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
        'group rounded-card p-2.5 hover:bg-ink-850/80 transition-all duration-300 ease-vinax hover:-translate-y-1 hover:shadow-float animate-fade-up',
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
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-ember-500 text-ink-950 flex items-center justify-center shadow-xl transition-all opacity-100 md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 active:scale-95"
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
