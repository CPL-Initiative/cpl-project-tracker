// The extraction function reads an empty closed list only when the caller says it means one (version 13, S750).
//
// S748's found-pages change reads a program the state's Program Course File lists no course for from its own
// catalog page, so its request carries an empty closed list. Every version of program-requirements-extract before
// 13 answered 400 to that ("text and closed_list are both required"), so the paid read could not work as built:
// the S748 second reader's first blocking finding. Version 13 reads an empty list beside no_closed_list true.
//
// Guards the failure modes:
//   A. THE DECLARATION IS THE GUARD. An empty list beside no_closed_list true is read. An empty list without it
//      answers 400, as before; so does a missing list, a list that is no array, a declaration that is no boolean,
//      and a declaration beside courses. A caller that loses its list on the way spends no model call.
//   B. A request that sends courses is read as it always was: the same two lines in the prompt, byte for byte.
//      With no list the prompt says so in words and tells the reader to mark every course a catalog addition.
//   C. The function uses the shared check before any model call, keeps no copy of the old refusal, passes the
//      declaration to the prompt on both readers' paths, and still refuses an empty text first.
//
// MUTATIONS (run 2026-11-28 on the two files, one at a time, each restored; every one goes red, by this many checks):
//   readClosedList reads any empty list (the declaration dropped): 2.
//   readClosedList reads a declaration beside courses: 1.
//   closedListLines prints the no-list words for every request: 2.
//   closedListLines prints the list heading over an empty list (the words dropped): 2.
//   index.ts keeps its own empty-list refusal after the shared check: 1.
//   index.ts builds the Anthropic prompt without the declaration (noList not passed): 1.
//   index.ts skips the shared check's refusal: 1.
//
// The handler is TypeScript, which Node 20 (CI) cannot load, so C reads its source; the check is plain JavaScript
// in ../_shared/closed_list.mjs, which A and B run.
//
// Run: node tests/extract_closed_list_input.test.js
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }
const SHARED_PATH = "chatbox/supabase/functions/_shared/closed_list.mjs";
const SHARED = fs.readFileSync(SHARED_PATH, "utf8");
const FN = fs.readFileSync("chatbox/supabase/functions/program-requirements-extract/index.ts", "utf8");
const COURSES = [
  { code: "ACTG 121", title: "Financial Accounting", units: 4 },
  { code: "BUS. 201", title: "Business Law", units: null },
  { code: "ACTG 131" },
];

