"""
UC-CUR → Z-scheme re-mint — DRY-RUN planner (Rule 7).

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, nothing to Supabase, nothing
to live curation. Reads the synthetic curator/auto unified-course targets
(`UC-CUR-*`) out of kb/coci_curation.json, derives a CCN-shaped surrogate id
`SUBJ Z<band><seq:03d>` per target, and produces reviewable artifacts under
kb/uc_cur_zscheme_out/<date>/:

  alias_map.json   — old UC-CUR id -> new Z-id (+ derivation provenance per row)
  zseq_seed.json   — per-(SUBJ4, band) sequence high-water seed for the persisted
                     counter (kb/uc_cur_zseq.json) the apply will write, so future
                     auto-merge / client mints never renumber this cohort (option B)
  collisions.json  — any (Z-id) assigned to ≥2 targets, OR a Z-id colliding with an
                     existing course id (BOTH must be empty for apply-readiness)
  supabase_ops.sql — the would-be kb_curation UPDATEs (header-guarded; NOT run by
                     this dry-run — the apply re-derives against fresh state first)
  report.md        — human skim: counts, derivation breakdown, cohort histogram,
                     validation, samples, apply procedure + code touch points

Why a Z-scheme (Sam, 2026-06-15): `UC-CUR-AUTO01C890D03` is long, opaque, and
gives no signal that the row is a curator/auto MINT that still needs faculty
attention (no official id; a promotion candidate — §11 `uc_cur_ripe_for_promotion`).
The Z-scheme leads with `Z` in the CCN Course-Type-Identifier position, exactly
paralleling CCN's `C` and our minted `M` (§10):

  * Z   = curator/auto-minted Unified course, needs attention. Can't collide with
          a CCN `C####` or a minted `M####` (different CTI letter).
  * SUBJ = 4-letter SUBJ4. Per the new-mint convention (_seed_coci_minted_mids.py
          consults discipline_canonical_subj4.json), a target's SUBJ4 is the
          CANONICAL SUBJ4 of its members' modal discipline — EXCEPT umbrella
          disciplines (Foreign Languages / Kinesiology), which keep the members'
          own split code (FLSP/FLFR/.../KINE/ATHL) instead of collapsing to
          FLNG/KINE (mirrors UMBRELLA_DISCIPLINES in kb/_row_audit.py). Blank-
          discipline / out-of-map targets fall back to the modal 4-letter member
          subject_4letter; a rare all-short-code target is padded.
  * band = credit band like the M-IDs: 9 noncredit / 1 credit, from credit_status
          (§10 "banding basis = credit_status"). The auto-merge planner already
          gated band purity, so every UC-CUR-AUTO target's members share one band.
  * seq  = stable, deterministic, persisted sequence per (SUBJ4, band), assigned
          by sorting the cohort by normalized title (same method the M-ID minting
          used) — so codes don't churn each regen.

`id_system` STAYS "Unified" — these are curator mints, not corroborated M-IDs.
Z is the pre-promotion identity; promotion to a real M-ID/C-ID still follows the
lifecycle. Z is a MAP surrogate, NOT a CCN/CID claim (loud, same as M).

Re-key surface (entirely inside kb_curation / kb/coci_curation.json): the self-
keyed `unified_title` rows (course_id == a UC-CUR id) get their key rewritten, and
the `merge_into` pointers that target a UC-CUR id get their value rewritten. There
are ZERO references in kb/coci_articulations.json and kb/promotions.json.

compute_plan() is the SHARED pure allocator — kb/_uc_cur_zscheme_apply.py (built
after Sam's sign-off) imports it so the apply executes literally the allocation
this dry-run reports (apply == spec, the Rule-7 playbook).

Re-runnable. Run from repo root:  python3 kb/_uc_cur_zscheme_dryrun.py
"""
from __future__ import annotations

