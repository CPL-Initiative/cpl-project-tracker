// Guards the CCR worklist's pairwise Honors hold (S653, `honors_of`; docs/reference/honors_of_design.md).
// Sam ruled an Honors course gets its own M-ID with a two-way equivalence to its base (Sheet 191 card 1;
// Sheet 197 card 3). The worklist reads the live honors_of rows and never offers an Honors id beside its base:
//   1. A group holding an Honors id, its base and a third id is offered WITHOUT the Honors id (the rest may merge).
//   2. After the third id merges into the base, the group holds only the pair: it is not offered at all. A
//      group-signature dismissal would re-offer it here (COBIx's review of #3304, item 1).
//   3. With no honors_of row the worklist shows every group as before.
// Run from repo root: `npm test` (or `node tests/uc_honors_of_worklist.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const src = fs.readFileSync("unified_courses.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const mkRow = (id, title) => ({
  kind: "Course", id: id, title: title, id_system: "M-ID",
  disc: "Humanities", credit: "Credit", units: 3.0, top: "1509.00", subj: ["HUMAN"],
  members: 2, adopted: [], potential: [], conf: 0.7, locked: false,
  flags: { over_merged: false, credit_mixed: false, top_mixed: false, ncc_mixed: false },
});
const mem = (id, t) => ({ id: id, t: t, s: "HUMAN", u: 3.0, k: "M-ID" });

function page(groups, rows) {
  const sugStub = { singleton_groups: [], family_groups: [], desc_groups: [], evidence_groups: [], title_groups: [],
                    groups: groups };
  return `<!DOCTYPE html><html><head></head><body>
<div id="tab-unified-courses">
  <div id="uc-toolbar"></div><div id="uc-summary"></div><div id="uc-table-wrap"></div>
</div>
<script>
  window.CPL_UNIFIED_COURSES = ${JSON.stringify({ rows: rows, colleges: ["A"], mq_disciplines: ["Humanities"], topmap: {} })};
  window.CPL_UC_SUGGESTIONS = ${JSON.stringify(sugStub)};
</script>
</body></html>`;
}

async function open(groups, rows, honorsRows, mergeRows, fail) {
  const dom = new JSDOM(page(groups, rows), { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0In0.c2lnbmF0dXJl",
    refresh_token: "r", email: "test@example.org", exp: Date.now() + 3600000,
  }));
  window.fetch = (url, opts) => {
    const u = String(url);
    const method = (opts && opts.method) || "GET";
    let body = u.indexOf("field=eq.honors_of") >= 0 ? honorsRows : [];
    if (u.indexOf("field=eq.honors_of") >= 0 && fail === "reject") return Promise.reject(new Error("offline"));
    if (u.indexOf("field=eq.honors_of") >= 0 && fail === "status") {
      return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({}) });
    }
    if (u.indexOf("field=eq.merge_into&course_id=in.") >= 0) {
      if (fail === "hop") return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      const asked = decodeURIComponent(u);
      body = (mergeRows || []).filter((x) => asked.indexOf('"' + x.course_id + '"') >= 0);
      reads.push(u);
    }
    return Promise.resolve({ ok: true, status: method === "GET" ? 200 : 201, json: () => Promise.resolve(body) });
  };
  window.alert = (m) => { alerts.push(String(m)); };
  let threw = false;
  try { window.eval(src); } catch (e) { threw = true; console.error("init threw:", e); }
  await sleep(120);
  const doc = window.document;
  const sugBtn = Array.from(doc.querySelectorAll("button")).find((b) => /Suggested merges/.test(txt(b)));
  if (sugBtn) sugBtn.dispatchEvent(new window.Event("click"));
  await sleep(200);
  return { threw, doc, sugBtn, panel: doc.body.lastElementChild };
}

const rows = [mkRow("HUMA M1110", "World Religions"), mkRow("HUMA M1110H", "World Religions (Honors)"),
              mkRow("HUMA M10OI", "World Religion"), mkRow("ARTS M1001", "Ceramics"), mkRow("ARTS M1002", "Ceramics I")];
const threeWay = { sig: "religions", n: 3, score: 0.9, members: [
  mem("HUMA M10OI", "World Religion"), mem("HUMA M1110", "World Religions"), mem("HUMA M1110H", "World Religions (Honors)")] };
