/* ===========================================================================
   scripts/a11y.js — the accessibility + mobile sweep. ONE command, EVERY view.
   ---------------------------------------------------------------------------
       npm run a11y                    # every view this project ships
       npm run a11y -- cobi            # one target
       npm run a11y -- cobi:memory     # one route inside a target
       npm run a11y -- --verbose       # every width, not just the failures
       npm run a11y -- --shots DIR     # + screenshots
       npm run a11y -- --config PATH   # a different project's config

   WHY IT IS ONE COMMAND. Sam, 2026-09-04: "I'm thinking about creating a skill
   or agent to run a daily check and remediation on all COBI views... I can't
   seem to get claude.md or memory to reliably enforce this when we are building
   day to day and I often forget to remind you" — then, on the shape of the fix:
   "use the simplest approach that sets us up for continued long term use on all
   projects."

   The simplest approach is not another rule. The repo already HAD the rule
   (presentation doctrine, "accessible to today's standards — and verified, not
   claimed") and shipped seven AA failures in one masthead anyway, three of them
   written the same session, one of them minutes after a comment saying not to.
   A rule states a standard; only a MEASUREMENT detects a violation. What was
   missing was never a stronger sentence — it was an instrument cheap enough to
   run without being asked, over everything rather than over whatever somebody
   remembered to name.

   THE SPLIT THAT MAKES IT PORTABLE. This file knows nothing about COBI. Every
   project-specific fact — which files, which routes, which exemptions — lives
   in a11y.config.js beside it. Another project copies the script and writes its
   own config; the command and the checks stay the same. Adding a view here
   costs a config entry, and where an app routes its own views (COBI's 37 tabs)
   it costs nothing at all: `discover` reads the routes out of the running page,
   so the next tab is measured the day it ships.

   ⚠️ WHY THIS IS NOT IN `npm test`, AND MUST NOT BE. jsdom has no layout
   engine: getBoundingClientRect() returns zeroes, getComputedStyle() resolves
   no cascade, and no breakpoint ever fires. So the whole 299-file suite passed
   green while the masthead painted 240px of one cluster over another. GEOMETRY
   and PAINT need a browser; CI has jsdom only, and making CI download Chromium
   for a check it cannot run is a cost with no return. Structure lives in
   tests/*.test.js. Everything you can only see rendered lives here.

   What it measures, per route, per width:
     · horizontal overflow of the document, and which elements escape
     · panels dropped by a breakpoint — an element display:none on a phone and
       visible on a desktop is REPORTED, because a page that silently loses a
       feature looks complete. `mayHideBelow` names the ones meant to go.
     · scrollable regions: focusable exactly while they overflow, and named
     · interactive targets below the WCAG 2.2 AA 24x24 minimum
   and once per route at desktop:
     · text/background contrast of every painted pair, composited through
       ancestors and scored at a gradient's worst stop. Pairs it CANNOT compute
       (an image) are reported as unmeasurable, never counted as passes.
     · heading order, and skipped levels
     · a focus indicator on every focusable element
   and once per target:
     · prefers-reduced-motion actually stopping every animation
     · the per-target FUNCTIONAL keyboard checks (behaviour, not shape)

   ⚠️ One thing this instrument cannot see: Chromium 127+ makes an OVERFLOWING
   scroll container keyboard-focusable with no tabindex, so a missing tabindex
   on a scroller does not reproduce as a behaviour failure here. That is why the
   scroller check reads the ATTRIBUTE rather than pressing a key — the browser
   doing the measuring is more forgiving than the browsers being measured.

   ⚠️ IT SERVES THE PROJECT OVER http:// RATHER THAN OPENING file:// URLs, and
   that is load-bearing, not tidiness. Under file:// Chromium treats every
   linked stylesheet as a separate opaque origin, so `sheet.cssRules` throws a
   SecurityError. The reduced-motion check reads the sheets to find animations
   that are DECLARED but not currently mounted (Sierra's typing indicator only
   exists mid-answer) — and under file:// it caught the throw, read nothing, and
   printed "ok". It was vacuous on the very first page it was pointed at, in a
   repo that has now recorded "a check that never registers can never fail"
   three times. The server also gives localStorage a real origin. `blockedSheets`
   below is the belt: if a sheet is ever unreadable again the run FAILS rather
   than quietly passing.

   ⚠️ EVERY REQUEST THAT LEAVES THE ORIGIN IS ABORTED. The sandbox cannot reach
   Supabase or a CDN anyway, and a measurement that depends on the network is a
   measurement that reports a different number on a different day. What is being
   checked is the shell the app paints — its chrome, its type, its breakpoints —
   which is exactly the part that is there before any row arrives.

   Exits non-zero on a defect, so it can gate a release by hand. Requires
   playwright + a Chromium; in the sandbox that is the newest chromium build
   under /opt/pw-browsers (PLAYWRIGHT_CHROMIUM overrides). If playwright is not
   in the project tree, NODE_PATH can point at an out-of-tree install.

   ⚠️ PLAYWRIGHT *IS* IN package.json, PINNED EXACTLY, AND THE PIN IS LOAD-
   BEARING. An earlier version of this header (carried over from the script this
   replaced) said it was "deliberately NOT a package.json dependency" — that was
   never true of this repo, and the correction matters because of how it broke:
   `package-lock.json` is GITIGNORED here, so CI's `npm install` resolves ranges
   against the registry at run time. On 2026-09-04 playwright 1.63.0 published
   with a 404 tarball, `^1.62.1` resolved to it, and every CI run on every branch
   died at install — three seconds in, before a single test body ran. With only
   two direct dependencies and no lockfile, an EXACT pin on each is what makes
   `npm install` deterministic. The workflow sets
   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, so the package costs CI a download of the
   driver and no browser. Bump a pin deliberately; never widen one to a range.
   =========================================================================== */
