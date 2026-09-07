#!/usr/bin/env python3
"""Assemble the SkyView Globe prototype (prototype/globe/README.md) — third round: the sky by kind (CTE one
side, academic the other), the inside view as a window onto the night sky, star
sizes in both views, Silver M-IDs, Day and Night. three.js r128 from cdnjs,
First Light tokens, words for controls. Reads globe_data3.json (island-relative
points + three placements from globe_layout3.py)."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
data = open(os.path.join(HERE, "globe_data3.json"), encoding="utf-8").read().replace("</", "<\\/")
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "docs", "visuals", "2026-09-07-skyview-globe-prototype.html"))

HTML = r'''<meta charset="utf-8">
<title>SkyView Globe</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:wght@700&display=swap">
<style>
/* ── First Light tokens (the map's own palette; nothing invented) ─────────── */
:root{
  --paper:#FFFFFF; --surface-subtle:#F7F5F1; --surface-muted:#EFEFEC;
  --text-strong:#1C1C1A; --text-body:#3A3A36; --text-muted:#5C5C55; --border:rgba(28,28,26,.18);
  --seal-blue:#002F6D; --cobalt:#0047AB; --cobalt-on-dark:#7DA1D4; --on-accent:#FFFFFF; --focus:#0047AB;
  --sys0:#D6D6D0; --sys1:#0047AB; --sys2:#8B6800; --sys3:#5C5C55; --lit:#8B6800; --lit-glow:#E3B341;
  /* the DAY sky: a tint of the CO blue, clouds ghosted over it */
  --sky-ground:#A8C3E8; --sky-body:#9DBAE3; --sky-island:#B9D0EC; --sky-ink:#1C1C1A; --sky-halo:rgba(168,195,232,.92); --sky-dotrim:#002F6D; --sky-reg:rgba(28,28,26,.72);
  --serif:"Source Serif 4",Georgia,"Times New Roman",serif;
  --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;
}
/* The NIGHT sky is SkyView's dark canvas — the one workspace exception to
   First Light's light identity; the page chrome stays light. */
body.u-dark{
  --sky-ground:#15171A; --sky-body:#15171A; --sky-island:#21242A; --sky-ink:#ECE9E2; --sky-halo:rgba(21,23,26,.94); --sky-dotrim:#15171A; --sky-reg:rgba(236,233,226,.62);
  --sys1:#7DA1D4; --sys2:#E3B341; --sys3:#ABABA3; --lit:#E3B341;
}
html{color-scheme:light}
body{margin:0;background:var(--paper);color:var(--text-body);font-family:var(--sans);font-size:16px;line-height:1.45}
.page{max-width:1280px;margin:0 auto;padding:16px clamp(12px,2vw,24px) 40px}
header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px;margin:0 0 10px}
h1{font-family:var(--serif);font-weight:700;font-size:clamp(1.3rem,2.4vw,1.7rem);margin:0;color:var(--text-strong);text-wrap:balance}
.sub{margin:0;color:var(--text-muted);font-size:.9rem}
/* the control rows: words in boxes, the pressed state a filled box — SkyView's own grammar */
.row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin:0 0 8px}
.grp{display:inline-flex;gap:0;border:1px solid var(--border);border-radius:6px;overflow:hidden;background:var(--surface-subtle);align-items:stretch}
.btn{font:inherit;font-size:.82rem;font-weight:600;padding:6px 11px;min-height:30px;border:0;background:transparent;color:var(--text-body);cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.btn+.btn,.lbl+.btn,.btn+.custom{border-left:1px solid var(--border)}
.btn[aria-pressed="true"]{background:var(--seal-blue);color:var(--on-accent)}
.btn:focus-visible,canvas:focus-visible,input:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.lbl,.zread{font-size:.82rem;padding:6px 8px;color:var(--text-muted);display:inline-flex;align-items:center}
.zread{font-variant-numeric:tabular-nums;font-weight:700}
.custom{display:inline-flex;align-items:center;gap:6px;padding:0 9px;font-size:.82rem;font-weight:600;color:var(--text-body)}
.custom input{width:26px;height:22px;padding:0;border:1px solid var(--border);border-radius:4px;background:transparent;cursor:pointer}
.line{margin:0 0 8px;padding:6px 10px;font-size:.84rem;color:var(--text-muted);background:var(--surface-subtle);border:1px solid var(--border);border-radius:6px;font-variant-numeric:tabular-nums}
.line b{color:var(--text-strong);font-weight:600}
.stage{position:relative;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--sky-ground)}
canvas#c{display:block;width:100%;height:min(72vh,760px);touch-action:none;cursor:grab}
canvas#c.dragging{cursor:grabbing}
.clouds{position:absolute;inset:0;pointer-events:none;background-repeat:repeat-x;background-size:auto 100%;opacity:.85}
.clouds[hidden]{display:none}
.labels{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.lab{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;font-weight:600;font-size:12px;color:var(--sky-ink);
  text-shadow:0 0 3px var(--sky-halo),0 0 6px var(--sky-halo),0 1px 2px var(--sky-halo)}
.lab.big{font-size:14px}
.lab.reg{font-size:15px;letter-spacing:.03em;color:var(--sky-reg);font-weight:700}
.lab[hidden]{display:none}
.tip{position:absolute;z-index:3;pointer-events:none;max-width:320px;padding:7px 9px;border-radius:7px;font-size:.8rem;line-height:1.35;
  background:var(--text-strong);color:var(--paper);box-shadow:0 6px 18px rgba(20,20,30,.22)}
.tip .m{color:#D6D6D0}
.tip[hidden]{display:none}
.legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0 0;font-size:.78rem;color:var(--text-muted)}
.legend span{display:inline-flex;align-items:center;gap:6px}
.sw{width:10px;height:10px;border-radius:50%;display:inline-block;flex:none;border:1px solid var(--border);box-sizing:border-box}
.sw.s0{background:var(--sys0)} .sw.s1{background:var(--sys1)} .sw.s2{background:var(--sys2)} .sw.s3{background:var(--sys3)}
.sw.lone{width:6px;height:6px;background:var(--sys0);opacity:.55;margin:0 2px}
.sw.lit{background:#FBF1D8;border:2px solid var(--lit);box-shadow:0 0 0 3px rgba(227,179,65,.32);width:8px;height:8px}
.btn .sw{width:11px;height:11px}
.btn[aria-pressed="true"] .sw{border-color:rgba(255,255,255,.7)}
.note{margin:22px auto 0;max-width:68ch}
.note h2{font-family:var(--serif);font-size:1.15rem;margin:0 0 6px;color:var(--text-strong)}
.note p{margin:0 0 10px}
.note table{border-collapse:collapse;font-size:.88rem;margin:4px 0 12px;font-variant-numeric:tabular-nums}
.note th,.note td{text-align:left;padding:4px 14px 4px 0;border-bottom:1px solid var(--border);vertical-align:top}
.note th{color:var(--text-muted);font-weight:600}
.hint{font-size:.8rem;color:var(--text-muted);margin:6px 0 0}
kbd{font:inherit;font-size:.78rem;padding:0 4px;border:1px solid var(--border);border-radius:4px;background:var(--surface-subtle)}
@media (max-width:640px){ canvas#c{height:62vh} .row{gap:4px 6px} .btn{padding:6px 9px} .lab{font-size:11px} .lab.big{font-size:12px} .lab.reg{font-size:13px} }
@media (prefers-reduced-motion:reduce){ * { scroll-behavior:auto } }
</style>

<div class="page">
  <header>
    <h1>SkyView Globe</h1>
    <p class="sub">A throwaway prototype: the committed SkyView layout on a sphere, to look at rather than argue about. Third round.</p>
  </header>

  <div class="row" role="toolbar" aria-label="Globe controls">
    <span class="grp" role="group" aria-label="Turning">
      <button class="btn" type="button" id="b-rot" aria-pressed="true" title="Turn the globe slowly on its own — slower as you zoom in, so the sky drifts at one pace">Rotate</button>
    </span>
    <span class="grp" role="group" aria-label="Where you stand">
      <button class="btn" type="button" id="b-out" aria-pressed="true" title="Look at the globe from outside">Outside</button>
      <button class="btn" type="button" id="b-in" aria-pressed="false" title="Stand at the center and look out — the night sky filling the window">Inside</button>
    </span>
    <span class="grp" role="group" aria-label="Lights">
      <button class="btn" type="button" id="b-lit" aria-pressed="false" title="Light the courses that carry an articulation">Articulations</button>
    </span>
    <span class="grp" role="group" aria-label="Labels">
      <button class="btn" type="button" id="b-lab" aria-pressed="true" title="Discipline names on the sky">Discipline names</button>
    </span>
    <span class="grp" role="group" aria-label="Zoom">
      <button class="btn" type="button" id="b-minus" aria-label="Zoom out" title="Zoom out">Zoom out</button>
      <b class="zread" id="zread" title="Outside: the camera's distance from the globe. Inside: how much of the sky the window holds, across">3.0 R</b>
      <button class="btn" type="button" id="b-plus" aria-label="Zoom in" title="Zoom in">Zoom in</button>
      <button class="btn" type="button" id="b-reset" title="Back to the opening view">Reset</button>
    </span>
    <span class="grp" role="group" aria-label="Sky">
      <button class="btn" type="button" id="b-day" aria-pressed="false" title="The day sky — CO blue with faint clouds">Day</button>
      <button class="btn" type="button" id="b-night" aria-pressed="true" title="The night sky — SkyView's dark canvas">Night</button>
    </span>
  </div>

  <div class="row" role="toolbar" aria-label="Layout and color">
    <span class="grp" role="group" aria-label="Island placement">
      <span class="lbl">Islands</span>
      <button class="btn" type="button" id="b-committed" aria-pressed="false" title="Every island where the flat map put it">Committed</button>
      <button class="btn" type="button" id="b-spread" aria-pressed="false" title="Islands eased apart into the empty sky, each keeping its neighbors">Spread</button>
      <button class="btn" type="button" id="b-kind" aria-pressed="true" title="CTE disciplines on one side of the sky, academic on the other, the mixed ones along the line between; every island in the open">By kind</button>
    </span>
    <span class="grp" role="group" aria-label="M-ID color" id="chips">
      <span class="lbl">M-ID color</span>
      <button class="btn chip" type="button" data-c="#FFFFFF" aria-pressed="false"><i class="sw" style="background:#FFFFFF"></i>White</button>
      <button class="btn chip" type="button" data-c="#D6D6D0" aria-pressed="true"><i class="sw" style="background:#D6D6D0"></i>Silver</button>
      <button class="btn chip" type="button" data-c="#FBF1D8" aria-pressed="false"><i class="sw" style="background:#FBF1D8"></i>Cream</button>
      <button class="btn chip" type="button" data-c="#7DA1D4" aria-pressed="false"><i class="sw" style="background:#7DA1D4"></i>Sky</button>
      <button class="btn chip" type="button" data-c="#E3B341" aria-pressed="false"><i class="sw" style="background:#E3B341"></i>Gold</button>
      <button class="btn chip" type="button" data-c="#B28DEB" aria-pressed="false"><i class="sw" style="background:#B28DEB"></i>Purple</button>
      <label class="custom" title="Any color for the M-ID dots">Custom <input type="color" id="c-custom" value="#D6D6D0" aria-label="Custom M-ID color"></label>
    </span>
  </div>

  <p class="line" id="line">Loading the sky…</p>

  <div class="stage" id="stage">
    <canvas id="c" tabindex="0" role="img" aria-label="The Common Course Reference as a globe: 159 discipline islands on a sphere, CTE disciplines on one side and academic on the other, each course identity a dot in its identity system's color and each stand-alone course a smaller, fainter dot. Drag to turn it, scroll to zoom; arrow keys turn it from the keyboard. Outside, only the hemisphere facing you is visible; inside, the sky fills the window."></canvas>
    <div class="clouds" id="clouds" hidden aria-hidden="true"></div>
    <div class="labels" id="labels" aria-hidden="true"></div>
    <div class="tip" id="tip" hidden></div>
  </div>

  <div class="legend" aria-label="How to read the globe">
    <span><i class="sw s0"></i>M-ID, our working label</span>
    <span><i class="sw s1"></i>C-ID, official</span>
    <span><i class="sw s2"></i>CCN, official</span>
    <span><i class="sw s3"></i>unified — a synthetic row standing in for a course identity</span>
    <span><i class="sw lone"></i>stand-alone course — a smaller, fainter dot</span>
    <span id="lg-lit" hidden><i class="sw lit"></i>lit — a gold glow on a course that carries an articulation</span>
  </div>
  <p class="hint">Drag to turn, scroll to zoom, hover a dot for the course. Keyboard: <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> turn, <kbd>+</kbd> <kbd>−</kbd> zoom, <kbd>R</kbd> resets.</p>

  <section class="note">
    <h2>What this is for</h2>
    <p>Sam asked (2026-09-07) whether turning the 2-D sky into a rotating 3-D globe would give SkyView more real estate to spread things out. This page exists so the idea can be looked at. Nothing here is a product. The third round answers his second reaction: the islands are placed <b>By kind</b> — CTE disciplines on one side of the sky, academic on the other, the mixed ones along the line between, every island in the open (<b>Spread</b> and <b>Committed</b> stay one click away); the dots are star-sized in both views; <b>Inside</b> fills the window like the night sky rather than a disc; the M-ID dots are silver; the turn slows in proportion to the zoom, and the stars twinkle gently while it turns; and the sky is <b>Day</b> or <b>Night</b>.</p>
    <p id="kind-note"></p>
    <table>
      <tr><th scope="row">Points on the sky</th><td id="t-pts">—</td></tr>
      <tr><th scope="row">In view right now</th><td id="t-face">—</td></tr>
      <tr><th scope="row">The flat map's extent</th><td id="t-ext">—</td></tr>
      <tr><th scope="row">Island scale</th><td id="t-scale">—</td></tr>
      <tr><th scope="row">Outside</th><td>a globe, seen from a distance you choose</td></tr>
      <tr><th scope="row">Inside</th><td>the sky through a window, 30° to 240° across: a conformal (stereographic) projection, so the round islands stay round wherever they sit; the sky behind you is pulled in toward the edges as the view widens</td></tr>
    </table>
    <p>The second row is the measurement the idea turns on: a sphere shows at most a hemisphere at a time, and the surface near the edge is foreshortened, so the screen holds fewer readable points than the flat canvas does at the same zoom. Inside is the sky form — standing at the center and looking out — which fits the metaphor and hides nothing behind a body; widened far enough it holds nearly every point, but the half behind you is squeezed toward the edges. Real estate on a screen is pixels, and either way you spend them by zooming, which the flat map already does from 3% to 7,000%.</p>
  </section>
</div>

<script id="d" type="application/json">__DATA__</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var D = JSON.parse(document.getElementById("d").textContent);
  var b = D.bounds, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, W = b.x1 - b.x0, H = b.y1 - b.y0;
  var LAT_SPAN = Math.PI * 0.9;               // the flat map's committed wrap: 162° of latitude
  var S = 2 * Math.PI / W;                     // the first round's scale: layout units → radians along the equator
  var SR = (D.round_scale || 0.62) * S;        // the island scale on the sphere — sized so the round islands fit with room
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var num = function(n){ return (n == null ? 0 : n).toLocaleString("en-US"); };
  var esc = function(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); };
  var SYSW = ["M-ID", "C-ID", "CCN", "unified"], KINDW = ["CTE", "academic", "mixed"];
  // an island row: [name, x, y, r, n, standAlones, spreadX, spreadY, kindX, kindY, kind, cteShare]
  // a point row:   [island, dx, dy, system, standAlone, articulations, title, members]
  var mode = { place: "kind" };

  /* ── the projection: the flat map's centers onto the sphere ───────────── */
  function toSphere(x, y){
    var lon = (x - cx) / W * 2 * Math.PI, lat = -(y - cy) / H * LAT_SPAN, cl = Math.cos(lat);
    return [cl * Math.cos(lon), Math.sin(lat), cl * Math.sin(lon)];
  }

  /* ── colors from the tokens, read at paint time so Day and Night repaint ─ */
  function tok(name){ return getComputedStyle(document.body).getPropertyValue(name).trim(); }
  function hexToRgb(h){ h = h.replace("#", ""); if(h.length === 3) h = h.split("").map(function(c){ return c + c; }).join(""); var n = parseInt(h, 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function sysColors(){ return [hexToRgb(tok("--sys0")), hexToRgb(tok("--sys1")), hexToRgb(tok("--sys2")), hexToRgb(tok("--sys3"))]; }

  /* ── the scene ────────────────────────────────────────────────────────── */
  var cvs = document.getElementById("c");
  var renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.01, 50);
  var world = new THREE.Group();
  scene.add(world);

  // The body of the globe: what hides the far hemisphere from outside. By day it wears the clouds.
  var bodyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.97, 64, 48), bodyMat);
  world.add(body);

  // Island caps (outside only): depthWrite off so nothing hides the dots.
  var discs = new THREE.Group(); world.add(discs);
  var discMat = new THREE.MeshBasicMaterial({ color: 0xf7f5f1, side: THREE.DoubleSide, transparent: true, opacity: 0.95, depthWrite: false });
  function cap(J, ang, radius, segs){
    var pos = [J.c[0] * radius, J.c[1] * radius, J.c[2] * radius];
    for(var k = 0; k <= segs; k++){
      var ph = k / segs * 2 * Math.PI, q = expmap(J, Math.cos(ph) * ang, Math.sin(ph) * ang);
      pos.push(q[0] * radius, q[1] * radius, q[2] * radius);
    }
    var idx = []; for(var t = 1; t <= segs; t++){ idx.push(0, t, t + 1); }
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }

  /* ── island centers, and every point placed from its island ───────────── */
  var ISL = [], REG = [];
  function recenter(){
    ISL = D.islands.map(function(I){
      var c = mode.place === "kind" ? toSphere(I[8], I[9]) : mode.place === "spread" ? toSphere(I[6], I[7]) : toSphere(I[1], I[2]);
      var lon = Math.atan2(c[2], c[0]), lat = Math.asin(Math.max(-1, Math.min(1, c[1])));
      return { c: c, E: [-Math.sin(lon), 0, Math.cos(lon)], N: [-Math.sin(lat) * Math.cos(lon), Math.cos(lat), -Math.sin(lat) * Math.sin(lon)] };
    });
    // where each kind's islands center, for the two region names
    REG = [0, 1].map(function(kind){
      var s = [0, 0, 0], n = 0;
      D.islands.forEach(function(I, k){ if(I[10] === kind){ s[0] += ISL[k].c[0]; s[1] += ISL[k].c[1]; s[2] += ISL[k].c[2]; n++; } });
      var l = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]) || 1; return [s[0] / l, s[1] / l, s[2] / l];
    });
  }
  // walk `east` and `north` radians along the surface from an island's center
  function expmap(J, east, north){
    var rho = Math.sqrt(east * east + north * north); if(rho < 1e-9) return J.c.slice();
    var te = east / rho, tn = north / rho, cr = Math.cos(rho), sr = Math.sin(rho);
    return [cr * J.c[0] + sr * (te * J.E[0] + tn * J.N[0]), cr * J.c[1] + sr * (te * J.E[1] + tn * J.N[1]), cr * J.c[2] + sr * (te * J.E[2] + tn * J.N[2])];
  }
  function place(r, out, o){
    var p = r[0] < 0 ? toSphere(r[1], r[2]) : expmap(ISL[r[0]], r[1] * SR, -r[2] * SR);
    out[o] = p[0]; out[o + 1] = p[1]; out[o + 2] = p[2];
  }

  /* ── points: two projections in one vertex shader ─────────────────────── *
   * mode 0 (outside): the perspective camera. mode 1 (inside): the sky through a
   * window — a stereographic projection about the view direction, so a round
   * island stays round wherever it sits; `rad` is the plane radius at the
   * window's left and right edges. Both views size a dot in pixels like a star. */
  var vert = [
    "attribute float size; attribute vec3 col; attribute float phase; varying vec3 vc; varying float vOn; varying float vFade;",
    "uniform float scale; uniform float mode; uniform vec3 fwd; uniform vec3 rgt; uniform vec3 upv; uniform float rad; uniform float wh; uniform float pxk; uniform float time; uniform float tw;",
    "void main(){ vc = col; vOn = 1.0; vFade = 1.0 - tw * 0.5 * (0.5 + 0.5 * sin(time * 0.55 + phase));   // the twinkle: slow, shallow, each star on its own phase",
    "  if(mode < 0.5){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;",
    "    vFade *= smoothstep(0.0, 0.35, dot(normalize(wp), normalize(cameraPosition - wp)));   // dots fade toward the limb instead of piling into a rim",
    "    gl_PointSize = max(1.3, size * scale * pxk * sqrt(3.0 / max(0.05, -mv.z))); gl_Position = projectionMatrix * mv; }",
    "  else { vec3 d = normalize((modelMatrix * vec4(position, 1.0)).xyz);",
    "    float x = dot(d, rgt), y = dot(d, upv), z = dot(d, fwd); float ang = acos(clamp(z, -1.0, 1.0));",
    "    if(ang > 3.05){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vOn = 0.0; }",
    "    else { float rho = 2.0 * tan(ang * 0.5); vec2 xy = vec2(x, y); float l = length(xy); vec2 p = (l > 1e-6 ? xy / l : vec2(0.0)) * rho / rad;",
    "      gl_Position = vec4(p.x, p.y * wh, 0.0, 1.0); gl_PointSize = max(1.3, size * scale * pxk); } } }"].join("\n");
  var frag = [
    "varying vec3 vc; varying float vOn; varying float vFade; uniform float alpha; uniform vec3 rim; uniform float rimA;",
    "void main(){ if(vOn < 0.5) discard; vec2 d = gl_PointCoord - vec2(0.5); float r = length(d); if(r > 0.5) discard;",
    "  float a = alpha * vFade * smoothstep(0.5, 0.38, r); vec3 c = mix(vc, rim, rimA * smoothstep(0.30, 0.42, r)); gl_FragColor = vec4(c, a); }"].join("\n");
  var MATS = [];
  function layer(rows, sizeOf, alpha, blend, rimmed){
    var n = rows.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
    for(var i = 0; i < n; i++){ size[i] = sizeOf(rows[i]); phase[i] = ((i * 2654435761) % 6283) / 1000; }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("col", new THREE.BufferAttribute(col, 3));
    g.setAttribute("size", new THREE.BufferAttribute(size, 1));
    g.setAttribute("phase", new THREE.BufferAttribute(phase, 1));
    var mat = new THREE.ShaderMaterial({ uniforms: {
        scale: { value: 1 }, alpha: { value: alpha }, mode: { value: 0 }, fwd: { value: new THREE.Vector3(0, 0, 1) }, rgt: { value: new THREE.Vector3(1, 0, 0) },
        upv: { value: new THREE.Vector3(0, 1, 0) }, rad: { value: 1.5 }, wh: { value: 1.4 }, pxk: { value: 0.5 },
        rim: { value: new THREE.Vector3(0, 0, 0) }, rimA: { value: 0 }, time: { value: 0 }, tw: { value: 0 } },
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: blend || THREE.NormalBlending });
    mat.userData.rimmed = !!rimmed; MATS.push(mat);
    return { obj: new THREE.Points(g, mat), rows: rows, col: col, geo: g };
  }
  var idents = D.points.filter(function(r){ return !r[4]; });
  var lones = D.points.filter(function(r){ return r[4]; });
  var lit = idents.filter(function(r){ return r[5] > 0; });
  var LI = layer(idents, function(r){ return 2.0 + Math.min(4.5, Math.sqrt(r[7] || 1) * 0.55); }, 1.0, null, true);
  var LL = layer(lones, function(r){ return 1.5; }, 0.5, null, true);
  var LG = layer(lit, function(r){ return 12; }, 0.5, THREE.AdditiveBlending);
  var LR = layer(lit, function(r){ return 5.6 + Math.min(4.5, Math.sqrt(r[7] || 1) * 0.55); }, 1.0);   // the ring: a gold disc under the identity dot
  LG.obj.visible = false; LR.obj.visible = false;
  LG.obj.renderOrder = 1; LR.obj.renderOrder = 2; LL.obj.renderOrder = 3; LI.obj.renderOrder = 4;
  world.add(LG.obj); world.add(LR.obj); world.add(LL.obj); world.add(LI.obj);

  function buildCaps(){
    while(discs.children.length){ var m = discs.children.pop(); m.geometry.dispose(); }
    D.islands.forEach(function(I, k){ var m = new THREE.Mesh(cap(ISL[k], I[3] * SR, 0.992, 64), discMat); m.renderOrder = 0; discs.add(m); });
  }
  function relayout(){
    recenter();
    [LI, LL, LG, LR].forEach(function(L){
      var pos = L.geo.attributes.position.array;
      for(var i = 0; i < L.rows.length; i++) place(L.rows[i], pos, i * 3);
      L.geo.attributes.position.needsUpdate = true; L.geo.computeBoundingSphere();
    });
    buildCaps(); dirty = true; scheduleFacing();
  }

  /* ── the day sky's clouds: value noise, drawn once, ghosted ───────────── */
  var cloudCanvas = null, cloudTex = null;
  function clouds(){
    if(cloudCanvas) return cloudCanvas;
    var w = 1024, h = 512, c = document.createElement("canvas"); c.width = w; c.height = h;
    var g = c.getContext("2d"), img = g.createImageData(w, h), d = img.data;
    function hash(i, j){ var n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); }
    function noise(x, y, per){
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = hash(xi % per, yi), bb = hash((xi + 1) % per, yi), cc = hash(xi % per, yi + 1), dd = hash((xi + 1) % per, yi + 1);
      return (a * (1 - u) + bb * u) * (1 - v) + (cc * (1 - u) + dd * u) * v;
    }
    for(var y = 0; y < h; y++) for(var x = 0; x < w; x++){
      var f = 0, amp = 0.5, freq = 3, per = 3;
      for(var o = 0; o < 5; o++){ f += amp * noise(x / w * freq, y / w * freq, per); amp *= 0.5; freq *= 2; per *= 2; }
      var a = Math.max(0, Math.min(1, (f - 0.50) / 0.20)); a = a * a * 0.55;   // ghosted: most of the sky stays clear
      var i = (y * w + x) * 4; d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
    }
    g.putImageData(img, 0, 0); cloudCanvas = c;
    document.getElementById("clouds").style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
    // the globe's body wears the same clouds over the day blue
    var bc = document.createElement("canvas"); bc.width = w; bc.height = h; var bg = bc.getContext("2d");
    bg.fillStyle = tok("--sky-body"); bg.fillRect(0, 0, w, h); bg.drawImage(c, 0, 0);
    cloudTex = new THREE.CanvasTexture(bc); cloudTex.wrapS = THREE.RepeatWrapping;
    return c;
  }

  function paintColors(){
    var C = sysColors(), litC = hexToRgb(tok("--lit")), glow = hexToRgb(tok("--lit-glow")), rim = hexToRgb(tok("--sky-dotrim"));
    [LI, LL].forEach(function(L){
      for(var i = 0; i < L.rows.length; i++){ var c = C[L.rows[i][3]] || C[3]; L.col[i*3] = c[0]; L.col[i*3+1] = c[1]; L.col[i*3+2] = c[2]; }
      L.geo.attributes.col.needsUpdate = true;
    });
    for(var j = 0; j < LG.rows.length; j++){ LG.col[j*3] = glow[0]; LG.col[j*3+1] = glow[1]; LG.col[j*3+2] = glow[2]; LR.col[j*3] = litC[0]; LR.col[j*3+1] = litC[1]; LR.col[j*3+2] = litC[2]; }
    LG.geo.attributes.col.needsUpdate = true; LR.geo.attributes.col.needsUpdate = true;
    // by day a pale dot needs an edge to exist at all; by night it is a star
    MATS.forEach(function(m){ m.uniforms.rim.value.set(rim[0], rim[1], rim[2]); m.uniforms.rimA.value = (m.userData.rimmed && !dark) ? 0.6 : 0; });
    if(dark){ bodyMat.map = null; bodyMat.color.set(tok("--sky-body")); }
    else { clouds(); bodyMat.map = cloudTex; bodyMat.color.set(0xffffff); }
    bodyMat.needsUpdate = true;
    discMat.color.set(tok("--sky-island")); discMat.opacity = dark ? 0.95 : 0.55;
    renderer.setClearColor(new THREE.Color(tok("--sky-ground")), 1);
    document.getElementById("clouds").hidden = dark || !view.inside;
  }

  /* ── names: real text, placed over the canvas each frame ──────────────── */
  var labBox = document.getElementById("labels"), labEls = [], regEls = [];
  D.islands.forEach(function(I){
    var el = document.createElement("div"); el.className = "lab" + (I[4] >= 120 ? " big" : "");
    el.textContent = I[0] + " (" + num(I[4]) + ")"; el.hidden = true; labBox.appendChild(el); labEls.push(el);
  });
  ["CTE disciplines", "Academic disciplines"].forEach(function(t){
    var el = document.createElement("div"); el.className = "lab reg"; el.textContent = t; el.hidden = true; labBox.appendChild(el); regEls.push(el);
  });
  var _v = new THREE.Vector3();
  var ORDER = D.islands.map(function(I, k){ return k; }).sort(function(a, b){ return D.islands[b][4] - D.islands[a][4]; });
  // a world-space direction → its place on the window (inside), or null when it is out of view
  function projIn(wx, wy, wz, w, h){
    var F = view.basis, x = wx * F.r[0] + wy * F.r[1] + wz * F.r[2], y = wx * F.u[0] + wy * F.u[1] + wz * F.u[2], z = wx * F.f[0] + wy * F.f[1] + wz * F.f[2];
    var ang = Math.acos(Math.max(-1, Math.min(1, z))); if(ang > 3.05) return null;
    var rho = 2 * Math.tan(ang / 2), l = Math.sqrt(x * x + y * y) || 1, k = rho / view.R * (w / 2);
    return [w / 2 + (x / l) * k, h / 2 - (y / l) * k];
  }
  function projOut(wx, wy, wz, w, h, camN){
    if(wx * camN.x + wy * camN.y + wz * camN.z < 0.1) return null;
    _v.set(wx, wy, wz).multiplyScalar(1.02).project(camera); if(_v.z > 1) return null;
    return [(_v.x + 1) / 2 * w, (1 - _v.y) / 2 * h];
  }
  function placeLabels(){
    var w = cvs.clientWidth || 960, h = cvs.clientHeight || 600, a = world.rotation.y, ca = Math.cos(a), sa = Math.sin(a);
    var close = view.inside ? view.half <= Math.PI / 5 : view.dist <= 2.1;
    var camN = view.inside ? null : camera.position.clone().normalize();
    var placed = [];
    function tryPlace(el, c, big, show){
      var px = 0, py = 0;
      if(show){
        var wx = c[0] * ca + c[2] * sa, wy = c[1], wz = -c[0] * sa + c[2] * ca;   // world space
        var q = view.inside ? projIn(wx, wy, wz, w, h) : projOut(wx, wy, wz, w, h, camN);
        if(!q) show = false; else { px = q[0]; py = q[1]; }
      }
      if(show){
        // the label placer's rule from the flat map: drop, never stack
        var tw = el.textContent.length * (big ? 7.6 : 6.4), th = big ? 18 : 16, x0 = px - tw / 2, y0 = py - th / 2, x1 = px + tw / 2, y1 = py + th / 2;
        if(x0 < 2 || y0 < 2 || x1 > w - 2 || y1 > h - 2) show = false;   // a name that would cross the window's edge is dropped, not clipped
        for(var q2 = 0; show && q2 < placed.length; q2++){ var P = placed[q2]; if(x0 < P[2] && x1 > P[0] && y0 < P[3] && y1 > P[1]) show = false; }
        if(show) placed.push([x0, y0, x1, y1]);
      }
      el.hidden = !show;
      if(show){ el.style.left = px.toFixed(1) + "px"; el.style.top = py.toFixed(1) + "px"; }
    }
    regEls.forEach(function(el, i){ tryPlace(el, REG[i], true, labOn && mode.place === "kind"); });
    for(var oi = 0; oi < ORDER.length; oi++){
      var k = ORDER[oi], big = D.islands[k][4] >= 120;
      tryPlace(labEls[k], ISL[k].c, big, labOn && (big || close));
    }
  }

  /* ── camera, views, controls ──────────────────────────────────────────── */
  // inside: `half` is half the window's width in radians (150° across to start); R its plane radius
  var view = { inside: false, dist: 3.0, half: Math.PI * 75 / 180, R: 1, yaw: 0, pitch: 0.15, basis: null };
  var labOn = true;
  var rotating = !reduce, dragging = false, last = null;
  function applyCamera(){
    var f = [Math.cos(view.pitch) * Math.sin(view.yaw), Math.sin(view.pitch), Math.cos(view.pitch) * Math.cos(view.yaw)];
    if(view.inside){ camera.fov = 60; camera.position.set(0, 0, 0.0001); camera.lookAt(new THREE.Vector3(f[0], f[1], f[2])); }
    else { camera.fov = 42; camera.position.set(f[0] * view.dist, f[1] * view.dist, f[2] * view.dist); camera.lookAt(0, 0, 0); }
    camera.updateProjectionMatrix();
    // the view basis for the window projection: right = f × up, up' = right × f
    var r = [-f[2], 0, f[0]]; var rl = Math.sqrt(r[0] * r[0] + r[2] * r[2]) || 1; r = [r[0] / rl, 0, r[2] / rl];
    var u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    view.basis = { f: f, r: r, u: u };
    view.R = 2 * Math.tan(view.half / 2);
    var pxk = view.inside ? 0.5 * Math.sqrt((Math.PI * 75 / 180) / view.half) : 0.5 * Math.sqrt(3.0 / view.dist);
    MATS.forEach(function(m){
      m.uniforms.mode.value = view.inside ? 1 : 0; m.uniforms.rad.value = view.R; m.uniforms.pxk.value = pxk;
      m.uniforms.fwd.value.set(f[0], f[1], f[2]); m.uniforms.rgt.value.set(r[0], r[1], r[2]); m.uniforms.upv.value.set(u[0], u[1], u[2]);
    });
    discs.visible = !view.inside; body.visible = !view.inside;
    document.getElementById("clouds").hidden = dark || !view.inside;
    document.getElementById("zread").textContent = view.inside ? (Math.round(view.half * 2 * 180 / Math.PI) + "° across") : ((Math.round(view.dist * 10) / 10).toFixed(1) + " R");
  }
  function size(){
    var w = cvs.clientWidth || 960, h = cvs.clientHeight || 600;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    var s = (h / 640) * renderer.getPixelRatio();
    MATS.forEach(function(m){ m.uniforms.scale.value = s; m.uniforms.wh.value = w / h; });
    applyCamera(); dirty = true;
  }
  window.addEventListener("resize", size);

  /* Render only when something changed: the globe turns on its own, or the
   * reader turned, zoomed or toggled it. */
  var dirty = true, lastT = 0, SPIN = 0.045;   // radians per second — one turn in about 140 s
  function frame(t){
    var dt = lastT ? Math.min(0.1, (t - lastT) / 1000) : 0; lastT = t;
    var twinkle = rotating && !dragging && !reduce;
    [LI, LL].forEach(function(L){ L.obj.material.uniforms.time.value = t / 1000; L.obj.material.uniforms.tw.value = twinkle ? 0.5 : 0; });
    // the turn slows in proportion to the zoom, so the sky drifts across the window at one pace at any zoom
    // left to right on the screen in both views: the window's right is the globe's left, so the sign flips inside
    if(rotating && !dragging){ world.rotation.y += SPIN * dt * (view.inside ? -view.half / (Math.PI * 75 / 180) : view.dist / 3.0); dirty = true; }
    if(dirty){ renderer.render(scene, camera); placeLabels(); dirty = false; }
    requestAnimationFrame(frame);
  }

  /* how many points are in view right now — the measurement the idea turns on */
  var facingTimer = null;
  function facing(){
    var a = world.rotation.y, ca = Math.cos(a), sa = Math.sin(a), w = cvs.clientWidth || 960, h = cvs.clientHeight || 600;
    var n = 0, total = 0;
    if(view.inside){
      // the view basis in the world's own frame (undo the spin), then the window test per point
      var B = view.basis, rot = function(v){ return [v[0] * ca - v[2] * sa, v[1], v[0] * sa + v[2] * ca]; };
      var F = rot(B.f), Rr = rot(B.r), Uu = rot(B.u), k = (w / 2) / view.R, hx = w / 2, hy = h / 2;
      [LI, LL].forEach(function(L){
        var pos = L.geo.attributes.position.array;
        for(var i = 0; i < pos.length; i += 3){
          total++;
          var x = pos[i] * Rr[0] + pos[i+1] * Rr[1] + pos[i+2] * Rr[2], y = pos[i] * Uu[0] + pos[i+1] * Uu[1] + pos[i+2] * Uu[2], z = pos[i] * F[0] + pos[i+1] * F[1] + pos[i+2] * F[2];
          var ang = Math.acos(Math.max(-1, Math.min(1, z))); if(ang > 3.05) continue;
          var rho = 2 * Math.tan(ang / 2), l = Math.sqrt(x * x + y * y) || 1, px = (x / l) * rho * k, py = (y / l) * rho * k;
          if(Math.abs(px) <= hx && Math.abs(py) <= hy) n++;
        }
      });
    } else {
      var fw = [camera.position.x, camera.position.y, camera.position.z], fl = Math.sqrt(fw[0] * fw[0] + fw[1] * fw[1] + fw[2] * fw[2]) || 1;
      var ref = [(fw[0] * ca - fw[2] * sa) / fl, fw[1] / fl, (fw[0] * sa + fw[2] * ca) / fl];
      [LI, LL].forEach(function(L){
        var pos = L.geo.attributes.position.array;
        for(var i = 0; i < pos.length; i += 3){ total++; if(pos[i] * ref[0] + pos[i+1] * ref[1] + pos[i+2] * ref[2] > 0) n++; }
      });
    }
    var deg = Math.round(view.half * 2 * 180 / Math.PI), K = D.kind || {};
    document.getElementById("t-face").textContent = num(n) + " of " + num(total) + (view.inside ? " (in the " + deg + "° window)" : " (the hemisphere toward you)");
    var placeWords = mode.place === "kind" ? (num(K.cte) + " CTE disciplines on one side of the sky, " + num(K.academic) + " academic on the other, " + num(K.mixed) + " mixed or unread along the line between")
      : mode.place === "spread" ? "eased apart into the empty sky, neighbors kept" : "in their committed places";
    document.getElementById("line").innerHTML = "<b>" + num(n) + "</b> of " + num(total) + " points " +
      (view.inside ? "are in your " + deg + "° window" + (deg >= 200 ? "; the sky behind you is pulled in at the edges" : "") : "face you") + ". " +
      num(LI.rows.length) + " course identities and " + num(LL.rows.length) + " stand-alone courses in " + num(D.islands.length) + " disciplines — " + placeWords + "." +
      (litOn ? " <b>" + num(lit.length) + "</b> carry an articulation and are lit." : "");
  }
  function scheduleFacing(){ clearTimeout(facingTimer); facingTimer = setTimeout(facing, 250); }

  // drag to turn
  function onDown(e){ dragging = true; last = [e.clientX, e.clientY]; cvs.classList.add("dragging"); cvs.setPointerCapture && cvs.setPointerCapture(e.pointerId); }
  function onMove(e){
    if(dragging && last){
      var dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY];
      var k = view.inside ? 0.0022 * view.half : 0.006;
      view.yaw += -dx * k; view.pitch = Math.max(-1.4, Math.min(1.4, view.pitch + dy * k));
      applyCamera(); dirty = true; scheduleFacing(); hideTip(); return;
    }
    hover(e);
  }
  function onUp(e){ dragging = false; last = null; cvs.classList.remove("dragging"); }
  cvs.addEventListener("pointerdown", onDown); cvs.addEventListener("pointermove", onMove);
  cvs.addEventListener("pointerup", onUp); cvs.addEventListener("pointercancel", onUp); cvs.addEventListener("pointerleave", function(){ onUp(); hideTip(); });
  cvs.addEventListener("wheel", function(e){ e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  function zoom(dir){
    if(view.inside) view.half = Math.max(Math.PI / 12, Math.min(Math.PI * 2 / 3, view.half * (dir > 0 ? 1 / 1.15 : 1.15)));
    else view.dist = Math.max(1.35, Math.min(8, view.dist * (dir > 0 ? 1 / 1.15 : 1.15)));
    applyCamera(); dirty = true; scheduleFacing();
  }
  cvs.addEventListener("keydown", function(e){
    var step = 0.08;
    if(e.key === "ArrowLeft"){ view.yaw -= step; } else if(e.key === "ArrowRight"){ view.yaw += step; }
    else if(e.key === "ArrowUp"){ view.pitch = Math.min(1.4, view.pitch + step); } else if(e.key === "ArrowDown"){ view.pitch = Math.max(-1.4, view.pitch - step); }
    else if(e.key === "+" || e.key === "="){ zoom(1); return; } else if(e.key === "-"){ zoom(-1); return; }
    else if(e.key === "r" || e.key === "R"){ reset(); return; } else return;
    e.preventDefault(); applyCamera(); dirty = true; scheduleFacing();
  });

  // hover: the nearest identity dot, as a card
  var ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  function showTip(row, e, r){
    var tip = document.getElementById("tip"), I = D.islands[row[0]];
    tip.innerHTML = "<b>" + esc(row[6] || "(untitled)") + "</b><br><span class=\"m\">" + SYSW[row[3]] + (I ? " · " + esc(I[0]) + " · " + KINDW[I[10]] : "") +
      (row[5] ? " · " + num(row[5]) + " articulation" + (row[5] === 1 ? "" : "s") : "") + "</span>";
    tip.hidden = false;
    var x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
    if(x + tip.offsetWidth > r.width - 8) x = Math.max(8, e.clientX - r.left - tip.offsetWidth - 14);
    if(y + tip.offsetHeight > r.height - 8) y = Math.max(8, e.clientY - r.top - tip.offsetHeight - 14);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hover(e){
    var r = cvs.getBoundingClientRect();
    if(view.inside){
      // the nearest identity on the window, by pixels
      var mx = e.clientX - r.left, my = e.clientY - r.top, a = world.rotation.y, ca = Math.cos(a), sa = Math.sin(a);
      var B = view.basis, rot = function(v){ return [v[0] * ca - v[2] * sa, v[1], v[0] * sa + v[2] * ca]; };
      var F = rot(B.f), Rr = rot(B.r), Uu = rot(B.u), k = (r.width / 2) / view.R;
      var pos = LI.geo.attributes.position.array, best = -1, bd = 1e9;
      for(var i = 0, o = 0; o < pos.length; i++, o += 3){
        var z = pos[o] * F[0] + pos[o+1] * F[1] + pos[o+2] * F[2]; if(z < -0.99) continue;
        var x = pos[o] * Rr[0] + pos[o+1] * Rr[1] + pos[o+2] * Rr[2], y = pos[o] * Uu[0] + pos[o+1] * Uu[1] + pos[o+2] * Uu[2];
        var ang = Math.acos(Math.max(-1, Math.min(1, z))), rho = 2 * Math.tan(ang / 2), l = Math.sqrt(x * x + y * y) || 1;
        var px = r.width / 2 + (x / l) * rho * k, py = r.height / 2 - (y / l) * rho * k, dd = (px - mx) * (px - mx) + (py - my) * (py - my);
        if(dd < bd){ bd = dd; best = i; }
      }
      if(best < 0 || bd > 64){ hideTip(); return; }
      showTip(idents[best], e, r); return;
    }
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1; mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    ray.params.Points.threshold = 0.006 * view.dist;
    var hits = ray.intersectObject(LI.obj, false);
    if(!hits.length){ hideTip(); return; }
    hits.sort(function(p, q){ return p.distanceToRay - q.distanceToRay; });
    var h = hits[0];
    if(h.point.clone().normalize().dot(camera.position.clone().normalize()) < 0.05){ hideTip(); return; }
    showTip(idents[h.index], e, r);
  }
  function hideTip(){ document.getElementById("tip").hidden = true; }

  /* ── the words in the rows ────────────────────────────────────────────── */
  var litOn = false, dark = true;
  function press(id, on){ var b = document.getElementById(id); if(b) b.setAttribute("aria-pressed", on ? "true" : "false"); }
  document.getElementById("b-rot").onclick = function(){ rotating = !rotating; press("b-rot", rotating); dirty = true; };
  document.getElementById("b-out").onclick = function(){ view.inside = false; press("b-out", true); press("b-in", false); applyCamera(); dirty = true; scheduleFacing(); hideTip(); };
  document.getElementById("b-in").onclick = function(){ view.inside = true; press("b-in", true); press("b-out", false); applyCamera(); dirty = true; scheduleFacing(); hideTip(); };
  document.getElementById("b-lit").onclick = function(){ litOn = !litOn; LG.obj.visible = litOn; LR.obj.visible = litOn; press("b-lit", litOn); document.getElementById("lg-lit").hidden = !litOn; dirty = true; scheduleFacing(); };
  document.getElementById("b-lab").onclick = function(){ labOn = !labOn; press("b-lab", labOn); dirty = true; };
  document.getElementById("b-plus").onclick = function(){ zoom(1); };
  document.getElementById("b-minus").onclick = function(){ zoom(-1); };
  function reset(){ view.inside = false; view.dist = 3.0; view.half = Math.PI * 75 / 180; view.yaw = 0; view.pitch = 0.15; world.rotation.y = 0; press("b-out", true); press("b-in", false); applyCamera(); dirty = true; scheduleFacing(); hideTip(); }
  document.getElementById("b-reset").onclick = reset;
  function setSky(night){ dark = night; document.body.classList.toggle("u-dark", dark); press("b-night", dark); press("b-day", !dark); paintColors(); dirty = true; }
  document.getElementById("b-day").onclick = function(){ setSky(false); };
  document.getElementById("b-night").onclick = function(){ setSky(true); };
  // the second row
  function setPlace(p){ mode.place = p; press("b-committed", p === "committed"); press("b-spread", p === "spread"); press("b-kind", p === "kind"); relayout(); }
  document.getElementById("b-committed").onclick = function(){ setPlace("committed"); };
  document.getElementById("b-spread").onclick = function(){ setPlace("spread"); };
  document.getElementById("b-kind").onclick = function(){ setPlace("kind"); };
  var chips = Array.prototype.slice.call(document.querySelectorAll("#chips .chip")), custom = document.getElementById("c-custom");
  function setMid(hex, fromChip){
    document.body.style.setProperty("--sys0", hex);
    chips.forEach(function(c){ c.setAttribute("aria-pressed", (fromChip && c.getAttribute("data-c").toUpperCase() === hex.toUpperCase()) ? "true" : "false"); });
    custom.value = hex.toUpperCase().slice(0, 7);
    paintColors(); dirty = true;
  }
  chips.forEach(function(c){ c.onclick = function(){ setMid(c.getAttribute("data-c"), true); }; });
  custom.addEventListener("input", function(){ setMid(custom.value, false); });
  // the sky starts at night, as Sam sees it; day is one click away
  document.body.classList.add("u-dark"); press("b-night", true); press("b-day", false);
  press("b-rot", rotating);

  /* ── the page at rest ─────────────────────────────────────────────────── */
  var K = D.kind || {};
  document.getElementById("t-pts").textContent = num(LI.rows.length) + " course identities and " + num(LL.rows.length) + " stand-alone courses in " + num(D.islands.length) + " disciplines";
  document.getElementById("t-ext").textContent = num(Math.round(W)) + " × " + num(Math.round(H)) + " layout units, zoomable from 3% to 7,000% on the flat map";
  document.getElementById("t-scale").textContent = Math.round((D.round_scale || 0.62) * 100) + "% of the first round's, so the round islands fit the sphere with room between them; the largest spans " +
    Math.round(Math.max.apply(null, D.islands.map(function(I){ return I[3]; })) * SR * 2 * 180 / Math.PI) + "° across";
  document.getElementById("kind-note").textContent = "The kind is read the one way TOP codes are trusted here — the Taxonomy of Programs manual's CTE flag on each identity's TOP code, taken as a share of the discipline: " +
    num(K.cte) + " disciplines are CTE (a share of 0.6 or more), " + num(K.academic) + " academic (0.4 or less), and " + num(K.mixed) + " sit between or carry no TOP code at all and ride the line between the two sides. " +
    "The boundary falls " + K.boundary_deg + "° from the CTE side's center, which is the CTE islands' share of the sky.";
  document.body.style.setProperty("--sys0", "#D6D6D0");
  recenter(); relayout(); paintColors(); size(); facing();
  requestAnimationFrame(frame);
  setInterval(function(){ if(rotating && !dragging) scheduleFacing(); }, 2000);
})();
</script>
'''

html = HTML.replace("__DATA__", data)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(html)
print("wrote", OUT, round(len(html.encode()) / 1024), "KB")
