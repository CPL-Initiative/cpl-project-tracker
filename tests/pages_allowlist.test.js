// The Pages site publishes only from .github/pages_allowlist.txt (Sam on #3104, relayed by COBIx 2026-11-11:
// "yes to all recommendations").
//
// Guards:
//   A. The list is well formed: "publish <path>" and "publish? <path>" (literal, sorted, none under another) and
//      "withhold <pattern>" (literal or * within a segment); no line twice; no literal withhold line on, under or
//      over a publish line.
//   B. Every tracked file is under a publish line or matched by a withhold line, and every plain publish line and
//      literal withhold line covers a tracked file. A new path fails here until someone decides whether it is
//      public; that decision is the point.
//   C. pages.yml builds _site from the publish lines alone. The test RUNS the deploy's own export block on a fixture
//      repo: a missing publish line stops it, an absent publish? line is skipped with a notice, and only the publish
//      paths reach _site. No rm or find -delete deny list sits in the assemble step.
//   D. Every path the deploy's served-path assertion requires is published, so an omission fails the PR.
//   F. Every literal path a workflow stages with git add is decided, tracked yet or not, so a routine cron commit
//      cannot turn main red. A workflow whose staging cannot be read is listed in DYNAMIC with its reason.
//   G. A withhold pattern is narrow: a fixed stem or folder (never "*.js", "*.html", "kb/*.json"); it matches no
//      path the served-path assertion names; it overlaps a published file only where OVERLAP_OK says why; and it
//      matches a tracked file or a staged path.
// Day one published the same 22,705 files as the old prune; the equality was proven on #3278 and is not retested.
//
// Run: node tests/pages_allowlist.test.js
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LIST = ".github/pages_allowlist.txt";
function parse(text) {
  const out = { publish: [], optional: [], withhold: [], bad: [], order: [] };
  text.split("\n").forEach((l, i) => {
    if (!l.trim() || l.startsWith("#")) return;
    const m = /^(publish\??|withhold) (\S+)$/.exec(l);
    if (!m) { out.bad.push(i + 1 + ": " + l); return; }
    if (m[1] === "publish") out.publish.push(m[2]);
    else if (m[1] === "publish?") out.optional.push(m[2]);
    else out.withhold.push(m[2]);
    if (m[1] !== "withhold") out.order.push(m[2]);
  });
  return out;
}
const L = parse(fs.readFileSync(LIST, "utf8"));
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 << 20 }).split("\0").filter(Boolean);
const trackedSet = new Set(tracked);

// Shell rules on one path segment: * matches within it, never a leading dot.
function seg(name, pat) {
  if (name.startsWith(".") && !pat.startsWith(".")) return false;
  return new RegExp("^" + pat.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$").test(name);
}
// A pattern matches a path when its segments match the path's first segments (a folder covers what is under it).
function matches(file, pat) {
  const f = file.split("/"), p = pat.split("/");
  return p.length <= f.length && p.every((s, i) => seg(f[i], s));
}
const pubLines = new Set(L.publish.concat(L.optional));
function publishLineFor(file) {
  const parts = file.split("/");
  for (let i = 1; i <= parts.length; i++) { const p = parts.slice(0, i).join("/"); if (pubLines.has(p)) return p; }
  return null;
}
const withholdFor = (file) => L.withhold.find((w) => matches(file, w)) || null;
const decided = (file) => !!(publishLineFor(file) || withholdFor(file));

// A. form
check("A every line is \"publish <path>\", \"publish? <path>\" or \"withhold <pattern>\"", L.bad.length === 0, L.bad.slice(0, 5).join("; "));
const sortedPub = L.order.slice().sort();
check("A the publish block is sorted", L.order.every((p, i) => p === sortedPub[i]),
  "first out of order: " + L.order.find((p, i) => p !== sortedPub[i]));
const all = L.order.concat(L.withhold);
const seen = new Set();
const dup = all.filter((p) => (seen.has(p) ? true : (seen.add(p), false)));
check("A no line appears twice", dup.length === 0, dup.join(", "));
check("A publish lines are literal (no pattern can publish what nobody named)", L.order.every((p) => !/[*?[\]]/.test(p)),
  L.order.filter((p) => /[*?[\]]/.test(p)).join(", "));
const nestedPub = L.order.filter((p) => { const parts = p.split("/"); for (let i = 1; i < parts.length; i++) if (pubLines.has(parts.slice(0, i).join("/"))) return true; return false; });
check("A no publish line sits under another", nestedPub.length === 0, nestedPub.slice(0, 5).join(", "));
const literalWh = L.withhold.filter((w) => !w.includes("*"));
const patternWh = L.withhold.filter((w) => w.includes("*"));
const clash = literalWh.filter((w) => publishLineFor(w) || L.order.some((p) => p.startsWith(w + "/")));
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
  "decide each in " + LIST + " (docs/reference/troubleshooting.md, Pages): " + undecided.slice(0, 10).join(", ") + (undecided.length > 10 ? " ..." : ""));
