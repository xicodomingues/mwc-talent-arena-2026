// ── Data ──
let SESSIONS = [];
let searchIndex = [];
const STAGE_COLORS = {"XPRO stage": "#FFD700", "XPRO Lab": "#FF6B35", "XPRO Talks": "#00BCD4", "Visionary Stage": "#9B59B6", "Hotspot Talks": "#3498DB", "Plug-in Talks": "#E74C3C", "Focus Lab": "#2ECC71", "Frontier lab": "#FF4081", "Meetup area": "#78909C", "Barcelona": "#FFEB3B", "Skills Hub": "#26A69A", "Robotics": "#7C4DFF", "Gaming": "#F50057", "TECHNICAL DEV DIVES": "#546E7A"};
const STAGE_ORDER = ["XPRO stage", "XPRO Lab", "XPRO Talks", "Visionary Stage", "Hotspot Talks", "Plug-in Talks", "Focus Lab", "Frontier lab", "Meetup area", "Barcelona", "Skills Hub", "Robotics", "Gaming"];
const ALL_TAGS = ["Artificial Intelligence", "Cloud Computing", "Cybersecurity", "Future Trends", "GAMING", "Management", "ROBOTICS", "Software Development"];
const LANG_FLAGS = {English:"\u{1F1EC}\u{1F1E7}",Spanish:"\u{1F1EA}\u{1F1F8}",Catalan:"\u{1F3F4}"};
const LANG_CLASS = {English:"lang-en",Spanish:"lang-es",Catalan:"lang-ca"};

// ── State ──
// Parse hash: #day=3&view=calendar
function parseHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  return { day: params.get("day"), view: params.get("view") };
}
function updateHash() {
  const params = new URLSearchParams();
  params.set("day", dayFilter);
  params.set("view", currentView);
  history.replaceState(null, "", "#" + params.toString());
}
const _hash = parseHash();
let currentView = _hash.view || (window.innerWidth >= 768 ? "calendar" : "list");
let dayFilter = _hash.day || (new Date().getDate() === 4 ? "4" : "3");
let searchQuery = "";
let scrollToNow = true;
const ALL_LANGS = ["English", "Spanish", "Catalan"];
let activeLangs = new Set(ALL_LANGS);
let activeStages = new Set(STAGE_ORDER);
let activeTags = new Set(ALL_TAGS);
let filteredIndices = [];

// Hidden sessions (persisted in localStorage)
const LS_KEY = "mwc_hidden_sessions";
let hiddenSessions = new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
let showHidden = localStorage.getItem("showHidden") === "true";

// Highlighted sessions (persisted in localStorage)
const LS_HIGHLIGHT_KEY = "mwc_highlighted_sessions";
let highlightedSessions = new Set(JSON.parse(localStorage.getItem(LS_HIGHLIGHT_KEY) || "[]"));
let showHighlightedOnly = false;

// Calendar stage visibility (persisted)
const LS_CAL_STAGES_KEY = "mwc_cal_hidden_stages";
let calHiddenStages = new Set(JSON.parse(localStorage.getItem(LS_CAL_STAGES_KEY) || "[]"));

function toggleCalStage(stage) {
  if (calHiddenStages.has(stage)) calHiddenStages.delete(stage); else calHiddenStages.add(stage);
  localStorage.setItem(LS_CAL_STAGES_KEY, JSON.stringify([...calHiddenStages]));
  render();
}


