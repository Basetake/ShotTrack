# ShotTrack

ShotTrack is a golf shot-tracking app concept built around one simple goal: **make recording shots during a real round fast enough that tracking does not get in the way of playing golf.**

## Why ShotTrack?

The project started from using a physical shot-tracking booklet (Track Pad Pro). The information it captures can be useful, but manually recording every shot during a round is too slow and disruptive. ShotTrack aims to keep the useful parts of detailed shot logging while dramatically reducing the effort required to record each shot.

The core design question is:

> How little interaction can a golfer get away with while still collecting useful information about every shot?

## Project Goal

Build a simple, practical shot tracker that a golfer can realistically use **while playing**, then turn the recorded shots into useful post-round information.

ShotTrack should prioritize:

- **Speed first** — logging a shot should take only a few seconds.
- **Minimal interruption** — the golfer should spend more time playing than entering data.
- **Simple inputs** — avoid requiring unnecessary information for every shot.
- **Useful history** — recorded rounds should become a useful history of actual on-course performance.
- **Progressive complexity** — start with a small working tracker before adding advanced analytics or automation.

## Intended Workflow

A basic ShotTrack round should eventually feel something like this:

1. Start a round.
2. Select or enter the course and starting hole.
3. Record each shot with the minimum useful information.
4. Move quickly to the next shot/hole without navigating through unnecessary screens.
5. Finish the round.
6. Review the round and analyze the collected shot data afterward.

The exact input system is still being designed. The priority is reducing taps and typing rather than collecting every possible golf statistic from day one.

## MVP

The first useful version should focus on the fundamentals:

- Start and finish a round.
- Track holes during the round.
- Log individual shots.
- Associate shots with a club when useful.
- Store enough information to reconstruct a round.
- Review the shots from a completed round.
- Keep the interface/workflow fast enough for actual on-course use.

The MVP should prove that ShotTrack is **faster and easier to use during a round than manually recording the same information in a booklet.**

## Future Ideas

Once the basic tracker works reliably, possible extensions include:

- Club-by-club performance history.
- Shot-distance tracking.
- Fairway and green performance.
- Miss-direction tendencies.
- Putting statistics.
- Round summaries and trends over time.
- Course and hole history.
- Visual shot maps.
- GPS-assisted inputs.
- Faster one-handed/mobile logging.
- Automatic or semi-automatic data capture where practical.
- Recommendations based on a player's historical shot data.

These are future possibilities rather than requirements for the first version. ShotTrack should earn complexity by first solving the basic logging problem well.

## Development Status

**Early prototype / planning stage.**

This project began as a beginner app-development project. Initial experimentation was done from the terminal while working through the basic structure and programming concepts step by step. The GitHub repository is now the home for continued development.

No production-ready architecture or technology stack should be assumed from this README yet. Those decisions can evolve as the prototype becomes clearer.

## Development Principles

1. **Build something usable before something impressive.**
2. **Optimize for the golfer on the course.** A feature that creates too much friction defeats the purpose of ShotTrack.
3. **Keep the data model understandable.** The project should remain approachable while it grows.
4. **Test with real rounds.** A workflow that feels fast at a desk may feel completely different on a golf course.
5. **Add analytics after reliable data collection.** Good analysis depends on consistently recorded shots.

## Current Roadmap

### Phase 1 — Foundation
- Define exactly what information a single shot needs.
- Define the round, hole, and shot data structures.
- Establish the initial project structure and development stack.
- Build a basic working shot-entry flow.

### Phase 2 — Playable Prototype
- Start a round and progress through holes.
- Add, edit, and remove shots.
- Save completed rounds.
- Review a round after finishing.
- Test the workflow during an actual round of golf.

### Phase 3 — Analysis
- Calculate useful round statistics.
- Add club-level summaries and tendencies.
- Compare performance across rounds.
- Identify which additional data is worth the extra effort to collect.

### Phase 4 — Advanced Features
- Explore GPS/location-assisted tracking.
- Add richer course information and shot visualization.
- Reduce manual input further through automation where feasible.

## Repository

This repository will contain the ShotTrack source code, project documentation, experiments, and development history as the idea moves from prototype to usable golf application.

---

**ShotTrack** — track the shot, not the paperwork.
