// Sierra — a DISTRICT question is answered from the district roster, and a
// roster does not wear a candidate list's caveat.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-21, re-asking the LACCD question after the census fix (#1277):
//
//     "Why is it starting with a caveat that it can't enumerate the full
//      district when it has them all listed?"
//
// Fair. The caveat was correct when it was written and obsolete a few hours
// later: PR #1278 landed `district`, `mis_district_code` and `district_type` on
// `map_colleges` — 118 of 128 rows, 73 districts — the SAME DAY the comment in
// index.ts recorded "verified 2026-08-21: zero columns named district in the
// whole public schema". The capability arrived; the consumer never changed.
//
// ⭐ THE POINT IS NOT THE CAVEAT, IT IS THE FOUR DISTRICTS NAME-MATCHING CANNOT
// SEE AT ALL. LACCD is the easy case — all nine colleges are called "Los
// Angeles". Measured against map_colleges, four multi-college districts have
// ZERO colleges named after them:
//
//     Los Rios      → American River · Cosumnes River · Folsom Lake · Sacramento City
//     Peralta       → Berkeley City · College of Alameda · Laney · Merritt
//     State Center  → Clovis · Fresno City · Madera · Reedley
//     Kern          → Bakersfield · Cerro Coso · Porterville
//
// For those, the name matcher returns NOTHING and the honest caveat was the
// only answer available. That is what this route buys.
//
// ⚠ THE ROSTER MAY ONLY CALL ITSELF COMPLETE BECAUSE THE JOIN WAS MEASURED:
// all 116 district colleges in map_colleges have an exact-name row in
// chatbox_college_profiles (0 missing, 2026-08-21). A PARTIAL roster presented
// as complete is the census defect again with better provenance, so `missing`
// is carried and stated.
//
// ⚠ THE REGRESSION THIS MUST PREVENT is the district route eating ordinary
// college questions: the stem of "Los Angeles Community College District" is
// "los angeles", which is also inside a question about Los Angeles City
// College. Block (3) is that guard.
//
// Verified fail-first 2026-08-21 against the pre-change index.ts: blocks (2)
// and (4) fail there (no resolveDistrict export, no roster header), and block
// (1) fails on the lift.
//
// Run from repo root: `npm test` (or `node tests/sierra_district_roster.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
// Nothing between checks may throw — a dead driver removes checks silently, and
// a run that reports nothing is indistinguishable from a run that passes.
// (methodology-a-check-that-never-registers-can-never-fail)
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    // ⚠ COLLECT the promise. A block whose checks register inside .then() lands
    // AFTER the summary unless something awaits it, and those checks then
    // vanish from both sides of the ratio — the very defect this suite's
    // sibling (tests/check_ledger.test.js) exists to make visible.
    if (r && typeof r.then === "function") {
      pending.push(r.catch((e) => check(label + " — async driver threw: " + (e && e.message), false)));
    }
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}
function val(fn) { try { return fn(); } catch (e) { return undefined; } }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

/* ⚠ TWO SEPARATE try BLOCKS, and that is the whole difference between a
 * fail-first proof and a fail-first no-op.
 *
 * The first lift names `resolveDistrict`, which does not exist before this
 * change — so against a pre-change index.ts it THROWS. Sharing one try with the
 * second lift left `ctxMod` null too, every later block short-circuited on
 * "skipped — no lift", and the pre-change run reported 0/5: it proved only that
 * a new function was missing, which nobody doubted.
 *
 * `buildCollegeContext` exists on BOTH sides, so lifting it independently makes
 * blocks (4) and (5) real: pre-change they run and FAIL on the absent roster
 * header and the "students awarded" label. This is verbatim the warning in
 * sierra_candidate_census.test.js — "a fail-first check that proved only that
 * the constant was missing" — which this file re-learned the hard way. */
let detectMod = null, ctxMod = null, liftErr = null, ctxErr = null;
try {
  detectMod = liftBlock(SRC, "const COLLEGE_ALIASES", "// ── Topic synonym expansion",
    ["detectAndFetchCollegeProfile", "resolveDistrict", "districtKeys"]);
} catch (e) { liftErr = e; }
try {
  ctxMod = liftBlock(SRC, "function buildCollegeContext(", "// Reusable response rules",
    ["buildCollegeContext"]);
} catch (e) { ctxErr = e; }

