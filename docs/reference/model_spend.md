---
title: Model spend — what calls a model, on which key, and how to measure it
date: 2026-10-27
updated: 2026-10-27
tags: [reference, model-spend, sierra, anthropic-api, cost, governance-team-enablement]
---

# Model spend

Read this before you change how often anything calls a model, and when someone
asks where a bill comes from. Sam asked on 2026-10-27 for the test-spend steps to
become standing procedure after an API key in the Console spent heavily on
Opus 5.5 for two days. The steps for Sierra's tests are in
[`pipeline_reference`](pipeline_reference.md) §7c ("Smoke-test on a RUNNER, once
per deploy"). The incident record, with the key's name and its figures, is
private: `CPLBrain/07-session-notes/2026-10-27-api-spend-trace.md`.

## What calls a model

| Caller | Model | Key it bills | What sets it off |
|---|---|---|---|
| Sierra (`cpl-chat`; `cpl-chat-preview` during an A/B) | `claude-sonnet-5`; the `CPL_CHAT_MODEL` secret overrides | Supabase secret `ANTHROPIC_API_KEY`, Work Plan project | Every question: the public pages, COBI, the smoke test, the A/B, the health check every 3 hours |
| `program-requirements-extract` | `claude-opus-5-5` | The same Supabase secret | The harvest's extract step: a dispatch with extract=1 or an `[extract]` push. About $0.06 a program, and a re-read pays only for pages that changed |
| `cer-classify` | `claude-opus-5-5` | The same Supabase secret | `cer-procedures.yml` |
| `alt-text-draft` | `claude-sonnet-5`; the `ALT_TEXT_MODEL` secret overrides | The same Supabase secret | Remediate on the Library tab, behind the team phrase: since S517 every picture in the file as it opens (on by default, four at a time, never a QR code the page read), and *Draft from the picture* on a press; one call per picture, under 400 output tokens |
| `slide-script-draft` | `claude-sonnet-5`; the `SCRIPT_MODEL` secret, else `ALT_TEXT_MODEL`, overrides | The same Supabase secret | Remediate on the Library tab, behind the team phrase, only when the person asks for Claude's script below or in place of a deck's notes (S518): one call per slide as the report opens, four at a time, and *Redraft the script* on a press; under 700 output tokens each |
| `cpl-news-harvest` | `claude-sonnet-4-6` | The same Supabase secret | `cpl-news.yml` |
| Jev (TypeSafe) | Jev | Repo secret `TYPESAFE_API_KEY` | `typesafe-smoke.yml`, dispatch only |
| Grok (the second reader) | xAI | `XAI_API_KEY` | `second-reader.yml`, `xai-smoke.yml`, dispatch only |
| `kb/*.py` scripts naming `claude-opus-4-7` (classify, seeds, curation) | `claude-opus-4-7` | Whatever key the person running them holds | By hand |
| Claude Code sessions (terminal, IDE, desktop, web), Cowork, the queue routine | `claude-opus-5-5` | The Team plan's seats; past a seat's limits, the Team's usage credits (extra usage) when the organization enables them, under an org-wide monthly limit and per-member limits set in claude.ai Organization settings > Usage | People, Sam's routines, teammates on the same Team plan |
| Anything run with a Console API key: the API, the Agent SDK, headless `claude -p`, Managed Agents | Whatever the caller names | The linked Console organization's credits (the Team plan's monthly API credits, then purchased credits and auto-reload); everyone holding a key in that organization draws on one balance | The holder of the key |

Supabase secrets are project-wide, so every function in a project reads the same
`ANTHROPIC_API_KEY`. No code or log here can see which Console key that secret
holds (cpl-chat's own header says so). Sam's Console on 2026-10-27 showed Sierra's
Sonnet 5 traffic, the extractor's Opus 5.5 and the news harvest's Sonnet 4.6 under one
Console key, itself named `ANTHROPIC_API_KEY`, in the same Console organization as the
other keys. Every key in an organization draws on one credit balance, so another key's
runaway use can empty it and stop Sierra; a runaway key is disabled on its own, and the
balance's auto-reload stays on for her. To tie a Console key to a caller, compare
the key's hourly usage in the Console with the caller's hours in the logs below.
A model missing from a key's Console chart rules that caller out: Sierra runs
Sonnet 5, so a key whose chart shows no Sonnet 5 never pays for her.

## How to measure

**Sierra's tokens, from her own log line.** cpl-chat writes
`cpl-chat cache: model=… read=… write=… uncached_input=…` per answer. Through the
Supabase MCP `query_logs` (24-hour windows):

```sql
select toStartOfHour(timestamp) h, count() calls,
  sum(toInt64OrZero(extract(event_message,'read=([0-9]+)'))) cache_read,
  sum(toInt64OrZero(extract(event_message,'write=([0-9]+)'))) cache_write,
  sum(toInt64OrZero(extract(event_message,'uncached_input=([0-9]+)'))) uncached
from logs where source='function_logs' and event_message like 'cpl-chat cache:%'
group by h order by h
```

Price it at the model's rates (Sonnet 5: $2 per million input, $0.20 cache read,
$2.50 cache write, $10 output). The line carries no output tokens, so an estimate
has to name its output assumption. On 2026-10-26 and 27 she averaged about
30,600 uncached input tokens and $0.07 an answer.

**Who asked.** `function_edge_logs` per function id, grouped by
`request.headers.user_agent` and `request.cf.asOrganization`: `curl/8.5.0` from
Microsoft is a GitHub runner (the smoke test, the A/B, the health check); a
browser user agent is a person. `chat_interactions` rows with no `surface` and a
handful of session ids a day are the smoke test too.

**Every other function.** Count invocations in `function_edge_logs` by
`function_id` (ids from `list_edge_functions`). One invocation is about one model
call for the extractor and the classifier.

**Two bills, two places.** A Team plan's monthly API credits sit in a linked Console
organization and cover the API, the Playground, Managed Agents, the Agent SDK and
`claude -p` run with an API key; they never cover interactive Claude Code or extra usage
("Monthly API credits for Max and Team plans", support.claude.com). Interactive Claude
Code past a seat's limits draws on the Team's usage credits instead, which an owner caps
in Organization settings > Usage (an org-wide monthly limit and spend limits by user).
An agent's signature on the Console Cost page, grouped by token type: nearly all
prompt-cache reads and 5-minute cache writes, almost no uncached input (Sierra shows the
reverse). On a Console key that signature means an Agent SDK app or headless `claude -p`
holding the key, and the key's creator and last-used time on the Console's API keys page
name where to look.

**The Console.** Cost page, filtered by API key and grouped by model, is the bill
itself. A workspace spend limit can cap a key's monthly spend and send alerts at
thresholds; the Default workspace cannot carry one, so a key that needs a cap
belongs in its own workspace. Reading cost from code takes an Admin API key and
the usage and cost report endpoints, and that key belongs in a secret store,
never in a page, a mod or a repo.

## Sierra's tests

Every `run()` in `chatbox/smoke_test.sh` is one billed Sierra answer, 33 in all.
On 2026-10-26 and 27 the smoke test ran about 20 times and, with one A/B and the
health check, asked about 95% of her questions; people asked 26. The five steps
in [`pipeline_reference`](pipeline_reference.md) §7c keep the tests in proportion.
Sam, 2026-10-27, once the bill turned out to come from elsewhere: *"since sierra
is not the big culprit, let's not be drastic with her--she's doing great right
now"* — so her model, her retrieval and her code stay as they are, and the two
steps that would change her (a test key, a retrieval cap) wait for his word.
