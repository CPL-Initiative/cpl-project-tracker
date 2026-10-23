// Public library — the pieces a reviewer lists for anyone to open, read by the public
// page and by Sierra through cpl_library_public().
//
// Sam, 2026-10-20: "a public library I can copy them over to and set view permissions
// in the Admin tab", then "give me a toggle to copy over from the Private library to
// the public one... Copy or move...to save space", and "We need to ensure everything
// public is a11y and mobile friendly". These checks guard what can go wrong:
//   - the public read returns public fields only, listed and current rows only;
//   - listing needs the team phrase or a reviewer sign-in (Sam, 2026-10-23, reversing
//     his reviewer-only call of 2026-10-20), and the public columns cannot be written
//     around the function;
//   - one record and a switch: unlisting by retiring or narrowing the audience;
//   - the page paints the listed pieces, filters them, and on a failed read paints
//     no list; links are https only;
//   - the Library tab's switch sends the reviewer token when there is one, else the
//     phrase, asks for a summary, and asks
//     a Claude page's owner to confirm its link is public;
//   - the Admin panel reads the same function and offers Remove;
//   - the page is in the a11y sweep, light and dark.
// Run from repo root: `npm test` (or `node tests/public_library.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") pending.push(r.catch(function (e) { check(label + " — driver threw: " + (e && e.message), false); }));
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}
const SQL = fs.readFileSync("kb/supabase_cpl_library_public.sql", "utf8");
const PAGE = fs.readFileSync("library/index.html", "utf8");
const PAGE_JS = fs.readFileSync("library/public_library.js", "utf8");
const LIB = fs.readFileSync("library.js", "utf8");
const ADMIN = fs.readFileSync("admin.js", "utf8");
const A11Y = fs.readFileSync("a11y.config.js", "utf8");
const GOV = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
function settle() { return new Promise(function (r) { setTimeout(r, 0); }).then(function () { return new Promise(function (r) { setTimeout(r, 0); }); }); }

const LISTED = [
  { slug: "dsp-credit-starting-points", title: "DSP Credit Starting Points", kind: "document", occasion: "DDS meeting", made_on: "2026-10-20",
    summary: "Where credit for DSP training could start.", topics: ["DSP training"], url: "https://claude.ai/artifact/x" },
  { slug: "ironworker", title: "Ironworker Pathway in Motion", kind: "film", occasion: "Cerritos College", made_on: "2026-10-04",
    summary: "High school to a bachelor's degree.", topics: [], url: "javascript:alert(1)" }
];

// ── (1) The database: what goes public, and who decides ──────────────────
block("(1)", function () {
  const fn = /create or replace function public\.cpl_library_public\(\)[\s\S]*?\$\$;/.exec(SQL);
  check("(1) the public read exists", !!fn);
  const body = fn ? fn[0] : "";
  check("(1) it returns listed, current, linked rows only", /where l\.public_listed and l\.retired_at is null and l\.url is not null/.test(body));
  ["note", "brief", "made_by", "rebuild_from", "versions", "added_by", "updated_by", "l.summary"].forEach(function (c) {
    check("(1) the public read never returns " + c, body.indexOf(c) === -1);
  });
  check("(1) anon may run the public read", /grant execute on function public\.cpl_library_public\(\) to anon/.test(SQL));
  check("(1) listing checks the team phrase or the reviewer sign-in", /cpl_library_set_public[\s\S]*?if not \(public\.is_allowed_reviewer\(\) or public\.team_pass_ok\(\)\)/.test(SQL));
  check("(1) anon may call the listing function; the gate is inside it", /grant execute on function public\.cpl_library_set_public\([^)]*\) to anon, authenticated, service_role;/.test(SQL));
  check("(1) the history says who listed when no sign-in names them", /case when public\.is_allowed_reviewer\(\) then 'reviewer' else 'team phrase' end/.test(SQL));
  check("(1) a trigger refuses the public columns outside the function", /before update on public\.cpl_library/.test(SQL) && /current_setting\('cpl\.library_public', true\)/.test(SQL));
  check("(1) a listed piece must be Public, linked, current and summarized",
    /not public_listed or \(\s*url is not null and retired_at is null and seen_by = 'public'/.test(SQL));
  check("(1) retiring or narrowing the audience unlists in the same write",
    /new\.retired_at is not null or new\.seen_by is distinct from 'public'/.test(SQL));
  check("(1) nothing is copied: no second table", !/create table/i.test(SQL));
  check("(1) governance maps the public read", typeof GOV.dismissed["rpc:cpl_library_set_public"] === "string" && GOV.dismissed["rpc:cpl_library_set_public"].length > 200);
});

