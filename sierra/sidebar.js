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
 *     so Sierra never paints dark beside a page that opened Light.
 *   · The look is the host's. A host maps the --sierra-bar-* tokens onto its own
 *     (library/index.html is the worked example); a host that maps none gets the
 *     browser's system colors.
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

  var CSS = [
    'html { scroll-padding-bottom: 88px; }',
    '.sbar-chip { position:fixed; z-index:9000; right:max(16px, env(safe-area-inset-right, 0px)); bottom:max(16px, env(safe-area-inset-bottom, 0px));',
    '  min-height:48px; padding:0 22px; border:0; border-radius:999px; background:var(--sierra-bar-chip-bg, ButtonText); color:var(--sierra-bar-chip-ink, ButtonFace);',
    '  font:inherit; font-weight:700; text-decoration:underline; text-underline-offset:3px; cursor:pointer;',
    '  box-shadow:0 6px 18px var(--sierra-bar-shadow, color-mix(in srgb, CanvasText 20%, transparent)); }',
    '.sbar-chip:focus-visible, .sbar-close:focus-visible { outline:2px solid var(--sierra-bar-focus, Highlight); outline-offset:3px; }',
    '.sbar { position:fixed; z-index:9001; top:0; right:0; bottom:0; width:100vw; display:flex; flex-direction:column;',
    '  background:var(--sierra-bar-bg, Canvas); color:var(--sierra-bar-ink, CanvasText); }',
    '.sbar[hidden], .sbar-chip[hidden] { display:none !important; }',
    '.sbar-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:52px;',
    '  padding:max(8px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 8px 16px; border-bottom:1px solid var(--sierra-bar-line, GrayText); }',
    '.sbar-title { margin:0; font-family:var(--sierra-bar-head-font, inherit); font-size:1.15rem; line-height:1.3; color:var(--sierra-bar-heading, inherit); }',
    '.sbar-close { background:none; border:0; padding:0 2px; min-height:24px; min-width:24px; font:inherit; font-weight:700;',
    '  color:var(--sierra-bar-link, LinkText); text-decoration:underline; text-underline-offset:3px; cursor:pointer; }',
    '.sbar-frame { flex:1 1 auto; display:block; width:100%; min-height:0; border:0; }',
    'html.sbar-modal { overflow:hidden; }',
    '@media ' + WIDE + ' {',
    '  .sbar { width:var(--sierra-bar-w, 420px); border-left:1px solid var(--sierra-bar-line, GrayText);',
    '    box-shadow:-8px 0 24px var(--sierra-bar-shadow, color-mix(in srgb, CanvasText 12%, transparent)); }',
    '  html.sbar-open body { margin-right:var(--sierra-bar-w, 420px); }',
    '}',
    '@media print { .sbar-chip, .sbar { display:none !important; } html.sbar-open body { margin-right:0; } }'
  ].join('\n');

  var chip, bar, closeBtn, frame, wideMq, observer, inerted = [], loaded = false;

  function hostTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : null;
  }
  // With no theme on the host, Sierra reads the reader's stored choice and the
  // device as the host does, so nothing rides the address.
  function frameUrl() {
    var t = hostTheme();
    return SIERRA_URL + (t ? '?theme=' + t : '');
  }
  function frameDoc() {
    try { return frame && frame.contentDocument; } catch (e) { return null; }
  }
  function syncTheme() {
    var d = frameDoc(), t = hostTheme();
    if (!d || !d.documentElement) return;
    if (t) d.documentElement.setAttribute('data-theme', t);
    else d.documentElement.removeAttribute('data-theme');
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
    chip.hidden = false;
    chip.setAttribute('aria-expanded', 'false');
    applyMode();
    try { chip.focus(); } catch (e) { /* best effort */ }
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
    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sbar-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', close);
    head.appendChild(title);
    head.appendChild(closeBtn);
    bar.appendChild(head);
    bar.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    document.body.appendChild(chip);
    document.body.appendChild(bar);

    try {
      wideMq = window.matchMedia(WIDE);
      var onChange = function () { if (isOpen()) applyMode(); };
      if (wideMq.addEventListener) wideMq.addEventListener('change', onChange);
      else if (wideMq.addListener) wideMq.addListener(onChange);
    } catch (e) { wideMq = null; }
    if (window.MutationObserver) {
      observer = new MutationObserver(syncTheme);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();

  window.CPL_SIERRA_BAR = {
    open: open, close: close, isOpen: isOpen, frameUrl: frameUrl,
    SIERRA_URL: SIERRA_URL, WIDE: WIDE
  };
})();
