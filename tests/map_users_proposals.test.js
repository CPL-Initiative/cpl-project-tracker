// Curator-proposed student contacts, and what the "Proposed because" chip means.
//
// WHY THIS TEST EXISTS
// --------------------
// Sam, 2026-08-13, looking at the 8 colleges with no CPL contact:
//
//   "I see them in the MAP Users tab but don't see a way I can edit them if
//    needed and keep them categorized as Proposed so they can serve as a short
//    list of corrections needed in MAP. Also, the Because column chips are
//    unclear as to their meaning. Some are listed as CPL Assistant. Does that
//    mean that we have a CPL Assistant contact on file but nothing marked
//    Primary Contact? If so, I would think that our cascade process would
//    assign the assistant as the primary contact."
//
// His reading of the cascade was exactly right — map_contact_gaps already
// promotes the assistant, and `proposed_source` is the ROLE THE CASCADE LANDED
// ON, i.e. the provenance of the proposal. The chip just rendered the bare role
// name, which reads as a category of person. Two fixes: say what the chip means,
// and let a curator override any of it.
//
// A proposal NEVER becomes what MAP holds (MAP has no write API) and is
// deliberately excluded from Sierra's routing — Sam's call the same day.
//
// Run from repo root: `npm test` (or `node tests/map_users_proposals.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, msg) { results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]); }

const SRC = fs.readFileSync("map_users.js", "utf8");

function makeWin() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "phrase");
  w.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } }); };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

const w = makeWin();
const M = w.CPL_MAP_USERS_TAB;
check("the tab module exposes the proposal helpers", !!(M && M._effectiveProposal && M._becauseCell));

// Real rows from map_contact_gaps, 2026-08-13. Citrus is the one Sam asked
// about: an assistant email and NO name, because map_college_contacts has
// cpl_assistant_email with no matching name column.
const CITRUS = {
  college: "Citrus College", proposed_name: null,
  proposed_email: "mbuffo@citruscollege.edu", proposed_source: "CPL Assistant",
  needs_ask: false, ask_reason: null, landing_page_url: "",
};
const CANYONS = {
  college: "College of the Canyons", proposed_name: "April Reardon",
  proposed_email: "april.reardon@canyons.edu", proposed_source: "CPL Coordinator",
  needs_ask: false, ask_reason: null, landing_page_url: "",
};
// One of the 8: real MAP presence (13 active users), nobody in a CPL role.
const GAVILAN = {
  college: "Gavilan College", proposed_name: null, proposed_email: null,
  proposed_source: null, needs_ask: true, ask_reason: "leadership only",
  landing_page_url: "",
};

// ── 1. The cascade already does what Sam expected ───────────────────────────
{
  const p = M._effectiveProposal(CITRUS);
  check("the assistant IS proposed as the student contact",
        p.email === "mbuffo@citruscollege.edu",
        "Sam's reading was right — this was never a missing promotion");
  const cell = M._becauseCell(CITRUS);
  check("the chip names the role AND says it is a MAP designation",
        /CPL Assistant in MAP/.test(cell));
  check("the chip explains WHY, not just what",
        /nobody is marked Primary Contact/i.test(cell) && /cascade/i.test(cell),
        "a bare role name reads as a category of person, not a provenance");
}

// ── 2. An email-only tier is explained, not left looking broken ─────────────
{
  const cell = M._proposalCell(CITRUS);
  check("an assistant with no name says MAP has no name for the address",
        /MAP has no name for this address/.test(cell),
        "otherwise a bare email next to a named row reads as a lookup failure");
  check("a named tier carries no such note",
        !/MAP has no name/.test(M._proposalCell(CANYONS)) && /April Reardon/.test(M._proposalCell(CANYONS)));
}

// ── 3. A curator proposal overrides the cascade, and is labelled as OURS ────
{
  M._state.proposals = {
    "Citrus College": {
      college: "Citrus College", proposed_name: "Maria Buffo",
      proposed_email: "m.buffo@citruscollege.edu", note: "Confirmed by phone",
      status: "proposed", updated_by: "sam@rccd.edu", updated_at: "2026-08-13T10:00:00Z",
    },
  };
  const p = M._effectiveProposal(CITRUS);
  check("the curator's value wins over the cascade's", p.email === "m.buffo@citruscollege.edu");
  check("the curator's value is tagged as such", p.source === "curator");
  const cell = M._becauseCell(CITRUS);
  check("a curator proposal is chipped curator-set", /curator-set/.test(cell));
  check("a curator proposal never claims MAP holds it",
        /MAP itself still holds nothing/.test(cell),
        "Sam's rule: 'Primary contact email' means what MAP HOLDS");
  check("the curator chip carries WHO set it", /sam@rccd\.edu/.test(cell),
        "a curator's knowledge is a first-class input — attribute it");
  check("an untouched college is unaffected", M._effectiveProposal(CANYONS).source === "CPL Coordinator");
}

