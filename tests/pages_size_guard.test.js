// The Pages site stays under GitHub's 1 GB published-site limit (2026-11-10).
//
// The deploy's sync began timing out at deploy-pages' 10-minute wait, passing or failing by GitHub's
// load. COBIx (on #3077) measured the artifact at 1.6 GB; kb/receipts/ was 2.0 GB of the 2.9 GB
// site, and no page fetches it. Guards: the receipts prune, a size check that fails over 1000 MB
// and warns over 800 MB, no deploy-pages timeout it cannot honor, and that no served code reaches kb/receipts.
//
// Run: node tests/pages_size_guard.test.js
const fs = require("fs");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const WF = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const assemble = WF.slice(WF.indexOf("Assemble lean site"), WF.indexOf("Stamp asset versions"));
check("kb/receipts is pruned from the site", /rm -rf _site\/kb\/receipts\b/.test(assemble));
check("the build fails over 1000 MB and warns over 800 MB", /du -sm _site/.test(assemble) && /-gt 1000[\s\S]*exit 1/.test(assemble) && /-gt 800[\s\S]*::warning::/.test(assemble));
const deploy = WF.slice(WF.indexOf("uses: actions/deploy-pages@")).split("\n      - ")[0];
// deploy-pages caps its wait at 10 minutes (COBIx on #3088), so a longer timeout input would only look like a fix.
check("deploy-pages sets no timeout it cannot honor", !/timeout:/.test(deploy));
// Every served page and script, root and subfolders, whatever its size (COBIx on #3088), minus what the deploy prunes.
// The pruned set is read from pages.yml's own rm lines, so it is what the deploy removes and no more: kb/ is served,
// and only the kb/ paths the deploy names are skipped here (the guard once skipped all of kb/).
const rmPaths = [];
assemble.replace(/\\\n\s*/g, " ").split("\n").forEach((l) => {
  if (!/^\s*rm\s+-r?f\s/.test(l)) return;
  (l.split("#")[0].match(/_site\/\S+/g) || []).forEach((t) => rmPaths.push(t.replace(/^_site\//, "")));
});
const globRe = (g) => g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
// Never in the archive the deploy extracts: git archive omits .git and everything gitignored.
const NOT_ARCHIVED = ["\\.git", "node_modules", "\\.claude/worktrees"];
// The *_out loop: every kb/*_out directory goes, except latest.json in csr_out and cer_procedures_out.
const OUT_LOOP = /for d in _site\/kb\/\*_out;[\s\S]*?csr_out[\s\S]*?cer_procedures_out[\s\S]*?else rm -rf "\$d"; fi/.test(assemble);
const PRUNED = new RegExp("^(?:(?:" + NOT_ARCHIVED.concat(rmPaths.map(globRe)).join("|") + ")(?:/|$)" +
  (OUT_LOOP ? "|kb/[^/]*_out/(?!latest\\.json$)|kb/(?!(?:csr_out|cer_procedures_out)(?:/|$))[^/]*_out(?:/|$)" : "") + ")");
check("the pruned set is read from pages.yml's rm lines (kb/receipts, docs and the kb/*_out loop among them)",
  rmPaths.includes("kb/receipts") && rmPaths.includes("docs") && OUT_LOOP && !rmPaths.includes("kb"), rmPaths.join(" "));
check("kb/ itself is walked: a served kb/ file is not skipped", !PRUNED.test("kb/cos_matches.json") &&
  !PRUNED.test("kb/csr_out") && !PRUNED.test("kb/csr_out/latest.json") && PRUNED.test("kb/receipts/x.json") && PRUNED.test("kb/agab_remint_out/a.json"));
function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = dir === "." ? e.name : dir + "/" + e.name;
    if (PRUNED.test(p)) return;
    if (e.isDirectory()) walk(p, out); else if (/\.(js|mjs|html)$/.test(e.name)) out.push(p);
  });
  return out;
}
const served = walk(".", []);
const reach = served.filter((f) => fs.readFileSync(f, "utf8").indexOf("kb/receipts") >= 0);
check("no served page or script reaches kb/receipts (" + served.length + " files)", served.length > 100 && reach.length === 0, reach.join(", "));
// The harvest's internal files no tab reads (S645, review of #3201): pruned, and no served code names them.
// A tab that comes to read one takes it off this list and out of the prune in the same change.
const HARVEST_INTERNAL = [["rm -rf", "_site/kb/harvest_scouting"], ["rm -f", "_site/kb/status/harvest_heading_agreement.json"],
                          ["rm -f", "_site/kb/status/harvest_heading_agreement.md"]];
HARVEST_INTERNAL.forEach(([cmd, path]) => {
  // Line-anchored, so a prune commented out or its path replaced in place fails here (round 2, finding 17).
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
  const line = new RegExp("^[ \\t]*" + esc(cmd) + "[ \\t]+(?:[^\\n#]*\\s)?" + esc(path) + "(?=\\s|$)", "m");
  check(path.replace("_site/", "") + " is pruned from the site", line.test(assemble));
  const name = path.replace("_site/", "");
  const reads = served.filter((f) => fs.readFileSync(f, "utf8").indexOf(name) >= 0);
  check("no served page or script reaches " + name, reads.length === 0, reads.join(", "));
});
let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\npages_size_guard.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
