#!/usr/bin/env python3
"""The stray-code re-mint, confidence 90 or more: a DRY RUN of retiring the M-IDs minted on stray local codes (Rule 7).

Sam ruled on 2026-11-25 (r-no-mid-on-a-stray-code-sam-2026-11-25): "i should have never minted those 88 codes and
left the courses in a holding pen." An M-ID is minted only under a common subject. The 88 stray identity codes
(kb/csr_out/latest.json `_mid_codes.strays`: 251 M-IDs) were minted on colleges' local codes where the discipline was
blank. They go back to Needs an M-ID, through a re-mint with its receipt, once their local subjects carry a common
subject. Lane: docs/reference/lanes/common-subjects-reference.md, "The stray codes and the title hunt".

SCOPE. The local subjects of kb/subject_title_hunt/20261125_stray_code_rescore.csv whose confidence is at or above
kb/_stray_code_rescore.py THRESHOLD (90 of 100; Sam, 2026-11-25: confidence is 0-100 in every Commons procedure,
r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25). The rest stay out: a person picks those (kb/subject_title_hunt/20261125_stray_codes_a_person_picks.md).

DECIDED (S733, 2026-11-25): each in-scope M-ID is RETIRED, and its courses return to Needs an M-ID under the common
subject the rescore proposes for their local subject. Why retire and not re-key:
  1. The ruling's words: the courses "go back to Needs an M-ID", the holding pen they should never have left.
  2. A re-key would keep clusters a machine drew on a code with no discipline, under a Common SUBJ number no step
     checked. Back on the pile, each course meets kb/coci_closest_mid.json (the closest M-ID already under its common
     subject) and the pile mint, the same path every other course with no M-ID takes.
  3. The List counts a course with no M-ID, C-ID or CCN as Needs an M-ID (coci_lookup.js listBuild); a retired id is
     gone from unified_courses_members.js after the next daily build, so its courses fall there with no other step.
  4. The alias chain needs nothing: a retired id has no successor, so kb/alias_chain.py `resolve` leaves a stored copy
     of it unchanged and it reads dead against the live set, which is true. The receipt is a retire list, never an
     alias map, and is not registered in ALIAS_MAPS. No slot is reused: a stray code is never minted again.

HELD, never guessed, each listed with its reason:
  - mixed scope: the M-ID's courses sit on an in-scope local subject and on one outside it;
  - a pointer crosses the line: a merge_into or honors_of between a retired id and one that stays;
  - a person's save: a kb_curation row on the id whose reviewer is a person (kb/coci_curation.json), a course
    assigned to it (CN:<control number> merge_into), or a person's course move from it (kb/status/subject_decisions.json);
  - another record keys on it: kb/promotions.json, or MAP articulations in kb/coci_articulations.json.
Stored ids in those files are resolved through kb/alias_chain.py before they are compared to the live set.

PINS. Every id the dry run retires is pinned below by id, title and target common subject(s), frozen 2026-11-25. A run
whose live set no longer matches the pins fails V0 and says which.

THE APPLY (S733, 2026-11-25; Sam saw the dry run: "merge the dry run and keep rolling"). It recomputes the plan
(apply == spec), refuses unless V0-V3 pass, the plan matches the reviewed dry-run receipt (P1), the receipt was not
applied already (P0), and the fresh read of kb_curation (P3) matches the committed overlay on every row it touches
and holds no person's row (a reviewer_email `_flags.is_person` reads as a person: anything not ending `@bot`/`.bot`).
Then, carrying out the conductor's two calls:
  - RETIRE each in-scope id whose local subjects all carry a filed common subject: its record, memberships and
    overlay rows leave kb/coci_minted_courses.json, coci_minted_singletons.json, coci_minted_memberships.json and
    kb/coci_curation.json.
  - HOLD (DECIDED_UNFILED) every id, retiring or shell, with a course on a local subject that carries only the
    rescore's proposal; a pointer between a retiring id and a held one holds the retiring side too.
  - ALIAS (DECIDED_MERGED) each merged shell to its merge target: the shell leaves the identity file, its course joins
    the target's memberships (the join the generator's C-ID holds make, excel_to_dashboard.py `CID_HOLDS`), so the
    course keeps the M-ID it is listed under today, and the map is registered in kb/alias_chain.py ALIAS_MAPS.
The receipt (`<receipt dir>/applied/`) holds every removed entry at its index, every changed entry's before-value,
each file's headers and its sha256 before and after: `--rollback` restores the files byte for byte and refuses when a
file changed since the apply. The live kb_curation rows on the retired and aliased ids are the conductor's to delete
with the SQL in the same folder (bot cohorts only, full row images to re-insert).

Run:
  python3 kb/_stray_code_remint.py              # dry run -> kb/stray_code_remint_out/<date>/ (report.md, retire.json)
  python3 kb/_stray_code_remint.py --fresh-read-sql --receipt <dir>/retire.json      # writes <dir>/fresh_read.sql
  python3 kb/_stray_code_remint.py --apply --receipt <dir>/retire.json --fresh-read <live.json>
  python3 kb/_stray_code_remint.py --supabase-plan --receipt <dir>/applied/retire_applied.json --fresh-read <live.json>
  python3 kb/_stray_code_remint.py --rollback --receipt <dir>/applied/retire_applied.json
After the apply: register <dir>/applied/alias_map.json in kb/alias_chain.py ALIAS_MAPS, run kb/_post_apply_chain.py.
"""
import argparse
import csv
import hashlib
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _eths_remint as er  # noqa: E402  (load_docs, dump: the re-mint I/O)
import _flags as F  # noqa: E402  (is_person, loadjs, course_key, final_target)
import _build_not_applicable as NA  # noqa: E402  (the List's kept-not-counted rule, rebuilt for the after count)
import alias_chain as ac  # noqa: E402  (the one chain: imported, never restated)
from curation_pointers import POINTER_FIELDS  # noqa: E402
from _apply_curation import FIELDS as OVERLAY_FIELDS  # noqa: E402  (the sync's own fields: P3 compares these)

OUT_ROOT = os.environ.get("STRAY_CODE_REMINT_OUT") or os.path.join(HERE, "stray_code_remint_out")
RESCORE = "kb/subject_title_hunt/20261125_stray_code_rescore.csv"
from _stray_code_rescore import THRESHOLD  # noqa: E402
SCOPE = "stray-codes-confidence-90"
RULING = ('Sam, 2026-11-25 (r-no-mid-on-a-stray-code-sam-2026-11-25): "i should have never minted those 88 codes and '
          'left the courses in a holding pen"; the stray codes go back to Needs an M-ID once their local subjects '
          'carry a common subject')
# The conductor's two calls on the worker's open points (S733, 2026-11-25), for the apply to carry out.
DECIDED_UNFILED = ("DECIDED (S733 conductor): an in-scope local subject that carries only the rescore's proposal, with "
                   "no common subject filed, keeps its ids held at the apply until its common subject is filed; the "
                   "ruling retires an id once its local subject carries a common subject, and a proposal is not a filing.")
DECIDED_MERGED = ("DECIDED (S733 conductor): an id held as merged into an M-ID that stays takes an alias to its merge "
                  "target at the apply (fate a, a map registered in kb/alias_chain.py ALIAS_MAPS), since its courses "
                  "already sit under a common-subject M-ID and have no Needs an M-ID to return to.")
DECIDED = ("DECIDED (S733, 2026-11-25): retire each in-scope M-ID; its courses return to Needs an M-ID under the "
           "common subject the rescore proposes for their local subject. No id is re-keyed, so the receipt is a "
           "retire list and kb/alias_chain.py ALIAS_MAPS takes no new map.")
INPUTS = {"members": "unified_courses_members.js", "coci": "coci_lookup_data.js", "scan": "kb/csr_out/latest.json",
          "not_applicable": "kb/coci_not_applicable.json", "promotions": "kb/promotions.json",
          "decisions": "kb/status/subject_decisions.json"}
COLLEGE, CTRL, SUBJ, NUM, TITLE, CID, CCN = 0, 1, 2, 3, 4, 8, 9

