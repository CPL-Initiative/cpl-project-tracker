// College Data Collection's statewide integration view (#3310 item 5): commons_data_integrations.js, read by
// commons_data.js through window.CPL_CDC_EXT, from kb/status/cdc_integrations.json (built by kb/_build_cdc_sharing.py
// from the hand-kept kb/cdc_integrations.json).
//
// WHAT THIS GUARDS:
//   (1) ⭐ the built file is current with the registry, and every agreement and every piece of evidence it names
//       exists (the builder's --check);
//   (2) ⭐ the starter set: live MAP custom-report API, COCI, C-ID and the COMIS Data Mart; proposed Chancellor's Office
//       data lake APIs, COMIS awards by control number and CCCStart JST authorizations; per college, SIS and
//       curriculum system APIs; four statuses exactly;
//   (3) ⭐ people by role only: no name and no email in the registry or the module; an agreement shows status only;
//   (4) ⭐ the view has its own address (#commons/data/integrations), opens from it, reports it, sits in the views'
//       menu after Data elements and sharing, lists every integration by status, and each agreement opens the
//       agreements on Data elements and sharing;
//   (5) ⭐ each college's rows are exposed (forCollege) and read "none known" until the registry holds a row for it;
//   (6) a missing file leaves the page whole and says so; static: tokens only, no storage, no write, no glyph.
//
// Run from repo root: `npm test` (or `node tests/commons_data_integrations.test.js`).
const fs = require("fs");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

const SRC = fs.readFileSync("commons_data.js", "utf8");
const SHARE = fs.readFileSync("commons_data_sharing.js", "utf8");
const EXT = fs.readFileSync("commons_data_integrations.js", "utf8");
const REG = JSON.parse(fs.readFileSync("kb/cdc_integrations.json", "utf8"));
const DICT = JSON.parse(fs.readFileSync("kb/cdc_data_dictionary.json", "utf8"));
const BUILT = JSON.parse(fs.readFileSync("kb/status/cdc_integrations.json", "utf8"));
const SHARING = JSON.parse(fs.readFileSync("kb/status/cdc_sharing.json", "utf8"));
const REAL = JSON.parse(fs.readFileSync("kb/status/commons_data.json", "utf8"));

let built = "";
try { built = execFileSync("python3", ["kb/_build_cdc_sharing.py", "--check"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
catch (e) { built = "FAILED: " + (e.stderr || e.message); }
check("(1) ⭐ kb/status/cdc_integrations.json is current, and every agreement and piece of evidence the registry names exists (" + built.trim().slice(-120) + ")",
  /(\d+) integrations/.test(built) && /\(current\)/.test(built));

const BY = Object.fromEntries(REG.integrations.map((x) => [x.id, x]));
check("(2) exactly four statuses, in order: live, in progress, proposed, not started", JSON.stringify(Object.keys(REG.statuses)) === JSON.stringify(["live", "in progress", "proposed", "not started"]));
check("(2) ⭐ live: the MAP custom-report API (nightly), COCI, C-ID and the COMIS Data Mart",
  ["map_custom_report_api", "coci", "cid", "comis_datamart"].every((k) => BY[k] && BY[k].status === "live") && BY.map_custom_report_api.cadence === "Nightly");
check("(2) ⭐ proposed: the Chancellor's Office data lake and dataset APIs, COMIS awards by control number, CCCStart JST authorizations",
  ["co_data_lake", "comis_awards", "cccstart_jst"].every((k) => BY[k] && BY[k].status === "proposed"));
check("(2) per college: SIS APIs and curriculum system APIs", ["sis_api", "curriculum_system_api"].every((k) => BY[k] && BY[k].scope === "per_college"));
check("(2) a live integration names its evidence in the repo", REG.integrations.filter((x) => x.status === "live").every((x) => x.evidence.length));
check("(2) the drafted COMIS awards request is said to be unrecorded, never linked to a guess", BY.comis_awards.request === "" && /not recorded/.test(BY.comis_awards.note));
const AG = new Set(DICT.agreements.map((a) => a.id));
check("(2) every agreement an integration needs is in the dictionary's agreements", REG.integrations.every((x) => !x.agreement || AG.has(x.agreement)));

const NAMES = /\b(Pedro|Craig|Jory|Terrence|Willett|Malone|Ashley|Jessica|Sam)\b/;
check("(3) ⭐ people by role only: no person's name in the registry, the built file or the module",
  !NAMES.test(JSON.stringify(REG)) && !NAMES.test(JSON.stringify(BUILT)) && !NAMES.test(EXT.replace(/^\s*\/\/.*$/gm, "")));
check("(3) no email anywhere in the registry", !/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/.test(JSON.stringify(REG)));
check("(3) every owner is a role the registry defines", REG.integrations.every((x) => REG.roles[x.owner]));

function dom(hash, files) {
  const d = new JSDOM('<!doctype html><html><head></head><body><div id="root">Loading</div></body></html>',
    { url: "https://example.org/index.html" + (hash || ""), runScripts: "dangerously" });
  const w = d.window, calls = [];
  w.fetch = function (url, init) {
    calls.push([String(url), (init && init.method) || "GET"]);
    const hit = files[String(url)];
    if (!hit) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error("404")) });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(hit))) });
  };
  w.scrollTo = function () {};
  w.eval(SHARE);
  w.eval(EXT);
  w.eval(SRC);
  return { w, root: w.document.getElementById("root"), calls };
}
function flush(w) { return new Promise((r) => w.setTimeout(r, 0)).then(() => new Promise((r) => w.setTimeout(r, 0))); }

