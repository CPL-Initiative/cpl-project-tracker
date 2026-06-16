// TMC Builder — Transfer Model Curriculum templates (the FIXED left-side course
// lists, defined by ASCCC/CSU intersegmental faculty workgroups).
//
// ⚠ DRAFT SEED DATA — faculty/articulation-officer verification required.
// These 8 templates were hand-encoded from the published ADT/TMC structures and
// the authoritative C-ID descriptor list (kb/reference/cid_descriptors.json) so
// the slot C-ID numbers + titles are real, but section groupings, unit ranges,
// and select-counts MUST be checked against the official template on
// https://c-idsystem.org/transfer-efforts before a college relies on a result.
// The C-ID TMC site is the master list of every approved TMC; add the remaining
// disciplines by appending objects to `templates` in this same shape.
//
// Slot shape: { cid, title, units, alts?:[...altCids], noncid?:true, note? }
//   - cid    : C-ID descriptor key, byte-identical to cid_descriptors.json and to
//              the COCI CIDNumber column, so the client auto-matches a college
//              course carrying that C-ID with a plain string compare.
//   - alts   : other C-IDs that also satisfy the slot (e.g. with/without lab).
//   - noncid : true for the "select non-C-ID courses" rows (no C-ID descriptor
//              exists; the college aligns a local course by content + units).
// Section.select: "all" (every slot required) or an integer N (choose N of the
//   listed options — the college fills N of them).
window.CPL_TMC_TEMPLATES = {
  "_meta": {
    "draft": true,
    "generated": "2026-06-16",
    "source": "C-ID TMC templates (c-idsystem.org/transfer-efforts) + kb/reference/cid_descriptors.json",
    "note": "Per-TMC status: 'official' = encoded from the authoritative template; 'draft' = seed (sections present, faculty-verify); 'planned' = in the catalog, not yet encoded. Every TMC links to its official template via _meta.sources[id].",
    "sources": {
      "administration-of-justice": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Administration_of_Justice_TMC_r.pdf",
      "african-american-studies": "https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_African_American_Studies_TMC_v2_r.pdf",
      "agriculture-animal-sciences": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Animal_Sciences_TMC_r.pdf",
      "agriculture-business": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Business_TMC_r.pdf",
      "agriculture-plant-sciences": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Agriculture_Plant_Sciences_TMC_r.pdf",
      "american-indian-studies": "https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_American_Indian_Studies_TMC_r2.pdf",
      "anthropology": "https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Anthropology_TMC_r.pdf",
      "art-history": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Art_History_TMC_r.pdf",
      "asian-american-studies": "https://c-idsystem.org/wp-content/uploads/2025/08/2025_Jun_Asian_American_Studies_TMC_r.pdf",
      "biology": "https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Biology_2-0_-260121_r.pdf",
      "business-administration": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Business_Administration_TMC_r.pdf",
      "chemistry": "https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Chemistry_260121_r.pdf",
      "chicana-o-studies-latina-o-studies": "https://c-idsystem.org/wp-content/uploads/2025/06/2024_Jun_Chicano_Studies_TMC_r.pdf",
      "child-and-adolescent-development": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Child_and_Adolescent_Development_TMC_r.pdf",
      "communication-studies": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Communication_Studies_TMC_r.pdf",
      "computer-science": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Computer_Science_TMC_r.pdf",
      "early-childhood-education": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Early_Chilhood_Education_TMC_r.pdf",
      "economics": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Economics_TMC_r.pdf",
      "elementary-teacher-education-integrated-programs": "https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Elementary_Teacher_Education_Integrated_Programs_TMC_r.pdf",
      "english": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_English_TMC_r.pdf",
      "environmental-science": "https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Environmental_Science_2-0_260121_r.pdf",
      "film-television-and-electronic-media": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Film_Television_and_Electronic_Media_TMC_r.pdf",
      "geography": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Geography_TMC_r.pdf",
      "geology": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Geology_TMC_r.pdf",
      "global-studies": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Global_Studies_TMC_r.pdf",
      "history": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_History_TMC_r.pdf",
      "hospitality-management": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Hospitality_Management_TMC_r.pdf",
      "journalism": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Journalism_TMC_r.pdf",
      "kinesiology": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Kinesiology_TMC_r.pdf",
      "law-public-policy-and-society": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Law_Public_Policy_and_Society_TMC_r.pdf",
      "mathematics": "https://c-idsystem.org/wp-content/uploads/2025/06/2025_Jan_Mathematics_TMC_r.pdf",
      "music": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Music_TMC_r.pdf",
      "music-industry-studies": "https://c-idsystem.org/wp-content/uploads/2026/01/TMC_Music_Industry_Studies_260121_r.pdf",
      "nutrition-and-dietetics": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Nutrition_and_Dietetics_TMC_r.pdf",
      "philosophy": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Philosophy_TMC_r.pdf",
      "physics-2-0": "https://c-idsystem.org/wp-content/uploads/2026/03/2025_Physics_2.0_TMC_03_25_26_r.pdf",
      "political-science": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Political_Science_TMC_r.pdf",
      "psychology": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Psychology_TMC_r.pdf",
      "public-health": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Public_Health_TMC_r.pdf",
      "social-justice-studies": "https://c-idsystem.org/wp-content/uploads/2025/06/2024_Sep_Social_Justice_Studies_TMC_r.pdf",
      "social-work-and-human-services": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Social_Work_and_Human_Services_TMC_r.pdf",
      "sociology": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Sociology_TMC_r.pdf",
      "spanish": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Spanish_TMC_r.pdf",
      "studio-art": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Studio_Art_TMC_r.pdf",
      "theatre-arts": "https://c-idsystem.org/wp-content/uploads/2025/06/2023_Nov_Theatre_Arts_TMC_r.pdf"
    }
  },
  "templates": [
    {
      "id": "psychology",
      "discipline": "Psychology",
      "degree": "AA-T",
      "total_units": 19,
      "version": "draft (cf. Psychology TMC Rev 3)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "9–10", "slots": [
          { "cid": "PSY 110", "title": "Introductory Psychology", "units": "3" },
          { "cid": "PSY 200", "title": "Introduction to Research Methods in Psychology", "units": "3", "alts": ["PSY 205 B"] },
          { "cid": "MATH 110", "title": "Introduction to Statistics", "units": "3–4", "alts": ["SOCI 125"] }
        ]},
        { "name": "List A — select one", "select": 1, "units": "3–4", "slots": [
          { "cid": "PSY 150", "title": "Introduction to Biological Psychology", "units": "3" },
          { "cid": "ANTH 110", "title": "Introduction to Biological Anthropology", "units": "3" },
          { "cid": "", "title": "Introduction to Biology (lower-division)", "units": "3–4", "noncid": true }
        ]},
        { "name": "List B — select one", "select": 1, "units": "3", "slots": [
          { "cid": "PSY 120", "title": "Introduction to Abnormal Psychology", "units": "3" },
          { "cid": "PSY 170", "title": "Introduction to Social Psychology", "units": "3" },
          { "cid": "PSY 180", "title": "Introduction to Lifespan Psychology", "units": "3" },
          { "cid": "PSY 130", "title": "Introduction to Human Sexuality", "units": "3" }
        ]},
        { "name": "List C — select one", "select": 1, "units": "3", "note": "Any List A or List B course not already used.", "slots": [
          { "cid": "PSY 115", "title": "Psychology of Personal and Social Adjustment", "units": "3" },
          { "cid": "PSY 120", "title": "Introduction to Abnormal Psychology", "units": "3" },
          { "cid": "PSY 170", "title": "Introduction to Social Psychology", "units": "3" },
          { "cid": "PSY 180", "title": "Introduction to Lifespan Psychology", "units": "3" }
        ]}
      ]
    },
    {
      "id": "sociology",
      "discipline": "Sociology",
      "degree": "AA-T",
      "total_units": 18,
      "version": "draft (cf. Sociology TMC Rev 3)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "6", "slots": [
          { "cid": "SOCI 110", "title": "Introduction to Sociology", "units": "3" },
          { "cid": "SOCI 120", "title": "Introduction to Research Methods", "units": "3", "alts": ["SOCI 125", "MATH 110"] }
        ]},
        { "name": "List A — select one", "select": 1, "units": "3", "slots": [
          { "cid": "SOCI 115", "title": "Social Problems", "units": "3" },
          { "cid": "SOCI 125", "title": "Introduction to Statistics in Sociology", "units": "3" }
        ]},
        { "name": "List B — select two", "select": 2, "units": "6", "slots": [
          { "cid": "SOCI 130", "title": "Introduction to Marriage and Family", "units": "3" },
          { "cid": "SOCI 140", "title": "Introduction to Gender", "units": "3" },
          { "cid": "SOCI 150", "title": "Introduction to Race and Ethnicity", "units": "3" },
          { "cid": "SOCI 160", "title": "Introduction to Crime", "units": "3" },
          { "cid": "ANTH 120", "title": "Introduction to Cultural Anthropology", "units": "3" }
        ]}
      ]
    },
    {
      "id": "anthropology",
      "discipline": "Anthropology",
      "degree": "AA-T",
      "total_units": 19,
      "version": "draft (cf. Anthropology TMC Rev 3)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "10", "slots": [
          { "cid": "ANTH 110", "title": "Introduction to Biological Anthropology", "units": "3" },
          { "cid": "ANTH 115 L", "title": "Biological Anthropology Laboratory", "units": "1" },
          { "cid": "ANTH 120", "title": "Introduction to Cultural Anthropology", "units": "3" },
          { "cid": "ANTH 150", "title": "Introduction to Archaeology", "units": "3" }
        ]},
        { "name": "List A — select one", "select": 1, "units": "3", "slots": [
          { "cid": "ANTH 130", "title": "Introduction to Linguistic Anthropology", "units": "3" },
          { "cid": "MATH 110", "title": "Introduction to Statistics", "units": "3–4" }
        ]},
        { "name": "List B — select two", "select": 2, "units": "6", "note": "Any ANTH course not already used, or an approved related course.", "slots": [
          { "cid": "ANTH 130", "title": "Introduction to Linguistic Anthropology", "units": "3" },
          { "cid": "SOCI 110", "title": "Introduction to Sociology", "units": "3" },
          { "cid": "", "title": "Approved Anthropology elective (lower-division)", "units": "3", "noncid": true }
        ]}
      ]
    },
    {
      "id": "communication-studies",
      "discipline": "Communication Studies 2.0",
      "degree": "AA-T",
      "total_units": 18,
      "version": "draft (cf. Communication Studies 2.0 TMC)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "6", "slots": [
          { "cid": "COMM 110", "title": "Public Speaking", "units": "3" },
          { "cid": "COMM 180", "title": "Introduction to Communication Studies / Theory", "units": "3" }
        ]},
        { "name": "List A — select two", "select": 2, "units": "6", "slots": [
          { "cid": "COMM 120", "title": "Argumentation (and Debate)", "units": "3" },
          { "cid": "COMM 130", "title": "Interpersonal Communication", "units": "3" },
          { "cid": "COMM 150", "title": "Intercultural Communication", "units": "3" },
          { "cid": "COMM 140", "title": "Small Group Communication", "units": "3" }
        ]},
        { "name": "List B — select two", "select": 2, "units": "6", "note": "Any List A course not used, plus the options below.", "slots": [
          { "cid": "COMM 115", "title": "Survey of Human Communication", "units": "3" },
          { "cid": "COMM 170", "title": "Oral Interpretation of Literature", "units": "3" },
          { "cid": "COMM 190", "title": "Introduction to Persuasion", "units": "3" }
        ]}
      ]
    },
    {
      "id": "history",
      "discipline": "History",
      "degree": "AA-T",
      "total_units": 19,
      "version": "draft (cf. History TMC Rev 3)",
      "sections": [
        { "name": "Required Core — U.S. History (select both)", "select": "all", "units": "6", "slots": [
          { "cid": "HIST 130", "title": "United States History to 1877", "units": "3" },
          { "cid": "HIST 140", "title": "United States History from 1865", "units": "3" }
        ]},
        { "name": "List A — World/Western (select two)", "select": 2, "units": "6", "slots": [
          { "cid": "HIST 150", "title": "World History to 1500", "units": "3" },
          { "cid": "HIST 160", "title": "World History since 1500", "units": "3" },
          { "cid": "HIST 170", "title": "Western Civilization I", "units": "3" },
          { "cid": "HIST 180", "title": "Western Civilization II", "units": "3" }
        ]},
        { "name": "List B — select two", "select": 2, "units": "6–7", "note": "Any List A course not used, or an approved History/related elective.", "slots": [
          { "cid": "", "title": "Approved History elective (lower-division)", "units": "3", "noncid": true },
          { "cid": "POLS 110", "title": "Introduction to American Government and Politics", "units": "3" },
          { "cid": "ANTH 120", "title": "Introduction to Cultural Anthropology", "units": "3" }
        ]}
      ]
    },
    {
      "id": "business-administration",
      "discipline": "Business Administration 2.0",
      "degree": "AS-T",
      "total_units": 27,
      "version": "draft (cf. Business Administration 2.0 TMC Rev 5)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "18–20", "slots": [
          { "cid": "ACCT 110", "title": "Financial Accounting", "units": "4" },
          { "cid": "ACCT 120", "title": "Managerial Accounting", "units": "4" },
          { "cid": "ECON 201", "title": "Principles of Microeconomics", "units": "3" },
          { "cid": "ECON 202", "title": "Principles of Macroeconomics", "units": "3" },
          { "cid": "BUS 125", "title": "Business Law", "units": "3", "alts": ["BUS 120"] },
          { "cid": "MATH 110", "title": "Introduction to Statistics", "units": "3–4" }
        ]},
        { "name": "List A — select one", "select": 1, "units": "3–5", "slots": [
          { "cid": "MATH 140", "title": "Business Calculus", "units": "3–5" },
          { "cid": "MATH 210", "title": "Single Variable Calculus I", "units": "4–5" }
        ]},
        { "name": "List B — select one", "select": 1, "units": "3–4", "slots": [
          { "cid": "BUS 140", "title": "Business Information Systems", "units": "3" },
          { "cid": "BUS 115", "title": "Business Communication", "units": "3" },
          { "cid": "BUS 110", "title": "Introduction to Business", "units": "3" }
        ]}
      ]
    },
    {
      "id": "mathematics",
      "discipline": "Mathematics 2.0",
      "degree": "AS-T",
      "total_units": 19,
      "version": "draft (cf. Mathematics TMC)",
      "sections": [
        { "name": "Required Core", "select": "all", "units": "13–15", "slots": [
          { "cid": "MATH 210", "title": "Single Variable Calculus I", "units": "4–5", "alts": ["MATH 211", "MATH 900 S"] },
          { "cid": "MATH 220", "title": "Single Variable Calculus II", "units": "4–5", "alts": ["MATH 221"] },
          { "cid": "MATH 230", "title": "Multivariable Calculus", "units": "3–5" }
        ]},
        { "name": "List A — select one", "select": 1, "units": "3–4", "slots": [
          { "cid": "MATH 240", "title": "Ordinary Differential Equations", "units": "3", "alts": ["MATH 260", "MATH 910 S"] },
          { "cid": "MATH 250", "title": "Introduction to Linear Algebra", "units": "3", "alts": ["MATH 260", "MATH 910 S"] }
        ]},
        { "name": "List B — select one", "select": 1, "units": "3–4", "note": "Any List A course not used, or an approved math/related course.", "slots": [
          { "cid": "MATH 160", "title": "Discrete Mathematics", "units": "3" },
          { "cid": "", "title": "Calculus-based Physics or approved elective", "units": "3–4", "noncid": true }
        ]}
      ]
    },
    {
      "id": "biology",
      "discipline": "Biology 2.0",
      "degree": "AS-T",
      "total_units": 32,
      "version": "draft (cf. Biology TMC Rev 2)",
      "sections": [
        { "name": "Required Core — Biology", "select": "all", "units": "8–10", "slots": [
          { "cid": "BIOL 135 S", "title": "Biology Sequence for Majors", "units": "8–10", "alts": ["BIOL 190", "BIOL 130 S"] }
        ]},
        { "name": "Required Core — Chemistry", "select": "all", "units": "8–10", "slots": [
          { "cid": "CHEM 110 S", "title": "General Chemistry for Science Majors (sequence)", "units": "8–10", "alts": ["CHEM 120 S"], "noncid": false }
        ]},
        { "name": "List A — Mathematics (select one)", "select": 1, "units": "3–5", "slots": [
          { "cid": "MATH 210", "title": "Single Variable Calculus I", "units": "4–5", "alts": ["MATH 211"] },
          { "cid": "MATH 110", "title": "Introduction to Statistics", "units": "3–4" }
        ]},
        { "name": "List B — select one", "select": 1, "units": "3–5", "note": "Organic Chemistry I or Calculus-based Physics I (per the official template).", "slots": [
          { "cid": "", "title": "Organic Chemistry I (with lab)", "units": "4–5", "noncid": true },
          { "cid": "", "title": "Calculus-based Physics I (with lab)", "units": "4–5", "noncid": true }
        ]}
      ]
    },
    { "id": "administration-of-justice", "discipline": "Administration of Justice", "status": "planned" },
    { "id": "african-american-studies", "discipline": "African American Studies", "status": "planned" },
    { "id": "agriculture-animal-sciences", "discipline": "Agriculture Animal Sciences", "status": "planned" },
    { "id": "agriculture-business", "discipline": "Agriculture Business", "status": "planned" },
    { "id": "agriculture-plant-sciences", "discipline": "Agriculture Plant Sciences", "status": "planned" },
    { "id": "american-indian-studies", "discipline": "American Indian Studies", "status": "planned" },
    { "id": "art-history", "discipline": "Art History", "status": "planned" },
    { "id": "asian-american-studies", "discipline": "Asian American Studies", "status": "planned" },
    { "id": "chemistry", "discipline": "Chemistry", "status": "planned" },
    { "id": "chicana-o-studies-latina-o-studies", "discipline": "Chicana/o Studies, Latina/o Studies", "status": "planned" },
    { "id": "child-and-adolescent-development", "discipline": "Child and Adolescent Development", "status": "planned" },
    { "id": "computer-science", "discipline": "Computer Science", "status": "planned" },
    { "id": "early-childhood-education", "discipline": "Early Childhood Education", "status": "planned" },
    { "id": "economics", "discipline": "Economics", "status": "planned" },
    { "id": "elementary-teacher-education-integrated-programs", "discipline": "Elementary Teacher Education: Integrated Programs", "status": "planned" },
    { "id": "english", "discipline": "English", "status": "planned" },
    { "id": "environmental-science", "discipline": "Environmental Science", "status": "planned" },
    { "id": "film-television-and-electronic-media", "discipline": "Film, Television and Electronic Media", "status": "planned" },
    { "id": "geography", "discipline": "Geography", "status": "planned" },
    { "id": "geology", "discipline": "Geology", "status": "planned" },
    { "id": "global-studies", "discipline": "Global Studies", "status": "planned" },
    { "id": "hospitality-management", "discipline": "Hospitality Management", "status": "planned" },
    { "id": "journalism", "discipline": "Journalism", "status": "planned" },
    { "id": "kinesiology", "discipline": "Kinesiology", "status": "planned" },
    { "id": "law-public-policy-and-society", "discipline": "Law, Public Policy, and Society", "status": "planned" },
    { "id": "music", "discipline": "Music", "status": "planned" },
    { "id": "music-industry-studies", "discipline": "Music Industry Studies", "status": "planned" },
    { "id": "nutrition-and-dietetics", "discipline": "Nutrition and Dietetics", "status": "planned" },
    { "id": "philosophy", "discipline": "Philosophy", "status": "planned" },
    { "id": "physics-2-0", "discipline": "Physics 2.0", "status": "planned" },
    { "id": "political-science", "discipline": "Political Science", "status": "planned" },
    { "id": "public-health", "discipline": "Public Health", "status": "planned" },
    { "id": "social-justice-studies", "discipline": "Social Justice Studies", "status": "planned" },
    { "id": "social-work-and-human-services", "discipline": "Social Work and Human Services", "status": "planned" },
    { "id": "spanish", "discipline": "Spanish", "status": "planned" },
    { "id": "studio-art", "discipline": "Studio Art", "status": "planned" },
    { "id": "theatre-arts", "discipline": "Theatre Arts", "status": "planned" }
  ]
};
