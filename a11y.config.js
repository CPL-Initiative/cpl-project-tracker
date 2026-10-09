/* ===========================================================================
   a11y.config.js — WHAT this project ships, for `npm run a11y`
   ---------------------------------------------------------------------------
   The engine (scripts/a11y.js) is project-agnostic and knows nothing about
   COBI. THIS file is the only part another project rewrites: copy the script,
   write your own targets, keep the one command. That split is the whole point
   of the file existing — Sam, 2026-09-04: "use the simplest approach that sets
   us up for continued long term use on all projects."

   Adding a view costs a config entry — or, where an app routes its own views,
   NOTHING. `discover` reads the routes out of the running page, so COBI's next
   tab is measured the day it ships and no one has to remember this file.
   ⚠️ That is deliberate, and it is the reason the sweep can be trusted as a
   sweep: a hand-maintained list of 37 tabs is a list that silently stops being
   37, and the tab it stops at is the new one nobody has audited.

   Per target:
     file            path under `root`, served over http (see the engine header)
     title           what the run prints
     routes          [{hash, name}] — explicit views inside one document
     discover        {selector, attr} — read more routes from the loaded page
     widths          override the default sweep (a 38-route target does not
                     need nine widths to find a broken breakpoint)
     mayHideBelow    selectors ALLOWED to vanish at narrow widths. Everything
                     else a breakpoint hides is REPORTED — that is how "the
                     whole side panel disappears on a phone" stops looking
                     like a design choice.
     targetSizeExempt  a documented WCAG 2.2 SC 2.5.8 exception. Never a skip:
                     the `equivalent` route must exist and clear 24px itself,
                     so deleting it turns the exemption back into a failure.
     seed / keyboard   functions; run in Playwright, not in the page.
   =========================================================================== */
// Opens one harvested catalog record in CPL Pathways through its selector.
/* Sierra's conversation view grows from empty, so an unseeded page hides most
   of what we came to measure. The seed switches to the asking view and writes
   ENOUGH turns, in the markup sierra.js writes, to make the page scroll past
   its height: a conversation that does not overflow cannot be tested for
   whether a keyboard reaches its end. One answer carries a table wider than a
   phone, and one a feedback row (Copy, the two ratings), so their targets,
   contrast and rings are measured too. */
