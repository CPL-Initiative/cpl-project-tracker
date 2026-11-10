// The Exhibits List view shows the last re-analysis under the box that asks for one (cer-procedures lane NEXT, S628).
// Guards:
//   (1) the panel reads kb/exhibits_reanalysis/latest.json and leads with what needs the sender's word;
//   (2) the checks' counts read in words, in a fold, never as glyphs;
//   (3) no file, no panel, and the box still works;
//   (4) latest.json is the newest dated findings file, so the view never shows a stale pass.
// Run from repo root: `npm test` (or `node tests/exhibits_reanalysis_panel.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");
const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: [
  { ut: "Welding Level 1", issuer: "AWS", cpl_types: ["Industry Certification"], raw_count: 1, articulations: [] }] };
const RX = { request: "_EXHIBIT_REANALYSIS::x", sent_at: "2026-11-09T12:39:19.127Z", run: "S626", method: "code checks only",
  comments_answer: "The request carried no comments; nothing to answer.",
  summary: { credentials: 19, rename_collision: 0, issuer_spellings: 2, no_cpl_type: 17 },
  for_sam: [{ credential: "Wildland Fire-Basics", ask: "Recommendation: the long form.", held_because: "a correction to his own save" }],
  notes: ["CCAPP names two bodies. No action."], findings: [] };

function load(rx) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window;
  const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))) });
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (url === "kb/exhibits_reanalysis/latest.json") return rx ? ok(rx) : Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_adoption.json") return ok({ schema: 1, cip_sectors: {}, colleges: [], credentials: {} });
    if (/\/rest\/v1\/kb_curation/.test(url)) return ok([]);
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: () => Promise.resolve(sess), authHeaders: () => ({ apikey: "k", Authorization: "Bearer k" }) };
  w.CPL_TABS = { loadScript: function (s, name, cb) { if (s === "commons_list.js") { const e = w.document.createElement("script"); e.textContent = fs.readFileSync("commons_list.js", "utf8"); w.document.body.appendChild(e); } if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF)); setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 12; i++) await tick(); }
/* CI runs files side by side, so a fixed count of ticks can end before the panel's fetch paints: wait for it, up to 5 s. */
async function until(fn) { const end = Date.now() + 5000; while (!fn() && Date.now() < end) await new Promise((r) => setTimeout(r, 20)); }

(async function () {
  const t = load(RX);
  await t.M.boot(); await settle();
  await until(() => t.d.getElementById("exh-l-rx"));
  const p = t.d.getElementById("exh-l-rx");
  check("(1) ⭐ the panel shows under the re-analyze box, labelled", !!p && p.getAttribute("aria-label") === "The last re-analysis"
    && !!t.d.getElementById("exh-l-note"));
  check("(1) it leads with the count looked at and what needs your word",
    /looked at 19 credentials\. 1 needs your word\./.test(txt(p && p.querySelector(".exh-l-rxhead"))), txt(p));
  check("(1) the ask names the credential and why it was held", /Wildland Fire-Basics: Recommendation: the long form\. Held: a correction to his own save\./.test(txt(p)));
  const fold = p && p.querySelector("details summary");
  check("(2) the counts sit in a fold, in words, zero counts left out", !!fold && /What the checks found \(2 kinds\)/.test(txt(fold))
    && /2 with an issuer spelled two ways; 17 with no CPL type\./.test(txt(p)) && !/collides/.test(txt(p)), txt(p));
  check("(2) the routine's notes and the comments answer read", /CCAPP names two bodies/.test(txt(p)) && /Your comments: The request carried no comments/.test(txt(p)));
  check("(2) no raw hex in the panel's CSS", !/exh-l-rx[^"]*#[0-9a-fA-F]{3,6}\b/.test(txt(t.d.getElementById("exh-css"))));

  const t2 = load(null);
  await t2.M.boot(); await settle();
  await until(() => t2.d.getElementById("exh-l-note") && t2.M._state && t2.M._state.ls && t2.M._state.ls.rx === false);
  check("(3) no file, no panel; the box stays", !t2.d.getElementById("exh-l-rx") && !!t2.d.getElementById("exh-l-note"));

  const dir = "kb/exhibits_reanalysis";
  const dated = fs.readdirSync(dir).filter((f) => /^\d{4}-\d\d-\d\d\.json$/.test(f)).sort();
  const latest = fs.existsSync(path.join(dir, "latest.json")) ? fs.readFileSync(path.join(dir, "latest.json"), "utf8") : "";
  check("(4) ⭐ latest.json is the newest dated findings file", dated.length > 0 && latest === fs.readFileSync(path.join(dir, dated[dated.length - 1]), "utf8"),
    "copy " + dated[dated.length - 1] + " to latest.json");

  let fail = 0;
  results.forEach(([n, ok, why]) => { console.log((ok ? "PASS " : "FAIL ") + n + (ok || !why ? "" : "  — " + why)); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