// ── (2) The public page ──────────────────────────────────────────────────
function loadPage(fetcher) {
  const dom = new JSDOM(PAGE.replace('<script src="./public_library.js"></script>', ""), { url: "https://example.org/library/", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) { calls.push({ url: String(url), init: init || {} }); return fetcher(String(url), init || {}); };
  const s = w.document.createElement("script"); s.textContent = PAGE_JS; w.document.body.appendChild(s);
  return { w: w, calls: calls, d: w.document };
}
block("(2)", function () {
  const m = loadPage(function () { return response(200, LISTED); });
  return settle().then(function () {
    check("(2) it reads the public function with a GET and the anon key", m.calls.length === 1 && /rpc\/cpl_library_public$/.test(m.calls[0].url) && !m.calls[0].init.method);
    const cards = m.d.querySelectorAll("#lib-grid .piece");
    check("(2) it paints each listed piece", cards.length === 2, String(cards.length));
    check("(2) an https link opens", !!m.d.querySelector('#lib-grid a[href="https://claude.ai/artifact/x"]'));
    check("(2) a non-https link is never painted", !/javascript:/.test(m.d.getElementById("lib-grid").innerHTML));
    check("(2) it counts in words", /2 pieces/.test(m.d.getElementById("lib-state").textContent));
    const q = m.d.getElementById("lib-q"); q.value = "dsp"; q.dispatchEvent(new m.w.Event("input"));
    check("(2) search narrows by title or topic", m.d.querySelectorAll("#lib-grid .piece").length === 1 && /1 of 2/.test(m.d.getElementById("lib-state").textContent));
  });
});
block("(2b)", function () {
  const m = loadPage(function () { return response(500, "boom"); });
  return settle().then(function () {
    check("(2b) a failed read paints no list", m.d.querySelectorAll("#lib-grid .piece").length === 0);
    check("(2b) and says it could not load", /could not be loaded/.test(m.d.getElementById("lib-state").textContent));
  });
});
block("(2c)", function () {
  check("(2c) a skip link, a labelled search, reduced motion and a dark palette",
    /class="skip-link"/.test(PAGE) && /<label for="lib-q">/.test(PAGE) && /prefers-reduced-motion/.test(PAGE) && /:root\[data-theme="dark"\]/.test(PAGE));
  check("(2c) a single column below 560px and no fixed widths", /max-width: 560px\) \{ \.grid \{ grid-template-columns: 1fr/.test(PAGE));
  check("(2c) controls are underlined words, at least 24px", /\.word \{[^}]*min-height: 24px; min-width: 24px;[^}]*text-decoration: underline/.test(PAGE));
  check("(2c) the page is in the a11y sweep, light and dark", /"public-library":\s*\{\s*file: "library\/index\.html"/.test(A11Y) && /"public-library-dark"/.test(A11Y));
});

// ── (2d) The public header (Sam, 2026-10-21) ───────────────────────────
block("(2d)", function () {
  check("(2d) the CPL Initiative logo opens the Chancellor's Office CPL page",
    /class="cplh-logo" href="https:\/\/www\.cccco\.edu\/about-us\/chancellors-office\/divisions\/educational-services-and-support\/credit-for-prior-learning\/"/.test(PAGE));
  ["fact-sheet/", "https://map.rccd.edu/\"", "map.rccd.edu/cpllandingpages/", "insights/dashboard", "creditforbeingyou.org"].forEach(function (u) {
    check("(2d) the header links " + u, PAGE.indexOf(u.replace(/\\/g, "")) >= 0);
  });
  check("(2d) both logos carry alt text, one per theme", (PAGE.match(/<img class="cplh-(light|dark)" src="[^"]+" alt="[^"]{20,}"/g) || []).length === 2);
  check("(2d) a light and a dark control, sharing COBI's cpl_theme", /data-cplh-theme="light"/.test(PAGE) && /data-cplh-theme="dark"/.test(PAGE) && /var KEY = "cpl_theme"/.test(PAGE));
});

// ── (3) The Library tab's switch ─────────────────────────────────────────
const ROW = { id: "r1", slug: "dsp-credit-starting-points", title: "DSP Credit Starting Points", kind: "document",
  made_on: "2026-10-20", status: "draft", seen_by: null, home: "web", url: "https://claude.ai/artifact/P4R8", summary: "Internal summary", versions: [] };
function loadLib(opts) {
  const dom = new JSDOM('<!doctype html><html><body><div id="library-root"></div></body></html>', { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) { calls.push({ url: String(url), init: init || {} }); return response(200, String(url).indexOf("/rpc/") > -1 ? [] : [opts.row || ROW]); };
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.localStorage.setItem("cpl_library_author", "Sam");
  if (opts.token) w.CPL_REVIEWER_SIGNIN = { getSession: function () { return { access_token: opts.token }; } };
  const s = w.document.createElement("script"); s.textContent = LIB; w.document.body.appendChild(s);
  return { w: w, calls: calls, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
block("(3)", function () {
  const m = loadLib({ token: "reviewer-jwt" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const tog = m.root.querySelector('[data-toggle="r1"]'); if (tog) click(m.w, tog);
    const pub = m.root.querySelector('[data-pub="r1"]');
    check("(3) an unlisted record offers List publicly", !!pub);
    click(m.w, pub);
    check("(3) a Claude page asks to confirm its link is public", !!m.root.querySelector("#lp-shared"));
    check("(3) the summary starts from the record's", (m.root.querySelector("#lp-sum") || {}).value === "Internal summary");
    m.root.querySelector("#lp-shared").checked = true;
    m.root.querySelector("#lp-topics").value = "DSP training, developmental disabilities";
    m.root.querySelector('[data-pubform="r1"]').dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const call = m.calls.filter(function (c) { return /rpc\/cpl_library_set_public$/.test(c.url); })[0];
    check("(3) it calls the listing function", !!call);
    const h = call ? call.init.headers : {};
    check("(3) with the reviewer token, never the phrase", h.Authorization === "Bearer reviewer-jwt" && !h["x-team-pass"]);
    const b = call ? JSON.parse(call.init.body) : {};
    check("(3) naming the piece, the summary and the topics", b.p_slug === "dsp-credit-starting-points" && b.p_listed === true && b.p_summary === "Internal summary" && b.p_topics.length === 2);
  });
});
block("(3b)", function () {
  const m = loadLib({});
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const tog = m.root.querySelector('[data-toggle="r1"]'); if (tog) click(m.w, tog);
    click(m.w, m.root.querySelector('[data-pub="r1"]'));
    m.root.querySelector("#lp-shared").checked = true;
    m.root.querySelector('[data-pubform="r1"]').dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const call = m.calls.filter(function (c) { return /rpc\/cpl_library_set_public$/.test(c.url); })[0];
    check("(3b) with the phrase and no sign-in the call is sent", !!call);
    const h = call ? call.init.headers : {};
    check("(3b) with the phrase and the anon key, never a reviewer token", h["x-team-pass"] === "phrase" && h.Authorization === "Bearer " + h.apikey);
    check("(3b) and it does not ask for a sign-in", !/needs the team phrase or your reviewer sign-in/.test(m.root.textContent));
  });
});
block("(3c)", function () {
  const m = loadLib({ token: "t", row: Object.assign({}, ROW, { public_listed: true, listed_at: "2026-10-20T22:00:00Z", public_summary: "Public words" }) });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const tog = m.root.querySelector('[data-toggle="r1"]'); if (tog) click(m.w, tog);
    check("(3c) a listed record says so and offers Remove", !!m.root.querySelector('[data-unpub="r1"]') && /Listed since 20 October 2026/.test(m.root.textContent));
  });
});

block("(3d)", function () {
  const m = loadLib({ token: "t" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const acts = m.root.querySelector(".lib-acts");
    check("(3d) Edit sits on the card's top row", !!(acts && acts.querySelector('[data-edittop="r1"]')));
    check("(3d) so does List publicly", !!(acts && acts.querySelector('[data-pubtop="r1"]')));
    click(m.w, acts.querySelector('[data-pubtop="r1"]'));
    check("(3d) List publicly opens the listing form under the card", !!m.root.querySelector('[data-pubform="r1"]'));
    click(m.w, m.root.querySelector('[data-edittop="r1"]'));
    check("(3d) Edit opens the edit form under the card", !!m.root.querySelector('[data-editform="r1"]'));
  });
});

// ── (4) The Admin panel ──────────────────────────────────────────────────
block("(4)", function () {
  check("(4) Admin reads the same public function", /\/rpc\/cpl_library_public"/.test(ADMIN));
  check("(4) Admin's Remove unlists through the function", /data-pubremove/.test(ADMIN) && /p_listed: false/.test(ADMIN));
});

// ── (5) Who a piece is made for (Sam, Open Asks Sheet 120 card 4, 2026-10-23) ──
const LISTED_FOR = [
  Object.assign({}, LISTED[0], { kind: "visual", for_kind: "agency", for_category: null, for_name: "DDS, Aging and LWDA" }),
  { slug: "cpl-opportunity-bakersfield-visual", title: "Bakersfield College: CPL Opportunity Analysis", kind: "visual", occasion: "CPL college workgroup meeting",
    made_on: "2026-10-21", summary: "Bakersfield's programs.", topics: [], url: "https://cpl-initiative.github.io/cpl-project-tracker/cpl-opportunity/?college=Bakersfield%20College",
    for_kind: "college", for_category: null, for_name: "Bakersfield College" },
  Object.assign({}, LISTED[1], { url: "https://example.org/film", for_kind: null, for_category: null, for_name: null })
];
block("(5)", function () {
  const fn = /create or replace function public\.cpl_library_public\(\)[\s\S]*?\$\$;/.exec(SQL);
  const body = fn ? fn[0] : "";
  check("(5) the public read returns who a piece is made for", /for_kind text, for_category text, for_name text\)/.test(body) && /l\.for_kind, l\.for_category, l\.for_name/.test(body));
  check("(5) the kind check takes visual", /'spreadsheet', 'visual'\)/.test(fs.readFileSync("kb/supabase_cpl_library.sql", "utf8")));
  const m = loadPage(function () { return response(200, LISTED_FOR); });
  return settle().then(function () {
    const cards = m.d.querySelectorAll("#lib-grid .piece");
    check("(5) a card says who it is for", cards.length === 3 && /For Bakersfield College/.test(cards[1].textContent) && /For DDS, Aging and LWDA/.test(cards[0].textContent));
    check("(5) a piece made for no one says nothing of it", cards.length === 3 && !/Made for|For /.test(cards[2].querySelector(".meta").textContent));
    const kinds = Array.prototype.map.call(m.d.querySelectorAll("#lib-kinds button"), function (b) { return b.textContent; });
    check("(5) Visual is a kind chip, first after All", kinds[0] === "All" && kinds[1] === "Visual", kinds.join(","));
    const chips = Array.prototype.map.call(m.d.querySelectorAll("#lib-for button"), function (b) { return b.getAttribute("data-madefor"); });
    check("(5) a Made for chip appears only for a type with a listed piece", chips.join(",") === "all,college,agency", chips.join(","));
    const ent = m.d.getElementById("lib-ent");
    check("(5) For lists the names present", Array.prototype.map.call(ent.options, function (o) { return o.value; }).join("|") === "all|Bakersfield College|DDS, Aging and LWDA");
    check("(5) the For list is labeled and shown", !m.d.getElementById("lib-for-wrap").hidden && !!m.d.querySelector('label[for="lib-ent"]'));
    click(m.w, m.d.querySelector('#lib-for [data-madefor="college"]'));
    check("(5) Colleges narrows to the college pieces", m.d.querySelectorAll("#lib-grid .piece").length === 1 && /1 of 3/.test(m.d.getElementById("lib-state").textContent));
    click(m.w, m.d.querySelector('#lib-for [data-madefor="all"]'));
    ent.value = "DDS, Aging and LWDA"; ent.dispatchEvent(new m.w.Event("change"));
    check("(5) picking a name shows that entity's pieces", m.d.querySelectorAll("#lib-grid .piece").length === 1 && /DSP Credit/.test(m.d.getElementById("lib-grid").textContent));
    ent.value = "all"; ent.dispatchEvent(new m.w.Event("change"));
    const q = m.d.getElementById("lib-q"); q.value = "aging and lwda"; q.dispatchEvent(new m.w.Event("input"));
    check("(5) search finds a piece by who it is for", m.d.querySelectorAll("#lib-grid .piece").length === 1);
  });
});
block("(5b)", function () {
  const m = loadPage(function () { return response(200, LISTED); });
  return settle().then(function () {
    check("(5b) with no piece made for anyone, no Made for chips and no For list paint", m.d.querySelectorAll("#lib-for button").length === 0 && m.d.getElementById("lib-for-wrap").hidden === true);
    check("(5b) the page's search says who it is for", /placeholder="Title, topic or who it is for"/.test(PAGE));
  });
});

Promise.all(pending).then(function () {
  let fail = 0;
  results.forEach(function (r) { if (!r[1]) fail++; console.log((r[1] ? "  ok   " : "  FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  — " + r[2])); });
  console.log("\n" + (results.length - fail) + "/" + results.length + " passed");
  if (fail) process.exit(1);
});
