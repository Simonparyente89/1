import { useSyncExternalStore } from 'react';
import type { ItemId } from './schedule';

export type TextLang = 'he' | 'en' | 'bi';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  enabled: ItemId[];
  israel: boolean;
  lang: TextLang;
  showRashi: boolean;
  fontScale: number;
  theme: Theme;
  name: string;
  onboarded: boolean;
}

/** progress[isoDate] = item ids completed on that day */
export type Progress = Record<string, ItemId[]>;

export interface State {
  settings: Settings;
  progress: Progress;
}

const KEY = 'chitas-tracker-v1';

export const DEFAULT_SETTINGS: Settings = {
  enabled: ['chumash', 'tehillim', 'tanya', 'rambam3', 'hayomyom'],
  israel: false,
  lang: 'bi',
  showRashi: true,
  fontScale: 1,
  theme: 'system',
  name: '',
  onboarded: false,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
        progress: parsed.progress ?? {},
      };
    }
  } catch {
    // storage unavailable or corrupt: start fresh
  }
  return { settings: DEFAULT_SETTINGS, progress: {} };
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
  listeners.forEach((l) => l());
}

export function getState(): State {
  return state;
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function updateSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function setDone(iso: string, id: ItemId, done: boolean) {
  const current = new Set(state.progress[iso] ?? []);
  if (done) current.add(id);
  else current.delete(id);
  const progress = { ...state.progress };
  if (current.size) progress[iso] = Array.from(current);
  else delete progress[iso];
  commit({ ...state, progress });
}

export function exportData(): string {
  return JSON.stringify(state, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json) as Partial<State>;
  if (!parsed || typeof parsed !== 'object' || typeof parsed.progress !== 'object') {
    throw new Error('This file does not look like a Chitas Tracker backup.');
  }
  commit({
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    progress: parsed.progress ?? {},
  });
}

export function resetAll() {
  commit({ settings: DEFAULT_SETTINGS, progress: {} });
}
