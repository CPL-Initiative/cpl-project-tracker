// Every reference in Sierra's answers is a link (S500; Sam, 2026-10-27: "I
// just added an instruction for a question on portfolios, directing Sierra to
// start with a link to creditforbeingyou.org. She referenced it correctly but no
// link was embedded. can you fix? I want links embedded for all references in
// sierra.")
//
// Measured before the change: her 13:25Z answer (chat_interactions 35dd9688)
// opened "Start your portfolio at creditforbeingyou.org", quoting his instruction
// (sierra_guidance 14da3fcb) word for word. Both renderers linked only an
// address starting https://, and a markdown mailto link showed as raw text.
//
// What this guards:
//  (a) both renderers (sierra/sierra.js, cpl_chat.js) link a bare domain, a bare
//      email and a markdown mailto link, and leave a trailing period as text;
//  (b) a link is never nested inside another, and bold or a table cell around a
//      domain still links it;
//  (c) no false positives on the words her answers carry (Node.js, e.g., U.S.,
//      3.5 units, ASP.NET);
//  (d) the two renderers agree on all of it;
//  (e) cpl-chat's stable prompt carries LINK_RULE, so every surface that shows
//      her answer gets the link from her, the vendor iframe included;
//  (f) Suggest wording asks for full addresses (Sam, the same afternoon: "maybe
//      the suggest revision procedure should always add the full url to any
//      suggested revisions").
//
// Run from repo root: `npm test` (or `node tests/sierra_links.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function load(src, key) {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/",
  });
  const w = dom.window;
  w.fetch = () => Promise.reject(new Error("no network in test"));
  w.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  w.eval(src);
  return w[key];
}
const SIERRA = load(fs.readFileSync("sierra/sierra.js", "utf8"), "CPL_SIERRA_PAGE");
const CHAT = load(fs.readFileSync("cpl_chat.js", "utf8"), "CPL_CHAT");
const md = (t) => SIERRA.renderMarkdown(t);
const anchors = (h) => (h.match(/<a [^>]*>[\s\S]*?<\/a>/g) || []);

// ── (a) what becomes a link ──
{
  const h = md("Start your portfolio at creditforbeingyou.org — in a few minutes you'll see your options.");
  check("(a) ⭐ the answer Sam saw: creditforbeingyou.org is a link to https://creditforbeingyou.org",
    /<a href="https:\/\/creditforbeingyou\.org" target="_blank" rel="noopener noreferrer">creditforbeingyou\.org<\/a>/.test(h));
  const end = md("Start at creditforbeingyou.org.");
  check("(a) a trailing period stays text", /creditforbeingyou\.org<\/a>\.<\/p>/.test(end));
  const path = md("Find your college at map.rccd.edu/cpllandingpages/, then ask.");
  check("(a) a bare domain with a path keeps the path, not the comma",
    /<a href="https:\/\/map\.rccd\.edu\/cpllandingpages\/"[^>]*>map\.rccd\.edu\/cpllandingpages\/<\/a>, then/.test(path));
  const mail = md("Email MAP@rccd.edu.");
  check("(a) ⭐ a bare email is a mailto link, with no new tab", /<a href="mailto:MAP@rccd\.edu">MAP@rccd\.edu<\/a>\.<\/p>/.test(mail));
  const mdMail = md("Write to [MAP@rccd.edu](mailto:MAP@rccd.edu) any time.");
  check("(a) ⭐ a markdown mailto link renders (it showed as raw text before)",
    /<a href="mailto:MAP@rccd\.edu">MAP@rccd\.edu<\/a> any time/.test(mdMail) && !/\]\(mailto/.test(mdMail));
  const https = md("See https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/.");
  check("(a) a bare https address still links, and its trailing period stays text",
    /<a href="https:\/\/cpl-initiative\.github\.io\/cpl-project-tracker\/fact-sheet\/"[^>]*>https:[^<]*fact-sheet\/<\/a>\.<\/p>/.test(https));
  check("(a) a markdown https link is unchanged",
    /<a href="https:\/\/creditforbeingyou\.org\/main\/student" target="_blank" rel="noopener noreferrer">the portal<\/a>/.test(md("[the portal](https://creditforbeingyou.org/main/student)")));
}