async function seedSierraConversation(page, theme) {
  await page.evaluate((th) => {
    if (th === "dark") document.documentElement.setAttribute("data-theme", "dark");
    const api = window.CPL_SIERRA_PAGE;
    if (api && api.setView) api.setView("asking");
    const log = document.getElementById("s-log");
    if (!log) return;
    const table = '<table><thead><tr><th>Credential</th><th>Course</th>' +
      '<th>Units</th><th>College</th><th>C-ID</th></tr></thead><tbody>' +
      '<tr><td>FIW Orientation</td><td>WELD 100 Introduction to Welding Technology</td>' +
      '<td>3.0</td><td>Cerritos College</td><td>&mdash;</td></tr>' +
      '<tr><td>Post Tensioning 3</td><td>WELD 244 D1.1 Code Clinic</td>' +
      '<td>2.0</td><td>Santa Ana College</td><td>&mdash;</td></tr></tbody></table>';
    const fb = '<div class="s-fb"><button type="button" class="s-fb-copy" aria-label="Copy this answer to the clipboard">Copy</button>' +
      '<span>Rate this answer:</span>' +
      '<button type="button" class="s-fb-btn" aria-label="This answer was helpful">Helpful</button>' +
      '<button type="button" class="s-fb-btn" aria-label="This answer was not helpful">Not helpful</button>' +
      '<div class="s-fb-note" hidden></div></div>';
    for (let i = 0; i < 6; i++) {
      const you = document.createElement("div");
      you.className = "s-msg s-user";
      you.innerHTML = '<div class="s-bubble">Seeded question ' + (i + 1) +
        ': I have a journey worker license as an Iron and Steel worker. What CPL can I get here?</div>';
      log.appendChild(you);
      const her = document.createElement("div");
      her.className = "s-msg s-bot";
      her.innerHTML = '<div class="s-who"><span class="s-mark" aria-hidden="true">' +
        ((api && api.SIERRA_MARK) || '') + '</span>Sierra</div>' +
        '<div class="s-bubble"><p>Seeded answer ' + (i + 1) + ' for layout measurement, long ' +
        'enough to wrap on a narrow viewport and push the page past its own height. ' +
        'Ask the <a href="#s-main">CPL coordinator</a> at the college you plan to attend.</p>' +
        (i === 0 ? table : "") + '</div>';
      log.appendChild(her);
      if (i === 0) log.insertAdjacentHTML("beforeend", fb);
    }
    if (api && api.syncScrollRegions) api.syncScrollRegions();
  }, theme);
}
async function sierraArrivingChecks(page) {
  return [await page.evaluate(() => {
    const aud = document.getElementById("s-audience");
    return {
      name: "the audience picker is a group, not a false radiogroup",
      ok: aud.getAttribute("role") === "group",
      detail: 'role="' + aud.getAttribute("role") + '"',
    };
  }), await page.evaluate(() => {
    const form = document.getElementById("s-form");
    return {
      name: "arriving, the question bar rides the painting",
      ok: document.body.getAttribute("data-view") === "arriving" && !!form.closest("#s-frame"),
      detail: "view=" + document.body.getAttribute("data-view") + ", bar in " + (form.parentNode.id || "?"),
    };
  })];
}
async function sierraAskingChecks(page) {
  const out = [];
  /* The page scrolls, not the log (the redesign's centered column). If a
     future change makes the log a scroller of its own again, it must be
     focusable while it overflows (WCAG 2.1.1) — the guard the earlier
     "filled log is focusable" check carried. */
  out.push(await page.evaluate(() => {
    const log = document.getElementById("s-log");
    const logScrolls = log.scrollHeight > log.clientHeight + 1 &&
      /auto|scroll/.test(getComputedStyle(log).overflowY);
    const docScrolls = document.scrollingElement.scrollHeight > window.innerHeight + 1;
    return {
      name: "a filled conversation scrolls with the page (or, if the log scrolls itself, it is focusable)",
      ok: logScrolls ? log.getAttribute("tabindex") === "0" : docScrolls,
      detail: "log scrolls=" + logScrolls + ", page scrolls=" + docScrolls,
    };
  }));
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  out.push(await page.evaluate(() => ({
    name: "End reaches the latest answer",
    ok: window.scrollY > 0,
    detail: "scrollY after End = " + Math.round(window.scrollY),
  })));
  out.push(await page.evaluate(() => {
    window.scrollTo(0, 0);
    const b = document.getElementById("s-dock").getBoundingClientRect();
    return {
      name: "the docked bar stays on screen while reading",
      ok: b.top >= 0 && b.bottom <= window.innerHeight + 1,
      detail: "dock top=" + Math.round(b.top) + ", bottom=" + Math.round(b.bottom) + ", viewport=" + window.innerHeight,
    };
  }));
  out.push(await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return {
      name: "the page keeps its h1 while reading (clipped, never display:none)",
      ok: !!h1 && getComputedStyle(h1.parentNode).display !== "none" && getComputedStyle(h1).display !== "none",
      detail: h1 ? '"' + (h1.innerText || h1.textContent) + '"' : "no h1",
    };
  }));
  return out;
}
async function seedRoepRecord(page, theme, lay) {
  // The motion pass loads the page without a route, so open the tab here too.
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "cpl-pathways") location.hash = "cpl-pathways"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => {
    const s = document.querySelector("#cpl-pathways-root select.cplpw-select");
    return s && s.querySelector('optgroup[label="Catalog records, Beta draft"] option');
  }, null, { timeout: 60000 });
  await page.evaluate(() => {
    const s = document.querySelector("#cpl-pathways-root select.cplpw-select");
    const o = Array.from(s.querySelectorAll('optgroup[label="Catalog records, Beta draft"] option'))
      .find((x) => /Apprenticeship: Field Ironworkers/.test(x.textContent));
    if (o) { s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true })); }
  });
  if (lay === "term") await page.evaluate(() => {
    const b = document.querySelector('.cplpw-rseg button[data-value="term"]');
    if (b) b.click();
  });
  await page.waitForTimeout(200);
}

