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
 * What PR 1 leaves for the communications log (its own table, mapped in kb/governance_surface_map.json first, Rule
 * 10 a3): the history of each college, notes and follow-up dates by activity, the Cc picker and the contacts popups.
 *
 * The look is the CPL Commons' (Malone's CPL/AI palette) as the mock shows it; the dark theme maps every role onto a
 * First Light dark token. The top (Today and the priority cards) folds behind one word for the visit (Sam's ask 18).
 *
 * Tests: tests/csm_workspace.test.js
 */
(function () {
  var RULES = [
      "#tab-csm-workspace .page { padding-block:28px 48px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }",
      "#tab-csm-workspace .wrap { max-width:1240px; margin:0 auto; display:grid; gap:24px; }",
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
      "#tab-csm-workspace .rule { width:66px; height:4px; background:var(--cw-gold); margin:16px 0 14px; }",
      "#tab-csm-workspace .lede { margin:0; color:var(--cw-ink-2); font-size:1.08rem; max-width:72ch; }",
      "#tab-csm-workspace .today { margin:12px 0 0; display:flex; flex-wrap:wrap; gap:4px 10px; align-items:baseline; font-size:.95rem; }",
      "#tab-csm-workspace .today b { color:var(--cw-heading); }",
      "#tab-csm-workspace .today .sep { color:var(--cw-muted); }",
      "#tab-csm-workspace h2 { margin:0; font-family:var(--cw-serif); font-size:1.3rem; color:var(--cw-heading); }",
      "#tab-csm-workspace .sec { display:grid; gap:12px; }",
      "#tab-csm-workspace .sec-h { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:6px 20px; }",
      "#tab-csm-workspace .note { margin:0; color:var(--cw-muted); font-size:.9rem; }",
      "#tab-csm-workspace .needs-row { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:16px; }",
      "#tab-csm-workspace .cohort-row { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; }",
      "#tab-csm-workspace .card { background:var(--cw-surface); border:1px solid var(--cw-line); border-radius:12px; padding:18px 20px; display:flex; flex-direction:column; gap:10px; min-width:0; }",
      "#tab-csm-workspace .card.needs { border-top:4px solid var(--cw-gold); padding:20px 22px; }",
      "#tab-csm-workspace .card.on { border-color:var(--cw-accent); box-shadow:0 0 0 1px var(--cw-accent); }",
      "#tab-csm-workspace .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }",
      "#tab-csm-workspace .card-name { margin:0; font-family:var(--cw-serif); font-size:1.15rem; line-height:1.25; color:var(--cw-heading); }",
      "#tab-csm-workspace .needs .card-name { font-size:1.3rem; }",
      "#tab-csm-workspace .big { margin:0; font-family:var(--cw-serif); font-size:2rem; font-weight:700; color:var(--cw-title); letter-spacing:-0.02em; font-variant-numeric:tabular-nums; line-height:1; }",
      "#tab-csm-workspace .needs .big { font-size:2.8rem; }",
      "#tab-csm-workspace .big small { font-family:var(--cw-sans); font-size:.95rem; font-weight:400; color:var(--cw-muted); letter-spacing:0; }",
      "#tab-csm-workspace .card-what { margin:0; color:var(--cw-ink-2); font-size:.92rem; line-height:1.45; }",
      "#tab-csm-workspace .card-list { margin:0; padding:0; list-style:none; display:grid; gap:2px; font-size:.92rem; }",
      "#tab-csm-workspace .card-list li { display:flex; justify-content:space-between; gap:12px; border-top:1px solid var(--cw-line-soft); padding:5px 0; }",
      "#tab-csm-workspace .card-list li span:last-child { color:var(--cw-muted); font-variant-numeric:tabular-nums; white-space:nowrap; }",
      "#tab-csm-workspace .card .word { margin-top:auto; }",
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
      "#tab-csm-workspace .center { display:grid; grid-template-columns:minmax(0, 5fr) minmax(0, 7fr); gap:16px; align-items:start; }",
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
      "@media (max-width: 960px) { #tab-csm-workspace .cohort-row { grid-template-columns:repeat(2, minmax(0, 1fr)); } #tab-csm-workspace .center { grid-template-columns:minmax(0, 1fr); } #tab-csm-workspace .board { grid-template-columns:repeat(2, minmax(0, 1fr)); } #tab-csm-workspace .back { display:inline-flex; } }",
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
    "--cw-paper:#FFFFFF; --cw-paper-ink:#1C1C1A; --cw-serif:Georgia,'Times New Roman',serif; " +
    "--cw-sans:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;";
  var DARK = "--cw-page:var(--surface-muted); --cw-page-end:var(--surface-muted); --cw-surface:var(--surface); " +
    "--cw-ink:var(--text-body); --cw-ink-2:var(--text-body); --cw-muted:var(--text-muted); --cw-heading:var(--text-strong); " +
    "--cw-title:var(--text-strong); --cw-link:var(--cobalt); --cw-accent:var(--cobalt); --cw-gold:var(--gold-accent); " +
    "--cw-line:var(--border); --cw-line-soft:var(--border); --cw-field-line:var(--border-strong); --cw-track:var(--surface-muted); " +
    "--cw-pill-bg:var(--surface-muted); --cw-pill-fg:var(--text-body); --cw-ask-bg:var(--gold-soft); --cw-ask-fg:var(--mustard-text); " +
    "--cw-warn-fg:var(--danger-text); --cw-sel:var(--surface-muted); --cw-guide:var(--text-faint); --cw-paper:var(--surface); " +
    "--cw-paper-ink:var(--text-body);";
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
      "#tab-csm-workspace .signin { margin:0; padding:10px 14px; border-radius:8px; background:var(--cw-pill-bg); color:var(--cw-pill-fg); font-size:.92rem; }"
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
  var state = { view: "open", q: "", sel: null, folded: false, checks: {}, seen: {}, msg: "" };
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
  function waitingKinds(r) {
    var k = [];
    if (r.part.waiting) k.push("part");
    if (r.nc && r.nc.waiting) k.push("nc");
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
  function nextStep(r) {
    var w = waitingKinds(r);
    if (w.length === 2) return "Review the participation confirmation and the noncredit attestation.";
    if (w[0] === "part") return "Review the participation confirmation.";
    if (w[0] === "nc") return "Review the noncredit attestation." + (r.part.confirmed ? "" : " The participation confirmation has not arrived.");
    if (r.declined) return "Declined participation on " + shortDate(r.declined) + ".";
    var st = stageOf(r);
    if (st === "held") { var m = missingWords(r); return "Confirmed. Follow up on: " + (m.length ? m.join("; ") : "a condition still pending") + "."; }
    if (st === "qual") return "Qualifies. Nothing waits.";
    return "No confirmation yet. Nudge it from Not yet confirmed.";
  }
  function pillsOf(r) {
    var p = [];
    if (r.part.waiting) p.push(["ask", "Confirmation waiting"]);
    if (r.nc && r.nc.waiting) p.push(["ask", "NC attestation waiting"]);
    if (r.declined) p.push(["ask", "Declined"]);
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
    return { t: "", over: false };
  }

  var VIEWS = {
    open: { label: "All open items", keep: function (r) { var s = stageOf(r); return s === "waiting" || s === "held"; } },
    review: { label: "Waiting on the team", keep: function (r) { return stageOf(r) === "waiting"; } },
    held: { label: "Confirmed, still held", keep: function (r) { return stageOf(r) === "held"; } },
    notyet: { label: "Not yet confirmed", bulk: true, keep: function (r) { return stageOf(r) === "notyet"; } },
    nc: { label: "Noncredit attestations waiting", keep: function (r) { return !!(r.nc && r.nc.waiting); } },
    coord: { label: "Confirmed but missing the CPL Coordinator in MAP",
      keep: function (r) { return r.part.confirmed && r.conds.some(function (c) { return c.kind === "coord" && !c.met && !c.pending; }); } },
    confirmed: { label: "Confirmed", keep: function (r) { return r.part.confirmed; } },
    qual: { label: "Qualifies", keep: function (r) { return stageOf(r) === "qual"; } },
    all: { label: "All institutions", keep: function () { return true; } } };
  function sortRank(r) {
    var s = stageOf(r);
    return s === "waiting" ? 0 : s === "held" ? 1 : s === "notyet" ? 2 : 3;
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
        : { t: "Sent by a senior administrator", s: "check", d: "Title given: " + titleLabel(S.partTitles, q.title) + ". Confirm the sender's role before you accept." });
      var mu = ownMap(q.ctx), lp = ownLanding(q.ctx);
      items.push(mu.length || lp.length
        ? { t: "The sender matches someone MAP shows for the college", s: "meets",
            d: [mu.length ? "MAP role: " + mu.map(function (u) { return u.role || "user"; }).join(", ") : "",
                lp.length ? "On the landing page as " + lp.map(function (l) { return l.title || "a contact"; }).join(" and ") : ""].filter(Boolean).join(". ") + "." }
        : { t: "The sender matches someone MAP shows for the college", s: "check",
            d: q.ctx ? "Not a MAP user at the college and not on its landing page." : "The requester context has not loaded." });
      items.push(r.declined
        ? { t: "The college has not declined", s: "fails", n: "the college declined participation", d: "Declined on " + shortDate(r.declined) + "." }
        : { t: "The college has not declined", s: "meets", d: "No decline on file." });
      return { kind: "Participation confirmation", items: items };
    }
    var a = r.req && r.req.nc;
    if (!a) return null;
    items.push({ t: "Sent from the college's or district's email domain", s: "form", d: (domainOf(a.attestor_email) || "The address") + ", checked by the form when it was sent." });
    items.push(a.attestor_title && a.attestor_title !== "Other"
      ? { t: "Sent by a senior administrator", s: "meets", d: "Title given: " + titleLabel(S.ncTitles, a.attestor_title) + "." }
      : { t: "Sent by a senior administrator", s: "check", d: "Title given: " + titleLabel(S.ncTitles, a.attestor_title) + ". Confirm the sender's role before you accept." });
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
      (g.R.note ? '<p class="gate">' + esc(g.R.note) + "</p>" : "") +
      '<ul class="reqs">' + g.R.items.map(function (it, i) {
        var pl = REQ_PILL[it.s], id = pre + "-ck-" + i;
        return '<li class="req"><span><span class="pill ' + pl[0] + '">' + pl[1] + "</span></span><span><b>" + esc(it.t) + '</b><span class="why">' + esc(it.d) +
          (/landing page/i.test(it.t) && r.landing ? " " + landingLink(r, "Open the page to check") : "") + "</span>" +
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
  function card(id, name, big, small, what, list, word, needs) {
    return '<article class="card' + (needs ? " needs" : "") + (state.view === word ? " on" : "") + '" aria-labelledby="' + id + '">' +
      '<div class="card-head"><h3 class="card-name" id="' + id + '">' + esc(name) + "</h3></div>" +
      '<p class="big">' + big + (small ? " <small>" + esc(small) + "</small>" : "") + "</p>" +
      (what ? '<p class="card-what">' + esc(what) + "</p>" : "") +
      (list && list.length ? '<ul class="card-list">' + list.map(function (li) { return "<li><span>" + esc(li[0]) + "</span><span>" + esc(li[1]) + "</span></li>"; }).join("") + "</ul>" : "") +
      '<button type="button" class="word" data-view="' + word + '" aria-pressed="' + (state.view === word) + '">Show them in the action center</button></article>';
  }
  function meter(n, d) { return '<div class="meter" aria-hidden="true"><i style="width:' + (d ? Math.round(n / d * 100) : 0) + '%"></i></div>'; }
  function cardsHtml() {
    var rows = S.rows, tot = rows.length;
    var waiting = rows.filter(function (r) { return stageOf(r) === "waiting"; });
    var held = rows.filter(function (r) { return stageOf(r) === "held"; });
    var conf = rows.filter(function (r) { return r.part.confirmed; });
    var ncRows = rows.filter(function (r) { return r.nc; }), ncDone = ncRows.filter(function (r) { return r.nc.standing; });
    var coordRows = rows.filter(function (r) { return r.conds.some(function (c) { return c.kind === "coord"; }); });
    var coordMet = coordRows.filter(function (r) { return r.conds.some(function (c) { return c.kind === "coord" && c.met; }); });
    var heldWhy = {};
    held.forEach(function (r) { missingWords(r).forEach(function (w) { heldWhy[w] = (heldWhy[w] || 0) + 1; }); });
    return '<div class="needs-row">' +
      card("cw-c1", "Waiting on the team", String(waiting.length), waiting.length === 1 ? "request" : "requests",
        "Requests the team reviews before the college's condition counts.",
        waiting.slice(0, 6).map(function (r) { return [r.name, ageOf(r).t.replace("Waiting since ", "since ")]; }), "review", true) +
      card("cw-c2", "Confirmed, still held", String(held.length), "institutions",
        "Confirmed, and funding stays held until every minimum condition is met.",
        Object.keys(heldWhy).sort(function (a, b) { return heldWhy[b] - heldWhy[a]; }).map(function (w) { return [w, String(heldWhy[w])]; }), "held", true) +
      "</div><div class=\"cohort-row\">" +
      card("cw-c3", "Confirmed", String(conf.length), "of " + tot, "", null, "confirmed", false).replace('<button', meter(conf.length, tot) + "<button") +
      card("cw-c4", "Noncredit CPL Lead attested", String(ncDone.length), "of " + ncRows.length, "Institutions whose award carries a noncredit share.", null, "nc", false)
        .replace('<button', meter(ncDone.length, ncRows.length) + "<button") +
      card("cw-c5", "CPL Coordinator in MAP", S.coordOk ? String(coordMet.length) : "&hellip;", S.coordOk ? "of " + coordRows.length : "loading", "", null, "coord", false)
        .replace('<button', meter(coordMet.length, coordRows.length) + "<button") +
      "</div>";
  }
  function queueHtml() {
    var list = shownRows(), v = VIEWS[state.view] || VIEWS.open;
    // A decided college may leave the view (accepted, it moves on); its record stays until another is chosen.
    if (!state.sel && list.length) state.sel = list[0].key;
    var opts = Object.keys(VIEWS).map(function (k) { return '<option value="' + k + '"' + (k === state.view ? " selected" : "") + ">" + esc(VIEWS[k].label) + "</option>"; }).join("");
    return '<div class="pane" aria-labelledby="cw-q-h"><div class="pane-h">' +
      '<p class="showing" id="cw-q-h"><b>' + list.length + "</b> " + esc(v.label.toLowerCase()) + "</p>" +
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
    act.push('<button type="button" class="word" data-act="focus">Open in Implementation Funding</button>');
    if (S.reviewer) act.push('<button type="button" class="word" data-act="declined">' + (r.declined ? "Clear Declined participation" : "Mark Declined participation") + "</button>");
    var conds = '<ul class="conds">' + r.conds.map(function (c) {
      return '<li class="cond"><span class="pill' + (c.met ? "" : c.pending ? "" : " ask") + '">' + condLabel(c) + "</span><span>" + esc(c.words) +
        (c.counts ? ' <span class="why">' + esc(c.counts) + "</span>" : "") + "</span></li>";
    }).join("") + "</ul>";
    var nc = r.nc ? '<p class="ncline">Noncredit share: ' + (r.nc.standing ? "Noncredit CPL Lead attested" + (r.nc.fy ? " for " + esc(r.nc.fy) : "") + "."
      : r.nc.waiting ? "Noncredit CPL Lead attestation waiting since " + esc(shortDate(r.nc.at) || "it was sent") + "." : "Noncredit CPL Lead not yet attested.") + "</p>" : "";
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
      w.map(function (k) { return reviewHtml(r, k); }).join("") + note +
      "</div></div>";
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
    return '<p class="today"><b>Today</b><span>' + w + " waiting on the team</span><span class=\"sep\">·</span><span>" + h +
      " confirmed and held</span><span class=\"sep\">·</span><span>" + q + " qualify</span><span class=\"sep\">·</span><span>" + n +
      " not yet confirmed</span>" + (S.deadline ? '<span class="sep">·</span><span>Confirmation due ' + esc(shortDate(S.deadline)) + "</span>" : "") + "</p>";
  }
  function paint() {
    var el = root(); if (!el) return;
    var f = F();
    if (!f) { el.innerHTML = '<p class="empty">Loading the CSM Workspace&hellip;</p>'; return; }
    S = f.snapshot();
    var ae = document.activeElement, focusId = ae && el.contains(ae) ? ae.id : null;
    var focusSel = ae && el.contains(ae) ? ae.getAttribute("data-sel") : null;
    el.innerHTML = '<div class="cw"><div class="page"><div class="wrap">' +
      '<header><div class="top-row"><h1>CSM Workspace</h1><p class="links">' +
        '<a href="#implementation-funding">Implementation Funding</a>' +
        '<button type="button" class="word" data-act="fold" aria-expanded="' + !state.folded + '" aria-controls="cw-fold">' +
        (state.folded ? "Show the summary" : "Hide the summary") + "</button></p></div>" +
        '<div class="rule" aria-hidden="true"></div>' +
        '<p class="lede">What waits on the CPL Initiative team for each college\'s Implementation Funding: requests to review, follow-ups and acceptances.</p></header>' +
      (S.reviewer ? "" : '<p class="signin">Sign in as a MAP team reviewer to read who sent each request and to accept, deny or follow up. The counts below are the public ones.</p>') +
      '<div id="cw-fold" class="cw-fold"' + (state.folded ? " hidden" : "") + ">" + todayHtml() +
        '<section class="sec" aria-labelledby="cw-pri-h" style="margin-top:20px"><h2 id="cw-pri-h">Priorities</h2>' + cardsHtml() + "</section></div>" +
      '<section class="sec" aria-labelledby="cw-ac-h"><div class="sec-h"><h2 id="cw-ac-h">Action center</h2><p class="note">' +
        (S.loaded ? "Read live from the funding tab." : "Loading the requests&hellip;") + "</p></div>" +
        '<div class="center">' + queueHtml() + '<div id="cw-record">' + recordHtml() + "</div></div></section>" +
      '<section class="sec" aria-labelledby="cw-bd-h"><h2 id="cw-bd-h">Where the ' + S.rows.length + " stand</h2>" + boardHtml() + "</section>" +
      '<footer class="foot"><span>The workspace never sends mail: every email opens for you to copy into Outlook.</span>' +
        '<a href="#implementation-funding">Implementation Funding</a></footer>' +
      "</div></div></div>";
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
    if (name === "fold") { state.folded = !state.folded; paint(); var b = root().querySelector('[data-act="fold"]'); if (b) b.focus(); return; }
    if (name === "nudge") { if (f) f.nudge(); return; }
    if (!r) return;
    if (name === "toreview") { var rv = root().querySelector(".review h4"); if (rv) { rv.setAttribute("tabindex", "-1"); rv.focus(); if (rv.scrollIntoView) rv.scrollIntoView({ block: "start" }); } return; }
    if (name === "focus") { if (f) f.focus(r.key); return; }
    if (name === "declined") {
      if (!f) return;
      f.setDeclined(r.key, !r.declined);
      say(r.declined ? "Declined participation cleared for " + r.name + "." : r.name + " is marked Declined participation.");
      return;
    }
    if (!f || !S.reviewer) return;
    if (name === "deny") {
      var g = reviewState(r, kind), why = g ? g.R.items.filter(function (it) { return it.s === "fails"; }).map(function (it) { return it.n || it.t; }) : [];
      var ok = true;
      try { ok = window.confirm("Deny the " + (kind === "nc" ? "noncredit attestation" : "participation confirmation") + " from " + r.name + "?" +
        (why.length ? "\n\nNot met: " + why.join("; ") + "." : "") + "\n\nDeny removes the request, so the college can send another."); } catch (e) { ok = true; }
      if (!ok) return;
    }
    if (f.act(name, kind, r.key)) {
      say(name === "accept" ? "Accepted. The acceptance email opens for you to copy." : name === "deny" ? "Denied: the request is removed." :
        name === "follow" ? "The follow-up email opens for you to edit and copy." : "The acceptance email opens again for you to copy.");
    }
  }
  function onClick(e) {
    var t = e.target.closest ? e.target.closest("button, [data-sel]") : null;
    if (!t || !root().contains(t)) return;
    if (t.hasAttribute("data-sel")) { state.sel = t.getAttribute("data-sel"); state.msg = ""; paintRecord(); var h = document.getElementById("cw-recname");
      if (h && t.classList.contains("chip")) h.focus(); return; }
    if (t.hasAttribute("data-view")) { state.view = t.getAttribute("data-view"); state.sel = null; paint(); return; }
    if (t.hasAttribute("data-stage")) { var s = t.getAttribute("data-stage"); state.view = s === "waiting" ? "review" : s; state.sel = null; paint(); return; }
    if (t.hasAttribute("data-act")) act(t.getAttribute("data-act"), t.getAttribute("data-kind"));
  }
  function onChange(e) {
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute("data-check")) {
      var k = gid(state.sel, t.getAttribute("data-kind")), m = state.checks[k] || (state.checks[k] = {});
      m[t.getAttribute("data-check")] = t.checked;
      refreshVerdicts();
      return;
    }
    if (t.id === "cw-view") { state.view = t.value; state.sel = null; paint(); }
  }
  function onInput(e) {
    if (e.target.id !== "cw-q") return;
    state.q = e.target.value; state.sel = null;
    var pos = e.target.selectionStart;
    paint();
    var q = document.getElementById("cw-q"); if (q) { q.focus(); try { q.setSelectionRange(pos, pos); } catch (x) {} }
  }

  // ── boot ─────────────────────────────────────────────────────────────────
  var wired = false, unsub = null;
  function fresh() { state.view = "open"; state.q = ""; state.sel = null; state.msg = ""; }
  function boot() {
    ensureCss();
    var el = root(); if (!el) return;
    el.removeAttribute("style");   // the pane's loading placeholder (dashed, centered) goes once the tab paints
    // A pick lasts the visit (Sam, 2026-10-21): every open starts on All open items, nothing chosen. tabs.js fires
    // onActivate once, so the module hears each later visit itself.
    fresh();
    if (!wired) {
      wired = true;
      el.addEventListener("click", onClick);
      el.addEventListener("change", onChange);
      el.addEventListener("input", onInput);
      window.addEventListener("cpl-tab-activated", function (e) {
        if (e && e.detail && e.detail.tab === TAB) { fresh(); paint(); }
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
    _state: state, _stageOf: stageOf, _reviewItems: reviewItems, _nextStep: nextStep, _snapshot: function () { return S; } };
})();
