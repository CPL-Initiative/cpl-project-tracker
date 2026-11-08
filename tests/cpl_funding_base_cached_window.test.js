// tests/cpl_funding_base_cached_window.test.js
//
// base() reads the model through a reference taken once at load, never the bare
// `window` global (S612, COBIx #2927). Under jsdom every bare `window` goes
// through a slow getter, and base() runs about a million times a render: the
// bare read cost a third of every funding test's time (boot and render each
// 5.7s, then 2.9s with the fix; cpl_funding_optin 4m23s, then 2m13s locally).
// A static check, so it needs no DOM.
const fs = require("fs");
const src = fs.readFileSync(process.argv[2]||"cpl_funding.js", "utf8");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const m = src.match(/function base\(\)\s*\{([^}]*)\}/);
check("cpl_funding.js defines base()", !!m);
check("base() does not read the bare window global", m && !/(^|[^.\w])window\b/.test(m[1]));
check("base() reads CPL_FUNDING through the reference taken at load", m && /\bWIN\.CPL_FUNDING\b/.test(m[1]));
check("the reference is the window object itself", /var WIN = window;/.test(src));

let failed = 0;
for (const [name, ok] of results) { console.log((ok ? "PASS  " : "FAIL  ") + name); if (!ok) failed++; }
console.log(`\n${results.length - failed}/${results.length} assertions passed`);
process.exit(failed ? 1 : 0);
