#!/usr/bin/env python3
"""_build_exhibits_related.py — the titles beside a Review card, and the rename batch.

Sam, 2026-11-11, on the noncredit Automotive cards that kept returning to Another look ("Noncredit for
AUTO P1"): he went back and forth because the card did not show which canonical titles already exist
for the same certification. Two things come from this file, kb/exhibits_related.json:

  titles   every canonical title, its issuer, how many local titles are folded under it, how many
           colleges articulate it, whether it is in the reference or only proposed, and the titles it
           was known by before a rename. The Exhibits tab's Review card draws its Related titles panel
           from it (exhibits.js matches the card's certification family, code and words), and the
           List's search finds a credential by a title it used to carry.

  batches  one rename batch a certification family (kb/cert_naming.py, ASE first): every title in the
           reference that does not read "<Official cert name> (ASE <code>)": a program or course name
           in front, the code in front, a missing code, or two titles for one certification. Each row
           carries the current title, the proposed title, the local titles and colleges folded under
           it, the colleges that articulate it and the exhibits behind it (the tab counts students on
           those, reviewers only). NOTHING HERE RENAMES A TITLE. Sam approves the batch in Review, or
           edits or skips rows in it; an approved row is a unified_title_override the credential
           rename dry-run and apply carry (kb/_cred_rename_dryrun.py, cred-rename-apply.yml), and the
           old title stays a search alias (kb/credential_aliases.py).

A row leaves the batch once it is decided: an override is saved for it, or cert_rename_kept names the
proposal declined (both synced into kb/credential_review_overlay.json). A title with its own open card
in Another look is left to that card. Until a row is decided, the panel marks its title "rename pending".

The other families (CompTIA, AWS, NCCER) are listed as waiting: each runs as its own batch once ASE's is
decided (Sam's step 4e), by turning its family on in kb/cert_naming.py with its table of official names.

Runs nightly at the end of cer-procedures.yml and daily in daily-dashboard.yml, after the sweep.

Usage, from the repo root:
  python3 kb/_build_exhibits_related.py [--root DIR] [--out PATH] [--quiet]
"""
import argparse
import collections
import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402
import credential_aliases  # noqa: E402
import test_mix  # noqa: E402
import exhibit_paths  # noqa: E402
import ruled_renames  # noqa: E402

SCHEMA = 1
OUT = "kb/exhibits_related.json"
IN_REFERENCE, PROPOSED = 0, 1
KINDS = {
    "program-first": "A program or course name leads",
    "code-first": "The code leads",
    "wrong-name": "Not the official name",
    "missing-code": "No test code",
    "several": "More than one test",
    "family": "A family bundle, named family plus its tests",
}


