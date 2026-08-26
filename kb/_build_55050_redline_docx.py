#!/usr/bin/env python3
"""Build a Word .docx of Title 5 §55050 with REAL tracked changes (w:ins / w:del).

Baseline: §55050 as it reads after the 2026-08-12 final revised reg text
("Final Revisions to Title 5 … Credit for Prior Learning and High School Course
Articulation"), i.e. docs/reference/statute/t5_55050_clean_after_2026-08-12.txt.

v2 (2026-08-26) consolidates BOTH rounds into ONE redline against that baseline,
so the Chancellor's Office sees a single delta from the adopted section rather
than a conversation. It carries Sam's five rulings of 2026-08-26:
  1. (m) gender/race-ethnicity RESTORED, alongside his new categories.
  2. (b) keeps the Article 9 documents list (his call) — repaired, see below.
  3. "evaluation of authenticated competencies" RESTORED.
  4. Cal-GETC NOT restored: he ruled the generic "a local or transfer general
     education area" deliberately open-ended so it cannot go stale.
  5. The independent-institutions clause STAYS, now citing §78093.2(c)(2).

Formatting repairs he asked for ("fix any formatting errors from track changes"):
  · (b) had collided into "...College-Level Examination Program, and
    assessments.evaluation of authenticated competencies, ." — rebuilt as one
    grammatical list, with "credit by examination" restored since the section
    devotes (i) and (k) to it.
  · (c) lost its connector when ", and only" went, leaving a run-on.
  · (e) kept a stray comma after "a student".
  · (m) had "population, (military" and "race/ethnicity including".

Two things he did not rule on, done here and easy to reverse:
  · Adopted (l) (academic-record annotation) RESTORED; the new grading clause
    moves to (o). §88782(a)(1) makes credit for prior learning a named input to
    the Career Passport, and (n) reciprocity needs a receiving college to be able
    to SEE that credit was awarded by prior learning. It was the only place the
    package deleted a duty.
  · (c) gains the fourth recommendation source created by §75013(b).

⚠ Word's own track-changes markup is used (w:ins / w:del), not styled text, so
Sam can Accept/Reject each change in Word. Source of record for the baseline is
docs/reference/statute/t5_55050_55051_final_reg_text_2026-08-12.txt.

Run:  python3 kb/_build_55050_redline_docx.py
Out:  exports/20260826_T5_55050_Article9_Conformity_TrackedChanges.docx
"""
import os, zipfile, html

AUTHOR = "CPL Initiative — Article 9 conformity"
DATE = "2026-08-26T00:00:00Z"
OUT = "exports/20260826_T5_55050_Article9_Conformity_TrackedChanges_v3.docx"

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
    ("em", "Baseline: § 55050 as revised by the final reg text of August 12, 2026, with the "
           "strikethrough text removed. Tracked changes are the proposed Article 9 conformity "
           "amendments. Rejecting every change reproduces the adopted section exactly. "
           "No existing subdivision is re-lettered — § 55051(d) cross-references § 55050(i) — "
           "so new material is appended as (n) and (o).")],
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
          "policies"),
    ("i", " and procedures"),
    ("p", " pertaining to credit for prior learning. The policies"),
    ("i", " and procedures"),
    ("p", " developed pursuant to subdivision (a) shall be transparent and accessible to all "
          "stakeholders"),
    ("d", ","),
    ("p", " and published at minimum in college catalogs"),
    ("i", " and on the district's or college's public internet website"),
    ("p", ". Procedures for students to attain credit for prior learning shall include, but not "
          "be limited to, credit by examination, "),
    ("d", "evaluation of Joint Services Transcripts, "),
    ("p", "evaluation of authenticated competencies, "),
    ("d", "student-created portfolios, evaluation of industry-recognized certifications and "
          "documented trainings, and standardized examinations."),
    ("i", "and evaluation of Joint Services Transcripts for veterans, reservists, and active duty "
          "members of the Armed Forces of the United States, industry-recognized credentials of "
          "working learners and apprentices, portfolios for self-directed and experiential "
          "learners, and standardized assessments, including, but not limited to, advanced "
          "placement, international baccalaureate, and College-Level Examination Program "
          "assessments."),
    ("i", " The policies and procedures shall further:"),
]))
P.append(para([("i", "(1) Provide a means for the public to explore faculty-approved credit for prior "
                     "learning opportunities associated with specific prior learning experiences and "
                     "with college courses or program requirements listed on program pathways;")], indent=720))
P.append(para([("i", "(2) Provide a means for admitted or registered students to submit requests for "
                     "timely and documented review and determination of their documented prior learning "
                     "prior to "
                     "selecting a program of study;")], indent=720))
