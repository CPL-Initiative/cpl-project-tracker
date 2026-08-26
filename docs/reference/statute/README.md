# Primary-source statutory and regulatory text

Plain-text extractions of authenticated PDFs supplied by Sam on 2026-08-26
(`pdftotext -layout`). **These are the sources of record for the CPL register
and for any §55050 drafting.**

They are committed because sessions are **egress-blocked** from both
`leginfo.legislature.ca.gov` and `law.cornell.edu`, so a session that does not
find the text here cannot get it at all — and the register's standing caveat is
that its quoted statutory text *"was reconstructed from corroborated search
excerpts."* Nothing in this folder is reconstructed.

| file | what it is |
|---|---|
| `ec_78093_short_title.txt` | EC §78093 — names the Credit for Prior Learning Initiative |
| `ec_78093_1_definitions.txt` | EC §78093.1 — definitions: "credit for prior learning", "credit recommendation", "validated" |
| `ec_78093_2_initiative.txt` | EC §78093.2 — CO duties (a), campus duties (b), intersegmental (c), **funding (d)** |
| `t5_55050_operative.txt` | 5 CCR §55050 as it operatively reads — subdivisions (a)–(n) |
| `t5_55050_55051_final_reg_text_2026-08-12.txt` | **Final** revised reg text amending §55050 **and** §55051 — renumbers §55050 and predates Article 9. **Confirmed by Sam, 2026-08-26, as the version adopted by the Board of Governors.** |
| `t5_55050_clean_after_2026-08-12.txt` | ⭐ **The BASELINE.** The line above with every strikethrough removed — how §55050/§55051 will read once published. **Generated** by `kb/_derive_55050_clean.py`, never typed. |
| `t5_article5_proposal_2025-11-19_lee.txt` | **Sam's November 2025 Regulatory Action Proposal** — the source of the final text's renumbering, with substance the final text dropped. References **AB 123**, whose CPL provisions were enacted as SB 135. |

Article 9 was added by **Stats. 2026, Ch. 79, Sec. 16 (SB 135)**, effective
**2026-07-13**.

⚠️ The final reg text contains **zero** references to §78093 / Article 9 / SB 135
and **no** reciprocity clause. Its accessibility stamp reads 6/19/26, so the
substantive drafting predates the statute. See
[`docs/t5_55050_article9_amendments.md`](../../t5_55050_article9_amendments.md).

⚠️ The final reg text is a **redline**, and `pdftotext` drops the formatting, so
struck and inserted text run together as plain characters (`at leastminimum`,
`standardized examsexaminations`, `(ab)`). **Do not draft against it directly** —
draft against `t5_55050_clean_after_2026-08-12.txt`, which resolves every one of
those. Sam, 2026-08-26: *"disregard all the strikethrough language as that will be
pulled off when the reg is published on the web."*

⭐ **The resolution is a judgment, so it is written as a reviewable edit list**
(`kb/_derive_55050_clean.py`: 21 inline resolutions + 7 struck paragraphs, each
with its reason) applied to the extraction — not as retyped prose. Two structural
facts fall out of it and are worth knowing before you touch this section:

- the adopted subdivisions run **(a)–(m) contiguously**, with no gaps and no
  duplicates. Mis-assign a single struck-or-inserted paragraph and the letters
  collide, so the script checks it.
- adopted §55051(d) reads *"as defined in section **55050(i)**"* — the redline
  strikes `55753` and inserts `55050(i)`. **Any amendment that re-letters §55050
  breaks a cross-reference the same rulemaking just created.**

⚠️ The November 2025 proposal is **not** a filed regulation — it is the CO
workgroup proposal that preceded the final text. Its own rationale says several
clauses were written *"to align with pending 2025 trailer bill language."* That
bill is now enacted. See
[`docs/t5_55050_restore_the_2025_draft.md`](../../t5_55050_restore_the_2025_draft.md).
