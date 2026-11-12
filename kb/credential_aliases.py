#!/usr/bin/env python3
"""credential_aliases.py — THE resolver for a stored credential title, and the titles a credential was known by.

Sam, 2026-11-11, on renaming the ASE titles in a batch: "Approved renames keep the old title as a search
alias, so nothing students or colleges already use stops working."

Every applied credential rename leaves its frozen alias map under kb/cred_rename_out/<dir>/alias_map.json
(kb/_cred_rename_apply.py: renames and confirmed merges, old title to new). A value saved before a rename (a
saved assignment in kb_curation, a file keyed by title) still names the old title. Nothing rewrites it: a
reader resolves it here, at read time, the way kb/alias_chain.py resolves a stored M-ID (the S640 conductor,
cpl_memory d-rename-repoint-stopped-resolve-at-read-s640, after #3140's five review rounds).

THE RULES, each one a fault this module exists to prevent:
  * A LIVE TITLE IS ITSELF; A TITLE THAT IS NOT LIVE RESOLVES, whenever it was saved (the S641 conductor, D1).
    Live is a key of kb/credentials.json. A snapshot of 2026-07-08 moved titles a person later brought back
    (Automotive Electronics, held for AUTO 60A by a June review): read through the chain they would leave the
    reference. So the chain stops at the first live title, and a title the chain starts on that is live is
    returned unchanged. A title that is not live moves through every in-force snapshot, in order, with no era
    guard: a saved time is no evidence (a person re-saving a stale row in an editor bumps it).
  * IN FORCE ONLY. A snapshot resolves only while its apply stands: `_applied_at` set, no apply_failed.json
    beside it, and no undo (an undone.json beside it, or its undo.json fold_id named by any undone.json,
    kb/fold_issuer.py undone_fold_ids). An undo run with --force leaves its skipped groups folded, so a move whose
    old or new title is in skipped_groups stays in force. An undo that left no marker (an undo.json with no
    fold_id writes no undone.json) put its old titles back in kb/credentials.json, so the live rule returns
    each of them unchanged. #3140's fifth round was a snapshot finder with no in-force filter.
  * APPLY ORDER, by `_applied_at` read as an instant. The folder name alone is wrong: "2026-11-12/" sorts after
    "2026-11-12-2/". A malformed `_applied_at`, two snapshots at one instant that name a common title, and a
    title in both `renames` and `merges` of one snapshot each raise: an order this module would have to guess.
  * ONE LOOKUP PER SNAPSHOT. A map is one apply, a simultaneous permutation: a swap (A->B and B->A in one apply)
    moves A once, to B. A title renamed by a later apply moves again (A->B, then B->C reads C).
  * A title no snapshot names comes back as itself.

The browser reads kb/credential_title_moves.json, which `python3 kb/credential_aliases.py` writes: each source
title's hops, one per snapshot that moved it. A reader takes the first live hop, or the last; the module's
answer, with the chain already walked here. `--check` (scripts/check_generated.sh, CI's lints job) compares the
hops; the report section (the returned titles) is rebuilt each run and read by a person.
`tests/credential_title_resolver_single_source_test.py` fails a second reader of the rename snapshots.

Search aliases (load()) add the titles the nightly fold retired because their exhibits went to other titles.
kb/_fold_unclassified.py rewrites its day's report on every run, so the fold appends each retire to the ledger
kb/unclassified_fold/retires.json (append_retires), which no run overwrites. A retired title is a search alias of
each title its exhibits went to, never a resolution: it can name two titles (Automotive Braking Systems went to
MIL3 and MIL4), and the fold's own moves are no rename history (Credit by Exam and Water Supply traded places).
A live title is never an alias.

Readers: kb/_build_adopt_page.py, kb/_build_exhibits_related.py, kb/_fold_unclassified.py,
kb/_sweep_exhibit_titles.py, kb/_cer_procedures.py, kb/_build_partner_crosswalk.py,
kb/_build_college_offering_crosswalk.py, kb/_build_occupation_cpl_crosswalk.py, kb/_family_tag_apply.py
(moves), and map_links.js through kb/credential_title_moves.json.
"""
import glob
import json
import os
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
TABLE = os.path.join("kb", "credential_title_moves.json")
RETIRES = os.path.join("kb", "unclassified_fold", "retires.json")


