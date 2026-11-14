#!/usr/bin/env python3
"""The Honors pairs: a DRY RUN of the `honors_of` rows and the base-plus-H mints (S653). It writes a plan and nothing
else: no kb file outside its own out dir, no generated file, no Supabase row, no `.apply` line.

THE RULINGS (Sam): an Honors course gets its own M-ID with a declared equivalence to its base (Sheet 191 card 1,
`sam-honors-own-mid-2026-11-13`); "Base number plus H (MATH M1036H)", "Two-way: either satisfies the other",
"Build the field first, then the rows", "Rows for all 508 pairs" (Sheet 197 card 3, 14:37Z 2026-11-14,
`sam-sheet-197-answers-2026-11-14`); "CCN structures should be our gold standard"
(`sam-ccn-structures-gold-standard-2026-11-14`); C-ID records stay as the official body numbers them (Sheet 195).
Design and the step order: docs/reference/honors_of_design.md.

WHAT IT DOES.
  1. Reproduces the pair count with the code that found it: `measure_honors` in kb/_reclustering_s648_dryrun.py
     (imported, never copied), on the committed members file.
  2. Simulates the generator (export_unified_courses through its UC_KB_DIR / UC_OUT_DIR seam) twice on today's kb:
     (live) the overlay as it stands live since #3304's delete (the two automerge-v1@bot rows folding HUMA M10ME and
     LIBR M10CJ removed; the committed overlay was synced at 13:44Z, before the 15:07Z delete), and (field) the
     committed overlay with the two rows still in it plus an honors_of on each Honors record. The field must hold
     each pair apart the way the delete did: the two runs' members files must agree, and every other difference is
     listed.
  3. Re-measures the pairs on the live-equivalent members file and plans each: the honors_of row, the proposed H id,
     member counts by named measure, and every collision or hold.

THE MEASURES, NAMED (COBIx's review of #3304, item 3). "local courses" = rows in unified_courses_members.js under the
id (HUMA M1110 63 to 62 in S652's simulation); "folded identities" = the `members` field of the id's row in
unified_courses_data.js or unified_courses_standalone.js (HUMA M1110 11 to 10).

Run (from repo root):
  python3 kb/_honors_of_s653_dryrun.py --tmp <empty scratch dir>   # writes kb/honors_of_s653_out/<date>/
  python3 kb/_honors_of_s653_dryrun.py --sql-only                   # drafts step 2's SQL from that plan.json
"""
import argparse
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import honors_of as ho  # noqa: E402
import _reclustering_s648_dryrun as s648  # noqa: E402
import _mid_outcomes_compare as cmp  # noqa: E402
import alias_chain  # noqa: E402

COHORT = "honors-s653@bot"          # step 1: the first two honors_of rows (2026-11-14_s653_honors_of_field.sql)
COHORT_ROWS = "honors-rows-s653@bot"  # step 2: its own cohort, so each rollback keys on cohort and field alone
ho_LEDGER = ("reviewed_by", "reviewed_at", "validated_at", "validated_by")
# The two rows #3304 deleted live (receipt kb/receipts/migration_s652_honors_two_row_delete_43607926526.json).
S652_DELETED = [
    {"course_id": "HUMA M10ME", "field": "merge_into", "value": "HUMA M1110", "reviewer_email": "automerge-v1@bot"},
    {"course_id": "LIBR M10CJ", "field": "merge_into", "value": "LIBR M1040", "reviewer_email": "automerge-v1@bot"},
]
# Decided and not yet done: its own step, after the field (d-huma-m10oi-into-m1110-s652).
DECIDED_MERGES = {"HUMA M10OI": "HUMA M1110"}
FILES = ("unified_courses_index.js", "unified_courses_data.js", "unified_courses_standalone.js",
         "unified_courses_members.js", "unified_courses_details.js", "unified_courses_member_desc.js",
         "unified_courses_suggestions.js")
_EXPORT = ("import sys, os; sys.path.insert(0, {root!r}); os.chdir({root!r}); "
           "import excel_to_dashboard as e; e.export_unified_courses()")