const path = require("path");
const fs = require("fs");
const http = require("http");

const argv = process.argv.slice(2);
const flag = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };

const CONFIG_PATH = path.resolve(flag("--config") || path.join(__dirname, "..", "a11y.config.js"));
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`No a11y config at ${CONFIG_PATH}. Pass --config <path>, or write one beside the script.`);
  process.exit(2);
}
const CFG = require(CONFIG_PATH);
const REPO = path.resolve(path.dirname(CONFIG_PATH), CFG.root || ".");
const WIDTHS = CFG.widths || [320, 390, 768, 1024, 1440];
const PAGES = CFG.targets || {};

/* A minimal static server over the repo. Same-origin is what makes the linked
   stylesheets readable; see the header note. */
function serve() {
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
                 ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
                 ".geojson": "application/json", ".csv": "text/csv" };
  const srv = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(REPO, rel);
    if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end("not found");
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => srv.listen(0, "127.0.0.1", () => resolve({ srv, port: srv.address().port })));
}

/* page.evaluate() serializes its argument, and a config carries a `seed`
   FUNCTION — so hand the browser the data half only. */
function measureCfg(cfg) {
  return {
    mayHideBelow: cfg.mayHideBelow || [],
    targetSizeExempt: cfg.targetSizeExempt || [],
  };
}

function chromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const root = "/opt/pw-browsers";
  try {
    const dir = fs.readdirSync(root).filter((f) => /^chromium-\d+$/.test(f)).sort().pop();
    if (dir) {
      const p = path.join(root, dir, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* fall through to playwright's own resolution */ }
  return undefined;
}

/* The in-page measurement. Everything below runs in the browser, so it sees
   computed styles and real boxes — the two things jsdom cannot give us. */
/* eslint-disable */
function MEASURE(cfg) {
  const mayHideBelow = cfg.mayHideBelow || [];
  const exempt = cfg.targetSizeExempt || [];
  const de = document.documentElement, vw = de.clientWidth;
  const name = (el) => el.tagName.toLowerCase() +
    (el.id ? "#" + el.id : "") +
    (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");

  // ── elements escaping the viewport ──
  const escapes = [];
  const scrollParents = [];
  document.querySelectorAll("body *").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.overflowX === "auto" || cs.overflowX === "scroll" ||
        cs.overflowY === "auto" || cs.overflowY === "scroll") scrollParents.push(el);
  });
  const inScroller = (el) => scrollParents.some((s) => s !== el && s.contains(el));

  /* getBoundingClientRect() returns the LAYOUT box and knows nothing about
     clipping, so a decorative element deliberately clipped by an ancestor
     (overflow: hidden / clip) still reports a box past the viewport edge. That
     is not an escape — nothing is painted there and the document does not
     scroll. Ask the ancestors instead. The document-overflow number above is
     the check that actually matters for "does this page scroll sideways". */
  const clippedByAncestor = (el) => {
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const cs = getComputedStyle(p);
      if (/hidden|clip/.test(cs.overflowX) || /hidden|clip/.test(cs.overflow)) return true;
      p = p.parentElement;
    }
    return false;
  };

  document.querySelectorAll("body *").forEach((el) => {
    const b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.position === "absolute") {
      // absolutely-placed chrome is allowed to sit at an edge; only flag it if
      // it actually pushes the document, which the overflow number below catches
      if (b.right <= vw + 1) return;
    }
    if (inScroller(el)) return;                       // legitimately inside a scroll container
    if (clippedByAncestor(el)) return;                // painted inside its clip, not escaping
    if (el.closest(".skip-link, .sr-only, .s-skip, .s-sr")) return;
    if (b.right > vw + 1 || b.left < -1) escapes.push(name(el) + " right=" + Math.round(b.right));
  });

  // ── scrollable regions: reachable exactly while they scroll, and named ──
  const scrollers = scrollParents.filter((el) => {
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 &&
      (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
  }).map((el) => ({
    el: name(el),
    tabindex: el.getAttribute("tabindex"),
    label: el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || "",
    role: el.getAttribute("role") || "",
    focusableInside: !!el.querySelector("a[href],button,input,select,textarea,[tabindex]"),
    /* ⚠️ A <textarea> that scrolls is ALREADY keyboard reachable — it is the
       focusable thing. The first sweep reported 29 of these across COBI, and a
       harness that reports a textarea as unreachable is a harness people learn
       to skim. Only a container that is NOT itself focusable needs a tabindex. */
    selfFocusable: el.matches('a[href],button,input,select,textarea,[contenteditable=""],[contenteditable="true"],[tabindex]'),
  }));

  // ── which elements a breakpoint has hidden ──
  const hidden = [];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest(".skip-link, .sr-only, .s-sr")) return;
    const cs = getComputedStyle(el);
    if (cs.display !== "none") return;
    if (el.hasAttribute("hidden")) return;            // script-controlled, not a breakpoint
    if (el.dataset && el.dataset.a11yExpectHidden === "1") return;
    // Only care about containers with real content, not empty script mounts
    if ((el.textContent || "").trim().length < 20 && !el.querySelector("input,button,a")) return;
    if (mayHideBelow.some((sel) => el.matches(sel))) return;
    hidden.push(name(el));
  });

  /* ── interactive targets under the WCAG 2.2 AA 24x24 floor ──
     Measure the HIT AREA, not the control. A 13x13 checkbox wrapped in its own
     <label> is activated by the whole label, so the box you can actually press
     is the label's — reporting the input would be a false positive, and a
     harness that cries wolf gets ignored on the day it is right. */
  /* Distinct DEFECTS, not distinct nodes: 28 sub-24px targets on one tab is six
     rules repeated, and a list of 28 hides which six. Key on the selector and
     the size; keep the first label as the example and count the rest. */
  const smallBy = new Map(), exemptHit = new Set();
  document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[role="button"]').forEach((el) => {
    let b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) return;      // not rendered
    if (el.closest(".skip-link, .sr-only, .s-skip, .s-sr")) return;
    if (el.tagName === "A" && el.closest("p, li, footer, .s-bubble")) return;  // inline text link exception
    /* A <label> is part of the target: clicking it activates the control. But
       WHICH box that makes is not one rule — it is two.
         · A label that WRAPS the control replaces its box. A 13x13 checkbox
           inside its own label is pressed by the whole label, so reporting the
           input would be a false positive.
         · A label that merely POINTS at it (label[for]) is a SECOND target of
           the same size-independent function, sitting somewhere else entirely.
           Substituting its box there does not enlarge the target, it swaps it —
           and the first COBI sweep did exactly that: it reported the masthead
           search box as 91x21 after the box had been fixed to 32px tall,
           because the "Where To?" LABEL beside it is 21.7. Two more edits and
           the harness would have been "fixed" by making a passing control
           bigger. Either box clearing the floor is enough. */
    const wrapping = el.closest("label");
    if (wrapping) {
      const lb = wrapping.getBoundingClientRect();
      if (lb.width > 0 && lb.height > 0) b = lb;
    }
    if (b.width >= 24 && b.height >= 24) return;
    const pointing = !wrapping && el.id ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]') : null;
    if (pointing) {
      const pb = pointing.getBoundingClientRect();
      if (pb.width >= 24 && pb.height >= 24) return;
    }
    const ex = exempt.find((e) => el.matches(e.selector));
    if (ex) { exemptHit.add(ex.selector); return; }
    const said = (el.getAttribute("aria-label") || el.textContent || el.value || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 24);
    /* FLOOR to one decimal, never round: a target reported as "219x24" against
       a 24px floor reads as a harness bug — it is 23.95, and rounding it up is
       the harness contradicting its own finding. Floor can only understate. */
    const d = (n) => Math.floor(n * 10) / 10;
    const key = name(el) + " " + d(b.width) + "x" + d(b.height);
    if (!smallBy.has(key)) smallBy.set(key, { label: name(el) + (said ? ' "' + said + '"' : "") + " " + d(b.width) + "x" + d(b.height), n: 0 });
    smallBy.get(key).n++;
  });

  return {
    overflow: de.scrollWidth - de.clientWidth,
    escapes: escapes.slice(0, 6),
    escapeCount: escapes.length,
    scrollers,
    hidden: hidden.slice(0, 6),
    hiddenCount: hidden.length,
    small: Array.from(smallBy.values()).map((v) => v.label + (v.n > 1 ? ` x${v.n}` : "")),
    smallCount: Array.from(smallBy.values()).reduce((a, v) => a + v.n, 0),
    exemptUsed: Array.from(exemptHit),
  };
}

