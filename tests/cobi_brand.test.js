// COBI masthead (cobi_brand.js + quickstart.js slot) — the consolidated header.
//
// Guards: (a) Rule 4 (both HTMLs identical) + the script tag + the masthead
// markup (seal, bare COBI wordmark, the ℹ About popover holding the
// generator-injected Project Description / Attachments + the static Today's
// painting link, the center search slot, and the alpha-testing notice);
// (b) the wordmark stays BARE — no tagline, no CPL superscript, no org tag
// (Sam, 2026-09-04); (c) the About popover toggles; (d) the painting link
// calls First Light; (e) quickstart mounts "Where To?" into the center slot;
// (f) "Manually Refresh COBI" is MOVED into the About panel at runtime;
// (g) every masthead grid track can shrink, which is what stopped the
// clusters overlapping under zoom.
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
// Sam, 2026-09-04: "Delete 'Chancellor's Office Business Intelligence' label".
// Asserted on BOTH the visible masthead and the <title>/og:title, because the
// same string rode along in the link unfurl.
check("tagline is gone from the masthead", !/cobi-tagline/.test(cpl));
check("tagline is gone from the title + og:title", !/Business Intelligence/.test(cpl));
check("<title> is the bare COBI (Alpha)", /<title>COBI \(Alpha\)<\/title>/.test(cpl));
check("og:title matches the <title>",
  /<meta property="og:title" content="COBI \(Alpha\)">/.test(cpl));
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
// The generator is the source of truth for <title>/og:title (Rule 1), so the
// removal has to hold THERE or the next cron run puts the tagline back.
check("generator's COBI_TITLE is the bare COBI (Alpha)",
  /COBI_TITLE = "COBI \(Alpha\)"/.test(gen));
check("generator no longer emits the tagline or the CPL superscript in the title",
  !/COBI_TITLE = .*Business Intelligence/.test(gen) && !/COBI_TITLE = .*\u1d9c\u1d3e\u1d38/.test(gen));
check("generator strips the refresh button by id (regen-safe, idempotent)",
  gen.includes('<button id="refreshBtn".*?</button>'));

// The masthead structure used to boot the JS (mirrors the static template).
const MAST =
  '<div class="header">' +
  '<div class="cobi-brand"><img class="cobi-seal" src="cccco_seal.png" onerror="this.style.display=\'none\'">' +
  '<div class="cobi-brandtext"><h1>COBI</h1></div></div>' +
  '<div class="cobi-qs-slot" id="cobiQsSlot"></div>' +
  '<div class="cobi-utility"><span class="cobi-about">' +
  '<button type="button" id="cobiAboutBtn" aria-expanded="false">About</button>' +
  '<div class="cobi-about-panel" id="cobiAboutPanel">' +
  '<div class="subtitle" id="cobi-mamba" style="display:none"></div>' +
  '<details class="project-description"><summary>Project Description</summary></details>' +
  '<div class="cobi-about-links"><button class="cobi-about-link" id="cobiPaintingLink">Today’s painting</button></div>' +
  '</div></span>' +
  '<div class="last-updated">Last Updated: today</div>' +
  '<button id="refreshBtn" class="cobi-util-link">&#x21bb; Manually Refresh COBI</button>' +
  '</div></div>';

const BRAND_SRC = fs.readFileSync("cobi_brand.js", "utf8");
const QS_SRC = fs.readFileSync("quickstart.js", "utf8");

function dom() {
  return new JSDOM("<!doctype html><html><head></head><body>" + MAST + "</body></html>",
    { runScripts: "outside-only", url: "https://example.org/" });
}

