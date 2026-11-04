#!/usr/bin/env python3
"""Write the OpenClassrooms Medical Assistant crosswalk page (First Light) from
kb/oc_medical_assistant_out/crosswalk.json. Same rows and counts as the workbook:
both read the one JSON, and this script reuses the workbook's row builder.

Run:  python3 kb/_write_oc_medical_assistant_html.py
"""
import collections
import datetime as dt
import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _write_oc_medical_assistant_workbook import EXISTING, POTENTIAL, rows_for, clean  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "oc_medical_assistant_out", "crosswalk.json")
OUT = os.path.join(HERE, "oc_medical_assistant_out", "openclassrooms_medical_assistant_crosswalk.html")
COCI_URL = "https://coci2.ccctechcenter.net/courses"
MAP_URL = "https://map.rccd.edu/cpllandingpages/"

e = html.escape


def main():
    d = json.load(open(SRC))
    today = dt.date.today()
    rows = rows_for(d)
    order = {"High": 0, "Medium": 1, "Low": 2}
    rows.sort(key=lambda r: (r["status"] != EXISTING, order[r["strength"]], r["region"], r["college"]))
    data = []
    for r in rows:
        v = r["vals"]
        data.append({
            "s": "E" if r["status"] == EXISTING else "P", "m": r["strength"][0], "g": v[1], "c": v[6],
            "cr": v[2], "di": v[3].replace(" (from TOP; verify)", "").replace(" (TOP; verify)", ""),
            "dv": "verify" in v[3], "ei": v[4], "et": v[5], "t": clean(v[7]), "id": v[8], "u": v[9],
            "de": clean(v[10]), "al": v[11], "n": clean(v[15]), "la": v[16], "pj": v[17], "ms": v[19],
            "ac": v[20], "ctrl": v[22], "via": v[23],
            "cat": d["catalog"].get(v[6], ""),
        })
    ex = [r for r in rows if r["status"] == EXISTING]
    po = [r for r in rows if r["status"] == POTENTIAL]
    cols_match = {r["college"] for r in rows}
    high_cols = {r["college"] for r in po if r["strength"] == "High"}
    ex_cols = {r["college"] for r in ex}
    prospects = high_cols | ex_cols

    # region summary
    regions = sorted({r["region"] for r in rows if r["region"]})
    reg_html = []
    maxc = 0
    reg_stats = []
    for g in regions:
        rr = [r for r in rows if r["region"] == g]
        cols = {r["college"] for r in rr}
        top = {}
        for r in rr:
            k = "E" if r["status"] == EXISTING else r["strength"][0]
            best = top.get(r["college"])
            rank = {"E": 0, "H": 1, "M": 2, "L": 3}
            if best is None or rank[k] < rank[best]:
                top[r["college"]] = k
        cnt = collections.Counter(top.values())
        reviewed = sum(1 for c in d["colleges_reviewed"] if any(x["college"] == c and x["region"] == g for x in rows))
        reg_stats.append((g, len(cols), cnt, sum(1 for r in rr if r["status"] == POTENTIAL),
                          sum(1 for p in d["programs"] if p["region"] == g and p["fit"] == "Medical assisting program")))
        maxc = max(maxc, len(cols))
    for g, n, cnt, nc, np_ in reg_stats:
        segs = "".join(
            f'<span class="seg s-{k}" style="width:{cnt.get(k, 0) / maxc * 100:.2f}%"></span>' for k in "EHML")
        reg_html.append(
            f'<div class="bar"><div class="bl">{e(g)}</div><div class="bt" role="img" aria-label="{e(g)}: '
            f'{cnt.get("E", 0)} colleges with existing approved CPL, {cnt.get("H", 0)} with a High match at best, '
            f'{cnt.get("M", 0)} Medium, {cnt.get("L", 0)} Low">{segs}</div>'
            f'<div class="bn">{n} colleges · {nc} course matches · {np_} medical assisting programs</div></div>')

    # top prospects
    per = collections.defaultdict(lambda: {"H": 0, "M": 0, "E": 0, "g": ""})
    for r in rows:
        p = per[r["college"]]
        p["g"] = r["region"]
        if r["status"] == EXISTING:
            p["E"] += 1
        elif r["strength"] != "Low":
            p[r["strength"][0]] += 1
    progs = collections.Counter(p["college"] for p in d["programs"] if p["fit"] == "Medical assisting program")
    top = sorted(per.items(), key=lambda kv: (-kv[1]["H"], -kv[1]["E"], -kv[1]["M"], kv[0]))[:20]
    top_html = "".join(
        f'<tr><td><b>{e(c)}</b></td><td>{e(p["g"])}</td><td class="num">{p["H"]}</td><td class="num">{p["M"]}</td>'
        f'<td class="num">{p["E"]}</td><td class="num">{progs.get(c, 0)}</td></tr>' for c, p in top)

    # training map
    grp = collections.Counter(h[0] for c in d["courses"] for h in c["hits"])
    proj_html = "".join(
        f'<tr><td><b>{e(p["id"])}</b></td><td>{e(p["name"])}</td><td class="num">{p["hours"] or "~250"}</td></tr>'
        for p in d["projects"])
    grp_html = "".join(
        f'<tr><td>{e(g["group"])}</td><td>{e(g["work_processes"])}</td><td>{e(g["projects"])}</td>'
        f'<td class="num">{grp[g["group"]]}</td></tr>' for g in d["competency_groups"])

    def opts(vals):
        return "".join(f'<option value="{e(v)}">{e(v)}</option>' for v in vals)

    page = TEMPLATE
    for k, v in {
        "__DATE__": f"{today:%B %-d, %Y}", "__COCI_DATE__": str(d.get("coci_built_at")),
        "__N_REV__": str(len(d["colleges_reviewed"])), "__N_MATCHCOL__": str(len(cols_match)),
        "__N_ROWS__": str(len(rows)), "__N_PO__": str(len(po)), "__N_EX__": str(len(ex)),
        "__N_EXCOL__": str(len(ex_cols)), "__N_HIGH__": str(sum(1 for r in po if r["strength"] == "High")),
        "__N_HIGHCOL__": str(len(high_cols)), "__N_PROSP__": str(len(prospects)),
        "__N_MED__": str(sum(1 for r in po if r["strength"] == "Medium")),
        "__N_LOW__": str(sum(1 for r in po if r["strength"] == "Low")),
        "__N_MAPROG__": str(sum(progs.values())), "__N_MAPROGCOL__": str(len(progs)),
        "__REGBARS__": "".join(reg_html), "__TOP__": top_html, "__PROJ__": proj_html, "__GRP__": grp_html,
        "__REG_OPTS__": opts(regions), "__COL_OPTS__": opts(sorted(cols_match)),
        "__DIS_OPTS__": opts(sorted({x["di"] for x in data if x["di"]})),
        "__LENS_OPTS__": opts(sorted({x["la"] for x in data if x["la"]})),
        "__CERT__": e(d["certificate"]),
        "__FLAGS__": "".join(f"<li>{e(f)}</li>" for f in d["data_flags"]),
        "__DATA__": json.dumps(data, ensure_ascii=False).replace("</", "<\\/"),
    }.items():
        page = page.replace(k, v)
    open(OUT, "w", encoding="utf-8").write(page)
    print(OUT, f"{os.path.getsize(OUT) / 1024:.0f} KB")


