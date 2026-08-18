// COBI masthead (cobi_brand.js + quickstart.js slot) — the consolidated header.
//
// Guards: (a) Rule 4 (both HTMLs identical) + the script tag + the masthead
// markup (seal, COBI wordmark, "…Business Intelligence" tagline with NO
// "for CPL", the ℹ About popover holding the generator-injected Project
// Description / Attachments + the static Today's painting link, the center
// search slot, the "Manually Refresh COBI" button, and the alpha-testing
// notice); (b) the gold CPL
// superscript injects at runtime; (c) the About popover toggles; (d) the
// painting link calls First Light; (e) quickstart mounts "Where To?" into the
// center slot.
//
// Run from repo root: `npm test` (or `node tests/cobi_brand.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ── Part A — static invariants on the shipped HTML ──
const cpl = fs.readFileSync("CPL_Dashboard.html", "utf8");
const idx = fs.readFileSync("index.html", "utf8");
check("Rule 4: CPL_Dashboard.html === index.html", cpl === idx);
const tag = '<script src="cobi_brand.js"></script>';
check("cobi_brand.js script tag present exactly once", cpl.split(tag).length === 2);
check("masthead wordmark is COBI", /<h1>COBI<\/h1>/.test(cpl));
check("tagline present without 'for CPL' suffix",
  /class="cobi-tagline">Chancellor(&#39;|')s Office Business Intelligence<\/div>/.test(cpl));
check("the Mamba/8→24 wink is retired (no rotating subtitle text)",
  !/Mamba Mentality/.test(cpl) && !/Black Mambanator/.test(cpl));
check("hidden #cobi-mamba anchor kept for the generator PROJ-INFO inject", /id="cobi-mamba"/.test(cpl));
check("seal img present (graceful onerror-hide)",
  /class="cobi-seal"[^>]*src="cccco_seal\.png"[^>]*onerror=/.test(cpl));
check("brand uses --seal-blue token", /--seal-blue:/.test(cpl));
check("center search slot present", /id="cobiQsSlot"/.test(cpl));
check("ℹ About button + panel present", /id="cobiAboutBtn"/.test(cpl) && /id="cobiAboutPanel"/.test(cpl));
check("Today's painting link present in About", /id="cobiPaintingLink"/.test(cpl));
// The generator fills the PROJ-INFO markers (Project Description / Attachments /
// Cheat Sheet) on each run — code-only, the empty markers must sit INSIDE the
// About panel, before the painting link, so the inject lands there.
check("PROJ-INFO markers sit inside the About panel (before the painting link)",
  cpl.indexOf("cobiAboutPanel") < cpl.indexOf("<!-- PROJ-INFO-START -->") &&
  cpl.indexOf("<!-- PROJ-INFO-START -->") < cpl.indexOf("cobi-about-links"));
check("nav label is COBI", /data-tab="dashboard">COBI<\/a>/.test(cpl));

// ── Generator (source-of-truth) — the Refresh button is injected each run ──
const gen = fs.readFileSync("excel_to_dashboard.py", "utf8");
check("generator emits the 'Manually Refresh COBI' button as a subtle cobi-util-link",
  /Manually Refresh COBI<\/button>/.test(gen) && /id="refreshBtn" class="cobi-util-link"/.test(gen));
check("generator no longer emits 'Refresh Today's Data'", !/Refresh Today&#39;s Data/.test(gen));
check("generator strips the refresh button by id (regen-safe, idempotent)",
  gen.includes('<button id="refreshBtn".*?</button>'));

// The masthead structure used to boot the JS (mirrors the static template).
const MAST =
  '<div class="header">' +
  '<div class="cobi-brand"><img class="cobi-seal" src="cccco_seal.png" onerror="this.style.display=\'none\'">' +
  '<div class="cobi-brandtext"><h1>COBI</h1>' +
  '<div class="cobi-tagline">Chancellor&#39;s Office Business Intelligence</div></div></div>' +
  '<div class="cobi-qs-slot" id="cobiQsSlot"></div>' +
  '<div class="cobi-utility"><span class="cobi-about">' +
  '<button type="button" id="cobiAboutBtn" aria-expanded="false">About</button>' +
  '<div class="cobi-about-panel" id="cobiAboutPanel">' +
  '<div class="subtitle" id="cobi-mamba" style="display:none"></div>' +
  '<details class="project-description"><summary>Project Description</summary></details>' +
  '<div class="cobi-about-links"><button class="cobi-about-link" id="cobiPaintingLink">Today’s painting</button></div>' +
  '</div></span>' +
  '<div class="last-updated">Last Updated: today</div></div></div>';

const BRAND_SRC = fs.readFileSync("cobi_brand.js", "utf8");
const QS_SRC = fs.readFileSync("quickstart.js", "utf8");

function dom() {
  return new JSDOM("<!doctype html><html><head></head><body>" + MAST + "</body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
}

// (b) gold CPL superscript injected at runtime
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const num = d.window.document.querySelector(".header h1 .cobi-num");
  check("CPL superscript injected onto the wordmark", !!num && num.textContent === "CPL");
  check("#cobi-mamba stays empty (no phrase)", d.window.document.getElementById("cobi-mamba").textContent === "");
  // idempotent — a second init doesn't double the superscript
  d.window.COBI_BRAND.init();
  check("superscript not duplicated on re-init",
    d.window.document.querySelectorAll(".header h1 .cobi-num").length === 1);
}

// (c) About popover toggles open/closed
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const btn = d.window.document.getElementById("cobiAboutBtn");
  const panel = d.window.document.getElementById("cobiAboutPanel");
  check("About panel starts closed", !panel.classList.contains("open"));
  btn.dispatchEvent(new d.window.MouseEvent("click", { bubbles: true }));
  check("About panel opens on click", panel.classList.contains("open"));
  check("aria-expanded reflects open", btn.getAttribute("aria-expanded") === "true");
}

// (d) painting link calls First Light
{
  const d = dom();
  let opened = 0;
  d.window.CPL_FIRST_LIGHT = { open: function () { opened++; } };
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  d.window.document.getElementById("cobiPaintingLink")
    .dispatchEvent(new d.window.MouseEvent("click", { bubbles: true }));
  check("Today's painting link opens First Light", opened === 1);
}

// (e) quickstart mounts "Where To?" into the center slot
{
  const d = dom();
  d.window.eval(QS_SRC);
  // jsdom sits at readyState "loading", so quickstart registered its mount on
  // DOMContentLoaded — fire it (as a real page load would).
  d.window.document.dispatchEvent(new d.window.Event("DOMContentLoaded"));
  const slot = d.window.document.getElementById("cobiQsSlot");
  const chat = slot.querySelector("#qs-chat");
  check("quickstart widget mounted inside #cobiQsSlot", !!chat);
  const label = chat && chat.querySelector(".qs-label");
  check("label reads 'Where To?'", !!label && /Where To\?/.test(label.textContent));
  check("label + input share one row (.qs-row)",
    !!(chat && chat.querySelector(".qs-row .qs-label") && chat.querySelector(".qs-row .qs-input")));
}

// (f) About popover z-index fix — the header gets a stacking context above the
// page content so the absolutely-positioned About panel isn't trapped behind
// the KPI cards (backdrop-filter on .header makes its own context).
check("cobi_brand.js source lifts .header (position:relative; z-index:150)",
  BRAND_SRC.includes("position:relative;z-index:150"));
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const headCss = Array.from(d.window.document.querySelectorAll("head style"))
    .map(s => s.textContent).join("");
  check("injected CSS sets .header z-index:150 (above content)",
    /\.header\{[^}]*z-index:150/.test(headCss));
  check("injected CSS keeps the About panel z-index high (300)",
    /\.cobi-about-panel\{[^}]*z-index:300/.test(headCss));
}

// (g) Alpha-testing notice — COBI is not finished, and the masthead must say
// so on every tab. Guards the failure mode that matters: the notice quietly
// disappearing (a regen resetting the <h1>, an init running twice and only the
// second one landing, or the notice never reaching the header at all).
check("generator stamps (Alpha) into <title>/og:title (travels with a pasted link)",
  /COBI_TITLE = "COBI [^"]*\(Alpha\)/.test(gen));
