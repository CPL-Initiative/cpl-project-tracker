/*
 * CPL Dashboard — Quick-start chat (Tier A: routing only)
 *
 * Lightweight banner at the top of every tab: "What are you working on today?"
 * Sends the user's prompt to Claude via the existing Cloudflare Worker proxy
 * (window.CPL_REPORT_PROXY_URL), gets back a structured JSON {tab, message},
 * and sets location.hash so the existing tab-router (CPL_Dashboard.html ~13091)
 * navigates the user to the right pane.
 *
 * No filters applied (yet) — promoting to tier B will read a `filter_hint` key
 * from the same response and drop it into sessionStorage for the target tab.
 *
 * Sidebar/tabs stay intact; this is a quick-start affordance, not a replacement.
 */
(function () {
  'use strict';

  // ── Config ──
  var MODEL = 'claude-sonnet-4-5-20250929'; // same as report_generator.js
  var MAX_TOKENS = 256;                     // routing JSON is small
  var PROXY_URL = window.CPL_REPORT_PROXY_URL || '';
  var STORAGE_KEY = 'cpl_quickstart_last';  // last user input (for /reuse niceties)

  // Tabs known to the router — keep in sync with VALID_TABS in CPL_Dashboard.html (~line 13091).
  var TABS = [
    {hash: 'dashboard',            label: 'Dashboard',                desc: 'KPI overview, projects grid, activity metrics'},
    {hash: 'workplan-goals',       label: 'Annual Workplan Goals',    desc: 'Five-year CPL goals with annual progress'},
    {hash: 'budget',               label: 'Budget',                   desc: 'CPL budget and expenditure plan'},
    {hash: 'vision-2030',          label: 'Vision 2030',              desc: 'Alignment cards showing CPL contribution to Vision 2030'},
    {hash: 'unified-courses',      label: 'Common Course Reference',  desc: 'Curate common-course identities (CCN-ID / C-ID / M-ID), disciplines, descriptions'},
    {hash: 'canonical-subj4',      label: 'Common Subject Code',      desc: 'Curate the 4-letter subject code per MQ discipline'},
    {hash: 'credential-reference', label: 'Credential Reference',     desc: 'Curate credential identities — unified credential names, issuing agencies'},
    {hash: 'pipeline',             label: 'Pipeline',                 desc: 'Data pipeline reference / methodology'},
  ];

  var VALID_HASHES = TABS.map(function (t) { return t.hash; });

  function buildSystemPrompt() {
    var tabLines = TABS.map(function (t) {
      return '- ' + t.hash + ': ' + t.label + ' — ' + t.desc;
    }).join('\n');
    return [
      'You are a routing assistant for the California Community Colleges CPL Initiative dashboard.',
      'The dashboard has these tabs:',
      '',
      tabLines,
      '',
      'When the user describes what they want to do today, output ONLY a JSON object with these keys:',
      '  "tab": one of the hash values above (REQUIRED)',
      '  "message": a friendly one-sentence confirmation (REQUIRED, ≤25 words)',
      '',
      'If the user\'s intent is ambiguous, pick the closest match and make the message briefly explain why.',
      'If the user just asks a general question or wants to explore, route to "dashboard".',
      'If the user asks about credentials, certifications, exhibits, or industry certs → "credential-reference".',
      'If the user asks about courses, course identities, C-ID / M-ID / CCN → "unified-courses".',
      'If the user asks about discipline codes or subject abbreviations → "canonical-subj4".',
      'Respond with the JSON object only — no preamble, no code fences.',
    ].join('\n');
  }

  function extractJson(text) {
    if (!text) return null;
    // Strip code fences if present (Claude sometimes wraps JSON in ```json…```)
    var stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    try { return JSON.parse(stripped); } catch (e) { /* fall through */ }
    // Last-resort: find the first { … } substring
    var m = stripped.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch (e2) { return null; }
    }
    return null;
  }

  async function askClaude(userPrompt) {
    if (!PROXY_URL) {
      throw new Error('Chat proxy not configured (window.CPL_REPORT_PROXY_URL is unset).');
    }
    var body = JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(),
      messages: [{role: 'user', content: userPrompt}],
    });
    var resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: body,
    });
    if (!resp.ok) {
      var errText = await resp.text();
      throw new Error('API error ' + resp.status + ': ' + errText.substring(0, 200));
    }
    var json = await resp.json();
    if (!(json.content && json.content[0] && json.content[0].text)) {
      throw new Error('Unexpected API response (no content[0].text)');
    }
    var parsed = extractJson(json.content[0].text);
    if (!parsed || !parsed.tab) {
      throw new Error('Could not parse routing JSON from response.');
    }
    if (VALID_HASHES.indexOf(parsed.tab) === -1) {
      throw new Error('Routing returned unknown tab: ' + parsed.tab);
    }
    return parsed; // {tab, message}
  }

  // ── DOM ──
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'style') {
          for (var s in attrs.style) n.style[s] = attrs.style[s];
        } else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          n.addEventListener(k.slice(2), attrs[k]);
        } else if (k === 'className') {
          n.className = attrs[k];
        } else {
          n.setAttribute(k, attrs[k]);
        }
      }
    }
    if (kids) {
      if (!Array.isArray(kids)) kids = [kids];
      kids.forEach(function (c) {
        if (typeof c === 'string') n.appendChild(document.createTextNode(c));
        else if (c instanceof Node) n.appendChild(c);
      });
    }
    return n;
  }

  function buildWidget() {
    var wrap = el('div', {id: 'qs-chat', className: 'qs-chat'});

    var label = el('label', {className: 'qs-label', 'for': 'qs-input'}, '✨ What are you working on today?');
    wrap.appendChild(label);

    var row = el('div', {className: 'qs-row'});
    var input = el('input', {
      type: 'text',
      id: 'qs-input',
      className: 'qs-input',
      placeholder: 'e.g. review credentials, check our discipline coverage, jump to budget…',
      autocomplete: 'off',
      maxlength: '500',
    });
    var btn = el('button', {
      type: 'button',
      className: 'qs-go',
      'aria-label': 'Go',
    }, 'Go →');
    row.appendChild(input);
    row.appendChild(btn);
    wrap.appendChild(row);

    var status = el('div', {className: 'qs-status', id: 'qs-status', 'aria-live': 'polite'});
    wrap.appendChild(status);

    // Last-typed memory (just to spare the next visit)
    var last = '';
    try { last = sessionStorage.getItem(STORAGE_KEY) || ''; } catch (e) { /* private mode */ }
    if (last) input.value = last;

    function setStatus(text, kind) {
      status.textContent = text || '';
      status.className = 'qs-status' + (kind ? ' qs-status-' + kind : '');
    }

    async function submit() {
      var q = (input.value || '').trim();
      if (!q) { input.focus(); return; }
      try { sessionStorage.setItem(STORAGE_KEY, q); } catch (e) { /* ignore */ }

      btn.disabled = true; input.disabled = true;
      setStatus('Thinking…', 'pending');
      try {
        var routed = await askClaude(q);
        setStatus(routed.message || ('Going to ' + routed.tab + '…'), 'ok');
        // Brief pause so the user sees the confirmation before the tab swaps.
        setTimeout(function () {
          location.hash = routed.tab;
          btn.disabled = false; input.disabled = false;
          input.focus();
        }, 350);
      } catch (e) {
        setStatus(e.message || 'Sorry — could not route that. Try rephrasing.', 'error');
        btn.disabled = false; input.disabled = false;
      }
    }

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
    });

    return wrap;
  }

  function mount() {
    // Insert between the page header and the nav-tabs row.
    var nav = document.querySelector('nav.cpl-tabs');
    if (!nav || !nav.parentNode) {
      console.warn('[quickstart] nav.cpl-tabs not found; skipping mount');
      return;
    }
    var existing = document.getElementById('qs-chat');
    if (existing) return; // idempotent
    var widget = buildWidget();
    nav.parentNode.insertBefore(widget, nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
