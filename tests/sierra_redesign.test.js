// Sierra's page in the public library's look — the 2026-10-24 port, from the
// mock-up Sam reviewed (prototype/sierra_library_look_mockup.html), over the
// 2026-10-08 redesign's two views.
//
//   Sam, 2026-10-08: "Sierra is a little busy on the UI and should have fewer
//   boxes... maximally clean and simple... I do think it's useful to keep the
//   chips that adjust the reposes to the audience type though."
//   Sam, 2026-10-24: "Seeing the format of Sierra next to the new format is a
//   little incongruous. Been thinking about switching the paintings out and
//   having no pics and a simpler look so it can function as a sidebar better.
//   Can you align her format with the new library look while preserving her
//   basics?" On the mock-up: "White background for her as well".
//
// WHAT THIS GUARDS, and why each is here rather than left to reading:
//
//   (1) THE PAINTINGS ARE GONE. No art element, caption or control on the page,
//       no art file asked for, no art rule in the stylesheet; starter questions
//       stand where the painting was.
//   (2) TWO VIEWS, ONE FORM. Arriving, the box sits under the greeting; the first
//       question folds the landing away and docks the box; New question starts
//       over, history included (a "new" question that still carries the last
//       conversation would answer the wrong thing).
//   (3) NOTHING MOVES ON ITS OWN. With the paintings gone the page starts no
//       timer and cross-fades nothing.
//   (4) THE AUDIENCE IS ASKED FOR WHEN IT IS NEEDED (Sam, 2026-10-24: "gently
//       prompt the user to choose their population once they click Ask? I don't
//       want to complicate the screen with all the choices initially"). With no
//       pick the row is off the screen; the first Ask holds the question and
//       Sierra asks who the visitor is, focus on the first word; the pick sends
//       the held question. With a pick stored, the row is one folded control.
//   (5) THE QUESTION BOX WRAPS. A one-row textarea: Enter sends, Shift+Enter
//       does not, so a long question shows whole instead of running off a phone.
//   (6) ONE THEME CONTROL. The reader's COBI choice (cpl_theme, same origin)
//       holds here; with none the page follows the OS. Only light and dark are
//       honored, so a stored "system" or garbage changes nothing.
//   (7) THE LIBRARY LOOK, SELF-CONTAINED. A white page whose navy title and gold
//       rule are the library's own values (read from library/index.html, so the
//       two cannot drift); every hex lives in a :root block; the dark palette is
//       written twice with the same values; the page loads no web font and no
//       file from a third party; every link off the site says it opens a new tab.
//   (8) THE SIDE BAR. ?panel=1 marks the page before the stylesheet paints, and
//       the header row keeps About Sierra alone; the footer carries the CPL
//       Initiative mark, so she keeps it in the bar.
//
// Run from repo root: `npm test` (or `node tests/sierra_redesign.test.js`).
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { TextEncoder, TextDecoder } = require("util");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
async function block(label, fn) {
  try { await fn(); } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const HTML = fs.readFileSync("sierra/index.html", "utf8");
const SRC = fs.readFileSync("sierra/sierra.js", "utf8");
const CSS = fs.readFileSync("sierra/sierra.css", "utf8");
const LIB = fs.readFileSync("library/index.html", "utf8");

function streamResp(text) {
  const enc = new TextEncoder();
  const events = ["event: text\ndata: " + JSON.stringify({ text: text }) + "\n\n", "event: done\ndata: {}\n\n"];
  let i = 0;
  return { ok: true, status: 200, body: { getReader: () => ({
    read: () => i < events.length ? Promise.resolve({ value: enc.encode(events[i++]), done: false })
                                  : Promise.resolve({ value: undefined, done: true }),
    releaseLock() {},
  }) } };
}

/* opts.motion: undefined → no matchMedia at all (jsdom's default); "ok" → a
   matchMedia that reports no reduced-motion preference; "reduce" → one that
   reports it. opts.audience seeds the shared key; opts.theme seeds cpl_theme. */
function loadDom(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { runScripts: "outside-only",
    url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" });
  const w = dom.window;
  w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
  w.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  if (opts.motion) {
    w.matchMedia = (q) => ({ matches: /reduced-motion: reduce/.test(q) ? opts.motion === "reduce" : false,
      addEventListener() {}, removeEventListener() {} });
  }
  if (opts.audience) w.localStorage.setItem("cplSierraAudience.v1", opts.audience);
  const requests = [];
  w.fetch = (url, init) => {
    requests.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
    return Promise.resolve(streamResp("An answer."));
  };
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: false }));
  return { w, d: w.document, API: w.CPL_SIERRA_PAGE, requests };
}
const drain = async (n) => { for (let i = 0; i < (n || 14); i++) await new Promise((r) => setTimeout(r, 0)); };
function ask(w, text) {
  w.document.getElementById("s-input").value = text;
  w.document.getElementById("s-form").dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

(async function () {
  await block("(1) the paintings are gone", async () => {
    const { w, d, API } = loadDom();
    check("(1) ⭐ no painting, caption or painting control on the page",
      !d.getElementById("s-arts") && !d.getElementById("s-cap") && !d.getElementById("s-prev") &&
      !d.getElementById("s-pause") && !d.getElementById("s-next") && !d.querySelector("img.s-art"),
      "Sam, 2026-10-24: \"switching the paintings out and having no pics\"");
    check("(1) sierra.js asks for no art file and carries no painting list",
      !/\.\/art\//.test(SRC) && API.ART === undefined && API.showPainting === undefined);
    check("(1) the stylesheet carries no painting rule", !/\.s-art\b|\.s-arts\b|\.s-under\b|\.s-cap\b/.test(CSS));
    check("(1) ⭐ starter questions stand where the painting was, drawn from her own starters",
      API.TRIES.length === 3 && API.TRIES.every((q) => API.SUGGESTED.indexOf(q) > -1) &&
      d.querySelectorAll("#s-try-list .s-try-q").length === 3 &&
      d.getElementById("s-try").compareDocumentPosition(d.getElementById("s-frame")) === w.Node.DOCUMENT_POSITION_PRECEDING);
    w.close();
  });

  await block("(2) two views, one form", async () => {
    const { w, d, API, requests } = loadDom({ audience: "student" });
    const form = d.getElementById("s-form");
    check("(2) the page arrives on the arriving view, the box under the greeting",
      d.body.getAttribute("data-view") === "arriving" && form.parentNode.id === "s-frame" && API.getView() === "arriving");
    check("(2) there is one form, one box and one audience row on the page",
      d.querySelectorAll("form").length === 1 && d.querySelectorAll("#s-input").length === 1 &&
      d.querySelectorAll("#s-audience").length === 1);
    ask(w, "Which colleges teach welding?");
    await drain();
    check("(2) ⭐ the first question folds the landing away and docks the box",
      d.body.getAttribute("data-view") === "asking" && form.parentNode.id === "s-dock");
    check("(2) the docked box invites a follow-up", d.getElementById("s-input").placeholder === "Ask a follow-up");
    check("(2) the question and the answer are in the log, the answer named Sierra in words",
      /welding/.test(d.getElementById("s-log").textContent) &&
      (d.querySelector("#s-log .s-msg.s-bot .s-who") || {}).textContent === "Sierra");
    // Sam, 2026-10-08, on the port: "If you can preserve sierras logo, keep it
    // in. I like the mountain line". Her mark sits beside her name, as on the
    // COBI tab and the Fact Sheet drawer, and is silent to a screen reader.
    const mark = d.querySelector("#s-log .s-msg.s-bot .s-who .s-mark");
    check("(2) ⭐ her Whitney mark sits beside her name, hidden from a screen reader",
      mark && mark.getAttribute("aria-hidden") === "true" && !!mark.querySelector("svg circle"));
    d.getElementById("s-new").click();
    check("(2) ⭐ New question brings the landing back with the box under the greeting",
      d.body.getAttribute("data-view") === "arriving" && form.parentNode.id === "s-frame");
    check("(2) …and clears the conversation", d.getElementById("s-log").children.length === 0);
    ask(w, "What is CPL?");
    await drain();
    const chat = requests.filter((r) => /cpl-chat$/.test(r.url));
    check("(2) ⭐ …and the next question carries no history from the last conversation",
      chat.length === 2 && chat[0].body.history.length === 0 && chat[1].body.history.length === 0,
      "a new question that still sends the last conversation answers the wrong thing");
    check("(2) the h1 stays in the accessibility tree while reading (clipped, never display:none)",
      /body\[data-view="asking"\] \.s-hello\s*\{[^}]*clip-path:\s*inset\(50%\)/.test(CSS) &&
      !/body\[data-view="asking"\][^{]*\.s-hello[^{]*\{[^}]*display:\s*none/.test(CSS));
    w.close();
  });

  await block("(3) nothing moves on its own", async () => {
    const timers = [];
    const { w } = loadDom({ motion: "ok" });
    check("(3) ⭐ the page starts no repeating timer", !/setInterval\(/.test(SRC));
    check("(3) the stylesheet cross-fades nothing", !/transition:\s*opacity/.test(CSS));
    check("(3) under reduced motion the one cue that animates stands down, and the audience row has no flash left",
      /prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.s-typing\s*\{\s*animation:\s*none/.test(CSS) &&
      !/s-need/.test(CSS) && !/s-need/.test(SRC));
    w.close();
  });

  await block("(4) the audience is asked for at the first Ask", async () => {
    const { w, d, API, requests } = loadDom();
    const line = d.getElementById("s-aud-line"), toggle = d.getElementById("s-aud-toggle"), row = d.getElementById("s-audience");
    check("(4) ⭐ with no pick, the row is off the screen on arrival", line.hidden && /<div class="s-aud-line" id="s-aud-line" hidden>/.test(HTML) &&
      /\.s-aud-line\[hidden\] \{ display: none; \}/.test(CSS));
    ask(w, "hello?");
    await drain(4);
    const first = row.querySelectorAll(".s-aud-chip")[0];
    check("(4) ⭐ the first Ask holds the question and Sierra asks who the visitor is, the five words open beneath",
      requests.length === 0 && d.getElementById("s-input").value === "hello?" && !line.hidden &&
      line.classList.contains("s-asking-who") && row.classList.contains("open") &&
      d.getElementById("s-aud-label").textContent === API.WHO_PROMPT && /^Who are you asking as\?/.test(API.WHO_PROMPT) &&
      row.querySelectorAll(".s-aud-chip").length === 5);
    check("(4) focus moves to the first word, so a keyboard lands where the answer is given", d.activeElement === first);
    check("(4) it asks; it does not scold: no error style, no flash",
      !/s-error/.test(d.getElementById("s-status").className) && d.getElementById("s-status").textContent === "");
    check("(4) while she asks, her question shows and the folded control does not",
      /\.s-asking-who \.s-aud-label \{ display: block;/.test(CSS) && /\.s-asking-who \.s-aud-toggle \{ display: none; \}/.test(CSS) &&
      /(^|\n)\.s-aud-label \{ display: none; \}/.test(CSS));
    row.querySelectorAll(".s-aud-chip")[1].click();
    await drain(14);
    check("(4) ⭐ the pick sends the held question, with the pick",
      requests.length === 1 && requests[0].body.query === "hello?" && requests[0].body.audience === API.AUDIENCES[1].k);
    check("(4) after the pick the row folds to one control naming it",
      !line.hidden && !line.classList.contains("s-asking-who") && !row.classList.contains("open") &&
      toggle.textContent === "Answering for: " + API.AUDIENCES[1].label);
    toggle.click();
    check("(4) the control opens the row", row.classList.contains("open") && toggle.getAttribute("aria-expanded") === "true");
    row.querySelectorAll(".s-aud-chip")[2].click();
    await drain(4);
    check("(4) a change of pick closes the row, hands focus back to its control and sends nothing",
      !row.classList.contains("open") && toggle.getAttribute("aria-expanded") === "false" && d.activeElement === toggle &&
      requests.length === 1 && toggle.textContent === "Answering for: " + API.AUDIENCES[2].label);
    check("(4) the toggle is a real control naming what it opens",
      /<button class="s-aud-toggle" id="s-aud-toggle" type="button" aria-expanded="false" aria-controls="s-audience">/.test(HTML));
    check("(4) one rule for every width and view: no folding rule left keyed to a phone or to reading",
      !/body\[data-view="asking"\] \.s-aud/.test(CSS) && /(^|\n)\.s-audience:not\(\.open\) \{ display: none; \}/.test(CSS));
    w.close();
    const s = loadDom({ audience: "faculty" });
    check("(4) a stored pick shows on arrival as the one folded control",
      !s.d.getElementById("s-aud-line").hidden && !s.d.getElementById("s-audience").classList.contains("open") &&
      s.d.getElementById("s-aud-toggle").textContent === "Answering for: Faculty");
    s.w.close();
  });

  await block("(5) the question box wraps", async () => {
    const { w, d, requests } = loadDom({ audience: "student" });
    const input = d.getElementById("s-input");
    check("(5) the box is a one-row textarea that offers Send on a phone keyboard",
      input.tagName === "TEXTAREA" && input.getAttribute("rows") === "1" && input.getAttribute("enterkeyhint") === "send" &&
      input.getAttribute("maxlength") === "1000");
    check("(5) the textarea cannot be dragged larger, and its starter shows", /\.s-input\s*\{[^}]*resize:\s*none/.test(CSS) &&
      /^Try: /.test(input.placeholder));
    input.value = "line one";
    input.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true }));
    await drain(4);
    check("(5) Shift+Enter does not send", requests.length === 0);
    input.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await drain();
    check("(5) ⭐ Enter sends", requests.filter((r) => /cpl-chat$/.test(r.url)).length === 1 &&
      requests[0].body.query === "line one");
    w.close();
  });

  await block("(6) one theme control", async () => {
    const head = (HTML.match(/<head>[\s\S]*?<\/head>/) || [""])[0];
    const inline = (head.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
    check("(6) the theme is set in <head>, before the stylesheet paints",
      inline.length > 0 && head.indexOf("<script>") < head.indexOf('href="./sierra.css"'));
    const run = (stored) => {
      const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
        { url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/", runScripts: "outside-only" });
      if (stored !== null) dom.window.localStorage.setItem("cpl_theme", stored);
      dom.window.eval(inline);
      const t = dom.window.document.documentElement.getAttribute("data-theme");
      dom.window.close();
      return t;
    };
    check("(6) ⭐ the reader's COBI choice of dark holds here", run("dark") === "dark");
    check("(6) …and light", run("light") === "light");
    check("(6) no choice, or System, follows the OS (no attribute)", run(null) === null && run("system") === null);
    check("(6) a stored value that is no theme changes nothing", run("constructor") === null);
  });

  await block("(2b) the mountain line is kept", async () => {
    const peak = /<span class="s-peak">Sierra<svg class="s-ridge"[^>]*aria-hidden="true"[\s\S]*?<\/svg><\/span>/g;
    const ridges = HTML.match(peak) || [];
    check("(2b) ⭐ the logo stands over her name in the greeting and in the reading header",
      ridges.length === 2 && /<h1>Hello, I'm <span class="s-peak">Sierra<svg class="s-ridge"/.test(HTML),
      "Sam, 2026-10-08: \"I like the mountain line\"");
    check("(2b) ⭐ the name and its line share one navy, by token in light and dark",
      /class="s-ridge"[\s\S]*?stroke="currentColor"/.test(HTML) &&
      /\.s-peak\s*\{[^}]*color:\s*var\(--sierra-ghost\)/.test(CSS) &&
      /\.s-ridge\s*\{[^}]*color:\s*inherit/.test(CSS) &&
      (CSS.match(/--sierra-ghost:\s*#[0-9A-Fa-f]{6}/g) || []).length === 3);
    // "Can you just use the current logo expanded?" The inline drawing IS
    // whitney-mark.svg, path for path, at its own proportions.
    const logo = fs.readFileSync("sierra/whitney-mark.svg", "utf8");
    const norm = (t) => t.replace(/\s+/g, " ").trim();
    const logoPaths = (logo.match(/<path d="([^"]+)"/g) || []).map((m) => norm(m.slice(9, -1)));
    const inline = (HTML.match(/<svg class="s-ridge"[\s\S]*?<\/svg>/) || [""])[0];
    const inlinePaths = (inline.match(/<path d="([^"]+)"/g) || []).map((m) => norm(m.slice(9, -1)));
    check("(2b) ⭐ the logo is whitney-mark.svg as drawn: its ridge and its snow, path for path",
      logoPaths.length === 2 && JSON.stringify(inlinePaths) === JSON.stringify(logoPaths) &&
      /stroke-width="3\.8"/.test(inline) && !/vector-effect/.test(inline));
    // "Keep the ridgeline mostly above Sierra": in Georgia it sits wholly above the
    // word, in room the name makes for it, so no letter needs a halo or a moved dot.
    check("(2b) ⭐ it sits above the name, in room the name makes for it",
      /\.s-peak\s*\{[^}]*padding-top:\s*\.4\d*em/.test(CSS) &&
      /\.s-ridge\s*\{[^}]*top:\s*0;[^}]*height:\s*\.5em/.test(CSS) && !/s-tittle|&#305;/.test(HTML + CSS));
    const { w, d } = loadDom();
    const spoken = (el) => Array.prototype.map.call(el.childNodes, (n) =>
      n.nodeType === 3 ? n.textContent
        : (n.getAttribute && n.getAttribute("aria-hidden") === "true") ? "" : spoken(n)).join("");
    check("(2b) ⭐ the greeting reads as plain words to a screen reader",
      spoken(d.querySelector("h1")) === "Hello, I'm Sierra" && d.querySelector("h1 .s-ridge").getAttribute("aria-hidden") === "true");
    w.close();
  });

  await block("(7) the library look, self-contained", async () => {
    const noRoot = CSS.replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/:root[^{]*\{[^}]*\}/g, "");
    const stray = noRoot.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    check("(7) ⭐ every hex lives in a :root block (components use tokens)", stray.length === 0, stray.join(" "));
    const lightDark = (CSS.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{([^}]*)\}/) || [])[1] || "";
    const explicitDark = (CSS.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/) || [])[1] || "";
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    check("(7) ⭐ the dark palette is written twice with the same values (the OS, and the reader's choice)",
      lightDark.length > 100 && norm(lightDark) === norm(explicitDark),
      "an explicit choice must beat the OS in both directions — the cpl_theme.js contract");
    // The library's own light values, read from its page, so a change there shows here.
    const libRoot = (LIB.match(/:root \{([\s\S]*?)\n\}/) || [])[1] || "";
    const lib = (name) => ((libRoot.match(new RegExp("--" + name + ":\\s*(#[0-9A-Fa-f]{6})")) || [])[1] || "").toUpperCase();
    const sierraRoot = (CSS.match(/^:root \{([\s\S]*?)\n\}/m) || [])[1] || "";
    const own = (name) => ((sierraRoot.match(new RegExp("--sierra-" + name + ":\\s*(#[0-9A-Fa-f]{6})")) || [])[1] || "").toUpperCase();
    check("(7) ⭐ a white page (Sam: \"White background for her as well\")", own("paper") === "#FFFFFF" &&
      /body\s*\{[^}]*background:\s*var\(--sierra-paper\)/.test(CSS));
    check("(7) ⭐ her title, gold rule, ink, links and field edge are the library's own values",
      lib("title") && own("title") === lib("title") && own("gold") === lib("gold") && own("ink") === lib("ink") &&
      own("cobalt") === lib("link") && own("field") === lib("field") && own("heading") === lib("heading"),
      "library: title " + lib("title") + ", gold " + lib("gold") + "; sierra: " + own("title") + ", " + own("gold"));
    check("(7) her landing takes the library's fade (\"Fades white to pale blue looks good too\"), never the conversation or the bar",
      /:root:not\(\[data-panel\]\) body\[data-view="arriving"\] \{\s*background-image: linear-gradient\(180deg, var\(--sierra-paper\) 0, var\(--sierra-fade-mid\) 38rem, var\(--sierra-fade-end\) 100%\);/.test(CSS) &&
      own("fade-mid") === lib("page") && own("fade-end") === lib("page-end"));
    check("(7) her headings are Georgia, as the library's are",
      /--sierra-display:\s*Georgia/.test(CSS) && /--serif:\s*Georgia/.test(LIB));
    check("(7) the page loads no web font and no file from a third party",
      !/@font-face/.test(CSS) && !/rel="preload"[^>]*as="font"/.test(HTML) &&
      !/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg/.test(HTML + CSS) && !/url\(\s*['"]?https?:/.test(CSS));
    const offsite = HTML.match(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>[\s\S]*?<\/a>/g) || [];
    const hosts = offsite.map((a) => (a.match(/href="([^"]+)"/) || [])[1]);
    check("(7) ⭐ the logo goes to MAP, and the footer carries the public header's links out",
      hosts[0] === "https://map.rccd.edu" &&
      ["/fact-sheet/", "cpllandingpages", "insights/dashboard", "creditforbeingyou.org", "/library/"].every((k) => hosts.some((h) => h.indexOf(k) > -1)));
    check("(7) every link off the site opens a new tab and says so",
      offsite.length >= 6 && offsite.every((a) => /target="_blank"/.test(a) && /rel="noopener"/.test(a) && /class="s-sr">[^<]*opens in a new tab/.test(a)));
  });

  await block("(8) the side bar", async () => {
    const head = (HTML.match(/<head>[\s\S]*?<\/head>/) || [""])[0];
    const scripts = (head.match(/<script>[\s\S]*?<\/script>/g) || []).map((t) => t.slice(8, -9));
    const panelScript = scripts.find((t) => /data-panel/.test(t)) || "";
    const marks = (search) => {
      const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>",
        { url: "https://cpl-initiative.github.io/cpl-project-tracker/sierra/" + search, runScripts: "outside-only" });
      dom.window.eval(panelScript);
      const on = dom.window.document.documentElement.hasAttribute("data-panel");
      dom.window.close();
      return on;
    };
    check("(8) ⭐ ?panel=1 marks the page in <head>, before the stylesheet paints",
      panelScript.length > 0 && head.indexOf(panelScript) < head.indexOf('href="./sierra.css"') &&
      marks("?panel=1") && marks("?theme=dark&panel=1") && !marks("") && !marks("?panel=10"));
    check("(8) ⭐ in the bar the header keeps About Sierra alone: the logo, her name, the theme words and the links stand down",
      /:root\[data-panel\] \.s-home, :root\[data-panel\] \.s-who-head, :root\[data-panel\] \.s-theme, :root\[data-panel\] \.s-links \{ display: none; \}/.test(CSS) &&
      !/:root\[data-panel\][^{]*\.s-about\b[^{]*\{[^}]*display:\s*none/.test(CSS));
    check("(8) the side bar asks for the panel", /'\?panel=1'/.test(fs.readFileSync("sierra/sidebar.js", "utf8")));
    // The CPL Initiative mark in her footer (Sam, 2026-10-24: "Maybe put the CPL Initiative logo in her footer").
    const foot = (HTML.match(/<footer class="s-foot">[\s\S]*?<\/footer>/) || [""])[0];
    check("(8) ⭐ her footer carries the CPL Initiative mark, white and navy, each named, neither a link",
      /<img class="s-foot-logo s-foot-logo-white" src="\.\/cpl-initiative-logo\.png" alt="CPL Initiative"/.test(foot) &&
      /<img class="s-foot-logo s-foot-logo-navy" src="\.\/cpl-initiative-logo-navy\.png" alt="CPL Initiative"/.test(foot) &&
      !/<a[^>]*>\s*<img class="s-foot-logo/.test(foot));
    check("(8) white on her page's navy band; navy on the bar's paper, white on the dark paper, the dark rule written twice",
      /\.s-foot-logo \{[^}]*display: none; \}/.test(CSS) &&
      /:root:not\(\[data-panel\]\) \.s-foot-logo-white, :root\[data-panel\] \.s-foot-logo-navy \{ display: block; \}/.test(CSS) &&
      /prefers-color-scheme: dark\) \{\s*:root\[data-panel\]:not\(\[data-theme="light"\]\) \.s-foot-logo-navy \{ display: none; \}\s*:root\[data-panel\]:not\(\[data-theme="light"\]\) \.s-foot-logo-white \{ display: block; \}/.test(CSS) &&
      /:root\[data-panel\]\[data-theme="dark"\] \.s-foot-logo-navy \{ display: none; \}\s*:root\[data-panel\]\[data-theme="dark"\] \.s-foot-logo-white \{ display: block; \}/.test(CSS));
  });

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\nsierra_redesign.test.js: ${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
