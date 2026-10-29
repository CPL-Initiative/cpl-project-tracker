// The published scenario paints first (Sam, 2026-10-28: "If there is a way you
// can have the funding tab open with the current published scenario first, it
// would load faster. Now it needs to cycle through them starting with Scenario
// 1"). boot() used to draw the code's defaults, which read as Scenario 1, then
// draw again as each of its seven loads landed. Now, with the shared config in
// flight, the mount holds one quiet line and no figures; the config lands and
// the first paint is the published scenario. A config that is slow or fails
// lets the defaults paint after the hold, as before.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_published_first.test.js`).
const { check, finish, freshDom, dataSrc, consumerSrc } = require("./lib/cpl_funding_harness.js");

const tick = () => new Promise((r) => setTimeout(r, 0));

// The shared row as Supabase holds it: Scenario 2 published, Scenario 1 not.
const ROW = [{ updated_at: "2026-10-28T00:00:00Z", config: { projects: { "cpl-implementation": {
  label: "CPL Implementation", area: "cpl", published: "Scenario 2",
  scenarios: { "Scenario 1": {}, "Scenario 2": { pool: { admin_cost: 900000 } } } } } } }];

(async () => {
  const dom = freshDom();
  const win = dom.window;
  delete win.CPL_FUNDING_NO_REMOTE;
  let answer;
  const cfg = new Promise((r) => { answer = r; });
  let configCalls = 0;
  win.fetch = function (url) {
    if (/cpl_funding_config/.test(String(url))) {
      configCalls++;
      return cfg.then((rows) => ({ ok: true, json: () => Promise.resolve(rows) }));
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  };
  win.eval(dataSrc);
  win.eval(consumerSrc);
  const T = win.CPL_FUNDING_TAB;
  T.boot();
  const mount = win.document.getElementById("cplFundingMount");

  check("the config is asked for once", configCalls === 1);
  check("while the config is in flight the mount holds one quiet status line and no figures",
    !!mount.querySelector("[data-config-hold][role=status]") && mount.children.length === 1 &&
    /Loading the funding figures/.test(mount.textContent));
  check("...and the tab has not adopted a scenario from the defaults yet", T._scenario().loaded === false);

  answer(ROW);
  for (let i = 0; i < 5; i++) await tick();

  check("the config lands: the hold line is gone and the tab is drawn",
    !mount.querySelector("[data-config-hold]") && mount.textContent.length > 1000);
  check("the first paint is the published scenario, Scenario 2", T._scenario().name === "Scenario 2");

  // The fallback, read from the source: a slow or failed config never holds the tab forever.
  check("a slow config releases the hold after CONFIG_HOLD_MS",
    /setTimeout\(releaseConfigHold, CONFIG_HOLD_MS\)/.test(consumerSrc) && /CONFIG_HOLD_MS = 4000/.test(consumerSrc));
  check("a failed config releases it at once",
    /\.catch\(function \(\) \{ remoteLoaded = true;[^}]*releaseConfigHold\(\); \}\)/.test(consumerSrc));
  check("tests and pages without the remote never hold",
    /if \(!remoteEnabled\(\) \|\| remoteLoaded \|\| configHold\) return;/.test(consumerSrc));
  finish();
})();
