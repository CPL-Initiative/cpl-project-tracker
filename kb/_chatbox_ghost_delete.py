#!/usr/bin/env python3
"""A guarded, receipted delete of the ghost rows in Supabase `chatbox_credentials` (Sierra's credential table).

WHY THIS EXISTS
---------------
`kb/_sync_credential_catalog.py` upserts `credential_reference_data.js` into `chatbox_credentials` by
`unified_title` and never deletes. A title the reference renamed, merged or retired therefore stays in the table as a
ghost row, and Sierra (`cpl-chat`), the College Briefing and CPL Pathways read it as if it were current. The sync
stays upsert-only; this script removes the ghosts, one reviewed plan at a time.

THE RULING
----------
Sam, Open Asks Sheet 183 card 6, 12:17Z 2026-11-12, his word: "delete" (cpl_memory `d-sheet-183-replies-2026-11-12`):
a guarded, receipted delete of the rows whose `unified_title` is absent from `credential_reference_data.js`, the
before-rows in a receipt, reviewed before it runs. CLAUDE.md Rule 10 (a2): the receipt carries the FULL row images, so
the delete reverses from the receipt alone (docs/reference/data_write_rollback.md, the DELETE row).

MODES (workflow: .github/workflows/chatbox-ghost-delete.yml; the sandbox cannot reach Supabase)
-----
  plan    (default) Reads every live row (Range-paged, every column), builds the titles the sync WOULD upsert with
          the sync's own loader (`load_artifact` + `build_rows`, imported), and calls a ghost each live row whose
          `unified_title` is not among them: exact strings, the upsert's own key, no normalizing. Writes
          kb/receipts/chatbox_ghost_delete_<UTC stamp>/plan.json and deletes nothing.
  apply   --plan DIR --confirm-count N, on the Actions runner (chatbox-ghost-delete.yml mode=apply). Refuses unless
          plan.json is tracked and identical to origin/main's copy (so no delete runs with its before-rows on one
          disk), N is the plan's ghost count, the reference's sha256 is the plan's, the ghosts are at most
          --max-share of the live rows (default 15%), the reference builds at least --min-reference titles (default
          2,000), and the alias resolver reads cleanly, in the plan and again at apply time. Re-reads the table,
          deletes only a planned row that is still live, still absent from the reference and still equal to its
          before-row, one exact `unified_title=eq.` per request (batched for the log). The alias notes are
          recomputed at apply time: a ghost with any successor (an applied rename's end, or a title the fold retired
          it into) is held unless every such successor's live raw_variants already carry the ghost's title (the sync
          writes it: sync first, then delete; --allow-unaliased overrides). apply_log.json names the titles before the
          first delete; applied.json comes from a FRESH READ afterwards, never from a delete's response. Exits 1 while
          a planned ghost remains.
  undo    --plan DIR. Re-inserts plan.json's before-rows that are absent now, with
          `Prefer: resolution=ignore-duplicates` (INSERT ... ON CONFLICT DO NOTHING), so a title the sync has since
          re-created stays as the sync wrote it; then a fresh read files undone.json. Exits 1 while a planned title is
          absent. A session that did not run the delete undoes it from the committed receipt alone:
          dispatch chatbox-ghost-delete.yml with mode=undo and plan_dir=<the receipt directory>, or run
          `SUPABASE_SERVICE_KEY=... python3 kb/_chatbox_ghost_delete.py undo --plan <the receipt directory>`.

Numerics round-trip exactly: every read parses a JSON number as a Decimal and every write prints it back as read, so
`12.50` returns as `12.50`, never `12.5`. Environment: SUPABASE_URL (the sync's default) and SUPABASE_SERVICE_KEY.
Tests: tests/chatbox_ghost_delete_test.py.
"""

from __future__ import annotations

import argparse
import decimal
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
if HERE not in sys.path:
    sys.path.insert(0, HERE)
import _sync_credential_catalog as sync  # noqa: E402  the sync's own loader: import it, never copy it

