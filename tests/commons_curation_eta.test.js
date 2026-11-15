// The Commons Curation ETA (S661, #3360): commons_curation_eta.js at the top of the CPL Commons tab, and the top
// cards' explainers folded by default.
//
// WHAT THIS GUARDS:
//   (1) ⭐ the model: a reference's pace is the net fall of its remaining work over the window (new work counts
//       against it), people's share is what they confirmed; a reference whose remaining work does not fall is not
//       dated, and the ETA then reads "Not dated yet" rather than a date;
//   (2) ⭐ the levers: a procedure chip settles its share of its no-procedure block on its start day; a people chip
//       multiplies people's pace; a moved date says it is a projection;
//   (3) the band draws from the committed files, its controls that move the date are small chips, its table scopes
//       every header cell, and the builder records the daily series it reads;
//   (4) ⭐ Sam's ask: the band tops the CPL Commons tab, and the top cards' explainers are folded by default and open
//       with one word; static: tokens only, no storage, no write, no glyph.
// Run from repo root: `npm test` (or `node tests/commons_curation_eta.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(e) { return (e && e.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("commons_curation_eta.js", "utf8");
const REAL = JSON.parse(fs.readFileSync("kb/status/commons.json", "utf8"));
const HIST = JSON.parse(fs.readFileSync("kb/status/commons_history.json", "utf8"));

/* A fixture: exhibits settle 70 a week net with 70 by people; courses fall 0 net; CR falls 0, with a 1,000 block. */
function fixture() {
  const pairs = {};
  for (let d = 1; d <= 15; d++) {
    const day = "2026-11-" + String(d).padStart(2, "0");
    pairs[day] = { exhibit: [1000 + 10 * d, 2000, 500 + 10 * d], course: [5000 + 10 * d, 27000 + 10 * d, 900], cr: [400, 2000, 90], subjects: [147, 147, 133] };
  }
  const status = { written_at: "2026-11-15T07:00:00Z",
    rows: [{ key: "exhibit", pair: [{ n: 1150, of: 2000 }, { n: 650 }] }, { key: "course", pair: [{ n: 5150, of: 27150 }, { n: 900 }] },
      { key: "cr", pair: [{ n: 400, of: 2000 }, { n: 90 }] }, { key: "subjects", pair: [{ n: 147, of: 147 }, { n: 133 }] }],
    queue: { reasons: [{ key: "no_procedure", items: [{ ref: "cr", n: 1600, words: "wordings no rule places", owner: "a curator", open: "#cr-reference/open" },
      { ref: "course", n: 22000, words: "cards a seed has not touched", owner: "the Common Subjects reference", open: "#coci-lookup/list/seedless" }] }] } };
  return { status, history: { schema: 1, days: {}, pairs } };
}

const D = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: "https://example.org/index.html#commons", runScripts: "dangerously" });
const w = D.window;
w.eval(SRC);
const C = w.CPL_COMMONS_CURATION_ETA;
const day = (n) => n == null ? null : new Date(n * 86400000).toISOString().slice(0, 10);

const F = fixture(), B = C.base(F.status, F.history);
const ex = B.refs.filter((r) => r.key === "exhibit")[0], cr = B.refs.filter((r) => r.key === "cr")[0];
check("(1) ⭐ a reference's pace is the net fall of its remaining work a day; people's share is what they confirmed",
  ex.remaining === 850 && Math.abs(ex.pace.soonest.net - 10) < 1e-9 && Math.abs(ex.pace.soonest.people - 10) < 1e-9 && ex.pace.soonest.days === 7);
const S0 = C.fresh(), C0 = C.curationDate(B, S0);
check("(1) the exhibits finish on the day their remaining work runs out (850 at 10 a day: 85 days)", day(C.finish(B, ex, S0).day) === "2027-02-08");
check("(1) ⭐ a reference whose remaining work does not fall is not dated, and the ETA reads Not dated yet", C.finish(B, cr, S0).day == null && C0.day == null && C0.undated.length === 2);
check("(1) a settled reference reads complete", C.finish(B, B.refs.filter((r) => r.key === "subjects")[0], S0).done);

const S1 = C.fresh(); S1.on["cr|#cr-reference/open"] = true; S1.share["cr|#cr-reference/open"] = 1; S1.start["cr|#cr-reference/open"] = 30;
check("(2) ⭐ a procedure that settles its whole block on its start day dates the reference that day", day(C.finish(B, cr, S1).day) === "2026-12-15" && C.finish(B, cr, S1).moved);
const S2 = C.fresh(); S2.people.curator = true;
check("(2) a second curator doubles people's pace: the exhibits finish in half the time", day(C.finish(B, ex, S2).day) === "2026-12-28");
const S3 = C.fresh(); S3.on["cr|#cr-reference/open"] = true;
check("(2) a procedure that settles 70% leaves the rest with people, so a reference people do not move stays undated", C.finish(B, cr, S3).day == null);

