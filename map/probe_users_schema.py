"""
map/probe_users_schema.py — PII-SAFE one-off schema probe for the MAP user/contact views
========================================================================================
MAP "College Users & Roles" (the user roster a COBI MAP-Users tab would manage)
is category #9 of the MAP Custom Reporting Module. It — and "College Contacts"
(needed later for the per-college refresh *nudge*) — were deliberately DROPPED
from the daily fetch (PII data-minimization, Session 34) so staff names/emails
never land on the Action runner or the public repo. Before designing a *gated*
user-management tab we need their SCHEMA — the exact fields + the role vocabulary.

This probe fetches ONLY those views on a GitHub Actions runner (the Azure MAP
API is egress-blocked from the agent sandbox) and prints, to the Actions log:
  • the COLUMN NAMES (the fields),
  • the row count,
  • per field: non-null count, value type, value-length range,
  • per field: the DISTINCT VALUES *only* for low-cardinality, NON-PII fields
    (roles / statuses / categories) — so we learn the role vocabulary.

The MAP API is COLUMN-ORIENTED: each dataset is
{viewName, dataCount, columnName:[...field names...], columnValue:[...rows...],
 responseCode, responseMessage}. A request with no columnName returns the field
list but no values, so we do a 2-pass probe: (1) discover columnName, then
(2) re-request WITH those columns to get the rows.

View-NAME resolution (the Session-86 probe bug): every valid MAP view name ends
in the **`_APIDataset`** suffix (see fetch_custom_report.py — `View_*_APIDataset`).
A bare `View_CollegeUsersRoles` returns responseCode 400 "… is not Valid". So we
try a small CANDIDATE list per logical view and use the first the API accepts.

Field-NAME capture (Session 87): the resolved `_APIDataset` views have no
self-describe mode (a no-`columnName` request 500s), so once a name is confirmed
REACHABLE (seed-probe with `["College"]` returns rows) we run a GUESS-AND-CONFIRM
pass: probe each likely column from GUESS_COLUMNS alongside the `College` anchor
and keep the ones the API accepts (a real column is echoed back / widens the row;
an unknown one is dropped or 500s). Then the normal PII-safe per-field analysis
runs on the confirmed list.

PII safety (load-bearing):
  • Raw names / emails / phones are NEVER printed.
  • Nothing is written to disk (no artifact, no commit).
  • A field's distinct values are shown ONLY when cardinality ≤ MAX_ENUM AND the
    field name isn't on a PII denylist AND no sampled value contains '@'. Staff
    names/emails are ~unique (high cardinality) → always masked.

workflow_dispatch only (.github/workflows/map-users-schema-probe.yml). Does NOT
re-add any view to the daily payload.

Run (on a runner):  python3 map/probe_users_schema.py
"""
import json
import os
import urllib.error
import urllib.request

API_URL = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"

# Each logical view → candidate viewName strings to try, MOST-LIKELY first.
# Valid MAP views carry the `_APIDataset` suffix; the bare name is kept as a
# fallback in case this view follows the `_Dataset` exception (View_ExhibitCRsCatalog_Dataset).
VIEW_SETS = [
    ("College Users & Roles", [
        "View_CollegeUsersRoles_APIDataset",
        "View_CollegeUsersandRoles_APIDataset",
        "View_CollegeUserRoles_APIDataset",
        "View_CollegeUsersRoles_Dataset",
        "View_CollegeUsersRoles",
    ]),
    ("College Contacts", [
        "View_CollegeContacts_APIDataset",
        "View_CollegeContacts_Dataset",
        "View_CollegeContacts",
    ]),
]

PII_NAME_HINT = ("name", "email", "phone", "first", "last", "user", "login", "contact")
MAX_ENUM = 25


def _headers():
    h = {"Content-Type": "application/json"}
    key = os.environ.get("MAP_API_KEY", "").strip()
    if key:
        name = os.environ.get("MAP_API_AUTH_HEADER", "").strip() or "Authorization"
        scheme = os.environ.get("MAP_API_AUTH_SCHEME", "Bearer").strip()
        h[name] = (scheme + " " + key).strip() if scheme else key
    return h


