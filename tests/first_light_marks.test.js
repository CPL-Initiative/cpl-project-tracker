// The First Light tab, phase B: marks and Apply (first_light_tab.js, #first-light; S643, #3153).
//
// Design ruled on #3153 (comments 6826461825 and 6829695812): a signed-in reviewer marks a painting or photo
// keep, drop, add or a position; each mark is one insert into first_light_marks (insert only, latest mark per item
// wins on read); Apply files one row in first_light_apply_requests, which first-light-apply.yml turns into ONE pull
// request that Sam merges.
//
// Guards the FAILURE MODES:
//   (a) ⭐ the resolver: the latest keep/drop/add decides membership, the latest position decides place, added items
//       follow in mark order, a take-back (drop after add) removes an add, and marks that match what is live are no
//       change at all (so Apply is not offered);
//   (b) ⭐ the resolver is one copy: require() of the tab file returns it in node with no window, which is how the
//       Apply workflow's script reads it;
//   (c) a painting's key is its Commons file, read back from the manifest's own URL for every painting; a story
//       photo's key is stories/<the image's own name>;
//   (d) the tables absent (404): the tab says so in words and offers no control;
//   (e) ⭐ a mark is an insert to first_light_marks under the reviewer's own token, carrying no who or when (the
//       trigger stamps them), and the card and the Apply panel then show it;
//   (f) a Move needs a number in range, and files a position;
//   (g) ⭐ Apply files one empty request; a second while one waits is refused (409) and said in words;
//   (h) the candidates: shown on request, the live ones left out, the filter lasts the visit, Add files an add;
//   (i) photos: Drop on a hero photo; a My CPL Story photo is added under its stories/ key and the page says the
//       name stays as MAP printed it and Drop takes it down;
//   (j) Sierra stays held (Sam: "no images on sierra for now"): no marks there;
//   (k) ⭐ the migration: insert only, reviewer-only RLS (never plain authenticated), no anon grant, functions closed
//       to public, anon and authenticated after an explicit service_role grant, one pending request, and it is NOT
//       named in kb/migrations/.apply (the conductor moves it);
//   (l) the new write surface is mapped in kb/governance_surface_map.json with a reason that names the disclosure
//       check, and the admin surface credits the tab with exactly these two writes;
//   (m) presentation: every control an underlined word in a <button>, no glyph, no disabled button.
//
// Run from repo root: `node tests/first_light_marks.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const tick = () => new Promise((r) => setTimeout(r, 0));
const settle = async () => { for (let i = 0; i < 8; i++) await tick(); };

const SESSION = fs.readFileSync("cpl_session.js", "utf8");
const FL = fs.readFileSync("first_light.js", "utf8");
const TAB = fs.readFileSync("first_light_tab.js", "utf8");
const HERO = JSON.parse(fs.readFileSync("library/photos/hero_photos.json", "utf8"));
const SIERRA = JSON.parse(fs.readFileSync("sierra/art/manifest.json", "utf8"));
const SEL = JSON.parse(fs.readFileSync("tools/first_light_selection.json", "utf8"));
const GALLERY = JSON.parse(fs.readFileSync("tools/first_light_gallery/index.json", "utf8"));
const STORIES_JS = fs.readFileSync("fact-sheet/cpl_stories.js", "utf8");
const TOKEN = "aaaaaaaaaa.bbbbbbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc";
const MARKS_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/first_light_marks";
const REQ_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/first_light_apply_requests";

