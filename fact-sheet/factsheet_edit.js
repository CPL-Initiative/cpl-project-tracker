/* ===========================================================================
   CPL Fact Sheet — "Curate" editable overlay (standalone)
   ---------------------------------------------------------------------------
   Lets an allowed reviewer edit the text of any content box on the public Fact
   Sheet — and hide a box entirely (e.g. retire the JST upload card) — without a
   code change. The baked HTML in index.html is ALWAYS the fallback: an empty
   overrides table = the page exactly as authored.

   How it works
   ------------
   • Every editable "box" is given a STABLE key at load by walking the DOM
     (`data-fsk`), derived from its section id + a slug of its baked text. Keys
     are computed BEFORE any override is applied, so they don't drift when a box
     is edited. → index.html needs NO per-box markup (tiny, collision-safe diff).
   • On load (for EVERY visitor, signed in or not) we read public.factsheet_overrides
     (anon) and overlay any { html, hidden } onto matching boxes.
   • A signed-in reviewer (shared `cpl_sb` magic-link session + is_allowed_reviewer()
     RLS, same gate as the RACI / CCR / TMC tabs) gets a ✎ Curate mode: click a
     box → a docked editor (raw-HTML textarea) → Save / Hide / Reset-to-original.

   EXCLUDED from editing (deliberate):
     • #statewide-exhibits  — the Statewide CRs section (owned elsewhere)
     • #progress            — the live, data-bound headline KPI grid
     • #contents            — the table of contents (chrome)
     • any element containing/being [data-bind] — live metric, never hand-edit

   Trust model: override `html` is injected as innerHTML for all visitors, but
   ONLY allowed reviewers can write it (RLS via is_allowed_reviewer()) — the same
   reviewer-trust boundary as item_updates / curator notes. The anon key can read,
   never write.
   =========================================================================== */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://hvuwhnbuahrtptokpqfh.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM';
  var REST = SUPABASE_URL + '/rest/v1';
  var PAGE = 'fact-sheet';

  // Sections whose boxes are NOT editable here.
  var EXCLUDE_SECTIONS = { 'statewide-exhibits': 1, 'progress': 1, 'contents': 1 };
  // The "box" units a reviewer can edit (outermost wins; section-level p/ul/ol
  // added separately below).
  var BOX_SEL = '.card, .res, .stat, .note, .person, .strategy, figcaption';

  var API = {
    _blocks: [],          // [{ el, key, sectionId, baked, label }]
    _byEl: null,          // Map el -> block
    _overrides: {},       // key -> { html, hidden }
    _curating: false,
    _justAuthed: false,
    _editing: null        // block currently open in the dock
  };

  // ── Add / delete / reorder boxes (Phase 1) ─────────────────────────────────
  // Net-new boxes a reviewer inserts (e.g. more Resources cards) + a section's
  // drag order ride the SAME factsheet_overrides table via reserved key
  // namespaces — no schema migration:
  //   added box    "<sectionId>|add|<kind>|<token>"  (html = the box's innerHTML)
  //   box order    "<sectionId>|__order"             (html = JSON array of keys)
  // Both are skipped by applyBlock (they match no baked element) and handled by
  // materializeAdded() / applyOrder() instead. ✕ = delete an added box, or hide
  // a baked one (which lives in index.html and can't be truly removed).
  var GRID_KINDS = ['res', 'card', 'stat', 'note', 'person', 'strategy'];
  var GRID_SEL = '.res, .card, .stat, .note, .person, .strategy';
  var _addCounter = 0;
  function isAddedKey(k) { return /\|add\|/.test(k || ''); }
  function isOrderKey(k) { return /\|__order$/.test(k || ''); }
  function genToken() { return 'b' + Date.now().toString(36) + (_addCounter++).toString(36); }
  function primaryKind(el) {
    for (var i = 0; i < GRID_KINDS.length; i++)
      if (el.classList && el.classList.contains(GRID_KINDS[i])) return GRID_KINDS[i];
    return 'res';
  }
  function boxTemplate(sec) { return sec.querySelector(GRID_SEL); }
  function boxContainer(sec) {
    var sib = sec.querySelector(GRID_SEL);
    if (sib && sib.parentElement) return sib.parentElement;
    return sec.querySelector('.res-grid, .card-grid, .stat-grid, .grid') || sec;
  }
  // Clone a section's representative box and swap its visible text for sample
  // placeholders, so a new box always matches that section's exact format.
  function sampleInner(tpl) {
    var clone = tpl.cloneNode(true);
    // The template is a LIVE box — in curate mode it carries ✕ chrome; strip any
    // copied chrome so the new box's saved HTML is clean content only.
    var chrome = clone.querySelectorAll ? clone.querySelectorAll('.fs-del, .fs-add') : [];
    for (var d = 0; d < chrome.length; d++) {
      if (chrome[d].remove) chrome[d].remove();
      else if (chrome[d].parentNode) chrome[d].parentNode.removeChild(chrome[d]);
    }
    try {
      var w = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false), n, first = true, list = [];
      while ((n = w.nextNode())) list.push(n);
      for (var i = 0; i < list.length; i++) {
        if (!norm(list[i].nodeValue)) continue;
        list[i].nodeValue = first ? 'New item' : 'Sample text — click to edit.';
        first = false;
      }
    } catch (e) {}
    var as = clone.querySelectorAll ? clone.querySelectorAll('a') : [];
    for (var a = 0; a < as.length; a++) as[a].setAttribute('href', '#');
    return clone.innerHTML;
  }

  // ─── JWT helpers ───────────────────────────────────────────────────────────
  function b64urlJson(seg) {
    try { return JSON.parse(atob(seg.replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; }
  }
  function jwtPayload(t) {
    if (typeof t !== 'string') return null;
    var p = t.split('.'); return p.length === 3 ? b64urlJson(p[1]) : null;
  }
  function isValidJwt(t) { return !!jwtPayload(t); }
  function jwtExp(t) { var p = jwtPayload(t); return (p && p.exp) ? p.exp : 0; }
  function jwtEmail(t) { var p = jwtPayload(t); return (p && p.email) ? p.email : ''; }

  // ─── Auth (shared cpl_sb session) ──────────────────────────────────────────
  function getSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem('cpl_sb') || 'null');
      if (s && isValidJwt(s.access_token)) return s;
    } catch (e) {}
    return null;
  }
  function isReviewer() { return !!getSession(); }

  // Mint the session if we landed from a magic link (standalone — no COBI app to
  // process the callback for us). Idempotent with the other curator tabs.
  function captureHash() {
    try {
      var h = location.hash || '';
      if (h.indexOf('access_token=') === -1) return;
      var p = new URLSearchParams(h.replace(/^#/, ''));
      var at = p.get('access_token');
      if (!at) return;
      var sess = { access_token: at, refresh_token: p.get('refresh_token') || '', email: jwtEmail(at) };
      sessionStorage.setItem('cpl_sb', JSON.stringify(sess));
      API._justAuthed = true;
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {}
  }

  // Refresh a near-expired access token BEFORE a write (the StarPort fix —
  // a format-valid-but-expired JWT 401s saves silently). See
  // docs/kb-notes/methodology-refresh-token-before-write.md.
  function ensureFresh() {
    var s = getSession();
    if (!s) return Promise.resolve(null);
    var exp = jwtExp(s.access_token);
    if (exp && (exp * 1000 - Date.now() > 60000)) return Promise.resolve(s);
    if (!s.refresh_token) return Promise.resolve(s);
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (tok) {
      if (tok && tok.access_token) {
        s.access_token = tok.access_token;
        s.refresh_token = tok.refresh_token || s.refresh_token;
        if (tok.access_token) s.email = jwtEmail(tok.access_token) || s.email;
        try { sessionStorage.setItem('cpl_sb', JSON.stringify(s)); } catch (e) {}
        return s;
      }
      try { sessionStorage.removeItem('cpl_sb'); } catch (e) {}
      return null;
    }).catch(function () { return s; });
  }

  function signIn() {
    var email = window.prompt('Curator sign-in — enter your reviewer email for a magic link:');
    if (!email) return;
    var redirect = encodeURIComponent(location.origin + location.pathname);
    fetch(SUPABASE_URL + '/auth/v1/otp?redirect_to=' + redirect, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, create_user: false })
    }).then(function (r) {
      window.alert(r.ok ? 'Check your email for the magic link, then reopen this page from it.'
                        : 'Sign-in failed (are you an allowed reviewer?).');
    }).catch(function () { window.alert('Sign-in request failed.'); });
  }

  function signOut() {
    try { sessionStorage.removeItem('cpl_sb'); } catch (e) {}
    setCurating(false);
    updateButton();
  }

  function authHeaders(s) {
    return { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' };
  }

  // ─── Stable per-box keys ───────────────────────────────────────────────────
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function slug(s) {
    return norm(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  }
  function blockSig(el) { return slug((el.textContent || '').slice(0, 80)) || 'blk'; }

  function isLive(el) {
    if (el.hasAttribute && el.hasAttribute('data-bind')) return true;
    return !!(el.querySelector && el.querySelector('[data-bind]'));
  }

  // Walk every non-excluded main > section and collect its outermost editable
  // boxes. Pure of side effects except stamping data-fsk + caching baked HTML.
  function collectBlocks() {
    var blocks = [], counts = {};
    var secs = document.querySelectorAll('main > section');
    for (var i = 0; i < secs.length; i++) {
      var sec = secs[i];
      var sid = sec.id || ('sec' + i);
      if (EXCLUDE_SECTIONS[sid]) continue;
      if (sec.classList && sec.classList.contains('no-print')) continue;

      // Candidate boxes + section-level prose/lists.
      var cand = [], seen = [];
      var push = function (el) { if (seen.indexOf(el) === -1) { seen.push(el); cand.push(el); } };
      var boxes = sec.querySelectorAll(BOX_SEL);
      for (var b = 0; b < boxes.length; b++) push(boxes[b]);
      var kids = sec.children;
      for (var k = 0; k < kids.length; k++) {
        var tag = kids[k].tagName;
        if (tag === 'P' || tag === 'UL' || tag === 'OL') push(kids[k]);
      }
      // Keep only outermost (drop any candidate nested inside another candidate).
      var outer = cand.filter(function (el) {
        return !cand.some(function (o) { return o !== el && o.contains(el); });
      });

      for (var c = 0; c < outer.length; c++) {
        var el = outer[c];
        if (isLive(el)) continue;
        // A reviewer-added box keeps its stable add-key (set at materialize time),
        // so it isn't re-keyed by text slug and survives edits like a baked box.
        var pre = el.getAttribute('data-fsk');
        if (pre && isAddedKey(pre)) {
          blocks.push({ el: el, key: pre, sectionId: sid, baked: el.innerHTML,
            label: norm(el.textContent || '').slice(0, 46), added: true });
          continue;
        }
        var txt = norm(el.textContent || '');
        if (!txt) continue;
        var base = sid + '|' + blockSig(el);
        var n = (counts[base] = (counts[base] || 0) + 1);
        var key = n > 1 ? base + '~' + n : base;
        el.setAttribute('data-fsk', key);
        blocks.push({ el: el, key: key, sectionId: sid, baked: el.innerHTML, label: txt.slice(0, 46) });
      }
    }
    return blocks;
  }

  function indexBlocks() {
    API._byEl = (typeof Map === 'function') ? new Map() : null;
    if (API._byEl) for (var i = 0; i < API._blocks.length; i++) API._byEl.set(API._blocks[i].el, API._blocks[i]);
  }
  function blockByEl(el) {
    if (API._byEl && API._byEl.has(el)) return API._byEl.get(el);
    for (var i = 0; i < API._blocks.length; i++) if (API._blocks[i].el === el) return API._blocks[i];
    return null;
  }

  // ─── Overrides: read (anon) + apply ────────────────────────────────────────
  function fetchOverrides() {
    if (typeof fetch !== 'function') return Promise.resolve({});
    var url = REST + '/factsheet_overrides?select=block_key,html,hidden&page=eq.' + PAGE;
    return fetch(url, { headers: { apikey: SUPABASE_ANON, Authorization: 'Bearer ' + SUPABASE_ANON } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var map = {};
        (rows || []).forEach(function (row) { map[row.block_key] = { html: row.html, hidden: !!row.hidden }; });
        return map;
      })
      .catch(function () { return {}; });
  }

  // Defense-in-depth: although only allowed reviewers can WRITE an override
  // (is_allowed_reviewer() RLS), it is rendered as innerHTML on a PUBLIC page, so
  // it is sanitized before display with a strict ALLOWLIST (not a blocklist). An
  // allowlist closes the whole foreign-content / mutation-XSS class a blocklist
  // can't: every element outside the HTML namespace (SVG/MathML) or off the tag
  // list is removed wholesale, every attribute off the attr list is dropped, and
  // href is scheme-checked — so the serialized output we re-assign to innerHTML
  // contains only inert, formatting-only HTML. Covers what a fact-sheet box needs
  // (links, bold/italic, lists, the .res-desc / res-title divs+spans).
  var XHTML_NS = 'http://www.w3.org/1999/xhtml';
  var ALLOW_TAGS = { A: 1, ABBR: 1, B: 1, BLOCKQUOTE: 1, BR: 1, CODE: 1, DIV: 1, EM: 1,
    FIGCAPTION: 1, H3: 1, H4: 1, H5: 1, H6: 1, I: 1, LI: 1, OL: 1, P: 1, SMALL: 1, SPAN: 1,
    STRONG: 1, SUB: 1, SUP: 1, U: 1, UL: 1 };
  var ALLOW_ATTR = { href: 1, target: 1, rel: 1, title: 1, 'class': 1, lang: 1, dir: 1 };
  function safeUrl(v) {
    v = String(v || '');
    if (/^\s*(javascript|vbscript|data):/i.test(v)) return false;
    return /^\s*(https?:|mailto:|tel:|#|\/|\.|[\w.\-]+(\/|$))/i.test(v) || v.indexOf(':') === -1;
  }
  function sanitize(html) {
    try {
      var tpl = document.createElement('template');
      tpl.innerHTML = String(html == null ? '' : html);
      var nodes = tpl.content.querySelectorAll('*');
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!tpl.content.contains(node)) continue;            // dropped with an ancestor already
        var tag = node.tagName ? node.tagName.toUpperCase() : '';
        if ((node.namespaceURI && node.namespaceURI !== XHTML_NS) || !ALLOW_TAGS[tag]) {
          node.remove(); continue;                            // SVG/MathML/unknown → remove subtree
        }
        var attrs = Array.prototype.slice.call(node.attributes);
        for (var a = 0; a < attrs.length; a++) {
          var nm = attrs[a].name.toLowerCase();
          if (!ALLOW_ATTR[nm]) { node.removeAttribute(attrs[a].name); continue; }
          if (nm === 'href' && !safeUrl(attrs[a].value)) node.removeAttribute(attrs[a].name);
        }
        if (tag === 'A' && node.getAttribute('target')) node.setAttribute('rel', 'noopener noreferrer');
      }
      return tpl.innerHTML;
    } catch (e) { return ''; }
  }

  // Apply one block's current override state (idempotent: restores baked first).
  function applyBlock(bl) {
    var ov = API._overrides[bl.key];
    bl.el.classList.remove('fs-ov-hidden');
    if (!ov) { if (bl.el.innerHTML !== bl.baked) bl.el.innerHTML = bl.baked; return; }
    if (ov.html != null && ov.html !== '') {
      var clean = sanitize(ov.html);
      if (bl.el.innerHTML !== clean) bl.el.innerHTML = clean;
    } else if (bl.el.innerHTML !== bl.baked) {
      bl.el.innerHTML = bl.baked;
    }
    if (ov.hidden) bl.el.classList.add('fs-ov-hidden');
  }
  function applyOverrides() { for (var i = 0; i < API._blocks.length; i++) applyBlock(API._blocks[i]); }

  // ─── Writes (reviewer) ─────────────────────────────────────────────────────
  function saveOverride(key, patch) {
    return ensureFresh().then(function (s) {
      if (!s) { signIn(); return Promise.reject(new Error('no-session')); }
      var body = { block_key: key, page: PAGE, edited_by: s.email || 'reviewer', edited_at: new Date().toISOString() };
      if ('html' in patch) body.html = patch.html;
      if ('hidden' in patch) body.hidden = patch.hidden;
      return fetch(REST + '/factsheet_overrides?on_conflict=block_key', {
        method: 'POST',
        headers: Object.assign(authHeaders(s), { Prefer: 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify(body)
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; });
    });
  }
  function deleteOverride(key) {
    return ensureFresh().then(function (s) {
      if (!s) { signIn(); return Promise.reject(new Error('no-session')); }
      return fetch(REST + '/factsheet_overrides?block_key=eq.' + encodeURIComponent(key), {
        method: 'DELETE', headers: Object.assign(authHeaders(s), { Prefer: 'return=minimal' })
      }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; });
    });
  }

  // ─── Added boxes + drag order (Phase 1) ────────────────────────────────────
  // Insert each reviewer-added box into its section from its override row. Runs
  // after fetch, before the re-collect, so collectBlocks() then adopts them.
  function materializeAdded(map) {
    Object.keys(map).forEach(function (key) {
      if (!isAddedKey(key)) return;
      var parts = key.split('|');                 // [sid, 'add', kind, token]
      var sid = parts[0], kind = parts[2] || 'res';
      if (EXCLUDE_SECTIONS[sid]) return;
      var sec = document.getElementById(sid);
      if (!sec) return;
      if (sec.querySelector('[data-fsk="' + key + '"]')) return;   // already present
      var box = document.createElement('div');
      box.className = kind;
      box.setAttribute('data-fsk', key);
      box.innerHTML = sanitize((map[key] && map[key].html) || '');
      boxContainer(sec).appendChild(box);
    });
  }
  // Reorder a section's boxes to the saved order, within their shared container.
  function applyOrder(map) {
    Object.keys(map).forEach(function (key) {
      if (!isOrderKey(key)) return;
      var sid = key.split('|')[0];
      var sec = document.getElementById(sid);
      if (!sec || EXCLUDE_SECTIONS[sid]) return;
      var order;
      try { order = JSON.parse((map[key] && map[key].html) || '[]'); } catch (e) { return; }
      if (!Array.isArray(order) || !order.length) return;
      order.forEach(function (k) {
        var el = sec.querySelector('[data-fsk="' + k + '"]');
        if (el && el.parentElement) el.parentElement.appendChild(el);   // append in order
      });
    });
  }
  // Persist the current DOM order of a section's boxes (after a drag / add /
  // delete). Scoped to the BOX CONTAINER (the grid), so a section-level intro
  // <p> that lives outside the grid is never pulled into the order (and so never
  // displaced below the grid on the next load).
  function persistOrder(sid) {
    var sec = document.getElementById(sid);
    if (!sec) return Promise.resolve();
    var boxes = boxContainer(sec).querySelectorAll('[data-fsk]'), keys = [];
    for (var i = 0; i < boxes.length; i++) {
      var k = boxes[i].getAttribute('data-fsk');
      if (k && !isOrderKey(k)) keys.push(k);
    }
    var ok = sid + '|__order', payload = JSON.stringify(keys);
    API._overrides[ok] = { html: payload, hidden: false };
    return saveOverride(ok, { html: payload }).catch(function () {});
  }

  // ─── Curate UI ─────────────────────────────────────────────────────────────
  function currentHtml(bl) {
    var ov = API._overrides[bl.key];
    return (ov && ov.html != null && ov.html !== '') ? ov.html : bl.baked;
  }

  function setCurating(on) {
    API._curating = !!(on && isReviewer());
    if (document.body) document.body.classList.toggle('fs-curating', API._curating);
    if (API._curating) {
      for (var i = 0; i < API._blocks.length; i++) decorateBox(API._blocks[i]);
      renderAddButtons();
    } else {
      for (var j = 0; j < API._blocks.length; j++) { undecorateBox(API._blocks[j]); API._blocks[j].el.classList.remove('fs-target'); }
      clearAddButtons();
      closeDock();
    }
    updateButton();
  }

  // Per-box curate chrome: a ✕ (delete added / hide baked) + drag handle. The ✕
  // is appended INSIDE the box, so it's added AFTER any innerHTML write (never
  // persisted — saves read the editor textarea / override map, not live innerHTML).
  function decorateBox(bl) {
    if (!bl || !bl.el) return;
    bl.el.classList.add('fs-editable');
    bl.el.setAttribute('draggable', 'true');
    if (!bl.el.querySelector('.fs-del')) {
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'fs-del no-print'; x.textContent = '✕';
      x.title = isAddedKey(bl.key) ? 'Delete this box' : 'Hide this box';
      x.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); deleteBox(bl); });
      bl.el.appendChild(x);
    }
  }
  function undecorateBox(bl) {
    if (!bl || !bl.el) return;
    bl.el.classList.remove('fs-editable');
    bl.el.removeAttribute('draggable');
    var x = bl.el.querySelector('.fs-del'); if (x) x.remove();
  }

  // ✕ on a box: delete an added box (true removal), or hide a baked one.
  function deleteBox(bl) {
    if (!bl) return;
    if (isAddedKey(bl.key)) {
      if (!window.confirm('Delete this box? It will be removed from the page for everyone.')) return;
      deleteOverride(bl.key).then(function () {
        delete API._overrides[bl.key];
        var sid = bl.sectionId, el = bl.el;
        API._blocks = API._blocks.filter(function (b) { return b !== bl; });
        if (API._byEl) API._byEl['delete'](el);
        if (API._editing === bl) closeDock();
        if (el.parentNode) el.parentNode.removeChild(el);
        persistOrder(sid);
      }).catch(function () { window.alert('Delete failed — are you a signed-in reviewer?'); });
    } else {
      saveOverride(bl.key, { hidden: true }).then(function () {
        var ov = API._overrides[bl.key] || {};
        API._overrides[bl.key] = { html: ('html' in ov ? ov.html : null), hidden: true };
        applyBlock(bl);
        if (API._curating) decorateBox(bl);
      }).catch(function () { window.alert('Hide failed — are you a signed-in reviewer?'); });
    }
  }

  // ＋ Add box: clone the section's representative box with sample text, insert,
  // persist, and open it in the editor.
  function addBox(sid) {
    var sec = document.getElementById(sid); if (!sec) return;
    if (EXCLUDE_SECTIONS[sid]) return;
    var tpl = boxTemplate(sec);
    if (!tpl) { window.alert('No box in this section to model a new one on.'); return; }
    var kind = primaryKind(tpl);
    var key = sid + '|add|' + kind + '|' + genToken();
    var box = document.createElement('div');
    box.className = kind; box.setAttribute('data-fsk', key);
    box.innerHTML = sampleInner(tpl);
    boxContainer(sec).appendChild(box);
    var bl = { el: box, key: key, sectionId: sid, baked: box.innerHTML,
      label: norm(box.textContent).slice(0, 46), added: true };
    API._blocks.push(bl); if (API._byEl) API._byEl.set(box, bl);
    var inner = box.innerHTML;                       // sample HTML, no ✕ chrome yet
    API._overrides[key] = { html: inner, hidden: false };
    saveOverride(key, { html: inner, hidden: false }).then(function () { persistOrder(sid); }).catch(function () {});
    if (API._curating) decorateBox(bl);
    editBlock(bl);
    return bl;
  }

  // A ＋ Add box affordance per editable grid-box section (Resources etc.).
  function renderAddButtons() {
    var secs = document.querySelectorAll('main > section');
    for (var i = 0; i < secs.length; i++) {
      var sec = secs[i], sid = sec.id || '';
      if (EXCLUDE_SECTIONS[sid]) continue;
      if (sec.classList && sec.classList.contains('no-print')) continue;
      if (!boxTemplate(sec)) continue;               // only sections with grid boxes
      var cont = boxContainer(sec);
      if (cont.querySelector('.fs-add')) continue;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'fs-add no-print'; btn.textContent = '＋ Add box';
      (function (id) { btn.addEventListener('click', function (e) { e.preventDefault(); addBox(id); }); })(sid);
      cont.appendChild(btn);
    }
  }
  function clearAddButtons() {
    var adds = document.querySelectorAll('.fs-add');
    for (var i = 0; i < adds.length; i++) if (adds[i].parentNode) adds[i].parentNode.removeChild(adds[i]);
  }

  // ─── Drag-to-reorder (within a section's container) ────────────────────────
  var _dragEl = null;
  function onDragStart(e) {
    if (!API._curating) return;
    var el = e.target.closest && e.target.closest('[data-fsk]');
    if (!el) return;
    _dragEl = el; el.classList.add('fs-dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', el.getAttribute('data-fsk') || ''); } catch (x) {} }
  }
  function onDragOver(e) {
    if (!API._curating || !_dragEl) return;
    var el = e.target.closest && e.target.closest('[data-fsk]');
    if (!el || el === _dragEl || el.parentElement !== _dragEl.parentElement) return;
    e.preventDefault();
    var r = el.getBoundingClientRect();
    var after = (e.clientY - r.top) > r.height / 2;
    el.parentElement.insertBefore(_dragEl, after ? el.nextSibling : el);
  }
  function onDrop(e) { if (API._curating && _dragEl) e.preventDefault(); }
  function onDragEnd() {
    if (!_dragEl) return;
    _dragEl.classList.remove('fs-dragging');
    var bl = blockByEl(_dragEl), sid = bl && bl.sectionId;
    _dragEl = null;
    if (sid) persistOrder(sid);
  }

  var dock = null, dEls = null;
  function ensureDock() {
    if (dock) return;
    dock = document.createElement('div');
    dock.className = 'fs-dock no-print';
    dock.innerHTML =
      '<div class="fs-dock-inner">' +
        '<div class="fs-dock-head"><strong>Edit box</strong> <span class="fs-dock-key"></span>' +
          '<span class="fs-dock-auth"></span></div>' +
        '<textarea class="fs-dock-ta" spellcheck="true" rows="5"></textarea>' +
        '<div class="fs-dock-actions">' +
          '<button type="button" class="fs-btn fs-primary fs-save">Save</button>' +
          '<button type="button" class="fs-btn fs-hide">Hide box</button>' +
          '<button type="button" class="fs-btn fs-reset">Reset to original</button>' +
          '<button type="button" class="fs-btn fs-cancel">Cancel</button>' +
          '<span class="fs-dock-msg"></span>' +
        '</div>' +
        '<div class="fs-dock-hint">Edits the box’s HTML — keep tags like &lt;a href&gt; and &lt;strong&gt;. ' +
          'Saved edits are visible to everyone; “Reset” restores the original.</div>' +
      '</div>';
    document.body.appendChild(dock);
    dEls = {
      key: dock.querySelector('.fs-dock-key'), auth: dock.querySelector('.fs-dock-auth'),
      ta: dock.querySelector('.fs-dock-ta'), msg: dock.querySelector('.fs-dock-msg'),
      save: dock.querySelector('.fs-save'), hide: dock.querySelector('.fs-hide'),
      reset: dock.querySelector('.fs-reset'), cancel: dock.querySelector('.fs-cancel')
    };
    dEls.cancel.addEventListener('click', closeDock);
    dEls.save.addEventListener('click', onSave);
    dEls.hide.addEventListener('click', onToggleHide);
    dEls.reset.addEventListener('click', onReset);
  }

  function busy(b) {
    if (!dEls) return;
    [dEls.save, dEls.hide, dEls.reset, dEls.cancel].forEach(function (btn) { btn.disabled = b; });
    dEls.msg.textContent = b ? 'Saving…' : '';
  }
  function fail(e) {
    if (dEls) dEls.msg.textContent = (e && e.message === 'no-session') ? 'Please sign in.' : 'Save failed — try again.';
    busy(false);
  }

  function editBlock(bl) {
    if (!bl) return;
    ensureDock();
    API._editing = bl;
    var ov = API._overrides[bl.key] || {};
    dEls.key.textContent = bl.sectionId + ' · “' + bl.label + (bl.label.length >= 46 ? '…' : '') + '”';
    dEls.ta.value = currentHtml(bl);
    dEls.hide.textContent = ov.hidden ? 'Unhide box' : 'Hide box';
    var s = getSession();
    dEls.auth.innerHTML = '';
    if (s) {
      dEls.auth.appendChild(document.createTextNode('signed in as ' + (s.email || 'reviewer') + ' · '));
      var out = document.createElement('a'); out.href = '#'; out.textContent = 'sign out';
      out.addEventListener('click', function (e) { e.preventDefault(); signOut(); closeDock(); });
      dEls.auth.appendChild(out);
    }
    dEls.msg.textContent = '';
    busy(false);
    dock.classList.add('open');
    for (var i = 0; i < API._blocks.length; i++) API._blocks[i].el.classList.remove('fs-target');
    bl.el.classList.add('fs-target');
    try { bl.el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
  }
  function closeDock() {
    if (dock) dock.classList.remove('open');
    if (API._editing) API._editing.el.classList.remove('fs-target');
    API._editing = null;
  }

  function onSave() {
    var bl = API._editing; if (!bl) return;
    var val = dEls.ta.value;
    var hidden = !!(API._overrides[bl.key] && API._overrides[bl.key].hidden);
    busy(true);
    saveOverride(bl.key, { html: val, hidden: hidden }).then(function () {
      API._overrides[bl.key] = { html: val, hidden: hidden };
      applyBlock(bl);
      if (API._curating) decorateBox(bl);
      busy(false); closeDock();
    }).catch(fail);
  }
  function onToggleHide() {
    var bl = API._editing; if (!bl) return;
    var ov = API._overrides[bl.key] || {};
    var nextHidden = !ov.hidden;
    busy(true);
    saveOverride(bl.key, { hidden: nextHidden }).then(function () {
      API._overrides[bl.key] = { html: ('html' in ov ? ov.html : null), hidden: nextHidden };
      applyBlock(bl);
      if (API._curating) decorateBox(bl);
      busy(false); closeDock();
    }).catch(fail);
  }
  function onReset() {
    var bl = API._editing; if (!bl) return;
    if (!window.confirm('Reset this box to its original text? Your saved edit will be removed.')) return;
    busy(true);
    deleteOverride(bl.key).then(function () {
      delete API._overrides[bl.key];
      applyBlock(bl);
      if (API._curating) decorateBox(bl);
      busy(false); closeDock();
    }).catch(fail);
  }

  // One delegated, capture-phase click handler: in curate mode, clicking a box
  // opens the editor (and is suppressed from navigating any link inside it).
  function onDocClick(e) {
    if (!API._curating) return;
    var t = e.target;
    if (t.closest && t.closest('.fs-dock')) return;       // clicks inside the editor
    if (t.id === 'btn-curate' || (t.closest && t.closest('#btn-curate'))) return;
    var el = t.closest && t.closest('[data-fsk]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    editBlock(blockByEl(el));
  }

  // ─── Curate button ─────────────────────────────────────────────────────────
  function updateButton() {
    var btn = document.getElementById('btn-curate');
    if (!btn) return;
    if (API._curating) { btn.textContent = '✓ Done'; btn.title = 'Finish editing'; btn.classList.add('on'); }
    else { btn.textContent = '✎ Curate'; btn.classList.remove('on');
           btn.title = isReviewer() ? 'Edit boxes on this page' : 'Sign in to edit this fact sheet'; }
  }
  function wireButton() {
    var btn = document.getElementById('btn-curate');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!isReviewer()) { signIn(); return; }
      setCurating(!API._curating);
    });
    updateButton();
  }

  // ─── CSS ───────────────────────────────────────────────────────────────────
  function injectCss() {
    if (document.getElementById('fs-edit-css')) return;
    var css =
      '#btn-curate.on{background:var(--seal-blue);color:#fff;border-color:var(--seal-blue);}' +
      'body.fs-curating [data-fsk].fs-editable{position:relative;cursor:pointer;border-radius:6px;' +
        'transition:outline-color .12s,background .12s;}' +
      'body.fs-curating [data-fsk].fs-editable{outline:1px dashed var(--border-strong);outline-offset:3px;}' +
      'body.fs-curating [data-fsk].fs-editable:hover{outline:2px solid var(--cobalt);background:rgba(0,71,171,.05);}' +
      'body.fs-curating [data-fsk].fs-editable::after{content:"\\270E edit";position:absolute;top:-9px;right:6px;' +
        'font:600 11px var(--font-data);background:var(--cobalt);color:#fff;padding:1px 6px;border-radius:6px;' +
        'opacity:0;transition:opacity .12s;pointer-events:none;z-index:2;}' +
      'body.fs-curating [data-fsk].fs-editable:hover::after{opacity:1;}' +
      'body.fs-curating [data-fsk].fs-target{outline:2px solid var(--mustard-fill) !important;}' +
      '.fs-ov-hidden{display:none !important;}' +
      'body.fs-curating .fs-ov-hidden{display:revert !important;opacity:.45;outline:2px dashed var(--crimson);}' +
      '.fs-dock{position:fixed;left:0;right:0;bottom:0;z-index:60;background:var(--surface);' +
        'border-top:2px solid var(--seal-blue);box-shadow:0 -8px 28px rgba(28,28,26,.16);' +
        'display:none;font-family:var(--font-data);}' +
      '.fs-dock.open{display:block;}' +
      '.fs-dock-inner{max-width:var(--maxw);margin:0 auto;padding:12px 22px 14px;}' +
      '.fs-dock-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px;font-size:.9rem;}' +
      '.fs-dock-key{color:var(--muted);}' +
      '.fs-dock-auth{margin-left:auto;color:var(--faint);font-size:.82rem;}' +
      '.fs-dock-ta{width:100%;min-height:96px;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;' +
        'padding:8px 10px;border:1px solid var(--border-strong);border-radius:var(--radius-sm);' +
        'background:var(--surface-subtle);color:var(--ink);resize:vertical;}' +
      '.fs-dock-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;}' +
      '.fs-btn{font:600 13px var(--font-data);padding:6px 12px;border-radius:var(--radius-sm);' +
        'border:1px solid var(--border-strong);background:var(--surface);color:var(--ink);cursor:pointer;}' +
      '.fs-btn:hover{background:var(--surface-muted);}' +
      '.fs-btn[disabled]{opacity:.5;cursor:default;}' +
      '.fs-primary{background:var(--cobalt);border-color:var(--cobalt);color:#fff;}' +
      '.fs-primary:hover{background:var(--seal-blue);}' +
      '.fs-reset{color:var(--crimson);}' +
      '.fs-dock-msg{color:var(--muted);font-size:.85rem;}' +
      '.fs-dock-hint{margin-top:6px;color:var(--faint);font-size:.8rem;}' +
      '.fs-del{position:absolute;top:-10px;right:-9px;width:21px;height:21px;line-height:19px;' +
        'text-align:center;padding:0;border-radius:50%;border:1px solid var(--crimson);' +
        'background:var(--surface,#fff);color:var(--crimson);font:700 12px var(--font-data);' +
        'cursor:pointer;z-index:3;display:none;}' +
      'body.fs-curating [data-fsk].fs-editable:hover>.fs-del,body.fs-curating .fs-del:hover{display:block;}' +
      '.fs-del:hover{background:var(--crimson);color:#fff;}' +
      '.fs-add{grid-column:1 / -1;justify-self:start;display:inline-flex;align-items:center;gap:6px;' +
        'margin:10px 0 0;padding:7px 14px;border:1px dashed var(--cobalt);border-radius:var(--radius-sm);' +
        'background:rgba(0,71,171,.06);color:var(--cobalt);font:600 13px var(--font-data);cursor:pointer;}' +
      '.fs-add:hover{background:var(--cobalt);color:#fff;}' +
      'body.fs-curating [data-fsk][draggable="true"]{cursor:grab;}' +
      'body.fs-curating [data-fsk].fs-dragging{opacity:.4;outline:2px dashed var(--cobalt) !important;}' +
      '@media print{#btn-curate,.fs-dock,.fs-del,.fs-add{display:none !important;}' +
        'body.fs-curating [data-fsk]::after{display:none !important;}' +
        'body.fs-curating .fs-ov-hidden{display:none !important;}' +
        'body.fs-curating [data-fsk].fs-editable{outline:none !important;}}';
    var st = document.createElement('style');
    st.id = 'fs-edit-css';
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  // ─── Boot ──────────────────────────────────────────────────────────────────
  function boot() {
    injectCss();
    captureHash();
    API._blocks = collectBlocks();      // sync: baked boxes (callers may read blocks() now)
    indexBlocks();
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('dragstart', onDragStart, false);
    document.addEventListener('dragover', onDragOver, false);
    document.addEventListener('drop', onDrop, false);
    document.addEventListener('dragend', onDragEnd, false);
    wireButton();
    fetchOverrides().then(function (map) {
      API._overrides = map;
      materializeAdded(map);            // insert reviewer-added boxes into the DOM
      API._blocks = collectBlocks();    // re-collect so they get blocks (add-keys kept)
      indexBlocks();
      applyOrder(map);                  // honor the saved drag order
      applyOverrides();                 // overlay html/hidden onto every block
      if (API._justAuthed) setCurating(true);
    });
  }

  // Test/inspection surface.
  window.CPL_FACTSHEET_EDIT = {
    collectBlocks: collectBlocks,
    applyOverrides: applyOverrides,
    blockSig: blockSig,
    blocks: function () { return API._blocks; },
    overrides: function () { return API._overrides; },
    setOverrides: function (m) { API._overrides = m || {}; },
    boot: boot,
    EXCLUDE_SECTIONS: EXCLUDE_SECTIONS,
    // Phase 1 — add/delete/reorder boxes:
    materializeAdded: materializeAdded,
    applyOrder: applyOrder,
    persistOrder: persistOrder,
    addBox: addBox,
    deleteBox: deleteBox,
    setCurating: setCurating,
    blockByEl: blockByEl,
    sampleInner: sampleInner,
    isAddedKey: isAddedKey,
    isOrderKey: isOrderKey
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
