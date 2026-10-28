/**
 * Sierra's MAP links beside a credential a college could adopt (S494).
 *
 * Sam, 2026-10-26: "the same MAP link on every public surface that suggests an
 * adoption"; Open Asks Sheet 134 card 1 "builder", card 2 "build" (COBI first,
 * tracker #2488; Sierra second). Sierra's could-adopt context comes from the
 * college_adoption_opportunities RPC by common title, so cpl-chat reads the same
 * index COBI does (kb/reference/map_cpl_opportunities_verified.json).
 *
 * The failure this guards: two surfaces that answer "where do I request Quick
 * Adopt?" with different colleges. So the main check runs Sierra's lifted block
 * and COBI's map_links.js over every title in the real index and requires the
 * same IDs in the same order. The rest pin the wiring that fails silently: an
 * index read but never passed, a line printed with no rule, a rule printed with
 * no line, and a test bundle without the block reaching mapLinksLine.
 *
 * Run: node tests/sierra_map_links.test.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { liftBlock, stripTypes } = require("./lib/lift_ts");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "chatbox", "supabase", "functions", "cpl-chat", "index.ts");
const src = fs.readFileSync(SRC, "utf8");
const INDEX = JSON.parse(fs.readFileSync(
  path.join(ROOT, "kb", "reference", "map_cpl_opportunities_verified.json"), "utf8"));

const results = [];
const check = (name, cond, msg) => results.push([!!cond, name + (cond ? "" : " — " + (msg || ""))]);

/* ── 1. The block lifts and runs ──────────────────────────────────────────── */
let lifted = null, liftErr = null;
try {
  lifted = liftBlock(src, "// ── MAP LINKS BLOCK START", "// ── MAP LINKS BLOCK END",
    ["mapAdoptLinks", "mapLinksLine", "MAP_OPPORTUNITIES_PAGE", "MAP_OPPORTUNITIES_VIEW", "MAP_LINKS_MAX"]);
} catch (e) { liftErr = e; }
check("the MAP LINKS block lifts and evaluates", lifted, liftErr && liftErr.message);

