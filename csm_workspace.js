/* csm_workspace.js — the CSM Workspace tab (window.CPL_CSM_WORKSPACE), #csm-workspace.
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
 * THE CONTACTS (S555): Contacts on file and Names, titles and emails open popups over MAP's directory, the landing
 * page and MAP's users; Write an email seeds To and Cc by template, takes More Cc from the picker, and copies the
 * formatted email for Outlook. All three sources are reviewer-gated in the database.
 *
 * The look is the CPL Commons' (Malone's CPL/AI palette) as the mock shows it; the dark theme maps every role onto a
 * First Light dark token. The priority cards fold behind one word for the visit (Sam's ask 18);
 * Today stays in the header either way, each count a word that opens its view (Sam, 2026-11-03, S564).
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
      "#tab-csm-workspace .today { margin:0; display:flex; flex-wrap:wrap; gap:4px 10px; align-items:baseline; font-size:.95rem; }",
      "#tab-csm-workspace .today b { color:var(--cw-heading); }",
      "#tab-csm-workspace .today .sep { color:var(--cw-muted); }",
      "#tab-csm-workspace .today .word { font-weight:500; font-size:inherit; }",
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
      "#tab-csm-workspace dialog.cdlg { border:1px solid var(--cw-line); border-radius:12px; padding:0; width:min(680px, calc(100vw - 32px)); max-height:min(86vh, 900px); background:var(--cw-surface); color:var(--cw-ink); box-shadow:0 18px 48px rgba(8,43,97,.22); }",
      "#tab-csm-workspace dialog.cdlg::backdrop { background:rgba(8,20,40,.45); }",
      "#tab-csm-workspace .cdlg-in { display:grid; gap:16px; padding:20px 22px 22px; }",
      "#tab-csm-workspace .cdlg-head { display:flex; justify-content:space-between; align-items:baseline; gap:12px; }",
      "#tab-csm-workspace .cdlg-head h3 { margin:0; font-family:var(--cw-serif); font-size:1.4rem; color:var(--cw-title); }",
      "#tab-csm-workspace .cdlg-src { display:grid; gap:6px; }",
      "#tab-csm-workspace .cdlg-src h4 { margin:0; font-size:.98rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .cdlg-src .tpl-meta { margin:0; }",
      "#tab-csm-workspace .fields { margin:0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:4px 18px; font-size:.9rem; }",
      "#tab-csm-workspace .fields li { display:flex; justify-content:space-between; gap:10px; border-top:1px solid var(--cw-line-soft); padding:4px 0; }",
      "#tab-csm-workspace .fields .off { color:var(--cw-ask-fg); background:var(--cw-ask-bg); border-radius:999px; padding:0 8px; font-size:.78rem; font-weight:700; white-space:nowrap; }",
      "#tab-csm-workspace .fields .on { color:var(--cw-muted); font-size:.82rem; white-space:nowrap; }",
      "#tab-csm-workspace .tags { display:flex; flex-wrap:wrap; gap:6px; }",
      "#tab-csm-workspace .diff { margin:0; padding:10px 12px; border-radius:8px; background:var(--cw-ask-bg); color:var(--cw-ask-fg); font-size:.9rem; }",
      "#tab-csm-workspace .cdlg-foot { display:flex; flex-wrap:wrap; gap:6px 20px; align-items:center; border-top:1px solid var(--cw-line-soft); padding-top:12px; }",
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
      "#tab-csm-workspace table.people { width:100%; border-collapse:collapse; font-size:.88rem; min-width:520px; }",
      "#tab-csm-workspace .people th, #tab-csm-workspace .people td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--cw-line-soft); vertical-align:top; }",
      "#tab-csm-workspace .people th { color:var(--cw-muted); font-weight:600; font-size:.8rem; position:sticky; top:0; background:var(--cw-surface); }",
      "#tab-csm-workspace .people .ph { color:var(--cw-muted); font-style:italic; }",
      "#tab-csm-workspace .people td:last-child { white-space:nowrap; }",
      "#tab-csm-workspace .ppl-tools { display:flex; flex-wrap:wrap; gap:4px 16px; align-items:center; }",
      "#tab-csm-workspace .ppl-scroll { max-height:52vh; overflow:auto; border:1px solid var(--cw-line-soft); border-radius:8px; }",
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
      "#tab-csm-workspace dialog.cdlg.wide { width:min(900px, calc(100vw - 32px)); }",
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
    "--cw-paper:#FFFFFF; --cw-paper-ink:#1C1C1A; --cw-dialog:#FFFFFF; --cw-serif:Georgia,'Times New Roman',serif; " +
    "--cw-sans:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;";
  var DARK = "--cw-page:var(--surface-muted); --cw-page-end:var(--surface-muted); --cw-surface:var(--surface); " +
    "--cw-ink:var(--text-body); --cw-ink-2:var(--text-body); --cw-muted:var(--text-muted); --cw-heading:var(--text-strong); " +
    "--cw-title:var(--text-strong); --cw-link:var(--cobalt); --cw-accent:var(--cobalt); --cw-gold:var(--gold-accent); " +
    "--cw-line:var(--border); --cw-line-soft:var(--border); --cw-field-line:var(--border-strong); --cw-track:var(--surface-muted); " +
    "--cw-pill-bg:var(--surface-muted); --cw-pill-fg:var(--text-body); --cw-ask-bg:var(--gold-soft); --cw-ask-fg:var(--mustard-text); " +
    "--cw-warn-fg:var(--danger-text); --cw-sel:var(--surface-muted); --cw-guide:var(--text-faint); --cw-paper:var(--surface); " +
    "--cw-paper-ink:var(--text-body); --cw-dialog:var(--surface-opaque);";
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
      "#tab-csm-workspace dialog.cdlg.cdlg { background:var(--cw-dialog); }",
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
  var state = { view: "open", q: "", sel: null, checks: {}, seen: {}, msg: "", draft: {} };
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
  var SENT = { accept: "Acceptance sent", accept_nc: "Attestation acceptance sent", nudge: "Nudge sent" };
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
  function isSent(r, tpl) { return !!(state.sent || {})[r.key + "|" + tpl] || !!lastSent(r, tpl); }
  function readyOf(r) {
    // No one marks a decline any more (Sam, 2026-11-09); a mark already on a notes row still keeps its college out.
    if (r.declined) return null;
    if (waitingKinds(r).length) return "wait";
    // state.sent bridges the moment between a Sent that saved and the log's re-read.
    if (r.part.confirmed && !isSent(r, "accept")) return "accept";
    if (r.nc && r.nc.standing && !isSent(r, "accept_nc")) return "accept_nc";
    if (r.part.confirmed) return null;
    return isSent(r, "nudge") || sentOf(r, NUDGE_SUBJ, 14) && !bouncedSince(r, NUDGE_SUBJ) ? null : "nudge";
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
    nudge: "Send the nudge for the participation confirmation." };
  function nextStep(r) {
    if (state.view === "send" && readyOf(r)) {
      var rw = readyOf(r), mw = rw === "accept" ? missingWords(r) : [];
      if (notReceived(r)) return "Resend the acceptance: confirmed " + shortDate(rw === "accept" ? r.part.confirmedAt : r.nc.confirmedAt) +
        ", and the first email did not reach the college." + (mw.length ? " Still waiting: " + mw.join("; ") + "." : "");
      return READY_WORDS[rw] + (mw.length ? " Still waiting: " + mw.join("; ") + "." : "");
    }
    var w = waitingKinds(r);
    if (w.length === 2) return "Review the participation confirmation and the noncredit attestation.";
    if (w[0] === "part") return "Review the participation confirmation.";
    if (w[0] === "nc") return "Review the noncredit attestation." + (r.part.confirmed ? "" : " The participation confirmation has not arrived.");
    var du = dueOf(r);
    if (du) return "Follow up" + (du.body ? ": " + du.body : "") + (/[.!?]$/.test(du.body || "") ? "" : ".");
    var st = stageOf(r);
    if (st === "held") { var m = missingWords(r); return "Confirmed. Follow up on: " + (m.length ? m.join("; ") : "a condition still pending") + "."; }
    if (st === "qual") return "Qualifies. Nothing waits.";
    return "No confirmation yet. Nudge it from Not yet confirmed.";
  }
  function pillsOf(r) {
    var p = [];
    if (r.part.waiting) p.push(["ask", "Confirmation waiting"]);
    if (ncWaiting(r)) p.push(["ask", "NC attestation waiting"]);
    var du = dueOf(r);
    if (du && du.follow_up_on <= today()) p.push(["ask", "Follow-up due"]);
    if (state.view === "send" && notReceived(r)) p.push(["ask", "Not received"]);
    var st = stageOf(r);
    p.push(["", st === "qual" ? "Qualifies" : st === "held" ? "Held by a condition" : r.part.confirmed ? "Confirmed" : "Not confirmed"]);
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
  var GROUPS = [{ id: "todo", label: "To do" }, { id: "browse", label: "Browse" }];
  function coordGap(r) { return r.conds.some(function (c) { return c.kind === "coord" && !c.met && !c.pending; }); }
  var VIEWS = {
    open: { g: "todo", label: "All open items", keep: function (r) { var s = stageOf(r); return s === "waiting" || s === "held" || !!dueOf(r); } },
    send: { g: "todo", label: "Ready to send", keep: function (r) { return !!readyOf(r); } },
    review: { g: "todo", label: "Waiting on the team", keep: function (r) { return stageOf(r) === "waiting"; } },
    due: { g: "todo", label: "Follow-ups open", keep: function (r) { return !!dueOf(r); } },
    held: { g: "todo", label: "Confirmed, still held", keep: function (r) { return stageOf(r) === "held"; } },
    nc: { g: "todo", label: "Noncredit attestations waiting", keep: ncWaiting },
    notyet: { g: "todo", label: "Not yet confirmed", bulk: true, keep: function (r) { return stageOf(r) === "notyet"; } },
    qual: { g: "browse", label: "Qualifies (all conditions met)", keep: function (r) { return stageOf(r) === "qual"; } },
    confirmed: { g: "browse", label: "Confirmed", keep: function (r) { return r.part.confirmed; } },
    coordmet: { g: "browse", label: "With a CPL Coordinator in MAP", keep: function (r) { return r.conds.some(function (c) { return c.kind === "coord" && c.met; }); } },
    ncmet: { g: "browse", label: "With a Noncredit CPL Lead", keep: ncMet },
    // A missing coordinator is status only: no CSM email for it, and Sam chases the confirmed ones himself (issue 3010,
    // his call 1), so both coordinator lists read under Browse. The first is the funding-held part of the second.
    coord: { g: "browse", label: "Confirmed but missing the CPL Coordinator in MAP",
      keep: function (r) { return r.part.confirmed && coordGap(r); } },
    nocoord: { g: "browse", label: "No CPL Coordinator in MAP", keep: coordGap },
    all: { g: "browse", label: "All institutions", keep: function () { return true; } } };
  /* The view a sign-in link returns to (cpl_session.js viewAddress); the address arrive() below opens. All open
     items is the tab's first view, so it reports the bare tab. */
  if (window.CPL_SESSION && CPL_SESSION.viewAddress) CPL_SESSION.viewAddress(TAB, function () {
    return VIEWS[state.view] && state.view !== "open" ? TAB + "/" + state.view : TAB;
  });
  var READY_RANK = { accept: 1, accept_nc: 2, nudge: 3, wait: 4 };
  function sortRank(r) {
    if (state.view === "send") return notReceived(r) ? 0 : READY_RANK[readyOf(r)] != null ? READY_RANK[readyOf(r)] : 5;
    var s = stageOf(r), du = dueOf(r);
    if (s === "waiting") return 0;
    if (du && du.follow_up_on <= today()) return 1;
    return s === "held" ? 2 : du ? 3 : s === "notyet" ? 4 : 5;
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
      return { kind: "Participation confirmation", items: items };
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
      : { t: "The Lead is published on the college's CPL landing page", s: "check", d: "Open the landing page and match the Lead's name." });
    items.push({ t: "The Lead's assignment gives time for the work", s: "check", d: a.lead_assignment ? "Given: " + a.lead_assignment + "." : "Not given." });
    items.push({ t: "The Lead meets regularly with credit CPL colleagues", s: "check", d: a.lead_meets ? "Given: " + a.lead_meets + "." : "Not given." });
    return { kind: "Noncredit CPL Lead attestation" + (r.nc && r.nc.fy ? ", " + r.nc.fy : ""),
      note: r.part.confirmed ? "" : "The college has not yet confirmed participation; the noncredit share also waits on that confirmation.",
      items: items };
  }
  var REQ_PILL = { form: ["", "Checked by the form"], meets: ["", "Meets"], check: ["ask", "Check this"], fails: ["fail", "Does not meet"] };
  function gid(key, kind) { return key + "|" + kind; }
  function reviewState(r, kind) {
    var R = reviewItems(r, kind); if (!R) return null;
    var ch = state.checks[gid(r.key, kind)] || {}, open = 0, fails = 0;
    R.items.forEach(function (it, i) { if (it.s === "check" && !ch[i]) open++; if (it.s === "fails") fails++; });
    return { R: R, open: open, fails: fails, seen: !!state.seen[gid(r.key, kind)] };
  }
  function gateWords(g) {
    if (!g.seen) return "Scroll through the review to open Accept and Deny.";
    if (g.fails) return g.fails + " requirement" + (g.fails === 1 ? " is" : "s are") + " not met. Deny with the reason, or Follow up and hold the request.";
    if (g.open) return g.open + " check" + (g.open === 1 ? "" : "s") + " left before Accept.";
    return "Every requirement is checked. Accept or Deny.";
  }
  function landingLink(r, words) {
    return r.landing ? '<a href="' + esc(r.landing) + '" target="_blank" rel="noopener" aria-label="' + esc(r.name) +
      ' CPL landing page (opens in a new tab)">' + esc(words || "CPL landing page") + "</a>" : "";
  }
  function reviewHtml(r, kind) {
    var g = reviewState(r, kind);
    if (!g) return '<section class="review"><h4>Review before you decide</h4><p class="gate">Sign in as a reviewer to read who sent the request.</p></section>';
    var ch = state.checks[gid(r.key, kind)] || {}, pre = "rv-" + kind;
    return '<section class="review" aria-labelledby="' + pre + '-h"><h4 id="' + pre + '-h">Review before you decide: ' + esc(g.R.kind) + "</h4>" +
      '<p class="links" style="margin:0">' + (landingLink(r, "Open the landing page") || '<span class="gate">No landing page address in MAP.</span>') + "</p>" +
      // The role in MAP already meets the condition: the box stays reachable and says nothing is owed (COBIx on PR 3012).
      (kind === "nc" && r.nc && r.nc.lead ? '<p class="gate" data-role-met="1">The Noncredit CPL Lead role is on the college\'s MAP landing page, which already meets this condition. Nothing here needs a decision.</p>' : "") +
      (g.R.note ? '<p class="gate">' + esc(g.R.note) + "</p>" : "") +
      '<ul class="reqs">' + g.R.items.map(function (it, i) {
        var pl = REQ_PILL[it.s], id = pre + "-ck-" + i;
        return '<li class="req"><span><span class="pill ' + pl[0] + '">' + pl[1] + "</span></span><span><b>" + esc(it.t) + '</b><span class="why">' + esc(it.d) +
          (/landing page/i.test(it.t) && r.landing ? " " + landingLink(r, "Open the page to check") : "") + "</span>" +
          // The role the reviewer confirmed, kept with the acceptance (Sam, 2026-11-10: "I meant for the reviewer to add").
          (it.s === "check" && /senior administrator/i.test(it.t) ? '<label class="rolefield" for="' + pre + '-role">Their role, as you confirmed it' +
            '<input id="' + pre + '-role" class="search" type="text" autocomplete="off" maxlength="120" data-role="' + kind + '" value="' +
            esc((state.roles || {})[gid(r.key, kind)] || "") + '"></label>' : "") +
          (it.s === "check" ? '<label class="ichk" for="' + id + '"><input id="' + id + '" type="checkbox" data-check="' + i + '" data-kind="' + kind + '"' +
            (ch[i] ? " checked" : "") + "> I checked this</label>" : "") + "</span></li>";
      }).join("") + "</ul>" +
      '<div class="verdict" data-verdict="' + kind + '" role="group" aria-label="Decide on the ' + esc(g.R.kind.toLowerCase()) + '">' +
        '<button type="button" class="word lead" data-act="accept" data-kind="' + kind + '"' + (g.seen && !g.open && !g.fails ? "" : " disabled") + ">Accept</button>" +
        '<button type="button" class="word danger" data-act="deny" data-kind="' + kind + '"' + (g.seen ? "" : " disabled") + ">Deny</button>" +
        '<button type="button" class="word" data-act="follow" data-kind="' + kind + '">Follow up</button>' +
        '<p class="gate" data-gate="' + kind + '" role="status">' + esc(gateWords(g)) + "</p></div></section>";
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
      '</div><ul class="queue" aria-label="' + esc(v.label) + '">' +
      (list.length ? list.map(function (r) {
        var ag = ageOf(r);
        return '<li><button type="button" class="row" data-sel="' + esc(r.key) + '"' + (r.key === state.sel ? ' aria-current="true"' : "") + ">" +
          '<span class="row-name">' + esc(r.name) + '</span><span class="row-age' + (ag.over ? " over" : "") + '">' + esc(ag.t) + "</span>" +
          '<span class="row-next">' + esc(nextStep(r)) + '</span><span class="row-pills">' +
          pillsOf(r).map(function (p) { return '<span class="pill ' + p[0] + '">' + esc(p[1]) + "</span>"; }).join("") + "</span></button></li>";
      }).join("") : '<li><p class="empty">Nothing here.</p></li>') + "</ul></div>";
  }
  function condLabel(c) { return c.pending ? "Pending" : c.met ? "Met" : "Not met"; }
  function recordHtml() {
    var r = state.sel ? rowOf(state.sel) : null;
    if (!r) return '<div class="pane"><p class="empty">Choose a college to see its record.</p></div>';
    var w = waitingKinds(r), act = [];
    if (w.length) act.push('<button type="button" class="word lead" data-act="toreview">Review the request</button>');
    if (S.reviewer && r.part.confirmed && r.req && r.req.part && r.req.part.email) act.push('<button type="button" class="word" data-act="mail" data-kind="part">Email the confirmation acceptance again</button>');
    if (S.reviewer && r.nc && r.nc.standing && r.req && r.req.nc && r.req.nc.attestor_email) act.push('<button type="button" class="word" data-act="mail" data-kind="nc">Email the attestation acceptance again</button>');
    if (S.reviewer) act.push('<button type="button" class="word" data-pop="contacts">Contacts on file</button>' +
      '<button type="button" class="word" data-pop="people">Names, titles and emails</button>');
    act.push('<button type="button" class="word" data-act="focus">Open in Implementation Funding</button>');
    if (S.reviewer) Object.keys(SENT).forEach(function (tpl) {
      if (lastSent(r, tpl)) act.push('<button type="button" class="word" data-act="bounced" data-kind="' + tpl + '">It bounced: ' +
        esc(SENT[tpl].replace(/ sent$/, "").toLowerCase()) + "</button>");
    });
    var conds = '<ul class="conds">' + r.conds.map(function (c) {
      return '<li class="cond"><span class="pill' + (c.met ? "" : c.pending ? "" : " ask") + '">' + condLabel(c) + "</span><span>" + esc(c.words) +
        (c.counts ? ' <span class="why">' + esc(c.counts) + "</span>" : "") + "</span></li>";
    }).join("") + "</ul>";
    var nc = r.nc ? '<p class="ncline">Noncredit share: ' + (r.nc.standing ? "Noncredit CPL Lead attested" + (r.nc.fy ? " for " + esc(r.nc.fy) : "") + "."
      : ncWaiting(r) ? "Noncredit CPL Lead attestation waiting since " + esc(shortDate(r.nc.at) || "it was sent") + "." : "Noncredit CPL Lead not yet attested.") +
      // The role on the college's MAP landing page (Sam, 2026-11-09): it meets the lead condition alone.
      (r.nc.lead ? " A Noncredit CPL Lead is on the college's MAP landing page, which meets the Noncredit CPL Lead condition."
        : r.nc.leadNear ? " The MAP landing page lists a close title. Ask the college to use the Noncredit CPL Lead role." : "") + "</p>" : "";
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
      ' <button type="button" class="word" data-act="focus">Write it in Implementation Funding</button></p></div>' : "";
    return '<div class="pane"><div class="rec">' +
      '<div class="rec-head"><div><h3 class="rec-name" id="cw-recname" tabindex="-1">' + esc(r.name) + '</h3><p class="rec-sub">' +
        esc([r.district, r.total ? "Max award " + money(r.total) + (r.floored ? " (Base)" : r.capped ? " (Cap)" : "") : ""].filter(Boolean).join(" · ")) + "</p></div>" +
        '<p class="links" style="margin:0">' + landingLink(r) + "</p></div>" +
      '<div class="decide" role="group" aria-label="Actions">' + act.join("") + "</div>" +
      '<p class="status" role="status" aria-live="polite">' + esc(state.msg) + "</p>" +
      '<div><p class="k">Minimum conditions</p>' + conds + nc + "</div>" + who +
      w.map(function (k) { return reviewHtml(r, k); }).join("") + note + composeHtml(r) + historyHtml(r) +
      "</div></div>";
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
    return '<div><p class="k" id="cw-log-h">History</p>' + form + items + "</div>";
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

  // ── the popups ──
  var lastOpener = null;
  function dialogShell(id, title, body, wide) {
    return '<dialog class="cdlg' + (wide ? " wide" : "") + '" id="' + id + '" aria-labelledby="' + id + '-h"><div class="cdlg-in">' +
      '<div class="cdlg-head"><h3 id="' + id + '-h" tabindex="-1">' + esc(title) + '</h3><button type="button" class="word" data-close="1">Close</button></div>' +
      body + "</div></dialog>";
  }
  function openDialog(html, opener) {
    closeDialog();
    lastOpener = opener || null;
    var host = document.createElement("div");
    host.id = "cw-dlg-host";
    host.innerHTML = html;
    root().appendChild(host);
    var dlg = host.querySelector("dialog");
    if (typeof dlg.showModal === "function") { try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); } }
    else dlg.setAttribute("open", "");
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); closeDialog(); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closeDialog(); } });
    var h = dlg.querySelector("h3"); if (h) h.focus();
    return dlg;
  }
  function closeDialog() {
    var host = document.getElementById("cw-dlg-host");
    if (!host) return;
    var dlg = host.querySelector("dialog");
    try { if (dlg && dlg.open && typeof dlg.close === "function") dlg.close(); } catch (e) {}
    host.parentNode.removeChild(host);
    if (lastOpener && document.body.contains(lastOpener)) lastOpener.focus();
    lastOpener = null;
  }
  function contactsDialogHtml(r) {
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
    var landingLinkHtml = c.landing ? '<a href="' + esc(c.landing) + '" target="_blank" rel="noopener">Open the landing page</a>' : "";
    return dialogShell("cw-cdlg", r.name + " contacts",
      (mm.length ? '<p class="diff">' + mm.map(esc).join("<br>") + "</p>" : '<p class="tpl-meta">The three sources agree on the coordinator and the primary contact.</p>') +
      '<section class="cdlg-src"><h4>MAP directory</h4>' + fields + "</section>" +
      '<section class="cdlg-src"><h4>Landing page</h4>' + land + "</section>" +
      '<section class="cdlg-src"><h4>MAP users by role</h4>' + users + "</section>" +
      '<div class="cdlg-foot">' + landingLinkHtml + '<button type="button" class="word" data-pop="people">Names, titles and emails</button>' +
        '<button type="button" class="word" data-copyaddr="all">Copy every address</button><span class="tpl-meta" role="status" data-copied="1"></span></div>');
  }
  var SOURCES = ["MAP directory", "Landing page", "MAP users"];
  function peopleDialogHtml(r, only) {
    var c = contactsOf(r), list = c.people.filter(function (p) { return !only || p.src === only; });
    var opts = '<option value="">Every source</option>' + SOURCES.map(function (s) { return '<option' + (s === only ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("");
    return dialogShell("cw-pdlg", r.name + ": names, titles and emails",
      '<div class="ppl-tools"><label for="cw-psrc">Show</label><select id="cw-psrc" data-psrc="1">' + opts + "</select>" +
        '<button type="button" class="word" data-copyaddr="shown">Copy the addresses shown</button><span class="tpl-meta" role="status" data-copied="1"></span></div>' +
      '<div class="ppl-scroll" role="region" aria-label="People on file" tabindex="0"><table class="people"><thead><tr>' +
        '<th scope="col">Source</th><th scope="col">Role or title</th><th scope="col">Name</th><th scope="col">Email</th></tr></thead><tbody>' +
        (list.length ? list.map(function (p) {
          return "<tr><td>" + esc(p.src) + "</td><td>" + esc(p.role) + "</td><td>" + (p.name ? esc(p.name) : '<span class="ph">Not given</span>') +
            "</td><td>" + (p.email ? esc(p.email) : '<span class="ph">None</span>') + "</td></tr>";
        }).join("") : '<tr><td colspan="4">No one on file from this source.</td></tr>') + "</tbody></table></div>", true);
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
    { id: "blank", label: "Blank" }];
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
      if (tplId === "nudge" && vpaa && vpaa.email.toLowerCase() !== prim.email.toLowerCase()) cc.push(vpaa.email);
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
    if (tplId === "follow") {
      subject = "CPL Implementation Funding: a follow-up for " + college;
      body = "Dear " + name + ",\n\nThank you for your work on CPL Implementation Funding at " + college + ". In reviewing the college's record, " +
        "the CPL Initiative team noticed the following:\n\n" + (r.note || (missing.length ? missing.join("\n") : "Write what the college can do here.")) +
        "\n\nWe would welcome a reply when this is in place, or a note if we have misread it.\n\nThe CPL Initiative team";
    } else if (tplId === "nudge") {
      subject = "CPL Implementation Funding: a participation confirmation for " + college;
      body = "Dear " + name + ",\n\nThe CPL Initiative team is writing about CPL Implementation Funding for " + college + ". Our records do not yet " +
        "show a participation confirmation, one of the minimum conditions an institution meets to qualify for its award." +
        (S.deadline ? " The deadline is " + longDay(S.deadline) + "." : "") + "\n\nThe CPL Implementation Funding page explains each condition and how to send it: " +
        PUBLIC_FUNDING_URL + "\n\nIf it is already on its way, or if someone else at " + college + " should receive this note, a short reply will let us update our records." +
        "\n\nThe CPL Initiative team";
    } else {
      body = "Dear " + name + ",\n\n\n\nThe CPL Initiative team";
    }
    return { tpl: tplId, to: to || "", cc: cc.join(", "), more: [], subject: subject, body: body };
  }
  var LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function longDay(v) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || "")); return m ? LONG[+m[2] - 1] + " " + +m[3] + ", " + m[1] : String(v || ""); }
  function mailKey(r) { var rd = state.view === "send" ? readyOf(r) : null; return SENT[rd] ? r.key + "|send" : r.key; }
  function mailOf(r) {
    state.mail = state.mail || {};
    // A college with no participation confirmation gets the nudge; any other college a follow-up. In Ready to send the
    // email is the one due (the acceptance or the nudge), kept under its own key so the record's draft is untouched.
    var rd = state.view === "send" ? readyOf(r) : null, k = mailKey(r);
    if (!state.mail[k]) state.mail[k] = seedMail(r, SENT[rd] ? rd : r.part.confirmed || r.part.waiting ? "follow" : "nudge");
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
    var opts = TEMPLATES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === m.tpl ? " selected" : "") + ">" + esc(t.label) + "</option>"; }).join("");
    return '<div class="tpl" aria-labelledby="cw-mail-h"><p class="k" id="cw-mail-h">Write an email</p>' +
      '<div class="tpl-row"><label for="cw-tpl">Template</label><select id="cw-tpl" data-mail="tpl">' + opts + "</select></div>" +
      '<dl class="addr"><dt><label for="cw-to">To</label></dt><dd><input id="cw-to" data-mail="to" value="' + esc(m.to) + '"></dd>' +
        '<dt><label for="cw-cc">Cc</label></dt><dd><input id="cw-cc" data-mail="cc" value="' + esc(m.cc) + '"></dd>' +
        '<dt><label for="cw-more">More Cc</label></dt><dd><input id="cw-more" data-mail="more" value="' + esc(m.more.join(", ")) + '"></dd>' +
        '<dt><label for="cw-subj">Subject</label></dt><dd><input id="cw-subj" data-mail="subject" value="' + esc(m.subject) + '"></dd></dl>' +
      ccPickerHtml(r, m) +
      '<label class="sr" for="cw-body">The email</label><textarea id="cw-body" class="search" data-mail="body" rows="10" style="min-height:180px;">' + esc(m.body) + "</textarea>" +
      '<div class="tpl-row"><button type="button" class="word lead" data-mailact="copy">Copy the email</button>' +
        '<button type="button" class="word" data-mailact="draft">Open in Outlook</button>' +
        '<button type="button" class="word" data-mailact="gmail">Open in Gmail</button>' +
        (state.view === "send" && SENT[readyOf(r)] ? '<button type="button" class="word" data-mailact="sent">Sent</button>' : "") +
        '<label for="cw-mailfu"><input type="checkbox" id="cw-mailfu" data-mail="fu"' + (m.fu === false ? "" : " checked") + "> Follow up in a week</label></div>" +
      '<p class="tpl-meta">Send from your own address. The shared MAP mailbox needs Send As rights from RCCD IT.</p>' +
      '<p class="tpl-meta">The workspace never sends mail. Copy the email puts it on the clipboard, logo included, to paste into Outlook or Gmail; Open in Outlook and Open in Gmail start a draft with the words and no logo. The log notes each.' +
      (state.view === "send" ? " Sent records that you sent it, and the college leaves Ready to send." : "") + "</p></div>";
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
    var m = mailOf(r), cc = allCc(m);
    if (!m.to) { say("Give the email an address in To first."); var t = document.getElementById("cw-to"); if (t) t.focus(); return; }
    var logIt = function (what) {
      logWrite("POST", null, Object.assign({ college: r.key, kind: "email",
        body: what + ": " + (m.subject || "(no subject)") + ", to " + m.to + (cc.length ? " with " + cc.length + " on Cc" : "") + "." },
        m.fu === false ? {} : { follow_up_on: plusDays(7) }));
    };
    if (kind === "sent") {
      var what = SENT[m.tpl] || "Email sent";
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
  function boardHtml() {
    return '<div class="board">' + STAGES.map(function (st) {
      var list = S.rows.filter(function (r) { return stageOf(r) === st.id; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      return '<div class="col"><div class="col-h"><button type="button" class="word" data-stage="' + st.id + '">' + esc(st.label) + '</button><span class="col-n">' + list.length + "</span></div>" +
        '<p class="col-what">' + esc(st.what) + '</p><div class="chips">' +
        list.map(function (r) { return '<button type="button" class="chip" data-sel="' + esc(r.key) + '">' + esc(r.name) + "</button>"; }).join("") + "</div></div>";
    }).join("") + "</div>";
  }
  function todayHtml() {
    var w = S.rows.filter(function (r) { return stageOf(r) === "waiting"; }).length;
    var h = S.rows.filter(function (r) { return stageOf(r) === "held"; }).length;
    var q = S.rows.filter(function (r) { return stageOf(r) === "qual"; }).length;
    var n = S.rows.filter(function (r) { return stageOf(r) === "notyet"; }).length;
    var go = function (view, t) { return '<button type="button" class="word" data-view="' + view + '" aria-pressed="' + (state.view === view) + '">' + t + "</button>"; };
    var sep = '<span class="sep" aria-hidden="true">·</span>';
    return '<p class="today"><b>Today</b>' + go("review", w + " waiting on the team") + sep + go("held", h + " confirmed and held") + sep +
      go("qual", q + " qualify") + sep + go("notyet", n + " not yet confirmed") +
      (S.deadline ? sep + "<span>Confirmation due " + esc(shortDate(S.deadline)) + "</span>" : "") + "</p>";
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
      GRANT.msg = a && a.ok ? "Asked. An approver will see it in the CSM Workspace. Keep this tab open: it picks the access up when one of them approves."
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
  function accessHtml() {
    if (!ACC.rows.length && !ACC.approver) return "";
    var check = '<button type="button" class="word" data-access="check">Check now</button>';
    if (!ACC.rows.length) {
      return '<section class="sec" aria-labelledby="cw-acc-h"><div class="sec-h"><h2 id="cw-acc-h">Access requests</h2><p class="note">' +
        "No one is waiting. A teammate who is signed out opens this page, enters their work email and chooses Ask an approver; " +
        "the request shows here within half a minute. " + check + "</p></div></section>";
    }
    return '<section class="sec" aria-labelledby="cw-acc-h"><div class="sec-h"><h2 id="cw-acc-h">Access requests</h2><p class="note">' +
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
    if (!f) { el.innerHTML = '<p class="empty">Loading the CSM Workspace&hellip;</p>'; return; }
    S = f.snapshot();
    if (S.reviewer && !LOG.asked) loadLog();
    if (S.reviewer && CT.state === "idle") loadContacts();
    var dlgHost = document.getElementById("cw-dlg-host");
    if (dlgHost) dlgHost.parentNode.removeChild(dlgHost);
    var ae = document.activeElement, focusId = ae && el.contains(ae) ? ae.id : null;
    var focusSel = ae && el.contains(ae) ? ae.getAttribute("data-sel") : null;
    el.innerHTML = '<div class="cw"><div class="page"><div class="wrap">' +
      '<header><div class="top-row"><h1>CSM Workspace</h1><p class="links">' +
        '<a href="#implementation-funding">Implementation Funding</a></p></div>' +
        '<div class="rule" aria-hidden="true"></div>' + todayHtml() + "</header>" +
      (S.reviewer ? (GRANT.ok === false ? grantHtml() : accessHtml()) : '<p class="signin">Sign in as a MAP team reviewer to read who sent each request and to accept, deny or follow up. The counts below are the public ones.</p><div id="cw-signin"></div>') +
      '<section class="sec" aria-labelledby="cw-ac-h"><div class="sec-h"><h2 id="cw-ac-h">Action center</h2><p class="note">' +
        (S.loaded ? "Read live from the funding tab." : "Loading the requests&hellip;") + "</p></div>" +
        '<div class="center" id="cw-center" style="' + splitStyle() + '">' + queueHtml() + splitHtml() + '<div id="cw-record">' + recordHtml() + "</div></div></section>" +
      '<section class="sec" aria-labelledby="cw-bd-h"><h2 id="cw-bd-h">Where the ' + S.rows.length + " stand</h2>" + boardHtml() + "</section>" +
      '<footer class="foot"><span>The workspace never sends mail: every email opens for you to send from Outlook or Gmail.</span>' +
        '<a href="#implementation-funding">Implementation Funding</a></footer>' +
      "</div></div></div>";
    if (dlgHost) el.appendChild(dlgHost);
    var sm = document.getElementById("cw-signin");
    if (sm && window.CPL_REVIEWER_SIGNIN && typeof window.CPL_REVIEWER_SIGNIN.mountInto === "function") {
      window.CPL_REVIEWER_SIGNIN.mountInto(sm, { title: "Sign in to the CSM Workspace", door: true,
        blurb: "Email me a link sends a one-time sign-in link. When it does not arrive, Ask an approver: one of the funding approvers approves from this page, and this tab signs you in. Either way the workspace knows it is you." });
    }
    if (S.reviewer && !ACC.asked) loadAccess();
    if (focusId && document.getElementById(focusId)) document.getElementById(focusId).focus();
    else if (focusSel) { var b = el.querySelector('.row[data-sel="' + cssEsc(focusSel) + '"]'); if (b) b.focus(); }
    watchReviews();
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }
  function paintRecord() {
    var rec = document.getElementById("cw-record"); if (!rec) return paint();
    rec.innerHTML = recordHtml();
    Array.prototype.forEach.call(root().querySelectorAll(".row[data-sel]"), function (b) {
      if (b.getAttribute("data-sel") === state.sel) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    watchReviews();
  }
  function refreshVerdicts() {
    var r = rowOf(state.sel); if (!r) return;
    waitingKinds(r).forEach(function (kind) {
      var g = reviewState(r, kind); if (!g) return;
      var v = root().querySelector('[data-verdict="' + kind + '"]'); if (!v) return;
      var a = v.querySelector('[data-act="accept"]'), d = v.querySelector('[data-act="deny"]'), gt = v.querySelector("[data-gate]");
      if (a) a.disabled = !(g.seen && !g.open && !g.fails);
      if (d) d.disabled = !g.seen;
      if (gt) gt.textContent = gateWords(g);
    });
  }
  // Accept and Deny open once the reviewer has scrolled the review's foot into view.
  var obs = null;
  function watchReviews() {
    if (obs) { obs.disconnect(); obs = null; }
    var r = rowOf(state.sel); if (!r) return;
    var key = r.key, pending = waitingKinds(r).filter(function (k) { return !state.seen[gid(key, k)]; });
    if (!pending.length) return;
    if (!("IntersectionObserver" in window)) { pending.forEach(function (k) { state.seen[gid(key, k)] = true; }); refreshVerdicts(); return; }
    obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting || state.sel !== key) return;
        state.seen[gid(key, en.target.getAttribute("data-verdict"))] = true;
        refreshVerdicts();
      });
    }, { threshold: 1 });
    pending.forEach(function (k) { var v = root().querySelector('[data-verdict="' + k + '"]'); if (v) obs.observe(v); });
  }

  // ── the controls ─────────────────────────────────────────────────────────
  function say(t) { state.msg = t; var s = root() && root().querySelector(".status"); if (s) s.textContent = t; }
  function act(name, kind) {
    var f = F(), r = rowOf(state.sel);
    if (name === "nudge") { if (f) f.nudge(); return; }
    if (!r) return;
    if (name === "toreview") { var rv = root().querySelector(".review h4"); if (rv) { rv.setAttribute("tabindex", "-1"); rv.focus(); if (rv.scrollIntoView) rv.scrollIntoView({ block: "start" }); } return; }
    if (name === "focus") { if (f) f.focus(r.key); return; }
    if (!f || !S.reviewer) return;
    if (name === "bounced") {
      var ls = lastSent(r, kind);
      if (!ls) return;
      logWrite("POST", null, { college: r.key, kind: "email", body: "It bounced, " + ls.body }).then(function (ok) {
        if (!ok) return;
        if (state.sent) delete state.sent[r.key + "|" + kind];
        paint();
        say("Noted that it bounced. " + r.name + " is back in Ready to send.");
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
      say(name === "accept" ? "Accepted. The acceptance email opens for you to copy." : name === "deny" ? "Denied: the request is removed." :
        name === "follow" ? "The follow-up email opens for you to edit and copy." : "The acceptance email opens again for you to copy.");
      return true;
    });
  }
  function onClick(e) {
    var t = e.target.closest ? e.target.closest("button, [data-sel]") : null;
    if (!t || !root().contains(t)) return;
    if (t.hasAttribute("data-sel")) { state.sel = t.getAttribute("data-sel"); state.msg = ""; paintRecord(); var h = document.getElementById("cw-recname");
      if (h && t.classList.contains("chip")) h.focus(); return; }
    if (t.hasAttribute("data-view")) { state.view = t.getAttribute("data-view"); state.sel = null; paint(); return; }
    if (t.hasAttribute("data-stage")) { var s = t.getAttribute("data-stage"); state.view = s === "waiting" ? "review" : s; state.sel = null; paint(); return; }
    if (t.hasAttribute("data-close")) { closeDialog(); return; }
    if (t.hasAttribute("data-pop")) {
      var pr = rowOf(state.sel); if (!pr) return;
      var opener = t.closest("dialog") ? lastOpener : t;
      var pop = function () {
        if (CT.state === "error") { say(CT.error); return; }
        openDialog(t.getAttribute("data-pop") === "people" ? peopleDialogHtml(pr, "") : contactsDialogHtml(pr), opener);
      };
      if (CT.state === "ready") pop(); else { say("Reading the contacts on file…"); loadContacts().then(pop); }
      return;
    }
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
    if (t.hasAttribute && t.hasAttribute("data-psrc")) {
      var pr = rowOf(state.sel); if (!pr) return;
      openDialog(peopleDialogHtml(pr, t.value), lastOpener);
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
  function onInput(e) {
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
  function fresh() { state.view = "open"; state.q = ""; state.sel = null; state.msg = ""; LOG.asked = false; }
  /* #csm-workspace/<view> opens that view of the action center, read after fresh() on every visit; a bare
     #csm-workspace (what the side menu writes) or an unknown word keeps All open items. */
  function arrive() {
    var a = window.CPL_SESSION && CPL_SESSION.arrival ? CPL_SESSION.arrival(TAB) : null;
    if (a && a[0] && Object.prototype.hasOwnProperty.call(VIEWS, a[0])) state.view = a[0];
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
      el.addEventListener("pointerdown", onSplitDown);
      el.addEventListener("change", onChange);
      el.addEventListener("input", onInput);
      el.addEventListener("submit", onSubmit);
      el.addEventListener("toggle", function (e) { if (e.target.classList && e.target.classList.contains("ccpick")) state.ccOpen = e.target.open; }, true);
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
    _state: state, _stageOf: stageOf, _reviewItems: reviewItems, _nextStep: nextStep, _snapshot: function () { return S; },
    _log: function () { return LOG.rows; }, _dueOf: dueOf,
    _readAccess: readAccess,
    _setContacts: function (o) { CT.dir = o.dir || []; CT.landing = o.landing || []; CT.users = o.users || []; CT.state = "ready"; },
    _contactsOf: function (key) { var r = rowOf(key); return r ? contactsOf(r) : null; },
    _mismatches: function (key) { var r = rowOf(key); return r ? mismatchesOf(r, contactsOf(r)) : null; },
    _mail: function (key) { var r = rowOf(key); return r ? mailOf(r) : null; }, _readyOf: function (key) { var r = rowOf(key); return r ? readyOf(r) : null; },
    _logo: LOGO, _split: function () { return splitPct(); }, _access: ACC, _grant: GRANT, _readGrant: readGrant, _mailHtml: function (key) { var r = rowOf(key); return r ? mailHtml(mailOf(r)) : null; } };
})();
