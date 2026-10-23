// Letters, Memos & Reports — one register for every communication the Initiative
// sends, recipients by MAP roster role, figures from the daily feeds (Sam, 2026-10-23:
// "expanded for any type of communication I need to craft that needs to incorporate
// current data and contacts for various roles in the system that we may already
// store"). These checks guard what the tab can get wrong:
//   - without the team phrase it fetches nothing and paints no count;
//   - a failed read names its table and paints no count;
//   - the recipients join MAP's roster to the identity table (partners and test rows
//     drop out, a spelling variant resolves) and to the JST feed;
//   - a To role with no address is a gap the row names, never a blank letter;
//   - merge fields fill per college and an unfilled one stays visible in brackets;
//   - the salutation reads an honorific from the name, else the role's word;
//   - the mail link carries To, Cc, subject and body; the CSV a row per college;
//   - every write carries the team phrase, names who made it, and never deletes;
//   - a record holds roles, never addresses; Post to the Library writes a document
//     record linking back here and stores its id;
//   - Claude's draft goes through the proxy under the house voice and stays beside
//     the body until used; the model is named once;
//   - tokens (no raw hex), words (no glyphs), American spelling, Rule 4;
//   - a private window (localStorage throws) still renders.
//
// Run from repo root: `npm test` (or `node tests/comms.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const pending = [];
function block(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      pending.push(r.catch(function (e) { check(label + " — driver threw: " + (e && e.message), false); }));
    }
  } catch (e) { check(label + " — driver threw: " + (e && e.message), false); }
}

const SRC = fs.readFileSync("comms.js", "utf8");
const DASH = fs.readFileSync("CPL_Dashboard.html", "utf8");
const INDEX = fs.readFileSync("index.html", "utf8");
const NAV = fs.readFileSync("nav_groups.js", "utf8");
const SQL = fs.readFileSync("kb/supabase_cpl_comms.sql", "utf8");

