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
  * IN FORCE ONLY. A snapshot resolves only while its apply stands: `_applied_at` set, no apply_failed.json
    beside it (the workflow's failure step), and no undo (an undone.json beside it, or its undo.json fold_id
    named by any undone.json, kb/fold_issuer.py undone_fold_ids). An undo run with --force leaves its skipped
    groups folded, so a move whose old or new title is in skipped_groups stays in force. #3140's fifth round
    was exactly this: a snapshot finder with no in-force filter replayed an undone apply.
  * APPLY ORDER, by `_applied_at` (then the folder name). The folder name alone is wrong: "2026-11-12/" sorts
    after "2026-11-12-2/" and "2026-11-12-3/", which were applied after it.
  * ONE LOOKUP PER MAP. A map is one apply, a simultaneous permutation: a swap (A->B and B->A in one apply)
    moves A once, to B. A title renamed by a later apply moves again (A->B, then B->C reads C).
  * THE ERA GUARD. A value saved after an apply never moves through it (`since`): the title it names is the
    title that existed when it was saved.
  * A title no snapshot names comes back as itself.

`tests/credential_title_resolver_single_source_test.py` fails a second reader of the rename snapshots, and a
JS file that reads them: the browser reads kb/credential_title_moves.json, which `python3 kb/credential_aliases.py`
writes from this module (`--check` in scripts/check_generated.sh).

Search aliases (load()) add one more source: a title the nightly fold retired because its exhibits went to
other titles (kb/unclassified_fold/<day>/report.json `credential_retires`, mode "apply"). A retired title is a
search alias of each title its exhibits went to, never a resolution: it can name two titles (Automotive Braking
Systems went to MIL3 and MIL4), and the fold's own moves are not a rename history (Credit by Exam and Water
Supply traded places twice in a week).

