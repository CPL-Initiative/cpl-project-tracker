// The Catalog Commons List engine's suggestion slot and the visit's changed set (the List norms' first step, Fable's
// ranking: "an engine suggest slot (get, verb, accept, dismiss for the visit) and the changed tracker; Exhibits
// unchanged"; docs/kb-notes/reference-catalog-commons-list-norms.md). The engine alone, on a spec with four rows.
// Guards:
//   (1) the line shows under the filter id "suggested" (which keeps only rows with one) and not under All, unless the
//       spec says always; it reads "Suggested: <text> (<why>)", the spec's verb and Dismiss, the verb named by label();
//   (2) a rejected accept says it did not reach the reference and the suggestion stays; an accept that resolves ok:false
//       puts its own words in the status line and the suggestion stays;
//   (3) an accept that saves sets the suggestion aside, marks the row and the keys it names changed, puts its words in
//       the status line, and hands focus to the next row's title when the filter lets the row go;
//   (4) a second press while a write is out does not write twice;
//   (5) Dismiss writes nothing and sets aside every row sharing the spec's key(r);
//   (6) the changed set: "changed this visit" under the title, the filter id "changed", api.markChanged with keys or rows;
//   (7) a spec that sets neither (the Exhibits List, S542) keeps its own filters: the engine draws no line and leaves the
//       ids "suggested" and "changed" to the spec's filterPass.
// Run from repo root: `npm test` (or `node tests/commons_list_suggest.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const LIST_SRC = fs.readFileSync("commons_list.js", "utf8");

const ROWS = [
  { ut: "Alpha", grp: "one" }, { ut: "Bravo", grp: "two" }, { ut: "Charlie", grp: "two" }, { ut: "Delta", grp: "three" }
];
const FILTERS = [["", "All"], ["suggested", "Suggested"], ["changed", "Changed this visit"]];

function boot(over) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="mount"></div></body></html>', { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window, d = w.document, calls = [];
  w.eval(LIST_SRC);
  const state = {}, rows = ROWS.map((r) => Object.assign({}, r));
  let api = null;
  const pending = {};
  function render() { const m = d.getElementById("mount"); m.innerHTML = ""; api.render(m); }
  const spec = Object.assign({
    state: () => state, rows: () => rows, render: render,
    cols: () => [{ h: "Name", w: 30, v: (r) => r.ut }, { h: "Group", w: 20, v: (r) => r.grp }],
    filters: FILTERS,
    changed: true,
    suggest: {
      get: (r) => (r.ut === "Bravo" || r.ut === "Charlie") && !r.done ? { text: "fold into Delta", why: "spelling twins" } : null,
      verb: "Confirm",
      label: (r) => "Confirm the fold of " + r.ut,
      accept: (r) => {
        calls.push(r.ut);
        if (r.ut === "Charlie" && over && over.charlie === "reject") return Promise.reject(new Error("HTTP 500"));
        if (r.ut === "Charlie" && over && over.charlie === "refuse") return Promise.resolve({ ok: false, words: "Sign in on the Reference view to confirm." });
        if (over && over.hold) return new Promise((res) => { pending[r.ut] = () => { r.done = true; res({ ok: true, words: "Saved " + r.ut + "." }); }; });
        r.done = true;
        return Promise.resolve({ ok: true, words: "Saved: " + r.ut + " folds into Delta.", keys: ["Delta"] });
      }
    }
  }, (over && over.spec) || {});
  api = w.CPL_COMMONS_LIST.create(spec);
  render();
  return { w, d, api, calls, state, pending };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".cl-table tbody tr:not(.cl-editrow):not(.cl-band)")); }
function titleOf(r) { return txt(r.querySelector(".cl-title .cl-open")); }
function titles(d) { return rows(d).map(titleOf).join("|"); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t); }
function sgOf(d, t) { const r = rows(d).find((x) => titleOf(x) === t); return r && r.querySelector(".cl-sg"); }
function sgWord(d, t, w) { return Array.from(sgOf(d, t).querySelectorAll("button")).find((b) => txt(b) === w); }
function note(d) { return txt(d.getElementById("cl-cellnote")); }