# BEGIN PINS: id -> (title, target common subject(s) joined by "+"), frozen 2026-11-25 from the catalog.
PINS = {
    'ARTB M10AA': ('Basic Studio Arts', 'ARTS'),
    'ARTC M10AA': ('Contemporary Illustration', 'ARTS'),
    'ARTC M10AD': ('Digital Drawing for Commercial Art', 'ARTS'),
    'ARTC M10AE': ('Dynamic Sketching', 'ARTS'),
    'ARTG M10AQ': ('Shop Practices for Art Careers and Exhibitions', 'ARTS'),
    'ARTG M10AT': ('Writing for Arts Careers', 'ARTS'),
    'ARTI M10AA': ('Concept Sketching', 'ARTS'),
    'ARTI M10AB': ('Digital 3D Design and Animation', 'ARTS'),
    'ARTI M10AC': ('Digital 3D Design and Modeling', 'ARTS'),
    'ARTI M10AD': ('Digital 3D Design and Sculpture', 'ARTS'),
    'ARTI M10AF': ('Illustration 2, Digital Techniques', 'ARTS'),
    'ARTN M1004': ('Digital Prepress', 'ARTS'),
    'ARTN M10AG': ('Comic Book Development and Structure', 'ARTS'),
    'ARTX M90AB': ('Introductory Ceramics–Older Adults', 'OLAD'),
    'BSAD M10AS': ('Principles of Organizational Communication', 'BUSI'),
    'CGRA M10AE': ('Film Theory', 'ARTS'),
    'CTVR M10AL': ('History and Appreciation of Television Broadcasting', 'FTVE'),
    'DANS M10AC': ('Barre Fitness', 'DANC'),
    'DESI M10AA': ('Art Studio Prog', 'ARTS'),
    'DGME M1001': ('Radio and Podcast Production Lab 2', 'ARTS'),
    'DGME M10AH': ('Radio and Podcast Production Lab', 'ARTS'),
    'DGME M10AI': ('Radio and Podcast Production Lab 2', 'ARTS'),
    'DSGN M10AF': ('Digital Media 1', 'ARTS'),
    'EPHO M9001': ('Fundamentals of Digital Show Presentations (Ei)', 'OLAD'),
    'EPHO M90AD': ('Fundamentals of Digital Show Presentations (Ei)', 'OLAD'),
    'EPHO M90AF': ('Intermediate Digital Show Presentations (Ei)', 'OLAD'),
    'ESTI M1001': ('Esthetics Intermediate Concepts Ll', 'COSM'),
    'ESTI M10AF': ('Esthetics Fundamentals Ll', 'COSM'),
    'ESTI M10AG': ('Esthetics Intermediate Concepts L', 'COSM'),
    'ESTI M10AH': ('Esthetics Intermediate Concepts Ll', 'COSM'),
    'ESTI M10AI': ('Esthetics Spa Workshop', 'COSM'),
    'FLTE M10AF': ('Drone Inspections', 'AVIA'),
    'FLTE M10AG': ('Experimental Offering in Flight Technology', 'AVIA'),
    'FLTE M10AH': ('First Person View (FPV)', 'AVIA'),
    'FLTE M10AX': ('Topics in Aeronautics, Flight Technology', 'AVIA'),
    'FTMA M10AD': ('Directors and Genres', 'FTVE'),
    'FTVM M10AD': ('American Independent Film', 'FTVE'),
    'FTVM M10AF': ('Beyond Hollywood: Gender, Race and Sex in Movies', 'FTVE'),
    'FTVM M10AS': ('Honors Beyond Hollywood: Gender, Race and Sex in Movies', 'FTVE'),
    'HUMN M1003': ('Honors Popular Culture & United States History', 'FTVE+HUMA'),
    'HUMN M1004': ('Popular Culture & United States History', 'FTVE+HUMA'),
    'HUMN M10AK': ('Global Cinemas', 'HUMA'),
    'IDSG M10AB': ('Color Visualization for Product Design', 'INDD'),
    'IDSG M10AE': ('Introduction to Industrial and Product Design', 'INDD'),
    'LIBS M1006': ('Library Research Methods', 'LIBR'),
    'LIBS M10AB': ('Basic Research Skills', 'LIBR'),
    'LIBS M10AE': ('Information Literacy:Search Strategies, Tools, and Resources', 'LIBR'),
    'LIBS M10AF': ('Internet Research Methods', 'LIBR'),
    'MMDI M90AA': ('Design Studio Practice', 'ARTS'),
    'NCVO M90AA': ('Advanced Tools in Photoshop', 'VOCE'),
    'NCVO M90AD': ('Building on Photoshop Basics', 'VOCE'),
    'OLDA M90AF': ('Life Drawing for Seniors', 'OLAD'),
    'OLDA M90AI': ('Seeing and Understanding Art', 'OLAD'),
    'OLDA M90AJ': ('Watercolor Painting for Seniors', 'OLAD'),
    'OLDR M9002': ('Painting in Oils and Acrylics', 'OLAD'),
    'OLDR M90AB': ('Art/Journaling', 'OLAD'),
    'OLDR M90AF': ('Digital Camera Basics Level 2', 'OLAD'),
    'OLDR M90AG': ('Expressions in Colored Pencil', 'OLAD'),
    'OLDR M90AJ': ('Int. Watercolor Painting', 'OLAD'),
    'OLDR M90AQ': ('Silk Painting', 'OLAD'),
    'OLDR M90AR': ('Sketching for Painters', 'OLAD'),
    'OLDR M90AS': ('The Joy of Drawing', 'OLAD'),
    'OLDR M90AU': ('Urban Sketching', 'OLAD'),
    'PHTG M1002': ('Commercial Lighting 1', 'PHOT'),
    'PHTG M1003': ('Commercial Lighting 2', 'PHOT'),
    'PHTG M10AA': ('Exploring Visual Expression', 'PHOT'),
    'PHTO M10AD': ('Black and White Photo Lab 1', 'PHOT'),
    'PHTO M10AG': ('Color Photo Lab 1', 'PHOT'),
    'PHTO M10AH': ('Color Photo Lab 2', 'PHOT'),
    'PHTO M10AI': ('Digital Photo Lab 1', 'PHOT'),
    'PHTO M10AJ': ('Digital Photo Lab 2', 'PHOT'),
    'PHTO M10AL': ('Individual Projects B', 'PHOT'),
    'PHTO M10AR': ('Introduction to Lighting', 'PHOT'),
    'PHTO M10AU': ('Materials and Processes Lab', 'PHOT'),
    'PHTO M10AX': ('Portraiture on Location', 'PHOT'),
    'PHTO M90AA': ('Digital Photo Editing and Post-Processing', 'PHOT'),
    'PHTO M90AB': ('Digital Photos and the Computer', 'PHOT'),
    'PHTO M90AD': ('Phonetography', 'PHOT'),
    'SGNG M10AA': ('Advance Computer & Design', 'ARTS'),
    'SGNG M10AC': ('Exterior Display Signs', 'ARTS'),
    'SGNG M10AE': ('Individual Lettering', 'ARTS'),
    'SGNG M10AF': ('Sign Design and Layout', 'ARTS'),
    'SGNG M10AG': ('Sign Installation and Fabrication', 'ARTS'),
    'SGNG M10AI': ('Silk Screen Processing 1', 'ARTS'),
    'SGNG M10AJ': ('Window Signs', 'ARTS'),
    'TAFI M1002': ('Diversity in American Film', 'FTVE'),
    'TAFI M1006': ("History of Film: 1880's Through 1950's", 'FTVE'),
    'TAFI M10AH': ('From Stage to Screen: Production Design and Art Direction', 'FTVE'),
    'VISC M10AI': ('Digital Prepress 2', 'ARTS'),
    'VISC M10AL': ('Flash Motion Graphics (Beginning Level)', 'ARTS'),
    'WORK M90AN': ('Custodian: Basic Maintenance', 'WEXP'),
    'WORK M90AO': ('Custodian Training', 'WEXP'),
}
# END PINS


# ── reads ──────────────────────────────────────────────────────────────────────
def proposal(row):
    """The common subject a row's courses go back under: the rescore's proposal, else its scored suggestion."""
    return row.get("proposed_common_subject") or row.get("suggested_common_subject") or ""


def in_scope(row, threshold=THRESHOLD):
    try:
        return int(row.get("confidence") or 0) >= threshold
    except ValueError:
        return False