const stale = L.publish.filter((p) => !usedPub.has(p)).concat(literalWh.filter((w) => !usedWh.has(w)));
check("B every plain publish line and literal withhold line covers a tracked file", stale.length === 0,
  "stale (remove it, or mark a not-yet-committed output publish?): " + stale.slice(0, 10).join(", "));
check("B the published set is non-trivial (" + published.size + " files)", published.size > 1000);
check("B a new top-level folder is undecided until it is given a line", !decided("brand_new_folder/x.json"));
check("B a new kb/ folder is undecided until it is given a line", !decided("kb/brand_new_folder/x.json"));
check("B a publish line wins over a withhold pattern, and the pattern still covers the rest",
  publishLineFor("kb/csr_out/latest.json") && !publishLineFor("kb/csr_out/2099-01-01/x.json") && withholdFor("kb/csr_out/2099-01-01/x.json"));
check("B a publish? line decides a path before it is tracked (" + L.optional.join(", ") + ")",
  L.optional.length > 0 && L.optional.every((p) => decided(p + "/x.json") || decided(p)));

// C. the workflow: its text, then its export block run on a fixture repo
const WF = fs.readFileSync(".github/workflows/pages.yml", "utf8");
const assemble = WF.slice(WF.indexOf("Assemble lean site"), WF.indexOf("Stamp asset versions"));
const code = assemble.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
check("C no rm or find -delete deny list sits in the assemble step", !/\brm\b[^\n]*_site\//.test(code) && !/-delete\b/.test(code));
check("C it never archives the whole tree", !/archive --format=tar HEAD \|/.test(code) && !/archive --format=tar HEAD\s*$/m.test(code));
check("C the upload, the deploy and the served-path assertion are still there",
  /actions\/upload-pages-artifact@/.test(WF) && /actions\/deploy-pages@/.test(WF) && /Assert every browser-served path is present/.test(WF));
const blockM = /\n( *)# >>> allowlist export[^\n]*\n([\s\S]*?)\n *# <<< allowlist export/.exec(assemble);
check("C the export block is marked in the assemble step", !!blockM);
const block = blockM ? blockM[2].split("\n").map((l) => l.slice(blockM[1].length)).join("\n") : "exit 99";

function fixture(files, allowText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pages-allow-"));
  const g = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...a], { cwd: dir, stdio: "pipe" });
  g("init", "-q");
  files.forEach((f) => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), f); });
  fs.mkdirSync(path.join(dir, ".github"), { recursive: true });
  fs.writeFileSync(path.join(dir, LIST), allowText);
  g("add", "-A"); g("commit", "-q", "-m", "fixture");
  fs.mkdirSync(path.join(dir, "_site"));
  const r = spawnSync("bash", ["-euo", "pipefail", "-c", block], { cwd: dir, encoding: "utf8" });
  const site = [];
  (function walk(d, rel) { fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const r2 = rel ? rel + "/" + e.name : e.name; if (e.isDirectory()) walk(path.join(d, e.name), r2); else site.push(r2); }); })(path.join(dir, "_site"), "");
  fs.rmSync(dir, { recursive: true, force: true });
  return { status: r.status, out: (r.stdout || "") + (r.stderr || ""), site: site.sort() };
}
const pages = Array.from({ length: 101 }, (_, i) => "p" + String(i).padStart(3, "0") + ".js");
const base = pages.concat(["café.html", "lib/a/index.html", "secret/x.json"]);
const baseAllow = pages.map((p) => "publish " + p).concat(["publish café.html", "publish lib", "withhold secret"]).join("\n") + "\n";
const good = fixture(base, baseAllow + "publish? later/out.json\n");
check("C fixture: the export publishes exactly the publish paths (a non-ASCII name included) and passes",
  good.status === 0 && good.site.join("|") === pages.concat(["café.html", "lib/a/index.html"]).sort().join("|"), good.status + " " + good.out.slice(0, 300) + " " + good.site.length);
