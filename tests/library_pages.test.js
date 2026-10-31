// The public Library's own pages (library/<slug>/index.html, S469).
//
// Sam, 2026-10-24: "the url that shows for the public library visuals has a claude url. Any
// way we can use an alias for all public surfaces--with cplinitiative?" On 2026-10-25 he
// picked "GitHub Pages now": a public piece made as a Claude artifact gets a copy under the
// tracker's library/, written by scripts/library_page.py, and its Library record links there.
// Sierra reads these pages (cpl-chat's libraryHosted), so they are also her source.
//
// These checks hold every such page to what a public page needs, and the script to its
// contract:
//   (1) a whole document: doctype, lang, charset, viewport, one title, the seal as its icon;
//   (2) the public header and its Light and Dark words (Sam, 2026-10-21), and the page opens
//       Light unless the reader picked Dark (Sam, Open Asks Sheet 126 card 2);
//   (3) self-contained: no script but the library's own Sierra, no Claude runtime call, and no
//       email address but the people a card names, each its own mailto link (Sam, 2026-10-26);
//   (4) the address Sierra reads, and the slug a Library record can carry;
//   (5) the script: the fragment's head lines move into <head>, the body stays as it was,
//       a whole document gives the same page, and a page with no title or a bad slug stops;
//   (6) the header's links sit behind one Links word, each with a line in gray saying what it
//       is (Sam, 2026-10-26: "so new-to-CPL users will not be immediately lost in our
//       acronyms"), on these pages and on the CPL opportunity visual;
//   (7) the Ask Sierra chip, opening the library's side bar (Sam, 2026-10-26: "on all visuals
//       and opens the same way it does in the Public Library"), on the same pages;
//   (8) a page that plays a film: captions on by default, no autoplay, the transcript, its files.
// Run from repo root: `node tests/library_pages.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LIB = path.join(ROOT, "library");
// The CPL Opportunity page (library/cpl-opportunity/, moved 2026-10-26, Sheet 131 card 2) is a live page the
// browser builds per college, not a copy library_page.py writes; tests/college_cpl_workbook.test.js guards it.
// The public adoption page (library/adopt/, Sheet 147, 2026-10-31) is live too: it reads adopt_data.json and
// carries the Library's own adapted header; tests/public_adopt.test.js guards it.
const LIVE = ["cpl-opportunity", "adopt"];
const pages = fs.readdirSync(LIB, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !LIVE.includes(d.name) && fs.existsSync(path.join(LIB, d.name, "index.html")))
  .map((d) => ({ slug: d.name, html: fs.readFileSync(path.join(LIB, d.name, "index.html"), "utf8") }));

check("(0) the two pieces Sam's pick moved are pages under library/",
  ["ell-iet-cpl-starting-points", "dsp-credit-starting-points"].every((s) => pages.some((p) => p.slug === s)),
  "found " + pages.map((p) => p.slug).join(", "));

