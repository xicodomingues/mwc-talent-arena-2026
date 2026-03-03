#!/usr/bin/env python3
"""Generate MWC Talent Arena schedule HTML from mwc_sessions_clean.json.

Produces a standalone HTML file with inline CSS + JS. All rendering is
client-side: session data is embedded as a JSON array in a <script> tag.
Three views: List (default mobile), Calendar (default desktop), Timeline.
"""

import json
import os
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(SCRIPT_DIR, "mwc_sessions_clean.json")
OUTPUT = os.path.join(SCRIPT_DIR, "mwc_talent_arena_schedule.html")

STAGE_COLORS = {
    "XPRO stage": "#FFD700",
    "XPRO Lab": "#E6C200",
    "XPRO Talks": "#CCB000",
    "Visionary Stage": "#9B59B6",
    "Hotspot Talks": "#3498DB",
    "Plug-in Talks": "#E67E22",
    "Focus Lab": "#2ECC71",
    "Frontier lab": "#1ABC9C",
    "Meetup area": "#95A5A6",
    "Barcelona": "#E74C3C",
    "Skills Hub": "#7F8C8D",
    "Robotics": "#8E44AD",
    "Gaming": "#E91E63",
    "TECHNICAL DEV DIVES": "#34495E",
}

STAGE_ORDER = [
    "XPRO stage", "XPRO Lab", "XPRO Talks", "Visionary Stage",
    "Hotspot Talks", "Plug-in Talks", "Focus Lab", "Frontier lab",
    "Meetup area", "Barcelona", "Skills Hub", "Robotics", "Gaming",
    "TECHNICAL DEV DIVES",
]


def generate(sessions):
    sessions = [s for s in sessions if s.get("day") in (3, 4)]
    sessions.sort(key=lambda s: (s["day"], s.get("time", "99:99")))

    all_stages = sorted(
        {s["stage"] for s in sessions},
        key=lambda x: STAGE_ORDER.index(x) if x in STAGE_ORDER else 999,
    )
    all_tags = sorted({t for s in sessions for t in s.get("tags", [])})

    sessions_json = json.dumps(sessions, ensure_ascii=False, separators=(",", ":"))
    stage_colors_json = json.dumps(STAGE_COLORS, ensure_ascii=False)
    stage_order_json = json.dumps(all_stages, ensure_ascii=False)
    tags_json = json.dumps(all_tags, ensure_ascii=False)

    return HTML_TEMPLATE.replace("__SESSIONS_JSON__", sessions_json)\
        .replace("__STAGE_COLORS_JSON__", stage_colors_json)\
        .replace("__STAGE_ORDER_JSON__", stage_order_json)\
        .replace("__TAGS_JSON__", tags_json)


# ── HTML Template ────────────────────────────────────────────────────────────

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>MWC Talent Arena 2026 – Schedule</title>
<style>
/* ── Reset & Base ── */
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0a;--surface:#141414;--surface2:#1e1e1e;--surface3:#282828;
  --text:#e0e0e0;--text2:#aaa;--text3:#777;--accent:#FFD700;--accent2:#00D4FF;
  --radius:10px;--radius-sm:6px;
  font-size:16px;
}
html{-webkit-text-size-adjust:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100dvh;overflow-x:hidden}

