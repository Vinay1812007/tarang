/**
 * Minimal promise-based IndexedDB wrapper (no dependency). Used for the
 * listen-event log that powers taste-profile insights — larger and more
 * structured than what we want in localStorage.
 */
const DB_NAME = 'tarang-db';
const DB_VERSION = 1;
export const EVENTS_STORE = 'events';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('ts', 'ts');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(EVENTS_STORE, mode);
        const req = fn(t.objectStore(EVENTS_STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export interface StoredEvent {
  id?: number;
  ts: number;
  type: string;
  songId: string;
  title: string;
  artistNames: string[];
  language: string | null;
  playedSec?: number;
  songDuration?: number | null;
}

export async function addEvent(evt: StoredEvent): Promise<void> {
  try {
    await tx('readwrite', (s) => s.add(evt));
  } catch {
    // IndexedDB unavailable (private mode etc.) — analytics-grade data only,
    // safe to drop.
  }
}

export async function getRecentEvents(limit = 500): Promise<StoredEvent[]> {
  try {
    const all = await tx<StoredEvent[]>('readonly', (s) => s.getAll());
    return all.slice(-limit);
  } catch {
    return [];
  }
}

export async function eventCount(): Promise<number> {
  try {
    return await tx<number>('readonly', (s) => s.count());
  } catch {
    return 0;
  }
}

export async function clearEvents(): Promise<void> {
  try {
    await tx('readwrite', (s) => s.clear());
  } catch {
    /* ignore */
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
    }
  } catch {
    /* ignore */
  }
  return null;
}
