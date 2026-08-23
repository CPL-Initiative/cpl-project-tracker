// CPL Implementation Funding — the MEMO's noncredit figures must come from the
// noncredit MODEL, not from a re-split of the carve-out.
//
// WHY THIS FILE EXISTS. On 2026-08-23 the noncredit lane stopped being a flat
// FTES split of the carve-out among the standalone feeder campuses and became
// the same bounded allocation the credit pool uses (ncModel: 33 institutions —
// 30 credit colleges running their own noncredit programs plus 3 standalone —
// clamped between a floor and a ceiling). The TAB was migrated. `memoModel()`
// was not: it kept `feederBasis(f) / Σ feederBasis * carve`, the retired
// mechanism, and the memo is the EXPORTED document — the artifact that leaves
// the tab, the gate and the room.
//
// What that produced at Sam's live dials ($1,800,000 carve-out):
//
//     institution        memo said     the model pays
//     Mt. SAC NC         $779,862      $0    (deduped — see below)
//     SD Cont. Ed        $672,453      $100,000
//     North Orange       $275,671      $50,000
//     Calbright          $ 72,014      $50,000
//     the 30 colleges    absent        the remaining $1,600,000
//
// Two independent defects, either of which alone is disqualifying:
//
//   1. It pays the ENTIRE carve-out to four institutions, so 30 colleges'
//      noncredit money is missing from the one document that tells a district
//      what it is getting.
//   2. It pays $779,862 to Mt. SAC Noncredit, whose noncredit FTES is ALREADY
//      counted on the Mt. San Antonio credit row. `ncInstitutions()` zeroes its
//      size for exactly this reason and the model pays it $0. Re-deriving the
//      split re-introduces the double payment that
//      `methodology-a-deduplication-has-a-scope` was written to prevent.
//
// The standing invariant this file enforces is the one CLAUDE.md already states
// for the credit lane — NEVER re-derive an allocation, call the model — applied
// to the noncredit lane, and pinned on the surface where re-derivation is
// hardest to notice because nobody reads the export next to the screen.
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_memo_noncredit.test.js`).
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// Sam's live overlay, read from cpl_funding_config on 2026-08-23 21:15:31Z. The
// defect is present at the baked defaults too, but it is worth pinning at the
// dials actually in production: a $1.8M carve-out makes the misstatement bigger,
// and this is the configuration a reader would have been handed.
const LIVE = { admin_cost: 800000, floor_window: 150000, feeder_carveout: 1800000,
               nc_floor_window: 50000, scaling_projects_tech: 8959692 };

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

// PARSE THE ROW, do not grep the document. The first draft of this file
// substring-matched `money(award)` against the whole memo and three assertions
// could not fail: "$50,000" is also the ESS 25-82 seed grant named in the memo
// intro, so two institutions "passed" on a sentence about something else. An
// assertion that matches text the document prints for another reason is not a
// guard — the same shape as asserting on the one container that clears itself.
function allocRows(memo) {
  const out = {};
  const re = /<td class='t' style='padding-left:1\.5em;'>([\s\S]*?)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g;
  let m;
  while ((m = re.exec(memo)) !== null) {
    const name = m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const num = (s) => {
      const t = String(s).replace(/&mdash;|—/g, "").replace(/[$,]/g, "").trim();
      return t === "" ? null : Number(t);
    };
    out[name] = { credit: num(m[2]), nc: num(m[3]), raw: name };
  }
  return out;
}
// A row keyed by the institution's name, however the memo decorated it.
function rowFor(rows, needle) {
  const k = Object.keys(rows).find((n) => n.indexOf(needle) === 0 || n.indexOf(needle) !== -1);
  return k ? rows[k] : null;
}

function boots(pool) {
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  if (pool) T._setScenario({ pool: pool });
  T.render();
  const memo = T._buildMemo("memo");
  return { T, memo, nc: T._ncModel(), rows: allocRows(memo) };
}

// ─────────────────────────────────────────────────────────────────────────────
// N1 — the memo agrees with the model, institution by institution
// ─────────────────────────────────────────────────────────────────────────────
// The check is deliberately "the model's figure appears in the memo AND the
// re-split figure does not". Asserting only the first would pass on a document
// that printed both, which is exactly what a half-migration looks like.
{
  const { memo, nc, rows } = boots(LIVE);

  // The three standalone institutions that ARE in the lane. Asserted on the
  // institution's OWN row, so the figure has to be where a reader would read it.
  [["North Orange Continuing Education", "NC:NOCE"],
   ["San Diego College of Continuing Education", "NC:SD Cont. Ed"],
   ["Calbright College", "NC:Calbright"]].forEach(function (pair) {
    const award = nc.W[pair[1]] || 0;
    const row = rowFor(rows, pair[0]);
    check("memo row for " + pair[0] + " pays what the model pays (" + money(award) + ")",
      award > 0 && !!row && row.nc === Math.round(award));
    check("...and shows no credit allocation for it (it has no credit row)",
      !!row && row.credit === null);
  });

  // THE DEDUP. Mt. SAC Noncredit is a real grantee and stays listed — the rule
  // is "zero the measure, keep the record, render the reason" — but it must not
  // be paid from a lane whose size basis excludes it.
  const mtsac = rowFor(rows, "Mt. San Antonio College — Noncredit");
  check("Mt. SAC Noncredit is still LISTED in the memo (a real ESS 25-82 grantee)",
    !!mtsac);
  check("...paid nothing, shown as — rather than a $0 that reads as passed over",
    !!mtsac && mtsac.nc === null);
  check("...and the memo says WHY, naming the row that carries its FTES",
    /Mt\. San Antonio College — Noncredit[\s\S]{0,200}counted on the Mt San Antonio row/.test(
      memo.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")));
  check("model pays Mt. SAC Noncredit nothing (its FTES is on the credit row)",
    !(nc.W["NC:Mt. SAC NC"] > 0));
  // The re-split figure at these dials. Pinned as a literal because that is the
  // number a reader would have acted on.
  check("memo does NOT print the re-split figure $779,862 for the deduped campus",
    memo.indexOf("$779,862") === -1);
  check("memo does NOT print the other three re-split figures either",
    memo.indexOf("$672,453") === -1 && memo.indexOf("$275,671") === -1 &&
    memo.indexOf("$72,014") === -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// N2 — the 30 colleges' noncredit money is IN the document
// ─────────────────────────────────────────────────────────────────────────────
// A district reading the allocation table must be able to see the noncredit
// money its colleges receive. Under the re-split it was not in the document at
// all, and its absence is invisible: the table still tied to the institution
// total, because the four campuses had absorbed the whole carve-out.
{
  const { T, nc, rows } = boots(LIVE);
  const collegeRows = nc.rows.filter(function (r) { return r.kind === "college"; });
  check("the lane really is mostly colleges (guards the fixture, not the code)",
    collegeRows.length >= 25);

  // EVERY college award, not a sample. A join that drops some colleges and keeps
  // others is the likeliest failure here, and one spot-check cannot see it.
  var missing = collegeRows.filter(function (r) {
    const row = rowFor(rows, T._display ? T._display(r.name) : r.name) || rowFor(rows, r.name);
    return !row || row.nc !== Math.round(nc.W[r.key] || 0);
  });
  check("every college in the lane shows its own noncredit award on its own row" +
        (missing.length ? " — missing: " + missing.slice(0, 3).map(function (r) { return r.name; }).join(", ") : ""),
    missing.length === 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// N3 — noncredit money is shown BESIDE credit money, never folded into it
// ─────────────────────────────────────────────────────────────────────────────
// Sam's constraint, recorded twice: noncredit "never sums into the credit
// total — own column, own CSV columns, own My College line" ("the neglected
// step child"). So the fix must not repair the tie-out by adding the noncredit
// award onto the college's credit figure.
{
  const { T, memo, nc, rows } = boots(LIVE);
  const withNc = nc.rows.filter(function (r) { return r.kind === "college" && (nc.W[r.key] || 0) > 0; })
    .map(function (r) { return { name: r.name, nc: nc.W[r.key], credit: T._alloc(r.name).total }; })
    .sort(function (a, b) { return b.nc - a.nc; })[0];
  const row = rowFor(rows, withNc.name);
  check("that college's CREDIT column is its credit allocation, unmodified",
    !!row && row.credit === Math.round(withNc.credit));
  check("...its NONCREDIT column is the noncredit award, in a column of its own",
    !!row && row.nc === Math.round(withNc.nc));
  check("...and the two are never fused into one figure",
    !!row && row.credit !== Math.round(withNc.credit + withNc.nc) &&
    memo.indexOf(money(withNc.credit + withNc.nc)) === -1);
  check("the table header names the noncredit column",
    memo.indexOf("Noncredit support") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// N4 — the counts describe the lane, not the standalone roster
// ─────────────────────────────────────────────────────────────────────────────
{
  const { memo, nc } = boots(LIVE);
  const m = memo.match(/Funded Noncredit Campuses<\/td><td>(\d+)</);
  check("memo reports a Funded Noncredit count", !!m);
  check("...and it is the LANE count (" + nc.rows.length + "), not the " +
        D.feeders.length + "-record standalone roster",
    !!m && Number(m[1]) === nc.rows.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// N5 — the allocation table still ties out
// ─────────────────────────────────────────────────────────────────────────────
// The tie-out is what made the defect survivable: four campuses absorbing the
// whole carve-out produced a table that added up. So the fix has to keep the
// total honest while moving the money to the right rows.
{
  const { T, memo, nc } = boots(LIVE);
  const credit = D.colleges.reduce(function (s, c) { return s + T._alloc(c.college).total; }, 0);
  const ncTotal = nc.rows.reduce(function (s, r) { return s + (nc.W[r.key] || 0); }, 0);
  check("the noncredit lane spends the whole carve-out (sanity on the model)",
    Math.abs(ncTotal - nc.pool) < 1);
  check("memo TOTAL row still carries the statewide institution total",
    memo.indexOf("TOTAL (statewide") !== -1 &&
    memo.indexOf(money(credit + ncTotal)) !== -1);
  check("...split across the two columns, so each ties to its own lane",
    memo.indexOf(money(credit)) !== -1 && memo.indexOf(money(ncTotal)) !== -1);

  // A district with no credit member must not print "$0" — Calbright's subtotal
  // did, beside its real $50,000 of noncredit support. Not zero: not applicable.
  const subtotals = [...memo.matchAll(/<td class='t'><strong>([^<]*)<\/strong><\/td><td><strong>([^<]*)<\/strong><\/td><td><strong>([^<]*)<\/strong>/g)]
    .map((m) => ({ d: m[1], credit: m[2], nc: m[3] }));
  check("district subtotals were parsed (guards the assertion below)", subtotals.length > 50);
  check("no district subtotal claims $0 credit while carrying noncredit money",
    !subtotals.some((s) => /^\$0$/.test(s.credit.trim())));
}

// ─────────────────────────────────────────────────────────────────────────────
// N6 — the retired mechanism is GONE from the source, not merely unused
// ─────────────────────────────────────────────────────────────────────────────
// A dormant re-split is a defect waiting for its next caller. Comment lines are
// stripped first: a grep for "the old formula is gone" otherwise matches the
// comment that explains why it went — the trap named in the Session 185 handoff.
{
  const code = consumerSrc.split("\n")
    .filter(function (l) { return !/^\s*(\/\/|\*|\/\*)/.test(l); }).join("\n");
  check("no `/ fbasis * carve` re-split survives in live code",
    !/fbasis\s*\*\s*carve|\/\s*fbasis\s*\*\s*carve/.test(code));
  check("memoModel reads the noncredit MODEL",
    /memoModel[\s\S]{0,1200}?ncModel\s*\(/.test(code));
}

// ─────────────────────────────────────────────────────────────────────────────
// N7 — and it holds at the baked defaults too, not just at Sam's dials
// ─────────────────────────────────────────────────────────────────────────────
{
  const { memo, nc } = boots(null);
  const sd = nc.W["NC:SD Cont. Ed"] || 0;
  check("at the baked defaults the memo still agrees with the model",
    sd > 0 && memo.indexOf(money(sd)) !== -1);
  check("...and still pays the deduped campus nothing",
    !(nc.W["NC:Mt. SAC NC"] > 0));
}

// ─────────────────────────────────────────────────────────────────────────────
// N8 — the two ON-SCREEN cards describe the LANE, not the standalone roster
// ─────────────────────────────────────────────────────────────────────────────
// Same defect class as the memo, found by the same reading. The pool card said
// the carve-out went "to the 4 NC campuses below" and the table count line said
// "plus 4 noncredit campuses (74,968 students)". Both describe a 33-institution
// lane by a 4-record roster, and the 74,968 is a HEADCOUNT the lane does not
// allocate on that also counts Mt. SAC Noncredit — the institution the carve-out
// pays $0. The pool card is the one a reader uses to judge whether the carve-out
// is proportionate, which is the question Sam raised it to $1.8M to answer.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ pool: LIVE });
  T.render();
  const doc = window.document;
  const nc = T._ncModel();
  const page = doc.body.textContent.replace(/\s+/g, " ");

  check("pool card no longer says the carve-out goes to 4 NC campuses",
    !/\b4 NC campuses\b/.test(page));
  check("pool card names the LANE size (" + nc.rows.length + " institutions)",
    page.indexOf(nc.rows.length + " institutions in the noncredit lane") !== -1);

  const line = doc.getElementById("cplFundCount");
  check("the table count line is painted", !!line);
  check("...it counts the lane, not the standalone roster",
    !!line && line.textContent.indexOf("noncredit support for " + nc.rows.length + " institutions") !== -1);
  check("...it reports noncredit FTES, the basis the lane allocates on",
    !!line && /noncredit FTES\)/.test(line.textContent));
  // 74,968 = Σ feederHeads() including the deduped campus's 35,363. Pinned as a
  // literal: nearly half of the retired figure was an institution paid nothing.
  check("...and no longer prints the 74,968-student roster headcount",
    !!line && line.textContent.indexOf("74,968") === -1);
  check("...it still names the carve-out that funds it",
    !!line && line.textContent.indexOf("carve-out") !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────
// N9 — "How an allocation is computed" describes the noncredit lane
// ─────────────────────────────────────────────────────────────────────────────
// Sam, 2026-08-23: "need to add the NC calcs explanation to How these are
// computed". The section a reader opens to check the arithmetic described only
// the credit pool and never mentioned that a second lane exists. Every figure
// is asserted against the model, because a hand-typed one decays the moment a
// dial moves — which is how this tab acquired most of its defects.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  T._setScenario({ pool: LIVE });
  T.render();
  const nc = T._ncModel();
  const li = [...window.document.querySelectorAll(".cplfund-formula li")]
    .map((e) => e.textContent.replace(/\s+/g, " "))
    .find((t) => /Noncredit support/.test(t));

  check("the computed-how section carries a noncredit bullet", !!li);
  check("...it names the carve-out from the model", !!li && li.indexOf(money(nc.pool)) !== -1);
  check("...the entry threshold", !!li && li.indexOf(String(Math.round(nc.threshold))) !== -1);
  check("...the lane size and its split (" + nc.rows.length + ")",
    !!li && li.indexOf(nc.rows.length + " qualify today") !== -1);
  check("...the minimum and maximum",
    !!li && li.indexOf(money(nc.floor)) !== -1 && li.indexOf(money(nc.cap)) !== -1);
  check("...and where growth starts paying (" + Math.round(nc.breakEven) + " FTES)",
    !!li && li.indexOf(Math.round(nc.breakEven).toLocaleString("en-US")) !== -1);
  check("...and it says noncredit is never part of the credit allocation",
    !!li && /never part of the credit allocation/.test(li));
}

// ─────────────────────────────────────────────────────────────────────────────
// N10 — an unaffordable minimum is stated as such HERE too
// ─────────────────────────────────────────────────────────────────────────────
// #1302 stopped the noncredit BOX from reporting a floor it could not honor.
// The computed-how section is a second place that states the minimum, and it is
// the one a reader opens precisely to check the arithmetic — so it must not
// quote a minimum nobody receives.
{
  const { window } = freshDom();
  boot(window);
  const T = window.CPL_FUNDING_TAB;
  // 33 institutions × $50,000 against a $1,000,000 carve-out — the exact
  // configuration Sam hit on 2026-08-23.
  T._setScenario({ pool: { feeder_carveout: 1000000, nc_floor_window: 50000 } });
  T.render();
  const nc = T._ncModel();
  const li = [...window.document.querySelectorAll(".cplfund-formula li")]
    .map((e) => e.textContent.replace(/\s+/g, " "))
    .find((t) => /Noncredit support/.test(t));
  check("the fixture really is infeasible (guards the test, not the code)",
    !!nc.floorInfeasible);
  check("the computed-how section says the minimum cannot be honored",
    !!li && /cannot be honored/.test(li));
  check("...and names what each institution actually receives",
    !!li && li.indexOf(money(nc.pool / nc.rows.length)) !== -1);
  check("...and does NOT claim institutions sit at the minimum",
    !!li && !/sit at the minimum/.test(li));
  check("...nor that growth starts paying (nothing is proportional there)",
    !!li && !/growth only starts paying/.test(li));
}

finish();
