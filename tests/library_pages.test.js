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
//   (2) the public header and its Light and Dark words (Sam, 2026-10-21);
//   (3) self-contained: no script from elsewhere, no Claude runtime call, no email address;
//   (4) the address Sierra reads, and the slug a Library record can carry;
//   (5) the script: the fragment's head lines move into <head>, the body stays as it was,
//       a whole document gives the same page, and a page with no title or a bad slug stops.
// Run from repo root: `node tests/library_pages.test.js`.
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LIB = path.join(ROOT, "library");
const pages = fs.readdirSync(LIB, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(LIB, d.name, "index.html")))
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
  check(`(3) ${p.slug}: self-contained — no script from elsewhere, no Claude runtime call, no email address`,
    !/<script\b[^>]*\bsrc=/i.test(h) && !/window\.claude/.test(h) && !/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(h.replace(/data:[^"]+/g, "")));
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
    /<head>\n<meta charset="utf-8">\n<meta name="viewport"[^\n]*>\n<title>A Piece<\/title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet"/.test(built) &&
    /<body>\n<style>body\{color:red\}<\/style>\n<main><h1>A Piece<\/h1><\/main>\n<\/body>/.test(built));
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

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\nlibrary_pages.test.js: ${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
