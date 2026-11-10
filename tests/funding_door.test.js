// The CSM funding door (issue 2983): request, approve, and a session with no Auth email.
//
// Sam, during the MAP CSM session (2026-11-09, via COBIx on #2983): the Auth mailer is capped at two emails an hour
// for the whole project and locked the team out. A teammate asks from the sign-in box; an approver says yes in the
// CSM Workspace; the requester's open tab signs in. Sam's go in session: no phrase, approvers in an Admin table.
//
// Guards, each a way this goes wrong:
//  (a) SCOPE: the door opens the funding and CSM surfaces only. is_allowed_reviewer() is never redefined, Admin and
//      Team Phrases stay on it, and nothing is inserted into allowed_reviewers.
//  (b) NO SECRET IN THE DATABASE OR THE MAIL: the table holds the secret's SHA-256, the request answers the same way
//      for any address, nothing sends email, and no address is in the repo.
//  (c) ONE CLAIM: the Edge Function claims only an approved, unclaimed request with the secret, inside the window.
//  (d) THE APPROVERS ARE A TABLE only Sam or Malone can change, seeded with the five Sam named.
//  (e) THE SIGN-IN BOX offers Ask an approver only where asked (door: true), sends the hash and never the secret on
//      the request, and adopts the session the claim returns.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const results = [];
function check(name, cond) { results.push([name, !!cond]); }
const ROOT = path.join(__dirname, "..");
const MIG = fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-09_funding_door.sql"), "utf8");
const BACK = fs.readFileSync(path.join(ROOT, "kb/migrations/2026-11-09_funding_door_rollback.sql"), "utf8");
const FN = fs.readFileSync(path.join(ROOT, "chatbox/supabase/functions/funding-door/index.ts"), "utf8");
const SIGNIN = fs.readFileSync(path.join(ROOT, "reviewer_signin.js"), "utf8");
const SESSION = fs.readFileSync(path.join(ROOT, "cpl_session.js"), "utf8");
const DEPLOY = fs.readFileSync(path.join(ROOT, ".github/workflows/cpl-chat-deploy.yml"), "utf8");
const GOV = JSON.parse(fs.readFileSync(path.join(ROOT, "kb/governance_surface_map.json"), "utf8"));

// (a) scope
check("a1: is_allowed_reviewer() is never redefined", !/function public\.is_allowed_reviewer/.test(MIG));
check("a2: nothing is inserted into allowed_reviewers", !/insert into public\.allowed_reviewers/i.test(MIG));
const tables = (MIG.match(/tablename in \(([^)]*)\)/) || [])[1] || "";
check("a3: the policies switched are the seven funding and CSM tables, never Admin's or the phrases'",
  /cpl_funding_participation/.test(tables) && /csm_log/.test(tables) && /map_college_contacts/.test(tables) &&
  !/team_access|cobi_nav|allowed_reviewers|cpl_funding_config/.test(tables));
check("a4: the rollback switches every one back and drops what the door added",
  /replace\(p\.qual, 'is_funding_reviewer\(\)', 'is_allowed_reviewer\(\)'\)/.test(BACK) &&
  /drop table if exists public\.funding_access_requests/.test(BACK) && /drop table if exists public\.funding_approvers/.test(BACK));
// (b) no secret, no mail, no address
check("b1: the request table holds a SHA-256 hex, never the secret", /secret_hash\s+text not null check \(secret_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/.test(MIG) && !/\bsecret\s+text/.test(MIG));
check("b2: an address off the team gets the same ok, with no id", /return json_build_object\('ok', true, 'id', null\)/.test(MIG));
check("b3: the request is rate-limited, per address and overall", /interval '10 minutes'\) >= 3/.test(MIG) && /interval '1 hour'\) >= 60/.test(MIG));
check("b4: no address in the migration or the function", !/[a-z0-9._-]+@[a-z0-9-]+\.(edu|com|org|gov)/i.test(MIG + FN));
check("b5: the function sends no email: generate_link and verify, never otp or invite",
  /admin\/generate_link/.test(FN) && /auth\/v1\/verify/.test(FN) && !/auth\/v1\/otp|\/invite/.test(FN));
