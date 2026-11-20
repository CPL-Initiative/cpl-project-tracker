/* ===========================================================================
   scripts/library_check.config.js — the a11y config the Library's check run hands the engine
   ---------------------------------------------------------------------------
   #3560 part 2 (S688; Sam's go of Nov 19, 2026, via COBIx: "Nothing gets Publish it or List publicly until its
   accessibility checks pass"). scripts/library_check.py names the pages to check in LIBRARY_CHECK_PAGES (Library
   slugs, comma-separated) and runs

       node scripts/a11y.js --config scripts/library_check.config.js --json OUT

   so the check is the one engine `npm run a11y` runs (geometry, paint and axe-core's WCAG 2.0/2.1/2.2 A and AA rules),
   never a second one. Each page is measured twice, Light at every width and Dark at two, the way a11y.config.js
   measures the Library pages it names; a piece passes only when both pass. The cross-origin sheet note is the main
   config's own, read from it so the two never disagree.
   =========================================================================== */
const MAIN = require("../a11y.config.js");

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugs = String(process.env.LIBRARY_CHECK_PAGES || "").split(",").map((s) => s.trim()).filter(Boolean);
const targets = {};
slugs.forEach((slug) => {
  if (!SLUG.test(slug)) throw new Error(`library_check.config.js: ${slug} is not a Library slug`);
  const file = `library/${slug}/index.html`;
  targets[slug] = { file, title: `Library page ${slug} (the check run, Light)` };
  targets[`${slug}-dark`] = { file, title: `Library page ${slug} (the check run, Dark)`, widths: [390, 1280],
    seed: (page) => page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")) };
});

module.exports = { root: "..", widths: MAIN.widths, crossOriginSheets: MAIN.crossOriginSheets || [], targets };
