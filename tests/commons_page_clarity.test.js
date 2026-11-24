// Commons page clarity: Sam's eight asks of 2026-11-21 (in session) on the CPL Commons front page, #commons.
//
// WHAT THIS GUARDS (each a way the page would mislead or lose him again):
//   (1) ⭐ Needs you is a ranked list of at most 12 links, wave blockers first, then by the count each frees, each
//       line showing its figure; a link about one college opens that college's row on College Data Collection, every
//       other link jumps to a card on this page (and opens it when folded), never leaving the page.
//   (2) ⭐ an item he finished leaves Course Outline Fixes, Catalog Fixes and Term Reports Needed on the live read, with
//       no nightly build between, and each list head counts it in a green "Handed over: N" chip; a hand-over our reader
//       could not read still waits.
//   (3) ⭐ the widget shows "Data Collection Phase 1 ETA" and "Data Curation Phase 1 ETA", each an estimated date or
//       TBA, never a date from fewer than 5 counted days; curation counts bulk curation (a set-aside, a rule) beside a
//       person's edits; "Phase 1" links to the Plan card.
//   (4) the Collect / Curate / Connect headers are larger, and each card sits under its own.
//   (5) the Plan card lists Phases 1, 2 and 3, each with Collected, Curated, Connected and Left.
//   (6) ⭐ no "Counting Method" survives; "...(more)" is a button with aria-expanded that reads "(less)" when open.
//   (7) ⭐ the chart: a solid line of records a day, a dashed pace-needed line, a dotted trend (S723: no cost panel), the same
//       dates, a readout the arrow keys move, and the table beside it.
//   (8) ⭐ the College Data Collection card: one line per dataset, each count a link to College Data Collection
//       filtered to those colleges (the filter counts the same colleges), the one fix that reaches the most colleges,
//       the colleges that moved this week, and "Open College Data Collection".
//   and the plain words: no label opens on What, When, How or Why; no Z time, no "fold" or "queue" in rendered text.
//
// Run from repo root: `npm test` (or `node tests/commons_page_clarity.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const J = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const SRC = fs.readFileSync("commons_front.js", "utf8");
const SCRIPTS = ["commons_progress.js", "commons_program_records.js", "commons_handover.js", "commons_data.js", "commons_front.js", "commons.js"].map((f) => fs.readFileSync(f, "utf8"));
const BASE = {};
["kb/status/commons.json", "kb/status/program-requirements.json", "kb/status/commons_data.json", "kb/reference/industry_credential_skills.json",
  "kb/status/held_subject_codes.json", "kb/status/local_subject_titles.json", "kb/status/commons_history.json", "kb/reference/model_spend_daily.json", "kb/exhibits_review.json"]
  .forEach((f) => { BASE[f] = J(f); });
["exhibit", "cr", "course", "subjects"].forEach((k) => { BASE["kb/status/" + k + ".json"] = J("kb/status/" + k + ".json"); });
const OPEN_HUNT = J("tests/fixtures/commons_hunt_open.json");

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="cpl-tab-pane" id="tab-commons"><div class="main-container"><div id="commons-root">Loading</div></div></div></body></html>',
    { url: "https://example.org/index.html" + (opts.hash || "#commons"), runScripts: "dangerously", pretendToBeVisual: true });
  const w = dom.window, store = {};
  Object.defineProperty(w, "localStorage", { value: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, configurable: true });
  w.scrolled = [];
  w.Element.prototype.scrollIntoView = function () { w.scrolled.push(this.id || this.tagName); };
  w.CPL_SESSION = { get: () => null, isFresh: () => true, authHeaders: (x) => Object.assign({ apikey: "anon-key" }, x || {}) };
  const files = Object.assign({}, BASE, opts.files || {});
  w.fetch = function (url) {
    url = String(url);
    if (/rpc\/commons_handover_summary/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve((opts.summary || []).slice()) });
    if (/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    const hit = files[url.split("?")[0]];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  SCRIPTS.forEach((s) => { const t = w.document.createElement("script"); t.textContent = s; w.document.body.appendChild(t); });
  return { w, d: w.document, M: w.CPL_COMMONS, store };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 40; i++) await tick(); }
function withData(change) { const d = JSON.parse(JSON.stringify(BASE["kb/status/commons_data.json"])); change(d); return d; }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); }

