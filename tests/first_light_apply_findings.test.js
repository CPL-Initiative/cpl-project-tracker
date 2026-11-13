// COBIx's findings on the First Light Apply (#3183 at e19440b5; issue #3110 comment 6837874586), each run against
// fixtures: the workflow's own shell, lifted out of .github/workflows/first-light-apply.yml, runs with stand-ins for
// curl, gh and git on PATH, and tools/first_light_apply.mjs runs on a copy of the files it reads.
//
// Guards the FAILURE MODES:
//   (1) ⭐ a mark filed after the look is never consumed by that run. The look reads the pending requests, THEN the
//       highest mark id; the Plan passes it as --through; the tool consumes no mark above it. COBIx's case, end to
//       end: a run consumed a later request's marks, so the next run saw no change and stamped that request
//       `nothing` with no link. Now the later request's run finds its marks and updates the pull request. A run
//       that finds nothing new while a pull request is open names that pull request in the stamp.
//   (2) ⭐ the look: 404 (no table yet) is a notice and exit 0; 401, 403, a 5xx, a failed connection, or a failed
//       marks read exit 1, so workflow-failure-watch.yml (which lists "First Light apply") fires.
//   (3) ⭐ the open pull request is this repository's own: a fork's pull request on a branch of the same name is
//       never fetched, built on or appended to.
//
// Run from repo root: `node tests/first_light_apply_findings.test.js`.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const REPO = process.cwd();
const WF_TEXT = fs.readFileSync(".github/workflows/first-light-apply.yml", "utf8");

// The `run: |` block of the step with this exact name, dedented.
function stepRun(name) {
  const lines = WF_TEXT.split("\n");
  const i = lines.findIndex((l) => /^\s*- name: /.test(l) && l.replace(/^\s*- name: /, "").trim() === name);
  if (i < 0) return null;
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\s*- (name|uses):/.test(lines[j])) break;
    const m = /^(\s*)run: \|\s*$/.exec(lines[j]);
    if (!m) continue;
    const body = [];
    for (let k = j + 1; k < lines.length; k++) {
      const l = lines[k];
      if (!l.trim()) { body.push(""); continue; }
      if (/^\s*/.exec(l)[0].length <= m[1].length) break;
      body.push(l);
    }
    const min = Math.min(...body.filter((x) => x.trim()).map((x) => /^\s*/.exec(x)[0].length));
    return body.map((x) => x.slice(min)).join("\n");
  }
  return null;
}
const LOOK_NAME = (/- name: (Which Applies are pending[^\n]*)/.exec(WF_TEXT) || [])[1];
const LOOK = LOOK_NAME && stepRun(LOOK_NAME.trim());
const FIND = stepRun("Find the one open pull request");
const STAMP = stepRun("Stamp the requests");
check("the three steps are found, and their shell carries no ${{ }} expression to stand in for",
  LOOK && FIND && STAMP && [LOOK, FIND, STAMP].every((s) => s.indexOf("${{") === -1), JSON.stringify([!!LOOK, !!FIND, !!STAMP]));

