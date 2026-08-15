// tests/noncredit_cip_categories.test.js
//
// Guards kb/noncredit_cip_categories.json — the CCCCO's ten noncredit categories
// and the CIP codes each may use (built by kb/_build_noncredit_cip_categories.py).
//
// The builder validates at BUILD time. This validates the COMMITTED artifact, which
// is a different guarantee: the file is small and readable, so the realistic failure
// is someone hand-editing it — adding a code, "tidying" a label — without rerunning
// the builder. A build-time-only check cannot see that.
//
// The load-bearing assertion is the label/code pairing one at the bottom. A shifted
// pairing is invisible by inspection (every code real, every code in the right
// family, every label plausible beside its neighbour) and it has now happened twice
// on this workstream: once in a relayed table, once in the first cut of the builder
// itself. Both are reproduced below as fixtures.

const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const ROOT = path.join(__dirname, "..");
const cats = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/noncredit_cip_categories.json"), "utf8"));

// The certified CIP catalog, read the same way the tab reads it.
const cwSrc = fs.readFileSync(path.join(ROOT, "cip_crosswalk_data.js"), "utf8");
const CATALOG = (() => {
  const body = cwSrc.slice(cwSrc.indexOf("{"), cwSrc.trimEnd().replace(/;$/, "").lastIndexOf("}") + 1);
  const m = {};
  for (const r of JSON.parse(body).rows) m[r.code] = r;
  return m;
})();

const byId = {};
for (const c of cats.categories) byId[c.id] = c;
const allEntries = cats.categories.flatMap((c) => c.cips.map((e) => ({ cat: c, e })));

check("ten categories, matching the CO page", cats.categories.length === 10);
check("records its source as the published page, not a relay",
  /2026-05-26/.test(cats._source) && /Noncredit Mapping/i.test(cats._source));

// Every code must exist and be Noncredit — except where the page deliberately points
// at a credit family (Substantial Disabilities -> 13.10 Special Education).
(function () {
  const missing = [], wrongCat = [];
  for (const { e } of allEntries) {
    for (const code of e.codes) {
      if (!CATALOG[code]) { missing.push(code); continue; }
      if (!e.credit_expected && CATALOG[code].cat !== "Noncredit") wrongCat.push(code);
    }
  }
  check("every CIP code in the file exists in the certified catalog", missing.length === 0);
  check("every code is Noncredit unless the page points at a credit family", wrongCat.length === 0);
})();

// ── CDCP is PER-CODE, not per-category ──────────────────────────────────────────
// Basic Skills is a CDCP category, but 32.0201 carries "SUPERVISED TUTORING may use
// this CIP; however, it is not CDCP eligible". A category-level flag would tell a
// college the opposite of the truth about one of its own codes, and CDCP is
// funding-bearing.
(function () {
  const bs = byId["basic_skills"];
  const exam = bs.cips.find((e) => e.codes.includes("32.0201"));
  check("Basic Skills is a CDCP category", bs.cdcp === true);
  check("…but 32.0201 inside it is NOT CDCP", exam && exam.cdcp === false);
  check("…and it says why, verbatim", exam && /not CDCP eligible/i.test(exam.note || ""));
  check("the other Basic Skills codes remain CDCP",
    bs.cips.filter((e) => !e.codes.includes("32.0201")).every((e) => e.cdcp === true));
})();

// 34.010x names TWO categories — a code in that range can never resolve alone.
(function () {
  const owners = cats.categories.filter((c) =>
    c.cips.some((e) => e.codes.some((x) => x.startsWith("34.010"))));
  check("34.010x belongs to exactly two categories", owners.length === 2);
  check("…and they point at each other", owners.every((c) =>
    owners.some((o) => o.id === c.shares_codes_with)));
})();

// Populations, not content — never inferable from a code.
(function () {
  const pops = cats.categories.filter((c) => c.population_not_content);
  check("two categories are populations, not content", pops.length === 2);
  check("…both accept any noncredit CIP", pops.every((c) => c.any_noncredit_cip === true));
  check("…and they are Substantial Disabilities + Courses for Older Adults",
    pops.map((c) => c.id).sort().join(",") === "older_adults,substantial_disabilities");
})();

// TOP is recorded for display only. Measured: the page's own ranges claim exactly one
// category for just 28.8% of noncredit programs, so nothing may gate on them.
check("no category treats its TOP ranges as determinative",
  cats.categories.every((c) => c.top_determinative === false));
check("every category still records its TOP ranges (for display/corroboration)",
  cats.categories.every((c) => Array.isArray(c.top_ranges) && c.top_ranges.length > 0));

