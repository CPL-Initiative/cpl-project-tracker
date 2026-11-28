#!/usr/bin/env python3
"""The common-subject alignment re-mint, S749: a DRY RUN of the one pass Sam ruled on 2026-11-28 (Rule 7).

THE RULING (cpl_memory r-full-remint-for-new-joins-sam-2026-11-28; Sam via COBIx, 2026-11-28, his words as relayed):
"a full re-mint of every M-ID whose code or discipline join should change under the new alignment, not just a hold on
the ones that collide... Do it once, in one pass." Scope: "Re-mint an M-ID only where its common code or discipline
join changes. Leave every other M-ID alone." The alignment is #3952 (COBIx's #3951 files, filed by S749): it re-coded
57 disciplines in kb/discipline_canonical_subj4.json and held the changes that touch M-IDs for this pass.

WHAT THIS WRITES (nothing else; no kb identity file, no seed, no picks file changes here):
  kb/remint_dryrun/s749_report.md   every M-ID that would change, totals by reason, surprises, the yes/no list, the SQL
  kb/remint_dryrun/s749_plan.json   the plan: per M-ID before/after code and discipline, status, its references
  kb/mid_forwarding.csv             DRAFT forwarding map (old_mid,new_mid,reason,date), one row per planned move

A CODE CHANGE IS A PREFIX RE-KEY THAT KEEPS THE NUMBER (kb/_subjects_list_recode.py, the playbook's lesson): the
authority recode's Allocator keeps each number where the new key is free and gap-fills where it is not. A slot an
earlier re-mint vacated, an id SkyView's hand-built layout still draws, and a reserved id all count as taken; a row
returning to an id it held itself takes it back.

FORWARDING. kb/mid_forwarding.csv is the ledger Sam asked for. It is not a second resolver: at the apply the same
rows are written as an alias_map.json receipt and registered in kb/alias_chain.py ALIAS_MAPS (the playbook, "Register
the alias map before the post-apply chain"), so every reader resolves an old M-ID through the one chain. Nothing is
registered by this dry run: only apply-confirmed maps belong in the chain.

THE SCOPES, each pinned with who ruled and when (SCOPES below). A change the alignment makes that no scope carries
fails V0, so a new alignment change cannot slip past the plan: the receipt kb/receipts/minted_codes_s749.json names
every code change with its before-value, and each M-ID's code is compared with its discipline's code before and after.

PERSON-SETTLED ROWS ARE FROZEN. An M-ID with a person's kb_curation row (or a person's pointer at it) is HELD, never
moved, and listed. A code a person curated that a Nov 28 ruling changes goes on the yes/no list and its rows are
`needs_yes`: the apply refuses them until the yes is recorded in APPROVED (Sam answered all of them on 2026-11-28,
r-remint-dryrun-defaults-sam-2026-11-28, so they read `approved`; V8 fails on any left waiting). A person's filing of a local subject under a discipline
(kb/status/subject_decisions.json `statewide`) decides where a discipline-less M-ID on that local code goes.

Run (from the repo root):
  python3 kb/_alignment_remint_dryrun.py            # writes the three files
  python3 kb/_alignment_remint_dryrun.py --check    # CI-style: the committed plan and forwarding map are current
"""
import argparse
import csv
import io
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, parse_id, kept_number, load_id_reservations)
import _eths_remint as er  # noqa: E402  (load_docs, ever_minted_ids, skyview_ids)
import alias_chain as ac  # noqa: E402  (the one chain: read, never restated)
from _flags import is_person  # noqa: E402
from curation_pointers import POINTER_FIELDS  # noqa: E402

RULING_DATE = "2026-11-28"
RULING_ID = "r-full-remint-for-new-joins-sam-2026-11-28"
OUT_DIR = os.path.join(HERE, "remint_dryrun")
REPORT = os.path.join(OUT_DIR, "s749_report.md")
PLAN = os.path.join(OUT_DIR, "s749_plan.json")
FORWARDING = os.path.join(HERE, "mid_forwarding.csv")
SEED = os.path.join(HERE, "discipline_canonical_subj4.json")
ALIASES = os.path.join(HERE, "discipline_aliases.json")
RECEIPT = os.path.join(HERE, "receipts", "minted_codes_s749.json")
DECISIONS = os.path.join(HERE, "status", "subject_decisions.json")
PICKS_GLOB = "kb/subject_title_hunt/20261128_common_picks_"
FORWARDING_HEADER = ["old_mid", "new_mid", "reason", "date"]
APPLIED = os.path.join(HERE, "alignment_remint_out", "2026-11-28", "alias_map.json")   # kb/_alignment_remint_apply.py

