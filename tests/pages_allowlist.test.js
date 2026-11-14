// The Pages site publishes only from .github/pages_allowlist.txt (Sam on #3104, relayed by COBIx 2026-11-11:
// "yes to all recommendations").
//
// Guards:
//   A. The list is well formed: "publish <path>" (literal, sorted, none under another) or "withhold <pattern>"
//      (literal or * within a segment); no line twice; no literal line of one kind on or under a line of the other.
//   B. Every tracked file is under a publish line or matched by a withhold line, and every literal line covers a
//      tracked file. A new file or folder fails here until someone decides whether it is public; that is the point.
//   C. pages.yml builds _site from the publish lines alone (git archive of those paths), fails on a line the
//      commit does not hold, and carries no rm deny list that could grow back.
//   D. Every path the deploy's served-path assertion requires is published, so an omission fails the PR
//      that makes it rather than the deploy.
//   E. BASELINE, FOR THE S649 SWITCH ONLY: the allowlist publishes exactly what the old prune logic published.
//      Remove section E (and its OLD_PRUNE copy) once the first deploy from the allowlist is verified (#3104);
//      after that the allowlist is the record and a change to it is a decision, not drift.
//
// Run: node tests/pages_allowlist.test.js
const fs = require("fs");
const { execFileSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LIST = ".github/pages_allowlist.txt";
const raw = fs.readFileSync(LIST, "utf8").split("\n");
const publishLines = [];
const withholdLines = [];
const bad = [];
raw.forEach((l, i) => {
  if (!l.trim() || l.startsWith("#")) return;
  const m = /^(publish|withhold) (\S+)$/.exec(l);
  if (!m) bad.push(i + 1 + ": " + l);
  else (m[1] === "publish" ? publishLines : withholdLines).push(m[2]);
});
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 << 20 }).split("\0").filter(Boolean);

// Shell rules on one path segment: * matches within it, never a leading dot.
function seg(name, pat) {
  if (name.startsWith(".") && !pat.startsWith(".")) return false;
  return new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(name);
}
// A pattern matches a file when its segments match the file's first segments (a folder covers what is under it).
function matches(file, pat) {
  const f = file.split("/"), p = pat.split("/");
  return p.length <= f.length && p.every((s, i) => seg(f[i], s));
}
const pubSet = new Set(publishLines);
function publishLineFor(file) {
  const parts = file.split("/");
  for (let i = 1; i <= parts.length; i++) { const p = parts.slice(0, i).join("/"); if (pubSet.has(p)) return p; }
  return null;
}
const withholdFor = (file) => withholdLines.find((w) => matches(file, w)) || null;

// A. form
check("A every line is \"publish <path>\" or \"withhold <pattern>\"", bad.length === 0, bad.slice(0, 5).join("; "));
const sortedPub = publishLines.slice().sort();
check("A the publish lines are sorted", publishLines.every((p, i) => p === sortedPub[i]),
  "first out of order: " + publishLines.find((p, i) => p !== sortedPub[i]));
const all = publishLines.concat(withholdLines);
const seen = new Set();
const dup = all.filter((p) => (seen.has(p) ? true : (seen.add(p), false)));
check("A no line appears twice", dup.length === 0, dup.join(", "));
check("A publish lines are literal (no pattern can publish what nobody named)", publishLines.every((p) => !/[*?[\]]/.test(p)),
  publishLines.filter((p) => /[*?[\]]/.test(p)).join(", "));
const nestedPub = publishLines.filter((p) => { const parts = p.split("/"); for (let i = 1; i < parts.length; i++) if (pubSet.has(parts.slice(0, i).join("/"))) return true; return false; });
check("A no publish line sits under another", nestedPub.length === 0, nestedPub.slice(0, 5).join(", "));
const literalWh = withholdLines.filter((w) => !w.includes("*"));
const clash = literalWh.filter((w) => publishLineFor(w) || publishLines.some((p) => p.startsWith(w + "/")));
check("A no literal withhold line sits on, under or over a publish line", clash.length === 0, clash.join(", "));

// B. coverage
const undecided = [];
const published = new Set();
const usedPub = new Set();
const usedWh = new Set();
tracked.forEach((f) => {
  const p = publishLineFor(f);
  if (p) { published.add(f); usedPub.add(p); return; }
  const w = withholdFor(f);
  if (w) usedWh.add(w); else undecided.push(f);
});
check("B every tracked file is under a publish line or matched by a withhold line (" + tracked.length + " files)", undecided.length === 0,
  "decide each in " + LIST + ": " + undecided.slice(0, 10).join(", ") + (undecided.length > 10 ? " ..." : ""));
const stale = publishLines.filter((p) => !usedPub.has(p)).concat(literalWh.filter((w) => !usedWh.has(w)));
check("B every literal line covers a tracked file", stale.length === 0, "stale: " + stale.slice(0, 10).join(", "));
check("B the published set is non-trivial (" + published.size + " files)", published.size > 1000);
// The scan catches a new folder: a planted path under no line is undecided, and a withheld pattern still withholds.
check("B a new top-level folder is undecided until it is given a line",
  !publishLineFor("brand_new_folder/x.json") && !withholdFor("brand_new_folder/x.json"));
