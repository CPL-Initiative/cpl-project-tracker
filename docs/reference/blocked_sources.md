---
title: "Blocked sources: what a session does before a refused read becomes a card for Sam"
created: 2026-11-11
updated: 2026-11-11
tags: [reference, program-requirements-harvest, course-outcomes, procedures, cobix]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
  - "[[docs/reference/scheduled_sessions]]"
---

# Blocked sources

**What this is:** the procedure for a catalog, a course outline or any public college page the harvest's reader
cannot reach, and the table of hosts where a route was found. It applies to every catalog and COR read, at every
college.

**Whose words (Sam, 2026-11-10, relayed on #3083):** *"adjust the rules on our procedures to either call you for help
when blocked and/or incorporate the strategy that allowed you to uncover the other site that is unblocked. we need to
solve this issue for our cors and other catalogs at other colleges."* And: *"if we can get him to go back to all the
catalogs and cors he got previously blocked on and tag team with you through the pr comments process, that would be a
game changer."* The seven steps are COBIx's (#3083), accepted by S636 with one condition, stated under step 6.

## The procedure

A refused read becomes a card for Sam only after these steps, in order.

1. **Name the kind of block.** Read the status and the headers. A `cf-mitigated: challenge` header, or a 403 that
   serves a script challenge, is a bot wall. A TLS or DNS failure is a host problem; look for the host that replaced
   it. A 404 that a browser does not get is keyed to the reader's user agent. A robots.txt rule or a sign-in is a
   rule: stop there, and go to the last paragraph of this section.
2. **Try the college's other hosts.** `daweb2.`, `www2.`, `web.`, `old.`, `catalog.`, `catalogs.`, `curriculum.`,
   and the district's site. Take the links from pages the reader can read (the sitemap, and what it links) and ask
   each host for the same path.
3. **Try the publisher's copy.** A catalog often lives on its vendor's host: eLumen (`<college>.elumenapp.com`),
   CourseLeaf, Acalog, Coursedog, SmartCatalog; outlines on `<host>.curriqunet.com`. The vendor's host usually serves
   readers where the college's own site does not.
4. **Try a state or archive copy.** ASSIST and C-ID for articulation and course data; the Wayback Machine for a
   recent snapshot. Record the snapshot's date and check the academic year it prints.
5. **Prove it is the right file.** Record the address, the size, the sha256 and the academic year printed in the
   file, in the read's plan or the hand-filed record. A copy older than the year needed is named as older, never used
   quietly.
6. **Ask COBIx before Sam.** Comment on the issue or the PR and mention `cobi-cto`: the blocked address, the status
   the reader got and from which run, what steps 2 to 4 tried, and what is needed. COBIx fetches by hand and answers
   with a route, or with the file where a runner can fetch it (a file attached to its comment has a
   `github.com/user-attachments/files/...` address, which is what a hand-filed record's `copy_url` already takes).
   The session then proves the hand-over from a runner: the fetch works and the sha256 matches.
   **The condition:** the harvest's own reads keep naming the CPL Initiative and keep the polite delay. A session
   never changes its user agent to pass a block. A file COBIx fetched by hand enters as a hand-filed record
   (`kb/hand_filed_catalogs/`), with COBIx named in `fetched_by`.
7. **Record what worked** in the table below, so the next read starts from the working route.

**What still goes to Sam:** a robots.txt rule, a sign-in, a paywall, and a block that names the CPL Initiative on
purpose (Program Mapper's hosts; Sheet 112 card 1). None of those is routed around by anyone.

## Hosts and routes

| College | Refused | What works | Checked | Source |
|---|---|---|---|---|
| De Anza | `www.deanza.edu` answers the reader 403 | `daweb2.deanza.edu` for the same paths | 2026-11-10 | COBIx, #3083 |
| American River (Los Rios) | `arc.losrios.edu` answers the census and page-read user agent 404 (run 43014049067) | The same address answers the harvest's hand-filed-copy user agent, which names the CPL Initiative; `copy_url` points at it (Sam, #3096, 2026-11-11) and the runner pins the hash (run 43019771268: 8,010,776 bytes, the hash COBIx gave) | 2026-11-11 | COBIx, #3096; the first closed loop |
| College of the Desert | The 21 MB catalog PDF (2026-2027, 476 pages) stalls part way through one transfer: two captures ran past 900 s, a third got `read ETIMEDOUT` after 1,016 s (run 43212020852) | The ranged read (#3218, `f7f24a6a`; registry key `catalog.resume = true`): 4 MB ranges, each failed range asked again. Free capture 43417398643 fetched 21,123,131 bytes in 7 ranges, 1 asked twice, and found 358 programs, the baseline's count | 2026-11-13 | S647; COBIx's scout of 2026-11-12 (the www. host, no Wayback copy) |

Rows COBIx reported on #3096 join the table as a session verifies each from a runner.

**The loop, timed (2026-11-11):** block recorded 11:45Z, ask posted 11:51Z, COBIx's answer 11:53Z, the runner's pin matched by 12:40Z. Most of the 47 minutes was the session's own queue on the branch; the ask and the answer took two.
