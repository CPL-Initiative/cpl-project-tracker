/* TMC Builder — General Education (Breadth) patterns for the full ADT package.
 *
 * STATIC, lazy-loaded by tmc_builder.js (like tmc_templates.js). An ADT =
 * a TMC major (the C-ID course list) + a GE "Breadth" pattern + electives to
 * reach 60 CSU-transferable units. This file holds the GE side: the three
 * patterns a college pairs with ANY TMC major.
 *
 *   - cal-getc   California GE Transfer Curriculum — the SINGLE statewide ADT
 *                GE pattern as of Fall 2025 (AB 928). Replaces IGETC + CSU GE
 *                Breadth. No Language-Other-Than-English requirement.
 *   - igetc      Intersegmental GE Transfer Curriculum — LEGACY (pre-Fall-2025
 *                catalog rights). UC/CSU; keeps the LOTE requirement.
 *   - csu-ge     CSU GE Breadth — LEGACY (pre-Fall-2025 catalog rights). CSU only.
 *
 * The area structures are a DRAFT encoded from public ASCCC / CCC standards
 * (Cal-GETC 2025–26 and the legacy IGETC / CSU GE Breadth patterns) — the
 * official CCCCO Breadth Forms Cloudflare-block automated fetch, so these are
 * flagged draft-for-verification exactly like the 45 TMC majors. Replace with
 * the parsed official forms when uploaded.
 *
 * Slot shape mirrors a TMC slot but with `ge:true` + `noncid:true` (GE areas
 * are college-certified, not C-ID-keyed) so the builder renders a manual course
 * picker (no C-ID auto-match) and treats `units` as a per-course MINIMUM.
 */
