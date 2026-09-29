# -*- coding: utf-8 -*-
"""Content + palette spec for the rebuilt CAC pathway slides.
Text is transcribed from the original flattened PNGs on slides 6/7/8.
"""

# ---------------------------------------------------------------- palette
NAVY      = "002F6D"   # CCC brand navy  (theme dk1/accent1)
NAVY_DK   = "002755"
CCC_BLUE  = "0066BA"
GOLD      = "FFB600"   # CCC brand gold (theme accent2)
GREY      = "555759"   # theme dk2
GREY_LT   = "7B7D80"
WHITE     = "FFFFFF"

# stage colours sampled straight out of the original diagrams so the new
# slides stay recognisable next to anything already circulated
S1 = "2F6B9A"   # pre-apprenticeship  (blue)
S2 = "2B8C86"   # apprenticeship      (teal)
S3 = "C89532"   # CPL award           (gold)
S4 = "5E8F5A"   # associate degree    (green)
S5 = "C96D3D"   # bachelor's degree   (orange)

STAGE_COLORS = [S1, S2, S3, S4, S5]
STAGE_NAMES  = ["PRE-APPRENTICESHIP", "APPRENTICESHIP", "CPL AWARD",
                "ASSOCIATE DEGREE", "BACHELOR'S DEGREE"]

TITLE_FONT = "Cambria"    # matches the rest of the deck; QA-safe
BODY_FONT  = "Calibri"    # QA-safe, ships with Office

# ---------------------------------------------------------------- spine
SPINE = {
    "kicker": "CPL PATHWAY",
    "title":  "One road. Every trade.",
    "sub":    "Pre-Apprenticeship → Bachelor's Degree. What changes by trade is the college "
              "partner, the certificate and the number of units — not the road.",
    # verbatim stage descriptions from the original diagrams
    "stages": [
        "Entry preparation, foundational skills, and industry exposure.",
        "Structured on-the-job learning plus related and supplemental instruction.",
        "Evaluate verified learning and award college credit where applicable.",
        "Apply CPL toward a certificate or associate degree pathway.",
        "Continue into an aligned bachelor's completion or transfer pathway.",
    ],
    "chips": [
        "Training is already aligned to course credit",
        "Rigor and skills verified by the CCCCO process",
        "General education can be met by CLEP exams",
    ],
}

# ---------------------------------------------------------------- trades
# body = list of (text, style) where style in {"lead","norm","mute","strong"}
CARPENTRY = {
    "kicker": "CPL PATHWAY  ·  SAMPLE",
    "title":  "Carpentry — Drywall / Lather",
    "sub":    "Garden Grove High School · Western States Carpenters · Santiago Canyon College · Foothill College",
    "logo":   "assets/carpenters.png",
    "hero":   ("26", "UNITS OF COLLEGE CREDIT", "Eligible at journeyperson"),
    "bodies": [
        [("Garden Grove High School", "lead"),
         ("Skilled Trades: CTE", "norm"),
         ("Carpentry Apprenticeship Preparation", "norm"),
         ("College partner: Santiago Canyon College", "mute")],

        [("Western States Carpenters", "lead"),
         ("Drywall / Lather", "norm"),
         ("College partner: Santiago Canyon College", "mute")],

        [("Drywall / Lathers Journeyperson License", "norm"),
         ("Industrial Certification at Santiago Canyon College", "norm"),
         ("Certificate of Achievement: Apprenticeship Carpentry Drywall Lather", "strong"),
         ("12 courses crosswalked — see appendix", "mute")],

        [("Santiago Canyon College", "lead"),
         ("Construction Management, Associate of Science", "norm"),
         ("Certificate satisfies all core courses", "norm"),
         ("Only general education remains", "strong"),
         ("34 additional units for the associate degree", "mute")],

        [("Foothill College", "lead"),
         ("BS Building Trade Management", "norm"),
         ("60 units satisfied by the AS degree and apprenticeship", "strong"),
         ("Remaining: upper-division leadership and upper-division general education", "mute")],
    ],
    "chips": [
        "26 units earned on the job, not in a classroom",
        "Only general education courses remain",
        "General education can be met by CLEP exams",
    ],
}

FIRE = {
    "kicker": "CPL PATHWAY  ·  SAMPLE",
    "title":  "Fire — Cal JAC",
    "sub":    "San Diego Miramar College carries the whole pathway — academy through bachelor's degree",
    "logo":   "assets/fireacademy.png",
    "hero":   ("30", "UNITS OF COLLEGE CREDIT", "Eligible for working firefighters"),
    "bodies": [
        [("San Diego Miramar College", "lead"),
         ("Pre-Apprenticeship", "norm"),
         ("Fire Academy", "norm"),
         ("COYA", "norm"),
         ("$6,000 stipend", "strong")],

        [("Fire Academy", "lead"),
         ("Cal JAC", "norm")],

        [("Certificate of Achievement: Entry Level Firefighter", "strong"),
         ("San Diego Miramar College", "norm"),
         ("No tuition fees and no cap on college units", "mute")],

        [("San Diego Miramar College", "lead"),
         ("Entry Level Firefighter, Associate of Science", "norm"),
         ("Certificate satisfies all core courses", "norm"),
         ("Only general education remains", "strong"),
         ("60 units total for the associate degree", "mute")],

        [("San Diego Miramar College", "lead"),
         ("BS Public Safety Management", "norm"),
         ("60 units satisfied by the AS degree and apprenticeship", "strong"),
         ("Remaining: upper-division leadership and upper-division general education", "mute")],
    ],
    "chips": [
        "30 units for firefighters already doing the work",
        "No tuition fees, no cap on college units",
        "One college, academy to bachelor's degree",
    ],
}

