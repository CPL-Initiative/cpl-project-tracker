// Annual Workplan Goals, the S375 UI pass — the real renderer's markup, then the
// editor driving it in jsdom.
//
// The S372 audit of the tab found what `npm run a11y` passes but a reader still hits:
//   (a) no editable value was reachable by keyboard (no tabindex, no Enter): WCAG 2.1.1,
//       Level A — the first fix;
//   (b) no header carried scope, and the sub-activity names were not row headers;
//   (c) 715 raw hexes in the table's inline styles, which also beat any media query,
//       so the phone width showed only Sub-Activity, Type and part of 2025-26;
//   (d) Goal and Stretch on a gray fill that read disabled, Current in green (green is
//       for a state the user must act on), and no at-rest cue for an editor;
//   (e) an empty description printed "—": a reader learns nothing, an editor is not
//       invited to add one;
//   (f) the live Current in a filled blue badge, and Unlock editing a boxed button
//       (controls are underlined words, Sam 2026-10-09).
// The renderer is run for real (python3, openpyxl stubbed: the table needs none of it),
// so a markup change that breaks the editor fails here, not on the published page.
//
// Run from repo root: `npm test` (or `node tests/annual_goals_ui_pass.test.js`).
const fs = require("fs");
const { spawnSync } = require("child_process");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

const PY = `
import sys, types, json
sys.modules.setdefault("openpyxl", types.SimpleNamespace(load_workbook=None))
sys.path.insert(0, ".")
import excel_to_dashboard as gen
YK = ["yr_2025_26", "yr_2026_27", "yr_2027_28", "yr_2028_29", "yr_2029_30"]
ACTS = {"1": "Activity 1: Infrastructure", "4": "Activity 4: Sprints and Partnerships"}
PROJ = [("1.1", "Platform build", "1", "Builds the platform."),
        ("4.1", "Veteran Sprint", "4", ""),
        ("4.1.1", "29 Palms", "4", "")]
def pair(aid, name, kind, vals):
    out = []
    for rt in ("GOAL", "STRETCH"):
        r = dict(zip(YK, vals)); r.update({"activity_id": aid, "name": name, "row_type": rt,
                  "kind": kind, "description": "", "current": None})
        out.append(r)
    return out
rows = []
for aid, nm in ACTS.items():
    rows += pair(aid, nm, "activity", [0] * 5)
for pid, nm, _, _ in PROJ:
    rows += pair(pid, nm, "project", [1, 2, 3, 4, 5])
projects = [{"id": p, "name": n, "activity": ACTS[h], "description": d, "kpi_metric": 0}
            for p, n, h, d in PROJ]
assoc = [{"project_id": p, "activity_id": h, "is_primary": True} for p, _, h, _ in PROJ]
_, _, ag = gen.build_workplan_goals_from_supabase(rows, assoc, projects)
for r in ag:
    if r["id"] == "4.1":
        r["current_source"] = "live"; r["current_live_display"] = "60"; r["current_as_of"] = "2026-10-12"
print(gen.render_annual_goals_table_html(ag, [{"id": k, "name": v} for k, v in ACTS.items()]))
`;
const run = spawnSync("python3", ["-c", PY], { encoding: "utf8" });
const HTML = run.stdout || "";
check("the renderer runs (python3, openpyxl stubbed)", run.status === 0 && /Annual Workplan Goals/.test(HTML));
if (run.status !== 0) console.log(run.stderr);

// ── (b) headers ──
const dom0 = new JSDOM("<!doctype html><body>" + HTML + "</body>");
const t0 = dom0.window.document;
const colHeads = t0.querySelectorAll("thead th");
check("(b) every column header carries scope=col",
  colHeads.length === 8 && Array.prototype.every.call(colHeads, (th) => th.getAttribute("scope") === "col"));
const groups = t0.querySelectorAll("table > tbody");
check("(b) each Activity is its own tbody, headed by a rowgroup th",
  groups.length === 2 && Array.prototype.every.call(groups, (tb) => {
    const h = tb.querySelector("tr:first-child > th");
    return h && h.getAttribute("scope") === "rowgroup" && h.getAttribute("colspan") === "8";
  }));
const names = t0.querySelectorAll("th.wpg-name");
check("(b) each sub-activity name is a row header spanning its three rows",
  names.length === 3 && Array.prototype.every.call(names, (th) =>
    th.getAttribute("scope") === "row" && th.getAttribute("rowspan") === "3"));
const types = t0.querySelectorAll("th.wpg-type");
check("(b) each Goal, Current and Stretch label is a row header",
  types.length === 9 && Array.prototype.every.call(types, (th) => th.getAttribute("scope") === "row"));