# Each scope: the code it moves, where to, the discipline the rows join, and the words that rule it.
# `seed` is the seed edit the apply makes beside the re-key (None when #3952 already made it, or no edit is needed).
SCOPES = {
    "nutr-fold": {
        "from": "NUTR", "to": "FDNT", "join": "Nutritional Science/Dietetics", "leaves": "Dietetics/Nutritional Science",
        "reason": "NUTR folds into FDNT (Sam, 2026-11-28, group_rulings.txt: NUTR (Dietetics/Nutritional Science) "
                  "folds into FDNT; NUTR retired as alias)",
        "seed": "Dietetics/Nutritional Science leaves the seed and becomes an alias of Nutritional Science/Dietetics "
                "in kb/discipline_aliases.json; NUTR joins FDNT's local variants",
        "discipline_moves": True,
    },
    "aero": {
        "from": "AERO", "to": "MILS", "join": "Military Studies", "leaves": None,
        "reason": "Aeronautics leaves AERO for AERN (Sam, 2026-11-28, COBIx's minted list #3951); the nine AERO ids are "
                  "Fresno's Air Force ROTC and go to Military Studies (Sam, r-remint-dryrun-defaults-sam-2026-11-28)",
        "seed": "Aeronautics canonical_subj4 AERO -> AERN, minted at the apply (held by kb/_apply_minted_codes_s749.py "
                "for this pass); AERN starts with Space Technology alone (Allan Hancock SPACE) and no M-ID; AERO stays "
                "a local variant of Aviation",
        "discipline_moves": False,
    },
    "phtc": {
        "from": "PHTC", "to": "PHOT", "join": "Photography", "leaves": None,
        "reason": "PHTC left Photographic Technology/ Commercial Photography for CPHT in #3952; a person filed the "
                  "local code PHTC under Photography (_SUBJ_DISC::PHTC, 2026-11-24)",
        "seed": None,
        "discipline_moves": False,
    },
    "pubr": {
        "from": "PUBR", "to": "PREL", "join": "Public Relations", "leaves": None,
        "reason": "PUBR is no discipline's code; the Nov 28 picks join its local subject (PUB REL) to Public "
                  "Relations, whose code is PREL (Sam, 2026-11-28: codes no M-ID starts with)",
        "seed": None,
        "discipline_moves": False,
    },
    "tour": {
        "from": "TOUR", "to": "TRVL", "join": "Travel Services", "leaves": None,
        "reason": "TOUR is no discipline's code; the Nov 28 picks join its local subject to Travel Services, whose "
                  "code is TRVL (Sam, 2026-11-28: codes no M-ID starts with)",
        "seed": None,
        "discipline_moves": False,
    },
}
# The codes the ruling asked for where the minted list's proposal collided. Each is already the discipline's code in
# the seed; V5 checks it is still free.
CODE_CHOICES = {
    "Flight Attendant Training": ("FLTR", "FLTA prefixes 6 Foreign Languages (Filipino) M-IDs; FLTR is Sam's own pick "
                                          "of 2026-11-23 (S717) and no M-ID starts with it"),
    "Public Relations": ("PREL", "PUBR prefixes 1 M-ID with no discipline"),
    "Travel Services": ("TRVL", "TOUR prefixes 12 M-IDs with no discipline"),
}
# Codes a person named that this pass never moves (the conductor, S749: Sam named the four noncredit codes on
# 2026-11-22, r-noncredit-four-mq-codes-sam-2026-11-22). V7 checks the seed still holds each and no scope touches one.
SETTLED_CODES = {
    "Home Economics: Noncredit": "HMEN",
    "Citizenship: Noncredit": "CTZN",
    "Health and Safety: Noncredit": "HLSN",
    "Disabled Student Programs and Services: Noncredit": "DSPN",
}
MINTED = os.path.join(HERE, "subject_title_hunt", "minted_codes.csv")
# Sam's answers to the yes/no list ("fine on defaults", 2026-11-28; COBIx agrees): the scopes whose person-settled
# conflicts he approved. A conflict in a scope not named here leaves its rows `needs_yes`, and V8 fails.
APPROVED_RULING = "r-remint-dryrun-defaults-sam-2026-11-28"
APPROVED = {
    "nutr-fold": "yes, all 320",
    "pubr": "yes, PUBR M1001 to PREL",
    "tour": "yes, TOUR to TRVL",
}
KEPT_ANSWER = "stays (Sam, 2026-11-28: FLTR, HMEN, CTZN, HLSN and DSPN stay)"
# Held changes in the S749 receipt that a code choice answers instead of a move.
RECEIPT_HELD_ANSWERED = {"Flight Attendant Training", "Public Relations", "Travel Services"}

# Where a committed file that names an M-ID sits, for the references table. First match wins.
REF_CLASSES = [
    ("historical receipt (never re-keyed)", re.compile(
        r"(^docs/|_out/|^kb/receipts/|^kb/remint_dryrun/|^kb/subj4_apply/|^kb/subj4_dryrun/|^kb/migrations/"
        r"|^kb/row_audit/|^kb/subject_title_hunt/)")),
    ("identity (re-keyed by the apply and the post-apply chain)", re.compile(
        r"^kb/(coci_minted_courses|coci_minted_singletons|coci_minted_memberships|coci_curation|coci_articulations"
        r"|promotions|crnc_mirrors)\.json$")),
    ("SkyView layout (--rekey-skyview)", re.compile(r"^prototype/ccr_universe(_members)?\.json$")),
    ("generated payload (daily build, or --rekey-generated)", re.compile(
        r"^(unified_courses_\w+\.js|cpl_pathways_\w+\.js|credential_reference_data\.js|prototype/\S+\.json)$")),
    ("exhibits / CER / EACR", re.compile(
        r"^kb/(exhibit_side_by_side|side_by_side|exhibits_review_subjects|cr_reference_worklist"
        r"|cid_articulation_joins)\.json$")),
    ("CCR cards", re.compile(r"^kb/(coci_retired_cards|coci_inactive_cards|coci_closest_mid)\.json$|^kb/ccr_out/")),
    ("status (kb/status, rebuilt by its builders)", re.compile(r"^kb/status/")),
    ("test fixture", re.compile(r"^tests/")),
    ("other kb file", re.compile(r"^kb/")),
    ("other", re.compile(r".")),
]


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def codes_of(entry):
    """The codes a discipline holds: its common code and any umbrella codes."""
    out = set()
    if entry.get("canonical_subj4"):
        out.add(entry["canonical_subj4"])
    out |= set(entry.get("umbrella_codes") or [])
    return out


def seed_before(seed, receipt):
    """The seed as it stood before #3952, rebuilt from the receipt's before-values (no git needed)."""
    before = json.loads(json.dumps(seed))
    for c in receipt.get("changed", []):
        if c["discipline"] in before:
            before[c["discipline"]]["canonical_subj4"] = c["from"]
    for a in receipt.get("added", []):
        before.pop(a["discipline"], None)
    return before


