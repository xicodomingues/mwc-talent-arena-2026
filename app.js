import {
  currentView, scrollToNow, setCurrentView, setScrollToNow,
  setSessions, buildSearchIndex, setRefreshFn, updateHash,
  updateDayIndicator, updateHiddenCount, updateHighlightedCount,
  switchDay, toggleShowHidden, toggleShowHighlightedOnly, restoreAll,
  toggleHide, toggleHighlight, calHiddenStages, activeStages, showHidden
} from './js/state.js';
import { applyFilters, buildStageChips, buildTagChips, buildLangChips, updateFilterDot, toggleFilterPanel, toggleStage, toggleTag, toggleLang, toggleCalStage, clearSearch } from './js/filters.js';
import { renderList } from './js/list-view.js';
import { renderCalendar, renderTimeline } from './js/grid-views.js';
import { showModal, closeModal, initModalListeners } from './js/modal.js';
import { initDragScroll, scrollToNowSlot } from './js/utils.js';

// ── Render dispatch (replaces monkey-patched render) ──
function render() {
  const savedCal = Array.from(document.querySelectorAll('.cal-wrapper')).map(w => ({ scrollLeft: w.scrollLeft, scrollTop: w.scrollTop }));
  const savedTl = Array.from(document.querySelectorAll('.tl-wrapper')).map(w => ({ scrollLeft: w.scrollLeft, scrollTop: w.scrollTop }));

  if (currentView === "list") renderList();
  else if (currentView === "calendar") renderCalendar();
  else renderTimeline();

  // Post-render: drag-scroll for grid views
  if (currentView !== "list") initDragScroll();

  // Scroll to now
  if (scrollToNow) {
    if (currentView === "list") {
      scrollToNowSlot();
    } else if (currentView === "calendar") {
      const nowLine = document.querySelector(".cal-now-line");
      if (nowLine) {
        const wrapper = nowLine.closest(".cal-wrapper");
        if (wrapper) wrapper.scrollTop = Math.max(0, nowLine.offsetTop - 45);
      }
    } else {
      const nowLine = document.querySelector(".tl-now-line");
      if (nowLine) {
        const wrapper = nowLine.closest(".tl-wrapper");
        if (wrapper) wrapper.scrollLeft = Math.max(0, nowLine.offsetLeft - 60);
      }
    }
  }

  // Restore scroll positions when not scrolling to now
  if (!scrollToNow) {
    document.querySelectorAll('.cal-wrapper').forEach((w, i) => {
      if (savedCal[i]) { w.scrollLeft = savedCal[i].scrollLeft; w.scrollTop = savedCal[i].scrollTop; }
    });
    document.querySelectorAll('.tl-wrapper').forEach((w, i) => {
      if (savedTl[i]) { w.scrollLeft = savedTl[i].scrollLeft; w.scrollTop = savedTl[i].scrollTop; }
    });
  }

  setScrollToNow(false);
}

// ── Refresh: filter + render (used by state/filter modules via callback) ──
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

// ── Init ──
function init() {
  for (const st of calHiddenStages) activeStages.delete(st);
  updateDayIndicator();
  buildStageChips();
  buildTagChips();
  buildLangChips();
  document.getElementById("showHiddenBtn").classList.toggle("active-hidden", showHidden);
  updateHiddenCount();
  updateHighlightedCount();
  updateFilterDot();
  initModalListeners();
  setView(currentView);
}

// ── Expose functions to window for onclick handlers ──
Object.assign(window, {
  switchDay, setView, toggleShowHighlightedOnly, toggleShowHidden,
  toggleFilterPanel, clearSearch, closeModal, showModal, restoreAll,
  toggleHighlight, toggleHide, toggleStage, toggleTag, toggleLang,
  toggleCalStage, applyFilters: filterAndRender
});

// ── Start ──
fetch("sessions.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => {
    setSessions(data);
    buildSearchIndex();
    init();
    setInterval(() => render(), 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) render();
    });
  })
  .catch(() => {
    document.getElementById("content").innerHTML =
      '<p style="text-align:center;padding:3rem;color:var(--text2)">Failed to load sessions. Please refresh the page.</p>';
  });
