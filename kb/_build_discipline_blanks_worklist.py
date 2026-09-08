#!/usr/bin/env python3
"""The discipline-blank worklist — the identities `discipline_edge_fill()` cannot reach.

Sam's ruling of 2026-09-08 (the subject-discipline edge sheet, item 9): leave
these blank rather than inferring a discipline from a title, and hand them to a
curator as a named list. This builds that list.

WHY A LIST AND NOT A FILL. Measured 2026-09-08 across the 50 subject codes the
93 blanks then spanned: **37 had no other identity carrying that prefix at
all**, so there is nothing to check a proposed answer against, and six more read
"unanimous" off a SINGLE row. HUMN is the worked example — its one voting
identity is *Music for Video Games and Film* (filed Music) while its three
blanks are popular-culture titles, so the unanimous reading would file three
humanities courses under Music. A discipline invented from one course title is
indistinguishable, on every surface, from one a curator chose.

⚠️ THE SUBJECT IS THE ID PREFIX, NOT `row["subj"]` (S242). That field is the
LOCAL college codes colleges typed -- freehand, multi-valued and dirty. This
reads the prefix, which is the rule `discipline_edge_fill()` and SkyView's
`subjCode()` both apply.

Each row carries what a curator needs to decide in one sitting: the code, how
many identities are waiting on it, every sampled title, and -- the part that
decides whether the answer is checkable -- what the OTHER identities sharing
that prefix are already filed under, with how many of them agree.

Read-only. Run from the repo root: `python3 kb/_build_discipline_blanks_worklist.py`
(`--check` exits 1 if the committed file is stale).
"""
import collections
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "discipline_blanks_worklist.json")

sys.path.insert(0, ROOT)


def _rows():
    src = open(os.path.join(ROOT, "unified_courses_data.js"), encoding="utf-8").read()
    m = (re.search(r"=\s*(\[.*\])\s*;?\s*$", src, re.S)
         or re.search(r"(\[\s*\{.*\}\s*\])", src, re.S))
    return json.loads(m.group(1))


def _subj(r):
    """The identity's canonical SUBJ4 — its ID PREFIX. See the module note."""
    t = str(r.get("id") or "").strip().split()
    c = t[0] if t else ""
    if c in ("M-ID", "C-ID", "CCN") and len(t) > 1:
        c = t[1]
    return c.upper()


def build():
    from excel_to_dashboard import discipline_edge_fill

    rows = _rows()
    # The vote has to be taken BEFORE the fill, or the fill's own answers vote.
    votes = collections.defaultdict(collections.Counter)
    for r in rows:
        if r.get("disc"):
            votes[_subj(r)][r["disc"]] += 1

    stats = discipline_edge_fill(rows, HERE)
    left = [r for r in rows if not r.get("disc")]
    by = collections.defaultdict(list)
    for r in left:
        by[_subj(r)].append(r)

    out = []
    for code in sorted(by, key=lambda c: (-len(by[c]), c)):
        v = votes.get(code) or collections.Counter()
        total = sum(v.values())
        top, n = v.most_common(1)[0] if total else (None, 0)
        # ⚠️ A "unanimous" reading off one row is not a vote — say how many
        # voted, never just the share, or one row reads as 100% agreement.
        out.append({
            "subj4": code,
            "identities_blank": len(by[code]),
            "ids": [r.get("id") for r in by[code]],
            "titles": [(r.get("title") or "") for r in by[code]],
            "same_prefix_identities": total,
            "they_are_filed_under": top,
            "how_many_agree": n,
            "corroboration": ("none — no other identity carries this prefix" if not total
                             else "a single row, which is not a vote" if total == 1
                             else "%d of %d identities" % (n, total)),
        })
    doc = {
        "_about": ("Identities carrying no discipline after discipline_edge_fill(). "
                   "Sam's ruling of 2026-09-08 (sheet item 9): a curator pass, not a fill."),
        "_generated_by": "kb/_build_discipline_blanks_worklist.py",
        "_read_this_first": ("`corroboration` is the column that matters. Where it says "
                            "none, or a single row, there is nothing in the payload to check "
                            "a proposed discipline against — that is why these are here."),
        "_counts": {
            "blank_after_fill": stats["blank_after"],
            "subject_codes": len(out),
            "codes_with_no_corroboration": sum(1 for r in out if not r["same_prefix_identities"]),
            "codes_corroborated_by_one_row": sum(1 for r in out if r["same_prefix_identities"] == 1),
            "filled_from_the_subject_map": stats["filled_map"],
            "filled_from_the_identifier_reference": stats["filled_ref"],
        },
        "subjects": out,
    }
    return doc


def main(argv):
    doc = build()
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if "--check" in argv:
        if not os.path.exists(OUT) or open(OUT, encoding="utf-8").read() != text:
            print("discipline blanks worklist is STALE — run: "
                  "python3 kb/_build_discipline_blanks_worklist.py")
            return 1
        print("discipline blanks worklist is current")
        return 0
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    c = doc["_counts"]
    print("wrote %s — %d identities across %d subject codes; %d codes have NO corroboration, "
          "%d have a single row" % (OUT, c["blank_after_fill"], c["subject_codes"],
                                    c["codes_with_no_corroboration"],
                                    c["codes_corroborated_by_one_row"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
