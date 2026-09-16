# ShotTrack

ShotTrack is a mobile-first golf shot tracker built around one goal: **record useful shot-by-shot data during a real round without slowing down play.** It was inspired by the Track Pad Pro booklet, but replaces manual paperwork with a fast map-based workflow.

## Current status — September 16, 2026

**Usable V1 progress: roughly 95%.** Course selection, satellite mapping, tee/hole navigation, one-shot-at-a-time recording, putting, penalties, persistence, summaries and history are working. A live scorecard shows hole par, strokes taken, running score versus par and the result available on the next shot or putt. The first round-analytics release calculates putts, penalties, FIR, GIR, three-putts, average driver distance and tee-miss direction from the data already captured.

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
- Live in-round scorecard with par, strokes, running score and next-shot scoring context such as Putt for Birdie.
- Saved-round performance dashboard with scoring trends, putting by starting distance, FIR/GIR, driver distance, penalties, miss direction, club-distance ranges and expandable hole-by-hole round history.
- Local data management in History: JSON backup export, validated restore with a pre-import safety copy, undo-last-restore and confirmed per-round deletion.

## Important product decisions

### Manual lie selection
Automatic lie classification was prototyped and then intentionally abandoned. A slightly wrong automatic lie is worse than one quick user input. **Do not reintroduce automatic lie detection unless this decision is explicitly revisited.**

Manual lie choices are: Fairway, Left Rough, Right Rough, Bunker, Green and Other. Water is handled through the penalty workflow rather than as a normal resulting lie.

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

### Course par and scorecard data

ShotTrack uses a layered, no-paid-key strategy so the app is not limited to a small commercial daily quota:

1. OpenGolfAPI course detail and scorecard data, cached locally for 30 days.
2. The StakeMarker community course dataset as a cacheable complete-scorecard fallback.
3. OpenStreetMap hole `par` tags when available.
4. One-tap manual par selection as the final fallback.

OpenGolfAPI and StakeMarker course data are available under the Open Database License (ODbL 1.0); attribution is shown in the app. The fallback dataset currently covers thousands of complete 18-hole scorecards and requires no API key.

## Files

- `index.html` — application screens and script loading.
- `styles.css` — mobile-first interface.
- `app.js` — core round state, legacy shot logic, summaries/history and persistence.
- `google-map.js` — Google satellite map adapter and map interactions.
- `course-picker.js` — location-aware course discovery/search/recents and OpenGolfAPI matching.
- `scorecard-data.js` — free, cacheable community scorecard fallback.
- `hole-experience.js` — hole/tee geometry and current hole experience.
- `v3-experience.js` — shot-by-shot V3 interaction layer.
- `analytics-dashboard.js` — saved-round aggregation, trends and historical round drilldowns.
- `data-management.js` — local backup, restore safeguards and round deletion.

There is intentionally no heavy framework/build system yet. Keep changes simple while the on-course interaction model is still being validated.

## Next priorities

### 1. Validate the performance dashboard (~95 → 98%)
Confirm the Analysis button opens the saved-round dashboard, historical rounds expand correctly, and scoring, putting, FIR/GIR, club-distance and tendency calculations agree with known rounds.

### 2. Validate backup and restore safety
Export a backup, restore it, confirm saved and active rounds survive, verify Undo last restore, and test one confirmed round deletion.

### 3. Real-course validation (~98 → 100% V1)
Run the full V1 workflow at golf speed across multiple courses and fix only confirmed usability or data-quality problems before calling V1 complete.

### 4. Post-V1 analytics depth
After the core dashboard is validated, consider course filters, time-range filters, richer dispersion views and cloud sync for cross-device history.

## Known areas to verify next

- Verify FIR only counts par-4/par-5 tee shots with Fairway as the resulting lie.
- Verify GIR includes penalty strokes taken before reaching the green.
- Verify average driver distance uses mapped Dr shots only.
- Confirm analytics remain correct for older saved rounds with incomplete par or putting data.
- Check whether old/stacked map logic can be safely cleaned up only after behavior is covered by testing.
- Verify exported backups restore saved rounds, the active round and recent courses without corrupting older data.
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