function saveHidden() {
  localStorage.setItem(LS_KEY, JSON.stringify([...hiddenSessions]));
  updateHiddenCount();
}
function toggleHide(idx, evt) {
  if (evt) evt.stopPropagation();
  if (hiddenSessions.has(idx)) hiddenSessions.delete(idx); else hiddenSessions.add(idx);
  saveHidden();
  applyFilters();
}
function saveHighlighted() {
  localStorage.setItem(LS_HIGHLIGHT_KEY, JSON.stringify([...highlightedSessions]));
  updateHighlightedCount();
}
function toggleHighlight(idx, evt) {
  if (evt) evt.stopPropagation();
  if (highlightedSessions.has(idx)) highlightedSessions.delete(idx); else highlightedSessions.add(idx);
  saveHighlighted();
  applyFilters();
}
function toggleShowHighlightedOnly() {
  showHighlightedOnly = !showHighlightedOnly;
  document.getElementById("showHighlightedBtn").classList.toggle("active", showHighlightedOnly);
  applyFilters();
}
function updateHighlightedCount() {
  const btn = document.getElementById("showHighlightedBtn");
  const n = highlightedSessions.size;
  btn.textContent = n ? "Starred (" + n + ")" : "Starred";
}
function toggleShowHidden() {
  showHidden = !showHidden;
  localStorage.setItem("showHidden", showHidden);
  document.getElementById("showHiddenBtn").classList.toggle("active", showHidden);
  updateHiddenCount();
  applyFilters();
}
function restoreAll() {
  hiddenSessions.clear();
  localStorage.setItem(LS_KEY, "[]");
  showHidden = false;
  localStorage.setItem("showHidden", "false");
  document.getElementById("showHiddenBtn").classList.remove("active");
  updateHiddenCount();
  applyFilters();
}
function updateHiddenCount() {
  const btn = document.getElementById("showHiddenBtn");
  const n = hiddenSessions.size;
  btn.textContent = n ? "Show hidden (" + n + ")" : "Show hidden";
  document.getElementById("restoreAllBtn").style.display = (n && showHidden) ? "" : "none";
}

// ── Build search index ──
function buildSearchIndex() {
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

// ── Init ──
function init() {
  // Sync day button active state
  document.querySelectorAll(".day-toggle button").forEach(b => b.classList.toggle("active", b.dataset.day === dayFilter));
  buildStageMenu();
  buildTagMenu();
  buildLangMenu();
  document.getElementById("showHiddenBtn").classList.toggle("active", showHidden);
  updateHiddenCount();
  updateHighlightedCount();
  setView(currentView);
}

function buildStageMenu() {
  const el = document.getElementById("stageMenu");
  let html = "";
  for (const st of STAGE_ORDER) {
    const c = STAGE_COLORS[st] || "#888";
    const checked = activeStages.has(st) ? "checked" : "";
    html += `<label class="dropdown-item"><input type="checkbox" ${checked} onchange="toggleStage('${esc(st)}')"><span style="color:${c}">${esc(st)}</span></label>`;
  }
  el.innerHTML = html;
  updateStageLabel();
}

function buildTagMenu() {
  const el = document.getElementById("tagMenu");
  let html = "";
  for (const tag of ALL_TAGS) {
    const checked = activeTags.has(tag) ? "checked" : "";
    html += `<label class="dropdown-item"><input type="checkbox" ${checked} onchange="toggleTag('${esc(tag)}')">${esc(tag)}</label>`;
  }
  el.innerHTML = html;
  updateTagLabel();
}

// ── Filters ──
function setDay(btn) {
  dayFilter = btn.dataset.day;
  scrollToNow = true;
  document.querySelectorAll(".day-toggle button").forEach(b => b.classList.toggle("active", b === btn));
  updateHash();
  applyFilters();
}

function toggleStage(st) {
  if (activeStages.has(st)) activeStages.delete(st); else activeStages.add(st);
  updateStageLabel();
  applyFilters();
}

function updateStageLabel() {
  const el = document.getElementById("stageLabel");
  if (activeStages.size === STAGE_ORDER.length) el.textContent = "All";
  else if (activeStages.size === 0) el.textContent = "None";
  else el.textContent = activeStages.size + "/" + STAGE_ORDER.length;
}

function toggleTag(tag) {
  if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
  updateTagLabel();
  applyFilters();
}

function updateTagLabel() {
  const el = document.getElementById("tagLabel");
  if (activeTags.size === ALL_TAGS.length) el.textContent = "All";
  else if (activeTags.size === 0) el.textContent = "None";
  else el.textContent = activeTags.size + "/" + ALL_TAGS.length;
}

function buildLangMenu() {
  const el = document.getElementById("langMenu");
  const flags = {English:"\u{1F1EC}\u{1F1E7}",Spanish:"\u{1F1EA}\u{1F1F8}",Catalan:"\u{1F3F4}"};
  let html = "";
  for (const lang of ALL_LANGS) {
    const checked = activeLangs.has(lang) ? "checked" : "";
    html += `<label class="dropdown-item"><input type="checkbox" ${checked} onchange="toggleLang('${lang}')">${flags[lang]||""} ${lang}</label>`;
  }
  el.innerHTML = html;
  updateLangLabel();
}

function toggleLang(lang) {
  if (activeLangs.has(lang)) activeLangs.delete(lang); else activeLangs.add(lang);
  updateLangLabel();
  applyFilters();
}

function updateLangLabel() {
  const el = document.getElementById("langLabel");
  if (activeLangs.size === ALL_LANGS.length) el.textContent = "All";
  else if (activeLangs.size === 0) el.textContent = "None";
  else el.textContent = [...activeLangs].map(l => l.slice(0,2).toUpperCase()).join(", ");
}

function toggleDropdown(id) {
  const dd = document.getElementById(id);
  dd.classList.toggle("open");
}

// Close dropdown when clicking outside
document.addEventListener("click", e => {
  if (!e.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown.open").forEach(d => d.classList.remove("open"));
  }
});

function toggleFilters() {
  document.getElementById("filterPanel").classList.toggle("open");
  document.getElementById("filterToggle").classList.toggle("active");
}

function applyFilters() {
  searchQuery = document.getElementById("searchBox").value.toLowerCase().trim();

  filteredIndices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i];
    if (!showHidden && hiddenSessions.has(i)) continue;
    if (showHighlightedOnly && !highlightedSessions.has(i)) continue;
    if (dayFilter && String(s.day) !== dayFilter) continue;
    if (activeLangs.size < ALL_LANGS.length && s.lang && !activeLangs.has(s.lang)) continue;
    if (activeStages.size < STAGE_ORDER.length && !activeStages.has(s.stage)) continue;
    if (activeTags.size < ALL_TAGS.length) {
      const sTags = s.tags || [];
      if (sTags.length > 0 && !sTags.some(t => activeTags.has(t))) continue;
    }
    if (searchQuery && !searchIndex[i].includes(searchQuery)) continue;
    filteredIndices.push(i);
  }

  render();
}