// ── (1) The block still lifts ─────────────────────────────────────────────
// Not ceremony: this file's edits have broken the lift three separate ways —
// a `type X = {}` declaration inside the range, a `!` non-null assertion, and
// an object-literal annotation the stripper leaves half-eaten. Each one takes
// EVERY lifting suite down at once, so it is worth one loud check.
block("(1)", function () {
  check("(1) the college-detection block lifts cleanly",
    !liftErr && !!detectMod, liftErr && liftErr.message);
  check("(1) the context block lifts cleanly",
    !ctxErr && !!ctxMod, ctxErr && ctxErr.message);
});

/* Fake PostgREST, same shape as sierra_candidate_census.test.js. It serves two
 * tables, so `from(table)` must actually branch — the census fake ignores its
 * argument, which is fine there and would silently serve college rows to the
 * map_colleges query here. */
function fakeSb(mapColleges, profiles) {
  return {
    from(table) {
      const src = table === "map_colleges" ? mapColleges : profiles;
      const q = { rows: (src || []).slice() };
      const api = {
        select() { return api; },
        eq(col, v) { q.rows = q.rows.filter((r) => r[col] === v); return api; },
        in(col, vals) { q.rows = q.rows.filter((r) => vals.includes(r[col])); return api; },
        not(col, op, v) {
          if (op === "is" && v === null) q.rows = q.rows.filter((r) => r[col] != null);
          return api;
        },
        ilike(col, pat) {
          const n = String(pat).replace(/%/g, "").toLowerCase();
          q.rows = q.rows.filter((r) => String(r[col]).toLowerCase().includes(n));
          return api;
        },
        order() { q.rows.sort((a, b) => String(a.college || a.college_name)
          .localeCompare(String(b.college || b.college_name))); return api; },
        limit(n) { q.rows = q.rows.slice(0, n); return api; },
        single() { return { then: (res) => res({ data: q.rows[0] || null }) }; },
        then(res) { return res({ data: q.rows }); },
      };
      return api;
    },
  };
}

const LACCD = [
  "East Los Angeles College", "Los Angeles City College", "Los Angeles Harbor College",
  "Los Angeles Mission College", "Los Angeles Pierce College", "Los Angeles Southwest College",
  "Los Angeles Trade Technical College", "Los Angeles Valley College", "West Los Angeles College",
];
// The case that matters: not one of these contains "Peralta".
const PERALTA = ["Berkeley City College", "College of Alameda", "Laney College", "Merritt College"];

const mapRow = (name, district, code, kind) => ({
  college_name: name, district: district, mis_district_code: code,
  entity_kind: kind || "college",
});
const MAP_ROWS = []
  .concat(LACCD.map((n) => mapRow(n, "Los Angeles Community College District", "740")))
  .concat(PERALTA.map((n) => mapRow(n, "Peralta Community College District", "460")))
  .concat([mapRow("Cerritos College", "Cerritos Community College District", "230"),
           mapRow("Las PosTest College", "Los Angeles Community College District", "740", "test")]);

const profile = (college) => ({
  college: college, total_exhibits: 5, total_credit_recs: 9, discipline_count: 2,
  credit_distribution: {
    eligible_credits: 100, applied_credits: 1, transcribed_credits: 7, students_awarded: 3,
  },
});
const PROFILES = LACCD.concat(PERALTA).concat(["Cerritos College"]).map(profile);
const sb = () => fakeSb(MAP_ROWS, PROFILES);

