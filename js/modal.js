import { STAGE_COLORS, LANG_FLAGS, MWC_STAGE_COLORS, STAR_SVG, EYE_SVG, EYE_OFF_SVG } from './constants.js';
import { esc } from './utils.js';
import { SESSIONS, hiddenSessions, highlightedSessions, toggleHide, toggleHighlight, section } from './state.js';

export function showModal(idx) {
  const s = SESSIONS[idx];
  if (!s) return;
  const colors = section === "mwc" ? MWC_STAGE_COLORS : STAGE_COLORS;
  const c = colors[s.stage] || "#888";
  const mHighlighted = highlightedSessions.has(idx);
  const mHidden = hiddenSessions.has(idx);

  let html = "";
  html += `<div class="modal-actions">`;
  html += `<button class="card-action act-star${mHighlighted ? " on" : ""}" id="modalStarBtn" title="${mHighlighted ? "Unstar" : "Star"}">${STAR_SVG}</button>`;
  html += `<button class="card-action act-hide${mHidden ? " on" : ""}" id="modalHideBtn" title="${mHidden ? "Restore" : "Hide"}">${mHidden ? EYE_SVG : EYE_OFF_SVG}</button>`;
  html += `</div>`;
  html += `<div class="modal-stage" style="color:${c};background:color-mix(in srgb,${c} 15%,transparent)">${esc(s.stage)}</div>`;
  html += `<div class="modal-title">${esc(s.title)}</div>`;
  html += `<div class="modal-time">${esc(s.time)} \u2022 March ${s.day}</div>`;

  if (section === "mwc") {
    if (s.hall) html += `<div class="modal-time">${esc(s.hall)}</div>`;
    if (s.company) html += `<div class="modal-speakers"><div>${esc(s.company)}</div></div>`;
    if (s.description) html += `<div class="modal-desc">${esc(s.description)}</div>`;

    html += '<div class="modal-meta">';
    if (s.theme) html += `<span>${esc(s.theme)}</span>`;
    if (s.access) html += `<span>${esc(s.access)}</span>`;
    html += '</div>';

    if (s.interests && s.interests.length) {
      html += '<div class="modal-meta">';
      for (const int of s.interests) html += `<span>${esc(int)}</span>`;
      html += '</div>';
    }

    if (s.url) {
      html += `<div style="margin-top:0.75rem"><a href="${esc(s.url)}" target="_blank" rel="noopener" class="modal-link-btn">View on MWC Barcelona \u2192</a></div>`;
    }
  } else {
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
  }

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
