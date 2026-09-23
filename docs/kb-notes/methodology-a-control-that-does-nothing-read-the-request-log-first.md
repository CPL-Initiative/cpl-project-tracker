---
title: A control that does nothing — read the request log first
created: 2026-09-23
updated: 2026-09-23
tags: [methodology, debugging, supabase, curation-ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_career_attainment.test.js
---

# A control that does nothing — read the request log first

> **When a curator reports that a button "does nothing", the server's request log settles which half of the system failed before any code is read: no request means the client stopped, and a request with a status code means the server answered.**

## Context

On 2026-09-22 Sam reported that the Designate Activities button on the Implementation Funding tab's (D) card "isn't working for me". The handler replayed correctly in jsdom, and a Chromium replay sent a save. Reading the code alone produced three plausible causes and no way to choose among them. The story is in [`cpl_funding_lessons`](../cpl_funding_lessons.md) under 2026-09-23.

## The claim

A write control on a page that saves to Supabase leaves a line in the edge logs every time it reaches the server. For a "does nothing" report, that line answers the first question:

- **No request in the window.** The click never reached a save. The cause is on the client: a handler returned early, the selection was empty, the button was unbound, or the page was never signed in. Read the handler's early returns and ask which one a real person could hit.
- **A request with a 4xx status.** The server refused the save (an expired session, the curator not on the roster, RLS). The page may have rolled the edit back, and a quiet rollback looks exactly like a button that did nothing.
- **A 200, but the change is missing now.** The save landed and a later write replaced it. The funding config is saved as one whole document with the last write winning, so a second open tab still holding the older document undoes the change on its next save.

Each answer points to a different fix, and the log gives it in one query.

## How we got here

The query, run through the Supabase MCP `query_logs` tool:

```sql
select timestamp, log_attributes['request.method'] as method,
       log_attributes['response.status_code'] as status,
       log_attributes['request.path'] as path
from logs
where source = 'edge_logs'
  and log_attributes['request.path'] like '%cpl_funding_config%'
  and log_attributes['request.method'] = 'PATCH'
order by timestamp desc limit 40
```

It returned nine PATCHes, every one a 200, between 23:37 and 23:39 UTC. The last four came three seconds apart and matched the four releases then in the config (`projectGoals` of `1.4`, `3.5`, `4.2`, `4.3` set to `[]`). Nothing came after them, so the Designate click never reached `saveShared()`. The handler's one early return a person can reach is an empty selection in the multi-select list, and there the button returned without a word. It now says *"Choose one or more activities in the list, then Designate selected."* on its own card (#1662).

## When this applies (and when it doesn't)

It applies to any control that writes through PostgREST: the funding config, participation, the notes, and the curation tables. It does not reach writes that never leave the browser, such as a signed-out edit saved to the per-browser scenario, and the log cannot say which button was pressed, only that a request arrived. Check the time window against when the person says they tried. The logs keep about a day, so read them in the same session as the report.

## See also

- [`methodology-verify-an-ask-against-what-the-reader-sees`](methodology-verify-an-ask-against-what-the-reader-sees.md), the screen side of the same rule.
- `CLAUDE.md` Rule 10: the sandbox cannot reach `*.supabase.co`, so logs and SQL go through the MCP tools.
