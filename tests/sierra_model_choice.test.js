// 🤖 Which model answers Sierra, and what changing it costs.
//
//   Sam, 2026-08-25, hours after the third credit-balance outage: "set Sierra to
//   run on Haiku 4.5 rather than Opus or Sonnet? It's a temporary fix until we
//   can get our corporate billing released." (It was Sonnet 4.6, never Opus.)
//
// WHAT THIS GUARDS, and why each is here rather than left to reading:
//
//   * THE MODEL IS ONE NAMED CONSTANT, read once at the call site. A model id
//     inlined in the request body is a value nobody greps for until the bill
//     arrives.
//
//   * ⚠ PROMPT CACHING HAS A HIGHER FLOOR ON HAIKU. Sonnet caches a prefix of
//     1,024 tokens; Haiku needs 2,048. A cache_control breakpoint on a shorter
//     prefix is ACCEPTED and caches NOTHING — silently, with no error and no log
//     line. So switching model families can turn a working cache off without
//     changing a single line about caching. The `stable` block clears the higher
//     bar today; this pins the reasoning so a future trim has to confront it.
//
//   * REVERTING MUST NOT NEED A DEPLOY. The person who learns that billing is
//     restored is not the person running a session, so the override is an
//     environment secret and the committed default is the temporary state.
//
// Run from repo root: `npm test` (or `node tests/sierra_model_choice.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");

// Minimum cacheable prefix, per family. Haiku's is double Sonnet's, and that is
// the whole hazard: the number that has to be cleared changes with the model.
// ⚠️ THE CACHE FLOOR IS A PROPERTY OF THE MODEL, NOT THE FAMILY — and this
// table was keyed by family, with the wrong number for the model we actually
// run. Haiku 4.5's floor is 4,096; 2,048 is Haiku 3.5's. "opus" ranges 512
// (Opus 5) to 4,096 (Opus 4.6/4.5) ACROSS VERSIONS, so no family key can be
// right. Anthropic's published table (2026-06), and the minimum is not
// monotonic across generations:
const CACHE_MIN_BY_MODEL = [
  [/^claude-(opus-5|fable-5-1|mythos-5-1|fable-5|mythos-5)\b/, 512],
  [/^claude-(opus-4-8|sonnet-5|sonnet-4-6|sonnet-4-5|opus-4-1|opus-4|sonnet-4)\b/, 1024],
  [/^claude-(opus-4-7|haiku-3-5)\b/, 2048],
  [/^claude-(opus-4-6|opus-4-5|haiku-4-5)\b/, 4096],
];
// ⚠️ FAIL CLOSED on an id this table does not know. Returning a permissive
// default is how the old constant passed: it asserted a floor the running model
// does not have, so the check was green while the prefix cached nothing.
function cacheMinFor(id) {
  for (const [re, min] of CACHE_MIN_BY_MODEL) if (re.test(id)) return min;
  return null;
}

block("(1) one constant", () => {
  const m = /const MODEL = Deno\.env\.get\("CPL_CHAT_MODEL"\) \|\| "([^"]+)";/.exec(SRC);
  check("(1) ⭐ the model is one named constant with an env override", !!m,
    "MODEL constant not found in the expected shape");
  if (!m) return;
  check("(1) …and the request body reads that constant, not a literal",
    /\bmodel: MODEL,/.test(SRC));
  check("(1) ⚠ no model id is inlined anywhere else",
    (SRC.match(/model:\s*"claude-/g) || []).length === 0,
    "an inlined model id is a value nobody greps for until the bill arrives");
  check("(1) the default is a real, current model id",
    /^claude-(haiku|sonnet|opus)-\d/.test(m[1]), m[1]);
});

block("(2) the cache floor moves with the family", () => {
  const m = /const MODEL = Deno\.env\.get\("CPL_CHAT_MODEL"\) \|\| "([^"]+)";/.exec(SRC);
  if (!m) return check("(2) model constant readable", false);
  const floor = cacheMinFor(m[1]);
  check("(2) ⭐ the configured model id has a KNOWN cache floor", floor !== null,
    m[1] + " is not in the published floor table — add it rather than guessing, "
    + "or this check asserts a floor the running model may not have");
  if (floor === null) return;

  // The breakpoint must still exist — this is what we are reasoning about.
  check("(2) the stable block still carries the cache breakpoint",
    /text: systemPrompt\.stable,\s*\n\s*cache_control: \{ type: "ephemeral" \}/.test(SRC));

  // ⚠️ The comment states the stable block's size. That number is the only
  // record of whether the breakpoint pays, so it must BE there and must clear
  // the floor for the family actually configured.
  // ⚠️ ANCHORED TO THE SENTENCE THAT SAYS WHAT IS BEING MEASURED, not to the
  // first "~N tokens" in the file. There are five such figures in index.ts and
  // one of them is 242 — a loose match reads whichever happens to come first,
  // which is a different number every time someone adds a comment above.
  const sz = /`stable`[\s\S]{0,60}?block is ~([\d,]+) tokens/.exec(SRC);
  check("(2) ⭐ the stable block's size is written down", !!sz,
    "without it, nobody can tell whether the cache breakpoint does anything");
  if (!sz) return;
  const tokens = Number(sz[1].replace(/,/g, ""));
  check("(2) ⭐ …and it clears the floor for THIS MODEL (" + m[1] + ": "
    + floor + ")", tokens > floor,
    tokens + " tokens vs a " + floor + "-token minimum — the breakpoint is "
    + "accepted and caches NOTHING, silently (cache_creation_input_tokens: 0)");
  // ⚠️ The size is an estimate from a character count (12,938 chars / 4), never
  // a count_tokens measurement, and it sits near Haiku 4.5's real floor. The
  // only decisive evidence is usage.cache_read_input_tokens on a live request.
  check("(2) ⚠ …and the file says the floor is MODEL-dependent, not family-",
    /model-dependent|per-model|4,?096/.test(SRC),
    "a prefix sized for one model caches nothing on another — including within "
    + "one family, where Opus ranges 512 to 4,096 across versions");
});

