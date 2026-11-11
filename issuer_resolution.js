/* issuer_resolution.js — a credential fold's issuer resolution, read in the browser.

   The one JavaScript port of kb/fold_issuer.py effective_issuer() (#3116 redesign, S638, 2026-11-11). A credential
   fold never updates or deletes an issuer row a person wrote; it writes one kb_curation row per folded target, field
   issuer_resolution, whose value names the rule, the winner, the issuers the fold dropped, the additional issuers it
   kept, and decided_at (when the fold read the rows it decided on). Every browser reader of a title's issuer rows
   (exhibits.js, credential_reference.js, map_export.js) resolves them here:

     an issuer row saved after decided_at wins, because it is a newer decision;
     otherwise the fold's winner stands, the dropped issuers are struck and the kept additional issuers stay,
     each in the reference spelling, with no second copy of the winner under another spelling.

   "Saved after" reads the row's stamp alone: the anon key cannot read reviewer_email, and the fold writes no issuer
   row. tests/issuer_resolution_parity.test.js feeds the same cases to this file and to the Python resolver and fails
   on any difference, so the two cannot drift. Loaded by both HTMLs before credential_reference.js. */
(function (root) {
  "use strict";
  var FIELD = "issuer_resolution";
  var PRIMARY = "issuing_agency_override";
  var ADDITIONAL = "issuing_agency_additional_override";
  var SYSTEM = "California Community Colleges";
  var SYSTEM_SPELLINGS = [
    "california community colleges", "california community college",
    "california community colleges chancellor's office", "california community college chancellor's office",
    "california community colleges chancellors office", "california community college chancellors office",
    "chancellor's office", "cccco", "ccc"
  ];

  function norm(s) { return String(s || "").replace(/\u2019/g, "'").replace(/\s+/g, " ").trim().toLowerCase(); }
  function canonical(s) {
    var t = String(s || "").replace(/\s+/g, " ").trim();
    return SYSTEM_SPELLINGS.indexOf(norm(t)) !== -1 ? SYSTEM : t;
  }
  /* A stamp as milliseconds: "2026-11-11T15:26:54Z", "2026-11-11 15:26:55.029+00", "...+00:00"; "" first. */
  function ts(s) {
    s = String(s || "").trim();
    if (!s) return -Infinity;
    var t = s.replace(" ", "T").replace(/Z$/, "+00:00").replace(/([+-]\d\d)$/, "$1:00")
      .replace(/(\.\d{3})\d+/, "$1");
    if (!/[+-]\d\d:\d\d$/.test(t)) t += "+00:00";
    var n = Date.parse(t);
    return isNaN(n) ? -Infinity : n;
  }
  function split(v) { return String(v || "").split("|").map(function (p) { return p.trim(); }).filter(Boolean); }
  function dedupe(parts, alsoNot) {
    var seen = {}, out = [];
    (alsoNot || []).forEach(function (x) { if (x) seen[norm(x)] = 1; });
    parts.forEach(function (p) {
      var c = canonical(p);
      if (!seen[norm(c)]) { seen[norm(c)] = 1; out.push(c); }
    });
    return out;
  }
  function parse(value) {
    if (!value) return null;
    var r = value;
    if (typeof value === "string") { try { r = JSON.parse(value); } catch (e) { return null; } }
    return r && typeof r === "object" && r.decided_at ? r : null;
  }

  /* rows: {issuing_agency_override: {value, at}, issuing_agency_additional_override: {value, at}}
     resolution: parse()'s object, or null.
     Returns {issuer, issuer2, fold}: issuer and issuer2 resolved ("" when none stands); fold null without a
     resolution, else {foldId, decidedAt, rule, winner, setByFold, superseded: [{field, value, at}]}. */
  function resolve(rows, resolution) {
    rows = rows || {};
    var p = rows[PRIMARY] || { value: "", at: "" }, a = rows[ADDITIONAL] || { value: "", at: "" };
    var pv = String(p.value || "").trim(), av = String(a.value || "").trim();
    if (!resolution) return { issuer: pv, issuer2: av, fold: null };
    var dec = ts(resolution.decided_at);
    var winner = resolution.winner ? canonical(resolution.winner) : null;
    var dropped = {};
    (resolution.dropped || []).forEach(function (x) { dropped[norm(canonical(x))] = 1; });
    var superseded = [], primary;
    var newerP = !!pv && ts(p.at) > dec;
    if (newerP) primary = canonical(pv);
    else if (winner) {
      primary = winner;
      if (pv && norm(canonical(pv)) !== norm(winner)) superseded.push({ field: PRIMARY, value: pv, at: p.at || "" });
    } else if (pv && dropped[norm(canonical(pv))]) {
      primary = "";
      superseded.push({ field: PRIMARY, value: pv, at: p.at || "" });
    } else primary = pv ? canonical(pv) : "";
    var parts;
    if (av && ts(a.at) > dec) parts = dedupe(split(av), [primary]);
    else {
      var all = split(av);
      var kept = all.filter(function (x) { return !dropped[norm(canonical(x))]; });
      if (kept.length !== all.length) superseded.push({ field: ADDITIONAL, value: av, at: a.at || "" });
      parts = dedupe(kept.concat(resolution.kept_additional || []), [primary]);
    }
    return {
      issuer: primary, issuer2: parts.join(" | "),
      fold: { foldId: resolution.fold_id || "", decidedAt: resolution.decided_at, rule: resolution.rule || "",
              winner: winner, setByFold: !!winner && !newerP, superseded: superseded }
    };
  }

  /* The editor's one plain line under the issuer: "Set by the fold on <date>", or "" when the fold set nothing. */
  function foldLine(fold) {
    if (!fold || !fold.setByFold) return "";
    return "Set by the fold on " + String(fold.decidedAt || "").slice(0, 10);
  }

  var api = { FIELD: FIELD, PRIMARY: PRIMARY, ADDITIONAL: ADDITIONAL, resolve: resolve, parse: parse,
              canonical: canonical, ts: ts, foldLine: foldLine };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CPL_ISSUER_RESOLUTION = api;
})(typeof window !== "undefined" ? window : null);