def code_owners(seed):
    own = defaultdict(set)
    for d, e in seed.items():
        for c in codes_of(e):
            own[c].add(d)
    return own


def effective(cid, rec_, curations):
    """The discipline a row carries: a curator's overlay wins over the file's."""
    return (curations.get(cid) or {}).get("discipline") or rec_.get("discipline")


def prefix(cid):
    return cid.split(" ")[0]


def own_stamps(r):
    return {v for k, v in r.items() if k.startswith("_") and k.endswith("_from") and isinstance(v, str)}


def person_filings(decisions):
    """{local code: (discipline, who, at)} from a person's statewide filings (_SUBJ_DISC::<CODE>)."""
    out = {}
    for x in decisions.get("statewide") or []:
        if x.get("code") and x.get("discipline"):
            out[x["code"]] = (x["discipline"], x.get("who"), x.get("at"))
    return out


def detect(seed, before, receipt, rows, curations):
    """Every change the alignment makes that touches an M-ID, as {code: why}. V0 fails on any no scope carries."""
    found = {}
    pref = Counter(prefix(k) for k in rows)
    for c in receipt.get("changed", []):
        if pref.get(c["from"]):
            found[c["from"]] = f"#3952 moved {c['discipline']} {c['from']} -> {c['to']}; {pref[c['from']]} M-ID(s) on {c['from']}"
        if pref.get(c["to"]):
            found[c["to"]] = f"#3952 gave {c['discipline']} {c['to']}, which {pref[c['to']]} M-ID(s) already carry"
    for h in receipt.get("held", []):
        if h["discipline"] in RECEIPT_HELD_ANSWERED or is_person((seed.get(h["discipline"]) or {}).get("reviewed_by")):
            continue                                            # a code choice, or a person's code: frozen, not a change
        found[h["from"]] = f"held by #3952 for this pass: {h['discipline']} {h['from']} -> {h['to']}"
    ob, oa = code_owners(before), code_owners(seed)
    for k, r in rows.items():
        p, d = prefix(k), effective(k, r, curations)
        on_before = bool(d) and d in before and p in codes_of(before[d])
        on_after = bool(d) and d in seed and p in codes_of(seed[d])
        if on_before != on_after:
            found.setdefault(p, f"{k}: on its discipline's code before #3952 {on_before}, after {on_after}")
        if not d and bool(ob.get(p)) != bool(oa.get(p)):
            found.setdefault(p, f"{k}: no discipline, and its code {p} changed hands in #3952")
    return found