(async function () {
  const S = await import(path.resolve(SHARED_PATH));

  // ── A. the declaration is the guard ──
  {
    const ok = S.readClosedList({ closed_list: COURSES });
    check("A a request with courses is read, and says it has a list",
      ok.ok === true && ok.closed === COURSES && ok.noList === false, JSON.stringify(ok));
    const okFalse = S.readClosedList({ closed_list: COURSES, no_closed_list: false });
    check("A no_closed_list false beside courses is the same request", okFalse.ok === true && okFalse.noList === false);
    const none = S.readClosedList({ closed_list: [], no_closed_list: true });
    check("A ⭐ an empty list beside no_closed_list true is read",
      none.ok === true && Array.isArray(none.closed) && none.closed.length === 0 && none.noList === true,
      JSON.stringify(none));
    const refusals = [
      ["an empty list with no declaration", { closed_list: [] }],
      ["an empty list beside no_closed_list false", { closed_list: [], no_closed_list: false }],
      ["no closed_list at all", { text: "x" }],
      ["no closed_list, though the declaration is true", { no_closed_list: true }],
      ["a closed_list that is no array", { closed_list: "ACTG 121", no_closed_list: true }],
      ["a null closed_list", { closed_list: null }],
      ["a declaration that is no boolean", { closed_list: [], no_closed_list: "true" }],
      ["a declaration of 1", { closed_list: [], no_closed_list: 1 }],
      ["a declaration beside courses", { closed_list: COURSES, no_closed_list: true }],
    ];
    for (const [name, body] of refusals) {
      const got = S.readClosedList(body);
      check("A ⭐ refused with a 400 that names what to send: " + name,
        got.ok === false && got.status === 400 && typeof got.body.error === "string" && got.body.error.length > 20
        && got.closed === undefined, JSON.stringify(got));
    }
    check("A a body that is not an object is refused, never read",
      S.readClosedList(null).ok === false && S.readClosedList(undefined).ok === false);
    check("A only one return says ok: true",
      (SHARED.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").match(/ok: true/g) || []).length === 1);
  }

  // ── B. the prompt's lines ──
  {
    // The two lines as index.ts built them before version 13.
    const before = [
      "Closed list (code, title, units the state file stores):",
      COURSES.map((c) => `${c.code}\t${c.title ?? ""}\t${c.units ?? "units not stored"}`).join("\n"),
    ];
    const lines = S.closedListLines(COURSES, false);
    check("B ⭐ a request with courses prints the heading and the list as before, byte for byte",
      JSON.stringify(lines) === JSON.stringify(before)
      && lines[1] === "ACTG 121\tFinancial Accounting\t4\nBUS. 201\tBusiness Law\tunits not stored\nACTG 131\t\tunits not stored",
      JSON.stringify(lines));
    const none = S.closedListLines([], true);
    check("B ⭐ with no list the prompt says the state lists no course, and that every course is a catalog addition",
      none.length === 2 && /lists no course/.test(none[0]) && /catalog_addition true/.test(none[1])
      && /missing_explained empty/.test(none[1]) && none.indexOf(S.LIST_HEADING) < 0, JSON.stringify(none));
    check("B the two requests never print the same lines",
      JSON.stringify(S.closedListLines([], true)) !== JSON.stringify(S.closedListLines([], false))
      && S.closedListLines(COURSES, false)[0] === S.LIST_HEADING);
    check("B the shared file is plain JavaScript with no imports and calls nothing out",
      !/^\s*import\s/m.test(SHARED) && !/\bfetch\(/.test(SHARED) && !/Deno\./.test(SHARED));
  }

  // ── C. the function's wiring ──
  {
    check("C ⭐ the function imports the shared check and keeps no copy of the old refusal",
      /^import \{ closedListLines, readClosedList \} from "\.\.\/_shared\/closed_list\.mjs";$/m.test(FN)
      && !/!closed\.length/.test(FN) && !/both required/.test(FN));
    const handler = FN.split("Deno.serve(", 2)[1] || "";
    const text = handler.indexOf('if (!text.trim()) return reply(400, { error: "text is required" });');
    const read = handler.indexOf("const sent = readClosedList(body);");
    const refuse = handler.indexOf("if (!sent.ok) return reply(sent.status, sent.body);");
    const model = handler.indexOf("client.beta.messages.create");
    const xai = handler.indexOf("readWithXai(");
    check("C ⭐ the handler refuses an empty text, then reads the list and returns its refusal, before either reader",
      text > 0 && read > text && refuse > read && model > refuse && xai > refuse,
      [text, read, refuse, model, xai].join(","));
    const calls = handler.match(/userMessage\(([^)]*)\)/g) || [];
    check("C ⭐ both readers' prompts carry the declaration",
      calls.length === 2 && calls.every((c) => /userMessage\(body, closed, text, part, noList\)/.test(c)),
      JSON.stringify(calls));
    const message = (FN.split("function userMessage(", 2)[1] || "").split("\n}\n", 1)[0];
    check("C the prompt's closed-list lines come from the shared file alone",
      /\.\.\.closedListLines\(closed, noList\),/.test(message) && !/Closed list \(code, title/.test(FN));
    check("C a part of a record still needs courses to name: a no-list request with a part is refused",
      /const part = readPart\(body\.part, closed\.length\);/.test(handler)
      && /if \(!codes\.length \|\| codes\.length > closedCount\) return "bad";/.test(FN));
    check("C the header names version 13", /^\/\/ Version 13 \(S750, 2026-11-28\)/m.test(FN));
    const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");
    check("C the deploy list names the function and the deploy comment names the shared file",
      /options:[\s\S]*- program-requirements-extract/.test(DEPLOY) && /closed_list\.mjs/.test(DEPLOY));
  }
})().catch(function (e) { check("driver threw: " + (e && e.stack), false); }).then(function () {
  let failed = 0;
  results.forEach(function (r) { if (!r[1]) failed++; console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2])); });
  console.log("\nextract_closed_list_input.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
  process.exit(failed ? 1 : 0);
});
