// CPL Implementation Funding — the OUTCOME CARDS (Sam, 2026-09-14).
//
// This suite REPLACES cpl_funding_statutory_bands.test.js. The bands are
// retired: Sam's ruling moved the band head onto the card — "Seems we can
// eliminate the outcomes header/layer if we can designate those at the
// Priority Level" — and the wrapper went with it.
//
// ⚠️ WHAT THE OLD SUITE PROTECTED IS WHAT THIS ONE PROTECTS, and the reason it
// had to be rewritten rather than deleted. Grouping cards into bands
// introduced a failure the flat list could not have: a card whose goal did not
// resolve got filtered into nothing and silently stopped rendering, and a
// priority invisible on this page still qualifies for funding against a target
// nobody can see. The flat grid removes the filter altogether — a STRONGER
// guarantee, not a weaker one — and §2 and §5 hold it from both directions:
// every card renders, always, and an unresolvable one is loud on its own face
// instead of hidden inside a wrapper.
//
// ⚠️ AND MEMBERSHIP STAYS DERIVED BY DEFAULT (§4). A curator can now override
// the outcome, but the measure-derived goal is still what an untouched card
// resolves to — from the metric's MILESTONE, the same resolver the earning
// math uses, never by matching a title. Titles are curator-editable and drift;
// a title-matched outcome would let the card a college reads and the dollars it
// counts toward disagree about what is being measured.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_outcome_cards.test.js`).
const { check, freshDom, boot, commit, click, finish } = require("./lib/cpl_funding_harness.js");

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const cards = (doc) => Array.from(doc.querySelectorAll("[data-priocard]"));
const reported = (doc) => Array.from(doc.querySelectorAll("[data-rcard]"));
const totals = (doc) => doc.querySelector(".cplfund-otot");

// A signed-in reviewer: the curator controls (the outcome picker, Remove, Add)
// render only when unlocked(), so the sections that exercise them need one.
function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}

const dom = freshDom();
const win = dom.window;
const doc = boot(win);
const modelPrios = win.CPL_FUNDING_TAB._effective().years[0].priorities.length;

// ── 1. the WRAPPER IS GONE — an absence guard, naming its ruling ────────────
// Not a tidiness check. The band carried the outcome's key, name, citation and
// statute quote, and the card carries all four now (§3). If a wrapper ever
// comes back, the card and the wrapper both state the outcome and the page has
// two places to disagree.
check("no statutory band section renders", doc.querySelectorAll(".cplfund-band").length === 0);
check("no orphan band renders", doc.querySelectorAll(".cplfund-band-orphan").length === 0);
check("the cards sit in ONE grid, not one grid per band",
  doc.querySelectorAll("#cplFundingMount .cplfund-prio").length === 1);

// ── 2. EVERY priority renders a card — none lost to the structure ───────────
// The count comes from the model, not typed, so this keeps holding when Sam
// adds or removes a priority through the tab.
check("every priority in the model renders a card", cards(doc).length === modelPrios);
check("every card is a direct child of the one grid",
  cards(doc).every((c) => c.parentNode.classList.contains("cplfund-prio")));
// The curator's order, not the config's storage order: priorityOrder is [0,2,1]
// on the live config, and the screen ordinal is what a reader reorders by.
check("the cards render in the curator's displayed order",
  cards(doc).map((c) => c.getAttribute("data-priocard")).join(",") ===
  cards(doc).map((_, i) => String(i)).join(","));

// ── 3. the outcome rides the CARD — all four pieces the band used to hold ───
const rows = cards(doc).map((c) => c.querySelector(".cplfund-cardhead"));
check("every priority card carries its head (the outcome, its law, its number)", rows.every(Boolean));
// ⭐ ONE LINE, NOT A ROW ABOVE THE TITLE (Sam, 2026-09-24, approving the mock:
// "I like your simplified priority card!"). The outcome reads IN the heading,
// beside the number — the picker itself in the internal view — so the card
// names it once; the law is the line under it.
check("the outcome reads in the card's heading, beside its number",
  cards(doc).every((c) => {
    const h4 = c.querySelector(".cplfund-cardhead h4");
    return !!h4 && !!h4.querySelector(".cplfund-prio-num") &&
      !!(h4.querySelector("select.cplfund-cardgoal-sel") || h4.querySelector(".cplfund-cardgoal-key"));
  }));