const COMMS = [
  { id: "c1", slug: "jst-upload-ceos-261023", title: "JST uploads and the 2026-2028 funding, to the CEOs", comm_type: "email",
    audience: "ceos", status: "draft", to_roles: ["ceo"], cc_roles: ["vpaa", "vpss"], colleges: null,
    subject: "CPL Initiative: {college} and the Joint Services Transcript upload",
    body: "Dear {salutation},\n\nMAP holds {jst} JSTs against {vets} enrolled veterans at {college} ({jst_pct}).\n\nSincerely,\n{sender}",
    sender: "Sam Lee, MAP Team", occasion: "7th Annual CPL Summit", note: null, library_id: null, made_by: "Sam",
    added_by: "Sam", updated_by: null, created_at: "2026-10-23T17:00:00Z", updated_at: "2026-10-23T17:00:00Z", retired_at: null },
  { id: "c2", slug: "team-note-261022", title: "What changed in the funding model", comm_type: "team_note",
    audience: "map_team", status: "final", to_roles: [], cc_roles: [], colleges: null, subject: null,
    body: "Scenario 4 is live.", sender: null, occasion: null, note: "posted in Teams", library_id: "lib9", made_by: "Ashley",
    added_by: "Ashley", updated_by: "Ashley", created_at: "2026-10-22T10:00:00Z", updated_at: "2026-10-22T12:00:00Z", retired_at: null },
  { id: "c3", slug: "memo-tabled-261001", title: "Noncredit funding rules memo", comm_type: "memo", audience: "co", status: "tabled",
    to_roles: [], cc_roles: [], colleges: ["Alpha College"], subject: "RE: noncredit", body: "TO: ...", sender: null, occasion: null,
    note: null, library_id: null, made_by: "Sam", added_by: "Sam", updated_by: null, created_at: "2026-10-01T10:00:00Z",
    updated_at: "2026-10-01T10:00:00Z", retired_at: null }
];
const CONTACTS = [
  { college: "Alpha College", ceo: "Dr. Jennifer Zellet", ceo_email: "jzellet@alpha.edu", vpaa: "Kathyrn  Mitchell", vpaa_email: "kmitchell@alpha.edu",
    vpss: "Idania Padron", vpss_email: "ipadron@alpha.edu", primary_contact: "Pat Vega", primary_contact_email: "pat@alpha.edu",
    cpl_coordinator: "Pat Vega", cpl_coordinator_email: "pat@alpha.edu", landing_page_url: "https://map.rccd.edu/alpha", synced_at: "2026-10-22T17:42:15Z" },
  { college: "Beta Community College", ceo: "Kevin G. Walthers", ceo_email: "kwalthers@beta.edu", vpaa: "", vpaa_email: "", vpss: "", vpss_email: "",
    primary_contact: "", primary_contact_email: "", cpl_coordinator: "", cpl_coordinator_email: "", landing_page_url: "", synced_at: "2026-10-22T17:42:15Z" },
  { college: "Gamma College", ceo: "", ceo_email: "", vpaa: "Angela Milano", vpaa_email: "amilano@gamma.edu", vpss: "", vpss_email: "",
    primary_contact: "", primary_contact_email: "", cpl_coordinator: "", cpl_coordinator_email: "", landing_page_url: "", synced_at: "2026-10-21T17:42:15Z" },
  { college: "Launch Apprenticeship", ceo: "Someone", ceo_email: "x@launch.org", vpaa: "", vpaa_email: "", vpss: "", vpss_email: "",
    primary_contact: "", primary_contact_email: "", cpl_coordinator: "", cpl_coordinator_email: "", landing_page_url: "", synced_at: "2026-10-22T17:42:15Z" },
  { college: "Gamma College Credit", ceo: "", ceo_email: "", vpaa: "Dup Row", vpaa_email: "dup@gamma.edu", vpss: "", vpss_email: "",
    primary_contact: "", primary_contact_email: "", cpl_coordinator: "", cpl_coordinator_email: "", landing_page_url: "", synced_at: "2026-10-22T17:42:15Z" }
];
const COLLEGES = [
  { college_id: 1, college_name: "Alpha College", variants: ["ALPHA", "Alpha"], entity_kind: "college", district: "Alpha CCD" },
  { college_id: 2, college_name: "Beta Community College", variants: ["BETA", "Beta College"], entity_kind: "college", district: "Beta CCD" },
  { college_id: 3, college_name: "Gamma College", variants: ["GAMMA", "Gamma College Credit"], entity_kind: "continuing_education", district: "Gamma CCD" },
  { college_id: 9, college_name: "Launch Apprenticeship", variants: [], entity_kind: "partner", district: null }
];
const JST = { scraped_at: "2026-10-23T14:17:45Z", star_threshold: 0.75, statewide: { vets: 33435, jst: 29272, star_colleges: 63 },
  colleges: { "Alpha College": { vets: 100, jst: 52, star: false }, "Beta College": { vets: 80, jst: 70, star: true } } };

function response(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status: status,
    json: function () { return Promise.resolve(body); },
    text: function () { return Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)); } });
}
function routeRead(url) {
  if (/\/rest\/v1\/cpl_comms\?/.test(url)) return response(200, COMMS);
  if (/\/rest\/v1\/map_college_contacts\?/.test(url)) return response(200, CONTACTS);
  if (/\/rest\/v1\/map_colleges\?/.test(url)) return response(200, COLLEGES);
  if (/veteran_jst\.json/.test(url)) return response(200, JST);
  return response(404, "nope");
}
function loadModule(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="letters-root">Loading</div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  const calls = [];
  w.fetch = function (url, init) {
    calls.push({ url: String(url), init: init || {} });
    if (opts.fetch) { const r = opts.fetch(String(url), init || {}); if (r) return r; }
    return routeRead(String(url));
  };
  if (opts.noStorage) {
    Object.defineProperty(w, "localStorage", { get: function () { throw new Error("SecurityError"); } });
  } else if (opts.phrase) {
    w.localStorage.setItem("cpl_team_pass", opts.phrase);
    if (opts.author) w.localStorage.setItem("cpl_library_author", opts.author);
  }
  if (opts.banner) {
    w.CPL_TEAM_PHRASE = { lockedBanner: function (o) {
      const d = w.document.createElement("div"); d.setAttribute("data-tp-locked", ""); d.textContent = "Locked: " + o.what; return d; } };
  }
  if (opts.proxy) w.CPL_REPORT_PROXY_URL = opts.proxy;
  w.cplCollegeShort = function (n) { return n.replace(/ (Community )?College$/, ""); };
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return { w, calls, M: w.CPL_COMMS, root: w.document.getElementById("letters-root") };
}
function settle() { return new Promise(function (r) { setTimeout(r, 0); }).then(function () { return new Promise(function (r) { setTimeout(r, 0); }); }); }
function click(w, el) { el.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); }

