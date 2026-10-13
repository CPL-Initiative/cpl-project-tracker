// Refresh summaries on the Activities tab (activity_summaries.js) — jsdom.
//
// Sam, 2026-10-12: generate the four activity-level updates from a Refresh control;
// the generated summaries are drafts he approves before they post. Measured
// 2026-10-13: two activity-level updates ever against 39 at the sub-activity level.
// What this pins:
//   (a) a sub-activity belongs to the Activity its home field names (not its id
//       prefix), and a tabled one stays out;
//   (b) each header says how current its summary is, for every reader;
//   (c) the prompt carries the sub-activities, their newest updates (three each),
//       the naming rule, and no invented-figure licence;
//   (d) the team phrase alone sees no Refresh control; a signed-in reviewer does;
//   (e) Refresh drafts one summary per Activity and posts NOTHING by itself;
//   (f) Post writes item_updates activity:N, author the reviewer, the sources and
//       the edit flag in raw, then tells the cards to repaint;
//   (g) Skip posts nothing; a failed draft leaves the field open to write and post;
//   (h) the activity headers lose their Update link, and both HTMLs load the file.
//
// Run from repo root: `npm test` (or `node tests/activity_summaries.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const SRC = fs.readFileSync("activity_summaries.js", "utf8");
const api = require("../activity_summaries.js");

const DATA = {
  updates: [
    { id: 11, item_type: "activity", item_id: "3", body: "June summary.", author: "a@x.edu", created_at: "2026-06-29T10:00:00Z" },
    { id: 21, item_type: "project", item_id: "3.1", body: "Mapped 40 exhibits.", author: "b@x.edu", created_at: "2026-07-02T10:00:00Z" },
    { id: 22, item_type: "project", item_id: "3.1", body: "Second.", author: "b@x.edu", created_at: "2026-07-03T10:00:00Z" },
    { id: 23, item_type: "project", item_id: "3.1", body: "Third.", author: "b@x.edu", created_at: "2026-07-04T10:00:00Z" },
    { id: 24, item_type: "project", item_id: "3.1", body: "Fourth, newest.", author: "b@x.edu", created_at: "2026-07-05T10:00:00Z" },
    { id: 25, item_type: "project", item_id: "3.3", body: "Before the summary.", author: "c@x.edu", created_at: "2026-06-01T10:00:00Z" },
    { id: 26, item_type: "project", item_id: "1.1.2", body: "Moved work, home 4.", author: "d@x.edu", created_at: "2026-09-15T10:00:00Z" },
    { id: 27, item_type: "project", item_id: "3.9", body: "Tabled row's update.", author: "e@x.edu", created_at: "2026-09-20T10:00:00Z" }
  ],
  projects: [
    { id: "3.1", name: "Exhibit mapping", workplan_activity: "Activity 3: Scale CPL Access", status: "In Progress", percent_complete: 40, kpi_unit: "exhibits" },
    { id: "3.3", name: "Faculty review", workplan_activity: "Activity 3: Scale CPL Access", status: "Not Started", percent_complete: 0 },
    { id: "3.4", name: "Procedures", workplan_activity: "Activity 3: Scale CPL Access", status: "Not Started", latest_update: "Kickoff set.", update_date: "2026-05-01" },
    { id: "3.9", name: "Futuro", workplan_activity: "Activity 3: Scale CPL Access", status: "Not Started" },
    { id: "1.1.2", name: "AI Apprenticeship CPL Tools", workplan_activity: "Activity 4: Coordinate CPL Sprints", status: "In Progress" }
  ],
  goals: [
    { activity_id: "3", kind: "activity", row_type: "GOAL", name: "Scale CPL Access, Awards, and Procedures" },
    { activity_id: "3.1", kind: "project", row_type: "GOAL", yr_2025_26: 120, current: 48 }
  ],
  lifecycle: [{ project_id: "3.9", state: "tabled" }]
};

// (a)
const g3 = api.gather("3", DATA);
check("(a) Activity 3 gathers 3.1, 3.3 and 3.4 by their home field", g3.subs.map(p => p.id).join() === "3.1,3.3,3.4");
check("(a) the tabled 3.9 stays out, and its update with it", !g3.subUpdates.some(u => u.item_id === "3.9"));
const g4 = api.gather("4", DATA);
check("(a) 1.1.2 counts under Activity 4, its home, not Activity 1", g4.subs.map(p => p.id).join() === "1.1.2"
  && api.gather("1", DATA).subs.length === 0);
check("(a) the Activity's newest summary is found", g3.summary && g3.summary.id === 11);
check("(a) only sub-activity updates after the summary count as since", g3.since === 4);