// ── (2) The roster resolves, from ids not names ───────────────────────────
block("(2)", function () {
  if (!detectMod) { check("(2) skipped — no lift", false); return; }
  const keys = val(() => detectMod.districtKeys("Los Angeles Community College District")) || [];
  check("(2) districtKeys derives the stem and the acronym",
    keys.indexOf("los angeles") >= 0 && keys.indexOf("laccd") >= 0, JSON.stringify(keys));

  const laccd = val(() => detectMod.resolveDistrict(
    "What should Los Angeles Community College District do to help its colleges award more CPL?", sb()));
  return Promise.resolve(laccd).then((d) => {
    check("(2) the LACCD question resolves to a district", !!d && d.district === "Los Angeles Community College District");
    check("(2) …with all NINE members", !!d && d.members.length === 9, d && String(d.members.length));
    check("(2) …carrying the CCCCO MIS district code", !!d && d.code === "740");
    check("(2) …alphabetically, not by size", !!d &&
      d.members[0] === "East Los Angeles College" &&
      d.members[8] === "West Los Angeles College",
      "Sam: ranking a district's own colleges by units invites the rivalry the answer is defusing");
    check("(2) ⚠ MAP's own test orgs are excluded from the roster",
      !!d && d.members.indexOf("Las PosTest College") < 0,
      "a sandbox row must never be named to a reader as a member college");
    check("(2) nothing is reported missing (the join was measured at 116/116)",
      !!d && d.missing.length === 0, d && JSON.stringify(d.missing));

    // ⭐ The whole argument for using the roster instead of names.
    const per = val(() => detectMod.resolveDistrict("How is Peralta Community College District doing?", sb()));
    return Promise.resolve(per).then((p) => {
      check("(2) ⭐ Peralta resolves, though NO member college is named 'Peralta'",
        !!p && p.members.length === 4, p && JSON.stringify(p && p.members));
      check("(2) ⭐ …and a name match would have found none of them",
        PERALTA.every((n) => n.toLowerCase().indexOf("peralta") < 0),
        "this is the case the caveat used to be the only answer for");
      const acr = val(() => detectMod.resolveDistrict("what is LACCD doing about CPL?", sb()));
      return Promise.resolve(acr).then((a) => {
        check("(2) the bare acronym resolves on its own",
          !!a && a.members.length === 9, "no 'district' word in that question");
      });
    });
  });
});

// ── (3) ⚠ It must NOT eat single-college questions ────────────────────────
block("(3)", function () {
  if (!detectMod) { check("(3) skipped — no lift", false); return; }
  const one = val(() => detectMod.resolveDistrict(
    "What CPL does Los Angeles City College offer for CompTIA A+?", sb()));
  return Promise.resolve(one).then((d) => {
    check("(3) ⚠ a one-college question does NOT resolve to a district",
      d === null,
      "the district stem 'los angeles' is inside the college's own name — a bare stem " +
      "match would answer a one-college question with nine colleges");
    const solo = val(() => detectMod.resolveDistrict("Tell me about Cerritos College", sb()));
    return Promise.resolve(solo).then((s) => {
      check("(3) a single-college district is not a district question either",
        s === null, "one member — the college route gives a far richer answer");

      /* ⚠ AND IT MUST NOT PAY FOR THE ROUND TRIP. This function is reached from
       * the ordinary college-detection path, and Sierra's whole-turn budget is
       * 1.7-5.0s, so reading all of map_colleges only to discover the question
       * was never about a district would tax every college question. */
      let reads = 0;
      const counting = fakeSb(MAP_ROWS, PROFILES);
      const realFrom = counting.from.bind(counting);
      counting.from = function (t) { reads++; return realFrom(t); };
      return Promise.resolve(
        val(() => detectMod.resolveDistrict("What CPL does Cerritos College offer?", counting))
      ).then(() => {
        check("(3) ⭐ a plain college question costs ZERO database reads",
          reads === 0, reads + " read(s) — the textual gate should short-circuit first");
        let reads2 = 0;
        const c2 = fakeSb(MAP_ROWS, PROFILES);
        const rf2 = c2.from.bind(c2);
        c2.from = function (t) { reads2++; return rf2(t); };
        return Promise.resolve(
          val(() => detectMod.resolveDistrict("what is LACCD doing about CPL?", c2))
        ).then(() => {
          check("(3) …but a bare acronym still gets through the gate",
            reads2 > 0,
            "nearly every California district acronym ends in CCD, which is what " +
            "lets an acronym-only question past a gate that costs nothing");
        });
      });
    });
  });
});

