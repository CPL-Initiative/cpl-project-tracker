/*
 * CPL Dashboard — Custom Report Generator
 * Multi-select activities/projects + audience picker → AI-generated .docx
 * Requires: docx library (loaded from CDN), Cloudflare Worker proxy for Claude API
 */

(function () {
    'use strict';

    // ── Configuration ──
    // Set these in the HTML or via window globals before this script loads
    var PROXY_URL = window.CPL_REPORT_PROXY_URL || '';
    var CLAUDE_MODEL = 'claude-sonnet-4-5-20250514';

    // ── Load docx library from CDN ──
    var docxLoaded = false;
    function ensureDocxLib(cb) {
        if (docxLoaded || window.docx) { docxLoaded = true; cb(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.min.js';
        s.onload = function () { docxLoaded = true; cb(); };
        s.onerror = function () { alert('Failed to load docx library.'); };
        document.head.appendChild(s);
    }

    // ── Audiences ──
    var AUDIENCES = [
        { id: 'legislators', label: 'State Legislators & Legislative Staff', prompt: 'Write for California state legislators and legislative staff. Emphasize ROI, fiscal impact, student outcomes, policy alignment with AB 1071 and Vision 2030, and statewide scale. Use formal but accessible language. Lead with measurable impact.' },
        { id: 'ccc_leaders', label: 'CCC System Leaders (Chancellor\'s Office, Presidents)', prompt: 'Write for California Community College system leaders — the Chancellor\'s Office and college presidents. Emphasize strategic alignment with Vision 2030, institutional adoption metrics, implementation progress, and scalability across 116 colleges. Professional and strategic tone.' },
        { id: 'faculty', label: 'Faculty & Academic Senate', prompt: 'Write for faculty and academic senate members. Emphasize academic rigor, credit recommendation quality, faculty workgroup outcomes, discipline-specific progress, and how CPL maintains academic standards while expanding access. Collegial and evidence-based tone.' },
        { id: 'veterans', label: 'Veterans & Military Partners', prompt: 'Write for military service members, veterans, and military education partners. Emphasize JST credit translation, military-specific CPL pathways, Star Colleges network, and how military training translates to college credit. Warm, respectful, action-oriented tone.' },
        { id: 'workforce', label: 'Workforce & Industry Partners', prompt: 'Write for workforce development boards, employers, and industry partners. Emphasize skills-based credentials, apprenticeship pathways, industry-aligned credit recommendations, and how CPL bridges work experience to college credentials. Professional and outcome-focused.' },
        { id: 'general', label: 'General Audience', prompt: 'Write for a general audience of education stakeholders. Use clear, accessible language. Explain acronyms on first use. Balance data with narrative. Highlight student impact and real-world outcomes.' },
    ];

    // ── Build Modal HTML ──
    function buildModal() {
        var data = window.CPL_DATA;
        if (!data || !data.projects) return;

        // Group projects by activity
        var activities = {};
        var activityOrder = [];
        data.projects.forEach(function (p) {
            if (p.id.startsWith('D.')) return; // skip sub-population rows
            var actKey = p.activity || 'Other';
            if (!activities[actKey]) {
                activities[actKey] = [];
                activityOrder.push(actKey);
            }
            activities[actKey].push(p);
        });

        var html = '';
        html += '<div id="reportModal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);overflow-y:auto;padding:2rem;">';
        html += '<div style="max-width:700px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.2);overflow:hidden;font-family:\'Source Sans 3\',Arial,sans-serif;">';

        // Header
        html += '<div style="background:linear-gradient(135deg,#0A2240 0%,#163A5F 100%);padding:1.2rem 1.5rem;display:flex;justify-content:space-between;align-items:center;">';
        html += '<h2 style="margin:0;color:#fff;font-size:1.1rem;">Custom Report Generator</h2>';
        html += '<button id="reportModalClose" style="background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">&times;</button>';
        html += '</div>';

        // Body
        html += '<div style="padding:1.5rem;max-height:70vh;overflow-y:auto;">';

        // Audience picker
        html += '<div style="margin-bottom:1.2rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;display:block;margin-bottom:0.4rem;">Target Audience</label>';
        html += '<select id="reportAudience" style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:4px;font-size:0.85rem;font-family:inherit;">';
        AUDIENCES.forEach(function (a) {
            html += '<option value="' + a.id + '">' + a.label + '</option>';
        });
        html += '</select>';
        html += '</div>';

        // Select All / None
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.9rem;">Select Activities & Projects</label>';
        html += '<div style="display:flex;gap:0.5rem;">';
        html += '<button class="rpt-sel-btn" data-action="all" style="font-size:0.75rem;padding:3px 10px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Select All</button>';
        html += '<button class="rpt-sel-btn" data-action="none" style="font-size:0.75rem;padding:3px 10px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;cursor:pointer;font-family:inherit;">Clear All</button>';
        html += '</div></div>';

        // Activity/Project checkboxes
        activityOrder.forEach(function (actKey) {
            var projects = activities[actKey];
            var actNum = actKey.match(/Activity\s+(\d+)/);
            var actId = actNum ? actNum[1] : '0';

            html += '<div style="margin-bottom:0.8rem;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;">';

            // Activity header with checkbox
            html += '<label style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.8rem;background:#f0f4f8;cursor:pointer;font-weight:600;color:#0A2240;font-size:0.85rem;">';
            html += '<input type="checkbox" class="rpt-activity-cb" data-activity="' + actId + '" checked style="accent-color:#C9A84C;cursor:pointer;">';
            html += actKey;
            html += '</label>';

            // Project checkboxes
            html += '<div style="padding:0.3rem 0.8rem 0.5rem 2rem;">';
            projects.forEach(function (p) {
                html += '<label style="display:flex;align-items:flex-start;gap:0.4rem;padding:0.2rem 0;cursor:pointer;font-size:0.82rem;color:#333;">';
                html += '<input type="checkbox" class="rpt-project-cb" data-pid="' + p.id + '" data-activity="' + actId + '" checked style="margin-top:2px;accent-color:#C9A84C;cursor:pointer;">';
                html += '<span><strong style="color:#163A5F;">' + p.id + '</strong> ' + p.name + '</span>';
                html += '</label>';
            });
            html += '</div></div>';
        });

        // API Key field
        html += '<div style="margin-top:1rem;padding:0.8rem;background:#FAF8F4;border-radius:6px;border:1px solid #e8e8e8;">';
        html += '<label style="font-weight:700;color:#0A2240;font-size:0.85rem;display:block;margin-bottom:0.3rem;">Anthropic API Key</label>';
        html += '<p style="font-size:0.75rem;color:#666;margin:0 0 0.4rem 0;">Your key is stored locally in your browser and never sent anywhere except Anthropic\'s API.</p>';
        html += '<input type="password" id="reportApiKey" placeholder="sk-ant-..." style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:4px;font-size:0.82rem;font-family:monospace;box-sizing:border-box;">';
        html += '</div>';

        html += '</div>'; // end body

        // Footer
        html += '<div style="padding:1rem 1.5rem;border-top:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">';
        html += '<div id="reportStatus" style="font-size:0.8rem;color:#666;"></div>';
        html += '<div style="display:flex;gap:0.5rem;">';
        html += '<button id="reportGenBtn" style="padding:8px 20px;background:#0A2240;color:#fff;border:none;border-radius:4px;font-weight:600;font-size:0.85rem;cursor:pointer;font-family:inherit;">Generate Report</button>';
        html += '</div></div>';

        html += '</div></div>';

        var container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstChild);

        // ── Wire up events ──
        document.getElementById('reportModalClose').addEventListener('click', closeModal);
        document.getElementById('reportModal').addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });

        // Activity checkbox toggles child projects
        document.querySelectorAll('.rpt-activity-cb').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var actId = this.getAttribute('data-activity');
                var checked = this.checked;
                document.querySelectorAll('.rpt-project-cb[data-activity="' + actId + '"]').forEach(function (pcb) {
                    pcb.checked = checked;
                });
            });
        });

        // Select All / Clear All
        document.querySelectorAll('.rpt-sel-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var check = this.getAttribute('data-action') === 'all';
                document.querySelectorAll('.rpt-activity-cb, .rpt-project-cb').forEach(function (cb) {
                    cb.checked = check;
                });
            });
        });

        // Generate button
        document.getElementById('reportGenBtn').addEventListener('click', generateReport);

        // Restore saved API key
        try {
            var savedKey = localStorage.getItem('cpl_api_key');
            if (savedKey) document.getElementById('reportApiKey').value = savedKey;
        } catch (e) { }
    }

    function openModal() {
        var m = document.getElementById('reportModal');
        if (!m) { buildModal(); m = document.getElementById('reportModal'); }
        if (m) m.style.display = 'block';
    }

    function closeModal() {
        var m = document.getElementById('reportModal');
        if (m) m.style.display = 'none';
    }

    function setStatus(msg, color) {
        var el = document.getElementById('reportStatus');
        if (el) { el.textContent = msg; el.style.color = color || '#666'; }
    }

    // ── Gather selected data ──
    function getSelectedData() {
        var data = window.CPL_DATA;
        if (!data) return null;

        var selectedPids = [];
        document.querySelectorAll('.rpt-project-cb:checked').forEach(function (cb) {
            selectedPids.push(cb.getAttribute('data-pid'));
        });

        var pidSet = {};
        selectedPids.forEach(function (pid) { pidSet[pid] = true; });

        var projects = data.projects.filter(function (p) { return pidSet[p.id]; });
        var audienceId = document.getElementById('reportAudience').value;
        var audience = AUDIENCES.find(function (a) { return a.id === audienceId; }) || AUDIENCES[AUDIENCES.length - 1];

        return {
            projects: projects,
            audience: audience,
            kpis: data.kpis || {},
            lastUpdated: data.last_updated || 'N/A',
        };
    }

    // ── Build Claude prompt ──
    function buildPrompt(sel) {
        var projectSummaries = sel.projects.map(function (p) {
            return '- **' + p.id + ' ' + p.name + '** (' + p.activity + ')\n'
                + '  Status: ' + p.status + ' | ' + p.pct + '% complete\n'
                + '  Description: ' + p.desc + '\n'
                + '  KPI: ' + (p.kpi_metric || 'N/A') + ' ' + (p.kpi_unit || '') + '\n'
                + '  Goal 25-26: ' + (p.kpi_goal_2526 || 'N/A') + ' | Stretch: ' + (p.kpi_stretch_2526 || 'N/A') + '\n'
                + '  Latest Update: ' + (p.update || 'N/A') + '\n'
                + '  Milestones: ' + (p.milestones || 'N/A') + '\n'
                + '  Workplan Notes: ' + (p.workplan_notes || 'N/A') + '\n'
                + '  Lead: ' + (p.lead || 'N/A') + ' | Team: ' + (p.team || 'N/A') + '\n'
                + '  Budget: ' + (p.budget || 'N/A') + ' (' + (p.budget_source || '') + ')\n'
                + '  Vision 2030: ' + (p.v2030 || 'N/A') + ' | CPL Goal: ' + (p.goal || 'N/A');
        }).join('\n\n');

        var kpiSummary = '';
        for (var key in sel.kpis) {
            var k = sel.kpis[key];
            kpiSummary += '- ' + (k.label || key) + ': ' + (k.value || 'N/A');
            if (k.sub) kpiSummary += ' (' + k.sub + ')';
            if (k.breakdowns && k.breakdowns.length) {
                kpiSummary += '\n  Breakdowns: ' + k.breakdowns.map(function (b) { return b.label + ': ' + b.value; }).join(', ');
            }
            kpiSummary += '\n';
        }

        return 'You are writing a professional report about the California Community Colleges Credit for Prior Learning (CPL) Initiative.\n\n'
            + '## Audience\n' + sel.audience.prompt + '\n\n'
            + '## Headline KPIs (as of ' + sel.lastUpdated + ')\n' + kpiSummary + '\n\n'
            + '## Selected Projects\n' + projectSummaries + '\n\n'
            + '## Instructions\n'
            + 'Write a polished, professional report covering the selected projects. Structure it as:\n'
            + '1. **Executive Summary** (2-3 paragraphs) — tailored to the audience, highlighting the most impactful findings\n'
            + '2. **Key Metrics & Progress** — present headline KPIs in context for the audience\n'
            + '3. **Project Highlights** — for each selected project, write a concise but substantive narrative paragraph (not bullet points). Group by Activity.\n'
            + '4. **Looking Ahead** — upcoming milestones, goals, and strategic priorities\n'
            + '5. **Recommendations** — 3-5 actionable recommendations tailored to the audience\n\n'
            + 'Use the data provided. Do not invent metrics. Write in prose, not bullet lists. '
            + 'Format section headers with ## markdown. Keep paragraphs concise but substantive.\n'
            + 'The report should be 1,500-2,500 words.';
    }

    // ── Call Claude API ──
    async function callClaude(apiKey, prompt) {
        var url = PROXY_URL || 'https://api.anthropic.com/v1/messages';
        var headers = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        };
        // If using proxy, pass the key in a custom header
        if (PROXY_URL) {
            headers['x-anthropic-api-key'] = apiKey;
        }

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
        if (json.content && json.content[0] && json.content[0].text) {
            return json.content[0].text;
        }
        throw new Error('Unexpected API response format');
    }

    // ── Generate .docx from markdown-ish text ──
    function buildDocx(narrative, audience, lastUpdated) {
        var D = window.docx;
        if (!D) { alert('docx library not loaded'); return; }

        var children = [];

        // Title
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'CPL Initiative — Custom Report',
                bold: true, size: 36, color: '0A2240', font: 'Calibri',
            })],
            spacing: { after: 100 },
        }));

        // Subtitle
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Prepared for: ' + audience.label + '  |  Data as of: ' + lastUpdated,
                size: 20, color: '666666', font: 'Calibri', italics: true,
            })],
            spacing: { after: 300 },
        }));

        // Horizontal line
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 6, color: 'C9A84C' } },
            spacing: { after: 200 },
        }));

        // Parse narrative into paragraphs
        var lines = narrative.split('\n');
        lines.forEach(function (line) {
            var trimmed = line.trim();
            if (!trimmed) {
                children.push(new D.Paragraph({ children: [], spacing: { after: 100 } }));
                return;
            }

            // H2 headers
            if (trimmed.startsWith('## ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({
                        text: trimmed.replace(/^##\s*/, ''),
                        bold: true, size: 26, color: '0A2240', font: 'Calibri',
                    })],
                    spacing: { before: 300, after: 100 },
                }));
                return;
            }

            // H3 headers
            if (trimmed.startsWith('### ')) {
                children.push(new D.Paragraph({
                    children: [new D.TextRun({
                        text: trimmed.replace(/^###\s*/, ''),
                        bold: true, size: 22, color: '163A5F', font: 'Calibri',
                    })],
                    spacing: { before: 200, after: 80 },
                }));
                return;
            }

            // Bold text handling (**text**)
            var parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
            var runs = [];
            parts.forEach(function (part) {
                if (part.startsWith('**') && part.endsWith('**')) {
                    runs.push(new D.TextRun({
                        text: part.slice(2, -2),
                        bold: true, size: 21, font: 'Calibri', color: '0A2240',
                    }));
                } else if (part) {
                    runs.push(new D.TextRun({
                        text: part, size: 21, font: 'Calibri', color: '333333',
                    }));
                }
            });

            if (runs.length) {
                children.push(new D.Paragraph({
                    children: runs,
                    spacing: { after: 120 },
                }));
            }
        });

        // Footer
        children.push(new D.Paragraph({
            children: [],
            border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: 'C9A84C' } },
            spacing: { before: 400, after: 100 },
        }));
        children.push(new D.Paragraph({
            children: [new D.TextRun({
                text: 'Generated by CPL Initiative Dashboard  |  ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                size: 16, color: '999999', font: 'Calibri', italics: true,
            })],
        }));

        var doc = new D.Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                    },
                },
                children: children,
            }],
        });

        return doc;
    }

    // ── Main generate flow ──
    async function generateReport() {
        var sel = getSelectedData();
        if (!sel || !sel.projects.length) {
            setStatus('Please select at least one project.', '#c00');
            return;
        }

        var apiKey = document.getElementById('reportApiKey').value.trim();
        if (!apiKey) {
            setStatus('Please enter your Anthropic API key.', '#c00');
            return;
        }

        // Save key for convenience
        try { localStorage.setItem('cpl_api_key', apiKey); } catch (e) { }

        var btn = document.getElementById('reportGenBtn');
        btn.disabled = true;
        btn.textContent = 'Generating...';
        setStatus('Building prompt for ' + sel.projects.length + ' projects...', '#4A90D9');

        try {
            var prompt = buildPrompt(sel);
            setStatus('Calling Claude API — this may take 15-30 seconds...', '#4A90D9');

            var narrative = await callClaude(apiKey, prompt);

            setStatus('Building Word document...', '#4A90D9');

            ensureDocxLib(async function () {
                try {
                    var doc = buildDocx(narrative, sel.audience, sel.lastUpdated);
                    var blob = await window.docx.Packer.toBlob(doc);

                    // Download
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    var dateStr = new Date().toISOString().slice(0, 10);
                    a.download = 'CPL_Report_' + sel.audience.id + '_' + dateStr + '.docx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    setStatus('Report downloaded!', '#2A7D4F');
                } catch (docErr) {
                    setStatus('Error building document: ' + docErr.message, '#c00');
                }
                btn.disabled = false;
                btn.textContent = 'Generate Report';
            });
        } catch (err) {
            setStatus('Error: ' + err.message, '#c00');
            btn.disabled = false;
            btn.textContent = 'Generate Report';
        }
    }

    // ── Add "Custom Report" button to filter bar ──
    function addReportButton() {
        var filterBtns = document.getElementById('filterButtons');
        if (!filterBtns) return;
        // Check if already added
        if (document.getElementById('customReportBtn')) return;

        var btn = document.createElement('button');
        btn.id = 'customReportBtn';
        btn.innerHTML = '&#128202; Custom Report';
        btn.type = 'button';
        btn.style.cssText = "display:inline-flex;align-items:center;gap:0.3rem;background:#0A2240;color:#fff;border:none;padding:7px 16px;font-weight:600;cursor:pointer;border-radius:4px;font-size:0.85rem;font-family:'Source Sans 3',Arial,sans-serif;line-height:1.2;margin-left:0.5rem;transition:background 0.2s;";
        btn.onmouseover = function () { this.style.background = '#163A5F'; };
        btn.onmouseout = function () { this.style.background = '#0A2240'; };
        btn.addEventListener('click', openModal);
        filterBtns.appendChild(btn);
    }

    // ── Initialize ──
    function init() {
        addReportButton();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // Also try after a short delay (in case filter buttons are added dynamically)
    setTimeout(init, 600);
})();
