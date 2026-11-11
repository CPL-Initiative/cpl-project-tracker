// A Library piece carries the pictures its documents hold (Sam, 2026-11-11).
//
// Sam, on the visual made in the Library from a deck's PDF: "the visual didn't include any of the map screenshots
// from the pdf that the user will need to know how to navigate map. i'd like to edit it in the library (not here)",
// then "it would be even better if you ... just assemble the pics together with the text from the get go".
//
// Guards the failure modes:
//   A. The model places a picture with a marker and never writes an image tag: the marker becomes the one fixed
//      figure, its alt text escaped; an unknown or repeated picture is dropped; no bracketed text stays on a page.
//   B. The checks that were there still refuse any other image (the allowlist, the frozen sources).
//   C. A PDF dropped on a Requested card saves its pictures (found where pdf.js says its images sit; a logo and a
//      background are skipped), and the same file dropped twice adds neither its words nor its pictures again.
//   D. The card shows the pictures before publishing: Leave it out, Cover or crop, and Publish it waits for the box
//      that says they were checked.
//   E. A draft opens with its pictures in place, and without one that was left out.
//   F. The function reads the pictures, shows them to the model and places the markers; the table's grants.
//
// Run: node tests/library_pictures.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
const NEW = { id: "n1", slug: "adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5", title: "Adding CPL Coordinator & Noncredit Lead to MAP",
  kind: "visual", status: "requested", seen_by: "colleges", home: "not_filed", url: null, versions: [], created_at: "2026-11-10T15:40:51Z",
  brief: { say: "Convert this to a visual colleges can follow.", requested_by: "Sam", requested_on: "2026-11-10" }, sources: [] };
function loadModule(rows, pics, fetchFn) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root">Loading</div></body></html>',
    { url: "https://example.org/#library/cards", runScripts: "dangerously" });
  const w = dom.window, writes = [];
  const data = JSON.parse(JSON.stringify(rows)), held = JSON.parse(JSON.stringify(pics || []));
  w.fetch = function (url, init) {
    init = init || {}; url = String(url);
    if (fetchFn) { const r = fetchFn(url, init); if (r) return r; }
    const isPics = /cpl_library_pictures/.test(url);
    if (init.method && init.method !== "GET") {
      const body = JSON.parse(init.body || "{}");
      writes.push({ url: url, method: init.method, body: body });
      if (isPics && init.method === "POST") body.forEach(function (b) { held.push(Object.assign({ id: "pic" + b.n, left_out: false }, b)); });
      const ph = /cpl_library_pictures\?id=eq\.([\w-]+)$/.exec(url);
      if (ph) held.forEach(function (x) { if (x.id === ph[1]) Object.assign(x, body); });
      const hit = /cpl_library\?id=eq\.([\w-]+)$/.exec(url);
      if (init.method === "PATCH" && hit) data.forEach(function (r) { if (r.id === hit[1]) Object.assign(r, body); });
      return response(201, [Object.assign({ id: "new1" }, Array.isArray(body) ? {} : body)]);
    }
    if (isPics) return response(200, held);
    if (/cpl_library_drafts/.test(url)) return response(200, []);
    return response(200, data);
  };
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Sam");
  // jsdom draws nothing: a canvas that answers as a browser's would.
  w.HTMLCanvasElement.prototype.getContext = function () { return { drawImage: function () {}, fillRect: function () {} }; };
  w.HTMLCanvasElement.prototype.toDataURL = function (t) { return "data:" + (t === "image/webp" ? "image/webp;base64,UklGR" : "image/png;base64,iVBORw0KGgo") + "QUJD".repeat(40); };
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  return { w: w, doc: w.document, writes: writes, held: held, M: w.CPL_LIBRARY, root: w.document.getElementById("library-root") };
}
const tick = () => new Promise((r) => setTimeout(r, 10));
async function until(f, n) { for (let i = 0; i < (n || 200); i++) { if (f()) return true; await tick(); } return !!f(); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function drop(m, target, file) {
  const ev = new m.w.Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "dataTransfer", { value: { files: [file] } });
  target.dispatchEvent(ev);
}
// pdf.js, stubbed as the deck's second page: a 960 by 540 page whose one screen sits at 254,208 (454 by 319), with
// a full-page background and a small logo the Library must skip.
const OPS = { save: 1, restore: 2, transform: 3, paintImageXObject: 4, paintInlineImageXObject: 5 };
function img(x, y, w, h) { return [[OPS.save, null], [OPS.transform, [w, 0, 0, h, x, y]], [OPS.paintImageXObject, ["img"]], [OPS.restore, null]]; }
function opsOf(list) { const flat = [].concat.apply([], list); return { fnArray: flat.map((x) => x[0]), argsArray: flat.map((x) => x[1]) }; }
const PAGE_OPS = opsOf([img(0, 70, 960, 470), img(254, 13, 454, 319), img(0, 0, 267, 61)]);
function pdfStub() {
  return { OPS: OPS, getDocument: function () { return { promise: Promise.resolve({ numPages: 1, getPage: function () {
    return Promise.resolve({
      getTextContent: function () { return Promise.resolve({ items: [{ str: "1. Log in to MAP.", hasEOL: true }] }); },
      getViewport: function (o) { return { width: 960 * o.scale, height: 540 * o.scale }; },
      getOperatorList: function () { return Promise.resolve(PAGE_OPS); },
      render: function () { return { promise: Promise.resolve() }; } }); } }) }; } };
}
const PIC = (n, more) => Object.assign({ id: "pic" + n, n: n, mime: "image/webp", data: "QUJD".repeat(40), width: 800, height: 600, page: n + 1, source_title: "Deck", left_out: false }, more || {});
const FIG = (n) => '<figure class="shot"><a href="img/' + n + '.webp" target="_blank" rel="noopener"><img src="img/' + n + '.webp" alt="Screen ' + n + '" width="800" height="600" loading="lazy"></a></figure>';