def read_scope(path, threshold=THRESHOLD):
    """(college, local subject) -> its rescore row, for the rows at or above the threshold."""
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return ({(r["college"].strip(), r["local_subject"].strip()): r for r in rows if in_scope(r, threshold)},
            {(r["college"].strip(), r["local_subject"].strip()): r for r in rows})


def load_inputs(root=ROOT, kb_dir=None):
    p = lambda k: os.path.join(root, INPUTS[k])  # noqa: E731
    docs = er.load_docs(kb_dir or os.path.join(root, "kb"))
    with open(p("scan"), encoding="utf-8") as f:
        scan = json.load(f)

    def opt(k):
        return F._read(root, INPUTS[k]) or {}

    return {"docs": docs, "members": F.loadjs(p("members")), "coci": F.loadjs(p("coci")),
            "stray_codes": {s["code"] for s in scan["_mid_codes"]["strays"]},
            "not_applicable": opt("not_applicable"), "promotions": opt("promotions"), "decisions": opt("decisions")}


def current(ids_doc, stored, baseline=None):
    """A stored id resolved to today's id: the maps its document has not folded in yet, one lookup per map
    (kb/alias_chain.py). A document with no `_rekeyed_through` is synced daily from the live table, so it is in the
    current era unless told otherwise."""
    pending, _ = ac.pending_maps((ids_doc or {}).get("_rekeyed_through"), baseline or ac.ALIAS_MAPS[-1])
    if not pending:
        return stored
    return ac.resolve_id(stored, ac.load_maps(pending))


def pointer_ids(v):
    if isinstance(v, str):
        return [v] if v else []
    if isinstance(v, list):
        return [x for x in v if isinstance(x, str) and x]
    return []


# ── the plan (pure on its inputs) ─────────────────────────────────────────────
def compute_plan(inp, scope, all_rows, pins=None):
    docs = inp["docs"]
    courses, singletons = docs["courses"]["courses"], docs["singletons"]["courses"]
    memberships = docs["memberships"]["memberships"]
    curation = docs["curation"]["curations"]
    M, coci = inp["members"], inp["coci"]
    names = [str(c or "").strip() for c in M.get("colleges") or []]
    colleges = [str(c or "").strip() for c in coci.get("colleges") or []]
    by_cn = defaultdict(list)                       # control number -> [(college, local subject, course number, title)]
    for r in coci.get("rows") or []:
        by_cn[str(r[CTRL] or "")].append((colleges[r[COLLEGE]], str(r[SUBJ] or ""), str(r[NUM] or ""), r[TITLE]))
    stray_ids = sorted(k for k in list(courses) + list(singletons)
                       if not k.startswith("_") and k.split(" ")[0] in inp["stray_codes"])

    def course_rows(k):
        """The id's courses: its own minted members and its members on the List, by control number."""
        cns = set()
        for m in memberships.get(k) or []:
            cns.add(str(m.get("control_number") or ""))
        if k in singletons:
            cns.add(str(singletons[k].get("control_number") or ""))
        for m in (M.get("members") or {}).get(k) or []:
            cns.add(str(m.get("cn") or ""))
        out = []
        for cn in sorted(c for c in cns if c):
            for (college, subj, num, title) in by_cn.get(cn, []):
                out.append({"cn": cn, "college": college, "subject": subj, "number": num, "title": title})
        return out

    info, held = {}, {}
    for k in stray_ids:
        rows = course_rows(k)
        pairs = {(r["college"], r["subject"]) for r in rows}
        ins, outs = pairs & set(scope), pairs - set(scope)
        rec = courses.get(k) or singletons.get(k) or {}
        info[k] = {"title": rec.get("common_title") or "", "source": "minted" if k in courses else "singleton",
                   "courses": rows, "in_pairs": sorted(ins), "out_pairs": sorted(outs)}
        if ins and outs:
            held[k] = "mixed scope: courses on " + ", ".join("%s %s" % (c, s) for c, s in sorted(ins)) + \
                      " (in) and " + ", ".join("%s %s" % (c, s) for c, s in sorted(outs)) + " (out)"
    cand = {k for k, v in info.items() if v["in_pairs"] and not v["out_pairs"]}

    # A person's save, an assignment, a course move, a promotion or an articulation on the id holds it.
    person_on = {k for k, e in curation.items() if isinstance(e, dict) and F.is_person(e.get("reviewed_by"))}
    for k in sorted(cand):
        if k in person_on:
            held[k] = "a person's save on the id in kb_curation (kb/coci_curation.json)"
    assigned = defaultdict(list)
    for key, e in curation.items():
        if key.startswith("CN:") and isinstance(e, dict) and e.get("merge_into"):
            assigned[current(None, e["merge_into"])].append(key[3:])
    for k in sorted(cand):
        if assigned.get(k) and k not in held:
            held[k] = "a course is assigned to it (kb_curation CN: merge_into, %d course%s)" % (
                len(assigned[k]), "" if len(assigned[k]) == 1 else "s")
    moves = defaultdict(int)
    for d in (inp["decisions"].get("courses") or []):
        if d.get("from_mid"):
            moves[current(None, d["from_mid"])] += 1
    for k in sorted(cand):
        if moves.get(k) and k not in held:
            held[k] = "a person moved a course off it on the Subjects panel (kb/status/subject_decisions.json)"
    promo = inp["promotions"]
    promoted = {current(promo, x) for x in (promo.get("promotions") or {})}
    for k in sorted(cand):
        if k in promoted and k not in held:
            held[k] = "kb/promotions.json keys official-id fold evidence on it"
    arts = Counter(a.get("course_id") for a in docs["articulations"].get("articulations") or [])
    for k in sorted(cand):
        if arts.get(k) and k not in held:
            held[k] = "MAP articulations name it (%d in kb/coci_articulations.json)" % arts[k]

    # Pointers: a merge_into or honors_of between a retired id and one that stays holds the retired side, to a fixpoint.
    edges = []
    for src, e in curation.items():
        if not isinstance(e, dict) or src.startswith("CN:"):
            continue
        for f in POINTER_FIELDS:
            for t in pointer_ids(e.get(f)):
                edges.append((src, f, current(None, t)))
    retire = cand - set(held)
    changed = True
    while changed:
        changed = False
        for src, f, t in edges:
            a, b = src in retire, t in retire
            if a != b:
                k, other = (src, t) if a else (t, src)
                retire.discard(k)
                if a and f == "merge_into":
                    held[k] = "merged into %s, which stays: its courses already count there" % t
                elif a:
                    held[k] = "the honors twin of %s, which stays" % t
                else:
                    held[k] = "%s, which stays, points at it (%s)" % (other, f)
                changed = True

    # Pins: the live set must match what was frozen.
    def target(k):
        subs = sorted({proposal(scope[p]) for p in info[k]["in_pairs"]})
        return "+".join(subs)

    v0 = []
    if pins is not None:
        live = {k: (info[k]["title"], target(k)) for k in retire}
        for k in sorted(set(pins) | set(live)):
            if k not in live:
                v0.append(f"{k} is pinned and no longer retires")
            elif k not in pins:
                v0.append(f"{k} retires and is not pinned")
            elif tuple(pins[k]) != live[k]:
                v0.append(f"{k}: pinned {tuple(pins[k])}, live {live[k]}")

    plan = {"scope": SCOPE, "stray_ids": len(stray_ids), "in_scope_pairs": len(scope),
            "retire": {}, "held": {k: {"reason": held[k], "title": info[k]["title"],
                                       "in_pairs": info[k]["in_pairs"], "out_pairs": info[k]["out_pairs"]}
                                   for k in sorted(held)},
            "out_of_scope": sorted(k for k, v in info.items() if not v["in_pairs"])}
    for k in sorted(retire):
        rec = courses.get(k) or singletons.get(k)
        plan["retire"][k] = {
            "title": info[k]["title"], "target": target(k), "source": info[k]["source"],
            "courses": [dict(r, common_subject=proposal(scope[(r["college"], r["subject"])]),
                             confidence=int(scope[(r["college"], r["subject"])]["confidence"]),
                             filed=bool(scope[(r["college"], r["subject"])]["filed_common"]))
                        for r in info[k]["courses"]],
            # the receipt: everything the apply removes, so a rollback restores it byte for byte
            "record": rec, "memberships": memberships.get(k),
            "curation": {key: e for key, e in curation.items() if key == k},
            "pointers_in": sorted(src for src, f, t in edges if t == k)}
    plan["validation"] = {
        "V0_pinned_set": {"pass": pins is not None and not v0, "problems": v0[:20], "pinned": len(pins or {}),
                          "retiring": len(retire)},
        "V1_confidence_in_scope": {"pass": all(in_scope(r) for r in scope.values())},
        "V2_every_retired_id_on_a_stray_code": {"pass": all(k.split(" ")[0] in inp["stray_codes"] for k in retire)},
        "V3_no_retired_id_has_an_out_of_scope_course": {"pass": not any(info[k]["out_pairs"] for k in retire)},
    }
    return plan