// THE OUTCOME'S NAME READS ONCE (Sam, 2026-09-23: "eliminate any redundancies
// in titles or designations"): beside the key, or in the card's own title when
// the title already says it. A curator reads it in the picker.
const GOAL_SHORT = { A: "Access", B: "Completion", C: "Career attainment", D: "Pilot projects" };
const pickedOf = (r) => {
  const s = r && r.querySelector("select.cplfund-cardgoal-sel");
  return s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].textContent : "";
};
// The key: its span on the reader view, the picker's face in the internal view.
const keyText = (r) => {
  const k = r && r.querySelector(".cplfund-cardgoal-key");
  return ((k ? flat(k) : pickedOf(r)).match(/\([A-D]\)/g) || []).join(" + ");
};
const keyLetters = (r) => keyText(r).match(/[A-D]/g) || [];
// The card's title: its custom-title field, else the name the heading shows.
const titleOf = (c) => {
  const i = c.querySelector('input[data-edit="prio-title"]');
  if (i) return i.value;
  const n = c.querySelector(".cplfund-cardhead-name");
  return n ? flat(n) : pickedOf(c.querySelector(".cplfund-cardhead")).replace(/^(\([A-D]\)\s*\+?\s*)+/, "");
};
check("every outcome row names its key, and the card names the outcome: beside it, in the picker, or in its title",
  rows.every((r, i) => {
    const ks = keyLetters(r);
    const where = (flat(r.querySelector(".cplfund-cardhead-name")) + " | " + pickedOf(r) + " | " +
      titleOf(cards(doc)[i])).toLowerCase();
    return ks.length > 0 && ks.every((k) => where.indexOf(GOAL_SHORT[k].toLowerCase()) !== -1);
  }));
check("a card whose title already names its outcome carries no second copy beside the key",
  (function () {
    const same = cards(doc).filter((c, i) => {
      const ks = keyLetters(rows[i]);
      return ks.length === 1 && titleOf(c).trim().toLowerCase() === GOAL_SHORT[ks[0]].toLowerCase();
    });
    // No name span beside the picker, and no title field repeating it.
    return same.length > 0 && same.every((c) => !c.querySelector(".cplfund-cardhead-name") &&
      !c.querySelector('.cplfund-cardhead input[data-edit="prio-title"]'));
  })());
check("every outcome row cites its own subdivision of §78093.2(d)(1)",
  rows.every((r) => /78093\.2\(d\)\(1\)\([A-D]\)/.test(flat(r.querySelector(".cplfund-cardgoal-cite")))));
// The statute's own words, verbatim — the same standard the goal spine holds.
check("every outcome row quotes the statute verbatim",
  rows.every((r) => !!r.querySelector(".cplfund-cardgoal-quote")));
check("the Access cards quote the access goal",
  rows.some((r) => /Increasing access to credit for prior learning opportunities equitably/i
    .test(flat(r.querySelector(".cplfund-cardgoal-quote")))));
check("the transcribed card quotes the completion goal",
  rows.some((r) => /Increasing completion through credit for prior learning awards/i
    .test(flat(r.querySelector(".cplfund-cardgoal-quote")))));
// The raised letter beside the title was the stitch to a wrapper that no longer
// exists; the row names the goal in words now.
check("the raised-letter goal marker is retired from the card title",
  doc.querySelectorAll("[data-priocard] h4 .cplfund-goalsup").length === 0);

// ── 4. the outcome is DERIVED from the milestone, never matched on a title ──
// On the live config both Access priorities measure eligible/applied and
// Completion measures transcribed. The proof it is not title matching: the card
// whose goal is (B) Completion is placed by its measure, and every untouched
// card reports itself as derived rather than as a curator's assignment.
// The curator's picker says it (2026-09-23): the derived option names the
// outcome it resolves to, so one control says both WHICH outcome and WHY.
// Since 2026-09-24 the picker IS the heading's outcome ("Priority 1 · (A)
// Access"), so its closed face reads the outcome alone and the WHY rides the
// option's title, "Set by the metric".
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  window.CPL_FUNDING_TAB.render();
  const sels = cards(d).map((c) => c.querySelector("[data-priogoal]"));
  const picked = (s) => (s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].textContent : "");
  const pickedTitle = (s) => (s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].getAttribute("title") : "");
  check("an untouched card's picker reads the outcome it resolves to, marked as set by the metric",
    sels.length === modelPrios && sels.every((s) => s && s.value === "derived" &&
      /^\([A-D]\)( \+ \([A-D]\))* \S/.test(picked(s)) && pickedTitle(s) === "Set by the metric"),
    JSON.stringify(sels.map(picked)));
  check("and the key beside it agrees with the outcome the picker names",
    cards(d).every((c, i) => {
      const ks = keyLetters(c.querySelector(".cplfund-cardhead"));
      return ks.length > 0 && ks.join() === (picked(sels[i]).match(/\(([A-D])\)/g) || []).map((x) => x[1]).join();
    }));
}

