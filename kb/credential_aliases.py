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
