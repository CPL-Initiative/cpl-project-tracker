// library.js — the Library tab: one record per deck, film and document the CPL
// Initiative makes, with a link to where the file lives.
//
// Sam, 2026-10-05: "I think I may need a COBI tab to store and retrieve artifacts
// like this ppt and video. Advise". He approved the mockup
// (https://claude.ai/artifact/VPpbDp7DD4acvHErVFkCqH) and ruled: build it; approved
// files live in the team Drive folder; drafts stay out of the public tracker repo.
// Sam, 2026-10-07/08: most of the team has no Google account, so the files moved to
// a CPLLibrary folder on the MAP team's SharePoint site (Open Asks Sheet 49: he made
// it; guests allowed; "For now by hand and sync but later automatically so we avoid
// creating different artifact storage solutions.").
//
// A RECORD HOLDS A LINK, NEVER THE BYTES. A session cannot reach Supabase Storage
// (the proxy rejects *.supabase.co, measured again 2026-10-05), so an upload would
// sit where no session can file it or read it. kb/supabase_cpl_library.sql has the
// rest of the reasoning; kb/supabase_nc_artifacts.sql reached it first.
//
// Reads and writes need the team phrase (cpl_team_pass, the Team & RACI unlock):
// RLS on cpl_library is team_pass_ok() or is_allowed_reviewer(). Nothing is ever
// deleted: Retire sets retired_at, and every edit files the row as it was in
// cpl_library_history (a trigger), so any change can be undone from the database.
//
// Needs attention is computed here, from the record, never stored:
//   not filed      — home is not_filed (no link anywhere a session can reach);
//   public, unset  — the file sits in the public tracker repo and Sam has not said
//                    who it is for (seen_by is null);
//   refresh        — refresh_note is set (figures to bring up to date).
//
// Start a piece (Sam, 2026-10-05: "Mockup looks great. Let's go with it."): a brief
// saves a record with status 'requested' and the brief in its `brief` column. Such a
// record lives under In development (Requested, Draft, Approved, Presented) until it
// is approved, and never counts as Not filed: there is nothing to file yet. Copy the
// brief gives the whole paste for a new session; Sam's routine reads Requested
// records too (docs/reference/scheduled_sessions.md). scripts/library_file.py files
// each draft to CPLLibrary/Drafts and writes the receipt that moves it to Draft.
//
// Public library (Sam, 2026-10-20: "Maybe give me a toggle to copy over from the
// Private library to the public one... Copy or move...to save space"). A piece is
// listed, never copied: the same record carries public_listed, and the public page
// (library/index.html) and Sierra read it through cpl_library_public(). Listing takes
// the team phrase or a reviewer sign-in (Sam, 2026-10-23): the switch calls
// cpl_library_set_public(), whose gate is inside it (kb/supabase_cpl_library_public.sql).
//
// Made for an entity (Sam, Open Asks Sheet 120, 2026-10-23): a record says who it is
// made for (for_kind: college, district, agency, vendor, the Chancellor's Office, or a
// typed Other category; for_name: the entity's name, a college's from MAP's list in
// map_colleges so the filter matches the CPL Pathways pick). Both libraries filter on
// them. Make a visual, beside Start a piece, writes a college's record pair in one step
// (the live CPL Opportunity page and its workbook); for any other entity it opens Start
// a piece with the entity set, and the brief's paste names the agency template (the vault builder). Kind
// gained `visual` the same day (Sam, ~20:08Z): a page opened in a browser; `document`
// stays for Word and PDF.
//
// Regenerate (Sam, 2026-10-26: "I want to make sure I can Regenerate a visual when I
// either add a document or note to it ... Also, when I want to generate a new visual
// based on a document I upload"). One button on every record asks for a rebuild: the
// form takes what to change (refresh_note), the documents to work from (`sources`: a
// link, or the document's text pasted in), and, for a piece on the public library,
// whether the draft replaces the public copy at once or waits for Replace the public
// copy. It sets `regen`; the page cannot rebuild a piece, so a session does, in the
// scheduled runs or from Copy the request, and puts the draft's link on the card.
// Start a piece takes documents too. The Microsoft 365 connector waits on RCCD's
// admin approval (Sam, 2026-10-26), so a session reads a public link or pasted text.
//
// STATIC module, lazy-loaded on first #library open (both HTMLs, Rule 4). It
// injects its own CSS (the ensureCerScopeCss pattern). Tests: tests/library.test.js
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var TABLE_URL = SUPABASE_URL + "/rest/v1/cpl_library";
  var SET_PUBLIC_URL = SUPABASE_URL + "/rest/v1/rpc/cpl_library_set_public";
  var PUBLIC_PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/library/";
  var TEAM_KEY = "cpl_team_pass";
  var AUTHOR_KEY = "cpl_library_author";
  var ROOT_ID = "library-root";
  // Sam's CPLLibrary folder on the MAP team's SharePoint site (2026-10-08), the one
  // place the whole team can open; drafts go in a Drafts folder inside it.
  var LIBRARY_FOLDER = "https://studentrcc.sharepoint.com/:f:/r/sites/MilitaryArticulationPlatform/Shared%20Documents/CCCCO/AI/CPLLibrary";

  var KIND = { visual: "Visual", deck: "Deck", film: "Film", document: "Document", spreadsheet: "Spreadsheet" };
  var FOR_KIND = { college: "College", district: "District", agency: "Agency", vendor: "Vendor", co: "Chancellor's Office", other: "Other" };
  var FOR_PLURAL = { college: "Colleges", district: "Districts", agency: "Agencies", vendor: "Vendors", co: "Chancellor's Office", other: "Other" };
  var MAKE_WORDS = { college: "A college", district: "A district", agency: "An agency", vendor: "A vendor", co: "The Chancellor's Office", other: "Other" };
  var FOR_ORDER = ["college", "district", "agency", "vendor", "co", "other"];
  // MAP's list of colleges (map_colleges, the college and district identity lane): the
  // For picker offers these names, so a piece's college matches the CPL Pathways pick.
  var NAMES_URL = SUPABASE_URL + "/rest/v1/map_colleges?select=college_name,entity_kind,district&entity_kind=in.(college,continuing_education)&order=college_name.asc";
  var OPPORTUNITY_PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/?college=";
  var DSP_TEMPLATE = "CPLBrain/04-projects/cpl-initiative/dsp-training/20261020_DSP_Credit_Starting_Points.html";
  var AGENCY_BUILDER = "CPLBrain/04-projects/cpl-initiative/agency-visual/build.py";
  var STATUS = { requested: "Requested", draft: "Draft", approved: "Approved", presented: "Presented" };
  var STEPS = ["requested", "draft", "approved", "presented"];
  var SEEN = { team: "Team", colleges: "Colleges", "public": "Public" };
  var HOME = {
    // `drive` is the stored value for the team's file home (cpl_library_home_ck);
    // the home itself moved to SharePoint on 2026-10-08, so the words follow the link.
    drive: { label: "Team SharePoint", reach: "The MAP team, on its SharePoint site." },
    google_drive: { label: "Google Drive", reach: "The Library's Google account alone. Copy the file to the SharePoint folder and file that link." },
    public_repo: { label: "Public tracker repo", reach: "Anyone with the link. The tracker repo is public, so the file downloads from github.com without a sign-in." },
    vault: { label: "Vault (private repo)", reach: "People with access to the private CPLBrain repo." },
    web: { label: "Web link", reach: "Whoever the linked site allows." },
    not_filed: { label: "Not filed", reach: "No one can find it from here. It is not in the tracker, the vault or the team SharePoint folder." }
  };
  var FLAGS = {
    not_filed: { word: "Not filed", count: "not filed" },
    public_unset: { word: "Public file, no audience set", count: "public files with no audience set" },
    refresh: { word: "Changes to make", count: "with changes to make" },
    regen: { word: "Rebuild requested", count: "waiting on a rebuild" },
    ready: { word: "Draft ready to review", count: "with a draft to review" },
    kb_note: { word: "No KB note yet", count: "knowledge pieces with no KB note" }
  };
  var FLAG_ORDER = ["not_filed", "public_unset", "ready", "regen", "refresh", "kb_note"];
  // A document's pasted text, and the whole list, stay under cpl_library_sources_ck.
  var SRC_TEXT_MAX = 60000, SRC_MAX = 20, SRC_BYTES_MAX = 380000;
  var PUBLISH = { show: "Show me the draft first; the public copy stays until I replace it", replace: "Replace the public copy as soon as it is rebuilt" };

  var state = {
    rows: null, loading: false, error: null,
    q: "", kind: "all", seen: "all", status: "all", flag: null,
    open: {}, edit: null, form: null, formFor: null, message: "", msgErr: false, busy: false,
    retireAsk: null, start: null, briefShown: {}, requestShown: {}, pub: null,
    madeFor: "all", forName: "all", make: null, names: null, namesLoading: false, forPick: {},
    view: "pieces", regen: null, src: {}
  };

  // ── storage + headers ───────────────────────────────────────────────────────
  function teamPhrase() {
    try { return window.localStorage.getItem(TEAM_KEY) || ""; } catch (e) { return ""; }
  }
  function storedAuthor() {
    try { return window.localStorage.getItem(AUTHOR_KEY) || ""; } catch (e) { return ""; }
  }
  function rememberAuthor(name) {
    try { if (name) window.localStorage.setItem(AUTHOR_KEY, name); } catch (e) { /* private window */ }
  }
  function headers(extra) {
    var h = { apikey: SUPABASE_ANON, Authorization: "Bearer " + SUPABASE_ANON };
    var p = teamPhrase();
    if (p) h["x-team-pass"] = p;
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) h[k] = extra[k];
    return h;
  }

  // The reviewer sign-in (reviewer_signin.js). Listing sends it when there is one, else
  // the team phrase (Sam, 2026-10-23: the team lists its own pieces publicly).
  function reviewerToken() {
    try {
      var s = window.CPL_REVIEWER_SIGNIN && window.CPL_REVIEWER_SIGNIN.getSession();
      return (s && s.access_token) || "";
    } catch (e) { return ""; }
  }

  // ── small helpers ───────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December"];
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1] : "";
  }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function homeForUrl(url) {
    if (/^https:\/\/[a-z0-9-]+\.sharepoint\.com\//i.test(url)) return "drive";
    if (/^https:\/\/(drive|docs)\.google\.com\//i.test(url)) return "drive";
    if (/^https:\/\/(github\.com|raw\.githubusercontent\.com)\/CPL-Initiative\/cpl-project-tracker\//i.test(url)) return "public_repo";
    if (/^https:\/\/github\.com\/samueltlee\/CPLBrain\//i.test(url)) return "vault";
    return "web";
  }
  // A team-home record that still links Google Drive reads as Google Drive.
  function homeOf(r) {
    if (r.home === "drive" && /^https:\/\/(drive|docs)\.google\.com\//i.test(r.url || "")) return HOME.google_drive;
    return HOME[r.home] || HOME.web;
  }
  function slugFor(title) {
    var base = String(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "piece";
    return (/^[a-z0-9]/.test(base) ? base : "p-" + base) + "-" + Date.now().toString(36);
  }
  // A piece started from a brief stays In development until it is approved.
  function isDev(r) { return r.status === "requested" || (!!r.brief && r.status === "draft"); }
  function flagsOf(r) {
    var f = [];
    if (r.status === "requested") return f;
    if (r.home === "not_filed") f.push("not_filed");
    if (r.home === "public_repo" && !r.seen_by) f.push("public_unset");
    var rs = regenState(r);
    if (rs === "ready") f.push("ready");
    else if (rs) f.push("regen");
    else if (r.refresh_note) f.push("refresh");
    if (r.knowledge === true && !r.kb_note) f.push("kb_note");
    return f;
  }
  // Where a Regenerate request stands: null when none is open; "waiting" until a
  // session puts a draft on it; "ready" while a draft of a piece with a public copy
  // waits on Replace the public copy; "approved" once replacing is asked for.
  function regenState(r) {
    var g = r && r.regen;
    if (!g || typeof g !== "object" || !g.requested_at) return null;
    if (g.approved_at) return "approved";
    if (g.ready_at) return g.publish === "replace" ? "approved" : "ready";
    return "waiting";
  }
  function flagText(f, r) {
    if (f === "refresh" && r.refresh_note) return "Changes to make: " + r.refresh_note;
    if (f === "regen" && r.refresh_note) return "Rebuild requested: " + r.refresh_note;
    return FLAGS[f].word;
  }
  function stamp(iso) {
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso || "");
    return m ? fmtDate(m[1]) + ", " + m[2] + " UTC" : fmtDate(iso);
  }
  function sourceList(r) { return Array.isArray(r && r.sources) ? r.sources : []; }
  function say(text, isErr) { state.message = text; state.msgErr = !!isErr; }
  function statusWord(r) { return r.status ? STATUS[r.status] || r.status : "Not set"; }
  function seenWord(r) { return r.seen_by ? SEEN[r.seen_by] || r.seen_by : "Not set"; }
  // Who a piece is made for, in words: the type (or the typed Other category) and the name.
  function forKindWord(r) { return r.for_kind === "other" ? (r.for_category || "Other") : (FOR_KIND[r.for_kind] || r.for_kind || ""); }
  function forLine(r) {
    if (!r || !r.for_kind) return "";
    return "Made for " + forKindWord(r) + (r.for_name ? " \u00b7 For " + r.for_name : "");
  }
  // The slug a college's CPL Opportunity pair carries (cpl-opportunity-<college>-visual
  // and -workbook, as the first twelve were filed), so a second Make is refused by the
  // table's unique slug rather than filed twice.
  // The knowledge rule (Sam, Open Asks Sheet 121 card 1, 2026-10-23: fold-rule): a piece
  // whose substance is knowledge gets a note in the public CPL Knowledge Base through
  // its curation pipeline, and the record links it; a deck, a film or a data piece
  // does not. A typed note says knowledge on its own.
  function knowledgeValue(sel, note) { return note ? true : sel === "yes" ? true : sel === "no" ? false : null; }
  function knowledgeCell(r) {
    if (r.knowledge === true) {
      return r.kb_note
        ? "Its substance is knowledge; KB note " + (/^https:\/\//.test(r.kb_note)
          ? '<a href="' + esc(r.kb_note) + '" target="_blank" rel="noopener">' + esc(r.kb_note) + "</a>"
          : "<code>" + esc(r.kb_note) + "</code>")
        : esc("Its substance is knowledge and no KB note links it yet: promote it through the curation pipeline, then link the note with Edit.");
    }
    if (r.knowledge === false) return esc("A deck, film or data piece; no KB note needed.");
    return esc("Not set. Say with Edit whether this piece's substance is knowledge.");
  }
  function knowledgeFields(p, r) {
    var k = r && r.knowledge === true ? "yes" : r && r.knowledge === false ? "no" : "";
    return '<div class="lib-field"><label for="' + p + '-knowledge">Knowledge</label><select id="' + p + '-knowledge">' +
      opt("", "Not set", k) + opt("yes", "Yes, its substance is knowledge", k) + opt("no", "No, a deck, film or data piece", k) + "</select></div>" +
      '<div class="lib-field wide"><label for="' + p + '-kbnote">KB note</label><input id="' + p + '-kbnote" type="text" maxlength="300" value="' + esc((r && r.kb_note) || "") +
      '" placeholder="The note\'s path in cpl-knowledge-base, or its link"></div>';
  }
  var KB_HASH = "#library/knowledge-base";
  function viewFromHash() {
    var h = (window.location.hash || "").replace(/^#/, "").split("/");
    return h[0] === "knowledge-base" || (h[0] === "library" && h[1] === "knowledge-base") ? "kb" : "pieces";
  }
  function setView(v, writeHash) {
    state.view = v === "kb" ? "kb" : "pieces";
    if (writeHash) { try { window.history.replaceState(null, "", state.view === "kb" ? KB_HASH : "#library"); } catch (e) { /* a sandboxed frame */ } }
    render();
  }
  function collegeSlug(name) {
    return String(name || "").toLowerCase().replace(/\s+college$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "college";
  }
  function byId(id) {
    var rows = state.rows || [];
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  // ── CSS (injected once; tokens only) ────────────────────────────────────────
  function ensureCss() {
    if (document.getElementById("lib-css")) return;
    var R = "#" + ROOT_ID;
    var css = [
      R + "{text-align:left;color:var(--text-body);}",
      R + " .lib-lede{margin:0 0 14px;font-size:1.02rem;max-width:var(--cpl-measure,none);}",
      R + " .lib-views{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 14px;}",
      R + " .lib-views button{background:none;border:0;padding:0 2px;min-height:24px;font:inherit;font-weight:600;color:var(--cobalt);text-decoration:underline;text-underline-offset:3px;cursor:pointer;}",
      R + " .lib-views button[aria-pressed='true']{color:var(--text-strong);text-decoration-thickness:2px;}",
      R + " h2.lib-h.lib-top{font-size:clamp(1.5rem,3vw,1.9rem);margin:0 0 6px;}",
      R + " h2.lib-h{font-family:'Playfair Display',Georgia,serif;font-weight:700;color:var(--text-strong);font-size:1.25rem;line-height:1.25;margin:0;text-wrap:balance;}",
      R + " .lib-attention{display:grid;gap:10px;margin:0 0 20px;}",
      R + " .lib-flagrow{display:flex;flex-wrap:wrap;gap:10px;}",
      R + " .lib-flag{display:grid;gap:2px;text-align:left;min-height:44px;padding:10px 14px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface-opaque);color:var(--text-body);font:inherit;cursor:pointer;flex:1 1 220px;min-width:0;}",
      R + " .lib-flag:hover{background:var(--surface-subtle);}",
      R + " .lib-flag[aria-pressed=\"true\"]{border-color:var(--cobalt);box-shadow:inset 0 0 0 1px var(--cobalt);}",
      R + " .lib-flag .n{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:1.55rem;line-height:1;color:var(--crimson);font-variant-numeric:tabular-nums;}",
      R + " .lib-flag .w{font-size:.92rem;}",
      R + " .lib-clear{color:var(--text-muted);margin:0;font-size:.95rem;}",
      R + " .lib-controls{display:flex;flex-wrap:wrap;align-items:end;gap:12px 16px;padding:14px 0 16px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);}",
      R + " .lib-field{display:grid;gap:4px;min-width:0;}",
      R + " .lib-field.grow{flex:1 1 240px;}",
      R + " .lib-field textarea{font:inherit;color:var(--text-body);background:var(--surface-opaque);border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;width:100%;min-height:96px;resize:vertical;box-sizing:border-box;}",
      R + " .lib-hint{margin:2px 0 0;color:var(--text-muted);font-size:.84rem;}",
      R + " .lib-field label," + R + " .lib-seglabel{font-size:.76rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted);}",
      R + " input[type=search]," + R + " input[type=url]," + R + " input[type=text]," + R + " select{font:inherit;color:var(--text-body);background:var(--surface-opaque);border:1px solid var(--border-strong);border-radius:6px;padding:7px 10px;min-height:36px;width:100%;}",
      R + " .lib-seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--border-strong);border-radius:6px;overflow:hidden;}",
      R + " .lib-seg button{font:inherit;font-size:.92rem;background:var(--surface-opaque);color:var(--text-body);border:0;border-right:1px solid var(--border);padding:6px 12px;min-height:36px;cursor:pointer;}",
      R + " .lib-seg button:last-child{border-right:0;}",
      R + " .lib-seg button[aria-pressed=\"true\"]{background:var(--cobalt);color:var(--on-accent);font-weight:600;}",
      R + " .lib-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:6px 14px;border-radius:6px;border:1px solid var(--border-strong);background:var(--surface-opaque);color:var(--cobalt);font:inherit;font-weight:600;font-size:.92rem;text-decoration:none;cursor:pointer;white-space:nowrap;}",
      R + " .lib-btn:hover{background:var(--surface-subtle);}",
      R + " .lib-btn.primary{background:var(--cobalt);border-color:var(--cobalt);color:var(--on-accent);}",
      R + " .lib-btn.primary:hover{background:var(--btn-primary-hover);border-color:var(--btn-primary-hover);}",
      R + " .lib-btn[disabled]{opacity:.6;cursor:default;}",
      R + " .lib-pubsum{color:var(--text-muted);}",
      R + " .lib-pubwarn{color:var(--text-body);font-weight:600;}",
      R + " .lib-check{display:flex;gap:8px;align-items:center;}",
      R + " .lib-line{margin:10px 0 0;color:var(--text-muted);font-size:.9rem;}",
      R + " .lib-msg{margin:10px 0 0;font-weight:600;font-size:.92rem;color:var(--hunter);}",
      R + " .lib-msg.err{color:var(--crimson);}",
      R + " .lib-form{margin:14px 0 6px;padding:16px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface-opaque);}",
      R + " .lib-form p{margin:4px 0 12px;color:var(--text-muted);font-size:.92rem;}",
      R + " .lib-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}",
      R + " .lib-grid .wide{grid-column:1/-1;}",
      R + " .lib-actions-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;align-items:center;}",
      R + " .lib-group{margin-top:24px;}",
      R + " .lib-ghead{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin-bottom:10px;}",
      R + " .lib-ghead .count{color:var(--text-muted);font-size:.9rem;}",
      R + " .lib-items{display:grid;gap:10px;}",
      R + " .lib-item{display:grid;grid-template-columns:176px minmax(0,1fr) auto;gap:6px 18px;padding:14px;background:var(--surface-opaque);border:1px solid var(--border);border-radius:8px;}",
      R + " .lib-thumb{width:176px;aspect-ratio:16/10;max-width:100%;border-radius:6px;overflow:hidden;border:1px solid var(--border);background:var(--surface-muted);}",
      R + " .lib-thumb img{width:100%;height:100%;object-fit:cover;object-position:center;display:block;}",
      R + " .lib-tile{height:100%;display:grid;align-content:center;justify-items:start;gap:2px;padding:10px 14px;background:var(--surface-subtle);}",
      R + " .lib-tile .big{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:1.9rem;line-height:1;color:var(--text-strong);font-variant-numeric:tabular-nums;overflow-wrap:anywhere;}",
      R + " .lib-tile .unit{color:var(--text-muted);font-size:.88rem;}",
      R + " .lib-tile .type{margin-top:6px;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--seal-blue-text,var(--seal-blue));}",
      R + " .lib-tile.none{background:var(--surface-opaque);}",
      R + " .lib-tile.none .big{font-size:1.15rem;color:var(--crimson);}",
      R + " .lib-body{min-width:0;display:grid;gap:4px;align-content:start;}",
      R + " .lib-kicker{margin:0;font-size:.76rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);font-variant-numeric:tabular-nums;}",
      R + " h3.lib-title{margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:1.15rem;line-height:1.25;color:var(--text-strong);text-wrap:balance;overflow-wrap:anywhere;}",
      R + " .lib-summary{margin:0;font-size:.95rem;}",
      R + " .lib-for{margin:0;font-size:.92rem;color:var(--text-body);}",
      R + " .lib-for b{font-weight:600;color:var(--text-strong);}",
      R + " .lib-chips{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;}",
      R + " .lib-chip{border-radius:10px;font-size:.74rem;font-weight:600;padding:2px 8px;border:1px solid var(--border-strong);color:var(--text-body);background:var(--surface-subtle);}",
      R + " .lib-chip.unset{color:var(--text-muted);border-style:dashed;background:transparent;}",
      R + " .lib-flags{margin:4px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:4px 14px;}",
      R + " .lib-flags li{color:var(--crimson);font-weight:600;font-size:.88rem;}",
      R + " .lib-acts{display:flex;flex-direction:column;gap:8px;align-items:stretch;}",
      R + " .lib-copyslot:empty{display:none;}",
      R + " .lib-details{grid-column:1/-1;margin-top:8px;padding-top:12px;border-top:1px solid var(--border);}",
      R + " .lib-details dl{margin:0;display:grid;grid-template-columns:minmax(150px,220px) minmax(0,1fr);gap:8px 18px;}",
      R + " .lib-details dt{font-size:.78rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted);padding-top:2px;}",
      R + " .lib-details dd{margin:0;min-width:0;overflow-wrap:anywhere;}",
      R + " .lib-details code{font-size:.86em;background:var(--surface-subtle);padding:1px 4px;border-radius:4px;}",
      R + " .lib-details a{color:var(--cobalt);}",
      R + " .lib-vwrap{overflow-x:auto;}",
      R + " table.lib-versions{width:100%;border-collapse:collapse;table-layout:fixed;font-size:.92rem;}",
      R + " table.lib-versions th," + R + " table.lib-versions td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--border);vertical-align:top;overflow-wrap:anywhere;}",
      R + " table.lib-versions thead th{font-size:.74rem;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);background:var(--surface-subtle);}",
      R + " .lib-empty{padding:28px 16px;text-align:center;color:var(--text-muted);border:1px dashed var(--border-strong);border-radius:8px;margin-top:20px;}",
      R + " .lib-how{margin-top:36px;padding-top:16px;border-top:1px solid var(--border);display:grid;gap:8px;}",
      R + " .lib-how p{margin:0;max-width:var(--cpl-measure,none);}",
      R + " .lib-how a," + R + " .lib-form a{color:var(--cobalt);}",
      R + " .lib-dev{margin:18px 0 6px;display:grid;gap:10px;}",
      R + " .lib-devitem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 18px;padding:14px;background:var(--surface-opaque);border:1px solid var(--border-strong);border-radius:8px;}",
      R + " .lib-devitem p{margin:2px 0 0;}",
      R + " ol.lib-steps{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px;counter-reset:lib-step;}",
      R + " ol.lib-steps li{counter-increment:lib-step;font-size:.8rem;font-weight:600;padding:2px 10px;border-radius:10px;border:1px solid var(--border);color:var(--text-muted);}",
      R + " ol.lib-steps li::before{content:counter(lib-step) \". \";}",
      R + " ol.lib-steps li.done{color:var(--text-body);}",
      R + " ol.lib-steps li.now{border-color:var(--cobalt);color:var(--cobalt);background:var(--surface-subtle);}",
      R + " textarea.lib-brief{width:100%;min-height:170px;margin-top:10px;font:inherit;font-size:.88rem;color:var(--text-body);background:var(--surface-subtle);border:1px solid var(--border-strong);border-radius:6px;padding:8px 10px;}",
      R + " .lib-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}",
      // Regenerate: the request's state under the card, and the documents a piece is built from.
      R + " .lib-regen{margin:10px 0 0;padding:8px 12px;border-left:3px solid var(--seal-blue);background:var(--surface-subtle);border-radius:0 6px 6px 0;}",
      R + " .lib-regen p{margin:0;color:var(--text-body);font-size:.92rem;}",
      R + " .lib-inline{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:8px;}",
      R + " .lib-inline label{font-size:.88rem;color:var(--text-muted);}",
      R + " .lib-inline input{font:inherit;color:var(--text-body);background:var(--surface-opaque);border:1px solid var(--border-strong);border-radius:6px;padding:5px 8px;min-width:0;}",
      R + " .lib-srcset{border:1px solid var(--border);border-radius:6px;padding:10px 12px;margin:0;}",
      R + " .lib-srcset legend{font-size:.76rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted);padding:0 4px;}",
      R + " .lib-srcs{margin:4px 0 8px;padding-left:1.2em;}",
      R + " .lib-srcs li{margin:2px 0;font-size:.92rem;}",
      R + " .lib-muted{color:var(--text-muted);}",
      "@media (max-width:560px){" + R + " .lib-devitem{grid-template-columns:minmax(0,1fr);}" + R + " .lib-devitem .lib-acts{flex-direction:row;flex-wrap:wrap;}}",
      R + " :focus-visible{outline:2px solid var(--focus-ring,var(--cobalt));outline-offset:2px;border-radius:4px;}",
      "@media (max-width:760px){" + R + " .lib-item{grid-template-columns:132px minmax(0,1fr);}" + R + " .lib-thumb{width:132px;}" + R + " .lib-acts{grid-column:1/-1;flex-direction:row;flex-wrap:wrap;}}",
      "@media (max-width:560px){" + R + " .lib-item{grid-template-columns:minmax(0,1fr);}" + R + " .lib-thumb{width:100%;max-width:320px;}" + R + " .lib-details dl{grid-template-columns:minmax(0,1fr);gap:2px 0;}" + R + " .lib-details dd{margin-bottom:8px;}" + R + " .lib-seg{width:100%;}" + R + " .lib-seg button{flex:1 1 auto;}}",
      "@media (prefers-reduced-motion:reduce){" + R + " *{transition:none!important;animation:none!important;}}"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "lib-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ── data ────────────────────────────────────────────────────────────────────
  function load() {
    if (!teamPhrase()) { state.rows = null; state.error = null; render(); return Promise.resolve(); }
    state.loading = true; state.error = null; render();
    var url = TABLE_URL + "?select=*&retired_at=is.null&order=made_on.desc.nullslast,title.asc";
    return window.fetch(url, { headers: headers() }).then(function (res) {
      if (!res.ok) throw new Error("cpl_library answered " + res.status);
      return res.json();
    }).then(function (rows) {
      state.rows = Array.isArray(rows) ? rows : [];
      state.loading = false; render();
    }).catch(function (e) {
      state.rows = null; state.loading = false;
      state.error = "The Library could not be read (" + (e && e.message ? e.message : "cpl_library") + "). Nothing is shown rather than a partial list.";
      render();
    });
  }

  // MAP's college list, read once when the For picker first needs it. A failed read
  // leaves the picker as a plain field: the name is still typed, only unchecked.
  function loadNames() {
    if (state.names || state.namesLoading) return Promise.resolve(state.names || []);
    state.namesLoading = true;
    return window.fetch(NAMES_URL, { headers: headers() }).then(function (res) {
      if (!res.ok) throw new Error("map_colleges answered " + res.status);
      return res.json();
    }).then(function (rows) {
      state.namesLoading = false;
      state.names = (Array.isArray(rows) ? rows : []).map(function (r) { return { name: r.college_name, district: r.district || "" }; });
      render();
      return state.names;
    }).catch(function () { state.namesLoading = false; state.names = []; render(); return []; });
  }
  function collegeNames() { return (state.names || []).map(function (n) { return n.name; }); }
  function districtNames() {
    var seen = {}, out = [];
    (state.names || []).forEach(function (n) { if (n.district && !seen[n.district]) { seen[n.district] = true; out.push(n.district); } });
    return out.sort();
  }
  // The college as MAP spells it: an exact match, else one ignoring case and spacing.
  function mapCollege(name) {
    var want = String(name || "").trim(), fold = function (x) { return String(x).toLowerCase().replace(/[^a-z0-9]+/g, ""); };
    var names = collegeNames();
    for (var i = 0; i < names.length; i++) if (names[i] === want) return names[i];
    for (var j = 0; j < names.length; j++) if (fold(names[j]) === fold(want)) return names[j];
    return null;
  }

  // write(url, { method, body }): each caller names its method beside the table
  // address, which is also how kb/_build_dependency_map.py sees the write edge.
  function write(url, req) {
    state.busy = true; render();
    return window.fetch(url, {
      method: req.method,
      headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(req.body)
    }).then(function (res) {
      state.busy = false;
      if (!res.ok) {
        return res.text().then(function (t) {
          var why = res.status === 401 || res.status === 403
            ? "The team phrase was refused. Unlock again from the About menu and retry."
            : "The write was refused (" + res.status + "). " + String(t || "").slice(0, 200);
          throw new Error(why);
        });
      }
      return res.json();
    });
  }

  // ── matching + grouping ─────────────────────────────────────────────────────
  function matches(r) {
    if (state.kind !== "all" && r.kind !== state.kind) return false;
    if (state.seen !== "all" && (r.seen_by || "unset") !== state.seen) return false;
    if (state.status !== "all" && (r.status || "unset") !== state.status) return false;
    if (state.flag && flagsOf(r).indexOf(state.flag) < 0) return false;
    if (state.madeFor !== "all" && (r.for_kind || "unset") !== state.madeFor) return false;
    if (state.forName !== "all" && (r.for_name || "") !== state.forName) return false;
    if (state.q.trim()) {
      var hay = [r.title, r.occasion, r.file_name, r.summary, KIND[r.kind], r.made_by, r.version, r.for_name, forKindWord(r)].join(" ").toLowerCase();
      var words = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }
  function groups(rows) {
    var by = {}, order = [];
    rows.slice().sort(function (a, b) {
      var da = a.made_on || "", db = b.made_on || "";
      return da < db ? 1 : da > db ? -1 : String(a.title).localeCompare(String(b.title));
    }).forEach(function (r) {
      var g = r.occasion || "No occasion yet";
      if (!by[g]) { by[g] = []; order.push(g); }
      by[g].push(r);
    });
    return order.map(function (g) { return { name: g, rows: by[g] }; });
  }

  // ── rendering ───────────────────────────────────────────────────────────────
  function thumb(r) {
    if (r.poster) {
      return '<div class="lib-thumb"><img src="' + esc(r.poster) + '" alt="Title frame of ' + esc(r.title) + '" loading="lazy"></div>';
    }
    var m = /^(\S+)\s+(.+)$/.exec(r.extent || "");
    var big = m ? m[1] : (r.file_type || KIND[r.kind] || "").toUpperCase();
    var unit = m ? m[2] : (r.extent || "");
    if (r.home === "not_filed") {
      return '<div class="lib-thumb"><div class="lib-tile none"><span class="big">Not filed</span><span class="unit">' +
        esc(r.extent || "") + '</span><span class="type">' + esc(r.file_type || "") + "</span></div></div>";
    }
    return '<div class="lib-thumb"><div class="lib-tile"><span class="big">' + esc(big) + '</span><span class="unit">' +
      esc(unit) + '</span><span class="type">' + esc(r.file_type || "") + "</span></div></div>";
  }
  function chip(text, unset) { return '<li class="lib-chip' + (unset ? " unset" : "") + '">' + esc(text) + "</li>"; }

  function details(r) {
    var home = homeOf(r);
    var where = r.url
      ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(home.label) + "</a>"
      : esc(home.label);
    if (r.file_name) where += ", <code>" + esc(r.file_name) + "</code>";
    var rows = [
      ["Where it lives", where],
      ["Who can open it now", esc(home.reach)],
      ["Seen by", esc(r.seen_by ? seenWord(r) : "Not set. Sam decides who this is for.")],
      ["Made for", esc(r.for_kind ? forLine(r) : "Not set. Say who this piece is made for with Edit.")],
      ["Made by", esc(r.made_by || "Not recorded.")],
      ["Approved", esc(r.ruling || "None recorded.")],
      ["Figures", esc(r.figures || "Not recorded.")]
    ];
    rows.push(["Knowledge", knowledgeCell(r)]);
    if (r.refresh_note) rows.push(["Changes to make", esc(r.refresh_note)]);
    if (sourceList(r).length) rows.push(["Documents to work from", srcListHtml(sourceList(r))]);
    if (regenState(r)) rows.push(["Rebuild", regenWords(r)]);
    rows.push(["Rebuild from", r.rebuild_from ? "<code>" + esc(r.rebuild_from) + "</code>" : "Not recorded."]);
    if (r.note) rows.push(["Note", esc(r.note)]);
    rows.push(["Public library", publicCell(r)]);
    rows.push(["Record", esc("Added by " + (r.added_by || "unknown") + (r.updated_by ? "; last edited by " + r.updated_by : "") + ".")]);
    var html = "<dl>" + rows.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    var vs = Array.isArray(r.versions) ? r.versions : [];
    if (vs.length) {
      html += '<dt>Versions and cuts</dt><dd><div class="lib-vwrap" role="region" tabindex="0" aria-label="Versions of ' + esc(r.title) + '">' +
        '<table class="lib-versions"><colgroup><col style="width:38%"><col style="width:18%"><col style="width:20%"><col style="width:24%"></colgroup>' +
        '<thead><tr><th scope="col">Version</th><th scope="col">Date</th><th scope="col">Size</th><th scope="col">Status</th></tr></thead><tbody>' +
        vs.map(function (v) {
          var label = v.url && /^https:\/\//.test(v.url)
            ? '<a href="' + esc(v.url) + '" target="_blank" rel="noopener">' + esc(v.label) + "</a>" : esc(v.label);
          return '<tr><th scope="row">' + label + "</th><td>" + esc(filedWhen(v)) + "</td><td>" + esc(v.size || "") + "</td><td>" + esc(v.status || "") + "</td></tr>";
        }).join("") + "</tbody></table></div></dd>";
    }
    html += "</dl>";
    if (state.edit === r.id) html += editForm(r);
    return html;
  }

  // Where a link opens for the public, said before the switch rather than after.
  function publicReach(r) {
    if (!r.url) return "It has no link yet, so it cannot be listed. File it first.";
    if (r.home === "web" && /^https:\/\/claude\.ai\//i.test(r.url)) return "A Claude page opens for the public only once its link is set to public in claude.ai's Share menu.";
    if (r.home === "vault") return "Its link is in the private vault, so the public cannot open it. File a public copy first.";
    if (r.home === "drive") return "Its link is on the team's SharePoint or Drive, which opens only for people it is shared with.";
    return "";
  }
  function publicCell(r) {
    if (r.public_listed) {
      return "Listed" + (r.listed_at ? " since " + esc(fmtDate(String(r.listed_at).slice(0, 10))) : "") +
        ' on the <a href="' + PUBLIC_PAGE + '" target="_blank" rel="noopener">public library</a>, and Sierra can link it.' +
        (r.public_summary ? '<br><span class="lib-pubsum">' + esc(r.public_summary) + "</span>" : "") +
        '<div class="lib-actions-row"><button type="button" class="lib-btn" data-unpub="' + esc(r.id) + '"' + (state.busy ? " disabled" : "") + ">Remove from the public library</button></div>";
    }
    if (!r.url) return esc(publicReach(r));
    if (state.pub !== r.id) {
      return "Not listed." + '<div class="lib-actions-row"><button type="button" class="lib-btn" data-pub="' + esc(r.id) + '">List publicly</button></div>';
    }
    var claude = r.home === "web" && /^https:\/\/claude\.ai\//i.test(r.url);
    var reach = publicReach(r);
    return '<form class="lib-form" data-pubform="' + esc(r.id) + '"><p>Listing puts the title, occasion, date, the summary below, its topics and the link on the public page, and lets Sierra link it. Nothing else leaves COBI.</p>' +
      (reach ? '<p class="lib-pubwarn">' + esc(reach) + "</p>" : "") +
      '<div class="lib-grid">' +
      '<div class="lib-field wide"><label for="lp-sum">Public summary</label><textarea id="lp-sum" rows="3" maxlength="600" required>' + esc(r.public_summary || r.summary || "") + "</textarea></div>" +
      '<div class="lib-field wide"><label for="lp-topics">Topics Sierra matches, separated by commas</label><input id="lp-topics" type="text" value="' + esc((r.public_topics || []).join(", ")) + '" placeholder="DSP training, developmental disabilities"></div>' +
      (claude ? '<div class="lib-field wide"><label class="lib-check"><input type="checkbox" id="lp-shared" required> I set its claude.ai link to public in the Share menu</label></div>' : "") +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">List publicly</button>" +
      '<button type="button" class="lib-btn" data-pubcancel="1">Cancel</button></div></form>';
  }

  // The filer stamps filed_at (ISO, UTC) on each version it files (Sam's call 8).
  function filedWhen(v) {
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(v.filed_at || "");
    return m ? fmtDate(m[1]) + ", " + m[2] + " UTC" : (v.date || "");
  }

  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>"; }

  // The Made for fields every form shares: the type, the typed category when it is
  // Other, and the name (a college's offered from MAP's list). `p` prefixes the ids
  // (la- add, ls- start, le- edit); the type picked since the form opened lives in
  // state.forPick[p], so a repaint shows the fields that type needs.
  function forKindPicked(p, r) { return state.forPick[p] != null ? state.forPick[p] : ((r && r.for_kind) || ""); }
  function forFields(p, r) {
    r = r || {};
    var kind = forKindPicked(p, r);
    var sel = '<div class="lib-field"><label for="' + p + '-forkind">Made for</label><select id="' + p + '-forkind">' + opt("", "Not set", kind) +
      FOR_ORDER.map(function (k) { return opt(k, FOR_KIND[k], kind); }).join("") + "</select></div>";
    var cat = kind === "other"
      ? '<div class="lib-field"><label for="' + p + '-forcat">Other: the category</label><input id="' + p + '-forcat" type="text" required maxlength="80" value="' + esc(r.for_category || "") + '" placeholder="Foundation, union, school district"></div>'
      : "";
    var list = kind === "college" ? ' list="lib-names-colleges"' : kind === "district" ? ' list="lib-names-districts"' : "";
    var name = kind
      ? '<div class="lib-field"><label for="' + p + '-forname">For</label><input id="' + p + '-forname" type="text" maxlength="200"' + list + ' value="' + esc(r.for_name || "") + '" placeholder="' + (kind === "college" ? "Start typing the college\'s name" : "The entity\'s name") + '"></div>'
      : "";
    return sel + cat + name;
  }
  function readFor(p) {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    var kind = g(p + "-forkind") || null;
    var out = { for_kind: kind, for_category: kind === "other" ? (g(p + "-forcat") || null) : null, for_name: kind ? (g(p + "-forname") || null) : null };
    if (kind === "college" && out.for_name && state.names && state.names.length) out.for_name = mapCollege(out.for_name) || out.for_name;
    return out;
  }
  function forProblem(f) {
    if (f.for_kind === "other" && !f.for_category) return "Type the category for Other, so the filter can offer it again.";
    return "";
  }
  function datalists() {
    if (!state.names || !state.names.length) return "";
    var list = function (id, names) { return '<datalist id="' + id + '">' + names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join("") + "</datalist>"; };
    return list("lib-names-colleges", collegeNames()) + list("lib-names-districts", districtNames());
  }

  function editForm(r) {
    var ask = state.retireAsk === r.id;
    return '<form class="lib-form" data-editform="' + esc(r.id) + '"><h3 class="lib-title">Edit this record</h3>' +
      "<p>Each edit keeps the record as it was in the history, so it can be undone.</p>" +
      '<div class="lib-grid">' +
      '<div class="lib-field"><label for="le-status">Status</label><select id="le-status">' +
      opt("", "Not set", r.status || "") + opt("requested", "Requested", r.status) + opt("draft", "Draft", r.status) + opt("approved", "Approved", r.status) + opt("presented", "Presented", r.status) + "</select></div>" +
      '<div class="lib-field"><label for="le-seen">Seen by</label><select id="le-seen">' +
      opt("", "Not set", r.seen_by || "") + opt("team", "Team", r.seen_by) + opt("colleges", "Colleges", r.seen_by) + opt("public", "Public", r.seen_by) + "</select></div>" +
      forFields("le", r) +
      '<div class="lib-field wide"><label for="le-url">Link to the file</label><input id="le-url" type="url" value="' + esc(r.url || "") + '" placeholder="https://studentrcc.sharepoint.com/..."></div>' +
      '<p class="lib-line wide">What to change, and the documents to work from, go on <b>Regenerate</b> beside Edit.</p>' +
      knowledgeFields("le", r) +
      '<div class="lib-field"><label for="le-by">Your name</label><input id="le-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">Save</button>" +
      '<button type="button" class="lib-btn" data-editcancel="1">Cancel</button>' +
      (ask
        ? '<span>Retire this record? It leaves the list, and the history keeps it.</span><button type="button" class="lib-btn" data-retireyes="' + esc(r.id) + '">Retire</button><button type="button" class="lib-btn" data-retireno="1">Keep</button>'
        : '<button type="button" class="lib-btn" data-retire="' + esc(r.id) + '">Retire</button>') +
      "</div></form>";
  }

  function item(r) {
    var open = !!state.open[r.id];
    var fl = flagsOf(r);
    var kicker = [KIND[r.kind] || r.kind, fmtDate(r.made_on)];
    if (r.version) kicker.push(/^\d+$/.test(r.version) ? "Version " + r.version : r.version);
    var acts = r.url
      ? '<a class="lib-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">Open</a>' +
        '<button type="button" class="lib-btn" data-copy="' + esc(r.id) + '">Copy link</button>'
      : '<button type="button" class="lib-btn" data-file="' + esc(r.id) + '">File it</button>';
    // Edit and the public switch sit on the card itself (Sam, 2026-10-20: "move the
    // Edit button onto the top layer of the card"); each opens its form below.
    acts += '<button type="button" class="lib-btn" data-edittop="' + esc(r.id) + '">Edit</button>';
    acts += regenBtn(r);
    if (r.refresh_note || regenState(r)) acts += requestBtn(r);
    if (r.url && !r.public_listed) acts += '<button type="button" class="lib-btn" data-pubtop="' + esc(r.id) + '">List publicly</button>';
    acts += '<button type="button" class="lib-btn" data-toggle="' + esc(r.id) + '" aria-expanded="' + open + '" aria-controls="lib-d-' + esc(r.id) + '">' + (open ? "Hide details" : "Details") + "</button>";
    var chips = chip(r.status ? statusWord(r) : "Status: Not set", !r.status) +
      (r.public_listed ? chip("In the public library") : "") +
      chip("Seen by: " + seenWord(r), !r.seen_by) +
      (r.home === "not_filed" ? "" : chip(homeOf(r).label));
    return '<article class="lib-item" aria-labelledby="lib-t-' + esc(r.id) + '">' + thumb(r) +
      '<div class="lib-body"><p class="lib-kicker">' + esc(kicker.filter(Boolean).join(" · ")) + "</p>" +
      '<h3 class="lib-title" id="lib-t-' + esc(r.id) + '">' + esc(r.title) + "</h3>" +
      (r.for_kind ? '<p class="lib-for">Made for <b>' + esc(forKindWord(r)) + "</b>" + (r.for_name ? " \u00b7 For <b>" + esc(r.for_name) + "</b>" : "") + "</p>" : "") +
      (r.summary ? '<p class="lib-summary">' + esc(r.summary) + "</p>" : "") +
      '<ul class="lib-chips" aria-label="Record">' + chips + "</ul>" +
      (fl.length ? '<ul class="lib-flags" aria-label="Needs attention">' + fl.map(function (f) {
        return "<li>" + esc(flagText(f, r)) + "</li>";
      }).join("") + "</ul>" : "") +
      regenBox(r) + requestBox(r) +
      '</div><div class="lib-acts">' + acts + '<span class="lib-copyslot" id="lib-c-' + esc(r.id) + '"></span></div>' +
      '<div class="lib-details" id="lib-d-' + esc(r.id) + '"' + (open ? "" : " hidden") + ">" + (open ? details(r) : "") + "</div></article>";
  }

  function addForm() {
    var f = state.form || {};
    var filing = !!state.formFor;
    return '<form class="lib-form" id="lib-addform"><h2 class="lib-h">' + (filing ? "File " + (f.title ? esc(f.title) : "this piece") : "Add to the Library") + "</h2>" +
      "<p>" + (filing ? "" : "The Library keeps the record and links to the file. ") +
      "Put the file in the team's SharePoint folder first: an approved piece in the " +
      '<a href="' + LIBRARY_FOLDER + '" target="_blank" rel="noopener">CPLLibrary folder</a>, a draft in its Drafts folder. ' +
      "Then paste its link here.</p>" +
      '<div class="lib-grid">' +
      '<div class="lib-field wide"><label for="la-url">Link to the file</label><input id="la-url" type="url" required placeholder="https://studentrcc.sharepoint.com/..." value="' + esc(f.url || "") + '"></div>' +
      (filing ? "" :
        '<div class="lib-field wide"><label for="la-title">Title</label><input id="la-title" type="text" required value="' + esc(f.title || "") + '"></div>' +
        '<div class="lib-field"><label for="la-kind">Kind</label><select id="la-kind">' + opt("visual", "Visual (a page opened in a browser)", f.kind) + opt("deck", "Deck", f.kind) + opt("spreadsheet", "Spreadsheet", f.kind) + opt("film", "Film", f.kind) + opt("document", "Document (Word, PDF)", f.kind) + "</select></div>" +
        '<div class="lib-field"><label for="la-occasion">Occasion</label><input id="la-occasion" type="text" placeholder="Vision 2030 Noncredit Summit" value="' + esc(f.occasion || "") + '"></div>' +
        forFields("la", f) + knowledgeFields("la", f) +
        '<div class="lib-field"><label for="la-seen">Seen by</label><select id="la-seen">' + opt("", "Not set", f.seen_by || "") + opt("team", "Team", f.seen_by) + opt("colleges", "Colleges", f.seen_by) + opt("public", "Public", f.seen_by) + "</select></div>" +
        '<div class="lib-field"><label for="la-status">Status</label><select id="la-status">' + opt("draft", "Draft", f.status || "draft") + opt("approved", "Approved", f.status) + opt("presented", "Presented", f.status) + "</select></div>") +
      '<div class="lib-field"><label for="la-by">Your name</label><input id="la-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">" + (filing ? "File it" : "Add") + "</button>" +
      '<button type="button" class="lib-btn" data-formcancel="1">Cancel</button></div></form>';
  }

  // ── Start a piece ───────────────────────────────────────────────────────────
  // The whole paste for a new session (Sam, 2026-09-20: "Hand over the whole
  // paste"): the ask, the command that files the draft, then what a good result is.
  function briefText(r) {
    var b = r.brief || {};
    return "Start a new piece for the CPL Library: record " + r.slug + ".\n" +
      "Kind: " + (KIND[r.kind] || r.kind) + ". Working title: " + r.title + ".\n" +
      "Occasion: " + (r.occasion || "none") + ". Needed by: " + (b.due || "not set") + ". For: " + seenWord(r) + ".\n" +
      "Made for: " + (r.for_kind ? forLine(r) : "no one entity") + ".\n" +
      "It must say: " + (b.say || "") + "\n" +
      "Data and sources: " + (b.sources || "your call; fetch live data first for any CPL figure") + "\n" +
      sourcesText(r) +
      "Length, template or style: " + (b.shape || "your call") + "\n" +
      "Requested by " + (b.requested_by || r.added_by || "the team") + (b.requested_on ? " on " + fmtDate(b.requested_on) : "") + ".\n\n" +
      (r.kind === "visual" && r.for_kind && r.for_kind !== "college"
        ? "Build the page with the agency template: " + AGENCY_BUILDER + " paints a JSON brief in the DSP page's shape (" + DSP_TEMPLATE + "): the meeting, " +
          "the training facts, colleges tiered by fit, what to confirm, next steps, sources; the ELL IET page (CPLBrain/04-projects/cpl-initiative/ell-iet/) is the worked example. " +
          "The entity's own facts come from what was uploaded or a web search, never guessed. Publish it as a Claude page (the builder applies the public header), " +
          "commit the brief and the page's source to the vault beside the work, and file its link here with File it on record " + r.slug + ", which moves the record to Draft.\n"
        : "") +
      "Build it from source in the tracker repo and name the file with today's date code (YYYYMMDD_Title). " +
      "Send me the file. I put it in the Drafts folder of the Library's SharePoint folder (CPLLibrary) " +
      "and paste its link with File it on record " + r.slug + ", which moves the record to Draft.\n" +
      "A good result: the draft opens from the Library, under In development, at step 2, Draft.";
  }

  // ── Changes to make ─────────────────────────────────────────────────────────
  // Sam, 2026-10-25: "before I send out the link to the ELL visual in the Library,
  // I'd like to request some edits from the Library edit form but there's no place
  // for me to enter my comments and then Refresh based on the input. That would be
  // needed for the Coordinator Guide and other visuals as well." The record's
  // refresh_note held figures to bring up to date; it now holds any change a reader
  // asks for. The page cannot rebuild a piece: a session does, from its source,
  // with the paste below or in the scheduled run (scheduled_sessions.md, step 6),
  // and empties the box when the revision is in.
  function requestText(r) {
    var g = r.regen || {}, rs = regenState(r);
    var asked = rs ? [g.requested_by, stamp(g.requested_at)].filter(Boolean).join(", ")
      : [r.updated_by, fmtDate(r.updated_at)].filter(Boolean).join(", ");
    var pub = !!r.public_listed;
    return "Revise a CPL Library piece: record " + r.slug + ", " + r.title + ".\n" +
      "Its link: " + (r.url || "not filed yet") + ".\n" +
      "Its source: " + (r.rebuild_from || "not recorded; find it from the record and the vault, and record it with the revision") + ".\n" +
      "Changes to make" + (asked ? " (" + asked + ")" : "") + ":\n" +
      (r.refresh_note || "None typed: rebuild it from its source, the documents below and the current data.") + "\n" +
      sourcesText(r) + "\n" +
      (rs === "approved"
        ? "The draft is approved (" + [g.approved_by, stamp(g.approved_at)].filter(Boolean).join(", ") + "): " + (g.draft_url || "its draft") +
          " replaces the public copy. Rerun scripts/library_page.py from it, add the version to the record, empty Changes to make and clear regen.\n"
        : "Rebuild it from its source with these changes and keep its link. " +
          (pub
            ? (g.publish === "replace"
              ? "The requester asked that it replace the public copy at once: publish the draft, rerun scripts/library_page.py so the Pages copy follows, add the version, empty Changes to make and clear regen. "
              : "It is on the public library, so publish the draft at its own link and put that link on the record (regen.ready_at and regen.draft_url); the public copy stays until someone presses Replace the public copy. ")
            : "Republish a Claude page to the same artifact, add the version to the record, empty Changes to make and clear regen. ") +
          "Record writes go through a committed receipt (Rule 10).\n") +
      "A good result: the card shows the revision (or its draft, with Replace the public copy), and no longer lists a rebuild as requested.";
  }

  // The documents a piece is built from, in the paste: a link opens as it stands; a
  // pasted text is read from the record (it can run to 60,000 characters).
  function sourcesText(r) {
    var list = sourceList(r);
    if (!list.length) return "";
    var pasted = list.some(function (x) { return !x.url; });
    return "Documents to work from:\n" + list.map(function (x) {
      return "- " + x.title + (x.url ? ": " + x.url : ": text pasted into the record, " + String(x.text || "").length.toLocaleString("en-US") + " characters") +
        (x.added_by ? " (added by " + x.added_by + (x.added_on ? ", " + fmtDate(x.added_on) : "") + ")" : "");
    }).join("\n") + "\n" +
      (pasted ? "Read the pasted text with: select sources from cpl_library where slug = '" + r.slug + "';\n" : "");
  }

  // ── Regenerate ──────────────────────────────────────────────────────────────
  function regenBtn(r) {
    var open = state.regen === r.id;
    return '<button type="button" class="lib-btn' + (regenState(r) ? "" : " primary") + '" data-regen="' + esc(r.id) + '" aria-expanded="' + open + '">' +
      (regenState(r) === "ready" ? "Ask for more changes" : "Regenerate") + "</button>";
  }
  function srcWords(x) {
    return x.url
      ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + "</a>"
      : esc(x.title) + ' <span class="lib-muted">(pasted text, ' + esc(String(x.text || "").length.toLocaleString("en-US")) + " characters)</span>";
  }
  function srcListHtml(list) {
    return '<ul class="lib-srcs">' + list.map(function (x) { return "<li>" + srcWords(x) + "</li>"; }).join("") + "</ul>";
  }
  // What the card says while a request is open.
  function regenWords(r) {
    var g = r.regen || {}, rs = regenState(r);
    if (rs === "waiting") {
      return esc("Rebuild requested by " + (g.requested_by || "the team") + ", " + stamp(g.requested_at) + ". The next scheduled run rebuilds it from its source" +
        (sourceList(r).length ? " and the documents" : "") + "; Copy the request starts it in a session now.");
    }
    if (rs === "ready") {
      return "A draft is ready" + (g.ready_at ? " (" + esc(stamp(g.ready_at)) + ")" : "") + ": " +
        (g.draft_url ? '<a href="' + esc(g.draft_url) + '" target="_blank" rel="noopener">open the draft</a>' : "its link is not recorded") +
        ". The public copy stays as it is until you replace it.";
    }
    if (rs === "approved") {
      return esc((g.approved_by ? "Approved by " + g.approved_by + (g.approved_at ? ", " + stamp(g.approved_at) : "") : "Approved") +
        ". The next scheduled run replaces the public copy with the draft.");
    }
    return "";
  }
  // Under the card: the request's state, Replace the public copy on a ready draft,
  // and the form itself when Regenerate is open.
  function regenBox(r) {
    var rs = regenState(r), html = "";
    if (rs) {
      html += '<div class="lib-regen" role="status"><p>' + regenWords(r) + "</p>";
      if (rs === "ready") {
        html += '<form class="lib-inline" data-regenokform="' + esc(r.id) + '"><label for="ro-by-' + esc(r.id) + '">Your name</label>' +
          '<input id="ro-by-' + esc(r.id) + '" type="text" required value="' + esc(storedAuthor()) + '">' +
          '<button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">Replace the public copy</button></form>";
      }
      html += "</div>";
    }
    if (state.regen === r.id) html += regenForm(r);
    return html;
  }
  function regenForm(r) {
    var cur = (r.regen && r.regen.publish) || "show";
    return '<form class="lib-form" data-regenform="' + esc(r.id) + '"><h3 class="lib-title">Regenerate this piece</h3>' +
      "<p>Say what to change, add any document to work from, and press Regenerate. A session rebuilds the piece from its source, keeps its link, and puts the draft on this card.</p>" +
      '<div class="lib-grid">' +
      '<div class="lib-field wide"><label for="rg-note">What to change</label><textarea id="rg-note" rows="4" maxlength="4000" placeholder="The wording, the figures, the layout, what to add or cut. Leave it empty to rebuild from the documents and the current data.">' +
      esc(r.refresh_note || "") + "</textarea></div>" +
      sourcesFields("rg") +
      (r.public_listed
        ? '<div class="lib-field wide"><label for="rg-pub">When the draft is ready</label><select id="rg-pub">' + opt("show", PUBLISH.show, cur) + opt("replace", PUBLISH.replace, cur) + "</select></div>"
        : "") +
      '<div class="lib-field"><label for="rg-by">Your name</label><input id="rg-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">Regenerate</button>" +
      '<button type="button" class="lib-btn" data-regencancel="1">Cancel</button></div></form>';
  }

  // The documents fields, shared by Regenerate (rg) and Start a piece (ls). The list
  // being edited lives in state.src[p] until the form saves.
  function sourcesFields(p) {
    var list = state.src[p] || [];
    var rows = list.length
      ? '<ul class="lib-srcs">' + list.map(function (x, i) {
          return "<li>" + srcWords(x) + ' <button type="button" class="lib-btn" data-srcdel="' + p + ":" + i + '">Remove<span class="lib-vh"> ' + esc(x.title) + "</span></button></li>";
        }).join("") + "</ul>"
      : '<p class="lib-hint">None yet.</p>';
    return '<fieldset class="lib-field wide lib-srcset"><legend>Documents to work from</legend>' + rows +
      '<div class="lib-grid">' +
      '<div class="lib-field"><label for="' + p + '-stitle">Document title</label><input id="' + p + '-stitle" type="text" maxlength="200" placeholder="DDS DSPT Year 1 student guide"></div>' +
      '<div class="lib-field"><label for="' + p + '-surl">Its link</label><input id="' + p + '-surl" type="url" placeholder="https://..."></div>' +
      '<div class="lib-field wide"><label for="' + p + '-stext">Or paste its text</label><textarea id="' + p + '-stext" rows="4" maxlength="' + SRC_TEXT_MAX + '" aria-describedby="' + p + '-stext-h"></textarea>' +
      '<p class="lib-hint" id="' + p + '-stext-h">A session reads a public link or the text pasted here. It cannot open SharePoint until RCCD approves the Microsoft 365 connector, so for a SharePoint file, paste its text. Never paste a student\'s record.</p></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="button" class="lib-btn" data-srcadd="' + p + '">Add this document</button></div></fieldset>';
  }
  function srcTyped(p) {
    var g = function (id) { var n = document.getElementById(p + id); return n ? n.value.trim() : ""; };
    return { title: g("-stitle"), url: g("-surl"), text: g("-stext") };
  }
  function clearSrcFields(p) {
    ["-stitle", "-surl", "-stext"].forEach(function (x) { var n = document.getElementById(p + x); if (n) n.value = ""; });
  }
  // Adds the typed document to the list; returns an error in words, or "".
  function takeSource(p, by) {
    var t = srcTyped(p);
    if (!t.title && !t.url && !t.text) return "";
    if (!t.title) return "Give the document a title, so the request can name it.";
    if (t.url && !/^https:\/\//.test(t.url)) return "A document's link must start with https://.";
    if (!t.url && !t.text) return "Add the document's link, or paste its text.";
    if (t.text.length > SRC_TEXT_MAX) return "The pasted text runs past " + SRC_TEXT_MAX.toLocaleString("en-US") + " characters. Paste the part the piece needs.";
    var list = (state.src[p] || []).slice();
    if (list.length >= SRC_MAX) return "A record holds up to " + SRC_MAX + " documents. Remove one first.";
    var x = { title: t.title, url: t.url || null, text: t.url ? null : t.text, added_by: by || storedAuthor() || null, added_on: today() };
    list.push(x);
    if (JSON.stringify(list).length > SRC_BYTES_MAX) return "The documents together run past what a record holds. Paste the part the piece needs.";
    state.src[p] = list;
    return "";
  }
  function addSource(p) {
    var byNode = document.getElementById(p + "-by");
    var err = takeSource(p, byNode ? byNode.value.trim() : "");
    if (!err && !srcTyped(p).title && !srcTyped(p).url && !srcTyped(p).text) err = "Type a title and a link, or paste the document's text, then press Add this document.";
    if (err) { say(err, true); render(); return; }
    say("Added. It saves with the " + (p === "rg" ? "request" : "brief") + ".");
    render(); clearSrcFields(p);
    var t = document.getElementById(p + "-stitle"); if (t) t.focus();
  }

    // Make a visual (Sam, Sheet 120 cards 1 and 4): for a college the record pair is
  // written now; for any other entity the brief is written with the entity set.
  function makeForm() {
    var f = state.make || {};
    var kind = f.for_kind || "college", college = kind === "college";
    var names = college ? collegeNames() : kind === "district" ? districtNames() : [];
    var seg = FOR_ORDER.map(function (k) {
      return '<button type="button" data-makefor="' + k + '" aria-pressed="' + (kind === k) + '">' + esc(MAKE_WORDS[k]) + "</button>";
    }).join("");
    return '<form class="lib-form" id="lib-makeform"><h2 class="lib-h">Make a visual</h2>' +
      "<p>" + (college
        ? "For a college the record pair is written as you press Make: the live CPL Opportunity page and its workbook, Made for College. List the page publicly when it is ready; the public link is the college's."
        : "For a district, an agency, a vendor or the Chancellor's Office, a brief: name the meeting, say what the visual must show, and link what you uploaded. The brief files as Requested with the entity set, and Copy the brief starts the session that builds the page on the agency template and files it here.") + "</p>" +
      '<div class="lib-grid">' +
      '<div class="lib-field wide"><span class="lib-seglabel" id="lm-for-l">Made for</span><div class="lib-seg" role="group" aria-labelledby="lm-for-l">' + seg + "</div></div>" +
      (kind === "other" ? '<div class="lib-field"><label for="lm-forcat">Other: the category</label><input id="lm-forcat" type="text" required maxlength="80" value="' + esc(f.for_category || "") + '" placeholder="Foundation, union, school district"></div>' : "") +
      '<div class="lib-field wide"><label for="lm-forname">For</label><input id="lm-forname" type="text" required maxlength="200"' +
      (names.length ? ' list="lib-names-' + (college ? "colleges" : "districts") + '"' : "") + ' value="' + esc(f.for_name || "") + '" placeholder="' + (college ? "Start typing the college\'s name" : "The entity\'s name") + '"></div>' +
      '<div class="lib-field wide"><label for="lm-occasion">Occasion</label><input id="lm-occasion" type="text" value="' + esc(f.occasion || "") + '" placeholder="CSM meeting, 2026-10-28"></div>' +
      '<div class="lib-field"><label for="lm-by">Your name</label><input id="lm-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      (college ? '<p class="lib-line">A college\'s name comes from MAP\'s list, so the filter matches the CPL Pathways pick.' + (state.names === null ? " Loading the list\u2026" : "") + "</p>" : "") +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">" + (college ? "Make the pair" : "Write the brief") + "</button>" +
      '<button type="button" class="lib-btn" data-makecancel="1">Cancel</button></div></form>';
  }

  function startForm() {
    var f = state.start || {};
    return '<form class="lib-form" id="lib-startform"><h2 class="lib-h">Start a piece</h2>' +
      "<p>Say what the piece is for and what it must say. The Library keeps the brief as a Requested record. " +
      "Claude starts the draft from it, in a new session you paste the brief into or in the next scheduled run, and hands each draft over for the " +
      '<a href="' + LIBRARY_FOLDER + '" target="_blank" rel="noopener">CPLLibrary folder</a>\'s Drafts folder.</p>' +
      '<div class="lib-grid">' +
      '<div class="lib-field"><label for="ls-kind">Kind</label><select id="ls-kind">' + opt("visual", "Visual (a page opened in a browser)", f.kind) + opt("deck", "Deck", f.kind) + opt("spreadsheet", "Spreadsheet", f.kind) +
      opt("film", "Film", f.kind) + opt("document", "Document (Word, PDF)", f.kind) + "</select></div>" +
      '<div class="lib-field wide"><label for="ls-title">Working title</label><input id="ls-title" type="text" required placeholder="What colleges can expect from the 2026-27 funding" value="' + esc(f.title || "") + '"></div>' +
      '<div class="lib-field"><label for="ls-occasion">Occasion</label><input id="ls-occasion" type="text" placeholder="Vision 2030 Noncredit Summit" value="' + esc(f.occasion || "") + '"></div>' +
      forFields("ls", f) +
      '<div class="lib-field"><label for="ls-due">Needed by</label><input id="ls-due" type="text" placeholder="The week of the summit"></div>' +
      '<div class="lib-field"><label for="ls-seen">For</label><select id="ls-seen">' + opt("team", "Team", f.seen_by) + opt("colleges", "Colleges", f.seen_by) + opt("public", "Public", f.seen_by) + "</select></div>" +
      '<div class="lib-field wide"><label for="ls-say">What it must say</label><input id="ls-say" type="text" required placeholder="Three points, in the order the audience needs them"></div>' +
      '<div class="lib-field wide"><label for="ls-sources">Data and sources</label><input id="ls-sources" type="text" placeholder="live_metrics.json, the funding model, last year\'s deck"></div>' +
      '<div class="lib-field wide"><label for="ls-shape">Length, template or style</label><input id="ls-shape" type="text" placeholder="Five slides on the CO template; or 100 seconds with music and Sierra\'s voice"></div>' +
      sourcesFields("ls") +
      '<div class="lib-field"><label for="ls-by">Your name</label><input id="ls-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">Save the brief</button>" +
      '<button type="button" class="lib-btn" data-startcancel="1">Cancel</button></div></form>';
  }

  // Copy the request, beside Edit on any record with changes to make; once
  // pressed, the paste shows under the card for a reader to select by hand.
  function requestBtn(r) {
    return '<button type="button" class="lib-btn primary" data-request="' + esc(r.id) + '">' +
      (state.requestShown[r.id] ? "Copy again" : "Copy the request") + "</button>";
  }
  function requestBox(r) {
    if ((!r.refresh_note && !regenState(r)) || !state.requestShown[r.id]) return "";
    return '<label class="lib-vh" for="lib-r-' + esc(r.id) + '">The request to paste into a new session</label>' +
      '<textarea class="lib-brief" id="lib-r-' + esc(r.id) + '" readonly>' + esc(requestText(r)) + "</textarea>";
  }

  function devItem(r) {
    var b = r.brief || {};
    var at = STEPS.indexOf(r.status);
    var steps = STEPS.map(function (k, i) {
      return '<li class="' + (i < at ? "done" : i === at ? "now" : "") + '"' + (i === at ? ' aria-current="step"' : "") + ">" + STATUS[k] + "</li>";
    }).join("");
    var kicker = [KIND[r.kind] || r.kind, "for " + seenWord(r)];
    if (b.due) kicker.push("needed " + b.due.charAt(0).toLowerCase() + b.due.slice(1));
    var shown = !!state.briefShown[r.id];
    var acts = '<button type="button" class="lib-btn primary" data-brief="' + esc(r.id) + '">' + (shown ? "Copy again" : "Copy the brief") + "</button>";
    // File it is the step the brief's paste names: it links the draft and moves the piece to Draft.
    acts += r.url ? '<a class="lib-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">Open the draft</a>'
      : '<button type="button" class="lib-btn" data-file="' + esc(r.id) + '">File it</button>';
    acts += '<button type="button" class="lib-btn" data-edit="' + esc(r.id) + '">Edit record</button>';
    if (r.status !== "requested") acts += regenBtn(r);
    if (r.refresh_note || regenState(r)) acts += requestBtn(r);
    return '<article class="lib-devitem" aria-labelledby="lib-t-' + esc(r.id) + '"><div>' +
      '<p class="lib-kicker">' + esc(kicker.join(" · ")) + "</p>" +
      '<h3 class="lib-title" id="lib-t-' + esc(r.id) + '">' + esc(r.title) + "</h3>" +
      (b.say ? "<p>" + esc(b.say) + "</p>" : "") +
      (r.occasion ? '<p class="lib-line">' + esc(r.occasion) + "</p>" : "") +
      '<ol class="lib-steps" aria-label="Where this piece stands">' + steps + "</ol>" +
      (shown ? '<label class="lib-vh" for="lib-b-' + esc(r.id) + '">The brief to paste into a new session</label><textarea class="lib-brief" id="lib-b-' + esc(r.id) + '" readonly>' + esc(briefText(r)) + "</textarea>" : "") +
      (r.refresh_note ? '<p class="lib-line"><b>Changes to make:</b> ' + esc(r.refresh_note) + "</p>" : "") +
      (sourceList(r).length ? '<div class="lib-line"><b>Documents to work from:</b> ' + srcListHtml(sourceList(r)) + "</div>" : "") +
      regenBox(r) + requestBox(r) +
      '</div><div class="lib-acts">' + acts + "</div>" +
      (state.edit === r.id ? '<div class="lib-details">' + editForm(r) + "</div>" : "") + "</article>";
  }

  function devHtml(rows) {
    var dev = rows.filter(isDev);
    if (!dev.length) return "";
    dev.sort(function (a, b) { return String(b.created_at || "").localeCompare(String(a.created_at || "")); });
    return '<section class="lib-dev" aria-labelledby="lib-dev-h"><div class="lib-ghead"><h2 class="lib-h" id="lib-dev-h">In development</h2><span class="count">' +
      dev.length + (dev.length === 1 ? " piece" : " pieces") + "</span></div>" + dev.map(devItem).join("") + "</section>";
  }

  function registerRows(rows) { return rows.filter(function (r) { return !isDev(r); }); }
  function countLine(all) {
    var rows = registerRows(all);
    var shown = rows.filter(matches), gs = groups(shown);
    return shown.length === rows.length
      ? rows.length + (rows.length === 1 ? " piece" : " pieces") + " across " + gs.length + (gs.length === 1 ? " occasion" : " occasions")
      : "Showing " + shown.length + " of " + rows.length + " pieces";
  }
  function listHtml(all) {
    var rows = registerRows(all);
    var shown = rows.filter(matches), gs = groups(shown);
    if (!rows.length) return '<p class="lib-empty">The Library is empty. Add the first piece with Add to the Library.</p>';
    if (!shown.length) return '<p class="lib-empty">Nothing matches these filters. Clear the search or choose All.</p>';
    return gs.map(function (g, i) {
      return '<section class="lib-group" aria-labelledby="lib-g-' + i + '"><div class="lib-ghead"><h2 class="lib-h" id="lib-g-' + i + '">' + esc(g.name) +
        '</h2><span class="count">' + g.rows.length + (g.rows.length === 1 ? " piece" : " pieces") + "</span></div>" +
        '<div class="lib-items">' + g.rows.map(item).join("") + "</div></section>";
    }).join("");
  }
  // Typing in the search box repaints only the list, so the box keeps its caret.
  function renderList() {
    var reg = document.getElementById("lib-register"), cnt = document.getElementById("lib-count");
    if (!reg || !state.rows) { render(); return; }
    reg.innerHTML = listHtml(state.rows);
    if (cnt) cnt.textContent = countLine(state.rows);
  }

  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    ensureCss();
    root.style.cssText = "";
    var head = '<h2 class="lib-h lib-top">Library</h2><p class="lib-lede">Every visual, deck, film and document the CPL Initiative has made: what it is, who it is made for, where the file lives, who may see it, and how to rebuild it.</p>';
    // Two views (Sam, Open Asks Sheet 121 card 1, 2026-10-23): the pieces, and the Knowledge
    // Base reading portal, which keeps its own sign-in and so opens without the team phrase.
    head += '<div class="lib-views" role="group" aria-label="Library views">' +
      '<button type="button" data-view="pieces" aria-pressed="' + (state.view !== "kb") + '">Pieces</button>' +
      '<button type="button" data-view="kb" aria-pressed="' + (state.view === "kb") + '">Knowledge Base</button></div>';
    var kbView = document.getElementById("library-kb");
    if (state.view === "kb") {
      root.innerHTML = head + '<p class="lib-line">The team reading portal over the public CPL Knowledge Base, with its own sign-in. A piece whose substance is knowledge links its KB note from its record; Pieces lists the ones still without one under Needs attention.</p>';
      if (kbView) kbView.hidden = false;
      return;
    }
    if (kbView) kbView.hidden = true;

    if (!teamPhrase()) {
      root.innerHTML = head;
      if (window.CPL_TEAM_PHRASE && typeof window.CPL_TEAM_PHRASE.lockedBanner === "function") {
        root.appendChild(window.CPL_TEAM_PHRASE.lockedBanner({ what: "The Library" }));
      } else {
        root.insertAdjacentHTML("beforeend", '<p class="lib-empty">The Library opens with the team phrase. Unlock from the About menu in the header.</p>');
      }
      return;
    }
    if (state.error) { root.innerHTML = head + '<p class="lib-msg err" role="alert">' + esc(state.error) + "</p>"; return; }
    if (!state.rows) { root.innerHTML = head + '<p class="lib-line">Loading the Library&hellip;</p>'; return; }

    var rows = registerRows(state.rows);
    var counts = {};
    FLAG_ORDER.forEach(function (k) { counts[k] = rows.filter(function (r) { return flagsOf(r).indexOf(k) >= 0; }).length; });
    var flagBtns = FLAG_ORDER.filter(function (k) { return counts[k] > 0; }).map(function (k) {
      return '<button type="button" class="lib-flag" data-flag="' + k + '" aria-pressed="' + (state.flag === k) + '"><span class="n">' +
        counts[k] + '</span><span class="w">' + esc(FLAGS[k].count) + "</span></button>";
    }).join("");
    var attention = '<section class="lib-attention" aria-labelledby="lib-att-h"><h2 class="lib-h" id="lib-att-h">Needs attention</h2>' +
      (flagBtns ? '<div class="lib-flagrow">' + flagBtns + "</div>" : '<p class="lib-clear">Nothing. Every piece is filed and has an audience.</p>') + "</section>";

    var segBtn = function (k, label) { return '<button type="button" data-kind="' + k + '" aria-pressed="' + (state.kind === k) + '">' + label + "</button>"; };
    var forBtn = function (k, label) { return '<button type="button" data-madefor="' + k + '" aria-pressed="' + (state.madeFor === k) + '">' + esc(label) + "</button>"; };
    var presentFor = {}, forNames = {};
    rows.forEach(function (r) { if (r.for_kind) presentFor[r.for_kind] = true; if (r.for_name) forNames[r.for_name] = true; });
    var nameOpts = Object.keys(forNames).sort().map(function (n) { return opt(n, n, state.forName); }).join("");
    var controls = '<section aria-label="Find in the Library"><div class="lib-controls">' +
      '<div class="lib-field grow"><label for="lib-q">Search</label><input id="lib-q" type="search" autocomplete="off" placeholder="Title, occasion, entity or file name" value="' + esc(state.q) + '"></div>' +
      '<div class="lib-field"><span class="lib-seglabel" id="lib-kind-l">Kind</span><div class="lib-seg" role="group" aria-labelledby="lib-kind-l">' +
      segBtn("all", "All") + segBtn("visual", "Visuals") + segBtn("deck", "Decks") + segBtn("spreadsheet", "Spreadsheets") + segBtn("film", "Films") + segBtn("document", "Documents") + "</div></div>" +
      '<div class="lib-field"><span class="lib-seglabel" id="lib-for-l">Made for</span><div class="lib-seg" role="group" aria-labelledby="lib-for-l">' +
      forBtn("all", "All") + FOR_ORDER.filter(function (k) { return k !== "other" || presentFor.other; }).map(function (k) { return forBtn(k, FOR_PLURAL[k]); }).join("") + "</div></div>" +
      '<div class="lib-field"><label for="lib-for">For</label><select id="lib-for">' + opt("all", "Anyone we made something for", state.forName) + nameOpts + "</select></div>" +
      '<div class="lib-field"><label for="lib-seen">Seen by</label><select id="lib-seen">' + opt("all", "Anyone", state.seen) + opt("team", "Team", state.seen) +
      opt("colleges", "Colleges", state.seen) + opt("public", "Public", state.seen) + opt("unset", "Not set", state.seen) + "</select></div>" +
      '<div class="lib-field"><label for="lib-status">Status</label><select id="lib-status">' + opt("all", "Any", state.status) + opt("draft", "Draft", state.status) +
      opt("approved", "Approved", state.status) + opt("presented", "Presented", state.status) + opt("unset", "Not set", state.status) + "</select></div>" +
      '<button type="button" class="lib-btn primary" id="lib-make" aria-expanded="' + (state.make ? "true" : "false") + '">Make a visual</button>' +
      '<button type="button" class="lib-btn" id="lib-start" aria-expanded="' + (state.start ? "true" : "false") + '">Start a piece</button>' +
      '<button type="button" class="lib-btn" id="lib-add" aria-expanded="' + (state.form ? "true" : "false") + '">Add to the Library</button>' +
      "</div>" + datalists() + (state.make ? makeForm() : "") + (state.start ? startForm() : "") + (state.form ? addForm() : "") +
      (state.message ? '<p class="lib-msg' + (state.msgErr ? " err" : "") + '" role="status">' + esc(state.message) + "</p>" : "");

    controls += '<p class="lib-line" role="status" id="lib-count">' + countLine(state.rows) + "</p></section>";
    var list = devHtml(state.rows) + '<div id="lib-register">' + listHtml(state.rows) + "</div>";


    var how = '<footer class="lib-how" aria-labelledby="lib-how-h"><h2 class="lib-h" id="lib-how-h">How the Library works</h2>' +
      "<p>The Library keeps one record per piece, and the file lives on the MAP team's SharePoint site: approved pieces in the " +
      '<a href="' + LIBRARY_FOLDER + '" target="_blank" rel="noopener">CPLLibrary folder</a>, drafts in its Drafts folder. ' +
      "The repos keep only the source that rebuilds each piece.</p>" +
      "<p>Start a piece saves a brief as a Requested record. Claude drafts it, in a new session you paste the brief into or in the next scheduled run, hands each draft over for the Drafts folder, and moves the record along: Requested, Draft, Approved, Presented. Each new version is its own file, and the earlier ones stay.</p>" +
      "<p>Claude hands each new piece over the day it makes it, and a session on Sam's computer saves it straight into the synced folder. Anyone on the team files one by pasting a link. A film a public page plays stays where that page serves it.</p>" +
      "<p>Who can open a file is read from where it lives, so a file in the public repo that Sam has not cleared for an audience shows under Needs attention.</p>" +
      "<p>A piece whose substance is knowledge (a training-facts page, a guide, an explainer's argument) gets a note in the public CPL Knowledge Base through its curation pipeline, and the record links it; a deck, a film or a data piece does not. Needs attention names a knowledge piece without a note. The Knowledge Base view above is the team's reading portal over that repo.</p></footer>";

    // A full repaint (a filter click, Retire's question) must not wipe what was
    // typed into an open form. Restore only into the SAME form: the edit ids are
    // shared by every record, so a value typed for one must not land in another.
    var typed = {};
    Array.prototype.forEach.call(root.querySelectorAll("input[id^='la-'],select[id^='la-'],input[id^='le-'],select[id^='le-'],textarea[id^='le-'],input[id^='ls-'],select[id^='ls-'],textarea[id^='ls-'],input[id^='lm-'],select[id^='lm-'],input[id^='rg-'],select[id^='rg-'],textarea[id^='rg-'],input[id^='ro-']"), function (n) { typed[n.id] = n.value; });
    var sameAdd = painted.formFor === state.formFor && painted.form === !!state.form;
    var sameEdit = painted.edit === state.edit;
    var focusId = document.activeElement && document.activeElement.id;
    root.innerHTML = head + attention + controls + list + how;
    Object.keys(typed).forEach(function (id) {
      if ((id.indexOf("la-") === 0 && !sameAdd) || (id.indexOf("le-") === 0 && !sameEdit) || (id.indexOf("ls-") === 0 && !state.start) || (id.indexOf("lm-") === 0 && !state.make) ||
        (id.indexOf("rg-") === 0 && (!state.regen || painted.regen !== state.regen))) return;
      var n = document.getElementById(id); if (n) n.value = typed[id];
    });
    painted = { form: !!state.form, formFor: state.formFor, edit: state.edit, regen: state.regen };
    if (focusId) { var again = document.getElementById(focusId); if (again && again.focus) again.focus(); }
  }

  // ── events (delegated on the root, wired once) ──────────────────────────────
  function readAddForm() {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    return { url: g("la-url"), title: g("la-title"), kind: g("la-kind"), occasion: g("la-occasion"),
      seen_by: g("la-seen"), status: g("la-status"), by: g("la-by"), knowledge: g("la-knowledge"), kb_note: g("la-kbnote") };
  }

  function submitAdd() {
    var f = readAddForm();
    if (!/^https:\/\//.test(f.url)) { say("The link must start with https://.", true); render(); return; }
    if (!f.by) { say("Add your name, so the record says who filed it.", true); render(); return; }
    rememberAuthor(f.by);
    var filing = state.formFor;
    var p;
    var drafted = false;
    if (filing) {
      var fr = byId(filing) || {};
      var body = { url: f.url, home: homeForUrl(f.url), updated_by: f.by };
      // A requested piece's first file makes it a Draft, step 2 of In development, as the
      // brief's paste promises; and a record filed without a date takes the day it is filed.
      if (fr.status === "requested") { body.status = "draft"; drafted = true; }
      if (!fr.made_on) body.made_on = today();
      p = write(TABLE_URL + "?id=eq." + encodeURIComponent(filing), { method: "PATCH", body: body });
    } else {
      if (!f.title) { say("Add a title.", true); render(); return; }
      var madeFor = readFor("la"), fp = forProblem(madeFor);
      if (fp) { say(fp, true); render(); return; }
      p = write(TABLE_URL, { method: "POST", body: {
        slug: slugFor(f.title), title: f.title, kind: f.kind || "deck", occasion: f.occasion || null,
        made_on: today(), seen_by: f.seen_by || null, status: f.status || null,
        url: f.url, home: homeForUrl(f.url), added_by: f.by,
        for_kind: madeFor.for_kind, for_category: madeFor.for_category, for_name: madeFor.for_name,
        knowledge: knowledgeValue(f.knowledge, f.kb_note), kb_note: f.kb_note || null
      } });
    }
    p.then(function () {
      say(!filing ? "Added to the Library." : drafted ? "Filed. The record links to the file and is now a Draft, under In development."
        : "Filed. The record now links to the file.");
      state.form = null; state.formFor = null; delete state.forPick.la;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function submitStart() {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    var f = { kind: g("ls-kind"), title: g("ls-title"), occasion: g("ls-occasion"), due: g("ls-due"), seen_by: g("ls-seen"),
      say: g("ls-say"), sources: g("ls-sources"), shape: g("ls-shape"), by: g("ls-by") };
    if (!f.title) { say("Add a working title.", true); render(); return; }
    if (!f.say) { say("Say what the piece must say.", true); render(); return; }
    if (!f.by) { say("Add your name, so the brief says who asked for it.", true); render(); return; }
    var madeFor = readFor("ls"), fp = forProblem(madeFor);
    if (fp) { say(fp, true); render(); return; }
    var srcErr = takeSource("ls", f.by);
    if (srcErr) { say(srcErr, true); render(); return; }
    rememberAuthor(f.by);
    var brief = { say: f.say, requested_by: f.by, requested_on: today() };
    if (f.sources) brief.sources = f.sources;
    if (f.shape) brief.shape = f.shape;
    if (f.due) brief.due = f.due;
    write(TABLE_URL, { method: "POST", body: {
      slug: slugFor(f.title), title: f.title, kind: f.kind || "deck", occasion: f.occasion || null,
      status: "requested", seen_by: f.seen_by || "team", home: "not_filed", url: null, added_by: f.by, brief: brief,
      for_kind: madeFor.for_kind, for_category: madeFor.for_category, for_name: madeFor.for_name,
      sources: state.src.ls || []
    } }).then(function (saved) {
      var row = Array.isArray(saved) ? saved[0] : saved;
      if (row && row.id) state.briefShown[row.id] = true;
      say("Saved as Requested. Copy the brief into a new session, or the next scheduled run picks it up.");
      state.start = null; delete state.forPick.ls; state.src.ls = [];
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  // The record pair a college's visual is (the first twelve were filed this way by the
  // CPL Opportunity side sessions, 2026-10-21): the live page, and the workbook its
  // Download CPL Extract makes, which is filed once the .xlsx is in SharePoint.
  function collegePair(name, occasion, by) {
    var base = collegeSlug(name), when = today();
    var made = by + ", from the Library tab's Make a visual, " + when;
    return [{
      slug: "cpl-opportunity-" + base + "-visual", title: name + ": CPL Opportunity Analysis", kind: "visual",
      occasion: occasion || null, made_on: when, version: "1", status: "draft", seen_by: "colleges",
      home: "web", url: OPPORTUNITY_PAGE + encodeURIComponent(name), file_type: "html", extent: "One page",
      summary: name + "'s COCI programs and courses, its MAP exhibits (AP and IB excluded), and the statewide credit recommendations it could adopt, each with a Could Adopt link to MAP.",
      rebuild_from: "cpl-project-tracker/college_cpl_workbook.js and library/cpl-opportunity/index.html (built in the browser from published data); the MAP team's notes for this college in library/cpl-opportunity/notes/" + base + ".json",
      note: "Live page: it rebuilds from the current data on each visit.",
      for_kind: "college", for_name: name, made_by: made, added_by: by
    }, {
      slug: "cpl-opportunity-" + base + "-workbook", title: name + ": CPL Opportunity Analysis (workbook)", kind: "spreadsheet",
      occasion: occasion || null, made_on: when, version: "1", status: "draft", seen_by: "colleges",
      home: "not_filed", url: null, file_type: "xlsx", extent: "Six tabs",
      summary: "The Excel analysis for " + name + ": Download CPL Extract on its CPL Opportunity page, then file the .xlsx here.",
      rebuild_from: "Download CPL Extract on the " + name + " page (cpl-project-tracker/college_cpl_workbook.js)",
      note: "File it once the .xlsx is in SharePoint CPLLibrary.",
      for_kind: "college", for_name: name, made_by: made, added_by: by
    }];
  }

  function submitMake() {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    var f = state.make || {}, kind = f.for_kind || "college";
    var name = g("lm-forname"), cat = kind === "other" ? g("lm-forcat") : "", occasion = g("lm-occasion"), by = g("lm-by");
    state.make = { for_kind: kind, for_name: name, for_category: cat, occasion: occasion };
    if (!name) { say("Name who the visual is for.", true); render(); return; }
    if (kind === "other" && !cat) { say("Type the category for Other, so the filter can offer it again.", true); render(); return; }
    if (!by) { say("Add your name, so the record says who made it.", true); render(); return; }
    rememberAuthor(by);
    if (kind !== "college") {
      // Not a college: the brief, with the entity set, so Copy the brief hands the paste over.
      state.forPick.ls = kind; state.src.ls = [];
      state.start = { kind: "visual", for_kind: kind, for_category: cat || null, for_name: name, occasion: occasion,
        title: name + ": CPL " + (kind === "co" ? "visual" : "opportunities") };
      state.make = null; say(""); render();
      var st = document.getElementById("ls-say"); if (st) st.focus();
      return;
    }
    var college = state.names && state.names.length ? mapCollege(name) : name;
    if (!college) { say("Pick the college from MAP's list (start typing its name), so the filter matches the CPL Pathways pick.", true); render(); return; }
    var pair = collegePair(college, occasion, by);
    var have = (state.rows || []).filter(function (r) { return r.slug === pair[0].slug || r.slug === pair[1].slug; });
    if (have.length) { say(college + "'s pair is already in the Library: " + have.map(function (r) { return r.title; }).join("; ") + ".", true); render(); return; }
    write(TABLE_URL, { method: "POST", body: pair[0] }).then(function () {
      return write(TABLE_URL, { method: "POST", body: pair[1] });
    }).then(function () {
      say("Made. " + college + "'s CPL Opportunity page and its workbook are in the Library, Made for College. List the page publicly when it is ready.");
      state.make = null;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function copyRequest(id) {
    var r = byId(id);
    if (!r) return;
    state.requestShown[id] = true;
    var text = requestText(r);
    var fallback = function () {
      say("Select the request and copy it."); render();
      var t = document.getElementById("lib-r-" + id); if (t) { t.focus(); t.select(); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say("Copied. Paste it into a new session, or leave it for the scheduled run."); render(); }, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }

  function copyBrief(id) {
    var r = byId(id);
    if (!r) return;
    state.briefShown[id] = true;
    var text = briefText(r);
    var fallback = function () {
      say("Select the brief and copy it."); render();
      var t = document.getElementById("lib-b-" + id); if (t) { t.focus(); t.select(); }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say("Copied. Paste it into a new session."); render(); }, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }

  function submitEdit(id) {
    var g = function (x) { var n = document.getElementById(x); return n ? n.value.trim() : ""; };
    var by = g("le-by"), url = g("le-url");
    if (!by) { say("Add your name, so the history says who changed it.", true); render(); return; }
    if (url && !/^https:\/\//.test(url)) { say("The link must start with https://.", true); render(); return; }
    var madeFor = readFor("le"), fp = forProblem(madeFor);
    if (fp) { say(fp, true); render(); return; }
    rememberAuthor(by);
    var body = { status: g("le-status") || null, seen_by: g("le-seen") || null,
      url: url || null, home: url ? homeForUrl(url) : "not_filed", updated_by: by,
      for_kind: madeFor.for_kind, for_category: madeFor.for_category, for_name: madeFor.for_name,
      knowledge: knowledgeValue(g("le-knowledge"), g("le-kbnote")), kb_note: g("le-kbnote") || null };
    // A piece started as a brief has no date until it is made; one that moves past Requested
    // without one takes today's, so it sorts with its peers rather than last.
    var r = byId(id) || {};
    if (!r.made_on && body.status && body.status !== "requested") body.made_on = today();
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: body }).then(function () {
      say("Saved. The earlier version is in the history.");
      state.edit = null; state.retireAsk = null; delete state.forPick.le;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function submitRegen(id) {
    var r = byId(id);
    if (!r) return;
    var g = function (x) { var n = document.getElementById(x); return n ? n.value.trim() : ""; };
    var by = g("rg-by");
    if (!by) { say("Add your name, so the request says who asked.", true); render(); return; }
    var srcErr = takeSource("rg", by);
    if (srcErr) { say(srcErr, true); render(); return; }
    rememberAuthor(by);
    var regen = { requested_at: new Date().toISOString(), requested_by: by, publish: r.public_listed && g("rg-pub") === "replace" ? "replace" : "show" };
    var body = { refresh_note: g("rg-note") || null, sources: state.src.rg || [], regen: regen, updated_by: by };
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: body }).then(function () {
      say("Requested. The next scheduled run rebuilds it and puts the draft on the card; Copy the request starts it in a session now.");
      state.regen = null; state.src.rg = [];
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  // Replace the public copy: the draft on the card becomes the public copy in the next
  // run. The request keeps everything it had and gains who approved it, and when.
  function approveRegen(id) {
    var r = byId(id);
    if (!r || regenState(r) !== "ready") return;
    var n = document.getElementById("ro-by-" + id), by = n ? n.value.trim() : "";
    if (!by) { say("Add your name, so the record says who approved the draft.", true); render(); return; }
    rememberAuthor(by);
    var regen = {};
    Object.keys(r.regen).forEach(function (k) { regen[k] = r.regen[k]; });
    regen.approved_at = new Date().toISOString(); regen.approved_by = by;
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: { regen: regen, updated_by: by } }).then(function () {
      say("Approved. The next scheduled run replaces the public copy with the draft.");
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function setPublic(id, listed) {
    var r = byId(id);
    if (!r) return;
    var token = reviewerToken();
    if (!token && !teamPhrase()) { say("Listing in the public library needs the team phrase or your reviewer sign-in. Enter the phrase, or sign in from About in the header, then try again.", true); render(); return; }
    var body = { p_slug: r.slug, p_listed: listed, p_by: storedAuthor() || null };
    if (listed) {
      var sum = ((document.getElementById("lp-sum") || {}).value || "").trim();
      var topics = ((document.getElementById("lp-topics") || {}).value || "").split(",")
        .map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 12);
      var shared = document.getElementById("lp-shared");
      if (!sum) { say("Add a public summary. It is what the public page and Sierra show.", true); render(); return; }
      if (shared && !shared.checked) { say("Set the claude.ai link to public first, then tick the box.", true); render(); return; }
      body.p_summary = sum; body.p_topics = topics;
    }
    state.busy = true; render();
    window.fetch(SET_PUBLIC_URL, {
      method: "POST",
      headers: token ? { apikey: SUPABASE_ANON, Authorization: "Bearer " + token, "Content-Type": "application/json" }
                     : headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body)
    }).then(function (res) {
      state.busy = false;
      if (!res.ok) return res.text().then(function (t) {
        throw new Error(/reviewer|team phrase/i.test(t) ? "The database wants the team phrase or a reviewer sign-in for this. Enter the phrase, or sign in from About, and try again." : "The listing was refused (" + res.status + "). " + String(t || "").slice(0, 200));
      });
      say(listed ? "Listed. It is on the public library now, and Sierra can link it." : "Removed from the public library. The record stays here.");
      state.pub = null;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function retire(id) {
    var by = (document.getElementById("le-by") || {}).value || storedAuthor();
    if (!by) { say("Add your name, so the history says who retired it.", true); render(); return; }
    rememberAuthor(by);
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH",
      body: { retired_at: new Date().toISOString(), updated_by: by } }).then(function () {
      say("Retired. The record left the list, and the history keeps it.");
      state.edit = null; state.retireAsk = null; state.open[id] = false;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
  }

  function copyLink(btn, id) {
    var r = byId(id), slot = document.getElementById("lib-c-" + id);
    if (!r || !r.url) return;
    var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy link"; }, 1800); };
    var fallback = function () {
      if (!slot) return;
      slot.innerHTML = '<input type="text" readonly aria-label="Link to copy" value="' + esc(r.url) + '">';
      var inp = slot.querySelector("input"); inp.focus(); inp.select();
      btn.textContent = "Select and copy";
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(r.url).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  var painted = { form: false, formFor: null, edit: null, regen: null };
  var wired = false;
  function wire(root) {
    if (wired) return;
    wired = true;
    root.addEventListener("input", function (e) {
      if (e.target.id === "lib-q") { state.q = e.target.value; renderList(); }
    });
    root.addEventListener("change", function (e) {
      if (e.target.id === "lib-seen") { state.seen = e.target.value; render(); }
      else if (e.target.id === "lib-status") { state.status = e.target.value; render(); }
      else if (e.target.id === "lib-for") { state.forName = e.target.value; render(); }
      else if (/^(la|ls|le)-forkind$/.test(e.target.id || "")) {
        // The type picked decides which fields follow it; repaint, keeping the caret's owner.
        var pfx = e.target.id.slice(0, 2);
        state.forPick[pfx] = e.target.value;
        if (e.target.value === "college" || e.target.value === "district") loadNames();
        render();
        var again = document.getElementById(pfx + "-forkind"); if (again) again.focus();
      }
    });
    root.addEventListener("submit", function (e) {
      e.preventDefault();
      if (e.target.id === "lib-addform") submitAdd();
      else if (e.target.id === "lib-makeform") submitMake();
      else if (e.target.id === "lib-startform") submitStart();
      else if (e.target.getAttribute("data-editform")) submitEdit(e.target.getAttribute("data-editform"));
      else if (e.target.getAttribute("data-pubform")) setPublic(e.target.getAttribute("data-pubform"), true);
      else if (e.target.getAttribute("data-regenform")) submitRegen(e.target.getAttribute("data-regenform"));
      else if (e.target.getAttribute("data-regenokform")) approveRegen(e.target.getAttribute("data-regenokform"));
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !root.contains(b)) return;
      var v;
      if ((v = b.getAttribute("data-kind"))) { state.kind = v; render(); }
      else if ((v = b.getAttribute("data-madefor"))) { state.madeFor = v; render(); }
      else if ((v = b.getAttribute("data-flag"))) { state.flag = state.flag === v ? null : v; render(); }
      else if (b.id === "lib-make") {
        state.make = state.make ? null : { for_kind: "college" }; state.start = null; state.form = null; state.formFor = null;
        say(""); render();
        if (state.make) { loadNames(); var mn = document.getElementById("lm-forname"); if (mn) mn.focus(); }
      }
      else if ((v = b.getAttribute("data-makefor"))) {
        state.make = state.make || {}; state.make.for_kind = v;
        if (v === "college" || v === "district") loadNames();
        render();
        var mb = root.querySelector('[data-makefor="' + v + '"]'); if (mb) mb.focus();
      }
      else if (b.getAttribute("data-makecancel")) { state.make = null; render(); var mk = document.getElementById("lib-make"); if (mk) mk.focus(); }
      else if (b.id === "lib-start") {
        state.start = state.start ? null : {}; state.form = null; state.formFor = null; state.make = null; delete state.forPick.ls; state.src.ls = [];
        say(""); render();
        var st = document.getElementById("ls-title"); if (st) st.focus();
      }
      else if (b.getAttribute("data-startcancel")) { state.start = null; render(); var sb = document.getElementById("lib-start"); if (sb) sb.focus(); }
      else if ((v = b.getAttribute("data-brief"))) copyBrief(v);
      else if ((v = b.getAttribute("data-request"))) copyRequest(v);
      else if ((v = b.getAttribute("data-regen"))) {
        var rr = byId(v), opening2 = state.regen !== v;
        state.regen = opening2 ? v : null; state.src.rg = opening2 && rr ? sourceList(rr).slice() : [];
        say(""); render();
        var rn = document.getElementById(opening2 ? "rg-note" : ""); if (rn) rn.focus();
        else { var rb = root.querySelector('[data-regen="' + v + '"]'); if (rb) rb.focus(); }
      }
      else if (b.getAttribute("data-regencancel")) {
        var was = state.regen; state.regen = null; state.src.rg = []; render();
        var rb2 = was && root.querySelector('[data-regen="' + was + '"]'); if (rb2) rb2.focus();
      }
      else if ((v = b.getAttribute("data-srcadd"))) addSource(v);
      else if ((v = b.getAttribute("data-srcdel"))) {
        var parts = v.split(":"), lst = (state.src[parts[0]] || []).slice();
        lst.splice(+parts[1], 1); state.src[parts[0]] = lst; say("Removed. The record keeps it until the form saves."); render();
        var st2 = document.getElementById(parts[0] + "-stitle"); if (st2) st2.focus();
      }
      else if (b.id === "lib-add") {
        state.start = null; state.make = null; delete state.forPick.la;
        if (state.form && !state.formFor) { state.form = null; } else { state.form = {}; state.formFor = null; }
        say(""); render();
        var u = document.getElementById("la-url"); if (u) u.focus();
      }
      else if (b.getAttribute("data-formcancel")) { state.form = null; state.formFor = null; render(); var a = document.getElementById("lib-add"); if (a) a.focus(); }
      else if ((v = b.getAttribute("data-file"))) {
        var r = byId(v);
        state.form = { title: r ? r.title : "" }; state.formFor = v; say(""); render();
        var u2 = document.getElementById("la-url"); if (u2) u2.focus();
      }
      else if ((v = b.getAttribute("data-toggle"))) {
        state.open[v] = !state.open[v]; render();
        var t = root.querySelector('[data-toggle="' + v + '"]'); if (t) t.focus();
      }
      else if ((v = b.getAttribute("data-copy"))) copyLink(b, v);
      else if ((v = b.getAttribute("data-edit"))) { state.edit = state.edit === v ? null : v; state.retireAsk = null; render(); }
      else if ((v = b.getAttribute("data-edittop"))) {
        var opening = state.edit !== v;
        state.edit = opening ? v : null; state.retireAsk = null; if (opening) state.open[v] = true; render();
        var es = document.getElementById("le-status"); if (opening && es) es.focus();
      }
      else if ((v = b.getAttribute("data-pubtop"))) {
        state.pub = v; state.open[v] = true; say(""); render();
        var ps2 = document.getElementById("lp-sum"); if (ps2) ps2.focus();
      }
      else if (b.getAttribute("data-editcancel")) { state.edit = null; state.retireAsk = null; render(); }
      else if ((v = b.getAttribute("data-retire"))) { state.retireAsk = v; render(); }
      else if (b.getAttribute("data-retireno")) { state.retireAsk = null; render(); }
      else if ((v = b.getAttribute("data-retireyes"))) retire(v);
      else if ((v = b.getAttribute("data-pub"))) { state.pub = v; say(""); render(); var ps = document.getElementById("lp-sum"); if (ps) ps.focus(); }
      else if (b.getAttribute("data-pubcancel")) { state.pub = null; render(); }
      else if ((v = b.getAttribute("data-unpub"))) setPublic(v, false);
      else if ((v = b.getAttribute("data-view"))) setView(v, true);
    });
    window.addEventListener("hashchange", function () {
      var v = viewFromHash();
      if (v !== state.view && document.getElementById(ROOT_ID)) setView(v, false);
    });
    window.addEventListener("cpl-tab-activated", function (e) {
      if (e && e.detail && e.detail.tab === "library") { state.view = viewFromHash(); load(); }
    });
  }

  // ── Ask Sierra beside the tab (Sam, 2026-10-24: "Library and more importantly on the
  // public library site") ──────────────────────────────────────────────────────
  // sierra/sidebar.js, the chip and side bar the public library carries, loaded on the
  // first visit to this tab and shown on this tab alone: every other tab hides the chip
  // and shuts an open bar. Its tokens take First Light's roles, set on the bar's own
  // elements so no :root changes in either HTML.
  function onLibraryTab() {
    return !!(window.CPL_TABS && typeof window.CPL_TABS.current === "function" && window.CPL_TABS.current() === "library");
  }
  function showSierraBar() {
    if (window.CPL_SIERRA_BAR && typeof window.CPL_SIERRA_BAR.setChip === "function") window.CPL_SIERRA_BAR.setChip(onLibraryTab());
  }
  function ensureSierraBar() {
    if (!document.getElementById("lib-sbar-css")) {
      var st = document.createElement("style");
      st.id = "lib-sbar-css";
      st.textContent = ".sbar,.sbar-chip{--sierra-bar-bg:var(--surface-opaque);--sierra-bar-ink:var(--text-body);" +
        "--sierra-bar-heading:var(--text-strong);--sierra-bar-link:var(--accent-link);--sierra-bar-line:var(--border);" +
        "--sierra-bar-focus:var(--focus-ring);--sierra-bar-chip-bg:var(--seal-blue);--sierra-bar-chip-ink:var(--on-seal-blue);" +
        "--sierra-bar-shadow:color-mix(in srgb,var(--text-strong) 16%,transparent);" +
        "--sierra-bar-head-font:'Playfair Display',Georgia,serif;}";
      document.head.appendChild(st);
    }
    if (window.CPL_SIERRA_BAR) return showSierraBar();
    if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") {
      window.CPL_TABS.loadScript("sierra/sidebar.js", "CPL_SIERRA_BAR", showSierraBar);
    }
  }
  window.addEventListener("cpl-tab-activated", function (e) {
    if (e && e.detail && e.detail.tab === "library") ensureSierraBar();
    else showSierraBar();
  });

  function activate() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    wire(root);
    ensureSierraBar();
    state.view = viewFromHash();
    return load();
  }

  window.CPL_LIBRARY = {
    activate: activate,
    render: render,
    load: load,
    _state: state,
    _flagsOf: flagsOf,
    _isDev: isDev,
    _briefText: briefText,
    _homeForUrl: homeForUrl,
    _homeOf: homeOf,
    _slugFor: slugFor,
    _forLine: forLine,
    _collegeSlug: collegeSlug,
    _collegePair: collegePair,
    _viewFromHash: viewFromHash,
    _knowledgeValue: knowledgeValue,
    _regenState: regenState,
    _requestText: requestText,
    _sourcesText: sourcesText,
    _ensureSierraBar: ensureSierraBar
  };
})();
