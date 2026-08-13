// Sierra's CPL contact line — read MAP live, pair the person, never route to a
// dead address.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-13, on a live answer about Riverside City College: "Wrong contact
// information for RCC." He reported one college. The measurement said it was a
// third of them.
//
// Sierra took her contact line from chatbox_college_profiles.contacts — a ONE-OFF
// snapshot written 2026-06-25 that nothing in the repo refreshes. map/sync_map_users.py
// WRITES map_college_contacts and only READS the profiles table (for dashboard
// URLs); there is no builder for that JSONB anywhere. Measured over the 122
// colleges present in both tables on the day this landed:
//
//     41  Sierra printed a DIFFERENT email than MAP holds
//     13  Sierra printed NOTHING while MAP had someone
//     50  agreed
//
// RCC was one of the 41: Sierra said Rene Felix (rfelix@rcc.edu) while MAP holds
// Jeanine Gardner as primary contact and Lisa Martin as CPL coordinator — the
// slot Sierra's own code PREFERS, and which the snapshot has blank.
//
// This is the same shape as the statewide-flag bug from the day before, and
// CLAUDE.md already carries the lesson: a settled ruling does not enforce itself,
// the consumer has to change. So the fix reads live rather than re-freezing a
// newer snapshot, and these assertions guard the failure modes that made the
// live read non-trivial.
//
// The fixtures are REAL rows measured from map_college_contacts on 2026-08-13,
// not invented shapes — including their whitespace, their commas and their
// malformed addresses, which is the whole point.
//
// Run from repo root: `npm test` (or `node tests/sierra_college_contacts.test.js`).
const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

let mod = null, liftErr = null;
try {
  mod = liftBlock(SRC, "// ── Live CPL contacts (v45", "// Reusable response rules",
    ["CONTACT_CASCADE", "firstEmail", "firstName", "resolveLiveContact",
     "fetchLiveContacts", "withLiveContacts", "buildCollegeContext"]);
} catch (e) { liftErr = e; }
check("live-contact block lifts out of index.ts cleanly", !liftErr && mod);
if (liftErr) {
  console.log(`\nlift error: ${liftErr.message}`);
  console.log("\n0/1 checks passed");
  process.exit(1);
}

const { resolveLiveContact, firstEmail, withLiveContacts, buildCollegeContext } = mod;

// ── Real rows, measured 2026-08-13 ──────────────────────────────────────────
const RCC = {
  college: "Riverside City College",
  cpl_coordinator: "Lisa Martin",
  cpl_coordinator_email: "Lisa.Martin@rcc.edu",
  primary_contact: "Jeanine Gardner",
  primary_contact_email: "jeanine.gardner@rccd.edu",
  cpl_assistant_email: "",
  cpl_counselor: "Vivian Ygloria; Lisa Martin",
  cpl_counselor_email: "vivian.ygloria@rccd.edu; lisa.martin@rcc.edu",
  articulation_officer: "Nicole Banerjee",
  articulation_officer_email: "Nicole.Banerjee@rcc.edu",
  lead_initiator: "", lead_initiator_email: "",
  faculty_lead: "", faculty_lead_email: "",
};

// Trailing space in the college NAME, commas AND embedded newlines in both the
// name and the email field, a trailing space inside a name, and — the reason the
// address is validated rather than merely split — a middle address with no TLD.
const CYPRESS = {
  college: "Cypress College ",
  cpl_coordinator: "Juan Carlos Garcia, Jacquelyn Rangel,\nJolena  Grande ",
  cpl_coordinator_email: "jgarcia@cypresscollege.edu, jrangel@cypresscollege,\njgrande@cypresscollege.edu",
  primary_contact: "Juan Garcia, Jacquelyn Rangel",
  primary_contact_email: "jgarcia@cypresscollege.edu,  jrangel@cypresscolleg",
  cpl_assistant_email: "",
  cpl_counselor: "", cpl_counselor_email: "",
  articulation_officer: "Jacky  Rangel",
  articulation_officer_email: "jrangel@cypresscollege.edu",
  lead_initiator: "Amy Minakha,\nLinda Redd",
  lead_initiator_email: "wminakha@cypresscollege.edu,\nlredd@cypresscollege.edu",
  faculty_lead: "Jolena  Grande ",
  faculty_lead_email: "jgrande@cypresscollege.edu",
};

