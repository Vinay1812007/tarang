import { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { canInstall, onInstallAvailable, promptInstall } from '@/utils/installPrompt';
import { shareLink } from '@/utils/share';
import { toast } from '@/store/toastStore';
import { API_BASES } from '@/constants/endpoints';

export default function AboutPage() {
  usePageTitle('About');
  const [installable, setInstallable] = useState(canInstall());
  useEffect(() => onInstallAvailable(() => setInstallable(true)), []);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <img src="/icons/icon.svg" alt="" className="w-16 h-16 rounded-2xl" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VinaX</h1>
          <p className="text-sm text-ink-400">Music tuned to you · v1.16.4</p>
        </div>
        <button
          onClick={() => void shareLink('/', 'VinaX — music tuned to you').then((r) => r === 'copied' && toast('Link copied'))}
          className="ml-auto px-5 py-2.5 rounded-full border border-ink-600 text-sm font-semibold hover:border-ink-400"
        >
          Share app
        </button>
        {installable && (
          <button
            onClick={() => void promptInstall().then((ok) => ok && setInstallable(false))}
            className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-bold hover:bg-ember-400"
          >
            Install app
          </button>
        )}
      </div>

      <div className="space-y-5 text-sm text-ink-200 leading-relaxed">
        <p>
          <em>VinaX</em> is built on a simple idea: a music service
          should feel personal without demanding an account. VinaX has no login, no signup, no
          profile servers. Your taste lives where it belongs — on your device — and the
          recommendations that feel intelligent are deterministic local math, fully explainable on
          your <a href="/taste-profile" className="text-ember-400">Taste Profile</a> page.
        </p>
        <p>
          The design system is original: ink-dark surfaces, an ember accent inspired by stage
          lighting, tidal teal for data, generous radii, and motion that supports rather than
          performs. No assets, logos, or visual systems are borrowed from any existing music
          product.
        </p>
        <p>
          Music metadata and streams come from {API_BASES.length} independent community catalog
          sources. Availability varies; VinaX continuously health-scores them and fails over
          automatically so one outage never takes the app down.
        </p>
        <p className="text-ink-400 text-xs">
          VinaX streams content only — it implements no DRM circumvention and no persistent
          downloading of copyrighted media. Production builds disable source maps as cosmetic
          deterrence; this is not security and the client holds no secrets.
        </p>
      </div>
    </div>
  );
}