for (const p of pages) {
  const h = p.html, head = (h.match(/<head>([\s\S]*?)<\/head>/) || [])[1] || "";
  check(`(1) ${p.slug}: a whole document, in English, with its charset, viewport and one title in <head>`,
    /^<!doctype html>\n<html lang="en">\n<head>\n/.test(h) && /<meta charset="utf-8">/.test(head) &&
    /<meta name="viewport" content="width=device-width, initial-scale=1/.test(head) &&
    (h.match(/<title>[^<]+<\/title>/g) || []).length === 1 && /<title>[^<]+<\/title>/.test(head) &&
    /<link rel="icon" href="\.\.\/\.\.\/cccco_seal\.png">/.test(head) && /<\/body>\n<\/html>\n$/.test(h));
  check(`(1) ${p.slug}: the frame's base rules carry no color of their own`,
    /body\{margin:0;padding:0\}/.test(head) && !/<style>:root\{[^<]*#[0-9a-f]{3,6}/i.test(head.slice(head.indexOf("<style>:root{box-sizing"))));
  check(`(2) ${p.slug}: the public header, its links out and its Light and Dark words`,
    /<!-- cpl-public-header:start/.test(h) && /<!-- cpl-public-header:end -->/.test(h) &&
    /data-cplh-theme="light"/.test(h) && /data-cplh-theme="dark"/.test(h) &&
    /href="https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/library\/"/.test(h));
  const theme = (stored) => {
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { url: "https://cpl-initiative.github.io/cpl-project-tracker/library/" + p.slug + "/", runScripts: "outside-only" });
    if (stored) dom.window.localStorage.setItem("cpl_theme", stored);
    const first = (head.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
    dom.window.eval(first);
    const t = dom.window.document.documentElement.getAttribute("data-theme");
    dom.window.close();
    return t;
  };
  check(`(2) ${p.slug}: ⭐ opens Light unless the reader picked Dark, set in <head> before its styles`,
    head.indexOf("<script>") > -1 && head.indexOf("<script>") < head.indexOf("<style") &&
    theme(null) === "light" && theme("system") === "light" && theme("dark") === "dark" && theme("light") === "light");
  const srcs = (h.match(/<script\b[^>]*\bsrc="[^"]*"/gi) || []).map((t) => t.match(/src="([^"]*)"/)[1]);
  check(`(3) ${p.slug}: self-contained — no script but the library's own Sierra, no Claude runtime call`,
    srcs.every((u) => u === "../../sierra/sidebar.js") && !/window\.claude/.test(h),
    "scripts: " + srcs.join(", "));
  // An address appears only among the people a card names (Sam, 2026-10-26: everyone may be
  // named publicly, with email; cpl_memory sam-s483-visual-links-sierra-contacts-2026-10-26),
  // each the visible text of its own mailto link. Anywhere else on the page it is still a leak.
  const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const cd = new JSDOM(h).window.document;
  const blocks = Array.from(cd.querySelectorAll("article.card .contacts"));
  const mails = blocks.flatMap((b) => Array.from(b.querySelectorAll('a[href^="mailto:"]')));
  const linked = mails.every((a) => EMAIL.test(a.textContent) && a.getAttribute("href") === "mailto:" + a.textContent.trim());
  const loose = blocks.filter((b) => {
    const c = b.cloneNode(true);
    c.querySelectorAll('a[href^="mailto:"]').forEach((a) => a.remove());
    return EMAIL.test(c.innerHTML);
  }).length;
  blocks.forEach((b) => b.remove());
  const rest = cd.documentElement.outerHTML.replace(/data:[^"]+/g, "");
  check(`(3) ${p.slug}: ⭐ no email address but a card's named contacts, each its own mailto link`,
    linked && !loose && !EMAIL.test(rest),
    JSON.stringify({ blocks: blocks.length, mails: mails.length, linked, loose, elsewhere: (rest.match(EMAIL) || [""])[0] }));
  check(`(4) ${p.slug}: a Library slug, at the address Sierra reads`,
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) &&
    /^https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/library\/[a-z0-9-]+\/?$/.test(
      "https://cpl-initiative.github.io/cpl-project-tracker/library/" + p.slug + "/"));
}

// (5) The script, against a fragment shaped like an artifact's.
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "libpage-"));
  const frag = '<title>A Piece</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">\n<style>body{color:red}</style>\n<main><h1>A Piece</h1></main>';
  const src = path.join(tmp, "frag.html");
  fs.writeFileSync(src, frag);
  const py = (code) => execFileSync("python3", ["-c", "import sys; sys.path.insert(0, 'scripts'); import library_page as m\n" + code], { cwd: ROOT, encoding: "utf8", stdio: "pipe" });
  const built = py(`print(m.build('a-piece', open(${JSON.stringify(src)}).read()), end='')`);
  check("(5) ⭐ the fragment's head lines move into <head>; the rest stays in <body> as it was",
    /<head>\n<meta charset="utf-8">\n<meta name="viewport"[^\n]*>\n<script>[^\n]*data-theme[^\n]*<\/script>\n<title>A Piece<\/title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet"/.test(built) &&
    /<body>\n<style>body\{color:red\}<\/style>\n<main><h1>A Piece<\/h1><\/main>\n<!-- Ask Sierra[^\n]*-->\n<script src="\.\.\/\.\.\/sierra\/sidebar\.js" defer><\/script>\n<\/body>/.test(built));
  check("(7) ⭐ a page the script writes loads the library's Ask Sierra script, deferred, once, last in <body>, and maps the bar onto the header's tokens",
    (built.match(/<script src="\.\.\/\.\.\/sierra\/sidebar\.js" defer><\/script>/g) || []).length === 1 &&
    /<script src="\.\.\/\.\.\/sierra\/sidebar\.js" defer><\/script>\n<\/body>\n<\/html>\n$/.test(built) &&
    /<style>:root\{--sierra-bar-bg:var\(--cplh-bg\)/.test(built.slice(0, built.indexOf("</head>"))));
  const whole = path.join(tmp, "whole.html");
  fs.writeFileSync(whole, '<!doctype html><html><head><meta charset=utf8><style>:root{color-scheme:light}</style></head><body>\n' + frag + '\n\n</body></html>');
  check("(5) a whole document, as Artifact read hands it back, gives the same page",
    py(`print(m.build('a-piece', open(${JSON.stringify(whole)}).read()), end='')`) === built);
  let noTitle = false, badSlug = false;
  try { py("m.build('a-piece', '<main>no title</main>')"); } catch (e) { noTitle = /no <title>/.test(String(e.stderr)); }
  try { execFileSync("python3", ["scripts/library_page.py", "Bad Slug", src], { cwd: ROOT, encoding: "utf8", stdio: "pipe" }); } catch (e) { badSlug = /not a Library slug/.test(String(e.stderr)); }
  check("(5) a page with no title, or a slug that is not a Library slug, stops the script", noTitle && badSlug);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// (6) The header's Links word, on every page that carries the public header from header.html:
// the Library's own pages and the CPL opportunity visual (the library's adapted copy is
// checked in public_library.test.js).
const HEADERED = pages.map((p) => ({ name: "library/" + p.slug, html: p.html }))
  .concat([{ name: "cpl-opportunity", html: fs.readFileSync(path.join(ROOT, "library", "cpl-opportunity", "index.html"), "utf8") }]);
const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
for (const p of HEADERED) {
  const blockHtml = (p.html.match(/<!-- cpl-public-header:start[\s\S]*?<!-- cpl-public-header:end -->/) || [])[0] || "";
  const dom = new JSDOM("<!doctype html><html><head></head><body>" + blockHtml +
    '<main><p>Page</p><button type="button" id="elsewhere">Elsewhere</button></main></body></html>',
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/x/", runScripts: "dangerously" });
  const w = dom.window, d = w.document;
  const word = d.querySelector(".cplh button[data-cplh-links]");
  const panel = word && d.getElementById(word.getAttribute("aria-controls"));
  const nav = d.querySelector('.cplh nav[aria-label="CPL pages"]');
  const links = nav ? Array.from(nav.querySelectorAll("a")) : [];
  check(`(6) ${p.name}: ⭐ the links sit behind one word, Links: a button, collapsed, controlling a hidden panel`,
    !!word && word.textContent.trim() === "Links" && word.getAttribute("type") === "button" &&
    word.getAttribute("aria-expanded") === "false" && !!panel && panel.hidden && nav.contains(word) &&
    d.querySelectorAll("[data-cplh-links]").length === 1 && links.length >= 5 && links.every((a) => panel.contains(a)));
  const described = links.map((a) => {
    const el = d.getElementById(a.getAttribute("aria-describedby") || "");
    return { name: a.textContent.trim(), ok: !!el && el.classList.contains("cplh-desc") && el.parentNode === a.parentNode &&
      words(el.textContent) >= 4 && words(el.textContent) <= 14, text: el ? el.textContent.trim() : "" };
  });
  check(`(6) ${p.name}: ⭐ every link carries a line saying what it is, beside it and named as its description, under ~12 words`,
    described.length >= 5 && described.every((x) => x.ok), described.filter((x) => !x.ok).map((x) => x.name).join(", "));
  const desc = (name) => (described.find((x) => x.name === name) || {}).text || "";
  check(`(6) ${p.name}: the lines spell out the acronyms: CPL is credit for prior learning, MAP the Mapping Articulated Pathways platform`,
    /credit for prior learning \(CPL\)/i.test(desc("CPL Fact Sheet")) && /Mapping Articulated Pathways \(MAP\) platform/.test(desc("MAP")) &&
    !/MAP Initiative|Military Articulation Platform/.test(blockHtml));
  check(`(6) ${p.name}: the panel counts its padding and border in its width, so at 390px it stays inside the window (measured: without it, 18px past the left edge)`,
    /\.cplh-panel\{box-sizing:border-box;[^}]*right:max\(16px,[^}]*width:min\(38rem,calc\(100% - 32px\)\)/.test(blockHtml) && /\.cplh-in\{position:relative;/.test(blockHtml));
  check(`(6) ${p.name}: the gray line has its own token, set for Light and for Dark`,
    /\.cplh-desc\{color:var\(--cplh-muted\)/.test(blockHtml) &&
    /:root\{[^}]*--cplh-muted:#5C5C55/.test(blockHtml) && /:root\[data-theme="dark"\]\{[^}]*--cplh-muted:#B4B1A8/.test(blockHtml));
  if (word && panel) {
    word.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const opened = word.getAttribute("aria-expanded") === "true" && !panel.hidden;
    links[2].focus();
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const escaped = word.getAttribute("aria-expanded") === "false" && panel.hidden && d.activeElement === word;
    word.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    d.getElementById("elsewhere").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const outside = panel.hidden && word.getAttribute("aria-expanded") === "false";
    word.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    links[links.length - 1].dispatchEvent(new w.FocusEvent("focusout", { bubbles: true, relatedTarget: d.getElementById("elsewhere") }));
    const tabbed = panel.hidden;
    word.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    links[0].dispatchEvent(new w.FocusEvent("focusout", { bubbles: true, relatedTarget: links[1] }));
    const stays = !panel.hidden;
    d.querySelector('[data-cplh-theme="dark"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const themeStill = d.documentElement.getAttribute("data-theme") === "dark";
    check(`(6) ${p.name}: ⭐ Links opens the list; Escape shuts it and hands focus back; a click outside or Tab past it shuts it; moving within it does not; the theme words still work`,
      opened && escaped && outside && tabbed && stays && themeStill,
      JSON.stringify({ opened, escaped, outside, tabbed, stays, themeStill }));
  }
  dom.window.close();
}

// (7) The Ask Sierra chip on every visual: the library's script, at the right depth, with the
// bar's look mapped (every token sidebar.js reads, except its width and its heading font).
{
  const BAR = fs.readFileSync(path.join(ROOT, "sierra", "sidebar.js"), "utf8");
  const used = Array.from(new Set((BAR.match(/var\(--sierra-bar-[a-z-]+/g) || []).map((t) => t.slice(4))))
    .filter((t) => t !== "--sierra-bar-w" && t !== "--sierra-bar-head-font");
  for (const p of HEADERED) {
    const src = "../../sierra/sidebar.js";  // every visual, the CPL Opportunity page included, sits two folders down
    const tag = '<script src="' + src + '" defer></script>';
    const missing = used.filter((t) => p.html.indexOf(t + ":") < 0);
    check(`(7) ${p.name}: ⭐ loads ${src} once, deferred, after the page's own content`,
      p.html.split(tag).length === 2 && p.html.indexOf(tag) > p.html.lastIndexOf("</main>"));
    check(`(7) ${p.name}: maps the bar's tokens onto its own, no raw colors, and keeps room for the chip below its last line`,
      used.length >= 8 && !missing.length && !/--sierra-bar-[a-z-]+:\s*#/.test(p.html) && /html\.sbar-chip-on (body|main) ?\{ ?padding-bottom: ?(7[2-9]|8\d|9\d)px/.test(p.html),
      "missing: " + missing.join(", "));
  }
}

// (8) A page that plays a film (the Chancellor's Summit address, S531; Sam, 2026-10-30: "make this video of
// the Chancellor accessible", then "Can I host it from git or the library itself?"): captions on by default
// from a file beside it, nothing that plays on its own, the transcript on the page, and every file it plays
// in the folder and under GitHub's 100 MB limit.
for (const p of pages.filter((x) => /<video\b/.test(x.html))) {
  const d = new JSDOM(p.html).window.document, dir = path.join(LIB, p.slug);
  const videos = Array.from(d.querySelectorAll("video"));
  const tracks = videos.map((v) => v.querySelector('track[kind="captions"][srclang="en"][default]'));
  check(`(8) ${p.slug}: ⭐ every film carries English captions, on by default, from a WebVTT file beside the page`,
    tracks.every((t) => t && /\.vtt$/.test(t.getAttribute("src")) && fs.existsSync(path.join(dir, t.getAttribute("src"))) &&
      /^WEBVTT\b/.test(fs.readFileSync(path.join(dir, t.getAttribute("src")), "utf8"))));
  check(`(8) ${p.slug}: a film waits for the reader (controls, no autoplay or loop) and has a name`,
    videos.every((v) => v.hasAttribute("controls") && !v.hasAttribute("autoplay") && !v.hasAttribute("loop") && (v.getAttribute("aria-label") || "").length > 10));
  const files = videos.flatMap((v) => Array.from(v.querySelectorAll("source")).map((s) => s.getAttribute("src")).concat(v.getAttribute("poster") || []));
  check(`(8) ${p.slug}: every file a film plays sits in the folder, under 100 MB`,
    files.length > 0 && files.every((f) => fs.existsSync(path.join(dir, f)) && fs.statSync(path.join(dir, f)).size < 100e6), files.join(", "));
  const h2 = Array.from(d.querySelectorAll("h2")).find((h) => /Transcript/.test(h.textContent));
  const words = h2 ? h2.parentNode.textContent.trim().split(/\s+/).length : 0;
  check(`(8) ${p.slug}: ⭐ the transcript is on the page, under its own heading`, words > 300, words + " words");
}

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\nlibrary_pages.test.js: ${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