def compute_plan(courses, singletons, curations, memberships, seed, receipt, aliases, decisions, picks,
                 reservations, vacated=frozenset(), drawn=frozenset(), minted=()):
    """Pure. -> the plan the report, the forwarding draft and the tests read."""
    rows = {**courses, **singletons}
    before = seed_before(seed, receipt)
    v0 = []
    found = detect(seed, before, receipt, rows, curations)
    carried = {s["from"] for s in SCOPES.values()}
    for code, why in sorted(found.items()):
        if code not in carried:
            v0.append(f"{code}: {why} - no scope carries it")
    owners = code_owners(seed)
    filings = person_filings(decisions)
    alias_of = {a: canon for canon, names in (aliases.get("aliases") or {}).items() for a in names}

    # Person-curated codes a scope changes: the yes/no list.
    conflicts = []
    for name, s in SCOPES.items():
        left = s.get("leaves")
        if left and left in seed:
            e = seed[left]
            if is_person(e.get("reviewed_by")):
                conflicts.append({"scope": name, "kind": "code",
                                  "what": f"{left} holds {s['from']} by {e.get('reviewed_by')}'s curator override "
                                          f"({str(e.get('reviewed_at'))[:10]})"})
        f = filings.get(s["from"])
        if left and f and f[0] == left:
            conflicts.append({"scope": name, "kind": "filing",
                              "what": f"A person filed the local code {s['from']} under {f[0]} ({str(f[2])[:10]}), "
                                      f"the discipline the fold retires"})
    # A discipline-less row joins by its local subject: a person's filing of that local code under another
    # discipline than the scope's join is a conflict for that row's scope.
    by_from0 = {s["from"]: name for name, s in SCOPES.items()}
    scope_wide = {c["scope"] for c in conflicts}
    row_conf = {}
    for cid in sorted({**courses, **singletons}):
        r = courses.get(cid) or singletons.get(cid)
        name = by_from0.get(prefix(cid))
        if not name or effective(cid, r, curations):
            continue
        subs = {r.get("subject")} | {m.get("subject") for m in (memberships.get(cid) or [])}
        for sub in sorted(x for x in subs if x):
            f = filings.get(sub)
            if f and f[0] != SCOPES[name]["join"]:
                c = row_conf.get((name, sub))
                if c is None:
                    c = row_conf[(name, sub)] = {"scope": name, "kind": "filing", "ids": [],
                                                 "what": f"A person filed the local code {sub} under {f[0]} "
                                                         f"({str(f[2])[:10]}), and the ids it feeds join "
                                                         f"{SCOPES[name]['join']}"}
                    conflicts.append(c)
                if cid not in c["ids"]:
                    c["ids"].append(cid)
    needs_yes_ids = {i for c in row_conf.values() for i in c["ids"]}
    # A minted-list code a person already named is a frozen-row conflict, never a change (the conductor, S749): the
    # person's code stays, and the list's proposal goes to Sam.
    for r in minted:
        d, code = r["mq_discipline"].strip(), r["proposed_code"].strip().upper()
        e = seed.get(d) or {}
        if e and e.get("canonical_subj4") and e["canonical_subj4"] != code and is_person(e.get("reviewed_by")):
            conflicts.append({"scope": None, "kind": "minted_vs_person", "discipline": d, "kept": e["canonical_subj4"],
                              "proposed": code,
                              "what": f"{d}: COBIx's minted list proposes {code}; {e.get('reviewed_by')} named "
                                      f"{e['canonical_subj4']} ({str(e.get('reviewed_at'))[:10]})"})
    v7 = [f"{d}: the seed holds {(seed.get(d) or {}).get('canonical_subj4')}, not {c}"
          for d, c in SETTLED_CODES.items() if (seed.get(d) or {}).get("canonical_subj4") != c]
    v7 += [f"{n}: moves {s['from']} or {s['to']}, a person-settled code" for n, s in SCOPES.items()
           if {s["from"], s["to"]} & set(SETTLED_CODES.values())]

    # Person rows on an id, and a person's pointer at one: held.
    person_on = defaultdict(list)
    for k, e in curations.items():
        if not isinstance(e, dict):
            continue
        if is_person(e.get("reviewed_by")):
            person_on[k].append(f"{e.get('reviewed_by')} curated {k} ({', '.join(f for f in e if not f.startswith('reviewed'))})")
            for f in POINTER_FIELDS:
                if e.get(f):
                    person_on[e[f]].append(f"{e.get('reviewed_by')} points {k} at it ({f})")

    by_from = {s["from"]: name for name, s in SCOPES.items()}
    moves = {}
    skipped = []
    for src, recs in (("catalog", courses), ("singleton", singletons)):
        for cid, r in recs.items():
            name = by_from.get(prefix(cid))
            if not name:
                continue
            s = SCOPES[name]
            if not rec.parse_id(cid)[4] or rec.parse_id(cid)[1] != "M":
                skipped.append(cid)
                continue
            d_before = effective(cid, r, curations)
            d_after = s["join"] if (s["discipline_moves"] or not d_before) else d_before
            if d_before and alias_of.get(d_before):
                d_after = alias_of[d_before]
            cur = curations.get(cid) or {}
            status = "planned"
            if person_on.get(cid):
                status = "held_person"
            elif name in scope_wide or cid in needs_yes_ids:
                status = "approved" if name in APPROVED else "needs_yes"
            moves[cid] = {
                "old_id": cid, "source": src, "scope": name, "title": r.get("common_title") or "",
                "code_before": s["from"], "code_after": s["to"],
                "discipline_before": d_before, "join_before": d_before or ", ".join(sorted(code_owners(before).get(s["from"], []))) or None,
                "discipline_after": d_after,
                "college": r.get("college"), "local_subject": r.get("subject"),
                "merge_into": cur.get("merge_into"), "honors_of": cur.get("honors_of"),
                "overlay_fields": sorted(f for f in cur if not f.startswith("reviewed")),
                "overlay_by": cur.get("reviewed_by"),
                "person": person_on.get(cid, []),
                "members": len(memberships.get(cid) or []),
                "own": sorted(own_stamps(r)),
                "status": status, "new_id": None, "how": None,
            }
    # Allocation: every move gets its would-be id, held ones included, so the yes/no list shows where each goes.
    real = set(rows) | {k for k in curations if rec.parse_id(k)[4]}
    alloc = rec.Allocator((real | set(vacated) | set(drawn)) - set(moves), reservations)
    order = sorted(moves)
    for cid in order:                                           # pass 1: keep the number
        m = moves[cid]
        want = rec.kept_number(cid, m["code_after"])
        home = want in m["own"] and want not in alloc.taken and want not in (real - set(moves)) and want not in drawn
        if alloc.free(want):
            m["new_id"], m["how"] = want, "kept number"
        elif home:
            m["new_id"], m["how"] = want, "returned home"
        else:
            continue
        alloc.taken.add(want)
    for cid in order:                                           # pass 2: gap-fill the rest
        m = moves[cid]
        if not m["new_id"]:
            m["new_id"], m["how"] = alloc.place(cid, m["code_after"], prefer_keep=False,
                                                reason=f"{cid} -> {m['code_after']} ({m['scope']})")
    alias = {k: v["new_id"] for k, v in moves.items() if v["status"] != "held_person" and v["new_id"]}

    # Code checks.
    pref_disc = defaultdict(set)
    for k, r in rows.items():
        pref_disc[prefix(k)].add(effective(k, r, curations))
    vacated_pref = Counter(prefix(k) for k in vacated)
    v5 = []
    for name, s in SCOPES.items():
        to, join = s["to"], s["join"]
        held = owners.get(to, set()) - {join}
        if held:
            v5.append(f"{name}: {to} is also {', '.join(sorted(held))}'s code")
        home = to in codes_of(seed.get(join) or {})
        if pref_disc.get(to) and not home:
            v5.append(f"{name}: {to} already prefixes M-IDs of {sorted(map(str, pref_disc[to]))} and is not "
                      f"{join}'s code")
        if join in seed and seed[join].get("canonical_subj4") != to and to not in codes_of(seed[join]):
            v5.append(f"{name}: the seed gives {join} {seed[join].get('canonical_subj4')}, not {to}")
    for d, (code, _why) in CODE_CHOICES.items():
        if (seed.get(d) or {}).get("canonical_subj4") != code:
            v5.append(f"{d}: the seed holds {(seed.get(d) or {}).get('canonical_subj4')}, not {code}")
        if owners.get(code, set()) - {d}:
            v5.append(f"{d}: {code} is also {sorted(owners[code] - {d})}'s code")
        if pref_disc.get(code, set()) - {d}:
            v5.append(f"{d}: {code} already prefixes M-IDs")
        if vacated_pref.get(code) and code not in {s['to'] for s in SCOPES.values()}:
            v5.append(f"{d}: an earlier re-mint used {code}")
    if owners.get("AERN", set()) - {"Aeronautics"} or pref_disc.get("AERN"):
        v5.append("AERN, Aeronautics' code at the apply, is already another discipline's or an M-ID's prefix")

    new_ids = [v["new_id"] for v in moves.values()]
    two_codes = sorted(k for k, v in moves.items() if not v["new_id"] or not v["new_id"].startswith(v["code_after"] + " "))
    forwarded = set(alias)
    validation = {
        "V0_every_alignment_change_is_carried": {"pass": not v0, "problems": v0},
        "V1_each_id_one_new_id_unique_and_free": {
            "pass": None not in new_ids and len(set(new_ids)) == len(new_ids)
            and not (set(new_ids) & (real - set(moves))) and not two_codes,
            "duplicates": [x for x, n in Counter(new_ids).items() if n > 1][:10], "off_code": two_codes[:10]},
        "V2_no_old_id_left_on_a_moving_code": {
            "pass": not [k for k in rows if prefix(k) in by_from and k not in moves],
            "left": [k for k in rows if prefix(k) in by_from and k not in moves][:10]},
        "V3_only_M_ids": {"pass": not skipped, "skipped": skipped[:10]},
        "V4_every_planned_id_has_a_forwarding_row": {
            "pass": forwarded == {k for k, v in moves.items() if v["status"] != "held_person"}},
        "V5_codes_free": {"pass": not v5, "problems": v5},
        "V7_person_settled_codes_kept": {"pass": not v7, "problems": v7},
        "V8_every_yes_no_answered": {"pass": not [k for k, v in moves.items() if v["status"] == "needs_yes"],
                                     "waiting": sorted(k for k, v in moves.items() if v["status"] == "needs_yes")[:10]},
        "V6_person_rows_held": {
            "pass": all(v["status"] == "held_person" for v in moves.values() if v["person"]),
            "held": sorted(k for k, v in moves.items() if v["status"] == "held_person")},
    }
    strays = stray_survey(rows, curations, memberships, seed, picks, set(by_from))
    return {"ruling": RULING_ID, "date": RULING_DATE, "moves": moves, "alias": dict(sorted(alias.items())),
            "conflicts": conflicts, "detected": found, "validation": validation,
            "gapfilled": len([v for v in moves.values() if v["how"] == "gap-filled"]), "strays": strays}


