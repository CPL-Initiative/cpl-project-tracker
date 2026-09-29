// The Sierra CORS contract — every header a Sierra page can SEND must be a header
// the function's preflight ALLOWS, and the health probe must actually check it.
//
// ⭐ WHY. On 2026-09-12 #1568 taught the COBI widget to send x-team-pass and, in
// the same commit, added it to the function's Access-Control-Allow-Headers. The
// source was never inconsistent. But the PAGE deploys on merge and the FUNCTION
// deploys only when someone dispatches cpl-chat-deploy.yml, and nobody did — so
// for five days a page that sent the header met a deployment (v65) that did not
// allow it. A browser answers that mismatch by refusing to send the request at
// all, so every COBI reader holding the team phrase saw a dead assistant while
// the hourly uptime probe passed forty times, because curl makes no preflight.
//
// Two halves, and this file is the cheap one:
//   • SOURCE side (here) — the page cannot send a header the function does not
//     allow, and the probe's own list cannot fall behind the page. Both are the
//     kind of drift a reviewer reads past.
//   • DEPLOYED side (chatbox/health_check.sh) — the half that was actually
//     wrong. Only a live OPTIONS can see a function running behind its source,
//     so the probe now makes one; check (3) keeps that check able to fail.
//
// ⚠ A green run here proves the SOURCE agrees with itself. It says nothing about
// what is deployed. That is the probe's job, and the reason the probe exists.
//
// Run from repo root: `npm test` (or `node tests/sierra_cors_contract.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function block(label, fn) {
  try { fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const FN = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");
const WIDGET = fs.readFileSync("cpl_chat.js", "utf8");
const PHRASE = fs.readFileSync("team_phrase.js", "utf8");
const PROBE = fs.readFileSync("chatbox/health_check.sh", "utf8");

const lower = (a) => a.map((s) => s.toLowerCase());

// The allow-list the function answers a preflight with.
function allowedHeaders() {
  const m = FN.match(/"Access-Control-Allow-Headers":\s*"([^"]+)"/);
  return m ? lower(m[1].split(",").map((s) => s.trim())).filter(Boolean) : null;
}

// Everything credentialHeaders() can put on the chat request, including what it
// hands to the team-phrase helper to decorate.
function widgetHeaders() {
  const start = WIDGET.indexOf("function credentialHeaders() {");
  if (start < 0) return null;
  const body = WIDGET.slice(start, WIDGET.indexOf("return h;", start));
  const names = new Set();
  let m;
  const literal = /'([A-Za-z][A-Za-z0-9-]*)'\s*:/g;      // 'Content-Type': …
  while ((m = literal.exec(body))) names.add(m[1].toLowerCase());
  const indexed = /h\['([^']+)'\]/g;                       // h['Authorization'] = …
  while ((m = indexed.exec(body))) names.add(m[1].toLowerCase());
  // decorateHeaders() attaches its own, on the same object.
  const dstart = PHRASE.indexOf("function decorateHeaders(");
  if (dstart >= 0) {
    const dbody = PHRASE.slice(dstart, PHRASE.indexOf("return headers;", dstart));
    const dec = /headers\['([^']+)'\]/g;
    while ((m = dec.exec(dbody))) names.add(m[1].toLowerCase());
  }
  return [...names];
}

// The list the live probe asks the deployed function about.
function probeWanted() {
  const m = PROBE.match(/^WANT="([^"]+)"/m);
  return m ? lower(m[1].trim().split(/\s+/)) : null;
}

const ALLOW = allowedHeaders();
const SENDS = widgetHeaders();
const WANT = probeWanted();

// ── (1) the page cannot send what the function will not allow ────────────────
block("(1)", function () {
  check("(1) the function declares an Access-Control-Allow-Headers list", ALLOW && ALLOW.length > 0);
  check("(1) credentialHeaders() + decorateHeaders() were parsed", SENDS && SENDS.length >= 3,
    "got: " + JSON.stringify(SENDS));
  if (!ALLOW || !SENDS) return;
  const missing = SENDS.filter((h) => !ALLOW.includes(h));
  check("(1) ⭐ every header the COBI widget can send is allowed by the preflight",
    missing.length === 0,
    "not allowed: " + missing.join(", ") + " — a browser will refuse the whole request, not drop the header. "
    + "Add it to corsHeaders() in chatbox/supabase/functions/cpl-chat/index.ts AND dispatch cpl-chat-deploy.yml.");
  check("(1) x-team-pass specifically is allowed (the header #1568 shipped)",
    ALLOW.includes("x-team-pass"));
});

// ── (2) the probe's list cannot fall behind the page ─────────────────────────
block("(2)", function () {
  check("(2) health_check.sh declares a WANT list", WANT && WANT.length > 0);
  if (!WANT || !SENDS) return;
  const unchecked = SENDS.filter((h) => !WANT.includes(h));
  check("(2) ⭐ the live probe asks about every header the widget can send",
    unchecked.length === 0,
    "unchecked by the probe: " + unchecked.join(", ") + " — add them to WANT in chatbox/health_check.sh, "
    + "or a future deployment skew in exactly this shape goes unseen again.");
});

// ── (3) the guard must be able to fail ───────────────────────────────────────
// This repo keeps finding guards that cannot: a probe that reports UP whenever it
// cannot tell converts an outage into a green tick, which is the script's own
// stated rule.
block("(3)", function () {
  check("(3) the probe makes a real OPTIONS request", /curl[^\n]*-X OPTIONS/.test(PROBE));
  check("(3) it asks the preflight about the headers it holds",
    /Access-Control-Request-Headers:/.test(PROBE));
  check("(3) ⭐ a missing header is reported DOWN and exits non-zero",
    /if \[ -n "\$missing" \]; then[\s\S]{0,800}?emit down[\s\S]{0,800}?exit 1/.test(PROBE));
  check("(3) it reads the response's allow-list rather than assuming one",
    /access-control-allow-headers/i.test(PROBE));
  check("(3) an absent allow-list header is itself a failure",
    /if \[ -z "\$allow" \][\s\S]{0,400}?exit 1/.test(PROBE));
  check("(3) the preflight runs BEFORE the paid model call",
    PROBE.indexOf("-X OPTIONS") < PROBE.indexOf('echo "Probing $URL"'));
});

const failed = results.filter((r) => !r[1]);
results.forEach(([name, ok, why]) =>
  console.log((ok ? "  ok  " : "  FAIL ") + name + (ok || !why ? "" : "\n        " + why)));
console.log("\nsierra_cors_contract.test.js: "
  + (results.length - failed.length) + "/" + results.length + " checks passed");
if (failed.length) process.exit(1);
