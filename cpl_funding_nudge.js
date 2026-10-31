/* cpl_funding_nudge.js — Nudge: the reviewer's list of institutions still missing a
 * participation confirmation or a noncredit attestation, with one recipient each.
 *
 * Sam, 2026-10-31: "add a Nudge button at the top of the college rows internal
 * funding tab that allows me to send nudge emails to all the colleges who have not
 * yet requested participation or attested to the NC lead? I realize this would open
 * a gazzilion email messages to send, so advise ... Maybe we should set up the
 * ability for you to send automatically once we get that set up with RCCD IT."
 * The advice he took: a preview first (who, what is missing, the deadline), sent as
 * one mail merge from a CSV or one BCC draft; COBI sending as map@rccd.edu waits on
 * the Microsoft 365 path (Sheet 146 card 3) and Governance.
 *
 * WHO RECEIVES IT (Sam, ~20:45Z): "the CPL Coordinator or if there is none, the
 * Ambassador or if there is none, initiator, then VPAA, then whomever we have on
 * file", and then the CEO. "Ambassador" reads as MAP's primary CPL contact, the one
 * person MAP routes student requests to (colleges average 5.8 active Ambassadors).
 * The preview names the step that chose each recipient.
 *
 * WHY A MODULE OF ITS OWN. cpl_funding.js also renders the public funding page, and
 * its PII guard (tests/cpl_funding_equity.test.js) keeps every directory address out
 * of it. This file reads the addresses, from map_college_contacts under the
 * reviewer's own session, and the Ambassadors and Initiators from map_college_users the same way
 * (RLS answers anyone else with nothing), and cpl_funding.js
 * loads it only when a signed-in reviewer presses Nudge on the internal tab. It
 * sends nothing and writes nothing: the reviewer's mail program sends.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  // The cascade, in Sam's order. Each step names the directory column holding the
  // name; the address is the same column with _email.
  var STEPS = [
    { col: "cpl_coordinator", label: "CPL Coordinator" },
    { col: "primary_contact", label: "MAP primary CPL contact" },
    { col: "lead_initiator", label: "Lead Initiator" },
    { col: "vpaa", label: "VPAA" },
    { col: "ceo", label: "CEO" }
  ];
  // THE ROLES TO SEND TO (Sam, 2026-10-31: "would also be nice to be able to select from a
  // multi-select list of recipient roles (CEOs, VPs, Primary Contacts (default), deans/directors,
  // ambassadors, initiators)"). Primary contact is the cascade above, one person a college, and
  // stays checked by default; each other role adds everyone the directory or MAP's user list holds
  // for it. Deans and directors wait on the weekly contacts harvest, so they show and cannot be
  // checked yet.
  var ROLES = [
    { id: "primary", label: "Primary contact", on: true,
      hint: "one a college: CPL Coordinator, else MAP primary CPL contact, Lead Initiator, VPAA, CEO" },
    { id: "ceo", label: "CEOs", cols: [{ col: "ceo", label: "CEO" }] },
    { id: "vp", label: "VPs", hint: "Academic Affairs and Student Services",
      cols: [{ col: "vpaa", label: "VPAA" }, { col: "vpss", label: "VPSS" }] },
    { id: "amb", label: "Ambassadors", hint: "every active one in MAP", users: "Ambassador" },
    { id: "init", label: "Initiators", hint: "every active one in MAP", users: "Initiator" },
    { id: "dean", label: "Deans and directors", hint: "after the weekly contacts harvest", disabled: true }
  ];
  var CONTACTS_URL = SUPABASE_URL + "/rest/v1/map_college_contacts?select=college," +
    STEPS.map(function (s) { return s.col + "," + s.col + "_email"; }).join(",") + ",vpss,vpss_email";
  // MAP's active Ambassadors and Initiators, read a page at a time: PostgREST answers at most a
  // thousand rows a request, and there are about 1,470.
  var USERS_URL = SUPABASE_URL + "/rest/v1/map_college_users?select=college,first_name,last_name,email,role_name" +
    "&user_status=eq.Active&role_name=in.(Ambassador,Initiator)&order=id.asc";
  var PUBLIC_FUNDING_URL = "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/";
  var EMAIL_DEFAULT = "Subject: CPL Implementation Funding: {missing} for {college}\n\n" +
    "Dear {name},\n\n" +
    "The CPL Initiative team is writing about CPL Implementation Funding for {college}. Our records do not yet " +
    "show {missing}, one of the minimum conditions an institution meets to qualify for its award. The deadline " +
    "is {deadline}.\n\n" +
    "The CPL Implementation Funding page explains each condition and how to send it: " + PUBLIC_FUNDING_URL + "\n\n" +
    "If it is already on its way, or if someone else at {college} should receive this note, a short reply will " +
    "let us update our records.\n\n" +
    "The CPL Initiative team";
  var MISSING_TEXT = { part: "a participation confirmation", nc: "a noncredit attestation" };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function longDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
    return m ? MONTHS[Number(m[2]) - 1] + " " + Number(m[3]) + ", " + m[1] : String(v || "");
  }
  // A name key two spellings of one institution share: case, punctuation, a
  // leading "the", and MAP's Credit / Non-Credit listing suffixes fall away.
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/&/g, " and ")
      .replace(/\b(non-?credit|credit)\s*$/, "").replace(/[^a-z0-9]+/g, " ").replace(/^the /, "").trim();
  }
  function shortOf(s) {
    return typeof window.cplCollegeShort === "function" ? window.cplCollegeShort(s, "short") : s;
  }
  // Directory text is typed by hand: two people on two lines, stray spaces.
  function split(v) {
    return String(v == null ? "" : v).split(/\s*[\n,;]+\s*/).map(function (t) {
      return t.replace(/\s+/g, " ").trim();
    }).filter(Boolean);
  }
  function emails(v) {
    return split(v).filter(function (t) { return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(t); });
  }

  // Index rows by every spelling of their institution's name.
  function indexByName(rows) {
    var by = {};
    (rows || []).forEach(function (row) {
      [norm(row.college), norm(shortOf(row.college))].forEach(function (k) {
        if (k && (by[k] = by[k] || []).indexOf(row) < 0) by[k].push(row);
      });
    });
    return by;
  }
  function rowsOf(inst, by) {
    var out = [];
    [inst.key, inst.name].concat(inst.aliases || []).forEach(function (a) {
      [norm(a), norm(shortOf(a))].forEach(function (k) {
        (by[k] || []).forEach(function (r) { if (out.indexOf(r) < 0) out.push(r); });
      });
    });
    return out;
  }
  // The primary contact: the first step in Sam's order that holds an address, across every
  // directory row that names the institution (Calbright has two).
  function primaryOf(rows) {
    for (var i = 0; i < STEPS.length; i++) {
      for (var j = 0; j < rows.length; j++) {
        var e = emails(rows[j][STEPS[i].col + "_email"]);
        if (e.length) return { to: e, person: split(rows[j][STEPS[i].col]).join(" and "), step: STEPS[i].label };
      }
    }
    return { to: [], person: "", step: "" };
  }
  // institutions: [{ key, name, aliases, missing: ["part"|"nc"], declined: "" | its date in words }]
  // contacts: map_college_contacts rows. One entry per institution with its primary contact.
  function pick(institutions, contacts) {
    var by = indexByName(contacts);
    return (institutions || []).map(function (inst) {
      var p = primaryOf(rowsOf(inst, by));
      return { key: inst.key, name: inst.name, missing: inst.missing.slice(), declined: inst.declined || "",
        to: p.to, person: p.person, step: p.step };
    });
  }
  // Everyone the checked roles reach at one institution: [{ email, name, role }], one entry an
  // address (a person in two roles is written to once, both roles named).
  function recipients(inst, roles, data) {
    var out = [], seen = {};
    function add(email, name, role) {
      var k = email.toLowerCase();
      if (seen[k]) { if (seen[k].role.split("; ").indexOf(role) < 0) seen[k].role += "; " + role; return; }
      seen[k] = { email: email, name: name, role: role };
      out.push(seen[k]);
    }
    var crow = rowsOf(inst, data.contactsBy), urow = rowsOf(inst, data.usersBy);
    ROLES.forEach(function (r) {
      if (!roles[r.id] || r.disabled) return;
      if (r.id === "primary") {
        var p = primaryOf(crow);
        p.to.forEach(function (e) { add(e, p.person, p.step); });
      }
      (r.cols || []).forEach(function (c) {
        crow.forEach(function (row) {
          var names = split(row[c.col]);
          emails(row[c.col + "_email"]).forEach(function (e, i) { add(e, names[i] || names.join(" and "), c.label); });
        });
      });
      if (r.users) {
        urow.forEach(function (u) {
          if (u.role_name !== r.users) return;
          emails(u.email).forEach(function (e) {
            add(e, [u.first_name, u.last_name].map(function (x) { return String(x || "").trim(); }).filter(Boolean).join(" "), r.users);
          });
        });
      }
    });
    return out;
  }
  function missingText(list) {
    var t = list.map(function (k) { return MISSING_TEXT[k] || k; });
    return t.length > 1 ? t.slice(0, -1).join(", ") + " and " + t[t.length - 1] : (t[0] || "");
  }
  // The template filled in for one recipient: { subject, text }. r: { person, name, missing }.
  function fill(template, r, deadline) {
    var f = { name: r.person || "colleague", college: r.name, missing: missingText(r.missing), deadline: longDate(deadline) };
    var t = String(template || EMAIL_DEFAULT).replace(/\r\n?/g, "\n")
      .replace(/\{(name|college|missing|deadline)\}/g, function (m, k) { return f[k]; });
    var lines = t.split("\n"), sm = /^subject:\s*(.*)$/i.exec(lines[0] || ""), subject = "";
    if (sm) { subject = sm[1].trim(); t = lines.slice(1).join("\n").replace(/^\s+/, ""); }
    return { subject: subject, text: t };
  }
  function csvCell(v) {
    var s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  // One row a recipient, the columns a Word or Outlook mail merge reads. rows: [{ inst, recips }].
  function csv(rows, template, deadline) {
    var lines = [["Email", "Name", "Institution", "Missing", "Role", "Subject", "Body"].join(",")];
    rows.forEach(function (x) {
      x.recips.forEach(function (rc) {
        var m = fill(template, { person: rc.name, name: x.inst.name, missing: x.inst.missing }, deadline);
        lines.push([rc.email, rc.name, x.inst.name, missingText(x.inst.missing), rc.role, m.subject, m.text].map(csvCell).join(","));
      });
    });
    return lines.join("\r\n") + "\r\n";
  }

  var CSS_ID = "cplfund-nudge-css";
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement("style");
    st.id = CSS_ID;
    st.textContent = [
      ".cplfund-nudge .cplfund-maildlg-card { max-width: 980px; }",
      ".cplfund-nudge-sum { margin: 0 0 10px; font-size: .88rem; }",
      ".cplfund-nudge-roles { border: 0; margin: 0 0 10px; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: .84rem; }",
      ".cplfund-nudge-roles legend { font-weight: 600; color: var(--navy-secondary); padding: 0; margin-bottom: 4px; width: 100%; }",
      ".cplfund-nudge-roles label { display: inline-flex; align-items: center; gap: 6px; min-height: 24px; }",
      ".cplfund-nudge-roles .dk { color: var(--text-muted); }",
      ".cplfund-nudge-roles label.off { color: var(--text-muted); }",
      ".cplfund-nudge-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; margin: 0 0 6px; font-size: .84rem; }",
      ".cplfund-nudge-wrap { max-height: 46vh; overflow: auto; border: 1px solid var(--border-strong); border-radius: 6px; }",
      ".cplfund-nudge-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: .82rem; }",
      ".cplfund-nudge-table th, .cplfund-nudge-table td { text-align: left; vertical-align: top; padding: 5px 8px; " +
        "border-bottom: 1px solid var(--border-strong); overflow-wrap: anywhere; }",
      ".cplfund-nudge-table thead th { position: sticky; top: 0; z-index: 1; background: var(--surface-opaque); color: var(--navy-secondary); }",
      ".cplfund-nudge-table input[type=checkbox] { width: 18px; height: 18px; margin: 3px 0 0; }",
      ".cplfund-nudge-off th, .cplfund-nudge-off td { color: var(--text-muted); }",
      ".cplfund-nudge-tpl-l { display: block; margin: 12px 0 4px; font-weight: 600; font-size: .84rem; color: var(--navy-secondary); }",
      ".cplfund-nudge-tpl { width: 100%; box-sizing: border-box; min-height: 12em; font: inherit; font-size: .84rem; " +
        "color: var(--text-body); background: var(--surface-opaque); border: 1px solid var(--border-strong); border-radius: 6px; padding: 8px 10px; }",
      ".cplfund-nudge-tpl:focus-visible, .cplfund-nudge input:focus-visible { outline: 2px solid var(--gold-accent); outline-offset: 1px; }",
      "@media (max-width: 560px) { .cplfund-nudge-table .cplfund-nudge-miss { display: none; } }"
    ].join("\n");
    document.head.appendChild(st);
  }

  function rolesHtml(roles, usersOk) {
    return '<fieldset class="cplfund-nudge-roles"><legend>Send to</legend>' + ROLES.map(function (r) {
      var off = r.disabled || (r.users && !usersOk);
      var hint = r.users && !usersOk ? "MAP's user list did not load" : r.hint;
      return '<label' + (off ? ' class="off"' : "") + '><input type="checkbox" data-nudgerole="' + r.id + '"' +
        (roles[r.id] && !off ? " checked" : "") + (off ? " disabled" : "") + ">" + esc(r.label) +
        (hint ? ' <span class="dk">(' + esc(hint) + ")</span>" : "") + "</label>";
    }).join("") + "</fieldset>";
  }
  function whoHtml(recips) {
    if (!recips.length) return "No one on file for these roles";
    var shown = recips.slice(0, 4).map(function (r) {
      return esc((r.name ? r.name + " (" + r.email + ")" : r.email) + ", " + r.role);
    });
    return shown.join("<br>") + (recips.length > 4 ? "<br>and " + (recips.length - 4) + " more" : "");
  }
  function rowHtml(x, checked) {
    var i = x.inst, can = x.recips.length > 0;
    var miss = esc(missingText(i.missing)) +
      (i.declined ? "<br>Declined participation, " + esc(i.declined) + ". Check the box to nudge anyway." : "");
    return "<tr" + (i.declined || !can ? ' class="cplfund-nudge-off"' : "") + ">" +
      '<td><input type="checkbox" data-nudgepick="' + esc(i.key) + '"' + (checked && can ? " checked" : "") +
        (can ? "" : " disabled") + ' aria-label="Nudge ' + esc(i.name) + '"></td>' +
      '<th scope="row">' + esc(i.name) + "</th>" +
      '<td class="cplfund-nudge-miss">' + miss + "</td><td>" + whoHtml(x.recips) + "</td></tr>";
  }
  function tableHtml(rows, checked) {
    // Those who can be nudged first, the declined next, those with no one on file last.
    var rank = function (x) { return x.recips.length ? (x.inst.declined ? 1 : 0) : 2; };
    var sorted = rows.slice().sort(function (a, b) { return rank(a) - rank(b); });
    return '<div class="cplfund-nudge-wrap" role="region" aria-label="Institutions to nudge" tabindex="0">' +
      '<table class="cplfund-nudge-table"><caption class="cplfund-sr-only">Institutions to nudge: a box to include ' +
      "each, what each is missing, and who the checked roles reach</caption>" +
      '<colgroup><col style="width:6%"><col style="width:26%"><col class="cplfund-nudge-miss" style="width:26%"><col style="width:42%"></colgroup>' +
      '<thead><tr><th scope="col"><span class="cplfund-sr-only">Include</span></th><th scope="col">Institution</th>' +
      '<th scope="col" class="cplfund-nudge-miss">Missing</th><th scope="col">Recipients</th></tr></thead><tbody>' +
      sorted.map(function (x) { return rowHtml(x, !!checked[x.inst.key]); }).join("") + "</tbody></table></div>";
  }
  function summary(rows, checked) {
    var n = rows.length;
    var part = rows.filter(function (x) { return x.inst.missing.indexOf("part") >= 0; }).length;
    var nc = rows.filter(function (x) { return x.inst.missing.indexOf("nc") >= 0; }).length;
    var dec = rows.filter(function (x) { return x.inst.declined; }).length;
    var none = rows.filter(function (x) { return !x.recips.length; }).length;
    return n + (n === 1 ? " institution has" : " institutions have") + " not yet sent what the funding asks: " +
      part + " a participation confirmation, " + nc + " a noncredit attestation." +
      (dec ? " " + dec + " declined participation and start unchecked." : "") +
      (none ? " " + none + " have no one on file for the checked roles." : "");
  }
  function countText(rows, checked) {
    var on = rows.filter(function (x) { return checked[x.inst.key] && x.recips.length; });
    var people = {};
    on.forEach(function (x) { x.recips.forEach(function (r) { people[r.email.toLowerCase()] = 1; }); });
    return on.length + " of " + rows.length + " checked, " + Object.keys(people).length + " recipients";
  }

  function download(name, text) {
    if (typeof window.CPL_FUNDING_NUDGE_SAVE === "function") { window.CPL_FUNDING_NUDGE_SAVE(name, text); return; }
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 0);
  }
  function copyText(text, done) {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
        return;
      }
    } catch (e) {}
    done(false);
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
  }
  function getJson(url, headers) {
    return fetch(url, { headers: headers || {} }).then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  // Every page of a PostgREST read, a thousand rows at a time.
  function getAll(url, headers) {
    var all = [];
    function page(from) {
      var h = {};
      for (var k in (headers || {})) h[k] = headers[k];
      h.Range = from + "-" + (from + 999);
      h["Range-Unit"] = "items";
      return fetch(url, { headers: h }).then(function (r) { return r.ok ? r.json() : null; }).then(function (rows) {
        if (!Array.isArray(rows)) return all.length ? all : null;
        all = all.concat(rows);
        return rows.length === 1000 ? page(from + 1000) : all;
      }).catch(function () { return all.length ? all : null; });
    }
    return page(0);
  }

  // ctx: { institutions, deadline, headers } from cpl_funding.js; ctx.contacts and ctx.users may
  // hand the rows in (tests) instead of the reads.
  function open(ctx) {
    ctx = ctx || {};
    ensureCss();
    var old = document.getElementById("cplfund-maildlg");
    if (old) old.parentNode.removeChild(old);
    var back = document.activeElement;
    var box = document.createElement("div");
    box.id = "cplfund-maildlg";
    box.className = "cplfund-maildlg cplfund-nudge";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-labelledby", "cplfund-maildlg-h");
    box.innerHTML = '<div class="cplfund-maildlg-card">' +
      '<h3 id="cplfund-maildlg-h" class="cplfund-maildlg-h" tabindex="-1">Nudge the institutions still missing a condition</h3>' +
      '<div data-nudgebody="1"><p class="cplfund-nudge-sum" role="status">Reading the MAP directory&hellip;</p></div>' +
      '<div class="cplfund-maildlg-ctl"><button type="button" class="cplfund-textbtn" data-nudgeclose="1">Close</button></div></div>';
    document.body.appendChild(box);
    var close = function () {
      if (box.parentNode) box.parentNode.removeChild(box);
      document.removeEventListener("keydown", onKey, true);
      try { if (back && back.focus && document.contains(back)) back.focus(); } catch (e) {}
    };
    var onKey = function (e) { if (e.key === "Escape") { e.preventDefault(); close(); } };
    document.addEventListener("keydown", onKey, true);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    box.querySelector("[data-nudgeclose]").addEventListener("click", close);
    try { box.querySelector("#cplfund-maildlg-h").focus(); } catch (e) {}

    var gotC = Array.isArray(ctx.contacts) ? Promise.resolve(ctx.contacts) : getJson(CONTACTS_URL, ctx.headers);
    var gotU = Array.isArray(ctx.users) ? Promise.resolve(ctx.users) : getAll(USERS_URL, ctx.headers);
    return Promise.all([gotC, gotU]).then(function (res) {
      var body = box.querySelector("[data-nudgebody]");
      if (!body) return null;
      var contacts = res[0], users = res[1];
      if (!Array.isArray(contacts) || !contacts.length) {
        body.innerHTML = '<p class="cplfund-nudge-sum" role="status">The MAP directory did not answer. It opens to a ' +
          "signed-in reviewer; sign in again and press Nudge.</p>";
        return null;
      }
      var insts = ctx.institutions || [];
      if (!insts.length) {
        body.innerHTML = '<p class="cplfund-nudge-sum" role="status">Every institution has sent what the funding asks.</p>';
        return [];
      }
      var usersOk = Array.isArray(users);
      var data = { contactsBy: indexByName(contacts), usersBy: indexByName(usersOk ? users : []) };
      var roles = {};
      ROLES.forEach(function (r) { roles[r.id] = !!r.on; });
      var rows = [], checked = {};
      function build() {
        rows = insts.map(function (inst) { return { inst: inst, recips: recipients(inst, roles, data) }; });
      }
      build();
      // A declined institution starts unchecked; its box is the override.
      rows.forEach(function (x) { checked[x.inst.key] = !x.inst.declined && x.recips.length > 0; });
      body.innerHTML = rolesHtml(roles, usersOk) +
        '<p class="cplfund-nudge-sum" role="status" data-nudgesum="1"></p>' +
        '<div class="cplfund-nudge-bar"><button type="button" class="cplfund-optbtn" data-nudgeall="1">Select all</button>' +
        '<button type="button" class="cplfund-optbtn" data-nudgenone="1">Clear all</button>' +
        '<span data-nudgecount="1" aria-live="polite"></span></div>' +
        '<div data-nudgetable="1"></div>' +
        '<label class="cplfund-nudge-tpl-l" for="cplfund-nudge-tpl">The email, one a recipient</label>' +
        '<textarea id="cplfund-nudge-tpl" class="cplfund-nudge-tpl" aria-describedby="cplfund-nudge-help">' +
          esc(EMAIL_DEFAULT) + "</textarea>" +
        '<p id="cplfund-nudge-help" class="dk cplfund-maildlg-msg">The first line is the subject. {name}, {college}, ' +
        "{missing} and {deadline} fill in for each recipient. Select all checks every institution that has someone on " +
        "file and has not declined participation; a declined one is nudged only when its own box is checked. Download " +
        "for mail merge saves one row a recipient of the checked institutions, the filled-in subject and email beside " +
        "each address, for a Word or Outlook mail merge. Copy addresses puts the same addresses on the clipboard for " +
        "one message's Bcc line. COBI sends nothing: your mail program sends, from its own account.</p>";
      var tableBox = body.querySelector("[data-nudgetable]");
      function paint() {
        tableBox.innerHTML = tableHtml(rows, checked);
        body.querySelector("[data-nudgesum]").textContent = summary(rows, checked);
        body.querySelector("[data-nudgecount]").textContent = countText(rows, checked);
      }
      function recount() { body.querySelector("[data-nudgecount]").textContent = countText(rows, checked); }
      paint();
      tableBox.addEventListener("change", function (e) {
        var k = e.target && e.target.getAttribute && e.target.getAttribute("data-nudgepick");
        if (k == null) return;
        checked[k] = !!e.target.checked;
        recount();
      });
      body.querySelector(".cplfund-nudge-roles").addEventListener("change", function (e) {
        var id = e.target && e.target.getAttribute && e.target.getAttribute("data-nudgerole");
        if (!id) return;
        roles[id] = !!e.target.checked;
        build();
        paint();
      });
      body.querySelector("[data-nudgeall]").addEventListener("click", function () {
        rows.forEach(function (x) { checked[x.inst.key] = !x.inst.declined && x.recips.length > 0; });
        paint();
      });
      body.querySelector("[data-nudgenone]").addEventListener("click", function () {
        rows.forEach(function (x) { checked[x.inst.key] = false; });
        paint();
      });
      var ctl = box.querySelector(".cplfund-maildlg-ctl");
      ctl.insertAdjacentHTML("afterbegin",
        '<button type="button" class="cplfund-textbtn primary" data-nudgecsv="1">Download for mail merge</button>' +
        '<button type="button" class="cplfund-textbtn" data-nudgebcc="1">Copy addresses</button>' +
        '<span class="dk cplfund-maildlg-msg" data-nudgemsg="1" role="status" aria-live="polite"></span>');
      var msg = ctl.querySelector("[data-nudgemsg]");
      var tpl = function () { return box.querySelector("#cplfund-nudge-tpl").value; };
      var chosen = function () { return rows.filter(function (x) { return checked[x.inst.key] && x.recips.length; }); };
      ctl.querySelector("[data-nudgecsv]").addEventListener("click", function () {
        var on = chosen();
        if (!on.length) { msg.textContent = "Check at least one institution first."; return; }
        download(today() + "_CPL_Funding_Nudge.csv", csv(on, tpl(), ctx.deadline));
        msg.textContent = "Saved. Open it as the mail merge's recipient list.";
      });
      ctl.querySelector("[data-nudgebcc]").addEventListener("click", function () {
        var all = [], seen = {};
        chosen().forEach(function (x) {
          x.recips.forEach(function (r) { var k = r.email.toLowerCase(); if (!seen[k]) { seen[k] = 1; all.push(r.email); } });
        });
        if (!all.length) { msg.textContent = "Check at least one institution first."; return; }
        copyText(all.join("; "), function (ok) {
          msg.textContent = ok ? "Copied " + all.length + " addresses. Paste them into one message's Bcc line."
            : "This browser would not copy. Download for mail merge holds the same addresses.";
        });
      });
      return rows;
    });
  }

  window.CPL_FUNDING_NUDGE = { open: open, pick: pick, recipients: recipients, indexByName: indexByName, fill: fill,
    csv: csv, STEPS: STEPS, ROLES: ROLES, EMAIL_DEFAULT: EMAIL_DEFAULT, CONTACTS_URL: CONTACTS_URL, USERS_URL: USERS_URL };
})();
