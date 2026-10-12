// CPL Pathways UI pass (S367, after Open Asks Sheet 65 card 2 lifted the ledger hold).
//
// Guards what the pass changed, each a failure the sweep cannot see:
//   (a) the catalog record's provenance line never repeats "college's": the
//       custom_html platform read "Long Beach City College's college's own catalog
//       pages reading procedure", visible once the table served Long Beach City;
//   (b) controls are underlined words (Sam, 2026-10-09): the record's Lay out and
//       Viewer toggles, Ask Sierra, the PDF button, Quick Adopt and the ladder's open
//       button carry no border or fill and are underlined at rest; in a toggle set the
//       view in use is the word that is not underlined, in weight;
//   (c) the Student / College toggle is a labeled group whose buttons carry
//       aria-pressed, and a click moves it (never color alone);
//   (d) no emoji stands in a control label or a section heading of the directory
//       card (the plain-words rule).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only", pretendToBeVisual: true });
const w = dom.window;
["requestAnimationFrame"].forEach(function (k) { if (!w[k]) w[k] = function (cb) { return setTimeout(cb, 0); }; });
w.eval(ROEP);
w.eval(SRC);
const T = w.CPL_PATHWAYS_TAB;
const root = w.document.getElementById("cpl-pathways-root");

// ── (a) ──
{
  const base = w.CPL_PATHWAYS_ROEP.programs[0];
  const rec = JSON.parse(JSON.stringify(base));
  rec.college = "Long Beach City College";
  rec.platform = "custom_html";
  T._renderRoepProgram(root, rec);
  const card = root.querySelector(".cplpw-rprog");
  const line = card ? (card.textContent.match(/Read from[^.]*\./) || [""])[0] : "";
  check("(a) the custom_html provenance names the college once", /Long Beach City College's catalog pages reading procedure/.test(line), line);
  check("(a) and never \"college's college's\"", !/college's college's/i.test(card ? card.textContent : ""), line);
}

// ── (b) the injected rules ──
function rule(sel) {
  const css = Array.from(w.document.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp("(?:^|[}\\n\"])\\s*" + esc + "\\s*\\{([^}]*)\\}").exec(css);
  return m ? m[1] : null;
}
function isWord(body) {
  return !!body && /background:\s*none/.test(body) && /border:\s*0/.test(body) && /text-decoration:\s*underline/.test(body)
    && /min-height:\s*24px/.test(body) && /var\(--cobalt\)/.test(body);
}
{
  // the record view's CSS is injected when a record renders (above); the tab's own CSS
  // when the tab activates.
  T.activate();
  check("(b) the record's toggles are underlined words", isWord(rule(".cplpw-rseg button")), rule(".cplpw-rseg button"));
  const on = rule(".cplpw-rseg button[aria-pressed='true']");
  check("(b) the view in use is the word not underlined, in weight", !!on && /text-decoration:\s*none/.test(on) && /font-weight:\s*700/.test(on), on);
  const ask = rule(".cplpw-rask");
  check("(b) Ask Sierra is an underlined word", !!ask && /text-decoration:\s*underline/.test(ask) && !/border:\s*1px/.test(ask) && /min-height:\s*24px/.test(ask), ask);
  check("(b) the PDF button is an underlined word", isWord(rule(".cplpw-pdfbtn")), rule(".cplpw-pdfbtn"));
  check("(b) Quick Adopt's buttons are underlined words", isWord(rule(".cplpw-qa .go")), rule(".cplpw-qa .go"));
  // the ladder's CSS is injected only when a ladder renders; read its rule from the source
  const lopen = (/"\.cplpw-lopen \{([^}]*)\}"/.exec(SRC) || [])[1] || null;
  check("(b) the ladder's open button is an underlined word", isWord(lopen), lopen);
}

// ── (c) + (d) the Student / College toggle ──
{
  const ccr = {
    articulated: [{ subj: "FIPT", num: "105", title: "Fire Behavior and Combustion", certs: ["State Fire Training Cert"],
      ref: { kind: "CCR", id: "FIRE M1268", title: "Fire Behavior and Combustion" }, agree: 3, peers: ["Butte College"], flag: null }],
    units_total: 3, opportunities: [],
  };
  const box = T._renderCcrViews({ college: "San Diego Miramar College" }, ccr);
  w.document.body.appendChild(box);
  const tog = box.querySelector(".ccr-toggle");
  const bs = Array.from(box.querySelectorAll(".ccr-toggle .ccr-vt"));
  check("(c) the toggle is a labeled group", !!tog && tog.getAttribute("role") === "group" && !!tog.getAttribute("aria-label"));
  check("(c) each button carries aria-pressed, the student view pressed", bs.length === 2
    && bs[0].getAttribute("aria-pressed") === "true" && bs[1].getAttribute("aria-pressed") === "false");
  bs[1].dispatchEvent(new w.Event("click", { bubbles: true }));
  check("(c) a click moves it", bs[0].getAttribute("aria-pressed") === "false" && bs[1].getAttribute("aria-pressed") === "true"
    && box.classList.contains("view-college"));
  const vt = rule(".cplccr .ccr-vt");
  check("(c) its buttons are underlined words, no fill", !!vt && /background:\s*none/.test(vt) && /text-decoration:\s*underline/.test(vt) && /min-height:\s*24px/.test(vt), vt);
  const vton = rule(".cplccr .ccr-vt.on");
  check("(c) the view in use is marked in weight, never a fill", !!vton && /font-weight:\s*700/.test(vton) && !/background/.test(vton), vton);
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
  check("(d) no emoji in the toggle's labels", bs.every((b) => !EMOJI.test(b.textContent)), bs.map((b) => b.textContent));
}
{
  // the directory card's two section headings
  check("(d) no emoji before the directory card's section headings",
    !/"k", "(📘|🎖)/u.test(SRC) && !/ccrVtBtn\("(🎓|🏛)/u.test(SRC));
}

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " CPL Pathways UI pass checks passed");
if (failed) process.exit(1);
