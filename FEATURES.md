# MWC Talent Arena 2026 Schedule Viewer — Feature Specification

A complete specification of every feature, behavior, and interaction in the app. This document is intended to serve as a blueprint for recreating the site from scratch.

---

## 1. Overview

A single-page schedule viewer for a 2-day tech conference (MWC Talent Arena 2026, March 3-4, Barcelona). Displays ~200 sessions across 13 stages in 3 views with filtering, search, session management, and live time indicators.

**Architecture:** Zero-build, no-framework static site. One HTML file (`index.html`), one JS file (`app.js`), one CSS file (`style.css`), one JSON data file (`sessions.json`). Dark theme only. No server-side logic.

---

## 2. Data Model

### 2.1 Session Object (`sessions.json`)

An array of session objects. Each session has:

| Field | Type | Description |
|---|---|---|
| `day` | Number (3 or 4) | Conference day (March 3 or 4) |
| `time` | String `"HH:MM-HH:MM"` | Start-end time in 24h format, Barcelona local time |
| `stage` | String | One of 13 stage names |
| `title` | String | Session title |
| `speakers` | Array of `{name, role}` | Speaker list. `role` often includes company (e.g., "CTO at Acme") |
| `description` | String | Full session description (may be empty) |
| `tags` | Array of strings | Topic tags, subset of 8 categories (may be empty) |
| `lang` | String | `"English"`, `"Spanish"`, `"Catalan"`, or `""` |
| `companies` | Array of strings | All associated companies |
| `company` | String | Primary company for display |
| `short` | String | Short title (unused in current UI) |

### 2.2 Constants

**13 stages** (in canonical display order): XPRO stage, XPRO Lab, XPRO Talks, Visionary Stage, Hotspot Talks, Plug-in Talks, Focus Lab, Frontier lab, Meetup area, Barcelona, Skills Hub, Robotics, Gaming.

**Stage colors** — each stage has a unique hex color used for borders, badges, column headers, legend dots, and semi-transparent backgrounds.

**8 topic tags:** Artificial Intelligence, Cloud Computing, Cybersecurity, Future Trends, GAMING, Management, ROBOTICS, Software Development.

**3 languages** with flag emojis: English (GB flag), Spanish (Spain flag), Catalan (black flag).

---

## 3. Application State

All state is client-side. URL hash and localStorage provide persistence.

### 3.1 URL Hash State

Format: `#day=3&view=calendar`

- `day` — `"3"` or `"4"` (active day filter)
- `view` — `"list"`, `"calendar"`, or `"timeline"` (active view)

Updated via `history.replaceState` (no browser back/forward entries).

### 3.2 localStorage Persistence

| Key | Type | Purpose |
|---|---|---|
| `mwc_hidden_sessions` | JSON array of ints | Session indices the user has hidden |
| `mwc_highlighted_sessions` | JSON array of ints | Session indices the user has starred |
| `mwc_cal_hidden_stages` | JSON array of strings | Stages hidden in calendar/timeline views |
| `showHidden` | `"true"` / `"false"` | Whether "show hidden" mode is active |

All localStorage reads use a `safeGetJSON()` wrapper that returns `[]` on parse errors.

### 3.3 In-Memory State (not persisted beyond URL/localStorage)

- `activeStages` — Set of stages currently enabled in the filter (default: all)
- `activeTags` — Set of tags currently enabled in the filter (default: all)
- `activeLangs` — Set of languages currently enabled (default: all)
- `searchQuery` — Current search box text
- `showHighlightedOnly` — Boolean for "starred only" filter mode
- `scrollToNow` — Boolean flag for whether next render should auto-scroll to the now-line
- `filteredIndices` — Result of applying all filters; array of indices into `SESSIONS`

---

## 4. Top Bar (Sticky Header)

The top bar is sticky (stays at top on scroll). Contains controls in a flex row, 52px tall.

### 4.1 Day Indicator

A compact button showing the current day: **"Mar 3"** or **"Mar 4"**, with a small chevron icon. Positioned to the left of the view switcher.

**Clicking** toggles between Day 3 and Day 4, re-applies filters, sets `scrollToNow = true`, and updates the URL hash.

