// The Exhibits tab's List view (Sam, 2026-11-01): "a simple exhibit view in small font, alpha order with tight
// margins and padding. I want to be able to scan and correct directly on the view exhibit titles next to their key
// information ... If you could embed a button that fired an re-analysis routine". Fable advised the columns. Guards:
//   (1) every credential, A to Z by its current title, one row each, under a header with th scope and a labelled region;
//   (2) no TOP column (Rule 7), the CIP field named as a family read from TOP, the discipline the M-IDs' own;
//   (3) the filters (Unreviewed, Low-confidence title, Flagged, No articulation) and the finder narrow the rows;
//   (4) Edit saves a rename as unified_title_override and the issuer as issuing_agency_override, only what changed,
//       and the row shows the new title with the rename pending;
//   (5) Re-analyze my changes writes one _EXHIBIT_REANALYSIS:: request row naming the credentials changed this visit;
//   (6) a rename the daily dry-run found colliding says so.
// Run from repo root: `npm test` (or `node tests/exhibits_list.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim(); }
const src = fs.readFileSync("exhibits.js", "utf8");

const CREDREF = { _generated_at: "2026-11-01T05:19:00+00:00", unified_titles: [
  { ut: "Welding Level 1", issuer: "AWS", cpl_types: ["Industry Certification"], disc_modal: "Welding", top_modal: "0956.50",
    curated_by: "reviewer", curated_at: "2026-10-01", conf_title: 0.9, raw_count: 3,
    articulations: [{ cid: "WELD M1001", sys: "M-ID", local: [{ colleges: ["Norco College", "Bakersfield College"] }] }] },
  { ut: "10-Key Data Entry", issuer: "Proctored Testing Center", cpl_types: ["Credit By Exam"], disc_modal: "Building Codes and Regulations",
    top_modal: "0514.00", curated_by: "session105-skyclose@bot", curated_at: "2026-07-08", conf_title: 0.45, quality_flag: "suspect_course_as_exhibit",
    raw_count: 2, articulations: [{ cid: "CNSR M10AA", sys: "M-ID", local: [{ colleges: ["Modesto Junior College"] }] }] },
  { ut: "Apiary Basics", issuer: "", cpl_types: [], disc_modal: "", raw_count: 1, articulations: [] }
] };
const ADOPTION = { schema: 1, cip_sectors: { "48": "Precision Production", "52": "Business" }, colleges: [],
  credentials: { "Welding Level 1": { s: "48" }, "10-Key Data Entry": { s: "52" } } };
