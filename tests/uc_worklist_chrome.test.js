// Guards the suggested-merges DOCK chrome + proposal framing. The worklist is a
// RIGHT-HAND docked panel (Session 71, PR-3 — replaced the draggable modal so the
// CCR table stays co-visible):
//   1. A persistent title bar renders above the per-group content with an
//      explicit ✕ closer (aria-label "Close") + a collapse-to-rail control; the
//      dock is position:fixed at right:0 and reflows the page (body padding-right),
//      not a backdrop overlay. (The old cursor:move drag handle is gone.)
//   2. Dock behavior: collapse shrinks it to a thin rail (re-expands on click);
//      the left grip resizes the width; ✕ closes it and clears the page reflow.
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

  // ── 1. docked panel: title bar, collapse + ✕, page reflow (PR-3) ─────────
  // The worklist is now a RIGHT-HAND docked panel (not a draggable modal), so
  // the CCR table stays co-visible. Title bar + ✕ closer + position counter
  // survive; the drag handle is replaced by a collapse-to-rail + a resize grip.
  const strongTitle = Array.from(doc.querySelectorAll("strong")).find((s) => /Suggested merges/.test(txt(s)));
  const head = strongTitle && strongTitle.parentNode;
  const shell = head && head.parentNode;
  const dock = shell && shell.parentNode;   // the .uc-worklist-dock wrapper
  check("title bar renders with the panel title", !!head);
  check("worklist is a RIGHT-HAND docked panel (fixed, right:0)",
    dock && dock.className === "uc-worklist-dock" && dock.style.position === "fixed" && dock.style.right === "0px");
  check("opening the dock reflows the page (body padding-right set)",
    !!doc.body.style.paddingRight && parseInt(doc.body.style.paddingRight, 10) > 0);
  check("title bar is NOT a drag handle anymore (no cursor:move)", head.style.cursor !== "move");
  const closeX = head && Array.from(head.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Close");
  check("✕ closer present in the title bar (aria-label Close)", !!closeX && txt(closeX) === "✕");
  const collapseBtn = head && Array.from(head.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Collapse");
  check("collapse-to-rail control present in the title bar", !!collapseBtn);
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

  // ── 2. dock collapse / expand / resize / close (PR-3) ────────────────────
  const widthOpen = parseInt(dock.style.width, 10);
  check("dock has a concrete pixel width when open", widthOpen > 0);
  // Collapse → a thin rail; the shell content hides and the page reflow narrows.
  collapseBtn.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("collapse shrinks the dock to a thin rail",
    parseInt(dock.style.width, 10) < widthOpen && parseInt(dock.style.width, 10) <= 48);
  check("collapsed dock hides the shell content", shell.style.display === "none");
  check("collapsed dock narrows the page reflow", parseInt(doc.body.style.paddingRight, 10) <= 48);
  // The rail re-expands on click (back to the prior width).
  const rail = Array.from(dock.children).find((c) => c !== shell && c !== head && /Suggested merges/.test(txt(c)));
  check("collapsed rail is present", !!rail);
  rail.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("clicking the rail re-expands the dock",
    shell.style.display !== "none" && parseInt(dock.style.width, 10) === widthOpen);

  // Resize via the left-edge grip: width = innerWidth(1024) - clientX.
  const grip = Array.from(dock.children).find((c) => /resize/i.test(c.getAttribute("title") || ""));
  check("left-edge resize grip present", !!grip);
  grip.dispatchEvent(mouse("mousedown", 0, 0));
  doc.dispatchEvent(mouse("mousemove", 600, 300));
  check("dragging the grip resizes the dock width", parseInt(dock.style.width, 10) === 424);
  doc.dispatchEvent(mouse("mouseup", 600, 300));

  // Skip still advances the queue under the dock.
  const skip = Array.from(doc.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)));
  skip.dispatchEvent(new window.Event("click"));
  await sleep(50);
  check("Skip advanced to group 2", /2 of 2/.test(txt(head)));

  // ✕ closes the panel AND clears the page reflow.
  closeX.dispatchEvent(new window.Event("click", { bubbles: true }));
  await sleep(50);
  check("✕ closes the panel", !/Proposed unified title/.test(doc.body.textContent)
    && !doc.body.contains(shell));
  check("closing clears the page reflow (body padding-right reset)", !doc.body.style.paddingRight);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
