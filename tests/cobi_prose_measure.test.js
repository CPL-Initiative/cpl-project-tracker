// COBI prose measure — text runs the FULL width of whatever sits beside it.
//
// Sam, 2026-08-22, on the funding explainer and then for the whole of COBI:
// "this is a consistent formatting pattern you use — where you make text widths
// short for readability but it looks awkward when set against the full width
// items. I prefer if you either extend text widths the full extent OR use two
// columns to preserve readability." Prose that stops ~74ch short of the
// full-width table beside it reads as a mistake, not as a reading aid.
//
// The rule is a TOKEN (`--cpl-measure`, declared in both mirrored HTMLs), not 39
// hardcoded values, so it is one lever: set it to a ch value to restore a measure
// everywhere, or move the tabs to columns instead. Every use carries the `,none`
// fallback because most of these rules are injected by a tab's own JS, which must
// still behave on a surface that never declared the token (cpl_funding_public.html
// is exactly that case).
//
// ⚠️ THE THRESHOLD IS THE WHOLE POINT. A cap below ~55ch is LAYOUT, not a reading
// measure — cell truncation (.cs-variants 42ch), a raw-value column (.cr-wl-raw
// 42ch), a monospace context strip (46ch), a badge (9ch), a deliberately short
// hero lede (.op-hero .op-lead 44ch). Widening those would break the layouts this
// change is not about, so Part C pins a sample of them: a future blanket sweep
// that eats them fails here.
//
// Run from repo root: `npm test` (or `node tests/cobi_prose_measure.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTMLS = ["CPL_Dashboard.html", "index.html"];
// Every file that carried a prose measure before the 2026-08-22 sweep.
const SWEPT = HTMLS.concat([
  "budget_ledger.js", "cip_crosswalk.js", "college_identity.js", "cpl_chat.js",
  "cpl_funding_public.html", "cpl_memory.js", "cr_reference.js",
  "credential_reference.js", "first_light.js", "gr_priorities.js",
  "map_cleanup_views.js", "nc_learning_partners.js", "our_process.js",
  "raci.js", "team_phrases.js", "tmc_builder.js",
]);
const src = {};
for (const f of SWEPT) src[f] = fs.readFileSync(f, "utf8");

// ── Part A — the token exists, in both mirrored HTMLs (Rule 4) ──
check("Rule 4: CPL_Dashboard.html === index.html",
  src["CPL_Dashboard.html"] === src["index.html"]);
for (const h of HTMLS) {
  check(h + " declares --cpl-measure on :root",
    /:root\s*\{[\s\S]{0,1200}?--cpl-measure:\s*none;/.test(src[h]));
}
check("the token's rationale names Sam and the date, so the next session can find the ruling",
  /full width format rule on throughout COBI/.test(src["CPL_Dashboard.html"]) &&
  /2026-08-22/.test(src["CPL_Dashboard.html"]));

// ── Part B — no prose-scale measure survives anywhere in the swept set ──
{
  const offenders = [];
  for (const f of SWEPT) {
    const re = /max-width:\s*([0-9.]+)ch/g;
    let m;
    while ((m = re.exec(src[f]))) {
      if (parseFloat(m[1]) >= 55) offenders.push(f + " → " + m[0]);
    }
  }
  check("no prose-scale (>=55ch) hardcoded measure remains: " +
    (offenders.length ? offenders.join(", ") : "none"), offenders.length === 0);
}
{
  // A px-based prose cap is the same defect wearing different units. These four
  // tab intro paragraphs were 880px/760px before the sweep.
  const pxProse = [
    ["CPL_Dashboard.html", /<p style="margin: 0 0 14px 0;[^"]*max-width:\s*\d+px/],
    ["raci.js",        /\.raci-intro p\{[^}]*max-width:\s*\d+px/],
    ["tmc_builder.js", /\.tmc-intro\{[^}]*max-width:\s*\d+px/],
    ["team_phrases.js", /\.tphx-intro\{[^}]*max-width:\s*\d+px/],
  ];
  for (const [f, re] of pxProse) {
    check(f + ": the tab intro prose carries no px cap either", !re.test(src[f]));
  }
}
{
  // Most of these rules ship from a tab's JS onto surfaces that may not declare
  // the token. Without the fallback the declaration is invalid and the cap that
  // WAS there silently comes back as "no max-width" — right by accident here,
  // wrong the day the token becomes a ch value again.
  const bare = [];
  for (const f of SWEPT) {
    const re = /var\(--cpl-measure([^)]*)\)/g;
    let m;
    while ((m = re.exec(src[f]))) if (!/,\s*none/.test(m[1])) bare.push(f + " → " + m[0]);
  }
  check("every var(--cpl-measure) use carries the ,none fallback: " +
    (bare.length ? bare.join(", ") : "all do"), bare.length === 0);
  check("the sweep actually reached every file it claims to (each has >=1 use)",
    SWEPT.every((f) => /var\(--cpl-measure/.test(src[f])));
}

// ── Part C — the narrow LAYOUT caps are not prose and must survive ──
{
  const layout = [
    ["CPL_Dashboard.html", /\.cs-variants\s*\{[^}]*max-width:\s*42ch/, ".cs-variants (a table cell) stays 42ch"],
    ["credential_reference.js", /\.cr-wl-raw\{max-width:42ch;\}/, ".cr-wl-raw (a raw-value column) stays 42ch"],
    ["credential_reference.js", /max-width:\s*9ch/, "the 9ch badge cap survives"],
    ["our_process.js", /\.op-hero \.op-lead \{ max-width:44ch; \}/, ".op-hero .op-lead (a short hero lede, by design) stays 44ch"],
  ];
  for (const [f, re, name] of layout) check(name, re.test(src[f]));
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
