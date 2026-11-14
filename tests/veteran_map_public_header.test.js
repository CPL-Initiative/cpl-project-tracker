// The public veteran map carries the public header, and the embed does not (S651).
//
// Sam, 2026-10-21: a public page carries the public header: the CPL Initiative logo to the
// Chancellor's Office CPL page, the links out behind one Links word, and Light and Dark. The
// veteran map had none (S650 UI pass). veteran-sprint-map/build_selfcontained.py now writes it,
// and hides it under ?embed=1, where COBI's Military Partnerships frame shows the map bare.
//
// The failure modes this guards: a rebuild that drops the header or one of its links; a logo
// loaded from another host (the page loads nothing from the internet); the header painting in
// the embed (a second banner above COBI's own, pushing the map below the frame's fold); and the
// tracker's copy drifting from the vault's header.html, its one source (checked only when the
// vault sits beside the tracker; CI prints NOT RUN for that check).
//
// Run from repo root: `npm test` (or `node tests/veteran_map_public_header.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "veteran-sprint-map", "ca_cpl_map_selfcontained.html");
const html = fs.readFileSync(FILE, "utf8");
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail }); }

const START = "<!-- cpl-public-header:start", END = "<!-- cpl-public-header:end -->";
const CO_CPL = "https://www.cccco.edu/about-us/chancellors-office/divisions/educational-services-and-support/credit-for-prior-learning/";
const LINKS = {
  "The CPL Initiative": "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-initiative-overview/",
  "CPL Fact Sheet": "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/",
  "MAP": "https://map.rccd.edu/",
  "Find your college": "https://map.rccd.edu/cpllandingpages/",
  "MAP dashboard": "https://cpldashboardcccco.azurewebsites.net/insights/dashboard",
  "Credit for Being You": "https://creditforbeingyou.org/",
  "CPL Library": "https://cpl-initiative.github.io/cpl-project-tracker/library/",
  "Credential Catalog": "https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/",
};

// ── The built page's markup ──
const starts = html.split(START).length - 1, ends = html.split(END).length - 1;
check("the built page carries one public header block", starts === 1 && ends === 1, `starts=${starts} ends=${ends}`);
const block = starts === 1 ? html.slice(html.indexOf(START), html.indexOf(END)) : "";
check("the header comes before the page's <main>", block && html.indexOf(START) < html.indexOf("<main"), "no <main> after the header");
check("the skip link stays the first thing in the body", /<body>\s*<a class="skip"/.test(html), "skip link moved");

const dom = new JSDOM(html);
const doc = dom.window.document;
const hdr = doc.querySelector("header.cplh");
check("the header is the page's one banner", hdr && hdr.getAttribute("role") === "banner" && !hdr.closest("main")
  && doc.querySelectorAll("body > header").length === 1, "the map's own header must sit inside <main>");
const logo = hdr && hdr.querySelector("a.cplh-logo");
check("the logo links to the Chancellor's Office CPL page", logo && logo.getAttribute("href") === CO_CPL, logo && logo.getAttribute("href"));
const imgs = hdr ? [...hdr.querySelectorAll(".cplh-logo img")] : [];
check("the light and dark logos are embedded, loading nothing from another host",
  imgs.length === 2 && imgs.every((i) => /^data:image\/png;base64,/.test(i.getAttribute("src")) && i.getAttribute("alt")),
  imgs.map((i) => (i.getAttribute("src") || "").slice(0, 30)).join(" | "));
const anchors = hdr ? [...hdr.querySelectorAll(".cplh-nav a")] : [];
for (const [word, href] of Object.entries(LINKS)) {
  const a = anchors.find((x) => x.textContent.trim() === word);
  check(`Links lists ${word}`, a && a.getAttribute("href") === href && a.getAttribute("aria-describedby")
    && doc.getElementById(a.getAttribute("aria-describedby")), a ? a.getAttribute("href") : "missing");
}
const word = hdr && hdr.querySelector("button.cplh-word[data-cplh-links]");
check("Links is one word button that controls a hidden list", word && word.textContent.trim() === "Links"
  && word.getAttribute("aria-expanded") === "false" && doc.getElementById(word.getAttribute("aria-controls"))?.hasAttribute("hidden"), "");
const themes = hdr ? [...hdr.querySelectorAll("[data-cplh-theme]")].map((b) => b.textContent.trim()) : [];
check("the theme words are Light and Dark", themes.join(",") === "Light,Dark", themes.join(","));

// ── Its CSS: tokens only, the 25px public floor, hidden in the embed ──
const css = (block.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1].replace(/\/\*[\s\S]*?\*\//g, "");
check("the header's CSS uses First Light tokens, never a raw hex", css && !/#[0-9a-fA-F]{3,8}\b/.test(css), (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" "));
const mins = [...css.matchAll(/min-(?:height|width):\s*([\d.]+)px/g)].map((m) => +m[1]);
check("the header's controls keep the 25px public floor", mins.length >= 3 && mins.every((n) => n >= 25), mins.join(","));
check("the embed hides the header", /\.embed \.cplh\{display:none\}/.test(css), "no .embed .cplh{display:none} rule");

// ── Running the page's head script: the embed class is set before the body paints ──
function run(q) {
  const d = new JSDOM(html, { url: "https://cpl-initiative.github.io/cpl-project-tracker/veteran-sprint-map/ca_cpl_map_selfcontained.html" + q,
    runScripts: "outside-only", pretendToBeVisual: true });
  const s = d.window.document.querySelector("head script").textContent;
  d.window.eval(s);
  return d.window;
}
{
  const w = run("?embed=1");
  const de = w.document.documentElement;
  check("?embed=1 sets html.embed from the head script, so the header never paints there", de.classList.contains("embed"), de.className);
  const disp = w.getComputedStyle(w.document.querySelector(".cplh")).display;
  check("under ?embed=1 the header computes to display:none", disp === "none", "display=" + disp);
}
{
  const w = run("");
  const de = w.document.documentElement;
  check("the public page has no embed class and opens Light", !de.classList.contains("embed") && de.getAttribute("data-theme") === "light", de.className + " " + de.getAttribute("data-theme"));
  const disp = w.getComputedStyle(w.document.querySelector(".cplh")).display;
  check("on the public page the header shows", disp !== "none", "display=" + disp);
}

// ── The copy against its source, when the vault sits beside the tracker ──
const vault = [process.env.CPL_VAULT_ROOT, path.join(ROOT, "..", "CPLBrain"), path.join(ROOT, "..", "COG-second-brain")]
  .filter(Boolean).find((v) => fs.existsSync(path.join(v, "04-projects", "cpl-initiative", "public-header", "header.html")));
if (!vault) {
  console.log("NOT RUN  the copy against the vault's header.html (attach CPLBrain, or set CPL_VAULT_ROOT)");
} else {
  const src = fs.readFileSync(path.join(vault, "04-projects", "cpl-initiative", "public-header", "header.html"), "utf8");
  const pairs = (s) => [...s.matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m) => m[2] + " " + m[1]).join("\n");
  check("the Links list matches the vault's header.html, the one source", pairs(src) === pairs(block), "re-copy header.html into build_selfcontained.py");
  check("the logo's link matches the vault's header.html", src.includes('class="cplh-logo" href="' + CO_CPL + '"'), "the source's logo link changed");
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log((r.ok ? "  ok   " : "  FAIL ") + r.name + (r.ok ? "" : "  -- " + r.detail));
}
console.log(`\nveteran_map_public_header: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
