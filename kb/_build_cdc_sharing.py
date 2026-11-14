#!/usr/bin/env python3
"""kb/_build_cdc_sharing.py — College Data Collection's data dictionary and data-sharing card (#3310 item 4).

One hand-kept file, kb/cdc_data_dictionary.json, defines every field a college's CDC page shows: its definition, its
source system, its COMIS element where the repo records one, its sharing class (public; aggregate, not PII; needs an
agreement; held, not published) and the key where a public record joins one that is not public. It also lists what
COBI or MAP holds that the page does not show, the join keys and the agreements (status only, never an agreement's
text).

This builder reads that file alone, checks it, and writes two things from it:

  kb/status/cdc_sharing.json         read by commons_data_sharing.js: the college card, the statewide card and the
                                     full view at #commons/data/sharing;
  docs/reference/cdc_data_dictionary.md   the same definitions as a doc.

Both are deterministic (no clock), so --check compares them byte for byte. tests/commons_data_sharing.test.js runs
--check and fails when the page shows a field the file does not define, or the file defines one no view shows.

Usage:
  python3 kb/_build_cdc_sharing.py           # write both
  python3 kb/_build_cdc_sharing.py --check   # exit 1 when either is stale or the file breaks a rule
"""
from __future__ import annotations

import argparse
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = "kb/cdc_data_dictionary.json"
OUT_JSON = "kb/status/cdc_sharing.json"
OUT_MD = "docs/reference/cdc_data_dictionary.md"

CLASSES = ("public", "aggregate", "agreement", "held")
AGREEMENT_STATUS = ("exists", "pending", "might be needed", "not needed", "not recorded")


def load_source(root: str) -> dict:
    with open(os.path.join(root, SOURCE), encoding="utf-8") as f:
        return json.load(f)


def problems(d: dict) -> list[str]:
    """Every rule the hand-kept file breaks, in words; an empty list means it is sound."""
    out: list[str] = []
    cls = d.get("classes") or {}
    if tuple(cls.keys()) != CLASSES:
        out.append("classes must be exactly %s, in that order; found %s" % (", ".join(CLASSES), ", ".join(cls)))
    for k, v in cls.items():
        if not (v or {}).get("word") or not (v or {}).get("definition"):
            out.append("class %s needs a word and a definition" % k)
    systems = d.get("systems") or {}
    keys = {j.get("id") for j in d.get("join_keys") or []}
    agreements = d.get("agreements") or []
    seen_ids: set[str] = set()
    seen_labels: dict[str, str] = {}
    for e in d.get("elements") or []:
        i = e.get("id") or "?"
        if i in seen_ids:
            out.append("element id %s is defined twice" % i)
        seen_ids.add(i)
        for f in ("name", "definition", "system", "class"):
            if not e.get(f):
                out.append("element %s has no %s" % (i, f))
        if e.get("class") not in CLASSES:
            out.append("element %s has class %r, not one of the four" % (i, e.get("class")))
        if e.get("system") not in systems:
            out.append("element %s names system %r, which systems does not define" % (i, e.get("system")))
        if e.get("join_key") and e["join_key"] not in keys:
            out.append("element %s names join key %r, which join_keys does not define" % (i, e["join_key"]))
        if not e.get("labels"):
            out.append("element %s lists no label the page prints" % i)
        for lab in e.get("labels") or []:
            if lab in seen_labels:
                out.append("label %r belongs to both %s and %s" % (lab, seen_labels[lab], i))
            seen_labels[lab] = i
    for h in d.get("held_not_shown") or []:
        i = h.get("id") or "?"
        if i in seen_ids:
            out.append("held item id %s repeats an element id" % i)
        seen_ids.add(i)
        if h.get("class") not in CLASSES:
            out.append("held item %s has class %r, not one of the four" % (i, h.get("class")))
        if h.get("system") not in systems:
            out.append("held item %s names system %r, which systems does not define" % (i, h.get("system")))
        for f in ("name", "definition", "where", "outside_share"):
            if not h.get(f):
                out.append("held item %s has no %s" % (i, f))
    for j in d.get("join_keys") or []:
        if j.get("other_class") not in CLASSES:
            out.append("join key %s has other_class %r, not one of the four" % (j.get("id"), j.get("other_class")))
        for f in ("name", "definition", "public_side", "other_side"):
            if not j.get(f):
                out.append("join key %s has no %s" % (j.get("id"), f))
    aid: set[str] = set()
    for a in agreements:
        if a.get("id") in aid:
            out.append("agreement id %s is listed twice" % a.get("id"))
        aid.add(a.get("id"))
        if a.get("status") not in AGREEMENT_STATUS:
            out.append("agreement %s has status %r; use one of %s" % (a.get("id"), a.get("status"), ", ".join(AGREEMENT_STATUS)))
        for f in ("name", "parties", "covers"):
            if not a.get(f):
                out.append("agreement %s has no %s" % (a.get("id"), f))
    return out


