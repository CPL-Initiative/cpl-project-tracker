#!/usr/bin/env python3
"""exhibit_blocker_rules.py — the blocker round's rules 1 and 2, as pair rows for the reviewed re-point apply.

COBIx's blocker round on issue #3480 (Source 19, 2026-11-17) left 397 pairs (MAP exhibit id + local title) for Sam.
Its two top causes each got a rule, and the two rules take what still goes to Sam down to 212 pairs:

  Rule 1, cert_twin (cause CERT-NO-NAME, 121 pairs; Source 21). A cert-based exhibit (Industry Certification,
      Standardized Assessment, Military or Other) sits under a college course title, and no issuer plus cert is named
      anywhere, so no official cert title exists to move it to, and Sam's graded and cert-based guard says it may not
      stay with the graded exhibits. The pair re-points to one shared cert-based twin of the course title:
      "<course title> (<official CPL type>)", for example "Advanced Agricultural Welding (Industry Certification)".
      One twin per course title and type, shared across colleges. The pair stays with Sam when it is Sam-curated; when
      its title names AP, CLEP, IB or DSST (a type conflict); when its local title names a license or a specific
      credential, Firefighter 1 or 2 included; when the issuer is an outside licensing body (anyone but the college or
      California State Fire Training); or when the twin already holds graded exhibits.
  Rule 2, left_keep (cause LEFT-REFERENCED, 95 pairs; Source 23). A leftover local title (gone from current MAP) that
      a course-credit listing still carries stays under its current canonical when every listing that carries it
      already uses that canonical, its mapping confidence is 0.80 or higher, and the guard passes. The guard is the
      Exhibits List's (exhibits.js crossesGroups, #3466/#3477, ported here as crosses_groups and run against the JS by
      the test) on kb/exhibit_left_map.json's title and canonical groups. A keep adds nothing to a canonical, so a
      crossing holds the pair only when this title is what puts the second group there (no other exhibit on the
      canonical shares its group); a keep onto a canonical other titles already mix is written with already_mixed set.
      COBIx's two checks run beside it: the pair's group is not the opposite of every live exhibit on the canonical,
      and a pair with no type sits only on a canonical that holds one group.

Every rule first checks the pair is a pair here: the exhibit id must be on the local title in the committed records
(the key that carries it, when two keys differ only by a trailing space), a scope row that repeats a pair is skipped,
and a title the reviewed apply would read as another key of the same wording waits on that fix in #3472.

What neither rule does: edit a local title (a kb/unified_titles.json key), rename a canonical (a kb/credentials.json
key), or touch a Sam-curated pair (those are tap_only rows, never applied). Rule 1 creates new canonical names, so a
person merges the change that carries its rows.

Rows are kb/exhibit_repoint.py's pair rows (#3472): Rule 1 writes repoint rows, Rule 2 writes confirm rows (the link
stays, the record notes the bot confirmed it), the rest are person, tap_only or skip rows with the reason. The scope
is kb/exhibit_blocker_scope.json, COBIx's 216 pairs, since the blocker round that chose them is not rebuildable here
(Source 28); every pair is re-decided against the committed records.

    python3 kb/exhibit_blocker_rules.py            # write kb/exhibit_blocker_rules_list.json (a dry run, nothing applied)
    python3 kb/exhibit_blocker_rules.py --check    # exit 1 when the committed list differs from a rebuild

The list records a hash of each input file (`inputs`). The daily run rewrites some of them, so the test pins the
counts and the byte-for-byte rebuild only while the hashes match, and otherwise prints a notice to rebuild before the
apply; the guard, the never-edit checks and the rule fixtures run either way.

The list goes through the reviewed apply later, as a Rule 10 plan:
    python3 kb/_cred_rename_apply.py --pairs kb/exhibit_blocker_rules_list.json --dry-run
Its `rollback` section is that apply's undo, computed now on copies: every value the apply would change, before and
after, which `--undo-pairs` reverses.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import exhibit_repoint as xr  # noqa: E402
import slash_titles  # noqa: E402

SCOPE = os.path.join(HERE, "exhibit_blocker_scope.json")
OUT = os.path.join(HERE, "exhibit_blocker_rules_list.json")
P = lambda *a: os.path.join(HERE, *a)  # noqa: E731

# Rule 1's skips, COBIx's patterns (Source 21) with Firefighter 1 or 2 added after the Modesto test (FTECH 317).
ASSESS = re.compile(r"\b(AP|CLEP|IB|DSST)\b|advanced placement", re.I)
NAMED = re.compile(r"licen[sc]e|licensed|salesperson|\bLVN\b|certified|\bASE\b|comptia|\bOSHA\b|\bNCCER\b|\bAWS\b|"
                   r"servsafe|\bCPR\b|first aid|fire ?fighter (1|I|2|II)[A-D]?\b|"
                   # a State Fire Training certification level (1A, 2C) named as a certification, so a course number
                   # such as ENGL 1A with no certification word stays out of it (second reader, PR #3515)
                   r"\b[12][A-D]\b.*certification", re.I)
OK_ISSUER = re.compile(r"california community colleges|state fire training|\(SFT\)", re.I)
COLLEGE_ISSUER = "California Community Colleges"
CONFIDENCE = 0.8
LEFT_PREFIX = "_LEFT_MAP::"  # exhibits.js LEFT_PREFIX, the leftover-title decision row's key
KEEP_COHORT = "exhibits-rules-s683@bot"


def issuer_of(creds, canon):
    """The first issuing agency on the canonical's credential records, or ""."""
    for rec in creds.get(canon) or []:
        if (rec or {}).get("issuing_agency"):
            return rec["issuing_agency"]
    return ""


