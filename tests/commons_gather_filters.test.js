// Gather's saved filters (S726): commons_gather.js reads gather_filters, saves through gather_filter_save(), retires
// through gather_filter_retire(), and opens a filter from #coci-lookup/gather?f=<slug>.
// Guards:
//   (1) the address carries f, reads it back, and drops anything that is not a slug;
//   (2) signed out, the card offers a sign-in and reads nothing;
//   (3) signed in, the team's filters are read with the reviewer's token, live rows only;
//   (4) #...?f=<slug> opens that filter: its words, look-in, subjects and target fill the view;
//   (5) Save posts the name, the note and exactly the five query fields, never who saved it, and the address takes f;
//   (6) changing a field drops f: the view no longer is that filter;
//   (7) Retire is offered only on the reviewer's own filter and posts its slug;
//   (8) the migration keeps the sign-in rule and the rollback keeps the rows; DR-36 maps all three surfaces.
// Run from repo root: `node tests/commons_gather_filters.test.js`.
const fs = require("fs");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
function txt(el) { return (el && el.textContent || "").trim().replace(/\s+/g, " "); }
const SRC = fs.readFileSync("commons_gather.js", "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COMMONS = [
  { id: "PEDS M1029", title: "Adaptive Physical Education", disc: "Physical Education Disabled Students", units: 1, members: 13 },
  { id: "PEDS M1026", title: "Adapted Weight Training", disc: "Physical Education Disabled Students", units: 1, members: 8 }
];
const FILTERS = [
  { slug: "adapted-pe", name: "Adapted PE", query: { w: "adapt -dance", look: "both", cs: "PEDS", ls: "ADAPT", to: "PEDS M1029" }, note: "Sam's adapt gather", saved_by: "me@example.org", saved_at: "2026-11-25T02:00:00Z" },
  { slug: "esl-reading", name: "ESL reading", query: { w: "reading", look: "title", cs: "ESL", ls: "", to: "" }, note: null, saved_by: "other@example.org", saved_at: "2026-11-24T02:00:00Z" }
];

function boot(sess, hash) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="m"></div></body></html>', { url: "https://example.org/" + (hash || ""), runScripts: "outside-only" });
  const w = dom.window, calls = [];
  w.fetch = function (url, opt) {
    opt = opt || {}; calls.push({ url: String(url), method: opt.method || "GET", body: opt.body ? JSON.parse(opt.body) : null, headers: opt.headers || {} });
    const u = String(url);
    let out = [];
    if (/\/gather_filters\?/.test(u)) out = FILTERS;
    else if (/\/rpc\/gather_filter_save$/.test(u)) out = { slug: "adapt-swim", saved: "added" };
    else if (/\/rpc\/gather_filter_retire$/.test(u)) out = { slug: "adapted-pe", retired: true };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(out) });
  };
  w.eval(SRC);
  const addrs = [];
  const api = w.CPL_COMMONS_GATHER.create({ tab: "coci-lookup", rest: "https://db/rest/v1", anon: "anon", hash: () => w.location.hash,
    commons: () => COMMONS.map((c) => Object.assign({}, c)), locals: () => [],
    session: () => sess, fresh: () => Promise.resolve(sess), signIn: (m) => { m.textContent = "SIGN-IN BOX"; },
    onAddress: (a) => addrs.push(a) });
  api.render(w.document.getElementById("m"));
  return { w, api, calls, addrs, doc: w.document };
}
const card = (doc) => doc.querySelector('section[aria-labelledby="cg-h0"]');
const btn = (doc, t) => Array.from(doc.querySelectorAll("button")).filter((b) => txt(b) === t)[0];
const SESS = { access_token: "tok", email: "me@example.org" };