// Every CPL-role slot empty; only a VPAA. One of the 7 colleges MAP cannot route.
const SISKIYOUS = {
  college: "College of the Siskiyous",
  cpl_coordinator: "", cpl_coordinator_email: "",
  primary_contact: "", primary_contact_email: "",
  cpl_assistant_email: "",
  cpl_counselor: "", cpl_counselor_email: "",
  articulation_officer: "", articulation_officer_email: "",
  lead_initiator: "", lead_initiator_email: "",
  faculty_lead: "", faculty_lead_email: "",
  vpaa_email: "mfields1@siskiyous.edu",
  ceo_email: "",
};

// The stale snapshot Sierra used to read — the actual RCC contacts JSONB.
const RCC_PROFILE = {
  college: "Riverside City College",
  total_exhibits: 40, total_credit_recs: 90, discipline_count: 12,
  contacts: {
    cpl_counselor: "", cpl_coordinator: "",
    primary_contact: "Rene Felix",
    cpl_counselor_email: "", cpl_coordinator_email: "",
    primary_contact_email: "rfelix@rcc.edu",
    primary_contact_phone: "951-222-8000",
  },
};

// ── A fake PostgREST client that counts reads ───────────────────────────────
function fakeSb(rows, opts = {}) {
  const counter = { queries: 0 };
  return {
    counter,
    from() {
      return {
        select() {
          counter.queries++;
          if (opts.throws) throw new Error("boom");
          return { then: (res) => res({ data: rows }) };
        },
      };
    },
  };
}

// ── 1. The reported bug: the coordinator MAP holds, not the snapshot's name ──
{
  const c = resolveLiveContact(RCC);
  check("RCC resolves to the CPL coordinator MAP holds", c && c.email === "Lisa.Martin@rcc.edu");
  check("RCC contact is labelled with its role", c && c.role === "CPL Coordinator");
  check("RCC name and email are the same person", c && c.name === "Lisa Martin");
  check("RCC no longer resolves to the stale Rene Felix", c && !/rfelix/i.test(c.email));
}

// ── 2. Cascade order: coordinator outranks primary ──────────────────────────
{
  const noCoord = { ...RCC, cpl_coordinator: "", cpl_coordinator_email: "" };
  const c = resolveLiveContact(noCoord);
  check("with no coordinator, falls to the primary contact", c && c.email === "jeanine.gardner@rccd.edu");
  check("primary-contact tier is labelled CPL Contact", c && c.role === "CPL Contact");

  const onlyCounselor = { ...noCoord, primary_contact: "", primary_contact_email: "" };
  const c2 = resolveLiveContact(onlyCounselor);
  // Semicolon-separated pair: Vivian's name must carry Vivian's address, not Lisa's.
  check("counselor tier pairs the FIRST name with the FIRST email",
    c2 && c2.name === "Vivian Ygloria" && c2.email === "vivian.ygloria@rccd.edu");
}

// ── 3. Malformed addresses are never handed to a visitor ────────────────────
{
  check("an address with no TLD is rejected", firstEmail("jrangel@cypresscollege") === "");
  check("the first VALID address wins, not merely the first token",
    firstEmail("jrangel@cypresscollege, jgrande@cypresscollege.edu") === "jgrande@cypresscollege.edu");
  check("an all-malformed field yields nothing rather than a broken route",
    firstEmail("jrangel@cypresscolleg,  nope") === "");

  const c = resolveLiveContact(CYPRESS);
  check("Cypress resolves to its first VALID coordinator address",
    c && c.email === "jgarcia@cypresscollege.edu");
  check("Cypress pairs that address with the matching name",
    c && c.name === "Juan Carlos Garcia");
  check("Cypress never surfaces the TLD-less address", c && c.email !== "jrangel@cypresscollege");
}

