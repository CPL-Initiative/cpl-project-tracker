#!/usr/bin/env python3
"""The exhibit-to-cert link: which certifications each canonical exhibit title holds, by the catalog's own ids.

Sam, 2026-11-01: "Do we have a separate canonical list of just our certs, apart from how they might be bundled in an
exhibit? This brings me back to my DB dev days of normalizing", then "build the ASE slice first. Seems like we will
need that cert table, especially with the expanded cert schedule run we have going. Maybe we already have it?"

We do: kb/it_ai_credential_catalog.json, which the weekly industry-credential watch fills (7,335 credentials on
2026-11-01, each with a stable id, ASE's tests among them from CareerOneStop). What it lacked is the link, so a bundle
(one MAP exhibit, one canonical title) could say which certs it holds. This file is that link table:

    cert (the catalog's id)  <-many-to-many->  canonical exhibit title (credential_reference_data.js `ut`)

First family: ASE. A title that is an ASE certification or bundle ("ASE A5 Brakes", "ASE Bundle — A4, A5",
"ASE C1 or G1 — ...") HOLDS the tests it names, all of them, or any one where the title says "or". A local course
that names a test in parentheses ("Automotive Technology (ASE A5 Brakes)", Sam's 2026-10-31 form) is ALIGNED to it:
the college issues that course, and ASE issues only the test (Sam, 2026-10-31). A token that is not an ASE test code
("SP/2 HD", "Snap-on 604", "MACS/609", "Cummins ISX") is kept as unresolved, for the next family to claim, and so is an
ASE credential the catalog does not list (Master Automobile Technician, xEV, the G1 test).

ASE's test names come from kb/_sweep_exhibit_titles.py's ASE table (imported, never copied). Writes
kb/exhibit_cert_links.json; the daily run rebuilds it after the credential reference; the Exhibits List's finder and
title drawer read it. Standard library only.

    python3 kb/_build_exhibit_cert_links.py           # write
    python3 kb/_build_exhibit_cert_links.py --check   # exit 1 when the file on disk is stale
"""
import importlib.util
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = ROOT / "kb" / "it_ai_credential_catalog.json"
REFERENCE = ROOT / "credential_reference_data.js"
OUT = ROOT / "kb" / "exhibit_cert_links.json"
ASE_ISSUER = "National Institute for Automotive Service Excellence"


def ase_names():
    spec = importlib.util.spec_from_file_location("sweep", ROOT / "kb" / "_sweep_exhibit_titles.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ASE


def load_reference():
    text = REFERENCE.read_text(encoding="utf-8")
    data = json.loads(text[text.index("{"):text.rstrip().rstrip(";").rindex("}") + 1])
    return data["unified_titles"], data.get("_generated_at")


def catalog_ase():
    """ASE's tests in the catalog, by test code; a code listed twice keeps its lowest id and names the rest."""
    rows = json.loads(CATALOG.read_text(encoding="utf-8"))["credentials"]
    by_code, dupes = {}, {}
    for r in sorted(rows, key=lambda r: (len(r["id"]), r["id"])):
        if not r.get("issuer", "").startswith(ASE_ISSUER):
            continue
        m = re.search(r" - ([A-Z]{1,3}\d{1,2})\b", r.get("name", ""))
        if not m:
            continue
        code = m.group(1)
        if code in by_code:
            dupes.setdefault(code, [by_code[code]["id"]]).append(r["id"])
            continue
        by_code[code] = {"id": r["id"], "name": r["name"], "issuer": r["issuer"]}
    return by_code, dupes


CODE = re.compile(r"\b([A-Z]{1,3}\d{1,2})\b")
FILLER = {"certification", "any", "bundle", "and"}
RANGE = re.compile(r"\b([A-Z]{1,2})(\d{1,2})\s*[–-]\s*(?:[A-Z]{1,2})?(\d{1,2})\b")


def build():
    names = ase_names()
    by_code, dupes = catalog_ase()
    rows, generated = load_reference()
    certs, links = {}, {}
    unmatched_codes = set()

    def cert_for(code):
        c = by_code.get(code)
        if not c:
            unmatched_codes.add(code)
            return None
        certs[c["id"]] = {"code": code, "name": names.get(code) or c["name"], "catalog_name": c["name"],
                          "issuer": ASE_ISSUER, "family": "ASE"}
        return c["id"]

    for r in rows:
        ut = r.get("ut") or ""
        if re.match(r"^ASE\b", ut):
            body = re.sub(r"^ASE\s*(Bundle)?\s*[—–-]?\s*", "", ut)
            # The tests named: ranges first (A1–A8 is A1 to A8), then single codes, anywhere in the title.
            found, rest = [], body
            for m in RANGE.finditer(body):
                found += [m.group(1) + str(n) for n in range(int(m.group(2)), int(m.group(3)) + 1)]
            rest = RANGE.sub(" ", body)
            found += [m.group(1) for m in CODE.finditer(rest)]
            ids, unresolved = [], []
            for code in dict.fromkeys(found):
                if code not in names:
                    continue
                cid = cert_for(code)
                if cid:
                    if cid not in ids:
                        ids.append(cid)
                else:
                    unresolved.append(code + " (an ASE test the catalog does not list)")
            # Words in the code list that name no ASE test: another family's cert, kept for that family.
            head = re.split(r"\s+[—–]\s+", body)[0]
            for part in re.split(r"[,+()]|\bor\b", RANGE.sub(" ", head)):
                part = part.strip(" .")
                if part and not CODE.search(part) and part.lower() not in FILLER:
                    unresolved.append(part + " (not in the catalog)" if not ids and part == head.strip() else part)
            if ids or unresolved:
                links[ut] = {"relation": "holds", "rule": "any" if re.search(r"\b(?:or|any)\b", head) else "all", "certs": ids}
                if unresolved:
                    links[ut]["unresolved"] = unresolved
            continue
        m = re.search(r"\(ASE\s+([A-Z]{1,3}\d{1,2})\b[^)]*\)", ut)
        if m and m.group(1) in names:
            cid = cert_for(m.group(1))
            if cid:
                links[ut] = {"relation": "aligned", "rule": "all", "certs": [cid]}

    holds = [u for u, l in links.items() if l["relation"] == "holds"]
    bundles = [u for u in holds if len(links[u]["certs"]) > 1]
    return {
        "schema": 1,
        "_what": "Which certifications each canonical exhibit title holds (or is aligned to), by the industry credential "
                 "catalog's ids. Built by kb/_build_exhibit_cert_links.py; its docstring states the rules. Families: ASE.",
        "_reference_generated_at": generated,
        "counts": {"certs_linked": len(certs), "titles_linked": len(links), "holds": len(holds), "bundles": len(bundles),
                   "aligned": len(links) - len(holds), "codes_not_in_catalog": sorted(unmatched_codes)},
        "catalog_duplicates": dupes,
        "certs": dict(sorted(certs.items())),
        "links": dict(sorted(links.items())),
    }


def main():
    data = build()
    text = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("kb/exhibit_cert_links.json is STALE — run: python3 kb/_build_exhibit_cert_links.py")
            sys.exit(1)
        print("kb/exhibit_cert_links.json ok")
        return
    OUT.write_text(text, encoding="utf-8")
    c = data["counts"]
    print(f"wrote {OUT.relative_to(ROOT)}: {c['titles_linked']} titles to {c['certs_linked']} certs "
          f"({c['holds']} hold, {c['bundles']} bundles, {c['aligned']} aligned); not in the catalog: {c['codes_not_in_catalog']}")


if __name__ == "__main__":
    main()
