#!/usr/bin/env python3
"""ETHS re-mint: the physical-activity identities minted under Ethnic Studies (Rule 7).

Sam ruled on 2026-09-22 (open-asks card 1, cross-list item 3): re-mint the 31
ETHS-prefixed identities that are physical-activity courses, under the playbook
(docs/coursecontrolnumber_remint.md). The local code ES means Exercise Science at
Grossmont and Cuyamaca, and the June SUBJ4 fold read it as Ethnic Studies, so these
rows carry discipline "Ethnic Studies" and the ETHS prefix (ES M1004 -> ETHS M1024
on the catalog's own stamps).

SCOPE. The card counted 31 over the unified-courses rows, which hold corroborated
ids only. Re-measured on the kb files (2026-09-28) the same defect also covers
standing stand-alones and rows the title list misses, so the plan carries four
classes and `--scope` picks which move (the verdicts-as-flags pattern of
kb/_prefix_fold_dryrun.py):
  ruled       the 31: corroborated ETHS ids, not merged away, whose displayed
              title carries a word from the cross-list builder's PHYSICAL list
              (kb/_build_crosslist_decision_sheet.py) - Sam's ruling
  standalone  the same test on ETHS stand-alones                 - not ruled
  missed      ETHS rows outside that list whose members list the course under
              ES with a Physical Education TOP (0835)             - not ruled
  children    ETHS ids merged into any of the above                - not ruled
  merged_elsewhere  ETHS ids already merged into a KINE/ATHL/PEDS parent: they
              display under the right parent, and only their own id is wrong
Only `ruled` is applied until Sam rules on the rest; the report lists them.

ROUTING (the KIN/PE pass-2 rules, kb/_kin_pe_pass2.py, read under the TOP doctrine:
a title keyword routes, a TOP code only corroborates). The regexes are the pass-2
ones; that module runs its pass at import, so they are restated here.
  PEDS  Physical Education Disabled Students   an adapted title
  ATHL  Kinesiology                             an intercollegiate/season/varsity title
  KINE  Kinesiology                             everything else
The title is the catalog's common title (the members' own); a curated display
title that routes elsewhere is reported, never followed. Kinesiology is an
umbrella (KINE + ATHL), which is why the prefix fold skips these rows
(skip_umbrella_offcode) and this script routes them.

EVIDENCE (two signals, Rule 7): the physical-activity title, plus at least one of
a member subject code that names kinesiology (KIN_CODE; ES itself is the
ambiguous code and never counts), a member or catalog TOP in 0835 (Physical
Education) corroborating, or a child already merged in under KINE/ATHL/PEDS. A
row with no second signal is HELD.

ALLOCATION: keep the number when the target key is free, else gap-fill, in two
passes (kb/_authority_recode_dryrun.Allocator, the prefix fold's allocator). The
collision surface is every catalog, stand-alone and curation key that is not
moving, plus the CCN/C-ID sequence reservations.

WHAT --apply MUTATES (indent=2, ensure_ascii=False, record order kept):
  kb/coci_minted_courses.json      key + course_id + subject_4letter + discipline
                                   + the `_eths_remint_from` stamp
  kb/coci_minted_singletons.json   the same, for a stand-alone in scope
  kb/coci_minted_memberships.json  key rename
  kb/coci_articulations.json       articulations[].course_id + identities keys (a
                                   moved entry wins its key; a stale entry already
                                   on a landing key is dropped)
  kb/coci_curation.json            entry keys + merge_into pointers
Register the receipt in kb/alias_chain.py ALIAS_MAPS in the same commit, then run
kb/_post_apply_chain.py and `--rekey-skyview` (SkyView's layout is hand-built, so
its point ids follow a re-mint only through this step), then rebuild the SkyView
payloads the lints check. Supabase kb_curation is re-keyed from the committed
receipt by .github/workflows/supabase-rekey.yml, in the same cron window, before
the next cron's curation sync.

GATES (all must pass or nothing is written):
  V0  the ruled class re-measures to RULED exactly (a drifted catalog refuses)
  V1  record counts unchanged in every file
  V2  new ids unique and disjoint from every key that is not moving
  V3  every moved row lands on its route's code and discipline, and a curation
      overlay discipline, where one exists, agrees with the route
  V4  articulation re-key count equals the precount
  V5  no merge_into pointer, curation key or membership key left on a moved id
  P0  this scope not already applied (the stamp on any moved record)
  P1  --apply only: the recomputed alias map equals the reviewed receipt's
  P3  --apply only: --fresh-read (live kb_curation rows for the moved ids and the
      rows pointing at them) matches the committed overlay: every field of a
      moved id, and a pointer's merge_into

Run:
  python3 kb/_eths_remint.py                    # dry run -> kb/eths_remint_out/<date>/<scope>/
  python3 kb/_eths_remint.py --apply --receipt kb/eths_remint_out/<date>/ruled/alias_map.json \\
      --fresh-read <live.json> --ruling "Sam, 2026-09-22 (open-asks card 1): re-mint them"
"""
import argparse
import importlib.util
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _authority_recode_dryrun as rec  # noqa: E402  (Allocator, parse_id, SUBJ4_RE, load_id_reservations)

