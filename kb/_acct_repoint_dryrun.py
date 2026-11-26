#!/usr/bin/env python3
"""The Accounting re-point, DRY RUN: the identities on BUSI whose courses sit on an accounting local code move to ACCT.

WHY. The Common Subjects Reference was seeded from the M-IDs' disciplines, so Accounting had no common code when the
statewide calls ran (cpl_memory `f-csr-seeded-from-mids-left-95-mq-disciplines-uncoded-s717`). The local codes ACCT,
ACCTG, ACC and ACTG were called to Business and their courses sit on BUSI M-IDs. Accounting now holds ACCT in
kb/discipline_canonical_subj4.json (source `assigned`, C-ID ACCT basis, S717). The common-subjects lane's NEXT item (1)
re-points those identities to Accounting/ACCT under the playbook (docs/coursecontrolnumber_remint.md). This is its
first piece and its dry run. LING, HOSP, the religion codes, MCOM and AERO are follow-ons with the same shape.

WHY A NEW PLANNER AND NOT A SCOPE ON kb/_subjects_list_recode.py. The recode moves a prefix's whole namespace (or, in
its split mode, one discipline's rows off a shared prefix) and checks that the seed's code changes. Here the seed's
codes do not change (BUSI stays Business's, ACCT is already Accounting's); what selects a row is the local subject code
of its member courses, read family by family. So this planner keeps the recode's allocation and imports its pieces
(the authority recode's Allocator, kept_number, parse_id and id reservations; the ETHS re-mint's loaders, every id a
registered receipt names, SkyView's drawn ids), and replaces only the selection.

THE MEMBERSHIP TEST (TOP is never read; CLAUDE.md Rule 7). A course is an accounting course when its local subject
code at its college is ACCT, ACCTG, ACC or ACTG ("Accounting (ACCTG)" reads ACCTG) and that college's code is not a
homonym. A homonym is a college's code whose courses mostly do not read as accounting (Copper Mountain's ACC is its
ACCESS (DSPS) program). An identity is judged with its merge family: the record a curator's `merge_into` chain ends on,
plus every shell merged into it, so a shell never leaves its target and units never split an identity. A family moves
when (a) its target sits on BUSI, (b) at least half its member courses are accounting courses, (c) the target's title
does not read as another subject (personal finance, spreadsheets, keyboarding, work experience: OTHER_WORDS; a Business
Math or payroll-software course on ACCTG stays in), and (d) no person set its discipline or merged it elsewhere. A family that fails (b) or (c) is
FLAGGED and stays; one that fails (d) is HELD with the curator's value.

PERSON-SETTLED. A person's (non-@bot) `discipline` overlay that is not Accounting holds its family; a person's
`merge_into` onto a record that is not moving holds the shell. A college-keyed subject decision or a course move
(kb/status/subject_decisions.json) that names a common code other than ACCT holds its courses' families. The statewide
filings `_SUBJ_DISC::ACC|ACCT|ACCTG|ACTG` (a person's Confirm on the Local subjects List, 2026-11-24, all four under
Business) are code-level: the apply gate G1 refuses to run until each is re-filed under Accounting, or the reopen is
logged on new source evidence (the C-ID ACCT descriptors and the MQ handbook's own Accounting discipline), because a
machine never overrides a person's filing silently.

ALLOCATION is the recode's: pass 1 keeps the number where ACCT's slot is free (or the row returns to an ACCT id its own
`_*_from` stamp names), pass 2 gap-fills through the Allocator; a slot an earlier re-mint vacated is never taken, and
an Honors id (base plus H) moves with its base.

Run (from the repo root):
  python3 kb/_acct_repoint_dryrun.py          # dry run -> kb/acct_repoint_out/<date>/ (report.md, alias_map.json,
                                              #   held.json, plan.json)
There is no --apply. The apply is its own script, under the playbook, once G1 clears: freeze the receipt, a fresh
read of kb_curation for the moved ids, the seed and kb/reference/subject_discipline_map.json edits in the same commit,
the receipt registered in kb/alias_chain.py ALIAS_MAPS, kb/_post_apply_chain.py, the SkyView and generated-file
re-keys, then supabase-rekey.yml and daily-dashboard.yml in one cron window.
"""
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, kept_number, parse_id, load_id_reservations)
import _eths_remint as er  # noqa: E402  (load_docs, ever_minted_ids, skyview_ids, dump)
import alias_chain as ac  # noqa: E402  (the one ALIAS_MAPS and resolve; never copied)
from _subjects_list_recode import own_stamps  # noqa: E402

