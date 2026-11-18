/* commons_data_cards.js: three cards on a college's side panel in College Data Collection (#commons/data).
//
// Sam's asks of 2026-11-14 (#3310, item 2 and item 5's college line), looking at Columbia College's cards. He will
// show this page to the Chancellor's Office research and data staff, so every line says what a committed file
// records, or says plainly that nothing records it:
//   How it's collected      per lane (catalog source, program requirements, course SLOs and objectives, program
//                           PLOs): the reader or workflow that did the work, its last run and its cost.
//   Program pathway maps    whether the college publishes maps, where and on what platform, how many we hold, how
//                           they line up with its Active programs. "None found when looked for" reads apart from
//                           "not looked for yet". It takes the Pathway source line out of the Catalog source card.
//   Data sources            the SIS, the curriculum system that holds the outlines, the catalog platform, the
//                           program maps and COCI: each read directly, read through an export, or not read yet.
//                           A system nothing records reads "not known"; no SIS is ever inferred from a district or
//                           a vendor. The SIS and curriculum system integration line sits under it ("CMS" in the
//                           ask is the curriculum system, never a web content system): "none known" unless a
//                           college is recorded in the builder's SIS_CMS_INTEGRATION.
// The data: the builder's per-college "collection" key and the top-level "collection" key
// (kb/_build_commons_data_status.py, collection_facts), joined here with the live read's registry booleans.
// commons_data.js calls sections(M, c, H) from its panel and passes its own helpers as H, so the panel's look, dates
// and words stay one module's. Contacts by role only; no person's name. Words, never glyphs. Tokens only.
// Guard: tests/commons_data_cards.test.js. */
(function () {
  "use strict";

  var CSS_ID = "cdc-cards-css";
  /* Only what the panel's own rules (commons_data.js) do not already give: the lanes' spacing. Tokens only. */
  var CSS = [
    ".cdc-card ul.cdc-introws { margin:0; padding-left:20px; display:grid; gap:2px; color:var(--cmn-ink-2); font-size:.9rem; }",
    ".cdc-card .cdc-lane { display:grid; gap:4px; padding-top:8px; border-top:1px dashed var(--cmn-line-soft); }",
    ".cdc-card .cdc-lane:first-of-type { border-top:0; padding-top:0; }",
    ".cdc-card .cdc-lane > h4 { margin:0; font-size:.92rem; color:var(--cmn-heading); }",
    ".cdc-card .cdc-lane > .cdd-state { font-size:.88rem; }",
    ".cdc-card .cdc-word { margin:0; }"
  ].join("\n");
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    (document.head || document.body).appendChild(s);
  }

  var NOT = "Not recorded";
  function money(v) { return "$" + Number(v).toFixed(2); }

  /* The registry's pathway state from the live read: held, none found when looked for, or not looked for yet. */
  function pathwayState(H, M, c) {
    var g = ((H.liveOf(M, c) || {}).registry) || null;
    if (!g || g.row === false) return "unknown";
    return g.sequence_source ? "held" : g.sequence_checked ? "none" : "unknown";
  }
  function activeOf(H, M, c) {
    var lv = H.liveOf(M, c);
    return lv && lv.programs && lv.programs.active != null ? lv.programs.active : null;
  }
  function outlineWord(kind) { return kind === "catalog" ? "the course pages of its public catalog" : "its public course outline reports"; }

  /* ── How it's collected: one block per lane ── */
  function lanes(M, c, H) {
    var k = c.collection || {}, pr = k.program_reader, sr = k.slo_read, top = (M.collection || {});
    var L = [];
    /* Catalog source: the scout where it checked the college, else the registry link the capture read. */
    if (c.scout) L.push({ key: "catalog", label: "Catalog source", state: "Held",
      lines: [["Who or what", "The source scout, wave " + (c.scout.wave || "not recorded")], ["Last run", c.scout.checked_at ? H.when(c.scout.checked_at) : NOT], ["Cost", NOT]] });
    else if (c.platform) L.push({ key: "catalog", label: "Catalog source", state: "Held",
      lines: [["Who or what", "The program source registry's catalog link, read by the program requirements capture"],
        ["Last run", c.read_at ? H.when(c.read_at) + " (the capture)" : NOT], ["Cost", NOT]] });
    else L.push({ key: "catalog", label: "Catalog source", state: "Not known", lines: [["Who or what", NOT], ["Last run", NOT], ["Cost", NOT]] });

    /* Program requirements: the capture and extraction, the model each record names, the run's receipt. */
    if (pr) {
      var models = Object.keys(pr.models || {});
      var wf = ((top.program_reader || {}).workflows || []).join(", or ");
      L.push({ key: "programs", label: "Program requirements", state: "Held",
        lines: [["Who or what", "The program requirements reader for " + (H.platformWord(pr.platform) || "its") + " catalogs: a capture, then extraction by "
            + (models.length ? models.join(" and ") : "a model the records do not name") + ", " + H.fmt(pr.records) + " records filed"],
          ["Workflow", (wf ? wf + " (the receipt does not say which)" : NOT) + (pr.run ? "; GitHub Actions run " + pr.run : "")],
          ["Last run", pr.at ? H.when(pr.at) : NOT], ["Cost", pr.cost_usd != null ? money(pr.cost_usd) + ", from the run's receipt" : NOT]] });
    } else L.push({ key: "programs", label: "Program requirements", state: "Not read yet", lines: [["Who or what", NOT], ["Last run", NOT], ["Cost", NOT]] });

    /* Course SLOs and objectives: the course outcomes reader, which opens pages and calls no model. */
    var lo = ((H.liveOf(M, c) || {}).outcomes) || {}, sloR = top.slo_reader || {};
    if (sr) L.push({ key: "slos", label: "Course SLOs and objectives", state: "Held", word: ["The SLO and objective courses collected", { k: "slos" }],
      lines: [["Who or what", "The course outcomes reader (" + (sloR.script || NOT) + "), reading " + (H.platformWord(sr.system) || "the outline system") + ": " + outlineWord(sr.source_kind)],
        ["Workflow", (sloR.workflow || NOT) + (sr.run ? "; GitHub Actions run " + sr.run : "")],
        ["Last run", sr.at ? H.when(sr.at) : NOT], ["Cost", sloR.cost || NOT]] });
    else if (lo.slo_courses || lo.objective_courses) L.push({ key: "slos", label: "Course SLOs and objectives", state: "Held", word: ["The SLO and objective courses collected", { k: "slos" }],
      lines: [["Who or what", "Not recorded: the database count holds them, and no committed read names this college"],
        ["Last run", lo.slo_loaded_at ? H.when(lo.slo_loaded_at) + " (loaded)" : NOT], ["Cost", NOT]] });
    else L.push({ key: "slos", label: "Course SLOs and objectives", state: "Not read yet", lines: [["Who or what", NOT], ["Last run", NOT], ["Cost", NOT]] });

    /* Program PLOs: filed with each program record by the same reader, so its cost is the same run's. */
    var n = k.plo_programs || 0;
    if (pr && n) L.push({ key: "plos", label: "Program PLOs", state: "Held", word: [H.fmt(n) + (n === 1 ? " program record carries" : " program records carry") + " PLOs", { k: "plos" }],
      lines: [["Who or what", "The program requirements reader, with each program record (the same run)"], ["Last run", pr.at ? H.when(pr.at) : NOT],
        ["Cost", "Part of the program requirements read; not recorded apart"]] });
    else if (pr) L.push({ key: "plos", label: "Program PLOs", state: "None found when looked for",
      note: "The program requirements reader files a program's PLOs with its record; none of this college's committed records carries any.",
      lines: [["Who or what", "The program requirements reader, with each program record"], ["Last run", pr.at ? H.when(pr.at) : NOT], ["Cost", "Part of the program requirements read; not recorded apart"]] });
    else L.push({ key: "plos", label: "Program PLOs", state: "Not read yet", lines: [["Who or what", NOT], ["Last run", NOT], ["Cost", NOT]] });
    return L;
  }

  /* ── Program pathway maps ── */
  function maps(M, c, H) {
    var k = c.collection || {}, ppm = k.ppm_member, held = (k.maps || {}).held || 0, onr = (k.maps || {}).on_records || 0;
    var reg = pathwayState(H, M, c), act = activeOf(H, M, c);
    /* One rule with the statewide line: commons_data.js's mapState, through the helpers; the same rule inline when a
       caller passes none. */
    var state = H.mapState ? H.mapState(M, c) : ppm || reg === "held" || held ? "held" : reg === "none" ? "none" : "unknown";
    var lines = [];
    lines.push(["Publishes maps", state === "held" ? "Yes" : state === "none" ? "None found when looked for" : "Not looked for yet"]);
    lines.push(["Program source registry", reg === "held" ? "Holds a map source" + (H.liveRead(M) ? " (" + H.liveWords(M) + ")" : "")
      : reg === "none" ? "None found when looked for" + (H.liveRead(M) ? " (" + H.liveWords(M) + ")" : "") : "Not looked for yet"]);
    lines.push(["Program Pathways Mapper member list", ppm ? "Listed, at " + ppm.host : "Not on the committed list"]);
    lines.push(["Where", ppm ? ppm.host : state === "held" ? "Not recorded: the database count holds whether a source is on record, never its address" : state === "none" ? "None found" : "Not known"]);
    lines.push(["Platform", ppm ? "Program Pathways Mapper" : state === "held" ? NOT : state === "none" ? "None found" : "Not known"]);
    lines.push(["Maps we hold", held ? H.fmt(held) + (held === 1 ? " term-by-term map" : " term-by-term maps") + ", committed" : "None"]);
    lines.push(["Against Active programs", held
      ? H.fmt(onr) + " of the " + H.fmt(held) + " name a program in the college's committed program records" + (act != null ? ", of " + H.fmt(act) + " Active programs (" + H.liveWords(M) + ")" : "")
      : "None held, so none to line up" + (act != null ? " with its " + H.fmt(act) + " Active programs (" + H.liveWords(M) + ")" : "")]);
    var note = ppm && reg === "none" ? "The member list and the registry's check disagree: the list names a mapper, and the registry's reader found none." : null;
    return { state: state, lines: lines, note: note,
      src: "The program source registry (database count); the Program Pathways Mapper member list copied from programmapper.org/ppm-schools on Oct 21, 2026 ("
        + (((M.collection || {}).ppm_list || {}).file || NOT) + "); the committed maps (" + ((((M.collection || {}).maps) || {}).files || NOT) + ")." };
  }

  /* ── Data sources: each system, and how we read it ── */
  function sources(M, c, H) {
    var k = c.collection || {}, sr = k.slo_read, top = M.collection || {};
    var g = ((H.liveOf(M, c) || {}).registry) || {};
    var R = [];
    R.push({ key: "sis", label: "Student information system (SIS)", system: "Not known", read: "Not read yet" });
    var os = (c.outline_system || [])[0];
    R.push({ key: "cms", label: "Curriculum system (course outlines)",
      system: os ? H.platformWord(os) : g.course_outline_link ? "Not known; the program source registry holds a public curriculum view" : "Not known",
      read: os && sr ? "Read directly: " + outlineWord(sr.source_kind) : os ? "Read directly" : "Not read yet" });
    R.push({ key: "catalog", label: "Catalog platform", system: c.platform ? H.platformWord(c.platform) : "Not known",
      read: c.platform ? "Read directly: " + (c.platform === "pdf" ? "the catalog PDF" : "its public catalog pages") + ", by the program requirements capture" : "Not read yet" });
    var m = maps(M, c, H), held = (k.maps || {}).held || 0;
    R.push({ key: "maps", label: "Program maps",
      system: k.ppm_member ? "Program Pathways Mapper (" + k.ppm_member.host + ")" : m.state === "held" ? "A map source is on record; its platform is not recorded" : m.state === "none" ? "None found when looked for" : "Not known",
      read: held ? "Read directly: " + H.fmt(held) + (held === 1 ? " map" : " maps") + " committed" : m.state === "none" ? "Nothing to read" : "Not read yet" });
    var act = activeOf(H, M, c), cx = top.coci || {};
    R.push({ key: "coci", label: "COCI (the Chancellor's Office Curriculum Inventory)", system: "COCI",
      read: "Read through an export: the committed COCI course and program extracts" + (cx.workflow ? ", loaded by the " + cx.workflow + " workflow" : "")
        + (act != null ? "; the " + H.fmt(act) + " Active programs here come from it (" + H.liveWords(M) + ")" : "") });
    return R;
  }
  var INTEGRATION_WORDS = { none_known: "None known", ask: "Ask the MAP team's curriculum system lead to confirm", live: "Connected", planned: "Planned" };
  /* The line reads the integrations registry's rows for this college (#3310 item 5: kb/cdc_integrations.json through
     commons_data_integrations.js, CPL_CDC_INTEGRATIONS.forCollege), one per system: SIS APIs, curriculum system APIs.
     A connection the builder records (SIS_CMS_INTEGRATION) still speaks first; with neither, none known. */
  function integration(c, H) {
    var i = (c.collection || {}).integration || { state: "none_known" };
    var R = window.CPL_CDC_INTEGRATIONS, rows = i.state === "none_known" && R && R.forCollege && H && H.slugOf ? R.forCollege(H.slugOf(c)) : [];
    if (rows.length) {
      var known = rows.filter(function (r) { return r.state && r.state !== "none known"; });
      return { state: known.length ? "registry" : "none_known", rows: rows,
        text: known.length ? rows.map(function (r) { return r.name + ": " + r.state; }).join("; ") : "None known" };
    }
    return { state: i.state, text: (INTEGRATION_WORDS[i.state] || "None known") + (i.note ? ". " + i.note : "") };
  }

  /* The three cards as panel sections, in the panel's own look. */
  function sections(M, c, H) {
    if (!M || !c) return [];
    ensureCss();
    var el = H.el, out = [];
    function card(key, h, kids) { var s = H.section(h, kids); s.classList.add("cdc-card"); s.setAttribute("data-card", key); return s; }
    function word(w) { return w ? el("p", { cls: "cdd-of cdd-dsword cdc-word" }, [H.paneWord(w[0], w[1], c.id)]) : null; }

    out.push(card("how", "How it's collected", [el("p", { cls: "cdd-src", text: "Who or what collected each lane, its last run and its cost, from the committed receipts. A piece no file records says so." })]
      .concat(lanes(M, c, H).map(function (l) {
        return el("div", { cls: "cdc-lane", "data-lane": l.key }, [el("h4", { text: l.label }), el("p", { cls: "cdd-state", text: l.state }),
          l.note ? el("p", { cls: "cdd-of", text: l.note }) : null, H.dl(l.lines), word(l.word)]);
      }))));

    var m = maps(M, c, H);
    out.push(card("maps", "Program pathway maps", [el("p", { cls: "cdd-state", "data-state": m.state, text: m.state === "held" ? "Publishes maps" : m.state === "none" ? "None found when looked for" : "Not looked for yet" }),
      m.note ? el("p", { cls: "cdd-of", text: m.note }) : null, H.dl(m.lines), el("p", { cls: "cdd-src", text: "Source: " + m.src })]));

    var I = integration(c, H);
    out.push(card("sources", "Data sources", [el("p", { cls: "cdd-src", text: "The systems behind this college's data, and how we read each: directly, through an export, or not yet. A system no file names reads not known." }),
      H.dl(sources(M, c, H).map(function (r) { return [r.label, r.system + ". " + r.read + "."]; })),
      el("div", { cls: "cdc-lane", "data-lane": "integration" }, [el("h4", { text: "SIS and curriculum system integration" }), el("p", { cls: "cdd-state", "data-state": I.state, text: I.text }),
        I.rows ? el("ul", { cls: "cdc-introws" }, I.rows.map(function (r) {
          return el("li", { "data-integration": r.integration, text: r.name + ": " + r.state + (r.note ? ". " + r.note : "") });
        })) : null,
        el("p", { cls: "cdd-of", text: I.state === "none_known" ? "A connection from MAP to this college's SIS or curriculum system is recorded here once the MAP team confirms one. None is recorded for this college."
          : "A connection from MAP to this college's SIS or curriculum system, as the MAP team recorded it." })])]));
    return out;
  }

  window.CPL_COMMONS_DATA_CARDS = { sections: sections, _lanes: lanes, _maps: maps, _sources: sources, _integration: integration };
})();
