/* combine_guard.js — the graded and cert-based guard on a credential combine, shared by every surface that writes one.

   Sam's two groups (2026-11-17: "Keep Cx and portfolio together since they function the same and result in a letter
   grade"): graded is Credit By Exam and Portfolio Review; cert-based is Industry Certification, Standardized Assessment,
   Military and Other. A combine inside a group goes through. A combine across them is blocked on the first press and
   written on a second press, with an override row logged beside it.

   The Exhibits tab (exhibits.js: the List's Accept, the leftover row's Combine and Re-point, the related titles' Save and
   the rename batch) and the Common Exhibit Reference tab (credential_reference.js: the pending merges' Confirm, the grid's
   Save, Merge into this and the issuer lane's saves) all decide here, so the two tabs cannot disagree (S679). Each surface
   supplies three things: the title being folded, the title picked, and `nextOf(t)`, the saved rename of title t (or "").
   The guard follows the picked title's chain of saved renames to the title the write lands on, reads that title's CPL type
   from kb/exhibit_left_map.json, and names the landing title, so the surface checks and writes the same title.

   It fails closed: when the types file cannot be read, every combine holds, with no second-press override, and the next
   press reads the file again. Loaded by both HTMLs before credential_reference.js; exhibits.js loads it by name when a
   page lacks it. Pure apart from `load`, which takes the page's fetch. */
