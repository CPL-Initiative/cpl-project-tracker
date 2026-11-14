// The Pages site stays under GitHub's 1 GB published-site limit (2026-11-10).
//
// The deploy's sync began timing out at deploy-pages' 10-minute wait, passing or failing by GitHub's
// load. COBIx (on #3077) measured the artifact at 1.6 GB; kb/receipts/ was 2.0 GB of the 2.9 GB
// site, and no page fetches it. Guards: kb/receipts withheld, a size check that fails over 1000 MB
// and warns over 800 MB, no deploy-pages timeout it cannot honor, and that no served code reaches kb/receipts.
//
// The published set is read from .github/pages_allowlist.txt, the list the deploy publishes from (S649, #3104),
// so this guard and the deploy cannot drift. tests/pages_allowlist.test.js holds the list's own shape.
//
// Run: node tests/pages_size_guard.test.js
const fs = require("fs");
const { execFileSync } = require("child_process");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const WF = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const assemble = WF.slice(WF.indexOf("Assemble lean site"), WF.indexOf("Stamp asset versions"));

// The allowlist: each tracked file sits under one line; the publish lines are the site.
const kindOf = new Map();
fs.readFileSync(".github/pages_allowlist.txt", "utf8").split("\n").forEach((l) => {
  const m = /^(publish\??|withhold) (\S+)$/.exec(l);
  if (m) kindOf.set(m[2], m[1] === "withhold" ? "withhold" : "publish");
});
function lineFor(file) {
  const parts = file.split("/");
  for (let i = 1; i <= parts.length; i++) { const p = parts.slice(0, i).join("/"); if (kindOf.has(p)) return p; }
  return null;
}
const isPublished = (f) => { const p = lineFor(f); return !!p && kindOf.get(p) === "publish"; };
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 << 20 }).split("\0").filter(Boolean);
const published = tracked.filter(isPublished);
check("the deploy publishes from the allowlist", /\.github\/pages_allowlist\.txt/.test(assemble) && /archive --format=tar HEAD -- "\$\{publish\[@\]\}"/.test(assemble));
check("kb/receipts is withheld from the site", kindOf.get("kb/receipts") === "withhold" && !published.some((f) => f.startsWith("kb/receipts/")));
check("the build fails over 1000 MB and warns over 800 MB", /du -sm _site/.test(assemble) && /-gt 1000[\s\S]*exit 1/.test(assemble) && /-gt 800[\s\S]*::warning::/.test(assemble));
const deploy = WF.slice(WF.indexOf("uses: actions/deploy-pages@")).split("\n      - ")[0];
// deploy-pages caps its wait at 10 minutes (COBIx on #3088), so a longer timeout input would only look like a fix.
check("deploy-pages sets no timeout it cannot honor", !/timeout:/.test(deploy));
// Every served page and script, root and subfolders, whatever its size (COBIx on #3088): kb/ included.
check("kb/ is served where the allowlist says so: a served kb/ file counts, a withheld one does not",
  isPublished("kb/cos_matches.json") && isPublished("kb/csr_out/latest.json") && !isPublished("kb/receipts/x.json")
  && !isPublished("docs/x.md") && !isPublished("kb/brand_new_folder/x.json"));
const served = published.filter((f) => /\.(js|mjs|html)$/.test(f));
check("the served pages and scripts include kb/ files (" + served.filter((f) => f.startsWith("kb/")).length + ")",
  served.some((f) => f.startsWith("kb/")));
const reach = served.filter((f) => fs.readFileSync(f, "utf8").indexOf("kb/receipts") >= 0);
check("no served page or script reaches kb/receipts (" + served.length + " files)", served.length > 100 && reach.length === 0, reach.join(", "));
// The harvest's internal files no tab reads (S645, review of #3201): withheld, and no served code names them.
// A tab that comes to read one moves its line to publish and takes it off this list in the same change.
const HARVEST_INTERNAL = ["kb/harvest_scouting", "kb/status/harvest_heading_agreement.json", "kb/status/harvest_heading_agreement.md"];
HARVEST_INTERNAL.forEach((name) => {
  check(name + " is withheld from the site", kindOf.get(name) === "withhold" && !isPublished(name) && !isPublished(name + "/x"));
  const reads = served.filter((f) => fs.readFileSync(f, "utf8").indexOf(name) >= 0);
  check("no served page or script reaches " + name, reads.length === 0, reads.join(", "));
});
let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\npages_size_guard.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
