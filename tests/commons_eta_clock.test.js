// The Commons ETA clock (#3360): commons_eta_clock.js, a College Data Collection module at #commons/data/eta.
//
// WHAT THIS GUARDS:
//   (1) ⭐ the pace math reproduces the approved mock's worked dates from the same inputs (a fixture headline:
//       14,617 of 20,282 complete, 974 in 7 days, 101 in the 7 before; 13,293 SLOs and 2,880 objectives of 88,736):
//       Soonest December 26, 2026 (programs set it), Latest December 13, 2027; SLOs December 15, 2026 and April 2,
//       2027; objectives December 19, 2026. A rewrite of the model that moves a date fails here.
//   (2) ⭐ the lever rules: a factor applies from its start day, several multiply, capped at 8 times; a connection
//       that starts after the work is done changes nothing and the clock says so; the Unblock chips' factors come
//       from their stalled shares (5,751 / (5,751 - 705) = 1.14).
//   (3) ⭐ the view opens from its own address, sits in no menu while it is a preview, says it is a preview, and
//       every moved date says it is a projection, not a partner commitment;
//   (4) the controls work: a chip's state is aria-pressed, a connection on opens its assumptions, Latest flips the
//       date, a college shows its own counts and the bars say they stay statewide, Show costs draws the spend with
//       October 26 and 27 marked;
//   (5) a missing headline file leaves the page whole and says TBA; static: tokens only (hex only inside the --eta
//       token definitions), every header cell scoped, no storage, no write, no glyph, no person's name rendered.
//
// Run from repo root: `npm test` (or `node tests/commons_eta_clock.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("commons_data.js", "utf8");
const SHARE = fs.readFileSync("commons_data_sharing.js", "utf8");
const INTEG = fs.readFileSync("commons_data_integrations.js", "utf8");
const ETA = fs.readFileSync("commons_eta_clock.js", "utf8");
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));

/* A fixture headline with the mock's inputs: complete on Nov 1, Nov 8 and Nov 15, 2026, one day apart before them. */
function headline() {
  const out = [], put = (day, complete) => out.push({ day, active: 20282, complete, colleges: 118 });
  for (let d = 1; d <= 15; d++) {
    const c = d <= 1 ? 13542 : d <= 8 ? 13542 + Math.round((d - 1) * 101 / 7) : 13643 + Math.round((d - 8) * 974 / 7);
    put("2026-11-" + String(d).padStart(2, "0"), d === 8 ? 13643 : d === 15 ? 14617 : c);
  }
  for (let d = 16; d <= 31; d++) put("2026-10-" + d, 13500);
  return out.sort((a, b) => a.day.localeCompare(b.day));
}
const PR = { written_at: "2026-11-15T09:13:14Z", headline: headline(), harvest: { parts: { links: { catalog: [118, 118] }, outcomes: { plo: [16747, 20282] } } } };
const M0 = JSON.parse(JSON.stringify(REAL));
M0.live.statewide.outcomes.slo_courses_on_active = 13293;
M0.live.statewide.outcomes.objective_courses_on_active = 2880;
M0.live.statewide.program_courses.active_courses = 88736;
const SKILLS = { credentials: [{ name: "A", harvested_on: "2026-11-13", skills: [{}, {}, {}] }, { name: "B", harvested_on: "2026-11-13", skills: [{}] }] };
const REFS = { rows: [{ key: "requirements", title: "Program Requirements", pair: [{ n: 1, of: 2 }] }, { key: "subjects", title: "Common Subjects Reference", pair: [{ n: 147, of: 147, words: "settled" }] }] };
const INTEGS = { updated: "2026-11-15", integrations: [{ status: "live" }, { status: "live" }, { status: "proposed" }] };

