// The First Light Apply (tools/first_light_apply.mjs, .github/workflows/first-light-apply.yml; S643, #3153).
//
// COBIx on #3153 (comment 6829695812): an added painting arrives with blurb, setting and alt set to the fixed token
// "__needs_words__"; such an entry stays out of the rotation, and an empty or placeholder alt on any painting or
// photo that would ship FAILS THE BUILD. This file is that build failure, and the Apply's own guards.
//
// Guards the FAILURE MODES:
//   (a) ⭐ the build fails while any selection painting or hero photo has an empty or "__needs_words__" alt, and the
//       rotation (first_light.js) never carries the token;
//   (b) ⭐ the manifest builder keeps a "__needs_words__" entry out of the rotation, and still fails on an empty alt;
//   (c) ⭐ the Apply, end to end on a copy of the files: a drop, a move and an add from the candidates reach the
//       selection; an added painting carries the token in all three fields; a My CPL Story photo arrives with the
//       name exactly as MAP printed it, the story's link and nothing else MAP did not publish, at its measured size;
//       the three views' copies equal the list; (a) then fails on the result until the words are written;
//   (d) ⭐ Drop is the takedown path: the next Apply removes the story photo from the list, all three views and disk;
//   (e) no marks: nothing changes;
//   (f) the workflow: an hourly look that reads one REST row before any checkout, one pull request at a time, the
//       `test` run dispatched on the branch, the request stamped, no new credential, and nothing that merges;
//   (g) the workflow is mapped in kb/governance_surface_map.json with a reason.
//
// Run from repo root: `node tests/first_light_needs_words.test.js`.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const NEEDS = "__needs_words__";
const REPO = process.cwd();

// The one predicate the build applies (a): an alt that would ship must be written.
function unwritten(sel, hero) {
  const bad = [];
  sel.forEach((e) => { const a = String(e.alt || "").trim(); if (!a || a.indexOf(NEEDS) !== -1) bad.push("painting " + (e.title || e.file)); });
  hero.photos.forEach((p) => { const a = String(p.alt || "").trim(); if (!a || a.indexOf(NEEDS) !== -1) bad.push("photo " + (p.name || p.file)); });
  return bad;
}

// The three views' copies of the hero list, read the way tests/first_light_tab.test.js reads them.
function copies(root) {
  function slides(html, dirPrefix) {
    const block = html.slice(html.indexOf('class="hero-slides"'), html.indexOf("</div>", html.indexOf('class="hero-slides"')));
    const out = [];
    block.replace(/<img class="hero-slide[^"]*" (?:src|data-src)="([^"]+)" alt="" width="(\d+)" height="(\d+)">/g, function (_, src, wd, ht) {
      out.push([src.indexOf(dirPrefix) === 0 ? src.slice(dirPrefix.length) : "WRONG DIR " + src, +wd, +ht]);
    });
    return out;
  }
  const m = /var HERO_PHOTOS = (\[[\s\S]*?\]\]);/.exec(fs.readFileSync(path.join(root, "cpl_pathways.js"), "utf8"));
  return [slides(fs.readFileSync(path.join(root, "library/index.html"), "utf8"), "photos/"),
    slides(fs.readFileSync(path.join(root, "library/adopt/index.html"), "utf8"), "../photos/"), m ? JSON.parse(m[1]) : null];
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function png(w, h) {
  const b = Buffer.alloc(64);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8); b.write("IHDR", 12, "ascii"); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20);
  return b;
}

// ── (a) the repo as it stands ──────────────────────────────────────────────
const SEL = JSON.parse(fs.readFileSync("tools/first_light_selection.json", "utf8"));
const HERO = JSON.parse(fs.readFileSync("library/photos/hero_photos.json", "utf8"));
const bad = unwritten(SEL, HERO);
check("(a) ⭐ every painting and photo that would ship has a written alt (no empty alt, no " + NEEDS + ")", bad.length === 0, bad.join("; "));
const waiting = SEL.filter((e) => ["blurb", "setting"].some((k) => String(e[k] || "").indexOf(NEEDS) !== -1)).map((e) => e.title || e.file);
check("(a) no painting still waits for its blurb or setting", waiting.length === 0, waiting.join("; "));
check("(a) ⭐ the rotation never carries the token", fs.readFileSync("first_light.js", "utf8").indexOf(NEEDS) === -1);

