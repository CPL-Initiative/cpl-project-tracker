// tests/cpl_funding_s480_asks.test.js
//
// SAM'S FUNDING-TAB ASKS OF 2026-10-25 (Session 480):
//
//   1. "On funding tab, make the NC priorities title editable (want to change
//   it from NC-1". A noncredit card's label is a stored field; empty reads NC-n.
//
//   ⚠️ 2. "Where we list the priority area (Access, Completion...), maybe we
//   should make those chips on the college rows next to the titles. Example CR
//   Priority 1 [access chip]; NC Priority 1 [access - career attainment
//   chips]". Each row names its outcomes as chips, in statute order; a title
//   that only repeats the outcome drops ("Priority 1: Access" reads
//   "Priority 1 [Access]"). The noncredit card's heading carries the same chips.
//
//   ⚠️ 3. "Should set Priority 3 and 4 to have the same priority area
//   checkboxes as the other priority areas." A reported card gets the Serves
//   boxes; its own goal stays ticked (its picker moves it), and the boxes it
//   adds change the caption and the citation, never a figure.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_s480_asks.test.js`).
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish, commit, openDrill } = H;

const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();
const OUTCOMES = {
  ncLane: "outcomes",
  ncOutcomes: { "1": [
    { key: "exh", title: "Exhibits built or adopted", share: 0.5, goals: ["C", "A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted", metric_src: "nc_exh",
      target_rule: { kind: "pct_floor_cap", of: "nc_cdcp", pct: 0.05, floor: 2, cap: 10 } },
    { key: "course", title: "Noncredit CPL portfolio-development course", share: 0.5, goals: ["A", "B", "C"], unit_word: "courses",
      metric: "A noncredit CPL portfolio-development course", metric_src: "nc_course", target_rule: { kind: "fixed", n: 1 } }
  ] },
  reportedCards: ["C", "D"],
  reportedTitles: { D: "Innovation Projects" }
};
const PERF = { as_of: "2026-10-25", suppress_below: 10,
  statewide: { pa_u: 10, nc_exh: 5, nc_cdcp: 196, nc_course: 0 },
  colleges: { "Mt San Antonio": { pa_u: 100, nc_exh: 5, nc_cdcp: 196, nc_course: 0 } },
  feeders: {}, unmatched: {}, vet_star: {}, origination: { in_scope: {} } };
const COLLEGE = "Mt San Antonio";
function session() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}
function setup(opts) {
  opts = opts || {};
  const { window } = freshDom();
  if (opts.signedIn) window.CPL_SESSION = session();
  if (opts.public) window.CPL_FUNDING_PUBLIC = true;
  window.CPL_FUNDING_PERF = JSON.parse(JSON.stringify(PERF));
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const shared = T._getShared();
  T._setShared(Object.assign({}, shared, JSON.parse(JSON.stringify(OUTCOMES)), opts.extra || {},
    { pool: Object.assign({}, shared.pool, { nc_portion_pct: 15 }) }));
  T._setElig({ coordOk: true, coord: { [COLLEGE]: true }, optin: { [COLLEGE]: { status: "self_attested" } },
    ncAttestOk: true, ncAttest: {} });
  T.render();
  return { window, doc, T };
}
const ncCards = (doc) => Array.from(doc.querySelectorAll("[data-nccard]"));
const chips = (el) => Array.from(el ? el.querySelectorAll(".cf-goalchip") : []).map(flat);
const rowNames = (window, doc) => openDrill(window, doc, "c:" + COLLEGE).rows.map((r) => r.querySelector(".cf-subname"));

// ── 1. the noncredit label ──────────────────────────────────────────────────
{
  const { window, doc } = setup({ signedIn: true });
  const input = () => ncCards(doc)[0].querySelector('input[data-edit="nc-label"]');
  check("1a the noncredit card's label is a field, reading NC-1 until someone types one",
    !!input() && input().value === "NC-1" && input().getAttribute("placeholder") === "NC-1" &&
    /noncredit outcome 1/i.test(input().getAttribute("aria-label")));
  commit(window, input(), "  NC Priority 1 ");
  check("1b ⭐ a typed label replaces NC-1, trimmed", input().value === "NC Priority 1");
  const names = rowNames(window, doc).map(flat);
  check("1c the college row carries the typed label; the other outcome keeps NC-2",
    names.some((t) => /^NC Priority 1: Exhibits built or adopted/.test(t)) && names.some((t) => /^NC-2: /.test(t)));
  commit(window, input(), "");
  check("1d cleared, it reads NC-1 again", input().value === "NC-1");
}
{
  const { doc } = setup({ public: true, extra: { ncOutcomes: { "1": [Object.assign({}, OUTCOMES.ncOutcomes["1"][0], { label: "NC Priority 1" })] } } });
  const c = ncCards(doc)[0];
  check("1e the public page reads the stored label as text, with no field",
    !!c && !c.querySelector("input") && /^NC Priority 1\b/.test(flat(c.querySelector(".cplfund-cardhead"))));
}