// ── (1) Wiring, Rule 4, the schema's posture ─────────────────────────────
block("(1)", function () {
  check("(1) both HTMLs are byte-identical", DASH === INDEX, "Rule 4");
  ['data-tab="letters"', 'id="letters-root"', "onActivate('letters'", "loadScript('comms.js', 'CPL_COMMS'", "Letters, Memos &amp; Reports</button>"].forEach(function (f) {
    check("(1) the shell carries " + f, DASH.indexOf(f) >= 0);
  });
  check("(1) the old iframe left the shell; the curator loads only under the fold", !/<iframe[^>]*budget-support\/web\/curator\.html/.test(DASH) && /CURATOR_SRC = "budget-support\/web\/curator\.html"/.test(SRC));
  check("(1) the tab sits in the team tools group", /'library', 'letters'/.test(NAV));
  check("(1) RLS gates read, insert and update on the team phrase or a reviewer",
    (SQL.match(/team_pass_ok\(\) or public\.is_allowed_reviewer\(\)/g) || []).length >= 5);
  check("(1) no delete policy, and delete is revoked", !/for delete/i.test(SQL) && /revoke delete on public\.cpl_comms from anon, authenticated/.test(SQL));
  check("(1) every edit files the prior row in history", /after update on public\.cpl_comms/.test(SQL) && /to_jsonb\(old\)/.test(SQL));
  check("(1) the table holds roles, never addresses", /to_roles\s+text\[\]/.test(SQL) && /cc_roles\s+text\[\]/.test(SQL) && !/_email\s+text/.test(SQL));
  check("(1) the table carries its own Data API grants", /grant select, insert, update on public\.cpl_comms to anon, authenticated/.test(SQL) && /grant all on public\.cpl_comms to service_role/.test(SQL));
});

// ── (2) Locked: no phrase, no fetch, no count ────────────────────────────
block("(2)", function () {
  const m = loadModule({ banner: true });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(2) without the phrase the tab fetches nothing", m.calls.length === 0, JSON.stringify(m.calls));
    check("(2) it shows the team-phrase banner", !!m.root.querySelector("[data-tp-locked]") && /Locked: The register/.test(m.root.textContent));
    check("(2) and paints no count", !/communications|in draft/.test(m.root.textContent), m.root.textContent);
    check("(2) the earlier curator is offered, folded, with no iframe loaded", !!m.root.querySelector("details#cm-earlier") && !m.root.querySelector("iframe"));
  });
});

// ── (3) Read and render ──────────────────────────────────────────────────
block("(3)", function () {
  const m = loadModule({ phrase: "open-sesame", author: "Sam" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const urls = m.calls.map(function (c) { return c.url; });
    check("(3) reads cpl_comms, live rows only", urls.some(function (u) { return /\/rest\/v1\/cpl_comms\?/.test(u) && /retired_at=is\.null/.test(u); }), urls.join("\n"));
    check("(3) reads the roster, the identity table and the JST feed",
      urls.some(function (u) { return /\/map_college_contacts\?/.test(u); }) && urls.some(function (u) { return /\/map_colleges\?/.test(u); }) && urls.some(function (u) { return /veteran_jst\.json/.test(u); }));
    const c = m.calls.filter(function (x) { return /cpl_comms/.test(x.url); })[0];
    check("(3) the read carries the team phrase", c && c.init.headers && c.init.headers["x-team-pass"] === "open-sesame");
    const t = m.root.textContent;
    check("(3) the count line names communications and drafts", /3 communications, 1 in draft/.test(t), t.slice(0, 800));
    check("(3) each record shows its kind, status and audience in words", /Email/.test(t) && /Draft/.test(t) && /College CEOs/.test(t) && /MAP Team note/.test(t) && /Tabled/.test(t));
    check("(3) a record in the Library says so", /In the Library/.test(t));
    check("(3) a control is an underlined word, a button where it acts", !!m.root.querySelector('button.cm-btn[data-open="c1"]'));
  });
});

