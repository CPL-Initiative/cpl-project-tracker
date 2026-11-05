// Sierra Training: every view has an address (2026-11-04).
//
// Asked in session, 2026-11-04: "make sure that the sign in link from the emails takes the user back to the view they
// logged in from", then "Should remember to make that fix on all COBI views". A magic link opens a new browser tab, so
// only the address survives. The number cards that are views (Still to do, Thumbs-down, Instructions in use) open from
// #sierra-training/<todo|down>[/inuse], and the tab reports the card views on screen. The free dropdown filters are
// not carried.
//
// WHAT THIS GUARDS:
//   (1) ⭐ #sierra-training/down opens the Thumbs-down view, and reports it;
//   (2) pressing Still to do reports the bare tab, though the address still says down;
//   (3) ⭐ /inuse opens "Instructions in use", alone or after a feedback view, and reports it;
//   (4) a later visit by an address opens its view (the shell fires onActivate once; the module listens itself);
//   (5) a bare #sierra-training opens Still to do, and an unknown word leaves it.
//
// Run from repo root: `npm test` (or `node tests/sierra_training_view_address.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("sierra_training.js", "utf8");
const DEFAULTS = fs.readFileSync("sierra_rule_defaults.js", "utf8");
const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 20));
const iso = (h) => new Date(Date.now() - h * 3600e3).toISOString();

const FEEDBACK = [
  { turn_id: "f1", rating: "down", status: "new", question: "comptia", response: "a", audience: "student", page: "sierra", created_at: iso(1) },
  { turn_id: "f2", rating: "down", status: "addressed", question: "cpr", response: "a", audience: "student", page: "sierra", created_at: iso(2) },
  { turn_id: "f3", rating: "up", status: "new", question: "nursing", response: "a", audience: "student", page: "sierra", created_at: iso(3) },
];
const GUIDANCE = [
  { id: "g1", rule: "Name the college.", kind: "directive", active: true, created_by: "(team)", created_at: iso(10) },
  { id: "g2", rule: "An old rule.", kind: "directive", active: false, created_by: "(team)", created_at: iso(30) },
];

async function bootAt(hash) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div class='main-container'><div id='sierra-training-root'></div></div></body></html>",
    { runScripts: "outside-only", url: "https://example.org/index.html" + hash });
  const w = dom.window, local = {}, per = {};
  const bag = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
  Object.defineProperty(w, "localStorage", { value: bag(local), configurable: true });
  Object.defineProperty(w, "sessionStorage", { value: bag(per), configurable: true });
  local.cpl_team_pass = "team-secret";
  w.alert = () => {}; w.confirm = () => true;
  w.fetch = (url) => {
    const u = String(url);
    const body = /sierra_feedback/.test(u) ? FEEDBACK : /sierra_guidance/.test(u) ? GUIDANCE
      : /chat_interactions/.test(u) ? [{ id: 1, session_id: "s1", question: "q", response: "r", top_similarity: 0.9, created_at: iso(1) }] : [];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.eval(SESSION);
  w.eval(DEFAULTS);
  w.eval(SRC);
  w.CPL_SIERRA_TRAINING_TAB.activate();
  await tick();
  const root = w.document.getElementById("sierra-training-root");
  const stash = () => { w.CPL_SESSION.stashReturnTab("sierra-training"); return (JSON.parse(local.cpl_sb_return_tab || "{}")).tab; };
  const card = (k) => root.querySelector('[data-stat="' + k + '"]');
  const pressed = (k) => !!card(k) && card(k).getAttribute("aria-pressed") === "true";
  const lit = () => ["todo", "down", "inuse"].filter(pressed).join(",");
  return { w, root, stash, card, lit };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

(async function () {
  {
    const a = await bootAt("#sierra-training/down");
    check("(1) ⭐ #sierra-training/down opens the Thumbs-down view", a.lit() === "down", a.lit());
    check("(1) and reports it", a.stash() === "sierra-training/down", a.stash());
    click(a.w, a.card("todo"));
    check("(2) Still to do reports the bare tab (the address still says down)",
      a.lit() === "todo" && a.stash() === "sierra-training" && a.w.location.hash === "#sierra-training/down", a.lit() + " " + a.stash());
    click(a.w, a.card("inuse"));
    check("(3) Instructions in use on Still to do reports sierra-training/inuse", a.lit() === "todo,inuse" && a.stash() === "sierra-training/inuse", a.stash());
    // (4) a later visit
    a.w.location.hash = "#sierra-training/down/inuse";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "sierra-training" } }));
    await tick();
    check("(4) a later visit by an address opens its views", a.lit() === "down,inuse" && a.stash() === "sierra-training/down/inuse", a.lit());
    a.w.location.hash = "#sierra-training/todo";
    a.w.dispatchEvent(new a.w.CustomEvent("cpl-tab-activated", { detail: { tab: "sierra-training" } }));
    await tick();
    check("(4) #sierra-training/todo opens Still to do and clears Instructions in use", a.lit() === "todo" && a.stash() === "sierra-training", a.lit());
  }
  {
    const b = await bootAt("#sierra-training/inuse");
    check("(3) ⭐ #sierra-training/inuse opens Instructions in use on Still to do", b.lit() === "todo,inuse" &&
      !b.root.querySelector("#sit-guid-list .sit-rule-off"), b.lit());
    check("(3) and reports it", b.stash() === "sierra-training/inuse", b.stash());
  }
  {
    const c = await bootAt("#sierra-training");
    check("(5) a bare #sierra-training opens Still to do", c.lit() === "todo" && c.stash() === "sierra-training", c.lit());
    const d = await bootAt("#sierra-training/elsewhere");
    check("(5) an unknown word leaves Still to do", d.lit() === "todo" && d.stash() === "sierra-training", d.lit());
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