# ── the List's counts, before and after (coci_lookup.js listBuild, read in Python) ─────────────────────────────
def list_counts(coci, M, na, retired=frozenset(), curation=None, stray_codes=frozenset()):
    """Needs an M-ID and On a stray identity code, as the Courses List counts them. With `retired`, the members file
    loses those ids and the kept-not-counted file is rebuilt the way the daily build rebuilds it."""
    members = {k: v for k, v in (M.get("members") or {}).items() if k not in retired}
    Mx = dict(M, members=members)
    if retired:
        cur = {k: v for k, v in (curation or {}).items() if k not in retired}
        kept_courses, kept_cards, _ = NA.build(coci, Mx, cur)
    else:
        kept_courses, kept_cards = na.get("courses") or {}, na.get("cards") or {}
    names = [str(c or "").strip() for c in Mx.get("colleges") or []]
    by_key, by_cn = defaultdict(list), defaultdict(list)
    size = {}
    for k, rows in members.items():
        size[k] = len(rows or [])
        for m in rows or []:
            if not m or not m.get("cn"):
                continue
            kk = names[m["c"]] + "|" + m["cn"]
            if k not in by_key[kk]:
                by_key[kk].append(k)
            if k not in by_cn[m["cn"]]:
                by_cn[m["cn"]].append(k)
    colleges = [str(c or "").strip() for c in coci.get("colleges") or []]
    n = Counter()
    nomid = set()
    for r in coci.get("rows") or []:
        college, ctrl = colleges[r[COLLEGE]], str(r[CTRL] or "")
        ids = sorted(by_key.get(college + "|" + ctrl) or by_cn.get(ctrl) or [], key=lambda a: (-size.get(a, 0), a))
        mid = ids[0] if ids else ""
        cid, ccn = str(r[CID] or ""), str(r[CCN] or "")
        e = kept_courses.get(college + "|" + ctrl)
        if e and not mid:
            kept = True
        else:
            c = mid and kept_cards.get(mid)
            kept = bool(c) and not c.get("person_reviewed")
        if not (mid or cid or ccn) and not kept:
            n["nomid"] += 1
            nomid.add((college, ctrl))
        if any(i.split(" ")[0] in stray_codes for i in ids):
            n["stray"] += 1
    return n, nomid


def render_report(plan, before, after, moved_rows, today, rel_out):
    R, H = plan["retire"], plan["held"]
    n_courses = len({(c["college"], c["cn"]) for v in R.values() for c in v["courses"]})
    by_subj_ids, by_subj_courses = Counter(), defaultdict(set)
    for k, v in R.items():
        by_subj_ids[v["target"]] += 1
        for c in v["courses"]:
            by_subj_courses[c["common_subject"]].add((c["college"], c["cn"]))
    L = [f"# The stray-code re-mint, confidence {THRESHOLD} or more: dry run {today}", "",
         f"The ruling: {RULING}. The re-mint runs under the playbook (docs/coursecontrolnumber_remint.md, "
         "docs/reference/mid_lifecycle.md). Nothing is applied.", "", f"**{DECIDED}**", "",
         "Why: the ruling's own words send the courses back to Needs an M-ID. A re-key would keep clusters a machine "
         "drew on a code with no discipline, under a Common SUBJ number no step checked; on the pile each course meets "
         "its closest M-ID under its common subject (kb/coci_closest_mid.json) and the pile mint. The Courses List counts "
         "a course with no M-ID, C-ID or CCN as Needs an M-ID, so a retired id's courses land there after the next daily "
         "build with no other step. A retired id has no successor: kb/alias_chain.py leaves a stored copy unchanged and "
         "it reads dead, which is true, so the receipt is a retire list (retire.json) and ALIAS_MAPS takes no map.", "",
         f"**{DECIDED_UNFILED}**", "", f"**{DECIDED_MERGED}**", "",
         "## What moves", "",
         f"Of the {plan['stray_ids']} M-IDs on the {len(set(k.split(' ')[0] for k in list(R) + list(H) + plan['out_of_scope']))} "
         f"stray codes that hold any, {len(R)} retire, {len(H)} are held, and {len(plan['out_of_scope'])} have no course "
         f"on the {plan['in_scope_pairs']} in-scope local subjects and stay for a later pass. The {len(R)} retiring "
         f"M-IDs hold {n_courses} local courses.", "",
         f"The Courses List's Needs an M-ID reads **{before['nomid']:,}** today and would read **{after['nomid']:,}** "
         f"after the apply and the next daily build ({after['nomid'] - before['nomid']:+,}). On a stray identity code "
         f"reads {before['stray']:,} courses today and {after['stray']:,} after. {moved_rows} of the retiring ids' "
         "courses keep another identity (a C-ID, a CCN, another M-ID) or are kept, not counted, so they do not join the pile.",
         "", "Measured by kb/_stray_code_remint.py from unified_courses_members.js, coci_lookup_data.js and "
         "kb/coci_not_applicable.json (rebuilt with kb/_build_not_applicable.py for the after count).", "",
         "| Common subject | M-IDs retiring | Local courses returning under it |", "|---|---|---|"]
    subs = sorted(set(by_subj_ids) | set(by_subj_courses))
    for s in subs:
        L.append(f"| {s} | {by_subj_ids.get(s, 0)} | {len(by_subj_courses.get(s, ()))} |")
    L += ["", "An M-ID counted under two subjects joined by + holds courses on two in-scope local subjects whose "
          "proposed common subjects differ; each course returns under its own, so its courses count in those rows. "
          "One course can sit in two retiring M-IDs, so a row can show fewer courses than M-IDs.", ""]
    unfiled = sorted({(c["college"], c["subject"], c["common_subject"]) for v in R.values() for c in v["courses"]
                      if not c["filed"]})
    if unfiled:
        L += [f"**{len(unfiled)} local subjects carry the rescore's proposal and no filing yet**; the ruling says the "
              "re-mint waits until local subjects carry a common subject, so the apply files these first or holds "
              "their ids: " + "; ".join(f"{c} {s} ({t})" for c, s, t in unfiled) + ".", ""]
    def kind(r):
        if r.startswith("mixed scope"):
            return "mixed scope: courses on an in-scope local subject and on one outside it"
        if r.startswith("merged into"):
            return "merged into an M-ID that stays, so its courses already have an M-ID"
        if "which stays" in r:
            return "an honors or merge pointer joins it to an M-ID that stays"
        return r.split(" (")[0]
    reasons = Counter(kind(v["reason"]) for v in H.values())
    L += [f"## Held ({len(H)})", ""] + [f"- {n}: {r}" for r, n in reasons.most_common()] + ["",
          "A merged M-ID whose target stays is a shell: the List shows its courses under the target, so retiring it "
          "would send nothing to Needs an M-ID and would drop the merge. Its fit is an alias to the target, a re-key "
          "this dry run does not make.", "",
          "| M-ID | Title | Why held |", "|---|---|---|"]
    for k, v in H.items():
        L.append(f"| {k} | {v['title']} | {v['reason']} |")
    L += ["", f"## Retiring ({len(R)})", "", "| M-ID | Title | Common subject | Courses |", "|---|---|---|---|"]
    for k, v in R.items():
        L.append(f"| {k} | {v['title']} | {v['target']} | {len(v['courses'])} |")
    L += ["", "## Validation", ""]
    for k, v in plan["validation"].items():
        L.append(f"- **{k}**: {'pass' if v.get('pass') else 'FAIL'}"
                 + ("" if v.get("pass") else f" `{json.dumps({x: y for x, y in v.items() if x != 'pass'})[:600]}`"))
    L += ["", "## The apply (not built)", "",
          "1. A fresh read of kb_curation for every retiring id and every CN: row pointing at one; any person's row "
          "found there holds its id.",
          "2. Remove the ids from kb/coci_minted_courses.json, kb/coci_minted_singletons.json and "
          "kb/coci_minted_memberships.json, and their bot-cohort kb_curation rows, with retire.json as the receipt "
          "(its records restore them).",
          "3. Dispatch the daily build: unified_courses_members.js, kb/coci_not_applicable.json and kb/csr_out/latest.json "
          "rebuild, and the courses read as Needs an M-ID.", "",
          f"Files: {rel_out}/report.md, {rel_out}/retire.json.", ""]
    return "\n".join(L)


