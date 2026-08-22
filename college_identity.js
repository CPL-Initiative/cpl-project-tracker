/* College & District Identity — a LINT SURFACE, not a lookup.
 * ===========================================================
 * Sam, 2026-08-21: "Maybe it's time to add a new COBI tab to visually show the
 * key source lookup tables we rely upon, particularly the college/district
 * table that should list loc IDs and all variations of the names found in the
 * DB."
 *
 * ⭐ THE VALUE IS SHOWING WHAT IS EMPTY OR DISAGREEING, not mirroring what SQL
 * would show. `map_colleges.variants` existed from the day the column shipped
 * and was empty on all 128 rows for months; the documented Obsidian exclusions
 * were documented and never applied. Both hid the same way — nobody could SEE
 * the absence. A page that renders "0 of 128" makes that impossible.
 *
 * ── What is live and what is a snapshot, and why ──────────────────────────
 * LIVE: map_colleges. Its policy is `map_colleges_select … using (true)` for
 *       {authenticated, anon}, so any visitor's browser can read it.
 * LIVE: map_college_contacts, WHEN SIGNED IN. Its policy is
 *       `is_allowed_reviewer() OR team_pass_ok()`, which this tab's audience
 *       has. This is where the trailing-space defect lives, so reading it live
 *       matters more than any other half of the lint.
 * SNAPSHOT: everything that depends on chatbox_college_profiles. That table
 *       carries exactly ONE policy — `service_full_access` for service_role —
 *       so a browser gets nothing, ever. Sierra reads it through the Edge
 *       Function's service key. Those findings come from
 *       college_identity_data.js and the date is PRINTED.
 *
 * ⚠ AND THE TAB CHECKS ITS OWN SNAPSHOT. It re-derives the counts it can read
 * live and compares them to the generated file. A snapshot that no longer
 * matches the database is itself a finding — the only honest way to ship dated
 * data on a page whose entire job is spotting stale data.
 *
 * ⚠ A FAILED READ IS `unknown`, NEVER 0. Rendering a zero for a read that did
 * not happen is the exact failure this tab exists to catch (see the RLS-filtered
 * read that made 109 colleges look empty, docs/kb-notes/methodology-an-rls-
 * filtered-read-is-not-an-error.md).
 */
