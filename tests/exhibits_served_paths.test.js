// Every kb/ file the Exhibits tab reads is on the deployed site (S650). Since #3278 and #3280 Pages publishes only from
// .github/pages_allowlist.txt, and kb/*_dryrun is withheld, so the tab's two reads of kb/cred_rename_dryrun/
// (alias_map.json, which says which titles a ruled plan or a saved rename holds, and collisions.json) answered 404
// there with nothing red anywhere: the Related panel turned off every fold with "The ruled plans could not be read
// (HTTP 404)". Both now have their own publish lines. This guard reads every quoted kb/ path in exhibits.js and
// fails one that no publish or publish? line covers, withheld or simply unlisted.
// The checker is tried first on a fixture allowlist, so a pass means it can fail.
// Run from repo root: `npm test` (or `node tests/exhibits_served_paths.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

function parse(text) {
  const out = { publish: [], withhold: [] };
  text.split("\n").forEach((l) => {
    const m = /^(publish\??|withhold) (\S+)$/.exec(l);
    if (m) (m[1] === "withhold" ? out.withhold : out.publish).push(m[2]);
  });
  return out;
}
function seg(name, pat) {
  return new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(name);
}
function withheldBy(file, pat) {
  const f = file.split("/"), p = pat.split("/");
  return p.length <= f.length && p.every((s, i) => seg(f[i], s));
}
function servedBy(list, file) { return list.publish.some((p) => file === p || file.startsWith(p + "/")); }
// The kb/ paths a source names in quotes: fetch targets and the URL constants that feed them.
function kbPaths(src) {
  const out = new Set();
  (src.match(/["'`]kb\/[A-Za-z0-9_./-]+\.(?:json|js|md|csv|txt)["'`]/g) || []).forEach((q) => out.add(q.slice(1, -1)));
  return [...out];
}
function unserved(list, paths) {
  return paths.filter((p) => !servedBy(list, p)).map((p) => p + (list.withhold.some((w) => withheldBy(p, w)) ? " (withheld)" : " (no line)"));
}

// The checker on a fixture.
const FIX = parse(["withhold kb/*_dryrun", "withhold kb/*_out", "publish kb/csr_out/latest.json", "publish kb/credentials.json",
  "publish kb/status"].join("\n"));
const FIX_SRC = 'var A = "kb/credentials.json", B = "kb/x_dryrun/alias_map.json"; fetch("kb/status/one.json"); '
  + "fetch('kb/csr_out/latest.json'); fetch(`kb/new_file.json`);";
const fixPaths = kbPaths(FIX_SRC);
check("fixture: every quoted kb/ path is found", fixPaths.length === 5);
const fixBad = unserved(FIX, fixPaths);
check("fixture: a read under a withheld dry-run folder is named", fixBad.indexOf("kb/x_dryrun/alias_map.json (withheld)") >= 0);
check("fixture: a read with no line at all is named", fixBad.indexOf("kb/new_file.json (no line)") >= 0);
check("fixture: a file under a published folder, and one published from inside a withheld folder, pass", fixBad.length === 2);

// The tab itself.
const list = parse(fs.readFileSync(".github/pages_allowlist.txt", "utf8"));
const paths = kbPaths(fs.readFileSync("exhibits.js", "utf8"));
check("exhibits.js names its kb/ reads (at least the review file and the dry run's two)",
  ["kb/exhibits_review.json", "kb/cred_rename_dryrun/alias_map.json", "kb/cred_rename_dryrun/collisions.json"].every((p) => paths.indexOf(p) >= 0));
const bad = unserved(list, paths);
check("every kb/ file exhibits.js reads is published by the Pages allowlist", bad.length === 0, bad.join(", "));
["kb/cred_rename_dryrun/alias_map.json", "kb/cred_rename_dryrun/collisions.json"].forEach((p) => {
  check(p + " has its own publish line, inside the withheld kb/*_dryrun",
    new RegExp("^publish\\?? " + p.replace(/[/.]/g, "\\$&") + "$", "m").test(fs.readFileSync(".github/pages_allowlist.txt", "utf8"))
    && list.withhold.indexOf("kb/*_dryrun") >= 0);
});
// The rest of each dry-run folder stays withheld: a line names a file, never the folder.
check("no publish line opens a whole kb/*_dryrun folder", !list.publish.some((p) => /^kb\/[^/]*_dryrun$/.test(p)));

let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "  ok  " : "  FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
