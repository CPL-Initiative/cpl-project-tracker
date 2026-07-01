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
  var logEl, inputEl, sendBtn, statusEl, formEl, suggestEl, wired = false;

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
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function inlineMd(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(^|[\s(])((https?:\/\/)[^\s)]+)(?=[\s).,;!?]|$)/g,
        '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  }
  function renderMarkdown(text) {
    var safe = escapeHtml(text);
    var blocks = safe.split(/\n{2,}/);
    var html = '';
    blocks.forEach(function (block) {
      var lines = block.split(/\n/);
      var isList = lines.length && lines.every(function (l) { return /^\s*[-*]\s+/.test(l) || l.trim() === ''; });
      if (isList) {
        html += '<ul>' + lines.filter(function (l) { return l.trim(); })
          .map(function (l) { return '<li>' + inlineMd(l.replace(/^\s*[-*]\s+/, '')) + '</li>'; })
          .join('') + '</ul>';
      } else {
        html += '<p>' + inlineMd(block.replace(/\n/g, '<br>')) + '</p>';
      }
    });
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
  function addAssistantMsg() {
    var row = document.createElement('div');
    row.className = 's-msg s-bot';
    var avatar = document.createElement('div');
    avatar.className = 's-avatar'; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = '🏔️';
    var bubble = document.createElement('div');
    bubble.className = 's-bubble';
    row.appendChild(avatar); row.appendChild(bubble);
    logEl.appendChild(row);
    scrollDown();
    return bubble;
  }
  function scrollDown() {
    if (logEl) requestAnimationFrame(function () { logEl.scrollTop = logEl.scrollHeight; });
  }
  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.className = 's-status' + (kind ? ' s-' + kind : '');
  }

  // ── Call the Edge Function + stream the SSE response ──
  async function ask(query) {
    var bubble = addAssistantMsg();
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
        body: JSON.stringify({ query: query, session_id: sessionId(), history: convo.slice() }),
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
  }

  // ── Submit flow ──
  var busy = false;
  async function submit() {
    if (busy) return;
    var q = (inputEl.value || '').trim();
    if (!q) { inputEl.focus(); return; }
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
    if (!logEl || !inputEl || !sendBtn || !formEl) return;

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
  };
})();