(async () => {
  {
    const { w } = boot(null);
    const G = w.CPL_COMMONS_GATHER;
    const a = G.address("coci-lookup", { w: "adapt", look: "title", cs: "", ls: "", to: "", f: "adapted-pe" });
    check("(1) the address carries f first", a === "coci-lookup/gather?f=adapted-pe&w=adapt", a);
    check("(1) f reads back", G.readAddress("#" + a).f === "adapted-pe", JSON.stringify(G.readAddress("#" + a)));
    check("(1) a value that is not a slug is dropped", G.readAddress("#coci-lookup/gather?f=Bad%20Name%3Cx%3E").f === "", "slug only");
  }
  {
    const { doc, calls } = boot(null, "#coci-lookup/gather?f=adapted-pe");
    await sleep(5);
    check("(2) signed out, a sign-in fold", /Reviewers: sign in/.test(txt(card(doc))) && !!card(doc).querySelector("details"), txt(card(doc)));
    check("(2) signed out, the address's filter is named", /saved filter adapted-pe/.test(txt(card(doc))), txt(card(doc)));
    check("(2) signed out, nothing is read", !calls.some((c) => /gather_filters/.test(c.url)), calls.map((c) => c.url).join(" "));
  }
  {
    const { doc, calls, api } = boot(SESS, "#coci-lookup/gather?f=adapted-pe");
    await sleep(20);
    const r = calls.filter((c) => /gather_filters\?/.test(c.url))[0];
    check("(3) the filters are read once with the reviewer's token", !!r && r.headers.Authorization === "Bearer tok" && calls.filter((c) => /gather_filters\?/.test(c.url)).length === 1, r && JSON.stringify(r.headers));
    check("(3) live rows only", !!r && /retired_at=is\.null/.test(r.url), r && r.url);
    check("(3) both filters listed", /Adapted PE/.test(txt(card(doc))) && /ESL reading/.test(txt(card(doc))), txt(card(doc)));
    const S = api._state;
    check("(4) ?f= opens the filter", S.q.w === "adapt -dance" && S.q.look === "both" && S.q.cs === "PEDS" && S.q.ls === "ADAPT" && S.q.to === "PEDS M1029" && S.q.f === "adapted-pe", JSON.stringify(S.q));
    check("(4) the words field shows it", doc.getElementById("cg-w").value === "adapt -dance", doc.getElementById("cg-w").value);
    check("(4) the open filter reads as open", /Adapted PE \(open\)/.test(txt(card(doc))), txt(card(doc)));
    check("(7) Retire only on my own filter", Array.from(doc.querySelectorAll("button")).filter((b) => /^Retire/.test(txt(b))).length === 1 &&
      doc.querySelector('button[aria-label="Retire Adapted PE"]') && !doc.querySelector('button[aria-label="Retire ESL reading"]'), "one Retire");
    calls.length = 0;
    doc.querySelector('button[aria-label="Retire Adapted PE"]').click();
    await sleep(20);
    const rt = calls.filter((c) => /rpc\/gather_filter_retire/.test(c.url))[0];
    check("(7) Retire posts its slug", !!rt && rt.method === "POST" && rt.body.p_slug === "adapted-pe", rt && JSON.stringify(rt.body));
    check("(7) retiring the open filter drops f", S.q.f === "", JSON.stringify(S.q));
  }
  {
    const { doc, calls, addrs, api } = boot(SESS, "#coci-lookup/gather?w=adapt%20swim&ls=ADAPT");
    await sleep(20);
    const nm = doc.getElementById("cg-fname"); nm.value = "Adapt swim"; nm.dispatchEvent(new doc.defaultView.Event("input"));
    const nt = doc.getElementById("cg-fnote"); nt.value = "for the nightly run"; nt.dispatchEvent(new doc.defaultView.Event("input"));
    calls.length = 0;
    btn(doc, "Save this filter").click();
    await sleep(20);
    const sv = calls.filter((c) => /rpc\/gather_filter_save/.test(c.url))[0];
    const p = sv && sv.body.p;
    check("(5) Save posts once", calls.filter((c) => /rpc\/gather_filter_save/.test(c.url)).length === 1 && sv.headers.Authorization === "Bearer tok", "one post");
    check("(5) the name, note and five query fields", p && p.name === "Adapt swim" && p.note === "for the nightly run" &&
      JSON.stringify(Object.keys(p.query).sort()) === JSON.stringify(["cs", "look", "ls", "to", "w"]) && p.query.w === "adapt swim" && p.query.ls === "ADAPT", p && JSON.stringify(p));
    check("(5) never who saved it", p && !("saved_by" in p) && !/me@example\.org/.test(JSON.stringify(sv.body)), JSON.stringify(sv && sv.body));
    check("(5) the address takes f", addrs[addrs.length - 1] === "coci-lookup/gather?f=adapt-swim&w=adapt%20swim&ls=ADAPT", addrs[addrs.length - 1]);
    check("(5) the result is said with its address", /Saved as Adapt swim\. The team opens it at #coci-lookup\/gather\?f=adapt-swim/.test(txt(card(doc))), txt(card(doc)));
    const inp = doc.getElementById("cg-w"); inp.value = "adapt swim -dive"; inp.dispatchEvent(new doc.defaultView.Event("input"));
    check("(6) changing a field drops f", api._state.q.f === "" && addrs[addrs.length - 1].indexOf("f=") < 0, addrs[addrs.length - 1]);
  }
  {
    const M = fs.readFileSync("kb/migrations/2026-11-25_gather_filters.sql", "utf8"), R = fs.readFileSync("kb/migrations/2026-11-25_gather_filters_rollback.sql", "utf8");
    const G = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8")).mapped;
    check("(8) saved_by is stamped from the sign-in", /v_email text := lower\(coalesce\(auth\.jwt\(\) ->> 'email'/.test(M) && /values \(v_slug, v_name, v_q, v_note, v_email\)/.test(M), "stamp");
    check("(8) another reviewer's filter is refused", /if v_row\.saved_by <> v_email then\s+raise exception/.test(M), "no replace under another name");
    check("(8) anon is closed and checked", /revoke execute on function public\.gather_filter_save\(jsonb\) from public, anon/.test(M) && /has_function_privilege\('anon', 'public\.gather_filter_save\(jsonb\)'/.test(M), "b2");
    check("(8) no delete anywhere in the migration", !/\bdelete\s+from\b/i.test(M), "nothing deletes a row");
    check("(8) the rollback drops the table only while empty", /if not exists \(select 1 from public\.gather_filters\) then\s+drop table/.test(R), "keeps rows");
    check("(8) DR-36 maps the three surfaces", G["table:gather_filters"] === "DR-36" && G["rpc:gather_filter_save"] === "DR-36" && G["rpc:gather_filter_retire"] === "DR-36", "map");
  }

  let fail = 0;
  results.forEach(([n, ok, why]) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  <- " + why)); });
  console.log(fail ? fail + " failed" : "all " + results.length + " passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
