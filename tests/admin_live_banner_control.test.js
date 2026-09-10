// DR-26 — the live-session banner control on the Admin tab (Sam, 2026-09-08).
//
// He asked for a toggle so he can turn the banner on himself instead of asking
// a session to write the row.
//
// ⚠️ THE CONTROL CANNOT SHARE A SESSION, AND MUST SAY SO. A Claude Code cloud
// session's visibility is a claude.ai control on the session itself; nothing in
// COBI can reach it. The failure this guards against is a curator flipping the
// banner on for a session that is still Private and pointing the whole
// organization at a link only its author can open. So the copy carries the
// instruction at the point of use, and the client refuses a link that is not a
// claude.ai session before it ever reaches the table.
//
// Run from repo root: `node tests/admin_live_banner_control.test.js`.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.dirname(__dirname);
const SRC = fs.readFileSync(path.join(ROOT, "admin.js"), "utf8");
const results = [];
const check = (name, cond, why) => results.push([name, !!cond, why]);

// The copy: the one instruction a curator must not miss.
check("the control tells the curator to set Team visibility FIRST",
  /Set the session to Team visibility in claude\.ai\s*'?\s*\+?\s*'?first/.test(SRC) ||
  /Set the session to Team visibility in claude\.ai/.test(SRC));
check("⭐ and says plainly that it announces a session rather than sharing one",
  /it cannot share one/.test(SRC));

// The refusal, client-side, before the write.
check("⭐ it refuses a link that is not a claude.ai session",
  /if \(on && !\/\^https:\\\\\/\\\\\/claude\\\\\.ai\\\\\/code\\\\\/\[A-Za-z0-9_-\]\+\/\.test\(url\)\)/.test(SRC) ||
  /claude\\\.ai\\\/code\\\/\[A-Za-z0-9_-\]\+/.test(SRC));
