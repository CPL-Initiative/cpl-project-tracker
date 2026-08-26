#!/usr/bin/env python3
"""Build a Word .docx of Title 5 §55050 with REAL tracked changes (w:ins / w:del).

Baseline: §55050 as it reads after the 2026-08-12 final revised reg text
("Final Revisions to Title 5 … Credit for Prior Learning and High School Course
Articulation"). Tracked changes on top of that baseline are the Tier 1
Article 9 conformity amendments — see docs/t5_55050_amendment_package_draft.md.

⚠ Word's own track-changes markup is used (w:ins / w:del), not styled text, so
Sam can Accept/Reject each change in Word. Source of record for the baseline is
docs/reference/statute/t5_55050_55051_final_reg_text_2026-08-12.txt.

Run:  python3 kb/_build_55050_redline_docx.py
Out:  exports/20260826_T5_55050_Article9_Conformity_TrackedChanges.docx
"""
import os, zipfile, html

AUTHOR = "CPL Initiative — Article 9 conformity"
DATE = "2026-08-26T00:00:00Z"
OUT = "exports/20260826_T5_55050_Article9_Conformity_TrackedChanges.docx"

_id = [100]
def nid():
    _id[0] += 1
    return _id[0]

def esc(t):
    return html.escape(t, quote=False)

def run(t, bold=False, italic=False):
    rpr = ""
    if bold or italic:
        rpr = "<w:rPr>" + ("<w:b/>" if bold else "") + ("<w:i/>" if italic else "") + "</w:rPr>"
    return f'<w:r>{rpr}<w:t xml:space="preserve">{esc(t)}</w:t></w:r>'

def ins(t):
    return (f'<w:ins w:id="{nid()}" w:author="{esc(AUTHOR)}" w:date="{DATE}">'
            f'<w:r><w:t xml:space="preserve">{esc(t)}</w:t></w:r></w:ins>')

def dele(t):
    return (f'<w:del w:id="{nid()}" w:author="{esc(AUTHOR)}" w:date="{DATE}">'
            f'<w:r><w:delText xml:space="preserve">{esc(t)}</w:delText></w:r></w:del>')

def para(parts, style=None, space_after=160, indent=None):
    """parts: list of ('p'|'i'|'d'|'b'|'em', text)."""
    body = ""
    for kind, text in parts:
        if kind == "p":  body += run(text)
        elif kind == "b": body += run(text, bold=True)
        elif kind == "em": body += run(text, italic=True)
        elif kind == "i": body += ins(text)
        elif kind == "d": body += dele(text)
    ppr = "<w:pPr>"
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if indent: ppr += f'<w:ind w:left="{indent}"/>'
    ppr += f'<w:spacing w:after="{space_after}"/></w:pPr>'
    return f"<w:p>{ppr}{body}</w:p>"

# ── the document ──────────────────────────────────────────────────────────────
P = []
P.append(para([("b", "Proposed Amendments to Title 5, California Code of Regulations")], space_after=60))
P.append(para([("b", "Credit for Prior Learning — Conformity with Education Code Article 9")], space_after=200))

P.append(para([
    ("em", "Baseline: § 55050 as revised by the final reg text of August 12, 2026. "
           "Tracked changes are the proposed Article 9 conformity amendments. "
           "Underlined/colored text denotes additions; struck text denotes deletions. "
           "No subdivision is re-lettered: § 55051(d) cross-references § 55050(i).")],
    space_after=240))

P.append(para([("b", "SECTION 55050 OF ARTICLE 5 OF SUBCHAPTER 1 OF CHAPTER 6 OF DIVISION 6 OF "
                     "TITLE 5 OF THE CALIFORNIA CODE OF REGULATIONS IS AMENDED TO READ:")],
              space_after=200))
P.append(para([("b", "§ 55050. Credit for Prior Learning.")], space_after=160))

# (a) — unchanged
P.append(para([("p", "(a) The governing board of each community college district shall adopt "
                     "comprehensive policies for awarding credit for prior learning.")]))

