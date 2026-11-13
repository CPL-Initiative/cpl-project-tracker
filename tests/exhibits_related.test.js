// Related titles and the rename batch (Sam, 2026-11-11). The noncredit Automotive cards with ASE certification names
// ("Noncredit for AUTO P1") kept returning to Another look: he went back and forth because the card did not show which
// canonical titles already exist for the same certification. These checks pin what he asked for:
//   - an ASE P1 card shows the existing ASE titles in a side panel, the same test first, then the same series, then
//     ASE's other titles, each with its issuer, its local titles and whether it is in the reference or proposed;
//   - Use this title fills the proposed title (and the issuer that title carries);
//   - an old-format title is marked Rename pending until the batch decides it;
//   - the batch is one card in Review: current and proposed title, local titles, colleges, students; an edit and a
//     skip are honored; approving writes the rename rows the credential rename dry run already reads, the title that
//     leads a group first and a merge confirm for the ones that fold into it; signed out, nothing is written;
//   - nothing is written by opening the batch, and a renamed title is found by its old name in the List's search words.
//
// Run from repo root: `npm test` (or `node tests/exhibits_related.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const ASE = "National Institute for Automotive Service Excellence (ASE)";
const CCC = "California Community Colleges";
const REVIEW = { schema: 1, written_at: "2026-11-11T07:50:00Z", sources: { procedures_run: "2026-11-11T07:47:00Z" },
  tiles: { names: { n: 10, of: 12, waiting: 2 }, aligned: { n: 0, of: 2 }, saved_not_folded: 0 }, steps: {},
  colleges: ["Las Positas College"],
  held: [
    { raw: "Noncredit for AUTO T2", step: "Proposed", title: "Diesel Engines (ASE T2)", issuer: CCC, ids: ["X-1"], art: [0], could: [], under: [], under_count: 0, exists: false },
    { raw: "CompTIA Security Plus exam", step: "Proposed", title: "CompTIA Security+", issuer: "CompTIA", ids: ["X-2"], art: [0], could: [], under: [], under_count: 0, exists: true }] };
const SWEEP = { schema: 1, generated_at: "2026-11-11T07:52:00Z", rules: [{ id: "ase", label: "ASE", tip: "ASE tip" }], counts: { ase: 1 },
  cards: [{ id: "c-p1", rules: ["ase"], current: "Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)",
    proposed: "Medium/Heavy Truck Parts Specialist (ASE P1)", why: ["ASE P1's official name is Medium/Heavy Truck Parts Specialist"], issuer: CCC,
    locals: [{ raw: "Noncredit for AUTO P1", colleges: [], course: "", credit: "" }],
    proposed_exists: false, proposed_locals: 0, proposed_issuer: "", current_locals: 1, moves_all: true }] };
