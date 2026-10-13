// A save on Annual Goals queues the dashboard build (Sam, Open Asks Sheet 75 card 2,
// "both", 2026-10-13): the Activities cards, the charts, the counts and the report
// follow within minutes instead of overnight.
//
// Guards:
//   (a) the function checks its caller as the caller, a reviewer's session or the team
//       phrase, BEFORE anything else; the anon key alone is refused; it writes no table;
//   (b) without its GitHub key it answers 503 and dispatches nothing; with it, a build
//       already queued, pending or waiting is reused, and only then does it dispatch,
//       on main, the one workflow;
//   (c) the deploy workflow's allowlist names it;
//   (d) the page: a move queues one build as the reviewer and says "within about 10
//       minutes" when the function queued one; a tabled or restored row (the
//       cpl-lifecycle-changed event, either tab) queues one with the team phrase's
//       header; signed out, nothing is queued;
//   (e) rows added or moved since the build show a signed-in editor at once: a live
//       sub-activity the table lacks draws under its home Activity (a tabled or D.* row
//       never), a drawn row whose id no longer exists hides, and a reader's page makes
//       no live read.
//
// Run from repo root: `npm test` (or `node tests/workplan_rebuild_queue.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── (a, b) the function ──
const FN = fs.readFileSync("chatbox/supabase/functions/workplan-rebuild/index.ts", "utf8");
const serve = FN.slice(FN.indexOf("Deno.serve("));
const callerAt = serve.indexOf("await callerMayEdit(req)");
check("(a) the caller check runs before the key is read or GitHub is called",
  callerAt > 0 && callerAt < serve.indexOf("WORKPLAN_DISPATCH_TOKEN") && callerAt < serve.indexOf("gh("));
check("(a) a refused caller gets 401 and nothing else", /if \(!who\) return reply\(origin, 401/.test(serve));
check("(a) the caller is asked about as the caller: is_allowed_reviewer with its bearer, team_pass_ok with its phrase",
  /rpc\("is_allowed_reviewer", \{ Authorization: "Bearer " \+ bearer \}\)/.test(FN) &&
  /rpc\("team_pass_ok", \{ Authorization: "Bearer " \+ anon, "x-team-pass": phrase \}\)/.test(FN));
check("(a) the anon key as a bearer is never taken for a reviewer", /bearer && bearer !== anon &&/.test(FN));
check("(a) it writes no table: its only database calls are the two rpc checks",
  (FN.match(/\/rest\/v1\//g) || []).length === 1 && /\/rest\/v1\/rpc\//.test(FN));
check("(b) no key, no dispatch: 503 not_configured", /if \(!token\) return reply\(origin, 503, \{ ok: false, reason: "not_configured" \}\)/.test(serve));
const waitAt = serve.indexOf('["queued", "pending", "waiting"]');
const dispatchAt = serve.indexOf('/dispatches"');
check("(b) a build already queued, pending or waiting is reused before any dispatch", waitAt > 0 && dispatchAt > waitAt &&
  /already: true/.test(serve.slice(waitAt, dispatchAt)));
check("(b) the dispatch names one workflow, on main", /const WORKFLOW = "daily-dashboard\.yml";/.test(FN) &&
  /body: JSON\.stringify\(\{ ref: "main" \}\)/.test(serve) && /const REPO = "CPL-Initiative\/cpl-project-tracker";/.test(FN));
check("(b) CORS names the site, never a wildcard", !/Allow-Origin": "\*"/.test(FN) && /cpl-initiative\.github\.io/.test(FN));

// ── (c) the deploy allowlist ──
const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");
check("(c) cpl-chat-deploy.yml can deploy it (its choice list is the allowlist)", /options:[\s\S]*- workplan-rebuild/.test(DEPLOY));

// ── (d) the page ──
const SRC = fs.readFileSync("workplan_goals.js", "utf8");
const TABLE = '<table><tbody><tr><th colspan="8" scope="rowgroup"><span class="wpg-title-cell" data-activity-title-edit="1" data-aid="1" ' +
  'data-val="Build AI-Enhanced CPL Infrastructure">Build AI-Enhanced CPL Infrastructure</span></th></tr>' +
  '<tr><th scope="row" rowspan="3" class="wpg-name"><span class="wpg-pid">1.1</span> <span class="wpg-title-cell" data-title-edit="1" data-pid="1.1">MAP Platform Development</span></th></tr>' +
  '<tr><th scope="row" rowspan="3" class="wpg-name"><span class="wpg-pid">1.2</span> <span class="wpg-title-cell" data-title-edit="1" data-pid="1.2">Sierra</span></th></tr>' +
  '</tbody></table>';

function makeDom(kind, queueReply) {
  const dom = new JSDOM("<!doctype html><html><head></head><body><div id=\"tab-workplan-goals\">" + TABLE + "</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (kind === "reviewer") w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  if (kind === "phrase") {
    w.CPL_TEAM_PHRASE = { session: () => ({ teamPass: "the-phrase", email: "(team)" }), clear() {},
      decorateHeaders(h, s) { if (s && s.teamPass) h["x-team-pass"] = s.teamPass; },
      unlockRow: () => w.document.createElement("span") };
  }
  dom._calls = [];
  w.fetch = function (url, opts) {
    url = String(url);
    dom._calls.push({ url: url, opts: opts || {} });
    if (/\/functions\/v1\/workplan-rebuild$/.test(url)) {
      const q = queueReply || { ok: true, status: 200, body: { ok: true, queued: true, already: false } };
      return Promise.resolve({ ok: q.ok, status: q.status, json: () => Promise.resolve(q.body), text: () => Promise.resolve("") });
    }
    if (/\/rpc\/workplan_move_sub_activity$/.test(url)) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ ok: true, new_id: "1.2.1" })) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "1.1" }, { id: "1.2" }]), text: () => Promise.resolve("") });
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
const queued = (dom) => dom._calls.filter((c) => /\/functions\/v1\/workplan-rebuild$/.test(c.url));