# (b) — AMENDED
P.append(para([
    ("p", "(b) The governing board of each community college district shall adopt and publish "
          "policies pertaining to credit for prior learning. The policies developed pursuant to "
          "subdivision (a) shall be transparent and accessible to all stakeholders, and published "
          "at minimum in college catalogs"),
    ("i", " and on the district's or college's public internet website"),
    ("p", ". Procedures for students to attain credit for prior learning shall include, but not be "
          "limited to, credit by examination, evaluation of Joint Services Transcripts, evaluation "
          "of authenticated competencies, student-created portfolios, evaluation of "
          "industry-recognized certifications and documented trainings, and standardized "
          "examinations."),
    ("i", " The policies shall further:"),
]))
P.append(para([("i", "(1) Provide a means for the public to explore faculty-approved credit for prior "
                     "learning opportunities associated with specific prior learning experiences and "
                     "with college courses listed on program pathways;")], indent=720))
P.append(para([("i", "(2) Provide a means for admitted or registered students to submit requests for "
                     "timely review of their documented prior learning prior to selecting a program "
                     "of study;")], indent=720))
P.append(para([("i", "(3) Provide a process to identify and notify students who may qualify for credit "
                     "for prior learning, including during the college exploration and admission "
                     "process; and")], indent=720))
P.append(para([("i", "(4) Utilize the Chancellor's Office systemwide credit for prior learning "
                     "infrastructure, or supply regular and frequent updates of required data to that "
                     "infrastructure, for reporting and to make credit for prior learning "
                     "opportunities available on related Chancellor's Office, intersegmental, and "
                     "agency partner systems.")], indent=720))

# (c) — AMENDED
P.append(para([
    ("p", "(c) Credit may be awarded for prior experience or prior learning only for individually "
          "identified courses with subject matter similar to that of the individual's prior "
          "learning, and only for a course listed in the catalog of the community college. Colleges "
          "shall"),
    ("i", " at a minimum"),
    ("p", " consider the credit recommendations "),
    ("d", "of the American Council on Education pursuant to Education Code section 66025.71"),
    ("i", "developed by the American Council on Education pursuant to Education Code section "
          "66025.71, by California Community Colleges faculty discipline review groups supported "
          "pursuant to Education Code section 78093.2(a)(3), and by local discipline faculty "
          "experts, as documented in detailed exhibits for faculty credit evaluation"),
    ("p", ". Upon a student's demonstration of sufficient mastery through an examination or "
          "assessment, an award of credit should be made, if possible, to the California General "
          "Education Transfer Curriculum (Cal-GETC) and local community college general education "
          "requirements or requirements for a student's chosen program. Award of credit may be made "
          "to electives for students who do not require additional general education or program "
          "credits to meet their goals."),
]))

# (d) — unchanged
P.append(para([("p", "(d) Units for which credit is awarded pursuant to the provisions of this section "
                     "may be counted in determining the 12 semester hours of credit in residence "
                     "required for an associate degree.")]))

# (e) — AMENDED
P.append(para([
    ("p", "(e) The policies adopted by the governing board of a community college district pursuant "
          "to this section shall require that "),
    ("i", "the prior learning documents and credentials of all incoming students be evaluated for "
          "the assessment and award of credit for prior learning before or upon completion of the "
          "education plan pursuant to Education Code section 78212, and that "),
    ("p", "a student, "),
    ("d", "as a component of their educational planning process pursuant to California Education "
          "Code section 78212, "),
    ("p", "be advised of credit for prior learning opportunities and referred to the college's "
          "appropriate authority for assessment of prior learning."),
    ("i", " For purposes of this subdivision, prior learning documents and credentials include, but "
          "are not limited to, Joint Services Transcripts for veterans, reservists, and active duty "
          "members of the Armed Forces of the United States, industry-recognized credentials of "
          "working learners and apprentices, portfolios for self-directed and experiential learners, "
          "and standardized assessments, including advanced placement, international baccalaureate, "
          "and College-Level Examination Program assessments."),
]))

