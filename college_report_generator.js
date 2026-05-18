/*
 * CPL Dashboard — College Custom Report Generator
 *
 * Sibling to report_generator.js, but scoped to the College Activity panel:
 * - User picks any subset of colleges from a tier-grouped checkbox list.
 * - Audience picker reuses the same six audiences as the project report.
 * - Per-college outcomes are compared against tier averages and statewide totals,
 *   both computed client-side from window.COLLEGE_ACTIVITY_DATA.
 * - The CPL Knowledge Base excerpt (window.CPL_KB, injected at pipeline build
 *   time from CPL-Initiative/cpl-knowledge-base) is included in the prompt so
 *   Claude's commentary is grounded in authoritative CPL framing.
 *
 * Requires:
 *   window.CPL_REPORT_PROXY_URL   — Cloudflare Worker proxy for Claude API
 *   window.COLLEGE_ACTIVITY_DATA  — per-college outcomes
 *   window.COLLEGE_DISCIPLINE_DETAIL — per-college discipline breakdown
 *   window.CPL_KB                 — KB excerpt (optional; omitted if missing)
 *   window.docx                   — docx library (lazy-loaded from docx.min.js)
 */

(function () {
    'use strict';

    var PROXY_URL = window.CPL_REPORT_PROXY_URL || '';
    var CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

    // ── Audience prompts (mirrors report_generator.js) ──
    var AUDIENCES = [
        { id: 'legislators',  label: 'State Legislators & Legislative Staff', prompt: 'Write for California state legislators and legislative staff. Emphasize ROI, fiscal impact, student outcomes, policy alignment with AB 1071 and Vision 2030, and statewide scale. Use formal but accessible language. Lead with measurable impact.' },
        { id: 'ccc_leaders',  label: "CCC System Leaders (Chancellor's Office, Presidents)", prompt: "Write for California Community College system leaders — the Chancellor's Office and college presidents. Emphasize strategic alignment with Vision 2030, institutional adoption metrics, implementation progress, and scalability across 116 colleges. Professional and strategic tone." },
        { id: 'faculty',      label: 'Faculty & Academic Senate', prompt: 'Write for faculty and academic senate members. Emphasize academic rigor, credit recommendation quality, faculty workgroup outcomes, discipline-specific progress, and how CPL maintains academic standards while expanding access. Collegial and evidence-based tone.' },
        { id: 'veterans',     label: 'Veterans & Military Partners', prompt: 'Write for military service members, veterans, and military education partners. Emphasize JST credit translation, military-specific CPL pathways, Star Colleges network, and how military training translates to college credit. Warm, respectful, action-oriented tone.' },
        { id: 'workforce',    label: 'Workforce & Industry Partners', prompt: 'Write for workforce development boards, employers, and industry partners. Emphasize skills-based credentials, apprenticeship pathways, industry-aligned credit recommendations, and how CPL bridges work experience to college credentials. Professional and outcome-focused.' },
        { id: 'general',      label: 'General Audience', prompt: 'Write for a general audience of education stakeholders. Use clear, accessible language. Explain acronyms on first use. Balance data with narrative. Highlight student impact and real-world outcomes.' },
    ];

    // ── Lazy-load docx library (shared file from CDN/local) ──
    var docxLoaded = false;
    function ensureDocxLib(cb) {
        if (docxLoaded || window.docx) { docxLoaded = true; cb(); return; }
        var s = document.createElement('script');
        s.src = 'docx.min.js';
        s.onload = function () { docxLoaded = true; cb(); };
        s.onerror = function () { alert('Failed to load docx library.'); };
        document.head.appendChild(s);
    }

    // ── Helpers ──
    function fmtNum(n) { return (n == null || isNaN(n)) ? '—' : Math.round(n).toLocaleString(); }
    function fmtPct(n) { return (n == null || isNaN(n)) ? '—' : (Math.round(n * 10) / 10) + '%'; }
    function fmtDollar(n) {
        if (n == null || isNaN(n)) return '—';
        if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
        if (n >= 1e6) return '$' + Math.round(n / 1e6) + 'M';
        if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
        return '$' + Math.round(n).toLocaleString();
    }

    function getRows() {
        // Prefer the full college list (so benchmarks are statewide); fall back to filtered.
        return (window._caAllData && window._caAllData.length) ? window._caAllData
             : (window.COLLEGE_ACTIVITY_DATA || []);
    }

    // ── Compute tier averages + statewide totals from the full college list ──
    var BENCHMARK_FIELDS = ['students','veterans','working_adults','apprentices',
        'eligible_units','transcribed_units','exhibits','credit_recs','disciplines',
        'savings','year_impact','trans_rate','criteria_met'];

    function computeBenchmarks() {
        var rows = getRows();
        var tiers = {};
        var statewide = { count: rows.length };
        BENCHMARK_FIELDS.forEach(function (f) { statewide[f] = 0; });
        rows.forEach(function (r) {
            var t = r.tier || 'Inactive';
            if (!tiers[t]) {
                tiers[t] = { count: 0 };
                BENCHMARK_FIELDS.forEach(function (f) { tiers[t][f] = 0; });
            }
            tiers[t].count++;
            BENCHMARK_FIELDS.forEach(function (f) {
                var v = +r[f] || 0;
                tiers[t][f] += v;
                statewide[f] += v;
            });
        });
        // Convert sums to averages (keep trans_rate as average, others as average per college).
        Object.keys(tiers).forEach(function (t) {
            var bucket = tiers[t];
            BENCHMARK_FIELDS.forEach(function (f) {
                bucket[f + '_avg'] = bucket.count ? bucket[f] / bucket.count : 0;
            });
        });
        BENCHMARK_FIELDS.forEach(function (f) {
            statewide[f + '_avg'] = statewide.count ? statewide[f] / statewide.count : 0;
        });
        return { tiers: tiers, statewide: statewide };
    }

    // ── Build the modal ──
    function buildModal() {
        var rows = getRows();
        if (!rows.length) return;

        // Group by tier (Leading, Advancing, Inactive)
        var tierOrder = ['Leading', 'Advancing', 'Inactive'];
        var grouped = {};
        tierOrder.forEach(function (t) { grouped[t] = []; });
        rows.forEach(function (r) {
            var t = grouped[r.tier] ? r.tier : 'Inactive';
            grouped[t].push(r);
        });
        // Sort within tier by students desc
        Object.keys(grouped).forEach(function (t) {
            grouped[t].sort(function (a, b) { return (b.students || 0) - (a.students || 0); });
        });

        var html = '';
        html += '<div id="collegeReportModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);overflow-y:auto;padding:2rem;">';
        html += '<div style="max-width:760px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);overflow:hidden;font-family:\'Source Sans 3\',Arial,sans-serif;">';

        // Header
        html += '<div style="background:linear-gradient(135deg,#0A2240 0%,#163A5F 100%);padding:1.2rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">';
        html += '<h2 style="margin:0;color:#fff;font-size:1.1rem;">College Custom Report Generator</h2>';
        html += '<button id="collegeReportModalClose" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">&times;</button>';
        html += '</div>';

        html += '<div style="padding:1.5rem;max-height:70vh;overflow-y:auto;">';

        // Audience picker
        html += '<div style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;display:block;margin-bottom:0.4rem;">Target Audience</label>';
        html += '<select id="collegeReportAudience" style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:0.85rem;font-family:inherit;">';
        AUDIENCES.forEach(function (a) {
            html += '<option value="' + a.id + '">' + a.label + '</option>';
        });
        html += '</select></div>';

        // Selection controls
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.4rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;">Select Colleges</label>';
        html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">';
        html += '<button class="crpt-sel-btn" data-action="all"      style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">All</button>';
        html += '<button class="crpt-sel-btn" data-action="filtered" style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Currently Filtered</button>';
        html += '<button class="crpt-sel-btn" data-action="leading"  style="font-size:0.72rem;padding:3px 8px;border:1px solid #C9A84C;border-radius:3px;background:#fff8e6;cursor:pointer;font-family:inherit;color:#8a6a14;">Leading</button>';
        html += '<button class="crpt-sel-btn" data-action="stars"    style="font-size:0.72rem;padding:3px 8px;border:1px solid #C9A84C;border-radius:3px;background:#fff8e6;cursor:pointer;font-family:inherit;color:#8a6a14;">Star Colleges</button>';
        html += '<button class="crpt-sel-btn" data-action="none"     style="font-size:0.72rem;padding:3px 8px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Clear</button>';
        html += '</div></div>';

        // College checkbox list, grouped by tier
        tierOrder.forEach(function (tier) {
            var list = grouped[tier];
            if (!list.length) return;
            html += '<div style="margin-bottom:0.8rem;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">';
            html += '<div style="padding:0.4rem 0.8rem;background:#f0f4f8;font-weight:700;color:#0A2240;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;">';
            html += '<span>' + tier + ' <span style="color:#666;font-weight:400;">(' + list.length + ')</span></span>';
            html += '<button type="button" class="crpt-tier-toggle" data-tier="' + tier + '" style="font-size:0.7rem;padding:2px 8px;border:1px solid #aaa;border-radius:3px;background:#fff;cursor:pointer;font-family:inherit;">Toggle</button>';
            html += '</div>';
            html += '<div style="max-height:160px;overflow-y:auto;padding:0.4rem 0.8rem;">';
            list.forEach(function (r) {
                var key = encodeURIComponent(r.college);
                html += '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.15rem 0;font-size:0.8rem;cursor:pointer;color:#333;">';
                html += '<input type="checkbox" class="crpt-college-cb" data-tier="' + tier + '" data-college="' + key + '" style="accent-color:#C9A84C;cursor:pointer;">';
                html += '<span style="flex:1;">' + r.college + '</span>';
                html += '<span style="color:#888;font-size:0.72rem;">' + fmtNum(r.students) + ' students</span>';
                html += '</label>';
            });
            html += '</div></div>';
        });

        // KB indicator
        var kbBytes = (window.CPL_KB || '').length;
        html += '<div style="margin:0.6rem 0;font-size:0.72rem;color:#666;">';
        html += (kbBytes
            ? '&#128218; CPL Knowledge Base attached (' + kbBytes.toLocaleString() + ' chars)'
            : '&#9888;&#65039; CPL Knowledge Base not loaded — commentary will be generic.');
        html += '</div>';

        // Status + Generate button
        html += '<div id="collegeReportStatus" style="font-size:0.82rem;color:#666;margin:0.8rem 0;min-height:1.2em;"></div>';
        html += '<button id="collegeReportGenBtn" style="width:100%;padding:10px;background:linear-gradient(135deg,#C9A84C,#FF9800);color:#000;border:none;border-radius:6px;font-weight:700;font-size:0.95rem;cursor:pointer;font-family:inherit;">Generate Report</button>';

        html += '</div></div></div>';

        var div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div.firstChild);

        wireModal();
    }

    function wireModal() {
        document.getElementById('collegeReportModalClose').onclick = closeModal;
        document.getElementById('collegeReportModal').addEventListener('click', function (e) {
            if (e.target.id === 'collegeReportModal') closeModal();
        });
        document.querySelectorAll('.crpt-sel-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { handleSelectAction(btn.getAttribute('data-action')); });
        });
        document.querySelectorAll('.crpt-tier-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () { toggleTier(btn.getAttribute('data-tier')); });
        });
        document.getElementById('collegeReportGenBtn').addEventListener('click', generateReport);
    }

    function handleSelectAction(action) {
        var cbs = document.querySelectorAll('.crpt-college-cb');
        if (action === 'all') {
            cbs.forEach(function (cb) { cb.checked = true; });
        } else if (action === 'none') {
            cbs.forEach(function (cb) { cb.checked = false; });
        } else if (action === 'leading') {
            cbs.forEach(function (cb) { cb.checked = (cb.getAttribute('data-tier') === 'Leading'); });
        } else if (action === 'stars') {
            var rows = getRows();
            var starSet = {};
            rows.forEach(function (r) { if ((r.criteria_met || 0) >= 1) starSet[r.college] = true; });
            cbs.forEach(function (cb) {
                cb.checked = !!starSet[decodeURIComponent(cb.getAttribute('data-college'))];
            });
        } else if (action === 'filtered') {
            var filtered = window._caFilteredData || [];
            var set = {};
            filtered.forEach(function (r) { set[r.college] = true; });
            cbs.forEach(function (cb) {
                cb.checked = !!set[decodeURIComponent(cb.getAttribute('data-college'))];
            });
        }
    }

    function toggleTier(tier) {
        var cbs = document.querySelectorAll('.crpt-college-cb[data-tier="' + tier + '"]');
        var anyUnchecked = false;
        cbs.forEach(function (cb) { if (!cb.checked) anyUnchecked = true; });
        cbs.forEach(function (cb) { cb.checked = anyUnchecked; });
    }

    function openModal() {
        var m = document.getElementById('collegeReportModal');
        if (!m) { buildModal(); m = document.getElementById('collegeReportModal'); }
        if (m) m.style.display = 'block';
    }

    function closeModal() {
        var m = document.getElementById('collegeReportModal');
        if (m) m.style.display = 'none';
    }

    function setStatus(msg, color) {
        var el = document.getElementById('collegeReportStatus');
        if (el) { el.textContent = msg; el.style.color = color || '#666'; }
    }

    // ── Selection + prompt building ──
    function getSelected() {
        var rows = getRows();
        var byName = {};
        rows.forEach(function (r) { byName[r.college] = r; });
        var picked = [];
        document.querySelectorAll('.crpt-college-cb:checked').forEach(function (cb) {
            var name = decodeURIComponent(cb.getAttribute('data-college'));
            if (byName[name]) picked.push(byName[name]);
        });
        var aud = document.getElementById('collegeReportAudience').value;
        var audience = AUDIENCES.find(function (a) { return a.id === aud; }) || AUDIENCES[AUDIENCES.length - 1];
        return { colleges: picked, audience: audience };
    }

    function disciplinesFor(college) {
        var detail = (window.COLLEGE_DISCIPLINE_DETAIL || {})[college];
        if (!detail) return '';
        var parts = [];
        Object.keys(detail).forEach(function (d) {
            var v = detail[d];
            if (v && (v.credit_recs || v.exhibits)) {
                parts.push(d + ' (' + (v.credit_recs || 0) + ' recs, ' + (v.exhibits || 0) + ' exhibits)');
            }
        });
        return parts.join('; ');
    }

    function buildPrompt(sel, bench) {
        var kb = window.CPL_KB || '';
        var statewide = bench.statewide;
        var tiers = bench.tiers;

        var benchHeader = ''
            + '## Statewide Benchmarks (all ' + statewide.count + ' colleges)\n'
            + '- Students served: ' + fmtNum(statewide.students) + ' (avg ' + fmtNum(statewide.students_avg) + '/college)\n'
            + '- Veterans: ' + fmtNum(statewide.veterans) + ' (avg ' + fmtNum(statewide.veterans_avg) + '/college)\n'
            + '- Eligible units: ' + fmtNum(statewide.eligible_units) + ' (avg ' + fmtNum(statewide.eligible_units_avg) + '/college)\n'
            + '- Transcribed units: ' + fmtNum(statewide.transcribed_units) + ' (avg ' + fmtNum(statewide.transcribed_units_avg) + '/college)\n'
            + '- Credit recs: ' + fmtNum(statewide.credit_recs) + ' (avg ' + fmtNum(statewide.credit_recs_avg) + '/college)\n'
            + '- Savings: ' + fmtDollar(statewide.savings) + ' (avg ' + fmtDollar(statewide.savings_avg) + '/college)\n\n';

        ['Leading', 'Advancing', 'Inactive'].forEach(function (t) {
            var b = tiers[t]; if (!b) return;
            benchHeader += '### ' + t + ' tier (' + b.count + ' colleges, per-college averages)\n'
                + '- Students: ' + fmtNum(b.students_avg) + ' | Veterans: ' + fmtNum(b.veterans_avg)
                + ' | Eligible units: ' + fmtNum(b.eligible_units_avg) + ' | Transcribed: ' + fmtNum(b.transcribed_units_avg)
                + ' | Credit recs: ' + fmtNum(b.credit_recs_avg) + ' | Trans rate: ' + fmtPct(b.trans_rate_avg)
                + ' | Savings: ' + fmtDollar(b.savings_avg) + '\n';
        });

        var collegeBlocks = sel.colleges.map(function (c) {
            var tierBucket = tiers[c.tier] || { students_avg: 0, transcribed_units_avg: 0, credit_recs_avg: 0, savings_avg: 0 };
            var vsTierStudents = tierBucket.students_avg ? (c.students / tierBucket.students_avg) : null;
            var vsTierTrans    = tierBucket.transcribed_units_avg ? (c.transcribed_units / tierBucket.transcribed_units_avg) : null;
            var disc = disciplinesFor(c.college);
            return '### ' + c.college + ' (' + (c.district || '') + ')\n'
                + '- Tier: ' + c.tier + (c.criteria_met ? ' ⭐ (' + c.criteria_met + ' of 5 Star criteria met)' : '') + '\n'
                + '- Students served: ' + fmtNum(c.students)
                    + (vsTierStudents != null ? ' (' + vsTierStudents.toFixed(2) + 'x ' + c.tier + '-tier avg)' : '') + '\n'
                + '- Population mix: ' + fmtNum(c.veterans) + ' veterans, ' + fmtNum(c.working_adults) + ' working adults, ' + fmtNum(c.apprentices) + ' apprentices\n'
                + '- Eligible units: ' + fmtNum(c.eligible_units) + ' | Transcribed: ' + fmtNum(c.transcribed_units)
                    + ' (trans rate ' + fmtPct(c.trans_rate) + ')'
                    + (vsTierTrans != null ? ', ' + vsTierTrans.toFixed(2) + 'x ' + c.tier + '-tier avg transcribed' : '') + '\n'
                + '- MAP Exhibits: ' + fmtNum(c.exhibits) + ' | Credit recs: ' + fmtNum(c.credit_recs) + ' | Disciplines covered: ' + fmtNum(c.disciplines) + '\n'
                + '- Estimated savings: ' + fmtDollar(c.savings) + ' | 20-yr impact: ' + fmtDollar(c.year_impact) + '\n'
                + '- Last activity: ' + (c.last_activity_days != null ? c.last_activity_days + ' days ago' : 'unknown') + '\n'
                + (disc ? '- Discipline detail: ' + disc + '\n' : '');
        }).join('\n');

        var prompt = '';
        if (kb) {
            prompt += '# CPL Knowledge Base (authoritative context)\n\n' + kb + '\n\n---\n\n';
        }
        prompt += '# College-Level CPL Report Brief\n\n'
            + '## Audience\n' + sel.audience.prompt + '\n\n'
            + benchHeader + '\n'
            + '## Selected Colleges (' + sel.colleges.length + ')\n' + collegeBlocks + '\n\n'
            + '## Instructions\n'
            + 'Write a polished, audience-appropriate report on CPL progress at the selected colleges. Structure it as:\n'
            + '1. **Executive Summary** (2-3 paragraphs) — what this group of colleges represents within the statewide CPL effort, framed for the audience.\n'
            + '2. **Outcomes at a Glance** — surface the most striking outcomes across the selected colleges, citing real numbers from the data above. Compare to statewide and tier-level benchmarks.\n'
            + '3. **College Highlights** — for each selected college (or each grouping if many), write a substantive narrative paragraph: where they stand in the tier system, transcription performance, population mix, and any notable disciplines. Do not pad. If a college is underperforming on a metric, say so plainly and tie it back to CPL framing from the KB.\n'
            + '4. **Cross-cutting Themes** — patterns visible across selected colleges (e.g., veteran concentration, transcription gaps, discipline strengths).\n'
            + '5. **Recommended Next Steps** — 3-5 concrete, audience-appropriate actions, grounded in the KB methodology where relevant.\n\n'
            + 'Use only the numbers provided. Do not invent metrics. Write prose, not bullet lists, except where the structure above explicitly calls for them. Format section headers with `##` markdown. Use `###` for college subheadings. Keep paragraphs concise but substantive. Target 1,500-2,500 words.';
        return prompt;
    }

    // ── Claude call (mirrors report_generator.js) ──
    async function callClaude(prompt) {
        var url = PROXY_URL || 'https://api.anthropic.com/v1/messages';
        var headers = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
        var body = JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        });
        var resp = await fetch(url, { method: 'POST', headers: headers, body: body });
        if (!resp.ok) {
            var errText = await resp.text();
            throw new Error('API error (' + resp.status + '): ' + errText.substring(0, 200));
        }
        var json = await resp.json();
        if (json.content && json.content[0] && json.content[0].text) return json.content[0].text;
        throw new Error('Unexpected API response format');
    }

    // ── .docx builder (matches the project report styling) ──
    function buildDocx(narrative, audience, collegeCount) {
        var D = window.docx;
        if (!D) { alert('docx library not loaded'); return null; }
        var children = [];
        var today = new Date().toISOString().slice(0, 10);

        children.push(new D.Paragraph({
            children: [new D.TextRun({ text: 'CPL Initiative — College Custom Report', bold: true, size: 36, color: '0A2240', font: 'Calibri' })],
            spacing: { after: 100 },
        }));
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Prepared for: ' + audience.label + '  |  Colleges covered: ' + collegeCount + '  |  Generated: ' + today,
                size: 20, color: '666666', font: 'Calibri', italics: true,
            })],
            spacing: { after: 300 },
        }));
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'C9A84C' } },
            spacing: { after: 200 },
        }));

        narrative.split('\n').forEach(function (line) {
            var t = line.trim();
            if (!t) { children.push(new D.Paragraph({ children: [], spacing: { after: 100 } })); return; }
            if (t.startsWith('## ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({ text: t.replace(/^##\s*/, ''), bold: true, size: 26, color: '0A2240', font: 'Calibri' })],
                    spacing: { before: 300, after: 100 },
                })); return;
            }
            if (t.startsWith('### ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({ text: t.replace(/^###\s*/, ''), bold: true, size: 22, color: '163A5F', font: 'Calibri' })],
                    spacing: { before: 200, after: 80 },
                })); return;
            }
            var parts = t.split(/(\*\*[^*]+\*\*)/g);
            var runs = parts.map(function (part) {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new D.TextRun({ text: part.slice(2, -2), bold: true, size: 22, font: 'Calibri' });
                }
                return new D.TextRun({ text: part, size: 22, font: 'Calibri' });
            });
            children.push(new D.Paragraph({ children: runs, spacing: { after: 120 } }));
        });

        return new D.Document({
            sections: [{ properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } }, children: children }],
        });
    }

    // ── Main flow ──
    async function generateReport() {
        var sel = getSelected();
        if (!sel.colleges.length) { setStatus('Please select at least one college.', '#c00'); return; }
        if (!PROXY_URL) { setStatus('Report proxy not configured. Contact your administrator.', '#c00'); return; }

        var btn = document.getElementById('collegeReportGenBtn');
        btn.disabled = true; btn.textContent = 'Generating...';
        setStatus('Computing benchmarks across ' + getRows().length + ' colleges...', '#4A90D9');

        try {
            var bench = computeBenchmarks();
            var prompt = buildPrompt(sel, bench);
            setStatus('Calling Claude — this may take 15-30 seconds for ' + sel.colleges.length + ' colleges...', '#4A90D9');
            var narrative = await callClaude(prompt);
            setStatus('Building Word document...', '#4A90D9');
            ensureDocxLib(async function () {
                try {
                    var doc = buildDocx(narrative, sel.audience, sel.colleges.length);
                    var blob = await window.docx.Packer.toBlob(doc);
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    var dateStr = new Date().toISOString().slice(0, 10);
                    a.download = 'CPL_College_Report_' + sel.audience.id + '_' + dateStr + '.docx';
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    setStatus('Report downloaded.', '#2A7D4F');
                } catch (e) {
                    setStatus('Error building document: ' + e.message, '#c00');
                }
                btn.disabled = false; btn.textContent = 'Generate Report';
            });
        } catch (err) {
            setStatus('Error: ' + err.message, '#c00');
            btn.disabled = false; btn.textContent = 'Generate Report';
        }
    }

    // Expose for college_activity.js
    window.openCollegeReportModal = openModal;
})();