// ── stand-ins for curl, gh and git ─────────────────────────────────────────
const BIN = fs.mkdtempSync(path.join(os.tmpdir(), "fl-findings-bin-"));
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), "fl-findings-"));
const LOG = path.join(WORK, "calls.log");
fs.writeFileSync(path.join(BIN, "curl"), `#!/usr/bin/env bash
echo "curl $*" >> "$STUB_LOG"
data=; url=
while [ $# -gt 0 ]; do case "$1" in -d) data=$2; shift ;; http*) url=$1 ;; esac; shift; done
case "$url" in
  *first_light_apply_requests*select=*) printf '%s\\n%s' "$REQ_BODY" "$REQ_CODE"; exit "\${REQ_EXIT:-0}" ;;
  *first_light_marks*) printf '%s\\n%s' "$MARKS_BODY" "$MARKS_CODE"; exit 0 ;;
  *first_light_apply_requests*) printf '%s' "$data" > "$STAMP_OUT"; printf '%s' "$url" > "$STAMP_URL" ;;
esac
`);
// gh pr list: the fixture's pull requests, cut to the --json fields asked for (as gh does), through the --jq filter.
fs.writeFileSync(path.join(BIN, "gh"), `#!/usr/bin/env bash
echo "gh $*" >> "$STUB_LOG"
fields=; q=
while [ $# -gt 0 ]; do case "$1" in --json) fields=$2; shift ;; --jq) q=$2; shift ;; esac; shift; done
jq -c --arg f "$fields" '[.[] | with_entries(select(.key as $k | ($f | split(",") | index($k)) != null))]' "$GH_PRS" | jq -rc "$q"
`);
fs.writeFileSync(path.join(BIN, "git"), `#!/usr/bin/env bash
echo "git $*" >> "$STUB_LOG"
`);
for (const f of ["curl", "gh", "git"]) fs.chmodSync(path.join(BIN, f), 0o755);

function sh(script, env) {
  const out = path.join(WORK, "out.txt");
  fs.writeFileSync(out, ""); fs.writeFileSync(LOG, "");
  for (const f of ["stamp.json", "stamp.url"]) { try { fs.unlinkSync(path.join(WORK, f)); } catch (e) { /* none */ } }
  const r = spawnSync("bash", ["-c", script], {
    encoding: "utf8",
    env: Object.assign({}, process.env, {
      PATH: BIN + path.delimiter + process.env.PATH, STUB_LOG: LOG, GITHUB_OUTPUT: out,
      STAMP_OUT: path.join(WORK, "stamp.json"), STAMP_URL: path.join(WORK, "stamp.url"),
      SUPABASE_URL: "https://example.supabase.co", SB_KEY: "fixture-key", BRANCH: "first-light-apply",
      GITHUB_REPOSITORY: "CPL-Initiative/cpl-project-tracker", GH_TOKEN: "fixture-token",
      RUN_URL: "https://github.com/CPL-Initiative/cpl-project-tracker/actions/runs/1"
    }, env)
  });
  const outputs = {};
  fs.readFileSync(out, "utf8").split("\n").forEach((l) => { const i = l.indexOf("="); if (i > 0) outputs[l.slice(0, i)] = l.slice(i + 1); });
  const read = (f) => { try { return fs.readFileSync(path.join(WORK, f), "utf8"); } catch (e) { return null; } };
  return { code: r.status, text: (r.stdout || "") + (r.stderr || ""), outputs, log: fs.readFileSync(LOG, "utf8"), stamp: read("stamp.json"), stampUrl: read("stamp.url") };
}

