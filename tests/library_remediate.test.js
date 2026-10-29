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
//   - a file that is neither .pptx, .docx, .xlsx nor PDF is refused in words;
//   - a workbook (12): a sheet left at its default name is asked a name, and the new name
//     reaches every formula, defined name and chart that points at it (string literals and
//     another workbook's sheets stay); a chart's alt text drafts from its numbers; a table
//     with no header row, data with no table and merged cells are listed, never changed;
//     a package whose targets start with a slash (openpyxl's) is read;
//   - a workbook's colors (13): each cell's font color against its fill, theme colors in
//     Excel's own order with their tints, the old indexed palette, a styled table and a
//     run colored inside a cell named for a person, and a fix that adds a font and a
//     format so the other cells sharing the old one keep it;
//   - a PDF is read, never written: its own Info and catalog (in Office's compressed
//     object streams, never a bookmark's title or a span's language), the program that
//     made it, and the steps that fix it at that source;
//   - a deck's contrast is measured against the fill the words actually sit on (a shape
//     drawn before them, the layout's own shapes, then the background), never the slide's
//     background alone, which read our decks' white-on-navy labels as white on white.
//
// Run from repo root: `npm test` (or `node tests/library_remediate.test.js`).
const JSZip = require("../jszip.min.js");
const { JSDOM } = require("jsdom");
const R = require("../library_remediate.js");
const { makePdf } = require("./pdf_fixture.js");

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

