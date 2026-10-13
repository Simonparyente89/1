import { addDays, fromISODate, toISODate, type ItemId } from './schedule';
import type { Progress } from './store';

export function isDayComplete(progress: Progress, iso: string, enabled: ItemId[]): boolean {
  const done = progress[iso];
  return !!done && enabled.length > 0 && enabled.every((id) => done.includes(id));
}

/**
 * Consecutive fully-completed days ending today. If today is not finished
 * yet, the streak still counts up to yesterday (you have until tonight).
 */
export function currentStreak(progress: Progress, enabled: ItemId[], today: Date): number {
  let d = today;
  if (!isDayComplete(progress, toISODate(d), enabled)) d = addDays(d, -1);
  let n = 0;
  while (isDayComplete(progress, toISODate(d), enabled)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(progress: Progress, enabled: ItemId[]): number {
  const days = Object.keys(progress)
    .filter((iso) => isDayComplete(progress, iso, enabled))
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const iso of days) {
    const isNext = prev !== null && toISODate(addDays(fromISODate(prev), 1)) === iso;
    run = isNext ? run + 1 : 1;
    best = Math.max(best, run);
    prev = iso;
  }
  return best;
}

export function totalCompleted(progress: Progress): number {
  return Object.values(progress).reduce((sum, ids) => sum + ids.length, 0);
}

export function countFor(progress: Progress, id: ItemId): number {
  return Object.values(progress).filter((ids) => ids.includes(id)).length;
}

export interface Badge {
  id: string;
  icon: string;
  title: string;
  description: string;
  earned: boolean;
}

export function badges(progress: Progress, enabled: ItemId[], today: Date): Badge[] {
  const streak = Math.max(currentStreak(progress, enabled, today), longestStreak(progress, enabled));
  const total = totalCompleted(progress);
  const fullDays = Object.keys(progress).filter((iso) => isDayComplete(progress, iso, enabled)).length;
  return [
    { id: 'first', icon: '🌱', title: 'First Step', description: 'Complete your first portion', earned: total >= 1 },
    { id: 'day', icon: '⭐', title: 'Full Day', description: 'Complete every portion in one day', earned: fullDays >= 1 },
    { id: 'chai', icon: '🎗️', title: 'Chai', description: 'Complete 18 portions', earned: total >= 18 },
    { id: 'week', icon: '🔥', title: 'Week Strong', description: '7-day streak', earned: streak >= 7 },
    { id: 'month', icon: '🌙', title: 'Full Month', description: '30-day streak', earned: streak >= 30 },
    { id: 'tehillim', icon: '🎶', title: 'Sefer Tehillim', description: 'Say Tehillim 30 times (a full cycle)', earned: countFor(progress, 'tehillim') >= 30 },
    { id: 'chumash', icon: '📜', title: 'Parsha Master', description: 'Learn Chumash 54 times', earned: countFor(progress, 'chumash') >= 54 },
    { id: 'year', icon: '👑', title: 'Year of Light', description: '365-day streak', earned: streak >= 365 },
  ];
}

/** Points: 10 per portion, bonus 20 for a complete day. */
export function points(progress: Progress, enabled: ItemId[]): number {
  const fullDays = Object.keys(progress).filter((iso) => isDayComplete(progress, iso, enabled)).length;
  return totalCompleted(progress) * 10 + fullDays * 20;
}

export function level(pts: number): { level: number; progress: number; next: number } {
  // Each level needs 100 more points than the last: 100, 200, 300…
  let lvl = 1;
  let need = 100;
  let remaining = pts;
  while (remaining >= need) {
    remaining -= need;
    lvl++;
    need += 100;
  }
  return { level: lvl, progress: remaining / need, next: need - remaining };
}
