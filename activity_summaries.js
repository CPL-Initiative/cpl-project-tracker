/*
 * COBI — Refresh summaries: each Activity's summary, drafted from its
 * sub-activities and posted only when a reviewer approves it
 * (window.CPL_ACTIVITY_SUMMARIES)
 *
 * Sam, 2026-10-12: generate the four activity-level updates from a Refresh
 * control; the generated summaries are drafts he approves before they post
 * (cpl_memory sam-annual-goals-rulings-2026-10-12). Measured 2026-10-13: two
 * activity-level updates ever (Activities 1 and 3, June) against 39 at the
 * sub-activity level, so the four summaries on the Activities tab had gone stale.
 *
 * On the Activities tab:
 *   - every activity header gets a line saying how current its summary is
 *     ("Summary posted Jun 29, 2026 · 7 sub-activity updates since");
 *   - a signed-in reviewer (magic-link session; the team phrase neither drafts
 *     nor posts) gets "Refresh summaries" above the first Activity. It drafts
 *     each Activity's summary through the report proxy from that Activity's
 *     sub-activities (their newest item_updates, the creation-era latest
 *     update, status, percent complete, this fiscal year's goal and current), opens each
 *     draft in an editable field with its sources named, and posts one only on
 *     that draft's own Post, as item_updates `activity:N`. Skip drops a draft;
 *     Redraft asks again. Nothing posts by itself.
 *
 * The posted row: author = the reviewer's email (as the RACI composer writes
 * it); raw = JSON naming the drafter, the approver, the model, whether the
 * reviewer edited the draft, and the item_updates and projects rows it drew on.
 * card_updates.js then paints it on the header (the `cpl-item-updated` event).
 *
 * Writes: item_updates INSERT only (RLS: is_allowed_reviewer() OR
 * team_pass_ok(); this UI narrows to a reviewer). Governance DR-20
 * (table:item_updates). Reads are anon. STATIC asset, loaded in BOTH HTMLs
 * (Rule 4); injects its own CSS.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  // The report generator's model (report_generator.js): an unversioned alias
  // the shared proxy already serves.
  var CLAUDE_MODEL = "claude-sonnet-4-5";
  // Same words as report_generator.js NAMING_RULE (Sam, 2026-07-03).
  var NAMING_RULE = 'The program is the "CPL Initiative" of the California Community Colleges '
    + 'Chancellor\'s Office; never call it the "MAP Initiative". MAP is the platform, expanded as the '
    + '"Mapping Articulated Pathways (MAP) platform"; never expand MAP as "Military Articulation Platform".';
  var UPDATES_PER_SUB = 3;     // newest updates sent per sub-activity
  var BODY_CAP = 600;          // characters of each update sent

  // ── Pure helpers (exported for tests) ──────────────────────────────────────
  function activityOf(p) {
    var m = /^Activity\s+(\d+)/.exec((p && p.workplan_activity) || "");
    if (m) return m[1];
    return String((p && p.id) || "").split(".")[0];
  }

  function time(iso) { var t = new Date(iso).getTime(); return isNaN(t) ? 0 : t; }

  // The fiscal year the workplan is in (July 1 to June 30), as the ladder's column
  // suffix: 2026-10 -> "2026_27". Clamped to the ladder's 2025-26 .. 2029-30.
  var LADDER_YEARS = ["2025_26", "2026_27", "2027_28", "2028_29", "2029_30"];
  function fiscalYearSuffix(now) {
    var d = now || new Date();
    var start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    start = Math.max(2025, Math.min(2029, start));
    return String(start) + "_" + String(start + 1).slice(2);
  }
  function fiscalYearLabel(suffix) { return suffix.slice(0, 4) + "-" + suffix.slice(5); }

  // The goal and current the draft names for one sub-activity: this fiscal year's
  // goal, and its Current for the year, else the latest year a Current was set
  // (cur_<year> on the GOAL row, S426; `current` is the one-column store before it).
  function goalFacts(goal, suffix) {
    if (!goal) return null;
    var target = goal["yr_" + suffix];
    var current = goal["cur_" + suffix];
    if (current == null || current === "") {
      for (var i = LADDER_YEARS.indexOf(suffix); i >= 0 && (current == null || current === ""); i--) {
        current = goal["cur_" + LADDER_YEARS[i]];
      }
    }
    if (current == null || current === "") current = goal.current;
    var hasTarget = target != null && target !== "" && Number(target) !== 0;
    var hasCurrent = current != null && current !== "" && Number(current) !== 0;
    if (!hasTarget && !hasCurrent) return null;
    return { year: fiscalYearLabel(suffix), goal: Number(target) || 0, current: Number(current) || 0 };
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try { return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }

  // Everything one Activity's draft and freshness line need, from the live rows.
  // tabled: a set of project ids off the page (project_lifecycle tabled/archived).
  function gather(act, data) {
    var tabled = {};
    (data.lifecycle || []).forEach(function (l) {
      if (l && l.state && l.state !== "active") tabled[l.project_id] = true;
    });
    var subs = (data.projects || []).filter(function (p) {
      return p && p.id && p.id.indexOf(".") > 0 && !tabled[p.id] && activityOf(p) === String(act);
    }).sort(function (a, b) {
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    var ids = {};
    subs.forEach(function (p) { ids[p.id] = true; });
    var goals = {};
    (data.goals || []).forEach(function (g) {
      if (g && g.kind === "project" && g.row_type === "GOAL") goals[g.activity_id] = g;
    });
    var actName = "";
    (data.goals || []).forEach(function (g) {
      if (g && g.kind === "activity" && String(g.activity_id) === String(act) && !actName) actName = g.name || "";
    });
    var summary = null, subUpdates = [];
    (data.updates || []).forEach(function (u) {
      if (!u) return;
      if (u.item_type === "activity" && String(u.item_id) === String(act)) {
        if (!summary || time(u.created_at) > time(summary.created_at)) summary = u;
      } else if (u.item_type === "project" && ids[u.item_id]) {
        subUpdates.push(u);
      }
    });
    subUpdates.sort(function (a, b) { return time(b.created_at) - time(a.created_at); });
    var since = summary
      ? subUpdates.filter(function (u) { return time(u.created_at) > time(summary.created_at); }).length
      : subUpdates.length;
    return { act: String(act), name: actName, subs: subs, goals: goals, summary: summary,
             subUpdates: subUpdates, since: since };
  }

  function freshnessText(g) {
    var n = g.since, word = n === 1 ? " sub-activity update" : " sub-activity updates";
    if (!g.summary) return "No summary posted yet · " + n + word + " to draw on";
    return "Summary posted " + fmtDate(g.summary.created_at) + " · " + n + word + " since";
  }

  function clip(s, n) {
    s = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  // The prompt for one Activity, and the rows it drew on (for raw).
  function buildPrompt(g, fySuffix) {
    var suffix = fySuffix || fiscalYearSuffix();
    var used = { item_updates: [], projects: [] };
    var lines = [];
    g.subs.forEach(function (p) {
      used.projects.push(p.id);
      var facts = [];
      if (p.status) facts.push("status " + p.status);
      if (p.percent_complete != null && p.percent_complete !== "") facts.push(p.percent_complete + "% complete");
      var gf = goalFacts(g.goals[p.id], suffix);
      if (gf) {
        facts.push(gf.year + " goal " + gf.goal + ", current " + gf.current
          + (p.kpi_unit ? " (" + p.kpi_unit + ")" : ""));
      }
      lines.push("- " + p.id + " " + (p.name || "") + (facts.length ? ": " + facts.join("; ") : ""));
      var mine = g.subUpdates.filter(function (u) { return u.item_id === p.id; }).slice(0, UPDATES_PER_SUB);
      mine.forEach(function (u) {
        used.item_updates.push(u.id);
        lines.push("    " + fmtDate(u.created_at) + (u.author ? " (" + u.author + ")" : "") + ": " + clip(u.body, BODY_CAP));
      });
      if (!mine.length && p.latest_update) {
        lines.push("    " + (p.update_date ? fmtDate(p.update_date) + ": " : "") + clip(p.latest_update, BODY_CAP));
      }
    });
    var prev = g.summary
      ? "The summary posted " + fmtDate(g.summary.created_at) + ":\n" + clip(g.summary.body, 1200)
      : "No summary has been posted for this Activity.";
    var prompt =
      "You are drafting the status summary for one Activity of the California Community Colleges "
      + "Credit for Prior Learning (CPL) Initiative workplan. A reviewer on the CPL team reads your draft, "
      + "edits it, and decides whether to post it.\n\n"
      + "Activity " + g.act + (g.name ? ": " + g.name : "") + "\n\n"
      + prev + "\n\n"
      + "Its sub-activities, each with its newest updates:\n"
      + (lines.length ? lines.join("\n") : "(none listed)") + "\n\n"
      + "Write one paragraph of 90 to 160 words on where this Activity stands: what moved most recently, "
      + "what comes next, and what has stalled. Name the sub-activities you draw on by number. Use only the "
      + "facts above, and invent no figure, date or name. Write in plain language and active voice, and name "
      + "who acts. State each point positively. No heading, title, bullets, bold or emoji, and do not open "
      + "with the Activity's name. Never use the words leverage, utilize, robust, deep dive, synergy, "
      + "operationalize or impactful. " + NAMING_RULE + "\nReturn only the paragraph.";
    return { prompt: prompt, used: used };
  }

  function postPayload(act, text, draft, used, email, draftedAt) {
    return {
      item_type: "activity",
      item_id: String(act),
      body: text,
      author: email || null,
      raw: JSON.stringify({
        generated_by: "activity_summaries.js",
        drafted_by: "Claude, through the report proxy",
        model: CLAUDE_MODEL,
        approved_by: email || null,
        drafted_at: draftedAt || null,
        edited: text !== draft,
        draft: text !== draft ? draft : undefined,
        sources: used
      })
    };
  }

  // ── Session, reads, the proxy, the write ───────────────────────────────────
  function isValidJwt(t) {
    return typeof t === "string" && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
  }
  // A signed-in reviewer only: the team phrase's pseudo-session has no token.
  function reviewerSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem("cpl_sb") || "null");
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) {}
    return null;
  }

  function sbGet(path) {
    return fetch(SUPABASE_URL + "/rest/v1/" + path, {
      headers: { "apikey": SUPABASE_ANON, "Authorization": "Bearer " + SUPABASE_ANON }
    }).then(function (r) { return r.ok ? r.json() : []; }).then(null, function () { return []; });
  }

  function loadData() {
    return Promise.all([
      sbGet("item_updates?select=id,item_type,item_id,body,author,created_at&order=created_at.desc&limit=2000"),
      sbGet("projects?select=id,name,workplan_activity,status,percent_complete,latest_update,update_date,kpi_unit"),
      sbGet("workplan_goals?select=activity_id,kind,row_type,name,current,"
        + "yr_2025_26,yr_2026_27,yr_2027_28,yr_2028_29,yr_2029_30,"
        + "cur_2025_26,cur_2026_27,cur_2027_28,cur_2028_29,cur_2029_30"),
      sbGet("project_lifecycle?select=project_id,state")
    ]).then(function (r) {
      return { updates: r[0] || [], projects: r[1] || [], goals: r[2] || [], lifecycle: r[3] || [] };
    });
  }

  function callProxy(prompt) {
    var url = (typeof window !== "undefined" && window.CPL_REPORT_PROXY_URL) || "";
    if (!url) return Promise.reject(new Error("The report proxy is not configured on this page."));
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 700,
                             messages: [{ role: "user", content: prompt }] })
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error("The proxy answered " + r.status + ": " + String(t).slice(0, 160)); });
      return r.json();
    }).then(function (j) {
      var t = j && j.content && j.content[0] && j.content[0].text;
      if (!t) throw new Error("The proxy returned no text.");
      return String(t).trim();
    });
  }

  function postSummary(sess, payload) {
    return fetch(SUPABASE_URL + "/rest/v1/item_updates", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + sess.access_token,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.text().then(function (t) {
        var rows = null;
        try { rows = JSON.parse(t); } catch (e) {}
        if (!r.ok || !Array.isArray(rows) || !rows.length) {
          throw new Error("Not posted (" + r.status + "). Sign in again as a reviewer and retry.");
        }
        return rows[0];
      });
    });
  }

  // ── DOM ────────────────────────────────────────────────────────────────────
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") n.className = attrs[k]; else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function pane() { return document.getElementById("tab-activities-projects"); }

  function headers() {
    var p = pane();
    if (!p) return [];
    var out = [];
    Array.prototype.forEach.call(p.querySelectorAll(".activity-group-header"), function (h) {
      var a = h.querySelector('.act-raci-link[data-raci-key^="activity:"]');
      if (a) out.push({ hdr: h, act: a.getAttribute("data-raci-key").split(":")[1],
                        title: ((h.querySelector("h3") || {}).textContent || "").trim() });
    });
    return out;
  }

  function ensureCss() {
    if (document.getElementById("as-css")) return;
    var css =
      ".as-fresh { font-size:0.74rem; color:var(--text-muted); margin:-0.6rem 0 0.6rem 0; }"
      + ".as-bar { display:flex; flex-wrap:wrap; align-items:center; gap:0.6rem 1rem; margin:0 0 1rem 0; }"
      + ".as-btn { border:0; background:none; color:var(--cobalt); font:inherit; font-size:0.85rem; font-weight:600;"
      + " padding:2px 0; min-height:24px; cursor:pointer; text-decoration:underline; text-decoration-thickness:1px;"
      + " text-underline-offset:3px; border-radius:2px; }"
      + ".as-btn:focus-visible, .as-text:focus-visible { outline:2px solid var(--focus-ring); outline-offset:2px; }"
      + ".as-btn[disabled] { color:var(--text-muted); cursor:default; text-decoration:none; }"
      + ".as-status { font-size:0.8rem; color:var(--text-muted); }"
      + ".as-panel { margin:0 0 1.5rem 0; padding:0.8rem 0; border-top:1px solid var(--border);"
      + " border-bottom:1px solid var(--border); }"
      + ".as-panel h3 { font-size:1rem; margin:0 0 0.3rem 0; color:var(--text-strong); }"
      + ".as-panel > p { font-size:0.85rem; color:var(--text-body); margin:0 0 0.8rem 0; }"
      + ".as-card { padding:0.6rem 0; border-top:1px solid var(--border); }"
      + ".as-card h4 { font-size:0.92rem; margin:0 0 0.2rem 0; color:var(--text-strong); }"
      + ".as-sources { font-size:0.78rem; color:var(--text-muted); margin:0 0 0.4rem 0; }"
      + ".as-label { display:block; font-size:0.8rem; color:var(--text-body); margin:0 0 0.2rem 0; }"
      + ".as-text { box-sizing:border-box; width:100%; min-height:7.5em; font:inherit; font-size:0.88rem;"
      + " line-height:1.45; color:var(--text-body); background:var(--surface); border:1px solid var(--border);"
      + " border-radius:4px; padding:0.45rem 0.55rem; }"
      + ".as-actions { display:flex; flex-wrap:wrap; gap:0.4rem 1.2rem; align-items:center; margin-top:0.35rem; }"
      + ".as-card[data-state=posted] .as-text, .as-card[data-state=skipped] .as-text { background:var(--surface-muted); }";
    var s = el("style", { "id": "as-css" }, [css]);
    document.head.appendChild(s);
  }

  var state = { data: null, loading: null, panel: null };

  function load(force) {
    if (state.loading && !force) return state.loading;
    state.loading = loadData().then(function (d) { state.data = d; return d; });
    return state.loading;
  }

  function paintFreshness() {
    if (!state.data) return;
    headers().forEach(function (h) {
      var g = gather(h.act, state.data);
      var line = h.hdr.nextElementSibling;
      if (!line || !line.classList || !line.classList.contains("as-fresh")) {
        line = el("p", { "class": "as-fresh", "data-act": h.act }, []);
        h.hdr.parentNode.insertBefore(line, h.hdr.nextSibling);
      }
      line.textContent = freshnessText(g);
    });
  }

  function paintBar() {
    var p = pane();
    if (!p) return;
    var bar = p.querySelector(".as-bar");
    var sess = reviewerSession();
    if (!sess) {
      if (bar) bar.remove();
      if (state.panel) { state.panel.remove(); state.panel = null; }
      return;
    }
    if (bar) return;
    var first = p.querySelector(".activity-group");
    if (!first) return;
    var btn = el("button", { "class": "as-btn as-refresh", "type": "button" }, ["Refresh summaries"]);
    var status = el("span", { "class": "as-status", "role": "status", "aria-live": "polite" }, []);
    bar = el("div", { "class": "as-bar" }, [btn, status]);
    first.parentNode.insertBefore(bar, first);
    btn.addEventListener("click", function () { refresh(btn, status); });
  }

  function refresh(btn, status) {
    var sess = reviewerSession();
    if (!sess) return;
    btn.disabled = true;
    status.textContent = "Reading the sub-activity updates…";
    load(true).then(function () {
      paintFreshness();
      var hs = headers();
      if (state.panel) state.panel.remove();
      var panel = el("section", { "class": "as-panel", "aria-labelledby": "as-panel-title" }, [
        el("h3", { "id": "as-panel-title" }, ["Draft summaries"]),
        el("p", {}, ["Each draft posts only when you choose its Post. Edit it first where it needs it."])
      ]);
      btn.parentNode.parentNode.insertBefore(panel, btn.parentNode.nextSibling);
      state.panel = panel;
      status.textContent = "Drafting " + hs.length + " summaries…";
      return Promise.all(hs.map(function (h) { return draftCard(panel, h); }));
    }).then(function () {
      status.textContent = "Drafts ready. Nothing has posted.";
    }, function (e) {
      status.textContent = "Could not read the updates: " + (e && e.message || e);
    }).then(function () { btn.disabled = false; });
  }

  function draftCard(panel, h) {
    var g = gather(h.act, state.data);
    var built = buildPrompt(g);
    var id = "as-text-" + h.act;
    var title = h.title || ("Activity " + h.act + (g.name ? ": " + g.name : ""));
    var nUpd = built.used.item_updates.length;
    var sources = el("p", { "class": "as-sources" }, [
      "Drawn from " + nUpd + (nUpd === 1 ? " update" : " updates") + " on " + g.subs.length
      + (g.subs.length === 1 ? " sub-activity" : " sub-activities")
      + (g.summary ? ", and the summary posted " + fmtDate(g.summary.created_at) : "") + "."
    ]);
    var text = el("textarea", { "class": "as-text", "id": id, "rows": "6" }, []);
    var post = el("button", { "class": "as-btn as-post", "type": "button", "disabled": "disabled" }, ["Post"]);
    var redraft = el("button", { "class": "as-btn as-redraft", "type": "button", "disabled": "disabled" }, ["Redraft"]);
    var skip = el("button", { "class": "as-btn as-skip", "type": "button" }, ["Skip"]);
    var st = el("span", { "class": "as-status", "role": "status", "aria-live": "polite" }, ["Drafting…"]);
    var card = el("article", { "class": "as-card", "data-act": h.act, "data-state": "drafting" }, [
      el("h4", {}, [title]), sources,
      el("label", { "class": "as-label", "for": id }, ["Summary for Activity " + h.act]), text,
      el("div", { "class": "as-actions" }, [post, redraft, skip, st])
    ]);
    panel.appendChild(card);
    var draft = "", draftedAt = null;

    function run() {
      card.setAttribute("data-state", "drafting");
      post.disabled = true; redraft.disabled = true; text.readOnly = true;
      st.textContent = "Drafting…";
      return callProxy(built.prompt).then(function (t) {
        draft = t; draftedAt = new Date().toISOString();
        text.value = t; text.readOnly = false;
        card.setAttribute("data-state", "ready");
        post.disabled = false; redraft.disabled = false;
        st.textContent = "Draft ready. Not posted.";
      }, function (e) {
        // The field stays open, so a reviewer can write the summary and post it.
        card.setAttribute("data-state", "failed");
        post.disabled = false; redraft.disabled = false; text.readOnly = false;
        st.textContent = "No draft: " + (e && e.message || e) + " Write one here, or Redraft.";
      });
    }

    post.addEventListener("click", function () {
      var sess = reviewerSession();
      var body = text.value.trim();
      if (!sess) { st.textContent = "Sign in as a reviewer to post."; return; }
      if (!body) { st.textContent = "The summary is empty."; return; }
      post.disabled = true; redraft.disabled = true; skip.disabled = true;
      st.textContent = "Posting…";
      postSummary(sess, postPayload(h.act, body, draft, built.used, sess.email, draftedAt)).then(function () {
        card.setAttribute("data-state", "posted");
        text.readOnly = true;
        st.textContent = "Posted.";
        // card_updates.js repaints the header; the listener below reloads the freshness lines.
        try { window.dispatchEvent(new CustomEvent("cpl-item-updated", { detail: { key: "activity:" + h.act } })); } catch (e) {}
      }, function (e) {
        post.disabled = false; redraft.disabled = false; skip.disabled = false;
        st.textContent = e && e.message || String(e);
      });
    });
    redraft.addEventListener("click", run);
    skip.addEventListener("click", function () {
      card.setAttribute("data-state", "skipped");
      post.disabled = true; redraft.disabled = true; skip.disabled = true; text.readOnly = true;
      st.textContent = "Skipped. Nothing posted.";
    });
    return run();
  }

  function paint() {
    if (!pane()) return;
    ensureCss();
    paintBar();
    load(false).then(paintFreshness);
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
    else paint();
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("cpl-tab-activated", function (e) {
        var tab = e && e.detail && e.detail.tab;
        if (tab === "activities-projects" || tab == null) paint();
      });
      ["cpl-session-changed", "cpl-auth-change", "storage"].forEach(function (ev) {
        window.addEventListener(ev, paintBar);
      });
      window.addEventListener("cpl-item-updated", function () { load(true).then(paintFreshness); });
    }
  }

  var api = {
    activityOf: activityOf, gather: gather, freshnessText: freshnessText, buildPrompt: buildPrompt,
    goalFacts: goalFacts, fiscalYearSuffix: fiscalYearSuffix,
    postPayload: postPayload, reviewerSession: reviewerSession, paint: paint,
    CLAUDE_MODEL: CLAUDE_MODEL, _state: state
  };
  if (typeof window !== "undefined") window.CPL_ACTIVITY_SUMMARIES = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
