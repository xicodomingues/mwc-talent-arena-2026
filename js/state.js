import {
  STAGE_ORDER, ALL_TAGS, ALL_LANGS,
  MWC_STAGE_ORDER, ALL_MWC_THEMES, ALL_MWC_ACCESS, ALL_MWC_INTERESTS
} from './constants.js';
import { nowInBarcelona } from './utils.js';

// ── Refresh callback (set by app.js to avoid circular deps) ──
let _refreshFn = () => {};
export function setRefreshFn(fn) { _refreshFn = fn; }
export function refresh() { _refreshFn(); }

// ── Section ──
export let section = "ta"; // "ta" | "mwc"
export function setSection(s) { section = s; }

// ── Data ──
export let SESSIONS = [];
export let searchIndex = [];

export function setSessions(data) { SESSIONS = data; }

export function buildSearchIndex() {
  searchIndex = SESSIONS.map(s => {
    const parts = [s.title, s.stage, s.description, s.lang, ...s.tags];
    if (section === "mwc") {
      if (s.theme) parts.push(s.theme);
      if (s.access) parts.push(s.access);
      if (s.interests) parts.push(...s.interests);
      if (s.hall) parts.push(s.hall);
      if (s.track) parts.push(s.track);
    }
    for (const sp of (s.speakers || [])) {
      parts.push(sp.name);
      if (sp.role) {
        parts.push(sp.role);
        const m = sp.role.match(/(?:at|en)\s+(.+)$/i);
        if (m) parts.push(m[1]);
      }
    }
    if (s.company) parts.push(s.company);
    return parts.join(" ").toLowerCase();
  });
}

// ── Hash-based state ──
function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  return { day: params.get("day"), view: params.get("view"), section: params.get("section") };
}

export function updateHash(view) {
  const params = new URLSearchParams();
  params.set("view", view);
  if (section !== "ta") params.set("section", section);
  history.replaceState(null, "", "#" + params.toString());
}

const _hash = parseHash();
const _now = nowInBarcelona();

export let currentView = _hash.view || (window.innerWidth >= 768 ? "timeline" : "list");
export let dayFilter = (_now.month === 3 && _now.year === 2026 && _now.day >= 4) ? "4" : "3";
export let searchQuery = "";
export let scrollToNow = true;

// Init section from hash
if (_hash.section === "mwc") section = "mwc";

export function setCurrentView(v) { currentView = v; }
export function setDayFilter(d) { dayFilter = d; }
export function setSearchQuery(q) { searchQuery = q; }
export function setScrollToNow(v) { scrollToNow = v; }

// ── Section-aware helpers ──
export function sectionStageOrder() { return section === "mwc" ? MWC_STAGE_ORDER : STAGE_ORDER; }
export function sectionDays() { return section === "mwc" ? [4, 5] : [3, 4]; }

// ── Filter sets ──
export const activeLangs = new Set(ALL_LANGS);
export const activeStages = new Set(STAGE_ORDER);
export const activeTags = new Set(ALL_TAGS);
export const activeThemes = new Set(ALL_MWC_THEMES);
export const activeAccess = new Set(ALL_MWC_ACCESS);
export const activeInterests = new Set(ALL_MWC_INTERESTS);
export let filteredIndices = [];
export function setFilteredIndices(arr) { filteredIndices = arr; }

// ── Section-scoped localStorage keys ──
function lsKey(purpose) {
  const prefix = section === "mwc" ? "mwc" : "ta";
  return `${prefix}_${purpose}`;
}

// ── Helpers ──
function safeGetJSON(key) { try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }

function toggleSetItem(set, item) {
  if (set.has(item)) set.delete(item); else set.add(item);
}

export function countForDay(set, day) {
  const d = parseInt(day);
  let n = 0;
  for (const i of set) {
    if (SESSIONS[i] && SESSIONS[i].day === d) n++;
  }
  return n;
}

export function countHiddenForDay(day) {
  const d = parseInt(day);
  let count = 0;
  for (let i = 0; i < SESSIONS.length; i++) {
    if (SESSIONS[i].day !== d) continue;
    if (hiddenSessions.has(i) || calHiddenStages.has(SESSIONS[i].stage)) count++;
  }
  return count;
}

// ── Hidden sessions (persisted per section) ──
export const hiddenSessions = new Set();
export let showHidden = localStorage.getItem("showHidden") === "true";
export function setShowHidden(v) { showHidden = v; }

export function loadHidden() {
  hiddenSessions.clear();
  for (const v of safeGetJSON(lsKey("hidden"))) hiddenSessions.add(v);
}

