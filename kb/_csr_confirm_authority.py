#!/usr/bin/env python3
"""The Common Subjects Reference's nightly confirm of the picks on the authority's own code.

Sam, Open Asks Sheet 99 card 2 (16:37Z, 2026-10-19, his own call): on. The procedure in
kb/csr_procedures.json (`confirmation`) says what this does, in plain words: a pick is
confirmed when a person sets or accepts it on the tab; the nightly procedure confirms a pick
whose code equals the authority's own, CCN or C-ID, and that no finding holds back, under the
cohort csr-confirm-authority@bot, insert-only with a committed receipt, so a person's time
goes to the picks no authority settles. A pick on a code this reference minted waits for a
person, as before.

WHAT COUNTS. A pick qualifies when, in kb/discipline_canonical_subj4.json, the discipline's
canonical_source is `ccn` or `c-id` and its code is that authority's own (the CCN subject
code, or one of its C-ID subject codes), no person or cohort has confirmed it (no reviewed_by,
no curator_override), and the daily scan (kb/csr_out/latest.json) names it in no finding
except the two that corroborate: cs7_unreviewed is the unconfirmed state this clears, and
cs4_aligned is the alignment the pick rests on. A collision, a weak mnemonic, a modal choice
without a note or a squat holds the pick for a person.

RULE 10, ENFORCED HERE. A fresh read of the live picks at write time (a live code row for the
discipline, whoever wrote it, holds the save: a curator's word since the seed last synced, or
last night's); the INSERT ignores duplicates (the key is course_id, field); the receipt is
written BEFORE the INSERT under kb/csr_out/confirm/ and names every row, so `--undo` can take
the cohort's rows back in one DELETE and clear the seed's stamps the daily sync wrote from
them. Governance: DR-04 (kb/governance_surface_map.json maps csr-confirm.yml to it).

RUN IT ON A RUNNER (Supabase is egress-blocked from the agent sandbox): csr-confirm.yml,
nightly at 08:17 UTC after the daily run's first cron has re-synced the seed and re-run the
scan; `save=preview` lists what would be confirmed and writes no row.

    python3 kb/_csr_confirm_authority.py                  # the plan from the committed files, no network
    python3 kb/_csr_confirm_authority.py --save preview   # the plan against a fresh read, nothing written
    python3 kb/_csr_confirm_authority.py --save on        # the nightly run
    python3 kb/_csr_confirm_authority.py --undo           # take the cohort's rows back
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SEED = os.path.join(HERE, "discipline_canonical_subj4.json")
SCAN = os.path.join(HERE, "csr_out", "latest.json")
OUT_DIR = os.path.join(HERE, "csr_out", "confirm")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")

KEY_PREFIX = "_CANON_SUBJ4::"       # the tab's namespace in kb_curation (canonical_subj4.js)
FIELD_CANON = "canonical_subj4"
COHORT = "csr-confirm-authority@bot"
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
AUTHORITY_SOURCES = ("ccn", "c-id")
CORROBORATING = {"cs7_unreviewed", "cs4_aligned"}
PAGE = 1000                         # Rule 10b: kb_curation reads are Range-paginated (#718)
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}
RULING = ("Open Asks Sheet 99 card 2 (Sam, 2026-10-19 16:37Z, 'on'): the nightly procedure confirms "
          "the picks whose code is the authority's own, CCN or C-ID, under a cohort reviewer, "
          "insert-only with a receipt; a pick on a code this reference minted waits for a person")


# ── the plan ─────────────────────────────────────────────────────────────────

def authority_of(entry):
    """CCN or C-ID when the discipline's code is that authority's own; else None."""
    code = entry.get("canonical_subj4")
    if code and entry.get("ccn_subject_code") == code:
        return "CCN"
    if code and code in (entry.get("cid_subject_codes") or []):
        return "C-ID"
    return None


def is_confirmed(entry):
    return bool(entry.get("reviewed_by")) or entry.get("source") == "curator_override"


def plan(seed, scan, live=None):
    """The rows the procedure confirms tonight, and the picks it holds with the reason.

    `live` is the fresh read ({discipline: {field: row}}) or None for the offline plan."""
    findings = {}
    for f in (scan or {}).get("findings") or []:
        findings.setdefault(f.get("item"), []).append(f.get("rule"))
    rows, held, waiting = [], [], 0
    for disc, e in sorted((seed.get("disciplines") or {}).items()):
        code = e.get("canonical_subj4")
        if not code or not SUBJ4_RE.match(code) or is_confirmed(e):
            continue
        waiting += 1
        if e.get("canonical_source") not in AUTHORITY_SOURCES:
            continue                                     # a code this reference minted waits for a person
        system = authority_of(e)
        reason = None
        if not system:
            reason = "the code %s is not the authority's own (canonical_source %s)" % (code, e.get("canonical_source"))
        holding = sorted(r for r in findings.get(disc, []) if r not in CORROBORATING)
        if holding and not reason:
            reason = "a finding holds it for a person: " + ", ".join(holding)
        lv = (live or {}).get(disc) or {}
        if FIELD_CANON in lv and not reason:
            reason = "a live row holds it (%s, %s)" % (lv[FIELD_CANON].get("reviewer_email"), str(lv[FIELD_CANON].get("reviewed_at") or "")[:10])
        if reason:
            held.append({"discipline": disc, "code": code, "reason": reason})
            continue
        rows.append({"course_id": KEY_PREFIX + disc, "field": FIELD_CANON, "value": code,
                     "reviewer_email": COHORT, "discipline": disc, "system": system})
    return {"rows": rows, "held": held, "waiting": waiting}


# ── the store ────────────────────────────────────────────────────────────────

def _urlopen(req, timeout):
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else []


def _write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write("\n")


class Curation:
    """kb_curation's _CANON_SUBJ4:: rows through PostgREST with the service key the runner
    holds: a Range-paginated read, one INSERT that ignores duplicates, one DELETE by the cohort."""

    def __init__(self, key, url=SUPABASE_URL, transport=_urlopen, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/kb_curation"
        self.key = key
        self.transport = transport
        self.sleep = sleep

    def _send(self, method, params, body=None, headers=None):
        qs = urllib.parse.urlencode(params, safe='(),."*:', quote_via=urllib.parse.quote)
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key, "Accept": "application/json"}
        if body is not None:
            h["Content-Type"] = "application/json"
        h.update(headers or {})
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=h,
                                     data=None if body is None else json.dumps(body).encode())
        for attempt in range(ATTEMPTS):
            try:
                return self.transport(req, 60)
            except urllib.error.HTTPError as exc:
                if exc.code not in TRANSIENT_HTTP or attempt == ATTEMPTS - 1:
                    raise
            except (urllib.error.URLError, OSError):
                if attempt == ATTEMPTS - 1:
                    raise
            self.sleep(2 ** attempt)

    def picks(self):
        """{discipline: {field: row}} for every live row in the tab's namespace, page by page."""
        out, start = {}, 0
        while True:
            rows = self._send("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                      "course_id": "like." + KEY_PREFIX + "*", "order": "course_id,field"},
                              headers={"Range-Unit": "items", "Range": "%d-%d" % (start, start + PAGE - 1)}) or []
            for r in rows:
                disc = (r.get("course_id") or "")[len(KEY_PREFIX):]
                if disc:
                    out.setdefault(disc, {})[r.get("field")] = r
            if len(rows) < PAGE:
                return out
            start += PAGE

    def insert(self, rows):
        return self._send("POST", {"on_conflict": "course_id,field"}, rows,
                          headers={"Prefer": "resolution=ignore-duplicates,return=representation"}) or []

    def undo(self, cohort=COHORT):
        return self._send("DELETE", {"reviewer_email": "eq." + cohort, "course_id": "like." + KEY_PREFIX + "*"},
                          headers={"Prefer": "return=representation"}) or []


