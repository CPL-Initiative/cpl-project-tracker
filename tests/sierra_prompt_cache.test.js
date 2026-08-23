// Prompt caching on cpl-chat — the stable system block, and the proof it is stable.
//
// ⭐ WHY. Sierra used NO prompt caching: `cache_control` appeared zero times in
// the Edge Function, so ~3,200 tokens of byte-identical instruction were billed
// at full price on every single turn. Sam asked whether switching her to Haiku
// would be cheaper; measured, the model swap is the SECOND lever and this is the
// first, because it changes cost without changing which model answers.
//
// ⚠️ CACHING IS A PREFIX MATCH, AND THAT DICTATED A REORDER — this is not a
// free change and should not be described as one. The old prompt opened with a
// 968-char preamble (~242 tokens, BELOW Anthropic's ~1024-token minimum
// cacheable prefix, so a breakpoint there would have silently cached nothing)
// and closed with the rule block, after every volatile context. To have any
// cacheable prefix at all, the always-rules had to move ahead of the retrieved
// sources. Order *within* each half is preserved; the halves swap.
//
// ⚠️ AND "MOSTLY STABLE" IS NOT STABLE. A cache WRITE costs ~1.25x, so a
// breakpoint on a block that changes between requests turns a saving into a
// surcharge — invisibly, because the answers still look right. Caching the whole
// rule block would have done exactly that: it varies with the question's mode.
// Hence the always/conditional split, and hence §2 below, which does not read
// the code but RUNS the assembler across every context combination and asserts
// the stable half is byte-identical every time.
//
// Run from repo root: `npm test` (or `node tests/sierra_prompt_cache.test.js`).
const fs = require("fs");
const { stripTypes } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