// Narrows CPL Pathways to one college through its College select (Sam, 2026-10-08).
async function seedCollegeSelect(page) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "cpl-pathways") location.hash = "cpl-pathways"; });
  await page.waitForFunction(() => {
    const s = document.querySelector("#cpl-pathways-root select.cplpw-colsel");
    return s && Array.from(s.options).some((o) => o.value === "Mt. San Antonio College");
  }, null, { timeout: 60000 });
  await page.evaluate(() => {
    const s = document.querySelector("#cpl-pathways-root select.cplpw-colsel");
    s.value = "Mt. San Antonio College";
    s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(200);
}

// Seeds the Program Requirements tab's Progress view with the live shape of
// 2026-10-07 (S343). The sweep aborts every request off the origin, so the
// tab's Supabase reads fail; the status file (kb/queue_status.json) is served
// and read for real. Each count matches what the tables held that day.
/* The docked Sierra, full screen with a conversation (S349). Seeded through
   the real path: the reader's role is confirmed on the chip, only the chat
   function's stream is stubbed, and six questions are asked, so the first one
   expands the dock exactly as a reader's would and every answer carries the
   feedback row cpl_chat.js writes. One answer carries a table wider than a
   phone. Program Requirements, because its Sierra is open by default. */
async function seedSierraDockFull(page, theme) {
  // The sweep aborts the tab's reads, and the read-failed state has no Sierra
  // section; the Progress seed paints the tab whole first.
  await seedProgress(page, theme);
  // First Light's once-a-day greeting opens 650 ms after load and would cover
  // the screenshots: mark the day seen and close it if it is up.
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
  });
  await page.waitForFunction(() => window.CPL_CHAT && document.querySelector("#prh-sierra-mount .cplchat .cplchat-dock-btn"),
    null, { timeout: 60000 });
  await page.evaluate(async () => {
    const wrap = document.querySelector("#prh-sierra-mount .cplchat");
    const chip = Array.from(wrap.querySelectorAll(".cplchat-aud-chip")).find((b) => /Faculty/.test(b.textContent));
    if (chip) chip.click();
    const table = "\n\n| Credential | Course | Units | College | C-ID |\n|---|---|---|---|---|\n" +
      "| FIW Orientation | WELD 100 Introduction to Welding Technology | 3.0 | Cerritos College | none |\n" +
      "| Post Tensioning 3 | WELD 244 D1.1 Code Clinic | 2.0 | Santa Ana College | none |\n";
    let n = 0;
    const real = window.fetch;
    window.fetch = function (url) {
      // The chat function's request, by the name its URL ends in. Spelled as a
      // pattern so kb/_build_dependency_map.py does not read the stub as a caller.
      if (!/\/cpl-chat(\?|$)/.test(String(url))) return real.apply(this, arguments);
      const text = "Seeded answer " + (++n) + " for layout measurement, long enough to wrap on a narrow viewport " +
        "and push the dialog past its own height. Ask the [CPL coordinator](https://example.org/cpl) at the college " +
        "you plan to attend." + (n === 1 ? table : "");
      const sse = "event: text\ndata: " + JSON.stringify({ text: text }) + "\n\nevent: done\ndata: {}\n\n";
      return Promise.resolve(new Response(sse, { status: 200, headers: { "Content-Type": "text/event-stream" } }));
    };
    const idle = () => new Promise((resolve) => {
      const t0 = Date.now();
      (function poll() {
        const box = document.querySelector(".cplchat-full .cplchat-input");
        if ((box && !box.disabled) || Date.now() - t0 > 5000) resolve(); else setTimeout(poll, 30);
      })();
    });
    for (let i = 0; i < 6; i++) {
      window.CPL_CHAT.ask("Seeded question " + (i + 1) + ": I have a journey worker license as an Iron and Steel worker. What CPL can I get here?");
      await new Promise((r) => setTimeout(r, 30));
      await idle();
    }
  });
  await page.waitForTimeout(200);
}
async function sierraDockFullChecks(page) {
  const out = [];
  out.push(await page.evaluate(() => {
    const w = document.querySelector(".cplchat.cplchat-full");
    const lab = w && document.getElementById(w.getAttribute("aria-labelledby") || "");
    return {
      name: "a send expands the dock: a modal dialog in <body>, named",
      ok: !!w && w.parentNode === document.body && w.getAttribute("role") === "dialog" &&
        w.getAttribute("aria-modal") === "true" && !!lab && lab.textContent.trim() === "Sierra AI",
      detail: w ? "role=" + w.getAttribute("role") + ", name=" + (lab ? '"' + lab.textContent.trim() + '"' : "none") : "not expanded",
    };
  }));
  out.push(await page.evaluate(() => {
    const w = document.querySelector(".cplchat-full");
    // A fixed layer above the dialog (First Light's greeting) stays live on purpose.
    const above = (k) => { const cs = getComputedStyle(k); return cs.position === "fixed" && (parseInt(cs.zIndex, 10) || 0) > 11000; };
    const open = Array.from(document.body.children).filter((k) => k !== w && !k.hasAttribute("inert") &&
      !above(k) && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(k.tagName));
    return {
      name: "the page behind is inert and does not scroll",
      ok: !open.length && getComputedStyle(document.documentElement).overflowY === "hidden",
      detail: open.length + " body children not inert; html overflow-y=" + getComputedStyle(document.documentElement).overflowY,
    };
  }));
  out.push(await page.evaluate(() => {
    const w = document.querySelector(".cplchat-full");
    w.scrollTop = 0;
    const r = w.querySelector(".cplchat-inputrow").getBoundingClientRect();
    return {
      name: "the question box stays on screen while reading from the top",
      ok: r.top >= 0 && r.bottom <= window.innerHeight + 1,
      detail: "box top=" + Math.round(r.top) + ", bottom=" + Math.round(r.bottom) + ", viewport=" + window.innerHeight,
    };
  }));
  await page.evaluate(() => { const w = document.querySelector(".cplchat-full"); w.scrollTop = 0; w.focus(); });
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  out.push(await page.evaluate(() => {
    const w = document.querySelector(".cplchat-full");
    return {
      name: "End reaches the latest answer",
      ok: w.scrollTop > 0 && w.scrollTop + w.clientHeight >= w.scrollHeight - 2,
      detail: "scrollTop after End = " + Math.round(w.scrollTop) + " of " + Math.round(w.scrollHeight - w.clientHeight),
    };
  }));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  out.push(await page.evaluate(() => {
    const w = document.querySelector("#prh-sierra-mount > .cplchat");
    return {
      name: "Escape takes her back to the tab, the conversation with her",
      ok: !document.querySelector(".cplchat-full") && !!w && w.querySelectorAll(".cplchat-msg").length === 12 &&
        !document.querySelector("body > [inert]") && document.activeElement === w.querySelector(".cplchat-dock-btn"),
      detail: (w ? w.querySelectorAll(".cplchat-msg").length + " turns in the tab" : "not in the tab") +
        ", focus on " + (document.activeElement && document.activeElement.className),
    };
  }));
  return out;
}

