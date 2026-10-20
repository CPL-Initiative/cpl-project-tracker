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

// CPL Pathways' catalog records as the table serves them (Sheet 65 card 2, S367). The
// sweep aborts the table reads, so the seed hands the tab the list it would have read
// (the pilot's programs, an unchecked record with a long title, and one record no read
// has fetched) through the tab's own landing path, then opens one of the two:
//   "unchecked"  the record read from the table, marked Not yet confirmed;
//   "failed"     a record whose read fails (the sweep aborts it), which says so.
async function seedRoepTable(page, theme, which) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "cpl-pathways") location.hash = "cpl-pathways"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => {
    const T = window.CPL_PATHWAYS_TAB;
    const s = document.querySelector("#cpl-pathways-root select.cplpw-select");
    return T && T._roepTable && s && s.querySelector('optgroup[label="Catalog records, Beta draft"] option');
  }, null, { timeout: 60000 });
  await page.evaluate((which) => {
    const T = window.CPL_PATHWAYS_TAB, R = T._roepTable;
    const file = (window.CPL_PATHWAYS_ROEP || {}).programs || [];
    const base = file.find((p) => /Field Ironworkers/.test(p.title)) || file[0];
    const lbcc = { college: "Long Beach City College", control_number: "37305",
      program_title: "Ironworking Technology: Reinforcing and Structural Field Practice", award: "Certificate of Achievement", checked: false };
    const unread = { college: "Norco College", control_number: "90001", program_title: "A Record No Read Has Fetched", award: "A.S. Degree", checked: false };
    R.index = [lbcc, unread].concat(file.map((p) => ({ college: p.college, control_number: p.control_number,
      program_title: p.title, award: p.award, checked: !!(p.display && p.display.checks && p.display.checks.checked) })));
    const disp = JSON.parse(JSON.stringify(base.display));
    disp.checks = Object.assign({}, disp.checks, { checked: false });
    R.records[lbcc.college + "|" + lbcc.control_number] = { key: lbcc.college + "|" + lbcc.control_number, table: true,
      college: lbcc.college, control_number: lbcc.control_number, title: lbcc.program_title, award: lbcc.award,
      catalog_year: base.catalog_year, source_url: base.source_url, platform: "custom_html", measure: base.measure,
      record: base.record, display: disp, checked: false };
    R.error = null;
    T._roepIndexLanded();
    const s = document.querySelector("#cpl-pathways-root select.cplpw-select");
    const want = which === "failed" ? /A Record No Read Has Fetched/ : /Ironworking Technology: Reinforcing/;
    const o = Array.from(s.querySelectorAll('optgroup[label="Catalog records, Beta draft"] option')).find((x) => want.test(x.textContent));
    if (o) { s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true })); }
  }, which);
  await page.waitForTimeout(400);
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

// Seeds the Program Requirements tab's Progress view with the shape of
// 2026-10-18 (S415; first seeded S343). The sweep aborts every request off the
// origin, so the tab's Supabase reads fail; the status file (kb/status/program-requirements.json)
// is served and read for real.
// The Common Subjects Reference's Progress view (S425, the Commons' dash for the
// reference): opened by its route, the shared module lazy-loaded, the seed read for real
// (the live picks fail off the origin and the view says so), then the theme.
async function seedCsrProgress(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "canonical-subj4/progress") location.hash = "canonical-subj4/progress"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => {
    const M = window.CPL_CANONICAL_SUBJ4;
    return M && M._state.seed && document.querySelector("#cs-progress .prh-pg");
  }, null, { timeout: 60000 });
  await page.waitForTimeout(300);
}

/* The docked Sierra, full screen with a conversation (S349). Seeded through
   the real path: the reader's role is confirmed on the chip, only the chat
   function's stream is stubbed, and six questions are asked, so the first one
   expands the dock exactly as a reader's would and every answer carries the
   feedback row cpl_chat.js writes. One answer carries a table wider than a
   phone. My College, because its Sierra is open by default. */
