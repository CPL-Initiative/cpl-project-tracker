// The graded and cert-based guard on the Common Exhibit Reference tab's merge writers (S679). Sam's two groups
// (2026-11-17): graded is Credit By Exam and Portfolio Review, cert-based the rest. Every writer on this tab that saves a
// merge confirm asks combine_guard.js, the guard the Exhibits tab's folds use, and saves the title the guard says the
// merge lands on. Pressing the real buttons, this guards:
//   (1) the pending merges' Confirm merge, (2) the grid's Confirm merge and Save, (3) Merge into this on the look-alike
//       panel, and (4) the issuer lane's Save: each blocks a cert-based title merged into a graded one on the first press
//       with nothing written, writes it on a second press with the override logged, and lets a merge inside one group
//       through on the first press with no override;
//   (5) each holds, with nothing written on any press, when the CPL types file answers 404, and the grid's Save holds
//       with the guard's words, never stuck on "saving…", when the file answers 200 with no CPL types in it;
//   (6) the merge lands on the end of the picked title's chain of saved renames, and the guard and the write name it;
//       after the save the grid's title cell shows the title written, and the confirm dialog says in words when the
//       chain runs through a saved rename the rename apply holds as an unconfirmed collision;
//   (7) one copy of the guard: the tab decides through combine_guard.js and holds none of its logic;
//   (8) a title with no CPL type recorded (the nightly build's "CPL type not recorded", with no group, or a title the
//       file does not hold) asks on the first press and writes on the second, the override logged with the reason
//       "CPL type not recorded"; a chain whose end is untyped reads the typed title before it.
// The two-step case (a rename on the Exhibits List, then Confirm merge here) is in tests/exhibits_list_left.test.js.
// Run from repo root: `npm test` (or `node tests/cer_combine_guard.test.js`).
const fs = require("fs");
const { boot, sleep } = require("./lib/cer_harness.js");
const { cerLane } = require("./_cer_views");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const P = "_CREDENTIAL_REVIEW::";
function rec(ut, issuer, type) {
  return { ut: ut, raw_count: 1, conf_title: 0.9, issuer: issuer, cpl_types: [type], audit_tags: {}, audit_tag_total: 0, articulations: [], raw_variants: [{ r: ut + " (local)", c: 0.9 }] };
}
const PAYLOAD = { _generated_at: "t", top_categories: {}, unified_titles: [
  rec("Paramedic", "National Registry", "Credit By Exam"),
  rec("EMT Basic", "National Registry", "Industry Certification"),
  rec("Basic EMT", "National Registry", "Credit By Exam"),
  rec("CompTIA Security+", "CompTIA", "Industry Certification"),
  rec("Security+ CompTIA", "CompTIA", "Industry Certification"),
  rec("Medic Card Old", null, "Industry Certification"),
  rec("Net Card Old", null, "Industry Certification"),
  rec("Unrecorded Card", null, "Credit By Exam"),
  rec("Unrecorded Badge", null, "Credit By Exam")] };
const TYPES = { schema: 1, titles: {}, canonicals: {
  "Paramedic": { type: "Credit By Exam", group: "graded" },
  "Basic EMT": { type: "Credit By Exam", group: "graded" },
  "EMT Basic": { type: "Industry Certification", group: "cert" },
  "CompTIA Security+": { type: "Industry Certification", group: "cert" },
  "Security+ CompTIA": { type: "Industry Certification", group: "cert" },
  "Medic Card Old": { type: "Industry Certification", group: "cert" },
  "Net Card Old": { type: "Industry Certification", group: "cert" },
  // The nightly build's untyped entry: 1,025 of 2,849 titles carried it on 2026-11-18.
  "Unrecorded Card": { type: "CPL type not recorded", group: "" },
  "Unrecorded Badge": { type: "CPL type not recorded", group: "" } } };
