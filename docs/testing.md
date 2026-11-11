# Testing

## Automated checks

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:browser
```

Node 22 or newer is required. The static development/test server uses Python 3. Node tests need no installed dependencies when run with `npm test`.

The check command runs Prettier, ESLint and all Node tests. Browser tests use Playwright with a mobile Chromium viewport. CI installs Chromium explicitly and runs the same checks. To use an existing local Chrome installation instead of downloading a browser:

```sh
PLAYWRIGHT_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:browser
```

The browser command runs both mobile and desktop projects. To run only desktop checks, use `npm run test:browser -- --project=desktop`.

## Coverage

- Baseline recommendation, calendar boundaries and low-impact constraints.
- Five fixtures generated from v1.1, comparing selected routine IDs, totals and original score components.
- Lexicographic priority order, stable ties and all routine data validation.
- Snapshot isolation, version 1 compatibility, recovery protection and failed writes.
- Validation error codes, malformed records and preservation of names in any language.
- Browser create/edit/delete, reload persistence, JSON export/restore, invalid restore, plan logging and offline reload/save.
- Service-worker asset coverage and relative URL behavior.

Fixtures describe original behavior, not whether the estimated training policy is medically appropriate. A deliberate policy change should update fixtures only after reviewing the intended new outcomes.

## Manual iPhone release checks

1. Open the deployed HTTPS site in Safari, add it to the Home Screen and create a workout.
2. Close and reopen the installed app; verify the entry remains.
3. Enter airplane mode after caching; reopen, create a workout and verify history.
4. Export JSON to Files, delete a workout, then restore the export.
5. Check the English labels, dialog scrolling, keyboard interaction, focus and bottom navigation on a small screen.
6. Deploy a new cache version, close every site/app window, reopen online and verify the update and unchanged history.
7. Verify deployment under the intended subdirectory, if used.

Chromium automation does not replace real iPhone/Safari verification. Back up actual history before manual recovery or release testing.

## Verification in the implementation sandbox

Formatting, lint, Node tests and browser test discovery can run here. Actual Playwright execution was blocked because the sandbox denies binding the local HTTP server port (`PermissionError: Operation not permitted`). Browser tests are prepared for local execution and CI but were not verified in this environment. Real iPhone/Safari and release-update checks remain manual.
