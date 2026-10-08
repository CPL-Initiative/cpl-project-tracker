// CPL Pathways: a harvested catalog record (ROEP), By requirement and By term.
//
// Sam, 2026-10-04 ~17:20Z: the harvest tab runs the reading and CPL Pathways
// shows it "graphically to the colleges and public"; he approved the mock-up
// (docs/visuals/2026-10-04-cpl-pathways-roep-mockup.html: "mock up looks good").
// The port puts every record the display build holds in the pathway selector
// and renders the mock-up's program view from that build.
//
// Guards the failure modes that would let the view look right and be wrong:
//   (a) every record in the display build is listed, an unchecked one says so,
//       and the selector opens it;
//   (b) the figure is the display build's, never one recomputed here (the
//       page and Sierra must give one answer: methodology-one-build-two-readers);
//   (c) By requirement places every course of every block once, a one-of-several
//       choice reads as one fork, and the CPL marks come from display.courses
//       in words (CPL here, Could adopt, For consideration), never color alone;
//   (d) By term keeps every course in the tray and says where the map stands;
//   (e) the Student or public viewer drops the checks and the gaps, and the
//       gaps carry no button: filing is the harvest tab's write, not this page's;
//   (f) no link is a bare "#" (the dashboard routes tabs on location.hash), and
//       the toggles are labeled groups of aria-pressed buttons;
//   (g) outcomes (record shape 3) show as printed, and a record without them
//       shows no empty section;
//   (h) a read map places each course in the term the display build gave it,
//       and the tray keeps only the courses the map never names;
//   (i) By requirement marks the map's pick inside a choice, On the college's
//       map with its term, and never a required course, a choice left open, or
//       a choice whose options the map names more than one of;
//   (j) a map's course off the program's list shows in its term as recommended
//       by the college outside the program (sheet 50 card 4).

const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");

function freshWindow() {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  w.eval(DATA);
  w.eval(ROEP);
  w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  return w;
}
function pressed(root, value) {
  const b = root.querySelector('.cplpw-rseg button[data-value="' + value + '"]');
  return b && b.getAttribute("aria-pressed") === "true";
}
function click(w, root, value) {
  root.querySelector('.cplpw-rseg button[data-value="' + value + '"]').dispatchEvent(new w.Event("click", { bubbles: true }));
}

// ── (a) the selector lists every record ──
{
  const w = freshWindow();
  const progs = w.CPL_PATHWAYS_ROEP.programs;
  w.CPL_PATHWAYS_TAB.activate();
  const root = w.document.getElementById("cpl-pathways-root");
  const sel = root.querySelector("select.cplpw-select");
  const group = sel && [...sel.querySelectorAll("optgroup")].find((g) => g.label === "Catalog records, Beta draft");
  check("(a) the selector holds a catalog-record group", !!group);
  const opts = group ? [...group.querySelectorAll("option")] : [];
  check("(a) it lists every record in the display build", opts.length === progs.length && progs.length >= 20, opts.length + " of " + progs.length);
  check("(a) each option names the college and the program",
    progs.every((p) => opts.some((o) => o.textContent.startsWith(p.college + " — " + p.title))));
  const unchecked = progs.filter((p) => !p.display.checks.checked).map((p) => p.key);
  check("(a) an unchecked record says so in the list",
    opts.filter((o) => /not yet checked/.test(o.textContent)).length === unchecked.length, unchecked.join(","));
  check("(a) the caption counts the catalog records", /\+ \d+ catalog records/.test(root.textContent));
  const target = opts.find((o) => o.textContent.startsWith("Cerritos College — Apprenticeship: Field Ironworkers"));
  if (target) { sel.value = target.value; sel.dispatchEvent(new w.Event("change", { bubbles: true })); }
  check("(a) choosing one opens its program view",
    !!root.querySelector(".cplpw-roep") && /Apprenticeship: Field Ironworkers/.test(root.querySelector(".cplpw-rprog h2").textContent));
}