// ── (4) A failed read names its table and paints no count ────────────────
block("(4)", function () {
  const m = loadModule({ phrase: "p", fetch: function (url) { return /cpl_comms/.test(url) ? response(500, "boom") : null; } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    const t = m.root.textContent;
    check("(4) the failure names cpl_comms", /cpl_comms/.test(t), t);
    check("(4) no count is painted", !/communications,|in draft/.test(t), t);
  });
});

// ── (5) Filters and search ───────────────────────────────────────────────
block("(5)", function () {
  const m = loadModule({ phrase: "p" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-type="memo"]'));
    check("(5) a kind filter shows only that kind", m.root.querySelectorAll(".cm-item").length === 1 && /showing 1 of 3/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-type="all"]'));
    click(m.w, m.root.querySelector('[data-status="final"]'));
    check("(5) a status filter shows only that status", m.root.querySelectorAll(".cm-item").length === 1 && /What changed/.test(m.root.textContent));
    click(m.w, m.root.querySelector('[data-status="all"]'));
    const sel = m.w.document.getElementById("cm-aud");
    sel.value = "co"; sel.dispatchEvent(new m.w.Event("change", { bubbles: true }));
    check("(5) the audience selector filters", m.root.querySelectorAll(".cm-item").length === 1 && /Noncredit funding/.test(m.root.textContent));
    const sel2 = m.w.document.getElementById("cm-aud");   // the repaint replaced the box
    sel2.value = "all"; sel2.dispatchEvent(new m.w.Event("change", { bubbles: true }));
    const q = m.w.document.getElementById("cm-q");
    q.value = "summit "; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    const q2 = m.w.document.getElementById("cm-q");
    check("(5) typing a space keeps it and keeps the same box", q2 === q && q2.value === "summit ");
    q.value = "summit transcript"; q.dispatchEvent(new m.w.Event("input", { bubbles: true }));
    check("(5) two words both have to match, across title, subject and body", m.root.querySelectorAll(".cm-item").length === 1 && /JST uploads/.test(m.root.textContent));
    check("(5) a pressed filter says so without color alone", m.root.querySelector('[data-status="all"]').getAttribute("aria-pressed") === "true");
  });
});