def build(d: dict) -> dict:
    systems = d["systems"]
    keys = {j["id"]: j for j in d["join_keys"]}

    def counts(rows):
        return {k: sum(1 for r in rows if r["class"] == k) for k in CLASSES}

    elements = []
    for e in d["elements"]:
        elements.append({
            "id": e["id"], "name": e["name"], "labels": list(e["labels"]), "definition": e["definition"],
            "system": e["system"], "system_name": systems[e["system"]]["name"],
            "comis_element": e.get("comis_element") or "", "class": e["class"],
            "join_key": e.get("join_key") or "", "join_key_name": keys[e["join_key"]]["name"] if e.get("join_key") else "",
        })
    held = [dict(h, system_name=systems[h["system"]]["name"]) for h in d["held_not_shown"]]
    return {
        "schema": 1,
        "source": SOURCE,
        "builder": "kb/_build_cdc_sharing.py",
        "doc": OUT_MD,
        "updated": d.get("updated") or "",
        "classes": d["classes"],
        "systems": systems,
        "elements": elements,
        "held_not_shown": held,
        "join_keys": d["join_keys"],
        "agreements": d["agreements"],
        "agreement_status": list(AGREEMENT_STATUS),
        "containers": d.get("containers") or [],
        "counts": {"elements": counts(elements), "held_not_shown": counts(held),
                   "agreements": {s: sum(1 for a in d["agreements"] if a["status"] == s) for s in AGREEMENT_STATUS}},
    }


def cell(s) -> str:
    return str(s or "").replace("|", "/").replace("\n", " ")