check("B a new kb/ folder is undecided until it is given a line",
  !publishLineFor("kb/brand_new_folder/x.json") && !withholdFor("kb/brand_new_folder/x.json"));
check("B a publish line wins over a withhold pattern, and the pattern still covers the rest",
  publishLineFor("kb/csr_out/latest.json") && !publishLineFor("kb/csr_out/2099-01-01/x.json") && withholdFor("kb/csr_out/2099-01-01/x.json"));

// C. the workflow
const WF = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const assemble = WF.slice(WF.indexOf("Assemble lean site"), WF.indexOf("Stamp asset versions"));
check("C the assemble step reads the publish lines of the allowlist",
  /awk '\$1 == "publish" \{ print \$2 \}' \.github\/pages_allowlist\.txt/.test(assemble));
check("C it archives only those paths, literally", /git --literal-pathspecs archive --format=tar HEAD -- "\$\{publish\[@\]\}" \| tar -x -C _site/.test(assemble));
check("C it never archives the whole tree", !/git archive --format=tar HEAD \|/.test(assemble));
check("C it fails, naming each, when an allowlisted path is not in the commit",
  /git ls-tree -r --name-only HEAD/.test(assemble) && /allowlisted path is not in the commit/.test(assemble) && /exit 1/.test(assemble));
check("C no rm deny list remains in the assemble step", !/^\s*rm -(r?f)\s+_site\//m.test(assemble));
check("C the upload, the deploy and the served-path assertion are still there",
  /actions\/upload-pages-artifact@/.test(WF) && /actions\/deploy-pages@/.test(WF) && /Assert every browser-served path is present/.test(WF));

// D. every path the served-path assertion requires is published
const assertStep = WF.slice(WF.indexOf("Assert every browser-served path is present"), WF.indexOf("Upload Pages artifact"));
const must = [...assertStep.matchAll(/"_site\/([^"]+)"/g)].map((m) => m[1]);
const notPub = must.filter((p) => !published.has(p));
check("D the assertion's " + must.length + " required paths are all published", must.length > 40 && notPub.length === 0, notPub.join(", "));
const dirs = (/for d in ([^;]+); do/.exec(assertStep) || [, ""])[1].trim().split(/\s+/).filter(Boolean);
const emptyDirs = dirs.filter((d) => ![...published].some((f) => f.startsWith(d + "/")));
check("D the assertion's served folders hold published files (" + dirs.join(", ") + ")", dirs.length >= 3 && emptyDirs.length === 0, emptyDirs.join(", "));

// E. BASELINE (remove after the first allowlist deploy is verified, #3104): a faithful copy of the old
//    "Assemble lean site" prune, as it stood on main before S649, applied to the tracked files.
function glob(name, pat) {   // one path segment, shell rules: * never matches a leading dot
  if (name.startsWith(".") && !pat.startsWith(".")) return false;
  return new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(name);
}
const OLD_PRUNE_DIRS = new Set(["docs", "tests", "tools", "archive", "chatbox", "funding", "reflections", "nudges", "news", "scripts", ".github"]);
const OLD_PRUNE_KB_FILES = new Set(["coci_minted_courses.json", "coci_minted_memberships.json", "coci_minted_singletons.json",
  "cid_articulation_joins.json", "promotions.json", "coci_unified_courses.json", "common_courses.json", "course_crosswalk.json",
  "discipline_inference.json"]);
function oldPublished(f) {
  const p = f.split("/");
  if (OLD_PRUNE_DIRS.has(p[0])) return false;
  if (p[0] === "tmc" && p[1] === "source_data") return false;
  if (p.length === 1) return !(glob(f, "*.xlsx") || glob(f, "*.bak"));
  if (p[0] !== "kb") return true;
  const k = p[1];
  if (p.length === 2 && OLD_PRUNE_KB_FILES.has(k)) return false;
  if (p.length === 3 && k === "reference" && (glob(p[2], "*.xlsx") || p[2] === "cos_certifications.json" || p[2] === "moc_crosswalk.json")) return false;
  if (p.length === 3 && k === "row_audit" && (glob(p[2], "*.md") || glob(p[2], "*.full.json"))) return false;
  if (p.length === 3 && k === "exhibit_audit" && glob(p[2], "*.md")) return false;
  if (glob(k, "*_out")) return (k === "csr_out" || k === "cer_procedures_out") ? p.length >= 3 && p[2] === "latest.json" : false;
  if (["*_dryrun", "*_apply", "subj4_*", "*_fold"].some((g) => glob(k, g))) return false;
  if (k === "receipts" || k === "harvest_scouting") return false;
  if (p.length === 3 && k === "status" && (p[2] === "harvest_heading_agreement.json" || p[2] === "harvest_heading_agreement.md")) return false;
  return true;
}
const oldSet = new Set(tracked.filter(oldPublished));
const added = [...published].filter((f) => !oldSet.has(f));
const removed = [...oldSet].filter((f) => !published.has(f));
check("E BASELINE: the allowlist publishes exactly the old prune's set (" + oldSet.size + " files): none added",
  added.length === 0, added.slice(0, 10).join(", "));
check("E BASELINE: none removed", removed.length === 0, removed.slice(0, 10).join(", "));

let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\npages_allowlist.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
