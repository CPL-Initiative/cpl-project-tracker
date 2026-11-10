// The Pages site stays under GitHub's 1 GB published-site limit (2026-11-10).
//
// The deploy's sync began timing out at deploy-pages' 10-minute wait, passing or failing by GitHub's
// load. COBIx (on #3077) measured the artifact at 1.6 GB; kb/receipts/ was 2.0 GB of the 2.9 GB
// site, and no page fetches it. Guards: the receipts prune, a size check that fails over 1000 MB
// and warns over 800 MB, the longer deploy wait, and that no served code reaches kb/receipts.
//
// Run: node tests/pages_size_guard.test.js
const fs = require("fs");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const WF = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const assemble = WF.slice(WF.indexOf("Assemble lean site"), WF.indexOf("Stamp asset versions"));
check("kb/receipts is pruned from the site", /rm -rf _site\/kb\/receipts\b/.test(assemble));
check("the build fails over 1000 MB and warns over 800 MB", /du -sm _site/.test(assemble) && /-gt 1000[\s\S]*exit 1/.test(assemble) && /-gt 800[\s\S]*::warning::/.test(assemble));
const deploy = WF.slice(WF.indexOf("uses: actions/deploy-pages@"));
check("deploy-pages waits up to 30 minutes", /timeout:\s*1800000/.test(deploy.split("\n      - ")[0]));
const served = fs.readdirSync(".").filter((f) => /\.(js|html)$/.test(f) && fs.statSync(f).size < 800000);
const reach = served.filter((f) => /kb\/receipts/.test(fs.readFileSync(f, "utf8")));
check("no served root page or script reaches kb/receipts", reach.length === 0, reach.join(", "));
let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\npages_size_guard.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