block("(3) reverting needs no deploy", () => {
  check("(3) ⭐ an env secret overrides the committed default",
    /Deno\.env\.get\("CPL_CHAT_MODEL"\)/.test(SRC));
  check("(3) …and the secret's name is written down for whoever sets it",
    /CPL_CHAT_MODEL/.test(SRC) && /no deploy/i.test(SRC));
  // ⚠️ THIS CHECK USED TO READ "the change is labelled TEMPORARY and names what
  // it replaced", and it did its job: the 2026-08-25 Haiku switch said it was
  // temporary, so it did not become permanent by forgetting — it was reverted on
  // 2026-09-10 when the corporate account landed, the condition Sam set himself.
  // A check that pins a past state has to move when the state does, or it fails
  // for being RIGHT.
  //
  // What is worth pinning now is the EXPENSIVE LESSON from that window, because
  // the next cost push will reach for a smaller model again: a cache breakpoint
  // on a prefix below the model's floor is accepted and caches NOTHING, silently.
  // Sierra ran that way for weeks because the floor was recorded per-FAMILY with
  // Haiku 3.5's number. Keep the worked example in the file.
  check("(3) ⚠ the Haiku episode and its floor survive as the worked example",
    /Haiku 4\.5/.test(SRC) && /4,?096/.test(SRC),
    "the next model switch needs to see that a sub-floor prefix caches nothing");
});

block("(4) what to watch", () => {
  // The most demanding caller is not a student question. If quality degrades,
  // it degrades there first, and that belongs in the file rather than in a chat
  // message nobody will find.
  check("(4) the file names the caller most at risk from a smaller model",
    /GR area sweep/.test(SRC) && /strict JSON|JSON and nothing else/i.test(SRC));
  // ⚠️ THIS CHECK PINNED "200K" AND SO IT PASSED WHILE THE CLAIM WENT FALSE.
  // 200K is Haiku 4.5's ceiling; Sonnet 5 is 1M. The check could not tell the
  // difference because it matched a literal instead of asking whether the stated
  // window belongs to the configured model. Assert the pairing.
  const CONTEXT = [
    [/^claude-(opus-5|fable-5|mythos-5|fable-5-1|mythos-5-1|opus-4-8|opus-4-7|opus-4-6|sonnet-5|sonnet-4-6)\b/, "1M"],
    [/^claude-haiku-4-5\b/, "200K"],
  ];
  const mm = /const MODEL = Deno\.env\.get\("CPL_CHAT_MODEL"\) \|\| "([^"]+)";/.exec(SRC);
  const id = mm ? mm[1] : "";
  const want = (CONTEXT.find(([re]) => re.test(id)) || [])[1];
  // ⚠️ ANCHORED TO THE DECLARATION, NOT TO THE STRING ANYWHERE IN THE FILE. The
  // first version tested new RegExp(want).test(SRC) and passed while the claim
  // was false, because the historical note QUOTES the old "CONTEXT IS 200K, NOT
  // 1M" line — so "1M" matched a sentence saying the opposite. index.ts warns
  // about exactly this for the stable-block size; the same trap, two blocks down.
  const decl = /CONTEXT IS ([0-9]+[KM])\b/.exec(SRC);
  check("(4) ⭐ the file DECLARES a context window in a parseable form", !!decl,
    "expected a line reading 'CONTEXT IS <n>K|M' — without it this cannot be checked");
  check("(4) ⭐ …and the declared window is the CONFIGURED model's",
    !!want && !!decl && decl[1] === want,
    want ? id + " has a " + want + " window; the file declares "
           + (decl ? decl[1] : "nothing")
         : id + " is not in the context table — add it rather than guessing");
  check("(4) …and the largest caller is still measured, not asserted",
    /40,000/.test(SRC));
});

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
