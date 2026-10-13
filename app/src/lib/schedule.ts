import { HDate, HebrewCalendar, Sedra, DailyLearning, months, flags } from '@hebcal/core';
import '@hebcal/learning/psalms';
import '@hebcal/learning/rambam1';
import '@hebcal/learning/rambam3';
import '@hebcal/learning/seferHaMitzvot';
import { getLeyningForParsha } from '@hebcal/leyning';

export type ItemId =
  | 'chumash'
  | 'tehillim'
  | 'tanya'
  | 'rambam3'
  | 'rambam1'
  | 'mitzvah'
  | 'hayomyom'
  | 'zohar';

export const ALL_ITEMS: ItemId[] = [
  'chumash',
  'tehillim',
  'tanya',
  'rambam3',
  'rambam1',
  'mitzvah',
  'hayomyom',
  'zohar',
];

export const ITEM_META: Record<ItemId, { title: string; he: string; group: string; icon: string }> = {
  chumash: { title: 'Chumash', he: 'חומש עם רש״י', group: 'Chitas', icon: '📜' },
  tehillim: { title: 'Tehillim', he: 'תהלים', group: 'Chitas', icon: '🎶' },
  tanya: { title: 'Tanya', he: 'תניא', group: 'Chitas', icon: '🔥' },
  rambam3: { title: 'Rambam · 3 chapters', he: 'רמב״ם ג׳ פרקים', group: 'Rambam', icon: '⚖️' },
  rambam1: { title: 'Rambam · 1 chapter', he: 'רמב״ם פרק אחד', group: 'Rambam', icon: '📘' },
  mitzvah: { title: 'Sefer HaMitzvos', he: 'ספר המצוות', group: 'Rambam', icon: '✨' },
  hayomyom: { title: 'Hayom Yom', he: 'היום יום', group: 'More', icon: '🕯️' },
  zohar: { title: 'Daily Zohar', he: 'זוהר', group: 'More', icon: '💡' },
};

/** A passage that can be loaded and read inside the app (from Sefaria). */
export interface ReadingRef {
  /** Sefaria ref, e.g. "Genesis.1.1-2.3" */
  ref: string;
  label: string;
  /** Also load Rashi on this passage */
  rashi?: boolean;
}

export interface StudyItem {
  id: ItemId;
  /** Human-readable description of today's portion */
  portion: string;
  portionHe?: string;
  readings: ReadingRef[];
  /** Same day's portion on chabad.org */
  externalUrl: string;
  note?: string;
}

export interface DaySchedule {
  date: Date;
  hdate: HDate;
  hebrewDate: string;
  hebrewDateHe: string;
  parsha?: string;
  parshaHe?: string;
  holidays: string[];
  items: Record<ItemId, StudyItem>;
}

const BOOK_HE: Record<string, string> = {
  Genesis: 'בראשית',
  Exodus: 'שמות',
  Leviticus: 'ויקרא',
  Numbers: 'במדבר',
  Deuteronomy: 'דברים',
};

const ALIYAH_NAMES = ['Rishon', 'Sheni', 'Shlishi', 'Revi’i', 'Chamishi', 'Shishi', 'Shvi’i'];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function chabadDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function chabadUrl(page: string, d: Date, extra = ''): string {
  return `https://www.chabad.org/dailystudy/${page}.asp?tdate=${chabadDate(d)}${extra}`;
}

/** "Genesis", "1:1", "2:3" -> Sefaria ref "Genesis.1.1-2.3" */
function sefariaRange(book: string, b: string, e: string): string {
  const [bc, bv] = b.split(':');
  const [ec, ev] = e.split(':');
  const end = bc === ec ? ev : `${ec}.${ev}`;
  return `${book}.${bc}.${bv}-${end}`;
}

/** Extract a Sefaria ref from a sefaria.org URL produced by @hebcal/learning */
export function refFromSefariaUrl(url: string): string | null {
  const m = /^https:\/\/www\.sefaria\.org\/([^?]+)/.exec(url);
  return m ? decodeURIComponent(m[1]).replace(/_/g, ' ') : null;
}

interface ChumashPortion {
  parsha: string;
  /** 1-based aliyot to learn today */
  aliyot: number[];
  /** Additional portion of a second parsha (Simchat Torah) */
  extra?: { parsha: string; aliyot: number[] };
  note?: string;
}

function parshaKey(p: string[]): string {
  return p.join('-');
}

/**
 * Chabad Chumash schedule: each weekday learns the aliyah matching the day
 * (Sunday = 1st … Shabbat = 7th) of the parsha read on the coming Shabbat.
 * When that Shabbat is a Yom Tov, the next parsha to be read is learned.
 * Between Yom Kippur and Simchat Torah, V'zot HaBerachah is learned.
 */