check("and the refusal explains what to do instead of just failing",
  /Copy it from the session's address bar/.test(SRC));

// Turning it OFF must clear the link, not just flip a flag: a row that keeps a
// stale url is one accidental toggle away from re-announcing a dead session.
check("⭐ hiding the banner clears the link and the expiry, not just the flag",
  /active: false, session_url: null, expires_at: null/.test(SRC));

// Every banner carries an expiry, so a forgotten one clears itself.
check("turning it on always sets an expiry",
  /expires_at: new Date\(Date\.now\(\) \+ hrs \* 3600000\)/.test(SRC));
check("the expiry choices are bounded hours, not an open field",
  /<option value="2">2 hours<\/option>/.test(SRC) && /<option value="8">8 hours<\/option>/.test(SRC));

// It writes through the signed-in reviewer's token, not anon: the table's RLS
// only accepts `authenticated`, so an anon PATCH would fail confusingly.
check("the write goes out with the reviewer's auth headers",
  /method: "PATCH"[\s\S]{0,400}?authHeaders\(\)/.test(SRC));
check("it PATCHes the one row, never the collection",
  /LIVE_REST \+ "\?id=eq\.1"/.test(SRC));

// A failed save says what to do; a curator who sees nothing assumes it worked.
check("a failed save tells the curator to sign in rather than failing silently",
  /Could not save \(/.test(SRC) && /Sign in on this tab/.test(SRC));

// Every control is a word (the glyph rule).
check("the buttons are words",
  /Show the banner/.test(SRC) && /Hide it/.test(SRC));

// ── and what the section actually does, not just what the source says ───────
// The regexes above pin the copy and the shapes; these run the code. Without
// them a rename could keep every string and still ship a section that throws.
const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',
  { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.org/index.html" });
dom.window.fetch = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve([]) });
let A = null;
try { dom.window.eval(SRC); A = dom.window.CPL_ADMIN_TAB; } catch (e) { /* reported below */ }
check("admin.js evaluates and exports the control", !!(A && A._liveHtml && A._saveLive));

if (A && A._liveHtml) {
  const host = dom.window.document.getElementById("host");
  A._setLiveRow(null);
  host.innerHTML = A._liveHtml();
  check("with no row it renders the section and reads 'not showing'",
    !!host.querySelector(".adm-live") && !!host.querySelector("#adm-live-url") &&
    /not showing/.test(host.textContent));

  // ⭐ the refusal, exercised rather than grepped
  host.querySelector("#adm-live-url").value = "https://evil.example/x";
  A._saveLive(true, host);
  check("⭐ a foreign link is refused before any write",
    /not a claude\.ai session link/.test(host.querySelector("#adm-live-msg").textContent),
    host.querySelector("#adm-live-msg").textContent);

  // ⭐ an expired row must not read as live — a stale claim is the whole risk
  A._setLiveRow({ active: true, session_url: "https://claude.ai/code/session_x",
                  expires_at: new Date(Date.now() - 1000).toISOString() });
  host.innerHTML = A._liveHtml();
  check("⭐ an expired row reads 'not showing' and says the link expired",
    /not showing/.test(host.textContent) && /the link expired/.test(host.textContent));

  A._setLiveRow({ active: true, session_url: "https://claude.ai/code/session_x",
                  expires_at: new Date(Date.now() + 3600000).toISOString() });
  host.innerHTML = A._liveHtml();
  check("a live row reads 'showing' with its expiry",
    /showing/.test(host.textContent) && !/not showing/.test(host.textContent));
}

// ─── DR-26 Option B: the auto-announce opt-out (Sam, 2026-09-10) ────────────
// He reversed the 2026-09-08 ruling: a session announces itself now, and the
// manual Show/Hide is the fallback rather than the path. What he actually asked
// for — "automatic as long as I set the CC session public" — CANNOT be built,
// because nothing exposes a session's visibility. So the banner may point at a
// Private session, and these checks pin the two things that keep that honest:
// the control admits it, and the preference saves WITHOUT touching the banner.
check("the opt-out exists and is a checkbox, not another button to forget",
  /id="adm-live-auto"/.test(SRC) && /type="checkbox"/.test(SRC));
check("⭐ it admits the thing it cannot check — that the session may still be Private",
  /cannot tell whether you have shared/i.test(SRC));
check("a row written before the column existed reads as ON (the column default)",
  /auto_announce !== false/.test(SRC));
check("the panel actually reads the column back",
  /select=[^"']*auto_announce/.test(SRC));
// ⚠️ Ticking the box must not re-announce a stale link and unticking must not
// take a live banner down, so the preference has its OWN write. If this ever
// folds into saveLive() the two actions become one and both get it wrong.
check("⭐ the preference saves on its own, not through saveLive()",
  // ⚠️ anchored on the paren: /function saveAutoAnnounce/ alone also matches
  // `function saveAutoAnnounceX`, so the first version of this check passed
  // against a rename that had removed the function it was guarding.
  /function saveAutoAnnounce\s*\(/.test(SRC)
  && /\bsaveAutoAnnounce\(auto\.checked/.test(SRC));
check("a failed save puts the box back rather than lying about it",
  /box\.checked = !want/.test(SRC));

// The hook can only ever be a HINT: the container knows a different UUID than
// the claude.ai id, and the sandbox cannot reach Supabase. Both are recorded in
// the script itself, and the settings entry is what makes it fire at all.
const HINT = fs.readFileSync(path.join(ROOT, "scripts/announce_session_hint.py"), "utf8");
const SETTINGS = fs.readFileSync(path.join(ROOT, ".claude/settings.json"), "utf8");
check("the SessionStart hook is registered, or the hint never fires",
  /announce_session_hint\.py/.test(SETTINGS));
check("the hint tells the session to check the opt-out FIRST",
  /auto_announce/.test(HINT) && /STOP/.test(HINT));
check("⭐ the hint keeps the opt-out in the UPDATE too — Sam curates live beside sessions",
  /and auto_announce is true/.test(HINT));

let pass = 0;
for (const [n, ok, why] of results) {
  console.log((ok ? "PASS" : "FAIL") + "  " + n + (!ok && why ? "  — " + why : ""));
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