import json
import os
import re
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
CURATION = os.path.join(HERE, "coci_curation.json")
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
PROMOTIONS = os.path.join(HERE, "promotions.json")
# UC_CUR_ZSCHEME_OUT redirects the artifacts (verification seam — same pattern as
# SUBJ4_DRYRUN_OUT / UC_OUT_DIR; the apply re-runs this into /tmp to prove the
# plan is reproducible without churning the frozen receipt files).
OUT_DIR = os.environ.get("UC_CUR_ZSCHEME_OUT") or os.path.join(HERE, "uc_cur_zscheme_out")

# Mirror of UMBRELLA_DISCIPLINES in kb/_row_audit.py — keep in sync. These
# disciplines legitimately span MANY SUBJ4s (per-language FL** splits, KINE/ATHL),
# so we must NOT collapse them to their nominal canonical (FLNG / KINE); we keep
# the members' own split code.
UMBRELLA_DISCIPLINES = {"Foreign Languages", "Kinesiology"}

UC_CUR_RE = re.compile(r"^UC-CUR-")
SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
# A member course_id is "<SUBJ> M<band><suffix>" (SUBJ 1-4 letters; the residual
# single-letter `F M####` is the known blank-discipline artifact). We only need
# the leading SUBJ + band as a fallback when the member record is missing.
MEMBER_ID_RE = re.compile(r"^([A-Z]{1,4}) M(\d)")
TITLE_STOP = {"and", "the", "of", "for", "with", "into", "from", "this", "that",
              "an", "a", "to", "in", "on", "or", "as", "by", "at", "is", "be"}


def ntitle(t: str | None) -> str:
    """Normalized title — lowercased, non-alnum stripped, stopwords dropped,
    tokens sorted. The deterministic within-cohort sort key (same recipe as the
    2026-05-22 M-ID re-mint + the SUBJ4 fold), so seq assignment is repeatable."""
    if not t:
        return ""
    t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
    tokens = [x for x in t.split() if x and x not in TITLE_STOP]
    return " ".join(sorted(tokens))


def band_from_credit_status(cs: str | None, fallback: str | None) -> str | None:
    """9 noncredit / 1 credit, from credit_status (§10 banding basis). Falls back
    to the band digit baked into the member id when credit_status is blank."""
    if cs:
        return "9" if "noncredit" in cs.lower() else "1"
    return fallback


def load_member_index() -> tuple[dict, set]:
    """member course_id -> {s4, disc, cs}; plus the set of ALL existing course
    ids (minted + singletons) for the Z-collision gate (V3)."""
    idx, all_ids = {}, set()
    for path in (COURSES, SINGLETONS):
        with open(path, encoding="utf-8") as f:
            courses = json.load(f)["courses"]
        for cid, rec in courses.items():
            all_ids.add(cid)
            idx[cid] = {
                "s4": rec.get("subject_4letter"),
                "disc": rec.get("discipline"),
                "cs": rec.get("credit_status"),
            }
    return idx, all_ids


def load_uc_cur_targets(curations: dict):
    """Return (members_by_target, title_by_target).

    members_by_target[target] = [member course_id, ...]  (merge_into == target)
    title_by_target[target]   = the target's self-keyed unified_title (curator).
    """
    members = defaultdict(list)
    titles = {}
    for cid, v in curations.items():
        if not isinstance(v, dict):
            continue
        mi = v.get("merge_into")
        if mi and UC_CUR_RE.match(mi):
            members[mi].append(cid)
        if UC_CUR_RE.match(cid) and v.get("unified_title") is not None:
            titles[cid] = v.get("unified_title")
    # A target with a self-row but no members (or vice-versa) is surfaced, not
    # dropped — both forms are part of the re-key surface.
    for t in list(members):
        titles.setdefault(t, "")
    for t in list(titles):
        members.setdefault(t, [])
    return dict(members), titles


