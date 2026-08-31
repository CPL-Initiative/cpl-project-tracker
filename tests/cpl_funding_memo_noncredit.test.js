// CPL Implementation Funding — the MEMO's noncredit figures must come from the
// MODEL, never re-derived on the export surface.
//
// WHY THIS FILE EXISTS. The memo is the EXPORTED document — the artifact that
// leaves the tab, the gate and the room — and it is where re-derivation is
// hardest to notice, because nobody reads the export next to the screen. This
// file caught exactly that once: on 2026-08-23 the tab's noncredit lane was
// migrated and `memoModel()` was not — it kept the retired flat re-split
// (`feederBasis(f) / Σ feederBasis × carve`) and paid the whole $1.8M
// carve-out to four campuses, $779,862 of it to a campus the model paid $0.
//
// ONE-POOL PORT (Sam adopted the model 2026-08-31). The carve-out lane those
// figures came from is retired (R3–R5) — see tests/cpl_funding_nc_lane.test.js
// for the lane retirement and tests/cpl_funding_one_pool.test.js for the
// adopted model's anchor suite. The memo now prints ONE line per institution:
// District / Institution · Credit share · Noncredit share · Max award, all
// four from the same solve the tab renders. What survives here, re-aimed:
//
//   * FIGURES FROM THE MODEL — every row's three money cells tie to
//     instSplit/_alloc/_ncAward, for all 118 institutions, not a sample.
//   * THE DEDUP — Mt. SAC Noncredit is NOT a row: its FTES rides the
//     Mt. San Antonio row (`nc_ftes_on_credit_row`), so the same program is
//     never paid twice (`methodology-a-deduplication-has-a-scope`).
//   * THE TRIO — NOCE / SD Cont. Ed / Calbright are ordinary rows FLAGGED
//     noncredit-only (origination, no advances — N2 b), credit cell "—".
//   * NEVER FUSED — noncredit money beside credit money in its own column
//     (Sam's standing "neglected step child" rule), and the totals tie to the
//     one pool.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_memo_noncredit.test.js`).
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

// PARSE THE ROW, do not grep the document. The first draft of the old file
// substring-matched money strings against the whole memo and three assertions
// could not fail ("$50,000" is also the seed grant named in the intro). Same
// discipline here, updated to the one-pool row shape: an indented 4-cell row
// is an institution; a bold 4-cell row is a district header (or the TOTAL).
// The name group must not cross a row boundary — the summary table's indented
// rows carry ONE value cell, and a greedy group would splice two of them into
// a phantom institution (measured: it did, before the (?!</tr>) guard).
function parseNum(s) {
  const t = String(s).replace(/&mdash;|—/g, "").replace(/[$,]/g, "").trim();
  return t === "" ? null : Number(t);
}
function instRows(memo) {
  const out = [];
  const re = /<tr><td class='t' style='padding-left:1\.5em;'>((?:(?!<\/tr>)[\s\S])*?)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><\/tr>/g;
  let m;
  while ((m = re.exec(memo)) !== null) {
    out.push({ name: m[1].replace(/<[^>]*>/g, " ").replace(/&mdash;/g, "—").replace(/\s+/g, " ").trim(),
               cr: parseNum(m[2]), nc: parseNum(m[3]), total: parseNum(m[4]) });
  }
  return out;
}
function boldRows(memo) {
  const out = [];
  const re = /<tr><td class='t'><strong>([^<]*)<\/strong><\/td><td><strong>([^<]*)<\/strong><\/td><td><strong>([^<]*)<\/strong><\/td><td><strong>([^<]*)<\/strong><\/td><\/tr>/g;
  let m;
  while ((m = re.exec(memo)) !== null) {
    out.push({ name: m[1], cr: parseNum(m[2]), nc: parseNum(m[3]), total: parseNum(m[4]), raw: m });
  }
  return out;
}
const rowFor = (rows, needle) => rows.find((r) => r.name.indexOf(needle) !== -1) || null;

const { window } = freshDom();
boot(window);
const T = window.CPL_FUNDING_TAB;
const memo = T._buildMemo("memo");
const rows = instRows(memo);
const eff = T._effective();

