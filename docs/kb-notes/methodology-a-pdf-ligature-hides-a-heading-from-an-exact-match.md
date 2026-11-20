---
title: A PDF ligature hides a heading from an exact match
created: 2026-11-20
updated: 2026-11-20
tags: [methodology, program-requirements, catalog-harvest, pdf]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[program_requirements_harvest_lessons]]"
  - "[[methodology-a-lead-in-sentence-is-not-a-section-heading]]"
artifacts:
  - kb/_reader_page_checks.py
  - kb/_program_requirements_score.py
  - tests/reader_page_checks_test.py
---

# A PDF ligature hides a heading from an exact match

> A catalog PDF's text can print *Certificate* with the fi ligature, or with a stand-in glyph and a stray space, so a reader that matches a program's heading word for word refuses the program's own page; every reader of that text folds it first, with one shared table, imported and never copied.

## Context

The program requirements harvest finds each program's page in a college's catalog by its title and award heading. Rule A of the reader's page checks (`kb/_reader_page_checks.py`) refuses a page that does not print the program's own heading, so the harvest never pays to extract a wrong page. Santa Rosa Junior's catalog PDF prints every certificate heading with the fi ligature (U+FB01): *298 CS Web and Mobile Full-Stack (Certiﬁcate of Achievement)*. No award pattern read *Certiﬁcate*, and on 2026-11-19 rule A refused 34 programs there, 31 of them certificates. Each refusal looked like a catalog that never printed the program.

## The claim

**Text extracted from a PDF is not the text a person reads.** Fonts map ligatures (ﬀ ﬁ ﬂ ﬃ ﬄ) to single code points, and some catalogs print stand-in glyphs with a space after them: Solano's *AccounƟ ng CerƟ ﬁ cate* uses Ɵ for ti, and other pages use Ʃ for tt and Ō for ft. A heading match on that text fails without an error. The page is refused, the record files as not found, and nothing on the record says why.

**Fold before you match, with the table the rest of the pipeline uses.** The scorer learned the stand-in glyphs in October (S405, at Solano and Santa Rosa). The page checks, written later, matched without them, so the same failure returned in a second reader of the same text. #3587 imports the scorer's `_LIGATURES` and `_LIGATURE_SPACED`; a copied table drifts, and the import makes one fix reach every reader.

**Keep the line count.** The fold replaces glyphs inside a line, so a heading's offset stays the page's own and the page number a record cites stays right.

**Drop the stray space only where the page shows the stand-in font.** Real ligatures keep their spacing (*Staﬀ Development*), and Ō inside a real name is a macron (#3590, after COBIx's review of #3587).

## How we got here

S689's free page reads (capture-only runs on `claude/s689-read-*`, 2026-11-20) found the 34 refusals at Santa Rosa Junior. The second reader's replay over 4,705 filed PDF windows at 31 colleges found 203 refusals that rule A accepts once the text is folded, every one on the program's own title and award, none wrong; rule D's title check changed 3, each right (*Ofﬁce*, *Ofﬁcer*). Over Solano's 151 filed openings, rule A reads 21 with the scorer's table and 9 with a fold of the real ligatures alone. Santa Rosa Junior's fresh capture and extract (run 44701011374, $4.22) then found the program's own page for 22 of its 34 refusals.

## When this applies (and when it doesn't)

It applies to any matcher over PDF-extracted text: program headings, course titles, outline sections, exhibit titles. It is a property of a catalog's fonts. On `main`'s 4,903 filed PDF windows (2026-11-20) the ligature and stand-in text sits at four colleges of 33 (Cañada, College of the Desert, Santa Rosa Junior and Solano), so a college whose filed text shows none is unlikely to gain from the fold. HTML catalogs print real letters and need none of it.

## See also

- `docs/program_requirements_harvest_lessons.md`, *S689*; `docs/program_requirements_harvest_lessons_archive_3.md`, *S405* (the scorer's stand-in reading)
- PRs #3587 (the fold and the refusal mark) and #3590 (the follow-ups)
- `tests/reader_page_checks_test.py`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