function row(ut, field, value) { return { course_id: P + ut, field: field, value: value, reviewer_email: "map@rccd.edu", reviewed_at: "2026-11-17T16:00:00Z" }; }
const bodies = (t) => t.writes.map((w) => w.body).filter(Boolean);
const of = (t, ut) => bodies(t).filter((b) => b.course_id === P + ut);
const field = (list, f) => list.filter((b) => b.field === f);
// A first press across the groups writes nothing; a second writes the rename, the confirm and the override, all naming `to`.
function crossed(t, ut, to) {
  const w = of(t, ut);
  return w.length === 3 && field(w, "unified_title_override")[0].value === to && field(w, "unified_title_merge_confirm")[0].value === to
    && /^combine across groups: cert into graded: /.test((field(w, "cpl_type_group_override")[0] || {}).value || "");
}
function inside(t, ut, to) {
  const w = of(t, ut);
  return w.length === 2 && field(w, "unified_title_override")[0].value === to && field(w, "unified_title_merge_confirm")[0].value === to
    && !field(w, "cpl_type_group_override").length;
}
const rowByTitle = (doc, ut) => Array.from(doc.querySelectorAll("tr.cr-row")).find((tr) => {
  const inp = tr.querySelector(".cr-title-in");
  return inp ? inp.getAttribute("value") === ut || inp.value === ut : txt(tr).indexOf(ut) >= 0;
});

