// Sierra says who the CPL Initiative serves in Sam's words, and counts
// community colleges only (Sam, open-asks sheets 33-34, 2026-10-04).
//
// MAP's datasets list 116 institutions: the 115 credit colleges plus Cal State
// LA. The system's 116 is the 115 plus Calbright. Her old line read
// "Active colleges: 103 of 116" straight from the datasets, which would call a
// CSU campus a community college the day it turned active. Lifts the real
// block out of index.ts (tests/lib/lift_ts.js), drives it with tier lists in
// the shape live_metrics.json carries, and holds the copy in index.ts equal to
// the single source, kb/non_ccc_institutions.json.

const fs = require("fs");
const { liftBlock } = require("./lib/lift_ts");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const SRC = JSON.parse(fs.readFileSync("kb/non_ccc_institutions.json", "utf8"));
const CSU = "California State University Los Angeles";

let M = null;
block("lift", () => {
  M = liftBlock(FN, "// ── Who the CPL Initiative serves (Sam, open-asks sheets 33-34, 2026-10-04)",
    "// ── end who the CPL Initiative serves",
    ["collegeCountLines", "CPL_SERVES_STATEMENT", "CCC_SYSTEM_COLLEGES", "NON_CCC_INSTITUTIONS"]);
});

function live(csuTier) {
  const tiers = {
    leading: { colleges: [{ college: "Bakersfield College" }, { college: "Norco College" }] },
    advancing: { colleges: [{ college: "Cerritos College" }] },
    inactive: { colleges: [{ college: "Yuba College" }] },
  };
  if (csuTier) tiers[csuTier].colleges.push({ college: CSU });
  return { tiers, active_college_count: 99, college_count: 116 };
}

block("1. the statement and the count", () => {
  const out = M.collegeCountLines(live("inactive"));
  check("her context carries Sam's statement verbatim", out.includes(SRC.statement), out);
  check("the count reads 3 of California's 116 community colleges",
    /Active community colleges in MAP's datasets: 3 of California's 116 community colleges/.test(out), out);
  check("Cal State LA is named beside the community colleges",
    out.includes(`MAP's datasets also list ${CSU}, outside the community college count`), out);
  check("no line calls MAP's 116 'colleges' outright", !/Active colleges: \d+ of 116/.test(out), out);
});

block("2. an active Cal State LA stays out of the count", () => {
  const out = M.collegeCountLines(live("advancing"));
  check("Advancing Cal State LA leaves the count at 3, not 4", /: 3 of California's 116/.test(out), out);
});

block("3. no tiers falls back to the datasets' active count", () => {
  const out = M.collegeCountLines({ active_college_count: 103 });
  check("the fallback reads 103", /: 103 of California's 116/.test(out), out);
  check("nothing is named outside the count without tiers", !/also list/.test(out), out);
});

block("4. the copy in index.ts matches the shared list", () => {
  check("statement", M.CPL_SERVES_STATEMENT === SRC.statement, M.CPL_SERVES_STATEMENT);
  check("system count", M.CCC_SYSTEM_COLLEGES === SRC.ccc_system_colleges, M.CCC_SYSTEM_COLLEGES);
  const names = SRC.institutions.flatMap((i) => [i.name].concat(i.variants || [])).sort();
  check("names", JSON.stringify([...M.NON_CCC_INSTITUTIONS].sort()) === JSON.stringify(names),
    JSON.stringify(M.NON_CCC_INSTITUTIONS));
  check("the metrics context calls the block", /metricsContext \+= collegeCountLines\(m\);/.test(FN));
  check("the old datasets-only line is gone", !/Active colleges: \$\{m\.active_college_count/.test(FN));
});

block("5. Sam's words: datasets, never the scrape, in what she reads aloud", () => {
  const out = M.collegeCountLines(live("inactive"));
  check("the count line says MAP's datasets", /MAP's datasets/.test(out), out);
  check("no 'scrape' in the block's output", !/scrape/i.test(out), out);
});

const failed = results.filter((r) => !r[1]);
for (const [name, ok, why] of results) console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !why ? "" : " — " + String(why).slice(0, 400)}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
