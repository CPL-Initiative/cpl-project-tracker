#!/usr/bin/env python3
"""Write the OpenClassrooms Digital Marketer crosswalk as one self-contained HTML
page (First Light) from kb/openclassrooms_out/crosswalk.json.

Run:  python3 kb/_write_openclassrooms_html.py
"""
import collections
import datetime as dt
import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _write_openclassrooms_workbook import clean  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "openclassrooms_out", "crosswalk.json")
OUT = os.path.join(HERE, "openclassrooms_out", "openclassrooms_digital_marketer_crosswalk.html")

PROJECTS = [
    ("1", "Dive into your Digital Marketer apprenticeship", "20 h", "APPR B73A", "Digital Marketer Apprenticeship 1", "1"),
    ("2", "Paid ad campaign for a luxury fragrance (Google Ads certificate)", "80 h", "APPR B73B", "Digital Marketer Apprenticeship 2", "4"),
    ("3", "Improve the design and launch of a SaaS invoicing app", "60 h", "APPR B73C", "Digital Marketer Apprenticeship 3", "3"),
    ("4", "Build Ocean Heaven's social media strategy", "60 h", "APPR B73E", "Digital Marketer Apprenticeship 5", "3"),
    ("5", "Identify target customer groups (market research, personas)", "60 h", "APPR B73D", "Digital Marketer Apprenticeship 4", "3"),
    ("6", "Audit a website to optimize its SEO", "60 h", "APPR B73F", "Digital Marketer Apprenticeship 6", "3"),
    ("7", "Capture prospects and maximize lifetime value (landing pages, email, CRM)", "60 h", "APPR B73G", "Digital Marketer Apprenticeship 7", "3"),
]

REGION_ORDER = ["Bay Area", "Central Valley/Mother Lode", "Far North", "Greater Sacramento", "Inland Empire/Desert",
                "Los Angeles", "Orange County", "San Diego/Imperial", "South Central Coast",
                "Statewide (online college)"]


def esc(s):
    return html.escape(clean(s), quote=True)


