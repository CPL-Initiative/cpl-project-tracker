// District profiles (#3198): every kb/district_profiles/*.json except the schema validates against
// kb/district_profiles/district_profile.schema.json (JSON Schema 2020-12).
//
// Decision d-district-profiles-files-first-s645: district profiles start as repo files COBIx writes, a phase 0
// builder after them. COBIx's files (#3198, his two comments of 2026-11-13 16:40Z) are committed unchanged; this file
// is the gate that keeps every profile filed after them inside the schema.
//
// The repo carries no JSON Schema library (CI installs none), so this file validates with the few keywords the
// schema uses, and FAILS when the schema starts using a keyword it does not know, so a new rule can never be skipped
// silently. "format" is an annotation in 2020-12 (as jsonschema's Draft202012Validator treats it without a format
// checker) and is not asserted. A mutated profile must fail, which proves the validator can.
//
// Run from repo root: `npm test` (or `node tests/district_profiles.test.js`).
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DIR = "kb/district_profiles";
const SCHEMA_FILE = "district_profile.schema.json";
const schema = JSON.parse(fs.readFileSync(path.join(DIR, SCHEMA_FILE), "utf8"));

// The keywords this validator asserts, and the ones that only annotate.
const ASSERTED = ["type", "enum", "const", "required", "properties", "additionalProperties", "items", "minItems", "pattern", "anyOf", "$ref"];
const ANNOTATION = ["$schema", "$id", "$defs", "title", "description", "format", "examples", "default", "$comment"];

function keywords(s, out) {
  if (Array.isArray(s)) { s.forEach((x) => keywords(x, out)); return out; }
  if (!s || typeof s !== "object") return out;
  Object.keys(s).forEach((k) => {
    out.add(k);
    const v = s[k];
    if (k === "properties" || k === "$defs") Object.keys(v).forEach((p) => keywords(v[p], out));
    else if (k === "items" || k === "additionalProperties") keywords(v, out);
    else if (k === "anyOf") v.forEach((x) => keywords(x, out));
  });
  return out;
}

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number";
  return typeof v;
}
function typeOk(v, t) {
  const actual = typeOf(v);
  return t === actual || (t === "number" && actual === "integer");
}
function resolve(ref) {
  const m = /^#\/\$defs\/(.+)$/.exec(ref);
  if (!m || !schema.$defs || !schema.$defs[m[1]]) throw new Error("unresolvable $ref " + ref);
  return schema.$defs[m[1]];
}
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// Every error as "<path>: <what>"; an empty list is valid.
function validate(v, s, at, errs) {
  if (s === true || s === undefined) return errs;
  if (s === false) { errs.push(at + ": not allowed"); return errs; }
  if (s.$ref) validate(v, resolve(s.$ref), at, errs);
  if (s.type !== undefined) {
    const ts = Array.isArray(s.type) ? s.type : [s.type];
    if (!ts.some((t) => typeOk(v, t))) errs.push(at + ": type " + typeOf(v) + ", wanted " + ts.join("|"));
  }
  if (s.enum && !s.enum.some((e) => same(e, v))) errs.push(at + ": " + JSON.stringify(v) + " not in enum");
  if (s.const !== undefined && !same(s.const, v)) errs.push(at + ": not the const " + JSON.stringify(s.const));
  if (s.pattern && typeof v === "string" && !new RegExp(s.pattern, "u").test(v)) errs.push(at + ": does not match " + s.pattern);
  if (s.anyOf && !s.anyOf.some((x) => !validate(v, x, at, []).length)) errs.push(at + ": matches none of anyOf");
  if (typeOf(v) === "object") {
    (s.required || []).forEach((r) => { if (!(r in v)) errs.push(at + ": missing " + r); });
    const props = s.properties || {};
    Object.keys(v).forEach((k) => {
      if (k in props) validate(v[k], props[k], at + "." + k, errs);
      else if (s.additionalProperties !== undefined) validate(v[k], s.additionalProperties, at + "." + k, errs);
    });
  }
  if (typeOf(v) === "array") {
    if (s.minItems !== undefined && v.length < s.minItems) errs.push(at + ": fewer than " + s.minItems + " items");
    if (s.items !== undefined) v.forEach((x, i) => validate(x, s.items, at + "[" + i + "]", errs));
  }
  return errs;
}

// ── the validator knows every keyword the schema uses ──
const used = Array.from(keywords(schema, new Set()));
const unknown = used.filter((k) => ASSERTED.indexOf(k) < 0 && ANNOTATION.indexOf(k) < 0);
check("schema: it is JSON Schema 2020-12", schema.$schema === "https://json-schema.org/draft/2020-12/schema", schema.$schema);
check("schema ⭐: every keyword it uses is one this validator asserts or a known annotation", !unknown.length, unknown.join(", "));

// ── every profile validates ──
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && f !== SCHEMA_FILE).sort();
check("profiles: at least the example is filed", files.indexOf("example.json") >= 0, files.join(", "));
files.forEach(function (f) {
  let doc = null, parseErr = "";
  try { doc = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")); } catch (e) { parseErr = e.message; }
  const errs = doc ? validate(doc, schema, "$", []) : ["parse: " + parseErr];
  check("profile ⭐ " + f + ": validates against the schema", !errs.length, errs.slice(0, 5).join("; "));
});

// ── the validator can fail: a mutated example breaks it ──
const example = JSON.parse(fs.readFileSync(path.join(DIR, "example.json"), "utf8"));
const firstRequired = (schema.required || [])[0];
const missing = JSON.parse(JSON.stringify(example)); delete missing[firstRequired];
check("negative: a profile missing a required field fails", validate(missing, schema, "$", []).length > 0, firstRequired);
const extra = JSON.parse(JSON.stringify(example)); extra.not_a_field = 1;
check("negative: a field the schema does not name fails (additionalProperties false)", schema.additionalProperties === false && validate(extra, schema, "$", []).length > 0);
const badConf = JSON.parse(JSON.stringify(example)); badConf.provenance.confidence = "very strong";
check("negative: a confidence outside Sam's three levels fails", validate(badConf, schema, "$", []).length > 0);

// ── the profiles name no person: no email address, no phone number (staff by role only, as Sam ruled) ──
files.concat(["README.md", SCHEMA_FILE]).forEach(function (f) {
  const t = fs.readFileSync(path.join(DIR, f), "utf8");
  check("privacy: " + f + " holds no email address and no phone number",
    !/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(t) && !/\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/.test(t));
});

const failed = results.filter((x) => !x[1]);
results.forEach((x) => console.log((x[1] ? "PASS " : "FAIL ") + x[0] + (x[1] || !x[2] ? "" : "\n     " + x[2])));
console.log("\n" + (results.length - failed.length) + "/" + results.length + " checks passed");
process.exit(failed.length ? 1 : 0);
