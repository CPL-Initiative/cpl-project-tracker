// PR-5b/2 (Session 107) — the confirm-merge lane.
//
// A saved/typed unified title that EXACTLY matches a DIFFERENT credential's
// key is a merge in the making: the rename dry-run queues it as a collision
// until the curator explicitly confirms. This suite guards:
//   1. Save-time detection in the issuer lane — the confirm dialog fires and
//      an accepted save writes unified_title_merge_confirm BESIDE the
//      unified_title_override (declined → nothing written).
//   2. The pending-merges strip — already-saved colliding renames (Sam's six
//      2026-07-08 AoJ convergences) surface with ✓ Confirm merge, which
//      writes the confirm row; a re-title to a non-colliding target writes
//      the new override and CLEARS a stale confirm instead.
//   3. A collision whose confirm already matches stays OUT of the strip.
//
// Run from repo root: `npm test` (or `node tests/cer_merge_confirm.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const TARGET = "Community and the Justice System";

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  // the EXISTING credential a rename collides with (has an issuer — never in the lane)
  { ut: TARGET, raw_count: 2, conf_title: 0.9,
    issuer: "California Community Colleges",
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // null-issuer lane row the curator will retitle INTO the collision
  { ut: "Administration of Justice 067", raw_count: 1, conf_title: 0.6, issuer: null,
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // already-saved colliding rename (the strip case) — carries an issuer, so
  // it is NOT in the issuer queue; only the strip can confirm it
  { ut: "Administration of Justice — Community and the Justice System", raw_count: 1,
    conf_title: 0.6, issuer: "California Community Colleges",
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  // colliding rename whose confirm ALREADY matches — must stay out of the strip
  { ut: "Administration of Justice 075", raw_count: 1, conf_title: 0.6,
    issuer: "California Community Colleges",
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
  { ut: "Introduction to Corrections", raw_count: 1, conf_title: 0.9,
    issuer: "California Community Colleges",
    cpl_types: ["Credit By Exam"], audit_tags: {}, audit_tag_total: 0, articulations: [] },
] };

// kb_curation overlay rows returned by the GET stub: one unconfirmed
// colliding rename (strip pending, with a STALE confirm naming a different
// target) + one confirmed colliding rename (strip-filtered).
const overlayRows = [
  { course_id: "_CREDENTIAL_REVIEW::Administration of Justice — Community and the Justice System",
    field: "unified_title_override", value: TARGET,
    reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-08T16:45:00Z" },
  { course_id: "_CREDENTIAL_REVIEW::Administration of Justice — Community and the Justice System",
    field: "unified_title_merge_confirm", value: "A Different Stale Target",
    reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-08T16:45:00Z" },
  { course_id: "_CREDENTIAL_REVIEW::Administration of Justice 075",
    field: "unified_title_override", value: "Introduction to Corrections",
    reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-08T16:45:00Z" },
  { course_id: "_CREDENTIAL_REVIEW::Administration of Justice 075",
    field: "unified_title_merge_confirm", value: "Introduction to Corrections",
    reviewer_email: "map@rccd.edu", reviewed_at: "2026-07-08T16:46:00Z" },
];

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  const log = { writes: [], confirms: [] };
  window.confirm = function (m) {
    log.confirms.push(m);
    return opts.confirmAnswer !== false;
  };
  window.fetch = function (url, o) {
    url = String(url); const method = (o && o.method) || "GET";
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200,
      json: () => Promise.resolve(body),
    });
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: [] });
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    if (method === "POST" || method === "DELETE") {
      log.writes.push({ url, method, body: o.body && JSON.parse(o.body) });
      return respond([], method === "POST" ? 201 : 204);
    }
    if (url.indexOf("/rest/v1/kb_curation") >= 0) return respond(overlayRows);
    return respond([]);
  };
  const jwt = "eyJhbGciOiJIUzI1NiJ9."
    + Buffer.from(JSON.stringify({ email: "map@rccd.edu" })).toString("base64") + ".x";
  window.sessionStorage.setItem("cpl_sb", JSON.stringify({
    access_token: jwt, refresh_token: "rt", email: "map@rccd.edu",
    exp: Date.now() + 3600000 }));
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rowFor = (doc, name) => Array.from(doc.querySelectorAll(".cr-ni-row"))
  .find((r) => txt(r.querySelector(".cr-wl-rawt")).indexOf(name) >= 0);

(async () => {
  // ── A. Save-time collision confirm in the issuer lane ──
  {
    const { window, log } = makeDom({});
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);

    const laneRow = rowFor(doc, "Administration of Justice 067");
    check("lane: the null-issuer AoJ row renders", !!laneRow);

    laneRow.querySelector(".cr-ni-title-input").value = TARGET;
    laneRow.querySelector(".cr-ni-input").value = "California Community Colleges";
    laneRow.querySelector(".cr-ni-save").click();
    await sleep(120);

    check("save: the merge dialog fired and names both credentials",
      log.confirms.length === 1
      && log.confirms[0].indexOf(TARGET) >= 0
      && log.confirms[0].indexOf("CONFIRMS A MERGE") >= 0);
    const bodies = log.writes.map((w) => w.body).filter(Boolean);
    check("save: unified_title_override written with the colliding title",
      bodies.some((b) => b.field === "unified_title_override" && b.value === TARGET
        && b.course_id === "_CREDENTIAL_REVIEW::Administration of Justice 067"));
    check("save: unified_title_merge_confirm written naming the SAME target",
      bodies.some((b) => b.field === "unified_title_merge_confirm" && b.value === TARGET
        && b.course_id === "_CREDENTIAL_REVIEW::Administration of Justice 067"));
    check("save: row flips ✓ in place", laneRow.className.indexOf("cr-wl-done") >= 0);
  }

  // ── B. Declined dialog aborts the save entirely ──
  {
    const { window, log } = makeDom({ confirmAnswer: false });
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const laneRow = rowFor(doc, "Administration of Justice 067");
    laneRow.querySelector(".cr-ni-title-input").value = TARGET;
    laneRow.querySelector(".cr-ni-input").value = "California Community Colleges";
    log.writes.length = 0;
    laneRow.querySelector(".cr-ni-save").click();
    await sleep(120);
    check("declined: nothing written", log.writes.length === 0);
    check("declined: Save stays armed",
      !laneRow.querySelector(".cr-ni-save").disabled);
  }

  // ── C. The pending-merges strip ──
  {
    const { window, log } = makeDom({});
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);

    const title = doc.querySelector(".cr-mg-title");
    check("strip: renders with exactly the ONE unconfirmed collision",
      !!title && /Merge confirmations \(1\)/.test(txt(title)));
    const rows = Array.from(doc.querySelectorAll(".cr-mg-row"));
    check("strip: the confirmed AoJ-075 row is filtered out",
      rows.length === 1
      && txt(rows[0].querySelector(".cr-mg-old")).indexOf("— Community and the Justice System") >= 0);
    const inp = rows[0].querySelector(".cr-mg-input");
    check("strip: input prefilled with the colliding target", inp.value === TARGET);

    // ✓ Confirm merge — writes the confirm row (accepting the dialog).
    log.writes.length = 0;
    rows[0].querySelector(".cr-mg-confirm").click();
    await sleep(120);
    const bodies = log.writes.map((w) => w.body).filter(Boolean);
    check("strip confirm: unified_title_merge_confirm written naming the target",
      bodies.some((b) => b.field === "unified_title_merge_confirm" && b.value === TARGET));
    check("strip confirm: row flips ✓ merge confirmed",
      rows[0].className.indexOf("cr-wl-done") >= 0
      && /merge confirmed/.test(txt(rows[0].querySelector(".cr-mg-confirm"))));
  }

  // ── D. Re-title instead: clears the stale confirm ──
  {
    const { window, log } = makeDom({});
    const doc = window.document;
    await sleep(120);
    doc.querySelector(".cr-triage-btn").click();
    await sleep(120);
    const row = doc.querySelector(".cr-mg-row");
    const inp = row.querySelector(".cr-mg-input");
    const btn = row.querySelector(".cr-mg-confirm");
    inp.value = "Community and the Justice System (Peace Officer Track)";
    inp.dispatchEvent(new window.Event("input", { bubbles: true }));
    check("re-title: button relabels to Save re-title", /Save re-title/.test(txt(btn)));
    log.writes.length = 0;
    btn.click();
    await sleep(120);
    check("re-title: no merge dialog for a non-colliding title",
      log.confirms.length === 0);
    const posts = log.writes.filter((w) => w.method === "POST").map((w) => w.body);
    check("re-title: the new unified_title_override written",
      posts.some((b) => b.field === "unified_title_override"
        && b.value === "Community and the Justice System (Peace Officer Track)"));
    check("re-title: the STALE merge_confirm row deleted",
      log.writes.some((w) => w.method === "DELETE"
        && w.url.indexOf("unified_title_merge_confirm") >= 0));
    check("re-title: row flips ✓ re-titled", /re-titled/.test(txt(btn)));
  }

  const failed = results.filter(([, ok]) => !ok);
  results.forEach(([name, ok]) => console.log((ok ? "  ✓ " : "  ✗ ") + name));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exit(1);
})();