def pair_group(idx, eid):
    """graded, cert or "" for one exhibit: its official types when they sit in one group, else its id path."""
    off = {xr.group_of(t) for t in idx.official.get(eid, ())} - {""}
    if len(off) == 1:
        return off.pop()
    return xr.PATH_GROUP.get(xr.exhibit_paths.path_of(eid) if eid else None, "")


def cert_type(idx, eid):
    """The twin's type label: the exhibit's one official cert-based type, else its id path's, else Industry
    Certification (COBIx's cert_type). "" when the exhibit reads graded."""
    ts = [t for t in xr.CERT_TYPES if t in idx.official.get(eid, ())]
    if len(ts) == 1:
        return ts[0]
    path = xr.exhibit_paths.path_of(eid)
    if path:
        t = xr.PATH_TYPE[path]
        return t if t in xr.CERT_TYPES else ""
    return "Industry Certification"


def canon_groups(idx, skip_titles=()):
    """canonical -> Counter of the groups of the exhibits that sit under it (pair grain), leaving out skip_titles."""
    out = defaultdict(Counter)
    for key in idx.ut:
        if key in skip_titles:
            continue
        for e in idx.ids_of.get(key, ()):
            out[idx.pair_canonical(key, e)][pair_group(idx, e) or "unknown"] += 1
    return out


def _same_wording(idx, t):
    """Every unified_titles key whose stripped wording is t's, built once per index."""
    by = getattr(idx, "_by_stripped", None)
    if by is None:
        by = defaultdict(list)
        for k in idx.ut:
            by[k.strip()].append(k)
        idx._by_stripped = by
    return by.get(t.strip(), [])


def _resolve(idx, s):
    """The unified_titles key for a scope pair. Two keys can differ only by a trailing space or tab and carry
    different records, so the key is the one that carries the pair's exhibit id: the exact title when it does, else a
    key of the same wording that does (COBIx's snapshot strips the trailing space: "AUTO 600 Completion" is the pair
    on "AUTO 600 Completion "). With no key carrying the id, the exact title, else the stripped match; the rules then
    hold the pair as not a pair here."""
    t, e = s["local_title"], s["exhibit_id"]
    cands = [k for k in [t] + sorted(_same_wording(idx, t)) if k in idx.ut]
    key = next((k for k in cands if e and e in idx.ids_of.get(k, set())), None)
    if key is None:
        key = t if t in idx.ut else (idx.key_of.get(t) or idx.key_of.get(t.strip()))
    return key, (idx.pair_canonical(key, e) if key else None)


def not_on_title(idx, key, e):
    """True when the scope pair's exhibit id is not on the local title in the committed records: COBIx's snapshot saw
    a pair this repo does not hold, so a row for it could never apply (second reader, PR #3515)."""
    return bool(e) and e not in idx.ids_of.get(key, set())