// ── a copy of the files the Apply touches ──────────────────────────────────
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "fl-apply-"));
const FILES = ["first_light.js", "cpl_pathways.js", "fact-sheet/cpl_stories.js", "library/index.html", "library/adopt/index.html",
  "library/photos/hero_photos.json", "tools/build_first_light_manifest.mjs", "tools/first_light_selection.json",
  "tools/first_light_candidates.json", "tools/first_light_gallery/index.json"].concat(HERO.photos.map((p) => "library/photos/" + p.file));
for (const f of FILES) { fs.mkdirSync(path.dirname(path.join(TMP, f)), { recursive: true }); fs.copyFileSync(f, path.join(TMP, f)); }
const T = (f) => path.join(TMP, f);
const readT = (f) => JSON.parse(fs.readFileSync(T(f), "utf8"));
const FIX = fs.mkdtempSync(path.join(os.tmpdir(), "fl-story-"));
function run(args, env) {
  return execFileSync("node", [path.join(REPO, "tools/first_light_apply.mjs"), "--root", TMP].concat(args),
    { encoding: "utf8", env: Object.assign({}, process.env, { FIRST_LIGHT_STORY_FIXTURE_DIR: FIX }, env || {}), stdio: ["ignore", "pipe", "pipe"] });
}
function build() {
  try { return { ok: true, out: execFileSync("node", [T("tools/build_first_light_manifest.mjs")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) }; }
  catch (e) { return { ok: false, out: String(e.stderr || e.stdout || e.message) }; }
}
const manifestCount = () => (fs.readFileSync(T("first_light.js"), "utf8").match(/^\s+img: "/gm) || []).length;
const writeMarks = (rows) => { const f = path.join(FIX, "marks.json"); fs.writeFileSync(f, JSON.stringify(rows)); return f; };

try {
  // ── (e) no marks ─────────────────────────────────────────────────────────
  const none = JSON.parse(run(["--plan", "--marks", writeMarks([])]).trim().split("\n").pop());
  check("(e) no marks: nothing changes", none.changed === false && !none.needs_browser);

  // ── (c) a drop, a move, an add, a story ──────────────────────────────────
  const M = require(path.join(REPO, "first_light_tab.js"));
  const live = new Set(SEL.map((e) => e.file));
  const gallery = JSON.parse(fs.readFileSync("tools/first_light_gallery/index.json", "utf8")).paintings;
  const candSet = new Set(JSON.parse(fs.readFileSync("tools/first_light_candidates.json", "utf8")).candidates.map((c) => c.file));
  const addP = gallery.find((g) => !g.in_first_light && !live.has(g.file) && candSet.has(g.file));
  const S = fs.readFileSync("fact-sheet/cpl_stories.js", "utf8");
  const STORIES = JSON.parse(S.slice(S.indexOf("{"), S.lastIndexOf("}") + 1));
  const story = STORIES.stories.find((s) => M.storyFile(s));
  const skey = M.storyFile(story);
  fs.writeFileSync(path.join(FIX, path.basename(skey)), png(640, 480));
  const marks = [
    { id: 1, item_set: "paintings", item_key: SEL[0].file, mark: "drop", collection: "rotation" },
    { id: 2, item_set: "paintings", item_key: addP.file, mark: "add", collection: "gallery_candidates" },
    { id: 3, item_set: "paintings", item_key: SEL[5].file, mark: "position", position: 1, collection: "rotation" },
    { id: 4, item_set: "photos", item_key: HERO.photos[2].file, mark: "drop", collection: "hero_photos" },
    { id: 5, item_set: "photos", item_key: skey, mark: "add", collection: "my_cpl_story" }
  ];
  const mf = writeMarks(marks);
  const planFile = path.join(FIX, "plan.json"), bodyFile = path.join(FIX, "body.md");
  const pl = JSON.parse(run(["--plan", "--marks", mf, "--out", planFile]).trim().split("\n").pop());
  check("(c) the plan sees the change, one story to fetch, two items wanting words", pl.changed && pl.needs_browser && pl.needs_words === 2, JSON.stringify(pl));
  run(["--apply", "--plan", planFile, "--body", bodyFile]);
  const sel2 = readT("tools/first_light_selection.json"), hero2 = readT("library/photos/hero_photos.json");
  check("(c) ⭐ the drop, the move and the add reach the selection",
    !sel2.some((e) => e.file === SEL[0].file) && sel2[0].file === SEL[5].file && sel2[sel2.length - 1].file === addP.file && sel2.length === SEL.length);
  const added = sel2[sel2.length - 1];
  check("(c) ⭐ an added painting carries the token in blurb, setting and alt, with the pool's facts",
    added.blurb === NEEDS && added.setting === NEEDS && added.alt === NEEDS && added.title && added.artist && added.year && added.museum && !/^https?:/.test(added.museum));
  const sp = hero2.photos.find((p) => p.file === skey);
  check("(c) the hero drop leaves the list", !hero2.photos.some((p) => p.file === HERO.photos[2].file) && hero2.photos.length === HERO.photos.length);
  check("(c) ⭐ the story photo carries the name exactly as MAP printed it and the story's link, nothing more",
    sp && sp.name === story.name && sp.story_link === STORIES.source && sp.source === "My CPL Story" &&
    JSON.stringify(Object.keys(sp).sort()) === JSON.stringify(["alt", "file", "height", "name", "plays", "source", "story_link", "width"]), JSON.stringify(sp));
  check("(c) the story photo is on disk at its measured size, with an alt wanting words",
    fs.existsSync(T("library/photos/" + skey)) && sp.width === 640 && sp.height === 480 && sp.alt === NEEDS);
  const want = hero2.photos.map((p) => [p.file, p.width, p.height]);
  const [lib, adopt, pw] = copies(TMP);
  check("(c) ⭐ the three views' copies equal the new list", same(lib, want) && same(adopt, want) && same(pw, want), JSON.stringify([lib.length, adopt.length, pw && pw.length]));
  const b = build();
  check("(b) ⭐ the builder holds the added painting out of the rotation", b.ok && manifestCount() === sel2.length - 1 && /Held out of the rotation/.test(b.out) &&
    fs.readFileSync(T("first_light.js"), "utf8").indexOf(NEEDS) === -1, b.out);
  check("(c) ⭐ the build then fails on the result until the words are written", unwritten(sel2, hero2).length === 2);
  const body = fs.readFileSync(bodyFile, "utf8");
  check("(c) the pull request says Sam merges and lists the words wanted", /Sam merges this; nothing auto-merges/.test(body) && /Words wanted before review/.test(body) && body.indexOf(story.name) !== -1);

  // Words written: the build passes and the painting joins the rotation.
  added.alt = "A test description of the added painting, long enough to read."; added.blurb = "A test blurb for the painting, at least thirty characters."; added.setting = "A test setting.";
  fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify(sel2, null, 2));
  const b2 = build();
  check("(b) once written, the painting joins the rotation", b2.ok && manifestCount() === sel2.length, b2.out);
  const sel3 = readT("tools/first_light_selection.json");
  sel3[1].alt = "";
  fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify(sel3, null, 2));
  check("(b) the builder still fails on an empty alt", !build().ok);
  check("(a) and so does the build check", unwritten(sel3, hero2).some((x) => x.indexOf("painting") === 0));
  fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify(sel2, null, 2));

  // ── (d) Drop takes a story photo down ────────────────────────────────────
  run(["--apply", "--marks", writeMarks(marks.concat([{ id: 9, item_set: "photos", item_key: skey, mark: "drop", collection: "my_cpl_story" }]))]);
  const hero3 = readT("library/photos/hero_photos.json");
  const [lib3, adopt3, pw3] = copies(TMP);
  check("(d) ⭐ a Drop removes the story photo from the list and every view", !hero3.photos.some((p) => p.file === skey) &&
    [lib3, adopt3, pw3].every((c) => !c.some((r) => r[0] === skey)));
  check("(d) ⭐ and from disk", !fs.existsSync(T("library/photos/" + skey)));
} catch (e) {
  check("the Apply ran", false, String(e.stderr || e.stdout || e.stack || e));
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.rmSync(FIX, { recursive: true, force: true });
}