// ── Render dispatch ──
function setView(v) {
  currentView = v;
  scrollToNow = true;
  document.querySelectorAll(".view-btns button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  updateHash();
  applyFilters();
}

function render() {
  if (currentView === "list") renderList();
  else if (currentView === "calendar") renderCalendar();
  else renderTimeline();
}

// ── List View ──
function renderList() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  // Group by day → time (skip hidden stages)
  const grouped = {};
  for (const idx of filteredIndices) {
    const s = SESSIONS[idx];
    if (calHiddenStages.has(s.stage)) continue;
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
  html += `<button class="hide-btn" onclick="toggleHide(${idx},event)" title="${isHidden ? "Unhide" : "Hide"}">${isHidden ? "\u{2795}" : "\u{2796}"}</button>`;
  html += `<button class="highlight-btn" onclick="toggleHighlight(${idx},event)" title="${isHighlighted ? "Unstar" : "Star"}" style="${isHighlighted ? "color:var(--accent)" : ""}">${isHighlighted ? "\u{2605}" : "\u{2606}"}</button>`;
  html += `<span class="card-stage">${esc(s.stage)}</span>`;
  html += `<div class="card-title">${esc(s.title)}</div>`;
  const spkLine = [co, spk].filter(Boolean).join(" – ");
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

// ── Calendar View ──
function renderCalendar() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  const days = [...new Set(filteredIndices.map(i => SESSIONS[i].day))].sort();
  let html = "";
  for (const day of days) {
    const dayIndices = filteredIndices.filter(i => SESSIONS[i].day === day);
    html += calendarDayHTML(day, dayIndices);
  }
  el.innerHTML = html;
}

function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function calendarDayHTML(day, indices) {
  // Collect stages present (exclude hidden)
  const stagesPresent = [];
  const stagesAll = []; // all stages with data, for the toggle row
  for (const st of STAGE_ORDER) {
    if (indices.some(i => SESSIONS[i].stage === st)) {
      stagesAll.push(st);
      if (!calHiddenStages.has(st)) stagesPresent.push(st);
    }
  }

  // Time range
  let minT = 1440, maxT = 0;
  for (const i of indices) {
    const [start, end] = SESSIONS[i].time.split("-");
    const s = parseTime(start), e = parseTime(end);
    if (s < minT) minT = s;
    if (e > maxT) maxT = e;
  }
  minT = Math.floor(minT / 30) * 30;
  maxT = Math.ceil(maxT / 30) * 30;

  const ppm = 3; // pixels per minute
  const headerH = 44;
  const timeCol = 50;
  const colW = 140;
  const totalW = timeCol + stagesPresent.length * colW;
  const totalH = headerH + (maxT - minT) * ppm;
  const stageIdx = {};
  stagesPresent.forEach((st, i) => stageIdx[st] = i);

  const bodyH = (maxT - minT) * ppm;

  let html = `<h2 class="day-heading">March ${day}</h2>`;
  html += `<div class="cal-wrapper"><div class="cal-grid" style="width:${totalW}px">`;

  // Sticky header row
  html += `<div class="cal-header">`;
  html += `<div class="cal-header-corner"></div>`;
  for (const st of stagesPresent) {
    const c = STAGE_COLORS[st] || "#888";
    html += `<div class="cal-stage-hdr" style="width:${colW}px;color:${c};border-bottom:2px solid ${c}" onclick="toggleCalStage('${esc(st)}')" title="Click to hide">${esc(st)}</div>`;
  }
  html += `</div>`;

  // Hidden stages restore bar (only visible when "Show hidden" is active)
  const hiddenHere = stagesAll.filter(st => calHiddenStages.has(st));
  if (hiddenHere.length && showHidden) {
    html += `<div class="cal-hidden-bar">`;
    html += `<span class="cal-hidden-label">Hidden:</span>`;
    for (const st of hiddenHere) {
      const c = STAGE_COLORS[st] || "#888";
      html += `<button class="pill" style="--pill-color:${c}" onclick="toggleCalStage('${esc(st)}')">${esc(st)}</button>`;
    }
    html += `</div>`;
  }

  // Body (events + grid) — top offset so first label isn't clipped
  const padTop = 14;
  html += `<div class="cal-body" style="height:${bodyH + padTop}px;position:relative">`;

  // Grid lines + time labels
  for (let t = minT; t <= maxT; t += 30) {
    const y = (t - minT) * ppm + padTop;
    const label = Math.floor(t/60) + ":" + String(t%60).padStart(2,"0");
    html += `<div class="cal-time-label" style="position:absolute;top:${y - 8}px;left:0">${label}</div>`;
    html += `<div class="cal-gridline" style="top:${y}px;left:${timeCol}px;width:${totalW - timeCol}px"></div>`;
  }

  // Stage separator lines
  for (let i = 0; i <= stagesPresent.length; i++) {
    const left = timeCol + i * colW;
    html += `<div class="cal-stageline" style="left:${left}px;top:${padTop}px;height:${bodyH}px"></div>`;
  }

  // Events
  const _now = new Date();
  const _nowDay = _now.getDate();
  const _nowM = _now.getHours() * 60 + _now.getMinutes();
  for (const idx of indices) {
    const s = SESSIONS[idx];
    if (!(s.stage in stageIdx)) continue;
    if (calHiddenStages.has(s.stage)) continue;
    const [startStr, endStr] = s.time.split("-");
    let startM = parseTime(startStr), endM = parseTime(endStr);
    if (endM <= startM) endM = startM + 30;
    const y = (startM - minT) * ppm + padTop;
    const h = Math.max((endM - startM) * ppm - 2, 4);
    const left = timeCol + stageIdx[s.stage] * colW + 2;
    const w = colW - 4;
    const c = STAGE_COLORS[s.stage] || "#888";
    const co = s.company || "";

    const isHidden = hiddenSessions.has(idx);
    const isHighlighted = highlightedSessions.has(idx);
    const midM = (startM + endM) / 2;
    const isPast = _nowDay == day && _nowM >= midM;
    const isOngoing = _nowDay == day && startM <= _nowM && _nowM < midM;
    html += `<div class="cal-ev${isHidden ? " hidden-session" : ""}${isHighlighted ? " highlighted-session" : ""}${isPast ? " cal-past" : ""}${isOngoing ? " cal-ongoing" : ""}" onclick="showModal(${idx})" style="top:${y}px;left:${left}px;width:${w}px;height:${h}px;background:color-mix(in srgb,${c} 15%,transparent);border-left:3px solid ${c}" title="${esc(s.time + ' | ' + s.stage + '\n' + s.title)}">`;
    html += `<b>${esc(s.title)}</b>`;
    if (co) html += `<div class="ev-spk">${esc(co)}</div>`;
    html += `</div>`;
  }

  // Now line (shifted 15min up so you see upcoming sessions)
  const now = new Date();
  const nowDay = now.getDate();
  if (nowDay == day) {
    const nowM = now.getHours() * 60 + now.getMinutes();
    if (nowM >= minT && nowM <= maxT) {
      const nowY = (nowM - minT) * ppm + padTop;
      html += `<div class="cal-now-line" data-now-offset="${nowY}" style="top:${nowY}px;left:${timeCol}px;width:${totalW - timeCol}px"></div>`;
    }
  }

  html += `</div>`; // cal-body
  html += `</div></div>`; // cal-grid, cal-wrapper
  return html;
}

// ── Timeline View (horizontal Gantt) ──
function renderTimeline() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  const ppm = 5; // pixels per minute (horizontal)
  const rowH = 40; // row height per stage
  const labelW = 0;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const nowDay = now.getDate();

  const days = [...new Set(filteredIndices.map(i => SESSIONS[i].day))].sort();
  let html = "";
  for (const day of days) {
    html += `<h2 class="day-heading">March ${day}</h2>`;
    const dayIndices = filteredIndices.filter(i => SESSIONS[i].day === day);

    // Find stages present and time range (exclude hidden stages)
    const stagesPresent = [];
    const stagesAllTl = [];
    for (const st of STAGE_ORDER) {
      if (dayIndices.some(i => SESSIONS[i].stage === st)) {
        stagesAllTl.push(st);
        if (!calHiddenStages.has(st)) stagesPresent.push(st);
      }
    }
    let minT = 1440, maxT = 0;
    for (const i of dayIndices) {
      const [start, end] = SESSIONS[i].time.split("-");
      const s = parseTime(start), e = parseTime(end);
      if (s < minT) minT = s;
      if (e > maxT) maxT = e;
    }
    minT = Math.floor(minT / 30) * 30;
    maxT = Math.ceil(maxT / 30) * 30;

    const bodyW = (maxT - minT) * ppm;
    const totalW = labelW + bodyW;
    const bodyH = stagesPresent.length * rowH;
    const stageIdx = {};
    stagesPresent.forEach((st, i) => stageIdx[st] = i);

    html += `<div class="tl-wrapper"><div class="tl-grid" style="width:${totalW}px">`;

    // Time header
    html += `<div class="tl-header">`;
    for (let t = minT; t < maxT; t += 30) {
      const x = (t - minT) * ppm;
      const w = 30 * ppm;
      const label = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
      html += `<div class="tl-time-hdr" style="width:${w}px">${label}</div>`;
    }
    html += `</div>`;

    // Body
    html += `<div class="tl-body" style="height:${bodyH}px;position:relative">`;

    // Vertical gridlines
    for (let t = minT; t <= maxT; t += 30) {
      const x = labelW + (t - minT) * ppm;
      html += `<div class="tl-gridline" style="left:${x}px;top:0;height:${bodyH}px"></div>`;
    }

    // Stage row lines
    for (let i = 1; i < stagesPresent.length; i++) {
      const y = i * rowH;
      html += `<div style="position:absolute;left:${labelW}px;top:${y}px;width:${bodyW}px;height:1px;background:#1a1a1a"></div>`;
    }

    // Events
    for (const idx of dayIndices) {
      const s = SESSIONS[idx];
      if (!(s.stage in stageIdx)) continue;
      const c = STAGE_COLORS[s.stage] || "#888";
      const [startStr, endStr] = s.time.split("-");
      let startM = parseTime(startStr), endM = parseTime(endStr);
      if (endM <= startM) endM = startM + 30;
      const x = labelW + (startM - minT) * ppm;
      const w = Math.max((endM - startM) * ppm - 4, 20);
      const y = stageIdx[s.stage] * rowH + 2;
      const h = rowH - 4;
      const isHidden = hiddenSessions.has(idx);
      const isHighlighted = highlightedSessions.has(idx);
      const midM = (startM + endM) / 2;
      const isPast = nowDay == day && nowM >= midM;
      const isOngoing = nowDay == day && startM <= nowM && nowM < midM;
      html += `<div class="tl-ev${isHidden ? " hidden-session" : ""}${isHighlighted ? " highlighted-session" : ""}${isPast ? " tl-past" : ""}${isOngoing ? " tl-ongoing" : ""}" onclick="showModal(${idx})" style="top:${y}px;left:${x}px;width:${w}px;height:${h}px;background:color-mix(in srgb,${c} 25%,transparent)" title="${esc(s.time + ' | ' + s.title)}"><span class="tl-ev-dot" style="background:${c}"></span><span class="tl-ev-text">${esc(s.title)}</span></div>`;
    }

    // Now line
    if (nowDay == day && nowM >= minT && nowM <= maxT) {
      const nowX = labelW + (nowM - minT) * ppm;
      html += `<div class="tl-now-line" style="left:${nowX}px;top:0;height:${bodyH}px"></div>`;
    }

    html += `</div>`; // tl-body
    html += `</div></div>`; // tl-grid, tl-wrapper

    // Legend (clickable to hide/show stages)
    html += `<div class="tl-legend">`;
    for (const stage of stagesPresent) {
      const c = STAGE_COLORS[stage] || "#888";
      html += `<span class="tl-legend-item" onclick="toggleCalStage('${esc(stage)}')" title="Click to hide"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;vertical-align:middle"></span>${esc(stage)}</span>`;
    }
    const hiddenTl = stagesAllTl.filter(st => calHiddenStages.has(st));
    if (hiddenTl.length && showHidden) {
      for (const stage of hiddenTl) {
        const c = STAGE_COLORS[stage] || "#888";
        html += `<span class="tl-legend-item tl-legend-hidden" onclick="toggleCalStage('${esc(stage)}')" title="Click to restore"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;vertical-align:middle"></span>${esc(stage)}</span>`;
      }
    }
    html += `</div>`;
  }
  el.innerHTML = html;

  // Scroll to now line (only on first render or view switch)
  if (scrollToNow) {
    const nowLine = document.querySelector(".tl-now-line");
    if (nowLine) {
      const wrapper = nowLine.closest(".tl-wrapper");
      if (wrapper) wrapper.scrollLeft = Math.max(0, nowLine.offsetLeft - 60);
    }
  }
}

