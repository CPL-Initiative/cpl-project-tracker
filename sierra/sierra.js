/* ===========================================================================
   Sierra — the standalone, chat-first CPL Assistant page.
   ---------------------------------------------------------------------------
   A shareable, public "talk to Sierra" page (NO internal COBI nav), so a
   partner (a college, a workforce org, a Boys & Girls Club) can just ASK about
   Credit for Prior Learning. Named "Sierra" after the Sierra Nevada.

   Talks to the SAME shared Supabase Edge Function `cpl-chat` that powers the
   in-dashboard CPL Assistant, the Fact Sheet drawer, and the live map.rccd.edu
   widget — same RAG backend (vector KB + college detection + live metrics +
   statewide exhibits + the COCI offerings catalog), same SSE contract
   (`event: sources` → `event: text` deltas → `event: done`), same public anon
   key (RLS-gated). MULTI-TURN: prior turns are sent as `history`, so Sierra can
   ask a focusing follow-up and honor "how about West LA?" / "show all".

   The request/stream/markdown logic is the proven port from cpl_chat.js (the
   Fact Sheet's drawer, a third copy, retired when its pages moved onto the Ask
   Sierra side bar, which frames this page). Model output is HTML-escaped BEFORE the markdown-lite
   pass, so a crafted answer can't inject markup. Every turn logs anonymously
   server-side (no SELECT) — the intro asks visitors not to enter personal info.

   STATIC standalone page (the fact-sheet / kb-portal pattern); NOT regenerated
   by excel_to_dashboard.py, NOT a daily-cron artifact. It's also the Student CPL
   Portal embed stepping stone — kept self-contained behind the CONFIG block.
   =========================================================================== */