# ── the apply ──────────────────────────────────────────────────────────────────
APPLIED = "applied"
DOC_MAPS = (("courses", "courses"), ("singletons", "courses"), ("memberships", "memberships"),
            ("curation", "curations"))
DECIDED_JOIN = ("DECIDED (S733 worker, under DECIDED_MERGED): an aliased shell leaves the identity file and its course "
                "joins its target's memberships, the join excel_to_dashboard.py makes for a C-ID hold (CID_HOLDS), so "
                "the course stays under the M-ID the List shows it under today; the shell's own bot rows go with it.")


def pointer_values(v):
    """The ids a live row's value names: a plain id, or a JSON string or list of them."""
    if isinstance(v, str):
        s = v.strip()
        if s[:1] in '["':
            try:
                return pointer_ids(json.loads(s))
            except ValueError:
                pass
        return [s] if s else []
    return pointer_ids(v)


def apply_set(plan, scope, curation):
    """(retire, alias, held): the dry run's plan narrowed by the conductor's two calls (DECIDED_UNFILED,
    DECIDED_MERGED), with the pointer fixpoint run again over what is left."""
    unfiled = {p for p, r in scope.items() if not str(r.get("filed_common") or "").strip()}
    retire, alias, held = set(), {}, {}

    def unfiled_reason(pairs):
        return ("a course on " + "; ".join("%s %s" % p for p in pairs) +
                ", which carries only the rescore's proposal (DECIDED_UNFILED)")

    for k, v in plan["retire"].items():
        bad = sorted({(c["college"], c["subject"]) for c in v["courses"]} & unfiled)
        if bad:
            held[k] = unfiled_reason(bad)
        else:
            retire.add(k)
    for k, v in plan["held"].items():
        if not v["reason"].startswith("merged into"):
            continue
        bad = sorted({tuple(p) for p in v["in_pairs"]} & unfiled)
        t = current(None, (curation.get(k) or {}).get("merge_into") or "")
        if bad:
            held[k] = unfiled_reason(bad)
        elif not t or t in plan["retire"] or plan["held"].get(t, {}).get("reason", "").startswith("merged into"):
            held[k] = "its merge target %s is not an M-ID that stays" % (t or "(none)")
        else:
            alias[k] = t
    edges = []
    for src, e in curation.items():
        if isinstance(e, dict) and not src.startswith("CN:"):
            for f in POINTER_FIELDS:
                edges.extend((src, f, current(None, t)) for t in pointer_ids(e.get(f)))
    changed = True
    while changed:
        changed = False
        for src, f, t in edges:
            if src in alias and f == "merge_into" and t == alias[src]:
                continue                                   # the shell's own merge: the alias carries it
            for k, other in ((src, t), (t, src)):
                if k in alias:
                    del alias[k]
                    held[k] = "a pointer joins it to %s (%s), so it is not a plain shell" % (other, f)
                    changed = True
                elif k in retire and other not in retire:
                    retire.discard(k)
                    held[k] = "a pointer joins it to %s (%s), which stays" % (other, f)
                    changed = True
    return retire, alias, held


def overlay_rows(curation, ids):
    """kb_curation rows as the fresh read returns them, rebuilt from the committed overlay (kb/coci_curation.json is
    synced from the live table): every row on an id in `ids`, and every pointer row naming one."""
    rows = []
    for k, e in curation.items():
        if not isinstance(e, dict):
            continue
        who = {"reviewer_email": e.get("reviewed_by"), "reviewed_at": e.get("reviewed_at")}
        if k in ids:
            rows += [dict(course_id=k, field=f, value=v, **who) for f, v in e.items()
                     if not f.startswith(("reviewed", "validated"))]
        else:
            rows += [dict(course_id=k, field=f, value=e[f], **who) for f in POINTER_FIELDS
                     if set(pointer_ids(e.get(f))) & ids]
    return rows


def read_live(path):
    """The fresh read: a JSON list of rows, or the one-value result of fresh_read.sql wrapped by the SQL runner."""
    with open(path, encoding="utf-8") as f:
        v = json.load(f)
    while True:
        if isinstance(v, dict) and len(v) == 1:
            v = next(iter(v.values()))
        elif isinstance(v, list) and len(v) == 1 and isinstance(v[0], dict) and len(v[0]) == 1:
            v = next(iter(v[0].values()))
        elif isinstance(v, str):
            v = json.loads(v)
        else:
            break
    if not isinstance(v, list) or not all(isinstance(r, dict) and "course_id" in r and "field" in r for r in v):
        raise SystemExit("--fresh-read: not a list of kb_curation rows (course_id, field, value, reviewer_email)")
    return v


def fresh_read_gate(live_rows, curation, touched):
    """P3. The live rows the apply touches (every row on a retired or aliased id, and every pointer row naming one)
    hold no person's row, and on the sync's own fields they rebuild the committed overlay (_eths_remint's check)."""
    rel = [r for r in live_rows if r.get("course_id") in touched
           or (r.get("field") in POINTER_FIELDS and set(pointer_values(r.get("value"))) & touched)]
    persons = sorted({"%s %s (%s)" % (r["course_id"], r["field"], r.get("reviewer_email")) for r in rel
                      if F.is_person(r.get("reviewer_email"))})
    synced = [r for r in rel if r.get("field") in OVERLAY_FIELDS]
    fr = er.fresh_read_check(synced, curation, {"alias": {k: k for k in touched}})
    fr.update(rows=len(rel), persons=persons[:20])
    fr["pass"] = bool(fr["pass"]) and not persons
    return fr, rel


def receipt_gate(receipt, plan):
    """P1: the plan recomputed today is the plan the reviewed dry-run receipt froze."""
    probs = []
    if receipt.get("_scope") != SCOPE:
        probs.append("scope %r is not %r" % (receipt.get("_scope"), SCOPE))
    if "DRY RUN" not in str(receipt.get("_status") or "") or receipt.get("_applied_at"):
        probs.append("the receipt is not an unapplied dry run")
    for part in ("retire", "held"):
        a, b = set(receipt.get(part) or {}), set(plan[part])
        if a != b:
            probs.append("%s differs: receipt only %s, live only %s" % (part, sorted(a - b)[:5], sorted(b - a)[:5]))
    for k, v in plan["retire"].items():
        if k in (receipt.get("retire") or {}) and receipt["retire"][k].get("record") != v["record"]:
            probs.append("%s: its record changed since the dry run" % k)
    return {"pass": not probs, "problems": probs[:20]}


