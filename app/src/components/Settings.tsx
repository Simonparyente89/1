import { useRef } from 'react';
import { ALL_ITEMS, ITEM_META, type ItemId } from '../lib/schedule';
import { exportData, importData, resetAll, updateSettings, useStore, type Theme } from '../lib/store';

export function TrackPicker() {
  const { settings } = useStore();
  const toggle = (id: ItemId) => {
    const set = new Set(settings.enabled);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    updateSettings({ enabled: ALL_ITEMS.filter((x) => set.has(x)) });
  };
  return (
    <div className="track-list">
      {ALL_ITEMS.map((id) => (
        <label key={id} className="toggle-row">
          <span>
            {ITEM_META[id].icon} {ITEM_META[id].title}{' '}
            <span className="muted" lang="he">
              {ITEM_META[id].he}
            </span>
          </span>
          <input type="checkbox" checked={settings.enabled.includes(id)} onChange={() => toggle(id)} />
        </label>
      ))}
    </div>
  );
}

export function Settings() {
  const { settings } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chitas-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File) => {
    try {
      importData(await file.text());
      alert('Backup restored.');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="settings">
      <section className="panel">
        <h2 className="group-title">Your name</h2>
        <input
          className="input"
          placeholder="Optional"
          value={settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
        />
      </section>

      <section className="panel">
        <h2 className="group-title">What I learn every day</h2>
        <TrackPicker />
      </section>

      <section className="panel">
        <h2 className="group-title">Calendar & text</h2>
        <label className="toggle-row">
          <span>I live in Eretz Yisrael (Israel parsha schedule)</span>
          <input type="checkbox" checked={settings.israel} onChange={(e) => updateSettings({ israel: e.target.checked })} />
        </label>
        <label className="toggle-row">
          <span>Show Rashi with Chumash</span>
          <input type="checkbox" checked={settings.showRashi} onChange={(e) => updateSettings({ showRashi: e.target.checked })} />
        </label>
        <label className="toggle-row">
          <span>Text language</span>
          <select className="input" value={settings.lang} onChange={(e) => updateSettings({ lang: e.target.value as typeof settings.lang })}>
            <option value="bi">Hebrew + English</option>
            <option value="he">Hebrew only</option>
            <option value="en">English only</option>
          </select>
        </label>
        <label className="toggle-row">
          <span>Text size</span>
          <input
            type="range"
            min={0.8}
            max={1.8}
            step={0.1}
            value={settings.fontScale}
            onChange={(e) => updateSettings({ fontScale: Number(e.target.value) })}
          />
        </label>
        <label className="toggle-row">
          <span>Theme</span>
          <select className="input" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as Theme })}>
            <option value="system">Match device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <h2 className="group-title">Your data</h2>
        <p className="muted small">Progress is saved privately on this device. Back it up to move it to another phone.</p>
        <div className="row-btns">
          <button className="btn btn-ghost" onClick={download}>
            Export backup
          </button>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <button
            className="btn btn-danger"
            onClick={() => confirm('Erase all progress and settings on this device?') && resetAll()}
          >
            Reset
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </section>

      <section className="panel about">
        <h2 className="group-title">About</h2>
        <p className="small">
          Daily portions follow the Chitas and Rambam cycles instituted by the Rebbe. The schedule is calculated on your
          device with the <a href="https://www.hebcal.com" target="_blank" rel="noreferrer">Hebcal</a> calendar; texts
          come from <a href="https://www.sefaria.org" target="_blank" rel="noreferrer">Sefaria</a>. Tanya, Hayom Yom
          and Zohar open the day’s portion on{' '}
          <a href="https://www.chabad.org/dailystudy" target="_blank" rel="noreferrer">Chabad.org</a>.
        </p>
        <p className="small muted">
          The day’s portions follow the civil date. After sunset the Hebrew date has already changed — use the arrows to
          view tomorrow. When in doubt, check with your Rav or a Chabad luach.
        </p>
      </section>
    </div>
  );
}
