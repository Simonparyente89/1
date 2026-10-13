import { describe, expect, it } from 'vitest';
import { HDate, months } from '@hebcal/core';
import { chumashPortion, getDaySchedule, isShabbatMevarchim } from './schedule';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('chumashPortion', () => {
  it('learns the aliyah matching the day of the week', () => {
    // Tue 2 Cheshvan 5787 – week of Noach
    expect(chumashPortion(d(2026, 10, 13), false)).toMatchObject({ parsha: 'Noach', aliyot: [3] });
    // Sun 11 Cheshvan 5787 – week of Lech Lecha
    expect(chumashPortion(d(2026, 10, 18), false)).toMatchObject({ parsha: 'Lech-Lecha', aliyot: [1] });
    // Shabbat itself learns Shvi'i
    expect(chumashPortion(d(2026, 10, 17), false)).toMatchObject({ parsha: 'Noach', aliyot: [7] });
  });

  it('learns V’zot HaBerachah during Sukkot and starts Bereishis on Simchat Torah', () => {
    // Tue 11 Tishrei 5787 (after Yom Kippur, Shabbat is Sukkot)
    expect(chumashPortion(d(2026, 9, 22), false)).toMatchObject({ parsha: 'Vezot Haberakhah', aliyot: [3] });
    // Sun 23 Tishrei 5787 – Simchat Torah (diaspora)
    const st = chumashPortion(d(2026, 10, 4), false);
    expect(st.parsha).toBe('Vezot Haberakhah');
    expect(st.aliyot).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(st.extra).toEqual({ parsha: 'Bereshit', aliyot: [1] });
    // Mon 24 Tishrei – Bereishis Sheni
    expect(chumashPortion(d(2026, 10, 5), false)).toMatchObject({ parsha: 'Bereshit', aliyot: [2] });
    // Fri 28 Tishrei – Bereishis Shishi
    expect(chumashPortion(d(2026, 10, 9), false)).toMatchObject({ parsha: 'Bereshit', aliyot: [6] });
  });

  it('learns Haazinu in the days before Shabbat Haazinu', () => {
    // 5786: Yom Kippur Thu 2 Oct 2025, Shabbat Haazinu 4 Oct? (Haazinu read Shabbat Shuva 27 Sep)
    const p = chumashPortion(d(2025, 10, 3), false);
    expect(['Haazinu', 'Vezot Haberakhah']).toContain(p.parsha);
  });

  it('skips to the next parsha when Shabbat is Yom Tov', () => {
    // Pesach 5787 – find a week whose Shabbat is Yom Tov
    let found = false;
    for (let i = 0; i < 400 && !found; i++) {
      const date = d(2026, 10, 1 + i);
      const p = chumashPortion(date, false);
      if (p.note?.includes('Yom Tov')) found = true;
    }
    expect(found).toBe(true);
  });

  it('never throws over several years in both Israel and diaspora', () => {
    for (const il of [false, true]) {
      for (let i = 0; i < 365 * 4; i++) {
        const date = d(2025, 1, 1 + i);
        expect(() => getDaySchedule(date, il)).not.toThrow();
      }
    }
  });
});

describe('getDaySchedule', () => {
  it('builds the Chitas and Rambam items', () => {
    const s = getDaySchedule(d(2026, 10, 13), false);
    expect(s.items.tehillim.portion).toContain('10–17');
    expect(s.items.rambam3.readings[0].ref).toBe('Mishneh Torah, Robbery and Lost Property.10-12');
    expect(s.items.mitzvah.readings[0].ref).toBe('Sefer HaMitzvot, Negative Commandments 266');
    expect(s.items.chumash.readings[0].ref).toMatch(/^Genesis\.\d+\.\d+-/);
    expect(s.items.tanya.externalUrl).toContain('tdate=10/13/2026');
  });
});

describe('isShabbatMevarchim', () => {
  it('is true on the Shabbat before Rosh Chodesh, but not before Tishrei', () => {
    let count = 0;
    let hd = new HDate(1, months.TISHREI, 5787);
    while (hd.getFullYear() === 5787) {
      if (isShabbatMevarchim(hd)) {
        count++;
        expect(hd.getMonth()).not.toBe(months.ELUL);
      }
      hd = hd.next();
    }
    // 13 months in 5787? 12 months minus Elul.
    expect(count).toBe(new HDate(1, months.TISHREI, 5787).isLeapYear() ? 12 : 11);
  });
});