check("C fixture: an absent publish? line is skipped with a notice", /::notice::publish\? line not in the commit yet, skipped: later\/out\.json/.test(good.out));
const opt = fixture(base.concat(["later/out.json"]), baseAllow + "publish? later/out.json\n");
check("C fixture: a present publish? line is published", opt.status === 0 && opt.site.includes("later/out.json"), opt.out.slice(0, 300));
const gone = fixture(base, baseAllow + "publish gone.js\npublish gone2/\n".replace("gone2/", "gone2"));
check("C fixture: a publish line not in the commit stops the export, naming each, before anything is written",
  gone.status !== 0 && /::error::allowlisted path is not in the commit: gone\.js/.test(gone.out)
  && /::error::allowlisted path is not in the commit: gone2/.test(gone.out) && gone.site.length === 0, gone.status + " " + gone.out.slice(0, 300));
const few = fixture(["a.js"], "publish a.js\n");
check("C fixture: a list with too few publish lines stops the export", few.status !== 0 && /names only 1 publish paths/.test(few.out), few.out.slice(0, 200));

// D. every path the served-path assertion requires is published
const assertStep = WF.slice(WF.indexOf("Assert every browser-served path is present"), WF.indexOf("Upload Pages artifact"));
const must = [...assertStep.matchAll(/"_site\/([^"]+)"/g)].map((m) => m[1]);
const notPub = must.filter((p) => !published.has(p));
check("D the assertion's " + must.length + " required paths are all published", must.length > 40 && notPub.length === 0, notPub.join(", "));
const dirs = (/for d in ([^;]+); do/.exec(assertStep) || [, ""])[1].trim().split(/\s+/).filter(Boolean);
const emptyDirs = dirs.filter((d) => ![...published].some((f) => f.startsWith(d + "/")));
check("D the assertion's served folders hold published files (" + dirs.join(", ") + ")", dirs.length >= 3 && emptyDirs.length === 0, emptyDirs.join(", "));

