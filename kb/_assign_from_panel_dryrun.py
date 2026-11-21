#!/usr/bin/env python3
"""Dry run: what the daily export does with a course from the Needs an M-ID pile once a person assigns it.

WHY. Assign from the panel (commons lane, the Closest M-ID paragraph; `d-assign-from-panel-waits-on-the-build-2026-11-20`)
saves the row SkyView's re-home writes: kb_curation `CN:<control number>` `merge_into` <target>. Every such row so far
moved a course that already sat in the identity file. A pile course sits outside it (no M-ID, no C-ID, no CCN), so
before the control ships this measures what the export does with one: does the course join its target's local
courses, does the target keep its fields, does a new common course minted from a pile course carry a subject, units
and credit status, and does anything else move.

WHAT IT DOES. Nothing is written to Supabase or to kb/. It copies the curation overlay, adds sample assignments to the
copy, runs export_unified_courses() twice through its UC_KB_DIR / UC_OUT_DIR seam (today's overlay, then the copy) and
compares the two outputs:
  existing   every Strong match in kb/coci_closest_mid.json, assigned to its first recommendation;
  mint       the first --mint No strong match courses, each assigned to a new common course of its own
             (`UC-CUR-EXTDRY<n>`, titled with the course's own title), the row SkyView's "mint a new standalone" writes.
A control number that names more than one course in the state list is left out and counted: the key cannot say which.

Usage: python3 kb/_assign_from_panel_dryrun.py --tmp <an empty or new directory> [--mint 12] [--out <result.json>]
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REVIEWER = "assign-dryrun@bot"
STAMP = "2026-11-20T00:00:00+00:00"
_EXPORT = ("import sys, os; sys.path.insert(0, {root!r}); os.chdir({root!r}); "
           "import excel_to_dashboard as e; e.export_unified_courses()")
STRONG = (5, 6)
NONE = (0, 1, 2)


def js_payload(path: str):
    s = open(path, encoding="utf-8").read()
    i = s.index("=", s.index("window.")) + 1
    while s[i].isspace():
        i += 1
    return json.JSONDecoder().raw_decode(s, i)[0]


def state_list() -> dict:
    """control number -> the state list's rows for it, as the Courses List publishes them."""
    L = js_payload(os.path.join(ROOT, "coci_lookup_data.js"))
    cols = [str(c or "").strip() for c in L["colleges"]]
    out: dict = {}
    for r in L["rows"]:
        out.setdefault(str(r[1] or "").strip().upper(), []).append(
            {"college": cols[r[0]], "subj": str(r[2] or ""), "num": str(r[3] or ""), "title": str(r[4] or ""),
             "units": r[5], "credit": r[6], "top": str(r[7] or "").split(":")[0].strip(),
             "cid": str(r[8] or ""), "ccn": str(r[9] or "")})
    return out


def pick(mint_n: int):
    doc = json.load(open(os.path.join(HERE, "coci_closest_mid.json"), encoding="utf-8"))
    sl = state_list()
    existing, mint, shared = [], [], []
    for cn in sorted(doc["rows"]):
        conf, band, cands = doc["rows"][cn]
        key = cn.strip().upper()
        if len(sl.get(key, [])) != 1:
            if band in STRONG or band in NONE:
                shared.append(cn)
            continue
        if band in STRONG:
            existing.append({"cn": key, "target": cands[0][0], "course": sl[key][0]})
        elif band in NONE and len(mint) < mint_n:
            mint.append({"cn": key, "target": "UC-CUR-EXTDRY%02d" % (len(mint) + 1), "course": sl[key][0]})
    return doc, existing, mint, shared


def overlay_with(assignments, mint) -> dict:
    doc = json.load(open(os.path.join(HERE, "coci_curation.json"), encoding="utf-8"))
    cur = doc["curations"]
    for a in assignments + mint:
        k = "CN:" + a["cn"]
        if k in cur:
            raise SystemExit("ABORT: the overlay already holds " + k)
        cur[k] = {"merge_into": a["target"], "reviewed_by": REVIEWER, "reviewed_at": STAMP}
    for a in mint:
        if a["target"] in cur:
            raise SystemExit("ABORT: the overlay already holds " + a["target"])
        cur[a["target"]] = {"unified_title": a["course"]["title"], "reviewed_by": REVIEWER, "reviewed_at": STAMP}
    doc["count"] = len(cur)
    return doc


