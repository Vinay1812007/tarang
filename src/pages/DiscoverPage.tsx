import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Shelf } from '@/components/Shelf';
import { MediaCard } from '@/components/MediaCard';
import { Chip } from '@/components/Chip';
import { ShelfSkeleton } from '@/components/Skeletons';
import { ErrorState } from '@/components/States';
import { MOODS } from '@/constants/seeds';
import { LANGUAGES, languageLabel } from '@/constants/languages';
import { useMoodSongs, useEditorialPlaylists } from '@/features/discover/useDiscover';
import { useTrendingForLanguage } from '@/features/home/useHomeShelves';
import { useSettingsStore } from '@/store/settingsStore';
import { usePlayerStore } from '@/store/playerStore';
import { bestImage } from '@/utils/images';

export default function DiscoverPage() {
  usePageTitle('Discover');
  const pinned = useSettingsStore((s) => s.pinnedLanguages);
  const [lang, setLang] = useState(pinned[0] ?? 'hindi');
  const [mood, setMood] = useState<string>(MOODS[0].id);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const trending = useTrendingForLanguage(lang);
  const moodSongs = useMoodSongs(mood, lang);
  const editorial = useEditorialPlaylists(`${languageLabel(lang)} hits`);

  return (
    <div className="max-w-screen-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Discover</h1>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {LANGUAGES.map((l) => (
          <Chip key={l.id} active={lang === l.id} onClick={() => setLang(l.id)}>
            {l.label}
          </Chip>
        ))}
      </div>

      {trending.isError ? (
        <ErrorState retry={() => trending.refetch()} />
      ) : trending.isLoading ? (
        <ShelfSkeleton />
      ) : (
        <Shelf title={`Trending Now · ${languageLabel(lang)}`} explanation="Fresh popularity signals, re-ranked by your taste">
          {(trending.data ?? []).map((song, i) => (
            <MediaCard key={song.id} to={`/song/${song.id}`} image={bestImage(song.images)} title={song.title} subtitle={song.subtitle} onPlay={() => playQueue(trending.data ?? [], i)} />
          ))}
        </Shelf>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {MOODS.map((m) => (
          <Chip key={m.id} active={mood === m.id} onClick={() => setMood(m.id)}>
            {m.emoji} {m.label}
          </Chip>
        ))}
      </div>

      {moodSongs.isLoading ? (
        <ShelfSkeleton />
      ) : (
        <Shelf title={`${MOODS.find((m) => m.id === mood)?.label} Picks`} explanation={`${languageLabel(lang)} · mood-matched`}>
          {(moodSongs.data ?? []).map((song, i) => (
            <MediaCard key={song.id} to={`/song/${song.id}`} image={bestImage(song.images)} title={song.title} subtitle={song.subtitle} onPlay={() => playQueue(moodSongs.data ?? [], i)} />
          ))}
        </Shelf>
      )}

      {editorial.data && editorial.data.length > 0 && (
        <Shelf title="Playlists For The Vibe" explanation="Editorial-style picks from upstream catalogs">
          {editorial.data.map((p) => (
            <MediaCard key={p.id} to={`/playlist/${p.id}`} image={bestImage(p.images)} title={p.title} subtitle={p.subtitle || `${p.songCount ?? ''} songs`} />
          ))}
        </Shelf>
      )}
    </div>
  );
}
