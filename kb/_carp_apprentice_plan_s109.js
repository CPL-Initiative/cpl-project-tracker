#!/usr/bin/env node
// Session 109 (SkyBreak) round-3 data jobs — PLAN builder (dry-run artifact).
//
// Job A — Sam: "For the Carpentry exhibits that reference a course number in
// the title, look up the COCI course title and substitute that for the
// exhibit title and leave out the trade since that's in the issuing agency."
//   Candidates = baked credential rows whose unified title carries a CTCNC
//   "CARP <num>" course code. Resolution = the row's OWN articulated common
//   course title (the COCI-derived title the exhibit articulates to — every
//   resolvable row has exactly one articulation line). Rows with no
//   articulation are UNRESOLVABLE (the CARP number is CTCNC's internal
//   numbering, not a COCI key) → skipped + receipted.
//   Skips: new title collides with an existing credential key (Sam's
//   merge-confirm judgment, not a bulk write's), two candidates resolving to
//   the same new title (would silently fold two CTCNC courses), rows already
//   carrying a curator unified_title_override (curator wins — checked live
//   before the write).
//
// Job B — Sam: "Is there an easy way to tag all the apprenticeship exhibits
// as apprentice?"
//   Candidates = rows whose UNIFIED TITLE matches /apprentice/i OR whose
//   ISSUER matches /apprentice|J.A.T.C/i (an exhibit issued by a Joint
//   Apprenticeship Training Committee is an apprenticeship exhibit).
//   Rows matching only via a raw college-entered variant are receipted for
//   review, NOT written (one college's label doesn't reclassify the
//   credential). Value = cpl_type_override "Apprenticeship" — the CER's
//   overlay-only canonical-layer type (NOT a MAP CPL type; MAP's raw
//   cpl_types stay in the data + drawer underneath).
//
// Output: kb/carp_title_out/2026-07-09/plan.json +
//         kb/apprentice_tag_out/2026-07-09/plan.json + INSERT SQL for each
//         (executed via the Supabase MCP; INSERT-only ON CONFLICT DO NOTHING
//         per docs/kb-notes/methodology-live-curation-concurrency.md).
"use strict";
const fs = require("fs");
const path = require("path");

const STAMP = "2026-07-09";
const src = fs.readFileSync(path.join(__dirname, "..", "credential_reference_data.js"), "utf8");
const payload = JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
const rows = payload.unified_titles || [];
const keySet = new Set(rows.map((r) => r.ut));
const keySetLower = new Map();
rows.forEach((r) => keySetLower.set(r.ut.toLowerCase(), r.ut));

