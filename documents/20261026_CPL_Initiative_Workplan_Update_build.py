"""Build the CPL Initiative Workplan Update (Accomplishments - November 2026) as a Word
document, formatted the same as the May 2026 accomplishments report it updates.

usage: python3 -I 20261026_CPL_Initiative_Workplan_Update_build.py SRC_DOCX OUT_DOCX

SRC_DOCX is the May 2026 report the update is written against, the Library record's
source: "(november 2026) cpl-workplan-accomplishments.docx", Google Drive file
1sZlIHNv72WjFHuHQydw2nNeeiPAq7xiA (added by Sam, 2026-10-26). The script keeps its
title, styles, Vision 2030 paragraph, footers and contributors, and replaces the
period, the executive summary and the four activities' bullets with the text below.

Library record: cpl-initiative-workplan-update-mvpvigf6.

Sources for the text (read 2026-10-26):
  - COBI Activities updates: Supabase item_updates, every row posted since the May
    report (activity 1-3; projects 1.1 to 4.8), and workplan_goals for the 2026-27 goals.
  - The MAP CPL Dashboard via live_metrics.json (scraped_at 2026-10-26T18:46Z) and
    fact_sheet_metrics.json (the public CPL Fact Sheet, same timestamp).
  - kpi_history.json for the June 30 statewide exhibit count (132).
"""
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])

PERIOD = "November 2026"

EXECUTIVE_SUMMARY = [
    "Since the May 2026 report, state law has made Credit for Prior Learning (CPL) a "
    "systemwide initiative of the California Community Colleges. SB 135 added Education "
    "Code section 78093, which directs the system to build on the Mapping Articulated "
    "Pathways (MAP) platform so that every college offers CPL. The section lets colleges "
    "award CPL for course, general education, and elective credit toward certificates, "
    "associate degrees, and baccalaureate degrees; requires a college to recognize CPL "
    "that another college has awarded; and makes CPL advisement part of each student’s "
    "education plan. The 2026–27 State Budget provides $7 million in ongoing funding for "
    "CPL Initiative operations and $35 million in one-time funding for college awards tied "
    "to CPL access and completion outcomes. The MAP CPL Dashboard counted 57,776 students "
    "served on October 26, 2026, up from 42,620 in the May report, with 277,000 eligible "
    "CPL units and an estimated $393 million in student savings. The CPL Student Portal is "
    "live, and 105 colleges are now active in the MAP platform.",
    "Faculty leadership and the statewide sprints account for much of this progress. The "
    "faculty discipline workgroups have grown to 13, with the HVAC workgroup concluding in "
    "September 2026, and their leadership is moving to the Academic Senate for California "
    "Community Colleges (ASCCC) through its Pathways to Credit project. MAP’s 164 statewide "
    "exhibits carry 1,274 credit recommendations across 12 program areas, and 67 colleges "
    "have adopted them 1,465 times. The Veterans Sprint added 5,768 Joint Services "
    "Transcripts since May 1, for 29,165 in MAP, and 64 colleges now hold Veteran Star "
    "status. In the Apprenticeship Sprint, AI-assisted course mapping reached 93 to 95 "
    "percent accuracy with human review at Santiago Canyon and American River colleges. The "
    "Twentynine Palms and Copper Mountain College demonstration project hosted its first "
    "Institutional Effectiveness Partnership Initiative (IEPI) team visit on October 9, 2026.",
]

# Added beneath the template's one demonstration project, Credit for Prior Learning.
DEMONSTRATION_PROJECTS = ["Credit for Prior Learning @ Copper Mountain"]

