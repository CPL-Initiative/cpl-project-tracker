// Sierra Training — the curator control for WHERE an instruction applies
// (v56, 2026-08-22).
//
// ⭐ WITHOUT THIS UI THE COLUMN IS INERT. `sierra_guidance.surface` and the edge
// function's filter are both useless if nobody can set a value, and the rule that
// motivated the whole change — 15ec666b, written for the My College tab and
// reaching all six surfaces since it was created — is an EXISTING row. A composer
// picker alone would only scope rules written from now on, which fixes nothing
// that is currently wrong. Hence a per-row control, and hence this file.
//
// ⚠ THE THIRD COPY OF ONE VOCABULARY. The surface list now lives in the edge
// function (KNOWN_SURFACES), the SQL CHECK constraint, and this tab's picker. A
// value present in the picker but absent from the other two scopes a rule to
// NOBODY, and a rule that reaches nobody is invisible and unfalsifiable — you
// cannot tell it from a rule Sierra is choosing to ignore.
// tests/sierra_surface.test.js pins function-vs-SQL; this pins picker-vs-function.
//
// Run from repo root: `npm test` (or `node tests/sierra_training_surface.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const TRAIN = fs.readFileSync("sierra_training.js", "utf8");
const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let M = null;
block("lift", function () {
  M = liftBlock(SRC, "const KNOWN_SURFACES", "function buildSystemPrompt(",
    ["KNOWN_SURFACES"]);
});

// ── (1) The picker's vocabulary equals the function's ────────────────────────
block("(1)", function () {
  if (!M) { check("(1) could not lift KNOWN_SURFACES", false); return; }
  const list = (TRAIN.split("var SURFACES = [")[1] || "").split("];")[0];
  const keys = (list.match(/k:\s*"([a-z-]*)"/g) || [])
    .map((m) => m.replace(/k:\s*"/, "").replace(/"$/, ""));
  check("(1) the picker offers the everywhere default FIRST",
    keys[0] === "", "an empty key is 'everywhere'; it must be the default option");
  const named = keys.filter(Boolean);
  const missing = [...M.KNOWN_SURFACES].filter((k) => named.indexOf(k) < 0);
  const extra = named.filter((k) => !M.KNOWN_SURFACES.has(k));
  check("(1) ⭐ every surface the function accepts is offered to the curator",
    missing.length === 0, "not offered: " + missing.join(", "));
  check("(1) ⚠ …and the picker offers nothing the function would ignore",
    extra.length === 0,
    "offered but unknown to the function: " + extra.join(", ")
    + " — picking it would scope the rule to nobody");
});

// ── (2) "Everywhere" must store NULL, never "" ───────────────────────────────
// The function reads `surface is null or surface = <this>`. An empty string
// matches no surface, so a rule saved as "" would reach nobody while the UI
// showed it as applying everywhere — displayed state disagreeing with sent
// state, which is the exact shape of the bug this whole change came from.
block("(2)", function () {
  check("(2) ⭐ the composer sends NULL for everywhere",
    /surface:\s*surface \|\| null,/.test(TRAIN));
  check("(2) ⭐ …and so does the per-row control",
    /surface:\s*surface \|\| null, updated_by: whoAmI\(\)/.test(TRAIN));
  check("(2) ⚠ nothing ever writes a bare empty string to the column",
    !/surface:\s*""/.test(TRAIN) && !/surface:\s*''/.test(TRAIN));
});

// ── (3) An EXISTING rule can be re-scoped — the motivating case ──────────────
block("(3)", function () {
  check("(3) ⭐ there is a per-row control, not just a composer picker",
    /data-guid-surface-row/.test(TRAIN),
    "15ec666b already exists; a composer-only picker fixes nothing already wrong");
  check("(3) it writes with PATCH scoped to one id",
    /"\/sierra_guidance\?id=eq\." \+ encodeURIComponent\(id\)/.test(TRAIN)
    && /method: "PATCH"/.test(TRAIN));
  check("(3) ⚠ an empty response body is reported as FAILURE, not success",
    /if \(!row\) throw new Error\("no row updated/.test(TRAIN),
    "an RLS-filtered write returns 200 with no rows — treating that as success "
    + "would tell a curator the rule was scoped when it was not");
  check("(3) ⚠ …and the local state is updated only AFTER the write lands",
    TRAIN.indexOf("if (!row) throw new Error(\"no row updated")
      < TRAIN.indexOf("g.surface = row.surface"),
    "painting first would show a rule as scoped while Sierra still reads it everywhere");
  check("(3) the failure path says the rule is UNCHANGED",
    /It is unchanged, and Sierra still sends it exactly as before/.test(TRAIN));
});

// ── (4) A scoped rule is visible as scoped ───────────────────────────────────
block("(4)", function () {
  check("(4) ⭐ a scoped row carries a chip naming where it applies",
    /r\.surface\s*\n?\s*\?\s*'<span class="sit-chip"/.test(TRAIN)
    || /\(r\.surface[\s\S]{0,200}sit-chip/.test(TRAIN));
  /* ⚠ `r.surface` appears TWICE in this construct (the condition and the label),
   * so splitting on it truncates before the else-branch and reports a correct
   * implementation as missing. Match the whole ternary instead — third time in
   * this session that a delimiter appearing inside the data broke one of my own
   * checks (see methodology-assert-that-an-argument-arrives-not-that-it-is-last). */
  check("(4) ⚠ …and an UNSCOPED row prints no chip",
    /\(r\.surface[\s\S]{0,300}?:\s*""\)/.test(TRAIN),
    "six rows all saying 'Everywhere' is noise, not information");
  check("(4) ⚠ an unrecognized stored value reads as a FINDING, not as everywhere",
    /return "Unknown surface: " \+ v;/.test(TRAIN),
    "rendering it as 'Everywhere' is the one reading that is actively wrong");
});

// ── (5) The column is actually read back ─────────────────────────────────────
block("(5)", function () {
  check("(5) the list query selects surface",
    /select=id,rule,kind,surface,active/.test(TRAIN),
    "without this the chip and the picker would render from undefined on every "
    + "row and silently look like 'everywhere'");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_training_surface.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