(function () {
  'use strict';

  // ── Config ── (anon key is public + RLS-gated; mirrors cpl_chat.js)
  var SUPABASE_URL = 'https://hvuwhnbuahrtptokpqfh.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM';
  var CHAT_URL = SUPABASE_URL + '/functions/v1/cpl-chat';

  // Starter questions — a mix that shows off the offerings/adoption reasoning
  // (construction/NCCER, "near me") plus the classic statewide/metrics asks.
  // The first rides the question box's placeholder ("Try: …"); TRIES picks the
  // ones the landing offers as words where the paintings were (Sam, 2026-10-24:
  // "switching the paintings out and having no pics and a simpler look").
  var SUGGESTED = [
    'What is Credit for Prior Learning?',
    'Where can students get college credit for NCCER or OSHA certifications?',
    'Which colleges near Long Beach teach construction or welding?',
    'How can I get credit for a real estate license?',
    'How much has CPL saved California students?',
    'Which colleges give credit for an EMT certification?',
    'How does my Joint Services Transcript count?',
  ];
  var TRIES = [SUGGESTED[1], SUGGESTED[3], SUGGESTED[6]];

  // ── The page beside her (the Ask Sierra side bar, sidebar.js) ──
  // A same-origin page that frames her can name its own starter questions
  // (window.CPL_SIERRA_SUGGESTED, as the Fact Sheet's and the funding page's
  // drawer read them) and the surface her questions are filed under
  // (window.CPL_SIERRA_SURFACE). Read from the parent window, never from the
  // address, so no link can put words in her mouth; a cross-origin parent (the
  // vendor frame on map.rccd.edu) throws and leaves her own. Only surfaces a
  // public page may claim are honored.
  var HOST_SURFACES = ['fact-sheet'];
  function hostValue(name) {
    try {
      if (window.parent && window.parent !== window) return window.parent[name];
    } catch (e) { /* a cross-origin parent: her own */ }
    return undefined;
  }
  function hostTries() {
    var v = hostValue('CPL_SIERRA_SUGGESTED');
    if (!Array.isArray(v)) return null;
    var out = v.filter(function (q) { return typeof q === 'string' && q.trim() && q.length <= 300; })
      .map(function (q) { return q.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim(); });
    return out.length ? out.slice(0, 3) : null;
  }
  function hostSurface() {
    var v = hostValue('CPL_SIERRA_SURFACE');
    return HOST_SURFACES.indexOf(v) > -1 ? v : 'public';
  }
  var HOST_TRIES = hostTries();
  if (HOST_TRIES) TRIES = HOST_TRIES;
  var FIRST_TRY = HOST_TRIES ? HOST_TRIES[0] : SUGGESTED[0];

  var convo = [];          // prior {role,content} turns → sent as history (multi-turn)
  var CONVO_MAX = 8;

  // ── Context variant (v27 — the external contacts gate) ──
  // An embedding host (e.g. the vendor-platform iframe) loads this page with
  // ?ctx=external to suppress college staff contact names/emails from answers.
  // FAIL-OPEN: absent/unknown → full context, exactly today's behavior — a
  // normal visit to sierra/ sends no ctx field at all.
  var ctxVariant = null;
  try {
    if (new URLSearchParams(location.search).get('ctx') === 'external') ctxVariant = 'external';
  } catch (e) { /* no URLSearchParams → no ctx (fail-open) */ }
  var logEl, inputEl, sendBtn, statusEl, formEl, audEl, audToggle, audLine, wired = false;

  // ── Audience (primary population) ──
  // Required before the first question (Sam, 2026-07-01): the visitor picks who
  // they are so Sierra tailors tone + content — students shouldn't get system
  // inside-baseball (articulation mechanics, apportionment, C-ID governance).
  // Single-select (it's the PRIMARY population), persisted per-browser and
  // SHARED with the COBI CPL Assistant tab (same origin, same key). Sent as an
  // optional `audience` field — callers that omit it (the map.rccd.edu widget)
  // are unaffected.
  // Asked when it is needed (Sam, 2026-10-24: "Can we have her gently prompt the
  // user to choose their population once they click Ask? I don't want to
  // complicate the screen with all the choices initially."): with no pick the
  // row is not on the screen at all; the first Ask holds the question, Sierra
  // asks who the visitor is (WHO_PROMPT), and the pick sends the held question.
  // With a pick stored, the row is one folded control, "Answering for: <pick>".
  // Text labels, no glyphs — Sam's COBI design rule (cpl_memory
  // cobi-no-cheesy-glyphs-design-rule), applied to cpl_chat.js in #1231 and
  // carried here so the three surfaces that mount Sierra read identically.
  // These strings must stay in step with cpl_chat.js AUDIENCES: the picked value
  // is persisted under a SHARED same-origin key and travels to the same Edge
  // Function, so a label that drifts here is the same assistant introducing
  // itself two different ways to the same person.
  var AUDIENCES = [
    { k: 'student',       label: 'Student / future student' },
    { k: 'faculty',       label: 'Faculty' },
    { k: 'administrator', label: 'College administrator' },
    { k: 'employer',      label: 'Employer / industry' },
    { k: 'civic',         label: 'Civic leader' },
  ];
  var AUD_KEY = 'cplSierraAudience.v1';
  var audience = null;     // in-memory copy (localStorage may be unavailable)
  var askingWho = false;   // the first Ask is held until the visitor says who they are
  var WHO_PROMPT = 'Who are you asking as? I\u2019ll fit my answer to you.';

  function loadAudience() {
    try {
      var v = localStorage.getItem(AUD_KEY);
      if (AUDIENCES.some(function (a) { return a.k === v; })) audience = v;
    } catch (e) { /* keep in-memory only */ }
  }
  function setAudience(k) {
    audience = k;
    try { localStorage.setItem(AUD_KEY, k); } catch (e) { /* in-memory only */ }
    renderAudience();
  }
  // The row is folded behind one control, "Answering for: <pick>", which opens
  // it; a pick closes it again and hands focus back to that control, so focus
  // never lands on a button that vanished.
  function audienceLabel() {
    for (var i = 0; i < AUDIENCES.length; i++) if (AUDIENCES[i].k === audience) return AUDIENCES[i].label;
    return 'choose one';
  }
  function setAudienceOpen(open) {
    if (!audEl) return;
    audEl.classList.toggle('open', !!open);
    if (audToggle) audToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  // Shown once there is a pick to change, or while Sierra asks for one.
  function paintAudLine() {
    if (!audLine) return;
    audLine.hidden = !audience && !askingWho;
    audLine.classList.toggle('s-asking-who', askingWho);
  }
  function renderAudience() {
    if (!audEl) return;
    audEl.textContent = '';
    var lab = document.createElement('span');
    lab.className = 's-aud-label';
    lab.id = 's-aud-label';
    lab.textContent = WHO_PROMPT;
    audEl.appendChild(lab);
    AUDIENCES.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 's-aud-chip' + (audience === a.k ? ' on' : '');
      b.setAttribute('aria-pressed', audience === a.k ? 'true' : 'false');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        var held = askingWho;
        askingWho = false;
        setAudience(a.k); setStatus('');
        setAudienceOpen(false);
        // The pick answers Sierra's question, so the question she held goes now.
        if (held) { submit(); return; }
        try { if (audToggle) audToggle.focus(); } catch (e) { /* focus is best effort */ }
      });
      audEl.appendChild(b);
    });
    if (audToggle) audToggle.textContent = 'Answering for: ' + audienceLabel();
    paintAudLine();
  }
  // ── About Sierra (the footer panel) ──
  // The introduction lived above the conversation and took most of a phone's
  // first screen (Sam, 2026-09-11); it sat behind a header control, and since the
  // header row went (Sam, 2026-10-27) the control is a word in the footer and the
  // text opens under its row. Click or Enter toggles, Escape closes and returns
  // focus, a click outside closes; it stays open until dismissed (WCAG 1.4.13).
  // No hover opening: at the foot of the page, text that appears under the
  // pointer moves the row it sits on.
  var aboutBtn, aboutPanel;
  function setAbout(open) {
    if (!aboutBtn || !aboutPanel) return;
    aboutBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    aboutPanel.hidden = !open;
    if (open && typeof aboutPanel.scrollIntoView === 'function') {
      try { aboutPanel.scrollIntoView({ block: 'nearest' }); } catch (e) { /* best effort */ }
    }
  }
  function wireAbout() {
    aboutBtn = document.getElementById('s-about-btn');
    aboutPanel = document.getElementById('s-about');
    if (!aboutBtn || !aboutPanel) return;
    aboutBtn.addEventListener('click', function () {
      setAbout(aboutBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || aboutPanel.hidden) return;
      setAbout(false);
      try { aboutBtn.focus(); } catch (e2) { /* focus is best effort */ }
    });
    document.addEventListener('click', function (e) {
      if (aboutPanel.hidden) return;
      if (aboutBtn.contains(e.target) || aboutPanel.contains(e.target)) return;
      setAbout(false);
    });
  }

  // The first Ask with no pick: the question stays in the box, the row opens
  // under it with Sierra's question, and focus moves to the first word, so a
  // keyboard and a screen reader land where the answer is given.
  function askWho() {
    askingWho = true;
    setStatus('');
    renderAudience();
    setAudienceOpen(true);
    var first = audEl && audEl.querySelector('.s-aud-chip');
    try { if (first) first.focus(); } catch (e) { /* focus is best effort */ }
  }

  // ── Per-answer feedback (Helpful / Not helpful + note → sierra_feedback) ──
  // One row per assistant turn, keyed by a client uuid: a thumb click logs
  // immediately and an added note (or a switched rating) updates the SAME row.
  // Writes go through the SECURITY DEFINER RPC `sierra_feedback_upsert` — a
  // direct PostgREST upsert (ON CONFLICT) needs SELECT visibility of the
  // conflicting row, which this table deliberately denies to anon (write-only
  // for the public; the CPL team reads it via the reviewer/team-phrase gate).
  function newTurnId() {
    return (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'turn-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  // ── Copy an answer ────────────────────────────────────────────────────
  // People take Sierra's answers into email, Word and Teams, so the copy has to
  // survive the trip. We write BOTH flavours when the browser allows it:
  // text/html (the rendered bubble) so a paste into Word or Outlook keeps the
  // headings, tables and links, and text/plain (the markdown Sierra actually
  // emitted) so a paste into a plain editor is readable rather than a wall of
  // run-together text.
  //
  // Three tiers, because this runs in three places: the standalone page, the
  // dashboard tab, and a cross-origin vendor iframe. The async Clipboard API
  // needs a secure context AND, inside an iframe, clipboard-write permission —
  // so the execCommand path is not legacy cruft here, it is the iframe's only
  // route. Every tier is best-effort and never throws into the chat flow; if
  // all three fail we select the answer so the visitor can press Ctrl+C.
  function copyRich(html, text) {
    try {
      if (html && navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
        return navigator.clipboard.write([new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        })]);
      }
    } catch (e) { /* fall through to plain */ }
    return Promise.reject(new Error('rich copy unavailable'));
  }
  function copyPlain(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
    } catch (e) { /* fall through to execCommand */ }
    return Promise.reject(new Error('async clipboard unavailable'));
  }
  function copyLegacy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = !!(document.execCommand && document.execCommand('copy'));
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
  function selectNode(node) {
    try {
      var sel = window.getSelection();
      var range = document.createRange();
      range.selectNodeContents(node);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) { /* selection is a courtesy, not a requirement */ }
  }
  function copyAnswer(html, text, done) {
    copyRich(html, text).then(
      function () { done(true); },
      function () {
        copyPlain(text).then(
          function () { done(true); },
          function () { done(copyLegacy(text)); }
        );
      }
    );
  }
  function feedbackPayload(o) {
    return {
      p_turn_id: o.turnId,
      p_rating: o.rating,
      p_session_id: o.sessionId || null,
      p_page: o.page || 'sierra',
      p_audience: o.audience || null,
      p_question: String(o.question || '').slice(0, 4000),
      p_response: String(o.response || '').slice(0, 12000),
      p_note: o.note ? String(o.note).slice(0, 2000) : null,
    };
  }
  // Resolves TRUE only when the row actually landed — see the twin in
  // cpl_chat.js. fetch does not reject on HTTP errors and
  // sierra_feedback_upsert RAISES on an invalid rating, so "it returned" never
  // meant "it saved".
  function sendFeedback(payload) {
    try {
      return fetch(SUPABASE_URL + '/rest/v1/rpc/sierra_feedback_upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
        },
        body: JSON.stringify(payload),
      }).then(function (res) { return !!(res && res.ok); },
              function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function addFeedbackBar(afterRow, question, answer) {
    var tid = newTurnId();
    var rating = null;
    var bar = document.createElement('div');
    bar.className = 's-fb';

    // Copy sits FIRST in the bar — it is what people reach for on a GOOD answer,
    // and it should not sit behind the rating flow. An underlined word like the
    // ratings, on its own class (.s-fb-copy) so the theme tokens carry it.
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 's-fb-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.title = 'Copy this answer — formatting is kept when you paste into Word, Outlook or Teams';
    copyBtn.setAttribute('aria-label', 'Copy this answer to the clipboard');
    var copyTimer = null;
    copyBtn.addEventListener('click', function () {
      var bub = afterRow && afterRow.querySelector ? afterRow.querySelector('.s-bubble') : null;
      // `answer` is the markdown Sierra emitted; the bubble text is the fallback
      // for turns that never streamed one (an error message, say).
      var plain = answer || (bub ? bub.textContent : '') || '';
      copyAnswer(bub ? bub.innerHTML : '', plain, function (ok) {
        copyBtn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        copyBtn.classList.toggle('on', ok);
        if (!ok && bub) selectNode(bub);
        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('on');
        }, 2200);
      });
    });
    bar.appendChild(copyBtn);

    var hint = document.createElement('span');
    hint.textContent = 'Rate this answer:';
    bar.appendChild(hint);

    var noteWrap = document.createElement('div');
    noteWrap.className = 's-fb-note';
    noteWrap.hidden = true;
    var noteIn = document.createElement('input');
    noteIn.type = 'text';
    noteIn.maxLength = 2000;
    noteIn.placeholder = 'Optional note for the CPL team — what was right or missing? (no personal info)';
    noteIn.setAttribute('aria-label', 'Optional feedback note');
    var noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.textContent = 'Send note';
    noteWrap.appendChild(noteIn);
    noteWrap.appendChild(noteBtn);
    // Confirmation sits INSIDE the composer so it lands where the button was,
    // not away in the rating row next to Copy.
    var noteDone = document.createElement('span');
    noteDone.className = 's-fb-done';
    noteDone.hidden = true;
    noteWrap.appendChild(noteDone);

    function upsert(note) {
      return sendFeedback(feedbackPayload({
        turnId: tid, sessionId: sessionId(), page: 'sierra', audience: audience,
        question: question, response: answer, rating: rating, note: note,
      }));
    }

    var btns = {};
    // The thumbs are WORDS here, as in cpl_chat.js (#1231). They were the one
    // place in this bar where a glyph carried meaning no text repeated, so they
    // could not simply be dropped — and spelling them out is also the accessible
    // fix, because a bare 👍 announces as "thumbs up", which is a description of
    // the picture rather than of what pressing it says. The aria-label stays: it
    // is the full sentence, and the visible word is the short form of it.
    [['up', 'Helpful', 'This answer was helpful'], ['down', 'Not helpful', 'This answer was not helpful']]
      .forEach(function (spec) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 's-fb-btn';
        b.textContent = spec[1];
        b.setAttribute('aria-label', spec[2]);
        b.addEventListener('click', function () {
          rating = spec[0];
          btns.up.classList.toggle('on', rating === 'up');
          btns.down.classList.toggle('on', rating === 'down');
          hint.textContent = 'Thanks — logged.';
          noteWrap.hidden = false;
          upsert(noteIn.value.trim() || null);
        });
        btns[spec[0]] = b;
        bar.appendChild(b);
      });

    noteBtn.addEventListener('click', function () {
      var n = noteIn.value.trim();
      if (!n || !rating) return;
      noteBtn.disabled = true;
      noteDone.hidden = false;
      noteDone.className = 's-fb-sending';
      noteDone.textContent = 'Sending…';
      upsert(n).then(function (ok) {
        noteDone.hidden = false;
        if (ok) {
          noteIn.value = '';
          noteIn.hidden = true;
          noteBtn.hidden = true;
          noteDone.className = 's-fb-done';
          noteDone.textContent = 'Note sent — thank you!';
        } else {
          // Keep the typed text on failure — never a cheerful tick over a
          // write that did not land.
          noteBtn.disabled = false;
          noteDone.className = 's-fb-fail';
          noteDone.textContent = 'Not sent — your note is still here, try again.';
        }
      });
    });
    noteIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); noteBtn.click(); }
    });

    bar.appendChild(noteWrap);
    if (afterRow && afterRow.parentNode) {
      afterRow.parentNode.insertBefore(bar, afterRow.nextSibling);
    } else {
      logEl.appendChild(bar);
    }
  }

  function sessionId() {
    try {
      var k = 'cpl_sierra_page_session', v = sessionStorage.getItem(k);
      if (!v) {
        v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : 'sess-' + Date.now() + '-' + Math.random().toString(16).slice(2);
        sessionStorage.setItem(k, v);
      }
      return v;
    } catch (e) { return 'sess-' + Date.now(); }
  }

  // ── Markdown-lite → safe HTML (escape FIRST, then a tiny subset) ──
  // Upgraded 2026-07-02 (SkySierra): Sierra's answers routinely carry ##/###
  // headings, | pipe | tables |, --- rules, and 1. numbered lists — the old
  // paragraph/bullet-only pass showed those as raw text. Still escape-first
  // (model text can never inject markup), and the pass re-runs on every
  // streamed delta, so a half-arrived table degrades to a paragraph until its
  // separator row lands.
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  // Links (Sam, 2026-10-27: "I want links embedded for all references in
  // sierra"). She wrote creditforbeingyou.org bare, quoting his instruction, and
  // only an https address became a link. Now a markdown link may be http(s) or
  // mailto, and a bare https address, a bare email and a bare domain on a known
  // ending (creditforbeingyou.org, map.rccd.edu/...) become links too. A trailing
  // period stays text. The bare pass skips the anchors already made, so a link
  // never nests in another.
  var LINK_ATTRS = ' target="_blank" rel="noopener noreferrer"';
  var BARE_LINK = /(^|[\s(>])(?:(https?:\/\/[^\s<)]*[^\s<).,;:!?])|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})|((?:[A-Za-z0-9-]+\.)+(?:org|edu|gov|com|net|us|io)(?![A-Za-z0-9-])(?:\/(?:[^\s<)]*[^\s<).,;:!?])?)?))/g;
  function linkBare(s) {
    return s.split(/(<a [^>]*>[\s\S]*?<\/a>)/).map(function (part, i) {
      if (i % 2) return part;
      return part.replace(BARE_LINK, function (m, pre, url, mail, host) {
        if (url) return pre + '<a href="' + url + '"' + LINK_ATTRS + '>' + url + '</a>';
        if (mail) return pre + '<a href="mailto:' + mail + '">' + mail + '</a>';
        return pre + '<a href="https://' + host + '"' + LINK_ATTRS + '>' + host + '</a>';
      });
    }).join('');
  }
  function inlineMd(s) {
    return linkBare(s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)]+)\)/g, function (m, text, href) {
        return '<a href="' + href + '"' + (/^mailto:/.test(href) ? '' : LINK_ATTRS) + '>' + text + '</a>';
      }));
  }
  var MD_TABLE_SEP = /^\s*\|?\s*:?-{2,}[-\s:|]*$/;   // | --- | :--- | …
  function mdCells(row) {
    return row.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|')
      .map(function (c) { return c.trim(); });
  }
  function renderMarkdown(text) {
    var lines = escapeHtml(text).split(/\n/);
    var html = '', para = [], list = null;
    function flushPara() {
      if (para.length) { html += '<p>' + para.map(inlineMd).join('<br>') + '</p>'; para = []; }
    }
    function flushList() {
      if (list) {
        html += '<' + list.t + '>' + list.items.map(function (it) {
          return '<li>' + inlineMd(it) + '</li>';
        }).join('') + '</' + list.t + '>';
        list = null;
      }
    }
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (!t) { flushPara(); flushList(); continue; }
      // horizontal rule (--- / *** / ___ on its own line)
      if (/^(?:-{3,}|_{3,}|\*{3,})$/.test(t)) { flushPara(); flushList(); html += '<hr>'; continue; }
      // headings: # / ## → h3 (bubble-scale), ### → h4, #### → h5
      var hm = t.match(/^(#{1,4})\s+(.+)$/);
      if (hm) {
        flushPara(); flushList();
        var lvl = hm[1].length <= 2 ? 3 : hm[1].length + 1;
        html += '<h' + lvl + '>' + inlineMd(hm[2]) + '</h' + lvl + '>';
        continue;
      }
      // table: a | header | row directly above a |---|---| separator row
      if (t.indexOf('|') > -1 && i + 1 < lines.length
          && lines[i + 1].indexOf('|') > -1 && MD_TABLE_SEP.test(lines[i + 1])) {
        flushPara(); flushList();
        var head = mdCells(t), body = [];
        i += 1; // consume the separator row
        while (i + 1 < lines.length && lines[i + 1].trim().indexOf('|') > -1
               && !MD_TABLE_SEP.test(lines[i + 1])) {
          i += 1;
          body.push(mdCells(lines[i].trim()));
        }
        html += '<table><thead><tr>' + head.map(function (c) {
          return '<th>' + inlineMd(c) + '</th>';
        }).join('') + '</tr></thead>';
        if (body.length) {
          html += '<tbody>' + body.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inlineMd(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody>';
        }
        html += '</table>';
        continue;
      }
      // bullet + numbered lists (consecutive runs group; type switch splits)
      var ul = t.match(/^[-*•]\s+(.+)$/);
      var ol = ul ? null : t.match(/^\d{1,3}[.)]\s+(.+)$/);
      if (ul || ol) {
        flushPara();
        var kind = ul ? 'ul' : 'ol';
        if (!list || list.t !== kind) { flushList(); list = { t: kind, items: [] }; }
        list.items.push(ul ? ul[1] : ol[1]);
        continue;
      }
      flushList();
      para.push(t);
    }
    flushPara(); flushList();
    return html;
  }

  // Parse one SSE event block ("event: <name>\ndata: <json>")
  function parseSse(block) {
    var out = { event: 'message', data: '' };
    var got = false;
    block.split('\n').forEach(function (line) {
      if (line.indexOf('event:') === 0) { out.event = line.slice(6).trim(); got = true; }
      else if (line.indexOf('data:') === 0) { out.data += line.slice(5).trim(); got = true; }
    });
    return got ? out : null;
  }

  // ── DOM helpers ──
  function addUserMsg(text) {
    var row = document.createElement('div');
    row.className = 's-msg s-user';
    var bubble = document.createElement('div');
    bubble.className = 's-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    logEl.appendChild(row);
    showQuestion(row);
  }
  // The Sierra mark — Mt Whitney's east-face ridge (sierra/whitney-mark.svg)
  // in a navy roundel. A STATIC, trusted string (never user input) inlined so
  // the mark needs no relative-path asset. All three surfaces draw it beside
  // each answer; this page sets it beside her name in words.
  var SIERRA_MARK =
    '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<circle cx="20" cy="20" r="19" style="fill:var(--sierra-navy,#002F6D)"/>' +
    '<path d="M2 30 L12 25 21 17 29 9 35 4 40 1 43 6 46 4 49 9 52 7 55 11 59 15 63 19 66 22 70 18 73 20 76 15 79 13 82 16 85 20 90 24 97 27 105 29 118 30"' +
    ' transform="translate(4 15.4) scale(0.2667)" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="M40 5.4 L37.4 10.6 38.9 9.6 40 11 41.1 9.5 42.6 10.7 40 5.4 Z"' +
    ' transform="translate(-7.33 13.83) scale(0.55)" fill="#fff"/>' +
    '</svg>';

  function addAssistantMsg() {
    var row = document.createElement('div');
    row.className = 's-msg s-bot';
    // Her name in words, beside her mark (Sam, 2026-10-08: "I like the mountain line").
    var who = document.createElement('div');
    who.className = 's-who';
    var mark = document.createElement('span');
    mark.className = 's-mark'; mark.setAttribute('aria-hidden', 'true'); mark.innerHTML = SIERRA_MARK;
    who.appendChild(mark);
    who.appendChild(document.createTextNode('Sierra'));
    var bubble = document.createElement('div');
    bubble.className = 's-bubble';
    row.appendChild(who); row.appendChild(bubble);
    logEl.appendChild(row);
    return { row: row, bubble: bubble };
  }
  // The page scrolls, not the log (the redesign's centered column with a docked
  // bar). A new question is brought to the top of the screen and the answer
  // grows beneath it, so a reader starts at the first line of the answer and
  // the page never chases the stream past what they are reading.
  function showQuestion(row) {
    if (!row || typeof row.scrollIntoView !== 'function') return;
    requestAnimationFrame(function () {
      try { row.scrollIntoView({ block: 'start', behavior: motionOk() ? 'smooth' : 'auto' }); }
      catch (e) { /* scrolling is a courtesy */ }
    });
  }
  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 's-status' + (kind ? ' s-' + kind : '');
  }

  // Request body — ctx rides ONLY when the ?ctx=external variant is active, so
  // a normal visit's payload is byte-identical to pre-v27 (fail-open).
  function buildPayload(query) {
    // `surface` is the CALLER; `ctx` is the contacts gate. The vendor iframe is
    // this same public page with ctx=external, so it keeps surface 'public' —
    // two axes, deliberately not collapsed into one.
    var p = { query: query, session_id: sessionId(), history: convo.slice(),
              audience: audience, surface: hostSurface() };
    if (ctxVariant) p.ctx = ctxVariant;
    return p;
  }

  // ── Call the Edge Function + stream the SSE response ──
  async function ask(query) {
    var msg = addAssistantMsg();
    var bubble = msg.bubble;
    bubble.innerHTML = '<span class="s-typing">●●●</span>';
    var full = '';

    var resp;
    try {
      resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
        },
        body: JSON.stringify(buildPayload(query)),
      });
    } catch (e) {
      bubble.innerHTML = renderMarkdown('Sorry — I couldn\'t reach the assistant. Please check your connection and try again.');
      return;
    }

    if (!resp.ok) {
      var msg = 'Sorry — something went wrong (error ' + resp.status + ').';
      if (resp.status === 429) msg = 'I\'m getting a lot of questions right now. Please wait a minute and try again.';
      bubble.innerHTML = renderMarkdown(msg);
      return;
    }
    if (!resp.body || !resp.body.getReader) {
      var txt = await resp.text();
      bubble.innerHTML = renderMarkdown(txt || 'No response.');
      return;
    }

    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var firstToken = true;
    try {
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var rawEvents = buffer.split('\n\n');
        buffer = rawEvents.pop() || '';
        for (var i = 0; i < rawEvents.length; i++) {
          var evt = parseSse(rawEvents[i]);
          if (!evt) continue;
          if (evt.event === 'text') {
            try {
              var d = JSON.parse(evt.data);
              if (d && typeof d.text === 'string') {
                if (firstToken) { bubble.innerHTML = ''; firstToken = false; }
                full += d.text;
                bubble.innerHTML = renderMarkdown(full);
              }
            } catch (e) { /* skip malformed delta */ }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    if (!full) {
      bubble.innerHTML = renderMarkdown('I don\'t have an answer for that yet. Try rephrasing, or email MAP@rccd.edu.');
      return;
    }
    convo.push({ role: 'user', content: query }, { role: 'assistant', content: full });
    if (convo.length > CONVO_MAX) convo = convo.slice(-CONVO_MAX);
    addFeedbackBar(msg.row, query, full);
  }

  // ── Submit flow ──
  var busy = false;
  async function submit() {
    if (busy) return;
    var q = (inputEl.value || '').trim();
    if (!q) { inputEl.focus(); return; }
    if (!audience) { askWho(); return; }
    busy = true;
    sendBtn.disabled = true; inputEl.disabled = true;
    setView('asking');          // the landing folds away at the first question
    addUserMsg(q);
    inputEl.value = '';
    fitInput();
    setStatus('Sierra is thinking…', 'pending');
    try {
      await ask(q);
      setStatus('');
    } catch (e) {
      setStatus('Something went wrong. Please try again.', 'error');
    } finally {
      busy = false;
      sendBtn.disabled = false; inputEl.disabled = false;
      inputEl.focus();
    }
  }

  /* ─── Scroll regions the keyboard can reach ────────────────────────────────
   *
   * A container that scrolls can be dragged with a mouse and swiped with a
   * finger, but is UNREACHABLE by keyboard unless it is focusable (WCAG 2.1.1).
   * Two here:
   *
   *   · #s-log holds every answer Sierra has given. Since the 2026-10-08
   *     redesign the page scrolls and the log does not, so this branch is a
   *     guard: an embed or a future layout that gives the log a height of its
   *     own must not leave a keyboard user unable to read past its fold, which
   *     is what happened once the starter pills inside it were removed.
   *
   *   · a markdown table inside an answer (.s-bubble table is display:block +
   *     overflow-x:auto, so a wide one scrolls sideways rather than pushing the
   *     page). Same problem, same fix.
   *
   * Focusable ONLY while it actually overflows, exactly as the Fact Sheet's
   * .tbl-wrap does — otherwise a short conversation leaves a tab stop that does
   * nothing, which is its own small failure. Re-synced after every render and on
   * resize, because which state it is in depends on the content AND the
   * viewport. Names are taken from what is already on the element, never
   * invented: #s-log carries aria-label="Conversation with Sierra" in the
   * markup. */
  function syncScrollRegions() {
    if (logEl) {
      if (logEl.scrollHeight > logEl.clientHeight + 1) {
        logEl.setAttribute('tabindex', '0');
      } else {
        logEl.removeAttribute('tabindex');
      }
    }
    var tables = document.querySelectorAll('.s-bubble table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (t.scrollWidth > t.clientWidth + 1) {
        t.setAttribute('tabindex', '0');
        t.setAttribute('role', 'region');
        if (!t.getAttribute('aria-label')) {
          var head = t.querySelector('th');
          var lead = head ? (head.textContent || '').replace(/\s+/g, ' ').trim() : '';
          t.setAttribute('aria-label', (lead ? lead + ' table' : 'Table') + ' (scrollable)');
        }
        t.classList.add('s-scrollx');
      } else {
        t.removeAttribute('tabindex');
        t.removeAttribute('role');
        t.classList.remove('s-scrollx');
      }
    }
  }

  // ── ?ask= prefill (S327) ──
  // A page that links here with a question (CPL Pathways' "Ask Sierra": "What
  // does the <program> at <college> require, and which of its courses can a
  // learner clear through credit for prior learning?") puts it in the box. It
  // never sends: the visitor picks an audience first and presses Send. Plain
  // text, control characters dropped, capped at ASK_MAX characters.
  var ASK_MAX = 500;
  function askFromUrl() {
    try {
      var q = new URLSearchParams(location.search).get('ask');
      if (!q) return '';
      return q.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, ASK_MAX);
    } catch (e) { return ''; }
  }
  function prefillAsk() {
    var q = askFromUrl();
    if (q && inputEl && !inputEl.value) inputEl.value = q;
  }

  // ── The question box grows with what it holds ──
  // A one-row textarea. Empty, it sizes to the tallest hint it will show, so a
  // "Try: …" starter wraps whole on a phone and the bar keeps one height while
  // the starters cycle; holding text, it sizes to the text, up to a cap past
  // which it scrolls (a scrolling textarea is itself keyboard reachable).
  var INPUT_MAX_PX = 210;
  function fitInput() {
    if (!inputEl || inputEl.tagName !== 'TEXTAREA') return;
    var v = inputEl.value, h = 0;
    inputEl.style.height = 'auto';
    // scrollHeight leaves the border out, and the box is sized border-box.
    var edge = inputEl.offsetHeight - inputEl.clientHeight;
    if (v) h = inputEl.scrollHeight;
    else {
      // An empty box fits its one placeholder, so a long "Try:" wraps whole.
      inputEl.value = inputEl.placeholder;
      h = inputEl.scrollHeight;
      inputEl.value = '';
    }
    // No layout (a test DOM, a hidden frame) reads 0: leave the stylesheet's size.
    inputEl.style.height = h ? Math.min(h + edge, INPUT_MAX_PX) + 'px' : '';
    inputEl.style.overflowY = h > INPUT_MAX_PX ? 'auto' : 'hidden';
  }

  // ── Motion ──
  // An answer scrolls into view smoothly only when the reader's browser can say
  // motion is welcome. No matchMedia means the preference cannot be read, so the page
  // holds still: a failure here should fail toward calm, never toward movement.
  function motionOk() {
    try {
      return !!(window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  // ── The starter questions (arriving view) ──
  // Each is a word that asks itself: it fills the box and sends, so the audience
  // rule still holds (no pick, and the refusal says where the words are).
  function renderTries() {
    var list = document.getElementById('s-try-list');
    if (!list) return;
    list.textContent = '';
    TRIES.forEach(function (q) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 's-try-q';
      b.textContent = q;
      b.addEventListener('click', function () {
        if (!inputEl || busy) return;
        inputEl.value = q;
        fitInput();
        submit();
      });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  // ── Light and Dark (the public header's words) ──
  // They set data-theme and remember the choice as cpl_theme, the key COBI and
  // the library read. With no choice the page follows the OS, and the word
  // pressed is the one the OS gives.
  // Light unless the reader picked Dark (Sam, Open Asks Sheet 126 card 2): the
  // device's setting never decides it.
  function themeNow() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function paintTheme() {
    var t = themeNow();
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-pick]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-pick') === t ? 'true' : 'false');
    });
  }
  function wireTheme() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-pick]'), function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-theme-pick') === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', t);
        try { localStorage.setItem('cpl_theme', t); } catch (e) { /* a private window: the choice holds for this visit */ }
        paintTheme();
      });
    });
    // A choice made in another tab holds here; COBI's System, or a cleared choice, reads as Light.
    window.addEventListener('storage', function (e) {
      if (!e || e.key !== 'cpl_theme') return;
      document.documentElement.setAttribute('data-theme', e.newValue === 'dark' ? 'dark' : 'light');
      paintTheme();
    });
    // A host that frames her (sidebar.js) sets data-theme on this page directly.
    if (window.MutationObserver) {
      new MutationObserver(paintTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
    paintTheme();
  }

  // ── The two views ──
  // arriving: the greeting, the question box and the starter questions.
  // asking:   the conversation in a centered column, the question box docked.
  // The view lives on <body data-view>, and the one form moves between the
  // frame and the dock, so its ids (s-form, s-input, s-send, s-audience) stay
  // single for every caller: the tests, the a11y sweep and the vendor embed.
  var view = 'arriving';
  function setView(v) {
    v = v === 'asking' ? 'asking' : 'arriving';
    var frame = document.getElementById('s-frame'), dock = document.getElementById('s-dock');
    if (formEl && frame && dock) {
      var home = v === 'asking' ? dock : frame;
      if (formEl.parentNode !== home) home.insertBefore(formEl, home.firstChild);
    }
    if (document.body) document.body.setAttribute('data-view', v);
    if (inputEl) inputEl.placeholder = v === 'asking'
      ? 'Ask a follow-up'
      : 'Try: ' + FIRST_TRY;
    setAudienceOpen(false);
    view = v;
    fitInput();
  }
  // New question starts over: the landing comes back, the conversation and the
  // history Sierra reads are cleared, and the cursor waits in the question box.
  function newQuestion() {
    if (busy) return;
    convo = [];
    if (logEl) logEl.textContent = '';
    setStatus('');
    setView('arriving');
    if (inputEl) { inputEl.value = ''; fitInput(); try { inputEl.focus(); } catch (e) { /* best effort */ } }
    try { (document.scrollingElement || document.documentElement).scrollTop = 0; } catch (e) { /* best effort */ }
  }

  function wire() {
    if (wired) return; // idempotent (guards a double DOMContentLoaded)
    wired = true;
    logEl = document.getElementById('s-log');
    inputEl = document.getElementById('s-input');
    sendBtn = document.getElementById('s-send');
    statusEl = document.getElementById('s-status');
    formEl = document.getElementById('s-form');
    audEl = document.getElementById('s-audience');
    audToggle = document.getElementById('s-aud-toggle');
    audLine = document.getElementById('s-aud-line');
    if (!logEl || !inputEl || !sendBtn || !formEl) return;

    loadAudience();
    renderAudience();
    wireAbout();
    wireTheme();
    renderTries();
    if (inputEl) inputEl.placeholder = 'Try: ' + FIRST_TRY;
    prefillAsk();

    if (audToggle) audToggle.addEventListener('click', function () {
      setAudienceOpen(!audEl.classList.contains('open'));
    });
    var newBtn = document.getElementById('s-new');
    if (newBtn) newBtn.addEventListener('click', newQuestion);
    formEl.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    // Enter sends, as it did when this was a one-line input; Shift+Enter is a
    // new line; a composing IME's Enter belongs to the IME.
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
    });
    inputEl.addEventListener('input', fitInput);
    window.addEventListener('resize', fitInput);
    fitInput();

    /* Content arrives from streaming tokens, not from a single render call, so
       a one-shot sync would be wrong for every answer after the first. Watching
       the log covers every path that adds to it — a new bubble, a streamed
       token, a rendered table — without each of them having to remember. */
    if (window.MutationObserver && logEl) {
      var mo = new MutationObserver(function () { syncScrollRegions(); });
      mo.observe(logEl, { childList: true, subtree: true, characterData: true });
    }
    window.addEventListener('resize', syncScrollRegions);
    syncScrollRegions();

    inputEl.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // Expose the pure helpers for the jsdom test.
  window.CPL_SIERRA_PAGE = {
    setAbout: setAbout,
    escapeHtml: escapeHtml, inlineMd: inlineMd, renderMarkdown: renderMarkdown,
    parseSse: parseSse, CHAT_URL: CHAT_URL, SUGGESTED: SUGGESTED,
    AUDIENCES: AUDIENCES, AUD_KEY: AUD_KEY, feedbackPayload: feedbackPayload,
    SIERRA_MARK: SIERRA_MARK, ctxVariant: ctxVariant, buildPayload: buildPayload,
    syncScrollRegions: syncScrollRegions,
    TRIES: TRIES, setView: setView, paintTheme: paintTheme, WHO_PROMPT: WHO_PROMPT,
    getView: function () { return view; },
    panel: function () { return document.documentElement.hasAttribute('data-panel'); },
  };
})();
