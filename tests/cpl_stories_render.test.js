// Fact Sheet — the "My CPL Stories" 4-random renderer (cpl_stories_render.js).
//
// Guards:
//  (a) renders exactly 4 cards from window.CPL_STORIES (or fewer if fewer exist);
//  (b) each card shows the name + photo (https only) + quote;
//  (c) text is ESCAPED (external data) — an XSS payload doesn't execute;
//  (d) a non-https image src is dropped (no mixed/data: image);
//  (e) empty/missing data hides the whole "More stories" block (intro + featured
//      story + "See all" link still render);
//  (f) the section is wired in index.html (script tags + grid + "See all" link).
//
// Run from repo root: `npm test` (or `node tests/cpl_stories_render.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const HTML = fs.readFileSync("fact-sheet/index.html", "utf8");
const SRC = fs.readFileSync("fact-sheet/cpl_stories_render.js", "utf8");

// ── Part A — static wiring on the shipped page ──
check("index.html loads cpl_stories.js (data)", /<script src="\.\/cpl_stories\.js"><\/script>/.test(HTML));
check("index.html loads cpl_stories_render.js", /<script src="\.\/cpl_stories_render\.js"><\/script>/.test(HTML));
check("index.html has the #cpl-stories-grid", /id="cpl-stories-grid"/.test(HTML));
check("index.html has a 'See all CPL' link to cplstories", /href="https:\/\/map\.rccd\.edu\/cplstories\/"/.test(HTML));

// ── Part B — behavior in jsdom ──
function loadDom(stories) {
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/fact-sheet/" });
  const w = dom.window;
  if (stories !== undefined) w.CPL_STORIES = { stories: stories };
  w.eval(SRC);
  // jsdom (runScripts:"outside-only") already fired DOMContentLoaded before our
  // eval, so the module's deferred listener never runs — trigger render directly
  // (a real browser boots it normally). Mirrors factsheet_edit.test.js calling boot().
  if (w.CPL_STORIES_RENDER) w.CPL_STORIES_RENDER.render();
  return dom;
}

const STORIES = [
  { name: "Brody", img: "https://staging2.map.rccd.edu/x/brody.png", pathway: "Fire Technology Worker → Chaffey Graduate", quote: "CPL saved me a year and real money on my degree." },
  { name: "Luis C.", img: "https://staging2.map.rccd.edu/x/luis.jpeg", quote: "I earned credit for my Navy training." },
  { name: "April P.", img: "https://staging2.map.rccd.edu/x/april.png", quote: "Prior learning got me to graduation faster." },
  { name: "Koa M.", img: "https://staging2.map.rccd.edu/x/koa.png", quote: "My work experience finally counted." },
  { name: "Jorge M.", img: "https://staging2.map.rccd.edu/x/jorge.png", quote: "CPL recognized what I already knew." },
  { name: "Nadine M.", img: "https://staging2.map.rccd.edu/x/nadine.png", quote: "It opened the door to my bachelor's." },
];

// (a) renders exactly 4 from 6
{
  const dom = loadDom(STORIES);
  const cards = dom.window.document.querySelectorAll("#cpl-stories-grid .cpl-story-card");
  check("renders exactly 4 cards from 6", cards.length === 4);
  check("each card has a name + quote", Array.from(cards).every((c) =>
    c.querySelector(".cpl-story-name") && c.querySelector(".cpl-story-quote")));
  check("each rendered card has an https photo", Array.from(cards).every((c) => {
    const img = c.querySelector("img.cpl-story-photo"); return img && /^https:\/\//.test(img.getAttribute("src")); }));
}

// (b) the pathway line renders when present, and is optional
{
  const withPath = loadDom([{ name: "Brody", img: "https://h/b.png", pathway: "Firefighter → A.S. Fire Prevention", quote: "q" }]);
  check("pathway line renders when present",
    /Firefighter → A\.S\. Fire Prevention/.test(withPath.window.document.querySelector(".cpl-story-path").textContent));
  const noPath = loadDom([{ name: "X", img: "https://h/x.png", quote: "q" }]);
  check("pathway omitted when absent", !noPath.window.document.querySelector(".cpl-story-path"));
}

// (a') fewer than 4 → renders all available
{
  const dom = loadDom(STORIES.slice(0, 2));
  check("renders all when fewer than 4 exist", dom.window.document.querySelectorAll(".cpl-story-card").length === 2);
}

// (c) XSS payload is escaped
{
  const evil = [{ name: '<img src=x onerror="window.__x=1">', img: 'https://h/p.png',
    quote: '<script>window.__y=1<\/script> nice story' }];
  const dom = loadDom(evil);
  const w = dom.window;
  const grid = w.document.getElementById("cpl-stories-grid");
  // The payload's <img onerror> must NOT become a real element — only the 1 photo
  // img per card exists, and the handler never fired.
  check("name XSS inert (only the photo <img>, payload didn't execute)",
    grid.querySelectorAll("img").length === 1 && w.__x === undefined);
  check("quote <script> escaped (no <script> element, didn't execute)",
    grid.querySelectorAll("script").length === 0 && w.__y === undefined);
  check("escaped text still visible", /nice story/.test(grid.textContent));
}

// (d) non-https image dropped
{
  const dom = loadDom([{ name: "X", img: "http://insecure/p.png", quote: "q" },
    { name: "Y", img: "data:image/png;base64,AAAA", quote: "q" }]);
  const imgs = dom.window.document.querySelectorAll("#cpl-stories-grid img");
  check("non-https / data: images are dropped", imgs.length === 0);
  check("cards still render without a photo", dom.window.document.querySelectorAll(".cpl-story-card").length === 2);
}

// (e) empty data hides the block
{
  const dom = loadDom([]);
  const more = dom.window.document.querySelector(".cpl-stories-more");
  check("empty data hides the 'More stories' block", more && more.style.display === "none");
  check("the featured story (figure) still renders", !!dom.window.document.querySelector("#stories figure"));
}
{
  const dom = loadDom(undefined); // no window.CPL_STORIES at all
  const more = dom.window.document.querySelector(".cpl-stories-more");
  check("missing CPL_STORIES hides the block (no throw)", more && more.style.display === "none");
}

// ── report ──
let failed = 0;
results.forEach((r) => { console.log((r[1] ? "PASS " : "FAIL ") + r[0]); if (!r[1]) failed++; });
console.log("\n" + (failed ? failed + " FAILED" : "All " + results.length + " checks passed"));
process.exit(failed ? 1 : 0);
