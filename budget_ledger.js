/*
 * budget_ledger.js — the consolidated Budget ledger view.
 *
 * Renders `budget_funding` as four sections — Sources · Uses · the combined
 * project pool · the pre-cutoff funding history — with the project detail
 * collapsible under each budget total, and inline editing on every non-total
 * field (Sam, 2026-07-30).
 *
 * WHY LIVE-FETCHED, not generator-rendered: budget_funding has public SELECT
 * with reviewer-gated writes, so the view reads the table directly and
 * re-renders the instant a save lands — a curator never waits for the next
 * cron to see their own edit. (The Python-rendered 5-Year Funding Plan below
 * stays as-is; it is the SOURCES view and budget_editor.js still hydrates it.)
 *
 * ── The two load-bearing rules (also enforced in the Python read path and
 *    tests/budget_ledger_structure_test.py) ───────────────────────────────
 *   (a) TOTALS SUM PARENT ROWS ONLY. A child row is detail, never additive.
 *       Summing parents + children is exactly the shape of the Sept-2026 BOG
 *       amendment's own $74,000,000 grand total, which adds the $18M project
 *       subtotal on top of the $35M that already contains $8,959,692 of it.
 *       The real figure is $71,000,000. See docs/cpl_funding_lessons.md.
 *   (b) ARCHIVED rows are excluded from every total — they precede the
 *       2025-26 cutoff and are retained only so history still reconciles.
 *
 * ── total: computed or editable, decided by the data ─────────────────────
 * Where a row HAS a year breakdown, `total` is computed as Σ years and shown
 * read-only — a total can then never silently drift from its own years, which
 * is precisely the failure that produced the row-5 anomaly ("$2M" in the name,
 * $8M in `total`, $7M/yr in the cells). Where the source document genuinely
 * gives no per-year split (the two CPL Projects shares, the history rows),
 * `total` is the only real figure and stays editable. Flip
 * TOTAL_ALWAYS_EDITABLE to true if Sam prefers it editable everywhere.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";

  var TOTAL_ALWAYS_EDITABLE = false;

  var YEAR_COLS = ["yr_2025_26_budget", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30", "yr_2030_31"];
  var YEAR_LABELS = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
  // The Uses / pool tables show the funded years 2026-27 → 2030-31. The Sept-2026
  // amendment's Board window runs 2026-27 → 2028-29; ongoing operations are
  // COMMITTED two years further (2029-30, 2030-31, Sam 2026-08-05), and those
  // columns are also where project funding can later be shifted without changing
  // any project total.
  var USE_YEARS = [1, 2, 3, 4, 5];

  var SECTIONS = [
    { key: "sources", title: "Sources",
      note: "2025-26 forward. Prior allocations sit behind the cutoff in the history below and are excluded from every total.",
      of: ["source_one_time", "source_ongoing"],
      groups: { source_one_time: "One-time", source_ongoing: "Ongoing operations" },
      windowed: true },
    { key: "uses", title: "Uses",
      note: "Each appropriation, fully allocated. The two CPL Projects shares are detailed in the pool below — listed there, not added again.",
      of: ["use_35m", "use_15m", "use_ongoing"],
      groups: { use_35m: "$35M one-time (2026)", use_15m: "$15M one-time (2025)", use_ongoing: "Ongoing operations" } },
    { key: "pool", title: "CPL Initiative projects — the combined $18M pool",
      note: "$8,959,692 from the $35M plus $9,040,308 from the $15M. The amendment budgets these together and never splits them by source, so no split is shown. Expand a line to list its projects.",
      of: ["pool"], groups: {} }
  ];

  var state = { rows: null, err: null, open: {}, sess: null, histOpen: false };

  // ─── small helpers ───────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
  function money(v) {
    var n = num(v);
    return n ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";
  }
  function moneyFull(v) { return "$" + num(v).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
  function hasYears(r) { return YEAR_COLS.some(function (c) { return num(r[c]) !== 0; }); }
  function sumYears(r) {
    return YEAR_COLS.reduce(function (s, c) { return s + num(r[c]); }, 0);
  }
  // Rule (a): a row's displayed total. Computed from its own years when it has
  // them; otherwise the stored figure.
  function rowTotal(r) { return hasYears(r) ? sumYears(r) : num(r.total); }
  function isParent(r) { return r.parent_id == null; }
  function kidsOf(rows, id) {
    return rows.filter(function (r) { return r.parent_id === id; });
  }
  function totalOf(rows) {   // rule (a) again: parents only
    return rows.filter(isParent).reduce(function (s, r) { return s + rowTotal(r); }, 0);
  }

  // ─── auth — the same shared session budget_editor.js uses ────────────────
  function isValidJwt(t) {
    return typeof t === "string"
      && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  function magicSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) {}
    return null;
  }
  function fullSession() {
    return magicSession()
      || (window.CPL_TEAM_PHRASE ? window.CPL_TEAM_PHRASE.session() : null);
  }
  function authHeaders(sess, prefer) {
    var h = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + ((sess && sess.access_token) || SUPABASE_ANON),
      "Content-Type": "application/json"
    };
    if (prefer) h.Prefer = prefer;
    if (window.CPL_TEAM_PHRASE) window.CPL_TEAM_PHRASE.decorateHeaders(h, sess);
    else if (sess && sess.teamPass) h["x-team-pass"] = sess.teamPass;
    return h;
  }
  // An RLS-filtered PATCH returns 200 with an EMPTY body, never a 403 — so a
  // save is only confirmed once we know it touched a row (team_phrase.checkWrite).
  function writeResult(r) {
    if (window.CPL_TEAM_PHRASE && window.CPL_TEAM_PHRASE.checkWrite) {
      return window.CPL_TEAM_PHRASE.checkWrite(r);
    }
    return Promise.resolve({ ok: r.ok, status: r.status });
  }

  // ─── data ────────────────────────────────────────────────────────────────
  function load() {
    return fetch(SUPABASE_URL + "/rest/v1/budget_funding"
                 + "?select=*&order=sort_order.asc.nullslast,id.asc",
                 { headers: { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON } })
      .then(function (r) {
        if (!r.ok) throw new Error("budget_funding " + r.status);
        return r.json();
      })
      .then(function (rows) { state.rows = rows; state.err = null; })
      .catch(function (e) { state.err = e.message || String(e); state.rows = []; });
  }
  function save(id, column, value) {
    var body = {}; body[column] = value;
    return fetch(SUPABASE_URL + "/rest/v1/budget_funding?id=eq." + encodeURIComponent(id), {
      method: "PATCH",
      headers: authHeaders(state.sess, "return=representation"),
      body: JSON.stringify(body)
    }).then(writeResult);
  }

  // ─── editable-cell markup ────────────────────────────────────────────────
  // Every editable field renders the same way; `paint` decides whether it LOOKS
  // editable, so a signed-out visitor sees clean read-only text.
  function ed(r, col, text, cls, kind) {
    return '<span class="bl-ed' + (cls ? " " + cls : "") + '"'
      + ' data-id="' + esc(r.id) + '" data-col="' + esc(col) + '"'
      + ' data-kind="' + (kind || "text") + '">' + text + "</span>";
  }
  function moneyCell(r, col) {
    return '<td class="n">' + ed(r, col, money(r[col]), "", "money") + "</td>";
  }
  function totalCell(r) {
    var computed = hasYears(r) && !TOTAL_ALWAYS_EDITABLE;
    if (computed) {
      return '<td class="n tot" title="Computed from this row&#39;s years — edit a year to change it.">'
        + money(sumYears(r)) + "</td>";
    }
    return '<td class="n tot">' + ed(r, "total", money(r.total), "", "money") + "</td>";
  }

  function rowHtml(r, rows, opts) {
    var kids = kidsOf(rows, r.id);
    var out = "";
    var caret = kids.length
      ? '<button class="bl-caret" type="button" aria-expanded="' + (state.open[r.id] ? "true" : "false")
        + '" data-kid="' + esc(r.id) + '" aria-label="Show the ' + kids.length
        + ' items under ' + esc(r.name) + '"><span>&#9654;</span></button>'
      : "";
    var nameCell = '<td class="l">'
      + (caret ? '<span class="bl-tw">' + caret : "")
      + ed(r, "name", esc(r.name), "bl-name")
      + (kids.length ? '<span class="bl-n">' + kids.length + " items</span>" : "")
      + (caret ? "</span>" : "")
      + '<div class="bl-desc">' + ed(r, "description",
          r.description ? esc(r.description) : '<em class="bl-empty">add a description</em>') + "</div>"
      + "</td>";

    out += '<tr class="bl-row' + (opts.kid ? " bl-kid" : "") + (opts.kid && !state.open[r.parent_id] ? " bl-hid" : "") + '"'
         + ' data-row="' + esc(r.id) + '"' + (opts.kid ? ' data-of="' + esc(r.parent_id) + '"' : "") + ">";
    out += nameCell;
    if (opts.windowed) {
      out += '<td class="l dim">' + ed(r, "window_label",
        r.window_label ? esc(r.window_label) : '<em class="bl-empty">—</em>') + "</td>";
    } else {
      USE_YEARS.forEach(function (i) { out += moneyCell(r, YEAR_COLS[i]); });
    }
    out += totalCell(r);
    out += "</tr>";

    if (kids.length) {
      kids.forEach(function (k) { out += rowHtml(k, rows, { kid: true, windowed: opts.windowed }); });
    }
    return out;
  }

  function sectionHtml(sec, rows) {
    var mine = rows.filter(function (r) {
      return sec.of.indexOf(r.section) !== -1 && !r.archived;
    });
    if (!mine.length) return "";
    var nCols = sec.windowed ? 3 : 2 + USE_YEARS.length;
    var h = '<section class="bl-card"><div class="bl-scroll"><table class="bl-t">';
    h += "<caption>" + esc(sec.title)
       + '<span class="bl-cap">' + esc(sec.note) + "</span></caption>";
    h += "<thead><tr><th class='l'>" + (sec.key === "sources" ? "Appropriation" : "Line") + "</th>";
    if (sec.windowed) h += "<th class='l'>Window</th>";
    else USE_YEARS.forEach(function (i) { h += "<th>" + YEAR_LABELS[i] + "</th>"; });
    h += "<th>Total</th></tr></thead><tbody>";

    sec.of.forEach(function (g) {
      var grp = mine.filter(function (r) { return r.section === g && isParent(r); });
      if (!grp.length) return;
      if (sec.groups[g]) {
        h += '<tr class="bl-grp"><td class="l" colspan="' + nCols + '">' + esc(sec.groups[g]) + "</td></tr>";
      }
      grp.forEach(function (r) { h += rowHtml(r, mine, { windowed: sec.windowed }); });
    });

    h += "</tbody><tfoot><tr class='bl-tot'><td class='l'>"
       + (sec.key === "sources" ? "All sources shown"
          : sec.key === "uses" ? "All uses" : "Project pool")
       + "</td>";
    if (sec.windowed) h += "<td></td>";
    else USE_YEARS.forEach(function (i) {
      h += '<td class="n">' + money(mine.filter(isParent).reduce(function (s, r) {
        return s + num(r[YEAR_COLS[i]]); }, 0)) + "</td>";
    });
    h += '<td class="n">' + money(totalOf(mine)) + "</td></tr></tfoot></table></div></section>";
    return h;
  }

  // ─── the two-installment story, derived from the source rows ─────────────
  function storyHtml(rows) {
    var one = rows.filter(function (r) { return r.section === "source_one_time" && !r.archived; });
    var ong = rows.filter(function (r) { return r.section === "source_ongoing" && !r.archived; });
    if (one.length < 2 && ong.length < 2) return "";
    var asks = [];
    if (one.length >= 2) {
      var a = rowTotal(one[0]), b = rowTotal(one[1]);
      asks.push({ name: "Implementation — one-time", a: a, b: b, total: a + b,
                  la: "2025 appropriation", lb: "2026 balance" });
    }
    if (ong.length >= 2) {
      // The ongoing installments are the 2025 base and the increment that took
      // it to the current per-year figure.
      var base = rowTotal(ong[0]);
      var per = num(ong[1].yr_2026_27) || 0;
      if (per > 0 && base > 0 && per >= base) {
        asks.push({ name: "Operations — ongoing, per year", a: base, b: per - base, total: per,
                    la: "2025 appropriation", lb: "2026 balance" });
      }
    }
    if (!asks.length) return "";
    return '<section class="bl-card bl-story"><h3>Both original requests are now fully funded</h3>'
      + '<p class="bl-lede">Each ask arrived in two installments. 2026&#8209;27 is the year the '
      + "Legislature made good on the balance of both.</p>"
      + asks.map(function (k) {
          var pa = k.total ? (k.a / k.total * 100) : 50;
          return '<div class="bl-ask"><div class="bl-ask-top"><span class="bl-ask-name">' + esc(k.name)
            + '</span><span class="bl-ask-tot">$' + money(k.total)
            + '<span class="bl-met">Fully funded</span></span></div>'
            + '<div class="bl-meter" role="img" aria-label="' + esc(k.name) + ": $" + money(k.a)
            + " plus $" + money(k.b) + ' added in 2026, totalling $' + money(k.total) + '.">'
            + '<div class="bl-s1" style="flex:' + pa.toFixed(2) + '"></div>'
            + '<div class="bl-s2" style="flex:' + (100 - pa).toFixed(2) + '"></div></div>'
            + '<div class="bl-keys"><span class="bl-key"><i class="bl-d1"></i>' + esc(k.la)
            + " <b>$" + money(k.a) + "</b></span>"
            + '<span class="bl-key"><i class="bl-d2"></i>' + esc(k.lb)
            + " <b>$" + money(k.b) + "</b></span></div></div>";
        }).join("")
      + "</section>";
  }

  // ─── history (archived), collapsed ───────────────────────────────────────
  function historyHtml(rows) {
    var hist = rows.filter(function (r) { return r.archived; });
    if (!hist.length) return "";
    var parents = hist.filter(isParent);
    var tot = parents.reduce(function (s, r) { return s + rowTotal(r); }, 0);
    var h = '<details class="bl-arch"' + (state.histOpen ? " open" : "") + ">"
      + "<summary>Funding history — 2017 to the cutoff"
      + '<span class="bl-n">' + hist.length + " allocations · $" + money(tot) + "</span></summary>"
      + '<div class="bl-arch-body"><p class="bl-foot">MAP was built and scaled on <b>$' + money(tot)
      + "</b> of project and demonstration funding before the statewide appropriations began. "
      + "Retained, not deleted — these precede the 2025&#8209;26 cutoff and are excluded from every total above.</p>"
      + '<div class="bl-scroll"><table class="bl-t"><thead><tr><th class="l">Allocation</th>'
      + '<th class="l">Years</th><th>Amount</th></tr></thead><tbody>';
    parents.forEach(function (r) {
      var kids = kidsOf(hist, r.id);
      h += '<tr class="bl-row" data-row="' + esc(r.id) + '"><td class="l">'
        + (kids.length ? '<span class="bl-tw"><button class="bl-caret" type="button" aria-expanded="'
            + (state.open[r.id] ? "true" : "false") + '" data-kid="' + esc(r.id)
            + '" aria-label="Show the ' + kids.length + ' allocations"><span>&#9654;</span></button>' : "")
        + ed(r, "name", esc(r.name), "bl-name")
        + (kids.length ? '<span class="bl-n">' + kids.length + " items</span></span>" : "")
        + '<div class="bl-desc">' + ed(r, "description",
            r.description ? esc(r.description) : '<em class="bl-empty">add a description</em>') + "</div></td>"
        + '<td class="l dim">' + ed(r, "window_label",
            r.window_label ? esc(r.window_label) : '<em class="bl-empty">—</em>') + "</td>"
        + totalCell(r) + "</tr>";
      kids.forEach(function (k) {
        h += '<tr class="bl-row bl-kid' + (state.open[r.id] ? "" : " bl-hid") + '" data-of="' + esc(r.id)
          + '" data-row="' + esc(k.id) + '"><td class="l">' + ed(k, "name", esc(k.name), "bl-name")
          + '<div class="bl-desc">' + ed(k, "description",
              k.description ? esc(k.description) : '<em class="bl-empty">add a description</em>') + "</div></td>"
          + '<td class="l dim">' + ed(k, "window_label",
              k.window_label ? esc(k.window_label) : '<em class="bl-empty">—</em>') + "</td>"
          + totalCell(k) + "</tr>";
      });
    });
    h += '</tbody><tfoot><tr class="bl-tot"><td class="l">All funding before the cutoff</td>'
       + '<td></td><td class="n">' + money(tot) + "</td></tr></tfoot></table></div></div></details>";
    return h;
  }

  // ─── render ──────────────────────────────────────────────────────────────
  function render() {
    var mount = document.getElementById("budgetLedgerMount");
    if (!mount) return;
    if (state.err) {
      mount.innerHTML = '<div class="bl-wrap"><p class="bl-foot">Budget ledger unavailable ('
        + esc(state.err) + ") — the 5-Year Funding Plan below is unaffected.</p></div>";
      return;
    }
    if (!state.rows) { mount.innerHTML = '<div class="bl-wrap"><p class="bl-foot">Loading the ledger…</p></div>'; return; }
    var rows = state.rows;
    var nKid = rows.filter(function (r) { return r.parent_id != null && !r.archived; }).length;
    var openN = Object.keys(state.open).filter(function (k) { return state.open[k]; }).length;
    var nPar = rows.filter(function (r) { return kidsOf(rows, r.id).length; }).length;

    var html = '<div class="bl-wrap">';
    html += '<div class="bl-bar"><span class="bl-barlab">Presenting</span>'
      + '<span class="bl-seg"><button type="button" data-preset="0" aria-pressed="' + (openN === 0) + '">Summary</button>'
      + '<button type="button" data-preset="1" aria-pressed="' + (openN === nPar && nPar > 0) + '">Detail</button></span>'
      + '<span class="bl-note">' + (openN === 0 ? "Detail collapsed — totals only."
          : openN === nPar ? "Every item listed under its budget line."
          : openN + " of " + nPar + " lines expanded.") + "</span>"
      + '<span class="bl-auth">' + (state.sess
          ? "✓ Editing unlocked — click any field · Enter saves · Esc cancels"
          : "Sign in on the funding plan below to edit") + "</span></div>";
    html += storyHtml(rows);
    SECTIONS.forEach(function (s) { html += sectionHtml(s, rows); });
    html += historyHtml(rows);
    html += "</div>";
    mount.innerHTML = html;
    paint();
  }

  function paint() {
    var on = !!state.sess;
    Array.prototype.forEach.call(document.querySelectorAll("#budgetLedgerMount .bl-ed"), function (n) {
      n.classList.toggle("bl-live", on);
      if (on) { n.setAttribute("tabindex", "0"); n.setAttribute("role", "button"); n.title = "Click to edit"; }
      else { n.removeAttribute("tabindex"); n.removeAttribute("role"); n.removeAttribute("title"); }
    });
  }

  // ─── inline edit ─────────────────────────────────────────────────────────
  function beginEdit(span) {
    if (!state.sess || span.querySelector("input, textarea")) return;
    var id = span.getAttribute("data-id"), col = span.getAttribute("data-col");
    var kind = span.getAttribute("data-kind");
    var row = (state.rows || []).filter(function (r) { return String(r.id) === String(id); })[0];
    if (!row) return;
    var cur = row[col] == null ? "" : String(row[col]);
    var prevHtml = span.innerHTML;
    var long = col === "description";
    var inp = document.createElement(long ? "textarea" : "input");
    if (!long) inp.type = kind === "money" ? "number" : "text";
    if (long) inp.rows = 3;
    inp.className = "bl-inp";
    inp.value = cur;
    span.innerHTML = "";
    span.appendChild(inp);
    inp.focus();
    if (inp.select) inp.select();

    var done = false;
    function cancel() { if (done) return; done = true; span.innerHTML = prevHtml; paint(); }
    function commit() {
      if (done) return;
      var raw = inp.value;
      var val = kind === "money" ? (raw === "" ? null : Number(raw)) : (raw === "" ? null : raw);
      if (kind === "money" && val !== null && !Number.isFinite(val)) { cancel(); return; }
      if (String(val == null ? "" : val) === cur) { cancel(); return; }
      done = true;
      span.innerHTML = '<span class="bl-saving">saving…</span>';
      save(id, col, val).then(function (res) {
        if (!res || !res.ok) throw new Error("write blocked");
        row[col] = val;
        render();                       // totals + the story band recompute
      }).catch(function () {
        span.innerHTML = prevHtml;
        span.classList.add("bl-fail");
        setTimeout(function () { span.classList.remove("bl-fail"); }, 1600);
        paint();
      });
    }
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); cancel(); }
      else if (e.key === "Enter" && (!long || e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(); }
    });
    inp.addEventListener("blur", commit);
  }

  function wire() {
    var mount = document.getElementById("budgetLedgerMount");
    if (!mount) return;
    mount.addEventListener("click", function (e) {
      var caret = e.target.closest ? e.target.closest(".bl-caret") : null;
      if (caret) {
        var k = caret.getAttribute("data-kid");
        state.open[k] = !state.open[k];
        render();
        return;
      }
      var preset = e.target.closest ? e.target.closest("[data-preset]") : null;
      if (preset) {
        var want = preset.getAttribute("data-preset") === "1";
        state.open = {};
        if (want) {
          (state.rows || []).forEach(function (r) {
            if (kidsOf(state.rows, r.id).length) state.open[r.id] = true;
          });
          state.histOpen = true;
        }
        render();
        return;
      }
      var span = e.target.closest ? e.target.closest(".bl-ed") : null;
      if (span) beginEdit(span);
    });
    mount.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var span = e.target.closest ? e.target.closest(".bl-ed") : null;
      if (span && state.sess) { e.preventDefault(); beginEdit(span); }
    });
    mount.addEventListener("toggle", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("bl-arch")) {
        state.histOpen = e.target.open;
      }
    }, true);
  }

  // ─── CSS, injected from JS so it covers both HTMLs without a Rule-4 mirror ─
  function ensureCss() {
    if (document.getElementById("bl-css")) return;
    var s = document.createElement("style");
    s.id = "bl-css";
    s.textContent = [
      "#budgetLedgerMount .bl-wrap{display:flex;flex-direction:column;gap:18px;margin:0 0 28px;}",
      "#budgetLedgerMount .bl-card{background:var(--surface-opaque,#fff);border:1px solid var(--border,rgba(28,28,26,.14));border-radius:7px;}",
      "#budgetLedgerMount .bl-bar{display:flex;flex-wrap:wrap;align-items:center;gap:9px 15px;background:var(--surface-opaque,#fff);border:1px solid var(--border,rgba(28,28,26,.14));border-radius:7px;padding:10px 13px;}",
      "#budgetLedgerMount .bl-barlab{font-size:.7rem;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--text-muted,#5C5C55);}",
      "#budgetLedgerMount .bl-seg{display:inline-flex;border:1px solid var(--border-strong,rgba(28,28,26,.3));border-radius:5px;overflow:hidden;}",
      "#budgetLedgerMount .bl-seg button{appearance:none;border:0;background:var(--surface-opaque,#fff);font:inherit;font-size:.82rem;font-weight:600;color:var(--text-muted,#5C5C55);padding:5px 14px;cursor:pointer;}",
      "#budgetLedgerMount .bl-seg button+button{border-left:1px solid var(--border-strong,rgba(28,28,26,.3));}",
      "#budgetLedgerMount .bl-seg button[aria-pressed='true']{background:var(--cobalt,#0047AB);color:#fff;}",
      "#budgetLedgerMount .bl-note,#budgetLedgerMount .bl-auth{font-size:.78rem;color:var(--text-muted,#5C5C55);}",
      "#budgetLedgerMount .bl-auth{margin-left:auto;}",
      "#budgetLedgerMount .bl-story{padding:16px 17px 14px;}",
      "#budgetLedgerMount .bl-story h3{margin:0 0 3px;font-size:1.05rem;color:var(--text-strong,#1C1C1A);}",
      "#budgetLedgerMount .bl-lede{font-size:.84rem;color:var(--text-muted,#5C5C55);margin:0 0 14px;}",
      "#budgetLedgerMount .bl-ask{margin-bottom:14px;}",
      "#budgetLedgerMount .bl-ask-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px;}",
      "#budgetLedgerMount .bl-ask-name{font-weight:700;color:var(--text-strong,#1C1C1A);font-size:.92rem;}",
      "#budgetLedgerMount .bl-ask-tot{font-size:1.1rem;font-weight:700;color:var(--text-strong,#1C1C1A);font-variant-numeric:tabular-nums;}",
      "#budgetLedgerMount .bl-met{font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--hunter,#2C601A);margin-left:8px;}",
      "#budgetLedgerMount .bl-meter{display:flex;height:24px;border-radius:3px;overflow:hidden;gap:2px;margin:6px 0 5px;}",
      "#budgetLedgerMount .bl-s1{background:var(--light-blue,#7DA1D4);border-radius:3px 0 0 3px;}",
      "#budgetLedgerMount .bl-s2{background:var(--cobalt,#0047AB);border-radius:0 3px 3px 0;}",
      "#budgetLedgerMount .bl-keys{display:flex;flex-wrap:wrap;gap:5px 18px;font-size:.78rem;color:var(--text-muted,#5C5C55);}",
      "#budgetLedgerMount .bl-key{display:inline-flex;align-items:center;gap:6px;}",
      "#budgetLedgerMount .bl-key i{width:10px;height:10px;border-radius:2px;display:inline-block;}",
      "#budgetLedgerMount .bl-d1{background:var(--light-blue,#7DA1D4);}#budgetLedgerMount .bl-d2{background:var(--cobalt,#0047AB);}",
      "#budgetLedgerMount .bl-key b{color:var(--text-body,#3A3A36);font-variant-numeric:tabular-nums;}",
      "#budgetLedgerMount .bl-scroll{overflow-x:auto;}",
      "#budgetLedgerMount table.bl-t{width:100%;border-collapse:collapse;font-size:.85rem;font-variant-numeric:tabular-nums;background:var(--surface-opaque,#fff);}",
      "#budgetLedgerMount .bl-t caption{text-align:left;font-size:1.02rem;font-weight:700;color:var(--text-strong,#1C1C1A);padding:14px 14px 3px;}",
      "#budgetLedgerMount .bl-cap{display:block;font-size:.78rem;font-weight:400;color:var(--text-muted,#5C5C55);margin-top:3px;max-width:78ch;}",
      "#budgetLedgerMount .bl-t th,#budgetLedgerMount .bl-t td{padding:7px 11px;border-bottom:1px solid var(--border,rgba(28,28,26,.14));text-align:right;vertical-align:top;}",
      "#budgetLedgerMount .bl-t th.l,#budgetLedgerMount .bl-t td.l{text-align:left;}",
      "#budgetLedgerMount .bl-t thead th{font-size:.67rem;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted,#5C5C55);font-weight:700;border-bottom:1px solid var(--border-strong,rgba(28,28,26,.3));white-space:nowrap;}",
      "#budgetLedgerMount .bl-grp td{background:var(--surface-muted,#ECE9E2);font-size:.67rem;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:var(--text-muted,#5C5C55);padding:6px 11px;}",
      "#budgetLedgerMount .bl-row td{font-weight:600;color:var(--text-strong,#1C1C1A);}",
      "#budgetLedgerMount .bl-kid td{background:var(--surface-subtle,#F7F5F1);font-weight:400;color:var(--text-body,#3A3A36);font-size:.82rem;}",
      "#budgetLedgerMount .bl-kid td.l{padding-left:34px;}",
      "#budgetLedgerMount tr.bl-hid{display:none;}",
      "#budgetLedgerMount .bl-tot td{border-top:2px solid var(--border-strong,rgba(28,28,26,.3));border-bottom:0;font-weight:700;color:var(--text-strong,#1C1C1A);background:var(--surface-subtle,#F7F5F1);}",
      "#budgetLedgerMount td.tot{font-weight:700;}",
      "#budgetLedgerMount .bl-desc{font-size:.76rem;font-weight:400;color:var(--text-muted,#5C5C55);margin-top:2px;max-width:70ch;line-height:1.4;}",
      "#budgetLedgerMount .bl-n{font-size:.71rem;color:var(--text-faint,#87877F);font-weight:400;margin-left:6px;}",
      "#budgetLedgerMount .bl-tw{display:inline-flex;align-items:center;gap:6px;}",
      "#budgetLedgerMount .bl-caret{appearance:none;border:1px solid var(--border-strong,rgba(28,28,26,.3));background:var(--surface-opaque,#fff);color:var(--text-muted,#5C5C55);border-radius:4px;width:18px;height:18px;flex:none;cursor:pointer;font-size:8px;line-height:1;display:inline-flex;align-items:center;justify-content:center;padding:0;}",
      "#budgetLedgerMount .bl-caret span{display:block;transition:transform .16s ease;}",
      "#budgetLedgerMount .bl-caret[aria-expanded='true'] span{transform:rotate(90deg);}",
      "@media (prefers-reduced-motion: reduce){#budgetLedgerMount .bl-caret span{transition:none;}}",
      "#budgetLedgerMount .bl-ed.bl-live{cursor:pointer;border-bottom:1px dashed var(--cobalt,#0047AB);}",
      "#budgetLedgerMount .bl-ed.bl-live:hover{background:rgba(0,71,171,.07);}",
      "#budgetLedgerMount .bl-ed:focus-visible{outline:2px solid var(--cobalt,#0047AB);outline-offset:2px;}",
      "#budgetLedgerMount .bl-empty{color:var(--text-faint,#87877F);}",
      "#budgetLedgerMount .bl-inp{font:inherit;font-size:.85rem;width:100%;min-width:90px;box-sizing:border-box;padding:2px 5px;border:1px solid var(--cobalt,#0047AB);border-radius:3px;}",
      "#budgetLedgerMount .bl-saving{color:var(--text-faint,#87877F);font-style:italic;}",
      "#budgetLedgerMount .bl-fail{background:rgba(146,0,0,.13);}",
      "#budgetLedgerMount details.bl-arch{background:var(--surface-muted,#ECE9E2);border:1px solid var(--border,rgba(28,28,26,.14));border-radius:7px;}",
      "#budgetLedgerMount details.bl-arch>summary{cursor:pointer;padding:10px 14px;font-size:.84rem;font-weight:600;color:var(--text-muted,#5C5C55);}",
      "#budgetLedgerMount .bl-arch-body{padding:0 14px 12px;}",
      "#budgetLedgerMount .bl-arch table.bl-t{background:transparent;}",
      "#budgetLedgerMount .bl-foot{font-size:.78rem;color:var(--text-muted,#5C5C55);max-width:78ch;}",
      "@media (max-width:640px){#budgetLedgerMount .bl-t th,#budgetLedgerMount .bl-t td{padding:6px 7px;}#budgetLedgerMount .bl-kid td.l{padding-left:20px;}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function refreshSession() {
    state.sess = fullSession();
    paint();
    var a = document.querySelector("#budgetLedgerMount .bl-auth");
    if (a) a.textContent = state.sess
      ? "✓ Editing unlocked — click any field · Enter saves · Esc cancels"
      : "Sign in on the funding plan below to edit";
  }

  function init() {
    if (!document.getElementById("budgetLedgerMount")) return;
    ensureCss();
    state.sess = fullSession();
    wire();
    render();
    load().then(render);
    window.addEventListener("hashchange", refreshSession);
    window.addEventListener("cpl-team-pass-dropped", refreshSession);
    window.addEventListener("storage", refreshSession);
  }

  window.CPL_BUDGET_LEDGER = {
    init: init,
    _state: state,
    _rowTotal: rowTotal,
    _totalOf: totalOf,
    _render: render,
    _setRows: function (rows) { state.rows = rows; state.err = null; },
    _setSession: function (s) { state.sess = s; }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