function boot(opts) {
  opts = opts || {};
  const dom = new JSDOM('<!doctype html><html><head></head><body><div class="header"></div>' +
    '<div class="cpl-tab-pane" data-tab="first-light"><div id="first-light-root">Loading</div></div></body></html>',
    { url: "https://example.org/index.html" + (opts.hash || ""), runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  w.localStorage.setItem("cplFirstLight.seen.v1", new Date().toDateString());
  w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: TOKEN, email: "r@example.org", exp: Date.now() + 3600e3 }));
  const db = { marks: (opts.marks || []).slice(), reqs: (opts.reqs || []).slice(), posts: [], absent: !!opts.absent, nextId: 100 };
  const resp = (status, body, text) => Promise.resolve({ ok: status >= 200 && status < 300, status,
    json: () => Promise.resolve(JSON.parse(JSON.stringify(body))), text: () => Promise.resolve(text != null ? text : JSON.stringify(body)) });
  w.fetch = (url, init) => {
    url = String(url); init = init || {};
    if (url.indexOf("library/photos/hero_photos.json") === 0) return resp(200, HERO);
    if (url.indexOf("sierra/art/manifest.json") === 0) return resp(200, SIERRA);
    if (url.indexOf("fact-sheet/cpl_stories.js") === 0) return resp(200, null, STORIES_JS);
    if (url.indexOf("tools/first_light_gallery/index.json") !== -1) return resp(200, GALLERY);
    if (url.indexOf(MARKS_URL) === 0 || url.indexOf(REQ_URL) === 0) {
      if (db.absent) return resp(404, { code: "PGRST205" });
      const isReq = url.indexOf(REQ_URL) === 0;
      if ((init.method || "GET") === "POST") {
        const body = JSON.parse(init.body || "{}");
        db.posts.push({ url, body, headers: init.headers || {} });
        if (isReq) {
          if (db.reqs.some((r) => r.status === "pending")) return resp(409, { code: "23505" });
          const row = { id: ++db.nextId, status: "pending", requested_by: "r@example.org", requested_at: new Date().toISOString() };
          db.reqs.unshift(row);
          return resp(201, [row]);
        }
        const row = Object.assign({ id: ++db.nextId, marked_by: "r@example.org", marked_at: new Date().toISOString() }, body);
        db.marks.push(row);
        return resp(201, [row]);
      }
      return resp(200, isReq ? db.reqs : db.marks);
    }
    return resp(404, null);
  };
  let current = null;
  w.CPL_TABS = { current: () => current };
  w.CPL_REVIEWER_SIGNIN = { mountInto: (host) => { host.innerHTML = "<form data-signin></form>"; } };
  w.eval(SESSION);
  w.eval(FL);
  w.CPL_FIRST_LIGHT.init();
  w.eval(TAB);
  w.go = (tab) => { current = tab; w.dispatchEvent(new w.CustomEvent("cpl-tab-activated", { detail: { tab } })); };
  w.db = db;
  return w;
}
const $ = (w, sel) => w.document.querySelector(sel);
const $$ = (w, sel) => Array.prototype.slice.call(w.document.querySelectorAll(sel));
const click = (w, el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));
const text = (w) => $(w, "#first-light-root").textContent;