ACTIVITIES = [
    [  # Activity 1: Technology & MAP Platform
        "Released the CPL Student Portal, where a student learns about CPL, builds one CPL "
        "profile, uploads documents once, and sees CPL opportunities across colleges; a "
        "recent release added about 30 enhancements, including college location mapping, a "
        "simpler profile builder, accessibility updates, and petition language aligned with "
        "each college’s CPL Landing Page.",
        "Published Student Portal Quick Start guides for veterans and for Workforce Board "
        "clients.",
        "Delivered MAP improvements across intake and matching, dashboards, notifications, "
        "accessibility, security, bulk data processing, and articulation workflows; the MAP "
        "Exhibit module is in final quality assurance before its production release.",
        "Produced about 33,000 proposed credit recommendations across 115 industry "
        "certifications through the AI certification-to-course matching pilot; its code, "
        "database, algorithm, and documentation are moving from EQS to the CCC Foundation "
        "and the MAP team in a 90-day transition ahead of MAP integration and faculty "
        "validation.",
        "Advanced MAP’s mapping to the Credential Transparency Description Language (CTDL) "
        "to a detailed schema and sample publishing, completed Phase 1 of the Program "
        "Pathways Mapper integration, continued integration with Credential Engine, ACE, "
        "Career Passport, CVC, COCI, and student information system vendors, demonstrated "
        "MAP’s API with N2N, and began local API planning with Chaffey College.",
        "Advanced the California Credential Registry across technical infrastructure, "
        "statewide governance, and user-centered design with the Chancellor’s Office, the "
        "Labor and Workforce Development Agency (LWDA), Credential Engine, and WestEd, now "
        "under contract; the project received COCI course data and began CTDL-aligned "
        "sample publishing.",
        "Built AI-assisted tools for the CPL Initiative’s knowledge base: a workplan "
        "dashboard that tracks each activity against its Vision 2030 targets; Sierra, a "
        "public assistant that answers CPL questions from curated MAP data; and a public "
        "CPL Fact Sheet and CPL Library.",
    ],
    [  # Activity 2: Credit Recommendations & Faculty
        "Grew the faculty discipline workgroups to 13, with the HVAC workgroup concluding in "
        "September 2026; leadership of the workgroups is moving to the ASCCC’s Pathways to "
        "Credit project.",
        "Reached 288 faculty workgroup credit recommendations by June 30, 2026, exceeding "
        "the 2025–26 goal of 200, and extended statewide recommendations to construction "
        "management and HVAC.",
        "Grew MAP’s statewide exhibits from 132 in June to 164, carrying 1,274 credit "
        "recommendations across 12 program areas that 67 colleges have adopted 1,465 times; "
        "MAP holds 14,524 credit recommendations in all for local adoption.",
        "Shared a STAT worksheet with colleges on request that shows how each college’s CPL "
        "offerings align with the statewide credit recommendations, so a college can see "
        "where to expand; MAP also tracks the local exhibits colleges develop in place of "
        "statewide ones.",
        "Renamed the Common Course Crosswalks the Common Course Reference (CCR), an alignment "
        "tool for CPL adoption, and advanced its assembly and curation with SkyView, an "
        "interactive view of systemwide instructional data.",
        "Built Credential Engine competency search and tagging into the MAP Exhibit module, "
        "now in testing; a competency becomes a validated skill when faculty approve the CPL "
        "that carries it.",
    ],
    [  # Activity 3: CPL Students & College Success
        "Served 57,776 students with CPL (29,490 military, 28,381 working adults and other "
        "learners, and 953 apprentices), identified 277,000 eligible CPL units, and "
        "generated an estimated $393 million in student savings and a $1.6 billion 20-year "
        "economic impact (MAP CPL Dashboard, October 26, 2026).",
        "Recorded 84,401 transcribed CPL units and scheduled statewide webinars for Banner, "
        "Colleague, and PeopleSoft colleges, with examples from colleges already "
        "transcribing CPL, to move more of the 193,000 eligible units not yet transcribed "
        "onto student transcripts.",
        "Reached 105 colleges active in the MAP platform, 19 of them leading colleges that "
        "meet at least three of five statewide criteria, past the 2026–27 goal of 60; all "
        "but one college accepted 2025–26 funding and its priorities, and the first of "
        "three target CSU campuses has joined MAP.",
        "Recognized college practice: 64 colleges hold Veteran Star status for uploading "
        "Joint Services Transcripts for at least 75 percent of their enrolled service "
        "members, and the 7th Annual CPL Summit on October 30, 2026, honors 10 more colleges "
        "and their CPL champions, for 13 in all.",
        "Collected 50 student CPL stories toward the 2026–27 goal of 60; with the Student "
        "Portal live, the MAP team can now design and deploy the Student Impact Rate Survey "
        "through it.",
        "Contracted with the RP Group for a mixed-methods study of how CPL affects "
        "certificate and degree completion, comparing CPL recipients with other students "
        "and attending to historically underserved populations; Moreno Valley, Chaffey, and "
        "Cabrillo colleges are documenting their implementation practices with the RP Group.",
        "Moved MIS data reconciliation into active work on source tracking, student-status "
        "rules, bulk-upload validation, and veteran classifications; with data sharing "
        "slower than planned, MAP convened college workgroups on transcription and MIS "
        "reporting, and the MAP CPL Dashboard moves to 2025–26 MIS enrollment figures on "
        "November 1, 2026.",
    ],
    [  # Activity 4: Partnerships, Policy & Scale
        "Added 5,768 Joint Services Transcripts to MAP since May 1, for 29,165 in all, as "
        "the Chancellor’s Office and the Department of War finalize a statewide process to "
        "order transcripts on students’ behalf.",
        "Expanded military CPL: 91 colleges award credit for basic military training, more "
        "than 20 of them as Health and Kinesiology course credit, and 49 colleges have "
        "articulated 1,193 military ACE credit recommendations to 690 college courses.",
        "Advanced the Twentynine Palms and Copper Mountain College demonstration project: "
        "Copper Mountain earned Veteran Star status, articulated 50 ACE credit "
        "recommendations to 22 courses across 11 military pathways, proposed removing credit "
        "by examination fees, and hosted its first IEPI Partnership Resource Team visit on "
        "October 9, 2026.",
        "Advanced the Apprenticeship Sprint toward its 2026–27 targets of 10,000 apprentices "
        "in MAP, 200 CPL exhibits, and 1,000 articulated course sections at 35 colleges; the "
        "N2N and Prism pilot expanded from Santiago Canyon to American River College and "
        "reached 93 to 95 percent course-mapping accuracy with human review.",
        "Completed Phase 1 of the Futuro Health behavioral health CPL project in September "
        "2026, naming five priority colleges and securing an ACE credit recommendation of "
        "three lower-division units for the Human Touch Healthcare program.",
        "Deepened partnerships with 20+ organizations, including LWDA, Career Passport, "
        "Credential Engine, WestEd, the CCC Foundation, N2N Lightleap, and the California "
        "Department of Education, with an emerging data-sharing partnership with ACE and new "
        "work with EMS Corps.",
        "Delivered weekly trainings, office hours, and webinars, including the CPL Counselor "
        "and Coordinator Training, which reached more than 300 attendees; six more colleges "
        "have scheduled department-wide counseling sessions, and 10 of 14 revised Vision "
        "Resource Center CPL modules are final.",
        "Drafted Title 5 section 55050 revisions that carry out Education Code section "
        "78093, now moving through the governance process, and supported the Chancellor’s "
        "Office as it built the two-year funding model for the $35 million that SB 135 ties "
        "to CPL access and completion outcomes.",
    ],
]