(async function () {
  // (1) where the line shows
  const a = boot();
  check("(1) under All no suggestion line shows", titles(a.d) === "Alpha|Bravo|Charlie|Delta" && !a.d.querySelector(".cl-sg"));
  words(a.d, "Suggested").click(); await settle();
  check("(1) ⭐ the filter id suggested keeps only the rows with one", titles(a.d) === "Bravo|Charlie", titles(a.d));
  check("(1) the line reads the suggestion, its reason, the verb and Dismiss",
    txt(sgOf(a.d, "Bravo")) === "Suggested: fold into Delta (spelling twins) Confirm Dismiss", txt(sgOf(a.d, "Bravo")));
  check("(1) the verb is named by the spec's label", sgWord(a.d, "Bravo", "Confirm").getAttribute("aria-label") === "Confirm the fold of Bravo");
  const al = boot({ spec: { suggest: { get: (r) => r.ut === "Alpha" ? { text: "x" } : null, accept: () => Promise.resolve({ ok: true }), always: true } } });
  check("(1) always: the line shows under All, and a suggestion with no reason has no parentheses",
    txt(al.d.querySelector(".cl-sg")) === "Suggested: x Accept Dismiss", txt(al.d.querySelector(".cl-sg")));

  // (2) a failed write leaves the suggestion where it was
  const b = boot({ charlie: "reject" });
  words(b.d, "Suggested").click(); await settle();
  sgWord(b.d, "Charlie", "Confirm").click(); await settle();
  check("(2) ⭐ a rejected accept says it did not reach the reference, and the suggestion stays",
    /did not reach the reference \(HTTP 500\); nothing changed/.test(note(b.d)) && !!sgOf(b.d, "Charlie") && b.state.changed.length === 0, note(b.d));
  const b2 = boot({ charlie: "refuse" });
  words(b2.d, "Suggested").click(); await settle();
  sgWord(b2.d, "Charlie", "Confirm").click(); await settle();
  check("(2) ok:false puts the spec's words in the status line, and the suggestion stays",
    note(b2.d) === "Sign in on the Reference view to confirm." && !!sgOf(b2.d, "Charlie"), note(b2.d));

  // (3) a saved accept
  const c = boot();
  words(c.d, "Suggested").click(); await settle();
  sgWord(c.d, "Bravo", "Confirm").click(); await settle();
  check("(3) ⭐ a saved accept sets the suggestion aside and says what saved", titles(c.d) === "Charlie" && note(c.d) === "Saved: Bravo folds into Delta.", titles(c.d) + " / " + note(c.d));
  check("(3) the row and the keys the accept names join the changed set", c.state.changed.join("|") === "Bravo|Delta" && c.state.sgDone.Bravo === "accepted");
  check("(3) focus goes to the next row's title when the filter lets the row go", txt(c.d.activeElement) === "Charlie"
    && c.d.activeElement.classList.contains("cl-open"), c.d.activeElement && c.d.activeElement.outerHTML);

  // (4) busy
  const h = boot({ hold: true });
  words(h.d, "Suggested").click(); await settle();
  sgWord(h.d, "Bravo", "Confirm").click(); await settle();
  check("(4) a write in flight reads Saving…", txt(sgOf(h.d, "Bravo")).indexOf("Saving…") !== -1, txt(sgOf(h.d, "Bravo")));
  sgWord(h.d, "Bravo", "Saving…").click(); await settle();
  check("(4) ⭐ a second press while the write is out does not write twice", h.calls.join("|") === "Bravo", h.calls.join("|"));
  h.pending.Bravo(); await settle();
  check("(4) the write landing sets the suggestion aside", titles(h.d) === "Charlie");

  // (5) Dismiss, and a shared key
  const k = boot({ spec: { suggest: { get: (r) => r.grp === "two" ? { text: "one group" } : null, key: (r) => r.grp, accept: () => Promise.resolve({ ok: true }) } } });
  words(k.d, "Suggested").click(); await settle();
  sgWord(k.d, "Bravo", "Dismiss").click(); await settle();
  check("(5) ⭐ Dismiss writes nothing and sets aside every row sharing the key", k.calls.length === 0 && titles(k.d) === ""
    && /Dismissed for this visit: the suggestion for Bravo/.test(note(k.d)), titles(k.d) + " / " + note(k.d));
  words(k.d, "All").click(); await settle();
  check("(5) a dismissed row stays in the List under All", titles(k.d) === "Alpha|Bravo|Charlie|Delta");

  // (6) the changed set
  const m = boot();
  m.api.markChanged(["Alpha"]); m.api.markChanged(ROWS[3]); m.api.markChanged("Alpha");
  words(m.d, "Changed this visit").click(); await settle();
  check("(6) ⭐ markChanged takes keys or rows, once each, and Changed this visit keeps them", titles(m.d) === "Alpha|Delta" && m.state.changed.join("|") === "Alpha|Delta", titles(m.d));
  check("(6) each reads changed this visit under its title", rows(m.d).every((r) => /changed this visit/.test(txt(r.querySelector(".cl-title")))));

  // (7) a spec with neither: the Exhibits List's shape
  const e = boot({ spec: { changed: undefined, suggest: undefined, titleSubs: () => [], filterPass: () => true } });
  e.state.changed.push("Alpha"); e.state.sgDone = { Bravo: "dismissed" };
  words(e.d, "Suggested").click(); await settle();
  check("(7) ⭐ with no suggest slot the engine leaves the id suggested to the spec", titles(e.d) === "Alpha|Bravo|Charlie|Delta" && !e.d.querySelector(".cl-sg"));
  words(e.d, "Changed this visit").click(); await settle();
  check("(7) with changed unset the engine leaves the id changed to the spec and draws no line", titles(e.d) === "Alpha|Bravo|Charlie|Delta"
    && !/changed this visit/.test(txt(e.d.querySelector(".cl-table tbody"))));

  let pass = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "\n     " + why)); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
