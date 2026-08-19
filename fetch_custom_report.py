"""
fetch_custom_report.py — API-direct CustomReport fetch
=======================================================
Calls the MAP Custom Report Builder API directly (no browser needed).
Saves the combined JSON to the current directory.

Usage:
    python fetch_custom_report.py              # saves CustomReport_YYYY-MM-DD.json
    python fetch_custom_report.py --output /path/to/file.json

Requirements:
    Python 3.8+ (stdlib only, no pip packages needed)
"""

import json, os, sys, urllib.request, urllib.error
from datetime import datetime

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"

# ── The datasets we fetch, with their full column lists ─────────────
# Was 9 in the MAP Custom Reporting Module; this list has drifted from that
# count twice and the comment said "9" until 2026-08-08. Today: the two contact
# views are deliberately dropped (PII minimisation, Session 34) and
# View_ExhibitCRsCatalog_Dataset was added later. Count the entries, don't trust
# a number in a comment — including this one.
REQUEST_PAYLOAD = [
    {
        "viewName": "View_ArticulatedMAPExhibits_APIDataset",
        "columnName": ["College", "ExhibitID", "Exhibit Title", "Version Number",
                       "Articulation College", "Course", "Credit Recommendation",
                       "Collaborative Type", "TOP Code", "CID Number",
                       "Mode Of Learning", "CPL Mode of Learning", "CPL Type",
                       "CPL Type Description"]
    },
    {
        "viewName": "View_ArticulatedCollegeCourses_APIDataset",
        "columnName": ["College", "CollegeID", "AceID", "ArticulationID",
                       "CID Descriptor", "CID Number", "Course", "Course Number",
                       "Course Title", "CPL Mode of Learning", "CPL Type",
                       "CPL Type Description", "Criteria", "CriteriaID", "CRUnits",
                       "ExhibitID", "Industry Certification", "Issued FormID",
                       "Last Submitted On", "Mode of Learning Code",
                       "Model of Learning", "OutlineID", "Program Title",
                       "Skill Level", "Students", "Subject", "Team Reviewed",
                       "Top Code", "Units", "Version Number"]
    },
    # View_CollegeContacts + View_CollegeUsersRoles are intentionally NOT fetched
    # (Session 34, PII data-minimization): they carry staff names/emails/phones
    # that the dashboard never reads (audit-confirmed unused). Dropping them from
    # the payload means staff PII never lands on the Action runner at all. Re-add
    # only if a consumer genuinely needs them — and keep them out of the public repo.
    {
        "viewName": "View_CollegeCourses_APIDataset",
        "columnName": ["College", "CID Number", "Course Control Number",
                       "Course Number", "Course Title", "Subject", "Top Code"]
    },
    {
        "viewName": "View_CreditDistributionByCollege_APIDataset",
        "columnName": ["College", "CollegeID", "Applied Credits", "Area Credits",
                       "Course Credits", "Default Area Credits", "Elective Credits",
                       "Eligible Credits", "Students Awarded", "Transcribed Credits"]
    },
    {
        "viewName": "View_PointInTime_StudentAggregatedValues_APIDataset",
        "columnName": ["College", "Applied Credits", "Apprenticeship Credits",
                       "Area Credits", "Catalog Year", "Course Credits",
                       "CPL Mode of Learning", "CPL Type Description",
                       "Default Area Credits", "Elective Credits",
                       "Eligible Credits", "Military Credits",
                       "NonMilitary Credits", "Transcribed Credits"]
    },
    {
        "viewName": "View_ProgramsofStudy_APIDataset",
        "columnName": ["College", "Catalog Description", "CIP Code",
                       "College Courses", "Degree", "Description", "Program",
                       "Program Control Number", "Program Title", "Top Code"]
    },
    {
        "viewName": "View_StudentAggregatedValues_APIDataset",
        # Student-identity columns (BirthDate, FirstName, LastName, StudentID)
        # are intentionally NOT requested — the dashboard only uses aggregate
        # counts, never per-student identity. "MAP Internal StudentID" is kept
        # solely for the per-college distinct-student count in
        # excel_to_dashboard.py (_compute_college_military_students). Do not
        # re-add the identity columns: this file feeds a PUBLIC repo.
        "columnName": ["College", "Catalog Year", "Applied Credits",
                       "Apprenticeship Credits", "Area Credits",
                       "Course Credits", "CPL Mode of Learning",
                       "CPL Type Description", "Default Area Credits",
                       "Elective Credits", "Eligible Credits",
                       "Last Updated", "MAP Internal StudentID",
                       "Military Credits", "NonMilitary Credits",
                       "Potential Student", "Test Student",
                       "Transcribed Credits", "Uploaded Date"]
    },
    {
        # ── College Exhibit CRs, BY CATALOG YEAR (NEW 2026-08-19) ─────────
        # This IS Dataset A of docs/map_dataset_sql_for_malone.md, which we sent
        # the MAP platform team on 2026-08-09 — same 13 columns, same order. The
        # three new reports are that spec implemented, not new data to discover.
        # Serve-checked on the runner 2026-08-19: HTTP 200, dataCount 211,005,
        # matching the builder exactly. We hold 204,714 in map_college_cr_unit,
        # so this is +3.07% — consistent with our extract being stale while MAP
        # reloaded corrected Exhibit references (cpl_memory:
        # two-student-counts-disagree-indicator-suspected). Confirm before
        # treating a delta as a defect.
        #
        # ⚠️ Take THIS one, not View_CollegeExhibitCR_APIDataset (below, 11
        # columns), which is the same funnel with Catalog Year and Course Type
        # collapsed. Measured on our copy: dropping course_type costs 4 rows of
        # 204,714; dropping catalog_year costs 32,990 (16.1%). Catalog year IS
        # the grain. The 11-column report is kept out of the payload on purpose —
        # it is derivable from this one, and fetching both would move ~175k rows
        # to learn nothing.
        "viewName": "View_CollegeExhibitCRByCatalogYear_APIDataset",
        "columnName": ["CollegeID", "Source Code", "ExhibitID",
                       "Credit Recommendation", "College Course", "CPLStatusPlan",
                       "Catalog Year", "Course Type", "Student Count",
                       "Potential Credits", "Articulated Credits",
                       "Applied Credits", "Transcribed Credits"],
    },
    {
        # ── Student Details and Credits (NEW 2026-08-19) ──────────────────
        # The student × credit-recommendation grain, carrying CPLStatusPlan —
        # the disposition, i.e. what a college actually DID, which none of the
        # previously-fetched views held (cpl_memory:
        # cplstatusplan-absent-from-fetched-map-views). Serve-checked on the
        # runner 2026-08-19: HTTP 200, dataCount 591,820 against our 537,908
        # in map_student_credit (+10.02%, our staleness resolving).
        #
        # StudentMAPID is INCLUDED, and that is the design rather than a
        # relaxation: docs/map_dataset_spec_for_malone.md asked for a one-way
        # hashed key precisely so distinct students could be COUNTED without
        # anyone holding an identifier.
        #
        # ✅ SALTED — Pedro Campos (CEO, ITPI), relayed by Sam 2026-08-19:
        # the MAP student ids are salt-hashed. That is the authoritative answer
        # and it settles the privacy question this column raised; the source is
        # named here rather than laundered into a bare assertion, because a
        # curator's knowledge is a first-class input (CLAUDE.md, Rule 8).
        #
        # It was independently corroborated before the confirmation arrived,
        # which is why the column shipped at all. The spec's own warning —
        # "the ID space is small enough to enumerate" — is cheap to test:
        # StudentMAPID is a small integer over 42,346 distinct students, and
        # SHA-256 across 5,000,000 plain decimals plus eight formatting
        # variants does not reproduce a sampled hash. Not a bare hash of the id.
        # Two independent signals now agree, so this is settled, not assumed.
        #
        # ⚠️ ONE PROPERTY REMAINS UNVERIFIED, and it is not a privacy one.
        # "Salted" does not by itself mean "salted with the SAME salt every
        # run", which is what the spec actually asked for ("use the same salt
        # each run so counts stay comparable over time"). A rotating salt would
        # leak nothing — it would silently make distinct-student counts
        # incomparable across refreshes, so a headcount would wander with no
        # error anywhere.
        #
        # ✅ ANSWERED — Pedro Campos (ITPI) via Sam, 2026-08-19: THE SALT DOES
        # NOT ROTATE; it stays the same every run. So the key IS stable across
        # pulls, and a loader may rely on that rather than infer it: distinct
        # students dedupe correctly across refreshes, and student counts are
        # comparable over time. That is the property the spec asked for.
        #
        # STILL BUILD THE DETECTOR — but as a REGRESSION CHECK now, not an open
        # question. An assurance describes today's behaviour; it does not
        # prevent a change six months from now, and this failure is silent by
        # construction, so nothing would surface it. cpl_memory carries the
        # precedent as statewide-is-138-not-84: a settled ruling does not
        # enforce itself — the consumer has to change. Whatever loads this view
        # should compare the incoming key set against the previous pull; a
        # stable salt gives a large overlap, a rotated one essentially zero.
        # That check belongs at load time, not here — this file only fetches.
        #
        # `Notes` is deliberately NOT requested: free text at student grain,
        # written by staff, read by nothing downstream. The cheapest PII
        # surface to decline is the one nobody asked for.
        #
        # ⚠️ THREE status-shaped fields ship in this view and they are NOT
        # interchangeable. `Status` is the workflow stage; `CPLStatusPlan` is
        # what the college decided (this is the one that matters, and the
        # reason the view was wanted); `CPLPlanStatus` is not a status at all
        # but a pipe-delimited checklist — "CPL Docs |Ed Plan |Analysis
        # |Counselor |". Picking by name gets this wrong plausibly.
        #
        # ⚠️ The raw pull is gitignored (CustomReport_*.json) and must stay so:
        # this repo is PUBLIC and these are student-grain rows. Only aggregated,
        # suppressed artifacts may be committed.
        "viewName": "View_StudentDetailsCredits_APIDataset",
        "columnName": ["CollegeID", "Location", "StudentMAPID", "CPL Mode",
                       "CPL Program", "Program", "ProgramGoal",
                       "Transfer Destination", "Catalog Year", "Course Type",
                       "Status", "Credit Recommendation", "College Course",
                       "ExhibitID", "Source Code", "PotentialCredits",
                       "CreditsInReview", "AppliedCredits", "MilitaryCredits",
                       "NonMilitaryCredits", "ApprenticeshipCredits",
                       "ArticulatedCredits", "CourseCredits", "AreaCredits",
                       "ElectiveCredits", "DefaultAreaCredits",
                       "TranscribedCredits", "CPLStatusPlan", "CPLPlanStatus"],
    },
    {
        # Exhibit CRs Catalog (NEW 2026-06-09) — per (ExhibitID, SkillLevel,
        # CreditRecommendation, …) credit funnel that carries the long-missing
        # PER-EXHIBIT eligible-credit grain (MAP's JST-aggregated totals). Feeds
        # the CER "Eligible (units)" column (export_credential_reference →
        # _rollup_exhibit_cr_catalog). viewName ends "_Dataset" (NOT "_APIDataset")
        # — confirmed by Sam's report header. Lean subset: only the keys + the
        # credit/student totals the rollup needs (~37 MB vs ~128 MB for all 27
        # columns). No PII columns. dataCount ~268k rows.
        "viewName": "View_ExhibitCRsCatalog_Dataset",
        # Title is the BRIDGE to our credential layer — the catalog's numeric
        # ExhibitID is a different namespace from View_ArticulatedMAPExhibits' MAP…
        # string id, so the rollup joins on exhibit Title (export_credential_reference
        # → _rollup_exhibit_cr_catalog). SkillLevel + ExhibitID are the precise
        # de-dupe key; the rest are the credit funnel.
        # Required-evidence + identity columns added 2026-08-14 (Sam). The full
        # 27-field census is in the "Discover MAP datasets (manual)" run log
        # (kb/_probe_exhibit_evidence_fields.py); the measured basis for each:
        #   EvidenceDescription   2.5% fill, 146 distinct, max 349 chars, NOT
        #                         truncated — "Exam Scores", "Certificate",
        #                         "Portfolio Review", "Performance, Demonstration,
        #                         Audition". WHAT a student must produce.
        #   EvidenceTypeID        same 2.5% fill, 11-value controlled vocabulary.
        #   SubmissionGuidelines  2.1% fill, 1,187 distinct, max 1,230 chars — the
        #                         actionable half ("must submit MJC CPL Petition
        #                         Form"). ⚠️ 43 values sit at exactly 100 chars, so
        #                         SOME source caps at 100; it is not a global cap.
        #   AceID                 the ACE exhibit id (MOS-44B-002, AR-1703-0030) —
        #                         the identity anchor the military CR Reference
        #                         lacks (docs/military_cr_reference_scope.md §5).
        #   CPLTypeCode           6-value vocabulary, 100% fill; M = 262,970 of
        #                         271,783. The military/non-military discriminator
        #                         at the catalog grain, for the bucketing doctrine.
        # ⚠️ The evidence columns are ~97.5% empty, and empty by DESIGN on military
        # rows (every welding/MOS row sampled had all three blank, ActiveEvidence
        # =false). That is not a defect — colleges define evidence for the
        # non-military exhibits. Do not "fix" the nulls.
        # NOT added, deliberately: LearningModeID / ModeofLearningCode /
        # CPLModeofLearningDescription are three encodings of ONE field, as are
        # CPLTypeID / CPLTypeCode / CPLTypeDescription — take one each. CriteriaID
        # is 270,765 distinct over 271,783 rows: a row surrogate, not data.
        # _rollup_exhibit_cr_catalog indexes columns BY NAME, so additions are safe.
        "columnName": ["ExhibitID", "SkillLevel", "CreditRecommendation", "Title",
                       "TotalEligibleCreditsForCR", "TotalTranscribedCreditsForCR",
                       "TotalAppliedCreditsForCR", "TotalCreditsInReviewForCR",
                       "TotalStudentsForCR",
                       "EvidenceDescription", "EvidenceTypeID",
                       "SubmissionGuidelines", "AceID", "CPLTypeCode"]
    },
]


