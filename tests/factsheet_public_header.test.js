// The public Fact Sheet carries the public header (S653b).
//
// Sam, 2026-10-21: a public page carries the public header: the CPL Initiative logo to the
// Chancellor's Office CPL page, the links out behind one Links word, and Light and Dark. The
// Fact Sheet had none. fact-sheet/index.html is a static page (no generator writes it; the daily
// run only builds statewide_recs.js and statewide_catalog.json beside it), so the header lives in
// the page itself, between the skip link and the masthead. COBI opens the Fact Sheet in a new tab
// and never frames it, so there is no embed to hide it in.
//
// The failure modes this guards: an edit that drops the header or one of its links; a second
// banner (the masthead was a <header> and is now a <div>, so the public header is the page's one
// banner); a raw hex or a control under the 25px public floor; a logo loaded from another host or
// at the 1115px size; the header printing on paper; the theme words failing to set cpl_theme; and
// this copy drifting from the veteran map's and from the vault's header.html, its one source
// (the vault check runs only when the vault sits beside the tracker; CI prints NOT RUN).
//
// Run from repo root: `npm test` (or `node tests/factsheet_public_header.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const FILE = path.join(ROOT, "fact-sheet", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const css = fs.readFileSync(path.join(ROOT, "fact-sheet", "factsheet.css"), "utf8");
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

// ── The page's markup ──
const starts = html.split(START).length - 1, ends = html.split(END).length - 1;
check("the Fact Sheet carries one public header block", starts === 1 && ends === 1, `starts=${starts} ends=${ends}`);
const block = starts === 1 ? html.slice(html.indexOf(START), html.indexOf(END)) : "";
check("the header comes before the masthead and the page's <main>",
  block && html.indexOf(START) < html.indexOf('class="masthead"') && html.indexOf(START) < html.indexOf("<main"), "order");
check("the skip link stays the first thing in the body", /<body>\s*(<!--[\s\S]*?-->\s*)*<a class="skip-link"/.test(html), "skip link moved");
check("the public page names no vault path", !/CPLBrain|COG-second-brain/.test(html), "a comment names the vault");

const dom = new JSDOM(html);
const doc = dom.window.document;
const hdr = doc.querySelector("header.cplh");
const banners = [...doc.querySelectorAll("body > header, [role=banner]")];
check("the public header is the page's one banner", hdr && hdr.getAttribute("role") === "banner" && banners.length === 1
  && banners[0] === hdr, banners.map((b) => b.className).join(","));
check("the masthead keeps its class and its title, as a div", doc.querySelector("div.masthead h1")
  && /Fact Sheet/.test(doc.querySelector("div.masthead h1").textContent), "no div.masthead h1");
// One logo on the page, the CPL Initiative's, in the header (Sam, in session S653b, 2026-11-14:
// "Don't need the ccc logo added to the top of fact sheet. Leave masthead in." then "Confusion by
// me on masthead vs header. I just want the ccc Cpl back in and the ccc only logo out", and, shown
// three pictures, "Picture 2: CPL logo only"; cpl_memory sam-fact-sheet-no-header-logo-2026-11-14).
// The masthead holds no image and nothing loads the California Community Colleges-only logo.
//
// Then the masthead became the title alone (Sam, in session S653b, 2026-11-14, after picking
// Picture 2: "2 is right. Can you move all the buttons and map website link and update chip all
// into the header to clean up the title?"; cpl_memory sam-fact-sheet-controls-into-header-2026-11-14).
// The map link, the snapshot chip, Collapse all and Print or save moved whole into the header,
// between the logo and Links: the same elements and ids, so the page's scripts still find them.
// The header prints its logo, the map link and the chip on this page, so the masthead needs no
// print-only logo and paper shows one logo, the CPL Initiative's.
const mh = doc.querySelector("div.masthead");
const mhKids = mh ? [...mh.querySelectorAll("*")].map((e) => e.tagName.toLowerCase()) : [];
check("the masthead holds the title and nothing else: no image, link, button or chip",
  mh && mh.querySelectorAll("img, a, button, summary, details, #live-chip, [data-bind]").length === 0
  && mhKids.filter((t) => t === "h1").length === 1 && mh.textContent.trim() === mh.querySelector("h1").textContent.trim(),
  mhKids.join(","));
