#!/usr/bin/env node
// The CPL funding institutions mapped to their colleges in MAP's contact list
// (S500, 2026-10-27; Sam: the public funding page checks a submitter's address
// is on the college's or district's domain). The funding page keys an
// institution by its short name (cpl_funding_data.js) and MAP's contacts by the
// full name, and the database cannot run the page's name matcher
// (college_short_names.js), so this writes the pairs it needs:
// kb/reference/funding_college_map.json, which the migration loads into
// public.cpl_funding_college_map. Names only, no contact data.
//
// Input: kb/reference/map_college_names.json, the college names in
// map_college_contacts_pub (public; refresh with the Supabase MCP:
// select json_agg(college order by college) from map_college_contacts_pub).
//
//   node kb/_build_funding_college_map.js           write the map
//   node kb/_build_funding_college_map.js --check   exit 1 if it would change
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
global.window = global;
require(path.join(ROOT, "college_short_names.js"));
require(path.join(ROOT, "cpl_funding_data.js"));

const F = global.CPL_FUNDING;
const names = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/reference/map_college_names.json"), "utf8"));
const OUT = path.join(ROOT, "kb/reference/funding_college_map.json");

// The four noncredit-only institutions have no credit row to match by name.
const FEEDERS = {
  "North Orange Continuing Education": ["North Orange Continuing Education", "North Orange Continuing Education Credit"],
  "San Diego College of Continuing Education": ["San Diego College of Continuing Education", "San Diego College of Continuing Education Credit"],
  "Mt. San Antonio College — Noncredit": ["Mt. San Antonio College"],
  "Calbright College": ["Calbright College Credit", "Calbright College Non-Credit"],
};

function build() {
  const roster = {};
  F.colleges.forEach((c) => { roster[window.cplCollegeShort(c.college, "short")] = c; });
  const out = [];
  names.forEach((n) => {
    const c = roster[window.cplCollegeShort(n, "short")];
    if (c) out.push({ key: c.college, map_college: n, district: c.district || null });
  });
  F.feeders.forEach((f) => {
    (FEEDERS[f.name] || []).forEach((n) => {
      [f.short, f.name].forEach((k) => out.push({ key: k, map_college: n, district: f.district || null }));
    });
  });
  const seen = new Set();
  const rows = out.filter((r) => {
    const s = r.key + "|" + r.map_college;
    if (seen.has(s)) return false;
    seen.add(s);
    return true;
  }).sort((a, b) => (a.key + a.map_college).localeCompare(b.key + b.map_college));
  const keys = F.colleges.map((c) => c.college).concat(F.feeders.map((f) => f.short));
  const missing = keys.filter((k) => !rows.some((r) => r.key === k));
  if (missing.length) throw new Error("no MAP college for: " + missing.join(", "));
  return JSON.stringify({
    _about: "Each CPL funding institution key (cpl_funding_data.js colleges[].college, and the four noncredit-only institutions by short and full name) to its college name(s) in map_college_contacts, with its district. Built by kb/_build_funding_college_map.js; loaded into public.cpl_funding_college_map by kb/migrations/2026-10-27_s500_funding_request_review.sql. Names only, no contact data.",
    rows,
  }, null, 1) + "\n";
}

const text = build();
if (process.argv.includes("--check")) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (cur !== text) { console.error("funding_college_map.json is stale: run node kb/_build_funding_college_map.js"); process.exit(1); }
  console.log("funding_college_map.json is current");
} else {
  fs.writeFileSync(OUT, text);
  console.log("wrote " + path.relative(ROOT, OUT));
}
