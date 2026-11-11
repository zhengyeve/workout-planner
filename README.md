# Routine Planner

A personal, offline-capable workout journal and recommendation app built with vanilla JavaScript. It contains 36 routines and stores workout history in your browser. The interface is English.

## Run locally

Requirements: Node.js 22 or newer, npm, and Python 3 for the local static server.

```sh
npm ci
npm run dev
```

Open <http://127.0.0.1:5173/>. Development dependencies provide formatting, linting and browser tests; the app itself has no runtime dependencies and no build step. To run without installing development tools:

```sh
python3 -m http.server 5173 --bind 127.0.0.1 --directory web
```

## Checks

```sh
npm run check
npx playwright install chromium
npm run test:browser
```

`npm run check` runs formatting, lint and Node tests. See [testing](docs/testing.md) for browser coverage, a local Chrome option and manual iPhone checks.

## History and backups

History starts empty and is saved under `routine-planner.v1` in localStorage. Reloading the page, restarting the browser or a server outage does not reset it. Each logged workout preserves its name, duration, calorie estimate and load ratings as a snapshot.

Use **Backup → Export history** to download a JSON copy. Restoring validates the entire file before replacing local history. Version 1 backups from the original app remain compatible, and saved names are preserved in any language.

Storage belongs to the browser and website origin (protocol, hostname and port). Moving from localhost to a hosted site, switching browsers or devices, or changing your domain requires exporting and restoring your history. A Git repository contains the application code, not your personal workout history. Clearing website data, browser eviction or losing your device can lose history; keep backups outside the browser.

There are no accounts, automatic remote backups, device sync, analytics or health-platform integrations. Concurrent editing across tabs is not a supported conflict-resolution workflow.

## Deploy and use offline

Publish the contents of `web/` on an HTTPS static host. Relative asset paths support deployment under a subdirectory. A backend is unnecessary. JavaScript modules should be served with a JavaScript MIME type; `manifest.webmanifest` should use `application/manifest+json`.

On iPhone, open the HTTPS address in Safari and choose **Share → Add to Home Screen**. Allow the initial page to finish caching before relying on offline use. An outage cannot remove saved history, but loading offline requires a successful previous cache installation.

### Release updates

1. Run all checks and browser tests.
2. If any file in `web/` changes, bump `CACHE_NAME` in `web/sw.js` and include new assets in `ASSETS`.
3. Deploy all files together. Configure the host to revalidate `sw.js` rather than caching it indefinitely.
4. Close all tabs and installed app windows for this site, then reopen online to activate the new worker.
5. Verify the update and an offline reload before relying on it.

The worker intentionally waits for old clients to close; it does not force a reload while someone is editing. Cache upgrades do not modify localStorage. Failed caching leaves the previous installed worker available. Avoid deploying only some of a release's modules.

## Recommendation policy

The engine enumerates combinations of up to four distinct routines, applies duration and optional low-impact restrictions, then ranks candidates lexicographically:

1. Within the calorie target tolerance: the larger of 15 kcal and rounded 10% of the target.
2. Fewer recently high-load dimensions being loaded highly again.
3. Fewer routines repeated in the last three calendar days, including the selected day.
4. Lower recent-load overlap and combined load concentration.
5. Smaller calorie gap for plans outside the target tolerance.
6. Fewer uses in the last seven days.
7. Smaller calorie gap overall.
8. Shorter duration.

An earlier criterion takes precedence over every later criterion. See `RANKING_PRIORITIES` in [recommendation.mjs](web/recommendation.mjs). Choosing **Log entire plan as completed** is the action that saves recommendations to history.

App kcal and durations are fixed source values, not live measurements. Load ratings are rough estimates. Exercise lists may include only the portions visible in the original recordings. The library includes the Upper Body HIIT routine added on 2026-11-10.

## Contributing and future work

- Keep existing routine IDs stable when editing [the routine library](web/bank.mjs).
- Keep backup compatibility and historical snapshots intact.
- Put dynamic English UI copy in [messages.mjs](web/messages.mjs); static page copy currently lives in HTML.
- Run `npm run format` before submitting changes, then run checks.
- Review [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md) before changing ranking or storage.

No public license has been selected. Before publishing for reuse, choose a license and verify redistribution rights for routine descriptions and icon assets.
