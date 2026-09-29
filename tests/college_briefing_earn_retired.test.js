/* college_briefing_earn_retired.test.js — the funding vocabulary holds on the
 * COLLEGE BRIEFING's reader-facing text, not only on the funding tab.
 *
 * Sam retired the banking register from every funding surface: "pool" for the
 * model's total (2026-08-31; the NAME one-pool and identifiers stay), "draw" in its
 * banking sense and "unspent" (2026-09-09), then the earn family (2026-09-13:
 * "Earned still smacks of banking... would be better to use something like
 * 'measured... or... qualified for'"), "money" and the advance concept
 * (2026-08-31, 2026-09-01). The map he confirmed:
 *   earns against       -> counts toward   (the MEASURE is the actor)
 *   a college earns     -> qualifies for
 *   earned (the result) -> demonstrated    (the statute's verb, §78093.2(d)(2))
 *   unearned            -> remaining
 *   the dollars / money -> the funding
 *
 * Two guards already hold the funding tab to it: cpl_funding_calm reads the
 * tab's rendered DOM and cpl_funding_earn_retired reads cpl_funding.js. Neither
 * opens college_briefing.js, whose funding box still said "earns against",
 * "drawable" and "the dollars" on 2026-09-24 (handoff 285 carryover). This
 * guard reads THAT source, the way the funding one does: a rendered-text ban
 * covers only the branches a fixture paints, and the briefing's funding box
 * has a floor branch, a cap branch and a gate branch the fixture never
 * reaches at once.
 *
 * ⚠ THE STUDENT SENSE STAYS. "Credit students have earned that has not been
 * acted on" is a STUDENT earning CREDIT — ordinary academic English and the
 * statute's own usage. Sam's subject test (2026-09-09, expended vs allocated):
 * check WHO the sentence is about. A COLLEGE earning FUNDING is the banking
 * sense; a student earning credit is not. The exemption is named so it cannot
 * rot silently.
 */
const fs = require("fs");
const path = require("path");

let pass = 0, fail = 0;
function check(name, ok) { (ok ? pass++ : fail++); console.log((ok ? "PASS  " : "FAIL  ") + name); }

const RAW = fs.readFileSync(path.join(__dirname, "..", "college_briefing.js"), "utf8");

/* comments out — same shape as cpl_funding_earn_retired: no tokenizer, block
 * comments blanked, a line comment is `//` not preceded by a colon (the only
 * in-string `//` is the scheme of a URL). */
const NO_BLOCK = RAW.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const CODE = NO_BLOCK.split("\n").map((ln) => ln.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n");

/* a WORD, not a name: an occurrence glued to an identifier or a hyphenated
 * class keeps the word (renaming `earned_withheld` or `.cb-earned` is an API
 * change, not a vocabulary one), and the lookarounds spare "learning". */
const BANS = {
  "the earn family": /(?<![\w$.-])(un)?earn(s|ed|ing|ings|able)?(?![\w$-])/gi,
  "the banking sense of draw": /(?<![\w$.-])draw(s|n|able|ing|-?down|-?downs)?(?![\w$-])/gi,
  "unspent": /\bunspent\b/gi,
  "the dollars": /\bthe dollars\b/gi,
  "money": /\bmoney\b/gi,
  "pool": /(?<![\w$.-])pools?(?![\w$-])/gi,
  "the advance concept": /\badvances?\b(?! (the|each|Vision))/gi,
  "British spelling": /\b(modell(ed|ing)|colour|behaviour|organis(e|ed|ation)|recognis(e|ed)|centred?|programme|licence|cheque|whilst|amongst)\b/gi,
};

check("a name keeps the word", ["earned_withheld", "winEarned", "cb-earned", "drawItems", "moneyFmt", "one-pool"]
  .every((s) => Object.values(BANS).every((re) => { re.lastIndex = 0; return !re.test(s); })));
check("the program's own name is untouched", ["credit for prior learning", "working learners", "withdrawn"]
  .every((s) => Object.values(BANS).every((re) => { re.lastIndex = 0; return !re.test(s); })));
check("a bare word is still caught", ["it earns against this figure", "never drawable by credit work",
  "the dollars roll forward", "a different route to money", "No allocation modelled"]
  .every((s) => Object.values(BANS).some((re) => { re.lastIndex = 0; return re.test(s); })));

/* THE ONE EXEMPTION: the student sense, named so a drift shows. */
const STUDENT_SENSE = "Credit students have earned";

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
    Object.keys(BANS).forEach((k) => {
      const re = BANS[k]; re.lastIndex = 0;
      if (re.test(span)) offenders.push(k + " @ line " + (i + 1) + ": " + span.replace(/\s+/g, " ").slice(0, 80));
    });
  });
});

check("no reader-facing text in college_briefing.js carries the banking register — " +
  (offenders.length ? offenders.slice(0, 6).join(" | ") + (offenders.length > 6 ? " (+" + (offenders.length - 6) + " more)" : "") : "clean"),
  offenders.length === 0);

check("the student-subject exemption still describes a sentence that exists",
  RAW.indexOf(STUDENT_SENSE) !== -1);

/* A sweep that deleted the words and said nothing in their place would pass
 * everything above. */
["counts toward", "count toward", "qualifies for", "demonstrated funding"].forEach((w) => {
  check("the confirmed replacement vocabulary is in use: " + w, RAW.indexOf(w) !== -1);
});

console.log("\n" + pass + "/" + (pass + fail) + " assertions passed");
if (fail) process.exit(1);
