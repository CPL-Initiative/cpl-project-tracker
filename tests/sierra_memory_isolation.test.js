// cpl-chat — nothing from the MEMORY surfaces reaches Sierra or the Fact Sheet.
//
// ⭐ WHY THIS FILE EXISTS. Sam, 2026-08-24, asked before the v58 deploy: "Just
// don't want wonky things from memory to show up in Sierra and Fact Sheet. If
// the results look appropriate and balanced against training, that would be
// great." The Memory tab borrows the same shared Edge Function that answers
// students on the public Sierra page, the Fact Sheet drawer, the COBI tab, My
// College, and the map.rccd.edu widget — one function, one prompt builder, one
// interactions log. So "does the memory work change Sierra's answers" is a
// question about ISOLATION, and it deserves a mechanical answer rather than a
// reading of the diff.
//
// ⚠ THE ASSERTION THIS REPLACES COULD NOT FAIL. sierra_surface.test.js (6) says
// "the surface reaches ONLY the guidance layer so far" and tests it with
// /fetchTeamGuidance\(sb, hostSurface\)/ — a PRESENCE check wearing an
// EXCLUSIVITY label. As of v58 `hostSurface` also reaches the input cap, the
// system prompt and the logging decision, and that assertion still passes. An
// assertion pinned to one member of a set cannot notice the set growing.
//
// So this file pins the SET. Every place the caller's surface is allowed to
// change behavior is listed below; a fifth consumer fails this test and has to
// be added deliberately, which is the point — widening it is a decision, and a
// decision should cost a line in a test.
//
// Run from repo root: `npm test` (or `node tests/sierra_memory_isolation.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SIERRA = fs.readFileSync("sierra/sierra.js", "utf8");
const FACTSHEET = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");
const MEMORY = fs.readFileSync("cpl_memory.js", "utf8");
const GR_PRI = fs.readFileSync("gr_priorities.js", "utf8");

// The request handler only — module-level constants above it carry the word
// `drafting` for documentation reasons and are not behavior.
const HANDLER = SRC.slice(SRC.indexOf("const hostSurface = normalizeSurface(surface)"));

/* ⚠ THE COUNT IN (2) MUST SEE CODE, NOT PROSE. This file is heavily commented
 * and three comments in the handler use the word "drafting" to explain the
 * guards. Counting those made the first cut of (2) read 10 where the code says
 * 7 — a failure that says "a fifth consumer appeared" when someone edited a
 * sentence. A guard that cries wolf on prose teaches its reader to bump the
 * number until it goes green, which is the opposite of what it is for. */
function codeOnly(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ");
}
const HANDLER_CODE = codeOnly(HANDLER);

let S = null;
block("(0)", function () {
  S = liftBlock(SRC, "const KNOWN_SURFACES", "function buildSystemPrompt(",
    ["KNOWN_SURFACES", "normalizeSurface", "DRAFTING_SURFACES", "isDraftingSurface",
     "QUERY_CAP_CHAT", "queryCapFor"]);
  check("(0) the surface/cap block lifts out of the edge function", !!(S && S.queryCapFor));
});

/* ── (1) THE CONVERSATIONAL SURFACES ARE SHAPED EXACTLY AS BEFORE ────────────
 * The deploy question in plain terms: does a Sierra request come out of this
 * function any different than it did? Every conversational surface — named,
 * absent, or unrecognized — must take the chat cap and must not be a drafting
 * caller. If this block is green, the ONLY requests v58 treats differently are
 * the two the Memory tab sends. */
block("(1)", function () {
  if (!S) return;
  const conversational = [...S.KNOWN_SURFACES].filter((x) => !S.DRAFTING_SURFACES.has(x));
  check("(1) there ARE conversational surfaces to check", conversational.length >= 4,
    "an empty list would make every assertion below vacuously true");
  check("(1) ⭐ every conversational surface keeps the chat cap",
    conversational.every((s) => S.queryCapFor(s) === S.QUERY_CAP_CHAT),
    "Sierra, the Fact Sheet drawer, the COBI tab and My College are unchanged");
  check("(1) ⭐ …and none of them is a drafting caller",
    conversational.every((s) => S.isDraftingSurface(s) === false));
  check("(1) an ABSENT surface keeps the chat cap",
    S.queryCapFor(null) === S.QUERY_CAP_CHAT && S.isDraftingSurface(null) === false,
    "the map.rccd.edu widget and the vendor iframe send no surface at all");
  check("(1) ⚠ an UNKNOWN surface cannot buy itself a bigger cap",
    S.normalizeSurface("memory-briefing-lol") === null
      && S.queryCapFor(S.normalizeSurface("memory-briefing-lol")) === S.QUERY_CAP_CHAT,
    "the gate is server-side: naming yourself is not the same as being on the list");
  check("(1) the memory surfaces DO differ, or this file guards nothing",
    [...S.DRAFTING_SURFACES].every((s) => S.queryCapFor(s) > S.QUERY_CAP_CHAT));
});

