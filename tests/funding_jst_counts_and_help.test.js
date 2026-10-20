// The JST figures, the Coordinator help and the explainer's help items (Sam,
// 2026-10-20): the seed outcome and the implementation condition both carry
// the JSTs in MAP, the enrolled veterans MIS reports and the JSTs that reach
// 75%; the Coordinator's How to meet it names office hours and the MAP
// Dashboard chat; Choose another institution sits beside the Step 2 title.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const ROOT = path.join(__dirname, "..");
let fails = 0;
function check(name, ok) { console.log((ok ? "  ok  " : "  FAIL ") + name); if (!ok) fails++; }

const src = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");
check("(a) the Coordinator passage links office hours and the MAP Dashboard chat",
  /mc_how_coord[\s\S]{0,1500}map\.rccd\.edu\/get-involved[\s\S]{0,300}chat on the \[MAP Dashboard\]\(https:\/\/cpldashboardcccco\.azurewebsites\.net\/insights\/dashboard\)/.test(src));
check("(b) the section is Funding Model Numbers everywhere", !/What is a choice, and what is a given/.test(src) &&
  !/What is a choice, and what is a given/.test(fs.readFileSync(path.join(ROOT, "funding-model/index.html"), "utf8")));

// jstNeedWords, run on its own over a stub feed.
const m = src.match(/function jstNeedWords\(college\) \{[\s\S]*?\n  \}/);
check("(c) jstNeedWords exists", !!m);
if (m) {
  const fmtInt = (n) => Number(n).toLocaleString("en-US");
  const fmtPctTrim = (v) => String(parseFloat((v * 100).toFixed(2))) + "%";
  let PF = null;
  const perf = () => PF;
  const f = new Function("perf", "fmtInt", "fmtPctTrim", m[0] + "; return jstNeedWords;")(perf, fmtInt, fmtPctTrim);
  PF = { vet_star_threshold: 0.75, vet_jst: { A: { vets: 296, jst: 152 }, B: { vets: 182, jst: 386 },
    C: { vets_suppressed: true, jst: 40 } } };
  check("(c1) short of 75%: the counts, what 75% takes, and how many more",
    f("A") === "MAP holds 152 JSTs, and MIS reports 296 enrolled veterans. 75% takes 222 JSTs, 70 more than today.");
  check("(c2) past 75%: no shortfall", /takes 137 JSTs, which the college has\.$/.test(f("B")));
  check("(c3) a masked count gives nothing", f("C") === "");
  check("(c4) no counts in the feed gives nothing", f("Z") === "");
}

// The explainer's Contents keeps the help items after the video.
const html = fs.readFileSync(path.join(ROOT, "funding-model/index.html"), "utf8");
const dom = new JSDOM(html);
const tails = Array.from(dom.window.document.querySelectorAll("#toc-list li.toc-tail a")).map((a) => a.getAttribute("href"));
check("(d) video, office hours, landing page, then the training video",
  /funding_in_motion/.test(tails[0]) && tails[1] === "https://map.rccd.edu/get-involved/" &&
  tails[2] === "https://map.rccd.edu/cpllandingpages/" && tails[3] === "https://www.youtube.com/watch?v=xW0I6iFgRuk");
check("(d2) the landing page link's hover recommends office hours",
  /office hours/.test(dom.window.document.getElementById("landing-link").getAttribute("title")));

console.log("funding_jst_counts_and_help.test.js: " + (fails ? fails + " FAILED" : "all passed"));
if (fails) process.exit(1);
