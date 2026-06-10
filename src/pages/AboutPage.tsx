import { usePageTitle } from '@/hooks/usePageTitle';
import { API_BASES } from '@/constants/endpoints';

export default function AboutPage() {
  usePageTitle('About');
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <img src="/icons/icon.svg" alt="" className="w-16 h-16 rounded-2xl" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarang</h1>
          <p className="text-sm text-ink-400">Waves of music, tuned to you · v1.0.0</p>
        </div>
      </div>

      <div className="space-y-5 text-sm text-ink-200 leading-relaxed">
        <p>
          <em>Tarang</em> (तरंग) means “wave”. The idea behind this app is simple: a music service
          should feel personal without demanding an account. Tarang has no login, no signup, no
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
          Music metadata and streams come from community JioSaavn API wrappers. Availability varies;
          Tarang continuously health-scores {API_BASES.length} sources and fails over between them:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-ink-300">
          {API_BASES.map((b) => (
            <li key={b.id}>{b.label}</li>
          ))}
        </ul>
        <p className="text-ink-400 text-xs">
          Tarang streams content only — it implements no DRM circumvention and no persistent
          downloading of copyrighted media. Production builds disable source maps as cosmetic
          deterrence; this is not security and the client holds no secrets.
        </p>
      </div>
    </div>
  );
}
