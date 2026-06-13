import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  ClockIcon,
  CompassIcon,
  GlobeIcon,
  HeartIcon,
  HomeIcon,
  LibraryIcon,
  MusicIcon,
  QueueIcon,
  SearchIcon,
  SettingsIcon,
  SparkleIcon,
  WaveIcon,
} from './Icons';

const groups: Array<{ label: string; items: Array<{ to: string; label: string; icon: typeof HomeIcon }> }> = [
  {
    label: 'Listen',
    items: [
      { to: '/', label: 'Home', icon: HomeIcon },
      { to: '/discover', label: 'Discover', icon: CompassIcon },
      { to: '/charts', label: 'Charts', icon: WaveIcon },
      { to: '/made-for-you', label: 'Made For You', icon: SparkleIcon },
      { to: '/search', label: 'Search', icon: SearchIcon },
    ],
  },
  {
    label: 'Your Music',
    items: [
      { to: '/library', label: 'Library', icon: LibraryIcon },
      { to: '/favorites', label: 'Favorites', icon: HeartIcon },
      { to: '/history', label: 'History', icon: ClockIcon },
      { to: '/queue', label: 'Queue', icon: QueueIcon },
    ],
  },
  {
    label: 'Explore',
    items: [
      { to: '/languages', label: 'Languages', icon: MusicIcon },
      { to: '/moods', label: 'Moods', icon: WaveIcon },
      { to: '/regions', label: 'Regions', icon: GlobeIcon },
      { to: '/taste-profile', label: 'Taste Profile', icon: SparkleIcon },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-ink-700 bg-ink-950/60 overflow-y-auto">
      <NavLink to="/" className="flex items-center gap-2.5 px-5 py-5">
        <img src="/icons/icon.svg" alt="" className="w-8 h-8 rounded-lg" />
        <span className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-ember-400 to-tide-400 bg-clip-text text-transparent">VinaX</span><span className="text-ember-500">.</span>
        </span>
      </NavLink>
      <nav className="flex-1 px-3 pb-6 space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-400">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-ink-800 text-ember-400 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:rounded-full before:bg-ember-500'
                          : 'text-ink-200 hover:bg-ink-800 hover:text-ink-100',
                      )
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