**Default day selection:** If the current date is March 4 (in Barcelona timezone), default to Day 4; otherwise Day 3.

**Styling:** Cyan text/border, subtle background. 36px height, rounded corners.

### 4.2 View Switcher

Three buttons in a segmented button group: **List**, **Calendar**, **Timeline**. Each has an SVG icon + text label. Active button gets gold background + black text.

**Default view:** Calendar on desktop (viewport >= 768px), List on mobile.

**Mobile:** Text labels are hidden (icon-only) via `.view-label { display: none }`.

### 4.3 Star Button (icon)

A star SVG icon button with a count badge. Positioned after the topbar spacer.

- Badge shows count when > 0, hidden when 0
- **Inactive with starred sessions:** subtle gold styling (`active-star` class)
- **Active (filtering):** bright gold background
- **Click behavior is view-dependent:**
  - **List view:** Hard filter — only starred sessions are shown
  - **Calendar/Timeline:** Dim mode — non-starred sessions get 15% opacity + grayscale (`star-dimmed` class), starred sessions pop out with gold outline

### 4.4 Hidden Button (icon)

An eye-slash SVG icon button with a count badge.

- Badge shows count when > 0, hidden when 0
- **Active:** red background/border (`active-hidden` class)
- **Click:** Toggles "show hidden" mode — hidden sessions appear faded (30% opacity, dashed borders)

### 4.5 Filter Button

A button labeled "Filters" with a filter SVG icon. Toggles the slide-down filter panel.

- **Active:** cyan border when panel is open
- **Filter dot:** A small cyan dot appears next to the label when any filter (stages, topics, language) differs from the default "all selected" state

**Mobile:** "Filters" label is hidden, icon-only.

### 4.6 Search Box

Text input with search icon and placeholder `"Search sessions, speakers..."`.

- Width: 220px, expands to 280px on focus
- **Clear button (×):** Appears inside the search bar when text is present. Clicking clears input and re-applies filters.
- Searches across: title, stage, description, language, all tags, all speaker names, all speaker roles, and company names extracted from roles
- Search is case-insensitive, substring match
- Filters in real-time on every keystroke (`oninput`)
- On first focus + keypress, the full text is selected

**Mobile:** Search bar takes full width (order: 10).

### 4.7 Mobile Layout (< 768px)

- Top bar wraps using `flex-wrap: wrap` with reduced gaps
- View labels hidden (icon-only)
- Filter trigger label hidden
- All buttons get smaller (32px height)
- Search box: full width on own row

---

## 5. Filter Panel (Slide-Down)

A panel that slides down below the topbar when the "Filters" button is clicked. Contains filter chip groups.

### 5.1 Layout

Horizontal flex-wrap layout with labeled groups. Each group has:
- A tiny uppercase label (e.g., "STAGES", "TOPICS", "LANGUAGE")
- A row of filter chips (pill buttons)

**Mobile:** Single-column layout (`flex-direction: column`).

### 5.2 Stage Chips

13 chips, one per stage. Each chip has a colored dot matching the stage color. Active chips get colored border/text using `--chip-color` CSS variable.

### 5.3 Topic Chips

8 chips, one per topic tag. Active chips get cyan border/text.

### 5.4 Language Chips

3 chips with flag emojis. Active chips get cyan border/text.

### 5.5 Chip Behavior

- Clicking a chip toggles it on/off (multi-select within each group)
- Toggling immediately re-filters and re-renders
- The filter dot on the "Filters" button updates accordingly

### 5.6 Restore All Button

Inside the filter panel. Only visible when "show hidden" is active AND there are hidden sessions. Clicking clears all hidden sessions, all hidden stages, and turns off "show hidden" mode. Styled with red color to match the "hidden" theme.

---

## 6. Views

### 6.1 List View

Sessions are grouped by **day > time slot**. Each time slot gets a heading (e.g., "09:30-10:00") in cyan. Day boundaries get a "March N" gold heading.

Each session renders as a **card** with:
- Left colored border (stage color, 4px)
- Stage badge (pill with stage color background at 15% opacity)
- Title (bold, white)
- Speaker line: `"Company – Speaker1, Speaker2"` (gray)
- Description (truncated to 2 lines via `-webkit-line-clamp`)
- Tags (small gray pills) and language badge (colored by language)
- **Card action buttons** (top-right, hidden by default, revealed on hover):
  - Star button (SVG star icon) — gold on hover/active
  - Hide button (SVG eye/eye-slash icon) — red on hover/active
