// tests/workplan_goals_editor_first_light.test.js
//
// Annual Workplan Goals' editor on First Light (S364, finishing S361's pass, whose ledger
// entry left "the curator-only editing tints and the add modal's boxed buttons").
//
// The failures this guards, each found by the seeded sweeps (a11y.config.js
// workplan-goals-editor, workplan-goals-add, each in both themes), which the signed-out
// cobi sweep cannot see:
//  (a) a save tint with no ink of its own: a title cell sits in a navy row with white
//      text, and read 1.06:1 on the pale saving tint in LIGHT as well as dark
//  (b) a raw color in the editor: a hex survives only as the light fallback of a var()
//  (c) a boxed or filled control (Add new row, Sign in, Sign out, Lock, the dialog's
//      Add row and Cancel), or a glyph in a control's label (the lock emoji)
//  (d) the dialog's lead action marked by a fill: with words, the order carries it
//  (e) the dialog's radio labels 23px tall
//
// Run from repo root: `npm test` (or `node tests/workplan_goals_editor_first_light.test.js`).
const fs = require("fs");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("workplan_goals.js", "utf8");
const code = SRC.split("\n").filter(function (l) { return !/^\s*(\/\/|\*|\/\*)/.test(l); }).join("\n");

// (a)
["wpg-saving", "wpg-saved", "wpg-error"].forEach(function (c) {
  const rule = (code.match(new RegExp("\\." + c + " \\{[^}]*\\}")) || [""])[0];
  check("(a) ." + c + " sets its own ink", /color: var\(--text-strong\) !important/.test(rule));
});
check("(a) and so does everything inside a cell in a save state",
  /\.wpg-saving \*, \.wpg-saved \*, \.wpg-error \* \{ color: var\(--text-strong\) !important; \}/.test(code));
check("(a) a failed save is a red outline, never a fill that only color reads",
  /\.wpg-error \{[^}]*outline: 2px solid var\(--red-alert\)/.test(code));

// (b)
const bare = code.replace(/var\(--[a-z-]+, ?#[0-9A-Fa-f]{3,6}\)/g, "");
const hex = bare.match(/#[0-9A-Fa-f]{3,6}\b/g) || [];
check("(b) no raw hex outside a var() fallback: " + (hex.join(" ") || "none"), !hex.length);

// (c)
const word = (code.match(/\.wpg-btn, \.wpg-modal-card \.wpg-modal-actions button[^{]*\{[^}]*\}/) || [""])[0];
check("(c) the controls are underlined cobalt words, 24px tall, no border, no fill",
  /border:0 !important/.test(word) && /background:none/.test(word) && /color:var\(--cobalt\)/.test(word)
    && /min-height:24px/.test(word) && /text-decoration:underline/.test(word));
check("(c) no button carries an inline style",
  !/"class": "wpg-btn[^"]*",\s*"style"/.test(code));
check("(c) no control label carries an emoji", !/"(🔒|✓|➕)[^"]*"/u.test(code) && !/"\+ Add new row"/.test(code));
check("(c) the dialog's buttons lose their frames and fill",
  !/\.wpg-btn-cancel \{ ?background:var\(--surface-opaque\)/.test(code)
    && !/\.wpg-btn-submit \{ ?background:var\(--cobalt\)/.test(code));

// (d)
const sub = code.indexOf("actions.appendChild(btnSubmit)"), can = code.indexOf("actions.appendChild(btnCancel)");
check("(d) the dialog's lead word, Add row, comes first", sub > 0 && can > sub);

// (e)
check("(e) the dialog's radio labels are 24px tall",
  /\.wpg-modal-card \.wpg-radio-row label \{[^}]*min-height:24px/.test(code));

let pass = 0;
results.forEach(function (r) { if (r[1]) pass++; else console.log("FAIL " + r[0]); });
console.log("workplan_goals_editor_first_light: " + pass + "/" + results.length + " passed");
if (pass !== results.length) process.exit(1);
