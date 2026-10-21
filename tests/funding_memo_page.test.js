// tests/funding_memo_page.test.js
//
// The public guidance memo (funding-model/memo/), Sam 2026-10-21: "Add a link to
// the draft funding guidance memo on the funding table of contents. Don't refer
// to it as 'draft' since we'll finalize it before publishing."
//
// Guards: the page builds the tab's own memo (one source, never a copy), the
// funding page's Contents links it, and neither calls it a draft.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "funding-model", "memo", "index.html"), "utf8");
const page = fs.readFileSync(path.join(ROOT, "funding-model", "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/memo/" });
const w = dom.window, doc = w.document;
w.CPL_FUNDING_NO_REMOTE = true;
w.scrollTo = function () {};
["cpl_funding_data.js", "college_short_names.js", "cpl_funding.js"].forEach(function (f) {
  w.eval(fs.readFileSync(path.join(ROOT, f), "utf8"));
});
Array.from(doc.querySelectorAll("script:not([src])")).forEach(function (s) { w.eval(s.textContent); });

const memo = doc.getElementById("memo");
const text = (memo.textContent || "").replace(/\s+/g, " ");
check("the page paints the tab's own memo", typeof w.CPL_FUNDING_TAB._buildMemo === "function" && memo.querySelectorAll("h2").length > 3);
check("the memo carries its heading and its fields", /MEMORANDUM/.test(text) && /TO:/.test(text) && /RE:/.test(text));
check("the memo opens with SB 135", /Senate Bill 135|SB 135/.test(text));
check("the memo's tables scroll in their own labeled region",
  Array.from(memo.querySelectorAll("table")).every(function (t) { return t.parentNode.getAttribute("role") === "region"; }));
check("every memo header cell carries a scope", Array.from(memo.querySelectorAll("th")).every(function (th) { return th.hasAttribute("scope"); }));
check("nothing on the memo page says draft", !/\bdraft\b/i.test(doc.body.textContent));
check("the page uses tokens, no raw hex outside :root",
  !/#[0-9A-Fa-f]{3,6}\b/.test(html.slice(html.indexOf(".memo h1"), html.indexOf("</style>"))));

const link = /<a id="memo-link" href="memo\/">([^<]+)<\/a>/.exec(page);
check("the funding page's Contents links the memo", !!link);
check("the Contents link does not call it a draft", link && !/draft/i.test(link[1]));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
