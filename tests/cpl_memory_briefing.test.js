// 🧠 Memory tab — the Briefing panel (cpl_memory.js).
//
//   Sam, 2026-08-24: "a button on the memory tab to generate a simple narrative
//   briefing on how you understand the memories… seeing how you would use them
//   for output would help spot obvious misunderstandings."
//
//   The panel sits at the top of the Report view, sends the rows that view is
//   showing to cpl-chat on the `memory-briefing` surface, and renders a
//   first-person read-back whose every claim cites the entry behind it.
//
// WHAT THIS GUARDS, and why each one is here rather than left to reading:
//
//   * THE BUDGET, read out of the edge function. `QUERY_CAP_BRIEFING` lives in
//     index.ts and is applied server-side; a number restated here would pass
//     happily while the real one moved. That is exactly how Autogenerate came to
//     send a 984-character envelope into a 1,000-character cap and draft the
//     wrong subject entirely (PR #1320).
//
//   * DISCLOSURE. A briefing over 48 of 63 entries must say "48 of 63". A capped
//     read that reports nothing reads as a census of the table — the failure this
//     repo keeps re-learning (peer_total, the matrix column, the LACCD three).
//
//   * CORPUS FIRST. Whatever a cap ever eats has to be instruction text: losing
//     the instructions produces a visibly uncited briefing, losing the corpus
//     tail produces a briefing that silently covers less than it claims.
//
//   * CITATIONS, INCLUDING BAD ONES. A slug that is not an entry renders FLAGGED,
//     not as plain text. A claim nobody can follow back is the thing the panel
//     exists to expose, so it must not be quietly indistinguishable from prose.
//
//   * NOTHING IS SAVED. The panel writes to no table.
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_briefing.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { liftBlock } = require("./lib/lift_ts.js");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("cpl_memory.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");
const SRV = fs.readFileSync("chatbox/supabase/functions/cpl-chat/index.ts", "utf8");

function boot() {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-memory"><div id="memory-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {}
  window.eval(teamSrc);
  window.eval(src);
  return window;
}

// Rows shaped like the tab's own ingest output (id = slug).
function rows(n, detailChars) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    out.push({
      id: "s" + i, kind: i % 2 ? "fact" : "pitfall", status: "verified",
      title: "Entry number " + i,
      summary: "Summary for entry " + i + " about credit and articulation.",
      detail: "D".repeat(detailChars || 600),
      tags: ["alpha", i % 3 ? "beta" : "gamma"], org: "cpl", affects: [], related: [],
    });
  }
  return out;
}