(async function main() {
  // ── (a), (b) the resolver, from node ─────────────────────────────────────
  const M = require(path.resolve("first_light_tab.js"));
  check("(b) ⭐ require() of the tab file returns the resolver with no window (the Apply script's one copy)",
    M && typeof M.resolveSet === "function" && typeof M.storyFile === "function" && M.NEEDS_WORDS === "__needs_words__");
  const base = ["a", "b", "c", "d"];
  const mk = (id, key, mark, position) => ({ id, item_key: key, mark, position: position == null ? null : position });
  let r = M.resolveSet(base, []);
  check("(a) no marks: the live list, no change", JSON.stringify(r.list) === JSON.stringify(base) && !r.changed && !r.added.length && !r.dropped.length);
  r = M.resolveSet(base, [mk(1, "b", "drop"), mk(2, "b", "keep"), mk(3, "c", "keep")]);
  check("(a) ⭐ marks that match what is live are no change (drop then keep)", !r.changed && JSON.stringify(r.list) === JSON.stringify(base));
  r = M.resolveSet(base, [mk(5, "b", "keep"), mk(6, "b", "drop")]);
  check("(a) ⭐ the latest mark wins, by id, whatever order the rows arrive in", JSON.stringify(M.resolveSet(base, [mk(6, "b", "drop"), mk(5, "b", "keep")]).list) === JSON.stringify(r.list) && r.list.indexOf("b") === -1 && r.dropped[0] === "b");
  r = M.resolveSet(base, [mk(9, "y", "add"), mk(7, "x", "add")]);
  check("(a) added items follow the live list, oldest mark first", JSON.stringify(r.list) === JSON.stringify(["a", "b", "c", "d", "x", "y"]) && JSON.stringify(r.added) === '["x","y"]');
  r = M.resolveSet(base, [mk(1, "x", "add"), mk(2, "x", "drop")]);
  check("(a) a take-back (drop after add) leaves no add", !r.changed && r.added.length === 0);
  r = M.resolveSet(base, [mk(1, "d", "position", 1), mk(2, "x", "add"), mk(3, "x", "position", 2)]);
  check("(a) ⭐ a position places the item at its number", JSON.stringify(r.list) === JSON.stringify(["d", "x", "a", "b", "c"]) && r.moved.indexOf("d") !== -1, JSON.stringify(r.list));
  r = M.resolveSet(base, [mk(1, "a", "position", 3), mk(2, "a", "position", 1)]);
  check("(a) the latest position wins", !r.changed);
  r = M.resolveSet(base, [mk(1, "c", "position", 1), mk(2, "c", "drop")]);
  check("(a) a dropped item's position is ignored", JSON.stringify(r.list) === '["a","b","d"]');
  r = M.resolveSet(base, [mk(1, "a", "position", 99)]);
  check("(a) a number past the end places the item last", r.list[r.list.length - 1] === "a" && r.list.length === 4);

  // ── (c) keys ─────────────────────────────────────────────────────────────
  const imgs = [...FL.matchAll(/img: "([^"]+)"/g)].map((x) => x[1]);
  check("(c) ⭐ every painting's key read from the manifest URL is its selection file",
    imgs.length === SEL.length && imgs.every((u, i) => M.fileOfImg(u) === SEL[i].file));
  check("(c) a story photo's key is stories/<its own name>",
    M.storyFile({ img: "https://staging2.map.rccd.edu/wp-content/uploads/2026/07/Brody_withBG.png" }) === "stories/brody_withbg.png" &&
    M.storyFile({ img: "https://x/a b.JPEG?ver=2" }) === "stories/a-b.jpeg" && M.storyFile({ img: "https://x/no-ext" }) === "");

  // ── (d) the tables absent ────────────────────────────────────────────────
  {
    const w = boot({ hash: "#first-light/paintings", absent: true });
    w.go("first-light"); await settle();
    check("(d) the tables absent: the tab says so and names the migration", !!$(w, "[data-marks-absent]") && text(w).indexOf("kb/migrations/2026-11-12_first_light_marks.sql") !== -1);
    check("(d) ⭐ the tables absent: no mark control and no Apply", !$(w, "button[data-act]"));
    check("(d) the rotation still draws", $$(w, '[data-grid="paintings"] .flt-card').length === w.CPL_FIRST_LIGHT.paintings.length);
  }

  // ── (e), (f), (g) marking a painting and Apply ───────────────────────────
  {
    const w = boot({ hash: "#first-light/paintings" });
    w.go("first-light"); await settle();
    const F = w.CPL_FIRST_LIGHT, n = F.paintings.length;
    const cards = $$(w, '[data-grid="paintings"] .flt-card');
    check("(e) every painting card offers Drop and Move", cards.length === n && cards.every((c) => c.querySelector('button[data-act="drop"]') && c.querySelector('button[data-act="move"]')));
    check("(e) with no marks, nothing to apply", text(w).indexOf("Nothing to apply: the marks match what is live.") !== -1 && !$(w, 'button[data-act="apply"]'));
    const card2 = cards[2], key2 = M.fileOfImg(F.paintings[2].img);
    click(w, card2.querySelector('button[data-act="drop"]')); await settle();
    const p = w.db.posts[0];
    check("(e) ⭐ Drop is one insert to first_light_marks", w.db.posts.length === 1 && p.url === MARKS_URL &&
      JSON.stringify(p.body) === JSON.stringify({ item_set: "paintings", item_key: key2, collection: "rotation", mark: "drop" }), JSON.stringify(p && p.body));
    check("(e) ⭐ under the reviewer's own token, with no who or when from the client",
      p.headers.Authorization === "Bearer " + TOKEN && !("marked_by" in p.body) && !("marked_at" in p.body));
    const c2 = $(w, '[data-grid="paintings"] .flt-card[data-painting="2"]');
    check("(e) the card then offers Keep and says who marked it", c2.querySelector('button[data-act="keep"]') && /Marked drop by r@example\.org/.test(c2.textContent));
    check("(e) the Apply panel lists the drop by title", $$(w, '[data-changes="paintings"] li').some((li) => li.textContent === "Drop " + F.paintings[2].title));
    check("(e) the status line says it saved", /^Saved: drop, /.test($(w, "#flt-msg").textContent));

    // (f) Move
    const c5 = $(w, '[data-grid="paintings"] .flt-card[data-painting="5"]');
    c5.querySelector("input[data-move-for]").value = String(n + 5);
    click(w, c5.querySelector('button[data-act="move"]')); await settle();
    check("(f) a number out of range files nothing and says the range", w.db.posts.length === 1 && $(w, "#flt-msg").textContent === "Give a number from 1 to " + n + " to move it.");
    const c5b = $(w, '[data-grid="paintings"] .flt-card[data-painting="5"]');
    c5b.querySelector("input[data-move-for]").value = "1";
    click(w, c5b.querySelector('button[data-act="move"]')); await settle();
    const p2 = w.db.posts[1];
    check("(f) ⭐ Move files a position", p2 && p2.body.mark === "position" && p2.body.position === 1 && p2.body.item_key === M.fileOfImg(F.paintings[5].img));
    check("(f) the panel lists the move to its number", $$(w, '[data-changes="paintings"] li').some((li) => li.textContent === "Move " + F.paintings[5].title + " to number 1"));
    check("(e) every move field has a label", $$(w, "input[data-move-for]").every((i) => !!$(w, 'label[for="' + i.id + '"]')));

    // (g) Apply
    const ap = $(w, 'button[data-act="apply"]');
    check("(g) with changes, Apply is offered as a word", ap && ap.textContent === "Apply" && ap.classList.contains("flt-word"));
    click(w, ap); await settle();
    const p3 = w.db.posts[2];
    check("(g) ⭐ Apply files one empty request", p3 && p3.url === REQ_URL && JSON.stringify(p3.body) === "{}");
    check("(g) the panel then says it waits", !!$(w, '[data-req="pending"]') && !$(w, 'button[data-act="apply"]') && /next hourly run/.test($(w, "#flt-msg").textContent));
  }
  {
    // A second Apply while one waits: the table refuses (one pending, a unique index) and the tab says so.
    const w = boot({ hash: "#first-light/paintings", marks: [{ id: 1, item_set: "paintings", item_key: SEL[0].file, mark: "drop", collection: "rotation" }] });
    w.go("first-light"); await settle();
    w.db.reqs.unshift({ id: 9, status: "pending" });   // filed elsewhere after this tab read the requests
    click(w, $(w, 'button[data-act="apply"]')); await settle();
    check("(g) ⭐ a second Apply while one waits is refused and said in words", $(w, "#flt-msg").textContent === "An Apply is already waiting; it will carry these marks too.");
    const w2 = boot({ hash: "#first-light/paintings", marks: [{ id: 1, item_set: "paintings", item_key: SEL[0].file, mark: "drop", collection: "rotation" }],
      reqs: [{ id: 3, status: "opened", pr_number: 4001, pr_url: "https://github.com/CPL-Initiative/cpl-project-tracker/pull/4001", requested_at: "2026-11-12T20:00:00Z" }] });
    w2.go("first-light"); await settle();
    const a = $(w2, '[data-req="opened"] a');
    check("(g) the last Apply's pull request is a link", a && a.getAttribute("href") === "https://github.com/CPL-Initiative/cpl-project-tracker/pull/4001" && /#4001/.test(a.textContent));
  }

  // ── (h) the candidates ───────────────────────────────────────────────────
  {
    const w = boot({ hash: "#first-light/paintings" });
    w.go("first-light"); await settle();
    check("(h) the candidates wait to be asked for", !$(w, '[data-grid="candidates"]') && !!$(w, 'button[data-act="show-cand"]'));
    click(w, $(w, 'button[data-act="show-cand"]')); await settle();
    const live = new Set(SEL.map((s) => s.file));
    const cc = $$(w, '[data-grid="candidates"] .flt-card');
    check("(h) the candidates show, none of them live, 24 at most", cc.length === 24 && cc.every((c) => !live.has(c.getAttribute("data-cand"))));
    const want = GALLERY.paintings.filter((p) => !p.in_first_light && !live.has(p.file)).length;
    check("(h) the count is the gallery's candidates", $(w, "#flt-cshown").textContent === "Showing 24 of " + want + " candidates.");
    const cq = $(w, "#flt-cq"), artist = "Redmond";
    cq.value = artist; cq.dispatchEvent(new w.Event("input"));
    const f = $$(w, '[data-grid="candidates"] .flt-card');
    check("(h) the filter narrows the candidates", f.length > 0 && f.every((c) => /Redmond/i.test(c.textContent)));
    const key = f[0].getAttribute("data-cand");
    click(w, f[0].querySelector('button[data-act="add"]')); await settle();
    const p = w.db.posts[0];
    check("(h) ⭐ Add files an add from the gallery's candidates", p && JSON.stringify(p.body) === JSON.stringify({ item_set: "paintings", item_key: key, collection: "gallery_candidates", mark: "add" }));
    check("(h) the added candidate then offers Take back", !!$(w, '[data-cand="' + key.replace(/"/g, '\\"') + '"] button[data-act="takeback"]'));
    check("(h) the panel lists the add", $$(w, '[data-changes="paintings"] li').some((li) => li.textContent.indexOf("Add ") === 0));
    check("(h) the page says an added painting waits for its words", /marked as wanting words, and stays out of the rotation/.test(text(w)));
    w.go("dashboard"); w.go("first-light"); await settle();
    check("(h) a new visit hides the candidates and clears their filter", !$(w, '[data-grid="candidates"]') && w.CPL_FIRST_LIGHT_TAB._state.cq === "");
  }

  // ── (i) photos and My CPL Story ──────────────────────────────────────────
  {
    const w = boot({ hash: "#first-light/photos" });
    w.go("first-light"); await settle();
    const cards = $$(w, '[data-grid="photos"] .flt-card');
    check("(i) every hero photo offers Drop and Move", cards.length === HERO.photos.length && cards.every((c) => c.querySelector('button[data-act="drop"]') && c.querySelector('button[data-act="move"]')));
    click(w, cards[1].querySelector('button[data-act="drop"]')); await settle();
    check("(i) Drop on a hero photo files a drop from the hero list",
      JSON.stringify(w.db.posts[0].body) === JSON.stringify({ item_set: "photos", item_key: HERO.photos[1].file, collection: "hero_photos", mark: "drop" }));
    check("(i) the page says the name stays as MAP printed it and Drop takes a story photo down",
      /the name exactly as MAP printed it, and nothing beyond what MAP published/.test(text(w)) && /Drop takes a story photo down: the next Apply removes it from every view/.test(text(w)));
    click(w, $(w, 'button[data-act="show-stories"]')); await settle();
    const sc = $$(w, '[data-grid="stories"] .flt-card');
    const stories = JSON.parse(STORIES_JS.slice(STORIES_JS.indexOf("{"), STORIES_JS.lastIndexOf("}") + 1)).stories;
    check("(i) the stories show with the name exactly as MAP printed it", sc.length > 0 && sc.every((c) => stories.some((s) => M.storyFile(s) === c.getAttribute("data-story") && c.querySelector("h3").textContent === s.name)));
    const sk = sc[0].getAttribute("data-story");
    click(w, sc[0].querySelector('button[data-act="add"]')); await settle();
    check("(i) ⭐ Add files a My CPL Story photo under its stories/ key",
      JSON.stringify(w.db.posts[1].body) === JSON.stringify({ item_set: "photos", item_key: sk, collection: "my_cpl_story", mark: "add" }) && sk.indexOf("stories/") === 0);
    check("(i) the panel names the story", $$(w, '[data-changes="photos"] li').some((li) => / \(My CPL Story\)$/.test(li.textContent)));
    check("(i) another collection is a stub sentence, with no control", /Another collection/.test(text(w)) && !$(w, 'button[data-act="show-folder"]'));
  }

  // ── (j) Sierra stays held ────────────────────────────────────────────────
  {
    const w = boot({ hash: "#first-light/sierra" });
    w.go("first-light"); await settle();
    check("(j) ⭐ the Sierra view takes no marks", $$(w, '[data-grid="sierra"] .flt-card').length === SIERRA.paintings.length && !$(w, "button[data-act]") && /takes no marks/.test(text(w)));
    check("(j) the Sierra view reads no marks", !w.db.posts.length);
  }

  // ── (k) the migration ────────────────────────────────────────────────────
  {
    const SQL = fs.readFileSync("kb/migrations/2026-11-12_first_light_marks.sql", "utf8");
    const code = SQL.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
    const ROLL = fs.readFileSync("kb/migrations/2026-11-12_first_light_marks_rollback.sql", "utf8");
    const APPLY = fs.readFileSync("kb/migrations/.apply", "utf8");
    check("(k) ⭐ the migration is not named in kb/migrations/.apply (the conductor moves it)", APPLY.indexOf("first_light_marks") === -1);
    check("(k) the rollback drops both tables and both functions", /drop table if exists public\.first_light_marks;/.test(ROLL) && /drop table if exists public\.first_light_apply_requests;/.test(ROLL) &&
      /drop function if exists public\.first_light_marks_stamp\(\)/.test(ROLL) && /drop function if exists public\.first_light_apply_requests_stamp\(\)/.test(ROLL));
    const policies = code.match(/create policy[\s\S]*?;/g) || [];
    check("(k) ⭐ four policies, each a select or insert for authenticated under is_allowed_reviewer()", policies.length === 4 &&
      policies.every((p) => /for (select|insert)\s+to authenticated (using|with check) \(public\.is_allowed_reviewer\(\)\)/.test(p.replace(/\s+/g, " "))), policies.join(" | "));
    check("(k) ⭐ no update or delete policy, and no policy of true", !/for (update|delete|all)\b/i.test(code) && !/using \(true\)|with check \(true\)/i.test(code));
    const grants = (code.match(/^grant [^;]+;/gm) || []).map((g) => g.replace(/\s+/g, " "));
    check("(k) ⭐ clients get select and insert only, and never anon",
      grants.filter((g) => / to (anon|authenticated)\b/.test(g) && / on public\.first_light_/.test(g)).every((g) => /^grant select, insert on public\.first_light_(marks|apply_requests) to authenticated;$/.test(g)) &&
      !grants.some((g) => /\banon\b/.test(g)), grants.join(" | "));
    check("(k) the service role reads the marks and stamps the requests",
      grants.indexOf("grant select on public.first_light_marks to service_role;") !== -1 && grants.indexOf("grant select, update on public.first_light_apply_requests to service_role;") !== -1);
    check("(k) both tables revoke all from anon and authenticated before granting", /revoke all on public\.first_light_marks from anon, authenticated;/.test(code) && /revoke all on public\.first_light_apply_requests from anon, authenticated;/.test(code));
    for (const fn of ["first_light_marks_stamp", "first_light_apply_requests_stamp"]) {
      const g = code.indexOf("grant execute on function public." + fn + "() to service_role;");
      const rv = code.indexOf("revoke execute on function public." + fn + "() from public, anon, authenticated;");
      check("(k) ⭐ " + fn + ": service_role granted first, then closed to public, anon and authenticated (Rule 10 b2)", g > 0 && rv > g);
    }
    check("(k) who and when come from the sign-in, by trigger", /new\.marked_by := coalesce\(auth\.jwt\(\) ->> 'email', current_user\)/.test(code) &&
      /new\.requested_by := coalesce\(auth\.jwt\(\) ->> 'email', current_user\)/.test(code) && /new\.status := 'pending'/.test(code) && /new\.pr_url := null/.test(code));
    check("(k) one pending request at a time", /create unique index if not exists first_light_apply_one_pending[\s\S]*?where status = 'pending'/.test(code));
    check("(k) both tables keep RLS on", /alter table public\.first_light_marks enable row level security/.test(code) && /alter table public\.first_light_apply_requests enable row level security/.test(code));
    check("(k) a position only on a position mark, and a collection that fits its set", /\(mark = 'position'\) = \(position is not null\)/.test(code) && /first_light_marks_collection_fits_set/.test(code));
    const tabColls = [...TAB.matchAll(/(?:"|, )(rotation|gallery_candidates|hero_photos|my_cpl_story)"/g)].map((x) => x[1]);
    check("(k) every collection the tab files is one the table accepts", tabColls.length >= 4 && tabColls.every((c) => new RegExp("'" + c + "'").test(code)));
  }

  // ── (l) governance and the admin surface ─────────────────────────────────
  {
    const G = JSON.parse(fs.readFileSync("kb/governance_surface_map.json", "utf8"));
    const why = (k) => (G.mapped && G.mapped[k]) || (G.dismissed && G.dismissed[k]) || "";
    check("(l) ⭐ both tables are mapped with a reason that names the disclosure check",
      ["table:first_light_marks", "table:first_light_apply_requests"].every((k) => why(k).length > 200 && /student data/.test(why(k)) && /is_allowed_reviewer/.test(why(k))));
    check("(l) the marks reason names Drop as the takedown path", /takedown/.test(why("table:first_light_marks")));
    const sw = {};
    new Function("window", fs.readFileSync("cobi_admin_surface.js", "utf8"))(sw);
    const e = sw.COBI_ADMIN_SURFACE && sw.COBI_ADMIN_SURFACE.tabs && sw.COBI_ADMIN_SURFACE.tabs["first-light"];
    check("(l) the admin surface credits the tab with exactly its two writes", e && JSON.stringify(e.writes) === '["first_light_apply_requests","first_light_marks"]', JSON.stringify(e && e.writes));
  }

  // ── (m) presentation ─────────────────────────────────────────────────────
  {
    const w = boot({ hash: "#first-light/paintings", marks: [{ id: 1, item_set: "paintings", item_key: SEL[0].file, mark: "drop", collection: "rotation" }] });
    w.go("first-light"); await settle();
    click(w, $(w, 'button[data-act="show-cand"]')); await settle();
    const btns = $$(w, "#first-light-root button");
    check("(m) every control is a <button> carrying a plain word, styled as an underlined word",
      btns.length > 100 && btns.every((b) => b.classList.contains("flt-word") && b.getAttribute("type") === "button" && /^[A-Z][a-z]+( [a-z]+)*$/.test(b.textContent)));
    check("(m) no glyph and no disabled button", !$(w, "#first-light-root button[disabled]") && !/[←-⇿✀-➿\u{1F300}-\u{1FAFF}]/u.test(text(w)));
    const css = TAB.slice(TAB.indexOf("function ensureCss"), TAB.indexOf("/* ── address"));
    check("(m) tokens only in the tab's CSS, and the word control is underlined with no border or fill",
      !/#[0-9a-fA-F]{3,6}\b/.test(css) && /\.flt-word\{[^}]*background:none;border:0;[^}]*min-height:24px;[^}]*text-decoration:underline/.test(css));
    check("(m) American spelling in the tab's words", !/\b(colour|behaviour|organis|catalogue|grey)\b/i.test(TAB.replace(/var\(--[^)]*\)/g, "")));
  }

  let pass = 0;
  for (const [n, ok, why] of results) {
    console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
    if (ok) pass++;
  }
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
