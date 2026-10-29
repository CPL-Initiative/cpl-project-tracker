// Library remediation — a deck (.pptx) or a Word document (.docx), fixed in the browser.
//
// Sam, 2026-10-28: "PPT accessibility remediation is top of mind as we spend a bunch of
// money paying a service to remediate our decks before we can publish them to the field
// after a webinar or training ... We have to do this for written reports as well."
//
// These build small real OOXML packages with the vendored JSZip (jszip.min.js, the copy
// the page loads) and guard what the remediation can get wrong:
//   - what needs no judgment is fixed: the title (from the first slide's title or the
//     first heading, else the file's name), the language, table header rows, and a
//     picture repeated on most slides marked decorative the way Office writes it;
//   - what needs a person is listed, never guessed into the file: alt text (a draft from
//     the slide's or section's words), an empty slide title, no headings, a crowded slide;
//   - a picture that already has alt text, or is marked decorative, is left alone;
//   - the answers land in the file that comes back, and the file still opens as a zip
//     with the same parts;
//   - a file that is neither .pptx nor .docx is refused in words;
//   - a deck's contrast is measured against the fill the words actually sit on (a shape
//     drawn before them, the layout's own shapes, then the background), never the slide's
//     background alone, which read our decks' white-on-navy labels as white on white.
//
// Run from repo root: `npm test` (or `node tests/library_remediate.test.js`).
const JSZip = require("../jszip.min.js");
const { JSDOM } = require("jsdom");
const R = require("../library_remediate.js");

