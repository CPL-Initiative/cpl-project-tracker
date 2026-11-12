#!/usr/bin/env python3
"""An issuer an override once appended, that no current override names, is reported
and never removed (S636; cpl_memory p-credential-review-apply-never-removes-issuer).

S634: 10-Key Data Entry's issuer override changed and the old issuer stayed in
kb/credentials.json beside the new one until the reference was edited by hand.
The apply cannot tell a replaced issuer from a second rightful one (Rule 4), so it
names the candidates and leaves the reference alone.
"""
import copy
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _apply_credential_review as A  # noqa: E402

results = []


def check(name, ok):
    results.append((name, bool(ok)))


APP = A.OVERRIDE_APPENDED
cr = {
    "10-Key Data Entry": [
        {"issuing_agency": "California Community Colleges", "classified_by": "machine"},
        {"issuing_agency": "Modesto Junior College", "classified_by": APP},
    ],
    "Welding": [
        {"issuing_agency": "American Welding Society (AWS)", "classified_by": "machine"},
        {"issuing_agency": "NCCER", "classified_by": APP},
    ],
    "First Aid": [
        {"issuing_agency": "American Red Cross", "classified_by": "machine"},
        {"issuing_agency": "American Heart Association", "classified_by": "machine"},
    ],
}
ov = {
    "10-Key Data Entry": {"issuing_agency_override": "California Community Colleges"},
    "Welding": {"issuing_agency_override": "AWS", "issuing_agency_additional_override": "NCCER | ASME"},
    "First Aid": {"issuing_agency_override": "American Red Cross"},
}
before = copy.deepcopy(cr)
stale = A.stale_override_issuers(ov, cr)
check("an appended issuer no current override names is reported",
      stale == [{"title": "10-Key Data Entry", "issuer": "Modesto Junior College"}])
check("an appended issuer the additional override still names is not reported",
      not any(x["title"] == "Welding" for x in stale))
check("an issuer no override appended is never reported",
      not any(x["title"] == "First Aid" for x in stale))
check("the report removes nothing from the reference", cr == before)
check("a title with no issuer override is not read",
      A.stale_override_issuers({"10-Key Data Entry": {"quality_flag_override": "x"}}, cr) == [])
check("an empty overlay or reference reports nothing",
      A.stale_override_issuers({}, cr) == [] and A.stale_override_issuers(ov, {}) == [])

failed = [r for r in results if not r[1]]
for name, ok in results:
    print(("PASS " if ok else "FAIL ") + name)
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