// ─────────────────────────────────────────────────────────────────────────────
// N1 — the one-pool table shape, and the counts that describe it
// ─────────────────────────────────────────────────────────────────────────────
check("the allocation table carries the one-pool columns (District / Institution · Credit share · Noncredit share · Max award)",
  /District \/ Institution<\/th><th>Credit share<\/th><th>Noncredit share<\/th><th>Max award<\/th>/.test(memo));
check("the summary names the pool by Sam's label and the restricted noncredit line",
  memo.indexOf("Total credit and noncredit potential awards") !== -1 &&
  memo.indexOf("Noncredit shares (restricted to noncredit outcomes)") !== -1);
check("the memo reports the roster the model funds — 118 (115 colleges + 3 noncredit-only institutions)",
  (memo.match(/Funded institutions<\/td><td>([^<]*)</) || [])[1] === "118 (115 colleges + 3 noncredit-only institutions)");
check("one line per institution — all 118, no more, no fewer", rows.length === 118);

// ─────────────────────────────────────────────────────────────────────────────
// N2 — the memo agrees with the model, institution by institution
// ─────────────────────────────────────────────────────────────────────────────
// EVERY row, not a sample — a join that drops some institutions and keeps
// others is the likeliest failure and a spot-check cannot see it. Names are
// display-decorated, so the tie-out is by VALUE TRIPLE: the multiset of
// (max award · noncredit share · credit share), rounded exactly as fmtMoney
// rounds, must equal the model's. cell() prints "—" for ≤ $0.50, which
// normalizes to 0 on both sides.
{
  const m = T._model();
  const norm = (v) => { const r = Math.round(v || 0); return r > 0 ? r : 0; };
  const expected = Object.keys(m.W).map((k) => {
    const nc = T._ncAward(k);
    return [norm(m.W[k]), norm(nc), norm(m.W[k] - nc) > 0.5 ? Math.round(m.W[k] - nc) : 0];
  });
  const got = rows.map((r) => [r.total || 0, r.nc || 0, r.cr || 0]);
  const key = (t) => t.join("|");
  const sortT = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  expected.sort(sortT); got.sort(sortT);
  const mismatch = expected.filter((e, i) => !got[i] ||
    Math.abs(e[0] - got[i][0]) > 1 || Math.abs(e[1] - got[i][1]) > 1 || Math.abs(e[2] - got[i][2]) > 1);
  check("every institution's (max award · noncredit share · credit share) triple is the MODEL's — all 118 tie out" +
        (mismatch.length ? " — first drift: " + key(mismatch[0]) : ""),
    expected.length === 118 && got.length === 118 && mismatch.length === 0);
}
// And by NAME for the rows a reader will actually look up:
{
  const mtsa = rowFor(rows, "Mt San Antonio");
  const a = T._alloc("Mt San Antonio");
  check("the Mt San Antonio row pays what the model pays (at the cap), decomposed by ITS own FTES split",
    !!mtsa && !!a && mtsa.total === Math.round(a.w) &&
    mtsa.nc === Math.round(T._ncAward("Mt San Antonio")) &&
    Math.abs((mtsa.cr + mtsa.nc) - mtsa.total) <= 1);
  const taft = rowFor(rows, "Taft");
  check("a no-noncredit college's Noncredit cell is — (not applicable), never a $0 that reads as passed over (Taft)",
    !!taft && taft.nc === null && taft.cr === Math.round(T._alloc("Taft").total));
  check("every row's credit and noncredit shares sum to its ONE max award (per-row conservation)",
    rows.every((r) => Math.abs(((r.cr || 0) + (r.nc || 0)) - (r.total || 0)) <= 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// N3 — THE DEDUP: Mt. SAC Noncredit is not a row
// ─────────────────────────────────────────────────────────────────────────────
// `nc_ftes_on_credit_row` moves its 10,829.3 FTES onto the Mt. San Antonio
// row, whose noncredit SHARE therefore carries that program — listed once,
// paid once. A second Mt. SAC row is the double payment coming back.
check("Mt. SAC Noncredit is NOT an allocation row — its FTES rides the Mt. San Antonio row",
  !rowFor(rows, "Mt. San Antonio College — Noncredit") &&
  rows.filter((r) => /Mt\.? San Antonio/.test(r.name)).length === 1);
// The retired re-split's figures at the dials of record, pinned as literals
// because those are the numbers a reader would have acted on (2026-08-23).
check("the memo does NOT print the retired re-split figures ($779,862 / $672,453 / $275,671 / $72,014)",
  ["$779,862", "$672,453", "$275,671", "$72,014"].every((s) => memo.indexOf(s) === -1));

// ─────────────────────────────────────────────────────────────────────────────
// N4 — the noncredit-only trio: rows, flagged, held by origination
// ─────────────────────────────────────────────────────────────────────────────
[["North Orange Continuing Education", "NOCE"],
 ["San Diego College of Continuing Education", "SD Cont. Ed"],
 ["Calbright College", "Calbright"]].forEach(([full, short]) => {
  const row = rowFor(rows, full);
  const award = T._alloc(short);
  check("memo row for " + full + " pays what the model pays (" + money(award ? award.total : 0) + "), all of it the noncredit share",
    !!row && !!award && award.total > 0 && row.nc === Math.round(award.total) && row.total === Math.round(award.total));
  check("…its Credit cell is — (no credit program), and the row is FLAGGED noncredit-only / origination / no advances",
    !!row && row.cr === null && /noncredit-only/.test(row.name) && /earns by origination, no advances/.test(row.name));
});
// N3 a: Calbright's 1,000-FTES size is a stand-in — the memo must say nothing
// disburses on a placeholder, on Calbright's own row.
check("Calbright's row carries the N3 a stand-in caveat (nothing disburses on a placeholder)",
  (function () { const r = rowFor(rows, "Calbright College"); return !!r && /stand-in/.test(r.name) && /nothing disburses on a placeholder/.test(r.name); })());

// ─────────────────────────────────────────────────────────────────────────────
// N5 — noncredit money is shown BESIDE credit money, never folded into it
// ─────────────────────────────────────────────────────────────────────────────
// Sam's constraint, recorded twice: noncredit "never sums into the credit
// total — own column" ("the neglected step child"). Under one pool "fused"
// would print the whole combined award in the Credit column.
{
  const withNc = D.colleges
    .filter((c) => (c.noncredit_ftes || 0) > 0)
    .map((c) => ({ name: c.college, nc: T._ncAward(c.college), a: T._alloc(c.college) }))
    .sort((a, b) => b.nc - a.nc)[0];
  const row = rowFor(rows, withNc.name);
  check("the college with the largest noncredit share keeps it in a column of its OWN (" + withNc.name + ")",
    !!row && row.nc === Math.round(withNc.nc) && row.nc > 0);
  check("…and its CREDIT column is the credit share alone, never the fused combined figure",
    !!row && row.cr === Math.round(withNc.a.w - withNc.nc) && row.cr < row.total);
}

// ─────────────────────────────────────────────────────────────────────────────
// N6 — the allocation table still ties out, lane by lane and to the pool
// ─────────────────────────────────────────────────────────────────────────────
// The tie-out is what made the 2026-08-23 defect survivable: a table that adds
// up reads as correct. So the totals must be honest AND decomposed.
{
  const bold = boldRows(memo);
  const total = bold.find((r) => /TOTAL \(statewide\)/.test(r.name));
  check("the TOTAL (statewide) row is present and IS the one pool ($25,240,308)",
    !!total && Math.abs(total.total - 25240308) <= 1);
  check("…split across the two columns, so each ties to its own lane and the pair ties to the pool",
    !!total && Math.abs((total.cr + total.nc) - total.total) <= 1 &&
    Math.abs(total.nc - (eff.pool.nc_college_shares + eff.pool.nc_only_held_by_origination)) <= 1);
  // District subtotals: a district with no credit member must not print "$0" —
  // the retired memo printed Calbright's district as "$0 credit" beside real
  // noncredit money. Not zero: not applicable. cell() renders "—" for both.
  const dists = bold.filter((r) => r !== total);
  check("district subtotals were parsed (guards the assertion below)", dists.length > 50);
  check("no district subtotal claims $0 credit while carrying noncredit money — it prints — instead",
    !dists.some((r) => String(r.raw[2]).trim() === "$0" && (r.nc || 0) > 0) &&
    /<strong>Statewide \(no district\)<\/strong><\/td><td><strong>&mdash;<\/strong>/.test(memo));
}

// ─────────────────────────────────────────────────────────────────────────────
// N7 — the retired mechanism is GONE from the source, not merely unused
// ─────────────────────────────────────────────────────────────────────────────
// A dormant re-split is a defect waiting for its next caller. Comment lines are
// stripped first: a grep for the old formula otherwise matches the comment that
// explains why it went — the trap named in the Session 185 handoff.
{
  const code = consumerSrc.split("\n")
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  check("no `/ fbasis * carve` re-split survives in live code",
    !/fbasis\s*\*\s*carve|\/\s*fbasis\s*\*\s*carve/.test(code));
  check("memoModel reads the ONE-POOL model — the roster and the per-award decomposition, never its own split",
    /function memoModel\(\)[\s\S]{0,1500}?oneRoster\(\)\.map/.test(code) &&
    /function memoModel\(\)[\s\S]{0,1800}?instSplit\(c\)/.test(code));
}

// ─────────────────────────────────────────────────────────────────────────────
// N8 — the retired carve-out dials cannot reach the memo through the config
// ─────────────────────────────────────────────────────────────────────────────
// The stored fields survive in old configs; the model reads none of them
// (R3–R5). If any dial still moved the export, the carve-out would be back
// under another name — on the one surface nobody reads next to the screen.
{
  T._setScenario({ pool: { feeder_carveout: 1800000, nc_floor_window: 50000,
                           nc_cap_window: 100000, nc_threshold_ftes: 500 } });
  T.render();
  const memo2 = T._buildMemo("memo");
  check("setting the retired carve-out/NC-window/threshold dials changes NOT ONE BYTE of the memo",
    memo2 === memo);
  T._setScenario({});
  T.render();
}

// ─────────────────────────────────────────────────────────────────────────────
// N9 — the ON-SCREEN surfaces beside the export describe the same one pool
// ─────────────────────────────────────────────────────────────────────────────
// Successors of the old N8/N9 (the "4 NC campuses" card and the carve-out
// bullet, both retired): the table count line counts the ONE roster, and the
// computed-how section's noncredit bullet states the DECOMPOSITION with the
// model's own figures — never a transcription, which is how this tab acquired
// most of its defects.
{
  const doc = window.document;
  const line = doc.getElementById("cplFundCount");
  check("the table count line counts the one roster (118 institutions), with the average max award",
    !!line && /118 institutions/.test(line.textContent) && /average max award/.test(line.textContent));
  check("…and no longer names a carve-out or the retired 74,968-student roster headcount",
    !!line && line.textContent.indexOf("carve-out") === -1 && line.textContent.indexOf("74,968") === -1);
  const li = Array.from(doc.querySelectorAll(".cplfund-formula-list li"))
    .map((e) => e.textContent.replace(/\s+/g, " "))
    .find((t) => /The noncredit share:/.test(t));
  check("the computed-how section carries the noncredit-share bullet (the decomposition, not a lane)", !!li);
  check("…its college-shares figure is the model's (" + money(eff.pool.nc_college_shares) + ")",
    !!li && li.indexOf(money(eff.pool.nc_college_shares)) !== -1);
  check("…its origination-held figure is the model's (" + money(eff.pool.nc_only_held_by_origination) + ")",
    !!li && li.indexOf(money(eff.pool.nc_only_held_by_origination)) !== -1);
  check("…and it states the restriction and the no-advance rule in words (F1 / N2 b)",
    !!li && /restricted to the noncredit measures/.test(li) && /\$0 earned until/.test(li) &&
    /no advances \(N2 b\)/.test(li));
}

finish();