// F. every literal path a workflow stages is decided
// Workflows whose git add names a path the test cannot read (a variable, or a whole split folder). Each entry says
// why it is safe; an entry no workflow needs fails as stale.
const DYNAMIC = {
  "cer-decision-apply.yml": "stages $PLAN_DIR, a plan folder already committed on main (and decided) before the apply runs",
  "course-title-cleanup-apply.yml": "stages $PLAN_DIR, a plan folder already committed on main before the apply runs",
  "esl-sheet-apply.yml": "stages $PLAN_DIR, a plan folder already committed on main before the apply runs",
  "funding-config-edit-apply.yml": "stages $PLAN_DIR, a plan folder already committed on main before the apply runs",
  "credential-family-apply.yml": "stages $DIR = kb/receipts/credential_family_..., inside the withheld kb/receipts",
  "harvest-gap-census.yml": "stages \"$f\" over a fixed list of kb/status files, each tracked and decided",
  "docket-process.yml": "stages git add -A kb/ (the docket's rulings and receipts); a new kb/ path it writes fails check B on main",
  "chatbox-ghost-delete.yml": "stages $RECEIPT, a kb/receipts/chatbox_ghost_delete_<UTC> folder inside the withheld kb/receipts",
  "cred-rename-apply.yml": "stages $RECEIPT, the apply's receipt folder under the withheld kb/receipts",
  "overmerge-apply.yml": "stages the split kb/row_audit/ whole: its dated .md are withheld by pattern, latest.json published",
  "phase-1e-apply.yml": "stages the split kb/row_audit/ whole: its dated .md are withheld by pattern, latest.json published",
};
const wfDir = ".github/workflows";
const sources = fs.readdirSync(wfDir).filter((f) => /\.ya?ml$/.test(f)).map((f) => [f, fs.readFileSync(path.join(wfDir, f), "utf8")]);
fs.readdirSync("scripts").filter((f) => /\.sh$/.test(f)).forEach((f) => sources.push(["scripts/" + f, fs.readFileSync(path.join("scripts", f), "utf8")]));
const staged = [];
const dynamicSeen = new Set();
sources.forEach(([name, text]) => {
  const joined = text.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n").replace(/\\\n\s*/g, " ");
  for (const m of joined.matchAll(/\bgit add\b([^\n;|&)]*)/g)) {
    const tokens = m[1].replace(/\s\d?>\S*/g, " ").trim().split(/\s+/).filter(Boolean);
    tokens.forEach((t) => {
      if (/^-/.test(t)) return;
      const tok = t.replace(/^["']|["']$/g, "");
      if (/[$`]/.test(tok) || tok === "." || tok === "kb/" || tok === "kb") { dynamicSeen.add(name); return; }
      const p = tok.replace(/\/$/, "");
      // A whole split folder (some tracked file under it, no one line covering it) cannot be read path by path.
      const splitFolder = !p.includes("*") && tracked.some((f) => f.startsWith(p + "/")) && !publishLineFor(p) && !withholdFor(p);
      if (splitFolder) { dynamicSeen.add(name); return; }
      staged.push([name, p]);
    });
  }
});
const sample = (p) => p.replace(/\*/g, "x");
// git add skips a gitignored path, so it is never committed and needs no line.
const ignored = new Set((spawnSync("git", ["check-ignore", "--no-index", "--stdin"], { input: staged.map(([, p]) => p).join("\n") + "\n", encoding: "utf8" }).stdout || "").split("\n").filter(Boolean));
const undecidedStaged = staged.filter(([, p]) => !ignored.has(p) && !decided(sample(p)) && !decided(sample(p) + "/x"));
check("F every literal path a workflow stages is decided, tracked or not (" + staged.length + " paths)",
  staged.length > 100 && undecidedStaged.length === 0,
  undecidedStaged.map(([w, p]) => w + ": " + p).slice(0, 10).join("; "));
const unlisted = [...dynamicSeen].filter((w) => !DYNAMIC[w]);
check("F every workflow with unreadable staging is listed with its reason", unlisted.length === 0, unlisted.join(", "));
const staleDyn = Object.keys(DYNAMIC).filter((w) => !dynamicSeen.has(w));
check("F no DYNAMIC entry is stale", staleDyn.length === 0, staleDyn.join(", "));
check("F the staging scan reads the daily list and the program-course fetch",
  staged.some(([w, p]) => w === "daily-dashboard.yml" && p === "kb/exhibit_audit/*.md")
  && staged.some(([w, p]) => w === "program-course-fetch.yml" && p === "kb/reference/coci_program_file.csv"));

// G. withhold patterns are narrow
const PAGE_EXT = /^\*\.(js|mjs|cjs|html?|css|json|svg|png|jpe?g|webp|woff2?)$/;
const broad = patternWh.filter((w) => w.split("/").some((s) => s.includes("*") && (s === "*" || PAGE_EXT.test(s))));
check("G no withhold pattern is a bare wildcard or a bare page type (*.js, *.html, *.json ...)", broad.length === 0, broad.join(", "));
const OVERLAP_OK = {
  "kb/*_out": "kb/csr_out/latest.json and kb/cer_procedures_out/latest.json are served by their own lines",
  "kb/status/mid_outcomes_compare_*": "the compares committed before S649 stay published by their own lines",
};
const hidesServed = L.withhold.filter((w) => !OVERLAP_OK[w] && must.some((p) => matches(p, w)));
check("G no withhold line matches a path the served-path assertion names (outside OVERLAP_OK)", hidesServed.length === 0, hidesServed.join(", "));
const overlaps = patternWh.filter((w) => [...published].some((f) => matches(f, w)) && !OVERLAP_OK[w]);
check("G a withhold pattern overlaps a published file only where OVERLAP_OK says why", overlaps.length === 0, overlaps.join(", "));
const deadPatterns = patternWh.filter((w) => !tracked.some((f) => matches(f, w)) && !staged.some(([, p]) => matches(sample(p), w)));
check("G every withhold pattern matches a tracked file or a staged path", deadPatterns.length === 0, deadPatterns.join(", "));
// The guards catch the over-broad patterns a review planted (#3278 finding 11).
check("G a planted \"withhold *.js\" or \"withhold kb/*.json\" would be refused",
  ["*.js", "*.html", "kb/*.json", "kb/*"].every((w) => w.split("/").some((s) => s.includes("*") && (s === "*" || PAGE_EXT.test(s)))));

let failed = 0;
results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
console.log("\npages_allowlist.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