async function seedSierraDockFull(page, theme) {
  // Sierra docks on My College (she left Program Requirements, Sam 2026-10-14); its seed
  // paints the page whole first.
  await seedMyCollegePage(page, theme);
  // First Light's once-a-day greeting opens 650 ms after load and would cover
  // the screenshots: mark the day seen and close it if it is up.
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
  });
  await page.waitForFunction(() => window.CPL_CHAT && document.querySelector("#cb-assistant-mount .cplchat .cplchat-dock-btn"),
    null, { timeout: 60000 });
  await page.evaluate(async () => {
    const wrap = document.querySelector("#cb-assistant-mount .cplchat");
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
/* Sierra AI over a COBI tab (S398: the CPL Assistant tab retired into her).
   CPL_CHAT.open() puts her full screen over whatever tab is showing; she is
   opened over Sierra Training, where the owner's "Try it in: Sierra" asks her,
   and seeded the way the dock is: the role confirmed on its chip, only the chat
   function's stream stubbed, six questions asked through open({ send: true }),
   one answer carrying a table wider than a phone. */
async function seedSierraCobiFull(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "sierra-training") location.hash = "sierra-training"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  // First Light's once-a-day greeting would cover the screenshots (see seedSierraDockFull).
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
  });
  // The tab underneath has painted (its sign-in gate, with every read aborted), so
  // nothing it adds to the page lands after the dialog has made the page inert.
  await page.waitForFunction(() => window.CPL_CHAT && typeof window.CPL_CHAT.open === "function"
    && window.CPL_SIERRA_TRAINING_TAB && !/^\s*Loading/.test((document.getElementById("sierra-training-root") || {}).textContent || ""),
    null, { timeout: 60000 });
  await page.evaluate(async () => {
    window.CPL_CHAT.open();
    const wrap = document.querySelector(".cplchat.cplchat-full");
    const chip = Array.from(wrap.querySelectorAll(".cplchat-aud-chip")).find((b) => /Faculty/.test(b.textContent));
    if (chip) chip.click();
    const table = "\n\n| Credential | Course | Units | College | C-ID |\n|---|---|---|---|---|\n" +
      "| FIW Orientation | WELD 100 Introduction to Welding Technology | 3.0 | Cerritos College | none |\n" +
      "| Post Tensioning 3 | WELD 244 D1.1 Code Clinic | 2.0 | Santa Ana College | none |\n";
    let n = 0;
    const real = window.fetch;
    window.fetch = function (url) {
      // The chat function's request, by the name its URL ends in (see seedSierraDockFull).
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
      window.CPL_CHAT.open({ question: "Seeded question " + (i + 1) +
        ": I have a journey worker license as an Iron and Steel worker. What CPL can I get here?", send: true });
      await new Promise((r) => setTimeout(r, 30));
      await idle();
    }
  });
  await page.waitForTimeout(200);
}
// The full-screen checks every Sierra dialog shares; `what` names the one measured.
async function sierraFullScreenChecks(page, what) {
  const out = [];
  out.push(await page.evaluate((what) => {
    const w = document.querySelector(".cplchat.cplchat-full");
    const lab = w && document.getElementById(w.getAttribute("aria-labelledby") || "");
    return {
      name: what + ": a modal dialog in <body>, named",
      ok: !!w && w.parentNode === document.body && w.getAttribute("role") === "dialog" &&
        w.getAttribute("aria-modal") === "true" && !!lab && lab.textContent.trim() === "Sierra AI",
      detail: w ? "role=" + w.getAttribute("role") + ", name=" + (lab ? '"' + lab.textContent.trim() + '"' : "none") : "not expanded",
    };
  }, what));
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
  return out;
}
async function sierraDockFullChecks(page) {
  const out = await sierraFullScreenChecks(page, "a send expands the dock");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  out.push(await page.evaluate(() => {
    const w = document.querySelector("#cb-assistant-mount > .cplchat");
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
async function sierraCobiFullChecks(page) {
  const out = await sierraFullScreenChecks(page, "open() puts her over the tab");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  out.push(await page.evaluate(() => {
    const host = document.getElementById("cplchat-cobi");
    const w = host && host.querySelector(".cplchat");
    return {
      name: "Escape closes her into her hidden host, the conversation kept for the next open",
      ok: !document.querySelector(".cplchat-full") && !!host && host.hidden && !!w &&
        w.querySelectorAll(".cplchat-msg").length === 12 && !document.querySelector("body > [inert]") &&
        getComputedStyle(document.documentElement).overflowY !== "hidden",
      detail: (w ? w.querySelectorAll(".cplchat-msg").length + " turns kept" : "no box in the host") +
        ", host hidden=" + !!(host && host.hidden),
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
    /* The 2026-10-18 shape (S415): every record in the index, 32 a person confirmed, the
       rest passing or failing the machine checks, a few on programs COCI does not list as
       active; COCI's active programs by key; the display build read live. */
    const recs = [], keys = {};
    for (let i = 0; i < 400; i++) {
      const college = i < 20 ? ["Cerritos College", "San Diego Miramar College", "Mt. San Antonio College",
        "Riverside City College", "West Los Angeles College"][i % 5] : "College " + (i % 114);
      const fail = i % 9 === 4, units = i % 18 === 4;
      const r = { college: college, control_number: String(40000 + i), program_title: "Program " + i,
        checked: i < 32, checked_at: i < 32 ? "2026-10-04T10:22:45Z" : null,
        checks: { coverage: !(fail && !units), invented: true, arithmetic: units ? "unequal" : "equal" },
        display: { build: "48cb66f19cff", built: "2026-10-18" }, record: { program: { outcomes: ["Outcome " + i] } } };
      recs.push(r);
      if (i % 12 !== 11) keys[college + "|" + r.control_number] = 1;
    }
    const addenda = [];
    for (let i = 0; i < 79; i++) addenda.push({ college: "College " + (i % 52), status: i < 8 ? "read" : "listed" });
    S.registry = reg; S.records = recs; S.error = null;
    S.progress = { addenda: addenda, active: 20282, activeKeys: keys,
      build: { build: "48cb66f19cff", built: "2026-10-18", unbuilt: 0 },
      queue: S.progress.queue, errors: S.progress.errors || {}, readAt: new Date() };
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
          { code: "ARTH 27", units: null, alternatives: [] }] }] },
      /* S360: the COCI status chip, COCI's units and a kept unit difference (Sam's rules 1-3) */
      display: { build: "2360b83e8100", built: "2026-10-06", checks: { coverage: { listed: 23, placed: 21 }, additions: 4, arithmetic: "unequal",
        units_differ: { blocks: [25.5, 25.5], printed: [26.5, 26.5] } },
        counts: { here: 1, courses: 2 }, figure: {},
        courses: {
          "ARTH 4": { title: "Art History Survey", ids: [{ kind: "C-ID", id: "ARTH 110", title: "Survey of Western Art from Prehistory through the Middle Ages" },
            { kind: "M-ID", id: "ARTH M1001", title: "Art History: Prehistoric to Gothic" }],
            here: { recs: 1, credentials_n: 1, exhibits_n: 2, untitled_n: 1, exhibits: [{ exhibit: "MAPCX-AP-1-001", title: "AP Art History",
              credential: "AP Art History", type: "Credit By Exam", recs: ["3 units in Art History"] }] },
            adopt: { credentials_n: 1, colleges_n: 1, credentials: [{ credential: "CLEP Humanities", colleges: ["Saddleback College"] }] },
            coci: { status: "Inactive", program_ccn: "CCC000520884", current_ccn: "CCC000607187" } },
          "ARTH 27": { title: "Art of the Americas", units_from_state_file: 3, identity: { kind: "CCR", id: "ARTH M1027", title: "Art of the Americas" } } },
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
    /* The Records view lists the colleges a reader picks (2026-10-13): pick the record's, so its
       card, the picker and the find controls are all measured. */
    S.pick = ["Irvine Valley College"]; S.rscope = "pick";
    S.view = "records";
    M._render();
    const fix = document.querySelector("#program-requirements-root .prh-verdict button[aria-expanded]");
    if (fix) fix.click();
  });
  await page.waitForTimeout(300);
}

// Seeds the exhibits view over the signed-in record (S355, Sam 2026-10-10: "a click drill down
// to pop up an exhibits view"): the dialog, its list, the leads, the page behind inert.
async function seedExhibits(page, theme) {
  await seedRecords(page, theme);
  await page.evaluate(() => {
    const b = document.querySelector("#program-requirements-root button.prh-cplbtn");
    if (b) b.click();
  });
  await page.waitForTimeout(300);
}

// Seeds the Records view with its first filter open (S391 UI pass): the dropdowns of #2121
// (Sam, 2026-10-14) open a list of checkboxes no other target paints.
async function seedFilterOpen(page, theme) {
  await seedRecords(page, theme);
  await page.evaluate(() => {
    const b = document.querySelector("#program-requirements-root .prh-dd-btn");
    if (b) b.click();
  });
  await page.waitForTimeout(300);
}

// Seeds the side by side view (S355, Sam 2026-10-09: "show a split view like this on the
// Prog Rev tab so I don't have to do it manually"): the signed-in record above, opened
// beside its catalog page, so the bar, the frame's pane and the record pane are measured
// with the page behind inert. The frame's request leaves the origin and is aborted, which
// is fine: what is measured is ours.
async function seedSplit(page, theme) {
  await seedRecords(page, theme);
  await page.evaluate(() => {
    const b = Array.prototype.filter.call(document.querySelectorAll("#program-requirements-root button.prh-word"),
      (x) => x.textContent === "Side by side")[0];
    if (b) b.click();
  });
  await page.waitForTimeout(300);
}

// Exhibit Adoption's table and matrix (S409): the tab opens on Credentials, so
// its other two views were never measured. The seed presses the view's own
// switch (a script click, so :focus-visible still behaves as for a keyboard).
async function seedExhibitView(page, theme, view) {
  await page.evaluate((th) => { if (th === "dark" && window.CPL_THEME) window.CPL_THEME.set("dark"); }, theme);
  await page.evaluate((v) => {
    const b = document.querySelector('.sw-subtab[data-view="' + v + '"]');
    if (b) b.click();
  }, view);
  await page.waitForTimeout(view === "matrix" ? 1500 : 400);
}

// The Common Course Reference list (S378): wait for its table, then set the theme.
async function seedCcrList(page, theme) {
  await page.waitForSelector("#tab-unified-courses table.uc-table tbody tr", { timeout: 30000 }).catch(() => {});
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForTimeout(200);
}

// The CER's views (S413): the tab opens on Needs you › Held when the procedures report
// holds titles, so the cobi sweep measures that screen. A view or lane opens through its
// own button by keyboard (a pointer click turns :focus-visible off for the focus check).
async function openCerView(page, theme, view) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "credential-reference") location.hash = "credential-reference"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForSelector("#tab-credential-reference #cr-view-" + view, { timeout: 60000 });
  await page.evaluate((v) => document.getElementById("cr-view-" + v).focus(), view);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

// Reference › All, the credentials grid, a row open (S413: no longer the first screen).
async function seedCerReference(page, theme) {
  await openCerView(page, theme, "ref");
  await page.waitForSelector("#tab-credential-reference tr.cr-row .cr-title-toggle", { timeout: 30000 });
  await page.evaluate(() => document.querySelector("#tab-credential-reference tr.cr-row .cr-title-toggle").focus());
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

// Progress (S436): the Commons' dash for the reference, drawn once the module, the
// definitions, the run log and the Commons figures are in.
async function seedCerProgress(page, theme) {
  await openCerView(page, theme, "progress");
  await page.waitForSelector("#tab-credential-reference #cx-progress .prh-pg-part", { timeout: 60000 });
  await page.waitForTimeout(300);
}

// The Common CR Reference's Progress view (S437), opened by its own word the way a reader
// opens it, then drawn once the shared module and the figures are in.
async function seedCrProgress(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "cr-reference") location.hash = "cr-reference"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForSelector('#tab-cr-reference button.crr-view[data-view="progress"]', { timeout: 60000 });
  await page.evaluate(() => document.querySelector('#tab-cr-reference button.crr-view[data-view="progress"]').focus());
  await page.keyboard.press("Enter");
  await page.waitForSelector("#tab-cr-reference #cq-progress .prh-pg-part", { timeout: 60000 });
  await page.waitForTimeout(300);
}

// Procedures: each procedure, one opened to what it did.
async function seedCerProcedures(page, theme) {
  await openCerView(page, theme, "procs");
  await page.waitForSelector("#tab-credential-reference .cr-proc-item button.cr-proc-word", { timeout: 30000 });
  await page.evaluate(() => document.querySelector("#tab-credential-reference .cr-proc-item button.cr-proc-word").focus());
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

// The CER's Industry credentials lane (2026-10-16 UI pass), in Reference. This opens the
// view, then the lane through its own button by keyboard, then the first articulated row
// so the industry record, its skills and links paint.
async function seedCerIndustry(page, theme) {
  await openCerView(page, theme, "ref");
  await page.waitForFunction(() => Array.from(document.querySelectorAll("#tab-credential-reference .cr-lane"))
    .some((b) => /Industry credentials \(\d/.test(b.textContent)), null, { timeout: 60000 });
  await page.evaluate(() => Array.from(document.querySelectorAll("#tab-credential-reference .cr-lane"))
    .find((b) => /Industry credentials/.test(b.textContent)).focus());
  await page.keyboard.press("Enter");
  await page.waitForSelector("#tab-credential-reference table.cr-ind-table", { timeout: 30000 });
  await page.evaluate(() => document.querySelector("#tab-credential-reference tr.cr-ind-row .cr-title-toggle").focus());
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
}

// Seeds MAP Users as a signed-in reviewer sees it (S358 UI pass): the cobi sweep opens
// the tab signed out with its reads aborted, so it paints only "Could not load". The
// "all" lens has one roster open and a nudge logged; the "gaps" lens has a curator's
// proposal editor open beside an ask, so every control and the proposed-fill tag paint.
async function seedMapUsers(page, theme, lens) {
  await page.evaluate(() => { try { localStorage.setItem("cpl_team_pass", "seed"); } catch (e) {} });
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "map-users") location.hash = "map-users"; });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.waitForFunction(() => { const M = window.CPL_MAP_USERS_TAB; return M && !M._state.loading; }, null, { timeout: 60000 });
  await page.evaluate((lens) => {
    const M = window.CPL_MAP_USERS_TAB, S = M._state, root = document.getElementById("map-users-root");
    const mix = { "CPL Coordinator": 1, Faculty: 6, Counselor: 3, Evaluator: 2 };
    S.summary = [];
    for (let i = 0; i < 14; i++) S.summary.push({ college: ["Foothill College", "Chaffey College", "Norco College"][i] || "College " + i,
      user_count: 20 - i, active_count: 15 - i, role_mix: mix, last_synced: "2026-10-09T18:55:30Z" });
    S.error = null; S.loading = false; S.lens = lens;
    S.nudges = { "Chaffey College": { last_nudged_at: "2026-10-02T17:00:00Z", last_nudged_by: "Ashley" } };
    S.rosterOpen = lens === "all" ? { "Foothill College": true } : {};
    S.gaps = [
      { college: "Alpha College", college_kind: "college", has_student_contact: false, proposed_source: "CPL Coordinator",
        proposed_name: "Pat Vega", proposed_email: "pat@alpha.edu", needs_ask: false, landing_page_url: "https://map.example/alpha", active_users: 4 },
      { college: "Beta College", college_kind: "college", has_student_contact: false, proposed_source: "CPL Assistant",
        proposed_name: null, proposed_email: "asst@beta.edu", needs_ask: false, landing_page_url: null, active_users: 2 },
      { college: "Gamma College", college_kind: "college", has_student_contact: false, proposed_source: null, proposed_name: null,
        proposed_email: null, needs_ask: true, ask_reason: "leadership only", landing_page_url: "https://map.example/gamma", active_users: 3 },
    ];
    S.propEdit = lens === "gaps" ? M._ckey("Alpha College") : null;
    M.render(root);
    const cell = root.querySelector('[data-roster-cell="Foothill College"]');
    if (cell) cell.innerHTML = M._rosterHtml([
      { first_name: "Ada", last_name: "Lovelace", email: "ada@foothill.edu", role_name: "CPL Coordinator", user_status: "Active",
        disciplines: "Mathematics, Computer Science, Engineering", last_updated_on: "2026-06-15", username: "alovelace" },
      { first_name: "Grace", last_name: "Hopper", email: "grace@foothill.edu", role_name: "Faculty", user_status: "Inactive",
        disciplines: "Computer Science", last_updated_on: "2025-11-02", username: "ghopper" }]);
  }, lens);
  await page.waitForTimeout(300);
}

// Seeds My College's Reported expenditures section for the two targets below.
// The funding tab as a signed-in curator sees it (S364 UI pass): the scenario strip, the
// publish bar and every card's editing words (Remove, Hide from public, revenue/deduction).
// The sweep has no session to sign in with, so it stands in a fresh one the way
// cpl_session.js answers, then renders the tab again; no write can follow, since the
// sweep aborts the tab's reads and writes.
async function seedFundingCurator(page, theme) {
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    const s = { email: "seed@example.org", access_token: "seed", expires_at: Math.floor(Date.now() / 1000) + 3600 };
    if (window.CPL_SESSION) { window.CPL_SESSION.get = () => s; window.CPL_SESSION.isFresh = () => true; }
    const T = window.CPL_FUNDING_TAB;
    if (T && T.render) T.render();
  });
  await page.waitForTimeout(700);
  // First Light's greeting opens 650 ms after load and would cover the screenshots.
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
  });
  await page.waitForTimeout(200);
}

// The Budget editor as a signed-in editor sees it mid-save (S364): the auth widget,
// the editable cells, and one cell in each save state (saving, saved, failed), which
// show only while a write is in flight and never in the signed-out sweep. The session
// is the shape budget_editor.js reads from sessionStorage; the editor re-reads it on
// its own cpl-team-pass-dropped event.
async function seedBudgetEditor(page, theme) {
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "seed.seed.seed", email: "seed@example.org" }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent("cpl-team-pass-dropped"));
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const cells = document.querySelectorAll('#budget-funding .budget-cell[data-editable="1"]');
    ["budget-saving", "budget-saved", "budget-error"].forEach((c, i) => { if (cells[i]) cells[i].classList.add(c); });
  });
  await page.waitForTimeout(300);
}

// Annual Workplan Goals as a signed-in editor sees it (S364): the auth widget's words, one
// editable cell in each save state, and, with `modal`, the Add new row dialog open. The
// session is the shape workplan_goals.js reads from sessionStorage; it re-reads on its own
// cpl-team-pass-dropped event.
async function seedWorkplanGoalsEditor(page, theme, modal) {
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate((openModal) => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "seed.seed.seed", email: "seed@example.org" }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    window.dispatchEvent(new CustomEvent("cpl-team-pass-dropped"));
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const cells = document.querySelectorAll("#tab-workplan-goals .wpg-editable");
    ["wpg-saving", "wpg-saved", "wpg-error"].forEach((c, i) => { if (cells[i]) cells[i].classList.add(c); });
    if (openModal) { const add = document.querySelector("#tab-workplan-goals .wpg-btn-add"); if (add) add.click(); }
  }, !!modal);
  await page.waitForTimeout(300);
}

