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
//   - the page is in the a11y sweep, light and dark;
//   - Sam's simpler page of 2026-10-24: the struck parts stay gone, For sits beside
//     the search, Sort opens on Most recent, cards clamp their text, the page opens
//     Light whatever the device says, and the hero photo cycles with a pause control
//     (or stays still for one photo or reduced motion), in Malone's look on tokens.
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
// The page with only its first photo: windows that are not testing the cycle load this, so no
// photo timer outlives them and keeps the process from exiting.
const ONE = PAGE.replace(/\n\s*<img class="hero-slide" data-src[^>]*>/g, "");
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
  const dom = new JSDOM(ONE.replace('<script src="./public_library.js"></script>', ""), { url: "https://example.org/library/", runScripts: "dangerously" });
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
  // The links behind one Links word, each with a line in gray saying what it is (Sam, 2026-10-26:
  // "so new-to-CPL users will not be immediately lost in our acronyms"). Driven on the header alone.
  const HDR = (PAGE.match(/<!-- cpl-public-header:start[\s\S]*?<!-- cpl-public-header:end -->/) || [])[0] || "";
  const hd = new JSDOM("<!doctype html><html><head></head><body>" + HDR + '<main><button type="button" id="elsewhere">x</button></main></body></html>',
    { url: "https://cpl-initiative.github.io/cpl-project-tracker/library/", runScripts: "dangerously" });
  const hw = hd.window, d = hw.document;
  const word = d.querySelector(".cplh button[data-cplh-links]");
  const panel = word && d.getElementById(word.getAttribute("aria-controls"));
  const links = Array.from(d.querySelectorAll('.cplh nav[aria-label="CPL pages"] a'));
  // Six links since the Credential Catalog joined them (Sam, Open Asks Sheet 148 card 2, 2026-10-31).
  check("(2d) ⭐ the links sit behind one word, Links, an underlined word button, collapsed over a hidden panel",
    !!word && word.textContent.trim() === "Links" && word.classList.contains("word") && word.getAttribute("aria-expanded") === "false" &&
    !!panel && panel.hidden && links.length === 6 && links.every(function (a) { return panel.contains(a); }));
  const bad = links.filter(function (a) {
    const el = d.getElementById(a.getAttribute("aria-describedby") || "");
    const n = el ? el.textContent.trim().split(/\s+/).length : 0;
    return !el || !el.classList.contains("cplh-desc") || el.parentNode !== a.parentNode || n < 4 || n > 14;
  });
  check("(2d) ⭐ every link carries a line saying what it is, named as its description, under ~12 words", !bad.length,
    bad.map(function (a) { return a.textContent; }).join(", "));
  check("(2d) the line is the page's muted gray, on its surface, in a panel that fits the window",
    /\.cplh-desc \{ color: var\(--muted\);/.test(PAGE) && /\.cplh-panel \{[^}]*width: min\(38rem, calc\(100% - var\(--gutter-l\) - var\(--gutter-r\)\)\);[^}]*background: var\(--surface\);/.test(PAGE));
  if (word && panel && links.length) {
    word.dispatchEvent(new hw.MouseEvent("click", { bubbles: true }));
    const opened = word.getAttribute("aria-expanded") === "true" && !panel.hidden;
    links[1].focus();
    d.dispatchEvent(new hw.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const escaped = panel.hidden && d.activeElement === word;
    word.dispatchEvent(new hw.MouseEvent("click", { bubbles: true }));
    d.getElementById("elsewhere").dispatchEvent(new hw.MouseEvent("click", { bubbles: true }));
    check("(2d) Links opens the list, Escape shuts it and hands focus back, a click outside shuts it",
      opened && escaped && panel.hidden, JSON.stringify({ opened: opened, escaped: escaped }));
  }
  hw.close();
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
    const cards = Array.prototype.slice.call(m.d.querySelectorAll("#lib-grid .piece"));
    const card = function (re) { return cards.filter(function (c) { return re.test(c.querySelector("h2").textContent); })[0]; };
    check("(5) a card says who it is for", cards.length === 3 && /For Bakersfield College/.test(card(/Bakersfield/).textContent) && /For DDS, Aging and LWDA/.test(card(/DSP/).textContent));
    const film = card(/Ironworker/);
    check("(5) a piece made for no one says nothing of it", !!film && !film.querySelector(".for") && !/Made for|For /.test(film.querySelector(".meta").textContent));
    const ent = m.d.getElementById("lib-ent");
    check("(5) For lists the names present", Array.prototype.map.call(ent.options, function (o) { return o.value; }).join("|") === "all|Bakersfield College|DDS, Aging and LWDA");
    const groups = Array.prototype.map.call(ent.querySelectorAll("optgroup"), function (g) { return g.label + ":" + g.children.length; });
    check("(5) and groups them by kind when there is more than one kind", groups.join(",") === "Colleges:1,Agencies:1", groups.join(","));
    check("(5) the For list is labeled and shown", !m.d.getElementById("lib-for-wrap").hidden && !!m.d.querySelector('label[for="lib-ent"]'));
    ent.value = "DDS, Aging and LWDA"; ent.dispatchEvent(new m.w.Event("change"));
    check("(5) picking a name shows that entity's pieces", m.d.querySelectorAll("#lib-grid .piece").length === 1 && /DSP Credit/.test(m.d.getElementById("lib-grid").textContent));
    ent.value = "all"; ent.dispatchEvent(new m.w.Event("change"));
    const q = m.d.getElementById("lib-q"); q.value = "aging and lwda"; q.dispatchEvent(new m.w.Event("input"));
    check("(5) search finds a piece by who it is for", m.d.querySelectorAll("#lib-grid .piece").length === 1);
    q.value = "film"; q.dispatchEvent(new m.w.Event("input"));
    check("(5) search finds a piece by its kind, now the kind words are gone", m.d.querySelectorAll("#lib-grid .piece").length === 1 && /Ironworker/.test(m.d.getElementById("lib-grid").textContent));
  });
});
block("(5b)", function () {
  const m = loadPage(function () { return response(200, LISTED); });
  return settle().then(function () {
    check("(5b) with no piece made for anyone, the For list does not paint", m.d.getElementById("lib-for-wrap").hidden === true);
    check("(5b) the page's search says who it is for", /placeholder="Title, topic or who it is for"/.test(PAGE));
  });
});
block("(5c)", function () {
  const one = LISTED_FOR.filter(function (r) { return r.for_kind === "agency"; }).concat([Object.assign({}, LISTED_FOR[0], { slug: "x", title: "ELL IET CPL Starting Points", for_name: "EDD ELL IET Fund grantees" })]);
  const m = loadPage(function () { return response(200, one); });
  return settle().then(function () {
    const ent = m.d.getElementById("lib-ent");
    check("(5c) one kind of audience lists its names without a group", ent.querySelectorAll("optgroup").length === 0 && ent.options.length === 3);
  });
});