- Entire card is clickable (opens modal)
- **Hover effect:** Cards lift up 2px with a shadow on hover

**Desktop (>= 768px):** Cards display in a responsive grid: `repeat(auto-fill, minmax(340px, 1fr))`.

**Mobile:** Single column.

**Hidden sessions** (when "show hidden" is active): Faded (opacity 0.3), dashed border, title has strikethrough.

**Starred sessions:** Gold left border (4px), gold box shadow, slightly brighter background. Card action buttons always visible.

**Empty state:** If no sessions match filters, shows centered gray text: "No sessions match your filters."

### 6.2 Calendar View (Vertical Grid)

A time-based vertical grid with stages as columns. One grid per day visible.

**Layout:**
- Time column on the left (50px wide, sticky)
- One column per visible stage (140px wide each)
- Sticky header row with stage names (colored, clickable to hide)
- 30-minute grid lines (horizontal, thin dark lines)
- Vertical separator lines between stage columns
- Pixel-per-minute: 3px (so a 30-min session = 90px tall)

**Time range:** Derived from the earliest session start and latest session end of the filtered sessions, rounded to 30-minute boundaries.

**Only stages with matching sessions are shown as columns.** If a filter hides all sessions for a stage, the column disappears.

**Event blocks:**
- Positioned absolutely by start time (top) and stage column (left)
- Height proportional to duration
- Background: stage color at 15% opacity
- Left border: 3px solid stage color
- Shows title (bold) and company name
- Tooltip on hover: `"HH:MM-HH:MM | Stage\nTitle"`
- Clicking opens the modal
- Hidden sessions: faded, dashed
- Starred sessions: gold outline, brightness boost

**Stage header interactions:**
- Click a stage header to hide that stage column
- Tooltip: "Click to hide"
- Hidden stages shown in a restore bar below the header (only when "show hidden" is active), with clickable chips to restore

**Star dimming (Calendar/Timeline):** When the star filter is active, non-starred events get `opacity: 0.15` and `grayscale(0.5)`, with a hover state that raises to `0.4` opacity. Starred events retain full brightness with gold outline.

**Scrolling:**
- Container has `overflow: auto` with `max-height: 85dvh`
- Drag-to-scroll: mousedown + mousemove implements grab-to-scroll
- Stage header row is sticky
- Time labels are sticky

**Scroll-to-now:** On initial load and view switch, scrolls to the now-line position.

### 6.3 Timeline View (Horizontal Gantt)

A horizontal bar chart with stages as rows. One chart per day.

**Layout:**
- Stage labels column on the left (110px wide) with colored dots and border accents
- Horizontal time axis at top (30-minute intervals, sticky header, 34px tall)
- Each visible stage gets a row (44px tall)
- Alternating row backgrounds (subtle stripe at 2% white opacity)
- Pixel-per-minute: 5px (horizontal)
- Vertical 30-minute grid lines
- Horizontal separator lines between rows

**Stage row labels:**
- Left column with stage name + colored dot
- Right border colored to match stage
- Clickable to hide stage (tooltip: "Click to hide")

**Event blocks:**
- Positioned by start time (left) and stage row (top)
- Width proportional to duration (min 20px)
- Background: stage color at 20% opacity mixed with surface2
- Left border: 3px solid stage color
- Title text with 2-line clamp
- Hover: brightness(1.4) + scaleY(1.08) + z-index boost
- Clicking opens the modal

**Legend:**
- Below each day's chart
- Lists all visible stages with colored dots
- Each legend item is clickable (hides/shows that stage)
- Hidden stages (when "show hidden" active) appear faded with strikethrough

**Scrolling:**
- Horizontal scroll for the time axis
- Drag-to-scroll enabled

**Scroll-to-now:** On initial load, horizontal scroll snaps to the now-line minus 60px offset.

### 6.4 Now-Line & Past/Ongoing Logic

Only active during the actual event month (March 2026), using Barcelona timezone (`Europe/Madrid`).