def _build_headers():
    """Content-Type + an OPTIONAL non-interactive auth credential.

    Pre-staged (2026-06-01) for MAP's upcoming user-auth rollout on the Custom
    Report Builder. The endpoint is unauthenticated today, so this is a **no-op**
    until MAP issues a service credential and the env var is set:

      MAP_API_KEY          the credential (API key / Bearer token). REQUIRED to
                           activate; absent → no auth header (today's behavior).
      MAP_API_AUTH_HEADER  header name (default "Authorization"; e.g.
                           "Ocp-Apim-Subscription-Key" for Azure APIM, or "x-api-key").
      MAP_API_AUTH_SCHEME  prefix (default "Bearer"; set "" for a raw key value).

    Read at call-time from the environment (the daily workflow injects them from
    repo secrets). See docs/map_api_auth_handoff.md.
    """
    headers = {"Content-Type": "application/json"}
    key = os.environ.get("MAP_API_KEY", "").strip()
    if key:
        header_name = os.environ.get("MAP_API_AUTH_HEADER", "").strip() or "Authorization"
        scheme = os.environ.get("MAP_API_AUTH_SCHEME", "Bearer").strip()
        headers[header_name] = (scheme + " " + key).strip() if scheme else key
        print(f"  Auth: attaching MAP_API_KEY via '{header_name}'"
              + (f" ({scheme} scheme)." if scheme else " (raw value)."))
    return headers


