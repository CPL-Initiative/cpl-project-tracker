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
//      caller's credential, no publish from the function, the daily-dashboard concurrency group);
//   D. Ask for more changes on a ready draft keeps that draft (Sam, 2026-11-05: "nothing seemed to happen";
//      SkyCartwheel found Start would have dropped Version 3 and drafted from Version 2): the new request
//      names the draft as its base, lists it under earlier, and the function drafts from it.
//   E. Sam's "build fixes 1-3" (2026-11-05): Sierra's budget is counted the same way in cpl-chat, the drafter
//      (sierra_text.mjs) and the card (library.js sierraText), on a real page; the drafter tells the model the
//      budget and stores the count; the card's check says when a draft runs past it and checks target size;
//      a published card draft whose record names a script raises Source behind the page.
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
    { url: "https://example.org/#library/cards", runScripts: "dangerously" });
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
  // The draft opens in a sandboxed frame (COBIx on #3077): the stub records what the new tab is written with.
  w.open = function () {
    const frame = { srcdoc: null };
    const win = { location: null, written: "", close() { win.closed = true; },
      document: { open() {}, close() {}, title: "", write(h) { win.written += h; }, querySelector(q) { return q === "iframe" ? frame : null; } }, frame: frame };
    opened.push(win); return win;
  };
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
    const tab = m.opened[0] || { written: "", frame: {} };
    check("B: and opens it in a new tab", m.opened.length === 1 && /<iframe sandbox="/.test(tab.written));
    check("B: ⭐ inside a sandbox with no allow-same-origin, never a blob: URL that runs as this page (COBIx on #3077)",
      /sandbox="allow-scripts allow-popups[^"]*"/.test(tab.written) && !/allow-same-origin/.test(tab.written) && tab.location === null &&
      typeof tab.frame.srcdoc === "string" && tab.frame.srcdoc.length > 0 && !/createObjectURL\(new Blob\(\[rows\[0\]\.html/.test(SRC));
  }

  // ── D. more changes build on the draft ───────────────────────────────────
  {
    const ready = { requested_at: "2026-11-02T21:20:29Z", requested_by: "Sam", publish: "show", ready_at: "2026-11-03T06:21:50Z", draft_id: "d3", draft_url: "https://claude.ai/artifact/x" };
    const r = rec({ refresh_note: "Remove the one org; add the December 9 agenda.", regen: ready });
    let patch = null;
    const m = load([r], function (url, init) {
      if (init.method === "PATCH" && /rest\/v1\/cpl_library\?id=eq\./.test(url)) { patch = JSON.parse(init.body); return response(200, [Object.assign({}, r, patch)]); }
      return null;
    });
    await m.M.activate(); await settle();
    const more = m.root.querySelector('[data-revise="' + r.id + '"]');
    check("D: a ready draft's card offers Ask for more changes", more && /Ask for more changes/.test(more.textContent));
    more.dispatchEvent(new m.w.MouseEvent("click", { bubbles: true }));
    await settle();
    const box = m.root.querySelector('form[data-cboxform="' + r.id + '"]');
    check("D: the card's box is headed More changes to Version 3, shows what was asked, and keeps the draft (Version 22)",
      !!box && /More changes to Version 3 \(the draft\)/.test(box.textContent) && /Asked so far/.test(box.textContent) &&
      /Remove the one org/.test(box.textContent) && /on top of the draft/.test(box.textContent) && /Start over from Version 2/.test(box.textContent),
      box ? box.textContent.slice(0, 400) : m.root.textContent.slice(0, 300));
    m.w.document.getElementById("cb-instr-" + r.id).value = "Add Request Adopt links to each course.";
    box.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    await settle(); await settle();
    const g = patch && patch.regen || {};
    check("D: the new request names the ready draft as its base", g.based_on_draft === "d3", JSON.stringify(patch));
    check("D: and keeps it, with what was asked for it, under earlier",
      Array.isArray(g.earlier) && g.earlier.length === 1 && g.earlier[0].draft_id === "d3" && /December 9/.test(g.earlier[0].note || ""), JSON.stringify(g));
    check("D: the new request is waiting, not ready", g.requested_at && !g.ready_at && !g.draft_id);
    const waiting = rec({ regen: { requested_at: "2026-11-05T14:00:00Z", requested_by: "Sam", publish: "show", based_on_draft: "d3", earlier: g.earlier } });
    check("D: the card then says the more changes sit on top of Version 3", /on top of Version 3, the draft; its changes are kept\. Version 2 stays public/.test(m.M._regenWords(waiting)), m.M._regenWords(waiting));
    check("D: and Copy the request says to start from that draft", /start from draft d3/.test(m.M._requestText(waiting)));
    check("D: a base known only by its claude.ai link goes to a session, never Draft it now",
      !m.M._canDraftHere(rec({ regen: { requested_at: "2026-11-05T14:00:00Z", requested_by: "Sam", publish: "show", based_on_url: "https://claude.ai/artifact/x" } })));
  }
  check("D: the function keeps each edit as a Was and Now pair for the card's What changed", /pairs: \(Array\.isArray\(ans\.edits\)/.test(FN));
  check("D: the function drafts from the named draft, read with the caller's credential, in place of the public copy",
    /g\.based_on_draft/.test(FN) && /cpl_library_drafts\?id=eq\.\$\{baseDraft\}&library_id=eq\.\$\{r\.id\}/.test(FN) && /based_on: basedOn/.test(FN));

  // ── E. the check run on a ready draft (Version 22: "promise a check, not a repair") ──
  {
    const m = load([]);
    const page = function (h) { return new JSDOM(h).window; };
    const bad = page('<!doctype html><html><head></head><body><h1>A</h1><h3>B</h3><p style="color:#AAAAAA;background:#FFFFFF">Faint words</p><img src="x.png"><a href="/y"></a></body></html>');
    const c1 = m.M._checkDoc(bad.document, bad);
    const said = c1.fix.join(" ");
    check("E: the check names a page with no language and no title", /names no language/.test(said) && /has no title/.test(said), said);
    check("E: a picture with no alt text, a skipped heading and a link with no name", /1 picture has no alt text/.test(said) && /skip a level 1 time/.test(said) && /1 link or button has no name/.test(said), said);
    check("E: and text below AA against its background, with its ratio", /\u201cFaint words\u201d reads 2\.3:1/.test(said), said);
    const good = page('<!doctype html><html lang="en"><head><title>T</title></head><body><h1>A</h1><h2>B</h2><p style="color:#1C1C1A;background:#FFFFFF">Strong words</p><img src="x.png" alt="A chart"><a href="/y">Read more</a></body></html>');
    const c2 = m.M._checkDoc(good.document, good);
    check("E: a clean page passes, and says what it measured", !c2.fix.length && /\d+ color pairs? pass(es)? AA/.test(c2.pass.join("; ")) && /1 picture described/.test(c2.pass.join("; ")), JSON.stringify(c2));
  }

  // ── C. what the function and the workflow may do ─────────────────────────
  check("C: the function reads and writes with the caller's credential, never the service key", !/SERVICE_ROLE|service_role|SUPABASE_SERVICE/i.test(FN));
  check("C: it asks for edits, never a whole page", /"edits":\[/.test(FN) && /applyEdits\(page, ans\.edits\)/.test(FN));
  check("C: it publishes nothing: no git, no Pages write", !/git |api\.github\.com/.test(FN));
  check("C: it refuses a piece with no Pages copy", /has no public copy on GitHub Pages/.test(FN));
  check("C: the workflow serializes with the daily cron", /group: daily-dashboard/.test(WF));
  check("C: ⭐ after it commits a page it starts a Pages deploy, since its own push starts none (2026-11-05)",
    /if: steps\.push\.outputs\.sha != ''\s+env:\s+GH_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}\s+run: gh workflow run pages\.yml --ref main/.test(WF) && /actions: write/.test(WF));
  check("C: and commits only pages and their receipts", /git add library\/\*\/index\.html kb\/receipts\/library_publish\//.test(WF));
  check("C: drafts are read and added behind the team phrase or a reviewer, never updated or deleted by the team",
    /for select\s+to anon, authenticated using \(public\.team_pass_ok\(\) or public\.is_allowed_reviewer\(\)\)/.test(SQL) &&
    !/for (update|delete)/.test(SQL) && /grant select, insert on public\.cpl_library_drafts to anon, authenticated;/.test(SQL));

  // ── E. fixes 1 to 3 (Sam, 2026-11-05: "build fixes 1-3") ───────────────────
  {
    const { liftBlock } = require("./lib/lift_ts");
    const CHAT = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
    const L = liftBlock(CHAT, "// ── LIBRARY BLOCK START", "// ── LIBRARY BLOCK END", ["libraryPageText", "LIBRARY_TEXT_MAX"]);
    const T = await import(path.resolve("chatbox/supabase/functions/library-revise-draft/sierra_text.mjs"));
    const real = fs.readFileSync("library/ell-iet-cpl-starting-points/index.html", "utf8");
    const { M } = load([]);
    const ours = T.readingText(real);
    check("E1: the drafter counts a real page as Sierra reads it (cpl-chat's libraryPageText)",
      ours.length <= L.LIBRARY_TEXT_MAX && ours === L.libraryPageText(real), "drafter " + ours.length);
    check("E1: the card counts it the same way", M._sierraText(real) === ours);
    check("E1: one budget in all three places", T.SIERRA_MAX === L.LIBRARY_TEXT_MAX && /var SIERRA_MAX = 34000;/.test(SRC));
    const long = "<p>" + "word ".repeat(9000) + "</p>";
    check("E1: past the budget, the drafter's count runs on and cpl-chat's stops at the cap",
      T.readingText(long).length > L.LIBRARY_TEXT_MAX && L.libraryPageText(long).length <= L.LIBRARY_TEXT_MAX + 4);
    check("E1: the model is told the budget and the page's count, and the draft stores both",
      /Sierra's reading budget/.test(FN) && /readingText\(page\)\.length/.test(FN) && /regen: g, sierra,/.test(FN) &&
      /shortening wording the page repeats, never by dropping a fact/.test(FN));
    const win = new JSDOM("<!doctype html><html lang='en'><head><title>t</title></head><body><h1>t</h1><p>Short.</p></body></html>").window;
    const okc = M._checkDoc(win.document, win, "<p>Short.</p>");
    check("E2: a draft inside the budget passes with its count", okc.pass.some((x) => /Sierra reads it whole \(6 of 34,000/.test(x)), JSON.stringify(okc));
    const over = M._checkDoc(win.document, win, long);
    check("E2: a draft past it is listed to fix, with how to make room", over.fix.some((x) => /past 34,000 she skips the middle/.test(x)), JSON.stringify(over.fix));
    check("E2: the card's check measures target size with npm run a11y's 24px floor and inline-link exception",
      /b\.width >= 24 && b\.height >= 24/.test(SRC) && /el\.closest\("p, li, footer"\)/.test(SRC) && /checkDoc\(f\.contentDocument, f\.contentWindow, html\)/.test(SRC));
    const sb = rec({ regen: null, rebuild_from: "CPLBrain/x/make_tabs.py a.html -o b.html",
      versions: [{ label: "Version 6", status: "Current: revised.", source_behind: true }] });
    check("E3: a Current version marked source_behind raises Source behind the page", M._flagsOf(sb).indexOf("source_behind") >= 0);
    sb.versions.push({ label: "Version 7", status: "Current: rebuilt from the source." });
    sb.versions[0].status = "Replaced by v7";
    check("E3: a version built from the source clears it", M._flagsOf(sb).indexOf("source_behind") < 0);
  }

  let pass = 0;
  results.forEach(([n, okk, why]) => { if (okk) pass += 1; console.log((okk ? "ok   " : "FAIL ") + n + (okk || !why ? "" : "  — " + why)); });
  console.log("\nlibrary_revise_draft.test.js: " + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