def run_exports(tmp: str, doc: dict):
    farm, before, after = (os.path.join(tmp, x) for x in ("kb_after", "before", "after"))
    for d in (farm, before, after):
        if os.path.exists(d):
            raise SystemExit("ABORT: %s exists; pass an empty --tmp" % d)
        os.makedirs(d)
    for name in os.listdir(HERE):
        if name != "coci_curation.json":
            os.symlink(os.path.join(HERE, name), os.path.join(farm, name))
    with open(os.path.join(farm, "coci_curation.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    procs = []
    for kdir, odir in ((HERE, before), (farm, after)):
        env = dict(os.environ, UC_KB_DIR=kdir, UC_OUT_DIR=odir)
        procs.append(subprocess.Popen([sys.executable, "-c", _EXPORT.format(root=ROOT)], env=env,
                                      stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True))
    for p in procs:
        _, err = p.communicate()
        if p.returncode:
            raise SystemExit("export failed: " + (err or "")[-600:])
    return before, after


def rows_of(odir: str) -> dict:
    out = {}
    for name in ("unified_courses_data.js", "unified_courses_standalone.js"):
        d = js_payload(os.path.join(odir, name))
        for r in (d.get("rows") or []):
            if isinstance(r, dict) and r.get("id"):
                out[r["id"]] = r
    return out


def members_of(odir: str) -> dict:
    return js_payload(os.path.join(odir, "unified_courses_members.js"))["members"]


FIELDS = ("kind", "id_system", "title", "disc", "credit", "units", "top", "subj")


def compare(before: str, after: str, existing, mint) -> dict:
    rb, ra = rows_of(before), rows_of(after)
    mb, ma = members_of(before), members_of(after)
    cn_home_b = {}
    for mid, rows in mb.items():
        for r in rows:
            if r.get("cn"):
                cn_home_b.setdefault(r["cn"], []).append(mid)
    cn_home_a = {}
    for mid, rows in ma.items():
        for r in rows:
            if r.get("cn"):
                cn_home_a.setdefault(r["cn"], []).append(mid)

    res = {"existing": {"assigned": len(existing), "joined_target": 0, "not_joined": [], "target_missing_after": [],
                        "target_field_changes": Counter(), "target_lost_reviewed": [], "examples": [],
                        "member_rows_off": []},
           "mint": {"assigned": len(mint), "row_present": 0, "course_joined": 0, "rows": []}}
    targets = set()
    for a in existing:
        t, cn = a["target"], a["cn"]
        targets.add(t)
        if t not in ra:
            res["existing"]["target_missing_after"].append({"cn": cn, "target": t})
            continue
        if t in cn_home_a.get(cn, []):
            res["existing"]["joined_target"] += 1
        else:
            res["existing"]["not_joined"].append({"cn": cn, "target": t, "homes_after": cn_home_a.get(cn, [])})
    for t in sorted(targets & set(ra)):
        # Every field of the target's row, by target: what one more local course does to a common course.
        b, r = rb.get(t) or {}, ra[t]
        for f in sorted(set(b) | set(r)):
            if b.get(f) != r.get(f):
                res["existing"]["target_field_changes"][f] += 1
                if len(res["existing"]["examples"]) < 12:
                    res["existing"]["examples"].append({"target": t, "field": f, "before": b.get(f), "after": r.get(f)})
        if (b.get("flags") or {}).get("reviewed") and not (r.get("flags") or {}).get("reviewed"):
            res["existing"]["target_lost_reviewed"].append(t)
        gained = len(ma.get(t, [])) - len(mb.get(t, []))
        if gained != sum(1 for a in existing if a["target"] == t):
            res["existing"]["member_rows_off"].append({"target": t, "gained": gained})
    res["existing"]["target_field_changes"] = dict(res["existing"]["target_field_changes"])
    res["existing"]["targets"] = len(targets)

    for a in mint:
        t, cn = a["target"], a["cn"]
        targets.add(t)
        r = ra.get(t)
        joined = t in cn_home_a.get(cn, [])
        res["mint"]["row_present"] += 1 if r else 0
        res["mint"]["course_joined"] += 1 if joined else 0
        res["mint"]["rows"].append({"cn": cn, "course": a["course"], "row": {f: (r or {}).get(f) for f in FIELDS} if r else None,
                                    "members": (r or {}).get("members"), "course_joined": joined})

    # Everything outside the targets must read the same in both runs.
    other = [i for i in sorted(set(rb) | set(ra)) if i not in targets and rb.get(i) != ra.get(i)]
    moved_cn = [cn for cn in sorted(set(cn_home_b) | set(cn_home_a))
                if cn_home_b.get(cn) != cn_home_a.get(cn) and cn not in {a["cn"] for a in existing + mint}]
    res["outside_the_targets"] = {"rows_changed": len(other), "first": other[:10],
                                  "other_courses_moved": len(moved_cn), "first_moved": moved_cn[:10]}
    res["rows"] = {"before": len(rb), "after": len(ra)}
    return res


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--tmp", required=True)
    ap.add_argument("--mint", type=int, default=12)
    ap.add_argument("--out")
    a = ap.parse_args(argv)
    doc, existing, mint, shared = pick(a.mint)
    before, after = run_exports(a.tmp, overlay_with(existing, mint))
    res = compare(before, after, existing, mint)
    res["_what"] = ("Simulated, not applied: export_unified_courses() run twice through its UC_KB_DIR / UC_OUT_DIR seam, "
                    "on today's curation overlay and on a copy with sample assignments from the Needs an M-ID pile.")
    res["closest_mid_file"] = {"identity_file": doc.get("identity_file"), "pile": doc.get("pile")}
    res["left_out_shared_control_number"] = len(shared)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump(res, f, indent=1, ensure_ascii=False)
            f.write("\n")
    e, m, o = res["existing"], res["mint"], res["outside_the_targets"]
    print("existing: %d assigned to %d targets; joined %d; target missing after %d; lost reviewed %d; "
          "member rows off %d; fields changed on a target's row %s"
          % (e["assigned"], e["targets"], e["joined_target"], len(e["target_missing_after"]),
             len(e["target_lost_reviewed"]), len(e["member_rows_off"]), e["target_field_changes"]))
    print("mint: %d assigned; row present %d; course joined %d" % (m["assigned"], m["row_present"], m["course_joined"]))
    for r in m["rows"][:4]:
        print("   ", r["cn"], r["course"]["subj"], r["course"]["num"], "->", r["row"])
    print("outside the targets: rows changed %d, other courses moved %d" % (o["rows_changed"], o["other_courses_moved"]))
    print("left out (a control number naming more than one course): %d" % res["left_out_shared_control_number"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