TABLE = sync.TABLE
RECEIPTS = os.path.join(HERE, "receipts")
PREFIX = "chatbox_ghost_delete_"
PAGE = 1000
DELETE_BATCH = 25
INSERT_BATCH = 100
MAX_SHARE = 0.15
MIN_REFERENCE = 2000
DEFAULT_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co"   # the sync's default (kb/_sync_credential_catalog.py)
# The columns the conductor read live on 2026-11-12. The plan reads select=* and keeps whatever the table holds; a
# difference from this list is printed, never silently dropped.
COLUMNS = (
    "unified_title", "issuer", "trainer", "discipline", "top_code", "cpl_types", "statewide", "ccc_rec", "gen_rec",
    "has_local", "adopter_colleges", "potential_colleges", "n_articulation_lines", "eligible_credits",
    "applied_credits", "transcribed_credits", "in_review_credits", "students_served", "served_suppressed",
    "raw_variants", "search_text", "conf_title", "curated_by", "curated_at", "source_generated_at", "synced_at",
)
UNDO_HOW = ("Undo: dispatch .github/workflows/chatbox-ghost-delete.yml with mode=undo and plan_dir=<this directory>, "
            "or run SUPABASE_SERVICE_KEY=... python3 kb/_chatbox_ghost_delete.py undo --plan <this directory>. It "
            "re-inserts each before-row in plan.json that is absent (INSERT ... ON CONFLICT DO NOTHING, so a title the sync "
            "re-created stays as the sync wrote it), then files undone.json from a fresh read.")


class Refused(SystemExit):
    """A guard said no. Nothing live was written."""

    def __init__(self, msg):
        super().__init__("REFUSED: " + msg)


# ── JSON that keeps numerics exactly ─────────────────────────────────────────

_DEC = "\u0000dec:"   # Postgres text cannot hold NUL, so no real value collides with the marker


def loads(text):
    return json.loads(text, parse_float=decimal.Decimal)


def dumps(obj, indent=None, sort_keys=False):
    def enc(o):
        if isinstance(o, decimal.Decimal):
            return _DEC + str(o)
        raise TypeError("not JSON serializable: %r" % (o,))
    s = json.dumps(obj, default=enc, ensure_ascii=False, indent=indent, sort_keys=sort_keys)
    return re.sub(r'"\\u0000dec:([^"]+)"', r"\1", s)


def canonical(row):
    return dumps(row, sort_keys=True)


