#!/usr/bin/env python3
"""scripts/library_publish.py's pure half: which records are due, and the update and receipt it makes.

    python3 tests/library_publish_test.py

A draft from the card is published only once a person approved it (Replace the public copy) or
asked for it at once; the new version becomes Current, the one before it Replaced, a Draft entry
for the same version is replaced, Changes to make and regen are cleared, and the receipt keeps the
before-values the guarded update is checked against (Rule 10 a2).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import library_publish as lp  # noqa: E402

fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


R = {"id": "r1", "slug": "ell-iet-cpl-starting-points", "version": "2", "updated_at": "2026-11-05T01:00:00+00:00",
     "refresh_note": "December 9", "url": "https://claude.ai/artifact/x",
     "versions": [{"label": "Version 1", "status": "Replaced by v2"}, {"label": "Version 2", "status": "Current"},
                  {"label": "Version 3", "status": "Draft: an earlier session's draft"}],
     "regen": {"requested_at": "t0", "requested_by": "Sam", "publish": "show", "ready_at": "t1", "draft_id": "d1",
               "approved_at": "t2", "approved_by": "Sam"}}
D = {"id": "d1", "summary": "Changed the agenda date.", "made_by": "Ashley"}

check(lp.due(R), "an approved draft from the card is due")
check(not lp.due({**R, "regen": {**R["regen"], "approved_at": None}}), "a draft no one approved is not")
check(lp.due({**R, "regen": {**R["regen"], "approved_at": None, "publish": "replace"}}), "a request to replace at once is due")
check(not lp.due({**R, "regen": {**R["regen"], "draft_id": None}}), "a session's draft (no draft_id) is the session's to publish")
check(not lp.due({**R, "regen": None}), "a record with no request is not")

u = lp.record_update(R, D, "2026-11-05")
cur = [v for v in u["versions"] if str(v.get("status", "")).startswith("Current")]
check(u.get("version") == "3", "the record moves to Version 3")
check(len(cur) == 1 and cur[0]["label"] == "Version 3" and "Changed the agenda date." in cur[0]["status"], "Version 3 is Current, with what changed")
check("Ashley" in cur[0]["status"] and "Sam" in cur[0]["status"], "it names who drafted it and who approved it")
check(any(v["label"] == "Version 2" and v["status"] == "Replaced by v3" for v in u["versions"]), "Version 2 reads Replaced by v3")
check(not any(str(v.get("status", "")).startswith("Draft") for v in u["versions"]), "the older Draft entry for Version 3 is replaced, not kept beside it")
check(u["refresh_note"] is None and u["regen"] is None, "Changes to make and the request are cleared")
check(u["url"] == lp.PAGES + "ell-iet-cpl-starting-points/", "the record links its Pages copy")
check(R["versions"][1]["status"] == "Current", "the record read is not changed in place")

rc = lp.receipt(R, D, u, "2026-11-05")
check(rc["before"]["updated_at"] == R["updated_at"], "the receipt keeps the updated_at the update is guarded on")
check(set(u) <= set(rc["before"]), "the receipt keeps a before-value for every field the update writes")
check(rc["page"] == "library/ell-iet-cpl-starting-points/index.html", "the receipt names the page it wrote")

if fails:
    print("\n%d check(s) failed" % len(fails))
    sys.exit(1)
print("\nall checks passed")
