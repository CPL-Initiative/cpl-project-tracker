// The Collections ETA counts "collected, gap noted" programs as collected (Sam, 2026-11-28,
// r-eta-gaps-noted-count-collected-sam-2026-11-28). Guards the failure: the 696 counted as work left.
"use strict";
const assert = require("assert");
global.window = {};
delete require.cache[require.resolve("../commons_program_records.js")];
require("../commons_program_records.js");
const P = window.CPL_PROGRAM_RECORDS;
function day(d, complete, gaps) { const r = { day: d, active: 20282, complete: complete, colleges: 118 }; if (gaps != null) r.gaps_noted = gaps; return r; }
const H = [];
for (let i = 0; i < 15; i++) H.push(day("2026-11-" + String(14 + i).padStart(2, "0"), 15000 + i * 50));
// Last day records the gaps count.
H[H.length - 1] = day("2026-11-28", 15700, 696);
const R = P.compute({ headline: H });
assert.strictEqual(R.collected, 15700 + 696, "collected is complete plus gaps noted");
assert.strictEqual(R.left, 20282 - P.COCI_ONLY - (15700 + 696), "left leaves out the gaps-noted programs");
assert.strictEqual(R.gain, 15700 - 15350, "the pace reads complete alone, not a 696 jump");
// A headline with no gaps_noted counts complete alone (older days and files).
const R0 = P.compute({ headline: H.slice(0, -1) });
assert.strictEqual(R0.collected, R0.complete);
assert.strictEqual(R0.left, 20282 - P.COCI_ONLY - R0.complete);
// The committed file: the 696 come off what is left.
const pr = require("../kb/status/program-requirements.json");
const L = P.compute(pr), last = pr.headline[pr.headline.length - 1];
assert.strictEqual(L.left, Math.max(0, last.active - P.COCI_ONLY - last.complete - (last.gaps_noted || 0)));
console.log("ok   commons ETA: gaps-noted programs count as collected");