def main():
    d = json.load(open(SRC))
    today = dt.date.today()
    courses = d["courses"]
    rows = []
    for c in courses:
        rows.append({
            "c": c["college"], "r": c["region"], "id": clean(c["course_id"]), "t": clean(c["course_title"]),
            "u": c["units"], "s": c["strength"], "l": c["lens"], "k": "onmap" if c["on_map"] else "new",
            "om": clean(c["on_map"]), "cr": c["credit"], "a": c["active"].startswith("Yes"),
            "d": clean(c["description"])[:700], "cp": c["competencies"], "di": clean(c["discipline"]),
            "ev": c["evidence"],
        })
    cnt = collections.Counter(c["strength"] for c in courses)
    strong_colleges = {c["college"] for c in courses if c["strength"] in ("Strong", "Direct match")}
    all_colleges = {c["college"] for c in courses}
    map_colleges = {m["college"] for m in d["map_rows"]}
    dm_programs = [p for p in d["programs"] if p["fit"] == "Digital-marketing focused"]

    # region chart data
    reg = collections.defaultdict(lambda: collections.Counter())
    for c in courses:
        reg[c["region"]][c["strength"]] += 1
    reg_max = max(sum(v.values()) for v in reg.values())
    bars = []
    for r in REGION_ORDER:
        if r not in reg:
            continue
        v = reg[r]
        tot = sum(v.values())
        segs = "".join(
            f'<span class="seg s-{k.split()[0].lower()}" style="width:{v[k] / reg_max * 100:.2f}%" '
            f'title="{k}: {v[k]}"></span>' for k in ("Direct match", "Strong", "Moderate", "Partial") if v[k])
        ncol = len({c["college"] for c in courses if c["region"] == r and c["strength"] in ("Strong", "Direct match")})
        bars.append(f'<div class="bar"><div class="bl">{esc(r)}</div><div class="bt">{segs}</div>'
                    f'<div class="bn"><b>{tot}</b> courses · {ncol} colleges with a strong match</div></div>')

    proj_rows = "".join(
        f"<tr><td class='num'>{p}</td><td>{esc(t)}</td><td class='num'>{h}</td>"
        f"<td><b>{cid}</b> {esc(ct)}</td><td class='num'>{u}</td></tr>" for p, t, h, cid, ct, u in PROJECTS)

    map_rows = sorted(d["map_rows"], key=lambda m: (m["exhibit_title"], m["college"]))
    map_html = "".join(
        f"<tr><td>{esc(m['exhibit_title'])}<div class='sub'>{esc(m['exhibit_id'])}</div></td>"
        f"<td>{esc(m['credit_rec'])}</td><td>{esc(m['college'])}<div class='sub'>{esc(m['region'])}</div></td>"
        f"<td><b>{esc(m['course_id'])}</b> {esc(m['course_title'])}</td></tr>" for m in map_rows)

    prog_html = "".join(
        f"<tr><td>{esc(p['college'])}<div class='sub'>{esc(p['region'])}</div></td><td>{esc(p['program'])}</td>"
        f"<td>{esc(p['award'])}</td><td class='num'>{esc(p['units'])}</td></tr>"
        for p in sorted(dm_programs, key=lambda p: (p["region"], p["college"], p["program"])))

    ace_html = "".join(
        f"<tr><td>{esc(r['credit_rec'])}</td><td>{esc(r['exhibit_title'])}<div class='sub'>{esc(r['exhibit_id'])}</div></td>"
        f"<td>{len(r['colleges'])}</td></tr>" for r in d["ace_recs"])

    regions = [r for r in REGION_ORDER if r in reg]
    lenses = sorted({c["lens"] for c in courses})
    opts = lambda xs: "".join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in xs)  # noqa: E731

    page = TEMPLATE
    for k, v in {
        "__DATE__": f"{today:%B %-d, %Y}",
        "__N_COURSES__": str(len(courses)), "__N_COLLEGES__": str(len(all_colleges)),
        "__N_STRONG__": str(cnt["Strong"]), "__N_MOD__": str(cnt["Moderate"]), "__N_PART__": str(cnt["Partial"]),
        "__N_STRONG_COL__": str(len(strong_colleges)), "__N_MAP__": str(len(d["map_rows"])),
        "__N_MAP_COL__": str(len(map_colleges)), "__N_PROG__": str(len(dm_programs)),
        "__N_PROG_ALL__": str(len(d["programs"])),
        "__BARS__": "".join(bars), "__PROJ__": proj_rows, "__MAPROWS__": map_html, "__PROG__": prog_html,
        "__ACE__": ace_html, "__REG_OPTS__": opts(regions), "__LENS_OPTS__": opts(lenses),
        "__DATA__": json.dumps(rows, ensure_ascii=False).replace("</", "<\\/"),
    }.items():
        page = page.replace(k, v)
    open(OUT, "w", encoding="utf-8").write(page)
    print(OUT, f"{os.path.getsize(OUT) / 1024:.0f} KB")


