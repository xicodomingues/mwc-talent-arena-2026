import { STAGE_COLORS, LANG_FLAGS, LANG_CLASS } from './constants.js';
import { esc } from './utils.js';
import { SESSIONS, filteredIndices, hiddenSessions, highlightedSessions } from './state.js';

export function renderList() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  const grouped = {};
  for (const idx of filteredIndices) {
    const s = SESSIONS[idx];
    const key = s.day + "|" + s.time;
    if (!grouped[key]) grouped[key] = {day: s.day, time: s.time, items: []};
    grouped[key].items.push(idx);
  }

  const keys = Object.keys(grouped).sort();
  if (!keys.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }
  let html = "";
  let lastDay = null;
  for (const k of keys) {
    const g = grouped[k];
    if (g.day !== lastDay) {
      lastDay = g.day;
      html += `<h2 class="day-heading">March ${g.day}</h2>`;
    }
    html += `<div class="time-slot-heading">${esc(g.time)}</div>`;
    html += '<div class="list-cards">';
    for (const idx of g.items) html += cardHTML(idx);
    html += '</div>';
  }
  el.innerHTML = html;
}

function cardHTML(idx) {
  const s = SESSIONS[idx];
  const c = STAGE_COLORS[s.stage] || "#888";
  const spk = s.speakers.map(sp => sp.name).join(", ");
  const co = s.company || "";
  const isHidden = hiddenSessions.has(idx);
  const isHighlighted = highlightedSessions.has(idx);
  let html = `<div class="card${isHidden ? " hidden-session" : ""}${isHighlighted ? " highlighted-session" : ""}" style="--card-color:${c}" onclick="showModal(${idx})">`;
  html += `<div class="card-actions">`;
  html += `<button class="card-action act-star${isHighlighted ? " on" : ""}" onclick="toggleHighlight(${idx},event)" title="${isHighlighted ? "Unstar" : "Star"}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.85 5L8 12.4l-4.45 2.3.85-5L.8 6.2l5-.7z"/></svg></button>`;
  html += `<button class="card-action act-hide${isHidden ? " on" : ""}" onclick="toggleHide(${idx},event)" title="${isHidden ? "Restore" : "Hide"}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">${isHidden ? '<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/>' : '<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2.5"/><line x1="2" y1="14" x2="14" y2="2"/>'}</svg></button>`;
  html += `</div>`;
  html += `<span class="card-stage">${esc(s.stage)}</span>`;
  html += `<div class="card-title">${esc(s.title)}</div>`;
  const spkLine = [co, spk].filter(Boolean).join(" \u2013 ");
  if (spkLine) html += `<div class="card-speakers">${esc(spkLine)}</div>`;
  if (s.description) html += `<div class="card-desc">${esc(s.description)}</div>`;
  if (s.tags.length || s.lang) {
    html += '<div class="card-meta">';
    for (const t of s.tags) html += `<span class="card-tag">${esc(t)}</span>`;
    if (s.lang) {
      const lc = LANG_CLASS[s.lang] || "";
      html += `<span class="card-lang ${lc}">${(LANG_FLAGS[s.lang]||"")} ${esc(s.lang)}</span>`;
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}
