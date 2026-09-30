#!/usr/bin/env python3
"""Emit the COBI data files behind the My College tab's CPL opportunity register.

Reads one `kb/_build_regional_cpl_opportunity.py` run receipt per Strong
Workforce region and writes one file per region at the site root,
`regional_cpl_opportunity_<slug>.js` (`window.CPL_REGIONAL_OPPS_<SLUG>`), so the tab can flip between colleges in a
meeting without re-running the matcher — the build is ~20 seconds per college
and a meeting cannot wait on it.

    python3 kb/_emit_regional_opps_data.py \
        --receipt kb/regional_cpl_out/2026-09-30-bay28/crosswalk.json \
        --receipt kb/regional_cpl_out/2026-09-30-sdi10/crosswalk.json ...

⚠️ ONE FILE PER REGION, NAMED FROM THE REGION CODE (Sam, 2026-09-30, asking why
San Diego City College showed nothing). The register began as the Bay's 28
colleges in one file, so every other college read "not in this set". All nine
regions in one file would be ~14 MB raw for a reader who wants one college; per
region, the tab fetches only the file for the college picked. The tab derives
the file from the region code with the same rule as `region_slug()` below
(`SD/I` -> `sdi`), so the two must change together.

⚠️ AT THE ROOT, NOT IN A FOLDER. The deploy stamps a content hash onto every
root-level .js (scripts/stamp_asset_versions.py `build_manifest()`), and the
tab's loadScript appends it, so a regenerated file is fetched fresh. A file in a
subfolder is outside that manifest and a browser would keep yesterday's copy.

⚠️ KEYED BY MAP'S COLLEGE NAME, NOT THE MATCHER'S. The receipt names colleges
the way the matcher's roster does ("Canada College", "City College Of San
Francisco", "Southwestern Community College"); the tab's picker uses
`map_colleges.name` ("Cañada College", "City College of San Francisco",
"Southwestern College"), which is also what `swp_region_roster.json` carries.
A lookup across the two spellings misses, and the miss renders as "not in this
set" — measured 2026-09-30: Cañada, City College of San Francisco and College of
Marin had shown nothing since the Bay register shipped. Each receipt name is
resolved back to its roster name through the matcher's own resolver, and the
run fails when one does not resolve.

⚠️ THE REGISTER IS MATCHER OUTPUT, NOT CURATED RULINGS, AND THE TWO LOOK
IDENTICAL ON SCREEN. `kb/_score_occupation_matcher.py` puts the decision level
at precision 0.907 / recall 0.51 against the 139 occupations a human ruled at
San Joaquin Delta College. The measured numbers travel with the data, in `meta`,
so the view cannot render a caveat that has drifted from the score — re-score and
re-emit together. A caveat quoting a stale score is worse than none.

⚠️ A ROW WITH NO ALIGNED COURSE OR PROGRAM IS NOT LISTED (Sam, 2026-09-17):
"No need to list items where the college has no aligned course or program."
That is `fit == "none"` — P5 and P6 — and it is 80% of the payload (12,170 of
15,148 rows across the Bay 28). What survives is what the college can act on.

⚠️ THE DROPPED ROWS ARE STILL NAMED, IN THREE LISTS, BECAUSE THEY MEAN THREE
DIFFERENT THINGS AND ONE LABEL WOULD LIE ABOUT TWO OF THEM:

  `unmatched`          P6 — no exhibit anywhere, no program here. Nothing to say.
  `not_teaching`       P5/exists — California holds a credit recommendation for
                       this work and this college does not appear to teach it.
                       A consortium question, not this college's to-do list.
  `adopted_no_program` P5/on_it — the college is ON the exhibit and no program
                       matched. Tiny (32 rows across the Bay 28) and almost
                       certainly the matcher missing a program rather than a
                       college adopting work it does not teach. It is the one
                       bucket a curator should read.

Names travel, never just counts: recall is about half, so an absence here is
unconfirmed rather than a finding, and the person in the room is the one who can
correct it. Folding these into `unmatched` would report "nothing here" about
occupations that have a statewide credit recommendation sitting ready.
"""
import argparse
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Rows we emit in full. Everything a college has no aligned course or program
# for is named instead of listed — see the module docstring.
ROW_PRIORITIES = ("P0", "P1", "P2", "P3", "P4")