(async function () {
  // ── (1) the ranked links, with every still-taught course open (a fixture) ──
  let x = load({ files: { "kb/status/commons_data.json": withData((d) => { d.blocked_hunt = OPEN_HUNT; }) } });
  await x.M.boot(); await settle();
  let rank = Array.from(x.d.querySelectorAll("#cmf-rank > li"));
  const hunted = OPEN_HUNT.colleges.filter((c) => c.hunted && !c.filed);
  check("(1) ⭐ Needs you leads with its ranked links, at most 12", rank.length > 0 && rank.length <= 12 && x.d.querySelector("#cmf-needs > #cmf-rank-box"), rank.length);
  const waves = rank.map((li) => li.getAttribute("data-wave"));
  check("(1) ⭐ wave blockers first", waves.indexOf("no") < 0 || waves.slice(waves.indexOf("no")).every((v) => v === "no"), waves.join(","));
  const counted = rank.filter((li) => li.getAttribute("data-wave") === "yes").map((li) => { const m = /frees ([\d,]+)/.exec(txt(li)); return m ? +m[1].replace(/,/g, "") : null; });
  check("(1) and among them the larger count first, each figure in its line", counted.every((n, i) => n != null && (i === 0 || counted[i - 1] >= n)), counted.join(","));
  const hc = BASE["kb/status/held_subject_codes.json"].totals;
  check("(1) the subject codes the M-ID mint holds on show what they free", rank.some((li) => txt(li).indexOf("frees " + hc.held.toLocaleString("en-US") + " courses for an M-ID") >= 0));
  /* S723 (Sam, 2026-11-24): every link lands on the card link that holds its item, focused and highlighted; a second
     press opens the view. An item about one college lands on that college's own link in its card. */
  const one = rank.filter((li) => /: course outlines/.test(txt(li)));
  const OUTL = x.d.querySelector('.cmf-card[data-key="courses-data"] .cmf-check[data-ref="outlines"]');
  check("(1) ⭐ an item about one college lands on that college's own link in the Courses data card",
    one.length === hunted.length && one.every((li) => { const l = li.querySelector("a"); return l.getAttribute("data-onpage") === "courses-data" && l.getAttribute("data-onpage-ref") === "outlines"
      && OUTL.querySelector('.cmf-land a[href="' + l.getAttribute("data-onpage-to") + '"]'); }), one.map((li) => li.querySelector("a").outerHTML).join(" "));
  const onPage = rank.map((li) => li.querySelector("a")).filter((l) => l.hasAttribute("data-onpage"));
  check("(1) ⭐ every link but a decision's jumps to a place on this page that exists", onPage.length > 0 && onPage.length === rank.filter((li) => !li.hasAttribute("data-todo")).length
    && onPage.every((l) => l.getAttribute("href") === "#" + l.getAttribute("data-onpage") && x.d.getElementById(l.getAttribute("data-onpage"))),
    onPage.map((l) => l.getAttribute("href")).join(" "));
  check("(1) no link in the list leaves the site", rank.every((li) => /^#/.test(li.querySelector("a").getAttribute("href"))));
  // a jump into a folded card opens it and its stage, and lands on the check's link, highlighted, with no route change
  const subj = x.d.querySelector('.cmf-card[data-key="subjects"]');
  click(x.w, subj.querySelector(".cmf-fold"));
  const toSubj = onPage.find((l) => l.getAttribute("data-onpage") === "cmf-subj-check-3");
  const before = x.w.location.hash;
  click(x.w, toSubj); await settle();
  const A = x.d.activeElement;
  check("(1) ⭐ a jump unfolds the card and its stage, and lands on the check's link, highlighted, and the address stays", !subj.classList.contains("cmf-folded")
    && !x.d.getElementById("cmf-subj-check-3").closest("[hidden]") && A && A.tagName === "A" && A.getAttribute("href") === "#commons/subjects/held"
    && A.classList.contains("cmf-hl") && x.d.getElementById("cmf-subj-check-3").contains(A) && x.w.location.hash === before, A && A.outerHTML);
  // the same for a college's outline item: its card's college link takes the focus
  click(x.w, one[0].querySelector("a")); await settle();
  check("(1) ⭐ an outline item lands on its college's link in the card, highlighted", x.d.activeElement && x.d.activeElement.getAttribute("href") === one[0].querySelector("a").getAttribute("data-onpage-to")
    && x.d.activeElement.classList.contains("cmf-hl") && OUTL.contains(x.d.activeElement));
  // more than 12 items: 12 links and a plain count of the rest
  const many = JSON.parse(JSON.stringify(OPEN_HUNT));
  for (let i = 0; i < 12; i++) many.colleges.push({ slug: "fixture_" + i, college: "Fixture College " + i, hunted: true, filed: false, catalog_url: "", still_taught: [{ course: "FIX " + i, control_number: "CCC9" + i, title: "Fixture" }], answered: [] });
  x = load({ files: { "kb/status/commons_data.json": withData((d) => { d.blocked_hunt = many; }) } });
  await x.M.boot(); await settle();
  rank = Array.from(x.d.querySelectorAll("#cmf-rank > li"));
  check("(1) ⭐ never more than 12 links, and the rest counted in words", rank.length === 12 && /^\d+ more items? waits? in the cards below\.$/.test(txt(x.d.querySelector(".cmf-rank-rest"))), rank.length + " / " + txt(x.d.querySelector(".cmf-rank-rest")));

  // ── (2) a finished item leaves at once ──
  const C0 = hunted[0], C1 = hunted[1];
  const noCatalog = withData((d) => { d.blocked_hunt = OPEN_HUNT; d.colleges[0].harvested = false; d.colleges[1].harvested = false; });
  const SUMMARY = [
    { dataset: "course_outlines", subject_kind: "course", college: C0.college, course_code: C0.still_taught[0].course, kind: "file", status: "waiting", n: 1 },
    { dataset: "course_outlines", subject_kind: "course", college: C1.college, course_code: C1.still_taught[0].course, kind: "link", status: "could_not_read", n: 1 },
    { dataset: "catalog", subject_kind: "college", college: noCatalog.colleges[0].name, course_code: null, kind: "file", status: "waiting", n: 1 },
    { dataset: "term_reports", subject_kind: "dataset", college: null, course_code: null, kind: "file", status: "waiting", n: 7 }
  ];
  x = load({ files: { "kb/status/commons_data.json": noCatalog }, summary: SUMMARY });
  await x.M.boot(); await settle();
  const outline = x.d.querySelector('.cmf-card[data-key="courses-data"] .cmf-check[data-ref="outlines"]');
  check("(2) ⭐ a course handed over leaves the outline list on the live read",
    !Array.from(outline.querySelectorAll("a[data-course]")).some((l) => txt(l) === C0.still_taught[0].course && l.closest("li").getAttribute("data-hunt-college") === C0.slug));
  check("(2) a hand-over our reader could not read still waits", Array.from(outline.querySelectorAll('li[data-hunt-college="' + C1.slug + '"] a[data-course]')).some((l) => txt(l) === C1.still_taught[0].course));
  check("(2) ⭐ Needs you holds only what waits: no Handed over chip, no list of its own", !x.d.querySelector("#cmf-needs .cmf-handed, #cmf-needs [data-hunt-college], #cmf-needs [data-catalog-college]"));
  const colCard = x.d.querySelector('.cmf-card[data-key="colleges"]');
  check("(2) ⭐ the catalog list lives in its card: a college with no catalog stays, a college handed one leaves, in Needs you too",
    !!colCard.querySelector('[data-catalog-college="' + (noCatalog.colleges[1].slug) + '"]') && !colCard.querySelector('[data-catalog-college="' + noCatalog.colleges[0].slug + '"]')
    && rank.length >= 0 && !Array.from(x.d.querySelectorAll("#cmf-rank li")).some((li) => txt(li) === noCatalog.colleges[0].name + ": catalog")
    && Array.from(x.d.querySelectorAll("#cmf-rank li")).some((li) => txt(li).indexOf(noCatalog.colleges[1].name + ": catalog") === 0), txt(colCard));
  check("(2) ⭐ the card's quick link counts the same colleges the list holds", /^1 college with a blocked catalog$/.test(txt(colCard.querySelector('.cmf-quick a'))), txt(colCard.querySelector(".cmf-quick")));
  const termFig = (d) => txt(d.querySelector('.cmf-card[data-key="courses-data"] .cmf-check[data-ref="terms"] .cmf-check-fig'));
  check("(2) ⭐ with as many term reports handed over as are wanted, the wanted terms leave", !/Spring 2026/.test(txt(x.d.getElementById("cmf-term-wanted"))) && termFig(x.d) === "7 handed over"
    && !Array.from(x.d.querySelectorAll("#cmf-rank li")).some((li) => /Term reports/.test(txt(li))), txt(x.d.getElementById("cmf-term-wanted")));
  check("(2) the answered list is gone from Needs you", !x.d.querySelector(".cmf-answered, [data-hunt-answered]"));
  check("(2) the source no longer only appends a line: the lists redraw from the live counts", /function redrawNeeds\(M\)/.test(SRC) && /M\.handed = rows/.test(SRC));

  // ── COBIx's follow-ups on #3646 ──
  // A term a hand-over names leaves the list; three copies of one term never clear the other two.
  const term = (name, n) => ({ dataset: "term_reports", subject_kind: "dataset", college: null, course_code: null, kind: "file", status: "waiting", n: n, term: name });
  x = load({ files: { "kb/status/commons_data.json": noCatalog }, summary: [term("Spring 2026", 3)] });
  await x.M.boot(); await settle();
  check("(2) ⭐ three hand-overs of one named term leave the other two terms wanted", txt(x.d.getElementById("cmf-term-wanted")).indexOf("Wanted, newest first: Spring 2025 and Fall 2024.") === 0
    && termFig(x.d) === "3 handed over", txt(x.d.getElementById("cmf-term-wanted")));
  x = load({ files: { "kb/status/commons_data.json": noCatalog }, summary: [term("Spring 2026", 1), term("Fall 2024", 1), term(null, 1)] });
  await x.M.boot(); await settle();
  check("(2) two named terms and one more hand-over clear the list", /^No term report waits on you: 3 term reports handed over\./.test(txt(x.d.getElementById("cmf-term-wanted"))), txt(x.d.getElementById("cmf-term-wanted")));
  x = load({ files: { "kb/status/commons_data.json": noCatalog }, summary: [term("Spring 2026", 1), term("Spring 2025", 1)] });
  await x.M.boot(); await settle();
  check("(2) one term left reads as one term", txt(x.d.getElementById("cmf-term-wanted")).indexOf("Wanted, newest first: Fall 2024.") === 0, txt(x.d.getElementById("cmf-term-wanted")));
  // A catalog address opens as a link only when it is a web address.
  const odd = JSON.parse(JSON.stringify(OPEN_HUNT));
  const oddC = odd.colleges.filter((c) => c.hunted && !c.filed);
  oddC[0].catalog_url = "javascript:alert(1)"; oddC[1].catalog_url = "https://catalog.example.edu/";
  x = load({ files: { "kb/status/commons_data.json": withData((d) => { d.blocked_hunt = odd; }) } });
  await x.M.boot(); await settle();
  const li0 = x.d.querySelector('.cmf-hunt li[data-hunt-college="' + oddC[0].slug + '"]'), li1 = x.d.querySelector('.cmf-hunt li[data-hunt-college="' + oddC[1].slug + '"]');
  check("⭐ an address that is not a web address shows as plain text, never a link", li0 && !li0.querySelector("a.cmf-out") && txt(li0.querySelector(".cmf-out-plain")) === "javascript:alert(1)"
    && !Array.from(x.d.querySelectorAll("a[href]")).some((l) => /^javascript:/i.test(l.getAttribute("href"))), li0 && txt(li0));
  check("a web address still opens as a link", li1 && li1.querySelector("a.cmf-out") && li1.querySelector("a.cmf-out").getAttribute("href") === "https://catalog.example.edu/");

  // ── (3) the two estimated dates ──
  x = load();
  await x.M.boot(); await settle();
  const lines = Array.from(x.d.querySelectorAll(".cmf-eta .cmf-date"));
  check("(3) ⭐ the two labels, exactly", lines.map((l) => txt(l.querySelector(".cmf-date-l"))).join(" | ") === "Data Collection Phase 1 ETA | Data Curation Phase 1 ETA");
  check("(3) ⭐ every date says estimated, or reads TBA", lines.every((l) => /^(\w+ \d+, \d{4} estimated|TBA)$/.test(txt(l.querySelector(".cmf-date-v")))), lines.map((l) => txt(l.querySelector(".cmf-date-v"))).join(" | "));
  check("(3) ⭐ Phase 1 in each label links to the Plan card", lines.every((l) => { const a = l.querySelector(".cmf-date-l a"); return a && txt(a) === "Phase 1" && a.getAttribute("data-onpage") === "cmf-card-plan"; }) && !!x.d.getElementById("cmf-card-plan"));
  // too few days: the program headline thinned to three days of its last week
  const PR = J("kb/status/program-requirements.json"), H = PR.headline, last = H[H.length - 1].day;
  const dn = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000, L = dn(last);
  PR.headline = H.filter((h) => { const n = dn(h.day); return n <= L - 7 || n === L || n === L - 3 || n === L - 5; });
  const hist = J("kb/status/commons_history.json"), hd = Object.keys(hist.pairs).sort();
  const thin = { pairs: {} }; [hd[hd.length - 1], hd[hd.length - 9]].forEach((k) => { thin.pairs[k] = hist.pairs[k]; });
  x = load({ files: { "kb/status/program-requirements.json": PR, "kb/status/commons_history.json": thin } });
  await x.M.boot(); await settle();
  const tba = Array.from(x.d.querySelectorAll(".cmf-eta .cmf-date-v")).map(txt);
  check("(3) ⭐ a window with a count on fewer than 5 of its days reads TBA, never a date", tba[0] === "TBA" && tba[1] === "TBA" && /fewer than 5 days/.test(txt(x.d.querySelector(".cmf-eta"))), tba.join(" | "));
  // bulk curation counts: a set-aside that shrinks the universe dates a reference no person touched
  const days = []; for (let i = 7; i >= 0; i--) days.push(new Date((L - i) * 86400000).toISOString().slice(0, 10));
  const bulk = { pairs: {} };
  days.forEach((d, i) => { bulk.pairs[d] = { exhibit: [100, 200 - i * 5, 50], course: [10, 20, 0], cr: [5, 5, 0], subjects: [3, 3, 3] }; });
  bulk.pairs[days[days.length - 1]].course = [20, 20, 0];
  x = load({ files: { "kb/status/commons_history.json": bulk } });
  await x.M.boot(); await settle();
  const cur = x.d.querySelectorAll(".cmf-eta .cmf-date")[1];
  check("(3) ⭐ curation counts bulk work: a set-aside of 35 titles in 7 days dates exhibit titles with no hand edit",
    /^\w+ \d+, \d{4} estimated$/.test(txt(cur.querySelector(".cmf-date-v"))) && /35 were curated \(0 by a person, 35 by rules, reader fixes, new M-IDs or set-asides\)/.test(txt(cur)), txt(cur).slice(0, 400));

  // ── (4) the headers and the groups ──
  x = load();
  await x.M.boot(); await settle();
  const groups = {};
  Array.from(x.d.querySelectorAll(".cmf-group")).forEach((g) => { groups[txt(g.querySelector(".cmf-group-h"))] = Array.from(g.querySelectorAll(".cmf-card")).map((c) => c.getAttribute("data-key")).join(","); });
  check("(4) ⭐ each card under its own header", groups.Collect === "colleges,programs,courses-data,cdc" && groups.Curate === "subjects,courses,exhibit,credentials,cr" && groups.Connect === "interconnect", JSON.stringify(groups));
  check("(4) the headers are larger than the cards' titles", /\.cmf-group-h \{[^}]*font-size:clamp\(1\.35rem/.test(SRC) && /\.cmf-card-t \{[^}]*font-size:1\.25rem/.test(SRC));

  // ── (5) the Plan ──
  const plan = x.d.getElementById("cmf-card-plan");
  const phases = plan ? Array.from(plan.querySelectorAll(".cmf-phase")) : [];
  check("(5) ⭐ the Plan card lists Phases 1, 2 and 3", phases.map((p) => txt(p.querySelector("h4"))).join(" | ") === "Phase 1, now | Phase 2, partner data | Phase 3, live connections");
  check("(5) each phase says what it collects, curates and connects, and what is left", phases.every((p) => Array.from(p.querySelectorAll("dt")).map(txt).join(",") === "Collected,Curated,Connected,Left"));
  check("(5) Phase 1's Left line carries this page's own count of programs left", /^About [\d,]+ Active programs/.test(txt(phases[0].querySelectorAll("dd")[3])));

  // ── (6) ...(more) ──
  check("(6) ⭐ no Counting Method, Calculation Method or More detail control survives", !Array.from(x.d.querySelectorAll(".cmf summary, .cmf button")).some((b) => /Counting Method|Calculation Method|^More detail$/i.test(txt(b))));
  const mores = Array.from(x.d.querySelectorAll(".cmf button.cmf-more"));
  check("(6) every card with notes carries ...(more), a button with aria-expanded", mores.length >= 10 && mores.every((b) => txt(b) === "...(more)" && b.getAttribute("aria-expanded") === "false" && x.d.getElementById(b.getAttribute("aria-controls")).hasAttribute("hidden")));
  const pc = x.d.querySelector('.cmf-card[data-key="programs"]'), pm = pc.querySelector(".cmf-more");
  click(x.w, pm);
  check("(6) ⭐ pressed, it opens the card text and its notes and reads (less)", txt(pm) === "(less)" && pm.getAttribute("aria-expanded") === "true" && !x.d.getElementById(pm.getAttribute("aria-controls")).hasAttribute("hidden") && pc.classList.contains("cmf-unclamped"));
  click(x.w, pm);
  check("(6) pressed again, it closes", txt(pm) === "...(more)" && !pc.classList.contains("cmf-unclamped"));
  check("(6) the control is the link blue, underlined, 24px tall", /\.cmf-more \{[^}]*min-height:24px[^}]*color:var\(--cmn-link\)[^}]*text-decoration:underline/.test(SRC));

  // ── (7) the chart ──
  check("(7) ⭐ a solid line of records a day, a dashed pace-needed line, a dotted trend", !!x.d.querySelector(".cmf-plot path.cmf-l-actual") && !!x.d.querySelector(".cmf-plot line.cmf-l-need") && !!x.d.querySelector(".cmf-plot line.cmf-l-trend")
    && /\.cmf-l-need \{[^}]*stroke-dasharray:8 5/.test(SRC) && /\.cmf-l-trend \{[^}]*stroke-dasharray:2 4/.test(SRC));
  const colCol = x.d.getElementById("cmf-eta-collect"), curCol = x.d.getElementById("cmf-eta-curate");
  /* Sam, S723, 2026-11-24: "delete the bar graph on collection widget. we just need the trend line". */
  check("(7) ⭐ no cost bars on the page: each column is its line graph alone", !x.d.querySelector(".cmf-plot-cost, rect.cmf-b-cost") && colCol.querySelectorAll(".cmf-plot").length === 1);
  /* S723 (Sam, 2026-11-24): "put the collection stuff all on the left, including the line graph and the curation stuff
     to the right of it, and make the bar graph match the line graph of the collection side". */
  const etaCols = Array.from(x.d.querySelectorAll(".cmf-dates > .cmf-eta-col"));
  check("(7) ⭐ two columns: collection on the left with its date and graph, curation on the right with its own",
    etaCols.length === 2 && etaCols[0] === colCol && etaCols[1] === curCol && /^Data Collection/.test(txt(colCol.querySelector(".cmf-date-l"))) && /^Data Curation/.test(txt(curCol.querySelector(".cmf-date-l")))
    && colCol.querySelector("figure.cmf-chart") && curCol.querySelector("figure.cmf-chart") && !x.d.querySelector(".cmf-eta > figure"));
  check("(7) ⭐ the curation graph matches the collection graph: the same lines, the same 30 days, and no cost panel of its own",
    !!curCol.querySelector(".cmf-plot path.cmf-l-actual") && curCol.querySelectorAll(".cmf-plot").length === 1 && !curCol.querySelector(".cmf-plot-cost")
    && curCol.querySelectorAll(".cmf-table tbody tr").length === 30 && /^Items curated a day, up to /.test(txt(curCol.querySelector(".cmf-axis"))) && x.d.getElementById("cmf-plots-cur"));
  check("(7) the legend says each line in words", /Solid line/.test(txt(x.d.querySelector(".cmf-legend"))) && /Dashed line: daily pace needed/.test(txt(x.d.querySelector(".cmf-legend"))) && /Dotted line: trend/.test(txt(x.d.querySelector(".cmf-legend"))) && !/cost per day/.test(txt(x.d.querySelector(".cmf-legend"))));
  const plots = x.d.getElementById("cmf-plots"), ro = x.d.getElementById("cmf-readout"), r0 = txt(ro);
  plots.dispatchEvent(new x.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
  check("(7) ⭐ the keyboard reads one day at a time: the readout moves and is a live region", plots.getAttribute("tabindex") === "0" && ro.getAttribute("aria-live") === "polite" && txt(ro) !== r0 && /program records|no count/.test(txt(ro)) && !/cost/.test(txt(ro)), r0 + " -> " + txt(ro));
  const trows = colCol.querySelectorAll(".cmf-chart .cmf-table tbody tr");
  check("(7) the table holds every day's figures, with scoped headers", trows.length === 30 && Array.from(x.d.querySelectorAll(".cmf-chart .cmf-table th")).every((t) => t.hasAttribute("scope")));
  check("(7) the plots scale to the width, with no fixed pixel width", /\.cmf-plot \{ width:100%/.test(SRC) && !/\.cmf-plot \{[^}]*width:\d+px/.test(SRC));

  // ── Rulings to find and the doubt list (Sam, S723, 2026-11-24: "I don't remember anything about those rulings...",
  //    "maybe cobix can find them...") ──
  const doubtWith = (ids) => ({ cards: ids.map((id) => ({ id: id, why: ["description"] })) });
  x = load({ files: { "kb/ccr_doubt.json": doubtWith(["KINE M1524", "KINE M1762", "KINE M1142"]) } });
  await x.M.boot(); await settle();
  const owed = x.d.getElementById("cmf-need-owed"), ask = owed && Array.from(owed.querySelectorAll(".cmf-act a")).find((l) => /^Ask COBI/.test(txt(l)));
  check("⭐ Rulings to find never claims a ruling: it names the cards still listed and asks COBI to look",
    owed && txt(owed.querySelector("h4")) === "Rulings to find" && /named 2 common-course cards \(shared course IDs M1524 and M1762\) as already ruled on, but no ruling is on file/.test(txt(owed))
    && !/you already ruled|COBI owes|M1553|M1142/.test(txt(owed)) && ask && txt(ask) === "Ask COBI to find the rulings" && ask.getAttribute("target") === "_blank" && /noopener/.test(ask.getAttribute("rel"))
    && /^https:\/\/github\.com\/CPL-Initiative\/cpl-project-tracker\/issues\/new\?title=Find%20the%20Discipline%20in%20doubt%20rulings/.test(ask.getAttribute("href")) && /M1524%20and%20M1762/.test(ask.getAttribute("href")), owed && txt(owed));
  const rk = Array.from(x.d.querySelectorAll("#cmf-rank > li")), owedLi = rk[rk.length - 1];
  check("⭐ Needs you ranks it last, and its link lands on Ask COBI, highlighted", owedLi && /^Rulings to find: ask COBI about 2 cards$/.test(txt(owedLi))
    && owedLi.querySelector("a").getAttribute("data-onpage-to") === ask.getAttribute("href"));
  click(x.w, owedLi.querySelector("a")); await settle();
  check("and the press lands there", x.d.activeElement === ask && ask.classList.contains("cmf-hl"));
  const doubtLi = rk.find((l) => /^Common subject in doubt: cards to rule on/.test(txt(l)));
  check("⭐ the doubt list is a Needs you item with its count, landing on its check in Courses and M-IDs", doubtLi && /3 cards to rule on/.test(txt(doubtLi))
    && doubtLi.querySelector("a").getAttribute("data-onpage") === "cmf-card-courses" && doubtLi.querySelector("a").getAttribute("data-onpage-ref") === "doubt"
    && /^3 to rule on/.test(txt(x.d.querySelector('.cmf-card[data-key="courses"] .cmf-check[data-ref="doubt"] .cmf-check-fig'))));
  click(x.w, doubtLi.querySelector("a")); await settle();
  check("and the press lands on Common subject in doubt, highlighted", x.d.activeElement && x.d.activeElement.getAttribute("href") === "#coci-lookup/list/doubt" && x.d.activeElement.classList.contains("cmf-hl"));
  x = load({ files: { "kb/ccr_doubt.json": doubtWith([]) } });
  await x.M.boot(); await settle();
  check("⭐ an empty doubt list takes both off Needs you", !x.d.getElementById("cmf-need-owed") && !Array.from(x.d.querySelectorAll("#cmf-rank li")).some((l) => /^(Rulings to find|Common subject in doubt)/.test(txt(l))));

  /* Sam, 2026-11-24: "don't refer to cobix as, like sky, it is an internal tool". The page names COBI. */
  x = load({ files: { "kb/ccr_doubt.json": doubtWith(["KINE M1524"]) } });
  await x.M.boot(); await settle();
  check("⭐ the rendered page never names COBIx or Sky", !/COBIx|\bSky\b/.test(txt(x.d.querySelector(".cmf"))), (txt(x.d.querySelector(".cmf")).match(/.{40}(COBIx|\bSky\b).{20}/) || [""])[0]);

  // ── (8) College Data Collection ──
  const cdc = x.d.getElementById("cmf-card-cdc"), X = x.w.CPL_COMMONS_DATA, CM = X.model(BASE["kb/status/commons_data.json"]);
  check("(8) ⭐ the card's link reads Open College Data Collection", cdc && txt(cdc.querySelector(".cmf-links a")) === "Open College Data Collection" && cdc.querySelector(".cmf-links a").getAttribute("href") === "#collect");
  const lineLis = Array.from(cdc.querySelectorAll(".cmf-cdc-lines li"));
  check("(8) one line per dataset: catalogs, course outlines, credentials", lineLis.map((l) => l.getAttribute("data-dataset")).join(",") === "catalogs,outlines,credentials");
  const countLinks = Array.from(cdc.querySelectorAll('.cmf-cdc-lines a[href^="#collect/"]'));
  X._reset();
  const bad = countLinks.filter((l) => {
    const k = l.getAttribute("href").slice("#collect/".length), f = X.filterOf(k), n = +(/([\d,]+)/.exec(txt(l)) || [0, "-1"])[1].replace(/,/g, "");
    return !f || CM.colleges.filter((c) => f.test(c, CM)).length !== n;
  });
  check("(8) ⭐ every count is a link carrying its filter, and the filter counts the same colleges", countLinks.length === 6 && !bad.length, bad.map((l) => l.getAttribute("href") + " " + txt(l)).join(" | "));
  check("(8) the denominator is the file's own college count", lineLis[0] && txt(lineLis[0]).indexOf(" of " + CM.colleges.length + " colleges and campuses done") > 0);
  check("(8) the stuck count says a person or a fix, as the list it opens does", lineLis.slice(0, 2).every((li) => /Stuck on a person or a fix: \d+/.test(txt(li))) && !/Stuck: waiting on a person:/.test(txt(cdc)), txt(lineLis[0]));
  check("(8) the counting method names the districts beside the colleges and campuses", /colleges and continuing-education campuses, in \d+ districts \(\d+ plus Calbright\)\./.test(txt(cdc)), txt(cdc).slice(-260));
  const top = cdc.querySelector(".cmf-topfix"), topA = top && top.querySelector('a[href^="#collect/fix_"]');
  const topKey = topA ? topA.getAttribute("href").slice("#collect/fix_".length) : "";
  const reach = CM.colleges.filter((c) => (X.leversOf(c)[topKey] || 0) > 0).length;
  const most = Math.max.apply(null, Object.keys(CM.rule.levers).map((k) => CM.colleges.filter((c) => (X.leversOf(c)[k] || 0) > 0).length));
  check("(8) ⭐ the top line names one fix and the colleges it reaches, the most of any fix", topA && /^Top fix: /.test(txt(top)) && txt(topA) === reach + " colleges" && reach === most, txt(top));
  check("(8) the stuck colleges name the fix the file records, each opening its row", Array.from(cdc.querySelectorAll(".cmf-stuck a")).every((l) => /^#collect\/college\/[a-z0-9_-]+$/.test(l.getAttribute("href"))) && cdc.querySelectorAll(".cmf-stuck a").length > 0);
  check("(8) Colleges that moved this week, with its count opening the filtered list", txt(Array.from(cdc.querySelectorAll("h4")).find((h) => /moved/.test(txt(h)))) === "Colleges that moved this week" && !!cdc.querySelector('a[href="#collect/fresh"]'));
  // College Data Collection itself opens filtered to a card's colleges, from the address
  const cd = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: "https://example.org/index.html#collect/catalogs_stuck", runScripts: "dangerously" });
  const cw = cd.window;
  cw.fetch = (u) => { const hit = BASE[String(u).split("?")[0]] || (/cdc_integrations/.test(u) ? { integrations: [] } : null); return Promise.resolve(hit ? { ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) } : { ok: false, status: 404, json: () => Promise.reject(new Error("404")) }); };
  cw.scrollTo = () => {};
  ["commons_program_records.js", "commons_data_sharing.js", "commons_data_integrations.js", "commons_eta_clock.js", "commons_data.js"].forEach((f) => cw.eval(fs.readFileSync(f, "utf8")));
  await cw.CPL_COMMONS_DATA.boot(cw.document.getElementById("root"), "catalogs_stuck");
  for (let i = 0; i < 20; i++) await tick();
  const stuckN = CM.colleges.filter((c) => X.catalogState(CM, c) === "stuck").length;
  check("(8) ⭐ #collect/catalogs_stuck opens College Data Collection filtered to those colleges", txt(cw.document.getElementById("cdd-shown")).indexOf("Showing " + stuckN + " of " + CM.colleges.length + ": Catalogs: waiting on a person or a fix") === 0, txt(cw.document.getElementById("cdd-shown")));
  await cw.CPL_COMMONS_DATA.boot(cw.document.getElementById("root"), "fix_" + topKey);
  for (let i = 0; i < 20; i++) await tick();
  check("(8) and the top fix's address opens the colleges it reaches", txt(cw.document.getElementById("cdd-shown")).indexOf("Showing " + reach + " of ") === 0, txt(cw.document.getElementById("cdd-shown")));

  // ── the plain words ──
  const page = txt(x.d.querySelector(".cmf"));
  const labels = Array.from(x.d.querySelectorAll(".cmf h2, .cmf h3, .cmf h4, .cmf summary, .cmf button, .cmf a, .cmf dt")).map(txt).filter(Boolean);
  check("⭐ no label opens on What, When, How or Why", labels.every((l) => !/^(what|when|how|why)\b/i.test(l)), labels.filter((l) => /^(what|when|how|why)\b/i.test(l)).join(" | "));
  check("⭐ no Z time and no UTC in the rendered text", !/\d\d:\d\dZ\b|\bUTC\b/.test(page));
  check("⭐ no coder words: fold or queue", !/\bfold(s|ed)?\b|\bqueue\b/i.test(page), (page.match(/.{40}\b(fold|queue)\b.{40}/i) || [""])[0]);
  check("no glyph in Needs you's ranked links", !/[\u2190-\u21FF\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u.test(txt(x.d.getElementById("cmf-rank-box"))));
  check("tokens only: a raw hex only in the token block", SRC.split("\n").filter((l) => /#[0-9A-Fa-f]{6}\b/.test(l) && !/^\s*\/\//.test(l)).every((l) => /--cmf-[a-z-]+:#/.test(l)));
  check("American spelling", !/\b(colour|behaviour|organisation|analyse|centre|catalogue|whilst|amongst)\b/i.test(SRC));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "  [" + r[2] + "]")));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
