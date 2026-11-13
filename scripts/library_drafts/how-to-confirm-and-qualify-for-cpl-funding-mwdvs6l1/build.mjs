// Builds Draft 2 of "How to Confirm and Qualify for CPL Funding" (cpl_library how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1),
// a new Library piece Ally Barker (MAP team) started on 2026-11-12. S647, the CPL Library's carried request.
//
// The page is built the way the Library tab builds a new piece's draft (library-revise-draft's new_page.mjs buildNewPage):
// the starter page's frame byte for byte, with this folder's main.html as its <main>, so the piece stays a normal Library
// page that the card can revise and Publish it can post. Then panel.html (the guide panel: style and script) goes into the
// frame just before the Ask Sierra script. scripts/library_publish.py checks only a new piece's <main> against the
// allowlist, so the frame's panel publishes as it stands.
//
//   node scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/build.mjs
//
// writes draft.html beside this file. kb/receipts/cpl_library_s647_how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1.sql
// stores that file as the card's draft.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNewPage, mainProblems, STARTER_SLUG } from "../../../chatbox/supabase/functions/library-revise-draft/new_page.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..", "..");
export const SLUG = "how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1";
export const TITLE = "How to Confirm and Qualify for CPL Funding";
const DESCRIPTION = "The four minimum conditions a California community college meets to qualify for CPL Implementation Funding, with a guide to each.";
const PUBLISHED = "Published by the California Community Colleges Chancellor's Office, Credit for Prior Learning Initiative. Draft 2, November 13, 2026.";
const COMMENT =
  "<!-- How to Confirm and Qualify for CPL Funding: Draft 2, built in session S647 from Ally Barker's brief and asks of\n" +
  "     2026-11-12 (cpl_library how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1, carried from ...-mwdv9pl5), in the starter page\n" +
  "     " + STARTER_SLUG + "'s frame. Source: scripts/library_drafts/" + SLUG + "/ (cpl-project-tracker). -->\n";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The pieces this session wrote, as they land on the page. write_receipt.py carries exactly these into the SQL, which
// rebuilds the page on the server from Draft 1's stored frame (fromDraft1, step for step).
export function pieces() {
  const main = fs.readFileSync(path.join(HERE, "main.html"), "utf8").trim();
  const panel = fs.readFileSync(path.join(HERE, "panel.html"), "utf8").trim();
  const bad = mainProblems(main);
  if (bad.length) throw new Error("main.html carries " + bad.join(", "));
  return { main, panel, title: esc(TITLE), description: esc(DESCRIPTION), comment: COMMENT, published: esc(PUBLISHED) };
}

export function build() {
  const starter = fs.readFileSync(path.join(ROOT, "library", STARTER_SLUG, "index.html"), "utf8");
  const p = pieces();
  const built = buildNewPage(starter, SLUG, { title: TITLE, description: DESCRIPTION, main: p.main, published: PUBLISHED });
  if (built.error) throw new Error(built.error);
  let html = built.html.replace(/(<body[^>]*>\s*)<!--[\s\S]*?-->\s*/i, (_m, b) => b + COMMENT);
  const at = html.indexOf("<!-- Ask Sierra");
  if (at < 0) throw new Error("the starter's Ask Sierra script is not where the panel goes");
  html = html.slice(0, at) + p.panel + "\n" + html.slice(at);
  return html;
}

// The same page from Draft 1 (cpl_library_drafts 0aeed57a, the card's draft in the same starter frame), by positions
// only, the steps write_receipt.py's SQL takes: the <main>, the title, the description, the body's first comment, the
// foot's first line, then the panel before the Ask Sierra script. tests/library_qualify_draft.test.js holds it equal to build().
const WS = " \n\t\r";
const ltrimWs = (s) => { let i = 0; while (i < s.length && WS.indexOf(s[i]) >= 0) i++; return s.slice(i); };
export function fromDraft1(h, p = pieces()) {
  let i = h.indexOf("<main"), j = h.lastIndexOf("</main>");
  h = h.slice(0, i) + p.main + h.slice(j + 7);
  i = h.indexOf("<title>"); j = h.indexOf("</title>");
  h = h.slice(0, i + 7) + p.title + h.slice(j);
  const D = '<meta name="description" content="';
  i = h.indexOf(D); j = h.indexOf('">', i);
  h = h.slice(0, i + D.length) + p.description + h.slice(j);
  i = h.indexOf("<body>") + 6;
  const rest = h.slice(i), ws = rest.slice(0, rest.length - ltrimWs(rest).length);
  h = h.slice(0, i) + ws + p.comment + ltrimWs(rest.slice(rest.indexOf("-->") + 3));
  const F = '<footer class="foot"><div class="foot-in">';
  const f = h.indexOf(F), a = h.indexOf("<p>", f), b = h.indexOf("</p>", f);
  h = h.slice(0, a + 3) + p.published + h.slice(b);
  const at = h.indexOf("<!-- Ask Sierra");
  return h.slice(0, at) + p.panel + "\n" + h.slice(at);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = build();
  fs.writeFileSync(path.join(HERE, "draft.html"), html);
  console.log("draft.html", html.length, "characters");
}