// ── 4. Clearing: both fields empty means NO proposal, not an empty one ──────
// The table has no delete policy, so "clear" is a write of nulls. If that read
// back as a proposal, clearing would leave the row showing a blank contact.
{
  M._state.proposals = {
    "Citrus College": { college: "Citrus College", proposed_name: null, proposed_email: null },
  };
  check("a nulled row is not a proposal", M._curatorProposalFor("Citrus College") === null);
  check("the row falls back to the MAP cascade after clearing",
        M._effectiveProposal(CITRUS).email === "mbuffo@citruscollege.edu");
}

// ── 5. The key is TRIMMED on both sides ─────────────────────────────────────
// map_college_contacts is hand-typed and two real colleges carry a trailing
// space ("Cypress College ", "San Jose City College "). An untrimmed key would
// split one college into two proposal rows.
{
  M._state.proposals = {
    "Cypress College": { college: "Cypress College", proposed_name: "A Person",
                         proposed_email: "a@cypresscollege.edu" },
  };
  check("a padded college name still finds its proposal",
        !!M._curatorProposalFor("Cypress College "),
        "the trailing space is real MAP data, not a typo in the test");
  check("ckey trims", M._ckey("  Cypress College  ") === "Cypress College");
  M._state.proposals = {};
}

// ── 6. A college with NO cascade candidate can still be proposed for ────────
{
  check("one of the 8 shows nothing proposed by default",
        /none proposed/.test(M._proposalCell(GAVILAN)));
  M._state.proposals = {
    "Gavilan College": { college: "Gavilan College", proposed_name: "Someone Real",
                         proposed_email: "someone@gavilan.edu", updated_by: "sam@rccd.edu" },
  };
  check("a curator proposal gives one of the 8 a contact",
        /someone@gavilan\.edu/.test(M._proposalCell(GAVILAN)));
  check("and it is still labelled curator-set", /curator-set/.test(M._becauseCell(GAVILAN)));
  M._state.proposals = {};
}

// ── 7. The CSV keeps the two layers APART ───────────────────────────────────
// This file is the list someone works through IN MAP, so a curator's suggestion
// must never be indistinguishable from a role the college actually designated.
{
  const head = M._gapsCsv().split("\n")[0];
  check("the CSV has a curator email column", /Curator email/.test(head));
  check("the CSV records who set it and when",
        /Curator set by/.test(head) && /Curator set on/.test(head));
  check("the CSV carries the Proposed because provenance", /Proposed because/.test(head));
  check("the CSV carries a status column", /Status/.test(head),
        "Sam asked that they stay categorized as Proposed");
}

// ── 8. Sierra must not consume these ────────────────────────────────────────
// Sam chose "MAP to-do only" over "Sierra uses it". The edge function reads
// map_college_contacts; nothing must point it at the proposals table.
{
  const fnSrc = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
  check("cpl-chat never reads map_contact_proposals",
        !/map_contact_proposals/.test(fnSrc),
        "Sierra answers from what MAP holds, not from what we propose");
  check("the tab says so on screen", /Sierra ignores these proposals/.test(SRC));
}

// ── 9. Writes are gated and honest about a filtered response ────────────────
{
  check("the proposal write goes through authHeaders (team phrase / reviewer)",
        /map_contact_proposals[\s\S]{0,400}authHeaders\(\)/.test(SRC)
        || /authHeaders\(\)[\s\S]{0,400}map_contact_proposals/.test(SRC));
  check("an RLS-filtered write is treated as a FAILURE, not a success",
        /not saved — your sign-in does not allow writing proposals/.test(SRC),
        "PostgREST answers 200 with an EMPTY body when a policy filters the write");
  check("an email address is required before saving",
        /An email address is required/.test(SRC),
        "a name alone routes nobody");
}

// ── Report ──────────────────────────────────────────────────────────────────
let failed = 0;
for (const [ok, name] of results) {
  console.log(`  ${ok ? "ok  " : "FAIL"}   ${name}`);
  if (!ok) failed++;
}
console.log(`\nmap_users_proposals: ${results.length - failed}/${results.length} passed`);
if (failed) process.exit(1);
