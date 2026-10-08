#!/usr/bin/env python3
"""ui_pass.py — the checkpoint's UI pass: one view per checkpoint, chosen by rule.

Sam, 2026-10-08, retiring the To-Do step: "Thinking of possibly adding a process in
checkpoint to pick one COBI surface to prioritize an UI audit and fix to ensure it's
wired to all dependent surfaces, maintains AA, is mobile friendly, and is First Light
formatted." Checkpoint step 9 runs it; /a11y-pass is the audit.

kb/ui_pass_ledger.json lists every view a person reads: each COBI tab in the nav of
index.html, and each standalone page a11y.config.js measures. A view carries the day
of its last pass and the outcome in a sentence, or a hold with its reason.

Usage, from the repo root:
  python3 scripts/ui_pass.py --check            the ledger lists every view, and only views
  python3 scripts/ui_pass.py --next             the view to audit now
  python3 scripts/ui_pass.py --wiring ID        the datasets the view reads, and the other
                                                views reading each one (kb/dependency_map.json)
  python3 scripts/ui_pass.py --record ID "..."  stamp today's pass and its outcome
  python3 scripts/ui_pass.py --sync             add views the nav or the config gained

The order --next takes: a public page before a COBI tab, never audited before audited,
then the oldest pass, then the ledger's own order (the nav's). A view on hold is
skipped. Guard: tests/ui_pass_test.py.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "kb", "ui_pass_ledger.json")
DEPS = os.path.join(ROOT, "kb", "dependency_map.json")
DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")
# Standalone pages anyone may open without a COBI phrase. SkyView is staff.
PUBLIC = {"sierra/index.html", "fact-sheet/index.html", "veteran-sprint-map/ca_cpl_map_selfcontained.html",
          "funding-model/index.html", "privacy.html"}


def nav_tabs(root=ROOT):
    """[(tab id, label)] in the order COBI's nav lists them."""
    with open(os.path.join(root, "index.html"), encoding="utf-8") as f:
        s = f.read()
    m = re.search(r'<nav[^>]*class="[^"]*cpl-tabs[^"]*"[^>]*>(.*?)</nav>', s, re.S)
    out = []
    for tab, label in re.findall(r'<button[^>]*class="cpl-tab[^"]*"[^>]*data-tab="([^"]+)"[^>]*>(.*?)</button>',
                                 m.group(1) if m else "", re.S):
        text = re.sub(r"<[^>]+>", "", label).replace("&amp;", "&")
        out.append((tab, re.sub(r"\s+", " ", text).strip()))
    return out


def standalone_pages(root=ROOT):
    """The pages a11y.config.js measures that are not COBI itself."""
    with open(os.path.join(root, "a11y.config.js"), encoding="utf-8") as f:
        s = f.read()
    seen = []
    for p in re.findall(r'\bfile:\s*"([^"]+\.html)"', s):
        if p != "index.html" and p not in seen:
            seen.append(p)
    return seen


def views(root=ROOT):
    """Every view the ledger must list: [(id, name, page, audience)]."""
    out = []
    for p in standalone_pages(root):
        name = {"sierra/index.html": "Sierra", "fact-sheet/index.html": "Fact Sheet",
                "veteran-sprint-map/ca_cpl_map_selfcontained.html": "Veteran map",
                "funding-model/index.html": "Funding model", "privacy.html": "Privacy",
                "prototype/skyview.html": "SkyView"}.get(p, p)
        out.append((p.split("/")[0].replace(".html", "") if p != "prototype/skyview.html" else "skyview",
                    name, p, "public" if p in PUBLIC else "staff"))
    for tab, label in nav_tabs(root):
        out.append(("cobi:" + tab, label, "index.html#" + tab, "staff"))
    return out


def load(path=LEDGER):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save(q, path=LEDGER):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(q, f, indent=1, ensure_ascii=False)
        f.write("\n")