(async function () {
  const files = { "kb/status/commons_data.json": REAL, "kb/status/cdc_sharing.json": SHARING, "kb/status/cdc_integrations.json": BUILT };
  const V = dom("#commons/data/integrations", files);
  const D = V.w.CPL_COMMONS_DATA;
  await D.boot(V.root, "integrations");
  await flush(V.w);
  check("(4) ⭐ #commons/data/integrations opens the view from its arrival, and the view names itself in its report",
    D.address() === "commons/data/integrations" && txt(V.root.querySelector("#cdd-h")) === "Integrations" && !!V.root.querySelector("#cdc-in-view"));
  const rows = [...V.root.querySelectorAll("#cdc-in-table tbody tr")];
  check("(4) every integration is a row (" + rows.length + " of " + REG.integrations.length + ")", rows.length === REG.integrations.length);
  const order = ["live", "in progress", "proposed", "not started"];
  check("(4) the rows run live, in progress, proposed, not started", rows.every((r, i) => !i || order.indexOf(rows[i - 1].getAttribute("data-status")) <= order.indexOf(r.getAttribute("data-status"))));
  check("(4) each row says what it would replace, and its owner by role", rows.every((r) => txt(r.querySelector('[data-label="Would replace"]')) && Object.values(REG.roles).indexOf(txt(r.querySelector('[data-label="Owner"]'))) >= 0));
  check("(4) the counts line names every status", order.every((s) => new RegExp("\\d+ " + s).test(txt(V.root.querySelector("#cdc-in-sum")))));
  check("(4) every header cell has its scope, in a labeled region, laid out fixed by its column group",
    [...V.root.querySelectorAll("#cdc-in-table th")].every((th) => th.getAttribute("scope")) && V.root.querySelector("#cdc-in-table").parentNode.getAttribute("aria-label") === "Integrations" &&
    V.root.querySelectorAll("#cdc-in-table col").length === V.root.querySelectorAll("#cdc-in-table thead th").length);
  const navs = [...V.root.querySelectorAll("nav.cdd-views a")].map((a) => a.getAttribute("data-goto"));
  check("(4) the views' menu carries Integrations at its address, after Data elements and sharing",
    navs.indexOf("integrations") > navs.indexOf("sharing") && navs.indexOf("sharing") > 0 &&
    V.root.querySelector('nav.cdd-views a[data-goto="integrations"]').getAttribute("href") === "#commons/data/integrations");
  const ag = V.root.querySelector('#cdc-in-table tr[data-integration="co_data_lake"] button.cdc-in-agree');
  check("(4) an agreement shows its name and status only", ag && txt(ag) === "Chancellor's Office data lake and dataset APIs" && /Might be needed/.test(txt(ag.parentNode)));
  if (ag) ag.click();
  await flush(V.w);
  check("(4) ⭐ an agreement opens the agreements on Data elements and sharing", D.address() === "commons/data/sharing" && !!V.root.querySelector("#cdc-sw-agreements-table"));

  // (5) each college's rows.
  const I = V.w.CPL_CDC_INTEGRATIONS;
  const any = REAL.colleges[0];
  const r0 = I.forCollege(D.slugOf(any));
  check("(5) ⭐ a college's rows are its SIS and curriculum system, each none known by default",
    r0.length === 2 && r0.every((r) => r.state === "none known") && r0.map((r) => r.integration).join() === "sis_api,curriculum_system_api");
  I._state.data.per_college.colleges["test-college"] = [{ integration: "curriculum_system_api", state: "connected", note: "a test row" }];
  const r1 = I.forCollege("test-college");
  check("(5) a college the registry names reads its own rows instead", r1.length === 1 && r1[0].state === "connected" && r1[0].name === "Curriculum system APIs");
  delete I._state.data.per_college.colleges["test-college"];

  // (6) a missing file.
  const X = dom("#commons/data/integrations", { "kb/status/commons_data.json": REAL, "kb/status/cdc_sharing.json": SHARING });
  X.w.CPL_CDC_INTEGRATIONS._reset();
  await X.w.CPL_COMMONS_DATA.boot(X.root, "integrations");
  await flush(X.w);
  check("(6) without kb/status/cdc_integrations.json the view says the registry could not be read", /could not be read/.test(txt(X.root.querySelector("#cdc-in-view"))));
  check("(6) tokens only, never a raw hex", !/#[0-9a-fA-F]{3,6}\b/.test(I.CSS));
  check("(6) stores nothing and writes nothing", !/localStorage|sessionStorage|method:\s*["'](POST|PATCH|PUT|DELETE)/.test(EXT) && V.calls.every((c) => c[1] === "GET"));
  check("(6) no glyph stands in for a word", !/[←-⇿☀-➿\u{1F300}-\u{1FAFF}]/u.test(EXT));

  const fails = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "  ok   " : "  FAIL ") + r[0]));
  console.log("\n" + (results.length - fails.length) + "/" + results.length + " checks passed");
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
