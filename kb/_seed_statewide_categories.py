#!/usr/bin/env python3
"""Seed kb/statewide_exhibit_categories.json — statewide (CCC Collaborative)
exhibit title → program-area category, using the categories listed on the
Statewide CPL page (https://map.rccd.edu/statewidecpl/).

AI-assisted STAGING classification: titles come from the committed
statewide_data.js (the EACR export); each is assigned a category via the
keyword rules below. The output JSON is the editable source of truth — the
dashboard generator consumes the JSON, never these rules directly.

MERGE-PRESERVING: re-running keeps every existing title assignment in the
JSON (curator edits win) and only adds titles not yet mapped. Run from the
repo root after new statewide exhibits land:

    python3 kb/_seed_statewide_categories.py
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "statewide_exhibit_categories.json")

# Categories as listed on map.rccd.edu/statewidecpl/ (2026-06-11).
CATEGORIES = [
    "Administration of Justice",
    "Automotive Technology",
    "Computer Information Systems",
    "Construction Technology",
    "Corrections",
    "Emergency Medical Services",
    "Fire Technology",
    "Fire Technology - Wildland",
    "Kinesiology/Health",
    "Real Estate",
    "Welding",
    "World Languages",
]
FALLBACK = "Other Statewide"

# Ordered first-match-wins rules (casefolded). A leading "^" anchors the
# fragment to the start of the title; otherwise plain substring. Order
# matters: "AWS Certified" (Amazon) must resolve before the welding terms
# (American Welding Society "AWS D…"); EMT/Paramedic before the generic
# "fire"; Corrections before Administration of Justice's "post"; the broad
# building-trades bucket goes last. Anchors guard against lookalikes
# ("^ase " won't hit "Database…", "^cisco" won't hit "…San Francisco").
# These double as the generator's runtime fallback for future titles not
# yet in the seeded map.
PATTERNS = [
    ["^ase ",                   "Automotive Technology"],
    ["automotive",              "Automotive Technology"],
    ["aws certified",           "Computer Information Systems"],
    ["comptia",                 "Computer Information Systems"],
    ["^cisco",                  "Computer Information Systems"],
    ["ccna",                    "Computer Information Systems"],
    ["microsoft certified",     "Computer Information Systems"],
    ["azure",                   "Computer Information Systems"],
    ["cybersecurity",           "Computer Information Systems"],
    ["welder",                  "Welding"],
    ["welding",                 "Welding"],
    ["gtaw",                    "Welding"],
    ["gmaw",                    "Welding"],
    ["smaw",                    "Welding"],
    ["fcaw",                    "Welding"],
    ["asme bpvc",               "Welding"],
    ["wildland",                "Fire Technology - Wildland"],
    ["nwcg",                    "Fire Technology - Wildland"],
    ["paramedic",               "Emergency Medical Services"],
    ["^emt",                    "Emergency Medical Services"],
    [" emt",                    "Emergency Medical Services"],
    ["emergency medical",       "Emergency Medical Services"],
    ["fire",                    "Fire Technology"],
    ["correction",              "Corrections"],
    ["parole",                  "Corrections"],
    ["cdcr",                    "Corrections"],
    ["post basic",              "Administration of Justice"],
    ["post academy",            "Administration of Justice"],
    ["peace officer",           "Administration of Justice"],
    ["real estate",             "Real Estate"],
    ["dlpt",                    "World Languages"],
    ["defense language",        "World Languages"],
    ["language proficiency",    "World Languages"],
    ["basic military training", "Kinesiology/Health"],
    ["kinesiology",             "Kinesiology/Health"],
    ["personal trainer",        "Kinesiology/Health"],
    ["apprenticeship",          "Construction Technology"],
    ["contractor",              "Construction Technology"],
    ["nccer",                   "Construction Technology"],
    ["osha",                    "Construction Technology"],
    ["building inspector",      "Construction Technology"],
    ["plans examiner",          "Construction Technology"],
    ["building code",           "Construction Technology"],
    ["residential code",        "Construction Technology"],
    ["construction",            "Construction Technology"],
    ["masonry",                 "Construction Technology"],
    ["plumbing",                "Construction Technology"],
    ["carpentry",               "Construction Technology"],
    ["electrical",              "Construction Technology"],
    ["concrete",                "Construction Technology"],
    ["framing",                 "Construction Technology"],
]

IN_PROGRESS = ["HVAC — faculty currently meeting"]


def classify(title):
    key = title.strip().casefold()
    for frag, cat in PATTERNS:
        if frag.startswith("^"):
            if key.startswith(frag[1:]):
                return cat
        elif frag in key:
            return cat
    return FALLBACK


def load_statewide_titles():
    src = open(os.path.join(ROOT, "statewide_data.js"), encoding="utf-8").read()
    start = src.find("{", src.find("window.CPL_STATEWIDE"))
    data = json.loads(src[start:src.rfind("}") + 1])
    return sorted({e["unified_title"] for e in data["exhibits"]
                   if e.get("collaborative_type") == "CCC Collaborative"})


def main():
    existing = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            existing = json.load(f).get("titles", {})

    titles = load_statewide_titles()
    out_titles, added = {}, 0
    for t in titles:
        if t in existing:
            out_titles[t] = existing[t]  # curator edits win
        else:
            out_titles[t] = classify(t)
            added += 1
    # Keep any curated entries whose exhibit isn't in today's data (title
    # drift / data lag) — deleting them would lose curator work.
    for t, cat in existing.items():
        out_titles.setdefault(t, cat)

    payload = {
        "_comment": (
            "Statewide (CCC Collaborative) exhibit title -> program-area category, "
            "per the categories on https://map.rccd.edu/statewidecpl/. AI-assisted "
            "STAGING seed (kb/_seed_statewide_categories.py) — edit freely; re-runs "
            "preserve existing assignments and only add new titles. 'patterns' are "
            "the generator's runtime fallback for titles not listed here (first "
            "substring match wins, case-insensitive); unmatched titles land in "
            "'fallback'. Review queue: titles assigned to the fallback bucket."
        ),
        "categories": CATEGORIES,
        "fallback": FALLBACK,
        "in_progress": IN_PROGRESS,
        "titles": dict(sorted(out_titles.items())),
        "patterns": PATTERNS,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")

    counts = Counter(out_titles.values())
    print(f"Wrote {OUT}: {len(out_titles)} titles ({added} newly classified)")
    for cat in CATEGORIES + [FALLBACK]:
        n = counts.get(cat, 0)
        if n:
            print(f"  {cat}: {n}")
    leftover = [t for t, c in out_titles.items() if c == FALLBACK]
    if leftover:
        print(f"  Review queue ({FALLBACK}): {leftover}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
