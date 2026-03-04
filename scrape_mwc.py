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
    return {
        "day": day,
        "time": f'{hit["startsAt"]}-{hit["endAt"]}',
        "stage": hit.get("stage", ""),
        "hall": hit.get("hall", ""),
        "title": hit["title"],
        "track": hit.get("track", ""),
        "theme": hit.get("theme", ""),
        "interests": hit.get("interests", []),
        "access": hit.get("access", ""),
        "type": hit.get("type", ""),
        "sponsors": hit.get("sponsors", []),
        "url": hit.get("url", ""),
    }


if __name__ == "__main__":
    for day, date in [(4, "2026-03-04"), (5, "2026-03-05")]:
        print(f"Fetching {date}...", end=" ")
        hits = query_sessions(date)
        sessions = sorted(
            [map_hit(h, day) for h in hits],
            key=lambda s: s["time"],
        )
        fname = f"mwc_day{day}_sessions.json"
        with open(fname, "w") as f:
            json.dump(sessions, f, indent=1, ensure_ascii=False)
        print(f"{len(sessions)} sessions → {fname}")
