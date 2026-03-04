# MWC Talent Arena 2026 Schedule Viewer

Single-page schedule viewer for [MWC Talent Arena 2026](https://talentarena.tech/) (March 3–4, Barcelona). Three views: List, Calendar grid, Timeline/Gantt. Zero-build, no-framework static site using ES modules.

**Live site:** https://xicodomingues.github.io/mwc-talent-arena-2026/

## Running & Deploying

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Deployed via GitHub Pages from `master`. Push to `master` to deploy.

No automated tests. Verify manually: all three views, filters, hide/star, modal, mobile layout.

## Architecture

- `app.js` is the ES module entry point (`<script type="module">`).
- JS modules in `js/`: constants, state, utils, filters, list-view, grid-views, modal.
- CSS modules in `css/`: base, topbar, filters, cards, events, calendar, timeline, modal, responsive.
- `about.html` and `help.html` are standalone pages with inline styles (don't share `css/`).

## Critical Rules

**IMPORTANT: Calendar and Timeline must maintain feature parity.** Both views share stage hiding (`calHiddenStages`), "show hidden" toggle, now-line, past/ongoing logic, and starred/hidden display. When modifying one view, always replicate in the other. Both renderers live in `js/grid-views.js` and share helper functions.

**ES modules require `window` assignment.** Functions called from HTML `onclick` attributes must be added to `Object.assign(window, { ... })` in `app.js`.

**Refresh callback pattern.** `state.js` exports `refresh()` which calls a callback set by `app.js` via `setRefreshFn()`. This is how state mutations trigger re-renders without circular imports. State mutation functions (toggleHide, switchDay, etc.) call `refresh()` internally.

**`applyFilters()` does NOT render.** It only computes `filteredIndices`. The `filterAndRender()` function in `app.js` calls both. This is what `window.applyFilters` points to.

## Gotchas

- **Session indices are array positions** — hidden/highlighted sessions are stored as integer indices into `SESSIONS`. Reordering `sessions.json` breaks localStorage for existing users.
- **Primitive state uses setters** — `let` exports can't be mutated via import; use setter functions (`setCurrentView()`, `setScrollToNow()`, etc.). Sets/arrays are mutated in place.
- **All rendering is innerHTML-based** — entire view re-renders on every filter change. No incremental updates.
- **All user-visible data goes through `esc()`** — uses `textContent`/`innerHTML` round-trip for HTML escaping.
- **"Now" logic is timezone-aware** — `nowInBarcelona()` uses `Europe/Madrid`. Events gray out at midpoint, not end time. Only activates during March 2026.

## Common Modifications

### Adding a new filter
1. Add constant array in `js/constants.js`
2. Add Set + setter in `js/state.js`
3. Add chip builder using `buildChips()` and toggle in `js/filters.js`
4. Call builder in `init()` and expose toggle on `window` in `app.js`
5. Add filter condition in `applyFilters()`

### Adding a new session field
1. Add to `sessions.json` objects
2. Use in `cardHTML()` (list-view), `showModal()` (modal), and/or grid renderers (grid-views)
3. Optionally add to `buildSearchIndex()` in state.js
