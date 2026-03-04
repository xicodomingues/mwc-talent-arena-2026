#!/usr/bin/env python3
"""Scrape MWC Barcelona 2026 sessions (March 4–5) via Algolia API."""

import json
import urllib.request

ALGOLIA_APP = "8VVB6VR33K"
ALGOLIA_KEY = "538e9741adb619fb2d54baacbee7e54f"
INDEX = "sessions-barcelonaMWC"
URL = f"https://{ALGOLIA_APP}-dsn.algolia.net/1/indexes/{INDEX}/query"

HEADERS = {
    "X-Algolia-Application-Id": ALGOLIA_APP,
    "X-Algolia-API-Key": ALGOLIA_KEY,
    "Content-Type": "application/json",
}


def query_sessions(date_str):
    body = json.dumps({
        "params": f'filters=date:"{date_str}"&hitsPerPage=200'
    }).encode()
    req = urllib.request.Request(URL, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
    return data["hits"]


def map_hit(hit, day):
    sponsors = hit.get("sponsors", [])
    sponsor_names = [sp["name"] for sp in sponsors if sp.get("name")]
    company = sponsor_names[0] if sponsor_names else ""
    return {
        "day": day,
        "time": f'{hit["startsAt"]}-{hit["endAt"]}',
        "stage": hit.get("stage", ""),
        "hall": hit.get("hall", ""),
        "title": hit["title"],
        "speakers": [],
        "description": "",
        "tags": [],
        "lang": "",
        "company": company,
        "companies": sponsor_names,
        "track": hit.get("track", ""),
        "theme": hit.get("theme", ""),
        "interests": hit.get("interests", []),
        "access": hit.get("access", ""),
        "type": hit.get("type", ""),
        "url": hit.get("url", ""),
        "source": "mwc",
    }


if __name__ == "__main__":
    all_sessions = []
    for day, date in [(4, "2026-03-04"), (5, "2026-03-05")]:
        print(f"Fetching {date}...", end=" ")
        hits = query_sessions(date)
        sessions = [map_hit(h, day) for h in hits]
        print(f"{len(sessions)} sessions")
        all_sessions.extend(sessions)

    all_sessions.sort(key=lambda s: (s["day"], s["time"], s["stage"]))

    # Write combined file
    with open("mwc_sessions.json", "w") as f:
        json.dump(all_sessions, f, indent=1, ensure_ascii=False)
    print(f"Total: {len(all_sessions)} sessions → mwc_sessions.json")

    # Also write per-day files for reference
    for day in [4, 5]:
        day_sessions = [s for s in all_sessions if s["day"] == day]
        fname = f"mwc_day{day}_sessions.json"
        with open(fname, "w") as f:
            json.dump(day_sessions, f, indent=1, ensure_ascii=False)
        print(f"  Day {day}: {len(day_sessions)} → {fname}")
