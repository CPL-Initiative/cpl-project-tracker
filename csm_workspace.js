/* csm_workspace.js — the CSM Workspace tab (window.CPL_CSM_WORKSPACE), #csm-workspace.
 *
 * THIS PAGE HAS A GUIDE, AND THE GUIDE FOLLOWS THE PAGE (Malone, 2026-11-12). A change to what a reviewer can press or
 * read here fails tests/csm_workspace_guide_stamp.test.js until the Funding Follow-up Dashboard Guide is updated in the
 * same change (https://claude.ai/artifact/XqJpfTdCWPhAkGFLA3gsBq; source and capture.js in
 * CPLBrain/04-projects/cpl-initiative/funding-follow-up-guide/). That test's header has the steps.
 *
 * Sam, 2026-11-02 (S554): "Can you publish a mock for a CSM workspace for handling the comms (notes, follow ups,
 * acceptances, etc.) for the colleges? Thinking of a tab linked from the internal view formatted like CPL Commons
 * with priority cards at top and action center below like a customer management system." The mock (version 11,
 * https://claude.ai/artifact/LLjcCzVzq7sqtPEjnebMYf; source and his 18 asks in
 * CPLBrain/04-projects/cpl-initiative/csm-workspace-mock/) is the design record. S555 (2026-11-02): "we need to get
 * the new CSM funding workspace up before the CPL Commons work".
 *
 * ONE READ, NEVER A SECOND COPY. Every figure, condition and request comes from CPL_FUNDING_TAB.csm.snapshot(), the
 * funding tab's own eligReqList / baselineGate / review-lane state, and every decision goes through its own Accept,
 * Deny, Follow up and Email (CPL_FUNDING_TAB.csm.act), so the workspace and the funding tab cannot disagree and a
 * decision here is the same write and the same email. Names and emails reach the page for a signed-in reviewer on the
 * internal view alone, as the review lane shows them.
 *
 * THE LOG (csm_log, kb/migrations/2026-11-02_csm_log.sql; mapped DR-09 in kb/governance_surface_map.json, Rule 10
 * a3): notes, calls, emails and meetings per college and activity, each with an optional follow-up date the queue
 * counts down to. A decision made here logs itself.
 *
 * THE CONTACTS (S555; in the People panel since 2026-11-10): one people list with its source filter over MAP's
 * directory, the landing page and MAP's users, what they disagree on, and every field on file; Write an email seeds To and Cc by template, takes More Cc from the picker, and copies the
 * formatted email for Outlook. All three sources are reviewer-gated in the database.
 *
 * The look is the CPL Commons' (Malone's CPL/AI palette) as the mock shows it; the dark theme maps every role onto a
 * First Light dark token. The priority cards fold behind one word for the visit (Sam's ask 18);
 * Today stays in the header either way, each count a word that opens its view (Sam, 2026-11-03, S564).
 *
 * THE NAME (Malone, 2026-11-10; built on Sam's go): the page reads Funding Follow-up Dashboard, because the MAP team does
 * most of this work and the CSMs only part of it. The tab's address stays #csm-workspace, and the file, the lane and
 * the identifiers keep the old name, as the Activities tab kept its address when its label changed.
 *
 * Tests: tests/csm_workspace.test.js
 */
