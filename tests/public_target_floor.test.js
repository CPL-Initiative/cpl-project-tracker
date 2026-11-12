// The public pages' controls clear the 24px target floor with a pixel to spare (S641, 2026-11-12).
//
// The CPL Library's accessibility check (library.js, checkDoc) found 8 links or buttons under
// 24 by 24px on DSP Credit Starting Points Version 3 ("Links" 43 by 23.9px), and Sam asked for the
// fix from the card (cpl_library request of 2026-11-11T15:30Z). Every one was sized at exactly
// min-height:24px: the public header's Links, Light and Dark, and the five Request Adopt links in
// the agency visual's tables. At a browser zoom of 90% or 133% (or a display scaled to match), layout
// rounds a 24px box down to the device pixel, so it measures 23.98 and both that check and WCAG 2.2's
// 24 by 24 count it short. Measured in Chromium with --force-device-scale-factor: 8 under at 0.9 and
// 1.333, 0 at 1, 0 once the floor is 25px. jsdom has no layout, so this guards the cause instead: no
// control rule in the shared sources the public pieces are built from may set a floor under 25px.
//
// The sources live in the vault (CPLBrain/04-projects/cpl-initiative): the public header that every
// public piece carries, the agency visual's builder, and ELL IET's tab script, which DSP imports.
// Found through CPL_VAULT_ROOT or ../CPLBrain, as scripts/check_generated.sh finds it; with no vault
// beside the tracker the checks print NOT RUN (CI has no vault), and a session holding it runs them.
// Run from repo root: `CPL_VAULT_ROOT=/path/to/CPLBrain node tests/public_target_floor.test.js`.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const vault = [process.env.CPL_VAULT_ROOT, path.join(ROOT, "..", "CPLBrain"), path.join(ROOT, "..", "COG-second-brain")]
  .filter(Boolean).find((v) => fs.existsSync(path.join(v, "04-projects", "cpl-initiative", "public-header", "header.html")));

// A rule is a control rule when its selector ends at a link, a button or a tab.
const CONTROL = /(^|[\s,>+~])(a|button)(\[[^\]]*\]|:[\w-]+(\([^)]*\))?)*\s*$|\[role="tab"\]|\.cplh-word|\.cplh-logo/;
function floors(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const sels = m[1].trim().split(",").map((s) => s.trim()).filter(Boolean);
    if (!sels.some((s) => CONTROL.test(s))) continue;
    const body = m[2];
    for (const prop of ["min-height", "min-width"]) {
      const v = body.match(new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([\\d.]+)px"));
      if (v) out.push({ sel: m[1].trim().replace(/\s+/g, " ").slice(-60), prop, px: +v[1] });
    }
  }
  return out;
}

const SOURCES = [
  ["public-header/header.html", "the public header (Links, Light, Dark, the logo, the links in its list)"],
  ["agency-visual/build.py", "the agency visual's tables (Request Adopt and every table link)"],
  ["ell-iet/make_tabs.py", "the tab script DSP imports (the tabs, band lists, contacts and glance links)"],
];

if (!vault) {
  console.log("NOT RUN  public_target_floor: the vault is not beside the tracker (attach CPLBrain, or set CPL_VAULT_ROOT)");
} else {
  const base = path.join(vault, "04-projects", "cpl-initiative");
  for (const [rel, what] of SOURCES) {
    const css = fs.readFileSync(path.join(base, rel), "utf8");
    const f = floors(css);
    const short = f.filter((x) => x.px < 25);
    check(`${rel}: ⭐ ${what} set their target floor at 25px or more, never exactly 24`,
      f.length > 0 && short.length === 0,
      f.length ? short.map((x) => `${x.sel} ${x.prop}:${x.px}px`).join(" · ") : "no control floor found: the selector match broke");
  }
  // The DSP piece built from them carries the same floors (the source a Library record's rebuild_from names).
  const built = path.join(base, "dsp-training", "20261020_DSP_Credit_Starting_Points_3.html");
  if (fs.existsSync(built)) {
    const f = floors(fs.readFileSync(built, "utf8"));
    const short = f.filter((x) => x.px < 25);
    check("dsp-training Version 3: ⭐ the built page's control floors are all 25px or more", f.length >= 5 && short.length === 0,
      short.map((x) => `${x.sel} ${x.prop}:${x.px}px`).join(" · ") || ("found " + f.length));
  }
}

// The matcher itself, on a fixed sample, so a broken regex cannot pass the checks above by finding nothing.
{
  const f = floors(".x{color:red}\ntd a{display:inline-block;min-height:24px}\n.tabs [role=\"tab\"]{min-height:25px}\np{min-height:10px}");
  check("the matcher finds a link's and a tab's floor and skips a paragraph",
    f.length === 2 && f[0].px === 24 && f[1].px === 25, JSON.stringify(f));
}

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\npublic_target_floor.test.js: ${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