# Kept per row. Everything else in the receipt is either derivable (`n_programs`,
# `n_courses`, `n_exhibits` are lengths) or an internal id the view never paints
# (`exhibit_ids`). `program_evidence` STAYS: it is the token the match turned on,
# and with precision at ~0.9 the reader needs to see why a row is here to judge
# it. Dropping it would leave a claim with no way to check it.
ROW_FIELDS = ("occupation", "soc", "education", "fit", "priority",
              "exhibit_status", "programs", "courses", "exhibits",
              "exhibits_adopted", "program_evidence", "cpl_types",
              # ⚠️ `exhibits` (flat CER names) STAYS beside `exhibit_detail`.
              # The workbook, the screen page and the handout all `"; ".join()`
              # the flat list; the register reads the structured one, which
              # heads each CER over the credit recommendations that hang off it
              # and marks the statewide ones (Sam, 2026-09-17).
              "exhibit_detail",
              # 2-digit CIP of the programs this occupation matched. "CIP
              # Sector" is Sam's word for this level — cip_crosswalk.js says so
              # outright, and its labels are the 50 CIP families.
              "cip_sectors")


def trim_row(r):
    out = {}
    for k in ROW_FIELDS:
        v = r.get(k)
        if v in (None, "", [], {}):
            continue
        out[k] = v
    return out


def cip_sector_labels(used):
    """Label the 2-digit CIP sectors this register actually uses.

    Read out of `cip_crosswalk_data.js` (`fams`, 50 families) at BUILD time and
    baked into `meta`, so the register carries its own labels rather than making
    the My College tab load a 277 KB crosswalk for fifty short strings.

    ⚠️ ONLY THE SECTORS PRESENT. A filter offering all 50 when 18 occur reads as
    a broken control — the reader picks one and gets nothing. The empty bucket
    is the view's to name; it has no code to label.
    """
    path = os.path.join(ROOT, "cip_crosswalk_data.js")
    try:
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
        blob = src[src.index("{", src.index("=")):src.rindex(";")].strip()
        fams = (json.loads(blob) or {}).get("fams") or {}
    except Exception as exc:                       # noqa: BLE001 — labels are a nicety
        # The register still works: the view falls back to "CIP sector 47".
        print("WARNING: no CIP family labels (%s) — the filter will show bare codes." % exc)
        return {}
    return {c: fams[c] for c in sorted(used) if c in fams}


# The file each region writes: FILE_PREFIX + region_slug(code) + ".js".
FILE_PREFIX = "regional_cpl_opportunity_"


def region_slug(code):
    """`SD/I` -> `sdi`, `Bay` -> `bay`. college_briefing.js `regionSlug()` is the
    same rule; the tab builds the file name and the global from it."""
    return "".join(ch for ch in (code or "").lower() if ch.isalnum())


def roster_regions():
    with open(os.path.join(ROOT, "kb", "reference", "swp_region_roster.json"), encoding="utf-8") as fh:
        return json.load(fh)["regions"]


def matcher_resolver():
    """The matcher's own name resolver, so the emitter maps names exactly the way
    the run that wrote the receipt did."""
    sys.path.insert(0, os.path.join(ROOT, "kb"))
    import _build_regional_cpl_opportunity as gen   # noqa: E402 — path set above
    R, _ = gen.make_resolver()
    return R


def roster_names_for(receipt_colleges, regions, R):
    """Map each receipt college to (region code, MAP name).

    Every roster name is run through the matcher's resolver, and the result is
    inverted: matcher name -> roster name. A receipt college that no roster name
    resolves to is a hard failure — keyed under the matcher's spelling it would
    never be found by the picker, and nothing on screen would say why."""
    back = {}
    for code, blk in regions.items():
        for name in blk["colleges"]:
            back[R(name) or name] = (code, name)
            back.setdefault(name, (code, name))
    out, missing = {}, []
    for c in receipt_colleges:
        hit = back.get(c) or back.get(R(c) or "")
        if hit:
            out[c] = hit
        else:
            missing.append(c)
    if missing:
        sys.exit("ERROR: no Strong Workforce roster name for %s — add the spelling to "
                 "the matcher's roster (kb/college_short_names.json) and re-run."
                 % ", ".join(repr(m) for m in missing))
    return out


def build(receipt, names=None):
    names = names or {}
    colleges = {}
    labels = {}
    used_cip = set()
    for name, block in receipt.get("detail", {}).items():
        rows = block.get("rows", []) or []
        # Three named buckets for what is NOT listed — the docstring says why one
        # would lie about two of them.
        keep, unmatched, not_teaching, adopted_no_program = [], [], [], []
        for r in rows:
            p = r.get("priority")
            # One legend for the whole file rather than the same sentence
            # repeated on every row at every college.
            if p and r.get("priority_label"):
                labels.setdefault(p, r["priority_label"])
            if p in ROW_PRIORITIES:
                keep.append(trim_row(r))
                used_cip.update(r.get("cip_sectors") or [])
            elif p == "P5":
                # ⚠️ SPLIT ON `exhibit_status`, NOT ON THE TIER. Both P5 cases
                # have no aligned program, which is why neither is listed, and
                # they are opposite facts: one college does not teach the work,
                # the other is already ON the exhibit for it.
                (adopted_no_program if r.get("exhibit_status") == "on_it"
                 else not_teaching).append(r.get("occupation"))
            else:
                unmatched.append(r.get("occupation"))
        keep.sort(key=lambda r: (r.get("priority", "P9"), r.get("occupation", "")))
        colleges[names.get(name, name)] = {
            "summary": block.get("summary") or {},
            "rows": keep,
            "unmatched": sorted(u for u in unmatched if u),
            "not_teaching": sorted(u for u in not_teaching if u),
            "adopted_no_program": sorted(u for u in adopted_no_program if u),
        }
    return colleges, labels, cip_sector_labels(used_cip)