async function seedProgress(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "program-requirements") location.hash = "program-requirements"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => {
    const M = window.CPL_PROGRAM_REQUIREMENTS;
    return M && !M._state.loading && M._state.progress;
  }, null, { timeout: 60000 });
  await page.evaluate(() => {
    const M = window.CPL_PROGRAM_REQUIREMENTS, S = M._state;
    const reg = [];
    for (let i = 0; i < 118; i++) {
      const maps = i < 26, open = i < 2, refused = i >= 2 && i < 19;
      reg.push({ college: open ? ["Irvine Valley College", "Santa Monica College"][i] : i === 2 ? "Cerritos College" : "College " + i,
        catalog_url: "https://catalog.example/" + i, catalog_year: i < 94 ? "2026-2027" : "2025-2026",
        sequence_source: maps ? (i % 2 ? "ppm" : "program_map_page") : "none_found",
        sequence_host: maps ? "maps.example" : null, sequence_access: open ? "open" : refused ? "refused" : maps ? "not_read" : null,
        census_checked_at: "2026-10-04T15:38:14Z",
        procedure: i === 1 ? { v: 1 } : i === 2 ? { v: 4 } : null });
    }
    const recs = [];
    for (let i = 0; i < 20; i++) recs.push({ college: ["Cerritos College", "San Diego Miramar College", "Mt. San Antonio College",
      "Riverside City College", "West Los Angeles College"][i % 5], control_number: String(40000 + i), program_title: "Program " + i,
      checked: true, checked_at: "2026-10-04T10:22:45Z", display: { build: "8292780f6cd5", built: "2026-10-06" },
      record: { program: { outcomes: i === 7 ? [] : ["Outcome " + i] } } });
    const addenda = [];
    for (let i = 0; i < 79; i++) addenda.push({ college: "College " + (i % 52), status: "listed" });
    S.registry = reg; S.records = recs; S.error = null;
    S.progress = { addenda: addenda, active: 20282, queue: S.progress.queue, errors: S.progress.errors || {},
      readAt: new Date() };
    S.view = "progress";
    M._render();
  });
  await page.waitForTimeout(300);
}

// Seeds the Records view as a signed-in reviewer sees it (S347, Sheet 51 card 1): a record
// with flags on the whole record and on a block, its blocks open, and the verdict box with
// its Needs a fix note open, so every surface the flags and the verdict paint is measured.
async function seedRecords(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "program-requirements") location.hash = "program-requirements"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => {
    const M = window.CPL_PROGRAM_REQUIREMENTS;
    return M && !M._state.loading && M._state.progress;
  }, null, { timeout: 60000 });
  await page.evaluate(() => {
    const M = window.CPL_PROGRAM_REQUIREMENTS, S = M._state;
    const art = {
      college: "Irvine Valley College", control_number: "10265", program_title: "Art", award: "A.A. Degree",
      catalog_year: "2026-2027", source_url: "https://example.org/art", measure: "units", total_min: 27, total_max: 27,
      checked: false, requirements_fp: "fp-art",
      checks: { coverage: true, invented: true, arithmetic: "equal", reviewer: { by: "Sam", verdict: null } },
      record: { program: { measure: "units" }, blocks: [
        { name: "Choose 6 units", rule: "choose_units", minimum: 6, courses: [
          { code: "ARTH 4", units: 3, alternatives: [], catalog_addition: true },
          { code: "ARTH 27", units: 3, alternatives: [] }] }] },
      display: { build: "2360b83e8100", built: "2026-10-06", checks: { coverage: { listed: 23, placed: 21 }, additions: 4, arithmetic: "equal" },
        counts: { here: 0, courses: 2 }, figure: {}, courses: {},
        gaps: [
          { kind: "Catalog and state file differ", owner: "college", text: "The state's Program Course File lists ARTH C1100; the reader found it not in the text." },
          { kind: "Check not met", owner: "procedure", text: "The blocks add to 25.5 units; the catalog prints 26.5 units." },
          { kind: "Catalog and state file differ", owner: "college", text: "The catalog prints ARTH 4 for this program; the state's Program Course File does not list it." },
          { kind: "Reader's note", owner: "procedure", text: "No program learning outcomes are printed in the text." }] }
    };
    S.registry = [{ college: "Irvine Valley College", catalog_platform: "curriqunet", catalog_year: "2026-2027" }];
    S.records = [];
    S.review = { email: "reviewer@example.org", records: [art], verdicts: [], error: null };
    S.error = null;
    S.open = { "Irvine Valley College|10265": true };
    S.view = "records";
    M._render();
    const fix = document.querySelector("#program-requirements-root .prh-verdict button[aria-expanded]");
    if (fix) fix.click();
  });
  await page.waitForTimeout(300);
}

