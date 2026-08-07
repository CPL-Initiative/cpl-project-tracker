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

// Strip TypeScript annotations generically rather than by exact signature — an
// exact-match stripper broke TWICE while the keyword block was being edited,
// each time turning real assertions into a silent lift error.
function stripTypes(block) {
  return block
    // new Set<string>() / new Map<string, {...}>()
    .replace(/new\s+(Set|Map)<[^>]*>/g, "new $1")
    // : Map<string, any> | null   /   : Promise<any | null>
    .replace(new RegExp(`:\\s*${GENERIC}<[^>]+>(?:\\s*\\|\\s*(?:null|undefined))*`, "g"), "")
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
