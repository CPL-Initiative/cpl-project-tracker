// Guards the suggested-merges popup chrome + proposal framing (2026-06-12,
// Sam's worklist review — the "Developmental Movement Lab" group):
//   1. A persistent title bar renders above the per-group content with an
//      explicit ✕ closer (aria-label "Close") — clicking it closes the popup.
//   2. The bar is a drag handle: mousedown + document mousemove translate the
//      dialog; the position PERSISTS across Skip advances (the box node is
//      reused); mousedown on the ✕ never starts a drag.
//   3. Proposal framing: the title field reads "Proposed unified title" (the
//      old "Unified title" label made the group read like the members already
//      belonged to that common course), the member list is labelled
//      "Candidates (N) — each row is currently its own separate identity",
//      and each member id carries the current-identity tooltip.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_chrome.test.js`).
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
const rows = [
  mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I"),
  mkRow("ARTS M1003", "Painting"), mkRow("ARTS M1004", "Painting I"),
];
const sugStub = {
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
  groups: [
    { sig: "ceramics", n: 2, score: 0.9, members: [
      { id: "ARTS M1001", t: "Ceramics", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1002", t: "Ceramics I", s: "ART", u: 3.0, k: "M-ID" },
    ] },
    { sig: "painting", n: 2, score: 0.9, members: [
      { id: "ARTS M1003", t: "Painting", s: "ART", u: 3.0, k: "M-ID" },
      { id: "ARTS M1004", t: "Painting I", s: "ART", u: 3.0, k: "M-ID" },
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

function mouse(type, x, y) {
  return new window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
}

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(120);
  const doc = window.document;
  const sugBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);

  // ── 1. persistent title bar + ✕ closer ───────────────────────────────────
  const strongTitle = Array.from(doc.querySelectorAll("strong")).find((s) => /Suggested merges/.test(txt(s)));
  const head = strongTitle && strongTitle.parentNode;
  const shell = head && head.parentNode;
  check("title bar renders with the popup title", !!head);
  check("title bar is styled as a drag handle (cursor:move)", head && head.style.cursor === "move");
  const closeX = head && Array.from(head.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Close");
  check("✕ closer present in the title bar (aria-label Close)", !!closeX && txt(closeX) === "✕");
  // task 1 (Sam, 2026-06-16): the "N of M" position counter moved UP into the
  // title bar; the redundant in-box "Suggested merge N of M" subtitle and the
  // "drag to move" hint were removed.
  check("position counter renders in the title bar", /1 of 2/.test(txt(head)));
  check("redundant in-box subtitle removed", !/Suggested merge \d+ of/.test(doc.body.textContent));
  check("'drag to move' hint removed", !/drag to move/.test(doc.body.textContent));

  // ── 3. proposal framing copy ─────────────────────────────────────────────
  const bodyTx = doc.body.textContent;
  check("title field is framed as a PROPOSAL", /Proposed unified title/.test(bodyTx));
  check("proposal hint says it applies only on Confirm", /applied only if you Confirm/.test(bodyTx));
  check("member list is labelled Candidates (N)", /Candidates \(2\)/.test(bodyTx));
  check("label states each row is currently its own identity", /each row is currently its own separate identity/.test(bodyTx));
  check("explainer states the group does NOT yet share an identity", /do NOT yet share an identity/.test(bodyTx));
  const idSpan = Array.from(shell.querySelectorAll("span")).find((s) => /ARTS M1001/.test(txt(s)));
  check("member id carries the current-identity tooltip",
    idSpan && /CURRENT identity/.test(idSpan.getAttribute("title") || ""));

  // ── 2. drag to move ──────────────────────────────────────────────────────
  head.dispatchEvent(mouse("mousedown", 100, 100));
  doc.dispatchEvent(mouse("mousemove", 160, 140));
  check("dragging the bar translates the dialog",
    shell.style.transform === "translate(60px,40px)");
  doc.dispatchEvent(mouse("mouseup", 160, 140));
  doc.dispatchEvent(mouse("mousemove", 500, 500));
  check("after mouseup further mouse movement does nothing",
    shell.style.transform === "translate(60px,40px)");
  head.dispatchEvent(mouse("mousedown", 200, 200));
  doc.dispatchEvent(mouse("mousemove", 230, 210));
  doc.dispatchEvent(mouse("mouseup", 230, 210));
  check("a second drag resumes from the moved position (cumulative)",
    shell.style.transform === "translate(90px,50px)");

  // position persists across a Skip advance (the dialog node is reused)
  const skip = Array.from(doc.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)));
  skip.dispatchEvent(new window.Event("click"));
  await sleep(50);
  check("Skip advanced to group 2", /2 of 2/.test(txt(head)));
  check("dragged position persists across Skip", shell.style.transform === "translate(90px,50px)");

  // mousedown on the ✕ must NOT start a drag…
  closeX.dispatchEvent(mouse("mousedown", 300, 300));
  doc.dispatchEvent(mouse("mousemove", 400, 400));
  check("mousedown on ✕ does not start a drag", shell.style.transform === "translate(90px,50px)");
  // …and clicking it closes the popup.
  closeX.dispatchEvent(new window.Event("click", { bubbles: true }));
  await sleep(50);
  check("✕ closes the popup", !/Proposed unified title/.test(doc.body.textContent)
    && !doc.body.contains(shell));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
