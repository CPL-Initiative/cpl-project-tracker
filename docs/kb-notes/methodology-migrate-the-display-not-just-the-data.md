---
title: Migrate the display, not just the data — a faithful migration can still lose everything that mattered
created: 2026-08-19
kb-status: published
tags: [methodology, migration, data-loss, audit, disclosure, gr]
obsidian-folder: cpl-project-tracker
artifacts:
  - gr_priorities.js
  - kb/supabase_gr_register.sql
  - tests/gr_priorities.test.js
related:
  - "[[docs/gr_register_lessons]]"
  - "[[docs/kb-notes/methodology-a-filter-needs-a-field]]"
  - "[[docs/kb-notes/methodology-a-report-must-read-the-screen-not-recompute-it]]"
---

# Migrate the display, not just the data

## The migration was faithful and still lost the point

A single-document tab became a register: three tables, a clean schema, every
field copied across, the original document left in place as a rollback copy.
Nothing was deleted, and the row count reconciled exactly.

Four things were gone from the product anyway:

- the **caveat** recording that the quoted statutory text had never been checked
  against primary sources,
- the **sequenced ask** — the briefing's actual recommendation,
- four **legal-accuracy corrections**,
- and an entire second layer: **13 priorities ranked by systemic blast radius**,
  each with a "why it matters" paragraph, which was the document's argument.

Three of the four had been migrated into the new schema and were simply never
rendered. The fourth was never migrated at all. An adversarial audit found them;
a schema diff never would, because **the schema was fine.**

## Why this happens

A rewrite has two halves and they fail differently. You migrate the *storage*
deliberately, field by field, and you can check it — counts reconcile, nothing is
null that shouldn't be. Then you rebuild the *display* from your understanding of
what the thing is for, and there is no reconciliation step at all, because a
screen has no row count.

So the loss lands entirely on the second half, and it lands hardest on whatever
you did not personally think of as content: disclaimers, provenance lines, "why
this matters" prose, secondary orderings, date stamps. Exactly the material that
is *about* the data rather than being it.

**A migration is only verified when you have enumerated what the old thing
DISPLAYED and confirmed each item is either shown or deliberately dropped.**
Write the list before you start. "It's still in the database" is not an answer —
unreachable and deleted are the same thing to a reader.

## The severity is inverted from what you would guess

The instinct is to rank the losses by size: the 13-item layer was the biggest, so
it must be the worst. It wasn't.

The worst was a single sentence. The caveat said the citations were unverified,
and dropping it turned sixteen carefully-hedged entries into sixteen confident
ones — for an audience of lawyers. Losing content makes a product smaller.
**Losing a disclaimer makes it dishonest**, and nothing on the page announces the
change, because the remaining content looks exactly as it did.

Two corollaries worth carrying:

- **A disclaimer must travel with the artifact that leaves.** The export writes a
  file that escapes the login, the row-level security and the room, as an email
  attachment. A warning rendered only on screen protects only the person who
  already had context. Put it in the file.
- **A permanent blanket disclaimer decays into an unmaintained one.** Better to
  make it a work queue — record who verified what and when, report "N of M
  verified", and let the caveat retire on evidence rather than on someone's
  say-so. That turns an apology into a plan.

## Sequencing note

The rebuild passed its own test suite at every step. The suite tested what the
new code did, which is the trap: a test written alongside a rewrite inherits the
rewrite's blind spots. The findings came from an audit prompted to enumerate what
the OLD version displayed and diff it against the new one — a question the
implementer is structurally unlikely to ask themselves, because they already
believe they know the answer.

If you rewrite a surface, make "what did the old one show?" someone else's
question.