# ---------------------------------------------------------------- ironworkers (two lanes)
IRONWORKERS = {
    "kicker": "CPL PATHWAY  ·  SAMPLE",
    "title":  "Ironworkers — one trade, two college routes",
    "sub":    "Ironworkers Local 433 · American River College or Cerritos College · Foothill College or Cerritos College",
    "logo":   "assets/ironworkers.png",
    "stage1": [("Welding Apprenticeship Preparation", "label"),
               ("American River College", "lead"),
               ("Welding Credit Program", "norm"),
               ("Cerritos College", "lead"),
               ("Noncredit Welding", "norm")],
    "lanes": [
        {"name": "American River College", "units": "29.5",
         "cells": [
            [("American River College", "lead"),
             ("Ironworkers Union", "norm")],
            [("29.5", "hero"),
             ("Certificate of Achievement: Ironworkers Apprenticeship, Levels 1–3", "strong"),
             ("17 courses crosswalked — see appendix", "mute")],
            [("American River College", "lead"),
             ("Associate of Arts: Ironworker Apprenticeship", "norm"),
             ("60 units total · 30.5 additional units needed", "mute")],
            [("Foothill College", "lead"),
             ("BS Building Trades Management", "norm"),
             ("60 units satisfied by the AS degree and apprenticeship", "mute")],
         ]},
        {"name": "Cerritos College", "units": "38",
         "cells": [
            [("Cerritos College", "lead"),
             ("Ironworkers Union", "norm")],
            [("38", "hero"),
             ("Certificate of Achievement: Apprenticeship Field Ironworkers Reinforcing", "strong"),
             ("15 courses crosswalked — see appendix", "mute")],
            [("Cerritos College", "lead"),
             ("Associate of Science: Apprenticeship Field Iron Workers", "norm"),
             ("60 units total · 22 additional units needed", "mute")],
            [("Cerritos College", "lead"),
             ("BS Field Ironworker Supervisor", "norm"),
             ("60 units satisfied by the AS degree and apprenticeship", "mute")],
         ]},
    ],
    "chips": [
        "Two colleges, two routes — 29.5 or 38 units",
        "Both routes reach the same 60-unit degree",
        "General education can be met by CLEP exams",
    ],
}

# ---------------------------------------------------------------- appendix tables
CARP_COURSES = [
    ("ACA071A", "Orientation", "2"),
    ("ACA071B", "Safety and Health Certifications", "2"),
    ("ACA071C", "Tool/Equipment Applications", "1.5"),
    ("ACA072A", "Basic Metal Framing", "1.5"),
    ("ACA072B", "Basic Lathing", "1.5"),
    ("ACA073A", "Framing Ceilings and Soffits", "1.5"),
    ("ACA073B", "Framing Suspended Ceilings", "1.5"),
    ("ACA073C", "Framing Curves and Arches", "1.5"),
    ("ACA074A", "Print Reading", "2"),
    ("ACA074B", "Advanced Print Reading", "2"),
    ("ACA075A", "Light Gage Welding AWS - A", "1.5"),
    ("ACA083",  "Door and Door Frames", "1.5"),
]

ARC_COURSES = [
    ("IW100", "Saturday classes — Orientation", "2"),
    ("IW101", "H08/H97 — OSHA 30/COMET", "1.5"),
    ("IW110", "H01 — Mixed Base", "1.5"),
    ("IW120", "H15 — Rigging", "1.5"),
    ("IW130", "H30 — Reinforcing", "1.5"),
    ("IW131", "H36 — Reinforcing II/Post Tensioning", "1.5"),
    ("IW140", "H65/70 — Precast Concrete/Metal buildings", "1.5"),
    ("IW150", "H20 — Welding I", "1.5"),
    ("IW151", "H25 — Welding II", "1.5"),
    ("IW152", "H28 — Welding III", "1.5"),
    ("IW160", "H07/H47/H75/77 — LEAD/Scaffold erect dismantle/1st aid CPR", "2"),
    ("IW170", "H40 — Structural I", "1.5"),
    ("IW171", "H45/B87 — Structural II/Cranes", "1.5"),
    ("IW180", "H52 — Architectural/Ornamental I", "1.5"),
    ("IW183", "H62/H18/H95 — History/Qualified Rigger/Foreman", "2"),
    ("IW186", "H54 — Architectural/Ornamental II", "1.5"),
    ("IW298", "Work Experience — Work Experience in Ironworkers Trade", "4"),
]

CC_COURSES = [
    ("IWAP 40.07", "IW — Orientation", "4.0"),
    ("IWAP 40.09", "IW — General Rigging", "2.0"),
    ("IWAP 40.11", "Welding II — Reinforcing", "2.5"),
    ("IWAP 40.12", "IW — Reinforcing Iron I", "2.0"),
    ("IWAP 40.15", "IW — Post Tension I", "2.0"),
    ("IWAP 40.22", "IW — Cranes", "2.0"),
    ("IWAP 40.50", "IW — Mixed Base / Reinforcing", "2.0"),
    ("IWAP 40.53", "IW — Detailing / Reinforcing Iron", "2.0"),
    ("IWAP 40.55", "IWS — Reinforcing Foreman Training", "2.0"),
    ("IWAP 40.56", "IW — Trade Science / Ironworker History", "2.0"),
    ("IWAP 40.63", "IW — Structural Lead Hazard", "2.0"),
    ("IWAP 41.03", "IW — Reinforcing II", "1.0"),
    ("IWAP 41.07", "IW — Post Tension II", "2.5"),
    ("IWAP 41.08", "IW — Post Tension III", "2.0"),
    ("IWAP 41.09", "OSHA 30 / Extension Review", "1.5"),
]