def _post(payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=body, headers=_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())


def _dataset(data, view):
    if not isinstance(data, list):
        raise SystemExit(f"  ERROR: expected a list of datasets, got {type(data).__name__}")
    ds = next((d for d in data if d.get("viewName") == view), None)
    # Some responses echo a single dataset without matching viewName — fall back to [0].
    if ds is None and data:
        ds = data[0]
    return ds


def _is_valid(ds):
    """The API returns responseCode 400 + '… is not Valid' for an unknown viewName."""
    if ds is None:
        return False
    code = str(ds.get("responseCode") or "")
    msg = str(ds.get("responseMessage") or "")
    if "not valid" in msg.lower():
        return False
    if code and code not in ("200", "0", ""):
        return False
    return bool(ds.get("columnName"))


def _rows(ds, columns):
    """Reconstruct row dicts from the column-oriented {columnValue} shape (a list
    of per-row value-lists aligned to `columns`), or pass through a list-of-dicts."""
    cv = ds.get("columnValue")
    if not isinstance(cv, list) or not cv:
        return []
    if isinstance(cv[0], dict):
        return cv
    if isinstance(cv[0], (list, tuple)):
        return [dict(zip(columns, r)) for r in cv]
    return []


# Non-PII columns near-certain to exist on a per-college user/contact view — used
# ONLY as a *reachability* seed when the no-columnName discovery 500s, to tell
# "view needs an explicit column list" apart from "view is auth-gated".
SEED_COLUMNS = ["College"]

