#!/usr/bin/env python3
"""The blocked-catalog hunt: one to-do, read by both Commons builders (S678, COBIx's item 8 on #3464).

Sam, 2026-11-17: "Make sure those blocked catalogs and cors are on my cdc to do"; "To do should be on both cdc and
commons". kb/reference/blocked_catalog_hunt.json names the colleges; this module adds each college's catalog link (its
committed capture) and whether a person has filed its catalog or outlines (kb/hand_filed_catalogs/outlines/<slug>.json).
kb/_build_commons_data_status.py writes it into kb/status/commons_data.json (the College Data Collection page), and
kb/_build_commons_status.py turns the same status into one item on the Commons' Waiting on a person list. One source,
so filing a college clears it in both places on their next build.
"""
import json
import os

CONFIG = "kb/reference/blocked_catalog_hunt.json"
FILED = "kb/hand_filed_catalogs/outlines"
OPEN = "#commons/data"


def _load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def status(root):
    """{title, hunt, colleges: [...], open, done, local_courses, local_courses_open, still_taught_total, courses,
    open_link} or None when the config is missing."""
    cfg = _load(os.path.join(root, CONFIG))
    if not cfg:
        return None
    rows = []
    for c in cfg.get("colleges") or []:
        slug = c["slug"]
        cap = _load(os.path.join(root, "kb/program_requirements_college", slug, "capture.json")) or {}
        filed = os.path.exists(os.path.join(root, FILED, slug + ".json"))
        rows.append({"slug": slug, "college": c["college"], "reason": c.get("reason"),
                     "catalog_url": cap.get("catalog_url"), "local_courses": c.get("local_courses"),
                     "filed": filed, "filed_file": (FILED + "/" + slug + ".json") if filed else None})
    still = [r for r in rows if not r["filed"]]
    return {"title": cfg.get("title"), "hunt": cfg.get("hunt"), "source": cfg.get("source"), "colleges": rows,
            "open": len(still), "done": len(rows) - len(still),
            "local_courses": sum(r["local_courses"] or 0 for r in rows),
            "local_courses_open": sum(r["local_courses"] or 0 for r in still),
            "still_taught_total": cfg.get("still_taught_total"), "courses": cfg.get("courses"),
            "file_in": FILED, "open_link": OPEN}


def queue_issue(root):
    """The Commons' Waiting on a person item for the same hunt, or None when every college is filed."""
    s = status(root)
    if not s or not s["open"]:
        return None
    return {"n": s["open"], "words": "colleges whose sites block automated reading: find their catalog or course outlines "
                                     "(%d local courses, %s still taught)" % (s["local_courses_open"], s["still_taught_total"]),
            "owner": "Sam (file it in %s)" % FILED, "carry": "no_procedure", "open": OPEN}