(function (root) {
  "use strict";
  var TYPES_URL = "kb/exhibit_left_map.json";
  var FIELD_OVERRIDE = "cpl_type_group_override";
  var CHAIN_MAX = 12;

  /* The types file, read once a page while it answers; a failed read is never kept, so the next press tries again.
     Resolves { map } or { map: null, error }. */
  var cache = null;
  function load(fetchFn) {
    if (cache && cache.map) return Promise.resolve(cache);
    var f = fetchFn || (root && root.fetch && root.fetch.bind(root));
    if (!f) return Promise.resolve({ map: null, error: "no fetch" });
    return Promise.resolve().then(function () { return f(TYPES_URL, { cache: "no-store" }); }).then(function (r) {
      if (!r || !r.ok) throw new Error(TYPES_URL + " answered " + (r ? r.status : "nothing"));
      return r.json();
    }).then(function (j) {
      if (!j || typeof j !== "object" || !j.canonicals || typeof j.canonicals !== "object") throw new Error(TYPES_URL + " holds no CPL types");
      cache = { map: j, error: "" };
      return cache;
    }, function (e) { return { map: null, error: String(e && e.message || e) }; });
  }
  function loaded() { return cache && cache.map ? cache.map : null; }
  function reset() { cache = null; }

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
  function chainEnd(t, nextOf) { var p = chainPath(t, nextOf); return p.length ? p[p.length - 1] : t; }

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

  /* Where a fold of `from` into the picked title lands, and whether that crosses the groups. The landing title is the end
     of the picked title's chain. Its type is its own; a pending rename names a title the file does not hold yet, so an
     untyped landing title takes the type of the last typed title along the chain, which reaches back to the picked title. */
  function landing(map, from, pick, nextOf) {
    var path = chainPath(pick, nextOf), end = path[path.length - 1] || pick, at = null, type = null;
    for (var k = path.length - 1; k >= 0 && !type; k--) { type = typeOf(map, path[k]); if (type) at = path[k]; }
    if (!type) { type = typeOf(map, pick); at = type ? pick : null; }
    return { pick: pick, end: end, type: type, typedAt: at, cross: crossesGroups(typeOf(map, from), type), key: "combine " + from + " -> " + end };
  }
  function blockWords(from, f, again) {
    return "Blocked: " + from + " is " + groupWords(f.cross.a) + " and the fold lands on " + f.end
      + (f.end !== f.pick ? " (" + f.pick + " is saved to become " + f.end + ")" : "") + ", which is " + groupWords(f.cross.b)
      + (f.typedAt !== f.end ? ", the type of " + f.typedAt + ", since " + f.end + " has no CPL type of its own" : "")
      + ". Sam's rule keeps these apart. " + (again || "Accept again") + " to combine them anyway; that override is logged.";
  }
  function overrideValue(from, f) { return "combine across groups: " + f.cross.a + " into " + f.cross.b + ": " + from + " -> " + f.end; }
  function heldWords(error) {
    return "Held: the CPL types file did not load (" + (error || "no answer") + "), so the combine cannot be checked against Sam's graded and cert-based groups. Nothing was saved; press again to read it again.";
  }
  /* The second press: a surface keeps one store per visit; the first press on a crossing key arms it and blocks. */
  function firstPress(store, key) {
    if (store[key]) return false;
    store[key] = true;
    return true;
  }

  /* One combine. Resolves:
       { status: "held",    words }               the types file did not load; nothing is written
       { status: "self",    words, f }            the chain lands back on `from`
       { status: "blocked", words, f }            the first press across the groups
       { status: "ok",      f, to, log }          write the rename and the merge confirm naming `to` (f.end); when the
                                                   combine crosses the groups, `log` is the override row's value
     o: { map, from, pick, nextOf, store, again } (map from load()). */
  function decide(o) {
    if (!o.map) return { status: "held", words: heldWords(o.error) };
    var f = landing(o.map, o.from, o.pick, o.nextOf);
    if (f.end === o.from) return { status: "self", f: f, words: (f.end === o.pick ? o.pick + " is " + o.from + " itself" : o.pick + " is already saved to become " + o.from) + "; pick another title." };
    if (f.cross && firstPress(o.store, f.key)) return { status: "blocked", f: f, words: blockWords(o.from, f, o.again) };
    return { status: "ok", f: f, to: f.end, log: f.cross ? overrideValue(o.from, f) : null };
  }
  /* Many combines in one save (each pair [from, pick]): any pair that crosses the groups holds the whole save on the first
     press, and a second press writes it with one override row per crossing pair. Resolves { status: "held"|"blocked",
     words } or { status: "ok", logs: [[from, value]], landings: [f] } in the pairs' order.
     o: { map, pairs, nextOf, store, again }. */
  function decideMany(o) {
    if (!o.map) return { status: "held", words: heldWords(o.error) };
    var all = o.pairs.map(function (p) { return { from: p[0], f: landing(o.map, p[0], p[1], o.nextOf) }; });
    var cross = all.filter(function (x) { return x.f.cross; });
    var fresh = cross.filter(function (x) { return !o.store[x.f.key]; });
    if (fresh.length) {
      fresh.forEach(function (x) { o.store[x.f.key] = true; });
      var n = fresh.length - 1;
      return { status: "blocked", words: blockWords(fresh[0].from, fresh[0].f, o.again) + (n ? " " + n.toLocaleString("en-US") + " more "
        + (n === 1 ? "fold crosses" : "folds cross") + " the groups the same way." : "") };
    }
    return { status: "ok", logs: cross.map(function (x) { return [x.from, overrideValue(x.from, x.f)]; }), landings: all.map(function (x) { return x.f; }) };
  }
  /* load() then decide(): the one call a surface makes for a single combine. */
  function check(o) {
    return load(o.fetch).then(function (got) { return decide(Object.assign({}, o, { map: got.map, error: got.error })); });
  }
  function checkMany(o) {
    return load(o.fetch).then(function (got) { return decideMany(Object.assign({}, o, { map: got.map, error: got.error })); });
  }

  var api = { TYPES_URL: TYPES_URL, FIELD_OVERRIDE: FIELD_OVERRIDE, load: load, loaded: loaded, reset: reset, typeOf: typeOf,
              chainPath: chainPath, chainEnd: chainEnd, groupWords: groupWords, crossesGroups: crossesGroups, landing: landing,
              blockWords: blockWords, overrideValue: overrideValue, heldWords: heldWords, firstPress: firstPress,
              decide: decide, decideMany: decideMany, check: check, checkMany: checkMany };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.CPL_COMBINE_GUARD = api;
})(typeof window !== "undefined" ? window : null);
