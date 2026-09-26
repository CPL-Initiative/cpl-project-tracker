// CPL Implementation Funding — the drill-in's headers sit over their columns,
// and the Veteran Star rides the institution's row. Both from Sam, 2026-09-24.
//
// (1) "Make sure the college details row headers line up perfectly with the row
// data." The per-priority table is nested inside the institution table's detail
// row, and two OUTER rules reach its cells through descendant combinators:
// `.cplfund-table th` (7px padding, every header right-aligned) and
// `tr.cplfund-detail td` (26px left / 14px right). Measured in Chromium the same
// day, before the fix: every header sat 7px right of its figures, and PRIORITY
// sat right-aligned over left-aligned names. After it, each header's edge and
// its column's edge measure the same pixel in both the college and statewide
// drill-ins.
//
// ⚠️ jsdom does no layout, so no rectangle can be compared here. What this file
// CAN do is what the browser's cascade does: for a header cell and each data
// cell of the same column, find every rule that matches, rank the declarations
// by !important, then specificity, then source order, and compare the winning
// padding-left, padding-right and text-align. A header and its column must
// resolve to the same three values — in the base cascade and under each @media
// block the tab declares, so a breakpoint cannot pull them apart either.
// It reads the tab's own injected sheet only; the page's HTML <style> blocks
// are not in this DOM, which is why the fix sits at a specificity (0,2,1)+ that
// no plain class-plus-type rule reaches.
//
// (2) "Add a veteran star icon on the college rows for the 59 colleges that meet
// that criteria." The star reads vetStar(), the same flag as the Baseline
// requirement and the Elig pie. A noncredit-only institution meets that
// requirement with certificates and carries NO star, even if a flag names it.
const H = require("./lib/cpl_funding_harness.js");
const { freshDom, boot, click, check, finish, consumerSrc } = H;

// ── a small cascade resolver ────────────────────────────────────────────────
function splitSelectors(text) {                  // top-level commas only
  const out = []; let depth = 0, cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function specificity(sel) {
  let s = sel.replace(/:not\(([^()]*)\)/g, " $1 ");   // :not() takes its argument's weight
  let a = 0, b = 0, c = 0;
  s = s.replace(/#[\w-]+/g, () => { a++; return " "; });
  s = s.replace(/\[[^\]]*\]/g, () => { b++; return " "; });
  s = s.replace(/::[\w-]+/g, () => { c++; return " "; });
  s = s.replace(/:[\w-]+(\([^)]*\))?/g, () => { b++; return " "; });
  s = s.replace(/\.[\w-]+/g, () => { b++; return " "; });
  c += (s.match(/[a-zA-Z][\w-]*/g) || []).length;
  return a * 1e6 + b * 1e3 + c;
}
// The value a declaration block sets for one longhand, honoring the `padding`
// shorthand and the block's own order (a later declaration in it wins).
function blockValue(style, prop) {
  let val = null, imp = false;
  for (let i = 0; i < style.length; i++) {
    const name = style[i], v = style.getPropertyValue(name);
    let hit = null;
    if (name === prop) hit = v;
    else if (name === "padding" && /^padding-(left|right)$/.test(prop)) {
      const p = v.trim().split(/\s+/), r = p[1] || p[0], l = p[3] || r;
      hit = prop === "padding-left" ? l : r;
    }
    if (hit != null) { val = hit.trim(); imp = style.getPropertyPriority(name) === "important"; }
  }
  return val == null ? null : { val, imp };
}
// Flattened rules in source order: [{ sels, style, order, media }].
function sheetRules(doc, dropRule) {
  const out = []; let order = 0;
  const walk = (rules, media) => {
    for (const r of Array.from(rules)) {
      if (r.cssRules && r.media) walk(r.cssRules, r.media.mediaText);
      else if (r.selectorText && !(dropRule && dropRule(r.selectorText)))
        out.push({ sels: splitSelectors(r.selectorText), style: r.style, order: order++, media });
    }
  };
  Array.from(doc.styleSheets).forEach((sh) => walk(sh.cssRules, null));
  return out;
}
function resolve(el, prop, rules, media) {
  let best = null;
  for (const r of rules) {
    if (r.media && r.media !== media) continue;   // base rules, plus one @media block at a time
    const bv = blockValue(r.style, prop);
    if (!bv) continue;
    for (const sel of r.sels) {
      let hit = false;
      try { hit = el.matches(sel); } catch (e) { hit = false; }
      if (!hit) continue;
      const cand = { val: bv.val, rank: [bv.imp ? 1 : 0, specificity(sel), r.order] };
      if (!best || cand.rank[0] > best.rank[0] ||
          (cand.rank[0] === best.rank[0] && (cand.rank[1] > best.rank[1] ||
            (cand.rank[1] === best.rank[1] && cand.rank[2] > best.rank[2])))) best = cand;
    }
  }
  return best ? best.val : "(initial)";
}
const PROPS = ["padding-left", "padding-right", "text-align"];
// Every column where a header and a data cell resolve differently, per context.
function misaligned(table, rules) {
  const contexts = [null].concat(Array.from(new Set(rules.map((r) => r.media).filter(Boolean))));
  const rows = Array.from(table.rows);
  const head = Array.from(rows[0].cells);
  const data = rows.slice(1).filter((tr) => !tr.classList.contains("cplfund-dtl-rep"));
  const bad = [];
  contexts.forEach((ctx) => head.forEach((th, i) => PROPS.forEach((p) => {
    const want = resolve(th, p, rules, ctx);
    data.forEach((tr) => {
      const td = tr.cells[i];
      if (td && resolve(td, p, rules, ctx) !== want)
        bad.push((ctx || "base") + " · column " + (i + 1) + " · " + p + ": th " + want + ", td " + resolve(td, p, rules, ctx));
    });
  })));
  return bad;
}

