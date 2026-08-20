/* ===========================================================================
   Public standalone pages — real-layout accessibility + mobile check
   ---------------------------------------------------------------------------
   Chromium, on demand. NOT in tests/ and NOT run by `npm test`, deliberately —
   the same split fact-sheet/check_mobile_layout.js established on 2026-08-20:
   CI has jsdom only, jsdom has no layout engine, and adding playwright to
   package.json would make CI download a browser for a check it never runs.

   That split is the whole point. The Fact Sheet had NINE committed jsdom suites
   and a WCAG-annotated stylesheet, and an audit still found four real defects,
   because the ones that mattered were GEOMETRIC. getBoundingClientRect() returns
   zeroes in jsdom, so a structural suite cannot tell you that a column is 31px
   wider than the phone it is on, or that a whole panel is display:none below a
   breakpoint. Structure lives in tests/*.test.js; GEOMETRY lives here.

   This file is the generic half — the measurements that are true of any page —
   so a third public page costs a config block, not a new harness. The Fact
   Sheet keeps its own script because its assertions are about ITS statewide
   grid; this one asks only what every page must answer.

   What it measures, per page, at nine viewport widths:
     · horizontal overflow of the document, and which elements escape
     · panels dropped by a breakpoint — an element that is display:none on a
       phone and visible on a desktop is REPORTED, because a page that silently
       loses a feature looks complete. Config lists the ones that are meant to
       go (`mayHideBelow`); everything else is a finding.
     · scrollable regions: focusable exactly while they overflow, and named
     · interactive targets below the WCAG 2.2 AA 24x24 minimum
     · text/background contrast of every painted pair, composited through
       ancestors. Pairs it CANNOT compute (gradient, image) are reported as
       unmeasurable, never counted as passes.
     · heading order, and skipped levels
     · a focus indicator on every focusable element
     · prefers-reduced-motion actually stopping every animation
     · per-page FUNCTIONAL keyboard checks (behaviour, not shape)

   ⚠️ One thing this instrument cannot see: Chromium 127+ makes an OVERFLOWING
   scroll container keyboard-focusable with no tabindex, so a missing tabindex
   on a scroller does not reproduce as a behaviour failure here. That is why the
   scroller check reads the ATTRIBUTE rather than pressing a key — the browser
   doing the measuring is more forgiving than the browsers being measured.

   Usage:
     node scripts/check_public_page_layout.js               # every page
     node scripts/check_public_page_layout.js sierra        # one page by key
     node scripts/check_public_page_layout.js --shots DIR   # + screenshots

   ⚠️ IT SERVES THE REPO OVER http:// RATHER THAN OPENING file:// URLs, and that
   is load-bearing, not tidiness. Under file:// Chromium treats every linked
   stylesheet as a separate opaque origin, so `sheet.cssRules` throws a
   SecurityError. The reduced-motion check reads the sheets to find animations
   that are DECLARED but not currently mounted (Sierra's typing indicator only
   exists mid-answer) — and under file:// it caught the throw, read nothing, and
   printed "ok". It was vacuous on the very first page it was pointed at, in a
   repo that has now recorded "a check that never registers can never fail"
   three times. The server also gives localStorage a real origin. `blockedSheets`
   below is the belt: if a sheet is ever unreadable again the run FAILS rather
   than quietly passing.

   Exits non-zero on a defect, so it can gate a release by hand. Requires
   playwright + a Chromium; in the sandbox that is the newest chromium build
   under /opt/pw-browsers (PLAYWRIGHT_CHROMIUM overrides). If playwright is not
   in the repo tree, NODE_PATH can point at an out-of-tree install — keeping it
   out of package.json is the rule, not an accident.
   =========================================================================== */
const path = require("path");
const fs = require("fs");
const http = require("http");

const WIDTHS = [320, 360, 390, 430, 560, 561, 768, 1024, 1440];
const REPO = path.resolve(__dirname, "..");

/* Per-page config. `mayHideBelow` names selectors that are ALLOWED to vanish at
   narrow widths (decoration, a duplicate affordance). Anything else that a
   breakpoint hides is reported — that is how "the whole side panel disappears
   on a phone" becomes visible instead of looking like a design choice. */