function esc(s) { return String(s).replace(/'/g, "''"); }

// ── Job A: CARP course-code titles ──
const carpRe = /\bCARP\s*\d{2,4}\b/i;
const carp = rows.filter((r) => carpRe.test(r.ut));
const planA = { applied: [], skipped: [] };
const targetCount = {};
carp.forEach((r) => {
  const arts = r.articulations || [];
  if (arts.length === 1 && arts[0].title) targetCount[arts[0].title] = (targetCount[arts[0].title] || 0) + 1;
});
carp.forEach((r) => {
  const arts = r.articulations || [];
  if (!arts.length) {
    planA.skipped.push({ ut: r.ut, reason: "no_articulation_to_resolve_from" });
    return;
  }
  if (arts.length > 1) {
    planA.skipped.push({ ut: r.ut, reason: "multiple_articulations_ambiguous",
      titles: arts.map((a) => a.title) });
    return;
  }
  const newTitle = (arts[0].title || "").trim();
  if (!newTitle) {
    planA.skipped.push({ ut: r.ut, reason: "articulation_has_no_title" });
    return;
  }
  if (targetCount[newTitle] > 1) {
    planA.skipped.push({ ut: r.ut, new_title: newTitle,
      reason: "duplicate_target_in_batch (" + targetCount[newTitle]
        + " CARP rows resolve to this title — folding them is Sam's call)" });
    return;
  }
  const collide = keySetLower.get(newTitle.toLowerCase());
  if (collide && collide !== r.ut) {
    planA.skipped.push({ ut: r.ut, new_title: newTitle,
      reason: "collides_with_existing_credential_key", existing_key: collide });
    return;
  }
  planA.applied.push({ ut: r.ut, new_title: newTitle,
    via: arts[0].cid + " (" + (arts[0].sys || "?") + ")",
    local: (arts[0].local || []).map((l) => l.subj + " " + l.num + " @ "
      + ((l.colleges || [])[0] || "?")) });
});

// ── Job B: apprenticeship tags ──
const utRe = /apprentice/i;
const issuerRe = /apprentice|J\.?\s?A\.?\s?T\.?\s?C/i;
const planB = { applied: [], review_only: [] };
rows.forEach((r) => {
  const issuer = r.issuer || "";
  const utHit = utRe.test(r.ut);
  const issuerHit = issuerRe.test(issuer);
  const varHit = (r.raw_variants || []).some((v) => utRe.test(v.r || ""));
  if (utHit || issuerHit) {
    planB.applied.push({ ut: r.ut, issuer: issuer || null,
      signal: utHit && issuerHit ? "title+issuer" : (utHit ? "title" : "issuer"),
      raw_cpl_types: r.cpl_types || [] });
  } else if (varHit) {
    planB.review_only.push({ ut: r.ut, issuer: issuer || null,
      variants: (r.raw_variants || []).filter((v) => utRe.test(v.r || "")).map((v) => v.r),
      reason: "apprentice appears only in a raw college-entered variant — review, not bulk-tagged" });
  }
});

// ── SQL ──
function insertSql(items, field, valueOf, cohort) {
  const vals = items.map((it) =>
    "('_CREDENTIAL_REVIEW::" + esc(it.ut) + "', '" + field + "', '"
    + esc(valueOf(it)) + "', '" + cohort + "', now())").join(",\n");
  return "insert into kb_curation (course_id, field, value, reviewer_email, reviewed_at)\nvalues\n"
    + vals + "\non conflict (course_id, field) do nothing;";
}

const outA = path.join(__dirname, "carp_title_out", STAMP);
const outB = path.join(__dirname, "apprentice_tag_out", STAMP);
fs.mkdirSync(outA, { recursive: true });
fs.mkdirSync(outB, { recursive: true });
fs.writeFileSync(path.join(outA, "plan.json"), JSON.stringify({
  _job: "carp-title-s109", _stamp: STAMP, _cohort: "carp-title-s109@bot",
  _source: "credential_reference_data.js articulations (COCI-derived common-course titles)",
  applied_count: planA.applied.length, skipped_count: planA.skipped.length,
  applied: planA.applied, skipped: planA.skipped }, null, 1));
fs.writeFileSync(path.join(outA, "insert.sql"),
  insertSql(planA.applied, "unified_title_override", (it) => it.new_title, "carp-title-s109@bot") + "\n");
fs.writeFileSync(path.join(outB, "plan.json"), JSON.stringify({
  _job: "apprentice-tag-s109", _stamp: STAMP, _cohort: "apprentice-tag-s109@bot",
  _value: "Apprenticeship (CER canonical-layer cpl_type_override — overlay-only, not a MAP CPL type)",
  applied_count: planB.applied.length, review_only_count: planB.review_only.length,
  applied: planB.applied, review_only: planB.review_only }, null, 1));
fs.writeFileSync(path.join(outB, "insert.sql"),
  insertSql(planB.applied, "cpl_type_override", () => "Apprenticeship", "apprentice-tag-s109@bot") + "\n");

console.log("Job A (carp titles): apply " + planA.applied.length
  + ", skip " + planA.skipped.length);
planA.skipped.forEach((s) => console.log("  skip: " + s.ut + " — " + s.reason));
console.log("Job B (apprentice tags): apply " + planB.applied.length
  + ", review-only " + planB.review_only.length);
planB.review_only.slice(0, 15).forEach((s) => console.log("  review: " + s.ut));
console.log("sample A:", JSON.stringify(planA.applied.slice(0, 3), null, 1));
