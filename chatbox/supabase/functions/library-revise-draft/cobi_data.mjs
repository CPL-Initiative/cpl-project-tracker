// cobi_data.mjs: the Library drafter's read access to COBI's data, and the small-count rule.
//
// Sam's rulings, 2026-11-18 ~2:35 PM PT, relayed by COBIx on CPL-Initiative/cpl-project-tracker#3527:
//   1. Full read access. The drafter may read every COBI dataset. The Library makes internal and public pieces.
//   2. No staff-data block. COBI holds no true PII; staff names, titles and work emails may appear in any piece when
//      the person managing it thinks that is appropriate. No automatic filter.
//   3. The one student-data rule: a student count under 10 for a specific category shows as <10, never the number,
//      in every piece, internal or public: tables, charts, labels and prose.
//
// The model reads through three tools, all reads: the tables (from the published dependency map), a table's rows
// (PostgREST GET with the caller's own credential, so each table's policies still decide), and a published file on
// the CPL Initiative's site. Every result passes through suppressCounts before the model sees it, and a new page,
// or each edit of a revision, passes through suppressInHtml, so a small count is caught on the way in and on the way out.

export const MAX_ROWS = 500;
export const MAX_RESULT = 40_000;   // characters of one tool result
export const MAX_TURNS = 8;         // tool rounds before the model must answer
export const SITE = "https://cpl-initiative.github.io/cpl-project-tracker/";
export const DEPENDENCY_MAP = SITE + "kb/dependency_map.json";

// A field that counts students: its name is count-shaped and names people (COBIx review on #3527, 2026-11-18: the
// first pattern caught award_units and veteran_units, and almost every CPL unit value is 1 to 9). A key that names
// units, credits or hours is never a count of students.
const PEOPLE = "(?:students?|learners?|veterans?|enrollees?|recipients?|completers?|participants?|people|persons?|apprentices?|graduates?|awards?|awardees?)";
const UNIT_KEY = /(units?|credits?|hours?|hrs|grade|level|step|year|version|_id|^id)$|units?_|credits?_|hours?_/i;
const COUNT_KEY = new RegExp(
  "^(?:" + PEOPLE + "|headcount|unduplicated(?:_[a-z]+)?|n|count)$" +                 // students, headcount, n
  "|^(?:n|num|number|count|total)_(?:of_)?" + PEOPLE + "$" +                           // n_students, total_veterans
  "|^" + PEOPLE + "_(?:n|count|total|headcount)$" +                                    // student_count, awards_n
  "|^(?:[a-z]+_)?headcount$|_" + PEOPLE.replace("|awards?|awardees?", "") + "$", "i"); // fall_headcount, cpl_students (never max_award)
export function isCountKey(k) { return !!k && !UNIT_KEY.test(k) && COUNT_KEY.test(k); }
// The words a count of students sits next to in prose.
const COUNT_NOUN = "(?:students?|learners?|veterans?|service ?members?|enrollees?|recipients?|completers?|participants?|people|persons?|individuals?|apprentices?|graduates?)";
// Words that mean the number is not a count of people: it labels a grade, a step, a part, or it is a rate (1 in 5).
const NOT_BEFORE = "(?:grade|step|course|version|level|year|page|part|phase|module|chapter|week|day|unit|semester|term|quarter|session|in|of|out|to|and|or|per|top|tier|section|room|lesson|cohort)";
const NOT_AFTER = "(?:units?|credits?|hours?|courses?|steps?|grades?|semesters?|terms?|years?|weeks?|days?|months?|of|in|for|to|per|out|percent|%)";

// Values under 10 in a student-count field become "<10" (0 stays 0: nothing to protect). Works on any JSON value.
export function suppressCounts(v, key) {
  if (Array.isArray(v)) return v.map((x) => suppressCounts(x, key));
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) out[k] = suppressCounts(v[k], k);
    return out;
  }
  if (isCountKey(key)) {
    const n = typeof v === "number" ? v : (typeof v === "string" && /^\s*\d+\s*$/.test(v) ? Number(v) : NaN);
    if (Number.isFinite(n) && n >= 1 && n <= 9) return "<10";
  }
  return v;
}

// The same rule on text: a JSON-looking "students": 7 in a file, and "7 students" in prose. In prose the digit sits
// directly before the noun, or before one describing word that is not a unit word ("7 new students", never
// "3 units for veterans"), and never after a word that makes it a label or a rate ("Grade 9 students", "1 in 5").
const PROSE = new RegExp("(^|[^\\d.,$<A-Za-z])(?<!\\b" + NOT_BEFORE + "\\s)([1-9])(\\s+(?:(?!" + NOT_AFTER + "\\b)[A-Za-z-]+\\s+)?" + COUNT_NOUN + ")\\b", "gi");
export function suppressText(t) {
  return String(t)
    .replace(/("([^"\\]{0,60})"\s*:\s*)"?([1-9])"?(?![\d.])/g, (m, pre, key) => (isCountKey(key) ? pre + '"<10"' : m))
    .replace(PROSE, (m, a, d, rest) => a + "<10" + rest);
}

