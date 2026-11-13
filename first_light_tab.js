/*
 * COBI — the First Light tab (window.CPL_FIRST_LIGHT_TAB), #first-light.
 *
 * Sam, 2026-11-12 (#3153, relayed by COBIx): "add a cobi tab so I can edit it", "this is where we should
 * list our photos we cycle on our cobi views as well", and "make it so I can add more photos from our my cpl
 * story series or other collections". Three views, each with an address:
 *
 *   #first-light/paintings  the daily paintings, read from the window's own manifest (window.CPL_FIRST_LIGHT,
 *                           first_light.js). Today's painting and the next seven days come from the window's
 *                           paintingForDay and localDayNumber, called here, never restated.
 *   #first-light/photos     the photos that cycle at the top of the CPL Library, the Credential Catalog and
 *                           CPL Pathways' statewide view: library/photos/hero_photos.json, the one list.
 *   #first-light/sierra     Sierra shows no images for now (Sam, 2026-11-12); the works in
 *                           sierra/art/manifest.json are the set that would play if they return. No marks there.
 *
 * PHASE B, MARKS (S643; design #3153 comments 6826461825 and 6829695812). A signed-in reviewer marks a painting
 * or a photo Keep, Drop, Add or a position. Each mark is one insert into first_light_marks (insert only; who and
 * when come from the sign-in by trigger). Apply files one row in first_light_apply_requests; first-light-apply.yml
 * reads the marks, writes the selection and the hero list, and opens one pull request that Sam merges. Nothing
 * here changes a file, and nothing auto-merges.
 *
 * THE RESOLVER (MARKS below) is the one copy of "the latest mark per item wins". It is pure and loads in node
 * (module.exports), so the Apply workflow's script requires this file rather than restating it. Per item, the
 * latest keep/drop/add decides whether it is in (no such mark: in when the live list holds it), and the latest
 * position decides where it sits. Items keep the live order; added items follow, oldest mark first; a positioned
 * item is then placed at its number, smallest number first.
 *
 * GATE. A personal sign-in (CPL_SESSION, fresh). The menu hides the item from signed-out visitors through the
 * cobi_nav row (audience magic_link; the receipt cobi_nav_first_light_magic_link_2026-11-12_s642.sql), and the
 * tables' RLS admits only an allowed reviewer (is_allowed_reviewer()).
 *
 * THE DOOR. This file loads with the page (it is small) so it can add one underlined word-link, "Edit the
 * rotation", to the painting-of-the-day window for a signed-in reviewer, opening #first-light/paintings.
 * first_light.js is left untouched; the hidden almanac review stays as it is.
 *
 * A filter lasts the visit (CLAUDE.md: tabs never remember a filter). CSS injected here, tokens only.
 * Tests: tests/first_light_tab.test.js (phase A) and tests/first_light_marks.test.js (phase B).
 */