# Guess-and-confirm candidate columns (union of likely College Users & Roles +
# College Contacts fields). Each is probed alongside the known-good `College`
# anchor; the API echoes back the columns it accepted (an unknown column is
# either dropped from the echo or 500s the request), so we keep only the ones
# it actually returns. PII-safe: confirming a field EXISTS never prints its
# values (the per-field analysis masks high-cardinality / @-bearing fields).
GUESS_COLUMNS = [
    # college / district
    "College", "CollegeId", "CollegeID", "CollegeCode", "CollegeName",
    "District", "DistrictName", "DistrictId",
    # person
    "FirstName", "LastName", "MiddleName", "MiddleInitial", "Name", "FullName",
    "DisplayName", "ContactName", "Suffix", "Prefix",
    # contact
    "Email", "EmailAddress", "Phone", "PhoneNumber", "Telephone", "Extension",
    # role / title / status
    "Role", "RoleName", "UserRole", "Roles", "ContactType", "ContactRole",
    "Title", "JobTitle", "Position", "Department", "Division",
    "Status", "IsActive", "Active", "AccountStatus",
    # account / identity
    "UserId", "UserID", "UserName", "Username", "Login", "LoginName", "GUID",
    # timestamps
    "LastLogin", "LastLoginDate", "LastLoginDateTime", "CreatedDate",
    "CreatedDateTime", "ModifiedDate", "UpdatedDate", "LastUpdated",
    "DateCreated", "DateModified", "LastModified",
    # contact-view specific (run #2 found View_CollegeContacts uses different
    # names than the Users view — only "College" matched). MAP is case-SENSITIVE
    # (UserName ✓ vs Username ✗), so spellings matter.
    "ContactEmail", "ContactFirstName", "ContactLastName", "ContactPhone",
    "ContactTitle", "PrimaryContact", "ContactPerson", "PersonName",
    "RoleTitle", "RoleDescription", "ContactRoleName", "EmailId", "PhoneNo",
    "CollegeContact", "VPInstruction", "VPStudentServices", "CPLCoordinator",
    "ArticulationOfficer", "CEO", "President", "Dean",
    # ── Builder-UI-derived candidates (Sam, 2026-06-30) ──────────────────────
    # The Builder shows DISPLAY labels (e.g. "CollegeID" while the API name is
    # "CollegeId"; "Primary Contact" with a space). De-space to PascalCase to
    # guess the API columnName; the value-signature probe confirms which are real.
    # Users & Roles extras (Builder shows 11; the probe already locked 7):
    "Administrator", "Order", "RoleID", "SuperUser",
    # ── Session 88: the 3 NEW user fields Sam added to the Custom Report
    # (Builder labels Active / UserStatus / UserDisciplines / LastUpdatedOn).
    # Guess the de-spaced PascalCase + close variants; value-signature confirms. ──
    "Active", "UserStatus", "UserDisciplines", "UserDiscipline", "Disciplines",
    "Discipline", "UserActive", "ActiveStatus", "LastUpdatedOn", "LastUpdatedDate",
    # Contacts role-columns + their emails/phones + the staleness field:
    "PrimaryContactEmail", "PrimaryContactPhone",
    "VPAA", "VPAAEmail", "VPSS", "VPSSEmail", "LastUpdatedOn",
    "AcademicSenatePresident", "AcademicSenatePresidentEmail",
    "ArticulationOfficerEmail", "CEOEmail", "CPLCoordinatorEmail",
    "CPLCounselorContact", "CPLCounselorEmail", "FacultyLead", "FacultyLeadEmail",
    "ITContact", "ITContactEmail", "LeadInitiator", "LeadInitiatorEmail",
    "LeadManager", "LeadManagerEmail", "SchoolCertifyingOfficial",
    "VeteranSchoolCertifyingOfficialEmail",
    "VRCOfficialFromMapCohortApplication", "VRCOfficialFromMapCohortApplicationEmail",
    "VRCOfficialFromMapCohortApplicationPhone",
    # ── Builder labels VERBATIM, WITH spaces (run #8: VPAA/VPSS ✓ but the
    # de-spaced *Email/PrimaryContact/LastUpdatedOn all 400'd → the Contacts
    # email/multi-word columns likely keep the spaces from the Builder label,
    # since "VPAA" (no space in label) worked but "VPAAEmail" didn't). ──────────
    "VPAA Email", "VPSS Email", "CEO Email",
    "Primary Contact", "Primary Contact Email", "Primary Contact Phone",
    "Last Updated On",
    "CPL Coordinator", "CPL Coordinator Email",
    "CPL Counselor Contact", "CPL Counselor Email",
    "Articulation Officer", "Articulation Officer Email",
    "Academic Senate President", "Academic Senate President Email",
    "Faculty Lead", "Faculty Lead Email", "IT Contact", "IT Contact Email",
    "Lead Initiator", "Lead Initiator Email", "Lead Manager", "Lead Manager Email",
    "School Certifying Official", "Veteran School Certifying Official Email",
    # ── Session 120: the STUDENT-FACING contact hunt (Sam, 2026-08-05) ─────────
    # Goal: every college landing page routes a student CPL request to a real
    # person. MAP routes on Primary Contact Email; Sam believes a second
    # student-facing contact ("CPL Assistant") exists in the Contacts report.
    # Probe the plausible spellings — Builder labels keep their SPACES (the
    # "VPAA Email" ✓ / "VPAAEmail" ✗ finding), so try both forms.
    "CPL Assistant", "CPL Assistant Email",
    "CPLAssistant", "CPLAssistantEmail",
    "CPL Assistant Contact", "CPL Assistant Contact Email",
    "Assistant", "Assistant Email",
    "CPL Contact", "CPL Contact Email",
    "CPL Specialist", "CPL Specialist Email",
    "CPL Analyst", "CPL Analyst Email",
    "CPL Staff", "CPL Staff Email",
    "Alternate Contact", "Alternate Contact Email",
    "Secondary Contact", "Secondary Contact Email",
    "Counselor", "Counselor Email",
    "Evaluator", "Evaluator Email",
    "Records", "Records Email", "Registrar", "Registrar Email",
    "Admissions", "Admissions Email",
]


