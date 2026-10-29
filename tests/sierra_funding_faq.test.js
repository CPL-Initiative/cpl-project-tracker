// Sierra answers from the CPL funding FAQ (S518). Sam, 2026-10-29: "can you ensure that
// sierra has access to the FAQs so she could answer consistently? Was thinking about
// asking you to categorize the FAQs to make them easier to locate a users question."
//
// The FAQ carries six groups (the page's "## " lines), funding-model/faq.json files it
// from cpl_funding.js for Sierra, and cpl-chat's FUNDING FAQ BLOCK keeps the entries a
// question names. This lifts the block's pure functions out of index.ts and runs them on
// the real faq.json, so the guard is the code that ships.
// Run from repo root: `node tests/sierra_funding_faq.test.js`.
const fs = require("fs");
const path = require("path");
const { liftBlock } = require("./lib/lift_ts");
const builder = require("../scripts/build_funding_faq.js");

const ROOT = path.join(__dirname, "..");
const FN = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/cpl-chat/index.ts"), "utf8");
const FAQ = JSON.parse(fs.readFileSync(path.join(ROOT, "funding-model/faq.json"), "utf8"));
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function finish() {
  let pass = 0;
  for (const [n, ok, why] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "\n        > " + why : "")); if (ok) pass++; }
  console.log(`\nsierra_funding_faq.test.js: ${pass}/${results.length} checks passed`);
  if (pass !== results.length) process.exit(1);
  process.exit(0);
}

// (1) The file is the page's FAQ, in its groups: the six Sam took, and since 2026-10-29 the
// two his new questions opened (Reporting in NOVA, Apprenticeship CPL; S519).
const want = ["Qualifying and confirming", "The funding and its figures", "Reporting in NOVA", "Counting outcomes in MAP",
  "Student records in MAP", "Building CPL at your college", "Apprenticeship CPL", "Credit recommendations and exhibits"];
check("(1) faq.json is current with cpl_funding.js", fs.readFileSync(path.join(ROOT, "funding-model/faq.json"), "utf8") === builder.build());
check("(1) eight groups, 43 questions in the settled order",
  FAQ.groups.map((g) => g.name).join("|") === want.join("|") && FAQ.questions === 43 &&
  FAQ.groups.map((g) => g.items.length).join(",") === "4,11,2,6,5,4,4,7" &&
  FAQ.groups[0].items[0].q === "What must an institution do to qualify for funding?", JSON.stringify(FAQ.groups.map((g) => [g.name, g.items.length])));
check("(1) it links the page's FAQ", FAQ.page === "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/#questions");

let L = null;
try {
  L = liftBlock(FN, "// ── FUNDING FAQ BLOCK START", "// ── FUNDING FAQ BLOCK END",
    ["faqParse", "matchFaq", "buildFaqContext", "faqAsk", "FAQ_RULE", "FAQ_PAGE", "FAQ_MAX_ITEMS"]);
} catch (e) { check("(0) the FAQ block lifts out of index.ts — " + e.message, false); }
check("(0) the FAQ block lifts out of index.ts", !!L && typeof L.matchFaq === "function");
if (!L) finish();

// (2) Sierra parses the text as the page and the builder do.
const groups = L.faqParse(FAQ.plain);
check("(2) Sierra's parse matches the builder's: the same groups, questions and answers", JSON.stringify(groups) === JSON.stringify(FAQ.groups));

const top = (q) => (L.matchFaq(q, groups)[0] || {}).q || "";
// (3) Questions a visitor asks, in their own words, find the entry that answers them.
const asks = [
  ["How does my college confirm participation?", "How does a college confirm its participation?"],
  ["Why won't the form accept my email?", "Why was my email address not accepted?"],
  ["What does Funds Qualified So Far mean on the dashboard?", "What do Max Funds and Funds Qualified So Far mean?"],
  ["Is apprenticeship CPL only for registered apprentices?", "Is Apprenticeship CPL available only to registered apprentices?"],
  ["What goes in our NOVA narrative?", "What information should colleges include in their NOVA narratives?"],
  ["When do colleges receive the funding?", "When will institutions receive their funding?"],
  ["MAP flagged a possible duplicate student. What should I do?", "What should I do when MAP identifies a possible duplicate student?"],
  ["Should we use Quick Adopt or build a new exhibit?", "When should a college use Quick Adopt instead of creating a new exhibit?"],
  ["What is the Noncredit CPL Lead attestation?", "What is the Noncredit CPL Lead attestation?"],
  ["Do consultations and referrals count toward our outcomes?", "Do CPL consultations and student referrals count toward a college's funding outcomes?"],
];
for (const [ask, entry] of asks) check("(3) \"" + ask + "\" finds \"" + entry + "\"", top(ask) === entry, top(ask));
check("(3) at most " + L.FAQ_MAX_ITEMS + " entries ride a turn", L.matchFaq("funding college MAP CPL credit students outcomes exhibits records", groups).length <= L.FAQ_MAX_ITEMS);

// (4) A question the FAQ does not answer brings none.
for (const ask of ["What courses does Norco College offer in welding?", "Hello Sierra", "Who is the president of Riverside City College?"]) {
  check("(4) \"" + ask + "\" brings no FAQ entry", L.matchFaq(ask, groups).length === 0, JSON.stringify(L.matchFaq(ask, groups).map((m) => m.q)));
}

// (5) The section: the entry's answer whole, its group, the link, the rule.
{
  const m = L.matchFaq("How does my college confirm participation?", groups);
  const ctx = L.buildFaqContext(m, groups, false);
  const entry = FAQ.groups[0].items[1];
  check("(5) the section carries the entry's group, question and whole answer, the link and the rule",
    ctx.includes("Group: Qualifying and confirming") && ctx.includes("Q: " + entry.q) && ctx.includes("A: " + entry.a) &&
    ctx.includes(L.FAQ_PAGE) && ctx.includes("HOW TO USE THE CPL FUNDING FAQ SECTION"), ctx.slice(0, 400));
  check("(5) the rule keeps the FAQ's terms and links it once", /keep its conditions, dates, figures, names and steps exactly/.test(L.FAQ_RULE) && /Link the \[CPL funding FAQ\]\(/.test(L.FAQ_RULE));
  check("(5) no fit and no ask: no section", L.buildFaqContext([], groups, false) === "");
}

// (6) A question about the FAQ itself lists every question by group.
{
  check("(6) \"FAQ\" and \"frequently asked\" are asks about the FAQ", L.faqAsk("Can you show me the funding FAQ?") && L.faqAsk("what are the frequently asked questions") && !L.faqAsk("how do I confirm"));
  const ctx = L.buildFaqContext([], groups, true);
  const list = ctx.slice(0, ctx.indexOf("HOW TO USE"));
  check("(6) the list names every group and all 43 questions", want.every((g) => list.includes(g + ":")) && (list.match(/^- /gm) || []).length === 43, (list.match(/^- /gm) || []).length);
}

// (7) Sierra reads the page's FAQ, preferring a curator's saved edit, and it rides her prompt.
check("(7) the turn reads the FAQ beside the library and adds its section to the prompt",
  /const faqRead = fetchFundingFaq\(sb\);\s*\n\s*const \[searchResult/.test(FN) && /const faqGroups = await faqRead;/.test(FN) &&
  /statewideCatalogContext, libraryContext, faqContext\);/.test(FN) && /\$\{libraryContext\}\$\{faqContext\}/.test(FN) &&
  /funding-model\/faq\.json/.test(FN) && /scen\.text\.x_faq/.test(FN));

finish();
