/* combine_guard.js — the graded and cert-based guard on a credential combine, shared by every surface that writes one.

   Sam's two groups (2026-11-17: "Keep Cx and portfolio together since they function the same and result in a letter
   grade"): graded is Credit By Exam and Portfolio Review; cert-based is Industry Certification, Standardized Assessment,
   Military and Other. A combine inside a group goes through. A combine across them is blocked on the first press and
   written on a second press on the same surface, with an override row logged beside it.

   The Exhibits tab (exhibits.js: the List's Accept, the leftover row's Combine and Move, Re-point, the related titles'
   Save and the rename batch) and the Common Exhibit Reference tab (credential_reference.js: the pending merges' Confirm
   merge, the grid's Save, Merge into this, and the issuer lane's Save and Save all) decide here, so the two tabs cannot
   disagree (S679). A surface supplies the title being folded, the title picked, `nextOf(t)` (title t's saved rename, or
   ""), a store that lives for the visit, and its own name. The guard follows the picked title's chain of saved renames
   to the title the write lands on and names it, so the surface checks and writes the same title.

   It fails closed (S679, the second reader's third pass on #3477): with the CPL types file unread, or a side with no CPL
   type along its chain of saved renames, the combine is held, with no second-press override. A failed read is never
   kept, so the next press fetches the file again. Loaded by both HTMLs before credential_reference.js; exhibits.js loads
   it by name when a page lacks it. Pure apart from `load`, which takes the page's fetch. */