(function () {
  "use strict";

  var REST = (window.CPL_SUPABASE_URL || "https://hvuwhnbuahrtptokpqfh.supabase.co") + "/rest/v1";
  var state = { live: null, contacts: null, error: null, loading: false, expanded: {}, q: "" };

  function snap() { return window.CPL_COLLEGE_IDENTITY || null; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n) { return (n == null || !isFinite(n)) ? "unknown" : Number(n).toLocaleString("en-US"); }

  /* Auth headers: the anon key alone reads map_colleges; the contacts read needs
   * a reviewer session or the team phrase. Both are OPTIONAL — the tab degrades
   * to the public half and SAYS which half it lost, rather than rendering a
   * confident, wrong zero. */
  function authHeaders() {
    var h = {};
    try {
      if (window.CPL_TEAM_PHRASE && window.CPL_TEAM_PHRASE.headers) {
        h = window.CPL_TEAM_PHRASE.headers() || {};
      }
    } catch (e) { /* not mounted */ }
    return h;
  }

  function jget(url) {
    return fetch(url, { headers: authHeaders() }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  /* ── The live lint ───────────────────────────────────────────────────────
   * PURE. Given the live roster and the live contact names, return the findings
   * this browser could establish for itself. Deliberately the SAME shape as the
   * snapshot's findings so one renderer draws both. */
  function liveFindings(colleges, contactNames) {
    if (!colleges || !contactNames) return null;
    var canon = {}, byVariant = {};
    colleges.forEach(function (c) { canon[c.college_name] = true; });
    /* A variant must never claim a name some college already owns — AND a
     * variant two colleges both claim must resolve to neither. The second half
     * was "first writer wins" until 2026-08-21; harmless while every variant was
     * district-qualified and unique, live the moment campus short names exist
     * (five colleges reduce to "City College"). Reporting such a name as
     * "resolves to X" would be a confident wrong answer on a LINT surface, whose
     * whole job is to be trusted about what resolves. Counted first: one pass
     * cannot know a later college is about to claim the same variant. */
    var claims = {};
    colleges.forEach(function (c) {
      (c.variants || []).forEach(function (v) {
        if (v && !canon[v]) claims[v] = (claims[v] || 0) + 1;
      });
    });
    colleges.forEach(function (c) {
      (c.variants || []).forEach(function (v) {
        if (v && !canon[v] && claims[v] === 1 && !(v in byVariant)) byVariant[v] = c.college_name;
      });
    });
    var out = [];
    contactNames.forEach(function (nm) {
      if (canon[nm]) return;
      var via = byVariant[nm];
      if (via) {
        out.push({
          name: nm, cls: nm.trim() !== nm ? "whitespace" : "spelling", resolves_to: via, live: true,
          why: nm.trim() !== nm
            ? "Stored with leading/trailing whitespace. It resolves only because "
              + "map_colleges.variants carries this exact spelling — an exact-match "
              + "join on the display name still misses it."
            : "A different spelling that variants resolves."
        });
      } else {
        out.push({ name: nm, cls: "unknown", resolves_to: null, live: true,
                   why: "In map_college_contacts and claimed by no identity in map_colleges." });
      }
    });
    return out;
  }

  // ── CSS, injected from the tab's JS so both HTMLs are covered (no Rule-4 mirror) ──
  function ensureCss() {
    if (document.getElementById("cid-css")) return;
    var css = [
      "#college-identity-root { text-align:left; }",
      ".cid-h { font-size:1.05rem; margin:0 0 4px; color:var(--text-body, #1c2433); }",
      ".cid-sub { font-size:.86rem; color:var(--text-muted, #5a6478); max-width:var(--cpl-measure,none); margin:0 0 14px; }",
      ".cid-stats { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 16px; }",
      ".cid-stat { flex:1 1 150px; border:1px solid var(--border, #d8dde6); border-radius:10px; padding:10px 12px; background:var(--surface-opaque, #fff); }",
      ".cid-stat b { display:block; font-size:1.35rem; line-height:1.15; color:var(--text-body, #1c2433); }",
      ".cid-stat span { font-size:.76rem; color:var(--text-muted, #5a6478); }",
      ".cid-stat.warn { border-color:var(--crimson, #920000); }",
      ".cid-note { font-size:.82rem; color:var(--text-muted, #5a6478); margin:8px 0; max-width:var(--cpl-measure,none); }",
      ".cid-flag { border-left:3px solid var(--crimson, #920000); padding:8px 11px; margin:10px 0; background:var(--surface-subtle, #f2f6fb); font-size:.85rem; }",
      ".cid-sec { margin:20px 0 0; }",
      ".cid-find { border:1px solid var(--border, #d8dde6); border-radius:10px; padding:10px 12px; margin:8px 0; background:var(--surface-opaque, #fff); }",
      ".cid-find .nm { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.84rem; word-break:break-all; }",
      ".cid-tag { display:inline-block; font-size:.7rem; font-weight:700; letter-spacing:.03em; text-transform:uppercase; border:1px solid var(--border-strong, #cdd6e3); border-radius:999px; padding:1px 8px; margin-right:6px; color:var(--text-muted, #5a6478); }",
      ".cid-tag.whitespace, .cid-tag.unknown { border-color:var(--crimson, #920000); color:var(--crimson, #920000); }",
      ".cid-tag.awaiting_map_id { border-color:var(--cobalt, #0047AB); color:var(--cobalt, #0047AB); }",
      /* Suppressed rows. --mustard-text is the palette's documented "caution
       * TEXT grade on light surfaces" — an EXISTING token, not an invented one
       * (the first draft reached for `--amber`, which does not exist; inventing
       * a palette entry is what reference-ui-design-system forbids). Measured
       * 5.15:1 on white and 4.73:1 on the zebra row, both AA for text.
       * The chip ALWAYS carries the word "suppressed": color is never the only
       * signal, and the no-cheesy-glyphs rule means a word, not an icon. */
      ".cid-tag.suppressed { border-color:var(--mustard-text, #8B6800); color:var(--mustard-text, #8B6800); }",
      ".cid-t tr.cid-supp td { background:var(--surface-subtle, #F7F5F1); color:var(--text-muted, #5C5C55); }",
      ".cid-t tr.cid-supp td:first-child { box-shadow:inset 3px 0 0 var(--mustard-text, #8B6800); }",
      ".cid-why { font-size:.8rem; color:var(--text-muted, #5a6478); margin-top:4px; max-width:var(--cpl-measure,none); }",
      ".cid-wrap { overflow-x:auto; }",
      ".cid-t { width:100%; table-layout:fixed; border-collapse:collapse; font-size:.82rem; }",
      ".cid-t th, .cid-t td { text-align:left; padding:5px 7px; border-bottom:1px solid var(--border, #d8dde6); vertical-align:top; }",
      ".cid-t th { font-size:.74rem; text-transform:uppercase; letter-spacing:.03em; color:var(--text-muted, #5a6478); }",
      ".cid-t tbody tr:nth-child(even) { background:var(--surface-subtle, #f2f6fb); }",
      ".cid-t td.n { font-variant-numeric:tabular-nums; }",
      ".cid-var { font-size:.76rem; color:var(--text-muted, #5a6478); }",
      ".cid-search { width:100%; max-width:340px; padding:6px 10px; font-size:.85rem; border:1px solid var(--border-strong, #cdd6e3); border-radius:8px; margin:0 0 10px; }",
      "@media (max-width:560px) { .cid-stat { flex:1 1 100%; } }",
    ].join("\n");
    var el = document.createElement("style");
    el.id = "cid-css"; el.textContent = css;
    document.head.appendChild(el);
  }

  /* ⚠ THE PANE SHIPS AN INLINE text-align:center FOR ITS LOADING PLACEHOLDER,
   * and inline out-ranks the CSS this module injects — every capped paragraph
   * would render centerd inside a left-anchored box. Cleared at render.
   * (#1274; docs/kb-notes/methodology-an-inline-placeholder-style-outranks-
   * the-css-you-inject.md.) */
  function shedPlaceholder(root) {
    if (!root || !root.style) return;
    ["textAlign", "border", "padding", "background", "borderRadius", "color"].forEach(function (k) {
      try { root.style[k] = ""; } catch (e) { /* jsdom edge */ }
    });
  }

  function stat(v, label, warn) {
    return '<div class="cid-stat' + (warn ? " warn" : "") + '"><b>' + esc(v) + "</b><span>" + esc(label) + "</span></div>";
  }

  function render(root) {
    if (!root) return;
    ensureCss();
    shedPlaceholder(root);
    var s = snap();
    var live = state.live;
    var h = '<h3 class="cid-h">College &amp; District Identity</h3>'
      + '<p class="cid-sub">Every entity MAP knows, the CCCCO MIS codes behind it, and every spelling '
      + 'any of our systems uses. This page exists to show what is <b>missing or disagreeing</b> — a name '
      + 'in a live table that resolves to no identity is a finding, not a curiosity.</p>';

    if (state.loading) h += '<p class="cid-note">Reading map_colleges&hellip;</p>';

    if (live) {
      var withVar = live.filter(function (c) { return (c.variants || []).length; }).length;
      var withDist = live.filter(function (c) { return c.district; }).length;
      var dists = {};
      live.forEach(function (c) { if (c.district) dists[c.district] = 1; });
      h += '<div class="cid-stats">'
        + stat(num(live.length), "entities in map_colleges")
        + stat(num(withVar) + " of " + num(live.length), "carry name variants", withVar === 0)
        + stat(num(withDist) + " of " + num(live.length), "carry a district", withDist === 0)
        + stat(num(Object.keys(dists).length), "distinct districts")
        + "</div>";

      // ⭐ The tab checks its own snapshot.
      if (s && s.counts && s.counts.entities != null) {
        var drift = [];
        if (s.counts.with_variants !== withVar) drift.push("variants " + s.counts.with_variants + " vs " + withVar);
        if (s.counts.with_district !== withDist) drift.push("district " + s.counts.with_district + " vs " + withDist);
        if (drift.length) {
          h += '<div class="cid-flag"><b>The snapshot below is out of date.</b> Generated '
            + esc(s.generated) + ", and it disagrees with the live table on: " + esc(drift.join("; "))
            + ". Re-run <code>kb/_build_college_identity_crosswalk.py</code>. "
            + "The live figures above are the ones to trust.</div>";
        }
      }
    } else if (state.error) {
      h += '<div class="cid-flag"><b>Could not read map_colleges: ' + esc(state.error)
        + '.</b> Every figure below is <b>unknown</b>, not zero — a failed read must never render as an empty table.</div>';
    }

    // ── Findings ──
    var findings = [];
    if (state.contacts) findings = findings.concat(liveFindings(live, state.contacts) || []);
    if (s && s.findings) {
      var seen = {};
      findings.forEach(function (f) { seen[f.name] = 1; });
      s.findings.forEach(function (f) {
        if (seen[f.name]) return;
        findings.push({ name: f.name, cls: f["class"], resolves_to: f.resolves_to, sibling: f.sibling,
                        why: f.why, decided_by: f.decided_by, decided_on: f.decided_on, live: false });
      });
    }
    h += '<div class="cid-sec"><h4 class="cid-h">Names that resolve to no identity ('
      + (findings.length ? findings.length : "0") + ")</h4>";
    h += '<p class="cid-note">'
      + (state.contacts
          ? "Contact names checked <b>live</b>. "
          : "<b>Contact names not read</b> — map_college_contacts is gated on a reviewer sign-in or the team phrase, "
            + "so the live half of this lint is missing. ")
      + (s ? "Names seen only in Sierra's corpus come from the snapshot generated <b>" + esc(s.generated)
             + "</b>: chatbox_college_profiles is service-role only, so no browser can read it." : "")
      + "</p>";
    /* ⭐ AND OFFER THE WAY IN, don't just name the obstacle.
     *
     * tests/team_phrase_affordance.test.js failed this tab on exactly this:
     * "every phrase-gated tab offers an input or names the header — MISSING:
     * college-identity". The rule is the repo's own `hiding-a-control-also-
     * hides-the-way-in` — a page that reads a gated table and reports the gate
     * in prose has told the visitor what is wrong and not how to fix it. The
     * READ-gated case is the severe one: without the phrase this half is not
     * read-only, it is EMPTY.
     *
     * The SHARED unlockRow, never a hand-rolled input: its default onUnlocked
     * re-dispatches cpl-tab-activated for the live tab, which this module
     * already listens for, so unlocking re-renders in place. A banner that
     * unlocks and leaves the page looking locked reads as a rejected phrase.
     *
     * ⚠ Inline, NOT lockedBanner(). This tab is not locked — map_colleges is
     * public-read and the roster below renders for anyone. Only the contact
     * lint is missing, so the unlock belongs beside the gap it fills. */
    if (!state.contacts) h += '<p id="cid-unlock" class="cid-note"></p>';
    if (!findings.length) {
      h += '<p class="cid-note">Nothing outstanding.</p>';
    }
    findings.forEach(function (f) {
      h += '<div class="cid-find"><span class="cid-tag ' + esc(f.cls) + '">' + esc(String(f.cls).replace(/_/g, " ")) + "</span>"
        + '<span class="nm">' + esc(JSON.stringify(f.name)) + "</span>"
        + (f.resolves_to ? ' <span class="cid-var">&rarr; ' + esc(f.resolves_to) + "</span>" : "")
        + (f.sibling ? ' <span class="cid-var">sibling of ' + esc(f.sibling) + "</span>" : "")
        + (f.live ? ' <span class="cid-var">(live)</span>' : "")
        + '<div class="cid-why">' + esc(f.why || "")
        + (f.decided_by ? " — ruled by " + esc(f.decided_by) + ", " + esc(f.decided_on) : "")
        + "</div></div>";
    });
    h += "</div>";

    // ── The roster ──
    if (live) {
      var q = (state.q || "").toLowerCase();
      var rows = live.filter(function (c) {
        if (!q) return true;
        if (String(c.college_name).toLowerCase().indexOf(q) >= 0) return true;
        if (String(c.district || "").toLowerCase().indexOf(q) >= 0) return true;
        return (c.variants || []).some(function (v) { return String(v).toLowerCase().indexOf(q) >= 0; });
      });
      // The count belongs in the heading for the same reason the chip belongs on
      // the row: 8 of these 128 entities are thrown away by every consumer, and
      // until now nothing on any surface said so.
      var suppCount = live.filter(function (c) {
        return String(c.entity_kind || "") === "test" || c.is_test === true;
      }).length;
      h += '<div class="cid-sec"><h4 class="cid-h">Every entity (' + rows.length + " of " + live.length
        + (suppCount ? " · " + suppCount + " suppressed" : "") + ")</h4>"
        + '<label class="cid-note" for="cid-q">Filter by name, district or variant</label><br>'
        + '<input id="cid-q" class="cid-search" type="search" value="' + esc(state.q) + '" placeholder="e.g. Mt. San Antonio, or 740">'
        + '<div class="cid-wrap" tabindex="0" role="region" aria-label="College and district identity table">'
        + '<table class="cid-t"><colgroup><col style="width:26%"><col style="width:6%"><col style="width:13%"><col style="width:26%"><col style="width:9%"><col style="width:20%"></colgroup>'
        + "<thead><tr><th scope=\"col\">Name</th><th scope=\"col\">ID</th><th scope=\"col\">Kind</th>"
        + "<th scope=\"col\">District</th><th scope=\"col\">MIS</th><th scope=\"col\">Variants</th></tr></thead><tbody>";
      rows.forEach(function (c) {
        var vs = c.variants || [];
        var mis = (c.mis_district_code || "—") + " / " + (c.mis_college_code || "—");
        /* ⭐ CHIP THE SUPPRESSED ROWS. Sam, 2026-08-21: "The college/district tab
         * should probably have a chip on rows that are suppressed (e.g., CA MAP
         * Initiative) — which is our sandbox and had slipped into the daily
         * report from MAP."
         *
         * ⚠ THE NAME IS NOT THE TELL. Four of the eight sandbox rows announce
         * themselves ("Testing College", "CabTest College"), but
         * "NORCO College - Syllabus Manager" and "CA MAP INITIATIVE COLLEGE"
         * read like real entities — so a reader scanning this roster has no way
         * to know which rows every consumer throws away. That is the same
         * absence-is-invisible argument the whole tab exists for.
         *
         * ⚠ AND THE CHIP SAYS WHY, NOT WHAT (methodology-a-provenance-label-
         * must-say-why-not-what). "test" is what the column holds; what the
         * reader needs is that no report, briefing or Sierra answer will ever
         * include it.
         *
         * Both fields are consulted rather than one: consumers filter on
         * `entity_kind=neq.test` while the table also carries `is_test`. They
         * agree on all 8 rows today (measured 2026-08-21), so the OR changes
         * nothing now — it exists so that a future disagreement surfaces as a
         * flagged row instead of a row that half the pipeline hides. */
        var suppressed = String(c.entity_kind || "") === "test" || c.is_test === true;
        var split = (String(c.entity_kind || "") === "test") !== (c.is_test === true);
        h += "<tr" + (suppressed ? ' class="cid-supp"' : "") + "><td>" + esc(c.college_name)
          + (suppressed
              ? ' <span class="cid-tag suppressed">suppressed</span>'
              : "")
          + "</td>"
          + '<td class="n">' + esc(c.college_id) + "</td>"
          + "<td>" + esc(String(c.entity_kind || "college").replace(/_/g, " ")) + "</td>"
          + "<td>" + esc(c.district || "—") + "</td>"
          + '<td class="n">' + esc(mis) + "</td>"
          + '<td class="cid-var">' + (vs.length ? esc(vs.join(" · ")) : "none") + "</td></tr>";
        if (suppressed) {
          h += '<tr><td colspan="6" class="cid-why">'
            + "Suppressed everywhere — a MAP sandbox organization, not a real institution. "
            + "It is excluded from Custom Reports, college briefings and Sierra, so no figure "
            + "on any other tab counts it."
            + (split
                ? " <b>⚠ entity_kind and is_test DISAGREE on this row</b>, so a consumer "
                  + "filtering on one of them will include it."
                : "")
            + "</td></tr>";
        }
        if (c.mis_absent_why) {
          h += '<tr><td colspan="6" class="cid-why">No MIS code — ' + esc(c.mis_absent_why) + "</td></tr>";
        }
      });
      h += "</tbody></table></div></div>";
    }

    root.innerHTML = h;

    var slot = root.querySelector("#cid-unlock");
    if (slot && window.CPL_TEAM_PHRASE && typeof window.CPL_TEAM_PHRASE.unlockRow === "function") {
      try {
        slot.appendChild(window.CPL_TEAM_PHRASE.unlockRow({
          blurb: "Team phrase to check contact names live:",
          label: "Unlock",
        }));
      } catch (e) {
        // ⚠ Fall back to POINTING at the control rather than losing it. A
        // throw here would leave the visitor with the obstacle and no route.
        slot.textContent = "The lock button in the header does the same thing, from any tab.";
      }
    } else if (slot) {
      slot.textContent = "The lock button in the header does the same thing, from any tab.";
    }

    var qEl = root.querySelector("#cid-q");
    if (qEl) {
      qEl.addEventListener("input", function () {
        state.q = qEl.value;
        var at = qEl.selectionStart;
        render(root);
        var again = root.querySelector("#cid-q");
        if (again) { again.focus(); try { again.setSelectionRange(at, at); } catch (e) { /* search input */ } }
      });
    }
  }

  function load(root) {
    state.loading = true; render(root);
    // ⚠ The two reads are INDEPENDENT: contacts is gated and may legitimately
    // fail. Losing it must cost the live contact lint and NOTHING else, so it
    // is caught separately rather than sharing a Promise.all rejection.
    var a = jget(REST + "/map_colleges?select=college_id,college_name,entity_kind,is_test,variants,district,mis_district_code,mis_college_code,mis_absent_why&order=college_name")
      .then(function (d) { state.live = d || []; })
      .catch(function (e) { state.error = String(e && e.message || e); state.live = null; });
    var b = jget(REST + "/map_college_contacts?select=college")
      .then(function (d) { state.contacts = (d || []).map(function (r) { return r.college; }); })
      .catch(function () { state.contacts = null; });   // gated read — not an error
    return Promise.all([a, b]).then(function () {
      state.loading = false; render(root);
    });
  }

  function activate(root) {
    root = root || document.getElementById("college-identity-root");
    if (!root) return;
    if (state.live || state.error) { render(root); return; }
    load(root);
  }

  window.CPL_COLLEGE_IDENTITY_TAB = {
    activate: activate,
    _render: render,
    _liveFindings: liveFindings,      // pure — the lint, testable without a DOM
    _state: state,
    _shedPlaceholder: shedPlaceholder,
  };

  /* ⚠ WINDOW, not document — `cpl-tab-activated` is dispatched on window
   * (admin.js, cobi_orgs.js, card_raci.js all listen there). A document
   * listener never fires and the tab would render only via the boot block's
   * explicit activate(), which works right up until someone removes it. */
  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "college-identity") activate();
  });
})();
