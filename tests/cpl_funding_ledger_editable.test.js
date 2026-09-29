// CPL Implementation Funding — the flat ledger keeps every dial editable.
//
// Sam, 2026-09-01, while the port was in flight: "I don't want to lose
// editability of variables we have in the model through the simplifying and
// consolidation process."
//
// That is the one risk this change actually carried. The Funding Breakdown's
// seven boxes were not a display — they were the curator's editing surface, and
// each box held an inline editor for its amount, another for its label, a
// control to drop it from the funding math and another to hide it from the
// public college page. A "flat ledger" reads like a list of text, and the
// natural way to build one is to print the values. That version would look
// correct in a screenshot and silently cost Sam the model.
//
// So this file does not test the ledger's LOOK. It tests that every dial that
// was editable still is, that the controls beside them survived, that an edit
// still reaches the model, and that the ones which moved to another section
// moved WITH their editors. The list is derived from the model's own field
// registries rather than typed, so a dial added later is covered without anyone
// remembering this file.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_ledger_editable.test.js`).
const { check, freshDom, boot, click, commit, finish } = require("./lib/cpl_funding_harness.js");

// unlocked() reads a magic-link reviewer session — the public-visibility toggle
// is curator-only, so a signed-out fixture proves nothing about it either way.
function reviewerSession() {
  return {
    get: function () { return { access_token: "header.payload.sig", email: "co@cccco.edu" }; },
    isFresh: function () { return true; },
    authHeaders: function (extra) {
      var h = { apikey: "anon", Authorization: "Bearer header.payload.sig" };
      if (extra) for (var k in extra) h[k] = extra[k];
      return h;
    }
  };
}

const ed = (doc, edit, field) =>
  doc.querySelector('[data-edit="' + edit + '"]' + (field ? '[data-field="' + field + '"]' : ""));
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

const { window } = freshDom();
const doc = boot(window);
const T = window.CPL_FUNDING_TAB;

// ── 1. every core pool field keeps BOTH its editors ─────────────────────────
// Derived from the consumer's own CORE_REVENUE / CORE_DEDUCTION registries via
// the rendered fields, not from a typed list: a new revenue line or carve-out
// is covered the day it is added.
const poolFields = Array.from(doc.querySelectorAll('[data-edit="pool"][data-field]'))
  .map((el) => el.getAttribute("data-field"));
check("the ledger renders at least the appropriation, the CO staff line and the projects line",
  poolFields.length >= 3);
check("every pool field with an amount editor also has a LABEL editor",
  poolFields.every((f) => !!ed(doc, "pool-label", f)));
check("the amount editors are real inputs, not printed text",
  Array.from(doc.querySelectorAll('[data-edit="pool"]')).every((el) => el.tagName === "INPUT"));

// ── 2. the bounds pair — two dials, two accessible names ────────────────────
// The base and the cap moved out of the ledger onto their own line. They are
// the pair a curator reaches for most, and they share a label shape, so the
// distinct aria-labels matter as much as the inputs.
const floorEd = ed(doc, "pool", "floor_window");
const capEd = ed(doc, "pool", "cap_window");
check("the base award is still editable", !!floorEd && floorEd.tagName === "INPUT");
check("the cap is still editable", !!capEd && capEd.tagName === "INPUT");
check("...and the two carry DIFFERENT accessible names (one label for two controls is unusable)",
  !!floorEd && !!capEd &&
  floorEd.getAttribute("aria-label") !== capEd.getAttribute("aria-label"));
check("both sit on the bounds line, not back in the money ledger",
  !!floorEd && !!floorEd.closest(".cplfund-bounds") &&
  !floorEd.closest(".cplfund-ledger"));

// ── 3. the figures that CHANGED SECTION took their editors with them ────────
// The reimbursement rate moved into "How an allocation is computed". Moving a
// read-only figure is a layout change; moving an editable one and printing it
// as text is a lost dial, and nothing on screen would say so.
{
  const { window: w2 } = freshDom();
  const d2 = boot(w2);
  const T2 = w2.CPL_FUNDING_TAB;
  // The rate card only renders under FTES-denominated metrics — the baked
  // defaults are headcount-denominated, so ask for the state that has it.
  T2._setShared({ yearPriorities: { "1": {
    "0": { metric: "Eligible CPL Units measured in FTES", metric_src: "pe_u" },
    "1": { metric: "Applied CPL Units measured in FTES", metric_src: "pa_u" },
    "2": { metric: "Transcribed CPL Units measured in FTES", metric_src: "p3_u" }
  } } });
  T2.render();
  const rate = ed(d2, "ftesrate");
  check("the reimbursement rate is still an editor after the move", !!rate && rate.tagName === "INPUT");
  check("...and it now lives in the formula section, out of the money ledger",
    !!rate && !!rate.closest(".cplfund-formula") && !rate.closest(".cplfund-ledger"));
}

// ── 4. the controls beside the dials survived ───────────────────────────────
check("every core box still offers the remove-from-the-math control",
  doc.querySelectorAll(".cplfund-ledger [data-poolhide]").length >= 3);
