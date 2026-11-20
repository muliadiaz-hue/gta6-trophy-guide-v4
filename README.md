[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/muliadiaz-hue/gta6-trophy-guide-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/muliadiaz-hue/gta6-trophy-guide-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Leonida Platinum — GTA 6 Trophy Guide & Tracker

An offline trophy guide and tracker for **Grand Theft Auto VI** (PlayStation 5), built for the [make.fun bounty “Build the best GTA 6 trophy guide”](https://make.fun/bounty/gta6-trophy-guide-01).

All 55 official trophies — names, descriptions and grades exactly as PlayStation publishes them — with a tracker that saves in your browser, a roadmap to the platinum, the one missable flagged honestly, and a cited guide for every trophy.

## What it does

- **Checklist** — all 55 trophies with official name, description and grade; tick them earned, track PSN progress counters with steppers (e.g. 0/250 stunts), filter by kind, grade and status, and search by name or description.
- **Spoiler mode (on by default)** — story trophies stay hidden until earned, so a new player can track without being spoiled.
- **Guide pane** — every trophy opens its own guide, written in our own words from the cited sources, with a named **Sources** line per trophy (Exophase, PSNProfiles, Output Lag, Press-Start, HowToVideoGame, CryptoGames).
- **Roadmap** — 8 stages from “Before you start” to the finale, with per-stage earned counts and a **Next up** planner that points at the next unearned trophy in roadmap order.
- **Missables** — the one confirmed risk (Positive Mental Attitude, Chapter 1) and the one time-sensitive item (Race Against Yago, Chapter 3), plus the honest statement that everything else stays available after the credits.
- **Progress & Save** — counts by grade and kind, PSN progress totals, export/import of your progress as JSON, and reset. Progress lives in localStorage; nothing leaves your browser.
- **Fully offline** — static files only, no network at runtime, no Rockstar logo or official artwork.

## Honest limits

Five trophies had **no confirmed unlock method at launch** (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). Their guides say so plainly instead of inventing a method. Press estimates put a full platinum run at roughly 200 hours.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Or open `app/index.html` directly — but `fetch` of the data file needs a server, so `serve.ts` is the way to run it.

## Hand in (the make.fun entry program)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Sources

- Exophase — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi
- Output Lag — https://outputlag.com/guides/gta-6-trophy-list/
- Press-Start — https://press-start.com.au/news/2026/11/18/gta-6-trophy-list/
- HowToVideoGame — https://howtovideogame.com/gta-6-trophies/
- CryptoGames — https://cryptogames.gg/gta-6-trophies-achievements-full-list/

## License

MIT — see [LICENSE](LICENSE). Unofficial fan-made guide; not affiliated with or endorsed by Rockstar Games or Sony Interactive Entertainment.
