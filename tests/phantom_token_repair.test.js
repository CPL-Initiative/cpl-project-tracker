/* Guards the open-asks dark-mode rulings (Sam, 2026-09-22, items 11-13).
 *
 * ⚠️ A PHANTOM TOKEN FAILS SILENTLY. An undefined custom property with no
 * fallback makes the declaration invalid at computed-value time: the browser
 * drops it and paints whatever was underneath. Nothing errors, nothing logs,
 * and jsdom returns zeroes for every rectangle — so `npm test` passed for
 * months while college_briefing.js's progress bar painted TRANSPARENT and its
 * accent borders did not draw at all. These are TEXT checks for that reason;
 * a rendering test cannot see it here.
 *
 * ⚠️ AND --text-faint WAS NEVER A DARK-MODE BUG. Measured 2026-09-22 against
 * the real token grounds, it fails AA in BOTH themes on every ground
 * (3.24:1 light on --paper, 4.23:1 dark), while --text-muted passes everywhere
 * (6.02-7.91:1). The lane recorded it as a dark finding only because that is
 * where the a11y pass ran. The token's own comment has always said
 * "decorative only — never essential text".
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

let pass = 0, total = 0;
function check(name, cond, why) {
  total++; if (cond) pass++;
  console.log((cond ? "  ok   " : "FAIL   ") + name + (cond ? "" : "  — " + (why || "")));
}

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

// Strip /* */ and // comments so prose ABOUT a phantom is not read as a use —
// college_briefing.js carries a comment block explaining the trap, and it must
// survive. Same lesson as the decision-sheet scan: match the surface that paints.
function code(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ── item 13: no bare phantom in anything COBI ships ──────────────────────────
const CONSUMERS = ["college_briefing.js", "cpl_funding.js", "map_users.js",
                   "governance.js", "cpl_theme.js"];
{
  const bare = [];
  for (const f of CONSUMERS) {
    for (const m of code(read(f)).matchAll(/var\(--(brand|link|text)\)/g)) {
      bare.push(f + " -> --" + m[1]);
    }
  }
  check("⭐ no bare var(--brand|--link|--text) in shipped consumer JS",
    bare.length === 0,
    bare.join(" | ") + " — COBI defines none of these, so a bare use paints nothing");
}

// ── item 12: Implementation Funding carries no --text-faint ──────────────────
{
  const faint = (code(read("cpl_funding.js")).match(/var\(--text-faint\b/g) || []).length;
  check("⭐ Implementation Funding paints no text in --text-faint",
    faint === 0,
    faint + " site(s) left; --text-faint is 3.24:1 light / 4.23:1 dark, below AA in BOTH themes");
}

// ── item 11: the step scale exists in LIGHT too, in BOTH HTMLs (Rule 4) ──────
{
  for (const f of ["CPL_Dashboard.html", "index.html"]) {
    const src = read(f);
    // ⚠️ SLICE ON THE FIRST :root BLOCK, not on the first mention of a theme.
    // A comment about the theme script sits at line 19, ~50 lines ABOVE the
    // light :root, so searching for /prefers-color-scheme|data-theme/ cut the
    // light block away entirely and the check failed on a correct file.
    const start = src.indexOf(":root");
    const light = src.slice(start, src.indexOf("}", start));
    check(f + ": --surface-1 and --surface-2 are defined in the LIGHT root",
      /--surface-1:\s*#F7F5F1/i.test(light) && /--surface-2:\s*#ECE9E2/i.test(light),
      "dark-only left every light use falling to its own hardcoded tint");
  }
  check("⭐ CPL_Dashboard.html and index.html stay identical (Rule 4)",
    read("CPL_Dashboard.html") === read("index.html"),
    "the workflow copies one to the other; editing only one is silently undone");
}

// ── the values stay ALIASES, never new colors ────────────────────────────────
{
  const src = read("CPL_Dashboard.html");
  const grab = (tok) => {
    const m = [...src.matchAll(new RegExp("--" + tok + ":\\s*(#[0-9A-Fa-f]{6})", "g"))];
    return m.map((x) => x[1].toUpperCase());
  };
  const s1 = grab("surface-1"), sub = grab("surface-subtle");
  const s2 = grab("surface-2"), mut = grab("surface-muted");
  check("⭐ --surface-1/2 alias --surface-subtle/muted in BOTH themes",
    s1.length && sub.length && s1.every((v, i) => v === sub[i]) &&
    s2.length && mut.length && s2.every((v, i) => v === mut[i]),
    JSON.stringify({ s1, sub, s2, mut })
    + " — a step scale that drifts from the roles it names is a second palette");
}

console.log("\n" + pass + "/" + total + " checks passed");
process.exit(pass === total ? 0 : 1);
