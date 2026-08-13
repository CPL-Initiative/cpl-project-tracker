// Lift pure functions out of the Deno edge function so Node tests can call them
// for real, instead of re-implementing them (a re-implementation drifts and
// stops guarding anything).
//
// This started life inline in tests/sierra_topic_keywords.test.js. It moved here
// when a second test file needed it, and because the stripper had to learn one
// more construct (`Map<string, any> | null`) — the note in that file said the
// answer to "hairier" is a shared module, not a smarter regex copied twice.
//
// Scope + limits: the lifted block must contain no Deno/network dependency and
// no string literal containing a `:` followed by a type-looking word. If a block
// stops lifting, fix the block boundaries — do not widen these regexes further.
// The next escalation is moving the pure functions into a real shared module
// that both the function and the tests import.

const PRIM = "(?:string|boolean|number|void|any|unknown)";
const GENERIC = "(?:Record|Set|Map|Array|Promise)";
// One level of NESTED type arguments, so `Promise<Map<string, any>>` strips.
// A flat `<[^>]+>` stops at the first `>` and leaves a stray `>` behind, which
// surfaces as `SyntaxError: Unexpected token '>'` in whichever test lifts the
// block — not as a message about the signature that actually changed.
const GEN_ARGS = "<(?:[^<>]|<[^<>]*>)*>";

// Strip TypeScript annotations generically rather than by exact signature — an
// exact-match stripper broke TWICE while the keyword block was being edited,
// each time turning real assertions into a silent lift error.
function stripTypes(block) {
  return block
    // OPTIONAL PARAMETERS: `recs?: Map<string, any>` -> `recs: Map<string, any>`,
    // which the annotation rules below then remove. Must run FIRST, or the `?`
    // outlives the annotation and lands in the evaluated source as a syntax
    // error pointing at the parameter rather than at the type.
    // Safe against ternaries (`x ? a : b` has a token between `?` and `:`) and
    // against optional chaining (`x?.y` has no colon).
    .replace(/(\w+)\?\s*:/g, "$1:")
    // new Set<string>() / new Map<string, {...}>()
    .replace(/new\s+(Set|Map)<[^>]*>/g, "new $1")
    // : Map<string, any> | null   /   : Promise<any | null>   /
    // : Promise<Map<string, any>>
    .replace(new RegExp(`:\\s*${GENERIC}${GEN_ARGS}(?:\\s*\\|\\s*(?:null|undefined))*`, "g"), "")
    // : string   /   : any[]   /   : string | null
    .replace(new RegExp(
      `:\\s*${PRIM}\\b(?:\\s*\\[\\s*\\])*(?:\\s*\\|\\s*(?:${PRIM}|null|undefined)\\b(?:\\s*\\[\\s*\\])*)*`,
      "g"), "");
}

// Evaluate the source between two markers and return the named exports.
// `startMarker` / `endMarker` are literal substrings of index.ts.
function liftBlock(src, startMarker, endMarker, names) {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker);
  if (start < 0) throw new Error(`lift: start marker not found: ${startMarker}`);
  if (end < 0) throw new Error(`lift: end marker not found: ${endMarker}`);
  if (end < start) throw new Error(`lift: end marker precedes start marker`);
  const block = stripTypes(src.slice(start, end));
  // eslint-disable-next-line no-new-func
  return new Function(`${block}\nreturn { ${names.join(", ")} };`)();
}

module.exports = { liftBlock, stripTypes };