(async function () {
  const pm = await import("../chatbox/supabase/functions/library-revise-draft/pictures.mjs");
  const np = await import("../chatbox/supabase/functions/library-revise-draft/new_page.mjs");
  const ae = await import("../chatbox/supabase/functions/library-revise-draft/apply_edits.mjs");
  // ── A. Markers become figures ──
  {
    const page = "<html><head><style>.a{}</style></head><body><main id=\"main\"><h1>T</h1><ol><li>Open the menu.</li></ol>" +
      "<p>[[picture 1: MAP Main Menu with \"Settings\" & Users boxed in red <b>]]</p><p>[[picture 2: Users table]]</p>" +
      "<p>[[picture 2: again]]</p><p>[[picture 9: not held]]</p><p>See [[picture 1: inline]] here.</p></main></body></html>";
    const bad = page.replace(" <b>", "");
    const out = pm.placePictures(bad, [PIC(1), PIC(2, { mime: "image/png" }), PIC(3, { left_out: true })]);
    check("A ⭐ each marker becomes the one fixed figure, in place", out.placed.join() === "1,2" && pm.figureNumbers(out.html).join() === "1,2" &&
      out.html.indexOf("<li>Open the menu.</li></ol><figure class=\"shot\">") > 0, out.html);
    check("A ⭐ the alt text is escaped", /alt="MAP Main Menu with &quot;Settings&quot; &amp; Users boxed in red"/.test(out.html), out.html);
    check("A the file type comes from the row", /img\/2\.png/.test(out.html) && /img\/1\.webp/.test(out.html));
    check("A ⭐ a picture the record does not hold is dropped and named", out.unknown.join() === "9" && !/img\/9\./.test(out.html));
    check("A ⭐ no bracketed marker stays on the page", !/\[\[picture/.test(out.html), out.html);
    check("A the figure's look is added once, to the page's own style block", out.html.split(pm.PICTURE_CSS_MARK).length === 2 && out.html.indexOf(pm.PICTURE_CSS_MARK) < out.html.indexOf("</style>") &&
      pm.placePictures(out.html + "<p>[[picture 3: x]]</p>", [PIC(3)]).html.split(pm.PICTURE_CSS_MARK).length === 2);
    check("A a picture left out is not placed", pm.placePictures("<p>[[picture 3: x]]</p>", [PIC(3, { left_out: true })]).placed.length === 0);
    check("A a marker whose alt carries a tag is not a marker, and is still removed", !/<figure/.test(pm.placePictures(page, [PIC(1)]).html.split("Users table")[0]) && !/\[\[picture/.test(pm.placePictures(page, [PIC(1)]).html));
    check("A stripFigures takes out exactly those figures", pm.stripFigures(out.html).indexOf("<figure") < 0 && pm.stripFigures("<p>a</p>" + FIG(1) + "<img src=\"x\">") === "<p>a</p><img src=\"x\">");
    const py = fs.readFileSync("scripts/library_publish.py", "utf8");
    check("A ⭐ the publisher holds the same figure pattern", py.indexOf('<figure class="shot"><a href="img/(\\d{1,2})\\.(webp|png)" target="_blank" rel="noopener">') > 0 && /width="\\d\{1,5\}" height="\\d\{1,5\}" loading="lazy"><\/a><\/figure>/.test(py));
    check("A the rules tell the model to write a marker and no tag, and to name pictures that show a person", /\[\[picture N: alt text\]\]/.test(pm.PICTURE_RULES) && /Write no image tag/.test(pm.PICTURE_RULES) && /name every picture that shows a person's name/.test(pm.PICTURE_RULES));
  }
  // ── B. The earlier checks stand ──
  {
    const ok = '<main id="main"><h1>T</h1><p>[[picture 1: The Users table]]</p></main>';
    check("B ⭐ a marker passes the new page's allowlist", np.mainProblems(ok).length === 0, np.mainProblems(ok).join("; "));
    check("B ⭐ an image tag in the model's page is still refused", np.mainProblems('<main id="main"><h1>T</h1><img src="img/1.webp" alt="x"></main>').length > 0 &&
      np.mainProblems('<main id="main"><h1>T</h1>' + FIG(1) + "</main>").length > 0);
    const page = "<p>Step one.</p><p>Step two.</p>";
    const marker = ae.applyEdits(page, [{ old: "<p>Step two.</p>", new: "<p>Step two.</p><p>[[picture 1: The Users table]]</p>" }]);
    check("B ⭐ an edit that writes a marker passes", !marker.error && /\[\[picture 1/.test(marker.html));
    check("B ⭐ an edit that writes an image tag is refused", !!ae.applyEdits(page, [{ old: "<p>Step two.</p>", new: '<p>Step two.</p><img src="https://x.example/a.png" alt="">' }]).error &&
      !!ae.applyEdits(page, [{ old: "<p>Step two.</p>", new: "<p>Step two.</p>" + FIG(1) }]).error);
    const withFig = "<p>Step one.</p>" + FIG(1) + "<p>Step two.</p>";
    check("B a figure already on the page may be removed or kept by an edit", !ae.applyEdits(withFig, [{ old: FIG(1), new: "" }]).error && !ae.applyEdits(withFig, [{ old: "Step two.", new: "Step 2." }]).error);
  }
  // ── C. A PDF's pictures are found and saved ──
  {
    const m = loadModule([NEW]); await m.M.activate(); await tick();
    const boxes = m.M._pictureBoxes(PAGE_OPS, OPS, 960, 540);
    check("C ⭐ the screen is found where it sits; the background and the logo are skipped",
      boxes.length === 1 && Math.round(boxes[0].x) === 254 && Math.round(boxes[0].top) === 208 && Math.round(boxes[0].w) === 454 && Math.round(boxes[0].h) === 319, JSON.stringify(boxes));
    m.w.pdfjsLib = pdfStub();
    const file = { name: "Adding_CPL_Coordinator.pdf", arrayBuffer: () => Promise.resolve(new Uint8Array([1])) };
    const zone = m.root.querySelector('[data-newdrop="n1"]');
    drop(m, zone, file);
    await until(() => m.writes.some((x) => /cpl_library_pictures/.test(x.url) && x.method === "POST"));
    const post = m.writes.filter((x) => /cpl_library_pictures/.test(x.url) && x.method === "POST")[0];
    check("C ⭐ a PDF dropped on a Requested card saves its picture, numbered, with its page and document",
      !!post && post.body.length === 1 && post.body[0].library_id === "n1" && post.body[0].n === 1 && post.body[0].page === 1 && post.body[0].mime === "image/webp" &&
      /^[A-Za-z0-9+/=]+$/.test(post.body[0].data) && post.body[0].source_title === "Adding CPL Coordinator" && post.body[0].added_by === "Sam", JSON.stringify(post && post.body).slice(0, 300));
    await until(() => /1 picture found/.test(m.root.textContent));
    check("C the card says how many pictures it found", /words read, 1 picture found\)\. Press Draft it now\./.test(m.root.textContent), m.root.textContent.slice(0, 400));
    const before = m.writes.length;
    drop(m, m.root.querySelector('[data-newdrop="n1"]'), file);
    await until(() => m.writes.length > before); await tick(); await tick();
    const again = m.writes.slice(before);
    check("C ⭐ the same file dropped again adds no second copy of its words or its pictures",
      !again.some((x) => /cpl_library_pictures/.test(x.url)) && again.filter((x) => x.body.sources).every((x) => x.body.sources.length === 1), JSON.stringify(again).slice(0, 300));
  }
  // ── D. The card shows the pictures before publishing ──
  {
    const ready = Object.assign({}, NEW, { regen: { requested_at: "2026-11-10T18:00:00Z", requested_by: "Sam", publish: "show", new_piece: true, ready_at: "2026-11-10T18:01:00Z", draft_id: "11111111-1111-1111-1111-111111111111" } });
    const m = loadModule([ready], [PIC(1), PIC(2)]); await m.M.activate();
    await until(() => m.root.querySelector('[data-picsopen="n1"]'));
    check("D ⭐ a draft with pictures says so and offers Check the pictures", /2 pictures from its documents/.test(m.root.textContent) && /Check the pictures/.test(m.root.querySelector('[data-picsopen="n1"]').textContent));
    const form = m.root.querySelector('form[data-regenokform="n1"]');
    check("D ⭐ Publish it carries the box that says the pictures were checked", !!m.doc.getElementById("ro-pics-n1"));
    form.dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true })); await tick();
    check("D ⭐ and waits for it", !m.writes.some((x) => x.body.regen && x.body.regen.approved_at) && /Check the pictures first/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-picsopen="n1"]'));
    await until(() => m.root.querySelectorAll(".lib-pic img").length === 2);
    const im = m.root.querySelector(".lib-pic img");
    check("D ⭐ the panel shows each picture whole, named for its document and page", !!im && /^data:image\/webp;base64,/.test(im.getAttribute("src")) && /Picture 1, from Deck, page 2/.test(im.getAttribute("alt")));
    click(m.w, m.root.querySelector('[data-picout="n1:2"]'));
    await until(() => m.writes.some((x) => /cpl_library_pictures\?id=eq\.pic2/.test(x.url)));
    const out = m.writes.filter((x) => /cpl_library_pictures\?id=eq\.pic2/.test(x.url))[0];
    check("D ⭐ Leave it out marks the picture, and nothing is deleted", !!out && out.method === "PATCH" && out.body.left_out === true && out.body.changed_by === "Sam");
    await until(() => m.root.querySelector('[data-picback="n1:2"]'));
    check("D a picture left out offers Put it back, and the line counts it", !!m.root.querySelector('[data-picback="n1:2"]') && /1 picture from its documents, 1 left out/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-picedit="n1:1"]'));
    check("D ⭐ Cover or crop opens the part as four numbers, for a keyboard as for a pointer",
      ["l", "t", "w", "h"].every((k) => !!m.doc.getElementById("pe-" + k + "-n1")) && !!m.root.querySelector('[data-piccover="n1:1"]') && !!m.root.querySelector('[data-piccrop="n1:1"]'));
    const box = m.doc.getElementById("ro-pics-n1");
    box.checked = true;
    m.root.querySelector('form[data-regenokform="n1"]').dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    await until(() => m.writes.some((x) => x.body.regen && x.body.regen.approved_at));
    check("D ⭐ with the box ticked, Publish it approves the draft and records who checked the pictures",
      m.writes.some((x) => x.body.regen && x.body.regen.approved_at && x.body.regen.new_piece === true && x.body.regen.pictures_checked_by === "Sam" && x.body.regen.pictures_checked_at === x.body.regen.approved_at));
    check("D the card says a published picture stays in the site's history", /once published stays in the site's history/.test(m.root.textContent));
    const none = loadModule([ready], []); await none.M.activate(); await tick(); await tick();
    check("D a draft with no pictures asks for no box", !none.doc.getElementById("ro-pics-n1") && !none.root.querySelector('[data-picsopen="n1"]'));
  }
  // ── D2. The box says what it did where the person is looking, and the same file twice is one set of pictures ──
  //        (Sam, 2026-11-11: "the text showing they uploaded is below the window of view and I thought nothing
  //        happened when I first clicked", so he added the PDF twice and its five pictures were saved twice).
  {
    const ready = Object.assign({}, NEW, { regen: { requested_at: "2026-11-10T18:00:00Z", requested_by: "Sam", publish: "show", new_piece: true, ready_at: "2026-11-10T18:01:00Z", draft_id: "11111111-1111-1111-1111-111111111111" } });
    const m = loadModule([ready], [], function (url) { return /functions\/v1\/library-revise-draft/.test(url) ? response(200, { draft_id: "22222222-2222-2222-2222-222222222222", summary: "Placed.", new_piece: true }) : null; });
    await m.M.activate(); await tick();
    m.w.pdfjsLib = pdfStub();
    click(m.w, m.root.querySelector('[data-revise="n1"]'));
    click(m.w, m.root.querySelector('[data-cbdocs="n1"]'));
    const file = { name: "Adding_CPL_Coordinator.pdf", arrayBuffer: () => Promise.resolve(new Uint8Array([1])) };
    const give = () => { const inp = m.root.querySelector('[data-cbfile="n1"]'); Object.defineProperty(inp, "files", { value: [file], configurable: true }); inp.dispatchEvent(new m.w.Event("change", { bubbles: true })); };
    give();
    await until(() => /1 picture found/.test(m.root.textContent));
    const line = m.doc.getElementById("cb-msg-n1"), form = m.root.querySelector('form[data-cboxform="n1"]');
    check("D2 ⭐ the line that says the file was read sits inside the box, right under the document field",
      !!line && form.contains(line) && /1 picture found/.test(line.textContent) && !!line.previousElementSibling && !!line.previousElementSibling.querySelector('[data-cbfile="n1"], #cb-link-n1'), line && line.outerHTML);
    check("D2 it is said once, not again under the card", m.root.querySelectorAll(".lib-msg").length === 1);
    give();
    await until(() => /is already here; its words/.test(m.root.textContent));
    check("D2 ⭐ the same file added again says so", /is already here; its words are not added twice/.test(m.doc.getElementById("cb-msg-n1").textContent), m.doc.getElementById("cb-msg-n1").textContent);
    await tick(); await tick();
    m.root.querySelector('form[data-cboxform="n1"]').dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    await until(() => m.writes.some((x) => /cpl_library_pictures/.test(x.url) && x.method === "POST"));
    const posts = m.writes.filter((x) => /cpl_library_pictures/.test(x.url) && x.method === "POST");
    check("D2 ⭐ and its pictures are saved once", posts.length === 1 && posts[0].body.length === 1, JSON.stringify(posts.map((x) => x.body.length)));
    const w = m.writes.filter((x) => x.body && x.body.regen && x.body.regen.based_on_draft)[0];
    check("D2 with no instructions typed, the request asks for the pictures under their steps", !!w && w.body.refresh_note === "Add the pictures under the steps they show." && w.body.sources.length === 1);
  }
  // ── E. The draft opens with its pictures ──
  {
    const m = loadModule([NEW]); await m.M.activate(); await tick();
    const html = "<main>" + FIG(1) + "<p>x</p>" + FIG(2) + FIG(3) + "</main>";
    const out = m.M._draftWithPictures(html, [PIC(1), PIC(2, { left_out: true })]);
    check("E ⭐ a figure shows the record's picture", /<img src="data:image\/webp;base64,QUJD/.test(out) && /alt="Screen 1"/.test(out));
    check("E ⭐ a picture left out, or not held, is dropped from the draft", !/Screen 2/.test(out) && !/Screen 3/.test(out) && !/img\/\d/.test(out));
  }
  // ── F. The function and the table ──
  {
    const fn = fs.readFileSync("chatbox/supabase/functions/library-revise-draft/index.ts", "utf8");
    check("F ⭐ the function reads the piece's pictures with the caller's credential, never one left out", /cpl_library_pictures\?library_id=eq\.\$\{libraryId\}&left_out=is\.false/.test(fn));
    check("F a picture whose bytes are not the type it claims is not sent to the model", /p\.mime === "image\/webp" && \/\^UklGR\/\.test\(p\.data\)/.test(fn));
    check("F ⭐ it shows them to the model as images and adds the picture rules", /type: "image", source: \{ type: "base64"/.test(fn) && (fn.match(/pictures\.length \? PICTURE_RULES : ""/g) || []).length === 2);
    check("F ⭐ markers are placed after the model's work passed its checks, on both paths", /const done = applyEdits\(page, ans\.edits\);[\s\S]{0,200}placePictures\(done\.html/.test(fn) && /buildNewPage\(starter, r\.slug, ans\);[\s\S]{0,300}placePictures\(built\.html/.test(fn));
    // The first piece published from the card carried sidebar.js?v=ec58e874 into the repo: the starter was read off Pages.
    check("F ⭐ a page read off Pages loses its version stamps before a draft is made from it",
      ae.unstamp('<script src="../../sierra/sidebar.js?v=ec58e874" defer></script>') === '<script src="../../sierra/sidebar.js" defer></script>' &&
      /const starter = unstamp\(await sr\.text\(\)\)/.test(fn) && /page = unstamp\(await pr\.text\(\)\)/.test(fn) && /page = unstamp\(rows\[0\]\.html\)/.test(fn));
    const sql = fs.readFileSync("kb/migrations/2026-11-11_library_pictures.sql", "utf8");
    check("F ⭐ the table is the team's to read, add and change; nobody deletes; the service role only reads",
      /grant select, insert, update on public\.cpl_library_pictures to anon, authenticated;/.test(sql) && /grant select on public\.cpl_library_pictures to service_role;/.test(sql) &&
      !/for delete/.test(sql) && (sql.match(/team_pass_ok\(\) or public\.is_allowed_reviewer\(\)/g) || []).length === 4);
    check("F the governance map names the table", /"table:cpl_library_pictures"/.test(fs.readFileSync("kb/governance_surface_map.json", "utf8")));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nlibrary_pictures.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
