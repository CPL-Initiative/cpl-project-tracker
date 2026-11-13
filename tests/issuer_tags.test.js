// The issuer tag list (kb/reference/issuer_tags.json) is the data kb/_build_exhibits_review.py issuer_named reads: a
// reference title counts as named by a course only when it carries one of its issuer's tags as whole tokens, every word
// of a one- or two-word name, or half the words of a longer one (the S648 conductor on #3241: "the issuer list is
// finite", so its tags are data, never a pattern). Guarded here:
//   - every issuer the reference names (kb/credentials.json, and the issuer a curator set in
//     kb/credential_review_overlay.json) has an entry, so a new issuer cannot slip past the list unread;
//   - no tag is a common English word shorter than four letters unless the issuer's own name writes it in capitals
//     ("BAR" for the Bureau of Automotive Repair (BAR) stands; "art" would let any title with the word in);
//   - each entry is a list of distinct, non-empty strings;
//   - the guard itself fires on a fixture that breaks each rule, so it cannot pass by reading nothing.
// Run from repo root: `npm test` (or `node tests/issuer_tags.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const LOCAL = "California Community Colleges";
// Common English words of two or three letters: a tag spelled as one of these, lower or mixed case, matches ordinary
// prose. Not a dictionary; the words a title is likely to hold.
const COMMON = new Set(("a an as at be by do go he if in is it me my no of on or so to up us we act add age ago aid aim " +
  "air all and any arm art ask bad bag bar bed big bit box boy bus but buy can car cat cut day did die dog dry due ear " +
  "eat end era eye far fat few fit fix fly for fun gas get god gun guy has hat her him his hit hot how ice ill job joy " +
  "key kid law lay leg let lie lot low man map may mix net new nor not now odd off oil old one our out own pay per pet " +
  "pop put raw red rid row run sad saw say sea see set she sit six sky son sun tax tea ten the tie tip too top toy try " +
  "two use war way wet who why win yes yet you aha ace ban beg bid cab cap cup dam den dew dig dot ego fan fee fog fur " +
  "gap gym ham hen hip hug hut ink inn jam jar jaw jet lab lap lid lip log mad mat mob mud mug nap nut oak oar owl pad " +
  "pan pen pie pig pin pit pot rag ram rat ray rib rim rob rod rot rub rug sap sew sin sip ski spa spy sum tab tag tan " +
  "tap tar tin toe ton tub van vet via wax web wig wit zip zoo arc ems").split(/\s+/).filter(Boolean));

function issuersOf(creds, overlay) {
  const out = new Set();
  Object.keys(creds || {}).forEach(function (t) {
    (Array.isArray(creds[t]) ? creds[t] : []).forEach(function (r) {
      const a = r && typeof r.issuing_agency === "string" ? r.issuing_agency.trim() : "";
      if (a && a !== LOCAL) out.add(a);
    });
  });
  const ov = (overlay && overlay.overrides) || {};
  Object.keys(ov).forEach(function (t) {
    const a = ov[t] && typeof ov[t].issuing_agency_override === "string" ? ov[t].issuing_agency_override.trim() : "";
    if (a && a !== LOCAL) out.add(a);
  });
  return out;
}

function problems(tags, issuers) {
  const out = [];
  issuers.forEach(function (a) { if (!Object.prototype.hasOwnProperty.call(tags, a)) out.push("no entry: " + a); });
  Object.keys(tags).forEach(function (a) {
    const list = tags[a];
    if (!Array.isArray(list)) { out.push("not a list: " + a); return; }
    const seen = new Set();
    list.forEach(function (t) {
      if (typeof t !== "string" || !t.trim()) { out.push("empty tag: " + a); return; }
      if (seen.has(t.toLowerCase())) out.push("repeated tag " + t + ": " + a);
      seen.add(t.toLowerCase());
      const letters = t.replace(/[^A-Za-z0-9]/g, "");
      const capsInName = new RegExp("(^|[^A-Za-z0-9])" + t.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Za-z0-9]|$)").test(a)
        && t === t.toUpperCase();
      if (letters.length < 4 && COMMON.has(letters.toLowerCase()) && !capsInName) out.push("common short word " + t + ": " + a);
    });
  });
  return out;
}

