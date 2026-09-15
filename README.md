# ShotTrack

ShotTrack is a golf shot-tracking app built around one simple goal: **make recording shots during a real round fast enough that tracking does not get in the way of playing golf.**

## Current Prototype

ShotTrack now has a working, mobile-first browser prototype with no install or backend required. It can:

- Start a 9- or 18-hole round.
- Record the course, starting hole, and target score/par.
- Log a shot with a club in a couple of taps.
- Optionally tag the result as Good, Left, Right, Short, Long, or Penalty.
- Undo the most recent shot.
- Move backward and forward through holes.
- Automatically preserve an unfinished round in the browser.
- Resume a round after closing/reloading the page.
- Finish a round and see a hole-by-hole summary.
- Store completed round history locally on the device.

The prototype is intentionally a **local-first web app**. Data is stored with browser `localStorage`, so there is no account, cloud sync, GPS, or server yet.

## Run It

Clone/download the repository and open `index.html` in a modern browser. The current version has no build step and no dependencies.

Files:

- `index.html` — app screens and structure.
- `styles.css` — mobile-first interface.
- `app.js` — round state, shot logging, summaries, history, and local persistence.

## Why ShotTrack?

The project started from using a physical shot-tracking booklet (Track Pad Pro). The information it captures can be useful, but manually recording every shot during a round is too slow and disruptive. ShotTrack aims to keep the useful parts of detailed shot logging while dramatically reducing the effort required to record each shot.

The core design question is:

> How little interaction can a golfer get away with while still collecting useful information about every shot?

## Product Principles

1. **Speed first.** Logging a shot should take only a few seconds.
2. **Minimal interruption.** The golfer should spend more time playing than entering data.
3. **Simple inputs.** Do not collect information just because we can.
4. **Build something usable before something impressive.**
5. **Test on a real course.** Desk-speed and golf-speed are not the same thing.
6. **Add analytics after reliable data collection.** Bad/incomplete inputs make fancy analysis meaningless.

## Current Shot Model

For the first prototype, a shot contains only:

- Club
- Optional result tag
- Timestamp

That is deliberately small. The next major product decision is determining which additional fields provide enough value to justify another tap during a round.

## Intended Workflow

1. Start a round.
2. Enter the course and round setup.
3. On each shot, tap a club.
4. Optionally tap the shot result.
5. Tap **Log shot**.
6. Move through the holes.
7. Finish and review the round.

## Next Priorities

### 1. Real-course usability test
Take the prototype through an actual 9- or 18-hole round and measure whether logging feels annoying. This should happen before adding much more complexity.

### 2. Better golf data model
Decide whether the next version should capture lie, target/distance, shot outcome, putt distance, penalties, or GPS position. Every field needs to earn its place in the on-course workflow.

### 3. Course-aware scoring
Add hole pars rather than using only a round-level target, allowing proper score-to-par summaries and hole-level scoring.

### 4. Club analytics
Use accumulated shots to show club usage and directional/result tendencies across rounds.

### 5. Installable mobile app
Turn the web prototype into an installable PWA or move to a native/cross-platform mobile stack once the interaction model has been validated.

## Longer-Term Ideas

- GPS-assisted shot positions and distances.
- Course/hole database.
- Visual shot maps.
- Fairway and green performance.
- Putting statistics.
- Club-by-club performance history.
- Miss-direction tendencies.
- Round trends.
- One-handed quick logging.
- Automatic or semi-automatic shot capture where practical.
- Recommendations based on historical shot data.
- Cloud sync/account support if the project reaches the point where it is useful.

## Status

**Playable prototype / product discovery.**

The goal right now is not to imitate a mature golf-statistics platform. It is to prove that detailed-enough shot tracking can be made quick enough to use while actually golfing.

---

**ShotTrack** — track the shot, not the paperwork.
