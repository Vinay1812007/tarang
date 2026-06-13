const KEY = 'vinax.streak.v1';

interface StreakData {
  count: number;
  lastDay: string; // YYYY-MM-DD
}

function dayStr(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** Call on each play; returns the current consecutive-day streak. */
export function bumpStreak(): number {
  try {
    const today = dayStr();
    const raw = window.localStorage.getItem(KEY);
    const data: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDay: '' };
    if (data.lastDay === today) return data.count;
    const yesterday = dayStr(Date.now() - 86_400_000);
    const next: StreakData = {
      count: data.lastDay === yesterday ? data.count + 1 : 1,
      lastDay: today,
    };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    return next.count;
  } catch {
    return 0;
  }
}

export function getStreak(): number {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return 0;
    const data: StreakData = JSON.parse(raw);
    const valid = data.lastDay === dayStr() || data.lastDay === dayStr(Date.now() - 86_400_000);
    return valid ? data.count : 0;
  } catch {
    return 0;
  }
}
