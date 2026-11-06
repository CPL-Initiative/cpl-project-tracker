// Drives CPL Pathways the way a reader does in its new format (Sam, 2026-11-06: "Require college first"): choose the
// college in the College select, then press a program's title in that college's List (commons_list.js). Shared by the
// CPL Pathways tests; not a test itself (tests/run.js runs *.test.js only).
const fs = require("fs");
const LIST = fs.readFileSync("commons_list.js", "utf8");

// The List engine, as the tab's boot loads it (CPL_TABS.loadScript("commons_list.js")); the tests' loaders stub it.
function withList(w) { if (!w.CPL_COMMONS_LIST) w.eval(LIST); }
function colSelect(root) { return root.querySelector("select.cplpw-colsel"); }
function chooseCollege(w, root, college) {
  const s = colSelect(root);
  if (!s) return false;
  s.value = college;
  s.dispatchEvent(new w.Event("change", { bubbles: true }));
  return s.value === college;
}
function titleButtons(root) { return Array.from(root.querySelectorAll("#cplpw-list button.cplpwl-open")); }
function listTitles(root) { return titleButtons(root).map((b) => b.textContent); }
// college null: press the title in the List already on screen.
function openPathway(w, root, college, title) {
  if (college != null && !chooseCollege(w, root, college)) return false;
  const b = titleButtons(root).find((x) => x.textContent === title);
  if (!b) return false;
  b.dispatchEvent(new w.Event("click", { bubbles: true }));
  return true;
}
function back(w, root) {
  const b = root.querySelector("button.cplpw-back");
  if (!b) return false;
  b.dispatchEvent(new w.Event("click", { bubbles: true }));
  return true;
}
module.exports = { withList, colSelect, chooseCollege, titleButtons, listTitles, openPathway, back };
