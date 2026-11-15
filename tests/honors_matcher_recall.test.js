// Self-recall for the Honors rows plan (S653): two derivations of the pairs, the course-title test and the lump test,
// each against hand labels in both directions (kb/_honors_matcher_recall.py).
//
// WHY. #3315's second review: the first recall test shared the matcher's blind spot (a space before Fullerton's
// college letter, "PHIL 225 F"), and its "right" was the matcher's pairs less a wrong list, so it could never fall.
// Now right, wrong and missed come from labeled pairs only; the plan writes a row only where the matcher and a second
// derivation that shares none of its code both find the pair; and the title and lump tests that hold a fold or a
// lumped base carry their own labels.
//
// S654: #3315's third review found the lump test could not fail (finding 3: its 12 positives were lumps the rule
// already caught), so the narrow rule that replaced it is scored on positives and negatives written by hand.
//
// Measured 2026-11-15 on the committed members file (2026-11-14 20:25): matcher right 29, wrong 0, missed 2; second
// derivation right 31, wrong 1 (MATH 211 with MATH 221, which the matcher holds out); titles right 22, wrong 2; the
// narrow rule, must hold 24 right 24 wrong 0, must pair 24 right 20 wrong 4 (over-holds).
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
// The narrow rule (S654), scored without the plan's named lists so it can fail. Positives come from #3315's third
// review, findings 1 and 2 (written by hand, never from the rule's output); negatives are plain one-course bases read
// by hand. A wrong negative is an over-hold, which fails closed; the four known ones are pinned so a fifth shows.
const nr = res.narrow || {};
const pos = nr.positives || {}, neg = nr.negatives || {};
check("(11) the narrow rule holds every positive: the review's 17 named bases, the six title-only rows, two more",
  pos.labels >= 24 && pos.wrong === 0 && pos.right === pos.labels, JSON.stringify(pos));
const knownOver = ["ARCH M10JH / ARCH M1059", "ENGL M10DS / ETHA M1002", "FREN M10AH / FREN M1036", "FTVE M1045 / FTVE M1046"];
check("(11b) the narrow rule pairs the plain one-course bases, apart from four known over-holds", neg.labels >= 24
  && (neg.wrong_pairs || []).every((x) => knownOver.some((k) => x.indexOf(k) === 0)) && neg.right >= 20,
  JSON.stringify(neg));
const named = (nr.pairs || []).filter((x) => x.expected_hold);
check("(11c) the positives' labels include every base findings 1 and 2 named", ["MUSI M1044", "HUMA M1114", "ITIS M1068",
  "BIOL M1262", "HIST M1183", "BIOL M1049", "ENGL M1348", "MATH M1123", "HUMA M1125", "ETHS M1256", "ASTR M1019",
  "FTVE M1002", "FREN M1035", "FREN M1014", "JAPN M1017", "JAPN M1032", "MUSI M1237"]
  .every((b) => named.some((x) => x.base === b)), named.length);
const rsrc = fs.readFileSync(path.join(ROOT, "kb/_honors_matcher_recall.py"), "utf8");
check("(11d) the labels share no parser with the rule: the label table is literal, never computed from narrow_reasons",
  /NARROW_LABELS = \{/.test(rsrc) && !/NARROW_LABELS\s*=\s*(\{[^}]*for |dict\(|\[)/.test(rsrc) && !/LUMP_LABELS/.test(rsrc));
check("(12) every count names its measure", /unified_courses_members\.js/.test(res.measure || ""), res.measure);

const bad = results.filter((x) => !x[1]);
results.forEach(([n, ok, why]) => console.log((ok ? "  ok  " : "  FAIL ") + n + (ok ? "" : "\n        " + why)));
console.log(`\nhonors_matcher_recall.test.js: ${results.length - bad.length}/${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