OUT_ROOT = os.environ.get("ETHS_REMINT_OUT") or os.path.join(HERE, "eths_remint_out")
KB_DIR = os.environ.get("ETHS_REMINT_KB") or HERE     # a scratch copy for a rehearsal
STAMP = "_eths_remint_from"
PREFIX = "ETHS"

# The 31 ids the card counted (measured again 2026-09-28 with the same test: 31).
RULED = (
    "ETHS M1018", "ETHS M1019", "ETHS M1022", "ETHS M1023", "ETHS M1024", "ETHS M1025",
    "ETHS M1027", "ETHS M1028", "ETHS M1130", "ETHS M1131", "ETHS M1133", "ETHS M1135",
    "ETHS M1137", "ETHS M1138", "ETHS M1153", "ETHS M1190", "ETHS M1220", "ETHS M1224",
    "ETHS M1226", "ETHS M1227", "ETHS M1232", "ETHS M1233", "ETHS M1234", "ETHS M1241",
    "ETHS M1252", "ETHS M1269", "ETHS M1270", "ETHS M1271", "ETHS M1273", "ETHS M1276",
    "ETHS M1282",
)
SCOPES = ("ruled", "standalone", "missed", "children", "merged_elsewhere")

# kb/_kin_pe_pass2.py, frozen 2026-06-12 (restated: that module runs at import).
ADAPT = re.compile(r"adapt|disab|special needs|\bDSPS\b|special olymp", re.I)
ATHL_KW = re.compile(r"intercollegiate|off.?season|in.?season|\bvarsity\b", re.I)
ROUTES = {"PEDS": "Physical Education Disabled Students", "ATHL": "Kinesiology", "KINE": "Kinesiology"}
# A member subject code that names kinesiology. ES (and ES/A, ES/I) is the
# ambiguous code this re-mint exists for, so it never counts.
KIN_CODE = re.compile(r"^(KIN|KN|KPE|KFIT|KATH|KAQUA|PE|PHE|PHED|EXS|ATH|APE|FITN|IA\b|ICA|SPORT)", re.I)
PE_TOP = "0835"


