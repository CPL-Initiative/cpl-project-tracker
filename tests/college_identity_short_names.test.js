// The College Identity tab's short-name editor (S545; college-district-identity lane, NEXT). Sam: "I think that's what's
// held me up previously", and "I can make those corrections in the table so the exceptions don't need to be coded".
// Guards:
//   (1) the roster gains a Short name column (th scope=col), read live from public.college_short_names and matched to a
//       map_colleges row through college_short_names.js's cplCollegeShortRecord; a row with no record reads "none", and
//       the suppressed-row and placeholder lines span the seven columns;
//   (2) a failed read of the table says so (a failed read, never an empty table) and offers no Edit;
//   (3) signed out (or with the team phrase alone) the column reads but offers no Edit, and says a reviewer link edits;
//   (4) a reviewer's Edit opens one box; Save PATCHes the one row by its canonical name with the short alone and
//       return=representation; the status line says it saved, that the pages show it after the daily run, and that the
//       old short stays an alias; the cell then says the pages still show the old short until the run;
//   (5) the trigger's refusal (a short another college answers to) comes back in the status line and the box stays;
//   (6) a write RLS filters (200 with no row) says to sign in with a reviewer link; an empty box saves nothing;
//   (7) Escape cancels; the CSS adds no raw hex.
// Run from repo root: `npm test` (or `node tests/college_identity_short_names.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }
const SRC = fs.readFileSync("college_identity.js", "utf8");
const SHORT_SRC = fs.readFileSync("college_short_names.js", "utf8");

const COLLEGES = [
  { college_id: 7, college_name: "Butte College", entity_kind: "college", is_test: false, variants: [], district: "Butte-Glenn CCD", mis_district_code: "021", mis_college_code: "021" },
  { college_id: 41, college_name: "College of the Desert", entity_kind: "college", is_test: false, variants: [], district: "Desert CCD", mis_district_code: "091", mis_college_code: "091" },
  { college_id: 900, college_name: "Testing College", entity_kind: "test", is_test: true, variants: [], district: null, mis_district_code: null, mis_college_code: null }
];
const SHORTS = [
  { canonical: "Butte College", short: "Butte", short_caps: "BUTTE", aliases: ["Butte College"], updated_by: "short-names-s545@bot", updated_at: "2026-11-02T04:02:25Z" },
  { canonical: "College Of The Desert", short: "College of the Desert", short_caps: "COLLEGE OF THE DESERT", aliases: ["College Of The Desert", "Desert"], updated_by: "short-names-s545@bot", updated_at: "2026-11-02T04:02:25Z" }
];

function tab(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="college-identity-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window, calls = [];
  if (opts.reviewer !== false) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.cccc" }));
  w.fetch = function (url, init) {
    url = String(url); init = init || {};
    calls.push({ url: url, method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null, headers: init.headers || {} });
    const ok = (o) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(JSON.stringify(o))), text: () => Promise.resolve(JSON.stringify(o)) });
    if (/\/map_colleges\?/.test(url)) return ok(COLLEGES);
    if (/\/map_college_contacts\?/.test(url)) return ok([]);
    if (/\/college_short_names\?select/.test(url)) return opts.readFails ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}), text: () => Promise.resolve("") }) : ok(SHORTS);
    if (/\/college_short_names\?canonical=eq\./.test(url) && init.method === "PATCH") {
      if (opts.refuse) return Promise.resolve({ ok: false, status: 400, json: () => Promise.resolve({}),
        text: () => Promise.resolve(JSON.stringify({ code: "P0001", message: "College Of The Desert already answers to \"Desert\"; pick another short for Butte College." })) });
      if (opts.rls) return ok([]);
      const b = JSON.parse(init.body);
      const row = Object.assign({}, SHORTS[0], { short: b.short, short_caps: b.short.toUpperCase(), aliases: ["Butte College", "Butte"], updated_by: "sam@example.org" });
      return ok([row]);
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}), text: () => Promise.resolve("") });
  };
  [SHORT_SRC, SRC].forEach((code) => { const s = w.document.createElement("script"); s.textContent = code; w.document.body.appendChild(s); });
  return { w: w, d: w.document, M: w.CPL_COLLEGE_IDENTITY_TAB, root: w.document.getElementById("college-identity-root"), calls: calls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));
async function settle() { for (let i = 0; i < 10; i++) await tick(); }
function rowOf(d, name) { return Array.from(d.querySelectorAll(".cid-t tbody tr")).find((tr) => tr.querySelector('td[data-label="Name"]') && txt(tr.querySelector('td[data-label="Name"]')).indexOf(name) === 0); }
function shortCell(d, name) { const r = rowOf(d, name); return r && r.querySelector('td[data-label="Short name"]'); }
function patches(t) { return t.calls.filter((c) => c.method === "PATCH"); }

