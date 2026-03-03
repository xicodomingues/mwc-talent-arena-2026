import { STAGE_COLORS, STAGE_ORDER, ALL_TAGS, ALL_LANGS, LANG_FLAGS } from './constants.js';
import { esc } from './utils.js';
import {
  SESSIONS, searchIndex, activeStages, activeTags, activeLangs,
  hiddenSessions, showHidden, highlightedSessions, showHighlightedOnly,
  calHiddenStages, saveCalHiddenStages, currentView, dayFilter,
  setFilteredIndices, setSearchQuery, refresh
} from './state.js';

// ── Unified chip builder ──
function buildChips(containerId, items, activeSet, toggleFnName, options = {}) {
  const el = document.getElementById(containerId);
  let html = "";
  for (const item of items) {
    const on = activeSet.has(item) ? " on" : "";
    const color = options.colorMap?.[item];
    const style = color ? ` style="--chip-color:${color}"` : "";
    const dot = color ? `<span class="chip-dot" style="background:${color}"></span>` : "";
    const prefix = options.prefixMap?.[item] ? options.prefixMap[item] + " " : "";
    html += `<button class="filter-chip${on}"${style} onclick="${toggleFnName}('${esc(item)}')">${dot}${prefix}${esc(item)}</button>`;
  }
  el.innerHTML = html;
}

export function buildStageChips() {
  buildChips("stageChips", STAGE_ORDER, activeStages, "toggleStage", { colorMap: STAGE_COLORS });
}

export function buildTagChips() {
  buildChips("tagChips", ALL_TAGS, activeTags, "toggleTag");
}

export function buildLangChips() {
  buildChips("langChips", ALL_LANGS, activeLangs, "toggleLang", { prefixMap: LANG_FLAGS });
}

// ── Filter toggles ──
function toggle(set, item, buildFn) {
  if (set.has(item)) set.delete(item); else set.add(item);
  buildFn();
  updateFilterDot();
  refresh();
}

export function toggleStage(st) { toggle(activeStages, st, buildStageChips); }
export function toggleTag(tag) { toggle(activeTags, tag, buildTagChips); }
export function toggleLang(lang) { toggle(activeLangs, lang, buildLangChips); }

// ── Calendar/timeline stage toggle ──
export function toggleCalStage(stage) {
  if (calHiddenStages.has(stage)) calHiddenStages.delete(stage); else calHiddenStages.add(stage);
  saveCalHiddenStages();
  if (calHiddenStages.has(stage) && activeStages.has(stage)) {
    activeStages.delete(stage);
    buildStageChips();
    updateFilterDot();
  } else if (!calHiddenStages.has(stage) && !activeStages.has(stage)) {
    activeStages.add(stage);
    buildStageChips();
    updateFilterDot();
  }
  refresh();
}

// ── Filter panel ──
export function toggleFilterPanel() {
  const panel = document.getElementById("filterPanel");
  const btn = document.getElementById("filterToggleBtn");
  panel.classList.toggle("open");
  btn.classList.toggle("active", panel.classList.contains("open"));
}

export function updateFilterDot() {
  const dot = document.getElementById("filterDot");
  const hasActiveFilters =
    activeStages.size < STAGE_ORDER.length ||
    activeTags.size < ALL_TAGS.length ||
    activeLangs.size < ALL_LANGS.length;
  dot.classList.toggle("on", hasActiveFilters);
}

// ── Search ──
export function clearSearch() {
  const box = document.getElementById("searchBox");
  box.value = "";
  box.focus();
  refresh();
}

// ── Apply filters (computes filteredIndices, does NOT render) ──
export function applyFilters() {
  const searchQuery = document.getElementById("searchBox").value.toLowerCase().trim();
  setSearchQuery(searchQuery);

  const indices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i];
    if (!showHidden && hiddenSessions.has(i)) continue;
    if (showHighlightedOnly && currentView === "list" && !highlightedSessions.has(i)) continue;
    if (dayFilter && String(s.day) !== dayFilter) continue;
    if (activeLangs.size < ALL_LANGS.length && s.lang && !activeLangs.has(s.lang)) continue;
    if (activeStages.size < STAGE_ORDER.length && !activeStages.has(s.stage) && !(showHidden && calHiddenStages.has(s.stage))) continue;
    if (activeTags.size < ALL_TAGS.length) {
      const sTags = s.tags || [];
      if (sTags.length && !sTags.some(t => activeTags.has(t))) continue;
    }
    if (searchQuery && !searchIndex[i].includes(searchQuery)) continue;
    indices.push(i);
  }

  setFilteredIndices(indices);
}