/* Contrast of every painted text pair, composited through ancestors. A pair we
   cannot compute (a gradient, an image) is REPORTED as unmeasurable — counting
   it as a pass is how a page earns a clean bill it has not got. */
function CONTRAST() {
  const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (r, g, b) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const parse = (s) => {
    const m = /rgba?\(([^)]+)\)/.exec(s || "");
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({                     // alpha compositing
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
  });
  const ratio = (a, b) => {
    const l1 = lum(a.r, a.g, a.b), l2 = lum(b.r, b.g, b.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const name = (el) => el.tagName.toLowerCase() +
    (el.id ? "#" + el.id : "") +
    (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");

  /* A gradient is not unmeasurable — it is a SET of backgrounds, and text has to
     pass over all of them. Pull the colour stops and score the worst one. Only
     an image (which we genuinely cannot read) stays unmeasurable. Doing this
     matters here: Sierra's entire header is a gradient, so "unmeasurable" would
     permanently excuse the h1, the role line and the only link above the fold. */
  const gradientStops = (bgImage) => {
    if (!/gradient\(/.test(bgImage)) return null;
    const stops = (bgImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean);
    return stops.length ? stops : null;
  };

  const results = [], unmeasurable = [], notPainted = [];
  const seen = new Set();

  document.querySelectorAll("body *").forEach((el) => {
    // only elements painting their OWN text
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return;
    if (parseFloat(cs.opacity) === 0) return;
    if (el.closest(".skip-link, .sr-only, .s-sr")) return;

    let fg = parse(cs.color);
    if (!fg) return;
    // element opacity multiplies the text's own alpha — a .75-opacity pill is
    // painting lighter text than its `color` claims
    let opacity = 1, p = el;
    while (p && p !== document.documentElement) { opacity *= parseFloat(getComputedStyle(p).opacity); p = p.parentElement; }
    /* ⚠️ AN ANCESTOR AT opacity:0 PAINTS NOTHING, AND SCORING IT REPORTS 1:1 ON
       EVERY LINE OF A SCROLL-REVEAL SECTION. The first COBI sweep did exactly
       that: `our-process` wraps its sections in `.op-reveal{opacity:0}` and the
       run cried wolf 30 times on one tab — on text that is not on screen yet,
       in a tab that honours prefers-reduced-motion correctly. The element's OWN
       opacity was already skipped six lines up; this only makes the same rule
       uniform up the tree. They are counted, not swallowed, so a page that
       never reveals its text still shows up as a page with no measured text. */
    if (!(opacity > 0)) { notPainted.push(name(el)); return; }
    fg = { r: fg.r, g: fg.g, b: fg.b, a: fg.a * opacity };

    // walk up for an opaque background, compositing translucent layers
    let bg = null, stops = null, image = false, layers = [];
    let q = el;
    while (q) {
      const qs = getComputedStyle(q);
      if (qs.backgroundImage && qs.backgroundImage !== "none") {
        stops = gradientStops(qs.backgroundImage);
        if (stops) break;
        image = true; break;                       // a real image — we cannot read it
      }
      const c = parse(qs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a === 1) { bg = c; break; } }
      q = q.parentElement;
    }
    const label = name(el);
    if (seen.has(label + "|" + cs.color)) return;
    seen.add(label + "|" + cs.color);

    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const text = (el.textContent || "").trim().slice(0, 40);

    if (image || (!bg && !stops)) {
      unmeasurable.push({ el: label, color: cs.color, why: image ? "image background" : "no opaque background found" });
      return;
    }

    // Score against every candidate background and keep the WORST — text over a
    // gradient has to be legible at its lightest stop, not on average.
    const candidates = stops ? stops.slice() : [bg];
    let worst = Infinity, worstBg = null;
    candidates.forEach((cand) => {
      let base = cand;
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      const r = ratio(over(fg, base), base);
      if (r < worst) { worst = r; worstBg = base; }
    });
    results.push({ el: label, ratio: Math.round(worst * 100) / 100, need, pass: worst >= need - 0.005,
                   size: Math.round(size * 10) / 10, text,
                   over: stops ? `gradient (worst of ${candidates.length} stops)` : "solid" });
  });
  return { results, unmeasurable, notPainted };
}

/* Every target-size exemption pays for itself: the control it names as the
   equivalent route must EXIST and must itself clear the 24px floor. An
   exemption whose equivalent has gone missing is a defect, not a licence — so
   if anyone deletes the directory lists, the map pins stop being exempt.
   Runs as its own pass because reaching the equivalent means clicking a tab,
   and the measurement above must not be taken with the page rearranged; the
   original tab is restored before returning. */
function EXEMPT_CHECK(exempt) {
  const broken = [], ok = [];
  const active = document.querySelector(".tab.on");
  (exempt || []).forEach((e) => {
    (e.equivalent || []).forEach((alt) => {
      if (alt.revealBy) {
        const trigger = document.querySelector(alt.revealBy);
        if (!trigger) { broken.push(`${e.reason}: cannot reach ${alt.what} — no ${alt.revealBy}`); return; }
        trigger.click();
      }
      const nodes = Array.from(document.querySelectorAll(alt.sel))
        .filter((a) => a.getBoundingClientRect().height > 0);
      if (!nodes.length) { broken.push(`${e.reason}: ${alt.what} (${alt.sel}) has no visible rows`); return; }
      const bad = nodes.filter((a) => {
        const r = a.getBoundingClientRect();
        return r.width < 24 || r.height < 24;
      });
      if (bad.length) {
        const r = bad[0].getBoundingClientRect();
        broken.push(`${e.reason}: ${alt.what} is itself ${Math.round(r.width)}x${Math.round(r.height)} ` +
          `(${bad.length} of ${nodes.length} rows under the floor)`);
      } else {
        const r = nodes[0].getBoundingClientRect();
        ok.push(`${alt.what}: ${nodes.length} rows at ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
  });
  if (active) active.click();                       // leave the page as we found it
  return { broken, ok };
}

function HEADINGS() {
  const hs = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .filter((h) => h.getBoundingClientRect().height > 0)
    .map((h) => ({ level: +h.tagName[1], text: (h.textContent || "").trim().slice(0, 40) }));
  const skips = [];
  let prev = 0;
  hs.forEach((h) => { if (prev && h.level > prev + 1) skips.push(`h${prev} -> h${h.level} ("${h.text}")`); prev = h.level; });
  return { count: hs.length, first: hs.length ? hs[0].level : null, skips };
}
/* prefers-reduced-motion. A rule DECLARING an animation is not a defect — the
   page may animate normally and stand it down under the preference. The
   question is what COMPUTES with the preference set, and the elements that
   matter are usually not in the DOM at rest. */
function MOTION(known) {
  const knownUnreadable = [];
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const cs = getComputedStyle(el);
    /* Same 10ms floor the declared-rule check below uses, and for the same
       reason: the standard reduced-motion stand-down is `animation-duration:
       0.001ms`, not `none` — a hard stop silently breaks handlers waiting on
       animationend. At `> 0` this check called that stand-down "still
       animating" and disagreed with the other half of its own function. */
    if (cs.animationName && cs.animationName !== "none" && parseFloat(cs.animationDuration) > 0.01) {
      out.push((el.id ? "#" + el.id : el.tagName.toLowerCase()) +
        (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : "") +
        " (" + cs.animationName + ")");
    }
  });
  // CSS rules that declare an animation but are not currently mounted still
  // matter — the typing indicator only exists mid-answer. Read the sheets.
  // Rules that DECLARE an animation but are not mounted right now still
  // matter — the typing indicator only exists mid-answer. Reading the sheets
  // is the only way to see them, and an unreadable sheet is reported, never
  // skipped: silence here once meant "no animations" when it meant "could
  // not look".
  const declared = [], blockedSheets = [];
  const walk = (rules) => {
    for (const rule of Array.from(rules || [])) {
      if (rule.cssRules) walk(rule.cssRules);          // @media, @supports
      if (rule.style && rule.style.animationName && rule.style.animationName !== "none") {
        declared.push(rule.selectorText + " {" + rule.style.animationName + "}");
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try { rules = sheet.cssRules; }
    catch (e) {
      const href = sheet.href || "inline";
      /* A sheet from another origin can NEVER be read — that is the CORS rule,
         not a defect this project can fix. Naming it in the config (with the
         reason) keeps it visible and keeps the check honest: an unreadable
         sheet nobody declared still FAILS, so the day someone links a new one
         the run says so instead of quietly seeing less. */
      if ((known || []).some((k) => href.indexOf(k.match) !== -1)) knownUnreadable.push(href);
      else blockedSheets.push(href + " (" + e.name + ")");
      continue;
    }
    walk(rules);
  }

  /* A rule DECLARING an animation is not a defect — the page is allowed to
     animate normally and stand the animation down under a reduced-motion
     override. The question is what COMPUTES with the preference set, and
     the elements that matter (a typing indicator, a validation flash) are
     usually not in the DOM at rest. So build a probe carrying the
     selector's tag/id/classes, measure it, and throw it away. Asking the
     stylesheet what it says would fail a page that handles this correctly;
     asking the engine what it does is the actual question. */
  const stillAnimates = [];
  const probeTested = new Set();
  declared.forEach((entry) => {
    const sel = entry.slice(0, entry.lastIndexOf(" {"));
    sel.split(",").forEach((oneRaw) => {
      const one = oneRaw.trim();
      if (!one || probeTested.has(one)) return;
      probeTested.add(one);
      // drop pseudo-classes/elements and combinators; keep the last simple part
      const simple = one.replace(/::?[a-z-]+(\([^)]*\))?/g, "").split(/[\s>+~]+/).pop();
      if (!simple) return;
      const tag = (simple.match(/^[a-zA-Z][\w-]*/) || ["div"])[0];
      const probe = document.createElement(/^[a-zA-Z]/.test(simple) ? tag : "div");
      (simple.match(/\.[\w-]+/g) || []).forEach((c) => probe.classList.add(c.slice(1)));
      const idm = simple.match(/#([\w-]+)/);
      if (idm) probe.id = idm[1] + "-a11y-probe";       // never collide with the real node
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const dur = parseFloat(cs.animationDuration) || 0;
      if (cs.animationName && cs.animationName !== "none" && dur > 0.01) {
        stillAnimates.push(one + " (" + cs.animationName + ", " + cs.animationDuration + ")");
      }
      probe.remove();
    });
  });
  return { mounted: out, declared, stillAnimates, blockedSheets, knownUnreadable };
}

/* eslint-enable */

(async () => {
  let chromium;
  try { ({ chromium } = require("playwright")); }
  catch (e) {
    console.error("playwright is not installed. It is deliberately NOT a package.json dependency —\n" +
      "install it out of tree and point NODE_PATH at it, e.g.\n" +
      "  npm --prefix /tmp/pw install playwright && NODE_PATH=/tmp/pw/node_modules node " +
      path.relative(process.cwd(), __filename));
    process.exit(2);
  }
  const shotDir = flag("--shots");
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
  const verbose = argv.includes("--verbose");

  /* Selectors are `target` or `target:route`, so one tab can be re-measured in
     seconds while it is being fixed. Nothing named = everything. */
  const sel = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--shots" && argv[i - 1] !== "--config");
  const routeFilter = new Map();
  const keys = [];
  sel.forEach((s) => {
    const [k, r] = s.split(":");
    if (!PAGES[k]) { console.error(`Unknown target "${k}". Known: ${Object.keys(PAGES).join(", ")}`); process.exit(2); }
    if (!keys.includes(k)) keys.push(k);
    if (r) { if (!routeFilter.has(k)) routeFilter.set(k, new Set()); routeFilter.get(k).add(r); }
  });
  if (!keys.length) keys.push(...Object.keys(PAGES));

  const { srv, port } = await serve();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let bad = 0, routesRun = 0;

  /* Every request that leaves the origin is aborted — see the header. */
  const openPage = async (width, opts) => {
    const page = await browser.newPage(Object.assign({ viewport: { width, height: 900 } }, opts || {}));
    await page.route("**", (route) => {
      const u = route.request().url();
      return (u.startsWith(base) || u.startsWith("data:") || u.startsWith("blob:"))
        ? route.continue() : route.abort();
    });
    page.on("pageerror", () => {});                  // an aborted fetch is not a finding
    return page;
  };

  for (const key of keys) {
    const cfg = PAGES[key];
    const url = `${base}/${cfg.file}`;
    const widths = (cfg.widths || WIDTHS).slice().sort((a, b) => b - a);   // widest FIRST: it is the baseline
    const settle = cfg.settle || 450;

    /* Routes: what the config names, plus what the running app knows about
       itself. A `discover` that finds nothing is a FAILURE, never a quiet
       zero-route sweep — this repo has recorded "a check that never registers
       can never fail" three times, and a sweep that stops sweeping looks
       exactly like a sweep that passes. */
    let routes = (cfg.routes || []).map((r) => ({ hash: r.hash || "", name: r.name || r.hash || "" }));
    if (cfg.discover) {
      const disc = await openPage(widths[0]);
      await disc.goto(url, { waitUntil: "domcontentloaded" });
      await disc.waitForTimeout(settle);
      const found = await disc.evaluate((d) => Array.from(document.querySelectorAll(d.selector))
        .map((el) => el.getAttribute(d.attr)).filter(Boolean), cfg.discover);
      await disc.close();
      if (!found.length) {
        console.log(`\n══ ${cfg.title}\n   ${cfg.file}`);
        console.log(`   FAIL  discover found no routes for "${cfg.discover.selector}" — ` +
          `the selector is stale, and a zero-route sweep would have printed a clean bill.`);
        bad++;
        continue;
      }
      /* Dedupe on the NAME as well as the hash. COBI's config once named
         `{hash:"", name:"dashboard"}` explicitly while the nav ALSO carries a
         `dashboard` button, so the sweep ran two routes with one name — and
         because findings are keyed by name, every dashboard finding was
         recorded twice and the contrast pass ran twice at full cost. A
         duplicate route does not look like a bug; it looks like a slow run. */
      found.forEach((h) => {
        if (!routes.some((r) => r.hash === h || r.name === h)) routes.push({ hash: h, name: h });
      });
    }
    if (!routes.length) routes = [{ hash: "", name: "" }];
    if (routeFilter.has(key)) {
      routes = routes.filter((r) => routeFilter.get(key).has(r.name));
      if (!routes.length) { console.error(`No such route in "${key}".`); process.exit(2); }
    }

    console.log(`\n══ ${cfg.title}`);
    console.log(`   ${cfg.file} · ${routes.length} route(s) × ${widths.length} width(s)`);

    const found = new Map();                          // route name -> [finding strings]
    const note = (r, s) => { if (!found.has(r)) found.set(r, []); found.get(r).push(s); };
    const baseline = new Map();                       // route name -> hidden at the widest width

    for (const width of widths) {
      const page = await openPage(width);
      await page.goto(url + (routes[0].hash ? "#" + routes[0].hash : ""), { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(settle);
      if (cfg.seed) await cfg.seed(page);

      for (const route of routes) {
        await page.evaluate((h) => { if (location.hash.replace(/^#/, "") !== h) location.hash = h; }, route.hash);
        await page.waitForTimeout(cfg.routeSettle || 160);
        const r = await page.evaluate(MEASURE, measureCfg(cfg));
        if (width === widths[0]) { baseline.set(route.name, new Set(r.hidden)); routesRun++; }

        const at = `${width}px`;
        if (r.overflow > 0) note(route.name, `${at}  page scrolls sideways by ${r.overflow}px`);
        if (r.escapeCount) note(route.name, `${at}  ${r.escapeCount} element(s) escape the viewport: ${r.escapes.join(" | ")}`);
        const lost = r.hidden.filter((h) => !(baseline.get(route.name) || new Set()).has(h));
        if (lost.length) note(route.name, `${at}  ${lost.length} panel(s) dropped by a breakpoint: ${lost.join(", ")}`);
        r.scrollers.forEach((s) => {
          if (s.tabindex !== "0" && !s.focusableInside && !s.selfFocusable) note(route.name, `${at}  scrolling ${s.el} is not keyboard reachable`);
          if (s.tabindex === "0" && !s.label) note(route.name, `${at}  scrolling ${s.el} has no accessible name`);
        });
        if (r.smallCount) note(route.name, `${at}  ${r.smallCount} target(s) under 24x24 in ${r.small.length} kind(s): ${r.small.join(" · ")}`);

        if (r.exemptUsed.length) {
          const ex = await page.evaluate(EXEMPT_CHECK, cfg.targetSizeExempt || []);
          ex.broken.forEach((m) => note(route.name, `${at}  target-size exemption no longer holds — ${m}`));
          if (verbose && ex.ok.length) console.log(`   ${route.name || "(page)"} ${at}: pins exempt, equivalent verified — ${ex.ok.join("; ")}`);
        }

        /* Contrast, headings and the focus ring are properties of what is
           PAINTED, not of the width, so they are measured once per route — in
           this same page at the widest viewport, rather than in a second load. */
        if (width === widths[0]) {
          const c = await page.evaluate(CONTRAST);
          const fails = c.results.filter((x) => !x.pass);
          fails.forEach((f) => note(route.name, `contrast  ${f.ratio}:1 (needs ${f.need}) ${f.el} ${f.size}px [${f.over}] "${f.text}"`));
          c.unmeasurable.forEach((u) => note(route.name, `contrast  unmeasurable: ${u.el} ${u.color} — ${u.why}`));
          if (verbose) console.log(`   ${route.name || "(page)"}: ${c.results.length - fails.length}/${c.results.length} painted pairs meet AA` +
            (c.notPainted.length ? `; ${c.notPainted.length} not painted yet (opacity 0 — scroll reveal)` : ""));

          const h = await page.evaluate(HEADINGS);
          if (h.first !== 1) note(route.name, `headings  starts at h${h.first === null ? "—(none)" : h.first}, not h1`);
          if (h.skips.length) note(route.name, `headings  skips: ${h.skips.join("; ")}`);

          const noRing = await page.evaluate(() => {
            const out = [];
            document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[tabindex="0"]').forEach((el) => {
              if (el.getBoundingClientRect().height === 0) return;
              el.focus();
              const cs = getComputedStyle(el);
              const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) ||
                (cs.boxShadow && cs.boxShadow !== "none");
              if (!ring) out.push(el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") +
                (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/)[0] : ""));
            });
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            window.scrollTo(0, 0);                    // leave the route as the next measurement expects it
            return out;
          });
          if (noRing.length) note(route.name, `focus     ${noRing.length} focusable with no ring: ${noRing.slice(0, 6).join(", ")}`);
        }

        if (shotDir) {
          await page.screenshot({ path: path.join(shotDir, `${key}${route.name ? "-" + route.name : ""}-w${width}.png`) });
        }
      }
      await page.close();
    }

    /* ── functional keyboard checks (behaviour, not shape) ── */
    if (cfg.keyboard) {
      const kbp = await openPage(1024);
      await kbp.goto(url, { waitUntil: "domcontentloaded" });
      await kbp.waitForTimeout(settle);
      if (cfg.seed) await cfg.seed(kbp);
      await kbp.waitForTimeout(200);
      (await cfg.keyboard(kbp)).forEach((k) => {
        if (!k.ok) { console.log(`   keyboard  FAIL  ${k.name} — ${k.detail}`); bad++; }
        else if (verbose) console.log(`   keyboard  ok    ${k.name} — ${k.detail}`);
      });
      await kbp.close();
    }

    /* ── prefers-reduced-motion: a document-level property, so once per target ── */
    const rm = await openPage(1024, { reducedMotion: "reduce" });
    await rm.goto(url, { waitUntil: "domcontentloaded" });
    await rm.waitForTimeout(400);
    if (cfg.seed) await cfg.seed(rm);
    const moving = await rm.evaluate(MOTION, CFG.crossOriginSheets || []);
    const rmOk = !moving.mounted.length && !moving.stillAnimates.length && !moving.blockedSheets.length;
    if (!rmOk || verbose) {
      console.log(`   motion    ${rmOk ? "ok  " : "FAIL"}  under prefers-reduced-motion: ` +
        `${moving.mounted.length} animating now, ${moving.stillAnimates.length} of ` +
        `${moving.declared.length} declared animation(s) still compute` +
        (moving.stillAnimates.length ? ` — ${moving.stillAnimates.slice(0, 4).join(", ")}` : "") +
        (moving.knownUnreadable.length ? ` — ${moving.knownUnreadable.length} sheet(s) unreadable by CORS, declared in the config` : "") +
        (moving.blockedSheets.length ? ` — ${moving.blockedSheets.length} UNREADABLE sheet(s): ${moving.blockedSheets.join(", ")} (this check cannot see them, so it fails rather than passing)` : ""));
    }
    if (!rmOk) bad++;
    await rm.close();

    /* One line per route: the sweep has to stay readable at 38 of them. */
    const pad = Math.min(30, Math.max(...routes.map((r) => (r.name || "(page)").length)) + 2);
    routes.forEach((r) => {
      const label = (r.name || "(page)").padEnd(pad);
      const f = found.get(r.name) || [];
      if (!f.length) { if (verbose) console.log(`   ${label}ok`); return; }
      bad++;
      console.log(`   ${label}FAIL`);
      f.forEach((line) => console.log(`   ${" ".repeat(pad)}${line}`));
    });
    if (!verbose && ![...routes].some((r) => (found.get(r.name) || []).length)) {
      console.log(`   all ${routes.length} route(s) pass`);
    }
  }

  await browser.close();
  srv.close();
  console.log(bad
    ? `\n${bad} check(s) FAILED across ${routesRun} route(s).`
    : `\nAll checks pass across ${routesRun} route(s) in ${keys.length} target(s).`);
  process.exit(bad ? 1 : 0);
})();