// ── (6) Recipients: the roster joined to identities and the JST feed ─────
block("(6)", function () {
  const m = loadModule({ phrase: "p", author: "Sam" });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-open="c1"]'));
    const rows = m.M._recipients(COMMS[0]);
    check("(6) partners and duplicate spellings drop out; three colleges remain", rows.length === 3 && rows.map(function (r) { return r.college; }).join("|") === "Alpha College|Beta Community College|Gamma College", JSON.stringify(rows.map(function (r) { return r.college; })));
    const alpha = rows[0], beta = rows[1], gamma = rows[2];
    check("(6) the CEO is To and the CIO and CSSO are Cc, with addresses", alpha.to[0].email === "jzellet@alpha.edu" && alpha.cc.map(function (p) { return p.email; }).join(",") === "kmitchell@alpha.edu,ipadron@alpha.edu");
    check("(6) a college with no CEO address is a named gap, never a blank letter", gamma.to.length === 0 && /CEO \(president\) is not in MAP/.test(gamma.gaps[0]), JSON.stringify(gamma.gaps));
    check("(6) the JST feed joins by name and by variant", alpha.jst && alpha.jst.jst === 52 && beta.jst && beta.jst.star === true && gamma.jst === null);
    const t = m.root.textContent;
    check("(6) the recipients line counts scope, ready and gaps", /3 colleges in scope; 2 with every To address, 1 with a gap/.test(t), t.slice(t.indexOf("Recipients"), t.indexOf("Recipients") + 300));
    check("(6) the table carries the JST standing in figures", /52 \/ 100 \(52%\)/.test(t) && /70 \/ 80 \(88%\)/.test(t));
    check("(6) the table is a labeled, scrolling region with scoped headers", !!m.root.querySelector('.cm-wrap[role="region"][aria-label]') && m.root.querySelectorAll('table.cm-t th[scope="col"]').length === 5);
    check("(6) the figures say when they were read", /JST figures read 23 October 2026/.test(t) && /Roster synced 22 October 2026/.test(t));
    click(m.w, m.root.querySelector('[data-preview="0"]'));
    const pv = m.w.document.getElementById("cm-pv-0");
    check("(6) Preview merges the fields for that college", pv && /Dear Dr\. Zellet,/.test(pv.textContent) && /MAP holds 52 JSTs against 100 enrolled veterans at Alpha College \(52 percent\)/.test(pv.textContent), pv && pv.textContent);
    check("(6) the subject merges too", pv && /Subject: CPL Initiative: Alpha College and the Joint Services Transcript upload/.test(pv.textContent));
    const mail = m.root.querySelector('a.cm-btn[href^="mailto:"]');
    check("(6) the mail link carries To, Cc, subject and body", mail && /^mailto:jzellet@alpha\.edu\?cc=kmitchell@alpha\.edu,ipadron@alpha\.edu&subject=CPL%20Initiative/.test(mail.getAttribute("href")) && /body=Dear%20Dr\.%20Zellet/.test(mail.getAttribute("href")), mail && mail.getAttribute("href").slice(0, 160));
    const csv = m.M._csv(COMMS[0], rows).split("\r\n");
    check("(6) the CSV has a header and a row per college, the gap in its own column", csv.length === 4 && /^college,to_name,to_email,cc_names,cc_emails,subject,body,gaps$/.test(csv[0]) && /"Gamma College","","",/.test(csv[3]) && /is not in MAP"$/.test(csv[3]), csv[3]);
  });
});

// ── (7) Merge fields and the salutation ──────────────────────────────────
block("(7)", function () {
  const M = loadModule({}).M;
  check("(7) Dr. in the name wins", M._salutation("Dr. Jennifer Zellet", "ceo") === "Dr. Zellet");
  check("(7) a CEO without an honorific is President", M._salutation("Kevin G. Walthers", "ceo") === "President Walthers");
  check("(7) a suffix after a comma is dropped", M._salutation("Maria Lopez, Ed.D.", "ceo") === "President Lopez");
  check("(7) a double space in a hand-typed name is read", M._salutation("Kathyrn  Mitchell", "vpaa") === "Vice President Mitchell");
  check("(7) a role with no title word falls back to the full name", M._salutation("Pat Vega", "cpl_coordinator") === "Pat Vega");
  check("(7) an empty name gives an empty salutation", M._salutation("", "ceo") === "");
  const r = M._merge("Dear {salutation}, {college} has {jst} JSTs. {nope}", { salutation: "Dr. Zellet", college: "Alpha College", jst: "52" });
  check("(7) a filled field is replaced and an unfilled one stays visible in brackets", r.text === "Dear Dr. Zellet, Alpha College has 52 JSTs. [nope]" && r.missing.join() === "nope");
  check("(7) a percentage rounds and an unknown headcount gives none", M._pct(52, 100) === 52 && M._pct(70, 80) === 88 && M._pct(5, 0) === null);
  check("(7) a slug fits the table's rule", /^[a-z0-9][a-z0-9-]{1,80}$/.test(M._slug("JST uploads & the 2026–2028 funding, to the CEOs")));
});

