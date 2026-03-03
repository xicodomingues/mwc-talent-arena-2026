# CLAUDE.md — MWC Talent Arena 2026 Schedule Viewer

## Project Overview

A single-page schedule viewer for [MWC Talent Arena 2026](https://talentarena.tech/) (March 3–4, Barcelona). It displays conference sessions across three views (List, Calendar grid, Timeline/Gantt) with filtering, search, session hiding/starring, and a live "now" indicator.

**Live site:** https://xicodomingues.github.io/mwc-talent-arena-2026/

This project was vibecoded with Claude (Opus) using Claude Code.

## Architecture

This is a **zero-build, no-framework** static site. There is no bundler, transpiler, package manager, or build step. All files are served as-is.

### File Structure

```
index.html              – Main SPA entry point (top bar, modal, content container)
app.js                  – All application logic (~780 lines of vanilla JS)
style.css               – All styles (~185 lines, dark theme, CSS custom properties)
sessions.json           – Session data (array of ~100+ session objects)
mwc_talent_arena_full.ics – Full calendar export in ICS format
about.html              – Static about page (self-contained styles)
help.html               – Static help page with visual guide for hide/restore (self-contained styles)
```

### Key Design Decisions

- **Single JS file (`app.js`)**: All state management, rendering, filtering, and UI logic lives in one file with no modules or imports.
- **No templating engine**: HTML is built via string concatenation in JS functions, then set via `innerHTML`.
- **No router**: Day/view state is persisted in the URL hash (`#day=3&view=calendar`). The `about.html` and `help.html` are separate static pages.
- **Dark theme only**: Uses CSS custom properties (`:root` variables) for a dark color scheme. No light mode.
- **localStorage persistence**: Hidden sessions, highlighted/starred sessions, calendar stage visibility, and "show hidden" toggle state are all saved to localStorage.

## Data Model

### `sessions.json` Schema

Each session object has:

```json
{
  "day": 3,                          // 3 or 4 (March 3 or 4)
  "time": "09:30-10:00",             // "HH:MM-HH:MM" format
  "stage": "XPRO stage",             // One of STAGE_ORDER
  "title": "Session Title",
  "speakers": [{"name": "...", "role": "..."}],
  "description": "...",
  "tags": ["Artificial Intelligence"],  // Subset of ALL_TAGS
  "lang": "English",                 // "English", "Spanish", or "Catalan"
  "companies": ["Company"],
  "company": "Company",              // Primary company (display shortcut)
  "short": "Short Title"
}
```

### Constants in `app.js`

- `STAGE_COLORS` — maps stage names to hex colors (used for borders, badges, calendar columns)
- `STAGE_ORDER` — canonical ordering of stages (13 stages)
- `ALL_TAGS` — 8 topic categories for filtering
- `ALL_LANGS` — `["English", "Spanish", "Catalan"]`
- `LANG_FLAGS` / `LANG_CLASS` — emoji flags and CSS classes per language

## Application State (`app.js`)

Global mutable state variables:

| Variable | Type | Purpose |
|---|---|---|
| `SESSIONS` | Array | Loaded from `sessions.json` at startup |
| `currentView` | String | `"list"`, `"calendar"`, or `"timeline"` |
| `dayFilter` | String | `"3"` or `"4"` |
| `searchQuery` | String | Current search text |
| `activeStages` | Set | Which stages are visible (filter) |
| `activeTags` | Set | Which tags are visible (filter) |
| `activeLangs` | Set | Which languages are visible (filter) |
| `filteredIndices` | Array | Result of `applyFilters()` — indices into `SESSIONS` |
| `hiddenSessions` | Set | Session indices hidden by user (persisted) |
| `highlightedSessions` | Set | Session indices starred by user (persisted) |
| `calHiddenStages` | Set | Stages hidden in calendar/timeline view (persisted) |
| `showHidden` | Boolean | Whether to display hidden sessions (faded) |
| `showHighlightedOnly` | Boolean | Whether to filter to starred sessions only |
| `scrollToNow` | Boolean | Whether next render should auto-scroll to the "now" line |

## Rendering Pipeline

1. **`applyFilters()`** — Iterates all sessions, applies day/stage/tag/lang/search/hidden/highlighted filters, populates `filteredIndices`.
2. **`render()`** — Dispatches to `renderList()`, `renderCalendar()`, or `renderTimeline()` based on `currentView`. Saves/restores scroll positions. Resets `scrollToNow`.
3. **View renderers** — Each builds an HTML string and sets `innerHTML` on `#content`.

### View Details

- **List view** (`renderList`): Groups sessions by day + time slot. Uses `cardHTML()` for each card.
- **Calendar view** (`renderCalendar` / `calendarDayHTML`): Vertical grid with stages as columns. Pixel-per-minute layout (`ppm = 3`). Sticky header. Now-line. Drag-to-scroll.
- **Timeline view** (`renderTimeline`): Horizontal Gantt chart with stages as rows. `ppm = 5`, `rowH = 40`. Clickable legend to toggle stages.

### "Now" Indicator & Past/Ongoing Logic

- All "now" calculations use `nowInBarcelona()` which returns the current time in `Europe/Madrid` timezone (session times are in Barcelona local time).
- Events are grayed out (`cal-past`, `tl-past`) when the current time is past the event's **midpoint** (`midM = (startM + endM) / 2`).
- Events get `cal-ongoing` / `tl-ongoing` when the current time is between `startM` and `midM`.
- A red now-line is drawn at the current time position.
- Grayout and now-line only activate during the actual event month (March 2026) to avoid false matches on other dates.
- The view auto-refreshes every 5 minutes and when the page regains visibility.

## CSS Conventions

- All styles in `style.css` (except `about.html` and `help.html` which have inline `<style>` blocks).
- CSS custom properties defined on `:root`: `--bg`, `--surface`, `--surface2`, `--surface3`, `--text`, `--text2`, `--text3`, `--accent` (gold), `--accent2` (cyan), `--radius`, `--radius-sm`.
- Per-card color via `--card-color` CSS variable set inline.
- Stage-colored pills use `--pill-color` CSS variable.
- `color-mix(in srgb, ...)` used for semi-transparent backgrounds.
- Mobile breakpoint at 767px. Desktop gets multi-column card grid and centered modal.

## Development Workflow

### Running Locally

No build step. Serve the directory with any static HTTP server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open `http://localhost:8000`.

### Testing

There are no automated tests. Verify changes by:
1. Opening the app in a browser
2. Checking all three views (List, Calendar, Timeline)
3. Testing filters (day toggle, stage/topic/language dropdowns, search)
4. Testing hide/unhide and star/unstar functionality
5. Checking the modal popup
6. Verifying responsive layout on mobile widths

### Deployment

The site is deployed via GitHub Pages from the `master` branch. Push to `master` to deploy.

## Common Modification Patterns

### Adding a new filter dimension
1. Add a constant array for the options (like `ALL_TAGS`).
2. Add a `Set` state variable (like `activeTags`).
3. Build a dropdown menu in `init()` (like `buildTagMenu()`).
4. Add toggle/update functions.
5. Add the filter condition in `applyFilters()`.

### Adding a new session field
1. Add the field to objects in `sessions.json`.
2. Use it in `cardHTML()`, `showModal()`, and/or the calendar/timeline renderers.
3. Optionally add it to the search index in `buildSearchIndex()`.

### Modifying stage colors or ordering
Edit `STAGE_COLORS` and `STAGE_ORDER` at the top of `app.js`.

## Important Caveats

- **All rendering is innerHTML-based** — no virtual DOM, no incremental updates. The entire view is re-rendered on every filter change.
- **Session indices are array positions** — hidden/highlighted sessions are stored as integer indices into `SESSIONS`. Reordering `sessions.json` will break localStorage state for existing users.
- **No XSS escaping besides `esc()`** — the `esc()` function uses `textContent`/`innerHTML` round-trip for HTML entity escaping. All user-visible data goes through `esc()`.
- **`about.html` and `help.html` are standalone** — they duplicate CSS variables and font stacks rather than sharing `style.css`.
- **No build or lint tooling** — there is no `.eslintrc`, `prettier`, `tsconfig`, or any configuration files. Code style is informal.