try {
  // ── (2) the look ─────────────────────────────────────────────────────────
  const look = (req, marks, extra) => sh(LOOK, Object.assign({ REQ_CODE: req[0], REQ_BODY: req[1], MARKS_CODE: marks[0], MARKS_BODY: marks[1] }, extra || {}));
  const ok = look(["200", '[{"id":7}]'], ["200", '[{"id":42}]']);
  check("(2) a pending request: exit 0, its id, and the highest mark id for the Plan", ok.code === 0 && ok.outputs.ids === "7" && ok.outputs.through === "42", JSON.stringify([ok.code, ok.outputs, ok.text]));
  check("(1) ⭐ the look reads the requests BEFORE the highest mark id (every mark of a request it read is at or below that id)",
    ok.log.indexOf("first_light_apply_requests") !== -1 && ok.log.indexOf("first_light_apply_requests") < ok.log.indexOf("first_light_marks"), ok.log);
  const empty = look(["200", "[]"], ["200", "[]"]);
  check("(2) nothing pending and no marks: exit 0, no ids, marks through id 0", empty.code === 0 && empty.outputs.ids === "" && empty.outputs.through === "0", JSON.stringify([empty.code, empty.outputs, empty.text]));
  const absent = look(["404", '{"message":"relation does not exist"}'], ["404", ""]);
  check("(2) ⭐ a table not yet in place (404): a notice, exit 0, nothing to do", absent.code === 0 && absent.outputs.ids === "" && /::notice::/.test(absent.text), JSON.stringify([absent.code, absent.text]));
  for (const c of ["401", "403", "500", "503"]) {
    const r = look([c, '{"message":"no"}'], ["200", '[{"id":1}]']);
    check("(2) ⭐ the request table answering HTTP " + c + " fails the run (exit 1), so the failure watch fires", r.code === 1 && /::error::/.test(r.text) && !r.outputs.ids, JSON.stringify([r.code, r.text]));
  }
  const down = look(["000", ""], ["200", "[]"], { REQ_EXIT: "7" });
  check("(2) ⭐ a connection that fails (curl's 000) fails the run", down.code === 1, JSON.stringify([down.code, down.text]));
  const marksBad = look(["200", '[{"id":7}]'], ["403", '{"message":"no"}']);
  check("(2) ⭐ a marks read that fails fails the run, with no ids handed on", marksBad.code === 1 && !marksBad.outputs.ids, JSON.stringify([marksBad.code, marksBad.text]));
  const WATCH = fs.readFileSync(".github/workflows/workflow-failure-watch.yml", "utf8");
  check("(2) the failure watch lists \"First Light apply\" by the workflow's own name",
    /^name: First Light apply$/m.test(WF_TEXT) && /^\s+- "First Light apply"$/m.test(WATCH));

  // ── (3) the open pull request is this repository's own ──────────────────
  const PRS = path.join(WORK, "prs.json");
  const own = { number: 12, url: "https://github.com/CPL-Initiative/cpl-project-tracker/pull/12", isCrossRepository: false };
  const fork = { number: 9, url: "https://github.com/CPL-Initiative/cpl-project-tracker/pull/9", isCrossRepository: true };
  const find = (prs) => { fs.writeFileSync(PRS, JSON.stringify(prs)); return sh(FIND, { GH_PRS: PRS }); };
  const fOnly = find([fork]);
  check("(3) ⭐ a fork's pull request on a branch named first-light-apply is not the open one: nothing fetched, built from main",
    fOnly.code === 0 && !fOnly.outputs.number && !/git[^\n]* fetch /.test(fOnly.log) && /git checkout -q -B first-light-apply\n/.test(fOnly.log),
    JSON.stringify([fOnly.code, fOnly.outputs, fOnly.log, fOnly.text]));
  const fBoth = find([fork, own]);
  check("(3) ⭐ beside a fork's pull request listed first, this repository's own is the one built on",
    fBoth.code === 0 && fBoth.outputs.number === "12" && fBoth.outputs.url === own.url && /git[^\n]* fetch -q --depth 20 origin first-light-apply/.test(fBoth.log),
    JSON.stringify([fBoth.code, fBoth.outputs, fBoth.text]));
  const fNone = find([]);
  check("(3) no open pull request: built from main", fNone.code === 0 && !fNone.outputs.number && !/ fetch /.test(fNone.log));

  // ── (1) the stamp names the open pull request when nothing is new ───────
  const stamp = (env) => {
    const r = sh(STAMP, Object.assign({ REQ_IDS: "7", OUTCOME: "", PR_NUMBER: "", PR_URL: "", OPEN_NUMBER: "", OPEN_URL: "" }, env));
    return Object.assign(r, { row: r.stamp ? JSON.parse(r.stamp) : null });
  };
  const sOpen = stamp({ OUTCOME: "nothing", OPEN_NUMBER: "12", OPEN_URL: own.url });
  check("(1) ⭐ nothing new while a pull request is open: the stamp names that pull request",
    sOpen.code === 0 && sOpen.row && sOpen.row.status === "nothing" && sOpen.row.pr_number === 12 && sOpen.row.pr_url === own.url && /open pull request/.test(sOpen.row.detail || ""),
    JSON.stringify([sOpen.code, sOpen.row, sOpen.text]));
  check("(1) the stamp touches exactly the requests the look read, while still pending", /id=in\.\(7\)&status=eq\.pending$/.test(sOpen.stampUrl || ""), sOpen.stampUrl);
  const sUpd = stamp({ OUTCOME: "updated", PR_NUMBER: "12", PR_URL: own.url, OPEN_NUMBER: "12", OPEN_URL: own.url });
  check("(1) an update names its pull request", sUpd.row && sUpd.row.status === "updated" && sUpd.row.pr_number === 12 && !sUpd.row.detail, JSON.stringify(sUpd.row));
  const sNone = stamp({ OUTCOME: "nothing" });
  check("(1) nothing new and no pull request open: no link", sNone.row && sNone.row.status === "nothing" && !("pr_number" in sNone.row) && !("pr_url" in sNone.row), JSON.stringify(sNone.row));
  const sFail = stamp({ OUTCOME: "failed", OPEN_NUMBER: "12", OPEN_URL: own.url });
  check("(1) a failed run never borrows the open pull request's link", sFail.row && sFail.row.status === "failed" && !("pr_number" in sFail.row) && /failed/.test(sFail.row.detail || ""), JSON.stringify(sFail.row));

  // The wiring the stand-ins cannot see: the look's id reaches the Plan, the open pull request reaches the stamp.
  const lookJob = WF_TEXT.slice(WF_TEXT.indexOf("\n  look:"), WF_TEXT.indexOf("\n  apply:"));
  const applyJob = WF_TEXT.slice(WF_TEXT.indexOf("\n  apply:"));
  const stampStep = applyJob.slice(applyJob.indexOf("- name: Stamp the requests"));
  check("(1) ⭐ the look's highest mark id reaches the Plan as --through",
    /\n      through: \$\{\{ steps\.look\.outputs\.through \}\}/.test(lookJob) && /\n      THROUGH: \$\{\{ needs\.look\.outputs\.through \}\}/.test(applyJob) &&
    /first_light_apply\.mjs" --root "\$GITHUB_WORKSPACE" --plan --through "\$THROUGH"/.test(stepRun("Plan from the marks") || ""));
  check("(1) the stamp reads the open pull request's number and link",
    /OPEN_NUMBER: \$\{\{ steps\.open\.outputs\.number \}\}/.test(stampStep) && /OPEN_URL: \$\{\{ steps\.open\.outputs\.url \}\}/.test(stampStep));
  check("(3) the lookup asks gh for isCrossRepository and keeps only false", /--json number,url,isCrossRepository/.test(FIND) && /select\(\.isCrossRepository == false\)/.test(FIND));
} catch (e) {
  check("the workflow's shell ran", false, String(e.stack || e));
}

// ── (1) the tool: --through, and COBIx's case end to end ───────────────────
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "fl-findings-root-"));
try {
  const SEL0 = JSON.parse(fs.readFileSync("tools/first_light_selection.json", "utf8"));
  const SEL = Array.isArray(SEL0) ? SEL0 : SEL0.paintings;
  const HERO = JSON.parse(fs.readFileSync("library/photos/hero_photos.json", "utf8"));
  const FILES = ["cpl_pathways.js", "fact-sheet/cpl_stories.js", "library/index.html", "library/adopt/index.html",
    "library/photos/hero_photos.json", "tools/first_light_selection.json", "tools/first_light_candidates.json",
    "tools/first_light_gallery/index.json"].concat(HERO.photos.map((p) => "library/photos/" + p.file));
  for (const f of FILES) { fs.mkdirSync(path.dirname(path.join(TMP, f)), { recursive: true }); fs.copyFileSync(f, path.join(TMP, f)); }
  const base = (SEL0.applied_through_mark_id || 0) + 1000;   // ids above any committed threshold
  const marksFile = path.join(WORK, "marks.json");
  const tool = (args, rows) => {
    fs.writeFileSync(marksFile, JSON.stringify(rows));
    return spawnSync("node", [path.join(REPO, "tools/first_light_apply.mjs"), "--root", TMP, "--marks", marksFile].concat(args), { encoding: "utf8" });
  };
  const planOf = (args, rows) => {
    const out = path.join(WORK, "plan.json"), r = tool(args.concat(["--plan", "--out", out]), rows);
    if (r.status !== 0) throw new Error("plan failed: " + r.stderr);
    return JSON.parse(fs.readFileSync(out, "utf8"));
  };
  // At the look: two marks and a request. Between the look and the Plan: a reviewer drops another painting, and
  // (once the first request is stamped) files the second request.
  const atLook = [
    { id: base + 1, item_set: "paintings", item_key: SEL[0].file, mark: "drop", collection: "rotation" },
    { id: base + 2, item_set: "photos", item_key: HERO.photos[1].file, mark: "position", position: 1, collection: "hero_photos" }
  ];
  const later = { id: base + 3, item_set: "paintings", item_key: SEL[1].file, mark: "drop", collection: "rotation" };
  const all = atLook.concat([later]);

  const p1 = planOf(["--through", String(base + 2)], all);
  check("(1) ⭐ --through: the run consumes the marks the look saw and not the later one",
    p1.changed && !p1.paintings.some((e) => e.file === SEL[0].file) && p1.paintings.some((e) => e.file === SEL[1].file) &&
    p1.applied.paintings === base + 1 && p1.applied.photos === base + 2, JSON.stringify(p1.applied));
  const pAll = planOf([], all);
  check("(1) with no --through every mark is read, as before (the tool's default)", !pAll.paintings.some((e) => e.file === SEL[1].file) && pAll.applied.paintings === base + 3);
  const p0 = planOf(["--through", "0"], all);
  check("(1) --through 0 consumes nothing", p0.changed === false);
  const bad = tool(["--plan", "--through", "4;rm"], all);
  check("(1) a --through that is not a whole number refuses rather than reading every mark", bad.status !== 0 && /--through/.test(bad.stderr), bad.stderr);

  // COBIx's case: run 1 (request A) writes the pull request's branch with --through at the look's id; run 2
  // (request B, filed after run 1's look) plans on that branch. B's mark must still be live there.
  fs.writeFileSync(path.join(WORK, "plan1.json"), JSON.stringify(p1));
  const a1 = tool(["--apply", "--plan", path.join(WORK, "plan1.json")], all);
  check("(1) run 1 writes the branch, recording the look's marks as consumed", a1.status === 0 &&
    JSON.parse(fs.readFileSync(path.join(TMP, "tools/first_light_selection.json"), "utf8")).applied_through_mark_id === base + 1, a1.stderr);
  const p2 = planOf(["--through", String(base + 3)], all);
  check("(1) ⭐ COBIx's case: the next run sees the later request's mark as a change, so that request is stamped with the pull request, not `nothing`",
    p2.changed === true && !p2.paintings.some((e) => e.file === SEL[1].file) && p2.applied.paintings === base + 3 &&
    p2.summary.paintings.length === 1 && /^Drop /.test(p2.summary.paintings[0]), JSON.stringify([p2.changed, p2.summary]));
} catch (e) {
  check("the tool ran", false, String(e.stack || e));
} finally {
  for (const d of [TMP, WORK, BIN]) fs.rmSync(d, { recursive: true, force: true });
}

let pass = 0;
for (const [n, okk, why] of results) {
  console.log((okk ? "PASS" : "FAIL") + "  " + n + (!okk && why ? "  — " + why : ""));
  if (okk) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
