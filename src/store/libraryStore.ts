import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Song } from '@/types';
import { KEYS } from '@/constants/storage-keys';
import { recordFavorite } from '@/services/personalization/updater';

export interface LocalCollection {
  id: string;
  name: string;
  createdAt: number;
  songs: Song[];
}

export interface SavedEntity {
  id: string;
  kind: 'album' | 'artist' | 'playlist';
  title: string;
  subtitle: string;
  image: string | null;
  savedAt: number;
}

export interface LibraryState {
  favorites: Song[];
  collections: LocalCollection[];
  saved: SavedEntity[];
  hiddenSongIds: string[];

  toggleFavorite(song: Song): void;
  isFavorite(id: string): boolean;
  clearFavorites(): void;
  toggleSaved(entity: Omit<SavedEntity, 'savedAt'>): void;
  isSaved(id: string): boolean;
  toggleHidden(songId: string): void;
  isHidden(id: string): boolean;
  createCollection(name: string): string;
  deleteCollection(id: string): void;
  addToCollection(collectionId: string, song: Song): void;
  removeFromCollection(collectionId: string, songId: string): void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      collections: [],
      saved: [],
      hiddenSongIds: [],
      toggleFavorite: (song) => {
        const { favorites } = get();
        const exists = favorites.some((s) => s.id === song.id);
        recordFavorite(song, !exists);
        set({
          favorites: exists ? favorites.filter((s) => s.id !== song.id) : [song, ...favorites],
        });
      },
      isFavorite: (id) => get().favorites.some((s) => s.id === id),
      clearFavorites: () => set({ favorites: [] }),
      toggleSaved: (entity) => {
        const { saved } = get();
        const exists = saved.some((e) => e.id === entity.id && e.kind === entity.kind);
        set({
          saved: exists
            ? saved.filter((e) => !(e.id === entity.id && e.kind === entity.kind))
            : [{ ...entity, savedAt: Date.now() }, ...saved],
        });
      },
      isSaved: (id) => get().saved.some((e) => e.id === id),
      toggleHidden: (songId) => {
        const { hiddenSongIds } = get();
        set({
          hiddenSongIds: hiddenSongIds.includes(songId)
            ? hiddenSongIds.filter((i) => i !== songId)
            : [songId, ...hiddenSongIds].slice(0, 500),
        });
      },
      isHidden: (id) => get().hiddenSongIds.includes(id),
      createCollection: (name) => {
        const id = `col-${Date.now().toString(36)}`;
        set({
          collections: [...get().collections, { id, name, createdAt: Date.now(), songs: [] }],
        });
        return id;
      },
      deleteCollection: (id) => set({ collections: get().collections.filter((c) => c.id !== id) }),
      addToCollection: (collectionId, song) =>
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId && !c.songs.some((s) => s.id === song.id)
              ? { ...c, songs: [...c.songs, song] }
              : c,
          ),
        }),
      removeFromCollection: (collectionId, songId) =>
        set({
          collections: get().collections.map((c) =>
            c.id === collectionId ? { ...c, songs: c.songs.filter((s) => s.id !== songId) } : c,
          ),
        }),
    }),
    { name: KEYS.library, storage: createJSONStorage(() => window.localStorage) },
  ),
);