const page = doc.querySelector("header.cplh .cplh-in > .cplh-page");
const inHdr = (sel) => !!(page && page.querySelector(sel)) && doc.querySelectorAll(sel).length === 1;
check("the map link sits in the header's page group, its first item",
  page && page.firstElementChild && page.firstElementChild.tagName === "A"
  && page.firstElementChild.getAttribute("href") === "https://map.rccd.edu"
  && page.firstElementChild.textContent.trim() === "map.rccd.edu", "map link");
check("the snapshot chip sits in the header, the same element", inHdr("#live-chip.live-chip[role=status]") && inHdr("#live-chip-text"), "chip");
check("Collapse all sits in the header, the same button", inHdr("button.btn#btn-collapse-all")
  && doc.getElementById("btn-collapse-all").textContent.trim() === "Collapse all", "collapse");
check("Print or save sits in the header, its menu whole", inHdr("details.save-menu") && inHdr("#btn-print") && inHdr("#btn-word")
  && /Print or save/.test(page.querySelector("details.save-menu > summary").textContent), "print");
check("the hidden Curate button and the as-of label moved with them", inHdr("#btn-curate[hidden]")
  && page.querySelector('[data-bind="as_of_label"]') === doc.querySelector('[data-bind="as_of_label"]'), "curate");
