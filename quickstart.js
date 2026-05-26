/*
 * CPL Dashboard — Quick-start chat (Tier A routing + Tier B filter hints)
 *
 * Lightweight banner at the top of every tab: "What are you working on today?"
 * Sends the user's prompt to Claude via the existing Cloudflare Worker proxy
 * (window.CPL_REPORT_PROXY_URL), gets back a structured JSON {tab, message,
 * filter_hint?}, and:
 *   1. stashes filter_hint into sessionStorage[`cpl_qs_hint_<tab>`] AND
 *      dispatches a `cpl-qs-hint` window event (already-mounted tabs react
 *      immediately; the sessionStorage copy survives the hashchange in case
 *      the destination tab's listener is installed late);
 *   2. sets location.hash so the existing tab-router (CPL_Dashboard.html ~13291)
 *      navigates the user to the right pane.
 *
 * filter_hint vocabulary is enumerated in the system prompt so the model
 * emits the exact enum strings the target tabs accept (avoids mismatch).
 * Each target tab does its own applyHint() — see HINT_VOCAB below for the
 * authoritative key/value list.
 *
 * Sidebar/tabs stay intact; this is a quick-start affordance, not a replacement.
 */
(function () {
  'use strict';

  // ── Config ──
  var MODEL = 'claude-haiku-4-5-20251001'; // routing is 1-of-8 classification, Haiku is plenty
  var MAX_TOKENS = 256;                     // routing JSON is small
  var PROXY_URL = window.CPL_REPORT_PROXY_URL || '';
  var STORAGE_KEY = 'cpl_quickstart_last';  // last user input (for /reuse niceties)

  // Tabs known to the router — keep in sync with VALID_TABS in CPL_Dashboard.html (~line 13091).
  var TABS = [
    {hash: 'dashboard',            label: 'Dashboard',                desc: 'KPI overview, CPL projects grid (named projects + initiatives like Apprenticeship, AI in CPL, etc.), workplan activities. Use filter_hint.search to surface specific projects/initiatives.'},
    {hash: 'workplan-goals',       label: 'Annual Workplan Goals',    desc: 'Five-year CPL goals with annual progress'},
    {hash: 'budget',               label: 'Budget',                   desc: 'CPL budget and expenditure plan'},
    {hash: 'vision-2030',          label: 'Vision 2030',              desc: 'Alignment cards showing CPL contribution to Vision 2030'},
    {hash: 'unified-courses',      label: 'Common Course Reference',  desc: 'Curate common-course identities (CCN-ID / C-ID / M-ID), disciplines, descriptions'},
    {hash: 'canonical-subj4',      label: 'Common Subject Code',      desc: 'Curate the 4-letter subject code per MQ discipline'},
    {hash: 'credential-reference', label: 'Credential Reference',     desc: 'Curate credential identities — unified credential names, issuing agencies'},
    {hash: 'pipeline',             label: 'Pipeline',                 desc: 'Data pipeline reference / methodology'},
    {hash: 'letters',              label: 'Letters',                  desc: 'Budget support letter curator — edits campaign letter blocks (passcode-gated)'},
  ];

  var VALID_HASHES = TABS.map(function (t) { return t.hash; });

  // ── Filter-hint vocabulary ──
  // For each tab that supports a filter pre-pop, lists the valid hint keys
  // and the EXACT enum strings the tab's applyHint() accepts. The system
  // prompt enumerates these to the model so it doesn't hallucinate values
  // (e.g. "unclassified" vs "unclassified_in_map"). Tabs silently ignore
  // unknown keys/values, so adding entries here is safe; removing them is
  // the only thing to be careful about.
  var HINT_VOCAB = {
    'dashboard': {
      // Direct-jump to a specific project card. Use this when the user
      // names a project (e.g. "Apprenticeship Sprint", "MAP Platform
      // Development") — must be an EXACT project name from CPL_DATA.
      // Bypasses the search filter, scrolls to + briefly highlights the
      // matching card. Preferred over `search` when the user is asking
      // for ONE specific project.
      scroll_to: '<exact project name, e.g. "Apprenticeship Sprint">',
      // Free-text search against the projects grid (matches project titles +
      // activity names). Use this when the user describes a THEME rather
      // than a specific project — e.g. "AI work" or "Veterans-related
      // projects" — so the grid filters but doesn't single out one card.
      search: '<free-form search string, e.g. "AI", "Veterans">',
      // Optional category filters. Use these when the user names a workplan
      // structure (e.g. "show me Activity 3" or "Goal 2 projects").
      activity: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4', 'Activity 5'],
      goal:     ['Goal 1', 'Goal 2', 'Goal 3', 'Goal 4', 'Goal 5'],
      status:   ['Complete', 'In Progress', 'Not Started', 'On Hold'],
    },
    'credential-reference': {
      audit_tag: [
        'low_confidence_title', 'very_low_confidence_title',
        'low_confidence_issuer', 'very_low_confidence_issuer',
        'low_confidence_trainer', 'very_low_confidence_trainer',
        'agency_name_collision_signal', 'suspect_course_as_exhibit',
        'blank_unified_title', 'unclassified_in_map', 'stale_kb_entry',
      ],
      confidence_band: ['0.95-1.00', '0.80-0.94', '0.60-0.79', '0.40-0.59', '<0.40'],
      issuer: '<free-form issuer name, exact match in the dataset>',
      quality_flag_only: [true],
      search: '<free-form search string>',
    },
    'unified-courses': {
      kind: ['Course', 'Cluster', 'Stand-Alone'],
      source: ['C-ID', 'CCN-ID', 'M-ID', 'Cluster'],
      status: ['Verified', 'Generated'],
      credit: ['Credit', 'Noncredit', 'Noncredit Enhanced'],
      conf: ['high', 'medium', 'low'],
      artic: ['Has earned articulation', 'No articulation yet'],
      official: ['Has CID match', 'Has CCN match', 'CID conflict'],
      prov: ['by subject-code', 'by title-keyword', 'by description', 'by TOP code'],
      triage: [
        'Any audit flag', '3+ findings',
        'Title mismatch (likely misassigned)', 'TOP mismatch',
        'Description mismatch', "Generic title (can't justify discipline)",
        'Subject collision (Phase 1e re-mint target)',
        'Seed untouched (never reviewed)', 'Cluster issues',
      ],
      flagged_only: [true],
      blanks_only: [true],
      disc: '<free-form MQ discipline name, exact match>',
      search: '<free-form search string>',
    },
    'canonical-subj4': {
      status: ['needs_review', 'pre_seeded', 'reviewed', 'validated', 'invalid'],
      top_2digit: '<2-digit TOP category code, e.g. "12">',
      search: '<free-form search string>',
    },
  };

  function buildHintVocabBlock() {
    var lines = [];
    Object.keys(HINT_VOCAB).forEach(function (tab) {
      lines.push('  ' + tab + ':');
      var vocab = HINT_VOCAB[tab];
      Object.keys(vocab).forEach(function (key) {
        var v = vocab[key];
        var rendered;
        if (Array.isArray(v)) {
          rendered = v.map(function (x) { return JSON.stringify(x); }).join(' | ');
        } else {
          rendered = v;
        }
        lines.push('    ' + key + ': ' + rendered);
      });
    });
    return lines.join('\n');
  }

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
      '  "filter_hint": an object with one or more pre-pop filter values for the destination tab (OPTIONAL; omit if not relevant)',
      '',
      'If the user\'s intent is ambiguous, pick the closest match and make the message briefly explain why.',
      'If the user just asks a general question or wants to explore, route to "dashboard".',
      'If the user asks about credentials, certifications, exhibits, or industry certs → "credential-reference".',
      'If the user asks about courses, course identities, C-ID / M-ID / CCN → "unified-courses".',
      'If the user asks about discipline codes or subject abbreviations → "canonical-subj4".',
      '',
      'filter_hint vocabulary — only these keys are recognized, and only the listed values per key. Use the EXACT strings shown; multiple keys may be combined in one object. Other tabs (workplan-goals / budget / vision-2030 / pipeline / letters) accept no filter_hint — omit it.',
      '',
      buildHintVocabBlock(),
      '',
      'Examples:',
      '  "apprenticeship sprint" → {"tab":"dashboard","filter_hint":{"scroll_to":"Apprenticeship Sprint"},"message":"Jumping to the Apprenticeship Sprint project."}',
      '  "show me Activity 3 projects" → {"tab":"dashboard","filter_hint":{"activity":"Activity 3"},"message":"Opening Dashboard filtered to Activity 3."}',
      '  "AI in CPL" → {"tab":"dashboard","filter_hint":{"search":"AI"},"message":"Opening Dashboard filtered to AI-related projects."}',
      '  "review unclassified credentials" → {"tab":"credential-reference","filter_hint":{"audit_tag":"unclassified_in_map"},"message":"Opening Credential Reference with the unclassified-in-MAP queue."}',
      '  "find Adobe credentials" → {"tab":"credential-reference","filter_hint":{"search":"Adobe"},"message":"Opening Credential Reference filtered to Adobe."}',
      '  "title-keyword Generated rows in CCR" → {"tab":"unified-courses","filter_hint":{"status":"Generated","prov":"by title-keyword"},"message":"Opening the Common Course Reference with title-keyword Generated rows."}',
      '  "subjects needing review" → {"tab":"canonical-subj4","filter_hint":{"status":"needs_review"},"message":"Opening Common Subject Code filtered to needs-review."}',
      '  "show me the budget" → {"tab":"budget","message":"Opening the Budget tab."}',
      '  "draft a support letter" → {"tab":"letters","message":"Opening the Letters tab."}',
      '',
      'Only include filter_hint when the user clearly indicates a specific filter intent. When in doubt, omit it.',
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

  // ── Hint plumbing ──
  // Tabs read their hint at init via window.CPL_QS.consume(tabHash) AND
  // subscribe to the 'cpl-qs-hint' window event so a re-route after they're
  // already mounted still pre-pops filters. consume() is one-shot — clearing
  // sessionStorage means a refresh doesn't keep re-applying a stale hint.
  function stashAndDispatch(tab, hint) {
    if (!hint || typeof hint !== 'object') return;
    try { sessionStorage.setItem('cpl_qs_hint_' + tab, JSON.stringify(hint)); }
    catch (e) { /* private mode — event still fires */ }
    try {
      window.dispatchEvent(new CustomEvent('cpl-qs-hint', { detail: { tab: tab, hint: hint } }));
    } catch (e) { /* CustomEvent unavailable — extremely old browser; skip */ }
  }
  function consumeHint(tab) {
    var k = 'cpl_qs_hint_' + tab;
    try {
      var raw = sessionStorage.getItem(k);
      if (!raw) return null;
      sessionStorage.removeItem(k);
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  window.CPL_QS = {
    consume: consumeHint,
    // Exposed for tab-internal applyHint() functions that want to validate
    // hint keys/values against the same vocabulary the router was told about.
    vocab: HINT_VOCAB,
  };

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
    // filter_hint is optional. If present and not a plain object, drop it
    // (don't fail the route — the tab still opens; just no pre-pop).
    if (parsed.filter_hint && (typeof parsed.filter_hint !== 'object' || Array.isArray(parsed.filter_hint))) {
      parsed.filter_hint = null;
    }
    return parsed; // {tab, message, filter_hint?}
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

  // Build the typeahead directory from CPL_DATA — list of {kind, label, meta, hint}.
  // hint is what we pass to navigateTo(): {tab: <hash>, filter_hint?: {...}}.
  // Projects: kind='project', dashboard tab + scroll_to filter_hint (Part 2).
  // Tabs:    kind='tab', no filter_hint, just direct navigation.
  function buildSuggestionDirectory() {
    var entries = [];
    var projects = (window.CPL_DATA && window.CPL_DATA.projects) || [];
    projects.forEach(function (p) {
      if (!p || !p.name) return;
      entries.push({
        kind: 'project',
        label: p.name,
        meta: p.activity ? String(p.activity).replace(/^Activity\s+/i, 'A') : '',
        hint: {tab: 'dashboard', filter_hint: {scroll_to: p.name}},
        // Searchable text includes id (e.g. "4.1.2") so curators can find by code.
        searchable: ((p.id || '') + ' ' + p.name + ' ' + (p.activity || '')).toLowerCase(),
      });
    });
    // Surface the tabs themselves too — typing "budget" or "letters" should
    // suggest the destination tab as a quick-jump option.
    TABS.forEach(function (t) {
      entries.push({
        kind: 'tab',
        label: t.label,
        meta: 'Tab',
        hint: {tab: t.hash},
        searchable: (t.hash + ' ' + t.label + ' ' + (t.desc || '')).toLowerCase(),
      });
    });
    return entries;
  }

  function matchSuggestions(directory, q, limit) {
    if (!q || q.length < 2) return [];
    var needle = q.toLowerCase();
    // Project/tab name prefix-match beats contains-match, so a typo like
    // "appren" surfaces "Apprenticeship Sprint" above projects that merely
    // mention apprentices in their description.
    var prefix = [], contains = [];
    directory.forEach(function (e) {
      var labelLower = e.label.toLowerCase();
      if (labelLower.indexOf(needle) === 0) prefix.push(e);
      else if (e.searchable.indexOf(needle) !== -1) contains.push(e);
    });
    return prefix.concat(contains).slice(0, limit || 6);
  }

  function buildWidget() {
    var wrap = el('div', {id: 'qs-chat', className: 'qs-chat'});

    var label = el('label', {className: 'qs-label', 'for': 'qs-input'}, '✨ What are you working on today?');
    wrap.appendChild(label);

    var row = el('div', {className: 'qs-row'});
    var inputBox = el('div', {className: 'qs-suggest', style: {flex: '1 1 auto', minWidth: '0', position: 'relative'}});
    var input = el('input', {
      type: 'text',
      id: 'qs-input',
      className: 'qs-input',
      placeholder: 'e.g. apprenticeship sprint, budget, review credentials…',
      autocomplete: 'off',
      maxlength: '500',
    });
    var suggestList = el('div', {id: 'qs-suggest-list', className: 'qs-suggest-list', role: 'listbox'});
    inputBox.appendChild(input);
    inputBox.appendChild(suggestList);
    var btn = el('button', {
      type: 'button',
      className: 'qs-go',
      'aria-label': 'Go',
    }, 'Go →');
    row.appendChild(inputBox);
    row.appendChild(btn);
    wrap.appendChild(row);

    var status = el('div', {className: 'qs-status', id: 'qs-status', 'aria-live': 'polite'});
    wrap.appendChild(status);

    // Suggestion-dropdown state — directory + selected-index for keyboard nav.
    var directory = buildSuggestionDirectory();
    var activeSuggestions = [];
    var activeIdx = -1;

    function closeSuggest() {
      suggestList.classList.remove('qs-open');
      suggestList.innerHTML = '';
      activeSuggestions = [];
      activeIdx = -1;
    }
    function refreshSuggest() {
      var q = (input.value || '').trim();
      activeSuggestions = matchSuggestions(directory, q, 6);
      if (!activeSuggestions.length) { closeSuggest(); return; }
      suggestList.innerHTML = '';
      activeSuggestions.forEach(function (s, i) {
        var item = el('div', {className: 'qs-suggest-item', role: 'option', 'data-idx': String(i)});
        item.appendChild(el('span', {className: 'qs-suggest-name'}, s.label));
        if (s.meta) item.appendChild(el('span', {className: 'qs-suggest-meta'}, s.meta));
        item.addEventListener('mousedown', function (ev) {
          // mousedown not click — click fires after blur, which would close
          // the dropdown before the handler runs.
          ev.preventDefault();
          pick(i);
        });
        suggestList.appendChild(item);
      });
      activeIdx = -1;
      suggestList.classList.add('qs-open');
    }
    function setActive(idx) {
      var items = suggestList.querySelectorAll('.qs-suggest-item');
      items.forEach(function (it, i) { it.classList.toggle('qs-active', i === idx); });
      activeIdx = idx;
      if (idx >= 0 && items[idx]) items[idx].scrollIntoView({block: 'nearest'});
    }
    function pick(i) {
      var s = activeSuggestions[i];
      if (!s) return;
      closeSuggest();
      input.value = s.label;
      try { sessionStorage.setItem(STORAGE_KEY, s.label); } catch (e) { /* ignore */ }
      setStatus('Jumping to ' + s.label + '…', 'ok');
      // Direct-jump — bypass the AI router. The router is for fuzzy intent;
      // suggestions are exact picks.
      setTimeout(function () {
        if (s.hint.filter_hint) stashAndDispatch(s.hint.tab, s.hint.filter_hint);
        navigateTo(s.hint.tab);
        input.focus();
      }, 200);
    }

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
          // Stash + dispatch the filter hint BEFORE navigating, so the
          // destination tab can apply it whether it picks up via the event
          // (already-mounted case) or consumes the sessionStorage value
          // (cold-load case after a refresh on a deep link).
          if (routed.filter_hint) stashAndDispatch(routed.tab, routed.filter_hint);
          navigateTo(routed.tab);
          btn.disabled = false; input.disabled = false;
          input.focus();
        }, 350);
      } catch (e) {
        setStatus(e.message || 'Sorry — could not route that. Try rephrasing.', 'error');
        btn.disabled = false; input.disabled = false;
      }
    }

    input.addEventListener('input', refreshSuggest);
    input.addEventListener('focus', refreshSuggest);
    input.addEventListener('blur', function () {
      // Delay so a mousedown on a suggestion fires before the list closes.
      setTimeout(closeSuggest, 150);
    });

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (ev) {
      // Keyboard navigation through the suggestion dropdown.
      if (suggestList.classList.contains('qs-open') && activeSuggestions.length) {
        if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          setActive((activeIdx + 1) % activeSuggestions.length);
          return;
        }
        if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          setActive(activeIdx <= 0 ? activeSuggestions.length - 1 : activeIdx - 1);
          return;
        }
        if (ev.key === 'Escape') {
          closeSuggest();
          return;
        }
        if (ev.key === 'Enter' && activeIdx >= 0) {
          ev.preventDefault();
          pick(activeIdx);
          return;
        }
      }
      if (ev.key === 'Enter') { ev.preventDefault(); submit(); }
    });

    return wrap;
  }

  // Navigate to a tab. If the user is already on that tab, setting
  // location.hash to the same value is a no-op (no hashchange event fires),
  // so the user gets no visual feedback. Anchor the eye with a scroll-to-top
  // + a brief pulse on the matching nav button instead.
  function navigateTo(tabHash) {
    var current = (location.hash || '').replace(/^#/, '');
    if (current === tabHash) {
      window.scrollTo({top: 0, behavior: 'smooth'});
      var navBtn = document.querySelector('nav.cpl-tabs button[data-tab="' + tabHash + '"]');
      if (navBtn) {
        navBtn.classList.remove('qs-pulse');     // restart animation if already mid-pulse
        void navBtn.offsetWidth;                 // force reflow
        navBtn.classList.add('qs-pulse');
        setTimeout(function () { navBtn.classList.remove('qs-pulse'); }, 1100);
      }
    } else {
      location.hash = tabHash;
      // Also scroll to top so the user lands on the section header, not where
      // they were scrolled on the previous tab.
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
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