Readers: kb/_build_adopt_page.py, kb/_build_exhibits_related.py, kb/_fold_unclassified.py,
kb/_sweep_exhibit_titles.py, kb/_cer_procedures.py, kb/_build_partner_crosswalk.py,
kb/_build_college_offering_crosswalk.py, kb/_build_occupation_cpl_crosswalk.py, kb/_family_tag_apply.py
(moves), and map_links.js through kb/credential_title_moves.json.
"""
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
TABLE = os.path.join("kb", "credential_title_moves.json")


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
        if os.path.exists(os.path.join(folder, fi.APPLY_FAILED)):
            continue   # its apply did not land on main
        step = {}
        for part in ("renames", "merges"):
            for o, n in (doc.get(part) or {}).items():
                if isinstance(o, str) and isinstance(n, str) and o and n and o != n:
                    step[o] = n
        kept = _still_folded(folder, undone)
        if kept is not None:
            step = {o: n for o, n in step.items() if o in kept or n in kept}
        if step:
            snaps.append({"name": os.path.basename(folder), "applied_at": str(doc["_applied_at"]), "moves": step})
    snaps.sort(key=lambda s: (s["applied_at"], s["name"]))
    return snaps


def _before(since, applied_at):
    """True when a value saved at `since` predates the apply (so the apply moves it). ISO times or dates."""
    return not since or str(since)[:19] < applied_at[:19]


def resolve(title, snaps, since=None):
    """(the title a stored value names now, [the snapshots that moved it, in order]): one lookup per snapshot,
    in apply order, skipping every snapshot applied before `since`."""
    cur, by = title, []
    for s in snaps:
        if not _before(since, s["applied_at"]):
            continue
        nxt = s["moves"].get(cur)
        if nxt and nxt != cur:
            cur = nxt
            by.append(s["name"])
    return cur, by


def resolver(root="."):
    """A function title[, since] -> the title it names now, reading the snapshots once."""
    snaps = snapshots(root)

    def now(title, since=None):
        return resolve(title, snaps, since)[0] if title else title
    return now


def current_title(title, root=".", since=None):
    return resolve(title, snapshots(root), since)[0]


def by_current_title(mapping, root=".", since=None, now=None):
    """A file keyed by title, read through the renames: {title it names now: value}. A key that is its own title
    keeps its own value first; a list value under a renamed key joins the list under the title it moved to."""
    now = now or resolver(root)
    out = {k: (list(v) if isinstance(v, list) else v) for k, v in (mapping or {}).items()}
    for k, v in (mapping or {}).items():
        t = now(k, since)
        if t == k:
            continue
        if t not in out:
            out[t] = list(v) if isinstance(v, list) else v
        elif isinstance(out[t], list) and isinstance(v, list):
            out[t].extend(x for x in v if x not in out[t])
    return out


def moves(root="."):
    """old title -> {"now": the title it carries now, "by": [the snapshots that moved it, in order]}, for every
    title an in-force snapshot renamed or merged. A reader holding a row keyed by a title that a rename moved finds
    where the row lives now (kb/_family_tag_apply.py: a family tag the rename carried to the new title)."""
    snaps = snapshots(root)
    out = {}
    for i, s in enumerate(snaps):
        for o in s["moves"]:
            if o not in out:
                now, by = resolve(o, snaps[i:])
                out[o] = {"now": now, "by": by}
    return out


def table(root="."):
    """The browser's lookup (kb/credential_title_moves.json): old title -> [[applied_at, the title it names now],
    ...], one pair per snapshot that names it, in apply order. A reader holding a value saved at T takes the first
    pair applied after T, and the title itself when none is: the same answer as resolve(title, since=T), with the
    chain already followed here, so the browser holds no resolver of its own."""
    snaps = snapshots(root)
    tab = {}
    for i, s in enumerate(snaps):
        for o in sorted(s["moves"]):
            now = resolve(o, snaps[i:])[0]
            if now != o:
                tab.setdefault(o, []).append([s["applied_at"], now])
    return {"_about": "Where each renamed or merged credential title lives now, from the applied rename snapshots in "
                      "force (kb/cred_rename_out). Built by kb/credential_aliases.py; never edit by hand. A value "
                      "saved at T takes the first pair applied after T.",
            "_built_by": "kb/credential_aliases.py",
            "through": [s["name"] for s in snaps],
            "moves": dict(sorted(tab.items()))}


def retired(root="."):
    """current title -> [titles the nightly fold retired into it, oldest first]: each title a fold apply retired
    (credential_retires) is a search alias of every title its exhibits went to, each target followed through the
    renames applied after the fold. A retired title that is a credential again today is no alias."""
    snaps = snapshots(root)
    live = set(_read(os.path.join(root, "kb", "credentials.json")) or {})
    out = {}
    for path in sorted(glob.glob(os.path.join(root, "kb", "unclassified_fold", "*", "report.json"))):
        doc = _read(path)
        if not isinstance(doc, dict) or doc.get("mode") != "apply":
            continue
        at = doc.get("_generated_at") or os.path.basename(os.path.dirname(path))
        for r in doc.get("credential_retires") or []:
            t = (r.get("title") or "").strip()
            to = r.get("to") or []
            if not t or t in live:
                continue
            for tgt in ([to] if isinstance(to, str) else to):
                now = resolve(tgt, snaps, since=at)[0] if tgt else ""
                if now and now != t and t not in out.setdefault(now, []):
                    out[now].append(t)
    return out


def load(root="."):
    """current title -> [the titles it replaced, oldest first, then the titles the fold retired into it]."""
    snaps = snapshots(root)
    aka = {}
    for i, s in enumerate(snaps):
        for o in s["moves"]:
            now = resolve(o, snaps[i:])[0]
            if now != o and o not in aka.setdefault(now, []):
                aka[now].append(o)
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
    return json.dumps(table(root), indent=1, ensure_ascii=False, sort_keys=False) + "\n"


def main(argv=None):
    """Write kb/credential_title_moves.json, or with --check exit 1 when it is stale."""
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
        if have != want:
            print("%s is stale; run: python3 kb/credential_aliases.py" % TABLE)
            return 1
        print("%s is current" % TABLE)
        return 0
    if have != want:
        with open(path, "w", encoding="utf-8") as f:
            f.write(want)
    print("wrote %s: %d titles" % (TABLE, len(json.loads(want)["moves"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
