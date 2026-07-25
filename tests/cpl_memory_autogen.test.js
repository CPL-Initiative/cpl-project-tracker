// 🧠 Memory tab — ✨ Autogenerate (cpl_memory.js).
//   The Add/Edit form carries an "✨ Autogenerate" box: type a topic → the tab asks
//   the cpl-chat RAG edge function for a JSON memory entry, parses it defensively,
//   and PREFILLS the form fields (nothing is saved). This test covers:
//     - _parseDraft: bare JSON, fenced JSON w/ prose, kind/org normalization,
//       tags-as-array + tags-as-string, and the null (unparseable) path.
//     - _autogenQuery carries the topic + the JSON-only instruction.
//     - end-to-end: clicking ✨ Autogenerate (fetch mocked to the non-streaming
//       text() path) prefills the open Add form; and the box is present on the
//       EDIT form too (Sam: "make sure the autogenerate works on this too").
//
// Run from repo root: `npm test` (or `node tests/cpl_memory_autogen.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const tick = () => new Promise((r) => setTimeout(r, 0));

const src = fs.readFileSync("cpl_memory.js", "utf8");
const teamSrc = fs.readFileSync("team_phrase.js", "utf8");

function boot() {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
    <div id="tab-memory"><div id="memory-root"></div></div></body></html>`,
    { runScripts: "outside-only", url: "https://example.org/" });
  const { window } = dom;
  try { window.localStorage.setItem("cpl_team_pass", "team-secret"); } catch (e) {}
  window.eval(teamSrc);
  window.eval(src);
  return window;
}

(async () => {
  const win = boot();
  const api = win.CPL_MEMORY;
  check("cpl_memory.js exposes the autogen seams", api &&
    typeof api._parseDraft === "function" && typeof api._autogenQuery === "function" &&
    typeof api._buildEntryForm === "function" && typeof api._applyDraftToForm === "function");

  // ── _parseDraft: a bare JSON object ──
  const d1 = api._parseDraft(JSON.stringify({
    kind: "fact", title: "Common Exhibit Reference",
    summary: "A CER is the shared course identity behind an exhibit.",
    detail: "Read before merge/mint decisions.", plain: "In plain terms…",
    tags: ["ccr", "cer"], org: "cpl", source: "docs/kb-notes/x.md",
  }));
  check("_parseDraft parses a bare JSON object", d1 && d1.kind === "fact");
  check("_parseDraft keeps the title", d1 && d1.title === "Common Exhibit Reference");
  check("_parseDraft keeps tags as an array", d1 && Array.isArray(d1.tags) && d1.tags.length === 2);

  // ── _parseDraft: JSON inside a ```json fence + surrounding prose ──
  const d2 = api._parseDraft("Sure! Here you go:\n```json\n" +
    JSON.stringify({ kind: "pitfall", title: "T", summary: "S", tags: "a, b, c" }) +
    "\n```\nHope that helps.");
  check("_parseDraft digs JSON out of a ```json fence", d2 && d2.summary === "S");
  check("_parseDraft splits a comma-string tags field", d2 && d2.tags.length === 3 && d2.tags[0] === "a");

  // ── _parseDraft: normalization of a bad kind / bad org ──
  const d3 = api._parseDraft(JSON.stringify({ kind: "banana", summary: "S", org: "zzz" }));
  check("_parseDraft normalizes an unknown kind → fact", d3 && d3.kind === "fact");
  check("_parseDraft normalizes an unknown org → cpl", d3 && d3.org === "cpl");

  // ── _parseDraft: unparseable input → null ──
  check("_parseDraft returns null on non-JSON", api._parseDraft("no json here at all") === null);
  check("_parseDraft returns null on null", api._parseDraft(null) === null);

  // ── _autogenQuery carries the topic + a JSON-only instruction ──
  const q = api._autogenQuery("what constitutes a Common Exhibit Reference");
  check("_autogenQuery includes the topic", /Common Exhibit Reference/.test(q));
  check("_autogenQuery asks for a single JSON object", /single JSON/i.test(q));
  check("_autogenQuery lists the kind vocabulary", /fact/.test(q) && /milestone/.test(q));

  // ── end-to-end: ✨ Autogenerate on the ADD form prefills the fields ──
  const DRAFT = {
    kind: "fact", title: "Common Exhibit Reference",
    summary: "A CER is the shared course identity behind an exhibit.",
    detail: "Read before any merge/mint decision.",
    plain: "It's the one shared ID that says two colleges' courses are the same thing.",
    tags: ["ccr", "cer"], org: "cpl", source: "docs/kb-notes/reference-ccr.md",
  };
  // mock fetch → non-streaming response (hits the resp.text() path; no TextDecoder needed)
  let sawUrl = null, sawBody = null;
  win.fetch = function (url, opts) {
    sawUrl = url; sawBody = opts && opts.body;
    return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(DRAFT)) });
  };

  const host = win.document.createElement("div");
  win.document.body.appendChild(host);
  api._buildEntryForm(host, null, function () {});
  const form = host.querySelector("form.mem-form");
  check("Add form built with an autogen box", !!form && !!host.querySelector(".mem-autogen"));
  const btn = host.querySelector(".mem-autogen-btn");
  const ta = host.querySelector("textarea[name=autogen_desc]");
  check("autogen box has a description textarea + button", !!btn && !!ta);

  ta.value = "a fact about what constitutes a Common Exhibit Reference";
  btn.click();
  await tick(); await tick(); await tick();

  // read controls by querySelector — jsdom doesn't expose form.<name>, and `form.title`
  // collides with HTMLFormElement.title (the very bug this switch fixes in-browser too)
  const fq = (f, n) => f.querySelector('[name="' + n + '"]');
  check("autogen POSTs to the cpl-chat function", /\/functions\/v1\/cpl-chat$/.test(String(sawUrl)));
  check("autogen request body carries the topic", /Common Exhibit Reference/.test(String(sawBody)));
  check("prefill: kind select set", fq(form, "kind") && fq(form, "kind").value === "fact");
  check("prefill: title set", fq(form, "title") && fq(form, "title").value === "Common Exhibit Reference");
  check("prefill: summary set", fq(form, "summary") && /shared course identity/.test(fq(form, "summary").value));
  check("prefill: detail set", fq(form, "detail") && /merge\/mint/.test(fq(form, "detail").value));
  check("prefill: plain set", fq(form, "plain") && /one shared ID/.test(fq(form, "plain").value));
  check("prefill: tags joined", fq(form, "tags") && fq(form, "tags").value === "ccr, cer");
  check("prefill: source set", fq(form, "source") && /reference-ccr/.test(fq(form, "source").value));
  check("prefill: nothing saved (form still open, no navigation)", !!host.querySelector("form.mem-form"));
  check("autogen status reports success", /Drafted/i.test(host.querySelector(".mem-autogen-status").textContent));

  // ── the autogen box is present on the EDIT form too (Sam's ask) ──
  const host2 = win.document.createElement("div");
  const existing = { id: "pr3", kind: "procedure", title: "Renaming a public term",
    summary: "Rename a report-facing field/term → update the 6 enforcement points",
    detail: "…", plain: "…", tags: ["naming"], org: "cpl", source: "CLAUDE.md Naming" };
  api._buildEntryForm(host2, existing, function () {});
  check("EDIT form also carries the autogen box", !!host2.querySelector(".mem-autogen"));
  check("EDIT autogen pre-seeds the description from the existing entry", (function () {
    const t = host2.querySelector("textarea[name=autogen_desc]");
    return t && /Renaming a public term/.test(t.value);
  })());

  // ── error path: a bad fetch shows the manual-fill message, saves nothing ──
  win.fetch = function () { return Promise.resolve({ ok: false, status: 500 }); };
  const host3 = win.document.createElement("div");
  api._buildEntryForm(host3, null, function () {});
  host3.querySelector("textarea[name=autogen_desc]").value = "anything";
  host3.querySelector(".mem-autogen-btn").click();
  await tick(); await tick(); await tick();
  check("autogen error path shows a manual-fill message", /manually|Couldn/i.test(host3.querySelector(".mem-autogen-status").textContent));
  check("autogen error path re-enables the button", host3.querySelector(".mem-autogen-btn").disabled === false);

  let pass = 0;
  for (const [n, ok] of results) { console.log((ok ? "PASS" : "FAIL") + "  " + n); if (ok) pass++; }
  console.log(`\n${pass}/${results.length} assertions passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