(async () => {
  // ── (1) the pending merges' Confirm merge ──
  // EMT Basic is saved to become Paramedic, and Paramedic is saved to become Paramedic II (no record of its own yet).
  const PENDING = [row("EMT Basic", "unified_title_override", "Paramedic"), row("Paramedic", "unified_title_override", "Paramedic II"),
    row("Security+ CompTIA", "unified_title_override", "CompTIA Security+")];
  async function strip(types) {
    const t = await boot({ payload: PAYLOAD, overlay: PENDING, types: types });
    cerLane(t.doc, /Merge/).click(); await sleep(60);
    t.mg = (ut) => t.doc.querySelector('.cr-mg-row[data-ut="' + ut + '"]');
    t.press = async (ut) => { t.mg(ut).querySelector(".cr-mg-confirm").click(); await sleep(60); };
    return t;
  }
  const a = await strip(TYPES);
  check("(1) the strip lists both pending merges", !!a.mg("EMT Basic") && !!a.mg("Security+ CompTIA"), txt(a.doc.querySelector(".cr-mg-table")));
  await a.press("EMT Basic");
  const aNote = txt(a.mg("EMT Basic").querySelector(".cr-guard-note"));
  check("(1) ⭐ Confirm merge blocks a cert-based title merged into a graded one on the first press, with nothing written",
    of(a, "EMT Basic").length === 0 && a.confirms.length === 0
    && /^Blocked: EMT Basic is cert-based .* and the fold lands on Paramedic II \(Paramedic is saved to become Paramedic II\), which is graded .*Press Confirm merge again to combine them anyway; that override is logged\.$/.test(aNote), aNote);
  await a.press("EMT Basic");
  check("(1) ⭐ the second press writes it, logs the override, and names the landing title in the rename and the confirm",
    crossed(a, "EMT Basic", "Paramedic II") && /combine across groups: cert into graded: EMT Basic -> Paramedic II$/.test(field(of(a, "EMT Basic"), "cpl_type_group_override")[0].value)
    && a.confirms.length === 1 && /“Paramedic II”/.test(a.confirms[0]), JSON.stringify(of(a, "EMT Basic")));
  await a.press("Security+ CompTIA");
  check("(1) ⭐ a merge inside one group goes through on the first press and logs no override", inside(a, "Security+ CompTIA", "CompTIA Security+"), JSON.stringify(of(a, "Security+ CompTIA")));
  const a4 = await strip(404);
  await a4.press("EMT Basic"); await a4.press("EMT Basic"); await a4.press("Security+ CompTIA");
  check("(5) ⭐ Confirm merge holds every merge while the types file answers 404, on every press",
    bodies(a4).length === 0 && /^The CPL types did not load, so this combine is held\. Try again\.$/.test(txt(a4.mg("EMT Basic").querySelector(".cr-guard-note"))),
    txt(a4.mg("EMT Basic").querySelector(".cr-guard-note")) + " " + JSON.stringify(bodies(a4)));

  // ── (2) the grid: the title cell's Confirm merge strip and the row's Save ──
  async function grid(types) { return boot({ payload: PAYLOAD, overlay: [], types: types }); }
  function type(t, ut, value) {
    const tr = rowByTitle(t.doc, ut), inp = tr.querySelector(".cr-title-in");
    inp.value = value; inp.dispatchEvent(new t.window.Event("input"));
    return tr;
  }
  const g = await grid(TYPES);
  let tr = type(g, "EMT Basic", "Paramedic");
  const strip1 = tr.querySelector(".cr-merge-confirm");
  check("(2) typing an existing graded title on a cert-based row offers Confirm merge", !!strip1);
  strip1.click(); await sleep(60);
  check("(2) ⭐ the grid's Confirm merge blocks it on the first press, says why under the title, and writes nothing",
    of(g, "EMT Basic").length === 0 && /^Blocked: EMT Basic is cert-based .*the fold lands on Paramedic, which is graded .*Press Save again/.test(txt(tr.querySelector(".cr-guard-note")))
    && /^Blocked:/.test(txt(g.doc.getElementById("cr-toast"))), txt(tr.querySelector(".cr-guard-note")));
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(2) ⭐ the row's Save, pressed second, writes the merge and logs the override", crossed(g, "EMT Basic", "Paramedic") && !tr.querySelector(".cr-guard-note"), JSON.stringify(of(g, "EMT Basic")));
  tr = type(g, "Security+ CompTIA", "CompTIA Security+");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(2) ⭐ a grid merge inside one group goes through on the first press", inside(g, "Security+ CompTIA", "CompTIA Security+"), JSON.stringify(of(g, "Security+ CompTIA")));
  const g4 = await grid(404);
  tr = type(g4, "EMT Basic", "Paramedic");
  tr.querySelector(".cr-merge-confirm").click(); await sleep(60);
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(5) ⭐ the grid holds every merge while the types file answers 404", bodies(g4).length === 0 && /^The CPL types did not load, so this combine is held/.test(txt(tr.querySelector(".cr-guard-note"))), txt(tr.querySelector(".cr-guard-note")));
  // A plain re-title (no existing title) is not a merge and never waits on the guard.
  tr = type(g4, "Net Card Old", "Network Card");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(2) a re-title onto a new name is not a merge and saves without the types file", field(of(g4, "Net Card Old"), "unified_title_override").length === 1
    && !field(of(g4, "Net Card Old"), "unified_title_merge_confirm").length, JSON.stringify(of(g4, "Net Card Old")));

  // ── (3) Merge into this, on the look-alike panel ──
  async function looks(types) { return boot({ payload: PAYLOAD, overlay: [], types: types }); }
  async function mergeInto(t, ut) {
    let r = rowByTitle(t.doc, ut);
    if (!r.querySelector(".cr-mergesug-panel")) { r.querySelector(".cr-chip-mergesug").click(); await sleep(30); r = rowByTitle(t.doc, ut); }
    r.querySelector(".cr-mergesug-btn").click(); await sleep(60);
    return rowByTitle(t.doc, ut) || r;
  }
  const m = await looks(TYPES);
  let mr = await mergeInto(m, "EMT Basic");
  check("(3) ⭐ Merge into this blocks a cert-based title merged into a graded look-alike on the first press, with nothing written",
    of(m, "EMT Basic").length === 0 && /^Blocked: EMT Basic is cert-based .*the fold lands on Basic EMT, which is graded/.test(txt(mr.querySelector(".cr-guard-note"))), txt(mr));
  mr = await mergeInto(m, "EMT Basic");
  check("(3) ⭐ pressed again, it writes the merge and logs the override", crossed(m, "EMT Basic", "Basic EMT"), JSON.stringify(of(m, "EMT Basic")));
  await mergeInto(m, "Security+ CompTIA");
  check("(3) ⭐ Merge into this inside one group goes through on the first press", inside(m, "Security+ CompTIA", "CompTIA Security+"), JSON.stringify(of(m, "Security+ CompTIA")));
  const m4 = await looks(404);
  mr = await mergeInto(m4, "EMT Basic"); mr = await mergeInto(m4, "EMT Basic");
  check("(5) ⭐ Merge into this holds while the types file answers 404", bodies(m4).length === 0 && /^The CPL types did not load/.test(txt(mr.querySelector(".cr-guard-note"))), txt(mr));

  // ── (4) the issuer lane's Save ──
  async function lane(types) {
    const t = await boot({ payload: PAYLOAD, overlay: [], types: types });
    cerLane(t.doc, /No issuer/).click(); await sleep(60);
    t.row = (ut) => Array.from(t.doc.querySelectorAll(".cr-ni-row")).find((r) => r.getAttribute("data-ut") === ut);
    t.fill = (ut, title) => { const r = t.row(ut); r.querySelector(".cr-ni-title-input").value = title; r.querySelector(".cr-ni-input").value = "National Registry"; return r; };
    t.save = async (ut) => { t.row(ut).querySelector(".cr-ni-save").click(); await sleep(60); };
    return t;
  }
  const l = await lane(TYPES);
  l.fill("Medic Card Old", "Paramedic"); await l.save("Medic Card Old");
  check("(4) ⭐ the issuer lane's Save blocks a cert-based title merged into a graded one, with nothing written",
    of(l, "Medic Card Old").length === 0 && /^Blocked: Medic Card Old is cert-based/.test(txt(l.row("Medic Card Old").querySelector(".cr-guard-note"))), txt(l.row("Medic Card Old")));
  await l.save("Medic Card Old");
  const lw = of(l, "Medic Card Old");
  check("(4) ⭐ pressed again, it writes the merge, the issuer and the override", field(lw, "unified_title_merge_confirm").length === 1 && field(lw, "unified_title_merge_confirm")[0].value === "Paramedic"
    && field(lw, "unified_title_override")[0].value === "Paramedic" && field(lw, "cpl_type_group_override").length === 1 && field(lw, "issuing_agency_override").length === 1, JSON.stringify(lw));
  l.fill("Net Card Old", "CompTIA Security+"); await l.save("Net Card Old");
  const nw = of(l, "Net Card Old");
  check("(4) ⭐ an issuer lane merge inside one group goes through on the first press", field(nw, "unified_title_merge_confirm").length === 1 && !field(nw, "cpl_type_group_override").length, JSON.stringify(nw));
  const l4 = await lane(404);
  l4.fill("Medic Card Old", "Paramedic"); await l4.save("Medic Card Old"); await l4.save("Medic Card Old");
  check("(5) ⭐ the issuer lane holds while the types file answers 404", bodies(l4).length === 0 && /^The CPL types did not load/.test(txt(l4.row("Medic Card Old").querySelector(".cr-guard-note"))), txt(l4.row("Medic Card Old")));

  // The issuer lane's Save all: one crossing merge holds the whole save on the first press; the second writes both.
  const la = await lane(TYPES);
  la.fill("Medic Card Old", "Paramedic"); la.fill("Net Card Old", "CompTIA Security+");
  const all = Array.from(la.doc.querySelectorAll(".cr-wl-saveall")).find((b) => /Save all filled shown/.test(txt(b)));
  all.click(); await sleep(60);
  check("(4) ⭐ the issuer lane's Save all holds the whole save on the first press when one merge crosses the groups",
    bodies(la).length === 0 && /^Blocked: Medic Card Old is cert-based .*Press Save all again/.test(txt(all.parentNode.querySelector(".cr-guard-note"))), txt(all.parentNode));
  all.click(); await sleep(150);
  check("(4) ⭐ pressed again, Save all writes both merges and logs the one override",
    field(of(la, "Medic Card Old"), "unified_title_merge_confirm").length === 1 && field(of(la, "Net Card Old"), "unified_title_merge_confirm").length === 1
    && field(bodies(la), "cpl_type_group_override").length === 1 && field(bodies(la), "cpl_type_group_override")[0].course_id === P + "Medic Card Old", JSON.stringify(bodies(la)));

  // ── (5) a 200 answer with no CPL types in it holds, and never leaves the button on "saving…" ──
  for (const body of [{}, { schema: 1, canonicals: null }]) {
    const e = await grid(body);
    tr = type(e, "EMT Basic", "Paramedic");
    tr.querySelector(".cr-grid-save").click(); await sleep(80);
    const sv = tr.querySelector(".cr-grid-save");
    check("(5) ⭐ the grid's Save on a 200 answer of " + JSON.stringify(body) + " holds with the guard's words, writes nothing, and the button reads Save again",
      bodies(e).length === 0 && /^The CPL types did not load, so this combine is held\. Try again\.$/.test(txt(tr.querySelector(".cr-guard-note")))
      && sv && !sv.disabled && txt(sv) === "Save", txt(tr.querySelector(".cr-guard-note")) + " | " + (sv ? txt(sv) + " disabled=" + sv.disabled : "no button"));
  }
  {
    const G = require("../combine_guard.js");
    const nul = await G.load(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(null) }));
    const bad = await G.load(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error("not JSON")) }));
    check("(5) load() resolves a miss, never a rejection, for a 200 answer of null or a body that is not JSON",
      nul.map === null && /carries no CPL types/.test(nul.error) && bad.map === null && /not JSON/.test(bad.error) && G.loaded() === null, JSON.stringify([nul, bad]));
  }

  // ── (8) a title with no CPL type recorded asks twice and logs ──
  const notRec = (w) => /^combine with CPL type not recorded \(/.test(w.value || "");
  const u = await grid(TYPES);
  tr = type(u, "Unrecorded Card", "CompTIA Security+");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(8) ⭐ an untyped title merged into a cert-based one asks on the first press, with nothing written",
    of(u, "Unrecorded Card").length === 0
    && txt(tr.querySelector(".cr-guard-note")) === "Unrecorded Card has no CPL type recorded, so this combine could join graded and cert-based records. Press again to combine.",
    txt(tr.querySelector(".cr-guard-note")));
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  const uw = of(u, "Unrecorded Card");
  check("(8) ⭐ the second press writes the merge and logs the override with the reason CPL type not recorded",
    uw.length === 3 && field(uw, "unified_title_merge_confirm")[0].value === "CompTIA Security+"
    && (field(uw, "cpl_type_group_override")[0] || {}).value === "combine with CPL type not recorded (Unrecorded Card): Unrecorded Card -> CompTIA Security+", JSON.stringify(uw));
  // graded into untyped, on the pending merges' Confirm merge.
  const ugo = await boot({ payload: PAYLOAD, overlay: [row("Basic EMT", "unified_title_override", "Unrecorded Badge")], types: TYPES });
  cerLane(ugo.doc, /Merge/).click(); await sleep(60);
  const ugRow = () => ugo.doc.querySelector('.cr-mg-row[data-ut="Basic EMT"]');
  ugRow().querySelector(".cr-mg-confirm").click(); await sleep(60);
  const ugNote = txt(ugRow().querySelector(".cr-guard-note"));
  check("(8) ⭐ a graded title merged into an untyped one asks on the first press, with nothing written",
    of(ugo, "Basic EMT").length === 0 && ugNote === "Unrecorded Badge has no CPL type recorded, so this combine could join graded and cert-based records. Press again to combine.", ugNote);
  ugRow().querySelector(".cr-mg-confirm").click(); await sleep(60);
  check("(8) ⭐ pressed again, it writes the merge into the untyped title and logs the override",
    field(of(ugo, "Basic EMT"), "unified_title_merge_confirm").length === 1 && notRec(field(of(ugo, "Basic EMT"), "cpl_type_group_override")[0] || {}),
    JSON.stringify(of(ugo, "Basic EMT")));
  // A chain whose end is untyped: Paramedic is saved to become Unrecorded Badge, so a cert-based merge into Paramedic
  // checks Paramedic's type (graded) and is blocked as a cross, never waved through as unknown.
  const uc = await boot({ payload: PAYLOAD, overlay: [row("Paramedic", "unified_title_override", "Unrecorded Badge"), row("Paramedic", "unified_title_merge_confirm", "Unrecorded Badge")], types: TYPES });
  tr = type(uc, "Medic Card Old", "Paramedic");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(8) ⭐ a chain ending on an untyped title reads the typed title before it: cert into Paramedic (saved to become Unrecorded Badge) is blocked as a cross",
    of(uc, "Medic Card Old").length === 0 && /^Blocked: Medic Card Old is cert-based .*the fold lands on Unrecorded Badge \(Paramedic is saved to become Unrecorded Badge\), which is graded .*the type of Paramedic, since Unrecorded Badge has no CPL type of its own/.test(txt(tr.querySelector(".cr-guard-note"))),
    txt(tr.querySelector(".cr-guard-note")));
  tr = type(uc, "Basic EMT", "Paramedic");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(8) the same chain takes a graded merge on one press, onto the untyped end, with no override",
    field(of(uc, "Basic EMT"), "unified_title_merge_confirm").length === 1 && field(of(uc, "Basic EMT"), "unified_title_merge_confirm")[0].value === "Unrecorded Badge"
    && !field(of(uc, "Basic EMT"), "cpl_type_group_override").length, JSON.stringify(of(uc, "Basic EMT")));
  // Two typed titles in one group still pass on one press, with the untyped entries in the file.
  const ut2 = await grid(TYPES);
  tr = type(ut2, "Net Card Old", "CompTIA Security+");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(8) ⭐ two typed titles in one group still merge on one press with no override", inside(ut2, "Net Card Old", "CompTIA Security+"), JSON.stringify(of(ut2, "Net Card Old")));
  // A title the file does not hold at all is untyped too: it asks, never holds.
  const MISSING = JSON.parse(JSON.stringify(TYPES));
  delete MISSING.canonicals["Security+ CompTIA"];
  const um = await grid(MISSING);
  tr = type(um, "Security+ CompTIA", "CompTIA Security+");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  const umFirst = of(um, "Security+ CompTIA").length === 0 && /^Security\+ CompTIA has no CPL type recorded/.test(txt(tr.querySelector(".cr-guard-note")));
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(8) a title missing from the file asks on the first press and writes on the second",
    umFirst && field(of(um, "Security+ CompTIA"), "unified_title_merge_confirm").length === 1 && notRec(field(of(um, "Security+ CompTIA"), "cpl_type_group_override")[0] || {}),
    JSON.stringify(of(um, "Security+ CompTIA")));
  // The issuer lane's Save all: an untyped merge holds the whole save on the first press as unknown.
  const lu = await lane(TYPES);
  lu.fill("Net Card Old", "Unrecorded Card");
  const allU = Array.from(lu.doc.querySelectorAll(".cr-wl-saveall")).find((b) => /Save all filled shown/.test(txt(b)));
  allU.click(); await sleep(60);
  const luFirst = bodies(lu).length === 0 && /^Unrecorded Card has no CPL type recorded/.test(txt(allU.parentNode.querySelector(".cr-guard-note")));
  allU.click(); await sleep(150);
  check("(8) ⭐ the issuer lane's Save all asks once for an untyped merge, then writes it with the override",
    luFirst && field(of(lu, "Net Card Old"), "unified_title_merge_confirm").length === 1 && notRec(field(of(lu, "Net Card Old"), "cpl_type_group_override")[0] || {}),
    txt(allU.parentNode) + " | " + JSON.stringify(bodies(lu)));

  // ── (6) the grid shows the title written; the confirm names a held collision along the chain ──
  // Security+ CompTIA is saved to become CompTIA Security+, an existing credential, with no merge confirm: the rename
  // apply holds it. A merge picked onto Security+ CompTIA lands on CompTIA Security+ and the dialog says so.
  const hc = await boot({ payload: PAYLOAD, overlay: [row("Security+ CompTIA", "unified_title_override", "CompTIA Security+")], types: TYPES });
  tr = type(hc, "Net Card Old", "Security+ CompTIA");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  const hcIn = rowByTitle(hc.doc, "CompTIA Security+") || tr;
  check("(6) ⭐ the confirm says in words that the chain runs through a saved rename held as an unconfirmed collision",
    hc.confirms.length === 1 && /never confirmed as a merge \(“Security\+ CompTIA” to “CompTIA Security\+”\)\. The rename apply holds that rename/.test(hc.confirms[0]), hc.confirms.join(" || "));
  check("(6) ⭐ after the save, the grid's title cell shows the title written, the end of the chain",
    field(of(hc, "Net Card Old"), "unified_title_override")[0].value === "CompTIA Security+" && tr.querySelector(".cr-title-in").value === "CompTIA Security+",
    tr.querySelector(".cr-title-in").value + " | " + JSON.stringify(of(hc, "Net Card Old")) + " | " + (hcIn === tr));
  const hk = await boot({ payload: PAYLOAD, overlay: [row("Security+ CompTIA", "unified_title_override", "CompTIA Security+"), row("Security+ CompTIA", "unified_title_merge_confirm", "CompTIA Security+")], types: TYPES });
  tr = type(hk, "Net Card Old", "Security+ CompTIA");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  check("(6) a confirmed rename along the chain adds no such words", hk.confirms.length === 1 && !/never confirmed/.test(hk.confirms[0]), hk.confirms.join(" || "));

  // ── the second press is armed per surface ──
  // A block on the grid's Save never arms the issuer lane's Save for the same merge: the lane's first press blocks too.
  const ps = await grid(TYPES);
  tr = type(ps, "Medic Card Old", "Paramedic");
  tr.querySelector(".cr-grid-save").click(); await sleep(60);
  const gridBlocked = /^Blocked:/.test(txt(tr.querySelector(".cr-guard-note")));
  cerLane(ps.doc, /No issuer/).click(); await sleep(60);
  const psr = Array.from(ps.doc.querySelectorAll(".cr-ni-row")).find((r) => r.getAttribute("data-ut") === "Medic Card Old");
  if (psr) {
    psr.querySelector(".cr-ni-title-input").value = "Paramedic"; psr.querySelector(".cr-ni-input").value = "National Registry";
    psr.querySelector(".cr-ni-save").click(); await sleep(60);
  }
  check("(1) the second press is armed per surface: a block on the grid's Save leaves the issuer lane's first press blocked too",
    gridBlocked && psr && of(ps, "Medic Card Old").length === 0 && /^Blocked: Medic Card Old is cert-based/.test(txt(psr.querySelector(".cr-guard-note"))), psr ? txt(psr) : "no lane row");

  // ── (7) one copy ──
  const src = fs.readFileSync("credential_reference.js", "utf8"), ex = fs.readFileSync("exhibits.js", "utf8");
  check("(7) ⭐ both tabs decide through combine_guard.js and neither holds a copy of its logic",
    /CPL_COMBINE_GUARD/.test(src) && /CPL_COMBINE_GUARD/.test(ex) && ![src, ex].some((s) => /combine across groups: |has\.graded && has\.cert|function landing\(|function foldLanding\(/.test(s)));
  const pages = ["CPL_Dashboard.html", "index.html"].map((f) => fs.readFileSync(f, "utf8"));
  check("(7) both HTMLs load the guard before credential_reference.js",
    pages.every((h) => h.indexOf('<script src="combine_guard.js"></script>') > 0 && h.indexOf('<script src="combine_guard.js"></script>') < h.indexOf('<script src="credential_reference.js"></script>')));
  check("(7) Pages serves the guard", /^publish combine_guard\.js$/m.test(fs.readFileSync(".github/pages_allowlist.txt", "utf8")));

  const failed = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n     " + r[2])));
  console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
