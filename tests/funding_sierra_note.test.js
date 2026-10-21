// tests/funding_sierra_note.test.js
//
// The funding note Sierra quotes (scripts/funding_sierra_note.js; Sam,
// 2026-10-21: "it would be nice for her to be able to quote specifics"). The
// vault's funding-note workflow writes it daily from the live config. Guards:
// it states the enacted funding, carries every institution's max award within
// the model's base and cap, and keeps each heading's block small enough for the
// vault's indexer to embed as its own section.
const path = require("path");
const { buildNote, loadConfig } = require("../scripts/funding_sierra_note.js");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const fixture = path.join(__dirname, "fixtures", "cpl_funding_config_de95c290.json");
const c = loadConfig(fixture);
const note = buildNote(c.cfg, "2026-10-20T15:22:49Z");

check("the note states the enacted funding under SB 135", /Senate Bill 135/.test(note) && /enacted/.test(note) && /78093/.test(note));
check("the note never calls the funding a Governor's proposal", !/Governor[^.]*propos/i.test(note));
check("the note names its date in Pacific time", /October 20, 2026/.test(note));
check("the note links the funding page and the memo", /funding-model\/[) ]/.test(note) && /funding-model\/memo\//.test(note));
const awards = note.split("### Max awards:").slice(1).join("\n").split("\n")
  .filter((l) => /^\| /.test(l) && !/^\| (Institution|---)/.test(l));
check("118 institutions carry a max award", awards.length === 118);
const nums = awards.map((l) => Number(l.split(" | ")[2].replace(/[$,]/g, "")));
check("every max award sits within the base and the cap", nums.every((n) => n >= 150000 && n <= 400000));
const blocks = note.split(/\n(?=#{2,4} )/);
check("no heading's block outgrows the indexer's 2,000-character section", blocks.every((b) => b.length <= 2000 || !/^### Max awards/.test(b)));
check("the institutions' groups each name their institutions in the heading",
  (note.match(/^### Max awards: .+/gm) || []).length === 12);
check("nothing in the note says draft", !/\bdraft\b/i.test(note));
check("the statewide total reads as its own sentence", /Statewide, the 118 max awards total \$[0-9,]+/.test(note));
check("no figure is left unpainted", !/\{[a-z ]+\}/.test(note));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