// ── (b)-(g) one record rendered directly ──
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158");
  T._roepView.lay = "req"; T._roepView.who = "college";
  T._renderRoepProgram(root, rec);
  const fig = rec.display.figure;
  const label = root.querySelector(".cplpw-rmeter .mlabel").textContent;
  check("(b) the meter states the display build's figure",
    label.includes("Up to " + fig.up_to + " units of the " + fig.total.min + "–" + fig.total.max + " units"), label);
  check("(b) the bar's text alternative says the same",
    root.querySelector(".cplpw-rbar").getAttribute("aria-label") === fig.up_to + " units of " + fig.total.min + "–" + fig.total.max + " units met through CPL");
  check("(b) the view never recomputes the figure (no plan() of its own)",
    !/function\s+roepPlan|function\s+plan\s*\(/.test(SRC));

  const blocks = rec.record.blocks;
  const tiles = [...root.querySelectorAll(".cplpw-rmap .cplpw-rtile")];
  const want = blocks.reduce((n, b) => n + b.courses.length, 0);
  check("(c) every course of every block is a tile, once per block", tiles.length === want, tiles.length + " vs " + want);
  const groups = new Set(blocks.filter((b) => b.option_group).map((b) => b.option_group));
  check("(c) a one-of-several choice reads as one fork per group", root.querySelectorAll(".cplpw-rfork").length === groups.size);
  check("(c) a two-option fork prints its or", groups.size === 0 || root.querySelectorAll(".cplpw-ror").length >= 1);
  const courses = rec.display.courses;
  const hereCodes = Object.keys(courses).filter((k) => courses[k].here && blocks.some((b) => b.courses.some((c) => c.code === k)));
  const hereTiles = tiles.filter((t) => t.classList.contains("here"));
  check("(c) a course with CPL here carries the here style, and only those",
    hereTiles.length === hereCodes.length && hereTiles.every((t) => hereCodes.includes(t.getAttribute("data-code"))), hereTiles.length + " vs " + hereCodes.length);
  check("(c) every styled tile also says CPL here in words",
    hereTiles.every((t) => /CPL here/.test(t.textContent)));
  const adoptCode = Object.keys(courses).find((k) => courses[k].adopt);
  const adoptTile = adoptCode && tiles.find((t) => t.getAttribute("data-code") === adoptCode);
  check("(c) a could-adopt lead is named in words", !adoptCode || (adoptTile && /Could adopt/.test(adoptTile.textContent)));
  check("(c) every band's rule is in words", [...root.querySelectorAll(".cplpw-rband .cplpw-rrule")].every((n) => /^(All of these|Choose )/.test(n.textContent)));
  check("(c) the tiles are list items in a list", tiles.every((t) => t.parentNode.tagName === "UL"));

  // the gaps: read-only, with their trace
  const gaps = root.querySelector("aside.cplpw-rgaps");
  check("(e) the college viewer shows the gaps beside the map", !!gaps && gaps.querySelectorAll(".cplpw-rgap").length === rec.display.gaps.length);
  check("(e) a gap carries no button (filing is the harvest tab's write)", gaps && gaps.querySelectorAll("button").length === 0);
  check("(e) the college viewer shows the four checks", root.querySelectorAll(".cplpw-rchecks > div").length === 4);

  // By term
  click(w, root, "term");
  check("(d) the layout toggle moves to By term", pressed(root, "term") && !pressed(root, "req"));
  const tray = [...root.querySelectorAll(".cplpw-rtray li")];
  const uniq = new Set(blocks.flatMap((b) => b.courses.map((c) => c.code)));
  check("(d) every course waits in the tray, once", tray.length === uniq.size, tray.length + " vs " + uniq.size);
  check("(d) the tray marks CPL in words for a screen reader",
    tray.filter((li) => li.classList.contains("here")).every((li) => /\(CPL here\)/.test(li.textContent)));
  check("(d) the note says where the college's map stands", root.querySelector(".cplpw-rseq").textContent.includes(rec.display.map.text));
  check("(d) four terms, none filled", root.querySelectorAll(".cplpw-rterm").length === 4);

  // public viewer
  click(w, root, "public");
  check("(e) Student or public drops the gaps and the checks",
    !root.querySelector("aside.cplpw-rgaps") && !root.querySelector(".cplpw-rchecks") && pressed(root, "public"));
  check("(e) and tells the reader to confirm with a counselor", /confirm your plan with a counselor/.test(root.querySelector(".procline").textContent));
  check("(d) the layout stays By term across the viewer change", pressed(root, "term"));
  T._roepView.lay = "req"; T._roepView.who = "college";

  // (f) links and toggles
  check("(f) no link is a bare #", [...root.querySelectorAll("a")].every((a) => a.getAttribute("href") && a.getAttribute("href") !== "#"));
  check("(f) the catalog link opens the source", [...root.querySelectorAll(".procline a")].every((a) => a.getAttribute("href") === rec.source_url));
  check("(f) each toggle is a labeled group",
    [...root.querySelectorAll(".cplpw-rseg")].every((g) => g.getAttribute("role") === "group" && w.document.getElementById(g.getAttribute("aria-labelledby"))));
  const ask = root.querySelector("a.cplpw-rask");
  check("(f) Ask Sierra carries the program's question", ask && /^sierra\/\?ask=/.test(ask.getAttribute("href")) && decodeURIComponent(ask.getAttribute("href")).includes(rec.college));
  check("(f) no emoji or icon stands in for a label", !/[\u{1F300}-\u{1FAFF}✅✔◆]/u.test(root.textContent));
}