P.append(para([("i", "(3) Provide a process to identify and notify students who may qualify for credit "
                     "for prior learning, including during the college exploration and admission "
                     "process; and")], indent=720))
P.append(para([("i", "(4) Utilize the Chancellor's Office systemwide credit for prior learning "
                     "infrastructure (the Mapping Articulated Pathways platform referenced in "
                     "Education Code section 88782(b)) to facilitate credit for prior learning "
                     "procedures, documentation of credit for prior learning opportunities, and "
                     "maintain student credit for prior learning records, ensuring that credit for "
                     "prior learning opportunities are made available on related Chancellor's "
                     "Office, intersegmental, and agency partner systems, and to the extent "
                     "feasible, made available to interested independent institutions of higher "
                     "education.")], indent=720))

# (c) — AMENDED
P.append(para([
    ("p", "(c) Credit may be awarded for prior experience or prior learning "),
    ("d", "only "),
    ("p", "for individually identified courses with subject matter similar to that of the "
          "individual's prior learning"),
    ("d", ", and only for"),
    ("i", ", and may be applied to"),
    ("p", " a course listed in the catalog of the community college"),
    ("i", ", a local or transfer general education area, or degree-applicable elective credit"),
    ("p", ". Colleges shall"),
    ("i", " at a minimum"),
    ("p", " consider the credit recommendations "),
    ("d", "of the American Council on Education pursuant to Education Code section 66025.71"),
    ("i", "developed by the American Council on Education pursuant to Education Code section "
          "66025.71, by California Community Colleges faculty discipline review groups supported "
          "pursuant to Education Code section 78093.2(a)(3), by the Chancellor's Office in "
          "partnership with the Academic Senate for California Community Colleges pursuant to "
          "Education Code section 75013(b), and by local discipline faculty experts, as documented "
          "in detailed exhibits for faculty credit evaluation"),
    ("p", ". "),
    ("d", "Upon a student's demonstration of sufficient mastery through an examination or "
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
    ("p", "a student"),
    ("d", ", as a component of their educational planning process pursuant to California Education "
          "Code section 78212,"),
    ("p", " be advised of credit for prior learning opportunities and referred to the college's "
          "appropriate authority for assessment of prior learning."),
    ("i", " For purposes of this subdivision, prior learning documents and credentials include, but "
          "are not limited to, Joint Services Transcripts for veterans, reservists, and active duty "
          "members of the Armed Forces of the United States, industry-recognized credentials of "
          "working learners and apprentices, portfolios for self-directed and experiential learners, "
          "and standardized assessments, including advanced placement, international baccalaureate, "
          "and College-Level Examination Program assessments."),
]))

# (f)-(h) — unchanged
for t in [
 "(f) The governing board may grant credit to any student who satisfactorily passes an assessment "
 "approved or conducted by proper authorities of the college. For purposes of this section, "
 "\u201cassessment\u201d means the process that faculty undertake with a student to ensure the student "
 "demonstrates sufficient mastery of the course outcomes as set forth in the course outline of "
 "record. \u201cSufficient mastery\u201d means having attained a level of knowledge, skill, and information "
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
]:
    P.append(para([("p", t)]))

# (i) — AMENDED
P.append(para([
    ("p", "(i) Credit by Examination: The determination to offer credit by examination rests solely "),
    ("d", "on"), ("i", "at"),
    ("p", " the discretion of the discipline faculty. "),
    ("d", "A separate examination shall be conducted for each course for which credit is to be "
          "granted. "),
    ("p", "Credit may be granted "),
    ("d", "only to a student who is registered at the college and in good standing and "),
    ("p", "only for a course listed in the catalog of the community college."),
]))

# (j) — AMENDED
P.append(para([
    ("p", "(j) Grading"),
    ("i", " for credit by examination"),
    ("p", " shall be according to the regular grading system approved by the governing board "
          "pursuant to section 55023, except that students shall be offered a \u201cpass-no pass\u201d option "
          "if that option is ordinarily available for the course."),
]))

# (k), (l) — unchanged.  (l) is RESTORED: see the module docstring.
P.append(para([("p", "(k) A district may charge a student a fee for administering an examination "
                     "pursuant to this section, provided the fee does not exceed the enrollment fee "
                     "which would be associated with enrollment in the course for which the student "
                     "seeks credit by examination.")]))
P.append(para([("p", "(l) The student's academic record shall be clearly annotated to reflect that "
                     "credit was earned through an alternative method of assessment for prior "
                     "learning.")]))

# (m) — AMENDED
P.append(para([
    ("p", "(m) The governing board of each community college district shall review the credit for "
          "prior learning policies every three years and report findings to the Chancellor's Office. "
          "Findings shall include data disaggregated by "),
    ("i", "credit for prior learning type, student population (military, working adult, apprentice "
          "or journeyperson, high school, noncredit and not-for-credit), "),
    ("p", "gender"),
    ("i", ","),
    ("p", " and race/ethnicity"),
    ("i", ","),
    ("p", " including the number of students who "),
    ("i", "were eligible for and "),
    ("p", "received credit for prior learning, the "),
    ("i", "average "),
    ("p", "number of credits awarded per student, retention and persistence rates of students "
          "earning credit for prior learning, completion data (for certificate, degree, and "
          "transfer) for students earning credit for prior learning, and qualitative assessments by "
          "students of the policies and procedures."),
]))

# (n), (o) — NEW
P.append(para([
    ("i", "(n) Credit for prior learning transcribed by another California Community College shall "
          "be accepted as credit, including for program requirements, general education (local and "
          "transfer), transfer requirements, and major preparation. A district shall not require a "
          "student to repeat an assessment of prior learning that another California Community "
          "College has assessed and transcribed for an equivalent course, local degree requirement, "
          "or general education course or area."),
]))
P.append(para([
    ("i", "(o) Grading for all types of credit for prior learning other than credit by examination "
          "shall be according to the regular grading system approved by the governing board pursuant "
          "to section 55023, except that students shall be offered a \u201ccredit\u201d option."),
]))

# NOTE
P.append(para([
    ("p", "NOTE: Authority cited: Sections 66025.71, 66700"),
    ("d", " and"), ("i", ","), ("p", " 70901"),
    ("i", ", and 78093.2"),
    ("p", ", Education Code. Reference: Sections 70901, 70902,"),
    ("i", " 75013, 78093, 78093.1, 78093.2,"),
    ("p", " and 88782, Education Code."),
], space_after=240))

P.append(para([("em",
    "Drafting notes. (1) New material is appended as (n) and (o) rather than inserted, so that no "
    "existing subdivision is re-lettered and \u00a7 55051(d)'s cross-reference to \u00a7 55050(i) is "
    "preserved. (2) Four clauses go beyond restating the statute and are identified as such: "
    "\u201cshall at a minimum consider\u201d in (c), which rests on Education Code \u00a7 78093.2(a)(3) "
    "(permissive as to adoption) and on \u00a7 75013(b), under which the recommendations are mandatory, "
    "systemwide-uniform, and colleges are strongly encouraged to award consistent with them; the "
    "second sentence of (n), addressing re-adjudication, on which \u00a7 78093.2(b)(2) is silent; the "
    "extension of (n) to program requirements, which \u00a7 78093.2(b)(2) does not name (it lists general "
    "education, transfer, and major preparation) and which rests instead on \u00a7 75013(b)'s per-program "
    "credit recommendations; and the amendments to (i), which remove the separate-examination and "
    "registration requirements and are policy rather than conformity. (3) The Reference citation to "
    "\u00a7 88782 is confirmed: Education Code \u00a7 88782 is the California Career Passport Program (added "
    "by Stats. 2025, Ch. 9, Sec. 13 (AB 123)); the November 2025 proposal's citation to "
    "\u00a7 88792(b)(1) was a transposition. (4) \u00a7 75013 is added to Reference: its subdivision (b), "
    "enacted by the same chapter as Article 9 (Stats. 2026, Ch. 79), places a Credit for Prior "
    "Learning Initiative duty on the Chancellor's Office outside Article 9. (5) (c) deliberately "
    "names no general education framework, so the subdivision does not go stale if Cal-GETC is "
    "superseded. (6) The academic-record annotation in (l) is retained: Education Code "
    "\u00a7 78093.2(b)(2) obliges a campus to accept credit that has been transcribed AS credit for prior "
    "learning, and \u00a7 88782(a)(1) makes credit for prior learning a displayed component of the "
    "California Career Passport \u2014 both depend on the award being identifiable.")],
    space_after=0))

DOC = ("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
 "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">"
 "<w:body>" + "".join(P) +
 "<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
 "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/></w:sectPr>"
 "</w:body></w:document>")

CT = ("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
 "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
 "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
 "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
 "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument."
 "wordprocessingml.document.main+xml\"/></Types>")

RELS = ("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
 "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
 "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/"
 "officeDocument\" Target=\"word/document.xml\"/></Relationships>")

os.makedirs("exports", exist_ok=True)
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", CT)
    z.writestr("_rels/.rels", RELS)
    z.writestr("word/document.xml", DOC)

print(f"wrote {OUT}")
print(f"  tracked insertions: {DOC.count('<w:ins ')}")
print(f"  tracked deletions:  {DOC.count('<w:del ')}")
print(f"  size: {os.path.getsize(OUT):,} bytes")
