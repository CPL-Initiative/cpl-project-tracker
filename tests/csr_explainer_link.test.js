// The Common SUBJ explainer (Sam, 2026-11-04: "provide a simple explanation of it available by link on our subjects
// common view"; "and how the MQs determine the subject codes needed"). Guards that the Subjects page links it, that the
// file it links ships (prototype/ is served; docs/ is pruned from the deploy), and that the page keeps its skip link,
// its title and the four facts it rests on. The counts are dated in its footer; a reseed that moves them updates both.
const fs = require("fs");
const results = [];
function check(n, ok, why) { results.push([n, !!ok, why]); }
const SRC = fs.readFileSync("canonical_subj4.js", "utf8");
check("the Subjects page links What a Common SUBJ is to the served page",
  /\{ words: "What a Common SUBJ is", href: "prototype\/common_subj_explainer\.html" \}/.test(SRC));
const PAGE = fs.readFileSync("prototype/common_subj_explainer.html", "utf8");
check("the page has its title, a skip link and a main landmark", /<title>The Common SUBJ<\/title>/.test(PAGE)
  && /class="skip" href="#main"/.test(PAGE) && /<main id="main">/.test(PAGE));
check("it says how the MQ list decides which codes are needed", /How the MQ list decides which codes are needed/.test(PAGE) && /248 disciplines/.test(PAGE));
check("it says how the codes keep step with C-ID and CCN, AJ and CRIM the example", /How it stays in step with C-ID and CCN/.test(PAGE)
  && /<code>AJ<\/code>; its Common SUBJ is <code>CRIM<\/code>/.test(PAGE));
check("it links back to the Common Subjects Reference", /href="\.\.\/index\.html#canonical-subj4\/list"/.test(PAGE));
check("no raw hex outside :root, and no emoji", !/#[0-9a-fA-F]{3,6}\b/.test(PAGE.replace(/:root \{[\s\S]*?\}/, "").replace(/href="[^"]*"/g, ""))
  && !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(PAGE));
const PG = fs.readFileSync(".github/workflows/pages.yml", "utf8");
check("prototype/ ships with the site (the Pages allowlist publishes prototype/)",
  /^publish prototype$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8")) && !/rm -rf[^\n]*_site\/prototype/.test(PG));
let pass = 0;
results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
console.log("\n" + pass + "/" + results.length + " passed");
process.exit(pass === results.length ? 0 : 1);
