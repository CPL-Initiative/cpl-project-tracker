// Guidance memos on the GR register (gr_priorities.js).
//
// Sam, 2026-08-31: "Can we incorporate the memo in the GR Priorities tab...
// Perhaps wire it into the current memo generator there? So I can iterate?"
// The register rows are the SOURCE OF RECORD the guidance memos draw from
// (his item-7 ruling, 2026-08-30), so the memos live ON the register beside
// the rows they cite, and export through the same Word generator.
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * ⚠ THE SEQUENCING HOLD TRAVELS INSIDE THE FILE. The doctrine (2026-08-30)
//     is Title 5 first, BOG adoption, then guidance — and no machinery can
//     verify adoption, so the gate is the status field plus a banner that must
//     ride IN every export while the memo is unissued. A banner that only
//     exists on screen is not a banner once the file leaves by email (the same
//     lesson the register caveat already carries).
//
//   * ISSUING IS WHAT REMOVES THE DRAFT APPARATUS. The drafting annex
//     (authority classes, pre-issuance confirms) is internal by construction:
//     it renders only while unissued, so nobody has to remember to delete it.
//
//   * MEMO PROSE IS ALLOWLISTED, NEVER innerHTML'd. Bodies round-trip through
//     the same appendRich tokenizer as the register rows — a pasted <script>
//     renders as text on screen and is escaped in the export.
//
//   * A CITATION IS NEVER GUESSED. Section citations go through parseCites and
//     rejects come back to the typist (the register's own rule).
//
//   * A FAILED READ IS NOT AN EMPTY LIST. "Couldn't read the guidance memos"
//     and "No guidance memos drafted" are different states.
//
// Run from repo root: `npm test` (or `node tests/gr_memos.test.js`).
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

const memo = (o) => Object.assign({
  id: "m1", area_id: "cpl", memo_key: "A",
  title: "Credit for Prior Learning — What Existing Law and Regulation Already Provide",
  audience: "CIOs · CSSOs · Senate Presidents",
  from_line: "[Office of the Senior Advisor]",
  date_line: "[Issue upon BOG adoption]",
  status: "draft",
  hold_note: "Issues only after the Board of Governors adopts the pending Title 5 revisions.",
  purpose: "Colleges frequently pause CPL work because of requirements they believe exist.",
  sort: 1,
}, o || {});

const section = (o) => Object.assign({
  id: "s1", memo_id: "m1", n: 1,
  heading: "Every catalog course may be CPL-eligible",
  body: "First paragraph with <b>validated</b> prose.\n\nSecond paragraph parallels articulation.",
  citations: ["T5 §55002", "EC §78093.1"], citations_derived: false,
  revision_ns: [12, 4], authority: "existing regulation + enacted statute",
  confirm_note: null,
}, o || {});

