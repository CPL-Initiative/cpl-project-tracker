"""Guard the MAP CustomReport request payload — what we ask for IS the policy.

fetch_custom_report.py's data-minimisation is not enforced by a filter, a
redactor, or a downstream check. It is enforced by WHAT THE REQUEST DOES NOT
ASK FOR: Session 34 dropped View_CollegeContacts and View_CollegeUsersRoles
entirely so staff PII never lands on the Action runner at all, and the student
views omit name/DOB/SSN-shaped columns for the same reason.

That posture is therefore exactly one edit away from being undone, silently, by
someone adding a plausible-looking column while wiring a new report — and the
repo is PUBLIC. So it gets a test.

Run: python3 tests/custom_report_payload_test.py
"""
import ast
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / "fetch_custom_report.py").read_text(encoding="utf-8")

# Load REQUEST_PAYLOAD without importing (the module makes network calls at
# __main__ only, but exec'ing just the literal keeps this test hermetic).
_ns = {}
exec(compile(SRC.split("def _build_headers")[0], "fetch_custom_report.py", "exec"), _ns)
PAYLOAD = _ns["REQUEST_PAYLOAD"]

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)


# ── 1. Views that must never be fetched ──────────────────────────────────
# Staff contact PII the dashboard was audit-confirmed not to read.
BANNED_VIEWS = ["View_CollegeContacts", "View_CollegeUsersRoles"]
names = [d["viewName"] for d in PAYLOAD]
for v in BANNED_VIEWS:
    check(not any(v in n for n in names),
          f"{v} is back in REQUEST_PAYLOAD — Session 34 dropped it so staff PII "
          f"never reaches the runner. Re-add only with an audited consumer.")

check(len(names) == len(set(names)), "duplicate viewName in REQUEST_PAYLOAD")

# ── 2. Columns that must never be requested from ANY view ────────────────
# Direct identifiers. StudentMAPID is deliberately NOT here: it arrives as a
# one-way hash and docs/map_dataset_spec_for_malone.md asked for exactly that
# so distinct students could be counted without holding an identifier.
BANNED_COL = re.compile(
    r"^(first\s*name|last\s*name|middle\s*name|full\s*name|birth\s*date|"
    r"birthdate|dob|ssn|social\s*security|e-?mail|phone|street|"
    r"home\s*address|zip\s*code)$", re.I)
for d in PAYLOAD:
    for c in d["columnName"]:
        check(not BANNED_COL.match(c.strip()),
              f"{d['viewName']} requests identifying column {c!r}. The payload IS "
              f"the PII boundary — do not add identity columns to a public repo's feed.")

# ── 3. Held-by-decision columns, per view ────────────────────────────────
# `Notes` is free text at student grain, written by staff, read by nothing.
sd = next((d for d in PAYLOAD if "StudentDetailsCredits" in d["viewName"]), None)
if sd:
    check("Notes" not in sd["columnName"],
          "View_StudentDetailsCredits_APIDataset requests `Notes` — free text at "
          "student grain with no downstream consumer. Held by decision 2026-08-19.")
    # The disposition is the entire reason this view was wanted.
    check("CPLStatusPlan" in sd["columnName"],
          "CPLStatusPlan missing — it is what a college DECIDED, and the only "
          "field none of the older views carried. `Status` is not a substitute: "
          "it is the workflow stage, and they share exactly one value.")

# ── 4. The 11-column exhibit report stays OUT ────────────────────────────
# It is View_CollegeExhibitCRByCatalogYear with catalog_year + course_type
# collapsed. Measured on map_college_cr_unit: dropping course_type costs 4 rows
# of 204,714; dropping catalog_year costs 32,990 (16.1%). Fetching both moves
# ~175k rows to learn nothing derivable.
check(not any(n == "View_CollegeExhibitCR_APIDataset" for n in names),
      "View_CollegeExhibitCR_APIDataset added — it is the by-catalog-year report "
      "with the grain collapsed, and is derivable from it. Fetch one, not both.")
check("View_CollegeExhibitCRByCatalogYear_APIDataset" in names,
      "the by-catalog-year exhibit CR report is missing from REQUEST_PAYLOAD")

# ── 5. The raw pull must stay out of this PUBLIC repo ────────────────────
ignored = (ROOT / ".gitignore").read_text(encoding="utf-8")
check(re.search(r"^CustomReport_\*\.json$", ignored, re.M),
      ".gitignore no longer ignores CustomReport_*.json — the raw pull carries "
      "student-grain rows and this repo is public.")

if failures:
    print(f"FAIL — {len(failures)} problem(s):")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)
print(f"OK — {len(PAYLOAD)} datasets; PII boundary, held columns and gitignore intact.")
