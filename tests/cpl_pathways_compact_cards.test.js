// CPL Pathways: the compact course cards of a catalog record (Sam, 2026-11-27, iterated live: "OK, let's go with that").
//
// Guards, on Cerritos's Field Ironworkers A.S. (cerritos_42158):
//   (a) every card is one size and shows two rows: the code (a button) with units and, on a CPL-here course, the CPL
//       control; then the title. The card's other details wait in a hidden region.
//   (b) the CPL control is a button reading CPL, no border and no fill, with the MAP pointer (Sam's ruled glyph) filled
//       with the --map-crimson token, which both HTMLs define in light and dark; only CPL-here courses carry it.
//   (c) hover and focus show a tooltip naming each exhibit that gives CPL for the course, with its type.
//   (d) a click opens the bottom bar with a frame of the college's landing page on the course's valid codes, the
//       "CPL for this course" list beside it, and Close; a code holding "&" is dropped; no landing page means no frame
//       and a sentence saying so.
//   (e) the course code opens a sidebar beside the view, Close in its top row, with the cleaned COCI description, the
//       exhibits with CPL here, and Get credit on one exhibit; it resizes from the keyboard; Close puts the card's
//       details back.
// Run from repo root: `npm test` (or `node tests/cpl_pathways_compact_cards.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const DATA = fs.readFileSync("cpl_pathways_data.js", "utf8");
const ROEP = fs.readFileSync("cpl_pathways_roep_data.js", "utf8");
const SRC = fs.readFileSync("cpl_pathways.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const LANDING = "https://cpldashboardcccco.azurewebsites.net/www.cerritos.edu";
const CCN = "CCC000TEST50";
const tick = async () => { for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0)); };

async function render(landingRows) {
  const dom = new JSDOM(`<body><div id="cpl-pathways-root"></div></body>`, { runScripts: "outside-only" });
  const w = dom.window;
  const asked = [];
  w.fetch = (url) => {
    const u = decodeURIComponent(String(url));
    asked.push(u);
    let rows = [];
    if (/map_college_contacts_pub/.test(u)) rows = landingRows;
    else if (/coci_program_courses/.test(u) && /program_control_number=eq\.42158/.test(u)) rows = [{ course_code: "IWAP 40.50", course_control_number: CCN }];
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(rows) });
  };
  w.eval(DATA);
  w.eval(ROEP);
  w.eval(SRC);
  w.Element.prototype.scrollIntoView = function () {};
  // A description shard as COCI's export writes it: carriage returns and cp1252-read UTF-8.
  w.CPL_COCI_DESC = { I: { [CCN]: "This course acquaints the apprentice with the tradeÃ¢â‚¬â„¢s specifications._x000D_Ã‚Â It covers safety." } };
  const T = w.CPL_PATHWAYS_TAB;
  const root = w.document.getElementById("cpl-pathways-root");
  const rec = JSON.parse(JSON.stringify(w.CPL_PATHWAYS_ROEP.programs.find((p) => p.key === "cerritos_42158")));
  T._roepView.lay = "req"; T._roepView.who = "college";
  T._renderRoepProgram(root, rec);
  await tick();
  return { w, T, root, asked, rec };
}
const fire = (w, n, type) => n.dispatchEvent(new w.Event(type, { bubbles: type !== "mouseenter" && type !== "mouseleave" && type !== "focus" && type !== "blur" }));
const tileOf = (r, code) => r.root.querySelector('.cplpw-rmap .cplpw-rtile[data-code="' + code + '"]');