// On a page: the text between tags, and the attributes a reader hears or sees (aria-label, title, alt); never a
// class, an id or a link.
export function suppressInHtml(html) {
  return String(html)
    .replace(/(\s(?:aria-label|aria-description|title|alt)=")([^"]*)(")/gi, (m, a, v, z) => a + suppressText(v).replace(/<10/g, "&lt;10") + z)
    .replace(/>([^<]+)</g, (m, text) => ">" + suppressText(text).replace(/<10/g, "&lt;10") + "<");
}

// A revision's edits, each suppressed before it is applied, so every rewrite shows in What changed (COBIx review on
// #3527: suppressing the whole page rewrote sentences nobody asked about, out of the reviewer's sight).
export function suppressEdits(edits) {
  return (Array.isArray(edits) ? edits : []).map((e) => (e && typeof e.new === "string" ? { ...e, new: suppressInHtml(">" + e.new + "<").slice(1, -1) } : e));
}

export const STUDENT_RULE = `
Student counts (Sam's rule, for every piece, internal or public): a count of students under 10 for a specific category (a college, a program, a course, a group, a year) shows as <10, never the number, in tables, charts, labels and prose. The data you read already shows such counts as <10; keep them so. Never show a total or a remainder that would let a reader work a hidden count back out: when one category in a set shows <10, show the total only if at least two categories are hidden, or leave the total out and say the counts under 10 are not shown. Staff names, titles and work emails may appear when the brief or the documents call for them.`;

export const TOOL_RULES = `
COBI's data: you may read any COBI dataset with the tools before you answer. cobi_tables lists the tables; cobi_read reads a table's rows (PostgREST filters: select=, column=eq.value, column=ilike.*text*, order=, limit=); cobi_file reads a file published on the CPL Initiative's site (a path such as kb/reference/map_cpl_opportunities_verified.json). Read only what the piece needs, narrowly filtered. A figure, name or link you read there is stated and may be used. When you have what you need, answer with the JSON.

Buttons for students (Sam, 2026-11-18): a button that sends a student to request CPL at a college opens that college's MAP landing page from the reference data, never the MAP dashboard. The landing page shows only articulated courses, so you need not check articulation. Beside the button, tell the student to choose the exhibit under Possible Qualifications by its exact name as MAP lists it, in MAP's wording. A college with no landing page on file is said so, with no other link in its place.`;

export const TOOLS = [
  { name: "cobi_tables", description: "List COBI's Supabase tables and views by name.", input_schema: { type: "object", properties: {} } },
  { name: "cobi_read", description: "Read rows of one COBI table with PostgREST query parameters. Returns at most 500 rows as JSON; student counts under 10 read <10.",
    input_schema: { type: "object", properties: { table: { type: "string" }, query: { type: "string", description: "e.g. select=college,landing_page_url&college=ilike.*Laney*" } }, required: ["table"] } },
  { name: "cobi_file", description: "Read a file published on the CPL Initiative's site, by its path from the site root (JSON, JS, CSV, HTML or text).",
    input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
];

const TABLE = /^[a-z_][a-z0-9_]{0,62}$/;
function cap(s) { s = String(s); return s.length > MAX_RESULT ? s.slice(0, MAX_RESULT) + "\n(cut here; narrow the query)" : s; }

// Run one tool call. rest(path) and get(url) are the function's fetchers; both are reads.
export async function runTool(name, input, rest, get) {
  input = input || {};
  if (name === "cobi_tables") {
    const r = await get(DEPENDENCY_MAP).catch(() => null);
    const map = r && r.ok ? await r.json().catch(() => null) : null;
    const names = Object.keys((map && map.datasets) || {}).filter((k) => /^supabase:/.test(k)).map((k) => k.replace(/^supabase:/, ""));
    return names.length ? names.join("\n") : "The table list could not be read; name a table you expect, such as map_college_contacts.";
  }
  if (name === "cobi_read") {
    const table = String(input.table || "").trim();
    if (!TABLE.test(table)) return "Name one table, in lowercase with underscores.";
    let q = String(input.query || "").replace(/^\?/, "");
    if (/(^|&)limit=/.test(q)) q = q.replace(/(^|&)limit=(\d+)/, (m, a, n) => a + "limit=" + Math.min(Number(n) || MAX_ROWS, MAX_ROWS));
    else q += (q ? "&" : "") + "limit=" + MAX_ROWS;
    const r = await rest(table + "?" + q).catch(() => null);
    if (!r) return "The table could not be reached.";
    const body = await r.text().catch(() => "");
    if (!r.ok) return "The read was refused (" + r.status + "): " + body.slice(0, 300);
    let rows;
    try { rows = JSON.parse(body); } catch { return cap(suppressText(body)); }
    return cap(JSON.stringify(suppressCounts(rows)));
  }
  if (name === "cobi_file") {
    const path = String(input.path || "").replace(/^\/+/, "");
    if (!path || /(^|\/)\.\.(\/|$)/.test(path) || /^[a-z]+:/i.test(path)) return "Give a path from the site root, such as kb/reference/x.json.";
    const r = await get(SITE + path).catch(() => null);
    if (!r || !r.ok) return "The file could not be read" + (r ? " (" + r.status + ")" : "") + ".";
    const text = await r.text().catch(() => "");
    try { return cap(JSON.stringify(suppressCounts(JSON.parse(text)))); } catch { return cap(suppressText(text)); }
  }
  return "No such tool.";
}
