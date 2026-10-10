// MAP Users on First Light (S358 UI pass, Sam's 2026-10-09 controls rule).
//
// The failures this guards, each found by the seeded sweep (a11y.config.js
// map-users-*), which the signed-out cobi sweep cannot see:
//  (a) a control labeled with an emoji (💾 📇 👥 ✏️ 📣) instead of a word
//  (b) a raw hex in the tab's injected CSS, or ink that is not --white on the
//      --seal-blue ground (--on-accent turns dark in dark mode: 1.43:1)
//  (c) a boxed or filled control: controls are underlined words, 24px tall
//  (d) a lens toggle whose selected state is shown by fill alone
//  (e) a wide table pushing the page sideways on a phone: each sits in a named,
//      focusable region that scrolls below 560px
//  (f) the search box hiding its focus ring
const fs = require("fs");
const { JSDOM } = require("jsdom");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const SRC = fs.readFileSync("map_users.js", "utf8");

function makeWin() {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="map-users-root"></div></body></html>',
    { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.localStorage.setItem("cpl_team_pass", "p");
  w.fetch = function () { return Promise.resolve({ ok: true, json: function () { return Promise.resolve([]); } }); };
  const el = w.document.createElement("script");
  el.textContent = SRC;
  w.document.body.appendChild(el);
  return w;
}

const PICTO = /\p{Extended_Pictographic}/u;
// The marks Sam ruled to keep (CLAUDE.md, "THE SWEEP IS CLOSED AT 26"): not emoji.
const KEPT = /[✕⚠]/g;
function labels(root) {
  return Array.prototype.map.call(root.querySelectorAll("button, a"), function (b) { return b.textContent; });
}

const w = makeWin();
const T = w.CPL_MAP_USERS_TAB, S = T._state, root = w.document.getElementById("map-users-root");
S.summary = [{ college: "Foothill College", user_count: 3, role_mix: { Faculty: 3 } },
             { college: "Chaffey College", user_count: 2, role_mix: { Counselor: 2 } }];
S.gaps = [
  { college: "Alpha College", college_kind: "college", has_student_contact: false, proposed_source: "CPL Coordinator",
    proposed_name: "Pat Vega", proposed_email: "pat@alpha.edu", needs_ask: false, landing_page_url: "https://map.example/alpha" },
  { college: "Gamma College", college_kind: "college", has_student_contact: false, proposed_source: null,
    proposed_email: null, needs_ask: true, ask_reason: "leadership only", landing_page_url: "https://map.example/gamma" },
];
const seen = [];
["all", "gaps", "contacts"].forEach(function (lens) {
  S.lens = lens;
  S.propEdit = lens === "gaps" ? T._ckey("Alpha College") : null;
  T.render(root);
  seen.push.apply(seen, labels(root));
  const on = root.querySelector(".mapu-lensbtn.on");
  check("(d) " + lens + ": the selected lens says so with aria-pressed",
    on && on.getAttribute("aria-pressed") === "true"
      && root.querySelectorAll('.mapu-lensbtn[aria-pressed="false"]').length === 2);
  Array.prototype.forEach.call(root.querySelectorAll("table.mapu-table"), function (t) {
    if (t.parentElement.closest(".mapu-table")) return;          // a roster nested in a row
    const box = t.parentElement;
    check("(e) " + lens + ": " + t.className + " sits in a named, focusable region",
      box.classList.contains("mapu-scroll") && box.getAttribute("role") === "region"
        && box.getAttribute("tabindex") === "0" && !!box.getAttribute("aria-label"));
  });
});
const bad = seen.filter(function (t) { return PICTO.test(t.replace(KEPT, "")); });
check("(a) every control is a word: " + (bad.join(" | ") || "none with an emoji"), seen.length > 10 && !bad.length);
check("(a) the source holds no escaped emoji label", !/\\u\{1F[0-9A-F]{3}\}/i.test(SRC));

const css = (w.document.getElementById("map-users-css") || {}).textContent || "";
check("the tab injects its CSS", css.length > 1000);
check("(b) no raw hex in the injected CSS: " + ((css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).join(" ") || "none"),
  !/#[0-9a-fA-F]{3,8}\b/.test(css));
check("(b) ink on the --seal-blue ground is --white, never --on-accent",
  !/--seal-blue\);[^}]*color: ?var\(--on-accent\)/.test(css));
const btn = (css.match(/\.mapu-rosterbtn \{[^}]*\}/) || [""])[0];
check("(c) a control is an underlined word: no border, no fill, cobalt, 24px tall",
  /border:0/.test(btn) && /background:none/.test(btn) && /text-decoration:underline/.test(btn)
    && /var\(--cobalt\)/.test(btn) && /min-height:24px/.test(btn));
check("(c) the lead action is no longer a filled button",
  !/\.mapu-pick-go \{[^}]*background/.test(css));
check("(e) the regions scroll below 560px", /@media \(max-width: 560px\) \{ \.mapu-scroll \{ overflow-x:auto; \} \}/.test(css));
check("(f) the search box keeps its focus ring", !/input\.q:focus \{[^}]*outline: ?none/.test(css));

let pass = 0;
results.forEach(function (r) { if (r[1]) pass++; else console.log("FAIL " + r[0]); });
console.log("map_users_first_light: " + pass + "/" + results.length + " passed");
if (pass !== results.length) process.exit(1);