const ISSUERS = [CCC, "CompTIA", ASE];
function row(current, proposed, kind, issuer, locals, adopted, extra) {
  return Object.assign({ current: current, proposed: proposed, kind: kind, kind_label: kind, why: "why", codes: [], issuer: issuer,
    locals: locals, adopted: adopted, ids: ["E-" + current] }, extra || {});
}
const RELATED = { schema: 1, generated_at: "2026-11-11T07:55:00Z",
  rule: { id: "cert-name-first", set_by: "Sam", date: "2026-11-11", words: "Use the cert's official name first and the code in parentheses", notes: ["n"] },
  issuers: ISSUERS,
  paths: { ic: { words: "industry certification", assessed_by: "issuer" }, cx: { words: "credit by exam", assessed_by: "college" },
    pr: { words: "portfolio", assessed_by: "college" }, sa: { words: "exam score", assessed_by: "issuer" }, other: { words: "another path", assessed_by: "" } },
  titles: [
    ["ASE A5 — Brakes", 2, 14, 23, 0, [], [["ic", 9], ["cx", 2]]],
    ["ASE Bundle — P1, P2", 2, 1, 1, 0],
    ["ASE P1 — Medium/Heavy Truck Parts Specialist", 2, 3, 2, 0],
    ["ASE P2 — Automobile Parts Specialist", 2, 2, 1, 0],
    ["ASE T2 — Diesel Engines", 2, 4, 3, 0],
    ["Automotive Technology (ASE A5 Brakes)", 0, 7, 6, 0, [], [["ic", 1], ["cx", 5]]],
    ["Automotive Technology (ASE P1 Medium-Heavy Truck Parts Specialist certification)", 0, 1, 0, 0],
    ["CompTIA Network+", 1, 5, 9, 0],
    ["CompTIA Security+", 1, 6, 12, 0, ["Security Plus"]],
    ["Guitar 1", 0, 2, 2, 0, ["Guitar I", "Class Guitar"]],
    ["Parts Counter Specialist (ASE P2)", 0, 1, 0, 1],
    ["Security Operations", 0, 1, 1, 0]],
  pending: { "ASE A5 — Brakes": "Brakes (ASE A5)", "Automotive Technology (ASE A5 Brakes)": "Brakes (ASE A5)",
    "ASE P1 — Medium/Heavy Truck Parts Specialist": "Medium/Heavy Truck Parts Specialist (ASE P1)", "ASE Bundle — P1, P2": "" },
  batches: [{ id: "ase", label: "ASE", issuer: ASE, format: "<Official cert name> (ASE <code>)", fits: 0, left_to_cards: 1, with_proposal: 3, rows: [
    row("ASE A5 — Brakes", "Brakes (ASE A5)", "code-first", ASE, 14, 23, { merge: false, twins: ["Automotive Technology (ASE A5 Brakes)"], paths: [["ic", 9], ["cx", 2]] }),
    row("Automotive Technology (ASE A5 Brakes)", "Brakes (ASE A5)", "program-first", CCC, 7, 6, { merge: true, twins: ["ASE A5 — Brakes"] }),
    row("ASE P1 — Medium/Heavy Truck Parts Specialist", "Medium/Heavy Truck Parts Specialist (ASE P1)", "code-first", ASE, 3, 2),
    row("ASE Bundle — P1, P2", "", "several", ASE, 1, 1)] }],
  waiting: ["CompTIA", "AWS", "NCCER"],
  // A credential family (Sam, 2026-11-11: each ASE bundle stays its own title and carries the family).
  families: { "ASE Certificate Bundles": { issuer: ASE, about: "A college's own set of ASE tests.",
    members: { "ASE Bundle — P1, P2": ["ASE P1", "ASE P2"] } } } };

function load(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/" + (opts.hash || "#exhibits"), runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    function ok(obj) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(obj))); } }); }
    function bad(status) { return Promise.resolve({ ok: false, status: status, json: function () { return Promise.resolve({}); } }); }
    if (url === "kb/exhibits_review.json") return ok(REVIEW);
    if (url === "kb/exhibits_sweep.json") return ok(SWEEP);
    if (url === "kb/exhibits_related.json") return opts.noRelated ? bad(404) : ok(RELATED);
    if (/\/rest\/v1\/rpc\/exhibit_title_students$/.test(url)) {
      return ok((init.body && /E-ASE A5/.test(init.body)) ? [{ key: "ASE A5 — Brakes", students: 41, suppressed: false },
        { key: "Automotive Technology (ASE A5 Brakes)", students: null, suppressed: true }] : []);
    }
    if (/\/rest\/v1\/kb_curation\?select=/.test(url)) return opts.savedFail ? bad(503) : ok(opts.saved || []);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return bad(404);
  };
  const sess = opts.signedIn ? { access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccccccccc", email: "reviewer@example.org" } : null;
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.cplCollegeShort = function (n) { return n.replace(/ College$/, ""); };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }
async function settle() { for (let i = 0; i < 8; i++) await tick(); }
function byText(d, sel, t) { return Array.from(d.querySelectorAll(sel)).find(function (b) { return txt(b) === t; }); }
function stepTile(d, label) { return Array.from(d.querySelectorAll(".exh-step")).find(function (b) { return txt(b.querySelector(".exh-sl")) === label; }); }
function writes(t) { return t.calls.filter(function (c) { return c.method === "POST" && /kb_curation/.test(c.url); }); }
function rowsOf(t) { return writes(t).reduce(function (a, c) { return a.concat(c.body); }, []); }
function panel(d) { return d.querySelector("aside.exh-rel"); }
function panelTitles(d) { return Array.from(panel(d).querySelectorAll(".exh-rel-t")).map(txt); }
function item(d, title) { return Array.from(panel(d).querySelectorAll(".exh-rel-list li")).find(function (li) { return txt(li.querySelector(".exh-rel-t")) === title; }); }