// ── 5. an unresolvable priority is LOUD, on its own face ────────────────────
// The failure this whole suite exists for. A metric whose milestone resolves to
// no statutory goal must still render its card — and say so where the reader is
// — so the gap is a thing someone can see and fix, not funding counted
// off-screen. Under the bands this was an orphan SECTION; a flat grid filters
// nothing, so the card is never at risk of vanishing and the warning moves onto
// the card itself.
{
  const dom2 = freshDom();
  const win2 = dom2.window;
  const doc2 = boot(win2);
  const T2 = win2.CPL_FUNDING_TAB;
  const cfg = JSON.parse(JSON.stringify(T2._config()));
  const sc = cfg.projects["cpl-implementation"].scenarios["Scenario 1"];
  // A metric no resolver can map: not eligible, not applied, not transcribed,
  // not accepted. Written as a SCENARIO OVERRIDE — the layer the tab itself
  // writes — rather than by reaching into the baked defaults.
  sc.yearPriorities = sc.yearPriorities || {};
  sc.yearPriorities["1"] = sc.yearPriorities["1"] || {};
  sc.yearPriorities["1"]["1"] = Object.assign({}, sc.yearPriorities["1"]["1"],
    { metric: "Something MAP has never measured" });
  delete sc.yearPriorities["1"]["1"].metric_src;
  delete sc.yearPriorities["1"]["1"].goals;
  T2._setConfig(cfg);
  T2.boot();
  T2.render();
  check("an unresolvable priority still renders its card", cards(doc2).length === modelPrios);
  const orphan = Array.from(doc2.querySelectorAll(".cplfund-cardgoal-orphan"));
  check("the card says it is awaiting a statutory outcome", orphan.length === 1);
  check("and says how to place it",
    !!orphan[0] && /Set the metric, or choose an outcome/i.test(flat(orphan[0].closest(".cplfund-cardhead"))));
}

// ── 6. the totals row names EVERY statutory goal, served or not ─────────────
// The one figure no single card can state — the per-outcome Total Possible sums
// two cards — plus the guarantee the wrapper used to give: the statute asks for
// an allocation "using all of the following goals", so a goal nobody serves is
// NAMED here rather than going quiet.
check("a Total Possible by outcome row renders", !!totals(doc));
["A", "B", "C", "D"].forEach((k) => {
  check("the totals row names goal (" + k + ")",
    new RegExp("\\(" + k + "\\)").test(flat(totals(doc))));
});
// Deliberately NOT the account's "reported through statewide work": that phrase
// names a goal's EVIDENCE STATE under §78093.2(d)(2), and this row is saying
// something else — that no priority counts toward this goal. Two claims sharing
// one phrase is how a near-duplicate drifts.
check("a goal no priority serves says how it IS reported",
  /reported through its designated activities/i.test(flat(totals(doc))));
check("a goal priorities DO serve carries a Total Possible figure",
  /\$[\d,]+/.test(flat(totals(doc))));