NOT_ON_TITLE = "the exhibit id is not on this local title in the committed record: not a pair here"
DUPLICATE = "the same pair as an earlier scope row: the two wordings differ only by a trailing space"
SHADOWED = ("waits on the apply: kb/exhibit_repoint.py's Index reads this title as its same-wording key %r, so a row "
            "here would land on that record; #3472's Index needs to read the exact key first")


def shadowed(idx, key):
    """The other key the reviewed apply would read for this one (Index.key_of maps a key to an earlier key of the
    same wording), or None."""
    k = idx.key_of.get(key)
    return k if k and k != key else None


def crosses_groups(a, b):
    """exhibits.js crossesGroups (#3466/#3477), line for line: the result would hold both groups. None when either
    side's group is not recorded or both stay in one group. a and b are kb/exhibit_left_map.json group words
    ('graded', 'cert', 'mixed' or ''). tests/exhibit_blocker_rules_test.py runs the JS beside this to keep them equal."""
    if not a or not b:
        return None
    has = set()
    for g in (a, b):
        has |= {"graded", "cert"} if g == "mixed" else {g}
    return {"a": a, "b": b} if {"graded", "cert"} <= has else None


def _row(batch, s, key, action, frm, to, reason, idx, **kw):
    r = {"batch": batch, "exhibit_id": s["exhibit_id"], "local_title": key or s["local_title"], "action": action,
         "from": frm, "to": to, "reason": reason, "college": s.get("college") or ""}
    if to:
        r["target_exists"] = to in idx.creds
        r["target_sam_curated"] = bool(to in idx.creds and idx.sam_curated(to))
    r.update(kw)
    return r


def pair_sam_curated(idx, key, canon):
    return (idx.ut.get(key) or {}).get("reviewed_by") in xr.SAM_IDS or idx.sam_curated(canon)


def rule_cert_twin(idx, scope, claimed=None, incoming=None):
    """Rule 1 rows. `claimed` is the set of pairs another rule already moves; `incoming` maps a target name to the
    groups another rule's applicable rows send to it."""
    claimed, incoming = claimed or set(), incoming or {}
    groups = canon_groups(idx)
    seen = set()
    rows = []
    for s in scope:
        key, canon = _resolve(idx, s)
        e = s["exhibit_id"]
        mk = lambda action, to, why, **kw: rows.append(_row("cert_twin", s, key, action, canon, to, why, idx, **kw))  # noqa: E731,E501
        if not key:
            mk("skip", None, "the local title is not in kb/unified_titles.json")
            continue
        if pair_sam_curated(idx, key, canon):
            mk("tap_only", None, "Sam-curated: his tap only")
            continue
        if not_on_title(idx, key, e):
            mk("skip", None, NOT_ON_TITLE)
            continue
        if (e, key) in seen:
            mk("skip", None, DUPLICATE)
            continue
        seen.add((e, key))
        if (e, key) in claimed:
            mk("skip", None, "another rule on the re-point list already moves this pair")
            continue
        iss = issuer_of(idx.creds, canon)
        typ = cert_type(idx, e)
        if not typ:
            mk("person", None, "the exhibit reads graded in the committed record, so no cert-based twin")
            continue
        if ASSESS.search(s["local_title"]) or ASSESS.search(canon or ""):
            mk("person", None, "names AP, CLEP, IB or DSST but is typed cert-based: a type conflict, not a naming gap")
            continue
        if NAMED.search(s["local_title"]):
            mk("person", None, "the local title names a license or a specific credential: look it up instead")
            continue
        if iss and not OK_ISSUER.search(iss):
            mk("person", None, "an outside licensing issuer (%s) with no cert named" % iss)
            continue
        twin = "%s (%s)" % (canon, typ)
        if groups.get(twin, Counter())["graded"] or "graded" in incoming.get(twin, ()):
            mk("person", None, "the twin %r already holds graded exhibits" % twin)
            continue
        if slash_titles.ruled_form(twin) != twin or slash_titles.word_slash(twin):
            mk("person", None, "the twin %r would join words with a slash, which the slash rule holds for a person"
               % twin)
            continue
        if shadowed(idx, key):
            mk("skip", None, SHADOWED % shadowed(idx, key))
            continue
        mk("repoint", twin, "a college course typed cert-based with no issuer and cert named: the cert-based twin of "
           "the course title", cpl_type=typ, target_issuer=iss or COLLEGE_ISSUER)
    return rows


