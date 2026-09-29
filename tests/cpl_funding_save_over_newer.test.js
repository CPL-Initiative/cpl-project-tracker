// A window must not save its older copy of the funding model over a newer one.
//
// Sam, 2026-09-23: he published Scenario 1 at 19:44, then at 21:30 changed two
// cards, and the 21:30 save removed the published marker. The tab reads the
// config once, at load, and saveShared() PATCHes the WHOLE config, so a window
// that opened before the Publish put its older copy back, and neither screen
// said so. The PATCH now names the updated_at the window last read or wrote:
// a newer row matches nothing, and the window loads the newer version and asks
// for the change again.
//
// The stub below is the config row with PostgREST's two answers that matter: a
// PATCH whose filter matches nothing returns 200 with no rows, which is also
// what an RLS refusal returns. Only a re-read tells the two apart.
const { check, finish, freshDom, boot } = require("./lib/cpl_funding_harness.js");

const clone = (o) => JSON.parse(JSON.stringify(o));
const PID = "cpl-implementation";
const START = { projects: { [PID]: { label: "CPL", area: "cpl", scenarios: { "Scenario 1": {} } } } };

function makeStore() {
  return { config: clone(START), updated_at: "2026-09-23T19:00:00.000000+00:00", n: 0,
    patches: [], refuse: false, inFlight: 0, maxInFlight: 0 };
}
function stamp(store) {
  store.n++;
  store.updated_at = "2026-09-23T21:" + String(10 + store.n).padStart(2, "0") + ":00.123456+00:00";
}
function reply(body) {
  return Promise.resolve({ ok: true, status: 200,
    json: () => Promise.resolve(clone(body)), text: () => Promise.resolve(JSON.stringify(body)) });
}
function stubFetch(window, store) {
  window.fetch = function (url, opts) {
    const u = String(url), method = (opts && opts.method) || "GET";
    if (u.indexOf("/rest/v1/cpl_funding_config") < 0) return reply([]);
    if (method === "GET") return reply([{ config: store.config, updated_at: store.updated_at }]);
    if (method !== "PATCH") return reply([]);
    const m = u.match(/[?&]updated_at=eq\.([^&]+)/);
    const at = m ? decodeURIComponent(m[1]) : null;
    store.patches.push(at);
    store.inFlight++;
    store.maxInFlight = Math.max(store.maxInFlight, store.inFlight);
    return new Promise((r) => setTimeout(r, 5)).then(() => {
      store.inFlight--;
      if (store.refuse) return reply([]);                              // RLS: no rows
      if (at !== null && at !== store.updated_at) return reply([]);   // stale: no rows
      store.config = JSON.parse(opts.body).config;
      stamp(store);
      return reply([{ id: "default", config: store.config, updated_at: store.updated_at }]);
    });
  };
}
function signIn(window) {
  window.CPL_SESSION = {
    get: () => ({ email: "curator@example.org", access_token: "t" }),
    isFresh: () => true,
    authHeaders: () => ({ Authorization: "Bearer t" }),
  };
}
const settle = async (window) => { for (let i = 0; i < 12; i++) await new Promise((r) => window.setTimeout(r, 4)); };
const saveLine = (doc) => { const e = doc.querySelector(".cplfund-saving"); return e ? e.textContent : ""; };
const scenarios = (cfg) => Object.keys(cfg.projects[PID].scenarios).sort();

(async function () {
  const store = makeStore();
  const dom = freshDom();
  const w = dom.window;
  delete w.CPL_FUNDING_NO_REMOTE;
  stubFetch(w, store);
  signIn(w);
  const doc = boot(w);
  await settle(w);
  const T = w.CPL_FUNDING_TAB;
  check("setup: the window loaded the row and is signed in",
    scenarios(T._config()).join() === "Scenario 1" && !!doc.getElementById("cplFundScenNew"));

  // ── 1. Another window publishes; this window, still on its older copy, saves ──
  store.config.projects[PID].published = "Scenario 1";
  store.config.projects[PID].scenarios["Scenario 1"].pool = 123;
  stamp(store);
  const newer = store.updated_at;
  T._newScenario();
  await settle(w);
  check("1a the stale save names the version the window read",
    store.patches[0] === "2026-09-23T19:00:00.000000+00:00");
  check("1b the newer row keeps the other window's published marker",
    store.config.projects[PID].published === "Scenario 1" && store.updated_at === newer);
  check("1c the newer row is not overwritten by the older copy",
    store.config.projects[PID].scenarios["Scenario 1"].pool === 123 && scenarios(store.config).join() === "Scenario 1");
  check("1d the window now shows the newer version",
    T._config().projects[PID].published === "Scenario 1" && scenarios(T._config()).join() === "Scenario 1");
  check("1e the window says the change was not saved, and why",
    /not saved: another window saved a newer version/.test(saveLine(doc)));

  // ── 2. The same window saves again, now over the version it holds ──
  T._newScenario();
  await settle(w);
  check("2a the next save names the newer version and lands",
    store.patches[1] === newer && scenarios(store.config).join() === "Scenario 1,Scenario 2");
  check("2b it keeps the published marker it adopted",
    store.config.projects[PID].published === "Scenario 1");
  check("2c the window reports saved", /^saved$/.test(saveLine(doc).trim()));

  // ── 3. Two saves asked for at once go one at a time, the latest state last ──
  const before = store.patches.length;
  T._newScenario();
  T._newScenario();
  await settle(w);
  check("3a never two PATCHes in flight", store.maxInFlight === 1);
  check("3b the second save waited and carried both edits",
    store.patches.length - before === 2 &&
    scenarios(store.config).join() === "Scenario 1,Scenario 2,Scenario 3,Scenario 4");
  check("3c the second PATCH names the version the first one wrote",
    store.patches[before + 1] !== store.patches[before] && store.patches[before + 1] !== null);

  // ── 4. A refused credential still reads as a refusal, and still rolls back ──
  store.refuse = true;
  const atBefore = store.updated_at;
  T._newScenario();
  await settle(w);
  check("4a a refusal leaves the row alone", store.updated_at === atBefore && scenarios(store.config).length === 4);
  check("4b the window rolls back to the last saved copy", scenarios(T._config()).length === 4);
  check("4c the window says it could not save", /could not save/.test(saveLine(doc)));

  finish();
})().catch((e) => { check("the suite ran without throwing: " + (e && e.message), false); finish(); });
