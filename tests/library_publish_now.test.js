// Publish now: the Library card starts the publish run (Sam, in session, 2026-11-12, S642).
//
// Sam: "would be nice to have a manual dispatch button in the library for things we need to push right away:)". He
// approved "JST How To Obtain and Upload to MAP" on its card at 16:12Z and it then waited for library-publish.yml,
// which runs every three hours at :41, until a session dispatched it by hand.
//
// Guards the failure modes:
//   A. The word shows only where a press can help: a draft from the card, approved and not yet published, and only to
//      a signed-in reviewer (the function refuses anyone else, so a word they cannot use is noise).
//   B. A press posts once to library-publish-now with the reviewer's session and names no workflow and no ref; the page
//      says what happens; a second press calls nothing and says so; nothing is stored across visits.
//   C. A refusal (the function not deployed yet, a 401, a 429) says so plainly and that the next scheduled run still
//      publishes it, and a later press may try again.
//   D. The page follows the record and shows the public link once the run moves it.
//   E. The Edge Function: the reviewer check before the key or GitHub, one workflow file (library-publish.yml), one
//      ref (main), no caller input, the two-minute hold, and the deploy list names it.
//
// Run: node tests/library_publish_now.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/";
const FN_URL = /\/functions\/v1\/library-publish-now$/;

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return typeof body === "string" ? Promise.reject(new Error("not json")) : Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
const APPROVED = { requested_at: "2026-11-12T15:50:00Z", requested_by: "Sam", ready_at: "2026-11-12T16:00:00Z", draft_id: "d1",
  approved_at: "2026-11-12T16:12:00Z", approved_by: "Sam", new_piece: true };
