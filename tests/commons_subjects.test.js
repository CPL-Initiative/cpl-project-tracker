// The CPL Commons' Subjects card and its list (S694; Sam, 2026-11-20: "don't we need a commons card for subjects to
// house the common subjects and local subject titles we'll be establishing from catalog data?").
//
// WHAT THIS GUARDS (each a way the card or the list would mislead):
//   (1) ⭐ the card sits first in Curate, before Courses and M-IDs (Step a and b come before Step c, the M-ID);
//   (2) ⭐ each Step b figure opens what it counts: the drafted titles and the colleges open #commons/subjects, the
//       one-sided codes open #commons/subjects/disagree, and Step a's figure opens the Common Subjects Reference;
//   (3) a missing titles file reads TBA on the card and the page still draws;
//   (4) the list opens from its address, from a college's address and from the curator's list address, and a college
//       whose catalog prints no names reads TBA (in its row and in each code's title);
//   (5) a press on a college moves the address, and the view reports it (every view has an address);
//   (6) the tables carry th scope, a labeled scrolling region, and the view stores nothing;
//   (8b) ⭐ Sam, 2026-11-25: a recommendation draws CPL_COMMONS.confBar from its 0-100 confidence, never a level word;
//   (12) S718 (Sam, 2026-11-23: "add a short bulleted set of quick links to prioritized action needed ... we can default
//       display the cards collapsed all but the tops sections"): ⭐ the card's top section carries the quick links, each
//       with its live count and a target that exists; Collect, Curate and Connect start folded behind a button with
//       aria-expanded; a quick link opens the folded stage it points into, scrolls there and focuses the check.
// The fixture (tests/fixtures/local_subject_titles_fixture.json) stands in for the live file, so these hold whatever
// catalogs are filed later.
//
// Run from repo root: `npm test` (or `node tests/commons_subjects.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_front.js", "commons_subjects.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const FIX = JSON.parse(fs.readFileSync("tests/fixtures/local_subject_titles_fixture.json", "utf8"));
const FILES = {
  "kb/status/commons.json": JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8")),
  "kb/status/program-requirements.json": JSON.parse(fs.readFileSync("kb/status/program-requirements.json", "utf8")),
  "kb/status/commons_data.json": JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8")),
  "kb/reference/industry_credential_skills.json": JSON.parse(fs.readFileSync("kb/reference/industry_credential_skills.json", "utf8")),
  "kb/status/local_subject_titles.json": FIX,
  "kb/status/mid_readiness.json": JSON.parse(fs.readFileSync("kb/status/mid_readiness.json", "utf8")),
  "kb/status/noncredit_subject_titles.json": { _rule: "Two headings are one title when they are equal after folding.",
    mq: { "Parenting": { mq_discipline: "Parent Education: Noncredit", common_code: "PARN" }, "Citizenship for Immigrants": { mq_discipline: "Citizenship: Noncredit", common_code: null } },
    programs: [{ slug: "p1", college: "Program One" }, { slug: "p2", college: "Program Two" }],
    totals: { titles: 3, headings: 4, titles_in_two_or_more_programs: 1, with_common_code: 1, category_without_code: 1, no_noncredit_course_in_coci: 1 },
    titles: [{ title: "Parent Education", printed_as: ["Parenting", "Parent Education"], programs: 2, members: [{ college: "p1", code: "PARN" }, { college: "p2", code: "PRNT" }], catalog_courses: 70,
        category: "Parenting", category_share: 0.9, categories: [["Parenting", 9], ["Workforce Preparation", 1]], state: "several categories", common_code: "PARN" },
      { title: "Citizenship", printed_as: ["Citizenship"], programs: 1, members: [{ college: "p2", code: "CTZN" }], catalog_courses: 1, category: "Citizenship for Immigrants", category_share: 1, categories: [["Citizenship for Immigrants", 1]], state: "one category", common_code: null },
      { title: "Kids College", printed_as: ["Kids College"], programs: 1, members: [{ college: "p1", code: "KIDS" }], catalog_courses: 278, category: null, category_share: null, categories: [], state: "no noncredit course in COCI", common_code: null }] },
  "kb/status/subject_courses/alpha.json": { college: "Alpha College", slug: "alpha", columns: ["number", "title", "band", "listed", "units", "cid", "ccn", "mid"],
    codes: { MATH: [["1", "Algebra", "C", "Both", 4, "MATH 151", "", "MATH M1001"], ["2", "Statistics", "C", "COCI", 4, "", "STAT C1000", ""],
      ["300", "Math Lab", "N", "COCI", 0, "", "", ""], ["9", "Topics", "", "Catalog", "1", "", "", ""]], "ES/A": [["5", "Yoga", "C", "Both", 1, "", "", ""]] } },
  "kb/status/local_subject_recommendations.json": { colleges: [{ slug: "alpha", rows: [{ code: "MATH",
    title: { title: "Mathematics", confidence: 70, from: "other_colleges", why: "other colleges: 3 of 3 other colleges (all agree).", also: [{ title: "Math Lab", from: "program_titles" }] },
    common: { code: "MATH", discipline: "Mathematics", confidence: 80, from: "own_courses", why: "4 of 4 of its courses with an M-ID sit under MATH." } }] }] }
};

