// The public Credential Catalog (library/adopt/; Sam, Open Asks Sheet 147, 2026-10-31; his asks of 2026-11-06 on the mock).
//
// Guards what can go wrong on the page itself (the builders' files are guarded by tests/adopt_page_build_test.py and
// tests/adopt_align_build_test.py):
//   - a college pick opens on what the college could add (Earns credit elsewhere); Earns credit here reads the same
//     scope; a district or region scopes the same way, and a content filter never drops a matrix column;
//   - the list groups by field, the largest first and the exams last; the college's own course comes first inside a field;
//   - Credit status takes the public words, and the other statuses arrive from adopt_more.json after the first paint;
//     a search names what it also found with another status;
//   - a college is never offered a Request Quick Adopt chip for its own exhibit; every MAP link is Request Quick Adopt's
//     address with View=Non-Military (map_links.js);
//   - the List drills down and a 0 carries Ask us to prioritize; the matrix marks a could-adopt college A, a cell opens the
//     side panel at that college, a column heading picks the college; the panel's request names the college route and the
//     statewide route as Sam ruled it on Sheet 162 (a public request to prioritize review, never an evaluation promise):
//     the form posts to the one INSERT-only function with the credential, the picked college and an optional email, the
//     reply is the count, the count paints beside the credential, a failed post says so; the analysis reads adopt_align.json;
//   - the CSV quotes what needs quoting and marks a could-adopt cell A; Create Handout opens the college's visual;
//   - the page remembers no filter (Sam, 2026-10-21): the browser keeps only the theme and the panel's width;
//   - Malone's look, Light unless the reader picks Dark; three figure tiles; no bare "CPL" or "MAP" in the page's own words;
//   - a failed read says so and paints no list; Worth a faculty review keeps its cards, filtered by search and field only.
// Run from repo root: `npm test` (or `node tests/public_adopt.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PAGE = fs.readFileSync("library/adopt/index.html", "utf8");
const JS = fs.readFileSync("library/adopt/adopt.js", "utf8");
const MAPLINKS = fs.readFileSync("map_links.js", "utf8");

const DATA = {
  written_at: "2026-11-06T12:00:00Z",
  counts: { settled: 3, held: 1, in_reference: 4 },
  colleges: [
    ["Alpha College", "Alpha", "Alpha CCD", "Bay Area (Region 3)", "B"],
    ["Beta College", "Beta", "Beta CCD", "Inland Empire/Desert (Region 9)", "D"],
    ["Gamma College", "Gamma", "Alpha CCD", "Bay Area (Region 3)", "B"],
  ],
  sectors: { "11": "Computer Sciences", "51": "Health" },
  types: ["Credit By Exam", "Industry Certification"],
  credentials: [
    { t: "CompTIA Security+", i: "CompTIA", y: [1], s: "11", p: 3,
      a: [[1, 3, "CIS 75: 3 hours, in \"Security\""], [2, 3, "CNT 69: 3 hours"]], c: [[0, "CIS 9"]],
      m: [["MAP-B", 1, ""], ["MAP-G", 2, ""]] },
    { t: "EMT", i: "NREMT", y: [1], s: "51", p: 4, a: [[0, 4, "EMS 1: 4 hours"], [1, 4, "EMS 2: 4 hours"], [2, 4, "EMS 3"]],
      m: [["MAP-A", 0, ""]] },
    { t: "AP Biology", i: "College Board", y: [0], s: "11", p: 4, a: [[1, 4, "BIO 1"]], m: [["MAP-X", -1, "Delta University"]] },
  ],
  review: [
    { t: "Certified Welder (CW)", i: "American Welding Society", k: "ce-1", s: "51", f: "Welding (CIP 48.0508)", l: "High school",
      o: ["Welders (51-4121)"], u: "https://aws.example/cw", r: "AWS D1.1 Structural Welder Qualification" },
    { t: "Certified Professional Coder (CPC)", i: "AAPC", k: "ce-2", s: "11",
      o: ["A (1)", "B (2)", "C (3)"], on: 2, n: ["Health Care (NAICS 62)"] },
  ],
};
const MORE = {
  held: [{ t: "Phlebotomy Technician", i: "NHA", s: "51", n: 1 }],
  harvested: [
    { t: "AWS Certified Cloud Practitioner", i: "Amazon Web Services", k: "certification", s: "11", src: ["iss", "cos"], ct: 1, sk: 4, u: "https://aws.example/ccp" },
    { t: "Chainsaws Level 1", i: "Forestry Board", k: "certification", s: "51", src: ["cos"] },
    { t: "Cisco Networking Essentials", i: "Cisco", k: "course certificate", s: "11", ms: "inmap" },
  ],
};
const ALIGN = {
  cover: { colleges: 2, courses: 40 },
  align: { "CompTIA Security+": {
    issuer_skills_kind: "exam domains", source: "https://comptia.example/securityplus",
    skills: [{ domain: "Threats, Vulnerabilities, and Mitigations", weight: 22 }, { domain: "Security Operations", weight: 28 }],
    courses: [{ college: "Gamma College", code: "CNT 69", title: "Network Security", mean: 0.5,
      slos: [{ text: "Classify threats and vulnerabilities and apply mitigations.", skill: "Threats, Vulnerabilities, and Mitigations", score: 0.61 }] }],
    covered: 1, of: 2, confidence: 0.5 } },
};

