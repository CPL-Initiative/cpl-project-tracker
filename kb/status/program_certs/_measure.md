# The program certifications matcher: its measure

The measure S652's matcher rule asks for, for `kb/_build_program_certs.py` (Sam, 2026-11-27). Written 2026-11-27 by
the S745 worker. Re-measure when `CERTS` changes.

## What it counts

Over 18,752 usable program records (the ladders' record set and skip rules):

- **The program prepares for:** 634 records name at least one certification on the closed list in their outcomes or
  careers (707 entries). S744 measured 153 with five names; the list now holds 80. At Cerritos College, 4
  records (I-CAR 3, ServSafe 1).
- **Earns CPL here:** 1,326 records hold a course that an Industry Certification credential on the public adoption
  page gives credit for at that college (3,432 entries, 76 colleges); 1,551 of the entries carry an exhibit code built
  at that college that MAP's `?Exhibit=` pattern accepts. At Cerritos College, none: its settled articulations on the
  adoption page are Standardized Assessment (39), Credit By Exam (19) and Military (1).
- **Both:** 45 records name a certification in both groups.

## How it was measured

Four rounds. Each drew a random sample, seeded, of (a) the matcher's hits and (b) records whose outcomes or careers
hold a line with `certif` or `licens` that is not about the college's own certificate ("Certificate of Achievement",
"this certificate") and that the matcher missed. A worker read each line. A hit is true when its line names that
certification, or its license or exam, as something the program leads to; a line that only cites the body's
standards, symbols or regulations is a false hit. A miss is true when its line names a specific certification. Rounds
1 and 2 tuned the list (NATEF dropped, context required for AWS, ASE, the Cosmetology Board and POST; 27 names
added). Rounds 3 and 4 were drawn after the tuning they measure.

| Round | Hits read | True | Precision | Misses read | Name a certification | Records with a hit | Missed records |
|---|---|---|---|---|---|---|---|
| 1 (first list) | 60 | 43 | 72% | 40 | 16 | 568 | 610 |
| 3 | 60 | 56 | 93% | 40 | 12 | 611 | 496 |
| 4 | 40 | 36 | 90% | 20 | 7 | 634 | 478 |

**Recall** (round 4): about 634 x 0.90 = 571 true records found against about 478 x 0.35 = 167 missed, so **about
77%**. This counts only misses whose line says `certif` or `licens`; a record that names an exam without either word
("Pass the NPTE") and holds no closed-list name is not in the miss pool, so the true recall is a little lower.

**After round 4**, four fixes, each checked on the line that failed: AWS reads as the welding society only on a line
that also says weld and a certification, test or exam (round 4's hits 0 and 23; 23 now reads AWS Solutions
Architect); the Department of Pesticide Regulation and Section 608 count only beside a license, certification or exam
(hits 4 and 5); Fire Officer and COTA were added (misses 0, 3, 4). The record and hit counts above are after the
fixes.

## Round 4's sample

