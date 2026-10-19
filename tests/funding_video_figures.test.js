// tests/funding_video_figures.test.js
//
// The introduction films read the model (Sam, 2026-10-19: "add to the refresh
// all procedure the ability to revise the video and other text based on live
// info rather than hard coded data"). Three seams, each guarded here:
//
//   1. T._videoFigures() answers every figure a film shows for the active
//      scenario, from the functions the tab prints them with: the three
//      destinations sum to the appropriation, the average's split sums to the
//      average, each priority's statewide funding is the card's Total
//      Possible, and the average institution's target is the mean of the
//      institutions' own, never the statewide division.
//   2. scripts/funding_video_figures.js files them per scenario with the
//      config's md5 (--write), and --check says when the file differs.
//   3. build.py lays the filed figures over the typed ones for the
//      introductions alone (the narrated cuts keep what their voice speaks),
//      stamps the built page, and --check names what the model moved.
//
// ⛔ No figure is pinned: every expectation is read from the fixture config
// through the model at run time (the lane's standing rule).
//
// Run from repo root: `npm test` (or `node tests/funding_video_figures.test.js`).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const FIXTURE = path.join(ROOT, "tests", "fixtures", "cpl_funding_config_de95c290.json");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }

function boot() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body>' +
    '<div class="cpl-tab-pane" id="tab-implementation-funding"><div class="main-container">' +
    '<div><h2>x</h2><span id="cplFundTitleLink"></span></div><div id="cplFundingMount">p</div></div></div></body></html>',
    { runScripts: "outside-only", url: "https://example.org/" });
  const w = dom.window;
  w.scrollTo = function () {};
  w.CPL_FUNDING_NO_REMOTE = true;
  w.eval(read("college_short_names.js"));
  w.eval(read("cpl_funding_data.js"));
  w.eval(read("cpl_funding.js"));
  const T = w.CPL_FUNDING_TAB;
  T._setConfig(JSON.parse(fs.readFileSync(FIXTURE, "utf8")));
  T.boot();
  return { w, T };
}
const near = (a, b, eps) => Math.abs(a - b) <= (eps || 0.5);

// ── 1. the model's answer ───────────────────────────────────────────────────
{
  const { T } = boot();
  const cfg = T._config();
  const project = Object.keys(cfg.projects)[0];
  const published = cfg.projects[project].published;
  T._switchScenario(published);
  const f = T._videoFigures();
  check("1a: the active scenario is the published one, and the answer says so", f.scenario === published && f.published === true);
  check("1b: the two destinations sum to the appropriation", near(f.toInstitutions + f.statewide, f.appropriation, 0.01) &&
    near(f.toInstitutions, T._netCollege(), 0.01));
  check("1c: the average's credit and noncredit shares sum to the average max award", near(f.average.cr + f.average.nc, f.average.max, 0.01) &&
    f.average.pos > 0 && f.average.pos < 100);
  const pub = T._publicProgress();
  check("1d: each priority's statewide funding is the card's Total Possible, and its target the published sum",
    f.priorities.length === pub.prios.length && f.priorities.every((p, i) => near(p.funding, pub.prios[i].totalPossible, 0.01) &&
      near(p.target, pub.prios[i].target, 0.001) && near(p.price, pub.prios[i].price, 0.001)));
  const p1 = f.priorities[0];
  check("1e: the average institution's target is its own, under the statewide division per institution",
    p1.avgTargetFtes > 0 && p1.avgTargetFtes < p1.division / f.institutions * 1.5 &&
    near(p1.avgTargetUsd, f.average.cr * p1.share, 0.01));
  check("1f: the deadline and the timeline ride the config", /^\d{4}-\d{2}-\d{2}$/.test(f.deadline) && Array.isArray(f.timeline) && f.timeline.length > 3);
  // A scenario is read without leaving the curator on it.
  const other = Object.keys(cfg.projects[project].scenarios).find((n) => n !== published);
  T._switchScenario(other);
  const g = T._videoFigures();
  check("1g: another scenario answers for itself", g.scenario === other && g.published === false);
  // The splash's comparison names what moved, in the film's words.
  const moved = JSON.parse(JSON.stringify(f));
  moved.average.max += 1000;
  const diffs = T._videoDiff(moved, f);
  check("1h: the diff names the figure, the film's value and the model's", diffs.length === 1 &&
    /^average max award: \$[\d,]+ in the film, \$[\d,]+ in the model$/.test(diffs[0]));
  check("1i: and is silent when nothing moved", T._videoDiff(f, f).length === 0);
}

// ── 2. the script files them, stamped; --check reads the stamp ─────────────
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "figs-"));
const out = path.join(tmp, "figures.json");
{
  const script = path.join(ROOT, "scripts", "funding_video_figures.js");
  const log = execFileSync("node", [script, "--config", FIXTURE, "--write", "--out", out], { encoding: "utf8" });
  const filed = JSON.parse(fs.readFileSync(out, "utf8"));
  check("2a: --write files every scenario, the published one named, under the config's md5",
    /wrote /.test(log) && /^[0-9a-f]{8}$/.test(filed.config_md5) && filed.published && !!filed.scenarios[filed.published] &&
    Object.keys(filed.scenarios).length >= 2);
  let ok = true;
  try { execFileSync("node", [script, "--config", FIXTURE, "--check", "--out", out], { encoding: "utf8" }); } catch (e) { ok = false; }
  check("2b: --check passes against the file it just wrote", ok);
  const bent = JSON.parse(fs.readFileSync(out, "utf8"));
  bent.scenarios[bent.published].average.max += 1;
  fs.writeFileSync(out, JSON.stringify(bent));
  let failed = false, said = "";
  try { execFileSync("node", [script, "--config", FIXTURE, "--check", "--out", out], { encoding: "utf8" }); }
  catch (e) { failed = true; said = String(e.stdout || ""); }
  check("2c: --check fails, and names the figure, when the file differs", failed && /average\.max/.test(said));
  // Without a config it refuses, as funding_effective.js does.
  let refused = false;
  try { execFileSync("node", [script], { encoding: "utf8", stdio: "pipe" }); } catch (e) { refused = e.status === 2; }
  check("2d: with no config it refuses rather than print the baked defaults", refused);
}