// ── 7. a curator's assignment overrides, and the sentinel restores ──────────
// ⚠️ CLEARING STORES A VALUE, IT DOES NOT DELETE THE KEY. Deleting lets a
// SHARED value resurface and the reset undoes itself on the next render — the
// same trap setProjectGoal() stores an empty list for.
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const sel = d.querySelector("[data-priogoal]");
  check("a curator sees an outcome picker on the card", !!sel);
  check("the picker offers the metric-derived outcome first, marked as set by the metric",
    sel && sel.options[0] && sel.options[0].value === "derived" && /^\([A-D]\)/.test(sel.options[0].textContent) &&
    sel.options[0].getAttribute("title") === "Set by the metric");
  // The fifth option is not a courtesy: "derived" is the only way back to the
  // measure's own reading once a curator has set one. It once had a second job
  // — an `accepted` milestone resolved to (B) AND (C) from 2026-09-01, which no
  // single-choice list can express — retired 2026-09-22, when career attainment
  // got its own measure and the counselor step went back to (B) alone.
  check("the picker offers all four statutory goals beside it", sel && sel.options.length === 5);
  commit(window, sel, "D");
  const row0 = d.querySelectorAll("[data-priocard]")[0].querySelector(".cplfund-cardhead");
  check("the assignment moves the card's outcome", /\(D\)/.test(keyText(row0)));
  const sel0 = d.querySelectorAll("[data-priocard]")[0].querySelector("[data-priogoal]");
  check("the picker shows the curator's choice in place of 'From the metric'",
    !!sel0 && sel0.value === "D" && !sel0.options[0].selected);
  check("the citation follows the assignment",
    /78093\.2\(d\)\(1\)\(D\)/.test(flat(row0.querySelector(".cplfund-cardgoal-cite"))));
  check("the statute quote follows the assignment",
    /chancellor.{0,3}s office.{0,3}s pilot projects/i.test(flat(row0.querySelector(".cplfund-cardgoal-quote"))));
  // Back to derived — and it STAYS back after a re-render.
  commit(window, d.querySelector("[data-priogoal]"), "derived");
  T.render();
  const row0b = d.querySelectorAll("[data-priocard]")[0].querySelector(".cplfund-cardhead");
  const sel0b = d.querySelectorAll("[data-priocard]")[0].querySelector("[data-priogoal]");
  check("clearing restores the measure-derived outcome",
    !!sel0b && sel0b.value === "derived" && !/\(D\)/.test(keyText(row0b)));
  check("and the restore survives a re-render rather than undoing itself",
    !!sel0b && /^\([A-D]\)/.test(sel0b.options[sel0b.selectedIndex].textContent) &&
    sel0b.options[sel0b.selectedIndex].getAttribute("title") === "Set by the metric");
}

// ── 8. reported cards are STORED, with their own identity ───────────────────
// Sam, 2026-09-14: "Seems the card should be stored with its own identity." The
// DEFAULT is still derived, which is what keeps his 2026-09-13 ruling alive — a
// measureless outcome shows a card whether or not anything is designated to it.
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const rc = reported(d);
  check("a reported card renders for a goal no priority measures", rc.length >= 1);
  check("every reported card carries the same outcome row as a measured one",
    rc.every((c) => !!c.querySelector(".cplfund-cardhead")));
  check("a reported card carries a Metric block saying it awaits a campus measure",
    rc.every((c) => /Awaiting a campus measure/i.test(flat(c.querySelector(".metric")))));
  // One card per goal: the picker does not OFFER a goal another card holds,
  // rather than refusing the click afterwards.
  const goals = rc.map((c) => keyText(c));
  check("no two reported cards hold the same outcome", new Set(goals).size === goals.length);
  const rcSel = rc[0].querySelector("[data-rcgoal]");
  check("a reported card's picker is live", !!rcSel);
  check("a reported card's picker does NOT offer 'derived' — it has no metric",
    rcSel && !Array.from(rcSel.options).some((o) => o.value === "derived"));
  // Removing a card must not make its goal vanish from the page.
  const before = reported(d).length;
  click(window, d.querySelector("[data-rcdel]"));
  check("removing a reported card removes it", reported(d).length === before - 1);
  check("but its goal is still named in the totals row",
    ["A", "B", "C", "D"].every((k) => new RegExp("\\(" + k + "\\)").test(flat(totals(d)))));
  check("and a curator is told which outcome now has no card",
    /no card/i.test(flat(d.querySelector(".cplfund-rprio-add-card"))));
}

