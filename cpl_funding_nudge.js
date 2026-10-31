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
 * reviewer's own session (RLS answers anyone else with nothing), and cpl_funding.js
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
  var CONTACTS_URL = SUPABASE_URL + "/rest/v1/map_college_contacts?select=college," +
    STEPS.map(function (s) { return s.col + "," + s.col + "_email"; }).join(",");
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

  // institutions: [{ key, name, aliases: [...], missing: ["part"|"nc", ...] }]
  // contacts: map_college_contacts rows. Returns one entry per institution, the
  // recipient chosen by the first step that holds an address (across every
  // directory row that names the institution: Calbright has two).
  function pick(institutions, contacts) {
    var byKey = {};
    (contacts || []).forEach(function (row) {
      var ks = [norm(row.college), norm(shortOf(row.college))];
      ks.forEach(function (k) { if (k) (byKey[k] = byKey[k] || []).indexOf(row) < 0 && byKey[k].push(row); });
    });
    return (institutions || []).map(function (inst) {
      var rows = [];
      [inst.key, inst.name].concat(inst.aliases || []).forEach(function (a) {
        [norm(a), norm(shortOf(a))].forEach(function (k) {
          (byKey[k] || []).forEach(function (r) { if (rows.indexOf(r) < 0) rows.push(r); });
        });
      });
      var out = { key: inst.key, name: inst.name, missing: inst.missing.slice(), to: [], person: "", step: "" };
      for (var i = 0; i < STEPS.length && !out.to.length; i++) {
        for (var j = 0; j < rows.length; j++) {
          var e = emails(rows[j][STEPS[i].col + "_email"]);
          if (e.length) {
            out.to = e; out.person = split(rows[j][STEPS[i].col]).join(" and "); out.step = STEPS[i].label;
            break;
          }
        }
      }
      return out;
    });
  }
  function missingText(list) {
    var t = list.map(function (k) { return MISSING_TEXT[k] || k; });
    return t.length > 1 ? t.slice(0, -1).join(", ") + " and " + t[t.length - 1] : (t[0] || "");
  }
  // The template filled in for one recipient: { subject, text }.
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
  // One row a recipient, the columns a Word or Outlook mail merge reads.
  function csv(picked, template, deadline) {
    var head = ["Email", "Name", "Institution", "Missing", "Chosen by", "Subject", "Body"];
    var lines = [head.join(",")];
    picked.forEach(function (r) {
      if (!r.to.length) return;
      var m = fill(template, r, deadline);
      lines.push([r.to.join("; "), r.person, r.name, missingText(r.missing), r.step, m.subject, m.text].map(csvCell).join(","));
    });
    return lines.join("\r\n") + "\r\n";
  }

  var CSS_ID = "cplfund-nudge-css";
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement("style");
    st.id = CSS_ID;
    st.textContent = [
      ".cplfund-nudge .cplfund-maildlg-card { max-width: 960px; }",
      ".cplfund-nudge-sum { margin: 0 0 10px; font-size: .88rem; }",
      ".cplfund-nudge-wrap { max-height: 46vh; overflow: auto; border: 1px solid var(--border-strong); border-radius: 6px; }",
      ".cplfund-nudge-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: .82rem; }",
      ".cplfund-nudge-table th, .cplfund-nudge-table td { text-align: left; vertical-align: top; padding: 5px 8px; " +
        "border-bottom: 1px solid var(--border-strong); overflow-wrap: anywhere; }",
      ".cplfund-nudge-table thead th { position: sticky; top: 0; background: var(--surface-opaque); color: var(--navy-secondary); }",
      ".cplfund-nudge-none td { color: var(--text-muted); }",
      ".cplfund-nudge-tpl-l { display: block; margin: 12px 0 4px; font-weight: 600; font-size: .84rem; color: var(--navy-secondary); }",
      ".cplfund-nudge-tpl { width: 100%; box-sizing: border-box; min-height: 12em; font: inherit; font-size: .84rem; " +
        "color: var(--text-body); background: var(--surface-opaque); border: 1px solid var(--border-strong); border-radius: 6px; padding: 8px 10px; }",
      ".cplfund-nudge-tpl:focus-visible { outline: 2px solid var(--gold-accent); outline-offset: 1px; }",
      "@media (max-width: 560px) { .cplfund-nudge-table col.cplfund-nudge-cstep { width: 0; } " +
        ".cplfund-nudge-table .cplfund-nudge-step { display: none; } }"
    ].join("\n");
    document.head.appendChild(st);
  }

  function tableHtml(picked) {
    var withTo = picked.filter(function (r) { return r.to.length; });
    var none = picked.filter(function (r) { return !r.to.length; });
    var row = function (r) {
      return "<tr" + (r.to.length ? "" : ' class="cplfund-nudge-none"') + '><th scope="row">' + esc(r.name) + "</th>" +
        "<td>" + esc(missingText(r.missing)) + "</td>" +
        "<td>" + (r.to.length ? esc(r.person ? r.person + " (" + r.to.join(", ") + ")" : r.to.join(", ")) : "No one on file") + "</td>" +
        '<td class="cplfund-nudge-step">' + esc(r.step || "None of the five") + "</td></tr>";
    };
    return '<div class="cplfund-nudge-wrap" role="region" aria-label="Institutions to nudge" tabindex="0">' +
      '<table class="cplfund-nudge-table"><caption class="cplfund-sr-only">Institutions to nudge, what each is missing, ' +
      "and the recipient Sam's order chose</caption>" +
      '<colgroup><col style="width:26%"><col style="width:22%"><col style="width:34%"><col class="cplfund-nudge-cstep" style="width:18%"></colgroup>' +
      '<thead><tr><th scope="col">Institution</th><th scope="col">Missing</th><th scope="col">Recipient</th>' +
      '<th scope="col" class="cplfund-nudge-step">Chosen by</th></tr></thead><tbody>' +
      withTo.concat(none).map(row).join("") + "</tbody></table></div>";
  }
  function summary(picked) {
    var n = picked.length, to = picked.filter(function (r) { return r.to.length; }).length;
    var part = picked.filter(function (r) { return r.missing.indexOf("part") >= 0; }).length;
    var nc = picked.filter(function (r) { return r.missing.indexOf("nc") >= 0; }).length;
    var steps = {};
    picked.forEach(function (r) { if (r.step) steps[r.step] = (steps[r.step] || 0) + 1; });
    var by = STEPS.filter(function (s) { return steps[s.label]; }).map(function (s) { return steps[s.label] + " by " + s.label; });
    return n + (n === 1 ? " institution has" : " institutions have") + " not yet sent what the funding asks: " +
      part + " a participation confirmation, " + nc + " a noncredit attestation. " +
      to + " have a recipient on file" + (by.length ? " (" + by.join(", ") + ")" : "") +
      (n - to ? "; " + (n - to) + " have no one on file." : ".");
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

  // ctx: { institutions, deadline, headers } from cpl_funding.js; ctx.contacts may
  // hand the rows in (tests) instead of the read.
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

    var got = Array.isArray(ctx.contacts) ? Promise.resolve(ctx.contacts)
      : fetch(CONTACTS_URL, { headers: ctx.headers || {} }).then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
    return got.then(function (rows) {
      var body = box.querySelector("[data-nudgebody]");
      if (!body) return null;
      if (!Array.isArray(rows) || !rows.length) {
        body.innerHTML = '<p class="cplfund-nudge-sum" role="status">The MAP directory did not answer. It opens to a ' +
          "signed-in reviewer; sign in again and press Nudge.</p>";
        return null;
      }
      var picked = pick(ctx.institutions || [], rows);
      if (!picked.length) {
        body.innerHTML = '<p class="cplfund-nudge-sum" role="status">Every institution has sent what the funding asks.</p>';
        return picked;
      }
      body.innerHTML = '<p class="cplfund-nudge-sum" role="status">' + esc(summary(picked)) + "</p>" + tableHtml(picked) +
        '<label class="cplfund-nudge-tpl-l" for="cplfund-nudge-tpl">The email, one a recipient</label>' +
        '<textarea id="cplfund-nudge-tpl" class="cplfund-nudge-tpl" aria-describedby="cplfund-nudge-help">' +
          esc(EMAIL_DEFAULT) + "</textarea>" +
        '<p id="cplfund-nudge-help" class="dk cplfund-maildlg-msg">The first line is the subject. {name}, {college}, ' +
        "{missing} and {deadline} fill in for each recipient. Download for mail merge saves one row a recipient, the " +
        "filled-in subject and email beside each address, for a Word or Outlook mail merge. Copy addresses puts every " +
        "address on the clipboard for one message's Bcc line. COBI sends nothing: your mail program sends, from its own account.</p>";
      var ctl = box.querySelector(".cplfund-maildlg-ctl");
      ctl.insertAdjacentHTML("afterbegin",
        '<button type="button" class="cplfund-textbtn primary" data-nudgecsv="1">Download for mail merge</button>' +
        '<button type="button" class="cplfund-textbtn" data-nudgebcc="1">Copy addresses</button>' +
        '<span class="dk cplfund-maildlg-msg" data-nudgemsg="1" role="status" aria-live="polite"></span>');
      var msg = ctl.querySelector("[data-nudgemsg]");
      var tpl = function () { return box.querySelector("#cplfund-nudge-tpl").value; };
      ctl.querySelector("[data-nudgecsv]").addEventListener("click", function () {
        download(today() + "_CPL_Funding_Nudge.csv", csv(picked, tpl(), ctx.deadline));
        msg.textContent = "Saved. Open it as the mail merge's recipient list.";
      });
      ctl.querySelector("[data-nudgebcc]").addEventListener("click", function () {
        var all = [];
        picked.forEach(function (r) { r.to.forEach(function (e) { if (all.indexOf(e) < 0) all.push(e); }); });
        copyText(all.join("; "), function (ok) {
          msg.textContent = ok ? "Copied " + all.length + " addresses. Paste them into one message's Bcc line."
            : "This browser would not copy. Download for mail merge holds the same addresses.";
        });
      });
      return picked;
    });
  }

  window.CPL_FUNDING_NUDGE = { open: open, pick: pick, fill: fill, csv: csv, STEPS: STEPS, EMAIL_DEFAULT: EMAIL_DEFAULT,
    CONTACTS_URL: CONTACTS_URL };
})();