# Garbage column names used to CALIBRATE the "unknown column" response. The MAP
# report API returns 2-wide rows even for a column it doesn't recognize (the
# structural width/echo heuristic over-accepts — every candidate "passed", run
# #1), so we instead inspect the VALUES: a REAL column carries its own data; a
# FAKE one is null / empty / a copy of the anchor. The sentinels reveal exactly
# what "fake" looks like on this server so the threshold is data-driven.
SENTINEL_COLUMNS = ["ZqxNotAColumn1", "FakeFieldQwerty2", "NoSuchColumn3"]

# Non-null share at/above which a signature-passing column is auto-confirmed.
# Below it (but still clearing the garbage baseline) the column is reported as
# "weak" — real-looking but sparsely populated — for a human call. See _looks_real.
FILL_FLOOR = 0.25


def _column_signature(view, anchor, col):
    """PII-SAFE value signature of `col` when requested alongside `anchor`.
    Returns counts only — never a raw value. Keys: http, code, n, nonnull,
    distinct, copies_anchor, width, echoed."""
    r = _try(view, [anchor, col])
    sig = {"http": r["http"], "code": None, "n": 0, "nonnull": 0,
           "distinct": 0, "copies_anchor": 0, "width": 0, "echoed": False}
    ds = r.get("ds")
    if r["http"] != 200 or ds is None:
        return sig
    sig["code"] = ds.get("responseCode")
    sig["echoed"] = any(str(e).lower() == col.lower()
                        for e in (ds.get("columnName") or []))
    cv = ds.get("columnValue") or []
    if cv and isinstance(cv[0], (list, tuple)):
        sig["width"] = len(cv[0])
    elif cv and isinstance(cv[0], dict):
        sig["width"] = len(cv[0])
    rows = _rows(ds, [anchor, col])
    sig["n"] = len(rows)
    seen = set()
    for row in rows:
        a, c = row.get(anchor), row.get(col)
        if c not in (None, ""):
            sig["nonnull"] += 1
            seen.add(str(c))
            if str(c) == str(a):
                sig["copies_anchor"] += 1
    sig["distinct"] = len(seen)
    return sig


def _looks_real(sig, fake):
    """Classify a candidate column by VALUE SIGNATURE. Returns one of:
      "real" — carries its own data at a healthy fill rate,
      "weak" — clears the garbage baseline and has real distinct values, but is
               SPARSELY populated (below FILL_FLOOR),
      ""     — indistinguishable from an unknown column.

    The "weak" band was added Session 120: a genuinely real but sparsely-filled
    contact column (e.g. a role only 12 of 123 colleges have named) sits below
    the 0.25 fill floor and was being silently rejected as fake. Sparse ≠ fake —
    a fake column returns NOTHING, so distinct>1 over a nonzero baseline is the
    honest signal. Weak columns are reported, not auto-confirmed, so a human
    reads the counts and decides.
    """
    n = sig["n"] or 1
    nonnull_share = sig["nonnull"] / n
    copy_share = sig["copies_anchor"] / n
    if sig["http"] != 200 or sig["nonnull"] == 0:
        return ""
    if sig["distinct"] <= 1 or copy_share >= 0.9:
        return ""
    # Must clear the fake baseline (the best a known-garbage column achieved).
    if not (sig["nonnull"] > fake["nonnull"] and sig["distinct"] > fake["distinct"]):
        return ""
    return "real" if nonnull_share >= FILL_FLOOR else "weak"


