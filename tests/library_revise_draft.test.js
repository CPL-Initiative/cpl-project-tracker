// Revise a public Library visual from its card, with no session (Sam, 2026-11-05: "Build it").
//
// Guards the three parts that run without a session:
//   A. apply_edits.mjs, the one pure step of the library-revise-draft edge function: an edit
//      names a passage that occurs exactly once, all edits apply or none, and the page's frame
//      (doctype, title, viewport, no new outside script) survives;
//   B. the card: Draft it now shows only on a waiting request for a piece with a Pages copy and
//      something to change, sends the record's id and the name with the caller's credential, and
//      a ready draft from the card offers Open the draft, which reads cpl_library_drafts;
//   C. the edge function and the workflow say what they may and may not do (read with the
//      caller's credential, no publish from the function, the daily-dashboard concurrency group).
//
// Run: node tests/library_revise_draft.test.js
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const SRC = fs.readFileSync("library.js", "utf8");
const FN = fs.readFileSync("chatbox/supabase/functions/library-revise-draft/index.ts", "utf8");
const WF = fs.readFileSync(".github/workflows/library-publish.yml", "utf8");
const SQL = fs.readFileSync("kb/migrations/2026-11-05_library_drafts.sql", "utf8");
const PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/";

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(JSON.stringify(body)); } });
}
const settle = () => new Promise((r) => setTimeout(r, 0)).then(() => new Promise((r) => setTimeout(r, 0)));

function rec(over) {
  return Object.assign({ id: "11111111-1111-1111-1111-111111111111", slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points",
    kind: "visual", occasion: "ELL IET", made_on: "2026-10-23", version: "2", status: "approved", seen_by: "public",
    home: "public_repo", url: PAGES + "ell-iet-cpl-starting-points/", refresh_note: "Change the agenda date to December 9.",
    sources: [], versions: [], public_listed: true,
    regen: { requested_at: "2026-11-05T01:00:00Z", requested_by: "Sam", publish: "show" } }, over || {});
}

function load(rows, onFetch) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.localStorage.setItem("cpl_team_pass", "open-sesame");
  w.localStorage.setItem("cpl_library_author", "Sam");
  w.fetch = function (url, init) {
    calls.push({ url: String(url), init: init || {} });
    const o = onFetch && onFetch(String(url), init || {});
    return o || response(200, rows);
  };
  w.URL.createObjectURL = () => "blob:draft";
  const opened = [];
  w.open = function () { const win = { location: null, close() { win.closed = true; } }; opened.push(win); return win; };
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w, calls, opened, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}

