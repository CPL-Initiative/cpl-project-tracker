// cpl-chat — a guidance rule can be scoped to the surface that carries its fact
// (v56, 2026-08-22).
//
// ⭐ WHY. `sierra_guidance` row 15ec666b says "When using Sierra from the My
// College COBI tab, confine your answers to the selected institution." It shipped
// to ALL SIX callers, where its opening condition is unevaluable — the public
// page, the Fact Sheet drawer, map.rccd.edu, the college landing pages, the
// vendor iframe, and cpl_memory.js, which is not even a conversation: it borrows
// the model to DRAFT a memory row.
//
// ⚠ THE DEFAULT MUST BE "EVERY RULE". All 13 rows have surface NULL, so a scoped
// read is `surface IS NULL OR surface = <this one>`, never `= <this one>`. The
// second form would drop every rule the team has ever written, and it would do it
// silently — Sierra would simply stop following her instructions with nothing in
// any log. That is the single most expensive mistake available in this change,
// so it is asserted directly rather than left to reading.
//
// ⚠ AND THE TWO VOCABULARIES MUST AGREE. The TS set and the SQL CHECK constraint
// are two lists of the same thing in two systems. If they drift, a curator can
// scope a rule to a surface no caller ever sends — a rule that reaches nobody,
// which is invisible and unfalsifiable. Pinned here.
//
// Run from repo root: `npm test` (or `node tests/sierra_surface.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SQL = fs.readFileSync("chatbox/supabase_sierra_guidance.sql", "utf8");
const CHAT = fs.readFileSync("cpl_chat.js", "utf8");
const BRIEFING = fs.readFileSync("college_briefing.js", "utf8");
const SIERRA = fs.readFileSync("sierra/sierra.js", "utf8");
const FACTSHEET = fs.readFileSync("fact-sheet/factsheet_sierra.js", "utf8");
const MEMORY = fs.readFileSync("cpl_memory.js", "utf8");

/* ⚠ A FORBIDDEN-PATTERN CHECK MUST SCAN CODE, NOT PROSE. The first draft of (2)
 * matched `.eq("surface"` anywhere in the file and went red against a CORRECT
 * implementation — because the comment three lines above the fix says
 * `Never .eq("surface", surface)`, explaining the very trap being guarded. Same
 * family as SkyApply's marker-in-a-comment break: quoting a pattern a test
 * searches for makes the comment load-bearing text. Strip comments instead of
 * rewording, so the next person may explain the trap freely. */
function codeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")   // block comments
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");  // line comments (not "://")
}
const SRC_CODE = codeOnly(SRC);

let M = null;
block("lift", function () {
  M = liftBlock(SRC, "const KNOWN_SURFACES", "function buildSystemPrompt(",
    ["KNOWN_SURFACES", "normalizeSurface"]);
  check("(0) the surface block lifts cleanly", !!(M && M.normalizeSurface));
});

// ── (1) Validation: an unknown surface is null, never an unmatchable string ──
block("(1)", function () {
  if (!M) return;
  const bad = [undefined, null, "", "My-College", "mycollege", "MY-COLLEGE", 42,
               {}, [], "public ", " public", "cobi", "sierra"];
  check("(1) ⭐ every unknown or malformed surface normalizes to null",
    bad.every((b) => M.normalizeSurface(b) === null),
    "a typo must fall back to EVERY rule, not scope the request to nothing");
  check("(1) …and every known one survives",
    ["my-college", "cobi-assistant", "public", "fact-sheet", "memory-autogen"]
      .every((k) => M.normalizeSurface(k) === k));
});

