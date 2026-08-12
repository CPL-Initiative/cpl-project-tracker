---
title: A source file that abbreviates titles fakes an absence
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, data-quality, matching, absence, mis, crosswalk]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-tier-must-encode-what-you-could-not-check]]"
  - "[[docs/futuro_hth_crosswalk_lessons]]"
artifacts:
  - kb/_build_futuro_hth_crosswalk.py
  - kb/reference/cb_course_basic_fall2025.csv
---


# A source file that abbreviates titles fakes an absence

## The claim

When you match on text from an operational data file, the file's **abbreviation
and truncation conventions are part of the schema**. Matching on the full word
does not return "fewer results" — it returns **confident false absences**, which
are worse than missing rows because they close the question instead of leaving it
open.

## How it showed up

Building the Futuro Health HTH → CNA crosswalk, the statewide MIS course file
(`cb_course_basic_fall2025.csv`, 109,898 courses) was searched for
interpersonal/intercultural communication courses. The patterns wanted whole words:

| What the file actually contains | What the pattern wanted | Outcome |
|---|---|---|
| `INTERCULTURAL COMM` | `intercultural communicat` | no match |
| `Interpersonal Commun` | `interpersonal communicat` | no match |
| `BIO-ETHICS` | `bio\s*ethics` | no match (hyphen) |
| `Nrs Caring Concepts` | `nursing caring` | no match |

Six colleges were about to be reported as **"no receiving course found"** while
the canonical course sat in their catalog under an abbreviated title. The
deliverable would have told a curator that College of Alameda and LA Valley have
nothing to articulate against — a statement that is both wrong and hard to
disprove, since the natural response to "none found" is to stop looking.

## Why it survives a first fix

The abbreviation fold was applied to the **candidate-generation** patterns and the
rows still vanished. The **ranking/filter** regexes downstream had the same
`communicat` requirement, scored those titles to zero, and dropped them — an
identical symptom from a second location. **Fold the text once, at the boundary,
and route every regex through the folded form.** A per-pattern fix will be
incomplete because the same assumption is usually encoded in more than one place.

## The practice

1. **Normalise at the boundary.** One `tidy_title()`-style fold (case, hyphens,
   slashes, periods → space; collapse whitespace) applied wherever the field is
   read — not at each call site.
2. **Match on the stem the file actually writes.** `comm` not `communicat`;
   accept the abbreviation as the canonical form, since operational files are
   written to a column width, not to your regex.
3. **Never ship a "none found" you have not opened.** For every entity reporting
   zero, list its raw inventory in the relevant category by hand. Two of the six
   colleges here survived that check (Lassen and Santa Monica genuinely have no
   interpersonal/intercultural course) — which is exactly what makes the other
   four worth catching.
4. **Write the absence as a sentence that admits the limit.** Not "None found",
   but *"No matching course in the fall-2025 state file — confirm against the
   current catalog before concluding none exists."* A blank cell and a confident
   negative are both unreadable to the recipient; a phrase carrying its own
   provenance is not.

## Why this is not just a regex bug

The failure mode is asymmetric and silent. A **false positive** is loud — someone
reads "Compassion Training for Yoga Teachers" in a healthcare crosswalk and files
a complaint. A **false negative** produces a clean, plausible, shorter list that
nobody questions. Only deliberately opening the zero-rows finds it, so the check
has to be a step in the procedure rather than something you notice.