OUT_ROOT = os.environ.get("ACCT_REPOINT_OUT") or os.path.join(HERE, "acct_repoint_out")
SEED = os.path.join(HERE, "discipline_canonical_subj4.json")
SUBJ_MAP = os.path.join(HERE, "reference", "subject_discipline_map.json")
DECISIONS = os.path.join(HERE, "status", "subject_decisions.json")
STAMP = "_acct_repoint_from"
SCOPE = "acct-repoint-s736"
FROM, TO, DISC, FROM_DISC = "BUSI", "ACCT", "Accounting", "Business"
CODES = ("ACCT", "ACCTG", "ACC", "ACTG")
# Codes the map sends to Business that no course carries today, normalized forms of the same subject.
MAP_ALSO = ("ACCOUNT", "ACCTNG")
# Codes that read as accounting and are out of this run's scope: counted, never moved on.
NEAR_CODES = ("BUAC", "BUSAC", "ACCTGFS")
MIN_SHARE = 0.5
HOMONYM_SHARE = 0.5
ACCT_WORDS = re.compile(
    r"accounting|\bacctg\b|\bacct\b|bookkeep|\btax|payroll|audit|quickbooks|quick books|fraud examination|forensic|"
    r"financial statement|enrolled agent|ledger|accountant|\bvita\b", re.I)
# A title that reads as another subject. A course on an accounting code is an accounting course unless its title reads
# as one of these and not as accounting (a Business Math or payroll-software course on ACCTG stays in; the brief).
OTHER_WORDS = re.compile(
    r"work experience|personal financ|financial planning|personal invest|money management|keyboard|10.?key|ten.?key|"
    r"learning disab|college success|\bdsps\b|\baccess\b|quicken|spreadsheet|\bexcel\b|data analytic|tableau|alteryx|"
    r"justice.impacted|introduction to business|marketing|real estate|insurance", re.I)
HONORS_RE = re.compile(r"^([A-Z]{4} M\d{4})H$")
PERSON = re.compile(r"@bot$")
# Files that carry M-ids as tokens, counted for the blast radius (the apply re-keys or rebuilds each).
TOKEN_FILES = ("kb/promotions.json", "kb/crnc_mirrors.json", "kb/coci_articulations.json",
               "kb/cid_articulation_joins.json", "kb/coci_inactive_cards.json", "unified_courses_data.js",
               "unified_courses_standalone.js", "coci_lookup_data.js", "credential_reference_data.js",
               "prototype/ccr_universe.json", "prototype/ccr_universe_members.json", "prototype/ccr_remint_blast.json")


def local_code(s):
    """'Accounting (ACCTG)' -> 'ACCTG'; 'acct ' -> 'ACCT'."""
    s = (s or "").strip()
    m = re.search(r"\(([A-Za-z]+)\)\s*$", s)
    if m:
        s = m.group(1)
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def is_person(reviewer):
    return bool(reviewer) and not PERSON.search(reviewer)


def reads_accounting(title):
    return bool(ACCT_WORDS.search(title or ""))


def title_reading(title):
    """'accounting' (it says so), 'other' (it reads as another subject and not as accounting) or 'neutral'."""
    if reads_accounting(title):
        return "accounting"
    return "other" if OTHER_WORDS.search(title or "") else "neutral"


