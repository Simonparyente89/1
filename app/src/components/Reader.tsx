import { useEffect, useState } from 'react';
import { ITEM_META, type StudyItem } from '../lib/schedule';
import { loadPassage, type Passage } from '../lib/sefaria';
import { updateSettings, useStore, type TextLang } from '../lib/store';

interface Props {
  item: StudyItem;
  done: boolean;
  onDone: () => void;
  onClose: () => void;
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; passages: Passage[] };

const HEBREW_NUM = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const HEBREW_TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HEBREW_HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

function gematriya(n: number): string {
  if (n === 15) return 'טו';
  if (n === 16) return 'טז';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (rest === 15 || rest === 16) return HEBREW_HUNDREDS[h] + (rest === 15 ? 'טו' : 'טז');
  return HEBREW_HUNDREDS[h] + HEBREW_TENS[Math.floor(rest / 10)] + HEBREW_NUM[rest % 10];
}

export function Reader({ item, done, onDone, onClose }: Props) {
  const { settings } = useStore();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const meta = ITEM_META[item.id];

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    Promise.all(item.readings.map((r) => loadPassage(r.ref, !!r.rashi)))
      .then((passages) => !cancelled && setState({ status: 'ok', passages }))
      .catch((e: Error) => !cancelled && setState({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [item, attempt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const lang = settings.lang;
  const showHe = lang !== 'en';
  const showEn = lang !== 'he';
  const isChumash = item.id === 'chumash';

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label={meta.title}>
      <header className="reader-bar">
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="reader-title">
          <strong>
            {meta.icon} {meta.title}
          </strong>
          <small>{item.portion}</small>
        </div>
        <div className="reader-tools">
          <div className="seg" role="group" aria-label="Text language">
            {(['he', 'bi', 'en'] as TextLang[]).map((l) => (
              <button key={l} className={lang === l ? 'on' : ''} onClick={() => updateSettings({ lang: l })}>
                {l === 'he' ? 'עב' : l === 'en' ? 'EN' : 'Both'}
              </button>
            ))}
          </div>
          <button
            className="icon-btn"
            aria-label="Smaller text"
            onClick={() => updateSettings({ fontScale: Math.max(0.8, +(settings.fontScale - 0.1).toFixed(1)) })}
          >
            A−
          </button>
          <button
            className="icon-btn"
            aria-label="Larger text"
            onClick={() => updateSettings({ fontScale: Math.min(1.8, +(settings.fontScale + 0.1).toFixed(1)) })}
          >
            A+
          </button>
          {isChumash && (
            <button
              className={`icon-btn ${settings.showRashi ? 'on' : ''}`}
              aria-pressed={settings.showRashi}
              onClick={() => updateSettings({ showRashi: !settings.showRashi })}
            >
              Rashi
            </button>
          )}
        </div>
      </header>

      <main className="reader-body" style={{ fontSize: `${settings.fontScale}rem` }}>
        {item.note && <p className="card-note">{item.note}</p>}
        {state.status === 'loading' && (
          <div className="loading">
            <div className="spinner" /> Loading text…
          </div>
        )}
        {state.status === 'error' && (
          <div className="error">
            <p>Couldn’t load the text ({state.message}). Check your connection — texts you’ve opened before work offline.</p>
            <button className="btn btn-primary" onClick={() => setAttempt((a) => a + 1)}>
              Try again
            </button>{' '}
            <a className="btn btn-ghost" href={item.externalUrl} target="_blank" rel="noreferrer">
              Open on Chabad.org ↗
            </a>
          </div>
        )}
        {state.status === 'ok' &&
          state.passages.map((p, pi) => (
            <section key={p.ref} className="passage">
              <h3 className="passage-title">
                <span>{item.readings[pi]?.label ?? p.ref}</span>
                {p.heRef && (
                  <span lang="he" dir="rtl">
                    {p.heRef}
                  </span>
                )}
              </h3>
              {p.segments.map((s) => {
                const num = s.address[s.address.length - 1];
                const isNewChapter = s.address.length > 1 && num === 1;
                return (
                  <div key={s.address.join(':')}>
                    {isNewChapter && <div className="chapter-mark">Chapter {s.address[s.address.length - 2]}</div>}
                    <div className={`segment ${lang === 'bi' ? 'bi' : ''}`}>
                      {showHe && s.he && (
                        <p className="he" lang="he" dir="rtl">
                          <span className="num">{gematriya(num)}</span>
                          <span dangerouslySetInnerHTML={{ __html: s.he }} />
                        </p>
                      )}
                      {showEn && s.en && (
                        <p className="en">
                          <span className="num">{s.address.slice(-2).join(':')}</span>
                          <span dangerouslySetInnerHTML={{ __html: s.en }} />
                        </p>
                      )}
                    </div>
                    {isChumash && settings.showRashi && s.rashi && s.rashi.length > 0 && (
                      <details className="rashi">
                        <summary>
                          Rashi <span lang="he">רש״י</span> · {s.rashi.length}
                        </summary>
                        {s.rashi.map((r, i) => (
                          <div key={i} className={`segment ${lang === 'bi' ? 'bi' : ''}`}>
                            {showHe && r.he && (
                              <p className="he rashi-font" lang="he" dir="rtl" dangerouslySetInnerHTML={{ __html: r.he }} />
                            )}
                            {showEn && r.en && <p className="en" dangerouslySetInnerHTML={{ __html: r.en }} />}
                          </div>
                        ))}
                      </details>
                    )}
                  </div>
                );
              })}
            </section>
          ))}

        {state.status === 'ok' && (
          <div className="reader-end">
            <button className={`btn btn-big ${done ? 'btn-ghost' : 'btn-primary'}`} onClick={onDone}>
              {done ? '✓ Completed' : `Mark ${meta.title} complete`}
            </button>
            <p className="muted small">
              Texts from <a href="https://www.sefaria.org" target="_blank" rel="noreferrer">Sefaria</a>.{' '}
              <a href={item.externalUrl} target="_blank" rel="noreferrer">
                Also on Chabad.org ↗
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
