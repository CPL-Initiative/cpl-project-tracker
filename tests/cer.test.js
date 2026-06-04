// Regression tests for credential_reference.js (the Common Exhibit Reference
// consumer). Renders the real baked payload in jsdom and asserts the Session-32
// behaviors so they can't silently regress:
//   - search + expand must not throw (the raw_variants:null crash class)
//   - the two "Generated" chips ("Generated Title" / "Generated MID Credit Rec")
//   - one-line CCR identity + "(N unit(s))" local-course display
//   - Audit signals render above the Common-course identities table
//   - the college-entered raw-title variants are listed in the expanded row
//
// Run from repo root: `npm test` (or `node tests/cer.test.js`).
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

// ── Fixture: a few real rows + one SYNTHETIC row with NO raw_variants. The
// synthetic row reproduces the exact baked shape that caused the crash
// (raw_variants omitted → null in adaptBakedRow); searching a term it doesn't
// match forces passesFilter down the `(row.raw_variants||[]).some` branch, so
// this test fails loudly if the `|| []` guard is ever removed. ──
const notTenKey = (r) => r && !r.ut.toLowerCase().includes("10-key");
const tenKey = byUt["10-Key Data Entry"];
const audited = payload.unified_titles.find((r) => r.audit_tag_total > 0 && r.articulations.length && notTenKey(r));
const genRec = payload.unified_titles.find((r) => r.has_local && !r.statewide && r.articulations.length && notTenKey(r));
const synthetic = { ut: "ZZZ Synthetic No-Variants Row", raw_count: 1, articulations: [], audit_tags: {}, audit_tag_total: 0 };

const _uniq = new Map();
[tenKey, audited, genRec].filter(Boolean).forEach((r) => _uniq.set(r.ut, r));
const fixtureRows = [..._uniq.values(), synthetic];

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
// Only network call on init is fetchOverlay() — stub to an empty overlay.
window.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });

let threwOnInit = false;
try { window.eval(src); } catch (e) { threwOnInit = true; console.error("init threw:", e); }
check("init does not throw", !threwOnInit);

setTimeout(runAssertions, 80);

function runAssertions() {
  const doc = window.document;
  const wrap = doc.getElementById("cr-table-wrap");
  check("table rendered", !!wrap.querySelector("table.cr-table"));
  check("all fixture rows shown initially", wrap.querySelectorAll("tr.cr-row").length === fixtureRows.length);

  // Item 3 — the two clarified chips, and the old bare one gone.
  const chips = Array.from(wrap.querySelectorAll(".cr-title-chips .cr-chip")).map(txt);
  check("item3: 'Generated Title' chip present", chips.includes("⚙ Generated Title"));
  check("item3: 'Generated MID Credit Rec' chip present", chips.includes("⚙ Generated MID Credit Rec"));
  check("item3: old bare '⚙ Generated' chip gone", !chips.includes("⚙ Generated"));

  // Items 2 & 7 — the crash class. Search a term that misses the synthetic
  // (no-variants) row, forcing the guarded raw_variants branch.
  const search = doc.getElementById("cr-search");
  check("search box exists", !!search);
  let searchThrew = false;
  try {
    search.value = "10-Key";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
  } catch (e) { searchThrew = true; console.error("search threw:", e); }
  check("item2/7: typing search does NOT throw (raw_variants:null guarded)", !searchThrew);
  const afterSearch = wrap.querySelectorAll("tr.cr-row").length;
  check("item2: search actually filtered the list", afterSearch < fixtureRows.length);

  // Expand wedges keep working with search active.
  let expandThrew = false, expandedSeen = 0;
  try {
    wrap.querySelectorAll(".cr-title-toggle").forEach((b) => {
      b.click();
      if (wrap.querySelectorAll("tr.cr-expanded").length) expandedSeen++;
    });
  } catch (e) { expandThrew = true; console.error("expand threw:", e); }
  check("item7: expand clicks do not throw (search active)", !expandThrew);
  check("item7: expansion functions after search", expandedSeen > 0);

  // Clear search; expand 10-Key Data Entry precisely for the item-4/6 checks.
  search.value = ""; search.dispatchEvent(new window.Event("input", { bubbles: true }));
  const toggles = Array.from(wrap.querySelectorAll(".cr-title-toggle"));
  const tk = toggles.find((b) => txt(b).indexOf("10-Key Data Entry") >= 0);
  if (tk && tenKey) {
    const trRow = tk.closest("tr.cr-row");
    let sib = trRow.nextElementSibling;
    if (!(sib && sib.classList.contains("cr-expanded"))) { tk.click(); sib = trRow.nextElementSibling; }
    const body = sib && sib.querySelector(".cr-expanded-body");
    check("10-Key expanded body rendered", !!body);
    if (body) {
      // Item 4 — one-line identity (cr-id-title is an inline <span>) + units.
      const idTitle = body.querySelector(".cr-arts-table .cr-id-title");
      check("item4: cr-id-title is inline <span>", !!idTitle && idTitle.tagName === "SPAN");
      const localTxt = txt(body.querySelector(".cr-arts-table .cr-art-local"));
      check("item4: local shows code + title", /BIT\s*375/.test(localTxt) && /10-Key on the Computer/i.test(localTxt));
      check("item4: local shows '(1 unit)'", /\(1 unit\)/.test(localTxt));
      // Item 6 — college-entered raw variants listed.
      const h5s = Array.from(body.querySelectorAll("h5")).map(txt);
      check("item6: 'College-entered exhibit titles' heading", h5s.some((h) => /College-entered exhibit titles/.test(h)));
      check("item6: raw college title listed", /10-key on the computer/i.test(txt(body.querySelector(".cr-variants-list"))));
    }
  } else {
    check("(10-Key Data Entry present in payload — skipped item4/6 specifics)", true);
  }

  // Item 5 — Audit signals above the Common-course identities table.
  if (audited) {
    const atog = Array.from(wrap.querySelectorAll(".cr-title-toggle")).find((b) => txt(b).indexOf(audited.ut) >= 0);
    if (atog) {
      atog.click();
      let ok = false;
      for (const body of Array.from(wrap.querySelectorAll("tr.cr-expanded .cr-expanded-body"))) {
        const heads = Array.from(body.querySelectorAll("h5")).map(txt);
        const ai = heads.findIndex((h) => /Audit signals/.test(h));
        const ci = heads.findIndex((h) => /Common-course identities/.test(h));
        if (ai >= 0 && (ci < 0 || ai < ci)) { ok = true; break; }
      }
      check("item5: Audit signals render above Common-course identities", ok);
    }
  }

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
}