def faults(q, root=ROOT):
    """Every way the ledger falls short; [] when it is sound."""
    out = []
    rows = q.get("surfaces") if isinstance(q, dict) else None
    if not isinstance(rows, list):
        return ["surfaces must be a list"]
    want = {v[0]: v for v in views(root)}
    have = {}
    for i, r in enumerate(rows):
        w = "surfaces[%d]" % i
        if not isinstance(r, dict) or not r.get("id"):
            out.append(w + " must be an object with an id")
            continue
        if r["id"] in have:
            out.append(w + ": " + r["id"] + " is listed twice")
        have[r["id"]] = r
        if r["id"] not in want:
            out.append(r["id"] + " is no view (not in COBI's nav, not a page a11y.config.js measures)")
        if r.get("last") is not None and not (isinstance(r["last"], str) and DAY.match(r["last"])):
            out.append(r["id"] + ".last must be a date, YYYY-MM-DD, or null")
        if r.get("last") and not (isinstance(r.get("outcome"), str) and r["outcome"].strip()):
            out.append(r["id"] + " has a pass with no outcome")
        if r.get("hold") is not None and not (isinstance(r["hold"], str) and r["hold"].strip()):
            out.append(r["id"] + ".hold must be its reason in words")
    for vid in want:
        if vid not in have:
            out.append(vid + " is a view the ledger does not list (run --sync)")
    return out


def rank(rows):
    """The ledger's rows in the order --next takes them, holds left out."""
    idx = {r["id"]: i for i, r in enumerate(rows)}
    live = [r for r in rows if not r.get("hold")]
    return sorted(live, key=lambda r: (r.get("audience") != "public", r.get("last") is not None,
                                       r.get("last") or "", idx[r["id"]]))


def wiring(view_id, deps=None, root=ROOT):
    """{dataset: [other views reading it]} for the view's datasets."""
    if deps is None:
        with open(DEPS, encoding="utf-8") as f:
            deps = json.load(f)
    page = None
    tab = view_id[5:] if view_id.startswith("cobi:") else None
    if not tab:
        page = {v[0]: v[2] for v in views(root)}.get(view_id)

    def reads(c):
        return (tab and tab in (c.get("tabs") or [])) or (page and page in (c.get("pages") or []))

    out = {}
    for name, d in (deps.get("datasets") or {}).items():
        if name.startswith("external:www.w3.org"):
            continue  # an SVG namespace, not data
        cons = d.get("consumers") or []
        if not any(reads(c) for c in cons):
            continue
        others = []
        for c in cons:
            for t in c.get("tabs") or []:
                if t != tab and ("cobi:" + t) not in others:
                    others.append("cobi:" + t)
            for p in c.get("pages") or []:
                if p != page and p not in others:
                    others.append(p)
        out[name] = sorted(others)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--next", action="store_true")
    ap.add_argument("--sync", action="store_true")
    ap.add_argument("--wiring", metavar="ID")
    ap.add_argument("--record", nargs=2, metavar=("ID", "OUTCOME"))
    ap.add_argument("--path", default=LEDGER)
    a = ap.parse_args(argv)
    q = load(a.path)
    if a.sync:
        have = {r["id"] for r in q["surfaces"]}
        for vid, name, page, aud in views():
            if vid not in have:
                q["surfaces"].append({"id": vid, "name": name, "page": page, "audience": aud,
                                      "last": None, "outcome": None})
                print("ui_pass: added " + vid)
        save(q, a.path)
    if a.record:
        vid, outcome = a.record
        row = next((r for r in q["surfaces"] if r["id"] == vid), None)
        if row is None:
            print("ui_pass: no view " + vid)
            return 1
        row["last"] = dt.date.today().isoformat()
        row["outcome"] = outcome.strip()
        save(q, a.path)
        print("ui_pass: recorded " + vid + " " + row["last"])
    if a.next:
        order = rank(q["surfaces"])
        if not order:
            print("ui_pass: every view is on hold")
            return 1
        r = order[0]
        print("ui_pass: next " + r["id"] + " (" + r["name"] + ", " + r["page"] + "); last pass " +
              (r.get("last") or "never"))
    if a.wiring:
        w = wiring(a.wiring)
        print("ui_pass: " + a.wiring + " reads " + str(len(w)) + " datasets")
        for name, others in sorted(w.items()):
            print("  " + name + " -> " + (", ".join(others) if others else "no other view"))
    bad = faults(q)
    for b in bad:
        print("ui_pass: " + b)
    if a.check and not bad:
        print("ui_pass: ok (" + str(len(q["surfaces"])) + " views, " +
              str(sum(1 for r in q["surfaces"] if r.get("last"))) + " passed, " +
              str(sum(1 for r in q["surfaces"] if r.get("hold"))) + " on hold)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
