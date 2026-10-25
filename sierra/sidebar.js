/*
 * Ask Sierra, beside the page (Sam, 2026-10-24: "Can you add an Ask Sierra chat
 * chip that opens a Sierra side bar if clicked?"; at the start of S469 he picked
 * the public library first and the chip in the bottom-right corner).
 *
 * One script any page loads: <script src="../sierra/sidebar.js" defer></script>.
 * It puts an Ask Sierra chip in the window's bottom-right corner, and the chip
 * opens a side bar that frames the public Sierra page, sierra/index.html, found
 * beside this script. She is the assistant a visit to sierra/ meets, with the
 * same surface ('public'), the same audience pick and the same logging; this
 * file copies none of her.
 *
 *   · The frame loads on the first open, not with the page, and stays loaded
 *     while the bar is shut, so a reopen finds the conversation as it was left.
 *   · A wide window (WIDE) makes room: the page narrows beside the bar and stays
 *     in use, and the bar is a non-modal dialog. A narrower window gives her the
 *     whole screen, so there the bar is modal: the page behind is inert and
 *     does not scroll.
 *   · Close and Escape shut the bar and hand focus back to the chip. Escape
 *     inside the frame shuts it too, unless Sierra's About panel is open: that
 *     Escape is hers, and closes About.
 *   · The frame takes the host's theme in ?theme= and follows a change of it,
 *     so Sierra never paints dark beside a page that opened Light, nor light
 *     beside one that is dark. A host with no theme of its own follows the
 *     device (COBI's System), so the bar names the device's, and follows it. ?panel=1
 *     tells her she is in the bar: her header row keeps About Sierra alone, since
 *     the bar names her and the page beside it carries the logo.
 *   · The look is the host's. A host maps the --sierra-bar-* tokens onto its own
 *     (library/index.html is the worked example); a host that maps none gets the
 *     browser's system colors.
 *   · A host whose pages share one document shows the chip where it belongs:
 *     COBI's Library tab (library.js) calls setChip(true) on that tab and
 *     setChip(false) on every other, which also shuts an open bar (Sam,
 *     2026-10-24: "Library and more importantly on the public library site").
 *   · Beside the page, the bar is as wide as the reader makes it (Sam,
 *     2026-10-24: "Make the sidebar resizable horizontally"). Its left edge is a
 *     separator: drag it, or focus it and use the arrow keys, Home and End. The
 *     words Narrower and Wider in its header do the same for anyone who cannot
 *     drag (WCAG 2.5.7). The width is remembered for this reader (KEY_W) and
 *     held between MIN_W and maxW(), so the page always keeps 600px.
 *
 * Test: tests/sierra_sidebar.test.js. Sweep: public-library-sierra in a11y.config.js.
 */