const ROWS = [
  // A new piece, approved with Publish it, waiting for the run.
  { id: "n1", slug: "jst-how-to-obtain-and-upload-to-map", title: "JST How To Obtain and Upload to MAP", kind: "visual", status: "requested",
    seen_by: "colleges", home: "not_filed", url: null, versions: [], created_at: "2026-11-12T15:40:00Z",
    brief: { say: "A how-to for colleges.", requested_by: "Sam", requested_on: "2026-11-12" }, sources: [], regen: Object.assign({}, APPROVED) },
  // A public piece whose revision was approved with Replace the public copy.
  { id: "p1", slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points", kind: "visual", status: "approved",
    seen_by: "public", home: "web", url: PAGES + "ell-iet-cpl-starting-points/", version: "5", made_on: "2026-11-05", versions: [],
    regen: Object.assign({}, APPROVED, { new_piece: false, draft_id: "d2" }) },
  // A ready draft not yet approved, and a piece with nothing open.
  { id: "r1", slug: "ready-one", title: "Ready one", kind: "visual", status: "approved", seen_by: "public", home: "web",
    url: PAGES + "ready-one/", version: "2", made_on: "2026-11-01", versions: [],
    regen: { requested_at: "2026-11-12T10:00:00Z", ready_at: "2026-11-12T10:05:00Z", draft_id: "d3" } },
  { id: "q1", slug: "quiet-one", title: "Quiet one", kind: "visual", status: "approved", seen_by: "public", home: "web",
    url: PAGES + "quiet-one/", version: "1", made_on: "2026-10-01", versions: [] },
];
function loadModule(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root">Loading</div></body></html>',
    { url: "https://example.org/#library/cards", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const data = JSON.parse(JSON.stringify(opts.rows || ROWS));
  w.fetch = function (url, init) {
    init = init || {};
    url = String(url);
    calls.push({ url: url, method: init.method || "GET", headers: init.headers || {}, body: init.body });
    if (FN_URL.test(url)) return opts.fn ? opts.fn(calls) : response(200, { ok: true, queued: true, already: false, by: "reviewer" });
    if (/cpl_library\?id=eq\./.test(url) && opts.follow) return response(200, opts.follow(calls, data));
    return response(200, data);
  };
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  if (opts.signedIn !== false) w.CPL_REVIEWER_SIGNIN = { getSession: function () { return { access_token: "aa.bb.cc", email: "sam@example.org" }; } };
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  const M = w.CPL_LIBRARY;
  if (M._publishPoll) { M._publishPoll.ms = opts.pollMs || 5; M._publishPoll.max = opts.pollMax || 3; }
  return { w: w, doc: w.document, calls: calls, data: data, M: M, root: w.document.getElementById("library-root") };
}
const tick = () => new Promise((r) => setTimeout(r, 10));
async function until(f, n) { for (let i = 0; i < (n || 200); i++) { if (f()) return true; await tick(); } return !!f(); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
const fnCalls = (m) => m.calls.filter((c) => FN_URL.test(c.url));
const word = (m, id) => m.root.querySelector('button[data-pubnow="' + id + '"]');
const said = (m, id) => { const p = m.root.querySelector('[data-pubnowsaid="' + id + '"]'); return p ? p.textContent : ""; };
function storageKeys(w) {
  const out = [];
  [w.localStorage, w.sessionStorage].forEach(function (st) { for (let i = 0; i < st.length; i++) out.push(st.key(i)); });
  return out.sort().join(",");
}

(async function () {
  // ── A. Where the word shows ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    const b = word(m, "n1");
    check("A ⭐ an approved new piece waiting for the run shows Publish now to a signed-in reviewer", !!b && /^Publish now/.test(b.textContent));
    check("A it is a real button with words and no glyph", !!b && b.tagName === "BUTTON" && b.getAttribute("type") === "button" && /lib-word/.test(b.className) && !/[←-⯿\u{1F300}-\u{1FAFF}]/u.test(b.textContent));
    check("A it sits beside the words that say the next scheduled run puts it up",
      !!b && /The next scheduled run puts it on its page \(every three hours\)/.test(b.closest(".lib-state").textContent));
    check("A an approved revision of a public page shows it too (Replace the public copy)", !!word(m, "p1"));
    check("A a ready draft not yet approved does not", !word(m, "r1"));
    check("A a piece with nothing open does not", !word(m, "q1"));
  }
  {
    const m = loadModule({ signedIn: false }); await m.M.activate(); await tick();
    check("A ⭐ signed out (the team phrase alone), the word is not shown", !word(m, "n1") && !word(m, "p1") && /next scheduled run/.test(m.root.textContent));
  }
  {
    const rows = JSON.parse(JSON.stringify(ROWS)); rows[0].regen.draft_id = null; rows[0].regen.draft_url = "https://claude.ai/artifact/x";
    const m = loadModule({ rows: rows }); await m.M.activate(); await tick();
    check("A an approved draft known only by a claude.ai link (the run cannot publish it) shows no word", !word(m, "n1"));
  }
  // ── B. A press, a second press, nothing stored ──
  {
    const m = loadModule({ pollMs: 60000, follow: function () { return []; } }); await m.M.activate(); await tick();
    const before = storageKeys(m.w);
    click(m.w, word(m, "n1"));
    await until(() => /The publish run has started/.test(said(m, "n1")));
    const c = fnCalls(m);
    check("B ⭐ a press posts once to library-publish-now", c.length === 1 && c[0].method === "POST");
    check("B ⭐ the body names no workflow and no ref", c.length === 1 && c[0].body === "{}" && !/\.yml|ref|main/.test(c[0].body));
    check("B it sends the reviewer's own session, never the team phrase",
      c.length === 1 && c[0].headers.Authorization === "Bearer aa.bb.cc" && !("x-team-pass" in c[0].headers));
    check("B ⭐ it says what happens in plain words", /The publish run has started\. The page is up in about three minutes\./.test(said(m, "n1")), said(m, "n1"));
    click(m.w, word(m, "n1"));
    await until(() => /already started/.test(said(m, "n1")));
    check("B ⭐ a second press while the run is pending calls nothing and says so",
      fnCalls(m).length === 1 && /already started, so pressing again starts nothing/.test(said(m, "n1")), said(m, "n1"));
    check("B nothing is stored across visits (no new browser storage key)", storageKeys(m.w) === before, storageKeys(m.w) + " vs " + before);
    const m2 = loadModule(); await m2.M.activate(); await tick();
    check("B a fresh visit starts clean: the word again, no line", !!word(m2, "n1") && !said(m2, "n1"));
  }
  // ── C. Refusals ──
  {
    let n = 0;
    const m = loadModule({ fn: function () { n++; return n === 1 ? response(404, "Function not found") : response(200, { ok: true, already: true }); } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "p1"));
    await until(() => /did not start/.test(said(m, "p1")));
    check("C ⭐ before the function is deployed (404), the card says the run did not start and the next scheduled run still publishes it",
      /The publish run did not start \(the service answered 404\)\. The page still goes up at the next scheduled run \(every three hours\)\./.test(said(m, "p1")), said(m, "p1"));
    check("C the refusal reads as an error", !!m.root.querySelector('[data-pubnowsaid="p1"].err'));
    click(m.w, word(m, "p1"));
    await until(() => /already waiting/.test(said(m, "p1")));
    check("C after a refusal a press may try again, and a run already waiting is named", fnCalls(m).length === 2 && /already waiting, and it publishes this page too/.test(said(m, "p1")), said(m, "p1"));
  }
  {
    const m = loadModule({ fn: function () { return response(401, { ok: false, reason: "not_allowed" }); } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "n1"));
    await until(() => /did not start/.test(said(m, "n1")));
    check("C a 401 says only a signed-in reviewer can start it", /only a signed-in reviewer can start it[\s\S]*next scheduled run/.test(said(m, "n1")), said(m, "n1"));
  }
  {
    const m = loadModule({ fn: function () { return response(429, { ok: false, reason: "too_soon", retry_after_s: 70 }); } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "n1"));
    await until(() => /less than two minutes ago/.test(said(m, "n1")));
    check("C the two-minute hold says a run started moments ago and no second one started", /no second one was started[\s\S]*next scheduled run/.test(said(m, "n1")), said(m, "n1"));
  }
  {
    const m = loadModule({ fn: function () { return Promise.reject(new Error("offline")); } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "n1"));
    await until(() => /network failed/.test(said(m, "n1")));
    check("C a network failure says so and names the next scheduled run", /did not start: the network failed\. The page still goes up/.test(said(m, "n1")));
  }
  // ── D. The public link once the record carries it ──
  {
    let reads = 0;
    const m = loadModule({ pollMax: 5, follow: function () {
      reads++;
      if (reads < 2) return [{ id: "n1", url: null, regen: Object.assign({}, APPROVED), status: "requested" }];
      return [{ id: "n1", url: PAGES + "jst-how-to-obtain-and-upload-to-map/", regen: null, status: "draft", version: "1", home: "web", file_type: "html" }];
    } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "n1"));
    await until(() => /The page is up:/.test(said(m, "n1")), 400);
    const a = m.root.querySelector('[data-pubnowsaid="n1"] a');
    check("D ⭐ once the run moves the record, the card shows the public link", !!a && a.getAttribute("href") === PAGES + "jst-how-to-obtain-and-upload-to-map/", said(m, "n1"));
    check("D it read only that record's own fields", m.calls.filter((c) => /cpl_library\?id=eq\.n1&select=/.test(c.url)).length === reads && reads === 2, String(reads));
    check("D the word is gone once the page is up", !word(m, "n1"));
  }
  {
    const m = loadModule({ pollMax: 2, follow: function () { return [{ id: "p1", url: PAGES + "ell-iet-cpl-starting-points/", regen: Object.assign({}, APPROVED, { draft_id: "d2" }) }]; } });
    await m.M.activate(); await tick();
    click(m.w, word(m, "p1"));
    await until(() => /has not moved the record yet/.test(said(m, "p1")), 400);
    check("D the following stops after a few reads and says the page goes up when the run finishes", /has not moved the record yet[\s\S]*goes up when it finishes/.test(said(m, "p1")), said(m, "p1"));
  }
  // ── E. The Edge Function and its deploy ──
  {
    const FN = fs.readFileSync("chatbox/supabase/functions/library-publish-now/index.ts", "utf8");
    const serve = FN.slice(FN.indexOf("Deno.serve("));
    const ymls = (FN.match(/"[A-Za-z0-9_.-]+\.yml"/g) || []).map((x) => x.slice(1, -1));
    check("E ⭐ the workflow allow-list holds exactly library-publish.yml", ymls.length === 1 && ymls[0] === "library-publish.yml" && /const WORKFLOW = "library-publish\.yml";/.test(FN), ymls.join(","));
    check("E ⭐ the ref is fixed to main and the dispatch body carries nothing else", /const REF = "main";/.test(FN) && /body: JSON\.stringify\(\{ ref: REF \}\)/.test(FN) && !/inputs:/.test(FN));
    check("E ⭐ it takes nothing from the caller (the request body is never read)", !/req\.(json|text|formData|body)\b/.test(FN) && !/searchParams/.test(FN));
    check("E the reviewer check runs before the key is read or GitHub is called",
      0 < serve.indexOf("await callerIsReviewer(req)") && serve.indexOf("await callerIsReviewer(req)") < serve.indexOf("DISPATCH_TOKEN") && serve.indexOf("await callerIsReviewer(req)") < serve.indexOf("gh("));
    check("E a reviewer's session only: no team phrase, the anon key never dispatches",
      !/team_pass_ok|x-team-pass/.test(FN) && /bearer !== anon/.test(FN) && /if \(!who\) return reply\(origin, 401/.test(serve));
    check("E it reads no table and writes nothing (its one PostgREST call is the reviewer check)", (FN.match(/\/rest\/v1\//g) || []).length === 1 && /rpc\/" \+ name/.test(FN));
    check("E the two-minute hold, and a run already waiting is reused", /HOLD_MS = 2 \* 60 \* 1000/.test(FN) && /reason: "too_soon"/.test(FN) && /\["queued", "pending", "waiting"\]/.test(FN));
    check("E the key: LIBRARY_DISPATCH_TOKEN, else WORKPLAN_DISPATCH_TOKEN; without either, 503",
      /Deno\.env\.get\("LIBRARY_DISPATCH_TOKEN"\) \|\| Deno\.env\.get\("WORKPLAN_DISPATCH_TOKEN"\)/.test(FN) && /reason: "not_configured"/.test(FN));
    const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");
    check("E cpl-chat-deploy.yml can deploy it (its choice list is the allowlist), with verify_jwt off", /options:[\s\S]*- library-publish-now/.test(DEPLOY) && /--no-verify-jwt/.test(DEPLOY));
    const GOV = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
    const g = (GOV.dismissed || {})["function:library-publish-now"] || (GOV.mapped || {})["function:library-publish-now"];
    check("E the governance surface map rules on it, and says it grants no new publishing power", !!g && /approved/.test(g) && /no new/i.test(g), g);
    const PUB = fs.readFileSync(".github/workflows/library-publish.yml", "utf8");
    check("E the workflow it dispatches still runs on dispatch", /workflow_dispatch:/.test(PUB));
    check("E the page names the function and no workflow file", /functions\/v1\/library-publish-now/.test(SRC) && !/library-publish\.yml"\s*[,}]/.test(SRC));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nlibrary_publish_now.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