// Annual Workplan Goals, keyboard and phone (S375 UI pass): an editor reaches a value
// by Tab and opens it with Enter, Escape hands focus back, and below 560px each
// sub-activity is a card that fits the screen. Behavior, not shape: jsdom proves the
// attributes (tests/annual_goals_ui_pass.test.js); this proves the browser obeys them.
async function workplanGoalsKeyboardChecks(page) {
  const out = [];
  // The keyboard page opens without the route's hash (as seedContracts notes): open the tab.
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "workplan-goals") location.hash = "workplan-goals"; });
  await page.waitForTimeout(400);
  out.push(await page.evaluate(() => {
    const c = document.querySelector('#tab-workplan-goals td.wpg-editable[data-editable="1"]');
    if (!c) return { name: "a goal value takes focus", ok: false, detail: "no editable value (not signed in?)" };
    c.focus();
    return { name: "a goal value takes focus", ok: document.activeElement === c && c.getAttribute("tabindex") === "0",
      detail: (c.getAttribute("data-aid") || "") + " " + (c.getAttribute("data-yr") || "") };
  }));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  out.push(await page.evaluate(() => {
    const i = document.activeElement;
    return { name: "Enter opens a named field", ok: !!i && i.tagName === "INPUT" && !!i.getAttribute("aria-label"),
      detail: i ? (i.getAttribute("aria-label") || "(unnamed " + i.tagName + ")") : "nothing focused" };
  }));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  out.push(await page.evaluate(() => {
    const a = document.activeElement;
    return { name: "Escape returns focus to the value", ok: !!a && a.tagName === "TD" && a.classList.contains("wpg-editable"),
      detail: a ? a.tagName + "." + a.className : "nothing focused" };
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  out.push(await page.evaluate(() => {
    const t = document.querySelector("#tab-workplan-goals .wpg-annual-table");
    if (!t) return { name: "below 560px each sub-activity is a card", ok: false,
      detail: "no .wpg-annual-table: the page predates the S375 renderer (the next cron run rebuilds it)" };
    const r = t.querySelector(".wpg-r");
    const sc = t.closest(".wpg-annual-scroll");
    // S426: the row is a wrapping flex line (a cell takes the width its number needs).
    const grid = r && /^(grid|flex)$/.test(getComputedStyle(r).display);
    const fits = sc && sc.scrollWidth <= sc.clientWidth + 1;
    return { name: "below 560px each sub-activity is a card", ok: !!(grid && fits),
      detail: "row display " + (r ? getComputedStyle(r).display : "?") + ", scroller " + (sc ? sc.scrollWidth + "/" + sc.clientWidth : "?") };
  }));
  return out;
}

// Contracts as a reviewer sees it (S364 UI pass): the register is gated, so the signed-out
// cobi sweep measures the gate. The seed stubs the tab's four reads with the V0718 fixture
// from tests/contracts.test.js (matched by table, the narrowest point), holds a reviewer
// session so the ledger's quarters and the documents' controls are live, and opens Goal 1
// and its first deliverable.
async function seedContracts(page, theme) {
  // The motion check seeds a page opened without the route's hash, and contracts.js loads
  // only when its tab activates: open the tab first, as seedProgress does.
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "contracts") location.hash = "contracts"; });
  await page.waitForFunction(() => !!window.CPL_CONTRACTS, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc", email: "seed@example.org" }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const C = { id: "c1", agreement_no: "V0718", title: "Mapping Articulated Pathways for CPL",
      vendor_name: "Academic Senate for California Community Colleges", vendor_short: "ASCCC",
      fiscal_agent: "Rancho Santiago CCD", amount_total: "1063900.00", term_start_est: "2025-06-30",
      term_executed: "2025-08-07", term_end: "2028-06-30", status: "executed", parse_status: "proposed",
      co_monitor: { name: "Monitor Name", email: "monitor@example.org" },
      vendor_contact: { name: "Contact Name", title: "Representative" },
      funding_ref: { funding_year: "2024-25", chapter: "22", statute: "2024" }, invoice_cadence: "quarterly",
      report_clause: "Every quarterly invoice must include a summary of tasks performed for each deliverable.",
      report_clause_ref: "Section D", findings: [{ title: "The term start is ambiguous", detail: "Cover page vs Section B.", ref: "Section B" }] };
    const D = [
      { id: "d1", contract_id: "c1", goal_no: 1, goal_title: "Expand faculty-led development", goal_amount: "376120.00", seq: 1,
        kind: "obligation", status: "not_started", label: "Form 15-30 distinct faculty workgroups", countable_target: "15-30",
        countable_unit: "workgroups", recorded_count: null, source_ref: "Goal 1, deliverable 1",
        goal_outcome: "College credit recommendations documented on CPL exhibits.",
        detail: { verbatim: "Form 15-30 distinct faculty workgroups.", parts: ["Developing credit recommendations"],
          funded_by: "Faculty stipends", evaluated_by: "Quarterly check-ins.", note: "The hourly rate is not stated." } },
      { id: "d2", contract_id: "c1", goal_no: 1, seq: 2, kind: "obligation", status: "complete", label: "Recruit faculty for each workgroup", recorded_count: null },
      { id: "d3", contract_id: "c1", goal_no: 1, seq: 50, kind: "evaluation", status: "not_started", cadence: "quarterly", label: "Quarterly check-ins with the Chancellor's Office" },
      { id: "d4", contract_id: "c1", goal_no: 2, goal_title: "Strengthen faculty leadership", goal_amount: "567780.00", seq: 1, kind: "obligation",
        status: "in_progress", label: "Appoint and stipend CPL Liaisons", countable_target: "115", countable_unit: "liaisons", recorded_count: 40 },
      { id: "d5", contract_id: "c1", goal_no: 2, seq: 10, kind: "role_duty", status: "not_started", label: "Serve as primary points of contact" },
    ];
    const R = [{ id: "r1", contract_id: "c1", period_label: "2025-26 Q1", status: "received" }];
    const F = [{ id: "f1", contract_id: "c1", kind: "agreement", filename: "V0718_executed.pdf", mime: "application/pdf",
      bytes: 812345, pages: 42, doc_date: "2025-08-07", storage_path: "c1/V0718.pdf" }];
    const real = window.fetch;
    window.fetch = function (url, opts) {
      const u = String(url);
      const body = /\/cpl_contracts\?/.test(u) ? [C] : /\/cpl_contract_deliverables\?/.test(u) ? D
        : /\/cpl_contract_reports\?/.test(u) ? R : /\/cpl_contract_documents\?/.test(u) ? F : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    if (window.CPL_CONTRACTS) window.CPL_CONTRACTS.activate();
  });
  await page.waitForFunction(() => window.CPL_CONTRACTS && window.CPL_CONTRACTS._state.contracts.length && !window.CPL_CONTRACTS._state.loading,
    null, { timeout: 20000 });
  await page.evaluate(() => {
    const g = document.querySelector('#contracts-root [data-goal] .ctr-gh');
    if (g) g.click();
    const t = document.querySelector('#contracts-root [data-toggle]');
    if (t) t.click();
  });
  await page.waitForTimeout(300);
}

// Team & RACI in edit mode (S365): the stored team phrase unlocks editing exactly as a real
// session does, and the seed stubs the tab's two reads (team_members, item_raci) so the matrix
// paints its editable cells, each a button since S365, and one row holds the jump highlight.
// With `view` "directory" it shows the
// Team Directory, whose name, role, email and status cells are buttons too.
async function seedRaciEditor(page, theme, view) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "raci") location.hash = "raci"; });
  await page.waitForFunction(() => !!window.CPL_RACI_TAB, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const M = [
      { id: "m1", name: "Member One", email: "one@example.org", role: "Operations", nudge: true,
        last_nudged_at: "2026-09-01T00:00:00Z", last_response_at: null },
      { id: "m2", name: "Member Two", email: "two@example.org", role: "", nudge: false, last_nudged_at: null, last_response_at: null },
    ];
    const RR = [{ item_type: "project", item_id: "1.1", raci: { R: [{ name: "Member One" }], A: [], C: [], I: [] } }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/team_members\?/.test(u) ? M : /\/item_raci\?/.test(u) ? RR : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_RACI_TAB.boot();
  });
  await page.waitForFunction(() => !!document.querySelector("#raci-root .raci-cell-btn"), null, { timeout: 20000 });
  // The row a Where-To jump lands on holds --gold-soft for 2.6 s (focusItem). Hold it, at
  // its steady fill (the fade's first frames are motion, not a state), so its words measure.
  if (view !== "directory") await page.evaluate(() => {
    const row = document.querySelector('#raci-root tr[data-raci-key="project:1.1"]');
    if (row) { row.classList.add("raci-row-focus"); row.querySelectorAll("td").forEach((td) => { td.style.animation = "none"; }); }
  });
  if (view === "directory") {
    await page.evaluate(() => {
      const t = Array.from(document.querySelectorAll("#raci-root .raci-tg")).find((b) => /Directory/.test(b.textContent));
      if (t) t.click();
    });
    await page.waitForFunction(() => !!document.querySelector("#raci-root .raci-edit-btn"), null, { timeout: 20000 });
  }
  await page.waitForTimeout(300);
}

// Noncredit & Learning Partners with the team phrase (S365): notes, artifacts and Revise
// controls render only for a team-phrase holder, so the unseeded sweep never painted them.
// The seed holds the phrase, stubs the three reads (nc_partner_notes, nc_artifacts,
// nc_integration_backlog) and activates the tab again, which repaints and re-pulls them.
async function seedNcPartnersEditor(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "nc-learning-partners") location.hash = "nc-learning-partners"; });
  await page.waitForFunction(() => !!window.CPL_NC_LEARNING_PARTNERS, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const N = [
      { id: "n1", item_id: "OPP-3", body: "A seeded note on an opportunity.", author: "Seed Author",
        created_at: "2026-10-01T00:00:00Z", promoted_at: null, promoted_to: null },
      { id: "n2", item_id: "Q-1", body: "A seeded note, already promoted.", author: "Seed Author",
        created_at: "2026-09-20T00:00:00Z", promoted_at: "2026-09-25T00:00:00Z", promoted_to: "register" },
    ];
    const A = [{ id: "a1", item_id: "OPP-3", url: "https://example.org/artifact", title: "A seeded artifact",
      source: "link", why: "Context for the opportunity.", added_by: "Seed Author", created_at: "2026-10-02T00:00:00Z", integrated_at: null }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/nc_partner_notes\?/.test(u) ? N : /\/nc_artifacts\?/.test(u) ? A : /\/nc_integration_backlog\?/.test(u) ? [] : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_NC_LEARNING_PARTNERS.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#nc-learning-partners-root .nclp-revise, .nclp-revise"), null, { timeout: 20000 });
  await page.waitForTimeout(300);
}

// Governance with the team phrase (S366): the register is gated on the read, so the
// unseeded sweep measures only the locked banner. The seed holds the phrase, stubs the
// four gated reads (map_contact_gaps, map_college_nudges, sierra_feedback,
// governance_owners) so every live cell and both red states paint, activates the tab,
// and opens Docs & doctrine with one lane expanded. The register, the drift scan and the
// docs index are the committed files, served as they are on Pages.
async function seedGovernance(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "governance") location.hash = "governance"; });
  await page.waitForFunction(() => !!window.CPL_GOVERNANCE, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const G = [
      { college: "College One", college_kind: "college", has_student_contact: true, has_coordinator: true,
        landing_page_url: "https://example.org/one", active_users: 4, synced_at: "2026-10-10T06:00:00Z" },
      { college: "College Two", college_kind: "college", has_student_contact: false, has_coordinator: true,
        landing_page_url: null, active_users: 0, synced_at: "2026-10-10T06:00:00Z" },
    ];
    const NU = [{ college: "College Two", last_nudged_at: "2026-10-01T00:00:00Z" }];
    const FB = [{ page: "sierra", status: "new" }, { page: "sierra", status: "addressed" }];
    const OW = [{ register_id: "DR-01", owner: "Member One", note: "Owns the student contact field.",
      set_by: "seed@example.org", set_at: "2026-10-02T00:00:00Z" }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/map_contact_gaps\?/.test(u) ? G : /\/map_college_nudges\?/.test(u) ? NU
        : /\/sierra_feedback\?/.test(u) ? FB : /\/governance_owners\?/.test(u) ? OW : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_GOVERNANCE.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#governance-root .gov-table"), null, { timeout: 20000 });
  await page.evaluate(() => {
    const d = document.querySelector("#governance-root .gov-docs");
    if (d) d.open = true;
  });
  await page.waitForFunction(() => !!document.querySelector("#governance-root .gov-lane"), null, { timeout: 20000 });
  await page.evaluate(() => {
    const l = document.querySelector("#governance-root .gov-lane");
    if (l) l.open = true;
  });
  await page.waitForTimeout(300);
}

// Team Phrases signed in as a reviewer (S366): the phrases are readable only to a reviewer,
// so the unseeded sweeps measure the sign-in form alone. The seed stores a reviewer session
// the way the tab reads it, stubs the team_access read with four rows, activates the tab,
// and paints one revealed phrase and a saved and a failed message.
async function seedTeamPhrases(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "team-phrases") location.hash = "team-phrases"; });
  await page.waitForFunction(() => !!window.CPL_TEAM_PHRASES, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "seed.seed.seed", refresh_token: "seed",
        email: "seed@example.org", exp: Date.now() + 3600 * 1000 }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const ROWS = ["team", "ci", "gr", "fin"].map((id) => ({ id, secret: "seed-" + id + "-phrase", updated_at: "2026-10-01T00:00:00Z" }));
    const real = window.fetch;
    window.fetch = function (url) {
      if (/\/team_access\?/.test(String(url))) {
        return Promise.resolve(new Response(JSON.stringify(ROWS), { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return real.apply(this, arguments);
    };
    window.CPL_TEAM_PHRASES.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#team-phrases-root [data-phrase]"), null, { timeout: 20000 });
  await page.evaluate(() => {
    const T = window.CPL_TEAM_PHRASES, st = T._state;
    st.reveal.ci = true;
    st.msg.team = { text: "Saved. Share the new phrase with the people who need it.", kind: "ok" };
    st.msg.gr = { text: "save failed (500)", kind: "err" };
    T.render(document.getElementById("team-phrases-root"));
  });
  await page.waitForTimeout(300);
}

// Admin as a reviewer sees it (S368 UI pass): the tab is gated, so the signed-out cobi sweep
// measures the gate. The seed holds a reviewer session and stubs the two reads that need one,
// cobi_rls_gates() and cobi_live_session. The gate fixture gives each table the tab's surface
// file names one of the seven gate shapes in turn, so every badge paints. kb/dependency_map.json
// is a local file and loads for real. `open` names the arrange row left open: "tab" for
// rename and sites, "vis" for who sees it.
async function seedAdmin(page, theme, open) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "admin") location.hash = "admin"; });
  await page.waitForFunction(() => !!window.CPL_ADMIN_TAB, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc", email: "seed@example.org" }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const tabs = (window.COBI_ADMIN_SURFACE && window.COBI_ADMIN_SURFACE.tabs) || {};
    const names = [];
    Object.keys(tabs).forEach((k) => (tabs[k].reads || []).concat(tabs[k].writes || []).forEach((t) => {
      if (names.indexOf(t) === -1) names.push(t);
    }));
    const SHAPES = [
      { rls_enabled: true, select_gate: "is_allowed_reviewer()" },
      { rls_enabled: true, select_gate: "(is_allowed_reviewer() OR team_pass_ok())" },
      { rls_enabled: true, select_gate: "true" },
      { rls_enabled: true, select_gate: "(is_allowed_reviewer() OR fin_pass_ok())" },
      { rls_enabled: true, select_gate: "(gr_pass_ok() OR is_allowed_reviewer())" },
      { rls_enabled: true, select_gate: null },
      { rls_enabled: false, select_gate: null },
    ];
    const GATES = names.map((t, i) => Object.assign({ tbl: t, kind: "table", policy_count: 2 }, SHAPES[i % SHAPES.length]));
    const LIVE = [{ active: true, session_url: "https://example.org/live", expires_at: new Date(Date.now() + 3600e3).toISOString(), auto_announce: true }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/rpc\/cobi_rls_gates/.test(u) ? GATES : /\/cobi_live_session\?/.test(u) ? LIVE : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_ADMIN_TAB._state.loadState = "idle";
    window.CPL_ADMIN_TAB.activate();
  });
  await page.waitForFunction(() => window.CPL_ADMIN_TAB._state.loadState === "ok"
    && !!document.querySelector("#admin-root .adm-table"), null, { timeout: 20000 });
  await page.evaluate((open) => {
    const A = window.CPL_ADMIN_TAB, st = A._state;
    const first = A._navItems().filter((it) => !it.link)[0];
    if (first) st.editKey = open + ":" + first.tab;
    A.render(document.getElementById("admin-root"));
  }, open);
  await page.waitForTimeout(400);
}

