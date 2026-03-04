import {
  SESSIONS, searchIndex, filteredIndices, dayFilter,
  showHidden, showHighlightedOnly,
  hiddenSessions, highlightedSessions, calHiddenStages,
  activeStages, activeTags, activeLangs, searchQuery, currentView
} from './state.js';
import { STAGE_ORDER, ALL_TAGS, ALL_LANGS } from './constants.js';

const VTIMEZONE = `BEGIN:VTIMEZONE\r\nTZID:Europe/Madrid\r\nBEGIN:STANDARD\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE`;

function foldLine(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts = [];
  let pos = 0;
  while (pos < bytes.length) {
    const len = pos === 0 ? 75 : 74;
    const chunk = bytes.slice(pos, pos + len);
    parts.push((pos > 0 ? ' ' : '') + new TextDecoder().decode(chunk));
    pos += len;
  }
  return parts.join('\r\n');
}

function icsEscape(text) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function sessionUID(s, idx) {
  return `session-${idx}-${s.day}-${s.time.replace(/[:-]/g, '')}@mwc-talent-arena`;
}

function generateICS(indices) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MWC Schedule Viewer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:MWC Talent Arena (filtered)',
    'X-WR-TIMEZONE:Europe/Madrid',
    VTIMEZONE
  ];

  for (const idx of indices) {
    const s = SESSIONS[idx];
    const [startStr, endStr] = s.time.split('-');
    const dateStr = s.day === 3 ? '20260303' : '20260304';
    const dtStart = dateStr + 'T' + startStr.replace(':', '') + '00';
    const dtEnd = dateStr + 'T' + endStr.replace(':', '') + '00';

    const speakers = s.speakers.map(sp => sp.name + (sp.role ? ' \u2013 ' + sp.role : '')).join('\\n');
    const desc = (s.description ? icsEscape(s.description) + '\\n' : '') + (speakers ? icsEscape(speakers) : '');

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`DTSTART;TZID=Europe/Madrid:${dtStart}`));
    lines.push(foldLine(`DTEND;TZID=Europe/Madrid:${dtEnd}`));
    lines.push(foldLine(`SUMMARY:${icsEscape(s.title)}`));
    lines.push(foldLine(`LOCATION:${icsEscape(s.stage)}`));
    if (desc) lines.push(foldLine(`DESCRIPTION:${desc}`));
    lines.push(`UID:${sessionUID(s, idx)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// Recompute filtered indices for a specific day (or all days if null)
function computeExportIndices(forDay) {
  const q = searchQuery;
  const indices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i];
    if (!showHidden && hiddenSessions.has(i)) continue;
    if (showHighlightedOnly && currentView === "list" && !highlightedSessions.has(i)) continue;
    if (forDay && s.day !== forDay) continue;
    if (activeLangs.size < ALL_LANGS.length && s.lang && !activeLangs.has(s.lang)) continue;
    if (activeStages.size < STAGE_ORDER.length && !activeStages.has(s.stage) && !(showHidden && calHiddenStages.has(s.stage))) continue;
    if (activeTags.size < ALL_TAGS.length) {
      const sTags = s.tags || [];
      if (sTags.length && !sTags.some(t => activeTags.has(t))) continue;
    }
    if (q && !searchIndex[i].includes(q)) continue;
    indices.push(i);
  }
  return indices;
}

function getExportContext() {
  const parts = [];
  if (showHighlightedOnly) parts.push('starred only');
  if (showHidden) parts.push('hidden included');
  return parts.length ? parts.join(', ') : null;
}

function downloadBlob(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function doExport(day) {
  const indices = computeExportIndices(day);
  const ics = generateICS(indices);
  const suffix = day ? `mar${day}` : 'all';
  downloadBlob(ics, `mwc-talent-arena-${suffix}.ics`);
  closeExportPrompt();
}

function closeExportPrompt() {
  const el = document.getElementById('exportPrompt');
  if (el) el.classList.remove('open');
  document.removeEventListener('keydown', _escHandler);
  document.removeEventListener('click', _outsideHandler);
}

function _escHandler(e) {
  if (e.key === 'Escape') closeExportPrompt();
}

function _outsideHandler(e) {
  const el = document.getElementById('exportPrompt');
  if (el && !el.contains(e.target) && !e.target.closest('.export-trigger')) {
    closeExportPrompt();
  }
}

export function showExportPrompt() {
  const el = document.getElementById('exportPrompt');
  if (el.classList.contains('open')) { closeExportPrompt(); return; }

  const day3 = computeExportIndices(3).length;
  const day4 = computeExportIndices(4).length;
  const total = day3 + day4;
  const ctx = getExportContext();
  const contextStr = ctx ? ` (${ctx})` : '';

  document.getElementById('exportSummary').textContent =
    `${total} session${total !== 1 ? 's' : ''} matching current filters${contextStr}`;

  const btns = document.getElementById('exportButtons');
  const currentDay = parseInt(dayFilter);
  btns.innerHTML =
    `<button class="export-btn${currentDay === 3 ? ' current' : ''}" onclick="exportDay(3)">Mar 3 (${day3})</button>` +
    `<button class="export-btn${currentDay === 4 ? ' current' : ''}" onclick="exportDay(4)">Mar 4 (${day4})</button>` +
    `<button class="export-btn export-btn-both" onclick="exportDay(null)">Both days (${total})</button>`;

  el.classList.add('open');
  setTimeout(() => {
    document.addEventListener('keydown', _escHandler);
    document.addEventListener('click', _outsideHandler);
  }, 0);
}

export function exportDay(day) {
  doExport(day);
}