// (b)
check("(b) a posted summary reads its date and what came since",
  api.freshnessText(g3) === "Summary posted Jun 29, 2026 · 4 sub-activity updates since");
check("(b) no summary reads as such, with what there is to draw on",
  api.freshnessText(g4) === "No summary posted yet · 1 sub-activity update to draw on");

// (c)
const built = api.buildPrompt(g3);
check("(c) the prompt names each sub-activity with its status, percent, goal and current",
  /- 3\.1 Exhibit mapping: status In Progress; 40% complete; 2025-26 goal 120, current 48 \(exhibits\)/.test(built.prompt));
check("(c) three updates per sub-activity, newest first",
  built.prompt.indexOf("Fourth, newest.") > 0 && built.prompt.indexOf("Fourth, newest.") < built.prompt.indexOf("Third.")
    && built.prompt.indexOf("Mapped 40 exhibits.") < 0);
check("(c) a sub-activity with no live update falls back to its creation-era update",
  built.prompt.indexOf("Kickoff set.") > 0);
check("(c) the previous summary is in the prompt", built.prompt.indexOf("June summary.") > 0);
check("(c) the naming rule and the no-invention instruction ride along",
  /CPL Initiative/.test(built.prompt) && /never expand MAP as "Military Articulation Platform"/.test(built.prompt)
    && /invent no figure, date or name/.test(built.prompt));
check("(c) the rows drawn on are listed for raw",
  built.used.item_updates.join() === "24,23,22,25" && built.used.projects.join() === "3.1,3.3,3.4");

// DOM harness: the Activities pane with headers for Activities 3 and 4.
function header(n, name) {
  return '<div class="activity-group"><div class="activity-group-header"><h3>' + n + ': ' + name + '</h3>' +
    '<span><a href="#raci" class="act-raci-link" data-raci-key="activity:' + n + '">RACI</a></span></div>' +
    '<div class="cpl-live-update" data-update-key="activity:' + n + '"></div></div>';
}
function makeDom(opts) {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="tab-activities-projects"><div id="activityKpiSection">' +
      header(3, "Scale CPL Access") + header(4, "Coordinate CPL Sprints") + "</div></div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (opts.reviewer) w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  if (opts.phrase) w.localStorage.setItem("cpl_team_pass", "phrase");
  w.CPL_REPORT_PROXY_URL = "https://proxy.example/";
  dom._calls = []; dom._events = [];
  w.addEventListener("cpl-item-updated", e => dom._events.push(e.detail));
  w.fetch = function (url, o) {
    url = String(url); o = o || {};
    dom._calls.push({ url, opts: o });
    const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) });
    if (url.indexOf("proxy.example") >= 0) {
      if (opts.proxyFails) return Promise.resolve({ ok: false, status: 502, text: () => Promise.resolve("bad gateway") });
      const act = /Activity (\d+)/.exec(JSON.parse(o.body).messages[0].content)[1];
      return ok({ content: [{ text: "Draft for Activity " + act + "." }] });
    }
    if (o.method === "POST" && url.indexOf("/rest/v1/item_updates") >= 0) return ok([Object.assign({ id: 99 }, JSON.parse(o.body))]);
    if (url.indexOf("item_updates?") >= 0) return ok(DATA.updates);
    if (url.indexOf("projects?") >= 0) return ok(DATA.projects);
    if (url.indexOf("workplan_goals?") >= 0) return ok(DATA.goals);
    if (url.indexOf("project_lifecycle?") >= 0) return ok(DATA.lifecycle);
    return ok([]);
  };
  w.eval(SRC);
  return dom;
}
const tick = () => new Promise(r => setTimeout(r, 0));
async function settle(n) { for (let i = 0; i < (n || 12); i++) await tick(); }
const posts = dom => dom._calls.filter(c => c.opts.method === "POST" && c.url.indexOf("item_updates") >= 0);

