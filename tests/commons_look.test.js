// The CPL Commons look on every Commons view (Sam, 2026-11-04: "Use the new UI format rather than first light on this and
// all commons views", then "let's go with the new formatting on all commons surfaces--the background on the subjects view
// is still first light"). commons_look.js carries the guards' subject. Guards:
//   (1) both HTMLs load it (Rule 4), after first_light.js;
//   (2) its palette is commons.js's, light and dark, so the two cannot drift;
//   (3) it covers the five references' tabs: Subjects, Exhibits, CR, Programs and Courses;
//   (4) First Light's roles map onto the palette in light mode only (dark keeps First Light's roles, whose values the
//       palette already is, so a remap there would be a cycle);
//   (5) each tab paints an opaque page (it covers the painting) and sets its headings in the Commons serif;
//   (6) installing twice adds one style.
// Run from repo root: `npm test` (or `node tests/commons_look.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("commons_look.js", "utf8"), CM = fs.readFileSync("commons.js", "utf8");
const html = fs.readFileSync("CPL_Dashboard.html", "utf8"), idx = fs.readFileSync("index.html", "utf8");
check("(1) both HTMLs load commons_look.js after first_light.js", [html, idx].every((h) => h.indexOf('<script src="commons_look.js"></script>') > h.indexOf('<script src="first_light.js"></script>')
  && h.indexOf('<script src="first_light.js"></script>') > 0));

const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { runScripts: "dangerously" });
const s = dom.window.document.createElement("script"); s.textContent = SRC; dom.window.document.body.appendChild(s);
const L = dom.window.CPL_COMMONS_LOOK;
const cmLight = /"#tab-commons \{ (.*?) \}",/.exec(CM)[1], cmDark = /:root\[data-theme=\\"dark\\"\] #tab-commons \{ (.*?) \}",/.exec(CM)[1].replace(/\\"/g, '"');
check("(2) ⭐ the light palette is commons.js's", L.LIGHT === cmLight, L.LIGHT.slice(0, 80));
check("(2) and so is the dark one", L.DARK === cmDark);
check("(3) ⭐ the five references' tabs", JSON.stringify(L.TABS) === JSON.stringify(["#tab-canonical-subj4", "#tab-exhibits", "#tab-cr-reference", "#tab-program-requirements", "#tab-coci-lookup"]));
const css = L.CSS;
const lines = css.split("\n");
const remapLines = lines.filter((x) => x.indexOf(L.REMAP) >= 0);
check("(4) ⭐ the roles map only where the theme is light", remapLines.length === 2 && /^:root\[data-theme="light"\]/.test(remapLines[0])
  && /^@media not \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="dark"\]\)/.test(remapLines[1]), remapLines.join("\n"));
check("(4) no dark block remaps a role", lines.filter((x) => /dark/.test(x) && x.indexOf(L.REMAP) < 0).every((x) => !/--surface:var\(--cmn/.test(x)));
check("(4) the remap covers the roles the views key on", ["--surface:var(--cmn-surface)", "--text-strong:var(--cmn-heading)", "--text-body:var(--cmn-ink)",
  "--text-muted:var(--cmn-muted)", "--border:var(--cmn-line)", "--cobalt:var(--cmn-link)"].every((r) => L.REMAP.indexOf(r) >= 0));
check("(5) ⭐ each tab paints an opaque page in the Commons face", lines.some((x) => x.indexOf(L.TABS.join(", ") + " { background:linear-gradient(180deg, var(--cmn-surface) 0") === 0 && /font-family:var\(--cmn-sans\)/.test(x)));
check("(5) and sets its headings in the Commons serif", L.TABS.every((t) => css.indexOf(t + " :is(h1, h2, h3)") >= 0) && /font-family:var\(--cmn-serif\); color:var\(--cmn-heading\)/.test(css));
check("(5) glass reads as a plain surface", /\.glass \{ background:var\(--cmn-surface\); -webkit-backdrop-filter:none; backdrop-filter:none;/.test(css));
check("(5) no raw hex outside the palette", !/#[0-9a-fA-F]{3,8}\b/.test(css.split(L.LIGHT).join("").replace(/#tab-[a-z0-9-]+/g, "")));
L.install(); L.install();
check("(6) installing twice adds one style", dom.window.document.querySelectorAll("#cmn-look").length === 1);

let pass = 0;
results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
console.log("\n" + pass + "/" + results.length + " checks passed");
process.exit(pass === results.length ? 0 : 1);
