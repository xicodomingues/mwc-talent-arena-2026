#!/usr/bin/env python3
"""Post-process raw scraped sessions into clean structured data.

Reads: mwc_raw_sessions.json, mwc_api_map.json
Writes: mwc_sessions_clean.json
"""

import json
import re
import unicodedata

KNOWN_STAGES = {
    "XPRO stage", "XPRO Lab", "XPRO Talks", "Visionary Stage",
    "Hotspot Talks", "Plug-in Talks", "Focus Lab", "Frontier lab",
    "Meetup area", "Barcelona", "Skills Hub", "Skills hub", "Robotics", "Gaming",
    "TECHNICAL DEV DIVES",
}
KNOWN_TOPICS = {
    "Artificial Intelligence", "Software Development", "Cloud Computing",
    "Cybersecurity", "Future Trends", "Management", "ROBOTICS", "GAMING",
}
LANGUAGES = {"English", "Spanish", "Catalan"}


def normalize_title(title):
    t = unicodedata.normalize("NFKD", title.lower())
    t = re.sub(r"[^a-z0-9\s]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def classify_heading(text):
    """Return (field, value) for a heading text."""
    if re.match(r"March \d+$", text):
        n = int(re.search(r"\d+", text).group())
        return "day", n
    if re.match(r"\d{2}:\d{2}(-\d{2}:\d{2})?$", text):
        return "time", text
    if text in KNOWN_STAGES or text == "Skills hub":
        return "stage", "Skills Hub" if text == "Skills hub" else text
    if text in KNOWN_TOPICS:
        return "tag", text
    if text in LANGUAGES:
        return "lang", text
    if text == "/":
        return "skip", text
    return "other", text


def parse_bio(text):
    """Parse '1. Name – Role at Company' into {name, role}."""
    m = re.match(r"\d+\.\s*(.+)", text)
    if not m:
        return None
    bio = m.group(1).strip()
    parts = re.split(r"\s*[\u2013\u2014–—]\s*", bio, maxsplit=1)
    return {"name": parts[0].strip(), "role": parts[1].strip() if len(parts) > 1 else ""}


def is_bio_line(text):
    """Check if a paragraph looks like a numbered speaker bio."""
    return bool(re.match(r"\d+\.\s*[A-ZÀ-ÿ]", text))


def split_concatenated_bios(text):
    """Split '1. Name – Role2. Name – Role3. Name – Role' into individual bios."""
    # Split on number+dot that's preceded by non-whitespace (concatenated)
    parts = re.split(r"(?<=\S)(\d+)\.\s*", text)
    if len(parts) <= 1:
        return [text]
    # Reconstruct: parts = ['1. first...', '2', 'second...', '3', 'third...']
    # Actually re.split with group: ['', '1', 'first...2', '3', 'third...'] - not right
    # Better: just re-find all with findall
    bios = re.findall(r"\d+\.\s*[A-ZÀ-ÿ][^0-9]*?(?=\d+\.\s*[A-ZÀ-ÿ]|$)", text)
    return bios if bios else [text]


def clean_session(raw, api_map):
    """Transform a raw session into clean structured data."""

    # ── Route headings ──
    day = 0
    time_parts = []
    stage = ""
    tags = []
    lang = ""
    other_headings = []

    for h in raw["headings"]:
        field, val = classify_heading(h)
        if field == "day":
            day = val
        elif field == "time":
            time_parts.append(val)
        elif field == "stage":
            stage = val
        elif field == "tag":
            tags.append(val)
        elif field == "lang":
            lang = val
        elif field == "other":
            other_headings.append(val)

    time = "-".join(time_parts)

    # ── Title ──
    title = raw["title"]

    # ── Speakers from text_editor paragraphs (numbered bios) ──
    paragraphs = raw["text_editor_paragraphs"]

    # Deduplicate paragraphs (some sessions have bios listed twice)
    seen = []
    for p in paragraphs:
        if p not in seen:
            seen.append(p)
    paragraphs = seen

    # Some sessions have all bios concatenated in one paragraph.
    # Expand those before processing.
    expanded = []
    for p in paragraphs:
        if is_bio_line(p) and re.search(r"\d+\.\s*[A-ZÀ-ÿ].*\d+\.\s*[A-ZÀ-ÿ]", p):
            expanded.extend(split_concatenated_bios(p))
        else:
            expanded.append(p)
    paragraphs = expanded

    # Deduplicate again after expansion
    seen = []
    for p in paragraphs:
        if p not in seen:
            seen.append(p)
    paragraphs = seen

    # Now separate bio paragraphs from description paragraphs
    speakers = []
    desc_parts = []
    for p in paragraphs:
        if is_bio_line(p) and not desc_parts:
            bio = parse_bio(p)
            if bio:
                speakers.append(bio)
            else:
                desc_parts.append(p)
        else:
            desc_parts.append(p)

    description = " ".join(desc_parts)

    # ── If no bio speakers, use icon_list ──
    if not speakers:
        icon_names = raw["icon_list"]
        role = raw["icon_list_heading"]
        if icon_names:
            if len(icon_names) == 1 and re.match(r"\d+ Speakers?$", icon_names[0]):
                # Placeholder — no individual names available
                speakers = []
            else:
                speakers = [{"name": n, "role": role} for n in icon_names]

    # ── API merge ──
    key = normalize_title(title)
    api = api_map.get(key, {})
    if api.get("lang"):
        lang = api["lang"]
    if api.get("stage"):
        stage = api["stage"]
    if api.get("topics"):
        tags = api["topics"]
    if api.get("day") and not day:
        day = api["day"]

    return {
        "day": day,
        "time": time,
        "stage": stage,
        "title": title,
        "speakers": speakers,
        "description": description,
        "tags": tags,
        "lang": lang,
    }


if __name__ == "__main__":
    with open("mwc_raw_sessions.json") as f:
        raw_sessions = json.load(f)
    with open("mwc_api_map.json") as f:
        api_map = json.load(f)

    # Only day 3+4
    raw_sessions = [s for s in raw_sessions if any(h in ("March 3", "March 4") for h in s["headings"])]

    sessions = [clean_session(s, api_map) for s in raw_sessions]

    # Drop placeholder sessions
    before = len(sessions)
    sessions = [s for s in sessions if not s["title"].startswith("Coming Soon")]
    print(f"Dropped {before - len(sessions)} 'Coming Soon' placeholder sessions")

    # Clean "Coming Soon" from speaker names
    for s in sessions:
        s["speakers"] = [sp for sp in s["speakers"] if "Coming Soon" not in sp["name"]]

    # Strip nbsp from speaker names and roles
    for s in sessions:
        for sp in s["speakers"]:
            sp["name"] = sp["name"].replace("\xa0", " ").strip()
            sp["role"] = sp["role"].replace("\xa0", " ").strip()

    with open("mwc_sessions_clean.json", "w") as f:
        json.dump(sessions, f, indent=1, ensure_ascii=False)

    # Stats
    print(f"Sessions: {len(sessions)}")
    print(f"  Day 3: {sum(1 for s in sessions if s['day'] == 3)}")
    print(f"  Day 4: {sum(1 for s in sessions if s['day'] == 4)}")
    print(f"  With description: {sum(1 for s in sessions if s['description'])}")
    print(f"  With speakers: {sum(1 for s in sessions if s['speakers'])}")
    print(f"  With language: {sum(1 for s in sessions if s['lang'])}")
    print(f"  With stage: {sum(1 for s in sessions if s['stage'])}")
    print(f"  With tags: {sum(1 for s in sessions if s['tags'])}")
    print(f"  Bad desc (start '1.'): {sum(1 for s in sessions if s['description'].startswith('1.'))}")

    # Spot checks
    for frag in ("Claude Code", "Velocity Gap", "PLAI", "Vibecoding"):
        for s in sessions:
            if frag.lower() in s["title"].lower():
                print(f"\n--- {s['title'][:60]} ---")
                print(f"  {s['time']} | {s['stage']} | Day {s['day']}")
                print(f"  Speakers: {s['speakers']}")
                print(f"  Desc: {s['description'][:120]}")
                print(f"  Tags: {s['tags']}, Lang: {s['lang']}")
