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

# ── All 9 datasets with their full column lists ──────────────────────
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
    {
        "viewName": "View_CollegeContacts_APIDataset",
        "columnName": ["College", "Academic Senate President",
                       "Academic Senate President Email", "Articulation Officer",
                       "Articulation Officer Email", "CEO", "CEO Email",
                       "CPL Coordinator", "CPL Coordinator Email",
                       "CPL Counselor Contact", "CPL Counselor Email",
                       "Faculty Lead", "Faculty Lead Email", "IT Contact",
                       "IT Contact Email", "Last Updated On", "Lead Initiator",
                       "Lead Initiator Email", "Lead Manager", "Lead Manager Email",
                       "Primary Contact", "Primary Contact Email",
                       "Primary Contact Phone", "School Certifying Official",
                       "Veteran School Certifying Official Email", "VPAA",
                       "VPAA Email", "VPSS", "VPSS Email",
                       "VRC Official From Map Cohort Application",
                       "VRC Official From Map Cohort Application Email",
                       "VRC Official From Map Cohort Application Phone"]
    },
    {
        "viewName": "View_CollegeCourses_APIDataset",
        "columnName": ["College", "CID Number", "Course Control Number",
                       "Course Number", "Course Title", "Subject", "Top Code"]
    },
    {
        "viewName": "View_CollegeUsersRoles_APIDataset",
        "columnName": ["College", "CollegeID", "Administrator", "Email",
                       "FirstName", "LastName", "Order", "RoleID", "RoleName",
                       "SuperUser", "UserName"]
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
]


def fetch_report(output_path=None, timeout=120):
    """Fetch the full CustomReport from the MAP API and save to disk."""
    if output_path is None:
        today = datetime.now().strftime("%Y-%m-%d")
        output_path = os.path.join(os.getcwd(), f"CustomReport_{today}.json")

    body = json.dumps(REQUEST_PAYLOAD).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        headers={"Content-Type": "application/json"},
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
