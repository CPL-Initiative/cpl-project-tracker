// The Ask Sierra chip and side bar (sierra/sidebar.js).
//
// Sam, 2026-10-24: "Can you add an Ask Sierra chat chip that opens a Sierra side bar if
// clicked?" At the start of S469 he picked the public library first, the script one any
// page can load, and the chip in the bottom-right corner. These checks guard what can go
// wrong:
//   (1) the chip is one word-labelled button in the corner, and Sierra does not load with
//       the page;
//   (2) the chip opens a dialog named Ask Sierra that frames sierra/ from beside the
//       script, from whatever depth a page loads it, and focus lands in her question box;
//   (3) a narrow window gives her the screen as a modal: the page behind is inert, and
//       Close hands everything back, focus to the chip, an inert the page set left alone;
//   (4) a wide window keeps the page in use beside her, and a resize while open moves
//       between the two;
//   (5) Escape in her frame closes the bar, unless her About panel is open;
//   (6) a reopen finds the same frame, the conversation unreloaded;
//   (7) she takes the host's theme in ?theme= (the device's, when the host has none) and
//       follows a change of it, and her page lets ?theme= beat a stored choice and opens
//       Light with none (Sam, Open Asks Sheet 126 card 2);
//   (8) the library loads it, maps every token it reads, keeps two columns of cards
//       beside it, and leaves room in the foot for the chip;
//   (9) a second copy of the script does nothing;
//  (10) setChip(false) hides the chip and shuts an open bar, and the chip's scroll room goes with it;
//  (11) COBI's Library tab (library.js) loads the bar on its first visit, shows the chip on that tab alone,
//       and maps every token onto First Light (Sam, 2026-10-24: "Library and more importantly on the public
//       library site").
//  (13) a page that names its own Ask Sierra word (the Fact Sheet's and the funding page's action rows) opens her
//       from it, with no chip, and gets focus back on Close; the two pages load the bar in place of their drawer
//       (Sam, Open Asks Sheet 126 card 1, "public"), name her surface and map her tokens;
//  (12) beside the page, the reader sets the bar's width (Sam, 2026-10-24: "Make the sidebar resizable
//       horizontally"): a separator on its left edge that drags and takes the arrow keys, Home and End; the
//       words Narrower and Wider for anyone who cannot drag; the width held so the page keeps 600px, and
//       remembered for this reader.
// Run from repo root: `npm test` (or `node tests/sierra_sidebar.test.js`).
const fs = require("fs");
const { JSDOM, requestInterceptor } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const BAR = fs.readFileSync("sierra/sidebar.js", "utf8");
const SIERRA = fs.readFileSync("sierra/index.html", "utf8");
const LIBRARY = fs.readFileSync("library/index.html", "utf8");
const LIB_TAB = fs.readFileSync("library.js", "utf8");
// Sierra's own head script (the theme), so (7) runs the shipped words, not a copy of them.
const HEAD_SCRIPT = (SIERRA.match(/<script>(\(function\(\)\{var t=null;[\s\S]*?)<\/script>/) || [])[1] || "";
// A stand-in for her page: the theme script she ships, an About panel and the question box.
const STUB = '<!doctype html><html><head><script>' + HEAD_SCRIPT + '</script></head><body>' +
  '<button id="s-about-btn" type="button">About Sierra</button><div id="s-about" hidden><p>About</p></div>' +
  '<textarea id="s-input"></textarea></body></html>';
const BASE = "https://example.org/cpl/";

function until(test, ms) {
  const end = Date.now() + (ms || 2000);
  return new Promise(function (resolve) {
    (function poll() {
      let ok = false;
      try { ok = !!test(); } catch (e) { ok = false; }
      if (ok || Date.now() > end) return resolve(ok);
      setTimeout(poll, 10);
    })();
  });
}

// A host page at /cpl/library/ that loads ../sierra/sidebar.js, with a matchMedia whose
// WIDE answer the test sets, and a count of every load of Sierra's page.
function host(opts) {
  opts = opts || {};
  const state = { wide: !!opts.wide, listeners: [], sierraLoads: [], iw: opts.innerWidth || 0 };
  const theme = opts.theme === undefined ? ' data-theme="light"' : (opts.theme ? ' data-theme="' + opts.theme + '"' : "");
  const html = '<!doctype html><html lang="en"' + theme + '><head></head><body>' +
    '<header id="h"><a href="#x">Home</a>' + (opts.launcher ? '<button type="button" id="word" data-sierra-open>Ask Sierra</button>' : '') +
    '</header><main id="m"><button id="b">A page control</button></main>' +
    '<div id="pre" inert>Set inert by the page</div>' +
    '<script src="' + (opts.src || "../sierra/sidebar.js") + '" defer></script>' + (opts.twice ? '<script src="../sierra/sidebar.js" defer></script>' : "") +
    '</body></html>';
  const dom = new JSDOM(html, {
    url: BASE + (opts.path === undefined ? "library/" : opts.path), runScripts: "dangerously", pretendToBeVisual: true,
    resources: { interceptors: [requestInterceptor(function (request) {
      const u = request.url;
      if (u === BASE + "sierra/sidebar.js") return new Response(BAR, { headers: { "Content-Type": "application/javascript" } });
      if (u.indexOf(BASE + "sierra/") === 0) {
        state.sierraLoads.push(u);
        return new Response(STUB, { headers: { "Content-Type": "text/html" } });
      }
      return new Response("", { status: 404 });
    })] },
    beforeParse: function (w) {
      w.matchMedia = function (q) {
        return { get matches() { return /min-width: 1200px/.test(q) ? state.wide : /prefers-color-scheme: dark/.test(q) ? !!opts.darkDevice : false; }, media: q,
          addEventListener: function (t, f) { state.listeners.push(f); }, removeEventListener: function () {},
          addListener: function (f) { state.listeners.push(f); }, removeListener: function () {} };
      };
      if (opts.stored) w.localStorage.setItem("cpl_theme", opts.stored);
      if (opts.storedW !== undefined) w.localStorage.setItem("cpl_sierra_bar_w", opts.storedW);
      if (opts.innerWidth) Object.defineProperty(w, "innerWidth", { configurable: true, get: function () { return state.iw; } });
    }
  });
  const w = dom.window;
  state.w = w; state.d = w.document;
  state.resize = function (wide) { state.wide = wide; state.listeners.forEach(function (f) { f({ matches: wide }); }); };
  state.chip = function () { return w.document.getElementById("sbar-chip"); };
  state.bar = function () { return w.document.getElementById("sbar"); };
  state.frame = function () { return w.document.querySelector(".sbar-frame"); };
  state.fdoc = function () { try { return state.frame().contentDocument; } catch (e) { return null; } };
  state.ready = function () { return until(function () { return !!w.CPL_SIERRA_BAR && !!state.chip(); }); };
  state.loaded = function () { return until(function () { const d = state.fdoc(); return d && d.getElementById("s-input") && d.activeElement === d.getElementById("s-input"); }); };
  state.close = function () { w.close(); };
  return state;
}
function key(target, k) {
  const win = target.ownerDocument.defaultView;
  target.dispatchEvent(new win.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
}

async function main() {
  // (1) The chip, and nothing loaded before it is pressed.
  {
    const h = host();
    await h.ready();
    const c = h.chip(), all = h.d.querySelectorAll(".sbar-chip");
    check("(1a) one chip, a <button> that says Ask Sierra and says it opens a dialog",
      all.length === 1 && c.tagName === "BUTTON" && c.type === "button" && c.textContent === "Ask Sierra" &&
      c.getAttribute("aria-haspopup") === "dialog" && c.getAttribute("aria-expanded") === "false" && c.getAttribute("aria-controls") === "sbar");
    const css = (h.d.getElementById("sbar-css") || {}).textContent || "";
    const chipRule = (css.match(/\.sbar-chip \{([\s\S]*?)\}/) || [])[1] || "";
    check("(1b) the chip is fixed in the bottom-right corner, clear of the safe area, at least 48px tall",
      /position:fixed/.test(chipRule) && /right:max\(16px, env\(safe-area-inset-right/.test(chipRule) &&
      /bottom:max\(16px, env\(safe-area-inset-bottom/.test(chipRule) && /min-height:48px/.test(chipRule));
    check("(1c) Sierra does not load with the page: no frame and no request until the chip is pressed",
      !h.frame() && h.sierraLoads.length === 0 && h.bar().hidden);
    check("(1d) words, not glyphs: the chip, the title and Close carry letters only",
      [c, h.d.getElementById("sbar-title"), h.d.querySelector(".sbar-close")].every(function (e) { return e && /^[A-Za-z ]+$/.test(e.textContent); }));
    h.close();
  }

  // (2) Open: a dialog named Ask Sierra, framing sierra/ from beside the script; focus in her box.
  {
    const h = host();
    await h.ready();
    h.chip().click();
    const b = h.bar(), f = h.frame();
    const title = b && h.d.getElementById(b.getAttribute("aria-labelledby") || "");
    check("(2a) the chip opens a dialog named Ask Sierra, with Close, and steps aside",
      !!b && !b.hidden && b.getAttribute("role") === "dialog" && !!title && title.textContent === "Ask Sierra" &&
      !!b.querySelector("button.sbar-close") && h.chip().hidden && h.chip().getAttribute("aria-expanded") === "true");
    check("(2b) the frame is sierra/ found beside the script, not beside the page, and has a title",
      !!f && f.src === BASE + "sierra/?panel=1&theme=light" && h.w.CPL_SIERRA_BAR.SIERRA_URL === BASE + "sierra/" && /Sierra/.test(f.title));
    const focused = await h.loaded();
    check("(2c) once she loads, focus is in her question box", focused && h.d.activeElement === f);
    h.close();
    // A page at the site's root (COBI's depth) finds the same Sierra.
    const r = host({ path: "", src: "sierra/sidebar.js" });
    await r.ready();
    r.chip().click();
    check("(2d) a page at another depth frames the same sierra/", !!r.frame() && r.frame().src === BASE + "sierra/?panel=1&theme=light");
    await r.loaded();
    r.close();
  }

  // (3) Narrow: modal over the page, and Close gives everything back.
  {
    const h = host({ wide: false });
    await h.ready();
    h.chip().click();
    await h.loaded();
    const kids = Array.prototype.filter.call(h.d.body.children, function (k) { return !/^SCRIPT$/.test(k.tagName); });
    const behind = kids.filter(function (k) { return k !== h.bar(); });
    check("(3a) narrow: aria-modal true, every other child of <body> inert, the page held still",
      h.bar().getAttribute("aria-modal") === "true" && behind.length >= 4 && behind.every(function (k) { return k.hasAttribute("inert"); }) &&
      !h.bar().hasAttribute("inert") && h.d.documentElement.classList.contains("sbar-modal") && h.d.documentElement.classList.contains("sbar-open"));
    h.d.querySelector(".sbar-close").click();
    check("(3b) Close: the bar shuts, the chip returns with focus, the page is live again",
      h.bar().hidden && !h.chip().hidden && h.d.activeElement === h.chip() && h.chip().getAttribute("aria-expanded") === "false" &&
      !h.d.getElementById("h").hasAttribute("inert") && !h.d.getElementById("m").hasAttribute("inert") &&
      !h.d.documentElement.classList.contains("sbar-modal") && !h.d.documentElement.classList.contains("sbar-open"));
    check("(3c) an element the page made inert stays inert after Close", h.d.getElementById("pre").hasAttribute("inert"));
    h.close();
  }

  // (4) Wide: beside the page, which stays in use; a resize while open moves between the two.
  {
    const h = host({ wide: true });
    await h.ready();
    h.chip().click();
    await h.loaded();
    check("(4a) wide: aria-modal false, nothing inert but what the page set, the page narrowed beside her",
      h.bar().getAttribute("aria-modal") === "false" && !h.d.getElementById("m").hasAttribute("inert") &&
      h.d.documentElement.classList.contains("sbar-open") && !h.d.documentElement.classList.contains("sbar-modal"));
    const css = h.d.getElementById("sbar-css").textContent;
    check("(4b) the room is made only on a wide window: body's right margin is the bar's width, inside the WIDE query",
      /@media \(min-width: 1200px\) \{[\s\S]*html\.sbar-open body \{ margin-right:var\(--sierra-bar-w, 420px\); \}/.test(css) &&
      !/^html\.sbar-open body/m.test(css));
    h.resize(false);
    const narrowed = h.bar().getAttribute("aria-modal") === "true" && h.d.getElementById("m").hasAttribute("inert");
    h.resize(true);
    check("(4c) a resize while open turns the bar modal and back", narrowed &&
      h.bar().getAttribute("aria-modal") === "false" && !h.d.getElementById("m").hasAttribute("inert"));
    h.close();
  }

  // (5) Escape inside her frame, and the About panel's own Escape.
  {
    const h = host();
    await h.ready();
    h.chip().click();
    await h.loaded();
    const fd = h.fdoc(), about = fd.getElementById("s-about");
    about.hidden = false;
    key(fd.getElementById("s-input"), "Escape");
    check("(5a) Escape with her About panel open is hers: the bar stays open", !h.bar().hidden);
    about.hidden = true;
    key(fd.getElementById("s-input"), "Escape");
    check("(5b) Escape in her question box shuts the bar and hands focus to the chip", h.bar().hidden && h.d.activeElement === h.chip());
    h.chip().click();
    await h.loaded();
    key(h.d.querySelector(".sbar-close"), "Escape");
    check("(5c) Escape on the bar's own Close shuts it too", h.bar().hidden);
    h.close();
  }

  // (6) A reopen keeps the conversation: the same frame, loaded once.
  {
    const h = host();
    await h.ready();
    h.chip().click();
    await h.loaded();
    const first = h.frame();
    first.contentDocument.getElementById("s-input").value = "My question so far";
    h.d.querySelector(".sbar-close").click();
    h.chip().click();
    await h.loaded();
    check("(6) a reopen finds the same frame, loaded once, with what was typed",
      h.frame() === first && h.sierraLoads.length === 1 && h.d.querySelectorAll(".sbar-frame").length === 1 &&
      first.contentDocument.getElementById("s-input").value === "My question so far");
    h.close();
  }

  // (7) The theme rides the address, follows a change, and wins in her page.
  {
    const h = host({ theme: "dark", stored: "light" });
    await h.ready();
    check("(7a) a dark host asks for ?theme=dark, beside panel=1", h.w.CPL_SIERRA_BAR.frameUrl() === BASE + "sierra/?panel=1&theme=dark");
    h.chip().click();
    await h.loaded();
    check("(7b) her page lets ?theme=dark beat the stored light choice", h.fdoc().documentElement.getAttribute("data-theme") === "dark");
    h.d.documentElement.setAttribute("data-theme", "light");
    const followed = await until(function () { return h.fdoc().documentElement.getAttribute("data-theme") === "light"; });
    check("(7c) the host's switch to Light reaches her while she is open", followed);
    h.close();
    const g = host({ theme: null });
    await g.ready();
    const k = host({ theme: null, darkDevice: true });
    await k.ready();
    check("(7d) a host with no theme of its own (COBI's System) names the device's: Light on a light device, Dark on a dark one",
      g.w.CPL_SIERRA_BAR.frameUrl() === BASE + "sierra/?panel=1&theme=light" && k.w.CPL_SIERRA_BAR.frameUrl() === BASE + "sierra/?panel=1&theme=dark");
    g.close(); k.close();
    function sierraTheme(search, stored) {
      const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: BASE + "sierra/" + search, runScripts: "dangerously",
        beforeParse: function (w) { if (stored) w.localStorage.setItem("cpl_theme", stored); } });
      const s = dom.window.document.createElement("script"); s.textContent = HEAD_SCRIPT; dom.window.document.head.appendChild(s);
      const t = dom.window.document.documentElement.getAttribute("data-theme");
      dom.window.close();
      return t;
    }
    check("(7e) her head script: ?theme= wins, a stored choice holds without it, junk falls back to it, and with none she opens Light",
      HEAD_SCRIPT.length > 0 && sierraTheme("?theme=light", "dark") === "light" && sierraTheme("", "dark") === "dark" &&
      sierraTheme("?theme=pink", "dark") === "dark" && sierraTheme("", null) === "light" && sierraTheme("", "system") === "light");
  }

  // (8) The library: loads it, maps its tokens, two columns beside it, room for the chip.
  {
    check("(8a) the library loads ../sierra/sidebar.js, deferred", /<script src="\.\.\/sierra\/sidebar\.js" defer><\/script>/.test(LIBRARY));
    const used = Array.from(new Set((BAR.match(/var\(--sierra-bar-[a-z-]+/g) || []).map(function (s) { return s.slice(4); })))
      .filter(function (t) { return t !== "--sierra-bar-w"; });
    const root = (LIBRARY.match(/:root \{([\s\S]*?)\n\}/) || [])[1] || "";
    const missing = used.filter(function (t) { return root.indexOf(t + ":") < 0; });
    check("(8b) the library's :root maps every --sierra-bar-* token the script reads onto its own tokens",
      used.length >= 9 && !missing.length && !/--sierra-bar-[a-z-]+:\s*#/.test(root), "missing: " + missing.join(", "));
    check("(8c) with the bar open beside it, the library's cards fit the room it leaves: a container query on the results, two columns, then one",
      /\.results \{ container: lib-results \/ inline-size; \}/.test(LIBRARY) &&
      /@container lib-results \(max-width: 819px\) \{ html\.sbar-open \.grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \} \}/.test(LIBRARY) &&
      /@container lib-results \(max-width: 539px\) \{ html\.sbar-open \.grid \{ grid-template-columns: 1fr; \} \}/.test(LIBRARY) &&
      !/@media \(min-width: 1200px\) and \(max-width: 1599px\)/.test(LIBRARY));
    const foot = (LIBRARY.match(/\.foot-in \{ padding-block: 24px (\d+)px;/) || [])[1];
    check("(8d) the foot's last line clears the chip (16px from the bottom, 48px tall)", +foot >= 72);
    check("(8e) the bar and the chip stay off paper", /@media print \{ \.sbar-chip, \.sbar \{ display:none !important; \}/.test(BAR));
  }

  // (9) Two copies of the script make one chip.
  {
    const h = host({ twice: true });
    await h.ready();
    await until(function () { return false; }, 100);
    check("(9) a second copy of the script does nothing", h.d.querySelectorAll(".sbar-chip").length === 1 && h.d.querySelectorAll(".sbar").length === 1);
    h.close();
  }

  // (10) The host hides the chip: an open bar shuts, focus stays put, the scroll room goes.
  {
    const h = host({ wide: true });
    await h.ready();
    const root = h.d.documentElement;
    const roomRule = /html\.sbar-chip-on \{ scroll-padding-bottom: 88px; \}/.test(h.d.getElementById("sbar-css").textContent) &&
      !/(^|\n)html \{ scroll-padding/.test(h.d.getElementById("sbar-css").textContent);
    const onAtStart = root.classList.contains("sbar-chip-on");
    h.chip().click();
    await h.loaded();
    h.d.getElementById("b").focus();
    h.w.CPL_SIERRA_BAR.setChip(false);
    check("(10a) setChip(false) shuts the open bar and hides the chip, leaving focus where the host put it",
      h.bar().hidden && h.chip().hidden && h.d.activeElement === h.d.getElementById("b") &&
      !root.classList.contains("sbar-open") && !h.d.getElementById("m").hasAttribute("inert"));
    check("(10b) the chip's 88px of scroll room applies only while the chip shows",
      roomRule && onAtStart && !root.classList.contains("sbar-chip-on"));
    h.w.CPL_SIERRA_BAR.setChip(true);
    check("(10c) setChip(true) brings the chip back, the bar still shut", !h.chip().hidden && h.bar().hidden && root.classList.contains("sbar-chip-on"));
    h.chip().click();
    h.w.CPL_SIERRA_BAR.setChip(true);
    check("(10d) setChip(true) while she is open leaves the chip hidden behind her", h.chip().hidden && !h.bar().hidden);
    h.close();
  }

  // (12) The reader sets the width.
  {
    const h = host({ wide: true, innerWidth: 1440 });
    await h.ready();
    h.chip().click();
    await h.loaded();
    const g = h.d.querySelector(".sbar-grip"), root = h.d.documentElement;
    const barW = function () { return root.style.getPropertyValue("--sierra-bar-w"); };
    const saved = function () { return h.w.localStorage.getItem("cpl_sierra_bar_w"); };
    check("(12a) the bar's left edge is a focusable separator, named, controlling the bar, its value the width (420 of 340 to 840)",
      !!g && g.parentNode === h.bar() && g.getAttribute("role") === "separator" && g.getAttribute("aria-orientation") === "vertical" &&
      g.getAttribute("aria-label") === "Resize Ask Sierra" && g.getAttribute("aria-controls") === "sbar" && g.tabIndex === 0 &&
      g.getAttribute("aria-valuenow") === "420" && g.getAttribute("aria-valuemin") === "340" && g.getAttribute("aria-valuemax") === "840" &&
      g.getAttribute("aria-valuetext") === "420 pixels wide" && barW() === "420px" && saved() === null);
    const css = h.d.getElementById("sbar-css").textContent;
    const wideBlock = (css.match(/@media \(min-width: 1200px\) \{([\s\S]*?)\n\}/) || [])[1] || "";
    check("(12b) the edge and the two words show only beside the page; a narrow window gives her the screen with neither",
      /(^|\n)\.sbar-size, \.sbar-grip \{ display:none; \}/.test(css) && /\.sbar-size \{ display:inline-block; \}/.test(wideBlock) &&
      /\.sbar-grip \{ display:block; position:absolute;[^}]*cursor:col-resize; touch-action:none; \}/.test(wideBlock));
    key(g, "ArrowLeft");
    const left = barW() === "460px" && g.getAttribute("aria-valuenow") === "460";
    key(g, "ArrowRight"); key(g, "ArrowRight");
    const right = barW() === "380px";
    key(g, "Home");
    const home = barW() === "340px";
    key(g, "End");
    check("(12c) ArrowLeft widens by 40px, ArrowRight narrows, Home and End go to the least and the most, and the choice is saved",
      left && right && home && barW() === "840px" && saved() === "840", "now " + barW() + ", saved " + saved());
    const tools = Array.prototype.map.call(h.bar().querySelectorAll(".sbar-tools button"), function (b) { return b.textContent; });
    const wider = h.bar().querySelectorAll(".sbar-size")[1], narrower = h.bar().querySelectorAll(".sbar-size")[0];
    const atMost = wider.getAttribute("aria-disabled") === "true";
    wider.click();
    const held = barW() === "840px";
    narrower.click();
    check("(12d) Narrower and Wider are words before Close; Wider at the most says so and does nothing; Narrower narrows",
      tools.join("|") === "Narrower|Wider|Close" && atMost && held && barW() === "800px" && wider.getAttribute("aria-disabled") === "false" && saved() === "800");
    g.dispatchEvent(new h.w.MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, clientX: 640 }));
    const resizing = root.classList.contains("sbar-resizing");
    h.d.dispatchEvent(new h.w.MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: 900 }));
    const mid = barW() === "540px" && saved() === "800";
    h.d.dispatchEvent(new h.w.MouseEvent("pointerup", { bubbles: true, cancelable: true, clientX: 900 }));
    check("(12e) a drag of the edge sets the width from the pointer, lets the pointer past her frame while it lasts, and saves at the end",
      resizing && mid && !root.classList.contains("sbar-resizing") && barW() === "540px" && saved() === "540" &&
      /html\.sbar-resizing \.sbar-frame \{ pointer-events:none; \}/.test(css), "now " + barW() + ", saved " + saved());
    h.d.dispatchEvent(new h.w.MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: 300 }));
    g.dispatchEvent(new h.w.MouseEvent("pointerdown", { bubbles: true, cancelable: true, button: 2, clientX: 640 }));
    h.d.dispatchEvent(new h.w.MouseEvent("pointermove", { bubbles: true, cancelable: true, clientX: 300 }));
    check("(12f) a move after the drag, or a drag with another button, changes nothing", barW() === "540px" && !root.classList.contains("sbar-resizing"));
    h.d.dispatchEvent(new h.w.MouseEvent("pointerup", { bubbles: true }));
    h.close();
    const r = host({ wide: true, innerWidth: 1440, storedW: "700" });
    await r.ready();
    const rw = function () { return r.d.documentElement.style.getPropertyValue("--sierra-bar-w"); };
    const first = rw() === "700px";
    r.iw = 1200; r.w.dispatchEvent(new r.w.Event("resize"));
    const held2 = rw() === "600px" && r.w.localStorage.getItem("cpl_sierra_bar_w") === "700";
    r.iw = 1440; r.w.dispatchEvent(new r.w.Event("resize"));
    check("(12g) the next page reads the reader's width; a narrower window holds it so the page keeps 600px, and it grows back",
      first && held2 && rw() === "700px", "now " + rw());
    r.close();
    const j = host({ wide: true, innerWidth: 1440, storedW: "wide" });
    await j.ready();
    check("(12h) a stored width that is not a number falls back to 420px",
      j.d.documentElement.style.getPropertyValue("--sierra-bar-w") === "420px");
    j.close();
  }

  // (13) The page's own word, and the two pages that moved onto the bar.
  {
    const h = host({ launcher: true });
    await h.ready();
    const word = h.d.getElementById("word");
    check("(13a) ⭐ a page with its own Ask Sierra word shows no chip, and the word says it opens a dialog",
      h.chip().hidden && !h.d.documentElement.classList.contains("sbar-chip-on") &&
      word.getAttribute("aria-haspopup") === "dialog" && word.getAttribute("aria-controls") === "sbar" && word.getAttribute("aria-expanded") === "false");
    word.click();
    await h.loaded();
    check("(13b) the word opens her, says so, and the chip stays hidden", !h.bar().hidden && word.getAttribute("aria-expanded") === "true" && h.chip().hidden);
    key(h.fdoc().getElementById("s-input"), "Escape");
    check("(13c) ⭐ Escape in her frame shuts the bar and hands focus back to the word that opened her",
      h.bar().hidden && h.d.activeElement === word && word.getAttribute("aria-expanded") === "false" && h.chip().hidden);
    word.click();
    await h.loaded();
    h.d.querySelector(".sbar-close").click();
    check("(13d) so does Close", h.bar().hidden && h.d.activeElement === word);
    h.close();
    const FACT = fs.readFileSync("fact-sheet/index.html", "utf8"), FUND = fs.readFileSync("funding-model/index.html", "utf8");
    const FCSS = fs.readFileSync("fact-sheet/factsheet.css", "utf8");
    check("(13e) ⭐ the Fact Sheet and the funding page load the bar, deferred, and no drawer remains",
      [FACT, FUND].every((p) => /<script src="\.\.\/sierra\/sidebar\.js" defer><\/script>/.test(p) && !/factsheet_sierra/.test(p)) &&
      !fs.existsSync("fact-sheet/factsheet_sierra.js"));
    check("(13f) ⭐ each opens her from its own word, just ahead of its PDF control, and names her surface",
      /data-sierra-open[^>]*>Ask Sierra<\/button>\s*<button class="btn btn-primary" id="btn-print"/.test(FACT) &&
      /data-sierra-open[^>]*>Ask Sierra<\/button>\s*<button type="button" class="btn" id="pdf-btn"/.test(FUND) &&
      [FACT, FUND].every((p) => /window\.CPL_SIERRA_SURFACE = "fact-sheet";/.test(p)) &&
      /window\.CPL_SIERRA_SUGGESTED = \[/.test(FACT) && /window\.CPL_SIERRA_SUGGESTED = \[/.test(FUND));
    const used = Array.from(new Set((BAR.match(/var\(--sierra-bar-[a-z-]+/g) || []).map(function (s) { return s.slice(4); })))
      .filter(function (n) { return n !== "--sierra-bar-w"; });
    const fundMap = (FUND.match(/\.sbar, \.sbar-chip\{\s*--sierra-bar-bg[\s\S]*?\}/) || [""])[0];
    const factRoot = (FCSS.match(/:root \{([\s\S]*?)\n\}/) || [])[1] || "";
    check("(13g) both pages map every token the bar reads onto their own, never a raw hex (the funding page on the bar's elements alone)",
      used.every((n) => fundMap.indexOf(n + ":") > -1 && factRoot.indexOf(n + ":") > -1) &&
      !/--sierra-bar-[a-z-]+:\s*#/.test(fundMap + factRoot), "funding missing: " + used.filter((n) => fundMap.indexOf(n + ":") < 0).join(", "));
  }

  // (11) COBI's Library tab.
  {
    const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root"></div></body></html>',
      { url: "https://example.org/cpl/", runScripts: "dangerously" });
    const w = dom.window, loads = [], chips = [];
    let tab = "library";
    w.fetch = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve([]); }, text: function () { return Promise.resolve("[]"); } }); };
    w.CPL_TABS = { current: function () { return tab; },
      loadScript: function (src, name, cb) { loads.push(src); w.CPL_SIERRA_BAR = { setChip: function (on) { chips.push(on); } }; cb(); } };
    const sc = w.document.createElement("script"); sc.textContent = LIB_TAB; w.document.body.appendChild(sc);
    w.CPL_LIBRARY.activate();
    check("(11a) the Library tab loads sierra/sidebar.js on its first visit and shows the chip",
      loads.length === 1 && loads[0] === "sierra/sidebar.js" && chips[chips.length - 1] === true, "loads " + JSON.stringify(loads) + ", chips " + JSON.stringify(chips));
    tab = "dashboard";
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "dashboard" } }));
    const offElsewhere = chips[chips.length - 1] === false;
    tab = "library";
    w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab: "library" } }));
    check("(11b) another tab hides the chip, and the Library tab shows it again without a second load",
      offElsewhere && chips[chips.length - 1] === true && loads.length === 1);
    const css = (w.document.getElementById("lib-sbar-css") || {}).textContent || "";
    const used = Array.from(new Set((BAR.match(/var\(--sierra-bar-[a-z-]+/g) || []).map(function (t) { return t.slice(4); })))
      .filter(function (t) { return t !== "--sierra-bar-w"; });
    const missing = used.filter(function (t) { return css.indexOf(t + ":") < 0; });
    check("(11c) the tab maps every --sierra-bar-* token onto First Light's roles, on the bar's own elements, never a raw hex",
      /^\.sbar,\.sbar-chip\{/.test(css) && !missing.length && !/#[0-9a-f]{3,8}\b/i.test(css) && /--sierra-bar-chip-bg:var\(--seal-blue\)/.test(css),
      "missing: " + missing.join(", "));
    w.close();
  }
}

main().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "  (" + r[2] + ")"));
  });
  console.log("\n" + (results.length - failed) + "/" + results.length + " passed");
  process.exit(failed ? 1 : 0);
});