/* ── Top Bar (sticky) ── */
.topbar{position:sticky;top:0;z-index:100;background:var(--bg);border-bottom:1px solid #222;padding:0.75rem 1rem}
.topbar-inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center}
.topbar h1{font-size:1.1rem;color:var(--accent);white-space:nowrap;margin-right:auto}
.day-toggle{display:flex;gap:0}
.day-toggle button{background:var(--surface2);color:var(--text2);border:1px solid #333;padding:0.4rem 0.75rem;font-size:0.8rem;cursor:pointer;min-height:44px;min-width:44px}
.day-toggle button:first-child{border-radius:var(--radius-sm) 0 0 var(--radius-sm)}
.day-toggle button:last-child{border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.day-toggle button.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:700}
.search-box{background:var(--surface2);color:#fff;border:1px solid #444;padding:0.5rem 0.75rem;border-radius:var(--radius-sm);font-size:0.85rem;width:100%;max-width:260px;min-height:44px}
.search-box:focus{outline:none;border-color:var(--accent)}

/* ── Filter Panel ── */
.filter-toggle{display:none;background:var(--surface2);color:var(--text2);border:1px solid #333;padding:0.4rem 0.75rem;border-radius:var(--radius-sm);font-size:0.8rem;cursor:pointer;min-height:44px}
.filter-panel{max-width:1200px;margin:0 auto;padding:0.75rem 1rem;display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-start}
.filter-section{display:flex;flex-wrap:wrap;gap:0.35rem;align-items:center}
.filter-section .label{font-size:0.75rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin-right:0.25rem;white-space:nowrap}
.pill{background:var(--surface3);color:var(--text3);border:1px solid #3a3a3a;padding:0.3rem 0.6rem;border-radius:999px;cursor:pointer;font-size:0.75rem;white-space:nowrap;min-height:32px;display:inline-flex;align-items:center;transition:all 0.15s}
.pill.active{color:var(--pill-color,var(--accent));border-color:var(--pill-color,var(--accent));background:color-mix(in srgb,var(--pill-color,var(--accent)) 15%,transparent)}
.pill:hover{filter:brightness(1.2)}
.dropdown{position:relative}
.dropdown-btn{background:var(--surface2);color:var(--text2);border:1px solid #444;padding:0.3rem 0.6rem;border-radius:var(--radius-sm);font-size:0.8rem;min-height:32px;cursor:pointer;display:flex;align-items:center;gap:0.3rem;white-space:nowrap}
.dropdown-btn .label{margin-right:0.15rem}
.dropdown-menu{display:none;position:absolute;top:100%;left:0;background:var(--surface2);border:1px solid #444;border-radius:var(--radius-sm);padding:0.3rem 0;min-width:140px;z-index:50;margin-top:2px}
.dropdown.open .dropdown-menu{display:block}
.dropdown-item{display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.6rem;font-size:0.8rem;color:var(--text);cursor:pointer;min-height:36px}
.dropdown-item:hover{background:var(--surface3)}
.dropdown-item input{accent-color:var(--accent)}

/* ── Hidden sessions ── */
.card.hidden-session,.tl-card.hidden-session,.cal-ev.hidden-session{opacity:0.3;border-style:dashed}
.card.hidden-session .card-title,.tl-card.hidden-session .card-title{text-decoration:line-through}
.hide-btn{background:none;border:none;color:var(--text3);cursor:pointer;font-size:0.8rem;padding:0.2rem 0.4rem;border-radius:var(--radius-sm);float:right;min-width:32px;min-height:32px;display:inline-flex;align-items:center;justify-content:center}
.hide-btn:hover{color:#fff;background:var(--surface3)}
.show-hidden-toggle{background:var(--surface2);color:var(--text2);border:1px solid #333;padding:0.35rem 0.75rem;border-radius:var(--radius-sm);font-size:0.8rem;cursor:pointer;min-height:44px;margin-right:0.5rem}
.show-hidden-toggle.active{background:#E74C3C33;color:#E74C3C;border-color:#E74C3C}

/* ── Stats & View Toggle ── */
.toolbar{max-width:1200px;margin:0 auto;padding:0.5rem 1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem}
.stats{font-size:0.8rem;color:var(--text3)}
.toolbar-right{display:flex;align-items:center}
.view-btns{display:flex;gap:0}
.view-btns button{background:var(--surface2);color:var(--text2);border:1px solid #333;padding:0.35rem 0.75rem;font-size:0.8rem;cursor:pointer;min-height:44px}
.view-btns button:first-child{border-radius:var(--radius-sm) 0 0 var(--radius-sm)}
.view-btns button:nth-child(2){border-left:0;border-right:0}
.view-btns button:last-child{border-radius:0 var(--radius-sm) var(--radius-sm) 0}
.view-btns button.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:700}

/* ── Content Container ── */
.content{max-width:1200px;margin:0 auto;padding:0 1rem 3rem}

/* ── List View ── */
.day-heading{font-size:1.2rem;color:var(--accent);margin:1.5rem 0 0.75rem;padding-bottom:0.35rem;border-bottom:2px solid var(--accent)}
.time-slot-heading{font-size:0.9rem;color:var(--accent2);margin:1rem 0 0.5rem;padding:0.3rem 0.6rem;background:var(--surface);border-radius:var(--radius-sm);display:inline-block}
.list-cards{display:grid;grid-template-columns:1fr;gap:0.6rem;margin-bottom:0.5rem}
.card{background:var(--surface);border-radius:var(--radius);padding:0.85rem;border-left:4px solid var(--card-color,#444);cursor:pointer;transition:background 0.1s}
.card:hover{background:var(--surface2)}
.card:active{background:var(--surface3)}
.card-stage{font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:999px;display:inline-block;margin-bottom:0.35rem;color:var(--card-color);background:color-mix(in srgb,var(--card-color) 15%,transparent)}
.card-title{font-size:0.95rem;font-weight:600;color:#fff;margin-bottom:0.25rem;line-height:1.3}
.card-speakers{font-size:0.8rem;color:var(--text2);margin-bottom:0.25rem}
.card-desc{font-size:0.78rem;color:var(--text3);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-meta{display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.4rem}
.card-tag{font-size:0.65rem;background:var(--surface3);color:var(--text2);padding:0.15rem 0.4rem;border-radius:999px}
.card-lang{font-size:0.65rem;padding:0.15rem 0.4rem;border-radius:999px}
.lang-en{background:#1a3a2a;color:#4CAF50}
.lang-es{background:#3a2a1a;color:#FF9800}
.lang-ca{background:#1a2a3a;color:#2196F3}

/* ── Calendar View ── */
.cal-wrapper{overflow-x:auto;overflow-y:auto;max-height:85dvh;-webkit-overflow-scrolling:touch;border:1px solid #222;border-radius:var(--radius);background:var(--surface);margin-bottom:1.5rem;cursor:grab}
.cal-wrapper.dragging{cursor:grabbing;user-select:none}
.cal-grid{position:relative;min-width:600px}
.cal-header{position:sticky;top:0;z-index:200;display:flex;background:var(--surface);border-bottom:1px solid #333}
.cal-header-corner{width:60px;min-width:60px;height:40px;background:var(--surface)}
.cal-stage-hdr{height:40px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;text-align:center;padding:0 4px;line-height:1.15;cursor:pointer;transition:opacity 0.15s;user-select:none}
.cal-stage-hdr:hover{opacity:0.7}
.cal-hidden-bar{display:flex;align-items:center;gap:0.35rem;padding:0.3rem 0.5rem;background:var(--surface2);border-bottom:1px solid #333;flex-wrap:wrap}
.cal-hidden-label{font-size:0.7rem;color:var(--text3)}
.cal-body{position:relative}
.cal-time-label{position:sticky;left:0;z-index:5;width:60px;font-size:0.7rem;color:var(--text3);text-align:right;padding-right:6px;background:var(--surface)}
.cal-gridline{position:absolute;height:1px;background:#1e1e1e;pointer-events:none}
.cal-stageline{position:absolute;width:1px;background:#1e1e1e;pointer-events:none}
.cal-ev{position:absolute;overflow:hidden;padding:3px 5px;border-radius:4px;cursor:pointer;font-size:0.63rem;line-height:1.2;z-index:1;transition:filter 0.1s;word-break:break-word}
.cal-ev:hover{filter:brightness(1.5);z-index:100;outline:1px solid rgba(255,255,255,0.4)}
.cal-ev b{display:block;overflow:hidden}
.cal-ev .ev-spk{opacity:0.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* ── Timeline View ── */
.tl-card{position:relative;background:var(--surface);border-radius:var(--radius);padding:0.85rem 0.85rem 0.85rem 1rem;margin-bottom:0.6rem;border-left:4px solid var(--card-color,#444);cursor:pointer;transition:background 0.1s}
.tl-card:hover{background:var(--surface2)}
.tl-time{font-size:0.75rem;color:var(--accent2);font-weight:600;margin-bottom:0.2rem}
.tl-card .card-stage{margin-left:0.5rem}
.tl-card .card-title{margin-bottom:0.15rem}

/* ── Modal ── */
.modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;justify-content:center;align-items:flex-end}
.modal-backdrop.open{display:flex}
.modal{background:var(--surface2);border-radius:var(--radius) var(--radius) 0 0;padding:1.25rem;width:100%;max-height:85dvh;overflow-y:auto;position:relative}
.modal-close{position:absolute;top:0.6rem;right:0.75rem;background:none;border:none;color:var(--text3);font-size:1.5rem;cursor:pointer;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center}
.modal-close:hover{color:#fff}
.modal-stage{font-size:0.75rem;font-weight:700;padding:0.2rem 0.65rem;border-radius:999px;display:inline-block;margin-bottom:0.5rem}
.modal-title{font-size:1.15rem;font-weight:700;color:#fff;margin-bottom:0.35rem;padding-right:2rem}
.modal-time{font-size:0.85rem;color:var(--accent2);margin-bottom:0.75rem}
.modal-speakers{margin-bottom:0.75rem;line-height:1.7}
.modal-speaker-name{font-weight:600;color:#fff}
.modal-speaker-role{color:var(--text2);font-size:0.85rem}
.modal-desc{font-size:0.88rem;color:var(--text2);line-height:1.6;margin-bottom:0.75rem}
.modal-meta{display:flex;gap:0.5rem;flex-wrap:wrap}
.modal-meta span{font-size:0.75rem;padding:0.2rem 0.5rem;border-radius:999px;background:var(--surface3);color:var(--text2)}

/* ── Responsive ── */
@media(max-width:767px){
  .filter-toggle{display:inline-flex;align-items:center}
  .filter-panel{display:none;padding:0.5rem 1rem}
  .filter-panel.open{display:flex}
  .topbar-inner{gap:0.4rem}
  .search-box{max-width:100%;order:10}
}
@media(min-width:768px){
  .list-cards{grid-template-columns:repeat(auto-fill,minmax(340px,1fr))}
  .modal-backdrop{align-items:center}
  .modal{max-width:560px;border-radius:var(--radius);max-height:80vh}
  .topbar h1{font-size:1.25rem}
}
</style>
</head>
<body>

<!-- ── Top Bar ── -->
<div class="topbar">
  <div class="topbar-inner">
    <h1>MWC Talent Arena 2026</h1>
    <div class="day-toggle">
      <button data-day="" class="active" onclick="setDay(this)">Both</button>
      <button data-day="3" onclick="setDay(this)">Mar 3</button>
      <button data-day="4" onclick="setDay(this)">Mar 4</button>
    </div>
    <button class="filter-toggle" id="filterToggle" onclick="toggleFilters()">Filters</button>
    <input type="text" class="search-box" id="searchBox" placeholder="Search title, speaker, company..." oninput="applyFilters()">
  </div>
</div>

<!-- ── Filter Panel ── -->
<div class="filter-panel" id="filterPanel">
  <div class="filter-section">
    <div class="dropdown" id="stageDropdown">
      <button class="dropdown-btn" onclick="toggleDropdown('stageDropdown')"><span class="label">Stages</span> <span id="stageLabel">All</span></button>
      <div class="dropdown-menu" id="stageMenu"></div>
    </div>
  </div>
  <div class="filter-section">
    <div class="dropdown" id="tagDropdown">
      <button class="dropdown-btn" onclick="toggleDropdown('tagDropdown')"><span class="label">Topics</span> <span id="tagLabel">All</span></button>
      <div class="dropdown-menu" id="tagMenu"></div>
    </div>
  </div>
  <div class="filter-section">
    <div class="dropdown" id="langDropdown">
      <button class="dropdown-btn" onclick="toggleDropdown('langDropdown')"><span class="label">Lang</span> <span id="langLabel">All</span></button>
      <div class="dropdown-menu" id="langMenu"></div>
    </div>
  </div>
</div>

<!-- ── Toolbar ── -->
<div class="toolbar">
  <span class="stats" id="stats"></span>
  <div class="toolbar-right">
    <button class="show-hidden-toggle" id="showHiddenBtn" onclick="toggleShowHidden()">Show hidden</button>
    <div class="view-btns">
      <button data-view="list" onclick="setView('list')">List</button>
      <button data-view="calendar" onclick="setView('calendar')">Calendar</button>
      <button data-view="timeline" onclick="setView('timeline')">Timeline</button>
    </div>
  </div>
</div>

<!-- ── Content ── -->
<div class="content" id="content"></div>

<!-- ── Modal ── -->
<div class="modal-backdrop" id="modalBackdrop">
  <div class="modal" id="modal">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div id="modalBody"></div>
  </div>
</div>

<script>
// ── Data ──
const SESSIONS = __SESSIONS_JSON__;
const STAGE_COLORS = __STAGE_COLORS_JSON__;
const STAGE_ORDER = __STAGE_ORDER_JSON__;
const ALL_TAGS = __TAGS_JSON__;
const LANG_FLAGS = {English:"\u{1F1EC}\u{1F1E7}",Spanish:"\u{1F1EA}\u{1F1F8}",Catalan:"\u{1F3F4}"};
const LANG_CLASS = {English:"lang-en",Spanish:"lang-es",Catalan:"lang-ca"};

// ── State ──
let currentView = window.innerWidth >= 768 ? "calendar" : "list";
let dayFilter = "";
let searchQuery = "";
const ALL_LANGS = ["English", "Spanish", "Catalan"];
let activeLangs = new Set(ALL_LANGS);
let activeStages = new Set(STAGE_ORDER);
let activeTags = new Set(ALL_TAGS);
let filteredIndices = [];

// Hidden sessions (persisted in localStorage)
const LS_KEY = "mwc_hidden_sessions";
const LS_INIT_KEY = "mwc_init_done";
let hiddenSessions = new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
let showHidden = false;

// Calendar stage visibility (persisted)
const LS_CAL_STAGES_KEY = "mwc_cal_hidden_stages";
let calHiddenStages = new Set(JSON.parse(localStorage.getItem(LS_CAL_STAGES_KEY) || "[]"));

function toggleCalStage(stage) {
  if (calHiddenStages.has(stage)) calHiddenStages.delete(stage); else calHiddenStages.add(stage);
  localStorage.setItem(LS_CAL_STAGES_KEY, JSON.stringify([...calHiddenStages]));
  render();
}

// Auto-hide Catalan sessions on first load
if (!localStorage.getItem(LS_INIT_KEY)) {
  SESSIONS.forEach((s, i) => { if (s.lang === "Catalan") hiddenSessions.add(i); });
  localStorage.setItem(LS_KEY, JSON.stringify([...hiddenSessions]));
  localStorage.setItem(LS_INIT_KEY, "1");
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
function toggleShowHidden() {
  showHidden = !showHidden;
  document.getElementById("showHiddenBtn").classList.toggle("active", showHidden);
  applyFilters();
}
function updateHiddenCount() {
  const btn = document.getElementById("showHiddenBtn");
  const n = hiddenSessions.size;
  btn.textContent = n ? "Show hidden (" + n + ")" : "Show hidden";
}

// ── Build search index ──
const searchIndex = SESSIONS.map(s => {
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

// ── Init ──
function init() {
  buildStageMenu();
  buildTagMenu();
  buildLangMenu();
  updateHiddenCount();
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
  document.querySelectorAll(".day-toggle button").forEach(b => b.classList.toggle("active", b === btn));
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

  const hidCount = hiddenSessions.size;
  const visibleCount = filteredIndices.filter(i => !hiddenSessions.has(i)).length;
  let statsText = visibleCount + " of " + SESSIONS.length + " sessions";
  if (showHidden && hidCount) statsText += " (" + hidCount + " hidden shown)";
  document.getElementById("stats").textContent = statsText;
  render();
}

// ── Render dispatch ──
function setView(v) {
  currentView = v;
  document.querySelectorAll(".view-btns button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
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

  // Group by day → time
  const grouped = {};
  for (const idx of filteredIndices) {
    const s = SESSIONS[idx];
    const key = s.day + "|" + s.time;
    if (!grouped[key]) grouped[key] = {day: s.day, time: s.time, items: []};
    grouped[key].items.push(idx);
  }

  const keys = Object.keys(grouped).sort();
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
  const isHidden = hiddenSessions.has(idx);
  let html = `<div class="card${isHidden ? " hidden-session" : ""}" style="--card-color:${c}" onclick="showModal(${idx})">`;
  html += `<button class="hide-btn" onclick="toggleHide(${idx},event)" title="${isHidden ? "Unhide" : "Hide"}">${isHidden ? "\u{2795}" : "\u{2796}"}</button>`;
  html += `<span class="card-stage">${esc(s.stage)}</span>`;
  html += `<div class="card-title">${esc(s.title)}</div>`;
  if (spk) html += `<div class="card-speakers">${esc(spk)}</div>`;
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
  const timeCol = 60;
  const colW = 150;
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

  // Body (events + grid)
  html += `<div class="cal-body" style="height:${bodyH}px;position:relative">`;

  // Grid lines + time labels
  for (let t = minT; t <= maxT; t += 30) {
    const y = (t - minT) * ppm;
    const label = String(Math.floor(t/60)).padStart(2,"0") + ":" + String(t%60).padStart(2,"0");
    html += `<div class="cal-time-label" style="position:absolute;top:${y - 8}px;left:0">${label}</div>`;
    html += `<div class="cal-gridline" style="top:${y}px;left:${timeCol}px;width:${totalW - timeCol}px"></div>`;
  }

  // Stage separator lines
  for (let i = 0; i <= stagesPresent.length; i++) {
    const left = timeCol + i * colW;
    html += `<div class="cal-stageline" style="left:${left}px;top:0;height:${bodyH}px"></div>`;
  }

  // Events
  for (const idx of indices) {
    const s = SESSIONS[idx];
    if (!(s.stage in stageIdx)) continue;
    if (calHiddenStages.has(s.stage)) continue;
    const [startStr, endStr] = s.time.split("-");
    let startM = parseTime(startStr), endM = parseTime(endStr);
    if (endM <= startM) endM = startM + 30;
    const y = (startM - minT) * ppm;
    const h = Math.max((endM - startM) * ppm - 2, 4);
    const left = timeCol + stageIdx[s.stage] * colW + 2;
    const w = colW - 4;
    const c = STAGE_COLORS[s.stage] || "#888";
    const co = s.company || "";

    const isHidden = hiddenSessions.has(idx);
    html += `<div class="cal-ev${isHidden ? " hidden-session" : ""}" onclick="showModal(${idx})" style="top:${y}px;left:${left}px;width:${w}px;height:${h}px;background:color-mix(in srgb,${c} 15%,transparent);border-left:3px solid ${c}" title="${esc(s.time + ' | ' + s.stage + '\n' + s.title)}">`;
    html += `<b>${esc(s.title)}</b>`;
    if (co) html += `<div class="ev-spk">${esc(co)}</div>`;
    html += `</div>`;
  }

  html += `</div>`; // cal-body
  html += `</div></div>`; // cal-grid, cal-wrapper
  return html;
}

// ── Timeline View ──
function renderTimeline() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  const days = [...new Set(filteredIndices.map(i => SESSIONS[i].day))].sort();
  let html = "";
  for (const day of days) {
    html += `<h2 class="day-heading">March ${day}</h2>`;
    const dayIndices = filteredIndices.filter(i => SESSIONS[i].day === day);
    // Already sorted by time from data
    let lastTime = "";
    for (const idx of dayIndices) {
      const s = SESSIONS[idx];
      const c = STAGE_COLORS[s.stage] || "#888";
      const spk = s.speakers.map(sp => sp.name).join(", ");
      const showTime = s.time !== lastTime;
      lastTime = s.time;

      const isHidden = hiddenSessions.has(idx);
      html += `<div class="tl-card${isHidden ? " hidden-session" : ""}" style="--card-color:${c}" onclick="showModal(${idx})">`;
      html += `<button class="hide-btn" onclick="toggleHide(${idx},event)" title="${isHidden ? "Unhide" : "Hide"}">${isHidden ? "\u{2795}" : "\u{2796}"}</button>`;
      html += `<span class="tl-time">${esc(s.time)}</span>`;
      html += `<span class="card-stage">${esc(s.stage)}</span>`;
      html += `<div class="card-title">${esc(s.title)}</div>`;
      if (spk) html += `<div class="card-speakers">${esc(spk)}</div>`;
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
    }
  }
  el.innerHTML = html;
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

  const mHidden = hiddenSessions.has(idx);
  html += `<div style="margin-bottom:0.75rem"><button class="pill${mHidden ? " active" : ""}" style="--pill-color:#E74C3C;min-height:44px" onclick="toggleHide(${idx});showModal(${idx})">${mHidden ? "Unhide this session" : "Hide this session"}</button></div>`;

  html += '<div class="modal-meta">';
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
  document.querySelectorAll(".cal-wrapper").forEach(el => {
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

// Re-init drag after each render
const _origRenderCal = renderCalendar;
renderCalendar = function() { _origRenderCal(); initDragScroll(); };

// ── Start ──
init();
</script>
</body>
</html>
"""


if __name__ == "__main__":
    with open(INPUT) as f:
        sessions = json.load(f)
    print(f"Loaded {len(sessions)} sessions")

    html = generate(sessions)
    with open(OUTPUT, "w") as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"Written {OUTPUT} ({size_kb:.0f} KB)")

    if sys.platform == "darwin":
        subprocess.run(["open", OUTPUT])
    elif sys.platform == "linux":
        subprocess.run(["xdg-open", OUTPUT])
    print("Opened in browser.")