(async () => {
  // (b) + (d): a reader sees the lines, not the control.
  let dom = makeDom({});
  await settle();
  let doc = dom.window.document;
  const lines = Array.from(doc.querySelectorAll(".as-fresh")).map(n => n.textContent);
  check("(b) every activity header carries its freshness line, for a reader too",
    lines.length === 2 && lines[0] === "Summary posted Jun 29, 2026 · 4 sub-activity updates since");
  check("(b) the line sits right under its header",
    doc.querySelector(".activity-group-header").nextElementSibling.className === "as-fresh");
  check("(d) a reader gets no Refresh control", !doc.querySelector(".as-refresh"));

  dom = makeDom({ phrase: true });
  await settle();
  check("(d) the team phrase alone gets no Refresh control", !dom.window.document.querySelector(".as-refresh"));

  // (e) + (f)
  dom = makeDom({ reviewer: true });
  await settle();
  doc = dom.window.document;
  const btn = doc.querySelector(".as-refresh");
  check("(d) a signed-in reviewer gets Refresh summaries, a button with a word",
    btn && btn.tagName === "BUTTON" && btn.textContent === "Refresh summaries");
  btn.click();
  await settle(30);
  const cards = doc.querySelectorAll(".as-card");
  const proxyCalls = dom._calls.filter(c => c.url.indexOf("proxy.example") >= 0);
  check("(e) one draft per Activity", cards.length === 2 && proxyCalls.length === 2);
  check("(e) each draft is in a labelled, editable field",
    doc.getElementById("as-text-3").value === "Draft for Activity 3."
      && doc.querySelector('label[for="as-text-3"]').textContent === "Summary for Activity 3"
      && !doc.getElementById("as-text-3").readOnly);
  check("(e) the panel is a labelled region", doc.querySelector(".as-panel").getAttribute("aria-labelledby") === "as-panel-title");
  check("(e) drafting posted nothing", posts(dom).length === 0);
  check("(e) the sources line names what the draft drew on",
    /Drawn from 4 updates on 3 sub-activities, and the summary posted Jun 29, 2026\./.test(cards[0].querySelector(".as-sources").textContent));

  doc.getElementById("as-text-3").value = "Edited summary for Activity 3.";
  cards[0].querySelector(".as-post").click();
  await settle(20);
  const p = posts(dom);
  check("(f) Post writes one row to the literal item_updates URL",
    p.length === 1 && p[0].url === "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/item_updates");
  const row = p.length ? JSON.parse(p[0].opts.body) : {};
  check("(f) the row is activity:3 with the reviewer's edited text and email",
    row.item_type === "activity" && row.item_id === "3" && row.body === "Edited summary for Activity 3."
      && row.author === "map@rccd.edu");
  check("(f) it posts with the reviewer's token, not the anon key",
    p.length && p[0].opts.headers.Authorization === "Bearer aaaa.bbbb.cccc");
  const raw = JSON.parse(row.raw || "{}");
  check("(f) raw names the drafter, the approver, the edit and the sources",
    raw.generated_by === "activity_summaries.js" && raw.approved_by === "map@rccd.edu" && raw.edited === true
      && raw.draft === "Draft for Activity 3." && raw.sources.item_updates.join() === "24,23,22,25");
  check("(f) the cards are told to repaint", dom._events.some(d => d && d.key === "activity:3"));
  check("(f) the posted card reads Posted and closes", cards[0].getAttribute("data-state") === "posted"
    && cards[0].querySelector(".as-post").disabled);

  // (g) Skip
  cards[1].querySelector(".as-skip").click();
  await settle();
  check("(g) Skip posts nothing more", posts(dom).length === 1 && cards[1].getAttribute("data-state") === "skipped");

  // (g) a failed draft: write one by hand and post it.
  dom = makeDom({ reviewer: true, proxyFails: true });
  await settle();
  doc = dom.window.document;
  doc.querySelector(".as-refresh").click();
  await settle(30);
  const c3 = doc.querySelector('.as-card[data-act="3"]');
  check("(g) a failed draft says so and leaves Post open", c3.getAttribute("data-state") === "failed"
    && !c3.querySelector(".as-post").disabled && /No draft/.test(c3.querySelector(".as-status").textContent));
  c3.querySelector(".as-post").click();
  await settle();
  check("(g) an empty field never posts", posts(dom).length === 0);
  doc.getElementById("as-text-3").value = "Written by hand.";
  c3.querySelector(".as-post").click();
  await settle(20);
  const hp = posts(dom);
  check("(g) a hand-written summary posts, marked edited", hp.length === 1 && JSON.parse(JSON.parse(hp[0].opts.body).raw).edited === true);

  // (h)
  const gen = fs.readFileSync("excel_to_dashboard.py", "utf8");
  check("(h) the generator's activity header has no Update link", gen.indexOf('class="act-update-link"') < 0);
  ["CPL_Dashboard.html", "index.html"].forEach(f => {
    check("(h) " + f + " loads activity_summaries.js once",
      fs.readFileSync(f, "utf8").split('<script src="activity_summaries.js"></script>').length === 2);
  });
  check("(h) the injected CSS uses tokens, no raw hex", !/#[0-9A-Fa-f]{3,6}\b/.test(SRC.replace(/\/\/.*$/gm, "")));
  check("(h) every control is 24px tall", /\.as-btn \{[^}]*min-height:24px/.test(SRC));

  let pass = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (ok) pass++; });
  console.log("\n" + pass + "/" + results.length + " checks passed");
  process.exit(pass === results.length ? 0 : 1);
})();