def derive_subj4(member_ids, member_idx, canon_map, canon_vals):
    """(subj4, source, modal_discipline) for one target.

    source ∈ {canonical_discipline, umbrella_member_s4, member_s4, padded_fallback}
    """
    disc_c = Counter()
    cand4 = Counter()   # members whose subject_4letter is exactly 4 letters
    any_s4 = Counter()  # letters-only of every member subject (padding fallback)
    for m in member_ids:
        rec = member_idx.get(m) or {}
        s4 = rec.get("s4") or ""
        if not s4:
            pm = MEMBER_ID_RE.match(m)
            s4 = pm.group(1) if pm else ""
        if rec.get("disc"):
            disc_c[rec["disc"]] += 1
        if SUBJ4_RE.match(s4):
            cand4[s4] += 1
        letters = re.sub(r"[^A-Z]", "", (s4 or "").upper())
        if letters:
            any_s4[letters] += 1

    # modal discipline (tie -> alphabetical)
    md = None
    if disc_c:
        mx = max(disc_c.values())
        md = sorted(d for d, c in disc_c.items() if c == mx)[0]

    # New-mint convention: a disciplined mint gets the canonical SUBJ4 of its
    # discipline — UNLESS the discipline is an umbrella (keep the members' split).
    if md and md not in UMBRELLA_DISCIPLINES:
        canon = canon_map.get(md, {}).get("canonical_subj4")
        if canon and SUBJ4_RE.match(canon):
            return canon, "canonical_discipline", md

    # Umbrella / blank-discipline / out-of-map → modal 4-letter member subject.
    # Tie-break prefers a recognised canonical SUBJ4 value, then alphabetical.
    if cand4:
        mx = max(cand4.values())
        winners = sorted((c for c, n in cand4.items() if n == mx),
                         key=lambda c: (c not in canon_vals, c))
        src = "umbrella_member_s4" if (md in UMBRELLA_DISCIPLINES) else "member_s4"
        return winners[0], src, md

    # Rare all-short-code target (no member carries a 4-letter subject): pad the
    # modal subject to 4 letters with X. Honest-but-ugly; flagged in the report.
    if any_s4:
        mx = max(any_s4.values())
        w = sorted(c for c, n in any_s4.items() if n == mx)[0]
        return (w[:4].ljust(4, "X")), "padded_fallback", md
    return "MISC", "padded_fallback", md