def course_rows(courses, singletons, memberships):
    """-> [(identity id, college, code, title)] for every member course (catalog members and singletons)."""
    out = []
    for cid, ms in memberships.items():
        t = (courses.get(cid) or {}).get("common_title")
        for m in ms:
            out.append((cid, m.get("college"), local_code(m.get("subject")), t))
    for cid, r in singletons.items():
        out.append((cid, r.get("college"), local_code(r.get("subject")), r.get("common_title")))
    return out


def homonyms(rows):
    """{(college, code): {n, reads, titles}} for an accounting code a college uses mostly for something else."""
    by = defaultdict(list)
    for cid, col, code, t in rows:
        if code in CODES:
            by[(col, code)].append(t or "")
    out = {}
    for k, ts in by.items():
        reads = sum(reads_accounting(t) for t in ts)
        if reads / len(ts) < HOMONYM_SHARE:
            out[k] = {"n": len(ts), "reads": reads, "titles": sorted(set(ts))[:6]}
    return out, len(by)


def terminal(cid, curations, live, maps):
    """The record a curator's merge_into chain ends on. A pointer that names no live id resolves through the alias
    chain (kb/alias_chain.py); one that still names nothing is reported as it stands."""
    seen, cur = [cid], cid
    for _ in range(12):
        nxt = (curations.get(cur) or {}).get("merge_into")
        if not nxt:
            break
        if nxt not in live:
            nxt = ac.resolve_id(nxt, maps)
        if nxt in seen:
            break
        seen.append(nxt)
        cur = nxt
    return cur, seen