def jload(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def js_payload(path):
    s = open(path, encoding="utf-8").read()
    i = s.index("=", s.index("window.")) + 1
    while s[i].isspace():
        i += 1
    return json.JSONDecoder().raw_decode(s, i)[0]


# ── 2. The two simulations ──────────────────────────────────────────────────────────────────────────────────────

def overlay_live(doc):
    """The overlay as kb/_apply_curation.py writes it after #3304's delete: each leaf entry held only the merge."""
    cur = doc["curations"]
    for r in S652_DELETED:
        e = cur.get(r["course_id"]) or {}
        if (e.get(r["field"]), e.get("reviewed_by")) != (r["value"], r["reviewer_email"]):
            raise SystemExit(f"ABORT: the overlay's {r['course_id']} entry is not the deleted row: {e}")
        if {k for k in e if k not in (r["field"], "reviewed_by", "reviewed_at")}:
            raise SystemExit(f"ABORT: {r['course_id']} carries other fields")
        del cur[r["course_id"]]
    doc["count"] = len(cur)
    return doc


def overlay_field(doc):
    """The committed overlay with the two bot merges still in it, plus honors_of on each Honors record."""
    cur = doc["curations"]
    for r in S652_DELETED:
        cur[r["course_id"]]["honors_of"] = r["value"]
    return doc


def run_exports(tmp):
    committed = jload(os.path.join(HERE, "coci_curation.json"))
    runs = {"live": overlay_live(json.loads(json.dumps(committed))),
            "field": overlay_field(json.loads(json.dumps(committed)))}
    procs, outs = [], {}
    for name, doc in runs.items():
        farm, out = os.path.join(tmp, "kb_" + name), os.path.join(tmp, "out_" + name)
        for d in (farm, out):
            if os.path.exists(d):
                raise SystemExit(f"ABORT: {d} exists; pass an empty --tmp")
            os.makedirs(d)
        for n in os.listdir(HERE):
            if n != "coci_curation.json":
                os.symlink(os.path.join(HERE, n), os.path.join(farm, n))
        with open(os.path.join(farm, "coci_curation.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, ensure_ascii=False)
        env = dict(os.environ, UC_KB_DIR=farm, UC_OUT_DIR=out)
        procs.append(subprocess.Popen([sys.executable, "-B", "-c", _EXPORT.format(root=ROOT)], env=env,
                                      stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True))
        outs[name] = out
    for p in procs:
        _, err = p.communicate()
        if p.returncode:
            raise SystemExit("export failed: " + (err or "")[-400:])
    return outs


def keyed(d):
    if isinstance(d, list):
        return {r[0]: r for r in d}
    out = {}
    for k, v in d.items():
        if k == "generated_at":
            continue
        if isinstance(v, list) and v and isinstance(v[0], dict) and "id" in v[0]:
            for r in v:
                out[f"{k}/{r['id']}"] = r
        elif isinstance(v, dict) and k in ("members", "desc"):
            for kk, vv in v.items():
                out[f"{k}/{kk}"] = vv
        else:
            out[k] = v
    return out


def compare_runs(outs):
    res = {"what": "simulated, not applied: export_unified_courses() on kb/ with two overlays, in one session. "
                   "live = the overlay since #3304's delete; field = the two bot merges kept, honors_of added.",
           "files": {}}
    for name in FILES:
        a = keyed(js_payload(os.path.join(outs["live"], name)))
        b = keyed(js_payload(os.path.join(outs["field"], name)))
        changed = sorted(k for k in set(a) | set(b) if a.get(k) != b.get(k))
        detail = {}
        for k in changed[:6]:
            va, vb = a.get(k), b.get(k)
            if isinstance(va, dict) and isinstance(vb, dict):   # a map or a row: only the keys that differ
                detail[k] = {kk: {"live": va.get(kk), "field": vb.get(kk)} for kk in sorted(set(va) | set(vb))
                             if va.get(kk) != vb.get(kk)}
            else:
                detail[k] = {"live": va, "field": vb}
        res["files"][name] = {"keys_live": len(a), "keys_field": len(b), "differ": changed, "detail": detail}
    return res


# ── 3. The plan ─────────────────────────────────────────────────────────────────────────────────────────────────

class Shim:
    """What measure_honors reads from kb/_reclustering_s648_dryrun.World, without the COCI workbook."""

    def __init__(self, members_dir):
        self.members, self.generated_at = cmp.load_members(members_dir)
        self.cat = jload(os.path.join(HERE, "coci_minted_courses.json"))["courses"]
        self.sg = jload(os.path.join(HERE, "coci_minted_singletons.json"))["courses"]
        self.cur = jload(os.path.join(HERE, "coci_curation.json"))["curations"]
        districts, _ = cmp.load_districts(ROOT)
        self.voice = cmp.voice_of(districts)

    def id_system(self, i):
        return s648.World.id_system(self, i)

    def discipline(self, i):
        return s648.World.discipline(self, i)

    def provenance(self, identity, college, code):
        return {"sits_by": "not read by this plan"}


def pairs_of(rows):
    return Counter((r["identity"], r["base_identity"]) for r in rows
                   if r.get("base_identity") and r["base_identity"] != r["identity"])


def folded_identities(out_dir):
    out = {}
    for name in ("unified_courses_data.js", "unified_courses_standalone.js"):
        for r in js_payload(os.path.join(out_dir, name)).get("rows") or []:
            out.setdefault(r["id"], r.get("members"))
    return out


def merge_path(merge_into, i):
    """i and every id its merge_into chain passes through, in order (a cycle stops the walk)."""
    path, seen = [i], {i}
    while path[-1] in merge_into and merge_into[path[-1]] not in seen:
        path.append(merge_into[path[-1]])
        seen.add(path[-1])
    return path


def joining_edges(merge_into, h, b):
    """The merge edges that put h and b under one id: each side's edges up to the first id both paths reach. None when
    the two stay apart. An edge is the id that carries the merge_into row."""
    ph, pb = merge_path(merge_into, h), merge_path(merge_into, b)
    meet = [i for i in ph if i in set(pb)]
    if not meet:
        return None
    m = meet[0]
    return ph[:ph.index(m)] + pb[:pb.index(m)]


def honors_titles(w, i):
    return sorted({s648.strip_honors(m["title"]) for m in (w.members.get(i) or [])
                   if s648.is_honors(m["title"], m["code"])[0] == "honors"} - {""})


# Words that name no course of their own: a fold check reads past them ("Introduction to Astronomy Laboratory" is
# "Astronomy Laboratory").
FOLD_FILLER = {"introduction", "intro", "introductory", "principles", "fundamentals"}


def _fold_words(title):
    t = re.split(r"\bformerly\b", title or "", maxsplit=1)[0]
    return {w for w in t.split() if len(w) > 1 and w not in s648.STOP and w not in FOLD_FILLER
            and not (re.search(r"\d", w) and re.search(r"[a-z]", w))}   # a course code (240h) is not a word


def same_course(titles_a, titles_b):
    """The two ids' Honors titles name one course: every word of each title, past fillers, is in a title of the other
    id, spelled out or abbreviated. A shared stem is not enough: "Survey of Music History and Literature, Greek
    Antiquity to 1750" and "... 1750 to the Present" share five words and are parts I and II (#3315's review, item 9)."""
    def agree(x, y):
        wx, wy = _fold_words(x), _fold_words(y)
        return bool(wx) and bool(wy) and all(any(s648._abbreviates(a, b) for b in wy) for a in wx) \
            and all(any(s648._abbreviates(b, a) for a in wx) for b in wy)
    return bool(titles_a) and bool(titles_b) and all(any(agree(a, b) for b in titles_b) for a in titles_a) \
        and all(any(agree(a, b) for a in titles_a) for b in titles_b)


def plan_pairs(w, rows, out_dir, live_cur):
    pairs = pairs_of(rows)
    folded = folded_identities(out_dir)
    index = set(cmp.load_index(out_dir))
    live_ids = index | set(w.members) | set(w.cat) | set(w.sg)
    honors_rows = defaultdict(list)
    for r in rows:
        if r.get("base_identity") and r["base_identity"] != r["identity"]:
            honors_rows[(r["identity"], r["base_identity"])].append(r)
    bases_of = defaultdict(set)
    for (h, b) in pairs:
        bases_of[h].add(b)
    # A base whose courses already pair with a CCN Honors record (ASTR C1001H beside ASTR M1012): CCN holds that
    # Honors course, so an M-ID Honors pair on the same base waits for it (the #3313 review's addition).
    ccn_h_partner = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h) == "CCN-ID" and h.endswith("H"):
            ccn_h_partner[b].add(h)
    # The Honors M-IDs whose courses name this base and no other share the base's one H id (decision 3). The first
    # (most local courses, then id) takes it by a one-to-one alias map at the mint; each other one keeps its own
    # honors_of row under its own id and folds by a merge into the minted H id, its own change after the mint. So the
    # mint never moves two ids onto one key, and no (course_id, field) slot is ever written twice (#3315's review,
    # item 5).
    honors_of_base = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h).startswith("M-ID") and len(bases_of[h]) == 1:
            honors_of_base[b].add(h)

    def h_order(b):
        return sorted(honors_of_base[b], key=lambda i: (-len(w.members.get(i) or []), i))
    promotions = jload(os.path.join(HERE, "promotions.json"))["promotions"]
    merge_into = {k: v["merge_into"] for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_into")}
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    pmaps = alias_chain.load_maps(pending)

    def system(i):
        s = w.id_system(i)
        return "M-ID" if s.startswith("M-ID") else s

    def composition(i):
        ms = w.members.get(i) or []
        kinds = Counter(s648.is_honors(m["title"], m["code"])[0] for m in ms)
        return {"local_courses": len(ms), "honors_courses": kinds.get("honors", 0),
                "program_courses": kinds.get("program", 0),
                "colleges": len({m["college"] for m in ms})}

    def person(i):
        e = live_cur.get(i) or {}
        rb = e.get("reviewed_by")
        return rb if rb and not ho.is_bot(rb) else None

    out = []
    for (h, b), n in sorted(pairs.items()):
        hs, bs = system(h), system(b)
        hc, bc = composition(h), composition(b)
        pure = hc["local_courses"] > 0 and hc["honors_courses"] + hc["program_courses"] == hc["local_courses"]
        rec = {"honors_id": h, "base_id": b, "honors_system": hs, "base_system": bs,
               "course_pairs": n,
               "courses": [[r["college"], r["code"], r["base_code"]] for r in honors_rows[(h, b)]][:4],
               "honors": {"local_courses": hc["local_courses"], "honors_courses": hc["honors_courses"],
                          "colleges": hc["colleges"], "folded_identities": folded.get(h)},
               "base": {"local_courses": bc["local_courses"], "colleges": bc["colleges"],
                        "folded_identities": folded.get(b)},
               "proposed_h_id": ho.honors_id_for(b) if bs == "M-ID" else None,
               "holds": [], "notes": []}
        if alias_chain.resolve_id(h, pmaps) != h or alias_chain.resolve_id(b, pmaps) != b:
            rec["holds"].append("an id moves under a pending alias map")
        if hs != "M-ID":
            rec["action"] = "none: the Honors side is a " + hs + " record, which stays as its body numbers it"
            if hs == "CCN-ID" and h.endswith("H") and h[:-1] == b:
                rec["notes"].append("CCN already holds this pair as base and H record")
            out.append(rec)
            continue
        # Item 5: a row's key and value are live ids today; the migration repeats the test against its named set.
        for i in (h, b):
            if i not in live_ids:
                raise SystemExit(f"ABORT: {i} (pair {h} with {b}) is not in the live id set")
        if not pure:
            rec["holds"].append(f"the Honors course shares its M-ID with {hc['local_courses'] - hc['honors_courses'] - hc['program_courses']} "
                                "non-Honors course(s): a split comes before any row")
        if len(bases_of[h]) > 1:
            rec["holds"].append(f"the Honors M-ID's courses name {len(bases_of[h])} base identities: "
                                + ", ".join(sorted(bases_of[h])))
        if ccn_h_partner.get(b):
            rec["holds"].append(f"the CCN Honors record {', '.join(sorted(ccn_h_partner[b]))} already pairs with a "
                                f"course in {b}: this M-ID's Honors courses belong beside it")
        if bs == "M-ID":
            hid = rec["proposed_h_id"]
            if hid in live_ids and hid != h:
                rec["holds"].append(f"the proposed id {hid} already exists")
            if len(honors_of_base[b]) > 1 and h in honors_of_base[b] and h_order(b)[0] != h:
                lead = h_order(b)[0]
                rec["fold_into"] = hid
                rec["fold_lead"] = lead
                mine, theirs = honors_titles(w, h), honors_titles(w, lead)
                rec["fold_titles"] = {"this": mine, "lead": theirs}
                if not same_course(mine, theirs):
                    rec["holds"].append(f"the fold would join distinct Honors courses: {lead} takes {hid}, and this "
                                        "id's Honors titles name another course in a base that lumps several")
                else:
                    rec["notes"].append(f"the base has {len(honors_of_base[b])} single-base Honors M-IDs "
                                        f"({', '.join(h_order(b))}): {lead} takes {hid} at the mint; this one keeps "
                                        "its own honors_of row and merges into the H id after the mint, its own change")
        elif bs == "CCN-ID":
            if b + "H" in live_ids:
                rec["holds"].append(f"the CCN record {b}H already holds Honors courses beside {b}: this M-ID's "
                                    "courses belong beside it, a fold and not a row")
            else:
                rec["notes"].append("the base is a CCN record: honors_of names it; no H id is minted (CCN numbers its own)")
        else:
            rec["notes"].append("the base is a C-ID record: honors_of names it; no H id (C-ID has no H ids)")
        for i, side in ((b, "base"), (h, "Honors id")):
            if i in merge_into:
                rec["holds"].append(f"the {side} {i} is slated to merge into {merge_into[i]}")
            if i in DECIDED_MERGES:
                rec["holds"].append(f"the {side} {i} is DECIDED to merge into {DECIDED_MERGES[i]}")
        # Item 1: a person's saved row holds the pair only where the pair's honors_of would contradict it: a person's
        # merge that puts the Honors id and its base under one id. A person's merge of a third course into either
        # side, a title, a discipline or a Keep as-is agrees with the pair standing apart.
        edges = joining_edges(merge_into, h, b)
        if edges:
            by = sorted({live_cur[e].get("reviewed_by") or "?" for e in edges})
            if any(not ho.is_bot(x) for x in by):
                rec["holds"].append("a person's merge joins the Honors id and its base: Rule 10, the person's row wins")
            else:
                rec["holds"].append("a bot's merge joins the Honors id and its base")
        if (live_cur.get(h) or {}).get("honors_of"):
            rec["holds"].append(f"the Honors id already carries honors_of {live_cur[h]['honors_of']}")
        for i, side in ((h, "Honors id"), (b, "base")):
            p = person(i)
            if p:
                fields = sorted(k for k in (live_cur.get(i) or {}) if k not in ho_LEDGER)
                rec["notes"].append(f"a person saved {', '.join(fields)} on the {side}: the row overrides nothing"
                                    + (" and the mint carries it to the H id" if side == "Honors id" else ""))
        pm = sorted(k for k, v in merge_into.items() if v in (h, b) and person(k))
        if pm:
            rec["notes"].append(f"a person merged other courses into the pair's ids, and none joins the pair: {len(pm)}")
            rec["person_merges_in"] = pm
        if len(bases_of[h]) > 1:
            share = Counter({bb: pairs[(h, bb)] for bb in bases_of[h]})
            top, n_top = share.most_common(1)[0]
            rec["modal_base"] = {"id": top, "course_pairs": n_top, "of": sum(share.values())}
        tg = ((promotions.get(h) or {}).get("official_targets") or {})
        if any(t.split(":", 1)[-1] == b for t in tg):
            rec["notes"].append("kb/promotions.json names the base among the Honors id's official targets: held, then "
                                "released by the generator's Phase B guard (#3313, decision 4)")
        if rec["holds"]:
            rec["action"] = "held"
        elif bs == "M-ID" and rec.get("fold_into"):
            rec["action"] = "row, fold after the mint"
        elif bs == "M-ID":
            rec["action"] = "row and mint"
        else:
            rec["action"] = "row only (official base)"
        out.append(rec)
    mints = Counter(p["proposed_h_id"] for p in out if p["action"] == "row and mint")
    dup = [k for k, v in mints.items() if v > 1]
    if dup:
        raise SystemExit(f"ABORT: two mints name one H id: {dup}")
    return out


def hold_class(hold):
    return re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", hold).split(":")[0].split(" (")[0]


def summarize(plan, live_cur=None):
    s = {"pairs": len(plan), "by_action": dict(Counter(p["action"].split(":")[0] for p in plan).most_common()),
         "by_systems": dict(Counter(f"{p['honors_system']} Honors, {p['base_system']} base" for p in plan).most_common()),
         "holds_by_reason": {}}
    reasons = Counter()
    for p in plan:
        for h in p["holds"]:
            reasons[hold_class(h)] += 1
    s["holds_by_reason"] = dict(reasons.most_common())
    s["held_pairs_by_first_reason"] = dict(Counter(hold_class(p["holds"][0]) for p in plan if p["holds"]).most_common())
    s["notes_by_reason"] = dict(Counter(re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", n).split(":")[0]
                                        for p in plan for n in p["notes"]).most_common())
    s["pairs_held"] = sum(1 for p in plan if p["holds"])
    s["rows_to_write"] = sum(1 for p in plan if p["action"].startswith("row"))
    s["mints"] = sum(1 for p in plan if p["action"] == "row and mint")
    s["folds_after_the_mint"] = sum(1 for p in plan if p["action"] == "row, fold after the mint")
    named = {i for p in plan if p["action"].startswith("row") for i in (p["honors_id"], p["base_id"])}
    if live_cur is not None:
        pm = [k for k, v in live_cur.items() if v.get("merge_into") in named and v.get("reviewed_by")
              and not ho.is_bot(v["reviewed_by"])]
        s["person_merges_into_a_planned_id"] = {
            "measure": "overlay entries (kb/coci_curation.json, the live-equivalent fold) whose merge_into names an id "
                       "of a planned row and whose reviewed_by is not a bot",
            "rows": len(pm),
            "joining_a_planned_pair": sum(1 for p in plan if any("a person's merge joins" in h for h in p["holds"])),
        }
    return s


def write_md(doc, path):
    s, c, rep = doc["summary"], doc["simulation"], doc["reproduction"]
    L = ["# The Honors pairs: `honors_of` rows and base-plus-H mints, dry run (S653)", "",
         f"Written by `kb/_honors_of_s653_dryrun.py` at {doc['written']}. Nothing was applied. Design: "
         "`docs/reference/honors_of_design.md`. Every pair, with its counts and holds, is in `plan.json` beside this file.", "",
         "## The count, reproduced", "",
         f"`measure_honors` (kb/_reclustering_s648_dryrun.py), on the committed members file (generated "
         f"{rep['committed']['members_generated_at']}): **{rep['committed']['pairs']} pairs** "
         f"({rep['committed']['course_rows']} Honors courses apart from their base). On the live-equivalent fold "
         f"(the overlay without the two rows #3304 deleted): **{rep['live']['pairs']} pairs**; the difference is "
         + (", ".join(f"`{a}` with `{b}`" for a, b in rep["live_only"]) or "none")
         + (" (gone: " + ", ".join(f"`{a}` with `{b}`" for a, b in rep["committed_only"]) + ")" if rep["committed_only"] else "")
         + ".", "",
         "## The field holds the pair apart, simulated", "",
         "Two exports of today's kb: *live* (the overlay as it stands since #3304's delete) and *field* (the two "
         "`automerge-v1@bot` merges kept, `honors_of` added on HUMA M10ME and LIBR M10CJ). Differences by file:", ""]
    for f, v in c["files"].items():
        L.append(f"- `{f}`: {v['keys_live']:,} keys live, {v['keys_field']:,} with the field; "
                 f"{len(v['differ'])} differ" + (": " + ", ".join(f"`{k}`" for k in v["differ"][:6]) if v["differ"] else "") + ".")
    rc = doc.get("recall") or {}
    if rc:
        L += ["", "## The matcher's recall", "",
              f"`kb/_honors_matcher_recall.py` derives the pairs a second way and sets them against `measure_honors`, "
              f"on the live-equivalent members file ({rc['measure']}): right {rc['right']}, wrong {rc['wrong']}, "
              f"missed {rc['missed']} of {rc['code_path_m_id_pairs']} code-path pairs with an M-ID Honors side. "
              f"Before this branch's fix, on the committed members file: 508 pairs, right 507, wrong 1, missed 14. "
              "Labeled and held out: " + ("; ".join(f"`{a}` with `{b}` ({why})" for a, b, why in rc["not_misses"]) or "none")
              + "."]
    pm = s.get("person_merges_into_a_planned_id") or {}
    L += ["", "## The plan", "",
          f"- pairs: {s['pairs']}",
          f"- by action: {s['by_action']}",
          f"- by systems: {s['by_systems']}",
          f"- rows to write (no hold): {s['rows_to_write']}, of which mints (base plus H): {s['mints']}, "
          f"folds after the mint: {s['folds_after_the_mint']}; step 1 writes "
          f"{sum(1 for p in doc['pairs'] if p['action'].startswith('row') and p['honors_id'] in STEP1_IDS)} of them "
          f"and step 2 the rest",
          f"- held pairs by first reason: {s['held_pairs_by_first_reason']}",
          f"- holds by reason (a pair can carry several): {s['holds_by_reason']}",
          (f"- person merges into a planned id ({pm['measure']}): {pm['rows']}; pairs a person's merge joins: "
           f"{pm['joining_a_planned_pair']}. Only a join holds a pair (Rule 10); the rest proceed." if pm else ""),
          f"- the rows' digest: md5 `{doc.get('rows_md5')}` over the step-2 rows, `course_id>value` joined by `|` in "
          "C order; the migration refuses unless what it inserts has the same digest", "",
          "**The fan-in order.** One H id per base (decision 3). The Honors M-ID with the most local courses takes "
          "it at the mint, by a one-to-one alias map. Each other single-base Honors M-ID on that base keeps its own "
          "`honors_of` row under its own id and merges into the H id after the mint, its own change. The mint never "
          "moves two ids onto one key, so no `(course_id, field)` slot is written twice. A follower whose Honors "
          "titles name a different course from the lead's is held: the fold would join distinct courses.", "",
          "Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's "
          "`members` in `unified_courses_data.js` or `unified_courses_standalone.js`.", "",
          "### Held pairs, by first reason", ""]
    held = defaultdict(list)
    for p in doc["pairs"]:
        if p["holds"]:
            held[hold_class(p["holds"][0])].append(p)
    for k in sorted(held, key=lambda x: (-len(held[x]), x)):
        L.append(f"- **{k}** ({len(held[k])}): " + ", ".join(f"`{p['honors_id']}` with `{p['base_id']}`" for p in held[k]))
    L += ["", "### Two examples per class", ""]
    by = defaultdict(list)
    for p in doc["pairs"]:
        key = p["action"].split(":")[0] if not p["holds"] else "held: " + p["holds"][0].split(":")[0].split(" (")[0]
        by[re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", key)].append(p)
    for k in sorted(by):
        L.append(f"- **{k}** ({len(by[k])}):")
        for p in by[k][:2]:
            L.append(f"  - `{p['honors_id']}` ({p['honors']['local_courses']} local courses, {p['honors']['folded_identities']} "
                     f"folded identities) with base `{p['base_id']}` ({p['base']['local_courses']} local courses, "
                     f"{p['base']['folded_identities']} folded identities); proposed `{p['proposed_h_id']}`; "
                     f"courses {p['courses'][:2]}")
    L += ["", "## What a person does", "",
          "Nothing here is applied. The conductor runs the live reads in the design (`docs/reference/honors_of_design.md`, "
          "*Live reads*) before any migration; the migrations under `kb/migrations/2026-11-14_s653_honors_of_*` are "
          "drafted and not listed in `kb/migrations/.apply`.", ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


STEP1_IDS = ("HUMA M10ME", "LIBR M10CJ")   # their rows land in step 1 (2026-11-14_s653_honors_of_field.sql)
ROWS_SQL = os.path.join(HERE, "migrations", "2026-11-14_s653_honors_of_rows.sql")
ROWS_RB = os.path.join(HERE, "migrations", "2026-11-14_s653_honors_of_rows_rollback.sql")


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def step2_rows(doc):
    """The step-2 rows: every unheld pair's honors_of, less step 1's two, sorted by key (C order)."""
    return sorted((p["honors_id"], p["base_id"]) for p in doc["pairs"]
                  if p["action"].startswith("row") and p["honors_id"] not in STEP1_IDS)


def rows_md5(rows):
    """The digest the migration computes over what it inserts: md5 of course_id>value joined by | in C order."""
    import hashlib
    return hashlib.md5("|".join(f"{h}>{b}" for h, b in sorted(rows)).encode("utf-8")).hexdigest()


def write_rows_sql(doc, write=True):
    """Step 2's migration and rollback, drafted from plan.json: one insert-only statement under one guard."""
    rows = step2_rows(doc)
    ids = sorted({i for r in rows for i in r})
    digest = rows_md5(rows)
    plan_rel = f"kb/honors_of_s653_out/{doc['date']}/plan.json"
    vals = ",\n    ".join(f"({q(h)}, {q(b)})" for h, b in rows)
    s1 = ", ".join(q(i) for i in STEP1_IDS)
    head = [
        "-- DRAFT, NOT IN kb/migrations/.apply. Step 2 of the Honors build (S653): the honors_of rows for every pair the",
        f"-- plan writes ({len(rows)} rows; {plan_rel}, written {doc['written']}). Design: docs/reference/honors_of_design.md.",
        "-- Ruling: Sam, Sheet 197 card 3 (14:37Z 2026-11-14): \"Build the field first, then the rows\"; \"Rows for all 508",
        "-- pairs\". The plan holds what it cannot write without a person's call; held pairs get no row (plan.md lists them).",
        "-- Written by kb/_honors_of_s653_dryrun.py --sql-only from the committed plan. Lands after step 1",
        "-- (2026-11-14_s653_honors_of_field.sql) and after the conductor's live reads re-measure the plan.",
        f"-- Insert-only under its own cohort, {COHORT_ROWS}, ON CONFLICT DO NOTHING (Rule 10). One plain statement: the",
        "-- insert hangs on one guard CTE, and a failed guard raises, so nothing is written. The guard refuses when:",
        f"--   * step 1's two honors_of rows ({COHORT}) are not both present, or any other honors_of row exists;",
        "--   * a planned value or key is outside the named set: each named id was a live id (the payload index, members,",
        "--     minted and stand-alone records) when the plan was drawn, and the dry run aborts on any that is not;",
        "--   * any named id carries a merge_into row: an id merged away is no longer a live identity, and its row would be",
        "--     stale. The CCR resolves no alias map, so a stale value would offer a pair Python holds (#3315, item 14);",
        "--   * a pair's two ids already end under one id through merge_into rows (counted, and by a person apart). A",
        "--     person's merge of a third course into either side does not refuse: it agrees with the pair standing apart",
        "--     (#3315's review, item 1; 45 such rows today);",
        "--   * what it inserts differs from the plan in count or digest.",
        f"-- The result is a count and an md5 ({digest}) over the inserted rows, course_id>value joined by | in C order, so",
        "-- the runner's receipt (scripts/supabase_migrate.py keeps the first 4,000 characters) holds the whole record and",
        "-- checks against plan.json. No row image is returned: the insert-only cohort rolls back by its reviewer_email.",
        "-- Rollback: 2026-11-14_s653_honors_of_rows_rollback.sql, keyed on the cohort and the field, never on ids, so it",
        "-- finds every row after a mint re-keys them.",
        "",
    ]
    body = f"""with recursive planned (course_id, value) as (
  values
    {vals}
),
named (id) as (
  values {", ".join(f"({q(i)})" for i in ids)}
),
stale as (
  select count(*) as n from planned p
  where p.course_id not in (select id from named) or p.value not in (select id from named)
),
step1 as (
  select count(*) as n from public.kb_curation s
  where s.field = 'honors_of' and s.reviewer_email = '{COHORT}' and s.course_id in ({s1})
),
other_honors as (
  select count(*) as n from public.kb_curation o
  where o.field = 'honors_of' and not (o.reviewer_email = '{COHORT}' and o.course_id in ({s1}))
),
moved as (
  select count(*) as n from public.kb_curation m where m.field = 'merge_into' and m.course_id in (select id from named)
),
walk (honors_id, side, id, person, depth) as (
  select p.course_id, 'h', p.course_id, false, 0 from planned p
  union all
  select p.course_id, 'b', p.value, false, 0 from planned p
  union all
  select w.honors_id, w.side, m.value, w.person or m.reviewer_email not like '%@bot', w.depth + 1
  from walk w join public.kb_curation m on m.course_id = w.id and m.field = 'merge_into'
  where w.depth < 40
),
joined as (
  select h.honors_id, bool_or(h.person or b.person) as by_person
  from walk h join walk b on b.honors_id = h.honors_id and b.side = 'b' and b.id = h.id
  where h.side = 'h'
  group by h.honors_id
),
guard as (
  select (select n from stale) = 0 and (select n from step1) = 2 and (select n from other_honors) = 0
     and (select n from moved) = 0 and (select count(*) from joined) = 0 as ok,
     (select n from stale) as stale_rows, (select n from step1) as step1_rows,
     (select n from other_honors) as other_honors_rows, (select n from moved) as merged_ids,
     (select count(*) from joined) as joined_pairs, (select count(*) from joined where by_person) as person_joined
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select p.course_id, 'honors_of', p.value, '{COHORT_ROWS}'
  from guard g cross join planned p
  where g.ok
  on conflict (course_id, field) do nothing
  returning k.course_id, k.value
),
digest as (
  select count(*) as n,
         md5(coalesce(string_agg(a.course_id || '>' || a.value, '|' order by a.course_id collate "C"), '')) as md5
  from added a
)
select case when g.ok and d.n = {len(rows)} and d.md5 = '{digest}'
            then jsonb_build_object('inserted', d.n, 'md5', d.md5, 'cohort', '{COHORT_ROWS}')
            else ('refused by the guard: stale rows ' || g.stale_rows || ', step 1 rows ' || g.step1_rows
                  || ', other honors_of rows ' || g.other_honors_rows || ', named ids merged away ' || g.merged_ids
                  || ', pairs already joined ' || g.joined_pairs || ' (by a person ' || g.person_joined
                  || '), inserted ' || d.n || ' of {len(rows)} with digest ' || d.md5)::int::text::jsonb
       end as changed
from guard g cross join digest d;

-- Read back: expect {len(rows)} honors_of rows under {COHORT_ROWS} and 2 under {COHORT}.
--   select reviewer_email, count(*) from public.kb_curation where field = 'honors_of' group by 1;
"""
    sql = "\n".join(head) + body
    rb = "\n".join([
        "-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the step-2 cohort's rows go, keyed on the cohort",
        f"-- ({COHORT_ROWS}) and the field, never on ids, so it finds every row after a mint re-keys them (#3315's",
        "-- review, item 2). Step 1's rows are another cohort and stay (their own rollback removes them, and refuses while",
        "-- any row of this cohort stands). A row a person re-saved carries the person's reviewer and is never touched.",
        "-- The result is the count and an md5 over the deleted rows (course_id>value, | joined, C order); before a mint it",
        f"-- equals the forward digest ({digest}).",
        "with removed as (",
        "  delete from public.kb_curation k",
        f"  where k.reviewer_email = '{COHORT_ROWS}' and k.field = 'honors_of'",
        "  returning k.course_id, k.value",
        ")",
        "select jsonb_build_object('deleted', count(*), 'md5',",
        "       md5(coalesce(string_agg(r.course_id || '>' || r.value, '|' order by r.course_id collate \"C\"), ''))) as undone",
        "from removed r;",
        f"-- Read back: expect 0 rows under {COHORT_ROWS}.",
        ""])
    if not write:
        return sql, rb
    for path, text in ((ROWS_SQL, sql), (ROWS_RB, rb)):
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    return len(rows)


def live_id_set(root=ROOT):
    """The live id set: the payload's index and members, the minted courses and the stand-alones."""
    members, _ = cmp.load_members(root)
    return (set(cmp.load_index(root)) | set(members)
            | set(jload(os.path.join(HERE, "coci_minted_courses.json"))["courses"])
            | set(jload(os.path.join(HERE, "coci_minted_singletons.json"))["courses"]))


def check_plan(doc, root=ROOT, sql_only=False):
    """Refuse a stale plan: the committed SQL must be what the plan writes, every planned id must be live in the
    committed payload, and no alias map may have landed after the plan (a re-mint would leave its values stale).
    Run in full before the rows apply; CI runs the SQL half (--check-sql), since the payload moves daily."""
    problems = []
    sql, rb = write_rows_sql(doc, write=False)
    for path, text in ((ROWS_SQL, sql), (ROWS_RB, rb)):
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            problems.append(f"{os.path.relpath(path, ROOT)} differs from what the plan writes (run --sql-only)")
    if rows_md5(step2_rows(doc)) != doc.get("rows_md5"):
        problems.append("plan.json's rows_md5 is not the digest of its rows")
    if sql_only:
        if problems:
            raise SystemExit("STALE: " + "; ".join(problems))
        print(f"SQL current: {doc['step2_rows']} step-2 rows, digest {doc['rows_md5']}")
        return 0
    if doc.get("alias_era") != alias_chain.ALIAS_MAPS[-1]:
        problems.append(f"an alias map landed after the plan ({doc.get('alias_era')} -> {alias_chain.ALIAS_MAPS[-1]}): "
                        "redraw it")
    live = live_id_set(root)
    gone = sorted({i for p in doc["pairs"] if p["action"].startswith("row") for i in (p["honors_id"], p["base_id"])}
                  - live)
    if gone:
        problems.append(f"{len(gone)} planned ids are not live in the committed payload: {gone[:8]}")
    if problems:
        raise SystemExit("STALE: " + "; ".join(problems))
    print(f"plan current: {doc['step2_rows']} step-2 rows, digest {doc['rows_md5']}, era {doc['alias_era']}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tmp", help="an empty scratch dir for the two simulated exports")
    ap.add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    ap.add_argument("--sql-only", action="store_true",
                    help="draft step 2's migration and rollback from the committed plan.json; no export")
    ap.add_argument("--check", action="store_true",
                    help="refuse unless the committed SQL is what the plan writes, every row's ids are live in the "
                         "committed payload, and no alias map landed after the plan")
    ap.add_argument("--check-sql", action="store_true", help="the SQL half of --check alone (CI)")
    ap.add_argument("--reuse", action="store_true", help="reuse the exports already in --tmp")
    a = ap.parse_args()
    if a.sql_only or a.check or a.check_sql:
        doc = jload(os.path.join(HERE, "honors_of_s653_out", a.date, "plan.json"))
        if a.check or a.check_sql:
            return check_plan(doc, sql_only=a.check_sql)
        print(f"drafted {write_rows_sql(doc)} rows: {os.path.relpath(ROWS_SQL, ROOT)}, {os.path.relpath(ROWS_RB, ROOT)}")
        return
    if not a.tmp:
        raise SystemExit("pass --tmp <empty scratch dir>")
    if a.reuse:
        outs = {n: os.path.join(a.tmp, "out_" + n) for n in ("live", "field")}
    else:
        outs = run_exports(a.tmp)
    sim = compare_runs(outs)

    wc = Shim(ROOT)
    _, _, rows_c, _ = s648.measure_honors(wc)
    wl = Shim(outs["live"])
    summ_l, _, rows_l, _ = s648.measure_honors(wl)
    pc, pl = pairs_of(rows_c), pairs_of(rows_l)
    rep = {"committed": {"members_generated_at": wc.generated_at, "pairs": len(pc), "course_rows": sum(pc.values())},
           "live": {"members_generated_at": wl.generated_at, "pairs": len(pl), "course_rows": sum(pl.values())},
           "live_only": sorted(set(pl) - set(pc)), "committed_only": sorted(set(pc) - set(pl)),
           "how": "kb/_reclustering_s648_dryrun.measure_honors on each members file; a pair is an (Honors identity, "
                  "base identity) whose Honors course and base course at one college sit in different identities"}
    live_cur = overlay_live(jload(os.path.join(HERE, "coci_curation.json")))["curations"]
    plan = plan_pairs(wl, rows_l, outs["live"], live_cur)
    import _honors_matcher_recall as recall
    rc = recall.measure(wl.members)
    if rc["wrong"] or rc["must_find_missing"] or not all(f["pass"] for f in rc["fixtures"]):
        raise SystemExit("ABORT: the matcher's recall test fails: " + json.dumps({k: rc[k] for k in (
            "wrong_pairs", "must_find_missing")}))
    doc = {"_about": "Dry run of the honors_of rows and base-plus-H mints. Nothing applied. Design: "
                     "docs/reference/honors_of_design.md.",
           "written": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "date": a.date,
           "cohort": COHORT, "cohort_rows": COHORT_ROWS, "alias_era": alias_chain.ALIAS_MAPS[-1],
           "reproduction": rep, "simulation": sim,
           "recall": {k: v for k, v in rc.items() if k != "fixtures"},
           "summary": summarize(plan, live_cur), "pairs": plan}
    doc["rows_md5"] = rows_md5(step2_rows(doc))
    doc["step2_rows"] = len(step2_rows(doc))
    od = os.path.join(HERE, "honors_of_s653_out", a.date)
    os.makedirs(od, exist_ok=True)
    with open(os.path.join(od, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(doc, os.path.join(od, "plan.md"))
    write_rows_sql(doc)
    print(json.dumps({"reproduction": {k: rep[k] for k in ("committed", "live", "live_only", "committed_only")},
                      "summary": doc["summary"],
                      "simulation": {f: len(v["differ"]) for f, v in sim["files"].items()}}, indent=1))


if __name__ == "__main__":
    main()
