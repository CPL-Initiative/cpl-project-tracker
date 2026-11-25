// Simple view on the public funding page (Sam, 2026-11-24, his calls on the
// approved mockup). What fails without the change:
//
//   S1  an anonymous reader with the setting off meets the package (the switch,
//       the cards, How to meet it, the Ver. 2 label): the team tests first.
//   S2  a signed-in team member does not meet it, or meets it off: Simple view
//       is the default.
//   S3  Simple view hides less than his list, folds the wrong sections, keeps the
//       district grouping, or turning it off leaves the folds where it put them.
//   S4  How to meet it after a met condition, or missing after an unmet one.
//   S5  a card whose count is not the model's own: it must equal the count taken
//       from the funding module's per-institution conditions (T._conditions).
//   S6  a card press that does not filter the table to what it counts, or a
//       Show all institutions that does not bring every row back.
//   S7  the setting: absent from the tab's Internal view, or not turning the
//       package on for an anonymous reader.
//   S8  the PDF note under the PDF button (gone for everyone).
//   S9  the switch painted white on white (Sam, 2026-11-25): the header that holds it, the cards and the line
//       read --seal-blue, which the page defines only where it scopes it; the header moved to .cplh and the scope
//       did not follow.
//   S11 the # column showing in Simple view because this browser remembered it on (the view hides the Columns menu).
//   S10 no caret before a public row's pie, or one a screen reader announces, or one that does not turn when the
//       row opens (Sam, 2026-11-25: "add a carat to each row to the left of the pie glyph").
//
// Windows: 5 booted. Run from repo root: `npm test` (or `node tests/cpl_funding_simple_view.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const H = require("./lib/cpl_funding_harness.js");
const { check, finish } = H;

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const html = read("funding-model/index.html");
const QUAL = "Laney";   // meets all three conditions
const HELD = "Butte";   // meets none
const VET_REQ = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP";