export function chumashPortion(date: Date, il: boolean): ChumashPortion {
  const hd = new HDate(date);
  const dow = date.getDay(); // 0 = Sunday
  const aliyah = dow + 1;
  const simchatTorahDay = il ? 22 : 23;

  if (hd.getMonth() === months.TISHREI && hd.getDate() > 10) {
    const day = hd.getDate();
    const shabbat = new HDate(hd.onOrAfter(6));
    const sedra = new Sedra(shabbat.getFullYear(), il).lookup(shabbat);
    const learningHaazinu = !sedra.chag && sedra.parsha[0] === 'Haazinu';
    if (!learningHaazinu && day < simchatTorahDay) {
      return { parsha: 'Vezot Haberakhah', aliyot: [aliyah] };
    }
    if (day === simchatTorahDay) {
      const rest = [];
      for (let a = aliyah; a <= 7; a++) rest.push(a);
      return {
        parsha: 'Vezot Haberakhah',
        aliyot: rest,
        extra: { parsha: 'Bereshit', aliyot: [1] },
        note: 'Simchat Torah: complete V’zot HaBerachah and begin Bereishis.',
      };
    }
    if (day > simchatTorahDay && sedra.parsha[0] === 'Bereshit') {
      if (day === simchatTorahDay + 1 && aliyah > 2) {
        const catchUp = [];
        for (let a = 2; a <= aliyah; a++) catchUp.push(a);
        return {
          parsha: 'Bereshit',
          aliyot: catchUp,
          note: 'Catching up on Bereishis from the 2nd aliyah.',
        };
      }
      return { parsha: 'Bereshit', aliyot: [Math.max(aliyah, 2)] };
    }
  }

  // Find the parsha of the coming Shabbat (today, if today is Shabbat).
  let shabbat = new HDate(hd.onOrAfter(6));
  for (let i = 0; i < 4; i++) {
    const sedra = new Sedra(shabbat.getFullYear(), il).lookup(shabbat);
    if (!sedra.chag) {
      return {
        parsha: parshaKey(sedra.parsha),
        aliyot: [aliyah],
        note: i > 0 ? 'This Shabbat is Yom Tov, so the next parsha is learned.' : undefined,
      };
    }
    shabbat = shabbat.add(7, 'd');
  }
  throw new Error('Unable to determine parsha');
}

function chumashItem(date: Date, il: boolean): { item: StudyItem; parsha: string; parshaHe: string } {
  const portion = chumashPortion(date, il);
  const readings: ReadingRef[] = [];
  const parts: string[] = [];
  let parshaHe = '';

  const addPart = (parsha: string, aliyot: number[]) => {
    const leyning = getLeyningForParsha(parsha.split('-'));
    if (!parshaHe) parshaHe = leyning.name.he ?? '';
    const full = leyning.fullkriyah as Record<string, { k: string; b: string; e: string }>;
    const first = full[String(aliyot[0])];
    const last = full[String(aliyot[aliyot.length - 1])];
    const ref = sefariaRange(first.k, first.b, last.e);
    const names =
      aliyot.length === 1
        ? ALIYAH_NAMES[aliyot[0] - 1]
        : `${ALIYAH_NAMES[aliyot[0] - 1]}–${ALIYAH_NAMES[aliyot[aliyot.length - 1] - 1]}`;
    const label = `${parsha.replace('-', '–')} · ${names}`;
    parts.push(label);
    readings.push({ ref, label: `${label} (${first.k} ${first.b}–${last.e})`, rashi: true });
  };

  addPart(portion.parsha, portion.aliyot);
  if (portion.extra) addPart(portion.extra.parsha, portion.extra.aliyot);

  const firstReading = readings[0].ref;
  const book = firstReading.split('.')[0];
  return {
    parsha: portion.parsha,
    parshaHe,
    item: {
      id: 'chumash',
      portion: parts.join(' + '),
      portionHe: `${BOOK_HE[book] ?? ''} · ${parshaHe}`,
      readings,
      externalUrl: chabadUrl('torahreading', date),
      note: portion.note,
    },
  };
}

function learningUrlRefs(ev: { url(): string | undefined } | undefined | null): ReadingRef[] {
  const url = ev?.url();
  const ref = url ? refFromSefariaUrl(url) : null;
  return ref ? [{ ref, label: ref }] : [];
}

