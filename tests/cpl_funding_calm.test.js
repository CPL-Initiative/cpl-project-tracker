// CPL Implementation Funding — the calm pass (Sam, 2026-09-02).
//
// "Get rid of any cheesy glyphs (per our rules) and preserve all needed
// functionality while eliminating any visual noise possible. I want folks to
// feel calm when they open this model." And: "It would be nice to be able to
// edit while in curate, any of the text sections."
//
// What this guards, and why each half needs a guard rather than a look:
//
//   1. NO GLYPH ON ANY RENDERED SURFACE. The presentation doctrine says every
//      control is a word and the default is no mark. A glyph creeps back one
//      button at a time, in a string nobody re-reads, on a sub-view nobody
//      screenshots — so the sweep runs over the curate view, the public view,
//      the $50K view and the Report view, over the whole mount, and names the
//      character it found. The ONE exception is the ghosted sort mark, which
//      is aria-hidden and sits beside an aria-sort that carries the state.
//   2. THE FOLDS AND THE ROW TOGGLE ARE WORDS. The chevron became Show/Hide;
//      the row caret became the institution's name as a real button. Both are
//      the kind of change that looks fine in a screenshot after a regression
//      (a chevron is small) — so the DOM shape is pinned.
//   3. THE CHROME IS CALM. No red Reset, one filled control on the sign-in
//      line (Publish), a ghosted Draft word rather than a gold pill, no
//      subtitle restating the introduction in retired vocabulary.
//   4. EDITABLE PROSE, END TO END. Prose renders as prose for everyone; only a
//      signed-in reviewer sees Edit; Save reaches the shared layer and the
//      page; Restore drops the override; the public view renders the override
//      with no control; typed markup is escaped; a re-render mid-edit keeps
//      the draft. A control surface can look like a display (S219's lesson) —
//      and a display can also quietly stop being editable, which is why the
//      whole loop is exercised rather than the presence of a button.
//   5. VOCABULARY. "pool", "money", "apportion" and the advance concept stay
//      off the rendered text (identifiers and the model's name are not text).
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_calm.test.js`).
const fs = require("fs");
const path = require("path");
const { check, freshDom, boot, click, finish } = require("./lib/cpl_funding_harness.js");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function () { return { apikey: "anon", Authorization: "Bearer header.payload.sig" }; }
  };
}

// Every character class the glyph rule bans from rendered text: emoji, the
// dingbats and misc-symbol blocks, arrows, box/geometric marks, the fullwidth
// plus, enclosed digits, and the common single marks that pass for "small".
const GLYPH = /[←-⇿⌀-⏿①-⓿■-◿☀-➿⤀-⥿⬀-⯿️＋\u{1F000}-\u{1FAFF}]/u;
// The sort mark is the one glyph that earns its place; it is checked separately.
function glyphHits(html) {
  const stripped = html.replace(/<span class="arr" aria-hidden="true">[▲▼]<\/span>/g, "");
  const out = [];
  let m;
  const re = new RegExp(GLYPH.source, "gu");
  while ((m = re.exec(stripped)) !== null) {
    out.push(m[0] + " @" + stripped.slice(Math.max(0, m.index - 40), m.index + 12).replace(/\s+/g, " "));
    if (out.length > 6) break;
  }
  return out;
}
function mountHtml(doc) { return doc.getElementById("cplFundingMount").innerHTML; }
// ⚠️ A guard that dies cannot report (S219's lesson): a control a regression
// removed must fail BY NAME, not crash the run before finish() prints. Every
// click on such a control goes through here.
function clickSel(window, doc, sel, what) {
  const el = doc.querySelector(sel);
  check("control present: " + (what || sel), !!el);
  if (el) click(window, el);
  return !!el;
}
function setVal(doc, sel, v) { const el = doc.querySelector(sel); if (el) el.value = v; return !!el; }
function mountText(doc) { return doc.getElementById("cplFundingMount").textContent; }
// ⚠️ textContent concatenates adjacent elements with NO separator ("…the
// institution poolRemove"), so a \b-anchored word search can miss a banned
// word that sits at the end of an element. Words are read off the markup with
// a space where every tag was, then the entities a word could touch decoded.
function mountWords(doc) {
  return doc.getElementById("cplFundingMount").innerHTML.replace(/<[^>]*>/g, " ")
    .replace(/&(mdash|ndash|middot|nbsp|rsquo|lsquo|rdquo|ldquo|hellip|sect|times|divide|asymp|ge|le|bull|minus|plus);/g, " ")
    .replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
}

// ── 1. no glyph on any rendered surface ─────────────────────────────────────
{
  // Curate view, signed in, with a dirty scenario AND a local-only overlay so
  // the sign-in line renders every branch it has (the publish prompt included).
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ pool: { admin_cost: 900000 } });
  T._setScenario({ pool: { scaling_projects_tech: 9000000 } });
  T.render();
  // open one row so the drill-in (opt-in lane, detail table) renders too
  const row = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  if (row) click(window, row.querySelector(".cplfund-caret"));
  let hits = glyphHits(mountHtml(doc));
  check("curate view (signed in, dirty, local-only overlay, one row open): no glyph in the mount — " +
    (hits.length ? hits.join(" | ") : "clean"), hits.length === 0);
  hits = glyphHits(doc.getElementById("cplFundTitleLink").innerHTML + (doc.getElementById("cplFundingDraftChip") || {}).outerHTML);
  check("the title row (explainer link + Draft word) carries no glyph", hits.length === 0);
  check("the sign-in line reads as words: Signed in as … / Changes save for everyone / holds changes nobody else can see",
    /Signed in as co@cccco\.edu/.test(mountText(doc)) && /Changes save for everyone/.test(mountText(doc)) &&
    /holds changes nobody else can see/.test(mountText(doc)));

  // the $50K view
  T._setSubview("grants");
  hits = glyphHits(mountHtml(doc));
  check("the 2025–2026 $50K view: no glyph — outcome marks are the words met / partial / not yet / n/a / pending — " +
    (hits.length ? hits.join(" | ") : "clean"), hits.length === 0);
  check("…and the legend explains the words, not marks",
    /Legend:\s*met/.test(mountText(doc)) && /pending\s*data feed not loaded/.test(mountText(doc)));

  // the Report view
  T._setSubview("report");
  hits = glyphHits(mountHtml(doc));
  check("the Report view: no glyph in the toolbar (Regenerate · Copy text · Save as PDF · Download as Word) — " +
    (hits.length ? hits.join(" | ") : "clean"), hits.length === 0);
  check("…and the Report sub-tab is the word Report",
    Array.from(doc.querySelectorAll('[data-subview="report"]')).every((b) => b.textContent.trim() === "Report"));
  T._setSubview("model");
}
{
  // Public view — the page colleges get.
  const { window } = freshDom();
  window.CPL_FUNDING_PUBLIC = true;
  const doc = boot(window);
  const row = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  if (row) click(window, row.querySelector(".cplfund-caret"));
  const hits = glyphHits(mountHtml(doc));
  check("public view (one row open): no glyph in the mount — " + (hits.length ? hits.join(" | ") : "clean"),
    hits.length === 0);
  check("public view: no prose-block control of any kind survives the sweep",
    !doc.querySelector("[data-textedit], [data-textsave], [data-textcancel], [data-textreset], [data-textarea]"));
}

// ── 2. folds and the row toggle are words ───────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const secs = Array.from(doc.querySelectorAll("details.cplfund-sec"));
  check("every section fold has a word slot at the right of its heading, and no chevron span",
    secs.length > 5 && secs.every((d) => !!d.querySelector("summary .cplfund-sec-word")) &&
    !doc.querySelector(".cplfund-sec-chev"));
  const css = doc.getElementById("cpl-funding-css").textContent;
  check("the fold word is Show when closed and Hide when open (CSS-generated, so <details> keeps its native state)",
    /\.cplfund-sec-word::before \{ content: "Hide"; \}/.test(css) &&
    /\.cplfund-sec:not\(\[open\]\) > summary \.cplfund-sec-word::before \{ content: "Show"; \}/.test(css));
  const caret = doc.querySelector("#cplFundTable tbody tr.cplfund-row .cplfund-caret");
  check("the row toggle is the institution's NAME as a button (aria-expanded), not a caret",
    !!caret && caret.tagName === "BUTTON" && caret.getAttribute("aria-expanded") === "false" &&
    !!caret.querySelector(".cplfund-instname") && caret.textContent.trim().length > 3 &&
    !/[▸▾►]/.test(caret.textContent));
  if (caret) click(window, caret);
  check("…and clicking the name opens the drill-in",
    doc.querySelector("#cplFundTable tbody tr.cplfund-row .cplfund-caret").getAttribute("aria-expanded") === "true" &&
    !!doc.querySelector("tr.cplfund-detail"));
  const arr = doc.querySelector(".cplfund-table th .arr");
  check("the sort mark is the one glyph kept: aria-hidden, ghosted CO blue on white, beside aria-sort",
    !!arr && arr.getAttribute("aria-hidden") === "true" &&
    /\.cplfund-table th \.arr \{[^}]*var\(--cobalt-on-dark\)/.test(css) &&
    !!doc.querySelector('.cplfund-table th[aria-sort="ascending"], .cplfund-table th[aria-sort="descending"]'));
}

// ── 3. the chrome is calm ───────────────────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ pool: { admin_cost: 900000 } });
  T._setScenario({ pool: { scaling_projects_tech: 9000000 } });
  T.render();
  const reset = doc.getElementById("cplFundReset");
  const promote = doc.getElementById("cplFundPromote");
  check("Reset is a quiet outlined word (no .warn / red), and Publish is the one filled control on the line",
    !!reset && !/\bwarn\b/.test(reset.className) && !!promote && /\bprimary\b/.test(promote.className));
  const css = doc.getElementById("cpl-funding-css").textContent;
  check("the sign-in line, the project strip and the eligibility box carry no colored stripe or fill",
    !/\.cplfund-authbar \{[^}]*border-left: 4px/.test(css) &&
    !/\.cplfund-strip \{[^}]*border-left: 4px/.test(css) &&
    !/\.cplfund-elig \{[^}]*border-left: 4px/.test(css) &&
    !/\.cplfund-basis \{[^}]*border-left: 4px/.test(css));
  check("the Draft word is ghosted (no mustard fill), and the explainer link is a plain link (no box)",
    /\.cplfund-draftchip \{[^}]*background: none/.test(css) && !/\.cplfund-draftchip \{[^}]*mustard-fill/.test(css) &&
    /\.cplfund-sanity \{[^}]*background: none/.test(css) && /\.cplfund-sanity \{[^}]*text-decoration: underline/.test(css));
  check("the project strip's controls are words: Add project · New scenario · (edited) marks a scenario with edits",
    doc.getElementById("cplFundProjAdd").textContent.trim() === "Add project" &&
    doc.getElementById("cplFundScenNew").textContent.trim() === "New scenario" &&
    /\(edited\)/.test(doc.getElementById("cplFundScenSel").textContent));
  check("the Summary's balanced state is ink, not green (green and red are for a state to act on)",
    /\.cplfund-summary \.ok \{[^}]*var\(--text-strong\)/.test(css));
  check("the page toolbar has one Save as PDF (the actions row), and Excel is 'Download as Excel'",
    !!doc.getElementById("cplFundPdfTop") && !doc.getElementById("cplFundPdf") &&
    /Download as Excel/.test(doc.getElementById("cplFundCsv").textContent));
}
{
  // The static shells (Rule 4 mirrors): the subtitle that restated the
  // introduction in retired vocabulary is gone from both.
  const cpl = read("CPL_Dashboard.html"), idx = read("index.html");
  check("no subtitle paragraph under the tab title in either HTML (and no 'funding pools')",
    !/one-time funding\s+pools/.test(cpl) && !/one-time funding\s+pools/.test(idx) &&
    /<h2 style="margin: 0 0 6px 0; color: var\(--navy-primary\);">CPL Implementation Funding<\/h2>/.test(cpl));
  const pub = read("cpl_funding_public.html");
  check("the public page's header and description no longer say 'pools'", !/pools/.test(pub));
  const exp = read("funding-model/index.html");
  check("the explainer's draft tag is words, its shares read '% of the funding', and its masthead tags are painted ids",
    /<span class="tag draft">Draft model &mdash; not adopted policy<\/span>/.test(exp) &&
    /% of the funding/.test(exp) && !/% of the money/.test(exp) &&
    /id="x-version"/.test(exp) && /id="x-scenario"/.test(exp) &&
    /D\.model_version/.test(exp) && /D\.scenario/.test(exp));
}

// ── 4. editable prose, end to end ───────────────────────────────────────────
{
  const { window } = freshDom();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  const KEYS = ["about", "reading", "elig_intro", "nc_rules", "college_intro"];
  check("the five prose blocks render as prose (a paragraph each, at least), signed out",
    KEYS.every((k) => {
      const b = doc.querySelector('.cplfund-prose[data-textblock="' + k + '"]');
      return !!b && b.querySelectorAll("p, li").length >= 1;
    }));
  check("signed out there is no Edit control anywhere (prose is not a dial to explore)",
    !doc.querySelector("[data-textedit]"));
  check("the introduction still opens the tab with the house text",
    !!doc.querySelector('.cplfund-prose[data-textblock="about"]') &&
    /The Legislature appropriated one-time funding/.test(doc.querySelector('.cplfund-prose[data-textblock="about"]').textContent));

  // sign in → Edit → Save
  window.CPL_SESSION = reviewerSession();
  T.render();
  check("signed in, every prose block carries the word Edit",
    KEYS.every((k) => !!doc.querySelector('.cplfund-prose[data-textblock="' + k + '"] [data-textedit="' + k + '"]')));
  clickSel(window, doc, '[data-textedit="about"]', "Edit on the introduction");
  const ta = doc.querySelector('[data-textarea="about"]');
  check("Edit opens a plain textarea pre-filled with the default as plain text (entities decoded, paragraphs blank-line separated)",
    !!ta && /Chancellor’s Office/.test(ta.value) && /\n\n/.test(ta.value) && !/<p>|&rsquo;/.test(ta.value));
  check("while editing, the controls are Save · Cancel (no Restore yet — nothing is customized)",
    !!doc.querySelector('[data-textsave="about"]') && !!doc.querySelector('[data-textcancel="about"]') &&
    !doc.querySelector('[data-textreset="about"]'));
  // a re-render mid-edit keeps the draft
  setVal(doc, '[data-textarea="about"]', "First paragraph, mid-edit.\n\nSecond <b>paragraph</b>.");
  T.render();
  const ta2 = doc.querySelector('[data-textarea="about"]');
  check("a re-render mid-edit keeps what was typed (the draft survives)",
    !!ta2 && ta2.value === "First paragraph, mid-edit.\n\nSecond <b>paragraph</b>.");
  clickSel(window, doc, '[data-textsave="about"]', "Save on the introduction");
  const shared = T._getShared();
  check("Save stores the override under text.about in the SHARED layer (signed in = saves for everyone)",
    !!shared.text && shared.text.about === "First paragraph, mid-edit.\n\nSecond <b>paragraph</b>.");
  const block = doc.querySelector('.cplfund-prose[data-textblock="about"]');
  check("…and the page renders it as two paragraphs with the markup ESCAPED, not rendered",
    !!block && block.querySelectorAll("p").length === 2 && !block.querySelector("b") &&
    /Second <b>paragraph<\/b>\./.test(block.textContent));
  check("…with Edit and 'Customized text.' beneath it, and the textarea gone",
    !!block && !!block.querySelector('[data-textedit="about"]') && /Customized text\./.test(block.textContent) &&
    !doc.querySelector('[data-textarea="about"]'));

  // Restore the default
  clickSel(window, doc, '[data-textedit="about"]', "Edit on the customized introduction");
  check("editing a customized block offers Restore the default text", !!doc.querySelector('[data-textreset="about"]'));
  clickSel(window, doc, '[data-textreset="about"]', "Restore the default text");
  check("Restore drops the override (text.about gone, and an empty text map is not left behind)",
    !(T._getShared().text && T._getShared().text.about) &&
    !!doc.querySelector('.cplfund-prose[data-textblock="about"]') &&
    /The Legislature appropriated one-time funding/.test(doc.querySelector('.cplfund-prose[data-textblock="about"]').textContent));

  // saving the default back unchanged stores nothing
  clickSel(window, doc, '[data-textedit="reading"]', "Edit on Reading the funding");
  clickSel(window, doc, '[data-textsave="reading"]', "Save on Reading the funding");
  check("saving a block unchanged stores nothing (compares equal to the default's plain text)",
    !(T._getShared().text && T._getShared().text.reading));

  // Cancel discards
  clickSel(window, doc, '[data-textedit="college_intro"]', "Edit on the table introduction");
  setVal(doc, '[data-textarea="college_intro"]', "discard me");
  clickSel(window, doc, '[data-textcancel="college_intro"]', "Cancel on the table introduction");
  check("Cancel discards the draft and stores nothing",
    !doc.querySelector('[data-textarea="college_intro"]') &&
    !(T._getShared().text && T._getShared().text.college_intro) &&
    !/discard me/.test(mountText(doc)));

  // the legacy eligIntro key still resolves, and a save migrates it
  T._setShared({ eligIntro: "Legacy intro sentence." });
  T.render();
  check("a legacy eligIntro override (pre-2026-09-02) still renders as the eligibility introduction",
    !!doc.querySelector('.cplfund-prose[data-textblock="elig_intro"]') &&
    /Legacy intro sentence\./.test(doc.querySelector('.cplfund-prose[data-textblock="elig_intro"]').textContent));
  clickSel(window, doc, '[data-textedit="elig_intro"]', "Edit on the eligibility introduction");
  setVal(doc, '[data-textarea="elig_intro"]', "New intro sentence.");
  clickSel(window, doc, '[data-textsave="elig_intro"]', "Save on the eligibility introduction");
  check("…and saving it migrates the value to text.elig_intro and retires the legacy key",
    T._getShared().text && T._getShared().text.elig_intro === "New intro sentence." &&
    T._getShared().eligIntro === undefined);

  // the public preview renders the override with no control
  T._setShared({ text: { nc_rules: "Custom noncredit rule, for everyone." } });
  T._state.previewPublic = true;
  T.render();
  const pubBlock = doc.querySelector('.cplfund-prose[data-textblock="nc_rules"]');
  check("the public rendering shows a customized block's text with NO Edit control",
    !!pubBlock && /Custom noncredit rule, for everyone\./.test(pubBlock.textContent) &&
    !doc.querySelector("[data-textedit], [data-textarea]"));
  T._state.previewPublic = false;
  T._setShared({});
  T.render();
}

// ── 4b. the held figure sits with the figures it belongs to ─────────────────
// Sam, 2026-09-02, on a drill-in reading "$400,000 … $132,000 held in reserve":
// "isn't clear when compared to 400k available", then "put it before the $400k
// CR total and not on the NC total". So: inside the gate sentence, and in the
// priority caption ahead of Total Possible; no standalone note of its own.
{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-02", colleges: { "Alameda": { pe: 100, pe_u: 900, pa: 60, pa_u: 500, p3: 40, p3_u: 300 } } };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setElig({ coordOk: true, coord: {}, optin: {}, asOf: "2026-09-02" });
  T.render();
  const a = T._alloc("Alameda");
  check("fixture: the college is gated with a positive held figure", !!a && a.gate_blocked === true && a.earned_withheld > 0.5);
  const row = Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row")).find((r) => /Alameda/.test(r.textContent));
  if (row) click(window, row.querySelector(".cplfund-caret"));
  const det = doc.querySelector("tr.cplfund-detail");
  const held = a ? "$" + Math.round(a.earned_withheld).toLocaleString("en-US") : "";
  const total = a ? "$" + Math.round(a.total).toLocaleString("en-US") : "";
  check("the drill-in carries no standalone 'held in reserve' item (.cf-withheld div)", !!det && !det.querySelector("div.cf-withheld"));
  check("the gate sentence names the held figure as part of the max award, held not lost, before the numbered requirements",
    !!det && new RegExp("Baseline not met\\. " + held.replace(/[$]/g, "\\$") + " of its max award[^.]*held in reserve, not lost, until it meets [^:]*: \\(1\\)").test(det.textContent));
  const cap = det && det.querySelector(".cplfund-dtl-table caption");
  check("the priority caption reads Current Total · <held> held in reserve until … · Total Possible: <max award>",
    !!cap && cap.textContent.indexOf(held + " held in reserve until baseline participation is met") !== -1 &&
    cap.textContent.indexOf(held) < cap.textContent.indexOf("Total Possible: " + total));
  delete window.CPL_FUNDING_PERF;
}

// ── 5. vocabulary on the rendered text ──────────────────────────────────────
{
  const { window } = freshDom();
  window.CPL_SESSION = reviewerSession();
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared({ pool: { admin_cost: 900000 } });
  T.render();
  const row = doc.querySelector("#cplFundTable tbody tr.cplfund-row");
  if (row) click(window, row.querySelector(".cplfund-caret"));
  const t = mountWords(doc);
  const bad = [/\bpools?\b/i, /\bmoney\b/i, /\bapportion\w*/i, /\bpot\b/i, /\badvances?\b(?! (the|each|Vision))/i]
    .map((re) => { const m = re.exec(t.replace(/Advancing career attainment[^.]*\./g, "")); return m ? m[0] + " @" + t.slice(Math.max(0, m.index - 40), m.index + 20).replace(/\s+/g, " ") : null; })
    .filter(Boolean);
  check("no 'pool' / 'money' / 'apportion' / 'pot' / the advance concept in the curate view's rendered text — " +
    (bad.length ? bad.join(" | ") : "clean"), bad.length === 0);
  check("the $50K view's rendered text is clean too", (function () {
    T._setSubview("grants");
    const t2 = mountWords(doc);
    return !/\bpools?\b/i.test(t2) && !/\bmoney\b/i.test(t2) && !/\bapportion/i.test(t2);
  })());
}

finish();
