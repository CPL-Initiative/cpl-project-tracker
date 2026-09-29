/* cpl_funding_earn_retired.test.js — "earn" is retired from the funding tab's
 * READER-FACING TEXT (Sam, 2026-09-13).
 *
 * ⚠ WHY THIS EXISTS BESIDE cpl_funding_calm's §5 BAN, WHICH CHECKS THE SAME
 * WORDS. The calm ban reads `mountWords(doc)` — the text the fixture actually
 * paints. Measured while writing it: reintroducing "They still earn normally"
 * into the ORPHAN-BAND note left the calm suite 57/57 GREEN, because that note
 * renders only when a priority's milestone fails to resolve and the fixture has
 * no such priority. A ban on rendered output covers only the branches the
 * fixture reaches, and this tab has many it does not. It also never sees the CSV
 * export, which is read by a human and is where "Earned <window>" was still
 * sitting as a column header after the first sweep pass.
 *
 * So this one reads the SOURCE. The two together are the whole guard: the calm
 * ban proves the words are gone from what a curator sees, this proves they are
 * gone from what the file can ever say.
 *
 * Sam, 2026-09-13, reversing his 2026-09-09 choice of "earns" over "draws":
 *   "Earned still smacks of banking... would be better to use something like
 *    'measured... or... qualified for'"
 * The map he confirmed:
 *   earns against       -> counts toward   (the MEASURE is the actor)
 *   a college earns     -> qualifies for
 *   earned (the result) -> demonstrated    (the statute's own verb, §78093.2(d)(2):
 *                                           "Each campus shall demonstrate that it
 *                                            has implemented...")
 *   unearned            -> remaining
 */
const fs = require("fs");
const path = require("path");

let pass = 0, fail = 0;
function check(name, ok) { (ok ? pass++ : fail++); console.log((ok ? "PASS  " : "FAIL  ") + name); }

const RAW = fs.readFileSync(path.join(__dirname, "..", "cpl_funding.js"), "utf8");

/* ── comments out ─────────────────────────────────────────────────────────────
 * ⚠ NO TOKENIZER. The first version of this guard walked the file quote by
 * quote and reported FOUR code comments as rendered prose: it read `/\s+/g` as
 * division, fell out of sync by one quote, and swallowed everything up to the
 * next one. Verified before relying on the regexes below: this file has no `/*`
 * inside any string literal, and the only in-string `//` is the `https://` of
 * SUPABASE_URL — so a line comment is `//` NOT preceded by a colon. */
const NO_BLOCK = RAW.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const CODE = NO_BLOCK.split("\n").map((ln) => ln.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n");

/* ── what counts as a WORD, not a name ────────────────────────────────────────
 * An occurrence glued to an identifier or a hyphenated class is a NAME and keeps
 * the word on purpose: renaming `earnedMoney`, `earnFraction`, `row.earned_total`
 * or `.cplfund-earned-line` is a data/API change, not a vocabulary one.
 * The lookarounds do that work, and they also spare "learning" and "learners" —
 * "credit for prior learning" is the program's own name, and a sweep that
 * matched inside it would ban the tab's subject from the tab. */
const WORD = /(?<![\w$.-])(un)?earn(s|ed|ing|ings|able)?(?![\w$-])/gi;

check("a name keeps the word", ["earnedMoney", "winEarned", "row.earned_total", "_earnCache",
  "cplfund-earned-line", "earnFraction"].every((s) => { WORD.lastIndex = 0; return !WORD.test(s); }));
check("the program's own name is untouched", ["credit for prior learning", "working learners"]
  .every((s) => { WORD.lastIndex = 0; return !WORD.test(s); }));
check("a bare word is still caught", ["they still earn normally", "Earned 2026-27", "unearned funding"]
  .every((s) => { WORD.lastIndex = 0; return WORD.test(s); }));

/* ── the two exemptions, each named so it cannot rot silently ─────────────── */

/* 1. VALUES, not sentences: the status value and the explainer's section id.
 *    The id is a STORED CURATION KEY — a curator's saved `titles.earning` /
 *    `secHidden.earning` override is filed under it, so renaming it orphans
 *    their edit. Both are a quoted word standing alone. */
const VALUE = /^["'](earned|earning)["']$/;

/* 2. THE STUDENT SENSE, by the same subject test Sam applied to expended-vs-
 *    allocated on 2026-09-09: check WHO the sentence is about. A COLLEGE earning
 *    FUNDING is the banking sense he retired. A STUDENT earning CREDIT is
 *    ordinary academic English and the language the statute and Title 5 use about
 *    students — not the connotation he objected to. */
const STUDENT_SENSE = "documenting the CPL they earn in the";

/* ── only what is INSIDE a string reaches a reader ─────────────────────────────
 * `earned: 0` is an object key and `function earnedSubHtml(cap, earned, ...)` is
 * a parameter — code, not text, and both sit outside any quote. Scanning quoted
 * spans per line separates them without a whole-file tokenizer: every rendered
 * string in this file is single-line, concatenated with `+` across lines. */
function quotedSpans(line) {
  const out = []; let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c; let buf = ""; i++;
      while (i < line.length) {
        if (line[i] === "\\") { i += 2; continue; }
        if (line[i] === q) { i++; break; }
        buf += line[i]; i++;
      }
      out.push(buf); continue;
    }
    i++;
  }
  return out;
}

const offenders = [];
CODE.split("\n").forEach((ln, i) => {
  if (ln.indexOf(STUDENT_SENSE) !== -1) return;
  quotedSpans(ln).forEach((span) => {
    if (VALUE.test('"' + span + '"')) return;
    WORD.lastIndex = 0;
    if (WORD.test(span)) offenders.push("line " + (i + 1) + ": " + span.replace(/\s+/g, " ").slice(0, 80));
  });
});

check("no reader-facing text in cpl_funding.js carries the earn family — " +
  (offenders.length ? offenders.slice(0, 6).join(" | ") + (offenders.length > 6 ? " (+" + (offenders.length - 6) + " more)" : "") : "clean"),
  offenders.length === 0);

check("the student-subject exemption still describes a sentence that exists",
  RAW.indexOf(STUDENT_SENSE) !== -1);

/* A sweep that deleted the word and said nothing in its place would pass
 * everything above. */
["counts toward", "qualifies by origination", "demonstrated", "remaining"].forEach((w) => {
  check("the confirmed replacement vocabulary is in use: " + w, RAW.indexOf(w) !== -1);
});

console.log("\n" + pass + "/" + (pass + fail) + " assertions passed");
if (fail) process.exit(1);
