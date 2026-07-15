# CIP Code Taxonomy — prototype (StarCIP, 2026-07-15)

A self-contained, no-backend prototype of the **California Community Colleges
CIP Code Taxonomy** — the faculty-facing "easy button" reference for the
TOP→CIP transition (fall 2026, ESS 26-06). Built in a fast-feedback canvas
(a Claude artifact) so the CO could play with it and refine live, per the repo's
**prototype → lock → port** practice. **Not yet ported to the live dashboard.**

Live prototype (private artifact): https://claude.ai/code/artifact/cf0085e0-7df8-46e4-87a3-b1eb34c2e880

## What's here

| File | What |
|---|---|
| `build_proto.py` | Emits the self-contained `cip_reference_prototype.html` from `cip_proto_data.json`. Run: `python build_proto.py`. All UI (search, category pills, C-ID/CCN chip, family filter, the plain-English **finder**, light/dark toggle) is vanilla JS built with `createElement`/`textContent` (CodeQL-safe), scoped CSS, theme-token-driven. |
| `cip_proto_data.json` | The built dataset: 2,325 CIP rows `{code, t, cat, fam, def, ex, act, x}` + family titles. `cat` is the **certified** CTE label; `x=1` = has C-ID/CCN coursework. |
| `extract_proto_v3.py` | How `cip_proto_data.json` is built (reference — paths were session-local). Encodes the two non-obvious data rules below. |

## The two data rules the port MUST carry

1. **Category = the CERTIFIED CTE designation, not either workbook tab.**
   The CO workbook has two tabs that each carry a CTE label — *CIP Descriptions*
   and *TOP-CIP Data* (the crosswalk) — and they **disagree on 244 codes, in both
   directions** (e.g. 45.0702: Descriptions="Not CTE"/crosswalk="Both"→**Both**;
   45.0199: Descriptions="Both"/crosswalk="Not CTE"→**Both**). Neither tab is
   reliable. The authority is the CO consultant's hand-certified list, preserved at
   [`kb/reference/cip_cte_certified_260715.json`](../../kb/reference/cip_cte_certified_260715.json)
   (244 codes). Resolution: certified value for those 244; the agreed value
   elsewhere; **0 uncertified conflicts** remained.
2. **C-ID/CCN chip = a course-level FLOOR, not transferability.** A CIP is flagged
   (`x=1`) if any TOP that maps to it has courses carrying a **C-ID** (transfer-model
   articulation) **or CCN** (AB 1111 common course number), rolled up from
   `kb/reference/coci_course_list.xlsx` via the crosswalk pairs in
   `cip_crosswalk_data.js`. 292 TOPs carry a C-ID, 406 a CCN → **1,299** go-forward
   CIPs flagged. Label it by the identifier ("C-ID/CCN"), never "Transfer" — TOP→CIP
   is one-to-many so it's an association, not a guarantee (the tooltip says so).

## Data cuts

- `kb/reference/cip_searchable_260715.xlsx` — the **authoritative** CO cut
  (2026-07-15; supersedes the committed `cip_searchable_260708.xlsx`). Fixes the
  244 CTE designations + the 32.0107 broad-code issue.

## Port plan (next step, once the look is locked)

Fold the certified-designation + C-ID/CCN logic into `kb/_build_cip_crosswalk.py`,
repoint it at the 260715 cut, and rebuild the `#cip-crosswalk` tab
(`cip_crosswalk.js`) as this reference: CIP catalog as the default (crosswalk
demoted + link out to COE's hosted crosswalk), category label replacing the
provenance "source" column, the plain-English finder up top, suggest-to-curate
gated to CO-only. Then the Phase-1 Sierra upgrade (wire `/functions/v1/cpl-chat`
grounded on the CIP dataset) can replace the keyword finder. Full story:
[`docs/cip_crosswalk_lessons.md`](../cip_crosswalk_lessons.md).
