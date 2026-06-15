// Guards the worklist "Merge into a different existing course" picker
// (Session 55, Sam's 2026-06-15 ask): a curator can redirect a Suggested-merge
// to ANY existing identity the title-signature grouping won't surface — e.g. a
// real "Anatomy and Physiology" C-ID for a "Life Science – Physiology" group —
// by searching the ⚇ Unify index. Folding into it keeps the target's identity,
// title, and discipline (no unified_title / discipline write).
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_override_target.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// An element counts as hidden if it or any ancestor has display:none (jsdom
// has no layout engine, so offsetParent is unreliable).
function hidden(elm) { let p = elm; while (p) { if (p.style && p.style.display === "none") return true; p = p.parentElement; } return false; }

const rows = [
  { kind: "Course", id: "BIOL M90BE", title: "Life Science – Physiology", id_system: "M-ID",
    disc: "Biological Sciences", credit: "Credit", units: 0, top: "0410.00", subj: ["AHSD"],
    members: 2, adopted: [], potential: [], conf: 0.84, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];
const sugStub = {
  groups: [
    { sig: "Life Science – Physiology", n: 2, score: 0.84,
      members: [
        { id: "BIOL M90BE", t: "Life Science – Physiology", s: "AHSD", u: 0, k: "M-ID" },
        { id: "BIOL M90BE-SA", t: "Life Science – Physiology", s: "AHSD", u: 0, k: "Stand-Alone", g: 1 },
      ] },
  ],
  singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
};
// The ⚇ Unify search index: [id, title, subject, kind, units]. ANAT 100 is the
// off-signature C-ID the curator wants to redirect into.
const idx = [
  ["ANAT 100", "Anatomy and Physiology", "ANAT", "C-ID", 5.0],
  ["BIOL M90BE", "Life Science – Physiology", "AHSD", "M-ID", 0],
];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Biological Sciences"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
  window.CPL_UC_INDEX = ${JSON.stringify(idx)};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const posts = [];
window.fetch = (url, opts) => {
  const method = (opts && opts.method) || "GET";
  if (method !== "GET") posts.push({ url: String(url), method, body: opts && opts.body });
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve([]) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("consumer init does not throw", !threw);

function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Suggested merge \d+ of/.test(txt(d)));
  return boxes[boxes.length - 1];
}

(async function main() {
  await sleep(120);
  const doc = window.document;
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(250);
  let box = curBox(doc);

  // The toggle is present; clicking reveals the search panel.
  const toggle = Array.from(box.querySelectorAll("a")).find((a) => /different existing course/.test(txt(a)));
  check("the ⌕ override toggle is present", !!toggle);
  const search = box.querySelector("input[type=search]");
  check("search input hidden until toggled", search && hidden(search));
  toggle.dispatchEvent(new window.Event("click"));
  await sleep(20);
  check("search panel shown after toggle", search && !hidden(search));

  // Type a query → the off-signature ANAT 100 C-ID surfaces as a result.
  search.value = "anatomy";
  search.dispatchEvent(new window.Event("input"));
  await sleep(300);
  const resBtn = Array.from(box.querySelectorAll("button")).find((b) => /Anatomy and Physiology/.test(txt(b)) && /ANAT 100/.test(txt(b)));
  check("typing surfaces the off-signature ANAT 100 C-ID", !!resBtn);
  check("a row already in the group is NOT offered as an override target",
    !Array.from(box.querySelectorAll("button")).some((b) => /→ .*BIOL M90BE/.test(txt(b))));

  // Pick it → override banner, relabeled Confirm, discipline + title disabled.
  resBtn.dispatchEvent(new window.Event("click"));
  await sleep(30);
  check("override banner names the chosen target", /Folding the checked course\(s\) into:.*ANAT 100/.test(box.textContent));
  const go = Array.from(box.querySelectorAll("button")).find((b) => /Fold into ANAT 100/.test(txt(b)));
  check("Confirm button relabels to ✓ Fold into ANAT 100", !!go);
  const discSel = box.querySelector("select.uc-filter");
  check("discipline disabled under an override", discSel && discSel.disabled === true);
  const titleIn = box.querySelector("input[type=text]");
  check("proposed-title input disabled under an override", titleIn && titleIn.disabled === true);
  check("the in-group ★ badge is suppressed when an override is active",
    !Array.from(box.querySelectorAll("span")).some((s) => /★ merge target/.test(txt(s)) && s.style.display !== "none"));

  // Confirm → BOTH checked members fold INTO ANAT 100; no title/discipline writes.
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);
  const bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("the Stand-Alone folds into ANAT 100",
    /"course_id":\s*"BIOL M90BE-SA"[^}]*"field":\s*"merge_into"[^}]*"value":\s*"ANAT 100"/.test(bodies)
    || (/"course_id":\s*"BIOL M90BE-SA"/.test(bodies) && /"value":\s*"ANAT 100"/.test(bodies)));
  check("the M-ID member also folds into ANAT 100 (whole group redirected)",
    /"course_id":\s*"BIOL M90BE"/.test(bodies) && /"value":\s*"ANAT 100"/.test(bodies));
  check("NO unified_title written (official target keeps its name)", !/"field":\s*"unified_title"/.test(bodies));
  check("NO discipline written (target keeps its own)", !/"field":\s*"discipline"/.test(bodies));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