# (f)-(m) — unchanged
UNCHANGED = [
 "(f) The governing board may grant credit to any student who satisfactorily passes an assessment "
 "approved or conducted by proper authorities of the college. For purposes of this section, "
 "“assessment” means the process that faculty undertake with a student to ensure the student "
 "demonstrates sufficient mastery of the course outcomes as set forth in the course outline of "
 "record. “Sufficient mastery” means having attained a level of knowledge, skill, and information "
 "equivalent to that demonstrated generally by students who receive the minimum passing grade in "
 "the course.",
 "(g) The policies for assessments adopted by the governing board of a community college district "
 "shall offer students an opportunity to accept, decline, or appeal decisions related to the award "
 "of credit, and in cases of credit by examination, pursuant to sections 55021 and 55025.",
 "(h) The nature and content of the assessment shall be determined solely by faculty in the "
 "discipline who normally teach the course for which credit is to be granted in accordance with "
 "policies and procedures approved by the curriculum committee established pursuant to section "
 "55002. The faculty shall determine that the assessment adequately measures mastery of the course "
 "content as set forth in the course outline of record. The faculty may accept an assessment "
 "conducted or proctored at a location other than the community college for this purpose.",
 "(i) Credit by Examination: The determination to offer credit by examination rests solely on the "
 "discretion of the discipline faculty. A separate examination shall be conducted for each course "
 "for which credit is to be granted. Credit may be granted only to a student who is registered at "
 "the college and in good standing and only for a course listed in the catalog of the community "
 "college.",
 "(j) Grading shall be according to the regular grading system approved by the governing board "
 "pursuant to section 55023, except that students shall be offered a “pass-no pass” option if that "
 "option is ordinarily available for the course.",
 "(k) A district may charge a student a fee for administering an examination pursuant to this "
 "section, provided the fee does not exceed the enrollment fee which would be associated with "
 "enrollment in the course for which the student seeks credit by examination.",
 "(l) The student's academic record shall be clearly annotated to reflect that credit was earned "
 "through an alternative method of assessment for prior learning.",
 "(m) The governing board of each community college district shall review the credit for prior "
 "learning policies every three years and report findings to the Chancellor's Office. Findings "
 "shall include data disaggregated by gender and race/ethnicity including the number of students "
 "who received credit for prior learning, the number of credits awarded per student, retention and "
 "persistence rates of students earning credit for prior learning, completion data (for "
 "certificate, degree, and transfer) for students earning credit for prior learning, and "
 "qualitative assessments by students of the policies and procedures.",
]
for t in UNCHANGED:
    P.append(para([("p", t)]))

# (n) — NEW
P.append(para([
    ("i", "(n) Credit for prior learning transcribed by another California Community College shall "
          "be accepted as credit, including for general education, transfer, and major preparation. "
          "A district shall not require a student to repeat an assessment of prior learning that "
          "another California Community College has assessed and transcribed."),
]))

# NOTE
P.append(para([
    ("p", "NOTE: Authority cited: Sections 66025.71, 66700"),
    ("d", " and"), ("i", ","), ("p", " 70901"),
    ("i", ", and 78093.2"),
    ("p", ", Education Code. Reference: Sections 70901, 70902,"),
    ("i", " 78093, 78093.1, 78093.2,"),
    ("p", " and 88782, Education Code."),
], space_after=240))

P.append(para([("em", "Drafting notes. (1) The new subdivision is appended as (n) rather than "
                      "inserted, so that no existing subdivision is re-lettered and § 55051(d)'s "
                      "cross-reference to § 55050(i) is preserved. (2) Two clauses go beyond "
                      "restating the statute and are identified as such: “shall consider” in (c) "
                      "rests on Education Code § 78093.2(a)(3), which is permissive as to adoption; "
                      "and the second sentence of (n) addresses re-adjudication, on which "
                      "§ 78093.2(b)(2) is silent. (3) The Reference citation to § 88782 is carried "
                      "from the August 2026 text and has not been verified against the Education "
                      "Code; the November 2025 proposal cites § 88792(b)(1).")]))

DOC = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
       '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
       '<w:body>' + "".join(P) +
       '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
       '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>'
       '</w:body></w:document>')

CT = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      '</Types>')

RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '</Relationships>')

os.makedirs("exports", exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("_rels/.rels", RELS)
    z.writestr("word/document.xml", DOC)

ins_n = DOC.count("<w:ins ")
del_n = DOC.count("<w:del ")
print(f"wrote {OUT}")
print(f"  tracked insertions: {ins_n}")
print(f"  tracked deletions:  {del_n}")
print(f"  size: {os.path.getsize(OUT):,} bytes")
