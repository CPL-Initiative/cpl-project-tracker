// Regression test for the ⤴ member re-home affordance (Session 54).
//
// A generic title can over-merge a course into the wrong family (e.g. a
// Cosmetology "Health and Safety" minted into an Industrial-Tech "Health and
// Safety" M-ID). The ⤴ on a member-course row lets a signed-in curator pull
// THAT one course out and send it to its rightful place — merge into an
// existing course (searched + similarity-suggested) OR mint a new standalone.
// The write is a `CN:<control#>` curation row (merge_into the target); the
// generator honors it (drops from the old family, lands at the target).
//
// Guards: the ⤴ is signed-in only; the dialog offers BOTH existing-merge and
// mint-new; Confirm writes the right kb_curation rows; the row drops live.
//
// Run from repo root: `npm test` (or `node tests/uc_member_rehome.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title, subj, units) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Industrial Technology", credit: "Credit", units: units, top: "0952.10",
  subj: subj, members: 2, adopted: [], potential: [], conf: 0.7,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false }, locked: false,
});
const rows = [
  mkRow("INDT M1092", "Health and Safety", ["INDT"], 3),
  mkRow("COSM M1500", "Health and Safety", ["COSM"], 0.5),  // the rightful cosmetology home
];
// INDT M1092's member courses — incl. the over-merged COSM 5 (note its cn).
const members = {
  "INDT M1092": [
    { c: 0, n: "INDT 100", t: "Health and Safety", u: 3, p: "0952.10", cn: "CCC000111111" },
    { c: 1, n: "COSM 5", t: "Health and Safety", u: 0.5, p: "3007.00", cn: "CCC000600461" },
  ],
};

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A", "B"], mq_disciplines: ["Industrial Technology", "Cosmetology and Barbering"], topmap: {} })};
  window.CPL_UC_MEMBERS = ${JSON.stringify({ colleges: ["Chabot College", "Santiago Canyon College"], members: members, topmap: { "0952.10": "Carpentry", "3007.00": "Cosmetology and Barbering" } })};
  window.CPL_UC_INDEX = ${JSON.stringify([
    ["INDT M1092", "Health and Safety", "INDT", "M-ID", 3],
    ["COSM M1500", "Health and Safety", "COSM", "M-ID", 0.5],
  ])};
</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.sessionStorage.setItem("cpl_sb", JSON.stringify({
  access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
  refresh_token: "r", email: "test@rccd.edu", exp: Date.now() + 3600000,
}));
const calls = [];
window.fetch = (url, opts) => {
  const u = String(url), method = (opts && opts.method) || "GET";
  calls.push({ url: u, method: method, body: opts && opts.body ? JSON.parse(opts.body) : null });
  let body = [];
  if (u.indexOf("allowed_reviewers") >= 0) body = [{ email: "test@rccd.edu" }];
  return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
};
window.alert = () => {};

let threw = false;
try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
check("init does not throw", !threw);

(async function main() {
  await sleep(140);
  const doc = window.document;
  const wrap = doc.getElementById("uc-table-wrap");
  const famTr = Array.from(wrap.querySelectorAll("table.uc-table tbody tr"))
    .find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("INDT M1092") >= 0);
  check("family row renders", !!famTr);
  famTr.querySelector("a.uc-caret").click();   // expand members
  await sleep(120);

  const memTable = famTr.nextElementSibling.querySelector("table.uc-member-table");
  check("member table renders", !!memTable);
  const memRows = () => Array.from(memTable.querySelectorAll("tbody tr"));
  const cosmRow = memRows().find((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("COSM 5") >= 0);
  check("COSM 5 member row present before re-home", !!cosmRow);

  // ── ⤴ present (signed-in) ────────────────────────────────────────────────
  const rh = cosmRow && Array.from(cosmRow.querySelectorAll("a")).find((a) => txt(a) === "⤴");
  check("⤴ Re-home affordance on the member row (signed in)", !!rh);

  rh.dispatchEvent(new window.Event("click"));
  await sleep(120);   // openRehomeDialog → loadIndex resolves

  const dlg = Array.from(doc.querySelectorAll("h3")).find((h) => /Re-home this course/.test(txt(h)));
  check("re-home dialog opens", !!dlg);
  const box = dlg && dlg.parentNode;

  // ── BOTH paths offered: an existing suggested target + mint-new default ──
  const goBtn = () => Array.from(box.querySelectorAll("button")).find((b) => /^Re-home into /.test(txt(b)));
  check("Confirm defaults to MINT a new course", goBtn() && /Re-home into NEW course/.test(txt(goBtn())));
  const sugBtn = Array.from(box.querySelectorAll("button")).find((b) => /COSM M1500/.test(txt(b)));
  check("an EXISTING target is suggested (COSM M1500, same title)", !!sugBtn);
  sugBtn.dispatchEvent(new window.Event("click"));
  check("picking the suggestion targets the existing course", goBtn() && /Re-home into COSM M1500/.test(txt(goBtn())));
  // ↺ back to mint-new for the COSM 5 case ("haven't checked if it's out there")
  const reset = Array.from(box.querySelectorAll("button")).find((b) => /clear target/.test(txt(b)));
  reset.dispatchEvent(new window.Event("click"));
  check("↺ clears back to mint-new", goBtn() && /Re-home into NEW course/.test(txt(goBtn())));

  // set a discipline on the mint, then Confirm
  const discSel = Array.from(box.querySelectorAll("select")).find((s) =>
    Array.from(s.options).some((o) => /discipline \(optional\)/.test(o.textContent)));
  discSel.value = "Cosmetology and Barbering";
  goBtn().dispatchEvent(new window.Event("click"));
  await sleep(120);

  // ── the write ────────────────────────────────────────────────────────────
  const post = calls.find((c) => c.method === "POST" && c.url.indexOf("kb_curation") >= 0 && Array.isArray(c.body));
  check("re-home saved (kb_curation POST)", !!post);
  const cnItem = post && post.body.find((i) => i.course_id === "CN:CCC000600461" && i.field === "merge_into");
  check("the member is keyed CN:<control#> with merge_into", !!cnItem);
  check("mint-new target is a UC-CUR-EXT* id", cnItem && /^UC-CUR-EXT/.test(cnItem.value));
  const tgt = cnItem && cnItem.value;
  check("new standalone carries the unified_title", post && post.body.some((i) => i.course_id === tgt && i.field === "unified_title" && i.value === "Health and Safety"));
  check("new standalone carries the chosen discipline", post && post.body.some((i) => i.course_id === tgt && i.field === "discipline" && i.value === "Cosmetology and Barbering"));

  // ── live feedback: the re-homed member drops out of the open table ───────
  check("COSM 5 row removed from the family's member table after re-home",
    !memRows().some((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("COSM 5") >= 0));
  check("the family's other member (INDT 100) stays", memRows().some((tr) => txt(tr.querySelectorAll("td")[1]).indexOf("INDT 100") >= 0));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