def rule_left_keep(idx, scope, left_map, claimed=None):
    """Rule 2 rows. `left_map` is kb/exhibit_left_map.json: its `titles` are the local titles gone from MAP (with the
    ones Sam reviewed marked) and its `titles[].group` and `canonicals[].group` are what the Exhibits List's guard
    reads. `claimed` is the set of pairs another rule moves."""
    claimed = claimed or set()
    titles = (left_map or {}).get("titles") or {}
    canon_g = (left_map or {}).get("canonicals") or {}
    leftover = set(titles)
    reviewed = {k for k, v in titles.items() if (v or {}).get("reviewed")}
    seen = set()
    allg = canon_groups(idx)
    live = canon_groups(idx, skip_titles=leftover)
    listing = defaultdict(set)
    for a in idx.arts:
        listing[(a.get("exhibit_title") or "").strip()].add(a.get("unified_title"))
    rows = []
    for s in scope:
        key, canon = _resolve(idx, s)
        e = s["exhibit_id"]
        mk = lambda action, to, why, **kw: rows.append(_row("left_keep", s, key, action, canon, to, why, idx, **kw))  # noqa: E731,E501
        if not key:
            mk("skip", None, "the local title is not in kb/unified_titles.json")
            continue
        if key not in leftover:
            mk("skip", None, "the local title is in current MAP again: not a leftover")
            continue
        if key in reviewed or pair_sam_curated(idx, key, canon):
            mk("tap_only", None, "Sam reviewed or curated it: settled, never re-queued")
            continue
        if not_on_title(idx, key, e):
            mk("skip", None, NOT_ON_TITLE)
            continue
        if (e, key) in seen:
            mk("skip", None, DUPLICATE)
            continue
        seen.add((e, key))
        if (e, key) in claimed:
            mk("skip", None, "another rule moves this pair")
            continue
        conf = float((idx.ut.get(key) or {}).get("confidence_title") or 0)
        us = listing.get(key.strip(), set())
        lg = live.get(canon, Counter())
        g = pair_group(idx, e) if e else ""
        other = {"graded": "cert", "cert": "graded"}.get(g)
        tg = (titles.get(key) or {}).get("group") or g
        cg = (canon_g.get(canon) or {}).get("group") or ""
        cross = crosses_groups(tg, cg)
        # A keep adds nothing to the canonical, so the guard asks whether this title is what puts the second group
        # there: it does when no other exhibit on the canonical shares its group. When others do, the mix comes from
        # other titles (the Split's pile), and the keep is written with already_mixed set so that pile stays visible.
        others = allg.get(canon, Counter()) - Counter(pair_group(idx, x) or "unknown"
                                                      for x in idx.ids_of.get(key, ())
                                                      if idx.pair_canonical(key, x) == canon)
        premixed = tg in ("graded", "cert") and others[tg] > 0
        kw = {"confidence": conf, "group": g or "unknown", "title_group": tg or "unknown",
              "canonical_group": cg or "unknown"}
        if cross and premixed:
            kw["already_mixed"] = True
        if us and us != {canon}:
            mk("person", None, "a course-credit listing uses a different canonical (%s)"
               % "; ".join(sorted(str(x) for x in us if x != canon)), **kw)
        elif conf < CONFIDENCE:
            mk("person", None, "mapping confidence %.2f is below 0.80" % conf, **kw)
        elif cross and not premixed:
            mk("person", None, "guard: the Exhibits List's guard (#3466) blocks it: keeping this %s title puts a "
               "second group on the canonical" % tg, **kw)
        elif other and lg[g] == 0 and lg[other] > 0:
            mk("person", None, "guard: this %s title would sit on a canonical whose live exhibits are all %s"
               % (g, other), **kw)
        elif not other and (cg == "mixed" or (lg["graded"] and lg["cert"])):
            mk("person", None, "guard: no CPL type on file, on a canonical that mixes graded and cert-based", **kw)
        elif shadowed(idx, key):
            mk("skip", None, SHADOWED % shadowed(idx, key), **kw)
        else:
            mk("confirm", canon, "every listing that carries the title already uses this canonical: keep it here",
               **kw)
    return rows


