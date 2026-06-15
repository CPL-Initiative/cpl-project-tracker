// Guards the Suggested-merges worklist's MERGE-TARGET clarity (Session 55, in
// response to Sam's screenshot confusion: "it's unclear which of the 2 checked
// members is represented above in the common-course slot, and with only 2
// listed it's unclear what to do").
//
//   1. An anchored group (an M-ID + a Stand-Alone — the screenshot's shape)
//      marks the M-ID row with the ★ merge-target badge; the Stand-Alone does
//      NOT carry it. The badge marks ANY surviving identity now, not only the
//      official C-ID/CCN rows.
//   2. The candidates note explains the ★ row is the surviving identity AND, for
//      a 2-candidate group, that the choice is just Confirm vs Keep/Skip (don't
//      deselect either).
//   3. The target tracks the live checked set: in a 3-member group, unchecking
//      the only identity flips it to the mint-new hint (no ★, "mint a brand-new
//      unified course"); re-checking restores the ★.
//   4. A singleton-only group (all Stand-Alones) shows NO ★, the mint-new hint,
//      and the "MINTS a brand-new unified course" note.
//   5. Confirm still targets the M-ID (the ★ row) — behavior unchanged.
//
// Run from repo root: `npm test` (or `node tests/uc_worklist_target_badge.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [
  { kind: "Course", id: "BIOL M90BE", title: "Life Science – Physiology", id_system: "M-ID",
    disc: "Biological Sciences", credit: "Credit", units: 0, top: "0410.00", subj: ["BIOL"],
    members: 2, adopted: [], potential: [], conf: 0.84, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
  { kind: "Course", id: "PHYS M1300", title: "General Physics A", id_system: "M-ID",
    disc: "Physics", credit: "Credit", units: 4.0, top: "1902.00", subj: ["PHYS"],
    members: 3, adopted: [], potential: [], conf: 0.8, locked: false,
    flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false } },
];