(function (root) {
  "use strict";

  /* ── THE RESOLVER: pure, shared with the Apply workflow ─────────────── */
  var MARKS = (function () {
    var NEEDS_WORDS = "__needs_words__";
    var STORY_DIR = "stories/";
    var STORY_SOURCE = "https://map.rccd.edu/cplstories/";
    // A painting's key is its Wikimedia Commons file name, the selection's `file`. The manifest carries the image
    // URL built from it (Special:FilePath/<encoded file>), so the key is read back from the URL.
    function fileOfImg(img) {
      var s = String(img || ""), at = s.indexOf("Special:FilePath/");
      if (at < 0) return "";
      try { return decodeURIComponent(s.slice(at + 17).split("?")[0]); } catch (e) { return ""; }
    }
    // A My CPL Story photo's key is the file it will have under library/photos/: stories/<the upload path after
    // "uploads/", flattened with dashes>, so two stories whose images share a name in different months never share
    // a key (stories/2026-07-brody_withbg.png). Lower case, letters, digits, dot, dash and underscore only.
    function storyFile(story) {
      var u = String((story && story.img) || "").split("?")[0].split("#")[0];
      var parts = u.replace(/^[a-z]+:\/\/[^\/]+/i, "").split("/").filter(Boolean);
      var at = parts.lastIndexOf("uploads");
      var tail = at >= 0 ? parts.slice(at + 1) : parts.slice(-1);
      var base = tail.map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } }).join("-");
      base = base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[-.]+|-+$/g, "");
      var key = STORY_DIR + base;
      return keyOk("photos", key) ? key : "";
    }
    // The shapes the table accepts (first_light_marks_key_shape): a key the tab offers is one the insert can store.
    function keyOk(set, key) {
      key = String(key || "");
      if (!key || key.length > 300) return false;
      if (set === "photos") return /^(stories\/)?[a-z0-9][a-z0-9._-]{0,150}\.(png|jpe?g|webp)$/.test(key) && key.indexOf("..") < 0;
      if (set === "paintings") return !/[\/\\<>`|@\u0000-\u001f\u007f]/.test(key) && key.charAt(0) !== "." && key.trim() === key;
      return false;
    }
    function byId(a, b) { return (+a.id || 0) - (+b.id || 0); }
    // baseKeys: the live list's keys in order. marks: rows of one set, any order (id rises with time).
    // appliedThrough: the highest mark id a merged Apply consumed for this set (the committed files'
    // applied_through_mark_id). Those marks are spent: the live list already holds their effect, so an item a
    // person later removed by hand stays out and an old Move no longer pins. heldIds: the ids at or below it that
    // the Apply did NOT apply (an Add whose item it could not find; the files' held_mark_ids); they stay live.
    // Note: mark ids come from an identity column, and two inserts can commit out of id order in a very small
    // window, so a mark committed just after an Apply read the table can carry an id below that Apply's threshold.
    function resolveSet(baseKeys, marks, appliedThrough, heldIds) {
      var spent = +appliedThrough || 0, held = {};
      (heldIds || []).forEach(function (id) { held[+id] = true; });
      var inBase = {}, info = {}, extra = [];
      (baseKeys || []).forEach(function (k) { inBase[k] = true; });
      (marks || []).filter(function (m) { return (+m.id || 0) > spent || held[+m.id]; }).sort(byId).forEach(function (m) {
        var k = m.item_key;
        if (!k) return;
        var it = info[k] || (info[k] = { membership: null, position: null, last: null, firstAdd: null });
        if (m.mark === "position") it.position = m;
        else if (m.mark === "keep" || m.mark === "drop" || m.mark === "add") {
          it.membership = m;
          if (m.mark === "add" && !it.firstAdd) it.firstAdd = m;
        }
        it.last = m;
      });
      // Add puts an item in, Drop takes it out, and Keep leaves it as the live list has it (it never adds).
      function isIn(k) {
        var it = info[k], m = it && it.membership && it.membership.mark;
        return m === "add" ? true : m === "drop" ? false : !!inBase[k];
      }
      var list = (baseKeys || []).filter(isIn);
      Object.keys(info).forEach(function (k) { if (!inBase[k] && isIn(k)) extra.push(k); });
      extra.sort(function (a, b) {
        var x = info[a].firstAdd || info[a].membership, y = info[b].firstAdd || info[b].membership;
        return byId(x, y);
      });
      list = list.concat(extra);
      // Smallest number first; on a tie the newer move is placed last, so it takes the number.
      var placed = list.filter(function (k) { return info[k] && info[k].position; });
      placed.sort(function (a, b) {
        return (info[a].position.position - info[b].position.position) || byId(info[a].position, info[b].position);
      });
      var rest = list.filter(function (k) { return !(info[k] && info[k].position); });
      placed.forEach(function (k) {
        var at = Math.max(0, Math.min(rest.length, info[k].position.position - 1));
        rest.splice(at, 0, k);
      });
      list = rest;
      var basePos = {};
      (baseKeys || []).forEach(function (k, i) { basePos[k] = i; });
      var top = (marks || []).reduce(function (n, m) { return Math.max(n, +m.id || 0); }, spent);
      return {
        list: list,
        added: extra.slice(),
        dropped: (baseKeys || []).filter(function (k) { return !isIn(k); }),
        moved: list.filter(function (k, i) { return inBase[k] && info[k] && info[k].position && basePos[k] !== i; }),
        info: info,
        appliedThrough: top,
        changed: JSON.stringify(list) !== JSON.stringify(baseKeys || [])
      };
    }
    function forSet(marks, set) { return (marks || []).filter(function (m) { return m.item_set === set; }); }
    return {
      NEEDS_WORDS: NEEDS_WORDS, STORY_DIR: STORY_DIR, STORY_SOURCE: STORY_SOURCE,
      fileOfImg: fileOfImg, storyFile: storyFile, keyOk: keyOk, resolveSet: resolveSet, forSet: forSet
    };
  })();
  if (typeof module === "object" && module && module.exports) module.exports = MARKS;
  if (!root || !root.document) return;   // node: the resolver alone
  var window = root, document = root.document, location = root.location;

  var TAB = "first-light";
  var VIEWS = [
    { id: "paintings", label: "Daily paintings" },
    { id: "photos", label: "View photos" },
    { id: "sierra", label: "Sierra" }
  ];
  var HERO_URL = "library/photos/hero_photos.json";
  var HERO_DIR = "library/photos/";
  var SIERRA_URL = "sierra/art/manifest.json";
  var SIERRA_DIR = "sierra/art/";
  var STORIES_URL = "fact-sheet/cpl_stories.js";
  // The gallery's candidates live in tools/, which the Pages deploy prunes, so they are read from the repo's main.
  var CAND_URL = "https://raw.githubusercontent.com/CPL-Initiative/cpl-project-tracker/main/tools/first_light_gallery/index.json";
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var MARKS_URL = SUPABASE_URL + "/rest/v1/first_light_marks";
  var REQ_URL = SUPABASE_URL + "/rest/v1/first_light_apply_requests";
  var REVIEWER_URL = SUPABASE_URL + "/rest/v1/rpc/is_allowed_reviewer";
  var MIGRATION = "kb/migrations/2026-11-12_first_light_marks.sql";
  var CAND_SHOWN = 24;
  var EDIT_LINE = "Mark a painting or photo Keep, Drop, Add or Move. Apply opens a pull request; Sam merges it, and nothing changes before then.";

  var state = {
    view: "paintings",
    q: "", cq: "",
    hero: null, heroErr: null, heroLoading: null,
    sierra: null, sierraErr: null, sierraLoading: null,
    marks: null, marksErr: null, marksLoading: null,
    reqs: null,
    cand: null, candErr: null, candLoading: null, showCand: false,
    stories: null, storiesErr: null, storiesLoading: null, showStories: false,
    msg: "", busy: false, focus: null
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── who is looking ─────────────────────────────────────────────────── */
  function signedIn() {
    var S = window.CPL_SESSION;
    if (!S || typeof S.get !== "function") return false;
    try { return !!S.get() && (typeof S.isFresh !== "function" || S.isFresh()); } catch (e) { return false; }
  }
  function headers(extra) {
    var S = window.CPL_SESSION;
    var h = S && typeof S.authHeaders === "function" ? S.authHeaders() : {};
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function fresh() {
    var S = window.CPL_SESSION;
    return S && typeof S.ensureFresh === "function" ? Promise.resolve(S.ensureFresh()).catch(function () { return null; }) : Promise.resolve(null);
  }

  /* ── the window's rotation, read through its own functions ──────────── */
  function fl() {
    var F = window.CPL_FIRST_LIGHT;
    return F && F.paintings && typeof F.paintingForDay === "function" && typeof F.localDayNumber === "function" ? F : null;
  }
  // The window's day number for a date, by its own function: localDayNumber reads new Date(), so the offset
  // from today is added to it rather than the arithmetic copied here.
  function schedule(days) {
    var F = fl();
    if (!F) return [];
    var base = F.localDayNumber(), now = new Date(), out = [];
    for (var k = 0; k <= days; k++) {
      out.push({
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + k),
        painting: F.paintingForDay(base + k)
      });
    }
    return out;
  }
  function dayLabel(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }
  function shortDate(t) {
    var d = new Date(t);
    return isNaN(d) ? "" : d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }
  // The window's own image, asked for at card size (Wikimedia's FilePath takes ?width=).
  function thumb(src) {
    var s = String(src || "");
    return /[?&]width=\d+/.test(s) ? s.replace(/([?&]width=)\d+/, "$1480") : s;
  }
  function commonsThumb(file) {
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(file) + "?width=480";
  }

  /* ── the files ──────────────────────────────────────────────────────── */
  function noFetch() { return typeof window.fetch !== "function" ? Promise.reject(new Error("this page cannot read files")) : null; }
  function json(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
  function loadHero() {
    if (state.heroLoading) return state.heroLoading;
    state.heroLoading = (noFetch() || window.fetch(HERO_URL, { cache: "no-cache" }).then(json)).then(function (d) {
      state.hero = d && Array.isArray(d.photos) ? d : null;
      if (!state.hero) state.heroErr = "the file holds no photos";
    }, function (e) { state.heroErr = (e && e.message) || "the read failed"; });
    return state.heroLoading;
  }
  function loadSierra() {
    if (state.sierraLoading) return state.sierraLoading;
    state.sierraLoading = (noFetch() || window.fetch(SIERRA_URL, { cache: "no-cache" }).then(json)).then(function (d) {
      state.sierra = d && Array.isArray(d.paintings) ? d : null;
      if (!state.sierra) state.sierraErr = "the file holds no paintings";
    }, function (e) { state.sierraErr = (e && e.message) || "the read failed"; });
    return state.sierraLoading;
  }
  function loadCand() {
    if (state.candLoading) return state.candLoading;
    state.candLoading = (noFetch() || window.fetch(CAND_URL, { cache: "no-cache" }).then(json)).then(function (d) {
      state.cand = d && Array.isArray(d.paintings) ? d.paintings.filter(function (p) { return p && p.file && !p.in_first_light; }) : null;
      if (!state.cand) state.candErr = "the file holds no candidates";
    }, function (e) { state.candErr = (e && e.message) || "the read failed"; });
    return state.candLoading;
  }
  // fact-sheet/cpl_stories.js sets window.CPL_STORIES to a JSON object; it is read as text and parsed, not run.
  function loadStories() {
    if (state.storiesLoading) return state.storiesLoading;
    state.storiesLoading = (noFetch() || window.fetch(STORIES_URL, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    })).then(function (t) {
      var s = String(t || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
      var d = a >= 0 && b > a ? JSON.parse(s.slice(a, b + 1)) : null;
      // One story per key: a second story whose photo would land on the same file is left out.
      var seen = {};
      state.stories = d && Array.isArray(d.stories) ? d.stories.filter(function (x) {
        var k = MARKS.storyFile(x);
        if (!k || seen[k]) return false;
        return (seen[k] = true);
      }) : null;
      if (!state.stories) state.storiesErr = "the file holds no stories";
    }).catch(function (e) { state.storiesErr = (e && e.message) || "the read failed"; });
    return state.storiesLoading;
  }

  /* ── the marks and the Apply request ────────────────────────────────── */
  function readError(r) {
    if (r.status === 404) return "absent";
    if (r.status === 401) return "signin";
    if (r.status === 403) return "notreviewer";
    return "HTTP " + r.status;
  }
  // Range-paged, newest last. A table not yet in place answers 404 and the tab says so in words. The reviewer check
  // comes first: RLS answers a signed-in non-reviewer with an empty list, which would otherwise read as "no marks"
  // and offer controls whose every insert the table refuses.
  function checkReviewer() {
    return window.fetch(REVIEWER_URL, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: "{}" }).then(function (r) {
      if (!r.ok) throw new Error(r.status === 401 ? "signin" : r.status === 403 ? "notreviewer" : "the reviewer check answered HTTP " + r.status);
      return r.json();
    }).then(function (ok) { if (ok !== true) throw new Error("notreviewer"); });
  }
  function loadMarks() {
    if (state.marksLoading) return state.marksLoading;
    if (noFetch()) { state.marksErr = "this page cannot read files"; return (state.marksLoading = Promise.resolve()); }
    var rows = [], PAGE = 1000;
    function page(from) {
      return window.fetch(MARKS_URL + "?select=id,item_set,item_key,mark,position,collection,marked_by,marked_at&order=id.asc",
        { headers: headers({ Range: from + "-" + (from + PAGE - 1), "Range-Unit": "items" }) }).then(function (r) {
        if (!r.ok) throw new Error(readError(r));
        return r.json();
      }).then(function (d) {
        d = Array.isArray(d) ? d : [];
        rows = rows.concat(d);
        return d.length === PAGE ? page(from + PAGE) : rows;
      });
    }
    state.marksLoading = fresh().then(checkReviewer).then(function () { return page(0); }).then(function (all) {
      state.marks = all;
      return window.fetch(REQ_URL + "?select=id,status,requested_by,requested_at,handled_at,pr_number,pr_url,run_url,detail&order=id.desc&limit=3",
        { headers: headers() }).then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
        state.reqs = Array.isArray(d) ? d : [];
      }, function () { state.reqs = []; });
    }, function (e) { state.marksErr = (e && e.message) || "the read failed"; });
    return state.marksLoading;
  }
  function saving(words) {
    state.busy = true;
    var m = document.getElementById("flt-msg");
    if (m) m.textContent = words;
  }
  function postMark(row) {
    saving("Saving the mark…");
    return fresh().then(function () {
      return window.fetch(MARKS_URL, { method: "POST", headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify(row) });
    }).then(function (r) {
      if (!r.ok) throw new Error(readError(r));
      return r.json();
    }).then(function (d) {
      var saved = Array.isArray(d) ? d[0] : d;
      if (!saved || !saved.id) throw new Error("the mark came back empty");
      state.marks = (state.marks || []).concat([saved]);
      state.msg = "Saved: " + markWords(saved) + ".";
    }, function (e) { state.msg = failWords(e, "The mark was not saved"); }).then(function () { state.busy = false; });
  }
  function requestApply() {
    saving("Filing the Apply…");
    return fresh().then(function () {
      return window.fetch(REQ_URL, { method: "POST", headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }), body: "{}" });
    }).then(function (r) {
      if (r.status === 409) { state.msg = "An Apply is already waiting; it will carry these marks too."; return null; }
      if (!r.ok) throw new Error(readError(r));
      return r.json();
    }).then(function (d) {
      if (!d) return;
      var saved = Array.isArray(d) ? d[0] : d;
      if (saved && saved.id) state.reqs = [saved].concat(state.reqs || []);
      state.msg = "Apply is filed. The next hourly run opens the pull request.";
    }, function (e) { state.msg = failWords(e, "Apply was not filed"); }).then(function () { state.busy = false; });
  }
  function failWords(e, lead) {
    var m = (e && e.message) || "";
    if (m === "signin") return lead + ": your sign-in has ended. Sign in again and repeat it.";
    if (m === "notreviewer") return lead + ": your sign-in is not on the reviewer list, which marking needs.";
    if (m === "absent") return lead + ": the marks table is not in place yet.";
    return lead + " (" + m + ").";
  }
  function markWords(m) {
    var what = m.mark === "position" ? "move to number " + m.position : m.mark;
    return what + ", " + labelFor(m.item_set, m.item_key);
  }

  /* ── what Apply would change ────────────────────────────────────────── */
  function baseKeys(set) {
    if (set === "paintings") { var F = fl(); return F ? F.paintings.map(function (p) { return MARKS.fileOfImg(p.img); }) : null; }
    return state.hero ? state.hero.photos.map(function (p) { return p.file; }) : null;
  }
  function resolved(set) {
    var b = baseKeys(set);
    return b && state.marks ? MARKS.resolveSet(b, MARKS.forSet(state.marks, set), appliedThrough(set), heldIds(set)) : null;
  }
  // The highest mark id the last merged Apply consumed, carried in the committed files: the manifest the builder
  // writes (paintings) and hero_photos.json (photos). Marks at or below it are spent, except the held ones beside
  // it. (Ids can commit out of order in a very small window; see resolveSet.)
  function heldIds(set) {
    var F = fl(), v = set === "paintings" ? F && F.paintings.held_mark_ids : state.hero && state.hero.held_mark_ids;
    return Array.isArray(v) ? v : [];
  }
  function appliedThrough(set) {
    if (set === "paintings") { var F = fl(); return F && F.paintings.applied_through_mark_id ? +F.paintings.applied_through_mark_id : 0; }
    return state.hero && state.hero.applied_through_mark_id ? +state.hero.applied_through_mark_id : 0;
  }
  function labelFor(set, key) {
    if (set === "paintings") {
      var F = fl(), i = F ? F.paintings.map(function (p) { return MARKS.fileOfImg(p.img); }).indexOf(key) : -1;
      if (i >= 0) return F.paintings[i].title;
      var c = (state.cand || []).filter(function (x) { return x.file === key; })[0];
      return c ? c.title : String(key).replace(/\.[a-z0-9]+$/i, "");
    }
    var s = (state.stories || []).filter(function (x) { return MARKS.storyFile(x) === key; })[0];
    return s ? s.name + " (My CPL Story)" : key;
  }
  function itemState(set, key) {
    var r = resolved(set);
    return r && r.info[key] ? r.info[key] : null;
  }

  /* ── look ───────────────────────────────────────────────────────────── */
  function ensureCss() {
    if (document.getElementById("flt-css")) return;
    var st = document.createElement("style");
    st.id = "flt-css";
    st.textContent = [
      "#first-light-root{color:var(--text-body);}",
      ".flt-h{font-size:1.25rem;margin:0 0 6px;color:var(--text-strong);}",
      ".flt-views{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 14px;padding:0;list-style:none;}",
      ".flt-views a,.flt-door{display:inline-flex;align-items:center;min-height:24px;color:var(--accent-link);" +
        "text-decoration:underline;text-underline-offset:3px;font-size:.92rem;}",
      ".flt-views a[aria-current=page]{color:var(--text-strong);font-weight:600;text-decoration-thickness:2px;}",
      ".flt-views a:focus-visible,.flt-door:focus-visible,.flt-filter input:focus-visible,.flt-word:focus-visible," +
        ".flt-move input:focus-visible{outline:2px solid var(--accent-link);outline-offset:2px;}",
      ".flt-p{margin:0 0 8px;max-width:var(--cpl-measure,none);color:var(--text-body);font-size:.95rem;line-height:1.5;}",
      ".flt-note{margin:0 0 16px;max-width:var(--cpl-measure,none);color:var(--text-muted);font-size:.88rem;}",
      ".flt-h3{font-size:1rem;margin:18px 0 8px;color:var(--text-strong);}",
      ".flt-today{display:grid;grid-template-columns:minmax(0,220px) minmax(0,1fr);gap:16px;align-items:start;" +
        "border:1px solid var(--border);border-radius:10px;padding:14px;background:var(--surface-opaque);margin:0 0 6px;}",
      ".flt-today img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:var(--surface-subtle);border-radius:6px;display:block;}",
      ".flt-today .flt-t{font-size:1.05rem;font-weight:600;color:var(--text-strong);margin:2px 0;}",
      ".flt-count{font-size:.88rem;color:var(--text-muted);margin:6px 0 0;}",
      ".flt-next{margin:0;padding:0 0 0 1.2em;font-size:.9rem;}",
      ".flt-next li{margin:3px 0;overflow-wrap:anywhere;}",
      ".flt-filter{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:14px 0 10px;}",
      ".flt-filter label{font-size:.88rem;color:var(--text-body);}",
      ".flt-filter input,.flt-move input{flex:1 1 220px;max-width:360px;min-height:32px;box-sizing:border-box;padding:4px 8px;font:inherit;font-size:.9rem;" +
        "border:1px solid var(--border-strong);border-radius:6px;background:var(--surface-opaque);color:var(--text-body);}",
      ".flt-shown{font-size:.85rem;color:var(--text-muted);}",
      ".flt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin:0;padding:0;list-style:none;}",
      ".flt-card{min-width:0;border:1px solid var(--border);border-radius:10px;background:var(--surface-opaque);overflow:hidden;display:flex;flex-direction:column;}",
      ".flt-card img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain;background:var(--surface-subtle);display:block;}",
      ".flt-card .flt-body{padding:10px 12px 12px;min-width:0;}",
      ".flt-card h3{font-size:.95rem;margin:0 0 3px;color:var(--text-strong);overflow-wrap:anywhere;}",
      ".flt-meta{font-size:.84rem;color:var(--text-body);margin:0 0 4px;overflow-wrap:anywhere;}",
      ".flt-alt{font-size:.82rem;color:var(--text-muted);margin:4px 0 0;overflow-wrap:anywhere;}",
      ".flt-pos{font-size:.78rem;color:var(--text-muted);margin:0 0 3px;}",
      ".flt-err{border-left:3px solid var(--border-strong);padding:8px 12px;background:var(--surface-subtle);font-size:.9rem;max-width:var(--cpl-measure,none);}",
      ".flt-gate{max-width:var(--cpl-measure,none);}",
      ".flt-noimg{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;" +
        "background:var(--surface-subtle);color:var(--text-muted);font-size:.82rem;text-align:center;}",
      ".cplfl-actions .flt-door{font-size:.85rem;}",
      /* the marks: underlined words, no border, no fill, 24px tall */
      ".flt-word{appearance:none;background:none;border:0;padding:0;margin:0;min-height:24px;font:inherit;font-size:.88rem;" +
        "color:var(--accent-link);text-decoration:underline;text-underline-offset:3px;cursor:pointer;}",
      ".flt-acts{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin:8px 0 0;}",
      ".flt-move{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;font-size:.84rem;color:var(--text-body);}",
      ".flt-move input{flex:0 0 5.5em;width:5.5em;min-height:28px;}",
      ".flt-mark{font-size:.82rem;color:var(--text-strong);margin:6px 0 0;overflow-wrap:anywhere;}",
      ".flt-mark b{font-weight:600;}",
      ".flt-apply{border:1px solid var(--border);border-radius:10px;background:var(--surface-opaque);padding:12px 14px;margin:0 0 16px;max-width:var(--cpl-measure,none);}",
      ".flt-apply .flt-h3{margin-top:0;}",
      ".flt-apply ul{margin:4px 0 8px;padding:0 0 0 1.2em;font-size:.88rem;}",
      ".flt-apply li{margin:2px 0;overflow-wrap:anywhere;}",
      ".flt-msg{font-size:.88rem;color:var(--text-strong);margin:6px 0 0;}",
      "@media (max-width:560px){.flt-today{grid-template-columns:minmax(0,1fr);}.flt-grid{grid-template-columns:minmax(0,1fr);}}",
      "@media (prefers-reduced-motion:reduce){#first-light-root *{transition:none!important;animation:none!important;}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* ── address ────────────────────────────────────────────────────────── */
  function viewFor(parts) {
    var v = parts && parts[0];
    for (var i = 0; i < VIEWS.length; i++) if (VIEWS[i].id === v) return v;
    return "paintings";
  }
  if (window.CPL_SESSION && window.CPL_SESSION.viewAddress) {
    window.CPL_SESSION.viewAddress(TAB, function () { return TAB + "/" + state.view; });
  }
  /* A visit (the first, one after another tab, or a new address) reads the address and clears the filters:
     a filter lasts the visit only. */
  var away = true, seenHash = null;
  function arrive() {
    var h = String(location.hash || ""), visit = away || h !== seenHash;
    away = false; seenHash = h;
    if (!visit) return;
    var a = window.CPL_SESSION && window.CPL_SESSION.arrival ? window.CPL_SESSION.arrival(TAB) : null;
    state.view = viewFor(a);
    state.q = ""; state.cq = ""; state.msg = "";
    state.showCand = false; state.showStories = false;
    forget();
  }
  /* Each visit reads again: the marks, the requests, the hero list and the candidates (another reviewer, or a
     merged Apply, may have changed any of them), and a read that failed last time is tried again. */
  function forget() {
    state.marks = null; state.marksErr = null; state.marksLoading = null; state.reqs = null;
    state.hero = null; state.heroErr = null; state.heroLoading = null;
    state.cand = null; state.candErr = null; state.candLoading = null;
    state.stories = null; state.storiesErr = null; state.storiesLoading = null;
  }

  /* ── views ──────────────────────────────────────────────────────────── */
  function viewsNav() {
    return '<nav aria-label="First Light views"><ul class="flt-views">' + VIEWS.map(function (v) {
      return '<li><a href="#' + TAB + "/" + v.id + '"' + (v.id === state.view ? ' aria-current="page"' : "") + ">" +
        esc(v.label) + "</a></li>";
    }).join("") + "</ul></nav>";
  }
  function edit() { return '<p class="flt-note">' + esc(EDIT_LINE) + "</p>"; }
  function word(act, text, attrs) {
    return '<button type="button" class="flt-word" data-act="' + act + '"' + (attrs || "") + ">" + esc(text) + "</button>";
  }
  function keyAttrs(set, key, coll) {
    return ' data-set="' + esc(set) + '" data-key="' + esc(key) + '" data-coll="' + esc(coll) + '"';
  }

  /* Marks open once the table answers; until then each view says why there are no controls. */
  function marksOpen() { return !!state.marks && !state.marksErr; }
  function marksLine() {
    if (marksOpen()) return "";
    if (state.marksErr === "absent") return '<p class="flt-err" data-marks-absent>Marking opens once the marks table is in place (' + esc(MIGRATION) + ").</p>";
    if (state.marksErr === "notreviewer") return '<p class="flt-err" data-not-reviewer>Your sign-in is not on the reviewer list, so this tab shows the sets without marks.</p>';
    if (state.marksErr === "signin") return '<p class="flt-err">Your sign-in has ended, so the marks cannot be read. Sign in again to mark.</p>';
    if (state.marksErr) return '<p class="flt-err">The marks could not be read (' + esc(state.marksErr) + ").</p>";
    return '<p class="flt-note" role="status">Reading the marks…</p>';
  }
  function reqLine() {
    var r = (state.reqs || [])[0];
    if (!r) return "";
    var who = r.requested_by ? " by " + esc(r.requested_by) : "", when = r.requested_at ? " on " + esc(shortDate(r.requested_at)) : "";
    if (r.status === "pending") return '<p class="flt-p" data-req="pending">An Apply is waiting (asked' + who + when + "). The next hourly run opens the pull request.</p>";
    var pr = r.pr_url ? '<a href="' + esc(r.pr_url) + '">pull request ' + esc(r.pr_number ? "#" + r.pr_number : "") + "</a>" : "a pull request";
    if (r.status === "opened" || r.status === "updated") {
      return '<p class="flt-p" data-req="' + esc(r.status) + '">The last Apply ' + (r.status === "opened" ? "opened " : "updated ") + pr + when + ". Sam merges it; until then the views are unchanged.</p>";
    }
    // Nothing new: the stamp names the open pull request when its branch already carries the marks, or says in
    // its detail which marks were held (first-light-apply.yml, the stamp step).
    if (r.status === "nothing") {
      // A held mark rides on the same stamp as the open pull request (S646 UI pass): the pull request carries the
      // other marks, and the held item is on no pull request.
      var held = r.detail && r.detail.indexOf("held: ") !== -1 ? r.detail.slice(r.detail.indexOf("held: ") + 6) : "";
      if (r.pr_url && held) return '<p class="flt-p" data-req="nothing">The last Apply' + when + " found nothing new: " + pr +
        " carries the other marks, and Sam merges it; until then the views are unchanged. " + esc(held.charAt(0).toUpperCase() + held.slice(1)) +
        ", so it is on no pull request.</p>";
      if (r.pr_url) return '<p class="flt-p" data-req="nothing">The last Apply' + when + " found nothing new: " + pr + " already carries these marks. Sam merges it; until then the views are unchanged.</p>";
      return '<p class="flt-p" data-req="nothing">The last Apply' + when + " found nothing to change" + (r.detail ? " (" + esc(r.detail) + ")" : "") + ".</p>";
    }
    var run = r.run_url ? ' <a href="' + esc(r.run_url) + '">The run</a> says more.' : "";
    return '<p class="flt-p" data-req="failed">The last Apply' + when + " did not open a pull request" + (r.detail ? " (" + esc(r.detail) + ")" : "") + "." + run + "</p>";
  }
  function changeItems(set, res) {
    var out = [];
    res.added.forEach(function (k) { out.push("Add " + labelFor(set, k)); });
    res.dropped.forEach(function (k) { out.push("Drop " + labelFor(set, k)); });
    res.moved.forEach(function (k) { out.push("Move " + labelFor(set, k) + " to number " + (res.list.indexOf(k) + 1)); });
    return out;
  }
  function applyPanel() {
    if (!marksOpen()) return "";
    var parts = [], any = false;
    [["paintings", "Paintings"], ["photos", "Photos"]].forEach(function (s) {
      var res = resolved(s[0]);
      if (!res) { parts.push("<p class=\"flt-meta\">" + s[1] + ": the list is still loading.</p>"); return; }
      var items = changeItems(s[0], res);
      if (res.changed) any = true;
      parts.push('<p class="flt-meta"><b>' + s[1] + "</b>: " + (res.changed ? res.list.length + " after Apply, " + items.length + " change" + (items.length === 1 ? "" : "s") + "." : "no change from what is live.") + "</p>" +
        (items.length ? '<ul data-changes="' + s[0] + '">' + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : ""));
    });
    var pending = (state.reqs || []).some(function (r) { return r.status === "pending"; });
    var act = !any ? '<p class="flt-note">Nothing to apply: the marks match what is live.</p>'
      : pending ? '<p class="flt-note">Apply is already waiting; it carries these marks too.</p>'
        : '<div class="flt-acts">' + word("apply", "Apply") + '<span class="flt-shown">Opens one pull request for Sam to merge.</span></div>';
    return '<section class="flt-apply" aria-labelledby="flt-apply-h"><h3 class="flt-h3" id="flt-apply-h">Your marks and Apply</h3>' +
      parts.join("") + reqLine() + act + '<p class="flt-msg" role="status" id="flt-msg">' + esc(state.msg) + "</p></section>";
  }
  function markState(set, key) {
    var it = itemState(set, key);
    if (!it || !it.last) return "";
    var m = it.last;
    return '<p class="flt-mark" data-mark-state>Marked <b>' + esc(m.mark === "position" ? "move to number " + m.position : m.mark) + "</b>" +
      (m.marked_by ? " by " + esc(m.marked_by) : "") + (m.marked_at ? " on " + esc(shortDate(m.marked_at)) : "") + ".</p>";
  }
  // Controls for an item in the live list: Drop (or Keep, once dropped) and Move to a number.
  function liveActs(set, key, coll, n) {
    if (!marksOpen()) return "";
    var it = itemState(set, key), out = it && it.membership && it.membership.mark === "drop";
    var id = "flt-mv-" + set + "-" + Math.abs(hash(key));
    return markState(set, key) + '<div class="flt-acts">' +
      (out ? word("keep", "Keep", keyAttrs(set, key, coll)) : word("drop", "Drop", keyAttrs(set, key, coll))) +
      (out ? "" : '<span class="flt-move"><label for="' + id + '">Move to number</label>' +
        '<input id="' + id + '" type="number" min="1" max="' + n + '" inputmode="numeric" data-move-for="' + esc(key) + '">' +
        word("move", "Move", keyAttrs(set, key, coll)) + "</span>") + "</div>";
  }
  // Controls for a candidate: Add, or Take back once added.
  function addActs(set, key, coll) {
    if (!marksOpen()) return "";
    if (!MARKS.keyOk(set, key)) return '<p class="flt-alt">This file’s name holds a character the marks table does not accept, so it cannot be added here.</p>';
    var it = itemState(set, key), added = it && it.membership && it.membership.mark === "add";
    return markState(set, key) + '<div class="flt-acts">' +
      (added ? word("takeback", "Take back", keyAttrs(set, key, coll)) : word("add", "Add", keyAttrs(set, key, coll))) + "</div>";
  }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  function matches(p, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return String(p.title || "").toLowerCase().indexOf(q) !== -1 || String(p.artist || "").toLowerCase().indexOf(q) !== -1;
  }
  function paintingCard(p, i, n, isToday) {
    return '<li class="flt-card" data-painting="' + i + '">' +
      '<img src="' + esc(thumb(p.img)) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
      '<div class="flt-body"><p class="flt-pos">Number ' + (i + 1) + " of " + n + (isToday ? ", today" : "") + "</p>" +
      "<h3>" + esc(p.title) + "</h3>" +
      '<p class="flt-meta">' + esc(p.artist) + ", " + esc(p.year) + "</p>" +
      '<p class="flt-alt">Description: ' + esc(p.alt) + "</p>" +
      liveActs("paintings", MARKS.fileOfImg(p.img), "rotation", n) + "</div></li>";
  }
  function gridOf(list, all, today) {
    var n = all.length;
    return list.map(function (p) { var i = all.indexOf(p); return paintingCard(p, i, n, p === today); }).join("");
  }
  function candView() {
    var h = '<section aria-labelledby="flt-cand-h"><h3 class="flt-h3" id="flt-cand-h">Add a painting</h3>' +
      '<p class="flt-p">The candidates are the gallery’s California plein air paintings from Wikimedia Commons, each checked as public domain. ' +
      "An added painting arrives with its blurb, setting and description marked as wanting words, and stays out of the rotation until they are written on the pull request.</p>";
    if (!marksOpen()) return h + "</section>";
    if (!state.showCand) return h + '<div class="flt-acts">' + word("show-cand", "Show the candidates") + "</div></section>";
    if (!state.cand) {
      return h + (state.candErr ? '<p class="flt-err">The candidates could not be read (' + esc(state.candErr) + ").</p>"
        : '<p class="flt-note" role="status">Reading the candidates…</p>') + "</section>";
    }
    var live = {};
    (baseKeys("paintings") || []).forEach(function (k) { live[k] = true; });
    var all = state.cand.filter(function (c) { return !live[c.file]; });
    var q = state.cq.trim(), shown = all.filter(function (c) { return matches(c, q); });
    h += '<div class="flt-filter"><label for="flt-cq">Filter the candidates by artist or title</label>' +
      '<input id="flt-cq" type="search" autocomplete="off" value="' + esc(state.cq) + '">' +
      '<span class="flt-shown" id="flt-cshown" role="status">' + candShown(Math.min(shown.length, CAND_SHOWN), shown.length, all.length) + "</span></div>" +
      '<ul class="flt-grid" id="flt-cgrid" data-grid="candidates">' + candCards(shown) + "</ul></section>";
    return h;
  }
  function candShown(k, m, n) {
    return m === n ? "Showing " + k + " of " + n + " candidates." : "Showing " + k + " of " + m + " matching, from " + n + " candidates.";
  }
  function candCards(list) {
    return list.slice(0, CAND_SHOWN).map(function (c) {
      return '<li class="flt-card" data-cand="' + esc(c.file) + '">' +
        '<img src="' + esc(commonsThumb(c.file)) + '" alt="' + esc(c.title) + '" loading="lazy" decoding="async">' +
        '<div class="flt-body"><h3>' + esc(c.title) + "</h3>" +
        '<p class="flt-meta">' + esc(c.artist) + (c.year ? ", " + esc(c.year) : "") + "</p>" +
        '<p class="flt-alt">' + esc(c.category || "") + "</p>" +
        addActs("paintings", c.file, "gallery_candidates") + "</div></li>";
    }).join("");
  }
  function paintingsView() {
    var F = fl();
    var h = '<p class="flt-p">One painting greets everyone who opens COBI each day, the same painting for everyone on the same day. ' +
      "The rotation runs through the list below in order, one a day, and starts again after the last.</p>" + edit();
    if (!F) return h + '<p class="flt-err">The painting window did not load on this page, so its rotation cannot be listed.</p>';
    h += marksLine() + applyPanel();
    var all = F.paintings, n = all.length, sch = schedule(7), today = sch[0].painting;
    h += '<section aria-labelledby="flt-today-h"><h3 class="flt-h3" id="flt-today-h">Today, ' + esc(dayLabel(sch[0].date)) + "</h3>" +
      '<div class="flt-today"><img src="' + esc(thumb(today.img)) + '" alt="' + esc(today.alt) + '" decoding="async">' +
      '<div><p class="flt-t" data-today>' + esc(today.title) + "</p>" +
      '<p class="flt-meta">' + esc(today.artist) + ", " + esc(today.year) + "</p>" +
      '<p class="flt-alt">Description: ' + esc(today.alt) + "</p>" +
      '<p class="flt-count" data-count>' + n + " paintings in the rotation.</p></div></div></section>";
    h += '<section aria-labelledby="flt-next-h"><h3 class="flt-h3" id="flt-next-h">The next seven days</h3><ol class="flt-next" data-next>' +
      sch.slice(1).map(function (s) {
        return "<li>" + esc(dayLabel(s.date)) + ": " + esc(s.painting.title) + ", " + esc(s.painting.artist) + "</li>";
      }).join("") + "</ol></section>";
    var shown = all.filter(function (p) { return matches(p, state.q.trim()); });
    h += '<section aria-labelledby="flt-all-h"><h3 class="flt-h3" id="flt-all-h">Every painting in the rotation</h3>' +
      '<div class="flt-filter"><label for="flt-q">Filter by artist or title</label>' +
      '<input id="flt-q" type="search" autocomplete="off" value="' + esc(state.q) + '">' +
      '<span class="flt-shown" id="flt-shown" role="status">' + shownText(shown.length, n) + "</span></div>" +
      '<ul class="flt-grid" id="flt-grid" data-grid="paintings">' + gridOf(shown, all, today) + "</ul></section>";
    return h + candView();
  }
  function shownText(k, n) { return k === n ? "Showing all " + n + "." : "Showing " + k + " of " + n + "."; }

  function storiesView() {
    var h = '<section aria-labelledby="flt-st-h"><h3 class="flt-h3" id="flt-st-h">Add from My CPL Story</h3>' +
      '<p class="flt-p">The photos MAP published with each story at <a href="' + esc(MARKS.STORY_SOURCE) + '">map.rccd.edu/cplstories</a>. ' +
      "An added photo carries the story’s link and the name exactly as MAP printed it, and nothing beyond what MAP published. " +
      "Drop takes a story photo down: the next Apply removes it from every view.</p>";
    if (!marksOpen()) return h + "</section>";
    if (!state.showStories) return h + '<div class="flt-acts">' + word("show-stories", "Show the stories") + "</div></section>";
    if (!state.stories) {
      return h + (state.storiesErr ? '<p class="flt-err">The stories could not be read (' + esc(state.storiesErr) + ").</p>"
        : '<p class="flt-note" role="status">Reading the stories…</p>') + "</section>";
    }
    var live = {};
    (baseKeys("photos") || []).forEach(function (k) { live[k] = true; });
    var list = state.stories.filter(function (s) { return !live[MARKS.storyFile(s)]; });
    return h + '<p class="flt-shown">' + list.length + " stories not yet in the list.</p>" +
      '<ul class="flt-grid" data-grid="stories">' + list.map(function (s) {
        var key = MARKS.storyFile(s);
        return '<li class="flt-card" data-story="' + esc(key) + '">' +
          '<img src="' + esc(s.img) + '" alt="' + esc(s.name) + '" loading="lazy" decoding="async">' +
          '<div class="flt-body"><h3>' + esc(s.name) + "</h3>" +
          (s.pathway ? '<p class="flt-meta">' + esc(s.pathway) + "</p>" : "") +
          (s.meta ? '<p class="flt-meta">' + esc(s.meta) + "</p>" : "") +
          addActs("photos", key, "my_cpl_story") + "</div></li>";
      }).join("") + "</ul></section>";
  }
  function photosView() {
    var h = "";
    var d = state.hero;
    if (!d) {
      return '<p class="flt-p">The photos that cycle at the top of the CPL Library, the Credential Catalog and CPL Pathways’ statewide view.</p>' +
        edit() + (state.heroErr ? '<p class="flt-err">The photo list could not be read (' + esc(state.heroErr) + ").</p>"
          : '<p class="flt-note" role="status">Reading the photo list…</p>');
    }
    var names = {};
    (d.views || []).forEach(function (v) { names[v.id] = v.name; });
    var secs = Math.round((d.pace_ms || 0) / 1000);
    h += '<p class="flt-p">' + d.photos.length + " photos cycle at the top of " + esc(listWords((d.views || []).map(function (v) { return v.name; }))) +
      ", in this order, a new photo every " + secs + " seconds. On those pages the photos are decoration and carry no description; " +
      "the descriptions here are for this list.</p>" + edit() + marksLine() + applyPanel();
    h += '<ul class="flt-grid" data-grid="photos">' + d.photos.map(function (p, i) {
      return '<li class="flt-card" data-photo="' + esc(p.file) + '">' +
        '<img src="' + esc(HERO_DIR + p.file) + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async" width="' + esc(p.width) + '" height="' + esc(p.height) + '">' +
        '<div class="flt-body"><p class="flt-pos">Photo ' + (i + 1) + " of " + d.photos.length + "</p>" +
        "<h3>" + esc(p.name || p.file) + "</h3>" +
        '<p class="flt-meta">Plays on: ' + esc(listWords((p.plays || []).map(function (id) { return names[id] || id; }))) + "</p>" +
        '<p class="flt-meta">From: ' + (/^https:\/\//.test(String(p.story_link || "")) ? '<a href="' + esc(p.story_link) + '">' + esc(p.source) + "</a>" : esc(p.source)) + "</p>" +
        '<p class="flt-alt">Description: ' + esc(p.alt) + "</p>" +
        liveActs("photos", p.file, String(p.file).indexOf(MARKS.STORY_DIR) === 0 ? "my_cpl_story" : "hero_photos", d.photos.length) + "</div></li>";
    }).join("") + "</ul>";
    h += storiesView();
    h += '<section aria-labelledby="flt-coll-h"><h3 class="flt-h3" id="flt-coll-h">Another collection</h3>' +
      '<p class="flt-note">A folder of photos in the repo, listed here to add from, arrives in a later change.</p></section>';
    return h;
  }
  function listWords(a) {
    if (a.length < 2) return a.join("");
    return a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
  }

  function sierraView() {
    var h = '<p class="flt-p">Sierra shows no images for now (Sam, 2026-11-12). Her page has shown none since 2026-10-24, when it took the ' +
      "Library’s look: a white page with starter questions where the paintings were, and the CPL Initiative logo in the footer.</p>" +
      '<p class="flt-p">The works below are the set that would play if paintings return. Their images sit in the repo beside the list ' +
      "(sierra/art/), so the public page would load nothing from another site.</p>" +
      '<p class="flt-note">This set is held, so it takes no marks.</p>';
    var d = state.sierra;
    if (!d) {
      return h + (state.sierraErr ? '<p class="flt-err">Sierra’s list could not be read (' + esc(state.sierraErr) + ").</p>"
        : '<p class="flt-note" role="status">Reading Sierra’s list…</p>');
    }
    h += '<ul class="flt-grid" data-grid="sierra">' + d.paintings.map(function (p, i) {
      return '<li class="flt-card" data-sierra="' + esc(p.slug) + '">' +
        '<img src="' + esc(SIERRA_DIR + p.slug + "-800.webp") + '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">' +
        '<div class="flt-body"><p class="flt-pos">Number ' + (i + 1) + " of " + d.paintings.length + "</p>" +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="flt-meta">' + esc(p.artist) + ", " + esc(p.year) + "</p>" +
        '<p class="flt-meta">' + esc(p.collection) + "</p>" +
        '<p class="flt-alt">Description: ' + esc(p.alt) + "</p></div></li>";
    }).join("") + "</ul>";
    return h;
  }

  /* ── render ─────────────────────────────────────────────────────────── */
  function rootEl() { return document.getElementById("first-light-root"); }
  function render() {
    var el = rootEl();
    if (!el) return;
    ensureCss();
    el.removeAttribute("style");
    var h = '<h2 class="flt-h">First Light</h2>';
    if (!signedIn()) {
      el.innerHTML = h + '<div class="flt-gate"><p class="flt-p">This tab lists the daily paintings and the photos that cycle on COBI’s views. ' +
        "It opens with a personal sign-in.</p><div class=\"flt-signin\"></div></div>";
      try {
        var host = el.querySelector(".flt-signin");
        if (host && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
          window.CPL_REVIEWER_SIGNIN.mountInto(host, { title: "Sign in", returnTab: TAB });
        }
      } catch (e) { /* the sentence above still stands on its own */ }
      return;
    }
    h += viewsNav();
    if (state.view === "photos") h += photosView();
    else if (state.view === "sierra") h += sierraView();
    else h += paintingsView();
    el.innerHTML = h;
    wireFilter(el);
    wireActs(el);
    wireImageFallback(el);
    restoreFocus(el);
    if (state.view !== "sierra" && !state.hero && !state.heroErr) loadHero().then(maybeRender);
    if (state.view !== "sierra" && !state.marks && !state.marksErr) loadMarks().then(maybeRender);
    if (state.view === "sierra" && !state.sierra && !state.sierraErr) loadSierra().then(maybeRender);
  }
  function maybeRender() { if (isActive()) render(); }
  function restoreFocus(el) {
    var f = state.focus;
    state.focus = null;
    if (!f) return;
    var t = el.querySelector(f) || el.querySelector("#flt-msg");
    if (t && typeof t.focus === "function") {
      if (!/^(BUTTON|INPUT|A|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute("tabindex", "-1");
      t.focus();
    }
  }
  function wireFilter(el) {
    var q = el.querySelector("#flt-q");
    if (q) q.addEventListener("input", function () {
      state.q = q.value;
      var F = fl();
      if (!F) return;
      var all = F.paintings, today = F.paintingForDay(F.localDayNumber());
      var shown = all.filter(function (p) { return matches(p, state.q.trim()); });
      var grid = el.querySelector("#flt-grid"), note = el.querySelector("#flt-shown");
      if (grid) grid.innerHTML = gridOf(shown, all, today);
      if (note) note.textContent = shownText(shown.length, all.length);
    });
    var cq = el.querySelector("#flt-cq");
    if (cq) cq.addEventListener("input", function () {
      state.cq = cq.value;
      var live = {};
      (baseKeys("paintings") || []).forEach(function (k) { live[k] = true; });
      var all = (state.cand || []).filter(function (c) { return !live[c.file]; });
      var shown = all.filter(function (c) { return matches(c, state.cq.trim()); });
      var grid = el.querySelector("#flt-cgrid"), note = el.querySelector("#flt-cshown");
      if (grid) grid.innerHTML = candCards(shown);
      if (note) note.textContent = candShown(Math.min(shown.length, CAND_SHOWN), shown.length, all.length);
    });
  }
  /* One delegated listener on the root: every mark is a <button data-act>. */
  function wireActs(el) {
    if (el.getAttribute("data-flt-acts") === "1") return;
    el.setAttribute("data-flt-acts", "1");
    el.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button[data-act]") : null;
      if (!b || !el.contains(b) || state.busy) return;
      var act = b.getAttribute("data-act"), set = b.getAttribute("data-set"), key = b.getAttribute("data-key"), coll = b.getAttribute("data-coll");
      var sel = key ? 'button[data-key="' + cssEsc(key) + '"]' : 'button[data-act="' + act + '"]';
      if (act === "show-cand") { state.showCand = true; state.focus = "#flt-cq"; render(); loadCand().then(maybeRender); return; }
      if (act === "show-stories") { state.showStories = true; state.focus = "#flt-st-h"; render(); loadStories().then(maybeRender); return; }
      if (act === "apply") { state.focus = "#flt-msg"; requestApply().then(maybeRender); return; }
      var row = { item_set: set, item_key: key, collection: coll };
      if (act === "drop" || act === "takeback") row.mark = "drop";
      else if (act === "keep") row.mark = "keep";
      else if (act === "add") row.mark = "add";
      else if (act === "move") {
        var inp = b.parentNode && b.parentNode.querySelector("input[data-move-for]");
        var n = inp ? parseInt(inp.value, 10) : NaN, max = inp ? parseInt(inp.getAttribute("max"), 10) : 0;
        if (!(n >= 1 && n <= max)) { state.msg = "Give a number from 1 to " + max + " to move it."; state.focus = "#flt-msg"; render(); return; }
        row.mark = "position"; row.position = n;
      } else return;
      state.focus = sel;
      postMark(row).then(maybeRender);
    });
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }
  /* An image that cannot load (the paintings come from Wikimedia Commons, which a network can block) gives way to
     a plain panel; the card's description already says what the picture shows. */
  function wireImageFallback(el) {
    if (el.getAttribute("data-flt-img") === "1") return;
    el.setAttribute("data-flt-img", "1");
    el.addEventListener("error", function (e) {
      var img = e.target;
      if (!img || img.tagName !== "IMG" || !img.parentNode) return;
      var d = document.createElement("div");
      d.className = "flt-noimg";
      d.textContent = "The image did not load on this network.";
      img.parentNode.replaceChild(d, img);
    }, true);
  }
  function isActive() {
    try { return window.CPL_TABS && typeof window.CPL_TABS.current === "function" ? window.CPL_TABS.current() === TAB : !!(rootEl() && rootEl().offsetParent !== null); }
    catch (e) { return false; }
  }
  function activate() { arrive(); render(); }

  window.addEventListener("cpl-tab-activated", function (e) {
    var t = e && e.detail && e.detail.tab;
    if (t === TAB) activate(); else away = true;
  });
  function onSession() {
    // A new sign-in reads the marks again under the new credential.
    forget();
    syncDoor(); if (isActive()) render();
  }
  window.addEventListener("cpl-session-changed", onSession);
  window.addEventListener("cpl-auth-change", onSession);

  /* ── the door in the painting-of-the-day window ─────────────────────── */
  function syncDoor() {
    var actions = document.querySelector(".cplfl-overlay .cplfl-actions");
    if (!actions) return;
    var door = document.getElementById("flt-door");
    if (!door) {
      ensureCss();
      door = document.createElement("a");
      door.id = "flt-door";
      door.className = "flt-door";
      door.href = "#" + TAB + "/paintings";
      door.textContent = "Edit the rotation";
      door.addEventListener("click", function () {
        try { if (window.CPL_FIRST_LIGHT && window.CPL_FIRST_LIGHT.close) window.CPL_FIRST_LIGHT.close(); } catch (e) { /* the link still goes */ }
      });
      var msg = actions.querySelector(".cplfl-reflect-msg");
      actions.insertBefore(door, msg || null);
    }
    door.hidden = !signedIn();
  }
  function watchWindow() {
    syncDoor();
    if (typeof window.MutationObserver !== "function" || !document.body) return;
    // The window builds its dialog the first time it opens, and toggles .open each time after.
    var seen = null;
    new window.MutationObserver(function () {
      var ov = document.querySelector(".cplfl-overlay");
      if (ov && ov !== seen) {
        seen = ov;
        new window.MutationObserver(syncDoor).observe(ov, { attributes: true, attributeFilter: ["class"] });
      }
      syncDoor();
    }).observe(document.body, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchWindow);
  else watchWindow();

  window.CPL_FIRST_LIGHT_TAB = {
    activate: activate,
    render: render,
    syncDoor: syncDoor,
    schedule: schedule,
    marks: MARKS,
    _state: state,
    HERO_URL: HERO_URL,
    SIERRA_URL: SIERRA_URL,
    MARKS_URL: MARKS_URL,
    REQ_URL: REQ_URL
  };
})(typeof window !== "undefined" ? window : null);