// ── (b) a record with no CPL, and (g) outcomes ──
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const none = w.CPL_PATHWAYS_ROEP.programs.find((p) => !p.display.figure.up_to);
  T._renderRoepProgram(root, none);
  check("(b) a program with no CPL says so instead of printing zero",
    /No course in this program carries CPL at this college yet/.test(root.textContent) && !/Up to 0/.test(root.textContent));
  check("(g) a record without outcomes shows no outcomes section",
    (none.record.program.outcomes || []).length > 0 || !root.querySelector(".cplpw-routcomes"));

  const withOut = JSON.parse(JSON.stringify(none));
  withOut.record.program.outcomes = ["Demonstrate knowledge of safety guidelines for ironworkers.", "Explain job function differences between structural and reinforcing."];
  T._renderRoepProgram(root, withOut);
  const det = root.querySelector("details.cplpw-routcomes");
  check("(g) outcomes show as printed, one per item",
    det && [...det.querySelectorAll("li")].map((li) => li.textContent).join("|") === withOut.record.program.outcomes.join("|"));
  check("(g) the summary counts them", det && /\(2\)/.test(det.querySelector("summary").textContent));

  const broken = { key: "x", college: "X", title: "Y" };
  T._renderRoepProgram(root, broken);
  check("(b) a record the build lacks says so", /unavailable/.test(root.textContent));
}