# ── checks ────────────────────────────────────────────────────────────────────────────────────────────────────────

def conflicts(rows, other_rows):
    """Check A: pairs two rules send to two different canonicals."""
    to = defaultdict(set)
    for r in list(rows) + list(other_rows):
        if r.get("action") in xr.APPLIED_ACTIONS and r.get("to"):
            to[(r["exhibit_id"], r["local_title"])].add(r["to"])
    return sorted([list(k) + [sorted(v)] for k, v in to.items() if len(v) > 1])


def graded_into_cert(idx, rows, leftover):
    """Check B: a graded pair this list moves onto, or keeps on, a canonical whose live exhibits are cert-based only;
    and a re-point onto a twin that holds graded exhibits."""
    live = canon_groups(idx, skip_titles=leftover)
    out = []
    for r in rows:
        if r["action"] not in xr.APPLIED_ACTIONS:
            continue
        g = pair_group(idx, r["exhibit_id"]) if r["exhibit_id"] else ""
        lg = live.get(r["to"], Counter())
        if g == "graded" and lg["cert"] and not lg["graded"]:
            out.append([r["exhibit_id"], r["local_title"], r["to"], "graded onto cert-based"])
        if r["action"] == "repoint" and (g != "cert" or lg["graded"]):
            out.append([r["exhibit_id"], r["local_title"], r["to"], "twin not cert-based only"])
    return out


def college_tests(rows, colleges):
    """Per college named on a pair (a pair naming two colleges counts for each): its rule outcomes, and beside them
    how many of its repoint and confirm rows the reviewed apply holds today (held_at_apply), so a rule outcome is
    never read as a pair that lands."""
    out = {}
    for c in colleges:
        per = defaultdict(Counter)
        for r in rows:
            if c in [x.strip() for x in (r.get("college") or "").split(";")]:
                per[r["batch"]][r["action"]] += 1
                if r.get("held_at_apply"):
                    per[r["batch"]]["held_at_apply"] += 1
        out[c] = {b: dict(sorted(v.items())) for b, v in sorted(per.items())}
    return out


TEST_COLLEGES = ["Modesto Junior College", "Cabrillo College", "Moorpark College", "Los Angeles Pierce College",
                 "Chaffey College", "Las Positas College"]


# ── build ─────────────────────────────────────────────────────────────────────────────────────────────────────────

# The files a rebuild reads. The list records their hashes, so the test can tell a stale list (code changed: rebuild
# in the same PR) from one the daily run's data moved under (rebuild before the apply), and pin counts only on the
# data they were measured on.
INPUTS = ("unified_titles.json", "credentials.json", "coci_articulations.json", "credential_review_overlay.json",
          "exhibit_left_map.json", "exhibit_repoint_list.json", "exhibit_blocker_scope.json")


def input_hashes():
    out = {}
    for name in INPUTS:
        path = P(name)
        h = hashlib.sha256()
        if os.path.exists(path):
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(1 << 20), b""):
                    h.update(chunk)
        out["kb/" + name] = h.hexdigest()[:16] if os.path.exists(path) else None
    return out


def load_index():
    ut = xr.load_json(P("unified_titles.json"), {})
    creds = xr.load_json(P("credentials.json"), {})
    art_doc = xr.load_json(P("coci_articulations.json"), {})
    overlay = (xr.load_json(P("credential_review_overlay.json"), {}) or {}).get("overrides") or {}
    return xr.Index(ut, creds, art_doc.get("articulations") or [], overlay)


