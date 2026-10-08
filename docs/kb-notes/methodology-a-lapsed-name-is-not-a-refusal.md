---
title: "A lapsed custom name is not a refusal"
type: methodology
created: 2026-10-08
updated: 2026-10-08
tags: [kb-note, methodology, program-requirements-harvest, college-reads]
kb-status: published
related:
  - "[[program-requirements-harvest]]"
  - "[[methodology-a-site-search-needs-the-domain-filter]]"
---

# A lapsed custom name is not a refusal

**The finding.** When a college page lives on a hosted platform (LibGuides, a catalog vendor, a program-map service), the college often points a custom name at it, such as `guides.paloverde.edu`. If the college lets that name lapse, the name stops resolving while the platform keeps serving the page at its own address (`paloverde.libguides.com`). A reader that marks the custom name *gone* has recorded a DNS fact, not the absence of the page.

**The test.** Before settling a source as unreached, search for the page's title restricted to the platform's domain (`allowed_domains: ["libguides.com"]`). A hit at `<college>.<platform>.com` with the same title is the same page.

**Where the line is.** This applies to a name that does not resolve. A host that answers 403 has refused, and the reader keeps its name and never retries a refusal under another address (Sam, sheet 23 call 5; sheet 29 card 3).

**Worked example.** Palo Verde College, 2026-10-08 (S347): the Pirates Pathways guide, gone at its custom name since at least S345, answered at `paloverde.libguides.com/pathways`; two of its pages print two-year program maps (college page read run 37835928900).