// (b) the wordmark stays BARE — no superscript, no org tag
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const h1 = d.window.document.querySelector(".header h1");
  check("wordmark carries no .cobi-num tag", !h1.querySelector(".cobi-num"));
  check("wordmark text is COBI plus the Alpha chip only",
    /^COBI\s*Alpha$/.test((h1.textContent || "").trim()));
  check("#cobi-mamba stays empty (no phrase)", d.window.document.getElementById("cobi-mamba").textContent === "");

  // ⭐ THE REGRESSION THAT MATTERS. cobi_orgs.js wrote the same .cobi-num span,
  // so a CACHED copy of it can put the tag back after this module has run.
  // dropWordmarkTags() must SWEEP, not merely decline to add.
  const stray = d.window.document.createElement("span");
  stray.className = "cobi-num";
  stray.textContent = "C&I";
  h1.appendChild(stray);
  d.window.COBI_BRAND.dropWordmarkTags();
  check("a stray org tag from a cached cobi_orgs.js is swept off the wordmark",
    !h1.querySelector(".cobi-num"));
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
  check("notice says COBI is in alpha", /alpha/i.test(txt));
  check("notice warns the figures may be wrong", /incomplete or wrong/i.test(txt));
  // ⭐ THE CORRECTION. Until 2026-09-04 this line told readers not to cite or
  // share COBI's figures outside the team — which Sam flagged as FALSE: they
  // are shared outward by design, through Sierra and the CPL Fact Sheet. A
  // banner that forbids what the product does every day trains readers to stop
  // reading the banner, so the caution is now about VERIFYING, not withholding.
  check("notice asks the reader to verify, not to withhold",
    /double-check/i.test(txt) && /revise/i.test(txt));
  check("⭐ notice no longer forbids citing or sharing outside the team",
    !/cite or share/i.test(txt) && !/outside the team/i.test(txt));
  // Sam's second ask: say what COBI answers FROM, and that it is governed.
  check("notice names the curated knowledge base it answers from",
    /curated knowledge base/i.test(txt));
  check("notice states the two governing rules (no PII in, no outside sources)",
    /no personal information/i.test(txt) && /no outside data sources/i.test(txt));
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
  check("notice is centered", /\.cobi-alpha-note\{[^}]*text-align:center/.test(headCss));
  // ⭐ LOW-KEY (Sam, 2026-09-04: "remove the formatting around the text and
  // shrink the font and make it unbold so it's just a low-key part of the
  // header"). This REVERSES his 2026-08-18 treatment — bordered, italic, bold,
  // gold, a step larger — and the reversal is asserted rather than merely
  // applied, because a later pass reading the old note in git would otherwise
  // "restore" it.
  const noteCss = /\.cobi-alpha-note\{([^}]*)\}/.exec(headCss);
  check("notice CSS is declared", !!noteCss);
  check("notice has no rule above it any more", !!noteCss && !/border-top/.test(noteCss[1]));
  check("notice is not italic", !!noteCss && !/font-style:italic/.test(noteCss[1]));
  check("notice is not bold", !!noteCss && /font-weight:400/.test(noteCss[1]));
  {
    const m = noteCss && /font-size:([\d.]+)rem/.exec(noteCss[1]);
    check("notice font-size is SMALLER than .8rem now", !!m && parseFloat(m[1]) < 0.8,
      m ? m[1] + "rem" : "no font-size");
  }
  // ⚠️ --text-muted, never --text-faint: the token table marks faint
  // "decorative only — never essential text", and an accuracy caution the
  // reader is meant to act on is essential however quiet it looks. Measured on
  // the rendered page at 6.58:1 (glass composited) against the 4.5:1 floor.
  check("notice uses the muted TEXT token, not the decorative-only faint one",
    !!noteCss && /var\(--text-muted/.test(noteCss[1]) && !/var\(--text-faint/.test(noteCss[1]));
  check("notice/chip use brand tokens, not raw hex",
    /\.cobi-alpha\{[^}]*var\(--mustard-fill/.test(headCss));
}

// (f) ⭐ "Manually Refresh COBI" is MOVED into the About panel (Sam, 2026-09-04).
// A MOVE, not a re-home in the markup: excel_to_dashboard.py re-injects this
// button after .last-updated on every daily run, so an HTML edit would be undone
// by the next cron while a runtime move survives it.
{
  const d = dom();
  const doc = d.window.document;
  check("fixture starts with Refresh in the utility strip, where the generator puts it",
    !!doc.querySelector(".cobi-utility > #refreshBtn"));
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const btn = doc.getElementById("refreshBtn");
  check("Refresh still exists after the move (moved, never dropped)", !!btn);
  check("Refresh now sits inside the About panel", !!btn && !!btn.closest("#cobiAboutPanel"));
  check("Refresh is no longer a direct child of the utility strip",
    !doc.querySelector(".cobi-utility > #refreshBtn"));
  check("exactly one Refresh button exists (moved, not copied)",
    doc.querySelectorAll("#refreshBtn").length === 1);

  // Idempotent: the daily regen re-runs init, and a second pass must not throw
  // or re-parent anything.
  d.window.COBI_BRAND.relocateRefresh();
  check("relocation is idempotent", doc.querySelectorAll("#refreshBtn").length === 1 &&
    !!doc.getElementById("refreshBtn").closest("#cobiAboutPanel"));
}

// (g) ⭐ THE ZOOM BUG. Sam, 2026-09-04: "the header is all a mess when I zoom in
// or out, it gets messed up and ugly" — the site switcher and the lock were
// painting over the "Where To?" box.
//
// The cause is not decoration: a bare `1fr` is minmax(AUTO,1fr), so the track
// refuses to shrink below its content, and a row of nowrap clusters OVERFLOWS
// instead of wrapping. Zoom changes the CSS-pixel width, which is why it showed
// up there first. Assert the shrinkable form directly — a future edit that
// re-introduces a bare 1fr brings the overlap back with it.
{
  const d = dom();
  d.window.eval(BRAND_SRC);
  d.window.COBI_BRAND.init();
  const css = Array.from(d.window.document.querySelectorAll("head style"))
    .map(x => x.textContent).join("");
  const headerRule = /\.header\{([^}]*)\}/.exec(css);
  check("masthead declares its grid tracks", !!headerRule);
  check("the flexible track is minmax(0,1fr), never a bare 1fr",
    !!headerRule && /grid-template-columns:auto minmax\(0,1fr\) auto/.test(headerRule[1]));
  check("no bare `1fr` track survives anywhere in the masthead CSS",
    !/grid-template-columns:[^;}]*(^|[ :])1fr/.test(css.replace(/minmax\(0,1fr\)/g, "OK")));
  // Each nowrap cluster must be allowed to shrink, or it pushes the row wide
  // however elastic the middle track is.
  for (const sel of ["cobi-brand", "cobi-qs-slot", "cobi-utility"]) {
    const m = new RegExp("\\." + sel + "\\{([^}]*)\\}").exec(css);
    check(sel + " can shrink (min-width:0)", !!m && /min-width:0/.test(m[1]));
  }
  check("the search slot is capped, not fixed-width (so it follows its track down)",
    /\.cobi-qs-slot\{[^}]*max-width:360px/.test(css) &&
    !/\.cobi-qs-slot\{[^}]*width:min\(/.test(css));
  // Presentation rule: single column below ~560px.
  check("a single-column mobile breakpoint exists",
    /@media \(max-width:560px\)/.test(css));
}


let failed = 0;
for (const [name, ok] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) failed++;
}
console.log(failed === 0 ? `All ${results.length} checks passed.` : `${failed} of ${results.length} checks FAILED.`);
process.exit(failed === 0 ? 0 : 1);
