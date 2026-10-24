// comms.js — the Letters, Memos & Reports tab: one register for every communication
// the CPL Initiative drafts (an email to the CEOs, a Chancellor's Office memo, a MAP
// Team note, a report, a flyer), with the recipients read from MAP's roster by role,
// the figures read from the daily feeds, and the words from the team, with Claude's
// draft when asked.
//
// Sam, 2026-10-23 (the side session beside S457): "I need to send an email to the
// CEOs and cc their CIO and CSSO. Thinking you could set this up on our COBI Letter,
// Memos, Reports tab which I haven't used since it was created. It was designed to
// support funding advocacy but thinking it should be expanded for any type of
// communication I need to craft that needs to incorporate current data and contacts
// for various roles in the system that we may already store (e.g., CEO name and email
// and current CPL metrics)." Then: a status (draft, final, tabled), a search bar, an
// audience selector, a comm type, cc recipients, and a way to post to the COBI Library.
//
// A RECORD HOLDS ROLES, NEVER ADDRESSES. to_roles and cc_roles name columns of
// map_college_contacts (ceo; vpaa, the chief instructional officer; vpss, the chief
// student services officer; ...), which the daily sync keeps current and which stays
// behind the team phrase. The body keeps its merge fields as typed ({college},
// {salutation}, {jst_pct} ...); the tab fills them per college at render time, so no
// address or figure is ever frozen into a stored letter.
//
// WHAT IT CANNOT DO: send. COBI sends no email (a human presses send). Each recipient
// row offers the merged text to copy, a mail link that opens the team's own mail client
// with To, Cc, subject and body filled, and a CSV of every recipient for a mail merge.
//
// Reads and writes need the team phrase (cpl_team_pass) or a reviewer sign-in: RLS on
// cpl_comms is team_pass_ok() or is_allowed_reviewer(), the Library's gate. Nothing is
// deleted: Retire sets retired_at, and a trigger files every prior row in
// cpl_comms_history. Schema: kb/supabase_cpl_comms.sql. Test: tests/comms.test.js.
//
// STATIC module, lazy-loaded on first #letters open (both HTMLs, Rule 4). It injects
// its own CSS (the ensureCerScopeCss pattern) from tokens, never a raw hex.
//
// THE VOICE, THE WORDS, THE AUDIENCES, THE MODEL AND THE PROXY CALL COME FROM cpl_writer.js
// (window.CPL_WRITER, static in both HTMLs; Sam's Sheet 118 ruling 5, 2026-10-23: one writer
// module, this tab its first consumer). This file keeps only what is its own: the merge
// fields, the facts rule and the return format. It names no model.
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REST = SUPABASE_URL + "/rest/v1";
  var TABLE_URL = REST + "/cpl_comms";
  var LIBRARY_URL = REST + "/cpl_library";
  var CONTACT_COLS = "college,ceo,ceo_email,vpaa,vpaa_email,vpss,vpss_email,primary_contact,primary_contact_email," +
    "cpl_coordinator,cpl_coordinator_email,cpl_counselor,cpl_counselor_email,articulation_officer,articulation_officer_email," +
    "faculty_lead,faculty_lead_email,senate_president,senate_president_email,certifying_official,certifying_official_email," +
    "landing_page_url,synced_at";
  var CONTACTS_URL = REST + "/map_college_contacts?select=" + CONTACT_COLS + "&order=college.asc";
  var COLLEGES_URL = REST + "/map_colleges?select=college_id,college_name,variants,entity_kind,district&order=college_name.asc";
  var JST_URL = "veteran_jst.json";
  var PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/";
  var CURATOR_SRC = "budget-support/web/curator.html";
  var TEAM_KEY = "cpl_team_pass";
  var AUTHOR_KEY = "cpl_library_author";   // the Library's remembered name, so a person types it once
  var ROOT_ID = "letters-root";
  // The writer module (cpl_writer.js) holds the one model, the voice, the words and the
  // proxy call for every surface; it is static in both HTMLs, so it is present before any
  // tab loads. A page missing it is a Rule 4 fault the tests catch.
  var W = window.CPL_WRITER;
  if (!W) throw new Error("comms.js needs cpl_writer.js loaded first (window.CPL_WRITER)");
  var STAR_THRESHOLD = 0.75;

  var TYPE = { email: "Email", memo: "CO memo", team_note: "MAP Team note", report: "Report", flyer: "Flyer", letter: "Letter", other: "Other" };
  var TYPE_ORDER = ["email", "letter", "memo", "team_note", "report", "flyer", "other"];
  var STATUS = { draft: "Draft", final: "Final", tabled: "Tabled" };
  var STATUS_ORDER = ["draft", "final", "tabled"];
  // The audiences are the writer's, one list for every surface; this tab reads them into
  // its label, order and guidance maps.
  var AUDIENCE = {}, AUDIENCE_GUIDE = {};
  var AUDIENCE_ORDER = W.AUDIENCES.map(function (a) { AUDIENCE[a.id] = a.label; AUDIENCE_GUIDE[a.id] = a.guide; return a.id; });
  // The roster roles a record can address. `name` and `email` are map_college_contacts
  // columns; `title` is the word a salutation uses when the name carries no honorific.
  var ROLES = {
    ceo: { label: "CEO (president)", name: "ceo", email: "ceo_email", title: "President" },
    vpaa: { label: "CIO (vice president, academic affairs)", name: "vpaa", email: "vpaa_email", title: "Vice President" },
    vpss: { label: "CSSO (vice president, student services)", name: "vpss", email: "vpss_email", title: "Vice President" },
    primary_contact: { label: "Primary CPL contact", name: "primary_contact", email: "primary_contact_email", title: "" },
    cpl_coordinator: { label: "CPL coordinator", name: "cpl_coordinator", email: "cpl_coordinator_email", title: "" },
    cpl_counselor: { label: "CPL counselor", name: "cpl_counselor", email: "cpl_counselor_email", title: "" },
    articulation_officer: { label: "Articulation officer", name: "articulation_officer", email: "articulation_officer_email", title: "" },
    faculty_lead: { label: "Faculty lead", name: "faculty_lead", email: "faculty_lead_email", title: "" },
    senate_president: { label: "Academic Senate president", name: "senate_president", email: "senate_president_email", title: "" },
    certifying_official: { label: "VA certifying official", name: "certifying_official", email: "certifying_official_email", title: "" }
  };
  var ROLE_ORDER = ["ceo", "vpaa", "vpss", "primary_contact", "cpl_coordinator", "cpl_counselor", "articulation_officer", "faculty_lead", "senate_president", "certifying_official"];
  // Every merge field the body may carry, with what fills it. The tab fills them per
  // college; the model is told to write them rather than literals.
  var FIELDS = [
    ["college", "the college's full name"], ["college_short", "the college's short name"], ["district", "the college's district"],
    ["salutation", "Dr. or President and the CEO's last name (the To role's)"], ["recipient_name", "the To person's full name"],
    ["ceo_name", "the CEO's name"], ["ceo_email", "the CEO's address"], ["cio_name", "the CIO's name"], ["cio_email", "the CIO's address"],
    ["csso_name", "the CSSO's name"], ["csso_email", "the CSSO's address"], ["coordinator_name", "the CPL coordinator's name"],
    ["landing_page", "the college's MAP landing page"],
    ["vets", "enrolled veterans the college reports to MIS"], ["jst", "Joint Services Transcripts in MAP for the college"],
    ["jst_pct", "JSTs as a percentage of reported veterans"], ["jst_standing", "a clause saying whether the college meets the 75 percent mark"],
    ["jst_as_of", "the date the JST figures were read"],
    ["statewide_vets", "enrolled veterans statewide"], ["statewide_jst", "JSTs statewide"], ["star_colleges", "colleges at the 75 percent mark"],
    ["date", "today's date, spelled out"], ["sender", "the signature block"]
  ];

  var state = {
    rows: null, contacts: null, colleges: null, jst: null, loading: false, error: null,
    q: "", type: "all", status: "all", audience: "all",
    open: null, form: null, preview: null, draft: null, drafting: false, retireAsk: false,
    message: "", msgErr: false, busy: false, curator: false, wired: false
  };

  // ── storage + headers ───────────────────────────────────────────────────────
  function teamPhrase() {
    try { return window.localStorage.getItem(TEAM_KEY) || ""; } catch (e) { return ""; }
  }
  function storedAuthor() {
    try { return window.localStorage.getItem(AUTHOR_KEY) || ""; } catch (e) { return ""; }
  }
  function rememberAuthor(name) {
    try { if (name) window.localStorage.setItem(AUTHOR_KEY, name); } catch (e) { /* private window */ }
  }
  function headers(extra) {
    var h = { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON };
    var p = teamPhrase();
    if (p) h["x-team-pass"] = p;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    return h;
  }

  // ── small helpers ──────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1] : "";
  }
  function longToday() {
    var d = new Date();
    return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function slugFor(title) {
    var s = String(title || "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
    if (!/^[a-z0-9]/.test(s)) s = "c" + s;
    return (s.length < 2 ? s + "-x" : s) + "-" + today().replace(/-/g, "").slice(2);
  }
  function fmtInt(n) { return (n == null || isNaN(n)) ? "" : String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function pct(jst, vets) {
    if (!vets) return null;
    return Math.round(100 * jst / vets);
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function blank(v) { return v == null || String(v).trim() === ""; }
  function clean(v) { return blank(v) ? "" : String(v).replace(/\s+/g, " ").trim(); }
  function say(text, isErr) { state.message = text; state.msgErr = !!isErr; }
  function byId(id) {
    var rows = state.rows || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }
  function bySlug(slug) {
    var rows = state.rows || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].slug === slug) return rows[i];
    return null;
  }

  // ── the salutation ─────────────────────────────────────────────────────────
  // MAP's roster holds one hand-typed name per role ("Dr. Jennifer Zellet", "Kevin G.
  // Walthers", "Kathyrn  Mitchell"), no separate title or last name. An honorific in
  // the name wins (Dr.); otherwise the role's own word (President for the CEO). A
  // suffix after a comma (", Ed.D.") is dropped before the last name is read.
  function salutation(name, role) {
    var n = clean(name);
    if (!n) return "";
    var honor = "";
    var m = /^(Dr\.?|Doctor)\s+/i.exec(n);
    if (m) { honor = "Dr."; n = n.slice(m[0].length); }
    n = n.replace(/,.*$/, "").replace(/\s+(Ed\.?D\.?|Ph\.?D\.?|J\.?D\.?|M\.?D\.?|Jr\.?|Sr\.?|II|III)$/i, "").trim();
    var parts = n.split(" ").filter(Boolean);
    var last = parts.length ? parts[parts.length - 1] : "";
    if (!last) return "";
    var title = honor || ((ROLES[role] && ROLES[role].title) || "");
    return title ? title + " " + last : clean(name);
  }

  // ── the data ───────────────────────────────────────────────────────────────
  function jget(url) {
    return window.fetch(url, { headers: headers() }).then(function (res) {
      if (!res.ok) throw new Error(url.replace(REST + "/", "").replace(/\?.*$/, "") + " answered " + res.status);
      return res.json();
    });
  }
  function load() {
    if (!teamPhrase()) { state.rows = null; state.error = null; render(); return Promise.resolve(); }
    state.loading = true; state.error = null; render();
    var reads = [
      jget(TABLE_URL + "?select=*&retired_at=is.null&order=updated_at.desc"),
      jget(CONTACTS_URL),
      jget(COLLEGES_URL),
      window.fetch(JST_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ];
    return Promise.all(reads).then(function (got) {
      state.rows = Array.isArray(got[0]) ? got[0] : [];
      state.contacts = Array.isArray(got[1]) ? got[1] : [];
      state.colleges = Array.isArray(got[2]) ? got[2] : [];
      state.jst = got[3] && got[3].colleges ? got[3] : null;
      state.loading = false;
      routeFromHash();
      render();
    }).catch(function (e) {
      state.rows = null; state.loading = false;
      state.error = "The register could not be read (" + (e && e.message ? e.message : "cpl_comms") + "). Nothing is shown rather than a partial list.";
      render();
    });
  }
  // write(url, { method, body }): each caller names its method beside the table
  // address, which is also how kb/_build_dependency_map.py sees the write edge.
  function write(url, req) {
    state.busy = true; render();
    return window.fetch(url, {
      method: req.method,
      headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(req.body)
    }).then(function (res) {
      state.busy = false;
      if (!res.ok) {
        return res.text().then(function (t) {
          var why = res.status === 401 || res.status === 403
            ? "The team phrase was refused. Unlock again from the About menu and retry."
            : "The write was refused (" + res.status + "). " + String(t || "").slice(0, 200);
          throw new Error(why);
        });
      }
      return res.json();
    });
  }

  // ── the roster, joined to the identity table and the JST feed ──────────────
  // map_college_contacts is hand-typed in MAP and carries partners and test rows
  // beside the colleges; map_colleges (entity_kind, variants) says which rows are
  // colleges and resolves a spelling to one identity. The JST feed spells names the
  // dashboard's way, so it joins through the same variants.
  var rosterCache = null;
  function identityIndex() {
    var idx = {}, list = state.colleges || [];
    list.forEach(function (c) {
      if (!c || !c.college_name) return;
      var kind = c.entity_kind || "college";
      if (kind !== "college" && kind !== "continuing_education") return;
      idx[norm(c.college_name)] = c;
      (c.variants || []).forEach(function (v) { if (v && !idx[norm(v)]) idx[norm(v)] = c; });
    });
    return idx;
  }
  function roster() {
    if (rosterCache) return rosterCache;
    var idx = identityIndex(), seen = {}, out = [];
    var jstByNorm = {};
    if (state.jst && state.jst.colleges) {
      Object.keys(state.jst.colleges).forEach(function (name) { jstByNorm[norm(name)] = state.jst.colleges[name]; });
    }
    (state.contacts || []).forEach(function (c) {
      var ident = idx[norm(c.college)];
      if (!ident || seen[ident.college_id]) return;
      seen[ident.college_id] = true;
      var jst = jstByNorm[norm(c.college)] || jstByNorm[norm(ident.college_name)] || null;
      if (!jst) (ident.variants || []).some(function (v) { jst = jstByNorm[norm(v)] || null; return !!jst; });
      out.push({ college: ident.college_name, district: ident.district || "", contact: c, jst: jst });
    });
    out.sort(function (a, b) { return a.college < b.college ? -1 : a.college > b.college ? 1 : 0; });
    rosterCache = out;
    return out;
  }
  function person(contact, role) {
    var r = ROLES[role];
    if (!r) return null;
    var name = clean(contact[r.name]), email = clean(contact[r.email]);
    if (!name && !email) return null;
    return { role: role, label: r.label, name: name, email: email };
  }
  // The recipients of one record: a row per college in scope, with the To and Cc
  // people the roster holds for its roles, the college's JST standing, and the gaps
  // (a To role with no address is a letter that cannot go).
  function recipients(rec) {
    var scope = rec.colleges && rec.colleges.length ? rec.colleges.map(norm) : null;
    var toRoles = rec.to_roles || [], ccRoles = rec.cc_roles || [];
    return roster().filter(function (r) {
      return !scope || scope.indexOf(norm(r.college)) >= 0;
    }).map(function (r) {
      var to = [], cc = [], gaps = [];
      toRoles.forEach(function (role) {
        var p = person(r.contact, role);
        if (p && p.email) to.push(p); else gaps.push((ROLES[role] ? ROLES[role].label : role) + (p && p.name ? " has no address in MAP" : " is not in MAP"));
      });
      ccRoles.forEach(function (role) {
        var p = person(r.contact, role);
        if (p && p.email) cc.push(p);
      });
      return { college: r.college, district: r.district, contact: r.contact, jst: r.jst, to: to, cc: cc, gaps: gaps };
    });
  }

  // ── merge fields ───────────────────────────────────────────────────────────
  function fieldsFor(rec, row) {
    var c = row ? row.contact : {};
    var toRole = (rec.to_roles || [])[0] || "ceo";
    var toPerson = row ? (row.to[0] || person(c, toRole)) : null;
    var f = {
      college: row ? row.college : "", district: row ? row.district : "",
      college_short: row ? (typeof window.cplCollegeShort === "function" ? window.cplCollegeShort(row.college) : row.college) : "",
      salutation: toPerson ? salutation(toPerson.name, toPerson.role || toRole) : "",
      recipient_name: toPerson ? toPerson.name : "",
      ceo_name: clean(c.ceo), ceo_email: clean(c.ceo_email), cio_name: clean(c.vpaa), cio_email: clean(c.vpaa_email),
      csso_name: clean(c.vpss), csso_email: clean(c.vpss_email), coordinator_name: clean(c.cpl_coordinator),
      landing_page: clean(c.landing_page_url),
      date: longToday(), sender: clean(rec.sender)
    };
    var j = row ? row.jst : null;
    if (j) {
      var p = pct(j.jst, j.vets);
      f.vets = fmtInt(j.vets); f.jst = fmtInt(j.jst);
      f.jst_pct = p == null ? "" : p + " percent";
      f.jst_standing = j.vets ? (j.star ? "which meets the 75 percent mark" : "which is " + p + " percent of the headcount, short of the 75 percent mark")
        : (j.jst > 0 ? "with no veteran headcount reported to MIS" : "");
    }
    if (state.jst) {
      var s = state.jst.statewide || {};
      f.statewide_vets = fmtInt(s.vets); f.statewide_jst = fmtInt(s.jst); f.star_colleges = fmtInt(s.star_colleges);
      f.jst_as_of = fmtDate(state.jst.scraped_at);
    }
    return f;
  }
  // merge(text, fields) -> { text, missing }: a field the roster or feed cannot fill
  // stays visible as [its name] so a reader sees the hole rather than a blank.
  function merge(text, f) {
    var missing = [];
    var out = String(text || "").replace(/\{([a-z_]+)\}/g, function (m, key) {
      if (Object.prototype.hasOwnProperty.call(f, key) && !blank(f[key])) return f[key];
      if (missing.indexOf(key) < 0) missing.push(key);
      return "[" + key + "]";
    });
    return { text: out, missing: missing };
  }
  function mergedFor(rec, row) {
    var f = fieldsFor(rec, row);
    var s = merge(rec.subject || "", f), b = merge(rec.body || "", f);
    return { subject: s.text, body: b.text, missing: s.missing.concat(b.missing.filter(function (k) { return s.missing.indexOf(k) < 0; })) };
  }
  function mailto(row, subject, body) {
    var to = row.to.map(function (p) { return p.email; }).join(",");
    var cc = row.cc.map(function (p) { return p.email; }).join(",");
    var addr = function (s) { return encodeURIComponent(s).replace(/%2C/g, ",").replace(/%40/g, "@"); };
    return "mailto:" + addr(to) +
      "?" + (cc ? "cc=" + addr(cc) + "&" : "") +
      "subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(String(body).replace(/\r?\n/g, "\r\n"));
  }
  function csvCell(v) { return "\"" + String(v == null ? "" : v).replace(/"/g, "\"\"") + "\""; }
  function csvFor(rec, rows) {
    var head = ["college", "to_name", "to_email", "cc_names", "cc_emails", "subject", "body", "gaps"];
    var lines = [head.join(",")];
    rows.forEach(function (row) {
      var m = mergedFor(rec, row);
      lines.push([row.college, row.to.map(function (p) { return p.name; }).join("; "), row.to.map(function (p) { return p.email; }).join("; "),
        row.cc.map(function (p) { return p.name; }).join("; "), row.cc.map(function (p) { return p.email; }).join("; "),
        m.subject, m.body, row.gaps.join("; ")].map(csvCell).join(","));
    });
    return lines.join("\r\n");
  }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 0);
  }
  function copyText(text, done) {
    var fallback = function () { done(false); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  // A Word file of the merged text (docx.min.js sits beside this file; loaded on demand).
  function ensureDocx(cb) {
    if (window.docx) { cb(); return; }
    if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") { window.CPL_TABS.loadScript("docx.min.js", "docx", cb); return; }
    var s = document.createElement("script");
    s.src = "docx.min.js"; s.onload = cb; s.onerror = cb;
    document.head.appendChild(s);
  }
  function docxFor(title, text, fileName) {
    ensureDocx(function () {
      var D = window.docx;
      if (!D) { say("The Word library did not load; copy the text instead.", true); render(); return; }
      var children = [new D.Paragraph({ children: [new D.TextRun({ text: title, bold: true, size: 28, font: "Calibri" })], spacing: { after: 240 } })];
      String(text || "").split(/\r?\n/).forEach(function (line) {
        children.push(new D.Paragraph({ children: line.trim() ? [new D.TextRun({ text: line, size: 22, font: "Calibri" })] : [], spacing: { after: 120 } }));
      });
      var doc = new D.Document({ sections: [{ properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } }, children: children }] });
      D.Packer.toBlob(doc).then(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = fileName;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 0);
      });
    });
  }

  // ── Claude's draft, through the writer ───────────────────────────────────
  // The system prompt: this tab's role line, then the writer's shared rules (the house
  // voice; the words: American spelling, the naming rule, the banned business words, the
  // funding vocabulary), then this tab's own facts rule and return format.
  var ROLE =
    "You draft communications for the CPL Initiative of the California Community Colleges Chancellor's Office, " +
    "written by the MAP team at Riverside Community College District on the Chancellor's Office's behalf. A member of " +
    "the team reads your draft, edits it, and decides whether to send it; nothing you write is sent by itself.";
  var FACTS =
    "Facts: use only the facts in the brief and the merge fields listed. Invent no figure, date, name or title. Where a " +
    "value belongs to one college or one person, write the merge field in braces exactly as listed, for example " +
    "{college} or {salutation}, rather than a literal, so the tab fills it for each recipient.";
  var FORMAT =
    "Return only the communication. For an email or a letter, the first line is \"Subject: \" followed by the subject " +
    "line, then a blank line, then the body, ending with the signature block as {sender}. For a memo, begin with the " +
    "TO, FROM, DATE and RE lines. For a MAP Team note, a flyer or a report, begin with the title on its own line.";
  var SYSTEM = W.system({ role: ROLE, extra: [FACTS, FORMAT] });
  function draftPrompt(rec) {
    var rows = recipients(rec);
    var sample = rows.length ? rows[0] : null;
    var f = fieldsFor(rec, sample);
    // An example value per field from the first college in scope, never an address:
    // the roster's emails stay in COBI and the mail client, and the model needs none.
    var fields = FIELDS.map(function (p) {
      var ex = /_email$/.test(p[0]) || blank(f[p[0]]) ? "" : " (for example " + f[p[0]] + ")";
      return "{" + p[0] + "}: " + p[1] + ex;
    });
    var who = (rec.to_roles || []).map(function (r) { return ROLES[r] ? ROLES[r].label : r; }).join(", ") || "(no To role chosen)";
    var cc = (rec.cc_roles || []).map(function (r) { return ROLES[r] ? ROLES[r].label : r; }).join(", ");
    var body = clean(rec.body) ? "The current draft, which you may revise or replace while keeping its facts and its asks:\n\n" + rec.body
      : "There is no draft yet. Write one from the title, the occasion and the note.";
    return "Title: " + (rec.title || "") + "\nKind: " + (TYPE[rec.comm_type] || rec.comm_type) +
      "\nAudience: " + (AUDIENCE[rec.audience] || rec.audience) + " (" + (AUDIENCE_GUIDE[rec.audience] || AUDIENCE_GUIDE.other) + ")" +
      "\nTo: " + who + (cc ? "\nCc: " + cc : "") +
      (rec.occasion ? "\nOccasion: " + rec.occasion : "") + (rec.subject ? "\nSubject line now: " + rec.subject : "") +
      (rec.note ? "\nNote from the team: " + rec.note : "") +
      "\nLength: " + (rec.comm_type === "report" ? "600 to 1,000 words" : rec.comm_type === "memo" ? "300 to 600 words" : "150 to 300 words") +
      "\n\nMerge fields available (write them in braces):\n" + fields.join("\n") +
      "\n\n" + body;
  }
  function draft(rec) {
    if (!W.proxyUrl()) { say(W.NO_PROXY, true); render(); return; }
    state.drafting = true; state.draft = null; render();
    W.draft(draftPrompt(rec), { system: SYSTEM, maxTokens: 4000, effort: "high" }).then(function (r) {
      var text = r.text, subject = null, m = /^Subject:\s*(.+)\n+/.exec(text);
      if (m) { subject = m[1].trim(); text = text.slice(m[0].length); }
      state.draft = { subject: subject, body: text, model: r.model, when: new Date().toISOString() };
      state.drafting = false; render();
    }).catch(function (e) {
      state.drafting = false;
      say("No draft: " + (e && e.message ? e.message : "the request failed") + ".", true); render();
    });
  }

  // ── the Library record ─────────────────────────────────────────────────────
  function seenFor(aud) {
    if (aud === "map_team" || aud === "co") return "team";
    if (aud === "public") return "public";
    return "colleges";
  }
  function postToLibrary(rec, by) {
    var link = PAGE + "#letters/" + rec.slug;
    var payload = {
      title: rec.title, kind: "document", occasion: rec.occasion || (TYPE[rec.comm_type] + " to " + (AUDIENCE[rec.audience] || rec.audience)),
      made_on: today(), status: rec.status === "final" ? "approved" : "draft", seen_by: seenFor(rec.audience),
      summary: rec.subject || null, made_by: rec.made_by || null,
      rebuild_from: "COBI Letters, Memos & Reports (cpl_comms " + rec.slug + ")", file_type: "txt",
      url: link, home: "web", updated_by: by
    };
    var p;
    if (rec.library_id) {
      p = write(LIBRARY_URL + "?id=eq." + encodeURIComponent(rec.library_id), { method: "PATCH", body: payload })
        .then(function () { return rec.library_id; });
    } else {
      payload.slug = "comm-" + rec.slug; payload.added_by = by; delete payload.updated_by;
      p = write(LIBRARY_URL, { method: "POST", body: payload }).then(function (saved) {
        var row = Array.isArray(saved) ? saved[0] : saved;
        if (!row || !row.id) throw new Error("the Library wrote no record");
        return write(TABLE_URL + "?id=eq." + encodeURIComponent(rec.id), { method: "PATCH", body: { library_id: row.id, updated_by: by } })
          .then(function () { return row.id; });
      });
    }
    return p.then(function () {
      say(rec.library_id ? "The Library record is up to date." : "Posted to the Library as a document that links back here.");
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  // ── matching ───────────────────────────────────────────────────────────────
  function matches(r) {
    if (state.type !== "all" && r.comm_type !== state.type) return false;
    if (state.status !== "all" && r.status !== state.status) return false;
    if (state.audience !== "all" && r.audience !== state.audience) return false;
    if (state.q.trim()) {
      var hay = [r.title, r.subject, r.body, r.occasion, r.note, r.made_by, TYPE[r.comm_type], AUDIENCE[r.audience], STATUS[r.status]].join(" ").toLowerCase();
      var words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  // ── CSS (tokens only; injected once) ───────────────────────────────────────
  function ensureCss() {
    if (document.getElementById("comms-css")) return;
    var s = document.createElement("style");
    s.id = "comms-css";
    s.textContent = [
      "#" + ROOT_ID + " { color: var(--text-body); font-size: .92rem; line-height: 1.5; }",
      "#" + ROOT_ID + " .cm-h { color: var(--text-strong); font-size: 1.25rem; margin: 0 0 4px; }",
      "#" + ROOT_ID + " h2.cm-h2 { color: var(--text-strong); font-size: 1rem; margin: 18px 0 6px; }",
      "#" + ROOT_ID + " .cm-lede { color: var(--text-muted); margin: 0 0 12px; max-width: var(--cpl-measure, none); }",
      // WCAG 2.2 target size (2.5.8): 24px each way at rest, so a short word like All
      // keeps a 24px box, and the underline marks the control without color alone.
      "#" + ROOT_ID + " .cm-btn { display: inline-block; border: 0; background: none; color: var(--cobalt); font: inherit; font-weight: 600; padding: 2px 0; " +
        "min-height: 24px; min-width: 24px; line-height: 20px; text-align: center; box-sizing: border-box; " +
        "text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; cursor: pointer; margin-right: 18px; }",
      "#" + ROOT_ID + " .cm-btn:hover { text-decoration-thickness: 2px; }",
      "#" + ROOT_ID + " .cm-btn:focus-visible, #" + ROOT_ID + " input:focus-visible, #" + ROOT_ID + " select:focus-visible, #" + ROOT_ID + " textarea:focus-visible, #" + ROOT_ID + " a:focus-visible " +
        "{ outline: 2px solid var(--focus-ring); outline-offset: 2px; }",
      "#" + ROOT_ID + " .cm-btn[aria-pressed=\"true\"] { color: var(--text-strong); text-decoration-thickness: 2px; }",
      "#" + ROOT_ID + " .cm-btn[disabled] { color: var(--text-muted); cursor: default; text-decoration: none; }",
      "#" + ROOT_ID + " .cm-row { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; margin: 6px 0; }",
      "#" + ROOT_ID + " .cm-q { flex: 1 1 260px; max-width: 420px; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; " +
        "background: var(--surface-opaque); color: var(--text-strong); font: inherit; min-height: 24px; }",
      "#" + ROOT_ID + " .cm-label { color: var(--text-muted); font-size: .8rem; }",
      "#" + ROOT_ID + " .cm-row select { min-height: 24px; padding: 3px 6px; border: 1px solid var(--border-strong); border-radius: 6px; " +
        "background: var(--surface-opaque); color: var(--text-strong); font: inherit; }",
      "#" + ROOT_ID + " .cm-msg { margin: 8px 0; padding: 6px 10px; border-left: 3px solid var(--cobalt); background: var(--surface-subtle); }",
      "#" + ROOT_ID + " .cm-msg.err { border-left-color: var(--crimson); }",
      "#" + ROOT_ID + " .cm-item { border: 1px solid var(--border); border-radius: 8px; background: var(--surface-opaque); padding: 10px 14px; margin: 8px 0; }",
      "#" + ROOT_ID + " .cm-item.open { border-color: var(--border-strong); }",
      "#" + ROOT_ID + " .cm-title { font-weight: 600; color: var(--text-strong); font-size: 1rem; margin: 0; }",
      "#" + ROOT_ID + " .cm-chip { display: inline-block; border-radius: 10px; font-size: .7rem; font-weight: 600; padding: 2px 8px; margin: 0 6px 0 0; " +
        "border: 1px solid var(--border-strong); color: var(--text-body); background: var(--surface-subtle); }",
      "#" + ROOT_ID + " .cm-chip.final { border-color: var(--hunter); color: var(--hunter); }",
      "#" + ROOT_ID + " .cm-chip.tabled { color: var(--text-muted); }",
      "#" + ROOT_ID + " .cm-meta { color: var(--text-muted); font-size: .8rem; margin: 2px 0 0; }",
      "#" + ROOT_ID + " .cm-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px 16px; margin: 10px 0; }",
      "#" + ROOT_ID + " .cm-form label, #" + ROOT_ID + " .cm-field label { display: block; font-size: .78rem; color: var(--text-muted); margin-bottom: 2px; }",
      "#" + ROOT_ID + " .cm-form input, #" + ROOT_ID + " .cm-form select, #" + ROOT_ID + " .cm-field input, #" + ROOT_ID + " .cm-field textarea " +
        "{ width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-opaque); " +
        "color: var(--text-strong); font: inherit; min-height: 24px; }",
      "#" + ROOT_ID + " .cm-field { margin: 8px 0; }",
      "#" + ROOT_ID + " .cm-field textarea { min-height: 220px; line-height: 1.5; }",
      "#" + ROOT_ID + " .cm-roles { display: flex; flex-wrap: wrap; gap: 4px 14px; }",
      "#" + ROOT_ID + " .cm-roles label { display: inline-flex; gap: 5px; align-items: center; font-size: .85rem; color: var(--text-body); }",
      "#" + ROOT_ID + " .cm-fields { font-size: .8rem; color: var(--text-muted); margin: 4px 0 0; }",
      "#" + ROOT_ID + " .cm-fields code { color: var(--text-body); }",
      "#" + ROOT_ID + " .cm-draft { border: 1px solid var(--border); border-left: 3px solid var(--violet); border-radius: 6px; padding: 8px 12px; margin: 8px 0; white-space: pre-wrap; background: var(--surface-subtle); }",
      "#" + ROOT_ID + " .cm-wrap { overflow-x: auto; margin: 6px 0; }",
      "#" + ROOT_ID + " table.cm-t { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: .82rem; background: var(--surface-opaque); }",
      // The header pair holds in both themes: --seal-blue is the one fill the dark
      // palette keeps, and --on-seal-blue is its text in both.
      "#" + ROOT_ID + " table.cm-t th { position: sticky; top: 0; text-align: left; background: var(--seal-blue); color: var(--on-seal-blue); padding: 5px 8px; font-weight: 600; }",
      "#" + ROOT_ID + " table.cm-t td { border-top: 1px solid var(--border); padding: 5px 8px; vertical-align: top; overflow-wrap: anywhere; }",
      "#" + ROOT_ID + " table.cm-t td.n { text-align: right; white-space: nowrap; }",
      "#" + ROOT_ID + " table.cm-t .cm-btn { white-space: nowrap; margin-right: 14px; }",
      "#" + ROOT_ID + " .cm-gap { color: var(--mustard-text); }",
      "#" + ROOT_ID + " .cm-star { color: var(--hunter); }",
      "#" + ROOT_ID + " .cm-preview { border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; background: var(--surface-opaque); white-space: pre-wrap; margin: 8px 0; max-width: var(--cpl-measure, none); }",
      "#" + ROOT_ID + " .cm-preview .subj { font-weight: 600; color: var(--text-strong); }",
      "#" + ROOT_ID + " .cm-missing { color: var(--mustard-text); font-size: .8rem; }",
      "#" + ROOT_ID + " details.cm-earlier { margin: 20px 0 0; border-top: 1px solid var(--border); padding-top: 10px; }",
      "#" + ROOT_ID + " details.cm-earlier summary { cursor: pointer; color: var(--cobalt); text-decoration: underline; text-underline-offset: 3px; font-weight: 600; min-height: 24px; }",
      "#" + ROOT_ID + " details.cm-earlier iframe { width: 100%; height: 1200px; border: 1px solid var(--border); border-radius: 6px; background: var(--surface-opaque); margin-top: 8px; }",
      "#" + ROOT_ID + " .cm-how { margin: 24px 0 0; color: var(--text-muted); font-size: .85rem; max-width: var(--cpl-measure, none); }",
      "@media (prefers-reduced-motion: reduce) { #" + ROOT_ID + " * { transition: none; } }",
      // Below 560px the recipients table keeps its natural width and scrolls inside its
      // own region (the wrap), so no column collapses a control into a sliver and the
      // body never scrolls sideways.
      "@media (max-width: 560px) { #" + ROOT_ID + " .cm-form { grid-template-columns: 1fr; } #" + ROOT_ID + " .cm-btn { margin-right: 14px; } " +
        "#" + ROOT_ID + " table.cm-t { min-width: 640px; } }"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ── rendering ──────────────────────────────────────────────────────────────
  function btn(attrs, text, pressed) {
    var type = /type="submit"/.test(attrs) ? "" : ' type="button"';
    return "<button" + type + ' class="cm-btn"' + attrs + (pressed != null ? ' aria-pressed="' + (pressed ? "true" : "false") + '"' : "") + ">" + text + "</button>";
  }
  function chipsRow(label, items, current, key) {
    return '<div class="cm-row" role="group" aria-label="' + esc(label) + '"><span class="cm-label">' + esc(label) + "</span>" +
      items.map(function (it) { return btn(' data-' + key + '="' + it[0] + '"', esc(it[1]), current === it[0]); }).join("") + "</div>";
  }
  function headHtml() {
    return '<h2 class="cm-h">Letters, Memos &amp; Reports</h2>' +
      '<p class="cm-lede">One register for every communication the Initiative sends: an email to the CEOs, a Chancellor\'s Office memo, a MAP Team note, a report, a flyer. ' +
      "The recipients come from MAP's roster by role, the figures from the daily feeds, and the words from you, with Claude's draft when you ask. " +
      "COBI sends nothing: each recipient row gives you the merged text, a mail link that opens your own mail client, and a CSV for a mail merge.</p>";
  }
  function controlsHtml() {
    var html = '<section aria-label="Find a communication">' +
      '<div class="cm-row"><label class="cm-label" for="cm-q">Search</label><input id="cm-q" class="cm-q" type="search" value="' + esc(state.q) + '" placeholder="A word from the title, subject or body" autocomplete="off">' +
      btn(' id="cm-new"', "New communication") + "</div>" +
      chipsRow("Kind", [["all", "All"]].concat(TYPE_ORDER.map(function (k) { return [k, TYPE[k]]; })), state.type, "type") +
      chipsRow("Status", [["all", "All"]].concat(STATUS_ORDER.map(function (k) { return [k, STATUS[k]]; })), state.status, "status") +
      '<div class="cm-row"><label class="cm-label" for="cm-aud">Audience</label><select id="cm-aud"><option value="all"' + (state.audience === "all" ? " selected" : "") + ">All audiences</option>" +
      AUDIENCE_ORDER.map(function (k) { return '<option value="' + k + '"' + (state.audience === k ? " selected" : "") + ">" + esc(AUDIENCE[k]) + "</option>"; }).join("") + "</select></div>" +
      '<p class="cm-meta" role="status" id="cm-count">' + esc(countText()) + "</p></section>";
    return html;
  }
  function itemHtml(r) {
    var open = state.open === r.id;
    var html = '<article class="cm-item' + (open ? " open" : "") + '" id="cm-i-' + esc(r.id) + '">' +
      '<p class="cm-title" id="cm-t-' + esc(r.id) + '">' + esc(r.title) + "</p>" +
      '<p class="cm-meta"><span class="cm-chip">' + esc(TYPE[r.comm_type] || r.comm_type) + '</span><span class="cm-chip ' + esc(r.status) + '">' + esc(STATUS[r.status] || r.status) + "</span>" +
      '<span class="cm-chip">' + esc(AUDIENCE[r.audience] || r.audience) + "</span>" +
      (r.occasion ? esc(r.occasion) + " · " : "") + (r.subject ? "Subject: " + esc(r.subject) + " · " : "") +
      "Updated " + esc(fmtDate(r.updated_at)) + (r.updated_by || r.added_by ? " by " + esc(r.updated_by || r.added_by) : "") +
      (r.library_id ? " · In the Library" : "") + "</p>" +
      '<div class="cm-row">' + btn(' data-open="' + esc(r.id) + '" aria-expanded="' + (open ? "true" : "false") + '" aria-controls="cm-d-' + esc(r.id) + '"', open ? "Close" : "Open") +
      btn(' data-copylink="' + esc(r.slug) + '"', "Copy link") + "</div>";
    if (open) html += '<div id="cm-d-' + esc(r.id) + '">' + composerHtml(r) + recipientsHtml(r) + "</div>";
    return html + "</article>";
  }
  function roleBoxes(name, chosen) {
    return '<div class="cm-roles" role="group" aria-label="' + esc(name === "to" ? "To" : "Cc") + '">' + ROLE_ORDER.map(function (k) {
      return '<label><input type="checkbox" name="cm-' + name + '" value="' + k + '"' + (chosen.indexOf(k) >= 0 ? " checked" : "") + ">" + esc(ROLES[k].label) + "</label>";
    }).join("") + "</div>";
  }
  function options(map, order, current) {
    return order.map(function (k) { return '<option value="' + k + '"' + (current === k ? " selected" : "") + ">" + esc(map[k]) + "</option>"; }).join("");
  }
  function composerHtml(r) {
    var f = state.form && state.form.id === r.id ? state.form : r;
    var isNew = !r.id;
    var html = '<form id="cm-f-' + esc(r.id || "new") + '" data-editform="' + esc(r.id || "new") + '">' +
      '<div class="cm-form">' +
      '<label>Title<input id="ce-title" value="' + esc(f.title) + '" required></label>' +
      '<label>Kind<select id="ce-type">' + options(TYPE, TYPE_ORDER, f.comm_type) + "</select></label>" +
      '<label>Audience<select id="ce-aud">' + options(AUDIENCE, AUDIENCE_ORDER, f.audience) + "</select></label>" +
      '<label>Status<select id="ce-status">' + options(STATUS, STATUS_ORDER, f.status) + "</select></label>" +
      '<label>Occasion<input id="ce-occasion" value="' + esc(f.occasion || "") + '" placeholder="What prompted it"></label>' +
      '<label>Sent on<input id="ce-sent" type="date" value="' + esc(f.sent_on || "") + '"></label>' +
      '<label>Signature block ({sender})<input id="ce-sender" value="' + esc(f.sender || "") + '" placeholder="Name, title, office"></label>' +
      '<label>Your name<input id="ce-by" value="' + esc(storedAuthor()) + '" placeholder="So the history says who changed it"></label>' +
      "</div>" +
      '<div class="cm-field"><label>To (by MAP roster role)</label>' + roleBoxes("to", f.to_roles || []) + "</div>" +
      '<div class="cm-field"><label>Cc (by MAP roster role)</label>' + roleBoxes("cc", f.cc_roles || []) +
      '<input id="ce-ccnote" value="' + esc(f.cc_note || "") + '" placeholder="A cc that is not a roster role (a named office, a partner)" style="margin-top:6px"></div>' +
      '<div class="cm-field"><label for="ce-colleges">Colleges (blank = every college in the roster; else names, one per line)</label>' +
      '<textarea id="ce-colleges" style="min-height:60px">' + esc((f.colleges || []).join("\n")) + "</textarea></div>" +
      '<div class="cm-field"><label for="ce-subject">Subject line (email), RE line (memo), or title line</label><input id="ce-subject" value="' + esc(f.subject || "") + '"></div>' +
      '<div class="cm-field"><label for="ce-body">Body, with merge fields in braces</label><textarea id="ce-body">' + esc(f.body || "") + "</textarea>" +
      '<p class="cm-fields">Fields: ' + FIELDS.map(function (p) { return "<code>{" + p[0] + "}</code>"; }).join(" ") + "</p></div>" +
      '<div class="cm-field"><label for="ce-note">Note to the team (never sent)</label><input id="ce-note" value="' + esc(f.note || "") + '"></div>' +
      '<div class="cm-row">' + btn(' type="submit"', isNew ? "Save as draft" : "Save") +
      (isNew ? "" : btn(' data-draft="' + esc(r.id) + '"' + (state.drafting ? " disabled" : ""), state.drafting ? "Claude is drafting" : (clean(r.body) ? "Ask Claude to revise" : "Ask Claude for a draft"))) +
      (isNew ? "" : btn(' data-library="' + esc(r.id) + '"', r.library_id ? "Update the Library record" : "Post to the Library")) +
      (isNew ? btn(' data-cancelnew="1"', "Cancel") : btn(' data-retire="' + esc(r.id) + '"', "Retire")) + "</div>";
    if (state.retireAsk && state.open === r.id) {
      html += '<div class="cm-msg">Retire this record? It leaves the list and the history keeps it. ' +
        btn(' data-retireyes="' + esc(r.id) + '"', "Yes, retire it") + btn(' data-retireno="1"', "No") + "</div>";
    }
    if (state.draft && state.open === r.id) {
      html += '<h2 class="cm-h2">Claude\'s draft</h2><p class="cm-meta">Drafted ' + esc(fmtDate(state.draft.when)) + " with " + esc(state.draft.model) +
        ". It is a draft until you use it and save; the fields stay in braces so each recipient gets their own.</p>" +
        '<div class="cm-draft" id="cm-draft">' + (state.draft.subject ? "Subject: " + esc(state.draft.subject) + "\n\n" : "") + esc(state.draft.body) + "</div>" +
        '<div class="cm-row">' + btn(' data-usedraft="1"', "Use this draft") + btn(' data-dropdraft="1"', "Set it aside") + "</div>";
    }
    return html + "</form>";
  }
  function recipientsHtml(r) {
    if (!r.id) return "";
    var rows = recipients(r);
    var gaps = rows.filter(function (x) { return x.gaps.length; }).length;
    var ready = rows.length - gaps;
    var roster_as_of = (state.contacts || []).reduce(function (m, c) { return c.synced_at > m ? c.synced_at : m; }, "");
    var html = '<h2 class="cm-h2">Recipients</h2>' +
      '<p class="cm-meta">' + rows.length + (rows.length === 1 ? " college" : " colleges") + " in scope; " + ready + " with every To address, " + gaps + " with a gap MAP cannot fill. " +
      "Roster synced " + esc(fmtDate(roster_as_of)) + (state.jst ? "; JST figures read " + esc(fmtDate(state.jst.scraped_at)) + " from the CPL dashboard feed." : "; the JST feed is not loaded.") + "</p>" +
      '<div class="cm-row">' + btn(' data-csv="' + esc(r.id) + '"', "Download the recipients as CSV (for a mail merge)") +
      btn(' data-docx="' + esc(r.id) + '"', "Download the body as Word") + "</div>";
    if (!rows.length) return html + '<p class="cm-meta">No college is in scope. Choose a To role and leave the colleges box blank for every college.</p>';
    html += '<div class="cm-wrap" role="region" aria-label="Recipients by college"><table class="cm-t"><colgroup><col style="width:22%"><col style="width:22%"><col style="width:24%"><col style="width:12%"><col style="width:20%"></colgroup>' +
      '<thead><tr><th scope="col">College</th><th scope="col">To</th><th scope="col">Cc</th><th scope="col">JSTs / veterans</th><th scope="col">Actions</th></tr></thead><tbody>';
    rows.forEach(function (row, i) {
      var j = row.jst, p = j ? pct(j.jst, j.vets) : null;
      html += "<tr><th scope=\"row\" style=\"font-weight:500\">" + esc(row.college) + "</th>" +
        "<td>" + (row.to.length ? row.to.map(function (q) { return esc(q.name) + "<br>" + esc(q.email); }).join("<br>") : "") +
        (row.gaps.length ? '<span class="cm-gap">' + esc(row.gaps.join("; ")) + "</span>" : "") + "</td>" +
        "<td>" + row.cc.map(function (q) { return esc(q.name) + " (" + esc(q.label.replace(/ \(.*$/, "")) + ")<br>" + esc(q.email); }).join("<br>") + "</td>" +
        '<td class="n">' + (j ? esc(fmtInt(j.jst)) + " / " + esc(fmtInt(j.vets)) + (p == null ? "" : " (" + p + "%)") + (j.star ? ' <span class="cm-star">at 75%</span>' : "") : "not in the feed") + "</td>" +
        "<td>" + btn(' data-preview="' + i + '"', state.preview === i ? "Hide" : "Preview") + btn(' data-copy="' + i + '"', "Copy") +
        (row.to.length ? '<a class="cm-btn" href="' + esc(mailto(row, mergedFor(r, row).subject, mergedFor(r, row).body)) + '">Open in mail</a>' : "") + "</td></tr>";
      if (state.preview === i) {
        var m = mergedFor(r, row);
        html += '<tr><td colspan="5"><div class="cm-preview" id="cm-pv-' + i + '">' + (m.subject ? '<span class="subj">Subject: ' + esc(m.subject) + "</span>\n\n" : "") + esc(m.body) + "</div>" +
          (m.missing.length ? '<p class="cm-missing">Not filled for this college: ' + esc(m.missing.map(function (k) { return "{" + k + "}"; }).join(", ")) + ". The field shows in brackets above.</p>" : "") + "</td></tr>";
      }
    });
    return html + "</tbody></table></div>";
  }
  function earlierHtml() {
    return '<details class="cm-earlier" id="cm-earlier"' + (state.curator ? " open" : "") + '><summary>Earlier: the May 2026 Revise support-letter campaign (the budget-support curator)</summary>' +
      "<p class=\"cm-meta\">The curator this tab was built for: it edits the shared letter blocks that <code>generate-letter</code> assembles into per-invitee Word files, behind its own passcode, on the knowledge base's Supabase project. It loads only when opened.</p>" +
      (state.curator ? '<iframe src="' + CURATOR_SRC + '" title="Letter Curator" loading="lazy"></iframe>' : "") + "</details>";
  }
  function howHtml() {
    return '<footer class="cm-how" aria-labelledby="cm-how-h"><h2 class="cm-h2" id="cm-how-h">How this tab works</h2>' +
      "<p>A record holds the recipients by role, never by address: MAP's roster is read live each time, so the CEO named today is the one named in the letter, and nothing here holds a second copy of anyone's address. " +
      "The body keeps its merge fields in braces; Preview, Copy, the mail link and the CSV fill them per college from the roster and the daily JST feed.</p>" +
      "<p>Claude drafts on request through the report proxy, under the Chancellor's Office house voice and the naming and funding rules, and its draft stays beside the body until you use it. " +
      "Post to the Library adds a document record that links back to this register. Nothing is deleted: Retire sets a date and the history keeps every earlier version.</p></footer>";
  }
  var painted = { form: null };
  // The list and its count alone, for a keystroke in the search box: a full repaint
  // would replace the box under the caret.
  function listHtml() {
    var list = "";
    if (state.open === "new") list += '<article class="cm-item open"><p class="cm-title">New communication</p>' + composerHtml({ id: "", title: "", comm_type: "email", audience: "ceos", status: "draft", to_roles: ["ceo"], cc_roles: [], body: "" }) + "</article>";
    var shown = (state.rows || []).filter(matches);
    return list + (shown.map(itemHtml).join("") || '<p class="cm-meta">Nothing matches. Clear the search or the filters, or start a new communication.</p>');
  }
  function countText() {
    var rows = state.rows || [];
    var drafts = rows.filter(function (r) { return r.status === "draft"; }).length;
    var shown = rows.filter(matches);
    return rows.length + (rows.length === 1 ? " communication" : " communications") + ", " + drafts + " in draft" +
      (shown.length !== rows.length ? "; showing " + shown.length + " of " + rows.length : "");
  }
  function renderList() {
    var list = document.getElementById("cm-list"), count = document.getElementById("cm-count");
    if (!list || !count) { render(); return; }
    list.innerHTML = listHtml();
    count.textContent = countText();
  }
  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    ensureCss();
    if (!teamPhrase()) {
      root.innerHTML = headHtml();
      if (window.CPL_TEAM_PHRASE && typeof window.CPL_TEAM_PHRASE.lockedBanner === "function") {
        root.appendChild(window.CPL_TEAM_PHRASE.lockedBanner({ what: "The register" }));
      } else {
        var p = document.createElement("p"); p.className = "cm-meta";
        p.textContent = "The register stays hidden until you unlock with the team phrase (the About menu in the header).";
        root.appendChild(p);
      }
      root.insertAdjacentHTML("beforeend", earlierHtml());
      return;
    }
    if (state.loading) { root.innerHTML = headHtml() + '<p class="cm-meta" role="status">Reading the register, the roster and the JST feed.</p>'; return; }
    if (state.error) { root.innerHTML = headHtml() + '<div class="cm-msg err" role="alert">' + esc(state.error) + "</div>" + earlierHtml(); return; }
    if (!state.rows) { root.innerHTML = headHtml(); return; }
    // What was typed into an open form survives a repaint (a filter click, a draft arriving).
    var typed = {};
    Array.prototype.forEach.call(root.querySelectorAll("input[id^='ce-'],select[id^='ce-'],textarea[id^='ce-']"), function (n) { typed[n.id] = n.value; });
    var checked = {};
    Array.prototype.forEach.call(root.querySelectorAll("input[name='cm-to'],input[name='cm-cc']"), function (n) { checked[n.name + ":" + n.value] = n.checked; });
    var sameForm = painted.form === (state.open || "none");
    var focusId = document.activeElement && document.activeElement.id;
    var msg = state.message ? '<div class="cm-msg' + (state.msgErr ? " err" : "") + '" role="' + (state.msgErr ? "alert" : "status") + '">' + esc(state.message) + "</div>" : "";
    root.innerHTML = headHtml() + msg + controlsHtml() + '<div id="cm-list">' + listHtml() + "</div>" + earlierHtml() + howHtml();
    if (sameForm) {
      Object.keys(typed).forEach(function (id) { var n = document.getElementById(id); if (n && n.id !== "ce-by") n.value = typed[id]; });
      Array.prototype.forEach.call(root.querySelectorAll("input[name='cm-to'],input[name='cm-cc']"), function (n) {
        var k = n.name + ":" + n.value; if (Object.prototype.hasOwnProperty.call(checked, k)) n.checked = checked[k];
      });
    }
    painted.form = state.open || "none";
    if (focusId) { var again = document.getElementById(focusId); if (again && again.focus) again.focus(); }
  }

  // ── reading the form ───────────────────────────────────────────────────────
  function readForm() {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    var roles = function (name) {
      return Array.prototype.filter.call(document.querySelectorAll("input[name='cm-" + name + "']"), function (n) { return n.checked; }).map(function (n) { return n.value; });
    };
    var colleges = g("ce-colleges").split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      title: g("ce-title"), comm_type: g("ce-type") || "email", audience: g("ce-aud") || "other", status: g("ce-status") || "draft",
      occasion: g("ce-occasion") || null, sent_on: g("ce-sent") || null, sender: g("ce-sender") || null, by: g("ce-by"),
      to_roles: roles("to"), cc_roles: roles("cc"), cc_note: g("ce-ccnote") || null, colleges: colleges.length ? colleges : null,
      subject: g("ce-subject") || null, body: (document.getElementById("ce-body") || {}).value || "", note: g("ce-note") || null
    };
  }
  function submitForm(id) {
    var f = readForm();
    if (!f.title) { say("Add a title.", true); render(); return; }
    if (!f.by) { say("Add your name, so the history says who changed it.", true); render(); return; }
    rememberAuthor(f.by);
    var body = { title: f.title, comm_type: f.comm_type, audience: f.audience, status: f.status, occasion: f.occasion, sent_on: f.sent_on,
      sender: f.sender, to_roles: f.to_roles, cc_roles: f.cc_roles, cc_note: f.cc_note, colleges: f.colleges, subject: f.subject, body: f.body, note: f.note };
    var p;
    if (id === "new") {
      body.slug = slugFor(f.title); body.added_by = f.by; body.made_by = f.by;
      p = write(TABLE_URL, { method: "POST", body: body }).then(function (saved) {
        var row = Array.isArray(saved) ? saved[0] : saved;
        state.open = row && row.id ? row.id : null;
        if (row && row.slug && window.history && window.history.replaceState) {
          try { window.history.replaceState(null, "", "#letters/" + row.slug); } catch (e) { /* file:// */ }
        }
        say("Saved as a draft.");
      });
    } else {
      body.updated_by = f.by;
      p = write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: body }).then(function () { say("Saved. The earlier version is in the history."); });
    }
    p.then(function () { state.form = null; state.retireAsk = false; rosterCache = null; return load(); })
      .catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }
  function retire(id) {
    var by = (document.getElementById("ce-by") || {}).value || storedAuthor();
    if (!by) { say("Add your name, so the history says who retired it.", true); render(); return; }
    rememberAuthor(by);
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: { retired_at: new Date().toISOString(), updated_by: by } }).then(function () {
      say("Retired. The record left the list, and the history keeps it.");
      state.open = null; state.retireAsk = false; state.preview = null; state.draft = null;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }
  function useDraft() {
    if (!state.draft) return;
    var b = document.getElementById("ce-body"), s = document.getElementById("ce-subject");
    if (b) b.value = state.draft.body;
    if (s && state.draft.subject) s.value = state.draft.subject;
    state.draft = null;
    say("The draft is in the body. Read it, edit it, and save.");
    render();
  }
  function openRecord(id) {
    state.open = id; state.preview = null; state.draft = null; state.retireAsk = false; state.form = null;
    var r = byId(id);
    if (r && window.history && window.history.replaceState) {
      try { window.history.replaceState(null, "", "#letters/" + r.slug); } catch (e) { /* file:// */ }
    }
  }
  function routeFromHash() {
    var m = /^#letters\/([a-z0-9-]+)/.exec(window.location.hash || "");
    if (m && state.rows) { var r = bySlug(m[1]); if (r) { state.open = r.id; } }
  }
  function recordFromForm(id) {
    // The record as the open form now reads it, so a draft and a preview follow unsaved edits.
    var r = byId(id);
    if (!r) return null;
    var f = readForm();
    var out = {};
    for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) out[k] = r[k];
    ["title", "comm_type", "audience", "status", "occasion", "sender", "to_roles", "cc_roles", "cc_note", "colleges", "subject", "body", "note"].forEach(function (k) { out[k] = f[k]; });
    return out;
  }

  // ── events (delegated on the root, wired once) ─────────────────────────────
  function wire(root) {
    if (state.wired) return;
    state.wired = true;
    root.addEventListener("input", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === "cm-q") { state.q = t.value; renderList(); }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === "cm-aud") { state.audience = t.value; render(); }
    });
    root.addEventListener("toggle", function (e) {
      var t = e.target;
      if (t && t.id === "cm-earlier") { state.curator = !!t.open; if (state.curator && !t.querySelector("iframe")) render(); }
    }, true);
    root.addEventListener("submit", function (e) {
      var f = e.target && e.target.closest ? e.target.closest("form[data-editform]") : null;
      if (!f) return;
      e.preventDefault();
      submitForm(f.getAttribute("data-editform"));
    });
    root.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button[data-type],button[data-status],button[data-open],button[data-copylink],button[data-draft],button[data-library],button[data-retire],button[data-retireyes],button[data-retireno],button[data-usedraft],button[data-dropdraft],button[data-preview],button[data-copy],button[data-csv],button[data-docx],button[data-cancelnew],#cm-new") : null;
      if (!b) return;
      var d = b.dataset || {};
      if (b.id === "cm-new") { state.open = "new"; state.draft = null; state.preview = null; state.message = ""; render(); return; }
      if (d.type) { state.type = d.type; render(); return; }
      if (d.status) { state.status = d.status; render(); return; }
      if (d.cancelnew) { state.open = null; render(); return; }
      if (d.open) { if (state.open === d.open) { state.open = null; state.preview = null; state.draft = null; } else openRecord(d.open); state.message = ""; render(); return; }
      if (d.copylink) {
        var link = PAGE + "#letters/" + d.copylink;
        copyText(link, function (ok) { say(ok ? "Link copied: " + link : "Copy this link: " + link); render(); });
        return;
      }
      if (d.draft) { var rec = recordFromForm(d.draft); if (rec) draft(rec); return; }
      if (d.library) {
        var by = (document.getElementById("ce-by") || {}).value || storedAuthor();
        if (!by) { say("Add your name, so the Library record says who posted it.", true); render(); return; }
        rememberAuthor(by);
        var r0 = byId(d.library); if (r0) postToLibrary(r0, by);
        return;
      }
      if (d.retire) { state.retireAsk = true; render(); return; }
      if (d.retireno) { state.retireAsk = false; render(); return; }
      if (d.retireyes) { retire(d.retireyes); return; }
      if (d.usedraft) { useDraft(); return; }
      if (d.dropdraft) { state.draft = null; render(); return; }
      if (d.preview != null) { var i = +d.preview; state.preview = state.preview === i ? null : i; render(); return; }
      if (d.copy != null) {
        var rec2 = recordFromForm(state.open) || byId(state.open);
        var row = rec2 ? recipients(rec2)[+d.copy] : null;
        if (!row) return;
        var m = mergedFor(rec2, row);
        copyText((m.subject ? "Subject: " + m.subject + "\n\n" : "") + m.body, function (ok) {
          say(ok ? "Copied the text for " + row.college + "." : "The clipboard is not available here; open Preview and select the text."); render();
        });
        return;
      }
      if (d.csv) {
        var rec3 = recordFromForm(d.csv) || byId(d.csv);
        if (!rec3) return;
        download(rec3.slug + "_recipients_" + today() + ".csv", csvFor(rec3, recipients(rec3)), "text/csv");
        return;
      }
      if (d.docx) {
        var rec4 = recordFromForm(d.docx) || byId(d.docx);
        if (!rec4) return;
        var rows4 = recipients(rec4);
        var m4 = rows4.length && state.preview != null && rows4[state.preview] ? mergedFor(rec4, rows4[state.preview]) : { subject: rec4.subject || "", body: rec4.body || "" };
        docxFor(rec4.title, (m4.subject ? m4.subject + "\n\n" : "") + m4.body, rec4.slug + "_" + today() + ".docx");
        return;
      }
    });
    window.addEventListener("hashchange", function () {
      if (/^#letters\//.test(window.location.hash || "")) { routeFromHash(); render(); }
    });
  }

  function activate() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return Promise.resolve();
    ensureCss();
    wire(root);
    return load();
  }

  window.CPL_COMMS = {
    activate: activate,
    _salutation: salutation, _merge: merge, _mailto: mailto, _csv: csvFor, _pct: pct, _slug: slugFor,
    _recipients: recipients, _fields: fieldsFor, _state: state, _prompt: draftPrompt, _system: SYSTEM, _model: W.MODEL, _writer: W
  };
})();