// ── (2) THE EXPENSIVE MISTAKE: a scoped read must keep the unscoped rules ──
block("(2)", function () {
  check("(2) ⭐ the filter is `surface IS NULL OR surface = <this>`",
    /\.or\(`surface\.is\.null,surface\.eq\.\$\{surface\}`\)/.test(SRC),
    "all 13 rows are NULL; an .eq() would silently drop every rule the team wrote");
  check("(2) ⚠ …and no bare surface equality survives IN CODE",
    !/\.eq\(\s*["']surface["']/.test(SRC_CODE),
    "scanned with comments stripped — see codeOnly()");
  check("(2) the filter only applies when a surface was actually sent",
    /if \(surface\) \{/.test(SRC),
    "no surface must mean no filter, not a filter on null");
});

// ── (3) The filter degrades on its own, so migrate/deploy order cannot matter ──
// The pre-existing `kind` fallback covers DIRECTIVES only; the display read has
// none, so a surface filter that failed hard would take every display rule
// offline silently — the exact fail-soft-means-silently-gone trap this file's
// neighbours keep documenting.
block("(3)", function () {
  check("(3) ⭐ a failed scoped read retries UNSCOPED rather than returning null",
    /const scoped = await base\(\)\.or\(/.test(SRC) &&
    /if \(!scoped\.error\) return scoped\.data \|\| \[\];/.test(SRC),
    "otherwise a pre-migration deploy silently drops every display rule");
  check("(3) …and the unscoped read is the SAME query builder, not a second one",
    /const base = \(\) => sb/.test(SRC),
    "two hand-written queries drift; one builder cannot");
  check("(3) both kinds are given the surface",
    /fetchGuidanceKind\(sb, "directive", GUIDANCE_MAX_RULES, surface\)/.test(SRC) &&
    /fetchGuidanceKind\(sb, "display", GUIDANCE_MAX_DISPLAY, surface\)/.test(SRC));
});

// ── (4) The TS vocabulary and the SQL constraint are ONE list ────────────────
block("(4)", function () {
  if (!M) return;
  const inSql = SQL.indexOf("sierra_guidance_surface_ck") >= 0;
  check("(4) the schema of record carries the surface constraint", inSql,
    "chatbox/supabase_sierra_guidance.sql is the schema of record — the live "
    + "migration is not enough, or the next person rebuilding from it loses the column");
  if (!inSql) return;
  /* ⚠ DO NOT split(")") HERE. The first draft did, and the `public` entry's own
   * trailing comment contains "(incl. the ctx=external embed)" — so the list was
   * truncated after one entry and the check reported fact-sheet and
   * memory-autogen missing from a constraint that lists both. The delimiter
   * appears inside the data, which is the same shape as the (2) bug above.
   * Read the VALUE ENTRIES instead: a quoted token at the start of its line. */
  const window = (SQL.split("sierra_guidance_surface_ck")[1] || "").split(";")[0];
  const sqlNamesAll = (window.match(/^\s*'[a-z-]+'/gm) || [])
    .map((t) => t.trim().slice(1, -1));
  const missing = [...M.KNOWN_SURFACES].filter((k) => sqlNamesAll.indexOf(k) < 0);
  check("(4) ⭐ every surface the function accepts is allowed by the constraint",
    missing.length === 0, "missing from SQL: " + missing.join(", "));
  const extra = sqlNamesAll.filter((k) => !M.KNOWN_SURFACES.has(k));
  check("(4) ⚠ …and the constraint allows nothing the function would ignore",
    extra.length === 0,
    "in SQL but not in KNOWN_SURFACES: " + extra.join(", ")
    + " — a curator could scope a rule to a surface no caller ever sends");
});

// ── (5) Every caller declares itself, and the two-surface file does it twice ──
block("(5)", function () {
  check("(5) ⭐ ONE FILE, TWO SURFACES — the dedicated pane names itself",
    /hostSurface = 'cobi-assistant';/.test(CHAT),
    "cpl_chat.js mounts on the CPL Assistant pane AND inside My College");
  check("(5) …and the embedding host declares its own at mountInto",
    /function mountInto\(host, surface\)/.test(CHAT) &&
    /hostSurface = surface \|\| null;/.test(CHAT),
    "|| null so an older host that passes nothing gets every rule, not a wrong one");
  check("(5) My College passes it",
    /C\.mountInto\(host, "my-college"\)/.test(BRIEFING));
  check("(5) the request body carries it",
    /surface: hostSurface,/.test(CHAT));
  check("(5) the public page names itself",
    /surface: 'public'/.test(SIERRA));
  check("(5) ⚠ …and keeps `ctx` as a SEPARATE axis",
    /if \(ctxVariant\) p\.ctx = ctxVariant;/.test(SIERRA),
    "the vendor iframe is the public page with ctx=external — one surface, two gates");
  check("(5) the Fact Sheet drawer names itself",
    /surface: 'fact-sheet'/.test(FACTSHEET));
  check("(5) ⭐ the memory drafter names itself — it is NOT a conversation",
    /surface: "memory-autogen"/.test(MEMORY),
    "cpl_memory.js borrows the model to draft a row; it was never listed as a surface");
});

// ── (6) The axes stay separate ────────────────────────────────────────────────
// The recommendation Sam accepted was explicitly a FIELD, not a `mode` enum that
// bundles audience + ctx + scope + surface and then needs exceptions.
block("(6)", function () {
  check("(6) ⭐ surface is its own field, not folded into scope",
    /const hostSurface = normalizeSurface\(surface\)/.test(SRC) &&
    /const hostScope = normalizeHostScope\(scope\)/.test(SRC));
  check("(6) ⚠ …and no `mode` bundle was introduced",
    !/normalizeMode|const mode =|\bmode:\s*["']/.test(SRC));
  /* ⚠ THIS ASSERTION ONCE CLAIMED MORE THAN IT TESTED. It read "the surface
   * reaches ONLY the guidance layer so far" while testing only that
   * fetchTeamGuidance is CALLED with it — a presence check wearing an
   * exclusivity label. v58 (2026-08-24) gave the surface three more consumers —
   * the input cap, the system prompt and the interactions log — and this line
   * still passed, because an assertion pinned to one member of a set cannot
   * notice the set growing. The exclusivity claim now lives in
   * tests/sierra_memory_isolation.test.js, which pins the whole set and fails
   * when a fifth consumer appears. Here, keep the honest half. */
  check("(6) the guidance layer is one of the surface's consumers",
    /fetchTeamGuidance\(sb, hostSurface\)/.test(SRC),
    "the full consumer set is pinned in tests/sierra_memory_isolation.test.js");
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_surface.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
