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
const CACHE_MIN = { haiku: 2048, sonnet: 1024, opus: 1024 };

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
  const family = (/claude-(haiku|sonnet|opus)/.exec(m[1]) || [])[1];
  check("(2) the model id names a known family", !!family, m[1]);
  if (!family) return;

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
  check("(2) ⭐ …and it clears the floor for THIS family (" + family + ": "
    + CACHE_MIN[family] + ")", tokens > CACHE_MIN[family],
    tokens + " tokens vs a " + CACHE_MIN[family] + "-token minimum");
  // ⚠️ The trap is specifically that Haiku's floor is double Sonnet's, so a
  // prefix sized for Sonnet can be silently uncached on Haiku.
  check("(2) ⚠ …and the file says the floor is family-dependent",
    /2,?048 tokens/.test(SRC) && /1,?024/.test(SRC),
    "the hazard is that a prefix sized for one family caches nothing on another");
});

block("(3) reverting needs no deploy", () => {
  check("(3) ⭐ an env secret overrides the committed default",
    /Deno\.env\.get\("CPL_CHAT_MODEL"\)/.test(SRC));
  check("(3) …and the secret's name is written down for whoever sets it",
    /CPL_CHAT_MODEL/.test(SRC) && /no deploy/i.test(SRC));
  // ⚠️ A temporary change has to say it is temporary, or it becomes permanent by
  // forgetting. The comment must name what it was and why it moved.
  check("(3) ⚠ the change is labelled TEMPORARY and names what it replaced",
    /TEMPORARY/.test(SRC) && /sonnet-4-6|Sonnet 4\.6/.test(SRC));
});

block("(4) what to watch", () => {
  // The most demanding caller is not a student question. If quality degrades,
  // it degrades there first, and that belongs in the file rather than in a chat
  // message nobody will find.
  check("(4) the file names the caller most at risk from a smaller model",
    /GR area sweep/.test(SRC) && /strict JSON|JSON and nothing else/i.test(SRC));
  check("(4) ⚠ the 200K context is noted, with the largest caller measured",
    /200K/.test(SRC) && /40,000/.test(SRC));
});

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
