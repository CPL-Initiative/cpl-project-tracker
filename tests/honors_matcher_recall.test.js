// Self-recall for the Honors rows plan (S653): two derivations of the pairs, the course-title test and the lump test,
// each against hand labels in both directions (kb/_honors_matcher_recall.py).
//
// WHY. #3315's second review: the first recall test shared the matcher's blind spot (a space before Fullerton's
// college letter, "PHIL 225 F"), and its "right" was the matcher's pairs less a wrong list, so it could never fall.
// Now right, wrong and missed come from labeled pairs only; the plan writes a row only where the matcher and a second
// derivation that shares none of its code both find the pair; and the title and lump tests that hold a fold or a
// lumped base carry their own labels.
//
// S654: #3315's third review found the lump test could not fail; the fourth found the narrow rule that replaced it
// leaking too, and the rows now rest on anchors, labeled at the anchor and the cluster level with a mutation per clause.
//
// Measured 2026-11-15 on the committed members file (2026-11-14 20:25): matcher right 29, wrong 0, missed 2; second
// derivation right 31, wrong 1 (MATH 211 with MATH 221, which the matcher holds out); titles right 22, wrong 2; the
// anchors 19 right of 19; clusters 16 right of 16; 13 clauses, each caught.
//
// Run from repo root: `npm test` (or `node tests/honors_matcher_recall.test.js`).
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
const check = (name, ok, why) => results.push([name, !!ok, why]);
const key = (p) => p[0] + " / " + p[1];

const r = spawnSync("python3", ["kb/_honors_matcher_recall.py", "--json"], { cwd: ROOT, encoding: "utf8" });
let res = {};
try { res = JSON.parse(r.stdout); } catch (e) { res = { error: (r.stderr || r.stdout || "").slice(-400) }; }
check("(1) the measures run", r.status === 0 && !res.error, res.error || "exit " + r.status);

const fx = res.fixtures || [];
check("(2) twenty-eight fixtures, the space before the college letter and before the H marker among them",
  fx.length === 28 && fx.some((f) => /PHIL 225HF/.test(f.name)) && fx.some((f) => /ECON 101 H/.test(f.name))
  && fx.some((f) => /LING 101 HC/.test(f.name)) && fx.some((f) => /MATH 1A H/.test(f.name)), fx.length + " fixtures");
fx.forEach((f) => check("(3) " + f.name, f.pass, "expected " + f.expected + ", got " + f.got));

const m = res.matcher || {}, s = res.second || {}, both = res.both || {};
check("(4) right is counted from labels, never from a found set", m.right <= res.labels.real && s.right <= res.labels.real
  && m.right + m.missed === res.labels.real && s.right + s.missed === res.labels.real);
check("(5) the rows' set (both derivations) makes no labeled-wrong pair", both.wrong === 0, JSON.stringify(both.wrong_pairs));
const knownMiss = new Set(["HUMA M10ME / HUMA M1110", "LIBR M10CJ / LIBR M1040", "COUN M10UB / BUSI M1381",
  "PHS 103 / SOCI M10AA"]);
// HUMA M10ME and LIBR M10CJ sit merged in the committed payload until the daily run syncs #3304's delete.
check("(6) the matcher misses only the labeled pairs it is known to miss", (m.missed_pairs || []).every((p) => knownMiss.has(key(p))),
  JSON.stringify(m.missed_pairs));
check("(7) the second derivation's one labeled-wrong pair is the one the matcher holds out (MATH 211 / MATH 221)",
  (s.wrong_pairs || []).every((p) => key(p) === "MATH 211 / MATH 221"), JSON.stringify(s.wrong_pairs));
const src = fs.readFileSync(path.join(ROOT, "kb/_honors_pairs_second.py"), "utf8");
check("(8) the second derivation shares no code with the matcher: no import of it, no call into it",
  !/import\s+_reclustering_s648_dryrun|from\s+_reclustering_s648_dryrun|(code_key|find_base|honors_code_base|is_honors)\(|s648\./.test(src));

const t = res.titles || {};
const tWrong = (t.pairs || []).filter((x) => !x.pass).map((x) => x.a + " / " + x.b).sort();
check("(9) the course-title test: the two known wrong answers and no other", t.right >= 22
  && JSON.stringify(tWrong) === JSON.stringify(["English Composition / College Composition", "Hist of the Americas / Histology of the Americas"]),
  JSON.stringify(tWrong));
check("(10) the course-title test keeps one-character marks: I and II, A and B, 1 and 2 differ", (t.pairs || [])
  .filter((x) => /Calculus (1|I)$|Chemistry A|Language 1|French 2/.test(x.a + "|" + x.b)).every((x) => x.pass));
// The anchored rows (S654, kb/_honors_anchors.py), labeled by hand at the anchor and the cluster level; never from the
// rule's output. Each clause of rules 1 to 3, dropped in turn, must fail a label (#3315's fourth review: a test that
// cannot fail guards nothing).
const an = res.anchors || {};
check("(11) the anchor labels (rule 1), every one right: the space-before-H shapes, a part I beside a part II, a "
  + "series letter H, a number pair with different titles", an.labels >= 19 && an.wrong === 0, JSON.stringify(an.wrong_labels));
const anTxt = JSON.stringify(an.pairs || []);
check("(11b) the anchor labels include ECON 101 H, LING 101 HC and MATH 1A H", /ECON 101 H/.test(anTxt)
  && /LING 101 HC/.test(anTxt) && /MATH 1A H/.test(anTxt));
const cl = res.clusters || {};
check("(11c) the cluster labels (rules 2 and 3), every one right", cl.labels >= 16 && cl.wrong === 0,
  JSON.stringify(cl.wrong_labels));
const real = ((cl.real || {}).pairs || []).map((x) => x.honors_id);
check("(11d) the cluster labels say what the rule does with each id four reviews named",
  ["LIBR M10CL", "BIOL M1317", "HIST M1165", "HUMA M10LS", "MATH M10NA", "MATH M1333"].every((i) => real.indexOf(i) >= 0),
  real.join(", "));
const mut = res.mutation || [];
check("(11e) each of the 13 clauses of rules 1 to 3, dropped, fails a label", mut.length === 13 && mut.every((m) => m.caught),
  JSON.stringify(mut.filter((m) => !m.caught).map((m) => m.clause)));
const rsrc = fs.readFileSync(path.join(ROOT, "kb/_honors_matcher_recall.py"), "utf8");
check("(11f) the cluster labels resolve through kb/alias_chain.py and fail on an id that is gone",
  /alias_chain\.resolve_id/.test(rsrc) && /no such pair/.test(rsrc) && !/NARROW_LABELS|LUMP_LABELS/.test(rsrc));
check("(12) every count names its measure", /unified_courses_members\.js/.test(res.measure || ""), res.measure);

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_matcher_recall.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
