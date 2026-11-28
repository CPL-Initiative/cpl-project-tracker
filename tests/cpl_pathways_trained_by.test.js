// CPL Pathways: Trained by on a program card (Sam, 2026-11-27: "yes, this is what we could want to show: Trained by
// Ironworker JATC").
//
// kb/_build_program_certs.py adds trained_by to a program's entry in kb/status/program_certs/<slug>.json: the
// apprenticeship training committees whose credentials give credit at the college on the program's courses.
//
// WHAT THIS GUARDS:
//   (a) a program with trained_by and no certification: the control shows alone, no Industry certs control;
//   (b) the control is an underlined-word button reading "Trained by" and the short name, its label the full name;
//   (c) the click opens the sidebar beside the view, headed Trained by, with the committee's full name, the program's
//       courses it covers and each credential with its courses;
//   (d) a program with both groups shows both controls, and each opens its own sidebar;
//   (e) a second click on the control shuts the sidebar.
//
// Run from repo root: `npm test` (or `node tests/cpl_pathways_trained_by.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const DIR = "kb/status/program_certs/";

const TRAINED = [{ a: "Ironworker Joint Apprenticeship Training Committee", s: "Ironworker JATC",
  creds: [{ t: "Ironworker Apprenticeship — Cranes", courses: ["IWAP 40.50"] },
          { t: "Ironworker Apprenticeship — Reinforcing, Period 1", courses: ["IWAP 40.07", "IWAP 40.50"] }],
  courses: ["IWAP 40.07", "IWAP 40.50"] }];
const ONLY = { college: "Cerritos College", slug: "cerritos", programs: { "42158": { trained_by: TRAINED } } };
const BOTH = { college: "Cerritos College", slug: "cerritos", programs: { "42158": { trained_by: TRAINED,
  earns_cpl_here: [{ t: "OSHA 30-Hour Construction", i: "OSHA", courses: ["IWAP 40.07"], exhibits: [] }] } } };

async function render(file) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  w.fetch = (url) => {
    const u = String(url);
    if (u === DIR + "index.json") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ colleges: { "Cerritos College": "cerritos" } }) });
    if (u === DIR + "cerritos.json") return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(file) });
    if (/kb\/status\//.test(u)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  };
  w.eval(DATA); w.eval(ROEP); w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  const T = w.CPL_PATHWAYS_TAB, root = w.document.getElementById("cpl-pathways-root");
  const rec = JSON.parse(JSON.stringify(w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158")));
  T._roepView.lay = "req"; T._roepView.who = "college";
  let threw = null;
  try { T._renderRoepProgram(root, rec); } catch (e) { threw = e; }
  for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
  return { w, root, threw };
}
const click = (w, n) => n.dispatchEvent(new w.Event("click", { bubbles: true }));

(async () => {
  let r = await render(ONLY);
  let { w, root } = r;
  const tb = root.querySelector(".cplpw-rtrained-open");
  const buttons = Array.from(root.querySelectorAll(".cplpw-rcerts .cplpw-rcerts-open"));
  check("(a) nothing thrown, the control shows alone", !r.threw && tb && buttons.length === 1, r.threw ? String(r.threw) : buttons.length);
  check("(b) a button on the program card reading Trained by and the short name",
    tb && tb.tagName === "BUTTON" && tb.type === "button" && tb.closest(".cplpw-rprog") && tb.textContent === "Trained by Ironworker JATC", tb && tb.textContent);
  check("(b) its label names the committee in full and says the sidebar is shut",
    tb && /Ironworker Joint Apprenticeship Training Committee/.test(tb.getAttribute("aria-label")) && tb.getAttribute("aria-expanded") === "false"
      && tb.getAttribute("aria-controls") === "cplpw-cside", tb && tb.getAttribute("aria-label"));
  click(w, tb);
  let side = root.querySelector("aside.cplpw-cside");
  check("(c) the sidebar opens beside the view, headed Trained by", side && side.parentNode.classList.contains("open")
    && side.querySelector(".cplpw-cside-head h3").textContent === "Trained by" && side.querySelector(".cplpw-cside-close"), side && side.outerHTML.slice(0, 300));
  check("(c) the committee's full name heads the body", side && side.querySelector(".trained h4").textContent === "Ironworker Joint Apprenticeship Training Committee");
  check("(c) the lede names the college and the courses", side && /Cerritos College for 2 courses in this program: IWAP 40\.07, IWAP 40\.50\./.test(side.querySelector(".trained .lede").textContent),
    side && side.querySelector(".trained .lede").textContent);
  const items = side ? Array.from(side.querySelectorAll(".trained li")) : [];
  check("(c) each credential with its courses", items.length === 2 && items[1].querySelector(".t").textContent === "Ironworker Apprenticeship — Reinforcing, Period 1"
    && items[1].querySelector(".k").textContent === "Gives credit for IWAP 40.07, IWAP 40.50", items.map((i) => i.textContent));
  check("(c) the control says the sidebar is open", tb.getAttribute("aria-expanded") === "true");
  click(w, tb);
  check("(e) a second click shuts it", !root.querySelector("aside.cplpw-cside"));

  r = await render(BOTH);
  ({ w, root } = r);
  const both = Array.from(root.querySelectorAll(".cplpw-rcerts .cplpw-rcerts-open")).map((b) => b.textContent);
  check("(d) both controls show", both.length === 2 && both[0] === "Trained by Ironworker JATC" && both[1] === "Industry certs (1)", both);
  click(w, root.querySelectorAll(".cplpw-rcerts .cplpw-rcerts-open")[1]);
  side = root.querySelector("aside.cplpw-cside");
  check("(d) Industry certs still opens its own sidebar", side && side.querySelector(".cplpw-cside-head h3").textContent === "Industry certs"
    && side.querySelector(".earns"));

  let fail = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok   " : "  FAIL ") + name + (ok ? "" : "  -- " + JSON.stringify(why)));
    if (!ok) fail++;
  }
  console.log(results.length - fail + "/" + results.length + " checks passed: CPL Pathways trained by");
  process.exit(fail ? 1 : 0);
})();
