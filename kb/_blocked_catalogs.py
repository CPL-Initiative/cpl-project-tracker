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
    """{title, hunt, colleges: [...], open, done, hunted, set_aside, local_courses, local_courses_open,
    still_taught_total, still_taught_open, courses, open_link} or None when the config is missing.

    Sam, 2026-11-20 (his work order, relayed by COBIx on #3584): blocked course outlines are no longer a priority,
    except the courses still taught, and those are named. So once the config lists its courses, a college is HUNTED
    only when it has a still-taught course, it is OPEN while hunted and not filed, and a college with none is SET
    ASIDE: kept in the list with its reason, off the to-do. Before the course list is filed (courses is null) every
    college is hunted, as S678 built it.

    S693: a course whose config row carries `answered` (what a person handed over for it, by whom and when) is not on
    the to-do. Each college's `still_taught` holds the courses still waiting, `answered` the ones a person answered,
    and a college is hunted only while it has a course still waiting."""
    cfg = _load(os.path.join(root, CONFIG))
    if not cfg:
        return None
    courses = cfg.get("courses")
    listed = isinstance(courses, list)
    # A course a person has answered (S693; Sam, 2026-11-20, worked all 12: eight catalog descriptions pasted, four
    # noted as not in the catalog) leaves the to-do and is listed as answered. Asking again for what a person already
    # gave is the failure CLAUDE.md names (no re-asking; a person's entry is terminal).
    by, done = {}, {}
    for x in courses or []:
        row = {"course": x.get("course"), "control_number": x.get("control_number"), "title": x.get("title")}
        a = x.get("answered")
        if isinstance(a, dict) and a.get("what"):
            done.setdefault(x.get("slug"), []).append(dict(row, what=a.get("what"), how=a.get("how"), by=a.get("by"),
                                                           on=a.get("on")))
        else:
            by.setdefault(x.get("slug"), []).append(row)
    rows = []
    for c in cfg.get("colleges") or []:
        slug = c["slug"]
        cap = _load(os.path.join(root, "kb/program_requirements_college", slug, "capture.json")) or {}
        filed = os.path.exists(os.path.join(root, FILED, slug + ".json"))
        mine = by.get(slug, [])
        rows.append({"slug": slug, "college": c["college"], "reason": c.get("reason"),
                     "catalog_url": cap.get("catalog_url"), "local_courses": c.get("local_courses"),
                     "filed": filed, "filed_file": (FILED + "/" + slug + ".json") if filed else None,
                     "still_taught": mine if listed else None, "answered": done.get(slug, []) if listed else None,
                     "hunted": bool(mine) if listed else True})
    hunted = [r for r in rows if r["hunted"]]
    still = [r for r in hunted if not r["filed"]]
    # A college whose still-taught courses a person has all answered is done, not set aside.
    answered = [r for r in rows if not r["hunted"] and r.get("answered")]
    return {"title": cfg.get("title"), "hunt": cfg.get("hunt"), "source": cfg.get("source"), "colleges": rows,
            "open": len(still), "done": len(hunted) - len(still) + len(answered),
            "hunted": len(hunted), "set_aside": len(rows) - len(hunted) - len(answered),
            "local_courses": sum(r["local_courses"] or 0 for r in rows),
            "local_courses_open": sum(r["local_courses"] or 0 for r in still),
            "still_taught_total": len(courses) if listed else cfg.get("still_taught_total"),
            "still_taught_open": sum(len(r["still_taught"] or []) for r in still) if listed else None,
            "still_taught_answered": sum(len(r["answered"] or []) for r in rows) if listed else None,
            "courses": courses, "file_in": FILED, "open_link": OPEN}


def queue_issue(root):
    """The Commons' Needs you item for the same hunt, or None when no hunted college is left to file."""
    s = status(root)
    if not s or not s["open"]:
        return None
    if s["still_taught_open"] is None:
        words = ("colleges whose sites block automated reading: find their catalog or course outlines "
                 "(%d local courses, %s still taught)" % (s["local_courses_open"], s["still_taught_total"]))
    else:
        words = ("colleges where %d still-taught courses need their course outline from a person"
                 % s["still_taught_open"])
    return {"n": s["open"], "words": words,
            "owner": "Sam (send the PDF to COBIx; a session files it in %s)" % FILED, "carry": "no_procedure", "open": OPEN}
