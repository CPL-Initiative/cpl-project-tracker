// GR (Government Relations) gated advocacy briefing (gr_priorities.js).
//   - SECURITY: the committed JS carries NO advocacy content (it lives only in
//     Supabase gr_content, released by RLS gr_pass_ok()); the tab is EXCLUSIVE in
//     cobi_orgs.js (only under ?org=gr); rich text renders via an allowlist
//     tokenizer that CANNOT inject <script>/javascript: (the failure-mode guard).
//   - Rule 4: nav button + pane + boot block mirrored in both HTMLs.
//
// Run from repo root: `npm test` (or `node tests/gr_priorities.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── jsdom globals so the module can be required ──────────────────────────────
const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
  { url: "https://cpl-initiative.github.io/cpl-project-tracker/?org=gr" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.navigator = dom.window.navigator;
global.location = dom.window.location;
let fetchImpl = function () { return Promise.reject(new Error("no fetch")); };
global.fetch = function () { return fetchImpl.apply(null, arguments); };

const GR = require("../gr_priorities.js");

// ── Part A — static security invariants (no content / correct wiring) ────────
const jsSrc = fs.readFileSync("gr_priorities.js", "utf8");
check("gr_priorities.js exposes window.CPL_GR.activate", GR && typeof GR.activate === "function");
check("gr_priorities.js targets the GR-specific gate (gr_pass_ok, not team_pass_ok)",
  jsSrc.indexOf("rpc/gr_pass_ok") !== -1 && jsSrc.indexOf("rpc/team_pass_ok") === -1);
check("gr_priorities.js uses a GR-specific phrase key (cohort isolation client-side too)",
  jsSrc.indexOf("cpl_gr_pass") !== -1);
check("gr_priorities.js carries NO service key", jsSrc.indexOf("service_role") === -1);
// Content-leak guard: distinctive advocacy prose must NOT be in the committed file.
["geographic lottery", "phantom gatekeeping", "9,349", "$50.6M", "Standardized Attendance",
 "unfunded cost", "re-adjudication"].forEach(function (phrase) {
  check("no advocacy content in repo JS: '" + phrase + "'", jsSrc.indexOf(phrase) === -1);
});

const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
check("HTML has the gr-priorities nav button", /data-tab="gr-priorities"[^>]*>GR Priorities</.test(cpl));
check("HTML has the gr-priorities pane root", /id="gr-priorities-root"/.test(cpl));
check("HTML lazy-loads gr_priorities.js via CPL_GR boot", /loadScript\('gr_priorities\.js', 'CPL_GR'/.test(cpl));

const orgs = fs.readFileSync("cobi_orgs.js", "utf8");
check("cobi_orgs.js registers the GR org", /id:\s*"gr"/.test(orgs) && /Government Relations/.test(orgs));
check("cobi_orgs.js marks gr-priorities EXCLUSIVE (hidden in default view)",
  /EXCLUSIVE\s*=\s*\[\s*"gr-priorities"/.test(orgs));

// ── Part B — rich-text renderer is XSS-safe (the failure-mode guard) ─────────
function frag() { return dom.window.document.createElement("div"); }

var evil = frag();
GR._appendRich(evil, '<script>window.__pwned=1</script><img src=x onerror="window.__pwned=1"> hello ' +
  '<a href="javascript:window.__pwned=1">click</a> <a href="http://x">insecure</a>');
check("renderer creates NO <script> element", evil.querySelector("script") === null);
check("renderer creates NO <img> element", evil.querySelector("img") === null);
check("renderer drops javascript: links (rendered as text, no anchor)", evil.querySelector("a[href^='javascript']") === null);
check("renderer drops non-https links (http:// not linked)", evil.querySelector("a[href^='http:']") === null);
check("renderer preserved the safe text", evil.textContent.indexOf("hello") !== -1);
check("no global pollution from injected markup", typeof dom.window.__pwned === "undefined");

var ok = frag();
GR._appendRich(ok, '<p>See <a href="https://www.law.cornell.edu/regulations/california/5-CCR-55050">§55050</a> and <b>bold</b> and <i>it</i>.</p>');
var link = ok.querySelector("a");
check("renderer keeps https links", link && link.getAttribute("href") === "https://www.law.cornell.edu/regulations/california/5-CCR-55050");
check("https links open in a new tab safely", link && link.getAttribute("target") === "_blank" && /noopener/.test(link.getAttribute("rel") || ""));
check("renderer keeps <b> and <i>", ok.querySelector("b") && ok.querySelector("i"));

// ── Part C — the REGISTER: citations as data, filters, collisions ───────────
// The tab became a register (areas → revisions → artifacts) so it can scale
// past CPL to every CO priority area. These guard the parts that would silently
// mislead a lawyer if they broke.

// C1 — citation parsing. The rule that matters: a section we cannot place under
// a KNOWN code is REJECTED, never guessed. §11342.2 is GOVERNMENT Code (the APA
// definition of "regulation"); a "5xxxx → Title 5, everything else → Ed. Code"
// rule would file it under Ed. Code and hand a lawyer a wrong citation.
var p = GR._parseCites("55050, EC §76004, T5 §58003.2, 11342.2, 66025.71");
check("parses a bare CCC section to Title 5", p.ok.indexOf("T5 §55050") !== -1);
check("keeps an explicit Ed. Code citation", p.ok.indexOf("EC §76004") !== -1);
check("keeps a decimal Title 5 section", p.ok.indexOf("T5 §58003.2") !== -1);
check("files 11342.2 under GOVERNMENT Code, not Ed. Code", p.ok.indexOf("GC §11342.2") !== -1);
check("files 66025.71 under Ed. Code", p.ok.indexOf("EC §66025.71") !== -1);
var bad = GR._parseCites("whatever, 42, §999999999");
check("rejects text that is not a citation", bad.bad.indexOf("whatever") !== -1);
check("rejects an out-of-range number rather than guessing a code", bad.ok.length === 0);
check("Title 5 renders with a human label", GR._citeLabel("T5 §55050") === "Title 5 §55050");
check("Gov. Code renders with a human label", GR._citeLabel("GC §11342.2") === "Gov. Code §11342.2");

// C2 — the cross-area section index. This is the thing a register can do that a
// folder of Word docs cannot: show that two priority areas propose to touch the
// same section BEFORE rulemaking.
var col = GR._collisions([
  { area_id: "cpl", citations: ["T5 §55050", "EC §76004"] },
  { area_id: "dual-enrollment", citations: ["EC §76004"] },
  { area_id: "cpl", citations: ["T5 §55050"] }
]);
check("collision index finds the section two areas share", col.length === 1 && col[0].cite === "EC §76004");
check("collision names both areas", col[0].areas.join(",") === "cpl,dual-enrollment");
check("a section cited twice by ONE area is not a collision",
  GR._collisions([{ area_id: "cpl", citations: ["T5 §55050"] },
                  { area_id: "cpl", citations: ["T5 §55050"] }]).length === 0);

// C3 — filtering
var rev = { title: "Attendance accounting", summary: "apportionment", consideration: null,
            instrument: null, grp: "Funding", pathway: ["g", "y"], citations: ["T5 §58003.2"],
            status: "proposed" };
var ALL = { q: "", path: "all", status: "all", cite: "all" };
check("no filters → row matches", GR._matches(rev, ALL));
check("pathway filter matches a pathway it has", GR._matches(rev, { q: "", path: "y", status: "all", cite: "all" }));
check("pathway filter excludes one it lacks", !GR._matches(rev, { q: "", path: "r", status: "all", cite: "all" }));
check("section filter matches the cited section", GR._matches(rev, { q: "", path: "all", status: "all", cite: "T5 §58003.2" }));
check("section filter excludes an uncited section", !GR._matches(rev, { q: "", path: "all", status: "all", cite: "T5 §55050" }));
check("status filter works", !GR._matches(rev, { q: "", path: "all", status: "adopted", cite: "all" }));
check("keyword search reaches the summary", GR._matches(rev, { q: "apportionment", path: "all", status: "all", cite: "all" }));
check("keyword search reaches the citations", GR._matches(rev, { q: "58003", path: "all", status: "all", cite: "all" }));
check("keyword search excludes a non-match", !GR._matches(rev, { q: "zzzz", path: "all", status: "all", cite: "all" }));

// C4 — render + the export reads the SCREEN
var AREA = { id: "cpl", title: "Credit for Prior Learning", division: "ESS",
             summary: "s", narrative: { thesis: "A <b>regulation</b> question." } };
var REVS = [
  { id: "1", area_id: "cpl", n: 1, title: "Item one", grp: "Scope", summary: "<p>One <a href=\"https://x.example.org/a\">§55050</a>.</p>",
    consideration: "consider", instrument: null, pathway: ["g", "y"], citations: ["T5 §55050"],
    citations_derived: true, ed_first: "No", status: "proposed", updated_by: "someone@x" },
  { id: "2", area_id: "cpl", n: 2, title: "Item two", grp: "Scope", summary: "Two.", consideration: null,
    instrument: null, pathway: ["y"], citations: ["T5 §55023"], citations_derived: false,
    ed_first: "No", status: "adopted", updated_by: null },
  { id: "3", area_id: "cpl", n: 7, title: "Apportionment", grp: "Funding", summary: "Hard one.", consideration: "risk",
    instrument: null, pathway: ["r"], citations: ["T5 §58050"], citations_derived: false,
    ed_first: "Yes", status: "proposed", updated_by: null }
];
GR._state.areas = [AREA, { id: "dual-enrollment", title: "Dual Enrollment" }];
GR._state.areaId = "cpl";
GR._state.revisions = REVS;
GR._state.artifacts = [
  { id: "a1", title: "A memo", url: "https://x.example.org/m", kind: "memo", source: "CCCCO",
    division: "ESS", why: "Sets the baseline.", citations: ["T5 §55050"], added_by: "someone@x" },
  { id: "a2", title: "Not a link", url: "javascript:alert(1)", kind: "other", source: null,
    division: null, why: null, citations: [], added_by: null }
];
var root = dom.window.document.createElement("div");
GR._renderRegister(root, REVS.concat([{ area_id: "dual-enrollment", citations: ["T5 §55050"] }]));

check("renders one row per revision (3)", root.querySelectorAll(".gx-item").length === 3);
check("renders the group headers (2)", root.querySelectorAll(".gx-grp").length === 2);
check("renders the area picker with both areas", root.querySelectorAll("#gx-area option").length === 2);
check("description keeps an https link from the summary", root.querySelector(".gx-desc a[href='https://x.example.org/a']") !== null);
check("renders the artifact list", root.querySelectorAll(".gx-art").length >= 2);
check("an artifact with a javascript: url is NOT rendered as a link",
  root.querySelector(".gx-art a[href^='javascript']") === null);
check("an https artifact IS a link", root.querySelector(".gx-art a[href='https://x.example.org/m']") !== null);

// A DERIVED citation must be visibly distinguishable from a curated one —
// an extracted citation shown to a lawyer as curated fact is the credibility risk.
check("a derived citation is marked", root.querySelector(".gx-cite.derived") !== null);
check("a curator-entered citation is NOT marked derived",
  root.querySelectorAll(".gx-cite").length > root.querySelectorAll(".gx-cite.derived").length);

// section dropdowns are built from what is CITED — never an empty option
var opts = [];
root.querySelectorAll("select[aria-label='Title 5 section'] option").forEach(function (o) { opts.push(o.value); });
check("Title 5 dropdown offers only sections actually cited",
  opts.length === 4 && opts.indexOf("T5 §55050") !== -1 && opts.indexOf("EC §76004") === -1);
check("no Ed. Code dropdown when nothing cites Ed. Code",
  root.querySelector("select[aria-label='Ed. Code section']") === null);

// filter → the Word export follows the SCREEN (the Sky167 lesson: the briefing
// this replaced kept a separate 13-item array beside a 16-row screen).
var frChip = null;
root.querySelectorAll(".gx-chip").forEach(function (c) { if (c.getAttribute("data-f") === "r") frChip = c; });
frChip && frChip.click();
var visible = Array.prototype.filter.call(root.querySelectorAll(".gx-item"), function (i) { return !i.hidden; });
check("pathway filter leaves exactly the Ed. Code row", visible.length === 1);
check("filtered count is disclosed, never silent", /showing 1 of 3/.test(root.querySelector(".gx-count").textContent));

var word = GR._draftDocBody(AREA, visible.map(function (d) { return d._rev; }));
check("Word export contains the filtered row", word.indexOf("Apportionment") !== -1);
check("Word export omits rows filtered OFF the screen", word.indexOf("Item one") === -1);
// The export round-trips rich text through the SAME tokenizer the screen uses,
// so <b>/<i>/https links SURVIVE instead of being escaped into literal tags.
check("Word export pulls the intro from the area narrative and keeps its markup",
  word.indexOf("A <b>regulation</b> question.") !== -1);
check("Word export keeps an https link from a migrated summary, not literal markup",
  GR._draftDocBody(AREA, REVS).indexOf('<a href="https://x.example.org/a">') !== -1);
check("Word export never emits a raw <p> from migrated rich text",
  GR._draftDocBody(AREA, REVS).indexOf("&lt;p&gt;") === -1);
check("Word export escapes markup rather than emitting it",
  GR._draftDocBody(AREA, [{ n: 1, title: "<script>x</script>", pathway: [], citations: [], status: "proposed" }])
    .indexOf("<script>") === -1);

// C5 — cross-area collisions render
check("collision section names the other area",
  root.textContent.indexOf("Dual Enrollment") !== -1);

// C6 — writes are reviewer-gated, NOT phrase-gated. A shared phrase is a READ
// credential: anyone holding it must not be able to rewrite another division's
// entries.
check("no add-forms are offered without a reviewer session",
  root.querySelectorAll(".gx-form").length === 0 &&
  root.textContent.indexOf("Sign in to add") !== -1);
var src2 = fs.readFileSync("gr_priorities.js", "utf8");
check("write path requires an access_token (canWrite), not the phrase",
  /function canWrite\(\)\s*\{[^}]*access_token/.test(src2));
check("an RLS-filtered write (200 + empty body) is reported as FAILURE",
  /rows\.length === 0/.test(src2) && /not saved/.test(src2));
check("a null read is distinguished from an empty read",
  /areas === null/.test(src2));


// ── Part C7 — the regressions the adversarial audit found ────────────────────
// Each of these guards a defect that was real in the first cut of the register.

// (a) THE CAVEAT. The CPL area's caveat records that its quoted statutory text
// was never checked against primary sources. It was migrated into
// gr_areas.narrative.caveat and then never rendered — sixteen priorities with
// confident citations and no disclaimer, shown to lawyers. It renders ABOVE the
// register, because a caveat under 16 rows is one most readers never reach.
{
  const A = { id: "cpl", title: "CPL", narrative: {
    caveat: "Working draft. Quoted text is <b>unverified</b>.",
    ask: [{ k: "1", h: "Guidance now", p: "Issue a memo." }],
    corrections: ["<b>AB 1985</b> is not CPL."],
    updated: "2026-07-16" } };
  GR._state.areas = [A]; GR._state.areaId = "cpl";
  GR._state.revisions = REVS; GR._state.artifacts = [];
  GR._state.failed = { revisions: false, artifacts: false, cross: false };
  const r = dom.window.document.createElement("div");
  GR._renderRegister(r, REVS);
  const cav = r.querySelector(".gx-caveat");
  check("the caveat renders", !!cav && /unverified/i.test(cav.textContent));
  check("the caveat says what it is for", !!cav && /verify/i.test(cav.textContent));
  check("the caveat sits ABOVE the first revision row",
    !!cav && (cav.compareDocumentPosition(r.querySelector(".gx-item")) & 4) !== 0);
  check("the sequenced ask renders", r.textContent.indexOf("The sequenced ask") !== -1);
  check("the corrections render", r.textContent.indexOf("AB 1985") !== -1);
  check("the draft stamp renders", r.textContent.indexOf("Draft · 2026-07-16") !== -1);
  const w = GR._draftDocBody(A, REVS);
  check("the caveat travels IN the Word file", /Before this goes external/.test(w) && /unverified/i.test(w));
  check("the Word file carries a verify-before-external-use line",
    /verify quoted statutory and regulatory text/i.test(w));
}

// (b) A FAILED READ IS NOT AN AUTHORITATIVE ZERO. Collapsing null to [] made a
// dropped connection render as "no revisions", "no artifacts" and — worst — as
// the register's headline claim, "no section is cited by two areas".
{
  GR._state.areas = [{ id: "cpl", title: "CPL", narrative: {} }];
  GR._state.areaId = "cpl";
  GR._state.revisions = []; GR._state.artifacts = [];
  GR._state.failed = { revisions: true, artifacts: true, cross: true };
  const r = dom.window.document.createElement("div");
  GR._renderRegister(r, []);
  const t = r.textContent;
  check("a failed revisions read does NOT read as an empty register", /not an empty register/i.test(t));
  check("a failed artifacts read says so", /a loading failure, not an empty list/i.test(t));
  check("a failed cross-area read refuses to claim there are no overlaps",
    /does NOT mean there are no shared sections/i.test(t));
  check("failed states are visually distinguished", r.querySelectorAll(".gx-unread").length >= 3);
}

// (c) CITATION CLASSIFICATION. The JS must mirror gr_citation_code() in
// kb/supabase_gr_register.sql exactly; it did not, and the gap filed Government
// Code §53xxx as Title 5.
{
  const sql = fs.readFileSync("kb/supabase_gr_register.sql", "utf8");
  const jsSrc2 = fs.readFileSync("gr_priorities.js", "utf8");
  /* ⭐ DERIVE THE BANDS FROM THE SQL, DO NOT RESTATE THEM. This used to pin the
   * three patterns as literals — ["5[58][0-9]{3}", "(66|70|76)[0-9]{3}", …] —
   * which made the check fail for a CORRECT change (widening EC to 78/79 in
   * both places for SB 135's §78093–78093.2) and pass only once someone edited
   * the literal to match. A guard whose repair is "update the expected value"
   * teaches its reader to bump it until green, which is the opposite of what it
   * is for. Reading the SQL as the source of truth tests the actual invariant:
   * whatever the SQL says, the JS says the same. Widening one and not the other
   * is still red. */
  var sqlBands = [];
  // ⚠️ `T5` is a letter and a DIGIT, so [A-Z]{2} matches EC and GC and silently
  // skips Title 5 — which is why the count below is asserted rather than the
  // loop simply iterating whatever happened to match. A missing check is an
  // absence, not a failure: it subtracts from both sides and reads as green.
  sql.replace(/when sec ~ '\^([^']+)\$' then '([A-Z][A-Z0-9])'/g, function (m, pat, code) {
    sqlBands.push([pat, code]); return m;
  });
  check("the SQL still declares its citation bands (3 today)", sqlBands.length === 3,
    "found " + sqlBands.length);
  sqlBands.forEach(function (pair) {
    check("band " + pair[1] + " " + pair[0] + " is mirrored in the JS",
      jsSrc2.indexOf(pair[0]) !== -1);
  });
  // ⚠️ And each SQL band must map to the SAME code on the JS side — mirroring
  // the PATTERN while filing it under a different code would pass the check
  // above and still produce a different citation for the same number.
  sqlBands.forEach(function (pair) {
    var i = jsSrc2.indexOf(pair[0]);
    var tail = i < 0 ? "" : jsSrc2.slice(i, i + 60);
    check("…and lands under " + pair[1] + " on the JS side too",
      tail.indexOf('"' + pair[1] + '"') !== -1);
  });
  const amb = GR._parseCites("53410");
  check("a bare 53xxx is REFUSED, not guessed as Title 5 (Gov. Code §53xxx is real)",
    amb.ok.length === 0 && amb.bad.indexOf("53410") !== -1);
  check("an explicit T5 §53410 is still accepted", GR._parseCites("T5 §53410").ok[0] === "T5 §53410");
  check("a 4-digit number is refused (bands are length-anchored)", GR._parseCites("5505").ok.length === 0);
  check("a 6-digit number is refused", GR._parseCites("550500").ok.length === 0);
  const inf = GR._parseCites("55050");
  check("an INFERRED code is flagged so it can be stored as derived", inf.inferred === true);
  check("a TYPED code is not flagged as inferred", GR._parseCites("T5 §55050").inferred === false);
  // Strip comments before asserting. A guard that greps raw source cannot tell
  // live code from a comment EXPLAINING the bug it guards against — the same
  // way kb/_build_cobi_admin_surface.py once read a comment and invented a
  // table called "table". Assert about what executes.
  const code2 = jsSrc2.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  check("the divergent 5[358] band is gone from executing code", code2.indexOf("^5[358]") === -1);
  check("...and the guard is not vacuous — it still sees the live bands",
    code2.indexOf("5[58][0-9]{3}") !== -1);
}