def load_picks(root=ROOT):
    """{(college, local code, band): common code} from the Nov 28 picks files."""
    out = {}
    d = os.path.join(root, os.path.dirname(PICKS_GLOB))
    base = os.path.basename(PICKS_GLOB)
    for fn in sorted(os.listdir(d)):
        if fn.startswith(base) and fn.endswith(".csv"):
            with open(os.path.join(d, fn), encoding="utf-8") as f:
                for r in csv.DictReader(f):
                    out[(r["college"].strip(), r["local_subject_code"].strip(), r["band"].strip())] = \
                        (r["common_code"].strip(), fn)
    return out


def stray_survey(rows, curations, memberships, seed, picks, moving):
    """M-IDs on a code no discipline holds, outside this plan. The stray-code lane owns them (r-no-mid-on-a-stray-code-
    sam-2026-11-25: retire, back to Needs an M-ID); the report lists the codes the Nov 28 picks now join them to."""
    owners = code_owners(seed)
    by = defaultdict(lambda: {"ids": 0, "picks": Counter()})
    for k, r in rows.items():
        p = prefix(k)
        if p in owners or p in moving:
            continue
        by[p]["ids"] += 1
        keys = [(r.get("college"), r.get("subject"), "credit")] if r.get("college") else []
        keys += [(m.get("college"), m.get("subject"), "credit") for m in (memberships.get(k) or [])]
        got = {picks[x][0] for x in keys if x in picks}
        for g in got:
            by[p]["picks"][g] += 1
    return {p: {"ids": v["ids"], "picks": dict(v["picks"])} for p, v in sorted(by.items())}


def references(ids, root=ROOT):
    """{file: {id: count}} for every tracked file that names a moving id, by exact token. The era-stamped files are
    checked current first (alias_chain.pending_maps): a file behind the chain holds older ids, and a direct match
    against it would read live rows as dead."""
    behind = []
    for rel in ("kb/promotions.json", "kb/crnc_mirrors.json"):
        p = os.path.join(root, rel)
        if os.path.exists(p):
            t = (load(p) or {}).get("_rekeyed_through")
            if t and ac.pending_maps(t)[0]:
                behind.append(rel)
    if not ids:
        return {}, behind
    prefixes = sorted({prefix(i) for i in ids})
    pat = r"\b(" + "|".join(prefixes) + r") M[0-9][0-9A-Z]{3}\b"
    try:
        out = subprocess.run(["git", "-C", root, "grep", "-o", "-E", "-I", pat], capture_output=True, text=True,
                             check=False).stdout
    except OSError:
        out = ""
    hits = defaultdict(Counter)
    idset = set(ids)
    for line in out.splitlines():
        f, _, tok = line.rpartition(":")
        if tok in idset and f not in ("kb/mid_forwarding.csv", "kb/_alignment_remint_dryrun.py", "tests/alignment_remint_dryrun_test.py") and not f.startswith("kb/remint_dryrun/s749_"):
            hits[f][tok] += 1
    return {f: dict(c) for f, c in sorted(hits.items())}, behind


def ref_class(path):
    for name, rx in REF_CLASSES:
        if rx.search(path):
            return name
    return "other"


def forwarding_rows(plan):
    out = []
    for k, v in sorted(plan["moves"].items()):
        if k not in plan["alias"]:
            continue
        reason = f"{v['scope']}: {v['code_before']} -> {v['code_after']}"
        if v["status"] == "needs_yes":
            reason += " (waits on Sam's yes: a person-curated code)"
        elif v["status"] == "approved":
            reason += f" (approved: Sam, 2026-11-28, {APPROVED_RULING})"
        out.append([k, plan["alias"][k], reason, plan["date"]])
    return out


