// The browser's issuer resolver (issuer_resolution.js) and the Python one (kb/fold_issuer.py effective_issuer) give
// the same answer on the same cases (#3116 redesign). Each case is fed to both; any difference fails. The cases are
// the interleavings the conductor named: an edit one second before and after decided_at, a struck primary, kept and
// struck additionals, the winner under another spelling, no resolution, and a newer additional.
// Run from repo root: `node tests/issuer_resolution_parity.test.js` (or `npm test`).
const { execFileSync } = require("child_process");
const R = require("../issuer_resolution.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DEC = "2026-11-11T16:00:00Z";
const ASE = "National Institute for Automotive Service Excellence (ASE)";
const CCC = "California Community Colleges";
const CO = "California Community College Chancellor's Office";
function res(o) { return Object.assign({ rule: "reviewer", winner: CCC, dropped: [ASE], kept_additional: [], decided_at: DEC, fold_id: "f@1" }, o || {}); }
const CASES = [
  { name: "edit one second before decided_at: the fold's winner", p: ["NATEF", "2026-11-11T15:59:59Z"], a: null, r: res() },
  { name: "edit one second after decided_at: the person", p: ["NATEF", "2026-11-11T16:00:01Z"], a: null, r: res() },
  { name: "Postgres stamp form, after", p: ["NATEF", "2026-11-11 16:00:01.123456+00"], a: null, r: res() },
  { name: "offset stamp, before", p: ["NATEF", "2026-11-11T07:59:59-08:00"], a: null, r: res() },
  { name: "rule 2b strikes the dropped primary", p: [ASE, "2026-07-09T00:07:08Z"], a: null, r: res({ rule: "standards", winner: null }) },
  { name: "rule 2 keeps a primary the fold did not drop", p: [CO, "2026-07-09T00:07:08Z"], a: null, r: res({ rule: "cert-form", winner: null, dropped: [] }) },
  { name: "kept additional restored, struck one removed", p: null, a: ["NCCER | " + ASE, "2026-07-09T00:07:08Z"], r: res({ kept_additional: ["American Red Cross"] }) },
  { name: "the winner under another spelling is not an additional", p: null, a: [CO + " | American Welding Society (AWS)", "2026-07-09T00:07:08Z"], r: res() },
  { name: "a newer additional stands as written, minus the winner", p: null, a: ["ccc | NATEF", "2026-11-12T00:00:00Z"], r: res() },
  { name: "no resolution: rows as stored", p: ["NATEF", "2026-11-11T15:00:00Z"], a: ["X | Y", "2026-11-11T15:00:00Z"], r: null },
  { name: "additive with nothing dropped", p: ["NATEF", "2026-11-11T15:00:00Z"], a: null, r: res({ rule: "additive", winner: null, dropped: [] }) }
];

function jsOut(c) {
  const rows = {};
  if (c.p) rows.issuing_agency_override = { value: c.p[0], at: c.p[1] };
  if (c.a) rows.issuing_agency_additional_override = { value: c.a[0], at: c.a[1] };
  const got = R.resolve(rows, c.r);
  return { issuer: got.issuer, issuer2: got.issuer2, set_by_fold: got.fold ? got.fold.setByFold : null,
           superseded: got.fold ? got.fold.superseded.map((s) => s.value) : [] };
}

const PY = `
import json, sys
sys.path.insert(0, "kb")
import fold_issuer as fi
out = []
for c in json.load(sys.stdin):
    e, fr = {}, {}
    if c["p"]:
        e["issuing_agency_override"] = c["p"][0]; fr["issuing_agency_override"] = {"by": "p@x", "at": c["p"][1]}
    if c["a"]:
        e["issuing_agency_additional_override"] = c["a"][0]; fr["issuing_agency_additional_override"] = {"by": "p@x", "at": c["a"][1]}
    e["field_reviews"] = fr
    r = fi.effective_issuer(e, c["r"])
    f = r.get("issuer_fold")
    out.append({"issuer": r.get("issuing_agency_override", ""), "issuer2": r.get("issuing_agency_additional_override", ""),
                "set_by_fold": f["set_by_fold"] if f else None, "superseded": [s["value"] for s in (f or {}).get("superseded", [])]})
print(json.dumps(out))
`;
let py = null;
try {
  py = JSON.parse(execFileSync("python3", ["-c", PY], { input: JSON.stringify(CASES), encoding: "utf8" }));
} catch (e) { check("the Python resolver runs", false, String(e).slice(0, 300)); }
if (py) {
  CASES.forEach(function (c, i) {
    const a = JSON.stringify(jsOut(c)), b = JSON.stringify(py[i]);
    check("parity: " + c.name, a === b, "js " + a + " / py " + b);
  });
}
check("the editor line names the fold's date", R.foldLine({ setByFold: true, decidedAt: DEC }) === "Set by the fold on 2026-11-11");
check("no line when a person's newer row stands", R.foldLine({ setByFold: false, decidedAt: DEC }) === "");

let failed = 0;
results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  -- " + r[2])); });
console.log((results.length - failed) + "/" + results.length + " passed");
process.exit(failed ? 1 : 0);