window.CPL_TMC_GE_PATTERNS = {
  _meta: {
    draft: true,
    note: "Draft GE Breadth area structures encoded from public ASCCC / California Community Colleges standards (Cal-GETC 2025–26; legacy IGETC & CSU GE Breadth). Verify each against the official CCCCO Breadth Form before submission.",
    source: "https://www.cccco.edu/About-Us/Chancellors-Office/Divisions/Educational-Services-and-Support/What-we-do/Curriculum-and-Instruction-Unit/Templates-For-Approved-Transfer-Model-Curriculum"
  },
  patterns: [
    {
      id: "cal-getc",
      name: "Cal-GETC",
      full: "California General Education Transfer Curriculum",
      legacy: false,
      effective: "Fall 2025",
      status: "draft",
      total_units: "34",
      note: "The single statewide lower-division GE pathway for ADTs as of Fall 2025 (AB 928) — meets CSU and UC transfer admission. Replaces IGETC and CSU GE Breadth. No Language-Other-Than-English requirement. Minimum 34 semester units.",
      sections: [
        { name: "Area 1 — English Communication", select: "all", units: "9", slots: [
          { title: "1A — English Composition", units: "3", ge: true, noncid: true },
          { title: "1B — Critical Thinking & Composition", units: "3", ge: true, noncid: true },
          { title: "1C — Oral Communication", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 2 — Mathematical Concepts & Quantitative Reasoning", select: "all", units: "3", slots: [
          { title: "Mathematics / Quantitative Reasoning", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 3 — Arts & Humanities", select: "all", units: "9", slots: [
          { title: "3A — Arts", units: "3", ge: true, noncid: true },
          { title: "3B — Humanities", units: "3", ge: true, noncid: true },
          { title: "Third course — Arts (3A) or Humanities (3B)", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 4 — Social & Behavioral Sciences", select: "all", units: "6", slots: [
          { title: "Social & Behavioral Sciences — course 1", units: "3", ge: true, noncid: true },
          { title: "Social & Behavioral Sciences — course 2", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 5 — Physical & Biological Sciences", select: "all", units: "7", note: "At least one Area 5 course must include a laboratory (5C).", slots: [
          { title: "5A — Physical Science", units: "3", ge: true, noncid: true },
          { title: "5B — Biological Science", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 6 — Ethnic Studies", select: "all", units: "3", slots: [
          { title: "Ethnic Studies", units: "3", ge: true, noncid: true }
        ]}
      ]
    },
    {
      id: "igetc",
      name: "IGETC (legacy)",
      full: "Intersegmental General Education Transfer Curriculum",
      legacy: true,
      effective: "pre-Fall 2025 catalog rights",
      status: "draft",
      total_units: "37",
      note: "LEGACY — available only to students with continuous catalog rights before Fall 2025. UC & CSU. Area 1C (Oral Communication) applies to the CSU version only; Area 6A (Language Other Than English) is a UC requirement. Verify the exact CSU vs UC version on the official IGETC form.",
      sections: [
        { name: "Area 1 — English Communication", select: "all", units: "9", slots: [
          { title: "1A — English Composition", units: "3", ge: true, noncid: true },
          { title: "1B — Critical Thinking–English Composition", units: "3", ge: true, noncid: true },
          { title: "1C — Oral Communication (CSU only)", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 2 — Mathematical Concepts & Quantitative Reasoning", select: "all", units: "3", slots: [
          { title: "2A — Mathematics / Quantitative Reasoning", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 3 — Arts & Humanities", select: "all", units: "9", note: "At least one course from 3A Arts and one from 3B Humanities.", slots: [
          { title: "3A — Arts", units: "3", ge: true, noncid: true },
          { title: "3B — Humanities", units: "3", ge: true, noncid: true },
          { title: "Third course — Arts (3A) or Humanities (3B)", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 4 — Social & Behavioral Sciences", select: "all", units: "9", note: "Three courses from at least two disciplines.", slots: [
          { title: "Social & Behavioral Sciences — course 1", units: "3", ge: true, noncid: true },
          { title: "Social & Behavioral Sciences — course 2", units: "3", ge: true, noncid: true },
          { title: "Social & Behavioral Sciences — course 3", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 5 — Physical & Biological Sciences", select: "all", units: "7", note: "One physical + one biological; at least one must include a laboratory.", slots: [
          { title: "5A — Physical Science", units: "3", ge: true, noncid: true },
          { title: "5B — Biological Science", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area 6A — Language Other Than English (UC)", select: "all", units: "0", note: "UC requirement — proficiency equivalent to two years of high school in the same language, or a qualifying college course. Not required for CSU.", slots: [
          { title: "Language Other Than English — proficiency / course", units: "0", ge: true, noncid: true }
        ]},
        { name: "Ethnic Studies", select: "all", units: "3", slots: [
          { title: "Ethnic Studies", units: "3", ge: true, noncid: true }
        ]}
      ]
    },
    {
      id: "csu-ge",
      name: "CSU GE Breadth (legacy)",
      full: "CSU General Education Breadth",
      legacy: true,
      effective: "pre-Fall 2025 catalog rights",
      status: "draft",
      total_units: "39",
      note: "LEGACY — available only to students with continuous catalog rights before Fall 2025. CSU only. Lower-division CSU GE Breadth is 39 semester units across Areas A–F. Verify against the official CSU GE Breadth certification form.",
      sections: [
        { name: "Area A — English Language Communication & Critical Thinking", select: "all", units: "9", slots: [
          { title: "A1 — Oral Communication", units: "3", ge: true, noncid: true },
          { title: "A2 — Written Communication", units: "3", ge: true, noncid: true },
          { title: "A3 — Critical Thinking", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area B — Scientific Inquiry & Quantitative Reasoning", select: "all", units: "9", note: "Area B also requires a laboratory activity (B3) tied to B1 or B2.", slots: [
          { title: "B1 — Physical Science", units: "3", ge: true, noncid: true },
          { title: "B2 — Life Science", units: "3", ge: true, noncid: true },
          { title: "B4 — Mathematics / Quantitative Reasoning", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area C — Arts & Humanities", select: "all", units: "9", note: "At least one Arts (C1) and one Humanities (C2).", slots: [
          { title: "C1 — Arts", units: "3", ge: true, noncid: true },
          { title: "C2 — Humanities", units: "3", ge: true, noncid: true },
          { title: "Third course — Arts (C1) or Humanities (C2)", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area D — Social Sciences", select: "all", units: "6", slots: [
          { title: "Social Sciences — course 1", units: "3", ge: true, noncid: true },
          { title: "Social Sciences — course 2", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area E — Lifelong Learning & Self-Development", select: "all", units: "3", slots: [
          { title: "Lifelong Learning & Self-Development", units: "3", ge: true, noncid: true }
        ]},
        { name: "Area F — Ethnic Studies", select: "all", units: "3", slots: [
          { title: "Ethnic Studies", units: "3", ge: true, noncid: true }
        ]}
      ]
    }
  ]
};