# ── the template: the May 2026 report, 39 body paragraphs ────────────────────────────
TEMPLATE_TEXT = {
    0: "CREDIT FOR PRIOR LEARNING WORKPLAN",
    1: "Accomplishments - May 2026",
    2: "Executive Summary",
    8: "Vision 2030 in Action",
    12: "Credit for Prior Learning",
    13: "Progress &amp; Accomplishments",
    14: "Activity 1: Technology &amp; MAP Platform",
    21: "Activity 2: Credit Recommendations &amp; Faculty",
    26: "Activity 3: CPL Students &amp; College Success",
    31: "Activity 4: Partnerships, Policy &amp; Scale",
    37: "Contributors",
}
SECTION_HEADINGS = (2, 8, 13, 37)
ACTIVITY_HEADINGS = (14, 21, 26, 31)

BODY_PPR = ('<w:pPr><w:pStyle w:val="BodyText"/><w:spacing w:before="1"/>'
            '<w:ind w:left="0" w:right="264"/></w:pPr>')
BULLET_PPR = ('<w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/>'
              '<w:numId w:val="1"/></w:numPr><w:tabs><w:tab w:val="left" w:pos="720"/>'
              '</w:tabs><w:spacing w:before="1"/><w:ind w:right="126"/><w:rPr>'
              '<w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/><w:sz w:val="24"/></w:rPr>'
              '</w:pPr>')