check("shipped HTML <title> carries (Alpha)", /<title>[^<]*\(Alpha\)[^<]*<\/title>/.test(cpl));
check("shipped HTML og:title carries (Alpha)", /og:title" content="[^"]*\(Alpha\)/.test(cpl));
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const doc = d.window.document;
  const chip = doc.querySelector(".header h1 .cobi-alpha");
  check("ALPHA chip injected onto the wordmark", !!chip && /alpha/i.test(chip.textContent));
  const note = doc.querySelector(".header .cobi-alpha-note");
  check("alpha notice row injected into the header", !!note);
  const txt = note ? note.textContent : "";
  check("notice names COBI as experimental and in Alpha development",
    /COBI is an experimental data suite in Alpha development phase/i.test(txt));
  check("notice warns the figures may be wrong", /incomplete or wrong/i.test(txt));
  check("notice says not to cite or share outside the team",
    /cite or share/i.test(txt) && /outside the team/i.test(txt));
  // idempotent — the daily regen + a second init must not stack two notices
  d.window.COBI_BRAND.init();
  d.window.COBI_BRAND.addAlphaNotice();
  check("chip not duplicated on re-init", doc.querySelectorAll(".cobi-alpha").length === 1);
  check("notice not duplicated on re-init", doc.querySelectorAll(".cobi-alpha-note").length === 1);
  // the chip rides the <h1>, which the generator rewrites daily — re-running
  // the injector after a regen must put it back (same contract as .cobi-num)
  doc.querySelector(".header h1").innerHTML = "COBI";
  d.window.COBI_BRAND.addAlphaNotice();
  check("chip is restored after the daily <h1> regen",
    !!doc.querySelector(".header h1 .cobi-alpha"));
  const headCss = Array.from(doc.querySelectorAll("head style")).map(s => s.textContent).join("");
  check("notice spans the whole header row (grid-column 1 / -1)",
    /\.cobi-alpha-note\{[^}]*grid-column:1 \/ -1/.test(headCss));
  // Sam, 2026-08-18: centered, italic, a step larger than the tagline (.8rem).
  check("notice is centered", /\.cobi-alpha-note\{[^}]*text-align:center/.test(headCss));
  check("notice is italic", /\.cobi-alpha-note\{[^}]*font-style:italic/.test(headCss));
  {
    const m = /\.cobi-alpha-note\{[^}]*font-size:([\d.]+)rem/.exec(headCss);
    check("notice font-size is larger than the tagline's .8rem",
      !!m && parseFloat(m[1]) > 0.8);
  }
  check("notice/chip use brand tokens, not raw hex",
    /\.cobi-alpha-note\{[^}]*var\(--mustard-text/.test(headCss) &&
    /\.cobi-alpha\{[^}]*var\(--mustard-fill/.test(headCss));
}

let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