// Seeds My College's Reported expenditures section for the two targets below.
async function seedMyCollegeReports(page, signin) {
  await page.evaluate(() => new Promise((res) => {
    if (window.CPL_FUNDING_TAB) return res();
    const s = document.createElement("script"); s.src = "cpl_funding.js"; s.onload = res; s.onerror = res;
    document.head.appendChild(s);
  }));
  await page.evaluate((signin) => {
    const M = window.CPL_COLLEGE_BRIEFING, root = document.getElementById("college-briefing-root");
    if (!M || !root) return;
    const N = { "Chaffey College": 9 };
    M._state.data = { colleges: Object.keys(N), summaryByName: {}, nameToId: N, raw: { nameToId: N },
      briefing: { unread: [], leads: [], programs: [], strategyTotal: 0, scenario: "Scenario 2", year: "1" } };
    M._state.scope = "college"; M._state.college = "Chaffey College"; M._state.open = { reports: true };
    const rep = (o) => Object.assign({ college_id: 9, college: "Chaffey", fiscal_year: "2026-27", withdrawn: false,
      reported_by: "Pat Lee", reported_on: "2026-10-15", c1000: 42000, c2000: 18500, c3000: 12250, c4000: 3100,
      c5000: 26000, c6000: 0, c7000: 0, c_indirect: 4800, recorded_at: "2026-10-16T00:00:00Z" }, o);
    if (signin) { M._state.myReports = "signedout"; M._state.myRows = null; }
    else {
      M._state.myReports = "ready"; M._state.myEmail = "coord@chaffey.edu";
      M._state.myRows = [rep({}), rep({ fiscal_year: "2027-28", withdrawn: true, c1000: 0, c2000: 0, c3000: 0, c4000: 0,
        c5000: 0, c_indirect: 0, reported_by: null, reported_on: null, recorded_at: "2027-09-21T00:00:00Z" })];
    }
    M.render(root);
  }, signin);
  await page.waitForTimeout(400);
}

/* ── The veteran map (S350: First Light, one builder, three targets) ─────────
   The pin exemption and the keyboard checks are shared by the page as a reader
   opens it, the same page dark, and the embedded layout COBI's Military
   Partnerships iframe opens (?embed=1). */
/* WCAG 2.2 SC 2.5.8 has an "Essential" and an "Equivalent" exception, and
   the map pins are both. A pin's position and size ENCODE geography: at a
   390px viewport the whole state is ~390px wide, so growing 159 markers to
   24px would make the Los Angeles basin one solid blob and MISSTATE where
   the colleges are. And every one of them is reachable another way.

   The exemption is not a skip. `equivalent` must exist and must itself pass
   the 24px floor, so if anyone ever deletes the directory lists — the thing
   that makes the pins optional — this stops being exempt and the run fails.
   Measured: 115 college rows + 44 installation rows at 362x28 on a phone. */
const VETERAN_PIN_EXEMPT = [{
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
}];

/* Shape is not behaviour. tabindex on a <g> proves it can be focused; only
   pressing Enter proves it DOES anything. Every marker and every directory
   row was mouse-only before this run, so these are the checks that say the
   fix landed rather than that the attributes did. */
async function veteranMapChecks(page) {
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
}