function load(query, opts) {
  opts = opts || {};
  const writes = [], posts = [];
  const dom = new JSDOM(PAGE, {
    url: "https://cpl-initiative.github.io/cpl-project-tracker/library/adopt/" + (query || ""),
    runScripts: "outside-only", pretendToBeVisual: true,
  });
  const w = dom.window;
  w.Storage.prototype._set = w.Storage.prototype.setItem;
  w.Storage.prototype.setItem = function (k, v) { writes.push(k); return this._set(k, v); };
  w.Element.prototype.scrollIntoView = function () {};
  w.fetch = function (url, init) {
    if (opts.fail) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    if (/credential_priority_counts/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.asks === undefined ? [] : opts.asks) });
    if (/credential_priority_request/.test(url)) {
      posts.push({ headers: init.headers, body: JSON.parse(init.body) });
      if (opts.askFail) return Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error("500")) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.askReply === undefined ? 3 : opts.askReply) });
    }
    const body = /adopt_more/.test(url) ? (opts.more === undefined ? MORE : opts.more) : /adopt_align/.test(url) ? ALIGN : (opts.data || DATA);
    if (body === null) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(body))) });
  };
  w.requestAnimationFrame = (f) => setTimeout(f, 0);
  if (opts.io) {  // a stand-in IntersectionObserver the test fires by hand
    w.IntersectionObserver = function (cb, o) { this.cb = cb; this.o = o; opts.io.push(this); };
    w.IntersectionObserver.prototype.observe = function (el) { this.el = el; };
    w.IntersectionObserver.prototype.disconnect = function () { this.gone = true; };
  }
  w.eval(JS);
  return new Promise((res) => setTimeout(() => res({ w, d: w.document, writes, posts }), 60));
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms || 30));
function titles(d) { return Array.from(d.querySelectorAll("#ad-list .cred h3")).map((h) => h.textContent); }
function pick(d, id, key, on) {
  // Open a picker, set one checkbox, close it.
  d.querySelector("#" + id + " .pick-btn").click();
  const box = d.querySelector("#" + id + ' input[data-key="' + key + '"]');
  if (!box) throw new Error("no option " + key + " in " + id);
  box.checked = on !== false;
  box.dispatchEvent(new d.defaultView.Event("change", { bubbles: true }));
  const done = d.querySelector("#" + id + " .pp-done"); if (done) done.click();
}