// ── 1. The request actually carries a breakpoint ────────────────────────────
block("1. the request", () => {
  check("(1) ⭐ the system prompt ships as BLOCKS, not one string",
    /system:\s*\[/.test(SRC) && /\{\s*type:\s*"text",\s*text:\s*systemPrompt\.stable/.test(SRC));
  check("(1) ⭐ …with a cache breakpoint on the first block",
    /cache_control:\s*\{\s*type:\s*"ephemeral"\s*\}/.test(SRC));
  check("(1) ⚠️ …and NOT on the second — the retrieval must never be cached",
    (SRC.match(/cache_control/g) || []).length === 1,
    "a breakpoint on per-question context writes a cache entry that can never "
    + "be read again, which is the surcharge failure mode");
  check("(1) the volatile half still reaches the model",
    /\{\s*type:\s*"text",\s*text:\s*systemPrompt\.volatile\s*\}/.test(SRC));
  check("(1) ⚠️ cache hit/write is LOGGED, so a silent invalidator is visible",
    /cache_read_input_tokens/.test(SRC) && /cache_creation_input_tokens/.test(SRC)
    && /NEITHER — the breakpoint is not taking effect/.test(SRC),
    "if both counters sit at zero the feature is off and nothing else says so");
  check("(1) ⚠️ …read from message_start, where the numbers actually arrive",
    /event\.type === "message_start" && event\.message\?\.usage/.test(SRC),
    "message_delta carries output_tokens only — reading usage there reports 0 "
    + "cache activity forever and would 'prove' the cache is broken");
});

// ── 2. THE STABILITY PROOF — run the assembler, don't read it ───────────────
block("2. the stable block is byte-identical across every question mode", () => {
  const s = SRC.indexOf("const STATEWIDE_RULE");
  const e = SRC.indexOf("function buildSystemPrompt(");
  let code = stripTypes(SRC.slice(s, e))
    .replace(/^type\s+\w+\s*=\s*\{[\s\S]*?\};\s*$/gm, "")
    .replace(/^type\s+\w+\s*=\s*[^;]+;\s*$/gm, "")
    .replace(/ as \w+/g, "");
  code += "; return {RULE_DEFAULTS, assembleRules};";
  // eslint-disable-next-line no-new-func
  const M = new Function(code)();

  const combos = [];
  for (const cred of ["", "c"]) for (const vol of ["", "v"])
    for (const ali of ["", "a"]) for (const cre of ["", "k"])
      combos.push({ credentialContext: cred, volumeContext: vol,
                    alignmentContext: ali, creditContext: cre });

  const stables = new Set();
  const conditionals = new Set();
  let recombines = 0;
  for (const c of combos) {
    const r = M.assembleRules(M.RULE_DEFAULTS, null, c);
    stables.add(r.alwaysText);
    conditionals.add(r.conditionalText);
    // Nothing may be lost in the split: the two halves must together hold every
    // rule the un-split assembly emitted, and only those.
    if (r.alwaysText.length + r.conditionalText.length === r.text.length) recombines++;
  }
  check("(2) ⭐ ONE distinct stable block across all 16 context combinations",
    stables.size === 1,
    "got " + stables.size + " — the breakpoint would miss on every mode change "
    + "and each miss costs a 1.25x write");
  check("(2) …and it is not empty",
    stables.size === 1 && [...stables][0].length > 0);
  check("(2) ⚠️ the conditional half genuinely DOES vary (so the split earns itself)",
    conditionals.size > 1,
    "if the conditional half were also constant the whole rule block could have "
    + "been cached and this split would be pointless complexity");
  check("(2) ⭐ no rule text is lost or duplicated by the split",
    recombines === combos.length,
    recombines + "/" + combos.length + " combinations recombine to the original "
    + "length — a rule silently landing in neither half changes what Sierra is told");

  const stable = [...stables][0] || "";
  // 968 chars of preamble ride in front of this in buildSystemPrompt.
  const approxTokens = Math.floor((stable.length + 968) / 4);
  check("(2) ⭐ the cached prefix clears Anthropic's ~1024-token minimum",
    approxTokens >= 1024,
    "~" + approxTokens + " tokens — below the minimum a breakpoint is accepted "
    + "and silently caches NOTHING, which is the failure that looks like success");
  check("(2) ⚠️ …with real margin, not by a hair",
    approxTokens >= 2000, "~" + approxTokens + " tokens");
});

// ── 2b. The DECLARED type matches what is returned ──────────────────────────
// ⚠️ THIS CHECK EXISTS BECAUSE THE REST OF THIS SUITE CANNOT CATCH IT. Every
// test here lifts code out of index.ts through stripTypes(), which deletes type
// annotations by design — so a stale `): string {` on a function that now
// returns an object is invisible to all of them, and to `npm test` as a whole.
// Deno typechecks on deploy, so the failure surfaces at the worst moment: the
// deploy of a live public assistant. This one shipped in the working tree and
// was caught by eye, not by CI.
block("2b. declared return type", () => {
  const sig = SRC.slice(SRC.indexOf("function buildSystemPrompt("),
                        SRC.indexOf("let context = sections"));
  check("(2b) ⚠️ buildSystemPrompt is NOT still declared as returning a string",
    !/\)\s*:\s*string\s*\{/.test(sig),
    "it returns { stable, volatile } now — Deno would reject this at deploy time, "
    + "and no type-stripping test in this repo can see it");
  check("(2b) ⭐ …it declares the two-block shape",
    /\)\s*:\s*\{\s*stable:\s*string;\s*volatile:\s*string\s*\}\s*\{/.test(sig));
  check("(2b) the call site reads both halves",
    /systemPrompt\.stable/.test(SRC) && /systemPrompt\.volatile/.test(SRC));
});

// ── 3. Nothing was dropped from the prompt in the reorder ───────────────────
block("3. the reorder moved content, it did not delete it", () => {
  const fn = SRC.slice(SRC.indexOf("function buildSystemPrompt("),
                       SRC.indexOf("async function fetchLiveMetrics("));
  for (const piece of ["hostScopeBlock(hostScope)", "${context}", "${metricsContext}",
                       "${collegeContext}", "${topicContext}", "${offeringsContext}",
                       "${credentialContext}", "${volumeContext}", "${alignmentContext}",
                       "${creditContext}", "${specialInstruction}", "${audienceRule}",
                       "${teamGuidance}"]) {
    check("(3) still assembled: " + piece, fn.indexOf(piece) !== -1,
      "the reorder must move content between blocks, never drop it");
  }
  check("(3) ⭐ the always-rules are in the STABLE half",
    /\$\{assembled\.alwaysText\}/.test(fn)
    && fn.indexOf("${assembled.alwaysText}") < fn.indexOf("const volatilePart"));
  check("(3) ⭐ the conditional rules are in the VOLATILE half",
    fn.indexOf("${assembled.conditionalText}") > fn.indexOf("const volatilePart"));
  check("(3) ⚠️ the reorder is documented where the next reader will hit it",
    /THE PARTITION REORDERS THE RULES RELATIVE TO EACH OTHER/.test(SRC),
    "someone will one day wonder why portal precedes credential; the answer is "
    + "the cache boundary, and it belongs beside the code that causes it");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_prompt_cache.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