// A Word document whose colors come from every place Word keeps them: a character style,
// a paragraph style's shading, a table cell's shading, a theme color with a tint, a
// highlight, "auto", a large run, text boxes (no fill, a navy fill, a theme style's fill,
// with Word's VML copy in mc:Fallback), a header and a footer.
function contrastWord() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE("Contrast"));
  z.file("word/theme/theme1.xml", '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office">' +
    '<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    '<a:accent1><a:srgbClr val="4472C4"/></a:accent1></a:clrScheme></a:themeElements></a:theme>');
  z.file("word/styles.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ' + W + ">" +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:rPr><w:sz w:val="22"/></w:rPr></w:style>' +
    '<w:style w:type="character" w:styleId="Gold"><w:rPr><w:color w:val="E8A32C"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Banner"><w:basedOn w:val="Normal"/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="1F3A68"/></w:pPr><w:rPr><w:color w:val="FFFFFF"/></w:rPr></w:style>' +
    '<w:style w:type="table" w:styleId="GridHeader"><w:tblStylePr w:type="firstRow"><w:tcPr><w:shd w:val="clear" w:fill="4472C4"/></w:tcPr></w:tblStylePr></w:style>' +
    "</w:styles>");
  const r = (pr, t) => "<w:r>" + (pr ? "<w:rPr>" + pr + "</w:rPr>" : "") + "<w:t>" + t + "</w:t></w:r>";
  const box = (fill, style, body) => '<w:p><w:r><w:drawing><wp:anchor><wp:docPr id="8" name="Text Box" descr="box"/><a:graphic><a:graphicData><wps:wsp><wps:spPr>' + fill + "</wps:spPr>" + style +
    "<wps:txbx><w:txbxContent><w:p>" + body + "</w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>";
  z.file("word/header1.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ' + W + "><w:p>" + r('<w:rStyle w:val="Gold"/>', "CPL Initiative") + "</w:p></w:hdr>");
  z.file("word/footer2.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ' + W + "><w:p>" + r('<w:color w:val="595959"/>', "Page 1") + r('<w:color w:val="AAAAAA"/>', "Draft") + "</w:p></w:ftr>");
  z.file("word/document.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + W + ' xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:v="urn:schemas-microsoft-com:vml"><w:body>' +
    '<w:p><w:pPr><w:pStyle w:val="Banner"/></w:pPr>' + r("", "WHITE ON THE BANNER") + "</w:p>" +
    "<w:p>" + r('<w:rStyle w:val="Gold"/>', "New in 2026") + r('<w:rStyle w:val="Gold"/><w:b/><w:sz w:val="28"/>', "Gold bold heading") + "</w:p>" +
    "<w:p>" + r('<w:color w:val="949494"/><w:sz w:val="56"/>', "Big gray") + r('<w:color w:val="949494"/>', "Small gray") + "</w:p>" +
    "<w:p>" + r('<w:color w:themeColor="accent1" w:themeTint="66"/>', "Pale accent") + r('<w:color w:themeColor="accent1"/>', "Full accent") + "</w:p>" +
    "<w:p>" + r('<w:color w:val="FFFFFF"/><w:highlight w:val="yellow"/>', "White on yellow") + "</w:p>" +
    '<w:p><w:pPr><w:shd w:val="clear" w:fill="002F6D"/></w:pPr>' + r('<w:color w:val="auto"/>', "Auto on navy") + "</w:p>" +
    '<w:tbl><w:tr><w:tc><w:tcPr><w:shd w:val="clear" w:fill="002F6D"/></w:tcPr><w:p>' + r('<w:color w:val="1F3A68"/>', "Navy in a navy cell") + "</w:p></w:tc></w:tr></w:tbl>" +
    '<w:tbl><w:tblPr><w:tblStyle w:val="GridHeader"/></w:tblPr><w:tr><w:tc><w:p>' + r('<w:color w:val="FFFFFF"/>', "Styled header") + "</w:p></w:tc></w:tr></w:tbl>" +
    // A box with no fill, inside a run that has a color of its own, and Word's VML copy of it.
    '<w:p><mc:AlternateContent><mc:Choice Requires="wps"><w:r><w:rPr><w:color w:val="EEEEEE"/></w:rPr><w:drawing><wp:anchor><wp:docPr id="7" name="Text Box 6" descr="box"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:noFill/></wps:spPr><wps:txbx><w:txbxContent><w:p>' + r('<w:color w:val="FFFFFF"/>', "In a box") + "</w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></mc:Choice>" +
    '<mc:Fallback><w:r><w:pict><v:shape><v:textbox><w:txbxContent><w:p>' + r('<w:color w:val="FFFFFF"/>', "In a box") + "</w:p></w:txbxContent></v:textbox></v:shape></w:pict></w:r></mc:Fallback></mc:AlternateContent></w:p>" +
    box('<a:solidFill><a:srgbClr val="002F6D"/></a:solidFill>', "", r('<w:color w:val="FFFFFF"/>', "White in a navy box")) +
    box("", '<wps:style><a:fillRef idx="1"><a:schemeClr val="accent1"/></a:fillRef></wps:style>', r('<w:color w:val="FFFFFF"/>', "White in a themed box")) +
    "</w:body></w:document>");
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
// A workbook: Sheet1 holds a table with no header row and data that a formula on
// Summary and a chart read; Summary merges a title; openpyxl-style absolute targets.
const S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
function workbook() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE(null));
  z.file("docProps/app.xml", '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><TitlesOfParts><vt:vector size="2" baseType="lpstr"><vt:lpstr>Sheet1</vt:lpstr><vt:lpstr>Summary</vt:lpstr></vt:vector></TitlesOfParts></Properties>');
  z.file("xl/workbook.xml", '<workbook ' + S + '><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/><sheet name="Summary" sheetId="2" r:id="rId2"/></sheets>' +
    '<definedNames><definedName name="Colleges">Sheet1!$A$2:$A$4</definedName></definedNames></workbook>');
  z.file("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="/xl/worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>');
  z.file("xl/sharedStrings.xml", '<sst ' + S + '><si><t>Colleges by awards</t></si><si><t>College</t></si><si><t>Awards</t></si><si><t>Riverside</t></si><si><t>Norco</t></si><si><t>Moreno Valley</t></si></sst>');
  const row = (r, a, b) => '<row r="' + r + '"><c r="A' + r + '" t="s"><v>' + a + '</v></c>' + (b == null ? "" : '<c r="B' + r + '"><v>' + b + '</v></c>') + "</row>";
  z.file("xl/worksheets/sheet1.xml", '<worksheet ' + S + '><sheetData>' + row(1, 0) + row(2, 3, 40) + row(3, 4, 25) + row(4, 5, 12) + '</sheetData>' +
    '<drawing r:id="rId1"/><tableParts count="1"><tablePart r:id="rId2"/></tableParts></worksheet>');
  z.file("xl/worksheets/_rels/sheet1.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="../drawings/drawing1.xml"/><Relationship Id="rId2" Target="../tables/table1.xml"/></Relationships>');
  z.file("xl/tables/table1.xml", '<table ' + S + ' id="1" name="Table1" displayName="Awards" ref="A2:B4" headerRowCount="0"/>');
  z.file("xl/worksheets/sheet2.xml", '<worksheet ' + S + '><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Total</t></is></c><c r="B1"><f>SUM(Sheet1!B2:B4)&amp;"Sheet1!"&amp;[1]Sheet1!A1</f><v>77</v></c></row></sheetData>' +
    '<mergeCells count="1"><mergeCell ref="A1:C1"/></mergeCells></worksheet>');
  z.file("xl/drawings/drawing1.xml", '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
    '<xdr:twoCellAnchor><xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Chart 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><a:graphic><a:graphicData><c:chart r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>' +
    '<xdr:twoCellAnchor><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="3" name="Logo" descr="CPL Initiative"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId2"/></xdr:blipFill></xdr:pic><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>');
  z.file("xl/drawings/_rels/drawing1.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="../charts/chart1.xml"/><Relationship Id="rId2" Target="../media/image1.png"/></Relationships>');
  z.file("xl/charts/chart1.xml", '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:plotArea><c:barChart><c:ser>' +
    '<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f><c:strCache><c:pt idx="0"><c:v>Riverside</c:v></c:pt><c:pt idx="1"><c:v>Norco</c:v></c:pt><c:pt idx="2"><c:v>Moreno Valley</c:v></c:pt></c:strCache></c:strRef></c:cat>' +
    '<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f><c:numCache><c:pt idx="0"><c:v>40</c:v></c:pt><c:pt idx="1"><c:v>25</c:v></c:pt><c:pt idx="2"><c:v>12</c:v></c:pt></c:numCache></c:numRef></c:val></c:ser></c:barChart></c:plotArea></c:chart></c:chartSpace>');
  z.file("xl/media/image1.png", "png");
  return z.generateAsync({ type: "nodebuffer" });
}
// A workbook's colors (13): gold on white, white on navy, white bold 14pt on yellow, the
// theme's Text 1 and Background 1 (Excel counts lt1 first), a pale tinted accent, a
// styled table, a run colored inside a cell, and conditional formatting.
function colorWorkbook() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE("Colors"));
  z.file("xl/workbook.xml", '<workbook ' + S + '><sheets><sheet name="Colors" sheetId="1" r:id="rId1"/><sheet name="Table" sheetId="2" r:id="rId2"/></sheets></workbook>');
  z.file("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Target="theme/theme1.xml"/><Relationship Id="rId4" Target="styles.xml"/></Relationships>');
  z.file("xl/theme/theme1.xml", '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="T"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>' +
    '<a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1></a:clrScheme></a:themeElements></a:theme>');
  const font = (inner) => "<font>" + inner + '<name val="Calibri"/><family val="2"/></font>';
  z.file("xl/styles.xml", '<styleSheet ' + S + '><fonts count="6">' + font('<sz val="11"/><color theme="1"/>') + font('<sz val="11"/><color rgb="FFE8A32C"/>') +
    font('<sz val="11"/><color rgb="FFFFFFFF"/>') + font('<b/><sz val="14"/><color rgb="FFFFFFFF"/>') + font('<sz val="11"/><color theme="0"/>') + font('<sz val="11"/><color theme="4" tint="0.59999389629810485"/>') + "</fonts>" +
    '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002F6D"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor indexed="5"/></patternFill></fill></fills>' +
    '<cellXfs count="6"><xf fontId="0" fillId="0"/><xf fontId="1" fillId="0" applyFont="1"/><xf fontId="2" fillId="2" applyFont="1"/><xf fontId="3" fillId="3" applyFont="1"/><xf fontId="4" fillId="0"/><xf fontId="5" fillId="0"/></cellXfs></styleSheet>');
  z.file("xl/sharedStrings.xml", '<sst ' + S + '><si><t>Gold note</t></si><si><r><t>Plain and </t></r><r><rPr><sz val="11"/><color rgb="FFFFD966"/></rPr><t>pale yellow</t></r></si></sst>');
  const c = (r, s, text) => '<c r="' + r + '" s="' + s + '" t="inlineStr"><is><t>' + text + "</t></is></c>";
  z.file("xl/worksheets/sheet1.xml", '<worksheet ' + S + '><sheetData><row r="1"><c r="A1" s="1" t="s"><v>0</v></c>' + c("B1", 1, "Gold again") + c("C1", 2, "White on navy") + c("D1", 3, "Banner on yellow") + "</row>" +
    '<row r="2">' + c("A2", 0, "Text one") + c("B2", 4, "Background one") + c("C2", 5, "Pale accent") + '<c r="D2" t="s"><v>1</v></c><c r="E2" s="1"/></row></sheetData>' +
    '<conditionalFormatting sqref="A1:A2"><cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThan"><formula>0</formula></cfRule></conditionalFormatting></worksheet>');
  z.file("xl/worksheets/sheet2.xml", '<worksheet ' + S + '><sheetData><row r="1">' + c("A1", 2, "Header") + c("B1", 1, "Gold heading") + '</row><row r="2">' + c("A2", 1, "Gold in band") + c("B2", 0, "Plain") + "</row></sheetData>" +
    '<tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>');
  z.file("xl/worksheets/_rels/sheet2.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="../tables/table1.xml"/></Relationships>');
  z.file("xl/tables/table1.xml", '<table ' + S + ' id="1" name="T1" displayName="Banded" ref="A1:B2"><tableStyleInfo name="TableStyleMedium2" showRowStripes="1"/></table>');
  return z.generateAsync({ type: "nodebuffer" });
}
function cfWorkbook() {
  const z = new JSZip();
  z.file("docProps/core.xml", CORE("Rules"));
  z.file("xl/workbook.xml", '<workbook ' + S + '><sheets><sheet name="Rules" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.file("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId3" Target="theme/theme1.xml"/></Relationships>');
  z.file("xl/theme/theme1.xml", '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="T"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1></a:clrScheme></a:themeElements></a:theme>');
  const font = (inner) => "<font>" + inner + '<name val="Calibri"/></font>';
  // dxf 0: Excel's dark red on light red (passes) · 1: yellow words, no fill · 2: a navy fill, no font color ·
  // 3: red words, no fill · 4: a gray125 pattern.
  z.file("xl/styles.xml", '<styleSheet ' + S + '><fonts count="2">' + font('<sz val="11"/><color theme="1"/>') + font('<sz val="11"/><color rgb="FFFFFFFF"/>') + "</fonts>" +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF002F6D"/></patternFill></fill></fills>' +
    '<cellXfs count="2"><xf fontId="0" fillId="0"/><xf fontId="1" fillId="2" applyFont="1"/></cellXfs>' +
    '<dxfs count="5"><dxf><font><color rgb="FF9C0006"/></font><fill><patternFill><bgColor rgb="FFFFC7CE"/></patternFill></fill></dxf>' +
    '<dxf><font><b/><color rgb="FFFFFF00"/></font></dxf><dxf><fill><patternFill><bgColor rgb="FF002F6D"/></patternFill></fill></dxf>' +
    '<dxf><font><color rgb="FFFF0000"/></font></dxf><dxf><fill><patternFill patternType="gray125"><bgColor rgb="FFFF0000"/></patternFill></fill></dxf></dxfs></styleSheet>');
  const c = (r, s, text) => '<c r="' + r + '" s="' + s + '" t="inlineStr"><is><t>' + text + "</t></is></c>";
  const rule = (sqref, inner) => '<conditionalFormatting sqref="' + sqref + '">' + inner + "</conditionalFormatting>";
  const cell = (d, p) => '<cfRule type="cellIs" dxfId="' + d + '" priority="' + p + '" operator="greaterThan"><formula>0</formula></cfRule>';
  z.file("xl/worksheets/sheet1.xml", '<worksheet ' + S + '><sheetData><row r="1">' + c("A1", 0, "Overdue") + c("B1", 0, "Red alert") + c("C1", 1, "Yellow on navy") + c("D1", 0, "Plain") + "</row>" +
    '<row r="2">' + c("A2", 0, "Late") + c("B2", 1, "Red on navy") + "</row></sheetData>" +
    rule("A1:A3", cell(1, 1)) + rule("C1", cell(1, 2)) + rule("D1", cell(0, 3)) + rule("A1:A3", cell(2, 4)) + rule("B1:B2", cell(3, 5)) + rule("D1", cell(4, 6)) +
    rule("A1:A3", '<cfRule type="colorScale" priority="7"><colorScale><cfvo type="min"/><cfvo type="max"/><color rgb="FFF8696B"/><color rgb="FF63BE7B"/></colorScale></cfRule>') +
    rule("Z9", cell(2, 8)) + "</worksheet>");
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
  }).then(function () { return R.inspect(Buffer.from("x"), "Notes.txt", ENV); }).then(function () { check("(6) a text file is refused", false); }, function (e) {
    check("(6) a text file is refused in words that say what it reads", /reads a \.pptx deck, a \.docx document, an \.xlsx workbook or a PDF/.test(e.message), e.message);
  }).then(function () { return R.inspect(Buffer.from("not a pdf"), "Notes.pdf", ENV); }).then(function () { check("(11) a .pdf that is not a PDF is refused", false); }, function (e) {
    check("(11) a .pdf that is not a PDF is refused in words", /does not read as a PDF/.test(e.message), e.message);
  }).then(function () {
    // (11) A PDF is fixed at its source (S513): read, named, and left as it is.
    const word = makePdf({ objstm: true, creator: "Microsoft\xAE Word for Microsoft 365", producer: "Microsoft\xAE Word for Microsoft 365",
      title: "TMC Template for Music", titleHex: true, lang: "en-US", spanLang: "fr", tagged: true, showTitle: true });
    return R.inspect(word, "2023_Nov_Music_TMC_r.pdf", ENV);
  }).then(function (s) {
    const p = s.report.pdf;
    check("(11) a Word PDF reads its catalog from Office's compressed object stream: tagged, its language, title shown",
      p.tagged && p.lang === "en-US" && p.titleShown && s.report.ext === "pdf", JSON.stringify(p));
    check("(11) the title is the Info dictionary's (UTF-16), never a bookmark's /Title", p.title === "TMC Template for Music", p.title);
    check("(11) a span's /Lang is not the document's", p.lang === "en-US", p.lang);
    check("(11) its source is a Word document, and the steps say how to export it tagged",
      p.source.kind === "document" && p.source.ext === "docx" && /Document structure tags for accessibility/.test(p.steps) && /Word/.test(p.steps), JSON.stringify(p.source));
    check("(11) every check passes, and nothing is offered to write into the PDF", p.checks.every(function (c) { return c.ok; }) && s.doc === null && s.report.needs.length === 0);
    check("(11) the extent names the pages and the program", s.report.extent === "1 page, made with Microsoft\xAE Word for Microsoft 365", s.report.extent);
    return R.inspect(makePdf({ creator: "Microsoft PowerPoint", title: "PowerPoint Presentation", lang: "fr" }), "Webinar.pdf", ENV);
  }).then(function (s) {
    const p = s.report.pdf, gaps = p.checks.filter(function (c) { return !c.ok; }).map(function (c) { return c.text; });
    check("(11) an untagged deck's PDF names PowerPoint and its export steps", p.source.kind === "deck" && p.source.ext === "pptx" && /PowerPoint choose File, Export/.test(p.steps));
    check("(11) the gaps are said in words: not tagged, a language other than English, a stock title as none",
      gaps.length === 3 && /^Not tagged/.test(gaps[0]) && /set to fr, not English/.test(gaps[1]) && /no title/.test(gaps[2]), JSON.stringify(gaps));
    return R.inspect(makePdf({ producer: "Canon iR-ADV C5535 PDF", fonts: false }), "Scan.pdf", ENV);
  }).then(function (s) {
    const p = s.report.pdf;
    check("(11) a PDF with no fonts reads as a scan, and the steps send it to its original or to OCR",
      p.source.kind === "scan" && !p.hasText && /Scan and OCR/.test(p.steps) && p.checks.some(function (c) { return !c.ok && /no text/.test(c.text); }));
    check("(11) Google Docs and a printed web page are named as such",
      R._pdfSource("Google Docs Renderer", "", true).google && R._pdfSource("Google Docs Renderer", "", true).ext === "docx" &&
      R._pdfSource("Chromium", "Skia/PDF m141", true).kind === "web" && R._pdfSource("Adobe InDesign 20.1", "Adobe PDF Library 17.0", true).kind === "layout");
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
}).then(function () {
  return workbook().then(function (buf) { return R.inspect(buf, "20261029_College_Awards.xlsx", ENV); }).then(function (s) {
    const rep = s.report, need = function (id) { return rep.needs.filter(function (n) { return n.id === id; })[0]; };
    check("(12) a workbook reports its sheets and takes its title from the file's name", rep.extent === "2 sheets" && rep.fixed.indexOf("Document title set: College Awards") >= 0, JSON.stringify([rep.extent, rep.fixed]));
    const sh = need("s1");
    check("(12) a sheet at its default name is asked a name, drafted from its first words; a named one is not", !!sh && sh.type === "sheet" && sh.draft === "Colleges by awards" && !need("s2"), JSON.stringify(rep.needs));
    const alts = rep.needs.filter(function (n) { return n.type === "alt"; });
    check("(12) the chart needs alt text, drafted from its numbers; the picture with alt text is left alone", alts.length === 1 && alts[0].chart && alts[0].fromData && /^Bar chart: Colleges by awards\. Riverside 40; Norco 25; Moreno Valley 12\.$/.test(alts[0].draft), JSON.stringify(alts));
    check("(12) a table with no header row is named, and left as it is", /^Awards on Sheet1 has no header row/.test((need("th") || {}).text || ""));
    check("(12) merged cells are named with their sheet", /^Merged cells on Summary \(1\)/.test((need("mc") || {}).text || ""));
    check("(12) data already in a table is not listed as loose", !need("tl"));
    return R.finish(s, { s1: { text: "Awards: by college?" }, [alts[0].id]: { text: "Bar chart of awards by college." } }, "nodebuffer");
  }).then(function (out) {
    check("(12) finish renames the sheet and writes the chart's alt text", out.done.sheets === 1 && out.done.alt === 1, JSON.stringify(out.done));
    return JSZip.loadAsync(out.file).then(function (z) {
      return Promise.all(["xl/workbook.xml", "xl/worksheets/sheet2.xml", "xl/charts/chart1.xml", "docProps/app.xml", "xl/drawings/drawing1.xml"].map(function (p) { return z.file(p).async("string"); }));
    }).then(function (x) {
      check("(12) the new name drops the characters Excel refuses", /<sheet name="Awards by college" /.test(x[0]), x[0]);
      check("(12) the defined name follows the sheet", /<definedName name="Colleges">'Awards by college'!\$A\$2:\$A\$4<\/definedName>/.test(x[0]), x[0]);
      check("(12) the formula follows; its string literal and the other workbook's sheet stay", x[1].indexOf("SUM('Awards by college'!B2:B4)&amp;\"Sheet1!\"&amp;[1]Sheet1!A1") >= 0, x[1]);
      check("(12) the chart's series follow", (x[2].match(/'Awards by college'!/g) || []).length === 2 && !/Sheet1/.test(x[2]));
      check("(12) the list of parts follows", /<vt:lpstr>Awards by college<\/vt:lpstr>/.test(x[3]));
      check("(12) the alt text lands on the chart's frame", /<xdr:cNvPr id="2" name="Chart 1" descr="Bar chart of awards by college\."/.test(x[4]), x[4]);
    });
  });
}).then(function () {
  check("(12) renameRefs leaves a sheet it was not asked about", R._renameRefs("Other!A1+'Sheet 1'!B2", { "sheet 1": "Data" }) === "Other!A1+'Data'!B2");
}).then(function () {
  return contrastWord().then(function (buf) { return R.inspect(buf, "Contrast.docx", ENV); }).then(function (s) {
    const cs = s.report.needs.filter(function (n) { return n.type === "contrast"; });
    const has = function (re) { return cs.filter(function (n) { return re.test(n.text); })[0]; };
    check("(9) white text in a paragraph style's navy shading is not read as white on white", !has(/BANNER/), JSON.stringify(cs.map(function (n) { return n.text; })));
    const gold = has(/New in 2026/);
    check("(9) a character style's gold is measured on white at 4.5:1", !!gold && gold.fg === "E8A32C" && gold.bg === "FFFFFF" && gold.need === 4.5, gold && gold.text);
    check("(9) 14pt bold gold is large, at 3:1", !!has(/Gold bold heading/) && has(/Gold bold heading/).need === 3);
    check("(9) 28pt gray passes as large text; the same gray at the default size does not", !has(/Big gray/) && !!has(/Small gray/));
    check("(9) a theme color with a tint is measured tinted: the pale accent fails, the full one passes", !!has(/Pale accent/) && !has(/Full accent/));
    check("(9) a highlight is what the run sits on", !!has(/White on yellow/) && has(/White on yellow/).bg === "FFFF00");
    check("(9) auto text never fails", !has(/Auto on navy/));
    check("(9) a table cell's shading is what its text sits on", !!has(/navy cell/) && has(/navy cell/).bg === "002F6D");
    check("(9) text in a table its style shades, or a box its theme fills, is named for a person, not measured", s.report.needs.some(function (n) { return n.id === "cu" && /^Contrast on 2 runs of text/.test(n.text); }) && !has(/themed box/) && !has(/Styled header/), JSON.stringify(s.report.needs.filter(function (n) { return n.type === "info"; })));
    const inBox = has(/In a box/);
    check("(10) a text box with no fill is measured on the page, once though Word keeps a VML copy", !!inBox && inBox.bg === "FFFFFF" && inBox.runs.length === 1, inBox && inBox.text);
    check("(10) a text box's own fill is what its words sit on", !has(/navy box/));
    check("(10) a run holding a text box is not read with the box's words", !cs.some(function (n) { return n.fg === "EEEEEE"; }));
    const hd = has(/CPL Initiative/);
    check("(10) a header is read: its gold is named, in a header, with the header's part", !!hd && hd.path === "word/header1.xml" && / in a header in #E8A32C/.test(hd.text), hd && hd.text);
    const ft = cs.filter(function (n) { return n.path === "word/footer2.xml"; });
    check("(10) a footer is read: the light gray fails, the dark gray passes", ft.length === 1 && / in a footer /.test(ft[0].text) && /Draft/.test(ft[0].text), JSON.stringify(ft.map(function (n) { return n.text; })));
    check("(10) each item's id is its own across the parts", new Set(cs.map(function (n) { return n.id; })).size === cs.length);
    check("(9) each fix keeps the hue and passes its own bar", cs.every(function (n) { return R._ratio(n.fix, n.bg) >= n.need; }));
    const ans = {}; cs.forEach(function (n) { ans[n.id] = { fix: true }; });
    return R.finish(s, ans, "nodebuffer").then(function (out) {
      check("(9) finish writes the fix onto each run it covers", out.done.colors === cs.reduce(function (a, n) { return a + n.runs.length; }, 0) && out.done.colors >= 6, JSON.stringify(out.done));
      let z;
      return JSZip.loadAsync(out.file).then(function (zz) { z = zz; return z.file("word/document.xml").async("string"); }).then(function (xml) {
        check("(9) the new color sits before the size, as the schema orders a run's settings", /<w:color w:val="[0-9A-F]{6}"\/><w:sz w:val="28"\/>/.test(xml), xml.slice(0, 0));
        return z.file("word/header1.xml").async("string").then(function (hx) {
          check("(10) the fix is written in the header itself", /<w:color w:val="[0-9A-F]{6}"\/>/.test(hx) && !/E8A32C/.test(hx), hx);
          return R.inspect(out.file, "Contrast.docx", ENV);
        });
      });
    }).then(function (again) {
      check("(9) the remediated document has no contrast item left", !again.report.needs.some(function (n) { return n.type === "contrast"; }), JSON.stringify(again.report.needs.map(function (n) { return n.text; })));
    });
  });
});

const run2 = run.then(function () {
  return colorWorkbook().then(function (buf) { return R.inspect(buf, "Colors.xlsx", ENV); }).then(function (s) {
    const cs = s.report.needs.filter(function (n) { return n.type === "contrast"; }), need = function (id) { return s.report.needs.filter(function (n) { return n.id === id; })[0]; };
    const has = function (re) { return cs.filter(function (n) { return re.test(n.text); })[0]; };
    const gold = cs.filter(function (n) { return n.fg === "E8A32C"; })[0];
    check("(13) gold on white is one item for both cells, a shared string and an inline one; the empty cell is not counted", !!gold && gold.bg === "FFFFFF" && gold.need === 4.5 && gold.cells.length === 2 && /^2 cells on Colors /.test(gold.text), JSON.stringify(cs.map(function (n) { return n.text; })));
    check("(13) white on a navy fill passes", !cs.some(function (n) { return n.bg === "002F6D"; }));
    const ban = cs.filter(function (n) { return n.bg === "FFFF00"; })[0];
    check("(13) 14pt bold white on an indexed yellow fill fails as large text, at 3:1", !!ban && ban.need === 3 && /large text/.test(ban.text), ban && ban.text);
    check("(13) theme 1 is Text 1 (black, passes) and theme 0 Background 1 (white, fails): Excel counts lt1 first", !has(/Text one/) && !!has(/Background one/) && has(/Background one/).fg === "FFFFFF");
    check("(13) a tinted accent is measured tinted, and fails", !!has(/Pale accent/));
    check("(13) words the color of their fill are called hidden; colors that merely fall short are not", /cannot be seen/.test(has(/Background one/).text) && !/cannot be seen/.test(gold.text));
    check("(13) a run colored inside a cell is named with its cell, for a person", /on Colors \(D2\)/.test((need("cr") || {}).text || ""), JSON.stringify(need("cr")));
    check("(13) cells in a styled table with no fill of their own are counted, not measured; its navy header still is",
      /^Contrast on 3 cells in a styled table/.test((need("cu") || {}).text || "") && !cs.some(function (n) { return /on Table /.test(n.text); }), JSON.stringify(need("cu")));
    check("(13) conditional formatting is named with its sheet", /^Conditional formatting on Colors /.test((need("cf") || {}).text || ""));
    check("(13) each fix passes its own bar", cs.every(function (n) { return R._ratio(n.fix, n.bg) >= n.need; }));
    const ans = {}; cs.forEach(function (n) { ans[n.id] = { fix: true }; });
    return R.finish(s, ans, "nodebuffer").then(function (out) {
      check("(13) finish recolors every cell it listed", out.done.colors === cs.reduce(function (a, n) { return a + n.cells.length; }, 0) && out.done.colors === 5, JSON.stringify(out.done));
      return JSZip.loadAsync(out.file).then(function (z) {
        return Promise.all(["xl/styles.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"].map(function (p) { return z.file(p).async("string"); }));
      }).then(function (x) {
        check("(13) the old formats stay; new fonts and formats are added, counted, the color before the name", /<cellXfs count="10">/.test(x[0]) && /<fonts count="10">/.test(x[0]) && /<xf fontId="1" fillId="0" applyFont="1"\/>/.test(x[0]) && /<color rgb="FF[0-9A-F]{6}"\/><name val="Calibri"\/>/.test(x[0]), x[0]);
        check("(13) the gold cells point at one new format; the gold in the table keeps its own", /<c r="A1" s="6"/.test(x[1]) && /<c r="B1" s="6"/.test(x[1]) && /<c r="E2" s="1"/.test(x[1]) && /<c r="B1" s="1"/.test(x[2]), x[1] + x[2]);
        return R.inspect(out.file, "Colors.xlsx", ENV);
      });
    }).then(function (again) {
      check("(13) the remediated workbook has no contrast item left", !again.report.needs.some(function (n) { return n.type === "contrast"; }), JSON.stringify(again.report.needs.map(function (n) { return n.text; })));
    });
  });
});

const run3 = run2.then(function () {
  return cfWorkbook().then(function (buf) { return R.inspect(buf, "Rules.xlsx", ENV); }).then(function (s) {
    const needs = s.report.needs, by = function (d) { return needs.filter(function (n) { return n.dxf === d; })[0]; }, id = function (x) { return needs.filter(function (n) { return n.id === x; })[0] || {}; };
    const yel = by(1), navy = by(2);
    check("(14) yellow words from a rule fail on white and are one item, its passing rule on navy left out", !!yel && yel.type === "contrast" && yel.bg === "FFFFFF" && yel.rules.length === 1 && yel.rules[0].rule === 0, JSON.stringify(needs));
    check("(14) a rule that paints only a fill is measured against the cell's own words, including a range with no cell (the sheet's default)", !!navy && navy.fg === "000000" && navy.bg === "002F6D" && navy.rules.length === 2, JSON.stringify(navy));
    check("(14) Excel's dark red on light red passes", !by(0));
    check("(14) a rule meeting white and navy with no one passing color is listed for a person", !needs.some(function (n) { return n.dxf === 3; }) && needs.some(function (n) { return n.type === "info" && /^A conditional-formatting rule on Rules B1:B2, when it holds, shows words in #FF0000 .*No one color passes/.test(n.text); }), JSON.stringify(needs.map(function (n) { return n.text; })));
    check("(14) a patterned rule fill is counted, not measured", /^Conditional formatting on 1 cell paints on/.test(id("cfu").text || ""), id("cfu").text);
    check("(14) a color scale is named with its sheet", /^Conditional formatting on Rules uses a color scale/.test(id("cf").text || ""), id("cf").text);
    check("(14) a rule item names its sheet and ranges, both rules of one dxf", /^2 conditional-formatting rules on Rules A1:A3 and Rules Z9, when they hold, show words in #000000 on #002F6D/.test(navy.text), navy.text);
    check("(14) each rule fix passes its own bar", R._ratio(yel.fix, yel.bg) >= yel.need && R._ratio(navy.fix, navy.bg) >= navy.need);
    const ans = {}; [yel, navy].forEach(function (n) { ans[n.id] = { fix: true }; });
    return R.finish(s, ans, "nodebuffer").then(function (out) {
      check("(14) finish repoints three rules", out.done.colors === 3, JSON.stringify(out.done));
      return JSZip.loadAsync(out.file).then(function (z) { return Promise.all(["xl/styles.xml", "xl/worksheets/sheet1.xml"].map(function (p) { return z.file(p).async("string"); })); }).then(function (x) {
        check("(14) the old dxfs stay; two copies are added and counted, the new color in the font", /<dxfs count="7">/.test(x[0]) && /<dxf><font><b\/><color rgb="FFFFFF00"\/><\/font><\/dxf>/.test(x[0]) && /<dxf><font><color rgb="FF[0-9A-F]{6}"\/><\/font><fill>/.test(x[0]), x[0]);
        const ids = (x[1].match(/dxfId="\d+"/g) || []).join(" ");
        check("(14) only the failing rules point at the copies; the passing yellow rule keeps its dxf", ids === 'dxfId="5" dxfId="1" dxfId="0" dxfId="6" dxfId="3" dxfId="4" dxfId="6"', ids);
        return R.inspect(out.file, "Rules.xlsx", ENV);
      });
    }).then(function (again) {
      check("(14) the remediated workbook has no rule contrast item left", !again.report.needs.some(function (n) { return n.type === "contrast"; }), JSON.stringify(again.report.needs.map(function (n) { return n.text; })));
    });
  });
});

run3.catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let pass = 0;
  results.forEach(function (r) { console.log((r[1] ? "  ok  " : "  FAIL ") + r[0] + (r[1] || r[2] == null ? "" : "  — " + r[2])); if (r[1]) pass++; });
  console.log("\nlibrary_remediate.test.js: " + pass + "/" + results.length + " checks passed");
  if (pass !== results.length) process.exit(1);
});
