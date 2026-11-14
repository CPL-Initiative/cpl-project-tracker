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

COHORT = "honors-s653@bot"
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
    # The Honors M-IDs whose courses name this base and no other: they share the base's one H id. The first (most
    # local courses, then id) takes it by re-key; the rest fold into it (CCN keeps one H record per base).
    honors_of_base = defaultdict(set)
    for (h, b) in pairs:
        if s648.World.id_system(w, h).startswith("M-ID") and len(bases_of[h]) == 1:
            honors_of_base[b].add(h)

    def h_order(b):
        return sorted(honors_of_base[b], key=lambda i: (-len(w.members.get(i) or []), i))
    promotions = jload(os.path.join(HERE, "promotions.json"))["promotions"]
    merge_into = {k: v["merge_into"] for k, v in live_cur.items() if isinstance(v, dict) and v.get("merge_into")}
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])

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
        if alias_chain.resolve_id(h, alias_chain.load_maps(pending)) != h or \
                alias_chain.resolve_id(b, alias_chain.load_maps(pending)) != b:
            rec["holds"].append("an id moves under a pending alias map")
        if hs != "M-ID":
            rec["action"] = "none: the Honors side is a " + hs + " record, which stays as its body numbers it"
            if hs == "CCN-ID" and h.endswith("H") and h[:-1] == b:
                rec["notes"].append("CCN already holds this pair as base and H record")
            out.append(rec)
            continue
        if not pure:
            rec["holds"].append(f"the Honors course shares its M-ID with {hc['local_courses'] - hc['honors_courses'] - hc['program_courses']} "
                                "non-Honors course(s): a split comes before any row")
        if len(bases_of[h]) > 1:
            rec["holds"].append(f"the Honors M-ID's courses name {len(bases_of[h])} base identities: "
                                + ", ".join(sorted(bases_of[h])))
        if bs == "M-ID":
            hid = rec["proposed_h_id"]
            if hid in live_ids and hid != h:
                rec["holds"].append(f"the proposed id {hid} already exists")
            if len(honors_of_base[b]) > 1 and h in honors_of_base[b] and h_order(b)[0] != h:
                rec["fold_into"] = hid
                rec["notes"].append(f"the base has {len(honors_of_base[b])} single-base Honors M-IDs "
                                    f"({', '.join(h_order(b))}): {h_order(b)[0]} takes {hid}, this one folds into it")
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
        for i, side in ((h, "Honors id"), (b, "base")):
            p = person(i)
            if not p:
                continue
            fields = sorted(k for k in (live_cur.get(i) or {}) if k not in ho_LEDGER)
            if set(fields) & {"merge_into", "merge_dismissed", "honors_of"}:
                rec["holds"].append(f"a person saved {', '.join(fields)} on the {side} ({p}): Rule 10, held")
            else:
                rec["notes"].append(f"a person saved {', '.join(fields)} on the {side}: the row overrides nothing"
                                    + (" and the mint carries it to the H id" if side == "Honors id" else ""))
        if len(bases_of[h]) > 1:
            share = Counter({bb: pairs[(h, bb)] for bb in bases_of[h]})
            top, n_top = share.most_common(1)[0]
            rec["modal_base"] = {"id": top, "course_pairs": n_top, "of": sum(share.values())}
        tg = ((promotions.get(h) or {}).get("official_targets") or {})
        if any(t.split(":", 1)[-1] == b for t in tg):
            rec["holds"].append("kb/promotions.json names the base among the Honors id's official targets "
                                "(Phase B evidence; today's fold keeps them apart)")
        if rec["holds"]:
            rec["action"] = "held"
        elif bs == "M-ID" and rec.get("fold_into"):
            rec["action"] = "row and fold into the H id"
        elif bs == "M-ID":
            rec["action"] = "row and mint"
        else:
            rec["action"] = "row only (official base)"
        out.append(rec)
    return out