def markdown(b: dict) -> str:
    C = b["classes"]
    L = [
        "---",
        'title: "College Data Collection: the data dictionary and data-sharing classes"',
        "created: 2026-11-14",
        "updated: %s" % (b["updated"] or "2026-11-14"),
        "tags: [reference, commons, data-dictionary, data-sharing, privacy]",
        "kb-status: internal",
        "obsidian-folder: cpl-project-tracker/reference",
        "related:",
        '  - "[[data_dictionary]]"',
        '  - "[[commons]]"',
        '  - "[[adr-student-detail-aggregate-disclosure-control]]"',
        "---",
        "",
        "# College Data Collection: the data dictionary and data-sharing classes",
        "",
        "<!-- Generated by kb/_build_cdc_sharing.py from kb/cdc_data_dictionary.json. Edit the JSON, then run the builder. -->",
        "",
        "Every field a college's page in College Data Collection (`#commons/data`) shows: what it is, the system it comes",
        "from, its COMIS element where the repo records one, who may see it, and the key where a public record joins one",
        "that is not public (#3310 item 4). The same definitions draw the card on each college's panel, the statewide card",
        "and the view at `#commons/data/sharing`. The datasets themselves, their owners and procedures are in",
        "[`data_dictionary`](data_dictionary.md).",
        "",
        "## The four classes",
        "",
    ]
    for k in CLASSES:
        L.append("- **%s.** %s" % (C[k]["word"], C[k]["definition"]))
    n = b["counts"]["elements"]
    L += ["", "## The fields the page shows", "",
          "%d fields: %s." % (len(b["elements"]), "; ".join("%d %s" % (n[k], C[k]["word"].lower()) for k in CLASSES)), "",
          "| Field | Definition | System | COMIS element | Class | Join key | Shown as |",
          "|---|---|---|---|---|---|---|"]
    for e in b["elements"]:
        L.append("| %s | %s | %s | %s | %s | %s | %s |" % (cell(e["name"]), cell(e["definition"]), cell(e["system_name"]),
                 cell(e["comis_element"]) or "none", C[e["class"]]["word"], cell(e["join_key_name"]) or "none",
                 "; ".join(cell(x) for x in e["labels"])))
    L += ["", "## Held and not shown", "",
          "What COBI or MAP holds that the page does not show, and whether an outside share would include it.", "",
          "| Item | Definition | System | Class | Where it is held | Outside share |", "|---|---|---|---|---|---|"]
    for h in b["held_not_shown"]:
        L.append("| %s | %s | %s | %s | %s | %s |" % (cell(h["name"]), cell(h["definition"]), cell(h["system_name"]),
                 C[h["class"]]["word"], cell(h["where"]), cell(h["outside_share"])))
    L += ["", "## Where public meets not public", "",
          "| Join key | Definition | Public side | Other side | Other side's class | COMIS element |", "|---|---|---|---|---|---|"]
    for j in b["join_keys"]:
        L.append("| %s | %s | %s | %s | %s | %s |" % (cell(j["name"]), cell(j["definition"]), cell(j["public_side"]),
                 cell(j["other_side"]), C[j["other_class"]]["word"],
                 (cell(j.get("comis_element")) or "none") + (" (%s)" % cell(j["comis_note"]) if j.get("comis_note") else "")))
    L += ["", "## Agreements", "",
          "Status only, never an agreement's text. A status the repo does not record reads \"not recorded\".", "",
          "| Agreement | Parties | Status | Covers | Note |", "|---|---|---|---|---|"]
    for a in b["agreements"]:
        L.append("| %s | %s | %s | %s | %s |" % (cell(a["name"]), cell(a["parties"]), a["status"], cell(a["covers"]), cell(a.get("note"))))
    L += ["", "## Systems", "", "| System | Holder | Note |", "|---|---|---|"]
    for k, s in b["systems"].items():
        L.append("| %s | %s | %s |" % (cell(s["name"]), cell(s["holder"]), cell(s.get("note"))))
    return "\n".join(L) + "\n"


def dumps(b: dict) -> str:
    return json.dumps(b, indent=1, ensure_ascii=False) + "\n"


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="exit 1 when an output is stale or the source breaks a rule")
    ap.add_argument("--root", default=ROOT)
    a = ap.parse_args(argv)
    d = load_source(a.root)
    bad = problems(d)
    if bad:
        for p in bad:
            print("cdc sharing: %s" % p, file=sys.stderr)
        return 1
    b = build(d)
    want = {OUT_JSON: dumps(b), OUT_MD: markdown(b)}
    stale = []
    for rel, text in want.items():
        path = os.path.join(a.root, rel)
        have = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        if have != text:
            if a.check:
                stale.append(rel)
            else:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(text)
    if stale:
        print("cdc sharing: stale %s; run python3 kb/_build_cdc_sharing.py" % ", ".join(stale), file=sys.stderr)
        return 1
    n = b["counts"]["elements"]
    print("cdc sharing: %d fields (%s), %d held and not shown, %d join keys, %d agreements%s" % (
        len(b["elements"]), ", ".join("%s %d" % (k, n[k]) for k in CLASSES), len(b["held_not_shown"]),
        len(b["join_keys"]), len(b["agreements"]), " (current)" if a.check else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