(function () {
  var RULES = [
      "#tab-csm-workspace .main-container { max-width:none; padding:8px 16px; }",
      "@media (max-width: 560px) { #tab-csm-workspace .main-container { padding-left:0; padding-right:0; } }",
      "#tab-csm-workspace .page { padding-block:16px 40px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }",
      "#tab-csm-workspace .wrap { max-width:none; margin:0; display:grid; gap:16px; }",
      "#tab-csm-workspace a { color:var(--cw-link); text-underline-offset:3px; }",
      "#tab-csm-workspace .word { all:unset; box-sizing:border-box; cursor:pointer; min-height:24px; display:inline-flex; align-items:center; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; font-weight:600; font-size:.92rem; }",
      "#tab-csm-workspace .word:hover { color:var(--cw-heading); }",
      "#tab-csm-workspace .word.danger { color:var(--cw-warn-fg); }",
      "#tab-csm-workspace .word[aria-pressed=\"true\"] { color:var(--cw-heading); font-weight:700; text-decoration-thickness:3px; }",
      "#tab-csm-workspace .word[disabled] { color:var(--cw-muted); text-decoration:none; cursor:default; }",
      "#tab-csm-workspace .word:focus-visible, #tab-csm-workspace .row:focus-visible, #tab-csm-workspace .chip:focus-visible, #tab-csm-workspace input:focus-visible, #tab-csm-workspace select:focus-visible, #tab-csm-workspace textarea:focus-visible { outline:2px solid var(--cw-accent); outline-offset:2px; border-radius:3px; }",
      "#tab-csm-workspace .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }",
      "#tab-csm-workspace .top-row { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:8px 24px; }",
      "#tab-csm-workspace h1 { margin:0; font-family:var(--cw-serif); font-weight:700; color:var(--cw-title); font-size:clamp(2rem, 1.5rem + 1.8vw, 3rem); line-height:1; letter-spacing:-0.03em; }",
      "#tab-csm-workspace .links { display:flex; flex-wrap:wrap; gap:6px 18px; font-size:.92rem; align-items:baseline; }",
      "#tab-csm-workspace .rule { width:66px; height:4px; background:var(--cw-gold); margin:10px 0 8px; }",
      // The summary metrics (Malone, 2026-11-10, built on Sam's go): each one scannable, the number above its label, the
      // deadline set apart at the right. Each metric is the button that opens its list (a figure opens what it counts).
      "#tab-csm-workspace .today { margin:0; display:flex; flex-wrap:wrap; gap:8px 10px; align-items:stretch; }",
      "#tab-csm-workspace .metric { all:unset; box-sizing:border-box; cursor:pointer; display:grid; gap:2px; align-content:center; min-width:132px; padding:8px 14px; border-left:3px solid var(--cw-line); }",
      "#tab-csm-workspace .metric .num { font-family:var(--cw-serif); font-weight:700; font-size:1.9rem; line-height:1.05; color:var(--cw-title); font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .metric .lab, #tab-csm-workspace .deadline .lab { font-size:.86rem; font-weight:600; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .metric:hover { border-left-color:var(--cw-accent); }",
      "#tab-csm-workspace .metric:hover .lab { color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; }",
      "#tab-csm-workspace .metric[aria-pressed=\"true\"] { border-left-color:var(--cw-gold); background:var(--cw-sel); border-radius:0 6px 6px 0; }",
      "#tab-csm-workspace .metric:focus-visible { outline:2px solid var(--cw-accent); outline-offset:2px; border-radius:3px; }",
      "#tab-csm-workspace .deadline { margin:0 0 0 auto; display:grid; gap:2px; align-content:center; padding:8px 0 8px 18px; border-left:1px solid var(--cw-line); text-align:right; }",
      "#tab-csm-workspace .deadline .date { font-family:var(--cw-serif); font-weight:700; font-size:1.35rem; line-height:1.1; color:var(--cw-heading); }",
      "@media (max-width:640px) { #tab-csm-workspace .metric { min-width:calc(50% - 5px); } #tab-csm-workspace .deadline { margin-left:0; text-align:left; border-left:3px solid var(--cw-gold); padding-left:14px; } }",
      "#tab-csm-workspace .qgroup { margin:10px 0 0; padding:0 18px; font-family:var(--cw-sans); font-size:.8rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--cw-muted); }",
      "#tab-csm-workspace .qgroup-n { font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace h2 { margin:0; font-family:var(--cw-serif); font-size:1.3rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .sec { display:grid; gap:8px; }",
      "#tab-csm-workspace .sec-h { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:6px 20px; }",
      "#tab-csm-workspace .note { margin:0; color:var(--cw-muted); font-size:.9rem; }",
      "#tab-csm-workspace .needs-row { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; }",
      "#tab-csm-workspace .cohort-row { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; }",
      "#tab-csm-workspace .card { background:var(--cw-surface); border:1px solid var(--cw-line); border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; gap:6px; min-width:0; }",
      "#tab-csm-workspace .card.needs { border-top:4px solid var(--cw-gold); padding:12px 18px 14px; }",
      "#tab-csm-workspace .card.on { border-color:var(--cw-accent); box-shadow:0 0 0 1px var(--cw-accent); }",
      "#tab-csm-workspace .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }",
      "#tab-csm-workspace .card-name { margin:0; font-family:var(--cw-serif); font-size:1.15rem; line-height:1.25; color:var(--cw-heading); }",
      "#tab-csm-workspace .needs .card-name { font-size:1.3rem; }",
      "#tab-csm-workspace .big { margin:0; font-family:var(--cw-serif); font-size:2rem; font-weight:700; color:var(--cw-title); letter-spacing:-0.02em; font-variant-numeric:tabular-nums; line-height:1; }",
      "#tab-csm-workspace .needs .big { font-size:2.3rem; }",
      "#tab-csm-workspace .big small { font-family:var(--cw-sans); font-size:.95rem; font-weight:400; color:var(--cw-muted); letter-spacing:0; }",
      "#tab-csm-workspace .card-what { margin:0; color:var(--cw-ink-2); font-size:.92rem; line-height:1.45; }",
      "#tab-csm-workspace .card-list { margin:0; padding:0; list-style:none; display:grid; gap:2px; font-size:.92rem; }",
      "#tab-csm-workspace .card-list li { display:flex; justify-content:space-between; gap:12px; border-top:1px solid var(--cw-line-soft); padding:3px 0; }",
      "#tab-csm-workspace .card-list li span:last-child { color:var(--cw-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }",
      "#tab-csm-workspace .card .word { margin-top:auto; }",
      "#tab-csm-workspace .card .word.gap { margin-top:2px; font-weight:500; }",
      "#tab-csm-workspace .meter { height:8px; border-radius:999px; background:var(--cw-track); overflow:hidden; }",
      "#tab-csm-workspace .meter i { display:block; height:100%; background:var(--cw-accent); border-radius:999px; }",
      "#tab-csm-workspace .pace { width:100%; height:auto; display:block; }",
      "#tab-csm-workspace .pace .axis { stroke:var(--cw-line); stroke-width:1; }",
      "#tab-csm-workspace .pace .done { fill:none; stroke:var(--cw-accent); stroke-width:2.5; }",
      "#tab-csm-workspace .pace .need { fill:none; stroke:var(--cw-guide); stroke-width:1.5; stroke-dasharray:4 4; }",
      "#tab-csm-workspace .pace .now { stroke:var(--cw-muted); stroke-width:1; stroke-dasharray:2 3; }",
      "#tab-csm-workspace .pace text { fill:var(--cw-muted); font-family:var(--cw-sans); font-size:9px; }",
      "#tab-csm-workspace .pace .dot { fill:var(--cw-accent); }",
      "#tab-csm-workspace .pill { display:inline-block; white-space:nowrap; padding:2px 10px; border-radius:999px; background:var(--cw-pill-bg); color:var(--cw-pill-fg); font-size:.76rem; font-weight:700; }",
      "#tab-csm-workspace .pill.ask { background:var(--cw-ask-bg); color:var(--cw-ask-fg); }",
      // The queue and the record, with a divider a reader drags or steps with the arrow keys (Sam, 2026-11-10: "when
      // sidebars get opened users will want to shift things depending on what they're looking at"). The two shares
      // ride custom properties, so the one-column rule below still wins on a narrow screen.
      "#tab-csm-workspace .center { display:grid; grid-template-columns:minmax(0, var(--cw-q, 5fr)) 12px minmax(0, var(--cw-r, 7fr)); gap:4px; align-items:start; }",
      "#tab-csm-workspace .split { align-self:stretch; min-height:120px; cursor:col-resize; touch-action:none; border-radius:6px; background:linear-gradient(to right, transparent 5px, var(--cw-line) 5px, var(--cw-line) 7px, transparent 7px); }",
      "#tab-csm-workspace .split:hover, #tab-csm-workspace .split:focus-visible { background:var(--cw-line); }",
      "#tab-csm-workspace .split:focus-visible { outline:2px solid var(--cw-accent); outline-offset:-2px; }",
      "#tab-csm-workspace .pane { background:var(--cw-surface); border:1px solid var(--cw-line); border-radius:12px; min-width:0; }",
      "#tab-csm-workspace .pane-h { padding:14px 18px 12px; border-bottom:1px solid var(--cw-line-soft); display:grid; gap:8px; }",
      "#tab-csm-workspace .showing { margin:0; font-size:.95rem; display:flex; flex-wrap:wrap; gap:4px 12px; align-items:baseline; }",
      "#tab-csm-workspace .showing b { color:var(--cw-heading); }",
      "#tab-csm-workspace .search { width:100%; box-sizing:border-box; font:inherit; font-size:.92rem; padding:7px 10px; border:1px solid var(--cw-field-line); border-radius:6px; background:var(--cw-surface); color:var(--cw-ink); }",
      "#tab-csm-workspace .bulk { display:flex; flex-wrap:wrap; gap:4px 16px; align-items:center; font-size:.9rem; }",
      "#tab-csm-workspace .queue { list-style:none; margin:0; padding:0; max-height:640px; overflow:auto; }",
      "#tab-csm-workspace .queue li { border-bottom:1px solid var(--cw-line-soft); display:flex; align-items:stretch; }",
      "#tab-csm-workspace .queue li:last-child { border-bottom:0; }",
      "#tab-csm-workspace .pick { display:flex; align-items:center; padding-left:14px; }",
      "#tab-csm-workspace .pick input { width:18px; height:18px; margin:0; accent-color:var(--cw-accent); }",
      "#tab-csm-workspace .row { all:unset; box-sizing:border-box; flex:1 1 auto; min-width:0; cursor:pointer; display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:4px 12px; padding:12px 18px; }",
      "#tab-csm-workspace .row:hover { background:var(--cw-sel); }",
      "#tab-csm-workspace .row[aria-current=\"true\"] { background:var(--cw-sel); box-shadow:inset 4px 0 0 var(--cw-accent); }",
      "#tab-csm-workspace .row-name { font-weight:700; color:var(--cw-heading); }",
      "#tab-csm-workspace .row-age { color:var(--cw-muted); font-size:.82rem; font-variant-numeric:tabular-nums; white-space:nowrap; }",
      "#tab-csm-workspace .row-age.over { color:var(--cw-warn-fg); font-weight:600; }",
      "#tab-csm-workspace .row-next { grid-column:1 / -1; color:var(--cw-ink-2); font-size:.88rem; }",
      "#tab-csm-workspace .row-pills { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:6px; }",
      "#tab-csm-workspace .empty { padding:18px; color:var(--cw-muted); margin:0; }",
      "#tab-csm-workspace .pane-f { padding:10px 18px; border-top:1px solid var(--cw-line-soft); display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px 16px; font-size:.86rem; color:var(--cw-muted); }",
      "#tab-csm-workspace .keys { margin:0; padding:10px 18px 14px; border-top:1px solid var(--cw-line-soft); display:grid; grid-template-columns:max-content minmax(0, 1fr); gap:4px 14px; font-size:.88rem; }",
      "#tab-csm-workspace .keys dt { font-family:ui-monospace,Menlo,Consolas,monospace; color:var(--cw-heading); }",
      "#tab-csm-workspace .keys dd { margin:0; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .rec { padding:18px 20px 20px; display:grid; gap:18px; }",
      "#tab-csm-workspace .back { display:none; }",
      "#tab-csm-workspace .rec-head { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:6px 16px; }",
      "#tab-csm-workspace .rec-name { margin:0; font-family:var(--cw-serif); font-size:1.5rem; color:var(--cw-title); }",
      "#tab-csm-workspace .rec-sub { margin:2px 0 0; color:var(--cw-muted); font-size:.9rem; }",
      "#tab-csm-workspace .decide { display:flex; flex-wrap:wrap; gap:6px 20px; align-items:center; padding:10px 0; border-block:1px solid var(--cw-line-soft); }",
      "#tab-csm-workspace .decide .lead { font-size:1rem; }",
      "#tab-csm-workspace .status { margin:-8px 0 0; color:var(--cw-ink); font-size:.9rem; min-height:1.3em; }",
      "#tab-csm-workspace .k { font-size:.74rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--cw-muted); margin:0 0 6px; }",
      "#tab-csm-workspace .conds { margin:0; padding:0; list-style:none; display:grid; gap:6px; }",
      "#tab-csm-workspace .cond { display:grid; grid-template-columns:5.5rem minmax(0, 1fr); gap:10px; align-items:baseline; font-size:.92rem; }",
      "#tab-csm-workspace .cond .why { color:var(--cw-muted); font-size:.86rem; }",
      // The record as conditions in a table, Recommended action and the email preview (the clarity mock, Malone's change 4).
      "#tab-csm-workspace .facts { width:100%; border-collapse:collapse; table-layout:fixed; }",
      "#tab-csm-workspace .facts th, #tab-csm-workspace .facts td { text-align:left; padding:9px 8px; border-top:1px solid var(--cw-line-soft); vertical-align:top; font-size:.93rem; overflow-wrap:anywhere; }",
      "#tab-csm-workspace .facts thead th { border-top:0; color:var(--cw-muted); font-size:.78rem; font-weight:600; letter-spacing:.03em; text-transform:uppercase; }",
      "#tab-csm-workspace .facts tbody th { font-weight:600; color:var(--cw-heading); }",
      "#tab-csm-workspace .facts .why { display:block; color:var(--cw-muted); font-size:.86rem; font-weight:400; }",
      "#tab-csm-workspace .st { font-weight:700; }",
      "#tab-csm-workspace .st.met { color:var(--cw-met); }",
      "#tab-csm-workspace .st.not { color:var(--cw-ask-fg); background:var(--cw-ask-bg); border-radius:4px; padding:0 6px; }",
      "#tab-csm-workspace .visit { border:1px solid var(--cw-line); border-top:4px solid var(--cw-gold); border-radius:10px; padding:14px 16px; display:grid; gap:8px; background:var(--cw-surface); }",
      "#tab-csm-workspace .visit h4 { margin:0; font-family:var(--cw-serif); font-size:1.05rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .visit .reason { margin:0; font-family:var(--cw-serif); font-size:1.25rem; color:var(--cw-title); }",
      "#tab-csm-workspace .visit .status { margin:0; }",
      "#tab-csm-workspace .mail-h { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
      "#tab-csm-workspace .mail-h .k { margin:0; }",
      "#tab-csm-workspace .mail-f { margin:0; display:grid; grid-template-columns:minmax(64px, auto) minmax(0, 1fr); gap:6px 14px; font-size:.9rem; }",
      "#tab-csm-workspace .mail-f dt { font-weight:700; color:var(--cw-heading); }",
      "#tab-csm-workspace .mail-f dd { margin:0; color:var(--cw-ink); min-width:0; overflow-wrap:anywhere; white-space:pre-wrap; }",
      "#tab-csm-workspace .mail-f dd + dt, #tab-csm-workspace .mail-f dd + dt + dd { border-top:1px solid var(--cw-line-soft); padding-top:6px; }",
      "#tab-csm-workspace .tpl-edit { display:grid; gap:8px; }",
      "#tab-csm-workspace .tpl-edit[hidden], #tab-csm-workspace .mail-f[hidden], #tab-csm-workspace .tpl-row[hidden], #tab-csm-workspace .tpl-meta[hidden] { display:none; }",
      // The side panel (the clarity mock; one people list, issue 2978): People, CPL landing page and History open under the
      // record, one at a time; the review opens there too. Every part stays in the page, so a draft is never lost to a fold.
      "#tab-csm-workspace [hidden] { display:none !important; }",
      "#tab-csm-workspace .word.quiet { font-weight:500; color:var(--cw-muted); }",
      "#tab-csm-workspace .accpane { padding:14px 18px; }",
      "#tab-csm-workspace .drawer { position:fixed; top:0; right:0; bottom:0; width:min(480px, 92vw); z-index:20; background:var(--cw-dialog); border-left:1px solid var(--cw-line); box-shadow:-12px 0 32px color-mix(in srgb, var(--cw-heading) 16%, transparent); padding:calc(18px + env(safe-area-inset-top, 0px)) max(18px, env(safe-area-inset-right, 0px)) 18px 18px; display:grid; gap:12px; align-content:start; overflow-y:auto; }",
      "#tab-csm-workspace .drawer-h { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
      "#tab-csm-workspace .drawer-sub { margin:4px 0 0; font-family:var(--cw-serif); font-size:1rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .prio-lines { margin:0; padding-left:1.2em; display:grid; gap:4px; color:var(--cw-ink-2); font-size:.92rem; }",
      "#tab-csm-workspace #cw-record { display:grid; gap:14px; min-width:0; align-content:start; }",
      "#tab-csm-workspace .side { border-top:4px solid var(--cw-line); padding:16px 20px 18px; display:grid; gap:14px; }",
      "#tab-csm-workspace .side h4.side-h { margin:0; font-family:var(--cw-serif); font-size:1.1rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .sidepart { display:grid; gap:12px; min-width:0; }",
      "#tab-csm-workspace .lpframe { border:1px solid var(--cw-line); border-radius:8px; overflow:hidden; background:var(--cw-surface); }",
      "#tab-csm-workspace .lpframe iframe { display:block; width:100%; height:clamp(360px, 60vh, 640px); border:0; }",
      "#tab-csm-workspace details.lpshow summary { cursor:pointer; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; }",
      "#tab-csm-workspace details.lpshow[open] { display:grid; gap:8px; margin-top:6px; }",
      "#tab-csm-workspace details.reqdone { margin-top:8px; }",
      "#tab-csm-workspace details.reqdone > summary { cursor:pointer; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; font-size:.9rem; }",
      "#tab-csm-workspace .today-more { margin:8px 0 0; }",
      "#tab-csm-workspace .condx { margin:0; padding:0; list-style:none; display:grid; gap:14px; }",
      "#tab-csm-workspace .condx h3 { margin:0 0 4px; font-size:.98rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .condx p { margin:0 0 4px; font-size:.9rem; }",
      "#tab-csm-workspace .condx .k { color:var(--cw-muted); }",
      "#tab-csm-workspace .ncline { margin:8px 0 0; font-size:.9rem; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .tpl { display:grid; gap:8px; background:var(--cw-page); border:1px solid var(--cw-line); border-radius:8px; padding:12px 14px; }",
      "#tab-csm-workspace .tpl-row { display:flex; flex-wrap:wrap; gap:6px 16px; align-items:center; }",
      "#tab-csm-workspace .tpl select { font:inherit; font-size:.9rem; padding:4px 8px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); max-width:100%; }",
      "#tab-csm-workspace .tpl-meta { margin:0; font-size:.86rem; color:var(--cw-muted); overflow-wrap:anywhere; }",
      "#tab-csm-workspace .addr { display:grid; grid-template-columns:max-content minmax(0, 1fr); gap:6px 10px; align-items:center; font-size:.88rem; }",
      "#tab-csm-workspace .addr dt { color:var(--cw-muted); font-weight:600; }",
      "#tab-csm-workspace .addr dd { margin:0; min-width:0; overflow-wrap:anywhere; }",
      "#tab-csm-workspace .ccpick { border:1px solid var(--cw-field-line); border-radius:6px; background:var(--cw-surface); }",
      "#tab-csm-workspace .ccpick > summary { cursor:pointer; list-style:none; padding:6px 10px; min-height:24px; display:flex; justify-content:space-between; gap:10px; align-items:center; font-size:.88rem; }",
      "#tab-csm-workspace .ccpick > summary::-webkit-details-marker { display:none; }",
      "#tab-csm-workspace .ccpick > summary .word { pointer-events:none; }",
      "#tab-csm-workspace .ccpick > summary:focus-visible { outline:2px solid var(--cw-accent); outline-offset:2px; border-radius:4px; }",
      "#tab-csm-workspace .ccpick-in { border-top:1px solid var(--cw-line-soft); padding:8px 10px 10px; display:grid; gap:8px; }",
      "#tab-csm-workspace .ccpick-in input[type=search] { width:100%; box-sizing:border-box; font:inherit; font-size:.88rem; padding:5px 8px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); }",
      "#tab-csm-workspace .ccpick fieldset { border:0; margin:0; padding:0; min-width:0; }",
      "#tab-csm-workspace .ccpick legend { font-size:.74rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--cw-muted); padding:0; margin:6px 0 2px; }",
      "#tab-csm-workspace .ccpick-list { max-height:240px; overflow:auto; display:grid; gap:0; }",
      "#tab-csm-workspace .ccopt { display:grid; grid-template-columns:auto minmax(0, 1fr); gap:8px; align-items:start; padding:5px 2px; border-top:1px solid var(--cw-line-soft); font-size:.88rem; cursor:pointer; }",
      "#tab-csm-workspace .ccopt input { width:18px; height:18px; margin:1px 0 0; accent-color:var(--cw-accent); }",
      "#tab-csm-workspace .ccopt .nm { color:var(--cw-muted); font-style:italic; }",
      "#tab-csm-workspace .ccopt .tt { color:var(--cw-ink); }",
      "#tab-csm-workspace .ccopt[hidden] { display:none; }",
      "#tab-csm-workspace .addr input { width:100%; box-sizing:border-box; font:inherit; font-size:.88rem; padding:4px 8px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); }",
      "#tab-csm-workspace .tpl-body { margin:0; white-space:pre-wrap; font-size:.9rem; line-height:1.5; background:var(--cw-surface); border:1px solid var(--cw-line-soft); border-radius:6px; padding:10px 12px; overflow-wrap:anywhere; }",
      "#tab-csm-workspace .mailprev { background:var(--cw-paper); color:var(--cw-paper-ink); border:1px solid var(--cw-line-soft); border-radius:6px; padding:10px 12px; display:grid; gap:10px; }",
      "#tab-csm-workspace .mailprev .tpl-body { background:transparent; border:0; padding:0; color:var(--cw-paper-ink); }",
      "#tab-csm-workspace .mailprev img { width:200px; height:auto; display:block; }",
      "#tab-csm-workspace .tpl-body mark { background:var(--cw-ask-bg); color:var(--cw-ask-fg); padding:0 2px; border-radius:2px; }",
      "#tab-csm-workspace .tablewrap { overflow-x:auto; }",
      "#tab-csm-workspace table.roster { width:100%; border-collapse:collapse; font-size:.88rem; min-width:420px; }",
      "#tab-csm-workspace .roster th, #tab-csm-workspace .roster td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--cw-line-soft); vertical-align:top; }",
      "#tab-csm-workspace .roster th { color:var(--cw-muted); font-weight:600; font-size:.8rem; }",
      "#tab-csm-workspace .log { list-style:none; margin:0; padding:0; }",
      "#tab-csm-workspace .ev { display:grid; grid-template-columns:5.6rem minmax(0, 1fr); gap:4px 14px; padding:9px 0; border-top:1px solid var(--cw-line-soft); font-size:.9rem; }",
      "#tab-csm-workspace .ev:first-child { border-top:0; }",
      "#tab-csm-workspace .ev-when { color:var(--cw-muted); font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .ev-what b { color:var(--cw-heading); }",
      "#tab-csm-workspace .ev-what p { margin:3px 0 0; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .ev-by { color:var(--cw-muted); font-size:.82rem; }",
      "#tab-csm-workspace .ev.sys .ev-what b { color:var(--cw-ink-2); font-weight:600; }",
      "#tab-csm-workspace .compose { display:grid; gap:8px; }",
      "#tab-csm-workspace .compose textarea { width:100%; box-sizing:border-box; min-height:80px; font:inherit; font-size:.92rem; line-height:1.5; padding:8px 10px; border:1px solid var(--cw-field-line); border-radius:6px; background:var(--cw-surface); color:var(--cw-ink); resize:vertical; }",
      "#tab-csm-workspace .compose-row { display:flex; flex-wrap:wrap; gap:6px 18px; align-items:center; }",
      "#tab-csm-workspace .compose-row label { display:inline-flex; gap:6px; align-items:center; font-size:.9rem; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .compose-row select, #tab-csm-workspace .compose-row input[type=date] { font:inherit; font-size:.88rem; padding:3px 6px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); }",
      "#tab-csm-workspace .rec-foot { display:flex; flex-wrap:wrap; gap:6px 20px; padding-top:12px; border-top:1px solid var(--cw-line-soft); }",
      "#tab-csm-workspace .board { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; }",
      "#tab-csm-workspace .col { background:var(--cw-surface); border:1px solid var(--cw-line); border-radius:12px; padding:14px 16px; display:grid; gap:8px; align-content:start; min-width:0; }",
      "#tab-csm-workspace .col-h { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }",
      "#tab-csm-workspace .col-h .word { font-size:1rem; }",
      "#tab-csm-workspace .col-n { font-family:var(--cw-serif); font-size:1.5rem; font-weight:700; color:var(--cw-title); font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .col-what { margin:0; color:var(--cw-muted); font-size:.84rem; }",
      "#tab-csm-workspace .chips { display:flex; flex-wrap:wrap; gap:4px 12px; max-height:200px; overflow:auto; padding:2px; }",
      "#tab-csm-workspace .chip { all:unset; cursor:pointer; min-height:24px; font-size:.88rem; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; }",
      "#tab-csm-workspace .chip:hover { color:var(--cw-heading); }",
      "#tab-csm-workspace .ncstrip { margin:0; font-size:.92rem; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .onfile-src { display:grid; gap:6px; }",
      "#tab-csm-workspace .onfile-src h4 { margin:0; font-size:.98rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .onfile-src .tpl-meta { margin:0; }",
      "#tab-csm-workspace .fields { margin:0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px 18px; font-size:.9rem; }",
      "#tab-csm-workspace .fields li { display:flex; justify-content:space-between; gap:10px; border-top:1px solid var(--cw-line-soft); padding:4px 0; }",
      "#tab-csm-workspace .fields .off { color:var(--cw-ask-fg); background:var(--cw-ask-bg); border-radius:999px; padding:0 8px; font-size:.78rem; font-weight:700; white-space:nowrap; }",
      "#tab-csm-workspace .fields .on { color:var(--cw-muted); font-size:.82rem; white-space:nowrap; }",
      "#tab-csm-workspace .tags { display:flex; flex-wrap:wrap; gap:6px; }",
      "#tab-csm-workspace .diff { margin:0; padding:10px 12px; border-radius:8px; background:var(--cw-ask-bg); color:var(--cw-ask-fg); font-size:.9rem; }",
      "#tab-csm-workspace .ppl-h { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:4px 16px; margin:0 0 6px; }",
      "#tab-csm-workspace .ppl-h .k { margin:0; }",
      "#tab-csm-workspace .roles { margin:0; padding:0; list-style:none; display:grid; gap:0; }",
      "#tab-csm-workspace .roles > li { border-top:1px solid var(--cw-line-soft); }",
      "#tab-csm-workspace .roles summary { cursor:pointer; list-style:none; display:grid; grid-template-columns:minmax(0, 1fr) auto auto; gap:4px 16px; align-items:baseline; padding:8px 0; min-height:24px; }",
      "#tab-csm-workspace .roles summary::-webkit-details-marker { display:none; }",
      "#tab-csm-workspace .roles summary:focus-visible { outline:2px solid var(--cw-accent); outline-offset:2px; border-radius:3px; }",
      "#tab-csm-workspace .roles summary .rn { font-weight:600; color:var(--cw-heading); text-decoration:underline; text-underline-offset:3px; text-decoration-color:var(--cw-line); }",
      "#tab-csm-workspace .roles summary .rc { font-variant-numeric:tabular-nums; color:var(--cw-ink); white-space:nowrap; }",
      "#tab-csm-workspace .roles summary .rp { font-variant-numeric:tabular-nums; color:var(--cw-muted); font-size:.84rem; white-space:nowrap; }",
      "#tab-csm-workspace .roles details[open] summary .rn { text-decoration:none; }",
      "#tab-csm-workspace .titles { margin:0 0 10px; padding:0; list-style:none; display:grid; gap:2px; font-size:.88rem; }",
      "#tab-csm-workspace .titles li { display:flex; justify-content:space-between; gap:12px; padding:2px 0 2px 14px; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .titles li span:last-child { color:var(--cw-muted); font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .ppl-tools { display:flex; flex-wrap:wrap; gap:4px 16px; align-items:center; }",
      "#tab-csm-workspace details.onfile { display:grid; gap:10px; }",
      "#tab-csm-workspace details.onfile summary { cursor:pointer; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; }",
      "#tab-csm-workspace .tplform { display:grid; gap:8px; }",
      "#tab-csm-workspace .tplform textarea { width:100%; box-sizing:border-box; font:inherit; resize:vertical; }",
      "#tab-csm-workspace .tplpre { white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; margin:0; }",
      "#tab-csm-workspace details.tplprev summary, #tab-csm-workspace details.tplhist summary { cursor:pointer; color:var(--cw-link); text-decoration:underline; text-underline-offset:3px; min-height:24px; }",
      "@media (max-width: 560px) { #tab-csm-workspace .fields { grid-template-columns:minmax(0, 1fr); } }",
      "#tab-csm-workspace .hc { position:absolute; z-index:50; max-width:min(340px, calc(100vw - 32px)); background:var(--cw-surface); color:var(--cw-ink); border:1px solid var(--cw-line); border-radius:10px; box-shadow:0 12px 32px rgba(8,43,97,.18); padding:12px 14px; font-size:.86rem; line-height:1.45; display:grid; gap:6px; }",
      "#tab-csm-workspace .hc[hidden] { display:none; }",
      "#tab-csm-workspace .hc h4 { margin:0; font-family:var(--cw-serif); font-size:1rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .hc ul { margin:0; padding:0; list-style:none; display:grid; gap:2px; }",
      "#tab-csm-workspace .hc li { display:flex; justify-content:space-between; gap:12px; }",
      "#tab-csm-workspace .hc li span:last-child { color:var(--cw-muted); font-variant-numeric:tabular-nums; white-space:nowrap; text-align:right; }",
      "#tab-csm-workspace .hc .hc-k { color:var(--cw-muted); font-size:.78rem; }",
      "#tab-csm-workspace .hc .hc-more { color:var(--cw-muted); font-size:.8rem; }",
      "#tab-csm-workspace [data-hc] { cursor:help; }",
      "#tab-csm-workspace button[data-hc], #tab-csm-workspace .row[data-hc], #tab-csm-workspace .chip[data-hc] { cursor:pointer; }",
      "#tab-csm-workspace [data-hc]:not(button):not(.row):not(.chip) { text-decoration:underline dotted var(--cw-muted); text-underline-offset:4px; }",
      "#tab-csm-workspace .big[data-hc] { text-decoration-thickness:2px; }",
      "#tab-csm-workspace .mm-grid { display:grid; grid-template-columns:minmax(0, 5fr) minmax(0, 7fr); gap:16px; align-items:start; }",
      "#tab-csm-workspace .mm-step { display:grid; gap:8px; min-width:0; }",
      "#tab-csm-workspace .mm-step h4 { margin:0; font-size:.98rem; color:var(--cw-heading); display:flex; justify-content:space-between; gap:10px; align-items:baseline; }",
      "#tab-csm-workspace .mm-step h4 small { color:var(--cw-muted); font-weight:400; font-size:.84rem; font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .mm-insts { max-height:260px; overflow:auto; border:1px solid var(--cw-line-soft); border-radius:8px; padding:4px 10px; }",
      "#tab-csm-workspace .mm-roles { display:grid; gap:2px; margin:0; padding:0; border:0; }",
      "#tab-csm-workspace .mm-roles label, #tab-csm-workspace .mm-insts label { display:grid; grid-template-columns:auto minmax(0, 1fr); gap:8px; align-items:start; padding:4px 0; font-size:.9rem; cursor:pointer; }",
      "#tab-csm-workspace .mm-roles input, #tab-csm-workspace .mm-insts input { width:18px; height:18px; margin:1px 0 0; accent-color:var(--cw-accent); }",
      "#tab-csm-workspace .mm-roles .hint { display:block; color:var(--cw-muted); font-size:.8rem; }",
      "#tab-csm-workspace .mm-roles label.off { color:var(--cw-muted); cursor:default; }",
      "#tab-csm-workspace .mm-field { display:grid; gap:4px; font-size:.88rem; }",
      "#tab-csm-workspace .mm-field input, #tab-csm-workspace .mm-field textarea, #tab-csm-workspace .mm-field select { font:inherit; font-size:.9rem; padding:6px 8px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); width:100%; box-sizing:border-box; }",
      "#tab-csm-workspace .mm-field textarea { min-height:150px; line-height:1.5; resize:vertical; }",
      "#tab-csm-workspace .mm-fields-help { margin:0; font-size:.8rem; color:var(--cw-muted); }",
      "#tab-csm-workspace .mm-fields-help code { font-family:ui-monospace,Menlo,Consolas,monospace; color:var(--cw-heading); }",
      "#tab-csm-workspace .mm-sum { margin:0; padding:10px 12px; border-radius:8px; background:var(--cw-pill-bg); color:var(--cw-pill-fg); font-size:.92rem; font-variant-numeric:tabular-nums; }",
      "#tab-csm-workspace .mm-out { display:flex; flex-wrap:wrap; gap:6px 20px; align-items:center; }",
      "#tab-csm-workspace .mm-out label { display:inline-flex; gap:6px; align-items:center; font-size:.88rem; color:var(--cw-ink-2); }",
      "#tab-csm-workspace .mm-out input[type=number] { width:4.2em; font:inherit; font-size:.88rem; padding:2px 6px; border:1px solid var(--cw-field-line); border-radius:4px; background:var(--cw-surface); color:var(--cw-ink); }",
      "@media (max-width: 760px) { #tab-csm-workspace .mm-grid { grid-template-columns:minmax(0, 1fr); } }",
      "#tab-csm-workspace .review { display:grid; gap:10px; border:1px solid var(--cw-line); border-top:4px solid var(--cw-gold); border-radius:10px; padding:14px 16px; }",
      "#tab-csm-workspace .review h4 { margin:0; font-family:var(--cw-serif); font-size:1.1rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .reqs { margin:0; padding:0; list-style:none; display:grid; gap:0; }",
      "#tab-csm-workspace .req { display:grid; grid-template-columns:8.6rem minmax(0, 1fr); gap:4px 12px; align-items:baseline; padding:7px 0; border-top:1px solid var(--cw-line-soft); font-size:.9rem; }",
      "#tab-csm-workspace .req:first-child { border-top:0; }",
      "#tab-csm-workspace .req .why { display:block; color:var(--cw-muted); font-size:.85rem; }",
      "#tab-csm-workspace .req .ichk { display:inline-flex; gap:6px; align-items:center; margin-top:4px; font-size:.86rem; color:var(--cw-ink-2); cursor:pointer; }",
      "#tab-csm-workspace .req .ichk input { width:18px; height:18px; margin:0; accent-color:var(--cw-accent); }",
      "#tab-csm-workspace .pill.fail { background:var(--cw-ask-bg); color:var(--cw-warn-fg); }",
      "#tab-csm-workspace .verdict { display:flex; flex-wrap:wrap; gap:6px 20px; align-items:center; padding-top:10px; border-top:1px solid var(--cw-line-soft); }",
      "#tab-csm-workspace .verdict .lead { font-size:1rem; }",
      "#tab-csm-workspace .gate { margin:0; font-size:.88rem; color:var(--cw-ink-2); }",
      "@media (max-width: 560px) { #tab-csm-workspace .req { grid-template-columns:minmax(0, 1fr); } }",
      "#tab-csm-workspace .foot { border-top:1px solid var(--cw-line); padding-top:16px; display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px 24px; color:var(--cw-muted); font-size:.88rem; }",
      "@media (max-width: 960px) { #tab-csm-workspace .cohort-row { grid-template-columns:repeat(2, minmax(0, 1fr)); } #tab-csm-workspace .center { grid-template-columns:minmax(0, 1fr); gap:16px; } #tab-csm-workspace .split { display:none; } #tab-csm-workspace .board { grid-template-columns:repeat(2, minmax(0, 1fr)); } #tab-csm-workspace .back { display:inline-flex; } }",
      "@media (max-width: 560px) { #tab-csm-workspace .needs-row, #tab-csm-workspace .cohort-row, #tab-csm-workspace .board { grid-template-columns:minmax(0, 1fr); } #tab-csm-workspace .cond, #tab-csm-workspace .ev { grid-template-columns:minmax(0, 1fr); gap:2px; } #tab-csm-workspace .needs .big { font-size:2.3rem; } }",
      "@media (prefers-reduced-motion: no-preference) { #tab-csm-workspace .row, #tab-csm-workspace .card { transition:background-color .12s, border-color .12s; } }"
  ];
  "use strict";
  var TAB = "csm-workspace";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function F() { return window.CPL_FUNDING_TAB && window.CPL_FUNDING_TAB.csm ? window.CPL_FUNDING_TAB.csm : null; }
  function root() { return document.getElementById("csm-workspace-root"); }

  /* The tab's tokens: the mock's palette in the light theme (the CPL Commons look, Sam's ask of 2026-11-02), and in
     the dark theme every role mapped onto a First Light dark token, as commons.js does, so no color is invented
     there (Rule 4: the dark roles live in both HTMLs' :root). */
  var LIGHT = "--cw-page:#F5FAFF; --cw-page-end:#EEF6FB; --cw-surface:#FFFFFF; --cw-ink:#17243B; --cw-ink-2:#3E4C61; " +
    "--cw-muted:#58677D; --cw-heading:#082B61; --cw-title:#072C66; --cw-link:#0D5BC6; --cw-accent:#1671D9; --cw-gold:#F4B300; " +
    "--cw-line:#D9E4EF; --cw-line-soft:#E8EEF5; --cw-field-line:#6E7F96; --cw-track:#E3ECF5; --cw-pill-bg:#EAF4FE; " +
    "--cw-pill-fg:#355A80; --cw-ask-bg:#FFF4D6; --cw-ask-fg:#5C4000; --cw-warn-fg:#8A2316; --cw-sel:#EEF5FD; --cw-guide:#9AA9BC; " +
    "--cw-met:#1F5D3A; --cw-paper:#FFFFFF; --cw-paper-ink:#1C1C1A; --cw-dialog:#FFFFFF; --cw-serif:Georgia,'Times New Roman',serif; " +
    "--cw-sans:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;";
  var DARK = "--cw-page:var(--surface-muted); --cw-page-end:var(--surface-muted); --cw-surface:var(--surface); " +
    "--cw-ink:var(--text-body); --cw-ink-2:var(--text-body); --cw-muted:var(--text-muted); --cw-heading:var(--text-strong); " +
    "--cw-title:var(--text-strong); --cw-link:var(--cobalt); --cw-accent:var(--cobalt); --cw-gold:var(--gold-accent); " +
    "--cw-line:var(--border); --cw-line-soft:var(--border); --cw-field-line:var(--border-strong); --cw-track:var(--surface-muted); " +
    "--cw-pill-bg:var(--surface-muted); --cw-pill-fg:var(--text-body); --cw-ask-bg:var(--gold-soft); --cw-ask-fg:var(--mustard-text); " +
    "--cw-warn-fg:var(--danger-text); --cw-sel:var(--surface-muted); --cw-guide:var(--text-faint); --cw-paper:var(--surface); " +
    "--cw-paper-ink:var(--text-body); --cw-dialog:var(--surface-opaque); --cw-met:var(--success-text);";
  var CSS_ID = "csm-workspace-css";
  function ensureCss() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement("style");
    st.id = CSS_ID;
    st.textContent = ["#tab-csm-workspace { " + LIGHT + " }",
      ':root[data-theme="dark"] #tab-csm-workspace { ' + DARK + " }",
      '@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #tab-csm-workspace { ' + DARK + " } }",
      "#tab-csm-workspace .cw { background:linear-gradient(180deg, var(--cw-surface) 0, var(--cw-page) 26rem, var(--cw-page-end) 100%); " +
        "background-color:var(--cw-page); color:var(--cw-ink); font-family:var(--cw-sans); font-size:16px; line-height:1.55; border-radius:12px; }",
      "#tab-csm-workspace .cw-fold[hidden] { display:none; }",
      // A popup sits over the page, so its ground is opaque in both themes (dark --surface is translucent glass).
      "#tab-csm-workspace .rolefield { display:grid; gap:4px; margin:6px 0; max-width:340px; font-weight:600; font-size:.88rem; }",
      "#tab-csm-workspace .signin { margin:0; padding:10px 14px; border-radius:8px; background:var(--cw-pill-bg); color:var(--cw-pill-fg); font-size:.92rem; }",
      "#tab-csm-workspace .grant .grant-acts { margin:8px 0 2px; }"
    ].concat(RULES).join("\n");
    document.head.appendChild(st);
    try {
      if (!document.getElementById("cpl-inter-font")) {
        var l = document.createElement("link");
        l.id = "cpl-inter-font"; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
        document.head.appendChild(l);
      }
    } catch (e) {}
  }

  // ── the read ─────────────────────────────────────────────────────────────
  var S = null;                 // the funding tab's snapshot, refreshed on every model change
  var state = { view: "open", q: "", sel: null, checks: {}, lpOpen: {}, tplId: "lead", tplDraft: {}, msg: "", draft: {} };
  // ── the communications log (csm_log, kb/migrations/2026-11-02_csm_log.sql) ──────────────────────────────────────
  // Notes, calls, emails and meetings per college and activity, each with an optional follow-up date. A signed-in
  // reviewer reads and writes it with their own credential; the trigger stamps who. Read whole (paged by Range, the kb_curation rule),
  // re-read after every write, because a write RLS filters out returns 2xx having changed nothing.
  var ACTIVITY = "funding";
  var LOG = { rows: [], loaded: false, error: "", seq: 0, asked: false };
  var KINDS = [["note", "Note"], ["call", "Call"], ["email", "Email"], ["meeting", "Meeting"], ["follow_up", "Follow-up"]];
  function kindWord(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === k) return KINDS[i][1]; return k; }
  function rest() { var f = F(); return f && typeof f.rest === "function" ? f.rest() : null; }
  function loadLog() {
    var R = rest();
    if (!R || !S || !S.reviewer) return;
    LOG.asked = true;
    if (!R.remote) { LOG.loaded = true; return; }
    var all = [], size = 1000;
    var page = function (from) {
      return fetch(R.url + "csm_log?select=*&activity=eq." + ACTIVITY + "&order=created_at.desc,id.desc",
        { headers: Object.assign({ Range: from + "-" + (from + size - 1), "Range-Unit": "items" }, R.headers) })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (rows) { all = all.concat(rows || []); return rows && rows.length === size ? page(from + size) : all; });
    };
    page(0).then(function (rows) { LOG.rows = rows; LOG.loaded = true; LOG.error = ""; paint(); })
      .catch(function (e) { LOG.loaded = true; LOG.error = "The log could not be read (" + e.message + "). Reload to try again."; paint(); });
  }
  function fv(fm, n) { var x = fm && fm.elements ? fm.elements.namedItem(n) : null; return x || { value: "", focus: function () {} }; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  // One write: POST a row, PATCH one by id, or DELETE one. Without a remote (tests, NO_REMOTE) the store changes here.
  function logWrite(method, id, body) {
    var R = rest();
    if (!R) return Promise.resolve(false);
    if (!R.remote) {
      if (method === "POST") LOG.rows.unshift(Object.assign({ id: ++LOG.seq, activity: ACTIVITY, by_email: R.who, created_at: new Date().toISOString(),
        done_at: null, done_by: null }, body));
      else LOG.rows = LOG.rows.map(function (x) {
        if (x.id !== id) return x;
        if (method === "DELETE") return null;
        var y = Object.assign({}, x, body);
        if (body.done_at && !x.done_at) y.done_by = R.who; else if (body.done_at === null) y.done_by = null;
        return y;
      }).filter(Boolean);
      paint();
      return Promise.resolve(true);
    }
    var q = method === "POST" ? "" : "?id=eq." + encodeURIComponent(id);
    return fetch(R.url + "csm_log" + q, { method: method,
      headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, R.headers),
      body: method === "DELETE" ? undefined : JSON.stringify(method === "POST" ? Object.assign({ activity: ACTIVITY }, body) : body) })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return true; })
      .catch(function (e) { say("The log did not save (" + e.message + "). Your words are still in the box."); return false; })
      .then(function (ok) { loadLog(); return ok; });
  }
  function logFor(key) { return LOG.rows.filter(function (x) { return x.college === key; }); }
  function openFollowUps(key) { return logFor(key).filter(function (x) { return x.follow_up_on && !x.done_at; })
    .sort(function (a, b) { return a.follow_up_on < b.follow_up_on ? -1 : 1; }); }
  function dueOf(r) { var o = openFollowUps(r.key); return o.length ? o[0] : null; }

  function rowOf(key) { if (!S) return null; for (var i = 0; i < S.rows.length; i++) if (S.rows[i].key === key) return S.rows[i]; return null; }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function shortDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
    return m ? MONTHS[Number(m[2]) - 1] + " " + Number(m[3]) : "";
  }
  function daysSince(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
    if (!m) return null;
    var then = Date.UTC(+m[1], +m[2] - 1, +m[3]), now = new Date();
    return Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - then) / 864e5));
  }
  function money(n) { return "$" + Math.round(n || 0).toLocaleString("en-US"); }

  // Where each institution stands, in the board's four columns.
  /* The Noncredit CPL Lead condition (Sam, 2026-11-09, on COBIx's writeup of the walkthrough with Malone: "in MAP since
     itpi just added the field in map users. if they attest, we can accept that now as well"). The role on the college's
     MAP landing page meets it, and so does an accepted attestation. A form still waiting at a college that holds the
     role asks nothing of the team: the condition is already met. */
  function ncMet(r) { return !!(r.nc && (r.nc.standing || r.nc.lead)); }
  function ncWaiting(r) { return !!(r.nc && r.nc.waiting && !r.nc.lead); }
  function waitingKinds(r) {
    var k = [];
    if (r.part.waiting) k.push("part");
    if (ncWaiting(r)) k.push("nc");
    return k;
  }
  function stageOf(r) {
    if (waitingKinds(r).length) return "waiting";
    // Fail-open, as the funding tab's gate: a condition still loading never reads as held.
    if (r.part.confirmed) return r.gate.blocked ? "held" : "qual";
    return "notyet";
  }
  var STAGES = [
    { id: "notyet", label: "Not yet confirmed", what: "No participation confirmation on file." },
    { id: "waiting", label: "Waiting on the team", what: "A confirmation or a noncredit attestation waits for review." },
    { id: "held", label: "Confirmed, still held", what: "Confirmed, and a minimum condition is not yet met." },
    { id: "qual", label: "Qualifies", what: "Every minimum condition is met." }];
  function missingWords(r) {
    return r.conds.filter(function (c) { return !c.met && !c.pending; }).map(function (c) { return c.words; });
  }
  /* Ready to send (issue 2967, item 3, designed in the csm-workspace lane): the college whose next email is due. Confirmed
     and no Acceptance sent receipt: the acceptance, with the conditions still waiting. Not yet confirmed and no nudge
     in 14 days: the nudge. A request waiting on the team: Accept first, from the review. Sent writes the receipt, so
     the college leaves the queue. */
  var NUDGE_SUBJ = /a participation confirmation for /;
  /* Each email's receipt, and its undo (COBIx on issue 2967, 16:17Z): Sent writes "<prefix>: …"; It bounced writes
     "It bounced, <that receipt>", and the later of the two decides, so a bounce puts the college back in the queue. */
  var SENT = { accept: "Acceptance sent", accept_nc: "Attestation acceptance sent", nudge: "Nudge sent", lead: "Noncredit CPL Lead ask sent" };
  /* The Noncredit CPL Lead ask (Sam, 2026-11-09: the ask is "for the role in MAP ... if they attest, we can accept that
     now as well"). Open when the noncredit share applies, the role is not in MAP, no attestation stands and none waits.
     A college owing the confirmation too gets both asks in one email ("both"), whose receipt is the nudge's, told
     apart by its subject. An ask counts as made for 14 days, as the nudge does. */
  var BOTH_SUBJ = /: two steps for /, LEAD_SUBJ = /: the Noncredit CPL Lead role in MAP for /;
  /* ON, on Sam's word (2026-11-10, in session, having read them: "yes to all"). Held until then (COBIx on PR 3050; the
     hold list's "anything outward"). Their wording is a template a reviewer can change (Email templates, PR 3068). Set
     false and no lead ask is ever due again: a college owing the confirmation gets the plain nudge, and the Template
     menu offers neither. */
  var LEAD_MAIL_ON = true;
  function leadOpen(r) { return LEAD_MAIL_ON && !!(r.nc && !ncMet(r) && !ncWaiting(r)); }
  // An ask counts as made for 14 days, by its Sent receipt or by a draft opened or copied (as a nudge's draft counts).
  // A Sent nudge is final, as it was before this change: lastSent has no window, so a college nudged by either email
  // is not due a nudge again; the Noncredit CPL Lead ask alone comes due again after 14 days, once the college confirms.
  function leadAsked(r) {
    if ((state.sent || {})[r.key + "|lead"] || (state.sent || {})[r.key + "|both"]) return true;
    var since = plusDays(-14), a = lastSent(r, "lead"), b = lastSent(r, "nudge");
    return !!(a && String(a.created_at || "").slice(0, 10) >= since) ||
      !!(b && BOTH_SUBJ.test(String(b.body || "")) && String(b.created_at || "").slice(0, 10) >= since) ||
      sentOf(r, LEAD_SUBJ, 14) || sentOf(r, BOTH_SUBJ, 14);
  }
  function lastSent(r, tpl) {
    var p = SENT[tpl] + ": ", rows = logFor(r.key).filter(function (x) {
      var b = String(x.body || "");
      return x.kind === "email" && (b.indexOf(p) === 0 || b.indexOf("It bounced, " + p) === 0);
    }).sort(function (a, b) { return String(a.created_at || "") < String(b.created_at || "") ? 1 : -1; });
    return rows[0] && String(rows[0].body || "").indexOf(p) === 0 ? rows[0] : null;
  }
  function sentOf(r, re, days) {
    var since = days ? plusDays(-days) : "";
    return logFor(r.key).some(function (x) {
      return x.kind === "email" && re.test(String(x.body || "")) && (!since || String(x.created_at || "").slice(0, 10) >= since);
    });
  }
  function isSent(r, tpl) {
    return !!(state.sent || {})[r.key + "|" + tpl] || (tpl === "nudge" && !!(state.sent || {})[r.key + "|both"]) || !!lastSent(r, tpl);
  }
  function readyOf(r) {
    if (waitingKinds(r).length) return "wait";
    // state.sent bridges the moment between a Sent that saved and the log's re-read.
    if (r.part.confirmed && !isSent(r, "accept")) return "accept";
    if (r.nc && r.nc.standing && !isSent(r, "accept_nc")) return "accept_nc";
    if (r.part.confirmed) return leadOpen(r) && !leadAsked(r) ? "lead" : null;
    return isSent(r, "nudge") || sentOf(r, NUDGE_SUBJ, 14) && !bouncedSince(r, NUDGE_SUBJ) ||
      sentOf(r, BOTH_SUBJ, 14) && !bouncedSince(r, BOTH_SUBJ) ? null : "nudge";
  }
  /* COPIED OR DRAFTED, NOT YET MARKED SENT (found in session, 2026-11-12). A request copied or opened as a draft counts
     as asked for 14 days (readyOf), so the email stops being due and its Sent word left with it: the reviewer who
     pasted it into Outlook, sent it and came back had nothing to press, and the log read "Email copied" for good.
     This finds that copy or draft, while the ask is still owed and no Sent receipt follows it, so the record can
     keep offering Sent. What is due and when is unchanged. */
  var DRAFT_RE = /^(Email copied|Draft opened|Gmail draft opened): /;
  function draftedOf(r) {
    if (!S.reviewer || waitingKinds(r).length || recTpl(r)) return null;
    var since = plusDays(-14), rows = logFor(r.key).filter(function (x) {
      return x.kind === "email" && DRAFT_RE.test(String(x.body || "")) && String(x.created_at || "").slice(0, 10) >= since;
    }).sort(function (a, b) { return String(a.created_at || "") < String(b.created_at || "") ? 1 : -1; });
    for (var i = 0; i < rows.length; i++) {
      var b = String(rows[i].body || ""), tpl = BOTH_SUBJ.test(b) ? "both" : LEAD_SUBJ.test(b) ? "lead" : NUDGE_SUBJ.test(b) ? "nudge" : "";
      if (!tpl) continue;
      // Still owed: the confirmation for a request, the role for the lead ask.
      if (tpl === "lead" ? !leadOpen(r) : r.part.confirmed) return null;
      var rc = lastSent(r, tpl === "both" ? "nudge" : tpl);
      if (rc && String(rc.created_at || "") >= String(rows[i].created_at || "")) return null;
      return { tpl: tpl, at: rows[i].created_at, how: /^Email copied/.test(b) ? "Copied" : "A draft was opened",
        rest: b.replace(DRAFT_RE, "") };
    }
    return null;
  }
  function draftedWords(d) {
    return d.how + " " + shortDate(d.at) + " and not yet marked as sent. Once the email has gone out, press Sent.";
  }
  function bouncedSince(r, re) {
    return logFor(r.key).some(function (x) { return /^It bounced, /.test(String(x.body || "")) && re.test(String(x.body || "")); });
  }
  /* Not received (COBIx on issue 2967, 16:17Z): the acceptances confirmed before the CSM log went live
     (2026-11-09) never reached the college: Exchange refused the shared mailbox's From line (SendAsDenied). They lead
     the queue, each ready to resend. */
  var LOG_LIVE = "2026-11-09";
  function notReceived(r) {
    var rd = readyOf(r), at = rd === "accept" ? r.part.confirmedAt : rd === "accept_nc" ? r.nc && r.nc.confirmedAt : "";
    return !!at && String(at).slice(0, 10) < LOG_LIVE;
  }
  var READY_WORDS = { wait: "Accept first: review the request, then the acceptance is ready.",
    accept: "Send the acceptance.", accept_nc: "Send the noncredit attestation acceptance.",
    nudge: "Send the request for the participation confirmation.",
    lead: "Ask the college to give its lead the Noncredit CPL Lead role in MAP." };
  // One wording for the email that is due, whatever the list (COBIx on PR 3049): Ready to send and every other list
  // read it from here, so the same email never reads two ways.
  function readyWords(r, rd) {
    var mw = rd === "accept" ? missingWords(r) : [], still = mw.length ? " Still waiting: " + mw.join("; ") + "." : "";
    if (notReceived(r)) return "Resend the " + (rd === "accept" ? "acceptance" : "noncredit attestation acceptance") + ": confirmed " +
      shortDate(rd === "accept" ? r.part.confirmedAt : r.nc.confirmedAt) + ", and the first email did not reach the college." + still;
    if (rd === "nudge" && leadOpen(r)) return "Send one email asking for the confirmation and the Noncredit CPL Lead role in MAP.";
    return READY_WORDS[rd] + still;
  }
  // The email the college's state calls for: the one Ready to send holds, with both asks in one email where both are open.
  function recTpl(r) { var rd = readyOf(r); return rd === "nudge" && leadOpen(r) ? "both" : SENT[rd] ? rd : null; }
  function nextStep(r) {
    if ((state.view === "accept" || state.view === "request") && readyOf(r) && readyOf(r) !== "wait") return readyWords(r, readyOf(r));
    // Outside Ready to send every line still names the email or the date (Malone, 2026-11-10: "each line a specific
    // next action"), from the same readyOf the Ready to send list keeps, so the two lists cannot disagree.
    var w = waitingKinds(r), sentOn = function (at) { return at ? " sent " + shortDate(at) : ""; };
    if (w.length === 2) return "Review the participation confirmation" + sentOn(r.part.at) + " and the noncredit attestation, then accept or deny each.";
    if (w[0] === "part") return "Review the participation confirmation" + sentOn(r.part.at) + ", then accept or deny it.";
    if (w[0] === "nc") return "Review the noncredit attestation" + sentOn(r.nc.at) + ", then accept or deny it." + (r.part.confirmed ? "" : " The participation confirmation has not arrived.");
    var du = dueOf(r);
    if (du && du.follow_up_on <= today()) return "Follow up" + (du.body ? ": " + du.body : "") + (/[.!?]$/.test(du.body || "") ? "" : ".");
    var rd = readyOf(r);
    if (rd) return readyWords(r, rd);
    var dr = draftedOf(r);
    if (dr) return draftedWords(dr);
    if (du) return "Nothing to send today. Follow up on " + shortDate(du.follow_up_on) + (du.body ? ": " + du.body : "") + (/[.!?]$/.test(du.body || "") ? "" : ".");
    var st = stageOf(r);
    if (st === "held") {
      var m = missingWords(r);
      return "Nothing to send. Still waiting: " + (m.length ? m.join("; ") : "a condition still pending") + ". No email goes out for " + (m.length > 1 ? "those" : "that") + ".";
    }
    if (st === "qual") return "Qualifies. Nothing waits.";
    var ns = lastSent(r, "nudge");
    return "Nothing to send today. The request for the confirmation went out" + (ns && ns.created_at ? " " + shortDate(ns.created_at) : " within the last two weeks") + ".";
  }
  /* The two groups (Malone, 2026-11-10; the rule is the go-live note's item 4, built on Sam's go): Needs you holds a
     request waiting on the team, an email ready to send and a follow-up due today or earlier; every other college
     waits on the college. */
  function needsYou(r) {
    return toDo(r);
  }
  function pillsOf(r) {
    var p = [];
    if (r.part.waiting) p.push(["ask", "Confirmation waiting"]);
    if (ncWaiting(r)) p.push(["ask", "NC attestation waiting"]);
    var du = dueOf(r);
    if (du && du.follow_up_on <= today()) p.push(["ask", "Follow-up due"]);
    if (notReceived(r)) p.push(["ask", "Not received"]);
    var st = stageOf(r);
    p.push(["", st === "qual" ? "Qualifies" : st === "held" ? "Held by a condition" : r.part.confirmed ? "Confirmed" : "Not confirmed"]);
    // Every badge kept (Malone, 2026-11-10): what the noncredit share still lacks, what was accepted, when the nudge went.
    if (r.nc && r.nc.standing) p.push(["", "Attestation accepted"]);
    else if (r.nc && !ncMet(r) && !ncWaiting(r)) p.push(["", "No Noncredit CPL Lead"]);
    var ns = !r.part.confirmed && !r.part.waiting ? lastSent(r, "nudge") : null;
    if (ns && ns.created_at) p.push(["", "Nudged " + shortDate(ns.created_at)]);
    return p;
  }
  function ageOf(r) {
    var w = waitingKinds(r);
    if (w.length) {
      var at = w[0] === "part" ? r.part.at : r.nc.at, d = daysSince(at);
      return { t: at ? "Waiting since " + shortDate(at) : "Waiting", over: d != null && d >= 2 };
    }
    var du = dueOf(r);
    if (du) return { t: "Follow-up due " + shortDate(du.follow_up_on), over: du.follow_up_on <= today() };
    return { t: "", over: false };
  }

  /* The menu in two groups, the work first (Sam's "go" on COBIx's proposal, PR 2990's thread and issue 2989,
     2026-11-09: "having a prioritized set of easy buttons to push is always preferable"). To do holds the queues a CSM
     acts on; Browse holds the lists a CSM reads. No view was renamed; Qualifies spells out what it means. */
  /* THE LISTS, REDRAWN (asked in session, 2026-11-12: "the filters are many and the accuracy seems few"; a count of
     14 colleges with a Noncredit CPL Lead met a filter that read 7). Each list was right by its own definition, but the
     definitions overlapped and one question had no list: "All open items" left out the emails that were due and held
     colleges with nothing to do, "Ready to send" held requests still under review, and a named Noncredit CPL Lead was
     split across two lists of 7 (attestations waiting; the condition met) with no list of all 14.
     Three groups now, each list named for exactly what it holds:
       To do      what the team acts on. Everything to do is the four lists under it, a college counted once.
       By stage   where a college stands. With Review a request these three hold every institution exactly once.
       Look up    a fact about a college, whatever its stage. */
  var GROUPS = [{ id: "todo", label: "To do" }, { id: "stage", label: "By stage" }, { id: "look", label: "Look up" }];
  function coordGap(r) { return r.conds.some(function (c) { return c.kind === "coord" && !c.met && !c.pending; }); }
  function followDue(r) { var du = dueOf(r); return !!(du && du.follow_up_on <= today()); }
  function acceptDue(r) { var rd = readyOf(r); return rd === "accept" || rd === "accept_nc"; }
  // A request is to send when it is due, or when it was copied or drafted and never marked Sent.
  function requestDue(r) { var rd = readyOf(r); return rd === "nudge" || rd === "lead" || !!draftedOf(r); }
  function toDo(r) { return waitingKinds(r).length > 0 || acceptDue(r) || requestDue(r) || followDue(r); }
  // A Noncredit CPL Lead named by any route: the role in MAP, an attestation accepted, or an attestation waiting.
  function ncNamed(r) { return !!(r.nc && (r.nc.lead || r.nc.standing || r.nc.waiting)); }
  var VIEWS = {
    open: { g: "todo", label: "Everything to do", keep: toDo },
    review: { g: "todo", label: "Review a request", keep: function (r) { return stageOf(r) === "waiting"; } },
    accept: { g: "todo", label: "Send an acceptance", keep: acceptDue },
    request: { g: "todo", label: "Send a request", keep: requestDue },
    follow: { g: "todo", label: "Follow up", keep: followDue },
    notyet: { g: "stage", label: "Not yet confirmed", bulk: true, keep: function (r) { return stageOf(r) === "notyet"; } },
    held: { g: "stage", label: "Confirmed, held by a condition", keep: function (r) { return stageOf(r) === "held"; } },
    qual: { g: "stage", label: "Qualifies (every condition met)", keep: function (r) { return stageOf(r) === "qual"; } },
    confirmed: { g: "look", label: "Confirmed", keep: function (r) { return r.part.confirmed; } },
    ncnamed: { g: "look", label: "Named a Noncredit CPL Lead (MAP or attestation)", keep: ncNamed },
    // A missing coordinator is status only: no CSM email for it, and Sam chases the confirmed ones himself (issue 3010,
    // his call 1). The first is the funding-held part of the second.
    coord: { g: "look", label: "Confirmed, missing the CPL Coordinator in MAP",
      keep: function (r) { return r.part.confirmed && coordGap(r); } },
    nocoord: { g: "look", label: "No CPL Coordinator in MAP", keep: coordGap },
    all: { g: "look", label: "All institutions", keep: function () { return true; } } };
  // An address saved before the lists were redrawn opens the list that now holds the same colleges, or the nearest.
  var VIEW_WAS = { send: "open", due: "follow", nc: "review", ncmet: "ncnamed", coordmet: "all" };
  /* The view a sign-in link returns to (cpl_session.js viewAddress); the address arrive() below opens. All open
     items is the tab's first view, so it reports the bare tab. */
  if (window.CPL_SESSION && CPL_SESSION.viewAddress) CPL_SESSION.viewAddress(TAB, function () {
    return VIEWS[state.view] && state.view !== "open" ? TAB + "/" + state.view : TAB;
  });
  var READY_RANK = { accept: 1, accept_nc: 2, lead: 3, nudge: 4, wait: 5 };
  function sortRank(r) {
    if (state.view === "accept" || state.view === "request") return notReceived(r) ? 0 : READY_RANK[readyOf(r)] != null ? READY_RANK[readyOf(r)] : 6;
    var s = stageOf(r), du = dueOf(r), rd = readyOf(r);
    // Needs you, most pressing first (COBIx on PR 3049): a request waiting on the team, an email that never reached
    // the college, a follow-up due, then the emails in Ready to send's own order, so a resend is never buried under the
    // colleges still owed their first nudge. Waiting on the college keeps the order by stage.
    if (s === "waiting") return 0;
    if (rd && rd !== "wait" && notReceived(r)) return 1;
    if (du && du.follow_up_on <= today()) return 2;
    if (rd && READY_RANK[rd] != null) return 2 + READY_RANK[rd];
    return s === "held" ? 10 : du ? 11 : s === "notyet" ? 12 : 13;
  }
  function shownRows() {
    if (!S) return [];
    var q = state.q.trim().toLowerCase(), v = VIEWS[state.view] || VIEWS.open;
    return S.rows.filter(function (r) {
      return v.keep(r) && (!q || (r.name + " " + r.key + " " + r.district).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) { return sortRank(a) - sortRank(b) || a.name.localeCompare(b.name); });
  }

  // ── the review before a decision (Sam, 2026-11-02: "Before we accept deny, CSM team needs to check to see if they
  // comply with requirements" and "Probably shouldn't allow an accept deny unless they seen that section") ──────────
  // Each requirement reads Checked by the form, Meets, Check this (with I checked this) or Does not meet, from what
  // the request and the requester context already hold; nothing here is typed by hand.
  // Accept opens once every Check this is ticked and nothing fails; Deny is open from the start. The review opens by
  // itself, so its being on screen is the seeing Sam asked for; the scroll gate that also waited for its foot to be
  // scrolled into view read as dead buttons in the side panel and is gone (Sam's go, 2026-11-10).
  function domainOf(email) { return String(email || "").split("@")[1] || ""; }
  function titleLabel(list, v) { for (var i = 0; i < list.length; i++) if (list[i].val === v) return list[i].label; return v || "not given"; }
  function ownMap(ctx) { return ctx ? ctx.map.filter(function (u) { return u.own; }) : []; }
  function ownLanding(ctx) { return ctx ? ctx.landing.filter(function (l) { return l.own; }) : []; }
  function reviewItems(r, kind) {
    var items = [];
    if (kind === "part") {
      var q = r.req && r.req.part;
      if (!q) return null;
      items.push({ t: "Sent from the college's or district's email domain", s: "form", d: (domainOf(q.email) || "The address") + ", checked by the form when it was sent." });
      items.push(q.title && q.title !== "Other"
        ? { t: "Sent by a senior administrator", s: "meets", d: "Title given: " + titleLabel(S.partTitles, q.title) + "." }
        : { t: "Sent by a senior administrator", s: "check", d: "Title given: " + titleLabel(S.partTitles, q.title) +
            (q.titleText ? ", written by the sender as " + q.titleText + ". Confirm that role is a senior administrator before you accept."
              : ". Confirm the sender's role before you accept.") });
      var mu = ownMap(q.ctx), lp = ownLanding(q.ctx);
      items.push(mu.length || lp.length
        ? { t: "The sender matches someone MAP shows for the college", s: "meets",
            d: [mu.length ? "MAP role: " + mu.map(function (u) { return u.role || "user"; }).join(", ") : "",
                lp.length ? "On the landing page as " + lp.map(function (l) { return l.title || "a contact"; }).join(" and ") : ""].filter(Boolean).join(". ") + "." }
        : { t: "The sender matches someone MAP shows for the college", s: "check",
            d: q.ctx ? "Not a MAP user at the college and not on its landing page." : "The requester context has not loaded." });
      return { kind: "Participation confirmation", low: "participation confirmation", items: items };
    }
    var a = r.req && r.req.nc;
    if (!a) return null;
    items.push({ t: "Sent from the college's or district's email domain", s: "form", d: (domainOf(a.attestor_email) || "The address") + ", checked by the form when it was sent." });
    items.push(a.attestor_title && a.attestor_title !== "Other"
      ? { t: "Sent by a senior administrator", s: "meets", d: "Title given: " + titleLabel(S.ncTitles, a.attestor_title) + "." }
      : { t: "Sent by a senior administrator", s: "check", d: "Title given: " + titleLabel(S.ncTitles, a.attestor_title) +
          (a.titleText ? ", written by the sender as " + a.titleText + ". Confirm that role is a senior administrator before you accept."
            : ". Confirm the sender's role before you accept.") });
    items.push({ t: "The award carries a noncredit share", s: "meets", d: "Yes." });
    items.push({ t: "A Noncredit CPL Lead named, with a title", s: "form", d: "Required by the form." });
    var ll = ownLanding(a.leadCtx);
    items.push(ll.length
      ? { t: "The Lead is published on the college's CPL landing page", s: "meets", d: "Listed as " + ll.map(function (l) { return l.title || "a contact"; }).join(" and ") + "." }
      : a.leadCtx
      ? { t: "The Lead is published on the college's CPL landing page", s: "fails", n: "the Noncredit CPL Lead is not yet published on the college's CPL landing page",
          d: "The landing page does not list the Lead by name." }
      : { t: "The Lead is published on the college's CPL landing page", s: "check", d: "Show the landing page here and match the Lead's name." });
    items.push({ t: "The Lead's assignment gives time for the work", s: "check", d: a.lead_assignment ? "Given: " + a.lead_assignment + "." : "Not given." });
    items.push({ t: "The Lead meets regularly with credit CPL colleagues", s: "check", d: a.lead_meets ? "Given: " + a.lead_meets + "." : "Not given." });
    return { kind: "Noncredit CPL Lead attestation" + (r.nc && r.nc.fy ? ", " + r.nc.fy : ""),
      low: "Noncredit CPL Lead attestation" + (r.nc && r.nc.fy ? ", " + r.nc.fy : ""),
      note: r.part.confirmed ? "" : "The college has not yet confirmed participation; the noncredit share also waits on that confirmation.",
      items: items };
  }
  /* THREE WORDS, NOT FOUR (asked in session, 2026-11-12: the review's tags were "not immediately clear to someone who
     isn't swimming in this water"). What the form checked and what the request already shows both read Met, since
     neither asks anything of the reviewer; they fold under one line, and the lines that need a decision lead. */
  var REQ_PILL = { form: ["", "Met"], meets: ["", "Met"], check: ["ask", "Check this"], fails: ["fail", "Not met"] };
  function reqDone(it) { return it.s === "form" || it.s === "meets"; }
  // The minimum condition a review settles, in the funding tab's own words, so the review and the conditions table agree.
  function settlesWords(r, kind) {
    if (kind === "nc") return "Accepting this meets the Noncredit CPL Lead condition, which holds the noncredit share of the award.";
    var c = r.conds.filter(function (x) { return x.kind === "part"; })[0];
    return "Accepting this meets the minimum condition" + (c && c.label ? ": " + c.label.replace(/[.\s]+$/, "") + "." : " for the participation confirmation.");
  }
  function gid(key, kind) { return key + "|" + kind; }
  function reviewState(r, kind) {
    var R = reviewItems(r, kind); if (!R) return null;
    var ch = state.checks[gid(r.key, kind)] || {}, open = 0, fails = 0;
    R.items.forEach(function (it, i) { if (it.s === "check" && !ch[i]) open++; if (it.s === "fails") fails++; });
    return { R: R, open: open, fails: fails };
  }
  function gateWords(g) {
    if (g.fails) return g.fails + " requirement" + (g.fails === 1 ? " is" : "s are") + " not met, so Accept stays shut. Deny with the reason, or Follow up and hold the request.";
    if (g.open) return g.open + " check" + (g.open === 1 ? "" : "s") + " left before Accept.";
    return "Every requirement is checked. Accept or Deny.";
  }
  function landingLink(r, words) {
    // The snapshot already passes an https address alone (httpsUrl in cpl_funding.js); checked again where it is drawn.
    return r.landing && /^https?:\/\//i.test(r.landing) ? '<a href="' + esc(r.landing) + '" target="_blank" rel="noopener" aria-label="' + esc(r.name) +
      ' CPL landing page (opens in a new tab)">' + esc(words || "CPL landing page") + "</a>" : "";
  }
  /* The landing page inside the panel (Sam, 2026-11-10: "links still opening to new tabs instead of sidebars"). MAP's
     landing pages answer with no X-Frame-Options or frame-ancestors (read 2026-11-10), so most draw here; a page whose
     site refuses another page's frame stays blank, and the line under it says so and keeps the new-tab link. An http
     address cannot draw inside this https page, so it keeps the link alone. */
  // Only an https address on another origin draws in the frame: an http one cannot inside this https page, and one on
  // this site's own origin could lift its own sandbox, since the address is data a college can edit (COBIx on PR 3066).
  function frameable(r) {
    if (!r.landing || !/^https:\/\//i.test(r.landing)) return false;
    try { return new URL(r.landing).origin !== window.location.origin; } catch (e) { return false; }
  }
  function landingFrame(r) {
    if (!r.landing || !/^https?:\/\//i.test(r.landing)) return '<p class="gate">No landing page address in MAP.</p>';
    if (!frameable(r)) return '<p class="gate">This address cannot show inside the panel. ' + landingLink(r, "Open it in a new tab") + "</p>";
    // Scripts and popups only: a college site needs scripts to draw, and a link out opens as an ordinary tab. No
    // forms and no top navigation, since the reviewer reads the page and matches a name.
    return '<div class="lpframe"><iframe src="' + esc(r.landing) + '" title="' + esc(r.name) + ' CPL landing page" loading="lazy" referrerpolicy="no-referrer"' +
      ' sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>' +
      '<p class="gate">If the page stays blank, the college\'s site does not let another page show it. ' + landingLink(r, "Open it in a new tab") + "</p>";
  }
  // Inside the review the page waits behind Show the landing page here, so a review opens without loading a college's
  // site. Its open state lasts the record, so a repaint (the contacts arriving, a note saved) draws it open again.
  function landingShow(r, kind) {
    if (!r.landing || !/^https?:\/\//i.test(r.landing)) return "";
    if (!frameable(r)) return '<p class="gate">' + landingLink(r, "Open the landing page in a new tab") + "</p>";
    var open = !!state.lpOpen[gid(r.key, kind)];
    return '<details class="lpshow" data-lpshow="' + esc(kind) + '"' + (open ? " open" : "") + "><summary>Show the landing page here</summary>" + (open ? landingFrame(r) : "") + "</details>";
  }
  function reviewHtml(r, kind) {
    var g = reviewState(r, kind);
    if (!g) return '<section class="review"><h4>Review before you decide</h4><p class="gate">Sign in as a reviewer to read who sent the request.</p></section>';
    var ch = state.checks[gid(r.key, kind)] || {}, pre = "rv-" + kind;
    // One page a review: on the first check that names the landing page, or at the head when none does.
    var lpAt = -1;
    for (var li = 0; li < g.R.items.length; li++) if (/landing page/i.test(g.R.items[li].t)) { lpAt = li; break; }
    return '<section class="review" aria-labelledby="' + pre + '-h"><h4 id="' + pre + '-h">Review before you decide: ' + esc(g.R.kind) + "</h4>" +
      (lpAt >= 0 ? "" : '<div>' + (landingShow(r, kind) || '<span class="gate">No landing page address in MAP.</span>') + "</div>") +
      // The role in MAP already meets the condition: the box stays reachable and says nothing is owed (COBIx on PR 3012).
      (kind === "nc" && r.nc && r.nc.lead ? '<p class="gate" data-role-met="1">The Noncredit CPL Lead role is on the college\'s MAP landing page, which already meets this condition. Nothing here needs a decision.</p>' : "") +
      (g.R.note ? '<p class="gate">' + esc(g.R.note) + "</p>" : "") +
      '<p class="gate" data-settles="' + kind + '">' + esc(settlesWords(r, kind)) + "</p>" +
      (function () {
        var line = function (it, i) {
          var pl = REQ_PILL[it.s], id = pre + "-ck-" + i;
          return '<li class="req"><span><span class="pill ' + pl[0] + '">' + pl[1] + "</span></span><span><b>" + esc(it.t) + '</b><span class="why">' + esc(it.d) +
            "</span>" + (i === lpAt ? landingShow(r, kind) : "") +
            // The role the reviewer confirmed, kept with the acceptance (Sam, 2026-11-10: "I meant for the reviewer to add").
            (it.s === "check" && /senior administrator/i.test(it.t) ? '<label class="rolefield" for="' + pre + '-role">Their role, as you confirmed it' +
              '<input id="' + pre + '-role" class="search" type="text" autocomplete="off" maxlength="120" data-role="' + kind + '" value="' +
              esc((state.roles || {})[gid(r.key, kind)] || "") + '"></label>' : "") +
            (it.s === "check" ? '<label class="ichk" for="' + id + '"><input id="' + id + '" type="checkbox" data-check="' + i + '" data-kind="' + kind + '"' +
              (ch[i] ? " checked" : "") + "> I checked this</label>" : "") + "</span></li>";
        };
        // Each line keeps its place in the list as its number (data-check), so a tick means the same line in either group.
        var need = [], done = [];
        g.R.items.forEach(function (it, i) { (reqDone(it) ? done : need).push(line(it, i)); });
        var fk = gid(r.key, kind), open = !!(state.doneOpen || {})[fk] || !need.length;
        return (need.length ? '<ul class="reqs" data-reqs="need">' + need.join("") + "</ul>" : "") +
          (done.length ? '<details class="reqdone" data-reqdone="' + esc(kind) + '"' + (open ? " open" : "") + "><summary>" + done.length +
            (done.length === 1 ? " requirement" : " requirements") + " already met, with nothing for you to check</summary>" +
            '<ul class="reqs" data-reqs="done">' + done.join("") + "</ul></details>" : "");
      })() +
      '<div class="verdict" data-verdict="' + kind + '" role="group" aria-label="Decide on the ' + esc(g.R.low) + '">' +
        '<button type="button" class="word lead" data-act="accept" data-kind="' + kind + '"' + (!g.open && !g.fails ? "" : " disabled") + ">Accept</button>" +
        '<button type="button" class="word danger" data-act="deny" data-kind="' + kind + '">Deny</button>' +
        '<button type="button" class="word" data-act="follow" data-kind="' + kind + '">Follow up</button>' +
        '<p class="gate" data-gate="' + kind + '" role="status">' + esc(gateWords(g)) + "</p>" +
        // Accept says what it does (Sam on the mock, 2026-11-09).
        '<p class="gate" data-does="' + kind + '">Accept marks the ' + esc(g.R.low) + " as met and opens the acceptance email for you to send. Nothing is sent until you send it.</p></div></section>";
  }

  // ── painting ─────────────────────────────────────────────────────────────
  /* The divider between the queue and the record. Its place is a layout choice, never a filter, so it lasts across
     visits like a column width (CLAUDE.md, "Tabs never remember a filter"); storage blocked, it lasts the page. */
  var SPLIT_KEY = "cplCsmSplit", SPLIT_MIN = 25, SPLIT_MAX = 70, SPLIT_DEFAULT = 42, SPLIT_STEP = 2, splitMem;
  function splitPct() {
    if (splitMem === undefined) { try { splitMem = parseInt(window.localStorage.getItem(SPLIT_KEY), 10) || null; } catch (e) { splitMem = null; } }
    return splitMem && splitMem >= SPLIT_MIN && splitMem <= SPLIT_MAX ? splitMem : SPLIT_DEFAULT;
  }
  function setSplit(p, keep) {
    p = p == null ? null : Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, Math.round(p)));
    splitMem = p;
    if (keep !== false) { try { if (p) window.localStorage.setItem(SPLIT_KEY, String(p)); else window.localStorage.removeItem(SPLIT_KEY); } catch (e) { /* storage blocked */ } }
    var c = document.getElementById("cw-center"), g = document.getElementById("cw-split");
    if (c) c.setAttribute("style", splitStyle());
    if (g) g.setAttribute("aria-valuenow", String(splitPct()));
  }
  function splitStyle() { var p = splitPct(); return "--cw-q:" + p + "fr; --cw-r:" + (100 - p) + "fr"; }
  function splitHtml() {
    return '<div class="split" id="cw-split" role="separator" tabindex="0" aria-orientation="vertical" aria-controls="cw-queue" ' +
      'aria-label="Resize the queue and the record. Left and Right arrows move it, Home puts it back." ' +
      'aria-valuemin="' + SPLIT_MIN + '" aria-valuemax="' + SPLIT_MAX + '" aria-valuenow="' + splitPct() + '"></div>';
  }
  function onSplitKey(e) {
    var t = e.target; if (!t || t.id !== "cw-split") return;
    if (e.key === "ArrowLeft") setSplit(splitPct() - SPLIT_STEP);
    else if (e.key === "ArrowRight") setSplit(splitPct() + SPLIT_STEP);
    else if (e.key === "Home") setSplit(null);
    else return;
    e.preventDefault();
  }
  function onSplitDown(e) {
    var t = e.target; if (!t || t.id !== "cw-split" || (e.button !== undefined && e.button !== 0)) return;
    var c = document.getElementById("cw-center"); if (!c) return;
    e.preventDefault();
    try { t.setPointerCapture(e.pointerId); } catch (err) { /* no capture: the document listeners carry the drag */ }
    // The two shares split what is left after the 12px divider and its two 4px gaps, so the pointer is measured
    // against that width: the divider stays under it (COBIx on PR 3013).
    var PAD = 20;
    function at(ev) { var r = c.getBoundingClientRect(), w = r.width - PAD; return w > 0 ? (ev.clientX - r.left - PAD / 2) / w * 100 : splitPct(); }
    // Only the pointer that started the drag moves or ends it, as the Commons Lists' panel grip does.
    function move(ev) { if (ev.pointerId === e.pointerId) setSplit(at(ev), false); }
    var ENDS = ["pointerup", "pointercancel", "lostpointercapture"];
    function up(ev) {
      if (ev && ev.pointerId !== undefined && ev.pointerId !== e.pointerId) return;
      document.removeEventListener("pointermove", move);
      ENDS.forEach(function (n) { document.removeEventListener(n, up); t.removeEventListener(n, up); });
      setSplit(ev && ev.clientX != null && ev.type === "pointerup" ? at(ev) : splitPct());
    }
    document.addEventListener("pointermove", move);
    ENDS.forEach(function (n) { document.addEventListener(n, up); t.addEventListener(n, up); });
  }
  function queueHtml() {
    var list = shownRows(), v = VIEWS[state.view] || VIEWS.open;
    // A decided college may leave the view (accepted, it moves on); its record stays until another is chosen.
    if (!state.sel && list.length) state.sel = list[0].key;
    var opts = GROUPS.map(function (g) {
      return '<optgroup label="' + g.label + '">' + Object.keys(VIEWS).filter(function (k) { return VIEWS[k].g === g.id; }).map(function (k) {
        // A count beside each label, so a CSM picks a queue without opening it (the walkthrough with Malone, 2026-11-09).
        return '<option value="' + k + '"' + (k === state.view ? " selected" : "") + ">" + esc(VIEWS[k].label) + " (" + S.rows.filter(VIEWS[k].keep).length + ")</option>";
      }).join("") + "</optgroup>";
    }).join("");
    return '<div class="pane" id="cw-queue" aria-labelledby="cw-q-h"><div class="pane-h">' +
      // The view's name follows the count in lower case, except a name that opens on an acronym (CPL, MAP keep theirs).
      '<p class="showing" id="cw-q-h"><b>' + list.length + "</b> " + esc(v.label.replace(/^[A-Z][a-z]+/, function (m) { return m.toLowerCase(); })) + "</p>" +
      '<label class="sr" for="cw-view">Show</label><select id="cw-view" class="search" data-view-select="1">' + opts + "</select>" +
      '<label class="sr" for="cw-q">Find a college</label><input id="cw-q" class="search" type="search" placeholder="Find a college or district" value="' + esc(state.q) + '">' +
      (v.bulk && S.reviewer ? '<div class="bulk"><button type="button" class="word" data-act="nudge">Nudge them (a mail merge)</button></div>' : "") +
      "</div>" + (list.length ? [["you", "Needs you", list.filter(needsYou)], ["col", "Waiting on the college", list.filter(function (r) { return !needsYou(r); })]]
        .filter(function (g) { return g[2].length; }).map(function (g) {
          // The live order stands inside each group (go-live note, item 5): sortRank, then the college's name.
          // An h2: the list's groups are the page's first sections under its title (a11y: h1 to h3 skipped a level
          // once Everything to do put Needs you on the signed-out view, 2026-11-12). The class carries the look.
          return '<h2 class="qgroup" id="cw-qg-' + g[0] + '">' + g[1] + ' <span class="qgroup-n">' + g[2].length + '</span></h2>' +
            '<ul class="queue" data-group="' + g[0] + '" aria-labelledby="cw-qg-' + g[0] + '">' + g[2].map(function (r) {
              var ag = ageOf(r);
              return '<li><button type="button" class="row" data-sel="' + esc(r.key) + '"' + (r.key === state.sel ? ' aria-current="true"' : "") + ">" +
                '<span class="row-name">' + esc(r.name) + '</span><span class="row-age' + (ag.over ? " over" : "") + '">' + esc(ag.t) + "</span>" +
                '<span class="row-next">' + esc(nextStep(r)) + '</span><span class="row-pills">' +
                pillsOf(r).map(function (p) { return '<span class="pill ' + p[0] + '">' + esc(p[1]) + "</span>"; }).join("") + "</span></button></li>";
            }).join("") + "</ul>";
        }).join("") : '<ul class="queue" aria-label="' + esc(v.label) + '"><li><p class="empty">Nothing here.</p></li></ul>') + "</div>";
  }
  function condLabel(c) { return c.pending ? "Pending" : c.met ? "Met" : "Not met"; }
  function recOf(r) {
    if (waitingKinds(r).length) return { reason: "Review the request first", why: nextStep(r) + " The acceptance is ready once it is accepted.", review: true };
    var t = recTpl(r), du = dueOf(r);
    if (t === "accept") return notReceived(r)
      ? { reason: "Resend the acceptance", why: "Confirmed " + shortDate(r.part.confirmedAt) + ". The first acceptance did not reach the college." }
      : { reason: "Send the acceptance", why: "The participation confirmation is accepted" + (r.part.confirmedAt ? " (" + shortDate(r.part.confirmedAt) + ")" : "") + ", and no acceptance has gone out." };
    if (t === "accept_nc") return { reason: "Send the noncredit attestation acceptance", why: "The team accepted the attestation, and no acceptance has gone out." };
    if (t === "both") return { reason: "Send one email asking for both", why: r.name + " has not sent a participation confirmation, and MAP shows no Noncredit CPL Lead for it. One email asks for both." };
    if (t === "nudge") return { reason: "Send the confirmation request", why: r.name + " has not sent a participation confirmation. This email asks for it." };
    if (t === "lead") return { reason: "Send the Noncredit CPL Lead ask", why: r.nc && r.nc.leadNear
      ? "The landing page lists a close title. The condition is met by the Noncredit CPL Lead role in MAP."
      : "MAP shows no Noncredit CPL Lead for the college. The role in MAP meets the condition." };
    if (du && du.follow_up_on <= today()) return { reason: "Follow up", why: nextStep(r) };
    // The line under the email says what to press; this one says why, so the two do not repeat each other.
    if (draftedOf(r)) return { reason: "Mark the email as sent", why: "The log shows the request copied or opened as a draft, with no Sent after it." };
    return { reason: "No email needed", why: nextStep(r) };
  }
  /* Which part of the side panel shows. A request waiting on the team opens the review by itself, since reviewing it is
     why the reviewer is on the record (Sam, 2026-11-10: "why do we click on Review when that's what we're there to do?
     shouldn't it just be open for review and action?"). "none" is the reviewer closing it; a pick lasts the record. */
  function sideOf(r) {
    if (state.side === "none") return "";
    if (state.side) return state.side;
    return S.reviewer && r && waitingKinds(r).length ? "review" : "";
  }
  function recordHtml() {
    var r = state.sel ? rowOf(state.sel) : null;
    if (!r) return '<div class="pane"><p class="empty">Choose a college to see its record.</p></div>';
    var w = waitingKinds(r), act = [];
    if (S.reviewer && r.part.confirmed && r.req && r.req.part && r.req.part.email) act.push('<button type="button" class="word" data-act="mail" data-kind="part">Email the confirmation acceptance again</button>');
    if (S.reviewer && r.nc && r.nc.standing && r.req && r.req.nc && r.req.nc.attestor_email) act.push('<button type="button" class="word" data-act="mail" data-kind="nc">Email the attestation acceptance again</button>');
    // Implementation Funding opens the drawer beside the record, never another tab (Sam, 2026-11-10: "links still
    // opening to new tabs instead of sidebars"); the drawer's Open the full page is the one way to the funding tab.
    act.push(fundWord("rec", "Implementation Funding"));
    if (S.reviewer) Object.keys(SENT).forEach(function (tpl) {
      if (lastSent(r, tpl)) act.push('<button type="button" class="word" data-act="bounced" data-kind="' + tpl + '">It bounced: ' +
        esc(SENT[tpl].replace(/ sent$/, "").toLowerCase()) + "</button>");
    });
    // The conditions in a table (the clarity mock): what the college owes, where it stands, and whether an email goes
    // out for it. Only the participation confirmation and the Noncredit CPL Lead are asked for by email; the rest is
    // status the college's own records move.
    var stWord = function (met, pending, waiting) {
      return waiting ? '<span class="st not">Waiting on the team</span>' : pending ? "Pending" : met ? '<span class="st met">Met</span>' : '<span class="st not">Not met</span>';
    };
    // Who acts next on each condition (asked in session, 2026-11-12): the Email column's "Status only" and "When not
    // met" read as code. Only the confirmation and the Noncredit CPL Lead are asked for by email; MAP moves the rest.
    var stepWord = function (met, pending, waiting, byMail) {
      return met ? "None" : waiting ? "The team reviews the request" : pending ? "None yet" : byMail ? "The team emails the college" : "The college updates MAP";
    };
    var rowOfCond = function (name, why, status, mail) {
      return '<tr><th scope="row">' + esc(name) + (why ? '<span class="why">' + esc(why) + "</span>" : "") + "</th><td>" + status + "</td><td>" + mail + "</td></tr>";
    };
    var conds = '<div class="wide"><table class="facts" aria-label="What the college owes"><colgroup><col style="width:50%"><col style="width:24%"><col style="width:26%"></colgroup>' +
      '<thead><tr><th scope="col">Condition</th><th scope="col">Status</th><th scope="col">Next step</th></tr></thead><tbody>' +
      r.conds.map(function (c) {
        var part = c.kind === "part", waitP = part && r.part.waiting;
        return rowOfCond(c.words, c.counts, stWord(c.met, c.pending, waitP), stepWord(c.met, c.pending, waitP, part));
      }).join("") +
      // The role on the college's MAP landing page (Sam, 2026-11-09) stands in for the whole attestation (2026-11-10), so
      // a college that holds it reads Met (COBIx, PR 3033).
      (r.nc ? rowOfCond("Noncredit CPL Lead", r.nc.lead ? "The role is on the college's MAP landing page, which stands in for the attestation."
          : r.nc.standing ? "Attested" + (r.nc.fy ? " for " + r.nc.fy : "") + "."
          : ncWaiting(r) ? "The attestation has waited since " + (shortDate(r.nc.at) || "it was sent") + "."
          : r.nc.leadNear ? "The MAP landing page lists a close title. Ask the college to use the Noncredit CPL Lead role." : "Not yet in MAP, and not yet attested.",
        stWord(ncMet(r), false, ncWaiting(r)), stepWord(ncMet(r), false, ncWaiting(r), true)) : "") +
      "</tbody></table></div>";
    var nc = "";
    // Recommended action (Malone, 2026-11-10): one reason, one sentence of why, and the one thing to do next.
    var rec = recOf(r);
    var side = sideOf(r);
    var visit = '<div class="visit"><h4>Recommended action</h4><p class="reason" id="cw-reason" tabindex="-1">' + esc(rec.reason) + '</p><p class="note">' + esc(rec.why) +
      (rec.review && side === "review" ? " The review is open below the record." : "") + "</p>" +
      '<p class="status" role="status" aria-live="polite">' + esc(state.msg) + "</p>" + composeHtml(r) + "</div>";
    var who = "";
    if (S.reviewer && r.req) {
      var bits = [];
      if (r.req.part) bits.push("Confirmation from " + esc(r.req.part.name || "?") + " (" + esc(titleLabel(S.partTitles, r.req.part.title)) + "), " + esc(r.req.part.email) +
        (r.req.part.at ? ", " + esc(shortDate(r.req.part.at)) : ""));
      if (r.req.nc) bits.push("Noncredit attestation from " + esc(r.req.nc.attestor_name || "?") + " (" + esc(titleLabel(S.ncTitles, r.req.nc.attestor_title)) + "), " +
        esc(r.req.nc.attestor_email || "") + (r.req.nc.requested_at ? ", " + esc(shortDate(r.req.nc.requested_at)) : ""));
      if (bits.length) who = '<div><p class="k">Who sent it</p><ul class="conds">' + bits.map(function (b) { return '<li class="ncline" style="margin:0">' + b + "</li>"; }).join("") + "</ul></div>";
    }
    var note = S.reviewer ? '<div><p class="k">CO Monitor\'s note</p><p class="ncline" style="margin:0">' + (r.note ? esc(r.note) : "No note yet.") +
      ' It is written on Implementation Funding\'s full page. ' + fundWord("note", "Implementation Funding") + "</p></div>" : "";
    // One side panel under the record (the clarity mock): People, CPL landing page, History, and the review when one waits.
    var sideWord = function (k, t) {
      return '<button type="button" class="word" data-side="' + k + '" aria-pressed="' + (side === k) + '" aria-controls="cw-side">' + t + "</button>";
    };
    var words = (S.reviewer && w.length ? sideWord("review", "Review") : "") + (S.reviewer ? sideWord("people", "People") : "") + sideWord("page", "CPL landing page") + (S.reviewer ? sideWord("log", "History") : "");
    var part = function (k, title, body) {
      if (!body) return "";   // a part with nothing in it (History for a reader who is not signed in) draws nothing, heading included
      // The review carries its own heading, so the part's is for the focus alone.
      return '<div class="sidepart" data-sidepart="' + k + '"' + (side === k ? "" : " hidden") + '><h4 class="side-h' + (k === "review" ? " sr" : "") + '" id="cw-side-' + k + '" tabindex="-1">' + title + "</h4>" + body + "</div>";
    };
    var c = S.reviewer && CT.state === "ready" ? contactsOf(r) : null;
    var peopleBody = !S.reviewer ? "" : who + (CT.state === "error" ? '<p class="gate">' + esc(CT.error) + "</p>" : !c ? '<p class="gate">Reading the contacts on file&hellip;</p>' :
      peopleToolsHtml(state.psrc || "") +
      '<div class="wide" role="region" aria-label="People at ' + esc(r.name) + '" tabindex="0"><table class="facts"><colgroup><col style="width:30%"><col style="width:46%"><col style="width:24%"></colgroup>' +
      '<thead><tr><th scope="col">Role</th><th scope="col">Person</th><th scope="col">Source</th></tr></thead><tbody>' +
      (c.people.some(function (p) { return !state.psrc || p.src === state.psrc; }) ? c.people.filter(function (p) { return !state.psrc || p.src === state.psrc; }).map(function (p) {
        return '<tr><th scope="row">' + esc(p.role || "No role given") + "</th><td>" + (p.name ? esc(p.name) : "Name not given") + (p.email ? '<span class="why">' + esc(p.email) + "</span>" : "") +
          "</td><td>" + esc(p.src) + "</td></tr>";
      }).join("") : '<tr><td colspan="3">' + (state.psrc ? "No one on file from this source." : "No one on file for this college.") + "</td></tr>") + "</tbody></table></div>" +
      contactsOnFileHtml(r));
    var onPage = c ? c.people.filter(function (p) { return p.src === "Landing page"; }) : [];
    var pageBody = (side === "page" ? landingFrame(r) : "") +
      (S.reviewer && r.landing ? (onPage.length ? '<p class="k">Who the page lists</p><ul class="conds">' + onPage.map(function (p) {
        return '<li class="ncline" style="margin:0">' + esc([p.role, p.name, p.email].filter(Boolean).join(", ")) + "</li>"; }).join("") + "</ul>"
        : '<p class="gate">' + (c ? "The page lists no one MAP has read." : CT.state === "error" ? esc(CT.error) : "Reading the contacts on file&hellip;") + "</p>") : "");
    var reviews = w.map(function (k) { return reviewHtml(r, k); }).join("");
    return '<div class="pane"><div class="rec">' +
      '<div class="rec-head"><div><h3 class="rec-name" id="cw-recname" tabindex="-1">' + esc(r.name) + '</h3><p class="rec-sub">' +
        esc([r.district, r.total ? "Max award " + money(r.total) + (r.floored ? " (Base)" : r.capped ? " (Cap)" : "") : ""].filter(Boolean).join(" · ")) + "</p></div></div>" +
      '<div><p class="k">Minimum conditions</p>' + conds + nc + "</div>" + visit +
      '<div class="decide" role="group" aria-label="More for this college">' + words + act.join("") + "</div>" +
      "</div></div>" +
      '<aside class="pane side" id="cw-side" aria-label="More for ' + esc(r.name) + '"' + (side && (side !== "review" || reviews) && (S.reviewer || side === "page" || side === "review") ? "" : " hidden") + ">" +
        part("review", "Review before you decide", reviews) + part("people", "People at " + esc(r.name), peopleBody) +
        part("page", "CPL landing page", pageBody) + part("log", "History", note + historyHtml(r)) + "</aside>";
  }
  function historyHtml(r) {
    if (!S.reviewer) return "";
    var d = state.draft[r.key] || {};
    var list = logFor(r.key);
    var opts = KINDS.map(function (k) { return '<option value="' + k[0] + '"' + ((d.kind || "note") === k[0] ? " selected" : "") + ">" + k[1] + "</option>"; }).join("");
    var form = '<form class="compose" data-logform="1" aria-labelledby="cw-log-h">' +
      '<div class="compose-row"><label for="cw-logkind">Kind <select id="cw-logkind" name="kind">' + opts + "</select></label>" +
      '<label for="cw-logdue">Follow up on <input id="cw-logdue" name="due" type="date" value="' + esc(d.due || "") + '"></label></div>' +
      '<label class="sr" for="cw-logbody">What was said or done</label>' +
      '<textarea id="cw-logbody" name="body" maxlength="4000" placeholder="What was said or done, and what comes next. The team\'s working notes: no student detail.">' +
        esc(d.body || "") + "</textarea>" +
      '<div class="compose-row"><button type="submit" class="word">Save to the log</button></div></form>';
    var items = LOG.error ? '<p class="gate">' + esc(LOG.error) + "</p>" : !LOG.loaded ? '<p class="gate">Reading the log&hellip;</p>' :
      list.length ? '<ul class="log">' + list.map(function (x) {
        var fu = x.follow_up_on ? (x.done_at ? "Followed up " + shortDate(x.done_at) + (x.done_by ? " by " + x.done_by : "")
          : "Follow up " + shortDate(x.follow_up_on)) : "";
        return '<li class="ev' + (x.kind === "follow_up" ? "" : "") + '"><span class="ev-when">' + esc(shortDate(x.created_at)) + "</span>" +
          '<span class="ev-what"><b>' + esc(kindWord(x.kind)) + "</b>" + (x.body ? "<p>" + esc(x.body) + "</p>" : "") +
          '<span class="ev-by">' + esc([x.by_email ? "by " + x.by_email : "", fu].filter(Boolean).join(" · ")) + "</span> " +
          (x.follow_up_on ? '<button type="button" class="word" data-logdone="' + x.id + '" data-on="' + (x.done_at ? "0" : "1") + '">' +
            (x.done_at ? "Reopen the follow-up" : "Mark the follow-up done") + "</button> " : "") +
          '<button type="button" class="word danger" data-logdel="' + x.id + '">Delete</button></span></li>';
      }).join("") + "</ul>" : '<p class="gate">Nothing logged with this college yet.</p>';
    return '<div><p class="sr" id="cw-log-h">Add to the history</p>' + form + items + "</div>";
  }
  // ── the contacts on file (Sam's asks 4, 6, 7, 8, 11, 12, 13 on the mock, 2026-11-02) ─────────────────────────────
  // Three sources, read once a visit for a signed-in reviewer: MAP's directory (map_college_contacts, the twelve role
  // fields), the college's CPL landing page (rpc/map_landing_contacts_roster, each person with any MAP role they hold)
  // and MAP's active users by role (map_college_users, paged). All three are reviewer-gated in the database; nothing
  // here reaches a reader who is not signed in. A name matches an institution as Nudge matches it (case, punctuation,
  // a leading "the" and MAP's Credit / Non-Credit suffixes fall away, and the short name counts).
  var DIR_FIELDS = [["primary_contact", "Primary CPL contact"], ["cpl_coordinator", "CPL Coordinator"],
    ["cpl_counselor", "CPL Counselor"], ["articulation_officer", "Articulation Officer"], ["faculty_lead", "Faculty Lead"],
    ["lead_initiator", "Lead Initiator"], ["senate_president", "Academic Senate President"],
    ["certifying_official", "Certifying Official"], ["vpaa", "VPAA"], ["vpss", "VPSS"], ["ceo", "CEO"],
    ["cpl_assistant", "CPL Assistant"]];
  var CT = { state: "idle", dir: [], landing: [], users: [], error: "", p: null };
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/&/g, " and ")
      .replace(/\b(non-?credit|credit)\s*$/, "").replace(/[^a-z0-9]+/g, " ").replace(/^the /, "").trim();
  }
  function shortOf(s) { return typeof window.cplCollegeShort === "function" ? window.cplCollegeShort(s, "short") : s; }
  function keysOf(s) { return [norm(s), norm(shortOf(s)), norm(String(s || "").replace(/\s+college$/i, ""))].filter(Boolean); }
  function rowsFor(r, rows) {
    var want = {};
    [r.key, r.name].forEach(function (a) { keysOf(a).forEach(function (k) { want[k] = 1; }); });
    return rows.filter(function (x) { return keysOf(x.college).some(function (k) { return want[k]; }); });
  }
  function splitList(v) {
    return String(v == null ? "" : v).split(/\s*[\n,;]+\s*/).map(function (t) { return t.replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }
  // A name holds a comma ("Rivera, Ana"), so names split on a new line or a semicolon alone; addresses on commas too.
  function namesIn(v) {
    return String(v == null ? "" : v).split(/\s*[\n;]+\s*/).map(function (t) { return t.replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }
  function emailsIn(v) { return splitList(v).filter(function (t) { return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(t); }); }
  function loadContacts() {
    if (CT.state === "ready" || CT.state === "loading") return CT.p || Promise.resolve(CT);
    var R = rest();
    if (!R || !S || !S.reviewer) return Promise.resolve(null);
    if (!R.remote) { CT.state = "ready"; CT.p = Promise.resolve(CT); return CT.p; }
    CT.state = "loading";
    var h = R.headers;
    var json = function (r, what) { if (!r.ok) throw new Error(what + " answered " + r.status); return r.json(); };
    var users = [];
    var page = function (from) {
      return fetch(R.url + "map_college_users?select=college,first_name,last_name,email,role_name&user_status=eq.Active&order=id.asc",
        { headers: Object.assign({ Range: from + "-" + (from + 999), "Range-Unit": "items" }, h) })
        .then(function (r) { return json(r, "map_college_users"); })
        .then(function (rows) { users = users.concat(rows || []); return rows && rows.length === 1000 ? page(from + 1000) : users; });
    };
    CT.p = Promise.all([
      fetch(R.url + "map_college_contacts?select=*", { headers: h }).then(function (r) { return json(r, "map_college_contacts"); }),
      fetch(R.url + "rpc/map_landing_contacts_roster", { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, h), body: "{}" })
        .then(function (r) { return json(r, "map_landing_contacts_roster"); }),
      page(0)
    ]).then(function (res) {
      CT.dir = res[0] || []; CT.landing = res[1] || []; CT.users = res[2] || []; CT.state = "ready"; CT.error = "";
      if (state.sel) paintRecord();
      return CT;
    }, function (e) {
      CT.state = "error"; CT.error = "The contacts could not be read (" + e.message + "). Reload to try again.";
      if (state.sel) paintRecord();
      return CT;
    });
    return CT.p;
  }
  // One institution's people, every source, one row each: { src, role, name, email }.
  function contactsOf(r) {
    var dir = rowsFor(r, CT.dir), land = rowsFor(r, CT.landing), users = rowsFor(r, CT.users), out = [];
    dir.forEach(function (d) {
      DIR_FIELDS.forEach(function (f) {
        var names = namesIn(d[f[0]]), mails = emailsIn(d[f[0] + "_email"]);
        if (!names.length && !mails.length) return;
        var n = Math.max(names.length, mails.length);
        for (var i = 0; i < n; i++) out.push({ src: "MAP directory", role: f[1], name: names[i] || "", email: mails[i] || "" });
      });
    });
    land.forEach(function (l) {
      var roles = (Array.isArray(l.map_users) ? l.map_users : []).map(function (u) { return u.role; }).filter(Boolean);
      out.push({ src: "Landing page", role: l.contact_title || "A contact", name: l.contact_name || "", email: emailsIn(l.contact_email)[0] || "",
        mapRoles: roles });
    });
    users.forEach(function (u) {
      out.push({ src: "MAP users", role: u.role_name || "User", name: [u.first_name, u.last_name].filter(Boolean).join(" "), email: emailsIn(u.email)[0] || "" });
    });
    return { dir: dir, land: land, users: users, people: out, landing: (dir[0] && dir[0].landing_page_url) || r.landing || "" };
  }
  // What disagrees between the sources, in a sentence each (ask 4).
  function mismatchesOf(r, c) {
    var out = [], landMail = {}, userMail = {};
    c.land.forEach(function (l) { emailsIn(l.contact_email).forEach(function (e) { landMail[e.toLowerCase()] = 1; }); });
    c.users.forEach(function (u) { emailsIn(u.email).forEach(function (e) { userMail[e.toLowerCase()] = 1; }); });
    var coord = c.people.filter(function (p) { return p.src === "MAP directory" && p.role === "CPL Coordinator"; });
    var landCoord = c.land.filter(function (l) { return /coordinator|liaison/i.test(l.contact_title || ""); });
    if (!coord.length && landCoord.length) out.push("The landing page lists a CPL Coordinator; MAP's directory has none.");
    coord.forEach(function (p) {
      if (p.email && !landMail[p.email.toLowerCase()]) out.push("The CPL Coordinator in MAP's directory (" + (p.name || p.email) + ") is not on the landing page.");
    });
    c.people.filter(function (p) { return p.src === "MAP directory" && p.role === "Primary CPL contact" && p.email; }).forEach(function (p) {
      if (!userMail[p.email.toLowerCase()]) out.push("The primary CPL contact (" + (p.name || p.email) + ") is not an active MAP user.");
    });
    if (!c.dir.length) out.push("MAP's directory holds no row for this college.");
    if (!c.land.length) out.push("The landing page lists no one.");
    return out;
  }

  // ── the contacts on file ──
  /* Contacts on file, inside the People panel (Sam, 2026-11-10: "links still opening to new tabs instead of
     sidebars"). What were two pop-ups, Contacts on file and Names, titles and emails, now sit in the panel: the one
     people list with its source filter and Copy the addresses shown, what the sources disagree on, and every field on
     file behind one fold. */
  function contactsOnFileHtml(r) {
    var c = contactsOf(r), mm = mismatchesOf(r, c);
    var dirByRole = {};
    c.people.forEach(function (p) { if (p.src === "MAP directory") (dirByRole[p.role] = dirByRole[p.role] || []).push(p); });
    var fields = '<ul class="fields">' + DIR_FIELDS.map(function (f) {
      var ps = dirByRole[f[1]] || [];
      return "<li><span>" + esc(f[1]) + "</span>" + (ps.length ? '<span class="on">' + esc(ps.map(function (p) {
        return [p.name, p.email].filter(Boolean).join(", "); }).join("; ")) + "</span>" : '<span class="off">Not on file</span>') + "</li>";
    }).join("") + "</ul>";
    var land = c.land.length ? '<ul class="card-list">' + c.land.map(function (l) {
      var roles = (Array.isArray(l.map_users) ? l.map_users : []).map(function (u) { return u.role; }).filter(Boolean);
      return "<li><span>" + esc(l.contact_title || "A contact") + ": " + esc(l.contact_name || "") + "</span><span>" +
        esc(roles.length ? "MAP " + roles.join(", ") : "Not a MAP user") + "</span></li>";
    }).join("") + "</ul>" : '<p class="tpl-meta">The landing page lists no one.</p>';
    var byRole = {};
    c.users.forEach(function (u) { var k = u.role_name || "User"; byRole[k] = (byRole[k] || 0) + 1; });
    var users = Object.keys(byRole).length ? '<p class="tags">' + Object.keys(byRole).sort().map(function (k) {
      return '<span class="pill">' + esc(k) + " " + byRole[k] + "</span>"; }).join("") + "</p>" : '<p class="tpl-meta">No active MAP users.</p>';
    return (mm.length ? '<p class="diff">' + mm.map(esc).join("<br>") + "</p>" : '<p class="tpl-meta">The three sources agree on the coordinator and the primary contact.</p>') +
      '<details class="onfile" data-onfile="1"' + (state.onfileOpen ? " open" : "") + "><summary>Every field on file</summary>" +
      '<section class="onfile-src"><h4>MAP directory</h4>' + fields + "</section>" +
      '<section class="onfile-src"><h4>Landing page</h4>' + land + "</section>" +
      '<section class="onfile-src"><h4>MAP users by role</h4>' + users + "</section></details>";
  }
  var SOURCES = ["MAP directory", "Landing page", "MAP users"];
  function peopleToolsHtml(only) {
    var opts = '<option value="">Every source</option>' + SOURCES.map(function (s) { return '<option' + (s === only ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("");
    return '<div class="ppl-tools"><label for="cw-psrc">Show</label><select id="cw-psrc" data-psrc="1">' + opts + "</select>" +
      '<button type="button" class="word" data-copyaddr="shown">Copy the addresses shown</button><span class="tpl-meta" role="status" data-copied="1"></span></div>';
  }
  function uniqueEmails(list) {
    var seen = {}, out = [];
    list.forEach(function (p) { var e = (p.email || "").toLowerCase(); if (e && !seen[e]) { seen[e] = 1; out.push(p.email); } });
    return out;
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return false; }); }
    catch (e) {}
    return Promise.resolve(false);
  }

  // ── the email: To, Cc, More Cc, Subject, the words, Copy the email (asks 5, 8, 11, 12, 13) ──
  // The workspace never sends: Copy the email puts the formatted email (the logo on its signature line) on the
  // clipboard for Outlook, Open in Outlook opens the mail program with To, Cc and Subject, and the log notes the copy.
  var EMAIL_LOGO_URL = "https://cpl-initiative.github.io/cpl-project-tracker/sierra/cpl-initiative-logo-navy.png";
  /* The logo travels as its own bytes (COBIx on issue 2967, 18:25Z): Outlook and Gmail often refuse to fetch an outside
     image on paste, so the copied HTML carries a data: URI of the small email copy, read once from this site when the
     email box first draws. Until it has loaded, or if it cannot, the copy falls back to the published address. */
  var EMAIL_LOGO_LOCAL = "sierra/cpl-initiative-logo-navy-email.png";
  var LOGO = { src: "", asked: false };
  function loadLogo() {
    if (LOGO.asked || typeof fetch !== "function" || typeof FileReader === "undefined") return;
    LOGO.asked = true;
    fetch(EMAIL_LOGO_LOCAL).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () { if (/^data:image\/png;base64,/.test(String(fr.result || ""))) LOGO.src = fr.result; };
      fr.readAsDataURL(b);
    }).catch(function () {});
  }
  function logoSrc() { return LOGO.src || EMAIL_LOGO_URL; }
  var EMAIL_LOGO_ALT = "California Community Colleges Credit for Prior Learning Initiative, at the Chancellor's Office";
  var PUBLIC_FUNDING_URL = "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/";
  var TEMPLATES = [
    { id: "accept", label: "The acceptance, with what still waits" },
    { id: "accept_nc", label: "The noncredit attestation acceptance" },
    { id: "follow", label: "Follow up on a condition" },
    { id: "nudge", label: "Nudge for the participation confirmation" },
    { id: "lead", label: "The Noncredit CPL Lead ask (the role in MAP)" },
    { id: "both", label: "Both asks in one email (the confirmation and the Noncredit CPL Lead)" },
    { id: "blank", label: "Blank" }];

  /* ── the email templates a reviewer can change (csm_templates, kb/migrations/2026-11-10_csm_templates.sql) ──
     Sam, 2026-11-10, reading the two new emails: "can you add a place for me or any reviewer to make changes to the
     templates for these and later make additional changes if needed?" The four emails this dashboard writes itself
     keep their wording here, with words in braces that fill in for each college. The newest saved version of a
     template is what every reviewer's next email starts from; a version with reset puts back the wording below. The
     two acceptances are the funding tab's own emails (acceptMail) and are changed there. */
  var TPL_DEFAULT = {
    follow: { subject: "CPL Implementation Funding: a follow-up for {college}",
      body: "Dear {name},\n\nThank you for your work on CPL Implementation Funding at {college}. In reviewing the college's record, the CPL Initiative team " +
        "noticed the following:\n\n{open_items}\n\nWe would welcome a reply when this is in place, or a note if we have misread it.\n\nThe CPL Initiative team" },
    nudge: { subject: "CPL Implementation Funding: a participation confirmation for {college}",
      body: "Dear {name},\n\nThe CPL Initiative team is writing about CPL Implementation Funding for {college}. Our records do not yet show a participation " +
        "confirmation, one of the minimum conditions an institution meets to qualify for its award. {deadline}\n\nThe CPL Implementation Funding page " +
        "explains each condition and how to send it: {funding_page}\n\nIf it is already on its way, or if someone else at {college} should receive this " +
        "note, a short reply will let us update our records.\n\nThe CPL Initiative team" },
    // Drafted S624 for Sam's edit (go-live note, decision 4). The facts: the exact MAP title Noncredit CPL Lead meets
    // the condition (his ruling, 2026-11-10, PR 3031), and an attestation on the funding page is accepted as well.
    lead: { subject: "CPL Implementation Funding: the Noncredit CPL Lead role in MAP for {college}",
      body: "Dear {name},\n\nThe CPL Initiative team is writing about the noncredit share of CPL Implementation Funding for {college}. MAP does not yet show " +
        "a Noncredit CPL Lead for {college}. The condition is met when the college's lead holds the Noncredit CPL Lead role in MAP, under that exact title. " +
        "{close_title} A Noncredit CPL Lead attestation on the CPL Implementation Funding page is accepted as well.\n\nThe CPL Implementation Funding page " +
        "explains the condition: {funding_page}\n\nIf it is already on its way, or if someone else at {college} should receive this note, a short reply " +
        "will let us update our records.\n\nThe CPL Initiative team" },
    both: { subject: "CPL Implementation Funding: two steps for {college}",
      body: "Dear {name},\n\nThe CPL Initiative team is writing about CPL Implementation Funding for {college}. Two steps remain.\n\nFirst, our records do " +
        "not yet show a participation confirmation, one of the minimum conditions an institution meets to qualify for its award. {deadline}\n\nSecond, " +
        "for the noncredit share: MAP does not yet show a Noncredit CPL Lead for {college}. The condition is met when the college's lead holds the " +
        "Noncredit CPL Lead role in MAP, under that exact title. {close_title} A Noncredit CPL Lead attestation on the CPL Implementation Funding page is " +
        "accepted as well.\n\nThe CPL Implementation Funding page explains each condition and how to send it: {funding_page}\n\nIf either is already on " +
        "its way, or if someone else at {college} should receive this note, a short reply will let us update our records.\n\nThe CPL Initiative team" }
  };
  /* EVERY EMAIL THE PAGE WRITES IS HERE (asked in session, 2026-11-12: the editor held four and the page wrote more).
     The acceptance (one wording for the participation confirmation and the noncredit attestation, {request} naming
     which) and the follow-up on a request under review are the funding tab's emails; their saved versions live in
     the same store, and the funding tab writes from them too (setTemplates). Blank has no wording to keep. */
  var TPL_EDITABLE = ["lead", "both", "nudge", "accept", "request_follow", "follow"];
  var TPL_FUND = { accept: 1, request_follow: 1 };
  var TPL_EDIT_LABEL = { nudge: "Request for the participation confirmation", both: "Request for the confirmation and the Noncredit CPL Lead, in one email",
    lead: "Request for the Noncredit CPL Lead role in MAP", accept: "Acceptance (participation confirmation or noncredit attestation)",
    request_follow: "Follow-up on a request under review", follow: "Follow-up on a condition still open" };
  var TPL_FUND_WORDS = [
    ["name", "the person the email is to"], ["college", "the college's name"],
    ["request", "participation confirmation, or noncredit attestation with its year"],
    ["date", "the day the college sent the request"],
    ["note", "the CO Monitor's note, for you to rewrite for the college (follow-up only)"]];
  function tplWordsOf(id) { return TPL_FUND[id] ? TPL_FUND_WORDS : TPL_WORDS; }
  // The wording with nothing saved. The funding tab's two arrive as "Subject: ...", a blank line, then the message.
  function tplDefault(id) {
    if (TPL_DEFAULT[id]) return TPL_DEFAULT[id];
    var d = F() && typeof F().templateDefaults === "function" ? F().templateDefaults() : null, t = String((d && d[id]) || "");
    var m = /^subject:\s*(.*)\n+([\s\S]*)$/i.exec(t);
    return m ? { subject: m[1].trim(), body: m[2].replace(/\s+$/, "") } : { subject: "", body: t };
  }
  // Hand the saved wording of the funding tab's two emails back to it, so its own Accept and Follow up write the same.
  function tplPush() {
    var f = F(); if (!f || typeof f.setTemplates !== "function" || !TPLS.loaded) return;
    var out = {};
    Object.keys(TPL_FUND).forEach(function (id) {
      var last = tplRows(id)[0];
      out[id] = last && !last.reset ? "Subject: " + last.subject + "\n\n" + last.body : null;
    });
    f.setTemplates(out);
  }
  var TPL_WORDS = [
    ["name", "the person the email is to"], ["college", "the college's name"],
    ["deadline", "the sentence naming the confirmation deadline, or nothing when none is set"],
    ["funding_page", "the public CPL Implementation Funding page"],
    ["close_title", "a sentence when the landing page lists a title close to Noncredit CPL Lead, or nothing"],
    ["open_items", "the CO Monitor's note, or the conditions still open (follow-up)"]];
  var TPLS = { rows: [], loaded: false, error: "", seq: 0, asked: false, busy: false };
  function tplLabel(id) { if (TPL_EDIT_LABEL[id]) return TPL_EDIT_LABEL[id]; for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i].label; return id; }
  function tplRows(id) { return TPLS.rows.filter(function (x) { return x.template_id === id; }); }
  // The wording in force: the newest saved version, unless it is a reset or none was saved.
  function tplOf(id) {
    var last = tplRows(id)[0];
    var d = tplDefault(id);
    return last && !last.reset ? { subject: last.subject, body: last.body, row: last } : { subject: d.subject, body: d.body, row: last || null };
  }
  function tplUnknown(text, id) {
    var known = {}, bad = [];
    tplWordsOf(id).forEach(function (w) { known[w[0]] = 1; });
    String(text || "").replace(/\{([^{}\s]{1,40})\}/g, function (m, k) { if (!known[k] && bad.indexOf(m) < 0) bad.push(m); return m; });
    return bad;
  }
  // Fill the braces. A word with nothing to say (no deadline set, no close title) goes with the one space before it, so
  // the sentence around it reads whole; nothing else in the message is touched, the CO Monitor's note included (COBIx
  // on PR 3068).
  function tplFill(text, vars) {
    var has = function (k) { return Object.prototype.hasOwnProperty.call(vars, k); };
    return String(text || "")
      .replace(/[ \t]?\{([a-z_]{1,40})\}/g, function (m, k) { return has(k) && String(vars[k]) === "" ? "" : m; })
      .replace(/\{([a-z_]{1,40})\}/g, function (m, k) { return has(k) ? String(vars[k]) : m; });
  }
  function tplVars(r, name, missing) {
    return { name: name, college: r.name, funding_page: PUBLIC_FUNDING_URL,
      deadline: S && S.deadline ? "The deadline is " + longDay(S.deadline) + "." : "",
      close_title: r.nc && r.nc.leadNear ? "The college's CPL landing page in MAP lists a close title; the condition asks for the exact one, Noncredit CPL Lead." : "",
      open_items: r.note || (missing.length ? missing.join("\n") : "Write what the college can do here.") };
  }
  function tplRender(id, r, name, missing) {
    var t = tplOf(id), v = tplVars(r, name, missing);
    return { subject: tplFill(t.subject, v), body: tplFill(t.body, v) };
  }
  function loadTemplates() {
    var R = rest();
    if (!R || !S || !S.reviewer) return;
    TPLS.asked = true;
    if (!R.remote) { TPLS.loaded = true; return; }
    tplFetch(R)
      .then(function (rows) { TPLS.rows = rows || []; TPLS.loaded = true; TPLS.error = ""; paint(); })
      .catch(function (e) { TPLS.loaded = true; TPLS.error = "The saved templates could not be read (" + e.message + "). Emails use the wording the dashboard ships with."; paint(); });
  }
  // One saved version. Without a remote (tests, NO_REMOTE) the store changes here.
  function tplWrite(row) {
    var R = rest();
    if (!R) return Promise.resolve(false);
    var full = Object.assign({ activity: ACTIVITY, subject: null, body: null, reset: false }, row);
    if (!R.remote) {
      TPLS.rows.unshift(Object.assign({ id: ++TPLS.seq, by_email: R.who, created_at: new Date().toISOString() }, full));
      return Promise.resolve(true);
    }
    return fetch(R.url + "csm_templates", { method: "POST", headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, R.headers),
      body: JSON.stringify(full) })
      .then(function (x) { if (!x.ok) throw new Error(String(x.status)); return true; })
      .catch(function (e) { TPLS.error = "The template did not save (" + e.message + "). Your words are still in the box."; return false; })
      .then(function (ok) { if (ok) TPLS.error = ""; return ok; });
  }
  // Re-read the saved versions and wait for them (remote only); without a remote the store is already current.
  function tplFresh() {
    var R = rest();
    if (!R || !R.remote) return Promise.resolve();
    return tplFetch(R).then(function (rows) { TPLS.rows = rows || []; TPLS.loaded = true; }).catch(function () {});
  }
  function tplFetch(R) {
    return fetch(R.url + "csm_templates?select=*&activity=eq." + ACTIVITY + "&order=created_at.desc,id.desc&limit=500", { headers: R.headers })
      .then(function (x) { if (!x.ok) throw new Error(String(x.status)); return x.json(); });
  }
  function tplWord() {
    return S && S.reviewer ? '<button type="button" class="word quiet" data-tplopen="1" aria-expanded="' + !!state.tplOpen + '" aria-controls="cw-tpls">Email templates</button>' : "";
  }
  function tplHtml() {
    if (!S || !S.reviewer || !state.tplOpen) return "";
    var id = TPL_EDITABLE.indexOf(state.tplId) >= 0 ? state.tplId : TPL_EDITABLE[0];
    var t = tplOf(id), d = (state.tplDraft || {})[id], subj = d ? d.subject : t.subject, body = d ? d.body : t.body;
    var rows = tplRows(id), r = state.sel ? rowOf(state.sel) : null;
    var meta = t.row && !t.row.reset ? "Saved by " + (t.row.by_email || "a reviewer") + ", " + shortDate(t.row.created_at) + "."
      : t.row ? "Put back to the shipped wording by " + (t.row.by_email || "a reviewer") + ", " + shortDate(t.row.created_at) + "." : "The wording the dashboard ships with.";
    var prev = r ? (function () {
      var v = TPL_FUND[id] ? { name: "the person who sent it", college: r.name, request: "participation confirmation",
        date: longDay(r.part.at || new Date().toISOString()), note: r.note || "Write what the college can do here." } : tplVars(r, "the person on file", []);
      return '<details class="tplprev"><summary>Preview for ' + esc(r.name) + "</summary><p class=\"k\">Subject</p><p>" + esc(tplFill(subj, v)) +
        '</p><p class="k">Message</p><pre class="tplpre">' + esc(tplFill(body, v)) + "</pre></details>";
    })() : "";
    return '<section class="sec pane tplpane" id="cw-tpls" aria-labelledby="cw-tpls-h"><div class="sec-h"><h2 id="cw-tpls-h">Email templates</h2>' +
      '<p class="note">Every email this page writes is here, ' + TPL_EDITABLE.length + ' in all. Saved changes reach every reviewer. The next email opened from a template starts from its saved wording; an email already open keeps its words.</p></div>' +
      '<form class="compose tplform" data-tplform="1" aria-labelledby="cw-tpls-h">' +
        '<div class="compose-row"><label for="cw-tpls-id">Template <select id="cw-tpls-id" data-tplpick="1">' + TPL_EDITABLE.map(function (k) {
          return '<option value="' + k + '"' + (k === id ? " selected" : "") + ">" + esc(tplLabel(k)) + "</option>"; }).join("") + "</select></label></div>" +
        '<p class="tpl-meta">' + esc(meta) + (d ? " You have unsaved changes." : "") + "</p>" +
        '<label for="cw-tpls-subj">Subject</label><input id="cw-tpls-subj" class="search" name="subject" type="text" maxlength="300" data-tpledit="subject" value="' + esc(subj) + '">' +
        '<label for="cw-tpls-body">Message</label><textarea id="cw-tpls-body" name="body" rows="16" maxlength="8000" data-tpledit="body">' + esc(body) + "</textarea>" +
        '<p class="tpl-meta">Words in braces fill in for each college: ' + tplWordsOf(id).map(function (w) { return "{" + w[0] + "} " + esc(w[1]); }).join("; ") + "." +
          (TPL_FUND[id] ? " Implementation Funding writes this email from the same saved wording." : "") + "</p>" +
        '<p class="links"><button type="submit" class="word lead"' + (TPLS.busy ? " disabled" : "") + ">Save for every reviewer</button>" +
          (d ? '<button type="button" class="word" data-tpldiscard="1">Discard my changes</button>' : "") +
          (t.row && !t.row.reset ? '<button type="button" class="word" data-tplreset="1">Put back the shipped wording</button>' : "") + "</p>" +
        '<p class="status" role="status" aria-live="polite" id="cw-tpls-said">' + esc(TPLS.error || state.tplMsg || "") + "</p></form>" + prev +
      (rows.length ? '<details class="tplhist"><summary>Earlier versions (' + rows.length + ")</summary><ul class=\"conds\">" + rows.map(function (x) {
        return '<li class="ncline" style="margin:0">' + esc(shortDate(x.created_at)) + ", " + esc(x.by_email || "a reviewer") + ": " +
          (x.reset ? "put back the shipped wording" : esc(x.subject)) +
          (x.reset ? "" : ' <button type="button" class="word" data-tpluse="' + esc(x.id) + '">Load this version</button>') + "</li>";
      }).join("") + "</ul></details>" : "") + "</section>";
  }
  function firstOf(c, role) { var p = c.people.filter(function (x) { return x.src === "MAP directory" && x.role === role && x.email; })[0]; return p || null; }
  // Sam's order for the one person a nudge goes to (Nudge's cascade): CPL Coordinator, primary contact, Lead Initiator, VPAA, CEO.
  function primaryOf(c) {
    var order = ["CPL Coordinator", "Primary CPL contact", "Lead Initiator", "VPAA", "CEO"];
    for (var i = 0; i < order.length; i++) { var p = firstOf(c, order[i]); if (p) return p; }
    return null;
  }
  function personWord(n) {
    var s = String(n || ""), i = s.indexOf(",");
    if (i >= 0) s = s.slice(i + 1) + " " + s.slice(0, i);
    var w = s.replace(/\([^)]*\)/g, " ").split(/\s+/).filter(function (t) { return t.replace(/\./g, "").length > 1; });
    return w.length >= 2 ? w[0] + " " + w[w.length - 1] : w.join(" ") || "colleague";
  }
  function seedMail(r, tplId) {
    var c = contactsOf(r), req = r.req && (r.req.part || null), nreq = r.req && r.req.nc;
    var to = null, toName = "", cc = [];
    var coord = firstOf(c, "CPL Coordinator"), vpaa = firstOf(c, "VPAA"), prim = primaryOf(c);
    if (tplId === "follow" && (req || nreq)) {
      to = req ? req.email : nreq.attestor_email; toName = req ? req.name : nreq.attestor_name;
      if (coord && coord.email.toLowerCase() !== String(to).toLowerCase()) cc.push(coord.email);
    } else if (prim) {
      to = prim.email; toName = prim.name;
      if ((tplId === "nudge" || tplId === "both") && vpaa && vpaa.email.toLowerCase() !== prim.email.toLowerCase()) cc.push(vpaa.email);
      if (tplId === "lead" && coord && coord.email.toLowerCase() !== prim.email.toLowerCase()) cc.push(coord.email);
      if (tplId === "follow" && coord && coord.email.toLowerCase() !== prim.email.toLowerCase()) cc.push(coord.email);
    }
    var name = personWord(toName), college = r.name, missing = missingWords(r);
    var subject = "", body = "";
    var am = tplId === "accept" && F() && typeof F().acceptMail === "function" ? F().acceptMail("part", r.key, prim ? { name: prim.name, email: prim.email } : null) : null;
    if (tplId === "accept" && am) {
      to = am.to || to; subject = am.subject; body = am.text;
      cc = coord && coord.email.toLowerCase() !== String(to).toLowerCase() ? [coord.email] : [];
      if (missing.length) body = body.replace(/\n*$/, "") + "\n\n" + (missing.length === 1 ? "One minimum condition still waits: " + missing[0] + "."
        : "These minimum conditions still wait: " + missing.join("; ") + ".") + " The CPL Implementation Funding page explains each one: " + PUBLIC_FUNDING_URL;
    } else if (tplId === "accept") {
      tplId = "follow";
    }
    var an = tplId === "accept_nc" && F() && typeof F().acceptMail === "function" ? F().acceptMail("nc", r.key, prim ? { name: prim.name, email: prim.email } : null) : null;
    if (tplId === "accept_nc" && an) {
      to = an.to || to; subject = an.subject; body = an.text;
      cc = coord && coord.email.toLowerCase() !== String(to).toLowerCase() ? [coord.email] : [];
    } else if (tplId === "accept_nc") {
      tplId = "follow";
    }
    if (TPL_DEFAULT[tplId]) {
      var made = tplRender(tplId, r, name, missing);
      subject = made.subject; body = made.body;
    } else if (!body) {
      // Blank alone. An acceptance arrives above with its words from the funding tab; this branch used to run for it
      // too and wrote the empty letter over them (Malone's screen, 2026-11-12, Napa: "Dear ..., The CPL Initiative
      // team" with nothing between, under a subject that was right).
      body = "Dear " + name + ",\n\n\n\nThe CPL Initiative team";
    }
    return { tpl: tplId, to: to || "", cc: cc.join(", "), more: [], subject: subject, body: body };
  }
  var LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDay(v) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? LONG[+m[2] - 1] + " " + +m[3] + ", " + m[1] : String(v || ""); }
  function mailKey(r) { return recTpl(r) ? r.key + "|send" : r.key; }
  function mailOf(r) {
    state.mail = state.mail || {};
    // The email is the one the college's state calls for (recTpl), in every list, kept under its own key so a draft
    // written with nothing due is untouched. With nothing due: the nudge before a confirmation, a follow-up after.
    var rt = recTpl(r), k = mailKey(r);
    if (!state.mail[k]) state.mail[k] = seedMail(r, rt || (r.part.confirmed || r.part.waiting ? "follow" : "nudge"));
    return state.mail[k];
  }
  function ccPickerHtml(r, m) {
    var c = contactsOf(r), picked = {};
    m.more.forEach(function (e) { picked[e.toLowerCase()] = 1; });
    var groups = SOURCES.map(function (src) {
      var seen = {}, rows = c.people.filter(function (p) {
        if (p.src !== src || !p.email) return false;
        var k = p.email.toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true;
      });
      if (!rows.length) return "";
      return '<fieldset><legend>' + esc(src) + '</legend><div class="ccpick-list">' + rows.map(function (p, i) {
        var id = "cw-cc-" + src.replace(/\W+/g, "") + "-" + i;
        return '<label class="ccopt" for="' + id + '" data-hay="' + esc((p.name + " " + p.role + " " + p.email).toLowerCase()) + '">' +
          '<input type="checkbox" id="' + id + '" data-ccpick="' + esc(p.email) + '"' + (picked[p.email.toLowerCase()] ? " checked" : "") + ">" +
          '<span><span class="tt">' + esc(p.name || p.email) + "</span>, " + esc(p.role) + '<br><span class="nm">' + esc(p.email) + "</span></span></label>";
      }).join("") + "</div></fieldset>";
    }).join("");
    return '<details class="ccpick"' + (state.ccOpen ? " open" : "") + '><summary><span class="word">Add people to Cc</span><span class="tpl-meta">' +
      (m.more.length ? m.more.length + " added" : "from the contacts on file") + "</span></summary>" +
      '<div class="ccpick-in"><label class="sr" for="cw-ccfind">Find a name or title</label>' +
      '<input type="search" id="cw-ccfind" placeholder="Find a name or title">' +
      (groups || '<p class="tpl-meta">No one on file has an address.</p>') + "</div></details>";
  }
  function composeHtml(r) {
    if (!S.reviewer) return "";
    if (CT.state === "error") return '<div><p class="k">Write an email</p><p class="gate">' + esc(CT.error) + "</p></div>";
    if (CT.state !== "ready") return '<div><p class="k">Write an email</p><p class="gate">Reading the contacts on file&hellip;</p></div>';
    var m = mailOf(r);
    loadLogo();
    var opts = TEMPLATES.filter(function (t) { return LEAD_MAIL_ON || (t.id !== "lead" && t.id !== "both"); })
      .map(function (t) { return '<option value="' + t.id + '"' + (t.id === m.tpl ? " selected" : "") + ">" + esc(t.label) + "</option>"; }).join("");
    // The preview first (Malone, 2026-11-10: recipient, subject and message apart, with Edit email). Edit email opens
    // the fields the composer always had; they stay in the page either way, so a draft is never lost to a fold. With no
    // email due the block folds to one word, Write an email.
    var due = !!recTpl(r), edit = !!(state.mailEdit || {})[r.key], open = due || edit, cc = allCc(m);
    // Sent is offered for the email that is due and no other (COBIx on PR 3050): a template switched by hand never
    // writes a receipt that would keep the real one from queueing.
    var sentBtn = due && m.tpl === recTpl(r);
    var dr = due ? null : draftedOf(r);
    return '<div class="tpl" aria-labelledby="cw-mail-h"><div class="mail-h"><p class="k" id="cw-mail-h">' + (open ? "Email preview" : "Email") + "</p>" +
      '<button type="button" class="word" data-act="mailedit" aria-expanded="' + edit + '" aria-controls="cw-mail-edit">' +
        (edit ? "Done editing" : due ? "Edit email" : "Write an email") + "</button></div>" +
      (dr ? '<p class="gate" data-drafted="' + dr.tpl + '">' + esc(draftedWords(dr)) + ' <button type="button" class="word lead" data-mailact="sent">Sent</button></p>' : "") +
      '<dl class="mail-f" id="cw-mail-pre"' + (open && !edit ? "" : " hidden") + "><dt>To</dt><dd>" + (m.to ? esc(m.to) : "No address on file. Edit email to add one.") + "</dd>" +
        (cc.length ? "<dt>Cc</dt><dd>" + esc(cc.join(", ")) + "</dd>" : "") +
        "<dt>Subject</dt><dd>" + esc(m.subject) + "</dd><dt>Message</dt><dd>" + esc(m.body) + "</dd></dl>" +
      '<div class="tpl-edit" id="cw-mail-edit"' + (edit ? "" : " hidden") + ">" +
      '<div class="tpl-row"><label for="cw-tpl">Template</label><select id="cw-tpl" data-mail="tpl">' + opts + "</select></div>" +
      '<dl class="addr"><dt><label for="cw-to">To</label></dt><dd><input id="cw-to" data-mail="to" value="' + esc(m.to) + '"></dd>' +
        '<dt><label for="cw-cc">Cc</label></dt><dd><input id="cw-cc" data-mail="cc" value="' + esc(m.cc) + '"></dd>' +
        '<dt><label for="cw-more">More Cc</label></dt><dd><input id="cw-more" data-mail="more" value="' + esc(m.more.join(", ")) + '"></dd>' +
        '<dt><label for="cw-subj">Subject</label></dt><dd><input id="cw-subj" data-mail="subject" value="' + esc(m.subject) + '"></dd></dl>' +
      ccPickerHtml(r, m) +
      '<label class="sr" for="cw-body">The email</label><textarea id="cw-body" class="search" data-mail="body" rows="10" style="min-height:180px;">' + esc(m.body) + "</textarea>" +
      '<label for="cw-mailfu"><input type="checkbox" id="cw-mailfu" data-mail="fu"' + (m.fu === false ? "" : " checked") + "> Follow up in a week</label></div>" +
      '<div class="tpl-row"' + (open ? "" : " hidden") + '><button type="button" class="word lead" data-mailact="copy">Copy the email</button>' +
        '<button type="button" class="word" data-mailact="draft">Open in Outlook</button>' +
        '<button type="button" class="word" data-mailact="gmail">Open in Gmail</button>' +
        (sentBtn ? '<button type="button" class="word" data-mailact="sent">Sent</button>' : "") + "</div>" +
      '<p class="tpl-meta"' + (open ? "" : " hidden") + ">Send from your own address. The shared MAP mailbox needs Send As rights from RCCD IT.</p>" +
      '<p class="tpl-meta"' + (open ? "" : " hidden") + ">The workspace never sends mail. Copy the email puts it on the clipboard, logo included, to paste into Outlook or Gmail; Open in Outlook and Open in Gmail start a draft with the words and no logo. The log notes each, with a follow-up a week out unless Edit email clears it." +
      (sentBtn ? " A copy or a draft is not yet a sent email: once it has gone out, come back and press Sent. Sent records that you sent it, and the college leaves the emails to send." : "") + "</p></div>";
  }
  function allCc(m) {
    var seen = {}, out = [];
    splitList(m.cc).concat(m.more).forEach(function (e) { var k = e.toLowerCase(); if (e && !seen[k]) { seen[k] = 1; out.push(e); } });
    return out;
  }
  function mailHtml(m) {
    var link = function (h) { return h.replace(/https?:\/\/[^\s<>"]+[^\s<>".,;:)]/g, function (u) { return '<a href="' + u + '">' + u + "</a>"; }); };
    return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">' +
      String(m.body || "").split(/\n\n/).map(function (p) { return '<p style="margin:0 0 12px;">' + link(esc(p)).replace(/\n/g, "<br>") + "</p>"; }).join("") +
      '<p style="margin:4px 0 0;"><img src="' + logoSrc() + '" alt="' + esc(EMAIL_LOGO_ALT) + '" width="200" height="37" style="display:block;border:0;width:200px;height:37px;"></p></div>';
  }
  function copyMail(m) {
    try {
      if (window.ClipboardItem && navigator.clipboard && typeof navigator.clipboard.write === "function") {
        return navigator.clipboard.write([new window.ClipboardItem({ "text/html": new Blob([mailHtml(m)], { type: "text/html" }),
          "text/plain": new Blob([m.body || ""], { type: "text/plain" }) })]).then(function () { return true; }, function () { return copyText(m.body || ""); });
      }
    } catch (e) {}
    return copyText(m.body || "");
  }
  var MAILTO_MAX = 1900;
  function mailAct(kind) {
    var r = rowOf(state.sel); if (!r) return;
    // A request copied or drafted earlier: Sent files its receipt with the subject and the address the copy carried.
    var dr = kind === "sent" ? draftedOf(r) : null;
    if (dr) {
      var rk = dr.tpl === "both" ? "nudge" : dr.tpl;
      logWrite("POST", null, { college: r.key, kind: "email", body: SENT[rk] + ": " + dr.rest }).then(function (ok) {
        if (!ok) return;
        state.sent = state.sent || {}; state.sent[r.key + "|" + dr.tpl] = true;
        paint();
        say(SENT[rk] + " for " + r.name + ", noted in the log.");
      });
      return;
    }
    var m = mailOf(r), cc = allCc(m);
    if (!m.to) { say("Give the email an address in To first."); var t = document.getElementById("cw-to"); if (t) t.focus(); return; }
    var logIt = function (what) {
      logWrite("POST", null, Object.assign({ college: r.key, kind: "email",
        body: what + ": " + (m.subject || "(no subject)") + ", to " + m.to + (cc.length ? " with " + cc.length + " on Cc" : "") + "." },
        m.fu === false ? {} : { follow_up_on: plusDays(7) }));
    };
    if (kind === "sent") {
      var what = m.tpl === "both" ? SENT.nudge : SENT[m.tpl] || "Email sent";
      logWrite("POST", null, Object.assign({ college: r.key, kind: "email",
        body: what + ": " + (m.subject || "(no subject)") + ", to " + m.to + (cc.length ? " with " + cc.length + " on Cc" : "") + "." },
        m.fu === false ? {} : { follow_up_on: plusDays(7) })).then(function (ok) {
        if (!ok) return;
        delete state.mail[mailKey(r)];
        state.sent = state.sent || {}; state.sent[r.key + "|" + m.tpl] = true;
        var next = shownRows().filter(function (x) { return x.key !== r.key; })[0];
        state.sel = next ? next.key : null;
        paint();
        say(what + " for " + r.name + ", noted in the log." + (next ? " Next: " + next.name + "." : " Nothing else is ready to send."));
      });
      return;
    }
    if (kind === "gmail") {
      // Gmail's compose address (Malone, via COBIx on issue 2967: ITPI's CSM team uses Gmail). Same cap as the mailto.
      var gHead = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(m.to) +
        (cc.length ? "&cc=" + encodeURIComponent(cc.join(",")) : "") + "&su=" + encodeURIComponent(m.subject || "");
      var gFull = gHead + "&body=" + encodeURIComponent(m.body || "");
      var openG = function (h) { try { window.open(h, "_blank", "noopener"); } catch (e) {} };
      if (gFull.length > MAILTO_MAX) {
        copyMail(m).then(function (ok) {
          openG(gHead);
          logIt("Gmail draft opened");
          say(ok ? "The email is long, so it is on the clipboard: paste it into the Gmail draft that opens. The log notes it."
            : "The email is long and the browser refused the copy. Select the words in the box, copy them, and paste them into the Gmail draft.");
        });
        return;
      }
      openG(gFull);
      logIt("Gmail draft opened");
      say("The draft opens in Gmail with To, Cc, Subject and the words; the log notes it.");
      return;
    }
    if (kind === "draft") {
      var head = "mailto:" + encodeURIComponent(m.to) + "?subject=" + encodeURIComponent(m.subject || "") +
        (cc.length ? "&cc=" + encodeURIComponent(cc.join(",")) : "");
      var href = head + "&body=" + encodeURIComponent(m.body || "");
      var open = function (h) {
        if (typeof window.CPL_FUNDING_OPEN_MAIL === "function") window.CPL_FUNDING_OPEN_MAIL(h);
        else { try { window.location.href = h; } catch (e) {} }
      };
      // A mail program refuses a link much past 1,900 characters, so a long email goes to the clipboard first and the
      // draft opens with To, Cc and Subject for the paste.
      if (href.length > MAILTO_MAX) {
        copyMail(m).then(function (ok) {
          open(head);
          logIt("Draft opened");
          say(ok ? "The email is long, so it is on the clipboard: paste it into the draft that opens. The log notes it."
            : "The email is long and the browser refused the copy. Select the words in the box, copy them, and paste them into the draft.");
        });
        return;
      }
      open(href);
      logIt("Draft opened");
      say("The draft opens in Outlook with To, Cc, Subject and the words; the log notes it.");
      return;
    }
    copyMail(m).then(function (ok) {
      if (!ok) { say("The browser refused the copy. Select the words in the box and copy them by hand."); return; }
      logIt("Email copied");
      say("Copied, logo included. Paste it into Outlook; the log notes the copy.");
    });
  }
  function todayHtml() {
    // The five lists a reviewer opens most, in the order the work goes; each count is its menu view's own count.
    var go = function (view, label) {
      return '<button type="button" class="metric" data-view="' + view + '" aria-pressed="' + (state.view === view) + '"><span class="num">' +
        S.rows.filter(VIEWS[view].keep).length + '</span><span class="lab">' + label + "</span></button>";
    };
    return '<div class="today" role="group" aria-label="Today">' + go("review", "Requests to review") + go("accept", "Acceptances to send") +
      go("request", "Requests to send") + go("notyet", "Not yet confirmed") + go("held", "Confirmed and held") + go("qual", "Qualify") +
      (S.deadline ? '<p class="deadline"><span class="lab">Confirmation due</span><span class="date">' + esc(shortDate(S.deadline)) + "</span></p>" : "") + "</div>" +
      '<p class="links today-more"><button type="button" class="word" data-condx="open" aria-expanded="' + !!state.condx + '" aria-controls="cw-condx">Funding conditions explained</button></p>';
  }
  /* FUNDING CONDITIONS EXPLAINED (asked in session, 2026-11-12: a link near the summary that opens a simple
     description of the funding conditions). Each condition's name is the funding tab's own label, read from the
     snapshot, so this panel cannot drift from the page a college reads; the sentences under it say how the condition
     is met, who settles it and what the dashboard does about it. A drawer, as Implementation Funding is. */
  var CONDX = {
    part: { how: "A senior administrator sends the participation confirmation from the college's or district's email address, on the CPL Implementation Funding page.",
      who: "The CPL Initiative team reviews the request on this dashboard and accepts or denies it.",
      dash: "Until a confirmation arrives, the dashboard recommends an email asking for it. Once one arrives, the review opens beside the record." },
    // The heading above these lines is the funding tab's live label, which a curator can reword (read 2026-11-12: the
    // CPL Coordinator in MAP and a CPL Assistant email on the landing page). So the sentence points at the heading
    // and names no parts of its own that could disagree with it.
    coord: { how: "The college's records in MAP and on its CPL landing page show what this condition names.",
      who: "The college keeps these in MAP. The team reviews nothing here.",
      dash: "The dashboard shows the status and names the part that is missing. It recommends no email for this condition." },
    vetstar: { how: "MAP holds a Joint Services Transcript for the required share of the college's veterans.",
      who: "The college uploads the transcripts to MAP, and MAP's figures settle it. The team reviews nothing here.",
      dash: "The dashboard shows the college's count beside the status. It recommends no email for this condition." },
    exhibits: { how: "A noncredit-only institution posts its noncredit certificates as exhibits in MAP. This stands in for the veteran transcript condition there.",
      who: "The institution posts the exhibits, and MAP's figures settle it.",
      dash: "The dashboard shows the status. It recommends no email for this condition." },
    nc: { how: "MAP shows the exact title Noncredit CPL Lead for the college, or the team accepts a Noncredit CPL Lead attestation.",
      who: "The college gives its lead the role in MAP. An attestation is reviewed on this dashboard.",
      dash: "This condition holds the noncredit share of the award alone. While it is open, the dashboard recommends an email asking for the role in MAP." }
  };
  function condxHtml() {
    var seen = {}, list = [], anyNc = false;
    (S.rows || []).forEach(function (r) {
      if (r.nc) anyNc = true;
      r.conds.forEach(function (c) {
        if (c.kind === "nc_coord" || c.kind === "nc_team") { anyNc = true; return; }
        if (!CONDX[c.kind] || seen[c.kind]) return;
        seen[c.kind] = 1; list.push({ kind: c.kind, label: c.label });
      });
    });
    if (anyNc) list.push({ kind: "nc", label: "Noncredit CPL Lead (the noncredit share)" });
    var one = function (x) {
      var d = CONDX[x.kind];
      return '<li data-condx-kind="' + x.kind + '"><h3>' + esc(String(x.label || "").replace(/\s+$/, "")) + "</h3>" +
        '<p><span class="k">How a college meets it: </span>' + esc(d.how) + "</p>" +
        '<p><span class="k">Who settles it: </span>' + esc(d.who) + "</p>" +
        '<p><span class="k">On this dashboard: </span>' + esc(d.dash) + "</p></li>";
    };
    return '<aside class="drawer" id="cw-condx" aria-labelledby="cw-condx-h"' + (state.condx ? "" : " hidden") + '><div class="drawer-h"><h2 id="cw-condx-h" tabindex="-1">Funding conditions explained</h2>' +
      '<button type="button" class="word" data-condx="close">Close</button></div>' +
      '<p class="note">A college qualifies for its max award once it meets every minimum condition' +
        (S.deadline ? ", with the participation confirmation due " + esc(shortDate(S.deadline)) : "") + ". Until then the award is held.</p>" +
      (list.length ? '<ul class="condx">' + list.map(one).join("") + "</ul>" : '<p class="note">The conditions are still loading.</p>') +
      '<h3 class="drawer-sub">The status words</h3>' +
      '<p class="note">Met: nothing more is needed. Not met: the college has yet to do its part. Waiting on the team: a request has arrived and the team has yet to review it. Pending: the figure has not loaded yet.</p>' +
      '<p class="links" style="margin:0"><a href="#implementation-funding">Open Implementation Funding</a></p></aside>';
  }
  /* ── access requests (the funding door, issue 2983) ─────────────────────────────────────────────────────────────
     A teammate whose sign-in email does not arrive asks an approver from the sign-in box. The approvers (the funding_approvers
     table, managed in Admin) see the request here; funding_access_pending() answers nobody else, so for every other
     reviewer the section never draws. Approve grants the funding and CSM surfaces for 30 days and the requester's open
     tab signs them in; no email and no phrase go anywhere. */
  var ACC = { rows: [], asked: false, timer: null, busy: {}, approver: false };
  function accessPost(path, body) {
    // rest() each time: its headers carry the session's token as it stands now. A token kept from the first read
    // lapses within the hour, and a refused read looks the same as an empty queue.
    var R = rest(); if (!R || !R.remote) return Promise.reject(new Error("no session"));
    return fetch(R.url + path, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, R.headers), body: JSON.stringify(body || {}) });
  }
  /* ── a sign-in whose funding access has ended (the reviewer-session-lifetime lane's NEXT, S622) ────────────────
     A door grant lasts 30 days (funding_access.expires_at) and can be revoked. The browser's sign-in outlives it on
     a tab left open, and every review read then comes back refused, so the workspace read as signed in with nothing
     opening. The database answers is_funding_reviewer() for the session as it stands; false draws this note with
     Ask an approver, which sends the door's own request for the address signed in. Unasked, unanswered or failed,
     the screen stays as it was: the answer shapes the screen, never the permission. */
  var GRANT = { ok: null, at: 0, msg: "", busy: false };
  var GRANT_EVERY_MS = 10 * 60 * 1000;
  function readGrant() {
    return accessPost("rpc/is_funding_reviewer")
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (v) {
        if (v !== true && v !== false) return;
        GRANT.at = Date.now();
        if (GRANT.ok === v) return;
        GRANT.ok = v;
        if (v) { GRANT.msg = ""; ACC.asked = false; }   // access is back: read the queue again
        paint();
      }).catch(function () {});
  }
  function grantHtml() {
    var R = rest(), who = R && R.who ? R.who : "This sign-in";
    return '<section class="sec grant" aria-labelledby="cw-grant-h"><h2 id="cw-grant-h">Your funding access has ended</h2>' +
      '<p class="signin">' + esc(who) + " is signed in, and the funding review is closed to it now. Access given by an approver lasts 30 days. " +
      "Ask an approver to open it again; this tab picks the access up when one of them approves.</p>" +
      '<p class="grant-acts"><button type="button" class="word lead" data-grant="ask"' + (GRANT.busy ? " disabled" : "") + ">Ask an approver</button></p>" +
      '<p class="note" role="status" id="cw-grant-msg">' + esc(GRANT.msg) + "</p></section>";
  }
  // The Nudge logs itself from the funding tab (cpl_funding.js nudgeLog): read the log again so its entries and
  // their follow-ups show here without a reload.
  window.addEventListener("cpl-csm-log-changed", function () { if (LOG.asked) loadLog(); });
  // The door's later words (declined, lapsed, no approval yet) reach the note; the button stays, so the reader asks again.
  window.addEventListener("cpl-funding-door-said", function (e) {
    if (GRANT.ok !== false || !e || !e.detail || !e.detail.msg) return;
    GRANT.msg = String(e.detail.msg); GRANT.busy = false; paint();
  });
  function askGrant() {
    var R = rest(), SI = window.CPL_REVIEWER_SIGNIN, fail = "The request did not go through. Try again in a few minutes.";
    if (GRANT.busy) return;
    if (!R || !R.who || !SI || typeof SI._askAccess !== "function") { GRANT.msg = fail; paint("cw-grant-msg"); return; }
    GRANT.busy = true; GRANT.msg = "Asking…"; paint();
    SI._askAccess(R.who).then(function (a) {
      GRANT.busy = false;
      GRANT.msg = a && a.ok ? "Asked. An approver will see it in the Funding Follow-up Dashboard. Keep this tab open: it picks the access up when one of them approves."
        : (a && a.why) || fail;
      paint();
    }).catch(function () { GRANT.busy = false; GRANT.msg = fail; paint(); });
  }
  function readAccess() {
    return accessPost("rpc/funding_access_pending")
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (rows) {
        rows = Array.isArray(rows) ? rows : [];
        var changed = JSON.stringify(rows.map(function (x) { return x.id; })) !== JSON.stringify(ACC.rows.map(function (x) { return x.id; }));
        ACC.rows = rows;
        if (changed) paint();
        return true;
      }).catch(function () { return false; });   // a refused read keeps the rows it had
  }
  function loadAccess() {
    var R = rest(); if (!R || !R.remote) return;
    ACC.asked = true;
    // An approver sees the section with nobody waiting too, so they know where a request will show.
    accessPost("rpc/is_funding_approver").then(function (r) { return r.ok ? r.json() : false; })
      .then(function (yes) { if (yes === true && !ACC.approver) { ACC.approver = true; paint(); } }).catch(function () {});
    readAccess(); readGrant();
    if (!ACC.timer) ACC.timer = setInterval(function () {
      if (window.CPL_TABS && typeof window.CPL_TABS.current === "function" && window.CPL_TABS.current() !== TAB) return;
      // While the access is closed, ask every tick so an approval shows within the half minute; otherwise every ten minutes.
      if (GRANT.ok === false || Date.now() - GRANT.at > GRANT_EVERY_MS) readGrant();
      if (GRANT.ok !== false) readAccess();   // the database refuses the queue while the access is closed
    }, 30000);
  }
  function checkAccess() {
    say("Checking for access requests…");
    readAccess().then(function (ok) {
      say(!ok ? "Could not read the access requests. Sign in again and try once more."
        : ACC.rows.length ? ACC.rows.length + (ACC.rows.length === 1 ? " access request waits." : " access requests wait.") : "No access request is waiting.");
      var b = root() && root().querySelector('[data-access="check"]'); if (b) b.focus();
    });
  }
  // Access requests sit in the header as one word with their count (Sam on the mock, 2026-11-09: "quietly in the
  // header"); the word opens the section below it. Only an approver, or a reviewer with a request to see, gets the word.
  function accessWord() {
    if (!S.reviewer || GRANT.ok === false || (!ACC.rows.length && !ACC.approver)) return "";
    var n = ACC.rows.length;
    return '<button type="button" class="word' + (n ? "" : " quiet") + '" data-accopen="1" aria-expanded="' + !!state.accOpen + '" aria-controls="cw-acc">Access requests: ' +
      (n ? n + " waiting" : "none waiting") + "</button>";
  }
  /* The funding drawer (Sam on the mock, 2026-11-09: "love the simple side bar with link to go full monty if needed"):
     the chosen college's place in Implementation Funding, from the snapshot the workspace already holds, in a panel at
     the right edge; Open the full page goes to the funding tab on that college. Under the facts, one line per priority
     (the mock's drawer: "Access: applied CPL units in MAP, 41 of a target of 60."), written by the funding tab's
     csmPrioLines() from its own reads, so the drawer and the full page cannot disagree; TBA where nothing is measured. */
  function fundWord(from, words) {
    return '<button type="button" class="word" data-fund="open" data-fund-from="' + from + '" aria-expanded="' + !!state.fund + '" aria-controls="cw-fund">' + esc(words) + "</button>";
  }
  function fundHtml() {
    var r = state.sel ? rowOf(state.sel) : null;
    var met = r ? r.conds.filter(function (c) { return c.met; }).length : 0, of = r ? r.conds.length : 0;
    var qual = r && r.part.confirmed && !r.gate.blocked;
    var row = function (k, v) { return '<tr><th scope="row">' + k + "</th><td>" + v + "</td></tr>"; };
    return '<aside class="drawer" id="cw-fund" aria-labelledby="cw-fund-h"' + (state.fund ? "" : " hidden") + '><div class="drawer-h"><h2 id="cw-fund-h" tabindex="-1">Implementation Funding</h2>' +
      '<button type="button" class="word" data-fund="close">Close</button></div>' +
      (r ? '<p class="note" id="cw-fund-who">' + esc(r.name) + (r.district ? ", " + esc(r.district) : "") + "</p>" +
        '<table class="facts" aria-label="' + esc(r.name) + ' in Implementation Funding"><colgroup><col style="width:52%"><col style="width:48%"></colgroup><tbody>' +
        row("Max award", r.total ? money(r.total) + (r.floored ? " (Base)" : r.capped ? " (Cap)" : "") : "TBA") +
        // The participation confirmation is one of r.conds (kind "part"), so "every minimum condition" names it too.
        row("Qualifying now", qual ? (r.total ? money(r.total) : "TBA") : "Held until every minimum condition is met") +
        row("Minimum conditions met", met + " of " + of) +
        (S.deadline ? row("Confirmation due", esc(shortDate(S.deadline))) : "") +
        (S.reviewer ? row("CO Monitor's note", r.note ? esc(r.note) : "No note yet.") : "") + "</tbody></table>" +
        ((r.prios || []).length ? '<h3 class="drawer-sub" id="cw-fund-prio">Priorities</h3><ul class="prio-lines" aria-labelledby="cw-fund-prio">' +
          r.prios.map(function (p) { return "<li>" + esc(p.text) + "</li>"; }).join("") + "</ul>" : "") +
        '<p class="links" style="margin:0"><button type="button" class="word" data-act="focus">Open the full page</button></p>' +
        (S.reviewer ? '<p class="note">The CO Monitor\'s note is written on the full page.</p>' : "")
        : '<p class="note">Choose a college to see its place in Implementation Funding.</p>') + "</aside>";
  }
  // Closing the drawer returns the focus to the word that opened it: the header's, or one in the record.
  function fundOpener() {
    return (state.fundFrom && root().querySelector('[data-fund="open"][data-fund-from="' + cssEsc(state.fundFrom) + '"]')) || root().querySelector('[data-fund="open"]');
  }
  function accessHtml() {
    if (!ACC.rows.length && !ACC.approver) return "";
    var check = '<button type="button" class="word" data-access="check">Check now</button>';
    if (!ACC.rows.length) {
      return '<section class="sec pane accpane" id="cw-acc" aria-labelledby="cw-acc-h"' + (state.accOpen ? "" : " hidden") + '><div class="sec-h"><h2 id="cw-acc-h">Access requests</h2><p class="note">' +
        "No one is waiting. A teammate who is signed out opens this page, enters their work email and chooses Ask an approver; " +
        "the request shows here within half a minute. " + check + "</p></div></section>";
    }
    return '<section class="sec pane accpane" id="cw-acc" aria-labelledby="cw-acc-h"' + (state.accOpen ? "" : " hidden") + '><div class="sec-h"><h2 id="cw-acc-h">Access requests</h2><p class="note">' +
      "A teammate asked to sign in without the email link. Approve opens the funding and CSM work for 30 days; their open tab signs them in. " + check + "</p></div>" +
      '<ul class="queue" aria-label="Access requests">' + ACC.rows.map(function (x) {
        return '<li><div class="row"><span class="row-name">' + esc(x.name || x.email) + '</span><span class="row-age">' + esc(shortDate(x.requested_at)) +
          '</span><span class="row-next">' + esc(x.email) + (x.role ? ", " + esc(x.role) : "") + "</span>" +
          '<span class="row-pills"><button type="button" class="word lead" data-access="approve" data-id="' + esc(x.id) + '"' + (ACC.busy[x.id] ? " disabled" : "") + ">Approve</button>" +
          '<button type="button" class="word" data-access="deny" data-id="' + esc(x.id) + '"' + (ACC.busy[x.id] ? " disabled" : "") + ">Deny</button></span></div></li>";
      }).join("") + "</ul></section>";
  }
  function decideAccess(id, verdict) {
    var who = (ACC.rows.filter(function (x) { return x.id === id; })[0] || {});
    ACC.busy[id] = true; paint();
    accessPost("rpc/funding_access_decide", { p_id: id, p_verdict: verdict })
      .then(function (r) { return r.ok ? r.json() : { ok: false, why: String(r.status) }; })
      .then(function (res) {
        delete ACC.busy[id];
        if (res && res.ok) {
          ACC.rows = ACC.rows.filter(function (x) { return x.id !== id; });
          paint();
          say(verdict === "approve" ? "Approved " + (who.name || who.email) + ". Their open tab signs them in." : "Declined the request from " + (who.name || who.email) + ".");
          return;
        }
        paint();
        say("Not saved (" + ((res && res.why) || "no answer") + "). Sign in again and try once more.");
      }).catch(function (e) { delete ACC.busy[id]; paint(); say("Not saved (" + e.message + ")."); });
  }
  function paint() {
    var el = root(); if (!el) return;
    var f = F();
    if (!f) { el.innerHTML = '<p class="empty">Loading the Funding Follow-up Dashboard&hellip;</p>'; return; }
    S = f.snapshot();
    tplPush();
    if (S.reviewer && !LOG.asked) loadLog();
    if (S.reviewer && !TPLS.asked) loadTemplates();
    if (S.reviewer && CT.state === "idle") loadContacts();
    var ae = document.activeElement, focusId = ae && el.contains(ae) ? ae.id : null;
    var focusSel = ae && el.contains(ae) ? ae.getAttribute("data-sel") : null;
    // A template being edited keeps its cursor and scroll through a repaint (COBIx on PR 3068).
    var caret = focusId === "cw-tpls-body" || focusId === "cw-tpls-subj" ? { a: ae.selectionStart, b: ae.selectionEnd, top: ae.scrollTop } : null;
    el.innerHTML = '<div class="cw"><div class="page"><div class="wrap">' +
      '<header><div class="top-row"><h1>Funding Follow-up Dashboard</h1><p class="links">' + accessWord() + tplWord() +
        fundWord("head", "Implementation Funding") + "</p></div>" +
        '<div class="rule" aria-hidden="true"></div>' + todayHtml() + "</header>" +
      (S.reviewer ? (GRANT.ok === false ? grantHtml() : accessHtml() + tplHtml()) : '<p class="signin">Sign in as a MAP team reviewer to read who sent each request and to accept, deny or follow up. The counts below are the public ones.</p><div id="cw-signin"></div>') +
      // The list needs no title and the metrics and the menu count every institution, so the Action center heading and
      // the four-column board are gone (go-live note, item 13, on Sam's go).
      '<section class="sec" aria-label="Colleges">' + (S.loaded ? "" : '<p class="note">Loading the requests&hellip;</p>') +
        '<div class="center" id="cw-center" style="' + splitStyle() + '">' + queueHtml() + splitHtml() + '<div id="cw-record">' + recordHtml() + "</div></div></section>" +
      '<footer class="foot"><span>The dashboard never sends mail: every email opens for you to send from Outlook or Gmail.</span>' +
        '<a href="#implementation-funding">Open Implementation Funding</a></footer>' + fundHtml() + condxHtml() +
      "</div></div></div>";
    var sm = document.getElementById("cw-signin");
    if (sm && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      window.CPL_REVIEWER_SIGNIN.mountInto(sm, { title: "Sign in to the Funding Follow-up Dashboard", door: true,
        blurb: "Enter your work email and Ask an approver: one of the funding approvers approves from this page, and this tab signs you in. A one-time email link works too. Either way the workspace knows it is you." });
    }
    if (S.reviewer && !ACC.asked) loadAccess();
    if (focusId && document.getElementById(focusId)) {
      var fe = document.getElementById(focusId); fe.focus();
      if (caret) { try { fe.setSelectionRange(caret.a, caret.b); fe.scrollTop = caret.top; } catch (e) {} }
    }
    else if (focusSel) { var b = el.querySelector('.row[data-sel="' + cssEsc(focusSel) + '"]'); if (b) b.focus(); }
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }
  function paintRecord() {
    var rec = document.getElementById("cw-record"); if (!rec) return paint();
    rec.innerHTML = recordHtml();
    Array.prototype.forEach.call(root().querySelectorAll(".row[data-sel]"), function (b) {
      if (b.getAttribute("data-sel") === state.sel) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }
  function refreshVerdicts() {
    var r = rowOf(state.sel); if (!r) return;
    waitingKinds(r).forEach(function (kind) {
      var g = reviewState(r, kind); if (!g) return;
      var v = root().querySelector('[data-verdict="' + kind + '"]'); if (!v) return;
      var a = v.querySelector('[data-act="accept"]'), d = v.querySelector('[data-act="deny"]'), gt = v.querySelector("[data-gate]");
      if (a) a.disabled = !!(g.open || g.fails);
      if (d) d.disabled = false;
      if (gt) gt.textContent = gateWords(g);
    });
  }


  // ── the controls ─────────────────────────────────────────────────────────
  function say(t) { state.msg = t; var s = root() && root().querySelector(".status"); if (s) s.textContent = t; }
  function act(name, kind) {
    var f = F(), r = rowOf(state.sel);
    if (name === "nudge") { if (f) f.nudge(); return; }
    if (!r) return;
    if (name === "toreview") {
      state.side = "review"; paintRecord();
      var rv = root().querySelector("#cw-side-review"); if (rv) { rv.focus(); if (rv.scrollIntoView) rv.scrollIntoView({ block: "start" }); }
      return;
    }
    if (name === "focus") { if (f) f.focus(r.key); return; }
    if (name === "mailedit") {
      state.mailEdit = state.mailEdit || {};
      state.mailEdit[r.key] = !state.mailEdit[r.key];
      paintRecord();
      var me = root().querySelector(state.mailEdit[r.key] ? "#cw-body" : '[data-act="mailedit"]'); if (me) me.focus();
      return;
    }
    if (!f || !S.reviewer) return;
    if (name === "bounced") {
      var ls = lastSent(r, kind);
      if (!ls) return;
      logWrite("POST", null, { college: r.key, kind: "email", body: "It bounced, " + ls.body }).then(function (ok) {
        if (!ok) return;
        // Either receipt can be undone (COBIx on PR 3050): the both-in-one email's receipt is the nudge's.
        if (state.sent) { delete state.sent[r.key + "|" + kind]; if (kind === "nudge") delete state.sent[r.key + "|both"]; }
        paint();
        say("Noted that it bounced. " + r.name + " is back among the emails to send.");
      });
      return;
    }
    var why = null;
    if (name === "deny") {
      var g = reviewState(r, kind);
      why = g ? g.R.items.filter(function (it) { return it.s === "fails"; }).map(function (it) { return it.n || it.t; }) : [];
      var ok = true;
      try { ok = window.confirm("Deny the " + (kind === "nc" ? "noncredit attestation" : "participation confirmation") + " from " + r.name + "?" +
        (why.length ? "\n\nNot met: " + why.join("; ") + "." : "") + "\n\nDeny removes the request, so the college can send another."); } catch (e) { ok = true; }
      if (!ok) return;
    }
    /* Accept and Deny log and speak only after the save reads back (COBIx on issue 2967, item 2; Sam's go 2026-11-09): f.act answers
       with the re-read, so a refused save (an expired session, RLS) leaves csm_log, the message and the email untouched. */
    var p = f.act(name, kind, r.key);
    if (!p) return;
    var what = kind === "nc" ? "noncredit attestation" : "participation confirmation";
    var writes = name === "accept" || name === "deny";
    var role = String((state.roles || {})[gid(r.key, kind)] || "").trim().slice(0, 120);
    if (writes) say(name === "accept" ? "Saving the acceptance…" : "Saving the denial…");
    return Promise.resolve(p).then(function (res) {
      var ok = res === true || !!(res && res.ok);
      if (!ok) {
        say("Not saved: the " + what + " from " + r.name + " is unchanged. Your sign-in may have ended: sign in again and try once more.");
        return false;
      }
      var entry = name === "accept" ? { kind: "email", body: "Accepted the " + what + "; the acceptance email opened to copy." + (role ? " Sender's role, as checked: " + role + "." : "") }
        : name === "deny" ? { kind: "note", body: "Denied the " + what + "." + (why && why.length ? " Not met: " + why.join("; ") + "." : "") }
        : name === "follow" ? { kind: "email", body: "Follow-up email on the " + what + " opened to copy.", follow_up_on: plusDays(7) }
        : { kind: "email", body: "The acceptance email for the " + what + " opened again to copy." };
      logWrite("POST", null, Object.assign({ college: r.key }, entry));
      // The request is decided: the panel closes unless another request still waits (COBIx on PR 3052), and focus
      // goes to Recommended action, which now names the email, so the keyboard is never left on the page's body.
      if (writes) {
        var left = waitingKinds(r).filter(function (k) { return k !== kind; }).length;
        if ((state.side === "review" || state.side === "none") && !left) state.side = "";
        setTimeout(function () { var rr = document.getElementById(left ? "cw-side-review" : "cw-reason"); if (rr) rr.focus(); }, 0);
      }
      say(name === "accept" ? "Accepted. The acceptance email opens for you to copy." : name === "deny" ? "Denied: the request is removed." :
        name === "follow" ? "The follow-up email opens for you to edit and copy." : "The acceptance email opens again for you to copy.");
      return true;
    });
  }
  function onClick(e) {
    var t = e.target.closest ? e.target.closest("button, [data-sel]") : null;
    if (!t || !root().contains(t)) return;
    if (t.hasAttribute("data-sel")) { state.sel = t.getAttribute("data-sel"); state.msg = ""; state.psrc = ""; if (state.side === "review" || state.side === "none") state.side = ""; paintRecord(); return; }
    if (t.hasAttribute("data-tplopen")) {
      state.tplOpen = !state.tplOpen; state.tplMsg = "";
      if (state.tplOpen && rest() && rest().remote) TPLS.asked = false;   // re-read on open, so a teammate's save shows
      paint();
      var tw = root().querySelector(state.tplOpen ? "#cw-tpls-h" : "[data-tplopen]"); if (tw) { tw.setAttribute("tabindex", "-1"); tw.focus(); }
      return;
    }
    if (t.hasAttribute("data-tpldiscard")) { delete state.tplDraft[state.tplId]; state.tplMsg = "Your changes are discarded."; paint(); return; }
    if (t.hasAttribute("data-tpluse")) {
      var vid = t.getAttribute("data-tpluse"), ver = TPLS.rows.filter(function (x) { return String(x.id) === vid; })[0];
      if (ver) { var cur1 = tplOf(state.tplId); state.tplDraft[state.tplId] = { subject: ver.subject, body: ver.body, base: cur1.row ? cur1.row.id : null }; state.tplMsg = "Loaded the version from " + shortDate(ver.created_at) + ". Save to use it again."; paint(); }
      var tb = document.getElementById("cw-tpls-body"); if (tb) tb.focus();
      return;
    }
    if (t.hasAttribute("data-tplreset")) {
      var ok0 = true;
      try { ok0 = window.confirm("Put back the wording the dashboard ships with for " + tplLabel(state.tplId) + "? Every reviewer's next email uses it. The saved versions stay in Earlier versions."); } catch (e0) { ok0 = true; }
      if (!ok0) return;
      TPLS.busy = true; paint();
      tplWrite({ template_id: state.tplId, reset: true }).then(function (ok) {
        TPLS.busy = false; delete state.tplDraft[state.tplId];
        state.tplMsg = ok ? "The shipped wording is back for every reviewer." : "";
        if (ok && rest() && rest().remote) loadTemplates(); else paint();
      });
      return;
    }
    if (t.hasAttribute("data-accopen")) { state.accOpen = !state.accOpen; paint(); var aw = root().querySelector(state.accOpen ? "#cw-acc-h" : "[data-accopen]"); if (aw) { aw.setAttribute("tabindex", "-1"); aw.focus(); } return; }
    if (t.hasAttribute("data-condx")) {
      state.condx = t.getAttribute("data-condx") === "open" && !state.condx;
      if (state.condx) state.fund = false;
      paint();
      var xh = root().querySelector(state.condx ? "#cw-condx-h" : '[data-condx="open"]'); if (xh) xh.focus();
      return;
    }
    if (t.hasAttribute("data-fund")) {
      state.fund = t.getAttribute("data-fund") === "open" && !state.fund;
      if (state.fund) state.condx = false;
      if (t.getAttribute("data-fund") === "open") state.fundFrom = t.getAttribute("data-fund-from") || "";
      paint();
      var fh = state.fund ? root().querySelector("#cw-fund-h") : fundOpener(); if (fh) fh.focus();
      return;
    }
    if (t.hasAttribute("data-side")) {
      var sk = t.getAttribute("data-side");
      state.side = sideOf(rowOf(state.sel)) === sk ? "none" : sk;
      paintRecord();
      var sh = sideOf(rowOf(state.sel)) ? root().querySelector("#cw-side-" + sideOf(rowOf(state.sel))) : root().querySelector('[data-side="' + sk + '"]');
      if (sh) sh.focus();
      if ((state.side === "people" || state.side === "page") && S.reviewer && CT.state !== "ready" && CT.state !== "error") loadContacts().then(paintRecord);
      return;
    }
    if (t.hasAttribute("data-view")) { state.view = t.getAttribute("data-view"); state.sel = null; paint(); return; }
    if (t.hasAttribute("data-copyaddr")) {
      var cr = rowOf(state.sel); if (!cr) return;
      var srcSel = document.getElementById("cw-psrc"), only = t.getAttribute("data-copyaddr") === "shown" && srcSel ? srcSel.value : "";
      var list = uniqueEmails(contactsOf(cr).people.filter(function (p) { return !only || p.src === only; }));
      var stat = t.parentNode.querySelector("[data-copied]");
      copyText(list.join("; ")).then(function (ok) { if (stat) stat.textContent = ok ? list.length + " addresses copied." : "The browser refused the copy."; });
      return;
    }
    if (t.hasAttribute("data-mailact")) { mailAct(t.getAttribute("data-mailact")); return; }
    if (t.getAttribute("data-grant") === "ask") { askGrant(); return; }
    if (t.getAttribute("data-access") === "check") { checkAccess(); return; }
    if (t.hasAttribute("data-access")) { decideAccess(t.getAttribute("data-id"), t.getAttribute("data-access")); return; }
    if (t.hasAttribute("data-logdone")) {
      var on = t.getAttribute("data-on") === "1";
      logWrite("PATCH", Number(t.getAttribute("data-logdone")), { done_at: on ? new Date().toISOString() : null })
        .then(function (ok) { if (ok) say(on ? "Follow-up marked done." : "Follow-up reopened."); });
      return;
    }
    if (t.hasAttribute("data-logdel")) {
      var sure = true;
      try { sure = window.confirm("Delete this entry from the log? It cannot be brought back."); } catch (x) { sure = true; }
      if (sure) logWrite("DELETE", Number(t.getAttribute("data-logdel"))).then(function (ok) { if (ok) say("The entry is deleted."); });
      return;
    }
    if (t.hasAttribute("data-act")) act(t.getAttribute("data-act"), t.getAttribute("data-kind"));
  }
  function onSubmit(e) {
    var fm = e.target;
    if (fm.hasAttribute && fm.hasAttribute("data-tplform")) { e.preventDefault(); saveTemplate(fm); return; }
    if (!fm.hasAttribute || !fm.hasAttribute("data-logform")) return;
    e.preventDefault();
    var r = rowOf(state.sel); if (!r) return;
    var body = String(fv(fm, "body").value || "").trim(), due = fv(fm, "due").value || null;
    if (!body && !due) { say("Write what was said or done, or give a follow-up date."); fv(fm, "body").focus(); return; }
    logWrite("POST", null, { college: r.key, kind: fv(fm, "kind").value, body: body || null, follow_up_on: due }).then(function (ok) {
      if (!ok) return;
      delete state.draft[r.key];
      say("Saved to " + r.name + "'s log.");
      paintRecord();
    });
  }
  function onChange(e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-check")) {
      var k = gid(state.sel, t.getAttribute("data-kind")), m = state.checks[k] || (state.checks[k] = {});
      m[t.getAttribute("data-check")] = t.checked;
      refreshVerdicts();
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-tplpick")) {
      state.tplId = t.value; state.tplMsg = ""; paint();
      var tp = document.getElementById("cw-tpls-id"); if (tp) tp.focus();
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-psrc")) {
      state.psrc = t.value || "";
      paintRecord();
      var ns = document.getElementById("cw-psrc"); if (ns) ns.focus();
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-ccpick")) {
      var mr = rowOf(state.sel); if (!mr) return;
      var mm = mailOf(mr), e = t.getAttribute("data-ccpick");
      mm.more = mm.more.filter(function (x) { return x.toLowerCase() !== e.toLowerCase(); });
      if (t.checked) mm.more.push(e);
      var mf = document.getElementById("cw-more"); if (mf) mf.value = mm.more.join(", ");
      var cnt = root().querySelector(".ccpick > summary .tpl-meta"); if (cnt) cnt.textContent = mm.more.length ? mm.more.length + " added" : "from the contacts on file";
      return;
    }
    if (t.hasAttribute && t.hasAttribute("data-mail")) { mailField(t); return; }
    if (t.form && t.form.hasAttribute("data-logform") && state.sel) {
      state.draft[state.sel] = { kind: fv(t.form, "kind").value, due: fv(t.form, "due").value, body: fv(t.form, "body").value };
      return;
    }
    if (t.id === "cw-view") { state.view = t.value; state.sel = null; paint(); }
  }
  function mailField(t) {
    var r = rowOf(state.sel); if (!r) return;
    var m = mailOf(r), k = t.getAttribute("data-mail");
    if (k === "tpl") { var keep = m.more; state.mail[mailKey(r)] = seedMail(r, t.value); state.mail[mailKey(r)].more = keep; paintRecord();
      var nt = document.getElementById("cw-tpl"); if (nt) nt.focus(); return; }
    if (k === "more") { m.more = splitList(t.value); return; }
    if (k === "fu") { m.fu = !!t.checked; return; }
    m[k] = t.value;
  }
  function saveTemplate(fm) {
    var id = state.tplId, subject = String(fv(fm, "subject").value || "").trim(), body = String(fv(fm, "body").value || "").replace(/\s+$/, "");
    var said = function (m) { state.tplMsg = m; var x = document.getElementById("cw-tpls-said"); if (x) x.textContent = m; };
    if (!subject || !body.trim()) { said("A template needs a subject and a message."); return; }
    var bad = tplUnknown(subject + "\n" + body, id);
    if (bad.length) { said("Not saved: " + bad.join(", ") + (bad.length === 1 ? " is not a word" : " are not words") + " the dashboard fills in. Use one of the words listed under the message."); return; }
    var dr = state.tplDraft[id] || null;
    TPLS.busy = true; paint();
    // Re-read first: a teammate's save since this draft began is named, and nothing is written over it (COBIx on PR 3068).
    tplFresh().then(function () {
      var cur = tplOf(id), now = cur.row ? cur.row.id : null, base = dr && "base" in dr ? dr.base : now;
      if (String(now) !== String(base)) {
        TPLS.busy = false;
        if (dr) dr.base = now;
        state.tplMsg = "Not saved: " + (cur.row.by_email || "a teammate") + " saved this template on " + shortDate(cur.row.created_at) +
          " while you were editing. Your words are still in the box; Earlier versions holds theirs. Save again to keep yours.";
        paint(); return null;
      }
      if (subject === cur.subject && body === cur.body) { TPLS.busy = false; state.tplMsg = "Nothing has changed since the last save."; paint(); return null; }
      return tplWrite({ template_id: id, subject: subject, body: body });
    }).then(function (ok) {
      if (ok === null) return;
      TPLS.busy = false;
      if (ok) { delete state.tplDraft[id]; state.tplMsg = "Saved. Every reviewer's next " + tplLabel(id).toLowerCase().replace(/^the /, "") + " email starts from this wording."; }
      if (ok && rest() && rest().remote) loadTemplates(); else paint();
    });
  }
  function onInput(e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-tpledit")) {
      var cur = tplOf(state.tplId), dr = state.tplDraft[state.tplId] || { subject: cur.subject, body: cur.body, base: cur.row ? cur.row.id : null };
      dr[e.target.getAttribute("data-tpledit")] = e.target.value;
      state.tplDraft[state.tplId] = dr;
      return;
    }
    if (e.target.id === "cw-ccfind") {
      var q = e.target.value.trim().toLowerCase();
      Array.prototype.forEach.call(root().querySelectorAll(".ccopt"), function (o) { o.hidden = !!q && o.getAttribute("data-hay").indexOf(q) < 0; });
      return;
    }
    if (e.target.hasAttribute && e.target.hasAttribute("data-role") && state.sel) {
      (state.roles = state.roles || {})[gid(state.sel, e.target.getAttribute("data-role"))] = e.target.value; return;
    }
    if (e.target.hasAttribute && e.target.hasAttribute("data-mail") && e.target.getAttribute("data-mail") !== "tpl") { mailField(e.target); return; }
    var fm = e.target.form;
    if (fm && fm.hasAttribute("data-logform") && state.sel) {
      state.draft[state.sel] = { kind: fv(fm, "kind").value, due: fv(fm, "due").value, body: fv(fm, "body").value };
      return;
    }
    if (e.target.id !== "cw-q") return;
    state.q = e.target.value; state.sel = null;
    var pos = e.target.selectionStart;
    paint();
    var q = document.getElementById("cw-q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} }
  }

  // ── boot ─────────────────────────────────────────────────────────────────
  var wired = false, unsub = null;
  function fresh() { state.view = "open"; state.q = ""; state.sel = null; state.msg = ""; state.side = ""; state.lpOpen = {}; state.psrc = ""; state.mailEdit = {}; state.fund = false; state.condx = false; state.doneOpen = {}; state.accOpen = false; state.tplOpen = false; state.tplMsg = ""; LOG.asked = false; TPLS.asked = false; }
  /* #csm-workspace/<view> opens that view of the action center, read after fresh() on every visit; a bare
     #csm-workspace (what the side menu writes) or an unknown word keeps All open items. */
  function arrive() {
    var a = window.CPL_SESSION && CPL_SESSION.arrival ? CPL_SESSION.arrival(TAB) : null;
    var want = a && a[0] ? (VIEW_WAS[a[0]] || a[0]) : "";
    if (want && Object.prototype.hasOwnProperty.call(VIEWS, want)) state.view = want;
  }
  function boot() {
    ensureCss();
    var el = root(); if (!el) return;
    el.removeAttribute("style");   // the pane's loading placeholder (dashed, centered) goes once the tab paints
    // A pick lasts the visit (Sam, 2026-10-21): every open starts on All open items, nothing chosen. tabs.js fires
    // onActivate once, so the module hears each later visit itself.
    fresh(); arrive();
    if (!wired) {
      wired = true;
      el.addEventListener("click", onClick);
      el.addEventListener("keydown", onSplitKey);
      // Escape closes the funding drawer and returns to the word that opened it.
      el.addEventListener("keydown", function (e) {
        // A pop-up's own Escape closes the pop-up alone (COBIx on PR 3053): the drawer stays while one is open.
        if (e.key !== "Escape" || (!state.fund && !state.condx)) return;
        if (state.condx) { state.condx = false; paint(); var xo = root().querySelector('[data-condx="open"]'); if (xo) xo.focus(); return; }
        state.fund = false; paint();
        var fo = fundOpener(); if (fo) fo.focus();
      });
      el.addEventListener("pointerdown", onSplitDown);
      el.addEventListener("change", onChange);
      el.addEventListener("input", onInput);
      el.addEventListener("submit", onSubmit);
      el.addEventListener("toggle", function (e) { if (e.target.classList && e.target.classList.contains("ccpick")) state.ccOpen = e.target.open; }, true);
      // Every field on file keeps its fold through a repaint, as the source filter repaints the record (COBIx on PR 3067).
      el.addEventListener("toggle", function (e) { if (e.target.hasAttribute && e.target.hasAttribute("data-onfile")) state.onfileOpen = e.target.open; }, true);
      el.addEventListener("toggle", function (e) {
        var d = e.target; if (!d.hasAttribute || !d.hasAttribute("data-reqdone") || !state.sel) return;
        state.doneOpen = state.doneOpen || {}; state.doneOpen[gid(state.sel, d.getAttribute("data-reqdone"))] = d.open;
      }, true);
      // Show the landing page here draws the page the first time it opens.
      el.addEventListener("toggle", function (e) {
        var d = e.target; if (!d.hasAttribute || !d.hasAttribute("data-lpshow")) return;
        state.lpOpen[gid(state.sel, d.getAttribute("data-lpshow"))] = d.open;
        if (!d.open || d.querySelector(".lpframe, .gate")) return;
        var r = rowOf(state.sel); if (r) d.insertAdjacentHTML("beforeend", landingFrame(r));
      }, true);
      window.addEventListener("cpl-tab-activated", function (e) {
        if (e && e.detail && e.detail.tab === TAB) { fresh(); arrive(); paint(); }
      });
    }
    var go = function () {
      var t = window.CPL_FUNDING_TAB;
      if (!t || !t.csm) { el.innerHTML = '<p class="empty">The funding model did not load. Reload the page to try again.</p>'; return; }
      if (!unsub && typeof t.onModelChange === "function") unsub = t.onModelChange(function () {
        if (window.CPL_TABS && typeof window.CPL_TABS.current === "function" && window.CPL_TABS.current() !== TAB) return;
        paint();
      });
      if (typeof t.ensureLoaded === "function") t.ensureLoaded();
      paint();
    };
    if (window.CPL_FUNDING_TAB) go();
    else if (window.CPL_TABS && typeof window.CPL_TABS.loadScript === "function") window.CPL_TABS.loadScript("cpl_funding.js", "CPL_FUNDING_TAB", go);
    else go();
  }

  window.CPL_CSM_WORKSPACE = { boot: boot, paint: paint,
    _state: state, _stageOf: stageOf, _reviewItems: reviewItems, _nextStep: nextStep, _needsYou: needsYou, _recOf: recOf, _recTpl: recTpl, _draftedOf: draftedOf, _views: VIEWS, _leadMail: function (on) { LEAD_MAIL_ON = !!on; }, _snapshot: function () { return S; },
    _log: function () { return LOG.rows; }, _dueOf: dueOf,
    _readAccess: readAccess,
    _setContacts: function (o) { CT.dir = o.dir || []; CT.landing = o.landing || []; CT.users = o.users || []; CT.state = "ready"; },
    _contactsOf: function (key) { var r = rowOf(key); return r ? contactsOf(r) : null; },
    _mismatches: function (key) { var r = rowOf(key); return r ? mismatchesOf(r, contactsOf(r)) : null; },
    _tpls: TPLS, _tplOf: tplOf, _seedMail: function (key, tpl) { var r = rowOf(key); return r ? seedMail(r, tpl) : null; },
    _mail: function (key) { var r = rowOf(key); return r ? mailOf(r) : null; }, _readyOf: function (key) { var r = rowOf(key); return r ? readyOf(r) : null; },
    _logo: LOGO, _split: function () { return splitPct(); }, _access: ACC, _grant: GRANT, _readGrant: readGrant, _mailHtml: function (key) { var r = rowOf(key); return r ? mailHtml(mailOf(r)) : null; } };
})();