export function saveHidden() {
  localStorage.setItem(lsKey("hidden"), JSON.stringify([...hiddenSessions]));
  updateHiddenCount();
}

export function toggleHide(idx, evt) {
  if (evt) evt.stopPropagation();
  toggleSetItem(hiddenSessions, idx);
  saveHidden();
  refresh();
}

// ── Highlighted sessions (persisted per section) ──
export const highlightedSessions = new Set();
export let showHighlightedOnly = false;
export function setShowHighlightedOnly(v) { showHighlightedOnly = v; }

export function loadHighlighted() {
  highlightedSessions.clear();
  for (const v of safeGetJSON(lsKey("highlighted"))) highlightedSessions.add(v);
}

export function saveHighlighted() {
  localStorage.setItem(lsKey("highlighted"), JSON.stringify([...highlightedSessions]));
  updateHighlightedCount();
}

export function toggleHighlight(idx, evt) {
  if (evt) evt.stopPropagation();
  toggleSetItem(highlightedSessions, idx);
  saveHighlighted();
  refresh();
}

export function toggleShowHighlightedOnly() {
  showHighlightedOnly = !showHighlightedOnly;
  document.getElementById("showHighlightedBtn").classList.toggle("active-star", showHighlightedOnly);
  refresh();
}

// ── Calendar stage visibility (persisted per section) ──
export const calHiddenStages = new Set();

export function loadCalHiddenStages() {
  calHiddenStages.clear();
  for (const v of safeGetJSON(lsKey("cal_stages"))) calHiddenStages.add(v);
}

export function saveCalHiddenStages() {
  localStorage.setItem(lsKey("cal_stages"), JSON.stringify([...calHiddenStages]));
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
  localStorage.setItem(lsKey("hidden"), "[]");
  calHiddenStages.clear();
  localStorage.setItem(lsKey("cal_stages"), "[]");
  showHidden = false;
  localStorage.setItem("showHidden", "false");
  document.getElementById("showHiddenBtn").classList.remove("active-hidden");

  // Reset all filter sets to defaults
  const stageOrder = sectionStageOrder();
  activeStages.clear();
  for (const s of stageOrder) activeStages.add(s);
  if (section === "mwc") {
    activeThemes.clear(); for (const t of ALL_MWC_THEMES) activeThemes.add(t);
    activeAccess.clear(); for (const a of ALL_MWC_ACCESS) activeAccess.add(a);
    activeInterests.clear(); for (const i of ALL_MWC_INTERESTS) activeInterests.add(i);
  } else {
    activeTags.clear(); for (const t of ALL_TAGS) activeTags.add(t);
    activeLangs.clear(); for (const l of ALL_LANGS) activeLangs.add(l);
  }

  updateHiddenCount();
  refresh();
}

// ── UI update helpers ──
export function updateHiddenCount() {
  const count = countHiddenForDay(dayFilter);
  document.getElementById("hiddenBadge").textContent = count;
  document.getElementById("restoreAllBtn").style.display = (count && showHidden) ? "" : "none";
  const topBtn = document.getElementById("restoreAllTopBtn");
  if (topBtn) topBtn.style.display = (count && showHidden) ? "" : "none";
}

export function updateHighlightedCount() {
  document.getElementById("starBadge").textContent = countForDay(highlightedSessions, dayFilter);
}

// ── Day switching ──
export function selectDay(val) {
  dayFilter = String(val);
  scrollToNow = true;
  updateDayIndicator();
  updateHash(currentView);
  updateHiddenCount();
  updateHighlightedCount();
  refresh();
}

export function switchDay() {
  const days = sectionDays();
  const idx = days.indexOf(parseInt(dayFilter));
  selectDay(days[(idx + 1) % days.length]);
}

export function updateDayIndicator() {
  const sel = document.getElementById("dayIndicator");
  const days = sectionDays();
  sel.innerHTML = days.map(d => `<option value="${d}"${String(d) === dayFilter ? ' selected' : ''}>Mar ${d}</option>`).join('');
  sel.value = dayFilter;
}

// ── Migration: copy old keys to new prefixed format ──
export function migrateLocalStorage() {
  const oldKeys = {
    "mwc_hidden_sessions": "ta_hidden",
    "mwc_highlighted_sessions": "ta_highlighted",
    "mwc_cal_hidden_stages": "ta_cal_stages",
  };
  for (const [oldKey, newKey] of Object.entries(oldKeys)) {
    if (localStorage.getItem(oldKey) !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
      localStorage.removeItem(oldKey);
    }
  }
}