(async function () {
  let dom = makeDom("reviewer"), w = dom.window, doc = w.document;
  check("(d) loading the page queues nothing", queued(dom).length === 0);
  w.CPL_WORKPLAN_ADD.move("1.1", "MAP Platform Development");
  await settle();
  const sel = doc.getElementById("wpg-move-parent");
  sel.value = "1.2"; sel.dispatchEvent(new w.Event("change"));
  doc.querySelector(".wpg-btn-submit").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await settle();
  const q = queued(dom);
  check("(d) a move queues one build, as the reviewer, after the move itself",
    q.length === 1 && q[0].opts.method === "POST" && q[0].opts.headers.Authorization === "Bearer aaaa.bbbb.cccc" &&
    dom._calls.findIndex((c) => /workplan_move_sub_activity/.test(c.url)) < dom._calls.indexOf(q[0]));
  check("(d) and says when it shows", /It shows in its new place within about 10 minutes, when the build it queued finishes\./
    .test(doc.querySelector(".wpg-modal-card .wpg-status").textContent));

  dom = makeDom("phrase"); w = dom.window;
  w.dispatchEvent(new w.CustomEvent("cpl-lifecycle-changed", { detail: { pid: "1.2", state: "tabled" } }));
  await settle();
  const qp = queued(dom);
  check("(d) a tabled or restored row queues one build, with the team phrase's header",
    qp.length === 1 && qp[0].opts.headers["x-team-pass"] === "the-phrase");

  dom = makeDom(null); w = dom.window;
  w.dispatchEvent(new w.CustomEvent("cpl-lifecycle-changed", { detail: { pid: "1.2", state: null } }));
  await settle();
  check("(d) signed out, nothing is queued", queued(dom).length === 0);

  // ── (e) rows added or moved since the build show an editor at once ──
  function makeLive(kind) {
    const d = new JSDOM("<!doctype html><html><head></head><body><div id=\"tab-workplan-goals\">" + TABLE + "</div></body></html>",
      { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
    const ww = d.window;
    if (kind === "reviewer") ww.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
    d._calls = [];
    ww.fetch = function (url, opts) {
      url = String(url);
      d._calls.push({ url: url, opts: opts || {} });
      let body = [];
      if (/\/projects\?select=id,name$/.test(url)) body = [{ id: "1.1", name: "MAP Platform Development" },
        { id: "1.3", name: "EMS Corps" }, { id: "1.4", name: "Tabled pilot" }, { id: "D.1", name: "Helper" }];
      if (/workplan_activity_associations\?select=project_id,activity_id&is_primary=eq\.true$/.test(url)) body = [{ project_id: "1.3", activity_id: "1" }];
      if (/project_lifecycle\?select=project_id,state$/.test(url)) body = [{ project_id: "1.4", state: "tabled" }];
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve("") });
    };
    ww.eval(SRC);
    ww.document.dispatchEvent(new ww.Event("DOMContentLoaded"));
    return d;
  }
  dom = makeLive("reviewer"); doc = dom.window.document;
  await settle();
  const fresh = doc.querySelectorAll(".wpg-new-row");
  check("(e) a sub-activity saved since the build draws under its home Activity, named, with what is still to come",
    fresh.length === 1 && fresh[0].getAttribute("data-pid") === "1.3" && /1\.3 EMS Corps/.test(fresh[0].textContent) &&
    /Added since the last build/.test(fresh[0].textContent) && fresh[0].closest("tbody").querySelector('[data-aid="1"]') !== null);
  check("(e) a tabled row and a D.* helper row draw nothing", !doc.querySelector('.wpg-new-row[data-pid="1.4"]') && !doc.querySelector('.wpg-new-row[data-pid="D.1"]'));
  const moved = doc.querySelector('[data-title-edit="1"][data-pid="1.2"]').closest("tr");
  check("(e) a drawn row whose id no longer exists (moved away) leaves; the others stay",
    moved.hidden === true && doc.querySelector('[data-title-edit="1"][data-pid="1.1"]').closest("tr").hidden !== true);
  check("(e) the new row's header cell is a row header", fresh[0].querySelector("th").getAttribute("scope") === "row");
  dom = makeLive(null); doc = dom.window.document;
  await settle();
  check("(e) a reader's page makes no live read and draws nothing (the queued build brings it)",
    dom._calls.length === 0 && !doc.querySelector(".wpg-new-row"));

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
