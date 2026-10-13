import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDays, getDaySchedule, toISODate, type StudyItem } from './lib/schedule';
import { setDone, updateSettings, useStore } from './lib/store';
import { isDayComplete } from './lib/stats';
import { Today } from './components/Today';
import { Reader } from './components/Reader';
import { CalendarView } from './components/CalendarView';
import { Stats } from './components/Stats';
import { Settings, TrackPicker } from './components/Settings';

type Tab = 'today' | 'calendar' | 'stats' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '📖' },
  { id: 'calendar', label: 'Calendar', icon: '🗓️' },
  { id: 'stats', label: 'Progress', icon: '🏆' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function App() {
  const { settings, progress } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(startOfToday);
  const [reading, setReading] = useState<StudyItem | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const schedule = useMemo(() => getDaySchedule(date, settings.israel), [date, settings.israel]);
  const iso = toISODate(date);
  const isToday = iso === toISODate(new Date());

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Celebrate when a day becomes fully complete
  const complete = isDayComplete(progress, iso, settings.enabled);
  const prevComplete = useRef(complete);
  const prevIso = useRef(iso);
  useEffect(() => {
    if (prevIso.current === iso && complete && !prevComplete.current) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 2600);
      return () => clearTimeout(t);
    }
  }, [complete, iso]);
  useEffect(() => {
    prevComplete.current = complete;
    prevIso.current = iso;
  });

  const closeReader = useCallback(() => setReading(null), []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            ח
          </span>
          <div>
            <strong>Chitas & Rambam</strong>
            <small>{settings.name ? `Good to see you, ${settings.name}` : 'Learn together, every day'}</small>
          </div>
        </div>
        {tab === 'today' && (
          <div className="datenav">
            <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
              ‹
            </button>
            <button className={`today-btn ${isToday ? 'on' : ''}`} onClick={() => setDate(startOfToday())}>
              Today
            </button>
            <button className="icon-btn" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
              ›
            </button>
          </div>
        )}
      </header>

      <main className="content">
        {tab === 'today' && <Today schedule={schedule} isToday={isToday} onRead={setReading} />}
        {tab === 'calendar' && (
          <CalendarView
            selected={date}
            onPick={(d) => {
              setDate(d);
              setTab('today');
            }}
          />
        )}
        {tab === 'stats' && <Stats />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {reading && (
        <Reader
          item={reading}
          done={(progress[iso] ?? []).includes(reading.id)}
          onDone={() => {
            const done = (progress[iso] ?? []).includes(reading.id);
            setDone(iso, reading.id, !done);
            if (!done) setReading(null);
          }}
          onClose={closeReader}
        />
      )}

      {celebrate && <Celebration />}

      {!settings.onboarded && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="logo big" aria-hidden="true">
              ח
            </div>
            <h1>Welcome!</h1>
            <p>
              Join Jews around the world in the Rebbe’s daily learning: <strong>Chitas</strong> (Chumash, Tehillim, Tanya)
              and <strong>Rambam</strong>. Pick what you learn — you can change it anytime.
            </p>
            <TrackPicker />
            <label className="toggle-row">
              <span>I live in Eretz Yisrael</span>
              <input type="checkbox" checked={settings.israel} onChange={(e) => updateSettings({ israel: e.target.checked })} />
            </label>
            <button className="btn btn-primary btn-big" onClick={() => updateSettings({ onboarded: true })}>
              Let’s learn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Celebration() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        icon: ['✨', '⭐', '🎉', '📜', '🕯️'][i % 5],
      })),
    [],
  );
  return (
    <div className="celebrate" aria-live="polite">
      {pieces.map((p, i) => (
        <span key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s` }}>
          {p.icon}
        </span>
      ))}
      <div className="celebrate-msg">Yasher Koach! Day complete 🎉</div>
    </div>
  );
}