(async () => {
  const cer = [{ college: "Cerritos College", landing_page_url: LANDING }];
  const r = await render(cer);
  const { w, root, rec } = r;
  const courses = rec.display.courses;
  const tiles = [...root.querySelectorAll(".cplpw-rmap .cplpw-rtile")];

  // (a) one size, two rows
  check("(a) the program draws its cards", tiles.length === 24, tiles.length);
  check("(a) every card has the one card class, and the class sets one fixed height",
    tiles.every((t) => /^cplpw-rtile( here)?$/.test(t.className)) && /"\.cplpw-rtile \{ position:relative; box-sizing:border-box; height:5\.75rem;/.test(SRC));
  const shown = (t) => [...t.children].filter((n) => !n.hidden);
  check("(a) every card shows exactly two rows: code and units, then the title",
    tiles.every((t) => { const s = shown(t); return s.length === 2 && s[0].classList.contains("cplpw-rtop") && s[1].classList.contains("ttl"); }),
    tiles.map((t) => shown(t).map((n) => n.className).join("+")).find((x) => x !== "cplpw-rtop+ttl"));
  check("(a) row 1 never wraps and the title clamps to two lines",
    /\.cplpw-rtop \{[^}]*flex-wrap:nowrap[^}]*white-space:nowrap/.test(SRC) && /\.cplpw-rtile \.ttl \{[^}]*-webkit-line-clamp:2/.test(SRC));
  const t50 = tileOf(r, "IWAP 40.50");
  const code50 = t50.querySelector(".cplpw-rtop > button.cplpw-rcode");
  check("(a) the code is a button carrying the code and the units",
    code50 && code50.querySelector(".code").textContent === "IWAP 40.50" && /unit/.test(code50.querySelector(".u").textContent), code50 && code50.textContent);
  check("(a) no Details button, no CPL type line, no Get credit link and no count on a card",
    tiles.every((t) => shown(t).every((n) => !/Details|Get credit|Credit by exam|\d+ more/i.test(n.textContent))));

  // (b) the CPL control
  const here = Object.keys(courses).filter((k) => courses[k].here);
  check("(b) the CPL control is on every CPL-here course and only those",
    tiles.every((t) => !!t.querySelector(".cplpw-rcpl") === here.includes(t.getAttribute("data-code"))));
  const cpl = t50.querySelector(".cplpw-rcpl");
  check("(b) it is a button reading CPL, after the code in row 1",
    cpl && cpl.tagName === "BUTTON" && cpl.type === "button" && cpl.textContent === "CPL" && cpl.parentNode.lastElementChild === cpl);
  const cplRule = (SRC.match(/"\.cplpw-rcpl \{[^"]*"/) || [""])[0];
  check("(b) the button has no border, no fill and no underline; 16px regular weight, uppercase, a 24px target",
    /border:0/.test(cplRule) && /background:none/.test(cplRule) && /text-decoration:none/.test(cplRule) && !/border-bottom/.test(cplRule) &&
    /min-height:24px/.test(cplRule) && /font-size:16px/.test(cplRule) && /font-weight:400/.test(cplRule) && /text-transform:uppercase/.test(cplRule), cplRule);
  check("(b) the button carries the chip class", cpl.classList.contains("cplchip"));
  // The settled chip (Sam, 2026-11-27): "now give the cpl chip white background and get rid of the underline".
  const tileRule = (SRC.match(/"\.cplpw-rcpl \.ul \{[^"]*"/) || [""])[0];
  const hoverRule = (SRC.match(/"\.cplpw-rcpl:hover \.ul \{[^"]*"/) || [""])[0];
  check("(b) the word and the pointer sit on one white tile with no underline",
    /background: var\(--surface-opaque\)/.test(tileRule) && /box-shadow:0 0 0 1px var\(--border\)/.test(tileRule) &&
    /border-radius:5px/.test(tileRule) && /padding:3px 6px 3px 7px/.test(tileRule) && /align-items:baseline/.test(tileRule) &&
    /gap:0/.test(tileRule) && !/border-bottom/.test(tileRule) && !/border-bottom/.test(hoverRule) &&
    /box-shadow:0 0 0 1px var\(--seal-blue-text\)/.test(hoverRule) &&
    cpl.querySelector(".ul > .w") && cpl.querySelector(".ul > svg") && cpl.querySelector(".ul > .w").nextSibling === cpl.querySelector(".ul > svg"), tileRule);
  const svg = cpl.querySelector("svg");
  const path = svg && svg.querySelector("path");
  check("(b) the pointer is the MAP arrow turned 30 degrees in its path, aria-hidden, filled with the crimson token",
    svg && svg.getAttribute("viewBox") === "0 0 130 144" && svg.getAttribute("width") === "14" && svg.getAttribute("height") === "15" &&
    svg.getAttribute("aria-hidden") === "true" && path && path.getAttribute("d") === "M126.0 0.0 L129.9 143.2 L84.5 71.9 L0.0 68.2 Z" && path.getAttribute("fill") === "var(--map-crimson)");
  const ptrRule = (SRC.match(/"\.cplpw-mapptr \{[^"]*"/) || [""])[0];
  check("(b) no CSS rotate: the pointer rises a little above CPL, sits on its baseline and nearly touches the L",
    !/rotate\(/.test(ptrRule) && /height:0\.95em/.test(ptrRule) && /translateY\(0\.07em\)/.test(ptrRule) && /margin-left:-0\.15em/.test(ptrRule), ptrRule);
  // The pointer turns toward what the chip opened (Sam, 2026-11-27: "try it!" then "that's cool!").
  const ruleOf = (sel) => (SRC.match(new RegExp('"' + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ' \\{[^"]*"')) || [""])[0];
  check("(b) the open chip points down at the bar below and right at a sidebar; never bold; snaps under reduced motion",
    /transform-origin:65% 50%/.test(ruleOf(".cplpw-rcpl .cplpw-mapptr")) && /transition:transform 200ms ease-out/.test(ruleOf(".cplpw-rcpl .cplpw-mapptr")) &&
    /translate\(0\.1em, 0\.02em\) rotate\(150deg\)/.test(ruleOf('.cplpw-rcpl[aria-expanded=\\"true\\"] .cplpw-mapptr')) &&
    /translate\(0\.05em, 0\.04em\) rotate\(60deg\)/.test(ruleOf('.cplpw-rcpl[aria-expanded=\\"true\\"][data-opens=\\"side\\"] .cplpw-mapptr')) &&
    /font-weight:400/.test(ruleOf('.cplpw-rcpl[aria-expanded=\\"true\\"]')) &&
    /prefers-reduced-motion: reduce\) \{ \.cplpw-rcpl \.cplpw-mapptr \{ transition:none; \}/.test(SRC));
  check("(b) the CPL control opens the bottom bar, so it says so and starts closed",
    cpl.getAttribute("data-opens") === "below" && cpl.getAttribute("aria-expanded") === "false");
  check("(b) the code cites Sam's ruling so a sweep keeps the glyph", /the MAP directional pointer/.test(SRC) && /must not strip it/.test(SRC));
  check("(b) --map-crimson is #9E2A2B in light and a lighter crimson in both dark blocks, in both HTMLs",
    DASH === INDEX && (DASH.match(/--map-crimson: #9E2A2B;/g) || []).length === 1 && (DASH.match(/--map-crimson: #E07A7B;/g) || []).length === 2);
  check("(b) the control's name says what it does",
    cpl.getAttribute("aria-label") === "CPL: get credit for IWAP 40.50 at Cerritos College, in the bar below");
  const newCss = SRC.split("\n").filter((l) => /cplpw-(rcpl|rtip|rcode|cside|gbar|rhere|rgo|mapptr|rsplit|rmore)/.test(l) && /^\s*"/.test(l));
  check("(b) the new rules use tokens, never a raw hex", newCss.length > 20 && newCss.every((l) => !/#[0-9a-fA-F]{3,6}\b/.test(l)), newCss.find((l) => /#[0-9a-fA-F]{3,6}\b/.test(l)));

  // (c) the tooltip
  const tip = w.document.getElementById(cpl.getAttribute("aria-describedby"));
  check("(c) the tooltip is described-by and hidden at rest", tip && tip.getAttribute("role") === "tooltip" && tip.hidden && t50.contains(tip));
  fire(w, cpl, "mouseenter");
  const ex50 = courses["IWAP 40.50"].here.exhibits;
  const tipItems = tip ? [...tip.querySelectorAll("li")].map((li) => li.textContent) : [];
  check("(c) hover shows it, naming each exhibit with its type",
    !tip.hidden && tipItems.length === ex50.length && tipItems[0] === ex50[0].credential + " · Credit by exam", tipItems.join(" | "));
  fire(w, cpl, "mouseleave");
  check("(c) leaving hides it", tip.hidden);
  fire(w, cpl, "focus");
  check("(c) focus shows it too", !tip.hidden);
  fire(w, cpl, "blur");

  // (d) the bottom bar
  fire(w, cpl, "click");
  await tick();
  let bar = root.querySelector(".cplpw-gbar");
  const frame = bar && bar.querySelector("iframe");
  check("(d) the click opens the bottom bar, the last thing in the view", bar && bar.parentNode === root.querySelector(".cplpw-roep").lastElementChild);
  check("(d) the bar frames the landing page on the course's exhibit codes",
    frame && frame.getAttribute("src") === LANDING + "?Exhibit=" + ex50[0].exhibit && /landing|CPL page/i.test(frame.title), frame && frame.getAttribute("src"));
  check("(d) its top row says Get credit at the college, the course, and Close",
    bar && /^Get credit at Cerritos College$/.test(bar.querySelector(".cplpw-gbar-top h3").textContent) && /IWAP 40\.50/.test(bar.querySelector(".cplpw-gbar-top .what").textContent) &&
    bar.querySelector(".cplpw-gbar-top button.cplpw-gbar-close").textContent === "Close");
  check("(d) beside the frame, the CPL for this course", bar && /CPL for this course/.test(bar.querySelector(".list").textContent) &&
    bar.querySelectorAll(".list li").length === ex50.length);
  check("(d) the control says the bar is open", cpl.getAttribute("aria-expanded") === "true" && cpl.getAttribute("aria-controls") === bar.id);
  check("(d) the bar stays at the bottom of the window", /"\.cplpw-gbar \{ position:sticky; bottom:0;/.test(SRC));
  fire(w, bar.querySelector(".cplpw-gbar-close"), "click");
  check("(d) Close shuts it and hands focus back", !root.querySelector(".cplpw-gbar") && w.document.activeElement === cpl && cpl.getAttribute("aria-expanded") === "false");
  const amp = tileOf(r, "IWAP 41.09");
  const ampEx = courses["IWAP 41.09"].here.exhibits.map((e) => e.exhibit);
  fire(w, amp.querySelector(".cplpw-rcpl"), "click");
  await tick();
  bar = root.querySelector(".cplpw-gbar");
  check("(d) a code with & is dropped (IWAP 41.09's " + ampEx.join(", ") + ")",
    ampEx.some((x) => /&/.test(x)) && bar.querySelector("iframe") && !/&|%26/.test(bar.querySelector("iframe").getAttribute("src").slice(LANDING.length)), bar && bar.querySelector("iframe") && bar.querySelector("iframe").getAttribute("src"));
  const none = await render([{ college: "Cerritos College", landing_page_url: "" }]);
  fire(none.w, tileOf(none, "IWAP 40.50").querySelector(".cplpw-rcpl"), "click");
  await tick();
  const nbar = none.root.querySelector(".cplpw-gbar");
  check("(d) no landing page on file: no frame, and a sentence saying so",
    nbar && !nbar.querySelector("iframe") && !nbar.querySelector("a") && /Cerritos College has no MAP landing page on file/.test(nbar.textContent));

  // (e) the sidebar
  fire(w, code50, "click");
  await tick();
  const split = root.querySelector(".cplpw-rsplit");
  const side = root.querySelector("aside.cplpw-cside");
  check("(e) the code opens the sidebar beside the view, after it in one row",
    side && side.parentNode === split && split.firstElementChild.classList.contains("cplpw-rmain") && split.lastElementChild === side);
  check("(e) the code says the sidebar is open", code50.getAttribute("aria-expanded") === "true" && code50.getAttribute("aria-controls") === side.id);
  const head = side.querySelector(".cplpw-cside-head");
  check("(e) the top row holds the code, its units and Close, above the scrolling body",
    head && side.children[1] === head && head.querySelector("h3").textContent === "IWAP 40.50" && head.querySelector("button.cplpw-cside-close").textContent === "Close" &&
    /\.cplpw-cside-body \{[^}]*overflow-y:auto/.test(SRC));
  check("(e) it shows the title and the requirement group", side.querySelector(".ttl").textContent === courses["IWAP 40.50"].title &&
    side.querySelector(".grp").textContent === rec.record.blocks.find((b) => b.courses.some((c) => c.code === "IWAP 40.50")).name + ", all of these",
    side.querySelector(".grp") && side.querySelector(".grp").textContent);
  const desc = side.querySelector(".desc .dtext");
  check("(e) the catalog description comes from the program's COCI course list and the subject's shard",
    r.asked.some((u) => /coci_program_courses\?select=course_code,course_control_number&college=eq\.Cerritos College&program_control_number=eq\.42158/.test(u)));
  check("(e) the description shows cleaned: no _x000D_, no mojibake",
    desc && desc.textContent === "This course acquaints the apprentice with the trade’s specifications. It covers safety.", desc && desc.textContent);
  const hereSec = side.querySelector(".cplpw-rhere");
  check("(e) Exhibits with CPL here lists each exhibit with title, type and code",
    hereSec && /^Exhibits with CPL here \(1\)$/.test(hereSec.querySelector("h4").textContent) &&
    hereSec.querySelector(".t").textContent === ex50[0].credential && new RegExp("Credit by exam · MAP exhibit " + ex50[0].exhibit).test(hereSec.querySelector(".k").textContent));
  check("(e) the card's details moved in, and the card holds none while open", !t50.querySelector(".cplpw-rmore") && side.querySelector(".cplpw-rmore"));
  const go = hereSec.querySelector("button.cplpw-rgo");
  fire(w, go, "click");
  await tick();
  bar = root.querySelector(".cplpw-gbar");
  check("(e) Get credit on this exhibit opens the bar on that one exhibit",
    go.textContent === "Get credit on this exhibit" && bar && bar.querySelector("iframe").getAttribute("src") === LANDING + "?Exhibit=" + ex50[0].exhibit);
  const grip = side.querySelector(".cplpw-cside-grip");
  const w0 = Number(grip.getAttribute("aria-valuenow"));
  grip.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
  check("(e) the grip widens the sidebar from the keyboard", grip.getAttribute("role") === "separator" && Number(grip.getAttribute("aria-valuenow")) === w0 + 40 &&
    split.style.getPropertyValue("--cplpw-side-w") === (w0 + 40) + "px");
  check("(e) a resize leaves 360px of the view, and below 900px the sidebar covers it",
    /"\.cplpw-cside \{[^"]*max-width:calc\(100% - 376px\)/.test(SRC) && /@media \(max-width: 899px\) \{ \.cplpw-cside \{ position:fixed;/.test(SRC));
  const adoptCode = Object.keys(courses).find((k) => courses[k].adopt);
  fire(w, side.querySelector(".cplpw-cside-close"), "click");
  check("(e) Close shuts the sidebar and puts the details back on the card",
    !root.querySelector(".cplpw-cside") && t50.querySelector(".cplpw-rmore") && t50.querySelector(".cplpw-rmore").hidden && code50.getAttribute("aria-expanded") === "false");
  const ta = tileOf(r, adoptCode);
  fire(w, ta.querySelector(".cplpw-rcode"), "click");
  await tick();
  check("(e) a course another college gives CPL for shows its Could adopt note in the sidebar",
    /Could adopt/.test(root.querySelector(".cplpw-cside").textContent), adoptCode);
  check("(e) a course with no COCI control number says so", /No COCI description is on file for /.test(root.querySelector(".cplpw-cside .dtext").textContent),
    root.querySelector(".cplpw-cside .dtext").textContent);
  root.querySelector(".cplpw-cside").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  check("(e) Escape shuts it", !root.querySelector(".cplpw-cside"));

  // mobile and motion
  check("(f) cards go single column under 560px, and motion respects the reader's setting",
    /@media \(max-width: 560px\) \{ \.cplpw-rtiles \{ grid-template-columns:1fr; \}/.test(SRC) && /prefers-reduced-motion: no-preference\) \{ \.cplpw-rtile/.test(SRC));
  check("(f) the stack of programs stays above the requirements", root.querySelector(".cplpw-rstack") &&
    root.querySelector(".cplpw-rstack").compareDocumentPosition(root.querySelector(".cplpw-rsplit")) & w.Node.DOCUMENT_POSITION_FOLLOWING);

  let failed = 0;
  for (const [name, ok, why] of results) {
    if (!ok) { failed++; console.log("FAIL " + name + (why !== undefined ? "  [" + (typeof why === "string" ? why : JSON.stringify(why)) + "]" : "")); }
  }
  console.log((results.length - failed) + "/" + results.length + " checks passed: CPL Pathways compact cards");
  if (failed) process.exit(1);
})();