// ── Modal ──
function showModal(idx) {
  const s = SESSIONS[idx];
  const c = STAGE_COLORS[s.stage] || "#888";
  let html = "";
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

  // Update highlight button in header
  const mHighlighted = highlightedSessions.has(idx);
  const hlBtn = document.getElementById("modalHighlightBtn");
  hlBtn.innerHTML = mHighlighted ? "&#9733;" : "&#9734;";
  hlBtn.style.color = mHighlighted ? "var(--accent)" : "var(--text3)";
  hlBtn.title = mHighlighted ? "Unstar" : "Star";
  hlBtn.onclick = function() {
    const wasHighlighted = highlightedSessions.has(idx);
    toggleHighlight(idx);
    closeModal();
    showToast(wasHighlighted ? "Session unstarred" : "Session starred");
  };

  // Update hide button in header
  const mHidden = hiddenSessions.has(idx);
  const hBtn = document.getElementById("modalHideBtn");
  hBtn.innerHTML = mHidden ? "+" : "&minus;";
  hBtn.onclick = function() {
    const wasHidden = hiddenSessions.has(idx);
    toggleHide(idx);
    closeModal();
    showToast(wasHidden ? "Session restored" : "Session hidden");
  };
  for (const t of s.tags) html += `<span>${esc(t)}</span>`;
  if (s.lang) {
    const flag = LANG_FLAGS[s.lang] || "";
    html += `<span>${flag} ${esc(s.lang)}</span>`;
  }
  html += '</div>';

  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalBackdrop").classList.add("open");
}

function closeModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// Close on backdrop click or Escape
document.getElementById("modalBackdrop").addEventListener("click", e => {
  if (e.target === document.getElementById("modalBackdrop")) closeModal();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ── Util ──
function esc(text) {
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

// ── Drag-to-scroll for calendar wrappers ──
function initDragScroll() {
  document.querySelectorAll(".cal-wrapper, .tl-wrapper").forEach(el => {
    let isDown = false, startX, startY, scrollL, scrollT, moved;
    el.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      isDown = true; moved = false;
      el.classList.add("dragging");
      startX = e.pageX; startY = e.pageY;
      scrollL = el.scrollLeft; scrollT = el.scrollTop;
    });
    el.addEventListener("mousemove", e => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - startX, dy = e.pageY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      el.scrollLeft = scrollL - dx;
      el.scrollTop = scrollT - dy;
    });
    const stop = () => { isDown = false; el.classList.remove("dragging"); };
    el.addEventListener("mouseup", stop);
    el.addEventListener("mouseleave", stop);
    // Prevent click on events when we just dragged
    el.addEventListener("click", e => { if (moved) { e.stopPropagation(); moved = false; } }, true);
  });
}

// Re-init drag after each render + scroll to now on first render
const _origRenderCal = renderCalendar;
renderCalendar = function() {
  _origRenderCal();
  initDragScroll();
  if (scrollToNow) {
    const nowLine = document.querySelector(".cal-now-line");
    if (nowLine) {
      const wrapper = nowLine.closest(".cal-wrapper");
      if (wrapper) {
        const lineTop = nowLine.offsetTop;
        wrapper.scrollTop = Math.max(0, lineTop - 45);
      }
    }
  }
};

