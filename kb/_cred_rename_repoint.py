#!/usr/bin/env python3
"""Re-point what a credential rename leaves on a retired title, and count the old titles left under kb/.

Why it exists (COBIx on #3110, issue comments 6813000047 and 6813256997): the 2026-11-12 apply renamed 22 ASE
bundle titles and merged 2. It re-keyed the three credential files and left three things behind:
  1. a saved assignment on a retired title. kb/unclassified_assignments.json held "Automotive Service Excellence
     (ASE) A4 and A5" -> "ASE Bundle — A4, A5", a row cer-procedure-classifier@bot saved on 2026-10-31, and
     kb/cer_classified.json held the same pair. kb/_build_exhibits_related.py then lists the retired title as a
     title a card could fold into (status "proposed"), so the Exhibits tab offers it again;
  2. kb/reference/map_cpl_opportunities_verified.json, whose by_title is keyed by common title: the new titles
     lost their MAP links, and no workflow re-titles that file. kb/occupation_credential_map.json, the curated
     occupation rulings, named two retired titles in three rulings a bot curated;
  3. no count of the old titles left, so main read red for 68 minutes before anyone looked.

What this module does, for every rename and merge an apply makes:
  * plan() finds each saved value equal to an old title (and each by_title key) and the title it moves to. A row a
    person saved (its reviewer does not end in "@bot") is never changed: it goes to held_person_rows for a ruling,
    the rule kb/_cer_decision_apply.py load_plan keeps since #3123;
  * apply_changes() writes the files; filed() reads them back, so the receipt names what landed from a fresh read,
    never from the write's echo (cpl_memory pitfall-receipt-built-from-a-write-echo-2026-11-12);
  * kb/unclassified_assignments.json is a copy of kb_curation's _UNCLASSIFIED:: rows, rewritten each night by
    kb/_apply_unclassified_triage.py, so a re-point there lasts only once the row it copies moves too.
    run_supabase() makes that move: a guarded PATCH of the value alone, on the row as a fresh read found it;
  * undo_plan() and the undo ops let kb/_cred_rename_undo.py put each value back, from the planned lists;
  * old_titles_left() counts every old title still under kb/ as an exact JSON key or string value.

  python3 kb/_cred_rename_repoint.py --repair kb/cred_rename_out/2026-11-12            # what would change
  python3 kb/_cred_rename_repoint.py --repair kb/cred_rename_out/2026-11-12 --apply    # write files + receipt
  python3 kb/_cred_rename_repoint.py --supabase kb/cred_rename_out/2026-11-12          # the kb_curation half
  python3 kb/_cred_rename_repoint.py --supabase-plan kb/cred_rename_out/2026-11-12     # the same half as SQL
  python3 kb/_cred_rename_repoint.py --count kb/cred_rename_out/2026-11-12             # write old_titles_left.json
  python3 kb/_cred_rename_repoint.py --count kb/cred_rename_out/2026-11-12 --check     # exit 1 when any is left

Every file path is relative to a root: the folder that holds kb/credentials.json for the caller. A test that points
the credential files at another tree therefore never touches the repo's saved files.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import fold_issuer  # noqa: E402

UNCLASS = "_UNCLASSIFIED::"
UNCLASS_FIELD = "unified_title_assignment"
CRED_REVIEW = "_CREDENTIAL_REVIEW::"
OVERLAY_FILE = "kb/credential_review_overlay.json"
FAMILIES_FILE = "kb/reference/credential_families.json"

# The files a rename re-points. "value": each entry under `container` holds the title in `field`; "key": the
# container is keyed by title; "item": each entry holds a `list` of objects with the title in `field`. `reviewer`
# names the entry's saver; a file with none names its one writer. Each file is written back in its own format.
SPECS = (
    {"file": "kb/unclassified_assignments.json", "kind": "value", "container": "assignments",
     "field": "unified_title", "reviewer": "reviewed_by", "indent": 2,
     "mirror": {"prefix": UNCLASS, "field": UNCLASS_FIELD},
     "why": "saved title assignments, copied each night from kb_curation by kb/_apply_unclassified_triage.py"},
    {"file": "kb/cer_classified.json", "kind": "value", "container": "records", "field": "unified_title",
     "reviewer": None, "writer": "the classifier's cache (kb/_cer_procedures.py)", "indent": 1,
     "why": "the classifier's answers, which cer-procedures.yml recommits each night"},
    {"file": "kb/reference/map_cpl_opportunities_verified.json", "kind": "key", "container": "by_title",
     "writer": "kb/_verify_map_exhibit_links.py", "indent": 1,
     "why": "MAP's listed exhibit ids by common title; no workflow re-titles it after a rename"},
    {"file": "kb/occupation_credential_map.json", "kind": "item", "container": "occupations", "list": "credentials",
     "field": "title", "reviewer": "curated_by", "indent": 1, "ascii": True, "newline": False,
     "why": "the curated occupation-to-credential rulings kb/_build_partner_crosswalk.py reads; each title must "
            "match a unified title"},
)

# Folders the count skips, each because it keeps old names on purpose.
EXCLUDE_DIRS = {
    "kb/cred_rename_out": "each apply's receipt: the old titles are the alias map and the undo's basis",
    "kb/cred_rename_plans": "the ruled plans name the old titles they rename",
    "kb/cred_rename_dryrun": "the dry run's preview of the renames, written before the apply",
    "kb/receipts": "other writers' receipts, which keep the rows as they stood",
}
# A path segment that marks a run's record: a "saved" folder holds save receipts (kb/cer_procedures_out/saved), and a
# dated folder holds one past run's output as it stood (kb/unclassified_fold/2026-11-12, kb/regional_cpl_out/...).
EXCLUDE_SEGMENT = re.compile(r"^(saved|\d{4}-\d{2}-\d{2}.*)$")
EXCLUDE_SEGMENT_WHY = "a dated run folder or a saved/ receipt folder: a past run's record, kept as it was"
# Lists that carry old titles on purpose: kb/credential_aliases.py load() output, each title's earlier names.
ALIAS_SLOTS = {"kb/exhibits_related.json": "titles[*][5], the earlier titles kb/credential_aliases.py names"}


def _is_alias_slot(rel, path):
    return rel == "kb/exhibits_related.json" and len(path) >= 3 and path[0] == "titles" and path[2] == 5


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _read(root, rel):
    if root is None or not os.path.isfile(os.path.join(root, rel)):
        return None
    p = os.path.join(root, rel)
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _write(root, rel, obj, spec):
    p = os.path.join(root, rel)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=spec["indent"], ensure_ascii=spec.get("ascii", False))
        if spec.get("newline", True):
            f.write("\n")
    os.replace(tmp, p)


def _spec(rel):
    return next(s for s in SPECS if s["file"] == rel)


def root_of(credentials_path):
    """The tree whose saved files go with this credentials file: the parent of the kb/ folder holding it, or None
    when the file sits outside a kb/ folder (a test's scratch copy), so nothing is re-pointed."""
    kb = os.path.dirname(os.path.abspath(credentials_path))
    return os.path.dirname(kb) if os.path.basename(kb) == "kb" else None


# ── the plan ──────────────────────────────────────────────────────────────────────────────────────────────────

def plan(moves, root=ROOT):
    """moves: {old title: new title}, renames and merges together. Returns (changes, held_person_rows).

    A value change: {file, kind "value", key, field, before, after, reviewer, reviewed_at}. A key change, one per
    target: {file, kind "key", key: the target, before: {title: ids or None}, after: {title: ids or None}}."""
    changes, held = [], []
    if root is None:
        return changes, held
    for spec in SPECS:
        doc = _read(root, spec["file"])
        if doc is None:
            continue
        box = doc.get(spec["container"]) or {}
        if spec["kind"] == "value":
            for key in sorted(box):
                e = box[key]
                v = (e or {}).get(spec["field"]) if isinstance(e, dict) else None
                if v not in moves or moves[v] == v:
                    continue
                who = e.get(spec["reviewer"]) if spec.get("reviewer") else spec["writer"]
                row = {"file": spec["file"], "kind": "value", "key": key, "field": spec["field"], "before": v,
                       "after": moves[v], "reviewer": who, "reviewed_at": e.get("reviewed_at")}
                if spec.get("reviewer") and not fold_issuer.is_bot(who):
                    held.append(dict(row, why="a person saved this row (%s); a rename never changes it, so it waits "
                                              "for a ruling" % (who or "no reviewer named")))
                else:
                    changes.append(row)
        elif spec["kind"] == "item":
            for key in sorted(box):
                e = box[key] if isinstance(box[key], dict) else {}
                for i, it in enumerate(e.get(spec["list"]) or []):
                    v = it.get(spec["field"]) if isinstance(it, dict) else None
                    if v not in moves or moves[v] == v:
                        continue
                    who = e.get(spec["reviewer"])
                    row = {"file": spec["file"], "kind": "item", "key": key, "index": i, "field": spec["field"],
                           "before": v, "after": moves[v], "reviewer": who, "reviewed_at": e.get("curated_at")}
                    if not fold_issuer.is_bot(who):
                        held.append(dict(row, why="a person curated this ruling (%s); a rename never changes it, "
                                                  "so it waits for a ruling" % (who or "no curator named")))
                    else:
                        changes.append(row)
        else:
            by_target = {}
            for old in sorted(box):
                if old in moves and moves[old] != old:
                    by_target.setdefault(moves[old], []).append(old)
            for new, olds in sorted(by_target.items()):
                before = {t: box.get(t) for t in [new] + olds}
                merged = sorted({x for t in [new] + olds for x in (box.get(t) or [])})
                after = dict({o: None for o in olds}, **{new: merged})
                changes.append({"file": spec["file"], "kind": "key", "key": new, "before": before, "after": after,
                                "reviewer": spec["writer"]})
    return changes, held


def _title(c):
    """The title a change lands on: the fold group it belongs to in the undo."""
    return c["key"] if c["kind"] == "key" else c["after"]


def apply_changes(changes, root=ROOT):
    """Write every change, each only while its file still holds the value it was planned from."""
    by_file = {}
    for c in changes:
        by_file.setdefault(c["file"], []).append(c)
    for rel, cs in by_file.items():
        spec = _spec(rel)
        doc = _read(root, rel)
        if doc is None:
            continue
        box = doc.setdefault(spec["container"], {})
        for c in cs:
            if c["kind"] in ("value", "item"):
                e = _cell(box, c, spec)
                if isinstance(e, dict) and e.get(c["field"]) == c["before"]:
                    e[c["field"]] = c["after"]
            elif all(box.get(t) == v for t, v in c["before"].items()):
                for t, v in c["after"].items():
                    if v is None:
                        box.pop(t, None)
                    else:
                        box[t] = v
        if spec["kind"] == "key":
            doc[spec["container"]] = dict(sorted(box.items()))
        _write(root, rel, doc, spec)


def _cell(box, c, spec):
    """The object that holds a value or item change's title, or None."""
    e = box.get(c["key"])
    if c["kind"] == "item":
        lst = (e or {}).get(spec["list"]) if isinstance(e, dict) else None
        return lst[c["index"]] if isinstance(lst, list) and 0 <= c["index"] < len(lst) else None
    return e


def _state(c, root, cache):
    """'after', 'before' or 'other': what the file holds for this change now."""
    rel = c["file"]
    if rel not in cache:
        cache[rel] = _read(root, rel)
    doc = cache[rel]
    if doc is None:
        return "absent"
    spec = _spec(rel)
    box = doc.get(spec["container"]) or {}
    if c["kind"] in ("value", "item"):
        cur = (_cell(box, c, spec) or {}).get(c["field"])
        return "after" if cur == c["after"] else ("before" if cur == c["before"] else "other")
    cur = {t: box.get(t) for t in c["after"]}
    if cur == c["after"]:
        return "after"
    return "before" if cur == {t: box.get(t) for t in c["before"]} == c["before"] else "other"


def filed(changes, root=ROOT):
    """Each planned change as a fresh read of its file finds it: landed when the file holds the after value."""
    cache = {}
    out = []
    for c in changes:
        s = _state(c, root, cache)
        out.append(dict(c, filed="landed" if s == "after" else ("not_landed" if s == "before" else s)))
    return out


def write_receipt(out_dir, moves, changes, held, root=ROOT, source="apply", name=None):
    """repoint.json (or repoint-<UTC>.json beside an earlier one) in the apply's receipt folder. The planned list is
    the undo's input; `filed` is read back from the files after the writes."""
    name = name or "repoint.json"
    path = os.path.join(out_dir, name)
    if os.path.exists(path):
        path = os.path.join(out_dir, "repoint-%s.json" % datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    doc = {
        "_about": "The saved values this rename moved off a retired title (kb/_cred_rename_repoint.py). planned is "
                  "the undo's input (kb/_cred_rename_undo.py); filed is a fresh read of each file after the writes. "
                  "held_person_rows were saved by a person and never change without a ruling.",
        "source": source, "at": _now(), "moves": dict(sorted(moves.items())),
        "planned": changes, "filed": filed(changes, root), "held_person_rows": held,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return path


def receipts(folder):
    """Every repoint receipt in an apply's folder, oldest first."""
    if not os.path.isdir(folder):
        return []
    names = sorted(n for n in os.listdir(folder) if re.match(r"^repoint(-\d{8}T\d{6}Z)?\.json$", n))
    names.sort(key=lambda n: (n != "repoint.json", n))
    out = []
    for n in names:
        with open(os.path.join(folder, n), encoding="utf-8") as f:
            out.append(dict(json.load(f), _name=n))
    return out


# ── the undo ──────────────────────────────────────────────────────────────────────────────────────────────────

def undo_plan(folder, root=ROOT):
    """Every planned change of the folder's repoint receipts, read against the files now. Returns (todo, drift,
    absent): todo holds the changes still at their after value (newest receipt first, so a re-point made twice
    reverses once), drift those changed since, absent those whose file is not in this tree."""
    cache, todo, drift, absent, seen = {}, [], [], [], set()
    for doc in reversed(receipts(folder)):
        for c in doc.get("planned") or []:
            k = (c["file"], c["kind"], c["key"], c.get("index"))
            if k in seen:
                continue
            seen.add(k)
            s = _state(c, root, cache)
            if s == "after":
                todo.append(dict(c, receipt=doc["_name"]))
            elif s == "absent":
                absent.append(dict(c, receipt=doc["_name"]))
            elif s == "other":
                drift.append(dict(c, receipt=doc["_name"]))
    return todo, drift, absent


def reverse(c):
    """The change that puts c back."""
    return dict(c, before=c["after"], after=c["before"])


def undo_title(c):
    return _title(c)


# ── the kb_curation half ──────────────────────────────────────────────────────────────────────────────────────

URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
ROW_COLS = ("value", "reviewer_email", "reviewed_at", "validated_at", "validated_by")


def rest(method, path, body=None):
    """One PostgREST call; returns the rows (a list). Tests replace this."""
    import urllib.request
    req = urllib.request.Request(
        f"{URL}/rest/v1/{path}", method=method,
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
                 "Accept": "application/json", "Prefer": "return=representation"},
        data=json.dumps(body).encode("utf-8") if body is not None else None)
    with urllib.request.urlopen(req, timeout=30) as r:
        got = json.load(r)
    return got if isinstance(got, list) else []


def _qs(**eq):
    import urllib.parse
    return urllib.parse.urlencode({k: ("is.null" if v is None else f"eq.{v}") for k, v in eq.items()})


def _live(cid, field):
    rows = rest("GET", "kb_curation?select=course_id,field,%s&%s" % (",".join(ROW_COLS), _qs(course_id=cid,
                                                                                          field=field)))
    return rows[0] if rows else None


def mirror_changes(folder):
    """The planned value changes whose file copies kb_curation rows, each once (newest receipt wins)."""
    out, seen = [], set()
    for doc in reversed(receipts(folder)):
        for c in doc.get("planned") or []:
            spec = next((s for s in SPECS if s["file"] == c["file"]), None)
            if not spec or not spec.get("mirror") or c["kind"] != "value" or c["key"] in seen:
                continue
            seen.add(c["key"])
            out.append(dict(c, course_id=spec["mirror"]["prefix"] + c["key"], row_field=spec["mirror"]["field"]))
    return out


def _file_row(op, live):
    if live is None:
        return "gone"
    if live.get("value") == op["after"]:
        return "landed"
    if live.get("value") == op["before"] and all(live.get(k) == (op["before_row"] or {}).get(k)
                                                 for k in ("reviewer_email", "reviewed_at")):
        return "not_landed"
    return "changed"


def _log_path(folder, prefix):
    first = os.path.join(folder, prefix + ".json")
    if not os.path.exists(first):
        return first
    return os.path.join(folder, "%s-%s.json" % (prefix, datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")))


def _dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def run_supabase(folder):
    """Move each re-pointed assignment's kb_curation row to the new title: a fresh read, a guarded PATCH of the value
    alone (on the value, reviewer and save time the read found), then a fresh read files each row. A row a person
    saved, or one changed since the plan, is left and named. The log names every planned PATCH before the first
    write. Returns the log."""
    ops = []
    for c in mirror_changes(folder):
        live = _live(c["course_id"], c["row_field"])
        op = {"op": "repoint", "course_id": c["course_id"], "field": c["row_field"], "before": c["before"],
              "after": c["after"], "before_row": {k: (live or {}).get(k) for k in ROW_COLS} if live else None}
        if live is None:
            op.update(status="left", why="no kb_curation row for this assignment")
        elif live.get("value") == c["after"]:
            op.update(status="already")
        elif fold_issuer.is_person(live.get("reviewer_email")):
            op.update(status="left", why="a person saved the live row (%s); it waits for a ruling"
                      % live.get("reviewer_email"))
        elif live.get("value") != c["before"]:
            op.update(status="left", why="the live row holds another title (%r)" % live.get("value"))
        else:
            op.update(status="planned")
        ops.append(op)
    path = _log_path(folder, "repoint_supabase_log")
    _dump(path, {"_state": "pending", "_planned_at": _now(), "log": ops})
    for op in ops:
        if op["status"] != "planned":
            continue
        b = op["before_row"]
        try:
            rest("PATCH", "kb_curation?" + _qs(course_id=op["course_id"], field=op["field"], value=op["before"],
                                               reviewer_email=b.get("reviewer_email"),
                                               reviewed_at=b.get("reviewed_at")), {"value": op["after"]})
        except Exception as e:  # filed from the read below either way: a lost response may have committed
            op["echo_error"] = str(e)[:200]
    for op in ops:
        if op["status"] == "planned":
            op["filed"] = _file_row(op, _live(op["course_id"], op["field"]))
            op["status"] = "ok" if op["filed"] == "landed" else "fail"
    _dump(path, {"_state": "filed", "_filed_at": _now(), "log": ops})
    return path, ops


def supabase_undo_ops(folder, skip_titles=()):
    """The reversal of every planned row re-point, from the logs' planned entries, newest first; each guarded on the
    row the re-point left (the new value, the reviewer and save time it kept)."""
    skip = set(skip_titles or ())
    out, seen = [], set()
    names = sorted(n for n in os.listdir(folder) if n.startswith("repoint_supabase_log") and n.endswith(".json")) \
        if os.path.isdir(folder) else []
    for n in reversed(names):
        with open(os.path.join(folder, n), encoding="utf-8") as f:
            doc = json.load(f)
        for e in doc.get("log") or []:
            if e.get("op") != "repoint" or not e.get("before_row") or e.get("filed") == "not_landed":
                continue
            if e.get("status") not in ("ok", "planned", "fail") or e["after"] in skip:
                continue
            k = (e["course_id"], e["field"])
            if k in seen:
                continue
            seen.add(k)
            out.append({"op": "repoint_back", "course_id": e["course_id"], "field": e["field"], "after": e["after"],
                        "before": e["before_row"]})
    return out


def _sql_q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"


def _sql_is(col, v):
    return "%s is null" % col if v is None else "%s = %s" % (col, _sql_q(v))


def supabase_plan_sql(folder):
    """The re-point's kb_curation half as guarded SQL, for a person to run when no runner can (Rule 10): one UPDATE
    per bot row still on its old title, guarded on the value and the reviewer the plan found."""
    lines = ["-- The kb_curation half of a credential rename's re-point (kb/_cred_rename_repoint.py). Each UPDATE",
             "-- changes the value alone, only while the row still holds the old title under the bot that saved it.",
             "begin;"]
    for c in mirror_changes(folder):
        lines.append("update kb_curation set value = %s where course_id = %s and field = %s and value = %s and %s;"
                     % (_sql_q(c["after"]), _sql_q(c["course_id"]), _sql_q(c["row_field"]), _sql_q(c["before"]),
                        _sql_is("reviewer_email", c["reviewer"])))
    lines.append("commit;")
    return "\n".join(lines) + "\n"


# ── the count ─────────────────────────────────────────────────────────────────────────────────────────────────

def _excluded(rel):
    for d, why in EXCLUDE_DIRS.items():
        if rel == d or rel.startswith(d + "/"):
            return why
    if any(EXCLUDE_SEGMENT.match(seg) for seg in rel.split("/")[1:-1]):
        return EXCLUDE_SEGMENT_WHY
    return None


def _overlay_rows(entry, old):
    reviews = (entry or {}).get("field_reviews") or {}
    return [{"course_id": CRED_REVIEW + old, "field": f, "value": entry.get(f),
             "reviewer_email": (reviews.get(f) or {}).get("by"), "reviewed_at": (reviews.get(f) or {}).get("at")}
            for f in reviews]


def kept_overlay_titles(overlay, renames, merges, families):
    """{old title: why} for each credential-panel entry still on an old title whose every row the row move keeps in
    place (kb/_cred_rename_apply_supabase.py plan_moves op "keep": a person's fold into a family title, Sam's ruling
    C). Those rows are a person's and stay; the count names them as kept, not left."""
    import _cred_rename_apply_supabase as sup
    out = {}
    for old in list(renames) + list(merges):
        entry = (overlay or {}).get(old)
        rows = _overlay_rows(entry, old)
        if not rows:
            continue
        ops = sup.plan_moves({old: renames[old]} if old in renames else {},
                             {old: merges[old]} if old in merges else {}, {CRED_REVIEW + old: rows}, families)
        if ops and all(o["op"] == "keep" for o in ops):
            out[old] = "every row is a person's fold into a family title, which the row move keeps in place"
    return out


def predict_overlay(overlay, renames, merges, families):
    """The credential-panel overrides as the row move would leave them: each field it moves or deletes leaves the
    old title. A preview for the dry run."""
    import _cred_rename_apply_supabase as sup
    out = json.loads(json.dumps(overlay or {}))
    for old in list(renames) + list(merges):
        entry = out.get(old)
        rows = _overlay_rows(entry, old)
        if not rows:
            continue
        ops = sup.plan_moves({old: renames[old]} if old in renames else {},
                             {old: merges[old]} if old in merges else {}, {CRED_REVIEW + old: rows}, families)
        for o in ops:
            if o["op"] in ("patch", "delete"):
                entry.pop(o["field"], None)
                (entry.get("field_reviews") or {}).pop(o["field"], None)
        if not (entry.get("field_reviews") or {}):
            out.pop(old, None)
    return out


def _walk(obj, olds, path=()):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in olds:
                yield path + (k,), k, "key"
            yield from _walk(v, olds, path + (k,))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _walk(v, olds, path + (i,))
    elif isinstance(obj, str) and obj in olds:
        yield path, obj, "value"


def _loc(rel, path):
    return rel + ":" + "".join("[%d]" % p if isinstance(p, int) else "/" + str(p) for p in path)


def old_titles_left(renames, merges, root=ROOT, virtual=None, skip=None):
    """Every old title of this rename still under kb/ as an exact JSON key or string value, outside the folders
    and alias lists that keep old names on purpose. virtual: {relpath: object} read in place of the file (the dry
    run's prediction); skip: {relpath: why} left out of this count. Returns the receipt block."""
    olds = set(renames) | set(merges)
    virtual, skip = dict(virtual or {}), dict(skip or {})
    families = fold_issuer.family_titles(os.path.join(root, FAMILIES_FILE))
    needles = [n for o in olds for n in {json.dumps(o, ensure_ascii=False).encode("utf-8"),
                                         json.dumps(o).encode("utf-8")}]
    left, kept, alias_skipped = [], [], 0
    rels = set(virtual)
    for dp, dns, fns in os.walk(os.path.join(root, "kb")):
        reld = os.path.relpath(dp, root).replace(os.sep, "/")
        if _excluded(reld + "/x"):
            dns[:] = []
            continue
        for fn in fns:
            if fn.endswith(".json"):
                rels.add(reld + "/" + fn)
    for rel in sorted(rels):
        if rel in skip or _excluded(rel):
            continue
        if rel in virtual:
            doc = virtual[rel]
        else:
            with open(os.path.join(root, rel), "rb") as f:
                raw = f.read()
            if not any(n in raw for n in needles):
                continue
            try:
                doc = json.loads(raw.decode("utf-8"))
            except ValueError:
                continue
        kept_here = {}
        if rel == OVERLAY_FILE:
            kept_here = kept_overlay_titles((doc or {}).get("overrides") or {}, renames, merges, families)
        for path, title, how in _walk(doc, olds):
            if _is_alias_slot(rel, path):
                alias_skipped += 1
                continue
            if kept_here and len(path) >= 2 and path[0] == "overrides" and path[1] in kept_here:
                if len(path) == 2:
                    kept.append({"location": _loc(rel, path), "title": title, "why": kept_here[path[1]]})
                continue
            left.append({"location": _loc(rel, path), "title": title, "as": how})
    return {"count": len(left), "locations": left, "kept": kept, "alias_entries_skipped": alias_skipped,
            "excluded": dict(EXCLUDE_DIRS, **{"<dated or saved/ folder>": EXCLUDE_SEGMENT_WHY}, **ALIAS_SLOTS),
            "not_counted_here": skip, "at": _now()}


# Files the apply rebuilds from the files above after its writes; the prediction cannot rebuild them, so it names them.
REBUILT_BY_APPLY = {
    "kb/exhibits_related.json": "rebuilt by the apply (kb/_build_exhibits_related.py) from the re-pointed files",
    "kb/remint_blast_worklist.json": "rebuilt by the apply (kb/_build_remint_blast_radius.py)",
}


def predict_left(renames, merges, root=ROOT):
    """would_leave_old_titles: the count old_titles_left() would read after an apply of these renames and merges, from
    the files as they stand, every write simulated in memory (the three credential files, the re-points, and the row
    move's effect on the credential-panel overrides). None when root is None."""
    if root is None:
        return None
    moves = dict(renames, **merges)
    virtual = {}
    creds = _read(root, "kb/credentials.json")
    if creds is not None:
        out = {}
        for k, v in creds.items():
            t = moves.get(k, k)
            out[t] = (out.get(t) or []) + (v or []) if t in out else v
        virtual["kb/credentials.json"] = out
    ut = _read(root, "kb/unified_titles.json")
    if ut is not None:
        for e in ut.values():
            if isinstance(e, dict) and e.get("unified_title") in moves:
                e["unified_title"] = moves[e["unified_title"]]
        virtual["kb/unified_titles.json"] = ut
    art = _read(root, "kb/coci_articulations.json")
    if art is not None:
        for r in art.get("articulations") or []:
            if isinstance(r, dict) and r.get("unified_title") in moves:
                r["unified_title"] = moves[r["unified_title"]]
        virtual["kb/coci_articulations.json"] = art
    changes, _ = plan(moves, root)
    for spec in SPECS:
        doc = _read(root, spec["file"])
        if doc is None:
            continue
        box = doc.setdefault(spec["container"], {})
        for c in changes:
            if c["file"] != spec["file"]:
                continue
            if c["kind"] == "key":
                for t, v in c["after"].items():
                    if v is None:
                        box.pop(t, None)
                    else:
                        box[t] = v
            else:
                cell = _cell(box, c, spec)
                if isinstance(cell, dict):
                    cell[c["field"]] = c["after"]
        virtual[spec["file"]] = doc
    ov = _read(root, OVERLAY_FILE)
    if ov is not None:
        families = fold_issuer.family_titles(os.path.join(root, FAMILIES_FILE))
        virtual[OVERLAY_FILE] = dict(ov, overrides=predict_overlay(ov.get("overrides") or {}, renames, merges,
                                                                   families))
    return old_titles_left(renames, merges, root, virtual=virtual, skip=REBUILT_BY_APPLY)


# ── the command line ──────────────────────────────────────────────────────────────────────────────────────────

def _moves_of(folder):
    with open(os.path.join(folder, "alias_map.json"), encoding="utf-8") as f:
        snap = json.load(f)
    return snap.get("renames") or {}, snap.get("merges") or {}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--repair", metavar="RECEIPT", help="re-point what an applied rename left (dry run unless --apply)")
    g.add_argument("--supabase", metavar="RECEIPT", help="move the re-pointed assignments' kb_curation rows")
    g.add_argument("--supabase-plan", metavar="RECEIPT", help="write repoint_supabase.sql beside the receipt")
    g.add_argument("--count", metavar="RECEIPT", help="write old_titles_left.json (with --check: read it, exit 1 "
                                                      "when any old title is left)")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--root", default=ROOT)
    a = ap.parse_args(argv)
    if a.repair:
        renames, merges = _moves_of(a.repair)
        moves = dict(renames, **merges)
        changes, held = plan(moves, a.root)
        for c in changes:
            print("  %s %s: %r -> %r" % (c["file"], c["key"], c["before"] if c["kind"] != "key" else
                                         sorted(t for t, v in c["before"].items() if v is not None), _title(c)))
        for h in held:
            print("  HELD %s %s: %s" % (h["file"], h["key"], h["why"]))
        print("[cred_rename_repoint] %d change(s), %d person row(s) held%s"
              % (len(changes), len(held), "" if a.apply else " (dry run; --apply writes)"))
        if a.apply and (changes or held):
            apply_changes(changes, a.root)
            print("  receipt: %s" % write_receipt(a.repair, moves, changes, held, a.root, source="repair"))
        return 0
    if a.supabase:
        if not KEY:
            sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
        path, ops = run_supabase(a.supabase)
        bad = [o for o in ops if o["status"] in ("fail", "left")]
        print("[cred_rename_repoint] kb_curation: %d moved, %d already, %d left or failed; log %s"
              % (sum(o["status"] == "ok" for o in ops), sum(o["status"] == "already" for o in ops), len(bad), path))
        for o in bad:
            print("  %s %s: %s" % (o["status"].upper(), o["course_id"], o.get("why") or o.get("filed")))
        return 1 if any(o["status"] == "fail" for o in ops) else 0
    if a.supabase_plan:
        p = os.path.join(a.supabase_plan, "repoint_supabase.sql")
        with open(p, "w", encoding="utf-8") as f:
            f.write(supabase_plan_sql(a.supabase_plan))
        print("wrote %s" % p)
        return 0
    path = os.path.join(a.count, "old_titles_left.json")
    if a.check:
        if not os.path.isfile(path):
            print("::error title=Old titles not counted::%s is missing: the count did not run." % path)
            return 1
        with open(path, encoding="utf-8") as f:
            res = json.load(f)
        if res.get("count"):
            where = "; ".join(x["location"] for x in res["locations"][:20])
            print("::error title=Old titles left under kb/::%d old title(s) left after the apply: %s"
                  % (res["count"], where))
            return 1
        print("No old title left under kb/ (%d kept by rule)." % len(res.get("kept") or []))
        return 0
    renames, merges = _moves_of(a.count)
    res = old_titles_left(renames, merges, a.root)
    _dump(path, dict(res, _about="Each old title of this apply still under kb/ after its writes "
                                 "(kb/_cred_rename_repoint.py). Target 0; kept are a person's rows the row move "
                                 "keeps by rule."))
    print("[cred_rename_repoint] old titles left under kb/: %d (kept by rule: %d); wrote %s"
          % (res["count"], len(res["kept"]), path))
    for x in res["locations"][:40]:
        print("  LEFT %s" % x["location"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