const pairOnly = { sig: "religions2", n: 2, score: 0.9, members: [
  mem("HUMA M1110", "World Religions"), mem("HUMA M1110H", "World Religions (Honors)")] };
const ceramics = { sig: "ceramics", n: 2, score: 0.9, members: [mem("ARTS M1001", "Ceramics"), mem("ARTS M1002", "Ceramics I")] };
const honors = [{ course_id: "HUMA M1110H", value: "HUMA M1110" }];
const reads = [];
const alerts = [];

(async function main() {
  // 1. Three members, the pair among them: offered without the Honors id.
  let r = await open([threeWay, ceramics], rows, honors);
  check("init does not throw", !r.threw);
  check("Suggested merges control present", !!r.sugBtn);
  check("the group still shows (two members remain)", /1 of 2/.test(r.doc.body.textContent));
  check("the base and the third id are offered", r.panel.textContent.indexOf("HUMA M10OI") >= 0
    && r.panel.textContent.indexOf("HUMA M1110") >= 0);
  check("the Honors id is not offered beside its base", r.panel.textContent.indexOf("HUMA M1110H") < 0);

  // 2. After the third id merges into the base: the pair alone is never offered.
  r = await open([pairOnly, ceramics], rows, honors);
  check("the pair alone is not offered: the worklist opens on the unrelated group (2 of 2)",
    /2 of 2/.test(r.doc.body.textContent) && !/1 of 2/.test(r.doc.body.textContent)
    && r.panel.textContent.indexOf("ARTS M1001") >= 0
    && r.panel.textContent.indexOf("HUMA M1110H") < 0);

  // 3. No honors_of row: every group shows as before, and no merge read is made.
  reads.length = 0;
  r = await open([pairOnly, ceramics], rows, []);
  check("without the field the pair's group shows as before",
    /1 of 2/.test(r.doc.body.textContent) && r.panel.textContent.indexOf("HUMA M1110H") >= 0);
  check("without the field no merge_into read is made", reads.length === 0);

  // 4. The base merged into a third id (live overlay HUMA M1110 -> HUMA M1999, then M1999 -> HUMA M2000):
  //    a group of the Honors id and the chain's end is not offered (COBIx's review of #3313, item 2).
  const rows4 = rows.concat([mkRow("HUMA M2000", "World Religions")]);
  const pairEnd = { sig: "religions3", n: 2, score: 0.9, members: [
    mem("HUMA M1110H", "World Religions (Honors)"), mem("HUMA M2000", "World Religions")] };
  r = await open([pairEnd, ceramics], rows4, honors,
    [{ course_id: "HUMA M1110", value: "HUMA M1999" }, { course_id: "HUMA M1999", value: "HUMA M2000" }]);
  check("a base merged away (two hops): the Honors id and the chain's end are not offered together",
    /2 of 2/.test(r.doc.body.textContent) && r.panel.textContent.indexOf("HUMA M1110H") < 0);
  check("the chain is read hop by hop from the live overlay", reads.length >= 2);

  // 5. The read fails (COBIx's read of #3313): the worklist fails closed. A rejected fetch, a failed status on the
  //    honors_of read and a failed hop page each give the notice and offer no group at all, the unrelated one
  //    included, since without the rows any group might hold a pair.
  for (const mode of ["reject", "status", "hop"]) {
    alerts.length = 0;
    r = await open([pairOnly, ceramics], rows, honors, [{ course_id: "HUMA M1110", value: "HUMA M1999" }], mode);
    check("a failed read (" + mode + ") shows the plain-words notice",
      alerts.some((a) => /Honors pairs could not be read/.test(a) && /no merge/.test(a)));
    check("a failed read (" + mode + ") offers no group, the unrelated one included",
      !/\d of 2/.test(r.doc.body.textContent) && !/\d of 2/.test(txt(r.panel)));
  }
  // 6. The read succeeds with no rows: no notice, every group offered (the fail-closed path is the error alone).
  alerts.length = 0;
  r = await open([pairOnly, ceramics], rows, []);
  check("a read that succeeds with no rows gives no notice", !alerts.some((a) => /Honors pairs/.test(a)));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length && results.length > 0 ? 0 : 1);
})();
