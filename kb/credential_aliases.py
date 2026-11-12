#!/usr/bin/env python3
"""credential_aliases.py — the titles a credential was known by before a rename or a merge.

Sam, 2026-11-11, on renaming the ASE titles in a batch: "Approved renames keep the old title as a search
alias, so nothing students or colleges already use stops working."

Every applied credential rename leaves its frozen alias map under kb/cred_rename_out/<date>/alias_map.json
(kb/_cred_rename_apply.py: renames and confirmed merges, old title to new). This module reads those
snapshots in date order and follows a title renamed twice to the name it carries now, so nothing is
stored a second time. Readers: kb/_build_adopt_page.py (the public Credential Catalog's search, "aka" on
each credential) and kb/_build_exhibits_related.py (the Exhibits tab's List, finder and related panel).
"""
import glob
import json
import os


def moves(root="."):
    """old title -> {"now": the title it carries now, "by": [the applied snapshots' folder names that moved it, in
    order]}, read from the same applied snapshots as load(). A reader holding a row keyed by a title that a rename
    moved finds where the row lives now (kb/_family_tag_apply.py: a family tag the rename carried to the new title)."""
    out = {}
    for path in sorted(glob.glob(os.path.join(root, "kb", "cred_rename_out", "*", "alias_map.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                doc = json.load(f)
        except (OSError, ValueError):
            continue
        if not doc.get("_applied_at") or os.path.exists(os.path.join(os.path.dirname(path), "apply_failed.json")):
            continue   # never applied, or its apply did not land on main (kb/fold_issuer.py APPLY_FAILED)
        by = os.path.basename(os.path.dirname(path))
        step = dict(doc.get("renames") or {})
        step.update(doc.get("merges") or {})
        step = {o: n for o, n in step.items() if o and n and o != n}
        for m in out.values():   # a title moved again carries every earlier name with it
            if m["now"] in step:
                m["now"] = step[m["now"]]
                m["by"].append(by)
        for o, n in step.items():
            if o not in out:
                out[o] = {"now": n, "by": [by]}
    return out


def load(root="."):
    """current title -> [the titles it replaced, oldest first]."""
    aka = {}
    for path in sorted(glob.glob(os.path.join(root, "kb", "cred_rename_out", "*", "alias_map.json"))):
        try:
            with open(path, encoding="utf-8") as f:
                doc = json.load(f)
        except (OSError, ValueError):
            continue
        if not doc.get("_applied_at"):
            continue   # a snapshot that was never applied names nothing a reader ever saw
        moves = dict(doc.get("renames") or {})
        moves.update(doc.get("merges") or {})
        for old, new in moves.items():
            if not old or not new or old == new:
                continue
            names = aka.setdefault(new, [])
            for n in aka.pop(old, []) + [old]:
                if n != new and n not in names:
                    names.append(n)
    return aka


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
