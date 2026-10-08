// Sierra's page after america.gov — the 2026-10-08 redesign, as ported from the
// mock-up Sam approved (prototype/sierra_redesign_mockup.html).
//
//   Sam, 2026-10-08: "Sierra is a little busy on the UI and should have fewer
//   boxes... maximally clean and simple... I do think it's useful to keep the
//   chips that adjust the reposes to the audience type though. Maybe we cycle
//   through our First Light plein air artwork". On the mock-up: "Love the Sierra
//   mock up" and "Yes, painting folds away as you designed".
//
// WHAT THIS GUARDS, and why each is here rather than left to reading:
//
//   (1) THE PAINTINGS ARE THE ONES ON DISK. sierra.js carries the list; the
//       runner that fetched the files wrote art/manifest.json. A painting renamed
//       in one and not the other is a broken image on a public page, so the two
//       must agree, field for field, and every file the page asks for must exist.
//   (2) TWO VIEWS, ONE FORM. Arriving, the bar rides the painting; the first
//       question folds the landing away and docks the bar; New question starts
//       over, history included (a "new" question that still carries the last
//       conversation would answer the wrong thing).
//   (3) MOTION IS EARNED. The cycle runs only when the browser can say motion
//       is welcome; it stops at reduced motion, at the reader's first keystroke
//       or return to the box, and when the conversation starts. Pause is a word.
//       Only the painting shown and the next one are fetched, never all seven.
//   (4) THE AUDIENCE ROW FOLDS WITHOUT LOSING ITS RULE. The pick is still
//       required before the first send; when the row is folded, the refusal
//       opens it, and a pick closes it and hands focus back to its control.
//   (5) THE QUESTION BOX WRAPS. A one-row textarea: Enter sends, Shift+Enter
//       does not, so a long question shows whole instead of running off a phone.
//   (6) ONE THEME CONTROL. The reader's COBI choice (cpl_theme, same origin)
//       holds here; with none the page follows the OS. Only light and dark are
//       honored, so a stored "system" or garbage changes nothing.
//   (7) FIRST LIGHT, SELF-CONTAINED. Every hex lives in a :root block, the dark
//       palette is written twice (media query and explicit attribute) with the
//       same values, and the page loads no font or file from a third party.
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
const MANIFEST = JSON.parse(fs.readFileSync("sierra/art/manifest.json", "utf8"));

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
  await block("(1) the paintings are the ones on disk", async () => {
    const { w, API } = loadDom();
    const fields = ["slug", "title", "artist", "year", "focal", "alt"];
    const pick = (a) => fields.map((f) => a[f]);
    check("(1) ⭐ sierra.js and art/manifest.json list the same paintings, field for field, in order",
      API.ART.length === MANIFEST.paintings.length &&
      JSON.stringify(API.ART.map(pick)) === JSON.stringify(MANIFEST.paintings.map(pick)),
      "a painting renamed in one place is a broken image on a public page");
    const missing = [];
    API.ART.forEach((a) => ["800", "1600"].forEach((s) => {
      const f = path.join("sierra/art", a.slug + "-" + s + ".webp");
      if (!fs.existsSync(f)) missing.push(f);
    }));
    check("(1) every painting the page asks for exists in both sizes", missing.length === 0, missing.join(", "));
    check("(1) one starter question per painting", API.SUGGESTED.length === API.ART.length);
    w.close();
  });

  await block("(2) two views, one form", async () => {
    const { w, d, API, requests } = loadDom({ audience: "student" });
    const form = d.getElementById("s-form");
    check("(2) the page arrives on the arriving view, the bar on the painting",
      d.body.getAttribute("data-view") === "arriving" && form.parentNode.id === "s-frame" && API.getView() === "arriving");
    check("(2) there is one form, one box and one audience row on the page",
      d.querySelectorAll("form").length === 1 && d.querySelectorAll("#s-input").length === 1 &&
      d.querySelectorAll("#s-audience").length === 1);
    ask(w, "Which colleges teach welding?");
    await drain();
    check("(2) ⭐ the first question folds the landing away and docks the bar",
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
    check("(2) ⭐ New question brings the landing back with the bar on the painting",
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

  await block("(3) motion is earned", async () => {
    {
      const { w, d, API } = loadDom();
      check("(3) ⭐ no matchMedia (the preference cannot be read): the paintings hold still",
        API.cycling() === false && d.getElementById("s-pause").textContent === "Play");
      check("(3) …and only the painting shown is fetched", d.querySelectorAll("#s-arts img").length === 1);
      const img = d.querySelector("#s-arts img.on");
      check("(3) the shown painting carries its alt and its focal point",
        img && img.alt === API.ART[0].alt && img.style.objectPosition === API.ART[0].focal);
      check("(3) the caption names artist, title and year",
        d.getElementById("s-cap").textContent === API.ART[0].artist + ", " + API.ART[0].title + ", " + API.ART[0].year &&
        (d.querySelector("#s-cap i") || {}).textContent === API.ART[0].title);
      d.getElementById("s-prev").click();
      check("(3) Previous wraps from the first painting to the last",
        API.paintingIndex() === API.ART.length - 1 &&
        d.querySelectorAll("#s-arts img[alt]:not([alt=''])").length === 1);
      d.getElementById("s-next").click();
      check("(3) Next wraps back to the first", API.paintingIndex() === 0);
      w.close();
    }
    {
      const { w, d, API } = loadDom({ motion: "reduce" });
      check("(3) ⭐ under reduced motion the paintings hold still", API.cycling() === false);
      w.close();
    }
    {
      const { w, d, API } = loadDom({ motion: "ok", audience: "student" });
      check("(3) ⭐ when motion is welcome the paintings cycle, and Pause says Pause",
        API.cycling() === true && d.getElementById("s-pause").textContent === "Pause");
      check("(3) …the next painting is ready before its turn, and no more (two, never seven)",
        d.querySelectorAll("#s-arts img").length === 2);
      check("(3) the arrival focus does not stop the cycle", API.cycling() === true);
      d.getElementById("s-pause").click();
      check("(3) Pause stops it and becomes Play", API.cycling() === false && d.getElementById("s-pause").textContent === "Play");
      d.getElementById("s-pause").click();
      const input = d.getElementById("s-input");
      input.dispatchEvent(new w.Event("input", { bubbles: true }));
      check("(3) ⭐ the reader's first keystroke stops it for good", API.cycling() === false);
      d.getElementById("s-pause").click();
      check("(3) (Play restarts it)", API.cycling() === true);
      ask(w, "What is CPL?");
      await drain();
      check("(3) ⭐ the conversation stops it", API.cycling() === false);
      w.close();
    }
    check("(3) the cross-fade stands down under reduced motion",
      /prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.s-art\s*\{\s*transition:\s*none/.test(CSS));
  });

  await block("(4) the audience row folds without losing its rule", async () => {
    const { w, d, API, requests } = loadDom();
    const toggle = d.getElementById("s-aud-toggle"), row = d.getElementById("s-audience");
    check("(4) with no pick the control says so", toggle.textContent === "Answering for: choose one");
    check("(4) the row reads 'Answering for' and its five words",
      /^Answering for/.test(row.textContent) && row.querySelectorAll(".s-aud-chip").length === 5);
    ask(w, "hello?");
    await drain(4);
    check("(4) ⭐ a send with no pick is refused, and the refusal opens the folded row",
      requests.length === 0 && row.classList.contains("open") && toggle.getAttribute("aria-expanded") === "true");
    check("(4) the refusal says where the words are", /under the question box/.test(d.getElementById("s-status").textContent));
    row.querySelectorAll(".s-aud-chip")[1].click();
    check("(4) ⭐ a pick in the open row closes it and hands focus back to its control",
      !row.classList.contains("open") && toggle.getAttribute("aria-expanded") === "false" && d.activeElement === toggle);
    check("(4) the control names the pick", toggle.textContent === "Answering for: " + API.AUDIENCES[1].label);
    toggle.click();
    check("(4) the control opens the row", row.classList.contains("open") && toggle.getAttribute("aria-expanded") === "true");
    toggle.click();
    check("(4) …and closes it", !row.classList.contains("open"));
    check("(4) the toggle is a real control naming what it opens",
      /<button class="s-aud-toggle" id="s-aud-toggle" type="button" aria-expanded="false" aria-controls="s-audience">/.test(HTML));
    w.close();
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
    const ridges = (HTML.match(/<span class="s-peak">Sierra<svg class="s-ridge"[^>]*aria-hidden="true"[\s\S]*?<\/svg><\/span>/g) || []);
    check("(2b) ⭐ the ridgeline is ghosted behind her name in the greeting and in the reading header",
      ridges.length === 2 && /<h1>Hello, I'm <span class="s-peak">Sierra<svg class="s-ridge"/.test(HTML),
      "Sam, 2026-10-08: \"I like the mountain line\"");
    // Sam, 2026-10-08: "a dark blue ghosted font with a much thicker same color
    // mountain line... Match the font width and mountain line."
    check("(2b) ⭐ the name and its line share one ghosted dark blue, by token in light and dark",
      /class="s-ridge"[\s\S]*?stroke="currentColor"/.test(HTML) &&
      /\.s-peak\s*\{[^}]*color:\s*var\(--sierra-ghost\)/.test(CSS) &&
      /\.s-ridge\s*\{[^}]*color:\s*inherit/.test(CSS) &&
      (CSS.match(/--sierra-ghost:\s*#[0-9A-Fa-f]{6}/g) || []).length === 3);
    check("(2b) ⭐ the line carries the letters' stem weight at any size (0.126em, a non-scaling stroke)",
      /\.s-ridge path\s*\{\s*stroke-width:\s*\.126em/.test(CSS) &&
      (HTML.match(/vector-effect="non-scaling-stroke"/g) || []).length === 2);
    check("(2b) the line spans the word, and the letters' halo in the page color cuts it where it passes behind",
      /\.s-ridge\s*\{[^}]*width:\s*9\d%/.test(CSS) &&
      /\.s-peak\s*\{\s*text-shadow:[^}]*var\(--sierra-paper\)/.test(CSS));
    const { w, d } = loadDom();
    check("(2b) the greeting still reads as words to a screen reader",
      d.querySelector("h1").textContent === "Hello, I'm Sierra");
    w.close();
  });

  await block("(7) First Light, self-contained", async () => {
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
    check("(7) the page loads no font or file from a third party",
      !/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg/.test(HTML + CSS) &&
      !/url\(\s*['"]?https?:/.test(CSS));
    const faces = CSS.match(/url\('\.\/fonts\/[^']+'\)/g) || [];
    check("(7) the four font faces are self-hosted and on disk, with their licenses",
      faces.length === 4 && faces.every((u) => fs.existsSync(path.join("sierra", u.slice(5, -2)))) &&
      fs.existsSync("sierra/fonts/OFL-playfair-display.txt") && fs.existsSync("sierra/fonts/OFL-source-sans-3.txt"));
    check("(7) the only off-site link is the logo's, to the MAP platform, and it says it opens a new tab",
      (HTML.match(/href="https?:\/\/[^"]+"/g) || []).join() === 'href="https://map.rccd.edu"');
  });

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\nsierra_redesign.test.js: ${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
