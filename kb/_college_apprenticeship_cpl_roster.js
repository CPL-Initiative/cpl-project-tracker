#!/usr/bin/env node
/*
 * kb/_college_apprenticeship_cpl_roster.js
 *
 * "Which programs at <college> have CPL for apprentices?" — the summary-data
 * pull behind the ARC / NorCAL Carpenters slides (SkyCobi, 2026-08-03).
 *
 * The Common Exhibit Reference (credential_reference_data.js) is keyed by
 * EXHIBIT (unified credential title), not by college or by academic program.
 * To answer a college-program question you have to join three artifacts:
 *
 *   1. credential_reference_data.js  — exhibits → articulations → local
 *      college courses (subj/num). Filter to the target college + an
 *      apprenticeship signal (issuer = JATC / union / CTCNC, or title
 *      /apprentice/). This yields the EXHIBITS and the COURSES that grant CPL.
 *   2. coci_programs_data.js         — the college's COCI program inventory
 *      (title / award / TOP / status). This is the DEGREE/CERTIFICATE layer.
 *   3. kb/reference/coci_program_course_file.csv.gz — the program→course
 *      membership (CrsId = subj+num). Join the CPL courses onto it to learn
 *      which PROGRAMS contain them.
 *
 * CAVEAT (documented in the methodology KB note): the program_course_file has
 * partial coverage — a program can be active and genuinely contain a CPL course
 * yet be absent from the file (ARC Scaffold Erector & Hardwood Floor Layer were,
 * 2026-08-03). So the program→course join is a LOWER BOUND; corroborate the
 * degree count against the by-subject sponsor rollup + the COCI program titles.
 *
 * Usage:  node kb/_college_apprenticeship_cpl_roster.js ["American River College"]
 *         (writes kb/apprentice_roster_out/<college-slug>.json + prints a summary)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.dirname(__dirname);
const COLLEGE = process.argv[2] || "American River College";

function loadWindowJson(file) {
  const s = fs.readFileSync(path.join(ROOT, file), "utf8");
  return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));
}

// An exhibit is "apprenticeship" if its issuer is a Joint Apprenticeship
// Training Committee / a building-trades sponsor, or its title says apprentice.
const APP_RE = /apprentice|J\.?\s?A\.?\s?T\.?\s?C|Carpenters Training Committee|CTCNC|Iron ?Workers|Elevator Industry|NEIEP|IBEW|United Association|Sheet Metal/i;

// Normalize an issuer to a short sponsor family label (display only).
function sponsorFamily(issuer) {
  const i = issuer || "";
  if (/CTCNC|Carpenters Training/i.test(i)) return "NorCAL Carpenters (CTCNC)";
  if (/Iron ?Workers/i.test(i)) return "Iron Workers";
  if (/Elevator|NEIEP/i.test(i)) return "Elevator (NEIEP)";
  if (/United Association|UA Local/i.test(i)) return "Plumbers/Pipefitters/Sheet Metal (UA)";
  if (/IBEW/i.test(i)) return "Electrical (IBEW)";
  return issuer || "(unknown sponsor)";
}
const isAssociate = (award) => /A\.A\.|A\.S\.|Associate/i.test(award || "");

// ── 1. exhibits + courses at the college (apprenticeship only) ──
const cr = loadWindowJson("credential_reference_data.js");
const bySponsor = {}; // family -> {exhibits:Set, courses:Set}
const cplCourses = new Map(); // CrsId (SUBJNUM) -> issuer
for (const r of cr.unified_titles || []) {
  const appHit = APP_RE.test(r.issuer || "") || APP_RE.test(r.ut || "");
  if (!appHit) continue;
  const courses = [];
  for (const a of r.articulations || [])
    for (const l of a.local || [])
      if ((l.colleges || []).includes(COLLEGE)) courses.push(l);
  if (!courses.length) continue;
  const fam = sponsorFamily(r.issuer);
  bySponsor[fam] = bySponsor[fam] || { exhibits: new Set(), courses: new Set(), issuer: r.issuer };
  bySponsor[fam].exhibits.add(r.ut);
  for (const l of courses) {
    const key = l.subj + " " + l.num;
    bySponsor[fam].courses.add(key);
    cplCourses.set((l.subj + l.num).replace(/\s+/g, "").toUpperCase(), r.issuer || "");
  }
}

// ── 2. the college's COCI program inventory ──
const progData = loadWindowJson("coci_programs_data.js");
const ciCol = progData.colleges.findIndex((c) => c.toUpperCase() === COLLEGE.toUpperCase().replace(/ COLLEGE$/, "").trim() || c.toUpperCase() === COLLEGE.toUpperCase());
// COCI colleges are stored without the " College" suffix (e.g. "AMERICAN RIVER").
let ci = ciCol;
if (ci < 0) {
  const norm = COLLEGE.toUpperCase().replace(/ COLLEGE$/, "").trim();
  ci = progData.colleges.findIndex((c) => c.toUpperCase() === norm);
}
const prog = new Map(); // control number (no leading zeros) -> {title,award,top,status}
if (ci >= 0)
  for (const row of progData.rows || [])
    if (row[0] === ci)
      prog.set(String(row[1]).replace(/^0+/, ""), { title: row[2], award: progData.awards[row[5]], top: row[3], status: progData.statuses[row[6]] });

// ── 3. join CPL courses → programs via the program-course membership file ──
const csv = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "kb/reference/coci_program_course_file.csv.gz"))).toString("utf8").split("\n");
const hdr = csv[0].replace(/^﻿/, "").split(",");
const iP = hdr.indexOf("ProgramControlNumber"), iCrs = hdr.indexOf("CrsId");
const programHits = new Map(); // ctrl -> {..prog, courses:Set}
for (let k = 1; k < csv.length; k++) {
  const f = csv[k].split(",");
  if (f.length < hdr.length) continue;
  const crsid = (f[iCrs] || "").replace(/\s+/g, "").toUpperCase();
  const pcn = String(f[iP] || "").replace(/^0+/, "");
  if (cplCourses.has(crsid) && prog.has(pcn)) {
    if (!programHits.has(pcn)) programHits.set(pcn, Object.assign({ courses: new Set() }, prog.get(pcn)));
    programHits.get(pcn).courses.add(crsid);
  }
}
const active = [...programHits.values()].filter((h) => /Active/i.test(h.status) && !/Inactive/i.test(h.status));
const degrees = active.filter((h) => isAssociate(h.award)).sort((a, b) => b.courses.size - a.courses.size);
const certs = active.filter((h) => !isAssociate(h.award)).sort((a, b) => b.courses.size - a.courses.size);

// ── output ──
const sponsors = Object.entries(bySponsor)
  .map(([fam, v]) => ({ sponsor: fam, issuer: v.issuer, exhibits: v.exhibits.size, courses: v.courses.size }))
  .sort((a, b) => b.exhibits - a.exhibits);
const totalExhibits = sponsors.reduce((a, s) => a + s.exhibits, 0);
const allCourses = new Set();
Object.values(bySponsor).forEach((v) => v.courses.forEach((c) => allCourses.add(c)));

const out = {
  _college: COLLEGE,
  _source: "credential_reference_data.js + coci_programs_data.js + kb/reference/coci_program_course_file.csv.gz",
  _note: "program->course join is a LOWER BOUND (partial program_course_file coverage); corroborate degrees vs the sponsor rollup + COCI program titles.",
  totals: { sponsors: sponsors.length, exhibits: totalExhibits, distinct_courses: allCourses.size, degree_programs_proven: degrees.length },
  sponsors,
  degree_programs_with_cpl: degrees.map((h) => ({ title: h.title, award: h.award.replace(/ requiring.*/, ""), top: h.top, cpl_courses: h.courses.size })),
  certificate_programs_with_cpl: certs.map((h) => ({ title: h.title, cpl_courses: h.courses.size })),
};

const outDir = path.join(ROOT, "kb", "apprentice_roster_out");
fs.mkdirSync(outDir, { recursive: true });
const slug = COLLEGE.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
fs.writeFileSync(path.join(outDir, slug + ".json"), JSON.stringify(out, null, 2));

console.log(`\n${COLLEGE} — apprenticeship CPL roster`);
console.log(`  ${totalExhibits} exhibits · ${allCourses.size} courses · ${sponsors.length} sponsors · ${degrees.length} degree programs (proven via join)\n`);
console.log("Sponsors:");
sponsors.forEach((s) => console.log(`  ${String(s.exhibits).padStart(4)} exhibits · ${String(s.courses).padStart(3)} courses  ${s.sponsor}`));
console.log("\nAssociate-degree programs with CPL (proven via program-course join):");
degrees.forEach((h, i) => console.log(`  ${i + 1}. ${h.title}  [${h.award.replace(/ requiring.*/, "").replace(/ Degree/, "")}, TOP ${h.top}] — ${h.courses.size} CPL courses`));
console.log(`\nWrote kb/apprentice_roster_out/${slug}.json`);
