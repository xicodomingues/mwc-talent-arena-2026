import { STAGE_COLORS, STAGE_ORDER } from './constants.js';
import { esc, parseTime, nowInBarcelona } from './utils.js';
import {
  SESSIONS, filteredIndices, hiddenSessions, highlightedSessions,
  showHighlightedOnly, showHidden, calHiddenStages, isStageFullyHidden
} from './state.js';

// ── Shared grid helpers ──

function getStagesForDay(day, indices) {
  const allDayIndices = [];
  for (let i = 0; i < SESSIONS.length; i++) {
    if (SESSIONS[i].day == day) allDayIndices.push(i);
  }
  const stagesPresent = [];
  for (const st of STAGE_ORDER) {
    if (allDayIndices.some(i => SESSIONS[i].stage === st)) {
      if (!calHiddenStages.has(st) && !isStageFullyHidden(st, indices)) stagesPresent.push(st);
      else if (showHidden) stagesPresent.push(st);
    }
  }
  return { stagesPresent, allDayIndices };
}

function getTimeRange(indices) {
  let minT = 1440, maxT = 0;
  for (const i of indices) {
    const [start, end] = SESSIONS[i].time.split("-");
    const s = parseTime(start), e = parseTime(end);
    if (s < minT) minT = s;
    if (e > maxT) maxT = e;
  }
  return { minT: Math.floor(minT / 30) * 30, maxT: Math.ceil(maxT / 30) * 30 };
}

function getNowState() {
  const now = nowInBarcelona();
  return {
    isEventMonth: now.month === 3 && now.year === 2026,
    nowDay: now.day,
    nowM: now.hours * 60 + now.minutes
  };
}

function eventClasses(idx, startM, endM, day, isStageHidden, nowState) {
  const isHidden = hiddenSessions.has(idx);
  const isHighlighted = highlightedSessions.has(idx);
  const isDimmed = showHighlightedOnly && !isHighlighted;
  const midM = (startM + endM) / 2;
  const isPast = nowState.isEventMonth && (nowState.nowDay > day || (nowState.nowDay == day && nowState.nowM >= midM));
  const isOngoing = nowState.isEventMonth && nowState.nowDay == day && startM <= nowState.nowM && nowState.nowM < midM;

  let cls = "";
  if (isHidden) cls += " hidden-session";
  if (isStageHidden) cls += " ev-stage-hidden";
  if (isHighlighted) cls += " highlighted-session";
  if (isDimmed) cls += " star-dimmed";
  if (isPast) cls += " ev-past";
  if (isOngoing) cls += " ev-ongoing";
  return cls;
}

// ── Calendar View ──