function session() {
  return { get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
           isFresh: function () { return true; }, onChange: function () {} };
}
function page(opts) {
  opts = opts || {};
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/" });
  const w = dom.window;
  w.CPL_FUNDING_NO_REMOTE = true;
  w.scrollTo = function () {};
  w.Element.prototype.scrollIntoView = function () {};
  if (opts.signedIn) w.CPL_SESSION = session();
  if (opts.cols) w.localStorage.setItem("cplfund_cols_v3", JSON.stringify(opts.cols));
  w.CPL_FUNDING_PERF = { as_of: "2026-11-01", suppress_below: 10, statewide: { pa_u: 300000 },
    colleges: { [QUAL]: { pa_u: 900 }, [HELD]: { pa_u: 600 } }, feeders: {}, unmatched: {},
    vet_star: { [QUAL]: true, [HELD]: false }, vet_star_as_of: "2026-11-01", vet_star_threshold: 0.75 };
  ["cpl_funding_data.js", "funding_model_payload.js", "cpl_funding.js"].forEach((f) => w.eval(read(f)));
  const T = w.CPL_FUNDING_TAB;
  Array.from(w.document.querySelectorAll("script:not([src])")).forEach((s) => w.eval(s.textContent));
  T._setShared(Object.assign({ participationDeadline: "2099-11-01", extraReqs: [VET_REQ] }, opts.shared || {}));
  T._setElig({ coordOk: true, coord: { [QUAL]: true },
    optinRow: { [QUAL]: { college: QUAL, status: "confirmed", requested_at: "2026-10-01T00:00:00Z" } }, asOf: "2026-11-01" });
  w.eval(read("funding-model/simple_view.js"));
  T.render();
  return { w, doc: w.document, T, SV: w.CPL_SIMPLE_VIEW };
}
const click = (w, el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const rowIds = (doc) => Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row[data-id]")).map((tr) => tr.getAttribute("data-id"));
const fold = (doc, id) => doc.querySelector("#" + id + " details.fold");
function openRow(w, doc, name) {
  const tr = doc.querySelector('#cplFundTable tr[data-id="c:' + name + '"]');
  const next = tr && tr.nextElementSibling;
  if (tr && !(next && next.classList.contains("cplfund-detail"))) click(w, tr.querySelector(".cplfund-caret"));
  return doc.querySelector('#cplFundTable tr[data-id="c:' + name + '"]');
}
function condsOf(doc, name) {
  const tr = doc.querySelector('#cplFundTable tr[data-id="c:' + name + '"]');
  const det = tr && tr.nextElementSibling;
  return det ? Array.from(det.querySelectorAll(".cf-cond")) : [];
}
const hasHowAfter = (el) => !!(el.nextElementSibling && el.nextElementSibling.matches("button.cplfund-howto-w[data-condhowto]"));

// ── S1 + S8: an anonymous reader, the setting off ───────────────────────────
{
  const { w, doc, T, SV } = page();
  check("S1a: anonymous, setting off: no switch, no cards, no line, Simple view off",
    doc.getElementById("svCenter").hidden && doc.getElementById("svCards").hidden &&
    doc.getElementById("simpleLine").hidden && !doc.body.classList.contains("simple") && !SV.shown() && !T.simplePackageShown());
  check("S1b: the gold rule under the title stays for that reader", !doc.body.classList.contains("sv-pkg") && !!doc.querySelector(".title-accent"));
  openRow(w, doc, HELD);
  check("S1c: no How to meet it beside the conditions", condsOf(doc, HELD).length > 0 && !doc.querySelector("[data-condhowto]"));
  check("S1d: the label keeps today's scenario number", doc.getElementById("x-scenario-no").textContent.trim() !== "2" ||
    /2\s*$/.test(String(T._scenario ? T._scenario().name : "")));
  check("S8: the PDF note is gone, and the PDF button names nothing it described",
    !doc.getElementById("pdf-note") && !doc.getElementById("pdf-btn").hasAttribute("aria-describedby") && !/id="pdf-note"/.test(html));
  check("S1e: the table still groups by district for that reader when asked",
    (T._state.group = "district", T.render(), doc.querySelectorAll("tr.cplfund-grouphdr").length > 0));
}

// ── S2–S6: a signed-in team member ──────────────────────────────────────────
{
  const { w, doc, T, SV } = page({ signedIn: true });
  const btn = doc.getElementById("simpleBtn");
  check("S2a: signed in, the switch shows in the header row, between the logo and the links",
    !doc.getElementById("svCenter").hidden && doc.getElementById("svCenter").parentNode.classList.contains("cplh-in") &&
    doc.getElementById("svCenter").previousElementSibling.classList.contains("cplh-logo") &&
    doc.getElementById("svCenter").nextElementSibling.classList.contains("cplh-end"));
  check("S2b: Simple view is on by default: pressed, On, the line under the header",
    btn.getAttribute("aria-pressed") === "true" && /Simple view/.test(btn.textContent) &&
    doc.getElementById("simpleOnOff").textContent === "On" && !doc.getElementById("simpleLine").hidden &&
    doc.getElementById("simpleLine").textContent === "For more details, turn Simple view off." && T.simpleView());
  check("S2c: the label reads As of 11/24/2026 (or a later save) Ver. 2",
    doc.getElementById("x-scenario-no").textContent === "2" && /^\d+\/\d+\/2026$/.test(doc.getElementById("x-version").textContent));

  // S3: what it hides, the folds, the flat table
  const css = (doc.getElementById("sv-css") || {}).textContent || "";
  const want = [".cf-boundchip", ".cf-chipgrp", "tr.cplfund-grouphdr", "#cplFundGroup", "tr.cplfund-systemrow",
    ".cplfund-colmenu", ".cf-lanechip", ".cf-belowchip", ".cf-nonc", ".cf-ftes", ".cplfund-detail-foot",
    "tr.cplfund-srcrow", "tr.cplfund-subnote", "#allocation", "#earning", "#choices"];
  check("S3a: every item on his list is hidden under body.simple, and nothing he kept",
    want.every((h) => css.indexOf("body.simple " + h) >= 0) &&
    !/body\.simple (\.cf-goalchip|\.cplfund-vstar|\.cf-cond|\.cf-eligpie)/.test(css));
  const sys = doc.querySelector("tr.cplfund-systemrow");
  check("S3b: the Statewide row and the allocation section compute as hidden",
    !!sys && w.getComputedStyle(sys).display === "none" && w.getComputedStyle(doc.getElementById("allocation")).display === "none" &&
    w.getComputedStyle(doc.getElementById("institutions")).display !== "none");
  const tocHidden = ["allocation", "earning", "choices"].every((id) => {
    const li = doc.querySelector('#toc-list li[data-sec="' + id + '"]');
    return li && w.getComputedStyle(li).display === "none";
  });
  check("S3c: their Contents items are hidden, the institution table's is not",
    tocHidden && w.getComputedStyle(doc.querySelector('#toc-list li[data-sec="institutions"]')).display !== "none");
  const tops = Array.from(doc.querySelectorAll("main > section[data-fsec]")).filter((s) => s.querySelector("details.fold"));
  check("S3d: every top-level section is folded but the institution table",
    tops.length > 5 && tops.every((s) => s.querySelector("details.fold").open === (s.id === "institutions")));
  T._state.group = "district"; T.render();
  check("S3e: with Simple view on the table renders flat, whatever the grouping says",
    !doc.querySelector("tr.cplfund-grouphdr") && rowIds(doc).length > 100);
  click(w, btn);
  check("S3f: off restores the folds as they were (Funding outcomes and Timeline open, the Overview folded)",
    !doc.body.classList.contains("simple") && doc.getElementById("simpleLine").hidden &&
    btn.getAttribute("aria-pressed") === "false" && doc.getElementById("simpleOnOff").textContent === "Off" &&
    fold(doc, "outcomes").open && fold(doc, "disbursement").open && !fold(doc, "overview").open && fold(doc, "institutions").open);
  check("S3g: off, the grouping returns and the Statewide row shows",
    doc.querySelectorAll("tr.cplfund-grouphdr").length > 0 && w.getComputedStyle(doc.querySelector("tr.cplfund-systemrow")).display !== "none");
  T._state.group = "none";
  click(w, btn);
  check("S3h: on again folds again", doc.body.classList.contains("simple") && !fold(doc, "outcomes").open);

  // S4: How to meet it
  openRow(w, doc, HELD);
  const held = condsOf(doc, HELD);
  const heldUnmet = held.filter((c) => !c.classList.contains("cf-met") && !c.classList.contains("cf-pending"));
  check("S4a: every unmet condition is followed by How to meet it (" + heldUnmet.length + ")",
    heldUnmet.length >= 3 && heldUnmet.every(hasHowAfter) &&
    heldUnmet.every((c) => c.nextElementSibling.textContent === "How to meet it"));
  openRow(w, doc, QUAL);
  const qual = condsOf(doc, QUAL);
  check("S4b: a met condition carries none", qual.length >= 3 && qual.every((c) => !c.classList.contains("cf-met") || !hasHowAfter(c)) &&
    qual.filter((c) => c.classList.contains("cf-met")).length >= 3);
  const how = doc.querySelector('[data-condhowto="part"][data-condhowtoc="' + HELD + '"]');
  click(w, how);
  const dlg = doc.getElementById("cplFundHowTo");
  check("S4c: it opens the how-to dialog for that condition and institution",
    !!dlg && dlg.hasAttribute("open") && /participation/i.test(dlg.querySelector("h2").textContent) && /Butte/.test(dlg.textContent));
  if (dlg) click(w, dlg.querySelector("[data-howtoclose]"));

  // S5: the cards' counts are the model's
  const cards = T.condCards();
  const all = rowIds(doc).map((id) => id.slice(2));
  const exp = { all: [0, 0], part: [0, 0], coord: [0, 0], jst: [0, 0] };
  all.forEach((name) => {
    const c = T._conditions(name);
    if (!c) return;
    const item = (k) => c.items.filter((x) => x.kind === k)[0];
    [["part", "part"], ["coord", "coord"], ["jst", "vetstar"]].forEach(([key, kind]) => {
      const it = item(kind);
      if (!it) return;
      exp[key][1]++;
      if (it.met && !it.pending) exp[key][0]++;
    });
    exp.all[1]++;
    const nc = c.ncItems.length ? !c.ncPending && !c.ncBlocked : true;
    if (!c.pending && !c.blocked && nc) exp.all[0]++;
  });
  const byKey = {};
  cards.forEach((c) => { byKey[c.key] = c; });
  check("S5a: five cards, in his order", cards.map((c) => c.key).join(",") === "all,part,coord,jst,nc");
  check("S5b: every card's count and its of equal the model's per-institution conditions (" +
    ["all", "part", "coord", "jst"].map((k) => k + " " + byKey[k].n + "/" + byKey[k].of).join(", ") + ")",
    ["all", "part", "coord", "jst"].every((k) => byKey[k].n === exp[k][0] && byKey[k].of === exp[k][1]) &&
    byKey.all.n >= 1 && byKey.all.of === all.length);
  check("S5c: the NC Lead card counts no more than it applies to", byKey.nc.n == null || byKey.nc.n <= byKey.nc.of);
  const cardEls = Array.from(doc.querySelectorAll("#svCards .sv-card"));
  const allEl = doc.querySelector('#svCards .sv-card[data-card="all"]');
  check("S5d: the page paints the cards under the title, in place of the gold rule",
    cardEls.length === 5 && doc.getElementById("svCards").closest(".mh-text") === doc.querySelector("#page-title").parentNode &&
    doc.body.classList.contains("sv-pkg") && /body\.sv-pkg \.title-accent\{display:none\}/.test(css));
  check("S5e: each card reads its number, of N, and its label; the summary card is tinted",
    cardEls.every((b, i) => b.querySelector(".sv-n").textContent === String(cards[i].n) &&
      b.querySelector(".sv-of").textContent === "of " + cards[i].of && b.querySelector(".sv-k").textContent.indexOf(cards[i].label) === 0) &&
    /\.sv-card\[data-card="all"\]\{background:var\(--tint-cobalt\); border-color:var\(--cobalt\)\}/.test(css));
  const jstEl = doc.querySelector('#svCards .sv-card[data-card="jst"]');
  check("S5f: Veteran JSTs at 75% is followed by the Veteran Star",
    /^Veteran JSTs at 75%/.test(jstEl.querySelector(".sv-k").textContent) && !!jstEl.querySelector(".sv-k .cplfund-vstar[aria-label='Veteran Star']"));
  const tip = doc.getElementById(allEl.getAttribute("aria-describedby"));
  check("S5g: the tooltip names the institutions, reachable by focus (aria-describedby, :focus-visible)",
    !!tip && tip.getAttribute("role") === "tooltip" && /Laney/.test(tip.textContent) && !/Butte/.test(tip.textContent) &&
    /\.sv-card:focus-visible \+ \.sv-tip/.test(css));

  // S6: the card filters the table, Show all restores
  click(w, allEl);
  const shownRows = rowIds(doc);
  check("S6a: pressing All conditions met shows exactly the institutions it counts (" + shownRows.length + ")",
    shownRows.length === byKey.all.n && shownRows.indexOf("c:" + QUAL) >= 0 && shownRows.indexOf("c:" + HELD) < 0 &&
    T.condFilter() === "c_all" && doc.querySelector('#svCards .sv-card[data-card="all"]').getAttribute("aria-pressed") === "true");
  const filt = doc.getElementById("cplFundCardFilt");
  check("S6b: a line above the table says what it shows, with Show all institutions",
    !!filt && /^Showing the institutions that meet every condition that applies to them\./.test(filt.textContent.trim()) &&
    !!doc.getElementById("cplFundCardAll"));
  click(w, doc.getElementById("cplFundCardAll"));
  check("S6c: Show all institutions brings every row back and lets the card go",
    rowIds(doc).length === all.length && !doc.getElementById("cplFundCardFilt") &&
    doc.querySelector('#svCards .sv-card[data-card="all"]').getAttribute("aria-pressed") === "false");
  const partEl = doc.querySelector('#svCards .sv-card[data-card="part"]');
  click(w, partEl);
  const partRows = rowIds(doc);
  click(w, partEl);
  check("S6d: pressing a pressed card again restores the table",
    partRows.length === byKey.part.n && rowIds(doc).length === all.length && T.condFilter() === "");
}

// ── S7: the setting turns it on for everyone ────────────────────────────────
{
  const { doc, T, SV } = page({ shared: { simpleViewLive: true } });
  check("S7a: anonymous, with Simple view on the public page set On, the package shows, on by default",
    T.simpleViewLive() && SV.shown() && SV.isOn() && !doc.getElementById("svCenter").hidden &&
    doc.querySelectorAll("#svCards .sv-card").length === 5 && doc.getElementById("x-scenario-no").textContent === "2");
}
{
  const { window } = H.freshDom();
  window.CPL_SESSION = session();
  const doc = H.boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();
  const seg = doc.getElementById("cplFundSimpleLive");
  const offOn = seg ? Array.from(seg.querySelectorAll("button")).map((b) => b.textContent + ":" + b.getAttribute("aria-pressed")).join(",") : "";
  check("S7b: the tab's Internal view carries Simple view on the public page, Off by default (" + offOn + ")",
    !!seg && offOn === "Off:true,On:false" && /Simple view on the public page/.test(seg.previousElementSibling.textContent));
  H.click(window, seg.querySelector('button[data-val="on"]'));
  check("S7c: On saves the shared setting", T.simpleViewLive() === true && T._getShared().simpleViewLive === true);
}
{
  const { window } = H.freshDom();
  const doc = H.boot(window);
  window.CPL_FUNDING_TAB.render();
  check("S7d: signed out, the tab offers no such setting", !doc.getElementById("cplFundSimpleLive"));
}

{
  // S9: the scoped rule that defines --seal-blue covers every element the switch and the cards sit in.
  const m = /([^{}]+)\{\s*--seal-blue:/.exec(html.replace(/\/\*[\s\S]*?\*\//g, ""));
  const sels = m ? m[1].split(",").map((x) => x.trim()) : [];
  const { doc } = page({ signedIn: true });
  const covered = (el) => sels.some((sel) => sel && el.closest(sel));
  check("S9: --seal-blue reaches the switch, the cards and the line under the header (" + sels.join(" ") + ")",
    ["simpleBtn", "svCards", "simpleLine"].every((id) => covered(doc.getElementById(id))));
}
{
  // S10: a caret leads each public row, before the pie; aria-hidden; it turns with the row's open class.
  const { w, doc } = page({ signedIn: true });
  const tr = doc.querySelector("#cplFundTable tr.cplfund-row[data-id]");
  const lead = tr && tr.querySelector(".cf-lead");
  const first = lead && lead.firstElementChild;
  check("S10a: the caret is the first thing in the row's lead, before the pie, hidden from screen readers",
    !!first && first.classList.contains("cf-chev") && first.getAttribute("aria-hidden") === "true" &&
    !!first.nextElementSibling && first.nextElementSibling.classList.contains("cf-elig"));
  const id = tr.getAttribute("data-id");
  click(w, tr);
  const again = Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row[data-id]")).filter((r) => r.getAttribute("data-id") === id)[0];
  check("S10b: opening the row marks it open, which turns the caret down", !!again && again.classList.contains("cplfund-open"));
  const css = Array.from(doc.querySelectorAll("style")).map((s) => s.textContent).join("\n");
  check("S10c: the open row's caret rule exists", /tr\.cplfund-open \.cf-chev::before\s*\{[^}]*rotate\(45deg\)/.test(css));
}
{
  // S10d: the COBI tab (not the public page) carries no caret.
  const { window } = H.freshDom();
  const doc = H.boot(window);
  window.CPL_FUNDING_TAB.render();
  check("S10d: the tab's own table has no caret", doc.querySelectorAll(".cf-chev").length === 0 &&
    doc.querySelectorAll("tr.cplfund-row").length > 0);
}

{
  // S11: a remembered # column stays off while Simple view is on, and returns with it off.
  // A browser that turned # on in the Columns menu: its remembered set no longer names "order".
  const { w, doc, SV } = page({ signedIn: true, cols: { college: {} } });
  const T = w.CPL_FUNDING_TAB;
  const on = T.isColHidden("order");
  SV.set(false);
  const off = T.isColHidden("order");
  check("S11: Simple view hides # whatever the browser remembers, and turning it off defers to the browser (" + on + "," + off + ")",
    on === true && off === false);
}

finish();
