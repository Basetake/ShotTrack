# ShotTrack

ShotTrack is a mobile-first golf shot tracker built around one goal: **record useful shot-by-shot data during a real round without slowing down play.** It was inspired by the Track Pad Pro booklet, but replaces manual paperwork with a fast map-based workflow.

## Current status — September 15, 2026

**Usable V1 progress: roughly 55–60%.** The foundation, course selection, satellite mapping, tee/hole navigation, persistence, and core shot mapping are working. The next major phase is making the one-shot-at-a-time recording flow bulletproof, then building useful round statistics and history/dashboard views.

The live prototype is deployed with GitHub Pages from `main`.

## Stable functionality — preserve unless fixing a confirmed bug

- Location-aware golf-course discovery.
- Strict filtering so nearby results are actual golf courses rather than ordinary businesses/places.
- Nearby courses sorted by browser-location distance with mileage.
- Typed course search and recently viewed courses with removal.
- The old **View all courses** controls were intentionally removed; they were not useful.
- Google satellite map experience.
- OSM/Overpass course geometry for tees, greens and holes.
- Tee-box / hole framing and navigation. The current geometric tee detection is working well and should not be casually rewritten.
- Map-position preservation between shots/holes when a next tee cannot be confidently found.
- Club selection, mapped shot distances, shot markers and paths.
- LocalStorage round persistence/resume, undo/reset/navigation, summaries and history.

## Important product decisions

### Manual lie selection
Automatic lie classification was prototyped and then intentionally abandoned. A slightly wrong automatic lie is worse than one quick user input. **Do not reintroduce automatic lie detection unless this decision is explicitly revisited.**

Manual lie choices are intended to be: Fairway, Left Rough, Right Rough, Bunker, Green, Water, Other.

OSM tee/green/hole geometry should remain because it is still useful for map framing and navigation; removing automatic lie detection does not mean removing course geometry.

### Shot-by-shot V3 direction
The round should feel like one focused shot at a time rather than a form for an entire hole.

Desired full-shot flow:
1. Current hole / shot context.
2. Choose club.
3. Map the landing point.
4. Choose the resulting lie.
5. Optional notes/details.
6. **Next Shot** advances to the next shot.
7. **Next Hole** remains available as a secondary action.

The map is for full shots, not putts. Putting should use a dedicated quick-entry mode with a putt counter and starting-distance ranges: **0–5 ft, 5–10 ft, 10–15 ft, 15–30 ft, 30+ ft**. Store enough putting data to calculate later metrics such as 2-putt and 3-putt rates by starting distance.

## Current course picker

The course picker is considered **stable** after substantial debugging. Browser geolocation and mileage work. Nearby discovery combines golf-specific map data with strict validation and deduplication so ordinary nearby businesses do not enter the list. Do not redesign this system as the next task.

The latest course-picker cleanup removed both View All buttons while preserving nearby search, mileage, recents and typed search.

## Files

- `index.html` — application screens and script loading.
- `styles.css` — mobile-first interface.
- `app.js` — core round state, legacy shot logic, summaries/history and persistence.
- `google-map.js` — Google satellite map adapter and map interactions.
- `course-picker.js` — location-aware course discovery/search/recents.
- `hole-experience.js` — hole/tee geometry and current hole experience.
- `v3-experience.js` — shot-by-shot V3 interaction layer.

There is intentionally no heavy framework/build system yet. Keep changes simple while the on-course interaction model is still being validated.

## Next priorities

### 1. Finish and test shot recording (~60 → 75%)
Make the one-shot-at-a-time flow reliable: club → landing spot → manual lie → optional note → Next Shot. Require the needed inputs, prevent accidental double entries, verify shot numbering/counting, and ensure putting works cleanly without map taps.

### 2. Finish rounds and statistics (~75 → 90%)
Validate full 9/18-hole rounds and score totals. Then calculate useful golf stats such as score, FIR/GIR, miss direction, putts/3-putts, club distance/dispersion and penalties.

### 3. History and dashboard (~90 → 100% V1)
Turn saved rounds into useful review: recent rounds, scoring trends, club performance and meaningful breakdowns. Analytics should follow reliable data collection, not precede it.

## Known areas to verify next

- Ensure one recorded shot locks the UI until **Next Shot** so repeated map taps cannot accidentally create multiple shots.
- Ensure manual lie selection is required at the correct point.
- Verify putts count toward shot numbers and hole/round totals everywhere, including summaries.
- Verify optional shot notes are saved even when navigating/finishing through alternate paths.
- Check whether old/stacked map logic can be safely cleaned up only after behavior is covered by testing.
- Real-course end-to-end testing remains essential before calling V1 complete.

## Product principles

1. **Speed first.** Logging should take only a few seconds.
2. **Minimal interruption.** The golfer should spend more time playing than entering data.
3. **Simple inputs.** Every extra tap must earn its place.
4. **Reliability over clever automation.** Manual input is preferable when automatic detection is not trustworthy.
5. **Protect working behavior.** Verify current code before changing stable systems.
6. **Test on a real course.** Desk-speed and golf-speed are different.
7. **Analytics after reliable collection.** Bad inputs make sophisticated statistics meaningless.

## Development handoff rule

Before making a substantial change in a new development session, inspect the current files in `main` rather than relying only on conversational memory. Preserve the stable course picker, tee/hole framing, map reset behavior and manual-lie decision unless a confirmed bug or explicit product decision requires changing them.

---

**ShotTrack — track the shot, not the paperwork.**