TEMPLATE = r"""<title>OpenClassrooms Digital Marketer CPL Crosswalk</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
/* First Light: paper ground, seal-blue headings, cobalt accent; one long reading column that widens for tables */
:root{
  --paper:#F4F2ED; --surface:#FFFFFF; --surface-2:#F7F5F1; --surface-3:#ECE9E2;
  --ink:#1C1C1A; --ink-2:#3A3A36; --muted:#5C5C55; --line:#DAD6CC;
  --seal:#002F6D; --accent:#0047AB; --accent-soft:#E6EDF7;
  --direct:#002F6D; --strong:#2C601A; --strong-soft:#E6EFE2; --moderate:#8B6800; --moderate-soft:#F6EED6;
  --partial:#87877F; --partial-soft:#ECE9E2;
  --display:'Playfair Display',Georgia,serif; --sans:'Source Sans 3',Arial,sans-serif;
  --shadow:0 1px 2px rgba(28,28,26,.06),0 8px 24px -14px rgba(28,28,26,.2);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#15171B; --surface:#1D2026; --surface-2:#22262D; --surface-3:#2A2F37;
  --ink:#EDEBE6; --ink-2:#CFCCC4; --muted:#A3A097; --line:#343A44;
  --seal:#9DB8E0; --accent:#7DA1D4; --accent-soft:#1F2A3B;
  --direct:#9DB8E0; --strong:#89A67F; --strong-soft:#1E2A1B; --moderate:#E3B341; --moderate-soft:#2E2710;
  --partial:#A3A097; --partial-soft:#2A2F37; color-scheme:dark;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -14px rgba(0,0,0,.6);
}}
:root[data-theme="dark"]{
  --paper:#15171B; --surface:#1D2026; --surface-2:#22262D; --surface-3:#2A2F37;
  --ink:#EDEBE6; --ink-2:#CFCCC4; --muted:#A3A097; --line:#343A44;
  --seal:#9DB8E0; --accent:#7DA1D4; --accent-soft:#1F2A3B;
  --direct:#9DB8E0; --strong:#89A67F; --strong-soft:#1E2A1B; --moderate:#E3B341; --moderate-soft:#2E2710;
  --partial:#A3A097; --partial-soft:#2A2F37; color-scheme:dark;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -14px rgba(0,0,0,.6);
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55}
.skip{position:absolute;left:-999px;top:0;background:var(--surface);color:var(--accent);padding:8px 12px;z-index:9}
.skip:focus{left:16px}
.wrap{max-width:1180px;margin:0 auto;padding-inline:clamp(16px,3vw,28px);padding-block:40px 80px;display:flex;flex-direction:column;gap:36px}
.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:0}
h1,h2{font-family:var(--display);color:var(--seal);text-wrap:balance}
h1{font-size:clamp(28px,4.4vw,44px);line-height:1.1;font-weight:700;margin:10px 0 0}
h2{font-size:clamp(21px,2.4vw,26px);font-weight:700;margin:0 0 6px}
.lede{font-size:clamp(16px,1.8vw,18.5px);color:var(--ink-2);margin:14px 0 0;max-width:var(--cpl-measure,none)}
.prov{font-size:13px;color:var(--muted);margin:16px 0 0;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:4px 18px}
.prov b{color:var(--ink-2)}
.finding{background:var(--surface);border:1px solid var(--line);border-top:3px solid var(--seal);border-radius:4px;padding:20px 24px;box-shadow:var(--shadow)}
.finding .lbl{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--seal)}
.finding p{margin:8px 0 0;color:var(--ink-2)}
.finding p strong{color:var(--ink)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.tile{background:var(--surface);padding:16px 18px}
.tile .n{font-family:var(--display);font-size:32px;font-weight:700;color:var(--seal);font-variant-numeric:tabular-nums;line-height:1.05}
.tile .k{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.35}
.note{font-size:14.5px;color:var(--muted);margin:0 0 14px}
section{min-width:0}
.tw{border:1px solid var(--line);border-radius:4px;overflow-x:auto;background:var(--surface);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{background:var(--surface-2);text-align:left;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;font-size:14.5px;color:var(--ink-2);overflow-wrap:anywhere}
td b{color:var(--ink)}
.num{font-variant-numeric:tabular-nums}
.sub{font-size:12.5px;color:var(--muted)}
.bars{display:flex;flex-direction:column;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:18px 20px}
.bar{display:grid;grid-template-columns:minmax(120px,210px) 1fr;gap:4px 14px;align-items:center}
.bl{font-size:14px;font-weight:600;color:var(--ink)}
.bt{display:flex;height:16px;background:var(--surface-3);border-radius:2px;overflow:hidden}
.bn{grid-column:2;font-size:12.5px;color:var(--muted)}
.seg{display:block;height:100%}
.s-direct{background:var(--direct)} .s-strong{background:var(--strong)} .s-moderate{background:var(--moderate)} .s-partial{background:var(--partial)}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--muted);margin-top:4px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px}
select,input[type=search]{font-family:var(--sans);font-size:14.5px;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:8px 10px;min-height:40px;max-width:100%}
input[type=search]{flex:1 1 220px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.count{font-size:13.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.pill{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap}
.p-direct{background:var(--accent-soft);color:var(--direct)} .p-strong{background:var(--strong-soft);color:var(--strong)}
.p-moderate{background:var(--moderate-soft);color:var(--moderate)} .p-partial{background:var(--partial-soft);color:var(--ink-2)}
tr.row{cursor:pointer} tr.row:hover td{background:var(--surface-2)}
tr.det td{background:var(--surface-2);font-size:14px}
tr.det p{margin:0 0 8px}
.more{margin-top:12px;display:flex;justify-content:center}
button{font-family:var(--sans);font-size:14.5px;font-weight:600;color:var(--accent);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:9px 16px;min-height:40px;cursor:pointer}
.method{background:var(--accent-soft);border:1px solid var(--line);border-radius:4px;padding:20px 24px}
.method p{margin:8px 0 0;color:var(--ink-2)}
@media (max-width:560px){
  .bar{grid-template-columns:1fr}.bn{grid-column:1}
  .col-hide{display:none}
  #explore ~ .tw table,.tw table{table-layout:auto}
  .tw col{width:auto!important}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<a class="skip" href="#explore">Skip to the course list</a>
<main class="wrap">
<header>
  <p class="eyebrow">CPL Initiative · Partner crosswalk</p>
  <h1>OpenClassrooms Digital Marketer across the California Community Colleges</h1>
  <p class="lede">Where the OpenClassrooms Digital Marketer Registered Apprenticeship (O*NET 13-1161.01, RAPIDS 2077CB; 27 competencies, 400 hours in seven projects) lines up with college courses. The list covers MAP first, then every course in COCI, including courses that have never been added to MAP.</p>
  <div class="prov"><span><b>Prepared</b> __DATE__ for Ashley, MAP team</span><span><b>Sources</b> MAP exhibits and credit recommendations · COCI courses and programs · MIS Fall 2025 course inventory</span><span><b>Status</b> research list for faculty review</span></div>
</header>

<div class="finding" role="note">
  <div class="lbl">Start here</div>
  <p><strong>Bakersfield College already teaches this apprenticeship.</strong> APPR B73A–G, <em>Digital Marketer Apprenticeship 1–7</em>, is 20 credit units, active in the MIS Fall 2025 inventory, and each course description restates one OpenClassrooms project brief (paid ad campaign, app redesign, market research, social media strategy, SEO audit, landing pages and email). No MAP exhibit exists for it. Confirm with Bakersfield whether the series is OpenClassrooms' related instruction; if it is, it becomes the model articulation for every other college.</p>
  <p><strong>MAP holds no statewide credit recommendation</strong> for digital marketing, social media, SEO or advertising. What MAP does hold are local exhibits for related credentials (CLEP, AMA, CFT, credit by exam) at __N_MAP_COL__ colleges, which show those courses already accept CPL.</p>
</div>

<div class="tiles">
  <div class="tile"><div class="n">0</div><div class="k">MAP statewide credit recommendations in this subject</div></div>
  <div class="tile"><div class="n">__N_MAP__</div><div class="k">existing MAP articulations to related courses, at __N_MAP_COL__ colleges</div></div>
  <div class="tile"><div class="n">__N_STRONG__</div><div class="k">strong course matches, plus 7 direct matches at Bakersfield</div></div>
  <div class="tile"><div class="n">__N_STRONG_COL__</div><div class="k">colleges with at least one strong or direct match</div></div>
  <div class="tile"><div class="n">__N_COURSES__</div><div class="k">aligned courses in all, at __N_COLLEGES__ colleges</div></div>
  <div class="tile"><div class="n">__N_PROG__</div><div class="k">digital-marketing certificates and degrees in COCI</div></div>
</div>

<section aria-labelledby="h-proj">
  <h2 id="h-proj">The seven projects beside Bakersfield's seven courses</h2>
  <p class="note">OpenClassrooms' related instruction, in its own order, against the Bakersfield course whose description restates it.</p>
  <div class="tw" role="region" aria-label="OpenClassrooms projects and Bakersfield courses" tabindex="0">
  <table><colgroup><col style="width:8%"><col style="width:44%"><col style="width:10%"><col style="width:30%"><col style="width:8%"></colgroup>
  <thead><tr><th scope="col">Project</th><th scope="col">OpenClassrooms project</th><th scope="col">Hours</th><th scope="col">Bakersfield course</th><th scope="col">Units</th></tr></thead>
  <tbody>__PROJ__</tbody></table></div>
</section>

<section aria-labelledby="h-reg">
  <h2 id="h-reg">Aligned courses by region</h2>
  <p class="note">Strong Workforce Program regions. Bar length is the number of aligned courses; the colors split them by alignment strength.</p>
  <div class="bars">__BARS__
    <div class="legend"><span><i class="s-direct"></i>Direct match</span><span><i class="s-strong"></i>Strong</span><span><i class="s-moderate"></i>Moderate</span><span><i class="s-partial"></i>Partial</span></div>
  </div>
</section>

<section aria-labelledby="explore">
  <h2 id="explore">Every aligned course</h2>
  <p class="note">Select a row to read its catalog description and the OpenClassrooms competencies it evidences. A course title alone never makes a row Strong; the description has to show at least three competency groups.</p>
  <div class="controls">
    <input id="q" type="search" placeholder="Search college, course or topic" aria-label="Search college, course or topic">
    <select id="fs" aria-label="Alignment strength"><option value="">All strengths</option><option>Direct match</option><option>Strong</option><option>Moderate</option><option>Partial</option></select>
    <select id="fr" aria-label="Region"><option value="">All regions</option>__REG_OPTS__</select>
    <select id="fl" aria-label="Topic area"><option value="">All topic areas</option>__LENS_OPTS__</select>
    <select id="fk" aria-label="MAP status"><option value="">In MAP or not</option><option value="new">Not in MAP</option><option value="onmap">On MAP through another exhibit</option></select>
    <span class="count" id="count" aria-live="polite"></span>
  </div>
  <div class="tw" role="region" aria-label="Aligned courses" tabindex="0">
  <table><colgroup><col style="width:22%"><col style="width:30%"><col class="col-hide" style="width:20%"><col style="width:13%"><col class="col-hide" style="width:15%"></colgroup>
  <thead><tr><th scope="col">College</th><th scope="col">Course</th><th scope="col" class="col-hide">Topic area</th><th scope="col">Strength</th><th scope="col" class="col-hide">Region</th></tr></thead>
  <tbody id="tb"></tbody></table></div>
  <div class="more"><button id="more" type="button">Show more</button></div>
</section>

<section aria-labelledby="h-map">
  <h2 id="h-map">What MAP already holds</h2>
  <p class="note">Local exhibits for other credentials, articulated to courses that overlap the apprenticeship. None is for OpenClassrooms and none is statewide. They show where a college has already accepted CPL into the course.</p>
  <div class="tw" role="region" aria-label="Existing MAP articulations" tabindex="0">
  <table><colgroup><col style="width:30%"><col style="width:26%"><col style="width:20%"><col style="width:24%"></colgroup>
  <thead><tr><th scope="col">Exhibit</th><th scope="col">Credit recommendation</th><th scope="col">College</th><th scope="col">Course</th></tr></thead>
  <tbody>__MAPROWS__</tbody></table></div>
</section>

<section aria-labelledby="h-prog">
  <h2 id="h-prog">Digital-marketing certificates and degrees</h2>
  <p class="note">Active or approved COCI programs whose title names digital, internet, online or social media marketing, e-commerce or content. The workbook also lists the __N_PROG_ALL__ broader marketing programs.</p>
  <div class="tw" role="region" aria-label="Digital marketing programs" tabindex="0">
  <table><colgroup><col style="width:28%"><col style="width:36%"><col style="width:28%"><col style="width:8%"></colgroup>
  <thead><tr><th scope="col">College</th><th scope="col">Program</th><th scope="col">Award</th><th scope="col">Units</th></tr></thead>
  <tbody>__PROG__</tbody></table></div>
</section>

<section aria-labelledby="h-ace">
  <h2 id="h-ace">Related military credit recommendations in MAP</h2>
  <p class="note">ACE recommendations for military training in the same subjects. They credit military training, so they do not carry over to OpenClassrooms, and no college has attached a course to them yet. Their wording is ready for faculty to reuse.</p>
  <div class="tw" role="region" aria-label="Related ACE credit recommendations" tabindex="0">
  <table><colgroup><col style="width:36%"><col style="width:48%"><col style="width:16%"></colgroup>
  <thead><tr><th scope="col">Credit recommendation</th><th scope="col">Military training</th><th scope="col">Colleges</th></tr></thead>
  <tbody>__ACE__</tbody></table></div>
</section>

<section class="method" aria-labelledby="h-method">
  <h2 id="h-method">How the list was built</h2>
  <p>MAP: every exhibit and credit recommendation searched for marketing, advertising, social media, SEO, e-commerce, UX, content and CRM. COCI: all 141,738 courses, matched on title and a business, media or IT TOP code, plus courses found by digital-marketing phrases in their catalog description. Internships, work experience and independent study are left out. The TOP code only corroborates a match and never decides one.</p>
  <p>Each course's title and description are then read against thirteen competency groups built from the 27 Appendix A work processes. Strong means the course centers on what the apprenticeship teaches and evidences three or more groups. "Active" means the course appears in the MIS Fall 2025 course inventory; confirm the rest in the current catalog. This is a snapshot for faculty review, not an articulation decision.</p>
</section>
</main>

<script>
const DATA = __DATA__;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cls = s => 'p-' + s.split(' ')[0].toLowerCase();
let shown = 60, open = new Set();
function filtered(){
  const q = $('q').value.trim().toLowerCase(), fs = $('fs').value, fr = $('fr').value, fl = $('fl').value, fk = $('fk').value;
  return DATA.filter(r => (!fs || r.s === fs) && (!fr || r.r === fr) && (!fl || r.l === fl) && (!fk || r.k === fk) &&
    (!q || (r.c + ' ' + r.id + ' ' + r.t + ' ' + r.l + ' ' + r.d).toLowerCase().includes(q)));
}
function render(){
  const rows = filtered(), out = [];
  rows.slice(0, shown).forEach((r, i) => {
    const key = r.c + '|' + r.id;
    out.push(`<tr class="row" tabindex="0" data-k="${esc(key)}" aria-expanded="${open.has(key)}"><td><b>${esc(r.c)}</b></td>` +
      `<td><b>${esc(r.id)}</b> ${esc(r.t)}<div class="sub">${esc(r.u)} units · ${esc(r.cr)}${r.a ? ' · active' : ' · verify status'}${r.k === 'onmap' ? ' · on MAP via ' + esc(r.om) : ''}</div></td>` +
      `<td class="col-hide">${esc(r.l)}</td><td><span class="pill ${cls(r.s)}">${esc(r.s)}</span></td><td class="col-hide">${esc(r.r)}</td></tr>`);
    if (open.has(key)) out.push(`<tr class="det"><td colspan="5"><p>${esc(r.d) || 'No catalog description in COCI.'}</p>` +
      `<p><b>Competencies evidenced:</b> ${esc(r.cp) || 'none named in the description'}</p>` +
      `<p class="sub">Discipline: ${esc(r.di)} · Found by: ${esc(r.ev)}</p></td></tr>`);
  });
  $('tb').innerHTML = out.join('') || '<tr><td colspan="5">No courses match these filters.</td></tr>';
  $('count').textContent = `${Math.min(shown, rows.length)} of ${rows.length} courses`;
  $('more').hidden = rows.length <= shown;
}
function toggle(tr){ const k = tr.dataset.k; open.has(k) ? open.delete(k) : open.add(k); render(); }
$('tb').addEventListener('click', e => { const tr = e.target.closest('tr.row'); if (tr) toggle(tr); });
$('tb').addEventListener('keydown', e => { const tr = e.target.closest('tr.row'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(tr); } });
['q','fs','fr','fl','fk'].forEach(id => $(id).addEventListener('input', () => { shown = 60; render(); }));
$('more').addEventListener('click', () => { shown += 100; render(); });
render();
</script>
"""

if __name__ == "__main__":
    main()