class SnapshotError(ValueError):
    """A snapshot whose order or content this module would have to guess."""


def _read(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def _fold_issuer():
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    import fold_issuer
    return fold_issuer


def _still_folded(folder, undone):
    """None when no undo touched this snapshot; else the titles an undo left folded (its skipped groups)."""
    own = _read(os.path.join(folder, "undone.json"))
    if isinstance(own, dict):
        return set(own.get("skipped_groups") or [])
    fid = (_read(os.path.join(folder, "undo.json")) or {}).get("fold_id")
    if fid and fid in undone:
        return set(undone[fid])
    return None


def instant(value, where=""):
    """An `_applied_at` as a UTC instant. Raises SnapshotError on anything but an ISO time with a zone."""
    t = str(value or "").strip()
    try:
        dt = datetime.fromisoformat(t[:-1] + "+00:00" if t.endswith("Z") else t)
    except ValueError:
        dt = None
    if dt is None or dt.tzinfo is None:
        raise SnapshotError("%s: _applied_at %r is not an ISO time with a zone" % (where, value))
    return dt.astimezone(timezone.utc)


def snapshots(root="."):
    """The applied rename snapshots in force, in apply order: [{"name", "applied_at", "moves": {old: new}}]."""
    fi = _fold_issuer()
    out_root = os.path.join(root, "kb", "cred_rename_out")
    undone = fi.undone_fold_ids(out_root)
    snaps = []
    for path in glob.glob(os.path.join(out_root, "*", "alias_map.json")):
        doc = _read(path)
        if not isinstance(doc, dict) or not doc.get("_applied_at"):
            continue   # never applied: it names nothing a reader ever saw
        folder = os.path.dirname(path)
        name = os.path.basename(folder)
        if os.path.exists(os.path.join(folder, fi.APPLY_FAILED)):
            continue   # its apply did not land on main
        at = instant(doc["_applied_at"], name)
        both = set(doc.get("renames") or {}) & set(doc.get("merges") or {})
        if both:
            raise SnapshotError("%s: %s is in both renames and merges" % (name, sorted(both)[0]))
        step = {}
        for part in ("renames", "merges"):
            for o, n in (doc.get(part) or {}).items():
                if isinstance(o, str) and isinstance(n, str) and o and n and o != n:
                    step[o] = n
        kept = _still_folded(folder, undone)
        if kept is not None:
            step = {o: n for o, n in step.items() if o in kept or n in kept}
        if step:
            snaps.append({"name": name, "applied_at": str(doc["_applied_at"]), "at": at, "moves": step})
    snaps.sort(key=lambda s: (s["at"], s["name"]))
    for a, b in zip(snaps, snaps[1:]):
        if a["at"] == b["at"]:
            common = (set(a["moves"]) | set(a["moves"].values())) & (set(b["moves"]) | set(b["moves"].values()))
            if common:
                raise SnapshotError("%s and %s were applied at one instant and both name %r: their order is unknown"
                                    % (a["name"], b["name"], sorted(common)[0]))
    return snaps


def live_titles(root="."):
    """The live title set: the keys of kb/credentials.json."""
    return frozenset(_read(os.path.join(root, "kb", "credentials.json")) or {})


def resolve(title, snaps, live=frozenset()):
    """(the title a stored value names now, [the snapshots that moved it, in order]). A live title is itself; any
    other title takes one lookup per snapshot, in apply order, and stops at the first live title it reaches."""
    if not title or title in live:
        return title, []
    cur, by = title, []
    for s in snaps:
        nxt = s["moves"].get(cur)
        if nxt and nxt != cur:
            cur = nxt
            by.append(s["name"])
            if cur in live:
                break
    return cur, by


def resolver(root="."):
    """A function title -> the title it names now, reading the snapshots and the live set once."""
    snaps, live = snapshots(root), live_titles(root)

    def now(title):
        return resolve(title, snaps, live)[0]
    return now


def current_title(title, root="."):
    return resolver(root)(title)


def by_current_title(mapping, root=".", now=None):
    """A file keyed by title, read through the renames: {title it names now: value}. A key that is its own title
    keeps its own value first; a list value under a renamed key joins the list under the title it moved to."""
    now = now or resolver(root)
    out = {k: (list(v) if isinstance(v, list) else v) for k, v in (mapping or {}).items()}
    for k, v in (mapping or {}).items():
        t = now(k)
        if t == k:
            continue
        if t not in out:
            out[t] = list(v) if isinstance(v, list) else v
        elif isinstance(out[t], list) and isinstance(v, list):
            out[t].extend(x for x in v if x not in out[t])
    return out


def _sources(snaps):
    seen = []
    for s in snaps:
        for o in s["moves"]:
            if o not in seen:
                seen.append(o)
    return seen


def returned(root="."):
    """Titles live today that an in-force snapshot moved away: a person brought each back, so each reads as itself
    and is no search alias of where it once went. For a person to look at."""
    snaps, live = snapshots(root), live_titles(root)
    return sorted(o for o in _sources(snaps) if o in live)


def moves(root="."):
    """old title -> {"now": the title it names now, "by": [the snapshots that moved it]}, for every title an in-force
    snapshot moved that is not live. The full chain from the first snapshot is the chain from any snapshot naming it
    (no earlier snapshot holds it as a source), so each title has one answer, the reader's (kb/_family_tag_apply.py:
    a family tag the rename carried to the new title)."""
    snaps, live = snapshots(root), live_titles(root)
    out = {}
    for o in _sources(snaps):
        now, by = resolve(o, snaps, live)
        if now != o:
            out[o] = {"now": now, "by": by}
    return out


def table(root="."):
    """The browser's lookup (kb/credential_title_moves.json): old title -> [each title the chain reaches, one per
    snapshot that moved it, in apply order], walked with no live set so the hops depend on the snapshots alone. A
    reader returns a live title unchanged, else the first live hop, else the last hop: resolve()'s answer."""
    snaps = snapshots(root)
    tab = {}
    for o in sorted(_sources(snaps)):
        cur, hops = o, []
        for s in snaps:
            nxt = s["moves"].get(cur)
            if nxt and nxt != cur:
                cur = nxt
                hops.append(nxt)
        if hops:
            tab[o] = hops
    return {"_about": "Where each renamed or merged credential title goes, from the applied rename snapshots in force "
                      "(kb/cred_rename_out). Built by kb/credential_aliases.py; never edit by hand. A live title is "
                      "itself; any other takes its first live hop, else its last.",
            "_built_by": "kb/credential_aliases.py",
            "through": [s["name"] for s in snaps],
            "moves": tab,
            "report": {"returned": returned(root),
                       "_about": "Titles live today that an in-force snapshot moved away: each reads as itself. "
                                 "Rebuilt each run; --check does not compare it."}}


def append_retires(root, day, at, retires):
    """The fold's one write to the retire ledger: each retire of an applied fold, appended once, never rewritten."""
    path = os.path.join(root, RETIRES)
    doc = _read(path) or {}
    rows = doc.get("retires") or []
    have = {(r.get("day"), r.get("title"), tuple(r.get("to") or [])) for r in rows}
    added = 0
    for r in retires or []:
        t = (r.get("title") or "").strip()
        to = r.get("to") or []
        to = [to] if isinstance(to, str) else list(to)
        if t and (day, t, tuple(to)) not in have:
            rows.append({"day": day, "at": at, "title": t, "to": to})
            have.add((day, t, tuple(to)))
            added += 1
    if added or not os.path.exists(path):
        doc = {"_about": doc.get("_about") or (
                   "Every title an applied nightly fold retired, and the titles its exhibits went to. Append-only: "
                   "kb/_fold_unclassified.py appends each apply's credential_retires (its day's report.json is "
                   "rewritten by each run). Read by kb/credential_aliases.py retired()."),
               "retires": rows}
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, ensure_ascii=False)
            f.write("\n")
    return added