def apply_docs(docs, retire, alias):
    """Pure. (new docs, rollback, counts). The rollback holds each removed entry at its index, each changed entry's
    before-value, each created key and every header, so rollback_docs rebuilds the documents exactly."""
    gone = set(retire) | set(alias)
    out = {n: dict(d) for n, d in docs.items()}
    rb = {"headers": {}, "removed": {}, "changed": {"memberships": []}, "created": {"memberships": []}}
    counts = Counter()
    for name, mk in DOC_MAPS:
        d = docs[name]
        rb["headers"][name] = {"order": list(d), "values": {k: v for k, v in d.items() if k != mk}}
        kept, removed = {}, []
        for i, (k, v) in enumerate(d[mk].items()):
            if k in gone:
                removed.append([i, k, v])
            else:
                kept[k] = v
        rb["removed"][name] = removed
        out[name][mk] = kept
        counts[name + "_removed"] = len(removed)
    singles, before_mem = docs["singletons"]["courses"], docs["memberships"]["memberships"]
    mem = out["memberships"]["memberships"]
    norm = lambda c: " ".join(str(c or "").split()).upper()  # noqa: E731
    for k in sorted(alias):
        t = alias[k]
        if k in singles:
            s = singles[k]
            joins = [{"college": s.get("college"), "control_number": s.get("control_number"), "subject": s.get("subject"),
                      "course_number": s.get("course_number"), "units": s.get("typical_units"),
                      "credit_status": s.get("credit_status"), "top_code": s.get("top_code") or ""}]
        else:
            joins = list(before_mem.get(k) or [])
        have = {norm(p.get("control_number")) for p in mem.get(t) or []}
        add = [j for j in joins if norm(j.get("control_number")) and norm(j.get("control_number")) not in have]
        if not add:
            continue
        if t in before_mem:
            if t not in {x[0] for x in rb["changed"]["memberships"]}:
                rb["changed"]["memberships"].append([t, before_mem[t]])
            mem[t] = list(mem[t]) + add
        else:
            if t not in rb["created"]["memberships"]:
                rb["created"]["memberships"].append(t)
            mem[t] = list(mem.get(t) or []) + add
        counts["memberships_joined"] += len(add)
    for name, mk in DOC_MAPS:
        if "count" in out[name]:
            out[name]["count"] = out[name]["count"] - len(rb["removed"][name]) + (
                len(rb["created"]["memberships"]) if name == "memberships" else 0)
    if "member_courses_total" in out["memberships"]:
        out["memberships"]["member_courses_total"] += counts["memberships_joined"] - sum(
            len(v or []) for _, _, v in rb["removed"]["memberships"])
    return out, rb, counts


def rollback_docs(docs, rb):
    """Pure. The documents as they stood before apply_docs."""
    out = {}
    for name, mk in DOC_MAPS:
        m = dict(docs[name][mk])
        if name == "memberships":
            for t in rb["created"]["memberships"]:
                m.pop(t, None)
            for t, before in rb["changed"]["memberships"]:
                m[t] = before
        items = list(m.items())
        for i, k, v in rb["removed"][name]:                 # ascending index: each lands where it stood
            items.insert(i, (k, v))
        h = rb["headers"][name]
        out[name] = {k: (dict(items) if k == mk else h["values"][k]) for k in h["order"]}
    return out


def apply_post_gates(before, after, retire, alias, held_ids, articulations):
    gone = set(retire) | set(alias)
    left = sorted(set().union(*(gone & set(after[n][mk]) for n, mk in DOC_MAPS)))
    ptr = sorted({t for e in after["curation"]["curations"].values() if isinstance(e, dict)
                  for f in POINTER_FIELDS for t in pointer_ids(e.get(f))} & gone)
    mem_b, mem_a = before["memberships"]["memberships"], after["memberships"]["memberships"]
    cons = all(len(after[n][mk]) == len(before[n][mk]) - len(set(before[n][mk]) & gone)
               + (len(set(mem_a) - set(mem_b)) if n == "memberships" else 0) for n, mk in DOC_MAPS)
    cat = set(after["courses"]["courses"]) | set(after["singletons"]["courses"])
    norm = lambda c: " ".join(str(c or "").split()).upper()  # noqa: E731
    sg = before["singletons"]["courses"]
    joined = all(t in cat and (k not in sg or norm(sg[k].get("control_number")) in
                               {norm(p.get("control_number")) for p in mem_a.get(t) or []})
                 for k, t in alias.items())
    targets = set(alias.values())       # a held id can be a shell's target: its memberships take the shell's course
    held_same = all(before[n][mk].get(k) == after[n][mk].get(k) for n, mk in DOC_MAPS for k in held_ids
                    if not (n == "memberships" and k in targets))
    untouched = all(after[n][mk][k] is before[n][mk][k] for n, mk in DOC_MAPS for k in after[n][mk]
                    if not (n == "memberships" and k in targets))
    arts = sorted({a.get("course_id") for a in articulations.get("articulations") or []} & gone)
    return {"G1_nothing_left_on_a_retired_or_aliased_id": {"pass": not left and not ptr, "keys": left[:10],
                                                           "pointers": ptr[:10]},
            "G2_conservation": {"pass": cons},
            "G3_each_shell_course_joins_its_target": {"pass": joined},
            "G4_held_ids_untouched": {"pass": held_same, "held": len(held_ids)},
            "G5_every_other_entry_untouched": {"pass": untouched},
            "G6_no_articulation_names_one": {"pass": not arts, "ids": arts[:10]}}


def apply_core(inp, scope, plan, receipt, live_rows):
    """Pure on its inputs. {gates, ok, retire, alias, held, docs, rollback, counts, live}; `docs` only when ok."""
    gates = {k: v for k, v in plan["validation"].items()}
    gates["P1_matches_receipt"] = receipt_gate(receipt, plan)
    cur = inp["docs"]["curation"]["curations"]
    retire, alias, held = apply_set(plan, scope, cur)
    fr, rel = fresh_read_gate(live_rows, cur, retire | set(alias))
    gates["P3_fresh_read"] = fr
    res = {"gates": gates, "retire": retire, "alias": alias, "held": held, "live": rel}
    if not all(v.get("pass") for v in gates.values()):
        return dict(res, ok=False)
    new, rb, counts = apply_docs(inp["docs"], retire, alias)
    still_held = (set(plan["held"]) - set(alias)) | set(held)
    gates.update(apply_post_gates(inp["docs"], new, retire, alias, still_held, inp["docs"]["articulations"]))
    ok = all(v.get("pass") for v in gates.values())
    return dict(res, ok=ok, docs=new if ok else None, rollback=rb, counts=counts)