def compute_plan(courses, singletons, memberships, curations, decisions, reservations, maps,
                 vacated=frozenset(), drawn=frozenset()):
    """Pure. -> the plan the report, the receipt and the test read."""
    records = {**courses, **singletons}
    live = set(records)
    rows = course_rows(courses, singletons, memberships)
    homs, college_codes = homonyms(rows)
    acct = lambda col, code: code in CODES and (col, code) not in homs  # noqa: E731

    # A person's college-keyed decision or course move that names another common code.
    held_codes, held_courses = {}, {}
    for d in decisions.get("decisions") or []:
        if local_code(d.get("code")) in CODES and d.get("common_code") and d["common_code"] != TO:
            held_codes[(d.get("college"), local_code(d.get("code")))] = d
    for d in decisions.get("courses") or []:
        if local_code(d.get("code")) in CODES and d.get("common_code") and d["common_code"] != TO:
            held_courses[(d.get("college"), local_code(d.get("code")))] = d
    filings = {local_code(f.get("code")): f for f in decisions.get("statewide") or []
               if local_code(f.get("code")) in CODES + MAP_ALSO}

    # Families: each record joins the family of the record its merge chain ends on.
    fam, chain_of = defaultdict(list), {}
    for cid in live:
        h = HONORS_RE.match(cid)
        base = h.group(1) if h and h.group(1) in live and not (curations.get(cid) or {}).get("merge_into") else cid
        t, seen = terminal(base, curations, live, maps)     # an Honors id joins its base's family
        fam[t].append(cid)
        chain_of[cid] = seen
    per_id = defaultdict(lambda: {"n": 0, "acct": 0, "codes": Counter(), "near": 0, "homonym": 0, "held_by": []})
    for cid, col, code, t in rows:
        p = per_id[cid]
        p["n"] += 1
        p["codes"][code] += 1
        if acct(col, code):
            p["acct"] += 1
        elif code in CODES:
            p["homonym"] += 1
        if code in NEAR_CODES:
            p["near"] += 1
        if (col, code) in held_codes or (col, code) in held_courses:
            p["held_by"].append({"college": col, "code": code})

    families = {}
    for target, ids in fam.items():
        if not any(per_id[i]["acct"] or per_id[i]["homonym"] for i in ids):
            continue
        n = sum(per_id[i]["n"] for i in ids)
        a = sum(per_id[i]["acct"] for i in ids)
        cur_t = curations.get(target) or {}
        rec_t = records.get(target) or {}
        title = cur_t.get("unified_title") or rec_t.get("common_title") or ""
        share = a / n if n else 0.0
        reading = title_reading(title)
        families[target] = {
            "target": target, "ids": sorted(ids), "members": n, "acct_members": a, "share": round(share, 3),
            "title": title, "title_reading": reading,
            "confidence": round(100 * (0.6 * share + 0.4 * {"accounting": 1, "neutral": 0.5, "other": 0}[reading])),
            "homonym_members": sum(per_id[i]["homonym"] for i in ids),
            "near_code_members": sum(per_id[i]["near"] for i in ids),
            "discipline": (cur_t.get("discipline") or rec_t.get("discipline")),
        }

    moves, held, flagged = {}, [], []
    for target, f in sorted(families.items()):
        why, kind, by = None, None, None
        tprefix = rec.parse_id(target)[0] or target.split(" ")[0]
        person_disc = [(i, curations[i]) for i in f["ids"] if (curations.get(i) or {}).get("discipline")
                       and curations[i]["discipline"] != DISC and is_person(curations[i].get("reviewed_by"))]
        person_codes = [(i, per_id[i]["held_by"]) for i in f["ids"] if per_id[i]["held_by"]]
        if tprefix != FROM:
            if target not in live:
                kind, why = "held", f"merged by a curator into {target}, which is not a live M-ID record"
            else:
                kind, why = "flagged", f"the family's record sits on {tprefix} ({f['discipline']}), not BUSI"
            # A shell a PERSON merged into a record that is not moving is held with the person's value.
            people = [i for i in f["ids"] if i != target and is_person((curations.get(i) or {}).get("reviewed_by"))
                      and (curations.get(i) or {}).get("merge_into")]
            if people:
                kind, by = "held", {i: {"merge_into": curations[i]["merge_into"],
                                        "by": curations[i]["reviewed_by"]} for i in people}
                why = f"a person merged {', '.join(people)} into {target}, which does not move"
        elif person_disc:
            kind, why = "held", "a person set the discipline"
            by = {i: {"discipline": c["discipline"], "by": c.get("reviewed_by")} for i, c in person_disc}
        elif person_codes:
            kind, why, by = "held", "a person's subject decision names another common code", dict(person_codes)
        elif f["title_reading"] == "other":
            kind, why = "flagged", "the title reads as another subject"
        elif f["share"] < MIN_SHARE:
            kind, why = "flagged", f"accounting courses are {f['acct_members']} of {f['members']} (under half)"
        if kind == "held":
            held.append({**f, "why": why, "curator": by})
            continue
        if kind == "flagged":
            if f["acct_members"]:
                flagged.append({**f, "why": why})
            continue
        for cid in f["ids"]:
            if not rec.parse_id(cid)[4]:      # an Honors id moves with its base, below
                continue
            r = records[cid]
            moves[cid] = {"old_id": cid, "family": target, "source": "minted" if cid in courses else "singleton",
                          "title": r.get("common_title") or "", "members": per_id[cid]["n"],
                          "acct_members": per_id[cid]["acct"], "merged": cid != target,
                          "own": sorted(own_stamps(r)), "confidence": f["confidence"]}

    # Allocation (the recode's two passes).
    real = live | set(curations)
    alloc = rec.Allocator((real | set(vacated) | set(drawn)) - set(moves), reservations)
    order = sorted(moves)
    returned = []
    for cid in order:
        want = rec.kept_number(cid, TO)
        m = moves[cid]
        m["new_id"] = m["how"] = None
        home = (want in m["own"] and want not in alloc.taken and want not in (real - set(moves)) and want not in drawn)
        if alloc.free(want):
            m["new_id"], m["how"] = want, "kept number"
        elif home:
            m["new_id"], m["how"] = want, "returned home"
            returned.append(cid)
        else:
            continue
        alloc.taken.add(want)
    for cid in order:
        if moves[cid]["new_id"]:
            continue
        moves[cid]["new_id"], moves[cid]["how"] = alloc.place(cid, TO, prefer_keep=False,
                                                              reason=f"{cid} -> {TO} ({SCOPE})")
    honors_orphans = []
    for cid in sorted(live):
        h = HONORS_RE.match(cid)
        if not h:
            continue
        if h.group(1) in moves:
            moves[cid] = {"old_id": cid, "family": moves[h.group(1)]["family"], "source": "minted",
                          "title": records[cid].get("common_title") or "", "members": per_id[cid]["n"],
                          "acct_members": per_id[cid]["acct"], "merged": False, "own": [],
                          "confidence": moves[h.group(1)]["confidence"],
                          "new_id": moves[h.group(1)]["new_id"] + "H", "how": "honors, with its base"}
        elif per_id[cid]["acct"] and cid.startswith(FROM + " "):
            honors_orphans.append(cid)

    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}
    new_ids = list(alias.values())
    held_ids = {i for h in held for i in h["ids"]}
    flagged_ids = {i for f in flagged for i in f["ids"]}
    stale_vacated = sorted(k for k, v in moves.items() if v.get("new_id") in vacated and v["how"] != "returned home")
    applied = sorted(k for k, r in records.items() if r.get(STAMP))
    validation = {
        "P0_not_applied": {"pass": not applied, "applied": applied[:10]},
        "V1_new_ids_unique_and_free": {"pass": len(set(new_ids)) == len(new_ids) == len(moves)
                                       and not (set(new_ids) & (real - set(moves))),
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V2_codes": {"pass": all(v.startswith(TO + " ") for v in new_ids)},
        "V3_no_vacated_slot": {"pass": not stale_vacated, "ids": stale_vacated[:10]},
        "V4_held_and_flagged_never_move": {"pass": not ((held_ids | flagged_ids) & set(alias)),
                                           "ids": sorted((held_ids | flagged_ids) & set(alias))[:10]},
        "V5_families_whole": {"pass": all(all(i in alias or not rec.parse_id(i)[4] for i in families[m["family"]]["ids"])
                                          for m in moves.values())},
        "V6_honors_with_base": {"pass": not honors_orphans, "ids": honors_orphans[:10]},
        "V7_only_M_ids": {"pass": all(rec.parse_id(k)[1] == "M" or HONORS_RE.match(k) for k in alias)},
    }
    gates = {
        "G1_statewide_filings": {
            "pass": all(f.get("discipline") == DISC for c, f in filings.items() if c in CODES),
            "filings": {c: {"discipline": f.get("discipline"), "who": f.get("who"), "at": f.get("at")}
                        for c, f in sorted(filings.items())},
            "why": ("a person filed these codes under Business on the Local subjects List; the apply waits for the "
                    "re-filing under Accounting (or a logged reopen on new source evidence)")},
        "G2_fresh_read": {"pass": False, "why": "the apply reads kb_curation for every moved id at write time"},
    }
    return {"scope": SCOPE, "moves": moves, "alias": alias, "held": held, "flagged": flagged,
            "homonyms": {f"{c}|{k}": v for (c, k), v in sorted(homs.items())}, "college_codes": college_codes,
            "validation": validation, "gates": gates, "gapfilled": alloc.gapfilled, "returned_home": returned,
            "acct_courses_minted": sum(1 for _, _, code, _ in rows if code in CODES),
            "families": len([f for f in families.values() if f["target"] in {m['family'] for m in moves.values()}])}


def blast_radius(alias, curations, root=ROOT):
    """What the apply touches: curation keys and pointers, and token counts in each id-keyed file."""
    olds = set(alias)
    out = {"kb_curation_keys": sorted(k for k in curations if k in olds),
           "kb_curation_pointers": sorted(k for k, v in curations.items() if (v or {}).get("merge_into") in olds),
           "files": {}}
    if not olds:
        return out
    pat = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(re.escape(k) for k in sorted(olds, key=len, reverse=True))
                     + r")(?![A-Za-z0-9])")
    for rel in TOKEN_FILES:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            hits = pat.findall(f.read())
        out["files"][rel] = {"tokens": len(hits), "ids": len(set(hits))}
    arts = er.load_docs()["articulations"].get("articulations", [])
    on = [a for a in arts if a.get("course_id") in olds]
    out["articulations"] = {"records": len(on), "exhibits": len({a.get("exhibit_id") for a in on}),
                            "with_credit_recommendations": sum(1 for a in on if a.get("credit_recommendations"))}
    return out