function dom(hash, files) {
  const d = new JSDOM('<!doctype html><html><head></head><body><div id="root">Loading</div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = d.window, calls = [];
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  w.scrollTo = function () {};
  w.eval(SHARE); w.eval(INTEG); w.eval(ETA); w.eval(SRC);
  return { w, root: w.document.getElementById("root"), calls };
}
function flush(w) { return new Promise((r) => w.setTimeout(r, 0)).then(() => new Promise((r) => w.setTimeout(r, 0))); }
const FILES = { "kb/status/commons_data.json": M0, "kb/status/program-requirements.json": PR, "kb/reference/industry_credential_skills.json": SKILLS,
  "kb/status/commons.json": REFS, "kb/status/cdc_integrations.json": INTEGS };

(async function () {
  const V = dom("#commons/data/eta", FILES);
  const E = V.w.CPL_COMMONS_ETA, D = V.w.CPL_COMMONS_DATA;
  await E.ready(V.w.fetch);
  const M = D.model(M0), B = E.base(M, PR, SKILLS);
  const day = (n) => n == null ? null : new Date(n * 86400000).toISOString().slice(0, 10);

  // (1) the mock's worked dates.
  check("(1) the base reads the headline: 14,617 of 20,282, 5,665 remaining, 974 in 7 days, 101 in the 7 before",
    B.complete === 14617 && B.remaining === 5665 && B.pace.soonest === 974 && B.pace.latest === 101, JSON.stringify(B.pace));
  const S = E.freshState(), P = E.phase1(B, S, null);
  const part = (X, id) => day(X.parts.filter((p) => p.id === id)[0].now.day);
  check("(1) ⭐ Soonest: programs December 26, 2026 set the Phase 1 date; SLOs December 15 and objectives December 19 (estimates)",
    day(P.day) === "2026-12-26" && !P.est && part(P, "slo") === "2026-12-15" && part(P, "objectives") === "2026-12-19", day(P.day));
  const L = E.freshState(); L.mode = "latest";
  const Q = E.phase1(B, L, null);
  check("(1) ⭐ Latest: December 13, 2027 (programs at 101 a week), SLOs April 2, 2027", day(Q.day) === "2027-12-13" && part(Q, "slo") === "2027-04-02", day(Q.day));
  check("(1) the skills bars count each credential's skills on its harvest day", B.bars.filter((b) => day(b.day) === "2026-11-13")[0].skills === 4);

  // (2) the lever rules.
  const asOf = B.asOf;
  check("(2) a factor applies from its start day: 100 units at 10 a day, doubled from day 5, finish on day 8",
    E.finish(100, 10, [{ start: asOf + 5, factor: 2 }], asOf).day === asOf + 8 && E.finish(100, 10, [{ start: asOf + 5, factor: 2 }], asOf).moved);
  check("(2) factors multiply and cap at 8 times the base pace", E.finish(1000, 10, [{ start: asOf, factor: 4 }, { start: asOf, factor: 4 }], asOf).day === asOf + Math.ceil(1000 / 80));
  check("(2) a connection that starts after the work is done changes nothing", !E.finish(100, 10, [{ start: asOf + 30, factor: 3 }], asOf).moved);
  const C = E.freshState(); C.on.coci = true;
  const Pc = E.phase1(B, C, null);
  check("(2) ⭐ COCI from July 2027 leaves Soonest where it was and the clock says why", day(Pc.day) === "2026-12-26" && !Pc.moved && /start after this date/.test(Pc.late || ""));
  C.mode = "latest";
  check("(2) the same COCI moves Latest, a projection", E.phase1(B, C, null).moved && E.phase1(B, C, null).day < Q.day);
  check("(2) ⭐ the Unblock catalogs factor is the gap over the gap less its stall: 5,751 / (5,751 - 705) = 1.14", E.stalledFactor(5751, 705) === 1.14 &&
    E.LEVERS.filter((l) => l.id === "unblockcatalogs")[0].factor.programs === 1.14);

  // (2b) COBIx on #3371: a missed day and a falling week.
  const PRgap = JSON.parse(JSON.stringify(PR)); PRgap.headline = PRgap.headline.filter((h) => h.day !== "2026-11-08");
  const Bg = E.base(M, PRgap, SKILLS);
  check("(2) ⭐ a missed build day does not blank a pace: the window ends on the closest earlier day and divides by its real span",
    Bg.pace.soonest != null && Bg.span.soonest === 8 && Bg.pace.latest != null && E.phase1(Bg, E.freshState(), null).day != null);
  const PRfall = JSON.parse(JSON.stringify(PR)); PRfall.headline.filter((h) => h.day === "2026-11-15")[0].complete = 13600;
  const Bf = E.base(M, PRfall, SKILLS), Pf = E.phase1(Bf, E.freshState(), null);
  check("(2) a week where the count fell reads no net progress, apart from a pace that cannot be dated", Bf.pace.soonest < 0 && Pf.noProgress);

  // (3) the view, its address, the preview.
  await D.boot(V.root, "eta");
  await flush(V.w);
  check("(3) ⭐ #commons/data/eta opens the clock from its arrival and reports its address", D.address() === "commons/data/eta" && !!V.root.querySelector("[data-eta-view]"));
  check("(3) the menu carries the clock now that it is live (Sam, S661)", !!V.root.querySelector('nav.cdd-views a[data-goto="eta"]'));
  D.render(V.root, M, "", new Date());
  check("(3) ⭐ the College Collections ETA band tops College Data Collection's list (Sam, S661)", txt(V.root.querySelector("[data-eta-top] #eta-band-h")) === "College Collections ETA" &&
    V.root.querySelector("[data-eta-top]").compareDocumentPosition(V.root.querySelector("#cdd-stamp")) & 4);
  const tile = V.root.querySelector('[data-pane-tile="clock"]');
  check("(3) ⭐ a card among the figures carries the Phase 1 date and opens the full clock in the side panel", tile && /December 26, 2026/.test(txt(tile)));
  tile.click();
  check("(3) the side panel draws the full clock at its own address, with a new-tab link to the clock's page", D.address() === "commons/data/clock" && !!V.root.querySelector("#cdd-panel [data-eta-pane] #eta-full") &&
    V.root.querySelector('#cdd-panel a[data-newtab]').getAttribute("href") === "#commons/data/eta");
  V.root.querySelector('[data-eta-top] [data-eta="comis"]').click();
  check("(3) ⭐ the band and the panel share one set of picks: COMIS on in the band is on in the panel's levers",
    V.root.querySelector('#cdd-panel [data-eta="lever-comis"]').getAttribute("aria-pressed") === "true");
  V.root.querySelector('[data-eta-top] [data-eta="eta-mode"]').click();
  check("(3) the card's figure follows the picks (COBIx on #3373)", !/December 26, 2026/.test(txt(V.root.querySelector('[data-pane-tile="clock"]'))) && /latest pace, projected/.test(txt(V.root.querySelector('[data-pane-tile="clock"]'))));
  V.root.querySelector('[data-eta-top] [data-eta="eta-mode"]').click();
  V.root.querySelector('[data-eta-top] [data-eta="comis"]').click();
  V.root.querySelector('#cdd-panel [data-eta="lever-comis"]').click();
  check("(3) a pick in the panel shows in the band too", V.root.querySelector('[data-eta-top] [data-eta="comis"]').getAttribute("aria-pressed") === "true");
  E._reset();
  const pwb = V.root.querySelector('#cdd-colleges [data-pane="pathways"]');
  check("(3) ⭐ every college row carries CPL Pathways (Sam, S661)", V.root.querySelectorAll('#cdd-colleges tbody tr[data-id] [data-pane="pathways"]').length === V.root.querySelectorAll("#cdd-colleges tbody tr[data-id]").length && pwb);
  pwb.click();
  const fr = V.root.querySelector("#cdd-panel iframe[data-pathways-frame]");
  check("(3) ⭐ it opens the college's CPL Pathways framed in the side panel, with links to a new tab", fr && /\?framed=1#cpl-pathways\/college\//.test(fr.getAttribute("src")) && fr.getAttribute("title") &&
    V.root.querySelector('#cdd-panel a[data-newtab]').getAttribute("href") === "#cpl-pathways/college/" + encodeURIComponent(B.colleges.length ? M.colleges.filter((c) => pwb.closest("tr").getAttribute("data-id") === String(c.id))[0].name : "") && /\/pathways$/.test(D.address()));
  const FR = new JSDOM("<!doctype html><html><head></head><body></body></html>", { url: "https://example.org/index.html?framed=1#cpl-pathways", runScripts: "dangerously" });
  FR.window.eval(fs.readFileSync("cobi_framed.js", "utf8"));
  const FN = new JSDOM("<!doctype html><html><head></head><body></body></html>", { url: "https://example.org/index.html#cpl-pathways", runScripts: "dangerously" });
  FN.window.eval(fs.readFileSync("cobi_framed.js", "utf8"));
  check("(3) ⭐ ?framed=1 opened at the top does nothing: the header and menu stay, so a reader has a way out (COBIx on #3373)",
    !FR.window.document.documentElement.classList.contains("cobi-framed") && !FN.window.document.documentElement.classList.contains("cobi-framed"));
  // Inside a same-origin frame it hides them, routes a link to another tab to the page around it, and the session keeper only reads.
  const { requestInterceptor } = require("jsdom");
  const FRAME_HTML = '<!doctype html><html><head></head><body><a id="l" href="#commons/data/eta">x</a><a id="i" href="#cpl-pathways/college/y">y</a><script>' +
    fs.readFileSync("cobi_framed.js", "utf8") + "</script></body></html>";
  const PARENT = new JSDOM('<!doctype html><html><head></head><body><iframe id="f" src="https://example.org/index.html?framed=1#cpl-pathways/college/x"></iframe></body></html>',
    { url: "https://example.org/index.html#commons/data", runScripts: "dangerously",
      resources: { interceptors: [requestInterceptor(() => new Response(FRAME_HTML, { headers: { "Content-Type": "text/html" } }))] } });
  await new Promise((r) => PARENT.window.document.getElementById("f").addEventListener("load", r));
  const fw = PARENT.window.document.getElementById("f").contentWindow;
  fw.document.getElementById("l").dispatchEvent(new fw.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("(3) ⭐ inside a same-origin frame ?framed=1 hides COBI's chrome, and a link to another tab opens in the page around the frame",
    fw.document.documentElement.classList.contains("cobi-framed") && PARENT.window.location.hash === "#commons/data/eta");
  fw.document.getElementById("i").dispatchEvent(new fw.MouseEvent("click", { bubbles: true, cancelable: true }));
  check("(3) a link within the framed tab stays in the frame", PARENT.window.location.hash === "#commons/data/eta");
  // COBIx's re-check on #3373: a tab in the frame calling ensureFresh() must hand the renewal to the outer page.
  const SESSION_SRC = fs.readFileSync("cpl_session.js", "utf8");
  const P2 = new JSDOM('<!doctype html><html><head></head><body><iframe id="f" src="https://example.org/index.html?framed=1#cpl-pathways"></iframe></body></html>',
    { url: "https://example.org/index.html#commons/data", runScripts: "dangerously",
      resources: { interceptors: [requestInterceptor(() => new Response("<!doctype html><html><head></head><body></body></html>", { headers: { "Content-Type": "text/html" } }))] } });
  let outerCalls = 0, frameFetches = 0;
  P2.window.CPL_SESSION = { ensureFresh: function () { outerCalls++; return Promise.resolve(null); } };
  await new Promise((r) => P2.window.document.getElementById("f").addEventListener("load", r));
  const f2 = P2.window.document.getElementById("f").contentWindow;
  f2.fetch = function () { frameFetches++; return Promise.reject(new Error("no network")); };
  f2.eval(SESSION_SRC);
  await f2.CPL_SESSION.ensureFresh();
  check("(3) ⭐ in a frame, ensureFresh() hands the renewal to the outer page and never exchanges a token itself (COBIx on #3373)",
    outerCalls === 1 && frameFetches === 0);
  check("(3) ⭐ in a frame, the session keeper reads the session and never starts its refresh (COBIx on #3373)",
    /function start\(\) \{\s*if \(framedInCobi\(\)\) \{ try \{ sync\(\); \}[^\n]*return; \}/.test(fs.readFileSync("cpl_session.js", "utf8")));
  check("(3) both HTMLs load cobi_framed.js", ["index.html", "CPL_Dashboard.html"].every((f) => /<script src="cobi_framed\.js"><\/script>/.test(fs.readFileSync(f, "utf8"))));
  D.render(V.root, M, "eta", new Date());
  const root = () => V.root.querySelector("[data-eta-view]");
  check("(3) the clock's own page: its heading and the big date", txt(root().querySelector("#eta-band-h")) === "College Collections ETA" &&
    txt(root().querySelector("[data-eta-date]")) === "December 26, 2026");

  // (4) Sam, in session, S661: the controls that move the date are chips; the words that open or reset stay words.
  const pills = ["eta-mode", "tworeads", "costs", "college", "unblockcatalogs", "comis", "sis", "lever-coci"];
  check("(4) ⭐ every control that moves the projected date is a chip (Sam, S661)", pills.every((k) => { const b = root().querySelector('[data-eta="' + k + '"]'); return b && b.classList.contains("eta-pill"); }));
  check("(4) Detailed View and Plan, Assumptions, the phases and Clear levers stay words", ["full", "assumptions", "phase-1", "clear"].every((k) => { const b = root().querySelector('[data-eta="' + k + '"]'); return b && !b.classList.contains("eta-pill"); }));
  // (4) the controls.
  const q = (s) => root().querySelector(s);
  q('[data-eta="eta-mode"]').click();
  check("(4) Latest flips the big date and the word", txt(q("[data-eta-date]")) === "December 13, 2027" && txt(q('[data-eta="eta-mode"]')) === "Latest");
  q('[data-eta="coci"]').click();
  check("(4) ⭐ a connection on is pressed, opens its assumptions, and the moved date says it is a projection",
    q('[data-eta="coci"]').getAttribute("aria-pressed") === "true" && !!q('[data-eta-pop="coci"]') && /projection, not a partner commitment/.test(txt(q("[data-eta-projected]"))));
  q('[data-eta="coci"]').click();
  check("(4) clicking an open connection again turns it off", q('[data-eta="coci"]').getAttribute("aria-pressed") === "false" && !q('[data-eta-pop="coci"]') && !q("[data-eta-projected]"));
  q('[data-eta="coci"]').click(); q('[data-eta="assumptions"]').click(); q('[data-eta="coci"]').click();
  check("(4) ⭐ a lever that is on turns off in one click even when its popover is closed (COBIx on #3371)", q('[data-eta="coci"]').getAttribute("aria-pressed") === "false");
  q('[data-eta="unblockcatalogs"]').click();
  const cr = q('[data-eta-pop="unblockcatalogs"] input[type=range]');
  check("(4) the Unblock catalogs slider stops at the stalled share's own factor (1.14), never 8", cr && cr.getAttribute("max") === "1.14");
  const parts = [...q('[data-eta-pop="unblockcatalogs"]').querySelectorAll("input[type=checkbox]")];
  check("(4) Unblock catalogs carries its four stalled parts, all on", parts.length === 4 && parts.every((p) => p.checked));
  q('[data-eta="assumptions"]').click();
  const at = q("[data-eta-assumptions] table");
  check("(4) Assumptions lists 2 reads/day and every connection, each header cell scoped", at && at.querySelectorAll("tbody tr").length === 1 + E.LEVERS.length &&
    [...at.querySelectorAll("th")].every((th) => th.getAttribute("scope")));
  q('[data-eta="college"]').click();
  const opt = [...root().querySelectorAll(".eta-opt")].filter((o) => o.getAttribute("data-college") !== "all")[0];
  const slug = opt.getAttribute("data-college");
  opt.click();
  check("(4) a college shows its own name, and the bars say they stay statewide", txt(q('[data-eta="college"]')).indexOf(B.colleges.filter((c) => c.slug === slug)[0].name) === 0 &&
    /Statewide only/.test(txt(q(".eta-chart"))));
  q('[data-eta="costs"]').click();
  const labels = [...root().querySelectorAll(".eta-costlabel")].map((t) => t.firstChild.textContent);
  check("(4) Show costs labels each day's spend, October 26 and 27 marked", labels.indexOf("$1,569*") >= 0 && labels.indexOf("$2,686*") >= 0);
  q('[data-eta="phase-2"]').click();
  check("(4) the phase switcher draws Phase 2's partner feeds, not dated", q('[data-eta-datasets="2"]') && [...q('[data-eta-datasets="2"]').querySelectorAll("tbody tr")].length === 5 &&
    /Not dated/.test(txt(q('[data-cell="soonest"]') || q(".eta-grid"))));
  check("(4) the full clock opens the College Collections Plan in a new tab, and names its #3111 source", (function () { const a = root().querySelector("a[data-eta-plan]");
    return a && a.getAttribute("href") === "library/college-collections-plan/" && a.getAttribute("target") === "_blank" && fs.existsSync("library/college-collections-plan/index.html") &&
      !!root().querySelector('a[href$="#issuecomment-6808952144"]'); })());
  check("(4) the strip for the Commons tab carries both dates and opens the clock", (function () { const s = E.strip(M); return s && /December 26, 2026/.test(txt(s)) && s.querySelector('a[href="#commons/data/eta"]'); })());

  // (5) a missing file, and the static rules.
  const X = dom("#commons/data/eta", { "kb/status/commons_data.json": M0 });
  await X.w.CPL_COMMONS_DATA.boot(X.root, "eta");
  await flush(X.w);
  check("(5) without the headline series the view says TBA and why", /TBA\. The headline series/.test(txt(X.root)));
  const css = E.CSS.replace(/--eta-[a-z-]+:(#[0-9A-Fa-f]{3,6}|rgba\([^)]*\))/g, "");
  check("(5) tokens only: a hex appears only inside an --eta token definition", !/#[0-9a-fA-F]{3,6}\b/.test(css));
  check("(5) every header cell on the page is scoped", [...V.root.querySelectorAll("[data-eta-view] th")].every((th) => th.getAttribute("scope")));
  check("(5) stores nothing and writes nothing", !/localStorage|sessionStorage|method:\s*["'](POST|PATCH|PUT|DELETE)/.test(ETA) && V.calls.every((c) => c[1] === "GET"));
  check("(5) no glyph stands in for a word", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(ETA));
  check("(5) no person's name in what the page draws", !/\b(Sam|Craig|Jory|Malone|Ashley|Jessica)\b/.test(txt(V.root)));
  check("(5) the module is on the Pages allowlist", /^publish commons_eta_clock\.js$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8")));

  const fails = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - fails.length) + "/" + results.length + " checks passed");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