SUBTITLE_PPR = '<w:pPr><w:spacing w:before="1"/><w:rPr><w:sz w:val="28"/></w:rPr></w:pPr>'


def run(text, rpr=""):
    return f'<w:r>{rpr}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def para(ppr, text, rpr=""):
    return f"<w:p>{ppr}{run(text, rpr)}</w:p>"


def text_of(p):
    return "".join(re.findall(r"<w:t(?: [^>]*)?>([^<]*)</w:t>", p))


def as_heading(p, level):
    """Give a heading paragraph an outline level (navigation, PDF tags) and keep it with
    the paragraph after it. Its look does not change."""
    ppr = re.search(r"<w:pPr>.*?</w:pPr>", p, flags=re.S).group(0)
    new = ppr
    after = re.search(r"<w:pStyle [^>]*/>", new)
    at = after.end() if after else len("<w:pPr>")
    new = new[:at] + "<w:keepNext/>" + new[at:]
    lvl = f'<w:outlineLvl w:val="{level}"/>'
    new = new.replace("<w:rPr>", lvl + "<w:rPr>", 1) if "<w:rPr>" in new \
        else new.replace("</w:pPr>", lvl + "</w:pPr>")
    return p.replace(ppr, new, 1)


def build_document(xml):
    head, body = xml.split("<w:body>", 1)
    paras = re.findall(r"<w:p[ >].*?</w:p>", body, flags=re.S)
    if len(paras) != 39:
        sys.exit(f"template has {len(paras)} body paragraphs, expected 39: wrong source file?")
    for i, want in TEMPLATE_TEXT.items():
        got = re.sub(r"\s+", " ", text_of(paras[i])).strip()
        if got != want:
            sys.exit(f"template paragraph {i} reads {got!r}, expected {want!r}")
    sect = re.search(r"<w:sectPr [^>]*>(?:(?!<w:sectPr).)*?</w:sectPr>\s*</w:body>",
                     body, flags=re.S).group(0)

    out = [paras[0], para(SUBTITLE_PPR, f"Accomplishments - {PERIOD}",
                          '<w:rPr><w:sz w:val="28"/></w:rPr>')]
    out.append(as_heading(paras[2], 0))
    for n, text in enumerate(EXECUTIVE_SUMMARY):
        if n:
            out.append(paras[4])  # the template's blank line between the two paragraphs
        out.append(para(BODY_PPR, text))
    out += [as_heading(paras[8], 0), paras[9], paras[10], as_heading(paras[11], 1), paras[12]]
    project_ppr = re.search(r"<w:pPr>.*?</w:pPr>", paras[12], flags=re.S).group(0)
    for name in DEMONSTRATION_PROJECTS:
        out.append(para(project_ppr, name, '<w:rPr><w:sz w:val="24"/></w:rPr>'))
    out.append(as_heading(paras[13], 0))
    for heading, bullets in zip(ACTIVITY_HEADINGS, ACTIVITIES):
        out.append(as_heading(paras[heading], 1))
        out += [para(BULLET_PPR, b, '<w:rPr><w:sz w:val="24"/></w:rPr>') for b in bullets]
    out += [as_heading(paras[37], 0), paras[38]]

    # One section: the template's mid-list continuous break (a PDF-conversion artifact)
    # goes, and the last section takes the first page's top margin and numbers from 1.
    sect = re.sub(r'w:top="\d+"', 'w:top="1600"', sect)
    sect = sect.replace("<w:cols ", '<w:pgNumType w:start="1"/><w:cols ', 1)
    return head + "<w:body>" + "".join(out) + sect + "</w:document>"


