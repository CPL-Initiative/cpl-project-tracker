/* adopt_panel.js — one Adopt chip per course and the side panel it opens (CPL-Initiative/cpl-project-tracker
 * issue #3412 item 4, Sam, 2026-11-16).
 *
 * A course that could earn credit for prior learning through one or more exhibits (the Could-adopt and
 * For-consideration titles) gets ONE chip, an underlined word: "<College> and N more give CPL for this course."
 * The named college is the nearest one doing it: a college in the same Strong Workforce region as the program's
 * college first (the region the Credential Catalog's Region filter reads, library/adopt/adopt_data.json
 * colleges[i][3]), then any college; within each, the college on the most of the course's exhibits, ties
 * alphabetical. A course with statewide recommendations and no granting college reads "Request Adopt (N)".
 *
 * The chip opens a side panel listing every exhibit, each with its issuer, units and granting colleges from the
 * Catalog (title t, issuer i, median units p, per-college units a) and a checkbox. One button sends ONE request
 * for the checked exhibits to the Quick Adopt intake (public cpl_adoption_interest, anon INSERT-only; schema of
 * record kb/supabase_adoption_interest.sql), with the same fields CPL Pathways' Quick Adopt form sends.
 *
 * Shared, never copied: CPL Pathways' catalog-record course cards (cpl_pathways.js, into its own side panel) and
 * the CPL Opportunity page (library/cpl-opportunity/, through college_cpl_workbook.js, into this file's panel).
 * DOM is built with createElement/textContent; chipHtml() escapes every value. It writes only the intake row.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var INTAKE = SUPABASE_URL + "/rest/v1/cpl_adoption_interest";
  // The intake's column limits (kb/supabase_adoption_interest.sql).
  var MAX = { credentials: 600, precedent: 1200, note: 2000, program_id: 120, program_label: 200, course_title: 200, course_code: 40 };
  var PANEL_ID = "cpladp-panel";

  // ── The Credential Catalog (library/adopt/adopt_data.json) ───────────────────
  var cat = { data: null, error: null, loading: null, byTitle: null, byCollege: null };
  function norm(t) { return String(t == null ? "" : t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function setCatalog(d) {
    cat.data = d && Array.isArray(d.credentials) ? d : null;
    cat.byTitle = null; cat.byCollege = null;
    if (!cat.data && !cat.error) cat.error = "the Credential Catalog holds no credentials";
    relabelAll();
    return cat.data;
  }
  function load(url) {
    if (cat.loading) return cat.loading;
    if (typeof window.fetch !== "function") { cat.error = "this page cannot read the Credential Catalog"; cat.loading = Promise.resolve(null); return cat.loading; }
    cat.loading = window.fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(setCatalog, function (e) { cat.error = (e && e.message) || "the read failed"; relabelAll(); return null; });
    return cat.loading;
  }
  /* A caller that reads the Catalog itself (CPL Pathways' loadAdopt) hands its promise over, so the file is read once. */
  function useLoading(p) {
    if (!p || cat.loading) return cat.loading;
    cat.loading = Promise.resolve(p).then(function (d) { return setCatalog(d); }, function (e) { cat.error = (e && e.message) || "the read failed"; return null; });
    return cat.loading;
  }
  function indexes() {
    var D = cat.data;
    if (!D) return null;
    if (!cat.byTitle) {
      cat.byTitle = {};
      D.credentials.forEach(function (c) { var k = norm(c.t); if (k && !cat.byTitle[k]) cat.byTitle[k] = c; });
      cat.byCollege = {};
      (D.colleges || []).forEach(function (c, i) {
        var row = { i: i, name: c[0], region: c[3] || "" };
        [c[0], c[1]].forEach(function (n) { var k = norm(n); if (k && !cat.byCollege[k]) cat.byCollege[k] = row; });
      });
    }
    return cat;
  }
  function regionOf(college) {
    var ix = indexes();
    var row = ix && ix.byCollege[norm(college)];
    return row ? row.region : "";
  }
  function entryFor(title) {
    var ix = indexes();
    return ix ? ix.byTitle[norm(title)] || null : null;
  }

  // ── The model: one course's exhibits ─────────────────────────────────────────
  /* items: [{ title, colleges: [names], kind: "adopt" | "consider", cid, credit, issuer, units, links }]
   * missing: exhibits the build counts that the list does not yet carry (credentials_n beyond credentials);
   * collegesN: the build's count of granting colleges, when it has one. */
  function model(items, extra) {
    var seen = {}, out = [];
    (items || []).forEach(function (it) {
      if (!it || !it.title) return;
      var k = norm(it.title);
      if (seen[k]) {
        var was = seen[k];
        (it.colleges || []).forEach(function (c) { if (was.colleges.indexOf(c) < 0) was.colleges.push(c); });
        return;
      }
      var one = Object.assign({}, it, { colleges: (it.colleges || []).slice() });
      seen[k] = one;
      out.push(one);
    });
    extra = extra || {};
    return { items: out, missing: Math.max(0, extra.missing || 0), collegesN: extra.collegesN || 0 };
  }
  /* From a CPL Pathways catalog record's course (display.courses[code]): adopt.credentials and consider. */
  function fromRoep(info) {
    info = info || {};
    var adopt = info.adopt || {}, items = [];
    (adopt.credentials || []).forEach(function (a) {
      if (a && a.credential) items.push({ title: a.credential, colleges: a.colleges || [], kind: "adopt" });
    });
    (info.consider || []).forEach(function (x) {
      if (x && x.credential) items.push({ title: x.credential, colleges: [], kind: "consider", cid: x.cid || "", credit: x.credit || "", collegesN: x.colleges_n || 0 });
    });
    var listed = (adopt.credentials || []).length;
    return model(items, { missing: (adopt.credentials_n || listed) - listed, collegesN: adopt.colleges_n || 0 });
  }
  /* Granting colleges for an item: its own list, else the Catalog's colleges that award it, the home college left out. */
  function grantors(it, home) {
    if ((it.colleges || []).length) return it.colleges;
    var e = entryFor(it.title), D = cat.data;
    if (!e || !D) return [];
    var h = norm(home), out = [];
    (e.a || []).forEach(function (x) {
      var c = (D.colleges || [])[x[0]];
      var name = c && c[0];
      if (name && norm(name) !== h && norm(c[1]) !== h && out.indexOf(name) < 0) out.push(name);
    });
    return out.sort();
  }
  /* The college the chip names (Sam, 2026-11-16 2:21 PM: the program's own region first). */
  function pickCollege(m, home) {
    var count = {};
    m.items.forEach(function (it) {
      grantors(it, home).forEach(function (c) { count[c] = (count[c] || 0) + 1; });
    });
    var names = Object.keys(count);
    if (!names.length) return { name: "", total: 0 };
    function best(list) {
      return list.slice().sort(function (a, b) { return count[b] - count[a] || (a < b ? -1 : a > b ? 1 : 0); })[0];
    }
    var r = regionOf(home);
    var near = r ? names.filter(function (n) { return regionOf(n) === r; }) : [];
    return { name: best(near.length ? near : names), total: Math.max(names.length, m.collegesN || 0), near: !!near.length };
  }
  function exhibitCount(m) { return m.items.length + m.missing; }
  function label(m, home) {
    var p = pickCollege(m, home);
    if (!p.name) return "Request Adopt (" + exhibitCount(m) + ")";
    var more = p.total - 1;
    return more > 0 ? p.name + " and " + more + " more give CPL for this course." : p.name + " gives CPL for this course.";
  }

  // ── The chip ─────────────────────────────────────────────────────────────────
  var CSS_ID = "cpladp-css";
  /* Tokens: COBI's First Light names first, the public library page's names after, never a raw color. */
  var CSS = [
    ".cpladp-chip { display:inline-block; background:none; border:0; padding:0 2px; min-height:24px; font:inherit; font-size:.86rem; font-weight:600; text-align:left; cursor:pointer;",
    "  color: var(--accent-link, var(--link)); text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:3px; }",
    ".cpladp-chip:hover { text-decoration-thickness:2px; }",
    ".cpladp-chip:focus-visible, .cpladp-panel button:focus-visible, .cpladp-panel input:focus-visible, .cpladp-panel textarea:focus-visible, .cpladp-panel a:focus-visible { outline:2px solid var(--focus-ring, var(--accent)); outline-offset:2px; }",
    ".cpladp-panel { position:fixed; z-index:9002; top:0; right:0; bottom:0; width:min(520px, 100vw); display:flex; flex-direction:column;",
    "  background: var(--surface-opaque, var(--surface)); color: var(--text-body, var(--ink)); border-left:1px solid var(--border, var(--line)); box-shadow:-8px 0 24px var(--shadow, transparent); }",
    ".cpladp-panel[hidden] { display:none !important; }",
    ".cpladp-head { flex:0 0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:max(12px, env(safe-area-inset-top, 0px)) 18px 10px; border-bottom:1px solid var(--border, var(--line)); }",
    ".cpladp-head h2 { margin:0; font-size:1.15rem; line-height:1.3; color: var(--text-strong, var(--heading)); }",
    ".cpladp-head h2:focus { outline:none; }",
    ".cpladp-head p { margin:2px 0 0; font-size:.88rem; color: var(--text-muted, var(--muted)); }",
    ".cpladp-word { flex:0 0 auto; background:none; border:0; padding:0 2px; min-height:24px; font:inherit; color: var(--accent-link, var(--link)); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }",
    ".cpladp-body { flex:1 1 auto; overflow:auto; padding:8px 18px 28px; line-height:1.5; }",
    ".cpladp-intro, .cpladp-more, .cpladp-wait { margin:6px 0 10px; font-size:.9rem; color: var(--text-muted, var(--muted)); }",
    ".cpladp-list { border:0; margin:0; padding:0; min-width:0; }",
    ".cpladp-list legend { padding:0; margin:8px 0 6px; font-weight:700; color: var(--text-strong, var(--heading)); }",
    ".cpladp-row { display:grid; grid-template-columns:24px minmax(0, 1fr); gap:2px 8px; padding:10px 0; border-top:1px solid var(--border, var(--line)); }",
    ".cpladp-row input { width:20px; height:20px; margin:2px 0 0; accent-color: var(--accent-link, var(--link)); }",
    ".cpladp-row label { font-weight:600; color: var(--text-strong, var(--heading)); overflow-wrap:anywhere; cursor:pointer; }",
    ".cpladp-facts { grid-column:2; display:grid; gap:2px; font-size:.86rem; color: var(--text-body, var(--ink)); overflow-wrap:anywhere; }",
    ".cpladp-facts .cpladp-unk { color: var(--text-muted, var(--muted)); }",
    ".cpladp-form { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin-top:14px; }",
    ".cpladp-form label { display:grid; gap:2px; font-size:.85rem; color: var(--text-muted, var(--muted)); }",
    ".cpladp-form input, .cpladp-form textarea { font:inherit; font-size:.9rem; padding:6px 8px; min-height:32px; border:1px solid var(--border, var(--line-strong)); border-radius:4px;",
    "  background: var(--surface-opaque, var(--surface)); color: var(--text-body, var(--ink)); }",
    ".cpladp-form .cpladp-wide { grid-column:1 / -1; }",
    ".cpladp-send { justify-self:start; background:none; border:0; padding:0 2px; min-height:24px; font:inherit; font-weight:700; color: var(--accent-link, var(--link)); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }",
    ".cpladp-send[disabled] { cursor:wait; color: var(--text-muted, var(--muted)); }",
    ".cpladp-err { color: var(--red-alert, var(--heading)); font-size:.88rem; font-weight:600; }",
    ".cpladp-ok { margin-top:14px; font-weight:600; color: var(--text-strong, var(--heading)); }",
    ".cpladp-small { font-size:.82rem; color: var(--text-muted, var(--muted)); }",
    "@media print { .cpladp-panel, .cpladp-chip { display:none !important; } }"
  ].join("\n");
  function ensureCss() {
    if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
    var st = document.createElement("style");
    st.id = CSS_ID;
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  /* A chip element. opts: { home, course: {code, title}, program: {id, label}, open(title, sub, opener) -> body,
   * controls (the panel's id), adopterCollege }. Returns null when the course has nothing to adopt. */
  function chip(m, opts) {
    if (!m || !m.items.length) return null;
    ensureCss();
    var b = el("button", "cpladp-chip", label(m, opts.home));
    b.type = "button";
    b.setAttribute("aria-haspopup", "dialog");
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-controls", opts.controls || PANEL_ID);
    b._cpladp = { m: m, opts: opts };
    b.addEventListener("click", function () { openFor(b, m, opts); });
    return b;
  }
  /* The same chip as an HTML string, for a page that paints with innerHTML; its click is the page's to route. */
  function chipHtml(m, opts) {
    if (!m || !m.items.length) return "";
    ensureCss();
    return '<button type="button" class="cpladp-chip" aria-haspopup="dialog" aria-expanded="false" aria-controls="' + esc(opts.controls || PANEL_ID) + '"'
      + (opts.attrs || "") + ">" + esc(label(m, opts.home)) + "</button>";
  }
  function relabelAll() {
    if (typeof document === "undefined") return;
    var list = document.querySelectorAll(".cpladp-chip");
    for (var i = 0; i < list.length; i++) {
      var c = list[i]._cpladp;
      if (c) list[i].textContent = label(c.m, c.opts.home);
    }
  }

  // ── The panel this file owns (a page without one of its own) ────────────────
  var own = { panel: null, opener: null, refind: null, seq: 0 };
  function ownPanel() {
    if (own.panel) return own.panel;
    ensureCss();
    var p = el("aside", "cpladp-panel");
    p.id = PANEL_ID;
    p.hidden = true;
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-modal", "false");
    p.setAttribute("aria-labelledby", PANEL_ID + "-h");
    var head = el("div", "cpladp-head"), words = el("div");
    var h = el("h2", null, "");
    h.id = PANEL_ID + "-h";
    h.tabIndex = -1;
    words.appendChild(h);
    words.appendChild(el("p", null, ""));
    var close = el("button", "cpladp-word", "Close");
    close.type = "button";
    close.addEventListener("click", closeOwn);
    head.appendChild(words);
    head.appendChild(close);
    p.appendChild(head);
    p.appendChild(el("div", "cpladp-body"));
    p.addEventListener("keydown", function (e) { if (e.key === "Escape") closeOwn(); });
    document.body.appendChild(p);
    own.panel = p;
    return p;
  }
  function openOwn(title, sub, opener, refind) {
    var p = ownPanel();
    if (own.opener && own.opener !== opener && own.opener.setAttribute) own.opener.setAttribute("aria-expanded", "false");
    own.opener = opener || null;
    own.refind = refind || null;
    p.querySelector("h2").textContent = title;
    p.querySelector(".cpladp-head p").textContent = sub || "";
    var body = p.querySelector(".cpladp-body");
    while (body.firstChild) body.removeChild(body.firstChild);
    p.hidden = false;
    try { p.querySelector("h2").focus(); } catch (e) { /* best effort */ }
    return body;
  }
  function closeOwn() {
    if (!own.panel || own.panel.hidden) return;
    own.panel.hidden = true;
    own.seq++;
    var back = own.opener;
    if (!(back && document.contains(back)) && own.refind) back = own.refind();
    own.opener = null; own.refind = null;
    if (back && back.setAttribute) back.setAttribute("aria-expanded", "false");
    if (back && back.focus) { try { back.focus(); } catch (e) { /* best effort */ } }
  }

  // ── The panel's contents ─────────────────────────────────────────────────────
  function fmtUnits(u) { var n = Number(u); return isFinite(n) ? String(Math.round(n * 10) / 10) : ""; }
  function unitsWords(it) {
    var e = entryFor(it.title);
    if (e && e.p != null && fmtUnits(e.p) !== "") {
      var n = (e.a || []).length;
      return fmtUnits(e.p) + " units, the median across the " + n + (n === 1 ? " college that awards it." : " colleges that award it.");
    }
    if (it.units != null && fmtUnits(it.units) !== "") return fmtUnits(it.units) + " units, the median among peer colleges.";
    if (it.credit) return "Units not on file; the statewide recommendation reads: " + it.credit + ".";
    return "";
  }
  function facts(it, home) {
    var box = el("div", "cpladp-facts"), e = entryFor(it.title);
    function line(text, unknown) { box.appendChild(el("span", unknown ? "cpladp-unk" : null, text)); }
    var issuer = (e && e.i) || it.issuer || "";
    line(issuer ? "Issuer: " + issuer + "." : "The issuer is not on file.", !issuer);
    var u = unitsWords(it);
    line(u || "The units are not on file.", !u);
    var g = grantors(it, home);
    if (g.length) line("Already gives CPL for it: " + g.join(", ") + ".");
    else line(it.kind === "consider" ? "No college grants it yet; it is a statewide recommendation" + (it.cid ? " for " + it.cid : "") + "." : "No granting college is on file.", true);
    if (it.kind === "consider" && g.length && it.cid) line("A statewide recommendation for " + it.cid + ".");
    var links = typeof it.links === "function" ? it.links(it.title) : null;
    if (links) box.appendChild(links);
    return box;
  }
  /* The one intake row for the checked exhibits (pure, so a test can read it). ctx: { program: {id, label},
   * course: {code, title} }; form: { adopter_college, contact_name, contact_email, note }. Returns { body } or
   * { error } — never a row that drops a checked exhibit. */
  function requestBody(ctx, checked, form, home) {
    if (!checked || !checked.length) return { error: "Check at least one exhibit to request." };
    form = form || {};
    var college = String(form.adopter_college || "").trim(), email = String(form.contact_email || "").trim();
    if (college.length < 2) return { error: "Your college is required." };
    if (email.indexOf("@") < 1) return { error: "A work email is required." };
    var titles = checked.map(function (it) { return it.title; });
    var creds = titles.join(" | ");
    var prec = checked.map(function (it) {
      var g = grantors(it, home);
      return it.title + ": " + (g.length ? g.join(", ") : "no granting college on file");
    }).join(" | ");
    var userNote = String(form.note || "").trim(), note = userNote;
    if (creds.length > MAX.credentials || prec.length > MAX.precedent) {
      // One row still: a short count in credentials, the full list in the note, and the precedent as counts.
      var list = "Exhibits requested (" + titles.length + "): " + titles.join(" | ");
      note = list + (userNote ? "\n\n" + userNote : "");
      if (note.length > MAX.note) {
        return { error: "The " + titles.length + " checked exhibits and your note are too long for one request (" + note.length + " of " + MAX.note
          + " characters). Shorten the note or send the exhibits in two requests." };
      }
      creds = titles.length + " exhibits, listed in the note";
      if (prec.length > MAX.precedent) {
        prec = checked.map(function (it) { var n = grantors(it, home).length; return it.title + " (" + n + (n === 1 ? " college)" : " colleges)"); }).join(" | ");
        if (prec.length > MAX.precedent) prec = titles.length + " exhibits; the panel lists the colleges that grant each";
      }
    }
    var prog = ctx.program || {}, course = ctx.course || {};
    return { body: {
      program_id: String(prog.id || "unknown").slice(0, MAX.program_id),
      program_label: String(prog.label || "").slice(0, MAX.program_label) || null,
      course_code: course.code ? String(course.code).slice(0, MAX.course_code) : null,
      course_title: String(course.title || course.code || "(course)").slice(0, MAX.course_title),
      credentials: creds,
      precedent: prec || null,
      adopter_college: college.slice(0, 120),
      contact_name: String(form.contact_name || "").trim().slice(0, 120) || null,
      contact_email: email.slice(0, 200),
      note: note || null,
    } };
  }
  function send(body) {
    return window.fetch(INTAKE, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(body),
    }).then(function (r) { if (!r.ok) throw new Error("intake " + r.status); return r; });
  }
  var formSeq = 0;
  function paint(body, m, opts) {
    var home = opts.home || "";
    var n = exhibitCount(m);
    body.appendChild(el("p", "cpladp-intro", "Check the exhibits " + (opts.adopterCollege || "your college") + " should consider, then send one request. The CPL team routes it to your curriculum office."));
    if (m.missing > 0) {
      body.appendChild(el("p", "cpladp-more", m.missing + (m.missing === 1 ? " more exhibit matches" : " more exhibits match") + " this course than this list shows ("
        + n + " in all). The full list arrives with the next catalog display update."));
    }
    if (!cat.data) {
      body.appendChild(el("p", "cpladp-more", cat.error
        ? "The Credential Catalog could not be read (" + cat.error + "), so issuers and units come only from this page's own data."
        : "The Credential Catalog is still loading, so issuers and units come only from this page's own data."));
    }
    var id = "cpladp-f" + (++formSeq);
    var fs = el("fieldset", "cpladp-list");
    fs.appendChild(el("legend", null, m.items.length + (m.items.length === 1 ? " exhibit" : " exhibits") + " for " + ((opts.course || {}).code || "this course")));
    var boxes = [];
    m.items.forEach(function (it, i) {
      var row = el("div", "cpladp-row");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id + "-x" + i;
      cb.value = String(i);
      var lb = el("label", null, it.title);
      lb.setAttribute("for", cb.id);
      row.appendChild(cb);
      row.appendChild(lb);
      row.appendChild(facts(it, home));
      fs.appendChild(row);
      boxes.push(cb);
    });
    body.appendChild(fs);

    var form = el("form", "cpladp-form");
    form.noValidate = true;
    function field(name, words, type, value, wide) {
      var lb = el("label", wide ? "cpladp-wide" : null, words);
      var i = document.createElement(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") i.type = type || "text";
      i.name = name;
      i.setAttribute("maxlength", name === "note" ? "2000" : "200");
      if (value) i.value = value;
      lb.appendChild(i);
      form.appendChild(lb);
      return i;
    }
    var college = field("adopter_college", "Your college (required)", "text", opts.adopterCollege || "");
    var name = field("contact_name", "Your name", "text");
    var email = field("contact_email", "Work email (required)", "email");
    var note = field("note", "Anything the team should know", "textarea", "", true);
    var go = el("button", "cpladp-send", "Send one request for the checked exhibits");
    go.type = "submit";
    var err = el("span", "cpladp-err", "");
    err.setAttribute("role", "alert");
    form.appendChild(go);
    form.appendChild(err);
    form.appendChild(el("p", "cpladp-small cpladp-wide", "This records the request for the CPL team. Your contact details go only to them; the public cannot read them."));
    body.appendChild(form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.textContent = "";
      var checked = boxes.filter(function (b) { return b.checked; }).map(function (b) { return m.items[Number(b.value)]; });
      var got = requestBody(opts, checked, { adopter_college: college.value, contact_name: name.value, contact_email: email.value, note: note.value }, home);
      if (got.error) { err.textContent = got.error; return; }
      go.disabled = true;
      (opts.send || send)(got.body).then(function () {
        var ok = el("p", "cpladp-ok", "Request recorded for " + checked.length + (checked.length === 1 ? " exhibit" : " exhibits") + ". The CPL team will follow up with your curriculum office.");
        ok.setAttribute("role", "status");
        form.parentNode.replaceChild(ok, form);
        boxes.forEach(function (b) { b.disabled = true; });
      }, function () {
        go.disabled = false;
        err.textContent = "The request could not be recorded. Try again, or email the CPL team.";
      });
    });
    return { boxes: boxes, form: form };
  }
  function panelTitle(opts) {
    var c = opts.course || {};
    return "Request Adopt: " + [c.code, c.title].filter(Boolean).join(" ");
  }
  /* Open the panel for a model. A caller with its own side panel passes opts.open(title, sub, opener) -> body;
   * otherwise this file's panel opens. opts.refind() finds the chip again after the page repaints. */
  function openFor(opener, m, opts) {
    var sub = opts.sub != null ? opts.sub : (opts.home ? opts.home : "");
    var body = opts.open ? opts.open(panelTitle(opts), sub, opener) : openOwn(panelTitle(opts), sub, opener, opts.refind);
    if (opener && opener.setAttribute) opener.setAttribute("aria-expanded", "true");
    if (!cat.data && cat.loading && !cat.error) {
      var wait = el("p", "cpladp-wait", "Reading the Credential Catalog for issuers and units.");
      body.appendChild(wait);
      var seq = ++own.seq;
      return cat.loading.then(function () {
        if (seq !== own.seq || !wait.parentNode) return null;
        wait.parentNode.removeChild(wait);
        return paint(body, m, opts);
      });
    }
    return Promise.resolve(paint(body, m, opts));
  }

  window.CPL_ADOPT_PANEL = {
    load: load, useLoading: useLoading, setCatalog: setCatalog, catalog: function () { return cat.data; },
    model: model, fromRoep: fromRoep, label: label, pickCollege: pickCollege, regionOf: regionOf, grantors: grantors,
    chip: chip, chipHtml: chipHtml, relabelAll: relabelAll, open: openFor, close: closeOwn,
    requestBody: requestBody, send: send, PANEL_ID: PANEL_ID, MAX: MAX,
  };
})();