(async () => {
  const win = boot();
  const api = win.CPL_MEMORY;

  check("cpl_memory.js exposes the briefing seams", api &&
    typeof api._briefDigest === "function" && typeof api._briefQuery === "function" &&
    typeof api._briefRetrieval === "function" && typeof api._briefFetch === "function" &&
    typeof api._renderBriefingPanel === "function" && typeof api._renderBriefText === "function");

  // ── (1) THE BUDGET — measured against the server's own number ──────────────
  let SURF = null;
  try {
    SURF = liftBlock(SRV, "const KNOWN_SURFACES", "function buildSystemPrompt(",
      ["KNOWN_SURFACES", "DRAFTING_SURFACES", "SURFACE_QUERY_CAPS", "queryCapFor"]);
  } catch (e) { check("(1) the surface/cap block lifts out of the edge function — " + e.message, false); }

  if (SURF) {
    const CAP = SURF.queryCapFor("memory-briefing");
    const MAX = api._briefQueryMax;
    const MAXOK = typeof MAX === "number" && MAX > 0;
    check("(1) the client declares a briefing budget", MAXOK);
    check("(1) memory-briefing is a known surface", SURF.KNOWN_SURFACES.has("memory-briefing"));
    check("(1) memory-briefing is a drafting surface (so the doctrine is replaced)",
      SURF.DRAFTING_SURFACES.has("memory-briefing"));
    check("(1) ⭐ the client's budget does not exceed the server's cap",
      MAXOK && MAX <= CAP, "client " + MAX + " vs server cap " + CAP);
    // ⚠ The two vocabularies must agree in BOTH directions: a surface declared
    // as drafting with no cap silently gets 1,000 and truncates, which is the
    // original defect arriving through the table instead of the ternary.
    check("(1) every drafting surface has its own cap, and every cap is a drafting surface",
      JSON.stringify(Object.keys(SURF.SURFACE_QUERY_CAPS).sort())
        === JSON.stringify([...SURF.DRAFTING_SURFACES].sort()));

    // A real full-corpus digest has to fit — built the way the panel builds it,
    // with NO budget argument, so the envelope is inside the measurement. Passing
    // MAX here is what hid the overshoot the first time: the corpus fitted and
    // the wrapped query did not. 500 rows is well past the live table.
    const big = api._briefDigest(rows(500));
    const q = api._briefQuery(big.text, { used: big.used, total: big.total, scope: "test" });
    check("(1) ⭐ a whole-corpus briefing fits under the server cap",
      MAXOK && q.length <= CAP, "built " + q.length + " against " + CAP);
  }

  // ── (2) DISCLOSURE — the digest reports what it could not carry ────────────
  const many = rows(500);
  const trimmed = api._briefDigest(many, 4000);   // explicit budget: trimming behavior only
  check("(2) an over-budget set is trimmed, not silently sent whole",
    trimmed.text.length <= 4000);
  check("(2) ⭐ the digest reports how many entries it actually read",
    trimmed.used < trimmed.total && trimmed.total === 500 && trimmed.used > 0,
    "used " + trimmed.used + " of " + trimmed.total);
  check("(2) detail is dropped BEFORE entries are (enrichment loses first)",
    trimmed.detail === false);
  const smallSet = api._briefDigest(rows(3, 50), 20000);
  check("(2) a set that fits is read whole, with detail",
    smallSet.used === 3 && smallSet.total === 3 && smallSet.detail === true);
  check("(2) a fitting digest carries each entry's slug", /\[s1\]/.test(smallSet.text)
    && /\[s2\]/.test(smallSet.text) && /\[s3\]/.test(smallSet.text));

  // ── (3) CORPUS FIRST, instructions last ───────────────────────────────────
  const q3 = api._briefQuery(smallSet.text, { used: 3, total: 3, scope: "verified only" });
  check("(3) ⭐ the entries appear before the instruction block",
    q3.indexOf("[s1]") < q3.indexOf("Brief me on them"));
  check("(3) the instructions ask for citations and forbid inventing them",
    /square brackets/i.test(q3) && /[Nn]ever invent one/.test(q3));
  check("(3) the instructions ask for the knowledge-base comparison",
    /knowledge base agrees or differs/i.test(q3));
  check("(3) the instructions ask for tension to be evidenced by slugs",
    /point at it with two slugs/i.test(q3));
  check("(3) the header states the read count", /3 of 3/.test(q3));
  // Sam, 2026-08-24: "Use plain language:)" — asked for as a requirement, so it
  // is asserted rather than trusted to survive the next edit of the block.
  check("(3) ⭐ plain language is stated as a requirement, not a style note",
    /PLAIN LANGUAGE\. This is the requirement/.test(q3)
    && /Short sentences/.test(q3) && /two\s*\n?\s*minutes/.test(q3));

  // ── (4) retrieval_query is the SUBJECT, never the corpus ──────────────────
  const rq = api._briefRetrieval(rows(40, 600), "verified only · area: cpl");
  check("(4) ⭐ the KB search text is not the corpus", rq.indexOf("DDDDDD") < 0);
  check("(4) the KB search text fits cpl-chat's own 1,000-char retrieval cap", rq.length <= 1000);
  check("(4) the KB search text carries the scope and the commonest tags",
    /verified only/.test(rq) && /alpha/.test(rq));

  // ── (5) end-to-end: the panel sends the rows on screen, and saves nothing ──
  let sent = null, calls = [];
  win.fetch = function (url, opts) {
    calls.push(String(url));
    sent = opts && opts.body;
    return Promise.resolve({
      ok: true, status: 200,
      text: () => Promise.resolve(
        "Here's what I understand from these entries. The first one is about credit [s1], "
        + "and the second complicates it [s2].\n\n**Where the knowledge base agrees or differs** "
        + "Nothing in the knowledge base speaks to this.\n\n**What looks unclear or in tension** "
        + "[s1] and [zzz] cannot both be right."),
    });
  };
  const three = rows(3, 50);
  api._setData(three);
  const host = win.document.createElement("div");
  win.document.body.appendChild(host);
  host.appendChild(api._renderBriefingPanel(three, "verified only · 3 entries"));

  check("(5) the panel renders a button and a lead", !!host.querySelector(".mb-btn")
    && /How I read these entries/.test(host.textContent));
  // ⚠ The lead must not claim this is what the public assistant says — it never
  // reads this table, and a briefing dressed as a Sierra answer proves nothing.
  check("(5) ⭐ the lead says this is an agent read-back, not a public-assistant answer",
    /not what the CPL Assistant tells the public/i.test(host.textContent));

  host.querySelector(".mb-btn").click();
  await tick(); await tick(); await tick(); await tick();

  const body = JSON.parse(String(sent || "{}"));
  check("(5) the briefing POSTs to cpl-chat", calls.some((u) => /\/functions\/v1\/cpl-chat$/.test(u)));
  check("(5) ⭐ it names the memory-briefing surface", body.surface === "memory-briefing");
  check("(5) it sends every row that is on screen", /\[s1\]/.test(body.query)
    && /\[s2\]/.test(body.query) && /\[s3\]/.test(body.query));
  check("(5) retrieval_query rides along and is not the corpus",
    typeof body.retrieval_query === "string" && body.retrieval_query.indexOf("[s1]") < 0);
  check("(5) ⭐ nothing is written — no call to the memory table",
    !calls.some((u) => /rest\/v1\/cpl_memory/.test(u)));

  // ── (6) CITATIONS — followable, and flagged when they are not ─────────────
  const out = host.querySelector(".mb-out");
  const cites = out ? out.querySelectorAll("a[data-ref]") : [];
  check("(6) a cited slug renders as a link into the entry", cites.length >= 2);
  check("(6) the links carry the slug they cite",
    Array.prototype.some.call(cites, (a) => a.getAttribute("data-ref") === "s1"));
  check("(6) ⭐ a citation to no entry is FLAGGED, not left as prose",
    !!(out && out.querySelector(".mb-badref")) &&
    /zzz/.test(out.querySelector(".mb-badref").textContent));
  check("(6) ⚠ …and the status line says so, so an unsourced claim is not silent",
    /citations? to no entry/i.test(host.querySelector(".mb-status").textContent));
  check("(6) the status line reports the read count",
    /Read 3 of 3/.test(host.querySelector(".mb-status").textContent));

  // ── (7) the slug walker is DOM-safe ───────────────────────────────────────
  // A regex over rendered HTML can match inside an attribute; this walks text
  // nodes. Guard both halves: markup survives, and an existing link is left be.
  const h2 = win.document.createElement("div");
  api._renderBriefText(h2, "See [s1] here.", { s1: 1 });
  check("(7) a slug inside prose links", !!h2.querySelector('a[data-ref="s1"]'));
  // ⭐ NUMBERED, not the slug itself. This table's slugs are whole sentences, so
  // printing them inline put more citation than prose on the page.
  check("(7) ⭐ the inline citation renders as a number, not the slug",
    h2.querySelector(".mb-cite") && h2.querySelector(".mb-cite").textContent === "1");
  check("(7) the number is still identifiable without hovering (accessible name)",
    /s1|Entry 1/.test(h2.querySelector(".mb-cite").getAttribute("aria-label") || ""));
  // ⚠ The number is only followable because the list under it says what it is.
  check("(7) ⭐ a numbered citation gets a source list entry naming the entry",
    !!h2.querySelector(".mb-sources") && !!h2.querySelector('.mb-srclist a[data-ref="s1"]'));
  check("(7) the source list carries the slug too", /s1/.test(h2.querySelector(".mb-srcslug").textContent));
  // The same entry cited twice is ONE source, numbered once.
  const h4 = win.document.createElement("div");
  api._renderBriefText(h4, "One [s1] and again [s1] and another [s2].", { s1: 1, s2: 1 });
  check("(7) a repeated citation reuses its number", h4.querySelectorAll(".mb-cite").length === 3
    && h4.querySelectorAll(".mb-srclist li").length === 2);
  // ── the hover/focus card (Sam: "superscript numbers with hover over to see
  // the memory") ─────────────────────────────────────────────────────────────
  // ⚠ The card reads byId[slug] — the entry as the TABLE holds it, not whatever
  // object the caller happened to pass. That is the right source (the card must
  // show the memory, not the briefing's copy of it), so the fixture goes into
  // the table first.
  const HOVER_ROW = { id: "s1", kind: "pitfall", status: "verified",
    title: "A title worth reading", summary: "The summary the reader hovers to see.",
    detail: "d", tags: [], affects: [], related: [] };
  api._setData([HOVER_ROW]);
  const hoverHost = win.document.createElement("div");
  const hoverPanel = api._renderBriefingPanel([HOVER_ROW], "scope");
  win.document.body.appendChild(hoverHost); hoverHost.appendChild(hoverPanel);
  api._renderBriefText(hoverPanel.querySelector(".mb-out"), "A claim [s1].", { s1: 1 });
  const cite = hoverPanel.querySelector("a.mb-cite");
  check("(7h) the citation is a superscript number", cite && cite.textContent === "1");
  // ⚠ No native title: it would double up with the card and cannot carry the
  // kind, the status and a wrapped summary together.
  check("(7h) no native title competing with the card", !cite.getAttribute("title"));
  check("(7h) the accessible name carries the entry for a screen reader",
    /A title worth reading/.test(cite.getAttribute("aria-label") || ""));
  cite.onmouseenter();
  const tip = hoverPanel.querySelector(".mb-tip");
  check("(7h) ⭐ hovering shows a card with the memory in it", !!tip
    && /The summary the reader hovers to see/.test(tip.textContent)
    && /A title worth reading/.test(tip.textContent));
  check("(7h) the card names the kind and the status",
    /Pitfall/i.test(tip.textContent) && /verified/.test(tip.textContent));
  cite.onmouseleave();
  check("(7h) leaving the citation closes it", !hoverPanel.querySelector(".mb-tip"));
  // ⚠ A citation is a link, so it is on the keyboard path whether or not anyone
  // planned for it. If only the mouse can read the memory behind a number, the
  // number is unreadable to everyone else.
  cite.onfocus();
  check("(7h) ⭐ FOCUS opens it too, not only hover", !!hoverPanel.querySelector(".mb-tip"));
  cite.onkeydown({ key: "Escape" });
  check("(7h) Escape closes it", !hoverPanel.querySelector(".mb-tip"));
  cite.onfocus(); cite.onblur();
  check("(7h) blur closes it", !hoverPanel.querySelector(".mb-tip"));
  cite.onfocus();
  check("(7h) only one card is ever open", (function () {
    cite.onfocus(); return hoverPanel.querySelectorAll(".mb-tip").length === 1;
  })());
  api._hideCiteCard();

  // An entry that exists but was NOT sent is marked, not folded in silently.
  // Re-seed: the hover fixture above narrowed the table to one row, and "exists
  // but was not briefed" needs s2 to exist.
  api._setData(three);
  const h5 = win.document.createElement("div");
  api._renderBriefText(h5, "Outside the set [s2].", { s1: 1 });
  check("(7) ⚠ a cited entry outside the briefed set is marked in the source list",
    !!h5.querySelector(".mb-srcflag"));
  const h3 = win.document.createElement("div");
  h3.innerHTML = '<a href="#" data-ref="s2">already a link [s1]</a><p>loose [s1]</p>';
  const stat = api._renderBriefText
    ? (function () { const tmp = win.document.createElement("div"); tmp.innerHTML = h3.innerHTML; return tmp; })()
    : null;
  if (stat) {
    // Re-run the linker over content that already contains an anchor.
    api._renderBriefText(stat, "loose [s1] and more", { s1: 1 });
    // Not "one anchor" — the source list is anchors too. What must never happen
    // is a link INSIDE a link, which is what a second pass over rendered output
    // would produce.
    check("(7) re-rendering replaces content rather than nesting links",
      stat.querySelectorAll("a[data-ref] a").length === 0
      && stat.querySelectorAll(".mb-cite").length === 1);
  }

  // ── (7c) clicking a citation opens THAT ROW, ready to edit ────────────────
  // Sam, 2026-08-24: "Would be nice if it took me to the memory table to edit if
  // clicked… directly to the memory row."
  api._setSession({ kind: "phrase" });
  api._setData(three);
  api.activate(win.document.getElementById("memory-root"));
  const clickHost = win.document.createElement("div");
  win.document.body.appendChild(clickHost);
  const clickPanel = api._renderBriefingPanel(three, "scope");
  clickHost.appendChild(clickPanel);
  api._renderBriefText(clickPanel.querySelector(".mb-out"), "A claim [s2].", { s2: 1 });
  check("(7c) the lead promises editing when a session can edit",
    /open that entry for editing/.test(clickPanel.textContent));
  clickPanel.querySelector("a.mb-cite").click();
  // The edit form is built during the render the click triggers, so the proof is
  // the form itself — a flag left set would mean the render never honored it.
  check("(7c) ⭐ the click opens the edit form for that row",
    !!win.document.querySelector(".mem-form") &&
    /s2/.test(win.document.querySelector(".mem-form").textContent));
  check("(7c) …and the intent is consumed, not left armed", api._pendingEdit() === null);
  check("(7c) hovering after a click does not leave a card behind", !win.document.querySelector(".mb-tip"));

  // ⚠ Without a session there is no editor, so the promise changes rather than
  // the button doing nothing.
  // ⚠ Drop the stored phrase too: _setSession(null) re-renders, and renderAuth
  // re-derives a session from the phrase in localStorage — so clearing only the
  // variable leaves the module signed in and the check goes green on the wrong
  // state.
  try { win.localStorage.removeItem("cpl_team_pass"); } catch (e) {}
  api._setSession(null);
  const roHost = win.document.createElement("div");
  const roPanel = api._renderBriefingPanel(three, "scope");
  roHost.appendChild(roPanel);
  check("(7c) ⚠ with no session the lead promises a jump, not an edit",
    /jump to that entry/.test(roPanel.textContent) && !/open that entry for editing/.test(roPanel.textContent));
  api._renderBriefText(roPanel.querySelector(".mb-out"), "A claim [s2].", { s2: 1 });
  roPanel.querySelector("a.mb-cite").click();
  check("(7c) …and no edit is requested", api._pendingEdit() === null);
  try { win.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {}
  api._setSession({ kind: "phrase" });

  // ── (8) the error path leaves the report alone ────────────────────────────
  win.fetch = function () { return Promise.resolve({ ok: false, status: 500 }); };
  const host2 = win.document.createElement("div");
  host2.appendChild(api._renderBriefingPanel(three, "scope"));
  host2.querySelector(".mb-btn").click();
  await tick(); await tick(); await tick();
  check("(8) a failed briefing says so", /Couldn.t build the briefing/.test(host2.querySelector(".mb-status").textContent));
  check("(8) …and says the entries below are unaffected",
    /entries below are unaffected/.test(host2.querySelector(".mb-status").textContent));
  check("(8) the button is re-enabled after a failure", host2.querySelector(".mb-btn").disabled === false);

  // ── (9) an empty view refuses rather than briefing nothing ────────────────
  const host3 = win.document.createElement("div");
  host3.appendChild(api._renderBriefingPanel([], "empty"));
  host3.querySelector(".mb-btn").click();
  await tick();
  check("(9) an empty view is refused, not sent", /No entries in this view/.test(host3.querySelector(".mb-status").textContent));

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
