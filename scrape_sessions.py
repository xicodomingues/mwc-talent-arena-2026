#!/usr/bin/env python3
"""Scrape MWC Talent Arena 2026 sessions from HTML + WordPress REST API.

Step 1: Extract raw data from HTML exactly as structured — no regex, no cleanup.
Step 2: Merge taxonomy data from WP REST API.
"""

import json
import unicodedata
import re
import urllib.request
from bs4 import BeautifulSoup

BASE_URL = "https://talentarena.tech/agenda-2026/?e-page-5cf5700={}"
API_BASE = "https://talentarena.tech/wp-json/wp/v2"
POST_TYPES = ["talk", "conference", "meetup", "workshop", "robotics-gaming"]


def api_get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_page(n):
    req = urllib.request.Request(BASE_URL.format(n), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode("utf-8")


def parse_session(item):
    """Extract raw data from one e-loop-item, following the HTML structure exactly."""

    s = {
        "headings": [],
        "title": "",
        "icon_list": [],
        "icon_list_heading": "",
        "text_editor_paragraphs": [],
    }

    # Every heading widget → just grab the text
    for h in item.select('[data-widget_type="heading.default"]'):
        t = h.get_text(strip=True)
        if t:
            s["headings"].append(t)

    # Post title widget
    title_el = item.select_one('[data-widget_type="theme-post-title.default"]')
    if title_el:
        s["title"] = title_el.get_text(strip=True)

    # Icon list widget → each list item text
    icon = item.select_one('[data-widget_type="icon-list.default"]')
    if icon:
        for span in icon.select("span.elementor-icon-list-text"):
            t = span.get_text(strip=True)
            if t:
                s["icon_list"].append(t)

        # The heading in the same container as the icon list (speaker role)
        container = icon.find_parent(attrs={"data-element_type": "container"})
        if container:
            h = container.select_one('[data-widget_type="heading.default"]')
            if h:
                s["icon_list_heading"] = h.get_text(strip=True)

    # Text editor widget → each <p> or block as a separate entry
    te = item.select_one('[data-widget_type="text-editor.default"]')
    if te:
        # Get all <p> tags (most common structure)
        ps = te.find_all("p")
        if ps:
            for p in ps:
                t = p.get_text(strip=True)
                if t and t != "\xa0":
                    s["text_editor_paragraphs"].append(t)
        else:
            # Fallback: ewa-rteLine divs or just full text
            divs = te.select("div.ewa-rteLine")
            if divs:
                for d in divs:
                    t = d.get_text(strip=True)
                    if t:
                        s["text_editor_paragraphs"].append(t)
            else:
                t = te.get_text("\n", strip=True).replace("\xa0", "")
                if t:
                    s["text_editor_paragraphs"] = [l.strip() for l in t.split("\n") if l.strip()]

    return s


def scrape_html():
    all_items = []
    for page in range(1, 25):
        print(f"Page {page}...", end=" ")
        try:
            html = fetch_page(page)
        except Exception as e:
            print(f"failed: {e}")
            break
        items = BeautifulSoup(html, "html.parser").select("div.e-loop-item")
        if not items:
            print("empty, done.")
            break
        for item in items:
            raw = parse_session(item)
            if raw["title"]:
                all_items.append(raw)
        print(f"{len(items)}")
    return all_items


def build_api_map():
    print("Fetching API taxonomies...")
    lang_map = {t["id"]: t["name"] for t in api_get(f"{API_BASE}/idioma?per_page=100")}
    stage_map = {t["id"]: t["name"] for t in api_get(f"{API_BASE}/stage?per_page=100")}
    topic_map = {t["id"]: t["name"] for t in api_get(f"{API_BASE}/tematica?per_page=100")}
    day_map = {t["id"]: t["name"] for t in api_get(f"{API_BASE}/dia?per_page=100")}

    api_data = {}
    for pt in POST_TYPES:
        posts, page = [], 1
        while True:
            try:
                batch = api_get(f"{API_BASE}/{pt}?per_page=100&page={page}")
            except urllib.error.HTTPError:
                break
            if not batch:
                break
            posts.extend(batch)
            page += 1
        print(f"  {pt}: {len(posts)}")

        for post in posts:
            raw_title = post.get("title", {}).get("rendered", "")
            if not raw_title:
                continue
            raw_title = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), raw_title)
            raw_title = raw_title.replace("&amp;", "&")
            key = normalize_title(raw_title)

            resolve = lambda ids, m: [m[i] for i in ids if i in m and m[i] != "Coming Soon"]

            api_data[key] = {
                "lang": (resolve(post.get("idioma", []), lang_map) or [""])[0],
                "stage": (resolve(post.get("stage", []), stage_map) or [""])[0],
                "topics": resolve(post.get("tematica", []), topic_map),
                "day": 0,
            }
            for d in resolve(post.get("dia", []), day_map):
                dm = re.search(r"\d+", d)
                if dm:
                    api_data[key]["day"] = int(dm.group())

    print(f"  Total: {len(api_data)}")
    return api_data


def normalize_title(title):
    t = unicodedata.normalize("NFKD", title.lower())
    t = re.sub(r"[^a-z0-9\s]", "", t)
    return re.sub(r"\s+", " ", t).strip()


if __name__ == "__main__":
    api_map = build_api_map()
    raw_sessions = scrape_html()

    # Save raw HTML extraction
    with open("mwc_raw_sessions.json", "w") as f:
        json.dump(raw_sessions, f, indent=1, ensure_ascii=False)
    print(f"\nSaved {len(raw_sessions)} raw sessions to mwc_raw_sessions.json")

    # Save API map
    with open("mwc_api_map.json", "w") as f:
        json.dump(api_map, f, indent=1, ensure_ascii=False)
    print(f"Saved {len(api_map)} API entries to mwc_api_map.json")

    # Filter to day 3 and 4 only
    raw_sessions = [s for s in raw_sessions if any(h in ("March 3", "March 4") for h in s["headings"])]
    print(f"After filtering to day 3+4: {len(raw_sessions)}")

    with_paragraphs = sum(1 for s in raw_sessions if s["text_editor_paragraphs"])
    with_icons = sum(1 for s in raw_sessions if s["icon_list"])
    print(f"With text_editor paragraphs: {with_paragraphs}")
    print(f"With icon_list: {with_icons}")

    # Show a few samples
    for frag in ("Claude Code", "Velocity Gap", "PLAI"):
        for s in raw_sessions:
            if frag.lower() in s["title"].lower():
                print(f"\n--- {s['title'][:60]} ---")
                print(f"  headings: {s['headings']}")
                print(f"  icon_list: {s['icon_list']}")
                print(f"  icon_list_heading: {s['icon_list_heading']}")
                print(f"  paragraphs: {s['text_editor_paragraphs'][:5]}")