// Short-Term Vocational is the one category needing a secondary credit CIP, and that
// rule is not published yet — the file must say so rather than presenting it as page text.
(function () {
  const stv = byId["short_term_vocational"];
  check("Short-Term Vocational requires a secondary credit CIP", stv.secondary_credit_cip === true);
  check("…it is the only category that does",
    cats.categories.filter((c) => c.secondary_credit_cip).length === 1);
  check("…and it is labelled as guidance ahead of publication",
    /ahead of publication/i.test(stv.unpublished_guidance || ""));
  check("Short-Term Vocational is 32.0111", stv.cips[0].codes.join() === "32.0111");
})();

// 36.01xx is a MIXED family: 36.0119 Aircraft Pilot (Private) is a CTE code sitting
// inside an otherwise-noncredit range, so a blanket prefix would offer a credit code
// under a noncredit category.
(function () {
  const he = byId["home_economics"];
  const codes = he.cips.flatMap((e) => e.codes);
  check("36.0119 (a CTE code) is excluded from Home Economics", !codes.includes("36.0119"));
  check("…while the rest of the 36.01 family is offered", codes.includes("36.0101"));
  check("…and the exclusion is explained", he.cips.some((e) => /36\.0119/.test(e.note || "")));
})();

// Codes colleges use that the page does not list — recorded, not absorbed.
check("off-list codes in use are recorded with their program counts",
  Array.isArray(cats.off_list_codes_in_use) &&
  cats.off_list_codes_in_use.some((o) => o.code === "32.0199" && o.programs > 0) &&
  cats.off_list_codes_in_use.some((o) => o.code === "35.0101" && o.programs > 0));

// ── The shift guard ─────────────────────────────────────────────────────────────
// Every label must share a content word with its code's catalog title. Structural
// words are dropped from both sides first — "Knowledge"/"Skills" alone made a wrong
// pair look right, which is exactly how the Health and Safety mispairing survived.
const STOP = new Set(["basic", "skills", "knowledge", "and", "of", "the", "general", "other"]);
const toks = (s) => new Set(String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ")
  .split(" ").filter((w) => w.length > 2 && !STOP.has(w)));
function mispaired(label, code) {
  const a = toks(label), b = toks((CATALOG[code] || {}).t);
  if (!a.size || !b.size) return false;
  return ![...a].some((w) => b.has(w));
}
(function () {
  const bad = [];
  for (const { cat, e } of allEntries) {
    if (e.credit_expected || e.codes.length !== 1) continue;   // only 1:1 label→code pairs
    if (mispaired(e.label, e.codes[0])) bad.push(`${cat.id}: "${e.label}" -> ${e.codes[0]}`);
  }
  check("no label is paired with a code whose catalog title it shares no word with",
    bad.length === 0);
  if (bad.length) bad.forEach((b) => console.error("   MISPAIRED " + b));
})();

// The guard has to actually fire. Both fixtures are real: the first is the relayed
// Basic Skills table, the second this builder's own first cut.
check("guard catches the relayed shift (Math -> 32.0105, which is Job-Seeking)",
  mispaired("Developmental/Remedial Math", "32.0105"));
check("guard catches the builder's own first cut (row label -> 34.0102, which is Birthing & Parenting)",
  mispaired("Health-Related Knowledge & Skills", "34.0102"));
check("guard does NOT fire on a legitimate abbreviation",
  !mispaired("Career Exploration/Awareness", "32.0107") &&
  !mispaired("Developmental/Remedial Math", "32.0104"));

// ── The schema's category list must match the generated one ─────────────────────
// noncredit_category_decisions constrains category_id with a literal CHECK list.
// If a category is added to the JSON and not to the constraint, every write for it
// is rejected by Postgres — and an RLS/constraint-filtered write returns 200 with an
// empty body, so the tab would report a save that never happened. Cheap to guard,
// invisible to catch in production.
(function () {
  const sqlPath = path.join(ROOT, "chatbox/supabase_noncredit_category_decisions.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const m = sql.match(/category_id\s+text\s+not\s+null\s+check\s*\(category_id in \(([\s\S]*?)\)\)/);
  const inSql = m ? (m[1].match(/'([a-z_]+)'/g) || []).map((s) => s.replace(/'/g, "")) : [];
  const inJson = cats.categories.map((c) => c.id);
  check("the schema's CHECK list was found (a rename must not silently skip this test)",
    inSql.length > 0);
  check("schema category_id list matches the generated categories exactly",
    inSql.slice().sort().join(",") === inJson.slice().sort().join(","));
  // The two guards the SQL header calls load-bearing, asserted so a later edit cannot
  // quietly drop them: CTE is never stored, and there is no delete path.
  check("schema stores no cte column — CTE is computed from category + secondary_cip",
    !/^\s*cte\b/m.test(sql) && !/\bcte\s+boolean/i.test(sql));
  check("schema has no DELETE policy — clearing writes nulls, keeping history",
    !/for\s+delete/i.test(sql));
  check("schema records who and when on every determination",
    /decided_by\s+text\s+not\s+null/.test(sql) && /decided_at\s+timestamptz\s+not\s+null/.test(sql));
})();

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