// ── 4. Leadership-only colleges are NOT routed to a VPAA or a president ─────
{
  const c = resolveLiveContact(SISKIYOUS);
  check("a leadership-only college resolves to NO contact", c === null);
  const cascadeCols = mod.CONTACT_CASCADE.flatMap(([n, e]) => [n, e]).join(",");
  check("the cascade never reads vpaa/vpss/ceo/senate/certifying",
    !/vpaa|vpss|\bceo\b|senate|certifying/.test(cascadeCols));
}

// ── 5. Both sides of the join are normalised (Cypress has a trailing space) ──
{
  (async () => {
    const profile = { college: "Cypress College", contacts: {} };
    const out = await withLiveContacts(profile, fakeSb([CYPRESS]), true);
    check("a padded MAP college name still matches the profile's clean name",
      out.live_contact && out.live_contact.email === "jgarcia@cypresscollege.edu");
  })();
}

// ── 6. Fail-safe: never worse than the snapshot it replaces ─────────────────
{
  (async () => {
    const out = await withLiveContacts(RCC_PROFILE, fakeSb([], { throws: true }), true);
    check("a failed live read keeps the profile untouched", !out.live_contact);
    const ctx = buildCollegeContext(out, true);
    check("a failed live read still prints the snapshot contact", /Rene Felix/.test(ctx));

    const noRow = await withLiveContacts(RCC_PROFILE, fakeSb([SISKIYOUS]), true);
    check("a college with no map_college_contacts row falls back to the snapshot",
      !noRow.live_contact && /Rene Felix/.test(buildCollegeContext(noRow, true)));
  })();
}

// ── 7. The external/vendor gate still suppresses, and costs nothing ─────────
{
  (async () => {
    const sb = fakeSb([RCC]);
    const out = await withLiveContacts(RCC_PROFILE, sb, false);
    check("contacts suppressed => no live read is issued at all", sb.counter.queries === 0);
    check("contacts suppressed => profile passes through unchanged", out === RCC_PROFILE);
    check("contacts suppressed => no contact line is rendered",
      !/Lisa Martin|Rene Felix|@/.test(buildCollegeContext(out, false)));
  })();
}

// ── 8. What the model actually receives ─────────────────────────────────────
{
  (async () => {
    const out = await withLiveContacts(RCC_PROFILE, fakeSb([RCC]), true);
    const ctx = buildCollegeContext(out, true);
    check("the rendered line names the live coordinator", /CPL Coordinator: Lisa Martin/.test(ctx));
    check("the rendered line carries the live address", /Lisa\.Martin@rcc\.edu/.test(ctx));
    check("the stale name is gone from the rendered context", !/Rene Felix/.test(ctx));
    check("the stale address is gone from the rendered context", !/rfelix@rcc\.edu/.test(ctx));

    // An email-only tier (cpl_assistant_email has no name column) must render the
    // address rather than an empty name followed by a parenthesised address.
    const assistantOnly = {
      college: "Test College", cpl_coordinator: "", cpl_coordinator_email: "",
      primary_contact: "", primary_contact_email: "",
      cpl_assistant_email: "cpl@test.edu",
      cpl_counselor: "", cpl_counselor_email: "",
      articulation_officer: "", articulation_officer_email: "",
      lead_initiator: "", lead_initiator_email: "", faculty_lead: "", faculty_lead_email: "",
    };
    const p2 = await withLiveContacts({ college: "Test College", contacts: {} },
      fakeSb([assistantOnly]), true);
    const ctx2 = buildCollegeContext(p2, true);
    check("an email-only tier renders the address, not an empty name",
      /CPL Office: cpl@test\.edu/.test(ctx2) && !/CPL Office:\s*\(/.test(ctx2));
  })();
}

// The async blocks above resolve on already-settled promises, so a single
// macrotask tick is enough for every check to land before the summary.
setTimeout(() => {
  const passed = results.filter(([, ok]) => ok).length;
  for (const [name, ok] of results) console.log(`  ${ok ? "ok  " : "FAIL"}   ${name}`);
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exit(1);
}, 0);