# ── the run ──────────────────────────────────────────────────────────────────

def _ts(now=None):
    return (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H-%M-%SZ")


def describe(p, mode, out=print):
    rows, held = p["rows"], p["held"]
    out("confirm: %d pick(s) wait for a confirmation; %d on the authority's own code qualify tonight, %d held%s"
        % (p["waiting"], len(rows), len(held), {"on": "", "preview": " (preview: nothing written)"}.get(mode, " (offline plan, no live read)")))
    for r in rows:
        out("  %-44s %s  %s" % (r["discipline"][:44], r["value"], r["system"]))
    for h in held:
        out("  held %-39s %s  %s" % (h["discipline"][:39], h["code"], h["reason"]))


def save(p, cur, run_id="", now=None, out_dir=OUT_DIR, out=print):
    """Write the receipt, then the rows; the receipt is updated with what landed."""
    rows = p["rows"]
    if not rows:
        out("saved: nothing to write")
        return {"inserted": 0, "skipped": 0, "receipt": None}
    ts = _ts(now)
    path = os.path.join(out_dir, "confirmed_%s.json" % ts)
    receipt = {"table": "kb_curation", "mode": "save", "at": ts, "run_id": run_id, "ruling": RULING,
               "cohort": COHORT, "procedure": "confirmation (kb/csr_procedures.json)",
               "undo": "python3 kb/_csr_confirm_authority.py --undo (one DELETE by the cohort; the seed's stamps clear with it)",
               "held": p["held"], "rows": rows, "result": "pending"}
    _write_json(path, receipt)
    got = cur.insert([{k: r[k] for k in ("course_id", "field", "value", "reviewer_email")} for r in rows])
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in rows if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in rows if (r["course_id"], r["field"]) not in keys]
    receipt["result"] = "written"
    _write_json(path, receipt)
    out("saved: %d row(s) inserted as %s, %d skipped as duplicate; receipt %s"
        % (len(receipt["inserted"]), COHORT, len(receipt["skipped_as_duplicate"]), os.path.relpath(path, ROOT)))
    return {"inserted": len(receipt["inserted"]), "skipped": len(receipt["skipped_as_duplicate"]), "receipt": path}