// (3) the band from the committed files.
const root = w.document.getElementById("root");
C.ST.history = HIST;
root.appendChild(C.band(REAL));
const band = root.querySelector("[data-cur-band]");
check("(3) the band draws from the committed files: its heading, a date or Not dated yet, and a row per reference",
  txt(band.querySelector("#cur-h")) === "Commons Curation ETA" && !!band.querySelector("[data-cur-date]") && band.querySelectorAll("tbody tr[data-ref]").length === 4);
check("(3) every no-procedure block in the queue is a procedure chip, and the people chips follow",
  band.querySelectorAll('[aria-label="Procedures"] .cur-pill').length === REAL.queue.reasons.filter((g) => g.key === "no_procedure")[0].items.length &&
  band.querySelectorAll('[aria-label="People"] .cur-pill').length === 2);
check("(3) the controls that move the date are small chips; Assumptions is a word", band.querySelector('[data-cur="mode"]').classList.contains("cur-pill") &&
  !band.querySelector('[data-cur="assumptions"]').classList.contains("cur-pill"));
check("(3) every header cell is scoped", [...band.querySelectorAll("th")].every((th) => th.getAttribute("scope")));
const firstProc = band.querySelector('[aria-label="Procedures"] .cur-pill');
firstProc.click();
const b2 = root.querySelector("[data-cur-band]");
check("(3) a procedure chip turned on is pressed and opens its share and start", b2.querySelector('[aria-label="Procedures"] .cur-pill').getAttribute("aria-pressed") === "true" &&
  !!b2.querySelector("[data-cur-share]") && !!b2.querySelector("[data-cur-start]"));
check("(3) ⭐ the builder records each reference's daily settled count, universe and person count, and the series reaches back to October 18",
  /def pair_readings/.test(fs.readFileSync("kb/_build_commons_status.py", "utf8")) && HIST.pairs && HIST.pairs["2026-10-18"] && Array.isArray(HIST.pairs["2026-10-18"].exhibit));

// (4) Sam's ask on the tab.
const CJS = fs.readFileSync("commons.js", "utf8");
check("(4) ⭐ the CPL Commons tab puts the Curation ETA right under its header", /var curHost = el\("div", \{ id: "cmn-cur" \}\);\s*wrap\.appendChild\(curHost\);/.test(CJS) &&
  CJS.indexOf('id: "cmn-cur"') < CJS.indexOf("var batch = batchSection("));
const T = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: "https://example.org/", runScripts: "dangerously" });
const m = /function explainer\(id, text\) \{[\s\S]*?\n  \}\n/.exec(CJS);
T.window.eval("function el(t,a,k){var e=document.createElement(t);for(var x in a){if(a[x]==null)continue;if(x==='text')e.textContent=a[x];else if(x==='cls')e.className=a[x];else e.setAttribute(x,a[x]);}(k||[]).forEach(function(c){if(c!=null)e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}\n" + m[0] + "\nwindow.X = explainer;");
const xb = T.window.X("x1", "What this card means."); T.window.document.body.appendChild(xb);
const xp = xb.querySelector("#x1"), xw = xb.querySelector("button");
const folded = xp.hasAttribute("hidden") && xw.getAttribute("aria-expanded") === "false";
xw.click();
check("(4) ⭐ a top card's explainer is folded by default and one word opens it (Sam, S661)", folded && !xp.hasAttribute("hidden") && xw.getAttribute("aria-expanded") === "true" && txt(xw) === "About this");
check("(4) Waiting on a person and How far to trust the procedures fold their explainers", /explainer\("cmn-queue-x"/.test(CJS) && /explainer\("cmn-conf-x"/.test(CJS));
check("(4) tokens only: no raw hex in the module", !/#[0-9a-fA-F]{3,6}\b/.test(C.CSS));
check("(4) stores nothing and writes nothing", !/localStorage|sessionStorage|method:\s*["'](POST|PATCH|PUT|DELETE)/.test(SRC));
check("(4) no glyph stands in for a word", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(SRC));
check("(4) the module is on the Pages allowlist", /^publish commons_curation_eta\.js$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8")));

const fails = results.filter((r) => !r[1]);
results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
console.log("\n" + (results.length - fails.length) + "/" + results.length + " checks passed");
process.exit(fails.length ? 1 : 0);