def seed_edits(seed_doc, map_doc, plan):
    """The two edits the apply makes in its commit, as before -> after, never written here."""
    disc = seed_doc["disciplines"]
    b, a = disc[FROM_DISC], disc[DISC]
    edits = {"kb/discipline_canonical_subj4.json": {
        f"disciplines.{FROM_DISC}.cid_subject_codes": {"before": b.get("cid_subject_codes"),
                                                        "after": [c for c in b.get("cid_subject_codes") or [] if c != TO]},
        f"disciplines.{FROM_DISC}.local_subject_variants": {
            "before": {c: (b.get("local_subject_variants") or {}).get(c) for c in CODES},
            "after": "dropped by kb/_seed_canonical_subj4.py (the chain's csr-seed step) once the ids move"},
        f"disciplines.{DISC}.canonical_subj4": {"before": a.get("canonical_subj4"), "after": TO},
        f"disciplines.{DISC}.total_mids": {"before": a.get("total_mids"),
                                           "after": f"rebuilt by csr-seed ({sum(1 for m in plan['moves'].values() if m['source'] == 'minted')} catalog ids move)"},
        f"disciplines.{DISC}._notes": {"before": a.get("_notes"),
                                       "after": "drop 'No M-ID is minted under it yet'; name this re-point and its receipt"},
    }}
    m = map_doc.get("map") or {}
    edits["kb/reference/subject_discipline_map.json"] = {
        f"map.{c}": {"before": m.get(c), "after": DISC} for c in CODES + MAP_ALSO}
    return edits


