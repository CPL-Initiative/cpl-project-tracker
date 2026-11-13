// THE GUIDE FOLLOWS THE PAGE (asked in session, 2026-11-12: "Make a note somewhere to automatically update this
// documentation whenever this page gets changed in functionality or layout").
//
// The Funding Follow-up Dashboard has a step-by-step guide with screenshots
// (https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq; Library record funding-follow-up-dashboard-guide; source in
// CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/). A note in a lane file is read only by someone who
// already thinks to look, so the reminder is this test: it reads every word a reviewer can press or read as a label
// on the dashboard (buttons, menu entries, headings, column heads, folds, status words) and compares the set with the
// one the guide was last written against. A changed control fails here and names what was added and what was removed.
//
// WHEN THIS FAILS, in the same change:
//   1. Update the guide: in the vault folder above, run capture.js to redraw the screenshots, edit the .html where a
//      step or a name changed, and publish it to the same artifact (its link stays the same).
//   2. Run `node tests/csm_workspace_guide_stamp.test.js --restamp` and commit tests/fixtures/csm_guide_stamp.json.
// A change no reader would notice still needs step 2, with a line in the commit saying the guide needed no edit.
//
// Run from repo root: `npm test` (or `node tests/csm_workspace_guide_stamp.test.js`).
const fs = require("fs");
const path = require("path");
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const ROOT = path.join(__dirname, "..");
const SRC = fs.readFileSync(path.join(ROOT, "csm_workspace.js"), "utf8");
const STAMP = path.join(__dirname, "fixtures", "csm_guide_stamp.json");
const COLLEGE = "Mt San Antonio", OTHER = "Pasadena";

const { window } = freshDom();
window.CPL_SESSION = Object.assign(window.CPL_SESSION || {}, {
  get: () => ({ access_token: "header.payload.sig", email: "co@cccco.edu" }), isFresh: () => true,
  authHeaders: () => ({ apikey: "anon", Authorization: "Bearer header.payload.sig" }) });
const doc = boot(window);
const T = window.CPL_FUNDING_TAB;
T._setElig({ coordOk: true, coord: { [COLLEGE]: true, [OTHER]: true },
  optinRow: { [COLLEGE]: { college: COLLEGE, status: "self_attested", requested_at: "2026-11-02T04:00:00Z" },
              [OTHER]: { college: OTHER, status: "confirmed", requested_at: "2026-10-30T04:00:00Z" } },
  optinReview: [{ college: COLLEGE, name: "Dana Lee", title: "Other", email: "dana@mtsac.edu", status: "self_attested", requested_at: "2026-11-02T04:00:00Z" }] });
T.render();
const pane = doc.createElement("div");
pane.id = "tab-csm-workspace";
pane.innerHTML = '<div id="csm-workspace-root"></div>';
doc.body.appendChild(pane);
window.eval(fs.readFileSync(path.join(ROOT, "college_short_names.js"), "utf8"));
window.eval(SRC);
const W = window.CPL_CSM_WORKSPACE;
W.boot();
const root = doc.getElementById("csm-workspace-root");

// Every state the guide shows: the list, a request under review, an email that is due, the two panels in the header.
const words = new Set();
const NAMES = T.csm.snapshot().rows.map((r) => r.name).filter((n) => n && n.length > 3).sort((x, y) => y.length - x.length);
const SEL = "button, option, optgroup, h1, h2, h3, h4, th, summary, label, .pill, .lab, .k, dt";
function read() {
  Array.prototype.forEach.call(root.querySelectorAll(SEL), (el) => {
    const own = el.tagName === "OPTGROUP" ? el.getAttribute("label") : el.tagName === "LABEL" || el.tagName === "TH"
      ? Array.prototype.filter.call(el.childNodes, (n) => n.nodeType === 3).map((n) => n.textContent).join(" ") : el.textContent;
    // A college's name, a count and a date are data, not a control: digits go, and a list row is skipped below.
    // The funding tab's condition labels are a curator's words, so the conditions panel's own headings are left out too.
    let t = String(own || "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
    NAMES.forEach((n) => { if (t.indexOf(n) >= 0) t = t.split(n).join("(college)"); });
    if (t && t.length <= 90 && t !== "(college)" && !el.closest(".row") && !el.closest(".tplhist") && !el.closest(".condx") && !/^#$/.test(t)) words.add(el.tagName.toLowerCase() + ": " + t);
  });
}
function show(view, sel, side) { const st = W._state; st.view = view; st.sel = sel || null; st.side = side || ""; W.paint(); read(); }
show("open", COLLEGE);
show("ready", OTHER);
show("notyet", null);
show("open", COLLEGE, "people");
show("open", COLLEGE, "log");
const press = (q) => { const b = root.querySelector(q); if (b) b.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); read(); };
press('[data-condx="open"]'); press('[data-condx="close"]');
press("[data-tplopen]"); press("[data-tplopen]");
press('[data-fund="open"]');

const now = Array.from(words).sort();
if (process.argv.indexOf("--restamp") >= 0) {
  fs.writeFileSync(STAMP, JSON.stringify({ note: "The dashboard's controls and labels as the guide was last written against them. See tests/csm_workspace_guide_stamp.test.js.", words: now }, null, 1) + "\n");
  console.log("Restamped " + now.length + " words. Commit tests/fixtures/csm_guide_stamp.json with the guide's update.");
  process.exit(0);
}
const was = fs.existsSync(STAMP) ? JSON.parse(fs.readFileSync(STAMP, "utf8")).words : [];
const added = now.filter((w) => was.indexOf(w) < 0), removed = was.filter((w) => now.indexOf(w) < 0);
check("G1: the reading found the page (a title, the lists, a review, an email)", now.length > 60 &&
  now.indexOf("h1: Funding Follow-up Dashboard") >= 0 && now.some((w) => /^option: Every stage/.test(w)) && now.some((w) => /^button: Accept$/.test(w)));
check("G2: ⭐ the dashboard's controls and labels are the ones the guide was written against. If this fails: update the guide " +
  "(CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/, then republish to https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq), " +
  "then run `node tests/csm_workspace_guide_stamp.test.js --restamp`",
  added.length === 0 && removed.length === 0,
  "ADDED: " + (added.join(" | ") || "none") + "  REMOVED: " + (removed.join(" | ") || "none"));
finish();