def iso_now():
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_json(root, rel, default=None):
    try:
        with open(os.path.join(root, rel), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def build(root="."):
    ut = load_json(root, "kb/unified_titles.json", {}) or {}
    cr = load_json(root, "kb/credentials.json", {}) or {}
    saved = (load_json(root, "kb/unclassified_assignments.json", {}) or {}).get("assignments") or {}
    review = load_json(root, "kb/exhibits_review.json", {}) or {}
    adoption = (load_json(root, "kb/exhibits_adoption.json", {}) or {}).get("credentials") or {}
    sweep = load_json(root, "kb/exhibits_sweep.json", {}) or {}
    overlay = (load_json(root, "kb/credential_review_overlay.json", {}) or {}).get("overrides") or {}
    aka = credential_aliases.load(root)
    members = credential_aliases.family_members(root)

    locals_of, ids_of = collections.defaultdict(list), collections.defaultdict(list)
    for raw, e in ut.items():
        t = ((e or {}).get("unified_title") or "").strip()
        if not t or not raw.strip():
            continue
        locals_of[t].append(raw.strip())
        for i in (e or {}).get("source_exhibit_ids") or []:
            if i and i not in ids_of[t]:
                ids_of[t].append(i)

    def issuer_of(t):
        return (((cr.get(t) or [{}])[0] or {}).get("issuing_agency") or "").strip()

    def adopted(t):
        return len((adoption.get(t) or {}).get("a") or {})

    def paths(t):
        # Each local exhibit's CPL path, read from its MAP id (kb/exhibit_paths.py; Sam's rulings on
        # #3110): the adoption file lists a credential's exhibits, the reference's stamps the rest.
        ids = [x[0] for x in (adoption.get(t) or {}).get("x") or [] if x] + (ids_of.get(t) or [])
        return exhibit_paths.tally(ids)

    # Every title a card could fold into: the reference, then what is only proposed (saved and waiting
    # for the nightly fold, or proposed on a card in Review).
    status, proposed_issuer = {}, {}
    for t in set(cr) | set(locals_of):
        status[t] = IN_REFERENCE
    # A saved or held title is read through the applied renames (kb/credential_aliases.py resolver): a title a rename
    # retired reads as the credential it became, never as a new proposal; a live title reads as itself.
    now = credential_aliases.resolver(root)
    for raw, a in saved.items():
        t = now(((a or {}).get("unified_title") or "").strip())
        if t and t not in status:
            status[t] = PROPOSED
            proposed_issuer[t] = ((a or {}).get("issuing_agency") or "").strip()
            locals_of[t].append(raw.strip())
    for h in review.get("held") or []:
        t = now((h.get("title") or "").strip())
        if t and t not in status:
            status[t] = PROPOSED
            proposed_issuer[t] = (h.get("issuer") or "").strip()

    # The rename batches.
    on_card = {c.get("current") for c in sweep.get("cards") or []}
    batches, pending, waiting = [], {}, []
    declared_issuer = {n: (f or {}).get("issuer", "") for n, f in ((load_json(root, "kb/reference/credential_families.json", {})
                                                                     or {}).get("families") or {}).items()}
    # A title a ruled plan renames (kb/ruled_renames.py; Sheet 181) is decided: the rename dry run carries it, and the
    # batch does not ask again.
    ruled = ruled_renames.pending(ruled_renames.load(os.path.join(root, "kb", "cred_rename_plans")), cr,
                                  set(locals_of))
    for fam in cert_naming.FAMILIES:
        if not fam["active"]:
            waiting.append(fam["short"])
            continue
        rows, fits, left = [], 0, 0
        for t in sorted(status, key=str.lower):
            if status[t] != IN_REFERENCE:
                continue
            ov = overlay.get(t) or {}
            if t in ruled:
                continue   # ruled on a decision sheet: the credential rename dry run carries it from here
            approved = (ov.get("unified_title_override") or "").strip() and ov.get("unified_title_override") != t
            if t in members and declared_issuer.get(members[t]["family"]) == fam["issuer"]:
                # A family member is proposed in the family's naming form (Sam's "family as a field", as COBIx relayed
                # it on #3110, 18:40Z): "ASE Certificate Bundles: A4 + A5". Two titles with one mix share the
                # proposal, so one leads and the other folds into it. Nothing moves until a person approves the batch.
                fam_name = members[t]["family"]
                to = test_mix.family_title(fam_name, t)
                # A member's saved fold into its family title is the family tag, never an approved rename (Sam,
                # 2026-11-11): his fold rows stay beside the tag, so they must not hide the family-form proposal.
                renamed = approved and ov.get("unified_title_override") != fam_name
                if renamed or not to or to == t or (ov.get("cert_rename_kept") or "") == to:
                    continue   # approved, no mix, already named so, or this proposal was declined
                mix = test_mix.parts(t) or {"tests": [], "with": []}
                exc = test_mix.exception(t)
                rows.append({
                    "current": t, "proposed": to, "kind": "family", "kind_label": KINDS["family"],
                    "why": "a member of %s; its tests lead the name" % fam_name
                           + ("; its mix holds a part to code by hand, shown in the family's exception list" if exc else ""),
                    "codes": [c for c in (test_mix.from_title(t) or {}).get("codes") or []],
                    "issuer": issuer_of(t), "locals": len(locals_of.get(t) or []), "adopted": adopted(t),
                    "ids": ids_of.get(t) or [], "paths": paths(t), "family": fam_name, "with": mix["with"],
                })
                continue
            if t in members:
                continue   # a member of another issuer's family: that batch proposes it
            got = cert_naming.ase_read(t, issuer_of(t))
            if not got:
                continue
            if got["kind"] == "fits":
                fits += 1
                continue
            if got["kind"] == "standards":
                continue   # a course taught to the standard (cert_naming.is_standards; Sam's ruling A): it stands
            if approved:
                continue   # approved: the credential rename dry-run carries it from here
            kept = (ov.get("cert_rename_kept") or "").strip()
            if kept and kept in (got["proposed"], t):
                continue   # skipped: this proposal was declined, or (a row with no proposal) the title kept as it is
            if t in on_card:
                left += 1   # its own card in Another look decides it
                continue
            rows.append({
                "current": t, "proposed": got["proposed"], "kind": got["kind"],
                "kind_label": KINDS.get(got["kind"], got["kind"]), "why": got["why"], "codes": got["codes"],
                "issuer": issuer_of(t), "locals": len(locals_of.get(t) or []), "adopted": adopted(t),
                "ids": ids_of.get(t) or [], "paths": paths(t),
            })
        # Two titles for one certification share a proposed title. One of them takes the name; the rest
        # fold into it, which the rename apply does only on a confirmed merge. The one that leads is the
        # certification ASE itself issues, then the one with the most local titles.
        groups = collections.defaultdict(list)
        for r in rows:
            if r["proposed"]:
                groups[r["proposed"]].append(r)
        for target, rs in groups.items():
            exists = target in cr or status.get(target) == IN_REFERENCE
            rs.sort(key=lambda r: (r["issuer"] != fam["issuer"], -r["locals"], r["current"].lower()))
            for k, r in enumerate(rs):
                r["target_exists"] = exists
                r["twins"] = [x["current"] for x in rs if x is not r]
                r["merge"] = exists or k > 0   # folds into a title that exists, or will once the lead lands
                if r["twins"] or exists:
                    r["why"] += "; " + ("joins “%s”, already in the reference" % target if exists
                                         else "one of %d titles for this certification" % len(rs))
        rows.sort(key=lambda r: (not r["proposed"], (r["codes"] or ["~"])[0], r.get("merge", False), r["current"].lower()))
        for r in rows:
            pending[r["current"]] = r["proposed"]
        batches.append({
            "id": fam["id"], "label": fam["short"], "issuer": fam["issuer"],
            "format": "<Official cert name> (%s <code>)" % fam["short"],
            "fits": fits, "left_to_cards": left,
            "with_proposal": sum(1 for r in rows if r["proposed"]),
            "rows": rows,
        })

    issuers = sorted({issuer_of(t) or proposed_issuer.get(t, "") for t in status} - {""}, key=str.lower)
    at = {name: i for i, name in enumerate(issuers)}
    titles = []
    for t in sorted(status, key=str.lower):
        iss = issuer_of(t) or proposed_issuer.get(t, "")
        row = [t, at.get(iss, -1), len(locals_of.get(t) or []), adopted(t), status[t], aka.get(t) or [], paths(t)]
        while row and row[-1] == []:
            row.pop()
        titles.append(row)
    return {
        "schema": SCHEMA,
        "generated_at": iso_now(),
        "generated_by": "kb/_build_exhibits_related.py",
        "_about": "The Exhibits tab's Related titles panel and rename batches. titles: [title, issuer index, "
                  "local titles, colleges that articulate it, 0 in the reference or 1 proposed, earlier titles, "
                  "local exhibits by CPL path as [path, count] (kb/exhibit_paths.py)]. "
                  "pending: a title in a rename batch that Sam has not decided, and the title proposed for it.",
        "rule": cert_naming.RULE,
        "paths": {k: {"words": w, "assessed_by": who} for k, (w, who) in exhibit_paths.PATHS.items()},
        "issuers": issuers,
        "titles": titles,
        # The declared credential families (kb/reference/credential_families.json) and their member titles, each with
        # its component tests as search aliases (kb/credential_aliases.py family_members; Sam, 2026-11-11).
        "families": families_payload(root, members),
        "pending": pending,
        "batches": batches,
        "waiting": waiting,
    }


def families_payload(root, members):
    declared = (load_json(root, "kb/reference/credential_families.json", {}) or {}).get("families") or {}
    out = {}
    for name, f in sorted(declared.items()):
        mem = {t: m["aliases"] for t, m in sorted(members.items(), key=lambda kv: kv[0].lower()) if m["family"] == name}
        # Members any one of whose tests qualifies (Sheet 181): they keep their titles and are never coded as a bundle.
        aot = sorted((t for t in mem if t in (f.get("any_one_test") or {})), key=str.lower)
        # The members whose mix the parser cannot code fully (an "or", or a part no ASE code names), one list for a
        # person to code in Review (#3110, 18:40Z). They carry the family all the same.
        exc = [e for e in (test_mix.exception(t) for t in mem if t not in aot) if e]
        out[name] = {"issuer": f.get("issuer", ""), "about": f.get("about", ""), "members": mem, "exceptions": exc,
                     "any_one_test": aot}
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--root", default=".")
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args(argv)
    data = build(a.root)
    path = a.out if os.path.isabs(a.out) else os.path.join(a.root, a.out)
    old = load_json(a.root, a.out, {}) if not os.path.isabs(a.out) else {}
    if old and all(old.get(k) == data[k] for k in ("titles", "pending", "batches", "issuers", "waiting", "rule", "families")):
        data["generated_at"] = old.get("generated_at", data["generated_at"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    if not a.quiet:
        print("wrote %s: %d titles, %s" % (a.out, len(data["titles"]), "; ".join(
            "%s batch %d rows (%d with a proposed title, %d already fit)" % (b["label"], len(b["rows"]), b["with_proposal"], b["fits"])
            for b in data["batches"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
