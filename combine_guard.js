/* combine_guard.js — the graded and cert-based guard on a credential combine, shared by every surface that writes one.

   Sam's two groups (2026-11-17: "Keep Cx and portfolio together since they function the same and result in a letter
   grade"): graded is Credit By Exam and Portfolio Review; cert-based is Industry Certification, Standardized Assessment,
   Military and Other. A combine inside a group goes through. A combine across them is blocked on the first press and
   written on a second press on the same surface, with an override row logged beside it. A combine where a side has no
   CPL type recorded (an entry with no group, which the nightly build writes as "CPL type not recorded", or a title the
   file does not hold) and no typed title along its chain asks the same way, as `unknown`: the first press says so, and
   a second press on the same surface writes it and logs the override with the reason "CPL type not recorded" (the
   conductor's call, S679).

   The Exhibits tab (exhibits.js: the List's Accept, the leftover row's Combine, Re-point, the related titles' Save and
   the rename batch) and the Common Exhibit Reference tab (credential_reference.js: the pending merges' Confirm merge,
   the grid's Save, Merge into this, and the issuer lane's Save and Save all) decide here, so the two tabs cannot
   disagree (S679). The leftover row's Move is not a combine: it moves one local title under another canonical title,
   with no chain to follow, so it takes the two types (typeOf), the groups test (crossesGroups), the words and the
   per-surface key from here and writes its own move override. A surface supplies the title being folded, the title picked, `nextOf(t)` (title t's saved rename, or
   ""), a store that lives for the visit, and its own name. The guard follows the picked title's chain of saved renames
   to the title the write lands on and names it, so the surface checks and writes the same title.

   It fails closed (S679, the second reader's third pass on #3477): with the CPL types file unread, the combine is held,
   with no second-press override. A failed read, or a file that answers with no CPL types, is never kept, so the next
   press fetches the file again. Loaded by both HTMLs before credential_reference.js; exhibits.js loads
   it by name when a page lacks it. Pure apart from `load`, which takes the page's fetch. */