def page_field(m):
    rpr = m.group(1)
    r = lambda inner: f"<w:r>{rpr}{inner}</w:r>"
    return (r('<w:fldChar w:fldCharType="begin"/>')
            + r('<w:instrText xml:space="preserve"> PAGE </w:instrText>')
            + r('<w:fldChar w:fldCharType="separate"/>') + r("<w:t>1</w:t>")
            + r('<w:fldChar w:fldCharType="end"/>'))


DATE_BOX_EMU = 1005840  # 1.1 in, room for "November 2026"; the template's box held "May 2026"


def widen_date_box(m):
    """Widen the footer's date text box leftward, keeping its right edge on the margin,
    and right-align the date in it (DrawingML and its VML fallback alike)."""
    seg = m.group(0)
    if "<w:t>May</w:t>" not in seg:
        return seg
    if seg.startswith("<wp:anchor"):
        width = int(re.search(r'<wp:extent cx="(\d+)"', seg).group(1))
        seg = re.sub(r'(<wp:positionH relativeFrom="page"><wp:posOffset>)(\d+)',
                     lambda p: p.group(1) + str(int(p.group(2)) + width - DATE_BOX_EMU), seg)
        seg = seg.replace(f'cx="{width}"', f'cx="{DATE_BOX_EMU}"')
    else:
        pt = DATE_BOX_EMU / 12700
        width = float(re.search(r"width:([\d.]+)pt", seg).group(1))
        seg = re.sub(r"margin-left:([\d.]+)pt",
                     lambda p: f"margin-left:{float(p.group(1)) + width - pt:.2f}pt", seg, count=1)
        seg = re.sub(r"width:[\d.]+pt", f"width:{pt:.2f}pt", seg, count=1)
    return seg.replace('<w:ind w:left="20"/>', '<w:ind w:left="20"/><w:jc w:val="right"/>')


def build_footer(xml):
    # The template typed each page number ("1", "2"); a PAGE field numbers every page.
    xml, n = re.subn(r"<w:r>(<w:rPr>(?:(?!</w:rPr>|<w:r>).)*</w:rPr>)<w:t>[12]</w:t></w:r>",
                     page_field, xml, flags=re.S)
    if not n:
        sys.exit("footer: no page number found")
    xml = re.sub(r"<wp:anchor .*?</wp:anchor>|<v:shape .*?</v:shape>", widen_date_box, xml,
                 flags=re.S)
    xml = xml.replace("<w:t>May</w:t>", f"<w:t>{PERIOD.split()[0]}</w:t>")
    # The Chancellor's Office accessibility stamp of 5/18/26 belonged to the May report.
    xml = xml.replace("<w:t>A11Y</w:t>", "<w:t></w:t>").replace(
        "<w:t>5/18/26</w:t>", "<w:t></w:t>")
    return xml


def build_core(xml):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    xml = re.sub(r"<dc:title>.*?</dc:title>",
                 f"<dc:title>CREDIT FOR PRIOR LEARNING WORKPLAN Accomplishments - {PERIOD}"
                 "</dc:title>", xml)
    return re.sub(r'(<dcterms:modified [^>]*>).*?(</dcterms:modified>)',
                  lambda m: m.group(1) + now + m.group(2), xml)


EDITS = {
    "word/document.xml": build_document,
    "word/footer1.xml": build_footer,
    "word/footer2.xml": build_footer,
    "docProps/core.xml": build_core,
}

with zipfile.ZipFile(SRC) as zin, zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename in EDITS:
            data = EDITS[item.filename](data.decode("utf-8")).encode("utf-8")
        zout.writestr(item, data)
print(f"wrote {OUT}")
