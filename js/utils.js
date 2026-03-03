export function esc(text) {
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML.replace(/'/g, "&#39;");
}

export function parseTime(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function nowInBarcelona() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(new Date());
  const get = type => Number(parts.find(p => p.type === type).value);
  return { year: get("year"), month: get("month"), day: get("day"), hours: get("hour"), minutes: get("minute") };
}

export function initDragScroll() {
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
    el.addEventListener("click", e => { if (moved) { e.stopPropagation(); moved = false; } }, true);
  });
}

export function scrollToNowSlot() {
  const now = nowInBarcelona();
  const nowM = now.hours * 60 + now.minutes;
  const slots = document.querySelectorAll(".time-slot-heading, .tl-time-hdr");
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
