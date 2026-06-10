import { Link } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { WaveIcon } from '@/components/Icons';

export default function NotFoundPage() {
  usePageTitle('Not Found');
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center gap-4">
      <WaveIcon className="w-14 h-14 text-ink-500" />
      <p className="text-4xl font-bold">404</p>
      <p className="text-ink-300">This wave doesn’t exist.</p>
      <Link to="/" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold hover:bg-ember-400">
        Back to Home
      </Link>
    </div>
  );
}
