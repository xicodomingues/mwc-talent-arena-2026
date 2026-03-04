import {
  currentView, scrollToNow, setCurrentView, setScrollToNow,
  setSessions, buildSearchIndex, setRefreshFn, updateHash,
  updateDayIndicator, updateHiddenCount, updateHighlightedCount,
  switchDay, selectDay, toggleShowHidden, toggleShowHighlightedOnly, restoreAll,
  toggleHide, toggleHighlight, calHiddenStages, activeStages, showHidden,
  SESSIONS, filteredIndices, hiddenSessions, highlightedSessions,
  dayFilter, searchQuery, showHighlightedOnly, activeLangs, activeTags,
  activeThemes, activeAccess, activeInterests,
  setDayFilter, setShowHidden, saveHidden, saveHighlighted, saveCalHiddenStages,
  searchIndex, isStageFullyHidden, setSearchQuery,
  section, setSection, sectionStageOrder, sectionDays,
  loadHidden, loadHighlighted, loadCalHiddenStages, migrateLocalStorage
} from './js/state.js';
import {
  applyFilters, buildStageChips, buildTagChips, buildLangChips,
  buildThemeChips, buildAccessChips, buildInterestChips,
  updateFilterDot, toggleFilterPanel, toggleStage, toggleTag, toggleLang,
  toggleTheme, toggleAccess, toggleInterest,
  toggleCalStage, clearSearch, rebuildAllChips
} from './js/filters.js';
import { renderList } from './js/list-view.js';
import { renderCalendar, renderTimeline } from './js/grid-views.js';
import { showModal, closeModal, initModalListeners } from './js/modal.js';
import { initDragScroll, scrollToNowSlot, parseTime, esc, nowInBarcelona } from './js/utils.js';
import {
  STAGE_ORDER, ALL_TAGS, ALL_LANGS, SCROLL_NOW_PAD_TOP, SCROLL_NOW_PAD_LEFT,
  MWC_STAGE_ORDER, ALL_MWC_THEMES, ALL_MWC_ACCESS, ALL_MWC_INTERESTS
} from './js/constants.js';
import { showExportPrompt, exportDay } from './js/ics-export.js';

// ── Cached datasets ──
let _taSessions = [];
let _mwcSessions = [];

// ── Scroll position helpers ──
function saveScrollPositions(selector) {
  return Array.from(document.querySelectorAll(selector)).map(w => ({ scrollLeft: w.scrollLeft, scrollTop: w.scrollTop }));
}

function restoreScrollPositions(selector, saved) {
  document.querySelectorAll(selector).forEach((w, i) => {
    if (saved[i]) { w.scrollLeft = saved[i].scrollLeft; w.scrollTop = saved[i].scrollTop; }
  });
}

function scrollGridToNow() {
  if (currentView === "list") {
    scrollToNowSlot();
  } else if (currentView === "calendar") {
    const nowLine = document.querySelector(".cal-now-line");
    if (nowLine) {
      const wrapper = nowLine.closest(".cal-wrapper");
      if (wrapper) wrapper.scrollTop = Math.max(0, nowLine.offsetTop - SCROLL_NOW_PAD_TOP);
    }
  } else {
    const nowLine = document.querySelector(".tl-now-line");
    if (nowLine) {
      const wrapper = nowLine.closest(".tl-wrapper");
      const labelW = wrapper.querySelector('.tl-row-label')?.offsetWidth || 0;
      if (wrapper) wrapper.scrollLeft = Math.max(0, nowLine.offsetLeft - labelW - SCROLL_NOW_PAD_LEFT);
    }
  }
}

// ── Render dispatch ──
function render() {
  const savedCal = saveScrollPositions('.cal-wrapper');
  const savedTl = saveScrollPositions('.tl-wrapper');

  if (currentView === "list") renderList();
  else if (currentView === "calendar") renderCalendar();
  else renderTimeline();

  if (currentView !== "list") initDragScroll();

  if (scrollToNow) scrollGridToNow();
  else {
    restoreScrollPositions('.cal-wrapper', savedCal);
    restoreScrollPositions('.tl-wrapper', savedTl);
  }

  setScrollToNow(false);
}

// ── Refresh: filter + render ──
function filterAndRender() {
  applyFilters();
  render();
}
setRefreshFn(filterAndRender);

