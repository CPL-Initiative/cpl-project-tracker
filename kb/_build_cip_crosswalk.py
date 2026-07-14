#!/usr/bin/env python3
"""Build cip_crosswalk_data.js — the TOP <-> CIP crosswalk dataset.

Source: kb/reference/cip_searchable_260708.xlsx — the Chancellor's Office
"CIP Searchable" workbook (2026-07-08 cut) that ESS was going to email to the
field for the TOP-to-CIP transition (ESS 26-06, effective fall 2026). The CIP
Crosswalk tab (cip_crosswalk.js) replaces that spreadsheet with a searchable,
filterable, suggest-to-curate web tool.

Emits window.CIP_CROSSWALK, a NORMALIZED model so long CIP definitions/SOC lists
are stored ONCE (keyed by code) instead of repeated across the 5,353 crosswalk
pairs:

  {
    _built_at, _built_by, _source, _note,
    sources: [<relationship-source strings>],   # pairs reference these by index
    top: { "<TOP6>": {t,div,divt,sec,cte} },     # 424 TOP codes
    cip: { "<CIP6>": {t,fam,famt,cte,act,def,xref,ex,soc:[[soc,title,onet]]} },
    pairs: [ [top6|null, cip6, srcIdx, nc(0|1), collegesStr, count] ]  # 5,353
  }

Rebuild: python kb/_build_cip_crosswalk.py   (writes cip_crosswalk_data.js at repo root)
"""
import json
import os
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
SRC = os.path.join(HERE, "reference", "cip_searchable_260708.xlsx")
OUT = os.path.join(REPO, "cip_crosswalk_data.js")
BUILT_AT = "2026-07-14"


def clean(v):
    if v is None:
        return ""
    return str(v).strip()


def split_code_title(s):
    """'0101.00 - Agriculture Technology...' -> ('0101.00', 'Agriculture Technology...')."""
    s = clean(s)
    if " - " in s:
        code, title = s.split(" - ", 1)
        return code.strip(), title.strip().rstrip(".")
    return s, ""


def split_div(s):
    """'01 - Agriculture and Natural Resources' -> ('01', 'Agriculture and Natural Resources')."""
    return split_code_title(s)


def main():
    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)

    # ---- CIP catalog: definitions / action / cross-refs / examples ----
    cip = {}
    ws = wb["CIP Descriptions"]
    rows = list(ws.iter_rows(values_only=True))
    # cols: 0 CIPFamily, 1 CIPCode(01.0000), 5 Action, 6 TextChange, 8 CIPTitle(clean),
    #       9 code-title, 10 CTE Flag, 11 CIPDefinition, 12 CrossReferences, 13 Examples
    for r in rows[1:]:
        code = clean(r[1])
        if not code:
            continue
        title = clean(r[8]).rstrip(".") or split_code_title(r[9])[1]
        examples = clean(r[13])
        if examples.lower().startswith("examples:"):
            examples = examples[len("examples:"):].strip(" -")
        cip[code] = {
            "t": title,
            "fam": clean(r[0]),
            "famt": "",  # filled from the Data sheet's family-title column
            "cte": clean(r[10]),
            "act": clean(r[5]),      # New / Deleted / Moved from|to / No substantive changes
            "chg": clean(r[6]),      # TextChange yes/no
            "def": clean(r[11]),
            "xref": clean(r[12]),
            "ex": examples,
            "soc": [],
        }

    # ---- SOC / occupation links per CIP (CIP -> jobs) ----
    # O*NET links are reconstructed client-side from the SOC code
    # (onetonline.org/link/summary/<soc>.00), so we don't store the URL.
    ws = wb["CIP-SOC Data"]
    for r in list(ws.iter_rows(values_only=True))[1:]:
        ccode, _ = split_code_title(r[0])
        soc_code, soc_title = split_code_title(r[3])
        if ccode in cip and soc_code:
            cip[ccode]["soc"].append([soc_code, soc_title])

    # ---- TOP catalog + crosswalk pairs (from the master TOP-CIP Data sheet) ----
    top = {}
    fam_titles = {}
    pairs = []
    sources = []

    def src_idx(s):
        if s not in sources:
            sources.append(s)
        return sources.index(s)

    ws = wb["TOP-CIP Data"]
    data = list(ws.iter_rows(values_only=True))[1:]
    # cols: 2 TOP code-title, 5 TOP div, 6 sector, 7 TOP CTE,
    #       11 CIP code-title, 14 CIP family code-title, 17 CIP def,
    #       18 relationship source, 19 colleges, 20 count, 21 noncredit
    for r in data:
        top_code, top_title = split_code_title(r[2])
        cip_code, cip_title = split_code_title(r[11])
        no_top = (not top_code) or top_code.upper().startswith("XXXX")

        if not no_top and top_code not in top:
            div_code, div_title = split_div(r[5])
            top[top_code] = {
                "t": top_title,
                "div": div_code,
                "divt": div_title,
                "sec": clean(r[6]),
                "cte": 1 if clean(r[7]) == "CTE" else 0,
            }

        # family title backfill for the CIP catalog
        fam_code, fam_title = split_div(r[14])
        if fam_code and fam_title:
            fam_titles[fam_code] = fam_title

        # ensure a CIP catalog entry exists even if it was only in the Data sheet
        if cip_code and cip_code not in cip:
            cip[cip_code] = {
                "t": cip_title, "fam": fam_code, "famt": "",
                "cte": clean(r[15]), "act": "", "chg": "",
                "def": clean(r[17]), "xref": "", "ex": "", "soc": [],
            }

        cnt = r[20]
        try:
            cnt = int(cnt) if cnt not in (None, "") else 0
        except (ValueError, TypeError):
            cnt = 0
        pairs.append([
            None if no_top else top_code,
            cip_code,
            src_idx(clean(r[18])),
            1 if clean(r[21]) == "Yes" else 0,
            clean(r[19]),
            cnt,
        ])

    # backfill family titles
    for c in cip.values():
        if not c["famt"]:
            c["famt"] = fam_titles.get(c["fam"], "")

    payload = {
        "_built_at": BUILT_AT,
        "_built_by": "kb/_build_cip_crosswalk.py",
        "_source": "kb/reference/cip_searchable_260708.xlsx "
                   "(CCCCO CIP Searchable Workbook, 2026-07-08)",
        "_note": "TOP-to-CIP transition crosswalk. The CO is transitioning from TOP "
                 "to CIP codes effective fall 2026 (ESS 26-06). This dataset replaces "
                 "the searchable spreadsheet the CO planned to email to the field.",
        "sources": sources,
        "top": top,
        "cip": cip,
        "pairs": pairs,
    }

    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("// cip_crosswalk_data.js — GENERATED by kb/_build_cip_crosswalk.py. Do not edit by hand.\n")
        f.write("// Source: CCCCO CIP Searchable Workbook (2026-07-08). Rebuild: python kb/_build_cip_crosswalk.py\n")
        f.write("window.CIP_CROSSWALK = ")
        f.write(body)
        f.write(";\n")

    kb = sum(len(c["soc"]) for c in cip.values())
    print(f"TOP codes:      {len(top)}")
    print(f"CIP codes:      {len(cip)}")
    print(f"Crosswalk pairs:{len(pairs)}")
    print(f"SOC links:      {kb}")
    print(f"Sources:        {sources}")
    print(f"Wrote {OUT}  ({os.path.getsize(OUT)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