**Now-line:**
- Calendar: red horizontal line across all stage columns
- Timeline: red vertical line across all stage rows
- Color: `#E74C3C` at 60% opacity, with small red dot

**Past events** (current time >= event end time): `opacity: 0.35`

**Ongoing events** (current time between start and midpoint): `opacity: 0.55`

The midpoint formula: `midM = (startMinutes + endMinutes) / 2`

---

## 7. Filtering Pipeline

Filters are applied in this order (in `applyFilters()`):

1. **Hidden filter**: If "show hidden" is OFF, skip hidden sessions
2. **Starred filter**: If "starred only" is ON AND view is List, skip non-starred sessions (Calendar/Timeline use dimming instead)
3. **Day filter**: Skip sessions not matching the selected day
4. **Language filter**: Skip sessions whose language isn't in the active set. Sessions with empty/missing language always pass through.
5. **Stage filter**: Skip sessions whose stage isn't in the active set
6. **Tag filter**: Skip sessions that have no tag matching the active set. Sessions with no tags always pass through.
7. **Search filter**: Skip sessions whose search index doesn't contain the search query

The search index is pre-built from: title, stage, description, language, all tags, speaker names, speaker roles, and company names extracted from roles.

**Stage-level hiding (Calendar/Timeline only):**
- `calHiddenStages` set controls which stages are hidden as columns/rows
- This is separate from the session-level filter and only affects Calendar and Timeline views
- Stages are auto-hidden when ALL their sessions in the current filtered set are individually hidden

---

## 8. Session Management

### 8.1 Hiding Sessions

**From the card (List view):** Each card has an eye-slash SVG icon button, revealed on hover. Click to hide.

**From the modal:** Bottom action bar has a labeled "Hide" pill button with eye-slash icon. Clicking hides the session, closes the modal, and shows a toast.

**Behavior:**
- Hidden sessions are stored by index in localStorage
- When "show hidden" is OFF: hidden sessions are completely excluded
- When "show hidden" is ON: hidden sessions appear faded (30% opacity), dashed borders, strikethrough titles
- Hidden badge shows count on the topbar icon button
- "Restore all" button appears in filter panel when in show-hidden mode

### 8.2 Starring Sessions

**From the card (List view):** Each card has a star SVG icon button, revealed on hover. Click to star (turns gold).

**From the modal:** Bottom action bar has a labeled "Star"/"Starred" pill button with star icon. Clicking toggles, closes modal, shows toast.

**Behavior:**
- Starred sessions stored by index in localStorage
- **List view:** Starred cards get gold border, gold glow, brighter background. Action buttons always visible.
- **Calendar/Timeline:** Starred events get gold outline + brightness boost
- Star badge shows count on topbar icon button
- Clicking star button activates filter (list: hard filter, cal/timeline: dim mode)

### 8.3 Stage Hiding (Calendar/Timeline only)

**In Calendar:** Click a stage column header to hide that stage.

**In Timeline:** Click a stage row label or legend item to hide it.

**Restore:**
- In Calendar: a "Hidden:" bar appears below the header (only when "show hidden" is active) with clickable chips
- In Timeline: hidden stages appear in the legend as faded/strikethrough items, clickable to restore
- "Restore all" button also clears all hidden stages

**Auto-hide:** If all sessions in a stage are individually hidden (and "show hidden" is OFF), that stage's column/row is automatically hidden.

---

## 9. Modal (Session Detail Popup)

Triggered by clicking any session card/event block in any view.

**Content:**
- Stage badge (colored pill)
- Title (bold, white, large)
- Time and day: `"09:30-10:00 • March 3"` (cyan)
- Speakers section: each speaker's name (bold white) and role (gray, prefixed with "–")
- Description (full text, gray)
- Meta tags: topic tags and language badge as pills

**Action bar (bottom):**
- Star button — labeled pill ("Star"/"Starred") with star SVG, gold when active
- Hide button — labeled pill ("Hide"/"Restore") with eye SVG, red when active
- Separated from content by a top border

**Close button:** × in the top-right corner.

**Behavior:**
- Backdrop: semi-transparent black overlay (65% opacity)
- Click backdrop (outside modal) to close
- Press Escape to close
- Mobile: modal slides up from bottom (full width, rounded top corners, max-height 85dvh)
- Desktop: modal is centered, max-width 560px, fully rounded corners, max-height 80vh

