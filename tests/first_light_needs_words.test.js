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
//   (f) the workflow: an hourly look that reads the pending rows before any checkout, one pull request at a time, the
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

// The one predicate the build applies (a): nothing ships until its words are written. A painting in the selection
// fails on an empty alt or on the token in ANY of blurb, setting or alt: the builder leaves out an entry whose
// blurb or setting still holds it, so merging with only the alt written would leave the tab's manifest and the
// Apply's selection disagreeing on the list and its numbers.
function unwritten(sel, hero) {
  const bad = [];
  sel.forEach((e) => {
    const a = String(e.alt || "").trim();
    if (!a || ["blurb", "setting", "alt"].some((k) => String(e[k] || "").indexOf(NEEDS) !== -1)) bad.push("painting " + (e.title || e.file));
  });
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
const SEL0 = JSON.parse(fs.readFileSync("tools/first_light_selection.json", "utf8"));
const SEL = Array.isArray(SEL0) ? SEL0 : SEL0.paintings;
const HERO = JSON.parse(fs.readFileSync("library/photos/hero_photos.json", "utf8"));
const bad = unwritten(SEL, HERO);
check("(a) ⭐ every painting and photo that would ship has its words: an alt, and no " + NEEDS + " in a painting's blurb, setting or alt", bad.length === 0, bad.join("; "));
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
  const selObj = readT("tools/first_light_selection.json"), sel2 = selObj.paintings, hero2 = readT("library/photos/hero_photos.json");
  check("(c) ⭐ M2 the Apply records the highest mark it consumed, per set, in the committed files",
    selObj.applied_through_mark_id === 3 && hero2.applied_through_mark_id === 5, JSON.stringify([selObj.applied_through_mark_id, hero2.applied_through_mark_id]));
  check("(c) a hero photo dropped and named nowhere else leaves disk", !fs.existsSync(T("library/photos/" + HERO.photos[2].file)));
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
  check("(b) M2 the manifest carries the paintings' applied number for the tab", /PAINTINGS\.applied_through_mark_id = 3;/.test(fs.readFileSync(T("first_light.js"), "utf8")));
  check("(b) ⭐ the builder holds the added painting out of the rotation", b.ok && manifestCount() === sel2.length - 1 && /Held out of the rotation/.test(b.out) &&
    fs.readFileSync(T("first_light.js"), "utf8").indexOf(NEEDS) === -1, b.out);
  check("(c) ⭐ the build then fails on the result until the words are written", unwritten(sel2, hero2).length === 2);
  const body = fs.readFileSync(bodyFile, "utf8");
  check("(c) the pull request says Sam merges and lists the words wanted", /Sam merges this; nothing auto-merges/.test(body) && /Words wanted before review/.test(body) && body.indexOf(story.name) !== -1);

  // Only the alt written: the build still fails, since the builder would leave the painting out.
  const altOnly = JSON.parse(JSON.stringify(sel2));
  altOnly[altOnly.length - 1].alt = "A test description of the added painting, long enough to read.";
  check("(c) ⭐ only the alt written: the build still fails (blurb and setting hold the token)", unwritten(altOnly, { photos: [] }).length === 1);
  const blurbOnly = JSON.parse(JSON.stringify(altOnly));
  blurbOnly[blurbOnly.length - 1].blurb = "A test blurb for the painting, at least thirty characters.";
  check("(c) ⭐ alt and blurb written, setting not: the build still fails", unwritten(blurbOnly, { photos: [] }).length === 1);
  // Words written: the build passes and the painting joins the rotation.
  added.alt = "A test description of the added painting, long enough to read."; added.blurb = "A test blurb for the painting, at least thirty characters."; added.setting = "A test setting.";
  const writeSel = (list) => fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify({ applied_through_mark_id: 3, paintings: list }, null, 2));
  writeSel(sel2);
  const b2 = build();
  check("(b) once written, the painting joins the rotation", b2.ok && manifestCount() === sel2.length, b2.out);
  const sel3 = readT("tools/first_light_selection.json").paintings;
  sel3[1].alt = "";
  writeSel(sel3);
  check("(b) the builder still fails on an empty alt", !build().ok);
  check("(a) and so does the build check", unwritten(sel3, hero2).some((x) => x.indexOf("painting") === 0));
  const sel4 = JSON.parse(JSON.stringify(sel2));
  sel4.push({ file: "Not In The Pool At All.jpg", title: "Missing", artist: "A", year: "1900", museum: "M",
    blurb: "A blurb long enough to pass the builder's length check.", setting: "S", alt: "A description long enough to pass." });
  writeSel(sel4);
  const b3 = build();
  check("(b) the manifest's own URL stands in only for the four listed files; any other missing file still fails", !b3.ok && /Not In The Pool At All/.test(b3.out));
  const BUILDER = fs.readFileSync("tools/build_first_light_manifest.mjs", "utf8");
  check("(b) the four are listed by name with the reason beside them, and each use is logged",
    (BUILDER.slice(BUILDER.indexOf("POOL_DROPPED = new Set(["), BUILDER.indexOf("]);", BUILDER.indexOf("POOL_DROPPED = new Set(["))).match(/\.jpg",/g) || []).length === 4 &&
    /sourcing run 4 narrowed it/.test(BUILDER) && /kept the manifest's own URL \(POOL_DROPPED\)/.test(BUILDER));
  // Sam merged, then removed the added painting by hand: the spent Add must not bring it back.
  writeSel(sel2.filter((e) => e.file !== addP.file));

  // A held key is printed only when it has a shape the table accepts.
  const odd = "stories/`x`<b>.png";
  run(["--plan", "--marks", writeMarks(marks.concat([{ id: 7, item_set: "photos", item_key: odd, mark: "add", collection: "my_cpl_story" }])), "--body", bodyFile]);
  const body2 = fs.readFileSync(bodyFile, "utf8");
  check("(c) a key the table would refuse is never printed in the pull request", body2.indexOf("<b>") === -1 && body2.indexOf("`x`") === -1 && /1 not shown/.test(body2), body2);
  // Two stories whose photos land on one key: the second is refused, and the key is held.
  const storiesFile = T("fact-sheet/cpl_stories.js"), storiesText = fs.readFileSync(storiesFile, "utf8");
  const dup = JSON.parse(JSON.stringify(STORIES));
  dup.stories.push(Object.assign({}, dup.stories[1], { name: "Somebody Else", img: dup.stories[1].img }));
  fs.writeFileSync(storiesFile, "window.CPL_STORIES = " + JSON.stringify(dup) + ";\n");
  const dkey = M.storyFile(dup.stories[1]);
  const pd = JSON.parse(run(["--plan", "--marks", writeMarks([{ id: 50, item_set: "photos", item_key: dkey, mark: "add", collection: "my_cpl_story" }])]).trim().split("\n").pop());
  check("(c) two stories sharing a key: the photo is held, never added under either name", !pd.changed && pd.held.indexOf(dkey) !== -1, JSON.stringify(pd));
  fs.writeFileSync(storiesFile, storiesText);

  // ⭐ Held marks are never lost: an Add whose item the Apply could not find (here a story not yet in the stories
  // file) stays live below the threshold, and a later Apply applies it once the item exists.
  {
    const heroBefore = readT("library/photos/hero_photos.json");
    const late = { name: "Late Story", img: "https://staging2.map.rccd.edu/wp-content/uploads/2026/08/late.png", pathway: "", quote: "", meta: "" };
    const lkey = M.storyFile(late);
    const storiesFile2 = T("fact-sheet/cpl_stories.js"), keepText = fs.readFileSync(storiesFile2, "utf8");
    const heldMarks = marks.concat([{ id: 20, item_set: "photos", item_key: lkey, mark: "add", collection: "my_cpl_story" },
      { id: 21, item_set: "photos", item_key: HERO.photos[3].file, mark: "position", position: 1, collection: "hero_photos" }]);
    run(["--apply", "--marks", writeMarks(heldMarks)]);
    const hA = readT("library/photos/hero_photos.json");
    check("(c) ⭐ a held Add is recorded beside the threshold, and the applied Move is not",
      hA.applied_through_mark_id === 21 && JSON.stringify(hA.held_mark_ids) === "[20]" && !hA.photos.some((p) => p.file === lkey) && hA.photos[0].file === HERO.photos[3].file,
      JSON.stringify([hA.applied_through_mark_id, hA.held_mark_ids]));
    const dupS = JSON.parse(JSON.stringify(STORIES)); dupS.stories.push(late);
    fs.writeFileSync(storiesFile2, "window.CPL_STORIES = " + JSON.stringify(dupS) + ";\n");
    fs.writeFileSync(path.join(FIX, path.basename(lkey)), png(300, 200));
    run(["--apply", "--marks", writeMarks(heldMarks)]);
    const hB = readT("library/photos/hero_photos.json");
    check("(c) ⭐ the held Add below the threshold is applied by a later Apply once its item exists, and leaves the held list",
      hB.photos.some((p) => p.file === lkey && p.name === "Late Story") && JSON.stringify(hB.held_mark_ids) === "[]" && hB.applied_through_mark_id === 21,
      JSON.stringify([hB.applied_through_mark_id, hB.held_mark_ids, hB.photos.map((p) => p.file)]));
    // Put the photos back the way the rest of this file expects them.
    fs.writeFileSync(storiesFile2, keepText);
    fs.unlinkSync(T("library/photos/" + lkey));
    fs.writeFileSync(T("library/photos/hero_photos.json"), JSON.stringify(heroBefore, null, 2));
  }
  check("(b) the builder carries held ids into the manifest for the tab", (() => {
    const selH = readT("tools/first_light_selection.json");
    fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify(Object.assign({}, selH, { held_mark_ids: [2] }), null, 2));
    const ok = build().ok && /PAINTINGS\.held_mark_ids = \[2\];/.test(fs.readFileSync(T("first_light.js"), "utf8"));
    fs.writeFileSync(T("tools/first_light_selection.json"), JSON.stringify(selH, null, 2));
    return ok;
  })());

  // ── (d) Drop takes a story photo down ────────────────────────────────────
  // A page in the checkout still names one hero photo, so dropping it leaves its file on disk.
  const named = HERO.photos[4].file;
  fs.writeFileSync(T("library/other_page.html"), '<img src="photos/' + named + '" alt="kept">');
  run(["--apply", "--marks", writeMarks(marks.concat([{ id: 9, item_set: "photos", item_key: skey, mark: "drop", collection: "my_cpl_story" },
    { id: 10, item_set: "photos", item_key: named, mark: "drop", collection: "hero_photos" }]))]);
  const hero3 = readT("library/photos/hero_photos.json"), sel5 = readT("tools/first_light_selection.json");
  check("(d) ⭐ M2 a spent Add, removed by hand after the merge, stays out on the next Apply", !sel5.paintings.some((e) => e.file === addP.file) && sel5.applied_through_mark_id === 3);
  check("(d) ⭐ M2 spent marks are not applied twice: the old Move does not pin again", sel5.paintings[0].file === SEL[5].file && hero3.applied_through_mark_id === 10);
  check("(d) a dropped hero photo another page still names stays on disk", !hero3.photos.some((p) => p.file === named) && fs.existsSync(T("library/photos/" + named)));
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
  const steps = apply.split(/\n      - /).slice(1);
  const step = (name) => steps.find((x) => x.indexOf("name: " + name) === 0) || "";
  const jobHead = apply.slice(0, apply.indexOf("\n    steps:"));
  check("(f) dispatch and an hourly schedule", /\n  workflow_dispatch:/.test(code) && /cron: '\d+ \* \* \* \*'/.test(code));
  check("(f) ⭐ the look reads every pending request before any checkout", !/actions\/checkout/.test(look) && (look.match(/curl /g) || []).length === 1 &&
    /first_light_apply_requests\?status=eq\.pending&select=id&order=id\.asc"/.test(look) && !/limit=/.test(look));
  check("(f) an absent table reads as nothing pending, not a failure", /exit 0/.test(look));
  check("(f) the apply runs only on a pending request or a dispatch", /needs: look/.test(apply) && /if: needs\.look\.outputs\.ids != '' \|\| github\.event_name == 'workflow_dispatch'/.test(apply));
  check("(f) ⭐ one Apply at a time", /concurrency:\s*\n\s*group: first-light-apply\s*\n\s*cancel-in-progress: false/.test(code));
  check("(f) one run serves every pending request: each is stamped", /id=in\.\(\$REQ_IDS\)&status=eq\.pending/.test(apply) && /\[!0-9,\]/.test(apply));
  check("(f) ⭐ a second Apply while a pull request is open builds on its branch, updates it, and appends to its description",
    /gh pr list -R "\$GITHUB_REPOSITORY" --head "\$BRANCH" --base main --state open/.test(apply) && /git checkout -q -B "\$BRANCH" FETCH_HEAD/.test(apply) &&
    /gh pr view "\$OPEN_NUMBER"[^\n]*--json body/.test(apply) && /cat "\$RUNNER_TEMP\/body\.md"; \} > "\$RUNNER_TEMP\/body-all\.md"/.test(apply) &&
    /gh pr edit "\$OPEN_NUMBER"[^\n]*--body-file "\$RUNNER_TEMP\/body-all\.md"/.test(apply) && (apply.match(/gh pr create/g) || []).length === 1);
  check("(f) ⭐ the `test` run is dispatched on the branch (no app token)", /gh workflow run js-tests\.yml -R "\$GITHUB_REPOSITORY" --ref "\$BRANCH"/.test(apply) && /actions: write/.test(apply));
  check("(f) ⭐ nothing merges, approves or turns on auto-merge", !/gh pr (merge|review)|--auto\b|enable-auto|merge_pull_request/.test(code));
  const secrets = [...code.matchAll(/secrets\.([A-Z_]+)/g)].map((m) => m[1]);
  check("(f) no new credential: only the service key other workflows use", secrets.length > 0 && secrets.every((x) => x === "SUPABASE_SERVICE_KEY"));
  // ⭐ M5: the name the workflow sets is the name the script reads.
  const APPLY_JS = fs.readFileSync("tools/first_light_apply.mjs", "utf8");
  const readMarksSrc = APPLY_JS.slice(APPLY_JS.indexOf("async function readMarks"), APPLY_JS.indexOf("\n}\n", APPLY_JS.indexOf("async function readMarks")));
  const wanted = [...new Set([...readMarksSrc.matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]))];
  const topEnv = (/\nenv:\n((?:  .*\n)+)/.exec(code) || [])[1] || "";
  const planEnv = step("Plan from the marks");
  const setIn = (block, n) => new RegExp("\\n\\s+" + n + ":\\s").test("\n" + block);
  check("(f) ⭐ M5 every variable the script reads to reach the marks is set on the Plan step (or for the whole workflow)",
    wanted.length >= 2 && wanted.every((n) => setIn(planEnv, n) || setIn(topEnv, n)), JSON.stringify(wanted));
  check("(f) ⭐ M5 the Plan step hands the service key to the name the script reads", /SUPABASE_SERVICE_KEY: \$\{\{ secrets\.SUPABASE_SERVICE_KEY \}\}/.test(planEnv) && wanted.indexOf("SUPABASE_SERVICE_KEY") !== -1);
  const keySteps = steps.filter((x) => /secrets\.SUPABASE_SERVICE_KEY/.test(x)).map((x) => x.split("\n")[0]);
  const tokenSteps = steps.filter((x) => /github\.token/.test(x)).map((x) => x.split("\n")[0]);
  check("(f) the service key only on the steps that read the marks or stamp a request",
    JSON.stringify(keySteps) === JSON.stringify(["name: Plan from the marks", "name: Stamp the requests"]) && !/secrets\.|github\.token/.test(jobHead), JSON.stringify(keySteps));
  check("(f) the token only on the steps that read the pull requests, push, open the pull request and dispatch",
    JSON.stringify(tokenSteps) === JSON.stringify(["name: Find the one open pull request", "name: Push the branch and open or update the one pull request"]), JSON.stringify(tokenSteps));
  check("(f) checkout keeps no token", /persist-credentials: false/.test(apply));
  const copyAt = apply.indexOf("name: Copy the tools out of main"), openAt = apply.indexOf("name: Find the one open pull request");
  const runs = [...apply.matchAll(/node ("?[^ \n]*(first_light_apply|build_first_light_manifest)\.mjs)/g)].map((m) => m[1]);
  check("(f) ⭐ the tools run from main's copy, never from the open pull request's branch",
    copyAt > 0 && copyAt < openAt && runs.length === 3 && runs.every((r) => r.indexOf('"$TOOLS/tools/') === 0) && /--root "\$GITHUB_WORKSPACE"/.test(apply), JSON.stringify(runs));
  // ⭐ Code from the open pull request's branch never runs with a secret. Every step runs only main's copy of the
  // tools ($TOOLS, copied before the branch is fetched); no step runs a file from the checkout.
  const runOf = (x) => (/\n\s+run: \|\n([\s\S]*)$/.exec(x) || [])[1] || "";
  const holds = (x) => /secrets\.|github\.token/.test(x);
  const lastSecret = steps.reduce((n, x, i) => (holds(x) ? i : n), -1);
  const execs = steps.slice(0, lastSecret + 1).map((x) => {
    const r = runOf(x), wd = /working-directory: \$\{\{ runner\.temp \}\}\/main/.test(x);
    // A command at the start of a line, or after a pipe, ;, && or $( : what the shell actually runs.
    const at = "(?:^|\\n|[;&|(]\\s*)\\s*";
    const nodes = [...r.matchAll(new RegExp(at + "node[ \\t]+(\"?[^\\s]+)", "g"))].map((m) => m[1]).filter((t) => !/^-/.test(t));
    const shells = [...r.matchAll(new RegExp(at + "(?:bash|sh|source|\\.)[ \\t]+(\"?[^\\s]+)", "g"))].map((m) => m[1]);
    const npm = /\bnpm\b|\bnpx\b/.test(r);
    return { name: x.split("\n")[0], bad: nodes.filter((t) => t.indexOf('"$TOOLS/') !== 0).concat(wd ? [] : shells).concat(npm && !wd ? ["npm in the checkout"] : []) };
  }).filter((e) => e.bad.length);
  check("(f) ⭐ no step that holds a secret, and no step before one, runs a file that can come from the pull request's branch",
    lastSecret > 0 && execs.length === 0, JSON.stringify(execs));
  const copyStep = step("Copy the tools out of main");
  check("(f) ⭐ every tool the job runs is copied from main before the branch is fetched",
    ["first_light_tab.js", "tools/first_light_apply.mjs", "tools/build_first_light_manifest.mjs", "scripts/install_browser.sh"].every((f) => copyStep.indexOf(f) !== -1) &&
    steps.indexOf(copyStep) < steps.indexOf(step("Find the one open pull request")) && /ref: main/.test(apply));
  const inst = step("Install a browser for MAP's story photos (only when one is added)");
  check("(f) the install step holds no secret and runs outside the checkout", inst && !holds(inst) && /working-directory: \$\{\{ runner\.temp \}\}\/main/.test(inst));
  const pushStep = step("Push the branch and open or update the one pull request");
  check("(f) the commit names only data paths, never a script or tool", /git add -A tools\/first_light_selection\.json first_light\.js library\/photos cpl_pathways\.js library\/index\.html library\/adopt\/index\.html\n/.test(pushStep));
  check("(f) it fetches story photos through the shared browser install", /bash scripts\/install_browser\.sh node/.test(apply));
  const sparse = (/sparse-checkout: \|\n([\s\S]*?)\n      - uses/.exec(apply) || [])[1] || "";
  const need = ["first_light_tab.js", "tools/first_light_apply.mjs", "tools/build_first_light_manifest.mjs", "fact-sheet/", "library/", "cpl_pathways.js", "scripts/install_browser.sh"];
  check("(f) the sparse checkout holds every file the Apply reads and writes, and the served pages it searches", need.every((f) => sparse.indexOf("/" + f) !== -1), sparse);
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
