// The Procedures lane in the Common Exhibit Reference (2026-10-18).
//
// Sam, 2026-10-18: "I want to be able to add more procedures to have you
// classify and complete common exhibit titles and elements as we go." The
// nightly run (kb/_cer_procedures.py) writes kb/cer_procedures_out/latest.json;
// this lane reads it. The failure modes guarded here: a procedure shown without
// who set it and their words; the Needs-you list painting every held title at
// once; the examples toggle hiding its state from a screen reader; a report
// that fails to load taking the grid down with it; and a control drawn as a
// filled button or with a raw hex instead of an underlined word on a token.
//
// Run from repo root: `npm test` (or `node tests/cer_procedures_view.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { cerLane } = require("./_cer_views");

const src = fs.readFileSync("credential_reference.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }

const payload = { _generated_at: "t", top_categories: {}, unified_titles: [
  { ut: "AP Statistics", raw_count: 2, conf_title: 0.9, issuer: "College Board",
    audit_tags: {}, audit_tag_total: 0, articulations: [] },
] };

const needs = [];
for (let i = 0; i < 40; i++) {
  needs.push({ raw_title: "Held title " + String(i).padStart(2, "0"), why: "the classifier is unsure (0.62)",
    proposal: { title: "Proposal " + i, issuer: "California Community Colleges", confidence: 0.62 },
    colleges: ["A College"] });
}
needs.unshift({ raw_title: "CRIM-11 Introduction to Corrections", why: "two procedures disagree",
  proposals: [{ procedure: "brand-family", title: "Corrections", issuer: "X" },
              { procedure: "course-identity", title: "Introduction to Corrections", issuer: "California Community Colleges" }],
  colleges: ["B College", "C College"] });
const report = {
  _generated_at: "2026-10-18T07:47:00Z", waiting: 1322, proposed: 1100, needs_you_count: needs.length,
  not_yet_asked: 0,
  procedures: [
    { id: "brand-family", name: "Brand families join the family", kind: "rule",
      rule: "A title that names a known credential family joins that family's title as written.",
      source: { who: "Sam", date: "2026-07-07", words: "all the APs should be an easy win, right?", skill: "Rule 5d" },
      settled: 53, held: 0, sample: [["AP Statistics Exam", "AP Statistics"]] },
    { id: "issuer-issues-the-card", name: "The issuer issues the card", kind: "guidance",
      rule: "The issuing agency is the body that issues the credential.",
      source: { who: "Sam", date: "2026-10-05", words: "they would not be the issuing agency, osha would." },
      settled: 12, held: 3, sample: [] },
    { id: "classifier", name: "The classifier decides the rest", kind: "classifier",
      rule: "Every title no rule settles goes to the classifier.",
      source: { who: "Sam", date: "2026-10-18", words: "have you classify and complete common exhibit titles" },
      settled: 900, held: 41, sample: [["Pipe Welding-Credit by Exam", "Pipe Welding"]] },
  ],
  needs_you: needs,
};

function makeDom(opts) {
  opts = opts || {};
  const html = `<!DOCTYPE html><html><body>
  <div id="tab-credential-reference" class="cpl-tab-pane">
    <div id="cr-toolbar"></div><div id="cr-summary"></div><div id="cr-table-wrap"></div>
  </div></body></html>`;
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "https://example.org/" });
  const { window } = dom;
  window.CPL_CREDENTIAL_REFERENCE = payload;
  const log = { urls: [] };
  window.fetch = function (url) {
    url = String(url); log.urls.push(url);
    const respond = (body, status) => Promise.resolve({
      ok: !status || status < 400, status: status || 200, json: () => Promise.resolve(body) });
    if (url.indexOf("cer_procedures_out/latest.json") >= 0) {
      return opts.reportFails ? respond(null, 404) : respond(report);
    }
    if (url.indexOf("it_ai_credential_catalog.json") >= 0) return respond({ credentials: [] });
    if (url.indexOf("issuer_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_preseed.json") >= 0) return respond({ staged: {} });
    if (url.indexOf("unclassified_suggestions.json") >= 0) return respond({ suggestions: {} });
    // The Unclassified queue: every held title but the first two is still waiting.
    if (url.indexOf("exhibit_audit/latest.json") >= 0) return respond({ title_cards: needs.slice(2).map((n) => ({
      raw_title: n.raw_title, tags: ["unclassified_in_map"], colleges: n.colleges })) });
    return respond([]);
  };
  window.eval(src);
  return { window, log };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { window, log } = makeDom({});
  const doc = window.document;
  await sleep(150);

  check("load: the report is fetched once",
    log.urls.filter((u) => u.indexOf("cer_procedures_out/latest.json") >= 0).length === 1);

  // S413: three views, and the tab opens on Needs you › Held when the run
  // held titles for a person.
  const views = Array.from(doc.querySelectorAll("button.cr-view"));
  check("views: three words, Needs you · Procedures · Reference",
    views.map((v) => txt(v).replace(/\s*\(.*$/, "")).join(" · ") === "Needs you · Procedures · Reference");
  check("views: a labelled group, the view in use said by aria-pressed",
    /views/.test(doc.querySelector(".cr-views").getAttribute("aria-label"))
    && views[0].getAttribute("aria-pressed") === "true" && views[2].getAttribute("aria-pressed") === "false");
  check("views: Needs you counts the held titles", /Needs you \(41\)/.test(txt(views[0])));
  check("views: Reference counts the credentials", /Reference \(1\)/.test(txt(views[2])));
  const subs = Array.from(doc.querySelectorAll(".cr-sublanes button.cr-lane")).map((b) => txt(b).replace(/\s*\(.*$/, ""));
  check("needs you: its lanes are Held, Unclassified, No issuer, Merge confirms",
    subs.join(" · ") === "Held · Unclassified · No issuer · Merge confirms");
  check("needs you: opens on Held", cerLane(doc, /^Held/).getAttribute("aria-pressed") === "true");

  const needItems = () => Array.from(doc.querySelectorAll(".cr-proc-need"));
  check("held: pages at 25 rather than painting every held title", needItems().length === 25);
  check("held: the heading counts every held title",
    /Held by the procedures \(41\)/.test(txt(doc.getElementById("cr-proc-needs-h"))));
  const dis = needItems()[0];
  check("held: a disagreement shows both proposals and who made each",
    /by brand-family/.test(txt(dis)) && /by course-identity/.test(txt(dis)));
  check("held: says why the title is here", /Why it is here: two procedures disagree/.test(txt(dis)));
  check("held: names the colleges", /B College, C College/.test(txt(dis)));
  const summary = txt(doc.getElementById("cr-summary"));
  check("summary: says how many titles were pre-filled and how many need a person",
    /1100 of 1322 waiting titles pre-filled in Unclassified/.test(summary) && /41 need you/.test(summary));
  check("summary: carries the run's date", /2026-10-18/.test(summary));
  doc.querySelector("button.cr-proc-more").click();
  await sleep(30);
  check("held: Show more reveals the rest", needItems().length === 41);

  check("held: a title saved since the run says so, with nothing to open",
    /No longer waiting/.test(txt(needItems()[1])) && !needItems()[1].querySelector("button.cr-proc-open"));
  // Open in Unclassified: the title shows alone there, until asked for the rest.
  const openBtn = needItems()[2].querySelector("button.cr-proc-open");
  check("held: each title opens in Unclassified, a word", !!openBtn && txt(openBtn) === "Open in Unclassified");
  openBtn.click();
  await sleep(80);
  check("open: Unclassified is the lane in use", cerLane(doc, /^Unclassified/).getAttribute("aria-pressed") === "true");
  check("open: Unclassified shows the one title, and says so",
    /Showing the one title opened from Held/.test(txt(doc.getElementById("cr-table-wrap")))
    && doc.querySelectorAll(".cr-wl-row").length === 1
    && /Held title 01/.test(txt(doc.querySelector(".cr-wl-row"))));
  const every = doc.querySelector("button.cr-wl-every");
  check("open: a word brings back every waiting title", !!every && txt(every) === "Show every waiting title");
  every.click();
  await sleep(30);
  check("open: the single-title note leaves, and the queue comes back",
    !doc.querySelector(".cr-wl-only") && doc.querySelectorAll(".cr-wl-row").length > 1);

  const pl = cerLane(doc, /^Procedures/);
  check("procedures: the view carries the count in force", !!pl && /\(3\)/.test(txt(pl)));
  pl.click();
  await sleep(30);
  check("procedures: pressed state is exposed, not color alone",
    cerLane(doc, /^Procedures/).getAttribute("aria-pressed") === "true");
  check("procedures: one lane, so no lane row", !doc.querySelector(".cr-sublanes"));
  check("procedures: the held list lives in Needs you now", !doc.querySelector(".cr-proc-need"));

  const items = Array.from(doc.querySelectorAll(".cr-proc-item"));
  check("procedures: every procedure in the report is listed", items.length === 3);
  const first = items[0];
  check("procedures: a procedure shows its rule in plain words", /joins that family's title/.test(txt(first)));
  check("procedures: a procedure shows who set it, when, and their words",
    /Sam, 2026-07-07: “all the APs should be an easy win, right\?”/.test(txt(first)));
  check("procedures: the tally says what it settled and held",
    /Applied by rule · settled 53 · held 0/.test(txt(first)));
  check("procedures: a guidance procedure says the classifier reads it",
    /Read by the classifier/.test(txt(items[1])));
  check("procedures: no examples control where there are no examples", !items[1].querySelector("button"));

  const see = first.querySelector("button.cr-proc-word");
  check("examples: the toggle is a button reporting aria-expanded=false",
    !!see && see.getAttribute("aria-expanded") === "false" && txt(see) === "See what it did");
  see.click();
  await sleep(30);
  const first2 = doc.querySelectorAll(".cr-proc-item")[0];
  const see2 = first2.querySelector("button.cr-proc-word");
  check("examples: opened, the toggle says so", see2.getAttribute("aria-expanded") === "true"
    && txt(see2) === "Hide what it did");
  check("examples: show the title and what it became",
    /AP Statistics Exam → AP Statistics/.test(txt(first2.querySelector(".cr-proc-sample"))));

  check("headings: each section is a labelled region",
    Array.from(doc.querySelectorAll("section.cr-proc-sec")).every((s) =>
      doc.getElementById(s.getAttribute("aria-labelledby"))));

  const css = (doc.getElementById("cr-proc-css") || {}).textContent || "";
  check("css: no raw hex in the lane's injected CSS", !/#[0-9a-fA-F]{3,8}\b/.test(css.replace(/#tab-credential-reference/g, "")));
  check("css: controls are underlined words, 24px tall, with a visible focus ring",
    /button\.cr-proc-word\{all:unset;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(css)
    && /button\.cr-proc-word:focus-visible\{outline:2px solid/.test(css));
  const all = Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("");
  check("css: views and lanes are underlined words with no fill, the one in use heavier",
    /button\.cr-view,[^{]*button\.cr-lane\{border:0;[^}]*background:none;[^}]*text-decoration:underline/.test(all)
    && /button\.cr-view\[aria-pressed=\\?"true\\?"\][^{]*\{[^}]*font-weight:700/.test(all));

  check("css: college badges paint no fill (dark read hunter on half-white at 1.15:1, S413)",
    /\.cr-badge-green\{background:none;/.test(all) && /\.cr-badge-orange\{background:none;/.test(all));
  check("css: a row's section headings are h3 in the body face",
    /\.cr-expanded-body h3:not\(\.cr-curation-h\)[^{]*\{[^}]*font-family:inherit/.test(all));

  cerLane(doc, /^Reference/).click();
  await sleep(30);
  check("reference: returns to the credentials grid", !!doc.querySelector(".cr-title-toggle"));
  cerLane(doc, /^Needs you/).click();
  await sleep(30);
  check("views: a view reopens on the lane last used in it",
    cerLane(doc, /^Unclassified/).getAttribute("aria-pressed") === "true");

  // A report that fails to load opens on Reference, leaves the grid working,
  // and says so on Held and Procedures.
  const bad = makeDom({ reportFails: true });
  await sleep(150);
  const bdoc = bad.window.document;
  check("failure: the tab opens on Reference", bdoc.querySelector("button.cr-view[aria-pressed=true]").id === "cr-view-ref");
  check("failure: the grid still paints", !!bdoc.querySelector(".cr-title-toggle"));
  check("failure: Procedures says the report is unavailable", /unavailable/.test(txt(cerLane(bdoc, /^Procedures/))));
  cerLane(bdoc, /^Procedures/).click();
  await sleep(30);
  check("failure: the view says the report did not load",
    /did not load/.test(txt(bdoc.getElementById("cr-table-wrap"))));
  cerLane(bdoc, /^Needs you/).click();  // opening a view asks for the report again
  await sleep(30);
  check("failure: Held says unavailable after the retry fails", /unavailable/.test(txt(cerLane(bdoc, /^Held/))));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0]));
  console.log(results.length + " checks, " + failed.length + " failed");
  process.exit(failed.length ? 1 : 0);
})();