// ── Scroll to current time (list/timeline) ──
function scrollToNowSlot() {
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const slots = document.querySelectorAll(".time-slot-heading, .tl-slot-time");
  let best = null, bestDiff = Infinity;
  for (const el of slots) {
    const m = el.textContent.match(/(\d{2}):(\d{2})/);
    if (!m) continue;
    const t = parseInt(m[1]) * 60 + parseInt(m[2]);
    const diff = Math.abs(t - nowM);
    if (diff < bestDiff) { bestDiff = diff; best = el; }
  }
  if (best && bestDiff < 120) {
    best.scrollIntoView({behavior: "smooth", block: "start"});
  }
}

const _origRender = render;
render = function() {
  // Save scroll positions of wrappers before innerHTML replacement destroys them
  const savedCal = Array.from(document.querySelectorAll('.cal-wrapper')).map(w => ({ scrollLeft: w.scrollLeft, scrollTop: w.scrollTop }));
  const savedTl = Array.from(document.querySelectorAll('.tl-wrapper')).map(w => ({ scrollLeft: w.scrollLeft, scrollTop: w.scrollTop }));

  _origRender();

  if (scrollToNow && currentView === "list") scrollToNowSlot();
  if (currentView === "timeline") initDragScroll();

  // Restore scroll positions when not scrolling to now (e.g. hide/star toggle)
  if (!scrollToNow) {
    document.querySelectorAll('.cal-wrapper').forEach((w, i) => {
      if (savedCal[i]) { w.scrollLeft = savedCal[i].scrollLeft; w.scrollTop = savedCal[i].scrollTop; }
    });
    document.querySelectorAll('.tl-wrapper').forEach((w, i) => {
      if (savedTl[i]) { w.scrollLeft = savedTl[i].scrollLeft; w.scrollTop = savedTl[i].scrollTop; }
    });
  }

  scrollToNow = false;
};

// ── Start ──
fetch("sessions.json")
  .then(r => r.json())
  .then(data => {
    SESSIONS = data;
    buildSearchIndex();
    init();
    // Refresh every 5 minutes to update the now line
    setInterval(() => { scrollToNow = true; render(); }, 5 * 60 * 1000);
  });