def emit_one(receipt_path, out_dir, regions, R):
    with open(receipt_path, encoding="utf-8") as fh:
        receipt = json.load(fh)
    mapped = roster_names_for(list(receipt.get("detail", {})), regions, R)
    codes = sorted({code for code, _ in mapped.values()})
    if len(codes) != 1:
        sys.exit("ERROR: %s spans %d Strong Workforce regions (%s); one receipt per region."
                 % (receipt_path, len(codes), ", ".join(codes) or "none"))
    code = codes[0]
    names = {c: n for c, (_, n) in mapped.items()}
    colleges, labels, cip_labels = build(receipt, names)
    if not colleges:
        sys.exit("ERROR: %s carries no per-college detail." % receipt_path)

    # A roster college the receipt lacks renders "not in this set" on its page.
    # Said here, in the run's output, so it is seen before a meeting is.
    absent = sorted(set(regions[code]["colleges"]) - set(colleges))

    payload = {
        "meta": {
            "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
            "generated_by": "kb/_emit_regional_opps_data.py",
            "source_receipt": os.path.relpath(os.path.abspath(receipt_path), ROOT),
            "source_generated_at": receipt.get("_generated_at"),
            "region": receipt.get("region"),
            "region_code": code,
            "n_occupations": receipt.get("n_occupations"),
            "colleges": sorted(colleges),
            "priority_labels": labels,
            # code -> family name, for the register's CIP Sector filter. "CIP
            # Sector" is Sam's word for the 2-digit level (cip_crosswalk.js).
            "cip_sector_labels": cip_labels,
            # Travels with the data so the view cannot outlive the score.
            "accuracy": {
                "rulings": 139,
                "scored_on": "2026-09-16",
                "scored_at": "San Joaquin Delta College",
                "precision": "about nine in ten",
                "recall": "roughly half",
            },
        },
        "colleges": colleges,
    }

    slug = region_slug(code)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, FILE_PREFIX + slug + ".js")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write("// GENERATED by kb/_emit_regional_opps_data.py — do not hand-edit.\n")
        fh.write("// Source receipt: %s\n" % payload["meta"]["source_receipt"])
        fh.write("// Matcher output, not curated rulings. See the emitter's docstring.\n")
        fh.write("window.CPL_REGIONAL_OPPS_%s = " % slug.upper())
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    def tot(k):
        return sum(len(c[k]) for c in colleges.values())

    size = os.path.getsize(out_path)
    # Every bucket printed, so a run that silently drops everything is visible
    # in its own output rather than on screen in a meeting.
    print("%-5s colleges %d | rows %d | not-teaching %d | adopted-no-program %d | "
          "unmatched %d | CIP sectors %d | %s (%.1f KB)"
          % (code, len(colleges), tot("rows"), tot("not_teaching"),
             tot("adopted_no_program"), tot("unmatched"), len(cip_labels),
             os.path.relpath(out_path, ROOT), size / 1024.0))
    if absent:
        print("      WARNING: in the roster, not in the receipt: %s" % ", ".join(absent))
    if not tot("rows"):
        sys.exit("ERROR: every row was filtered out — the %s register would be empty." % code)
    return code


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--receipt", action="append", required=True,
                    help="repeatable; one run receipt per Strong Workforce region")
    ap.add_argument("--out-dir", default=".")
    a = ap.parse_args()

    out_dir = a.out_dir if os.path.isabs(a.out_dir) else os.path.join(ROOT, a.out_dir)
    regions = roster_regions()
    R = matcher_resolver()
    seen = {}
    for rp in a.receipt:
        code = emit_one(rp, out_dir, regions, R)
        if code in seen:
            sys.exit("ERROR: two receipts for %s (%s, %s)." % (code, seen[code], rp))
        seen[code] = rp
    missing = sorted(set(regions) - set(seen))
    if missing:
        print("NOTE: no receipt for %s — those colleges will read \"not in this set\"."
              % ", ".join(missing))
    return 0


if __name__ == "__main__":
    sys.exit(main())
