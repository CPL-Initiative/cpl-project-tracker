// "How to Confirm and Qualify for CPL Funding", Draft 2 (S647): a new Library piece Ally Barker (MAP team) started on
// 2026-11-12. Her words: "Make sure the links open to a side bar view of those visuals instead of opening seperate
// tabs"; "We need three separate cards. The third card should read "How to confirm". Each card should be clickable and
// should show a sidebar with the visual"; "Add the links in each box to the appropriate visual".
//
// The card's own drafter could not make it: a new piece's <main> takes no script, and a side panel needs one. So a
// session built it (scripts/library_drafts/<slug>/), in the starter's frame, and kb/receipts stores it as the card's draft.
// What fails without each part:
//   (1) draft.html drifts from its source, so the stored draft is not what the source builds;
//   (2) the <main> fails the allowlist that library-revise-draft and scripts/library_publish.py both run, so Publish it
//       refuses the piece; or the starter's frame is not kept;
//   (3) a public page's contract (library_pages.test.js runs it once the page is published): one title, no outside
//       script but Sierra's side bar;
//   (4) the four minimum conditions drift from the published scenario's own words (cpl_funding_config, Scenario 4,
//       read 2026-11-13), or the page uses a retired funding word;
//   (5) the cards: three, each a plain https link (the way out with no script), the third reading "How to confirm";
//   (6) the panel: a card opens its guide beside the page in a modal dialog (focus on its title, the page behind it
//       inert, Open in a new tab and Close), Escape and Close shut it and hand focus back to the card, the third card
//       shows the page's own steps, and a Ctrl-click is left to the browser.
// Run from repo root: `node tests/library_qualify_draft.test.js`.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const SLUG = "how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1";
const DIR = path.join(ROOT, "scripts", "library_drafts", SLUG);
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