{
  const { window } = freshDom();
  window.CPL_FUNDING_PERF = { as_of: "2026-09-24", suppress_below: 10,
    statewide: { pa_u: 300000 }, colleges: { "Laney": { pa_u: 9000 } }, unmatched: {},
    vet_star: { "Alameda": true, "Laney": true, "Berkeley City": false },
    vet_star_as_of: "2026-09-24", vet_star_threshold: 0.75 };
  const doc = boot(window);
  const T = window.CPL_FUNDING_TAB;
  T.render();

  const rows = () => Array.from(doc.querySelectorAll("#cplFundTable tbody tr.cplfund-row"));
  const rowOf = (name) => rows().find((r) => {
    const n = r.querySelector(".cplfund-instname");
    return n && n.textContent === name;
  });
  const starsIn = (r) => (r ? r.querySelectorAll(".cplfund-vstar").length : -1);

  // A noncredit-only row, flagged on purpose: its requirement is met another way.
  const ncoRow = rows().find((r) => /NC only/.test(r.textContent));
  const ncoKey = ncoRow && ncoRow.getAttribute("data-id").slice(2);
  window.CPL_FUNDING_PERF.vet_star[ncoKey] = true;
  T.render();

  // ── (2) the Veteran Star ─────────────────────────────────────────────────
  check("v1: a flagged college carries exactly one star", starsIn(rowOf("Alameda")) === 1);
  check("v2: a college flagged false carries none", starsIn(rowOf("Berkeley City")) === 0);
  check("v3: a college the flag does not name carries none", starsIn(rowOf("Chabot")) === 0);
  check("v4: a noncredit-only institution carries none, even when a flag names it",
    !!ncoRow && starsIn(rows().find((r) => r.getAttribute("data-id") === "c:" + ncoKey)) === 0);
  const flaggedOnRoster = Object.keys(window.CPL_FUNDING_PERF.vet_star).filter((k) =>
    window.CPL_FUNDING_PERF.vet_star[k] === true && k !== ncoKey && rows().some((r) => r.getAttribute("data-id") === "c:" + k)).length;
  check("v5: the page carries one star per flagged roster college (" + flaggedOnRoster + ")",
    doc.querySelectorAll("#cplFundTable .cplfund-vstar").length === flaggedOnRoster && flaggedOnRoster === 2);
  const star = rowOf("Alameda").querySelector(".cplfund-vstar");
  const caret = rowOf("Alameda").querySelector(".cplfund-caret");
  check("v6: the star sits outside the name's button, so the name stays the name",
    !star.closest("button") && caret.textContent === "Alameda");
  check("v7: it has a word for a screen reader (role img, labelled Veteran Star)",
    star.getAttribute("role") === "img" && star.getAttribute("aria-label") === "Veteran Star");
  check("v8: its hover gives the definition and the data date",
    /Veteran Star/.test(star.title) && /75%/.test(star.title) && /JSTs uploaded in MAP/.test(star.title) &&
    /as of 2026-09-24/.test(star.title));

  // ── (1) the drill-in alignment ───────────────────────────────────────────
  click(window, rowOf("Laney").querySelector(".cplfund-caret"));
  const collegeTable = rowOf("Laney").nextElementSibling.querySelector(".cplfund-dtl-table");
  const sysRow = doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow");
  click(window, sysRow.querySelector(".cplfund-caret"));
  const sysTable = doc.querySelector("#cplFundTable tbody tr.cplfund-systemrow").nextElementSibling
    .querySelector(".cplfund-dtl-table");
  check("a0: both drill-ins render a table with a header row and data rows",
    !!collegeTable && !!sysTable && collegeTable.rows.length >= 2 && sysTable.rows.length >= 2);

  const rules = sheetRules(doc);
  const badCollege = misaligned(collegeTable, rules);
  const badSys = misaligned(sysTable, rules);
  check("a1: ⭐ every college drill-in header resolves to its column's padding and alignment" +
    (badCollege.length ? " — " + badCollege.slice(0, 3).join("; ") : ""), badCollege.length === 0);
  check("a2: ⭐ and every statewide drill-in header does too" +
    (badSys.length ? " — " + badSys.slice(0, 3).join("; ") : ""), badSys.length === 0);
  const th0 = collegeTable.rows[0].cells[0], th1 = collegeTable.rows[0].cells[1];
  // The house table format (Sam, 2026-09-24, review sheet item 7): "left
  // justify the 1st column and center justify the rest."
  check("a3: the name column reads left and the figures read centered",
    resolve(th0, "text-align", rules, null) === "left" && resolve(th1, "text-align", rules, null) === "center");

  // ── (3) the noncredit header is readable ─────────────────────────────────
  // Sam's screenshot, 2026-09-26: the noncredit table's header row painted its
  // blue fill and kept the base rule's muted-ink text, dark on dark. A fill and
  // its text color are one decision: resolve both on the same cell, and require
  // the credit table's header to keep the plain muted ink.
  const ncTable = doc.querySelector("#cplFundTable .cplfund-dtl-table.cplfund-dtl-nc");
  check("c0: the statewide drill-in renders a noncredit table", !!ncTable);
  const ncTh = ncTable && ncTable.rows[0].cells[1];
  check("c1: ⭐ the noncredit header's text resolves to white wherever its fill resolves to the noncredit blue",
    !!ncTh && /--dtl-nc-head/.test(resolve(ncTh, "background", rules, null)) &&
    /--white/.test(resolve(ncTh, "color", rules, null)));
  check("c2: the credit header keeps the muted ink on no fill",
    /--text-muted/.test(resolve(th1, "color", rules, null)) && resolve(th1, "background", rules, null) === "transparent");
  check("c3: the fill and the text color are declared in the ONE rule, so they cannot separate",
    /\.cplfund-dtl-nc th \{ background: var\(--dtl-nc-head[^}]*color: var\(--white/.test(consumerSrc));

  // ⚠️ A GUARD THAT CANNOT FAIL PROVES NOTHING. Drop the three restating rules
  // and the resolver must find the defect Chromium measured: the outer rules
  // pulling the header and its column apart.
  const without = sheetRules(doc, (t) => t.indexOf(".cplfund-dtl-tscroll > .cplfund-dtl-table") !== -1);
  const badBefore = misaligned(collegeTable, without);
  check("a4: without the fix the resolver reports the misalignment (" + badBefore.length + " cells)",
    badBefore.length > 0 && badBefore.some((b) => /padding-left/.test(b)) && badBefore.some((b) => /text-align/.test(b)));

  // ── source guard ─────────────────────────────────────────────────────────
  check("s1: the restating rules walk a CHILD combinator from the drill-in's scroll wrapper",
    consumerSrc.indexOf('".cplfund-dtl-tscroll > .cplfund-dtl-table th, .cplfund-dtl-tscroll > .cplfund-dtl-table td {') !== -1);

  // ── no flag, no star ─────────────────────────────────────────────────────
  delete window.CPL_FUNDING_PERF.vet_star;
  T.render();
  check("v9: with no Veteran Star feed the rows carry no star",
    doc.querySelectorAll("#cplFundTable .cplfund-vstar").length === 0 && rows().length > 100);
}

finish();