// (d) PROTOTYPE POLLUTION — citation strings and group labels are data.
{
  const c = GR._collisions([
    { area_id: "a", citations: ["__proto__"] },
    { area_id: "b", citations: ["__proto__"] }
  ]);
  check("a '__proto__' citation is handled as data, not a prototype write",
    c.length === 1 && c[0].areas.join(",") === "a,b");
  check("Object.prototype was not polluted", ({}).a === undefined);
  GR._state.areas = [{ id: "x", title: "X", narrative: {} }];
  GR._state.areaId = "x";
  GR._state.failed = { revisions: false, artifacts: false, cross: false };
  GR._state.revisions = [{ id: "p", area_id: "x", n: 1, title: "T", grp: "__proto__",
    pathway: ["y"], citations: [], status: "proposed" }];
  GR._state.artifacts = [];
  const r = dom.window.document.createElement("div");
  let threw = false;
  try { GR._renderRegister(r, []); } catch (e) { threw = true; }
  check("a '__proto__' grouping label does not blank the tab", !threw && r.querySelectorAll(".gx-item").length === 1);
}

// (d2) The pathway tag was the one value in the export not escaped.
{
  const w = GR._draftDocBody({ id: "x", title: "X", narrative: {} },
    [{ n: 1, title: "T", pathway: ['<img src=x onerror=alert(1)>'], citations: [], status: "proposed" }]);
  check("an unrecognised pathway value is escaped in the Word export",
    w.indexOf("<img") === -1 && w.indexOf("&lt;IMG") !== -1);
}

