import { STAGE_COLORS, LANG_FLAGS, LANG_CLASS, MWC_STAGE_COLORS, STAR_SVG, EYE_SVG, EYE_OFF_SVG, NO_RESULTS_HTML } from './constants.js';
import { esc } from './utils.js';
import { SESSIONS, filteredIndices, hiddenSessions, highlightedSessions, section } from './state.js';

export function renderList() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = NO_RESULTS_HTML; return; }

  const grouped = {};
  for (const idx of filteredIndices) {
    const s = SESSIONS[idx];
    const key = s.day + "|" + s.time;
    if (!grouped[key]) grouped[key] = {day: s.day, time: s.time, items: []};
    grouped[key].items.push(idx);
  }

  const keys = Object.keys(grouped).sort();
  if (!keys.length) { el.innerHTML = NO_RESULTS_HTML; return; }
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
  const colors = section === "mwc" ? MWC_STAGE_COLORS : STAGE_COLORS;
  const c = colors[s.stage] || "#888";
  const isHidden = hiddenSessions.has(idx);
  const isHighlighted = highlightedSessions.has(idx);
  let html = `<div class="card${isHidden ? " hidden-session" : ""}${isHighlighted ? " highlighted-session" : ""}" style="--card-color:${c}" onclick="showModal(${idx})">`;
  html += `<div class="card-actions">`;
  html += `<button class="card-action act-star${isHighlighted ? " on" : ""}" onclick="toggleHighlight(${idx},event)" title="${isHighlighted ? "Unstar" : "Star"}">${STAR_SVG}</button>`;
  html += `<button class="card-action act-hide${isHidden ? " on" : ""}" onclick="toggleHide(${idx},event)" title="${isHidden ? "Restore" : "Hide"}">${isHidden ? EYE_SVG : EYE_OFF_SVG}</button>`;
  html += `</div>`;
  html += `<span class="card-stage">${esc(s.stage)}</span>`;
  html += `<div class="card-title">${esc(s.title)}</div>`;

  if (section === "mwc") {
    if (s.hall) html += `<div class="card-speakers">${esc(s.hall)}</div>`;
    if (s.company) html += `<div class="card-speakers">${esc(s.company)}</div>`;
    html += '<div class="card-meta">';
    if (s.theme) html += `<span class="card-tag">${esc(s.theme)}</span>`;
    if (s.access) html += `<span class="card-tag card-access">${esc(s.access)}</span>`;
    html += '</div>';
    if (s.interests && s.interests.length) {
      html += '<div class="card-meta card-meta-interests">';
      for (const int of s.interests.slice(0, 4)) html += `<span class="card-tag card-interest">${esc(int)}</span>`;
      if (s.interests.length > 4) html += `<span class="card-tag card-interest">+${s.interests.length - 4}</span>`;
      html += '</div>';
    }
  } else {
    const spk = s.speakers.map(sp => sp.name).join(", ");
    const co = s.company || "";
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
  }

  html += '</div>';
  return html;
}
