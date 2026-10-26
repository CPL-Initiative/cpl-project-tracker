// tests/funding_memo_docx.test.js
//
// The memo's Word export (Sam, 2026-10-22): "When I download using the Word
// doc link, the format does not hold up--line breaks don't work on many of the
// paragraphs and the style shifts to a different Word style that's not right."
//
// The export reads the document as the browser holds it after inline edits:
// Chrome writes a new line as a <div>, Shift+Enter as a <br>, and a field's
// label as a <span> beside its text. The old walk split a label from its text
// into two paragraphs, dropped every <br> outside a <p>, and left Word's own
// heading styles in place. Guards: a typed line stays its own paragraph, a <br>
// stays a break, a label stays on its line, and the file carries the memo's
// styles (font, navy headings, masthead, numbered lists, table header).
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "funding-model", "memo", "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://example.org/funding-model/memo/" });
const w = dom.window, doc = w.document;
w.CPL_FUNDING_NO_REMOTE = true;
w.scrollTo = function () {};
["cpl_funding_data.js", "college_short_names.js", "cpl_funding.js"].forEach(function (f) {
  w.eval(fs.readFileSync(path.join(ROOT, f), "utf8"));
});
w.docx = require(path.join(ROOT, "docx.min.js"));
const T = w.CPL_FUNDING_TAB;

// One entry out of a .docx (a zip), read with node's own inflate.
function unzipEntry(buf, name) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  let p = buf.readUInt32LE(eocd + 16);
  const n = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < n; i++) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42), fname = buf.toString("utf8", p + 46, p + 46 + nlen);
    if (fname === name) {
      const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const raw = buf.subarray(start, start + csize);
      return (method === 8 ? zlib.inflateRawSync(raw) : raw).toString("utf8");
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}
// The visible text of each <w:p>, with a break written as "\n".
function paragraphs(xml) {
  return (xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []).map(function (p) {
    return (p.match(/<w:t[ >][^<]*<\/w:t>|<w:br\/>/g) || []).map(function (t) {
      return t === "<w:br/>" ? "\n" : t.replace(/<[^>]+>/g, "");
    }).join("").replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"');
  });
}

(async function () {
  const memo = doc.createElement("div");
  memo.id = "cplFundMemo";
  memo.innerHTML = T._buildMemo("memo") +
    // What Chrome leaves after typing into the document:
    "<div>A line typed after the cc, its own paragraph.</div>" +
    "<div>First half<br>second half after Shift+Enter.</div>" +
    "<div><br></div>" +
    "<p>Pasted <span style=\"font-weight: bold;\">bold words</span> and <em>italic words</em> " +
    "with a <a href=\"https://map.rccd.edu/\">link</a>.</p>" +
    "<ol><li>First step</li><li>Second step</li></ol>";
  doc.body.appendChild(memo);

  const buf = Buffer.from(await w.docx.Packer.toBuffer(T._memoDocxDocument(memo)));
  if (process.env.MEMO_DOCX_OUT) fs.writeFileSync(process.env.MEMO_DOCX_OUT, buf);
  const body = unzipEntry(buf, "word/document.xml");
  const styles = unzipEntry(buf, "word/styles.xml");
  check("the export builds a Word file", !!body && !!styles);
  const paras = paragraphs(body || "");

  check("a field's label stays on the line with its text",
    paras.some(function (t) { return /^TO: Chief Executive Officers/.test(t); }) && !paras.includes("TO:"));
  check("the masthead is one paragraph with its lines broken",
    paras.some(function (t) { return /^California Community Colleges Chancellor's Office\nAcademic Affairs Division\n1102 Q Street/.test(t); }));
  check("a line typed as a <div> is its own paragraph", paras.includes("A line typed after the cc, its own paragraph."));
  check("a Shift+Enter break inside a <div> survives", paras.includes("First half\nsecond half after Shift+Enter."));
  check("an empty typed line stays a blank line", paras.includes(""));
  check("inline formatting stays inside one paragraph",
    paras.includes("Pasted bold words and italic words with a link."));
  check("bold and italic carry over", /<w:b\/>[\s\S]*?bold words/.test(body) && /<w:i\/>[\s\S]*?italic words/.test(body));
  check("a link stays a link", /<w:hyperlink /.test(body));
  check("a numbered list is numbered, not bulleted",
    /<w:numId w:val="\d+"\/>[\s\S]*?First step/.test(body) && /memo-ol|w:numFmt w:val="decimal"/.test(unzipEntry(buf, "word/numbering.xml") || ""));
  check("no paragraph starts or ends in stray spaces",
    paras.every(function (t) { return t === t.trim() || /\n/.test(t); }));

  check("the memo's font is the document default", /<w:docDefaults>[\s\S]*?w:ascii="Arial"/.test(styles));
  check("headings carry the memo's navy, not Word's theme",
    /w:styleId="Heading1"[\s\S]*?<w:color w:val="002F6D"\/>/.test(styles) &&
    /w:styleId="Heading2"[\s\S]*?<w:color w:val="002F6D"\/>/.test(styles));
  check("the masthead, fields and cc have their own styles",
    /w:styleId="MemoMasthead"/.test(styles) && /w:pStyle w:val="MemoMasthead"/.test(body) &&
    /w:pStyle w:val="MemoField"/.test(body) && /w:pStyle w:val="MemoCc"/.test(body));
  check("the allocation table's header row is navy", /<w:shd [^>]*w:fill="002F6D"/.test(body) && /<w:tblHeader\/>/.test(body));
  check("paragraphs are spaced the way the memo is", /<w:spacing [^>]*w:after="160"/.test(styles));
  // What a screen reader and Word's accessibility checker read (2026-10-26): the
  // document's language, a title in its properties, real heading styles, a header
  // row Word repeats, and no picture without its text.
  const core = unzipEntry(buf, "docProps/core.xml") || "";
  check("the document's language is set (en-US, in the defaults every run inherits)",
    /<w:rPrDefault>[\s\S]*?<w:lang w:val="en-US"\/>[\s\S]*?<\/w:rPrDefault>/.test(styles));
  check("the file carries a title in its core properties", /<dc:title>[^<]*\S[^<]*<\/dc:title>/.test(core));
  check("headings use Word's Heading 1 and Heading 2 styles",
    /<w:pStyle w:val="Heading1"\/>[\s\S]*?MEMORANDUM/.test(body) && /<w:pStyle w:val="Heading2"\/>/.test(body));
  check("a picture, if the memo ever carries one, has its alternative text",
    (body.match(/<wp:docPr [^>]*>/g) || []).every(function (p) { return /descr="[^"]+"/.test(p); }));

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch(function (e) { console.error(e); process.exit(1); });