// ── View switching ──
function setView(v) {
  setCurrentView(v);
  setScrollToNow(true);
  document.querySelectorAll(".view-icons button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  updateHash(v);
  filterAndRender();
}

// ── Section switching ──
function switchSection(id) {
  if (id === section) return;
  setSection(id);

  // Swap data
  setSessions(id === "mwc" ? _mwcSessions : _taSessions);
  buildSearchIndex();

  // Reset day filter to section default
  const days = sectionDays();
  const _now = nowInBarcelona();
  if (_now.month === 3 && _now.year === 2026 && days.includes(_now.day)) {
    setDayFilter(String(_now.day));
  } else {
    setDayFilter(String(days[0]));
  }

  // Load section's persisted state
  loadHidden();
  loadHighlighted();
  loadCalHiddenStages();

  // Reset filter sets to all-active
  const stageOrder = sectionStageOrder();
  activeStages.clear();
  for (const st of stageOrder) activeStages.add(st);
  // Sync with calHiddenStages
  for (const st of calHiddenStages) activeStages.delete(st);

  if (id === "mwc") {
    activeThemes.clear(); for (const t of ALL_MWC_THEMES) activeThemes.add(t);
    activeAccess.clear(); for (const a of ALL_MWC_ACCESS) activeAccess.add(a);
    activeInterests.clear(); for (const i of ALL_MWC_INTERESTS) activeInterests.add(i);
  } else {
    activeTags.clear(); for (const t of ALL_TAGS) activeTags.add(t);
    activeLangs.clear(); for (const l of ALL_LANGS) activeLangs.add(l);
  }

  // Update UI
  document.getElementById("sectionTA").classList.toggle("active", id === "ta");
  document.getElementById("sectionMWC").classList.toggle("active", id === "mwc");
  document.getElementById("searchBox").value = "";
  setSearchQuery("");
  updateDayIndicator();
  rebuildAllChips();
  document.getElementById("showHiddenBtn").classList.toggle("active-hidden", showHidden);
  updateHiddenCount();
  updateHighlightedCount();
  setScrollToNow(true);
  updateHash(currentView);
  filterAndRender();
}

// ── Init ──
function init() {
  migrateLocalStorage();
  loadHidden();
  loadHighlighted();
  loadCalHiddenStages();

  // Reset filter sets to match current section
  const stageOrder = sectionStageOrder();
  activeStages.clear();
  for (const st of stageOrder) activeStages.add(st);
  for (const st of calHiddenStages) activeStages.delete(st);
  if (section === "mwc") {
    activeThemes.clear(); for (const t of ALL_MWC_THEMES) activeThemes.add(t);
    activeAccess.clear(); for (const a of ALL_MWC_ACCESS) activeAccess.add(a);
    activeInterests.clear(); for (const i of ALL_MWC_INTERESTS) activeInterests.add(i);
  } else {
    activeTags.clear(); for (const t of ALL_TAGS) activeTags.add(t);
    activeLangs.clear(); for (const l of ALL_LANGS) activeLangs.add(l);
  }

  // Validate dayFilter for current section's valid days
  const days = sectionDays();
  if (!days.includes(parseInt(dayFilter))) {
    const _now = nowInBarcelona();
    if (_now.month === 3 && _now.year === 2026 && days.includes(_now.day)) {
      setDayFilter(String(_now.day));
    } else {
      setDayFilter(String(days[0]));
    }
  }

  updateDayIndicator();
  rebuildAllChips();
  document.getElementById("showHiddenBtn").classList.toggle("active-hidden", showHidden);
  updateHiddenCount();
  updateHighlightedCount();
  initModalListeners();

  // Set section button state
  document.getElementById("sectionTA").classList.toggle("active", section === "ta");
  document.getElementById("sectionMWC").classList.toggle("active", section === "mwc");

  setView(currentView);
}

// ── Expose functions to window for onclick handlers ──
Object.assign(window, {
  switchDay, selectDay, setView, toggleShowHighlightedOnly, toggleShowHidden,
  toggleFilterPanel, clearSearch, closeModal, showModal,
  restoreAll() { restoreAll(); rebuildAllChips(); },
  toggleHighlight, toggleHide, toggleStage, toggleTag, toggleLang,
  toggleTheme, toggleAccess, toggleInterest,
  toggleCalStage, showExportPrompt, exportDay, applyFilters: filterAndRender,
  switchSection
});

// ── Test bridge: expose state for Playwright tests ──
Object.defineProperty(window, '__test', {
  get: () => ({
    SESSIONS, filteredIndices, hiddenSessions, highlightedSessions,
    calHiddenStages, activeStages, activeTags, activeLangs,
    activeThemes, activeAccess, activeInterests,
    get currentView() { return currentView; },
    get dayFilter() { return dayFilter; },
    get searchQuery() { return searchQuery; },
    get showHidden() { return showHidden; },
    get showHighlightedOnly() { return showHighlightedOnly; },
    get scrollToNow() { return scrollToNow; },
    get section() { return section; },
    searchIndex,
    selectDay, setDayFilter, setShowHidden, setCurrentView, setScrollToNow, setSearchQuery, setSection,
    saveHidden, saveHighlighted, saveCalHiddenStages,
    parseTime, esc, nowInBarcelona, isStageFullyHidden,
    STAGE_ORDER, ALL_TAGS, ALL_LANGS,
    MWC_STAGE_ORDER, ALL_MWC_THEMES, ALL_MWC_ACCESS, ALL_MWC_INTERESTS,
    buildStageChips, updateFilterDot, updateHiddenCount, updateHighlightedCount,
    switchSection,
    sectionStageOrder, sectionDays,
  })
});

// ── Start ──
const RE_RENDER_INTERVAL_MS = 5 * 60 * 1000;
Promise.all([
  fetch("sessions.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }),
  fetch("mwc_sessions.json").then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).catch(() => []),
])
  .then(([taData, mwcData]) => {
    _taSessions = taData;
    _mwcSessions = mwcData;
    setSessions(section === "mwc" ? mwcData : taData);
    buildSearchIndex();
    init();
    setInterval(() => render(), RE_RENDER_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) render();
    });
  })
  .catch(err => {
    console.error('Failed to load sessions:', err);
    document.getElementById("content").innerHTML =
      '<p style="text-align:center;padding:3rem;color:var(--text2)">Failed to load sessions. Please refresh the page.</p>';
  });