(function (root) {
  "use strict";
  var TYPES_URL = "kb/exhibit_left_map.json";
  var FIELD_OVERRIDE = "cpl_type_group_override";
  var CHAIN_MAX = 12;
  var HELD_UNREAD = "The CPL types did not load, so this combine is held. Try again.";
  var UNKNOWN_REASON = "CPL type not recorded";

  /* The types file, read once a page while it answers. Resolves { map, error }; map is null on a miss. */
  var cache = null;
  function load(fetchFn) {
    if (cache) return Promise.resolve(cache);
    var f = fetchFn || (root && root.fetch && root.fetch.bind(root));
    if (!f) return Promise.resolve({ map: null, error: "no fetch" });
    // One trailing catch: a throw in any step, the shape check included, resolves to a miss, never to a rejection that
    // would leave a surface's button on "saving…".
    return Promise.resolve().then(function () { return f(TYPES_URL, { cache: "no-store" }); }).then(function (r) {
      if (!r || !r.ok) throw new Error(TYPES_URL + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (j) {
      if (!j || typeof j !== "object" || !j.canonicals || typeof j.canonicals !== "object") throw new Error(TYPES_URL + " carries no CPL types");
      cache = { map: j, error: "" };
      return cache;
    }).catch(function (e) { return { map: null, error: String(e && e.message || e) }; });
  }
  function loaded() { return cache ? cache.map : null; }

  /* A title's entry in the file, typed or not, or null when the file does not hold it. */
  function entryOf(map, ut) { return (map && map.canonicals && map.canonicals[ut]) || null; }
  /* A title's CPL type and group, or null when the file does not hold it or holds it with no group ("CPL type not
     recorded"). */
  function typeOf(map, ut) { var e = entryOf(map, ut); return e && e.group ? e : null; }

  /* Every title from the one named to the end of its chain of saved renames (a loop or a run past CHAIN_MAX stops). */
  function chainPath(t, nextOf) {
    var seen = {}, path = [];
    for (var k = 0; k < CHAIN_MAX && t && !seen[t]; k++) {
      seen[t] = true;
      path.push(t);
      var nx = nextOf ? nextOf(t) : "";
      if (!nx || nx === t) break;
      t = nx;
    }
    return path;
  }
  /* The type a chain carries: the last typed title along it, which reaches back to its first title. An untyped title is
     skipped, so an untyped end never hides a typed title before it. */
  function typeAlong(map, path) {
    for (var k = path.length - 1; k >= 0; k--) { var t = typeOf(map, path[k]); if (t) return { type: t, at: path[k] }; }
    return { type: null, at: null };
  }

  function groupWords(g) {
    if (g === "mixed") return "a mix of graded and cert-based types";
    return g === "graded" ? "graded (Credit By Exam or Portfolio Review)" : "cert-based (Industry Certification, Standardized Assessment, Military or Other)";
  }
  /* The result would hold both groups: null when either side's type is not recorded or both stay in one group. */
  function crossesGroups(a, b) {
    var x = a && a.group, y = b && b.group, has = {};
    if (!x || !y) return null;
    [x, y].forEach(function (g) { if (g === "mixed") { has.graded = 1; has.cert = 1; } else has[g] = 1; });
    return has.graded && has.cert ? { a: x, b: y } : null;
  }
  /* The second press that overrides the guard is armed per surface and per pair, so a block on one surface never arms a
     press on another. */
  function guardKey(surface, key) { return surface + ": " + key; }

  /* Where a fold of `from` into the picked title lands, and whether that crosses the groups. The landing title is the end
     of the picked title's chain; `path` holds every title from the pick to it. Its type is its own; a pending rename
     names a title the file does not hold yet, so an untyped landing title takes the type of the last typed title along
     the chain. `held` is set only while the file is unread. `untyped` names each side with no type along its chain (the
     source, the landing title, or both): such a combine is `unknown`. */
  function landing(map, from, pick, nextOf) {
    var path = chainPath(pick, nextOf), end = path[path.length - 1] || pick, land = typeAlong(map, path), src = typeOf(map, from);
    if (!src) src = typeAlong(map, chainPath(from, nextOf)).type;
    var held = !map ? HELD_UNREAD : "", untyped = [];
    if (!held && !src) untyped.push(from);
    if (!held && !land.type && untyped.indexOf(end) < 0) untyped.push(end);
    return { pick: pick, end: end, path: path, type: land.type, typedAt: land.at, held: held, untyped: untyped,
             cross: held || untyped.length ? null : crossesGroups(src, land.type), key: from + " -> " + end };
  }
  function blockWords(from, f, again) {
    return "Blocked: " + from + " is " + groupWords(f.cross.a) + " and the fold lands on " + f.end
      + (f.end !== f.pick ? " (" + f.pick + " is saved to become " + f.end + ")" : "") + ", which is " + groupWords(f.cross.b)
      + (f.typedAt !== f.end ? ", the type of " + f.typedAt + ", since " + f.end + " has no CPL type of its own" : "")
      + ". Sam's rule keeps these apart. " + (again || "Accept again") + " to combine them anyway; that override is logged.";
  }
  function overrideValue(from, f) { return "combine across groups: " + f.cross.a + " into " + f.cross.b + ": " + from + " -> " + f.end; }
  /* The words for a combine where a side has no CPL type recorded. */
  function unknownWords(titles) {
    return (titles.length > 1 ? titles.slice(0, -1).join(", ") + " and " + titles[titles.length - 1] + " have" : titles[0] + " has")
      + " no CPL type recorded, so this combine could join graded and cert-based records. Press again to combine.";
  }
  function unknownValue(from, f) { return "combine with " + UNKNOWN_REASON + " (" + f.untyped.join(" and ") + "): " + from + " -> " + f.end; }
  /* The override row a combine that writes carries: the crossing, the untyped side, or none. */
  function logOf(from, f) { return f.cross ? overrideValue(from, f) : f.untyped.length ? unknownValue(from, f) : null; }

  /* One combine. o: { map, from, pick, nextOf, store, surface, again } (map from load(), null when unread). Returns
       { status: "self",    words, f }    the chain lands back on `from`
       { status: "held",    words, f }    the file unread, or a side untyped; nothing is written on any press
       { status: "blocked", words, f }    the first press across the groups on this surface
       { status: "unknown", words, f }    the first press on this surface where a side has no CPL type recorded
       { status: "ok",      f, to, log }  write the rename and the merge confirm naming `to` (f.end); `log` is the
                                          override row's value when the combine crosses the groups or a side has no
                                          CPL type recorded, else null */
  function decide(o) {
    var f = landing(o.map, o.from, o.pick, o.nextOf), gk = guardKey(o.surface || "accept", f.key);
    if (f.end === o.from) return { status: "self", f: f, words: (f.end === o.pick ? o.pick + " is " + o.from + " itself" : o.pick + " is already saved to become " + o.from) + "; pick another title." };
    if (f.held) return { status: "held", f: f, words: f.held };
    if ((f.cross || f.untyped.length) && !o.store[gk]) {
      o.store[gk] = true;
      return f.cross ? { status: "blocked", f: f, words: blockWords(o.from, f, o.again) } : { status: "unknown", f: f, words: unknownWords(f.untyped) };
    }
    return { status: "ok", f: f, to: f.end, log: logOf(o.from, f) };
  }
  /* Many combines in one save, each pair [from, pick]. Any pair that lands on itself or is held holds the whole save; any
     pair that crosses the groups or has a side with no CPL type recorded holds it on the first press ("blocked" when one
     crosses, else "unknown"), and a second press writes it with one override row per such pair. o: { map, pairs, nextOf,
     store, surface, again }. Returns { status, words } to hold, or { status: "ok", logs: [[from, value]], ends } where
     ends[i] is the title pair i lands on, the title to write. */
  function decideMany(o) {
    var all = o.pairs.map(function (p) { return { from: p[0], f: landing(o.map, p[0], p[1], o.nextOf) }; });
    var self = all.filter(function (x) { return x.f.end === x.from; })[0], held = all.filter(function (x) { return x.f.held; })[0];
    if (self) return { status: "self", words: self.f.pick + " is already saved to become " + self.from + ", so " + self.from + " cannot fold into it; nothing was saved." };
    if (held) return { status: "held", words: held.f.held };
    var asks = all.filter(function (x) { return x.f.cross || x.f.untyped.length; });
    var fresh = asks.filter(function (x) { return !o.store[guardKey(o.surface, x.f.key)]; });
    if (fresh.length) {
      fresh.forEach(function (x) { o.store[guardKey(o.surface, x.f.key)] = true; });
      var fc = fresh.filter(function (x) { return x.f.cross; }), fu = fresh.filter(function (x) { return !x.f.cross; });
      var count = function (n, one, many) { return " " + n.toLocaleString("en-US") + " " + (n === 1 ? one : many); };
      var tail = fu.length ? count(fu.length, "fold has", "folds have") + " a side with no CPL type recorded." : "";
      if (fc.length) return { status: "blocked", words: blockWords(fc[0].from, fc[0].f, o.again)
        + (fc.length > 1 ? count(fc.length - 1, "more fold crosses", "more folds cross") + " the groups the same way." : "") + tail };
      return { status: "unknown", words: unknownWords(fu[0].f.untyped)
        + (fu.length > 1 ? count(fu.length - 1, "more fold has", "more folds have") + " a side with no CPL type recorded." : "") };
    }
    return { status: "ok", logs: asks.map(function (x) { return [x.from, logOf(x.from, x.f)]; }), ends: all.map(function (x) { return x.f.end; }) };
  }
  /* load() then decide(): the one call a surface makes for a combine, the file read fresh after a miss. */
  function check(o) {
    return load(o.fetch).then(function (got) { return decide(Object.assign({}, o, { map: got.map })); });
  }
  function checkMany(o) {
    return load(o.fetch).then(function (got) { return decideMany(Object.assign({}, o, { map: got.map })); });
  }

  var api = { TYPES_URL: TYPES_URL, FIELD_OVERRIDE: FIELD_OVERRIDE, HELD_UNREAD: HELD_UNREAD, UNKNOWN_REASON: UNKNOWN_REASON,
              load: load, loaded: loaded, entryOf: entryOf, unknownWords: unknownWords, typeOf: typeOf, chainPath: chainPath, typeAlong: typeAlong, groupWords: groupWords, crossesGroups: crossesGroups,
              guardKey: guardKey, landing: landing, blockWords: blockWords, overrideValue: overrideValue,
              decide: decide, decideMany: decideMany, check: check, checkMany: checkMany };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CPL_COMBINE_GUARD = api;
})(typeof window !== "undefined" ? window : null);