(function (root) {
  "use strict";
  var TYPES_URL = "kb/exhibit_left_map.json";
  var FIELD_OVERRIDE = "cpl_type_group_override";
  var CHAIN_MAX = 12;
  var HELD_UNREAD = "The CPL types did not load, so this combine is held. Try again.";

  /* The types file, read once a page while it answers. Resolves { map, error }; map is null on a miss. */
  var cache = null;
  function load(fetchFn) {
    if (cache) return Promise.resolve(cache);
    var f = fetchFn || (root && root.fetch && root.fetch.bind(root));
    if (!f) return Promise.resolve({ map: null, error: "no fetch" });
    return Promise.resolve().then(function () { return f(TYPES_URL, { cache: "no-store" }); }).then(function (r) {
      if (!r || !r.ok) throw new Error(TYPES_URL + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (j) {
      if (!j || typeof j !== "object" || !j.canonicals || typeof j.canonicals !== "object") throw new Error(TYPES_URL + " carries no CPL types");
      cache = { map: j, error: "" };
      return cache;
    }, function (e) { return { map: null, error: String(e && e.message || e) }; });
  }
  function loaded() { return cache ? cache.map : null; }

  /* A title's CPL type and group, or null when the file does not hold it. */
  function typeOf(map, ut) { return (map && map.canonicals && map.canonicals[ut]) || null; }

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
  /* The type a chain carries: the last typed title along it, which reaches back to its first title. */
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
     of the picked title's chain. Its type is its own; a pending rename names a title the file does not hold yet, so an
     untyped landing title takes the type of the last typed title along the chain. `held` names why the combine cannot be
     checked: the file unread, or a side with no type along its chain. */
  function landing(map, from, pick, nextOf) {
    var path = chainPath(pick, nextOf), end = path[path.length - 1] || pick, land = typeAlong(map, path), src = typeOf(map, from);
    if (!src) src = typeAlong(map, chainPath(from, nextOf)).type;
    var held = !map ? HELD_UNREAD
      : !src ? "This combine is held: " + from + " has no CPL type in the types file, nor does any title its saved renames reach. "
        + "It can be combined once the nightly types file carries it."
      : !land.type ? "This combine is held: " + end + (end !== pick ? " (where " + pick + "'s saved renames land)" : "")
        + " has no CPL type in the types file, nor does any title along its saved renames. It can be combined once the nightly types file carries it."
      : "";
    return { pick: pick, end: end, type: land.type, typedAt: land.at, held: held, cross: held ? null : crossesGroups(src, land.type), key: from + " -> " + end };
  }
  function blockWords(from, f, again) {
    return "Blocked: " + from + " is " + groupWords(f.cross.a) + " and the fold lands on " + f.end
      + (f.end !== f.pick ? " (" + f.pick + " is saved to become " + f.end + ")" : "") + ", which is " + groupWords(f.cross.b)
      + (f.typedAt !== f.end ? ", the type of " + f.typedAt + ", since " + f.end + " has no CPL type of its own" : "")
      + ". Sam's rule keeps these apart. " + (again || "Accept again") + " to combine them anyway; that override is logged.";
  }
  function overrideValue(from, f) { return "combine across groups: " + f.cross.a + " into " + f.cross.b + ": " + from + " -> " + f.end; }

  /* One combine. o: { map, from, pick, nextOf, store, surface, again } (map from load(), null when unread). Returns
       { status: "self",    words, f }    the chain lands back on `from`
       { status: "held",    words, f }    the file unread, or a side untyped; nothing is written on any press
       { status: "blocked", words, f }    the first press across the groups on this surface
       { status: "ok",      f, to, log }  write the rename and the merge confirm naming `to` (f.end); `log` is the
                                          override row's value when the combine crosses the groups, else null */
  function decide(o) {
    var f = landing(o.map, o.from, o.pick, o.nextOf), gk = guardKey(o.surface || "accept", f.key);
    if (f.end === o.from) return { status: "self", f: f, words: (f.end === o.pick ? o.pick + " is " + o.from + " itself" : o.pick + " is already saved to become " + o.from) + "; pick another title." };
    if (f.held) return { status: "held", f: f, words: f.held };
    if (f.cross && !o.store[gk]) { o.store[gk] = true; return { status: "blocked", f: f, words: blockWords(o.from, f, o.again) }; }
    return { status: "ok", f: f, to: f.end, log: f.cross ? overrideValue(o.from, f) : null };
  }
  /* Many combines in one save, each pair [from, pick]. Any pair that lands on itself or is held holds the whole save; any
     pair that crosses the groups holds it on the first press, and a second press writes it with one override row per
     crossing pair. o: { map, pairs, nextOf, store, surface, again }. Returns { status, words } to hold, or
     { status: "ok", logs: [[from, value]], ends } where ends[i] is the title pair i lands on, the title to write. */
  function decideMany(o) {
    var all = o.pairs.map(function (p) { return { from: p[0], f: landing(o.map, p[0], p[1], o.nextOf) }; });
    var self = all.filter(function (x) { return x.f.end === x.from; })[0], held = all.filter(function (x) { return x.f.held; })[0];
    if (self) return { status: "self", words: self.f.pick + " is already saved to become " + self.from + ", so " + self.from + " cannot fold into it; nothing was saved." };
    if (held) return { status: "held", words: held.f.held };
    var cross = all.filter(function (x) { return x.f.cross; });
    var fresh = cross.filter(function (x) { return !o.store[guardKey(o.surface, x.f.key)]; });
    if (fresh.length) {
      fresh.forEach(function (x) { o.store[guardKey(o.surface, x.f.key)] = true; });
      var n = fresh.length - 1;
      return { status: "blocked", words: blockWords(fresh[0].from, fresh[0].f, o.again) + (n ? " " + n.toLocaleString("en-US") + " more "
        + (n === 1 ? "fold crosses" : "folds cross") + " the groups the same way." : "") };
    }
    return { status: "ok", logs: cross.map(function (x) { return [x.from, overrideValue(x.from, x.f)]; }), ends: all.map(function (x) { return x.f.end; }) };
  }
  /* load() then decide(): the one call a surface makes for a combine, the file read fresh after a miss. */
  function check(o) {
    return load(o.fetch).then(function (got) { return decide(Object.assign({}, o, { map: got.map })); });
  }
  function checkMany(o) {
    return load(o.fetch).then(function (got) { return decideMany(Object.assign({}, o, { map: got.map })); });
  }

  var api = { TYPES_URL: TYPES_URL, FIELD_OVERRIDE: FIELD_OVERRIDE, HELD_UNREAD: HELD_UNREAD, load: load, loaded: loaded,
              typeOf: typeOf, chainPath: chainPath, typeAlong: typeAlong, groupWords: groupWords, crossesGroups: crossesGroups,
              guardKey: guardKey, landing: landing, blockWords: blockWords, overrideValue: overrideValue,
              decide: decide, decideMany: decideMany, check: check, checkMany: checkMany };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CPL_COMBINE_GUARD = api;
})(typeof window !== "undefined" ? window : null);