// ── (c) no raw color, classes the CSS can reach ──
check("(c) no raw hex anywhere in the table", !/#[0-9A-Fa-f]{3,8}\b/.test(HTML));
const styled = HTML.match(/style="[^"]*"/g) || [];
check("(c) the only inline style left is the nesting indent",
  styled.length === 1 && /^style="--wpg-indent:[\d.]+rem"$/.test(styled[0]));
const vals = t0.querySelectorAll("td.wpg-val");
check("(c) every value cell carries its column label for the phone card",
  vals.length === 3 * 3 * 6 && Array.prototype.every.call(vals, (td) => !!td.getAttribute("data-label")));
check("(c) the labels are the short years and Total",
  Array.prototype.slice.call(vals, 0, 6).map((td) => td.getAttribute("data-label")).join(",") ===
    "25-26,26-27,27-28,28-29,29-30,Total");

// ── (e) the empty description ──
const emptyDesc = t0.querySelector('[data-desc-edit="1"][data-pid="4.1"]');
check("(e) an empty description renders hidden, with no dash", emptyDesc && emptyDesc.hidden &&
  emptyDesc.textContent === "" && !/&mdash;|—/.test(emptyDesc.outerHTML));
check("(e) a filled description renders as written",
  /Builds the platform\./.test(t0.querySelector('[data-desc-edit="1"][data-pid="1.1"]').textContent));

// ── (f) the live note ──
const live = t0.querySelector(".wpg-live-badge");
check("(f) the live Current says where it comes from in words", live && live.textContent === "live, as of 2026-10-12");

// ── the editor on that markup ──
const SRC = fs.readFileSync("workplan_goals.js", "utf8");
const ASSOC = fs.readFileSync("assoc_editor.js", "utf8");

function makeDom(signedIn, withPhrase) {
  const dom = new JSDOM("<!doctype html><html><head></head><body>" +
    '<div id="tab-workplan-goals">' + HTML + "</div></body></html>",
    { runScripts: "outside-only", url: "https://cpl-initiative.github.io/cpl-project-tracker/" });
  const w = dom.window;
  if (signedIn) {
    w.sessionStorage.setItem("cpl_sb", JSON.stringify({ access_token: "aaaa.bbbb.cccc", email: "map@rccd.edu" }));
  }
  w.fetch = function () {
    return Promise.resolve({ ok: true, status: 200,
      json: function () { return Promise.resolve([]); }, text: function () { return Promise.resolve(""); } });
  };
  if (withPhrase) {
    // The shared row as team_phrase.js builds it: a boxed button with inline style.
    w.CPL_TEAM_PHRASE = { session: function () { return null; }, clear: function () {},
      decorateHeaders: function () {}, unlockRow: function () {
      const s = w.document.createElement("span");
      const i = w.document.createElement("input"); i.type = "password";
      const b = w.document.createElement("button"); b.textContent = "Unlock editing";
      b.style.cssText = "padding:4px 10px;border:1px solid red;";
      s.appendChild(i); s.appendChild(b); return s;
    } };
  }
  w.eval(ASSOC);
  w.eval(SRC);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return dom;
}
function key(w, node, k) { node.dispatchEvent(new w.KeyboardEvent("keydown", { key: k, bubbles: true })); }

(async function () {
  // Signed out: nothing is a control, and the empty description stays hidden.
  let dom = makeDom(false, true), w = dom.window, doc = w.document;
  const goal = () => doc.querySelector('td[data-editable="1"][data-aid="1.1"][data-rt="GOAL"][data-yr="2025-26"]');
  check("(a) signed out: a value takes no Tab stop", goal() && !goal().hasAttribute("tabindex"));
  check("(a) signed out: the chip line is not a button",
    !doc.querySelector('[data-assoc-edit="1"]').hasAttribute("role"));
  check("(e) signed out: the empty description stays hidden",
    doc.querySelector('[data-desc-edit="1"][data-pid="4.1"]').hidden);
  const ub = doc.querySelector(".wpg-auth-widget .wpg-btn:not(.wpg-btn-add)");
  const unlock = Array.prototype.find.call(doc.querySelectorAll(".wpg-auth-widget button"),
    (b) => b.textContent === "Unlock editing");
  check("(f) Unlock editing is an underlined word: the wpg-btn class, its box style removed",
    unlock && unlock.className === "wpg-btn" && !unlock.hasAttribute("style"));
  check("(a) the sign-in email field is named", !!doc.querySelector('.wpg-auth-widget input[type="email"]').getAttribute("aria-label"));

  // Signed in.
  dom = makeDom(true, false); w = dom.window; doc = w.document;
  const g = goal();
  check("(a) an editor reaches each value by Tab", g.getAttribute("tabindex") === "0");
  check("(a) ...and the value keeps its cell role, so its headers still name it", !g.hasAttribute("role"));
  const title = doc.querySelector('[data-title-edit="1"][data-pid="1.1"]');
  check("(a) a name is a button an editor reaches by Tab",
    title.getAttribute("tabindex") === "0" && title.getAttribute("role") === "button");
  const cur = doc.querySelector('[data-current-edit="1"][data-aid="1.1"]');
  check("(a) a manual Current is reachable too", cur && cur.getAttribute("tabindex") === "0");
  check("(a) a live Current is not an edit target", !doc.querySelector(".wpg-live").hasAttribute("tabindex"));

  g.focus();
  key(w, g, "Enter");
  const input = g.querySelector("input");
  check("(a) Enter on a focused value opens its editor", !!input);
  check("(a) the field says what it edits", input && input.getAttribute("aria-label") === "Goal 2025-26 for 1.1");
  check("(a) the field has focus", doc.activeElement === input);
  key(w, input, "Escape");
  await new Promise((r) => setTimeout(r, 5));  // the return of focus is deferred one tick
  check("(a) Escape closes the field and focus returns to the value", !g.querySelector("input") && doc.activeElement === g);
  // Chrome fires the removed field's blur, and blur commits: a second close must be a
  // no-op, not a second restore (which threw "node to be removed is no longer a child").
  g.focus(); key(w, g, "Enter");
  const again = g.querySelector("input");
  again.dispatchEvent(new w.Event("blur"));
  check("(a) a blur with nothing typed closes the field, value unchanged", !g.querySelector("input") && g.textContent === "1");
  let threw = null;
  try { again.dispatchEvent(new w.Event("blur")); } catch (e) { threw = e; }
  check("(a) ...and a second blur is a no-op", !threw && g.textContent === "1");

  title.focus();
  key(w, title, " ");
  check("(a) Space on a name opens the name editor", !!title.querySelector("input"));
  key(w, title.querySelector("input"), "Escape");

  const desc = doc.querySelector('[data-desc-edit="1"][data-pid="4.1"]');
  check("(e) an editor sees Add description where the description is empty",
    !desc.hidden && desc.textContent === "Add description" && desc.classList.contains("wpg-empty"));
  desc.focus();
  key(w, desc, "Enter");
  const ta = desc.querySelector("textarea");
  check("(e) the prompt opens an empty field (the prompt is never saved as text)", ta && ta.value === "");
  key(w, ta, "Escape");
  check("(e) Escape puts the prompt back", desc.textContent === "Add description");

  // The chip line (assoc_editor.js).
  const chips = doc.querySelector('[data-assoc-edit="1"][data-pid="1.1"]');
  check("(a) the chip line is a button an editor reaches by Tab",
    chips.getAttribute("tabindex") === "0" && chips.getAttribute("role") === "button");
  chips.focus();
  key(w, chips, "Enter");
  const pop = doc.querySelector(".wpg-assoc-pop");
  check("(a) Enter on the chip line opens its popover", !!pop);
  check("(a) ...with focus inside it (it sits at the end of the page)", pop && pop.contains(doc.activeElement));
  key(w, doc.activeElement, "Escape");
  check("(a) Escape closes it and focus returns to the chip line",
    !doc.querySelector(".wpg-assoc-pop") && doc.activeElement === chips);

  // ── (c, d) the injected CSS ──
  const css = doc.getElementById("wpg-editor-styles").textContent;
  const rule = (sel) => { const m = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\{([^}]*)\\}")); return m ? m[1] : ""; };
  check("(d) Current is plain ink, not green", /color:var\(--text-strong\)/.test(rule(".wpg-annual-table .wpg-r-current")) &&
    !/green|hunter/.test(rule(".wpg-annual-table .wpg-r-current")));
  check("(d) no row sits on the gray fill", !/bg-off-white|paper/.test(css));
  check("(d) an editable value has an at-rest cue", /box-shadow:inset 0 -1px 0 var\(--cobalt\)/.test(rule(".wpg-annual-table td.wpg-editable")));
  check("(d) a focused value shows a focus ring", /outline:2px solid var\(--focus-ring\)/.test(rule(".wpg-editable:focus-visible")));
  check("(c) below 560px each sub-activity is a card (a grid row, the year above each Goal value)",
    /@media \(max-width: 560px\)/.test(css) && /\.wpg-annual-table \.wpg-r \{ ?display:grid/.test(css) &&
    /\.wpg-r-goal \.wpg-val::before \{ ?content:attr\(data-label\)/.test(css));
  check("(c) on the phone the column headers stay in the page, visually hidden",
    /\.wpg-annual-table thead \{[^}]*clip-path:inset\(50%\)/.test(css) && !/thead \{[^}]*display:none/.test(css));
  check("(f) the live note is muted words, never a filled badge",
    /color:var\(--text-muted\)/.test(rule(".wpg-live-badge")) && !/background/.test(rule(".wpg-live-badge")));
  check("(c) the injected CSS carries no raw hex", !/#[0-9A-Fa-f]{3,8}\b/.test(css.slice(css.indexOf(".wpg-annual {"))));

  let fail = 0;
  results.forEach(([n, ok]) => { console.log((ok ? "PASS  " : "FAIL  ") + n); if (!ok) fail++; });
  console.log("\n" + (results.length - fail) + "/" + results.length + " checks passed");
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  // A crash (an element the old markup lacks) still prints what ran, and fails.
  results.forEach(([n, ok]) => console.log((ok ? "PASS  " : "FAIL  ") + n));
  console.log("FAIL  the run stopped early: " + (e && e.message));
  process.exit(1);
});