// ── 3. build.py lays the filed figures over the typed ones ────────────────
{
  const dir = path.join(ROOT, "prototype", "funding_video");
  const src = read("prototype/funding_video/build.py");
  check("3a: build.py reads figures.json for s1 and the published scenario's s2, and leaves the narrated cuts their voiced figures",
    /FIGURES = HERE \/ 'figures\.json'/.test(src) && /LIVE\['s2'\] = live_config\(CONFIG\['s2'\], FIG, FIG\.get\('published'\)/.test(src) &&
    src.indexOf("CONFIG['n2'] = dict(") < src.indexOf("FIG = load_figures()"));
  // A --check over the filed figures, in a copy of the folder so nothing is rebuilt here.
  const copy = path.join(tmp, "fv");
  fs.mkdirSync(copy);
  ["build.py", "funding_in_motion.src.html"].forEach((f) => fs.copyFileSync(path.join(dir, f), path.join(copy, f)));
  fs.mkdirSync(path.join(copy, "assets"));
  fs.readdirSync(path.join(dir, "assets")).forEach((f) => fs.copyFileSync(path.join(dir, "assets", f), path.join(copy, "assets", f)));
  const script = path.join(ROOT, "scripts", "funding_video_figures.js");
  execFileSync("node", [script, "--config", FIXTURE, "--write", "--out", path.join(copy, "figures.json")], { encoding: "utf8" });
  let checkOut = "", checkStatus = 0;
  try { checkOut = execFileSync("python3", [path.join(copy, "build.py"), "--check"], { encoding: "utf8" }); }
  catch (e) { checkOut = String(e.stdout || ""); checkStatus = e.status; }
  check("3b: build.py --check reads the filed stamp and says, per variant, whether the model moved",
    /figures\.json: config [0-9a-f]{8}/.test(checkOut) && /^s1 \(Scenario 1\)/m.test(checkOut) && /^s2 \(/m.test(checkOut) &&
    /^n2 \(/m.test(checkOut) && (checkStatus === 0 || checkStatus === 1));
  // The typed values are the 2026-10-01 read; the fixture is the 2026-10-19
  // live config with Scenario 3 published at 15% noncredit, so the check
  // must report that the introduction's noncredit share moved.
  check("3c: the fixture's published scenario moved the introduction's figures, and --check says so",
    checkStatus === 1 && /^s2 \([^)]+\): \d+ figures? differ/m.test(checkOut) && /ex\.nc/.test(checkOut));
  // Building s2 in the copy takes the filed figures and stamps the page.
  const logo = path.join(ROOT, "sierra", "cpl-initiative-logo-navy.png");
  if (fs.existsSync(logo)) {
    const sierra = path.join(tmp, "sierra");
    fs.mkdirSync(sierra, { recursive: true });
    fs.copyFileSync(logo, path.join(sierra, "cpl-initiative-logo-navy.png"));
    // build.py finds the logo two directories up from itself.
    const nest = path.join(tmp, "prototype", "funding_video");
    fs.mkdirSync(nest, { recursive: true });
    fs.readdirSync(copy).forEach((f) => {
      const p = path.join(copy, f);
      if (fs.statSync(p).isDirectory()) { fs.mkdirSync(path.join(nest, f), { recursive: true }); fs.readdirSync(p).forEach((g) => fs.copyFileSync(path.join(p, g), path.join(nest, f, g))); }
      else fs.copyFileSync(p, path.join(nest, f));
    });
    const built = execFileSync("python3", [path.join(nest, "build.py"), "s2"], { encoding: "utf8" });
    const page = fs.readFileSync(path.join(nest, "funding_in_motion_s2.html"), "utf8");
    const cfg = JSON.parse(/CFG=(\{[\s\S]*?\}),EXPLAINER=/.exec(page)[1]);
    const filed = JSON.parse(fs.readFileSync(path.join(nest, "figures.json"), "utf8"));
    const live = filed.scenarios[filed.published];
    check("3d: the built introduction carries the filed figures and their stamp",
      /figures from figures\.json/.test(built) && cfg.figures && cfg.figures.config_md5 === filed.config_md5 &&
      cfg.figures.scenario === filed.published && cfg.ex.max === Math.round(live.average.max) &&
      cfg.ex.nc === Math.round(live.average.nc) && cfg.split.labs[0][1] === "$" + Math.round(live.toInstitutions).toLocaleString("en-US") &&
      cfg.target.ftesWords === live.priorities[0].avgTargetFtes.toFixed(1) && /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(cfg.deadline) &&
      !/__[A-Z0-9]+__/.test(page));
    const typed = execFileSync("python3", [path.join(nest, "build.py"), "s2", "--typed"], { encoding: "utf8" });
    check("3e: --typed builds from the typed values on purpose, and says so", /typed figures/.test(typed));
  } else {
    check("3d: (skipped: the logo asset is not in this checkout)", true);
    check("3e: (skipped)", true);
  }
}

let pass = 0;
for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
console.log(`\n${pass}/${results.length} assertions passed`);
process.exit(pass === results.length ? 0 : 1);
