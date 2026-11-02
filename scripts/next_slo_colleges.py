#!/usr/bin/env python3
"""next_slo_colleges.py: which college's course SLOs the nightly read takes next.

Sam, 2026-11-01, in chat: "yes to SLO hints and the nightly harvest" (cpl_memory
sam-slo-hints-and-nightly-harvest-2026-11-01): read course SLOs nightly as a CPL queue
step, the colleges that articulate the most exhibits first. Step 11 of
docs/reference/scheduled_sessions.md runs this script and does what it prints.

It reads committed files only, so it runs offline in a session:

  kb/exhibits_adoption.json            articulations: a college's count is the canonical
                                       credentials whose `a` names it
  kb/program_requirements_college/     each college's slug, catalog host and loaded records
                                       (the read takes its course codes from the records)
  kb/course_outline_census/            the newest census: each college's outline system,
                                       access and what one outline printed
  kb/course_outline_index/index_*.json curriQunet course indexes, by host
  kb/course_outcomes/                  filed reads and trials; queue.json, the verdicts the
                                       nightly step records (a host that prints none)
  kb/receipts/course_outcomes_*.json   loads: a college a receipt names is done

Each college gets one state, in this order: done, a verdict from queue.json, load (a
complete read is filed and not loaded), reading (part of a read is filed), reindex, read,
trial, index, or skip with the census's reason. The read is pages only: no model call,
no cost beyond a runner's minutes.

Usage, from the repo root:
  python3 scripts/next_slo_colleges.py            the queue, most articulations first
  python3 scripts/next_slo_colleges.py --next     the next college and its trigger file
  python3 scripts/next_slo_colleges.py --college SLUG   one college's state and trigger file
  python3 scripts/next_slo_colleges.py --next --skip a,b   pass over colleges with an open claude/slo- PR
  python3 scripts/next_slo_colleges.py --all      every college with its state and reason
  python3 scripts/next_slo_colleges.py --json     the same, as JSON
"""
from __future__ import annotations

import argparse
import glob
import importlib.util
import json
import math
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB = os.path.join(ROOT, "kb")
PAGES_PER_PART = 400        # a slice of about 40 minutes at the census's 3 s between loads
TRIAL_PAGES = 12
ACTIONS = ("load", "reading", "reindex", "read", "trial", "index")
VERDICTS = {"none", "held", "parser"}
CCCD = "catalog.cccd.edu"


def _json(path):
    with open(path) as f:
        return json.load(f)