/* ── 2. Same colleges and IDs as COBI's map_links.js, for every title ─────── */
async function cobiLines() {
  const win = {};
  const ctx = vm.createContext({
    window: win, document: {}, setTimeout,
    fetch: async () => ({ ok: true, json: async () => INDEX }),
  });
  vm.runInContext(fs.readFileSync(path.join(ROOT, "map_links.js"), "utf8"), ctx);
  const api = win.CPL_MAP_LINKS;
  await api.load();
  return api;
}
const hrefIds = (html) => [...String(html).matchAll(/\?Exhibit=([^"&]+)[&"]/g)].map((m) => decodeURIComponent(m[1]));

(async () => {
  if (lifted) {
    const { mapAdoptLinks, mapLinksLine, MAP_OPPORTUNITIES_PAGE, MAP_OPPORTUNITIES_VIEW, MAP_LINKS_MAX } = lifted;
    const api = await cobiLines();
    const titles = Object.keys(INDEX.by_title);
    let agree = 0, withLinks = 0, firstMiss = null;
    for (const t of titles) {
      const sierra = mapAdoptLinks(INDEX, t).slice(0, MAP_LINKS_MAX).map((l) => l.id);
      const cobi = hrefIds(api.lineHtml(t));
      if (JSON.stringify(sierra) === JSON.stringify(cobi)) agree++;
      else if (!firstMiss) firstMiss = `${t}: Sierra ${sierra.join(",")} / COBI ${cobi.join(",")}`;
      if (sierra.length) withLinks++;
    }
    check(`Sierra and COBI name the same exhibits for all ${titles.length} titles`,
      agree === titles.length, `${titles.length - agree} differ; first: ${firstMiss}`);
    check("the index gives most titles a link (a broken read would give none)",
      withLinks > titles.length * 0.9, `${withLinks} of ${titles.length}`);
    check("the page and the cap match COBI's",
      MAP_OPPORTUNITIES_PAGE === api.MAP_PAGE && MAP_OPPORTUNITIES_VIEW === api.MAP_VIEW && MAP_LINKS_MAX === api.MAX);

    /* ── 3. One link per builder, each a verified ID of that title ──────────── */
    let bad = null;
    for (const t of titles) {
      const links = mapAdoptLinks(INDEX, t);
      const colleges = links.map((l) => l.college);
      if (new Set(colleges).size !== colleges.length) { bad = `${t}: a college twice`; break; }
      for (const l of links) {
        if (!INDEX.by_title[t].includes(l.id) || !INDEX.found[l.id.toUpperCase()]) { bad = `${t}: ${l.id} unverified`; break; }
        if (l.url !== MAP_OPPORTUNITIES_PAGE + "?Exhibit=" + encodeURIComponent(l.id) + "&View=Non-Military") { bad = `${t}: ${l.url}`; break; }
      }
      if (bad) break;
    }
    check("one link per building college, each a verified ID opening MAP searched for it", !bad, bad);

    /* ── 4. The line: names the builder, caps at six, empty when MAP lists none ── */
    const many = titles.find((t) => mapAdoptLinks(INDEX, t).length > MAP_LINKS_MAX);
    if (many) {
      const n = mapAdoptLinks(INDEX, many).length;
      const line = mapLinksLine(INDEX, many);
      check("past six builders the line says how many more",
        line.includes(`and ${n - MAP_LINKS_MAX} more college`) &&
        (line.match(/\?Exhibit=/g) || []).length === MAP_LINKS_MAX, line.slice(0, 200));
    }
    const one = titles.find((t) => mapAdoptLinks(INDEX, t).length === 1);
    const l1 = mapAdoptLinks(INDEX, one)[0];
    check("a line names the building college, its exhibit ID and the URL",
      mapLinksLine(INDEX, one).includes(`${l1.college} built ${l1.id}, ${l1.url}`), mapLinksLine(INDEX, one));
    check("no index, no title, or an unlisted title gives no line",
      mapLinksLine(null, one) === "" && mapLinksLine(INDEX, "") === "" &&
      mapLinksLine(INDEX, "No Such Credential 0000") === "");

    /* ── 5. buildVolumeContext prints the line and its rule together ─────────── */
    function extract(name) {
      const start = src.indexOf(`function ${name}(`);
      let i = src.indexOf("{", start), depth = 0, end = -1;
      for (let j = i; j < src.length; j++) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
      }
      return src.slice(start, end);
    }
    const blockSrc = src.slice(src.indexOf("// ── MAP LINKS BLOCK START"), src.indexOf("// ── MAP LINKS BLOCK END"));
    const bundle = stripTypes([blockSrc, extract("renderRecLines"), extract("buildVolumeContext")].join("\n\n"));
    // eslint-disable-next-line no-new-func
    const { buildVolumeContext } = new Function(bundle + "\nreturn { buildVolumeContext };")();
    const adopt = [
      { unified_title: one, band: "peer", peers_already_adopted: 1, statewide: false },
      { unified_title: "No Such Credential 0000", band: "ready_to_adopt" },
    ];
    const withIdx = buildVolumeContext(null, adopt, "Norco College", undefined, INDEX);
    const noIdx = buildVolumeContext(null, adopt, "Norco College");
    check("with the index: the link line and the MAP LINKS rule both print",
      withIdx.includes(l1.url) && /MAP LINKS:/.test(withIdx) && /Use only the URLs/.test(withIdx));
    check("without the index: neither prints (the could-adopt list is unchanged)",
      !noIdx.includes("Exhibit=") && !/MAP LINKS:/.test(noIdx) && noIdx.includes(one));
    const unlisted = buildVolumeContext(null, [adopt[1]], "Norco College", undefined, INDEX);
    check("a list where MAP lists none of the credentials prints no rule",
      !/MAP LINKS:/.test(unlisted));
  }

  /* ── 6. Wiring in the handler ────────────────────────────────────────────── */
  check("the index is read only when a college is named",
    /singleProfile\?\.college \? fetchMapLinks\(\) : Promise\.resolve\(null\)/.test(src));
  check("both buildVolumeContext call sites pass the index",
    (src.match(/buildVolumeContext\(vol, adopt, [^)]*mapIdx\)/g) || []).length === 2);
  check("mapLinksLine is reached only through the mapIdx guard",
    /mapIdx \? mapLinksLine\(mapIdx, t\) : ""/.test(src));
  check("cpl-chat reads the file kb/_verify_map_exhibit_links.py writes",
    /main\/kb\/reference\/map_cpl_opportunities_verified\.json/.test(src) &&
    fs.readFileSync(path.join(ROOT, "kb", "_verify_map_exhibit_links.py"), "utf8")
      .includes("map_cpl_opportunities_verified.json"));

  let fail = 0;
  for (const [ok, name] of results) { console.log(`${ok ? "  ok " : "  FAIL"} ${name}`); if (!ok) fail++; }
  console.log(`\n${results.length - fail}/${results.length} checks passed`);
  process.exit(fail ? 1 : 0);
})();
