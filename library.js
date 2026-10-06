// library.js — the Library tab: one record per deck, film and document the CPL
// Initiative makes, with a link to where the file lives.
//
// Sam, 2026-10-05: "I think I may need a COBI tab to store and retrieve artifacts
// like this ppt and video. Advise". He approved the mockup
// (https://claude.ai/artifact/VPpbDp7DD4acvHErVFkCqH) and ruled: build it; approved
// files live in the team Drive folder; drafts stay out of the public tracker repo.
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
// STATIC module, lazy-loaded on first #library open (both HTMLs, Rule 4). It
// injects its own CSS (the ensureCerScopeCss pattern). Tests: tests/library.test.js
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var TABLE_URL = SUPABASE_URL + "/rest/v1/cpl_library";
  var TEAM_KEY = "cpl_team_pass";
  var AUTHOR_KEY = "cpl_library_author";
  var ROOT_ID = "library-root";
  // Sam's CPLLibrary folder (made 2026-10-05) inside the Drive folder he named for
  // approved files; Drafts sits inside it (his call 4: drafts go to Drive too).
  var DRIVE_FOLDER = "https://drive.google.com/drive/folders/13WnIL1j-Qo3CJ5znVFZhs5wmAjJqOxxN";
  var DRAFTS_FOLDER = "https://drive.google.com/drive/folders/15eXeJb9OIl1nOFE4Tykr1y7rBGKBUvih";

  var KIND = { deck: "Deck", film: "Film", document: "Document", spreadsheet: "Spreadsheet" };
  var STATUS = { requested: "Requested", draft: "Draft", approved: "Approved", presented: "Presented" };
  var STEPS = ["requested", "draft", "approved", "presented"];
  var SEEN = { team: "Team", colleges: "Colleges", "public": "Public" };
  var HOME = {
    drive: { label: "Team Drive", reach: "People the Drive file is shared with." },
    public_repo: { label: "Public tracker repo", reach: "Anyone with the link. The tracker repo is public, so the file downloads from github.com without a sign-in." },
    vault: { label: "Vault (private repo)", reach: "People with access to the private CPLBrain repo." },
    web: { label: "Web link", reach: "Whoever the linked site allows." },
    not_filed: { label: "Not filed", reach: "No one can find it from here. It is not in the tracker, the vault or the team Drive." }
  };
  var FLAGS = {
    not_filed: { word: "Not filed", count: "not filed" },
    public_unset: { word: "Public file, no audience set", count: "public files with no audience set" },
    refresh: { word: "Refresh figures", count: "with figures to refresh" }
  };
  var FLAG_ORDER = ["not_filed", "public_unset", "refresh"];

  var state = {
    rows: null, loading: false, error: null,
    q: "", kind: "all", seen: "all", status: "all", flag: null,
    open: {}, edit: null, form: null, formFor: null, message: "", msgErr: false, busy: false,
    retireAsk: null, start: null, briefShown: {}
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
    if (/^https:\/\/(drive|docs)\.google\.com\//i.test(url)) return "drive";
    if (/^https:\/\/(github\.com|raw\.githubusercontent\.com)\/CPL-Initiative\/cpl-project-tracker\//i.test(url)) return "public_repo";
    if (/^https:\/\/github\.com\/samueltlee\/CPLBrain\//i.test(url)) return "vault";
    return "web";
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
    if (r.refresh_note) f.push("refresh");
    return f;
  }
  function say(text, isErr) { state.message = text; state.msgErr = !!isErr; }
  function statusWord(r) { return r.status ? STATUS[r.status] || r.status : "Not set"; }
  function seenWord(r) { return r.seen_by ? SEEN[r.seen_by] || r.seen_by : "Not set"; }
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
    if (state.q.trim()) {
      var hay = [r.title, r.occasion, r.file_name, r.summary, KIND[r.kind], r.made_by, r.version].join(" ").toLowerCase();
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
    var home = HOME[r.home] || HOME.web;
    var where = r.url
      ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(home.label) + "</a>"
      : esc(home.label);
    if (r.file_name) where += ", <code>" + esc(r.file_name) + "</code>";
    var rows = [
      ["Where it lives", where],
      ["Who can open it now", esc(home.reach)],
      ["Seen by", esc(r.seen_by ? seenWord(r) : "Not set. Sam decides who this is for.")],
      ["Made by", esc(r.made_by || "Not recorded.")],
      ["Approved", esc(r.ruling || "None recorded.")],
      ["Figures", esc(r.figures || "Not recorded.")]
    ];
    if (r.refresh_note) rows.push(["Refresh", esc(r.refresh_note)]);
    rows.push(["Rebuild from", r.rebuild_from ? "<code>" + esc(r.rebuild_from) + "</code>" : "Not recorded."]);
    if (r.note) rows.push(["Note", esc(r.note)]);
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
    html += '<div class="lib-actions-row"><button type="button" class="lib-btn" data-edit="' + esc(r.id) + '">Edit record</button></div>';
    if (state.edit === r.id) html += editForm(r);
    return html;
  }

  // The filer stamps filed_at (ISO, UTC) on each version it files (Sam's call 8).
  function filedWhen(v) {
    var m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(v.filed_at || "");
    return m ? fmtDate(m[1]) + ", " + m[2] + " UTC" : (v.date || "");
  }

  function opt(v, label, cur) { return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(label) + "</option>"; }

  function editForm(r) {
    var ask = state.retireAsk === r.id;
    return '<form class="lib-form" data-editform="' + esc(r.id) + '"><h3 class="lib-title">Edit this record</h3>' +
      "<p>Each edit keeps the record as it was in the history, so it can be undone.</p>" +
      '<div class="lib-grid">' +
      '<div class="lib-field"><label for="le-status">Status</label><select id="le-status">' +
      opt("", "Not set", r.status || "") + opt("requested", "Requested", r.status) + opt("draft", "Draft", r.status) + opt("approved", "Approved", r.status) + opt("presented", "Presented", r.status) + "</select></div>" +
      '<div class="lib-field"><label for="le-seen">Seen by</label><select id="le-seen">' +
      opt("", "Not set", r.seen_by || "") + opt("team", "Team", r.seen_by) + opt("colleges", "Colleges", r.seen_by) + opt("public", "Public", r.seen_by) + "</select></div>" +
      '<div class="lib-field wide"><label for="le-url">Link to the file</label><input id="le-url" type="url" value="' + esc(r.url || "") + '" placeholder="https://drive.google.com/file/d/..."></div>' +
      '<div class="lib-field wide"><label for="le-refresh">Figures to refresh</label><input id="le-refresh" type="text" value="' + esc(r.refresh_note || "") + '" placeholder="Leave empty when the figures are current"></div>' +
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
    acts += '<button type="button" class="lib-btn" data-toggle="' + esc(r.id) + '" aria-expanded="' + open + '" aria-controls="lib-d-' + esc(r.id) + '">' + (open ? "Hide details" : "Details") + "</button>";
    var chips = chip(r.status ? statusWord(r) : "Status: Not set", !r.status) +
      chip("Seen by: " + seenWord(r), !r.seen_by) +
      (r.home === "not_filed" ? "" : chip((HOME[r.home] || HOME.web).label));
    return '<article class="lib-item" aria-labelledby="lib-t-' + esc(r.id) + '">' + thumb(r) +
      '<div class="lib-body"><p class="lib-kicker">' + esc(kicker.filter(Boolean).join(" · ")) + "</p>" +
      '<h3 class="lib-title" id="lib-t-' + esc(r.id) + '">' + esc(r.title) + "</h3>" +
      (r.summary ? '<p class="lib-summary">' + esc(r.summary) + "</p>" : "") +
      '<ul class="lib-chips" aria-label="Record">' + chips + "</ul>" +
      (fl.length ? '<ul class="lib-flags" aria-label="Needs attention">' + fl.map(function (f) {
        return "<li>" + esc(f === "refresh" && r.refresh_note ? "Refresh figures: " + r.refresh_note : FLAGS[f].word) + "</li>";
      }).join("") + "</ul>" : "") +
      '</div><div class="lib-acts">' + acts + '<span class="lib-copyslot" id="lib-c-' + esc(r.id) + '"></span></div>' +
      '<div class="lib-details" id="lib-d-' + esc(r.id) + '"' + (open ? "" : " hidden") + ">" + (open ? details(r) : "") + "</div></article>";
  }

  function addForm() {
    var f = state.form || {};
    var filing = !!state.formFor;
    return '<form class="lib-form" id="lib-addform"><h2 class="lib-h">' + (filing ? "File this piece" : "Add to the Library") + "</h2>" +
      "<p>" + (filing ? "" : "The Library keeps the record and links to the file. ") +
      "Put the file in Drive first: an approved piece in the " +
      '<a href="' + DRIVE_FOLDER + '" target="_blank" rel="noopener">CPLLibrary folder</a>, a draft in its ' +
      '<a href="' + DRAFTS_FOLDER + '" target="_blank" rel="noopener">Drafts folder</a>. Then paste its link here.</p>' +
      '<div class="lib-grid">' +
      '<div class="lib-field wide"><label for="la-url">Link to the file</label><input id="la-url" type="url" required placeholder="https://drive.google.com/file/d/..." value="' + esc(f.url || "") + '"></div>' +
      (filing ? "" :
        '<div class="lib-field wide"><label for="la-title">Title</label><input id="la-title" type="text" required value="' + esc(f.title || "") + '"></div>' +
        '<div class="lib-field"><label for="la-kind">Kind</label><select id="la-kind">' + opt("deck", "Deck", f.kind) + opt("spreadsheet", "Spreadsheet", f.kind) + opt("film", "Film", f.kind) + opt("document", "Document", f.kind) + "</select></div>" +
        '<div class="lib-field"><label for="la-occasion">Occasion</label><input id="la-occasion" type="text" placeholder="Vision 2030 Noncredit Summit" value="' + esc(f.occasion || "") + '"></div>' +
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
      "It must say: " + (b.say || "") + "\n" +
      "Data and sources: " + (b.sources || "your call; fetch live data first for any CPL figure") + "\n" +
      "Length, template or style: " + (b.shape || "your call") + "\n" +
      "Requested by " + (b.requested_by || r.added_by || "the team") + (b.requested_on ? " on " + fmtDate(b.requested_on) : "") + ".\n\n" +
      "Build it from source in the tracker repo and name the file with today's date code (YYYYMMDD_Title). " +
      "File the draft with: python3 scripts/library_file.py <file> --slug " + r.slug + "\n" +
      "It uploads the file to CPLLibrary/Drafts in the team Drive and writes a receipt that moves this record to Draft with its link. " +
      "Apply the receipt, then send me the file.\n" +
      "A good result: the draft opens from the Library, under In development, at step 2, Draft.";
  }

  function startForm() {
    var f = state.start || {};
    return '<form class="lib-form" id="lib-startform"><h2 class="lib-h">Start a piece</h2>' +
      "<p>Say what the piece is for and what it must say. The Library keeps the brief as a Requested record. " +
      "Claude starts the draft from it, in a new session you paste the brief into or in the next scheduled run, and files each draft in the " +
      '<a href="' + DRAFTS_FOLDER + '" target="_blank" rel="noopener">Drafts folder</a>.</p>' +
      '<div class="lib-grid">' +
      '<div class="lib-field"><label for="ls-kind">Kind</label><select id="ls-kind">' + opt("deck", "Deck", f.kind) + opt("spreadsheet", "Spreadsheet", f.kind) +
      opt("film", "Film", f.kind) + opt("document", "Document", f.kind) + "</select></div>" +
      '<div class="lib-field wide"><label for="ls-title">Working title</label><input id="ls-title" type="text" required placeholder="What colleges can expect from the 2026-27 funding"></div>' +
      '<div class="lib-field"><label for="ls-occasion">Occasion</label><input id="ls-occasion" type="text" placeholder="Vision 2030 Noncredit Summit"></div>' +
      '<div class="lib-field"><label for="ls-due">Needed by</label><input id="ls-due" type="text" placeholder="The week of the summit"></div>' +
      '<div class="lib-field"><label for="ls-seen">For</label><select id="ls-seen">' + opt("team", "Team", f.seen_by) + opt("colleges", "Colleges", f.seen_by) + opt("public", "Public", f.seen_by) + "</select></div>" +
      '<div class="lib-field wide"><label for="ls-say">What it must say</label><input id="ls-say" type="text" required placeholder="Three points, in the order the audience needs them"></div>' +
      '<div class="lib-field wide"><label for="ls-sources">Data and sources</label><input id="ls-sources" type="text" placeholder="live_metrics.json, the funding model, last year\'s deck"></div>' +
      '<div class="lib-field wide"><label for="ls-shape">Length, template or style</label><input id="ls-shape" type="text" placeholder="Five slides on the CO template; or 100 seconds with music and Sierra\'s voice"></div>' +
      '<div class="lib-field"><label for="ls-by">Your name</label><input id="ls-by" type="text" required value="' + esc(storedAuthor()) + '"></div>' +
      "</div>" +
      '<div class="lib-actions-row"><button type="submit" class="lib-btn primary"' + (state.busy ? " disabled" : "") + ">Save the brief</button>" +
      '<button type="button" class="lib-btn" data-startcancel="1">Cancel</button></div></form>';
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
    if (r.url) acts += '<a class="lib-btn" href="' + esc(r.url) + '" target="_blank" rel="noopener">Open the draft</a>';
    acts += '<button type="button" class="lib-btn" data-edit="' + esc(r.id) + '">Edit record</button>';
    return '<article class="lib-devitem" aria-labelledby="lib-t-' + esc(r.id) + '"><div>' +
      '<p class="lib-kicker">' + esc(kicker.join(" · ")) + "</p>" +
      '<h3 class="lib-title" id="lib-t-' + esc(r.id) + '">' + esc(r.title) + "</h3>" +
      (b.say ? "<p>" + esc(b.say) + "</p>" : "") +
      (r.occasion ? '<p class="lib-line">' + esc(r.occasion) + "</p>" : "") +
      '<ol class="lib-steps" aria-label="Where this piece stands">' + steps + "</ol>" +
      (shown ? '<label class="lib-vh" for="lib-b-' + esc(r.id) + '">The brief to paste into a new session</label><textarea class="lib-brief" id="lib-b-' + esc(r.id) + '" readonly>' + esc(briefText(r)) + "</textarea>" : "") +
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
    var head = '<h2 class="lib-h lib-top">Library</h2><p class="lib-lede">Every deck, film and document the CPL Initiative has made: what it is, where the file lives, who may see it, and how to rebuild it.</p>';

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
    var controls = '<section aria-label="Find in the Library"><div class="lib-controls">' +
      '<div class="lib-field grow"><label for="lib-q">Search</label><input id="lib-q" type="search" autocomplete="off" placeholder="Title, occasion or file name" value="' + esc(state.q) + '"></div>' +
      '<div class="lib-field"><span class="lib-seglabel" id="lib-kind-l">Kind</span><div class="lib-seg" role="group" aria-labelledby="lib-kind-l">' +
      segBtn("all", "All") + segBtn("deck", "Decks") + segBtn("spreadsheet", "Spreadsheets") + segBtn("film", "Films") + segBtn("document", "Documents") + "</div></div>" +
      '<div class="lib-field"><label for="lib-seen">Seen by</label><select id="lib-seen">' + opt("all", "Anyone", state.seen) + opt("team", "Team", state.seen) +
      opt("colleges", "Colleges", state.seen) + opt("public", "Public", state.seen) + opt("unset", "Not set", state.seen) + "</select></div>" +
      '<div class="lib-field"><label for="lib-status">Status</label><select id="lib-status">' + opt("all", "Any", state.status) + opt("draft", "Draft", state.status) +
      opt("approved", "Approved", state.status) + opt("presented", "Presented", state.status) + opt("unset", "Not set", state.status) + "</select></div>" +
      '<button type="button" class="lib-btn primary" id="lib-start" aria-expanded="' + (state.start ? "true" : "false") + '">Start a piece</button>' +
      '<button type="button" class="lib-btn" id="lib-add" aria-expanded="' + (state.form ? "true" : "false") + '">Add to the Library</button>' +
      "</div>" + (state.start ? startForm() : "") + (state.form ? addForm() : "") +
      (state.message ? '<p class="lib-msg' + (state.msgErr ? " err" : "") + '" role="status">' + esc(state.message) + "</p>" : "");

    controls += '<p class="lib-line" role="status" id="lib-count">' + countLine(state.rows) + "</p></section>";
    var list = devHtml(state.rows) + '<div id="lib-register">' + listHtml(state.rows) + "</div>";


    var how = '<footer class="lib-how" aria-labelledby="lib-how-h"><h2 class="lib-h" id="lib-how-h">How the Library works</h2>' +
      "<p>The Library keeps one record per piece, and the file lives in the team Drive: approved pieces in the " +
      '<a href="' + DRIVE_FOLDER + '" target="_blank" rel="noopener">CPLLibrary folder</a>, drafts in its ' +
      '<a href="' + DRAFTS_FOLDER + '" target="_blank" rel="noopener">Drafts folder</a>. The repos keep only the source that rebuilds each piece.</p>' +
      "<p>Start a piece saves a brief as a Requested record. Claude drafts it, in a new session you paste the brief into or in the next scheduled run, files each draft in the Drafts folder, and moves the record along: Requested, Draft, Approved, Presented. Each new version is its own file, and the earlier ones stay.</p>" +
      "<p>Claude files each new piece the day it makes it. Anyone on the team files one by pasting a link. A film a public page plays stays where that page serves it.</p>" +
      "<p>Who can open a file is read from where it lives, so a file in the public repo that Sam has not cleared for an audience shows under Needs attention.</p></footer>";

    // A full repaint (a filter click, Retire's question) must not wipe what was
    // typed into an open form. Restore only into the SAME form: the edit ids are
    // shared by every record, so a value typed for one must not land in another.
    var typed = {};
    Array.prototype.forEach.call(root.querySelectorAll("input[id^='la-'],select[id^='la-'],input[id^='le-'],select[id^='le-'],input[id^='ls-'],select[id^='ls-']"), function (n) { typed[n.id] = n.value; });
    var sameAdd = painted.formFor === state.formFor && painted.form === !!state.form;
    var sameEdit = painted.edit === state.edit;
    var focusId = document.activeElement && document.activeElement.id;
    root.innerHTML = head + attention + controls + list + how;
    Object.keys(typed).forEach(function (id) {
      if ((id.indexOf("la-") === 0 && !sameAdd) || (id.indexOf("le-") === 0 && !sameEdit) || (id.indexOf("ls-") === 0 && !state.start)) return;
      var n = document.getElementById(id); if (n) n.value = typed[id];
    });
    painted = { form: !!state.form, formFor: state.formFor, edit: state.edit };
    if (focusId) { var again = document.getElementById(focusId); if (again && again.focus) again.focus(); }
  }

  // ── events (delegated on the root, wired once) ──────────────────────────────
  function readAddForm() {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; };
    return { url: g("la-url"), title: g("la-title"), kind: g("la-kind"), occasion: g("la-occasion"),
      seen_by: g("la-seen"), status: g("la-status"), by: g("la-by") };
  }

  function submitAdd() {
    var f = readAddForm();
    if (!/^https:\/\//.test(f.url)) { say("The link must start with https://.", true); render(); return; }
    if (!f.by) { say("Add your name, so the record says who filed it.", true); render(); return; }
    rememberAuthor(f.by);
    var filing = state.formFor;
    var p;
    if (filing) {
      p = write(TABLE_URL + "?id=eq." + encodeURIComponent(filing), { method: "PATCH",
        body: { url: f.url, home: homeForUrl(f.url), updated_by: f.by } });
    } else {
      if (!f.title) { say("Add a title.", true); render(); return; }
      p = write(TABLE_URL, { method: "POST", body: {
        slug: slugFor(f.title), title: f.title, kind: f.kind || "deck", occasion: f.occasion || null,
        made_on: today(), seen_by: f.seen_by || null, status: f.status || null,
        url: f.url, home: homeForUrl(f.url), added_by: f.by
      } });
    }
    p.then(function () {
      say(filing ? "Filed. The record now links to the file." : "Added to the Library.");
      state.form = null; state.formFor = null;
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
    rememberAuthor(f.by);
    var brief = { say: f.say, requested_by: f.by, requested_on: today() };
    if (f.sources) brief.sources = f.sources;
    if (f.shape) brief.shape = f.shape;
    if (f.due) brief.due = f.due;
    write(TABLE_URL, { method: "POST", body: {
      slug: slugFor(f.title), title: f.title, kind: f.kind || "deck", occasion: f.occasion || null,
      status: "requested", seen_by: f.seen_by || "team", home: "not_filed", url: null, added_by: f.by, brief: brief
    } }).then(function (saved) {
      var row = Array.isArray(saved) ? saved[0] : saved;
      if (row && row.id) state.briefShown[row.id] = true;
      say("Saved as Requested. Copy the brief into a new session, or the next scheduled run picks it up.");
      state.start = null;
      return load();
    }).catch(function (e) { state.busy = false; say(e.message, true); render(); });
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
    rememberAuthor(by);
    var body = { status: g("le-status") || null, seen_by: g("le-seen") || null, refresh_note: g("le-refresh") || null,
      url: url || null, home: url ? homeForUrl(url) : "not_filed", updated_by: by };
    write(TABLE_URL + "?id=eq." + encodeURIComponent(id), { method: "PATCH", body: body }).then(function () {
      say("Saved. The earlier version is in the history.");
      state.edit = null; state.retireAsk = null;
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

  var painted = { form: false, formFor: null, edit: null };
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
    });
    root.addEventListener("submit", function (e) {
      e.preventDefault();
      if (e.target.id === "lib-addform") submitAdd();
      else if (e.target.id === "lib-startform") submitStart();
      else if (e.target.getAttribute("data-editform")) submitEdit(e.target.getAttribute("data-editform"));
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !root.contains(b)) return;
      var v;
      if ((v = b.getAttribute("data-kind"))) { state.kind = v; render(); }
      else if ((v = b.getAttribute("data-flag"))) { state.flag = state.flag === v ? null : v; render(); }
      else if (b.id === "lib-start") {
        state.start = state.start ? null : {}; state.form = null; state.formFor = null;
        say(""); render();
        var st = document.getElementById("ls-title"); if (st) st.focus();
      }
      else if (b.getAttribute("data-startcancel")) { state.start = null; render(); var sb = document.getElementById("lib-start"); if (sb) sb.focus(); }
      else if ((v = b.getAttribute("data-brief"))) copyBrief(v);
      else if (b.id === "lib-add") {
        state.start = null;
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
      else if (b.getAttribute("data-editcancel")) { state.edit = null; state.retireAsk = null; render(); }
      else if ((v = b.getAttribute("data-retire"))) { state.retireAsk = v; render(); }
      else if (b.getAttribute("data-retireno")) { state.retireAsk = null; render(); }
      else if ((v = b.getAttribute("data-retireyes"))) retire(v);
    });
    window.addEventListener("cpl-tab-activated", function (e) {
      if (e && e.detail && e.detail.tab === "library") load();
    });
  }

  function activate() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    wire(root);
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
    _slugFor: slugFor
  };
})();
