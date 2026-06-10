import type { Song } from '@/types';
import { addEvent } from '@/services/storage/idb';
import {
  applyDecay,
  bumpArtist,
  bumpLanguage,
  rememberRecent,
  type TasteProfile,
} from './profile';
import { loadProfile, saveProfile } from './storage';

function logEvent(type: string, song: Song, playedSec?: number): void {
  void addEvent({
    ts: Date.now(),
    type,
    songId: song.id,
    title: song.title,
    artistNames: song.artists.map((a) => a.name),
    language: song.language,
    playedSec,
    songDuration: song.duration,
  });
}

function withProfile(fn: (p: TasteProfile) => void): void {
  const profile = loadProfile();
  applyDecay(profile);
  fn(profile);
  saveProfile(profile);
}

function bumpAll(p: TasteProfile, song: Song, delta: number, kind: 'play' | 'complete' | 'skip'): void {
  bumpLanguage(p, song.language, delta, kind);
  for (const artist of song.artists.slice(0, 3)) {
    bumpArtist(p, artist.id, artist.name, delta, kind);
  }
}

export function recordPlay(song: Song): void {
  withProfile((p) => {
    bumpAll(p, song, 1, 'play');
    p.totals.plays += 1;
    p.hourHistogram[new Date().getHours()] += 1;
    rememberRecent(p, song.id);
  });
  logEvent('play', song);
}

export function recordComplete(song: Song, playedSec: number): void {
  withProfile((p) => {
    bumpAll(p, song, 2, 'complete');
    p.totals.completes += 1;
  });
  logEvent('complete', song, playedSec);
}

export function recordSkip(song: Song, playedSec: number): void {
  withProfile((p) => {
    bumpAll(p, song, -0.75, 'skip');
    p.totals.skips += 1;
  });
  logEvent('skip', song, playedSec);
}

export function recordFavorite(song: Song, favored: boolean): void {
  withProfile((p) => {
    bumpAll(p, song, favored ? 3 : -3, 'play');
    p.totals.favorites += favored ? 1 : -1;
    if (p.totals.favorites < 0) p.totals.favorites = 0;
  });
  if (favored) logEvent('favorite', song);
}

export function recordQueueAdd(song: Song): void {
  withProfile((p) => {
    bumpAll(p, song, 0.5, 'play');
    p.totals.queueAdds += 1;
  });
  logEvent('queue_add', song);
}
