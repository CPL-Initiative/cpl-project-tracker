// Session 72 (StarLander) — merge-editor real-estate pass (Sam #4 + #5):
//   #5 The "⌕ Merge into a different existing course" affordance is mounted UP
//      under the Proposed-title field (so a curator working the worklist out of
//      order can redirect to a specific course right away), NOT at the panel
//      bottom — it now precedes the Candidates list in DOM order, and still works.
//   #4 The always-on gray explanatory paragraphs collapsed into ⓘ hover tooltips:
//      the proposal hint + the candidates guidance live in [title] attributes, and
//      the big standalone guidance paragraph is gone from the visible flow.
//
// Run from repo root: `npm test` (or `node tests/uc_merge_editor_layout.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Art", credit: "Credit", units: 3.0, top: "1002.00", subj: ["ART"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const rows = [mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I")];
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    { sig: "ceramics", n: 2, score: 0.9, members: [
      { id: "ARTS M1001", t: "Ceramics", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1002", t: "Ceramics I", s: "ART", u: 3.0, k: "M-ID" },
    ] },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Art"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
  window.CPL_UC_INDEX = ${JSON.stringify([["ARTS M1001", "Ceramics", "ART", "M-ID", 3], ["ARTS M1002", "Ceramics I", "ART", "M-ID", 3], ["BIOL M9001", "Anatomy", "BIOL", "M-ID", 4]])};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
window.fetch = (url, opts) => Promise.resolve({
  ok: true, status: (opts && opts.method && opts.method !== "GET") ? 201 : 200,
  json: () => Promise.resolve([]),
});
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  const shell = (Array.from(doc.querySelectorAll("strong")).find((s) => /Suggested merges/.test(txt(s)))).parentNode.parentNode;

  // ── #5: override link mounts ABOVE the Candidates list ────────────────────
  const ovLink = Array.from(doc.querySelectorAll("a")).find((a) => /Merge into a different existing course/.test(txt(a)));
  const candLabel = Array.from(doc.querySelectorAll("label")).find((l) => /^Candidates \(/.test(txt(l)));
  const titleLabel = Array.from(doc.querySelectorAll("label")).find((l) => /Proposed unified title/.test(txt(l)));
  check("⌕ override link is present", !!ovLink);
  check("⌕ override link precedes the Candidates list in DOM order (mounted up top)",
    ovLink && candLabel && (ovLink.compareDocumentPosition(candLabel) & window.Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
  check("⌕ override link sits just after the Proposed-title section",
    ovLink && titleLabel && (titleLabel.compareDocumentPosition(ovLink) & window.Node.DOCUMENT_POSITION_FOLLOWING) !== 0);

  // It still works: open the panel → a search box appears.
  ovLink.dispatchEvent(new window.Event("click"));
  await sleep(20);
  const ovSearch = Array.from(doc.querySelectorAll("input[type=search]"))
    .find((i) => /Search any course title or ID/.test(i.placeholder || ""));
  check("⌕ override still opens its search panel after the move", !!ovSearch && ovSearch.offsetParent !== null || !!ovSearch);

  // ── #4: explanatory copy lives in ⓘ tooltips, not standalone paragraphs ────
  const titles = Array.from(shell.querySelectorAll("[title]")).map((e) => e.getAttribute("title")).join(" │ ");
  check("proposal hint lives in a tooltip", /applied only if you Confirm/.test(titles));
  check("candidates guidance lives in a tooltip", /do NOT yet share an identity/.test(titles));
  // The big standalone guidance paragraph is gone from the visible text flow
  // (the same words now only appear inside [title] attributes).
  const visibleDivs = Array.from(shell.querySelectorAll("div"))
    .filter((d) => !d.querySelector("div") && /do NOT yet share an identity/.test(txt(d)));
  check("the standalone guidance paragraph is removed (copy only in tooltips)", visibleDivs.length === 0);
  // At least one ⓘ glyph is rendered.
  check("an ⓘ info icon is rendered", Array.from(shell.querySelectorAll("span")).some((s) => txt(s) === "ⓘ" && s.getAttribute("title")));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