// ── (8) Writes: save, new, retire, the Library ───────────────────────────
block("(8)", function () {
  const writes = [];
  const m = loadModule({ phrase: "p", author: "", fetch: function (url, init) {
    if (init && init.method) {
      writes.push({ url: url, init: init, body: JSON.parse(init.body) });
      return response(201, [{ id: /cpl_library$/.test(url) ? "lib1" : "new1", slug: "x" }]);
    }
    return null;
  } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-open="c1"]'));
    const doc = m.w.document;
    doc.getElementById("ce-title").value = "JST uploads, to the CEOs, revised";
    doc.getElementById("cm-f-c1").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    check("(8) Save refuses without a name, and writes nothing", writes.length === 0 && /Add your name/.test(m.root.textContent));
    check("(8) the typed title survives that repaint", doc.getElementById("ce-title").value === "JST uploads, to the CEOs, revised");
    doc.getElementById("ce-by").value = "Ashley";
    doc.querySelector("input[name='cm-cc'][value='vpss']").checked = false;
    doc.getElementById("cm-f-c1").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const w0 = writes[0] || { body: {}, init: { headers: {} } };
    check("(8) Save PATCHes that record on cpl_comms", w0.init.method === "PATCH" && /cpl_comms\?id=eq\.c1$/.test(w0.url));
    check("(8) the write carries the team phrase and who changed it", w0.init.headers["x-team-pass"] === "p" && w0.body.updated_by === "Ashley");
    check("(8) roles are written as roles, the unticked one gone, and no address is stored", Array.isArray(w0.body.to_roles) && w0.body.to_roles.join() === "ceo" && w0.body.cc_roles.join() === "vpaa" && !JSON.stringify(w0.body).match(/@alpha\.edu/));
    click(m.w, m.root.querySelector("#cm-new"));
    const doc = m.w.document;
    doc.getElementById("ce-title").value = "A flyer for the Summit";
    doc.getElementById("ce-type").value = "flyer";
    doc.getElementById("ce-aud").value = "public";
    doc.getElementById("ce-by").value = "Ashley";
    doc.getElementById("cm-f-new").dispatchEvent(new m.w.Event("submit", { bubbles: true, cancelable: true }));
    return settle();
  }).then(function () {
    const w1 = writes[1] || { body: {}, init: {} };
    check("(8) New POSTs to cpl_comms with a slug, a kind, an audience and who added it",
      w1.init.method === "POST" && /\/rest\/v1\/cpl_comms$/.test(w1.url) && /^[a-z0-9][a-z0-9-]{1,80}$/.test(w1.body.slug || "") && w1.body.comm_type === "flyer" && w1.body.audience === "public" && w1.body.added_by === "Ashley", JSON.stringify(w1.body));
    // The page link still names c1 (opened above), so the reload after the new record's
    // save reopened it; open it only if it is closed.
    if (!m.root.querySelector('[data-library="c1"]')) click(m.w, m.root.querySelector('[data-open="c1"]'));
    click(m.w, m.root.querySelector('[data-library="c1"]'));
    return settle();
  }).then(function () {
    const w2 = writes[2] || { body: {}, init: {} }, w3 = writes[3] || { body: {}, init: {} };
    check("(8) Post to the Library writes a document record that links back here",
      w2.init.method === "POST" && /\/rest\/v1\/cpl_library$/.test(w2.url) && w2.body.kind === "document" && w2.body.home === "web" &&
      w2.body.url === "https://cpl-initiative.github.io/cpl-project-tracker/#letters/jst-upload-ceos-261023" && w2.body.seen_by === "colleges" && w2.body.added_by === "Ashley", JSON.stringify(w2.body));
    check("(8) and stores the Library record's id on the communication", w3.init.method === "PATCH" && /cpl_comms\?id=eq\.c1$/.test(w3.url) && w3.body.library_id === "lib1");
    check("(8) the record stays open after the post", !!m.root.querySelector('[data-retire="c1"]'));
    check("(8) the submit control is a real submit button", m.root.querySelector('#cm-f-c1 button[type="submit"]') !== null);
    click(m.w, m.root.querySelector('[data-retire="c1"]'));
    check("(8) Retire asks first and writes nothing yet", writes.length === 4 && /Retire this record\?/.test(m.root.textContent));
    click(m.w, m.root.querySelector("[data-retireno]"));
    click(m.w, m.root.querySelector('[data-retire="c1"]'));
    click(m.w, m.root.querySelector('[data-retireyes="c1"]'));
    return settle();
  }).then(function () {
    const w4 = writes[4] || { body: {}, init: {} };
    check("(8) Retire sets retired_at; nothing is deleted", w4.init.method === "PATCH" && !!w4.body.retired_at);
    check("(8) no write ever uses DELETE", writes.every(function (x) { return x.init.method !== "DELETE"; }));
  });
});