export function renderCalendar() {
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

function calendarDayHTML(day, indices) {
  const { stagesPresent } = getStagesForDay(day, indices);
  const { minT, maxT } = getTimeRange(indices);
  const nowState = getNowState();

  const ppm = 3;
  const headerH = 52;
  const timeCol = 50;
  const colW = 140;
  const totalW = timeCol + stagesPresent.length * colW;
  const bodyH = (maxT - minT) * ppm;
  const stageIdx = {};
  stagesPresent.forEach((st, i) => stageIdx[st] = i);

  let html = `<h2 class="day-heading">March ${day}</h2>`;
  html += `<div class="cal-wrapper"><div class="cal-grid" style="width:${totalW}px">`;

  // Sticky header
  html += `<div class="cal-header">`;
  html += `<div class="cal-header-corner"></div>`;
  for (const st of stagesPresent) {
    const c = STAGE_COLORS[st] || "#888";
    const isHiddenStage = calHiddenStages.has(st);
    html += `<div class="cal-stage-hdr${isHiddenStage ? " cal-stage-hidden" : ""}" style="width:${colW}px;--hdr-color:${c}" onclick="toggleCalStage('${esc(st)}')" title="${isHiddenStage ? "Click to show" : "Click to hide"}"><span>${esc(st)}<small class="cal-hdr-hint">${isHiddenStage ? "tap to show" : "tap to hide"}</small></span></div>`;
  }
  html += `</div>`;

  // Body
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
  for (const idx of indices) {
    const s = SESSIONS[idx];
    if (!(s.stage in stageIdx)) continue;
    const isStageHidden = calHiddenStages.has(s.stage);
    const [startStr, endStr] = s.time.split("-");
    let startM = parseTime(startStr), endM = parseTime(endStr);
    if (endM <= startM) endM = startM + 30;
    const y = (startM - minT) * ppm + padTop;
    const h = Math.max((endM - startM) * ppm - 2, 4);
    const left = timeCol + stageIdx[s.stage] * colW + 2;
    const w = colW - 4;
    const c = STAGE_COLORS[s.stage] || "#888";
    const co = s.company || "";
    const cls = eventClasses(idx, startM, endM, day, isStageHidden, nowState);

    html += `<div class="cal-ev${cls}" onclick="showModal(${idx})" style="top:${y}px;left:${left}px;width:${w}px;height:${h}px;background:color-mix(in srgb,${c} 18%,var(--surface2));border-left:3px solid ${c};--card-color:${c}" title="${esc(s.time + ' | ' + s.stage + '\n' + s.title)}">`;
    html += `<b>${esc(s.title)}</b>`;
    if (co) html += `<div class="ev-spk">${esc(co)}</div>`;
    html += `</div>`;
  }

  // Now line
  if (nowState.isEventMonth && nowState.nowDay == day) {
    if (nowState.nowM >= minT && nowState.nowM <= maxT) {
      const nowY = (nowState.nowM - minT) * ppm + padTop;
      html += `<div class="cal-now-line" data-now-offset="${nowY}" style="top:${nowY}px;left:${timeCol}px;width:${totalW - timeCol}px"></div>`;
    }
  }

  html += `</div>`; // cal-body
  html += `</div></div>`; // cal-grid, cal-wrapper
  return html;
}

// ── Timeline View ──

export function renderTimeline() {
  const el = document.getElementById("content");
  if (!filteredIndices.length) { el.innerHTML = '<p style="text-align:center;color:var(--text3);padding:3rem">No sessions match your filters.</p>'; return; }

  const ppm = 5;
  const rowH = 44;
  const labelW = 110;
  const nowState = getNowState();

  const days = [...new Set(filteredIndices.map(i => SESSIONS[i].day))].sort();
  let html = "";
  for (const day of days) {
    html += `<h2 class="day-heading">March ${day}</h2>`;
    const dayIndices = filteredIndices.filter(i => SESSIONS[i].day === day);

    const { stagesPresent, allDayIndices } = getStagesForDay(day, dayIndices);
    const { minT, maxT } = getTimeRange(dayIndices);

    // Collect all stages for legend (including hidden)
    const stagesAllTl = [];
    for (const st of STAGE_ORDER) {
      if (allDayIndices.some(i => SESSIONS[i].stage === st)) stagesAllTl.push(st);
    }

    const padLeft = 10;
    const bodyW = (maxT - minT) * ppm + padLeft;
    const totalW = labelW + bodyW;
    const bodyH = stagesPresent.length * rowH;
    const stageIdx = {};
    stagesPresent.forEach((st, i) => stageIdx[st] = i);

    html += `<div class="tl-wrapper"><div class="tl-grid" style="width:${totalW}px">`;

    // Time header
    html += `<div class="tl-header">`;
    html += `<div class="tl-header-corner" style="width:${labelW + padLeft}px;min-width:${labelW + padLeft}px"></div>`;
    for (let t = minT; t < maxT; t += 30) {
      const w = 30 * ppm;
      const label = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
      html += `<div class="tl-time-hdr" style="width:${w}px">${label}</div>`;
    }
    html += `</div>`;

    // Body
    html += `<div class="tl-body" style="position:relative">`;

    // Gridlines
    html += `<div class="tl-gridlines" style="position:absolute;top:0;left:0;width:100%;height:${bodyH}px;pointer-events:none">`;
    for (let t = minT; t <= maxT; t += 30) {
      const x = labelW + padLeft + (t - minT) * ppm;
      html += `<div class="tl-gridline" style="left:${x}px;top:0;height:${bodyH}px"></div>`;
    }
    if (nowState.isEventMonth && nowState.nowDay == day && nowState.nowM >= minT && nowState.nowM <= maxT) {
      const nowX = labelW + padLeft + (nowState.nowM - minT) * ppm;
      html += `<div class="tl-now-line" style="left:${nowX}px;top:0;height:${bodyH}px"></div>`;
    }
    html += `</div>`;

    // Stage rows
    for (let i = 0; i < stagesPresent.length; i++) {
      const st = stagesPresent[i];
      const c = STAGE_COLORS[st] || "#888";
      const isStageHidden = calHiddenStages.has(st);
      const bg = i % 2 === 1 ? "rgba(255,255,255,0.02)" : "transparent";
      html += `<div class="tl-row${isStageHidden ? " tl-row-hidden" : ""}" style="height:${rowH}px;background:${bg}">`;
      html += `<div class="tl-row-label" style="width:${labelW}px;min-width:${labelW}px;border-right:2px solid ${c}" onclick="toggleCalStage('${esc(st)}')" title="${isStageHidden ? "Click to show" : "Click to hide"} ${esc(st)}"><span class="tl-label-dot" style="background:${c}"></span><span class="tl-label-text">${esc(st)}</span></div>`;
      html += `<div class="tl-row-events" style="position:relative;height:${rowH}px;flex:1">`;
      for (const idx of dayIndices) {
        const s = SESSIONS[idx];
        if (s.stage !== st) continue;
        const c2 = STAGE_COLORS[s.stage] || "#888";
        const [startStr, endStr] = s.time.split("-");
        let startM = parseTime(startStr), endM = parseTime(endStr);
        if (endM <= startM) endM = startM + 30;
        const x = padLeft + (startM - minT) * ppm;
        const w = Math.max((endM - startM) * ppm - 4, 20);
        const cls = eventClasses(idx, startM, endM, day, isStageHidden, nowState);
        html += `<div class="tl-ev${cls}" onclick="showModal(${idx})" style="top:2px;left:${x}px;width:${w}px;height:${rowH - 4}px;background:color-mix(in srgb,${c2} 18%,var(--surface2));border-left:3px solid ${c2};--card-color:${c2}" title="${esc(s.time + ' | ' + s.stage + '\n' + s.title)}"><span class="tl-ev-text">${esc(s.title)}</span></div>`;
      }
      html += `</div>`; // tl-row-events
      html += `</div>`; // tl-row
    }

    html += `</div>`; // tl-body
    html += `</div></div>`; // tl-grid, tl-wrapper

    // Legend
    html += `<div class="tl-legend">`;
    for (const stage of stagesAllTl) {
      const c = STAGE_COLORS[stage] || "#888";
      const isHiddenStage = calHiddenStages.has(stage) || isStageFullyHidden(stage, dayIndices);
      const cls = isHiddenStage ? " tl-legend-hidden" : "";
      const tip = isHiddenStage ? "Click to restore" : "Click to hide";
      html += `<span class="tl-legend-item${cls}" onclick="toggleCalStage('${esc(stage)}')" title="${tip}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;vertical-align:middle"></span>${esc(stage)}</span>`;
    }
    html += `</div>`;
  }
  el.innerHTML = html;
}
