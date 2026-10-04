window.CPL_PATHWAYS_ROEP = {
 "_generated_by": "kb/_build_roep_display.py",
 "_note": "Each harvested program's catalog record and its display facts: CPL in three kinds per course, the up-to figure, the gaps and the map's status. The same facts sit in program_requirement_records.display, where Sierra reads them; both carry this build stamp. Do not edit; rerun the builder.",
 "build": "bbbbfb611f15",
 "built": "2026-10-04",
 "inputs": {
  "records": 20,
  "map_read_at": "2026-10-04",
  "registry_read_at": "2026-10-04",
  "articulations": "2026-09-03T20:19:16Z",
  "memberships": "2026-05-22",
  "cer": "2026-10-04T16:56:26+00:00"
 },
 "definitions": {
  "here": "Articulated here: the college has articulated CPL to this course. MAP holds a credit recommendation for it at this college (military, industry or exam credit), or MAP's articulated-exhibit feed names the course at this college.",
  "adopt": "Could adopt: another college has articulated this credential to a course of the same identity (its C-ID, Common Course Numbering id or Common Course Reference id), and this college has not. The college decides; the listing is a lead for its faculty.",
  "consider": "For consideration: a credential whose statewide credit recommendation names this course's C-ID, which this college has not articulated. No articulation exists until the college's faculty approve one.",
  "up_to": "Up to: the most units (hours, for a noncredit program) of the program a learner could meet through CPL this college has articulated, taking the CPL course in every choice and the option with more CPL. It counts only the first kind. Where a college's pathway map is read, the map's recommended path gives a second figure."
 },
 "programs": [
  {
   "key": "cerritos_36675",
   "college": "Cerritos College",
   "control_number": "36675",
   "title": "Energy Corps",
   "award": "Noncredit program",
   "catalog_year": "2026-2027",
   "source_url": "https://cerritos-public.courseleaf.com/degrees-certificates-courses/noncredit-career-development-college-preparation/energy-corps-certificate-completion/",
   "platform": "courseleaf",
   "measure": "hours",
   "record": {
    "program": {
     "section_heading": "Energy Corps (Non Credit) — Certificate of Completion",
     "measure": "hours",
     "total_units": {
      "min": 136,
      "max": 136
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 136,
       "max": 136
      },
      "courses": [
       {
        "code": "AED 90.01",
        "units": 40,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AED 90.02",
        "units": 40,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AED 90.03",
        "units": 40,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AED 90.05",
        "units": 16,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "hours",
     "total": {
      "min": 136,
      "max": 136
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 4,
     "here": 0,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "AED 90.01": {
      "title": "Introduction to Energy Surveying",
      "identity": {
       "kind": "CCR",
       "id": "ELEC M9043",
       "title": "Introduction to Energy Surveying"
      }
     },
     "AED 90.02": {
      "title": "Basic Electricity and Wiring Fundamentals",
      "identity": {
       "kind": "CCR",
       "id": "ELEC M9013",
       "title": "Basic Electricity and Wiring Fundamentals"
      }
     },
     "AED 90.03": {
      "title": "Introduction to Lighting Retrofits",
      "identity": {
       "kind": "CCR",
       "id": "ELEC M9052",
       "title": "Introduction to Lighting Retrofits"
      }
     },
     "AED 90.05": {
      "title": "OSHA-10 Training",
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Cerritos College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists AED 90.08; the reader found it listed as an optional elective (80 hours), not required."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Cerritos College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists AED 90.09; the reader found it listed as an optional elective (90 hours), not required."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The award is counted in hours; the catalog's units column shows 0.0 for each course, so the hours printed beside the course titles were recorded instead."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The 'Total Hours of Completion (136 Hours)' line covers the four required courses only. The text says students complete 'the four (4) courses outlined below'."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "AED 90.08 (80 Hours) and AED 90.09 (90 hours) appear under 'Optional Elective' and are not part of the required total, so they are not placed in a block. A reviewer may decide whether to record them as an optional block."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The text states that AED 90.01 must be completed before enrolling in AED 90.02."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152831Z-s3of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Cerritos College's site (census run census-20261004T152831Z-s3of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 4,
      "listed": 6
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "cerritos_41982",
   "college": "Cerritos College",
   "control_number": "41982",
   "title": "Community Health Worker",
   "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
   "catalog_year": "2026-2027",
   "source_url": "https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/community-health-worker-certificate-achievement/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Community Health Worker (CERT)",
     "measure": "units",
     "total_units": {
      "min": 20,
      "max": 20
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "HED 100",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HED 102",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "HO 102",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "HED 110",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "KIN 110",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "HED 201",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "HED 202",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HED 204",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "STAT C1000",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 3.0,
     "measure": "units",
     "total": {
      "min": 20,
      "max": 20
     },
     "picks": [
      "HED 100"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 9,
     "here": 1,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "HED 100": {
      "title": "Contemporary Health Problems",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Basic Military Training"
       ]
      }
     },
     "HED 102": {
      "title": "Introduction to Public Health",
      "identity": null
     },
     "HO 102": {
      "title": "Introduction to Public Health",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "HED 110": {
      "title": "Community First Aid and CPR",
      "identity": null
     },
     "KIN 110": {
      "title": "Community First Aid and CPR",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "HED 201": {
      "title": null,
      "identity": null
     },
     "HED 202": {
      "title": "Health Systems and Perspectives",
      "identity": null
     },
     "HED 204": {
      "title": "Work Experience in Community Health Worker",
      "identity": {
       "kind": "CCR",
       "id": "WEXP M1001",
       "title": "Work Experience Education"
      }
     },
     "STAT C1000": {
      "title": "Introduction to Statistics",
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Cerritos College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists PSYC 210; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Cerritos College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists STAT C1000E; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Cerritos College's program record in the state's curriculum inventory",
      "text": "The catalog prints HED 201 for this program; the state's Program Course File does not list it."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "HED 201 (Principles of the Community Health Worker) is required in the catalog but missing from the closed list; recorded as a catalog addition."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "Units for the alternatives HO 102 and KIN 110 are not printed beside them in the catalog, so they are left null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "A 'Recommended Courses' list (HED 101, HED 103 or WGS 103, HED 104, HED 200, MA 161) follows the requirements; these are recommendations, not requirements, and were not recorded as a block."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The printed 'Total Units 20' matches the sum of the required courses (3+3+3+3+3+1+4)."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152831Z-s3of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Cerritos College's site (census run census-20261004T152831Z-s3of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 8,
      "listed": 10
     },
     "additions": 1,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "cerritos_42158",
   "college": "Cerritos College",
   "control_number": "42158",
   "title": "Apprenticeship: Field Ironworkers",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/field-ironworkers-aa/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Apprenticeship: Field Ironworkers (A.S.)",
     "measure": "units",
     "total_units": {
      "min": 34,
      "max": 38
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Core Requirements: Field Ironworkers Essential Classes for Reinforcing and Structural",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 19,
       "max": 19
      },
      "courses": [
       {
        "code": "IWAP 40.07",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.50",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.56",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.63",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.09",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.22",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.10",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.11",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Option 1: Reinforcing Program",
      "rule": "all",
      "minimum": null,
      "option_group": "Reinforcing or Structural option",
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "IWAP 40.12",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.03",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.15",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.07",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.53",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.55",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.08",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.09",
        "units": 1.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Option 2: Structural Program",
      "rule": "all",
      "minimum": null,
      "option_group": "Reinforcing or Structural option",
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "IWAP 40.21",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.06",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.05",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.60",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.05",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.61",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 41.04",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "IWAP 40.26",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 31.5,
     "measure": "units",
     "total": {
      "min": 34,
      "max": 38
     },
     "picks": [
      "IWAP 40.07",
      "IWAP 40.50",
      "IWAP 40.56",
      "IWAP 40.63",
      "IWAP 40.09",
      "IWAP 40.22",
      "IWAP 40.11",
      "IWAP 40.12",
      "IWAP 41.03",
      "IWAP 40.15",
      "IWAP 41.07",
      "IWAP 40.53",
      "IWAP 40.55",
      "IWAP 41.08",
      "IWAP 41.09"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 24,
     "here": 15,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "IWAP 40.07": {
      "title": "FIW - Orientation",
      "identity": {
       "kind": "CCR",
       "id": "ELEC M9046",
       "title": "FIW - Orientation"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "FIW Orientation"
       ]
      }
     },
     "IWAP 40.50": {
      "title": "IW - Mixed Base - Reinforcing",
      "identity": {
       "kind": "CCR",
       "id": "ELEC M9011",
       "title": "Iw-Mixed Base-Reinforcing"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Mixed Base"
       ]
      }
     },
     "IWAP 40.56": {
      "title": "IW - Trade Science/Ironworker History",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Ironworker History"
       ]
      }
     },
     "IWAP 40.63": {
      "title": "IW - Structural Lead Hazard",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Lead Hazard"
       ]
      }
     },
     "IWAP 40.09": {
      "title": "IW - GEN Rigging",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — General Rigging"
       ]
      }
     },
     "IWAP 40.22": {
      "title": "IW - Cranes",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Cranes"
       ]
      }
     },
     "IWAP 40.10": {
      "title": "Welding l - Reinforcing",
      "identity": {
       "kind": "CCR",
       "id": "WELD M1111",
       "title": "Welding L - Reinforcing"
      }
     },
     "IWAP 40.11": {
      "title": "Welding ll- Reinforcing",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Welding 2"
       ]
      }
     },
     "IWAP 40.12": {
      "title": "IW - Reinforcing Iron l",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Reinforcing 1"
       ]
      }
     },
     "IWAP 41.03": {
      "title": "IW - Reinforcing ll",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Reinforcing 2"
       ]
      }
     },
     "IWAP 40.15": {
      "title": "IW - Post Tension l",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Post Tensioning 1"
       ]
      }
     },
     "IWAP 41.07": {
      "title": "Post - Tension ll",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Post Tensioning 2"
       ]
      }
     },
     "IWAP 40.53": {
      "title": "IW - Detailing/Reinforcing Iron",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ironworker Apprenticeship — Detailing"
       ]
      }
     },
     "IWAP 40.55": {
      "title": "IWS - Reinforcing Foreman Training",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Foreman Training"
       ]
      }
     },
     "IWAP 41.08": {
      "title": "IW - Post - Tension lll",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Post Tensioning 3"
       ]
      }
     },
     "IWAP 41.09": {
      "title": "OSHA 30/Extension Review",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Ext & Review"
       ]
      }
     },
     "IWAP 40.21": {
      "title": "Structural Steel l",
      "identity": null
     },
     "IWAP 41.06": {
      "title": "IW - Structural Steel ll",
      "identity": null
     },
     "IWAP 40.05": {
      "title": "IW- Welding lll",
      "identity": null
     },
     "IWAP 40.60": {
      "title": "Structural Arch Orn l",
      "identity": {
       "kind": "CCR",
       "id": "INDT M1026",
       "title": "Structural Arch Orn L"
      }
     },
     "IWAP 41.05": {
      "title": "IW - Architectural ll",
      "identity": null
     },
     "IWAP 40.61": {
      "title": "IW - Structural Precast Concrete/Qualified Rigger",
      "identity": null
     },
     "IWAP 41.04": {
      "title": "IW - Architectural lll",
      "identity": null
     },
     "IWAP 40.26": {
      "title": "Metal Building Erection /Foreman Training",
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "Catalog prints IWAP 40.50, 40.10 and 40.60; the closed list stores them as IWAP 40.5, 40.1 and 40.6. Treated as the same courses (trailing zero), so catalog_addition is false; reviewer should confirm."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The catalog prints 15.0-19.0 units for the choice 'Select one of the following options' as a whole, not for each option. Per-option stated totals are left null. Option 1 courses sum to 15 units and Option 2 courses sum to 19 units."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "Each option is read as requiring all of its listed courses. The catalog shows no 'select' rule within either option."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The degree text refers to 'the general education requirements' without naming a pattern, so ge_pattern is null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The URL slug reads 'field-ironworkers-aa', but the page heading and award are A.S."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152831Z-s3of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Cerritos College's site (census run census-20261004T152831Z-s3of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 24,
      "listed": 24
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "cerritos_45549",
   "college": "Cerritos College",
   "control_number": "45549",
   "title": "Public Health",
   "award": "A.S. T Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://cerritos-public.courseleaf.com/degrees-certificates-courses/degrees-certificates-programs-majors/public-health-science-as-t/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Public Health (AS-T)",
     "measure": "units",
     "total_units": {
      "min": 24,
      "max": 25.5
     },
     "open_elective_units": null,
     "ge_pattern": "Cal-GETC"
    },
    "blocks": [
     {
      "name": "Required Core",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "HED 100",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HED 102",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "HO 102",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "STAT C1000",
        "units": 4,
        "units_max": 4.5,
        "alternatives": [
         {
          "code": "STAT C1000E",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "PSYC 210",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "BIOL 120",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "List A (Select one course for 4-5 units)",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 4,
       "max": 5
      },
      "courses": [
       {
        "code": "A&P 150",
        "units": 4,
        "units_max": null,
        "alternatives": [
         {
          "code": "A&P 151",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "CHEM 110",
        "units": 4,
        "units_max": 5,
        "alternatives": [
         {
          "code": "CHEM 111",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "MICR 200",
        "units": 5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "List B: Select one course - 3 units",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 3
      },
      "courses": [
       {
        "code": "HED 104",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "HO 103",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "HED 106",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "List C - Select one course - 3 units",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 3
      },
      "courses": [
       {
        "code": "HED 103",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "WGS 103",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "HED 108",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HED 202",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HO 245",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "PSYC 245",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 3.0,
     "measure": "units",
     "total": {
      "min": 24,
      "max": 25.5
     },
     "picks": [
      "HED 100"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 21,
     "here": 1,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "HED 100": {
      "title": "Contemporary Health Problems",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Basic Military Training"
       ]
      }
     },
     "HED 102": {
      "title": "Introduction to Public Health",
      "identity": null
     },
     "HO 102": {
      "title": "Introduction to Public Health",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "STAT C1000": {
      "title": "Introduction to Statistics",
      "identity": null
     },
     "STAT C1000E": {
      "title": "Introduction to Statistics",
      "units_from_state_file": 4.5,
      "identity": null
     },
     "PSYC 210": {
      "title": "Elementary Statistics",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "BIOL 120": {
      "title": "Introduction To Biological Science",
      "identity": null
     },
     "A&P 150": {
      "title": "Introduction to Human Anatomy",
      "identity": null
     },
     "A&P 151": {
      "title": "Introduction to Human Physiology",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "CHEM 110": {
      "title": "Elementary Chemistry",
      "identity": null
     },
     "CHEM 111": {
      "title": "General Chemistry",
      "units_from_state_file": 5.0,
      "identity": null
     },
     "MICR 200": {
      "title": "Principles and Applications of Microbiology",
      "identity": null
     },
     "HED 104": {
      "title": "Introduction to Health and Society",
      "identity": null
     },
     "HO 103": {
      "title": "Health and Social Justice",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "HED 106": {
      "title": "Cultural Competence in Health and Social Services",
      "identity": null
     },
     "HED 103": {
      "title": "Women, Their Bodies and Health",
      "identity": null
     },
     "WGS 103": {
      "title": "Women, their Bodies and Health",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "HED 108": {
      "title": "Explorations of Health Professions",
      "identity": null
     },
     "HED 202": {
      "title": "Health Systems and Perspectives",
      "identity": null
     },
     "HO 245": {
      "title": "Drugs and Behavior",
      "identity": null
     },
     "PSYC 245": {
      "title": "Drugs and Behavior",
      "units_from_state_file": 3.0,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The catalog prints units only beside the first course of each 'or' group; alternative courses carry no printed units, so their units are recorded as null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "STAT C1000 is printed with '4.0-4.5', which appears to be the range for the whole statistics group (STAT C1000 4, STAT C1000E 4.5, PSYC 210 4); recorded as units 4, units_max 4.5 on the entry."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "CHEM 110 is printed with '(4-5)', apparently covering the CHEM 110 (4) / CHEM 111 (5) pair; recorded as units 4, units_max 5."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "The degree requires Cal-GETC; the text notes CSU GE or IGETC may be used in some cases."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Cerritos College's CourseLeaf reading procedure",
      "text": "Program was formerly known as Public Health Science (AS-T)."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152831Z-s3of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Cerritos College's site (census run census-20261004T152831Z-s3of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 21,
      "listed": 21
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "miramar_05100",
   "college": "San Diego Miramar College",
   "control_number": "05100",
   "title": "Fire Technology",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20043",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "FIRE TECHNOLOGY - ASSOCIATE OF SCIENCE DEGREE: MIRAMAR",
     "measure": "units",
     "total_units": {
      "min": 25.5,
      "max": 25.5
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "COURSES REQUIRED FOR THE MAJOR",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 25.5,
       "max": 25.5
      },
      "courses": [
       {
        "code": "FIPT 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 102",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 103",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 104",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 105",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 120",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EMGM 105A",
        "units": 7,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EMGM 106",
        "units": 0.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 22.5,
     "measure": "units",
     "total": {
      "min": 25.5,
      "max": 25.5
     },
     "picks": [
      "FIPT 101",
      "FIPT 102",
      "FIPT 103",
      "FIPT 104",
      "FIPT 105",
      "EMGM 105A",
      "EMGM 106"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 8,
     "here": 7,
     "adopt": 5,
     "consider": 0
    },
    "courses": {
     "FIPT 101": {
      "title": "Fire Protection Organization",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1347",
       "title": "Fire Protection Organization"
      },
      "here": {
       "recs": 2,
       "credentials_n": 7,
       "credentials": [
        "Fire Protection Organization 1 or 1A Certification",
        "Credit By Exam Miramar",
        "Fire Protection Organization",
        "Firefighter EMT Certificate"
       ]
      },
      "adopt": {
       "credentials_n": 7,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Fire Fighter Paramedic Journeyperson Certificate",
         "colleges": [
          "Bakersfield College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Fire Science",
         "colleges": [
          "Lake Tahoe Community College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Fire Service",
         "colleges": [
          "Lake Tahoe Community College",
          "Santa Ana College"
         ]
        }
       ]
      }
     },
     "FIPT 102": {
      "title": "Fire Prevention Technology",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1349",
       "title": "Fire Prevention Technology"
      },
      "here": {
       "recs": 2,
       "credentials_n": 2,
       "credentials": [
        "Fire Prevention Technology Fire Inspector 1A Certification",
        "Fire Inspector 1A"
       ]
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Fire Prevention Technology",
         "colleges": [
          "Merced College"
         ]
        }
       ]
      }
     },
     "FIPT 103": {
      "title": "Fire Protection Equipment and Systems",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1315",
       "title": "Fire Protection Equipment and Systems"
      },
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Fire Protection Equipment and Systems Fire Inspector 1C Certification",
        "Fire Inspector 1C"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 5,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Bakersfield College",
          "City College of San Francisco",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Building Construction for Fire Protection",
         "colleges": [
          "Mendocino College"
         ]
        },
        {
         "credential": "Firefighter 1A",
         "colleges": [
          "Cabrillo College"
         ]
        }
       ]
      }
     },
     "FIPT 104": {
      "title": "Building Construction for Fire Protection",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1274",
       "title": "Building Construction for Fire Protection"
      },
      "here": {
       "recs": 0,
       "credentials_n": 5,
       "credentials": [
        "Firefighter EMT Certificate",
        "Firefighter Journeyperson Certificate",
        "Firefighter 1",
        "Firefighter 1A"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 6,
       "credentials": [
        {
         "credential": "Fire Fighter Paramedic Journeyperson Certificate",
         "colleges": [
          "Bakersfield College",
          "Chaffey College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Firefighter I",
         "colleges": [
          "Bakersfield College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Professional Fire Service Experience",
         "colleges": [
          "College of the Desert",
          "Lake Tahoe Community College"
         ]
        }
       ]
      }
     },
     "FIPT 105": {
      "title": "Fire Behavior and Combustion",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1268",
       "title": "Fire Behavior and Combustion"
      },
      "here": {
       "recs": 1,
       "credentials_n": 5,
       "credentials": [
        "Firefighter 1 Certification",
        "Firefighter EMT Certificate",
        "Firefighter Journeyperson Certificate",
        "Firefighter 1"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 10,
       "credentials": [
        {
         "credential": "Fire Behavior and Combustion",
         "colleges": [
          "Cabrillo College",
          "Chaffey College",
          "Lake Tahoe Community College",
          "Merced College",
          "Modesto Junior College"
         ]
        },
        {
         "credential": "California State Fire Officer Certification",
         "colleges": [
          "College of the Sequoias",
          "Mendocino College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Cabrillo College",
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Fire Officer Journeyperson Certificate",
         "colleges": [
          "Mendocino College",
          "Santa Ana College"
         ]
        }
       ]
      }
     },
     "FIPT 120": {
      "title": "Firefighter Safety and Survival",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1356",
       "title": "Firefighter Safety and Survival"
      }
     },
     "EMGM 105A": {
      "title": "Emergency Medical Technician - National Registry",
      "identity": null,
      "here": {
       "recs": 2,
       "credentials_n": 4,
       "credentials": [
        "Emergency Medical Technician (EMT)",
        "Credit By Exam Miramar",
        "Firefighter EMT Certificate",
        "EMT Certification"
       ]
      }
     },
     "EMGM 106": {
      "title": "Perilaryngeal Airway Adjuncts/Defibrillation Training",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Current EMT Certification or Paramedic License",
        "EMT Certification"
       ]
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The summary names the optional On Campus Fire Academy cohort courses (FIPT 150W, 150A, 150B, 150C, 150T, 322A, 322C, 322F, 323B, 324A, 381G, 322D) and academy prerequisite FACD 100D. They are not part of the degree requirements and were not recorded."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The award note states the degree requires a minimum of 60 semester units. The catalog text does not name a general education pattern."
     }
    ],
    "map": {
     "host": "san-diego-miramar.programmapper.com",
     "url": null,
     "checked_run": "program-sequence-ppm run 37197332656",
     "status": "refused",
     "text": "Miramar's Program Pathways Mapper, linked from sdmiramar.edu/program-mapper, answered all seven of the reader's requests 403 Forbidden on 2026-10-04 (sequence run 37197332656), and the 17 other mapper hosts probed that day did the same: the refusal is the mapper service's. The pilot's sequence for Fire Technology A.S. (05100) is not yet read. The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college's own pages and in its catalog, and asks this host's front page once a run whether it has opened (Sam, open-asks sheet 29 card 3, 2026-10-04)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 8,
      "listed": 8
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "miramar_18207",
   "college": "San Diego Miramar College",
   "control_number": "18207",
   "title": "Fire Technology",
   "award": "Certificate of Achievement requiring 16S/24Q to fewer than 30S/45Q units",
   "catalog_year": "2026-2027",
   "source_url": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20044",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "FIRE TECHNOLOGY - CERTIFICATE OF ACHIEVEMENT: MIRAMAR",
     "measure": "units",
     "total_units": {
      "min": 25.5,
      "max": 25.5
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "COURSES REQUIRED FOR THE MAJOR",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 25.5,
       "max": 25.5
      },
      "courses": [
       {
        "code": "FIPT 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 102",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 103",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 104",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 105",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIPT 120",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EMGM 105A",
        "units": 7,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EMGM 106",
        "units": 0.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 22.5,
     "measure": "units",
     "total": {
      "min": 25.5,
      "max": 25.5
     },
     "picks": [
      "FIPT 101",
      "FIPT 102",
      "FIPT 103",
      "FIPT 104",
      "FIPT 105",
      "EMGM 105A",
      "EMGM 106"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 8,
     "here": 7,
     "adopt": 5,
     "consider": 0
    },
    "courses": {
     "FIPT 101": {
      "title": "Fire Protection Organization",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1347",
       "title": "Fire Protection Organization"
      },
      "here": {
       "recs": 2,
       "credentials_n": 7,
       "credentials": [
        "Fire Protection Organization 1 or 1A Certification",
        "Credit By Exam Miramar",
        "Fire Protection Organization",
        "Firefighter EMT Certificate"
       ]
      },
      "adopt": {
       "credentials_n": 7,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Fire Fighter Paramedic Journeyperson Certificate",
         "colleges": [
          "Bakersfield College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Fire Science",
         "colleges": [
          "Lake Tahoe Community College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Fire Service",
         "colleges": [
          "Lake Tahoe Community College",
          "Santa Ana College"
         ]
        }
       ]
      }
     },
     "FIPT 102": {
      "title": "Fire Prevention Technology",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1349",
       "title": "Fire Prevention Technology"
      },
      "here": {
       "recs": 2,
       "credentials_n": 2,
       "credentials": [
        "Fire Prevention Technology Fire Inspector 1A Certification",
        "Fire Inspector 1A"
       ]
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Fire Prevention Technology",
         "colleges": [
          "Merced College"
         ]
        }
       ]
      }
     },
     "FIPT 103": {
      "title": "Fire Protection Equipment and Systems",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1315",
       "title": "Fire Protection Equipment and Systems"
      },
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Fire Protection Equipment and Systems Fire Inspector 1C Certification",
        "Fire Inspector 1C"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 5,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Bakersfield College",
          "City College of San Francisco",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Building Construction for Fire Protection",
         "colleges": [
          "Mendocino College"
         ]
        },
        {
         "credential": "Firefighter 1A",
         "colleges": [
          "Cabrillo College"
         ]
        }
       ]
      }
     },
     "FIPT 104": {
      "title": "Building Construction for Fire Protection",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1274",
       "title": "Building Construction for Fire Protection"
      },
      "here": {
       "recs": 0,
       "credentials_n": 5,
       "credentials": [
        "Firefighter EMT Certificate",
        "Firefighter Journeyperson Certificate",
        "Firefighter 1",
        "Firefighter 1A"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 6,
       "credentials": [
        {
         "credential": "Fire Fighter Paramedic Journeyperson Certificate",
         "colleges": [
          "Bakersfield College",
          "Chaffey College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Firefighter I",
         "colleges": [
          "Bakersfield College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Professional Fire Service Experience",
         "colleges": [
          "College of the Desert",
          "Lake Tahoe Community College"
         ]
        }
       ]
      }
     },
     "FIPT 105": {
      "title": "Fire Behavior and Combustion",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1268",
       "title": "Fire Behavior and Combustion"
      },
      "here": {
       "recs": 1,
       "credentials_n": 5,
       "credentials": [
        "Firefighter 1 Certification",
        "Firefighter EMT Certificate",
        "Firefighter Journeyperson Certificate",
        "Firefighter 1"
       ]
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 10,
       "credentials": [
        {
         "credential": "Fire Behavior and Combustion",
         "colleges": [
          "Cabrillo College",
          "Chaffey College",
          "Lake Tahoe Community College",
          "Merced College",
          "Modesto Junior College"
         ]
        },
        {
         "credential": "California State Fire Officer Certification",
         "colleges": [
          "College of the Sequoias",
          "Mendocino College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Fire Academy Experience",
         "colleges": [
          "Cabrillo College",
          "Lake Tahoe Community College",
          "Moreno Valley College"
         ]
        },
        {
         "credential": "Fire Officer Journeyperson Certificate",
         "colleges": [
          "Mendocino College",
          "Santa Ana College"
         ]
        }
       ]
      }
     },
     "FIPT 120": {
      "title": "Firefighter Safety and Survival",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1356",
       "title": "Firefighter Safety and Survival"
      }
     },
     "EMGM 105A": {
      "title": "Emergency Medical Technician - National Registry",
      "identity": null,
      "here": {
       "recs": 2,
       "credentials_n": 4,
       "credentials": [
        "Emergency Medical Technician (EMT)",
        "Credit By Exam Miramar",
        "Firefighter EMT Certificate",
        "EMT Certification"
       ]
      }
     },
     "EMGM 106": {
      "title": "Perilaryngeal Airway Adjuncts/Defibrillation Training",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Current EMT Certification or Paramedic License",
        "EMT Certification"
       ]
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The summary text describes the 'Fire Technology Associate Degree program' and an award note about 60 degree-applicable units, though the section heading names the Certificate of Achievement; the narrative appears shared with the degree. The 60-unit degree total was not used."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "Fire academy cohort courses (FIPT 150W, 150A, 150B, 150C, 150T, 322A, 322C, 322F, 323B, 324A, 381G, 322D) and academy prerequisites (FACD 100D, EMT course) are mentioned only in the descriptive narrative, not as certificate requirements, so they were not placed in a block."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The requirement list header reads 'COURSES REQUIRED FOR THE MAJOR' even though this is a certificate; the printed total of 25.5 units matches the sum of the listed courses."
     }
    ],
    "map": {
     "host": "san-diego-miramar.programmapper.com",
     "url": null,
     "checked_run": "program-sequence-ppm run 37197332656",
     "status": "refused",
     "text": "Miramar's Program Pathways Mapper, linked from sdmiramar.edu/program-mapper, answered all seven of the reader's requests 403 Forbidden on 2026-10-04 (sequence run 37197332656), and the 17 other mapper hosts probed that day did the same: the refusal is the mapper service's. The pilot's sequence for Fire Technology A.S. (05100) is not yet read. The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college's own pages and in its catalog, and asks this host's front page once a run whether it has opened (Sam, open-asks sheet 29 card 3, 2026-10-04)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 8,
      "listed": 8
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "miramar_35030",
   "college": "San Diego Miramar College",
   "control_number": "35030",
   "title": "Entrepreneurship",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20041",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "ENTREPRENEURSHIP - ASSOCIATE OF SCIENCE DEGREE: MIRAMAR",
     "measure": "units",
     "total_units": {
      "min": 27,
      "max": 31
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "COURSES REQUIRED FOR THE MAJOR",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 21,
       "max": 21
      },
      "courses": [
       {
        "code": "BUSE 100",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 102",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "BUSE 150",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "BUSE 119",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 129",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 155",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "BUSE 157",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "MARK 100",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Complete at least three (3) units from the following supplemental business courses (not already selected above)",
      "rule": "choose_units",
      "minimum": 3,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 4
      },
      "courses": [
       {
        "code": "BUSE 140",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 155",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 157",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 201",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229A",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229B",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229C",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229D",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ACCT 102",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ACCT 150",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CISC 181",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Complete at least three (3) units from the following occupational courses (not already selected above)",
      "rule": "choose_units",
      "minimum": 3,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 6
      },
      "courses": [
       {
        "code": "BUSE 120",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 155",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 157",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229A",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229B",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229C",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 229D",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 270",
        "units": 1,
        "units_max": 4,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 290",
        "units": 1,
        "units_max": 3,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AUTO 151T",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AUTO 153G",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AUTO 156G",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AUTO 156T",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AVIA 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AVIA 105",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "AVIM 101G",
        "units": 6,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CBTE 165",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CBTE 180",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CBTE 210",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHIL 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "DIES 100",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "DIES 105",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EXSC 292A",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "EXSC 242B",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "MUSI 190",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL 101",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "WORK 272",
        "units": 1,
        "units_max": 3,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 12.0,
     "measure": "units",
     "total": {
      "min": 27,
      "max": 31
     },
     "picks": [
      "BUSE 100",
      "BUSE 119",
      "BUSE 129",
      "AVIM 101G"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 39,
     "here": 7,
     "adopt": 6,
     "consider": 0
    },
    "courses": {
     "BUSE 100": {
      "title": "Introduction to Business",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1191",
       "title": "Introduction to Business"
      },
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Credit By Exam Miramar",
        "Introduction to Business"
       ]
      }
     },
     "BUSE 101": {
      "title": "Business Mathematics",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1202",
       "title": "Business Mathematics"
      }
     },
     "BUSE 102": {
      "title": "Introduction to Customer Service",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1259",
       "title": "Introduction to Customer Service"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Introduction to Customer Service",
         "colleges": [
          "Modesto Junior College"
         ]
        }
       ]
      }
     },
     "BUSE 150": {
      "title": "Human Relations in Business",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1181",
       "title": "Human Relations in Business"
      }
     },
     "BUSE 119": {
      "title": "Business Communications",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1150",
       "title": "Business Communications"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Machinist's Mate"
       ]
      }
     },
     "BUSE 129": {
      "title": "Introduction to Entrepreneurship",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1286",
       "title": "Introduction to Entrepreneurship"
      },
      "here": {
       "recs": 1,
       "credentials_n": 3,
       "credentials": [
        "Credit By Exam Miramar",
        "Intro to Entrepreneurship",
        "Introduction to Entrepreneurship"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "Entrepreneurship and Small Business (ESB) Certification",
         "colleges": [
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        }
       ]
      }
     },
     "BUSE 155": {
      "title": "Small Business Management",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1199",
       "title": "Small Business Management"
      }
     },
     "BUSE 157": {
      "title": "Developing a Plan for the Small Business",
      "identity": {
       "kind": "CCR",
       "id": "ENTR M1007",
       "title": "Developing a Plan for the Small Business"
      }
     },
     "MARK 100": {
      "title": "Principles of Marketing",
      "identity": {
       "kind": "CCR",
       "id": "MRKT M1011",
       "title": "Principles of Marketing"
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "CLEP Principles of Marketing",
         "colleges": [
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        },
        {
         "credential": "Center for Financial Training (CFT) — Marketing",
         "colleges": [
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        }
       ]
      }
     },
     "BUSE 140": {
      "title": "Business Law and the Legal Environment",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1169",
       "title": "Business Law and the Legal Environment"
      }
     },
     "BUSE 201": {
      "title": "Business Organization and Management",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1196",
       "title": "Business Organization and Management"
      }
     },
     "BUSE 229A": {
      "title": "Gazelle Path Business Incubator I",
      "identity": null
     },
     "BUSE 229B": {
      "title": "Gazelle Path Business Incubator II",
      "identity": null
     },
     "BUSE 229C": {
      "title": "Gazelle Path Business Incubator III",
      "identity": null
     },
     "BUSE 229D": {
      "title": "Gazelle Path Business Incubator IV",
      "identity": null
     },
     "ACCT 102": {
      "title": "Basic Accounting",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1017",
       "title": "Basic Accounting"
      }
     },
     "ACCT 150": {
      "title": "Computer Accounting Applications",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1010",
       "title": "Computer Accounting Applications"
      }
     },
     "CISC 181": {
      "title": "Principles of Information Systems",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1394",
       "title": "Principles of Information Systems"
      }
     },
     "BUSE 120": {
      "title": "Personal Financial Management",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1313",
       "title": "Personal Financial Management"
      }
     },
     "BUSE 270": {
      "title": "Business Internship / Work Experience",
      "identity": {
       "kind": "CCR",
       "id": "WEXP M1001",
       "title": "Work Experience Education"
      }
     },
     "BUSE 290": {
      "title": "Independent Study",
      "identity": null
     },
     "AUTO 151T": {
      "title": "Honda/Toyota Quick Service Lube, Pre-Delivery Inspection Technician",
      "identity": null
     },
     "AUTO 153G": {
      "title": "Introduction to Automotive Technology",
      "identity": {
       "kind": "CCR",
       "id": "AUTO M1118",
       "title": "Introduction to Automotive Technology"
      },
      "here": {
       "recs": 2,
       "credentials_n": 2,
       "credentials": [
        "Credit By Exam Miramar",
        "Introduction to Automotive Technology"
       ]
      },
      "adopt": {
       "credentials_n": 4,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "ASE G1 — Auto Maintenance and Light Repair",
         "colleges": [
          "Long Beach City College",
          "Mendocino College"
         ]
        },
        {
         "credential": "ASE A1 — Engine Repair",
         "colleges": [
          "Citrus College"
         ]
        },
        {
         "credential": "ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair",
         "colleges": [
          "College of the Desert"
         ]
        },
        {
         "credential": "Original Equipment Manufacturer (OEM) Certification",
         "colleges": [
          "College of the Desert"
         ]
        }
       ]
      }
     },
     "AUTO 156G": {
      "title": "Engine and Related Systems",
      "identity": null,
      "here": {
       "recs": 2,
       "credentials_n": 5,
       "credentials": [
        "Credit By Exam Miramar",
        "Engine and Related Systems",
        "ASE A1 — Engine Repair",
        "EMT Certification"
       ]
      }
     },
     "AUTO 156T": {
      "title": "Honda/Toyota Engine and Related Systems",
      "identity": null
     },
     "AVIA 101": {
      "title": "Private Pilot Grounded School",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 3,
       "credentials": [
        "FAA-issued Private Pilot Certificate",
        "FAA Certified Flight Instructor (CFI)",
        "FAA Private Pilot Certificate"
       ]
      }
     },
     "AVIA 105": {
      "title": "Introduction to Aviation and Aerospace",
      "identity": null
     },
     "AVIM 101G": {
      "title": "General Aviation Technology Theory I",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "FAA Mechanic Certificate — Airframe or Powerplant Rating"
       ]
      }
     },
     "CBTE 165": {
      "title": "Webpage Creation with Dreamweaver",
      "identity": null
     },
     "CBTE 180": {
      "title": "Microsoft Office",
      "identity": {
       "kind": "CCR",
       "id": "BSOT M1215",
       "title": "Microsoft Office"
      }
     },
     "CBTE 210": {
      "title": "Computers in Business",
      "identity": {
       "kind": "CCR",
       "id": "BSOT M1090",
       "title": "Computers in Business"
      }
     },
     "CHIL 101": {
      "title": "Human Growth and Development",
      "identity": {
       "kind": "CCR",
       "id": "PSYC M1064",
       "title": "Human Growth and Development"
      }
     },
     "DIES 100": {
      "title": "Introduction to Diesel Technology",
      "identity": {
       "kind": "CCR",
       "id": "AUTO M1173",
       "title": "Introduction to Diesel Technology"
      }
     },
     "DIES 105": {
      "title": "Measuring Tools and Applied Mathematics",
      "identity": null
     },
     "EXSC 292A": {
      "title": "Yoga Teacher Training Essentials",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1517",
       "title": "Yoga Teacher Training Essentials"
      }
     },
     "EXSC 242B": {
      "title": "Care and Prevention of Injuries",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1402",
       "title": "Care and Prevention of Injuries"
      }
     },
     "MUSI 190": {
      "title": "Introduction to Music Technology",
      "identity": {
       "kind": "CCR",
       "id": "MUSI M1485",
       "title": "Introduction to Music Technology"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 2,
       "credentials": [
        {
         "credential": "Introduction to Music Technology",
         "colleges": [
          "Las Positas College",
          "Los Angeles Pierce College"
         ]
        }
       ]
      }
     },
     "REAL 101": {
      "title": "Real Estate Principles",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1040",
       "title": "Real Estate Principles"
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 12,
       "credentials": [
        {
         "credential": "Real Estate Principles",
         "colleges": [
          "Chaffey College",
          "City College of San Francisco",
          "Copper Mountain College",
          "Los Angeles Harbor College",
          "Modesto Junior College",
          "West Los Angeles College"
         ]
        },
        {
         "credential": "California Real Estate Salesperson License",
         "colleges": [
          "Chabot College",
          "City College of San Francisco",
          "Saddleback College",
          "Santa Barbara City College",
          "West Los Angeles College"
         ]
        },
        {
         "credential": "First Tuesday Real Estate Courses",
         "colleges": [
          "City College of San Francisco",
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        },
        {
         "credential": "Real Estate Principles and Practices",
         "colleges": [
          "City College of San Francisco",
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        }
       ]
      }
     },
     "WORK 272": {
      "title": "General Work Experience",
      "identity": {
       "kind": "CCR",
       "id": "WEXP M1001",
       "title": "Work Experience Education"
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "A page break splits the supplemental business list: page 2 opens with a 'Courses / Total Units: 27.0-31.0' header, then ACCT 102, ACCT 150 and CISC 181 before the occupational list begins. I read these three courses as a continuation of the supplemental business block (3-4 units). That reading is consistent with the stated total, 21 + 3-4 + 3-6 = 27-31. A reviewer should confirm it."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "I took the 27.0-31.0 'Total Units' printed at the page-2 header as the program total."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The closed list stores ACCT 150 as 'ACCT150' with no space. The catalog prints 'ACCT 150'; I treated these as the same course, so it is not a catalog addition."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The closed list's AVIA 101 title reads 'Private Pilot Grounded School'; the catalog prints 'Private Pilot Ground School'. These are the same course."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "Both 'or' pairs, BUSE 102/BUSE 150 and BUSE 155/BUSE 157, print 3.0 units for the pair. Each pair is recorded as one required entry with an alternative."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "BUSE 155, BUSE 157 and BUSE 229A-D appear in both elective lists, and in the required list as well. The catalog states 'not already selected above'."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The catalog states no general education pattern in this section; it notes only the 60-unit associate degree minimum."
     }
    ],
    "map": {
     "host": "san-diego-miramar.programmapper.com",
     "url": null,
     "checked_run": "program-sequence-ppm run 37197332656",
     "status": "refused",
     "text": "Miramar's Program Pathways Mapper, linked from sdmiramar.edu/program-mapper, answered all seven of the reader's requests 403 Forbidden on 2026-10-04 (sequence run 37197332656), and the 17 other mapper hosts probed that day did the same: the refusal is the mapper service's. The pilot's sequence for Fire Technology A.S. (05100) is not yet read. The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college's own pages and in its catalog, and asks this host's front page once a run whether it has opened (Sam, open-asks sheet 29 card 3, 2026-10-04)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 39,
      "listed": 39
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "miramar_41496",
   "college": "San Diego Miramar College",
   "control_number": "41496",
   "title": "Business Administration 2.0",
   "award": "A.S. T Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://sdccd.curriqunet.com/Catalog/Export?id=71&outlineId=20004",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "BUSINESS ADMINISTRATION 2.0 - ASSOCIATE IN SCIENCE FOR TRANSFER DEGREE: MIRAMAR",
     "measure": "units",
     "total_units": {
      "min": 26,
      "max": 28
     },
     "open_elective_units": null,
     "ge_pattern": "Cal-GETC"
    },
    "blocks": [
     {
      "name": "COURSES REQUIRED FOR THE MAJOR",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 20,
       "max": 20
      },
      "courses": [
       {
        "code": "BUSE 119",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUSE 140",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ACCT 116A",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ACCT 116B",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ECON C2002",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "ECON C2001",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       }
      ]
     },
     {
      "name": "Select one of the following statistics courses",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 3
      },
      "courses": [
       {
        "code": "BUSE 115",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "STAT C1000",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Select one of the following calculus courses",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 5
      },
      "courses": [
       {
        "code": "MATH 121",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "MATH 150",
        "units": 5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 3.0,
     "measure": "units",
     "total": {
      "min": 26,
      "max": 28
     },
     "picks": [
      "BUSE 119"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 10,
     "here": 1,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "BUSE 119": {
      "title": "Business Communications",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1150",
       "title": "Business Communications"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Machinist's Mate"
       ]
      }
     },
     "BUSE 140": {
      "title": "Business Law and the Legal Environment",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1169",
       "title": "Business Law and the Legal Environment"
      }
     },
     "ACCT 116A": {
      "title": "Financial Accounting",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1046",
       "title": "Financial Accounting"
      }
     },
     "ACCT 116B": {
      "title": "Managerial Accounting",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1079",
       "title": "Managerial Accounting"
      }
     },
     "ECON C2002": {
      "title": null,
      "identity": null
     },
     "ECON C2001": {
      "title": null,
      "identity": null
     },
     "BUSE 115": {
      "title": "Statistics for Business",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1213",
       "title": "Business Statistics"
      }
     },
     "STAT C1000": {
      "title": "Introduction to Statistics",
      "identity": null
     },
     "MATH 121": {
      "title": "Basic Techniques of Applied Calculus I",
      "identity": {
       "kind": "CCR",
       "id": "MATH M1110",
       "title": "Basic Techniques of Applied Calculus 1"
      }
     },
     "MATH 150": {
      "title": "Calculus with Analytic Geometry I",
      "identity": {
       "kind": "CCR",
       "id": "MATH M1099",
       "title": "Calculus with Analytic Geometry 1"
      }
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "San Diego Miramar College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists ECON 120; the reader found it not in the text; catalog lists ECON C2002 Principles of Macroeconomics instead."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "San Diego Miramar College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists ECON 121; the reader found it not in the text; catalog lists ECON C2001 Principles of Microeconomics instead."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "San Diego Miramar College's program record in the state's curriculum inventory",
      "text": "The catalog prints ECON C2002, ECON C2001 for this program; the state's Program Course File does not list them."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "ECON C2002 and ECON C2001 (common course numbering) replace closed-list ECON 120 and ECON 121; their descriptions state they are not open to students with previous credit for ECON 120/121. Recorded as catalog additions."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "Closed list prints STATC1000 without a space; treated as the same course as catalog's STAT C1000 (not a catalog addition)."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "San Diego Miramar College's CurriQunet META reading procedure",
      "text": "The 'COURSES REQUIRED FOR THE MAJOR' heading prints 20.0 units, which matches only the six required courses; the two selection lists are recorded as separate choose-one blocks. Program total 26.0-28.0 is the 'Courses Total Units' line."
     }
    ],
    "map": {
     "host": "san-diego-miramar.programmapper.com",
     "url": null,
     "checked_run": "program-sequence-ppm run 37197332656",
     "status": "refused",
     "text": "Miramar's Program Pathways Mapper, linked from sdmiramar.edu/program-mapper, answered all seven of the reader's requests 403 Forbidden on 2026-10-04 (sequence run 37197332656), and the 17 other mapper hosts probed that day did the same: the refusal is the mapper service's. The pilot's sequence for Fire Technology A.S. (05100) is not yet read. The reader keeps its name and never retries a refusal another way. It looks for the sequence on the college's own pages and in its catalog, and asks this host's front page once a run whether it has opened (Sam, open-asks sheet 29 card 3, 2026-10-04)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 8,
      "listed": 10
     },
     "additions": 2,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "mtsac_03086",
   "college": "Mt. San Antonio College",
   "control_number": "03086",
   "title": "Fire Technology",
   "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
   "catalog_year": "2026-2027",
   "source_url": "https://catalog.mtsac.edu/programs/programsaz/fire-officer-certification-technology/fire-technology-certificate/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Fire Technology (Certificate N0486)",
     "measure": "units",
     "total_units": {
      "min": 24,
      "max": 40
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "FIRE 1",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 2",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 3",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 4",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 5",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 13",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Choose two FIRE courses or FIRE 86 and KINF 53 plus one other FIRE Course",
      "rule": "choose_courses",
      "minimum": 2,
      "option_group": null,
      "stated": {
       "min": 6,
       "max": 22
      },
      "courses": [
       {
        "code": "FIRE 6",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 7",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 8",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 9",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 10",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 11",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 12",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "FIRE 86",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KINF 53",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 4.5,
     "measure": "units",
     "total": {
      "min": 24,
      "max": 40
     },
     "picks": [
      "FIRE 12"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 15,
     "here": 1,
     "adopt": 11,
     "consider": 0
    },
    "courses": {
     "FIRE 1": {
      "title": "Fire Protection Organization",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1347",
       "title": "Fire Protection Organization"
      },
      "adopt": {
       "credentials_n": 12,
       "colleges_n": 9,
       "credentials": [
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Lake Tahoe Community College",
          "Mendocino College",
          "San Diego Miramar College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Fire Protection Organization",
         "colleges": [
          "Lake Tahoe Community College",
          "Long Beach City College",
          "Merced College",
          "San Diego Miramar College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "Firefighter 1A",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Lake Tahoe Community College",
          "San Diego Miramar College"
         ]
        },
        {
         "credential": "Firefighter EMT Certificate",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Lake Tahoe Community College",
          "San Diego Miramar College"
         ]
        }
       ]
      }
     },
     "FIRE 2": {
      "title": "Fire Prevention Technology",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1349",
       "title": "Fire Prevention Technology"
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Fire Inspector 1A",
         "colleges": [
          "San Diego Miramar College"
         ]
        },
        {
         "credential": "Fire Prevention Technology",
         "colleges": [
          "Merced College"
         ]
        }
       ]
      }
     },
     "FIRE 3": {
      "title": "Fire Protection Equipment and Systems",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1315",
       "title": "Fire Protection Equipment and Systems"
      },
      "adopt": {
       "credentials_n": 6,
       "colleges_n": 6,
       "credentials": [
        {
         "credential": "Fire Inspector 1",
         "colleges": [
          "Bakersfield College",
          "City College of San Francisco",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Cabrillo College",
          "Sierra College"
         ]
        },
        {
         "credential": "Building Construction for Fire Protection",
         "colleges": [
          "Mendocino College"
         ]
        },
        {
         "credential": "Fire Inspector 1C",
         "colleges": [
          "San Diego Miramar College"
         ]
        }
       ]
      }
     },
     "FIRE 4": {
      "title": "Building Construction for Fire Protection",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1274",
       "title": "Building Construction for Fire Protection"
      },
      "adopt": {
       "credentials_n": 10,
       "colleges_n": 11,
       "credentials": [
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Bakersfield College",
          "Chabot College",
          "Chaffey College",
          "City College of San Francisco",
          "College of the Desert",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter 1A",
         "colleges": [
          "Bakersfield College",
          "Chabot College",
          "Chaffey College",
          "City College of San Francisco",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        },
        {
         "credential": "Building Construction for Fire Protection",
         "colleges": [
          "Chaffey College",
          "College of the Desert",
          "Lake Tahoe Community College",
          "Merced College",
          "Modesto Junior College",
          "San Diego Miramar College"
         ]
        },
        {
         "credential": "Firefighter EMT Certificate",
         "colleges": [
          "Bakersfield College",
          "Chaffey College",
          "City College of San Francisco",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        }
       ]
      }
     },
     "FIRE 5": {
      "title": "Fire Behavior and Combustion",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1268",
       "title": "Fire Behavior and Combustion"
      },
      "adopt": {
       "credentials_n": 9,
       "colleges_n": 14,
       "credentials": [
        {
         "credential": "Firefighter 1",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Chabot College",
          "Chaffey College",
          "City College of San Francisco",
          "College of the Sequoias",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Santa Ana College",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter 1A",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Chabot College",
          "Chaffey College",
          "City College of San Francisco",
          "College of the Sequoias",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        },
        {
         "credential": "Firefighter EMT Certificate",
         "colleges": [
          "Bakersfield College",
          "Cabrillo College",
          "Chaffey College",
          "City College of San Francisco",
          "College of the Sequoias",
          "Lake Tahoe Community College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        },
        {
         "credential": "Fire Behavior and Combustion",
         "colleges": [
          "Cabrillo College",
          "Chaffey College",
          "Lake Tahoe Community College",
          "Merced College",
          "Modesto Junior College"
         ]
        }
       ]
      }
     },
     "FIRE 13": {
      "title": "Principles of Fire and Emergency Services Safety and Survival",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1308",
       "title": "Principles of Fire and Emergency Services Safety and Survival"
      },
      "adopt": {
       "credentials_n": 4,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Principles of Fire and Emergency Services Safety and Survival",
         "colleges": [
          "Chaffey College",
          "Modesto Junior College"
         ]
        },
        {
         "credential": "Firefighter II",
         "colleges": [
          "Bakersfield College"
         ]
        },
        {
         "credential": "Firefighting Technology",
         "colleges": [
          "Chaffey College"
         ]
        },
        {
         "credential": "Professional Fire Service Experience",
         "colleges": [
          "College of the Desert"
         ]
        }
       ]
      }
     },
     "FIRE 6": {
      "title": "Hazardous Materials/ICS",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1373",
       "title": "Hazardous Materials - ICS"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Professional Fire Service Experience",
         "colleges": [
          "College of the Desert"
         ]
        }
       ]
      }
     },
     "FIRE 7": {
      "title": "Fire Fighting Tactics and Strategy",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1325",
       "title": "Fire Fighting Tactics and Strategy"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Fire Company Officer 2D & 2E",
         "colleges": [
          "San Diego Miramar College"
         ]
        }
       ]
      }
     },
     "FIRE 8": {
      "title": "Fire Company Organization and Management",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1290",
       "title": "Fire Company Organization and Management"
      }
     },
     "FIRE 9": {
      "title": "Fire Hydraulics",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1332",
       "title": "Fire Hydraulics"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Fire Apparatus Driver/Operator 1A",
         "colleges": [
          "Sierra College"
         ]
        }
       ]
      }
     },
     "FIRE 10": {
      "title": "Arson and Fire Investigation",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "FIRE 11": {
      "title": "Fire Apparatus and Equipment",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1249",
       "title": "Fire Apparatus and Equipment"
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Fire Apparatus Driver/Operator 1A",
         "colleges": [
          "Chaffey College",
          "San Diego Miramar College",
          "Sierra College"
         ]
        },
        {
         "credential": "Fire Apparatus and Equipment",
         "colleges": [
          "Chaffey College",
          "Copper Mountain College"
         ]
        },
        {
         "credential": "Fire Apparatus Driver/Operator 1A and 1B",
         "colleges": [
          "San Diego Miramar College"
         ]
        }
       ]
      }
     },
     "FIRE 12": {
      "title": "Wildland Fire Control",
      "units_from_state_file": 4.5,
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1297",
       "title": "Wildland Fire Control"
      },
      "here": {
       "recs": 1,
       "credentials_n": 22,
       "credentials": [
        "Aircrew Survival Equipment Class A1",
        "Airman",
        "Aviation Ordnanceman",
        "Aviation Ordnanceman 'A' School, Class A1"
       ]
      },
      "adopt": {
       "credentials_n": 7,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "NWCG Wildland Fire Certifications (S-190 / S-290 / ICS-100 / ICS-700 bundle)",
         "colleges": [
          "Chaffey College",
          "City College of San Francisco"
         ]
        },
        {
         "credential": "Wildland Fire Control",
         "colleges": [
          "Chaffey College",
          "Columbia College"
         ]
        },
        {
         "credential": "NWCG Wildland Fire Certifications (S-110 / IS-700 / IS-800 / P-101 / FI-110 / ICS-300 bundle)",
         "colleges": [
          "City College of San Francisco"
         ]
        },
        {
         "credential": "NWCG Wildland Fire Certifications (S-130 / S-219 / S-230 / S-231 / S-270 bundle)",
         "colleges": [
          "City College of San Francisco"
         ]
        }
       ]
      }
     },
     "FIRE 86": {
      "title": "Basic Fire Academy",
      "identity": {
       "kind": "CCR",
       "id": "FIRE M1209",
       "title": "Basic Fire Academy"
      }
     },
     "KINF 53": {
      "title": "Physical Training for the Basic Fire Academy",
      "units_from_state_file": 2.5,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Fixed by a rerun",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "A person's reading found a misread; the fix went into the procedure, and the rerun's record is the one shown."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The elective block offers two paths: (a) any two FIRE courses from the list, or (b) FIRE 86 and KINF 53 plus one other FIRE course from the list. Recorded as choose_courses minimum 2; the second path (three courses including FIRE 86 and KINF 53) is described here only."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The catalog prints no units beside the courses in the elective block, only the block total 6-22; course units left null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The closed list writes FIRE2 and FIRE86 without a space; matched to the catalog's FIRE 2 and FIRE 86 and treated as not catalog additions."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The page description calls this the 'Fire Science Certificate' while the heading reads Fire Technology (Certificate N0486)."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152834Z-s2of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Mt. San Antonio College's site (census run census-20261004T152834Z-s2of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 15,
      "listed": 15
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "fix"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "mtsac_08086",
   "college": "Mt. San Antonio College",
   "control_number": "08086",
   "title": "Nursing- Licensed Vocational Nurse (LVN) to Registered Nurse (RN) Option",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://catalog.mtsac.edu/programs/programsaz/nursing/licensed-vocational-nurse-lvn-to-registered-nurse-rn-option-degree/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Nursing - Licensed Vocational Nurse (LVN) to Registered Nurse (RN) Option (AS Degree S0957)",
     "measure": "units",
     "total_units": {
      "min": 49.5,
      "max": 52.5
     },
     "open_elective_units": null,
     "ge_pattern": "Mt. SAC local associate degree GE areas"
    },
    "blocks": [
     {
      "name": "Select one of the following sequences: (ANAT 10A, ANAT 10B)",
      "rule": "all",
      "minimum": null,
      "option_group": "anatomy_physiology_sequence",
      "stated": {
       "min": 8,
       "max": 10
      },
      "courses": [
       {
        "code": "ANAT 10A",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ANAT 10B",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Select one of the following sequences: (ANAT 35, ANAT 36)",
      "rule": "all",
      "minimum": null,
      "option_group": "anatomy_physiology_sequence",
      "stated": {
       "min": 8,
       "max": 10
      },
      "courses": [
       {
        "code": "ANAT 35",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ANAT 36",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "CHLD 10",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "CHLD 10H",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "PSYC 14",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "PSYC 14H",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "COMM C1000",
        "units": 4,
        "units_max": null,
        "alternatives": [
         {
          "code": "COMM C1000H",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "COMM 2",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "COMM 8",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "COMM 8H",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "ENGL C1000",
        "units": 4,
        "units_max": null,
        "alternatives": [
         {
          "code": "ENGL C1000H",
          "units": null,
          "catalog_addition": false
         },
         {
          "code": "AMLA 1A",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "MICR 1",
        "units": 4,
        "units_max": 5,
        "alternatives": [
         {
          "code": "MICR 22",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "NURS 114",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 115",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 206",
        "units": 6,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 207",
        "units": 2.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 210",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 211",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "NURS 212",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "PSYC C1000",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "PSYC C1000H",
          "units": null,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "units",
     "total": {
      "min": 49.5,
      "max": 52.5
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 27,
     "here": 0,
     "adopt": 1,
     "consider": 0
    },
    "courses": {
     "ANAT 10A": {
      "title": "Introductory Human Anatomy",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "ANAT 10B": {
      "title": "Introductory Human Physiology",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "ANAT 35": {
      "title": "Human Anatomy",
      "units_from_state_file": 5.0,
      "identity": {
       "kind": "CCR",
       "id": "BIOL M1023",
       "title": "Human Anatomy"
      }
     },
     "ANAT 36": {
      "title": "Human Physiology",
      "units_from_state_file": 5.0,
      "identity": {
       "kind": "CCR",
       "id": "BIOL M1229",
       "title": "Human Physiology"
      }
     },
     "CHLD 10": {
      "title": "Human Growth and Lifespan Development",
      "identity": null
     },
     "CHLD 10H": {
      "title": "Human Growth and Lifespan Development - Honors",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "PSYC 14": {
      "title": "Developmental Psychology",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "PSYC 14H": {
      "title": "Developmental Psychology - Honors",
      "units_from_state_file": 3.0,
      "identity": {
       "kind": "CCR",
       "id": "PSYC M1069",
       "title": "Developmental Psychology - Honors"
      }
     },
     "COMM C1000": {
      "title": "Introduction to Public Speaking",
      "identity": null
     },
     "COMM C1000H": {
      "title": "Introduction to Public Speaking - Honors",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "COMM 2": {
      "title": "Survey of Communication Studies",
      "units_from_state_file": 4.0,
      "identity": {
       "kind": "CCR",
       "id": "COMM M1061",
       "title": "Survey of Communication Studies"
      }
     },
     "COMM 8": {
      "title": "Professional and Organizational Speaking",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "COMM 8H": {
      "title": "Professional and Organizational Speaking - Honors",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "ENGL C1000": {
      "title": "Academic Reading and Writing",
      "identity": null
     },
     "ENGL C1000H": {
      "title": "Academic Reading and Writing - Honors",
      "units_from_state_file": 4.0,
      "identity": null
     },
     "AMLA 1A": {
      "title": "College Composition for Non-Native English Speakers",
      "units_from_state_file": 4.0,
      "identity": {
       "kind": "CCR",
       "id": "ENGL M1142",
       "title": "College Composition for Non-Native English Speakers"
      }
     },
     "MICR 1": {
      "title": "Medical Microbiology",
      "identity": {
       "kind": "CCR",
       "id": "BIOL M1256",
       "title": "Principles of Microbiology"
      }
     },
     "MICR 22": {
      "title": "Microbiology",
      "units_from_state_file": 4.0,
      "identity": {
       "kind": "CCR",
       "id": "BIOL M1254",
       "title": "Microbiology"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Microbiology",
         "colleges": [
          "Modesto Junior College"
         ]
        }
       ]
      }
     },
     "NURS 114": {
      "title": "Maternal-Newborn Nursing",
      "identity": {
       "kind": "CCR",
       "id": "NRSR M1169",
       "title": "Maternity Nursing"
      }
     },
     "NURS 115": {
      "title": "Pediatric Nursing",
      "identity": {
       "kind": "CCR",
       "id": "NRSR M1175",
       "title": "Pediatric Nursing"
      }
     },
     "NURS 206": {
      "title": "Medical-Surgical Nursing: Nutrition/Elimination/ Surgical Asepsis",
      "identity": null
     },
     "NURS 207": {
      "title": "Psychiatric Mental Health Nursing",
      "identity": {
       "kind": "CCR",
       "id": "NRSR M1186",
       "title": "Psychiatric Nursing"
      }
     },
     "NURS 210": {
      "title": "Medical-Surgical Nursing: Perfusion and Oxygenation",
      "identity": null
     },
     "NURS 211": {
      "title": "Medical-Surgical Nursing: Integration/Regulation",
      "identity": {
       "kind": "CCR",
       "id": "NRSR M1143",
       "title": "Medical-Surgical Nursing: Integration/Regulation"
      }
     },
     "NURS 212": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "NRSR M1182",
       "title": "Preceptorship in Nursing"
      }
     },
     "PSYC C1000": {
      "title": "Introduction to Psychology",
      "identity": null
     },
     "PSYC C1000H": {
      "title": "Introduction to Psychology - Honors",
      "units_from_state_file": 3.0,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Mt. San Antonio College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists NURS 11; the reader found it not in the text; catalog prints NURS 212 Preceptorship in Nursing (same title) instead."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Mt. San Antonio College's program record in the state's curriculum inventory",
      "text": "The catalog prints NURS 212 for this program; the state's Program Course File does not list it."
     },
     {
      "kind": "Fixed by a rerun",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "A person's reading found a misread; the fix went into the procedure, and the rerun's record is the one shown."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The 8-10 unit total is printed once for the 'Select one of the following sequences' heading; it is recorded on both sequence blocks. The catalog prints the sequences as paired 'or' rows (ANAT 10A or ANAT 35; ANAT 10B or ANAT 36), read as sequence ANAT 10A+10B or ANAT 35+36."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "No units are printed beside the individual ANAT courses in the Required Courses list (the Prerequisite list prints 4-5 for each pair); units left null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Alternatives ('or' rows) print no units of their own; their units are left null. The row's printed units appear only on the first course."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Closed list stores 'MICR1' without a space; the catalog prints 'MICR 1' Medical Microbiology. Treated as the same course (catalog_addition false); reviewer may confirm."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "NURS 212 Preceptorship in Nursing (2 units) is not in the closed list, which has NURS 11 Preceptorship in Nursing (2 units) — possible renumbering."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The Prerequisite Courses and ADN General Education Requirements lists repeat courses already in Required Courses and were not recorded as separate blocks."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "NURS 200 Role Transition is a non-course entrance requirement (credit grade prior to entry) and is not in the Required Courses list or total."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Additional GE areas (Math, Arts and Humanities, History/Political Science, Ethnic Studies) and graduation requirements are named but not part of the major total."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152834Z-s2of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Mt. San Antonio College's site (census run census-20261004T152834Z-s2of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 26,
      "listed": 27
     },
     "additions": 1,
     "arithmetic": "equal",
     "reviewer": "fix"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "mtsac_33876",
   "college": "Mt. San Antonio College",
   "control_number": "33876",
   "title": "Early Childhood Education",
   "award": "A.S. T Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://catalog.mtsac.edu/programs/programsaz/child-development/as-early-childhood-education-transfer/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Early Childhood Education (AS-T Degree S0401)",
     "measure": "units",
     "total_units": {
      "min": 24,
      "max": 24
     },
     "open_elective_units": null,
     "ge_pattern": "Cal-GETC"
    },
    "blocks": [
     {
      "name": "Core Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 24,
       "max": 24
      },
      "courses": [
       {
        "code": "CHLD 1",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 5",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 6",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 11",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 50",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 64",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 66",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 66L",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Choose one of the following sequences: CHLD 67 & 67L",
      "rule": "all",
      "minimum": null,
      "option_group": "Practicum sequence",
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "CHLD 67",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 67L",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Choose one of the following sequences: CHLD 86 & CHLD 87",
      "rule": "all",
      "minimum": null,
      "option_group": "Practicum sequence",
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "CHLD 86",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHLD 87",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "units",
     "total": {
      "min": 24,
      "max": 24
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 12,
     "here": 0,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "CHLD 1": {
      "title": "Child, Family, School and Community",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 5": {
      "title": "Principles and Practices in Child Development Programs",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 6": {
      "title": "Introduction to Child Development Curriculum",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 11": {
      "title": "Child and Adolescent Development",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 50": {
      "title": "Teaching in a Diverse Society",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 64": {
      "title": "Health, Safety and Nutrition of Children",
      "units_from_state_file": 3.0,
      "identity": null
     },
     "CHLD 66": {
      "title": "Early Childhood Development Observation and Assessment",
      "units_from_state_file": 2.0,
      "identity": null
     },
     "CHLD 66L": {
      "title": "Early Childhood Development Observation and Assessment Laboratory",
      "units_from_state_file": 1.0,
      "identity": null
     },
     "CHLD 67": {
      "title": "Early Childhood Education Practicum",
      "units_from_state_file": 2.0,
      "identity": null
     },
     "CHLD 67L": {
      "title": "Early Childhood Education Practicum Laboratory",
      "units_from_state_file": 1.0,
      "identity": null
     },
     "CHLD 86": {
      "title": "Infant Toddler Practicum Seminar",
      "units_from_state_file": 2.0,
      "identity": null
     },
     "CHLD 87": {
      "title": "Infant Toddler Practicum Field Work Experience",
      "units_from_state_file": 1.0,
      "identity": {
       "kind": "CCR",
       "id": "WEXP M1001",
       "title": "Work Experience Education"
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The catalog prints no units beside individual courses; the trailing '1' and '2' after course titles and after 'Choose one of the following sequences:' are footnote markers (TB clearance; immunization documentation), not units, so course units are left null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "'Core Courses 24' is printed as the heading total; it equals the 'Total Units for Major 24' and appears to include the practicum sequence choice (18 + 3 for CHLD 66/66L + 3 for the sequence = 24 using closed-list units). It is recorded on the Core Courses block as printed; a reviewer may prefer to treat it as the major total only."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The page heading reads 'AS-T Degree'; General Education (Cal-GETC) 34 units and degree total 60 units are not recorded as the award total."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Footnote 3 states courses may be double-counted for the major and Cal-GETC."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152834Z-s2of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Mt. San Antonio College's site (census run census-20261004T152834Z-s2of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 12,
      "listed": 12
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "mtsac_42916",
   "college": "Mt. San Antonio College",
   "control_number": "42916",
   "title": "Vocational Nursing",
   "award": "Noncredit program",
   "catalog_year": "2026-2027",
   "source_url": "https://catalog.mtsac.edu/programs/noncredit-programs/programsaz/vocational-programs/voc-health-careers/vocational-nursing/",
   "platform": "courseleaf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Vocational Nursing",
     "measure": "units",
     "total_units": {
      "min": null,
      "max": null
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "VOC VN100",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN101",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN102",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN120",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN122",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN124",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN130",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN132",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC VN134",
        "units": null,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "units",
     "total": {
      "min": null,
      "max": null
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 9,
     "here": 0,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "VOC VN100": {
      "title": "Vocational Nursing Anatomy and Physiology",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN101": {
      "title": "Fundamentals of Vocational Nursing Practice",
      "units_from_state_file": 0.0,
      "identity": {
       "kind": "CCR",
       "id": "VOCE M1001",
       "title": "Fundamentals of Vocational Nursing Practice"
      }
     },
     "VOC VN102": {
      "title": "Vocational Nursing Pharmacology",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN120": {
      "title": "Vocational Nursing Care of the Adult with Medical-Surgical Diagnosis 1",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN122": {
      "title": "Life Span Development for Vocational Nurses",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN124": {
      "title": "Psychology and Behavioral Health Vocational Nursing",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN130": {
      "title": "Vocational Nursing Care of the Adult with Medical-Surgical Diagnosis 2",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN132": {
      "title": "Leadership and Supervision in Vocational Nursing",
      "units_from_state_file": 0.0,
      "identity": null
     },
     "VOC VN134": {
      "title": "Vocational Nursing Care of the Family",
      "units_from_state_file": 0.0,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Mt. San Antonio College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists VOC HEP; the reader found it listed as a recommended elective, not required."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Mt. San Antonio College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists VOC NCLXP; the reader found it listed as a recommended elective, not required."
     },
     {
      "kind": "No printed total",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "The catalog prints no program total, so the units cannot be checked against one."
     },
     {
      "kind": "Possible misread",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "A noncredit program recorded in units; noncredit programs count hours."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Noncredit Certificate of Completion (#42916); the catalog prints no hours or units beside any course and no program total, so measure is left as 'units' with all values null. A reviewer may want to confirm hours from another source."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "Text states 'Students must pass all nine core courses to earn the Vocational Nursing certificate', matching the nine required courses recorded."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Mt. San Antonio College's CourseLeaf reading procedure",
      "text": "VOC HEP and VOC NCLXP appear under 'Recommended Elective' and were not placed as requirements."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152834Z-s2of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Mt. San Antonio College's site (census run census-20261004T152834Z-s2of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 9,
      "listed": 11
     },
     "additions": 0,
     "arithmetic": "unstated",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "riverside_22804",
   "college": "Riverside City College",
   "control_number": "22804",
   "title": "Culinary Arts",
   "award": "Certificate of Achievement requiring 30S/45Q to fewer than 60S/90Q units",
   "catalog_year": "2026-2027",
   "source_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/5941",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Culinary Arts - Associate of Science Degree and Certificate of Achievement - AS2000/AS2000C/CE2000",
     "measure": "units",
     "total_units": {
      "min": 33.5,
      "max": 33.5
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses (33.5 Units)",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 33.5,
       "max": 33.5
      },
      "courses": [
       {
        "code": "CUL-20",
        "units": 2,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-36",
        "units": 8.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-37",
        "units": 8.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-38",
        "units": 8.5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN-4",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "MAG-56",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 3.0,
     "measure": "units",
     "total": {
      "min": 33.5,
      "max": 33.5
     },
     "picks": [
      "MAG-56"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 6,
     "here": 1,
     "adopt": 1,
     "consider": 0
    },
    "courses": {
     "CUL-20": {
      "title": "Fundamentals of Baking I",
      "identity": null
     },
     "CUL-36": {
      "title": "Introduction to Culinary Arts",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1027",
       "title": "Introduction to Culinary Arts"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Credit by exam",
         "colleges": [
          "Saddleback College"
         ]
        }
       ]
      }
     },
     "CUL-37": {
      "title": "Intermediate Culinary Arts",
      "identity": null
     },
     "CUL-38": {
      "title": "Advanced Culinary Arts",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1003",
       "title": "Advanced Culinary Arts"
      }
     },
     "KIN-4": {
      "title": "Nutrition",
      "identity": {
       "kind": "CCR",
       "id": "NUTR M1034",
       "title": "Nutrition"
      }
     },
     "MAG-56": {
      "title": "HRM: Human Resources Management",
      "identity": {
       "kind": "CCR",
       "id": "MGMT M1023",
       "title": "HRM: Human Resources Management"
      },
      "here": {
       "recs": 2,
       "credentials_n": 7,
       "credentials": [
        "Infantry Unit Leader",
        "Military Police",
        "Center for Financial Training (CFT) — Human Resources Management",
        "McDonald's Business Leadership Practices"
       ]
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The section covers both the A.S. degree and the Certificate of Achievement under one shared requirements list; the certificate requirements are read from that shared list."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "KIN-4 in the catalog matches closed-list entry 'KIN4' (no units stored); it is treated as the same course, and the catalog prints 3.00 units."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The A.S. degree adds general education, but no GE pattern is named, and GE does not apply to the certificate, so ge_pattern is null."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152832Z-s4of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Riverside City College's site (census run census-20261004T152832Z-s4of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 6,
      "listed": 6
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "riverside_31456",
   "college": "Riverside City College",
   "control_number": "31456",
   "title": "Administration of Justice",
   "award": "A.S. T Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/Admin_Justice_ADT",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Administration of Justice - Associate in Science for Transfer (ADT) - AS643 (CalGETC)",
     "measure": "units",
     "total_units": {
      "min": 18,
      "max": 19
     },
     "open_elective_units": null,
     "ge_pattern": "Cal-GETC"
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 6,
       "max": 6
      },
      "courses": [
       {
        "code": "ADJ-1",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "ADJ-1H",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "ADJ-3",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "ADJ-3H",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Elective Courses - List A",
      "rule": "choose_units",
      "minimum": 6,
      "option_group": null,
      "stated": {
       "min": 6,
       "max": 6
      },
      "courses": [
       {
        "code": "ADJ-2",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-4",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-5",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-12",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "ADJ-13",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "ADJ-20",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Elective Courses - List B",
      "rule": "choose_units",
      "minimum": 6,
      "option_group": null,
      "stated": {
       "min": 6,
       "max": 7
      },
      "courses": [
       {
        "code": "ADJ-9",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "ADJ-9H",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "ADJ-19",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-24",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-27",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "PHO-27",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "ADJ-28",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "ADJ-31",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "PSYC-C1000",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "PSYC-C1000H",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "SOC-1",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "SOC-1H",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       },
       {
        "code": "SOC-20",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "STAT-C1000",
        "units": 4,
        "units_max": null,
        "alternatives": [
         {
          "code": "STAT-C1000H",
          "units": 4,
          "catalog_addition": false
         },
         {
          "code": "PSYC-48",
          "units": 4,
          "catalog_addition": false
         },
         {
          "code": "SOC-48",
          "units": 4,
          "catalog_addition": true
         }
        ],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 18.0,
     "measure": "units",
     "total": {
      "min": 18,
      "max": 19
     },
     "picks": [
      "ADJ-1",
      "ADJ-3",
      "ADJ-2",
      "ADJ-4",
      "ADJ-19",
      "ADJ-24"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 27,
     "here": 10,
     "adopt": 9,
     "consider": 0
    },
    "courses": {
     "ADJ-1": {
      "title": "Introduction to the Administration of Justice",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1043",
       "title": "Introduction to Administration of Justice"
      },
      "here": {
       "recs": 2,
       "credentials_n": 5,
       "credentials": [
        "Basic Military Police One Station Unit Training (OSUT)",
        "Maritime Enforcement Specialist",
        "Maritime Enforcement Specialist 'A' School (ME 'A')",
        "Maritime Enforcement Specialist Second Class"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "POST Basic Academy",
         "colleges": [
          "Cerro Coso Community College",
          "Chabot College",
          "San Bernardino Valley College"
         ]
        }
       ]
      }
     },
     "ADJ-1H": {
      "title": "Honors Introduction to the Administration of Justice",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1042",
       "title": "Honors Introduction to the Administration of Justice"
      }
     },
     "ADJ-3": {
      "title": "Concepts of Criminal Law",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1123",
       "title": "Concepts of Criminal Law"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "POST Basic Academy"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Criminal Law",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-3H": {
      "title": "Honors Concepts of Criminal Law",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1122",
       "title": "Honors Concepts of Criminal Law"
      }
     },
     "ADJ-2": {
      "title": "Principles and Procedures of the Justice System",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1281",
       "title": "Principles and Procedures of the Justice System"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "POST Basic Academy"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Principles and Procedures of the Criminal Justice System",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-4": {
      "title": "Legal Aspects of Evidence",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1077",
       "title": "Legal Aspects of Evidence"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "POST Basic Academy"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Criminal Evidence",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-5": {
      "title": "Community Relations",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1120",
       "title": "Community Relations"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "POST Basic Academy"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Community Relations",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-12": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1186",
       "title": "Introduction to Criminalistics"
      }
     },
     "ADJ-13": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1177",
       "title": "Criminal Investigation"
      },
      "here": {
       "recs": 1,
       "credentials_n": 5,
       "credentials": [
        "Basic Military Police One Station Unit Training (OSUT)",
        "Master-At-Arms",
        "Military Police",
        "Military Police Advanced Noncommissioned Officer (TATS)"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Criminal Investigation",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-20": {
      "title": "Introduction to Corrections",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1149",
       "title": "Introduction to Corrections"
      },
      "here": {
       "recs": 1,
       "credentials_n": 4,
       "credentials": [
        "Internment/Resettlement Specialist Advanced Individual Training",
        "Correctional Officer Core Course (CDCR/CPOST)",
        "Standards and Training for Corrections (STC) / Board of Parole Hearings",
        "Basic Correctional Officer Academy"
       ]
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "POST Basic Academy",
         "colleges": [
          "Barstow Community College",
          "Cerro Coso Community College",
          "Lake Tahoe Community College"
         ]
        },
        {
         "credential": "Introduction to Corrections",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-9": {
      "title": "Law in American Society",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1068",
       "title": "Law in American Society"
      }
     },
     "ADJ-9H": {
      "title": "Honors Law in American Society",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1066",
       "title": "Honors Law in American Society"
      }
     },
     "ADJ-19": {
      "title": "Introduction to Policing",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1268",
       "title": "Introduction to Policing"
      },
      "here": {
       "recs": 2,
       "credentials_n": 9,
       "credentials": [
        "Basic Military Police One Station Unit Training (OSUT)",
        "Internment/Resettlement Specialist Advanced Individual Training",
        "Internment/Resettlement Specialist MOS Training Course (TATS)",
        "Master-At-Arms"
       ]
      }
     },
     "ADJ-24": {
      "title": "Interviewing & Interrogation",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1265",
       "title": "Interviewing & Interrogation"
      },
      "here": {
       "recs": 0,
       "credentials_n": 2,
       "credentials": [
        "Correctional Officer Core Course (CDCR/CPOST)",
        "Standards and Training for Corrections (STC) / Board of Parole Hearings"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Interview and Interrogation",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "ADJ-27": {
      "title": "Forensic & Crime Scene Photography",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1159",
       "title": "Forensic & Crime Scene Photography"
      }
     },
     "PHO-27": {
      "title": "Forensic & Crime Scene Photography",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1159",
       "title": "Forensic & Crime Scene Photography"
      }
     },
     "ADJ-28": {
      "title": "Crime Scene Investigation",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1161",
       "title": "Crime Scene Investigation"
      }
     },
     "ADJ-31": {
      "title": "Cybercrime & Digital Forensics",
      "identity": {
       "kind": "CCR",
       "id": "CRIM M1192",
       "title": "Cybercrime & Digital Forensics"
      }
     },
     "PSYC-C1000": {
      "title": "Introduction to Psychology",
      "identity": null
     },
     "PSYC-C1000H": {
      "title": "Introduction to Psychology - Honors",
      "identity": null
     },
     "SOC-1": {
      "title": "Introduction to Sociology",
      "identity": {
       "kind": "CCR",
       "id": "SOCI M1072",
       "title": "Introduction to Sociology"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "CLEP Introductory Sociology"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "Introduction to Sociology",
         "colleges": [
          "Modesto Junior College"
         ]
        }
       ]
      }
     },
     "SOC-1H": {
      "title": "Honors Introduction to Sociology",
      "identity": {
       "kind": "CCR",
       "id": "SOCI M1058",
       "title": "Honors Introduction to Sociology"
      }
     },
     "SOC-20": {
      "title": "Introduction to Criminology",
      "identity": {
       "kind": "CCR",
       "id": "SOCI M1023",
       "title": "Introduction to Criminology"
      }
     },
     "STAT-C1000": {
      "title": "Introduction to Statistics",
      "identity": null
     },
     "STAT-C1000H": {
      "title": "Introduction to Statistics - Honors",
      "identity": null
     },
     "PSYC-48": {
      "title": "Statistics for the Behavioral Sciences",
      "identity": null
     },
     "SOC-48": {
      "title": null,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Riverside City College's program record in the state's curriculum inventory",
      "text": "The catalog prints ADJ-12, ADJ-13, SOC-48 for this program; the state's Program Course File does not list them."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "List B also allows 'Any course in List A not already used'; those List A courses (ADJ-2, ADJ-4, ADJ-5, ADJ-12, ADJ-13, ADJ-20) are recorded only in the List A block."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "ADJ-12 and ADJ-13 appear in List A but are not in the closed list; marked as catalog additions."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "SOC-48 appears as a statistics alternative in List B but is not in the closed list; marked as a catalog addition."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The closed list stores 'PSYC48' without a space and with no units; matched to catalog PSYC-48 (4 units)."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "Required Courses block consists of two 'Select one of the following' choices, each an honors pair; recorded as one required block with honors twins as alternatives."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152832Z-s4of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Riverside City College's site (census run census-20261004T152832Z-s4of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 24,
      "listed": 24
     },
     "additions": 3,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "riverside_39033",
   "college": "Riverside City College",
   "control_number": "39033",
   "title": "Food Service Career and Certification Preparation",
   "award": "Noncredit program",
   "catalog_year": "2026-2027",
   "source_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/5981",
   "platform": "curriqunet",
   "measure": "hours",
   "record": {
    "program": {
     "section_heading": "Food Service Career & Certification Preparation - Certificate of Competency - CC8025",
     "measure": "hours",
     "total_units": {
      "min": 246,
      "max": 246
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 246,
       "max": 246
      },
      "courses": [
       {
        "code": "CUL-850",
        "units": 36,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-825",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-826",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-827",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-828A",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-828B",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-824",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CUL-842",
        "units": 30,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "hours",
     "total": {
      "min": 246,
      "max": 246
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 8,
     "here": 0,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "CUL-850": {
      "title": "ServSafe Food Safety",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1130",
       "title": "ServSafe Food Safety"
      }
     },
     "CUL-825": {
      "title": "Menu Planning",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1147",
       "title": "Menu Planning"
      }
     },
     "CUL-826": {
      "title": "Food Cost Accounting",
      "identity": null
     },
     "CUL-827": {
      "title": "Culinary Purchasing and Receiving",
      "identity": null
     },
     "CUL-828A": {
      "title": "Culinary Food Preparation I",
      "identity": null
     },
     "CUL-828B": {
      "title": "Culinary Food Preparation II",
      "identity": null
     },
     "CUL-824": {
      "title": "The Art Of Garde Manger",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1021",
       "title": "The Art of Garde Manger"
      }
     },
     "CUL-842": {
      "title": "International Cuisine",
      "identity": {
       "kind": "CCR",
       "id": "CULN M1092",
       "title": "International Cuisine"
      }
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The block heading reads 'Required Courses (240 Hours)', but the catalog also prints 'Hours 246.00' and 'Total: 246.00'. The course hours sum to 246 (36 + 7 x 30). I recorded 246 for the block and for the program total; a reviewer should check the 240 figure in the heading."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The award is a noncredit Certificate of Competency counted in hours. The closed list's 0 units are not used."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The catalog prints codes with hyphens (CUL-850). These match the closed-list codes (CUL 850)."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152832Z-s4of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Riverside City College's site (census run census-20261004T152832Z-s4of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 8,
      "listed": 8
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "riverside_40061",
   "college": "Riverside City College",
   "control_number": "40061",
   "title": "Cyber Defense",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://rccd.curriqunet.com/catalog/alias/rcc-catalog/iq/5852/6117/5943",
   "platform": "curriqunet",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "Cyber Defense - Associate of Science Degree - AS969/AS969C",
     "measure": "units",
     "total_units": {
      "min": 30,
      "max": 31
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 27,
       "max": 27
      },
      "courses": [
       {
        "code": "CIS-21A",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-25",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-26A",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-26B",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-27",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-30A",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-27A",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-27B",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       }
      ]
     },
     {
      "name": "Elective Courses",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 4
      },
      "courses": [
       {
        "code": "CIS-5",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "CIS-26F",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-21B",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-27C",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS-87A",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 21.0,
     "measure": "units",
     "total": {
      "min": 30,
      "max": 31
     },
     "picks": [
      "CIS-21A",
      "CIS-25",
      "CIS-26A",
      "CIS-26B",
      "CIS-27",
      "CIS-27B"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 13,
     "here": 6,
     "adopt": 4,
     "consider": 0
    },
    "courses": {
     "CIS-21A": {
      "title": "Linux Operating System Administration",
      "identity": null,
      "here": {
       "recs": 0,
       "credentials_n": 2,
       "credentials": [
        "CompTIA Linux+",
        "LPIC-1 Linux Administrator"
       ]
      }
     },
     "CIS-25": {
      "title": "Information and Communication Technology Essentials",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1208",
       "title": "Information and Communication Technology Essentials"
      },
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "CompTIA A+ (CIS-25)",
        "CompTIA A+"
       ]
      }
     },
     "CIS-26A": {
      "title": "Cisco Networking Academy 1A",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "CISCO CERTIFIED NETWORK ASSOCIATE",
        "Cisco Certified Network Associate (CCNA)"
       ]
      }
     },
     "CIS-26B": {
      "title": "Cisco Networking Academy 1B",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "CISCO CERTIFIED NETWORK ASSOCIATE",
        "Cisco Certified Network Associate (CCNA)"
       ]
      }
     },
     "CIS-27": {
      "title": "Information & Network Security",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CompTIA Security+ (CIS-27)"
       ]
      }
     },
     "CIS-30A": {
      "title": "Introduction to Python Programming",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1429",
       "title": "Introduction to Python Programming"
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "Introduction to Python Programming",
         "colleges": [
          "San Diego City College",
          "San Diego Mesa College",
          "San Diego Miramar College"
         ]
        },
        {
         "credential": "Credit by exam",
         "colleges": [
          "San Diego Mesa College"
         ]
        }
       ]
      }
     },
     "CIS-27A": {
      "title": "Computer Forensics Fundamentals",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1230",
       "title": "Computer Forensics Fundamentals"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "GIAC Certification",
         "colleges": [
          "College of the Desert"
         ]
        }
       ]
      }
     },
     "CIS-27B": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1286",
       "title": "Introduction to Cybersecurity: Ethical Hacking"
      },
      "here": {
       "recs": 0,
       "credentials_n": 1,
       "credentials": [
        "Certified Ethical Hacker (CEH)"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "CompTIA PenTest+",
         "colleges": [
          "Clovis Community College"
         ]
        }
       ]
      }
     },
     "CIS-5": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1161",
       "title": "Programming Concepts and Methodology 1: C++"
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "C Programming Language Certified Associate (CLA)",
         "colleges": [
          "Norco College"
         ]
        },
        {
         "credential": "C++ Certified Associate Programmer (CPA)",
         "colleges": [
          "Norco College"
         ]
        },
        {
         "credential": "CLP — C Certified Professional Programmer",
         "colleges": [
          "Norco College"
         ]
        }
       ]
      }
     },
     "CIS-26F": {
      "title": "CISCO Networking Security",
      "identity": null
     },
     "CIS-21B": {
      "title": "Linux Operating System Administration II",
      "identity": null
     },
     "CIS-27C": {
      "title": "Palo Alto Networks Firewall Essentials",
      "identity": null
     },
     "CIS-87A": {
      "title": "Introduction to IT Project Management",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1410",
       "title": "Introduction to IT Project Management"
      }
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "Riverside City College's program record in the state's curriculum inventory",
      "text": "The catalog prints CIS-27B, CIS-5 for this program; the state's Program Course File does not list them."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The Required Courses list prints 'Units: 27.00', while the listed courses sum to 27 units."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "CIS-27B (Introduction to Cybersecurity: Ethical Hacking) and CIS-5 (Programming Concepts and Methodology I:C++) are not in the closed list and are recorded as catalog additions."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The heading carries codes AS969/AS969C. Only the A.S. degree requirements appear in the text."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "Riverside City College's CurriQunet META reading procedure",
      "text": "The degree text names only 'general education' without naming a specific pattern, so ge_pattern is null."
     }
    ],
    "map": {
     "host": null,
     "url": null,
     "checked_run": "census-20261004T152832Z-s4of4",
     "status": "none",
     "text": "The weekly census found no published term-by-term program map on Riverside City College's site (census run census-20261004T152832Z-s4of4)."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 11,
      "listed": 11
     },
     "additions": 2,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "wlac_17111",
   "college": "West Los Angeles College",
   "control_number": "17111",
   "title": "Computer Network & Security Management",
   "award": "A.S. Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://www.wlac.edu/sites/wlac.edu/files/2026-08/2026_2027%20catalog.pdf",
   "platform": "pdf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "COMPUTER NETWORK AND SECURITY MANAGEMENT (AS)",
     "measure": "units",
     "total_units": {
      "min": 30,
      "max": 30
     },
     "open_elective_units": null,
     "ge_pattern": "LACCD GE Plan"
    },
    "blocks": [
     {
      "name": "Required courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 21,
       "max": 21
      },
      "courses": [
       {
        "code": "CIS 211",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 213",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 214",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 215",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 227",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 229",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 225",
        "units": 3,
        "units_max": null,
        "alternatives": [
         {
          "code": "CIS 230",
          "units": 3,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Major elective units (choose three from the following)",
      "rule": "choose_courses",
      "minimum": 3,
      "option_group": null,
      "stated": {
       "min": 9,
       "max": 9
      },
      "courses": [
       {
        "code": "CIS 104",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "CIS 106",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "CIS 107",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "CIS 110",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 112",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 192",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CIS 212",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CS 125",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 21.0,
     "measure": "units",
     "total": {
      "min": 30,
      "max": 30
     },
     "picks": [
      "CIS 211",
      "CIS 213",
      "CIS 214",
      "CIS 227",
      "CIS 229",
      "CIS 230",
      "CIS 212"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 16,
     "here": 7,
     "adopt": 3,
     "consider": 0
    },
    "courses": {
     "CIS 211": {
      "title": "Security+ Certification Preparation",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1188",
       "title": "Security+ Certification Preparation"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "TATS Signal Support Systems Specialist"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "CompTIA Security+",
         "colleges": [
          "Los Angeles Mission College"
         ]
        }
       ]
      }
     },
     "CIS 213": {
      "title": "A+ Certification Preparation-Software",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1190",
       "title": "A+ Certification Preparation-Software"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CompTIA A+"
       ]
      }
     },
     "CIS 214": {
      "title": "Introduction to Network+",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1419",
       "title": "Introduction to Network+"
      },
      "here": {
       "recs": 2,
       "credentials_n": 3,
       "credentials": [
        "CompTIA Network +",
        "Signal Support Systems Specialist",
        "CompTIA Network+"
       ]
      }
     },
     "CIS 215": {
      "title": "Network Security Fundamentals",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1368",
       "title": "Network Security Fundamentals"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "CompTIA Security+",
         "colleges": [
          "Long Beach City College"
         ]
        }
       ]
      }
     },
     "CIS 227": {
      "title": "Server Administration and Network Security",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1052",
       "title": "Server Administration and Network Security"
      },
      "here": {
       "recs": 3,
       "credentials_n": 1,
       "credentials": [
        "Signal Support Systems Specialist"
       ]
      }
     },
     "CIS 229": {
      "title": "Introduction to Cisco Network Fundamentals",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Signal Support Systems Specialist"
       ]
      }
     },
     "CIS 225": {
      "title": "Enterprise Networking, Security, & Automation",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1139",
       "title": "Enterprise Networking, Security, & Automation"
      }
     },
     "CIS 230": {
      "title": "Introduction to Cisco Routers",
      "identity": null,
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "Signal Support Systems Specialist"
       ]
      }
     },
     "CIS 104": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1112",
       "title": "Microcomputer Application Software"
      }
     },
     "CIS 106": {
      "title": null,
      "identity": null
     },
     "CIS 107": {
      "title": null,
      "identity": null
     },
     "CIS 110": {
      "title": "Apple Administration",
      "identity": null
     },
     "CIS 112": {
      "title": "OPERATING SYSTEMS - BEGINNING LINUX",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1152",
       "title": "Operating Systems - Beginning Linux"
      }
     },
     "CIS 192": {
      "title": "Introduction to Cloud Computing",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1197",
       "title": "Introduction to Cloud Computing"
      },
      "adopt": {
       "credentials_n": 5,
       "colleges_n": 3,
       "credentials": [
        {
         "credential": "AWS Certified Cloud Practitioner",
         "colleges": [
          "City College of San Francisco",
          "Los Angeles Mission College",
          "Santa Ana College"
         ]
        },
        {
         "credential": "CompTIA Cloud+",
         "colleges": [
          "City College of San Francisco",
          "Santa Ana College"
         ]
        },
        {
         "credential": "AWS Certified Solutions Architect — Associate",
         "colleges": [
          "Los Angeles Mission College"
         ]
        },
        {
         "credential": "AWS CloudOps Engineer - Associate",
         "colleges": [
          "Santa Ana College"
         ]
        }
       ]
      }
     },
     "CIS 212": {
      "title": "A+ Certification Preparation-Hardware",
      "identity": {
       "kind": "CCR",
       "id": "ITIS M1184",
       "title": "A+ Certification Preparation-Hardware"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CompTIA A+"
       ]
      }
     },
     "CS 125": {
      "title": null,
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists CIS 101; the reader found it named only in the preceding Paralegal program section."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists CIS 113; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists CIS 236; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists CIS 237; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The catalog prints CIS 104, CIS 106, CIS 107, CS 125 for this program; the state's Program Course File does not list them."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "The 6 'Additional Degree-applicable Elective Units' belong to the 60-unit degree total, not the 30-unit major total, so open_elective_units is null."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "CIS 225 OR CIS 230 recorded as one required entry with CIS 230 as alternative."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "The Certificate of Achievement (CA) section that follows has identical course lists; only the AS section was read."
     }
    ],
    "map": {
     "host": "programmap.wlac.edu",
     "url": "https://www.wlac.edu/academics/pathways/program-mapper",
     "checked_run": "program-sequence-ppm run 37198225537",
     "status": "not_read",
     "text": "The college's page about its program mapper answered on 2026-10-04 and links to programmap.wlac.edu, which has not been read. Every mapper host probed that day refused the reader."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 12,
      "listed": 16
     },
     "additions": 4,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "wlac_37050",
   "college": "West Los Angeles College",
   "control_number": "37050",
   "title": "Kinesiology",
   "award": "A.A- T Degree",
   "catalog_year": "2026-2027",
   "source_url": "https://www.wlac.edu/sites/wlac.edu/files/2026-08/2026_2027%20catalog.pdf",
   "platform": "pdf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "(heading not in excerpt; Kinesiology AA-T section preceding 'KINESIOLOGY (AA)')",
     "measure": "units",
     "total_units": {
      "min": 21,
      "max": 23
     },
     "open_elective_units": null,
     "ge_pattern": "Cal-GETC"
    },
    "blocks": [
     {
      "name": "Required core courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 11,
       "max": 11
      },
      "courses": [
       {
        "code": "ANATOMY 001",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN MAJ 100",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "PHYSIOL 001",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Movement-based electives (choose one course from three of the following areas)",
      "rule": "choose_courses",
      "minimum": 3,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 3
      },
      "courses": [
       {
        "code": "DANCETQ 111",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "DANCETQ 121",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 229",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 250",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": true
       },
       {
        "code": "KIN 329",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 334-1",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 350",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 251",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 251-1",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 287",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "KIN 387",
        "units": 1,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "List A (Select two courses)",
      "rule": "choose_courses",
      "minimum": 2,
      "option_group": null,
      "stated": {
       "min": 7,
       "max": 9
      },
      "courses": [
       {
        "code": "STAT C1000",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "HEALTH 012",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "PHYSICS 006",
        "units": 4,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "CHEM 051",
        "units": 5,
        "units_max": null,
        "alternatives": [
         {
          "code": "CHEM 060",
          "units": 5,
          "catalog_addition": false
         },
         {
          "code": "CHEM 101",
          "units": 5,
          "catalog_addition": false
         }
        ],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 1.0,
     "measure": "units",
     "total": {
      "min": 21,
      "max": 23
     },
     "picks": [
      "KIN 329"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 20,
     "here": 1,
     "adopt": 4,
     "consider": 0
    },
    "courses": {
     "ANATOMY 001": {
      "title": "Introduction To Human Anatomy",
      "identity": null
     },
     "KIN MAJ 100": {
      "title": "INTRODUCTION TO KINESIOLOGY",
      "identity": null
     },
     "PHYSIOL 001": {
      "title": "INTRODUCTION TO HUMAN PHYSIOLOGY",
      "identity": null
     },
     "DANCETQ 111": {
      "title": "BALLET TECHNIQUES I",
      "identity": {
       "kind": "CCR",
       "id": "DANC M1073",
       "title": "Ballet Techniques 1"
      }
     },
     "DANCETQ 121": {
      "title": "JAZZ DANCE TECHNIQUES I",
      "identity": {
       "kind": "CCR",
       "id": "DANC M1215",
       "title": "Jazz Dance Techniques 1"
      }
     },
     "KIN 229": {
      "title": "BODY CONDITIONING SKILLS",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1357",
       "title": "Body Conditioning Skills"
      }
     },
     "KIN 250": {
      "title": null,
      "identity": {
       "kind": "CCR",
       "id": "KINE M1855",
       "title": "Weight Training Skills"
      }
     },
     "KIN 329": {
      "title": "BODY CONDITIONING",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1349",
       "title": "Body Conditioning"
      },
      "here": {
       "recs": 1,
       "credentials_n": 2,
       "credentials": [
        "Basic Military Training",
        "Recruit Basic Military Training (BMT)"
       ]
      }
     },
     "KIN 334-1": {
      "title": "Fitness Walking I",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1606",
       "title": "Walking for Fitness"
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 2,
       "credentials": [
        {
         "credential": "Basic Military Training",
         "colleges": [
          "Madera College"
         ]
        },
        {
         "credential": "Generic Military Service Credit — Madera College",
         "colleges": [
          "Madera College"
         ]
        },
        {
         "credential": "Military Basic Training (Kinesiology credit)",
         "colleges": [
          "Napa Valley College"
         ]
        }
       ]
      }
     },
     "KIN 350": {
      "title": "WEIGHT TRAINING",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1013",
       "title": "Weight Training 1"
      },
      "adopt": {
       "credentials_n": 4,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Basic Military Training",
         "colleges": [
          "Cerro Coso Community College"
         ]
        },
        {
         "credential": "Military Basic Training (Kinesiology credit)",
         "colleges": [
          "Napa Valley College"
         ]
        },
        {
         "credential": "Military Recruit Training (Basic Training)",
         "colleges": [
          "Cuesta College"
         ]
        },
        {
         "credential": "Personal Training Certification",
         "colleges": [
          "Madera College"
         ]
        }
       ]
      }
     },
     "KIN 251": {
      "title": "YOGA SKILLS",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1674",
       "title": "Yoga Skills 1"
      }
     },
     "KIN 251-1": {
      "title": "YOGA SKILLS- I",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1674",
       "title": "Yoga Skills 1"
      }
     },
     "KIN 287": {
      "title": "BASKETBALL SKILLS",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1255",
       "title": "Basketball Skills 1"
      }
     },
     "KIN 387": {
      "title": "BASKETBALL",
      "identity": {
       "kind": "CCR",
       "id": "KINE M1244",
       "title": "Basketball"
      }
     },
     "STAT C1000": {
      "title": "Introduction to Statistics",
      "identity": null
     },
     "HEALTH 012": {
      "title": "Safety Education And First Aid",
      "identity": null
     },
     "PHYSICS 006": {
      "title": "General Physics I",
      "identity": {
       "kind": "CCR",
       "id": "PHYS M1045",
       "title": "General Physics 1"
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "AP Physics 1: Algebra-Based",
         "colleges": [
          "Los Angeles Pierce College"
         ]
        }
       ]
      }
     },
     "CHEM 051": {
      "title": "Fundamentals Of Chemistry I",
      "identity": {
       "kind": "CCR",
       "id": "CHEM M1049",
       "title": "Fundamentals of Chemistry 1"
      }
     },
     "CHEM 060": {
      "title": "Introduction To General Chemistry",
      "identity": {
       "kind": "CCR",
       "id": "CHEM M1060",
       "title": "Introduction to General Chemistry"
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 1,
       "credentials": [
        {
         "credential": "AP Chemistry",
         "colleges": [
          "Los Angeles Pierce College"
         ]
        },
        {
         "credential": "IB Chemistry HL",
         "colleges": [
          "Los Angeles Pierce College"
         ]
        }
       ]
      }
     },
     "CHEM 101": {
      "title": "General Chemistry I",
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists BIOLOGY 3; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists KIN 232; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists KIN 288; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists KIN 303; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists KIN 345; the reader found it not in the text."
     },
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The catalog prints KIN 250 for this program; the state's Program Course File does not list it."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "The AA-T section's heading, description, and start of its learning outcomes fall on the previous page, which is not in the excerpt; this section was identified as the AA-T by its Cal-GETC GE line and its position before 'KINESIOLOGY (AA)'. A reviewer should confirm the heading."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "Movement-based electives require one course from each of three different areas (Areas 3-6 printed: Dance, Fitness, Individual Sports, Team Sports); recorded as one choose-3-courses block. Areas 1 and 2 are not printed, so the area list may be incomplete or simply numbered from 3."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "Catalog prints codes with leading zeros (ANATOMY 001, PHYSIOL 001, HEALTH 012, PHYSICS 006, CHEM 051/060); matched to closed-list ANATOMY 1, PHYSIOL 1, HEALTH 12, PHYSICS 6, CHEM 51/60."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "CHEM 101 carries an asterisk (CHEM 101*) whose footnote is not in the excerpt."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "KIN 250 Weight Training Skills is not in the closed list; recorded as catalog addition."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "The KIN AA section that follows (major code 0835.00) lists KIN MAJ 126, KIN 247, KIN 291 and was not recorded as it belongs to a different award."
     }
    ],
    "map": {
     "host": "programmap.wlac.edu",
     "url": "https://www.wlac.edu/academics/pathways/program-mapper",
     "checked_run": "program-sequence-ppm run 37198225537",
     "status": "not_read",
     "text": "The college's page about its program mapper answered on 2026-10-04 and links to programmap.wlac.edu, which has not been read. Every mapper host probed that day refused the reader."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 19,
      "listed": 24
     },
     "additions": 1,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "wlac_37839",
   "college": "West Los Angeles College",
   "control_number": "37839",
   "title": "Real Estate Salesperson",
   "award": "Certificate of Achievement requiring 8S/12Q to fewer than 16S/24Q units",
   "catalog_year": "2026-2027",
   "source_url": "https://www.wlac.edu/sites/wlac.edu/files/2026-08/2026_2027%20catalog.pdf",
   "platform": "pdf",
   "measure": "units",
   "record": {
    "program": {
     "section_heading": "REAL ESTATE SALESPERSON (CA)",
     "measure": "units",
     "total_units": {
      "min": 9,
      "max": 11
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required core courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": 6,
       "max": 6
      },
      "courses": [
       {
        "code": "REAL ES 001",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 003",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     },
     {
      "name": "Major Elective units (choose 1 course) from the following",
      "rule": "choose_courses",
      "minimum": 1,
      "option_group": null,
      "stated": {
       "min": 3,
       "max": 5
      },
      "courses": [
       {
        "code": "ACCTG 001",
        "units": 5,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "BUS 005",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 004",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 005",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 007",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 009",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 011",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 014",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "REAL ES 021",
        "units": 3,
        "units_max": null,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 9.0,
     "measure": "units",
     "total": {
      "min": 9,
      "max": 11
     },
     "picks": [
      "REAL ES 001",
      "REAL ES 003",
      "REAL ES 005"
     ],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 11,
     "here": 8,
     "adopt": 4,
     "consider": 0
    },
    "courses": {
     "REAL ES 001": {
      "title": "REAL ESTATE PRINCIPLES",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1040",
       "title": "Real Estate Principles"
      },
      "here": {
       "recs": 1,
       "credentials_n": 4,
       "credentials": [
        "CA Real Estate Broker",
        "CA Real Estate Salesperson",
        "Real Estate Principles",
        "California Real Estate Salesperson License"
       ]
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 5,
       "credentials": [
        {
         "credential": "First Tuesday Real Estate Courses",
         "colleges": [
          "City College of San Francisco",
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        },
        {
         "credential": "Real Estate Principles and Practices",
         "colleges": [
          "City College of San Francisco",
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        },
        {
         "credential": "California Real Estate Broker License",
         "colleges": [
          "Santa Barbara City College"
         ]
        }
       ]
      }
     },
     "REAL ES 003": {
      "title": "REAL ESTATE PRACTICES",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1039",
       "title": "Real Estate Practices"
      },
      "here": {
       "recs": 1,
       "credentials_n": 4,
       "credentials": [
        "CA Real Estate Broker",
        "CA Real Estate Salesperson",
        "California Real Estate Broker License",
        "California Real Estate Salesperson License"
       ]
      },
      "adopt": {
       "credentials_n": 2,
       "colleges_n": 2,
       "credentials": [
        {
         "credential": "First Tuesday Real Estate Courses",
         "colleges": [
          "Moreno Valley College",
          "Norco College"
         ]
        },
        {
         "credential": "Real Estate Principles and Practices",
         "colleges": [
          "Moreno Valley College",
          "Norco College"
         ]
        }
       ]
      }
     },
     "ACCTG 001": {
      "title": "INTRODUCTORY ACCOUNTING I",
      "identity": {
       "kind": "CCR",
       "id": "BUSI M1066",
       "title": "Introductory Accounting 1"
      }
     },
     "BUS 005": {
      "title": "BUSINESS LAW I",
      "identity": null
     },
     "REAL ES 004": {
      "title": "REAL ESTATE OFFICE ADMINISTRATION",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1005",
       "title": "Real Estate Office Administration"
      }
     },
     "REAL ES 005": {
      "title": "LEGAL ASPECTS OF REAL ESTATE I",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1014",
       "title": "Legal Aspects of Real Estate"
      },
      "here": {
       "recs": 1,
       "credentials_n": 7,
       "credentials": [
        "CA Real Estate Broker",
        "CA Real Estate Salesperson",
        "California State Bar Membership",
        "California Real Estate Broker License"
       ]
      }
     },
     "REAL ES 007": {
      "title": "REAL ESTATE FINANCE I",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1032",
       "title": "Real Estate Finance"
      },
      "here": {
       "recs": 1,
       "credentials_n": 5,
       "credentials": [
        "CA Real Estate Broker",
        "California State Bar Membership",
        "California Real Estate Broker License",
        "California Real Estate Salesperson License"
       ]
      }
     },
     "REAL ES 009": {
      "title": "REAL ESTATE APPRAISAL I",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1012",
       "title": "Real Estate Appraisal"
      },
      "here": {
       "recs": 1,
       "credentials_n": 5,
       "credentials": [
        "CA BREA Appraiser",
        "CA Real Estate Broker",
        "California Real Estate Appraiser License",
        "California State Bar Membership"
       ]
      },
      "adopt": {
       "credentials_n": 3,
       "colleges_n": 5,
       "credentials": [
        {
         "credential": "Real Estate Appraisal",
         "colleges": [
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        },
        {
         "credential": "California Real Estate Salesperson License",
         "colleges": [
          "City College of San Francisco"
         ]
        },
        {
         "credential": "Real Estate Appraiser Trainee License",
         "colleges": [
          "San Bernardino Valley College"
         ]
        }
       ]
      }
     },
     "REAL ES 011": {
      "title": "ESCROW PRINCIPLES",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1027",
       "title": "Escrow Principles"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CA Real Estate Broker"
       ]
      }
     },
     "REAL ES 014": {
      "title": "PROPERTY MANAGEMENT",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1043",
       "title": "Property Management"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CA Real Estate Broker"
       ]
      }
     },
     "REAL ES 021": {
      "title": "REAL ESTATE ECONOMICS",
      "identity": {
       "kind": "CCR",
       "id": "REAL M1022",
       "title": "Real Estate Economics"
      },
      "here": {
       "recs": 1,
       "credentials_n": 1,
       "credentials": [
        "CA Real Estate Broker"
       ]
      },
      "adopt": {
       "credentials_n": 1,
       "colleges_n": 4,
       "credentials": [
        {
         "credential": "Real Estate Economics",
         "colleges": [
          "Copper Mountain College",
          "Moreno Valley College",
          "Norco College",
          "Riverside City College"
         ]
        }
       ]
      }
     }
    },
    "gaps": [
     {
      "kind": "Catalog and state file differ",
      "owner": "college",
      "where": "West Los Angeles College's program record in the state's curriculum inventory",
      "text": "The state's Program Course File lists REALES010; the reader found it named only in the Real Estate Broker section."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "The Salesperson section spans a page break (pages 151-152); the core course list continues on page 152 under the 'Required core courses ... 6' heading from page 151."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "Catalog codes with leading zeros (e.g., REAL ES 001, BUS 005, REAL ES 007) were matched to closed-list codes REAL ES 1, BUS005, REALES007."
     }
    ],
    "map": {
     "host": "programmap.wlac.edu",
     "url": "https://www.wlac.edu/academics/pathways/program-mapper",
     "checked_run": "program-sequence-ppm run 37198225537",
     "status": "not_read",
     "text": "The college's page about its program mapper answered on 2026-10-04 and links to programmap.wlac.edu, which has not been read. Every mapper host probed that day refused the reader."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 11,
      "listed": 12
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  },
  {
   "key": "wlac_39618",
   "college": "West Los Angeles College",
   "control_number": "39618",
   "title": "Real Estate Supervisory/Trainee Appraiser Licensing",
   "award": "Noncredit program",
   "catalog_year": "2026-2027",
   "source_url": "https://www.wlac.edu/sites/wlac.edu/files/2026-08/2026_2027%20catalog.pdf",
   "platform": "pdf",
   "measure": "hours",
   "record": {
    "program": {
     "section_heading": "REAL ESTATE SUPERVISORY/TRAINEE APPRAISER LICENSING (CN)",
     "measure": "hours",
     "total_units": {
      "min": 9,
      "max": 18
     },
     "open_elective_units": null,
     "ge_pattern": null
    },
    "blocks": [
     {
      "name": "Required Courses",
      "rule": "all",
      "minimum": null,
      "option_group": null,
      "stated": {
       "min": null,
       "max": null
      },
      "courses": [
       {
        "code": "VOC ED 197CE",
        "units": 4.5,
        "units_max": 9,
        "alternatives": [],
        "catalog_addition": false
       },
       {
        "code": "VOC ED 198CE",
        "units": 4.5,
        "units_max": 9,
        "alternatives": [],
        "catalog_addition": false
       }
      ]
     }
    ]
   },
   "display": {
    "v": 1,
    "figure": {
     "up_to": 0.0,
     "measure": "hours",
     "total": {
      "min": 9,
      "max": 18
     },
     "picks": [],
     "path": null,
     "path_why": "No pathway map has been read for this program."
    },
    "counts": {
     "courses": 2,
     "here": 0,
     "adopt": 0,
     "consider": 0
    },
    "courses": {
     "VOC ED 197CE": {
      "title": "Supervisory/Trainee Real Estate Appraiser",
      "identity": null
     },
     "VOC ED 198CE": {
      "title": "Fed & State Laws and Regs. for CA Appraisers",
      "identity": null
     }
    },
    "gaps": [
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "Program is noncredit; hours recorded from catalog (each course 4.5-9 hours, program total 9-18 hours)."
     },
     {
      "kind": "Reader's note",
      "owner": "procedure",
      "where": "West Los Angeles College's PDF catalog reading procedure",
      "text": "Program learning outcomes describe general real estate sales/management rather than appraisal licensing; possibly copied from another program, but this does not affect the course requirements."
     }
    ],
    "map": {
     "host": "programmap.wlac.edu",
     "url": "https://www.wlac.edu/academics/pathways/program-mapper",
     "checked_run": "program-sequence-ppm run 37198225537",
     "status": "not_read",
     "text": "The college's page about its program mapper answered on 2026-10-04 and links to programmap.wlac.edu, which has not been read. Every mapper host probed that day refused the reader."
    },
    "checks": {
     "checked": true,
     "coverage": {
      "placed": 2,
      "listed": 2
     },
     "additions": 0,
     "arithmetic": "equal",
     "reviewer": "ok"
    },
    "build": "bbbbfb611f15",
    "built": "2026-10-04"
   }
  }
 ]
};
