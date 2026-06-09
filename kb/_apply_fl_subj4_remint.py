"""
_apply_fl_subj4_remint.py — APPLY the Foreign-Language SUBJ4 split (Rule 7).

Re-prefixes each 'Foreign Languages' identity's SUBJ4 by language, KEEPING the
M-number (already globally unique within FLNG -> collision-free, no re-sequence):
    FLNG M1019 -> FLSP M1019   (Spanish)
    FLNG M10AA -> FLFR M10AA   (a French singleton)
The MQ **discipline stays 'Foreign Languages'** — only the SUBJ4 (and id) change.
Classifier = kb/_fl_subj4_dryrun.py (TOP-11xx -> title -> member subject); the 2
language-agnostic residuals stay FLNG. Reads kb/foreign_language_subj4.json.

Re-keys, via a 1:1 old->new alias map:
  coci_minted_courses.json    (key + course_id + subject_4letter)
  coci_minted_singletons.json (key + course_id + subject + subject_4letter)
  coci_minted_memberships.json(key)
  coci_articulations.json     (articulations[].course_id + identities keys)
  coci_curation.json          (curation keys + merge_into pointers)
  discipline_canonical_subj4.json ("Foreign Languages" -> umbrella w/ per-language set)

DRY-RUN by default; --apply writes the files + kb/fl_subj4_out/<date>/alias_map.json.
V-gates (all must pass to --apply): V1 conservation · V2 no-collision · V3 discipline
unchanged · V4 articulation re-key count. (V5 auditor: run kb/_row_audit.py after.)

Run from repo root:
  python3 kb/_apply_fl_subj4_remint.py            # dry-run
  python3 kb/_apply_fl_subj4_remint.py --apply    # writes
"""
import json, os, sys, collections
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _fl_subj4_dryrun as dr  # reuse the EXACT classifier (TOP -> title -> subject)

OUTDIR = os.path.join(HERE, "fl_subj4_out", date.today().isoformat())


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

    # ── build the 1:1 re-prefix alias (FLNG M#### -> FL** M####) ──
    alias, by_s4 = {}, collections.Counter()
    for mid in [k for k in courses if k.startswith("FLNG ")]:
        lang, _ = dr.classify_mid(mid, courses[mid])
        if not lang:
            continue
        s4 = dr.LANG2SUBJ4[lang]
        alias[mid] = s4 + mid[4:]            # keep " M####"; swap the 4-letter prefix
        by_s4[s4] += 1
    for sid in [k for k in sing if k.startswith("FLNG ")]:
        lang, _ = dr.classify_singleton(sing[sid])
        if not lang:
            continue
        s4 = dr.LANG2SUBJ4[lang]
        alias[sid] = s4 + sid[4:]
        by_s4[s4] += 1

    # ── V-gate precompute ──
    pre_art = [g for g in art_doc.get("articulations", []) if g.get("course_id") in alias]
    existing = set(courses) | set(sing)
    new_ids = list(alias.values())
    dup_new = [n for n, c in collections.Counter(new_ids).items() if c > 1]
    # a new id may only equal an existing id if that existing id is itself being re-keyed away
    collide = sorted(n for n in set(new_ids) if n in existing and n not in alias)

    print(f"FL SUBJ4 re-mint apply — aliasing {len(alias)} FL identities "
          f"({sum(1 for k in alias if k in courses)} M-IDs + {sum(1 for k in alias if k in sing)} singletons)")
    print("  per new SUBJ4:", dict(by_s4.most_common()))
    print(f"  articulation records to re-key: {len(pre_art)}")
    v2 = not dup_new and not collide
    print(f"  V2 no-collision: {v2}" + (f"  dup={dup_new[:4]} collide={collide[:4]}" if not v2 else ""))

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
            if r.get("subject") == "FLNG":
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

    # ── CSR: "Foreign Languages" -> umbrella with the per-language SUBJ4 set ──
    fl = (canon_doc.get("disciplines") or {}).get("Foreign Languages")
    subj4_by_lang = {lang: d["subj4"] for lang, d in dr.FLMAP["languages"].items()}
    if fl is not None:
        fl["canonical_subj4"] = None
        fl["is_umbrella"] = True
        fl["umbrella_subj4_by_language"] = subj4_by_lang
        fl["umbrella_residual_subj4"] = "FLNG"
        fl["_umbrella_note"] = ("Foreign Languages is an UMBRELLA MQ discipline: SUBJ4 splits "
                                "per language (FL + 2-letter); discipline stays 'Foreign Languages'. "
                                "Re-mint: kb/_apply_fl_subj4_remint.py, 2026-06-09.")

    # ── V-gates (post-state) ──
    v1 = (len(new_courses) == len(courses) and len(new_sing) == len(sing) and len(new_mem) == len(mem))
    # V3: the re-key must leave each identity's discipline UNCHANGED (it only
    # touches the SUBJ4/id). M-IDs are "Foreign Languages"; FL singletons may be
    # null (seed-untouched) — either way it must survive the re-key untouched.
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
         {"_status": "FL SUBJ4 re-mint old->new alias (receipt + rollback inverse)",
          "_at": date.today().isoformat(), "_count": len(alias),
          "per_subj4": dict(by_s4), "alias": alias})

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
    print(f"\nAPPLIED — re-keyed {len(alias)} FL identities + {n_art} articulations. "
          f"Receipt: {os.path.relpath(OUTDIR, os.path.dirname(HERE))}/alias_map.json")


if __name__ == "__main__":
    main()
