# Architecture

The app is a static site with native ES modules and no runtime dependencies. It deliberately keeps the original dark visual design, local storage format and recommendation behavior.

## Module map

| Module               | Responsibility                                                         |
| -------------------- | ---------------------------------------------------------------------- |
| `app.mjs`            | Startup, event wiring, save orchestration and external storage updates |
| `bank.mjs`           | The 36 source routines and stable identifiers                          |
| `dates.mjs`          | Local current date and UTC calendar-day arithmetic                     |
| `load.mjs`           | Stable training-load keys, independent of translated labels            |
| `history.mjs`        | Duration/calorie totals and weighted recent load                       |
| `recommendation.mjs` | Eligibility, combination search, named scoring criteria and ranking    |
| `validation.mjs`     | Version 1 backup validation and language-independent error codes       |
| `entries.mjs`        | Historical workout snapshots with copied load ratings                  |
| `storage.mjs`        | localStorage adapter, write protection and recovery                    |
| `messages.mjs`       | English dynamic copy, formatting and user-facing error messages        |
| `dom.mjs`            | Safe DOM construction, notices and navigation                          |
| `views.mjs`          | Daily summary, history and routine library rendering                   |
| `editor.mjs`         | Workout form and snapshot-preserving edits                             |
| `plans-view.mjs`     | Recommendation form and plan logging                                   |
| `backup.mjs`         | Validated import and JSON download                                     |
| `engine.mjs`         | Small domain API re-export for existing callers                        |
| `sw.js`              | Versioned app-shell precaching for offline use                         |

The editor and views receive callbacks for state and actions. They do not write directly to storage. Dynamic content uses `textContent`, including imported names; no user data is interpolated into HTML.

## Data flow

A save builds a workout snapshot, validates the complete next state, writes it to localStorage, then publishes it in memory and renders. Failed writes keep the previous in-memory state. An unreadable initial history blocks normal saves until a valid restore succeeds, protecting the original raw data from accidental replacement.

Backup restore parses and validates before asking for replacement confirmation. The store validates again at the persistence boundary. This duplicate validation is intentional: neither the storage API nor the UI trusts its caller's input. Only a successful write clears recovery protection.

Each entry contains `id`, `routineId`, `name`, `date`, `slot`, `count`, `minutes`, `kcal` and `load`. The envelope remains `{version: 1, entries: [...]}`. Names are arbitrary user data and are never translated. Dates remain `YYYY-MM-DD` strings. The current date uses local time; historical day arithmetic uses UTC to avoid daylight-saving shifts.

## Ranking

Eligibility and ranking are separate. The current policy is deliberately fixed and named, not yet an end-user settings feature. `criteria` exposes each score component; `score` retains the original positional values for compatibility and characterization tests. Stable sort retains original enumeration order for exact ties.

The search remains exhaustive for up to four routines. Performance optimization is deferred until measured; it should preserve stable ties and the original ordering. A worker can move computation off the main thread without introducing a backend.

## Localization boundary

The UI is English only. Dynamic messages and load labels are centralized. Validation errors carry codes that the UI maps to text. Static HTML, manifest metadata and a few simple unit/name compositions also need extraction when a second language is implemented. This is preparation, not a complete localization system.

Changing display language must never change persistent load keys, routine IDs, stored names or backup fields. Locale-specific formatting belongs in the UI, not the domain engine.

## Storage limitations

Writes replace the complete JSON envelope. A browser storage event refreshes other tabs, but does not provide transactional multi-tab editing. This is adequate for the current personal-use scope. localStorage is not a backup, and neither service-worker cache nor a remote Git repository synchronizes history.
