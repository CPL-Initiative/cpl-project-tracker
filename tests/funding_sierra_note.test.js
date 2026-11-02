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
// One section per institution (S528; Sam, 2026-10-30: "she should have access to all
// the data and text info on the page"), so a question naming one college finds it.
const secs = note.split(/\n(?=### )/).filter((b) => /^### .+: CPL funding standing/.test(b));
check("118 institutions each have their own section", secs.length === 118);
const nums = secs.map((b) => Number(((/- Max award [^:]*: \$([0-9,]+)/.exec(b) || [])[1] || "").replace(/,/g, "")));
check("every section carries a max award within the base and the cap", nums.every((n) => n >= 150000 && n <= 400000));
const blocks = note.split(/\n(?=#{2,4} )/);
check("no institution's section outgrows the indexer's 2,000-character section",
  blocks.every((b) => b.length <= 2000 || !/: CPL funding standing/.test(b)));
// The public rows the page reads, handed over as the workflow's fetch returns them.
const pubNote = buildNote(c.cfg, "2026-10-20T15:22:49Z", {
  coord: [{ college: "Cabrillo College", has_coordinator: true, has_primary_contact: true, has_landing_page: true }],
  part: [{ college: "Cabrillo College", status: "confirmed", confirmed_at: "2026-10-21" }], contacts: null, attest: [] });
const cab = (pubNote.split(/\n(?=### )/).find((b) => /^### Cabrillo College: /.test(b)) || "");
check("with the public rows, an institution's conditions read met or not yet met, as on the page",
  /CPL Coordinator assigned in MAP[^\n]*: met/.test(cab) && /confirmation of participation on file: met/.test(cab));
check("its JST condition gives the counts the drill-in gives", /Joint services transcripts[^\n]*MAP holds \d+ JSTs?, and MIS reports \d+ enrolled veteran/.test(cab));
check("it carries Funds Qualified So Far and the priority figures", /Funds qualified so far/i.test(cab) && /P1 target/.test(cab));
check("without the rows, the conditions are not claimed", !/confirmation of participation on file: met/.test(
  (note.split(/\n(?=### )/).find((b) => /^### Cabrillo College: /.test(b)) || "")));
// Each heading carries the full name (S529), the name cpl-chat's college lookup resolves.
check("every section heading names the institution in full", secs.length === 118 &&
  secs.every((b) => !/^### (Cabrillo|Pasadena|Skyline|Mt\. San Jacinto): /.test(b)) &&
  /^### Cabrillo College: CPL funding standing/m.test(note) && /^### Mt San Jacinto College: CPL funding standing/m.test(note) &&
  /^### North Orange Continuing Education: CPL funding standing/m.test(note) &&
  /^### San Diego College of Continuing Education: CPL funding standing/m.test(note));
check("the section still names the page's short form",
  /- Institution: Cabrillo College, shown on the funding page as Cabrillo \(Cabrillo Community College District\)/.test(note));
check("the 118 headings are distinct", new Set(secs.map((b) => b.split("\n")[0])).size === 118);
check("nothing in the note says draft", !/\bdraft\b/i.test(note));
check("the statewide total reads as its own sentence", /Statewide, the 118 max awards total \$[0-9,]+/.test(note));
check("no figure is left unpainted", !/\{[a-z ]+\}/.test(note));

// Every institution against the JST condition in one section (Sam, 2026-11-01: asked
// which colleges had not met the 75 percent JST condition, Sierra said she had no
// per-college figures; each college's counts sat only in its own section).
const { JST_ROLLUP_HEADING } = require("../scripts/funding_sierra_note.js");
const roll = (note.split(/\n(?=## )/).find((b) => b.startsWith("## " + JST_ROLLUP_HEADING)) || "");
check("one section lists every institution against the 75 percent JST condition", !!roll);
const notMet = roll.split("\n").filter((l) => /^- /.test(l)).map((l) => l.slice(2).split(":")[0]);
const ownSays = (full) => ((note.split(/\n(?=### )/).find((b) => b.startsWith("### " + full + ": CPL funding standing")) || "")
  .match(/Joint services transcripts[^\n]*: (met|not yet met|not yet known)/) || [])[1];
check("each institution listed as not yet met reads not yet met in its own section",
  notMet.length > 0 && notMet.every((n) => ownSays(n) === "not yet met"));
const counted = /(\d+) have met it and (\d+) have not yet met it/.exec(roll) || [];
check("the section's counts match its lists", Number(counted[2]) === notMet.length &&
  new RegExp("Met \\(" + counted[1] + "\\): ").test(roll));
check("the not-yet-met list keeps its label in the same paragraph, so the indexer keeps them together",
  /\n\nNot yet met \(\d+\):\n- /.test(roll));
check("a masked count (1 to 9) gives no figure", !/: [1-9] JSTs? for/.test(roll) && !/for [1-9] enrolled veteran/.test(roll) &&
  /: fewer than 10 JSTs for \d+ enrolled veterans/.test(roll));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