---

## 10. Toast Notifications

A small notification bar at bottom center.

- Used for: "Session hidden", "Session restored", "Session starred", "Session unstarred"
- Fades in, stays for 2 seconds, fades out
- Non-interactive (pointer-events: none)

---

## 11. Auto-Refresh

- **Interval:** Every 5 minutes, re-renders (updates now-line and past/ongoing states). Does NOT auto-scroll.
- **Visibility change:** When the page regains focus, re-renders immediately.

---

## 12. Scroll Position Preservation

When the view re-renders (e.g., after toggling a session's hidden/starred state), scroll positions of Calendar and Timeline wrappers are saved before innerHTML replacement and restored after, UNLESS `scrollToNow` is true.

---

## 13. Default View Selection

On first load:
- **Day:** March 4 if the current date is March 4 in Barcelona timezone, otherwise March 3
- **View:** Calendar if viewport >= 768px, List if mobile
- URL hash overrides these defaults if present

---

## 14. Navigation & Pages

### 14.1 Main Page (`index.html`)
The SPA with all schedule functionality.

### 14.2 Help Page (`help.html`)
Standalone page with self-contained CSS. Documents hiding, starring, showing hidden, and restoring.

### 14.3 About Page (`about.html`)
Standalone page with self-contained CSS. Contains project description, feature list, build info, and GitHub link.

### 14.4 Footer
Links to: Export calendar (.ics), Help page, About page.

---

## 15. Calendar Export (ICS)

A pre-generated `.ics` file containing all sessions. Linked in the footer with the `download` attribute.

---

## 16. Error Handling

- **Fetch failure:** Shows centered error message
- **localStorage parse errors:** `safeGetJSON()` returns empty array. Also validates the parsed result is an array (handles `null`, numbers, etc.)
- **Invalid time ranges:** Defaults to start + 30 minutes

---

## 17. Visual Design

### 17.1 Theme

Dark theme only. Key CSS custom properties:

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0a` | Page background |
| `--surface` | `#141414` | Card/wrapper backgrounds |
| `--surface2` | `#1e1e1e` | Buttons, inputs, modal background |
| `--surface3` | `#282828` | Hover states, meta pills |
| `--text` | `#e0e0e0` | Primary text |
| `--text2` | `#aaa` | Secondary text |
| `--text3` | `#777` | Tertiary text |
| `--accent` | `#FFD700` | Gold — active states, star highlight |
| `--accent2` | `#00D4FF` | Cyan — day indicator, time headings, filter active |
| `--radius` | `10px` | Card/modal/wrapper border radius |
| `--radius-sm` | `6px` | Button/input border radius |

### 17.2 Scrollbar Styling

Custom scrollbar: 8px wide, dark track (#1a1a1a), gray thumb (#444), lighter on hover (#555).

### 17.3 Semi-Transparent Colors

Uses CSS `color-mix(in srgb, ...)` for stage badges, event backgrounds, active button states, and filter chips.

### 17.4 Typography

System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Base: 16px.

### 17.5 Language Colors

| Language | Background | Text Color |
|---|---|---|
| English | `#1a3a2a` | `#4CAF50` (green) |
| Spanish | `#3a2a1a` | `#FF9800` (orange) |
| Catalan | `#1a2a3a` | `#2196F3` (blue) |

---

## 18. Responsive Breakpoints

| Breakpoint | Layout Changes |
|---|---|
| < 768px | Single-column cards, topbar wraps, view icons only (no labels), search full width, filter panel single column, modal from bottom |
| >= 768px | Multi-column card grid (min 340px), centered modal (max 560px), search expands on focus |

---

## 19. Performance Notes

- Full innerHTML re-render on every filter change
- Search index pre-built once at startup
- Drag-to-scroll listeners re-attached after each render
- Auto-refresh every 5 minutes without scroll-to-now

---

## 20. HTML Escaping

All user-visible data passes through `esc()` which escapes HTML entities via `textContent`/`innerHTML` round-trip, plus single-quote escaping.

---

## 21. Favicon

Inline SVG data URI with a calendar emoji.
