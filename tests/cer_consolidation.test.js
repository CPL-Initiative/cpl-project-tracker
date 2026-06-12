// Tests for the CER identity consolidation (2026-06-04): near-duplicate common-
// course identities (the same course minted as separate single-college M-IDs,
// differing only by level/format title wording — "EMT" / "EMT Academy" / "EMT
// I" / "EMT Training" …) are FOLDED into one row by the producer
// (_consolidate_arts), surfaced with a "⛓ N variants" badge. C-ID/CCN anchors
// and genuine sequences (Calculus I vs II) are NEVER folded.
//
// Synthetic fixture guards the CONSUMER rendering; the real EMT Certification
// baked row guards the producer end-to-end.
//
// Run from repo root: `npm test` (or `node tests/cer_consolidation.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const src = fs.readFileSync("credential_reference.js", "utf8");
function loadPayload(p) {
  let s = fs.readFileSync(p, "utf8");
  s = s.slice(s.indexOf("=") + 1).trim();
  if (s.endsWith(";")) s = s.slice(0, -1);
  return JSON.parse(s);
}
const payload = loadPayload("credential_reference_data.js");
const byUt = Object.fromEntries(payload.unified_titles.map((r) => [r.ut, r]));

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

// ── Synthetic credential: one CONSOLIDATED M-ID row (folds 2 members) + one
// plain row. Flags set explicitly to test the consumer independent of the
// producer. ──
const synthRow = {
  ut: "ZZZ Consolidation Test", raw_count: 3, audit_tags: {}, audit_tag_total: 0,
  n_articulation_lines: 3,
  articulations: [
    { cid: "EMST M1064", sys: "M-ID", title: "Emergency Medical Technician",
      disc: "Emergency Medical Technologies", top: "1250.00", merged: 3,
      members: [
        { cid: "EMST M1024", sys: "M-ID", title: "Emergency Medical Technician (Basic)" },
        { cid: "EMST M1054", sys: "M-ID", title: "Emergency Medical Technician I" },
      ],
      local: [
        { subj: "EMT", num: "100", t: "Emergency Medical Technician", u: 8, colleges: ["City College of San Francisco"] },
        { subj: "EMS", num: "95", t: "Emergency Medical Technician (Basic)", u: 7, colleges: ["Napa Valley College"] },
      ] },
    { cid: "EMST M1061", sys: "M-ID", title: "Emergency Medical Technician Refresher",
      disc: "Emergency Medical Technologies", top: "1250.00",
      local: [{ subj: "EMS", num: "161", t: "Emergency Medical Technician Refresher", u: 1.5, colleges: ["Palo Verde College"] }] },
  ],
};
const emt = byUt["EMT Certification"];
const fixtureRows = emt ? [synthRow, emt] : [synthRow];

const html = `<!DOCTYPE html><html><head></head><body>
<div id="tab-credential-reference">
  <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
</div>
<script>window.CPL_CREDENTIAL_REFERENCE = ${JSON.stringify({
  _generated_at: payload._generated_at, top_categories: payload.top_categories,
  unified_titles: fixtureRows,
})};</script>
</body></html>`;

const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
const { window } = dom;
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

function expandBody(wrap, needle) {
  const tog = Array.from(wrap.querySelectorAll(".cr-title-toggle"))
    .find((b) => txt(b).indexOf(needle) >= 0);
  if (!tog) return null;
  tog.click();
  const trRow = Array.from(wrap.querySelectorAll("tr.cr-row"))
    .find((tr) => txt(tr).indexOf(needle) >= 0);
  const sib = trRow && trRow.nextElementSibling;
  return (sib && sib.classList && sib.classList.contains("cr-expanded"))
    ? sib.querySelector(".cr-expanded-body") : null;
}

setTimeout(function () {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");

  // ── Synthetic consumer checks ──
  const body = expandBody(wrap, "ZZZ Consolidation Test");
  check("synthetic row expanded", !!body);
  if (body) {
    const mainTbl = body.querySelector("table.cr-arts-table:not(.cr-bucket-table)");
    const rows = mainTbl ? mainTbl.querySelectorAll("tbody tr.cr-art-row") : [];
    check("two identity rows shown (consolidated + refresher)", rows.length === 2);

    const badge = body.querySelector(".cr-art-merged");
    check("⛓ merged badge rendered on the consolidated row", !!badge);
    check("badge reads '⛓ 3 variants'", !!badge && /⛓\s*3 variants/.test(txt(badge)));
    check("badge tooltip lists a folded member id", !!badge &&
      /EMST M1024/.test(badge.getAttribute("title") || "") &&
      /EMST M1054/.test(badge.getAttribute("title") || ""));
    check("badge tooltip points at the worklist", !!badge &&
      /worklist/i.test(badge.getAttribute("title") || ""));

    // The Refresher row must NOT carry a merged badge.
    const refresherRow = Array.from(rows).find((tr) => /Refresher/.test(txt(tr)));
    check("the distinct 'Refresher' row is NOT folded (no badge)",
      !!refresherRow && !refresherRow.querySelector(".cr-art-merged"));

    // Header count reflects the 2 consolidated rows, not the 3 raw identities.
    const h5 = Array.from(body.querySelectorAll("h5")).map(txt)
      .find((h) => /Common-course identities/.test(h));
    check("header count = 2 consolidated identities", !!h5 && /\(2 identities/.test(h5));

    // Both members' local courses surface under the consolidated row.
    const consRow = Array.from(rows).find((tr) => txt(tr).indexOf("EMST M1064") >= 0);
    check("consolidated row unions member local courses (SF + Napa)",
      !!consRow && /EMT\s*100/.test(txt(consRow)) && /EMS\s*95/.test(txt(consRow)));
  }

  // ── Real-data check: EMT Certification folded the EMT-Basic core ──
  if (emt) {
    const m = (emt.articulations || []).filter((a) => a.merged);
    check("EMT Certification has a consolidated identity in the baked payload", m.length >= 1);
    // Threshold history: ≥10 until the Session-46 statewide twin merge began
    // absorbing exact-twin M-IDs PHYSICALLY (EMST M1052 → M1064), which
    // legitimately shrinks the display-level fold count — the same
    // unification, moved upstream into the KB. Guard the mechanism, not a
    // high-water mark.
    const core = m.find((a) => a.cid === "EMST M1064");
    check("the EMT-Basic core folds ≥5 variants into EMST M1064",
      !!core && core.merged >= 5);
    // The genuinely-distinct sub-courses stay as their own rows (not folded).
    const ids = (emt.articulations || []).map((a) => a.cid);
    check("EMT 'Refresher' (M1061) stays a distinct row", ids.indexOf("EMST M1061") >= 0);
    check("EMT 'Lab' (M1056) stays a distinct row", ids.indexOf("EMST M1056") >= 0);
    check("EMT card collapsed to fewer than 25 rows (was 29)",
      (emt.articulations || []).length < 25);
  } else {
    check("(EMT Certification absent from payload — skipped real-data checks)", true);
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}, 80);