def render_report(plan, br, edits, today, receipt):
    moves = plan["moves"]
    how = Counter(v["how"] for v in moves.values())
    courses = sum(v["members"] for v in moves.values())
    acct_c = sum(v["acct_members"] for v in moves.values())
    L = [f"# The Accounting re-point ({SCOPE}): dry run {today}", "",
         "BUSI identities whose courses sit on an accounting local code (ACCT, ACCTG, ACC, ACTG) move to Accounting's "
         "common subject ACCT, under the playbook (docs/coursecontrolnumber_remint.md): a keep-number prefix re-key with "
         "gap-fills. Nothing is applied; there is no --apply.", "",
         "## Headline", "",
         f"- **Ids that move:** {len(moves)} ({sum(1 for v in moves.values() if v['source'] == 'minted')} catalog, "
         f"{sum(1 for v in moves.values() if v['source'] == 'singleton')} singletons) in {plan['families']} families; "
         + ", ".join(f"{n} {k}" for k, n in sorted(how.items())) + ".",
         f"- **Courses behind them:** {courses} member courses, {acct_c} of them on an accounting code; the other "
         f"{courses - acct_c} sit on business codes inside families whose majority is accounting, and move with "
         "their identity (units and codes never split one).",
         f"- **Shells on another prefix that follow a BUSI target:** "
         f"{', '.join(sorted(k for k in moves if not k.startswith(FROM + ' '))) or 'none'}.",
         f"- **Scope of the count:** {plan['acct_courses_minted']} courses on the four codes sit in the minted layer "
         "(memberships and singletons). kb/status/statewide_subject_codes.json counts every COCI course on them "
         "(the lane's 1,012); the rest carry no M-ID yet and take ACCT at their first mint once the map and the "
         "filings change.",
         f"- **Held (person-settled):** {len(plan['held'])} famil{'y' if len(plan['held']) == 1 else 'ies'}, {sum(len(h['ids']) for h in plan['held'])} ids.",
         f"- **Flagged, staying:** {len(plan['flagged'])} families, {sum(f['acct_members'] for f in plan['flagged'])} "
         "accounting courses among them.",
         f"- **Homonyms:** {len(plan['homonyms'])} of {plan['college_codes']} college codes.", "",
         "## Validation (the plan)", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})[:600]}`"))
    L += ["", "## Apply gates (open by design in a dry run)", ""]
    for k, v in plan["gates"].items():
        L.append(f"- **{k}**: {'clear' if v.get('pass') else 'OPEN'}. {v.get('why', '')}")
        for c, f in (v.get("filings") or {}).items():
            L.append(f"  - `_SUBJ_DISC::{c}`: {f['discipline']} ({f['who']}, {f['at']})")
    L += ["", "## Held: a person set it", "", "| Family | Ids | Title | Why | Curator's value |", "|---|---|---|---|---|"]
    L += [f"| {h['target']} | {', '.join(h['ids'])} | {h['title']} | {h['why']} | `{json.dumps(h['curator'])}` |"
          for h in plan["held"]]
    L += ["", "## Flagged: accounting courses that stay where they are", "",
          "| Family | Ids | Title | Accounting courses | Confidence | Why |", "|---|---|---|---|---|---|"]
    L += [f"| {f['target']} | {len(f['ids'])} | {f['title']} | {f['acct_members']} of {f['members']} | "
          f"{f['confidence']} | {f['why']} |" for f in sorted(plan["flagged"], key=lambda f: -f["acct_members"])]
    L += ["", "## Homonyms (a college's accounting code that names another subject)", "",
          "| College and code | Courses | Read as accounting | Titles |", "|---|---|---|---|"]
    L += [f"| {k} | {v['n']} | {v['reads']} | {'; '.join(v['titles'])} |" for k, v in plan["homonyms"].items()]
    L += ["", "These courses never count toward a family's accounting share. The subject map edit below would call "
          "them Accounting statewide, so the apply first files a college-keyed subject decision for each.", "",
          "## Moves by family (largest first)", "",
          "| Family | Ids | Courses | Accounting | Confidence | New id of the family's record |", "|---|---|---|---|---|---|"]
    fams = defaultdict(list)
    for v in moves.values():
        fams[v["family"]].append(v)
    for t, vs in sorted(fams.items(), key=lambda kv: -sum(v["members"] for v in kv[1]))[:60]:
        L.append(f"| {t} | {len(vs)} | {sum(v['members'] for v in vs)} | {sum(v['acct_members'] for v in vs)} | "
                 f"{vs[0]['confidence']} | {moves[t]['new_id'] if t in moves else '?'} |")
    if len(fams) > 60:
        L.append(f"| ... | {len(fams) - 60} more families in plan.json | | | | |")
    L += ["", "## The edits the apply makes in its commit", "", "```json", json.dumps(edits, indent=1)[:4000], "```",
          "", "## Blast radius", "",
          f"- kb_curation: {len(br['kb_curation_keys'])} rows keyed by a moved id, "
          f"{len(br['kb_curation_pointers'])} `merge_into` pointers naming one (both re-keyed by supabase-rekey.yml).",
          f"- Articulations: {br.get('articulations', {}).get('records', 0)} records on moved ids, "
          f"{br.get('articulations', {}).get('exhibits', 0)} exhibits, "
          f"{br.get('articulations', {}).get('with_credit_recommendations', 0)} carrying credit recommendations.", ""]
    L += [f"- `{rel}`: {v['tokens']} tokens, {v['ids']} ids" for rel, v in br["files"].items()]
    L += ["", "## What the apply needs (the template's chain, plus this run's own)", "",
          "1. Clear G1: the four `_SUBJ_DISC::` filings re-filed under Accounting on the Local subjects List, or the "
          "reopen logged on new source evidence. File a college-keyed decision for each homonym first.",
          "2. Freeze this receipt; the apply reproduces it (P1) after a fresh read of kb_curation for every moved id "
          "(P3) and a re-check of pending `unified_title_merge_confirm` targets (Rule 10).",
          "3. Apply the kb (memberships, courses, singletons, articulations, curation mirror) with "
          f"`{STAMP}` stamps, and the two edits above, in one commit.",
          f"4. Register `{receipt}` in kb/alias_chain.py ALIAS_MAPS in the same commit, then "
          "`python3 kb/_post_apply_chain.py` (promotions, crnc mirrors, csr-seed, authority, audit, fold-verify).",
          "5. Re-key SkyView's layout and the generated files token for token (the recode's `--rekey-skyview "
          "--rekey-generated` shape), rebuild ccr_cpl.json, ccr_sky.json and the blast radius; the dependency map "
          "rebuilds on main.",
          "6. Rebuild kb/statewide_subject_codes.json and kb/local_subject_recommendations.json, which read the map: "
          "the statewide calls then read ACCT for these codes.",
          "7. After the merge, in one cron window: supabase-rekey.yml with the receipt, a read-back (no row on an old "
          "id), then daily-dashboard.yml.", "",
          "## Follow-ons (not in this run)", "",
          "- BUAC, BUSAC and ACCTGFS read as accounting and stay out of scope; their courses count as non-accounting "
          "members here.",
          "- LING, HOSP, the religion codes (RLST, RELS, RELG), MCOM and AERO take the same planner shape.", ""]
    return "\n".join(L)


