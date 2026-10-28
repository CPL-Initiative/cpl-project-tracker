/*
 * funding-model/edit_page.js — EDIT THIS PAGE (Sam, 2026-10-15, call 1: "Show
 * and edit in the tab"; call 2: "Separate all four").
 *
 * funding-model/ is the one public funding page. A signed-in curator arranges
 * and edits it in place, here or in the Implementation Funding tab, which
 * frames this page as its Public page view. Entering Edit this page puts, under
 * each block's title, Rename (the page's own titles, pubTitles), Hide on this
 * page (secHidden by the block's public id) and Position (pubSecOrder); and
 * under each passage the word Edit, opening a plain-text editor with Bold,
 * Italic, Link, Save, Cancel and Restore the default text, which saves through
 * the funding module's setText; and beside each Contents link that names no
 * section (the memo, the videos, the help links) a Rename of its words (Sam,
 * 2026-10-25), saved as pubLinks. Step 1 stays first and never moves.
 *
 * Every title a reader meets renames here (Sam, 2026-10-26: "The edits I made
 * to the NC priority (and other) titles did not make it over to the public
 * page"): each sub-heading the page marks data-psub (pubTitles too), and each
 * noncredit outcome's label and title, the fields the tab's card edits. And the
 * bar says when this browser holds edits only it can see, which is where his
 * NC-1 relabel had gone.
 *
 * Every write goes through the funding module's own setters, so the layers,
 * the save, the newer-copy check and the database's RLS are the tab's, and the
 * page repaints through its paint() when the model changes. Nothing of this
 * file reaches a reader who cannot curate: the masthead word stays hidden and
 * no control is ever built.
 *
 * A hidden block stays on screen for the curator while editing, marked, so it
 * can be brought back from where it sits; a reader never sees it.
 */
