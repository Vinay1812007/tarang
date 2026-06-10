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

export interface LibraryState {
  favorites: Song[];
  collections: LocalCollection[];

  toggleFavorite(song: Song): void;
  isFavorite(id: string): boolean;
  clearFavorites(): void;
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
