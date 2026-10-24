---
title: The communications register and the writer module — lessons
date: 2026-10-24
tags: [lessons, communications, letters, writer]
artifacts:
  - cpl_writer.js
  - comms.js
  - tests/cpl_writer.test.js
  - tests/comms.test.js
related:
  - "[[docs/reference/lanes/communications]]"
  - "[[docs/kb-notes/reference-cccco-house-voice]]"
---

# The communications register and the writer module — lessons

## S460 SkyFremontia (2026-10-24): the one writer module and its first three consumers

- **Each rule lives once, as a named part, and a consumer composes rather than copies.** Twelve surfaces each carried a
  hand copy of the naming rule and a model pin (four values). `cpl_writer.js` holds `NAMING_RULE`, `HOUSE_VOICE`,
  `SPELLING`, `BUSINESS_WORDS`, `FUNDING_WORDS`, the audiences and the one `MODEL`; `system({ role, extra, omit })`
  puts the consumer's role line first, the voice next, one Words paragraph, then the consumer's own paragraphs (its
  facts rule, its return format). A consumer keeps only what is its own: `comms.js` its merge fields and return
  format, `activity_summaries.js` its Activity facts and paragraph shape, `report_generator.js` its audience guide,
  altitude, data and structure.
- **One `draft()` for every surface, and it rejects with a sentence a tab can show.** No proxy on the page, the
  proxy's own error message or status, a failure without a readable body, the model declining, an answer with no
  text: each is one sentence, so every consumer's status line reads the same way. It resolves the served model too,
  so a posted row's `raw.model` names what wrote it rather than the constant.
- **The model is an unversioned alias, named in one file.** A dated pin is a latent outage on its retirement date;
  the writer's test pins one `claude-` string in its source and none in each consumer, and each port adds its surface
  to that check.
- **A module loaded two ways attaches to whichever root exists.** The repo's tests `require()` a consumer in plain
  node for its pure helpers and inject it into jsdom for its UI; the writer sets `window.CPL_WRITER` in a browser and
  `globalThis.CPL_WRITER` in node, and a consumer reads `((typeof window !== "undefined") ? window : globalThis).CPL_WRITER`.
  A jsdom test injects the writer's source before the consumer's, as the page loads it; a node test requires it first.
- **A mock proxy answer carries `type: "text"`.** The writer filters content blocks by type, as the API shapes them;
  an older mock with bare `{ text }` blocks read as no text. A failing mock carries a `json` rejection as well as
  `text`, since the writer reads the body as JSON first.
- **When a call moves into a shared module, the dependency map loses the caller's edge.** The map attributes the
  proxy host by the `CPL_REPORT_PROXY_URL` literal; a consumer that stops naming it goes invisible. A seed in
  `kb/_build_dependency_map.py`, anchored on the consumer's `W.draft(` call, keeps the tab's edge; each port adds one.
- **Rewrite the instruction that breaks its own rule.** The report structure asked for "the most impactful findings"
  while the writer bans *impactful*; the port reworded it. Read a surface's own prompt text against the rules it now
  inherits.

## S461 SkyManzanita (2026-10-24): the fourth and fifth consumers

- `college_report_generator.js` (#2403) and `annual_report.js` (#2405) now draft through the writer. The college
  report reuses `REPORT_AUDIENCES` unchanged: its six audiences matched the Custom Report's word for word, apart from
  "ROI", which the writer spells out.
- Two ports opened in parallel conflict on the same four lines: the `(6)` consumers list in `tests/cpl_writer.test.js`,
  the seed list in `kb/_build_dependency_map.py`, the lane's Next, and the naming check in
  `tests/report_session97.test.js`. Merge the first, merge `main` into the second, keep both sides and regenerate the
  map. Or run the ports one after another.
- A source-text test cannot match a rule the writer splits across string concatenations
  (`"... (MAP) " + "platform"`). Test the composed string from `W.system()` in jsdom, or match a fragment that sits
  inside one literal.
- A lazy tab that a test `eval`s (`runScripts: "outside-only"`) needs `w.eval(WRITER)` first, the same order the page
  loads them in. The proxy check moves from a load-time constant to `W.proxyUrl()`, which reads the page global when
  it is called.

## S462 SkyToyon (2026-10-24): the sixth, seventh and eighth consumers

- `raci.js` (#2407), `credential_reference.js` (#2408) and `quickstart.js` (#2409) now draft through the writer. The
  lane's named consumers are all ported; the one drafting surface left with its own pin is the KB portal's Polish
  (`kb-portal/config.js` `POLISH_MODEL`, a separate page that does not load the writer yet).
- **Read the writer at call time in a tab other tests load bare.** Ten tests `eval` `raci.js` without the writer; a
  load-time `throw` would have broken all of them for a feature none of them exercise. `writer()` and `polishReady()`
  read `window.CPL_WRITER` when called, so a page without it loses only the polish.
- **A lookup or a router takes the words, not the voice.** `W.system({ omit: [...] })` keeps the spelling and naming
  words and drops the house voice, the business words and the funding words where the answer is a name or a JSON
  route. The naming rule still applies: the router's `message` is shown to the reader.
- **A routing override is the one sanctioned second model.** `quickstart.js` keeps Haiku as `ROUTING_MODEL` and
  passes it to `W.draft(..., { model })`; the (6) check for it allows exactly one `claude-` string, where every other
  consumer's check allows none.
- **A ported call changes its failure words.** The writer rejects on a non-OK answer, so a proxy error in Suggest
  now reads "suggestion failed" where it used to read "no confident suggestion". Say it in the PR.

## S463 SkyChamise (2026-10-24): the ninth consumer, the KB portal's Polish

- `kb-portal/` (#2412) now drafts through the writer. No drafting surface keeps its own model pin; a new one starts
  as a consumer.
- **A page outside the two HTMLs loads the writer by a relative path.** Pages ships the repo root (`git archive`), so
  `kb-portal/index.html` loads `../cpl_writer.js` as a classic script before the `app.js` module, and the module reads
  `window.CPL_WRITER` at call time.
- **Pass the writer into the pure helper.** `composer_util.js` stays testable in plain node: `polishSystem(W)` takes
  the writer as an argument, and the test `require`s `cpl_writer.js` to supply it.
- **A surface's own proxy rides `opts.url`.** The portal keeps its `PROXY_URL` from `config.js` and passes it to
  `W.draft`; attachments go through `opts.messages`, since `draft()`'s one-string prompt cannot carry image blocks.
- **A test that the naming rule is honored must exclude the rule itself.** `NAMING_RULE` quotes "MAP Initiative" to
  forbid it, so the check reads the surface's role line, the text before `HOUSE_VOICE`.
- A port can find a stale rule: the portal's role line called the program "the California Community Colleges MAP
  initiative" until this port.