(async () => {
  const { build } = await import(path.join(DIR, "build.mjs"));
  const np = await import(path.join(ROOT, "chatbox/supabase/functions/library-revise-draft/new_page.mjs"));
  const ae = await import(path.join(ROOT, "chatbox/supabase/functions/library-revise-draft/apply_edits.mjs"));
  const html = fs.readFileSync(path.join(DIR, "draft.html"), "utf8");
  const main = (html.match(/<main\b[^>]*\bid="main"[^>]*>[\s\S]*<\/main>/) || [""])[0];
  const starter = fs.readFileSync(path.join(ROOT, "library", np.STARTER_SLUG, "index.html"), "utf8");

  // (1)
  check("(1) draft.html is what build.mjs makes from its source", build() === html);
  check("(1) the page stays small enough to store and paste (under 60 KB)", html.length < 60000, html.length + " characters");
  // The SQL rebuilds the page on the server from Draft 1 (the card's draft in the same starter frame) by fromDraft1's
  // steps; a Draft 1 made the way the card makes one must come out as this page, whatever its own words were.
  const { fromDraft1 } = await import(path.join(DIR, "build.mjs"));
  const d1 = np.buildNewPage(fs.readFileSync(path.join(ROOT, "library", np.STARTER_SLUG, "index.html"), "utf8"), SLUG,
    { title: "Confirm & Qualify", description: 'A "page" & more', published: "Published by the Chancellor's Office. Draft 1.",
      main: '<main id="main"><div class="hero"><h1>Confirm</h1></div><section aria-labelledby="g"><h2 id="g">Guides</h2><p>x</p></section></main>' }).html;
  check("(1) from Draft 1, the server's steps make exactly this page (fromDraft1)", fromDraft1(d1) === html);
  const md5 = require("crypto").createHash("md5").update(html, "utf8").digest("hex");
  const sqlBase = path.join(ROOT, "kb", "receipts", "cpl_library_s647_" + SLUG);
  const fwd = fs.readFileSync(sqlBase + ".sql", "utf8"), proof = fs.readFileSync(sqlBase + "_proof.sql", "utf8");
  check("(1) the proof and the forward SQL expect this page's md5 and length (write_receipt.py ran after build.mjs)",
    proof.includes(`'${md5}'`) && fwd.includes(`'${md5}'`) && fwd.includes(`length(h) = ${html.length}`), md5);
  check("(1) the forward SQL carries the pieces, never the whole page", fwd.length < 20000 && !fwd.includes("<!doctype html>"), fwd.length + " bytes");
  // (1b) The receipt runs through the Supabase MCP, whose guard (scripts/supabase_sql_guard.py) lets plain data writes
  // run and refuses DO, functions and plpgsql: the first form of this receipt was one DO block and was refused
  // (2026-11-13). So each SQL file is one plain statement, and every write hangs on the one guard CTE.
  const rb = fs.readFileSync(sqlBase + "_rollback.sql", "utf8");
  const noCode = (s) => !/\bdo\s+\$|\bplpgsql\b|\bcreate\s|\blanguage\s|\bperform\b|\braise\b/i.test(s);
  check("(1b) the forward write and the rollback carry no DO block, function or plpgsql", noCode(fwd) && noCode(rb) && noCode(proof));
  let gd = "";
  try {
    gd = [fwd, rb, proof].map((sql) => JSON.parse(execFileSync("python3", ["scripts/supabase_sql_guard.py"], { cwd: ROOT, encoding: "utf8",
      input: JSON.stringify({ tool_name: "mcp__Supabase__execute_sql", tool_input: { query: sql } }) })).hookSpecificOutput.permissionDecision).join(",");
  } catch (e) { gd = "error: " + e.message.split("\n")[0]; }
  check("(1b) the repo's Supabase guard allows the forward write, the rollback and the proof", gd === "allow,allow,allow", gd);
  check("(1b) the INSERT and both UPDATEs hang on the one guard, so all land or none does",
    /\bfrom g\s+on conflict \(id\) do nothing returning id\)/.test(fwd) && (fwd.match(/and exists \(select 1 from g\) returning id\)/g) || []).length === 2 &&
    /then \('S647: a write missed its row[^)]*\)::int end as undone/.test(fwd));
  // Inlined, the six build steps substitute each other's text expressions and the statement ran 37 s on one row (and an
  // out-of-memory kill once) in a scratch Postgres 16; materialized, 10 ms.
  check("(1b) the six build steps are materialized CTEs", (fwd.match(/^s[1-6] as materialized \(/gm) || []).length === 6 &&
    (proof.match(/^s[1-6] as materialized \(/gm) || []).length === 6);

  // (2)
  check("(2) the <main> passes the drafter's allowlist (new_page.mjs mainProblems)", np.mainProblems(main).length === 0, np.mainProblems(main).join("; "));
  let py = "";
  try {
    py = execFileSync("python3", ["-c",
      "import sys; sys.path.insert(0, 'scripts'); import library_publish as p; " +
      "print('|'.join(p.main_problems(p.strip_figures(open(sys.argv[1], encoding='utf-8').read()))) or 'clean')",
      path.join(DIR, "draft.html")], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch (e) { py = "error: " + e.message.split("\n")[0]; }
  check("(2) the publisher's own check (library_publish.py main_problems) finds it clean", py === "clean", py);
  check("(2) the starter's frame is kept (apply_edits.mjs frameKept)", ae.frameKept(starter, html).length === 0, ae.frameKept(starter, html).join(", "));
  check("(2) the slug is this record's, never the starter's", html.indexOf(np.STARTER_SLUG) < 0 || /starter page\s+noncredit/.test(html));

  // (3)
  const srcs = (html.match(/<script[^>]*\bsrc="([^"]+)"/g) || []).map((t) => t.replace(/^.*src="|"$/g, ""));
  check("(3) no outside script but the library's Sierra", srcs.length === 1 && srcs[0] === "../../sierra/sidebar.js", srcs.join(", "));
  check("(3) one title, the piece's", (html.match(/<title>[^<]+<\/title>/g) || []).join() === "<title>How to Confirm and Qualify for CPL Funding</title>");
  check("(3) a whole document", /^<!doctype html>\n<html lang="en">\n<head>\n/.test(html) && /<\/body>\n<\/html>\n$/.test(html));

  // (4)
  const CONDITIONS = [
    "CPL Coordinator assigned on MAP and CPL Assistant email listed on the college CPL Landing Page.",
    "Local confirmation on file by December 31, 2026.",
    "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP and processed for CPL.",
    "For the noncredit CPL funding: Assign in MAP a Noncredit CPL Lead who meets regularly with the CPL Coordinator and attest to this on the CPL Funding Dashboard.",
  ];
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://cpl-initiative.github.io/cpl-project-tracker/library/" + SLUG + "/" });
  const w = dom.window, d = w.document;
  const listed = Array.from(d.querySelectorAll("#h-conditions + ol > li p")).map((p) => p.textContent.trim());
  check("(4) the four minimum conditions, in the published scenario's words and order", JSON.stringify(listed) === JSON.stringify(CONDITIONS), JSON.stringify(listed));
  const words = d.getElementById("main").textContent;
  check("(4) the funding vocabulary: qualifies for, never earn, money, pool, draw or the dollars",
    /qualifies for/.test(words) && !/\bearn(s|ed|ing)?\b|\bmoney\b|\bpool\b|\bdraw\b|the dollars/i.test(words));
  check("(4) no dollar figure", !/\$\s?\d/.test(words));

  // (5)
  const cards = Array.from(d.querySelectorAll("#main a.open"));
  check("(5) three cards, each opening a guide", cards.length === 3, cards.length);
  check("(5) each card is a plain https link, so it works with no script",
    cards.every((a) => /^https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/library\//.test(a.getAttribute("href"))));
  check("(5) the first two link the two guides in the Library",
    /adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5\/$/.test(cards[0].href) && /jst-how-to-obtain-and-upload-to-map-mwdq6m67\/$/.test(cards[1].href));
  check("(5) the third reads How to confirm and points at the page's own steps",
    cards[2].textContent === "How to confirm" && cards[2].hash === "#how-to-confirm" && !!d.getElementById("how-to-confirm"));
  check("(5) no card opens a separate tab", cards.every((a) => !a.hasAttribute("target")));

  // (6)
  const click = (a, opts) => { const e = new w.MouseEvent("click", Object.assign({ bubbles: true, cancelable: true }, opts || {})); a.dispatchEvent(e); return e; };
  const esc = () => d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  cards[0].focus();
  const e1 = click(cards[0]);
  const gp = d.querySelector(".gp");
  check("(6) a card opens a panel on the page instead of leaving it", e1.defaultPrevented && gp && !gp.hidden);
  check("(6) the panel is a modal dialog named by its title", gp && gp.getAttribute("role") === "dialog" && gp.getAttribute("aria-modal") === "true" &&
    d.getElementById(gp.getAttribute("aria-labelledby")).textContent === cards[0].textContent);
  check("(6) focus moves to the panel's title", d.activeElement && d.activeElement.id === "gp-h");
  const fr = gp && gp.querySelector("iframe");
  check("(6) the guide shows in a frame titled for it", fr && fr.getAttribute("src") === cards[0].href && fr.title === cards[0].textContent);
  const out = gp && Array.from(gp.querySelectorAll("a")).find((a) => a.textContent === "Open in a new tab");
  check("(6) Open in a new tab is the plain way out", out && out.href === cards[0].href && out.target === "_blank");
  check("(6) the page behind is inert while the panel is open", d.getElementById("main").closest("[inert]") !== null);
  const guards = gp ? Array.from(gp.children).filter((n) => n.tabIndex === 0 && n.tagName === "SPAN") : [];
  check("(6) the focus trap: a guard at each end of the panel", guards.length === 2 && gp.firstElementChild === guards[0] && gp.lastElementChild === guards[1]);
  guards[1] && guards[1].focus();
  check("(6) tabbing past the end returns to the title", d.activeElement && d.activeElement.id === "gp-h");
  guards[0] && guards[0].focus();
  check("(6) tabbing back past the start reaches Close", d.activeElement && d.activeElement.textContent === "Close");
  esc();
  check("(6) Escape closes it and hands focus back to the card", gp.hidden && d.activeElement === cards[0] && !gp.querySelector("iframe") &&
    d.getElementById("main").closest("[inert]") === null);
  click(cards[2]);
  const steps = gp.querySelectorAll(".gp-copy li");
  check("(6) How to confirm shows the page's four steps beside it, with no duplicate ids", !gp.hidden && steps.length === 4 && gp.querySelectorAll(".gp-copy [id]").length === 0);
  check("(6) its new-tab link is the CPL Initiative Funding page", out.href === "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/");
  Array.from(gp.querySelectorAll("button")).find((b) => b.textContent === "Close").click();
  check("(6) Close shuts it and hands focus back", gp.hidden && d.activeElement === cards[2]);
  const e2 = click(cards[1], { ctrlKey: true });
  check("(6) a Ctrl-click is left to the browser", !e2.defaultPrevented && gp.hidden);
  check("(6) controls in the panel are words", Array.from(gp.querySelectorAll("button")).every((b) => /^[A-Z][a-z ]+$/.test(b.textContent)));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why !== undefined ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\nlibrary_qualify_draft.test.js: ${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