module.exports = {
  /* Served over http from the repo root — same-origin is load-bearing, not
     tidiness; the engine header says why. */
  root: ".",

  /* The default sweep. 560/561 straddle the single-column breakpoint the
     presentation rules name, so a rule that fires one pixel late shows up. */
  widths: [320, 360, 390, 430, 560, 561, 768, 1024, 1440],

  /* Sheets this project links from another origin. CORS makes them unreadable
     to the reduced-motion check, which FAILS on an unreadable sheet rather than
     quietly seeing less of the page — so the ones that will never be readable
     are named here, with why, instead of being silently tolerated. Anything not
     on this list still fails. */
  crossOriginSheets: [
    { match: "fonts.googleapis.com", why: "web font faces only — declares no animation" },
  ],

  targets: {

  /* ── Sierra, the public page (the 2026-10-08 redesign, after america.gov) ──
     Two views on one page: arriving (a greeting, a First Light painting with the
     question bar on its top edge) and asking (the conversation in a centered
     column on paper, the bar docked). Each is measured in light and in dark,
     because a token swap is not a proof (see "COBI, dark" below).
     Below 560px the audience row folds behind its one control, "Answering
     for: …", which shows in its place; nothing else may vanish. */
  sierra: {
    file: "sierra/index.html",
    title: "Sierra (public CPL assistant), arriving",
    mayHideBelow: [".s-audience"],
    keyboard: async (page) => sierraArrivingChecks(page),
  },
  "sierra-dark": {
    file: "sierra/index.html",
    title: "Sierra, arriving, dark",
    mayHideBelow: [".s-audience"],
    seed: (page) => page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")),
    keyboard: async (page) => sierraArrivingChecks(page),
  },
  "sierra-asking": {
    file: "sierra/index.html",
    title: "Sierra, a conversation",
    mayHideBelow: [".s-audience"],
    seed: (page) => seedSierraConversation(page, "light"),
    keyboard: async (page) => sierraAskingChecks(page),
  },
  "sierra-asking-dark": {
    file: "sierra/index.html",
    title: "Sierra, a conversation, dark",
    mayHideBelow: [".s-audience"],
    seed: (page) => seedSierraConversation(page, "dark"),
    keyboard: async (page) => sierraAskingChecks(page),
  },
  "veteran-map": {
    file: "veteran-sprint-map/ca_cpl_map_selfcontained.html",
    title: "Veteran Sprint map (colleges x installations)",
    mayHideBelow: [],
    targetSizeExempt: VETERAN_PIN_EXEMPT,
    keyboard: async (page) => veteranMapChecks(page),
  },
  "veteran-map-dark": {
    file: "veteran-sprint-map/ca_cpl_map_selfcontained.html",
    title: "Veteran Sprint map, dark",
    mayHideBelow: [],
    seed: (page) => page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")),
    targetSizeExempt: VETERAN_PIN_EXEMPT,
    keyboard: async (page) => veteranMapChecks(page),
  },
  /* COBI's iframe opens the page with ?embed=1: above 980px it fills the frame as
     one column with its h1 and lede for the screen reader only. The harness's
     900px height sits inside the frame's range (calc(100vh - 170px), 700 up). */
  "veteran-map-embed": {
    file: "veteran-sprint-map/ca_cpl_map_selfcontained.html",
    query: "?embed=1",
    title: "Veteran Sprint map, embedded in COBI",
    mayHideBelow: [],
    targetSizeExempt: VETERAN_PIN_EXEMPT,
    keyboard: async (page) => veteranMapChecks(page),
  },

  /* ── COBI, the monolith ──────────────────────────────────────────────────
     37 tab panes behind hash routes in one document, and the reason this whole
     file exists. Sam, 2026-09-04: "I can't seem to get claude.md or memory to
     reliably enforce this when we are building day to day and I often forget to
     remind you." A rule states a standard; only a measurement detects a
     violation — so the standard gets an instrument, and the instrument covers
     EVERY view rather than the one somebody remembered to name.

     The routes are read from the nav at runtime (tabs.js derives its own
     VALID_TABS the same way, from the same buttons), so this entry never goes
     stale. Two widths, not nine: a 38-route target at nine widths is a
     ten-minute run nobody starts, and a breakpoint that breaks breaks on a
     phone. The nine-width sweep stays available per target for the pages where
     one pixel matters. */
  cobi: {
    file: "index.html",
    title: "COBI — every tab in the monolith",
    /* No explicit routes: `dashboard` is a nav button like every other tab, so
       discovery already returns it. Listing it here as `hash: ""` produced a
       SECOND route with the same name — see the dedupe note in the engine. */
    discover: { selector: "nav.cpl-tabs .cpl-tab[data-tab]", attr: "data-tab" },
    widths: [390, 1440],
    mayHideBelow: [
      /* The rail collapses to a drawer below the sidebar breakpoint and the
         drawer button opens it — a duplicate affordance, not a lost one. */
      ".cpl-sidebar", ".cpl-sidebar *",
      /* Tab panes are display:none by definition: 36 of the 37 are hidden at
         every moment, and the router is what hides them, not a breakpoint. */
      ".cpl-tab-pane", ".cpl-tab-pane *",
    ],
  },

  /* ── COBI, dark ──────────────────────────────────────────────────────────
     The same 38 routes with the theme switched. It is a SEPARATE target, not a
     width of `cobi`, because the two themes fail differently and a merged run
     could not say which one a finding belongs to.

     ⚠️ IT EXISTS BECAUSE A TOKEN SWAP IS NOT A PROOF. The dark palette reuses
     SkyView's measured values, so the CHROME is known-good — but every surface
     that reached for a raw hex instead of a token stays light-on-dark, and no
     amount of reading the palette finds those. This target is what turns "dark
     mode ships" into a number.

     Seeded through the control's own API rather than by writing localStorage
     and reloading: CPL_THEME.set() is the exact path the header uses, so the
     measurement exercises the shipped code rather than a fixture of it. */
  "cobi-dark": {
    file: "index.html",
    title: "COBI — every tab, dark",
    discover: { selector: "nav.cpl-tabs .cpl-tab[data-tab]", attr: "data-tab" },
    widths: [390, 1440],
    seed: async (page) => {
      await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
      await page.waitForTimeout(120);
    },
    mayHideBelow: [
      ".cpl-sidebar", ".cpl-sidebar *",
      ".cpl-tab-pane", ".cpl-tab-pane *",
    ],
  },

  /* ── SkyView ─────────────────────────────────────────────────────────────
     The built artifact, not its prototype/ccr_atlas_v1.html source: what ships
     is what gets measured. It opens full-window from the CCR side menu, so it
     is a first-class view even though it lives under prototype/. */
  skyview: {
    file: "prototype/skyview.html",
    title: "SkyView — the Common Course Reference as a map",
    /* The hash names the view (ccr_universe.js __ccrRoute): the map alone,
       the map with its panes, and the workspace's three toggles. */
    routes: [
      { hash: "skyview", name: "skyview" },
      /* The CPL face (Sam's rulings, 2026-09-07): the same map, named by the
         credential that reaches each point, with its coverage line and the
         two new controls in the row. */
      { hash: "skyview/cpl", name: "skyview-cpl" },
      /* Where the reader stands (Sam's rulings, 2026-09-07): #skyview is the
         Sky — the view that opens — and these are the Globe and the flat Map,
         one click away in the row. */
      { hash: "globe", name: "globe" },
      { hash: "map", name: "map" },
      { hash: "comprehensive", name: "comprehensive" },
      { hash: "disciplines", name: "disciplines" },
      { hash: "subjects", name: "subjects" },
      { hash: "esl", name: "esl" },
      { hash: "how", name: "how" },
      /* The course outline of record (Sam's ruling, 2026-09-06). A real id, not
         a placeholder: the layers render from the member roster and the
         description shards, so a route naming nothing measures an error page. */
      { hash: "outline/WELD M1109", name: "outline" },
      /* One discipline's work surface — the view double-click used to strand
         the reader in, now routable. */
      { hash: "work/Welding", name: "work" },
    ],
    widths: [390, 768, 1440],
    mayHideBelow: [
      // The detail panel opens hidden by design (Sam, 2026-09-04: "I want all
      // the real estate for the universe view") and the legend is foldable.
      ".u-inspector", ".u-inspector *", ".u-foot", ".u-foot *",
      // ⭐ The control row folds behind the word Controls below 1100px (Sam,
      // 2026-09-09: "It now takes up half the screen"). The harness is right
      // that a panel present at 1440px and absent at 390px is normally a page
      // silently losing a control — the difference here is that it is REACHABLE,
      // by a button in the row that says so and carries aria-controls="u-bar".
      // Declared rather than worked around: tests/ccr_skyview_mobile_row.test.js
      // holds the disclosure to that contract.
      "#u-bar", "#u-bar *",
    ],
  },

  /* ── CPL Fact Sheet ──────────────────────────────────────────────────────
     fact-sheet/check_mobile_layout.js asserts ITS statewide grid; this asks
     only what every page must answer. Both, because the first instrument in
     this repo to be pointed at one page found four defects nine jsdom suites
     had missed, and neither instrument subsumes the other. */
  "fact-sheet": {
    file: "fact-sheet/index.html",
    title: "CPL Fact Sheet (public)",
    mayHideBelow: [],
  },

  /* The privacy page Google's consent screen links for the Library filer
     (scripts/library_file.py); public, one column of prose (2026-10-06). */
  privacy: {
    file: "privacy.html",
    title: "Privacy: the CPL Library filer (public)",
    mayHideBelow: [],
  },

  /* ── The public funding explainer ────────────────────────────────────────
     funding-model/index.html hosts the Implementation Funding tab's own
     college section in embed mode and paints the rest from the engine. It is
     a shipped PUBLIC view — cpl_funding_public.html has redirected here since
     2026-09-09 and the URL went to colleges — and until 2026-09-12 no a11y
     target covered it: the tab it embeds is measured under `cobi`, the page
     around it by nothing. Distinct from scripts/check_public_page_layout.js
     (the lane's NEXT ⑥), which asserts one page's grid; this asks what every
     page must answer. Nothing may vanish at a narrow width: its breakpoints
     only re-stack grids.

     Measured when added (9 widths): 245 targets under 24x24 at every width
     — the embedded college section's per-college Confirm Participation links
     (cplfund-optin-jump), the detail carets (cplfund-caret, 19-22px tall), the
     Download-as-Excel button (cplfund-optbtn) and eight inputs — and, at
     430px and below, two scrolling .tablebox regions not keyboard reachable.
     All of it is cpl_funding.js's shared section, so the /a11y-pass on the
     funding tab fixes both surfaces at once. A target that fails is still the
     right target: this file measures, it does not certify. */
  "funding-model": {
    file: "funding-model/index.html",
    title: "Funding model explainer (public)",
    mayHideBelow: [],
  },

  /* ── The funding tab's Public view, and My CPL Funding (S307, 2026-09-30) ──
     Sam asked for the Public view and the explainer to be audited for
     consistent margins, AA and phone widths, and for My CPL Funding at the top
     of both with a college or district chooser. The `cobi` target measures the
     tab in its Internal view only, so these three hold the other renderings:
     the Public view by its link (?fundview=public), and the one-institution
     view on each surface, opened the way a reader opens it and set to the
     largest district, whose line and member blocks are the longest page it
     draws. */
  "funding-public": {
    file: "index.html",
    query: "?fundview=public",
    title: "Implementation Funding, Public view",
    routes: [{ hash: "implementation-funding", name: "public-view" }],
    widths: [390, 768, 1024, 1440],
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "funding-public-mycpl": {
    file: "index.html",
    query: "?fundview=public",
    title: "Implementation Funding, Public view: My CPL Funding for a district",
    routes: [{ hash: "implementation-funding", name: "my-cpl-funding" }],
    widths: [390, 768, 1024, 1440],
    seed: async (page) => {
      await page.evaluate(() => {
        const T = window.CPL_FUNDING_TAB;
        if (T && T.showMyFunding) T.showMyFunding();
        const pick = document.getElementById("cplFundOnePick");
        const opts = pick ? Array.from(pick.querySelectorAll('optgroup[label="Districts"] option')) : [];
        if (opts.length) { pick.value = opts[0].value; pick.dispatchEvent(new Event("change", { bubbles: true })); }
      });
      await page.waitForTimeout(900);
    },
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "funding-model-mycpl": {
    file: "funding-model/index.html",
    title: "Funding model explainer: My CPL Funding for a district",
    widths: [390, 768, 1024, 1440],
    seed: async (page) => {
      await page.evaluate(() => {
        const b = document.getElementById("my-funding-btn");
        if (b) b.click();
        const pick = document.getElementById("cplFundOnePick");
        const opts = pick ? Array.from(pick.querySelectorAll('optgroup[label="Districts"] option')) : [];
        if (opts.length) { pick.value = opts[0].value; pick.dispatchEvent(new Event("change", { bubbles: true })); }
      });
      await page.waitForTimeout(900);
    },
    mayHideBelow: [],
  },
  /* ── My College: Reported expenditures (S308, 2026-09-30) ─────────────────
     The Reporting box's college half. A contact MAP lists for a college reads
     its reports, read only; everyone else gets the sign-in. The cobi target
     opens My College on its scope question, so neither state is on screen
     there. These two targets seed each state the way cpl_funding_my_reports()
     would fill it (the sweep has no session to ask with); the sweep seeds once
     per width, so each state is its own target. */
  "my-college-reports": {
    file: "index.html",
    title: "My College: Reported expenditures, a contact's table",
    routes: [{ hash: "college-briefing", name: "reports-table" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMyCollegeReports(page, false),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── CPL Pathways: a harvested catalog record (S334) ──────────────────────
     The ROEP program view opens from the pathway selector, so the cobi sweep,
     which lands on the tab's first pathway, never paints it. One target per
     theme, seeded through the selector the reader uses, on the record with the
     most on screen (Cerritos Ironworker: an option fork, every CPL kind). */
  "cpl-pathways-roep": {
    file: "index.html",
    title: "CPL Pathways: a catalog record, By requirement",
    routes: [{ hash: "cpl-pathways", name: "roep-record" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedRoepRecord(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cpl-pathways-roep-dark": {
    file: "index.html",
    title: "CPL Pathways: a catalog record, By term, dark",
    routes: [{ hash: "cpl-pathways", name: "roep-record-term" }],
    widths: [390, 1440],
    seed: (page) => seedRoepRecord(page, "dark", "term"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cpl-pathways-college": {
    file: "index.html",
    title: "CPL Pathways: narrowed to one college",
    routes: [{ hash: "cpl-pathways", name: "college-select" }],
    widths: [390, 768, 1440],
    seed: (page) => seedCollegeSelect(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Program Requirements: the Progress view (S343) ─────────────────────
     The cobi sweep opens the tab with its Supabase reads aborted, so it
     paints the read-failed state. These two seed the view with the tables'
     2026-10-07 shape (the status file is served and read for real), one per
     theme: Sam asked that it be AA, mobile friendly and good in dark mode. */
  "program-requirements-progress": {
    file: "index.html",
    title: "Program Requirements: Progress",
    routes: [{ hash: "program-requirements", name: "progress" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedProgress(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "program-requirements-progress-dark": {
    file: "index.html",
    title: "Program Requirements: Progress, dark",
    routes: [{ hash: "program-requirements", name: "progress-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedProgress(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Program Requirements: the Records view, signed in (S347) ──────────
     Flags on the whole record and on a block, and the verdict box with its
     note open: the surfaces Sheet 51 card 1 added, one per theme. */
  "program-requirements-records": {
    file: "index.html",
    title: "Program Requirements: Records, signed in",
    routes: [{ hash: "program-requirements", name: "records" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedRecords(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "program-requirements-records-dark": {
    file: "index.html",
    title: "Program Requirements: Records, signed in, dark",
    routes: [{ hash: "program-requirements", name: "records-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedRecords(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── The docked Sierra, full screen (S349, Sheet 54 card 1) ─────────────
     Expanded over Program Requirements with six seeded turns, one per theme:
     the dialog, the page behind it inert, the sticky box, End and Escape. */
  "sierra-dock-full": {
    file: "index.html",
    title: "Sierra docked, full screen while she answers",
    routes: [{ hash: "program-requirements", name: "dock-full" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraDockFull(page, "light"),
    keyboard: async (page) => sierraDockFullChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-dock-full-dark": {
    file: "index.html",
    title: "Sierra docked, full screen while she answers, dark",
    routes: [{ hash: "program-requirements", name: "dock-full-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraDockFull(page, "dark"),
    keyboard: async (page) => sierraDockFullChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "my-college-reports-signin": {
    file: "index.html",
    title: "My College: Reported expenditures, the sign-in",
    routes: [{ hash: "college-briefing", name: "reports-signin" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMyCollegeReports(page, true),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  },
};
