// reference_data.mjs: the COBI data a Library draft may draw on (Sam, 2026-11-18).
//
// Sam, after Ashley's college cards came back without links: "we want to add buttons to the college landing pages
// and apparently, the library routine can't access that data in cobi, though it is part of our dataset", then "are
// there any other datasets the routine can't access? we should allow full access."
//
// The drafter used to see only the brief, the documents and the page. This module adds a reference block, built for
// the colleges the request names: each college's MAP landing page (map_college_contacts.landing_page_url), its CPL
// Opportunity page on the CPL Initiative's site, and the exhibits it has articulated (the published
// kb/reference/map_cpl_opportunities_verified.json, where MAP names the college as each exhibit's owner).
//
// This block is a head start for the commonest ask; the model reads anything else in COBI with the tools in
// cobi_data.mjs (Sam, 2026-11-18: full read access, no staff-data filter, student counts under 10 shown as <10).

export const OPPORTUNITY_PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=";
export const VERIFIED_URL = "https://cpl-initiative.github.io/cpl-project-tracker/kb/reference/map_cpl_opportunities_verified.json";
export const MAX_COLLEGES = 12;
export const MAX_EXHIBITS = 80;     // per college
export const MAX_REFERENCE = 40_000; // characters, all together

function norm(s) { return " " + String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() + " "; }

// The colleges a request names, in the order the list gives them. A college matches on its full name, or on its
// name without "College" when what stays is a distinctive word or two ("Cabrillo", "Modesto Junior"), never on a
// bare word that names a place ("Foothill" alone still matches; a stem under four letters never does).
export function collegesNamed(text, names) {
  const t = norm(text), out = [];
  for (const n of names || []) {
    const full = norm(n);
    const stem = norm(String(n).replace(/\s+college$/i, ""));
    if (t.includes(full) || (stem !== full && stem.trim().length >= 4 && t.includes(stem))) out.push(n);
    if (out.length >= MAX_COLLEGES) break;
  }
  return out;
}

// The exhibits MAP lists for each college, from the verified file's found map.
export function exhibitsFor(verified, colleges) {
  const by = {};
  for (const c of colleges) by[c] = [];
  const found = (verified && verified.found) || {};
  for (const id of Object.keys(found)) {
    const x = found[id];
    if (x && by[x.college] && by[x.college].length < MAX_EXHIBITS) by[x.college].push({ id, title: String(x.title || id) });
  }
  return by;
}

// The block the model reads. Empty when the request names no college.
//
// Sam's ruling on the landing-page button (2:42 PM PT, 2026-11-18, relayed by COBIx on #3527): these pieces are for
// prospective students, so they show only articulated opportunities; the button opens the college's landing page,
// not the MAP dashboard; a college with no landing page on file is said so on the page, with no fallback link. The
// exhibits listed here are the ones MAP names this college as the owner of: the ones it articulated. MAP's landing
// page takes no exhibit in its address today (its exhibit search is held inside the page; read 2026-11-18), so the
// button opens the page and the piece names the exhibit to choose there. When MAP adds an exhibit parameter, it
// joins here in landingButton, and every draft after picks it up.
export function landingButton(landing, exhibit) {
  return landing || "";
}
export function referenceBlock(colleges, landing, exhibits) {
  if (!colleges.length) return "";
  let out = "Reference data from COBI (each link here is stated and may be used on the page):\n";
  for (const c of colleges) {
    let part = `\n${c}\n`;
    part += landing[c]
      ? `- MAP landing page (where a student requests CPL at this college; every button goes here): ${landing[c]}\n`
      : "- MAP landing page: NONE ON FILE. Say on the page that this college's CPL landing page is not on file yet; give no button and no other link in its place.\n";
    part += `- CPL Opportunity page (internal pieces only): ${OPPORTUNITY_PAGE}${encodeURIComponent(c)}\n`;
    const ex = (exhibits && exhibits[c]) || [];
    if (ex.length) {
      part += `- Exhibits ${c} has articulated (MAP lists the college as their owner). Name only these; never a potential or unarticulated one:\n`;
      for (const e of ex) part += `  - ${e.title} (${e.id})` + (landing[c] ? `: button to ${landingButton(landing[c], e)}, labeled with the exhibit, and a line telling the student to choose ${e.title} on that page` : "") + "\n";
    } else part += `- MAP lists no articulated exhibits for ${c}. Name none.\n`;
    if (out.length + part.length > MAX_REFERENCE) { out += "\n(More colleges were named than fit; name fewer per piece.)\n"; break; }
    out += part;
  }
  return out;
}
