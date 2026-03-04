import { STAGE_ORDER, ALL_TAGS, ALL_LANGS } from './constants.js';
import { nowInBarcelona } from './utils.js';

// ── Refresh callback (set by app.js to avoid circular deps) ──
let _refreshFn = () => {};
export function setRefreshFn(fn) { _refreshFn = fn; }
export function refresh() { _refreshFn(); }

// ── Data ──
export let SESSIONS = [];
export let searchIndex = [];

export function setSessions(data) { SESSIONS = data; }

export function buildSearchIndex() {
  searchIndex = SESSIONS.map(s => {
    const parts = [s.title, s.stage, s.description, s.lang, ...s.tags];
    for (const sp of s.speakers) {
      parts.push(sp.name);
      if (sp.role) {
        parts.push(sp.role);
        const m = sp.role.match(/(?:at|en)\s+(.+)$/i);
        if (m) parts.push(m[1]);
      }
    }
    return parts.join(" ").toLowerCase();
  });
}

// ── Hash-based state ──
function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  return { day: params.get("day"), view: params.get("view") };
}

export function updateHash(view) {
  const params = new URLSearchParams();
  params.set("view", view);
  history.replaceState(null, "", "#" + params.toString());
}

const _hash = parseHash();
const _now = nowInBarcelona();

export let currentView = _hash.view || (window.innerWidth >= 768 ? "timeline" : "list");
export let dayFilter = (_now.month === 3 && _now.year === 2026 && _now.day >= 4) ? "4" : "3";
export let searchQuery = "";
export let scrollToNow = true;

export function setCurrentView(v) { currentView = v; }
export function setDayFilter(d) { dayFilter = d; }
export function setSearchQuery(q) { searchQuery = q; }
export function setScrollToNow(v) { scrollToNow = v; }

// ── Filter sets ──
export const activeLangs = new Set(ALL_LANGS);
export const activeStages = new Set(STAGE_ORDER);
export const activeTags = new Set(ALL_TAGS);
export let filteredIndices = [];
export function setFilteredIndices(arr) { filteredIndices = arr; }

// ── Hidden sessions (persisted) ──
const LS_KEY = "mwc_hidden_sessions";
function safeGetJSON(key) { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }

export const hiddenSessions = new Set(safeGetJSON(LS_KEY));
export let showHidden = localStorage.getItem("showHidden") === "true";
export function setShowHidden(v) { showHidden = v; }

export function saveHidden() {
  localStorage.setItem(LS_KEY, JSON.stringify([...hiddenSessions]));
  updateHiddenCount();
}

export function toggleHide(idx, evt) {
  if (evt) evt.stopPropagation();
  if (hiddenSessions.has(idx)) hiddenSessions.delete(idx); else hiddenSessions.add(idx);
  saveHidden();
  refresh();
}

// ── Highlighted sessions (persisted) ──
const LS_HIGHLIGHT_KEY = "mwc_highlighted_sessions";
export const highlightedSessions = new Set(safeGetJSON(LS_HIGHLIGHT_KEY));
export let showHighlightedOnly = false;
export function setShowHighlightedOnly(v) { showHighlightedOnly = v; }

export function saveHighlighted() {
  localStorage.setItem(LS_HIGHLIGHT_KEY, JSON.stringify([...highlightedSessions]));
  updateHighlightedCount();
}

export function toggleHighlight(idx, evt) {
  if (evt) evt.stopPropagation();
  if (highlightedSessions.has(idx)) highlightedSessions.delete(idx); else highlightedSessions.add(idx);
  saveHighlighted();
  refresh();
}

export function toggleShowHighlightedOnly() {
  showHighlightedOnly = !showHighlightedOnly;
  document.getElementById("showHighlightedBtn").classList.toggle("active-star", showHighlightedOnly);
  refresh();
}

export function updateHighlightedCount() {
  const badge = document.getElementById("starBadge");
  const day = parseInt(dayFilter);
  let n = 0;
  for (const i of highlightedSessions) {
    if (SESSIONS[i] && SESSIONS[i].day === day) n++;
  }
  badge.textContent = n;
}

// ── Calendar stage visibility (persisted) ──
const LS_CAL_STAGES_KEY = "mwc_cal_hidden_stages";
export const calHiddenStages = new Set(safeGetJSON(LS_CAL_STAGES_KEY));

export function saveCalHiddenStages() {
  localStorage.setItem(LS_CAL_STAGES_KEY, JSON.stringify([...calHiddenStages]));
}

export function isStageFullyHidden(stage, indices) {
  if (showHidden) return false;
  const stageIndices = indices.filter(i => SESSIONS[i].stage === stage);
  return stageIndices.length > 0 && stageIndices.every(i => hiddenSessions.has(i));
}

// ── Show hidden toggle ──
export function toggleShowHidden() {
  showHidden = !showHidden;
  localStorage.setItem("showHidden", showHidden);
  document.getElementById("showHiddenBtn").classList.toggle("active-hidden", showHidden);
  updateHiddenCount();
  refresh();
}

// ── Restore all ──
export function restoreAll() {
  hiddenSessions.clear();
  localStorage.setItem(LS_KEY, "[]");
  calHiddenStages.clear();
  localStorage.setItem(LS_CAL_STAGES_KEY, "[]");
  showHidden = false;
  localStorage.setItem("showHidden", "false");
  document.getElementById("showHiddenBtn").classList.remove("active-hidden");
  updateHiddenCount();
  refresh();
}

export function updateHiddenCount() {
  const badge = document.getElementById("hiddenBadge");
  const day = parseInt(dayFilter);
  let count = 0;
  for (let i = 0; i < SESSIONS.length; i++) {
    if (SESSIONS[i].day !== day) continue;
    if (hiddenSessions.has(i) || calHiddenStages.has(SESSIONS[i].stage)) count++;
  }
  badge.textContent = count;
  document.getElementById("restoreAllBtn").style.display = (count && showHidden) ? "" : "none";
}

// ── Day switching ──
export function switchDay() {
  dayFilter = dayFilter === "3" ? "4" : "3";
  scrollToNow = true;
  updateDayIndicator();
  updateHash(currentView);
  updateHiddenCount();
  updateHighlightedCount();
  refresh();
}

export function updateDayIndicator() {
  document.getElementById("dayIndicatorText").textContent = "Mar " + dayFilter;
}
