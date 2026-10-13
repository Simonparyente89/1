import { useState } from 'react';
import { HDate } from '@hebcal/core';
import { addDays, toISODate } from '../lib/schedule';
import { useStore } from '../lib/store';

interface Props {
  selected: Date;
  onPick: (d: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Shab'];

export function CalendarView({ selected, onPick }: Props) {
  const { progress, settings } = useStore();
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const todayIso = toISODate(new Date());
  const selectedIso = toISODate(selected);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const total = settings.enabled.length;

  const hFirst = new HDate(first);
  const hLast = new HDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const hebrewSpan =
    hFirst.getMonthName() === hLast.getMonthName()
      ? `${hFirst.getMonthName()} ${hFirst.getFullYear()}`
      : `${hFirst.getMonthName()} – ${hLast.getMonthName()} ${hLast.getFullYear()}`;

  return (
    <div className="calendar">
      <div className="cal-head">
        <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          ‹
        </button>
        <div className="cal-title">
          <strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
          <small>{hebrewSpan}</small>
        </div>
        <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          ›
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-wd">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const iso = toISODate(d);
          const done = (progress[iso] ?? []).filter((id) => settings.enabled.includes(id)).length;
          const ratio = total ? done / total : 0;
          const hd = new HDate(d);
          const classes = [
            'cal-day',
            d.getMonth() !== month.getMonth() ? 'other' : '',
            iso === todayIso ? 'today' : '',
            iso === selectedIso ? 'selected' : '',
            ratio === 1 ? 'full' : ratio > 0 ? 'partial' : '',
          ].join(' ');
          return (
            <button
              key={iso}
              className={classes}
              style={{ ['--fill' as string]: ratio }}
              onClick={() => onPick(d)}
              aria-label={`${d.toDateString()}: ${done} of ${total} done`}
            >
              <span className="g">{d.getDate()}</span>
              <span className="h" lang="he">
                {hd.renderGematriya(true).split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span>
          <i className="dot full" /> Complete
        </span>
        <span>
          <i className="dot partial" /> Partial
        </span>
        <span>
          <i className="dot" /> Not started
        </span>
      </div>
      <p className="muted small center">Tap any day to see its portions — catch up on days you missed.</p>
    </div>
  );
}
