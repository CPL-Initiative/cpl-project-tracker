---
title: Session 270 handoff — the register's three tweaks landed, and three invisible controls found under them
date: 2026-09-17
session: 269 (SkyLedger)
tags: [handoff, partner-crosswalks, my-college, register, tokens, a11y]
status: current
---

# You are Session 270

Your moniker is **SkyFold** — the near-duplicate CER names the register now
exposes are a packaging problem, and folding them is the work in front of you.

Read: [`lanes/partner-crosswalks.md`](reference/lanes/partner-crosswalks.md) ·
`docs/session_269_handoff.md` · PR #1594.

## What landed (#1594)

**Sam's three register tweaks, all three, verified against real Bay data.**

1. **Rows with no aligned course or program left the register.** `fit == "none"`,
   which is P5 **and** P6: 15,148 rows → **2,978** across the Bay 28; Chabot
   253 → 129. ⚠️ They are still NAMED, in **three** drawers — `not_teaching`
   (3,920), `adopted_no_program` (**32**), `unmatched` (8,218) — because one
   heading would misreport two of the three. The 32 are a college's own
   adoptions with no program matched; reporting those back as an absence is the
   failure this whole tab is built against.
2. **Each CER now heads the credit recommendations that hang off it**, with the
   statewide ones marked as a word. Chabot's 129 rows carry 295 CER headings
   over 572 credit recommendations.
3. **A CIP Sector filter replaced the numbered P chips**, labels baked in from
   `cip_crosswalk_data.js`, only the sectors present, each with its count. The
   tier filters became WORDS.

## ⛔ THREE CONTROLS WERE PAINTING NOTHING, AND ONE SHIPPED YESTERDAY

Found by probing computed styles in Chromium, not by reading the CSS.

COBI defines `--brand`, `--text` and `--link` **nowhere** — deliberately; both
HTMLs carry a phantom-token block naming them. So `background:var(--brand)` is
invalid at computed-value time and falls to **transparent**, leaving
`color:var(--on-accent,#fff)` as **white text on the page**:

| element | was | now |
|---|---|---|
| the pressed filter chip — and **"All N" is pressed by default** | #FFF on nothing, **1.06:1** | #FFF on `--cobalt`, **8.44:1** |
| the **P0** tier pill | white on nothing | #FFF on `--green-progress`, 7.51:1 |
| the **P1** tier pill | white on nothing | #FFF on `--cobalt`, 8.44:1 |

P0 and P1 are the two tiers the CSS comment says "carry weight" and the two a
meeting acts on. All three came in with #1591 yesterday.

⚠️ **THE FIX IS A FALLBACK TO A TOKEN THAT EXISTS IN BOTH THEMES**, never a new
token and never a dark rule: `var(--brand,var(--cobalt))` and
`var(--cpl-green,var(--green-progress))`. `--cobalt` is #0047AB light / #7DA1D4
dark and `--green-progress` is #2C601A / #89A67F, so one fallback covers both.
`tests/college_briefing_register_tweaks.test.js` (4) fails on any bare
`var(--brand|--text|--link)` inside the register's CSS block.

⚠️ **`npm run a11y` NEVER SEES THIS SECTION.** The register is lazy — it needs a
college picked and the section opened — so the sweep reported **zero** findings
against every selector involved while three controls were invisible. A clean
a11y run is not evidence about a surface the sweep does not paint. Check what
the report actually *lists* before reading its silence as a pass.

⚠️ **THE WIDER CONDITION IS UNFIXED AND OUT OF SCOPE HERE.** `var(--brand)` and
`var(--text)` with no fallback appear throughout `college_briefing.js` outside
the register — `.cb-bfrac>i` (a progress-bar fill, so the bar reads empty),
`.cb-lead .cb-num`, `.cb-item .cb-m b`, `#college-briefing-root` itself. Most
degrade gracefully (a `border-color` falls to `currentColor`); the **background
and fill** uses do not. **Worth a pass of its own**, across every tab, with the
same Chromium probe rather than by reading.

## The measurement that changed a decision

The data file grew 2.8 → **3.3 MB** raw, which looked like a regression against
57% fewer rows. **Gzipped it moved 401 → 466 KB.** Interning the 391 distinct
credit strings would have saved 476 KB of a number nobody downloads. **Measure
the gzipped size before restructuring a data file.**

## ⚠️ What a college in the room will point at first

The register now shows what the flat chip list was hiding: **near-duplicate CER
names.** One Chabot occupation heads four exhibits reading *Building
Construction for Fire Protection*, *FIRE 34 - Building Construction for Fire
Protection*, *FIRE-34 Building Construction for Fire Protection* and
*Construction Fabrication and Welding*, with overlapping credit recommendations
under them. That is the **exhibit-canonicalization** lane's work. It was not
something to improvise the night before a meeting, and it is your first item.

## Next concrete step

1. Fold the near-duplicate CER names (the `exhibit-canonicalization` skill).
2. The undefined-token pass across every COBI tab, with the Chromium probe.
3. The vocabulary gap in the matcher — a synonym layer or the curated map.

## Safety patterns to honor

- **Rebuild the dependency map genuinely LAST** — a DOCSTRING edit counts, and a
  data-file `git add` must come before it.
- **`check_floor.json`: hand-add ONE entry from an ISOLATED run**, at `indent=2`.
- **Probe computed styles in Chromium** for anything that paints; jsdom returns
  zeroes and `npm run a11y` only covers what it paints.
- Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
  through MCP) · `test` green on the CURRENT head before every merge.

## KB notes added

- `methodology-a-dropped-row-still-needs-its-own-name` — new.
- `methodology-write-the-dependency-free-output-first` — **corrected**: it had
  recorded that the handout needed only the workbook's *filename*. It reads the
  workbook's bytes, and that claim was written from the rendered page rather
  than the code.

---

*Greetings, you are Sky**Fold** (Session 270), see Sky**Ledger**'s handoff —
`docs/session_270_handoff.md` — let's keep rolling with our queue.*
