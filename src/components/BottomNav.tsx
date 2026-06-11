import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { HomeIcon, LibraryIcon, SearchIcon, SparkleIcon } from './Icons';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/made-for-you', label: 'For You', icon: SparkleIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
];

export function BottomNav() {
  return (
    <nav className="md:hidden bg-ink-950/95 backdrop-blur border-t border-ink-800">
      <ul className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 pt-2 pb-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-ember-400' : 'text-ink-400 active:text-ink-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex items-center justify-center w-12 h-7 rounded-full transition-colors',
                      isActive && 'bg-ember-500/15',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
