// tests/college_identity_non_ccc.test.js
//
// A RULED INSTITUTION OUTSIDE THE SYSTEM IS NOT "UNKNOWN" (handoff 625 item 3, the identity lane's NEXT).
//
// Sam ruled on 2026-10-04 what Cal State LA is: the first CSU campus on MAP, kept in the mix
// (kb/non_ccc_institutions.json). The identity lint did not read that file, so the name showed as `unknown`, "claimed
// by no identity", and a session read it as a call still waiting on him (handoff 625, the correction to carry).
//
// Guards the failure modes that matter:
//   1. The shipped artifact carries the name as `non_ccc`, with who ruled and when from that entry's own fields.
//   2. The lint matches a variant, leaves a community college alone, and falls back to `unknown` with no list. An
//      entry carries its own date; an entry with none names nobody (the file's source line is never borrowed); a
//      malformed list stops the builder.
//   3. A ruling outranks the live read: with the contacts loaded the tab still shows the ruled class and who ruled,
//      for this name and for a separate MAP org awaiting its id.
//
// Run from repo root: `npm test` (or `node tests/college_identity_non_ccc.test.js`).
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LIST = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/non_ccc_institutions.json"), "utf8"));
const ART = fs.readFileSync(path.join(ROOT, "college_identity_data.js"), "utf8");
const TAB = fs.readFileSync(path.join(ROOT, "college_identity.js"), "utf8");
const CSULA = "California State University Los Angeles";

// ── 1. the artifact ───────────────────────────────────────────────────────────────────────────────────────────
const sandbox = { window: {} };
new Function("window", ART).call(sandbox, sandbox.window);
const data = sandbox.window.CPL_COLLEGE_IDENTITY;
const f = (data.findings || []).find((x) => x.name === CSULA);
check("1a: fixture: the list names the institution", LIST.institutions.some((i) => i.name === CSULA));
check("1b: the artifact carries it as non_ccc", !!f && f["class"] === "non_ccc", JSON.stringify(f));
check("1c: with who ruled and when, as the entry's own fields state them",
  !!f && f.decided_by === "Sam" && f.decided_on === "2026-10-04" &&
  LIST.institutions[0].decided_by === "Sam" && LIST.institutions[0].decided_on === "2026-10-04");
check("1d: the reason carries the list's note and says the name still joins to nothing",
  !!f && f.why.indexOf(LIST.institutions[0].note) === 0 && /no row in map_colleges/.test(f.why));
check("1e: no name the list covers is left unknown",
  !(data.findings || []).some((x) => x["class"] === "unknown" &&
    LIST.institutions.some((i) => [i.name].concat(i.variants || []).indexOf(x.name) >= 0)));

// ── 2. the lint itself ────────────────────────────────────────────────────────────────────────────────────────
const PY = [
  "import json, sys, importlib.util",
  "spec = importlib.util.spec_from_file_location('b', 'kb/_build_college_identity_crosswalk.py')",
  "b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)",
  "rows = [{'college_name': 'Norco College', 'variants': ['Norco']}]",
  "names = ['Norco College', 'Cal State LA', 'Sage College']",
  "import tempfile, os",
  "d = tempfile.mkdtemp()",
  "own = os.path.join(d, 'own.json'); bad = os.path.join(d, 'bad.json')",
  "json.dump({'_source': 'Sam, a sheet, 2026-10-04.', 'institutions': [",
  "  {'name': 'Second Campus', 'decided_by': 'Ashley', 'decided_on': '2027-01-15'}, {'name': 'Third Campus'}]}, open(own, 'w'))",
  "open(bad, 'w').write('{not json')",
  "try:\n    b.load_non_ccc(bad); raised = False\nexcept ValueError:\n    raised = True",
  "print(json.dumps({'with': b.lint_observed(names, rows), 'without': b.lint_observed(names, rows, non_ccc={}),",
  "  'own': b.lint_observed(['Second Campus', 'Third Campus'], rows, non_ccc=b.load_non_ccc(own)),",
  "  'missing': b.load_non_ccc('kb/no_such_file.json'), 'raised': raised}))",
].join("\n");
let lint = null;
try { lint = JSON.parse(execFileSync("python3", ["-c", PY], { cwd: ROOT, encoding: "utf8" })); } catch (e) { check("2: the lint ran: " + e.message, false); }
if (lint) {
  const cls = (list, nm) => (list.find((x) => x.name === nm) || {})["class"];
  check("2a: a variant of the name matches", cls(lint.with, "Cal State LA") === "non_ccc");
  check("2b: a community college is no finding, and an unclaimed name stays unknown",
    cls(lint.with, "Norco College") === undefined && cls(lint.with, "Sage College") === "unknown");
  check("2c: with no list the name falls back to unknown; a missing file reads as an empty list",
    cls(lint.without, "Cal State LA") === "unknown" && Object.keys(lint.missing).length === 0);
  const own = (nm) => lint.own.find((x) => x.name === nm) || {};
  check("2d: an entry carries its own ruling, never the file's source line",
    own("Second Campus")["class"] === "non_ccc" && own("Second Campus").decided_by === "Ashley" && own("Second Campus").decided_on === "2027-01-15");
  check("2e: an entry with no ruling fields is still non_ccc and names nobody",
    own("Third Campus")["class"] === "non_ccc" && !own("Third Campus").decided_by && !own("Third Campus").decided_on);
  check("2f: a malformed list stops the builder", lint.raised === true);
}

// ── 3. the tab: a ruling outranks the live read ───────────────────────────────────────────────────────────────
{
  const dom = new JSDOM("<!doctype html><div id='college-identity-root'></div>", { url: "https://example.test/", runScripts: "outside-only" });
  const w = dom.window;
  w.fetch = function () { return new Promise(function () {}); };
  new Function("window", ART).call(w, w);
  w.eval(TAB);
  const api = w.CPL_COLLEGE_IDENTITY_TAB;
  api._state.live = [{ college_id: 1, college_name: "Norco College", variants: [], entity_kind: "college" }];
  api._state.contacts = ["Norco College", CSULA, "Calbright College Credit", "Nobody Has Claimed This"];
  const root = w.document.getElementById("college-identity-root");
  api._render(root);
  const card = (nm) => Array.from(root.querySelectorAll(".cid-find")).find((x) => x.textContent.indexOf(JSON.stringify(nm)) >= 0);
  const tag = (nm) => { const c = card(nm); const t = c && c.querySelector(".cid-tag"); return t ? t.className.replace("cid-tag", "").trim() : null; };
  check("3a: loaded live, the ruled institution reads non_ccc and names who ruled",
    tag(CSULA) === "non_ccc" && /ruled by Sam, 2026-10-04/.test(card(CSULA).textContent) && /\(live\)/.test(card(CSULA).textContent));
  check("3b: a separate MAP org awaiting its id keeps its ruled class too", tag("Calbright College Credit") === "awaiting_map_id");
  check("3c: a name nobody ruled on still reads unknown", tag("Nobody Has Claimed This") === "unknown");
  check("3d: each name shows once", root.querySelectorAll(".cid-find").length ===
    new Set(Array.from(root.querySelectorAll(".cid-find .nm")).map((x) => x.textContent)).size);
}

let pass = 0;
results.forEach(([n, ok, why]) => { console.log((ok ? "PASS  " : "FAIL  ") + n + (!ok && why ? "\n        " + why : "")); if (ok) pass++; });
console.log("\n" + pass + "/" + results.length + " assertions passed");
if (pass !== results.length) process.exit(1);