function load(hash, files) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="tab-commons"><div id="commons-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = dom.window, o = {};
  let writes = 0;
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { writes++; o[k] = String(v); }, removeItem: (k) => { delete o[k]; } }, configurable: true });
  const all = Object.assign({}, FILES, files || {});
  w.fetch = function (url) {
    const hit = all[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, store: o, writes: () => writes };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 30; i++) await tick(); }

(async function () {
  /* (1)-(2) the card on the front page */
  let x = load("#commons");
  await x.M.boot(); await settle();
  let d = x.d;
  const curate = Array.from(d.querySelectorAll(".cmf-group")).find((g) => txt(g.querySelector(".cmf-group-h")) === "Curate");
  const first = curate && curate.querySelector(".cmf-card");
  check("(1) ⭐ Subjects is the first card in Curate", first && first.getAttribute("data-key") === "subjects" && txt(first.querySelector(".cmf-card-t")) === "Subjects");
  check("(1) Courses and M-IDs follows it", curate && curate.querySelectorAll(".cmf-card")[1].getAttribute("data-key") === "courses");
  const links = Array.from(first.querySelectorAll(".cmf-body a"));
  const by = (t) => links.find((l) => txt(l).indexOf(t) >= 0 && !l.hasAttribute("data-onpage"));
  check("(2) ⭐ the drafted titles open the subjects list", by("3 local titles") && by("3 local titles").getAttribute("href") === "#commons/subjects");
  check("(2) ⭐ the colleges open the subjects list", by("1 of 2 colleges") && by("1 of 2 colleges").getAttribute("href") === "#commons/subjects");
  check("(2) the titles to check open their list, each reason counted", by("3 titles to check") && by("3 titles to check").getAttribute("href") === "#commons/subjects/disagree"
    && /\(1 not in catalog, 2 not read yet, 0 blocked\)/.test(txt(first)) && !/on hold/.test(txt(first)));
  check("(2) Step a's figure opens the Common Subjects Reference", links.some((l) => l.getAttribute("href") === "#canonical-subj4" && /disciplines settled/.test(txt(l))));
  const shown = (() => { const c = d.body.cloneNode(true); c.querySelectorAll("script, style").forEach((n) => n.remove()); return txt(c).replace(/SkyView/g, ""); })();
  check("(2) ⭐ S722 (Sam, 2026-11-24: \"no one outside of the map team knows we call you sky\"): the Commons never names Sky in rendered text",
    !/\bSky\b/.test(shown) && shown.length > 500);
  check("(2) the card names who does each check", /Owner: the Courses bot/.test(txt(first)) && /Who: the nightly data collection/.test(txt(first)) && /(Owner: a curator|Done: all)/.test(txt(first)));
  /* Sam's mock of 2026-11-23: the share of courses under a Confident code, then four checks under Collect, Curate and
     Connect, each with a Where to act line. */
  const stages = Array.from(first.querySelectorAll(".cmf-stage")).map(txt);
  const checks = Array.from(first.querySelectorAll(".cmf-check-h > strong")).map(txt);
  check("(2) ⭐ four checks under Collect, Curate and Connect, each with its Where to act line",
    stages.join(",") === "Collect,Curate,Connect" && checks.join("|") === "1. Each college’s own subject titles|2. A Confident common code for every local code|3. No course held for want of a code|4. Re-mint scopes ready"
    && first.querySelectorAll(".cmf-act").length === 4 && Array.from(first.querySelectorAll(".cmf-act")).every((p) => /^Where to act:/.test(txt(p)) && p.querySelector("a")), stages + " " + checks);
  /* (11) the quick links and the folded stages (S718) */
  const quick = first.querySelector("#cmf-subj-quick");
  const ql = quick ? Array.from(quick.querySelectorAll("a[data-onpage]")) : [];
  check("(12) ⭐ the quick links sit at the top of the card, before the Why list and the stages", quick && first.querySelector(".cmf-body").firstElementChild === quick && ql.length >= 2 && ql.length <= 5);
  check("(12) ⭐ each quick link carries its live count and points to a check that exists", ql.every((l) => /^[\d,]+ /.test(txt(l)) && first.querySelector("#" + l.getAttribute("data-onpage") + ".cmf-check"))
    && ql.some((l) => txt(l) === "3 titles to check" && l.getAttribute("data-onpage") === "cmf-subj-check-1"), ql.map(txt).join(" | "));
  const sb = Array.from(first.querySelectorAll("button.cmf-stage-b"));
  check("(12) ⭐ Collect, Curate and Connect start folded, each behind a button with aria-expanded", sb.length === 3 && sb.every((b) => b.getAttribute("aria-expanded") === "false"
    && d.getElementById(b.getAttribute("aria-controls")).hasAttribute("hidden")) && !first.querySelector("#cmf-subj-quick").closest("[hidden]"));
  x.w.Element.prototype.scrollIntoView = function () { x.w.scrolledTo = this.id; };
  const toTitles = ql.find((l) => l.getAttribute("data-onpage") === "cmf-subj-check-1");
  toTitles.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
  const collectB = sb.find((b) => txt(b) === "Collect");
  check("(12) ⭐ a quick link opens its stage, scrolls to its check and focuses it", collectB.getAttribute("aria-expanded") === "true" && !d.getElementById("cmf-subj-stage-collect").hasAttribute("hidden")
    && d.activeElement && d.activeElement.tagName === "A" && d.getElementById("cmf-subj-check-1").querySelector(".cmf-act").contains(d.activeElement)
    && d.activeElement.classList.contains("cmf-hl"));
  check("(12) ⭐ S722, Sam: a quick link drops you on a link, never bare text, and highlights it (titles to check lands on that list's link)",
    toTitles.getAttribute("data-onpage-to") === d.activeElement.getAttribute("href") && d.activeElement.getAttribute("href") === "#commons/subjects/disagree");
  d.activeElement.dispatchEvent(new x.w.FocusEvent("blur"));
  check("(12) the highlight leaves with the focus", !d.querySelector(".cmf-hl"));
  collectB.click();
  check("(12) the stage word folds it again", collectB.getAttribute("aria-expanded") === "false" && d.getElementById("cmf-subj-stage-collect").hasAttribute("hidden"));
  check("the card's link row opens the list", Array.from(first.querySelectorAll(".cmf-links a")).some((l) => l.getAttribute("href") === "#commons/subjects"));
  check("the fold key is known", x.w.CPL_COMMONS_FRONT.KEYS.indexOf("subjects") >= 0);

  /* (3) no titles file */
  x = load("#commons", { "kb/status/local_subject_titles.json": undefined });
  await x.M.boot(); await settle();
  const sc = x.d.querySelector('.cmf-card[data-key="subjects"]');
  check("(3) a missing titles file reads TBA and the page still draws", sc && /Local subject titles: TBA/.test(txt(sc)) && x.d.querySelectorAll(".cmf-card").length === 11);

  /* (4) the list from its address */
  x = load("#commons/subjects");
  await x.M.boot(); await settle();
  d = x.d;
  check("(4) ⭐ #commons/subjects opens the list", txt(d.getElementById("csb-h")) === "Subjects" && d.querySelector(".cmf-card") === null);
  const beta = d.querySelector('tr[data-college="beta"]');
  check("(4) ⭐ a college whose catalog prints no names reads TBA", beta && txt(beta.children[3]) === "TBA");
  check("(4) a college that prints names reads its count", txt(d.querySelector('tr[data-college="alpha"]').children[3]) === "3 of 4 codes");
  check("(4) every code is listed", d.querySelectorAll(".csb-codes tbody tr").length === 6);
  const zzz = d.querySelector('.csb-codes tr[data-code="ZZZ"]'), math = d.querySelector('.csb-codes tr[data-code="MATH"]');
  check("(4) each code says who prints it", txt(zzz.children[5]) === "Catalog only" && txt(math.children[5]) === "COCI only");
  const heads = Array.from(d.querySelectorAll(".csb-codes thead th")).map(txt);
  check("(7) the labels: Local Title and Source, and no label says print", heads.join(" | ") === "College | Local code | Local Title | Common subject code | Courses | Source | Action"
    && !/print/i.test(Array.from(d.querySelectorAll(".csb-table thead th")).map(txt).join(" ")));
  const chip = math.children[2].querySelector(".csb-chip");
  check("(7) ⭐ a code in COCI and nowhere in the catalog carries the Not in catalog chip, a note a screen reader reads",
    chip && txt(chip) === "Not in catalog" && chip.getAttribute("role") === "note" && /COBI recommends a title, and a person’s save confirms it/.test(chip.getAttribute("aria-label")));
  check("(7) a titled row carries no chip", !d.querySelector('.csb-codes tr[data-code="ENGL"] .csb-chip'));
  check("(4) the common code shows with its discipline title where the maps give one, blank where not", txt(d.querySelector('.csb-codes tr[data-code="ENGL"]').children[3]) === "ENGL English" && txt(zzz.children[3]) === "");
  /* (8) the recommendations (S700, #3655): a note beside a row with no title or no common code, never a value */
  const mcands = Array.from(math.children[2].querySelectorAll(".csb-cands li")).map((li) => li.getAttribute("data-cand"));
  check("(8) ⭐ S722: a row with no title lists every recommended title, most confident first, each with its own Accept", JSON.stringify(mcands) === JSON.stringify(["Mathematics", "Math Lab"])
    && math.children[2].querySelectorAll('.csb-cands button[data-csb-accept="title"]').length === 2);
  check("(8) ⭐ S722: no \"Recommended\" and no explanation on the row; the bar carries it", !/Recommended|other colleges: 3 of 3|Also read/.test(txt(math)));
  check("(8) ⭐ S722: the chip moves to the end of the title cell", math.children[2].lastElementChild.classList.contains("csb-chip") && math.getAttribute("data-title-state") === "not_in_catalog");
  const mcom = math.children[3].querySelector('.csb-rec[data-rec="common"]');
  check("(8) ⭐ a row with no common code shows the recommended code with its discipline", mcom && /^MATH Mathematics/.test(txt(mcom)));
  check("(8) ⭐ S722: the row has an Accept beside Edit", !!math.querySelector('button[data-csb-accept="row"]') && /Accept Mathematics/.test(math.querySelector('button[data-csb-accept="row"]').getAttribute("aria-label")));
  check("(8) a titled row with a common code carries no recommendation", !d.querySelector('.csb-codes tr[data-code="ENGL"] .csb-rec'));
  check("(8) a row the file does not name carries none", !zzz.querySelector(".csb-rec"));
  /* (8b) Sam, 2026-11-25 (r-confidence-0-100-in-all-commons-procedures-sam-2026-11-25): "confidence bars 0-100 rather
     than low, med, high throughout all commons procedures". The file writes 0-100; the panel draws CPL_COMMONS.confBar
     with that number beside it, and no level word anywhere on the row. */
  const tbar = math.children[2].querySelector(".csb-cands li .cmn-cbar"), cbar = mcom && mcom.querySelector(".cmn-cbar");
  check("(8b) ⭐ the recommended title draws a 0-100 confidence bar with its number (70 in the file reads 70, never 7000 or 1)",
    tbar && tbar.getAttribute("data-conf") === "70" && txt(tbar.querySelector(".cmn-cbar-n")) === "70" && /confidence 70 of 100/.test(tbar.getAttribute("aria-label")));
  check("(8b) ⭐ the recommended common code draws a bar too (80)", cbar && cbar.getAttribute("data-conf") === "80");
  check("(8b) ⭐ no High, Medium or Low reads on the row, and no data-level attribute is left",
    !/\b(High|Medium|Low)\b/.test(txt(math)) && !math.querySelector("[data-level]"));
  check("(8b) a recommendation with no number draws no bar and no level word", math.children[2].querySelectorAll(".csb-cands li")[1]
    && !math.children[2].querySelectorAll(".csb-cands li")[1].querySelector(".cmn-cbar"));
  /* (9) the course panel (S700, #3655 item 3): a local code opens its courses, credit and noncredit apart */
  let z = load("#commons/subjects/alpha");
  await z.M.boot(); await settle();
  const word = z.d.querySelector('.csb-codes tr[data-code="MATH"] th button.csb-word');
  check("(9) ⭐ a local code is a control, a button with its own name", word && txt(word) === "MATH" && /Courses under MATH at Alpha College/.test(word.getAttribute("aria-label")));
  check("(9) no panel is open until a code is picked", !z.d.querySelector("#csb-panel"));
  word.click(); await settle();
  const panel = z.d.querySelector("#csb-panel");
  check("(9) ⭐ picking it opens the panel and the address names the college and the code", panel && panel.getAttribute("role") === "dialog" && z.w.location.hash === "#commons/subjects/alpha/MATH");
  const bandsSeen = Array.from(panel.querySelectorAll(".csb-band")).map(txt);
  check("(9) ⭐ credit and noncredit courses are listed apart, each counted; a catalog-only course says its band is not known",
    bandsSeen.length === 3 && bandsSeen[0] === "Credit courses (2)" && bandsSeen[1] === "Noncredit, no category in COCI’s export (1)" && /^In the catalog only .* \(1\)$/.test(bandsSeen[2]), bandsSeen.join(" | "));
  const crs1 = panel.querySelector('.csb-courses tr[data-number="1"]');
  check("(9) a course shows its number, title, where it is listed and its C-ID, CCN and M-ID", crs1 && txt(crs1.children[1]) === "Algebra" && txt(crs1.children[2]) === "Both"
    && txt(crs1.children[3]) === "C-ID MATH 151; M-ID MATH M1001" && /CCN STAT C1000/.test(txt(panel.querySelector('.csb-courses tr[data-number="2"]'))));
  check("(9) the panel counts the courses by where they are listed", /4 courses: 1 in both the catalog and COCI, 1 in the catalog only, 2 in COCI only\./.test(txt(panel.querySelector("#csb-panel-count"))));
  check("(9) every header cell in the panel carries a scope and each table sits in a labeled region",
    Array.from(panel.querySelectorAll("th")).every((th) => th.getAttribute("scope")) && Array.from(panel.querySelectorAll(".csb-courses")).every((t) => t.parentNode.getAttribute("aria-label")));
  panel.querySelector("#csb-panel-close").click(); await settle();
  check("(9) Close returns to the college and its address", !z.d.querySelector("#csb-panel") && z.w.location.hash === "#commons/subjects/alpha");
  z = load("#commons/subjects/alpha/MATH");
  await z.M.boot(); await settle();
  check("(9) ⭐ the address opens the panel on arrival", !!z.d.querySelector("#csb-panel") && /Credit courses \(2\)/.test(txt(z.d.querySelector("#csb-panel"))) && z.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/alpha/MATH");
  z = load("#commons/subjects/alpha/NOPE");
  await z.M.boot(); await settle();
  check("(9) a code the college does not hold opens the college alone", !z.d.querySelector("#csb-panel") && z.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/alpha");
  z = load("#commons/subjects/alpha/MATH", { "kb/status/subject_courses/alpha.json": undefined });
  await z.M.boot(); await settle();
  check("(9) a courses file that cannot be read says so in the panel", /could not be read/.test(txt(z.d.querySelector("#csb-panel-body"))));
  check("(9) the panel stores nothing", z.writes() === 0);
  /* (10) the noncredit subject title list (S700; Sam's order relayed by COBIx on #3655) */
  let n = load("#commons/subjects/noncredit");
  await n.M.boot(); await settle();
  const nctr = Array.from(n.d.querySelectorAll(".csb-nc tbody tr"));
  check("(10) ⭐ the noncredit titles open from their own address and report it", nctr.length === 6 && n.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/noncredit" && txt(n.d.querySelector("#csb-h")) === "Noncredit subject titles");
  const cats = nctr.filter((r) => r.classList.contains("csb-nc-cat")).map(txt);
  check("(10) ⭐ titles sit under their COCI category, which names its MQ discipline and common code, or says there is no code yet",
    /^Parenting.*Parent Education: Noncredit\. Common subject code PARN\./.test(cats[0]) && /^Citizenship for Immigrants.*No common subject code yet\./.test(cats[1]) && /^No noncredit course in COCI/.test(cats[2]));
  const pe = n.d.querySelector('.csb-nc tr[data-title="Parent Education"]');
  check("(10) a title shows the headings printed for it, the programs and codes, its courses and its share", /Printed as: Parenting; Parent Education/.test(txt(pe.children[0])) && txt(pe.children[1]) === "2 of 2"
    && txt(pe.children[2]) === "Program One PARN; Program Two PRNT" && txt(pe.children[3]) === "70" && /90% of its noncredit courses/.test(txt(pe.children[4])) && /Also under: Workforce Preparation 1/.test(txt(pe.children[4])));
  check("(10) ⭐ the note says the titles stand on Sam's word and are his to change, and calls the list no draft",
    /The titles stand on Sam’s word of November 22, 2026, and are his to change\. A category with no common subject code keeps none and is shown by name\./.test(txt(n.d.querySelector("#csb-nc-note")))
    && !/draft|on hold/i.test(txt(n.d.querySelector("#csb-nc-note"))));
  check("(10) the Subjects list links to it", Array.from(n.d.querySelectorAll(".csb-stamp a")).some((a) => a.getAttribute("href") === "#commons/subjects/noncredit"));
  check("(10) every header cell carries a scope and the table sits in a labeled region", Array.from(n.d.querySelectorAll(".csb-nc th")).every((th) => th.getAttribute("scope")) && n.d.querySelector(".csb-nc").parentNode.getAttribute("aria-label"));
  n = load("#commons/subjects/noncredit", { "kb/status/noncredit_subject_titles.json": undefined });
  await n.M.boot(); await settle();
  check("(10) a list that cannot be read says so", /could not be read/.test(txt(n.d.querySelector(".csb-note[role=status]"))));
  /* (11) one list, every subject, with a credit and noncredit filter (Sam, 2026-11-22) */
  let f = load("#commons/subjects");
  await f.M.boot(); await settle();
  const total = f.d.querySelectorAll(".csb-codes tbody tr").length;
  const bandBtn = (b) => f.d.querySelector('button[data-csb-band="' + b + '"]');
  check("(11) ⭐ the list opens on All subjects: every code on one list", bandBtn("").getAttribute("aria-pressed") === "true" && total === 6 && /^All subjects \(6\)$/.test(txt(bandBtn(""))));
  bandBtn("C").click(); await settle();
  check("(11) Credit narrows the list to codes with credit courses in COCI and says so", bandBtn("C").getAttribute("aria-pressed") === "true"
    && Array.from(f.d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-code")).join(",") === "ENGL,MATH,WELD,WELD");
  bandBtn("N").click(); await settle();
  check("(11) Noncredit shows the codes with noncredit courses, none in this fixture, in words", /No code is in this list/.test(txt(f.d.querySelector(".csb-codes tbody"))));
  bandBtn("").click(); await settle();
  check("(11) All subjects brings every code back", f.d.querySelectorAll(".csb-codes tbody tr").length === total);
  check("(11) the pick is never stored and the address does not change", f.writes() === 0 && f.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects");
  let y = load("#commons/subjects", { "kb/status/local_subject_recommendations.json": undefined });
  await y.M.boot(); await settle();
  check("(8) the list draws without the recommendations file", y.d.querySelectorAll(".csb-codes tbody tr").length > 0 && !y.d.querySelector(".csb-rec"));
  check("(4) the rule is on the page", /trimming and upper-casing/.test(txt(d.querySelector(".csb-foot"))));

  /* (5) a press on a college moves the address and reports it */
  d.querySelector('tr[data-college="beta"] a').dispatchEvent(new x.w.MouseEvent("click", { bubbles: true, cancelable: true }));
  await settle();
  check("(5) ⭐ a press on a college opens it at its address", x.w.location.hash === "#commons/subjects/beta" && txt(d.getElementById("csb-h")) === "Subjects at Beta College");
  check("(5) the view reports its address", x.w.CPL_COMMONS_SUBJECTS.address() === "commons/subjects/beta");

  x = load("#commons/subjects/beta");
  await x.M.boot(); await settle();
  d = x.d;
  check("(4) ⭐ #commons/subjects/<slug> opens that college", txt(d.getElementById("csb-h")) === "Subjects at Beta College" && d.querySelectorAll(".csb-codes tbody tr").length === 2);
  check("(4) its titles read TBA, and the page says why", Array.from(d.querySelectorAll(".csb-codes tbody tr")).every((r) => /Not read yet$/.test(txt(r.children[2])) && r.children[2].lastElementChild.classList.contains("csb-chip") && txt(r.children[5]) === "Not read yet") && /No subject heading is read for this catalog yet/.test(txt(d.querySelector(".csb-note"))));
  check("(7) a line near the code in the catalog shows under the chip, never as the title", /A line near it in the catalog: Engineering and Design/.test(txt(d.querySelector('.csb-codes tr[data-code="ENG"]').children[2])));
  check("(7) ⭐ on a college's own list its name is plain words, never a link to the page it is on",
    !d.querySelector('.csb-table a[href="#commons/subjects/beta"]') && /Beta College/.test(txt(d.querySelector(".csb-codes tbody tr").children[0])));

  x = load("#commons/subjects/disagree");
  await x.M.boot(); await settle();
  d = x.d;
  const sides = Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-side"));
  const states = Array.from(d.querySelectorAll(".csb-codes tbody tr")).map((r) => r.getAttribute("data-title-state"));
  check("(7) ⭐ the list holds every code with no title, in or out of the catalog, a person's rows first",
    sides.length === 3 && states.join(",") === "not_in_catalog,not_read,not_read" && sides.indexOf("both") >= 0, states.join(",") + " / " + sides.join(","));
  check("(7) its heading says what it lists", txt(d.getElementById("csb-h")) === "Subject titles to check");

  // Noncredit (S701): the hold lifted (r-noncredit-title-list-go-sam-2026-11-22). A noncredit-only untitled code reads its
  // true reason; its courses count noncredit and noncredit enhanced apart; its COCI categories show with their MQ discipline.
  const NC = JSON.parse(JSON.stringify(FIX)), ci = NC.columns;
  ci.push("noncredit_plain", "noncredit_enhanced", "categories");
  NC.colleges.forEach((c) => c.rows.forEach((r) => {
    r.push(null, null, null);
    if (c.slug === "beta" && r[0] === "WELD") { r[ci.indexOf("credit_courses")] = 0; r[ci.indexOf("noncredit_courses")] = 7; r[ci.indexOf("noncredit_plain")] = 3;
      r[ci.indexOf("noncredit_enhanced")] = 4; r[ci.indexOf("categories")] = [["Workforce Preparation", 5], ["Parenting", 2]]; }
    if (c.slug === "alpha" && r[0] === "ENGL") { r[ci.indexOf("credit_courses")] = 1; r[ci.indexOf("noncredit_courses")] = 1; r[ci.indexOf("noncredit_plain")] = 1; r[ci.indexOf("noncredit_enhanced")] = 0;
      r[ci.indexOf("categories")] = [["Parenting", 1]]; }
  }));
  NC.noncredit_mq = { "Parenting": { mq_discipline: "Parent Education: Noncredit", common_code: "PARN" }, "Workforce Preparation": { mq_discipline: null, common_code: null } };
  const NCREC = { colleges: [{ slug: "beta", rows: [{ code: "WELD", common: { code: null, discipline: null, confidence: null, from: "noncredit_category", category: "Workforce Preparation",
    why: "The category has no common subject code yet: its dominant COCI noncredit category, Workforce Preparation (5 of 7 noncredit courses, 71%)." } }] }] };
  x = load("#commons/subjects/disagree", { "kb/status/local_subject_titles.json": NC, "kb/status/local_subject_recommendations.json": NCREC });
  await x.M.boot(); await settle();
  const ncw = Array.from(x.d.querySelectorAll(".csb-codes tbody tr")).find((r) => r.getAttribute("data-code") === "WELD" && /Beta/.test(txt(r.children[0])));
  check("(8) ⭐ a noncredit-only untitled code reads its true reason, no hold chip", ncw && ncw.getAttribute("data-title-state") === "not_read"
    && txt(ncw.children[2].querySelector(".csb-chip")) === "Not read yet" && !/on hold/i.test(txt(x.d.querySelector("#commons-root"))));
  check("(8) ⭐ its courses count noncredit and noncredit enhanced apart", /7 in the catalog, 7 in COCI \(0 credit, 3 noncredit, 4 noncredit enhanced\)/.test(txt(ncw.children[4])));
  check("(8) ⭐ a category with no common code shows by name and no code, beside the categories most courses first",
    /COCI noncredit categories: Workforce Preparation \(5\), Parenting \(2\)\. No noncredit MQ discipline is named for Workforce Preparation, and no common subject code yet\./.test(txt(ncw.children[4]))
    && /^No common subject code yet\. The category has no common subject code yet: .*Workforce Preparation \(5 of 7 noncredit courses, 71%\)\.$/.test(txt(ncw.children[3].querySelector('.csb-rec[data-rec="common-none"]'))));
  check("(8) the stamp's reasons still sum to the titles to check, and none is on hold", /3 titles to check \(1 not in catalog, 2 not read yet, 0 blocked\)\./.test(txt(x.d.querySelector(".csb-stamp"))));
  x = load("#commons/subjects/alpha", { "kb/status/local_subject_titles.json": NC });
  await x.M.boot(); await settle();
  check("(8) ⭐ a code's credit and noncredit courses are counted apart, with its category's MQ discipline and code", /\(1 credit, 1 noncredit\)/.test(txt(x.d.querySelector('.csb-codes tr[data-code="ENGL"]').children[4]))
    && /COCI noncredit category: Parenting \(1\)\. Noncredit MQ discipline: Parent Education: Noncredit, common subject code PARN\./.test(txt(x.d.querySelector('.csb-codes tr[data-code="ENGL"]').children[4]))
    && !/noncredit\)|category/.test(txt(x.d.querySelector('.csb-codes tr[data-code="WELD"]').children[4])));
  const E = JSON.parse(JSON.stringify(FILES["kb/status/subject_courses/alpha.json"]));
  E.codes.MATH.push(["301", "Math Lab II", "E", "COCI", 0, "", "", ""], ["302", "Math Lab III", "E", "COCI", 0, "", "", ""]);
  x = load("#commons/subjects/alpha/MATH", { "kb/status/subject_courses/alpha.json": E });
  await x.M.boot(); await settle();
  const eb = Array.from(x.d.querySelectorAll("#csb-panel .csb-band")).map(txt);
  /* S705: the noncredit courses stand under their COCI noncredit category (a category's save touches that category's
     courses only), and an enhanced course says so on its row. */
  check("(12) ⭐ the course panel's noncredit courses keep N and E apart: an enhanced course says so on its row", eb.indexOf("Noncredit, no category in COCI’s export (3)") >= 0
    && /COCI, enhanced/.test(txt(x.d.querySelector('#csb-panel tr[data-number="301"]'))) && !/enhanced/.test(txt(x.d.querySelector('#csb-panel tr[data-band="N"]'))), eb.join(" | "));

  x = load("#commons/subjects/nowhere");
  await x.M.boot(); await settle();
  check("(4) an unknown college says so and shows every college", /No college with a catalog on file is named nowhere/.test(txt(x.d.querySelector(".csb-note"))) && x.d.querySelectorAll(".csb-codes tbody tr").length === 6);

  /* (6) the tables */
  d = x.d;
  check("(6) every header cell carries a scope", Array.from(d.querySelectorAll(".csb-table th")).every((th) => th.getAttribute("scope")));
  check("(6) each table scrolls inside a labeled region", Array.from(d.querySelectorAll(".csb-table")).every((t) => t.parentNode.getAttribute("role") === "region" && t.parentNode.getAttribute("aria-label")));
  check("(6) the list stores nothing", x.writes() === 0);
  const CSS = x.w.CPL_COMMONS_SUBJECTS.CSS;
  check("(6) tokens only: no raw hex in the list's CSS", !/#[0-9a-fA-F]{3,8}\b/.test(CSS));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
