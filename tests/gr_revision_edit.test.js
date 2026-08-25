// Editing a regulation priority, and re-analyzing it (gr_priorities.js).
//
// Sam, 2026-08-25: "be able to edit the drop down info on each regulation
// priority and run a reanalysis on the items edited on demand after edits are
// in." He needs a draft of proposed reg changes for the Chancellor's Office this
// week, so both halves serve one thing: getting a row right before it leaves the
// building.
//
// ⭐ THE RE-ANALYSIS IS DETERMINISTIC, AND THAT IS THE DESIGN, NOT A SHORTCUT.
// Nothing in this repo has ever computed anything on these rows — `blast_rank`
// was authored during the Sky168 rebuild, and "reanalysis" had no referent. What
// a register needs before it reaches the CO is not new prose but the checks a
// lawyer makes first, and an answer you can re-derive is one you can defend.
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * A CITATION IS NEVER GUESSED. Everything typed goes through parseCites, and
//     a bare 53xxx is ambiguous between Gov. Code and Title 5 — the divergence
//     this file's own comment records. It comes back to the typist.
//
//   * ⚠ A VERIFICATION CANNOT OUTLIVE THE LIST IT DESCRIBES. "Mark citations
//     verified" means "I checked THESE against the source". Change them and it
//     stops saying that. Same defect as cpl_memory's status cycle leaving
//     verified_at on a stale row (#1331), one table over.
//
//   * BARE NUMBERS IN PROSE ARE NOT HARVESTED. A year or a course number would
//     be swept in, and a fabricated citation with a confident face on it is the
//     one error this register cannot ship to the Chancellor's Office.
//
//   * CROSS-AREA CLASHES SURFACE. Two areas proposing changes to one section is
//     the conflict this register exists to catch before rulemaking.
//
//   * IT PROPOSES AND NEVER APPLIES. A finding is a sentence; adding a citation
//     takes a press.
//
//   * NOTHING CLEAN READS AS A CLEAN BILL OF HEALTH. The empty state says what
//     was checked — this row against itself, not against the primary source.
//
// Run from repo root: `npm test` (or `node tests/gr_revision_edit.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const src = fs.readFileSync("gr_priorities.js", "utf8");

function boot() {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="tab-gr-priorities"></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  w.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
  w.eval(src);
  return w;
}

const rev = (o) => Object.assign({
  id: "r1", area_id: "cpl", n: 1, title: "Authorize CPL awards for course, GE area, and elective",
  grp: "What CPL can count for", summary: "Make explicit that a course awarded through CPL carries the same GE-area value.",
  consideration: "Bonus statutory tailwind.", instrument: "GUIDANCE", pathway: ["g", "y"],
  citations: ["T5 §55050"], ed_first: "No", status: "proposed",
  blast_rank: 4, blast_why: "Determines the value of every award.",
  citations_derived: true, sensitivity: "restricted",
}, o || {});

