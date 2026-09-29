---
title: "A locked mock's figures of record are the port's anchor test"
created: 2026-08-31
updated: 2026-08-31
tags: [kb, methodology, testing, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
---

# A locked mock's figures of record are the port's anchor test

**The claim.** When a rework ships in two stages — a reaction mock Sam locks,
then a port of the live surface — the mock's *figures of record* (the handful
of numbers its smoke test pinned) should become a real `tests/*.test.js` suite
against the LIVE model **before** any of the existing test family is triaged.
The port is then verified by the strongest available oracle first, and the
family triage becomes mechanical cleanup instead of the evidence.

**The worked case (S216, the one-pool port).** The locked full-tab mock
(`docs/visuals/2026-08-31-if-tab-simplified.html`) carried five allocation
figures of record: 118 institutions · 51 at the base · 7 at the cap · the trio
holding $482,669 by origination · $1,300,738 of noncredit shares riding
college awards. `tests/cpl_funding_one_pool.test.js` asserted them against the
ported `cpl_funding.js` — 38/40 on the first run, and both failures were the
test's own mistakes (a selector run before eligibility data loaded; a
"no carve-out text" assertion that tripped on the hero note *explaining* the
carve-out's absence). Every model figure reproduced exactly. Twenty-six older
suites were red at that moment; none of them was needed to know the port was
right.

**Why the order matters.**

1. **The mock's figures are the only oracle that is INDEPENDENT of the code
   being ported.** The old family's expectations encode the *old* model; a
   port judged by how many of them pass is being graded by the thing it
   replaces. The mock's solve was written separately, reviewed by Sam, and
   locked — disagreement with it is a finding, agreement is evidence.
2. **Know which figures are allocation-pure.** The mock's *earned* figure
   ($7,900,711) was deliberately NOT asserted: the mock scored post-clamp
   awards while the live tab's targets ride the pre-bounds entitlement, and
   the mock's own method note said the live figure "can read higher." An
   anchor test that pinned it would have manufactured a false failure. Assert
   the figures the two implementations *define identically* (the solve), and
   assert the POLICY (who earns, who advances, who reads $0) rather than the
   figure where they legitimately diverge.
3. **Then triage the family with the anchor as the tripwire.** Every fan-out
   agent porting old suites re-ran the anchor at the end; a "fix" that moved
   the model would have shown up as an anchor failure, not as a quietly
   weakened assertion.

**The companion rule — a retired mechanism's suite becomes an absence guard.**
A test file whose whole subject was retired (the lane switch, the carve-out
solve) is not deleted and not force-fitted: it becomes a compact suite
asserting the retired surfaces are GONE, naming the ruling that retired them
(R1–R11, 2026-08-31), and pointing at the successor suite. The repo already
had the pattern (`tests/cpl_funding_rural.test.js` guards the rural
carve-out's absence); the one-pool port applied it at scale. A durable
semantic ruling carried by a retired suite (the noncredit $0-never-advance
rule lived in the lane suites) must be re-homed into a living suite before
the old one is reduced — the mechanism retired; the ruling did not.