// ── 2. the outcomes as chips ────────────────────────────────────────────────
{
  const { window, doc } = setup({ signedIn: true });
  const names = rowNames(window, doc);
  const nc1 = names.find((td) => /^NC-1: /.test(flat(td)));
  const nc2 = names.find((td) => /^NC-2: /.test(flat(td)));
  check("2a ⭐ a noncredit row keeps its title and names its outcomes as chips, in statute order",
    !!nc1 && chips(nc1).join(",") === "Access,Career attainment" && /Exhibits built or adopted/.test(flat(nc1)));
  check("2b three outcomes, three chips", !!nc2 && chips(nc2).join(",") === "Access,Completion,Career attainment");
  const cr = names.filter((td) => /^Priority \d/.test(flat(td)));
  check("2c every credit row carries the chip of the outcome it serves", cr.length > 0 && cr.every((td) => chips(td).length >= 1));
  check("2d ⭐ a credit title that only repeats its outcome drops: \"Priority 1 [Access]\"",
    cr.every((td) => {
      const words = chips(td).join(" and ");
      return flat(td).indexOf(": " + words) < 0;
    }));
  check("2e a chip is a word with the statute on hover",
    nc1.querySelector(".cf-goalchip").getAttribute("title").indexOf("78093.2(d)(1)(A)") >= 0 &&
    /Increasing access/.test(nc1.querySelector(".cf-goalchip").getAttribute("title")));
  const head = ncCards(doc)[0].querySelector(".cplfund-cardhead");
  check("2f the noncredit card's heading carries the same chips in place of (A) + (C)",
    chips(head).join(",") === "Access,Career attainment" && !/\(A\) \+ \(C\)/.test(flat(head)));
  check("2g the chip style is tokens, the Base and Cap chips' ink",
    /\.cf-goalchip \{[^}]*var\(--seal-blue-text[^}]*var\(--cobalt-on-dark/.test(
      Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n")));
}

// ── 3. the Serves boxes on a reported card ──────────────────────────────────
{
  const { window, doc, T } = setup({ signedIn: true });
  const card = (g) => doc.querySelector('[data-rprio="' + g + '"]');
  const boxes = (g) => Array.from(card(g).querySelectorAll("input[data-rcgoalmulti]"));
  check("3a ⭐ each reported card carries the four Serves boxes",
    ["C", "D"].every((g) => boxes(g).map((b) => b.value).join("") === "ABCD"));
  const own = boxes("C").find((b) => b.value === "C");
  check("3b its own goal is ticked and held; the picker moves it", own.checked && own.disabled &&
    boxes("C").filter((b) => b.checked).length === 1);
  const moneyBefore = flat(card("C"));
  const d = boxes("C").find((b) => b.value === "D");
  d.checked = true;
  d.dispatchEvent(new window.Event("change"));
  const law = flat(card("C").querySelector(".cplfund-cardgoal-quote"));
  check("3c ⭐ ticking (D) adds it to the card's citation", /\(C\) and \(D\)/.test(law) && /pilot projects/.test(law));
  check("3d it is stored goal-keyed, beside the title", JSON.stringify((T._getShared().reportedGoals || {}).C) === '["D"]');
  check("3e the closed picker names both outcomes",
    /\(C\) \+ \(D\)/.test(flat(card("C").querySelector("select[data-rcgoal] option[selected]"))));
  check("3f the figures on the card do not move (no dollar line changes)",
    (moneyBefore.match(/\$[\d,]+/g) || []).join() === (flat(card("C")).match(/\$[\d,]+/g) || []).join());
  const sel = card("C").querySelector("select[data-rcgoal]");
  sel.value = "B";
  sel.dispatchEvent(new window.Event("change"));
  check("3g re-pointed by its picker, the card serves its new goal alone",
    !!card("B") && !card("C") && boxes("B").filter((b) => b.checked).map((b) => b.value).join() === "B");
}
{
  const { doc } = setup({ public: true, extra: { reportedGoals: { C: ["D"] } } });
  const c = doc.querySelector('[data-rprio="C"]');
  check("3h the public page shows the added outcome in the heading, with no boxes",
    !!c && !c.querySelector("input[data-rcgoalmulti]") && /\(C\) \+ \(D\)/.test(flat(c.querySelector(".cplfund-cardhead"))));
}

finish();
