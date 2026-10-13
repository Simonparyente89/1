import { ITEM_META } from '../lib/schedule';
import { useStore } from '../lib/store';
import { badges, countFor, currentStreak, level, longestStreak, points } from '../lib/stats';
import { ProgressRing } from './ProgressRing';

export function Stats() {
  const { progress, settings } = useStore();
  const today = new Date();
  const enabled = settings.enabled;
  const pts = points(progress, enabled);
  const lvl = level(pts);
  const list = badges(progress, enabled, today);

  return (
    <div className="stats">
      <section className="hero">
        <div className="hero-text">
          <div className="hero-en">{settings.name ? `${settings.name}’s journey` : 'Your journey'}</div>
          <div className="hero-sub">
            Level {lvl.level} · {pts.toLocaleString()} points
          </div>
          <div className="muted small">{lvl.next} points to level {lvl.level + 1}</div>
        </div>
        <ProgressRing value={lvl.progress} size={96}>
          <strong>L{lvl.level}</strong>
        </ProgressRing>
      </section>

      <div className="tiles">
        <div className="tile">
          <span className="tile-num">🔥 {currentStreak(progress, enabled, today)}</span>
          <span className="tile-label">Current streak</span>
        </div>
        <div className="tile">
          <span className="tile-num">🏆 {longestStreak(progress, enabled)}</span>
          <span className="tile-label">Longest streak</span>
        </div>
      </div>

      <h2 className="group-title">Portions learned</h2>
      <div className="counts">
        {enabled.map((id) => (
          <div key={id} className="count-row">
            <span>
              {ITEM_META[id].icon} {ITEM_META[id].title}
            </span>
            <strong>{countFor(progress, id)}</strong>
          </div>
        ))}
      </div>

      <h2 className="group-title">Achievements</h2>
      <div className="badges">
        {list.map((b) => (
          <div key={b.id} className={`badge ${b.earned ? 'earned' : ''}`} title={b.description}>
            <span className="badge-icon">{b.icon}</span>
            <strong>{b.title}</strong>
            <small>{b.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