def build(idx=None, scope_doc=None, repoint_doc=None, left_doc=None):
    idx = idx or load_index()
    scope_doc = scope_doc if scope_doc is not None else xr.load_json(SCOPE, {})
    repoint_doc = repoint_doc if repoint_doc is not None else xr.load_json(xr.LIST_PATH, {})
    left_doc = left_doc if left_doc is not None else xr.load_json(P("exhibit_left_map.json"), {})
    scope = scope_doc.get("pairs") or []
    others = [r for r in repoint_doc.get("rows") or [] if r.get("action") in xr.APPLIED_ACTIONS]
    claimed = {(r["exhibit_id"], r["local_title"]) for r in others if r["action"] != "confirm"}
    incoming = defaultdict(set)
    for r in others:
        if r.get("to") and r["action"] != "confirm":
            incoming[r["to"]].add(pair_group(idx, r["exhibit_id"]) if r["exhibit_id"] else "")
    leftover = set(left_doc.get("titles") or {})
    r1 = rule_cert_twin(idx, [s for s in scope if s["rule"] == "cert_twin"], claimed, incoming)
    moved = claimed | {(r["exhibit_id"], r["local_title"]) for r in r1 if r["action"] == "repoint"}
    r2 = rule_left_keep(idx, [s for s in scope if s["rule"] == "left_keep"], left_doc, moved)
    rows = r1 + r2
    _, _, _, undo, report = xr.apply_rows(rows, idx.ut, idx.creds, idx.arts, today="(at apply)")
    held = {(h["exhibit_id"], h["local_title"]): h["why"] for h in report["held"]}
    for r in rows:
        if (r["exhibit_id"], r["local_title"]) in held and r["action"] in xr.APPLIED_ACTIONS:
            r["held_at_apply"] = held[(r["exhibit_id"], r["local_title"])]
    by_rule = {b: dict(sorted(Counter(r["action"] for r in rows if r["batch"] == b).items()))
               for b in ("cert_twin", "left_keep")}
    snap = Counter()
    snap_diff = []
    want = {"cert_twin": "repoint", "left_keep": "confirm"}
    for s, r in zip([s for s in scope if s["rule"] == "cert_twin"] + [s for s in scope if s["rule"] == "left_keep"],
                    rows):
        # Each row carries COBIx's outcome beside its own, so the test checks the pair, never only the totals.
        r["snapshot"] = s["snapshot_outcome"] + (" " + s["snapshot_target"] if s["snapshot_target"] else "")
        mine = "rule" if r["action"] == want[r["batch"]] else "to Sam"
        theirs = "rule" if s["snapshot_outcome"] in ("repoint", "keep") else "to Sam"
        snap[(r["batch"], mine == theirs)] += 1
        if mine != theirs or (mine == "rule" and r["batch"] == "cert_twin" and r["to"] != s["snapshot_target"]):
            snap_diff.append({"rule": r["batch"], "exhibit_id": r["exhibit_id"], "local_title": r["local_title"],
                              "snapshot": r["snapshot"],
                              "now": r["action"] + (" " + r["to"] if r.get("to") else ""), "why": r["reason"]})
    resolved = by_rule["cert_twin"].get("repoint", 0) + by_rule["left_keep"].get("confirm", 0)
    moved_elsewhere = sum(1 for r in rows if r["action"] == "skip" and r["reason"].startswith("another rule"))
    not_here = sum(1 for r in rows if r["action"] == "skip" and r["reason"] in (NOT_ON_TITLE, DUPLICATE))
    shadow_n = sum(1 for r in rows if r["action"] == "skip" and r["reason"].startswith("waits on the apply"))
    held_n = sum(1 for r in rows if r.get("held_at_apply"))
    # A title-grain Keep settles every exhibit on the title, so it is written only when every exhibit id the title
    # carries is a scope pair this rule confirmed (second reader, PR #3515: two AP titles carried an id outside scope).
    confirmed = defaultdict(set)
    other_act = set()
    for r in r2:
        (confirmed[r["local_title"]].add(r["exhibit_id"]) if r["action"] == "confirm"
         else other_act.add(r["local_title"]))
    left_rows = [{"course_id": LEFT_PREFIX + t, "field": "left_map_decision", "value": "keep"}
                 for t, ids in sorted(confirmed.items())
                 if t not in other_act and (idx.ids_of.get(t, set()) <= ids)]
    left_partial = sorted(t for t, ids in confirmed.items() if t not in other_act and not idx.ids_of.get(t, set()) <= ids)
    twins = sorted({r["to"] for r in r1 if r["action"] == "repoint"})
    doc = {
        "schema": "exhibit-repoint-list/1",
        "_about": "The blocker round's rules 1 (cert_twin) and 2 (left_keep) as pair rows in kb/exhibit_repoint.py's "
                  "shape, keyed by (MAP exhibit id + local title). A dry run: nothing is applied. The reviewed apply "
                  "takes the repoint and confirm rows later (python3 kb/_cred_rename_apply.py --pairs "
                  "kb/exhibit_blocker_rules_list.json); tap_only rows wait on Sam's tap and are never applied; "
                  "person and skip rows stay with Sam, listed so the pile stays visible. `rollback` is the apply's "
                  "undo computed now on copies: every value it would change, before and after.",
        "generated_by": "kb/exhibit_blocker_rules.py",
        "source": "issue #3480, Sources 19 and 21 to 24 (COBIx, 2026-11-17); scope kb/exhibit_blocker_scope.json",
        "inputs": input_hashes(),
        "counts": {
            "scope_pairs": len(scope),
            "by_rule": by_rule,
            "resolved_by_rules": resolved,
            "resolved_and_applies_now": resolved - held_n,
            "resolved_waiting_on_exhibit_grain": held_n,
            "waits_on_apply_key_fix": shadow_n,
            "to_sam_before": 397, "moved_by_another_rule": moved_elsewhere, "not_a_pair_here": not_here,
            "to_sam_after": 397 - resolved - moved_elsewhere - not_here - shadow_n,
            "to_sam_after_note": (
                "Rule outcomes: a resolved pair the apply holds for exhibit grain counts as resolved, since it "
                "waits on the --with-exhibit-grain switch, not on Sam. A scope pair whose exhibit id is not on "
                "its local title in the committed records is not a pair here, and nor is a scope row that "
                "repeats a pair, so both are in neither pile. A pair whose title the apply would read as a "
                "same-wording key waits on that fix in #3472, not on Sam. COBIx's 212 also subtracts 4 Split "
                "guard holds that Rule 1 releases; the Split's rows are kb/exhibit_repoint_list.json's, outside "
                "this list. Rule 2's guard is the Exhibits List's (#3466 crossesGroups on "
                "kb/exhibit_left_map.json groups); a keep onto a canonical other titles already mix is written "
                "with already_mixed set and counted in kept_on_already_mixed_canonical."),
            "twins": len(twins), "twins_new": sum(1 for t in twins if t not in idx.creds),
            "conflict_a": len(conflicts(rows, others)),
            "conflict_b_graded_into_cert": len(graded_into_cert(idx, rows, leftover)),
            "kept_on_already_mixed_canonical": sum(1 for r in rows if r["action"] == "confirm" and r.get("already_mixed")),
            "held_at_apply": dict(sorted(Counter(r["held_at_apply"].split(":")[0] for r in rows
                                                 if r.get("held_at_apply")).items())),
            "apply_dry_run": {k: report["counts"][k] for k in ("applied", "held", "titles_changed",
                                                                "credentials_created", "articulations_reissued")},
            "matches_snapshot": {"%s %s" % (b, "same" if same else "differs"): n
                                 for (b, same), n in sorted(snap.items())},
        },
        "college_tests": college_tests(rows, TEST_COLLEGES),
        "snapshot_differences": snap_diff,
        "rows": rows,
        "rollback": undo,
        "left_map_keep": {
            "_about": "Rule 2's Keep, as the Exhibits List stores it (exhibits.js leftSave): one kb_curation row per "
                      "leftover title whose every scope pair keeps, so the title stops showing as waiting. A Rule 10 "
                      "plan, not applied: a fresh live read first; INSERT only, ON CONFLICT DO NOTHING, under the "
                      "cohort reviewer_email; rollback deletes the cohort's rows (a keep with no earlier Move or "
                      "Remove changes nothing in kb/unified_titles.json, so the repo side has nothing to undo).",
            "reviewer_email": KEEP_COHORT,
            "rows": left_rows,
            "not_written": left_partial,
            "not_written_why": "the title carries an exhibit id outside this scope, which the rule never decided",
        },
    }
    return doc


def dumps(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="fail when the committed list differs from a rebuild")
    a = ap.parse_args()
    text = dumps(build())
    if a.check:
        old = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
        if old != text:
            sys.exit("kb/exhibit_blocker_rules_list.json is stale: run python3 kb/exhibit_blocker_rules.py")
        print("exhibit_blocker_rules_list.json is current")
        return
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(json.dumps(json.loads(text)["counts"], indent=1))


if __name__ == "__main__":
    main()
