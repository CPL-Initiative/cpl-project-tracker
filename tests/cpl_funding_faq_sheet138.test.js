// The funding FAQ as Sam settled it (Open Asks Sheet 138, 2026-10-28, all 21
// cards his own call; text in CPLBrain/decision-sheets/open-asks/
// 2026-10-28-funding-faq-138.json and the sheet's replies store).
//
//   card 1  his draft, "the funding procedure" (Sam in session: "funding
//           procedure is beter", no longer proposed), plus his added sentence
//           on Priority 1
//   2, 4, 6, 7, 17  his own answers, verbatim (7's "pubic" read "public")
//   8       left out: "we are no longer linking adoption of statewide exhibits
//           to the funding outcomes"
//   9       his answer as written (Open Asks Sheet 139 card 2: "it is important
//           to use the term because funding distributed through the
//           apportionment procedure can get buried at the colleges")
//
// Malone's twelve (via Sam in session, 2026-10-28: "add them to our funding
// FAQs") join each group in place, as he wrote them (Sam: "push them as
// written by Malone"; "It's OK to lead with negatives as long as it's human
// authored"). His refresh
// question stays out: the page's own refresh question answers it.
//
// This reads the house text itself, so a later edit that drops his wording or
// brings card 8 back fails here.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_faq_sheet138.test.js`).
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "..", "cpl_funding.js"), "utf8");
let pass = 0, fail = 0;
function check(name, ok) { ok ? pass++ : fail++; console.log((ok ? "PASS  " : "FAIL  ") + name); }

const m = /var FAQ_DEFAULT_PLAIN = (\[[\s\S]*?\])\.join\("\\n\\n"\);/.exec(src);
check("FAQ_DEFAULT_PLAIN is found", !!m);
const paras = m ? vm.runInNewContext(m[1]) : [];
const text = paras.join("\n\n");
const qs = paras.filter((p) => /^Q: /.test(p)).map((p) => p.slice(3));
const answer = (q) => { const i = paras.indexOf("Q: " + q); let a = []; for (let j = i + 1; i >= 0 && j < paras.length && !/^Q: /.test(paras[j]); j++) a.push(paras[j]); return a.join("\n\n"); };

check("37 questions: 19 from the sheet, the 6 already on the page, and Malone's 12", qs.length === 37);
check("the rollout's basics lead: qualify, then confirm",
  qs[0] === "What must an institution do to qualify for funding?" && qs[1] === "How does a college confirm its participation?");
check("help comes last, with the support address",
  qs[qs.length - 1] === "Where can a college get help setting up its MAP records?" &&
  /map@rccd\.edu/.test(answer(qs[qs.length - 1])));

const c1 = answer("Do CPL consultations and student referrals count toward a college's funding outcomes?");
check("card 1: his draft says the funding procedure measures, never proposed",
  /the funding procedure measures outcomes based on CPL units recorded in MAP/.test(c1) && !/proposed/.test(c1));
check("card 1: his added sentence on Priority 1",
  /by screening incoming students for CPL, colleges will inevitably improve their Priority 1 outcomes and funding/.test(c1));
check("card 2: his answer, Request Quick Adopt toward Access",
  /counselors can use the Request Quick Adopt function on the MAP Dashboard/.test(answer("How can counselors help colleges meet the CPL funding outcomes?")));
check("card 4: his answer names Credit for Being You",
  /Credit for Being You \(creditforbeingyou\.org\)/.test(answer("How can we institutionalize CPL?")));
check("card 6: his answer, the COR is not a requirement of regulation",
  /it is not a requirement of regulation/.test(answer("What are the benefits and drawbacks of including CPL in the course outline of record?")));
const c7 = answer("How do statewide credit recommendations become official and appear in MAP?");
check("card 7: his answer in two paragraphs, 'public' spelled out",
  /MAP has a built in approval process/.test(c7) && /visible to the public\./.test(c7) && c7.split("\n\n").length === 2);
check("card 8 stays out", !/not yet recognize as adopted|does not yet recognize/.test(text));
check("card 17: his answer with the percentages",
  /Noncredit is about 6 percent of the institutions' combined FTES, and the Chancellor's Office set noncredit's portion at 15 percent/
    .test(answer("How was the funding divided between credit and noncredit?")));
const c9 = answer("Where does the CPL funding go, and who receives it?");
check("card 9: his answer as written, apportionment named twice",
  /^CPL funding is provided to colleges through the apportionment process/.test(c9) &&
  /funds are disbursed using the apportionment procedure/.test(c9) &&
  /ask about the funds and their intended use\.$/.test(c9));
check("...and apportionment appears nowhere else in the FAQ", (text.match(/apportion/gi) || []).length === 2);
check("card 9 sits after the timing question", qs.indexOf("Where does the CPL funding go, and who receives it?") ===
  qs.indexOf("When will institutions receive their funding?") + 1);
check("the six questions already on the page stay",
  ["Has the Chancellor's Office released guidance for this funding?",
   "What qualifies as a student record in MAP for reporting purposes?",
   "Should a college record students who receive a CPL consultation but do not submit a petition?",
   "How should a college distinguish consultations, submitted petitions, and transcribed CPL units?",
   "Will there be guidance on minimum data entry, so colleges report on a consistent basis?"].every((q) => qs.includes(q)));

const malone = [
  "Does one college earning more funding reduce the amount available to other colleges?",
  "Are the CPL Funding Dashboard totals limited to the current academic year?",
  "Does MAP actually award or transcribe CPL credit?",
  "What is a MAP CPL plan (petition)?",
  "How should a college document that a student accepted the credit?",
  "What should I do when MAP identifies a possible duplicate student?",
  "Will merging duplicate student records erase or duplicate CPL decisions?",
  "Who determines whether prior learning is equivalent to a college course?",
  "When should a college use Quick Adopt instead of creating a new exhibit?",
  "Does creating an exhibit automatically mean that credit has been approved?",
  "Why might a certification or experience not appear in a MAP search?",
  "What should a student do if the Student Portal does not find an exact match?"];
check("Malone's twelve are all here", malone.every((q) => qs.includes(q)));
check("Malone: one college's progress takes nothing from another, as he wrote it",
  /^No\. Each college has its own maximum award\./.test(answer(malone[0])));
check("Malone: Admissions and Records transcribes, in the student information system",
  /Admissions and Records team completes the official transcription in its student information system/.test(answer(malone[2])));
check("Malone: faculty determine equivalency",
  /^Faculty determine the academic equivalency and appropriate credit\./.test(answer(malone[7])));
check("Malone's counting questions sit with counting CPL in MAP, before building CPL",
  qs.indexOf(malone[2]) > qs.indexOf("Will there be guidance on minimum data entry, so colleges report on a consistent basis?") &&
  qs.indexOf(malone[6]) < qs.indexOf("Where can a college get support to make CPL easier for students to find and use?"));

console.log("\n" + pass + "/" + (pass + fail) + " assertions passed");
process.exit(fail ? 1 : 0);