const win = new JSDOM("").window;
const ENV = { JSZip: JSZip, DOMParser: win.DOMParser, XMLSerializer: win.XMLSerializer };
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const P = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const CORE = (title) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">' + (title == null ? "" : "<dc:title>" + title + "</dc:title>") + "</cp:coreProperties>";
function titleSp(text) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p>' +
    (text ? '<a:r><a:rPr/><a:t>' + text + "</a:t></a:r>" : "") + '<a:endParaRPr/></a:p></p:txBody></p:sp>';
}
function pic(id, name, rid, descr) {
  return '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="' + name + '"' + (descr ? ' descr="' + descr + '"' : "") + '/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + rid + '"/></p:blipFill><p:spPr/></p:pic>';
}
const TABLE = '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="9" name="Table 8"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm/><a:graphic><a:graphicData><a:tbl><a:tblPr/><a:tr><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>College</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
function slide(body) { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ' + P + '><p:cSld><p:spTree>' + body + "</p:spTree></p:cSld></p:sld>"; }
function slideRels(rels) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    rels.map(function (r) { return '<Relationship Id="' + r[0] + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="' + r[1] + '"/>'; }).join("") + "</Relationships>";
}

function deck() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE(""));
  z.file("ppt/media/logo.png", "png");
  z.file("ppt/media/chart.png", "png");
  // Slide 1: a title, the logo, a picture with no alt text, a table with no header row.
  z.file("ppt/slides/slide1.xml", slide(titleSp("CPL Implementation Funding") + pic(4, "Logo", "rId2") + pic(5, "Picture 4", "rId3") + TABLE));
  z.file("ppt/slides/_rels/slide1.xml.rels", slideRels([["rId2", "../media/logo.png"], ["rId3", "../media/chart.png"]]));
  // Slide 2: an empty title, the logo, a picture that already has alt text.
  z.file("ppt/slides/slide2.xml", slide(titleSp("") + pic(4, "Logo", "rId2") + pic(6, "Photo", "rId3", "Students at a table")));
  z.file("ppt/slides/_rels/slide2.xml.rels", slideRels([["rId2", "../media/logo.png"], ["rId3", "../media/chart.png"]]));
  // Slide 10 (sorts after 2, not after 1): no title placeholder, the logo.
  z.file("ppt/slides/slide10.xml", slide('<p:sp><p:nvSpPr><p:cNvPr id="3" name="TextBox 2"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:txBody><a:bodyPr/><a:p><a:r><a:t>Funding by college</a:t></a:r></a:p></p:txBody></p:sp>' +
    pic(4, "Logo", "rId2") + pic(7, "Picture 6", "rId4")));
  z.file("ppt/slides/_rels/slide10.xml.rels", slideRels([["rId2", "../media/logo.png"], ["rId4", "../media/photo.png"]]));
  z.file("ppt/media/photo.png", "png");
  return z.generateAsync({ type: "nodebuffer" });
}

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
// A deck with a theme, a master and a layout, for contrast: the layout draws a navy
// rectangle under its title (a text box over a colored shape is how our generators build
// a slide), the master paints white.
function contrastDeck() {
  const z = new JSZip();
  const rel = (rels) => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    rels.map((r) => '<Relationship Id="' + r[0] + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/' + r[1] + '" Target="' + r[2] + '"/>').join("") + "</Relationships>";
  const box = (id, x, y, cx, cy, fill, runs) => '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Shape ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
    (fill ? "<a:solidFill>" + fill + "</a:solidFill>" : "<a:noFill/>") + "</p:spPr>" +
    (runs ? "<p:txBody><a:bodyPr/><a:p>" + runs + "</a:p></p:txBody>" : "") + "</p:sp>";
  const run = (t, clr, sz, b) => '<a:r><a:rPr' + (sz ? ' sz="' + sz + '"' : "") + (b ? ' b="1"' : "") + ">" + (clr ? "<a:solidFill>" + clr + "</a:solidFill>" : "") + "</a:rPr><a:t>" + t + "</a:t></a:r>";
  z.file("docProps/core.xml", CORE("Contrast"));
  z.file("ppt/theme/theme1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme ' + P + '><a:themeElements><a:clrScheme name="CO"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    '<a:dk2><a:srgbClr val="002F6D"/></a:dk2><a:lt2><a:srgbClr val="E8EFF8"/></a:lt2><a:accent1><a:srgbClr val="E8A32C"/></a:accent1></a:clrScheme><a:fmtScheme><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>' +
    '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill/></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>');
  z.file("ppt/slideMasters/slideMaster1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ' + P + '><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree/></p:cSld>' +
    '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" hlink="dk2" folHlink="dk2"/><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4000"><a:solidFill><a:schemeClr val="bg1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>');
  z.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", rel([["rId1", "theme", "../theme/theme1.xml"]]));
  // The layout: a navy band across the top, and the title placeholder over it.
  z.file("ppt/slideLayouts/slideLayout1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ' + P + '><p:cSld><p:spTree>' +
    box(2, 0, 0, 12192000, 1500000, '<a:schemeClr val="tx2"/>') +
    '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="400000" y="300000"/><a:ext cx="11000000" cy="900000"/></a:xfrm></p:spPr></p:sp>' +
    "</p:spTree></p:cSld></p:sldLayout>");
  z.file("ppt/slideLayouts/_rels/slideLayout1.xml.rels", rel([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]]));
  // Slide 1: the title (white, from the master) over the layout's navy band: it passes.
  // A white label on a navy box of its own drawing: passes. Gold 12pt text on the white
  // ground: fails at 4.5:1. Gold 24pt text: large, fails at 3:1. The same gold, 14pt bold,
  // is large too, so one item covers both large runs. A 75%-darkened gold (lumMod) passes.
  z.file("ppt/slides/slide1.xml", slide(
    '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:p>' + run("Funding by college") + "</a:p></p:txBody></p:sp>" +
    box(4, 600000, 2000000, 3000000, 1000000, '<a:schemeClr val="tx2"/>') +
    box(5, 700000, 2100000, 2800000, 800000, null, run("PRIORITY 1", '<a:schemeClr val="bg1"/>', 1400)) +
    box(6, 600000, 3500000, 6000000, 500000, null, run("NEW IN 2026", '<a:schemeClr val="accent1"/>', 1200)) +
    box(7, 600000, 4200000, 6000000, 600000, null, run("$7M", '<a:schemeClr val="accent1"/>', 2400) + run("ongoing", '<a:schemeClr val="accent1"/>', 1400, true)) +
    box(8, 600000, 5000000, 6000000, 500000, null, run("Darker gold", '<a:schemeClr val="accent1"><a:lumMod val="50000"/></a:schemeClr>', 1200))));
  z.file("ppt/slides/_rels/slide1.xml.rels", rel([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"]]));
  // Slide 2: a gradient background (the theme's second background style): unmeasured.
  z.file("ppt/slides/slide2.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ' + P + '><p:cSld><p:bg><p:bgRef idx="1002"><a:schemeClr val="bg2"/></p:bgRef></p:bg><p:spTree>' +
    box(3, 600000, 3000000, 6000000, 600000, null, run("On a gradient", '<a:srgbClr val="CCCCCC"/>', 1200)) + "</p:spTree></p:cSld></p:sld>");
  z.file("ppt/slides/_rels/slide2.xml.rels", rel([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"]]));
  return z.generateAsync({ type: "nodebuffer" });
}

function wordDoc(withHeading) {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE(null));
  z.file("word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + W + "></w:styles>");
  z.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + "><w:body>" +
    (withHeading ? '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Awards by college</w:t></w:r></w:p>' : "") +
    '<w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Picture 1"/><a:graphic><a:graphicData><a:blip r:embed="rId5"/></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>' +
    '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>College</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Norco</w:t></w:r></w:p></w:tc></w:tr></w:tbl>' +
    "</w:body></w:document>");
  z.file("word/_rels/document.xml.rels", slideRels([["rId5", "media/image1.png"]]));
  z.file("word/media/image1.png", "png");
  return z.generateAsync({ type: "nodebuffer" });
}

// A deck whose one chart carries two series (a stacked bar), its data in the chart part.
function chartDeck() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE("Credentials"));
  z.file("ppt/slides/slide1.xml", slide(titleSp("What issuers offer") +
    '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="5" name="Chart 4"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm/><a:graphic><a:graphicData><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId9"/></a:graphicData></a:graphic></p:graphicFrame>'));
  z.file("ppt/slides/_rels/slide1.xml.rels", slideRels([["rId9", "../charts/chart1.xml"]]));
  const ser = (name, vals) => '<c:ser><c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>' + name + '</c:v></c:pt></c:strCache></c:strRef></c:tx>' +
    '<c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Cloud</c:v></c:pt><c:pt idx="1"><c:v>Cybersecurity</c:v></c:pt></c:strCache></c:strRef></c:cat>' +
    '<c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>' + vals[0] + '</c:v></c:pt><c:pt idx="1"><c:v>' + vals[1] + '</c:v></c:pt></c:numCache></c:numRef></c:val></c:ser>';
  z.file("ppt/charts/chart1.xml", '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:plotArea><c:barChart>' +
    ser("Articulated in MAP", [25, 5]) + ser("Not yet in MAP", [349, 233]) + "</c:barChart></c:plotArea></c:chart></c:chartSpace>");
  return z.generateAsync({ type: "nodebuffer" });
}
function stockTitled() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE("PowerPoint Presentation"));
  let many = "";
  for (let i = 0; i < 9; i++) many += '<p:sp><p:nvSpPr><p:cNvPr id="' + (10 + i) + '" name="Box"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>';
  z.file("ppt/slides/slide1.xml", slide(titleSp("Funding") + many));
  for (let n = 2; n <= 12; n++) z.file("ppt/slides/slide" + n + ".xml", slide(""));
  return z.generateAsync({ type: "nodebuffer" });
}
const run = deck().then(function (buf) {
  return R.inspect(buf, "20261030_CPL_Summit_Funding.pptx", ENV);
}).then(function (s) {
  const rep = s.report;
  check("(1) a deck reports its slide count", rep.extent === "3 slides", rep.extent);
  check("(1) the title comes from the first slide's title", rep.fixed.some(function (f) { return f === "Document title set: CPL Implementation Funding"; }), JSON.stringify(rep.fixed));
  check("(1) the language is set on the runs that named none", rep.fixed.some(function (f) { return /^Language set to English \(United States\)/.test(f); }));
  check("(1) the table's header row is marked", rep.fixed.some(function (f) { return f === "Header rows marked on 1 table"; }));
  check("(1) the logo on every slide is marked decorative, three times", rep.fixed.some(function (f) { return /repeated on most slides \(a logo\) marked decorative, 3 times/.test(f); }), JSON.stringify(rep.fixed));
  const alts = rep.needs.filter(function (n) { return n.type === "alt"; });
  check("(1) two pictures need alt text: the two with none that are not the logo", alts.length === 2 && alts[0].slide === 1 && alts[0].media === "ppt/media/chart.png" && alts[1].slide === 3, JSON.stringify(alts));
  check("(1) on a slide with no title box the draft comes from its first words", alts[1] && alts[1].draft === "Funding by college", alts[1] && alts[1].draft);
  check("(1) its draft comes from the slide's own title", alts[0] && alts[0].draft === "CPL Implementation Funding");
  check("(1) a picture that already has alt text is left alone", !alts.some(function (n) { return n.slide === 2; }));
  const titles = rep.needs.filter(function (n) { return n.type === "title"; });
  check("(1) the empty title placeholder asks for a title", titles.length === 1 && titles[0].slide === 2);
  check("(1) slides with no title box are named in one item, numbered in order (slide10 is the third)",
    rep.needs.filter(function (n) { return n.type === "info"; }).length === 1 && rep.needs.some(function (n) { return n.id === "tp" && /^Slide 3 has no title a screen reader can find/.test(n.text); }), JSON.stringify(rep.needs));
  const answers = {};
  answers[alts[0].id] = { text: "Bar chart: transcribed CPL units by college, rising each year" };
  answers[titles[0].id] = { text: "Where the funding goes" };
  return R.finish(s, answers, "nodebuffer");
}).then(function (out) {
  check("(2) finish counts what it wrote", out.done.alt === 1 && out.done.titles === 1, JSON.stringify(out.done));
  return JSZip.loadAsync(out.file);
}).then(function (z) {
  check("(2) the file that comes back is a zip with the same parts", !!z.file("ppt/slides/slide1.xml") && !!z.file("ppt/slides/slide10.xml") && !!z.file("ppt/media/logo.png"));
  return Promise.all([z.file("ppt/slides/slide1.xml").async("string"), z.file("ppt/slides/slide2.xml").async("string"), z.file("docProps/core.xml").async("string")]);
}).then(function (x) {
  check("(2) the alt text is in the file", /descr="Bar chart: transcribed CPL units by college, rising each year"/.test(x[0]));
  check("(2) the logo carries Office's decorative mark", /uri="\{C183D7F6-B498-43B3-948B-1728B52AA6E4\}"/.test(x[0]) && /decorative[^>]*val="1"/.test(x[0]));
  check("(2) the table's first row is a header", /<a:tblPr[^>]*firstRow="1"/.test(x[0]));
  check("(2) runs carry the language", /lang="en-US"/.test(x[0]));
  check("(2) the typed slide title is in slide 2", /<a:t>Where the funding goes<\/a:t>/.test(x[1]));
  check("(2) the existing alt text is untouched", /descr="Students at a table"/.test(x[1]));
  check("(2) the title is in the document properties", /<dc:title>CPL Implementation Funding<\/dc:title>/.test(x[2]));
  check("(2) the parts keep an XML declaration", /^<\?xml/.test(x[0]));
  return wordDoc(true);
}).then(function (buf) {
  return R.inspect(buf, "20261029_CPL_Report.docx", ENV);
}).then(function (s) {
  const rep = s.report;
  check("(3) a document's title comes from its first heading", rep.fixed.indexOf("Document title set: Awards by college") >= 0, JSON.stringify(rep.fixed));
  check("(3) the language is set once on the defaults", rep.fixed.indexOf("Language set to English (United States)") >= 0);
  check("(3) the table's first row repeats as a header", rep.fixed.indexOf("Header rows marked on 1 table") >= 0);
  const alts = rep.needs.filter(function (n) { return n.type === "alt"; });
  check("(3) the picture needs alt text, drafted from its section's heading", alts.length === 1 && alts[0].draft === "Awards by college" && /under Awards by college/.test(alts[0].label), JSON.stringify(alts));
  check("(3) a document with headings is not told it has none", !rep.needs.some(function (n) { return n.id === "h"; }));
  const answers = {}; answers[alts[0].id] = { decorative: true };
  return R.finish(s, answers, "nodebuffer");
}).then(function (out) {
  check("(4) marking a picture decorative counts as such", out.done.decorative === 1 && out.done.alt === 0);
  return JSZip.loadAsync(out.file);
}).then(function (z) {
  return Promise.all([z.file("word/document.xml").async("string"), z.file("word/styles.xml").async("string"), z.file("docProps/core.xml").async("string")]);
}).then(function (x) {
  check("(4) the decorative mark sits on the picture's docPr", /<wp:docPr[^>]*descr=""[\s\S]*decorative[^>]*val="1"/.test(x[0]));
  check("(4) the first row carries tblHeader", /<w:trPr><w:tblHeader\/><\/w:trPr>/.test(x[0]));
  check("(4) the defaults name the language", /<w:lang w:val="en-US"\/>/.test(x[1]));
  check("(4) a missing dc:title is created and written", /<dc:title>Awards by college<\/dc:title>/.test(x[2]));
  return wordDoc(false);
}).then(function (buf) {
  return R.inspect(buf, "20261029_CPL_Report.docx", ENV);
}).then(function (s) {
  check("(5) a document with no headings is told so, with how to fix it", s.report.needs.some(function (n) { return n.id === "h" && /Heading 1/.test(n.text); }));
  check("(5) with no heading the title falls back to the file's name, less its date code", s.report.fixed.indexOf("Document title set: CPL Report") >= 0, JSON.stringify(s.report.fixed));
  return chartDeck().then(function (buf) { return R.inspect(buf, "Deck.pptx", ENV); }).then(function (s3) {
    const c = s3.report.needs.filter(function (n) { return n.type === "alt" && n.chart; })[0];
    check("(5) a chart's draft comes from its own data: kind, subject, the series, rows by total",
      !!c && c.fromData && c.draft === "Bar chart: What issuers offer, each bar split into Articulated in MAP and Not yet in MAP. Cloud 374 (25 Articulated in MAP, 349 Not yet in MAP); Cybersecurity 238 (5 Articulated in MAP, 233 Not yet in MAP).", c && c.draft);
    return stockTitled();
  }).then(function (buf) { return R.inspect(buf, "Deck.pptx", ENV); }).then(function (s2) {
    check("(5) a generator's stock title (PowerPoint Presentation) counts as none and is replaced, saying what it read",
      s2.report.fixed.indexOf("Document title set: Funding (it read PowerPoint Presentation)") >= 0, JSON.stringify(s2.report.fixed));
    check("(5) eleven slides with no title box read as one range", s2.report.needs.some(function (n) { return n.id === "tp" && /^Slides 2 to 12 have no title/.test(n.text); }), JSON.stringify(s2.report.needs.map(function (n) { return n.text; })));
    check("(5) a slide of ten top-level items asks for its reading order, once", s2.report.needs.filter(function (n) { return n.type === "order"; }).length === 1 && s2.report.needs.some(function (n) { return n.id === "ro" && /slide 1:/.test(n.text); }));
  }).then(function () { return R.inspect(Buffer.from("x"), "Notes.pdf", ENV); }).then(function () { check("(6) a PDF is refused", false); }, function (e) {
    check("(6) a PDF is refused in words that say what it reads", /reads a \.pptx deck or a \.docx document/.test(e.message), e.message);
  });
}).then(function () {
  check("(7) the remediated file keeps the date code and says so", R.outName("20261030_CPL_Summit_Funding.pptx") === "20261030_CPL_Summit_Funding_Remediated.pptx");
  check("(8) the contrast ratio is WCAG's: black on white is 21:1, gold #E8A32C on white 2.16:1",
    Math.round(R._ratio("000000", "FFFFFF")) === 21 && Math.abs(R._ratio("E8A32C", "FFFFFF") - 2.16) < 0.01, R._ratio("E8A32C", "FFFFFF"));
  return contrastDeck().then(function (buf) { return R.inspect(buf, "Contrast.pptx", ENV).then(function (s) { return [buf, s]; }); }).then(function (got) {
    const s = got[1], cs = s.report.needs.filter(function (n) { return n.type === "contrast"; });
    check("(8) a title over the layout's navy band is not read as white on white", !cs.some(function (n) { return n.fg === "FFFFFF"; }), JSON.stringify(cs.map(function (n) { return n.text; })));
    check("(8) a text box over a colored shape drawn before it reads that shape's fill", !cs.some(function (n) { return /PRIORITY/.test(n.text); }));
    check("(8) small gold text on white is one item, at 4.5:1", cs.filter(function (n) { return n.need === 4.5; }).length === 1 && cs.some(function (n) { return n.need === 4.5 && n.fg === "E8A32C" && n.bg === "FFFFFF" && /NEW IN 2026/.test(n.text); }), JSON.stringify(cs));
    const big = cs.filter(function (n) { return n.need === 3; })[0];
    check("(8) 24pt and 14pt bold count as large: one item at 3:1 holding both runs", !!big && big.runs.length === 2 && /2 runs of text/.test(big.text) && /large text needs 3:1/.test(big.text), big && big.text);
    check("(8) a color darkened with lumMod is measured darkened, and passes", !cs.some(function (n) { return /Darker gold/.test(n.text); }));
    check("(8) each fix keeps the hue and passes its own bar", cs.every(function (n) { return R._ratio(n.fix, n.bg) >= n.need && n.fixRatio >= n.need; }), JSON.stringify(cs.map(function (n) { return [n.fix, n.fixRatio]; })));
    check("(8) text on a gradient background is named for a person, not measured", s.report.needs.some(function (n) { return n.id === "cu" && /slide 2: some text sits on a gradient/.test(n.text); }) && !cs.some(function (n) { return n.slide === 2; }));
    const ans = {}; cs.forEach(function (n) { ans[n.id] = { fix: true }; });
    return R.finish(s, ans, "nodebuffer").then(function (out) {
      check("(8) finish writes the fix onto each run it covers", out.done.colors === 3, JSON.stringify(out.done));
      return R.inspect(out.file, "Contrast.pptx", ENV);
    }).then(function (again) {
      check("(8) the remediated deck has no contrast item left", !again.report.needs.some(function (n) { return n.type === "contrast"; }));
      // Left unticked, nothing changes.
      return R.inspect(got[0], "Contrast.pptx", ENV).then(function (s2) { return R.finish(s2, {}, "nodebuffer"); }).then(function (o2) {
        check("(8) an unticked fix leaves the colors as they were", o2.done.colors === 0);
      });
    });
  });
});

run.catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let pass = 0;
  results.forEach(function (r) { console.log((r[1] ? "  ok  " : "  FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "  — " + r[2])); if (r[1]) pass++; });
  console.log("\nlibrary_remediate.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
});
