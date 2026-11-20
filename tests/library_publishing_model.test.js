// The Library's publishing model, part 1 of 4 (#3560; Sam's decisions of Nov 19, 2026, relayed by COBIx).
//
// Sam: two publish buttons, exactly "Publish to Internal Library" and "Publish to Public Library"; Public shows "This
// lists it in the Public Library, where anyone can find it."; afterward the card carries an "In the Public Library"
// badge; the separate List publicly step is retired; no approval from Sam; the Internal Library has no gate; the only
// gate on Public is a passing accessibility check record; Public includes Internal; a Template checkbox, a Template
// filter, and templates first when a new draft starts.
//
// Guards the failure modes:
//   A. A ready draft of a new piece offers the two buttons and nothing else to publish with; Publish it and List
//      publicly are gone from the tab.
//   B. Internal needs no record: the press approves the draft, keeps publish_target internal, and starts the publish
//      run at once for a signed-in reviewer (one call, through Publish now's holds), with one status line.
//   C. Public shows the confirmation in exactly Sam's words, keeps the pictures box as ticked, records publish_target
//      public, never calls the listing function for a piece with no page or no passing record, and says so plainly.
//   D. The tables absent (the migration not yet applied), Internal still works and Public says the check record is
//      not available yet; nothing writes a column that is not there.
//   E. Template: the checkbox in Edit the record, the chip, the filter (cleared at the next visit), templates first in
//      the finder and at the head of a new draft.
//   F. An approved piece stays approved (Cable Splicer): nothing un-approves it, and Publish now still shows.
//   G. The migration: both tables under RLS, the tab only reads checks, the trigger function closed, unlisting resets
//      the choice, Sam's standard seeded, and the rollback named; the governance surface map rules on both tables.
//
// Run: node tests/library_publishing_model.test.js
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SRC = fs.readFileSync("library.js", "utf8");
const FN_URL = /\/functions\/v1\/library-publish-now$/;
const CONFIRM = "This lists it in the Public Library, where anyone can find it.";

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
const D1 = "11111111-1111-1111-1111-111111111111";
const READY = { requested_at: "2026-11-19T15:50:00Z", requested_by: "Ashley", ready_at: "2026-11-19T16:00:00Z", draft_id: D1, new_piece: true };
const MODEL = { publish_target: null, template: false, division: "cobi" };
function rows(model) {
  const m = model === false ? {} : MODEL;
  return [
    // A new piece whose Draft 1 is ready to review.
    Object.assign({ id: "n1", slug: "cable-splicer-flyer", title: "Cable Splicer Flyer", kind: "visual", status: "requested", seen_by: "colleges",
      home: "not_filed", url: null, versions: [], created_at: "2026-11-19T15:40:00Z", updated_at: "2026-11-19T16:00:00Z",
      brief: { say: "A flyer.", requested_by: "Ashley", requested_on: "2026-11-19" }, sources: [], regen: Object.assign({}, READY) }, m),
    // A template, and a plain piece already on its page.
    Object.assign({ id: "t1", slug: "agency-flyer", title: "Agency Flyer", kind: "visual", status: "approved", seen_by: "team", home: "web",
      url: "https://cpl-initiative.github.io/cpl-project-tracker/library/agency-flyer/", version: "2", made_on: "2026-11-01", versions: [],
      updated_at: "2026-11-02T10:00:00Z" }, m, model === false ? {} : { template: true }),
    Object.assign({ id: "q1", slug: "quiet-one", title: "Quiet One", kind: "document", status: "approved", seen_by: "team", home: "web",
      url: "https://cpl-initiative.github.io/cpl-project-tracker/library/quiet-one/", version: "1", made_on: "2026-10-01", versions: [],
      updated_at: "2026-11-10T10:00:00Z" }, m),
  ];
}
function loadModule(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="library-root">Loading</div></body></html>',
    { url: "https://example.org/#library/cards", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  const data = opts.rows || rows(opts.model);
  w.fetch = function (url, init) {
    init = init || {};
    url = String(url);
    const body = init.body && init.body !== "{}" ? JSON.parse(init.body) : init.body;
    calls.push({ url: url, method: init.method || "GET", headers: init.headers || {}, body: body });
    if (FN_URL.test(url)) return response(200, { ok: true, queued: true, already: false, by: "reviewer" });
    if (/cpl_library_checks/.test(url)) return opts.absent ? response(404, { code: "PGRST205" }) : response(200, opts.checks || []);
    if (/cpl_library_division_settings/.test(url)) return opts.absent ? response(404, { code: "PGRST205" }) : response(200, []);
    if (/cpl_library_pictures/.test(url)) return response(200, opts.pics || []);
    if (/rpc\/cpl_library_set_public/.test(url)) return response(200, []);
    const id = (/cpl_library\?id=eq\.([^&]+)/.exec(url) || [])[1];
    if (init.method === "PATCH" && id) {
      const r = data.filter((x) => x.id === decodeURIComponent(id))[0];
      if (r) Object.assign(r, JSON.parse(init.body));
      return response(200, r ? [r] : []);
    }
    if (id) return response(200, data.filter((x) => x.id === decodeURIComponent(id)));
    return response(200, data);
  };
  w.localStorage.setItem("cpl_team_pass", "p");
  w.localStorage.setItem("cpl_library_author", "Ashley");
  if (opts.signedIn) w.CPL_REVIEWER_SIGNIN = { getSession: function () { return { access_token: "aa.bb.cc", email: "ashley@example.org" }; } };
  const s = w.document.createElement("script"); s.textContent = SRC; w.document.body.appendChild(s);
  const M = w.CPL_LIBRARY;
  M._publishPoll.ms = 60000; M._publishPoll.max = 1;
  return { w: w, doc: w.document, calls: calls, data: data, M: M, root: w.document.getElementById("library-root") };
}
const tick = () => new Promise((r) => setTimeout(r, 10));
async function until(f, n) { for (let i = 0; i < (n || 200); i++) { if (f()) return true; await tick(); } return !!f(); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }
function submit(w, el) { el.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); }
const form = (m) => m.root.querySelector('form[data-regenokform="n1"]');
const patches = (m) => m.calls.filter((c) => c.method === "PATCH");
const fnCalls = (m) => m.calls.filter((c) => FN_URL.test(c.url));
const rpcCalls = (m) => m.calls.filter((c) => /rpc\/cpl_library_set_public/.test(c.url));
const buttonWords = (el) => Array.prototype.map.call(el.querySelectorAll("button"), (b) => b.textContent.replace(/\s+/g, " ").trim());

