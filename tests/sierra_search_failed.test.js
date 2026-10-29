// Sierra answers with what loaded when the knowledge search fails (S519, 2026-10-29).
//
// WHY THIS TEST EXISTS
// --------------------
// Sam asked "I have a firefighter 1 certificate. what courses could I get at
// Bakersfield and for what programs?" at 19:22Z, while the daily MAP Custom
// Report load was promoting student credit to live. Every read of that turn hit
// its 5 s route time limit at once (the function log names sixteen), and the
// knowledge search's timeout returned a 500 ("Sorry, something went wrong").
// The other routes already fail safe to empty; this one now does too, and the
// model is told the data did not load, so a missing read never reads as "none"
// (the false-absences lane).
//
// Run from repo root: `npm test` (or `node tests/sierra_search_failed.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

check("⭐ a failed knowledge search no longer returns a 500",
  !/error: "Search failed"/.test(SRC) && !/console\.error\("Search error:"[\s\S]{0,200}status: 500/.test(SRC));
check("a failed search answers with no sections rather than stopping",
  /const searchFailed = !!searchResult\.error;/.test(SRC) &&
  /const sections = searchFailed \? \[\] : searchResult\.data;/.test(SRC));
check("the failure is logged, so the function log still names it",
  /if \(searchFailed\) console\.error\("Search error \(answering with what loaded\):"/.test(SRC));
check("⭐ the model is told the data did not load, after the cache breakpoint",
  /if \(searchFailed\) systemPrompt\.volatile \+= SEARCH_FAILED_NOTE;/.test(SRC));
const note = (SRC.match(/const SEARCH_FAILED_NOTE = `([\s\S]*?)`;/) || [])[1] || "";
check("⭐ the note asks her to say the data did not load, and never to call it an absence",
  /say plainly that the data did not load this time/.test(note) &&
  /Never say a college has no CPL, no courses, no programs or no articulation/.test(note));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "  ok   " : "  FAIL ") + n); if (ok) pass++; }
console.log(`\nsierra_search_failed: ${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