def _confirm_columns(view, anchor, candidates):
    """Confirm the real field list by VALUE SIGNATURE (run #2 method). Calibrate
    the 'unknown column' response with garbage sentinels, then keep each
    candidate whose values clearly beat that baseline. Prints a PII-safe per-
    candidate line (counts only). Returns the ordered confirmed list (anchor
    first)."""
    print(f"  → value-signature confirm: {len(candidates)} candidates "
          f"(anchor={anchor!r}); calibrating with {len(SENTINEL_COLUMNS)} sentinels …")
    fake = {"nonnull": 0, "distinct": 0}
    for s in SENTINEL_COLUMNS:
        sg = _column_signature(view, anchor, s)
        fake["nonnull"] = max(fake["nonnull"], sg["nonnull"])
        fake["distinct"] = max(fake["distinct"], sg["distinct"])
        print(f"    · sentinel {s}: http={sg['http']} code={sg['code']!r} "
              f"width={sg['width']} nonnull={sg['nonnull']}/{sg['n']} "
              f"distinct={sg['distinct']} copies={sg['copies_anchor']} echo={sg['echoed']}")
    print(f"    fake baseline → nonnull≤{fake['nonnull']}, distinct≤{fake['distinct']}")
    if fake["nonnull"] > 0:
        print("    ⚠ garbage columns returned data — the server pads unknown "
              "columns; value-signature may be unreliable. Inspect the lines below "
              "/ fall back to the MAP Builder UI.")

    confirmed = [anchor]
    weak = []
    have = {anchor.lower()}
    tried = set()
    for c in candidates:
        if c in tried or c.lower() in have:
            continue
        tried.add(c)
        sig = _column_signature(view, anchor, c)
        verdict = _looks_real(sig, fake)
        mark = {"real": "✓", "weak": "?"}.get(verdict, "·")
        print(f"    {mark} {c}: http={sig['http']} code={sig['code']!r} "
              f"width={sig['width']} nonnull={sig['nonnull']}/{sig['n']} "
              f"distinct={sig['distinct']} copies={sig['copies_anchor']} echo={sig['echoed']}")
        if verdict == "real":
            confirmed.append(c)
            have.add(c.lower())
        elif verdict == "weak":
            weak.append(c)
    print(f"  → confirmed {len(confirmed)} field(s) by value signature: {confirmed}")
    if weak:
        print(f"  ? {len(weak)} SPARSE candidate(s) cleared the garbage baseline but "
              f"fell below the {FILL_FLOOR:.0%} fill floor — real-but-rarely-populated "
              f"columns look like this. Read their counts above and decide: {weak}")
    return confirmed


def _try(view, column_name=None):
    """One POST. Returns {http, ds} (http=200 + ds on success; http=code, ds=None
    on an HTTPError; http=None on a URLError)."""
    payload = {"viewName": view}
    if column_name:
        payload["columnName"] = column_name
    try:
        return {"http": 200, "ds": _dataset(_post([payload]), view)}
    except urllib.error.HTTPError as e:
        return {"http": e.code, "ds": None, "err": str(e)}
    except urllib.error.URLError as e:
        return {"http": None, "ds": None, "err": str(e)}


def _resolve(label, candidates):
    """Try each candidate viewName (pass 1, no columnName); return (view, columns, ds)
    for the first the API ACCEPTS. A clean 400 '… is not Valid' = wrong name → next.
    An HTTP 500 = the name is RECOGNIZED but the server errored building the report
    without columns → seed-probe with SEED_COLUMNS to classify auth-gated vs
    needs-columns, then report. Returns (None, [], None) if nothing was accepted."""
    print(f"\n########## {label} ##########")
    recognized = None  # first candidate that 500'd (recognized name, blocked)
    for view in candidates:
        r = _try(view)
        if r["http"] == 200 and _is_valid(r["ds"]):
            cols = r["ds"].get("columnName") or []
            print(f"  ✓ {view}: VALID — {len(cols)} fields "
                  f"(responseCode={r['ds'].get('responseCode')!r} "
                  f"dataCount={r['ds'].get('dataCount')!r})")
            return view, cols, r["ds"]
        if r["http"] in (500, 502, 503):
            # Recognized name (the validity check passed) but the no-column build
            # errored server-side. Not "is not Valid" — keep it as the real name.
            print(f"  ⚠ {view}: HTTP {r['http']} (RECOGNIZED name — server errored "
                  f"building report without columns)")
            recognized = recognized or view
            continue
        if r["http"] != 200:
            print(f"  ✗ {view}: ERROR fetching: HTTP {r['http']}")
            continue
        ds = r["ds"]
        print(f"  ✗ {view}: responseCode={ds.get('responseCode')!r} "
              f"responseMessage={ds.get('responseMessage')!r}")

    if recognized:
        # Reachability seed: name a non-PII column and see if the server returns
        # data. Success → view works WITH columns (just no self-describe); still
        # 500/4xx → likely auth-gated (needs MAP_API_KEY) or otherwise blocked.
        print(f"  → recognized name '{recognized}' but no-column discovery failed. "
              f"Seed-probing with columnName={SEED_COLUMNS} …")
        seed = _try(recognized, SEED_COLUMNS)
        if seed["http"] == 200 and seed["ds"]:
            ds = seed["ds"]
            rows = _rows(ds, SEED_COLUMNS)
            print(f"    seed responseCode={ds.get('responseCode')!r} "
                  f"dataCount={ds.get('dataCount')!r} rows={len(rows)}")
            if rows:
                print(f"    → REACHABLE with an explicit column list "
                      f"(no auth needed). Running guess-and-confirm to capture "
                      f"the field list …")
                cols = _confirm_columns(recognized, SEED_COLUMNS[0], GUESS_COLUMNS)
                if len(cols) > 1:
                    return recognized, cols, None
                print("    → guess-and-confirm found no extra columns; the field "
                      "names may be non-obvious — fall back to the MAP Builder UI.")
            else:
                print("    → accepted the column but returned no rows.")
        else:
            print(f"    seed HTTP {seed['http']} → still blocked. Likely AUTH-GATED "
                  f"(set MAP_API_KEY) — consistent with these being the PII views.")
        return None, [], None

    print(f"  → no candidate accepted for {label}.")
    return None, [], None