(function () {
  const w = boot();
  const api = w.CPL_GR;
  check("(A) the seams are exposed", typeof api._analyzeRevision === "function"
    && typeof api._renderAnalysis === "function" && typeof api._editRevisionForm === "function");

  // ── (B) citations in the text vs the list ────────────────────────────────
  {
    const r = rev({ summary: "Title 5 §55050 already contemplates this, and Ed. Code §66025.71 mandates GE credit." });
    const a = api._analyzeRevision(r, [r], { cpl: "CPL" });
    check("(B) ⭐ a section cited in the text but missing from the list is reported",
      a.missing.indexOf("EC §66025.71") >= 0, JSON.stringify(a.missing));
    check("(B) one already listed is not reported as missing", a.missing.indexOf("T5 §55050") === -1);
  }
  {
    const r = rev({ summary: "No sections named here at all.", consideration: "", blast_why: "", title: "x" });
    const a = api._analyzeRevision(r, [r], {});
    check("(B) ⭐ a listed section the text no longer cites is reported",
      a.unsupported.indexOf("T5 §55050") >= 0, JSON.stringify(a.unsupported));
  }

  // ── (C) ⚠ bare numbers are NOT harvested ─────────────────────────────────
  {
    const r = rev({ citations: [], summary: "In 2026 the board reviewed course 55050 and item 66025 at length." });
    const a = api._analyzeRevision(r, [r], {});
    check("(C) ⭐ a number with no § is never turned into a citation",
      a.missing.length === 0 && a.ambiguous.length === 0,
      JSON.stringify({ missing: a.missing, ambiguous: a.ambiguous }));
  }
  {
    const r = rev({ citations: [], summary: "See §53410 for the applicable rule." });
    const a = api._analyzeRevision(r, [r], {});
    check("(C) ⭐ an AMBIGUOUS section (Gov. Code §53xxx vs Title 5 §53410) is flagged, not filed",
      a.ambiguous.length === 1 && a.missing.length === 0, JSON.stringify(a));
  }

  // ── (D) cross-area clash ─────────────────────────────────────────────────
  {
    const mine = rev({ citations: ["T5 §55050"] });
    const other = rev({ id: "r2", area_id: "dual-enrollment", citations: ["T5 §55050"] });
    const a = api._analyzeRevision(mine, [mine, other], { "dual-enrollment": "Dual Enrollment" });
    check("(D) ⭐ a section another AREA also cites is surfaced, by that area's name",
      a.shared.length === 1 && a.shared[0].areas.indexOf("Dual Enrollment") >= 0, JSON.stringify(a.shared));
    const solo = api._analyzeRevision(mine, [mine, rev({ id: "r3", area_id: "cpl" })], {});
    check("(D) …and a section cited twice WITHIN one area is not a clash",
      solo.shared.length === 0, JSON.stringify(solo.shared));
  }

  // ── (E) the stale verification ───────────────────────────────────────────
  {
    const r = rev({ verified_at: "2026-08-20T00:00:00Z", _citesChangedSinceVerify: true });
    check("(E) ⭐ a stamp standing over changed citations is reported",
      api._analyzeRevision(r, [r], {}).staleVerification === true);
    const ok = rev({ verified_at: "2026-08-20T00:00:00Z" });
    check("(E) …and an unchanged one is not",
      api._analyzeRevision(ok, [ok], {}).staleVerification === false);
  }

  // ── (F) what the reader is told ──────────────────────────────────────────
  {
    const r = rev({ summary: "Ed. Code §66025.71 mandates GE credit." });
    const host = w.document.createElement("div");
    const adds = [];
    api._renderAnalysis(host, r, api._analyzeRevision(r, [r], {}), (c) => adds.push(c));
    const txt = host.textContent;
    check("(F) the finding names the section in words, not a code", /Ed\. Code §66025\.71/.test(txt), txt.slice(0, 140));
    check("(F) ⭐ each kind is a WORD, so color is never the only signal", /CHECK/.test(txt));
    const btn = [...host.querySelectorAll("button")].find((b) => /Add it/.test(b.textContent));
    check("(F) ⭐ it PROPOSES — the add is a button, not something already done",
      !!btn && adds.length === 0);
    if (btn) { btn.click(); check("(F) …and pressing it is what applies", adds.length === 1 && adds[0] === "EC §66025.71"); }
  }
  {
    // A clean row must not read as a clean bill of health.
    const r = rev({ citations: [], summary: "Nothing cited.", consideration: "", blast_why: "", title: "x",
                    citations_derived: false });
    const host = w.document.createElement("div");
    api._renderAnalysis(host, r, api._analyzeRevision(r, [r], {}), () => {});
    check("(F) ⭐ a clean result says what was checked, and what was NOT",
      /this row against itself/i.test(host.textContent) && /not a reading of the primary source/i.test(host.textContent),
      host.textContent.slice(-160));
  }

  // ── (G) the editor ───────────────────────────────────────────────────────
  {
    const r = rev({ verified_at: "2026-08-20T00:00:00Z", verified_by: "slee@cccco.edu" });
    const host = w.document.createElement("div");
    const sent = [];
    w.CPL_GR._state.revisions = [r];
    // Intercept the write at the module's own PATCH seam.
    const realFetch = w.fetch;
    w.fetch = function (url, init) {
      sent.push({ url: String(url), body: JSON.parse((init && init.body) || "{}") });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "r1" }]) });
    };
    api._editRevisionForm(r, host, () => {});
    const ta = [...host.querySelectorAll("textarea")];
    const inputs = [...host.querySelectorAll("input[type=text]")];
    check("(G) the form carries the row's current wording",
      ta.some((t) => /same GE-area value/.test(t.value)) && inputs.some((i) => /Authorize CPL awards/.test(i.value)));
    check("(G) the legal pathway is a SET of checkboxes, not a single choice",
      host.querySelectorAll(".gx-pathopt input[type=checkbox]").length === 3 &&
      [...host.querySelectorAll(".gx-pathopt input")].filter((c) => c.checked).length === 2);
    check("(G) ⚠ sensitivity is NOT in the form (it has its own control)",
      !/Seen by/.test(host.textContent), "found a second sensitivity control");

    // ⭐ a citation no band claims comes BACK
    const citeIn = inputs.find((i) => /55050/.test(i.value));
    citeIn.value = "T5 §55050, 53410";
    const save = [...host.querySelectorAll("button")].find((b) => /Save changes/.test(b.textContent));
    save.click();
    check("(G) ⭐ an ambiguous citation is refused and explained, and nothing is written",
      sent.length === 0 && /ambiguous/i.test(host.querySelector(".gx-err").textContent),
      host.querySelector(".gx-err").textContent);

    // ⭐ a real change clears a verification the new list no longer describes
    citeIn.value = "T5 §55050, EC §66025.71";
    save.click();
    check("(G) ⭐ a valid edit writes", sent.length === 1, JSON.stringify(sent.map((x) => x.url)));
    if (sent.length) {
      const b = sent[0].body;
      check("(G) ⭐ …and CLEARS the verification, because the list it described has changed",
        b.verified_at === null && b.verified_by === null, JSON.stringify(b));
      check("(G) the typed codes are stored canonically",
        JSON.stringify(b.citations) === JSON.stringify(["T5 §55050", "EC §66025.71"]), JSON.stringify(b.citations));
      check("(G) ⭐ typed codes are NOT marked as machine-derived", b.citations_derived === false);
      check("(G) the write names the person and the time", !!b.updated_by && !!b.updated_at);
    }
    w.fetch = realFetch;
  }
  {
    // An edit that leaves the citations alone must not disturb the stamp.
    const r = rev({ verified_at: "2026-08-20T00:00:00Z", verified_by: "slee@cccco.edu" });
    const host = w.document.createElement("div");
    const sent = [];
    w.fetch = function (url, init) { sent.push(JSON.parse((init && init.body) || "{}")); 
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "r1" }]) }); };
    api._editRevisionForm(r, host, () => {});
    const ta = [...host.querySelectorAll("textarea")][0];
    ta.value = "Reworded, same citations.";
    [...host.querySelectorAll("button")].find((b) => /Save changes/.test(b.textContent)).click();
    check("(G) ⭐ an edit that does NOT touch the citations leaves the verification standing",
      sent.length === 1 && !("verified_at" in sent[0]), JSON.stringify(sent[0] || {}));
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
