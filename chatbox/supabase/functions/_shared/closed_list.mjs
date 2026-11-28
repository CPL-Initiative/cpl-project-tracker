// The closed list a caller sends to program-requirements-extract, and how the prompt names it (version 13, S750).
//
// Until version 13 the function answered 400 ("text and closed_list are both required") to an empty closed list.
// That was right while every program sent had courses in the state's Program Course File. S748's found-pages change
// (kb/_program_requirements_college.py, ncl_found_source) sends a program the file lists no course for, read from
// its own catalog page, so its closed list is empty by definition, and the paid read could not work as built (the
// S748 second reader's first blocking finding).
//
// An empty list is accepted only when the caller says it means one: no_closed_list true beside closed_list [].
// The declaration is the guard. A caller that loses its list on the way (a source filed without its courses, a key
// misspelled) still gets the 400 it got before, and a caller that declares no list while sending courses is refused
// too, so neither mistake spends a model call. Every refusal is a 400 that names what to send.
//
// With no list the prompt says so in words, in the place the list prints: every course the section prints is a
// catalog addition, and missing_explained stays empty. A request that sends courses gets the two lines it always
// got, byte for byte, so no other read's prompt moves.
//
// Plain JavaScript with no imports, so Deno (the function) and Node (tests/extract_closed_list_input.test.js) both
// load it. It only reads.

export const NO_LIST_HEADING = "Closed list: none. The state's Program Course File lists no course for this program.";
export const NO_LIST_RULE =
  "Record every course the section prints with catalog_addition true, on the course and on each alternative, and leave missing_explained empty.";
export const LIST_HEADING = "Closed list (code, title, units the state file stores):";

function refuse(error) {
  return { ok: false, status: 400, body: { error } };
}

// {ok: true, closed, noList} or {ok: false, status: 400, body: {error}}. body is the parsed request.
export function readClosedList(body) {
  const declared = body ? body.no_closed_list : undefined;
  if (declared !== undefined && declared !== null && typeof declared !== "boolean") {
    return refuse("no_closed_list must be true or false");
  }
  const noList = declared === true;
  if (!body || !Array.isArray(body.closed_list)) {
    return refuse("closed_list is required: the courses the state's Program Course File lists for the program, or [] beside no_closed_list true");
  }
  const closed = body.closed_list;
  if (!closed.length && !noList) {
    return refuse("closed_list is empty: send the program's listed courses, or no_closed_list true for a program the state lists no course for");
  }
  if (closed.length && noList) {
    return refuse(`no_closed_list is true but closed_list names ${closed.length} courses: send one or the other`);
  }
  return { ok: true, closed, noList };
}

// The lines of the user message that name the closed list.
export function closedListLines(closed, noList) {
  if (noList) return [NO_LIST_HEADING, NO_LIST_RULE];
  const list = closed
    .map((c) => `${c.code}\t${c.title ?? ""}\t${c.units ?? "units not stored"}`)
    .join("\n");
  return [LIST_HEADING, list];
}