(async function () {
  const t = tab();
  t.M.activate(t.root); await settle();
  const heads = Array.from(t.d.querySelectorAll(".cid-t thead th")).map(txt);
  check("(1) ⭐ a Short name column after Name, a th scope=col like the rest", heads[1] === "Short name"
    && t.d.querySelectorAll(".cid-t thead th[scope='col']").length === heads.length && t.d.querySelectorAll(".cid-t col").length === heads.length, heads.join(","));
  check("(1) the live short reaches its map_colleges row through the resolver (MAP's \"College of the Desert\" is the table's \"College Of The Desert\")",
    /^College of the Desert/.test(txt(shortCell(t.d, "College of the Desert"))) && /^Butte/.test(txt(shortCell(t.d, "Butte College"))));
  check("(1) a row with no short-name record reads none", txt(shortCell(t.d, "Testing College")) === "none");
  check("(1) the suppressed row's line spans the seven columns", !!t.d.querySelector('.cid-t td.cid-why[colspan="7"]') && !t.d.querySelector('.cid-t td[colspan="6"]'));
  check("(3) a reviewer sees Edit, naming the college to a screen reader", !!t.d.querySelector('[data-short-edit="Butte College"][aria-label="Edit the short name of Butte College"]'));

  const f = tab({ readFails: true });
  f.M.activate(f.root); await settle();
  check("(2) ⭐ a failed read says it is a failed read, and offers no Edit", /The short names could not be read \(404\)/.test(txt(f.root))
    && /failed read, not an empty table/.test(txt(f.root)) && !f.d.querySelector("[data-short-edit]") && /^Butte/.test(txt(shortCell(f.d, "Butte College"))));

  const o = tab({ reviewer: false });
  o.M.activate(o.root); await settle();
  check("(3) ⭐ signed out the column reads, offers no Edit, and says a reviewer link edits", !o.d.querySelector("[data-short-edit]")
    && /^Butte/.test(txt(shortCell(o.d, "Butte College"))) && /Sign in with a reviewer link to edit one/.test(txt(o.root)));

  t.d.querySelector('[data-short-edit="Butte College"]').click(); await settle();
  let box = t.d.getElementById("cid-sin");
  check("(4) Edit opens one box holding the short, focused", !!box && box.value === "Butte" && t.d.activeElement === box
    && box.getAttribute("aria-label") === "Short name of Butte College" && t.d.querySelectorAll(".cid-sin").length === 1);
  box.value = "  Butte   Glenn "; box.dispatchEvent(new t.w.Event("input"));
  t.d.querySelector('[data-short-save="Butte College"]').click(); await settle();
  let p = patches(t);
  check("(4) ⭐ Save PATCHes the one row by its canonical name, the short alone, with return=representation",
    p.length === 1 && /\/college_short_names\?canonical=eq\.Butte%20College$/.test(p[0].url) && JSON.stringify(p[0].body) === '{"short":"Butte Glenn"}'
    && p[0].headers.Prefer === "return=representation" && /^Bearer aaaa\./.test(p[0].headers.Authorization), JSON.stringify(p));
  const status = txt(t.d.getElementById("cid-status"));
  check("(4) the status line says it saved, when the pages show it, and that the old short stays an alias",
    /Saved: Butte College reads Butte Glenn\. The pages show it after the daily run \(06:17 UTC\); “Butte” stays an alias/.test(status), status);
  check("(4) the cell shows the new short and says the pages show the old one until the run",
    /^Butte Glenn/.test(txt(shortCell(t.d, "Butte College"))) && /on the pages after the daily run; they show Butte until then/.test(txt(shortCell(t.d, "Butte College")))
    && !t.d.getElementById("cid-sin"), txt(shortCell(t.d, "Butte College")));
  check("(4) focus returns to the row's Edit", t.d.activeElement === t.d.querySelector('[data-short-edit="Butte College"]'));

  const r = tab({ refuse: true });
  r.M.activate(r.root); await settle();
  r.d.querySelector('[data-short-edit="Butte College"]').click(); await settle();
  box = r.d.getElementById("cid-sin"); box.value = "Desert"; box.dispatchEvent(new r.w.Event("input"));
  box.dispatchEvent(new r.w.KeyboardEvent("keydown", { key: "Enter" })); await settle();
  check("(5) ⭐ the trigger's refusal reaches the status line, nothing changes, and the box stays",
    /It did not save \(College Of The Desert already answers to "Desert"; pick another short for Butte College\.\)\. Nothing changed\./.test(txt(r.d.getElementById("cid-status")))
    && !!r.d.getElementById("cid-sin") && r.d.getElementById("cid-sin").value === "Desert", txt(r.d.getElementById("cid-status")));

  const s = tab({ rls: true });
  s.M.activate(s.root); await settle();
  s.d.querySelector('[data-short-edit="Butte College"]').click(); await settle();
  box = s.d.getElementById("cid-sin"); box.value = "Butte Glenn"; box.dispatchEvent(new s.w.Event("input"));
  s.d.querySelector('[data-short-save="Butte College"]').click(); await settle();
  check("(6) a write RLS filters asks for a reviewer link", /sign in with a reviewer link to edit a short name\. Nothing changed\./.test(txt(s.d.getElementById("cid-status"))));
  const n = patches(s).length;
  box = s.d.getElementById("cid-sin"); box.value = "   "; box.dispatchEvent(new s.w.Event("input"));
  s.d.querySelector('[data-short-save="Butte College"]').click(); await settle();
  check("(6) an empty box saves nothing and says the short stays", patches(s).length === n && /A short name cannot be empty; Butte stays\./.test(txt(s.d.getElementById("cid-status"))));
  s.d.getElementById("cid-sin").dispatchEvent(new s.w.KeyboardEvent("keydown", { key: "Escape" })); await settle();
  check("(7) Escape cancels and focus returns to Edit", !s.d.getElementById("cid-sin") && s.d.activeElement === s.d.querySelector('[data-short-edit="Butte College"]'));
  const css = txt(t.d.getElementById("cid-css"));
  const added = css.slice(css.indexOf(".cid-w {"), css.indexOf(".cid-search {"));
  check("(7) the editor's CSS uses tokens, no raw hex", added.length > 0 && !/#[0-9a-fA-F]{3,6}\b/.test(added), added.slice(0, 200));

  let pass = 0;
  results.forEach(([nm, okk, why]) => { console.log((okk ? "PASS " : "FAIL ") + nm + (okk || !why ? "" : "\n     " + why)); if (okk) pass++; });
  console.log("\n" + pass + "/" + results.length + " passed");
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
