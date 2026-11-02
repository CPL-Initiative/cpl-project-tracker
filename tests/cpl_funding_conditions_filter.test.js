// The funding tab's four asks of 2026-11-02 (Sam, S554):
//   1. "I need to be able to edit Eligibility Requirements text but don't see that I can"
//   2. "Add a filter to the college table to show colleges that have or have not met the 3
//      conditions or attested to the NC lead."
//   3. "Add a link to the college landing page next to the CPL Coordinator condition on the
//      college rows"
//   4. "Make sure I can edit text areas on the Internal or Public sites"
//
// What fails without the change:
//   B1-B4  the filter: no #cplFundCondFilter; or a filter that disagrees with the gate the
//          pie and the released figure read (baselineGate); or one the count line ignores.
//   B5     the Noncredit CPL Lead choices: absent, or counting an institution with no
//          noncredit share.
//   B6     the landing page link only beside a MET coordinator condition (the old rule).
//   B7-B9  the minimum conditions' words: the Noncredit CPL Lead line typed into
//          requirementsList(), so no curator could change it; and the sentence under the
//          list typed into the Internal view.
//   B10    the public page's refs: an item the page's Edit this page cannot address.
//
// Windows: 3 booted (the harness budget note).
// Run from repo root: `npm test` (or `node tests/cpl_funding_conditions_filter.test.js`).
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, check, finish, openDrill } = H;

const QUAL = "Laney";   // meets all three conditions
const HELD = "Butte";   // meets none
const VET_REQ = "Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP";
const flat = (el) => (el ? el.textContent : "").replace(/\s+/g, " ").trim();

function setup(shared, elig, perf) {
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = Object.assign({ as_of: "2026-11-01", suppress_below: 10,
    statewide: { pa_u: 300000 }, colleges: { [QUAL]: { pa_u: 900 }, [HELD]: { pa_u: 600 } },
    feeders: {}, unmatched: {}, vet_star: { [QUAL]: true, [HELD]: false },
    vet_star_as_of: "2026-11-01", vet_star_threshold: 0.75 }, perf || {});
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setShared(Object.assign({ participationDeadline: "2099-11-01", extraReqs: [VET_REQ] }, shared || {}));
  T._setElig(Object.assign({ coordOk: true, coord: { [QUAL]: true },
    optinRow: { [QUAL]: { college: QUAL, status: "confirmed", requested_at: "2026-10-01T00:00:00Z" } },
    asOf: "2026-11-01" }, elig || {}));
  T.render();
  return { window, doc, T };
}
function rowIds(doc) {
  return Array.from(doc.querySelectorAll("#cplFundTable tr.cplfund-row[data-id]")).map((tr) => tr.getAttribute("data-id"));
}
function choose(window, doc, v) {
  const sel = doc.getElementById("cplFundCondFilter");
  sel.value = v;
  sel.dispatchEvent(new window.Event("change", { bubbles: true }));
}

// ── 1. the filter, the gate and the count ───────────────────────────────────
{
  const { window, doc, T } = setup(null, {
    contacts: [{ college: HELD, cpl_coordinator: "", landing_page_url: "https://butte.example.edu/cpl" },
               { college: QUAL, cpl_coordinator: "Pat Example", landing_page_url: "https://laney.example.edu/cpl" }] });
  const sel = doc.getElementById("cplFundCondFilter");
  const vals = sel ? Array.from(sel.options).map((o) => o.value) : [];
  check("B1: the table carries a minimum-conditions filter, All first, then met and not met",
    !!sel && vals[0] === "" && vals.indexOf("met") > 0 && vals.indexOf("unmet") > 0 &&
    !!doc.querySelector('label[for="cplFundCondFilter"]'));
  const all = rowIds(doc);
  choose(window, doc, "met");
  const met = rowIds(doc);
  const gateMet = all.filter((id) => { const g = T._gate(id.slice(2)); return !g.pending && !g.blocked; });
  check("B2: Met all three shows exactly the institutions the gate releases (" + met.length + ")",
    met.length === gateMet.length && met.indexOf("c:" + QUAL) >= 0 && met.indexOf("c:" + HELD) < 0);
  check("B3: the count line says how many of the whole roster the filter shows",
    new RegExp("^" + met.length + " of " + all.length + " institutions").test(flat(doc.getElementById("cplFundCount"))));
  choose(window, doc, "unmet");
  const unmet = rowIds(doc);
  check("B4: Not yet met shows the gate's blocked institutions, and none it releases",
    unmet.indexOf("c:" + HELD) >= 0 && unmet.indexOf("c:" + QUAL) < 0 &&
    unmet.every((id) => T._gate(id.slice(2)).blocked) && unmet.length + met.length <= all.length);
  choose(window, doc, "");
  check("B4b: All institutions brings every row back", rowIds(doc).length === all.length);

  // 3. the landing page beside the coordinator condition, met or not
  openDrill(window, doc, "c:" + HELD);
  const heldLink = doc.querySelector('a[href="https://butte.example.edu/cpl"]');
  check("B6: an unmet coordinator condition still carries the landing page link beside it",
    !!heldLink && /CPL landing page/.test(flat(heldLink)) && !!heldLink.closest(".cf-cond") &&
    /CPL Coordinator: none listed in MAP/.test(flat(heldLink.closest(".cf-cond"))));

  // 4. the sentence under the list is a passage on the Internal view
  const after = doc.querySelector('[data-textblock="req_after"]');
  check("B9: the sentence under the minimum conditions is an editable passage on the Internal view",
    !!after && /receives its full outcomes-based funding/.test(flat(after)));
}

