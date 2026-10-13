import { ITEM_META, toISODate, type DaySchedule, type ItemId, type StudyItem } from '../lib/schedule';
import { setDone, useStore } from '../lib/store';
import { currentStreak } from '../lib/stats';
import { ProgressRing } from './ProgressRing';

interface Props {
  schedule: DaySchedule;
  isToday: boolean;
  onRead: (item: StudyItem) => void;
}

export function Today({ schedule, isToday, onRead }: Props) {
  const { settings, progress } = useStore();
  const iso = toISODate(schedule.date);
  const done = new Set(progress[iso] ?? []);
  const enabled = settings.enabled;
  const completed = enabled.filter((id) => done.has(id)).length;
  const ratio = enabled.length ? completed / enabled.length : 0;
  const streak = currentStreak(progress, enabled, new Date());

  const groups = ['Chitas', 'Rambam', 'More'];

  return (
    <div className="today">
      <section className="hero">
        <div className="hero-text">
          <div className="hero-he" lang="he" dir="rtl">
            {schedule.hebrewDateHe}
          </div>
          <div className="hero-en">{schedule.hebrewDate}</div>
          <div className="hero-sub">
            {schedule.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="chips">
            {schedule.parsha && (
              <span className="chip">
                Parshas {schedule.parsha}
                {schedule.parshaHe && (
                  <>
                    {' · '}
                    <bdi lang="he">{schedule.parshaHe}</bdi>
                  </>
                )}
              </span>
            )}
            {schedule.holidays.map((h) => (
              <span key={h} className="chip chip-gold">
                {h}
              </span>
            ))}
          </div>
        </div>
        <ProgressRing value={ratio} size={104}>
          <strong>
            {completed}/{enabled.length}
          </strong>
          <small>{ratio === 1 ? 'Done!' : 'today'}</small>
        </ProgressRing>
      </section>

      <div className="streak-bar">
        <span>🔥 {streak}-day streak</span>
        <span className="muted">
          {ratio === 1
            ? 'Yasher koach! Everything is done for this day.'
            : isToday
              ? `${enabled.length - completed} portion${enabled.length - completed === 1 ? '' : 's'} left today`
              : 'Catching up on a past day'}
        </span>
      </div>

      {groups.map((group) => {
        const ids = enabled.filter((id) => ITEM_META[id].group === group);
        if (!ids.length) return null;
        return (
          <section key={group} className="group">
            <h2 className="group-title">{group}</h2>
            {ids.map((id) => (
              <StudyCard
                key={id}
                id={id}
                item={schedule.items[id]}
                done={done.has(id)}
                onToggle={(v) => setDone(iso, id, v)}
                onRead={() => onRead(schedule.items[id])}
              />
            ))}
          </section>
        );
      })}

      {enabled.length === 0 && (
        <p className="empty">Choose what you learn in Settings to build your daily plan.</p>
      )}
    </div>
  );
}

interface CardProps {
  id: ItemId;
  item: StudyItem;
  done: boolean;
  onToggle: (done: boolean) => void;
  onRead: () => void;
}

function StudyCard({ id, item, done, onToggle, onRead }: CardProps) {
  const meta = ITEM_META[id];
  const canRead = item.readings.length > 0;
  return (
    <article className={`card ${done ? 'card-done' : ''}`}>
      <button
        className={`check ${done ? 'checked' : ''}`}
        aria-pressed={done}
        aria-label={done ? `Mark ${meta.title} as not done` : `Mark ${meta.title} as done`}
        onClick={() => onToggle(!done)}
      >
        {done ? '✓' : ''}
      </button>
      <div className="card-body" onClick={canRead ? onRead : undefined} role={canRead ? 'button' : undefined}>
        <div className="card-head">
          <span className="card-icon" aria-hidden="true">
            {meta.icon}
          </span>
          <span className="card-title">{meta.title}</span>
          <span className="card-he" lang="he" dir="rtl">
            {meta.he}
          </span>
        </div>
        <div className="card-portion">{item.portion}</div>
        {item.portionHe && item.portionHe !== item.portion && (
          <div className="card-portion-he" lang="he" dir="rtl">
            {item.portionHe}
          </div>
        )}
        {item.note && <div className="card-note">{item.note}</div>}
      </div>
      <div className="card-actions">
        {canRead && (
          <button className="btn btn-primary" onClick={onRead}>
            Learn
          </button>
        )}
        <a className="btn btn-ghost" href={item.externalUrl} target="_blank" rel="noreferrer">
          {canRead ? 'Chabad.org' : 'Open'} ↗
        </a>
      </div>
    </article>
  );
}