def render_forwarding(plan):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(FORWARDING_HEADER)
    w.writerows(forwarding_rows(plan))
    return buf.getvalue()


SQL = """select json_build_object(
  'rows', (select coalesce(json_agg(json_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value,
             'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order by k.course_id, k.field), '[]'::json)
           from public.kb_curation k
           where split_part(k.course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
              or (k.field in ('merge_into', 'honors_of')
                  and split_part(trim(both '"' from k.value::text), ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR'))),
  'codes', (select coalesce(json_agg(json_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value,
             'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order by k.course_id, k.field), '[]'::json)
            from public.kb_curation k
            where k.course_id in ('_CANON_SUBJ4::Dietetics/Nutritional Science', '_CANON_SUBJ4::Nutritional Science/Dietetics',
                                  '_CANON_SUBJ4::Aeronautics', '_CANON_SUBJ4::Photography',
                                  '_CANON_SUBJ4::Photographic Technology/ Commercial Photography',
                                  '_CANON_SUBJ4::Public Relations', '_CANON_SUBJ4::Travel Services',
                                  '_CANON_SUBJ4::Flight Attendant Training',
                                  '_SUBJ_DISC::NUTR', '_SUBJ_DISC::FDNT', '_SUBJ_DISC::AERO', '_SUBJ_DISC::AERN',
                                  '_SUBJ_DISC::PHTC', '_SUBJ_DISC::PUBR', '_SUBJ_DISC::TOUR', '_SUBJ_DISC::FLTA')),
  'person_rows', (select count(*) from public.kb_curation k
                  where split_part(k.course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
                    and k.reviewer_email not like '%@bot' and k.reviewer_email not like '%.bot'),
  'by_prefix', (select json_object_agg(p, n) from (select split_part(course_id, ' ', 1) p, count(*) n
                from public.kb_curation where split_part(course_id, ' ', 1) in ('NUTR', 'AERO', 'PHTC', 'PUBR', 'TOUR')
                group by 1) x)
);"""


