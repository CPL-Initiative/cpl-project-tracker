// The funding tab's project and scenario strip on a phone (Sam, 2026-10-29, a screenshot from
// his phone: the Scenario row stood about 288px tall, its three short lines spread apart). The
// strip stacks into a column below 640px, and in a column a flex basis is a height: the
// scenario's `flex: 1 1 18rem`, meant as a width, became 18rem of air. jsdom measures no
// layout, so this pins the rule that gives each control its content's height in the column.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "cpl_funding.js"), "utf8");
const results = [];
const check = (name, ok) => results.push([name, !!ok]);

const col = src.indexOf('"  .cplfund-strip { flex-direction: column; align-items: stretch; gap: 8px; }",');
const after = col < 0 ? "" : src.slice(col, col + 600);
check("the phone rule stacks the strip into a column", col > 0);
check("in the column, the project and scenario controls take their content's height, never the 18rem basis",
  /"  \.cplfund-ctl-proj, \.cplfund-ctl-scen \{ flex: 0 0 auto; \}"/.test(after));
check("the desktop rule keeps the scenario's 18rem as a width in the row", /"\.cplfund-ctl-scen \{ flex: 1 1 18rem; \}"/.test(src));

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log("\ncpl_funding_phone_strip.test.js: " + pass + "/" + results.length + " assertions passed");
if (pass !== results.length) process.exit(1);