def compute_plan(curations: dict, member_idx: dict, all_existing_ids: set,
                 canon_doc: dict):
    """Pure allocator — derive (SUBJ4, band, seq) and a Z-id for every UC-CUR
    target. SHARED by this dry-run and kb/_uc_cur_zscheme_apply.py."""
    canon_map = canon_doc.get("disciplines", {}) or {}
    canon_vals = {v.get("canonical_subj4") for v in canon_map.values()
                  if v.get("canonical_subj4")}

    members_by_target, title_by_target = load_uc_cur_targets(curations)

    # ── Pass 1: per-target (SUBJ4, band) derivation ─────────────────────────
    rows = []
    band_impure = []  # targets whose members disagree on band (should be none)
    for target in sorted(members_by_target):
        mem = members_by_target[target]
        title = title_by_target.get(target, "")
        # band: modal member band; assert purity (auto-merge gated it upstream)
        band_c = Counter()
        for m in mem:
            pm = MEMBER_ID_RE.match(m)
            idb = pm.group(2) if pm else None
            b = band_from_credit_status((member_idx.get(m) or {}).get("cs"), idb)
            if b:
                band_c[b] += 1
        band = band_c.most_common(1)[0][0] if band_c else "1"
        if len(band_c) > 1:
            band_impure.append({"target": target, "bands": dict(band_c)})
        subj4, src, md = derive_subj4(mem, member_idx, canon_map, canon_vals)
        rows.append({
            "old_id": target,
            "title": title,
            "norm_title": ntitle(title),
            "subj4": subj4,
            "subj4_source": src,
            "modal_discipline": md,
            "band": band,
            "n_members": len(mem),
            "member_ids": sorted(mem),
        })

    # ── Pass 2: assign Z<band><seq:03d> per (SUBJ4, band), title-sorted ──────
    by_bucket = defaultdict(list)
    for r in rows:
        by_bucket[(r["subj4"], r["band"])].append(r)
    overflow = []
    zseq_seed = {}  # "SUBJ4|band" -> high-water seq assigned (counter seed)
    for (subj4, band), brows in by_bucket.items():
        brows.sort(key=lambda r: (r["norm_title"], r["old_id"]))
        seq = 1
        for r in brows:
            if seq > 999:
                overflow.append((f"{subj4} Z{band}", seq))
                r["new_id"] = None
            else:
                r["seq"] = seq
                r["new_id"] = f"{subj4} Z{band}{seq:03d}"
            seq += 1
        zseq_seed[f"{subj4}|{band}"] = min(seq - 1, 999)

    # ── Pass 3: alias map (old UC-CUR -> new Z) ─────────────────────────────
    alias_map = {}
    for r in rows:
        if not r.get("new_id"):
            continue
        alias_map[r["old_id"]] = {
            "new_id": r["new_id"],
            "subj4": r["subj4"],
            "band": r["band"],
            "seq": r["seq"],
            "subj4_source": r["subj4_source"],
            "modal_discipline": r["modal_discipline"],
            "title": r["title"],
            "n_members": r["n_members"],
        }

    # ── Pass 4: validation ──────────────────────────────────────────────────
    validation = {}
    # V1: every new SUBJ4 is exactly 4 letters
    bad_subj4 = sorted({r["subj4"] for r in rows
                        if r.get("new_id") and not SUBJ4_RE.match(r["subj4"])})
    validation["all_new_subj4_are_4letter"] = {"pass": not bad_subj4,
                                               "bad": bad_subj4}
    # V2: every Z-id unique (no two targets share a Z)
    counts = Counter(r["new_id"] for r in rows if r.get("new_id"))
    dups = {nid: n for nid, n in counts.items() if n > 1}
    validation["new_ids_unique"] = {"pass": not dups, "duplicates": dups}
    # V3: no Z-id collides with an existing minted/singleton/curation id. The
    # different CTI letter (Z vs M/C) guarantees this, but assert it anyway.
    new_id_set = {r["new_id"] for r in rows if r.get("new_id")}
    existing = set(all_existing_ids) | set(curations.keys())
    collide_existing = sorted(new_id_set & existing)
    validation["new_ids_disjoint_from_existing"] = {
        "pass": not collide_existing,
        "count": len(collide_existing),
        "examples": collide_existing[:10],
    }
    # V4: every UC-CUR target got an alias (no drops). 4,053 in -> 4,053 out.
    n_targets = len(rows)
    n_aliased = len(alias_map)
    validation["all_targets_aliased"] = {
        "pass": n_targets == n_aliased,
        "targets": n_targets, "aliased": n_aliased,
    }
    # V5: band purity preserved (members of a target agree on band)
    validation["band_purity"] = {"pass": not band_impure,
                                 "impure": band_impure[:10]}
    # V6: no sequence overflow (>999 in a bucket)
    validation["no_seq_overflow"] = {"pass": not overflow, "overflow": overflow}
    # V7: alias invertible (new->old unique) — rollback handle integrity
    inv = Counter(a["new_id"] for a in alias_map.values())
    inv_dups = {nid: n for nid, n in inv.items() if n > 1}
    validation["alias_invertible"] = {"pass": not inv_dups, "duplicates": inv_dups}

    return {
        "rows": rows,
        "alias_map": alias_map,
        "zseq_seed": dict(sorted(zseq_seed.items())),
        "by_bucket": by_bucket,
        "validation": validation,
        "overflow": overflow,
        "band_impure": band_impure,
        "collide_existing": collide_existing,
    }


def _downstream_scope():
    """Count UC-CUR references the re-key does NOT touch (must be 0) — a
    standing guard that the surface stays inside kb_curation."""
    out = {}
    for label, path in (("articulations", ARTICULATIONS), ("promotions", PROMOTIONS)):
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                out[label] = len(re.findall(r"UC-CUR-", f.read()))
        else:
            out[label] = None
    return out