(function () {
  'use strict';
  if (window.CPL_SIERRA_BAR) return;

  var script = document.currentScript;
  var SIERRA_URL = new URL('./', (script && script.src) || location.href).href;
  // Side by side from 1200px: below it the page would keep under ~780px beside
  // the bar, so she takes the screen instead.
  var WIDE = '(min-width: 1200px)';
  var DEFAULT_W = 420, MIN_W = 340, MAX_W = 960, PAGE_KEEPS = 600, STEP = 40;
  var KEY_W = 'cpl_sierra_bar_w';

  var CSS = [
    'html.sbar-chip-on { scroll-padding-bottom: 88px; }',
    '.sbar-chip { position:fixed; z-index:9000; right:max(16px, env(safe-area-inset-right, 0px)); bottom:max(16px, env(safe-area-inset-bottom, 0px));',
    '  min-height:48px; padding:0 22px; border:0; border-radius:999px; background:var(--sierra-bar-chip-bg, ButtonText); color:var(--sierra-bar-chip-ink, ButtonFace);',
    '  font:inherit; font-weight:700; text-decoration:underline; text-underline-offset:3px; cursor:pointer;',
    '  box-shadow:0 6px 18px var(--sierra-bar-shadow, color-mix(in srgb, CanvasText 20%, transparent)); }',
    '.sbar-chip:focus-visible, .sbar-close:focus-visible, .sbar-size:focus-visible { outline:2px solid var(--sierra-bar-focus, Highlight); outline-offset:3px; }',
    '.sbar { position:fixed; z-index:9001; top:0; right:0; bottom:0; width:100vw; display:flex; flex-direction:column;',
    '  background:var(--sierra-bar-bg, Canvas); color:var(--sierra-bar-ink, CanvasText); }',
    '.sbar[hidden], .sbar-chip[hidden] { display:none !important; }',
    '.sbar-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:52px;',
    '  padding:max(8px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 8px 16px; border-bottom:1px solid var(--sierra-bar-line, GrayText); }',
    '.sbar-title { margin:0; font-family:var(--sierra-bar-head-font, inherit); font-size:1.15rem; line-height:1.3; color:var(--sierra-bar-heading, inherit); }',
    '.sbar-tools { display:flex; align-items:center; gap:14px; }',
    '.sbar-close, .sbar-size { background:none; border:0; padding:0 2px; min-height:24px; min-width:24px; font:inherit; font-weight:700;',
    '  color:var(--sierra-bar-link, LinkText); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }',
    '.sbar-size[aria-disabled="true"] { color:var(--sierra-bar-ink, CanvasText); text-decoration:none; cursor:default; opacity:.6; }',
    '.sbar-frame { flex:1 1 auto; display:block; width:100%; min-height:0; border:0; }',
    '.sbar-size, .sbar-grip { display:none; }',
    'html.sbar-modal { overflow:hidden; }',
    // While the edge is dragged the frame would swallow the pointer, so it lets
    // the pointer through to the page until the drag ends.
    'html.sbar-resizing, html.sbar-resizing * { cursor:col-resize !important; user-select:none; }',
    'html.sbar-resizing .sbar-frame { pointer-events:none; }',
    '@media ' + WIDE + ' {',
    '  .sbar { width:var(--sierra-bar-w, 420px); border-left:1px solid var(--sierra-bar-line, GrayText);',
    '    box-shadow:-8px 0 24px var(--sierra-bar-shadow, color-mix(in srgb, CanvasText 12%, transparent)); }',
    '  html.sbar-open body { margin-right:var(--sierra-bar-w, 420px); }',
    '  .sbar-size { display:inline-block; }',
    '  .sbar-grip { display:block; position:absolute; z-index:1; top:0; bottom:0; left:-6px; width:12px; cursor:col-resize; touch-action:none; }',
    '  .sbar-grip::after { content:""; position:absolute; top:0; bottom:0; left:5px; width:2px; background:transparent; }',
    '  .sbar-grip:hover::after, .sbar-grip:focus-visible::after, html.sbar-resizing .sbar-grip::after { background:var(--sierra-bar-focus, Highlight); }',
    '  .sbar-grip:focus-visible { outline:2px solid var(--sierra-bar-focus, Highlight); outline-offset:-2px; }',
    '}',
    '@media print { .sbar-chip, .sbar { display:none !important; } html.sbar-open body { margin-right:0; } }'
  ].join('\n');

  var chip, bar, closeBtn, frame, grip, narrowerBtn, widerBtn, wideMq, observer, inerted = [], loaded = false, chipOff = false;
  var wantW = DEFAULT_W, dragging = false;

  // The page keeps PAGE_KEEPS px beside the bar; the bar keeps MIN_W.
  function maxW() { return Math.max(MIN_W, Math.min(MAX_W, (window.innerWidth || 0) - PAGE_KEEPS)); }
  function clampW(w) { return Math.round(Math.min(maxW(), Math.max(MIN_W, w))); }
  function storedW() {
    try { return parseInt(window.localStorage.getItem(KEY_W), 10); } catch (e) { return NaN; }
  }
  // Paints the width the reader wants, held to what the window allows (so a
  // word pressed at the limit changes nothing). save
  // writes the reader's choice; a window resize re-holds it and saves nothing,
  // so the bar grows back when the window does.
  function applyWidth(save) {
    var w = clampW(wantW);
    if (save) {
      wantW = w;
      try { window.localStorage.setItem(KEY_W, String(w)); } catch (e) { /* the width lasts the visit */ }
    }
    document.documentElement.style.setProperty('--sierra-bar-w', w + 'px');
    if (grip) {
      grip.setAttribute('aria-valuemin', String(MIN_W));
      grip.setAttribute('aria-valuemax', String(maxW()));
      grip.setAttribute('aria-valuenow', String(w));
      grip.setAttribute('aria-valuetext', w + ' pixels wide');
    }
    if (narrowerBtn) narrowerBtn.setAttribute('aria-disabled', w <= MIN_W ? 'true' : 'false');
    if (widerBtn) widerBtn.setAttribute('aria-disabled', w >= maxW() ? 'true' : 'false');
  }
  function setWidth(w) { wantW = w; applyWidth(true); }
  function width() { return clampW(wantW); }

  // What the host shows: its own theme, or the device's when it has none. Sierra
  // opens Light on her own (Sam, Open Asks Sheet 126 card 2), so the bar always
  // names the host's.
  function hostTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }
  function frameUrl() {
    return SIERRA_URL + '?panel=1&theme=' + hostTheme();
  }
  function frameDoc() {
    try { return frame && frame.contentDocument; } catch (e) { return null; }
  }
  function syncTheme() {
    var d = frameDoc();
    if (!d || !d.documentElement) return;
    d.documentElement.setAttribute('data-theme', hostTheme());
  }

  function isWide() { return !!(wideMq && wideMq.matches); }
  function isOpen() { return !!bar && !bar.hidden; }

  function setInert(on) {
    if (on) {
      Array.prototype.forEach.call(document.body.children, function (k) {
        if (k === bar || k.hasAttribute('inert') || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(k.tagName)) return;
        k.setAttribute('inert', '');
        inerted.push(k);
      });
    } else {
      inerted.forEach(function (k) { k.removeAttribute('inert'); });
      inerted = [];
    }
  }
  // Wide: beside the page, which stays in use. Narrow: over it, modal.
  function applyMode() {
    var root = document.documentElement, open = isOpen(), modal = open && !isWide();
    root.classList.toggle('sbar-open', open);
    root.classList.toggle('sbar-modal', modal);
    if (bar) bar.setAttribute('aria-modal', modal ? 'true' : 'false');
    setInert(false);
    if (modal) setInert(true);
  }

  function focusSierra() {
    var d = frameDoc(), input = d && d.getElementById('s-input');
    try {
      if (input) input.focus();
      else frame.focus();
    } catch (e) { /* focus is best effort */ }
  }
  function onFrameLoad() {
    loaded = true;
    syncTheme();
    try {
      // Capture runs before Sierra's own Escape, so an open About panel is seen
      // open and left to her.
      frame.contentWindow.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var about = frameDoc() && frameDoc().getElementById('s-about');
        if (about && !about.hidden) return;
        close();
      }, true);
    } catch (e) { /* a frame we cannot reach keeps Close */ }
    if (isOpen()) focusSierra();
  }

  function onGripKey(e) {
    var w = width();
    if (e.key === 'ArrowLeft') setWidth(w + STEP);
    else if (e.key === 'ArrowRight') setWidth(w - STEP);
    else if (e.key === 'Home') setWidth(MIN_W);
    else if (e.key === 'End') setWidth(maxW());
    else return;
    e.preventDefault();
  }
  function onDragMove(e) {
    if (!dragging) return;
    wantW = (window.innerWidth || 0) - e.clientX;
    applyWidth(false);
    e.preventDefault();
  }
  function onDragEnd() {
    if (!dragging) return;
    dragging = false;
    document.documentElement.classList.remove('sbar-resizing');
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', onDragEnd);
    document.removeEventListener('pointercancel', onDragEnd);
    applyWidth(true);
  }
  function onDragStart(e) {
    if (e.button !== undefined && e.button !== 0) return;
    dragging = true;
    document.documentElement.classList.add('sbar-resizing');
    try { if (grip.setPointerCapture && e.pointerId !== undefined) grip.setPointerCapture(e.pointerId); } catch (err) { /* the document listeners still follow */ }
    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', onDragEnd);
    document.addEventListener('pointercancel', onDragEnd);
    e.preventDefault();
  }

  function open() {
    build();
    if (isOpen()) { focusSierra(); return; }
    if (!frame) {
      frame = document.createElement('iframe');
      frame.className = 'sbar-frame';
      frame.title = 'Sierra, the CPL assistant';
      frame.addEventListener('load', onFrameLoad);
      frame.src = frameUrl();
      bar.appendChild(frame);
    }
    bar.hidden = false;
    chip.hidden = true;
    chip.setAttribute('aria-expanded', 'true');
    applyMode();
    if (loaded) focusSierra();
    else { try { closeBtn.focus(); } catch (e) { /* best effort */ } }
  }
  function close() {
    if (!isOpen()) return;
    bar.hidden = true;
    chip.hidden = chipOff;
    chip.setAttribute('aria-expanded', 'false');
    applyMode();
    if (!chipOff) { try { chip.focus(); } catch (e) { /* best effort */ } }
  }
  // Show or hide the chip; hiding it shuts an open bar. Focus stays where the
  // host put it, since the chip it would return to is gone.
  function setChip(on) {
    build();
    chipOff = !on;
    if (chipOff && isOpen()) close();
    chip.hidden = chipOff || isOpen();
    document.documentElement.classList.toggle('sbar-chip-on', !chipOff);
  }

  function sizeButton(label, act) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sbar-size';
    b.textContent = label;
    b.setAttribute('aria-controls', 'sbar');
    b.addEventListener('click', act);
    return b;
  }

  function build() {
    if (chip) return;
    var style = document.createElement('style');
    style.id = 'sbar-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sbar-chip';
    chip.id = 'sbar-chip';
    chip.textContent = 'Ask Sierra';
    chip.setAttribute('aria-haspopup', 'dialog');
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-controls', 'sbar');
    chip.addEventListener('click', open);

    bar = document.createElement('div');
    bar.className = 'sbar';
    bar.id = 'sbar';
    bar.hidden = true;
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-modal', 'false');
    bar.setAttribute('aria-labelledby', 'sbar-title');
    var head = document.createElement('div');
    head.className = 'sbar-head';
    var title = document.createElement('h2');
    title.className = 'sbar-title';
    title.id = 'sbar-title';
    title.textContent = 'Ask Sierra';
    var tools = document.createElement('div');
    tools.className = 'sbar-tools';
    narrowerBtn = sizeButton('Narrower', function () { setWidth(width() - STEP); });
    widerBtn = sizeButton('Wider', function () { setWidth(width() + STEP); });
    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sbar-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', close);
    tools.appendChild(narrowerBtn);
    tools.appendChild(widerBtn);
    tools.appendChild(closeBtn);
    head.appendChild(title);
    head.appendChild(tools);
    grip = document.createElement('div');
    grip.className = 'sbar-grip';
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-orientation', 'vertical');
    grip.setAttribute('aria-label', 'Resize Ask Sierra');
    grip.setAttribute('aria-controls', 'sbar');
    grip.tabIndex = 0;
    grip.addEventListener('keydown', onGripKey);
    grip.addEventListener('pointerdown', onDragStart);
    bar.appendChild(grip);
    bar.appendChild(head);
    wantW = storedW() || DEFAULT_W;
    applyWidth(false);
    bar.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    document.body.appendChild(chip);
    document.body.appendChild(bar);
    document.documentElement.classList.add('sbar-chip-on');

    try {
      wideMq = window.matchMedia(WIDE);
      var onChange = function () { if (isOpen()) applyMode(); };
      if (wideMq.addEventListener) wideMq.addEventListener('change', onChange);
      else if (wideMq.addListener) wideMq.addListener(onChange);
    } catch (e) { wideMq = null; }
    window.addEventListener('resize', function () { applyWidth(false); });
    if (window.MutationObserver) {
      observer = new MutationObserver(syncTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    try {
      var dark = window.matchMedia('(prefers-color-scheme: dark)');
      if (dark.addEventListener) dark.addEventListener('change', syncTheme);
      else if (dark.addListener) dark.addListener(syncTheme);
    } catch (e) { /* no matchMedia: the host's own theme still reaches her */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

  window.CPL_SIERRA_BAR = {
    open: open, close: close, isOpen: isOpen, setChip: setChip, frameUrl: frameUrl,
    width: width, setWidth: setWidth,
    SIERRA_URL: SIERRA_URL, WIDE: WIDE, MIN_W: MIN_W, DEFAULT_W: DEFAULT_W, KEY_W: KEY_W
  };
})();
