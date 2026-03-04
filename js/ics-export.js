import {
  SESSIONS, searchIndex, filteredIndices, dayFilter,
  showHidden, showHighlightedOnly,
  hiddenSessions, highlightedSessions, calHiddenStages,
  activeStages, activeTags, activeLangs, activeThemes, activeAccess, activeInterests,
  searchQuery, currentView, section, sectionStageOrder, sectionDays
} from './state.js';
import { STAGE_ORDER, ALL_TAGS, ALL_LANGS, ALL_MWC_THEMES, ALL_MWC_ACCESS, ALL_MWC_INTERESTS } from './constants.js';

const VTIMEZONE = `BEGIN:VTIMEZONE\r\nTZID:Europe/Madrid\r\nBEGIN:STANDARD\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\nEND:STANDARD\r\nBEGIN:DAYLIGHT\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\nEND:DAYLIGHT\r\nEND:VTIMEZONE`;

const DATE_MAP = {3: '20260303', 4: '20260304', 5: '20260305'};

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
  const prefix = section === "mwc" ? "mwc-barcelona" : "mwc-talent-arena";
  return `session-${idx}-${s.day}-${s.time.replace(/[:-]/g, '')}@${prefix}`;
}

function generateICS(indices) {
  const calName = section === "mwc" ? "MWC Barcelona (filtered)" : "MWC Talent Arena (filtered)";
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MWC Schedule Viewer//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Madrid',
    VTIMEZONE
  ];

  for (const idx of indices) {
    const s = SESSIONS[idx];
    const [startStr, endStr] = s.time.split('-');
    const dateStr = DATE_MAP[s.day] || '20260304';
    const dtStart = dateStr + 'T' + startStr.replace(':', '') + '00';
    const dtEnd = dateStr + 'T' + endStr.replace(':', '') + '00';

    const speakers = (s.speakers || []).map(sp => sp.name + (sp.role ? ' \u2013 ' + sp.role : '')).join('\\n');
    let desc = '';
    if (s.description) desc += icsEscape(s.description) + '\\n';
    if (speakers) desc += icsEscape(speakers);
    if (s.url) desc += (desc ? '\\n' : '') + icsEscape(s.url);

    const location = section === "mwc" && s.hall ? `${s.stage} (${s.hall})` : s.stage;

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`DTSTART;TZID=Europe/Madrid:${dtStart}`));
    lines.push(foldLine(`DTEND;TZID=Europe/Madrid:${dtEnd}`));
    lines.push(foldLine(`SUMMARY:${icsEscape(s.title)}`));
    lines.push(foldLine(`LOCATION:${icsEscape(location)}`));
    if (desc) lines.push(foldLine(`DESCRIPTION:${desc}`));
    lines.push(`UID:${sessionUID(s, idx)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function computeExportIndices(forDay) {
  const q = searchQuery;
  const stageOrder = sectionStageOrder();
  const indices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    const s = SESSIONS[i];
    if (!showHidden && hiddenSessions.has(i)) continue;
    if (showHighlightedOnly && currentView === "list" && !highlightedSessions.has(i)) continue;
    if (forDay && s.day !== forDay) continue;
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
  const prefix = section === "mwc" ? "mwc-barcelona" : "mwc-talent-arena";
  const suffix = day ? `mar${day}` : 'all';
  downloadBlob(ics, `${prefix}-${suffix}.ics`);
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

  const days = sectionDays();
  const dayCounts = {};
  let total = 0;
  for (const d of days) {
    dayCounts[d] = computeExportIndices(d).length;
    total += dayCounts[d];
  }
  const ctx = getExportContext();
  const contextStr = ctx ? ` (${ctx})` : '';

  document.getElementById('exportSummary').textContent =
    `${total} session${total !== 1 ? 's' : ''} matching current filters${contextStr}`;

  const btns = document.getElementById('exportButtons');
  const currentDay = parseInt(dayFilter);
  let btnsHtml = '';
  for (const d of days) {
    btnsHtml += `<button class="export-btn${currentDay === d ? ' current' : ''}" onclick="exportDay(${d})">Mar ${d} (${dayCounts[d]})</button>`;
  }
  const allLabel = days.length === 2 ? "Both days" : "All days";
  btnsHtml += `<button class="export-btn export-btn-both" onclick="exportDay(null)">${allLabel} (${total})</button>`;
  btns.innerHTML = btnsHtml;

  el.classList.add('open');
  setTimeout(() => {
    document.addEventListener('keydown', _escHandler);
    document.addEventListener('click', _outsideHandler);
  }, 0);
}

export function exportDay(day) {
  doExport(day);
}