TEMPLATE = r"""<title>OpenClassrooms Medical Assistant CPL Crosswalk</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>
/* First Light: paper ground, seal-blue headings, cobalt accent. One reading column that widens for the crosswalk table.
   Existing approvals wear a solid seal-blue chip; potential alignments an outlined one. */
:root{
  --paper:#F4F2ED; --surface:#FFFFFF; --surface-2:#F7F5F1; --surface-3:#ECE9E2;
  --ink:#1C1C1A; --ink-2:#3A3A36; --muted:#5C5C55; --line:#DAD6CC;
  --seal:#002F6D; --on-seal:#FFFFFF; --accent:#0047AB; --accent-soft:#E6EDF7;
  --high:#2C601A; --high-soft:#E6EFE2; --med:#7A5C00; --med-soft:#F6EED6; --low:#6B6B63; --low-soft:#ECE9E2;
  --display:'Playfair Display',Georgia,serif; --sans:'Source Sans 3',Arial,sans-serif;
  --shadow:0 1px 2px rgba(28,28,26,.06),0 8px 24px -14px rgba(28,28,26,.2);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#15171B; --surface:#1D2026; --surface-2:#22262D; --surface-3:#2A2F37;
  --ink:#EDEBE6; --ink-2:#CFCCC4; --muted:#A3A097; --line:#343A44;
  --seal:#9DB8E0; --on-seal:#15171B; --accent:#7DA1D4; --accent-soft:#1F2A3B;
  --high:#9CC28F; --high-soft:#1E2A1B; --med:#E3B341; --med-soft:#2E2710; --low:#A3A097; --low-soft:#2A2F37;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -14px rgba(0,0,0,.6); color-scheme:dark;
}}
:root[data-theme="dark"]{
  --paper:#15171B; --surface:#1D2026; --surface-2:#22262D; --surface-3:#2A2F37;
  --ink:#EDEBE6; --ink-2:#CFCCC4; --muted:#A3A097; --line:#343A44;
  --seal:#9DB8E0; --on-seal:#15171B; --accent:#7DA1D4; --accent-soft:#1F2A3B;
  --high:#9CC28F; --high-soft:#1E2A1B; --med:#E3B341; --med-soft:#2E2710; --low:#A3A097; --low-soft:#2A2F37;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px -14px rgba(0,0,0,.6); color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:16px;line-height:1.55}
.skip{position:absolute;left:-999px;top:0;background:var(--surface);color:var(--accent);padding:8px 12px;z-index:9}
.skip:focus{left:16px}
.wrap{max-width:1200px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:40px 80px;display:flex;flex-direction:column;gap:40px}
.eyebrow{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin:0}
h1,h2,h3{font-family:var(--display);color:var(--seal);text-wrap:balance}
h1{font-size:clamp(28px,4.4vw,44px);line-height:1.1;font-weight:700;margin:10px 0 0}
h2{font-size:clamp(21px,2.4vw,26px);font-weight:700;margin:0 0 6px}
h3{font-size:18px;margin:0 0 6px}
.lede{font-size:clamp(16px,1.8vw,18.5px);color:var(--ink-2);margin:14px 0 0;max-width:var(--cpl-measure,none)}
.prov{font-size:13px;color:var(--muted);margin:16px 0 0;padding-top:12px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:4px 18px}
.prov b{color:var(--ink-2)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.tile{background:var(--surface);padding:16px 18px}
.tile .n{font-family:var(--display);font-size:32px;font-weight:700;color:var(--seal);font-variant-numeric:tabular-nums;line-height:1.05}
.tile .k{font-size:13px;color:var(--muted);margin-top:6px;line-height:1.35}
.finding{background:var(--surface);border:1px solid var(--line);border-top:3px solid var(--seal);border-radius:4px;padding:20px 24px;box-shadow:var(--shadow)}
.finding .lbl{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--seal)}
.finding p{margin:8px 0 0;color:var(--ink-2)}
.finding p strong{color:var(--ink)}
.note{font-size:14.5px;color:var(--muted);margin:0 0 14px}
section{min-width:0}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:28px}
.two>*{min-width:0}
.tw{border:1px solid var(--line);border-radius:4px;overflow-x:auto;background:var(--surface);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{background:var(--surface-2);text-align:left;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:10px 12px;border-bottom:1px solid var(--line)}
td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;font-size:14.5px;color:var(--ink-2);overflow-wrap:anywhere}
td b{color:var(--ink)}
.num{font-variant-numeric:tabular-nums}
.sub{font-size:12.5px;color:var(--muted)}
.bars{display:flex;flex-direction:column;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:18px 20px}
.bar{display:grid;grid-template-columns:minmax(110px,200px) 1fr;gap:4px 14px;align-items:center}
.bl{font-size:14px;font-weight:600;color:var(--ink)}
.bt{display:flex;height:16px;background:var(--surface-3);border-radius:2px;overflow:hidden}
.bn{grid-column:2;font-size:12.5px;color:var(--muted)}
.seg{display:block;height:100%}
.s-E{background:var(--seal)} .s-H{background:var(--high)} .s-M{background:var(--med)} .s-L{background:var(--low)}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--muted);margin-top:4px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.controls{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:10px;margin-bottom:10px}
.controls label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);min-width:0}
select,input[type=search]{font-family:var(--sans);font-size:14.5px;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:8px 10px;min-height:40px;width:100%;text-transform:none;letter-spacing:0;font-weight:400}
.searchrow{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin-bottom:12px}
.searchrow input{flex:1 1 260px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.count{font-size:13.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.ctl{font-family:var(--sans);font-size:14.5px;font-weight:600;color:var(--accent);background:none;border:0;padding:0 2px;min-height:24px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.chip{display:inline-block;font-size:12px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;line-height:1.5}
.c-E{background:var(--seal);color:var(--on-seal)}
.c-P{background:transparent;color:var(--seal);box-shadow:inset 0 0 0 1px var(--seal)}
.p-H{background:var(--high-soft);color:var(--high)} .p-M{background:var(--med-soft);color:var(--med)} .p-L{background:var(--low-soft);color:var(--ink-2)}
tr.row td:first-child{border-left:4px solid transparent}
tr.row.ex td:first-child{border-left-color:var(--seal)}
tr.row{cursor:pointer} tr.row:hover td{background:var(--surface-2)}
tr.det td{background:var(--surface-2);font-size:14px;border-left:4px solid var(--line)}
tr.det dl{display:grid;grid-template-columns:minmax(120px,190px) 1fr;gap:6px 16px;margin:0}
tr.det dt{font-weight:700;color:var(--ink);font-size:13px}
tr.det dd{margin:0;min-width:0}
a{color:var(--accent)}
.links{display:flex;flex-wrap:wrap;gap:6px 16px}
.more{margin-top:14px;display:flex;justify-content:center}
.method{background:var(--accent-soft);border:1px solid var(--line);border-radius:4px;padding:20px 24px}
.method p,.method li{color:var(--ink-2)}
.method ul{margin:8px 0 0;padding-left:20px}
@media (max-width:560px){
  .bar{grid-template-columns:1fr}.bn{grid-column:1}
  tr.det dl{grid-template-columns:1fr}
  #explorer table{min-width:640px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<a class="skip" href="#explorer">Skip to the crosswalk table</a>
<main class="wrap">

<header>
  <p class="eyebrow">CPL Initiative · Partner crosswalk</p>
  <h1>OpenClassrooms Medical Assistant apprenticeship and the California Community Colleges</h1>
  <p class="lede">Where an apprentice who completes OpenClassrooms' Medical Assistant Registered Apprenticeship could
  earn credit for prior learning. The page names the courses colleges already approve CPL for, and the courses a college
  could review for a new CPL pathway.</p>
  <div class="prov">
    <span><b>Training:</b> O*NET-SOC 31-9092.00 · RAPIDS 1085CB · 24 work processes, 28 competencies · 400 hours of related instruction · about 18 months</span>
    <span><b>Prepared:</b> __DATE__ by the MAP team</span>
    <span><b>Sources:</b> MAP · COCI (__COCI_DATE__) · MIS Fall 2025 · college catalogs</span>
  </div>
</header>

<div class="tiles" aria-label="Summary counts">
  <div class="tile"><div class="n">__N_REV__</div><div class="k">colleges and noncredit institutions reviewed</div></div>
  <div class="tile"><div class="n">__N_MATCHCOL__</div><div class="k">with at least one aligned course</div></div>
  <div class="tile"><div class="n">__N_ROWS__</div><div class="k">course matches in the crosswalk</div></div>
  <div class="tile"><div class="n">__N_EX__</div><div class="k">existing approved CPL rows, at __N_EXCOL__ colleges</div></div>
  <div class="tile"><div class="n">__N_HIGH__</div><div class="k">High potential alignments, at __N_HIGHCOL__ colleges</div></div>
  <div class="tile"><div class="n">__N_PROSP__</div><div class="k">colleges to approach first: an approval or a High match</div></div>
</div>

<div class="finding">
  <div class="lbl">What we found</div>
  <p><strong>No college has CPL for OpenClassrooms' Medical Assistant training yet.</strong> MAP holds no exhibit for it,
  and no college carries a course series built on its projects.</p>
  <p><strong>__N_EXCOL__ colleges already approve CPL for courses in these subjects</strong>, mostly medical terminology and medical
  assisting, for military medical training and industry certifications. Those faculty have reviewed CPL in the field before,
  which makes them a natural first conversation.</p>
  <p><strong>__N_MAPROGCOL__ colleges run a medical assisting program</strong>, and __N_HIGHCOL__ have at least one course whose
  catalog description covers three or more of the apprenticeship's competency groups. Administrative medical assisting,
  clinical procedures, billing and coding, electronic health records and the externship carry the strongest matches.</p>
  <p><strong>Every potential match needs faculty review.</strong> A course match does not qualify a course for CPL. California
  also requires documented training before a medical assistant gives injections or draws blood, so clinical CPL will rest on the
  apprenticeship's skill-check records.</p>
</div>

<section aria-labelledby="h-reg">
  <h2 id="h-reg">Colleges by region</h2>
  <p class="note">Each bar counts colleges by their best result: an existing approval first, then the strongest potential match.</p>
  <div class="bars">__REGBARS__
    <div class="legend"><span><i class="s-E"></i>Existing approved CPL</span><span><i class="s-H"></i>High</span><span><i class="s-M"></i>Medium</span><span><i class="s-L"></i>Low only</span></div>
  </div>
</section>

<section class="two">
  <div>
    <h2>Colleges to approach first</h2>
    <p class="note">Ranked by High matches, then existing approvals. Medium excludes Low.</p>
    <div class="tw" role="region" aria-label="Top prospect colleges" tabindex="0">
      <table><colgroup><col style="width:38%"><col style="width:22%"><col><col><col><col></colgroup>
      <thead><tr><th scope="col">College</th><th scope="col">Region</th><th scope="col">High</th><th scope="col">Med.</th><th scope="col">Approved</th><th scope="col">MA prog.</th></tr></thead>
      <tbody>__TOP__</tbody></table>
    </div>
  </div>
  <div>
    <h2>The training</h2>
    <p class="note">The eight related-instruction projects in Appendix A, and the degree path's workplace project.</p>
    <div class="tw" role="region" aria-label="OpenClassrooms projects" tabindex="0">
      <table><colgroup><col style="width:56px"><col><col style="width:70px"></colgroup>
      <thead><tr><th scope="col">ID</th><th scope="col">Project</th><th scope="col">Hours</th></tr></thead>
      <tbody>__PROJ__</tbody></table>
    </div>
  </div>
</section>

<section aria-labelledby="h-grp">
  <h2 id="h-grp">Work processes and the courses that cover them</h2>
  <p class="note">The 24 work processes, grouped into the competency groups a course description must show.
  The last column counts the potential-match courses whose description shows each group.</p>
  <div class="tw" role="region" aria-label="Competency groups" tabindex="0">
    <table><colgroup><col style="width:34%"><col style="width:26%"><col style="width:20%"><col></colgroup>
    <thead><tr><th scope="col">Competency group</th><th scope="col">Work processes</th><th scope="col">Projects</th><th scope="col">Courses</th></tr></thead>
    <tbody>__GRP__</tbody></table>
  </div>
</section>

<section id="explorer" aria-labelledby="h-x">
  <h2 id="h-x">The crosswalk</h2>
  <p class="note">Select a row to see the course description, the competencies it covers, and links to the catalog, COCI and MAP.
  Existing approvals carry a solid chip and a seal-blue edge; potential alignments an outlined chip.</p>
  <div class="controls">
    <label for="f-cert">Certificate<select id="f-cert"><option value="">__CERT__</option></select></label>
    <label for="f-status">CPL status<select id="f-status"><option value="">All</option><option value="E">Existing approved opportunity</option><option value="P">Potential new alignment</option></select></label>
    <label for="f-str">Match strength<select id="f-str"><option value="">All</option><option value="H">High</option><option value="M">Medium</option><option value="L">Low</option><option value="HM">High and Medium</option></select></label>
    <label for="f-reg">Region<select id="f-reg"><option value="">All regions</option>__REG_OPTS__</select></label>
    <label for="f-col">College<select id="f-col"><option value="">All colleges</option>__COL_OPTS__</select></label>
    <label for="f-dis">Discipline<select id="f-dis"><option value="">All disciplines</option>__DIS_OPTS__</select></label>
    <label for="f-lens">Credit area<select id="f-lens"><option value="">All areas</option>__LENS_OPTS__</select></label>
  </div>
  <div class="searchrow">
    <input type="search" id="f-q" placeholder="Search course, college, description or exhibit" aria-label="Search the crosswalk">
    <span class="count" id="count" aria-live="polite"></span>
    <button type="button" class="ctl" id="reset">Clear filters</button>
  </div>
  <div class="tw" role="region" aria-label="Crosswalk table" tabindex="0">
    <table><colgroup><col style="width:22%"><col style="width:30%"><col class="hide-sm" style="width:24%"><col style="width:11%"><col style="width:13%"></colgroup>
    <thead><tr><th scope="col">College</th><th scope="col">Course</th><th scope="col" class="hide-sm">Credit area / recommendation</th><th scope="col">Match</th><th scope="col">CPL status</th></tr></thead>
    <tbody id="tb"></tbody></table>
  </div>
  <div class="more"><button type="button" class="ctl" id="more">Show 100 more</button></div>
</section>

<section class="method" aria-labelledby="h-m">
  <h2 id="h-m">How to read this</h2>
  <p><b>Existing approved opportunity</b> means a college already approves CPL in MAP for this course, for another credential:
  a MAP exhibit or a military (ACE) credit recommendation. The course accepts CPL; it is not yet approved for OpenClassrooms.
  <b>Potential new alignment</b> means the college's COCI record shows a course whose title and catalog description match the
  apprenticeship's work processes. No CPL exists for it.</p>
  <p><b>High</b>: a medical assisting, front-office, billing and coding, or health records course whose description shows three
  or more competency groups. <b>Medium</b>: the subject is in the training, with less evidence in the description, or a narrow
  specialty such as phlebotomy or EKG that the training covers in a short project. <b>Low</b>: the training touches the subject
  without a module for it, such as medical terminology, or the description is too thin to judge.</p>
  <h3>Limitations</h3>
  <ul>
    <li>Descriptions are the college-entered COCI summary. Faculty review starts from the course outline of record and its learning outcomes, which this page did not read course by course.</li>
    <li>Course numbers, units and status come from COCI and the MIS Fall 2025 inventory. A course absent from Fall 2025 is flagged for checking.</li>
    <li>OpenClassrooms has no module in medical terminology, anatomy and physiology, or CPR. Anatomy courses are left out; terminology stays at Low.</li>
    <li>Phlebotomy certification in California requires a CDPH-approved program, and injections and venipuncture by a medical assistant require documented training (16 CCR 1366.1).</li>
    <li>Appendix A's wage table is headed "Sales Development Representative", apparently from another program. Worth confirming with OpenClassrooms.</li>
    __FLAGS__
  </ul>
  <p class="sub">A snapshot as of __DATE__. MAP exhibits: <a href="https://map.rccd.edu/cpllandingpages/" rel="noopener" target="_blank">MAP college CPL pages</a>.
  Courses: <a href="https://coci2.ccctechcenter.net/courses" rel="noopener" target="_blank">COCI course search</a>.
  The Excel workbook carries the same rows.</p>
</section>
</main>

<script>
const D = __DATA__;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const SN = {H:"High", M:"Medium", L:"Low"};
let shown = 100, open = new Set();
function filt(){
  const st=$("f-status").value, sr=$("f-str").value, rg=$("f-reg").value, co=$("f-col").value,
        di=$("f-dis").value, la=$("f-lens").value, q=$("f-q").value.trim().toLowerCase();
  return D.filter(r => (!st||r.s===st) && (!sr||sr.includes(r.m)) && (!rg||r.g===rg) && (!co||r.c===co)
    && (!di||r.di===di) && (!la||r.la===la)
    && (!q || [r.c,r.t,r.id,r.de,r.cr,r.et,r.ei,r.la].join(" ").toLowerCase().includes(q)));
}
function link(href, txt){ return href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(txt)}</a>` : ""; }
function det(r){
  return `<tr class="det"><td colspan="5"><dl>
  <dt>Course description</dt><dd>${esc(r.de)}</dd>
  <dt>Work processes covered</dt><dd>${esc(r.al)}</dd>
  <dt>OpenClassrooms projects</dt><dd>${esc(r.pj)}</dd>
  <dt>Credit recommendation</dt><dd>${esc(r.cr)}</dd>
  <dt>Exhibit</dt><dd>${esc(r.ei)}${r.et && r.et!=="None" ? " · "+esc(r.et) : ""}</dd>
  <dt>Discipline</dt><dd>${esc(r.di)}${r.dv ? " (from the TOP code; verify)" : ""}</dd>
  <dt>Units · status</dt><dd>${esc(r.u)} units · ${esc(r.ac)}${r.s==="E" ? " · MAP: "+esc(r.ms) : ""}</dd>
  ${r.via && r.s==="P" ? `<dt>Already accepts CPL for</dt><dd>${esc(r.via)}</dd>` : ""}
  <dt>Notes</dt><dd>${esc(r.n)}</dd>
  <dt>Verify</dt><dd class="links">${link(r.cat,"College catalog")}${link("https://coci2.ccctechcenter.net/courses","COCI course search"+(r.ctrl?" ("+r.ctrl+")":""))}${r.s==="E"?link("https://map.rccd.edu/cpllandingpages/","MAP CPL pages"):""}</dd>
  </dl></td></tr>`;
}
function render(){
  const rs = filt();
  $("count").textContent = `${rs.length.toLocaleString()} of ${D.length.toLocaleString()} rows · ${new Set(rs.map(r=>r.c)).size} colleges`;
  $("tb").innerHTML = rs.slice(0, shown).map((r,i) => {
    const k = r.c+"|"+r.id+"|"+r.ei;
    const row = `<tr class="row${r.s==="E"?" ex":""}" tabindex="0" aria-expanded="${open.has(k)}" data-k="${esc(k)}">
      <td><b>${esc(r.c)}</b><div class="sub">${esc(r.g)}</div></td>
      <td><b>${esc(r.id)}</b> ${esc(r.t)}<div class="sub">${esc(r.u)} units${r.via&&r.s==="P"?" · already accepts CPL":""}</div></td>
      <td class="hide-sm">${esc(r.s==="E" ? r.cr : r.la)}<div class="sub">${esc(r.s==="E" ? r.et : "No MAP exhibit yet")}</div></td>
      <td><span class="chip p-${r.m}">${SN[r.m]}</span></td>
      <td><span class="chip c-${r.s}">${r.s==="E"?"Approved":"Potential"}</span></td></tr>`;
    return row + (open.has(k) ? det(r) : "");
  }).join("") || `<tr><td colspan="5">No rows match these filters. Clear a filter to see more.</td></tr>`;
  $("more").hidden = rs.length <= shown;
}
function toggle(tr){ const k=tr.dataset.k; open.has(k)?open.delete(k):open.add(k); render(); }
$("tb").addEventListener("click", ev => { const tr=ev.target.closest("tr.row"); if(tr && !ev.target.closest("a")) toggle(tr); });
$("tb").addEventListener("keydown", ev => { const tr=ev.target.closest("tr.row"); if(tr && (ev.key==="Enter"||ev.key===" ")){ev.preventDefault(); toggle(tr);} });
["f-status","f-str","f-reg","f-col","f-dis","f-lens","f-q"].forEach(id => $(id).addEventListener("input", () => { shown=100; render(); }));
$("more").addEventListener("click", () => { shown += 100; render(); });
$("reset").addEventListener("click", () => { ["f-status","f-str","f-reg","f-col","f-dis","f-lens","f-q"].forEach(id => $(id).value=""); shown=100; open.clear(); render(); });
render();
</script>
"""

if __name__ == "__main__":
    main()