def undo(cur, seed_path=SEED, now=None, out_dir=OUT_DIR, out=print):
    """One DELETE by the cohort, then the seed's stamps the daily sync wrote from those rows
    are cleared, so the picks read unconfirmed again on the next build."""
    removed = cur.undo(COHORT)
    cleared = []
    try:
        seed = json.load(open(seed_path, encoding="utf-8"))
    except (OSError, ValueError):
        seed = None
    if seed:
        for disc, e in (seed.get("disciplines") or {}).items():
            if e.get("reviewed_by") == COHORT:
                e["reviewed_by"] = None
                e["reviewed_at"] = None
                e["source"] = "data_modal" if e.get("data_modal") == e.get("canonical_subj4") else None
                cleared.append(disc)
        if cleared:
            _write_json(seed_path, seed)
    ts = _ts(now)
    path = os.path.join(out_dir, "undo_%s.json" % ts)
    _write_json(path, {"table": "kb_curation", "mode": "undo", "at": ts, "cohort": COHORT,
                       "removed": removed, "seed_stamps_cleared": cleared})
    out("undo: %d row(s) removed from kb_curation under %s; %d seed stamp(s) cleared; receipt %s"
        % (len(removed), COHORT, len(cleared), os.path.relpath(path, ROOT)))
    return {"removed": len(removed), "cleared": cleared, "receipt": path}


def run(save_mode=None, key=None, cur=None, run_id="", now=None, seed_path=SEED, scan_path=SCAN,
        out_dir=OUT_DIR, out=print):
    seed = json.load(open(seed_path, encoding="utf-8"))
    scan = json.load(open(scan_path, encoding="utf-8")) if os.path.exists(scan_path) else None
    if scan is None:
        out("warning: no daily scan at %s; no finding can hold a pick tonight" % os.path.relpath(scan_path, ROOT))
    live = None
    if save_mode in ("on", "preview"):
        if cur is None:
            if not key:
                sys.exit("--save needs SUPABASE_SERVICE_KEY (the fresh read and the write go through it).")
            cur = Curation(key)
        live = cur.picks()
    p = plan(seed, scan, live)
    describe(p, save_mode, out)
    if save_mode == "on":
        return save(p, cur, run_id=run_id, now=now, out_dir=out_dir, out=out)
    return {"planned": len(p["rows"]), "held": len(p["held"])}


def main(argv=None):
    ap = argparse.ArgumentParser(description="the Common Subjects Reference's nightly confirm of authority-coded picks")
    ap.add_argument("--save", choices=["on", "preview"], help="on writes the rows; preview reads live and writes nothing")
    ap.add_argument("--undo", action="store_true", help="take the cohort's rows back (one DELETE) and clear the seed's stamps")
    ap.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    a = ap.parse_args(argv)
    key = (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip()
    if a.undo:
        if not key:
            sys.exit("--undo needs SUPABASE_SERVICE_KEY.")
        undo(Curation(key))
        return 0
    run(a.save, key=key, run_id=a.run_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