// MAP Team Queue as a phrase holder sees it (S368 UI pass): the queue is gated, so the
// signed-out cobi sweep measures the lock. The seed holds the team phrase and stubs the five
// table reads with tests/map_team_queue.test.js's fixture shapes, dated back from today so
// ages run from days to weeks; the two kb/ files and map_users.js load for real. Cleared
// items are shown so their state paints too.
async function seedMapQueue(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "map-queue") location.hash = "map-queue"; });
  await page.waitForFunction(() => !!window.CPL_MAP_QUEUE, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const ago = (d) => new Date(Date.now() - d * 864e5).toISOString();
    const GAPS = [
      { college: "Chaffey College", primary_contact_email: "a@example.edu", synced_at: ago(3) },
      { college: "Gavilan College", primary_contact_email: null, synced_at: ago(3) },
      { college: "Mission College", primary_contact_email: null, synced_at: ago(3) },
      { college: "Seed Valley College", primary_contact_email: null, synced_at: ago(3) },
      { college: "Seed Coast College", primary_contact_email: null, synced_at: ago(3) },
    ];
    const FEEDBACK = [
      { created_at: ago(38), status: "new", page: "sierra", rating: "down" },
      { created_at: ago(9), status: "new", page: "sierra", rating: "up" },
      { created_at: ago(2), status: "addressed", page: "sierra", rating: "down" },
    ];
    const OWNERS = [{ register_id: "DR-01", owner: "Seed Owner" }];
    const LOADS = [{ table_name: "map_student_credit", loaded_at: ago(4) }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/map_contact_gaps\?/.test(u) ? GAPS : /\/sierra_feedback\?/.test(u) ? FEEDBACK
        : /\/governance_owners\?/.test(u) ? OWNERS : /\/map_college_nudges\?/.test(u) ? []
        : /\/map_data_loads\?/.test(u) ? LOADS : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    const st = window.CPL_MAP_QUEUE._state;
    st.items = null; st.showClear = true;
    window.CPL_MAP_QUEUE.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#map-queue-root .mtq-item"), null, { timeout: 20000 });
  await page.waitForTimeout(300);
}

// GR Priorities as a GR phrase holder sees it (S394 UI pass): the register is gated, so the
// signed-out cobi sweep measures the lock. The seed holds a GR phrase and stubs the tab's
// five reads with tests/gr_priorities.test.js's and tests/gr_memos.test.js's synthetic
// shapes (never a live row: the register's content is gated), each state a row can take:
// a derived citation, an adopted item, a red pathway, a memo with sections, two areas
// sharing a section, and an artifact with no safe link.
async function seedGrPriorities(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "gr-priorities") location.hash = "gr-priorities"; });
  await page.waitForFunction(() => !!window.CPL_GR, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      localStorage.setItem("cpl_gr_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const AREAS = [
      { id: "cpl", title: "Credit for Prior Learning", division: "ESS", status: "active", sort: 1,
        summary: "Title 5 and Ed. Code revisions under consideration for CPL.",
        narrative: { thesis: "A <b>regulation</b> question.", caveat: "Seed text for the measurement." } },
      { id: "dual-enrollment", title: "Dual Enrollment", division: "ESS", status: "active", sort: 2, summary: "Seed area." },
    ];
    const REVS = [
      { id: "1", area_id: "cpl", n: 1, title: "Item one", grp: "Scope", summary: "<p>One <a href=\"https://x.example.org/a\">\u00a755050</a>.</p>",
        consideration: "consider", instrument: null, pathway: ["g", "y"], citations: ["T5 \u00a755050"],
        citations_derived: true, ed_first: "No", status: "proposed", updated_by: "someone@example.org" },
      { id: "2", area_id: "cpl", n: 2, title: "Item two", grp: "Scope", summary: "Two.", consideration: null,
        instrument: null, pathway: ["y"], citations: ["T5 \u00a755023", "EC \u00a776004"], citations_derived: false,
        ed_first: "No", status: "adopted", updated_by: null },
      { id: "3", area_id: "cpl", n: 7, title: "Apportionment", grp: "Funding", summary: "Hard one.", consideration: "risk",
        instrument: null, pathway: ["r"], citations: ["T5 \u00a758050"], citations_derived: false,
        ed_first: "Yes", status: "proposed", updated_by: null },
    ];
    const CROSS = REVS.map((r) => ({ area_id: r.area_id, citations: r.citations }))
      .concat([{ area_id: "dual-enrollment", citations: ["EC \u00a776004"] }]);
    const ARTS = [
      { id: "a1", area_id: "cpl", title: "A memo", url: "https://x.example.org/m", kind: "memo", source: "CCCCO",
        division: "ESS", why: "Sets the baseline.", citations: ["T5 \u00a755050"], added_by: "someone@example.org",
        created_at: "2026-10-01T00:00:00Z" },
      { id: "a2", area_id: "cpl", title: "Not a link", url: "javascript:alert(1)", kind: "other", source: null,
        division: null, why: null, citations: [], added_by: null, created_at: "2026-09-01T00:00:00Z" },
    ];
    const MEMOS = [{ id: "m1", area_id: "cpl", memo_key: "A", title: "What existing law and regulation already provide",
      audience: "CIOs, CSSOs, Senate Presidents", from_line: "[Office]", date_line: "[Issue upon adoption]",
      status: "draft", hold_note: "Issues only after the pending revisions are adopted.",
      purpose: "Colleges pause CPL work over requirements they believe exist.", sort: 1 }];
    const SECS = [{ id: "s1", memo_id: "m1", n: 1, heading: "Every catalog course may be CPL-eligible",
      body: "First paragraph with <b>validated</b> prose.\n\nSecond paragraph.", citations: ["T5 \u00a755002"],
      citations_derived: false, revision_ns: [1, 2], authority: "existing regulation", confirm_note: null }];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/gr_areas\?/.test(u) ? AREAS
        : /\/gr_revisions\?select=area_id,citations/.test(u) ? CROSS
        : /\/gr_revisions\?/.test(u) ? REVS : /\/gr_artifacts\?/.test(u) ? ARTS
        : /\/gr_memos\?/.test(u) ? MEMOS : /\/gr_memo_sections\?/.test(u) ? SECS : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_GR.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#gr-priorities-root .gx-item"), null, { timeout: 20000 });
  await page.waitForTimeout(300);
}

// Sierra Training as a reviewer sees it (S422 UI pass): signed out, the cobi sweep measures the
// First Light greeting over the sign-in note only. The seed holds a reviewer session (a JWT-shaped
// placeholder, never a real token), stubs the tab's six reads with synthetic rows (never a live
// row: the logs are gated), and opens the queue or the instructions editor.
async function seedSierraTraining(page, theme, state) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "sierra-training") location.hash = "sierra-training"; });
  await page.waitForFunction(() => !!window.CPL_SIERRA_TRAINING_TAB, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try {
      sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "seed." + "x".repeat(48) + ".seed", email: "reviewer@example.org" }));
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const day = (n) => new Date(Date.UTC(2026, 9, 18 - n, 17)).toISOString();
    const FEEDBACK = [
      { turn_id: 101, created_at: day(0), updated_at: day(0), page: null, audience: "faculty", rating: "down",
        note: "She named the wrong course for the paramedic license.", question: "Which courses does a paramedic license count toward at Riverside City College?",
        response: "Riverside City College awards credit for EMS 50 through its CPL policy.", status: "new" },
      { turn_id: 102, created_at: day(1), updated_at: day(1), page: null, audience: "student", rating: "up",
        note: null, question: "Can I get credit for my military training?", response: "Yes. Most colleges award credit for ACE-reviewed training.", status: "addressed" },
      { turn_id: 103, created_at: day(2), updated_at: day(2), page: null, audience: "counselor", rating: "down",
        note: "Too long for a counselor at the front desk.", question: "How does a veteran request CPL?", response: "A veteran starts with the college's CPL contact.", status: "new" },
    ];
    const TURNS = [
      { id: 201, session_id: "s-1", created_at: day(0), question: "Does welding certification count at Taft College?",
        response: "I don't have information about that program.", top_similarity: 0.21, topic_match: false, audience: "student" },
      { id: 202, session_id: "s-2", created_at: day(1), question: "What is CPL for nursing?", response: "Several colleges articulate the LVN license.",
        top_similarity: 0.71, topic_match: true, audience: "faculty" },
      { id: 203, session_id: "s-3", created_at: day(2), question: "Which colleges take the CompTIA A+ exam?",
        response: "I'm not sure which colleges do.", top_similarity: 0.33, topic_match: false, audience: "counselor" },
    ];
    const GUIDANCE = [
      { id: "g1", rule: "Call the program the CPL Initiative, never the MAP Initiative.", kind: "rule", surface: null, active: true,
        note: "Sam, 2026-07-03", created_by: "reviewer@example.org", created_at: day(30), updated_by: null, updated_at: day(30) },
      { id: "g2", rule: "When a college names a contact, give the contact before the policy.", kind: "rule", surface: "landing", active: false,
        note: null, created_by: "reviewer@example.org", created_at: day(5), updated_by: null, updated_at: day(5) },
    ];
    const RULES = [
      { key: "naming", body: "The platform is the MAP platform.", applies_when: null, sort_order: 1, active: true,
        memory_slug: null, updated_by: "reviewer@example.org", updated_at: day(3) },
    ];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/sierra_feedback\?/.test(u) ? (/page=eq\.smoke/.test(u) ? [] : FEEDBACK)
        : /\/chat_interactions\?/.test(u) ? TURNS
        : /\/sierra_guidance\?/.test(u) ? GUIDANCE
        : /\/sierra_turn_review\?/.test(u) ? []
        : /\/sierra_rules\?/.test(u) ? RULES
        : /\/team_access\?/.test(u) ? [{ id: 1 }] : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200,
        headers: { "Content-Type": "application/json", "Content-Range": "0-0/0" } }));
      return real.apply(this, arguments);
    };
    window.CPL_SIERRA_TRAINING_TAB.activate();
  });
  await page.waitForFunction(() => !!document.querySelector("#sierra-training-root .sit-stat"), null, { timeout: 20000 });
  if (state === "guidance") {
    await page.evaluate(() => {
      const el = document.querySelector("#sierra-training-root textarea");
      if (el) { el.scrollIntoView(); el.focus(); }
    });
  }
  await page.waitForTimeout(300);
}