(function () {
  const w = boot();
  const api = w.CPL_GR;
  check("(A) the seams are exposed",
    typeof api._memoDocBody === "function" && typeof api._renderMemoBlock === "function"
    && typeof api._memoSectionForm === "function" && typeof api._bodyParas === "function");

  // ── (B) paragraphs split on blank lines, and only blank lines ────────────
  {
    const p = api._bodyParas("One.\n\nTwo.\n \nThree with\na soft break.");
    check("(B) blank lines split paragraphs; a lone newline does not",
      p.length === 3 && /soft break/.test(p[2]), JSON.stringify(p));
  }

  // ── (C) the screen render ────────────────────────────────────────────────
  function renderWith(memos, secs, failedPatch) {
    api._state.areas = [{ id: "cpl", title: "CPL" }];
    api._state.areaId = "cpl";
    api._state.memos = memos;
    api._state.memoSections = secs;
    api._state.failed = Object.assign(
      { revisions: false, artifacts: false, cross: false, memos: false, memoSections: false },
      failedPatch || {});
    return api._renderMemoBlock(w.document.createElement("div"));
  }
  {
    const box = renderWith([memo()], [section()]);
    const txt = box.textContent;
    check("(C) ⭐ the hold banner renders while the memo is unissued",
      /held for Board of Governors adoption/.test(txt) && /pending Title 5 revisions/.test(txt));
    check("(C) the section heading and both paragraphs render",
      /1\. Every catalog course/.test(txt) && /First paragraph/.test(txt) && /Second paragraph/.test(txt));
    check("(C) inline <b> survives as an element, via the allowlist",
      [...box.querySelectorAll("b")].some((b) => b.textContent === "validated"));
    check("(C) ⭐ register-row references render as words, with the row numbers",
      /Draws on register rows #12, #4/.test(txt), txt.slice(0, 400));
    check("(C) citations render as chips through citeLabel",
      /Title 5 §55002/.test(txt) && /Ed\. Code §78093\.1/.test(txt));
    check("(C) the export control is available without a sign-in",
      [...box.querySelectorAll("button")].some((b) => /Export memo \(Word\)/.test(b.textContent)));
    check("(C) …but editing is not",
      ![...box.querySelectorAll("button")].some((b) => /Edit section|Edit memo|Add a section/.test(b.textContent)));
  }
  {
    const box = renderWith([memo({ status: "issued" })], [section()]);
    check("(C) ⭐ an issued memo carries no hold banner",
      !/held for Board of Governors adoption/.test(box.textContent));
  }
  {
    const hostile = section({ body: "<script>alert(1)</script>plain text stays" });
    const box = renderWith([memo()], [hostile]);
    check("(C) ⭐ a pasted <script> renders as text, never as an element",
      box.querySelectorAll("script").length === 0 && /plain text stays/.test(box.textContent));
  }
  {
    const box = renderWith([memo()], [section({ confirm_note: "Confirm with an ACCJC touchpoint." })]);
    check("(C) a pre-issuance confirm renders, worded as one",
      /Before issuance: Confirm with an ACCJC touchpoint\./.test(box.textContent));
  }

  // ── (D) ⚠ a failed read is not an empty list ─────────────────────────────
  {
    const box = renderWith([], [], { memos: true });
    check("(D) ⭐ a failed memo read says so",
      /Couldn't read the guidance memos/.test(box.textContent)
      && !/No guidance memos drafted/.test(box.textContent));
  }
  {
    const box = renderWith([], []);
    check("(D) an actually-empty list says that instead",
      /No guidance memos drafted/.test(box.textContent));
  }

  // ── (E) the Word export ──────────────────────────────────────────────────
  {
    const html = api._memoDocBody({ id: "cpl", title: "CPL" }, memo(), [section({ confirm_note: "ACCJC touchpoint." })]);
    check("(E) ⭐ the hold banner travels inside the unissued export",
      /Pre-decisional draft/.test(html) && /pending Title 5 revisions/.test(html));
    check("(E) ⭐ the drafting annex renders while unissued",
      /Drafting annex/.test(html) && /existing regulation \+ enacted statute/.test(html));
    check("(E) the pre-issuance confirm travels with its section",
      /Before issuance:/.test(html) && /ACCJC touchpoint\./.test(html));
    check("(E) TO/FROM/DATE/SUBJECT render from the stored lines",
      /<b>TO:<\/b>/.test(html) && /<b>FROM:<\/b>/.test(html)
      && /<b>DATE:<\/b>/.test(html) && /<b>SUBJECT:<\/b>/.test(html));
    check("(E) both body paragraphs export, with the inline <b> intact",
      /<b>validated<\/b>/.test(html) && /Second paragraph parallels articulation/.test(html));
    check("(E) register rows print as words in the file too",
      /Draws on register rows #12, #4/.test(html));
    check("(E) the export names DRAFT in the title while unissued",
      /DRAFT &mdash;/.test(html));
  }
  {
    const html = api._memoDocBody({ id: "cpl", title: "CPL" }, memo({ status: "issued" }),
      [section({ confirm_note: "ACCJC touchpoint." })]);
    check("(E) ⭐ issuing removes the banner, the annex, the confirms and the DRAFT mark",
      !/Pre-decisional draft/.test(html) && !/Drafting annex/.test(html)
      && !/Before issuance:/.test(html) && !/DRAFT &mdash;/.test(html));
  }
  {
    const html = api._memoDocBody({ id: "cpl", title: "CPL" },
      memo({ title: 'Hostile <script>alert(1)</script> title' }), [section({ heading: "H <img src=x>" })]);
    check("(E) ⭐ titles and headings are escaped in the export",
      html.indexOf("<script>") === -1 && html.indexOf("<img") === -1
      && /&lt;script&gt;/.test(html), html.slice(0, 200));
  }

  // ── (F) the section editor ───────────────────────────────────────────────
  {
    const sent = [];
    w.fetch = function (url, init) {
      sent.push({ url: String(url), method: (init && init.method) || "GET",
        body: JSON.parse((init && init.body) || "{}") });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "s1" }]) });
    };
    const s = section();
    const f = api._memoSectionForm("m1", 1, s, () => {});
    w.document.body.appendChild(f);
    const cites = [...f.querySelectorAll("input")].find((i) => /comma separated/.test(i.placeholder));
    cites.value = "53410";
    [...f.querySelectorAll("button")].find((b) => /Save section/.test(b.textContent)).click();
    check("(F) ⭐ an ambiguous bare citation is rejected, not guessed",
      sent.length === 0 && /No code band claims 53410/.test(f.textContent));

    cites.value = "T5 §55002, EC §78093.1";
    const rows = [...f.querySelectorAll("input")].find((i) => /register rows/.test(i.placeholder));
    rows.value = "12, 4";
    [...f.querySelectorAll("button")].find((b) => /Save section/.test(b.textContent)).click();
    check("(F) ⭐ a valid save PATCHes the section row with parsed citations and integer register rows",
      sent.length === 1 && sent[0].method === "PATCH"
      && /\/gr_memo_sections\?id=eq\.s1$/.test(sent[0].url)
      && JSON.stringify(sent[0].body.citations) === JSON.stringify(["T5 §55002", "EC §78093.1"])
      && JSON.stringify(sent[0].body.revision_ns) === JSON.stringify([12, 4])
      && typeof sent[0].body.updated_by === "string",
      JSON.stringify(sent[0] || {}));
  }
  {
    const sent = [];
    w.fetch = function (url, init) {
      sent.push({ url: String(url), method: (init && init.method) || "GET",
        body: JSON.parse((init && init.body) || "[]") });
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: "s9" }]) });
    };
    const f = api._memoSectionForm("m1", 8, null, () => {});
    w.document.body.appendChild(f);
    [...f.querySelectorAll("input")].find((i) => /heading/i.test(i.placeholder)).value = "New heading";
    [...f.querySelectorAll("button")].find((b) => /Add section/.test(b.textContent)).click();
    check("(F) adding POSTs a new row carrying the memo id and the next number",
      sent.length === 1 && sent[0].method === "POST" && /\/gr_memo_sections$/.test(sent[0].url)
      && sent[0].body[0].memo_id === "m1" && sent[0].body[0].n === 8
      && typeof sent[0].body[0].created_by === "string",
      JSON.stringify(sent[0] || {}));
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