def utc_stamp(now=None):
    return (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H-%M-%SZ")


def utc_iso(now=None):
    return (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")


def write_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(dumps(obj, indent=1) + "\n")
    os.replace(tmp, path)


def read_json(path):
    with open(path, encoding="utf-8") as f:
        return loads(f.read())


# ── PostgREST ────────────────────────────────────────────────────────────────

def urllib_send(method, url, headers, body):
    """The one network call: (status, headers, body bytes). An HTTP error status comes back as a status."""
    req = urllib.request.Request(url, method=method, headers=headers, data=body)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers or {}), exc.read()


class Rest:
    """A small PostgREST client for one table. `send` is injectable (tests pass a fake table)."""

    def __init__(self, url, key, send=urllib_send, sleep=time.sleep, tries=4):
        self.base = url.rstrip("/") + "/rest/v1/" + TABLE
        self.key, self.send, self.sleep, self.tries = key, send, sleep, tries

    def _call(self, method, query, body=None, prefer=None, extra=None, with_headers=False, empty_on=()):
        """The parsed body (or (body, headers) with with_headers). A status in `empty_on` reads as an empty list."""
        headers = {"apikey": self.key, "Authorization": "Bearer " + self.key, "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer:
            headers["Prefer"] = prefer
        headers.update(extra or {})
        url = self.base + ("?" + query if query else "")
        data = None if body is None else dumps(body).encode("utf-8")
        last = None
        for attempt in range(1, self.tries + 1):
            try:
                status, hdrs, raw = self.send(method, url, headers, data)
            except (OSError, urllib.error.URLError) as exc:   # a lost response: retry; every call here is idempotent
                last = "%s %s: %s" % (method, url[:160], exc)
            else:
                hdrs = {str(k).lower(): v for k, v in (hdrs or {}).items()}
                if status in empty_on:
                    return ([], hdrs) if with_headers else []
                if status < 300:
                    got = loads(raw.decode("utf-8")) if raw else None
                    return (got, hdrs) if with_headers else got
                last = "%s %s: HTTP %s %r" % (method, url[:160], status, (raw or b"")[:300])
                if status < 500 and status != 429:
                    raise RuntimeError(last)
            if attempt < self.tries:
                self.sleep(2 * attempt)
        raise RuntimeError("gave up after %d tries: %s" % (self.tries, last))

    def read_all(self, select="*", page=PAGE):
        """Every row, ordered by the unique key so pages never shift; stops on an EMPTY page, never a short one (the
        server may cap a page below `page`); HTTP 416 (a range past the end) is an empty end page. The first page asks
        `Prefer: count=exact`, and the rows read must equal that total, or the read raises: a page lost or doubled
        while the table moved never passes as the whole table. Raises on a title read twice."""
        out, start, total = [], 0, None
        q = urllib.parse.urlencode({"select": select, "order": "unified_title.asc"}, safe="*,.")
        while True:
            got, hdrs = self._call("GET", q, prefer="count=exact" if start == 0 else None, with_headers=True,
                                   empty_on=(416,),
                                   extra={"Range-Unit": "items", "Range": "%d-%d" % (start, start + page - 1)})
            if start == 0:
                m = re.search(r"/(\d+)\s*$", hdrs.get("content-range") or "")
                if not m:
                    raise RuntimeError("the first page carried no exact count (Content-Range %r)"
                                       % hdrs.get("content-range"))
                total = int(m.group(1))
            got = got or []
            if not got:
                break
            out.extend(got)
            start += len(got)
        if len(out) != total:
            raise RuntimeError("read %d rows where the server counted %d; read again" % (len(out), total))
        seen = set()
        for r in out:
            t = r.get("unified_title")
            if t in seen:
                raise RuntimeError("the read returned %r twice; pages shifted, read again" % t)
            seen.add(t)
        return out

    def delete_title(self, title):
        """DELETE exactly one title: `unified_title=eq.<title>`. eq. takes the rest of the value literally, so a
        comma, a parenthesis or a quote in a title cannot split it into another title (an in.() list could)."""
        if not isinstance(title, str) or not title:
            raise ValueError("refusing a delete without an exact title")
        self._call("DELETE", "unified_title=eq." + urllib.parse.quote(title, safe=""), prefer="return=minimal")

    def insert_ignore(self, rows):
        self._call("POST", "on_conflict=unified_title", body=rows,
                   prefer="resolution=ignore-duplicates,return=minimal")


def client(send=None):
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key and send is None:
        raise SystemExit("FATAL: SUPABASE_SERVICE_KEY required (this runs on the Actions runner)")
    return Rest(os.environ.get("SUPABASE_URL", DEFAULT_URL), key or "test", **({"send": send} if send else {}))


# ── the reference ────────────────────────────────────────────────────────────

def reference(path=None):
    """What the sync WOULD upsert, from the sync's own loader: {path, sha256, generated_at, titles, rows}."""
    path = path or sync.ARTIFACT
    with open(path, "rb") as f:
        sha = hashlib.sha256(f.read()).hexdigest()
    doc = sync.load_artifact(path)
    rows = sync.build_rows(doc)
    return {"path": os.path.relpath(path, REPO).replace("\\", "/"), "sha256": sha,
            "generated_at": doc.get("_generated_at"), "titles": {r["unified_title"] for r in rows}, "rows": rows}


def alias_notes(ghost_titles, ref, root=REPO):
    """Per ghost: where an applied rename or a fold retire sends it (kb/credential_aliases.py, read-time resolution),
    and which reference titles still answer its exact name. Sierra's credential search matches lower(unified_title) at
    tier 1 and lower(raw variant) at tier 2 (kb/supabase_chatbox_credentials.sql); a ghost name no reference row
    carries there loses that exact-name path when its row goes."""
    exact = {}
    for r in ref["rows"]:
        for name in [r["unified_title"]] + list(r.get("raw_variants") or []):
            exact.setdefault((name or "").lower(), set()).add(r["unified_title"])
    try:
        import credential_aliases
        now = credential_aliases.resolver(root)
        aka = credential_aliases.load(root)
        resolved = {t: now(t) for t in ghost_titles}
        err = None
    except Exception as exc:                       # noqa: BLE001 — recorded; plan and apply both refuse on it
        aka, resolved, err = {}, {t: t for t in ghost_titles}, "%s: %s" % (type(exc).__name__, exc)
    out = {}
    for t in ghost_titles:
        target = resolved[t]
        to = target if target != t and target in ref["titles"] else None
        into = sorted(k for k, v in aka.items() if t in v and k in ref["titles"])
        out[t] = {
            "alias_to": to,        # where an applied rename's chain ends
            "alias_of": into,      # the titles that carry it as an alias (load(): renames and fold retires)
            "successors": sorted(set(into) | ({to} if to else set())),
            "exact_name_answered_by": sorted(exact.get(t.lower(), set())),
        }
    summary = {
        "with_alias_to_a_reference_title": sum(1 for v in out.values() if v["alias_to"] or v["alias_of"]),
        "without_alias": sum(1 for v in out.values() if not (v["alias_to"] or v["alias_of"])),
        "exact_name_lost": sum(1 for v in out.values() if not v["exact_name_answered_by"]),
    }
    if err:
        summary["resolver_error"] = err
    return out, summary


# ── plan ─────────────────────────────────────────────────────────────────────

def plan(rest, ref, receipts=RECEIPTS, max_share=MAX_SHARE, min_reference=MIN_REFERENCE, now=None, root=REPO):
    if len(ref["titles"]) < min_reference:
        raise Refused("the reference builds %d titles, under the floor of %d: a truncated or failed build must never "
                      "empty Sierra's table" % (len(ref["titles"]), min_reference))
    live = rest.read_all()
    blank = [r for r in live if not isinstance(r.get("unified_title"), str) or not r.get("unified_title")]
    if blank:
        raise Refused("%d live row(s) carry no unified_title; an exact delete cannot name them" % len(blank))
    ghosts = [r for r in live if r["unified_title"] not in ref["titles"]]
    cols = sorted({k for r in live for k in r})
    notes, alias_summary = alias_notes([g["unified_title"] for g in ghosts], ref, root)
    stamp = utc_stamp(now)
    out_dir = os.path.join(receipts, PREFIX + stamp)
    if os.path.exists(out_dir):
        raise Refused("%s exists; a plan is written once" % out_dir)
    share = (len(ghosts) / len(live)) if live else 0.0
    doc = {
        "_about": ("Ghost rows of chatbox_credentials: live rows whose unified_title the sync would not upsert from "
                   "the reference (exact strings). Sam, Open Asks Sheet 183 card 6, 2026-11-12: \"delete\". "
                   "Built by kb/_chatbox_ghost_delete.py plan; nothing was deleted by this file."),
        "README": UNDO_HOW,
        "stamp": stamp,
        "planned_at": utc_iso(now),
        "table": TABLE,
        "reference": {"path": ref["path"], "sha256": ref["sha256"], "generated_at": ref["generated_at"],
                      "titles": len(ref["titles"])},
        "live_count": len(live),
        "ghost_count": len(ghosts),
        "ghost_share": round(share, 4),
        "guards": {"max_share": max_share, "min_reference": min_reference,
                   "apply_would_refuse_share": share > max_share},
        "columns": cols,
        "columns_differ_from_expected": sorted(set(cols) ^ set(COLUMNS)) if live else [],
        "alias_summary": alias_summary,
        "aliases": notes,
        "ghosts": ghosts,
    }
    os.makedirs(out_dir)
    write_json(os.path.join(out_dir, "plan.json"), doc)
    print("plan %s: %d live rows, %d reference titles, %d ghosts (%.1f%%), %d with an alias to a reference title, "
          "%d whose exact name no reference row answers%s" % (
              os.path.relpath(out_dir, REPO), len(live), len(ref["titles"]), len(ghosts), 100 * share,
              alias_summary["with_alias_to_a_reference_title"], alias_summary["exact_name_lost"],
              "; APPLY WOULD REFUSE (share above %.0f%%)" % (100 * max_share) if share > max_share else ""))
    if alias_summary.get("resolver_error"):
        print("WARNING: the alias resolver failed (%s); apply will refuse this plan" % alias_summary["resolver_error"])
    if doc["columns_differ_from_expected"]:
        print("NOTE: live columns differ from the expected list: %s" % doc["columns_differ_from_expected"])
    return out_dir, doc


def load_plan(plan_dir):
    path = os.path.join(plan_dir, "plan.json")
    if not os.path.isfile(path):
        raise Refused("%s is absent" % path)
    doc = read_json(path)
    ghosts = doc.get("ghosts")
    if doc.get("table") != TABLE or not isinstance(ghosts, list):
        raise Refused("%s is not a %s ghost plan" % (path, TABLE))
    if doc.get("ghost_count") != len(ghosts):
        raise Refused("the plan says %r ghosts and lists %d" % (doc.get("ghost_count"), len(ghosts)))
    titles = [g.get("unified_title") for g in ghosts]
    if any(not isinstance(t, str) or not t for t in titles) or len(set(titles)) != len(titles):
        raise Refused("the plan lists a blank or repeated title")
    return doc


def _attempts(path):
    try:
        return read_json(path).get("attempts") or []
    except (OSError, ValueError):
        return []


# ── apply ────────────────────────────────────────────────────────────────────

def successor_carries(title, successors, live):
    """True when every successor (an applied rename's end and each title the fold retired `title` into) has a LIVE row
    whose raw_variants carry `title` (lower-cased, as Sierra's tier 2 compares); vacuously true with none. Sam,
    2026-11-11: old titles stay as search aliases; the sync writes them (kb/_sync_credential_catalog.py retired_names),
    so a ghost goes only once the sync has run: sync first, then delete."""
    for s in successors or []:
        row = live.get(s)
        if not row or title.lower() not in {(v or "").lower() for v in row.get("raw_variants") or []}:
            return False
    return True


def check_committed(plan_dir):
    """Refuse unless plan.json is tracked by git and identical to origin/main's copy: the before-rows that make the
    delete reversible are on main before a row goes, never on one disk only."""
    path = os.path.abspath(os.path.join(plan_dir, "plan.json"))
    where, name = os.path.dirname(path), os.path.basename(path)
    for args, why in ((["ls-files", "--error-unmatch", "--", name], "is not tracked by git"),
                      (["diff", "--quiet", "origin/main", "--", name], "differs from origin/main's copy (or "
                                                                       "origin/main lacks it)")):
        r = subprocess.run(["git", "-C", where] + args, capture_output=True, text=True)
        if r.returncode != 0:
            raise Refused("%s %s: commit the plan to main (the plan run does) and apply from a checkout of main"
                          % (os.path.relpath(path, REPO), why))


def apply(rest, plan_dir, confirm_count, ref, max_share=MAX_SHARE, min_reference=MIN_REFERENCE, now=None,
          allow_unaliased=False, root=REPO, committed=check_committed):
    committed(plan_dir)
    doc = load_plan(plan_dir)
    if (doc.get("alias_summary") or {}).get("resolver_error"):
        raise Refused("the plan's alias resolver failed (%s); fix it and plan again"
                      % doc["alias_summary"]["resolver_error"])
    n = doc["ghost_count"]
    if confirm_count != n:
        raise Refused("--confirm-count %r is not the plan's ghost count %d" % (confirm_count, n))
    if ref["sha256"] != doc["reference"]["sha256"]:
        raise Refused("the reference's sha256 %s is not the plan's %s: the plan was made against another reference; "
                      "plan again" % (ref["sha256"][:12], doc["reference"]["sha256"][:12]))
    if len(ref["titles"]) < min_reference:
        raise Refused("the reference builds %d titles, under the floor of %d" % (len(ref["titles"]), min_reference))
    if doc["live_count"] and n > max_share * doc["live_count"]:
        raise Refused("%d ghosts of %d live rows is above the ceiling of %.0f%% (raise --max-share only on a "
                      "reviewed reason)" % (n, doc["live_count"], 100 * max_share))
    if os.path.exists(os.path.join(plan_dir, "undone.json")):
        raise Refused("this plan was undone; plan again")

    # The alias notes are recomputed here, never taken from the plan.
    notes, alias_summary = alias_notes([g["unified_title"] for g in doc["ghosts"]], ref, root)
    if alias_summary.get("resolver_error"):
        raise Refused("the alias resolver failed at apply time (%s)" % alias_summary["resolver_error"])

    live = {r["unified_title"]: r for r in rest.read_all()}
    if live and n > max_share * len(live):
        raise Refused("%d ghosts of %d live rows now is above the ceiling of %.0f%%" % (n, len(live), 100 * max_share))
    targets, in_reference, gone, changed, unaliased = [], [], [], [], []
    for g in doc["ghosts"]:
        t = g["unified_title"]
        if t in ref["titles"]:
            in_reference.append(t)
        elif t not in live:
            gone.append(t)
        elif canonical(live[t]) != canonical(g):
            changed.append(t)
        elif not allow_unaliased and not successor_carries(t, notes[t]["successors"], live):
            unaliased.append(t)
        else:
            targets.append(t)

    log_path = os.path.join(plan_dir, "apply_log.json")
    attempts = _attempts(log_path)
    attempt = {"started_at": utc_iso(now), "planned": [g["unified_title"] for g in doc["ghosts"]],
               "to_delete": targets, "skipped_in_reference": in_reference, "skipped_gone_before_apply": gone,
               "held_changed_since_plan": changed, "held_successor_lacks_old_name": unaliased,
               "successors_at_apply": {t: v["successors"] for t, v in notes.items() if v["successors"]},
               "allow_unaliased": allow_unaliased, "live_count_before": len(live), "batches_sent": 0,
               "error": None}
    attempts.append(attempt)
    log = {"_about": ("Written BEFORE the first delete and after each batch. What was sent, never what landed: "
                      "applied.json holds what a fresh read found."), "README": UNDO_HOW, "attempts": attempts}
    write_json(log_path, log)

    for i in range(0, len(targets), DELETE_BATCH):
        try:
            for t in targets[i:i + DELETE_BATCH]:
                rest.delete_title(t)
        except Exception as exc:                   # noqa: BLE001 — stop, then file what a fresh read finds
            attempt["error"] = "%s: %s" % (type(exc).__name__, exc)
            write_json(log_path, log)
            print("ERROR in batch %d: %s" % (i // DELETE_BATCH + 1, attempt["error"]))
            break
        attempt["batches_sent"] += 1
        write_json(log_path, log)

    after = {r["unified_title"]: r for r in rest.read_all()}
    planned = [g["unified_title"] for g in doc["ghosts"]]
    remain = [t for t in planned if t in after]
    ghosts_remain = [t for t in remain if t not in ref["titles"]]
    applied = {
        "_about": "From a fresh read after the deletes, never from a delete's response.",
        "README": UNDO_HOW,
        "read_at": utc_iso(now),
        "live_count_after": len(after),
        "planned": len(planned),
        "gone": [t for t in planned if t not in after],
        "remain": remain,
        "ghosts_remain": ghosts_remain,
        "skipped_in_reference": in_reference,
        "held_changed_since_plan": changed,
        "held_successor_lacks_old_name": unaliased,
        "error": attempt["error"],
    }
    write_json(os.path.join(plan_dir, "applied.json"), applied)
    print("apply %s: %d planned, %d gone, %d remain (%d still ghosts), %d held as changed since the plan, %d held "
          "because the successor's raw_variants lack the old name (sync first), %d back in the reference; %d live "
          "rows after" % (
              os.path.relpath(plan_dir, REPO), len(planned), len(applied["gone"]), len(remain), len(ghosts_remain),
              len(changed), len(unaliased), len(in_reference), len(after)))
    return (1 if ghosts_remain or attempt["error"] else 0), applied


# ── undo ─────────────────────────────────────────────────────────────────────

def undo(rest, plan_dir, now=None):
    doc = load_plan(plan_dir)
    before = {g["unified_title"]: g for g in doc["ghosts"]}
    # synced_at defaults to now() on insert; the before-row's own value is what goes back (plan reads select=*).
    lacking = [t for t, r in before.items() if "synced_at" not in r]
    if lacking:
        raise Refused("%d before-row(s) lack synced_at, so an insert would stamp now(): %s" % (len(lacking), lacking[:3]))
    live = {r["unified_title"]: r for r in rest.read_all()}
    missing = [t for t in before if t not in live]
    present = [t for t in before if t in live]
    log_path = os.path.join(plan_dir, "undo_log.json")
    attempts = _attempts(log_path)
    attempt = {"started_at": utc_iso(now), "to_insert": missing, "present_before_undo": present,
               "batches_sent": 0, "error": None}
    attempts.append(attempt)
    log = {"_about": "Written BEFORE the first insert. undone.json holds what a fresh read found.",
           "attempts": attempts}
    write_json(log_path, log)
    for i in range(0, len(missing), INSERT_BATCH):
        try:
            rest.insert_ignore([before[t] for t in missing[i:i + INSERT_BATCH]])
        except Exception as exc:                   # noqa: BLE001
            attempt["error"] = "%s: %s" % (type(exc).__name__, exc)
            write_json(log_path, log)
            print("ERROR in batch %d: %s" % (i // INSERT_BATCH + 1, attempt["error"]))
            break
        attempt["batches_sent"] += 1
        write_json(log_path, log)

    after = {r["unified_title"]: r for r in rest.read_all()}
    restored = [t for t in before if t in after and canonical(after[t]) == canonical(before[t])]
    differs = [t for t in before if t in after and canonical(after[t]) != canonical(before[t])]
    absent = [t for t in before if t not in after]
    undone = {
        "_about": ("From a fresh read after the inserts. 'present_as_written_since' are titles live in another form "
                   "(the sync re-created them, or the row changed); the undo left each as it stands."),
        "read_at": utc_iso(now),
        "live_count_after": len(after),
        "planned": len(before),
        "restored_exactly": restored,
        "present_as_written_since": differs,
        "absent": absent,
        "error": attempt["error"],
    }
    write_json(os.path.join(plan_dir, "undone.json"), undone)
    print("undo %s: %d planned, %d restored exactly, %d present as written since, %d absent; %d live rows after" % (
        os.path.relpath(plan_dir, REPO), len(before), len(restored), len(differs), len(absent), len(after)))
    return (1 if absent or attempt["error"] else 0), undone


# ── the sync's report ────────────────────────────────────────────────────────

def count_ghosts(rest, titles):
    """Live titles absent from `titles` (the sync's rows). A read of one column; writes nothing."""
    return sum(1 for r in rest.read_all(select="unified_title") if r.get("unified_title") not in titles)


# ── main ─────────────────────────────────────────────────────────────────────

def _github_output(name, value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write("%s=%s\n" % (name, value))


def main(argv=None, send=None, committed=check_committed):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], epilog=UNDO_HOW,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", nargs="?", default="plan", choices=("plan", "apply", "undo"))
    ap.add_argument("--plan", dest="plan_dir", help="the receipt directory a plan wrote (apply, undo)")
    ap.add_argument("--confirm-count", type=int, help="apply: the plan's ghost count, typed by the person dispatching")
    ap.add_argument("--max-share", type=float, default=MAX_SHARE, help="ceiling on ghosts / live rows (default 0.15)")
    ap.add_argument("--min-reference", type=int, default=MIN_REFERENCE,
                    help="floor on the titles the reference builds (default 2000)")
    ap.add_argument("--allow-unaliased", action="store_true",
                    help="apply: delete a ghost whose alias successor's live raw_variants lack its old name (off: such "
                         "a ghost is held until the sync has written the name)")
    ap.add_argument("--reference", help="the reference file (default: credential_reference_data.js)")
    ap.add_argument("--receipts", default=RECEIPTS, help="where plan writes its directory (default kb/receipts)")
    a = ap.parse_args(argv)

    rest = client(send)
    if a.mode == "plan":
        out_dir, _ = plan(rest, reference(a.reference), a.receipts, a.max_share, a.min_reference)
        _github_output("receipt_dir", os.path.relpath(out_dir, REPO).replace("\\", "/"))
        return 0
    if not a.plan_dir:
        ap.error("%s needs --plan <receipt directory>" % a.mode)
    _github_output("receipt_dir", os.path.relpath(os.path.abspath(a.plan_dir), REPO).replace("\\", "/"))
    if a.mode == "apply":
        if a.confirm_count is None:
            ap.error("apply needs --confirm-count N (the plan's ghost count)")
        return apply(rest, a.plan_dir, a.confirm_count, reference(a.reference), a.max_share, a.min_reference,
                     allow_unaliased=a.allow_unaliased, committed=committed)[0]
    return undo(rest, a.plan_dir)[0]


if __name__ == "__main__":
    sys.exit(main())