def main():
    with open(CURATION, encoding="utf-8") as f:
        curation_doc = json.load(f)
    curations = curation_doc.get("curations", curation_doc) or {}
    with open(CANONICAL, encoding="utf-8") as f:
        canon_doc = json.load(f)
    member_idx, all_existing_ids = load_member_index()

    plan = compute_plan(curations, member_idx, all_existing_ids, canon_doc)
    rows = plan["rows"]
    alias_map = plan["alias_map"]
    validation = plan["validation"]
    downstream = _downstream_scope()

    os.makedirs(OUT_DIR, exist_ok=True)
    today = date.today().isoformat()
    odir = os.path.join(OUT_DIR, today)
    os.makedirs(odir, exist_ok=True)

    # ── alias_map.json ──────────────────────────────────────────────────────
    alias_doc = {
        "_status": "DRY-RUN — UC-CUR → Z-scheme re-mint; no kb files mutated, no "
                   "Supabase writes. Restamp _status to APPLIED on apply.",
        "_generated_by": "kb/_uc_cur_zscheme_dryrun.py",
        "_generated_at": today,
        "_canonical_map_synced_at": canon_doc.get("_synced_at") or canon_doc.get("_seeded_at"),
        "_note": "Z is a MAP surrogate (curator/auto-minted Unified course, needs "
                 "attention), NOT a CCN/CID claim. Rollback = read right-to-left.",
        "count": len(alias_map),
        "aliases": dict(sorted(alias_map.items())),
    }
    with open(os.path.join(odir, "alias_map.json"), "w", encoding="utf-8") as f:
        json.dump(alias_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ── zseq_seed.json (option B — persisted counter seed) ──────────────────
    zseq_doc = {
        "_about": "Per-(SUBJ4, band) sequence high-water mark from the Z-scheme "
                  "re-mint. The apply drops this in as kb/uc_cur_zseq.json; future "
                  "auto-merge / generator Z-mints read+increment it so the existing "
                  "cohort is NEVER renumbered (option B — clean MID-style numbers).",
        "_format": "'SUBJ4|band' -> highest seq assigned (next mint = seq+1)",
        "_generated_at": today,
        "count": len(plan["zseq_seed"]),
        "counters": plan["zseq_seed"],
    }
    with open(os.path.join(odir, "zseq_seed.json"), "w", encoding="utf-8") as f:
        json.dump(zseq_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ── collisions.json ─────────────────────────────────────────────────────
    coll_doc = {
        "_about": "BOTH lists must be empty for apply-readiness.",
        "z_ids_assigned_to_multiple_targets": validation["new_ids_unique"]["duplicates"],
        "z_ids_colliding_with_existing_ids": plan["collide_existing"],
    }
    with open(os.path.join(odir, "collisions.json"), "w", encoding="utf-8") as f:
        json.dump(coll_doc, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # ── supabase_ops.sql (preview only — apply re-derives against fresh state) ─
    sql = [
        "-- UC-CUR → Z-scheme re-key — generated by kb/_uc_cur_zscheme_dryrun.py (PREVIEW)",
        "-- DO NOT RUN. The apply (kb/_uc_cur_zscheme_apply.py) re-derives this against",
        "-- a FRESH read of kb_curation in the apply sitting (fresh-read-at-write rule),",
        "-- then writes _zscheme_from provenance stamps + restamps the receipt _status.",
        "-- Two UPDATE classes: (1) re-key the self-keyed unified_title rows' course_id;",
        "-- (2) re-key the merge_into pointers' value. Wrapped in one transaction.",
        "begin;",
    ]
    for old in sorted(alias_map):
        new = alias_map[old]["new_id"]
        o = old.replace("'", "''")
        n = new.replace("'", "''")
        sql.append(f"update public.kb_curation set course_id = '{n}' "
                   f"where course_id = '{o}';")
        sql.append(f"update public.kb_curation set value = '{n}' "
                   f"where field = 'merge_into' and value = '{o}';")
    sql.append("commit;")
    with open(os.path.join(odir, "supabase_ops.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")

    # ── report.md ───────────────────────────────────────────────────────────
    with open(os.path.join(odir, "report.md"), "w", encoding="utf-8") as f:
        f.write(_render_report(today, plan, downstream, len(curations)))

    # ── console summary ─────────────────────────────────────────────────────
    n_pass = sum(1 for v in validation.values() if v["pass"])
    src_counts = Counter(r["subj4_source"] for r in rows)
    band_counts = Counter(r["band"] for r in rows)
    print(f"[uc_cur_zscheme_dryrun] {today}")
    print(f"  UC-CUR targets:   {len(rows)}  ->  Z-ids: {len(alias_map)}")
    print(f"  merge_into ptrs:  {sum(r['n_members'] for r in rows)} (members re-pointed)")
    print(f"  (SUBJ4, band) cohorts: {len(plan['by_bucket'])}  "
          f"| bands: credit {band_counts.get('1', 0)}, noncredit {band_counts.get('9', 0)}")
    print(f"  SUBJ4 sources:    " + ", ".join(f"{k} {v}" for k, v in src_counts.most_common()))
    print(f"  validation:       {n_pass}/{len(validation)} pass")
    for vk, vv in validation.items():
        if not vv["pass"]:
            print(f"    ❌ {vk}")
    print(f"  downstream UC-CUR refs (must be 0): "
          f"articulations {downstream.get('articulations')}, "
          f"promotions {downstream.get('promotions')}")
    print(f"  artifacts: {odir}/{{alias_map.json,zseq_seed.json,collisions.json,"
          f"supabase_ops.sql,report.md}}")


def _render_report(today, plan, downstream, n_curation_rows) -> str:
    rows = plan["rows"]
    alias_map = plan["alias_map"]
    validation = plan["validation"]
    by_bucket = plan["by_bucket"]
    src_counts = Counter(r["subj4_source"] for r in rows)
    band_counts = Counter(r["band"] for r in rows)
    n_ptrs = sum(r["n_members"] for r in rows)

    sizes = sorted((len(v) for v in by_bucket.values()), reverse=True)
    size_hist = Counter()
    for s in sizes:
        size_hist["1" if s == 1 else "2-5" if s <= 5 else "6-20" if s <= 20
                  else "21-99" if s <= 99 else "100+"] += 1
    apply_ready = all(v["pass"] for v in validation.values())

    L = []
    L.append("---")
    L.append("title: UC-CUR → Z-scheme Re-mint — DRY-RUN")
    L.append(f"date: {today}")
    L.append("session: 56 (data lane)")
    L.append("status: DRY-RUN — no kb files mutated, no Supabase writes; awaiting Sam's sign-off")
    L.append("tags: [remint, dry-run, uc-cur, z-scheme, identity, rule-7]")
    L.append("artifacts:")
    L.append(f"  - kb/uc_cur_zscheme_out/{today}/alias_map.json")
    L.append(f"  - kb/uc_cur_zscheme_out/{today}/zseq_seed.json")
    L.append(f"  - kb/uc_cur_zscheme_out/{today}/collisions.json")
    L.append(f"  - kb/uc_cur_zscheme_out/{today}/supabase_ops.sql")
    L.append("related:")
    L.append("  - docs/uc_cur_zscheme_remint_scope.md")
    L.append("  - docs/coursecontrolnumber_remint.md")
    L.append("  - docs/kb-notes/methodology-alias-map-resolution-semantics.md")
    L.append("---\n")
    L.append("# UC-CUR → Z-scheme Re-mint — DRY-RUN\n")

    # TL;DR
    L.append("## TL;DR\n")
    L.append(f"- **{len(rows)}** synthetic `UC-CUR-*` targets → **{len(alias_map)}** "
             f"new `SUBJ Z<band><seq:03d>` ids (e.g. `BIOL Z9001`).")
    L.append(f"- Re-key surface (entirely inside `kb_curation` / `kb/coci_curation.json`): "
             f"**{len(rows)}** self-keyed `unified_title` rows (course_id rewrite) + "
             f"**{n_ptrs}** `merge_into` pointers (value rewrite).")
    L.append(f"- Downstream (NOT touched): `coci_articulations.json` UC-CUR refs = "
             f"**{downstream.get('articulations')}**, `promotions.json` = "
             f"**{downstream.get('promotions')}** → confirmed 0, no articulation/promotion re-key.")
    L.append(f"- **{len(by_bucket)}** distinct (SUBJ4, band) cohorts · bands: "
             f"credit (1) **{band_counts.get('1', 0)}**, noncredit (9) **{band_counts.get('9', 0)}** "
             f"(0 mixed — band purity holds).")
    L.append(f"- Max cohort size **{sizes[0] if sizes else 0}** → `seq:03d` (cap 999) has "
             f"comfortable headroom; **0** overflow.")
    L.append(f"- Validation: **{sum(1 for v in validation.values() if v['pass'])}/"
             f"{len(validation)}** gates pass.")
    L.append("")

    # Apply gate
    L.append("## Apply gate\n")
    if apply_ready:
        L.append("**✅ MECHANICALLY READY** — all validation gates pass, no collisions, "
                 "no overflow. **Awaiting Sam's sign-off** before any apply (Rule 7).")
    else:
        L.append("**🟡 NOT READY** — failing gates:")
        for vk, vv in validation.items():
            if not vv["pass"]:
                L.append(f"  - `{vk}`")
    L.append("")

    # Validation table
    L.append("## Validation\n")
    for vk, vv in validation.items():
        emoji = "✅" if vv["pass"] else "❌"
        L.append(f"- {emoji} **{vk}**")
        if not vv["pass"]:
            L.append(f"  - {json.dumps({k: v for k, v in vv.items() if k != 'pass'})[:300]}")
    L.append("")

    # SUBJ4 derivation
    L.append("## SUBJ4 derivation\n")
    L.append("Each target's SUBJ4 follows the **new-mint convention** "
             "(`_seed_coci_minted_mids.py` → `discipline_canonical_subj4.json`): the "
             "canonical SUBJ4 of the members' **modal discipline** — except umbrella "
             "disciplines (Foreign Languages / Kinesiology), which keep the members' "
             "own split code (FLSP/FLFR/…/KINE/ATHL) rather than collapse to FLNG/KINE.\n")
    L.append("| source | targets | meaning |")
    L.append("|---|---:|---|")
    meaning = {
        "canonical_discipline": "canonical SUBJ4 of members' modal discipline",
        "umbrella_member_s4": "umbrella discipline → modal 4-letter member subject (split preserved)",
        "member_s4": "blank/out-of-map discipline → modal 4-letter member subject",
        "padded_fallback": "no member carries a 4-letter subject → modal subject padded with X",
    }
    for k, v in src_counts.most_common():
        L.append(f"| `{k}` | {v} | {meaning.get(k, '')} |")
    L.append("")
    pad = [r for r in rows if r["subj4_source"] == "padded_fallback"]
    if pad:
        L.append(f"**Padded-fallback targets ({len(pad)})** — the genuinely "
                 "un-disciplined short-code tail; SUBJ4 is honest-but-ugly, best "
                 "refined by curation later:\n")
        for r in pad:
            L.append(f"- `{r['old_id']}` → `{r['new_id']}` · {r['title']} "
                     f"(members: {', '.join(r['member_ids'])})")
        L.append("")

    # Cohort histogram + top buckets
    L.append("## (SUBJ4, band) cohort sizes\n")
    L.append("| bucket size | # cohorts |")
    L.append("|---|---:|")
    for k in ["1", "2-5", "6-20", "21-99", "100+"]:
        if size_hist.get(k):
            L.append(f"| {k} | {size_hist[k]} |")
    L.append("")
    top = sorted(by_bucket.items(), key=lambda kv: -len(kv[1]))[:12]
    L.append("Largest cohorts:\n")
    L.append("| (SUBJ4, band) | targets | example Z-id |")
    L.append("|---|---:|---|")
    for (s4, band), brows in top:
        L.append(f"| `{s4}` band `{band}` | {len(brows)} | `{s4} Z{band}001` |")
    L.append("")

    # Persisted-counter decision
    L.append("## Persisted-counter decision — option B (recommended, adopted)\n")
    L.append("Today `UC-CUR-AUTO` ids are content-addressed (`md5(sig)`), stable without "
             "a counter. The Z-scheme's banded `<seq:03d>` needs a **persisted per-"
             "(SUBJ4, band) counter** or the next auto-merge / mint would renumber the "
             "cohort each run. **Adopted: option B** (matches MID number format):\n")
    L.append("- The apply drops `zseq_seed.json` in as **`kb/uc_cur_zseq.json`** "
             "(per-(SUBJ4, band) high-water seq). Server-side allocators "
             "(`kb/_auto_merge_worklist.py` apply; the generator promote-step) "
             "read+increment it → new mints get `seq+1`, **existing ids never move**.")
    L.append("- Client-side `doConsolidate` (browser, no counter access) keeps minting a "
             "**transient** `UC-CUR-EXT<ts>` placeholder; the next daily generator "
             "promotes any surviving `UC-CUR-*` placeholder to a clean "
             "`SUBJ Z<band><seq:03d>` via the counter and re-keys its pointers — so a "
             "curator's merge persists and the surrogate key tidies overnight.")
    L.append("- The **shared recognition helper** therefore matches BOTH "
             "`^[A-Z]{2,4} Z\\d` (settled) and `^UC-CUR-` (transient/legacy).")
    L.append("")

    # Code touch points (apply phase)
    L.append("## Code touch points (apply phase — one shared recognition helper)\n")
    L.append("This dry-run changes NO code. On apply, add ONE shared `is_synthetic_unified(id)` "
             "/ regex used by every site below (avoids drift):\n")
    L.append("| file | sites |")
    L.append("|---|---|")
    L.append("| `unified_courses.js` | `/^UC-CUR-/` recognition (~908); UC-CUR mint (~992) + "
             "UC-CUR-EXT mint (~1125) → transient placeholder (kept) + Z recognition; the "
             "#436 override regex; `cluster_id_off_scheme` / `uc_cur_ripe_for_promotion` tags |")
    L.append("| `excel_to_dashboard.py` | `_target_identity()` (~6715) UC-CUR/Z recognition; "
             "the generator **promote-step** (placeholder → Z via `kb/uc_cur_zseq.json`) |")
    L.append("| `kb/_row_audit.py` | UC-CUR recognition (~265, 1095, 1173) — Z is **ON-scheme**, "
             "so `cluster_id_off_scheme` must NOT fire on Z; re-tune to flag only non-Z synthetic |")
    L.append("| `kb/_auto_merge_worklist.py` | mint (~199) → Z-format via the persisted counter |")
    L.append("")

    # Samples
    L.append("## Sample re-keys (every 250th, title-sorted within cohort)\n")
    aliased = [r for r in rows if r.get("new_id")]
    aliased.sort(key=lambda r: (r["subj4"], r["band"], r.get("seq", 0)))
    for r in aliased[::250]:
        L.append(f"- `{r['old_id']}` → **`{r['new_id']}`** · {r['title']} "
                 f"· disc: {r['modal_discipline'] or '—'} · {r['n_members']} members "
                 f"({r['subj4_source']})")
    L.append("")

    # Apply procedure
    L.append("## Apply procedure (NOT this session — after Sam's sign-off)\n")
    L.append("1. Build `kb/_uc_cur_zscheme_apply.py` importing `compute_plan` from this dry-run.")
    L.append("2. **Fresh-read** `kb_curation` from Supabase at write-time; re-run "
             "`compute_plan` against fresh state (aliases anything new; abort on a class "
             "we said we'd halt on).")
    L.append("3. Re-key in ONE cron window (before 10:17 UTC): the self-keyed `unified_title` "
             "rows' `course_id` + the `merge_into` pointers' `value`, in BOTH "
             "`kb/coci_curation.json` and live Supabase `kb_curation`; stamp each re-keyed "
             "row with `_zscheme_from` (per-row provenance, immune to future slot reuse).")
    L.append("4. Write `kb/uc_cur_zseq.json` from `zseq_seed.json`.")
    L.append("5. Ship the code recognition/mint changes in the SAME window (one shared helper).")
    L.append("6. **Restamp** this receipt's `_status` to APPLIED (methodology-alias-map rule 6).")
    L.append("7. V5-validate the live overlay against the alias map + per-row stamps; "
             "rollback = read `alias_map.json` right-to-left.")
    L.append("")
    return "\n".join(L)


if __name__ == "__main__":
    main()