// ── (f) the workflow ───────────────────────────────────────────────────────
{
  const WF = fs.readFileSync(".github/workflows/first-light-apply.yml", "utf8");
  const code = WF.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
  const look = code.slice(code.indexOf("\n  look:"), code.indexOf("\n  apply:"));
  const apply = code.slice(code.indexOf("\n  apply:"));
  check("(f) dispatch and an hourly schedule", /\n  workflow_dispatch:/.test(code) && /cron: '\d+ \* \* \* \*'/.test(code));
  check("(f) ⭐ the look reads one pending row before any checkout", !/actions\/checkout/.test(look) && (look.match(/curl /g) || []).length === 1 &&
    /first_light_apply_requests\?status=eq\.pending&select=id&order=id\.asc&limit=1/.test(look));
  check("(f) an absent table reads as nothing pending, not a failure", /exit 0/.test(look));
  check("(f) the apply runs only on a pending request or a dispatch", /needs: look/.test(apply) && /if: needs\.look\.outputs\.id != '' \|\| github\.event_name == 'workflow_dispatch'/.test(apply));
  check("(f) ⭐ one Apply at a time", /concurrency:\s*\n\s*group: first-light-apply\s*\n\s*cancel-in-progress: false/.test(code));
  check("(f) ⭐ a second Apply while a pull request is open builds on its branch and updates it",
    /gh pr list --head "\$BRANCH" --base main --state open/.test(apply) && /git checkout -q -B "\$BRANCH" FETCH_HEAD/.test(apply) && /gh pr edit "\$OPEN_NUMBER"/.test(apply) && (apply.match(/gh pr create/g) || []).length === 1);
  check("(f) ⭐ the `test` run is dispatched on the branch (no app token)", /gh workflow run js-tests\.yml --ref "\$BRANCH"/.test(apply) && /actions: write/.test(apply));
  check("(f) ⭐ nothing merges, approves or turns on auto-merge", !/gh pr (merge|review)|--auto\b|enable-auto|merge_pull_request/.test(code));
  const secrets = [...code.matchAll(/secrets\.([A-Z_]+)/g)].map((m) => m[1]);
  check("(f) no new credential: only the service key other workflows use", secrets.length > 0 && secrets.every((s) => s === "SUPABASE_SERVICE_KEY"));
  check("(f) the request is stamped, only while pending, even when the run fails",
    /if: always\(\) && env\.REQ_ID != ''/.test(apply) && /-X PATCH "\$SUPABASE_URL\/rest\/v1\/first_light_apply_requests\?id=eq\.\$REQ_ID&status=eq\.pending"/.test(apply));
  check("(f) it runs the tab's resolver and the manifest builder, and fetches story photos through the shared browser install",
    /node tools\/first_light_apply\.mjs --plan/.test(apply) && /node tools\/build_first_light_manifest\.mjs/.test(apply) && /bash scripts\/install_browser\.sh node/.test(apply));
  const sparse = (/sparse-checkout: \|\n([\s\S]*?)\n      - uses/.exec(apply) || [])[1] || "";
  const need = ["first_light_tab.js", "tools/first_light_apply.mjs", "tools/build_first_light_manifest.mjs", "fact-sheet/cpl_stories.js", "library/photos/", "cpl_pathways.js", "scripts/install_browser.sh"];
  check("(f) the sparse checkout holds every file the Apply reads and writes", need.every((f) => sparse.indexOf("/" + f) !== -1), sparse);
  const APPLY_JS = fs.readFileSync("tools/first_light_apply.mjs", "utf8");
  check("(f) ⭐ the script uses the tab's resolver, never a copy", /require\(path\.join\(HERE, "\.\.", "first_light_tab\.js"\)\)/.test(APPLY_JS) && /MARKS\.resolveSet\(/.test(APPLY_JS) && !/function resolveSet/.test(APPLY_JS));
}

// ── (g) governance ─────────────────────────────────────────────────────────
{
  const G = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
  const why = (G.dismissed && G.dismissed["workflow:first-light-apply.yml"]) || (G.mapped && G.mapped["workflow:first-light-apply.yml"]) || "";
  check("(g) the workflow is mapped with a reason naming Sam's merge", why.length > 120 && /Sam/.test(why) && /merge/.test(why));
}

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