// ── 9. every section below the Metric collapses, and carries its figure ─────
// ⚠️ THE SUMMARY VALUE IS THE POINT. A fold whose summary is only a label hides
// its content; these relocate it, so a reader who never opens "Progress" has
// still been given the Current Total.
{
  const secs = Array.from(cards(doc)[0].querySelectorAll(".cplfund-cardsec"));
  check("the first card carries collapsing sections below its metric", secs.length >= 3);
  check("every section is a real <details>, not a div pretending",
    secs.every((s) => s.tagName.toLowerCase() === "details"));
  check("every section's summary carries a value beside its label",
    secs.every((s) => !!s.querySelector(".cplfund-cardsec-val")));
  check("every section below the metric FOLLOWS the metric block",
    secs.every((s) => {
      const m = cards(doc)[0].querySelector(".metric");
      return m && (m.compareDocumentPosition(s) & 4) !== 0;
    }));
  // His 2026-09-13 ruling put the designate picker always visible. Collapsible
  // and collapsed are different asks, and only the first was made on 09-14.
  const desig = secs[secs.length - 1];
  check("the designated-activities section is open by default", desig.hasAttribute("open"));
  // The summary names the TARGET in whichever unit the priority carries — an
  // FTES priority reads "Target 2,948.6 CPL FTES", a headcount one (the baked
  // defaults, still the old model) reads "57,559 students". Asserting the FTES
  // wording alone would pass on the live config and fail on the fixture, which
  // is a test that only holds where it was written.
  check("the rate/target section names its target figure in the summary",
    /\d/.test(flat(secs[0].querySelector(".cplfund-cardsec-val"))) &&
    /Target|students/i.test(flat(secs[0].querySelector(".cplfund-cardsec-val"))));
}

// ── 10. ONE renderer for the designation count, list and Remove word ────────
// Sam, 2026-09-14: "ensure that the designate activities function allows me to
// both add or delete activities and that it auto updates 'Reported through 4…'"
// Adding was a picker, deleting was a Remove word that existed only on the
// reported box, and the count was rendered in one place and not the other.
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  window.CPL_FUNDING_TAB.render();
  const counts = Array.from(d.querySelectorAll("[data-desigcount]"));
  check("every card that can carry designations states a count", counts.length >= 1);
  check("a card with designations counts them rather than saying none",
    counts.some((c) => /\d+ designated project/i.test(flat(c))));
  check("an empty card reads positive-first, never 'no activities'",
    counts.every((c) => !/^\s*(No|None)\b/i.test(flat(c))));
  // The Remove word rides every designated row, on the card and the reported
  // box alike — one renderer, so the two cannot disagree.
  const withRows = d.querySelector(".cplfund-rprio-list");
  check("a designated activity carries a Remove word", !!withRows &&
    !!withRows.querySelector("[data-projrelease]"));
  check("the count and the list come from the same block",
    !!withRows && !!withRows.parentNode.querySelector("[data-desigcount]"));
  // Deleting one updates the count — the ask, checked end to end.
  const first = d.querySelector("[data-projrelease]");
  const goalOf = first.getAttribute("data-projgoal");
  const countBefore = (flat(d.querySelector('[data-desigcount="' + goalOf + '"]')).match(/(\d+) designated/) || [])[1];
  click(window, first);
  const countAfter = (flat(d.querySelector('[data-desigcount="' + goalOf + '"]')).match(/(\d+) designated/) || [])[1];
  check("removing a designated activity updates the count",
    countBefore && (countAfter === undefined || Number(countAfter) === Number(countBefore) - 1));
}

