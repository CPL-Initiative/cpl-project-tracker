// Edit this page reaches every word of Eligibility requirements (Sam, 2026-11-02, S554:
// "I need to be able to edit Eligibility Requirements text but don't see that I can";
// "Make sure I can edit text areas on the Internal or Public sites").
//
// The block painted its introduction and its conditions from the model and typed its note
// into the markup, and Edit this page offered a word on none of the three. What fails
// without the change: no Edit on the introduction, a condition or the note; a condition's
// save that does not reach the model the Internal view reads; and the two other passages
// still typed into the page (the outcomes' opening, the Dates line) with no Edit.
//
// Windows: 1 (the page). Run from repo root: `node tests/funding_page_requirements_edit.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();

const dom = new JSDOM(read("funding-model/index.html"), { runScripts: "outside-only", url: "https://example.org/funding-model/" });
const w = dom.window, doc = w.document;
w.CPL_FUNDING_NO_REMOTE = true;
w.scrollTo = function () {};
w.Element.prototype.scrollIntoView = function () {};
w.CPL_SESSION = { get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
  isFresh: function () { return true; }, onChange: function () {} };
["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
Array.from(doc.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
w.eval("self = {}");   // framed, as in COBI's Public page view (funding_page_edit.test.js)
w.eval(read("funding-model/edit_page.js"));
const T = w.CPL_FUNDING_TAB;
const click = (el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

click(doc.getElementById("edit-page-btn"));
const items = Array.from(doc.querySelectorAll("#req-list li"));
check("R1: every condition on the list carries the word Edit",
  items.length >= 2 && items.every((li) => !!li.querySelector("[data-pe-reqedit]")));
check("R2: the introduction, the note under the list, the outcomes' opening and the Dates line each carry Edit",
  ["elig_intro", "x_req_note", "x_outcomes_lead", "x_dates_lead"].every((k) => !!doc.querySelector('[data-pe-edit="' + k + '"]')));

click(doc.querySelector('[data-pe-reqedit="coord"]'));
const inp = doc.getElementById("pe-rq-coord");
check("R3: Edit opens the condition's words, focused", !!inp && inp.value === T.reqText("coord") && doc.activeElement === inp);
inp.value = "CPL Coordinator and Noncredit CPL Lead assigned in MAP and meeting regularly";
click(doc.querySelector('[data-pe-reqsave="coord"]'));
check("R4: Save stores the words the Internal view's field reads, and the list shows them",
  T._getShared().coordLabel === "CPL Coordinator and Noncredit CPL Lead assigned in MAP and meeting regularly" &&
  /^CPL Coordinator and Noncredit CPL Lead assigned in MAP and meeting regularly/.test(flat(doc.querySelector('#req-list li[data-reqref="coord"]'))));

click(doc.querySelector('[data-pe-reqedit="part"]'));
const dl = doc.getElementById("pe-rq-deadline");
check("R5: the confirmation's editor carries its deadline beside its words", !!dl && dl.value === T.deadline());
dl.value = "2026-12-31";
click(doc.querySelector('[data-pe-reqsave="part"]'));
check("R6: a new deadline saves and the list prints it", T.deadline() === "2026-12-31" &&
  /2026-12-31/.test(flat(doc.querySelector('#req-list li[data-reqref="part"]'))));

click(doc.querySelector('[data-pe-edit="elig_intro"]'));
const ta = doc.getElementById("pe-ta-elig_intro");
ta.value = "Baseline outcomes to qualify for **implementation funding**:";
click(doc.querySelector('[data-pe-save="elig_intro"]'));
check("R7: the introduction saves as the Internal view's passage and paints with its bold",
  /implementation funding\*\*/.test((T._getShared().text || {}).elig_intro || "") &&
  !!doc.querySelector("#req-intro strong"));

click(doc.querySelector('[data-pe-edit="x_req_note"]'));
const nta = doc.getElementById("pe-ta-x_req_note");
check("R8: the note opens as its plain text, bold kept", !!nta && /^\*\*The Chancellor/.test(nta.value));
nta.value = "Funding follows the outcomes.";
click(doc.querySelector('[data-pe-save="x_req_note"]'));
check("R9: the note saves and the page paints it", flat(doc.querySelector('[data-ftext="x_req_note"]')) === "Funding follows the outcomes.");

click(doc.querySelector('[data-pe-edit="x_outcomes_lead"]'));
check("R10: the outcomes' opening keeps its link as [words](address) in the editor",
  /\[Ed\. Code §78093\.2\(d\)\(1\)\]\(https:\/\/california\.public\.law\/codes\/education_code_section_78093\.2\)/.test(
    doc.getElementById("pe-ta-x_outcomes_lead").value));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