def summarize(plan):
    s = {"pairs": len(plan), "by_action": dict(Counter(p["action"].split(":")[0] for p in plan).most_common()),
         "by_systems": dict(Counter(f"{p['honors_system']} Honors, {p['base_system']} base" for p in plan).most_common()),
         "holds_by_reason": {}}
    reasons = Counter()
    for p in plan:
        for h in p["holds"]:
            reasons[re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", h).split(":")[0].split(" (")[0]] += 1
    s["holds_by_reason"] = dict(reasons.most_common())
    s["notes_by_reason"] = dict(Counter(re.sub(r"[A-Z]{2,6} [A-Z]?\w*\d\w*", "<id>", n).split(":")[0]
                                        for p in plan for n in p["notes"]).most_common())
    s["pairs_held"] = sum(1 for p in plan if p["holds"])
    s["rows_to_write"] = sum(1 for p in plan if p["action"].startswith("row"))
    s["mints"] = sum(1 for p in plan if p["action"] == "row and mint")
    s["folds_into_an_h_id"] = sum(1 for p in plan if p["action"] == "row and fold into the H id")
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
    L += ["", "## The plan", "",
          f"- pairs: {s['pairs']}",
          f"- by action: {s['by_action']}",
          f"- by systems: {s['by_systems']}",
          f"- rows to write (no hold): {s['rows_to_write']}, of which mints (base plus H): {s['mints']}",
          f"- holds by reason (a pair can carry several): {s['holds_by_reason']}", "",
          "Measures: *local courses* = rows in `unified_courses_members.js`; *folded identities* = the row's "
          "`members` in `unified_courses_data.js` or `unified_courses_standalone.js`.", "",
          "### Two examples per class", ""]
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


def write_rows_sql(doc):
    """Step 2's migration and rollback, drafted from plan.json: one insert-only statement under one guard."""
    rows = [(p["honors_id"], p["base_id"]) for p in doc["pairs"]
            if p["action"].startswith("row") and p["honors_id"] not in STEP1_IDS]
    ids = sorted({i for r in rows for i in r})
    plan_rel = f"kb/honors_of_s653_out/{doc['date']}/plan.json"
    vals = ",\n    ".join(f"({q(h)}, {q(b)})" for h, b in rows)
    idl = ", ".join(q(i) for i in ids)
    head = [
        "-- DRAFT, NOT IN kb/migrations/.apply. Step 2 of the Honors build (S653): the honors_of rows for every pair the",
        f"-- plan writes ({len(rows)} rows; {plan_rel}, written {doc['written']}). Design: docs/reference/honors_of_design.md.",
        "-- Ruling: Sam, Sheet 197 card 3 (14:37Z 2026-11-14): \"Build the field first, then the rows\"; \"Rows for all 508",
        "-- pairs\". The plan holds what it cannot write without a person's call (the design's *Holds*); held pairs get no row.",
        "-- Written by kb/_honors_of_s653_dryrun.py --sql-only from the committed plan. Lands after step 1",
        "-- (2026-11-14_s653_honors_of_field.sql) and after the conductor's live reads re-measure the plan.",
        "-- Insert-only under cohort honors-s653@bot, ON CONFLICT DO NOTHING (Rule 10). One plain statement: the insert hangs",
        "-- on one guard CTE, and a failed guard raises, so nothing is written. The guard: step 1's two honors_of rows",
        "-- present and no other honors_of row; no merge_into row keyed on any id the plan names (each is a live identity in",
        "-- the plan's fold); no person's merge_into, merge_dismissed or unified_title_merge_confirm row naming one of them.",
        "-- RETURNING puts every inserted row into the runner's receipt. Rollback: 2026-11-14_s653_honors_of_rows_rollback.sql.",
        "",
    ]
    body = f"""with planned (course_id, value) as (
  values
    {vals}
),
named (id) as (
  values {", ".join(f"({q(i)})" for i in ids)}
),
step1 as (
  select count(*) as n from public.kb_curation s
  where s.field = 'honors_of' and s.reviewer_email = 'honors-s653@bot' and s.course_id in ({", ".join(q(i) for i in STEP1_IDS)})
),
other_honors as (
  select count(*) as n from public.kb_curation o
  where o.field = 'honors_of' and o.course_id not in ({", ".join(q(i) for i in STEP1_IDS)})
),
merges as (
  select count(*) as n from public.kb_curation m where m.field = 'merge_into' and m.course_id in (select id from named)
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and p.field in ('merge_into', 'merge_dismissed', 'unified_title_merge_confirm')
    and (p.course_id in (select id from named)
         or exists (select 1 from named n where p.value = n.id or p.value like '%' || n.id || '|%'
                    or p.value like '%|' || n.id || '%'))
),
guard as (
  select (select n from step1) = 2 and (select n from other_honors) = 0 and (select n from merges) = 0
     and (select n from person) = 0 as ok,
     (select n from step1) as step1_rows, (select n from other_honors) as other_honors_rows,
     (select n from merges) as merge_rows, (select n from person) as person_rows
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select p.course_id, 'honors_of', p.value, 'honors-s653@bot'
  from guard g cross join planned p
  where g.ok
  on conflict (course_id, field) do nothing
  returning jsonb_build_object('op', 'insert', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from added) = {len(rows)}
            then (select jsonb_agg(image) from added)
            else ('refused by the guard: step 1 rows ' || g.step1_rows || ', other honors_of rows '
                  || g.other_honors_rows || ', merge rows on a named id ' || g.merge_rows || ', person rows '
                  || g.person_rows || ', or an insert met a taken slot')::int::text::jsonb
       end as changed
from guard g;

-- Read back: expect {len(rows) + 2} honors_of rows, all honors-s653@bot.
--   select count(*), count(distinct reviewer_email) from public.kb_curation where field = 'honors_of';
"""
    with open(ROWS_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(head) + body)
    rb = "\n".join([
        "-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the cohort's step-2 rows go, by cohort, field and the",
        "-- planned keys; step 1's two rows stay (their own rollback removes them). A row a person saved is never touched.",
        "delete from public.kb_curation k",
        "where k.reviewer_email = 'honors-s653@bot' and k.field = 'honors_of'",
        f"  and k.course_id in ({', '.join(q(h) for h, _ in rows)})",
        "returning k.course_id, k.value;",
        "-- Read back: expect 2 honors_of rows (step 1's).",
        ""])
    with open(ROWS_RB, "w", encoding="utf-8") as f:
        f.write(rb)
    return len(rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--tmp", help="an empty scratch dir for the two simulated exports")
    ap.add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    ap.add_argument("--sql-only", action="store_true",
                    help="draft step 2's migration and rollback from the committed plan.json; no export")
    a = ap.parse_args()
    if a.sql_only:
        doc = jload(os.path.join(HERE, "honors_of_s653_out", a.date, "plan.json"))
        print(f"drafted {write_rows_sql(doc)} rows: {os.path.relpath(ROWS_SQL, ROOT)}, {os.path.relpath(ROWS_RB, ROOT)}")
        return
    if not a.tmp:
        raise SystemExit("pass --tmp <empty scratch dir>")
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
    doc = {"_about": "Dry run of the honors_of rows and base-plus-H mints. Nothing applied. Design: "
                     "docs/reference/honors_of_design.md.",
           "written": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "date": a.date,
           "cohort": COHORT, "reproduction": rep, "simulation": sim, "summary": summarize(plan), "pairs": plan}
    od = os.path.join(HERE, "honors_of_s653_out", a.date)
    os.makedirs(od, exist_ok=True)
    with open(os.path.join(od, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")
    write_md(doc, os.path.join(od, "plan.md"))
    print(json.dumps({"reproduction": {k: rep[k] for k in ("committed", "live", "live_only", "committed_only")},
                      "summary": doc["summary"],
                      "simulation": {f: len(v["differ"]) for f, v in sim["files"].items()}}, indent=1))


if __name__ == "__main__":
    main()