| # | Key | Line (trimmed) | Verdict |
|---|---|---|---|
| 0 | aws_weld | Create, manage, and deploy public and private SecureSockets Layer/Transport Layer Security (SSL/TLS)certificates for use with AWS services and internalconnected resources | false: AWS here is Amazon Web Services, read as the welding society |
| 1 | appraiser | Satisfy Department of Real Estate and office of Real Estate Appraisers educational requirements for state licensing. | true |
| 2 | cadc | Certified Addiction Treatment Counselor | true |
| 3 | ase | Take the related Automotive Service Excellence (ASE) certification exams. | true |
| 4 | pesticide | Identify and apply health and safety regulations from the Environmental Protection Agency (EPA) and the California Department of Pesticide Regulation (CA DPR). | false: cites EPA and DPR regulations, names no license |
| 5 | epa608 | Properly handle refrigerants based on Section 608 of the clean air act. | false: cites Section 608 of the Clean Air Act, names no exam |
| 6 | paramedic | licensed paramedic | true |
| 7 | rda | Students will meet requirements to take the California Registered Dental Assistant examination. | true |
| 8 | rda | Perform all Registered Dental Assistant duties as specified by accreditation standards through directed lectures, demonstrations, guided practice, written assignments, ex | true |
| 9 | emt | Successfully pass the National Registry EMT-1 exam. | true |
| 10 | appraiser | Meet the educational requirements to qualify to sit for the California State BREA licensing exam for the Certified Residential Appraiser (AR) license. | true |
| 11 | cosmetology | …of electrical modalities and chemical peels at a level applicable to enter the esthetic workplace, as well as pass their California Board of Barbering and Cosmetology Es | true |
| 12 | radiologic | provide a complete portfolio of technically proficient CT repetitions to satisfy the ARRT clinical experience requirements. | true |
| 13 | nclex_pn | function within the scope of practice of the licensed vocational nurse as outlined by the California Board of Licensed Vocational Nursing and Psychiatric Technician.. | true |
| 14 | cna | Students will gain employment as a Certified Nursing Assistant in a home setting or a care facility. | true |
| 15 | rda | act as a member of the dental health team and apply professional, ethical and legal principles while functioning in the role of the Registered Dental Assistant (RDA). | true |
| 16 | water | Apply to take the Wastewater Treatment Plant Operator Examination Grade II. | true |
| 17 | red_cross | Complete the American Red Cross certificate for Lifeguard training, Waterfront/Waterpark, Shallow Water lifeguarding, and/or Aquatic attraction lifeguarding. | true |
| 18 | emt | Graduates will be eligible to take the National Registry EMT-B written exam for certification. | true |
| 19 | medgas | list National Inspection Testing Certification (NITC) requirements for medical gas systems. | true |
| 20 | faa_ap | Airframe and powerplant technicians | true |
| 21 | water | Understand the state licensing requirements for entering into and advancing in the water industry. | true |
| 22 | smog | …the necessary skills to receive state and national certification in two areas: Bureau of Automotive Repair by the state of California (BAR) and Air Conditioning Certific | true |
| 23 | aws_weld | …provision virtual machines and storage solutions in the cloud, design and troubleshoot cloud-based systems and networks and be prepared for the AWS Solutions Architect A | false: AWS Solutions Architect read as AWS welding (right hit, wrong certification) |
| 24 | rdh | Registered Dental Hygienist (RDH) | true |
| 25 | court_reporter | Demonstrate the ability to pass a mock CSR exam at 200wpm. | true |
| 26 | fitness | Prepare the student for the ACSM's Certified Personal Trainer certification exam. | true |
| 27 | real_estate | Be prepared for Department of Real Estate (DRE) licensing examination. | true |
| 28 | medical_assistant | Prepare for Certified Medical Assistant/CMA exam and/or the Registered Medical Assistant (RMA) exam. | true |
| 29 | nate | NATE Certified Air Conditioning Mechanic | true |
| 30 | cosmetology | Demonstrate ability to successfully complete the cosmetology licensing exam | true |
| 31 | nremt | Demonstrate sufficient preparation to pass the NREMT-P. | true |
| 32 | medical_assistant | Prepare for Certified Medical Assistant/CMA exam and/or the Registered Medical Assistant (RMA) exam. | true |
| 33 | ase | Demonstrate the necessary skills to pass ASE exams. | true |
| 34 | electrician | At the end of this program, students will be prepared to take the “theory” portion of the California Electrician Certificate Examination. | true |
| 35 | nclex_pn | Licensed Vocational Nurse | true |
| 36 | aws_weld | Interpret welder certification acceptance criteria from the AWS D1.1 Structural Steel welding code. | true |
| 37 | pesticide | Achieve certiﬁcations for a range of positions, such as Pest Control Operator and Licensed Pesticide Applicator, across different environmental settings and landscapes. | true |
| 38 | aws_weld | Demonstrate the ability to pass the American Welding Society Unlimited Structural Certification Test code D1.1 GTAW | true |
| 39 | nclex_pn | Demonstrate professional behaviors in the role of a Licensed Vocational Nurse. | true |

| # | Field | Line (trimmed) | Verdict |
|---|---|---|---|
| 0 | careers | Certified Occupational Therapy Assistant (COTA) | missed: COTA |
| 1 | outcomes | design, develop, and operate programs for children that adhere to Title 22 regulations mandated by the California Department of Human Services, Community Care Licensing D | no certification named |
| 2 | outcomes | Identify the educational requirements necessary to complete a healthcare career, and give a presentation about a selected healthcare career, including educational require | no certification named |
| 3 | careers | State Certified “Fire Officer” | missed: State Certified Fire Officer |
| 4 | outcomes | Identify different levels in the Fire Company Officer Certification Track. | missed: Fire Company Officer certification |
| 5 | careers | 500-hour certified yoga teacher | missed: 500-hour yoga teacher (RYT) |
| 6 | outcomes | Students will be able to design and implement security policies for organizations of all sizes (Cybersecurity certificate). | no certification named |
| 7 | outcomes | Pass the registration and licensing examinations offered by state and national accrediting organizations. | no certification named |
| 8 | outcomes | Provide quality, safe, patient-centered basic nursing care using evidence-based practices, as a competent, entry-level vocational nurse, under the direct supervision of a | no certification named |
| 9 | outcomes | develop an on-going professional action plan integrating interactions with Deaf related organizations, connections with interpreter employers, and the implications of cer | no certification named |
| 10 | outcomes | Practice skills needed for industry and state certification tests. | no certification named |
| 11 | outcomes | Identify interpreter and translator career opportunities and professional certification requirements. | no certification named |
| 12 | outcomes | Apply and evaluate legal, ethical, accreditation, and certification standards in health information scenarios, demonstrating compliance and professional judgment. | no certification named |
| 13 | outcomes | demonstrate an understanding of the requirements of the Federal Refrigerant Transition and Recovery Certification license examination. | missed: Refrigerant Recovery Certification (EPA 608) |
| 14 | outcomes | Prepare students for entry-level employment as an HVACR Technician and for industry certifications. | no certification named |
| 15 | outcomes | Meet their career preparation goals as well as qualify for a state licensing exam to become an Escrow Agent. | missed: escrow agent license |
| 16 | outcomes | Prepare to enter the Child Studies credit program and take courses to meet licensing requirements to enter a career within Early Childhood Education and working with youn | no certification named |
| 17 | careers | certified welders | no certification named |
| 18 | careers | certified powerplant technicians | missed: certified powerplant technicians (FAA A&P) |
| 19 | outcomes | Students will be able to demonstrate proficiency in the core skills and knowledge required for employment as a supervisor/administrator in a Title 22 licensed center in t | no certification named |