// ── 11. the project allocation SPLITS, and stops reporting twice ────────────
// Sam, 2026-09-14: "Start by keeping the total available (8959692) on D but
// make it editable so that if I enter something like 1000000, C auto populates
// 7959692...and vice versa."
//
// ⚠️ THE DOUBLE CLAIM IS THE POINT. The project pool is tagged to (C) AND (D),
// and goalFunding() pushed its FULL amount into each — the same figure
// reported under two statutory goals at once, which nothing summed and so
// nothing caught. These checks fail if anyone restores that.
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const fundOf = (goal) => {
    const card = Array.from(d.querySelectorAll("[data-rcard]"))
      .find((c) => keyText(c) === "(" + goal + ")");
    if (!card) return null;
    const sec = Array.from(card.querySelectorAll(".cplfund-cardsec"))
      .find((x) => /Project allocation/i.test(flat(x.querySelector(".cplfund-cardsec-lab"))));
    return sec ? flat(sec.querySelector(".cplfund-cardsec-val")) : null;
  };
  const inputOf = (goal) => d.querySelector('[data-edit="poolsplit"][data-field^="scaling_projects_tech::' + goal + '"]');
  check("a reported card carries a Project allocation section", fundOf("D") !== null);
  // The default: the whole allocation sits on (D) — his "start by keeping the
  // total available on D", and the statute's own reading, since (D) names the
  // pilot projects the pool funds.
  check("the whole project allocation starts on (D)", /8,959,692/.test(fundOf("D") || ""));
  check("(C) starts with none of it designated", /^\$0$/.test(fundOf("C") || ""));
  // ⚠️ The two must SUM to the allocation, never double it.
  const money = (t) => Number(String(t).replace(/[^0-9]/g, "")) || 0;
  check("the two designations sum to the allocation rather than doubling it",
    money(fundOf("C")) + money(fundOf("D")) === 8959692);
  // Type on (C); (D) takes the remainder.
  const cIn = inputOf("C");
  check("a shared allocation is editable on the card", !!cIn);
  commit(window, cIn, "1000000");
  T.render();
  check("typing 1,000,000 on (C) leaves (D) with 7,959,692",
    money(fundOf("C")) === 1000000 && money(fundOf("D")) === 7959692);
  check("and the pair still sums to the allocation exactly",
    money(fundOf("C")) + money(fundOf("D")) === 8959692);
  // ...and vice versa.
  commit(window, inputOf("D"), "2000000");
  T.render();
  check("typing on (D) gives (C) the remainder",
    money(fundOf("D")) === 2000000 && money(fundOf("C")) === 6959692);
  // Over-typing clamps rather than letting the two disagree.
  commit(window, inputOf("D"), "99999999");
  T.render();
  check("over-typing the allocation clamps instead of over-claiming it",
    money(fundOf("D")) === 8959692 && money(fundOf("C")) === 0);
}

// ── 12. reported outcomes carry recommended strategies ─────────────────────
// Sam, 2026-09-14: "please add a recommended strategies section to C and D".
// A reported card is NOT an entry in priorities(slot) — that is the whole
// safety of it — so its strategies get their own goal-keyed store rather than
// riding prioStrategies().
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const card = d.querySelector("[data-rcard]");
  const secs = Array.from(card.querySelectorAll(".cplfund-cardsec"))
    .map((x) => flat(x.querySelector(".cplfund-cardsec-lab")));
  check("a reported card carries a Recommended strategies section",
    secs.some((t) => /Recommended strategies/i.test(t)));
  check("it reads positive-first while empty",
    /Awaiting recommended strategies/i.test(flat(card)));
  const addBtn = card.querySelector("[data-rstratadd]");
  check("a curator can add a strategy to a reported outcome", !!addBtn);
  click(window, addBtn);
  const card2 = d.querySelector("[data-rcard]");
  check("adding one gives it an editable row", !!card2.querySelector('[data-edit="rstrategy"]'));
  check("and a Remove word beside it", !!card2.querySelector("[data-rstratdel]"));
  click(window, card2.querySelector("[data-rstratdel]"));
  check("removing it returns the card to the waiting state",
    /Awaiting recommended strategies/i.test(flat(d.querySelector("[data-rcard]"))));
}

// ── 13. card size is a CURATOR dial, and it stays in the browser ───────────
// Sam, 2026-09-14: "Make the height and width of the priority boxes changeable
// in curation mode." Per browser, not in the config: shares and titles are the
// model and belong to everyone, but how wide a card looks on the screen you are
// working at is a viewing preference.
{
  check("the size dials do NOT render for a reader", !doc.querySelector(".cplfund-cardsize"));
  // ⚠️ An unset width keeps today's layout exactly — no inline grid-template
  // until a curator moves the dial, so adding the control restyles nothing.
  check("an untouched grid carries no inline column override",
    !/grid-template-columns/.test(doc.querySelector(".cplfund-prio").getAttribute("style") || ""));
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const d = boot(window);
  window.CPL_FUNDING_TAB.render();
  const sizer = d.querySelector(".cplfund-cardsize");
  check("a curator sees the size dials", !!sizer);
  check("both a width and a height dial render",
    !!d.getElementById("cplFundCardW") && !!d.getElementById("cplFundCardH"));
  check("the height dial says it sets a minimum, not a fixed height",
    /Height sets a minimum/i.test(flat(sizer)));
  check("and says the setting stays in this browser", /stays in your browser/i.test(flat(sizer)));
}

finish();