// The 👁 control is curator-only, so it needs an unlocked fixture — asserting
// its absence in a signed-out render would pass for the wrong reason.
{
  const priv = freshDom();
  priv.window.CPL_SESSION = reviewerSession();
  const pd = boot(priv.window);
  check("an unlocked curator still gets the public-visibility toggle on every core line",
    pd.querySelectorAll(".cplfund-ledger [data-poolpublic]").length >= 3);
  check("...and it is still a different control from the remove-from-the-math one",
    pd.querySelectorAll(".cplfund-ledger [data-poolhide]").length >= 3 &&
    !pd.querySelector("[data-poolpublic][data-poolhide]"));
}
check("both Add controls are still on the section",
  !!doc.querySelector('[data-pooladd="revenue"]') && !!doc.querySelector('[data-pooladd="deduction"]'));

// ── 5. an edit still REACHES THE MODEL ──────────────────────────────────────
// The assertions above prove an input exists. This one proves it is wired —
// an input rendered outside the delegated handler's scope looks identical and
// does nothing, which is the failure mode a markup move actually produces.
{
  const before = T._model().net;
  const amt = ed(doc, "pool", "one_time_2026_27");
  check("the appropriation's editor is present to type into", !!amt);
  // ⚠️ Guarded, not assumed. If the editor is gone — the whole failure this
  // file exists for — an unguarded commit() throws and the run dies before
  // finish() prints, so the assertion that caught it never reaches the log and
  // the next reader sees a stack trace instead of a named cause.
  if (amt) {
    commit(window, amt, "36000000");
    const after = window.CPL_FUNDING_TAB._model().net;
    check("typing a new appropriation moves the model's net", after !== before && after > before);
    const hero = window.document.querySelector(".cplfund-ledger .cplfund-card.hero .v");
    check("...and the ledger's total line repaints with it",
      !!hero && hero.textContent.indexOf(money(after)) !== -1);
    const back = ed(window.document, "pool", "one_time_2026_27");
    if (back) commit(window, back, "35000000");
  } else {
    check("SKIPPED: typing a new appropriation moves the model's net", false);
    check("SKIPPED: the ledger's total line repaints with it", false);
  }
}

// ── 6. a label edit still reaches the model too ─────────────────────────────
// Labels are the half most likely to be quietly dropped in a "simplify" pass:
// a ledger row reads fine with a hardcoded name, and nobody notices until Sam
// tries to rename a line.
{
  const lab = ed(window.document, "pool-label", "admin_cost");
  check("the CO staff line's LABEL is editable", !!lab && lab.tagName === "INPUT");
  if (lab) {
    commit(window, lab, "CO administration");
    window.CPL_FUNDING_TAB.render();
    const after = ed(window.document, "pool-label", "admin_cost");
    check("renaming a ledger line sticks through a re-render",
      !!after && after.value === "CO administration");
  }
}

// ── 7. adding a custom box still works, and arrives editable ────────────────
{
  const d = window.document;
  const n0 = d.querySelectorAll(".cplfund-ledger .cplfund-card.custom").length;
  click(window, d.querySelector('[data-pooladd="deduction"]'));
  const d2 = window.document;
  const n1 = d2.querySelectorAll(".cplfund-ledger .cplfund-card.custom").length;
  check("Add deduction adds a row to the ledger", n1 === n0 + 1);
  check("...and the new row arrives with BOTH an amount and a label editor",
    !!d2.querySelector('.cplfund-ledger .cplfund-card.custom [data-edit="pool-custom-amt"]') &&
    !!d2.querySelector('.cplfund-ledger .cplfund-card.custom [data-edit="pool-custom-label"]'));
  check("...and its revenue/deduction toggle and delete control",
    !!d2.querySelector(".cplfund-ledger [data-poolkind]") &&
    !!d2.querySelector(".cplfund-ledger [data-pooldel]"));
}

// ── 8. the public view still prints, and still offers no dial ───────────────
// The mirror of everything above: the same ledger, rendered for a college,
// must carry the figures and NONE of the controls. A flat ledger makes this
// easier to get wrong in the other direction — printed text looks the same in
// both modes, so a control leaking into public view is invisible in review.
{
  const pub = freshDom();
  pub.window.CPL_FUNDING_PUBLIC = true;
  const pdoc = boot(pub.window);
  check("the public ledger still renders money lines, and always the total",
    pdoc.querySelectorAll(".cplfund-ledger .cplfund-card").length >= 2 &&
    !!pdoc.querySelector(".cplfund-ledger .cplfund-card.hero") &&
    /\$[\d,]+/.test(pdoc.querySelector(".cplfund-ledger .cplfund-card.hero .v").textContent));
  check("...with no editor anywhere in it",
    pdoc.querySelectorAll(".cplfund-ledger input, .cplfund-ledger [data-edit]").length === 0);
  check("...and no add / remove / visibility control",
    !pdoc.querySelector("[data-pooladd]") && !pdoc.querySelector(".cplfund-ledger [data-poolhide]") &&
    !pdoc.querySelector(".cplfund-ledger [data-poolpublic]"));
}

// ── 9. the detail is still one click away ───────────────────────────────────
// Sam's condition on the port: "incorporate flat ledger while preserving a way
// to click into details." Flattening a card into a row is exactly the change
// that drops a fold, and a dropped fold is invisible — the row still looks
// complete.
check("the named-projects list is still a fold inside the ledger",
  !!window.document.querySelector(".cplfund-ledger details.cplfund-pool-projects"));
check("the base/cap line still folds open to name the institutions at each bound",
  !!window.document.querySelector(".cplfund-bounds details"));

finish();
