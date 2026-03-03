import { STAGE_COLORS, LANG_FLAGS } from './constants.js';
import { esc } from './utils.js';
import { SESSIONS, hiddenSessions, highlightedSessions, toggleHide, toggleHighlight } from './state.js';

export function showModal(idx) {
  const s = SESSIONS[idx];
  const c = STAGE_COLORS[s.stage] || "#888";
  const mHighlighted = highlightedSessions.has(idx);
  const mHidden = hiddenSessions.has(idx);
  const starSvg = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.85 5L8 12.4l-4.45 2.3.85-5L.8 6.2l5-.7z"/></svg>';
  const hideSvg = mHidden
    ? '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/></svg>'
    : '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/><line x1="2" y1="14" x2="14" y2="2"/></svg>';

  let html = "";
  html += `<div class="modal-actions">`;
  html += `<button class="card-action act-star${mHighlighted ? " on" : ""}" id="modalStarBtn" title="${mHighlighted ? "Unstar" : "Star"}">${starSvg}</button>`;
  html += `<button class="card-action act-hide${mHidden ? " on" : ""}" id="modalHideBtn" title="${mHidden ? "Restore" : "Hide"}">${hideSvg}</button>`;
  html += `</div>`;
  html += `<div class="modal-stage" style="color:${c};background:color-mix(in srgb,${c} 15%,transparent)">${esc(s.stage)}</div>`;
  html += `<div class="modal-title">${esc(s.title)}</div>`;
  html += `<div class="modal-time">${esc(s.time)} \u2022 March ${s.day}</div>`;

  if (s.speakers.length) {
    html += '<div class="modal-speakers">';
    for (const sp of s.speakers) {
      html += `<div><span class="modal-speaker-name">${esc(sp.name)}</span>`;
      if (sp.role) html += ` <span class="modal-speaker-role">\u2013 ${esc(sp.role)}</span>`;
      html += `</div>`;
    }
    html += '</div>';
  }

  if (s.description) html += `<div class="modal-desc">${esc(s.description)}</div>`;

  html += '<div class="modal-meta">';
  for (const t of s.tags) html += `<span>${esc(t)}</span>`;
  if (s.lang) {
    const flag = LANG_FLAGS[s.lang] || "";
    html += `<span>${flag} ${esc(s.lang)}</span>`;
  }
  html += '</div>';

  document.getElementById("modalBody").innerHTML = html;

  document.getElementById("modalStarBtn").onclick = function() {
    const was = highlightedSessions.has(idx);
    toggleHighlight(idx);
    closeModal();
    showToast(was ? "Session unstarred" : "Session starred");
  };
  document.getElementById("modalHideBtn").onclick = function() {
    const was = hiddenSessions.has(idx);
    toggleHide(idx);
    closeModal();
    showToast(was ? "Session restored" : "Session hidden");
  };

  document.getElementById("modalBackdrop").classList.add("open");
}

export function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
}

export function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

export function initModalListeners() {
  document.getElementById("modalBackdrop").addEventListener("click", e => {
    if (e.target === document.getElementById("modalBackdrop")) closeModal();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
}
