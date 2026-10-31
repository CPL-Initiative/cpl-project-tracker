// exhibits.js — the Exhibits tab: what a MAP exhibit is called, what credit it carries, who could adopt it.
//
// Sam, Open Asks Sheet 147 card 1 (2026-10-31, "merge"): one Exhibits tab in the Catalog Commons replaces
// the Common Exhibit Reference and Exhibit Adoption, and Review is built first; the two tabs stay until
// this one carries everything they show. The card is the mock-up at version 26
// (docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html) and his words on it (2026-10-30): "I do
// like your 3 categories"; "shouldn't the proposed canonical title always be the focus and the differing
// titles below it in small print"; "call it Local titles"; "chip showing the status of CER step" with a
// hover; "the filters for status could be in the higher cards"; "change Accept to Keep Current Title and
// Change the title to Changed to Proposed Title...but what if we want to edit the proposed title?"; "can
// we shoot to a certain exhibit to set the title using a search bar?"; "When college could adopt chips
// clicked they should open with the courses and Request Quick Adopt links". Lane:
// docs/reference/lanes/cer-procedures.md.
//
// What it reads:
//   kb/exhibits_review.json          the held titles, written nightly by kb/_build_exhibits_review.py
//   kb/exhibits_review_courses.json  the courses behind a could-adopt chip, fetched on the first click
//   exhibit_title_students()         students per title: an allowed reviewer only, k=10 applied in the
//                                    database (the student-detail ADR), so this page never holds a count
//                                    under ten. Without a reviewer sign-in the queue keeps the builder's
//                                    order, the most widely articulated title first.
// What it writes, signed in as a reviewer: the CER's own kb_curation rows, _UNCLASSIFIED::<local title>
// with unified_title_assignment and issuing_agency_assignment, exactly as the CER's Unclassified Save
// writes them. The nightly fold adds them to the reference. A conflict's Change to Proposed Title clears
// the saved assignment (the CER's "Keep the reference's title"); re-keying a person-reviewed entry stays
// a session's reviewed change.
//
// The buttons, read from Sam's words: the current title is the exhibit's latest decision (its local title,
// or the title a person saved for a conflict); the proposed title is the box, which he may edit first.
//
// Loaded by the tab's boot block (both HTMLs, Rule 4). First Light tokens only, words for every control.
(function () {
  "use strict";

  var ROOT_ID = "exhibits-root";
  var DATA_URL = "kb/exhibits_review.json";
  var COURSES_URL = "kb/exhibits_review_courses.json";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var UNCLASS_PREFIX = "_UNCLASSIFIED::";
  var FIELD_TITLE = "unified_title_assignment";
  var FIELD_ISSUER = "issuing_agency_assignment";
  var MAP_PAGE = "https://cpldashboardcccco.azurewebsites.net/insights/exhibit-courses";
  var MAP_VIEW = "&View=Non-Military";
  var CHIP_MAX = 10;
  var CONFLICT = "Conflict with the reference";
  var STEPS = ["Proposed", "Wording check", "Two issuers", CONFLICT];
  /* What each CER step means, in a sentence or two (the chip's hover; the mock-up's words). */
  var TIPS = {
    "": "Every held title, most students first.",
    "Proposed": "A rule or the classifier suggested a title, but not surely enough to save it. It waits for a person to keep, change or edit it.",
    "Wording check": "The suggested title is likely right, but a word in it failed a quality check: a leftover course code, a dangling word or a method word. A person confirms it.",
    "Two issuers": "The suggested title would join this exhibit to a credential the reference gives another issuer. A person decides whether they are one credential or two.",
    "Saved, not folded": "A person or a rule saved a title. The nightly run adds it to the reference.",
    "Conflict with the reference": "The title saved for this exhibit disagrees with one a person already approved. The nightly run never overwrites a person's decision, so it waits for you."
  };

  var state = {
    data: null, error: null, filter: "", cur: 0,
    students: null, studentsWord: "", total: null,
    done: {}, note: "", courses: null, coursesErr: false, drafts: {}, teachDraft: "",
    teach: false, openCollege: null, showAllArt: false, showAllCould: false, showUnder: false
  };

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === "text") e.textContent = attrs[k];
      else if (k === "cls") e.className = attrs[k];
      else e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function word(text, onClick, attrs) {
    var b = el("button", Object.assign({ type: "button", cls: "exh-w" }, attrs || {}), [text]);
    b.addEventListener("click", onClick);
    return b;
  }
  function fmt(n) { return n == null ? "" : Number(n).toLocaleString("en-US"); }
  /* "2026-10-31T07:47:00Z" -> "2026-10-31 07:47Z" */
  function stamp(v) {
    var m = /^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)/.exec(v || "");
    return m ? m[1] + " " + m[2] + "Z" : (v || "");
  }
  function pct(n, of) { return of ? Math.round(1000 * n / of) / 10 : 0; }
  function college(i) { return ((state.data && state.data.colleges) || [])[i] || ""; }
  function shortName(name) {
    return typeof window.cplCollegeShort === "function" ? (window.cplCollegeShort(name) || name) : name;
  }
  function shortList(idx) {
    var names = (idx || []).map(function (i) { return shortName(college(i)); }).filter(Boolean);
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " and " + names[1];
    if (names.length === 3) return names[0] + ", " + names[1] + " and " + names[2];
    return names[0] + ", " + names[1] + " and " + (names.length - 2) + " more";
  }
  function mapUrl(id) { return MAP_PAGE + "?Exhibit=" + encodeURIComponent(id) + MAP_VIEW; }
  function whoBuilt(h) { return h.colleges && h.colleges.length ? h.colleges : h.art; }

  /* ── the queue ── */
  function studentsOf(h) { return state.students ? state.students[h._i] : null; }
  /* Most students first: a count of ten or more by its size, then the cells under ten, then none. */
  function rank(h) {
    var s = studentsOf(h);
    if (!s) return -1;
    if (s.suppressed) return 5;
    return s.students || 0;
  }
  function shown() {
    if (!state.data) return [];
    var list = state.data.held.filter(function (h) {
      return !state.done[h.raw] && (!state.filter || h.step === state.filter);
    });
    if (state.students) {
      list = list.slice().sort(function (a, b) { return rank(b) - rank(a) || a._i - b._i; });
    }
    return list;
  }
  function stepCount(step) {
    if (!state.data) return 0;
    return state.data.held.filter(function (h) { return !state.done[h.raw] && (!step || h.step === step); }).length;
  }

  /* ── reads ── */
  function load() {
    return fetch(DATA_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        (d.held || []).forEach(function (h, i) { h._i = i; });
        state.data = d; state.error = null;
        return d;
      })
      .catch(function (e) { state.error = String(e && e.message || e); state.data = null; });
  }
  function session() {
    var S = window.CPL_SESSION;
    if (!S || typeof S.ensureFresh !== "function") return Promise.resolve(null);
    return Promise.resolve(S.ensureFresh()).then(function (s) { return s && s.access_token ? s : null; })
      .catch(function () { return null; });
  }
  function headers(sess, extra) {
    var h = { "apikey": anonKey(), "Authorization": "Bearer " + sess.access_token, "Content-Type": "application/json" };
    for (var k in (extra || {})) h[k] = extra[k];
    return h;
  }
  function anonKey() {
    var S = window.CPL_SESSION;
    var h = S && typeof S.authHeaders === "function" ? S.authHeaders() : null;
    return (h && h.apikey) || "";
  }
  /* Students per title, from the reviewer-only function; each title's exhibits counted together, and
     every held exhibit together under "*" for the Students waiting tile. */
  function loadStudents() {
    if (!state.data) return Promise.resolve();
    return session().then(function (sess) {
      if (!sess) { state.students = null; state.total = null; state.studentsWord = "signin"; return; }
      var keys = [], ids = [];
      state.data.held.forEach(function (h) {
        (h.ids || []).forEach(function (id) { keys.push(String(h._i)); ids.push(id); keys.push("*"); ids.push(id); });
      });
      return fetch(SUPABASE_URL + "/rest/v1/rpc/exhibit_title_students", {
        method: "POST", headers: headers(sess), body: JSON.stringify({ p_keys: keys, p_ids: ids })
      }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (rows) {
          if (!rows.length && ids.length) { state.students = null; state.studentsWord = "refused"; return; }
          var by = {};
          rows.forEach(function (row) {
            if (row.key === "*") state.total = row;
            else by[row.key] = { students: row.students, suppressed: !!row.suppressed };
          });
          state.data.held.forEach(function (h) {
            if (!by[h._i]) by[h._i] = { students: 0, suppressed: false };
          });
          state.students = by; state.studentsWord = "ok"; state.cur = 0;
        })
        .catch(function () { state.students = null; state.studentsWord = "error"; });
    });
  }
  function loadCourses() {
    if (state.courses || state.coursesErr) return Promise.resolve();
    return fetch(COURSES_URL, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { state.courses = d; })
      .catch(function () { state.coursesErr = true; });
  }

  /* ── writes: the CER's own kb_curation rows ── */
  function saveRow(sess, raw, field, value) {
    return fetch(SUPABASE_URL + "/rest/v1/kb_curation", {
      method: "POST",
      headers: headers(sess, { "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ course_id: UNCLASS_PREFIX + raw, field: field, value: value, reviewer_email: sess.email })
    });
  }
  function saveAssignment(raw, title, issuer) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return Promise.all([saveRow(sess, raw, FIELD_TITLE, title), saveRow(sess, raw, FIELD_ISSUER, issuer)]);
    }).then(function (rs) {
      if (!rs.every(function (r) { return r.ok; })) throw new Error("HTTP " + rs.map(function (r) { return r.status; }).join("/"));
    });
  }
  function clearAssignment(raw) {
    return session().then(function (sess) {
      if (!sess) throw new Error("signin");
      return fetch(SUPABASE_URL + "/rest/v1/kb_curation?course_id=eq." + encodeURIComponent(UNCLASS_PREFIX + raw),
        { method: "DELETE", headers: headers(sess) });
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
  }

  /* ── the actions ── */
  function decided(h, note) {
    state.done[h.raw] = true;
    delete state.drafts[h.raw];
    state.teachDraft = "";
    state.note = note;
    state.teach = false; state.openCollege = null;
    state.showAllArt = state.showAllCould = state.showUnder = false;
    render();
    var t = document.getElementById("exh-title");
    if (t) t.focus();
  }
  function failed(e) {
    state.note = e && e.message === "signin"
      ? "Sign in as a reviewer to save."
      : "The save did not reach the reference (" + (e && e.message || "no answer") + "). Nothing changed; try again.";
    render();
  }
  function keepCurrent(h, box, issuer) {
    if (h.step === CONFLICT) {
      state.note = "The reference's title was approved by a person, so keeping the saved title means re-keying "
        + "that entry. Tell a session; it is a reviewed change.";
      render();
      return;
    }
    saveAssignment(h.raw, h.raw.trim(), issuer)
      .then(function () { decided(h, "Saved “" + h.raw.trim() + "” as its own title. The nightly run adds it to the reference."); })
      .catch(failed);
  }
  function changeToProposed(h, box, issuer) {
    var title = (box || "").trim();
    if (!title) { state.note = "Write a canonical title first."; render(); return; }
    if (h.step === CONFLICT) {
      if (title !== h.title) {
        state.note = "A different title here would re-key a person-reviewed entry. Tell a session; it is a reviewed change.";
        render();
        return;
      }
      clearAssignment(h.raw)
        .then(function () { decided(h, "Cleared the saved assignment; the reference's title “" + title + "” stands."); })
        .catch(failed);
      return;
    }
    saveAssignment(h.raw, title, issuer)
      .then(function () { decided(h, "Saved “" + title + "”. The nightly run adds it to the reference."); })
      .catch(failed);
  }
  function skip(list) {
    state.cur = list.length ? (state.cur + 1) % list.length : 0;
    state.note = ""; state.teach = false; state.openCollege = null; state.teachDraft = "";
    state.showAllArt = state.showAllCould = state.showUnder = false;
    render();
  }
  function teachText(h, words, box, issuer) {
    return "Add a CER procedure (from the Exhibits tab, " + new Date().toISOString().slice(0, 10) + "): "
      + (words || "").trim() + "\nExample: “" + h.raw + "” should read “" + (box || h.title) + "”"
      + (issuer ? ", issued by " + issuer : "") + ".\nPaste the procedures run's dry run here; no investigation.";
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return Promise.reject(new Error("no clipboard"));
  }

  /* ── the page ── */
  function tile(label, n, of, words, aside, instead) {
    var kids = [el("span", { cls: "exh-tl", text: label })];
    var tn = el("span", { cls: "exh-tn" }, [el("b", { text: n == null ? (instead || "Could not be read") : fmt(n) })]);
    if (of != null) tn.appendChild(document.createTextNode(" of " + fmt(of)));
    kids.push(tn);
    if (of) {
      var bar = el("span", { cls: "exh-bar", role: "img", "aria-label": pct(n, of) + " percent" });
      var i = el("i"); i.style.width = pct(n, of) + "%"; bar.appendChild(i); kids.push(bar);
    }
    kids.push(el("span", { cls: "exh-tt", text: words }));
    if (aside) kids.push(el("span", { cls: "exh-ts", text: aside }));
    return el("div", { cls: "exh-tile", role: "listitem" }, kids);
  }
  function studentsTile() {
    var t = state.total;
    if (state.studentsWord === "ok" && t) {
      return tile("Students waiting", t.suppressed ? null : t.students, null,
        "students hold credit on titles still held", "Most students first");
    }
    var w = state.studentsWord;
    var why = w === "signin" ? "Sign in as a reviewer to see them"
      : w === "refused" ? "Your sign-in is not a reviewer's" : w === "error" ? "The count did not load" : "";
    var big = w === "signin" || w === "refused" ? "Reviewers only" : w === "error" ? "Could not be read"
      : w === "ok" ? "Too few to show" : "Reading";
    return tile("Students waiting", null, null, "students hold credit on titles still held", why, big);
  }
  function stepTile(step, label) {
    var n = step === "Saved, not folded" ? (state.data.tiles.saved_not_folded || 0) : stepCount(step);
    var b = el("button", {
      type: "button", cls: "exh-step", "aria-pressed": state.filter === step ? "true" : "false",
      "data-tip": TIPS[step], "aria-label": label + ", " + fmt(n) + ". " + TIPS[step]
    }, [el("span", { cls: "exh-sn", text: fmt(n) }), el("span", { cls: "exh-sl", text: label })]);
    if (step === "Saved, not folded") {
      b.disabled = true;
    } else {
      b.addEventListener("click", function () {
        state.filter = step; state.cur = 0; state.note = ""; state.openCollege = null; state.teach = false;
        render();
      });
    }
    return b;
  }
  function chips(idx, max, all, onMore, pick) {
    var box = el("span", { cls: "exh-cchips" });
    if (!idx.length) { box.appendChild(el("span", { cls: "exh-muted", text: "None yet" })); return box; }
    (all ? idx : idx.slice(0, max)).forEach(function (i) {
      var name = college(i);
      if (pick) {
        var b = el("button", { type: "button", cls: "exh-cchip", title: name, "aria-controls": "exh-adopt",
          "aria-expanded": state.openCollege === i ? "true" : "false" }, [shortName(name)]);
        b.addEventListener("click", function () { pick(i); });
        box.appendChild(b);
      } else {
        box.appendChild(el("span", { cls: "exh-cchip", title: name, text: shortName(name) }));
      }
    });
    if (idx.length > max) box.appendChild(word(all ? "Show fewer" : "and " + (idx.length - max) + " more", onMore, { cls: "exh-w exh-small" }));
    return box;
  }
  function adoptPanel(h) {
    var i = state.openCollege;
    var box = el("div", { cls: "exh-adopt", id: "exh-adopt" });
    if (i == null) { box.hidden = true; return box; }
    var name = college(i);
    box.appendChild(el("h4", { text: name }));
    var rows = h.same && state.courses && state.courses.courses[h.aligned_id]
      ? state.courses.courses[h.aligned_id][String(i)] || [] : [];
    var lead;
    if (h.same && !state.courses && !state.coursesErr) lead = "Reading the courses…";
    else if (h.same && state.coursesErr) lead = "The courses could not be read.";
    else if (rows.length) lead = "Courses aligned to " + h.basis + " at this college:";
    else if (h.basis) lead = "No course aligned to " + h.basis + " on file here; the college's faculty choose the course.";
    else lead = "Exhibit Adoption lists this college; its faculty choose the course.";
    box.appendChild(el("p", { cls: "exh-muted", text: lead }));
    if (rows.length) {
      box.appendChild(el("ul", null, rows.map(function (r) {
        var u = r[2] ? r[2] + (r[2] === 1 ? " unit" : " units") : "noncredit";
        return el("li", { text: r[0] + " " + r[1] + ", " + u });
      })));
    }
    if (h.ids && h.ids.length) {
      var a = el("a", { href: mapUrl(h.ids[0]), target: "_blank", rel: "noopener", text: "Request Quick Adopt in MAP" });
      box.appendChild(el("p", null, [a, ", from " + h.ids[0] + ", " + shortList(whoBuilt(h)) + "’s exhibit"]));
    }
    return box;
  }
  function studentsLine(h) {
    var s = studentsOf(h);
    var many = h.ids && h.ids.length > 1 ? "these exhibits" : "this exhibit";
    if (state.studentsWord === "signin") return "Sign in as a reviewer to see students";
    if (state.studentsWord === "refused") return "Students show to a reviewer's sign-in";
    if (state.studentsWord === "error") return "Students could not be read";
    if (!s) return "Reading students";
    if (s.suppressed) return "Too few students to show";
    if (!s.students) return "No students with credit yet";
    return fmt(s.students) + " students have credit on " + many;
  }

  function card(h, list) {
    var c = el("section", { cls: "exh-card", "aria-label": "Review one title" });
    var chip = el("span", { cls: "exh-chip", tabindex: "0", "data-tip": TIPS[h.step] || "",
      "aria-label": "CER step: " + h.step + ". " + (TIPS[h.step] || "") }, ["CER step: " + h.step]);
    var row = el("div", { cls: "exh-chiprow" }, [chip]);
    if (h.saved) row.appendChild(el("span", { cls: "exh-muted exh-small", text: "Saved earlier as “" + h.saved + "”" }));
    c.appendChild(row);

    var canon = el("div", { cls: "exh-canon" });
    canon.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-title",
      text: "Canonical title, from " + (h.from || "the classifier") + " (edit it here)" }));
    // An edit outlives a re-render (opening a chip, showing more colleges) until the title is decided.
    var draft = state.drafts[h.raw] || {};
    var title = el("input", { cls: "exh-edit", id: "exh-title", type: "text", autocomplete: "off" });
    title.value = draft.title != null ? draft.title : (h.title || "");
    canon.appendChild(title);
    var issuer = el("input", { id: "exh-issuer", type: "text", autocomplete: "off", placeholder: "None named" });
    issuer.value = draft.issuer != null ? draft.issuer : (h.issuer || "");
    function keepDraft() { state.drafts[h.raw] = { title: title.value, issuer: issuer.value }; }
    issuer.addEventListener("input", keepDraft);
    canon.appendChild(el("label", { cls: "exh-inbox", "for": "exh-issuer" }, [el("span", { cls: "exh-pre", text: "Issuer:" }), issuer]));
    var sites = (h.trainers || []).join("; ");
    canon.appendChild(el("div", { cls: "exh-inbox exh-read" }, [el("span", { cls: "exh-pre", text: "Training site:" }),
      el("span", { text: sites || "None named" })]));
    var exists = el("p", { cls: "exh-muted exh-small" },
      [h.exists ? "Joins the credential already in the reference under this title." : "A new credential in the reference."]);
    exists.hidden = title.value.trim() !== (h.title || "");
    title.addEventListener("input", function () { keepDraft(); exists.hidden = title.value.trim() !== (h.title || ""); });
    canon.appendChild(exists);
    (h.alternates || []).forEach(function (alt) {
      canon.appendChild(el("p", { cls: "exh-muted exh-small" }, [
        (h.step === CONFLICT ? "The reference also names: " : "Also proposed: ") + alt + " ",
        word("Use it", function () { title.value = alt; keepDraft(); exists.hidden = true; title.focus(); }, { cls: "exh-w exh-small" })]));
    });
    c.appendChild(canon);

    var typed = el("div", { cls: "exh-typed" }, [el("span", { cls: "exh-cl", text: "Local titles" })]);
    var nowLi = el("li", { cls: "exh-now" }, [
      el("span", { cls: "exh-muted", text: "Deciding now, " + shortList(whoBuilt(h)) + ": " }),
      el("span", { text: h.raw })]);
    if (h.course) nowLi.appendChild(el("span", { cls: "exh-muted", text: " · articulated to " + h.course }));
    typed.appendChild(el("ul", null, [nowLi]));
    var under = el("ul", { cls: "exh-under" });
    var others = h.under || [];
    if (!others.length) under.appendChild(el("li", { text: "No other local titles under it yet" }));
    else {
      if (state.showUnder) others.forEach(function (t) { under.appendChild(el("li", { text: t })); });
      var more = (h.under_count || others.length) - (state.showUnder ? others.length : 0);
      var label = state.showUnder ? (more > 0 ? "and " + more + " more not shown; Show fewer" : "Show fewer") : "and " + (h.under_count || others.length) + " more";
      under.appendChild(el("li", null, [word(label, function () { state.showUnder = !state.showUnder; render(); }, { cls: "exh-w exh-small" })]));
    }
    typed.appendChild(under);
    c.appendChild(typed);

    var cc = el("div", { cls: "exh-colleges" });
    cc.appendChild(el("div", { cls: "exh-ccrow" }, [
      el("span", { cls: "exh-cl", text: "Articulated at (" + h.art.length + ")" }),
      chips(h.art, CHIP_MAX, state.showAllArt, function () { state.showAllArt = !state.showAllArt; render(); })]));
    var basis = h.same ? ", same course as " + h.basis : ", from Exhibit Adoption";
    cc.appendChild(el("div", { cls: "exh-ccrow" }, [
      el("span", { cls: "exh-cl", text: "Could adopt (" + h.could.length + ")" + (h.could.length ? basis : "") }),
      chips(h.could, CHIP_MAX, state.showAllCould, function () { state.showAllCould = !state.showAllCould; render(); },
        function (i) {
          state.openCollege = state.openCollege === i ? null : i;
          render();
          if (state.openCollege != null && h.same && !state.courses) loadCourses().then(render);
        })]));
    cc.appendChild(adoptPanel(h));
    c.appendChild(cc);

    c.appendChild(el("p", { cls: "exh-why", text: studentsLine(h) + " · " + h.why }));
    if (h.ids && h.ids.length) {
      var src = el("p", { cls: "exh-small" }, ["Source: "]);
      h.ids.slice(0, 3).forEach(function (id, k) {
        if (k) src.appendChild(document.createTextNode(", "));
        src.appendChild(el("a", { href: mapUrl(id), target: "_blank", rel: "noopener", text: id + " in MAP" }));
      });
      if (h.ids.length > 3) src.appendChild(document.createTextNode(" and " + (h.ids.length - 3) + " more"));
      c.appendChild(src);
    }

    var acts = el("div", { cls: "exh-acts" });
    acts.appendChild(word("Keep Current Title", function () { keepCurrent(h, title.value, issuer.value.trim()); }));
    acts.appendChild(word("Change to Proposed Title", function () { changeToProposed(h, title.value, issuer.value.trim()); }));
    acts.appendChild(word("Teach a rule", function () { state.teach = !state.teach; render(); }, { "aria-expanded": state.teach ? "true" : "false", "aria-controls": "exh-teach" }));
    acts.appendChild(word("Skip", function () { skip(list); }));
    c.appendChild(acts);
    if (state.teach) {
      var ta = el("textarea", { id: "exh-teach-words", rows: "3", cls: "exh-ta",
        placeholder: "The rule in plain words, as you would tell a session" });
      ta.value = state.teachDraft;
      ta.addEventListener("input", function () { state.teachDraft = ta.value; });
      var out = el("span", { cls: "exh-muted exh-small", "aria-live": "polite" });
      c.appendChild(el("div", { cls: "exh-teach", id: "exh-teach" }, [
        el("label", { "for": "exh-teach-words", cls: "exh-small", text: "A procedure joins the nightly run when a session adds it. Write it here and copy the message for a session." }),
        ta,
        el("div", { cls: "exh-acts" }, [word("Copy for a session", function () {
          copy(teachText(h, ta.value, title.value, issuer.value.trim()))
            .then(function () { out.textContent = "Copied. Paste it into a session."; })
            .catch(function () { ta.value = teachText(h, ta.value, title.value, issuer.value.trim()); ta.select(); out.textContent = "Select and copy the message in the box."; });
        }), out])]));
    }
    var next = list[state.cur + 1];
    c.appendChild(el("div", { cls: "exh-foot" }, [
      el("span", { text: (state.cur + 1) + " of " + fmt(list.length) + (state.filter ? " in " + state.filter : "")
        + (state.students ? " · most students first" : " · most colleges first") }),
      el("span", { text: next ? "Next: " + next.raw + ", " + shortList(whoBuilt(next)) : "" })]));
    return c;
  }

  function finder(list) {
    var wrap = el("div", { cls: "exh-finder" });
    wrap.appendChild(el("label", { cls: "exh-muted exh-small", "for": "exh-find", text: "Go to an exhibit" }));
    var input = el("input", { cls: "exh-search", id: "exh-find", type: "search", autocomplete: "off",
      placeholder: "Title, exhibit ID, college or course code", "aria-controls": "exh-results" });
    var results = el("ul", { cls: "exh-results", id: "exh-results", role: "listbox", "aria-label": "Matching exhibits" });
    results.hidden = true;
    function draw() {
      while (results.firstChild) results.removeChild(results.firstChild);
      var q = input.value.trim().toLowerCase();
      if (!q) { results.hidden = true; return; }
      var hits = [];
      list.forEach(function (h, i) {
        var hay = [h.raw, h.title, h.course || "", (h.ids || []).join(" "),
          whoBuilt(h).map(college).join(" "), whoBuilt(h).map(function (k) { return shortName(college(k)); }).join(" ")].join(" ").toLowerCase();
        if (hay.indexOf(q) !== -1) hits.push([h, i]);
      });
      if (!hits.length) {
        results.appendChild(el("li", { cls: "exh-none", text: state.filter
          ? "No held exhibit in " + state.filter + " matches." : "No held exhibit matches. Settled credentials are in the Common Exhibit Reference." }));
      }
      hits.slice(0, 40).forEach(function (p) {
        var h = p[0];
        var b = el("button", { type: "button", role: "option" }, [
          el("span", { cls: "exh-rt", text: h.raw }),
          el("span", { cls: "exh-chiprow" }, [
            el("span", { cls: "exh-rm", text: shortList(whoBuilt(h)) + (h.ids && h.ids[0] ? " · " + h.ids[0] : "") + (h.course ? " · " + h.course : "") }),
            el("span", { cls: "exh-chip", text: h.step })])]);
        b.addEventListener("click", function () {
          state.cur = p[1]; state.note = ""; state.openCollege = null; state.teach = false;
          render();
          var t = document.getElementById("exh-title");
          if (t) t.focus();
        });
        results.appendChild(el("li", null, [b]));
      });
      results.hidden = false;
    }
    input.addEventListener("input", draw);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var first = results.querySelector("button"); if (first) { e.preventDefault(); first.click(); } }
      if (e.key === "Escape") results.hidden = true;
    });
    wrap.appendChild(input);
    wrap.appendChild(results);
    return wrap;
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    ensureCss();
    root.removeAttribute("style");   // the pane's loading placeholder
    while (root.firstChild) root.removeChild(root.firstChild);
    var wrap = el("div", { cls: "exh-wrap" });
    root.appendChild(wrap);
    var head = el("div", { cls: "exh-titlebar" }, [el("h2", { cls: "exh-h", text: "Exhibits" })]);
    wrap.appendChild(head);
    if (state.error || !state.data) {
      wrap.appendChild(el("p", { cls: "exh-empty", text: state.error
        ? "The review file could not be read (" + state.error + ")." : "Reading the review queue…" }));
      return;
    }
    var d = state.data, src = d.sources || {};
    head.appendChild(el("span", { cls: "exh-muted exh-small", text: "Procedures run " + (stamp(src.procedures_run) || "not read")
      + " · queue built " + stamp(d.written_at) }));

    var group = el("div", { cls: "exh-group" }, [el("h3", { cls: "exh-q", text: "What is it called?" })]);
    var t = d.tiles || {};
    group.appendChild(el("div", { cls: "exh-dash", role: "list", "aria-label": "What is it called" }, [
      tile("Names", t.names && t.names.n, t.names && t.names.of, "MAP titles under a canonical credential",
        t.names ? fmt(t.names.waiting) + " wait for a title" : ""),
      tile("Aligned course", t.aligned && t.aligned.n, t.aligned && t.aligned.of,
        "held titles articulated to a course that names them", "The course names the proposal"),
      studentsTile()]));
    var steps = el("div", { cls: "exh-steps", role: "group", "aria-label": "Filter the review queue by CER step" },
      [stepTile("", "All held")].concat(STEPS.map(function (s) { return stepTile(s, s); }), [stepTile("Saved, not folded", "Saved, not folded")]));
    group.appendChild(steps);
    wrap.appendChild(group);

    wrap.appendChild(el("nav", { cls: "exh-views", "aria-label": "Views" }, [
      el("span", { cls: "exh-view-on", "aria-current": "page" }, ["Review ", el("span", { cls: "exh-n", text: fmt(stepCount("")) })]),
      el("a", { href: "#credential-reference", text: "Credentials, in the Common Exhibit Reference" }),
      el("a", { href: "#exhibit-adoption", text: "Adoption, in Exhibit Adoption" })]));

    var list = shown();
    if (state.cur >= list.length) state.cur = Math.max(0, list.length - 1);
    wrap.appendChild(finder(list));
    var status = el("p", { cls: "exh-status", role: "status", "aria-live": "polite", text: state.note || "" });
    wrap.appendChild(status);
    if (state.studentsWord === "signin" && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      var mount = el("div", { cls: "exh-signin" });
      wrap.appendChild(mount);
      window.CPL_REVIEWER_SIGNIN.mountInto(mount, { title: "Sign in to review",
        blurb: "A reviewer's sign-in saves titles and shows the students on each exhibit.", returnTab: "exhibits" });
    }
    if (!list.length) {
      wrap.appendChild(el("p", { cls: "exh-empty", text: "Nothing waits in this step tonight." }));
      return;
    }
    wrap.appendChild(card(list[state.cur], list));
  }

  /* ── the look: First Light tokens only ── */
  var CSS = [
    ".exh-wrap { display:grid; gap:16px; min-width:0; }",
    ".exh-titlebar { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:6px 18px; }",
    ".exh-h { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:clamp(1.5rem, 3vw, 2rem); }",
    ".exh-q { margin:0; font-family:var(--f-display, Georgia, serif); color:var(--seal-blue-text); font-size:1.05rem; font-weight:600; }",
    ".exh-muted { color:var(--text-muted); }",
    ".exh-small { font-size:.88rem; }",
    ".exh-group { display:grid; gap:8px; }",
    ".exh-dash, .exh-steps { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px; }",
    ".exh-tile { display:grid; gap:4px; align-content:start; padding:12px 14px; background:var(--surface); border:1px solid var(--border); border-radius:8px; min-width:0; }",
    ".exh-tl { font-size:.75rem; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); font-weight:600; }",
    ".exh-tn { color:var(--text-muted); font-variant-numeric:tabular-nums; }",
    ".exh-tn b { font-size:1.35rem; color:var(--text-strong); font-weight:600; }",
    ".exh-bar { height:6px; background:var(--border); border-radius:3px; overflow:hidden; }",
    ".exh-bar i { display:block; height:100%; background:var(--cobalt); }",
    ".exh-tt { font-size:.82rem; color:var(--text-muted); line-height:1.35; }",
    ".exh-ts { font-size:.85rem; color:var(--text-body); }",
    ".exh-step { position:relative; display:grid; gap:2px; text-align:left; padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-radius:8px; font:inherit; color:var(--text-body); cursor:pointer; min-width:0; min-height:24px; }",
    ".exh-step:hover { border-color:var(--border-strong); }",
    ".exh-step[disabled] { cursor:default; }",
    ".exh-sn { font-size:1.25rem; font-weight:600; color:var(--text-strong); font-variant-numeric:tabular-nums; }",
    ".exh-sl { font-size:.88rem; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    ".exh-step[disabled] .exh-sl { color:var(--text-muted); text-decoration:none; }",
    ".exh-step[aria-pressed='true'] { border:2px solid var(--seal-blue-text); padding:7px 11px; background:var(--surface-subtle); }",
    ".exh-step[aria-pressed='true'] .exh-sl { color:var(--text-strong); font-weight:600; text-decoration-thickness:2px; }",
    ".exh-chip { position:relative; display:inline-block; font-size:.75rem; font-weight:600; color:var(--text-muted); border:1px solid var(--border-strong); border-radius:999px; padding:1px 9px; background:var(--surface-subtle); white-space:nowrap; }",
    ".exh-chip[data-tip] { cursor:help; }",
    ".exh-chip[data-tip]:hover::after, .exh-chip[data-tip]:focus-visible::after, .exh-step[data-tip]:hover::after, .exh-step[data-tip]:focus-visible::after { content:attr(data-tip); position:absolute; left:0; top:calc(100% + 6px); z-index:3; width:max-content; max-width:min(300px, 80vw); white-space:normal; font-size:.82rem; font-weight:400; line-height:1.4; color:var(--text-body); background:var(--surface); border:1px solid var(--border-strong); border-radius:6px; padding:8px 10px; }",
    ".exh-views { display:flex; flex-wrap:wrap; gap:6px 22px; align-items:baseline; border-bottom:1px solid var(--border); padding-bottom:8px; font-size:.95rem; }",
    ".exh-view-on { color:var(--text-strong); font-weight:600; text-decoration:underline; text-decoration-thickness:3px; text-decoration-color:var(--seal-blue-text); text-underline-offset:3px; }",
    ".exh-n { color:var(--text-muted); font-weight:400; }",
    ".exh-wrap a { color:var(--cobalt); text-underline-offset:3px; }",
    "button.exh-w { all:unset; cursor:pointer; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; }",
    ".exh-acts button.exh-w { font-weight:600; }",
    "button.exh-w:focus-visible, .exh-wrap a:focus-visible, .exh-step:focus-visible, .exh-cchip:focus-visible, .exh-chip:focus-visible, .exh-results button:focus-visible { outline:2px solid var(--seal-blue); outline-offset:2px; }",
    ".exh-finder { position:relative; display:grid; gap:4px; }",
    ".exh-search { min-width:0; padding:8px 12px; border:1px solid var(--border-strong); border-radius:6px; background:var(--surface); color:var(--text-body); font:inherit; }",
    ".exh-results { list-style:none; margin:0; padding:4px 0; position:absolute; top:100%; left:0; right:0; z-index:4; background:var(--surface); border:1px solid var(--border-strong); border-radius:6px; max-height:320px; overflow-y:auto; }",
    ".exh-results[hidden] { display:none; }",
    ".exh-results button { display:grid; gap:2px; width:100%; text-align:left; background:none; border:0; padding:8px 12px; font:inherit; color:var(--text-body); cursor:pointer; }",
    ".exh-results button:hover { background:var(--surface-subtle); }",
    ".exh-rt { color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; overflow-wrap:anywhere; }",
    ".exh-rm { font-size:.82rem; color:var(--text-muted); overflow-wrap:anywhere; }",
    ".exh-none { padding:8px 12px; font-size:.88rem; color:var(--text-muted); }",
    ".exh-status { margin:0; min-height:1.2em; color:var(--text-body); }",
    ".exh-card { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:clamp(14px, 3vw, 24px); display:grid; gap:14px; min-width:0; }",
    ".exh-chiprow { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; }",
    ".exh-canon { display:grid; gap:6px; min-width:0; }",
    ".exh-canon p { margin:0; }",
    ".exh-edit { font-family:var(--f-display, Georgia, serif); font-size:clamp(1.3rem, 2.8vw, 1.8rem); font-weight:700; color:var(--seal-blue-text); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:4px 8px; width:100%; min-width:0; box-sizing:border-box; }",
    ".exh-inbox { display:flex; align-items:center; gap:6px; background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:3px 8px; min-width:0; font-size:.9rem; }",
    ".exh-inbox.exh-read { border-style:dashed; }",
    ".exh-pre { color:var(--text-muted); white-space:nowrap; }",
    ".exh-inbox input { flex:1 1 auto; min-width:0; border:0; background:transparent; font:inherit; color:var(--text-body); padding:2px 0; }",
    ".exh-inbox:focus-within { outline:2px solid var(--seal-blue); outline-offset:1px; }",
    ".exh-typed { display:grid; gap:4px; }",
    ".exh-typed ul { list-style:none; margin:0; padding:0; display:grid; gap:2px; font-size:.9rem; }",
    ".exh-now { background:var(--surface-subtle); border-left:3px solid var(--seal-blue-text); padding:4px 8px; color:var(--text-strong); overflow-wrap:anywhere; }",
    ".exh-under li { color:var(--text-muted); padding:0 11px; overflow-wrap:anywhere; }",
    ".exh-cl { font-size:.82rem; color:var(--text-muted); padding-top:3px; }",
    ".exh-colleges { display:grid; gap:8px; min-width:0; }",
    ".exh-ccrow { display:grid; grid-template-columns:minmax(0, 12em) minmax(0, 1fr); gap:4px 12px; align-items:start; }",
    ".exh-cchips { display:flex; flex-wrap:wrap; gap:4px 6px; min-width:0; align-items:center; }",
    ".exh-cchip { font-size:.82rem; color:var(--text-body); border:1px solid var(--border); border-radius:999px; padding:1px 9px; background:var(--surface-subtle); white-space:nowrap; }",
    "button.exh-cchip { font:inherit; font-size:.82rem; min-height:24px; color:var(--cobalt); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }",
    "button.exh-cchip[aria-expanded='true'] { color:var(--text-strong); text-decoration:none; border-color:var(--seal-blue-text); }",
    ".exh-adopt { border-left:3px solid var(--seal-blue-text); background:var(--surface-subtle); padding:8px 12px; display:grid; gap:6px; font-size:.9rem; }",
    ".exh-adopt[hidden] { display:none; }",
    ".exh-adopt h4 { margin:0; font-size:.9rem; color:var(--text-strong); }",
    ".exh-adopt ul { margin:0; padding-left:18px; display:grid; gap:2px; }",
    ".exh-adopt p { margin:0; }",
    ".exh-why { margin:0; color:var(--text-muted); border-left:2px solid var(--border-strong); padding-left:10px; overflow-wrap:anywhere; }",
    ".exh-card > p { margin:0; }",
    ".exh-acts { display:flex; flex-wrap:wrap; gap:8px 22px; align-items:center; }",
    ".exh-teach { display:grid; gap:6px; border-top:1px solid var(--border); padding-top:10px; }",
    ".exh-ta { font:inherit; color:var(--text-body); background:var(--surface-subtle); border:1px solid var(--border-strong); border-radius:6px; padding:6px 8px; width:100%; box-sizing:border-box; min-width:0; }",
    ".exh-foot { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px 16px; font-size:.88rem; color:var(--text-muted); }",
    ".exh-foot span { overflow-wrap:anywhere; min-width:0; }",
    ".exh-empty { color:var(--text-muted); margin:0; }",
    "@media (max-width: 560px) { .exh-ccrow { grid-template-columns:minmax(0, 1fr); } .exh-dash, .exh-steps { grid-template-columns:repeat(2, minmax(0, 1fr)); } }",
    "@media (prefers-reduced-motion: reduce) { .exh-wrap * { transition:none !important; } }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById("exh-css")) return;
    document.head.appendChild(el("style", { id: "exh-css", text: CSS }));
  }

  var booted = false;
  /* A visit starts on All held at the top (Sam, 2026-10-21: tabs never remember a filter); what was
     saved stays saved. */
  function newVisit() {
    state.filter = ""; state.cur = 0; state.openCollege = null; state.teach = false; state.note = "";
    render();
  }
  function boot() {
    if (booted) return Promise.resolve();
    booted = true;
    render();
    window.addEventListener("cpl-tab-activated", function (e) {
      if (e && e.detail && e.detail.tab === "exhibits") newVisit();
    });
    window.addEventListener("cpl-session-changed", function () { loadStudents().then(render); });
    return load().then(function () { render(); return loadStudents(); }).then(render);
  }

  window.CPL_EXHIBITS = {
    boot: boot, render: render, load: load, loadStudents: loadStudents, ensureCss: ensureCss,
    _state: state, _shown: shown, _teachText: teachText, _TIPS: TIPS
  };
})();
