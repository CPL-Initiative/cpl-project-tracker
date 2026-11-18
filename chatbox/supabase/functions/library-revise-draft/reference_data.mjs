// reference_data.mjs: the COBI data a Library draft may draw on (Sam, 2026-11-18).
//
// Sam, after Ashley's college cards came back without links: "we want to add buttons to the college landing pages
// and apparently, the library routine can't access that data in cobi, though it is part of our dataset", then "are
// there any other datasets the routine can't access? we should allow full access."
//
// The drafter used to see only the brief, the documents and the page. This module adds a reference block, built for
// the colleges the request names: each college's MAP landing page (map_college_contacts.landing_page_url), its CPL
// Opportunity page on the CPL Initiative's site, and the exhibits MAP lists for it, each with the MAP link that opens
// that exhibit's courses (the link Request Adopt uses). Every value is public already: the landing pages and the
// exhibit links are MAP's public pages, and the exhibit list is the published kb/reference/map_cpl_opportunities_verified.json.
//
// The boundary: the block carries no person's name, email or phone (only landing_page_url is selected from the
// contacts table) and no student detail (adr-student-detail-aggregate-disclosure-control). A draft becomes a public
// page, so the drafter reads what a public page may show. A new dataset joins here, one function per dataset.

export const OPPORTUNITY_PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=";
export const EXHIBIT_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";
export const EXHIBIT_VIEW = "&View=Non-Military";
export const VERIFIED_URL = "https://cpl-initiative.github.io/cpl-project-tracker/kb/reference/map_cpl_opportunities_verified.json";
export const MAX_COLLEGES = 12;
export const MAX_EXHIBITS = 80;     // per college
export const MAX_REFERENCE = 40_000; // characters, all together

export function exhibitUrl(id) { return EXHIBIT_PAGE + "?Exhibit=" + encodeURIComponent(id) + EXHIBIT_VIEW; }

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
export function referenceBlock(colleges, landing, exhibits) {
  if (!colleges.length) return "";
  let out = "Reference data from COBI (public; each link here is stated and may be used on the page):\n";
  for (const c of colleges) {
    let part = `\n${c}\n`;
    part += landing[c] ? `- MAP landing page (where a student requests CPL at this college): ${landing[c]}\n` : "- MAP landing page: none on file; link MAP's Find your college list, https://map.rccd.edu/cpllandingpages/\n";
    part += `- CPL Opportunity page: ${OPPORTUNITY_PAGE}${encodeURIComponent(c)}\n`;
    const ex = (exhibits && exhibits[c]) || [];
    if (ex.length) {
      part += `- Exhibits MAP lists for this college; each link opens that exhibit's courses in MAP, the link Request Adopt uses:\n`;
      for (const e of ex) part += `  - ${e.title} (${e.id}): ${exhibitUrl(e.id)}\n`;
    }
    if (out.length + part.length > MAX_REFERENCE) { out += "\n(More colleges were named than fit; name fewer per piece.)\n"; break; }
    out += part;
  }
  return out;
}