// ── (4) The context calls it a roster, and drops the caveat ───────────────
block("(4)", function () {
  if (!ctxMod) { check("(4) skipped — no lift", false); return; }
  const stamp = {
    district: "Los Angeles Community College District", code: "740",
    shown: 9, total: 9, missing: [],
  };
  const rows = LACCD.map((n) => Object.assign(profile(n), { _district: stamp }));
  const ctx = val(() => ctxMod.buildCollegeContext(rows)) || "";

  check("(4) ⭐ the context names it the district's actual membership",
    /MEMBERS OF LOS ANGELES COMMUNITY COLLEGE DISTRICT/.test(ctx), ctx.slice(0, 160));
  check("(4) …and cites the MIS district code as the authority",
    /MIS district code 740/.test(ctx));
  check("(4) ⭐ …and explicitly retires the 'cannot enumerate' caveat",
    /Do NOT add a caveat that you cannot enumerate the district/.test(ctx),
    "Sam's actual complaint: hedging over a complete answer is its own credibility failure");
  check("(4) ⚠ …and does NOT carry the name-match warning",
    !/NAME-MATCH CANDIDATES/.test(ctx),
    "a roster wearing a candidate list's caveat is what prompted this work");
  check("(4) the alphabetical order is stated so the model keeps it",
    /listed ALPHABETICALLY/.test(ctx) && /do not re-sort by units/.test(ctx));

  // A partial roster must never read as complete — the census defect with
  // better provenance is still the census defect.
  const partial = LACCD.slice(0, 7).map((n) => Object.assign(profile(n), {
    _district: { district: "Los Angeles Community College District", code: "740",
      shown: 7, total: 9, missing: ["Los Angeles Valley College", "West Los Angeles College"] },
  }));
  const pctx = val(() => ctxMod.buildCollegeContext(partial)) || "";
  check("(4) ⚠ a PARTIAL roster says so and names who is absent",
    /7 of 9 members have data/.test(pctx) && /West Los Angeles College/.test(pctx),
    "otherwise a shorter roster is indistinguishable from a smaller district");
  check("(4) ⚠ …and does not claim the full district",
    !/you may describe this as the full district/.test(pctx));
});

// ── (5) The column labels Sam corrected ───────────────────────────────────
block("(5)", function () {
  if (!ctxMod) { check("(5) skipped — no lift", false); return; }
  const rows = LACCD.slice(0, 3).map((n) => Object.assign(profile(n), {
    _district: { district: "Los Angeles Community College District", code: "740",
      shown: 3, total: 3, missing: [] },
  }));
  const ctx = val(() => ctxMod.buildCollegeContext(rows)) || "";

  check("(5) ⭐ the student column is 'Students in MAP'",
    /Students in MAP/.test(ctx),
    "LA City reads 0 applied, 0 transcribed and 147 students — the figure counts " +
    "students with a CPL record, and 'Students Awarded' stated it as awards");
  check("(5) ⭐ …and the wrong label is explicitly forbidden",
    /NOT students awarded credit/.test(ctx));
  /* ⚠ RE-POINTED 2026-08-24, NOT DELETED. Both assertions below guarded a real
   * requirement — a transcribed column must be asked for, and the per-college
   * numbers must actually be present — but they pinned the SOURCE that was
   * wrong. The figures used to come from chatbox_college_profiles
   * .credit_distribution, whose updated_at is 2026-06-25 and which nothing
   * refreshes; that is what rendered Moreno Valley as 0 / 0 / 0 when the live
   * table says 2,887 students and 12,861 transcribed units. The profile block
   * now carries NO credit figures at all and the live ones come from
   * buildCreditContext, so the requirement holds and the anchor moves.
   * The per-college values themselves are guarded in
   * tests/sierra_district_credit_figures.test.js against the live shape. */
  check("(5) a Transcribed Units column is still required",
    /Transcribed Units/.test(ctx),
    "the figure was already shipped and the model simply dropped it");
  check("(5) ⭐ the profile block carries NO per-college credit figures",
    !/Credit distribution:/.test(ctx) && !/transcribed units/.test(ctx),
    "a stale number looks exactly like a fresh one, so the stale source is gone " +
    "rather than refreshed — one source, which cannot disagree with itself");
  check("(5) ⚠ …and the rule sends the model to the live section for them",
    /TAKE EVERY NUMBER FROM THE "CPL CREDIT DISPOSITION" SECTION/.test(ctx),
    "naming columns while the values were stale is what put the false zeros on screen");
  check("(5) …and no longer says 'students awarded' at the point of the number",
    !/students awarded\b/.test(ctx.replace(/NOT students awarded credit/g, "")),
    "the wording here is what the model echoes into a column header");
});

// Await every block explicitly — NOT a fixed timer. A timer-collected summary
// reports a total that is partly a measurement of how busy the machine is
// (admin_tab.test.js once printed 116, 122 and 123 on identical source).
Promise.all(pending).then(report, report);

function report() {
  let pass = 0;
  for (const [name, ok, why] of results) {
    console.log((ok ? "  ok  " : "FAIL  ") + name + (!ok && why ? "\n        > " + why : ""));
    if (ok) pass++;
  }
  console.log("\nsierra_district_roster.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
}