def _record_codes(root=KB):
    """The read's own record_codes (one copy), pointed at root's harvest folders."""
    spec = importlib.util.spec_from_file_location("course_outline_index", os.path.join(KB, "_course_outline_index.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.HERE = root
    return mod.record_codes


def _run_of(path):
    m = re.search(r"_(\d+)\.json$", path)
    return int(m.group(1)) if m else 0


def articulations(root=KB):
    """College name -> the canonical credentials it has articulated."""
    d = _json(os.path.join(root, "exhibits_adoption.json"))
    names = d["colleges"]
    out = {n: 0 for n in names}
    for cred in d["credentials"].values():
        for i in cred.get("a") or {}:
            out[names[int(i)]] += 1
    return out


def colleges(root=KB):
    """College name -> its harvest folder: slug, catalog host, eLumen catalog."""
    out = {}
    for cap_path in sorted(glob.glob(os.path.join(root, "program_requirements_college", "*", "capture.json"))):
        slug = os.path.basename(os.path.dirname(cap_path))
        cap = _json(cap_path)
        host = urllib.parse.urlparse(cap.get("catalog_url") or "").netloc
        out[cap.get("college") or slug] = {"slug": slug, "catalog_host": host,
                                          "elumen": (cap.get("elumen") or {}).get("catalog")}
    return out


def census(root=KB):
    paths = sorted(glob.glob(os.path.join(root, "course_outline_census", "census_*.json")), key=_run_of)
    if not paths:
        return {}, None
    return {r["college"]: r for r in _json(paths[-1])["rows"]}, os.path.relpath(paths[-1], os.path.dirname(root))


def loaded(root=KB):
    """College names a load receipt inserted, and the host folders a load proved."""
    names, hosts = set(), set()
    for path in glob.glob(os.path.join(root, "receipts", "course_outcomes_*.json")):
        r = _json(path)
        keys = r.get("inserted_keys") or []
        names |= {k.get("college") for k in keys if k.get("college")}
        if keys:
            hosts.add(r.get("host"))
    return names, hosts


def filed(root=KB):
    """Reads (by slug: run -> parts) and trials (by slug: newest trial) filed under kb/course_outcomes/."""
    reads, trials = {}, {}
    for path in glob.glob(os.path.join(root, "course_outcomes", "*", "read*.json")):
        d = _json(path)
        slugs = [s for s in str(d.get("slugs") or "").split(",") if s]
        if os.path.basename(os.path.dirname(path)).startswith("trial_"):
            for s in slugs:
                if s not in trials or int(d.get("run") or 0) > int(trials[s].get("run") or 0):
                    trials[s] = {k: d.get(k) for k in ("run", "index", "summary", "complete", "wanted")}
                    trials[s]["rows"] = [{"status": r.get("status"), "shape": r.get("shape")} for r in d.get("rows") or []]
            continue
        for s in slugs:
            run = reads.setdefault(s, {}).setdefault(str(d.get("run")), {"of": d.get("of"), "complete": set(),
                                                                           "folder": os.path.basename(os.path.dirname(path))})
            if d.get("complete"):
                run["complete"].add(d.get("part"))
    return reads, trials


def indexes(root=KB):
    """curriQunet host -> its newest index file (path, coverage, report titles)."""
    out = {}
    for path in sorted(glob.glob(os.path.join(root, "course_outline_index", "index_*.json")), key=_run_of):
        d = _json(path)
        host = urllib.parse.urlparse(d.get("url") or "").netloc
        out[host] = {"path": os.path.relpath(path, os.path.dirname(root)), "coverage": d.get("coverage") or {},
                     "report_titles": d.get("report_titles") or [],
                     "wanted_with_outline": d.get("wanted_with_outline")}
    return out


def ledger(root=KB):
    path = os.path.join(root, "course_outcomes", "queue.json")
    return (_json(path).get("colleges") or {}) if os.path.exists(path) else {}


def trial_verdict(trial):
    """pass: half or more of the pages that answered print outcomes the reader parsed;
    none: no page did; partial: some did (read the filed pages before the full read)."""
    rows = [r for r in trial.get("rows") or [] if r.get("status") == 200]
    hits = sum(1 for r in rows if r.get("shape") in ("list", "paragraph", "groups"))
    if not rows or not hits:
        return "none", hits, len(rows)
    return ("pass" if hits * 2 >= len(rows) else "partial"), hits, len(rows)


def route_of(name, folder, cen):
    """How the read reaches a college's course pages: ("catalog", host folder) for a catalog
    that addresses each course by code (eLumen, the Coast district), ("index", curriQunet host)
    for a curriQunet dashboard, else (None, the reason)."""
    host = (folder or {}).get("catalog_host") or ""
    if host == CCCD:
        return "catalog", "cccd"
    if host.endswith("elumenapp.com") and (folder or {}).get("elumen"):
        return "catalog", host.split(".")[0].lower()
    row = cen.get(name) or {}
    system, access, outline = row.get("cor_system"), row.get("cor_access"), row.get("cor_outline")
    cq = urllib.parse.urlparse(row.get("cor_url") or "").netloc
    if cq.endswith(".curriqunet.com") and access == "public" and outline in ("outline_with_slos", "list_only"):
        return "index", cq
    if not row:
        return None, "the census has no row for it"
    if system == "none_found":
        return None, "the census found no course outline system"
    if cq.endswith(".curriqunet.com") and outline == "outline":
        return None, "the census's %s outline printed no SLO heading" % cq
    if system == "elumen":
        return None, "its eLumen catalog is not the catalog its harvest capture names"
    if outline in ("sign_in", "refused", "unreached") or access in ("sign_in", "refused", "unreached"):
        return None, "the census recorded %s at %s" % (outline or access, cq or system)
    return None, "the read has no reader for %s (%s)" % (system, outline)


def title_pattern(title):
    """A report title as the index's report= pattern: regex characters escaped, spaces kept."""
    return re.sub(r"([.^$*+?{}\[\]\\|()])", r"\\\1", title)


def report_id(url):
    m = re.search(r"reportId=(\d+)", url or "")
    return int(m.group(1)) if m else None


def trigger(kind, slug, codes, host=None, index=None, trial=False, report=None):
    """The lines of the trigger file a session writes and pushes on its claude/ branch."""
    if kind == "index":
        lines = ["run=<today's date>", "discover=", "index=https://" + host + "/", "slugs=%s" % slug,
                 "report=%s" % (report or "")]
        return "kb/course_outline_index/.run", lines
    if kind == "load":
        return "kb/course_outcomes/.load", ["host=%s" % host]
    lines = ["catalog=%s" % slug] if index is None else ["index=%s" % index, "slugs=%s" % slug]
    lines.append("trial=%d" % TRIAL_PAGES if trial else "parts=%d" % max(1, math.ceil(codes / PAGES_PER_PART)))
    return "kb/course_outcomes/.run", lines


def queue(root=KB):
    arts = articulations(root)
    folders = colleges(root)
    cen, census_file = census(root)
    done, proven = loaded(root)
    reads, trials = filed(root)
    idx = indexes(root)
    notes = ledger(root)
    record_codes = _record_codes(root)
    out = []
    for name, n in arts.items():
        folder = folders.get(name)
        slug = (folder or {}).get("slug")
        row = {"college": name, "slug": slug, "articulations": n, "state": "skip", "why": None,
               "courses": len(record_codes([slug])[slug]) if slug else 0, "trigger": None}
        out.append(row)
        if name in done:
            row.update(state="done", why="course_outcomes holds its rows (a load receipt names it)")
            continue
        if slug in notes:
            v = notes[slug]
            row.update(state=v.get("state"), why="%s (%s, %s)" % (v.get("why"), v.get("by"), v.get("on")))
            continue
        if not folder:
            row["why"] = "no harvest folder: no loaded program records to take course codes from"
            continue
        if not row["courses"]:
            row["why"] = "its loaded records name no course code"
            continue
        kind, where = route_of(name, folder, cen)
        if kind is None:
            row["why"] = where
            continue
        filed_runs = reads.get(slug) or {}
        if filed_runs:
            run = max(filed_runs, key=int)
            r = filed_runs[run]
            got = len(r["complete"])
            if r["of"] and got >= r["of"]:
                row.update(state="load", why="read %s filed complete (%d of %d slices)" % (run, got, r["of"]),
                           trigger=trigger("load", slug, 0, host=r["folder"]))
            else:
                row.update(state="reading", why="read %s: %d of %s slices filed complete" % (run, got, r["of"]))
            continue
        index_file = None
        if kind == "index":
            have = idx.get(where)
            if not have or slug not in have["coverage"]:
                row.update(state="index", why="no course index for %s names it" % where,
                           trigger=trigger("index", slug, 0, host=where))
                continue
            index_file = have["path"]
            want = report_id((cen.get(name) or {}).get("cor_outline_url"))
            chosen = [t for t in have["report_titles"] if t.get("read")]
            listed = [t for t in have["report_titles"] if t.get("id") == want and not t.get("comparison")]
            if want and listed and want not in [t.get("id") for t in chosen]:
                row.update(state="reindex", why="the index read report %s; the census found SLOs on report %s (%s)"
                           % ([t.get("id") for t in chosen], want, listed[0].get("title")),
                           trigger=trigger("index", slug, 0, host=where, report="^%s$" % title_pattern(listed[0]["title"])))
                continue
        folder_name = where if kind == "catalog" else where.split(".")[0].lower()
        trial = trials.get(slug)
        if folder_name in proven or (trial and trial_verdict(trial)[0] == "pass"):
            why = "host %s proved by a load" % folder_name if folder_name in proven else \
                "trial %s parsed %d of %d pages" % ((trial or {}).get("run"), *trial_verdict(trial)[1:])
            row.update(state="read", why=why, trigger=trigger("read", slug, row["courses"], index=index_file))
            continue
        if trial:
            verdict, hits, pages = trial_verdict(trial)
            row.update(state="trial", why="trial %s: %s, %d of %d pages parsed; record a verdict in queue.json"
                       % (trial.get("run"), verdict, hits, pages))
            continue
        row.update(state="trial", why="host %s unproven: 12 pages first" % folder_name,
                   trigger=trigger("trial", slug, row["courses"], index=index_file, trial=True))
    out.sort(key=lambda r: (-r["articulations"], r["college"]))
    return out, census_file


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--all", action="store_true", help="every college, with its state and reason")
    ap.add_argument("--next", action="store_true", help="the next college and its trigger file")
    ap.add_argument("--college", default="", help="one college (its harvest slug): state and trigger file")
    ap.add_argument("--skip", default="", help="slugs to pass over, comma-separated (an open claude/slo-<slug> PR)")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--top", type=int, default=12)
    a = ap.parse_args(argv)
    rows, census_file = queue()
    skip = {x.strip() for x in a.skip.split(",") if x.strip()}
    todo = [r for r in rows if r["state"] in ACTIONS and r["slug"] not in skip]
    if a.json:
        print(json.dumps({"census": census_file, "queue": todo, "all": rows if a.all else None}, indent=1))
        return 0
    if a.next or a.college:
        pick = [r for r in rows if r["slug"] == a.college] if a.college else todo[:1]
        if not pick:
            print("no harvest folder is named %s" % a.college if a.college else
                  "The queue is empty: every college is done, has a verdict, or has no route (step 11's stop rule).")
            return 0 if a.next else 1
        r = pick[0]
        print("%s (%s): %d articulations, %d course codes in its loaded records" % (r["college"], r["slug"], r["articulations"], r["courses"]))
        print("state: %s; %s" % (r["state"], r["why"]))
        if r["trigger"]:
            path, lines = r["trigger"]
            print("write %s:" % path)
            for line in lines:
                print("  " + line)
        return 0
    show = rows if a.all else todo[:a.top]
    for i, r in enumerate(show, 1):
        print("%3d. %-36s %4d  %-8s %s" % (i, r["college"][:36], r["articulations"], r["state"], r["why"] or ""))
    counts = {}
    for r in rows:
        counts[r["state"]] = counts.get(r["state"], 0) + 1
    print("\n%d colleges: %s. Census: %s" % (len(rows), ", ".join("%s %d" % kv for kv in sorted(counts.items())), census_file))
    return 0


if __name__ == "__main__":
    sys.exit(main())