def _analyze(view, columns, ds1):
    print(f"\n=== {view}: {len(columns)} FIELDS ===")
    print("FIELDS:", columns)

    rows = _rows(ds1, columns) if ds1 else []
    if not rows and columns:
        # Pass 2 — re-request WITH the discovered columns to pull the rows.
        print(f"\n(no values in pass 1 — re-requesting with the {len(columns)} columns…)")
        try:
            ds2 = _dataset(_post([{"viewName": view, "columnName": columns}]), view)
            print(f"pass2 dataCount={ds2.get('dataCount')!r} "
                  f"responseCode={ds2.get('responseCode')!r}")
            rows = _rows(ds2, columns)
        except (urllib.error.HTTPError, urllib.error.URLError) as e:
            print(f"  ERROR fetching pass 2: {e}")

    if not rows:
        print("\n  No row values returned — field names captured above; "
              "value/role analysis skipped.")
        return

    print(f"\n=== {len(rows):,} rows · per-field (PII-safe) ===")
    for f in columns:
        vals = [r.get(f) for r in rows]
        nonnull = [v for v in vals if v not in (None, "")]
        types = sorted({type(v).__name__ for v in nonnull}) or ["null"]
        lens = [len(str(v)) for v in nonnull]
        lo, hi = (min(lens), max(lens)) if lens else (0, 0)
        distinct = {str(v) for v in nonnull}
        # A field with ≤ MAX_ENUM distinct values across thousands of rows is a
        # CATEGORY (role / status / type), not personal data — safe to print even
        # if its name contains a PII hint (e.g. "RoleName"). Emails are the one
        # low-cardinality-looking trap, so always mask anything with an '@'.
        has_at = any("@" in str(v) for v in nonnull[:500])
        if len(distinct) <= MAX_ENUM and not has_at:
            tail = "values=" + json.dumps(sorted(distinct), ensure_ascii=False)
        else:
            tail = f"distinct≈{len(distinct)} (MASKED — high-cardinality or PII)"
        print(f"  - {f}: nonnull={len(nonnull)}/{len(rows)} "
              f"type={','.join(types)} len[{lo}..{hi}] {tail}")


def main():
    print(f"Probing MAP user/contact views @ {API_URL}")
    print("(PII-safe: no raw names/emails/phones printed; nothing written to disk)")
    for label, candidates in VIEW_SETS:
        view, columns, ds1 = _resolve(label, candidates)
        if view:
            _analyze(view, columns, ds1)
    print("\nDone. No raw names/emails/phones printed; nothing written to disk.")


if __name__ == "__main__":
    main()