// ── (b) no nesting; bold and cells ──
{
  const inText = md("[the portal at creditforbeingyou.org](https://creditforbeingyou.org/main/student)");
  check("(b) ⭐ a domain inside a markdown link's text makes no second link", anchors(inText).length === 1 && !/<a [^>]*>[^<]*<a /.test(inText));
  const bold = md("Open **creditforbeingyou.org** today.");
  check("(b) a bold domain links inside the bold", /<strong><a href="https:\/\/creditforbeingyou\.org"[^>]*>creditforbeingyou\.org<\/a><\/strong>/.test(bold));
  const cell = md("| College | Page |\n|---|---|\n| Norco | norcocollege.edu/cpl |");
  check("(b) a domain in a table cell links", /<td><a href="https:\/\/norcocollege\.edu\/cpl"[^>]*>norcocollege\.edu\/cpl<\/a><\/td>/.test(cell));
  const paren = md("(see creditforbeingyou.org)");
  check("(b) a closing parenthesis stays text", /creditforbeingyou\.org<\/a>\)/.test(paren));
}

// ── (c) no false positives ──
{
  const h = md("Node.js, e.g. and i.e., ASP.NET, the U.S., 3.5 units, v2.1 and Dr. Smith.");
  check("(c) ⭐ ordinary words with dots make no link", anchors(h).length === 0);
  check("(c) an escaped tag stays escaped", !/<script/.test(md("<script>alert(1)</script> creditforbeingyou.org")));
}

// ── (d) the two renderers agree ──
{
  const sample = "Start at creditforbeingyou.org. Email MAP@rccd.edu or [the team](mailto:MAP@rccd.edu).\n\n"
    + "| a | b |\n|---|---|\n| **map.rccd.edu** | https://x.example/y. |\n\n- (www.cccco.edu/) and Node.js";
  check("(d) ⭐ sierra.js and cpl_chat.js render the same links", SIERRA.renderMarkdown(sample) === CHAT.renderMarkdown(sample));
}

// ── (e) the rule in her built-in instructions ──
{
  const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
  const stable = (SRC.split("const stable = `")[1] || "").split("`;")[0];
  check("(e) ⭐ LINK_RULE is in the stable prompt, beside the naming rule", /\$\{NAMING_RULE\}\s*\$\{LINK_RULE\}/.test(stable));
  let M = null;
  try { M = liftBlock(SRC, "const KNOWN_SURFACES", "function buildSystemPrompt(", ["LINK_RULE"]); } catch (e) { M = null; }
  check("(e) it asks for full addresses, names the quoted case and forbids guessing",
    M && /markdown link with its full address/.test(M.LINK_RULE)
    && /\[creditforbeingyou\.org\]\(https:\/\/creditforbeingyou\.org\)/.test(M.LINK_RULE)
    && /\(mailto:MAP@rccd\.edu\)/.test(M.LINK_RULE)
    && /even when an instruction or source quotes the address without one/.test(M.LINK_RULE)
    && /never guess one/.test(M.LINK_RULE));
  check("(e) it interpolates nothing, so the cached prefix stays the same on every turn",
    M && !/\$\{/.test((SRC.match(/const LINK_RULE = `[^`]*`/) || [""])[0]));
}

// ── (f) Suggest wording writes full addresses ──
{
  const TAB = fs.readFileSync("sierra_training.js", "utf8");
  const rules = (TAB.split("var SUGGEST_RULES = [")[1] || "").split("];")[0];
  check("(f) ⭐ a Suggest wording rule asks for every website as a full markdown link",
    /8\. Write every website as a markdown link with its full address, \[creditforbeingyou\.org\]\(https:\/\/creditforbeingyou\.org\)/.test(rules)
    && /including inside a quotation Sierra is to repeat/.test(rules));
  check("(f) the length cap moved to rule 9", /"\\n9\. At most " \+ max/.test(TAB) && !/"\\n8\. At most "/.test(TAB));
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
