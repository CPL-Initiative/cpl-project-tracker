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

export function build() {
  const starter = fs.readFileSync(path.join(ROOT, "library", STARTER_SLUG, "index.html"), "utf8");
  const main = fs.readFileSync(path.join(HERE, "main.html"), "utf8").trim();
  const panel = fs.readFileSync(path.join(HERE, "panel.html"), "utf8").trim();
  const bad = mainProblems(main);
  if (bad.length) throw new Error("main.html carries " + bad.join(", "));
  const built = buildNewPage(starter, SLUG, {
    title: TITLE,
    description: "The four minimum conditions a California community college meets to qualify for CPL Implementation Funding, with a guide to each.",
    main,
    published: "Published by the California Community Colleges Chancellor's Office, Credit for Prior Learning Initiative. Draft 2, November 13, 2026.",
  });
  if (built.error) throw new Error(built.error);
  let html = built.html.replace(/(<body[^>]*>\s*)<!--[\s\S]*?-->\s*/i, (_m, b) => b +
    "<!-- How to Confirm and Qualify for CPL Funding: Draft 2, built in session S647 from Ally Barker's brief and asks of\n" +
    "     2026-11-12 (cpl_library how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1, carried from ...-mwdv9pl5), in the starter page\n" +
    "     " + STARTER_SLUG + "'s frame. Source: scripts/library_drafts/" + SLUG + "/ (cpl-project-tracker). -->\n");
  const at = html.indexOf("<!-- Ask Sierra");
  if (at < 0) throw new Error("the starter's Ask Sierra script is not where the panel goes");
  html = html.slice(0, at) + panel + "\n" + html.slice(at);
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = build();
  fs.writeFileSync(path.join(HERE, "draft.html"), html);
  console.log("draft.html", html.length, "characters");
}