(function () {
  "use strict";
  var T = window.CPL_FUNDING_TAB;
  var btn = document.getElementById("edit-page-btn");
  if (!T || !btn || typeof T.canCurate !== "function") return;
  var doc = document;
  var editing = false;
  var openKey = null;      // the passage whose editor is open
  var drafts = {};         // what the curator has typed, by passage
  var renaming = null;     // the block whose title is being edited
  var linkRenaming = null; // the fixed Contents link whose words are being edited
  var subRenaming = null;  // the sub-heading (data-psub) being renamed
  var ncRenaming = null;   // the noncredit outcome (its index) being renamed

  // Only inside COBI's Public page view, which frames this page (Sam, 2026-10-26: "hide
  // or delete the Edit link from the public view"); the public address never shows it.
  var framed = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();
  function may() { if (!framed) return false; try { return !!T.canCurate(); } catch (e) { return false; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function make(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function word(label, attrs) {
    var b = make("button", "pe-w");
    b.type = "button";
    b.textContent = label;
    Object.keys(attrs || {}).forEach(function (k) { b.setAttribute(k, attrs[k]); });
    return b;
  }

  // ── the CSS, injected once (First Light tokens only, the page's own) ──────
  function ensureCss() {
    if (doc.getElementById("pe-css")) return;
    var st = make("style");
    st.id = "pe-css";
    st.textContent = [
      "#edit-page-btn[aria-pressed=\"true\"]{color:var(--seal-blue); text-decoration-thickness:2px}",
      ".pe-bar{display:flex; flex-wrap:wrap; align-items:center; gap:6px 22px; padding:10px 14px; margin:0 0 12px;",
      "  background:var(--tint-cobalt); border-radius:4px; color:var(--text-strong); font-size:.95rem}",
      ".pe-bar p{margin:0; max-width:none}",
      ".pe-k{font-size:.74rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted)}",
      ".pe-blk{display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px; margin:0 0 12px; padding:8px 12px;",
      "  background:var(--tint-cobalt); border-radius:4px; font-size:.92rem; color:var(--text-strong)}",
      ".pe-w{font:inherit; font-size:.92rem; font-weight:600; color:var(--cobalt); background:none; border:0; padding:0 2px;",
      "  min-height:24px; text-decoration:underline; text-underline-offset:3px; cursor:pointer}",
      ".pe-w[aria-pressed=\"true\"]{color:var(--crimson)}",
      ".pe-w:focus-visible, .pe-pos select:focus-visible, .pe-ed textarea:focus-visible, .pe-title input:focus-visible{",
      "  outline:2px solid var(--focus-ring); outline-offset:2px; border-radius:2px}",
      ".pe-pos{display:inline-flex; align-items:center; gap:6px}",
      ".pe-pos select, .pe-title input{font:inherit; font-size:.92rem; min-height:32px; padding:2px 6px; color:var(--text-strong);",
      "  background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:4px}",
      ".pe-title{display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; margin:0 0 10px}",
      ".pe-title input{font-size:1.05rem; min-height:40px; padding:4px 10px; width:min(100%,28rem)}",
      ".pe-linkw{margin-left:8px; font-size:.84rem}",
      ".pe-linked{display:flex; flex-wrap:wrap; align-items:center; gap:6px 12px; margin:4px 0 8px}",
      ".pe-linked input{font:inherit; font-size:.92rem; min-height:32px; padding:2px 8px; width:min(100%,24rem); color:var(--text-strong);",
      "  background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:4px}",
      ".pe-linked input:focus-visible{outline:2px solid var(--focus-ring); outline-offset:2px}",
      ".pe-subw{display:block; margin:-.4em 0 .8em}",
      ".pe-localnote{flex-basis:100%; margin:0; padding:6px 10px; border-left:3px solid var(--crimson); background:var(--tint-crimson);",
      "  color:var(--text-strong); font-size:.9rem; max-width:none}",
      ".pe-nced{display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; margin:8px 0 4px}",
      ".pe-nced label{display:inline-flex; align-items:center; gap:6px; font-size:.92rem; color:var(--text-strong)}",
      ".pe-nced input{font:inherit; font-size:.95rem; min-height:36px; padding:2px 8px; color:var(--text-strong);",
      "  background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:4px}",
      ".pe-nced input:focus-visible{outline:2px solid var(--focus-ring); outline-offset:2px}",
      ".pe-nced .pe-ncl{width:10rem} .pe-nced .pe-nct{width:min(100%,28rem)}",
      ".pe-hidnote{margin:0 0 10px; padding:6px 10px; border-left:3px solid var(--crimson); background:var(--tint-crimson);",
      "  color:var(--text-strong); font-size:.9rem; max-width:none}",
      "body.page-editing [data-fsec].is-curator-hidden > *:not(.pe-keep){opacity:.6}",
      "body.page-editing [data-ftext], body.page-editing [data-ptext]{outline:1px dashed var(--border-strong); outline-offset:4px; border-radius:2px}",
      ".pe-passedit{display:inline-block; margin:2px 0 8px}",
      ".pe-ed{display:grid; gap:8px; margin:6px 0 12px; padding:10px 12px; background:var(--surface-subtle);",
      "  border:1px solid var(--border-strong); border-radius:6px}",
      ".pe-tools{display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px}",
      ".pe-ed textarea{width:100%; box-sizing:border-box; font:inherit; font-size:.95rem; line-height:1.55; color:var(--text-strong);",
      "  background:var(--surface-opaque); border:1px solid var(--border-strong); border-radius:4px; padding:8px 10px; min-height:140px; resize:vertical}",
      ".pe-hint{margin:0; font-size:.84rem; color:var(--text-muted); max-width:none}",
      ".pe-fixed{margin:8px 0 0; font-size:.85rem; color:var(--text-muted)}",
      ".pe-sr{position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap}",
      "@media print{ .pe-x{display:none !important} }"
    ].join("\n");
    doc.head.appendChild(st);
  }

  // ── blocks ────────────────────────────────────────────────────────────────
  function blocks() { return Array.prototype.slice.call(doc.querySelectorAll("main > [data-fsec]")); }
  function fixedTitle(id) {
    var list = typeof T.publicSections === "function" ? T.publicSections() : [];
    return list.some(function (x) { return x.id === id && x.fixedTitle; });
  }
  function houseTitle(sec) {
    var h = sec.querySelector("h2");
    if (!h) return "";
    var t = make("div", "", h.getAttribute("data-house-title") || h.innerHTML);
    return t.textContent.replace(/\s+/g, " ").trim();
  }
  function shownTitle(sec) {
    var h = sec.querySelector("h2");
    return h ? h.textContent.replace(/\s+/g, " ").trim() : "";
  }
  // Under the block's title, in its fold, never inside the <summary> (nested
  // interactive content fights the fold). The FAQ's fold body is repainted
  // whole, so its controls sit just before it.
  function placeFor(sec) {
    if (sec.id === "contents") {
      var card = sec.querySelector(".toc-card"), h = card && card.querySelector(".toc-h");
      return { parent: card, before: h ? h.nextSibling : null };
    }
    var fb = sec.querySelector(".fold-body");
    if (!fb) return null;
    if (fb.id === "faq-body") return { parent: fb.parentNode, before: fb };
    return { parent: fb, before: fb.firstChild };
  }
  function blockControls(sec, order) {
    var id = sec.getAttribute("data-fsec");
    var hidden = !!(T.secHidden && T.secHidden(id));
    var box = make("div", "pe-x pe-blk");
    box.setAttribute("data-pe-for", id);
    box.appendChild(make("span", "pe-k", "Curator only"));
    if (!fixedTitle(id)) box.appendChild(word("Rename", { "data-pe-rename": id, "aria-label": "Rename the block " + shownTitle(sec) }));
    box.appendChild(word(hidden ? "Hidden. Show it on this page" : "Hide on this page",
      { "data-pe-hide": id, "aria-pressed": hidden ? "true" : "false" }));
    var i = order.indexOf(id);
    var pid = "pe-pos-" + id;
    var lab = make("label", "pe-pos");
    lab.setAttribute("for", pid);
    lab.textContent = "Position ";
    var sel = make("select");
    sel.id = pid;
    sel.setAttribute("data-pe-pos", id);
    sel.setAttribute("aria-label", "Position of the block " + shownTitle(sec) + ", of " + order.length);
    order.forEach(function (_, j) {
      var o = make("option"); o.value = String(j); o.textContent = String(j + 1);
      if (j === i) o.selected = true;
      sel.appendChild(o);
    });
    lab.appendChild(sel);
    box.appendChild(lab);
    var frag = doc.createDocumentFragment();
    if (hidden) {
      var note = make("p", "pe-x pe-hidnote");
      note.textContent = "Colleges do not see this block. You still do, while editing.";
      frag.appendChild(note);
    }
    if (renaming === id) frag.appendChild(titleEditor(sec));
    frag.appendChild(box);
    return frag;
  }
  function titleEditor(sec) {
    var id = sec.getAttribute("data-fsec");
    var box = make("div", "pe-x pe-title");
    var tid = "pe-ti-" + id;
    box.innerHTML = '<label class="pe-sr" for="' + tid + '">Title of this block</label>' +
      '<input id="' + tid + '" type="text" value="' + esc(shownTitle(sec)) + '">';
    box.appendChild(word("Save", { "data-pe-titlesave": id }));
    box.appendChild(word("Cancel", { "data-pe-titlecancel": id }));
    if (houseTitle(sec) && shownTitle(sec) !== houseTitle(sec)) box.appendChild(word("Restore the default title", { "data-pe-titlereset": id }));
    var hint = make("span", "pe-hint");
    hint.textContent = "Plain text. Saves for the readers of this page, never for the Internal view.";
    box.appendChild(hint);
    return box;
  }

  // ── the Contents' fixed links (Sam, 2026-10-25: "make them editable (e.g., I
  //    want to edit the video title and memo titles)") ─────────────────────
  // The page keeps each link's house words on the element (data-house-label);
  // the landing link names the chosen college, so its editor holds the words
  // it shows while none is chosen.
  function fixedLinks() { return Array.prototype.slice.call(doc.querySelectorAll("#toc-list a[data-plink]")); }
  function linkHouse(a) { return a.getAttribute("data-house-label") || a.textContent.replace(/\s+/g, " ").trim(); }
  function linkOwn(a) { return T.pubLinkLabel(a.getAttribute("data-plink")) || linkHouse(a); }
  function linkControls() {
    if (typeof T.setPubLinkLabel !== "function") return;
    fixedLinks().forEach(function (a) {
      var id = a.getAttribute("data-plink"), li = a.parentNode;
      if (!li) return;
      if (linkRenaming === id) { li.appendChild(linkEditor(a)); return; }
      var w = word("Rename", { "data-pe-linkrename": id, "aria-label": "Rename the link " + linkOwn(a) });
      w.className += " pe-x pe-linkw";
      li.appendChild(w);
    });
  }
  function linkEditor(a) {
    var id = a.getAttribute("data-plink");
    var box = make("div", "pe-x pe-linked");
    var tid = "pe-li-" + id;
    box.innerHTML = '<label class="pe-sr" for="' + tid + '">Words of this link</label>' +
      '<input id="' + tid + '" type="text" maxlength="160" value="' + esc(linkOwn(a)) + '">';
    box.appendChild(word("Save", { "data-pe-linksave": id }));
    box.appendChild(word("Cancel", { "data-pe-linkcancel": id }));
    if (T.pubLinkLabel(id)) box.appendChild(word("Restore the default words", { "data-pe-linkreset": id }));
    return box;
  }

  // ── sub-headings (Sam, 2026-10-26) ──────────────────────────────────────
  // An h3 the page marks data-psub; its house words are kept on the element by
  // the page's own curation pass (data-house-title).
  function subHeads() {
    if (typeof T.pubSubTitle !== "function") return [];
    return Array.prototype.slice.call(doc.querySelectorAll("main [data-psub]"));
  }
  function plainOf(h, attr) {
    var t = make("div", "", attr ? (h.getAttribute(attr) || h.innerHTML) : h.innerHTML);
    return t.textContent.replace(/\s+/g, " ").trim();
  }
  function subControls() {
    subHeads().forEach(function (h) {
      var id = h.getAttribute("data-psub");
      if (subRenaming === id) { h.parentNode.insertBefore(subEditor(h), h.nextSibling); return; }
      var w = word("Rename", { "data-pe-subrename": id, "aria-label": "Rename the heading " + plainOf(h) });
      w.className += " pe-x pe-subw";
      h.parentNode.insertBefore(w, h.nextSibling);
    });
  }
  function subEditor(h) {
    var id = h.getAttribute("data-psub");
    var box = make("div", "pe-x pe-title pe-subed");
    var tid = "pe-st-" + id;
    box.innerHTML = '<label class="pe-sr" for="' + tid + '">Heading</label>' +
      '<input id="' + tid + '" type="text" maxlength="160" value="' + esc(plainOf(h)) + '">';
    box.appendChild(word("Save", { "data-pe-subsave": id }));
    box.appendChild(word("Cancel", { "data-pe-subcancel": id }));
    if (T.pubSubTitle(id)) box.appendChild(word("Restore the default heading", { "data-pe-subreset": id }));
    var hint = make("span", "pe-hint");
    hint.textContent = "Plain text. Saves for the readers of this page.";
    box.appendChild(hint);
    return box;
  }

  // ── the noncredit outcomes' labels and titles (Sam, 2026-10-26) ─────────
  // The same stored label and title the tab's card edits, so a rename here is
  // the tab's too. A cleared label reads NC-1, NC-2 again.
  function ncWords(i) {
    var list = typeof T._ncOutcomes === "function" ? T._ncOutcomes("1") : [];
    return list[i] || null;
  }
  function ncControls() {
    if (typeof T.setNcOutcomeWords !== "function") return;
    Array.prototype.forEach.call(doc.querySelectorAll("#nc-outcomes .prio[data-ncidx]"), function (card) {
      var i = Number(card.getAttribute("data-ncidx"));
      var p = ncWords(i);
      if (!p) return;
      var top = card.querySelector(".top");
      var at = top ? top.nextSibling : card.firstChild;
      if (ncRenaming === i) { card.insertBefore(ncEditor(i, p), at); return; }
      var w = word("Rename", { "data-pe-ncrename": String(i),
        "aria-label": "Rename the noncredit outcome " + p.label + (p.title ? ", " + p.title : "") });
      w.className += " pe-x pe-subw";
      card.insertBefore(w, at);
    });
  }
  function ncEditor(i, p) {
    var box = make("div", "pe-x pe-nced");
    box.innerHTML = '<label for="pe-ncl-' + i + '">Label <input class="pe-ncl" id="pe-ncl-' + i + '" type="text" maxlength="40" value="' +
      esc(p.label) + '" placeholder="NC-' + (i + 1) + '"></label>' +
      '<label for="pe-nct-' + i + '">Title <input class="pe-nct" id="pe-nct-' + i + '" type="text" maxlength="160" value="' +
      esc(p.title) + '"></label>';
    box.appendChild(word("Save", { "data-pe-ncsave": String(i) }));
    box.appendChild(word("Cancel", { "data-pe-nccancel": String(i) }));
    var hint = make("p", "pe-hint");
    hint.textContent = "Saves for everyone. The Implementation Funding tab's card reads the same label and title. " +
      "Clear the label to read NC-" + (i + 1) + ".";
    box.appendChild(hint);
    return box;
  }

  // ── passages ──────────────────────────────────────────────────────────────
  // [data-ftext] and [data-ptext] are the page's passages; the table's
  // introduction lives in the institution table, which redraws itself, so its
  // word and editor sit just above the table; the FAQ is its fold's body.
  function passages() {
    var out = [];
    Array.prototype.forEach.call(doc.querySelectorAll("main [data-ftext], main [data-ptext]"), function (box) {
      out.push({ key: box.getAttribute("data-ftext") || box.getAttribute("data-ptext"), after: box });
    });
    var mount = doc.getElementById("cplFundingMount");
    if (mount && mount.parentNode) out.push({ key: "x_table_intro", before: mount.parentNode, label: "Edit the table's introduction" });
    var faq = doc.getElementById("faq-body");
    if (faq) out.push({ key: "x_faq", after: faq, label: "Edit the questions" });
    return out;
  }
  function meta(key) { return (typeof T.textMeta === "function" && T.textMeta(key)) || { label: key, rows: 6 }; }
  function hintFor(m) {
    if (m.faq) return "A paragraph that opens with Q: starts a question; the paragraphs after it are its answer. A web address becomes a link.";
    var h = "A blank line starts a paragraph, and a paragraph of “> ” lines is a quotation. **bold**, *italic*, and [words](https://…) for a link.";
    if (m.rich) h = "A blank line starts a paragraph. Lines that open “- ” or “1. ” make a list, “> ” a quotation; Indent, or Tab " +
      "on a list line, nests it under the line above. **bold**, *italic*, [words](https://…) for a link, and a name in braces, " +
      "such as {cap}, for a figure the page fills in.";
    return h;
  }
  function editorFor(key) {
    var m = meta(key);
    var box = make("div", "pe-x pe-ed");
    box.setAttribute("data-pe-ed", key);
    var tid = "pe-ta-" + key;
    box.innerHTML = '<label class="pe-sr" for="' + tid + '">Edit ' + esc(m.label) + "</label>" +
      '<textarea id="' + tid + '" rows="' + (m.rows || 6) + '"></textarea>';
    var ta = box.querySelector("textarea");
    ta.value = drafts[key] != null ? drafts[key] : T.textPlain(key);
    ta.addEventListener("input", function () { drafts[key] = ta.value; });
    var tools = make("div", "pe-tools");
    tools.appendChild(word("Bold", { "data-pe-mark": "**", "data-pe-key": key }));
    tools.appendChild(word("Italic", { "data-pe-mark": "*", "data-pe-key": key }));
    // Indent and Outdent nest a list line (Sam, 2026-10-28: "I need a way to indent (tab) bullets"); Tab and
    // Shift+Tab on a list line do the same, and elsewhere move the focus as usual.
    if (m.rich && typeof T.indentLines === "function") {
      tools.appendChild(word("Indent", { "data-pe-indent": "1", "data-pe-key": key }));
      tools.appendChild(word("Outdent", { "data-pe-indent": "-1", "data-pe-key": key }));
      ta.addEventListener("keydown", function (e) {
        if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return;
        var r = T.indentLines(ta.value, ta.selectionStart, ta.selectionEnd, e.shiftKey ? -1 : 1, ta);
        if (!r.changed) return;
        e.preventDefault();
        drafts[key] = ta.value;
      });
    }
    if (!m.faq) tools.appendChild(word("Link", { "data-pe-link": key }));
    tools.appendChild(word("Save", { "data-pe-save": key }));
    tools.appendChild(word("Cancel", { "data-pe-cancel": key }));
    if (T.textIsCustom(key)) tools.appendChild(word("Restore the default text", { "data-pe-restore": key }));
    box.appendChild(tools);
    var hint = make("p", "pe-hint");
    hint.textContent = hintFor(m) + (m.followsTab
      ? " Until you save it here, this passage shows the Internal view’s Introduction."
      : " Saves for everyone who reads this page.");
    box.appendChild(hint);
    return box;
  }
  function passageWord(p) {
    var m = meta(p.key);
    var b = word(p.label || "Edit", { "data-pe-edit": p.key, "aria-label": "Edit " + m.label });
    b.className += " pe-x";
    return b;
  }
  function placePassage(p, node) {
    var cls = node.classList;
    if (cls && !cls.contains("pe-passedit") && !cls.contains("pe-ed")) cls.add("pe-passedit");
    if (p.before) p.before.parentNode.insertBefore(node, p.before);
    else p.after.parentNode.insertBefore(node, p.after.nextSibling);
  }

  // ── the bar under the masthead, and Step 1's line ─────────────────────────
  var SAVE_WORDS = {
    saving: "Saving…",
    saved: "Saved for everyone who reads this page.",
    stale: "Not saved: a newer copy was saved elsewhere. The page shows it now; make the change again.",
    err: "Not saved: the database did not accept this sign-in. Sign in again on COBI and retry."
  };
  function bar() {
    var b = make("div", "pe-x pe-bar wrap");
    b.setAttribute("role", "region");
    b.setAttribute("aria-label", "Editing this page");
    var p = make("p");
    p.innerHTML = '<span class="pe-k">Curator only</span> Editing this page. Each change saves for everyone who reads it.';
    b.appendChild(p);
    // Edits this browser holds that the page never shows: the tab shows them
    // over the shared scenario, and a public page reads the shared scenario
    // alone. Said here because this is where their absence is noticed.
    var local = typeof T.localOnlyAreas === "function" ? T.localOnlyAreas() : [];
    if (local.length) {
      var ln = make("p", "pe-localnote");
      ln.textContent = "This browser holds changes to " + local.join(", ") + " that only you can see. " +
        "The Implementation Funding tab shows them; this page does not. Publish them from the tab " +
        "(Publish this browser's changes), or make them again here.";
      b.appendChild(ln);
    }
    if (T.pubOrderIsCustom && T.pubOrderIsCustom()) b.appendChild(word("Restore the default order", { "data-pe-orderreset": "1" }));
    b.appendChild(word("Done", { "data-pe-done": "1" }));
    var st = make("p", "pe-hint");
    st.setAttribute("aria-live", "polite");
    st.textContent = SAVE_WORDS[(T.saveState && T.saveState()) || ""] || "";
    b.appendChild(st);
    return b;
  }

  // ── draw and redraw, idempotent ───────────────────────────────────────────
  function clear() {
    Array.prototype.forEach.call(doc.querySelectorAll(".pe-x"), function (e) { e.remove(); });
  }
  function sync() {
    if (!may()) { btn.hidden = true; if (editing) setEditing(false); return; }
    btn.hidden = false;
    if (!editing) return;
    // Remember the focused control, so a redraw under the curator keeps them in place.
    var ae = doc.activeElement, keep = null;
    if (ae && ae.closest && ae.closest(".pe-x")) {
      keep = ["data-pe-rename", "data-pe-hide", "data-pe-pos", "data-pe-edit", "data-pe-orderreset", "data-pe-linkrename",
        "data-pe-subrename", "data-pe-ncrename"].reduce(function (k, a) {
        return k || (ae.getAttribute(a) != null ? "[" + a + '="' + ae.getAttribute(a) + '"]' : null);
      }, null) || (ae.id ? "#" + ae.id : null);
      if (ae.tagName === "TEXTAREA") drafts[ae.id.replace(/^pe-ta-/, "")] = ae.value;
    }
    var sel = ae && ae.tagName === "TEXTAREA" ? [ae.selectionStart, ae.selectionEnd] : null;
    clear();
    var masthead = doc.querySelector(".masthead");
    if (masthead) masthead.parentNode.insertBefore(bar(), masthead.nextSibling);
    var step = doc.querySelector(".step1-wrap");
    if (step) {
      var fx = make("p", "pe-x pe-fixed");
      fx.textContent = "Step 1 stays first. It is the one block that never moves.";
      step.appendChild(fx);
    }
    var order = T.publicSectionOrder();
    blocks().forEach(function (sec) {
      var at = placeFor(sec);
      if (at && at.parent) at.parent.insertBefore(blockControls(sec, order), at.before);
    });
    passages().forEach(function (p) {
      placePassage(p, openKey === p.key ? editorFor(p.key) : passageWord(p));
    });
    linkControls();
    subControls();
    ncControls();
    if (keep) {
      var back = doc.querySelector(keep);
      if (back) { try { back.focus({ preventScroll: true }); } catch (e) { back.focus(); } }
      if (back && sel && back.tagName === "TEXTAREA") { try { back.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
    }
  }
  function repaint() { if (typeof window.CPL_REPAINT === "function") window.CPL_REPAINT(); }
  function setEditing(on) {
    editing = !!on && may();
    doc.body.classList.toggle("page-editing", editing);
    btn.setAttribute("aria-pressed", editing ? "true" : "false");
    btn.textContent = editing ? "Done editing" : "Edit this page";
    if (!editing) { openKey = null; renaming = null; linkRenaming = null; subRenaming = null; ncRenaming = null; clear(); }
    ensureCss();
    repaint();      // a hidden block shows, or hides again
    sync();
  }

  // ── what the controls do ──────────────────────────────────────────────────
  function focusSoon(selector) {
    var e = doc.querySelector(selector);
    if (e) { try { e.focus(); } catch (er) {} }
  }
  doc.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-pe-rename], [data-pe-hide], [data-pe-edit], " +
      "[data-pe-save], [data-pe-cancel], [data-pe-restore], [data-pe-mark], [data-pe-link], " +
      "[data-pe-titlesave], [data-pe-titlecancel], [data-pe-titlereset], [data-pe-done], [data-pe-orderreset], " +
      "[data-pe-linkrename], [data-pe-linksave], [data-pe-linkcancel], [data-pe-linkreset], " +
      "[data-pe-subrename], [data-pe-subsave], [data-pe-subcancel], [data-pe-subreset], " +
      "[data-pe-ncrename], [data-pe-ncsave], [data-pe-nccancel]") : null;
    if (!t || !editing || !t.closest(".pe-x")) return;
    var a = function (n) { return t.getAttribute(n); };
    if (a("data-pe-done") != null) { setEditing(false); btn.focus(); return; }
    if (a("data-pe-orderreset") != null) { T.resetPublicSectionOrder(); return; }
    if (a("data-pe-rename") != null) { renaming = a("data-pe-rename"); sync(); focusSoon("#pe-ti-" + renaming); return; }
    if (a("data-pe-titlecancel") != null) { var c = renaming; renaming = null; sync(); focusSoon('[data-pe-rename="' + c + '"]'); return; }
    if (a("data-pe-titlesave") != null || a("data-pe-titlereset") != null) {
      var id = a("data-pe-titlesave") || a("data-pe-titlereset");
      var sec = doc.querySelector('main > [data-fsec="' + id + '"]');
      var inp = doc.getElementById("pe-ti-" + id);
      renaming = null;
      T.setPubTitle(id, a("data-pe-titlereset") != null ? "" : (inp ? inp.value : ""), sec ? houseTitle(sec) : "");
      sync(); focusSoon('[data-pe-rename="' + id + '"]');
      return;
    }
    if (a("data-pe-linkrename") != null) {
      e.preventDefault();
      linkRenaming = a("data-pe-linkrename"); sync(); focusSoon("#pe-li-" + linkRenaming); return;
    }
    if (a("data-pe-linkcancel") != null) {
      var lc = linkRenaming; linkRenaming = null; sync(); focusSoon('[data-pe-linkrename="' + lc + '"]'); return;
    }
    if (a("data-pe-linksave") != null || a("data-pe-linkreset") != null) {
      var lid = a("data-pe-linksave") || a("data-pe-linkreset");
      var link = doc.querySelector('#toc-list a[data-plink="' + lid + '"]');
      var lin = doc.getElementById("pe-li-" + lid);
      linkRenaming = null;
      T.setPubLinkLabel(lid, a("data-pe-linkreset") != null ? "" : (lin ? lin.value : ""), link ? linkHouse(link) : "");
      sync(); focusSoon('[data-pe-linkrename="' + lid + '"]');
      return;
    }
    if (a("data-pe-subrename") != null) { subRenaming = a("data-pe-subrename"); sync(); focusSoon("#pe-st-" + subRenaming); return; }
    if (a("data-pe-subcancel") != null) {
      var sc = subRenaming; subRenaming = null; sync(); focusSoon('[data-pe-subrename="' + sc + '"]'); return;
    }
    if (a("data-pe-subsave") != null || a("data-pe-subreset") != null) {
      var sid = a("data-pe-subsave") || a("data-pe-subreset");
      var sh = doc.querySelector('main [data-psub="' + sid + '"]');
      var sin = doc.getElementById("pe-st-" + sid);
      subRenaming = null;
      T.setPubTitle(sid, a("data-pe-subreset") != null ? "" : (sin ? sin.value : ""), sh ? plainOf(sh, "data-house-title") : "");
      sync(); focusSoon('[data-pe-subrename="' + sid + '"]');
      return;
    }
    if (a("data-pe-ncrename") != null) { ncRenaming = Number(a("data-pe-ncrename")); sync(); focusSoon("#pe-ncl-" + ncRenaming); return; }
    if (a("data-pe-nccancel") != null) {
      var nc = ncRenaming; ncRenaming = null; sync(); focusSoon('[data-pe-ncrename="' + nc + '"]'); return;
    }
    if (a("data-pe-ncsave") != null) {
      var ni = Number(a("data-pe-ncsave"));
      var nl = doc.getElementById("pe-ncl-" + ni), nt = doc.getElementById("pe-nct-" + ni);
      ncRenaming = null;
      T.setNcOutcomeWords(ni, nl ? nl.value : "", nt ? nt.value : "");
      sync(); focusSoon('[data-pe-ncrename="' + ni + '"]');
      return;
    }
    if (a("data-pe-hide") != null) {
      var hid = a("data-pe-hide");
      T.setSecHidden(hid, !T.secHidden(hid));
      return;
    }
    if (a("data-pe-edit") != null) { openKey = a("data-pe-edit"); sync(); focusSoon("#pe-ta-" + openKey); return; }
    if (a("data-pe-cancel") != null) {
      var ck = a("data-pe-cancel"); openKey = null; delete drafts[ck]; sync(); focusSoon('[data-pe-edit="' + ck + '"]'); return;
    }
    if (a("data-pe-save") != null || a("data-pe-restore") != null) {
      var key = a("data-pe-save") || a("data-pe-restore");
      var ta = doc.getElementById("pe-ta-" + key);
      openKey = null; delete drafts[key];
      T.setText(key, a("data-pe-restore") != null ? "" : (ta ? ta.value : ""), a("data-pe-restore") != null);
      sync(); focusSoon('[data-pe-edit="' + key + '"]');
      return;
    }
    if (a("data-pe-indent") != null) {
      var ik = a("data-pe-key"), iarea = doc.getElementById("pe-ta-" + ik);
      if (!iarea) return;
      if (T.indentLines(iarea.value, iarea.selectionStart || 0, iarea.selectionEnd || 0, Number(a("data-pe-indent")), iarea).changed) drafts[ik] = iarea.value;
      iarea.focus();
      return;
    }
    if (a("data-pe-mark") != null || a("data-pe-link") != null) {
      var mk = a("data-pe-key") || a("data-pe-link");
      var area = doc.getElementById("pe-ta-" + mk);
      if (!area) return;
      var s0 = area.selectionStart || 0, s1 = area.selectionEnd || 0;
      if (a("data-pe-mark") != null) T.wrapMark(area.value, s0, s1, a("data-pe-mark"), area);
      else {
        // [the selected words](https://), with the address selected to type over.
        var words = area.value.slice(s0, s1) || "words";
        var ins = "[" + words + "](https://)";
        area.value = area.value.slice(0, s0) + ins + area.value.slice(s1);
        var at = s0 + words.length + 3;
        try { area.setSelectionRange(at, at + 8); } catch (er) {}
      }
      drafts[mk] = area.value;
      area.focus();
    }
  });
  doc.addEventListener("change", function (e) {
    var t = e.target;
    if (!editing || !t || !t.getAttribute || t.getAttribute("data-pe-pos") == null) return;
    var id = t.getAttribute("data-pe-pos");
    T.movePublicSection(T.publicSectionOrder().indexOf(id), Number(t.value));
  });
  // Escape leaves a title edit. A passage's editor keeps what was typed until
  // Cancel, so a stray key never throws a paragraph away.
  doc.addEventListener("keydown", function (e) {
    if (!editing || !e.target || !e.target.closest) return;
    // Enter saves a link's words; Escape leaves its editor.
    if (e.target.closest(".pe-linked")) {
      var lk = linkRenaming;
      if (e.key === "Enter") { e.preventDefault(); var sv = doc.querySelector('[data-pe-linksave="' + lk + '"]'); if (sv) sv.click(); }
      else if (e.key === "Escape") { linkRenaming = null; sync(); focusSoon('[data-pe-linkrename="' + lk + '"]'); }
      return;
    }
    // Enter saves a sub-heading or a noncredit outcome; Escape leaves it.
    if (e.target.closest(".pe-subed") || e.target.closest(".pe-nced")) {
      var sub = !!e.target.closest(".pe-subed");
      var cur = sub ? subRenaming : ncRenaming;
      if (e.key === "Enter") {
        e.preventDefault();
        var go = doc.querySelector(sub ? '[data-pe-subsave="' + cur + '"]' : '[data-pe-ncsave="' + cur + '"]');
        if (go) go.click();
      } else if (e.key === "Escape") {
        if (sub) subRenaming = null; else ncRenaming = null;
        sync(); focusSoon(sub ? '[data-pe-subrename="' + cur + '"]' : '[data-pe-ncrename="' + cur + '"]');
      }
      return;
    }
    if (e.key !== "Escape" || !e.target.closest(".pe-title")) return;
    var r = renaming; renaming = null; sync(); focusSoon('[data-pe-rename="' + r + '"]');
  });
  btn.addEventListener("click", function () { setEditing(!editing); });

  // Every model change: the page has repainted (its subscriber runs first), so
  // the controls follow what it now shows. A sign-in that lapses removes them.
  if (typeof T.onModelChange === "function") T.onModelChange(sync);
  window.CPL_EDIT_PAGE = { set: setEditing, sync: sync, editing: function () { return editing; } };
  sync();
})();