// ── (9) Claude's draft through the proxy ─────────────────────────────────
block("(9)", function () {
  const posts = [];
  const m = loadModule({ phrase: "p", author: "Sam", proxy: "https://proxy.example/", fetch: function (url, init) {
    if (/proxy\.example/.test(url)) {
      posts.push(JSON.parse(init.body));
      return response(200, { model: "claude-opus-5-5", stop_reason: "end_turn", content: [{ type: "text", text: "Subject: {college} and the JST upload\n\nDear {salutation},\n\nThe body.\n\n{sender}" }] });
    }
    return null;
  } });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    click(m.w, m.root.querySelector('[data-open="c1"]'));
    m.w.document.getElementById("ce-note").value = "Mention the Summit.";
    click(m.w, m.root.querySelector('[data-draft="c1"]'));
    return settle();
  }).then(function () {
    const p = posts[0] || {};
    check("(9) the request names the one model and goes through the proxy with the house voice", p.model === "claude-opus-5-5" && /house voice/.test(p.system) && /American spelling/.test(p.system) && /never money/.test(p.system) && /Military Articulation Platform/.test(p.system));
    check("(9) the prompt carries the audience guidance, the merge fields and the unsaved note", p.messages && /College CEOs/.test(p.messages[0].content) && /\{salutation\}/.test(p.messages[0].content) && /Mention the Summit/.test(p.messages[0].content));
    check("(9) the prompt never names an address", !/@alpha\.edu/.test(JSON.stringify(p)));
    check("(9) the draft stays beside the body until used", !!m.root.querySelector("#cm-draft") && m.w.document.getElementById("ce-body").value.indexOf("The body.") < 0);
    click(m.w, m.root.querySelector("[data-usedraft]"));
    check("(9) Use this draft fills the body and the subject", m.w.document.getElementById("ce-body").value.indexOf("The body.") >= 0 && m.w.document.getElementById("ce-subject").value === "{college} and the JST upload");
    check("(9) the model is named once in the source", (SRC.match(/claude-[a-z0-9-]+/g) || []).length === 1, (SRC.match(/claude-[a-z0-9-]+/g) || []).join());
  });
});

// ── (10) Tokens, words, spelling ─────────────────────────────────────────
block("(10)", function () {
  const css = (SRC.match(/function ensureCss\(\)[\s\S]*?\n  }\n/) || [""])[0];
  check("(10) the injected CSS uses tokens, never a raw hex", css.length > 2000 && !/#[0-9a-fA-F]{3,8}\b(?![-\w])/.test(css.replace(/"#" \+ ROOT_ID/g, "")));
  check("(10) plain words, no emoji or marks", !/[\u{1F300}-\u{1FAFF}✅✔✓❌⚠🔒★☆]/u.test(SRC));
  check("(10) American spelling in rendered text", !/\b(colour|behaviour|organisation|catalogue|centre|licence|whilst|amongst)\b/i.test(SRC));
  check("(10) the tab never deletes", !/method\s*:\s*["']DELETE/i.test(SRC) && !/"DELETE"/.test(SRC));
  check("(10) the tab says it sends nothing", /COBI sends nothing/.test(SRC));
});

// ── (11) A private window still renders ──────────────────────────────────
block("(11)", function () {
  const m = loadModule({ noStorage: true });
  return Promise.resolve(m.M.activate()).then(settle).then(function () {
    check("(11) with storage blocked the tab renders its locked state", /team phrase/.test(m.root.textContent) && m.calls.length === 0, m.root.textContent);
  });
});

Promise.all(pending).then(function () {
  let failed = 0;
  results.forEach(function (r) {
    if (!r[1]) failed++;
    console.log((r[1] ? "PASS " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n      " + String(r[2]).slice(0, 400)));
  });
  console.log(failed ? failed + " failed of " + results.length : "all " + results.length + " passed");
  process.exit(failed ? 1 : 0);
});
