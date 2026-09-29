---
title: Sandbox college rows removed from Sierra's corpus
date: 2026-08-23
tags: [college-identity, sierra, data-quality, receipt]
kb-status: internal
---

# Removing MAP's sandbox colleges from `chatbox_college_profiles`

**What.** Three rows deleted from `public.chatbox_college_profiles` on 2026-08-23.
They are MAP sandbox organizations — colleges that do not exist — and Sierra
reads this table through the Edge Function's service-role key, so she could name
them to a student.

**Why it was not caught by the existing filter.** `map_colleges.entity_kind`
is the suppress field (`#1171`), and it works only for rows that are IN
`map_colleges`. Of the three, `CabTest College` and `SantTest Ana College` are
there and correctly flagged `entity_kind='test'`; **`Las PosTest College` has no
`map_colleges` row at all**, so no join to the suppress field could ever have
reached it. That is the shape of the whole finding: the filter is keyed on a
table the offending row is absent from.

**⚠️ The To-Do feed described these as empty, and the STATS are — 0 exhibits, 0
credit recommendations, 0 disciplines. The `contacts` block is not.** Each row
carried a real named person and a real work mailbox at the college the sandbox
row was cloned from (Cabrillo, Las Positas, Santa Ana), one with a phone number.
The published-email question is settled (Sam, 2026-08-19: college staff emails
are public data), so this is not a leak — it is a routing error. A student asking
Sierra about "Las PosTest College" would have been handed a real coordinator
under the name of a college that does not exist.

**Reversible.** The exact rows are below. `chatbox_college_profiles` is not
rebuilt by any job in this repo (130 rows, oldest `2026-04-18`, newest
`2026-06-25`), so nothing will re-insert them — and equally, nothing will
re-delete them if they are restored.

```json
[
  {"id":"84fb44ac-b582-4703-85ea-e4f4ad808626","college":"CabTest College","total_exhibits":0,"total_credit_recs":0,"discipline_count":0,"disciplines":[],"cpl_types":{},"cpl_modes":{},"sample_exhibits":[],"contacts":{"cpl_counselor":"Motoko Nakazawa-Hewitt","cpl_coordinator":"Sara Decelle","primary_contact":"Sara Decelle","cpl_counselor_email":"monakaza@cabrillo.edu","cpl_coordinator_email":"sadecell@cabrillo.edu","primary_contact_email":"sadecell@cabrillo.edu","primary_contact_phone":""},"credit_distribution":{},"updated_at":"2026-04-18 21:34:46.617421+00","landing_page_url":null},
  {"id":"87a03b94-04b3-4438-8727-cf49a6f15360","college":"Las PosTest College","total_exhibits":0,"total_credit_recs":0,"discipline_count":0,"disciplines":[],"cpl_types":{},"cpl_modes":{},"sample_exhibits":[],"contacts":{"cpl_counselor":"","cpl_coordinator":"Jeff Weichert","primary_contact":"Jeff Weichert","cpl_counselor_email":"","cpl_coordinator_email":"jweichert@laspositascollege.edu","primary_contact_email":"jweichert@laspositascollege.edu","primary_contact_phone":""},"credit_distribution":{},"updated_at":"2026-04-18 21:38:03.524916+00","landing_page_url":null},
  {"id":"7c12f7ba-256c-4a7d-9e5b-b5a897a857f1","college":"SantTest Ana College","total_exhibits":0,"total_credit_recs":0,"discipline_count":0,"disciplines":[],"cpl_types":{},"cpl_modes":{},"sample_exhibits":[],"contacts":{"cpl_counselor":"Daniel Peraza","cpl_coordinator":"Suzanne Freeman","primary_contact":"Matthew Morin","cpl_counselor_email":"peraza_daniel@sac.edu","cpl_coordinator_email":"freeman_suzanne@sac.edu","primary_contact_email":"Morin_Matthew@sac.edu","primary_contact_phone":"999-999-9999"},"credit_distribution":{},"updated_at":"2026-04-18 21:41:57.473401+00","landing_page_url":null}
]
```

**What was deliberately NOT deleted.** The identity lint also reports
`CA MAP INITIATIVE COLLEGE`, `Pima Medical Institute` and `Sage College` as
resolving to no identity in the same table. Those are not obviously sandbox rows
— two are plausibly real private institutions — and deciding what they are is a
curator's call, not a session's. They stay as findings, which is what the lint is
for.

**Still open — the durable half.** This is a data fix; nothing in `cpl-chat`
would stop an equivalent row arriving tomorrow. The structural guard is for the
Edge Function to refuse to surface a college that is absent from (or flagged
`test` in) the authoritative `map_colleges` roster. It is not built here because
it needs a deploy and a smoke verification, and Sierra was down for the whole of
this run.