def main(argv=None):
    if argv and "--apply" in argv:
        sys.exit("dry run only: the apply is its own script under the playbook")
    today = date.today().isoformat()
    docs = er.load_docs()
    courses, singletons = docs["courses"]["courses"], docs["singletons"]["courses"]
    memberships, curations = docs["memberships"]["memberships"], docs["curation"]["curations"]
    with open(DECISIONS, encoding="utf-8") as f:
        decisions = json.load(f)
    maps = ac.load_maps(ac.ALIAS_MAPS)
    plan = compute_plan(courses, singletons, memberships, curations, decisions, rec.load_id_reservations(), maps,
                        vacated=er.ever_minted_ids(), drawn=er.skyview_ids())
    with open(SEED, encoding="utf-8") as f:
        seed_doc = json.load(f)
    with open(SUBJ_MAP, encoding="utf-8") as f:
        map_doc = json.load(f)
    edits = seed_edits(seed_doc, map_doc, plan)
    br = blast_radius(plan["alias"], curations)
    out = os.path.join(OUT_ROOT, today)
    rp = os.path.join(out, "alias_map.json")
    os.makedirs(out, exist_ok=True)
    er.dump(os.path.join(out, "plan.json"), {**plan, "blast_radius": br, "edits": edits})
    er.dump(os.path.join(out, "held.json"), {"held": plan["held"], "flagged": plan["flagged"],
                                             "homonyms": plan["homonyms"]})
    er.dump(rp, {"_status": "Accounting re-point old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
                 "_at": today, "_scope": [SCOPE], "_count": len(plan["alias"]),
                 "_basis": "lane common-subjects-reference NEXT (1); f-csr-seeded-from-mids-left-95-mq-disciplines-uncoded-s717",
                 "aliases": {k: {"new_id": v, "route": TO, "discipline": DISC, "family": plan["moves"][k]["family"]}
                             for k, v in sorted(plan["alias"].items())}})
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(plan, br, edits, today, os.path.relpath(rp, ROOT)))
    print(f"Accounting re-point - {len(plan['alias'])} ids move, {len(plan['held'])} families held, "
          f"{len(plan['flagged'])} flagged, {len(plan['homonyms'])} homonyms")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")
    print(f"DRY RUN - wrote {os.path.relpath(out, ROOT)}/(plan.json, held.json, alias_map.json, report.md)")
    return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