check("b6: the tables are closed to anon and authenticated", /revoke all on table public\.funding_access_requests from public, anon, authenticated/.test(MIG) &&
  /revoke all on table public\.funding_approvers from public, anon, authenticated/.test(MIG));
// (c) one claim
check("c1: the claim matches id, the secret's hash, approved, unclaimed and the window, in one update",
  /status=eq\.approved&claimed_at=is\.null&decided_at=gte\./.test(FN) && /secret_hash=eq\./.test(FN) && /rows\.length !== 1/.test(FN));
check("c2: the grant must still stand at claim time", /revoked_at=is\.null&expires_at=gt\./.test(FN));
check("c3: the function is in the deploy list", /- funding-door/.test(DEPLOY));
// (d) approvers
check("d1: the approvers are a table seeded with the five Sam named, by name", /create table if not exists public\.funding_approvers/.test(MIG) &&
  ["Samuel Lee", "Malone Dunlavy", "Kristen Himmerick", "Natalie Powell", "Terence Nelson"].every((n) => MIG.indexOf("'" + n + "'") >= 0));
check("d2: only an owner (Sam or Malone) changes it, and an added address must be a reviewer",
  /if not public\.is_funding_owner\(\) then return/.test(MIG) && /tm\.name in \('Samuel Lee', 'Malone Dunlavy'\)/.test(MIG) && /'not_a_reviewer'/.test(MIG));
check("d3: approving requires the reviewer list and the table", /select public\.is_allowed_reviewer\(\) and exists \(\s*select 1 from public\.funding_approvers/.test(MIG));
check("d4: the new surfaces are mapped for Governance (Rule 10 a3)",
  ["table:funding_access_requests", "table:funding_access", "function:funding-door"].every((k) => GOV.mapped[k]));

// (e) the sign-in box
function win(opts) {
  const dom = new JSDOM('<!doctype html><body><div id="m"></div></body>', { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  w.__calls = [];
  w.fetch = function (url, init) {
    w.__calls.push({ url: String(url), body: init && init.body ? JSON.parse(init.body) : null });
    if (/rpc\/funding_access_request/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, id: "11111111-2222-3333-4444-555555555555" }) });
    if (/rpc\/funding_access_status/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(opts.status || "pending") });
    if (/functions\/v1\/funding-door/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, access_token: "aaa.bbb.ccc", refresh_token: "r", expires_in: 3600 }) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  };
  Object.defineProperty(w, "crypto", { configurable: true, value: {
    getRandomValues: function (a) { for (let i = 0; i < a.length; i++) a[i] = (i * 37 + 11) & 255; return a; },
    subtle: { digest: function () { return Promise.resolve(new Uint8Array(32).fill(171).buffer); } } } });
  w.TextEncoder = w.TextEncoder || require("util").TextEncoder;
  w.__adopted = null;
  w.CPL_SESSION = { adopt: function (t) { w.__adopted = t; return true; }, get: function () { return null; } };
  w.eval(SIGNIN);
  w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
  return w;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
