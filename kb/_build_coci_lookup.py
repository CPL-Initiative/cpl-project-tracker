#!/usr/bin/env python3
"""Build the COCI Lookup tab's static data files (S110, Sam's ask —
"a COCI tab I could go to for lookups like this, with any MID, CID, CCN
in chips for each COCI entry").

Reads
  kb/reference/coci_course_list.xlsx   (the raw COCI catalog, 141,738 rows)
  kb/coci_minted_memberships.json      (M-ID -> member control_numbers)
  kb/coci_minted_singletons.json       (stand-alone M-ID per control_number)

Writes (repo root; STATIC — NOT daily-cron artifacts; rebuild on a fresh
COCI extract, like tmc_college_courses.js)
  coci_lookup_data.js       window.CPL_COCI_LOOKUP
      { _built_at, colleges: [..],
        rows: [[collegeIdx, ctrl, subj, num, title, units, credit, top,
                cid, ccn, mid], ...] }
      credit is 1 char per the CreditType rule (§9): C=Credit,
      E=Noncredit Enhanced, N=Noncredit, ''=blank/unknown.
      cid/ccn/mid are '' when absent (CCN's 'Not Applicable' sentinel and
      NULL/N/A CID sentinels are folded to '').
  coci_lookup_desc_<K>.js   window.CPL_COCI_DESC[K] = { ctrl: description }
      27 shards keyed by the SUBJECT's first character (A-Z, else '0') so
      the tab fetches one small file per expanded row instead of ~55 MB.

Run from repo root:  python3 kb/_build_coci_lookup.py
"""
import json
import re
import sys
from datetime import date, timezone

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl required: pip install openpyxl")

XLSX = "kb/reference/coci_course_list.xlsx"
MEMBERSHIPS = "kb/coci_minted_memberships.json"
SINGLETONS = "kb/coci_minted_singletons.json"

CID_SENTINELS = {"", "NULL", "N/A", "NA", "NONE", "NOT APPLICABLE"}
DESC_MAX = 900  # catalog descriptions avg ~420 chars; hard-cap the tail


def credit_char(credit_type, units):
    ct = (credit_type or "").strip().lower()
    if ct == "credit course":
        return "C"
    if ct in ("other noncredit enhanced funding",
              "workforce preparation enhanced funding"):
        return "E"
    if ct == "non-enhanced funding":
        return "N"
    # blank/unrecognized: derive by UnitValue per the §9 rule
    try:
        return "C" if float(units or 0) > 0 else "N"
    except (TypeError, ValueError):
        return ""


def shard_key(subject):
    c = (subject or "0")[:1].upper()
    return c if "A" <= c <= "Z" else "0"


def main():
    # control_number -> M-ID (memberships win over singletons on collision —
    # a corroborated identity outranks a stand-alone leftover)
    ctrl_to_mid = {}
    sing = json.load(open(SINGLETONS))
    for mid, rec in (sing.get("courses") or {}).items():
        cn = rec.get("control_number")
        if cn:
            ctrl_to_mid[cn] = mid
    del sing
    mm = json.load(open(MEMBERSHIPS))
    for mid, members in (mm.get("memberships") or {}).items():
        for m in members or []:
            cn = m.get("control_number")
            if cn:
                ctrl_to_mid[cn] = mid
    del mm
    print(f"control_number -> M-ID map: {len(ctrl_to_mid):,}")

    wb = openpyxl.load_workbook(XLSX, read_only=True)
    ws = wb.active
    hdr = None
    colleges = {}
    rows = []
    shards = {}  # key -> {ctrl: desc}
    mid_hits = 0
    for row in ws.iter_rows(values_only=True):
        if hdr is None:
            hdr = list(row)
            idx = {h: i for i, h in enumerate(hdr)}
            continue
        college = str(row[idx["College"]] or "").strip()
        ci = colleges.setdefault(college, len(colleges))
        ctrl = str(row[idx["CourseControlNumber"]] or "").strip()
        subj = str(row[idx["Subject"]] or "").strip()
        num = str(row[idx["Course_Number"]] or "").strip()
        title = str(row[idx["CourseTitle"]] or "").strip()
        units = row[idx["UnitValue"]]
        if isinstance(units, str):
            try:
                units = float(units)
            except ValueError:
                units = None
        if isinstance(units, float) and units.is_integer():
            units = int(units)
        cc = credit_char(row[idx["CreditType"]], units)
        top = str(row[idx["TopCode"]] or "").strip()
        cid = str(row[idx["CIDNumber"]] or "").strip()
        if cid.upper() in CID_SENTINELS:
            cid = ""
        ccn = str(row[idx["CommonCourseNumber"]] or "").strip()
        if ccn.upper() in CID_SENTINELS:
            ccn = ""
        mid = ctrl_to_mid.get(ctrl, "")
        if mid:
            mid_hits += 1
        rows.append([ci, ctrl, subj, num, title, units, cc, top, cid, ccn, mid])
        desc = str(row[idx["CatalogDescription"]] or "").strip()
        if desc:
            desc = re.sub(r"\s+", " ", desc)
            if len(desc) > DESC_MAX:
                desc = desc[:DESC_MAX - 1] + "…"
            shards.setdefault(shard_key(subj), {})[ctrl] = desc
    wb.close()

    rows.sort(key=lambda r: (r[0], r[2], r[3]))
    college_list = [c for c, _ in sorted(colleges.items(), key=lambda kv: kv[1])]

    payload = {
        "_built_at": date.today().isoformat(),
        "_built_by": "kb/_build_coci_lookup.py",
        "_source": "kb/reference/coci_course_list.xlsx",
        "colleges": college_list,
        "rows": rows,
    }
    with open("coci_lookup_data.js", "w", encoding="utf-8") as f:
        f.write("window.CPL_COCI_LOOKUP = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    for key, d in sorted(shards.items()):
        with open(f"coci_lookup_desc_{key}.js", "w", encoding="utf-8") as f:
            f.write("window.CPL_COCI_DESC = window.CPL_COCI_DESC || {};\n")
            f.write(f"window.CPL_COCI_DESC[{json.dumps(key)}] = ")
            json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
            f.write(";\n")

    import os
    main_mb = os.path.getsize("coci_lookup_data.js") / 1e6
    shard_mb = sum(os.path.getsize(f"coci_lookup_desc_{k}.js") for k in shards) / 1e6
    print(f"rows: {len(rows):,} | colleges: {len(college_list)} | "
          f"M-ID chips: {mid_hits:,} | shards: {len(shards)}")
    print(f"coci_lookup_data.js: {main_mb:.1f} MB | desc shards total: {shard_mb:.1f} MB")


if __name__ == "__main__":
    main()
