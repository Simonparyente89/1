# Chitas & Rambam — Daily Learning

A modern, installable web app (PWA) for the daily learning instituted by the Lubavitcher Rebbe:

- **Chitas**: Chumash with Rashi, Tehillim (monthly cycle) and Tanya
- **Rambam**: 3 chapters a day, 1 chapter a day, and Sefer HaMitzvos
- **More**: Hayom Yom and the daily Zohar

## Features

- **Today’s plan, calculated on your device.** Hebrew date, parsha, holidays and each portion are computed offline with the [Hebcal](https://www.hebcal.com) libraries, including Diaspora and Eretz Yisrael schedules.
- **Built-in reader.** Chumash with Rashi (tap a verse to expand Rashi), Tehillim, Rambam and Sefer HaMitzvos load from [Sefaria](https://www.sefaria.org) in Hebrew, English or side by side, with adjustable text size. Texts you've opened stay available offline.
- **Tracking and motivation.** Check off each portion, keep a daily streak, earn points, levels and achievements, and get a celebration when the day is complete.
- **Catch up.** A calendar shows Gregorian and Hebrew dates, colored by how much you finished. Tap any day to see and learn its portions.
- **Yours, private.** Progress is stored on the device. Export and import a backup to move it to another phone.
- **Modern UI.** Mobile-first, light and dark themes, installable to the home screen.

### How the Chumash portion is chosen

Each day learns the aliyah that matches the day of the week (Sunday = Rishon … Shabbos = Shvi'i) from the parsha read on the coming Shabbos. Three cases are handled specially:

- When that Shabbos is Yom Tov, the next parsha to be read is learned instead.
- Between Yom Kippur and Simchas Torah, V'zos HaBerachah is learned.
- On Simchas Torah V'zos HaBerachah is completed and Bereishis begun. The day after, you catch up on Bereishis from Sheni.

## Development

```bash
cd app
npm install
npm run dev      # start the dev server
npm test         # run the schedule and text-parsing unit tests
npm run build    # production build in app/dist
```

Pushing to `main` deploys the app to GitHub Pages through `.github/workflows/deploy.yml`. To turn this on, set **Settings → Pages → Source** to *GitHub Actions*.

## Roadmap ideas

- Tanya in-app: add the yearly Tanya division (keyed by Hebrew date) so Tanya opens in the built-in reader. Today it opens Chabad.org.
- Hayom Yom and the daily Zohar text in-app
- Daily reminder notifications
- Audio shiurim for each portion
- Learning groups and shared progress with friends or a shliach's community
- Full Hebrew, Russian, French and Spanish interface translations
- Accounts and cloud sync across devices

---
Texts © their respective publishers via Sefaria. The day's portions follow the civil date; after sunset the Hebrew date has already advanced. When in doubt, consult a Chabad luach or your Rav.