(async function () {
  {
    const w = win({});
    const el = w.document.getElementById("m");
    w.CPL_REVIEWER_SIGNIN.mountInto(el, { title: "Sign in" });
    check("e1: a mount not opened as a door has no Ask an approver", !el.querySelector("[data-rsi-ask]"));
    w.CPL_REVIEWER_SIGNIN.mountInto(el, { title: "Sign in", door: true });
    // Sam, 2026-11-10 ("yes to all", the clarity mock's decision 1): Ask an approver is the one lead action at the
    // door, and the email link sits one click away.
    check("e2: a door mount leads with Ask an approver; the email link is one click away, as a word",
      !!el.querySelector("[data-rsi-ask]") && !el.querySelector("[data-rsi-send]") &&
      !!el.querySelector("[data-rsi-uselink]") && el.querySelector("[data-rsi-uselink]").tagName === "BUTTON" &&
      el.querySelector("[data-rsi-uselink]").textContent === "Use an email link instead");
    {
      const w2 = win({});
      const el2 = w2.document.getElementById("m");
      w2.CPL_REVIEWER_SIGNIN.mountInto(el2, { title: "Sign in", door: true });
      const in2 = el2.querySelector("[data-rsi-email]");
      in2.value = "typed@college.edu"; in2.dispatchEvent(new w2.Event("input"));
      el2.querySelector("[data-rsi-uselink]").dispatchEvent(new w2.MouseEvent("click", { bubbles: true }));
      check("e2b: the word opens Email me a link beside Ask an approver, keeps the typed address, and leaves",
        !!el2.querySelector("[data-rsi-send]") && !!el2.querySelector("[data-rsi-ask]") &&
        !el2.querySelector("[data-rsi-uselink]") && el2.querySelector("[data-rsi-email]").value === "typed@college.edu");
      const w3 = win({});
      const el3 = w3.document.getElementById("m");
      w3.CPL_REVIEWER_SIGNIN.mountInto(el3, { title: "Sign in", door: true });
      const in3 = el3.querySelector("[data-rsi-email]");
      in3.value = "enter@college.edu"; in3.dispatchEvent(new w3.Event("input"));
      in3.dispatchEvent(new w3.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await tick(); await tick(); await tick();
      check("e2c: Enter at the door asks an approver and sends no email link",
        w3.__calls.some((c) => /funding_access_request/.test(c.url)) && !w3.__calls.some((c) => /auth\/v1\/(otp|magiclink)/.test(c.url)));
    }
    const input = el.querySelector("[data-rsi-email]");
    input.value = "someone@college.edu"; input.dispatchEvent(new w.Event("input"));
    el.querySelector("[data-rsi-ask]").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await tick(); await tick(); await tick();
    const req = w.__calls.find((c) => /funding_access_request/.test(c.url));
    const door = w.CPL_REVIEWER_SIGNIN._door();
    check("e3: the request sends the address and the hash, never the secret",
      !!req && req.body.p_email === "someone@college.edu" && /^[0-9a-f]{64}$/.test(req.body.p_secret_hash) &&
      !!door && door.secret !== req.body.p_secret_hash && JSON.stringify(req.body).indexOf(door.secret) < 0);
    check("e4: the box says to keep the tab open and that an approver will see it",
      /Keep this tab open/.test(el.textContent) && /an approver will see it/.test(el.textContent));
  }
  {
    const w = win({ status: "approved" });
    const el = w.document.getElementById("m");
    w.CPL_REVIEWER_SIGNIN.mountInto(el, { title: "Sign in", door: true });
    const input = el.querySelector("[data-rsi-email]");
    input.value = "someone@college.edu"; input.dispatchEvent(new w.Event("input"));
    el.querySelector("[data-rsi-ask]").dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await tick(); await tick(); await tick();
    w.CPL_REVIEWER_SIGNIN._pollDoor();
    await tick(); await tick(); await tick(); await tick();
    const claim = w.__calls.find((c) => /functions\/v1\/funding-door/.test(c.url));
    check("e5: on approval the tab claims with the id and the secret, and adopts the session it gets back",
      !!claim && /^[0-9a-f]{64}$/.test(claim.body.secret) && !!w.__adopted && w.__adopted.access_token === "aaa.bbb.ccc" &&
      w.CPL_REVIEWER_SIGNIN._door() === null);
  }
  check("e6: the session keeper adopts a minted session into the same store and says so",
    /adopt: function \(t\)/.test(SESSION) && /write\(s\);\s*announce\(s\);\s*return true;/.test(SESSION));

  const fails = results.filter((r) => !r[1]);
  results.forEach((r) => console.log((r[1] ? "PASS  " : "FAIL  ") + r[0]));
  console.log((results.length - fails.length) + "/" + results.length + " checks passed");
  process.exit(fails.length ? 1 : 0);
})();
