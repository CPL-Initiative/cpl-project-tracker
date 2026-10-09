/* The Dashboard tab's first UI pass (S352): the color half.
 *
 * Measured with `npm run a11y -- cobi:dashboard cobi-dark:dashboard`: 16 contrast
 * findings in light and 10 in dark before, none after. These are text checks,
 * because jsdom computes no color; each one fails with its fix reverted.
 *
 *   - The "How this is calculated" panels painted white-alpha text on the opaque
 *     card: 1:1 on the two trend cards and the seven exhibit cards in light.
 *   - College Activity wrote its tier, rate and last-activity inks as literal
 *     hex, which kept their light values in dark (#2C601A on #1E1E1C, 2.22:1),
 *     and its amber (#FF9800, 2.16:1) and grays failed in light too.
 *   - The KPI section header dimmed ink with opacity (4.33:1 and below).
 *   - The exhibit table head put mustard on the muted fill (4.25:1).
 *   - The workplan chart's legend notes used #888 and #aaa.
 *
 * Rule 1: the generator owns the injected CSS and the emitted sections, so each
 * check reads the generator (or its emitted template) AND both HTMLs.
 */
const fs = require("fs");
const read = (f) => fs.readFileSync(f, "utf8");
const GEN = read("excel_to_dashboard.py");
const HTMLS = ["index.html", "CPL_Dashboard.html"].map((f) => [f, read(f)]);
const CA = read("college_activity.js");
const TPL = read("college_activity_template.html");

let pass = 0, total = 0;
function check(name, cond, why) {
  total++; if (cond) pass++;
  console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  — " + (why || "")));
}
const block = (src) => {
  const m = src.match(/\/\* ═══ Collapsible Algorithm Descriptions ═══ \*\/[\s\S]*?\/\* ═══ End Collapsible Algorithm Descriptions ═══ \*\//);
  return m ? m[0] : "";
};

// ── the algo panel ──
const genAlgo = block(GEN);
check("the generator's algo block reads no white-alpha or mustard-alpha ink",
  !!genAlgo && !/rgba\(255,\s*255,\s*255|rgba\(227,\s*179,\s*65/.test(genAlgo));
check("its summary, body and meta take theme tokens",
  /\.algo-details summary \{[^}]*color: var\(--text-muted\)/.test(genAlgo) &&
  /\.algo-details \.algo-body \{[^}]*color: var\(--text-body\)/.test(genAlgo) &&
  /\.algo-details \.algo-meta \{[^}]*color: var\(--text-muted\)/.test(genAlgo));
for (const [f, h] of HTMLS) {
  check(`${f} carries the generator's algo block byte for byte`, block(h) === genAlgo);
}

// ── College Activity ──
const caCode = CA.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
check("college_activity.js paints no literal hex", !/#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?\b/.test(caCode),
  (caCode.match(/#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?\b/g) || []).join(" "));
check("its five inks are First Light tokens",
  /GOLD = 'var\(--mustard-text\)', GREEN = 'var\(--hunter\)', AMBER = 'var\(--mustard-text\)', BLUE = 'var\(--cobalt\)', RED = 'var\(--crimson\)'/.test(CA));
check("the export toast is hunter with --on-accent text", /background:'var\(--hunter\)', color:'var\(--on-accent\)'/.test(CA));
for (const [f, h] of [["college_activity_template.html", TPL], ...HTMLS]) {
  check(`${f}: the 31–90d legend reads --mustard-text`, /color:var\(--mustard-text\);margin-left:0\.3rem;">● 31–90d/.test(h));
}

// ── the KPI section header, the exhibit table head, the chart legend ──
for (const [f, h] of HTMLS) {
  const hdr = (h.match(/\.kpi-section-header \.kpi-(section-title|section-updated|toggle-arrow) \{[^}]*\}/g) || []);
  check(`${f}: the KPI section header's three labels are --text-muted at full opacity`,
    hdr.length === 3 && hdr.every((r) => /color: var\(--text-muted\)/.test(r) && !/opacity\s*:/.test(r)));
}
for (const [f, src] of [["excel_to_dashboard.py", GEN], ...HTMLS]) {
  check(`${f}: the exhibit table head sits on --surface-subtle`,
    /\.exhibit-table th \{[^}]*background: var\(--surface-subtle\);\s*color: var\(--mustard-text\)/.test(src));
  check(`${f}: the chart legend notes read --text-muted`,
    /<p style="color:var\(--text-muted\);[^"]*">Solid lines = actuals/.test(src) &&
    /<span style="color:var\(--text-muted\);">&mdash; Solid = actual/.test(src));
}

console.log("\n" + (pass === total ? "All " + total + " checks passed" : (total - pass) + " FAILED"));
process.exit(pass === total ? 0 : 1);