const COLLISIONS = { collisions: [{ old_unified_title: "Apiary Basics", proposed_new_title: "Beekeeping" }] };

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="exhibits-root">Loading</div></body></html>',
    { url: "https://example.org/#exhibits/list", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
    const ok = function (o) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(o))); } }); };
    if (url === "kb/exhibits_review.json") return ok({ schema: 1, written_at: "2026-11-01T05:22:00Z", sources: {}, tiles: {}, steps: {}, colleges: [], held: [] });
    if (url === "kb/exhibits_adoption.json") return ok(ADOPTION);
    if (url === "kb/cred_rename_dryrun/collisions.json") return ok(COLLISIONS);
    if (/\/rest\/v1\/kb_curation/.test(url) && (init.method || "GET") === "GET") return ok([]);
    if (/\/rest\/v1\/kb_curation/.test(url)) return Promise.resolve({ ok: true, status: 201, json: function () { return Promise.resolve(null); } });
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  const sess = { access_token: "a.b.c", email: "sam@example.org" };
  w.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "anon-key", Authorization: "Bearer anon-key" }; } };
  w.CPL_TABS = { loadScript: function (s, name, cb) { if (s === "credential_reference_data.js") w[name] = JSON.parse(JSON.stringify(CREDREF)); setTimeout(cb, 0); } };
  const s = w.document.createElement("script"); s.textContent = src; w.document.body.appendChild(s);
  return { w: w, d: w.document, M: w.CPL_EXHIBITS, calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function rows(d) { return Array.from(d.querySelectorAll(".exh-l-table tbody tr:not(.exh-l-editrow)")); }
function words(d, t) { return Array.from(d.querySelectorAll("button")).find((b) => txt(b) === t); }

(async function () {
  const t = load();
  await t.M.boot(); await settle();
  check("(1) #exhibits/list opens the List view", t.M._state.view === "list");
  const titles = rows(t.d).map((r) => txt(r.children[2]).split("collides")[0]);
  check("(1) ⭐ every credential, A to Z", titles.length === 3 && /^10-Key/.test(titles[0]) && /^Apiary/.test(titles[1]) && /^Welding/.test(titles[2]), titles.join(" | "));
  const heads = Array.from(t.d.querySelectorAll(".exh-l-table th")).map(txt);
  check("(1) every header cell is th scope=col, inside a labelled region",
    t.d.querySelectorAll('.exh-l-table th[scope="col"]').length === heads.length && !!t.d.querySelector('.exh-l-wrap[role="region"][aria-label]'));
  check("(2) no TOP column; the CIP field is a family read from TOP; the discipline is the M-IDs'",
    !heads.some((h) => /^TOP/.test(h)) && heads.indexOf("CIP family (from TOP)") > -1 && heads.indexOf("Discipline (M-IDs)") > -1, heads.join(","));
  const key = rows(t.d)[0];
  check("(2) a row reads its status, flag, CPL types, issuer, discipline, common SUBJ and CIP family",
    /Cohort; suspect course as exhibit/.test(txt(key.children[3])) && txt(key.children[4]) === "45%" && txt(key.children[5]) === "Credit By Exam"
    && txt(key.children[6]) === "Proctored Testing Center" && txt(key.children[8]) === "Building Codes and Regulations"
    && txt(key.children[9]) === "CNSR" && txt(key.children[10]) === "52 Business", txt(key));
  check("(6) a rename the dry-run found colliding says so", /collides with Beekeeping/.test(txt(rows(t.d)[1].children[2])));
  check("(1) no raw hex in the view's CSS", !/#[0-9a-fA-F]{3,6}\b/.test(txt(t.d.getElementById("exh-l-css"))));

  words(t.d, "Unreviewed").click(); await settle();
  check("(3) Unreviewed shows only the unstamped credential", rows(t.d).length === 1 && /Apiary/.test(txt(rows(t.d)[0])));
  words(t.d, "Low-confidence title").click(); await settle();
  check("(3) Low-confidence title shows the title under 60%", rows(t.d).length === 1 && /10-Key/.test(txt(rows(t.d)[0])));
  words(t.d, "No articulation").click(); await settle();
  check("(3) No articulation shows the credential with no M-ID", rows(t.d).length === 1 && /Apiary/.test(txt(rows(t.d)[0])));
  words(t.d, "All").click(); await settle();
  const find = t.d.getElementById("exh-l-find");
  find.value = "welding"; find.dispatchEvent(new t.w.Event("input")); await settle();
  check("(3) the finder narrows by discipline or title", rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0])));
  find.value = ""; find.dispatchEvent(new t.w.Event("input")); await settle();

  const edit = Array.from(t.d.querySelectorAll("button")).find((b) => b.getAttribute("aria-label") === "Edit 10-Key Data Entry");
  edit.click(); await settle();
  const ti = t.d.getElementById("exh-l-t"), is = t.d.getElementById("exh-l-i");
  check("(4) Edit opens the title, issuer and sites boxes on the row", !!ti && !!is && ti.value === "10-Key Data Entry");
  ti.value = "Ten-Key Data Entry"; ti.dispatchEvent(new t.w.Event("input"));
  is.value = "Local College"; is.dispatchEvent(new t.w.Event("input"));
  words(t.d, "Save").click(); await settle();
  const posts = t.calls.filter((c) => c.method === "POST" && /kb_curation/.test(c.url));
  check("(4) ⭐ Save writes the rename and the issuer, only what changed",
    posts.length === 2 && posts.some((p) => p.body.field === "unified_title_override" && p.body.value === "Ten-Key Data Entry"
      && p.body.course_id === "_CREDENTIAL_REVIEW::10-Key Data Entry")
    && posts.some((p) => p.body.field === "issuing_agency_override" && p.body.value === "Local College"), JSON.stringify(posts.map((p) => p.body)));
  const renamed = rows(t.d).find((r) => /Ten-Key/.test(txt(r)));
  check("(4) the row shows the new title, the rename pending, and the new issuer",
    !!renamed && /renamed from 10-Key Data Entry; pending the apply/.test(txt(renamed)) && txt(renamed.children[6]) === "Local College");

  const ta = t.d.getElementById("exh-l-note");
  check("(5) the comments box is a labelled text area", ta && ta.tagName === "TEXTAREA" && !!t.d.querySelector('label[for="exh-l-note"]'));
  ta.value = "Checked the 10-Key issuer; it looks like a local course, not an exam"; ta.dispatchEvent(new t.w.Event("input"));
  words(t.d, "Re-analyze my changes").click(); await settle();
  const req = t.calls.filter((c) => c.method === "POST" && c.body && c.body.field === "exhibit_reanalysis_request");
  const v = req.length ? JSON.parse(req[0].body.value) : {};
  check("(5) ⭐ Re-analyze writes one request row naming the changed credential and the note",
    req.length === 1 && /^_EXHIBIT_REANALYSIS::/.test(req[0].body.course_id) && v.changed.join() === "10-Key Data Entry"
    && v.comments === "Checked the 10-Key issuer; it looks like a local course, not an exam", JSON.stringify(req.map((r) => r.body)));
  check("(5) and says what the routine will look at", /Queued with your comments\./.test(txt(t.d.querySelector(".exh-note"))) && /Jev/.test(txt(t.d.querySelector(".exh-note"))));

  // Sam, 2026-11-01: "sometimes I miss good ol' Excel, where I can quickly filter any column, sort any way".
  const sortBtn = (h) => Array.from(t.d.querySelectorAll(".exh-l-sort")).find((b) => txt(b).indexOf(h) === 0);
  sortBtn("MAP titles").click(); await settle();
  check("(7) ⭐ a header sorts its column, low to high, and says so",
    /^Apiary/.test(txt(rows(t.d)[0].children[2])) && /low to high/.test(txt(sortBtn("MAP titles")))
    && sortBtn("MAP titles").parentNode.getAttribute("aria-sort") === "ascending");
  sortBtn("MAP titles").click(); await settle();
  check("(7) a second press reverses it", /^Welding/.test(txt(rows(t.d)[0].children[2])) && sortBtn("MAP titles").parentNode.getAttribute("aria-sort") === "descending");
  sortBtn("Issuer").click(); await settle();
  check("(7) a text column sorts A to Z with blanks last", /^Apiary/.test(txt(rows(t.d)[2].children[2])));
  const cf = t.d.getElementById("exh-l-cf-4");
  check("(8) every column has its own labelled filter", t.d.querySelectorAll(".exh-l-cfin").length === 11 && cf.getAttribute("aria-label") === "Filter Issuer");
  cf.value = "aws"; cf.dispatchEvent(new t.w.Event("input")); await settle();
  check("(8) ⭐ a column filter narrows to its matches and keeps focus", rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0]))
    && t.d.activeElement && t.d.activeElement.id === "exh-l-cf-4");
  const csv = t.M._listCsv(t.M._listRows());
  check("(9) ⭐ the spreadsheet carries the filtered rows, every column, the credential key first",
    /^\ufeffCredential key,Title,Status,Confidence,CPL types,Issuer/.test(csv) && csv.trim().split("\r\n").length === 2 && /Welding Level 1/.test(csv), csv.slice(0, 200));
  check("(9) a comma or quote in a value is quoted", t.M._listCsv([{ ut: 'A, "B"', cpl_types: [], articulations: [] }]).indexOf('"A, ""B"""') > -1);
  check("(9) the Download word names the count", !!Array.from(t.d.querySelectorAll("button")).find((b) => /^Download these 1 as a spreadsheet$/.test(txt(b))));

  const wb = t.d.getElementById("exh-l-wrap");
  check("(10) ⭐ the list opens unwrapped: one line a cell, the full text on hover",
    t.d.querySelector(".exh-l-table").classList.contains("exh-l-nowrap") && wb.getAttribute("aria-pressed") === "false"
    && rows(t.d)[0].children[5].getAttribute("title") === txt(rows(t.d)[0].children[5]));
  wb.click(); await settle();
  check("(10) Wrap text wraps every field and says it is on",
    !t.d.querySelector(".exh-l-table").classList.contains("exh-l-nowrap") && t.d.getElementById("exh-l-wrap").getAttribute("aria-pressed") === "true");
  const grip = t.d.getElementById("exh-l-grip-4");
  check("(11) every header carries a labelled resize separator", t.d.querySelectorAll(".exh-l-grip[role=separator]").length === 11
    && grip.getAttribute("aria-label") === "Resize Issuer" && grip.getAttribute("tabindex") === "0");
  grip.dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const w1 = t.M._state.ls.widths;
  check("(11) ⭐ the arrow keys widen a column by a step and fix the widths in pixels",
    Array.isArray(w1) && w1[4] === 120 + 24 && /144px/.test(t.d.querySelectorAll(".exh-l-table col")[6].getAttribute("style")), JSON.stringify(w1));
  grip.dispatchEvent(new t.w.KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  check("(11) Home narrows it to the least", t.M._state.ls.widths[4] === 48);
  t.d.getElementById("exh-l-wrap").click(); await settle();
  check("(11) the widths survive a repaint this visit", /48px/.test(t.d.querySelectorAll(".exh-l-table col")[6].getAttribute("style")));
  // Sam, 2026-11-01: selection boxes, a flag that persists until cleared, and drill-downs on click.
  const box = (lab) => Array.from(t.d.querySelectorAll("input[type=checkbox]")).find((b) => b.getAttribute("aria-label") === lab);
  box("Select Welding Level 1").click(); await settle();
  words(t.d, "Selected").click(); await settle();
  check("(12) ⭐ a selected row shows under Selected, and the count says so",
    rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0])) && /1 selected/.test(txt(t.d.getElementById("exh-l-selcount"))));
  words(t.d, "All").click(); await settle();
  box("Flag Welding Level 1").click(); await settle();
  const fl = t.calls.filter((c) => c.method === "POST" && c.body && c.body.field === "list_flag");
  check("(13) ⭐ a flag saves as list_flag with the time, under the credential", fl.length === 1
    && fl[0].body.course_id === "_CREDENTIAL_REVIEW::Welding Level 1" && /^\d{4}-\d\d-\d\dT/.test(fl[0].body.value));
  words(t.d, "Your flags").click(); await settle();
  check("(13) Your flags shows the flagged row", rows(t.d).length === 1 && /Welding/.test(txt(rows(t.d)[0])));
  box("Flag Welding Level 1").click(); await settle();
  const fl2 = t.calls.filter((c) => c.method === "POST" && c.body && c.body.field === "list_flag");
  check("(13) clearing writes an empty value, never a delete", fl2.length === 2 && fl2[1].body.value === ""
    && !t.calls.some((c) => c.method === "DELETE"));
  words(t.d, "All").click(); await settle();
  const issuerBtn = Array.from(t.d.querySelectorAll(".exh-l-open")).find((b) => /^Issuer: AWS/.test(b.getAttribute("aria-label")));
  issuerBtn.click(); await settle();
  check("(14) ⭐ a cell opens its drill-down under the row, and says so", /Issuer, /.test(txt(t.d.querySelector(".exh-l-drawer")))
    && !!t.d.querySelector('.exh-l-open[aria-expanded="true"]'));
  const mapBtn = Array.from(t.d.querySelectorAll(".exh-l-open")).find((b) => /^Discipline \(M-IDs\): Welding/.test(b.getAttribute("aria-label")));
  mapBtn.click(); await settle();
  check("(14) the discipline drill-down lists the M-ID and its colleges", /M-ID WELD M1001/.test(txt(t.d.querySelector(".exh-l-drawer")))
    && /Norco College/.test(txt(t.d.querySelector(".exh-l-drawer"))));
  let failed = 0;
  for (const [name, ok, why] of results) { console.log((ok ? "PASS " : "FAIL ") + name + (ok || !why ? "" : "\n     " + why)); if (!ok) failed++; }
  console.log("\n" + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