function tehillimItem(date: Date, hd: HDate): StudyItem {
  const ev = DailyLearning.lookup('psalms', hd, false);
  const reading = (ev as unknown as { reading: [number | string, number | string] }).reading;
  const range = reading[0] === reading[1] ? `${reading[0]}` : `${reading[0]}–${reading[1]}`;
  const isMevarchim = isShabbatMevarchim(hd);
  return {
    id: 'tehillim',
    portion: `Psalms ${range} · Day ${hd.getDate()} of the month`,
    portionHe: ev?.render('he'),
    readings: learningUrlRefs(ev).map((r) => ({ ...r, label: `Psalms ${range}` })),
    externalUrl: chabadUrl('tehillim', date),
    note: isMevarchim
      ? 'Shabbat Mevarchim: the custom is to recite the entire Tehillim before Shacharit.'
      : hd.getDate() === 29 && hd.daysInMonth() === 29
        ? 'This month has 29 days — today’s portion includes day 30.'
        : undefined,
  };
}

function rambamItem(date: Date, hd: HDate, kind: 'rambam1' | 'rambam3'): StudyItem {
  const ev = DailyLearning.lookup(kind, hd, false);
  const events: { url(): string | undefined; render(l: string): string }[] =
    kind === 'rambam3' && ev
      ? ((ev as unknown as { events: { url(): string; render(l: string): string }[] }).events ?? [ev])
      : ev
        ? [ev]
        : [];
  const readings = events.flatMap((e) =>
    learningUrlRefs(e).map((r) => ({ ...r, label: e.render('en') })),
  );
  return {
    id: kind,
    portion: events.map((e) => e.render('en')).join(' · ') || '—',
    portionHe: events.map((e) => e.render('he')).join(' · '),
    readings,
    externalUrl: chabadUrl('rambam', date, kind === 'rambam3' ? '&rambamChapters=3' : '&rambamChapters=1'),
  };
}

function mitzvahItem(date: Date, hd: HDate): StudyItem {
  const ev = DailyLearning.lookup('seferHaMitzvot', hd, false);
  const reading = (ev as unknown as { reading?: { day: number; reading: string } } | null)?.reading;
  const readings: ReadingRef[] = [];
  if (reading) {
    for (const part of reading.reading.split(/,\s*/)) {
      const m = /^([PN])(\d+)$/.exec(part);
      if (m) {
        const kind = m[1] === 'P' ? 'Positive' : 'Negative';
        readings.push({
          ref: `Sefer HaMitzvot, ${kind} Commandments ${m[2]}`,
          label: `${kind} Commandment ${m[2]}`,
        });
      }
    }
  }
  return {
    id: 'mitzvah',
    portion: ev ? ev.render('en') : '—',
    readings,
    externalUrl: ev?.url() ?? chabadUrl('seferHamitzvos', date),
  };
}

/** The Shabbat before Rosh Chodesh (excluding Rosh Chodesh Tishrei). */
export function isShabbatMevarchim(hd: HDate): boolean {
  if (hd.getDay() !== 6 || hd.getDate() < 23 || hd.getDate() > 29) return false;
  for (let k = 1; k <= 7; k++) {
    const d = hd.add(k, 'd');
    if (d.getDate() === 1) return d.getMonth() !== months.TISHREI;
  }
  return false;
}

export function getDaySchedule(date: Date, il: boolean): DaySchedule {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hd = new HDate(day);
  const chumash = chumashItem(day, il);
  const holidays = HebrewCalendar.getHolidaysOnDate(hd, il) ?? [];

  const items: Record<ItemId, StudyItem> = {
    chumash: chumash.item,
    tehillim: tehillimItem(day, hd),
    tanya: {
      id: 'tanya',
      portion: `Today’s Tanya portion · ${hd.render('en', false)}`,
      readings: [],
      externalUrl: chabadUrl('tanya', day),
      note: 'Opens today’s portion on Chabad.org.',
    },
    rambam3: rambamItem(day, hd, 'rambam3'),
    rambam1: rambamItem(day, hd, 'rambam1'),
    mitzvah: mitzvahItem(day, hd),
    hayomyom: {
      id: 'hayomyom',
      portion: `Hayom Yom · ${hd.render('en', false)}`,
      readings: [],
      externalUrl: chabadUrl('hayomyom', day),
    },
    zohar: {
      id: 'zohar',
      portion: 'Daily Zohar selection',
      readings: [],
      externalUrl: 'https://www.chabad.org/kabbalah/article_cdo/aid/1272146/jewish/Daily-Zohar-Study.htm',
    },
  };

  return {
    date: day,
    hdate: hd,
    hebrewDate: hd.render('en'),
    hebrewDateHe: hd.renderGematriya(),
    parsha: chumash.parsha.replace('-', '–'),
    parshaHe: chumash.parshaHe,
    holidays: holidays
      .filter((ev) => !(ev.getFlags() & flags.PARSHA_HASHAVUA))
      .map((ev) => ev.render('en')),
    items,
  };
}
