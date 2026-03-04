import {
  STAGE_COLORS, STAGE_ORDER, ALL_TAGS, ALL_LANGS, LANG_FLAGS,
  MWC_STAGE_COLORS, MWC_STAGE_ORDER, ALL_MWC_THEMES, ALL_MWC_ACCESS, ALL_MWC_INTERESTS
} from './constants.js';
import { esc } from './utils.js';
import {
  SESSIONS, searchIndex, activeStages, activeTags, activeLangs,
  activeThemes, activeAccess, activeInterests,
  hiddenSessions, showHidden, highlightedSessions, showHighlightedOnly,
  calHiddenStages, saveCalHiddenStages, currentView, dayFilter,
  setFilteredIndices, setSearchQuery, refresh, section, sectionStageOrder,
  updateHiddenCount
} from './state.js';

// ── Unified chip builder ──
function buildChips(containerId, items, activeSet, toggleFnName, options = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  let html = "";
  for (const item of items) {
    const on = activeSet.has(item) ? " on" : "";
    const color = options.colorMap?.[item];
    const style = color ? ` style="--chip-color:${color}"` : "";
    const dot = color ? `<span class="chip-dot" style="background:${color}"></span>` : "";
    const prefix = options.prefixMap?.[item] ? options.prefixMap[item] + " " : "";
    html += `<button class="filter-chip${on}" aria-pressed="${activeSet.has(item)}"${style} onclick="${toggleFnName}('${esc(item)}')">${dot}${prefix}${esc(item)}</button>`;
  }
  el.innerHTML = html;
}

export function buildStageChips() {
  const colors = section === "mwc" ? MWC_STAGE_COLORS : STAGE_COLORS;
  const order = sectionStageOrder();
  buildChips("stageChips", order, activeStages, "toggleStage", { colorMap: colors });
}

export function buildTagChips() {
  buildChips("tagChips", ALL_TAGS, activeTags, "toggleTag");
}

export function buildLangChips() {
  buildChips("langChips", ALL_LANGS, activeLangs, "toggleLang", { prefixMap: LANG_FLAGS });
}

export function buildThemeChips() {
  buildChips("themeChips", ALL_MWC_THEMES, activeThemes, "toggleTheme");
}

export function buildAccessChips() {
  buildChips("accessChips", ALL_MWC_ACCESS, activeAccess, "toggleAccess");
}

export function buildInterestChips() {
  buildChips("interestChips", ALL_MWC_INTERESTS, activeInterests, "toggleInterest");
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
export function toggleTheme(th) { toggle(activeThemes, th, buildThemeChips); }
export function toggleAccess(ac) { toggle(activeAccess, ac, buildAccessChips); }
export function toggleInterest(int) { toggle(activeInterests, int, buildInterestChips); }

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
  updateHiddenCount();
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
  const stageOrder = sectionStageOrder();
  let hasActiveFilters = activeStages.size < stageOrder.length;
  if (section === "ta") {
    hasActiveFilters = hasActiveFilters ||
      activeTags.size < ALL_TAGS.length ||
      activeLangs.size < ALL_LANGS.length;
  } else {
    hasActiveFilters = hasActiveFilters ||
      activeThemes.size < ALL_MWC_THEMES.length ||
      activeAccess.size < ALL_MWC_ACCESS.length ||
      activeInterests.size < ALL_MWC_INTERESTS.length;
  }
  dot.classList.toggle("on", hasActiveFilters);
}

// ── Search ──
export function clearSearch() {
  const box = document.getElementById("searchBox");
  box.value = "";
  box.focus();
  refresh();
}

// ── Rebuild all chips on section switch ──
export function rebuildAllChips() {
  const isMwc = section === "mwc";
  document.getElementById("tagFilterGroup").style.display = isMwc ? "none" : "";
  document.getElementById("langFilterGroup").style.display = isMwc ? "none" : "";
  document.getElementById("themeFilterGroup").style.display = isMwc ? "" : "none";
  document.getElementById("accessFilterGroup").style.display = isMwc ? "" : "none";
  document.getElementById("interestFilterGroup").style.display = isMwc ? "" : "none";

  buildStageChips();
  if (isMwc) {
    buildThemeChips();
    buildAccessChips();
    buildInterestChips();
  } else {
    buildTagChips();
    buildLangChips();
  }
  updateFilterDot();
}

// ── Shared filter logic (used by applyFilters and ICS export) ──
export function filterSessions(forDay) {
  const q = forDay !== undefined ? (document.getElementById("searchBox")?.value?.toLowerCase().trim() || "") : document.getElementById("searchBox").value.toLowerCase().trim();
  const stageOrder = sectionStageOrder();
  const indices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i];
    if (!showHidden && hiddenSessions.has(i)) continue;
    if (showHighlightedOnly && currentView === "list" && !highlightedSessions.has(i)) continue;
    if (forDay !== undefined) {
      if (forDay && s.day !== forDay) continue;
    } else {
      if (dayFilter && String(s.day) !== dayFilter) continue;
    }

    // Stage filter
    if (activeStages.size < stageOrder.length && !activeStages.has(s.stage) && !(showHidden && calHiddenStages.has(s.stage))) continue;

    if (section === "ta") {
      if (activeLangs.size < ALL_LANGS.length && s.lang && !activeLangs.has(s.lang)) continue;
      if (activeTags.size < ALL_TAGS.length) {
        const sTags = s.tags || [];
        if (sTags.length && !sTags.some(t => activeTags.has(t))) continue;
      }
    } else {
      if (activeThemes.size < ALL_MWC_THEMES.length && s.theme && !activeThemes.has(s.theme)) continue;
      if (activeAccess.size < ALL_MWC_ACCESS.length && s.access && !activeAccess.has(s.access)) continue;
      if (activeInterests.size < ALL_MWC_INTERESTS.length) {
        const sInt = s.interests || [];
        if (sInt.length && !sInt.some(int => activeInterests.has(int))) continue;
      }
    }

    if (q && !searchIndex[i].includes(q)) continue;
    indices.push(i);
  }
  return indices;
}

// ── Apply filters (computes filteredIndices, does NOT render) ──
export function applyFilters() {
  setSearchQuery(document.getElementById("searchBox").value.toLowerCase().trim());
  setFilteredIndices(filterSessions());
}