// (e) The export filename carries the mandatory YYYYMMDD prefix.
check("Word filename is date-prefixed per the vault naming rule",
  /stamp \+ "_GR_Register_"/.test(fs.readFileSync("gr_priorities.js", "utf8")));

// (f) A transient read failure must NOT delete the stored phrase.
{
  const src3 = fs.readFileSync("gr_priorities.js", "utf8");
  const seg = src3.slice(src3.indexOf("if (areas === null)"), src3.indexOf("if (areas === null)") + 700);
  check("a null read does not clearPass() automatically", seg.indexOf("clearPass()") === -1 ||
    seg.indexOf("Re-enter the phrase") !== -1);
  check("a null read offers a retry rather than asserting rotation", /Try again/.test(seg));
  check("a null read states the phrase was NOT cleared", /has NOT been cleared/.test(seg));
}

// ── Part C8 — the verification pass and the sensitivity control ─────────────
// A caveat is a disclosure, not a fix, and a blanket disclaimer that never
// changes is indistinguishable from an unmaintained one. These turn it into a
// work queue.
{
  const src4 = fs.readFileSync("gr_priorities.js", "utf8");
  check("verifying is what clears citations_derived (nothing else may)",
    /citations_derived:\s*false/.test(src4) && /verified_at:\s*new Date/.test(src4));
  check("a PATCH uses the same empty-body-is-failure guard as an INSERT",
    /method:\s*"PATCH"[\s\S]{0,200}\.then\(wrote\)/.test(src4));
  check("the row id is encoded into the PATCH filter", /id=eq\." \+ encodeURIComponent/.test(src4));

  const A = { id: "cpl", title: "CPL", narrative: { caveat: "Quoted text is unverified." } };
  const R = [
    { id: "r1", area_id: "cpl", n: 1, title: "One", pathway: ["y"], citations: ["T5 §55050"],
      citations_derived: true, status: "proposed", sensitivity: "restricted" },
    { id: "r2", area_id: "cpl", n: 2, title: "Two", pathway: ["y"], citations: ["T5 §55023"],
      citations_derived: false, status: "proposed", sensitivity: "restricted",
      verified_at: "2026-08-19T00:00:00Z", verified_by: "sam@x" }
  ];
  GR._state.areas = [A]; GR._state.areaId = "cpl";
  GR._state.revisions = R; GR._state.artifacts = [];
  GR._state.failed = { revisions: false, artifacts: false, cross: false };
  const r = dom.window.document.createElement("div");
  GR._renderRegister(r, R);
  check("the caveat reports verification progress rather than disclaiming forever",
    /1 of 2 entries have had their citations checked/.test(r.textContent));
  check("a verified row shows who verified it and when",
    /citations verified by sam@x/.test(r.textContent) && /2026-08-19/.test(r.textContent));
  // Signed out: no curator controls at all.
  check("no verify button without a reviewer session",
    r.textContent.indexOf("Mark citations verified") === -1);
  check("no sensitivity control without a reviewer session",
    r.querySelector("select[aria-label='Who may see this row']") === null);
  check("the sensitivity default is never rendered as 'open' by accident",
    r.textContent.indexOf("anyone in the CO") === -1);
}

// ── Part C9 — the blast-radius layer, recovered ─────────────────────────────
// The original briefing carried TWO orderings of the same 16 rows, and its
// actual argument lived in the second: 13 priorities ranked by systemic blast
// radius, each with a "why it matters" paragraph. The first migration left that
// layer in gr_content, unreachable from the UI.
{
  const A = { id: "cpl", title: "CPL", narrative: {} };
  const R = [
    { id: "b1", area_id: "cpl", n: 1, title: "Matrix one", pathway: ["y"], citations: [],
      status: "proposed", blast_rank: 9, blast_why: "Because <b>scope</b>." },
    { id: "b2", area_id: "cpl", n: 7, title: "Matrix seven", pathway: ["r"], citations: [],
      status: "proposed", blast_rank: 1, blast_why: "Widest reach." }
  ];
  GR._state.areas = [A]; GR._state.areaId = "cpl";
  GR._state.revisions = R; GR._state.artifacts = [];
  GR._state.failed = { revisions: false, artifacts: false, cross: false };
  const r = dom.window.document.createElement("div");
  GR._renderRegister(r, R);
  check("the recovered 'why it matters' renders", /Why it matters/.test(r.textContent) &&
    /Widest reach/.test(r.textContent));
  check("the blast-radius rank renders as a chip", !!r.querySelector(".gx-rank"));
  check("an order control appears when a blast rank exists",
    !!r.querySelector("select[aria-label='Order']"));
  // default order is the matrix, and blast order puts rank 1 first
  const before = Array.prototype.map.call(r.querySelectorAll(".gx-item"), d => d._rev.n);
  check("default order is the matrix (1 before 7)", before[0] === 1 && before[1] === 7);
  const sel = r.querySelector("select[aria-label='Order']");
  sel.value = "blast";
  sel.dispatchEvent(new dom.window.Event("change"));
  const after = Array.prototype.map.call(r.querySelectorAll(".gx-item"), d => d._rev.n);
  check("blast order puts rank 1 first (matrix row 7)", after[0] === 7 && after[1] === 1);
  const w = GR._draftDocBody(A, R);
  check("the Word export carries 'why it matters' too", /Why it matters/.test(w) && /Widest reach/.test(w));
}

// ── Part C10 — a failed read must not be allowed to WRITE a bad row ─────────
{
  GR._state.areas = [{ id: "cpl", title: "CPL", narrative: {} }];
  GR._state.areaId = "cpl"; GR._state.revisions = []; GR._state.artifacts = [];
  GR._state.failed = { revisions: true, artifacts: false, cross: false };
  const src5 = fs.readFileSync("gr_priorities.js", "utf8");
  check("adding a revision is refused while the revisions read failed",
    src5.indexOf("addRev.disabled = true;") !== -1 &&
    src5.indexOf("if (state.failed.revisions) return;") !== -1);
  check("...and the reason names the numbering hazard, not just 'error'",
    /numbered as if the area were empty/.test(src5));
}

// ── Part C11 — pathway values are DATA, including "toString" ────────────────
{
  const w = GR._draftDocBody({ id: "x", title: "X", narrative: {} },
    [{ n: 1, title: "T", pathway: ["toString"], citations: [], status: "proposed" }]);
  check("a pathway of 'toString' does not resolve through the prototype",
    w.indexOf("UNDEFINED") === -1 && w.indexOf("TOSTRING") !== -1);
  check("...and the export still produces a document", w.length > 200);
}

// ── Part D — lock screen when no phrase is stored ────────────────────────────
try { dom.window.localStorage.removeItem("cpl_gr_pass"); } catch (e) {}
try { dom.window.sessionStorage.removeItem("cpl_sb"); } catch (e) {}
var lockRoot = dom.window.document.createElement("div");
lockRoot.id = "gr-priorities-root";
dom.window.document.body.appendChild(lockRoot);
GR.activate();  // no phrase, no reviewer session → lock card, no content fetch
check("with no phrase, shows the lock card (password input)", lockRoot.querySelector(".gx-lock input[type='password']") !== null);
check("lock card renders no register rows", lockRoot.querySelectorAll(".gx-item").length === 0);

// ── report ───────────────────────────────────────────────────────────────────
let fail = 0;
results.forEach(function (r) { console.log((r[1] ? "PASS" : "FAIL") + " — " + r[0]); if (!r[1]) fail++; });
console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed.");
process.exit(fail ? 1 : 0);