def sha_file(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def write_docs(kb_dir, docs):
    """Each document through _eths_remint.dump to a temp file beside it, then into place: {file: sha256}."""
    shas = {}
    for name, _ in DOC_MAPS:
        path = os.path.join(kb_dir, er.FILES[name])
        er.dump(path + ".tmp", docs[name])
        shas[er.FILES[name]] = sha_file(path + ".tmp")
        os.replace(path + ".tmp", path)
    return shas


def sql_literal(s):
    return "'" + str(s).replace("'", "''") + "'"


def fresh_read_sql(ids):
    arr = ",\n    ".join(sql_literal(i) for i in sorted(ids))
    return ("-- Stray-code re-mint (S733), the fresh read P3 needs: every kb_curation row on an M-ID the dry run\n"
            "-- retires or holds as a merged shell, and every pointer row (merge_into, honors_of; CN: rows included)\n"
            "-- naming one. One SELECT, one JSON value; the WHERE bounds it, so no Range paging. Save the value as\n"
            "-- live.json and pass it as --fresh-read.\n"
            "with ids(id) as (select unnest(array[\n    " + arr + "\n]::text[]))\n"
            "select coalesce(json_agg(to_jsonb(k) order by k.course_id, k.field), '[]'::json) as rows\n"
            "from public.kb_curation k\n"
            "where k.course_id in (select id from ids)\n"
            "   or (k.field in ('merge_into', 'honors_of')\n"
            "       and exists (select 1 from ids\n"
            "                   where k.value::text in (ids.id, '\"' || ids.id || '\"')\n"
            "                      or k.value::text like '%\"' || ids.id || '\"%'));\n")


def supabase_plan(rows, touched, at):
    """(receipt, delete SQL, restore SQL) for the bot-cohort rows on the retired and aliased ids."""
    rows = sorted((r for r in rows if r.get("course_id") in touched), key=lambda r: (r["course_id"], r["field"]))
    n = len(rows)
    vals = ",\n    ".join("(%s, %s)" % (sql_literal(r["course_id"]), sql_literal(r["field"])) for r in rows)
    bot = ("(k.reviewer_email is null or k.reviewer_email = '' or lower(k.reviewer_email) like '%@bot' "
           "or lower(k.reviewer_email) like '%.bot')")
    head = ("-- Stray-code re-mint (S733): delete the %d bot-cohort kb_curation rows on the retired and aliased M-IDs.\n"
            "-- Run after the PR merges, before the next cron's curation sync. Before-values (full row images):\n"
            "-- kb_curation_delete.json; kb_curation_restore.sql re-inserts them. Raises, and deletes nothing, when\n"
            "-- the count is not %d (a person's row is never matched: the guard keeps bot cohorts only).\n" % (n, n))
    body = ("  delete from public.kb_curation k\n  using (values\n    " + vals + "\n  ) as d(course_id, field)\n"
            "  where k.course_id = d.course_id and k.field = d.field\n    and " + bot + ";\n"
            "  get diagnostics n = row_count;\n") if n else ""
    delete = (head + "do $$\ndeclare n int := 0;\nbegin\n" + body +
              "  if n <> %d then raise exception 'stray-code re-mint: expected %d rows, matched %%', n; end if;\n"
              "end $$;\n" % (n, n))
    images = json.dumps(rows, ensure_ascii=False)
    restore = ("-- Stray-code re-mint (S733) rollback: re-insert the %d rows kb_curation_delete.sql deleted, from their\n"
               "-- full row images. ON CONFLICT DO NOTHING: a row a person or the sync wrote since stays as written.\n"
               "insert into public.kb_curation\nselect * from jsonb_populate_recordset(null::public.kb_curation, "
               "$rows$%s$rows$::jsonb)\non conflict do nothing;\n" % (n, images))
    receipt = {"_status": "Stray-code re-mint: kb_curation rows to DELETE (the conductor runs kb_curation_delete.sql)",
               "_at": at, "_count": n, "_rollback": "kb_curation_restore.sql (INSERT the row images, ON CONFLICT DO NOTHING)",
               "rows": rows}
    return receipt, delete, restore


def applied_receipt_path(receipt_path):
    return os.path.join(os.path.dirname(os.path.abspath(receipt_path)), APPLIED, "retire_applied.json")


def is_applied(path):
    if not os.path.exists(path):
        return False
    with open(path, encoding="utf-8") as f:
        r = json.load(f)
    return bool(r.get("_applied_at")) and not r.get("_rolled_back_at")


def render_apply_report(res, plan, before, after, at, rel):
    R, A, H = sorted(res["retire"]), res["alias"], res["held"]
    L = [f"# The stray-code re-mint, confidence {THRESHOLD} or more: APPLIED {at}", "",
         f"The ruling: {RULING}. The dry run: {rel}/retire.json (reviewed; Sam: \"merge the dry run and keep "
         "rolling\").", "", f"**{DECIDED}**", "", f"**{DECIDED_UNFILED}**", "", f"**{DECIDED_MERGED}**", "",
         f"**{DECIDED_JOIN}**", "",
         f"{len(R)} M-IDs retire, {len(A)} merged shells take an alias to their merge target, and {len(H)} are held "
         f"at the apply; the dry run's other {len(set(plan['held']) - set(A) - set(H))} holds stand. "
         "The Courses List's Needs an M-ID reads "
         f"{before['nomid']:,} today and {after['nomid']:,} after the next daily build ({after['nomid'] - before['nomid']:+,}).",
         "", "## Gates", ""]
    L += [f"- {k}: {'pass' if v.get('pass') else 'FAIL'}" for k, v in res["gates"].items()]
    L += ["", f"## Retired ({len(R)})", "", "| M-ID | Title | Common subject |", "|---|---|---|"]
    L += [f"| {k} | {plan['retire'][k]['title']} | {plan['retire'][k]['target']} |" for k in R]
    L += ["", f"## Aliased to the merge target ({len(A)})", "", "| Shell | Target |", "|---|---|"]
    L += [f"| {k} | {t} |" for k, t in sorted(A.items())]
    L += ["", f"## Held at the apply ({len(H)})", "", "| M-ID | Why |", "|---|---|"]
    L += [f"| {k} | {v} |" for k, v in sorted(H.items())]
    L += ["", "## Next", "",
          "1. kb/alias_chain.py ALIAS_MAPS registers alias_map.json; kb/_post_apply_chain.py runs (both in this commit).",
          "2. The conductor runs ../fresh_read.sql, saves the value as live.json, and runs "
          f"`python3 kb/_stray_code_remint.py --supabase-plan --receipt {rel}/{APPLIED}/retire_applied.json "
          "--fresh-read live.json`; it refuses on a person's row or drift (then `--rollback`), else rewrites "
          "kb_curation_delete.json/.sql and kb_curation_restore.sql from the live row images.",
          "3. After the merge, before the next cron: kb_curation_delete.sql, then dispatch the daily build.", ""]
    return "\n".join(L)


def run_apply(args, today):
    root = args.root
    kb_dir = os.path.join(root, "kb")
    with open(args.receipt, encoding="utf-8") as f:
        receipt = json.load(f)
    ap_path = applied_receipt_path(args.receipt)
    if is_applied(ap_path):
        sys.exit(f"APPLY REFUSED - P0: {os.path.relpath(ap_path, root)} says this re-mint is applied")
    live = read_live(args.fresh_read)
    inp = load_inputs(root, kb_dir)
    scope, all_rows = read_scope(os.path.join(root, RESCORE))
    plan = compute_plan(inp, scope, all_rows, PINS)
    res = apply_core(inp, scope, plan, receipt, live)
    for k, v in res["gates"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")
    if not res["ok"]:
        bad = {k: v for k, v in res["gates"].items() if not v.get("pass")}
        sys.exit("APPLY REFUSED - " + ", ".join(bad) + ": " + json.dumps(bad, ensure_ascii=False)[:800])
    cur = inp["docs"]["curation"]["curations"]
    before, _ = list_counts(inp["coci"], inp["members"], inp["not_applicable"], stray_codes=inp["stray_codes"])
    after, _ = list_counts(inp["coci"], inp["members"], inp["not_applicable"], frozenset(res["retire"]), cur,
                           stray_codes=inp["stray_codes"])
    shas = {er.FILES[n]: {"before": sha_file(os.path.join(kb_dir, er.FILES[n]))} for n, _ in DOC_MAPS}
    for f, s in write_docs(kb_dir, res["docs"]).items():
        shas[f]["after"] = s
    out = os.path.dirname(ap_path)
    os.makedirs(out, exist_ok=True)
    rel = os.path.relpath(os.path.dirname(os.path.abspath(args.receipt)), root)
    touched = res["retire"] | set(res["alias"])
    sp, delete, restore = supabase_plan(res["live"], touched, today)
    er.dump(os.path.join(out, "kb_curation_delete.json"), sp)
    for name, text in (("kb_curation_delete.sql", delete), ("kb_curation_restore.sql", restore)):
        with open(os.path.join(out, name), "w", encoding="utf-8") as f:
            f.write(text)
    er.dump(os.path.join(out, "alias_map.json"), {
        "_status": "Stray-code re-mint: merged shells -> their merge target (alias receipt) - APPLIED",
        "_applied_at": today, "_scope": SCOPE, "_ruling": RULING, "_decided": DECIDED_MERGED, "_count": len(res["alias"]),
        "aliases": {k: {"new_id": t, "fate": "merged shell joins its merge target"} for k, t in sorted(res["alias"].items())}})
    counts = dict(res["counts"], retired=len(res["retire"]), aliased=len(res["alias"]), held_at_apply=len(res["held"]),
                  needs_mid_before=before["nomid"], needs_mid_after=after["nomid"], kb_curation_rows_to_delete=sp["_count"])
    er.dump(ap_path, {
        "_status": "Stray-code re-mint retire receipt - APPLIED (rollback: --rollback --receipt this file)",
        "_applied_at": today, "_scope": SCOPE, "_ruling": RULING,
        "_decided": [DECIDED, DECIDED_UNFILED, DECIDED_MERGED, DECIDED_JOIN],
        "_from_receipt": os.path.relpath(os.path.abspath(args.receipt), root),
        "_fresh_read": os.path.relpath(os.path.abspath(args.fresh_read), root), "_counts": counts,
        "_gates": {k: v.get("pass") for k, v in res["gates"].items()}, "sha256": shas,
        "retired": {k: {"title": plan["retire"][k]["title"], "target": plan["retire"][k]["target"],
                        "source": plan["retire"][k]["source"]} for k in sorted(res["retire"])},
        "aliased": dict(sorted(res["alias"].items())), "held_at_apply": dict(sorted(res["held"].items())),
        "rollback": res["rollback"]})
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_apply_report(res, plan, before, after, today, rel))
    print(f"APPLIED - {counts}. Wrote {os.path.relpath(out, root)}/. Next: register alias_map.json in "
          "kb/alias_chain.py ALIAS_MAPS and run kb/_post_apply_chain.py.")
    return 0


def run_supabase_plan(args, today):
    """After the apply: P3 again on the live read, then the delete and restore SQL from its full row images."""
    with open(args.receipt, encoding="utf-8") as f:
        rec = json.load(f)
    if not rec.get("_applied_at") or rec.get("_rolled_back_at"):
        sys.exit("--supabase-plan reads an APPLIED retire_applied.json")
    touched = set(rec["retired"]) | set(rec["aliased"])
    removed = {k: v for _, k, v in rec["rollback"]["removed"]["curation"]}
    fr, rel = fresh_read_gate(read_live(args.fresh_read), removed, touched)
    print(f"  P3_fresh_read: {'ok' if fr['pass'] else 'FAIL'}")
    if not fr["pass"]:
        sys.exit("SUPABASE PLAN REFUSED - " + json.dumps(fr, ensure_ascii=False)[:800] +
                 " (roll the apply back: --rollback --receipt this file)")
    out = os.path.dirname(os.path.abspath(args.receipt))
    sp, delete, restore = supabase_plan(rel, touched, today)
    er.dump(os.path.join(out, "kb_curation_delete.json"), sp)
    for name, text in (("kb_curation_delete.sql", delete), ("kb_curation_restore.sql", restore)):
        with open(os.path.join(out, name), "w", encoding="utf-8") as f:
            f.write(text)
    print(f"wrote {sp['_count']} rows to kb_curation_delete.json/.sql and kb_curation_restore.sql")
    return 0


def run_rollback(args, today):
    """Restore the four documents byte for byte from an applied receipt; refuse when one changed since the apply."""
    with open(args.receipt, encoding="utf-8") as f:
        rec = json.load(f)
    if not rec.get("_applied_at") or rec.get("_rolled_back_at"):
        sys.exit("ROLLBACK REFUSED - the receipt is not an applied, unrolled-back retire_applied.json")
    kb_dir = os.path.join(args.root, "kb")
    for name, _ in DOC_MAPS:
        f = er.FILES[name]
        if sha_file(os.path.join(kb_dir, f)) != rec["sha256"][f]["after"]:
            sys.exit(f"ROLLBACK REFUSED - kb/{f} changed since the apply; use git revert")
    docs = {}
    for name, _ in DOC_MAPS:
        with open(os.path.join(kb_dir, er.FILES[name]), encoding="utf-8") as f:
            docs[name] = json.load(f)
    restored = rollback_docs(docs, rec["rollback"])
    tmp = os.path.join(kb_dir, ".stray_rollback_check")
    for name, _ in DOC_MAPS:
        er.dump(tmp, restored[name])
        ok = sha_file(tmp) == rec["sha256"][er.FILES[name]]["before"]
        os.remove(tmp)
        if not ok:
            sys.exit(f"ROLLBACK REFUSED - kb/{er.FILES[name]} would not restore byte for byte; nothing written")
    write_docs(kb_dir, restored)
    rec["_rolled_back_at"] = today
    rec["_status"] = rec["_status"].replace("APPLIED", "ROLLED BACK")
    er.dump(args.receipt, rec)
    print("ROLLED BACK - the four documents match their pre-apply sha256. Remove the alias map from ALIAS_MAPS.")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="carry out the reviewed dry run (needs both below)")
    ap.add_argument("--receipt", help="the dry run's retire.json (apply), or applied/retire_applied.json")
    ap.add_argument("--fresh-read", help="live kb_curation rows: the JSON value fresh_read.sql returns")
    ap.add_argument("--rollback", action="store_true", help="restore the documents from an applied receipt")
    ap.add_argument("--supabase-plan", action="store_true", help="the delete and restore SQL from a live read")
    ap.add_argument("--fresh-read-sql", action="store_true", help="write fresh_read.sql beside --receipt")
    ap.add_argument("--fresh-read-from-overlay", help=argparse.SUPPRESS)
    ap.add_argument("--root", default=ROOT, help=argparse.SUPPRESS)
    ap.add_argument("--freeze", action="store_true", help=argparse.SUPPRESS)
    args = ap.parse_args(argv)
    today = date.today().isoformat()
    if args.apply or args.rollback or args.supabase_plan or args.fresh_read_sql or args.fresh_read_from_overlay:
        if not args.receipt:
            sys.exit("needs --receipt")
        if not os.path.exists(args.receipt):
            sys.exit(f"--receipt {args.receipt} does not exist")
    if args.apply:
        if not args.fresh_read:
            sys.exit("--apply needs --receipt and --fresh-read")
        if not os.path.exists(args.fresh_read):
            sys.exit(f"--fresh-read {args.fresh_read} does not exist")
        return run_apply(args, today)
    if args.rollback:
        return run_rollback(args, today)
    if args.supabase_plan:
        if not (args.fresh_read and os.path.exists(args.fresh_read)):
            sys.exit("--supabase-plan needs --fresh-read")
        return run_supabase_plan(args, today)
    if args.fresh_read_sql or args.fresh_read_from_overlay:
        with open(args.receipt, encoding="utf-8") as f:
            rec = json.load(f)
        ids = set(rec["retire"]) | {k for k, v in rec["held"].items() if v["reason"].startswith("merged into")}
        if args.fresh_read_sql:
            path = os.path.join(os.path.dirname(os.path.abspath(args.receipt)), "fresh_read.sql")
            with open(path, "w", encoding="utf-8") as f:
                f.write(fresh_read_sql(ids))
            print(f"wrote {os.path.relpath(path, args.root)} ({len(ids)} ids)")
        if args.fresh_read_from_overlay:
            cur = er.load_docs(os.path.join(args.root, "kb"))["curation"]["curations"]
            er.dump(args.fresh_read_from_overlay, overlay_rows(cur, ids))
            print(f"wrote {args.fresh_read_from_overlay} from kb/coci_curation.json")
        return 0
    out_dir = os.path.join(OUT_ROOT, today)
    if is_applied(os.path.join(out_dir, APPLIED, "retire_applied.json")):
        sys.exit(f"{out_dir} holds an applied receipt; a dry run never overwrites it")
    inp = load_inputs(args.root)
    scope, all_rows = read_scope(os.path.join(args.root, RESCORE))
    plan = compute_plan(inp, scope, all_rows, None if args.freeze else PINS)
    if args.freeze:
        for k, v in plan["retire"].items():
            print(f"    {k!r}: ({v['title']!r}, {v['target']!r}),")
        return 0
    cur = inp["docs"]["curation"]["curations"]
    before, before_set = list_counts(inp["coci"], inp["members"], inp["not_applicable"], stray_codes=inp["stray_codes"])
    after, after_set = list_counts(inp["coci"], inp["members"], inp["not_applicable"], frozenset(plan["retire"]), cur,
                                   stray_codes=inp["stray_codes"])
    retiring_courses = {(c["college"], c["cn"]) for v in plan["retire"].values() for c in v["courses"]}
    joined = retiring_courses & (after_set - before_set)
    plan["counts"] = {"needs_mid_before": before["nomid"], "needs_mid_after": after["nomid"],
                      "stray_courses_before": before["stray"], "stray_courses_after": after["stray"],
                      "retiring_courses": len(retiring_courses), "join_the_pile": len(joined),
                      "joined_from_elsewhere": len((after_set - before_set) - retiring_courses)}
    out = os.path.join(OUT_ROOT, today)
    os.makedirs(out, exist_ok=True)
    rel_out = os.path.relpath(out, args.root) if out.startswith(args.root) else out
    er.dump(os.path.join(out, "retire.json"), {
        "_status": "Stray-code re-mint retire list (receipt + rollback: each record restores its id) - DRY RUN, not applied",
        "_at": today, "_scope": SCOPE, "_ruling": RULING, "_decided": DECIDED, "_counts": plan["counts"],
        "_validation": plan["validation"], "retire": plan["retire"], "held": plan["held"]})
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(plan, before, after, len(retiring_courses) - len(joined), today, rel_out))
    print(f"Stray-code re-mint DRY RUN - {len(plan['retire'])} retire, {len(plan['held'])} held; Needs an M-ID "
          f"{before['nomid']} -> {after['nomid']}; wrote {rel_out}/(report.md, retire.json)")
    for k, v in plan["validation"].items():
        print(f"  {k}: {'ok' if v.get('pass') else 'FAIL'}")
    return 0 if all(v.get("pass") for v in plan["validation"].values()) else 1


if __name__ == "__main__":
    sys.exit(main())