(async function () {
  // ── A. The two buttons ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    const f = form(m);
    const words = f ? buttonWords(f) : [];
    check("A ⭐ a ready draft offers exactly Publish to Internal Library and Publish to Public Library",
      words.length === 2 && words[0] === "Publish to Internal Library" && /^Publish to Public Library/.test(words[1]), words.join(" | "));
    check("A Internal is the form's submit, Public opens its confirmation", !!f && !!f.querySelector('button[type="submit"]') &&
      f.querySelector('button[type="submit"]').textContent === "Publish to Internal Library" && !!f.querySelector('button[data-pubask="n1"]'));
    check("A ⭐ Publish it and List publicly are gone from the tab", !/Publish it\b/.test(m.root.textContent) && !/List publicly/.test(m.root.textContent));
    check("A ⭐ and from the code's rendered words", !/>Publish it</.test(SRC) && !/"List publicly"/.test(SRC) && !/>List publicly</.test(SRC));
    check("A the words are underlined-word controls with no glyph", !!f && Array.prototype.every.call(f.querySelectorAll("button"), (b) => /lib-word/.test(b.className)) &&
      !/[←-⯿\u{1F300}-\u{1FAFF}]/u.test(words.join("")));
    check("A a page already up offers Publish to Public Library in its side column, and a new piece does not",
      !!m.root.querySelector('[data-pubtop="q1"]') && m.root.querySelector('[data-pubtop="q1"]').textContent === "Publish to Public Library" && !m.root.querySelector('[data-pubtop="n1"]'));
  }
  // ── B. Internal: no record needed, one press, one status line ──
  {
    const m = loadModule({ signedIn: true }); await m.M.activate(); await tick();
    submit(m.w, form(m));
    await until(() => fnCalls(m).length > 0);
    const p = patches(m)[0];
    check("B ⭐ Publish to Internal Library approves the draft with no check record", !!p && !!p.body.regen.approved_at && p.body.regen.approved_by === "Ashley" &&
      p.body.regen.new_piece === true && p.body.publish_target === "internal");
    check("B ⭐ it starts the publish run at once for a signed-in reviewer: one call, no second press", fnCalls(m).length === 1 && fnCalls(m)[0].method === "POST" && fnCalls(m)[0].body === "{}");
    check("B it never calls the listing function", rpcCalls(m).length === 0);
    await until(() => /Publishing\./.test(m.root.textContent));
    const st = m.root.querySelector("#lib-st-n1");
    check("B ⭐ one status line: Publishing replaces the approval line and message", !!st && st.querySelectorAll(".lib-msg").length === 1 && /^Publishing\./.test(st.querySelector(".lib-msg").textContent) &&
      !/Published to the Internal Library/.test(st.textContent) && !st.querySelector(".now"), st && st.textContent.slice(0, 300));
  }
  {
    const m = loadModule(); await m.M.activate(); await tick();
    submit(m.w, form(m));
    await until(() => /Published to the Internal Library/.test(m.root.textContent));
    check("B with the team phrase alone, it approves, calls no function, and says the scheduled run puts it up", fnCalls(m).length === 0 && patches(m).length === 1 &&
      /The next scheduled run puts it on its page \(every three hours\), in the Internal Library\./.test(m.root.textContent));
  }
  // ── C. Public: the confirmation, the choice kept, no listing without a page and a passing record ──
  {
    const pics = [{ id: "x", library_id: "n1", n: 1, mime: "image/png", data: "iVBORw0KGgo" + "A".repeat(100), width: 10, height: 10, left_out: false, pic_key: "k", added_by: "Ashley" }];
    const m = loadModule({ pics: pics }); await m.M.activate(); await tick();
    await until(() => !!m.doc.getElementById("ro-pics-n1"));
    const box = m.doc.getElementById("ro-pics-n1");
    if (box) box.checked = true;
    click(m.w, m.root.querySelector('[data-pubask="n1"]'));
    const c = m.root.querySelector('[data-pubconfirm="n1"]');
    check("C ⭐ Publish to Public Library shows the confirmation in exactly Sam's words", !!c && c.textContent === CONFIRM, c && c.textContent);
    check("C it says plainly that it publishes to the Internal Library now and is listed once its check passes",
      /It publishes to the Internal Library now, and the Public Library lists it once its page's accessibility check passes\./.test(m.root.textContent));
    check("C the confirmation keeps the pictures box as it was ticked", !!m.doc.getElementById("ro-pics-n1") && m.doc.getElementById("ro-pics-n1").checked);
    const f = form(m), w2 = buttonWords(f);
    check("C its buttons are Publish to Public Library and Cancel", w2.length === 2 && w2[0] === "Publish to Public Library" && /^Cancel/.test(w2[1]), w2.join(" | "));
    click(m.w, m.root.querySelector('[data-pubaskno="n1"]'));
    check("C Cancel returns to the two buttons", !!m.root.querySelector('[data-pubask="n1"]') && !m.root.querySelector('[data-pubconfirm="n1"]'));
    if (m.doc.getElementById("ro-pics-n1")) m.doc.getElementById("ro-pics-n1").checked = true;
    click(m.w, m.root.querySelector('[data-pubask="n1"]'));
    submit(m.w, form(m));
    await until(() => patches(m).length > 0 && /Published to the Public Library/.test(m.root.textContent));
    const p = patches(m)[0];
    check("C ⭐ Public includes Internal: the draft is approved for the publish run and the record keeps publish_target public",
      !!p && !!p.body.regen.approved_at && p.body.publish_target === "public" && p.body.regen.pictures_checked_by === "Ashley");
    check("C ⭐ a piece with no page is never listed at the press (no call to the listing function)", rpcCalls(m).length === 0 && !("public_listed" in (p ? p.body : {})));
    check("C the card says the Public Library lists it once its accessibility check passes",
      /the Public Library lists it once its accessibility check passes/.test(m.root.querySelector("#lib-st-n1").textContent));
  }
  {
    // A passing check of the draft still lists nothing at the press: the page is checked again once it is up.
    const pass = [{ library_id: "n1", version_key: "draft:" + D1, standard: "WCAG 2.1 AA and Section 508", checked_at: "2026-11-19T16:05:00Z", tool_or_reviewer: "axe-core automated check", result: "pass" }];
    const m = loadModule({ checks: pass }); await m.M.activate(); await tick();
    click(m.w, m.root.querySelector('[data-pubask="n1"]'));
    submit(m.w, form(m));
    await until(() => patches(m).length > 0);
    check("C a passing draft check still makes no listing call for a piece whose page is not up", rpcCalls(m).length === 0 && patches(m)[0].body.publish_target === "public");
  }
  // ── D. The tables absent ──
  {
    const m = loadModule({ absent: true, model: false }); await m.M.activate(); await tick();
    check("D ⭐ the tables absent, the tab reads and paints its records and the two buttons", !!form(m) && !!m.root.querySelector('[data-pubask="n1"]'));
    click(m.w, m.root.querySelector('[data-pubask="n1"]'));
    check("D ⭐ Public says the check record is not available yet, and its button publishes to the Internal Library",
      /The accessibility check record is not available yet/.test(m.root.textContent) && form(m).querySelector('button[type="submit"]').textContent === "Publish to Internal Library");
    submit(m.w, form(m));
    await until(() => patches(m).length > 0);
    check("D ⭐ Internal still works, and nothing writes a column that is not there", patches(m).length === 1 && !!patches(m)[0].body.regen.approved_at && !("publish_target" in patches(m)[0].body));
    check("D no Template filter or Template field without the column", !m.root.querySelector("#lib-tpl") && !m.root.querySelector("#le-template"));
  }
  // ── E. Template ──
  {
    const m = loadModule(); await m.M.activate(); await tick();
    check("E the template's card carries the Template chip", /Template/.test(m.root.querySelector("#lib-t-t1").closest("article").querySelector(".lib-chips").textContent));
    const opts = m.root.querySelectorAll("#lib-pieces option");
    check("E ⭐ templates show first in the finder, each named as one", opts.length === 3 && opts[0].value === "Agency Flyer (Visual, Version 2, Template)", opts[0] && opts[0].value);
    const tp = m.root.querySelector(".lib-tpls");
    check("E ⭐ a new draft starts with the templates, each opening Start something new from it",
      !!tp && /Start from a template/.test(tp.textContent) && !!tp.querySelector('[data-fromit="t1"]') && !tp.querySelector('[data-fromit="q1"]'));
    const sel = m.root.querySelector("#lib-tpl");
    check("E the Template filter is offered", !!sel && /Templates only/.test(sel.textContent));
    sel.value = "only"; sel.dispatchEvent(new m.w.Event("change", { bubbles: true }));
    check("E ⭐ Templates only shows the templates alone", !!m.root.querySelector("#lib-t-t1") && !m.root.querySelector("#lib-t-q1"));
    m.w.dispatchEvent(new m.w.CustomEvent("cpl-tab-activated", { detail: { tab: "library" } }));
    await tick();
    check("E ⭐ the filter does not outlast the visit", m.M._state.tpl === false && !!m.root.querySelector("#lib-t-q1"));
    check("E the List view has a Templates filter", /\["template", "Templates"\]/.test(SRC) && /if \(f === "template"\) return !!r\.template;/.test(SRC));
    // The checkbox in Edit the record: the team sets or clears it, with no approval.
    m.M._state.open.q1 = true; m.M._state.edit = "q1"; m.M.render();
    const cb = m.doc.getElementById("le-template");
    check("E Edit the record carries a Template checkbox, unticked for a plain piece", !!cb && !cb.checked && /Template/.test(cb.closest("label").textContent));
    cb.checked = true;
    submit(m.w, m.root.querySelector('form[data-editform="q1"]'));
    await until(() => patches(m).length > 0);
    check("E ⭐ saving it sets template on the record", patches(m).length === 1 && patches(m)[0].body.template === true);
  }
  // ── F. An approved piece stays approved ──
  {
    const r = rows();
    r[0].regen = Object.assign({}, READY, { approved_at: "2026-11-19T16:20:00Z", approved_by: "Sam" });
    const m = loadModule({ rows: r, signedIn: true }); await m.M.activate(); await tick();
    check("F ⭐ an approved piece (Cable Splicer) keeps its approval: Publish now, no publish buttons, no write",
      !!m.root.querySelector('[data-pubnow="n1"]') && !form(m) && patches(m).length === 0 && /Approved by Sam/.test(m.root.textContent));
    check("F nothing in the tab writes an approval away", !/approved_at\s*=\s*null|approved_at:\s*null|delete regen\.approved_at/.test(SRC));
  }
  // ── H. Listing reads the page's own check (second read of #3572) ──
  const PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/library/agency-flyer/";
  const D2 = "22222222-2222-2222-2222-222222222222";
  const pageRow = (extra) => [Object.assign({ id: "v1", slug: "agency-flyer", title: "Agency Flyer", kind: "visual", status: "approved", seen_by: "team",
    home: "web", url: PAGE, version: "2", made_on: "2026-11-01", versions: [], summary: "For agencies.", updated_at: "2026-11-02T10:00:00Z" }, MODEL, extra || {})];
  const chk = (key, result) => ({ library_id: "v1", version_key: key, standard: "WCAG 2.1 AA and Section 508", checked_at: "2026-11-19T16:05:00Z",
    tool_or_reviewer: "axe-core automated check", result: result || "pass", url: PAGE });
  {
    // A page on Version 2 with a ready revision draft whose own check passed: the draft's pass must not list the page.
    const m = loadModule({ rows: pageRow({ regen: { requested_at: "2026-11-19T15:00:00Z", ready_at: "2026-11-19T16:00:00Z", draft_id: D2 } }),
      checks: [chk("draft:" + D2)] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("H ⭐ a pass for a revision draft does not open the listing form for the page", /Not yet certified/.test(m.root.textContent) && !m.root.querySelector("#lp-sum"));
    submit(m.w, m.root.querySelector('form[data-pubform="v1"]'));
    await until(() => patches(m).length > 0);
    check("H ⭐ and the press lists nothing: it keeps the choice only", rpcCalls(m).length === 0 && patches(m).length === 1 && patches(m)[0].body.publish_target === "public");
  }
  {
    // The same page whose own check (version:2) passed lists through the function.
    const m = loadModule({ rows: pageRow({ regen: { requested_at: "2026-11-19T15:00:00Z", ready_at: "2026-11-19T16:00:00Z", draft_id: D2 } }),
      checks: [chk("version:2")] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("H the page's own pass opens the listing form", !!m.root.querySelector("#lp-sum"));
  }
  {
    // A piece waiting to be listed whose page check has since passed offers the listing form (should-fix 3).
    const m = loadModule({ rows: pageRow({ publish_target: "public", public_summary: "For agencies." }), checks: [chk("version:2")] });
    await m.M.activate(); await tick();
    const card = m.root.querySelector("#lib-t-v1").closest("article");
    check("H ⭐ a waiting piece with a passing page check offers Publish to Public Library again, and no waiting line",
      !!card.querySelector('[data-pubtop="v1"]') && !card.querySelector("[data-pubwait]"));
    click(m.w, card.querySelector('[data-pubtop="v1"]'));
    check("H its press opens the summary form", !!m.root.querySelector("#lp-sum") && (m.root.querySelector('[data-pubconfirm="v1"]') || {}).textContent === CONFIRM);
    submit(m.w, m.root.querySelector('form[data-pubform="v1"]'));
    await until(() => rpcCalls(m).length > 0);
    const b = rpcCalls(m)[0] ? rpcCalls(m)[0].body : {};
    check("H ⭐ and it lists through cpl_library_set_public(), with no second write of the choice",
      rpcCalls(m).length === 1 && b.p_listed === true && b.p_summary === "For agencies." && patches(m).length === 0);
  }
  {
    const m = loadModule({ rows: pageRow({ publish_target: "public" }), checks: [chk("version:2", "fail")] });
    await m.M.activate(); await tick();
    const card = m.root.querySelector("#lib-t-v1").closest("article");
    check("H a waiting piece whose page check failed keeps its waiting line and offers no press", !!card.querySelector("[data-pubwait]") && !card.querySelector('[data-pubtop="v1"]'));
    m.M._state.open.v1 = true; m.M.render();
    check("H Details reads In the Internal Library, in a positive sentence, and says why: its check did not pass",
      /In the Internal Library\. Its accessibility check of [^.]+ did not pass\. The Public Library lists it once a new version passes its check\./.test(m.root.textContent) && !/not listed in the Public Library/.test(SRC));
  }
  // ── I. The pre-check matches the url and the page's last change (#3560 part 2; #3577's known limit) ──
  {
    // A pass earned at the old url: after a url move the card no longer offers the listing form.
    const OLD = "https://cpl-initiative.github.io/cpl-project-tracker/library/agency-flyer-old/";
    const m = loadModule({ rows: pageRow({ url: PAGE }), checks: [Object.assign(chk("version:2"), { url: OLD })] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("I ⭐ a pass at the old url does not open the listing form after a url move", !m.root.querySelector("#lp-sum") && /Not yet certified/.test(m.root.textContent));
    submit(m.w, m.root.querySelector('form[data-pubform="v1"]'));
    await until(() => patches(m).length > 0);
    check("I ⭐ and the press calls no listing: it keeps the choice for the check run", rpcCalls(m).length === 0 && patches(m).length === 1 && patches(m)[0].body.publish_target === "public");
  }
  {
    const m = loadModule({ rows: pageRow({ url: PAGE }), checks: [Object.assign(chk("version:2"), { url: null })] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("I a check with no url (every row before #3577) never opens the listing form", !m.root.querySelector("#lp-sum"));
  }
  {
    // A version relabeled to a key that passed: the pass ran before the page last changed.
    const m = loadModule({ rows: pageRow({ page_changed_at: "2026-11-20T09:00:00Z" }), checks: [chk("version:2")] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("I ⭐ a pass older than the page's last change (a relabeled version) does not open the listing form", !m.root.querySelector("#lp-sum"));
  }
  {
    // Newest wins per key and url: a later fail at this url, beside an older pass here and a newer pass elsewhere.
    const OTHER = "https://cpl-initiative.github.io/cpl-project-tracker/library/elsewhere/";
    const rowsI = [Object.assign(chk("version:2"), { checked_at: "2026-11-20T10:00:00Z" }),
      Object.assign(chk("version:2", "fail"), { checked_at: "2026-11-20T11:00:00Z", findings: 3, report_url: "https://example.org/report.txt" }),
      Object.assign(chk("version:2"), { checked_at: "2026-11-20T12:00:00Z", url: OTHER })];
    const m = loadModule({ rows: pageRow({ publish_target: "public" }), checks: rowsI });
    await m.M.activate(); await tick();
    const card = m.root.querySelector("#lib-t-v1").closest("article");
    const wait = card.querySelector("[data-pubwait]");
    check("I ⭐ newest wins at this url: a later fail here outranks an older pass here, and a pass at another url speaks for nothing",
      !!wait && /did not pass \(3 findings\)/.test(wait.textContent), wait && wait.textContent);
    const a = wait && wait.querySelector("a");
    check("I the waiting line links the failed check's report in plain words", !!a && a.textContent === "The check report" && a.getAttribute("href") === "https://example.org/report.txt");
    check("I the tab reads each check's url, findings and created_at", /select=library_id,version_key,url,standard,checked_at,created_at,tool_or_reviewer,result,findings,report_url/.test(SRC));
  }
  {
    // The page's own pass at its own url and after its last change still opens the form.
    const m = loadModule({ rows: pageRow({ page_changed_at: "2026-11-19T16:00:00Z" }), checks: [chk("version:2")] });
    await m.M.activate(); await tick();
    m.M._state.open.v1 = true; m.M.render();
    click(m.w, m.root.querySelector('[data-pub="v1"]'));
    check("I a pass at the page's url after its last change opens the listing form", !!m.root.querySelector("#lp-sum"));
  }
  // ── J. The second read of #3581: the card says why the check run leaves a piece waiting ──
  {
    // A passing piece with no public summary a person typed: the run never lists it with the internal summary.
    const m = loadModule({ rows: pageRow({ publish_target: "public", public_summary: null }), checks: [chk("version:2")] });
    await m.M.activate(); await tick();
    const card = m.root.querySelector("#lib-t-v1").closest("article");
    const w = card.querySelector("[data-pubwait]");
    check("J ⭐ a waiting piece whose check passed but has no public summary says it needs one, in plain words",
      !!w && w.textContent === "Its accessibility check passed. The Public Library lists it once it has a public summary: press Publish to Public Library and add one."
      && !!card.querySelector('[data-pubtop="v1"]'), w && w.textContent);
  }
  {
    // A version label outside the check table's key check: the run skips the page, and the card says why.
    const m = loadModule({ rows: pageRow({ publish_target: "public", version: "3 (revised)" }), checks: [chk("version:3 (revised)")] });
    await m.M.activate(); await tick();
    const card = m.root.querySelector("#lib-t-v1").closest("article");
    const w = card.querySelector("[data-pubwait]");
    check("J ⭐ a version label no check record can carry says so on the card, with what to change",
      !!w && /Its version label, 3 \(revised\), cannot carry an accessibility check record\. Use up to 40 letters, digits, spaces, dots, dashes or underscores in Edit the record/.test(w.textContent),
      w && w.textContent);
    check("J the tab's key pattern is the table's", /var KEY_OK = \/\^\(draft:\[0-9a-f-\]\{36\}\|version:\[A-Za-z0-9 \._-\]\{1,40\}\|page\)\$\//.test(SRC) &&
      fs.readFileSync("kb/migrations/2026-11-19_library_publishing_model.sql", "utf8").indexOf("'^(draft:[0-9a-f-]{36}|version:[A-Za-z0-9 ._-]{1,40}|page)$'") >= 0);
  }
  // ── G. The migration and the governance map ──
  {
    const SQL = fs.readFileSync("kb/migrations/2026-11-19_library_publishing_model.sql", "utf8");
    const RB = "kb/migrations/2026-11-19_library_publishing_model_rollback.sql";
    check("G the migration names its rollback, and the rollback exists", SQL.indexOf(RB) > 0 && fs.existsSync(RB));
    check("G ⭐ both tables are under RLS", /alter table public\.cpl_library_checks enable row level security/.test(SQL) &&
      /alter table public\.cpl_library_division_settings enable row level security/.test(SQL));
    check("G ⭐ the tab only reads checks: anon and authenticated get select alone, only the service role inserts",
      /revoke all on public\.cpl_library_checks from anon, authenticated;\s*grant select on public\.cpl_library_checks to anon, authenticated;\s*grant select, insert on public\.cpl_library_checks to service_role;/.test(SQL) &&
      !/for insert[\s\S]{0,40}cpl_library_checks|on public\.cpl_library_checks for (insert|update|delete)/.test(SQL));
    check("G ⭐ the trigger function is closed (Rule 10 b2)", /revoke execute on function public\.cpl_library_publish_target_on_unlist\(\) from public, anon, authenticated;/.test(SQL));
    check("G ⭐ unlisting by any route resets the choice to internal", /if old\.public_listed and not new\.public_listed and new\.publish_target = 'public' then\s*new\.publish_target := 'internal';/.test(SQL) &&
      /create trigger cpl_library_publish_target_trg before update on public\.cpl_library/.test(SQL));
    check("G the trigger fires after the public guard (name order), so it sees that guard's own unlisting", "cpl_library_guard_public_trg" < "cpl_library_publish_target_trg");
    check("G Sam's standard is the seeded default", /'cobi', 'CPL Initiative', 'WCAG 2\.1 AA and Section 508'/.test(SQL) && /standard: "WCAG 2\.1 AA and Section 508"/.test(SRC));
    // The database refuses too (second read of #3572): the tab is not the only gate. tests/library_publishing_sql_proof.py
    // runs these files against Postgres; this pins the text.
    const fnBody = (/create or replace function public\.cpl_library_set_public\([\s\S]*?end \$\$;/.exec(SQL) || [""])[0];
    check("G ⭐ cpl_library_set_public() refuses a listing unless the latest check of the page's key passes; unlisting and the service role are exempt",
      /if p_listed and coalesce\(auth\.role\(\), ''\) <> 'service_role' then/.test(fnBody) &&
      /c\.version_key = case when nullif\(l\.version, ''\) is not null then 'version:' \|\| l\.version else 'page' end/.test(fnBody) &&
      /order by c\.checked_at desc/.test(fnBody) && /if v_result is distinct from 'pass' then\s*raise exception/.test(fnBody));
    check("G it keeps its grants and its revoke from PUBLIC", /revoke execute on function public\.cpl_library_set_public\(text, boolean, text, text\[\], text\) from public;\s*grant execute on function public\.cpl_library_set_public\(text, boolean, text, text\[\], text\) to anon, authenticated, service_role;/.test(SQL));
    const CANON = fs.readFileSync("kb/supabase_cpl_library_public.sql", "utf8");
    // The newest migration that writes the function (COBIx on #3572, 7023899407): a pass counts only at the record's
    // current url, in set_public and in the trigger's version branch. The canonical source carries its bodies.
    const BINDS = fs.readFileSync("kb/migrations/2026-11-19_library_check_binds_url.sql", "utf8");
    const BINDS_RB = "kb/migrations/2026-11-19_library_check_binds_url_rollback.sql";
    const lastBody = (/create or replace function public\.cpl_library_set_public\([\s\S]*?end \$\$;/.exec(BINDS) || [""])[0];
    const lastTrig = (/create or replace function public\.cpl_library_unlist_on_new_page\(\)[\s\S]*?end \$\$;/.exec(BINDS) || [""])[0];
    check("G ⭐ a pass counts only at the url the record names now, in set_public and in the trigger's version branch",
      /and c\.url = l\.url/.test(lastBody) && /and c\.url = new\.url/.test(lastTrig) && lastBody.replace(/\n\s*and c\.url = l\.url/, "") === fnBody);
    // The newest of all (#3560 part 2, S688): a pass counts only when it ran after the page last changed, and a listed
    // version change always unlists. The canonical source carries these bodies now.
    const AFTER = fs.readFileSync("kb/migrations/2026-11-20_library_check_after_page_change.sql", "utf8");
    const AFTER_RB = "kb/migrations/2026-11-20_library_check_after_page_change_rollback.sql";
    const newBody = (/create or replace function public\.cpl_library_set_public\([\s\S]*?end \$\$;/.exec(AFTER) || [""])[0];
    const newTrig = (/create or replace function public\.cpl_library_unlist_on_new_page\(\)[\s\S]*?end \$\$;/.exec(AFTER) || [""])[0];
    check("G ⭐ a pass counts only when it ran no earlier than the page last changed; otherwise the body is the url binding's",
      newBody.replace(/\n\s*and c\.checked_at >= coalesce\(l\.page_changed_at, '-infinity'::timestamptz\)/, "") === lastBody &&
      /and c\.checked_at >= coalesce\(l\.page_changed_at, '-infinity'::timestamptz\)/.test(newBody));
    check("G ⭐ page_changed_at is stamped by a trigger on any url or version change and held otherwise, and its function is closed",
      /new\.url is distinct from old\.url or new\.version is distinct from old\.version then\s*new\.page_changed_at := now\(\);\s*else\s*new\.page_changed_at := old\.page_changed_at;/.test(AFTER) &&
      /revoke execute on function public\.cpl_library_stamp_page_change\(\) from public, anon, authenticated;/.test(AFTER));
    check("G a listed url or version change always unlists, keeping publish_target public",
      /\(new\.url is distinct from old\.url or new\.version is distinct from old\.version\) then\s*new\.public_listed := false;/.test(newTrig) && !/v_result/.test(newTrig));
    check("G the canonical source carries the newest bodies, so a re-run keeps the gate",
      !!newBody && CANON.indexOf(newBody) >= 0 && !!newTrig && CANON.indexOf(newTrig) >= 0 && CANON.indexOf(lastBody) < 0);
    check("G the page-change migration names its rollback, which restores the url-binding bodies and drops the column",
      AFTER.indexOf(AFTER_RB) > 0 && fs.existsSync(AFTER_RB) && fs.readFileSync(AFTER_RB, "utf8").indexOf(lastBody) >= 0 &&
      fs.readFileSync(AFTER_RB, "utf8").indexOf(lastTrig) >= 0 && /drop column if exists page_changed_at/.test(fs.readFileSync(AFTER_RB, "utf8")));
    check("G the url-binding migration names its rollback, which restores the bodies without the url match",
      BINDS.indexOf(BINDS_RB) > 0 && fs.existsSync(BINDS_RB) && fs.readFileSync(BINDS_RB, "utf8").indexOf(fnBody) >= 0 &&
      !/c\.url = /.test(fs.readFileSync(BINDS_RB, "utf8")));
    const RBT = fs.readFileSync(RB, "utf8");
    check("G the rollback refuses while check records exist, then restores the body without the gate",
      /raise exception 'cpl_library_checks holds % check record\(s\)/.test(RBT) && /create or replace function public\.cpl_library_set_public\(/.test(RBT) &&
      !/cpl_library_checks c on/.test(RBT) && RBT.indexOf("raise exception 'cpl_library_checks holds") < RBT.indexOf("drop table if exists public.cpl_library_checks"));
    check("G the SQL proof runs in CI", /python3 tests\/library_publishing_sql_proof\.py/.test(fs.readFileSync(".github/workflows/js-tests.yml", "utf8")));
    check("G the version key the tab reads is the one the migration states", /'draft:<cpl_library_drafts\.id>'/.test(SQL) && /'version:<cpl_library\.version>'/.test(SQL) &&
      /\? "draft:" \+ g\.draft_id : ""/.test(SRC) && /"version:" \+ r\.version : "page"/.test(SRC) && /function draftPublicConfirm\(r\) \{\s*var gate = publicGate\(r, draftKey\(r\)\);/.test(SRC));
    const GOV = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
    // Beside cpl_library_drafts and cpl_library_pictures: the same audience as cpl_library, the reason stated.
    const rule = (k) => (GOV.mapped || {})[k] || (GOV.dismissed || {})[k];
    const a = rule("table:cpl_library_checks"), b = rule("table:cpl_library_division_settings");
    check("G ⭐ the governance surface map rules on both new tables (Rule 10 a3)", !!a && /service role/i.test(a) && !!b && /division/i.test(b));
    check("G no apply pointer is committed by this change", !fs.existsSync("kb/migrations/.apply") || !/2026-11-19_library_publishing_model/.test(fs.readFileSync("kb/migrations/.apply", "utf8")));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nlibrary_publishing_model.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
