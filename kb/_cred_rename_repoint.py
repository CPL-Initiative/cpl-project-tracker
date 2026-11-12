#!/usr/bin/env python3
"""Re-point what a credential rename leaves on a retired title, and count the old titles left under kb/.

Why it exists (COBIx on #3110, issue comments 6813000047 and 6813256997): the 2026-11-12 apply renamed 22 ASE
bundle titles and merged 2. It re-keyed the three credential files and left three things behind:
  1. a saved assignment on a retired title. kb_curation's _UNCLASSIFIED:: row for "Automotive Service Excellence
     (ASE) A4 and A5" (and its copy in kb/unclassified_assignments.json) kept "ASE Bundle — A4, A5", a row
     cer-procedure-classifier@bot saved on 2026-10-31, and kb/cer_classified.json held the same pair.
     kb/_build_exhibits_related.py then lists the retired title as a title a card could fold into;
  2. kb/reference/map_cpl_opportunities_verified.json, whose by_title is keyed by common title: the new titles
     lost their MAP links, and no workflow re-titles that file. kb/occupation_credential_map.json, the curated
     occupation rulings, named two retired titles in three rulings a bot curated;
  3. no count of the old titles left, so main read red for 68 minutes before anyone looked.

What this module does, for every rename and merge an apply makes:
  * plan() finds each saved value equal to an old title (and each by_title key) and the title it moves to. A value
    moves only when a bot saved it (its saver ends in "@bot"): a person's row, or one with no saver named, is held
    for a ruling and never changed (the rule kb/_cer_decision_apply.py load_plan keeps since #3123). For a saved
    assignment the saver is the title row's own (title_reviewed_by), never the newest saver of any field;
  * apply_changes() writes the files, each value only while it holds the planned value under the planned saver;
    filed() reads them back, so the receipt names what landed from a fresh read, never from the write's echo
    (cpl_memory pitfall-receipt-built-from-a-write-echo-2026-11-12);
  * kb/unclassified_assignments.json is a copy of kb_curation's _UNCLASSIFIED:: rows that
    kb/_apply_unclassified_triage.py rewrites from them, so this module never writes that file. run_supabase()
    moves the row itself (via "kb_curation"): a fresh read of the title row, a PATCH of the value alone guarded on
    the value, saver and save time it found, and a fresh read filing what landed. The workflow then re-reads the
    copy, so the file and the table agree;
  * undo_plan(), supabase_undo() and the undo ops put each value back from the planned lists, each guarded on the
    value and saver the re-point left, each filed from a read-back;
  * history_moves() gives the apply every APPLIED rename, earlier applies included, each followed to the title live
    now, so an apply re-points the machine values earlier applies left too, inside its own receipt;
  * old_titles_left() counts every old title still in kb/**/*.json as an exact JSON key or string value.

  python3 kb/_cred_rename_repoint.py --supabase kb/cred_rename_out/2026-11-12          # the kb_curation half
  python3 kb/_cred_rename_repoint.py --supabase-undo kb/cred_rename_out/2026-11-12     # take that half back
  python3 kb/_cred_rename_repoint.py --undo kb/cred_rename_out/2026-10-01 [--apply]    # undo a receipt's re-points
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
VIA_KB_CURATION = "kb_curation"

# The files a rename re-points. "value": each entry under `container` holds the title in `field`; "key": the
# container is keyed by title; "item": each entry holds a `list` of objects with the title in `field`. `reviewer`
# names the field holding the title's saver; a file with none names its one writer. "mirror": the file copies
# kb_curation rows, so the row moves and the copy follows. Each file is written back in its own format.
SPECS = (
    {"file": "kb/unclassified_assignments.json", "kind": "value", "container": "assignments",
     "field": "unified_title", "reviewer": "title_reviewed_by", "indent": 2,
     "mirror": {"prefix": UNCLASS, "field": UNCLASS_FIELD},
     "why": "saved title assignments, copied each night from kb_curation by kb/_apply_unclassified_triage.py"},
    {"file": "kb/cer_classified.json", "kind": "value", "container": "records", "field": "unified_title",
     "reviewer": None, "writer": "the classifier's cache (kb/_cer_procedures.py)", "indent": 1,
     "why": "the classifier's answers, which cer-procedures.yml recommits each night"},
    {"file": "kb/reference/map_cpl_opportunities_verified.json", "kind": "key", "container": "by_title",
     "writer": "kb/_verify_map_exhibit_links.py", "indent": 1,
     "why": "MAP's listed exhibit ids by common title; no workflow re-titles it after a rename"},
    {"file": "kb/statewide_exhibit_categories.json", "kind": "key", "container": "titles", "scalar": True,
     "writer": "kb/_seed_statewide_categories.py (an AI-assisted seed keyed by title)", "indent": 2,
     "why": "each statewide title's program-area category; a re-run of its seed adds new titles and keeps old ones"},
    {"file": "kb/occupation_credential_map.json", "kind": "item", "container": "occupations", "list": "credentials",
     "field": "title", "reviewer": "curated_by", "indent": 1, "ascii": True, "newline": False,
     "why": "the curated occupation-to-credential rulings kb/_build_partner_crosswalk.py reads; each title must "
            "match a unified title"},
)

# What the count reads, named in its receipt and its messages.
COUNT_SCOPE = "kb/**/*.json"
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
# Fields that carry an earlier name on purpose, by file: the count never reads a value under them.
EARLIER_NAME_FIELDS = {
    "kb/it_ai_credential_catalog.json": ("formerly", "the vendor's earlier names of a credential, kept for search"),
    "kb/reference/industry_credential_watch.json": ("formerly", "the earlier names the credential watch records"),
    "kb/reference/cos_certifications.json": ("name", "CareerOneStop's own spelling of a certification, an outside "
                                                    "catalog this repo never renames"),
}


def _is_alias_slot(rel, path):
    if rel == "kb/exhibits_related.json" and len(path) >= 3 and path[0] == "titles" and path[2] == 5:
        return True
    f = EARLIER_NAME_FIELDS.get(rel)
    return bool(f) and f[0] in path


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _stamp():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")


def _read(root, rel):
    if root is None or not os.path.isfile(os.path.join(root, rel)):
        return None
    with open(os.path.join(root, rel), encoding="utf-8") as f:
        return json.load(f)


def _write(root, rel, obj, spec):
    p = os.path.join(root, rel)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=spec["indent"], ensure_ascii=spec.get("ascii", False))
        if spec.get("newline", True):
            f.write("\n")
    os.replace(tmp, p)


def _dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def _spec(rel):
    return next(s for s in SPECS if s["file"] == rel)


def root_of(credentials_path):
    """The tree whose saved files go with this credentials file: the parent of the kb/ folder holding it, or None
    when the file sits outside a kb/ folder (a test's scratch copy), so nothing is re-pointed."""
    kb = os.path.dirname(os.path.abspath(credentials_path))
    return os.path.dirname(kb) if os.path.basename(kb) == "kb" else None


# ── the plan ──────────────────────────────────────────────────────────────────────────────────────────────────

class RenameChain(ValueError):
    """A target of the moves is itself a title the same moves rename: one lookup would land on a retired title."""


def check_no_chain(moves):
    chain = sorted((o, n) for o, n in moves.items() if o != n and n in moves and moves[n] != n)
    if chain:
        raise RenameChain("rename chain: %s moves to %r, which these moves rename again; resolve it to the title it "
                          "carries now (kb/credential_aliases.py moves) before re-pointing" % chain[0])


def plan(moves, root=ROOT, origin=None):
    """moves: {old title: new title}, renames and merges together. Returns (changes, held_person_rows).

    A value or item change: {file, kind, key[, index], field, before, after, reviewer, reviewer_field[, via]}. A key
    change, one per target: {file, kind "key", key: the target, before: {title: ids or None}, after: {...}}.
    Raises RenameChain when a target is itself renamed by the same moves."""
    check_no_chain(moves)
    changes, held = [], []
    if root is None:
        return changes, held
    changes, held = _plan(moves, root)
    for c in changes + held:   # the apply whose rename retired each old title (history_moves)
        olds = [c["before"]] if c["kind"] != "key" else sorted(t for t, v in c["after"].items() if v is None)
        names = sorted({origin[o] for o in olds if o in (origin or {})})
        if names:
            c["from_apply"] = names[0] if c["kind"] != "key" else names
    return changes, held


def _plan(moves, root):
    changes, held = [], []
    for spec in SPECS:
        doc = _read(root, spec["file"])
        if doc is None:
            continue
        box = doc.get(spec["container"]) or {}
        if spec["kind"] == "value":
            for key in sorted(box):
                e = box[key]
                v = e.get(spec["field"]) if isinstance(e, dict) else None
                if v not in moves or moves[v] == v:
                    continue
                rf = spec.get("reviewer")
                row = {"file": spec["file"], "kind": "value", "key": key, "field": spec["field"], "before": v,
                       "after": moves[v], "reviewer_field": rf,
                       "reviewer": e.get(rf) if rf else spec["writer"]}
                if spec.get("mirror"):
                    row["via"] = VIA_KB_CURATION
                if rf and rf not in e and spec.get("mirror") and fold_issuer.is_bot(e.get("reviewed_by")):
                    # A copy written before the sync recorded the title's own saver, whose newest saver is a bot:
                    # the live title row decides (run_supabase), and the copy follows it at the re-read.
                    row["reviewer"] = None
                    row["saver"] = "not recorded in the copy; the live title row decides"
                    changes.append(row)
                elif rf and rf not in e and spec.get("mirror"):
                    held.append(dict(row, reviewer=e.get("reviewed_by"), why="the copy does not record who saved "
                                     "the title, and its newest saver is %s; held" % (e.get("reviewed_by") or "no one")))
                elif rf and not fold_issuer.is_bot(row["reviewer"]):
                    held.append(dict(row, why="%s saved this title; a rename never changes it, so it waits for a "
                                              "ruling" % (row["reviewer"] or "no saver named, so it")))
                else:
                    changes.append(row)
        elif spec["kind"] == "item":
            for key in sorted(box):
                e = box[key] if isinstance(box[key], dict) else {}
                items = e.get(spec["list"]) or []
                landing = {}
                for i, it in enumerate(items):
                    t = it.get(spec["field"]) if isinstance(it, dict) else None
                    landing.setdefault(moves.get(t, t), []).append(i)
                for i, it in enumerate(items):
                    v = it.get(spec["field"]) if isinstance(it, dict) else None
                    if v not in moves or moves[v] == v:
                        continue
                    who = e.get(spec["reviewer"])
                    row = {"file": spec["file"], "kind": "item", "key": key, "index": i, "field": spec["field"],
                           "before": v, "after": moves[v], "reviewer": who, "reviewer_field": spec["reviewer"]}
                    if not fold_issuer.is_bot(who):
                        held.append(dict(row, why="%s curated this ruling; a rename never changes it, so it waits "
                                                  "for a ruling" % (who or "no curator named, so it")))
                    elif len(landing.get(moves[v]) or []) > 1:
                        held.append(dict(row, why="the ruling would name %r twice; a person merges the entries"
                                                  % moves[v]))
                    else:
                        changes.append(row)
        else:
            by_target = {}
            for old in sorted(box):
                if old in moves and moves[old] != old:
                    by_target.setdefault(moves[old], []).append(old)
            for new, olds in sorted(by_target.items()):
                before = {t: box.get(t) for t in [new] + olds}
                if spec.get("scalar"):
                    # One value per title: the target keeps its own; else every old title must agree on one.
                    vals = {json.dumps(box[o], sort_keys=True) for o in olds}
                    if new in box:
                        vals.add(json.dumps(box[new], sort_keys=True))
                    if len(vals) > 1:
                        held.append({"file": spec["file"], "kind": "key", "key": new, "before": before,
                                     "after": before, "reviewer": spec["writer"], "reviewer_field": None,
                                     "why": "the old and new titles carry different values; a person picks one"})
                        continue
                    merged = box[new] if new in box else box[olds[0]]
                else:
                    merged = sorted({x for t in [new] + olds for x in (box.get(t) or [])})
                after = dict({o: None for o in olds}, **{new: merged})
                changes.append({"file": spec["file"], "kind": "key", "key": new, "before": before, "after": after,
                                "reviewer": spec["writer"], "reviewer_field": None})
    return changes, held


def _title(c):
    """The title a change lands on: the fold group it belongs to in the undo."""
    return c["key"] if c["kind"] == "key" else c["after"]


def undo_title(c):
    return _title(c)


def _cell(box, c, spec):
    """The object that holds a value or item change's title, or None."""
    e = box.get(c["key"])
    if c["kind"] == "item":
        lst = (e or {}).get(spec["list"]) if isinstance(e, dict) else None
        return lst[c["index"]] if isinstance(lst, list) and 0 <= c["index"] < len(lst) else None
    return e


def _saver_ok(box, c, spec):
    """True when the entry still names the saver the change was planned under (no saver field: always)."""
    rf = c.get("reviewer_field", spec.get("reviewer"))
    if not rf or c.get("via"):
        return True
    return (box.get(c["key"]) or {}).get(rf) == c["reviewer"]


def apply_changes(changes, root=ROOT):
    """Write every change, each only while its file holds the planned value under the planned saver. A change that
    goes through kb_curation is never written here: the row moves, and the copy is re-read from it."""
    by_file = {}
    for c in changes:
        if not c.get("via"):
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
                if isinstance(e, dict) and e.get(c["field"]) == c["before"] and _saver_ok(box, c, spec):
                    e[c["field"]] = c["after"]
            elif all(box.get(t) == v for t, v in c["before"].items()):
                for t, v in c["after"].items():
                    if v is None:
                        box.pop(t, None)
                    else:
                        box[t] = v
        if spec["kind"] == "key" and not spec.get("scalar"):
            doc[spec["container"]] = dict(sorted(box.items()))
        _write(root, rel, doc, spec)


def _state(c, root, cache):
    """'after', 'before', 'other' or 'absent': what the file holds for this change now. A value whose saver changed
    since is 'other', whatever the value."""
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
        if not _saver_ok(box, c, spec):
            return "other"
        return "after" if cur == c["after"] else ("before" if cur == c["before"] else "other")
    cur = {t: box.get(t) for t in c["after"]}
    if cur == c["after"]:
        return "after"
    return "before" if cur == {t: box.get(t) for t in c["before"]} == c["before"] else "other"


def filed(changes, root=ROOT):
    """Each planned change as a fresh read of its file finds it: landed when the file holds the after value. A change
    through kb_curation reads 'via_kb_curation' until the copy is re-read from the moved row."""
    cache = {}
    out = []
    for c in changes:
        s = _state(c, root, cache)
        if c.get("via") and s != "after":
            out.append(dict(c, filed="via_kb_curation"))
        else:
            out.append(dict(c, filed="landed" if s == "after" else ("not_landed" if s == "before" else s)))
    return out


def not_landed(filed_rows):
    """The filed rows whose file write did not land (a change through kb_curation is filed by its own log)."""
    return [c for c in filed_rows if c["filed"] not in ("landed", "via_kb_curation")]


def receipts(folder):
    """Every repoint receipt in an apply's folder, oldest first."""
    if not os.path.isdir(folder):
        return []
    names = [n for n in os.listdir(folder) if re.match(r"^repoint(-\d{8}T\d{6}\d*Z)?\.json$", n)]
    names.sort(key=lambda n: (n != "repoint.json", n))
    out = []
    for n in names:
        with open(os.path.join(folder, n), encoding="utf-8") as f:
            out.append(dict(json.load(f), _name=n))
    return out


def write_receipt(out_dir, moves, changes, held, root=ROOT, source="apply"):
    """repoint.json (or repoint-<UTC>.json beside an earlier one) in the apply's receipt folder. The planned list is
    the undo's input; `filed` is read back from the files after the writes. Returns (path, filed rows)."""
    path = os.path.join(out_dir, "repoint.json")
    if os.path.exists(path):
        path = os.path.join(out_dir, "repoint-%s.json" % _stamp())
    rows = filed(changes, root)
    _dump(path, {
        "_about": "The saved values this rename moved off a retired title (kb/_cred_rename_repoint.py). planned is "
                  "the undo's input (kb/_cred_rename_undo.py); filed is a fresh read of each file after the writes. "
                  "held_person_rows were saved by a person, or name no saver, and never change without a ruling. "
                  "A change via kb_curation moves the row (repoint_supabase_log*.json); its copy follows.",
        "source": source, "at": _now(), "moves": dict(sorted(moves.items())),
        "planned": changes, "filed": rows, "held_person_rows": held,
    })
    return path, rows


# ── the undo of the files ─────────────────────────────────────────────────────────────────────────────────────

def undo_plan(folder, root=ROOT):
    """Every planned file change of the folder's repoint receipts, read against the files now. Returns (todo, drift,
    absent): todo holds the changes still at their after value under their planned saver (newest receipt first, so a
    re-point made twice reverses once), drift those whose value or saver changed since (listed, left alone), absent
    those whose file is not in this tree. A change via kb_curation is the kb_curation half's to reverse."""
    cache, todo, drift, absent, seen = {}, [], [], [], set()
    for doc in reversed(receipts(folder)):
        for c in doc.get("planned") or []:
            if c.get("via"):
                continue
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


def _live(cid, field, rest_fn=None):
    rows = (rest_fn or rest)("GET", "kb_curation?select=course_id,field,%s&%s"
                             % (",".join(ROW_COLS), _qs(course_id=cid, field=field)))
    return rows[0] if rows else None


def mirror_changes(folder):
    """The planned changes that move a kb_curation row, each once (newest receipt wins)."""
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
    """What a fresh read finds after a planned move: landed (the new title under the saver and save time the move
    was guarded on), not_landed (the row as it stood), gone, or changed."""
    b = op.get("before_row") or {}
    if live is None:
        return "gone"
    same_saver = all(live.get(k) == b.get(k) for k in ("reviewer_email", "reviewed_at"))
    if live.get("value") == op["after"] and same_saver:
        return "landed"
    if live.get("value") == op["before"] and same_saver:
        return "not_landed"
    return "changed"


def _log_path(folder, prefix):
    first = os.path.join(folder, prefix + ".json")
    return first if not os.path.exists(first) else os.path.join(folder, "%s-%s.json" % (prefix, _stamp()))


def _logs_newest_first(folder, prefix):
    """The folder's logs named <prefix>.json and <prefix>-<UTC>.json, newest first: the plain name is the first run's,
    and the stamped ones follow in time order."""
    if not os.path.isdir(folder):
        return []
    names = [n for n in os.listdir(folder) if n.endswith(".json")
             and (n == prefix + ".json" or n.startswith(prefix + "-"))]
    names.sort(key=lambda n: (n != prefix + ".json", n))
    out = []
    for n in reversed(names):
        with open(os.path.join(folder, n), encoding="utf-8") as f:
            out.append((n, json.load(f)))
    return out


def run_supabase(folder, rest_fn=None):
    """Move each planned assignment's kb_curation title row to the new title: a fresh read; a PATCH of the value
    alone, guarded on the value, saver and save time the read found; then a fresh read files each row. Only a row a
    bot saved moves: a person's, or one naming no saver, is left and named (the file side holds the same rows). A
    row already on the new title is filed from the read and not written. The log names every planned PATCH before
    the first write. Returns (log path, ops)."""
    rest_fn = rest_fn or rest
    ops = []
    for c in mirror_changes(folder):
        live = _live(c["course_id"], c["row_field"], rest_fn)
        op = {"op": "repoint", "course_id": c["course_id"], "field": c["row_field"], "before": c["before"],
              "after": c["after"], "before_row": {k: (live or {}).get(k) for k in ROW_COLS} if live else None}
        if live is None:
            op.update(status="left", why="no kb_curation row for this assignment")
        elif live.get("value") == c["after"]:
            op.update(status="already", filed="already_new", why="the live row already holds the new title")
        elif not fold_issuer.is_bot(live.get("reviewer_email")):
            op.update(status="left", why="%s saved the live title row; it waits for a ruling"
                      % (live.get("reviewer_email") or "no saver is named on the live title row, so it"))
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
            rest_fn("PATCH", "kb_curation?" + _qs(course_id=op["course_id"], field=op["field"], value=op["before"],
                                                  reviewer_email=b.get("reviewer_email"),
                                                  reviewed_at=b.get("reviewed_at")), {"value": op["after"]})
        except Exception as e:  # filed from the read below either way: a lost response may have committed
            op["echo_error"] = str(e)[:200]
    for op in ops:
        if op["status"] == "planned":
            op["filed"] = _file_row(op, _live(op["course_id"], op["field"], rest_fn))
            op["status"] = "ok" if op["filed"] == "landed" else "fail"
    _dump(path, {"_state": "filed", "_filed_at": _now(), "log": ops})
    return path, ops


def supabase_undo_ops(folder, skip_titles=()):
    """The reversal of every row move the logs planned, newest log first, each (course_id, field) once; each guarded
    on the row the move left (the new value, under the saver and save time it kept)."""
    skip = set(skip_titles or ())
    out, seen = [], set()
    for _, doc in _logs_newest_first(folder, "repoint_supabase_log"):
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


def _back_state(o, cur):
    """'back' (the old value under the saver the move kept), 'moved' (the new value under that saver), 'gone' or
    'changed' (a person or another run saved the row since)."""
    b = o["before"]
    same = cur is not None and all(cur.get(k) == b.get(k) for k in ("reviewer_email", "reviewed_at"))
    if cur is None:
        return "gone"
    if same and cur.get("value") == b.get("value"):
        return "back"
    if same and cur.get("value") == o["after"]:
        return "moved"
    return "changed"


def live_drift(folder, skip_titles=(), rest_fn=None):
    """Each moved row of the folder whose live row changed since the move (a person re-saved the title, or it is
    gone), read-only: the full undo reads these BEFORE any file goes back, and holds each one's fold group."""
    out = []
    for o in supabase_undo_ops(folder, skip_titles):
        st = _back_state(o, _live(o["course_id"], o["field"], rest_fn))
        if st in ("changed", "gone"):
            out.append(dict(o, title=o["after"], live=st))
    return out


def repoint_back(o, rest_fn=None):
    """Put one moved row back: read it; when it still holds the new title under the saver and save time the move
    kept, PATCH the old value back guarded on all three; then read it back and file what it holds. Returns
    {"status": "ok" | "already" | "left" | "fail", ...}. A read that fails raises."""
    rest_fn = rest_fn or rest
    b = o["before"]
    saver = {k: b.get(k) for k in ("reviewer_email", "reviewed_at")}
    state = lambda cur: _back_state(o, cur)  # noqa: E731
    pre = state(_live(o["course_id"], o["field"], rest_fn))
    if pre == "back":
        return {"status": "already"}
    if pre != "moved":
        return {"status": "left", "why": "the row changed since the move (%s): left as it is" % pre}
    err = None
    try:
        rest_fn("PATCH", "kb_curation?" + _qs(course_id=o["course_id"], field=o["field"], value=o["after"], **saver),
                {"value": b.get("value")})
    except Exception as e:
        err = str(e)[:200]
    post = state(_live(o["course_id"], o["field"], rest_fn))
    out = {"status": "ok" if post == "back" else ("fail" if post == "moved" else "left"), "filed": post}
    if err:
        out["echo_error"] = err
    return out


def supabase_undo(folder, skip_titles=(), rest_fn=None, prefix="repoint_rollback_log"):
    """Every row move of the folder put back (repoint_back), with a pending log before the first write and a filed
    one after. Returns (log path, ops)."""
    ops = supabase_undo_ops(folder, skip_titles)
    path = _log_path(folder, prefix)
    _dump(path, {"_state": "pending", "_planned_at": _now(), "log": ops})
    done = []
    try:
        for o in ops:
            done.append(dict(o, **repoint_back(o, rest_fn)))
    finally:
        _dump(path, {"_state": "filed" if len(done) == len(ops) else "stopped", "_filed_at": _now(),
                     "log": done + [dict(o, status="not_run") for o in ops[len(done):]]})
    return path, done


# ── every applied rename (the apply re-points what earlier applies left) ─────────────────────────────────────

def _applied_order(name, snap):
    m = re.match(r"^(\d{4}-\d{2}-\d{2})(?:-(\d+))?$", name)
    return (snap.get("_applied_at") or "", m.group(1) if m else name, int(m.group(2) or 1) if m else 0)


def _snapshot(folder):
    """The folder's alias map when it was applied and is still in force (no undone.json, no apply_failed.json)."""
    path = os.path.join(folder, "alias_map.json")
    if not os.path.isfile(path) or any(os.path.exists(os.path.join(folder, m)) for m in ("undone.json",
                                                                                         "apply_failed.json")):
        return None
    with open(path, encoding="utf-8") as f:
        snap = json.load(f)
    return snap if snap.get("_applied_at") else None


def later_applied(folder):
    """The receipt folders beside this one applied after it and still in force, in applied order. An undo goes newest
    first: a later apply may hold this one's re-points (from_apply), which only its own undo puts back."""
    folder = os.path.abspath(folder)
    out_root = os.path.dirname(folder)
    with open(os.path.join(folder, "alias_map.json"), encoding="utf-8") as f:
        me = _applied_order(os.path.basename(folder), json.load(f))
    later = []
    for name in os.listdir(out_root):
        other = os.path.join(out_root, name)
        snap = _snapshot(other) if other != folder else None
        if snap and _applied_order(name, snap) > me:
            later.append((_applied_order(name, snap), name))
    return [n for _, n in sorted(later)]


def history_moves(out_root, current=None, live=None, current_name=None):
    """{old title: title it carries now} for every APPLIED rename and merge, and {old title: the receipt folder of the
    apply that retired it}. A receipt counts when its alias_map.json has _applied_at and it holds neither undone.json
    nor apply_failed.json; receipts are taken in the order they were applied (_applied_at, then date and same-day
    number, never the folder name's string order), then `current` (this apply's moves) on top. Each chain is followed
    to its end. live: the credential keys after this apply; an old title that is live again, or a target that is not
    live, is left out, so a value never moves onto a title no credential carries."""
    snaps = []
    for name in os.listdir(out_root) if os.path.isdir(out_root) else []:
        snap = _snapshot(os.path.join(out_root, name))
        if snap:
            snaps.append((_applied_order(name, snap), name, snap))
    steps = [(name, dict(snap.get("renames") or {}, **(snap.get("merges") or {}))) for _, name, snap in sorted(snaps)]
    if current:
        steps.append((current_name, dict(current)))   # this apply's own receipt folder (None in a dry run)
    now, origin = {}, {}
    for name, step in steps:
        step = {o: n for o, n in step.items() if o and n and o != n}
        for o in now:
            if now[o] in step:
                now[o] = step[now[o]]
        for o, n in step.items():
            now[o], origin[o] = n, name
    out = {o: n for o, n in now.items() if o != n and (live is None or (n in live and o not in live))}
    return out, {o: origin[o] for o in out if origin[o]}


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
    """Every old title of this rename still in kb/**/*.json as an exact JSON key or string value, outside the folders
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
    return {"count": len(left), "scope": COUNT_SCOPE, "locations": left, "kept": kept,
            "alias_entries_skipped": alias_skipped,
            "excluded": dict(EXCLUDE_DIRS, **{"<dated or saved/ folder>": EXCLUDE_SEGMENT_WHY}, **ALIAS_SLOTS,
                             **{"%s: %s" % (r, f): why for r, (f, why) in EARLIER_NAME_FIELDS.items()}),
            "not_counted_here": skip, "at": _now()}


# Files the apply rebuilds from the files above after its writes; the prediction cannot rebuild them, so it names them.
REBUILT_BY_APPLY = {
    "kb/exhibits_related.json": "rebuilt by the apply (kb/_build_exhibits_related.py) from the re-pointed files",
    "kb/remint_blast_worklist.json": "rebuilt by the apply (kb/_build_remint_blast_radius.py)",
}


def predict_left(renames, merges, root=ROOT):
    """would_leave_old_titles: the count old_titles_left() would read after an apply of these renames and merges, from
    the files as they stand, every write simulated in memory (the three credential files, the re-points, a bot's row
    moved and its copy re-read, and the row move's effect on the credential-panel overrides). None when root is
    None."""
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


def _print_plan(changes, held):
    for c in changes:
        print("  %s %s: %r -> %r%s" % (c["file"], c["key"], c["before"] if c["kind"] != "key" else
                                       sorted(t for t, v in c["before"].items() if v is not None), _title(c),
                                       " (the kb_curation row moves; the copy follows)" if c.get("via") else ""))
    for h in held:
        print("  HELD %s %s: %s" % (h["file"], h["key"], h["why"]))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--supabase", metavar="RECEIPT", help="move the planned assignments' kb_curation rows")
    g.add_argument("--supabase-undo", metavar="RECEIPT", help="put the receipt's moved kb_curation rows back")
    g.add_argument("--undo", metavar="RECEIPT", help="put a receipt's re-pointed file values back (dry run unless "
                                                     "--apply; with SUPABASE_SERVICE_KEY, the rows first)")
    g.add_argument("--count", metavar="RECEIPT", help="write old_titles_left.json (with --check: read it, exit 1 "
                                                      "when any old title is left)")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--root", default=ROOT)
    a = ap.parse_args(argv)
    if a.supabase:
        if not KEY:
            sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
        path, ops = run_supabase(a.supabase)
        print("[cred_rename_repoint] kb_curation: %d moved, %d already, %d left, %d failed; log %s"
              % tuple([sum(o["status"] == s for o in ops) for s in ("ok", "already", "left", "fail")] + [path]))
        for o in ops:
            if o["status"] in ("fail", "left"):
                print("  %s %s: %s" % (o["status"].upper(), o["course_id"], o.get("why") or o.get("filed")))
        return 1 if any(o["status"] == "fail" for o in ops) else 0
    if a.supabase_undo:
        if not KEY:
            sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
        path, done = supabase_undo(a.supabase_undo)
        print("[cred_rename_repoint] kb_curation rows put back: %d, already %d, left %d, failed %d; log %s"
              % tuple([sum(o["status"] == s for o in done) for s in ("ok", "already", "left", "fail")] + [path]))
        return 1 if any(o["status"] in ("fail", "left") for o in done) else 0
    if a.undo:
        later = later_applied(a.undo) if os.path.isfile(os.path.join(a.undo, "alias_map.json")) else []
        if later:
            sys.exit("undo %s first: it was applied after %s and may hold its re-points" % (later[-1], a.undo))
        todo, drift, absent = undo_plan(a.undo, a.root)
        for c in drift:
            print("  LEFT (changed since, by value or saver) %s %s" % (c["file"], c["key"]))
        print("[cred_rename_repoint] %d value(s) to put back, %d changed since and left%s"
              % (len(todo), len(drift), "" if a.apply else " (dry run; --apply writes)"))
        if a.apply:
            if supabase_undo_ops(a.undo):
                if not KEY:
                    sys.exit("The receipt moved kb_curation rows: set SUPABASE_SERVICE_KEY so they go back first.")
                _, done = supabase_undo(a.undo)
                if any(o["status"] == "fail" for o in done):
                    sys.exit("A kb_curation row did not go back; nothing in the files was written.")
            apply_changes([reverse(c) for c in todo], a.root)
        return 0
    path = os.path.join(a.count, "old_titles_left.json")
    if a.check:
        if not a.count.strip():
            print("No receipt: this run applied nothing, so there is nothing to count.")
            return 0
        if not os.path.isfile(path):
            print("::error title=Old titles not counted::%s is missing: the count did not run." % path)
            return 1
        with open(path, encoding="utf-8") as f:
            res = json.load(f)
        if res.get("count"):
            where = "; ".join(x["location"] for x in res["locations"][:20])
            print("::error title=Old titles left in %s::%d old title(s) left after the apply: %s"
                  % (res.get("scope", COUNT_SCOPE), res["count"], where))
            return 1
        print("No old title left in %s (%d kept by rule)." % (res.get("scope", COUNT_SCOPE), len(res.get("kept") or [])))
        return 0
    renames, merges = _moves_of(a.count)
    res = old_titles_left(renames, merges, a.root)
    _dump(path, dict(res, _about="Each old title of this apply still in %s after its writes "
                                 "(kb/_cred_rename_repoint.py). Target 0; kept are a person's rows the row move "
                                 "keeps by rule." % COUNT_SCOPE))
    print("[cred_rename_repoint] old titles left in %s: %d (kept by rule: %d); wrote %s"
          % (COUNT_SCOPE, res["count"], len(res["kept"]), path))
    for x in res["locations"][:40]:
        print("  LEFT %s" % x["location"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
