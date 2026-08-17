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

   The request/stream/markdown logic is the proven port from cpl_chat.js /
   factsheet_sierra.js. Model output is HTML-escaped BEFORE the markdown-lite
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

  // Starter prompts — a mix that shows off the offerings/adoption reasoning
  // (construction/NCCER, "near me") plus the classic statewide/metrics asks.
  var SUGGESTED = [
    'What is Credit for Prior Learning?',
    'Where can students get college credit for NCCER or OSHA certifications?',
    'Which colleges near Long Beach teach construction or welding?',
    'How can I get credit for a real estate license?',
    'How much has CPL saved California students?',
  ];

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
  var logEl, inputEl, sendBtn, statusEl, formEl, suggestEl, audEl, wired = false;

  // ── Audience (primary population) ──
  // Required before the first question (Sam, 2026-07-01): the visitor picks who
  // they are so Sierra tailors tone + content — students shouldn't get system
  // inside-baseball (articulation mechanics, apportionment, C-ID governance).
  // Single-select (it's the PRIMARY population), persisted per-browser and
  // SHARED with the COBI CPL Assistant tab (same origin, same key). Sent as an
  // optional `audience` field — callers that omit it (the map.rccd.edu widget)
  // are unaffected.
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
  function renderAudience() {
    if (!audEl) return;
    audEl.textContent = '';
    var lab = document.createElement('span');
    lab.className = 's-aud-label';
    lab.textContent = "I'm a…";
    audEl.appendChild(lab);
    AUDIENCES.forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 's-aud-chip' + (audience === a.k ? ' on' : '');
      b.setAttribute('aria-pressed', audience === a.k ? 'true' : 'false');
      b.textContent = a.label;
      b.addEventListener('click', function () { setAudience(a.k); setStatus(''); });
      audEl.appendChild(b);
    });
  }
  // Flash the selector when a send is attempted without a pick.
  function needAudience() {
    setStatus('First, tap who you are above — it helps Sierra tailor the answer for you.', 'error');
    if (!audEl) return;
    audEl.classList.add('s-need');
    setTimeout(function () { audEl.classList.remove('s-need'); }, 1700);
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
    // and it should not sit behind the rating flow. Reuses the .s-fb-btn pill so
    // it needs no new CSS and inherits the theme tokens.
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
    scrollDown();
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
  function inlineMd(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|[\s(])((https?:\/\/)[^\s)]+)(?=[\s).,;!?]|$)/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
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
    scrollDown();
  }
  // The Sierra mark — Mt Whitney's east-face ridge (sierra/whitney-mark.svg)
  // in a navy roundel. A STATIC, trusted string (never user input) inlined so
  // the avatar needs no relative-path asset and renders at any mount depth.
  var SIERRA_MARK =
    '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<circle cx="20" cy="20" r="19" style="fill:var(--sierra-navy,#0b3d61)"/>' +
    '<path d="M2 30 L12 25 21 17 29 9 35 4 40 1 43 6 46 4 49 9 52 7 55 11 59 15 63 19 66 22 70 18 73 20 76 15 79 13 82 16 85 20 90 24 97 27 105 29 118 30"' +
    ' transform="translate(4 15.4) scale(0.2667)" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="M40 5.4 L37.4 10.6 38.9 9.6 40 11 41.1 9.5 42.6 10.7 40 5.4 Z"' +
    ' transform="translate(-7.33 13.83) scale(0.55)" fill="#fff"/>' +
    '</svg>';

  function addAssistantMsg() {
    var row = document.createElement('div');
    row.className = 's-msg s-bot';
    var avatar = document.createElement('div');
    avatar.className = 's-avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.innerHTML = SIERRA_MARK;
    var bubble = document.createElement('div');
    bubble.className = 's-bubble';
    row.appendChild(avatar); row.appendChild(bubble);
    logEl.appendChild(row);
    scrollDown();
    return { row: row, bubble: bubble };
  }
  function scrollDown() {
    if (logEl) requestAnimationFrame(function () { logEl.scrollTop = logEl.scrollHeight; });
  }
  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 's-status' + (kind ? ' s-' + kind : '');
  }

  // Request body — ctx rides ONLY when the ?ctx=external variant is active, so
  // a normal visit's payload is byte-identical to pre-v27 (fail-open).
  function buildPayload(query) {
    var p = { query: query, session_id: sessionId(), history: convo.slice(), audience: audience };
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
                scrollDown();
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
    if (!audience) { needAudience(); return; }
    busy = true;
    sendBtn.disabled = true; inputEl.disabled = true;
    addUserMsg(q);
    inputEl.value = '';
    setStatus('Sierra is thinking…', 'pending');
    if (suggestEl) suggestEl.remove(); // hide starter chips after first question
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

  function wire() {
    if (wired) return; // idempotent (guards a double DOMContentLoaded)
    wired = true;
    logEl = document.getElementById('s-log');
    inputEl = document.getElementById('s-input');
    sendBtn = document.getElementById('s-send');
    statusEl = document.getElementById('s-status');
    formEl = document.getElementById('s-form');
    suggestEl = document.getElementById('s-suggest');
    audEl = document.getElementById('s-audience');
    if (!logEl || !inputEl || !sendBtn || !formEl) return;

    loadAudience();
    renderAudience();

    // Fill starter chips
    if (suggestEl) {
      SUGGESTED.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 's-chip'; b.textContent = s;
        b.addEventListener('click', function () { inputEl.value = s; submit(); });
        suggestEl.appendChild(b);
      });
    }
    formEl.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    inputEl.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // Expose the pure helpers for the jsdom test.
  window.CPL_SIERRA_PAGE = {
    escapeHtml: escapeHtml, inlineMd: inlineMd, renderMarkdown: renderMarkdown,
    parseSse: parseSse, CHAT_URL: CHAT_URL, SUGGESTED: SUGGESTED,
    AUDIENCES: AUDIENCES, AUD_KEY: AUD_KEY, feedbackPayload: feedbackPayload,
    SIERRA_MARK: SIERRA_MARK, ctxVariant: ctxVariant, buildPayload: buildPayload,
  };
})();