const order = page ? [...doc.querySelector("header.cplh .cplh-in").children].map((e) => e.className) : [];
check("the bar runs logo, the page group, then Links and Theme", order.join(" ") === "cplh-logo cplh-page cplh-end", order.join(" "));
check("the page group is a named group", page && page.getAttribute("role") === "group" && !!page.getAttribute("aria-label"), "");
const pcss = (css.match(/@media print \{([\s\S]*)/) || [, ""])[1];
check("on paper the header prints its logo, the map link and the chip, and hides the controls",
  /header\.cplh \{ display: block;/.test(pcss)
  && /header\.cplh \.cplh-end, header\.cplh \.btn, header\.cplh \.save-menu \{ display: none !important; \}/.test(pcss)
  && /header\.cplh \.cplh-logo img\.cplh-light \{ display: block !important; \}/.test(pcss)
  && !/logo-print/.test(html + css), "print override");
check("nothing on the page loads the California Community Colleges-only logo", !/ccc-logo/.test(html) && !/ccc-logo/.test(css), "ccc-logo still referenced");
const logo = hdr && hdr.querySelector("a.cplh-logo");
check("the logo links to the Chancellor's Office CPL page", logo && logo.getAttribute("href") === CO_CPL, logo && logo.getAttribute("href"));

function pngWidth(file) {
  const b = fs.readFileSync(file);
  return b.slice(1, 4).toString() === "PNG" ? b.readUInt32BE(16) : -1;
}
const imgs = hdr ? [...hdr.querySelectorAll(".cplh-logo img")] : [];
const srcs = imgs.map((i) => i.getAttribute("src") || "");
check("the light and dark logos load from the tracker's sierra/ folder, nothing from another host",
  imgs.length === 2 && srcs.every((s) => /^\.\.\/sierra\/[\w-]+\.png$/.test(s)) && imgs.every((i) => i.getAttribute("alt")), srcs.join(" | "));
check("both logos exist at 480px (the 1115px copies cost about 55 KB more)",
  srcs.length === 2 && srcs.every((s) => { const f = path.join(ROOT, "fact-sheet", s); return fs.existsSync(f) && pngWidth(f) === 480; }),
  srcs.map((s) => { const f = path.join(ROOT, "fact-sheet", s); return fs.existsSync(f) ? pngWidth(f) : "missing"; }).join(","));

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

// ── Its CSS: tokens only, defined by the page, the 25px public floor, never printed ──
const hcss = (block.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1].replace(/\/\*[\s\S]*?\*\//g, "");
check("the header's CSS uses First Light tokens, never a raw hex", hcss && !/#[0-9a-fA-F]{3,8}\b/.test(hcss), (hcss.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" "));
const used = [...new Set([...hcss.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))];
const rootBlock = (css.match(/:root\s*\{([\s\S]*?)\n\}/) || [, ""])[1];
const missing = used.filter((t) => !new RegExp(t + "\\s*:").test(rootBlock));
check("every token the header reads is defined on the Fact Sheet's :root", used.length >= 8 && !missing.length, missing.join(" "));
const ALIAS = { "--cplh-bg": "--surface", "--cplh-line": "--border", "--cplh-fg": "--body", "--cplh-muted": "--muted", "--cplh-link": "--cobalt", "--cplh-strong": "--ink" };
const wrong = Object.entries(ALIAS).filter(([k, v]) => !new RegExp(k + "\\s*:\\s*var\\(" + v + "\\)").test(rootBlock));
check("the header's roles map onto the page's First Light tokens", !wrong.length, wrong.map((w) => w[0]).join(" "));
const darkBlock = (css.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\}/) || [, ""])[1];
check("the header's ground, ink, link and line follow the page's dark", ["--surface", "--ink", "--body", "--muted", "--cobalt", "--border"]
  .every((t) => new RegExp(t + "\\s*:").test(darkBlock)), "dark block");
const mins = [...hcss.matchAll(/min-(?:height|width):\s*([\d.]+)px/g)].map((m) => +m[1]);
check("the header's controls keep the 25px public floor", mins.length >= 3 && mins.every((n) => n >= 25), mins.join(","));
// The shared copy keeps its rule; factsheet.css's header.cplh outranks it for this page alone.
check("the shared copy keeps its print rule, which factsheet.css overrides here", /@media print\{\.cplh\{display:none\}\}/.test(hcss), "no print rule");

// ── Running the header's script: the theme words set data-theme and cpl_theme ──
{
  const d = new JSDOM(html, { url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/", runScripts: "outside-only", pretendToBeVisual: true });
  const w = d.window;
  const s = [...w.document.querySelectorAll("header.cplh ~ script")][0];
  w.eval(w.document.querySelector("head script").textContent);
  check("the page opens Light with no choice saved", w.document.documentElement.getAttribute("data-theme") === "light", w.document.documentElement.getAttribute("data-theme"));
  w.eval(s ? s.textContent : "");
  const dark = w.document.querySelector('[data-cplh-theme="dark"]');
  dark.click();
  check("Dark sets data-theme and remembers cpl_theme", w.document.documentElement.getAttribute("data-theme") === "dark"
    && w.localStorage.getItem("cpl_theme") === "dark" && dark.getAttribute("aria-pressed") === "true", w.localStorage.getItem("cpl_theme"));
  const links = w.document.querySelector("[data-cplh-links]");
  links.click();
  check("Links opens its list", links.getAttribute("aria-expanded") === "true" && !w.document.getElementById("cplh-panel").hidden, "");
}

// ── The copy against the veteran map's and against its source ──
const pairs = (s) => [...s.matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a><span class="cplh-desc"[^>]*>([^<]+)</g)].map((m) => m[2] + " " + m[1] + " " + m[3]).join("\n");
const vet = fs.readFileSync(path.join(ROOT, "veteran-sprint-map", "build_selfcontained.py"), "utf8");
check("the Links list matches the veteran map's copy, word, link and line", pairs(block) && pairs(block) === pairs(vet), "the two tracker copies drifted");
const vault = [process.env.CPL_VAULT_ROOT, path.join(ROOT, "..", "CPLBrain"), path.join(ROOT, "..", "COG-second-brain")]
  .filter(Boolean).find((v) => fs.existsSync(path.join(v, "04-projects", "cpl-initiative", "public-header", "header.html")));
if (!vault) {
  console.log("NOT RUN  the copy against the vault's header.html (attach CPLBrain, or set CPL_VAULT_ROOT)");
} else {
  const src = fs.readFileSync(path.join(vault, "04-projects", "cpl-initiative", "public-header", "header.html"), "utf8");
  check("the Links list matches the vault's header.html, the one source", pairs(src) === pairs(block), "re-copy header.html into fact-sheet/index.html");
}

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log((r.ok ? "  ok   " : "  FAIL ") + r.name + (r.ok ? "" : "  -- " + r.detail));
}
console.log(`\nfactsheet_public_header: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