// Memory as a team-phrase holder sees it (S398 UI pass): signed out, the cobi sweep measures
// the lock and the masthead only. The seed holds a team phrase, stubs the tab's read with
// tests/cpl_memory.test.js's synthetic shapes (never a live row: the table is team-gated),
// then opens one state through the view's own controls: the Add form, a record's tools, or
// the Report view.
async function seedMemory(page, theme, state) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "memory") location.hash = "memory"; });
  await page.waitForFunction(() => !!window.CPL_MEMORY, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate((state) => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const ROWS = [
      { id: "11111111-1111-1111-1111-111111111111", slug: "pr1", kind: "procedure", status: "verified",
        title: "Change the generator", summary: "Change the generator, not the HTML",
        detail: "Edit excel_to_dashboard.py; keep index.html identical. See f1.", tags: ["dashboard"],
        source: "CLAUDE.md Rule 1", affects: ["excel_to_dashboard.py", "index.html"], related: ["f1"] },
      { id: "22222222-2222-2222-2222-222222222222", slug: "f1", kind: "fact", status: "verified",
        title: "Two HTMLs", summary: "index.html and CPL_Dashboard.html must stay identical",
        detail: "The workflow copies one to the other.", tags: ["dashboard"], source: "CLAUDE.md Rule 4",
        affects: ["index.html"], related: [] },
      { id: "33333333-3333-3333-3333-333333333333", slug: "o1", kind: "opportunity", status: "proposed",
        title: "Stale articulations", summary: "Systemwide stale-articulation signal",
        detail: "Flag articulations absent from the current catalog.", tags: ["ccr"],
        source: "methodology-filter-live-counts", affects: [], related: [] },
    ];
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      const body = /\/cpl_memory_log/.test(u) ? [] : /\/cpl_memory\?/.test(u) ? ROWS : null;
      if (body) return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_MEMORY.activate();
  }, state);
  await page.waitForFunction(() => !!document.querySelector("#memory-root .mem-list li"), null, { timeout: 20000 });
  await page.evaluate((state) => {
    if (state === "add") { const b = document.querySelector("#memory-root .mem-addbtn"); if (b) b.click(); }
    if (state === "entry") { const li = document.querySelector("#memory-root .mem-list li"); if (li) li.click(); }
    if (state === "report") window.CPL_MEMORY._setViewMode("report");
  }, state);
  const ready = { add: ".mem-form-actions", entry: ".rp-tools", report: ".mr-btn" }[state];
  await page.waitForFunction((sel) => !!document.querySelector("#memory-root " + sel), ready, { timeout: 20000 });
  await page.waitForTimeout(300);
}

// MAP Data Quality as a team-phrase holder sees it (S404 UI pass): signed out, the cobi
// sweep measures the lock only. The seed holds a team phrase, stubs the register's read with
// tests/map_data_quality.test.js's synthetic shapes (never a live row: the table is
// team-gated), and opens the list or the Add form through the tab's own seams.
async function seedMapDataQuality(page, theme, state) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "map-data-quality") location.hash = "map-data-quality"; });
  await page.waitForFunction(() => !!window.CPL_MAP_DQ, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate((state) => {
    try {
      localStorage.setItem("cpl_team_pass", "seed-phrase");
      localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
    } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const ROWS = [
      { id: "a1", title: "Chaffey batch blanks (Cx & exams)", category: "blank-fields", severity: "high",
        status: "open", description: "Blank Cx and standardized-exam fields on batch uploads.", expected: "Validate required fields.",
        example_records: "student IDs TBD", affected_count: 427, college: "Chaffey College", source_report: "View_StudentAggregatedValues" },
      { id: "a2", title: "Potential Student = Yes origin lost", category: "origin-attribution", severity: "medium",
        status: "reported", description: "A boolean collapses three origins.", expected: "RequestOrigin enum.",
        example_records: "", affected_count: null, college: "", source_report: "" },
      { id: "a3", title: "USMC JST duplicate exhibits", category: "duplication", severity: "low",
        status: "in_progress", description: "Two exhibits per course.", expected: "One exhibit per course.",
        example_records: "", affected_count: 12, college: "", source_report: "" },
      { id: "a4", title: "Old resolved thing", category: "other", severity: "low",
        status: "verified", description: "Was fixed.", expected: "", example_records: "", affected_count: null,
        college: "Foothill", resolution: "Fixed in MAP 2.1." },
    ];
    const real = window.fetch;
    window.fetch = function (url) {
      if (/\/map_data_quality\?/.test(String(url))) return Promise.resolve(new Response(JSON.stringify(ROWS), { status: 200, headers: { "Content-Type": "application/json" } }));
      return real.apply(this, arguments);
    };
    window.CPL_MAP_DQ.activate();
    window.CPL_MAP_DQ._setData(ROWS);
    if (state === "form") window.CPL_MAP_DQ._openForm(null);
  }, state);
  const ready = { list: ".mdq-card .mdq-card-actions", form: "form.mdq-form" }[state];
  await page.waitForFunction((sel) => !!document.querySelector("#mdq-root " + sel), ready, { timeout: 20000 });
  await page.waitForTimeout(300);
}

// College Identity's roster (S371 UI pass). The tab reads map_colleges (public) and
// map_college_contacts (reviewer or team phrase) live; with every read aborted the cobi
// sweep paints only the failed-read notice and the snapshot's findings. The seed stands in
// both reads with real map_colleges rows (each row shape the table draws: variants, a
// continuing-education arm, a partner with no MIS code, a placeholder code, suppressed
// sandbox rows) and contact names that raise a live whitespace and an unknown finding.
async function seedCollegeIdentity(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "college-identity") location.hash = "college-identity"; });
  await page.waitForFunction(() => !!window.CPL_COLLEGE_IDENTITY_TAB, null, { timeout: 20000 });
  // The tab's own first load (every read aborted) must finish before the stand-ins go in.
  await page.waitForFunction(() => {
    const st = window.CPL_COLLEGE_IDENTITY_TAB._state;
    return !st.loading && (st.live || st.error);
  }, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const row = (id, name, kind, variants, district, d, c, why, test) => ({ college_id: id, college_name: name,
      entity_kind: kind, is_test: !!test, variants: variants, district: district, mis_district_code: d,
      mis_college_code: c, mis_absent_why: why || null });
    const PARTNER = "A partner organization we host a CPL landing page for, not a California Community College. "
      + "No MIS code exists, and none should be invented.";
    const COLLEGES = [
      row(24, "Calbright College Non-Credit", "college", ["CALBRIGHT", "Calbright College"],
        "California Online Community College District", "X00", "X02",
        "not in the supplied Appendix A (searched CALBRIGHT); statewide online college, launched 2018"),
      row(9, "Chaffey College", "college", ["CHAFFEY", "Chaffey"], "Chaffey Community College District", "920", "921"),
      row(133, "Futuro Health", "partner", [], null, null, null, PARTNER),
      row(73, "Los Angeles Southwest College", "college", ["LA Southwest", "LA SWEST", "Southwest", "Southwest College", "LA Swest"],
        "Los Angeles Community College District", "740", "745"),
      row(4, "NORCO College - Syllabus Manager", "test", [], null, null, null, null, true),
      row(119, "San Diego College of Continuing Education", "continuing_education",
        ["San Diego Adult", "SAN DIEGO ADULT", "San Diego College of Continuing Education Credit", "San Diego Continuing Education"],
        "San Diego Community College District", "070", "076"),
      row(96, "San Diego City College", "college", ["SAN DIEGO CITY", "San Diego City"], "San Diego Community College District", "070", "071"),
      row(5, "Testing College", "test", [], null, null, null, null, true),
    ];
    const CONTACTS = [{ college: "Chaffey College" }, { college: "San Diego City " }, { college: "Example Unlisted College" }];
    const json = (b) => Promise.resolve(new Response(JSON.stringify(b), { status: 200, headers: { "Content-Type": "application/json" } }));
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      if (/\/map_colleges\?/.test(u)) return json(COLLEGES);
      if (/\/map_college_contacts\?/.test(u)) return json(CONTACTS);
      return real.apply(this, arguments);
    };
    const M = window.CPL_COLLEGE_IDENTITY_TAB;
    M._state.live = null; M._state.error = null; M._state.contacts = null;
    M.activate();
  });
  await page.waitForFunction(() => {
    const st = window.CPL_COLLEGE_IDENTITY_TAB._state;
    return !st.loading && st.live && st.live.length && document.querySelector("#college-identity-root .cid-t");
  }, null, { timeout: 20000 });
  await page.waitForTimeout(300);
}

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

