// SkyView on First Light: every color a token, and the ink on a filled control
// follows the theme (S351, the checkpoint's UI pass).
//
// The pass found SkyView clean on AA at every route `npm run a11y -- skyview`
// measures, and found three faults no route reaches, because they paint only on
// hover or inside the shut More panel:
//   (a) .mlist .mv:hover and .mlist .putback:hover set `color:#fff` on
//       var(--cobalt), and the Night | Day word pressed in the More panel set it
//       on var(--seal-blue). The dark canvas makes both of those #7DA1D4, so
//       each read white on light blue at 2.65:1. var(--on-accent) is #fff by day
//       and #141413 at night (6.97:1).
//   (b) The four status chips (flag, gen, ok, cid) carried raw hex grounds and
//       edges, and dark repainted them with four component rules. CLAUDE.md:
//       "Dark is not license to invent a color: add the role to the dark :root,
//       never a component rule there." They are role tokens now, in the light
//       :root and in body.u-dark.
//
// The CSS lives in the template, prototype/ccr_atlas_v1.html; the served
// prototype/skyview.html is built from it (skyview_built_from_source_test.py).
//
// Run from repo root: `npm test` (or `node tests/ccr_skyview_first_light.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const html = fs.readFileSync("prototype/ccr_atlas_v1.html", "utf8");
const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [])
  .map((b) => b.replace(/^<style[^>]*>|<\/style>$/g, "")).join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
const rule = (sel) => rules.find((r) => r.sel === sel);
const decl = (r, prop) => {
  const m = r && r.body.match(new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([^;]+)"));
  return m ? m[1].trim() : null;
};

check("the template's CSS was read", rules.length > 100);

// (b) no raw hex outside a token declaration or a var() fallback
const raw = [];
for (const r of rules) {
  for (const d of r.body.split(";")) {
    const t = d.trim();
    if (!t || t.startsWith("--")) continue;
    if (/#[0-9a-fA-F]{3,8}\b/.test(t.replace(/var\([^()]*\)/g, ""))) raw.push(r.sel + " { " + t + " }");
  }
}
check("no component rule carries a raw hex (" + raw.length + (raw.length ? ": " + raw.slice(0, 3).join(" | ") : "") + ")",
  raw.length === 0);

const ROLES = ["flag", "gen", "ok", "cid"];
const block = (re) => { const m = css.match(re); return m ? m[1] : ""; };
const light = rules.filter((r) => r.sel === ":root").map((r) => r.body).join(";");
const dark = block(/body\.u-dark\s*\{([^{}]*)\}/);
for (const k of ROLES) {
  check(".chip." + k + " reads its ground and edge from tokens",
    decl(rule(".chip." + k), "background") === "var(--chip-" + k + ")" &&
    decl(rule(".chip." + k), "border-color") === "var(--chip-" + k + "-edge)");
  check("--chip-" + k + " and its edge are defined by day and at night",
    new RegExp("--chip-" + k + "\\s*:").test(light) && new RegExp("--chip-" + k + "-edge\\s*:").test(light) &&
    new RegExp("--chip-" + k + "\\s*:").test(dark) && new RegExp("--chip-" + k + "-edge\\s*:").test(dark));
}
check("dark repaints no chip with a component rule", !rules.some((r) => /^body\.u-dark \.chip\./.test(r.sel)));

// (a) the ink on a cobalt or seal-blue fill is the theme's on-accent
for (const sel of [".mlist .mv:hover", ".mlist .putback:hover", '.u-nd .u-more-t[aria-pressed="true"]']) {
  check(sel + " writes var(--on-accent) on its fill", decl(rule(sel), "color") === "var(--on-accent)");
}
check("--on-accent is light ink by day and dark ink at night",
  /--on-accent\s*:\s*#fff\b/i.test(light) && /--on-accent\s*:\s*#141413\b/i.test(dark));

let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS " : "FAIL ") + name); if (!ok) failed++; }
console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
