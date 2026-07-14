/* our_process.js — "Our Process" tab renderer (window.CPL_OUR_PROCESS)
 *
 * A high-elevation, in-app view of how COBI's knowledge systems weave together
 * (the KB, the tracker, the CPLBrain vault, Obsidian) via the checkpoint habit,
 * landing on the TMC Builder as a worked example. Ported from the standalone
 * artifact Sam blessed ("SkyFlyer" viz), adapted to live inside a COBI tab.
 *
 * STATIC — NOT a daily-cron artifact. Lazy-loaded on first #our-process open.
 * Injects its own scoped CSS (everything under .opv, tokens prefixed --op-*),
 * so it cannot collide with the dashboard's global styles (no Rule-4 mirror
 * needed for the CSS; only the nav button + pane + boot are mirrored in both
 * HTMLs). Tests: tests/our_process.test.js
 */
(function () {
  "use strict";

  var CSS = `
  .opv {
    --op-bg:#EAEEEC; --op-panel:#E1E7E4; --op-panel-2:#D7DEDB;
    --op-ink:#102630; --op-ink-soft:#3C5158; --op-ink-faint:#6C8188;
    --op-line:#C6D0CD; --op-line-2:#A9B7B3;
    --op-amber:#B9772A; --op-amber-2:#D89A44; --op-teal:#197F78;
    --op-indigo:#2A5378; --op-coral:#BC4E36;
    --op-contour:rgba(16,34,43,0.055); --op-glow:rgba(185,119,42,0.14);
    --op-serif:Georgia,"Iowan Old Style","Palatino Linotype","Book Antiqua",serif;
    --op-sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    --op-mono:ui-monospace,"SF Mono","Cascadia Code","Roboto Mono",Menlo,Consolas,monospace;
    position:relative; overflow:hidden; border:1px solid var(--op-line);
    border-radius:16px; background:var(--op-bg); color:var(--op-ink);
    font-family:var(--op-sans); font-size:16.5px; line-height:1.62; margin:8px 0 6px;
  }
  @media (prefers-color-scheme: dark) {
    .opv {
      --op-bg:#0A1C27; --op-panel:#0F2733; --op-panel-2:#143140;
      --op-ink:#E9EFEC; --op-ink-soft:#AEC1C4; --op-ink-faint:#70878E;
      --op-line:rgba(180,205,210,0.14); --op-line-2:rgba(180,205,210,0.27);
      --op-amber:#E7AB53; --op-amber-2:#F2C578; --op-teal:#46C2B2;
      --op-indigo:#7BA7CE; --op-coral:#E87C5C;
      --op-contour:rgba(120,180,190,0.06); --op-glow:rgba(231,171,83,0.16);
    }
  }
  .opv * { box-sizing:border-box; }
  .op-contour { position:absolute; top:0; left:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  .op-inner { position:relative; z-index:2; max-width:1000px; margin:0 auto; padding:0 clamp(18px,4vw,54px); }

  .opv h1, .opv h2, .opv h3 { font-family:var(--op-serif); font-weight:600; text-wrap:balance; line-height:1.14; margin:0; color:var(--op-ink); }
  .opv p { margin:0 0 1em; max-width:66ch; color:var(--op-ink-soft); }
  .opv strong { color:var(--op-ink); font-weight:600; }
  .opv a { color:var(--op-teal); }

  .op-eyebrow { font-family:var(--op-mono); font-size:11.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--op-amber); margin:0 0 14px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .op-eyebrow::before { content:""; width:24px; height:1px; background:var(--op-amber); opacity:.8; }
  .op-alt { margin-left:auto; font-family:var(--op-mono); font-size:11px; letter-spacing:.08em; color:var(--op-ink-faint); border:1px solid var(--op-line-2); border-radius:20px; padding:2px 10px; text-transform:none; }
  .op-lead { font-family:var(--op-serif); font-size:clamp(17px,2vw,21px); line-height:1.5; color:var(--op-ink-soft); }

  .op-sec { position:relative; padding:clamp(44px,6vw,72px) 0; }
  .op-sec + .op-sec { border-top:1px solid var(--op-line); }

  .op-reveal { opacity:0; transform:translateY(22px); transition:opacity .7s ease, transform .7s ease; }
  .op-reveal.op-in { opacity:1; transform:none; }
  @media (prefers-reduced-motion: reduce) { .op-reveal { opacity:1; transform:none; transition:none; } }

  /* hero */
  .op-hero { padding-top:clamp(48px,7vw,84px); }
  .op-kicker { font-family:var(--op-mono); font-size:11.5px; letter-spacing:.22em; text-transform:uppercase; color:var(--op-ink-faint); margin-bottom:22px; }
  .op-hero h1 { font-size:clamp(30px,5vw,56px); letter-spacing:-0.015em; margin:0 0 22px; }
  .op-hero h1 .op-accent { color:var(--op-amber); font-style:italic; }
  .op-hero .op-lead { max-width:44ch; }
  .op-herometa { margin-top:34px; display:flex; flex-wrap:wrap; gap:10px 30px; font-family:var(--op-mono); font-size:12px; letter-spacing:.05em; color:var(--op-ink-faint); }
  .op-herometa b { color:var(--op-amber); font-weight:600; }
  .op-altcard { margin-top:34px; display:inline-flex; align-items:center; gap:14px; padding:12px 18px; border:1px solid var(--op-line); border-radius:12px; background:color-mix(in srgb, var(--op-panel) 70%, transparent); font-family:var(--op-mono); font-size:12px; color:var(--op-ink-soft); letter-spacing:.03em; flex-wrap:wrap; }
  .op-altcard .op-big { font-size:22px; color:var(--op-amber); font-family:var(--op-serif); }
  .op-altcard .op-arrow { color:var(--op-ink-faint); }

  .op-sechead { margin-bottom:40px; }
  .op-sechead h2 { font-size:clamp(24px,3.4vw,38px); margin:0 0 14px; letter-spacing:-0.01em; }
  .op-sechead .op-lead { max-width:60ch; }

  /* four systems */
  .op-weave { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
  @media (max-width:720px){ .op-weave { grid-template-columns:1fr; } }
  .op-node { position:relative; border:1px solid var(--op-line); border-radius:15px; background:var(--op-panel); padding:24px 22px; overflow:hidden; transition:transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
  .op-node:hover { transform:translateY(-4px); border-color:var(--op-amber); box-shadow:0 18px 40px -26px var(--op-glow); }
  .op-node .op-tag { font-family:var(--op-mono); font-size:10.5px; letter-spacing:.15em; text-transform:uppercase; color:var(--op-bg); background:var(--h,var(--op-indigo)); display:inline-block; padding:3px 9px; border-radius:5px; margin-bottom:14px; }
  .op-node h3 { font-size:20px; margin:0 0 4px; }
  .op-node .op-real { font-family:var(--op-mono); font-size:11px; color:var(--op-ink-faint); letter-spacing:.02em; margin-bottom:12px; }
  .op-node p { font-size:14.5px; margin:0; max-width:none; }
  .op-node .op-corner { position:absolute; top:0; right:0; width:70px; height:70px; background:radial-gradient(circle at top right, var(--h,var(--op-indigo)) 0%, transparent 68%); opacity:.14; pointer-events:none; }
  .op-node.op-brain { --h:var(--op-indigo); }
  .op-node.op-track { --h:var(--op-teal); }
  .op-node.op-kb    { --h:var(--op-coral); }
  .op-node.op-obs   { --h:var(--op-amber); }

  /* checkpoint loop */
  .op-loopgrid { display:grid; grid-template-columns:1.05fr 1fr; gap:44px; align-items:center; }
  @media (max-width:820px){ .op-loopgrid { grid-template-columns:1fr; gap:28px; } }
  .op-loopwrap { position:relative; width:100%; max-width:400px; margin:0 auto; }
  .op-loopwrap svg { width:100%; height:auto; overflow:visible; }
  .op-loop-track { fill:none; stroke:var(--op-line-2); stroke-width:1.5; }
  .op-loop-flow { fill:none; stroke:var(--op-amber); stroke-width:2.5; stroke-linecap:round; stroke-dasharray:30 320; }
  @keyframes op-flow { to { stroke-dashoffset:-350; } }
  .op-loop-flow { animation:op-flow 5.5s linear infinite; }
  @media (prefers-reduced-motion: reduce){ .op-loop-flow { animation:none; } }
  .op-lp circle { fill:var(--op-panel); stroke:var(--op-line-2); stroke-width:1.5; }
  .op-lp .op-num { font-family:var(--op-mono); font-size:13px; fill:var(--op-amber); font-weight:600; text-anchor:middle; }
  .op-lp .op-lbl { font-family:var(--op-mono); font-size:9.5px; letter-spacing:.05em; fill:var(--op-ink-soft); text-anchor:middle; }
  .op-steps { list-style:none; margin:0; padding:0; counter-reset:op; }
  .op-steps li { position:relative; padding:14px 6px 14px 50px; border-bottom:1px solid var(--op-line); }
  .op-steps li:last-child { border-bottom:0; }
  .op-steps li::before { counter-increment:op; content:counter(op); position:absolute; left:0; top:13px; width:31px; height:31px; border-radius:50%; border:1px solid var(--op-line-2); color:var(--op-amber); font-family:var(--op-mono); font-size:13px; font-weight:600; display:grid; place-items:center; }
  .op-steps li b { display:block; font-family:var(--op-serif); font-size:17px; font-weight:600; margin-bottom:2px; color:var(--op-ink); }
  .op-steps li span { font-size:14px; color:var(--op-ink-soft); }

  /* trust boundary */
  .op-gate { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media (max-width:720px){ .op-gate { grid-template-columns:1fr; } }
  .op-lane { border:1px solid var(--op-line); border-radius:15px; padding:24px 24px 26px; background:var(--op-panel); }
  .op-lane .op-lanetop { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .op-lane .op-dot { width:12px; height:12px; border-radius:50%; flex:0 0 auto; }
  .op-lane h3 { font-size:19px; margin:0; }
  .op-lane .op-flag { font-family:var(--op-mono); font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; margin-left:auto; padding:3px 8px; border-radius:5px; }
  .op-lane.op-auto { border-color:color-mix(in srgb, var(--op-teal) 45%, var(--op-line)); }
  .op-lane.op-auto .op-dot { background:var(--op-teal); }
  .op-lane.op-auto .op-flag { color:var(--op-teal); background:color-mix(in srgb, var(--op-teal) 15%, transparent); }
  .op-lane.op-human { border-color:color-mix(in srgb, var(--op-coral) 45%, var(--op-line)); }
  .op-lane.op-human .op-dot { background:var(--op-coral); }
  .op-lane.op-human .op-flag { color:var(--op-coral); background:color-mix(in srgb, var(--op-coral) 15%, transparent); }
  .op-lane p { font-size:14.5px; margin:0 0 .7em; max-width:none; }
  .op-lane .op-chain { font-family:var(--op-mono); font-size:12px; color:var(--op-ink); letter-spacing:.01em; margin-top:12px; padding-top:12px; border-top:1px dashed var(--op-line-2); line-height:1.9; }
  .op-lane .op-chain .op-g { color:var(--op-ink-faint); }

  /* tmc */
  .op-tmc { border-radius:15px; }
  .op-problem { display:flex; flex-wrap:wrap; gap:16px; margin:0 0 38px; }
  .op-stat { flex:1 1 150px; border:1px solid var(--op-line); border-radius:13px; padding:20px 18px; background:var(--op-panel); }
  .op-stat .op-n { font-family:var(--op-serif); font-size:clamp(28px,4vw,40px); line-height:1; color:var(--op-amber); font-variant-numeric:tabular-nums; }
  .op-stat.op-pain .op-n { color:var(--op-coral); }
  .op-stat .op-k { font-family:var(--op-mono); font-size:11px; letter-spacing:.05em; color:var(--op-ink-soft); margin-top:9px; display:block; text-transform:uppercase; line-height:1.5; }
  .op-split { display:grid; grid-template-columns:1fr 1fr; gap:36px; align-items:start; }
  @media (max-width:820px){ .op-split { grid-template-columns:1fr; gap:26px; } }
  .op-splith { font-size:20px; margin:0 0 6px; }
  .op-steps2 { list-style:none; margin:0; padding:0; }
  .op-steps2 li { display:flex; gap:14px; padding:13px 0; border-bottom:1px solid var(--op-line); }
  .op-steps2 li:last-child { border-bottom:0; }
  .op-steps2 .op-ic { flex:0 0 auto; width:32px; height:32px; border-radius:9px; background:var(--op-panel-2); display:grid; place-items:center; font-size:16px; }
  .op-steps2 b { font-family:var(--op-serif); font-size:16px; font-weight:600; display:block; margin-bottom:2px; color:var(--op-ink); }
  .op-steps2 span { font-size:14px; color:var(--op-ink-soft); }

  .op-mock { border:1px solid var(--op-line-2); border-radius:13px; overflow:hidden; background:var(--op-bg); font-family:var(--op-mono); box-shadow:0 24px 50px -34px var(--op-glow); }
  .op-mock .op-bar { display:flex; align-items:center; gap:7px; padding:10px 13px; background:var(--op-panel-2); border-bottom:1px solid var(--op-line); }
  .op-mock .op-bar i { width:9px; height:9px; border-radius:50%; background:var(--op-line-2); display:inline-block; }
  .op-mock .op-bar .op-t { margin-left:8px; font-size:11px; letter-spacing:.07em; color:var(--op-ink-soft); text-transform:uppercase; }
  .op-mock .op-body { padding:15px 15px 17px; }
  .op-mock .op-selrow { display:flex; gap:8px; margin-bottom:13px; }
  .op-mock .op-sel { flex:1; font-size:11px; color:var(--op-ink); background:var(--op-panel); border:1px solid var(--op-line); border-radius:7px; padding:8px 10px; letter-spacing:.01em; }
  .op-mock .op-sel b { color:var(--op-amber); }
  .op-mslot { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; padding:8px 0; border-top:1px dashed var(--op-line); font-size:11px; }
  .op-mslot .op-cid { color:var(--op-ink); }
  .op-mslot .op-cid .op-code { color:var(--op-indigo); }
  .op-mslot .op-match { color:var(--op-teal); text-align:center; }
  .op-mslot .op-course { color:var(--op-ink-soft); text-align:right; }
  .op-mslot .op-course.op-autohit { color:var(--op-teal); }
  .op-mslot.op-gap .op-match { color:var(--op-coral); }
  .op-mslot.op-gap .op-course { color:var(--op-coral); }
  .op-mock .op-foot { display:flex; justify-content:space-between; align-items:center; margin-top:13px; padding-top:12px; border-top:1px solid var(--op-line); font-size:11px; gap:10px; }
  .op-mock .op-foot .op-units { color:var(--op-ink); }
  .op-mock .op-foot .op-units b { color:var(--op-teal); }
  .op-mock .op-foot .op-pill { color:var(--op-bg); background:var(--op-amber); padding:6px 11px; border-radius:6px; letter-spacing:.05em; white-space:nowrap; }
  .op-mockcap { font-family:var(--op-mono); font-size:10.5px; color:var(--op-ink-faint); letter-spacing:.03em; margin-top:11px; text-align:center; }

  .op-livecta { margin-top:40px; text-align:center; }
  .op-livebtn { display:inline-flex; align-items:center; gap:11px; font-family:var(--op-mono); font-size:13px; letter-spacing:.08em; text-transform:uppercase; font-weight:600; color:#0A1C27; background:var(--op-amber); text-decoration:none; padding:14px 24px; border-radius:10px; box-shadow:0 14px 34px -20px var(--op-glow); transition:transform .25s ease, box-shadow .25s ease, background .25s ease; cursor:pointer; border:0; }
  .op-livebtn:hover { transform:translateY(-3px); background:var(--op-amber-2); box-shadow:0 22px 46px -20px var(--op-glow); }
  .op-livebtn .op-livedot { width:9px; height:9px; border-radius:50%; background:var(--op-teal); }
  @keyframes op-lpulse { 0%{ box-shadow:0 0 0 0 color-mix(in srgb, var(--op-teal) 70%, transparent);} 70%{ box-shadow:0 0 0 7px transparent;} 100%{ box-shadow:0 0 0 0 transparent;} }
  .op-livebtn .op-livedot { animation:op-lpulse 2s ease-out infinite; }
  @media (prefers-reduced-motion: reduce){ .op-livebtn .op-livedot { animation:none; } }
  .op-livenote { font-family:var(--op-mono); font-size:11px; color:var(--op-ink-faint); letter-spacing:.03em; margin-top:12px; }

  .op-pull { font-family:var(--op-serif); font-size:clamp(20px,3vw,30px); line-height:1.35; color:var(--op-ink); max-width:24ch; margin:0 0 8px; font-style:italic; }
  .op-pull .op-hl { color:var(--op-amber); font-style:normal; }
  .op-takeaways { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:26px; }
  @media (max-width:720px){ .op-takeaways { grid-template-columns:1fr; } }
  .op-ta { border-top:2px solid var(--op-amber); padding:16px 4px 0; }
  .op-ta h3 { font-size:17px; margin:0 0 7px; }
  .op-ta p { font-size:14px; margin:0; max-width:none; }
  .op-foot2 { margin-top:34px; padding-top:20px; border-top:1px solid var(--op-line); font-family:var(--op-mono); font-size:11px; letter-spacing:.06em; color:var(--op-ink-faint); text-align:center; }
  .op-foot2 b { color:var(--op-amber); }
  `;

  var HTML = `
  <div class="opv">
    <canvas class="op-contour" aria-hidden="true"></canvas>
    <div class="op-inner">

      <div class="op-sec op-hero">
        <div class="op-kicker">How we build tools &amp; business processes with Claude Code</div>
        <h1>How we build the tools —<br>and the <span class="op-accent">memory</span> that keeps them.</h1>
        <p class="op-lead">A look, from altitude, at how one person and an AI teammate turn everyday CPL work into
          real software — and never lose what was learned along the way.</p>
        <div class="op-herometa">
          <span><b>4</b> connected systems</span>
          <span><b>1</b> habit that ties them together</span>
          <span><b>1</b> tool we land on: the TMC Builder</span>
        </div>
        <div class="op-altcard">
          <span>This view descends from</span>
          <span class="op-big">30,000&nbsp;ft</span>
          <span class="op-arrow">↓</span>
          <span class="op-big">ground</span>
          <span>&nbsp;as you scroll.</span>
        </div>
      </div>

      <div class="op-sec">
        <div class="op-sechead op-reveal">
          <div class="op-eyebrow">The weave · four places our knowledge lives <span class="op-alt">25,000 ft</span></div>
          <h2>Four systems, woven into one cloth</h2>
          <p class="op-lead">Each does one job well. On their own they'd drift apart. The trick is that they're
            stitched together so the right knowledge shows up in the right place — automatically.</p>
        </div>
        <div class="op-weave">
          <div class="op-node op-brain op-reveal">
            <span class="op-corner"></span>
            <span class="op-tag">The thinking space</span>
            <h3>CPLBrain</h3>
            <div class="op-real">the private second brain · Obsidian vault</div>
            <p>Where strategy, meeting notes, and project history live. The durable, private memory — the place a
              new work session reads first so it starts smart instead of starting over.</p>
          </div>
          <div class="op-node op-track op-reveal">
            <span class="op-corner"></span>
            <span class="op-tag">The workshop</span>
            <h3>The Project Tracker</h3>
            <div class="op-real">the live dashboard + the tools we build</div>
            <p>The dashboard leaders actually use — live numbers, project status, and purpose-built tools like the
              TMC Builder. It rebuilds itself every day, and every tool ships with its own notes.</p>
          </div>
          <div class="op-node op-kb op-reveal">
            <span class="op-corner"></span>
            <span class="op-tag">The public library</span>
            <h3>The Knowledge Base</h3>
            <div class="op-real">the audience-facing, shareable record</div>
            <p>The clean, public version of what we know about CPL — safe to hand to a partner or the field.
              Nothing lands here by accident: everything is reviewed by a person first.</p>
          </div>
          <div class="op-node op-obs op-reveal">
            <span class="op-corner"></span>
            <span class="op-tag">The reading room</span>
            <h3>Obsidian</h3>
            <div class="op-real">how it all becomes browsable</div>
            <p>The app that turns the private notes and project docs into a linked, searchable notebook — so the
              whole story is one click away, on any topic, whenever it's needed.</p>
          </div>
        </div>
      </div>

      <div class="op-sec">
        <div class="op-sechead op-reveal">
          <div class="op-eyebrow">The heartbeat · what keeps them in sync <span class="op-alt">18,000 ft</span></div>
          <h2>The "checkpoint" habit</h2>
          <p class="op-lead">The one move that makes the whole thing work: every so often — and at the end of every
            session — the AI stops and <strong>writes down what it just learned</strong>. That saved knowledge then
            flows, on its own, into every place it needs to be.</p>
        </div>
        <div class="op-loopgrid">
          <div class="op-loopwrap op-reveal">
            <svg viewBox="0 0 320 320" role="img" aria-label="A repeating four-step loop: work, save, sync, read back.">
              <circle class="op-loop-track" cx="160" cy="160" r="120"></circle>
              <circle class="op-loop-flow" cx="160" cy="160" r="120"></circle>
              <g class="op-lp" transform="translate(160,40)"><circle r="30"></circle><text class="op-num" y="-2">1</text><text class="op-lbl" y="12">WORK</text></g>
              <g class="op-lp" transform="translate(280,160)"><circle r="30"></circle><text class="op-num" y="-2">2</text><text class="op-lbl" y="12">SAVE</text></g>
              <g class="op-lp" transform="translate(160,280)"><circle r="30"></circle><text class="op-num" y="-2">3</text><text class="op-lbl" y="12">SYNC</text></g>
              <g class="op-lp" transform="translate(40,160)"><circle r="30"></circle><text class="op-num" y="-2">4</text><text class="op-lbl" y="12">READ</text></g>
            </svg>
          </div>
          <ol class="op-steps op-reveal">
            <li><b>Do the work</b><span>Build a tool, curate data, or think through a problem with the AI.</span></li>
            <li><b>Save what was learned</b><span>The checkpoint: refresh the notes, the project memory, and the to-do list — all in plain files.</span></li>
            <li><b>It syncs itself</b><span>Those files flow automatically into the private vault. No copy-paste, no extra step.</span></li>
            <li><b>Read it back — and start smarter</b><span>Obsidian picks it up instantly, so the next session (days later) already knows the story.</span></li>
          </ol>
        </div>
      </div>

      <div class="op-sec">
        <div class="op-sechead op-reveal">
          <div class="op-eyebrow">The guardrail · private vs. public <span class="op-alt">12,000 ft</span></div>
          <h2>Fast on the inside — careful at the edge</h2>
          <p class="op-lead">Internal memory updates itself freely, because it's just for us. But the moment
            something is headed for a public audience, a person has to say yes. That line is deliberate.</p>
        </div>
        <div class="op-gate">
          <div class="op-lane op-auto op-reveal">
            <div class="op-lanetop"><span class="op-dot"></span><h3>Internal memory</h3><span class="op-flag">Automatic</span></div>
            <p>Session notes, project docs, and to-do lists flow straight into the private vault the instant they're
              saved. Speed matters here, and the audience is only the team.</p>
            <div class="op-chain">checkpoint <span class="op-g">→</span> vault <span class="op-g">→</span> Obsidian <span class="op-g">→</span> next session</div>
          </div>
          <div class="op-lane op-human op-reveal">
            <div class="op-lanetop"><span class="op-dot"></span><h3>Public Knowledge Base</h3><span class="op-flag">Human-approved</span></div>
            <p>Nothing reaches the public library on its own. A note has to be nominated, cleaned up, and reviewed by
              a person — that review <em>is</em> the safety check for anything sensitive.</p>
            <div class="op-chain">nominate <span class="op-g">→</span> clean up <span class="op-g">→</span> <strong>person reviews</strong> <span class="op-g">→</span> publish</div>
          </div>
        </div>
      </div>

      <div class="op-sec op-tmc">
        <div class="op-sechead op-reveal">
          <div class="op-eyebrow">Touchdown · from system to solution <span class="op-alt">ground level</span></div>
          <h2>What it produces: the TMC Builder</h2>
          <p class="op-lead">All of that plumbing exists to make real tools. Here's one aimed straight at a problem
            the Curriculum team is living right now — a stack of transfer degrees waiting for approval, and not much
            time to clear it. It does the tedious matching <em>and</em> gives reviewers a queue to work.</p>
        </div>
        <div class="op-problem op-reveal">
          <div class="op-stat op-pain"><span class="op-n">200+</span><span class="op-k">transfer degrees<br>awaiting approval</span></div>
          <div class="op-stat"><span class="op-n">45</span><span class="op-k">official state<br>degree templates</span></div>
          <div class="op-stat"><span class="op-n">143,000+</span><span class="op-k">college courses<br>indexed to match</span></div>
          <div class="op-stat"><span class="op-n">115</span><span class="op-k">colleges' catalogs<br>already loaded</span></div>
        </div>
        <div class="op-split">
          <div class="op-reveal">
            <h3 class="op-splith">One tool, two sides</h3>
            <p style="font-size:14.5px;">Approving one transfer degree (an "ADT") means checking a college's proposed
              courses against the state's official template — course by course, by hand, across catalogs with tens of
              thousands of entries. The Builder does that cross-referencing, then hands the team a ready-to-review packet.</p>
            <ul class="op-steps2">
              <li><span class="op-ic">①</span><div><b>It matches — and never guesses</b><span>Each required slot is auto-filled with the college's own course that already carries the matching state course ID. No exact match? It leaves it blank, because a wrong match is worse than a gap.</span></div></li>
              <li><span class="op-ic">②</span><div><b>Gaps and units light up</b><span>Missing slots and short unit counts are flagged, each with a plain confidence tag — so reviewers know exactly where to spend their time.</span></div></li>
              <li><span class="op-ic">③</span><div><b>The college submits for review</b><span>One click sends the degree to the Chancellor's Office. It drops into a shared queue, ranked by how ready it is.</span></div></li>
              <li><span class="op-ic">④</span><div><b>Reviewers approve or return</b><span>A reviewer opens a row, sees a five-point evidence panel, and clicks Approve or Return — with a note. Minutes per degree, and every decision is logged.</span></div></li>
            </ul>
          </div>
          <div class="op-reveal">
            <div class="op-mock" aria-label="Illustration of the TMC Builder matching a college's courses to a degree template.">
              <div class="op-bar"><i></i><i></i><i></i><span class="op-t">TMC Builder</span></div>
              <div class="op-body">
                <div class="op-selrow">
                  <div class="op-sel">College · <b>Example CC</b></div>
                  <div class="op-sel">Template · <b>Business Admin</b></div>
                </div>
                <div class="op-mslot"><span class="op-cid">Financial Accounting <span class="op-code">ACCT&nbsp;110</span></span><span class="op-match">✓ auto</span><span class="op-course op-autohit">ACCT&nbsp;1A · 4u</span></div>
                <div class="op-mslot"><span class="op-cid">Managerial Accounting <span class="op-code">ACCT&nbsp;120</span></span><span class="op-match">✓ auto</span><span class="op-course op-autohit">ACCT&nbsp;1B · 4u</span></div>
                <div class="op-mslot"><span class="op-cid">Business Law <span class="op-code">BUS&nbsp;125</span></span><span class="op-match">✓ auto</span><span class="op-course op-autohit">BUS&nbsp;18 · 3u</span></div>
                <div class="op-mslot op-gap"><span class="op-cid">Microeconomics <span class="op-code">ECON&nbsp;202</span></span><span class="op-match">⚠ review</span><span class="op-course">— pick course —</span></div>
                <div class="op-mslot"><span class="op-cid">Statistics <span class="op-code">MATH&nbsp;110</span></span><span class="op-match">✓ auto</span><span class="op-course op-autohit">MATH&nbsp;10 · 4u</span></div>
                <div class="op-foot"><span class="op-units">Total units · <b>19 / 20</b></span><span class="op-pill">📤 SUBMIT FOR REVIEW</span></div>
              </div>
            </div>
            <div class="op-mockcap">Illustration — real matches are drawn live from official course and articulation data.</div>
          </div>
        </div>
        <div class="op-livecta op-reveal">
          <a class="op-livebtn" href="#tmc-builder"><span class="op-livedot"></span> See the TMC Builder live <span aria-hidden="true">↗</span></a>
          <div class="op-livenote">Opens the live tool · Reference &amp; Curation → TMC Builder</div>
        </div>
      </div>

      <div class="op-sec">
        <div class="op-eyebrow op-reveal">Why it matters here</div>
        <p class="op-pull op-reveal">The point isn't the AI. It's that <span class="op-hl">the work builds its own
          memory</span> — so the tools keep coming, and nothing has to be relearned.</p>
        <div class="op-takeaways">
          <div class="op-ta op-reveal"><h3>Nothing gets lost</h3><p>Every session ends by writing itself down. Knowledge compounds instead of evaporating between meetings.</p></div>
          <div class="op-ta op-reveal"><h3>Tools, not just answers</h3><p>The same routine that keeps our memory also ships working software — a live dashboard, a curriculum helper, and more.</p></div>
          <div class="op-ta op-reveal"><h3>Safe by design</h3><p>Internal notes move fast; anything public waits for a human yes. Speed and caution, each where it belongs.</p></div>
        </div>
        <div class="op-foot2">Built with Claude Code · <b>CPL Initiative</b> · California Community Colleges Chancellor's Office</div>
      </div>

    </div>
  </div>`;

  function ensureCss() {
    if (document.getElementById("op-css")) return;
    var s = document.createElement("style");
    s.id = "op-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var visible = true;

  function wireContour(opv) {
    var cv = opv.querySelector(".op-contour");
    if (!cv) return;
    var ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) return; // headless/jsdom: no 2d context — skip the backdrop, never throw
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var LINES = 15;

    function size() {
      W = opv.clientWidth || opv.offsetWidth || 900;
      H = opv.offsetHeight || 1200;
      cv.width = W * DPR; cv.height = H * DPR;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function contourColor() {
      return getComputedStyle(opv).getPropertyValue("--op-contour").trim() || "rgba(16,34,43,0.05)";
    }
    function draw(phase) {
      if (!W || !H) size();
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = contourColor();
      ctx.lineWidth = 1;
      var p = phase || 0;
      for (var i = 0; i < LINES; i++) {
        var baseY = (H + 160) * (i / (LINES - 1)) - 80;
        ctx.beginPath();
        for (var x = -20; x <= W + 20; x += 12) {
          var y = baseY
            + Math.sin(x * 0.006 + i * 0.9 + p) * 24
            + Math.sin(x * 0.013 - i * 0.5 + p * 0.7) * 11
            + Math.sin(x * 0.028 + i * 1.7 - p * 0.4) * 5;
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    size();
    opv._opResize = function () { size(); if (reduce) draw(0); };
    window.addEventListener("resize", opv._opResize);

    if (reduce || typeof window.requestAnimationFrame !== "function") { draw(0); return; }
    var start = null;
    function loop(ts) {
      if (start === null) start = ts;
      if (visible) draw((ts - start) * 0.00007);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function wireReveal(opv) {
    var els = opv.querySelectorAll(".op-reveal");
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add("op-in");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("op-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    for (var j = 0; j < els.length; j++) io.observe(els[j]);
  }

  function wireVisibility(opv) {
    window.addEventListener("cpl-tab-activated", function (e) {
      var t = e && e.detail && e.detail.tab;
      visible = (t === "our-process");
      if (visible && opv._opResize) setTimeout(opv._opResize, 30);
    });
  }

  function boot() {
    var root = document.getElementById("our-process-root");
    if (!root) return;
    ensureCss();
    if (root.getAttribute("data-op-rendered") === "1") {
      visible = true;
      var opvEx = root.querySelector(".opv");
      if (opvEx && opvEx._opResize) opvEx._opResize();
      return;
    }
    root.innerHTML = HTML;
    root.setAttribute("data-op-rendered", "1");
    var opv = root.querySelector(".opv");
    visible = true;
    wireContour(opv);
    wireReveal(opv);
    wireVisibility(opv);
  }

  window.CPL_OUR_PROCESS = { boot: boot };
})();