def fetch_report(output_path=None, timeout=120):
    """Fetch the full CustomReport from the MAP API and save to disk."""
    if output_path is None:
        today = datetime.now().strftime("%Y-%m-%d")
        output_path = os.path.join(os.getcwd(), f"CustomReport_{today}.json")

    body = json.dumps(REQUEST_PAYLOAD).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers=_build_headers(),
        method="POST",
    )

    print(f"Fetching CustomReport from API ({len(REQUEST_PAYLOAD)} datasets)...")
    print(f"  POST {API_URL}")
    print(f"  Timeout: {timeout}s (large response ~91MB, may take 25-60s)")

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            data = json.loads(raw)
    except urllib.error.HTTPError as e:
        print(f"  ERROR: HTTP {e.code} — {e.reason}")
        error_body = e.read().decode("utf-8", errors="replace")[:500]
        print(f"  Response: {error_body}")
        return None
    except urllib.error.URLError as e:
        print(f"  ERROR: {e.reason}")
        return None

    # Validate
    if not isinstance(data, list):
        print(f"  ERROR: Expected list, got {type(data).__name__}")
        return None

    print(f"  Received {len(data)} datasets ({len(raw):,} bytes)")
    for ds in data:
        vn = ds.get("viewName", "?")
        dc = ds.get("dataCount", "?")
        print(f"    {vn}: {dc:,} rows" if isinstance(dc, int) else f"    {vn}: {dc} rows")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f)

    print(f"  Saved to: {output_path}")
    return output_path


if __name__ == "__main__":
    output = None
    for arg in sys.argv[1:]:
        if arg == "--output" or arg == "-o":
            continue
        output = arg
    if "--output" in sys.argv or "-o" in sys.argv:
        idx = sys.argv.index("--output") if "--output" in sys.argv else sys.argv.index("-o")
        if idx + 1 < len(sys.argv):
            output = sys.argv[idx + 1]

    result = fetch_report(output)
    if result is None:
        print("FAILED — see errors above")
        sys.exit(1)
    print("Done!")
