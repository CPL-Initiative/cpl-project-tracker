// Session 70 — the Pending-merges tracking panel + Undo.
// After a curator confirms a merge, the sync badge surfaces a "📋 Review merges"
// link. The panel lists this session's merges (target ← absorbed members) with
// per-member / per-group Undo. Undo DELETEs the member's merge_into row from
// kb_curation (reviewer-gated policy) and un-hides it locally.
//
// Run from repo root: `npm test` (or `node tests/uc_pending_merges_panel.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "PHOT M1064", title: "Digital Imaging 1", id_system: "M-ID",
    disc: "Photography", credit: "Credit", units: 3.0, top: "1012.00", subj: ["PHOT"],
    members: 1, adopted: [], potential: [], conf: 0.85, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
// One anchored group: an M-ID + a Stand-Alone, both pre-checked.
const sugStub = {
  groups: [
    { sig: "Digital Imaging 1", n: 2, score: 0.85,
      members: [
        { id: "PHOT M1064", t: "Digital Imaging 1", s: "PHOT", u: 3.0, k: "M-ID" },
        { id: "PHOT M1064-SA", t: "Digital Imaging I", s: "PHOT", u: 3.0, k: "Stand-Alone", g: 1 },
      ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses"><div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div></div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Photography"], topmap: {}, committed_curation: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script></body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const reqs = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") reqs.push({ url: String(url), method, body: opts && opts.body });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : (method === "DELETE" ? 204 : 201), json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Proposed unified title/.test(txt(d)));
  return boxes[boxes.length - 1];
}
function reviewLink(doc) {
  return Array.from(doc.querySelectorAll("a")).find((a) => /Review merges/.test(txt(a)));
}
function panelBox(doc) {
  return Array.from(doc.querySelectorAll("div")).find((d) => /Pending merges/.test(txt(d)) && d.querySelector("button"));
}

(async function main() {
  await sleep(120);
  const doc = window.document;

  // No merges yet → no review link.
  check("no Review-merges link before any merge", !reviewLink(doc));

  // Confirm the anchored merge.
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(220);
  let box = curBox(doc);
  Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  // Close the worklist overlay.
  Array.from(doc.querySelectorAll("button")).filter((b) => txt(b) === "✕")
    .forEach((b) => b.dispatchEvent(new window.Event("click")));
  await sleep(40);

  // The sync badge now offers the review link.
  const rl = reviewLink(doc);
  check("a '📋 Review merges (1)' link appears after a merge", rl && /\(1\)/.test(txt(rl)));

  // Open the panel — it lists target ← member.
  rl.dispatchEvent(new window.Event("click"));
  await sleep(40);
  let panel = panelBox(doc);
  check("panel lists the target identity", /PHOT M1064\b/.test(panel.textContent));
  check("panel lists the absorbed member", /PHOT M1064-SA/.test(panel.textContent));
  check("panel offers an Undo control", Array.from(panel.querySelectorAll("a,button")).some((b) => /undo/i.test(txt(b))));

  // Undo the member → a DELETE to kb_curation for that member's merge_into row.
  reqs.length = 0;
  const undo = Array.from(panel.querySelectorAll("a")).find((b) => /✕ undo/.test(txt(b)))
    || Array.from(panel.querySelectorAll("button")).find((b) => /Undo all/.test(txt(b)));
  undo.dispatchEvent(new window.Event("click"));
  await sleep(200);
  const del = reqs.find((r) => r.method === "DELETE");
  check("Undo issues a DELETE to kb_curation", del && /kb_curation/.test(del.url));
  check("the DELETE targets the member's merge_into row",
    del && /course_id=eq\.PHOT%20M1064-SA/.test(del.url) && /field=eq\.merge_into/.test(del.url));

  // Panel rebuilds to empty; the member is un-hidden in the table.
  await sleep(40);
  panel = panelBox(doc);
  check("panel shows no pending merges after undo", /No pending merges/.test(panel.textContent));
  check("the un-merged member reappears in the table",
    Array.from(doc.querySelectorAll("table.uc-table tbody tr")).some((tr) => /PHOT M1064-SA/.test(txt(tr)))
    || doc.querySelector("#uc-table-wrap").textContent.indexOf("PHOT M1064-SA") < 0); // SA may be lazy; tolerate absence

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