def physical_words():
    spec = importlib.util.spec_from_file_location("crosslist", os.path.join(HERE, "_build_crosslist_decision_sheet.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.PHYSICAL


def route(title):
    """-> the target code for a common title."""
    if ADAPT.search(title or ""):
        return "PEDS"
    if ATHL_KW.search(title or ""):
        return "ATHL"
    return "KINE"


def _is_es(code):
    return (code or "").upper().split("/")[0] == "ES"


def evidence(cid, rec_, members, children):
    """The second signals beside the title, as plain strings."""
    ev = []
    codes = sorted({m.get("subject") for m in members
                    if m.get("subject") and not _is_es(m["subject"]) and KIN_CODE.match(m["subject"])})
    if codes:
        ev.append("member codes " + ", ".join(codes))
    tops = sorted({str(m.get("top_code") or "")[:7] for m in members
                   if str(m.get("top_code") or "").startswith(PE_TOP)})
    ctop = str(rec_.get("top_code") or "")
    if ctop.startswith(PE_TOP) and ctop[:7] not in tops:
        tops.append(ctop[:7] + " (catalog)")
    if tops:
        ev.append("TOP " + ", ".join(tops) + " corroborating")
    kin_kids = sorted(k for k in children if k.split(" ")[0] in ROUTES)
    if kin_kids:
        ev.append("merged children " + ", ".join(kin_kids))
    return ev


def select(courses, singletons, curations, memberships, words):
    """{cid: scope} for every candidate, before evidence and routing."""
    def standing(cid):
        return not (curations.get(cid) or {}).get("merge_into")

    def display(cid, r):
        return (curations.get(cid) or {}).get("unified_title") or r.get("common_title") or ""

    def physical(t):
        t = (t or "").lower()
        return any(w in t for w in words)

    out = {}
    for cid, r in courses.items():
        if cid.split(" ")[0] != PREFIX or not standing(cid):
            continue
        if physical(display(cid, r)):
            out[cid] = "ruled"
        elif any(_is_es(m.get("subject")) and str(m.get("top_code") or "").startswith(PE_TOP)
                 for m in memberships.get(cid) or []):
            out[cid] = "missed"
    for cid, r in singletons.items():
        if cid.split(" ")[0] != PREFIX or not standing(cid):
            continue
        if physical(display(cid, r)):
            out[cid] = "standalone"
    parents = set(out)
    for cid, v in curations.items():
        if cid.split(" ")[0] != PREFIX or not isinstance(v, dict) or cid in out:
            continue
        if cid not in courses and cid not in singletons:
            continue
        target = v.get("merge_into") or ""
        if target in parents:
            out[cid] = "children"
        elif target.split(" ")[0] in ROUTES:
            out[cid] = "merged_elsewhere"
    return out


def compute_plan(courses, singletons, memberships, curations, identities, reservations, words,
                 scopes=("ruled",)):
    """Pure. The plan dict the receipts and the apply consume."""
    classes = select(courses, singletons, curations, memberships, words)
    kids = defaultdict(list)
    for k, v in curations.items():
        if isinstance(v, dict) and v.get("merge_into"):
            kids[v["merge_into"]].append(k)

    rows, held = {}, {}
    for cid, scope in sorted(classes.items()):
        r = courses.get(cid) or singletons.get(cid)
        members = memberships.get(cid) or []
        code = route(r.get("common_title"))
        disp = (curations.get(cid) or {}).get("unified_title") or ""
        row = {"old_id": cid, "scope": scope, "source": "minted" if cid in courses else "singleton",
               "title": r.get("common_title") or "", "display_title": disp or None,
               "route": code, "discipline": ROUTES[code], "evidence": evidence(cid, r, members, kids.get(cid, [])),
               "members": len(members), "children": sorted(kids.get(cid, []))}
        # A member whose own TOP names another field is a second home (M1220 is
        # also PSY 121, Psychology): a cross-list for the lane, never a route.
        other = sorted({f"{m.get('subject')} {m.get('course_number')}" for m in members
                        if m.get("subject") and not _is_es(m["subject"]) and not KIN_CODE.match(m["subject"])
                        and not str(m.get("top_code") or "").startswith(PE_TOP)})
        if other:
            row["also_listed_as"] = other
        if disp and route(disp) != code:
            row["title_conflict"] = f"the curated title routes to {route(disp)}; the members' title routes to {code}"
        overlay = (curations.get(cid) or {}).get("discipline")
        if overlay and overlay != row["discipline"]:
            row["why_held"] = f"the curation overlay says {overlay!r}, the route says {row['discipline']!r}"
        elif not row["evidence"]:
            row["why_held"] = "no second signal beside the title (Rule 7)"
        (held if row.get("why_held") else rows)[cid] = row

    moves = {k: v for k, v in rows.items() if v["scope"] in scopes}
    real = set(courses) | set(singletons) | set(curations)
    alloc = rec.Allocator(real - set(moves), reservations)
    order = sorted(moves)
    for cid in order:                                   # pass 1: keep the number
        prefix, letter, band, tail, kind = rec.parse_id(cid)
        want = f"{moves[cid]['route']} {letter}{band}{tail}"
        moves[cid]["new_id"], moves[cid]["how"] = None, None
        if alloc.free(want):
            alloc.taken.add(want)
            moves[cid]["new_id"], moves[cid]["how"] = want, "kept number"
    for cid in order:                                   # pass 2: gap-fill the rest
        if moves[cid]["new_id"]:
            continue
        moves[cid]["new_id"], moves[cid]["how"] = alloc.place(cid, moves[cid]["route"], prefer_keep=False,
                                                              reason=f"{cid} -> {moves[cid]['route']}")
    alias = {k: v["new_id"] for k, v in moves.items() if v.get("new_id")}

    ruled_now = sorted(k for k, s in classes.items() if s == "ruled")
    new_ids = list(alias.values())
    dup = sorted(k for k, n in Counter(new_ids).items() if n > 1)
    collide = sorted(set(new_ids) & (real - set(moves)))
    ghosts = sorted(set(new_ids) & (set(identities) - real))
    validation = {
        "V0_ruled_set": {"pass": ruled_now == sorted(RULED), "measured": len(ruled_now),
                         "missing": sorted(set(RULED) - set(ruled_now)), "extra": sorted(set(ruled_now) - set(RULED))},
        "V2_new_ids_unique_and_free": {"pass": not dup and not collide and len(alias) == len(moves),
                                       "duplicates": dup, "collisions": collide,
                                       "unplaced": sorted(set(moves) - set(alias))},
        "V3_codes_and_bands": {"pass": all(rec.SUBJ4_RE.match(v["route"]) and v["new_id"].startswith(v["route"] + " ")
                                           for v in moves.values() if v.get("new_id"))},
    }
    return {"scopes": list(scopes), "classes": dict(Counter(classes.values())), "moves": moves,
            "not_in_scope": {k: v for k, v in rows.items() if k not in moves}, "held": held,
            "alias": alias, "identities_ghosts_healed": ghosts, "validation": validation,
            "gapfilled": alloc.gapfilled}


def apply_plan(docs, plan):
    """Pure on in-memory docs. Returns (docs, counts); the caller writes the files."""
    alias, moves = plan["alias"], plan["moves"]

    def rk(k):
        return alias.get(k, k)

    counts = Counter()
    for name in ("courses", "singletons"):
        recs = docs[name]["courses"]
        out = {}
        for k, r in recs.items():
            if k in alias:
                r = dict(r)
                nk = alias[k]
                r["course_id"], r["subject_4letter"] = nk, nk.split(" ")[0]
                r["discipline"] = moves[k]["discipline"]
                r[STAMP] = k
                counts[name] += 1
                out[nk] = r
            else:
                out[k] = r
        docs[name]["courses"] = out
    docs["memberships"]["memberships"] = {rk(k): v for k, v in docs["memberships"]["memberships"].items()}
    for a in docs["articulations"].get("articulations", []):
        if a.get("course_id") in alias:
            a["course_id"] = alias[a["course_id"]]
            counts["articulations"] += 1
    ident = docs["articulations"].get("identities")
    if isinstance(ident, dict):
        landing = set(alias.values())
        new = {}
        for k, v in ident.items():
            if k in alias:
                new[alias[k]] = v
                counts["identities"] += 1
            elif k in landing:
                counts["identities_stale_dropped"] += 1     # a moved entry wins its key
            else:
                new[k] = v
        docs["articulations"]["identities"] = new
    cur = {}
    for k, v in docs["curation"]["curations"].items():
        if isinstance(v, dict) and v.get("merge_into") in alias:
            v = dict(v)
            v["merge_into"] = alias[v["merge_into"]]
            counts["pointers"] += 1
        if k in alias:
            counts["curation_keys"] += 1
        cur[rk(k)] = v
    docs["curation"]["curations"] = cur
    return docs, counts


def post_gates(before, after, plan, pre_art):
    alias = plan["alias"]
    old = set(alias)
    b, a = before, after
    v1 = all(len(b[n][f]) == len(a[n][f]) for n, f in
             (("courses", "courses"), ("singletons", "courses"), ("memberships", "memberships"),
              ("curation", "curations")))
    v3 = all(((a["courses"]["courses"].get(nk) or a["singletons"]["courses"].get(nk) or {}).get("discipline")
              == plan["moves"][o]["discipline"]) for o, nk in alias.items())
    left = (old & set(a["courses"]["courses"]) | old & set(a["singletons"]["courses"])
            | old & set(a["memberships"]["memberships"]) | old & set(a["curation"]["curations"])
            | {v.get("merge_into") for v in a["curation"]["curations"].values() if isinstance(v, dict)} & old)
    return {"V1_conservation": {"pass": v1},
            "V3_discipline_follows_route": {"pass": v3},
            "V4_articulations": {"pass": pre_art == sum(1 for x in a["articulations"].get("articulations", [])
                                                     if x.get("course_id") in set(alias.values())),
                                 "precount": pre_art},
            "V5_nothing_left_on_an_old_id": {"pass": not left, "left": sorted(left)[:10]}}


# ── I/O ──────────────────────────────────────────────────────────────────────
FILES = {"courses": "coci_minted_courses.json", "singletons": "coci_minted_singletons.json",
         "memberships": "coci_minted_memberships.json", "articulations": "coci_articulations.json",
         "curation": "coci_curation.json"}


def load_docs(kb_dir=None):
    kb_dir = kb_dir or KB_DIR
    docs = {}
    for name, f in FILES.items():
        with open(os.path.join(kb_dir, f), encoding="utf-8") as fh:
            docs[name] = json.load(fh)
    return docs


def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def fresh_read_check(live_rows, curations, plan):
    """P3: the live kb_curation rows rebuild the committed overlay's view of what
    this re-mint touches. A moved id moves with every field, so all of its
    fields must match exactly; a pointer at a moved id has only its merge_into
    re-keyed, so that field alone is compared (its other fields stay put)."""
    moved = set(plan["alias"])

    def norm(v):
        return v if isinstance(v, str) else json.dumps(v)

    live = defaultdict(dict)
    for r in live_rows:
        live[r["course_id"]][r["field"]] = norm(r["value"])
    want = {}
    for k, e in curations.items():
        if not isinstance(e, dict):
            continue
        if k in moved:
            want[k] = {f: norm(v) for f, v in e.items() if not f.startswith("reviewed")}
        elif e.get("merge_into") in moved:
            want[k] = {"merge_into": e["merge_into"]}
    missing = sorted(set(want) - set(live))
    extra = sorted(set(live) - set(want))
    differ = sorted(k for k in set(want) & set(live)
                    if (live[k] if k in moved else {"merge_into": live[k].get("merge_into")}) != want[k])
    return {"pass": not missing and not extra and not differ,
            "entries": len(want), "missing_live": missing[:10], "live_only": extra[:10], "differ": differ[:10]}


# SkyView's layout is hand-built (Sam, 2026-09-06: rebuild the atlas payload
# nightly, never the universe layout), so its point ids do not follow a re-mint
# on their own. This re-keys the ids in place, token for token, and leaves every
# coordinate where it is. Idempotent: a file with no old id is left untouched.
# The CER-derived payloads (ccr_cpl.json, ccr_cpl_universe*.json) are rebuilt by
# their own builders from the re-keyed kb and the nightly CER, never re-keyed here.
SKYVIEW_FILES = ("prototype/ccr_universe.json", "prototype/ccr_universe_members.json")


def rekey_skyview(alias, root=ROOT):
    """-> {file: replacements}. Exact id tokens only, never a substring."""
    if not alias:
        return {}
    pat = re.compile(r"(?<![A-Za-z0-9])(" + "|".join(re.escape(k) for k in sorted(alias, key=len, reverse=True))
                     + r")(?![A-Za-z0-9])")
    done = {}
    for rel in SKYVIEW_FILES:
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            text = f.read()
        new, n = pat.subn(lambda m: alias[m.group(1)], text)
        if n:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
        done[rel] = n
    return done


def render_report(plan, today):
    L = [f"# ETHS re-mint - dry run {today}", "",
         "Sam's ruling, 2026-09-22 (open-asks card 1): re-mint the 31 ETHS-prefixed physical-activity "
         "identities under the playbook. `--scope` for this receipt: " + ", ".join(plan["scopes"]) + ".", ""]
    L += ["## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})}`"))
    by = Counter(v["route"] for v in plan["moves"].values())
    L += ["", f"## Moves ({len(plan['moves'])}: " + ", ".join(f"{n} to {c}" for c, n in sorted(by.items())) + ")", "",
          "| Old id | New id | How | Title | Evidence beside the title |", "|---|---|---|---|---|"]
    for k, v in sorted(plan["moves"].items(), key=lambda kv: (kv[1]["route"], kv[0])):
        note = f" ⚠ {v['title_conflict']}" if v.get("title_conflict") else ""
        if v.get("also_listed_as"):
            note += " · also listed as " + ", ".join(v["also_listed_as"]) + " (a cross-list for the lane)"
        L.append(f"| {k} | {v.get('new_id')} | {v.get('how')} | {v['title']}{note} | {'; '.join(v['evidence'])} |")
    band2 = sorted(v["new_id"] for v in plan["moves"].values() if v.get("new_id")
                   and rec.parse_id(v["new_id"])[2] not in ("1", "9"))
    if band2:
        L += ["", f"**{len(band2)} new ids sit in a continuation band** ({band2[0]} to {band2[-1]}): the "
              "target bucket's band 1 is full, and minting continues into the next band digit (Sam, "
              "2026-09-03, readings card 11). The digit carries no transferability meaning."]
    if plan["held"]:
        L += ["", f"## Held ({len(plan['held'])})", ""]
        for k, v in sorted(plan["held"].items()):
            L.append(f"- {k} ({v['scope']}) {v['title']}: {v['why_held']}")
    rest = plan["not_in_scope"]
    if rest:
        per = Counter(v["scope"] for v in rest.values())
        L += ["", "## The same defect outside this receipt's scope (not ruled)", "",
              "Each class re-mints the same way once Sam rules: " +
              ", ".join(f"{per[s]} {s}" for s in SCOPES if per.get(s)) + ".", ""]
        for s in SCOPES:
            ids = sorted(k for k, v in rest.items() if v["scope"] == s)
            if ids:
                L.append(f"- **{s}** ({len(ids)}): " + ", ".join(f"{k} {rest[k]['title']}" for k in ids[:60])
                         + (" ..." if len(ids) > 60 else ""))
    L += ["", "## After the apply", "",
          "1. Register the receipt in `kb/alias_chain.py` ALIAS_MAPS in the same commit, and run "
          "`python3 kb/_post_apply_chain.py`.",
          "2. Dispatch `supabase-rekey.yml` with this receipt before the next cron's curation sync.",
          "3. Read the live kb_curation rows back: none on an old id.", ""]
    return "\n".join(L)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", default="ruled", help="comma-separated classes to move: " + ",".join(SCOPES))
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--receipt", help="the reviewed alias_map.json the apply must reproduce (P1)")
    ap.add_argument("--fresh-read", help="live kb_curation rows (JSON list of {course_id, field, value}) (P3)")
    ap.add_argument("--ruling", help="who said yes, and when (required with --apply)")
    ap.add_argument("--rekey-skyview", action="store_true",
                    help="after an apply: re-key SkyView's hand-built layout files from the APPLIED --receipt")
    args = ap.parse_args(argv)
    if args.rekey_skyview:
        if not args.receipt:
            sys.exit("--rekey-skyview needs --receipt (an applied one)")
        with open(args.receipt, encoding="utf-8") as f:
            receipt = json.load(f)
        if not receipt.get("_applied_at"):
            sys.exit("--rekey-skyview reads an APPLIED receipt; this one is a dry run")
        alias = {k: (v["new_id"] if isinstance(v, dict) else v) for k, v in receipt["aliases"].items()}
        print("SkyView layout re-keyed:", rekey_skyview(alias))
        return 0
    scopes = tuple(s.strip() for s in args.scope.split(",") if s.strip())
    if any(s not in SCOPES for s in scopes):
        sys.exit(f"--scope takes {', '.join(SCOPES)}")
    if scopes != ("ruled",) and args.apply:
        sys.exit("--apply moves the ruled class only until Sam rules on the rest")
    if args.apply and not (args.ruling and args.receipt and args.fresh_read):
        sys.exit("--apply needs --ruling, --receipt and --fresh-read")

    today = date.today().isoformat()
    docs = load_docs()
    courses, singletons = docs["courses"]["courses"], docs["singletons"]["courses"]
    curations = docs["curation"]["curations"]
    plan = compute_plan(courses, singletons, docs["memberships"]["memberships"], curations,
                        docs["articulations"].get("identities") or {}, rec.load_id_reservations(),
                        physical_words(), scopes)
    stamped = sorted(k for k, r in list(courses.items()) + list(singletons.items()) if r.get(STAMP) in plan["alias"])
    plan["validation"]["P0_not_applied"] = {"pass": not stamped, "stamped": stamped[:10]}

    print(f"ETHS re-mint - classes {plan['classes']} - moving {len(plan['moves'])} ({', '.join(scopes)}), "
          f"held {len(plan['held'])}")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")

    if not args.apply:
        out = os.path.join(OUT_ROOT, today, "+".join(scopes))   # one receipt per scope, never overwritten
        if os.path.exists(os.path.join(out, "alias_map.json")):
            with open(os.path.join(out, "alias_map.json"), encoding="utf-8") as f:
                if json.load(f).get("_applied_at"):
                    sys.exit(f"{os.path.relpath(out, ROOT)} holds an applied receipt; a dry run never overwrites it")
        os.makedirs(out, exist_ok=True)
        dump(os.path.join(out, "plan.json"), {k: v for k, v in plan.items()})
        dump(os.path.join(out, "alias_map.json"), {
            "_status": "ETHS re-mint old->new alias (receipt + rollback inverse) - DRY RUN, not applied",
            "_at": today, "_scope": list(scopes), "_count": len(plan["alias"]),
            "_ruling": "Sam, 2026-09-22 (open-asks card 1, cross-list item 3): re-mint the 31",
            "aliases": {k: {"new_id": v, "route": plan["moves"][k]["route"],
                            "discipline": plan["moves"][k]["discipline"]} for k, v in sorted(plan["alias"].items())}})
        with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
            f.write(render_report(plan, today))
        print(f"DRY RUN - wrote {os.path.relpath(out, ROOT)}/(plan.json, alias_map.json, report.md)")
        return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1

    # ── apply ──
    with open(args.receipt, encoding="utf-8") as f:
        receipt = json.load(f)
    frozen = {k: (v["new_id"] if isinstance(v, dict) else v) for k, v in receipt.get("aliases", {}).items()}
    plan["validation"]["P1_matches_receipt"] = {"pass": frozen == plan["alias"] and receipt.get("_scope") == list(scopes)}
    with open(args.fresh_read, encoding="utf-8") as f:
        plan["validation"]["P3_fresh_read"] = fresh_read_check(json.load(f), curations, plan)
    before = {n: {k: (dict(v) if isinstance(v, dict) else v) for k, v in d.items()} for n, d in docs.items()}
    pre_art = sum(1 for a in docs["articulations"].get("articulations", []) if a.get("course_id") in plan["alias"])
    docs, counts = apply_plan(docs, plan)
    plan["validation"].update(post_gates(before, docs, plan, pre_art))
    bad = [k for k, v in plan["validation"].items() if not v.get("pass")]
    for k in ("P1_matches_receipt", "P3_fresh_read", "V1_conservation", "V3_discipline_follows_route",
              "V4_articulations", "V5_nothing_left_on_an_old_id"):
        print(f"  {k}: {'ok' if plan['validation'][k].get('pass') else 'FAIL'}")
    if bad:
        sys.exit("APPLY BLOCKED - " + ", ".join(bad) + ": " +
                 json.dumps({k: plan["validation"][k] for k in bad})[:600])
    for name, f in FILES.items():
        dump(os.path.join(KB_DIR, f), docs[name])
    receipt.update({"_status": "ETHS re-mint old->new alias (receipt + rollback inverse) - APPLIED",
                    "_applied_at": today, "_applied_ruling": args.ruling, "_counts": dict(counts)})
    dump(args.receipt, receipt)
    print(f"APPLIED - {dict(counts)}. Next: register the receipt in kb/alias_chain.py ALIAS_MAPS, run "
          f"kb/_post_apply_chain.py, commit, then dispatch supabase-rekey.yml with the receipt.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
