// library_remediate.js — accessibility remediation of a deck (.pptx) or a Word
// document (.docx), in the browser, for the Library's Create or Remediate a Document.
//
// Sam, 2026-10-28: "PPT accessibility remediation is top of mind as we spend a bunch of
// money paying a service to remediate our decks before we can publish them to the field
// after a webinar or training ... We have to do this for written reports as well."
//
// A .pptx and a .docx are zip files of XML (OOXML). This reads one with JSZip (the local
// copy, jszip.min.js, loaded on demand like docx.min.js), fixes what needs no judgment,
// lists what needs a person, writes their answers back, and hands back the file. Nothing
// leaves the browser. It covers what Microsoft's Accessibility Checker covers for these
// files, less contrast and reading order, which it names for a person to check.
//
// Fixed for you:   the document title (from the first slide's title or the first
//                  heading), the language (English, United States), table header rows,
//                  and a picture repeated on most slides (a logo) marked decorative.
// Needs you:       alt text for each picture and chart (a draft from the slide's or
//                  section's own words, to read before keeping), a title for each slide
//                  whose title placeholder is empty, a document with no headings, and
//                  reading order on a crowded slide.
//
// Works in Node too (tests/library_remediate.test.js): pass JSZip, DOMParser and
// XMLSerializer in `env`; in the browser they default to the window's.
(function (root) {
  "use strict";

  var NS = {
    p: "http://schemas.openxmlformats.org/presentationml/2006/main",
    a: "http://schemas.openxmlformats.org/drawingml/2006/main",
    r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    c: "http://schemas.openxmlformats.org/drawingml/2006/chart",
    w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    dc: "http://purl.org/dc/elements/1.1/",
    cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    rel: "http://schemas.openxmlformats.org/package/2006/relationships",
    adec: "http://schemas.microsoft.com/office/drawing/2017/decorative"
  };
  var DECORATIVE_URI = "{C183D7F6-B498-43B3-948B-1728B52AA6E4}";
  var LANG = "en-US";
  var CROWDED = 10; // top-level items on a slide past which reading order is worth a look
  // The titles a generator writes when nobody names the file: as good as none.
  var STOCK_TITLE = /^(powerpoint presentation|pptxgenjs presentation|presentation\s*\d*|document\s*\d*|microsoft (word|powerpoint) - .*|untitled.*)$/i;

  function envOf(env) {
    env = env || {};
    return {
      JSZip: env.JSZip || root.JSZip,
      DOMParser: env.DOMParser || root.DOMParser,
      XMLSerializer: env.XMLSerializer || root.XMLSerializer
    };
  }
  function els(node, ns, name) { return Array.prototype.slice.call(node.getElementsByTagNameNS(ns, name)); }
  function first(node, ns, name) { return node.getElementsByTagNameNS(ns, name)[0] || null; }
  function child(node, ns, name) {
    for (var c = node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && c.namespaceURI === ns && c.localName === name) return c;
    return null;
  }
  // A shape's or paragraph's words, its lines (paragraphs) joined by a space.
  function textOf(node, ns) {
    var paras = node.localName === "p" && node.namespaceURI === ns ? [node] : els(node, ns, "p");
    if (!paras.length) paras = [node];
    var words = function (n) {
      var out = "";
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType !== 1) continue;
        if (c.namespaceURI === ns && c.localName === "t") out += c.textContent;
        else if (c.namespaceURI === ns && (c.localName === "br" || c.localName === "tab" || c.localName === "cr")) out += " ";
        else out += words(c);
      }
      return out;
    };
    return paras.map(words).join(" ").replace(/\s+/g, " ").trim();
  }
  function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function titleFromName(name) {
    return String(name || "").replace(/\.[a-z0-9]{1,5}$/i, "").replace(/^\d{8}[_-]?/, "").replace(/[_-]+/g, " ").trim();
  }
  // "Slides 1 to 4, 6 and 9", "Slide 3".
  function slideList(ns) {
    var runs = [], i = 0;
    while (i < ns.length) { var j = i; while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++; runs.push(j > i + 1 ? ns[i] + " to " + ns[j] : j === i + 1 ? ns[i] + ", " + ns[j] : String(ns[i])); i = j + 1; }
    var txt = runs.length > 1 ? runs.slice(0, -1).join(", ") + " and " + runs[runs.length - 1] : runs[0];
    return (ns.length === 1 ? "Slide " : "Slides ") + txt;
  }
  function slideNum(path) { var m = /(\d+)\.xml$/.exec(path); return m ? +m[1] : 0; }

  // ── the package's parts ─────────────────────────────────────────────────────
  function Doc(env, zip) { this.env = env; this.zip = zip; this.parts = {}; this.dirty = {}; }
  Doc.prototype.read = function (path) {
    var self = this;
    if (self.parts[path]) return Promise.resolve(self.parts[path]);
    var f = self.zip.file(path);
    if (!f) return Promise.resolve(null);
    return f.async("string").then(function (xml) {
      var d = new self.env.DOMParser().parseFromString(xml, "application/xml");
      self.parts[path] = d;
      return d;
    });
  };
  Doc.prototype.touch = function (path) { this.dirty[path] = true; };
  Doc.prototype.flush = function () {
    var self = this, ser = new self.env.XMLSerializer();
    Object.keys(self.dirty).forEach(function (path) {
      var xml = ser.serializeToString(self.parts[path]);
      if (!/^<\?xml/.test(xml)) xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xml;
      self.zip.file(path, xml);
    });
    self.dirty = {};
  };
  // A part's relationships: id -> target path, resolved against the part's folder.
  Doc.prototype.rels = function (path) {
    var dir = path.replace(/[^/]*$/, ""), relPath = dir + "_rels/" + path.slice(dir.length) + ".rels";
    return this.read(relPath).then(function (d) {
      var out = {};
      if (!d) return out;
      els(d, NS.rel, "Relationship").forEach(function (r) {
        var t = r.getAttribute("Target") || "", parts = (dir + t).split("/"), stack = [];
        parts.forEach(function (p) { if (p === "..") stack.pop(); else if (p && p !== ".") stack.push(p); });
        out[r.getAttribute("Id")] = r.getAttribute("TargetMode") === "External" ? t : stack.join("/");
      });
      return out;
    });
  };

  // The document title lives in docProps/core.xml as dc:title.
  function fixTitle(doc, title, report) {
    return doc.read("docProps/core.xml").then(function (core) {
      if (!core) { report.needs.push({ type: "info", id: "core", text: "The file has no document properties, so its title cannot be set here. Set it in File, Info, Title." }); return; }
      var t = first(core, NS.dc, "title"), had = t ? t.textContent.trim() : "";
      if (had && !STOCK_TITLE.test(had)) return;
      if (!t) {
        t = core.createElementNS(NS.dc, "dc:title");
        core.documentElement.appendChild(t);
      }
      t.textContent = title;
      doc.touch("docProps/core.xml");
      report.fixed.push("Document title set: " + title + (had ? " (it read " + had + ")" : ""));
    });
  }

  // Decorative, as Office writes it: an extension on the shape's cNvPr / docPr.
  function isDecorative(cNvPr) {
    return els(cNvPr, NS.adec, "decorative").some(function (d) { return d.getAttribute("val") === "1"; });
  }
  function markDecorative(cNvPr) {
    var owner = cNvPr.ownerDocument;
    cNvPr.setAttribute("descr", "");
    if (isDecorative(cNvPr)) return;
    var lst = child(cNvPr, NS.a, "extLst");
    if (!lst) { lst = owner.createElementNS(NS.a, "a:extLst"); cNvPr.appendChild(lst); }
    var ext = owner.createElementNS(NS.a, "a:ext");
    ext.setAttribute("uri", DECORATIVE_URI);
    var dec = owner.createElementNS(NS.adec, "adec:decorative");
    dec.setAttribute("val", "1");
    ext.appendChild(dec); lst.appendChild(ext);
  }

  // A chart's alt text drafted from its own data: its kind, what it shows, and its
  // values from largest to smallest (the first six), read from the chart part.
  var CHART_KIND = { barChart: "Bar chart", bar3DChart: "Bar chart", lineChart: "Line chart", line3DChart: "Line chart", pieChart: "Pie chart",
    pie3DChart: "Pie chart", doughnutChart: "Doughnut chart", areaChart: "Area chart", scatterChart: "Scatter chart", radarChart: "Radar chart" };
  function chartDraft(doc, path, words) {
    return doc.read(path).then(function (d) {
      if (!d) return "";
      var kind = "", plot = first(d, NS.c, "plotArea");
      if (!plot) return "";
      for (var c = plot.firstChild; c; c = c.nextSibling) if (c.nodeType === 1 && CHART_KIND[c.localName]) { kind = CHART_KIND[c.localName]; break; }
      var titleEl = first(d, NS.c, "title"), title = titleEl ? textOf(titleEl, NS.a) : "";
      var sers = els(plot, NS.c, "ser");
      if (!sers.length) return "";
      var pts = function (el) {
        if (!el) return [];
        return els(el, NS.c, "pt").map(function (pt) { var v = first(pt, NS.c, "v"); return { i: +pt.getAttribute("idx"), v: v ? v.textContent : "" }; });
      };
      // Categories from the first series; each series adds its values (a stacked or
      // clustered chart), and the rows sort by their total.
      var byIdx = {}, names = [];
      pts(child(sers[0], NS.c, "cat")).forEach(function (x) { byIdx[x.i] = { name: x.v, vals: [] }; });
      sers.forEach(function (ser, si) {
        var tx = child(ser, NS.c, "tx"), nm = tx ? (first(tx, NS.c, "v") || { textContent: "" }).textContent || textOf(tx, NS.a) : "";
        names.push(nm || "Series " + (si + 1));
        pts(child(ser, NS.c, "val")).forEach(function (x) { if (byIdx[x.i] && x.v !== "" && !isNaN(+x.v)) byIdx[x.i].vals[si] = +x.v; });
      });
      var rows = Object.keys(byIdx).map(function (k) { return byIdx[k]; }).filter(function (r) { return r.name && r.vals.length; });
      if (!rows.length) return "";
      rows.forEach(function (r) { r.total = r.vals.reduce(function (a, b) { return a + (b || 0); }, 0); });
      rows.sort(function (a, b) { return b.total - a.total; });
      var fmt = function (n) { return Math.abs(n) >= 1000 ? n.toLocaleString("en-US") : String(Math.round(n * 100) / 100); };
      var multi = sers.length > 1;
      var cap = multi ? 4 : 6;
      var shown = rows.slice(0, cap).map(function (r) {
        return r.name + " " + fmt(r.total) + (multi ? " (" + r.vals.map(function (v, si) { return fmt(v || 0) + " " + names[si]; }).join(", ") + ")" : "");
      });
      var about = title || words || "";
      return clip((kind || "Chart") + (about ? ": " + about : "") + (multi ? ", each bar split into " + names.join(" and ") : "") + ". " +
        shown.join("; ") + (rows.length > cap ? "; and " + (rows.length - cap) + " more" : "") + ".", 600);
    });
  }

  // ── a deck ──────────────────────────────────────────────────────────────────
  function inspectPptx(doc, name, report) {
    var paths = Object.keys(doc.zip.files).filter(function (p) { return /^ppt\/slides\/slide\d+\.xml$/.test(p); })
      .sort(function (x, y) { return slideNum(x) - slideNum(y); });
    report.extent = paths.length + (paths.length === 1 ? " slide" : " slides");
    var slides = [];
    return paths.reduce(function (pr, path, i) {
      return pr.then(function () {
        return Promise.all([doc.read(path), doc.rels(path)]).then(function (got) {
          slides.push({ n: i + 1, path: path, xml: got[0], rels: got[1] });
        });
      });
    }, Promise.resolve()).then(function () {
      var langFixed = 0, headers = 0;
      // Which picture files appear on most slides: a logo or a background mark.
      var seen = {};
      slides.forEach(function (s) {
        var here = {};
        els(s.xml, NS.p, "pic").forEach(function (pic) {
          var blip = first(pic, NS.a, "blip"), id = blip && blip.getAttributeNS(NS.r, "embed");
          if (id && s.rels[id]) here[s.rels[id]] = true;
        });
        Object.keys(here).forEach(function (t) { seen[t] = (seen[t] || 0) + 1; });
      });
      var repeated = {};
      Object.keys(seen).forEach(function (t) { if (seen[t] >= Math.max(3, Math.ceil(slides.length * 0.8))) repeated[t] = true; });
      var markedRepeat = 0, noPlaceholder = [], crowded = [];

      slides.forEach(function (s) {
        var titleSp = null;
        els(s.xml, NS.p, "sp").forEach(function (sp) {
          var ph = first(sp, NS.p, "ph"), type = ph && ph.getAttribute("type");
          if (!titleSp && (type === "title" || type === "ctrTitle")) titleSp = sp;
        });
        s.title = titleSp ? textOf(titleSp, NS.a) : "";
        // A slide with no title still has words: its first text box's, for the drafts.
        s.words = s.title;
        if (!s.words) els(s.xml, NS.p, "sp").some(function (sp) { s.words = textOf(sp, NS.a); return !!s.words; });
        if (!s.title) {
          if (titleSp) report.needs.push({ type: "title", id: "t" + s.n, slide: s.n, path: s.path, text: "Slide " + s.n + " has an empty title" });
          else noPlaceholder.push(s.n);
        }
        // Language on every run that names none.
        ["rPr", "endParaRPr", "defRPr"].forEach(function (tag) {
          els(s.xml, NS.a, tag).forEach(function (n) { if (!n.getAttribute("lang")) { n.setAttribute("lang", LANG); langFixed++; s.dirty = true; } });
        });
        // Table header rows.
        els(s.xml, NS.a, "tbl").forEach(function (tbl) {
          var pr = child(tbl, NS.a, "tblPr");
          if (!pr) { pr = s.xml.createElementNS(NS.a, "a:tblPr"); tbl.insertBefore(pr, tbl.firstChild); }
          if (pr.getAttribute("firstRow") !== "1") { pr.setAttribute("firstRow", "1"); headers++; s.dirty = true; }
        });
        // Pictures and charts.
        var tree = first(s.xml, NS.p, "spTree"), shapes = 0;
        for (var c = tree ? tree.firstChild : null; c; c = c.nextSibling) if (c.nodeType === 1 && /^(sp|pic|graphicFrame|grpSp|cxnSp)$/.test(c.localName)) shapes++;
        if (shapes >= CROWDED) crowded.push(s.n);
        var k = 0;
        els(s.xml, NS.p, "pic").concat(els(s.xml, NS.p, "graphicFrame").filter(function (g) { return !!first(g, NS.c, "chart"); }))
          .forEach(function (shape) {
            var cNvPr = first(shape, NS.p, "cNvPr");
            if (!cNvPr || isDecorative(cNvPr) || (cNvPr.getAttribute("descr") || "").trim()) return;
            var isChart = shape.localName === "graphicFrame";
            var blip = first(shape, NS.a, "blip"), target = blip && s.rels[blip.getAttributeNS(NS.r, "embed")];
            if (target && repeated[target]) { markDecorative(cNvPr); markedRepeat++; s.dirty = true; return; }
            k++;
            var chartEl = isChart ? first(shape, NS.c, "chart") : null;
            var chartPart = chartEl ? s.rels[chartEl.getAttributeNS(NS.r, "id")] : null;
            report.needs.push({ type: "alt", id: "a" + s.n + "-" + k, slide: s.n, path: s.path, shapeId: cNvPr.getAttribute("id"),
              media: target || null, chart: isChart, chartPart: chartPart || null, words: s.words || "",
              label: "Slide " + s.n + ", " + (isChart ? "chart" : "picture") + (cNvPr.getAttribute("name") ? " (" + cNvPr.getAttribute("name") + ")" : ""),
              draft: s.words ? clip((isChart ? "Chart: " : "") + s.words, 150) : "" });
          });
        if (s.dirty) doc.touch(s.path);
      });
      if (noPlaceholder.length) report.needs.push({ type: "info", id: "tp", slides: noPlaceholder,
        text: slideList(noPlaceholder) + (noPlaceholder.length === 1 ? " has" : " have") + " no title a screen reader can find. In PowerPoint, give " + (noPlaceholder.length === 1 ? "it" : "each") + " a layout with a title (Home, Layout), or put the title in the slide's title box and move it off the slide if it must not show." });
      if (crowded.length) report.needs.push({ type: "order", id: "ro", slides: crowded,
        text: "Reading order on " + slideList(crowded).toLowerCase() + ": each holds " + CROWDED + " or more items. In PowerPoint, check that a screen reader meets them in the order the slide means (Home, Arrange, Selection Pane, which lists them bottom to top)." });
      if (langFixed) report.fixed.push("Language set to English (United States) on " + langFixed + " text runs");
      if (headers) report.fixed.push("Header rows marked on " + headers + (headers === 1 ? " table" : " tables"));
      if (markedRepeat) report.fixed.push("A picture repeated on most slides (a logo) marked decorative, " + markedRepeat + " times");
      report.slides = slides.map(function (s) { return { n: s.n, title: s.title }; });
      var t1 = slides[0] && slides[0].title;
      return draftCharts(doc, report).then(function () { return fixTitle(doc, t1 || titleFromName(name), report); });
    });
  }

  // ── a Word document ─────────────────────────────────────────────────────────
  function inspectDocx(doc, name, report) {
    var path = "word/document.xml";
    return Promise.all([doc.read(path), doc.rels(path), doc.read("word/styles.xml")]).then(function (got) {
      var d = got[0], rels = got[1], styles = got[2];
      if (!d) throw new Error("This file has no word/document.xml, so it is not a Word document.");
      var paras = els(d, NS.w, "p");
      report.extent = paras.length + " paragraphs";
      var styleOf = function (p) { var ps = first(p, NS.w, "pStyle"); return ps ? ps.getAttributeNS(NS.w, "val") || ps.getAttribute("w:val") || "" : ""; };
      var headingText = "", firstHeading = "", hasHeading = false;
      var nearest = [];
      paras.forEach(function (p) {
        var st = styleOf(p);
        if (/^(Title|Heading\d)$/i.test(st)) {
          hasHeading = hasHeading || /^Heading/i.test(st);
          headingText = textOf(p, NS.w);
          if (!firstHeading && headingText) firstHeading = headingText;
        }
        nearest.push(headingText);
      });
      if (!hasHeading) report.needs.push({ type: "info", id: "h", text: "The document uses no headings. Apply Heading 1 and Heading 2 to its section titles in Word (Home, Styles), so a screen reader can move by section." });
      // Language, once, on the document's defaults.
      if (styles) {
        var defs = first(styles, NS.w, "docDefaults");
        if (!defs) { defs = styles.createElementNS(NS.w, "w:docDefaults"); styles.documentElement.insertBefore(defs, styles.documentElement.firstChild); }
        var rd = child(defs, NS.w, "rPrDefault");
        if (!rd) { rd = styles.createElementNS(NS.w, "w:rPrDefault"); defs.insertBefore(rd, defs.firstChild); }
        var rpr = child(rd, NS.w, "rPr");
        if (!rpr) { rpr = styles.createElementNS(NS.w, "w:rPr"); rd.appendChild(rpr); }
        var lang = child(rpr, NS.w, "lang");
        if (!lang || !lang.getAttributeNS(NS.w, "val")) {
          if (!lang) { lang = styles.createElementNS(NS.w, "w:lang"); rpr.appendChild(lang); }
          lang.setAttributeNS(NS.w, "w:val", LANG);
          doc.touch("word/styles.xml");
          report.fixed.push("Language set to English (United States)");
        }
      }
      // Table header rows: the first row repeats as a header.
      var headers = 0;
      els(d, NS.w, "tbl").forEach(function (tbl) {
        var tr = child(tbl, NS.w, "tr");
        if (!tr) return;
        var trPr = child(tr, NS.w, "trPr");
        if (!trPr) { trPr = d.createElementNS(NS.w, "w:trPr"); tr.insertBefore(trPr, tr.firstChild); }
        if (!child(trPr, NS.w, "tblHeader")) { trPr.appendChild(d.createElementNS(NS.w, "w:tblHeader")); headers++; }
      });
      if (headers) { doc.touch(path); report.fixed.push("Header rows marked on " + headers + (headers === 1 ? " table" : " tables")); }
      // Pictures and charts: wp:docPr carries the alt text.
      var k = 0;
      els(d, NS.wp, "docPr").forEach(function (pr) {
        if (isDecorative(pr) || (pr.getAttribute("descr") || "").trim()) return;
        var drawing = pr.parentNode, blip = first(drawing, NS.a, "blip");
        var target = blip ? rels[blip.getAttributeNS(NS.r, "embed")] : null;
        var chartEl = first(drawing, NS.c, "chart"), isChart = !!chartEl;
        var p = pr; while (p && !(p.namespaceURI === NS.w && p.localName === "p")) p = p.parentNode;
        var near = p ? nearest[paras.indexOf(p)] : "";
        k++;
        report.needs.push({ type: "alt", id: "a" + k, path: path, shapeId: pr.getAttribute("id"), media: target, chart: isChart,
          chartPart: chartEl ? rels[chartEl.getAttributeNS(NS.r, "id")] || null : null, words: near || "",
          label: (isChart ? "Chart" : "Picture") + " " + k + (near ? ", under " + clip(near, 60) : ""),
          draft: near ? clip((isChart ? "Chart: " : "") + near, 150) : "" });
      });
      return draftCharts(doc, report).then(function () { return fixTitle(doc, firstHeading || titleFromName(name), report); });
    });
  }

  function draftCharts(doc, report) {
    return Promise.all(report.needs.filter(function (n) { return n.type === "alt" && n.chartPart; }).map(function (n) {
      return chartDraft(doc, n.chartPart, n.words).then(function (t) { if (t) { n.draft = t; n.fromData = true; } });
    }));
  }

  // Reads the file, fixes what needs no judgment, and returns the report with a session
  // that finish() writes the answers into.
  function inspect(buf, name, env) {
    env = envOf(env);
    var ext = (/\.([a-z0-9]+)$/i.exec(name || "") || [])[1];
    ext = ext ? ext.toLowerCase() : "";
    if (ext !== "pptx" && ext !== "docx") return Promise.reject(new Error("Remediation reads a .pptx deck or a .docx document. Save the file in that format and drop it again."));
    if (!env.JSZip) return Promise.reject(new Error("The zip reader did not load. Reload the page and try again."));
    return env.JSZip.loadAsync(buf).then(function (zip) {
      var doc = new Doc(env, zip);
      var report = { name: name, ext: ext, fixed: [], needs: [], extent: "" };
      return (ext === "pptx" ? inspectPptx : inspectDocx)(doc, name, report).then(function () {
        return { report: report, doc: doc };
      });
    });
  }

  // answers: { [needId]: { text, decorative } }. Writes them, then returns the file.
  // type: "blob" in the browser, "nodebuffer" in Node.
  function finish(session, answers, type) {
    var doc = session.doc, report = session.report, done = { alt: 0, decorative: 0, titles: 0 };
    answers = answers || {};
    var byPath = {};
    report.needs.forEach(function (n) { if (n.path) (byPath[n.path] = byPath[n.path] || []).push(n); });
    return Promise.all(Object.keys(byPath).map(function (path) {
      return doc.read(path).then(function (d) {
        byPath[path].forEach(function (n) {
          var ans = answers[n.id];
          if (!ans) return;
          if (n.type === "alt") {
            var tag = report.ext === "pptx" ? els(d, NS.p, "cNvPr") : els(d, NS.wp, "docPr");
            var pr = tag.filter(function (x) { return x.getAttribute("id") === n.shapeId; })[0];
            if (!pr) return;
            if (ans.decorative) { markDecorative(pr); done.decorative++; }
            else if ((ans.text || "").trim()) { pr.setAttribute("descr", ans.text.trim()); done.alt++; }
            else return;
            doc.touch(path);
          } else if (n.type === "title" && (ans.text || "").trim()) {
            var sp = els(d, NS.p, "sp").filter(function (s) {
              var ph = first(s, NS.p, "ph"), t = ph && ph.getAttribute("type");
              return t === "title" || t === "ctrTitle";
            })[0];
            if (!sp) return;
            var body = first(sp, NS.p, "txBody");
            if (!body) return;
            var para = child(body, NS.a, "p");
            if (!para) { para = d.createElementNS(NS.a, "a:p"); body.appendChild(para); }
            var run = d.createElementNS(NS.a, "a:r"), rPr = d.createElementNS(NS.a, "a:rPr"), t = d.createElementNS(NS.a, "a:t");
            rPr.setAttribute("lang", LANG); t.textContent = ans.text.trim();
            run.appendChild(rPr); run.appendChild(t);
            var end = child(para, NS.a, "endParaRPr");
            para.insertBefore(run, end);
            doc.touch(path); done.titles++;
          }
        });
      });
    })).then(function () {
      doc.flush();
      return doc.zip.generateAsync({ type: type || "blob", compression: "DEFLATE",
        mimeType: report.ext === "pptx" ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    }).then(function (file) { return { file: file, done: done }; });
  }

  // The remediated file's name: the original's, with _Remediated before the extension,
  // keeping its date code (CLAUDE.md: a re-version keeps the date code).
  function outName(name) { return String(name || "file").replace(/(\.[a-z0-9]+)$/i, "_Remediated$1"); }

  var api = { inspect: inspect, finish: finish, outName: outName, _titleFromName: titleFromName };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CPL_REMEDIATE = api;
})(typeof window !== "undefined" ? window : this);
