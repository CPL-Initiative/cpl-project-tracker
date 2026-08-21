// Check-count ledger — reads the number each test file reports ABOUT ITSELF,
// so that a file which silently stops running some of its checks goes red.
//
// WHY THIS EXISTS
// ---------------
// `tests/run.js` judged a test file by its EXIT STATUS alone. That is a
// complete answer to "did anything fail?" and no answer at all to "did
// everything run?" — and in this repo the second question is the one that keeps
// biting. Four separate `cpl_memory` rows record the same defect:
//
//   a-check-that-never-registers-can-never-fail   (2026-08-15)
//   never-registers-trap-recurred-in-a-second-harness (2026-08-15)
//   val-guards-the-check-the-driver-is-the-other-half (2026-08-16)
//   a-rule-you-wrote-is-not-a-rule-you-applied    (2026-08-21)
//
// Each was diagnosed, written up, and left with no consumer, so the next
// session met it again in a new file. It is the repo's most-repeated lesson and
// its least-enforced one.
//
// MEASURED, not assumed (2026-08-21). Taking `college_identity_variants.test.js`
// (12 checks, green) and skipping one block — the way a selector that stops
// matching or a driver that throws inside its own catch skips one — produces:
//
//     college_identity_variants.test.js: 10/10 checks passed      exit 0
//
// Two checks left the suite. The count printed is self-consistent, the exit
// status is 0, and the runner reported the whole run green. Nothing anywhere
// said two rules had stopped being enforced. That is the hole this closes.
//
// A missing check is an ABSENCE, not a failure: it subtracts from both sides of
// the ratio, so every run still reads "all passed". The only way to see it is to
// remember what the number used to be — which is what the ledger is for.
//
// WHAT IT DELIBERATELY DOES NOT DO
// --------------------------------
// It does not fail a file for reporting MORE checks than its floor (adding
// tests must stay free), and it does not fail a file that is absent from the
// ledger or prints no parseable count. `docs/kb-notes/
// methodology-a-guard-that-fails-on-truth-gets-muted.md` is the governing rule
// here: an assertion that fires on correct behaviour trains everyone to
// discount it, and a discounted check protects nothing. Only a DROP below a
// recorded floor is a defect, because only a drop means a check that used to
// run no longer does.

const fs = require("fs");
const path = require("path");

const LEDGER_PATH = path.join(__dirname, "..", "check_floor.json");

// The corpus states its total four ways (measured across all test files, not
// guessed). Keep this list append-only: a shape that stops being recognised
// turns a floored file into an unfloored one, which is a silent loss of cover.
//
//   "12/12 checks passed"        "21/21 assertions passed"
//   "15/15 passed"               "All 45 checks passed."
//
// Every pattern puts the TOTAL in the last capture group.
const PATTERNS = [
  /(\d+)\s*\/\s*(\d+)\s+(?:checks?|assertions?)\b/gi,
  /(\d+)\s*\/\s*(\d+)\s+passed\b/gi,
  /\ball\s+()(\d+)\s+(?:checks?|assertions?)\s+passed/gi,
];

// Read the total a file reports about itself.
//
// Files that print a per-section total as well as a grand total print the grand
// total LAST, so the last match across the whole output is the right one. A file
// that prints only per-section totals still yields a stable number, which is all
// a floor needs.
function reportedTotal(out) {
  if (!out) return null;
  let best = null;
  let bestAt = -1;
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(out)) !== null) {
      const total = Number(m[2]);
      if (Number.isFinite(total) && m.index >= bestAt) {
        bestAt = m.index;
        best = total;
      }
    }
  }
  return best;
}

function loadLedger() {
  try {
    const raw = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
    return raw && typeof raw.files === "object" && raw.files ? raw : { files: {} };
  } catch (e) {
    return { files: {} };
  }
}

// `null` in the ledger means "this file is deliberately not floored" — it prints
// no parseable count, or its count is not deterministic. Both are recorded
// rather than dropped so the unprotected set stays visible and can shrink.
function classify(file, observed, ledger) {
  const has = Object.prototype.hasOwnProperty.call(ledger.files, file);
  const floor = has ? ledger.files[file] : undefined;
  if (observed === null) return { state: has && floor !== null ? "lost-count" : "unparsed", floor, observed };
  if (!has) return { state: "unfloored", floor, observed };
  if (floor === null) return { state: "unfloored", floor, observed };
  if (observed < floor) return { state: "dropped", floor, observed };
  if (observed > floor) return { state: "grown", floor, observed };
  return { state: "ok", floor, observed };
}

function writeLedger(files, note) {
  const sorted = {};
  for (const k of Object.keys(files).sort()) sorted[k] = files[k];
  const payload = {
    _readme:
      "Minimum number of checks each test file must report. Written by " +
      "`npm run test:floor`; read by tests/run.js. A file reporting FEWER " +
      "checks than its floor fails the run — that is a check which used to be " +
      "enforced and silently is not. More is always fine. null = deliberately " +
      "unfloored (prints no parseable count, or the count is not " +
      "deterministic). See tests/lib/check_ledger.js.",
    _note: note || "",
    files: sorted,
  };
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(payload, null, 2) + "\n");
  return LEDGER_PATH;
}

module.exports = { reportedTotal, loadLedger, writeLedger, classify, LEDGER_PATH, PATTERNS };