(async function () {
  // The pure parts.
  const A = (await load()).w.CPL_ADOPT;
  const R = DATA.credentials.map((c, i) => Object.assign({ std: "awarded", _i: i }, c));
  const F = (o) => Object.assign({ q: "", colleges: {}, regions: {}, areas: {}, sectors: {}, types: {}, standing: { awarded: true }, sort: "az" }, o);
  check("no college filter: every credential, no scope", A.scope(DATA, F()) === null && A.rows(DATA, R, F()).length === 3);
  const sc0 = A.scope(DATA, F({ colleges: { 0: true } }));
  check("a credential a college awards is here; one it could add is open", A.stdOf(R[1], sc0) === "here" && A.stdOf(R[0], sc0) === "open" && A.stdOf(R[0], null) === "awarded");
  const open = A.rows(DATA, R, F({ colleges: { 0: true }, standing: { open: true } })).map((c) => c.t);
  check("open: what the college could add, its own course first", JSON.stringify(open) === JSON.stringify(["CompTIA Security+", "AP Biology"]));
  check("here: what the college awards", A.rows(DATA, R, F({ colleges: { 0: true }, standing: { here: true } })).map((c) => c.t).join() === "EMT");
  check("a region scopes two colleges", Object.keys(A.scope(DATA, F({ regions: { "Bay Area (Region 3)": true } }))).join() === "0,2");
  check("a region's open list drops what any of its colleges awards",
    A.rows(DATA, R, F({ regions: { "Bay Area (Region 3)": true }, standing: { open: true } })).map((c) => c.t).join() === "AP Biology");
  check("Area scopes like SW Region", Object.keys(A.scope(DATA, F({ areas: { D: true } }))).join() === "1");
  check("a content filter never drops a matrix column", A.cols(DATA, F({ sectors: { "51": true }, q: "zz" })).length === 3);
  check("search reads title and issuer, every word at a word start", A.rows(DATA, R, F({ q: "nremt emt" })).length === 1 && A.rows(DATA, R, F({ q: "mt" })).length === 0);
  check("how credit is given filters by index", A.rows(DATA, R, F({ types: { 0: true } })).map((c) => c.t).join() === "AP Biology");
  check("an exam groups under the exams, whatever its sector", A.groupKey(R[2]) === "exams" && A.groupKey(R[0]) === "11");
  check("fields order by size, the exams last", A.fieldOrder(DATA, R).keys.join() === "11,51,exams");
  check("MAP link is Request Quick Adopt's, Non-Military card",
    A.mapUrl("MAP-B") === "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses?Exhibit=MAP-B&View=Non-Military");
  const page = /var MAP_PAGE = "([^"]+)"/.exec(MAPLINKS);
  check("the MAP page matches map_links.js", page && A.mapUrl("X").indexOf(page[1] + "?Exhibit=") === 0);
  const odd = [Object.assign({}, R[2], { t: 'Spanish, "Level 2"' })];
  check("list CSV quotes a cell with a quote or comma", A.csvList(DATA, odd).split("\r\n")[1].indexOf('"Spanish, ""Level 2"""') === 0);
  const mx = A.csvMatrix(DATA, R, [0, 1, 2]).split("\r\n");
  check("matrix CSV: units, and A where the college could adopt", mx[1] === "CompTIA Security+,A,3,3");
  check("the public words for each credit status", A.STD.awarded === "Earns credit at a college" && A.STD.harvested === "Not yet evaluated" && A.STD.held === "Being reviewed");

  // The page, opened on a college.
  const one = await load("?college=Alpha%20College");
  let d = one.d;
  check("?college= opens on that college, on what it could add", /2 credentials earning credit elsewhere that Alpha College could add/.test(d.getElementById("ad-state").textContent));
  check("the college shows as a chip and in its picker", /Alpha/.test(d.getElementById("ad-sel").textContent) && /Alpha College/.test(d.querySelector("#pk-college .sum").textContent));
  check("cards grouped by field, the exams last", titles(d).join("|") === "CompTIA Security+|AP Biology"
    && Array.from(d.querySelectorAll("#ad-list .grp-h")).map((h) => h.firstChild.textContent).join("|") === "Computer Sciences|High school and college exams (AP, IB, CLEP, DSST)");
  const sec = d.querySelector("#ad-list .cred");
  check("the college's own course is named", /Already teaches a matching course: Alpha: CIS 9/.test(sec.textContent));
  const chips = Array.from(sec.querySelectorAll("a.chip"));
  check("Request Quick Adopt chips name the builders", chips.map((a) => a.textContent.replace(/ built.*/, "")).join() === "Beta,Gamma");
  check("every chip opens MAP in a new tab", chips.every((a) => /View=Non-Military$/.test(a.href) && a.target === "_blank" && /noopener/.test(a.rel)));
  check("every card offers Ask us to prioritize this credential", d.querySelectorAll("#ad-list .cred [data-req]").length === 2
    && Array.from(d.querySelectorAll("#ad-list .cred [data-req]")).every((b) => b.textContent === "Ask us to prioritize this credential"));
  const hand = d.getElementById("ad-handout");
  check("Create Handout opens the college's visual", !hand.hidden && /cpl-opportunity\/\?college=Alpha%20College$/.test(hand.href));
  check("the status picker reads the scope's words", Array.from(d.querySelectorAll("#pk-standing .pp-row span:first-of-type")).map((s) => s.textContent).slice(0, 2).join("|") === "Earns credit here|Earns credit elsewhere, could be added here");
  pick(d, "pk-standing", "open", false); pick(d, "pk-standing", "here", true);
  const emt = d.querySelector("#ad-list .cred");
  check("Earns credit here shows the college's units", emt && /Earns credit here: Alpha \(4\)/.test(emt.textContent) && /1 credential earning credit at Alpha College/.test(d.getElementById("ad-state").textContent));
  check("a college is never offered its own exhibit", emt && !Array.from(emt.querySelectorAll("a.chip")).some((a) => /MAP-A/.test(a.href)));
  d.getElementById("ad-clear").click();
  check("Clear: Earns credit at a college, no handout, the address drops ?college=", /Earns credit at a college/.test(d.querySelector("#pk-standing .sum").textContent)
    && d.getElementById("ad-handout").hidden && one.w.location.search === "" && titles(d).length === 3);
  pick(d, "pk-region", "r:Bay Area (Region 3)", true);
  check("a region newly picked opens on what it could add", /earning credit elsewhere that Bay Area \(Region 3\) could add/.test(d.getElementById("ad-state").textContent));
  check("a builder outside the columns is named", /Delta University/.test(d.getElementById("ad-list").textContent));
  // The other statuses arrived from adopt_more.json.
  check("the other statuses are in the picker with counts", /Being reviewed/.test(d.querySelector("#pk-standing").innerHTML) && /Not yet evaluated/.test(d.querySelector("#pk-standing").innerHTML));
  const kpi = (id) => d.querySelector("#" + id + " b").textContent;
  check("the tiles follow a region: what earns credit at its colleges (Sam, 2026-11-06)", kpi("kpi-awarded") === "2" && kpi("kpi-colleges") === "2" && kpi("kpi-harvested") === "2"
    && /at the colleges picked/.test(d.querySelector("#kpi-awarded span").textContent) && !d.getElementById("kpi-scope").hidden);
  d.getElementById("ad-clear").click();
  check("the tiles count the state with no filter", kpi("kpi-awarded") === "3" && kpi("kpi-colleges") === "3" && kpi("kpi-harvested") === "2"
    && /at a college$/.test(d.querySelector("#kpi-awarded span").textContent) && d.getElementById("kpi-scope").hidden);
  pick(d, "pk-sector", "11", true);
  check("the tiles follow the field, whatever the credit status", kpi("kpi-awarded") === "1" && kpi("kpi-colleges") === "2" && kpi("kpi-harvested") === "1");
  d.getElementById("kpi-harvested").click();
  check("a tile opens what it counts, the field kept", !d.getElementById("ad-table-view").hidden
    && Array.from(d.querySelectorAll("#ad-tbl-body tr:not(.band) td:first-child")).map((td) => td.textContent).join() === "AWS Certified Cloud Practitioner");
  d.getElementById("ad-clear").click();
  d.querySelector('[data-view="list"]').click();
  const q = d.getElementById("ad-q"); q.value = "aws"; q.dispatchEvent(new one.w.Event("input"));
  await tick(220);
  check("a search names what it found with another status, and a word start never matches inside a word",
    /Also matching with another credit status: 1 not yet evaluated/.test(d.getElementById("ad-other").textContent) && titles(d).length === 0);
  d.querySelector('#ad-other [data-std="harvested"]').click();
  check("one press adds that status", titles(d).join() === "AWS Certified Cloud Practitioner" && /Not yet evaluated/.test(d.querySelector("#ad-list .cred").textContent)
    && /Credential Engine CTID/.test(d.querySelector("#ad-list .cred").textContent));
  d.getElementById("ad-clear").click();

  // The List.
  d.querySelector('[data-view="table"]').click();
  check("the List shows and the cards hide", !d.getElementById("ad-table-view").hidden && d.getElementById("ad-list-view").hidden);
  check("the List's columns: the credit status its own, the ask on the right (Sam, 2026-11-06)", Array.from(d.querySelectorAll("#ad-tbl thead th")).map((t) => t.textContent).join("|") === "Credential|Issuer|Field|How credit is given|Credit status|Colleges|Median units|Ask us to prioritize");
  check("the colgroup matches the columns, and a band spans them", d.querySelectorAll("#ad-tbl col").length === 8 && d.querySelector("#ad-tbl-body tr.band th").getAttribute("colspan") === "8");
  check("a band per field", d.querySelectorAll("#ad-tbl-body tr.band").length === 3);
  check("one line a credential: no second line under the title", !d.querySelector("#ad-tbl-body .sub") && /\.tbl\.one td \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis/.test(PAGE));
  pick(d, "pk-standing", "harvested", true);
  const hrows = Array.from(d.querySelectorAll("#ad-tbl-body tr:not(.band)")).filter((tr) => tr.children[5].textContent === "0");
  check("a 0 stays a 0, the status in its column, the ask in the last", hrows.length === 2
    && hrows.every((tr) => tr.children.length === 8 && tr.children[5].textContent === "0" && tr.children[4].textContent === "Not yet evaluated"
      && tr.children[7].querySelector(".req-w[data-req]") && tr.children[7].querySelector(".req-w").title === "Ask us to prioritize this credential"));
  check("the status cell's title carries the evidence", /Not yet evaluated · /.test(hrows.map((tr) => tr.children[4].title).join("|")));
  d.querySelector('#ad-tbl-body button[data-q="CompTIA"]').click();
  check("the issuer drills down to a search", d.getElementById("ad-q").value === "CompTIA" && d.querySelectorAll("#ad-tbl-body tr:not(.band)").length === 1);
  d.getElementById("ad-clear").click();

  // The matrix.
  pick(d, "pk-region", "r:Bay Area (Region 3)", true);
  pick(d, "pk-standing", "here", true);
  d.querySelector('[data-view="matrix"]').click();
  check("the matrix shows and the List hides", !d.getElementById("ad-matrix-view").hidden && d.getElementById("ad-table-view").hidden);
  const heads = Array.from(d.querySelectorAll(".mx thead th.ch")).map((t) => t.textContent);
  check("a region narrows the columns", heads.join() === "Alpha,Gamma");
  check("column headers are scoped", d.querySelectorAll('.mx thead th[scope="col"]').length === 3);
  check("a band row and three credential rows, each a row header", d.querySelectorAll('.mx tbody tr.grp-row').length === 3 && d.querySelectorAll('.mx tbody tr:not(.grp-row) th[scope="row"]').length === 3);
  check("an awarded cell is a button with the units", d.querySelectorAll(".mx td.art button").length === 3);
  const could = d.querySelector(".mx td.could button");
  check("a could-adopt cell reads A and says so", could && could.textContent === "A" && /could adopt/.test(could.getAttribute("aria-label")));
  check("the matrix sits in a labelled region", d.getElementById("ad-mx-wrap").getAttribute("role") === "region" && d.getElementById("ad-mx-wrap").getAttribute("aria-label"));
  d.querySelector(".mx td.art button").click();
  await tick(80);
  const panel = d.getElementById("ad-panel");
  check("a cell opens the panel at that college", panel.classList.contains("open") && panel.getAttribute("aria-hidden") === "false" && /Credential at (Alpha|Gamma)/.test(d.getElementById("pn-kicker").textContent)
    && /awards <b>\d/.test(d.querySelector("#pn-body .focus").innerHTML));
  check("the panel names the colleges, the request routes and the analysis", /colleges? awards? credit for it/.test(d.getElementById("pn-awards").textContent)
    && /Find your college/.test(d.querySelector("#pn-body .req").textContent) && /Credit for Being You/.test(d.querySelector("#pn-body .req").textContent)
    && /Analysis for faculty/.test(d.getElementById("pn-body").textContent));
  check("the statewide route is a request to prioritize review, never an evaluation promise (Sam, Sheet 162)",
    d.getElementById("pn-req").textContent.indexOf("Ask us to prioritize this credential") === 0
    && /prioritize this credential for review/.test(d.querySelector("#pn-body .req").textContent)
    && /rests with that college/.test(d.querySelector("#pn-body .req").textContent) && /sends no reply/.test(d.querySelector("#pn-body .req").textContent)
    && !/evaluat(e|ion) (it|your credential) for you|will evaluate|setting up a request list/.test(d.querySelector("#pn-body .req").textContent));
  const askForm = d.getElementById("pn-ask-form");
  check("the form takes the credential, the picked college and an optional email", askForm && askForm.getAttribute("data-cred") === d.querySelector("#pn-body h2").textContent
    && askForm.querySelector("#pn-ask-college") && askForm.querySelector("#pn-ask-email").type === "email"
    && askForm.querySelector("button[type=submit]").textContent === "Ask us to prioritize it" && askForm.querySelector("button[type=submit]").classList.contains("word"));
  askForm.querySelector("#pn-ask-college").value = "Alpha College";
  askForm.querySelector("#pn-ask-email").value = "someone@example.edu";
  askForm.dispatchEvent(new d.defaultView.Event("submit", { bubbles: true, cancelable: true }));
  await tick(40);
  const posted = one.posts[0];
  check("Ask posts once to the one INSERT-only function, with the anon key, the credential, the college, the email and the source",
    one.posts.length === 1 && posted.body.p_credential === askForm.getAttribute("data-cred") && posted.body.p_college === "Alpha College"
    && posted.body.p_email === "someone@example.edu" && posted.body.p_source === "catalog" && posted.headers.apikey && /^eyJ/.test(posted.headers.apikey));
  check("the reply is the count, said in the panel and in its heading", /Asked\. 3 people have asked/.test(d.getElementById("pn-ask-msg").textContent)
    && /3 people have asked/.test(d.getElementById("pn-req").textContent) && askForm.hidden);
  check("the page remembers nothing of the ask", one.writes.every((k) => k === "cpl_theme" || k === "cpl_catalog_panel_w"));
  const sp = Array.from(d.querySelectorAll("#pn-body .verdict"));
  check("the analysis reads adopt_align.json and labels its score illustrative", sp.length === (/CompTIA/.test(d.querySelector("#pn-body h2").textContent) ? 1 : 0)
    && (!sp.length || (/Recommendation to adopt or adapt/.test(sp[0].textContent) && /Illustrative/.test(sp[0].textContent))));
  check("the panel has a resize grip", d.getElementById("pn-grip").getAttribute("role") === "separator" && d.getElementById("pn-grip").getAttribute("aria-orientation") === "vertical");
  d.getElementById("pn-close").click();
  check("Close shuts the panel", !panel.classList.contains("open") && panel.getAttribute("aria-hidden") === "true");
  d.querySelector(".mx thead th.ch button").click();
  check("a column heading picks that college", /College<\/b> Alpha/.test(d.getElementById("ad-sel").innerHTML) && d.querySelectorAll(".mx thead th.ch").length === 1
    && /Alpha College/.test(d.querySelector("#pk-college .sum").textContent));
  check("the page remembers no filter", one.writes.every((k) => k === "cpl_theme" || k === "cpl_catalog_panel_w"));

  // A failed post says so and leaves the form; the counts read paints beside the credential.
  const nay = await load("", { askFail: true, asks: [{ credential: "comptia security+", n: 4 }, { credential: "AWS Certified Cloud Practitioner", n: 2 }] });
  d = nay.d;
  await tick(40);
  d.querySelector("#ad-list .cred [data-req]").click();
  await tick(40);
  const bf = d.getElementById("pn-ask-form");
  check("a credential's count paints on its card and in the panel's heading", /4 people have asked/.test(d.querySelector("#ad-list .cred .askn").textContent)
    && /4 people have asked/.test(d.getElementById("pn-req").textContent) && nay.w.CPL_ADOPT.asked({ t: "AWS Certified Cloud Practitioner" }) === 2);
  bf.dispatchEvent(new d.defaultView.Event("submit", { bubbles: true, cancelable: true }));
  await tick(40);
  check("a failed post says so and keeps the form", /could not be sent/.test(d.getElementById("pn-ask-msg").textContent) && !bf.hidden && !bf.querySelector("button[type=submit]").disabled);
  d.querySelector('[data-view="table"]').click();
  check("the List says how many asked, beside the credential", Array.from(d.querySelectorAll("#ad-tbl td .askn")).some((x) => x.textContent === "4 asked"));

  // Without adopt_more.json the page stands on the settled credentials.
  const lone = await load("", { more: null });
  check("no adopt_more.json: the page still paints and hides the harvested tile", titles(lone.d).length === 3 && lone.d.getElementById("kpi-harvested").hidden);

  // Worth a faculty review.
  function reviewTitles(d) { return Array.from(d.querySelectorAll("#ad-review .cred h3")).map((h) => h.textContent); }
  const rv = await load("?college=Alpha%20College");
  d = rv.d;
  check("review: shown with every card, a college pick notwithstanding", !d.getElementById("review").hidden
    && reviewTitles(d).join("|") === "Certified Welder (CW)|Certified Professional Coder (CPC)");
  check("review: its heading and count", d.getElementById("ad-review-h").textContent === "Worth a faculty review" && d.getElementById("ad-review-state").textContent === "2 credentials");
  const cw = d.querySelector("#ad-review .cred");
  check("review: tags are a description list in order", Array.from(cw.querySelectorAll("dl.tags dt")).map((x) => x.textContent).join() === "Occupations,Field,Level");
  check("review: the related credential is named without the acronym", /A related credential from the same issuer already earns credit: AWS D1\.1 Structural Welder Qualification\./.test(cw.textContent));
  const rl = Array.from(cw.querySelectorAll("a.chip"));
  check("review: the issuer's page and the Registry record, each in a new tab", rl.length === 2 && rl[1].href === "https://credentialengineregistry.org/resources/ce-1" && rl.every((a) => a.target === "_blank" && /noopener/.test(a.rel)));
  pick(d, "pk-sector", "51", true);
  check("review: the field filters it", reviewTitles(d).join() === "Certified Welder (CW)" && d.getElementById("ad-review-state").textContent === "1 of 2 credentials");
  check("review: the pure filter", rv.w.CPL_ADOPT.reviewRows(DATA, { q: "", sectors: { "11": true } }).map((r) => r.k).join() === "ce-2");
  const nd = await load("", { data: Object.assign({}, DATA, { review: [] }) });
  check("review: no rows, no section", nd.d.getElementById("review").hidden);

  // Lazy loading in place of Show more (Sam, 2026-11-06).
  const many = Object.assign({}, DATA, { review: [], credentials: Array.from({ length: 100 }, (_, i) => ({ t: "Cred " + String(i).padStart(3, "0"), i: "X", y: [1], s: "11", p: 3, a: [[1, 3, ""]] })) });
  const ios = [];
  const lz = await load("", { data: many, more: null, io: ios });
  d = lz.d;
  check("lazy: the first batch, a sentinel, no Show more", d.querySelectorAll("#ad-list .cred").length === 72 && d.getElementById("ad-list-sentinel") && d.getElementById("ad-more").hidden);
  let live = ios.filter((o) => !o.gone).pop();
  live.cb([{ isIntersecting: true }]);
  check("lazy: nearing the end draws the rest and drops the sentinel", d.querySelectorAll("#ad-list .cred").length === 100 && !d.getElementById("ad-list-sentinel"));
  const ios2 = [];
  d = (await load("", { data: many, more: null, io: ios2 })).d;
  d.querySelector('[data-view="table"]').click();
  live = ios2.filter((o) => !o.gone).pop();
  check("lazy: the List watches against its own box", live && live.o.root === d.getElementById("ad-tbl-wrap") && live.el.id === "ad-tbl-sentinel" && d.getElementById("ad-more-t").hidden);
  const plain = await load("", { data: many, more: null });
  check("lazy: without IntersectionObserver, Show more stays", !plain.d.getElementById("ad-more").hidden && /28 more/.test(plain.d.getElementById("ad-more").textContent));

  const bad = await load("", { fail: true });
  check("a failed read says so", /could not be read/.test(bad.d.getElementById("ad-state").textContent) && !bad.d.querySelector("#ad-list .cred"));

  // Malone's look, Light by default, the public words, the wiring.
  const main = PAGE.slice(PAGE.indexOf("<main"), PAGE.indexOf("</main>"));
  check("the Library's tokens, full width", /--heading: #082B61/.test(PAGE) && /--gold: #F4B300/.test(PAGE) && !/1320px/.test(PAGE));
  check("dark only when picked", !/prefers-color-scheme: dark/.test(PAGE));
  check("named the Credential Catalog and indexable (Sheet 148)", /<h1 id="ad-title">Credential Catalog<\/h1>/.test(PAGE) && !/noindex/.test(PAGE));
  check("the intro says many, and the page's own words carry no bare CPL or MAP", /award credit for many of the credentials/.test(main) && !/\bCPL\b/.test(main.replace(/<!--[\s\S]*?-->/g, "")) && !/\bMAP\b(?! exhibits)/.test(main.replace(/<!--[\s\S]*?-->/g, "")));
  check("the Library links the Catalog", /href="\.\/adopt\/"[^>]*>Credential Catalog</.test(fs.readFileSync("library/index.html", "utf8")));
  check("a skip link, one h1, three tiles, five Start with words", /class="skip-link"/.test(PAGE) && (PAGE.match(/<h1/g) || []).length === 1 && (PAGE.match(/class="kpi"/g) || []).length === 3 && (PAGE.match(/data-start=/g) || []).length === 5);
  check("the Library's photos cycle here too", (PAGE.match(/class="hero-slide( is-on)?"/g) || []).length === 11 && /id="ad-hero-pause"/.test(PAGE));
  check("in the a11y sweep, four targets", /"public-adopt"/.test(fs.readFileSync("a11y.config.js", "utf8")) && /"public-adopt-list"/.test(fs.readFileSync("a11y.config.js", "utf8")));
  const wf = fs.readFileSync(".github/workflows/daily-dashboard.yml", "utf8");
  check("the daily run builds the data and the analysis", /kb\/_build_adopt_page\.py/.test(wf) && /kb\/_build_adopt_align\.py/.test(wf) && /adopt_more\.json/.test(wf) && /adopt_align\.json/.test(wf));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})();
