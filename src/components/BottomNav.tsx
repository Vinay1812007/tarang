import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { CompassIcon, HomeIcon, LibraryIcon, SearchIcon, SparkleIcon } from './Icons';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/discover', label: 'Discover', icon: CompassIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/made-for-you', label: 'For You', icon: SparkleIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
];

export function BottomNav() {
  return (
    <nav className="md:hidden bg-ink-950/95 backdrop-blur border-t border-ink-700">
      <ul className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                  isActive ? 'text-ember-400' : 'text-ink-300',
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