// The guard fires on a fixture that breaks each rule.
const fx = problems({ "Some Body": ["art"], "Bureau of Automotive Repair (BAR)": ["BAR"], "Other Body": ["X", "x"],
  "Empty Body": [""] }, new Set(["Some Body", "Missing Issuer", "Bureau of Automotive Repair (BAR)"]));
check("the guard names a missing issuer", fx.indexOf("no entry: Missing Issuer") >= 0, fx);
check("the guard names a common short word the issuer does not write in capitals", fx.indexOf("common short word art: Some Body") >= 0, fx);
check("…and lets a short tag the issuer writes in capitals stand", !fx.some(function (p) { return /BAR/.test(p); }), fx);
check("the guard names a repeated and an empty tag",
  fx.indexOf("repeated tag x: Other Body") >= 0 && fx.indexOf("empty tag: Empty Body") >= 0, fx);

// The committed list against the committed reference.
const doc = JSON.parse(fs.readFileSync("kb/reference/issuer_tags.json", "utf8"));
const tags = doc.tags || {};
const creds = JSON.parse(fs.readFileSync("kb/credentials.json", "utf8"));
let overlay = {};
try { overlay = JSON.parse(fs.readFileSync("kb/credential_review_overlay.json", "utf8")); } catch (e) { overlay = {}; }
const issuers = issuersOf(creds, overlay);
check("the reference names issuers to check (the read is real)", issuers.size > 100, issuers.size);
const live = problems(tags, issuers);
check("every issuer in the reference has an entry in kb/reference/issuer_tags.json",
  !live.some(function (p) { return p.indexOf("no entry: ") === 0; }), live.filter(function (p) { return p.indexOf("no entry: ") === 0; }));
check("no tag is a common short word the issuer does not write in capitals, repeated, or empty",
  !live.some(function (p) { return p.indexOf("no entry: ") !== 0; }), live.filter(function (p) { return p.indexOf("no entry: ") !== 0; }));
check("the file says where its tags came from", typeof doc._about === "string" && /issuer_named/.test(doc._about));
// Acronyms are marked in the data, never inferred (the S648 conductor on COBIx's 17:42Z note): matched as written, so
// each must carry a capital letter, and every issuer with acronyms has a tags entry too.
const acr = doc.acronyms || {};
const badAcr = [];
Object.keys(acr).forEach(function (a) {
  if (!Array.isArray(acr[a])) { badAcr.push("not a list: " + a); return; }
  if (!Object.prototype.hasOwnProperty.call(tags, a)) badAcr.push("acronyms for an issuer with no entry: " + a);
  acr[a].forEach(function (t) { if (typeof t !== "string" || !/[A-Z]/.test(t)) badAcr.push("acronym with no capital: " + a + " " + t); });
});
check("the acronyms are a marked list per issuer, each with a capital letter", Object.keys(acr).length > 50 && !badAcr.length, badAcr);
// Aliases fold spellings of one issuer (COBIx on #3241, 6860799161): each points at an issuer the list holds, and a
// school, district or ROP carries no tag, so it never makes a title shared.
const al = doc.aliases || {};
check("every alias names an issuer the list holds, never itself",
  Object.keys(al).length >= 1 && Object.keys(al).every(function (k) { return al[k] !== k && Object.prototype.hasOwnProperty.call(tags, al[k]); }), al);
check("no school, district, county office or ROP carries a tag or an acronym",
  Object.keys(tags).filter(function (k) { return /High School|School District|Office of Education|\bROP\b|Adult School/i.test(k); })
    .every(function (k) { return !(tags[k] || []).length && !((acr[k] || []).length); }));
check("a brand written in any case is a phrase tag, never an acronym (SOLIDWORKS, CAL FIRE)",
  (tags["Dassault Systèmes"] || []).indexOf("SOLIDWORKS") >= 0 && (acr["Dassault Systèmes"] || []).indexOf("SOLIDWORKS") < 0
  && (tags["California Department of Forestry and Fire Protection (CAL FIRE)"] || []).indexOf("CAL FIRE") >= 0);

const failed = results.filter(function (r) { return !r[1]; });
results.forEach(function (r) { console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] ? "" : "  " + JSON.stringify(r[2]).slice(0, 400))); });
console.log("issuer_tags.test.js: " + (results.length - failed.length) + "/" + results.length + " checks passed");
process.exit(failed.length ? 1 : 0);