// ── (6) The simpler page in Malone's look (Sam, 2026-10-24) ─────────────
// "Simplify: cut the things I lined through on the screenshot and move the For filter
// up to the right of the search box. Add a Sort control with 'Most recent' as the
// default. Include less of the text descriptions in each card... use ... on the end of
// the text if needed. Open in Light by default: dark only when the viewer clicks Dark,
// never from the device setting." Then: "depart from our First Light motif and redesign
// the CPL Public Library based on Malone's", the student image cycling.
function styles(html) { return (html.match(/<style>[\s\S]*?<\/style>/g) || []).join("\n"); }
function loadThemed(opts) {
  const dom = new JSDOM((opts.html || ONE).replace('<script src="./public_library.js"></script>', ""), {
    url: "https://example.org/library/", runScripts: "dangerously",
    beforeParse: function (w) {
      w.matchMedia = function (q) {
        const on = (opts.dark && /prefers-color-scheme: dark/.test(q)) || (opts.still && /prefers-reduced-motion: reduce/.test(q));
        return { matches: !!on, media: q, addEventListener: function () {}, removeEventListener: function () {}, addListener: function () {}, removeListener: function () {} };
      };
      if (opts.stored) w.localStorage.setItem("cpl_theme", opts.stored);
    }
  });
  const w = dom.window;
  w.fetch = function () { return response(200, opts.rows || LISTED); };
  const s = w.document.createElement("script"); s.textContent = PAGE_JS; w.document.body.appendChild(s);
  return { w: w, d: w.document };
}
block("(6a)", function () {
  check("(6a) the eyebrow is gone", !/class="eyebrow"/.test(PAGE) && !/California Community Colleges · CPL Initiative<\/div>/.test(PAGE));
  check("(6a) the description is gone", !/Each piece says who it was made for/.test(PAGE) && !/Visuals, presentations, films and briefs/.test(PAGE));
  check("(6a) the kind and audience word filters are gone", !/id="lib-kinds"/.test(PAGE) && !/id="lib-for"/.test(PAGE) && !/data-madefor|data-kind/.test(PAGE_JS));
  check("(6a) the section label is gone", !/>The library</.test(PAGE));
  check("(6a) the header carries no link to the page itself", !/aria-current="page"/.test(PAGE) && !/href="\.\/"/.test(PAGE));
  const d = new JSDOM(PAGE).window.document;
  const q = d.getElementById("lib-q"), wrap = d.getElementById("lib-for-wrap");
  check("(6a) For sits right after the search box, in the same row", !!q && !!wrap && q.closest(".filters") === wrap.closest(".filters") && q.closest(".field").nextElementSibling === wrap);
});
block("(6b)", function () {
  const d = new JSDOM(PAGE).window.document;
  const sort = d.getElementById("lib-sort");
  const opts = sort ? Array.prototype.map.call(sort.options, function (o) { return o.value + "=" + o.textContent; }) : [];
  check("(6b) a labeled Sort control, Most recent first and selected", !!sort && !!d.querySelector('label[for="lib-sort"]') && opts[0] === "recent=Most recent" && sort.value === "recent", opts.join(","));
  const ROWS = [
    { slug: "z", title: "Zeta brief", kind: "document", made_on: "2026-10-01", summary: "z", topics: [], url: "https://example.org/z" },
    { slug: "a", title: "Alpha film", kind: "film", made_on: "2026-10-20", summary: "a", topics: [], url: "https://example.org/a" },
    { slug: "m", title: "Mid deck", kind: "deck", made_on: "2026-09-15", summary: "m", topics: [], url: "https://example.org/m" },
    { slug: "n", title: "No date", kind: "visual", made_on: null, summary: "n", topics: [], url: "https://example.org/n" }
  ];
  const m = loadPage(function () { return response(200, ROWS); });
  return settle().then(function () {
    const order = function () { return Array.prototype.map.call(m.d.querySelectorAll("#lib-grid .piece h2"), function (h) { return h.textContent.replace(" (opens in a new tab)", ""); }).join("|"); };
    check("(6b) the page opens with the most recent piece first, undated last", order() === "Alpha film|Zeta brief|Mid deck|No date", order());
    const sel = m.d.getElementById("lib-sort");
    sel.value = "oldest"; sel.dispatchEvent(new m.w.Event("change"));
    check("(6b) Oldest first reverses the dates, undated still last", order() === "Mid deck|Zeta brief|Alpha film|No date", order());
    sel.value = "title"; sel.dispatchEvent(new m.w.Event("change"));
    check("(6b) Title A–Z reads the title", order() === "Alpha film|Mid deck|No date|Zeta brief", order());
  });
});
block("(6c)", function () {
  const css = styles(PAGE);
  check("(6c) a card shows two lines of its summary and ends in an ellipsis", /\.piece \.sum \{[^}]*-webkit-line-clamp: 2;[^}]*overflow: hidden/.test(css));
  check("(6c) and one line of its occasion", /\.piece \.occ \{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis/.test(css));
  const long = Object.assign({}, LISTED_FOR[0], { summary: "A card per ELL IET Fund project, ordered by fit: where a project's completers could already turn their training into community college credit, read from the MAP platform and COCI." });
  const m = loadPage(function () { return response(200, [long]); });
  return settle().then(function () {
    const sum = m.d.querySelector("#lib-grid .piece .sum");
    check("(6c) the whole summary stays in the page for search and screen readers", !!sum && sum.textContent === long.summary);
    const a = m.d.querySelector("#lib-grid .piece h2 a");
    check("(6c) the title opens the piece and says it opens a new tab", !!a && a.getAttribute("target") === "_blank" && /opens in a new tab/.test(a.textContent));
  });
});
block("(6d)", function () {
  const asksDevice = /@media\s*\(prefers-color-scheme|matchMedia\(\s*["']\(prefers-color-scheme/;
  check("(6d) the page never reads the device setting", !asksDevice.test(PAGE) && !asksDevice.test(PAGE_JS));
  const m = loadThemed({ dark: true });
  return settle().then(function () {
    const root = m.d.documentElement;
    const pressed = function (t) { return m.d.querySelector('[data-cplh-theme="' + t + '"]').getAttribute("aria-pressed"); };
    check("(6d) a device set to dark still opens Light", root.getAttribute("data-theme") === "light" && pressed("light") === "true" && pressed("dark") === "false");
    m.d.querySelector('[data-cplh-theme="dark"]').dispatchEvent(new m.w.MouseEvent("click", { bubbles: true }));
    check("(6d) Dark turns it dark and remembers the reader's choice", root.getAttribute("data-theme") === "dark" && m.w.localStorage.getItem("cpl_theme") === "dark" && pressed("dark") === "true");
    const again = loadThemed({ stored: "dark" });
    check("(6d) a reader who picked Dark gets Dark next time", again.d.documentElement.getAttribute("data-theme") === "dark");
    const light = loadThemed({ dark: true, stored: "light" });
    check("(6d) and Light stays Light", light.d.documentElement.getAttribute("data-theme") === "light");
  });
});
// The cycle's checks run on fixed casts: ONE (above) keeps only the first slide, THREE adds two.
const THREE = ONE.replace(/(<img class="hero-slide is-on"[^>]*>)/, '$1\n        <img class="hero-slide" data-src="photos/b.jpg" alt="" width="10" height="10">\n        <img class="hero-slide" data-src="photos/c.jpg" alt="" width="10" height="10">');
// A JPEG's pixel size from its SOF marker, so the photo checks need no image library.
function jpegSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xFF) return null;
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + len;
  }
  return null;
}
block("(6e)", function () {
  const d = new JSDOM(PAGE).window.document;
  const slides = d.querySelectorAll("#lib-hero .hero-slide");
  check("(6e) the hero photo is decorative: empty alt, inside a hidden frame", slides.length >= 1 && Array.prototype.every.call(slides, function (s) { return s.getAttribute("alt") === ""; }) && d.getElementById("lib-hero").getAttribute("aria-hidden") === "true");
  const btn = d.getElementById("lib-hero-pause");
  check("(6e) Pause photos is a button outside the hidden frame", !!btn && btn.tagName === "BUTTON" && !btn.closest('[aria-hidden="true"]'));
  check("(6e) the first photo is the student from Malone's page", /src="photos\/hero-student-1\.jpg"/.test(PAGE) && fs.existsSync("library/photos/hero-student-1.jpg") && slides[0].classList.contains("is-on"));
  // The toolkit photos (Sam, Sheet 124 card 1): every slide after the first waits in data-src,
  // so the page loads one photo up front, and each file is a 4:3 JPEG no wider than 1,200
  // pixels whose width and height the tag states, because one object-position serves them all.
  const rest = Array.prototype.slice.call(slides, 1);
  check("(6e) the page lists the toolkit photos after the student", rest.length >= 10);
  check("(6e) only the first photo loads up front", rest.every(function (s) { return !s.getAttribute("src") && /^photos\/[a-z0-9-]+\.jpg$/.test(s.getAttribute("data-src") || ""); }));
  const bad = Array.prototype.filter.call(slides, function (s) {
    const f = "library/" + (s.getAttribute("src") || s.getAttribute("data-src")), z = fs.existsSync(f) && jpegSize(f);
    return !z || z.w > 1200 || Math.abs(z.w / z.h - 4 / 3) > 0.01 || +s.getAttribute("width") !== z.w || +s.getAttribute("height") !== z.h;
  }).map(function (s) { return s.getAttribute("src") || s.getAttribute("data-src"); });
  check("(6e) every photo is a 4:3 JPEG on disk, at most 1,200 wide, sized as its tag says" + (bad.length ? ": " + bad.join(", ") : ""), bad.length === 0);
  check("(6e) one object-position serves every slide: the middle", /\.hero-slide\s*\{[^}]*object-position:\s*50% 50%/.test(PAGE));
  const one = loadThemed({ html: ONE }), m = loadThemed({ html: THREE }), still = loadThemed({ html: THREE, still: true }), live = loadThemed({ html: PAGE });
  return settle().then(function () {
    check("(6e) init ran in every window (so no check below passes vacuously)", [one, m, still, live].every(function (x) { return x.d.getElementById("lib-state").textContent !== "Loading the library…"; }));
    check("(6e) one photo: nothing moves and no control shows", one.w.CPL_PUBLIC_LIBRARY._hero.state.live === false && one.d.getElementById("lib-hero-pause").hidden === true);
    const H = m.w.CPL_PUBLIC_LIBRARY._hero, b = m.d.getElementById("lib-hero-pause");
    const on = function () { return Array.prototype.map.call(m.d.querySelectorAll("#lib-hero .hero-slide"), function (s) { return s.classList.contains("is-on") ? 1 : 0; }).join(""); };
    check("(6e) three photos: they cycle, and Pause photos shows", H.state.live === true && !!H.state.timer && !b.hidden && b.textContent === "Pause photos");
    check("(6e) the next photo loads ahead of its turn", m.d.querySelectorAll("#lib-hero .hero-slide")[1].getAttribute("src") === "photos/b.jpg");
    H.show(1);
    check("(6e) the cycle moves one photo on at a time", on() === "010");
    H.show(3);
    check("(6e) and wraps to the first", on() === "100");
    b.dispatchEvent(new m.w.MouseEvent("click", { bubbles: true }));
    check("(6e) Pause photos stops the cycle and says Play photos", H.state.timer === null && H.state.paused === true && b.textContent === "Play photos");
    b.dispatchEvent(new m.w.MouseEvent("click", { bubbles: true }));
    check("(6e) Play photos starts it again", !!H.state.timer && b.textContent === "Pause photos");
    const S = still.w.CPL_PUBLIC_LIBRARY._hero;
    check("(6e) a reader who asks for reduced motion sees one photo and no control", S.state.live === false && !S.state.timer && still.d.getElementById("lib-hero-pause").hidden === true);
    check("(6e) the page as shipped cycles its photos and shows Pause photos", live.w.CPL_PUBLIC_LIBRARY._hero.state.live === true && live.d.getElementById("lib-hero-pause").hidden === false);
    H.pause(); live.w.CPL_PUBLIC_LIBRARY._hero.pause(); [one, m, still, live].forEach(function (x) { x.w.close(); });
  });
});
block("(6f)", function () {
  const css = styles(PAGE);
  const outside = css.replace(/:root(\[data-theme="dark"\])? \{[\s\S]*?\n\}/g, "");
  const raw = outside.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || [];
  check("(6f) colors live in the two :root blocks; every rule reads a token", raw.length === 0, raw.slice(0, 4).join(" "));
  check("(6f) Malone's look: a serif title over a gold rule", /--serif: Georgia/.test(css) && /\.title-accent \{[^}]*background: var\(--gold\)/.test(css) && /class="title-accent"/.test(PAGE));
  check("(6f) First Light's faces are gone from this page", !/Playfair Display|Source Sans 3/.test(PAGE));
  check("(6f) the page says why it leaves First Light", /leaves First Light for the look of Malone's CPL\/AI/.test(PAGE));
});

Promise.all(pending).then(function () {
  let fail = 0;
  results.forEach(function (r) { if (!r[1]) fail++; console.log((r[1] ? "  ok   " : "  FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  — " + r[2])); });
  console.log("\n" + (results.length - fail) + "/" + results.length + " passed");
  if (fail) process.exit(1);
});