// ── 2. the noncredit lane: the Lead's filter and its words ─────────────────
{
  const NC = "Mt San Antonio";
  const fy = "2026-27";
  const { window, doc, T } = setup({
    ncLane: "outcomes",
    ncOutcomes: { "1": [{ key: "exh", title: "Exhibits built or adopted", share: 1, goals: ["A"], unit_word: "exhibits",
      metric: "Exhibits in MAP built or adopted", metric_src: "nc_exh", target_rule: { kind: "fixed", n: 1 } }] }
  }, { ncAttest: { [NC]: { college: NC, fiscal_year: fy, status: "self_attested", coordinator_name: "Sample Lead" } } },
  { colleges: { [NC]: { pa_u: 100, nc_exh: 1 } } });
  const vals = Array.from(doc.getElementById("cplFundCondFilter").options).map((o) => o.value);
  check("B5a: under the noncredit outcomes lane the filter offers the Noncredit CPL Lead, both ways",
    vals.indexOf("nc_yes") > 0 && vals.indexOf("nc_no") > 0);
  choose(window, doc, "nc_yes");
  const yes = rowIds(doc);
  choose(window, doc, "nc_no");
  const no = rowIds(doc);
  check("B5b: an attestation on file (awaiting confirmation counts) lists under attested, never under not attested",
    yes.indexOf("c:" + NC) >= 0 && no.indexOf("c:" + NC) < 0);
  choose(window, doc, "");
  const ncCond = (T._publicProgress().conditions || []).filter((c) => c && c.kind === "nc_coord")[0];
  check("B5c: the two lists together are the institutions whose award carries a noncredit share, no more (" +
    (yes.length + no.length) + " of " + rowIds(doc).length + ")",
    !!ncCond && yes.length + no.length === ncCond.of && ncCond.of < rowIds(doc).length);

  // 1. the Lead's words resolve through the layers, and the public page's refs address each line
  const R = T._requirements();
  const ncIdx = R.refs.indexOf("nc_coord");
  check("B7: the Noncredit CPL Lead condition carries a ref and its default words",
    ncIdx >= 0 && /Noncredit CPL Lead named and published/.test(R.items[ncIdx]) && T.reqText("nc_coord") === R.items[ncIdx]);
  T.setReqText("nc_coord", "For the noncredit share: a Noncredit CPL Lead, published on the landing page");
  const R2 = T._requirements();
  check("B8: an edit to the Lead's words reaches the list the public page paints, and the Internal view's field",
    R2.items[R2.refs.indexOf("nc_coord")] === "For the noncredit share: a Noncredit CPL Lead, published on the landing page" &&
    Array.from(doc.querySelectorAll('[data-edit="nc-coord-label"]')).some((el) => /published on the landing page/.test(el.value || el.textContent)));
  check("B10: every item the page paints has a ref the editor can read back",
    R2.refs.length === R2.items.length && R2.refs.every((r) => r && T.reqText(r) != null) &&
    R2.refs.indexOf("coord") >= 0 && R2.refs.indexOf("part") >= 0 && R2.refs.some((r) => /^extra:\d+$/.test(r)));
  T.setReqText("part", "Local confirmation on file by");
  check("B10b: the confirmation's words save without its deadline, and the list still prints the date",
    T.reqText("part") === "Local confirmation on file by" &&
    T._requirements().items[T._requirements().refs.indexOf("part")] === "Local confirmation on file by 2099-11-01");
}

finish();