// ── (h) a read map places each course in its term (S340) ──
// Santa Monica's Barbering map is read: every course the map names sits in the term the
// display build placed it in (display.map.placed, never matched on the page), a course
// it never names waits in the tray, and CPL here is said in words.
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "smc_43767");
  check("(h) the build holds Santa Monica's read map", rec && rec.display.map.status === "read");
  if (rec) {
    T._roepView.lay = "term"; T._roepView.who = "college";
    T._renderRoepProgram(root, rec);
    const m = rec.display.map;
    const terms = [...root.querySelectorAll(".cplpw-rterm")];
    check("(h) one box per term the map prints, labeled as printed",
      terms.length === m.terms.length && terms.every((t, i) => t.querySelector("h4").textContent.startsWith(m.terms[i].label)),
      terms.length + " vs " + m.terms.length);
    const bad = Object.keys(m.placed).filter((code) => {
      const t = terms[m.placed[code]];
      return !t || ![...t.querySelectorAll("li")].some((li) =>
        li.getAttribute("data-code") === code || (li.getAttribute("data-codes") || "").split(",").includes(code));
    });
    check("(h) every placed course is in the term the build placed it in", !bad.length, bad.join(","));
    const tray = [...root.querySelectorAll(".cplpw-rtray li")].map((li) => li.firstChild.textContent);
    check("(h) the tray holds only the courses the map never names", JSON.stringify(tray) === JSON.stringify(m.not_placed), tray.join(","));
    const here = [...root.querySelectorAll(".cplpw-rterm li.here")];
    check("(h) a term's CPL mark is said in words", here.length > 0 && here.every((li) => /\(CPL here/.test(li.textContent)));
    check("(h) the map's GE and elective slots show as printed, never as a course",
      [...root.querySelectorAll(".cplpw-rterm li.slot")].some((li) => /SMC GE Area/.test(li.textContent)));
    const link = root.querySelector(".cplpw-rseq a");
    check("(h) the note links the college's map", link && link.getAttribute("href") === m.url);
    check("(h) the note gives the map's source", root.querySelector(".cplpw-rseq").textContent.includes(m.text));
    // Sheet 47 card 9: the figure along a read map, stated from the build beside the up-to figure.
    const lines = [...root.querySelectorAll(".cplpw-rmeter .mlabel")].map((n) => n.textContent);
    check("(h) the meter states the figure along the college's map, from the build",
      lines.length === 2 && lines[1].startsWith("Along the college's map: " + rec.display.figure.path + " units of the 26.5 units"), lines.join(" | "));
    const cer = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158");
    T._renderRoepProgram(root, cer);
    check("(h) a program with no read map states no figure along one",
      root.querySelectorAll(".cplpw-rmeter .mlabel").length === 1 && !/Along the college's map/.test(root.textContent));
    T._roepView.lay = "req";
  }
}

// ── (i) the map's pick inside a choice, on By requirement (S341) ──
// Neither read map names a pick today: Irvine Valley's leaves its Art lists as open slots
// and requires ART 85 (which its electives list again), and Santa Monica's prints Salon
// Experience as a choice of all four courses. A fixture map that names one stands in.
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  T._roepView.lay = "req"; T._roepView.who = "college";
  const tileOf = (code, blockName) => [...root.querySelectorAll(".cplpw-rband")]
    .filter((sec) => !blockName || sec.querySelector("h4").textContent === blockName)
    .flatMap((sec) => [...sec.querySelectorAll(".cplpw-rtile")]).filter((t) => t.getAttribute("data-code") === code);
  const marked = () => [...root.querySelectorAll(".cplpw-rmark")].filter((n) => /On the college's map/.test(n.textContent));

  const real = w.CPL_PATHWAYS_ROEP.programs.filter((p) => p.display.map && p.display.map.status === "read");
  check("(i) the build holds four read maps", real.length === 4, real.map((p) => p.key).join(","));
  // Mt. San Antonio's Fire Technology map names the academy route inside the choose
  // block (FIRE 86 and KINF 53, Fall of Year 2): the first real pick on a read map.
  const fireRec = real.find((p) => p.key === "mtsac_03086");
  if (fireRec) {
    T._renderRoepProgram(root, fireRec);
    check("(i) Fire Technology's map marks FIRE 86 and KINF 53 as its pick, with their term",
      JSON.stringify(marked().map((n) => n.closest(".cplpw-rtile").getAttribute("data-code"))) === JSON.stringify(["FIRE 86", "KINF 53"])
      && marked().every((n) => /Fall Semester \(Year 2\)/.test(n.textContent)), marked().map((n) => n.textContent).join(" | "));
  }
  // Its Early Childhood Education map prints both practicum sequences in one term, so
  // it recommends neither (roepGroupSplit).
  const eceRec = real.find((p) => p.key === "mtsac_33876");
  if (eceRec) {
    T._renderRoepProgram(root, eceRec);
    check("(i) a map naming both options of one choice marks no pick in either", marked().length === 0,
      marked().map((n) => n.closest(".cplpw-rtile").getAttribute("data-code")).join(","));
  }
  real.filter((p) => p.key !== "mtsac_03086" && p.key !== "mtsac_33876").forEach((p) => {
    T._renderRoepProgram(root, p);
    check("(i) " + p.key + " marks no pick, since its map names none inside a choice", marked().length === 0
      && !/On the college's map/.test([...root.querySelectorAll(".cplpw-ralt")].map((n) => n.textContent).join("")));
  });

  const smc = JSON.parse(JSON.stringify(real.find((p) => p.key === "smc_43767")));
  const term = smc.display.map.terms.find((t) => t.items.some((it) => it.kind === "choice"));
  term.items = term.items.map((it) => it.kind === "choice"
    ? { kind: "course", codes: ["COSM 95B"], units: "2", text: "COSM 95B · Salon Experience · 2 units" } : it);
  T._renderRoepProgram(root, smc);
  const pick = tileOf("COSM 95B")[0];
  check("(i) a course the map names inside a choice says so in words, with its term",
    pick && /On the college's map/.test(pick.textContent) && pick.textContent.includes(term.label), pick && pick.textContent);
  check("(i) the other courses of that choice carry no mark",
    ["COSM 95A", "COSM 95C"].every((k) => !/On the college's map/.test((tileOf(k)[0] || {}).textContent || "x")));
  check("(i) a required course the map places carries no pick mark",
    !/On the college's map/.test((tileOf("COSM 77")[0] || {}).textContent || "x"));

  const ivc = JSON.parse(JSON.stringify(real.find((p) => p.key === "ivc_10265")));
  const req = ivc.record.blocks.find((b) => b.rule === "all");
  const c40 = req.courses.find((c) => c.code === "ART 40");
  c40.alternatives = [{ code: "ART 99", units: 3 }];
  ivc.display.map.terms[0].items = ivc.display.map.terms[0].items.map((it) => it.codes[0] === "ART 40"
    ? { kind: "course", codes: ["ART 99"], units: "3", text: "ART 99 | Fixture | Major | 3" } : it);
  T._renderRoepProgram(root, ivc);
  const alt = tileOf("ART 40")[0] && tileOf("ART 40")[0].querySelector(".cplpw-ralt");
  check("(i) the map's pick between two courses joined by or is marked on that course",
    alt && /ART 99[^]*On the college's map, Semester 1/.test(alt.textContent), alt && alt.textContent);
  check("(i) and the course the map passes over carries no mark",
    !/On the college's map/.test([...tileOf("ART 40")[0].querySelectorAll(".cplpw-rmark")].map((n) => n.textContent).join("")));
  const art85 = tileOf("ART 85", ivc.record.blocks.find((b) => /additional 6 units/.test(b.name)).name)[0];
  check("(i) a course a required block holds is no pick where an elective list repeats it",
    art85 && !/On the college's map/.test(art85.textContent), art85 && art85.textContent);
}

// ── (j) a map's courses off the program's list (sheet 50 card 4, S346) ──
// A map is accepted when the listed courses it names outnumber its off-list ones; each
// off-list course stays in its term and says, in words, that the college recommends it
// outside the program. Mt. San Antonio's Fire Technology map names KINF 51A, 51B, 52A.
{
  const w = freshWindow();
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "mtsac_03086");
  check("(j) the build holds Fire Technology's read map", rec && rec.display.map.status === "read");
  if (rec) {
    T._roepView.lay = "term"; T._roepView.who = "college";
    T._renderRoepProgram(root, rec);
    const outs = [...root.querySelectorAll(".cplpw-rterm li.outside")];
    check("(j) each off-list course shows in its term", JSON.stringify(outs.map((li) => li.getAttribute("data-codes")))
      === JSON.stringify(["KINF 51A", "KINF 51B", "KINF 52A"]), outs.map((li) => li.getAttribute("data-codes")).join(","));
    check("(j) each says in words that the college recommends it outside the program",
      outs.every((li) => /Recommended by the college outside the program/.test(li.textContent)));
    check("(j) the note names the off-list courses once",
      /names 3 courses the program does not list \(KINF 51A, KINF 51B, KINF 52A\)/.test(root.querySelector(".cplpw-rseq").textContent));
    check("(j) a listed course carries no outside mark",
      ![...root.querySelectorAll(".cplpw-rterm li.outside")].some((li) => /FIRE/.test(li.getAttribute("data-codes") || "")));
    const smc = w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "smc_43767");
    T._renderRoepProgram(root, smc);
    check("(j) a map with nothing off the list shows no outside mark and no such note",
      !root.querySelector("li.outside") && !/does not list/.test(root.querySelector(".cplpw-rseq").textContent));
    T._roepView.lay = "req";
  }
}

let failed = 0;
for (const [name, ok, why] of results) {
  if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
}
console.log((results.length - failed) + "/" + results.length + " CPL Pathways catalog-record view checks passed");
if (failed) process.exit(1);