def retired(root="."):
    """current title -> [titles the nightly fold retired into it, oldest first], from the append-only ledger: each
    target followed through the renames; a retired title that is live today is no alias."""
    snaps, live = snapshots(root), live_titles(root)
    out = {}
    for r in sorted((_read(os.path.join(root, RETIRES)) or {}).get("retires") or [],
                    key=lambda r: (r.get("day") or "", r.get("at") or "")):
        t = (r.get("title") or "").strip()
        if not t or t in live:
            continue
        for tgt in r.get("to") or []:
            now = resolve(tgt, snaps, live)[0] if tgt else ""
            if now and now != t and t not in out.setdefault(now, []):
                out[now].append(t)
    return {k: v for k, v in out.items() if v}


def load(root="."):
    """current title -> [the titles it replaced, then the titles the fold retired into it]. A live title is never
    an alias: a title a person brought back reads as itself."""
    aka = {}
    for o, m in moves(root).items():
        if o not in aka.setdefault(m["now"], []):
            aka[m["now"]].append(o)
    for now, names in retired(root).items():
        have = aka.setdefault(now, [])
        have.extend(n for n in names if n not in have and n != now)
    return {k: v for k, v in aka.items() if v}


def family_members(root="."):
    """title -> {"family", "aliases"} for every title kb/credentials.json puts in a credential family (Sam, 2026-11-11:
    each ASE bundle stays its own title, carries the family, and each component test is a search alias of it). The
    aliases come from kb/test_mix.py: "ASE A4" for each test the title names, and the mix as written where it holds an
    "or" or a non-ASE part. They are search terms only, never earlier titles, so a reader keeps them apart from load()."""
    import sys
    here = os.path.join(os.path.abspath(root), "kb")
    if here not in sys.path:
        sys.path.insert(0, here)
    import test_mix
    try:
        with open(os.path.join(root, "kb", "credentials.json"), encoding="utf-8") as f:
            cr = json.load(f)
    except (OSError, ValueError):
        return {}
    try:
        with open(os.path.join(root, "kb", "reference", "credential_families.json"), encoding="utf-8") as f:
            declared = json.load(f).get("families") or {}
    except (OSError, ValueError):
        declared = {}
    out = {}
    for title, recs in cr.items():
        fam = next((r.get("family") for r in recs or [] if r.get("family")), "")
        if fam:
            # A member any one of whose tests qualifies (Sheet 181) is declared by its family, never a bundle.
            kind = "any_one_test" if title in ((declared.get(fam) or {}).get("any_one_test") or {}) else "bundle"
            out[title] = {"family": fam, "aliases": test_mix.components(title), "member_kind": kind}
    return out


def _render(root):
    return json.dumps(table(root), indent=1, ensure_ascii=False) + "\n"


def _checked(text):
    """What --check compares: everything but the report, which follows the live set."""
    try:
        doc = json.loads(text)
    except (TypeError, ValueError):
        return None
    doc.pop("report", None)
    return doc


def main(argv=None):
    """Write kb/credential_title_moves.json, or with --check exit 1 when its hops are stale."""
    argv = list(sys.argv[1:] if argv is None else argv)
    root = REPO
    path = os.path.join(root, TABLE)
    want = _render(root)
    try:
        with open(path, encoding="utf-8") as f:
            have = f.read()
    except OSError:
        have = None
    if "--check" in argv:
        if _checked(have) != _checked(want):
            print("%s is stale; run: python3 kb/credential_aliases.py" % TABLE)
            return 1
        print("%s is current" % TABLE)
        return 0
    if have != want:
        with open(path, "w", encoding="utf-8") as f:
            f.write(want)
    print("wrote %s: %d titles, %d returned" % (TABLE, len(json.loads(want)["moves"]), len(json.loads(want)["report"]["returned"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