(async function () {
  // ── the ASE P1 card in Another look ──
  let t = load({ signedIn: true });
  await t.M.boot(); await settle();
  stepTile(t.d, "Another look").click(); await settle();
  check("the P1 card proposes the title Sam ruled", t.d.getElementById("exh-sw-title").value === "Medium/Heavy Truck Parts Specialist (ASE P1)");
  check("the card has a side panel named Related titles, beside it", panel(t.d) && txt(panel(t.d).querySelector("h4")) === "Related titles"
    && panel(t.d).parentNode.className === "exh-with-rel" && !!panel(t.d).parentNode.querySelector("section.exh-card"));
  let names = panelTitles(t.d);
  check("an ASE P1 card shows the existing ASE titles", names.indexOf("ASE P1 — Medium/Heavy Truck Parts Specialist") >= 0
    && names.indexOf("ASE P2 — Automobile Parts Specialist") >= 0 && names.indexOf("ASE A5 — Brakes") >= 0);
  check("the same test comes first, the test alone ahead of a bundle that holds it",
    names[0] === "ASE P1 — Medium/Heavy Truck Parts Specialist" && names[1] === "ASE Bundle — P1, P2");
  check("then the same series, then ASE's other titles",
    names.indexOf("ASE P2 — Automobile Parts Specialist") < names.indexOf("ASE A5 — Brakes")
    && names.indexOf("Parts Counter Specialist (ASE P2)") < names.indexOf("ASE T2 — Diesel Engines"));
  check("the groups are named", ["The same test, ASE P1", "The same series, ASE P", "Other ASE titles"].every(function (h) { return !!byText(t.d, ".exh-rel-tier", h); }));
  check("the card's own current title is not offered back", names.indexOf(SWEEP.cards[0].current) < 0);
  check("no title outside the family is listed", names.indexOf("CompTIA Security+") < 0 && names.indexOf("Guitar 1") < 0);
  let li = item(t.d, "ASE P1 — Medium/Heavy Truck Parts Specialist");
  check("a title shows its issuer, its local titles and that it is in the reference",
    new RegExp(ASE.replace(/[()]/g, "\\$&") + " · 3 local titles · In the reference").test(txt(li)));
  check("a family member names its family on its row, in words", /· Family: ASE Certificate Bundles/.test(txt(item(t.d, "ASE Bundle — P1, P2")))
    && !/Family:/.test(txt(item(t.d, "ASE P2 — Automobile Parts Specialist"))));
  check("a proposed title says it is not in the reference yet", /1 local title · Proposed, not in the reference yet/.test(txt(item(t.d, "Parts Counter Specialist (ASE P2)"))));
  check("an old-format title is marked Rename pending, with the title proposed for it",
    /Rename pending: Medium\/Heavy Truck Parts Specialist \(ASE P1\)/.test(txt(li)) && /Rename pending/.test(txt(item(t.d, "ASE A5 — Brakes"))));
  // Sam's rulings on #3110: each local exhibit carries its own path and assessor, read from its MAP id.
  check("a title shows its local exhibits by path, each with who assessed the student",
    /Local exhibits: 9 by industry certification, assessed by ASE; 2 by credit by exam, assessed by the college/.test(txt(item(t.d, "ASE A5 — Brakes"))));
  check("under a college-issued title an industry certification is assessed by the credential's issuer, never the college",
    /1 by industry certification, assessed by the credential's issuer; 5 by credit by exam, assessed by the college/.test(txt(item(t.d, "Automotive Technology (ASE A5 Brakes)"))));
  check("a title with no exhibits on record shows no path line", !/Local exhibits:/.test(txt(item(t.d, "ASE P2 — Automobile Parts Specialist"))));
  check("a title in the new format carries no such mark", !/Rename pending/.test(txt(item(t.d, "Parts Counter Specialist (ASE P2)"))));
  const use = byText(li, "button", "Use this title");
  check("each has a Use this title control, named for its title", use && use.getAttribute("aria-label") === "Use this title: ASE P1 — Medium/Heavy Truck Parts Specialist");
  use.click(); await settle();
  check("Use this title fills the proposed title", t.d.getElementById("exh-sw-title").value === "ASE P1 — Medium/Heavy Truck Parts Specialist");
  check("and the issuer that title carries", t.d.getElementById("exh-sw-issuer").value === ASE);
  check("the title in the box is no longer offered", /This is the proposed title\./.test(txt(item(t.d, "ASE P1 — Medium/Heavy Truck Parts Specialist"))));
  check("nothing has been written yet", writes(t).length === 0);
  byText(t.d, ".exh-acts button", "Change to Proposed Title").click(); await settle();
  let rows = rowsOf(t);
  check("Change then folds the local title into the existing title, with its issuer",
    rows.some(function (r) { return r.course_id === "_UNCLASSIFIED::Noncredit for AUTO P1" && r.field === "unified_title_assignment" && r.value === "ASE P1 — Medium/Heavy Truck Parts Specialist"; })
    && rows.some(function (r) { return r.field === "issuing_agency_assignment" && r.value === ASE; })
    && !rows.some(function (r) { return /^_CREDENTIAL_REVIEW::/.test(r.course_id); }));

  // ── a Review card: the new format, the issuer left to the card, the panel following the title ──
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  // Sam's ruling 1 on #3110 (2026-11-11): the canonical title carries the credential's issuer, so the format names ASE.
  check("a new ASE card in Review arrives in the format, its issuer the certification's",
    t.d.getElementById("exh-title").value === "Diesel Engines (ASE T2)" && t.d.getElementById("exh-issuer").value === ASE);
  names = panelTitles(t.d);
  check("its panel leads with the same test", names[0] === "ASE T2 — Diesel Engines");
  item(t.d, "ASE T2 — Diesel Engines").querySelector("button").click(); await settle();
  check("Use this title fills a Review card's title and issuer too",
    t.d.getElementById("exh-title").value === "ASE T2 — Diesel Engines" && t.d.getElementById("exh-issuer").value === ASE);
  const box = t.d.getElementById("exh-title");
  box.value = "Brakes (ASE A5)"; box.dispatchEvent(new t.w.Event("input")); await settle();
  check("the panel follows the title as it is edited", panelTitles(t.d)[0] === "ASE A5 — Brakes" && !!byText(t.d, ".exh-rel-tier", "The same test, ASE A5"));
  byText(t.d, ".exh-acts button", "Skip").click(); await settle();
  names = panelTitles(t.d);
  check("a card outside ASE lists titles with its issuer and words in common, the nearest first",
    names[0] === "CompTIA Security+" && names.indexOf("CompTIA Network+") >= 0 && names.indexOf("ASE A5 — Brakes") < 0);
  check("the families read: an ASE code from the local title, none for another issuer",
    t.M._aseOf("", "Noncredit for AUTO P1", "").code === "P1" && t.M._aseOf("CompTIA Security+", "CompTIA exam", "CompTIA") === null
    && t.M._aseOf("Phase Change", "Phase Change lab", "") === null);
  check("a renamed title is found by the names it carried: the List's search words hold them",
    t.M._akaOf("Guitar 1").join("|") === "Guitar I|Class Guitar" && /akaOf\(r\.ut\)\.join/.test(src));
  check("the List finds a member by its family and its tests, and filters to the family with its count",
    t.M._famOf("ASE Bundle — P1, P2").aliases.join("|") === "ASE P1|ASE P2" && t.M._famOf("ASE P2 — Automobile Parts Specialist") === null
    && /famOf\(r\.ut\)\.name \+ " \| " \+ famOf\(r\.ut\)\.aliases\.join/.test(src)
    && /if \(L\.fam && !\(famOf\(r\.ut\) && famOf\(r\.ut\)\.name === L\.fam\)\) return false;/.test(src)
    && /"Showing the family " \+ famWords\(L\.fam\)/.test(src));

  // ── the rename batch ──
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  const tile = stepTile(t.d, "Rename batch");
  check("Review has a Rename batch tile with the rows that wait", tile && txt(tile.querySelector(".exh-sn")) === "4" && /Nothing is renamed until you approve/.test(tile.getAttribute("data-tip")));
  tile.click(); await settle();
  const bcard = t.d.querySelector("section.exh-rb");
  check("the batch is one card, named for its issuer and count", bcard && txt(bcard.querySelector("h3")) === "ASE titles to rename (4)" && t.d.querySelectorAll("section.exh-rb").length === 1);
  check("it says the format and Sam's words", /<Official cert name> \(ASE <code>\)/.test(txt(bcard)) && /Sam, 2026-11-11: “Use the cert's official name first/.test(txt(bcard)));
  check("it names the issuers that wait", /Waiting until this one is decided: CompTIA, AWS, NCCER\./.test(txt(t.d.getElementById("exhibits-root"))));
  const heads = Array.from(bcard.querySelectorAll("thead th")).map(txt);
  check("the table has a header cell for every column, each scoped", heads.join("|") === "Current title|Proposed title|Local titles|Colleges|Students|Decision"
    && Array.from(bcard.querySelectorAll("thead th")).every(function (h) { return h.getAttribute("scope") === "col"; })
    && bcard.querySelector(".exh-rb-scroll").getAttribute("role") === "region" && !!bcard.querySelector(".exh-rb-scroll").getAttribute("aria-label"));
  const trs = Array.from(bcard.querySelectorAll("tbody tr"));
  check("a row shows the current title, the proposed title in a box, its local titles, its colleges and its students",
    txt(trs[0].querySelector(".exh-rb-cur")) === "ASE A5 — Brakes" && trs[0].querySelector("input").value === "Brakes (ASE A5)"
    && txt(trs[0].children[2]) === "14" && txt(trs[0].children[3]) === "23 articulate it" && txt(trs[0].children[4]) === "41");
  check("a batch row shows its local exhibits' paths, so a fold keeps each exhibit's own assessor in view",
    /Local exhibits: 9 by industry certification, assessed by ASE; 2 by credit by exam, assessed by the college/.test(txt(trs[0].children[0])));
  check("a student count under ten is never shown", txt(trs[1].children[4]) === "Fewer than 10");
  check("a title with no students reads None", txt(trs[2].children[4]) === "None");
  // #3228 (Sam, 2026-11-13): a row read "Renamed" before any save, and he took the unsaved plan for a decision.
  check("each row says what approving will do, and nothing reads as renamed before the save",
    /^Renames on approval\b/.test(txt(trs[0].children[5])) && /Folds into the title of that name on approval/.test(txt(trs[1].children[5]))
    && /Left as it is/.test(txt(trs[3].children[5])) && !trs.some(function (tr) { return /^Renamed\b/.test(txt(tr.children[5])); }));
  check("opening the batch writes nothing", writes(t).length === 0);
  let go = Array.from(bcard.querySelectorAll(".exh-acts button"))[0];
  check("the approval control counts the renames", txt(go) === "Approve the batch (3 renames)");
  // Edit one, skip one.
  const edit = t.d.querySelectorAll("section.exh-rb tbody tr")[2].querySelector("input");
  edit.value = "Truck Parts Specialist (ASE P1)"; edit.dispatchEvent(new t.w.Event("input"));
  byText(t.d.querySelectorAll("section.exh-rb tbody tr")[1], "button", "Skip").click(); await settle();
  check("a skipped row says it keeps its title and offers Include",
    /Skipped: keeps its title/.test(txt(t.d.querySelectorAll("section.exh-rb tbody tr")[1])) && !!byText(t.d.querySelectorAll("section.exh-rb tbody tr")[1], "button", "Include"));
  check("the edit survives the redraw", t.d.querySelectorAll("section.exh-rb tbody tr")[2].querySelector("input").value === "Truck Parts Specialist (ASE P1)");
  go = Array.from(t.d.querySelectorAll("section.exh-rb .exh-acts button"))[0];
  check("the count follows the skip", txt(go) === "Approve the batch (2 renames)");
  go.click(); await settle();
  check("approving asks first, saying what is renamed, skipped and left", /Save 2 renames, and 1 skipped so they do not come back\?/.test(txt(t.d.querySelector("section.exh-rb")))
    && /1 stay as they are, still in this batch\./.test(txt(t.d.querySelector("section.exh-rb"))) && writes(t).length === 0);
  byText(t.d, "section.exh-rb .exh-acts button", "Save the batch").click(); await settle();
  rows = rowsOf(t);
  const of = function (id, field) { return rows.find(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::" + id && r.field === field; }); };
  check("an approved row saves the rename the dry run reads, under the credential's own key",
    of("ASE A5 — Brakes", "unified_title_override") && of("ASE A5 — Brakes", "unified_title_override").value === "Brakes (ASE A5)"
    && of("ASE A5 — Brakes", "unified_title_override").reviewer_email === "reviewer@example.org");
  check("an edited title is the one saved", of("ASE P1 — Medium/Heavy Truck Parts Specialist", "unified_title_override").value === "Truck Parts Specialist (ASE P1)");
  check("a skipped row saves the proposal declined, and no rename",
    of("Automotive Technology (ASE A5 Brakes)", "cert_rename_kept") && of("Automotive Technology (ASE A5 Brakes)", "cert_rename_kept").value === "Brakes (ASE A5)"
    && !of("Automotive Technology (ASE A5 Brakes)", "unified_title_override"));
  check("a row with no proposed title is not written at all", !rows.some(function (r) { return /Bundle/.test(r.course_id); }));
  check("no local title's assignment is touched: the batch writes credential rows only",
    rows.length === 3 && rows.every(function (r) { return /^_CREDENTIAL_REVIEW::/.test(r.course_id); }));
  check("the saved rows leave the batch and the note says nothing a college sees has changed",
    txt(t.d.querySelector("section.exh-rb h3")) === "ASE titles to rename (1)" && /Saved 2 renames and 1 skipped\./.test(txt(t.d.querySelector(".exh-status")))
    && /each old title stays a search alias/.test(txt(t.d.querySelector(".exh-status"))));
  stepTile(t.d, "Another look").click(); await settle();
  check("a decided title is no longer marked Rename pending in the panel", !/Rename pending/.test(txt(item(t.d, "ASE A5 — Brakes"))));

  // Two titles for one certification, both approved: the one that leads is saved first, the other with a merge confirm.
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  const plan = t.M._renamePlan(RELATED.batches[0]);
  rows = t.M._renameRows("r@example.org", plan, "2026-11-11T12:00:00.000Z");
  const lead = rows.find(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::ASE A5 — Brakes" && r.field === "unified_title_override"; });
  const twin = rows.filter(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::Automotive Technology (ASE A5 Brakes)"; });
  check("ASE's own title leads the group and is saved first", lead && lead.reviewed_at === "2026-11-11T12:00:00.000Z"
    && !rows.some(function (r) { return r.course_id === lead.course_id && r.field === "unified_title_merge_confirm"; }));
  check("the title that folds into it is saved after, with the merge confirmed to that exact title",
    twin.length === 2 && twin.every(function (r) { return r.value === "Brakes (ASE A5)" && r.reviewed_at === "2026-11-11T12:00:01.000Z"; })
    && twin.some(function (r) { return r.field === "unified_title_merge_confirm"; }));

  // A row decided since the file was built has left the batch.
  t = load({ signedIn: true, saved: [{ course_id: "_CREDENTIAL_REVIEW::ASE A5 — Brakes", field: "unified_title_override", value: "Brakes (ASE A5)", reviewed_at: "2026-11-11T09:00:00Z" },
    { course_id: "_CREDENTIAL_REVIEW::ASE Bundle — P1, P2", field: "cert_rename_kept", value: "something else", reviewed_at: "2026-11-11T09:00:00Z" }] });
  await t.M.boot(); await settle();
  check("a rename saved after the file was built is read back and leaves the batch; a skip of another proposal does not",
    t.M._renameCount() === 3 && t.calls.some(function (c) { return /field=in\.\(unified_title_override,cert_rename_kept\)/.test(c.url) && /reviewed_at=gt\./.test(c.url); }));

  // #3228: a skip on a row with no proposed title saved nothing on main, so the row came back with every rebuild.
  t = load({ signedIn: true, hash: "#exhibits/rename-batch" });
  await t.M.boot(); await settle();
  byText(t.d.querySelectorAll("section.exh-rb tbody tr")[3], "button", "Skip").click(); await settle();
  Array.from(t.d.querySelectorAll("section.exh-rb tbody tr")).forEach(function (tr, i) {
    if (i < 3) byText(tr, "button", "Skip").click();
  });
  await settle();
  Array.from(t.d.querySelectorAll("section.exh-rb .exh-acts button"))[0].click(); await settle();
  byText(t.d, "section.exh-rb .exh-acts button", "Save the batch").click(); await settle();
  const kept = rowsOf(t).find(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::ASE Bundle — P1, P2"; });
  check("a skip on a row with no proposed title saves the title kept as it is, and the row leaves the batch",
    kept && kept.field === "cert_rename_kept" && kept.value === "ASE Bundle — P1, P2" && t.M._renameCount() === 0);
  t = load({ signedIn: true, saved: [{ course_id: "_CREDENTIAL_REVIEW::ASE Bundle — P1, P2", field: "cert_rename_kept", value: "ASE Bundle — P1, P2", reviewed_at: "2026-11-11T09:00:00Z" }] });
  await t.M.boot(); await settle();
  check("and read back on the next visit, that keep holds the row out", t.M._renameCount() === 3);
  // #3228 fix 1: a failed read of the saved decisions left the file's rows with no word on main.
  t = load({ signedIn: true, hash: "#exhibits/rename-batch", savedFail: true });
  await t.M.boot(); await settle();
  check("when the saved decisions cannot be read, the batch says so and that a decided row may show again",
    /could not be read from COBI \(HTTP 503\), so a row decided since then may show again here/.test(txt(t.d.querySelector(".exh-unread")))
    && t.d.querySelector(".exh-unread").getAttribute("role") === "status");

  // Signed out: the batch reads, and nothing saves.
  t = load({ hash: "#exhibits/rename-batch" });
  await t.M.boot(); await settle();
  check("#exhibits/rename-batch opens the batch", !!t.d.querySelector("section.exh-rb") && stepTile(t.d, "Rename batch").getAttribute("aria-pressed") === "true");
  check("signed out, students read Reviewers only", txt(t.d.querySelector("section.exh-rb tbody tr").children[4]) === "Reviewers only");
  Array.from(t.d.querySelectorAll("section.exh-rb .exh-acts button"))[0].click(); await settle();
  byText(t.d, "section.exh-rb .exh-acts button", "Save the batch").click(); await settle();
  check("signed out, approving writes nothing and says to sign in",
    writes(t).length === 0 && /Sign in as a reviewer to save\./.test(txt(t.d.querySelector(".exh-status"))) && t.M._renameCount() === 4);

  // The file could not be read: the card still works.
  t = load({ signedIn: true, noRelated: true });
  await t.M.boot(); await settle();
  check("without the file the card still draws, the panel says why, and the batch tile is off",
    !!t.d.getElementById("exh-title") && /could not be read/.test(txt(panel(t.d))) && stepTile(t.d, "Rename batch").disabled);

  // The rule's notes sit in the Rules view, never on a card.
  t = load({ signedIn: true, hash: "#exhibits/rules" });
  t.M._state.sw.data = null;
  await t.M.boot(); await settle();
  t.M._state.sw.data = { rules: [{ id: "ase", label: "ASE", tip: "tip", ruling: { who: "Sam", date: "2026-11-11", words: "official name first" },
    notes: ["Three paths.", "Credit by exam, mirrored.", "Credit by exam, not mirrored.", "Industry certification.", "All three point to the same title."] }], cards: [] };
  t.M.render(); await settle();
  const notes = t.d.querySelector(".exh-rule-notes");
  check("the Rules view shows the ruling and the rule's notes, the three paths numbered",
    notes && notes.querySelectorAll("ol li").length === 3 && /Sam, 2026-11-11: “official name first”/.test(txt(t.d.getElementById("exhibits-root"))));
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  t.d.querySelectorAll(".exh-step")[5] && stepTile(t.d, "Another look").click(); await settle();
  check("the card carries none of the notes", !/mirrored/.test(txt(t.d.querySelector("section.exh-card"))));
  const store = JSON.parse(fs.readFileSync("kb/cer_procedures.json", "utf8")).procedures.find(function (p) { return p.id === "ase-paren"; });
  check("the classifier's ASE guidance is the ruling, amended by Sam on 2026-11-11, with the notes",
    /official name, then its code in parentheses/.test(store.rule) && store.amended[0].date === "2026-11-11" && store.notes.length === 5);

  // ── a credential family (#3117): reads reviewed, its exceptions listed, its members proposed in the family form ──
  const FAMN = "ASE Certificate Bundles", MEM = "ASE Bundle — P1, P2", FAMT = "ASE Certificate Bundles: P1 + P2 with MACS/609";
  RELATED.families[FAMN].exceptions = [{ title: MEM, mix: "P1, P2 + MACS/609", tests: ["P1", "P2"], with: ["MACS/609"] }];
  RELATED.batches[0].rows[3] = row(MEM, FAMT, "family", ASE, 1, 1, { merge: false, kind_label: "A family bundle, named family plus its tests" });
  t = load({ signedIn: true });
  await t.M.boot(); await settle();
  check("a family member whose fold rows the conversion removed reads Family set, never Unreviewed",
    t.M._listStatus({ ut: MEM }) === "Family set" && t.M._listStatus({ ut: "Security Operations" }) === "Unreviewed");
  check("the List reads the family live from kb_curation too", /FIELD_CRED_FAMILY = "credential_family"/.test(src)
    && /FIELD_MERGE_CONFIRM,[A-Z_, ]*FIELD_CRED_FAMILY\]\.join/.test(src) && /row\.field === FIELD_CRED_FAMILY\) o\.family/.test(src));
  stepTile(t.d, "Rename batch").click(); await settle();
  const fx = t.d.querySelector("section.exh-famx");
  check("Review lists the family's titles to code by hand, as one card", fx && txt(fx.querySelector("h3")) === FAMN + ": titles to code by hand (1)"
    && t.d.querySelectorAll("section.exh-famx").length === 1);
  check("each row shows the mix as written, its ASE tests and what joins them with", fx && Array.from(fx.querySelectorAll("tbody td")).map(txt).join("|") === "P1, P2 + MACS/609|P1, P2|MACS/609"
    && txt(fx.querySelector("tbody th")) === MEM && Array.from(fx.querySelectorAll("th")).every(function (h) { return h.getAttribute("scope"); })
    && fx.querySelector(".exh-rb-scroll").getAttribute("role") === "region");
  const famTr = Array.from(t.d.querySelectorAll("section.exh-rb:not(.exh-famx) tbody tr")).find(function (tr) { return txt(tr.querySelector(".exh-rb-cur")) === MEM; });
  check("the rename batch proposes the member in the family form, for one approval", famTr && famTr.querySelector("input").value === FAMT
    && /A family bundle/.test(txt(famTr)) && writes(t).length === 0);
  rows = t.M._renameRows("r@example.org", t.M._renamePlan(RELATED.batches[0]), "2026-11-11T12:00:00.000Z");
  check("approving saves the family title as the member's rename, which keeps its old title as an alias",
    rows.some(function (r) { return r.course_id === "_CREDENTIAL_REVIEW::" + MEM && r.field === "unified_title_override" && r.value === FAMT; }));

  const failed = results.filter(function (r) { return !r[1]; });
  results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log((results.length - failed.length) + "/" + results.length + " checks passed");
  process.exit(failed.length ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