// My College on one college's page (S370 UI pass). The cobi sweep opens the tab on its scope
// question, so the page a college reads, its figures, strategies, credentials and drafts, was
// never measured. The sweep aborts every read off the origin, so this stands in each Supabase
// read with the table's own shape (columns from information_schema, 2026-10-12) and invented
// figures: the tracker is public, so no real contact or student count is written here. Then it
// picks the college through the page's own scope and college controls, as a reader does, and
// opens every section.
async function seedMyCollegePage(page, theme) {
  await page.evaluate(() => { if (location.hash.replace(/^#/, "") !== "college-briefing") location.hash = "college-briefing"; });
  await page.waitForFunction(() => !!window.CPL_COLLEGE_BRIEFING, null, { timeout: 20000 });
  // The tab's own first load (every read aborted) must finish before the stand-ins go in, or
  // it lands after them and empties the college list (the motion check seeds 400 ms after load).
  await page.waitForFunction(() => {
    const st = window.CPL_COLLEGE_BRIEFING._state;
    return !st.loading && (st.data || st.error);
  }, null, { timeout: 20000 });
  if (theme === "dark") await page.evaluate(() => window.CPL_THEME && window.CPL_THEME.set("dark"));
  await page.evaluate(() => {
    try { localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString()); } catch (e) { /* storage blocked */ }
    const x = document.querySelector(".cplfl-overlay.open #cplfl-close");
    if (x) x.click();
    const C = "Chaffey College", ID = 9;
    const CONFIG = { projects: {
      "cpl-implementation": { label: "CPL Implementation Funding", published: "Scenario 1",
        scenarios: { "Scenario 1": { yearPriorities: { "1": {
          "0": { share: 0.5, title: "Access", description: "Increase access.", metric: "Applied CPL Units measured in FTES",
                 strategies: ["Act on all JST credit recommendations in MAP", "Adopt or Adapt possible statewide credit recommendations"] },
          "1": { share: 0.3, title: "Institutionalize", description: "Institutionalize.", metric: "Transcribed CPL Units",
                 strategies: ["Complete Transcribe step in MAP for each student record with CPL"] },
          "2": { share: 0.2, title: "Outreach", description: "Reach students.",
                 strategies: ["Ensure a CPL Coordinator and/or Counselor is listed and responsive"] } } } } } } } };
    const COLLEGES = [{ college_id: ID, college_name: C, variants: ["Chaffey"] },
      { college_id: 12, college_name: "Cerritos College", variants: [] },
      { college_id: 81, college_name: "Mt. San Antonio College", variants: ["Mt. SAC"] }];
    const SUMMARY = [{ college_id: ID, students: 1200, suppressed: false, dormant_credits: 6000, articulated_waiting: 900,
      applied_credits: 15000, transcribed_credits: 450, built_at: "2026-10-01T00:00:00Z" }];
    const CONTACTS = [{ college: C, cpl_coordinator: "Pat Lee", cpl_coordinator_email: "coordinator@example.edu",
      cpl_counselor: "Jordan Cruz", cpl_counselor_email: "counselor@example.edu", landing_page_url: "https://example.edu/cpl" }];
    const roll = (t, types, s, pot, app, tr, ap, na) => ({ unified_title: t, cpl_types: types, students: s, students_suppressed: s == null,
      potential_units: pot, applied_units: app, transcribed_units: tr, apprenticeship_units: ap, rows_needs_action: na });
    const ROLLUP = [roll("AP U.S. History", ["Standardized Assessment"], 300, 1800, 1790, 6, 0, 0),
      roll("Army Basic Combat Training", ["Military Training"], 40, 320, 120, 0, 0, 12),
      roll("Electrician Apprenticeship (State of California)", ["Apprenticeship"], null, 96, 0, 0, 96, 3),
      roll("CompTIA Security+", ["Industry Certification"], 18, 54, 27, 0, 0, 2)];
    const ADOPTED = [{ unified_title: "AP U.S. History", cpl_types: ["Standardized Assessment"], statewide: true },
      { unified_title: "CompTIA Security+", cpl_types: ["Industry Certification"], statewide: false }];
    const POTENTIAL = [{ unified_title: "AP 2-D Art and Design", cpl_types: ["Credit By Exam", "Standardized Assessment"], statewide: false,
      ccc_rec: null, adopter_colleges: ["Cerritos College", "Mt. San Antonio College", "Norco College"] },
      { unified_title: "Emergency Medical Technician (EMT)", cpl_types: ["Industry Certification"], statewide: true,
        ccc_rec: "3 units EMS", adopter_colleges: ["Cerritos College"] }];
    const GOAL2 = [{ dest: "AREA", rows_n: 700, students: 650, suppressed: false, reason: null },
      { dest: "COURSE", rows_n: 5000, students: 1100, suppressed: false, reason: null }];
    const WAITING = [{ credit_rec: "3 semester units in Military Science", college_course: "MIL 1", course_type: "Course",
      sum_articulated_credits: 240, distinct_students: 80, withheld_recommendations: 0 },
      { credit_rec: "1 semester unit in Physical Education", college_course: "KIN 10", course_type: "Course",
        sum_articulated_credits: 60, distinct_students: null, withheld_recommendations: 2 }];
    // program_record_college_items' rows, one an item the college owns (S386).
    const ITEMS = [
      { program_title: "Welding Technology", control_number: "04755", award: "A.S. Degree", catalog_year: "2026-2027", checked: false,
        n: 1, kind: "Catalog and state file differ",
        text: "The catalog prints WELD 410 and WELD 413 for this program; the state's Program Course File does not list them." },
      { program_title: "Emergency Medical Technician", control_number: "20675", award: "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
        catalog_year: "2026-2027", checked: true, n: 1, kind: "Catalog and state file differ",
        text: "The state's Program Course File lists EMS 10, which the catalog does not print for this program." }];
    const json = (b) => Promise.resolve(new Response(JSON.stringify(b), { status: 200, headers: { "Content-Type": "application/json" } }));
    const real = window.fetch;
    window.fetch = function (url) {
      const u = String(url);
      if (/\/cpl_funding_config\?/.test(u)) return json([{ config: CONFIG }]);
      if (/\/map_colleges\?/.test(u)) return json(COLLEGES);
      if (/\/map_college_credit_summary(_pub)?\?/.test(u)) return json(SUMMARY);
      if (/\/map_college_contacts(_pub)?\?/.test(u)) return json(CONTACTS);
      if (/\/map_credential_student_rollup\?/.test(u)) return json(ROLLUP);
      if (/\/chatbox_credentials\?adopter_colleges/.test(u)) return json(ADOPTED);
      if (/\/chatbox_credentials\?potential_colleges/.test(u)) return json(POTENTIAL);
      if (/\/map_college_goal2(_pub)?\?/.test(u)) return json(GOAL2);
      if (/\/map_college_cr_waiting_pub\?|\/map_college_cr_unit\?/.test(u)) return json(WAITING);
      if (/\/program_source_registry\?/.test(u)) return json([{ college: C }]);
      if (/\/program_record_college_items\?/.test(u)) return json(ITEMS);
      return real.apply(this, arguments);
    };
    const M = window.CPL_COLLEGE_BRIEFING, root = document.getElementById("college-briefing-root");
    M._state.data = null; M._state.error = null; M._state.scope = null; M._state.college = null;
    M.activate();
  });
  // Through the page's own controls, but not with the mouse: a pointer click turns off
  // :focus-visible for the focus the sweep moves later, and every ring reads as missing.
  await page.waitForSelector('#college-briefing-root [data-scope="college"]', { timeout: 20000 });
  await page.evaluate(() => document.querySelector('#college-briefing-root [data-scope="college"]').click());
  await page.waitForFunction(() => {
    const s = document.querySelector("#cb-college");
    return s && Array.from(s.options).some((o) => o.value === "Chaffey College");
  }, null, { timeout: 20000 });
  await page.evaluate(() => {
    const s = document.querySelector("#cb-college");
    s.value = "Chaffey College";
    s.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(1200);
  // The drafts section paints from program_record_college_items (S386); a seed whose
  // stand-in read no longer matches the page's request would sweep a page without it.
  await page.waitForSelector("#college-briefing-root ul.cb-dr li", { state: "attached", timeout: 20000 });
  // Every section open, so the sweep measures what a reader can expand.
  await page.evaluate(() => {
    document.querySelectorAll("#college-briefing-root details").forEach((d) => { d.open = true; });
  });
  await page.waitForTimeout(300);
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


/* The Knowledge Base portal (kb-portal/, the Knowledge Base tab's frame; S423). The page's
   module imports its sign-in client from esm.sh, which the sweep aborts, so it never leaves
   "Loading". The seed shows the view to measure the way render() would, and the reader's
   seed fills the nav and an article with the shapes a document draws (headings, a table,
   code, a quote) as synthetic text. */
async function seedKbPortal(page, view) {
  await page.evaluate((view) => {
    const $ = (id) => document.getElementById(id);
    for (const id of ["boot", "login", "portal"]) $(id).style.display = id === (view === "login" ? "login" : "portal") ? "" : "none";
    if (view === "login") return;
    $("session-box").style.display = "";
    $("session-email").textContent = "reviewer@example.org";
    $("nav").innerHTML = '<div class="nav-group"><div class="nav-group-label">Methodology</div>' +
      '<a class="nav-link active" href="#doc=methodology/one.md">How the harvest reads a catalog</a>' +
      '<a class="nav-link" href="#doc=methodology/two.md">The glossary</a></div>';
    $("doc-meta").innerHTML = '<a class="src-link" href="https://example.org/src">View source on GitHub</a>';
    $("doc").innerHTML = '<h1>How the harvest reads a catalog</h1><p>A synthetic paragraph with <a href="#x">a link</a> and <code>inline code</code>.</p>' +
      '<h2>Section</h2><blockquote>A quoted line.</blockquote><pre><code>python3 kb/example.py</code></pre>' +
      '<table><thead><tr><th scope="col">Term</th><th scope="col">Meaning</th></tr></thead><tbody><tr><td>CPL</td><td>Credit for prior learning</td></tr></tbody></table>';
    if (view === "composer") {
      $("composer-overlay").style.display = "";
      $("composer-status").style.display = "";
      $("composer-status").textContent = "Formatted from your draft. Review it, then choose Open in GitHub to commit.";
      $("composer-status").className = "status-banner success";
    }
  }, view);
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
    /* The statewide grid's label strip (Program area, Exhibits, Credit recs,
       Adoptions, Could adopt) is hidden below 561px on purpose: each figure then
       carries its own label through ::before (factsheet.css, the 560px block).
       Measured S350 at 390px: 56 figures, none without its label. */
    mayHideBelow: [".sw-head"],
  },
  /* The same page dark (S352: First Light's port put it on the cpl_theme contract). */
  "fact-sheet-dark": {
    file: "fact-sheet/index.html",
    title: "CPL Fact Sheet (public), dark",
    mayHideBelow: [".sw-head"],
    seed: (page) => page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")),
  },

  /* The Knowledge Base portal, as a team member sees it (S423): the sign-in view, the reader
     with a synthetic document, and the composer. Light only: the portal carries First Light's
     light tokens and no dark palette yet. */
  "kb-portal": {
    file: "kb-portal/index.html",
    title: "Knowledge Base portal: sign-in",
    seed: (page) => seedKbPortal(page, "login"),
  },
  "kb-portal-reader": {
    file: "kb-portal/index.html",
    title: "Knowledge Base portal: reading a document (synthetic)",
    seed: (page) => seedKbPortal(page, "reader"),
  },
  "kb-portal-composer": {
    file: "kb-portal/index.html",
    title: "Knowledge Base portal: the new-document composer (synthetic)",
    seed: (page) => seedKbPortal(page, "composer"),
  },

  /* The privacy page Google's consent screen links for the Library filer
     (scripts/library_file.py); public, one column of prose (2026-10-06). */
  privacy: {
    file: "privacy.html",
    title: "Privacy: the CPL Library filer (public)",
    mayHideBelow: [],
  },
  /* The same page dark (S351, its first UI pass put it on the cpl_theme contract). */
  "privacy-dark": {
    file: "privacy.html",
    title: "Privacy: the CPL Library filer, dark",
    mayHideBelow: [],
    seed: (page) => page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark")),
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

  /* ── The CPL opportunity visual (Ashley and Sam, 2026-10-20) ──
     cpl-opportunity/index.html, one college per ?college=, linked from My
     College and the CPL Pathways college picker ("View CPL Visual"). Measured
     here with no college chosen: the picker, the status line and the empty
     state, which is what the page paints before its ~45 MB of data arrive. */
  "cpl-opportunity": {
    file: "cpl-opportunity/index.html",
    title: "CPL opportunity visual (shareable)",
    mayHideBelow: [],
  },

  /* ── The funding tab's Public page view (S307, 2026-09-30; reshaped 2026-10-15) ──
     Sam asked for the Public view and the explainer to be audited for
     consistent margins, AA and phone widths. Since 2026-10-15 (his call 1 on
     the one public funding page) the Public page view frames funding-model/
     itself, so this target measures the tab's chrome around the frame, opened
     by its link (?fundview=public); the page inside it is the page the two
     funding-model targets measure, and this runner does not read into frames.
     The old funding-public-mycpl target drew My CPL Funding on the tab's own
     public rendering, which retired with it; funding-model-mycpl holds that
     view on the one page that draws it. */
  "funding-public": {
    file: "index.html",
    query: "?fundview=public",
    title: "Implementation Funding, Public page view",
    routes: [{ hash: "implementation-funding", name: "public-view" }],
    widths: [390, 768, 1024, 1440],
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* How to meet it (Sam, 2026-10-15, call 5): the confirmation condition's
     dialog open over the statewide Eligibility requirements, the one dialog
     every surface opens. */
  "funding-model-howto": {
    file: "funding-model/index.html",
    title: "Funding model explainer: a How to meet it dialog open",
    widths: [390, 1440],
    seed: async (page) => {
      await page.evaluate(() => {
        const b = document.querySelector('#req-list [data-howto="part"]');
        if (b) b.click();
        // showModal() makes the page behind the dialog inert without the
        // attribute, which is what the focus measurement reads; say so, as
        // the Sierra dock does (S349), so the page behind is not measured here.
        const dlg = document.getElementById("cplFundHowTo");
        Array.prototype.forEach.call(document.body.children, (el) => { if (el !== dlg) el.setAttribute("inert", ""); });
      });
      await page.waitForTimeout(300);
    },
    mayHideBelow: [],
  },
  "funding-model-mycpl": {
    file: "funding-model/index.html",
    title: "Funding model explainer: My CPL Funding for a district",
    widths: [390, 768, 1024, 1440],
    seed: async (page) => {
      await page.evaluate(() => {
        // Step 1 is the one way in since 2026-10-15 (Sam's call 8).
        const pick = document.getElementById("cplFundOnePick");
        const opts = pick ? Array.from(pick.querySelectorAll('optgroup[label="Districts"] option')) : [];
        if (opts.length) { pick.value = opts[0].value; pick.dispatchEvent(new Event("change", { bubbles: true })); }
      });
      await page.waitForTimeout(900);
    },
    mayHideBelow: [],
  },
  /* ── Contracts, signed in (S364 UI pass) ─────────────────────────────────
     The register is gated; the cobi sweep measures its gate. */
  "raci-editor": {
    file: "index.html",
    title: "Team & RACI in edit mode, the matrix's cells as buttons",
    routes: [{ hash: "raci", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedRaciEditor(page, "light", "matrix"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "raci-editor-dark": {
    file: "index.html",
    title: "Team & RACI in edit mode, the matrix's cells as buttons, dark",
    routes: [{ hash: "raci", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedRaciEditor(page, "dark", "matrix"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "raci-directory": {
    file: "index.html",
    title: "Team & RACI in edit mode, the Team Directory's cells as buttons",
    routes: [{ hash: "raci", name: "directory" }],
    widths: [390, 1440],
    seed: (page) => seedRaciEditor(page, "light", "directory"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "raci-directory-dark": {
    file: "index.html",
    title: "Team & RACI in edit mode, the Team Directory's cells as buttons, dark",
    routes: [{ hash: "raci", name: "directory" }],
    widths: [390, 1440],
    seed: (page) => seedRaciEditor(page, "dark", "directory"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "nc-partners-editor": {
    file: "index.html",
    title: "Noncredit & Learning Partners with the team phrase: notes, artifacts, Revise",
    routes: [{ hash: "nc-learning-partners", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedNcPartnersEditor(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "nc-partners-editor-dark": {
    file: "index.html",
    title: "Noncredit & Learning Partners with the team phrase: notes, artifacts, Revise, dark",
    routes: [{ hash: "nc-learning-partners", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedNcPartnersEditor(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "governance-editor": {
    file: "index.html",
    title: "Governance with the team phrase: the register, live figures, owners, Docs & doctrine",
    routes: [{ hash: "governance", name: "editor" }],
    widths: [320, 390, 1440],
    seed: (page) => seedGovernance(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "governance-editor-dark": {
    file: "index.html",
    title: "Governance with the team phrase: the register, live figures, owners, Docs & doctrine, dark",
    routes: [{ hash: "governance", name: "editor" }],
    widths: [320, 390, 1440],
    seed: (page) => seedGovernance(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "team-phrases-reviewer": {
    file: "index.html",
    title: "Team Phrases signed in as a reviewer: the four phrases, one revealed, a saved and a failed message",
    routes: [{ hash: "team-phrases", name: "reviewer" }],
    widths: [320, 390, 1440],
    seed: (page) => seedTeamPhrases(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "team-phrases-reviewer-dark": {
    file: "index.html",
    title: "Team Phrases signed in as a reviewer, dark",
    routes: [{ hash: "team-phrases", name: "reviewer" }],
    widths: [320, 390, 1440],
    seed: (page) => seedTeamPhrases(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Admin, signed in as a reviewer (S368) ─────────────────────────────
     The arrange list, the inventory, the gate badges, Blast Radius and the
     live-session control paint only for a reviewer; the cobi sweep is signed out. */
  "admin-reviewer": {
    file: "index.html",
    title: "Admin signed in as a reviewer, one item open for rename and sites",
    routes: [{ hash: "admin", name: "reviewer" }],
    widths: [320, 390, 1440],
    seed: (page) => seedAdmin(page, "light", "tab"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "admin-reviewer-dark": {
    file: "index.html",
    title: "Admin signed in as a reviewer, one item open for who sees it, dark",
    routes: [{ hash: "admin", name: "reviewer" }],
    widths: [320, 390, 1440],
    seed: (page) => seedAdmin(page, "dark", "vis"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── MAP Team Queue, unlocked with the team phrase (S368) ──────────────
     The items, their ages and badges paint only for a phrase holder; the cobi
     sweep is signed out. */
  "map-queue-team": {
    file: "index.html",
    title: "MAP Team Queue unlocked with the team phrase, cleared items shown",
    routes: [{ hash: "map-queue", name: "team" }],
    widths: [320, 390, 1440],
    seed: (page) => seedMapQueue(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "map-queue-team-dark": {
    file: "index.html",
    title: "MAP Team Queue unlocked with the team phrase, cleared items shown, dark",
    routes: [{ hash: "map-queue", name: "team" }],
    widths: [320, 390, 1440],
    seed: (page) => seedMapQueue(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── GR Priorities, unlocked with a GR phrase (S394) ───────────────────
     The register, its filters, memos and artifacts paint only for a phrase
     holder; the cobi sweep is signed out. */
  "gr-priorities-gr": {
    file: "index.html",
    title: "GR Priorities unlocked with a GR phrase, the synthetic register",
    routes: [{ hash: "gr-priorities", name: "gr" }],
    widths: [320, 390, 1440],
    seed: (page) => seedGrPriorities(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "gr-priorities-gr-dark": {
    file: "index.html",
    title: "GR Priorities unlocked with a GR phrase, the synthetic register, dark",
    routes: [{ hash: "gr-priorities", name: "gr" }],
    widths: [320, 390, 1440],
    seed: (page) => seedGrPriorities(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── MAP Data Quality, unlocked with a team phrase (S404) ── */
  "mdq-list": {
    file: "index.html",
    title: "MAP Data Quality, a team-phrase holder's view: the register's cards and filters (synthetic rows)",
    routes: [{ hash: "map-data-quality", name: "list" }],
    widths: [390, 1440],
    seed: (page) => seedMapDataQuality(page, "light", "list"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "mdq-list-dark": {
    file: "index.html",
    title: "MAP Data Quality, a team-phrase holder's view: the register's cards and filters, dark (synthetic rows)",
    routes: [{ hash: "map-data-quality", name: "list" }],
    widths: [390, 1440],
    seed: (page) => seedMapDataQuality(page, "dark", "list"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "mdq-form": {
    file: "index.html",
    title: "MAP Data Quality, a team-phrase holder's view: the Add form open (synthetic rows)",
    routes: [{ hash: "map-data-quality", name: "form" }],
    widths: [390, 1440],
    seed: (page) => seedMapDataQuality(page, "light", "form"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "mdq-form-dark": {
    file: "index.html",
    title: "MAP Data Quality, a team-phrase holder's view: the Add form open, dark (synthetic rows)",
    routes: [{ hash: "map-data-quality", name: "form" }],
    widths: [390, 1440],
    seed: (page) => seedMapDataQuality(page, "dark", "form"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Sierra Training, signed in as a reviewer (S422) ── */
  "sierra-training-queue": {
    file: "index.html",
    title: "Sierra Training, a reviewer's view: the counts and the feedback queue (synthetic rows)",
    routes: [{ hash: "sierra-training", name: "queue" }],
    widths: [390, 1440],
    seed: (page) => seedSierraTraining(page, "light", "queue"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-training-queue-dark": {
    file: "index.html",
    title: "Sierra Training, a reviewer's view: the counts and the feedback queue, dark (synthetic rows)",
    routes: [{ hash: "sierra-training", name: "queue" }],
    widths: [390, 1440],
    seed: (page) => seedSierraTraining(page, "dark", "queue"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-training-guidance": {
    file: "index.html",
    title: "Sierra Training, a reviewer's view: the instructions editor (synthetic rows)",
    routes: [{ hash: "sierra-training", name: "guidance" }],
    widths: [390, 1440],
    seed: (page) => seedSierraTraining(page, "light", "guidance"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-training-guidance-dark": {
    file: "index.html",
    title: "Sierra Training, a reviewer's view: the instructions editor, dark (synthetic rows)",
    routes: [{ hash: "sierra-training", name: "guidance" }],
    widths: [390, 1440],
    seed: (page) => seedSierraTraining(page, "dark", "guidance"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Memory, unlocked with a team phrase (S398) ── */
  "memory-add": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: the Add form open (synthetic rows)",
    routes: [{ hash: "memory", name: "add" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "light", "add"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "memory-add-dark": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: the Add form open, dark (synthetic rows)",
    routes: [{ hash: "memory", name: "add" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "dark", "add"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "memory-entry": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: a record's tools (synthetic rows)",
    routes: [{ hash: "memory", name: "entry" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "light", "entry"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "memory-entry-dark": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: a record's tools, dark (synthetic rows)",
    routes: [{ hash: "memory", name: "entry" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "dark", "entry"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "memory-report": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: the Report view (synthetic rows)",
    routes: [{ hash: "memory", name: "report" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "light", "report"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "memory-report-dark": {
    file: "index.html",
    title: "Memory, a team-phrase holder's view: the Report view, dark (synthetic rows)",
    routes: [{ hash: "memory", name: "report" }],
    widths: [390, 1440],
    seed: (page) => seedMemory(page, "dark", "report"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "contracts": {
    file: "index.html",
    title: "Contracts, a reviewer's view of the V0718 fixture",
    routes: [{ hash: "contracts", name: "reviewer" }],
    widths: [390, 1440],
    seed: (page) => seedContracts(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "contracts-dark": {
    file: "index.html",
    title: "Contracts, a reviewer's view of the V0718 fixture, dark",
    routes: [{ hash: "contracts", name: "reviewer" }],
    widths: [390, 1440],
    seed: (page) => seedContracts(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Annual Workplan Goals, signed in (S364) ─────────────────────────────
     The editor's words, its save states and the Add new row dialog paint only
     for a signed-in editor; the cobi sweep is signed out. */
  "workplan-goals-editor": {
    file: "index.html",
    title: "Annual Workplan Goals, signed in, one cell in each save state",
    routes: [{ hash: "workplan-goals", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedWorkplanGoalsEditor(page, "light", false),
    keyboard: async (page) => workplanGoalsKeyboardChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "workplan-goals-editor-dark": {
    file: "index.html",
    title: "Annual Workplan Goals, signed in, one cell in each save state, dark",
    routes: [{ hash: "workplan-goals", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedWorkplanGoalsEditor(page, "dark", false),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "workplan-goals-add": {
    file: "index.html",
    title: "Annual Workplan Goals, the Add sub-activity dialog",
    routes: [{ hash: "workplan-goals", name: "add" }],
    widths: [390, 1440],
    seed: (page) => seedWorkplanGoalsEditor(page, "light", true),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "workplan-goals-add-dark": {
    file: "index.html",
    title: "Annual Workplan Goals, the Add sub-activity dialog, dark",
    routes: [{ hash: "workplan-goals", name: "add" }],
    widths: [390, 1440],
    seed: (page) => seedWorkplanGoalsEditor(page, "dark", true),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Budget, signed in, mid-save (S364) ──────────────────────────────────
     The save states paint only while a write is in flight; the cobi sweep is
     signed out and never sees them. */
  "budget-editor": {
    file: "index.html",
    title: "Budget, signed in, one cell in each save state",
    routes: [{ hash: "budget", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedBudgetEditor(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "budget-editor-dark": {
    file: "index.html",
    title: "Budget, signed in, one cell in each save state, dark",
    routes: [{ hash: "budget", name: "editor" }],
    widths: [390, 1440],
    seed: (page) => seedBudgetEditor(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── The funding tab, signed in (S364 UI pass) ───────────────────────────
     The cobi sweep is signed out, so it never paints the curator's controls,
     the ones the 2026-10-09 rule turned into underlined words. */
  "funding-curator": {
    file: "index.html",
    title: "Implementation Funding, signed in as a curator",
    routes: [{ hash: "implementation-funding", name: "curator" }],
    widths: [390, 1440],
    seed: (page) => seedFundingCurator(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "funding-curator-dark": {
    file: "index.html",
    title: "Implementation Funding, signed in as a curator, dark",
    routes: [{ hash: "implementation-funding", name: "curator" }],
    widths: [390, 1440],
    seed: (page) => seedFundingCurator(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
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
  /* ── My College: a college's page, every section open (S370 UI pass) ───────
     The cobi target stops at the scope question. These pick a college through
     the page's own controls with each read stood in (seedMyCollegePage). */
  "my-college-page": {
    file: "index.html",
    title: "My College: one college's page, every section open",
    routes: [{ hash: "college-briefing", name: "college-page" }],
    widths: [320, 390, 1440],
    seed: (page) => seedMyCollegePage(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── College Identity: the roster with both reads stood in (S371 UI pass) ──
     The cobi target paints the failed-read notice: the sandbox reaches no
     database. These seed the table a reader uses (seedCollegeIdentity). */
  "college-identity-roster": {
    file: "index.html",
    title: "College Identity: the roster and the live contact findings",
    routes: [{ hash: "college-identity", name: "roster" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCollegeIdentity(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "college-identity-roster-dark": {
    file: "index.html",
    title: "College Identity: the roster and the live contact findings, dark",
    routes: [{ hash: "college-identity", name: "roster" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCollegeIdentity(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "my-college-page-dark": {
    file: "index.html",
    title: "My College: one college's page, every section open, dark",
    routes: [{ hash: "college-briefing", name: "college-page" }],
    widths: [320, 390, 1440],
    seed: (page) => seedMyCollegePage(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── CPL Pathways: a harvested catalog record (S334) ──────────────────────
     The ROEP program view opens from the pathway selector, so the cobi sweep,
     which lands on the tab's first pathway, never paints it. One target per
     theme, seeded through the selector the reader uses, on the record with the
     most on screen (Cerritos Ironworker: an option fork, every CPL kind). */
  "cer-reference": {
    file: "index.html",
    title: "Common Exhibit Reference: Reference, the credentials grid, a row open",
    routes: [{ hash: "credential-reference", name: "reference" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCerReference(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-progress": {
    file: "index.html",
    title: "Common Exhibit Reference: Progress, the Commons' dash",
    routes: [{ hash: "credential-reference", name: "progress" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCerProgress(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-progress-dark": {
    file: "index.html",
    title: "Common Exhibit Reference: Progress, dark",
    routes: [{ hash: "credential-reference", name: "progress-dark" }],
    widths: [390, 1440],
    seed: (page) => seedCerProgress(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* The Common CR Reference's Progress view (S437): the Commons' dash for the reference,
     drawn once the module, the definitions, the run log and the Commons figures are in. The
     cobi sweep lands on the worklist, so the view needs its own target. */
  "cr-progress": {
    file: "index.html",
    title: "Common CR Reference: Progress, the Commons' dash",
    routes: [{ hash: "cr-reference", name: "progress" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCrProgress(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cr-progress-dark": {
    file: "index.html",
    title: "Common CR Reference: Progress, dark",
    routes: [{ hash: "cr-reference", name: "progress-dark" }],
    widths: [390, 1440],
    seed: (page) => seedCrProgress(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-reference-dark": {
    file: "index.html",
    title: "Common Exhibit Reference: Reference, dark",
    routes: [{ hash: "credential-reference", name: "reference-dark" }],
    widths: [390, 1440],
    seed: (page) => seedCerReference(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-procedures": {
    file: "index.html",
    title: "Common Exhibit Reference: Procedures, one opened to what it did",
    routes: [{ hash: "credential-reference", name: "procedures" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCerProcedures(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-procedures-dark": {
    file: "index.html",
    title: "Common Exhibit Reference: Procedures, dark",
    routes: [{ hash: "credential-reference", name: "procedures-dark" }],
    widths: [390, 1440],
    seed: (page) => seedCerProcedures(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-industry": {
    file: "index.html",
    title: "Common Exhibit Reference: the Industry credentials lane, a record open",
    routes: [{ hash: "credential-reference", name: "industry" }],
    widths: [320, 390, 1440],
    seed: (page) => seedCerIndustry(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cer-industry-dark": {
    file: "index.html",
    title: "Common Exhibit Reference: the Industry credentials lane, dark",
    routes: [{ hash: "credential-reference", name: "industry-dark" }],
    widths: [390, 1440],
    seed: (page) => seedCerIndustry(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
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
  "cpl-pathways-table": {
    file: "index.html",
    title: "CPL Pathways: an unchecked record read from the table",
    routes: [{ hash: "cpl-pathways", name: "table-unchecked" }],
    widths: [320, 390, 1440],
    seed: (page) => seedRoepTable(page, "light", "unchecked"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "cpl-pathways-table-dark": {
    file: "index.html",
    title: "CPL Pathways: a record read that failed, dark",
    routes: [{ hash: "cpl-pathways", name: "table-failed" }],
    widths: [390, 1440],
    seed: (page) => seedRoepTable(page, "dark", "failed"),
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
  /* ── Common Subjects Reference: the Progress view (S425) and the table ──
     The cobi sweep opens the tab on its default view, Progress, in light; these two add the
     dark Progress view and the Reference view (the table) by its route. */
  "canonical-subj4-progress-dark": {
    file: "index.html",
    title: "Common Subjects Reference: Progress, dark",
    routes: [{ hash: "canonical-subj4/progress", name: "progress-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedCsrProgress(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "canonical-subj4-reference": {
    file: "index.html",
    title: "Common Subjects Reference: the table",
    routes: [{ hash: "canonical-subj4/reference", name: "reference" }],
    widths: [390, 768, 1024, 1440],
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
  /* ── Program Requirements: a Records filter open (S391 UI pass) ──────── */
  "program-requirements-filter": {
    file: "index.html",
    title: "Program Requirements: Records, a filter open",
    routes: [{ hash: "program-requirements", name: "filter" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedFilterOpen(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "program-requirements-filter-dark": {
    file: "index.html",
    title: "Program Requirements: Records, a filter open, dark",
    routes: [{ hash: "program-requirements", name: "filter-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedFilterOpen(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Program Requirements: the exhibits view (S355) ─────────────────────
     A course's CPL count opened: what is articulated here, the leads. */
  "program-requirements-exhibits": {
    file: "index.html",
    title: "Program Requirements: the exhibits articulated to a course",
    routes: [{ hash: "program-requirements", name: "exhibits" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedExhibits(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "program-requirements-exhibits-dark": {
    file: "index.html",
    title: "Program Requirements: the exhibits view, dark",
    routes: [{ hash: "program-requirements", name: "exhibits-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedExhibits(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Program Requirements: side by side (S355) ─────────────────────────
     A record beside its catalog page, one per theme: the dialog over the
     tab, its bar, the frame's pane and the record with Your reading. */
  "program-requirements-split": {
    file: "index.html",
    title: "Program Requirements: a record side by side with its catalog page",
    routes: [{ hash: "program-requirements", name: "split" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSplit(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "program-requirements-split-dark": {
    file: "index.html",
    title: "Program Requirements: side by side, dark",
    routes: [{ hash: "program-requirements", name: "split-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSplit(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── The docked Sierra, full screen (S349, Sheet 54 card 1) ─────────────
     Expanded over My College with six seeded turns, one per theme:
     the dialog, the page behind it inert, the sticky box, End and Escape. */
  "sierra-dock-full": {
    file: "index.html",
    title: "Sierra docked, full screen while she answers",
    routes: [{ hash: "college-briefing", name: "dock-full" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraDockFull(page, "light"),
    keyboard: async (page) => sierraDockFullChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-dock-full-dark": {
    file: "index.html",
    title: "Sierra docked, full screen while she answers, dark",
    routes: [{ hash: "college-briefing", name: "dock-full-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraDockFull(page, "dark"),
    keyboard: async (page) => sierraDockFullChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* ── Sierra AI over a COBI tab (S398) ─────────────────────────────────────
     The box CPL_CHAT.open() builds, the CPL Assistant tab's heir, open over
     Sierra Training with six seeded turns, one per theme: the dialog, the page
     behind it inert, the sticky box, End, and Escape closing her into her host. */
  "sierra-cobi-full": {
    file: "index.html",
    title: "Sierra AI over a COBI tab",
    routes: [{ hash: "sierra-training", name: "cobi-full" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraCobiFull(page, "light"),
    keyboard: async (page) => sierraCobiFullChecks(page),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "sierra-cobi-full-dark": {
    file: "index.html",
    title: "Sierra AI over a COBI tab, dark",
    routes: [{ hash: "sierra-training", name: "cobi-full-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedSierraCobiFull(page, "dark"),
    keyboard: async (page) => sierraCobiFullChecks(page),
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
  /* ── MAP Users, signed in (S358 UI pass) ─────────────────────────────────
     The roster lens with one roster open, and the student-contact worklist
     with a proposal editor open, one per theme. */
  "map-users-roster": {
    file: "index.html",
    title: "MAP Users, signed in: the roster",
    routes: [{ hash: "map-users", name: "roster" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMapUsers(page, "light", "all"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "map-users-roster-dark": {
    file: "index.html",
    title: "MAP Users, signed in: the roster, dark",
    routes: [{ hash: "map-users", name: "roster-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMapUsers(page, "dark", "all"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "map-users-gaps": {
    file: "index.html",
    title: "MAP Users, signed in: the student-contact worklist",
    routes: [{ hash: "map-users", name: "gaps" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMapUsers(page, "light", "gaps"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "map-users-gaps-dark": {
    file: "index.html",
    title: "MAP Users, signed in: the student-contact worklist, dark",
    routes: [{ hash: "map-users", name: "gaps-dark" }],
    widths: [390, 768, 1024, 1440],
    seed: (page) => seedMapUsers(page, "dark", "gaps"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  /* The Common Course Reference opens on SkyView, filling the window, so the cobi
     sweep measures the map and never the list a curator works in (S378 UI pass:
     the list's dark faults went unseen). #unified-courses/list is the list's own
     link; the seed waits for its table, a 10 MB data file the tab loads on open. */
  "ccr-list": {
    file: "index.html",
    title: "Common Course Reference, the list view",
    routes: [{ hash: "unified-courses/list", name: "list" }],
    widths: [390, 1440],
    settle: 1500,
    seed: (page) => seedCcrList(page, "light"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "ccr-list-dark": {
    file: "index.html",
    title: "Common Course Reference, the list view, dark",
    routes: [{ hash: "unified-courses/list", name: "list-dark" }],
    widths: [390, 1440],
    settle: 1500,
    seed: (page) => seedCcrList(page, "dark"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "exhibit-adoption-table": {
    file: "index.html",
    title: "Exhibit Adoption, the adoption table",
    routes: [{ hash: "exhibit-adoption", name: "table" }],
    widths: [390, 1440],
    seed: (page) => seedExhibitView(page, "light", "table"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "exhibit-adoption-table-dark": {
    file: "index.html",
    title: "Exhibit Adoption, the adoption table, dark",
    routes: [{ hash: "exhibit-adoption", name: "table-dark" }],
    widths: [390, 1440],
    seed: (page) => seedExhibitView(page, "dark", "table"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "exhibit-adoption-matrix": {
    file: "index.html",
    title: "Exhibit Adoption, the adoption matrix",
    routes: [{ hash: "exhibit-adoption", name: "matrix" }],
    widths: [390, 1440],
    seed: (page) => seedExhibitView(page, "light", "matrix"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  "exhibit-adoption-matrix-dark": {
    file: "index.html",
    title: "Exhibit Adoption, the adoption matrix, dark",
    routes: [{ hash: "exhibit-adoption", name: "matrix-dark" }],
    widths: [390, 1440],
    seed: (page) => seedExhibitView(page, "dark", "matrix"),
    mayHideBelow: [".cpl-sidebar", ".cpl-sidebar *", ".cpl-tab-pane", ".cpl-tab-pane *"],
  },
  },
};