const PAGES = {
  sierra: {
    file: "sierra/index.html",
    title: "Sierra (public CPL assistant)",
    mayHideBelow: [],
    /* The log is made focusable by sierra.js only while it overflows. Proving
       that means growing it and asking, not reading the markup. */
    keyboard: async (page) => {
      const out = [];
      out.push(await page.evaluate(() => {
        const log = document.getElementById("s-log");
        return {
          name: "a filled conversation log is focusable",
          ok: log.scrollHeight > log.clientHeight + 1 && log.getAttribute("tabindex") === "0",
          detail: "overflows=" + (log.scrollHeight > log.clientHeight + 1) +
                  ", tabindex=" + log.getAttribute("tabindex"),
        };
      }));
      /* ⚠️ REGRESSION GUARD, NOT PROOF OF THE FIX — and the reason is worth
         knowing before you trust any Chromium a11y harness.

         Chromium 127+ ships "keyboard-focusable scrollers": a div that ACTUALLY
         OVERFLOWS is focusable with no tabindex at all (measured here on 141 —
         an overflowing div focuses, an identical non-overflowing one does not).
         So this check passes against the pre-fix page, and so did an earlier
         `document.activeElement === log` version. THE MEASURING BROWSER HIDES
         THE DEFECT. Not every engine does this, and Chromium's implicit
         focusability gives the region no role and no accessible name either, so
         the explicit tabindex is still the correct fix — it is just not
         something Chrome can be asked to demonstrate.

         The fix proof is the check above (tabindex is present exactly while the
         log overflows) and the per-viewport scroller check, which read the
         markup. This one guards against the scrolling itself breaking. */
      await page.evaluate(() => {
        const log = document.getElementById("s-log");
        log.scrollTop = 0;
        log.focus();
      });
      await page.keyboard.press("End");
      await page.waitForTimeout(200);
      out.push(await page.evaluate(() => {
        const log = document.getElementById("s-log");
        return {
          name: "a keypress scrolls the log [regression guard — Chromium auto-focuses scrollers]",
          ok: log.scrollTop > 0,
          detail: "scrollTop after End = " + Math.round(log.scrollTop) +
                  "px of " + Math.round(log.scrollHeight - log.clientHeight) + "px",
        };
      }));
      out.push(await page.evaluate(() => {
        const aud = document.getElementById("s-audience");
        return {
          name: "the audience picker is a group, not a false radiogroup",
          ok: aud.getAttribute("role") === "group",
          detail: 'role="' + aud.getAttribute("role") + '"',
        };
      }));
      return out;
    },
    // The chat log grows from empty, so an unseeded page hides most of what we
    // came to measure. Seed ENOUGH turns to make .s-log actually overflow — a
    // scroll container that does not scroll cannot be tested for whether it is
    // keyboard reachable, and one seeded message never overflowed.
    seed: async (page) => {
      await page.evaluate(() => {
        const log = document.getElementById("s-log");
        if (!log) return;
        const table = '<table><thead><tr><th>Credential</th><th>Course</th>' +
          '<th>Units</th><th>College</th><th>C-ID</th></tr></thead><tbody>' +
          '<tr><td>FIW Orientation</td><td>WELD 100 Introduction to Welding Technology</td>' +
          '<td>3.0</td><td>Cerritos College</td><td>&mdash;</td></tr>' +
          '<tr><td>Post Tensioning 3</td><td>WELD 244 D1.1 Code Clinic</td>' +
          '<td>2.0</td><td>Santa Ana College</td><td>&mdash;</td></tr></tbody></table>';
        for (let i = 0; i < 6; i++) {
          const you = document.createElement("div");
          you.className = "s-msg s-user";
          you.innerHTML = '<div class="s-bubble"><p>Seeded question ' + (i + 1) +
            ': I have a journey worker license as an Iron and Steel worker. ' +
            'What CPL can I get here?</p></div>';
          log.appendChild(you);
          const her = document.createElement("div");
          her.className = "s-msg";
          her.innerHTML = '<div class="s-avatar" aria-hidden="true"></div>' +
            '<div class="s-bubble"><p>Seeded answer ' + (i + 1) + ' for layout ' +
            'measurement, long enough to wrap on a narrow viewport and push the ' +
            'log past its own height.</p>' + (i === 0 ? table : "") + '</div>';
          log.appendChild(her);
        }
        // sierra.js REMOVES the starter chips after the first question
        // (`suggestEl.remove()`), so the steady state of this page is a log with
        // no focusable child. Measuring the pristine page hides that: the chips
        // made the log look keyboard-reachable at exactly the moment it had
        // nothing to scroll, and the reachability vanished the moment it did.
        const sug = document.getElementById("s-suggest");
        if (sug) sug.remove();
        log.scrollTop = log.scrollHeight;
      });
    },
  },
  "veteran-map": {
    file: "veteran-sprint-map/ca_cpl_map_selfcontained.html",
    title: "Veteran Sprint map (colleges x installations)",
    mayHideBelow: [],
    /* WCAG 2.2 SC 2.5.8 has an "Essential" and an "Equivalent" exception, and
       the map pins are both. A pin's position and size ENCODE geography: at a
       390px viewport the whole state is ~390px wide, so growing 159 markers to
       24px would make the Los Angeles basin one solid blob and MISSTATE where
       the colleges are. And every one of them is reachable another way.

       The exemption is not a skip. `equivalent` must exist and must itself pass
       the 24px floor, so if anyone ever deletes the directory lists — the thing
       that makes the pins optional — this stops being exempt and the run fails.
       Measured: 115 college rows + 44 installation rows at 362x28 on a phone. */
    targetSizeExempt: [{
      selector: "#g-colleges .mk, #g-bases .mk",
      reason: "geographic pin — size and position are essential (SC 2.5.8 Essential)",
      /* `revealBy` is part of the claim, not a convenience: the equivalent
         route is behind a tab, so saying so is what makes the exemption
         checkable. A first cut asserted the lists directly, measured them
         while their panel was display:none, and reported the exemption broken
         — the honest failure, and the fix is to state the path. */
      equivalent: [
        { sel: "#list-col li", revealBy: '.tab[data-tab="colleges"]', what: "college directory" },
        { sel: "#list-base li", revealBy: '.tab[data-tab="bases"]', what: "installation directory" },
      ],
    }],
    /* Shape is not behaviour. tabindex on a <g> proves it can be focused; only
       pressing Enter proves it DOES anything. Every marker and every directory
       row was mouse-only before this run, so these are the checks that say the
       fix landed rather than that the attributes did. */
    keyboard: async (page) => {
      const out = [];
      out.push(await page.evaluate(() => {
        const mk = document.querySelector("#g-colleges .mk");
        if (!mk) return { name: "a college pin is focusable", ok: false, detail: "no marker found" };
        mk.focus();
        return {
          name: "a college pin is focusable and named",
          ok: document.activeElement === mk && !!mk.getAttribute("aria-label"),
          detail: "label=" + (mk.getAttribute("aria-label") || "(none)").slice(0, 46),
        };
      }));
      await page.keyboard.press("Enter");
      await page.waitForTimeout(200);
      out.push(await page.evaluate(() => {
        const h = document.querySelector("#detail h2");
        return {
          name: "Enter on a pin renders that college's detail",
          ok: !!h && h.textContent.trim().length > 0,
          detail: h ? h.textContent.trim().slice(0, 40) : "detail pane still empty",
        };
      }));
      out.push(await page.evaluate(() => {
        const t = document.querySelector('.tab[data-tab="colleges"]');
        if (t) t.click();
        const li = document.querySelector("#list-col li");
        if (!li) return { name: "a directory row is operable", ok: false, detail: "no rows" };
        li.focus();
        const focused = document.activeElement === li;
        li.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        const h = document.querySelector("#detail h2");
        return {
          name: "a directory row is focusable and Enter selects it",
          ok: focused && !!h && h.textContent.trim().length > 0,
          detail: "focusable=" + focused + ", detail=" + (h ? h.textContent.trim().slice(0, 30) : "empty"),
        };
      }));
      return out;
    },
  },
};

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
  const small = [], exemptHit = new Set();
  document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[role="button"]').forEach((el) => {
    let b = el.getBoundingClientRect();
    if (b.width === 0 && b.height === 0) return;      // not rendered
    if (el.closest(".skip-link, .sr-only, .s-skip, .s-sr")) return;
    if (el.tagName === "A" && el.closest("p, li, footer, .s-bubble")) return;  // inline text link exception
    const lab = el.closest("label") ||
      (el.id ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]') : null);
    if (lab) {
      const lb = lab.getBoundingClientRect();
      if (lb.width > 0 && lb.height > 0) b = lb;
    }
    if (b.width >= 24 && b.height >= 24) return;
    const ex = exempt.find((e) => el.matches(e.selector));
    if (ex) { exemptHit.add(ex.selector); return; }
    small.push(name(el) + " " + Math.round(b.width) + "x" + Math.round(b.height));
  });

  return {
    overflow: de.scrollWidth - de.clientWidth,
    escapes: escapes.slice(0, 6),
    escapeCount: escapes.length,
    scrollers,
    hidden: hidden.slice(0, 6),
    hiddenCount: hidden.length,
    small: small.slice(0, 6),
    smallCount: small.length,
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

  const results = [], unmeasurable = [];
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
  return { results, unmeasurable };
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
  const argv = process.argv.slice(2);
  const shotsAt = argv.indexOf("--shots");
  const shotDir = shotsAt !== -1 ? argv[shotsAt + 1] : null;
  if (shotDir) fs.mkdirSync(shotDir, { recursive: true });
  const only = argv.filter((a) => !a.startsWith("--") && a !== shotDir);
  const keys = only.length ? only : Object.keys(PAGES);
  for (const k of keys) if (!PAGES[k]) { console.error(`Unknown page "${k}". Known: ${Object.keys(PAGES).join(", ")}`); process.exit(2); }

  const { srv, port } = await serve();
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  let bad = 0;

  for (const key of keys) {
    const cfg = PAGES[key];
    const url = `http://127.0.0.1:${port}/${cfg.file}`;
    console.log(`\n══ ${cfg.title}\n   ${cfg.file}`);

    // Establish the desktop baseline of what is on screen, so a narrow-width
    // disappearance can be told from something that was never there.
    const wide = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await wide.goto(url, { waitUntil: "domcontentloaded" });
    await wide.waitForTimeout(500);
    if (cfg.seed) await cfg.seed(wide);
    const baseHidden = new Set((await wide.evaluate(MEASURE, measureCfg(cfg))).hidden);
    await wide.close();

    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(450);
      if (cfg.seed) await cfg.seed(page);
      await page.waitForTimeout(120);
      const r = await page.evaluate(MEASURE, measureCfg(cfg));

      const problems = [];
      if (r.overflow > 0) problems.push(`page scrolls sideways by ${r.overflow}px`);
      if (r.escapeCount) problems.push(`${r.escapeCount} element(s) escape the viewport`);
      const lost = r.hidden.filter((h) => !baseHidden.has(h));
      if (lost.length) problems.push(`${lost.length} panel(s) dropped by a breakpoint: ${lost.join(", ")}`);
      r.scrollers.forEach((s) => {
        if (s.tabindex !== "0" && !s.focusableInside) problems.push(`scrolling ${s.el} is not keyboard reachable`);
        if (s.tabindex === "0" && !s.label) problems.push(`scrolling ${s.el} has no accessible name`);
      });
      if (r.smallCount) problems.push(`${r.smallCount} target(s) under 24x24: ${r.small.join(", ")}`);

      let exempt = { broken: [], ok: [] };
      if (r.exemptUsed.length) {
        exempt = await page.evaluate(EXEMPT_CHECK, cfg.targetSizeExempt || []);
        exempt.broken.forEach((m) => problems.push(`target-size exemption no longer holds — ${m}`));
      }

      console.log(`${String(width).padStart(6)}px  ${problems.length ? "FAIL  " + problems.join("; ") : "ok"}` +
        (exempt.ok.length && !problems.length
          ? `   (pins exempt; equivalent route verified — ${exempt.ok.join("; ")})` : ""));
      if (r.escapes.length) console.log(`           escapes: ${r.escapes.join(" | ")}`);
      if (problems.length) bad++;

      if (shotDir) {
        await page.screenshot({ path: path.join(shotDir, `${key}-w${width}.png`), fullPage: false });
      }
      await page.close();
    }

    // ── functional keyboard checks (behaviour, not shape) ──
    if (cfg.keyboard) {
      const kbp = await browser.newPage({ viewport: { width: 1024, height: 900 } });
      await kbp.goto(url, { waitUntil: "domcontentloaded" });
      await kbp.waitForTimeout(500);
      if (cfg.seed) await cfg.seed(kbp);
      await kbp.waitForTimeout(200);
      const results = await cfg.keyboard(kbp);
      results.forEach((k) => {
        console.log(`  keyboard   ${k.ok ? "ok  " : "FAIL"}  ${k.name} — ${k.detail}`);
        if (!k.ok) bad++;
      });
      await kbp.close();
    }

    // ── contrast, headings, focus, motion — measured once, at desktop ──
    const pg = await browser.newPage({ viewport: { width: 1024, height: 900 } });
    await pg.goto(url, { waitUntil: "domcontentloaded" });
    await pg.waitForTimeout(500);
    if (cfg.seed) await cfg.seed(pg);
    await pg.waitForTimeout(120);

    const c = await pg.evaluate(CONTRAST);
    const fails = c.results.filter((x) => !x.pass);
    console.log(`  contrast   ${fails.length ? "FAIL" : "ok  "}  ${c.results.length - fails.length}/${c.results.length} painted pairs meet AA` +
      (c.unmeasurable.length ? `; ${c.unmeasurable.length} unmeasurable (gradient/image)` : ""));
    fails.forEach((f) => console.log(`             ${f.ratio}:1 (needs ${f.need}) ${f.el} ${f.size}px [${f.over}] "${f.text}"`));
    c.unmeasurable.forEach((u) => console.log(`             unmeasurable: ${u.el} ${u.color} — ${u.why}`));
    if (fails.length) bad++;

    const h = await pg.evaluate(HEADINGS);
    const hOk = h.first === 1 && !h.skips.length;
    console.log(`  headings   ${hOk ? "ok  " : "FAIL"}  ${h.count} heading(s), starts at h${h.first}` +
      (h.skips.length ? `, SKIPS: ${h.skips.join("; ")}` : ""));
    if (!hOk) bad++;

    // Focus indicator: tab through and require a visible change (outline, ring
    // or shadow). A UA default counts — what we are catching is a stylesheet
    // that sets `outline:none` and puts nothing back.
    const focus = await pg.evaluate(() => {
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
      return out;
    });
    console.log(`  focus      ${focus.length ? "FAIL" : "ok  "}  ${focus.length ? focus.slice(0, 6).join(", ") + " have no focus indicator" : "every focusable shows a ring"}`);
    if (focus.length) bad++;
    await pg.close();

    // ── prefers-reduced-motion: nothing may still be animating ──
    const rm = await browser.newPage({ viewport: { width: 1024, height: 900 }, reducedMotion: "reduce" });
    await rm.goto(url, { waitUntil: "domcontentloaded" });
    await rm.waitForTimeout(400);
    if (cfg.seed) await cfg.seed(rm);
    const moving = await rm.evaluate(() => {
      const out = [];
      document.querySelectorAll("body *").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== "none" && parseFloat(cs.animationDuration) > 0) {
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
        catch (e) { blockedSheets.push((sheet.href || "inline") + " (" + e.name + ")"); continue; }
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
      return { mounted: out, declared, stillAnimates, blockedSheets };
    });
    const rmOk = moving.mounted.length === 0 && moving.stillAnimates.length === 0 && moving.blockedSheets.length === 0;
    console.log(`  motion     ${rmOk ? "ok  " : "FAIL"}  under prefers-reduced-motion: ` +
      `${moving.mounted.length} animating now, ${moving.stillAnimates.length} of ` +
      `${moving.declared.length} declared animation(s) still compute` +
      (moving.stillAnimates.length ? ` — ${moving.stillAnimates.slice(0, 4).join(", ")}` : "") +
      (moving.blockedSheets.length ? ` — ${moving.blockedSheets.length} UNREADABLE sheet(s): ${moving.blockedSheets.join(", ")} (this check cannot see them, so it fails rather than passing)` : ""));
    if (!rmOk) bad++;
    await rm.close();
  }

  await browser.close();
  srv.close();
  console.log(bad ? `\n${bad} check(s) FAILED` : `\nAll checks pass across ${keys.length} page(s).`);
  process.exit(bad ? 1 : 0);
})();