/* ── (2) THE SET OF PLACES `surface` CAN CHANGE BEHAVIOR ─────────────────────
 * The honest version of sierra_surface (6). Four consumers today; the count is
 * asserted so a fifth cannot arrive silently. */
block("(2)", function () {
  /* ⚠ EACH PATTERN ASSERTS THAT THE VALUE ARRIVES, NOT THAT IT IS LAST. The first
   * cut anchored two of these on a call's CLOSING PAREN —
   * `fetchTeamGuidance\(sb, hostSurface\)` and `queryCapFor\(hostSurface\)` —
   * which is the defect `assert-that-an-argument-arrives-not-that-it-is-last`
   * was written about: append a parameter to either call and the check goes red
   * naming a consumer that is perfectly fine. Nobody decided hostSurface must be
   * the final argument of anything. */
  const consumers = [
    ["the input cap", /const trimmedQuery = query\.trim\(\)\.slice\(0, queryCapFor\([^;]*\bhostSurface\b[^;]*\)/],
    ["the guidance filter", /fetchTeamGuidance\([^;]*\bhostSurface\b[^;]*\)/],
    ["the system prompt", /if \(drafting\) systemPrompt\.volatile \+= DRAFTING_BLOCK/],
    ["the interactions log", /if \(!drafting\) await sb\.from\("chat_interactions"\)/],
  ];
  consumers.forEach(([label, re]) =>
    check("(2) consumer present — " + label, re.test(HANDLER)));

  // Count every mention in the handler's CODE and reconcile it against the list
  // above: 4 consumers + 2 definitions (`hostSurface`, `drafting`) + the 1 use
  // of hostSurface inside the derivation = 7.
  const mentions = (HANDLER_CODE.match(/hostSurface|\bdrafting\b/g) || []).length;
  check("(2) ⭐ the surface reaches these four places and no others",
    mentions === 7,
    "found " + mentions + " code mentions, expected 7 (4 consumers + 2 definitions + 1 derivation). "
    + "If you widened the surface deliberately, add it to the list above and update this count.");
  // ⚠ And prove the stripper did not simply delete everything it was counting —
  // a codeOnly() that ate the handler would make the line above read 0 and the
  // whole block would go quiet.
  // ⚠ Anchored on the handler's OWN first line, never on one of the guards
  // above: pinning it to `systemPrompt.volatile` made a perturbation that moved
  // that line report a broken stripper as well as the real defect, which is a
  // second failure saying nothing.
  check("(2) …and the comment stripper kept the code it counts",
    /const hostSurface = normalizeSurface\(surface\);/.test(HANDLER_CODE)
      && mentions > 0 && HANDLER_CODE.length > HANDLER.length / 3);
});

/* ── (3) THE PROMPT-CACHE FORK — the channel by which memory text could ACTUALLY
 * reach a Sierra answer ───────────────────────────────────────────────────────
 * `stable` is byte-identical on every request and is the only block carrying
 * cache_control. `volatile` is rebuilt per request. Appending the drafting block
 * to `stable` would put memory-tab instructions into the cached prefix EVERY
 * caller shares — the one edit in this diff that could genuinely make Sierra
 * answer oddly. It goes in `volatile`, and that is asserted rather than trusted. */
block("(3)", function () {
  check("(3) ⭐ the drafting block is appended to `volatile`",
    /systemPrompt\.volatile \+= DRAFTING_BLOCK/.test(HANDLER));
  check("(3) ⚠ …and NEVER to `stable`",
    !/systemPrompt\.stable\s*\+=/.test(HANDLER),
    "stable is the shared cached prefix; forking it to serve one surface would reach every caller");
  check("(3) the append is guarded by `drafting`, not unconditional",
    /if \(drafting\) systemPrompt\.volatile \+= DRAFTING_BLOCK;/.test(HANDLER));
  check("(3) `stable` is still the only cached block",
    /text: systemPrompt\.stable,\s*\n\s*cache_control/.test(SRC)
      && !/text: systemPrompt\.volatile,\s*\n\s*cache_control/.test(SRC));
  check("(3) the system prompt is built INSIDE the request handler",
    /const systemPrompt = buildSystemPrompt\(/.test(HANDLER),
    "a module-level prompt object would carry one request's drafting block into the next");
});

/* ── (4) SIERRA TRAINING SEES REAL QUESTIONS ONLY ────────────────────────────
 * "Balanced against training", in Sam's words. The Gap Miner reads the newest
 * chat_interactions rows unfiltered and presents them as questions people asked
 * Sierra. A drafting call filed there reads as a question beginning "You are
 * drafting ONE internal team memory entry…" and pushes a real one off the list.
 * Three such rows exist in the live table today, written by the DEPLOYED v57;
 * this guard is what stops the briefing surface adding more. */
block("(4)", function () {
  check("(4) ⭐ a drafting call is NOT filed as a Sierra interaction",
    /if \(!drafting\) await sb\.from\("chat_interactions"\)\.insert\(/.test(HANDLER));
  check("(4) ⚠ …and there is no second, unguarded insert into that table",
    (HANDLER.match(/sb\.from\("chat_interactions"\)\.insert\(/g) || []).length === 1,
    "a second write path would re-open the channel this guard closes");
});

/* ── (5) THE CLIENT END — Sierra and the Fact Sheet never speak memory ───────
 * The server gate is the real one, but a conversational caller that started
 * sending a drafting surface would opt ITSELF into the drafting prompt. Cheap to
 * pin, and it names the two pages Sam asked about. */
block("(5)", function () {
  if (!S) return;
  const drafts = [...S.DRAFTING_SURFACES];
  check("(5) ⭐ the public Sierra page sends `public`, and no drafting surface",
    /surface: 'public'/.test(SIERRA) && drafts.every((d) => !SIERRA.includes(d)));
  check("(5) ⭐ the Fact Sheet drawer sends `fact-sheet`, and no drafting surface",
    /surface: 'fact-sheet'/.test(FACTSHEET) && drafts.every((d) => !FACTSHEET.includes(d)));
  check("(5) ⚠ neither page sends `retrieval_query`",
    !/retrieval_query/.test(SIERRA) && !/retrieval_query/.test(FACTSHEET),
    "retrieval_query REPLACES the embedded search text; on a conversational caller "
    + "that would search the knowledge base for something other than the question asked");
  check("(5) the memory tab sends it", /retrieval_query/.test(MEMORY));
  /* ⚠️ THE CLAIM IS "EVERY DRAFTING SURFACE HAS AN OWNER", NOT "THE OWNER IS
   * cpl_memory.js". This read `drafts.every((d) => MEMORY.includes(d))` while
   * the only two drafting surfaces were the memory tab's, so it was a true
   * statement about a set of size two wearing an exclusivity label. The GR
   * register's `gr-analysis` is a third, and it lives in gr_priorities.js — the
   * assertion went red for a change that was correct, which is the right
   * behaviour but the wrong claim.
   *
   * ⭐ THE ISOLATION PROPERTY IS THE ONE ABOVE: no CONVERSATIONAL page may name
   * a drafting surface. That is what stops a caller opting itself into the
   * drafting prompt, and it is checked against sierra.js and factsheet_sierra.js
   * a few lines up. What belongs here is only that nothing is orphaned: a
   * drafting surface no client sends is a prompt path with no caller, and a
   * surface sent by a file not listed here is one nobody vetted. */
  const DRAFT_OWNERS = { "memory-autogen": MEMORY, "memory-briefing": MEMORY, "gr-analysis": GR_PRI };
  check("(5) ⭐ every drafting surface is claimed by exactly one vetted client",
    drafts.every((d) => DRAFT_OWNERS[d] && DRAFT_OWNERS[d].includes(d)),
    "unowned: " + drafts.filter((d) => !(DRAFT_OWNERS[d] && DRAFT_OWNERS[d].includes(d))).join(", "));
  check("(5) ⚠ …and this list has not fallen behind DRAFTING_SURFACES",
    Object.keys(DRAFT_OWNERS).length === drafts.length,
    "owners " + Object.keys(DRAFT_OWNERS).length + " vs drafting surfaces " + drafts.length);
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_memory_isolation.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