// Group 1 mirrors the screenshot: an M-ID identity + a Stand-Alone, both pre-
// checked. Group 2 is a 3-member anchored group (one M-ID + two Stand-Alones)
// for the live-recompute path. Group 3 is singleton-only (mints new).
const sugStub = {
  groups: [
    { sig: "Life Science – Physiology", n: 2, score: 0.84,
      members: [
        { id: "BIOL M90BE", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "M-ID" },
        { id: "BIOL M90BE-SA", t: "Life Science – Physiology", s: "BIOL", u: 0, k: "Stand-Alone", g: 1 },
      ] },
    { sig: "General Physics A", n: 3, score: 0.8,
      members: [
        { id: "PHYS M1300", t: "General Physics A", s: "PHYS", u: 4.0, k: "M-ID" },
        { id: "PHYS SA1", t: "General Physics A", s: "PHYS", u: 4.0, k: "Stand-Alone", g: 1 },
        { id: "PHYS SA2", t: "General Physics A", s: "PHYS", u: 4.0, k: "Stand-Alone", g: 1 },
      ] },
  ],
  singleton_groups: [
    { sig: "Intro Welding Safety", n: 2, score: 0.9, same_college: false,
      members: [
        { id: "WELD SA1", t: "Intro Welding Safety", s: "WELD", u: 1.0, k: "Stand-Alone", g: 1 },
        { id: "WELD SA2", t: "Introduction to Welding Safety", s: "WELD", u: 1.0, k: "Stand-Alone", g: 1 },
      ] },
  ],
  family_groups: [], desc_groups: [], evidence_groups: [],
  title_count: 0, title_groups: [],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Biological Sciences", "Physics"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
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

// The currently-rendered worklist group box (renderGroup re-fills `box`).
function curBox(doc) {
  const boxes = Array.from(doc.querySelectorAll("div")).filter((d) => /Suggested merge \d+ of/.test(txt(d)));
  return boxes[boxes.length - 1];
}
// The member rows are fl/checkbox rows inside the candidates list.
function memberRows(box) {
  return Array.from(box.querySelectorAll("div"))
    .filter((d) => d.querySelector(":scope > input[type=checkbox]"));
}
function badgeIn(row) {
  return Array.from(row.querySelectorAll("span")).find((s) => /★\s*merge target/.test(txt(s)));
}
function shown(elm) { return elm && elm.style.display !== "none"; }

(async function main() {
  await sleep(120);
  const doc = window.document;

  const sugBtn = Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)));
  check("✨ Suggested merges control present", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(250);

  // ── 1. anchored M-ID + Stand-Alone: ★ on the M-ID, not the Stand-Alone ──
  let box = curBox(doc);
  let mrows = memberRows(box);
  check("group 1 renders both candidate rows", mrows.length === 2);
  const midRow = mrows.find((r) => /BIOL M90BE\b/.test(txt(r)) && !/Stand-Alone/.test(txt(r)));
  const saRow = mrows.find((r) => /Stand-Alone/.test(txt(r)));
  check("the M-ID row carries a VISIBLE ★ merge-target badge", shown(badgeIn(midRow)));
  check("the Stand-Alone row does NOT show the ★ badge", !shown(badgeIn(saRow)));

  // ── 2. the note explains the ★ identity + the 2-candidate guidance ──
  check("note flags the ★ row as the SURVIVING identity",
    /★ row is the SURVIVING identity/.test(box.textContent));
  check("note explains the common-course slot",
    /common course/i.test(box.textContent));
  check("note gives the two-candidate guidance (don't deselect either)",
    /only two candidates/i.test(box.textContent) && /don't deselect either/i.test(box.textContent));

  // Skip to group 2 (the 3-member live-recompute path).
  const skip = Array.from(box.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)));
  skip.dispatchEvent(new window.Event("click"));
  await sleep(150);

  // ── 3. unchecking the only identity flips to the mint-new hint ──
  box = curBox(doc);
  mrows = memberRows(box);
  check("group 2 renders three candidate rows", mrows.length === 3);
  const g2mid = mrows.find((r) => /PHYS M1300\b/.test(txt(r)));
  check("the M-ID is the ★ target by default", shown(badgeIn(g2mid)));
  const mintHint = Array.from(box.querySelectorAll("div"))
    .find((d) => /mint a brand-new unified course/i.test(txt(d)));
  check("mint-new hint hidden while the identity is checked", !shown(mintHint));
  const g2cb = g2mid.querySelector("input[type=checkbox]");
  g2cb.checked = false; g2cb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("unchecking the identity removes its ★ badge", !shown(badgeIn(g2mid)));
  check("mint-new hint appears when no identity is checked", shown(mintHint));
  g2cb.checked = true; g2cb.dispatchEvent(new window.Event("change"));
  await sleep(20);
  check("re-checking restores the ★ on the identity", shown(badgeIn(g2mid)));
  check("mint-new hint hides again", !shown(mintHint));

  // Skip to group 3 (singleton-only mint).
  Array.from(box.querySelectorAll("button")).find((b) => /Skip/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(150);

  // ── 4. singleton-only: no ★, mint hint + mint note ──
  box = curBox(doc);
  check("singleton group shows the ✨ New unified course badge",
    /New unified course/.test(box.textContent));
  check("no ★ merge-target badge in a singleton-only group",
    !memberRows(box).some((r) => shown(badgeIn(r))));
  check("note says Confirm MINTS a brand-new unified course",
    /MINTS a brand-new unified course/.test(box.textContent));
  const g3hint = Array.from(box.querySelectorAll("div"))
    .find((d) => /mint a brand-new unified course/i.test(txt(d)));
  check("mint-new hint visible for the singleton group", shown(g3hint));

  // ── 5. Confirm still targets the M-ID (go back is awkward; assert on a fresh
  //       drive of group 1 via a brand-new dialog) ──
  // Reopen the worklist and Confirm group 1.
  Array.from(doc.querySelectorAll("button, a")).find((b) => /Suggested merges/.test(txt(b)))
    .dispatchEvent(new window.Event("click"));
  await sleep(200);
  box = curBox(doc);
  const go = Array.from(box.querySelectorAll("button")).find((b) => /Confirm merge/.test(txt(b)));
  go.dispatchEvent(new window.Event("click"));
  await sleep(250);
  const bodies = posts.map((p) => String(p.body || "")).join(" ");
  check("Confirm folds the Stand-Alone INTO the M-ID (merge_into -> BIOL M90BE)",
    /"field":\s*"merge_into"/.test(bodies)
    && /"value":\s*"BIOL M90BE"/.test(bodies)
    && /"course_id":\s*"BIOL M90BE-SA"/.test(bodies));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