def render_report(plan, refs, behind):
    mv = plan["moves"]
    L = [f"# The common-subject alignment re-mint (S749): DRY RUN, {plan['date']}", "",
         f"The ruling ({RULING_ID}; Sam via COBIx, 2026-11-28): re-mint every M-ID whose common code or discipline "
         "join changes under the new alignment (#3952), once, in one pass; leave every other M-ID alone. Nothing is "
         "applied. The playbook governs the apply (docs/coursecontrolnumber_remint.md): a prefix re-key that keeps "
         "the number, the receipt registered in kb/alias_chain.py ALIAS_MAPS, the post-apply chain, one cron window.",
         "", "**`kb/mid_forwarding.csv` is a DRAFT.** It carries one row per planned move; the apply writes the same "
         "rows as its alias_map.json receipt and registers it in ALIAS_MAPS. Until then no reader resolves through it.",
         "", "## Validation", ""]
    for k, v in plan["validation"].items():
        extra = {x: y for x, y in v.items() if x != "pass" and y}
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}" + (f" `{json.dumps(extra)[:600]}`" if extra and not v.get("pass") else ""))
    st = Counter(v["status"] for v in mv.values())
    L += ["", f"## Totals: {len(mv)} M-IDs ({', '.join(f'{n} {k}' for k, n in sorted(st.items()))})", "",
          "| Scope | Reason | Code | Discipline join after | Ids | Catalog | Stand-alone | Kept number | Gap-filled | Status |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for name, s in SCOPES.items():
        vs = [v for v in mv.values() if v["scope"] == name]
        L.append(f"| {name} | {s['reason']} | {s['from']} -> {s['to']} | {s['join']} | {len(vs)} | "
                 f"{sum(v['source'] == 'catalog' for v in vs)} | {sum(v['source'] == 'singleton' for v in vs)} | "
                 f"{sum(v['how'] == 'kept number' for v in vs)} | {sum(v['how'] == 'gap-filled' for v in vs)} | "
                 f"{', '.join(f'{n} {k}' for k, n in sorted(Counter(v['status'] for v in vs).items()))} |")
    L += ["", "Seed and picks edits the apply makes beside the re-key (proposed here, not committed):", ""]
    for name, s in SCOPES.items():
        if s.get("seed"):
            L.append(f"- {name}: {s['seed']}.")
    L += ["- tour: the two Travel Services picks (Saddleback College TOUR, Southwestern College T&T) already take TRVL "
          "on #3952 (9f56672c); nothing to edit.",
          "- aero: Fresno City College AEROST's pick (COBI, `M-ID AERO`) moves to MILS with its nine M-IDs; Allan "
          "Hancock SPACE's pick already names AERN and applies once the apply mints AERN for Aeronautics.",
          "- Codes the ruling asked for where the minted list collided (already the seed's, checked free by V5): "
          + "; ".join(f"{d} **{c}** ({w})" for d, (c, w) in CODE_CHOICES.items()) + ".",
          "- Cardiovascular Technology: CVTC -> CVTE landed in #3952; no M-ID carries CVTC or CVTE (V0 measured every "
          "prefix).", ""]
    L += ["## Frozen-row conflicts and Sam's answers", "",
          "Each is a person's value that a Nov 28 ruling or the minted list would change. Sam answered all of them on "
          f"2026-11-28 (\"fine on defaults\", {APPROVED_RULING}; COBIx agrees): every ruled move is approved, and every "
          "person-named code stays. Sam's four noncredit codes of 2026-11-22 (HMEN, CTZN, HLSN, DSPN) are frozen (V7). "
          "A conflict a later run finds in a scope he has not answered leaves its rows `needs_yes`, and V8 fails.", ""]
    ex = {}
    for v in sorted(mv.values(), key=lambda x: x["old_id"]):
        ex.setdefault(v["scope"], v)
    for i, c in enumerate(plan["conflicts"], 1):
        if c["scope"] is None:
            L.append(f"{i}. {c['what']}. The plan keeps {c['kept']} and moves nothing. Answer: {c['kept']} {KEPT_ANSWER}.")
            continue
        e = mv.get(c["ids"][0]) if c.get("ids") else ex.get(c["scope"])
        eg = f" Example: {e['old_id']} *{e['title']}* -> {e['new_id']}." if e else ""
        if c.get("ids"):
            eg += f" Ids: {', '.join(c['ids'])}."
        ans = APPROVED.get(c["scope"])
        L.append(f"{i}. {c['what']}. The plan moves {SCOPES[c['scope']]['from']} -> {SCOPES[c['scope']]['to']}.{eg} "
                 + (f"Answer: {ans} (Sam, 2026-11-28)." if ans else "Waiting on Sam: *Yes* or *No*."))
    held = sorted(k for k, v in mv.items() if v["status"] == "held_person")
    if held:
        L += ["", f"Held, a person's row on the id ({len(held)}): " + ", ".join(held[:20])]
    else:
        L += ["", "No moving M-ID carries a person's kb_curation row in the committed overlay, and no person points at "
              "one; the SELECT below re-reads the live table."]
    L += ["", "## Surprises", ""]
    aero = [v for v in mv.values() if v["scope"] == "aero"]
    nutr = [v for v in mv.values() if v["scope"] == "nutr-fold"]
    tour = [v for v in mv.values() if v["scope"] == "tour"]
    L += [f"1. **NUTR is {len(nutr)} M-IDs, not 54**: {sum(v['source'] == 'catalog' for v in nutr)} catalog and "
          f"{sum(v['source'] == 'singleton' for v in nutr)} stand-alone. FDNT already holds its own ids, so "
          f"{sum(v['how'] == 'gap-filled' for v in nutr)} NUTR ids gap-fill rather than keep their number.",
          f"2. **AERO is {len(aero)} M-IDs, not 1**, and none is aeronautics: all are Fresno City College's Air Force "
          "ROTC (local subject AEROST, TOP 1801 Military Studies; *AS100 Heritage and Values*). Sam sent them to "
          "Military Studies (MILS), beside eight Army ROTC ids (2026-11-28); AERN starts with Space Technology alone.",
          "3. **PHTC was missed by #3952**: it re-coded Photographic Technology/ Commercial Photography PHTC -> CPHT "
          "counting catalog M-IDs only, and 4 stand-alone ids carry PHTC (Antelope Valley, Moorpark). A person filed "
          "the local code PHTC under Photography (2026-11-24), and one of the four already merges into PHOT M1041, so "
          "they move to PHOT.",
          f"4. **TOUR is {len(tour)} M-IDs**: 4 catalog and 8 Saddleback stand-alones; two catalog ids came from a local "
          "subject ATC (TOUR M1002, M1003).",
          "5. **The alias changes move nothing**: no M-ID's discipline is African American Studies, Asian American "
          "Studies or Speech Communication. Ethnic Studies' 754 rows keep ETHS; sorting its African American and Asian "
          "American titles into AFAM and ASAM is new classification, not a join change, so it is outside this pass.",
          f"6. **{sum(v['ids'] for v in plan['strays'].values())} M-IDs on {len(plan['strays'])} other stray codes** "
          "stay outside the plan: the stray-code lane retires them to Needs an M-ID "
          "(r-no-mid-on-a-stray-code-sam-2026-11-25), and the Nov 28 picks now name a common code for many of their "
          "local subjects (the table below), which unblocks that lane's held rows.",
          ""]
    L += ["## Stray codes outside the plan (the stray-code lane's)", "",
          "| Code | Ids | Nov 28 picks for their local subjects |", "|---|---|---|"]
    for p, v in plan["strays"].items():
        L.append(f"| {p} | {v['ids']} | {', '.join(f'{c} {n}' for c, n in sorted(v['picks'].items())) or 'none'} |")
    # references
    per_id = defaultdict(Counter)
    per_class_files = defaultdict(set)
    for f, ids in refs.items():
        cl = ref_class(f)
        per_class_files[cl].add(f)
        for i in ids:
            per_id[i][cl] += 1
    L += ["", "## References: committed files that name a moving M-ID", "",
          "Exact id tokens (`git grep`), on the working tree the dry run read. "
          + ("Era check: every era-stamped file (kb/promotions.json, kb/crnc_mirrors.json) is current with the chain, "
             "so a direct match is the comparison." if not behind else f"ERA: {behind} lag the chain; re-key first."),
          "", "| Class | Files | Examples |", "|---|---|---|"]
    for cl in [c for c, _ in REF_CLASSES]:
        fs = sorted(per_class_files.get(cl, ()))
        if fs:
            L.append(f"| {cl} | {len(fs)} | {', '.join(fs[:6])}{' …' if len(fs) > 6 else ''} |")
    L += ["", "Open PRs touching those files (read 2026-11-28 15:17Z): #3917 (COBIx: kb/status/csr_proposed_codes.json, "
          "local_subject_recommendations.json, mq_view.json, statewide_subject_codes.json, statewide_code_courses/*; "
          "rebuilt by their builders after the apply) and #3953 (kb/status/commons.json, commons_history.json; counts "
          "only, no M-ID). #3951 is #3952's source. #3950, #3926 and #3383 touch none.", ""]
    L += ["## Every M-ID that would change", "",
          "Status: planned · approved (a person-settled conflict Sam approved) · needs_yes · held_person. Discipline before is the row's (a curator's "
          "overlay wins); none means it joined only by its code. References: files by class (id: identity, gen: "
          "generated, sky: SkyView, cer: exhibits/CER/EACR, ccr: CCR cards, st: status, t: tests, hist: receipts).", "",
          "| Old id | New id | How | Code | Discipline before -> after | Title | Status | Overlay | References |",
          "|---|---|---|---|---|---|---|---|---|"]
    short = {c: s for c, s in zip([c for c, _ in REF_CLASSES], ["hist", "id", "sky", "gen", "cer", "ccr", "st", "t", "kb", "o"])}
    for k in sorted(mv):
        v = mv[k]
        r = ", ".join(f"{short[c]} {n}" for c, n in sorted(per_id[k].items()))
        ov = ",".join(v["overlay_fields"]) or "-"
        L.append(f"| {k} | {v['new_id']} | {v['how']} | {v['code_before']} -> {v['code_after']} | "
                 f"{v['discipline_before'] or 'none'} -> {v['discipline_after']} | {v['title'].replace('|', '/')} | "
                 f"{v['status']} | {ov} | {r} |")
    L += ["", "## The fresh read for the conductor (one SELECT, one JSON value)", "",
          "The live kb_curation rows on every moving id, every pointer at one (merge_into, honors_of; CN: rows "
          "included), the code rows for the disciplines involved, and the count of person rows. The WHERE bounds it, "
          "so it needs no Range paging. The apply compares it with the committed overlay (P3).", "", "```sql", SQL,
          "```", "", "## After the review", "",
          "1. Record Sam's answers to the yes/no list; a *No* drops that scope's rows from the forwarding map.",
          "2. The apply (a follow-up on this branch's planner): recompute, match the reviewed forwarding map (P1), the "
          "fresh read (P3), re-key the five identity documents through kb/_eths_remint.py `apply_plan` with stamp "
          "`_alignment_remint_from`, make the seed and picks edits above, write the alias_map.json receipt from the "
          "forwarding rows and register it in ALIAS_MAPS in the same commit, then kb/_post_apply_chain.py, "
          "--rekey-skyview, --rekey-generated.",
          "3. After the merge, before the next cron: supabase-rekey.yml with the receipt, the read-back, daily-dashboard.yml.",
          "4. Rollback: `git revert` of the land, and supabase-rekey.yml with the forwarding map read right to left.", ""]
    return "\n".join(L)


def build(root=ROOT):
    docs = er.load_docs()
    seed = load(SEED)["disciplines"]
    plan = compute_plan(docs["courses"]["courses"], docs["singletons"]["courses"], docs["curation"]["curations"],
                        docs["memberships"]["memberships"], seed, load(RECEIPT), load(ALIASES), load(DECISIONS),
                        load_picks(root), rec.load_id_reservations(), vacated=er.ever_minted_ids(),
                        drawn=er.skyview_ids(), minted=load_minted())
    return plan


def load_minted():
    with open(MINTED, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def plan_doc(plan, refs=None, behind=()):
    doc = {"_status": "DRY RUN, not applied (S749). Every M-ID the Nov 28 alignment re-mints, with its would-be id.",
           "_generated_by": "kb/_alignment_remint_dryrun.py", **{k: plan[k] for k in
           ("ruling", "date", "validation", "conflicts", "detected", "alias", "moves", "strays")}}
    if refs is not None:
        doc["references"] = refs
        doc["references_era_behind"] = list(behind)
    return doc


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="the committed plan and forwarding map match a fresh run")
    args = ap.parse_args(argv)
    if os.path.exists(APPLIED) and load(APPLIED).get("_applied_at"):
        # The apply landed (kb/_alignment_remint_apply.py): the plan and the forwarding map are its record, frozen. A
        # fresh run would find nothing left to move and write an empty forwarding map over the ledger.
        rows = list(csv.reader(io.StringIO(open(FORWARDING, encoding="utf-8").read())))[1:]
        aliases = {k: v["new_id"] for k, v in load(APPLIED)["aliases"].items()}
        same = {r[0]: r[1] for r in rows} == aliases == load(PLAN).get("alias")
        if args.check:
            print(f"alignment re-mint dry run: applied, frozen ({len(aliases)} forwarding rows"
                  + (", matching the receipt)" if same else ") - the forwarding map or plan differs from the receipt"))
            return 0 if same else 1
        print(f"alignment re-mint dry run: applied ({os.path.relpath(APPLIED, ROOT)}); the plan, report and forwarding "
              "map are frozen, so nothing is written")
        return 1
    plan = build()
    bad = [k for k, v in plan["validation"].items() if not v.get("pass")]
    fwd = render_forwarding(plan)
    if args.check:
        try:
            committed = load(PLAN)
            with open(FORWARDING, encoding="utf-8") as f:
                cf = f.read()
        except OSError as e:
            print(f"alignment re-mint dry run: missing {e.filename}")
            return 1
        fresh = plan_doc(plan)
        stale = [k for k in fresh if not k.startswith("_") and committed.get(k) != fresh[k]]
        if cf != fwd:
            stale.append("kb/mid_forwarding.csv")
        if stale or bad:
            print(f"alignment re-mint dry run: STALE {stale} FAIL {bad} - rerun python3 kb/_alignment_remint_dryrun.py")
            return 1
        print(f"alignment re-mint dry run: current ({len(plan['moves'])} M-IDs, {len(plan['alias'])} forwarding rows)")
        return 0
    refs, behind = references(sorted(plan["moves"]))
    os.makedirs(OUT_DIR, exist_ok=True)
    er.dump(PLAN, plan_doc(plan, refs, behind))
    with open(FORWARDING, "w", encoding="utf-8") as f:
        f.write(fwd)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(render_report(plan, refs, behind))
    st = Counter(v["status"] for v in plan["moves"].values())
    print(f"DRY RUN - {len(plan['moves'])} M-IDs {dict(st)}, {plan['gapfilled']} gap-filled, "
          f"{len(plan['alias'])} forwarding rows; {len(refs)} files name a moving id")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL ' + json.dumps({x: y for x, y in v.items() if x != 'pass'})[:300]}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
