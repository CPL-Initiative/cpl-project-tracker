// NC / Learning Partners: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. Three sections each carry a row of filter words (opportunity kind, use-case tier, open
// question status). Their words never overlap, so the address is a set of words, one per section off its default:
// #nc-learning-partners/outreach, /tier-1, /needs-research, or combined.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #nc-learning-partners/outreach opens the opportunity register on Outreach, and reports it;
//   (2) pressing All reports the bare tab, though the address still says outreach;
//   (3) ⭐ words combine in any order, one per section, and the address is built in section order;
//   (4) a later visit by an address opens its filters; a re-fired activation on the same address keeps a pick made since;
//   (5) a bare #nc-learning-partners opens every default (Needs Input on the questions); an unknown word leaves them.
//
// Run from repo root: `npm test` (or `node tests/nc_learning_partners_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("nc_learning_partners.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const DATA = JSON.parse(fs.readFileSync("kb/nc_learning_partners.json", "utf8"));
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id='nc-learning-partners-root'></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  w.CPL_CREDENTIAL_REFERENCE = { unified_titles: [] };
  w.fetch = (url) => {
    const body = /nc_learning_partners\.json/.test(String(url)) ? DATA : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.eval(SRC);
  w.CPL_NC_LEARNING_PARTNERS.activate();
  await tick();
  const doc = w.document;
  const S = w.CPL_NC_LEARNING_PARTNERS._state;
  const stash = () => { w.CPL_SESSION.stashReturnTab("nc-learning-partners"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const bar = (sec) => Array.prototype.slice.call(doc.querySelectorAll("#" + sec + " .nclp-filters button"));
  const lit = (sec) => { const b = bar(sec).filter((x) => x.getAttribute("aria-pressed") === "true")[0]; return b ? b.textContent : ""; };
  const word = (sec, t) => bar(sec).filter((x) => x.textContent === t)[0];
  const cards = (sec) => doc.querySelectorAll("#" + sec + " .nclp-card").length;
  return { w, doc, S, stash, lit, word, cards };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
function revisit(t, hash, other) {
  if (other) t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
  t.w.location.hash = hash;
  t.w.dispatchEvent(new t.w.CustomEvent("cpl-tab-activated", { detail: { tab: "nc-learning-partners" } }));
  return tick();
}
const nOutreach = DATA.opportunities.filter((o) => o.kind === "outreach").length;

(async function () {
  check("the fixture holds outreach opportunities", nOutreach > 0, String(nOutreach));
  {
    const a = await bootAt("#nc-learning-partners/outreach");
    check("(1) ⭐ #nc-learning-partners/outreach opens the register on Outreach", a.lit("nclp-sec-opp") === "outreach" &&
      a.cards("nclp-sec-opp") === nOutreach, a.lit("nclp-sec-opp") + " " + a.cards("nclp-sec-opp"));
    check("(1) the other sections keep their defaults", a.lit("nclp-sec-tax") === "All tiers" && a.lit("nclp-sec-q") === "Needs Input");
    check("(1) and reports it", a.stash() === "nc-learning-partners/outreach", a.stash());
    click(a.w, a.word("nclp-sec-opp", "All"));
    check("(2) All reports the bare tab (the address still says outreach)", a.lit("nclp-sec-opp") === "All" &&
      a.stash() === "nc-learning-partners" && a.w.location.hash === "#nc-learning-partners/outreach", a.stash());
    click(a.w, a.word("nclp-sec-tax", "Tier 1"));
    click(a.w, a.word("nclp-sec-q", "Needs research"));
    check("(3) two filters report tier-1/needs-research", a.stash() === "nc-learning-partners/tier-1/needs-research", a.stash());
    click(a.w, a.word("nclp-sec-q", "All"));
    check("(3) every question reports all-questions", a.stash() === "nc-learning-partners/tier-1/all-questions", a.stash());
    // (4)
    await revisit(a, "#nc-learning-partners/outreach");
    check("(4) a re-fired activation on the same address keeps the filters picked since", a.lit("nclp-sec-tax") === "Tier 1" &&
      a.lit("nclp-sec-opp") === "All", a.stash());
    await revisit(a, "#nc-learning-partners/needs-research/data-entry", true);
    check("(4) a later visit by an address opens its filters, the rest on their defaults", a.lit("nclp-sec-opp") === "data-entry" &&
      a.lit("nclp-sec-tax") === "All tiers" && a.lit("nclp-sec-q") === "Needs research", a.stash());
    check("(3) ⭐ words in any order report in section order", a.stash() === "nc-learning-partners/data-entry/needs-research", a.stash());
  }
  {
    const b = await bootAt("#nc-learning-partners/tier-2/research/all-questions");
    check("(3) ⭐ three words open three filters", b.S.opp === "research" && b.S.uc === "2" && b.S.q === "all" &&
      b.stash() === "nc-learning-partners/research/tier-2/all-questions", b.stash());
  }
  {
    const c = await bootAt("#nc-learning-partners");
    check("(5) a bare #nc-learning-partners opens every default", c.lit("nclp-sec-opp") === "All" && c.lit("nclp-sec-tax") === "All tiers" &&
      c.lit("nclp-sec-q") === "Needs Input" && c.stash() === "nc-learning-partners", c.stash());
    const d = await bootAt("#nc-learning-partners/elsewhere/tier-9");
    check("(5) unknown words leave every default", d.S.opp === "all" && d.S.uc === "all" && d.S.q === "open" && d.stash() === "nc-learning-partners", d.stash());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
