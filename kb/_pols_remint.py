"""
_pols_remint.py — APPLY the POSC → POLS canonical convergence (Rule 7).

CSR pass CSR0006 (2026-07-10, skeptic-upheld; Sam fired it same day): official
CCN prefix POLS carries 144 official rows AND is the Political Science field
modal (223 vs POSC 42); the POSC curator override had no recorded rationale.
Re-prefixes every POSC identity to POLS, KEEPING the M-number (globally unique
within POSC → collision-free, no re-sequence):
    POSC M1001 -> POLS M1001
The MQ **discipline stays 'Political Science'** — only the SUBJ4 (and id) change.
Pattern: kb/_apply_fl_subj4_remint.py (the FL umbrella split, 2026-06-09).

Re-keys, via a 1:1 old->new alias map:
  coci_minted_courses.json    (key + course_id + subject_4letter)
  coci_minted_singletons.json (key + course_id + subject + subject_4letter)
  coci_minted_memberships.json(key)
  coci_articulations.json     (articulations[].course_id + identities keys)
  coci_curation.json          (curation keys + merge_into pointers)
  discipline_canonical_subj4.json ('Political Science' canonical_subj4 -> POLS)

NOT handled here (same-window manual steps, receipted):
  - Supabase kb_curation identity-keyed rows (fresh-read + UPDATE via MCP)
  - Supabase _CANON_SUBJ4::Political Science pick POSC -> POLS (Sam-authorized)
  - kb/_rekey_promotions.py ALIAS_MAPS registration + kb/_post_apply_chain.py

DRY-RUN by default; --apply writes the files + kb/pols_remint_out/<date>/alias_map.json.
V-gates (all must pass to --apply): V1 conservation · V2 no-collision · V3 discipline
unchanged · V4 articulation re-key count. (V5 auditor: post-apply chain runs it.)

Run from repo root:
  python3 kb/_pols_remint.py            # dry-run
  python3 kb/_pols_remint.py --apply    # writes
"""
import collections
import json
import os
import sys
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OLD, NEW = "POSC", "POLS"
OUTDIR = os.path.join(HERE, "pols_remint_out", date.today().isoformat())


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    apply = "--apply" in sys.argv
    courses_doc = load("coci_minted_courses.json")
    sing_doc = load("coci_minted_singletons.json")
    mem_doc = load("coci_minted_memberships.json")
    art_doc = load("coci_articulations.json")
    cur_doc = load("coci_curation.json")
    canon_doc = load("discipline_canonical_subj4.json")
    courses, sing, mem = courses_doc["courses"], sing_doc["courses"], mem_doc["memberships"]

    # ── build the 1:1 re-prefix alias (POSC M#### -> POLS M####, POSC Z#### -> POLS Z####) ──
    alias = {}
    for mid in [k for k in courses if k.startswith(OLD + " ")]:
        alias[mid] = NEW + mid[len(OLD):]
    for sid in [k for k in sing if k.startswith(OLD + " ")]:
        alias[sid] = NEW + sid[len(OLD):]
    # Z-scheme unified-course ids live only in the curation overlay (+ Supabase
    # mirror) and the zseq counters — the 2026-07-10 fresh-read caught 10 of
    # them; a SUBJ4 convergence must move the WHOLE namespace, not just M-IDs.
    zseq_doc = load("uc_cur_zseq.json")
    for zk in [k for k in cur_doc.get("curations", {}) if k.startswith(OLD + " Z")]:
        alias.setdefault(zk, NEW + zk[len(OLD):])

    # ── V-gate precompute ──
    pre_art = [g for g in art_doc.get("articulations", []) if g.get("course_id") in alias]
    existing = set(courses) | set(sing)
    new_ids = list(alias.values())
    dup_new = [n for n, c in collections.Counter(new_ids).items() if c > 1]
    collide = sorted(n for n in set(new_ids) if n in existing and n not in alias)
    # Identities-map occupancy: a new_id already present in identities is a REAL
    # collision only if it would overwrite (its old-key twin also has an entry)
    # or belongs to another discipline. Identities-only, same-discipline
    # occupants with no twin entry are STALE PRE-FOLD GHOSTS (the S110
    # rekey-derived-identity-maps class — Session 50 folded POLS->POSC in the
    # catalogs but never re-keyed identities): this convergence HEALS them —
    # the entry is already sitting at the destination key.
    identities = art_doc.get("identities") or {}
    ghosts_healed = []
    for new_id, old_id in {v: k for k, v in alias.items()}.items():
        occ = identities.get(new_id)
        if occ is None or new_id in alias:
            continue
        src_disc = (courses.get(old_id) or sing.get(old_id) or {}).get("discipline")
        if old_id not in identities and occ.get("discipline") == src_disc:
            ghosts_healed.append(new_id)          # already correct post-convergence
        else:
            collide.append(new_id)                # genuine overwrite/foreign occupant
    if ghosts_healed:
        print(f"  stale pre-fold ghost keys healed (identities-only, same-discipline): {ghosts_healed}")

    n_mids = sum(1 for k in alias if k in courses)
    n_sing = sum(1 for k in alias if k in sing)
    n_z = sum(1 for k in alias if " Z" in k)
    # curation keys participate in the collision surface too
    cur_keys = set(cur_doc.get("curations", {}).keys())
    collide += sorted(n for n in set(new_ids) if n in cur_keys and n not in alias)
    print(f"POLS re-mint — aliasing {len(alias)} {OLD} identities ({n_mids} M-IDs + {n_sing} singletons + {n_z} Z-ids)")
    print(f"  articulation records to re-key: {len(pre_art)}")
    v2 = not dup_new and not collide
    print(f"  V2 no-collision: {v2}" + (f"  dup={dup_new[:4]} collide={sorted(set(collide))[:4]}" if not v2 else ""))

    # ── apply to in-memory copies ──
    def rk(k):
        return alias.get(k, k)

    new_courses = {}
    for k, r in courses.items():
        nk = rk(k)
        if nk != k:
            r = dict(r); r["course_id"] = nk; r["subject_4letter"] = nk[:4]
        new_courses[nk] = r
    new_sing = {}
    for k, r in sing.items():
        nk = rk(k)
        if nk != k:
            r = dict(r); r["course_id"] = nk; r["subject_4letter"] = nk[:4]
            if r.get("subject") == OLD:
                r["subject"] = nk[:4]
        new_sing[nk] = r
    new_mem = {rk(k): m for k, m in mem.items()}
    n_art = 0
    for g in art_doc.get("articulations", []):
        c = g.get("course_id")
        if c in alias:
            g["course_id"] = alias[c]; n_art += 1
    if isinstance(art_doc.get("identities"), dict):
        art_doc["identities"] = {rk(k): v for k, v in art_doc["identities"].items()}
    cur = cur_doc.get("curations", {})
    new_cur = {}
    for k, v in cur.items():
        if isinstance(v, dict) and v.get("merge_into") in alias:
            v = dict(v); v["merge_into"] = alias[v["merge_into"]]
        new_cur[rk(k)] = v

    # ── zseq counters: POSC|<band> -> POLS|<band> (merge-add if target exists) ──
    counters = zseq_doc.get("counters", {})
    moved_counters = {}
    for ck in [k for k in list(counters) if k.startswith(OLD + "|")]:
        nk = NEW + ck[len(OLD):]
        counters[nk] = counters.get(nk, 0) + counters.pop(ck)
        moved_counters[ck] = nk
    if moved_counters:
        print(f"  zseq counters moved: {moved_counters}")

    # ── CSR: 'Political Science' canonical POSC -> POLS (Sam-authorized 2026-07-10) ──
    ps = (canon_doc.get("disciplines") or {}).get("Political Science")
    if ps is not None:
        ps["canonical_subj4"] = NEW
        ps["_notes"] = ("CS4 convergence applied (Sam, 2026-07-10): POSC -> POLS. Official CCN "
                        "prefix POLS (144 official rows) + field modal; no rationale was recorded "
                        "for POSC. Re-mint: kb/_pols_remint.py; receipt kb/pols_remint_out/. "
                        "Ref: kb/csr_out/2026-07-10 CSR0006.")

    # ── V-gates (post-state) ──
    v1 = (len(new_courses) == len(courses) and len(new_sing) == len(sing) and len(new_mem) == len(mem))
    orig_disc = {alias[k]: (courses.get(k) or sing.get(k) or {}).get("discipline") for k in alias}
    v3 = all((new_courses.get(nk) or new_sing.get(nk) or {}).get("discipline") == d
             for nk, d in orig_disc.items())
    v4 = (n_art == len(pre_art))
    gates = {"V1_conservation": v1, "V2_no_collision": v2,
             "V3_discipline_unchanged": v3, "V4_articulation_count": v4}
    print("  V-gates:", ", ".join(f"{k}={'OK' if g else 'FAIL'}" for k, g in gates.items()))
    apply_safe = all(gates.values())
    print(f"  apply_safe: {apply_safe}")

    os.makedirs(OUTDIR, exist_ok=True)
    dump(os.path.join(OUTDIR, "alias_map.json"),
         {"_status": "POSC->POLS re-mint old->new alias (receipt + rollback inverse)"
                     + ("" if apply else " — DRY-RUN, not yet applied"),
          "_at": date.today().isoformat(), "_count": len(alias),
          "_authorized_by": "Sam (map@rccd.edu), 2026-07-10 — CSR pass CSR0006",
          "_ghost_keys_healed": ghosts_healed,
          "_zseq_counters_moved": moved_counters,
          "alias": alias})

    if not apply:
        print(f"\nDRY-RUN — wrote {os.path.relpath(OUTDIR, os.path.dirname(HERE))}/alias_map.json. "
              f"Re-run with --apply to write the KB.")
        return
    if not apply_safe:
        sys.exit("APPLY BLOCKED — a V-gate failed.")

    courses_doc["courses"] = new_courses
    sing_doc["courses"] = new_sing
    mem_doc["memberships"] = new_mem
    cur_doc["curations"] = new_cur
    dump(os.path.join(HERE, "coci_minted_courses.json"), courses_doc)
    dump(os.path.join(HERE, "coci_minted_singletons.json"), sing_doc)
    dump(os.path.join(HERE, "coci_minted_memberships.json"), mem_doc)
    dump(os.path.join(HERE, "coci_articulations.json"), art_doc)
    dump(os.path.join(HERE, "coci_curation.json"), cur_doc)
    dump(os.path.join(HERE, "discipline_canonical_subj4.json"), canon_doc)
    dump(os.path.join(HERE, "uc_cur_zseq.json"), zseq_doc)
    # re-stamp the receipt as applied
    dump(os.path.join(OUTDIR, "alias_map.json"),
         {"_status": "POSC->POLS re-mint old->new alias — APPLIED",
          "_at": date.today().isoformat(), "_count": len(alias),
          "_authorized_by": "Sam (map@rccd.edu), 2026-07-10 — CSR pass CSR0006",
          "alias": alias})
    print(f"\nAPPLIED — re-keyed {len(alias)} identities + {n_art} articulations. "
          f"Receipt: {os.path.relpath(OUTDIR, os.path.dirname(HERE))}/alias_map.json")


if __name__ == "__main__":
    main()
