#!/usr/bin/env node
/* ===========================================================================
   a11y_triage.js — turn an `npm run a11y` report into a REMEDIATION ORDER.
   ---------------------------------------------------------------------------
   Sam, 2026-09-09: "I want a procedure that checks and remediates each COBI
   surface for AA and mobile friendly standards."

   `npm run a11y` is the CHECK half and it is good at it. What it cannot do is
   tell you where to start, and that gap is not cosmetic — it is the difference
   between a day's work and an hour's.

   ⚠️ THE NUMBER OF FINDINGS IS NOT THE NUMBER OF PROBLEMS. Measured on COBI's
   dark sweep, 2026-09-08: 38 of 38 routes failed with ~250 findings, and SIX
   selectors in shared chrome were ~227 of them. `first_light.js` and the rail
   paint on every tab, so one CSS line is 38 findings; the report lists it 38
   times and says nothing about it being one line. Reading the report top to
   bottom means fixing the 38th-most-important thing first.

   So this groups findings by their SELECTOR and ranks by BLAST RADIUS — how
   many routes carry the same fault — and names the shape of the likely cause:

     · a selector on EVERY route          -> shared chrome: one rule, all tabs
     · a contrast ratio repeated exactly  -> one token or one raw hex, not many
     · sub-24px targets on every route    -> a control in shared chrome
     · a fault on one route only          -> that tab's own CSS

   ⚠️ IT READS THE REPORT, IT DOES NOT RE-MEASURE. Pipe a saved run into it, so
   triage costs nothing and can be re-read without paying ~100 s again:

       npm run a11y cobi-dark > /tmp/dark.txt
       node scripts/a11y_triage.js /tmp/dark.txt

   =========================================================================== */
const fs = require("fs");

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/a11y_triage.js <saved a11y report>");
  console.error("   e.g. npm run a11y cobi-dark > /tmp/dark.txt && node scripts/a11y_triage.js /tmp/dark.txt");
  process.exit(2);
}
const text = fs.readFileSync(file, "utf8");

/* The report is "route FAIL" lines followed by indented findings. A route line
   is the only thing at that indent that ends in FAIL, so the parser keys on it
   rather than on any finding wording, which changes as rules are added. */
const ROUTE = /^\s{2,4}(\S[^\s].*?)\s+FAIL\s*$/;
const CONTRAST = /contrast\s+([0-9.]+):1 \(needs ([0-9.]+)\)\s+(\S+)\s+([0-9.]+)px/;
const TARGET = /(\d+) target\(s\) under 24x24 in \d+ kind\(s\): (.+)$/;
const SCROLLER = /scrolling (\S+) is not keyboard reachable/;
const OVERFLOW = /page scrolls sideways by (\d+)px/;

let route = null;
const routes = new Set();
const contrast = new Map();   // "selector @ ratio" -> Set(routes)
const targets = new Map();    // selector -> Set(routes)
const scrollers = new Map();
const overflow = new Map();

for (const line of text.split("\n")) {
  const r = line.match(ROUTE);
  if (r) { route = r[1].trim(); routes.add(route); continue; }
  if (!route) continue;
  const add = (map, key) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(route); };

  const c = line.match(CONTRAST);
  if (c) { add(contrast, `${c[3]} @ ${c[1]}:1 (needs ${c[2]})`); continue; }
  const t = line.match(TARGET);
  if (t) {
    /* ⚠️ KEY ON THE SELECTOR ALONE. Each "kind" reads
       `button#id "Label" 42.3x20.5 x11` — the label and the measured box differ
       per route and per width, so keying on the whole string makes every
       occurrence its own "cause" and the ranking says nothing. Keying on the
       selector is what collapses 20 findings on 38 routes into one line. */
    t[2].split("·").forEach((k) => {
      const sel = k.trim().split(/\s+["']/)[0].trim();
      if (sel) add(targets, sel);
    });
    continue;
  }
  const s = line.match(SCROLLER);
  if (s) { add(scrollers, s[1]); continue; }
  const o = line.match(OVERFLOW);
  if (o) { add(overflow, `${o[1]}px`); continue; }
}

const N = routes.size || 1;
const rank = (m) => [...m.entries()].map(([k, v]) => [k, v.size]).sort((a, b) => b[1] - a[1]);

/* The shape of the cause, from the blast radius. Stated as a QUESTION to check,
   never as a diagnosis: the report cannot see the CSS, and the one time this was
   guessed rather than checked (`.cpl-tab {color:#666}`, 2026-09-08) the fix went
   into a rule that a more specific one overrode, and the sweep was unchanged. */
function shape(n) {
  if (n >= N) return "EVERY route — shared chrome (first_light.js, the rail, a :root token). One rule fixes all.";
  if (n >= N * 0.5) return "most routes — a shared component or a token, not a tab";
  if (n > 1) return `${n} routes — a component those tabs share`;
  return "one route — that tab's own CSS";
}

function section(title, entries, note) {
  if (!entries.length) return;
  console.log(`\n${title}`);
  if (note) console.log(`  ${note}`);
  entries.forEach(([k, n]) => {
    console.log(`  ${String(n).padStart(3)} routes  ${k}`);
    console.log(`             ${shape(n)}`);
  });
}

console.log(`Triage of ${file}`);
console.log(`${routes.size} failing route(s).`);
const c = rank(contrast), t = rank(targets), s = rank(scrollers), o = rank(overflow);
const findings = [...contrast.values(), ...targets.values(), ...scrollers.values()]
  .reduce((a, v) => a + v.size, 0);
console.log(`${findings} finding(s) across ${c.length + t.length + s.length} distinct cause(s)` +
            (findings ? ` — ${(findings / Math.max(1, c.length + t.length + s.length)).toFixed(1)}x amplification` : ""));

section("── CONTRAST, by blast radius ──", c,
  "Fix top-down. A ratio repeated exactly across routes is ONE color, not many.");
section("── TARGET SIZE (WCAG 2.2 SC 2.5.8), by blast radius ──", t,
  "⚠️ The 24px floor belongs on whatever the engine MEASURES — a wrapping label replaces its control's box.");
section("── KEYBOARD-UNREACHABLE SCROLLERS ──", s,
  "An overflowing region needs tabindex=0 AND an accessible name.");
section("── SIDEWAYS SCROLL (mobile) ──", o,
  "Wide content scrolls inside its OWN container; the body never scrolls sideways.");

console.log("\n── order of work ──");
const all = [...c.map((x) => ["contrast", ...x]), ...t.map((x) => ["target", ...x]),
             ...s.map((x) => ["scroller", ...x])].sort((a, b) => b[2] - a[2]);
all.slice(0, 12).forEach(([kind, k, n], i) =>
  console.log(`  ${String(i + 1).padStart(2)}. [${kind}] ${k}  — ${n} route(s)`));
if (!all.length) console.log("  nothing to do — the sweep is clean.");
console.log("\nRe-run the sweep after each root cause, not at the end: the count is the proof.");