(async function () {
  // ── A. the pure step ─────────────────────────────────────────────────────
  const E = await import(path.resolve("chatbox/supabase/functions/library-revise-draft/apply_edits.mjs"));
  const page = '<!doctype html><html><head><title>P</title><meta name="viewport" content="w"></head><body><p>Agenda: November 18.</p><p>Two rows.</p><p>Two rows.</p></body></html>';
  const ok = E.applyEdits(page, [{ old: "Agenda: November 18.", new: "Agenda: December 9." }]);
  check("A: an edit whose passage occurs once applies", ok.html && ok.html.includes("December 9") && !ok.html.includes("November 18"), JSON.stringify(ok));
  check("A: every other byte stays", ok.html === page.replace("Agenda: November 18.", "Agenda: December 9."));
  const twice = E.applyEdits(page, [{ old: "Two rows.", new: "Three rows." }]);
  check("A: a passage that occurs twice is refused", !!twice.error && /2 times/.test(twice.error), JSON.stringify(twice));
  const none = E.applyEdits(page, [{ old: "Agenda: November 18.", new: "Agenda: December 9." }, { old: "Not on the page.", new: "x" }]);
  check("A: all or none: one bad edit stores nothing", !!none.error && !none.html);
  check("A: no edit is no change", !!E.applyEdits(page, []).error);
  check("A: a replacement containing $& is taken literally", E.applyEdits(page, [{ old: "Two rows.</p><p>Two", new: "$& cost $5" }]).html.includes("$& cost $5"));
  check("A: the frame check names a dropped title", E.frameKept(page, page.replace("<title>P</title>", "")).includes("<title>"));
  check("A: the frame check refuses a new outside script",
    E.frameKept(page, page.replace("</body>", '<script src="https://x.example/a.js"></script></body>')).length === 1);
  check("A: a fenced JSON answer still parses", Array.isArray(E.parseAnswer('Here:\n```json\n{"edits":[{"old":"a","new":"b"}],"summary":"s"}\n```').edits));
  check("A: an answer with no edits list is an error", !!E.parseAnswer('{"summary":"x"}').error);

  // ── B. the card ──────────────────────────────────────────────────────────
  {
    const r = rec();
    const m = load([r]);
    await m.M.activate(); await settle();
    check("B: a waiting request on a Pages piece offers Draft it now", !!m.root.querySelector('[data-draftnowform="' + r.id + '"]'), m.root.textContent.slice(0, 400));
    check("B: a SharePoint piece does not", !m.M._canDraftHere(rec({ url: "https://studentrcc.sharepoint.com/x", home: "drive" })));
    check("B: a piece with nothing to change does not", !m.M._canDraftHere(rec({ refresh_note: null })));
    check("B: pasted text alone is enough to draft from", m.M._canDraftHere(rec({ refresh_note: null, sources: [{ title: "Agenda", text: "December 9" }] })));
    check("B: a linked document alone is not (the function names links, it does not open them)",
      !m.M._canDraftHere(rec({ refresh_note: null, sources: [{ title: "Agenda", url: "https://example.org/a" }] })));
  }
  {
    const r = rec();
    let sent = null;
    const m = load([r], function (url, init) {
      if (/library-revise-draft/.test(url)) { sent = { url, init }; return response(200, { draft_id: "d1", summary: "Changed the agenda date.", edits: 1 }); }
      return null;
    });
    await m.M.activate(); await settle();
    const f = m.root.querySelector('[data-draftnowform="' + r.id + '"]');
    f.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    await settle(); await settle();
    const body = sent ? JSON.parse(sent.init.body) : {};
    check("B: Draft it now calls the edge function with the id and the name", body.id === r.id && body.by === "Sam", JSON.stringify(body));
    check("B: with the caller's team phrase", sent && sent.init.headers["x-team-pass"] === "open-sesame");
    check("B: and says what the model changed", /Changed the agenda date/.test(m.root.textContent), m.root.textContent.slice(0, 300));
  }
  {
    const r = rec({ regen: { requested_at: "2026-11-05T01:00:00Z", requested_by: "Sam", publish: "show", ready_at: "2026-11-05T01:02:00Z", draft_id: "d1", draft_url: null } });
    const m = load([r], function (url) { return /cpl_library_drafts/.test(url) ? response(200, [{ html: "<p>draft</p>" }]) : null; });
    await m.M.activate(); await settle();
    const b = m.root.querySelector('[data-draftopen="d1"]');
    check("B: a ready draft from the card offers Open the draft", !!b, m.root.textContent.slice(0, 300));
    check("B: and still Replace the public copy", !!m.root.querySelector('[data-regenokform="' + r.id + '"]'));
    check("B: the card names the draft as Version 3", /Version 3 is ready to review/.test(m.root.textContent));
    b.dispatchEvent(new m.w.MouseEvent("click", { bubbles: true }));
    await settle(); await settle();
    const c = m.calls.find((x) => /cpl_library_drafts/.test(x.url));
    check("B: Open the draft reads the one draft behind the team phrase", c && /id=eq\.d1/.test(c.url) && c.init.headers["x-team-pass"] === "open-sesame");
    check("B: and opens it in a new tab", m.opened.length === 1 && m.opened[0].location === "blob:draft");
  }

  // ── C. what the function and the workflow may do ─────────────────────────
  check("C: the function reads and writes with the caller's credential, never the service key", !/SERVICE_ROLE|service_role|SUPABASE_SERVICE/i.test(FN));
  check("C: it asks for edits, never a whole page", /"edits":\[/.test(FN) && /applyEdits\(page, ans\.edits\)/.test(FN));
  check("C: it publishes nothing: no git, no Pages write", !/git |api\.github\.com/.test(FN));
  check("C: it refuses a piece with no Pages copy", /has no public copy on GitHub Pages/.test(FN));
  check("C: the workflow serializes with the daily cron", /group: daily-dashboard/.test(WF));
  check("C: and commits only pages and their receipts", /git add library\/\*\/index\.html kb\/receipts\/library_publish\//.test(WF));
  check("C: drafts are read and added behind the team phrase or a reviewer, never updated or deleted by the team",
    /for select\s+to anon, authenticated using \(public\.team_pass_ok\(\) or public\.is_allowed_reviewer\(\)\)/.test(SQL) &&
    !/for (update|delete)/.test(SQL) && /grant select, insert on public\.cpl_library_drafts to anon, authenticated;/.test(SQL));

  let pass = 0;
  results.forEach(([n, okk, why]) => { if (okk) pass += 1; console.log((okk ? "ok   " : "FAIL ") + n + (okk || !why ? "" : "  — " + why)); });
  console.log("\nlibrary_revise_draft.test.js: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
