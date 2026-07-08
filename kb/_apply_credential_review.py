"""
Sync Credential Reference curator edits from Supabase into the git-canonical
overlay:
  Supabase public.kb_curation (_CREDENTIAL_REVIEW::<unified_title> namespace)
    ->  kb/credential_review_overlay.json

The Credential Reference tab (credential_reference.js) lets allowed reviewers
override 4 fields per unified_title row:
  - unified_title_override   (DISPLAY-ONLY by PR-4 design; identity stays)
  - issuing_agency_override
  - training_agency_override
  - quality_flag_override
  - (plus the "reviewed_marker" sentinel from PR-B's Mark Initiated)

The dashboard reads the overlay live from Supabase, so curator edits show
immediately on the Credential Reference tab. This script keeps the GIT-CANONICAL
overlay in sync so the BAKED `credential_reference_data.js` payload (and any
other consumer reading the JSON files directly) carries the same edits.

What's applied (Mode A — this script):
  - issuing_agency_override, training_agency_override, quality_flag_override
  - reviewed_marker
  These are SAFE edits — they don't ripple into the identity key
  (`unified_title`) or into kb/coci_articulations.json. The overlay is
  consumed by excel_to_dashboard.py:export_credential_reference().

What's RECORDED but NOT APPLIED (Mode B — Cred-Ref PR-5b):
  - unified_title_override — a rename ripples into kb/unified_titles.json key,
    kb/credentials.json key, AND kb/coci_articulations.json's inlined
    unified_title field. That's a re-mint, NOT a routine sync. It needs the
    full playbook from docs/coursecontrolnumber_remint.md: dry-run → alias
    map committed → atomic land within the 10:17 UTC cron window → Supabase
    override row cleared in lock-step. Until that ships, the rename-overrides
    are recorded in the overlay (so curators get audit visibility) but not
    folded into the JSON files.

Mode A2 — CANONICAL ISSUER PROMOTION (Session 104). An issuing_agency_override
was previously display-only: the bake showed it while kb/credentials.json (the
canonical issuer store every non-dashboard consumer reads) kept null. Now the
sync also promotes the override into credentials.json, mirroring the fold's
issuer semantics (kb/_fold_unclassified.py): FILL the first record when its
issuer is null + unreviewed-machine; APPEND an additional record when the
override names a certifying body no existing record carries (Rule 4 — same
credential, multiple issuers); no-op when the issuer is already present under
any spelling. Additive only — an existing record's issuer is never overwritten.
Sam's motivating case (2026-07-07): '10-Key Data Entry' has a machine record
with a null issuer that the Curate panel couldn't durably fill.

Auth: uses the SERVICE-ROLE key (bypasses RLS) — keep it secret. NEVER put it
in the dashboard page; only here, from the environment.

Env:
  SUPABASE_URL          (default https://hvuwhnbuahrtptokpqfh.supabase.co)
  SUPABASE_SERVICE_KEY  (required — the service_role / secret key)

Run from repo root:
  SUPABASE_SERVICE_KEY=... python3 kb/_apply_credential_review.py
Then review the diff and commit kb/credential_review_overlay.json.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "credential_review_overlay.json")
CR_PATH = os.path.join(HERE, "credentials.json")
URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

KEY_PREFIX = "_CREDENTIAL_REVIEW::"
# Fields we copy verbatim into the overlay (every field PR-4 + PR-B can write).
# unified_title_override is recorded but NOT applied by the JSON-merge consumer
# (excel_to_dashboard.py:export_credential_reference()) — see Mode B above.
FIELDS = {
    "unified_title_override",
    # PR-5b/2 (Session 107): the curator's explicit ✓ Confirm-merge record —
    # value = the EXACT existing credential key the colliding rename folds
    # into. Recorded in the overlay for the rename dry-run to consume; never
    # promoted by Modes A2/A3 (it's a decision record, not an agency).
    "unified_title_merge_confirm",
    "issuing_agency_override",
    "issuing_agency_additional_override",
    "training_agency_override",
    "quality_flag_override",
    "reviewed_marker",
}


def fetch_rows():
    # PostgREST: ?course_id=like.PREFIX%25 filters server-side so we don't pull
    # every row in kb_curation (which includes the discipline overlay too).
    endpoint = (f"{URL}/rest/v1/kb_curation"
                "?select=course_id,field,value,reviewer_email,reviewed_at"
                f"&course_id=like.{KEY_PREFIX}%25")
    req = urllib.request.Request(endpoint, headers={
        "apikey": KEY, "Authorization": f"Bearer {KEY}", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


# ── Mode A2 helpers — mirror kb/_fold_unclassified.py's issuer semantics;
# keep the two in sync ─────────────────────────────────────────────────────────

def _norm_issuer(s):
    return " ".join((s or "").split()).casefold()


def _issuer_present(iss_norm, recs):
    """Same certifying body under any spelling: exact normalized match, the
    existing record's trailing parenthetical acronym ('NCCER' ≡ '…(NCCER)'),
    or outright containment for non-trivial strings (≥8 chars)."""
    for x in recs:
        existing = x.get("issuing_agency") or ""
        e = _norm_issuer(existing)
        if not e:
            continue
        if iss_norm == e:
            return True
        m = re.search(r"\(([^()]+)\)\s*$", existing)
        if m and _norm_issuer(m.group(1)) == iss_norm:
            return True
        if len(iss_norm) >= 8 and (iss_norm in e or e in iss_norm):
            return True
    return False


def promote_issuers(overrides):
    """Mode A2: fold issuing_agency_override values into kb/credentials.json.
    Returns (fills, adds, missing) for the run report; writes only on change."""
    try:
        cr = json.load(open(CR_PATH, encoding="utf-8"))
    except (OSError, ValueError):
        return [], [], []
    today = date.today().isoformat()
    fills, adds, missing = [], [], []
    # The primary override first (it gets the rec0 fill when eligible), then
    # the ADDITIONAL override (the Triage lane's "＋ add issuing agency" —
    # Rule 4 multi-issuer, Sam 2026-07-08) with the same fill-or-append,
    # never-overwrite semantics.
    for ut, entry in overrides.items():
        recs = None
        # The additional field may carry SEVERAL agencies " | "-delimited
        # (Session 107 — unlimited ＋ in the Triage lane; one kb_curation row,
        # each agency promoted with the same fill-or-append semantics).
        queue = []
        primary = (entry.get("issuing_agency_override") or "").strip()
        if primary:
            queue.append(primary)
        for extra in (entry.get("issuing_agency_additional_override") or "").split("|"):
            extra = extra.strip()
            if extra:
                queue.append(extra)
        for iss in queue:
            if recs is None:
                recs = cr.get(ut)
            if not recs:
                missing.append(ut)  # override on a title with no credential
                break               # record — report, never mint here
            rec0 = recs[0]
            if (not rec0.get("issuing_agency")
                    and not (rec0.get("reviewed_by") or "")):
                rec0["issuing_agency"] = iss
                rec0["confidence_issuer"] = 1.0
                rec0["reviewed_by"] = entry.get("reviewed_by")
                rec0["reviewed_at"] = entry.get("reviewed_at")
                fills.append({"title": ut, "issuer": iss})
            elif not _issuer_present(_norm_issuer(iss), recs):
                recs.append({
                    "issuing_agency": iss,
                    "training_agency": None,
                    "confidence_issuer": 1.0,
                    "confidence_trainer": 0.9,
                    "classified_at": today,
                    "classified_by": "curator (CER issuing-agency override)",
                    "reviewed_at": entry.get("reviewed_at"),
                    "reviewed_by": entry.get("reviewed_by"),
                    "_notes": "Additional issuing agency from a Curate-panel "
                              "override — same credential, multiple certifying "
                              "bodies (Rule 4).",
                })
                adds.append({"title": ut, "issuer": iss})
    if fills or adds:
        with open(CR_PATH, "w", encoding="utf-8") as f:
            json.dump(cr, f, indent=2, ensure_ascii=False)
            f.write("\n")
    return fills, adds, missing


def promote_trainers(overrides):
    """Mode A3 (Session 106 — Sam's Rule 5f: HS/ROP/adult-school Cx exhibits
    carry the school as BOTH issuer and trainer): fold training_agency_override
    values into kb/credentials.json. FILL-when-null-and-unreviewed only —
    mirrors Mode A2's first-record fill; an existing trainer is never
    overwritten (the override still shows on the dashboard via the overlay)."""
    try:
        cr = json.load(open(CR_PATH, encoding="utf-8"))
    except (OSError, ValueError):
        return [], []
    fills, missing = [], []
    for ut, entry in overrides.items():
        tr = (entry.get("training_agency_override") or "").strip()
        if not tr:
            continue
        recs = cr.get(ut)
        if not recs:
            missing.append(ut)
            continue
        rec0 = recs[0]
        if not (rec0.get("training_agency") or "").strip():
            rec0["training_agency"] = tr
            rec0["confidence_trainer"] = 1.0
            if not rec0.get("reviewed_by"):
                rec0["reviewed_by"] = entry.get("reviewed_by")
                rec0["reviewed_at"] = entry.get("reviewed_at")
            fills.append({"title": ut, "trainer": tr})
    if fills:
        with open(CR_PATH, "w", encoding="utf-8") as f:
            json.dump(cr, f, indent=2, ensure_ascii=False)
            f.write("\n")
    return fills, missing


def main():
    if not KEY:
        sys.exit("Set SUPABASE_SERVICE_KEY (service_role key) in the environment.")
    rows = fetch_rows()

    overrides = {}
    skipped_field = 0
    skipped_prefix = 0
    rename_count = 0
    for row in rows:
        cid = row.get("course_id") or ""
        if not cid.startswith(KEY_PREFIX):
            skipped_prefix += 1
            continue
        ut = cid[len(KEY_PREFIX):]
        field = (row.get("field") or "").strip()
        if field not in FIELDS:
            skipped_field += 1
            continue
        entry = overrides.setdefault(ut, {})
        entry[field] = row.get("value")
        if field == "unified_title_override" and row.get("value"):
            rename_count += 1
        # Latest reviewer/timestamp wins (matches _apply_curation.py).
        if row.get("reviewed_at", "") >= entry.get("reviewed_at", ""):
            entry["reviewed_by"] = row.get("reviewer_email")
            entry["reviewed_at"] = row.get("reviewed_at")

    out = {
        "_about": (
            "Credential-Reference curator overrides synced from Supabase "
            "kb_curation (_CREDENTIAL_REVIEW::<unified_title> namespace). "
            "Applied by excel_to_dashboard.py:export_credential_reference() "
            "for issuer/trainer/quality_flag/reviewed_marker. "
            "unified_title_override is RECORDED here but NOT applied as a "
            "rename — that's Cred-Ref PR-5b with the re-mint playbook."
        ),
        "_synced_from": "Supabase project hvuwhnbuahrtptokpqfh, table public.kb_curation",
        "_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(overrides),
        "rename_overrides_recorded_not_applied": rename_count,
        "overrides": dict(sorted(overrides.items())),
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"wrote {OUT}: {len(overrides)} unified_titles with overrides "
          f"({len(rows)} rows from Supabase, "
          f"{skipped_field} unknown-field skipped, "
          f"{skipped_prefix} non-credential-review skipped, "
          f"{rename_count} rename overrides recorded-not-applied)")

    fills, adds, missing_cred = promote_issuers(overrides)
    if fills or adds or missing_cred:
        print(f"Mode A2 issuer promotion → credentials.json: "
              f"{len(fills)} filled {[(f['title'], f['issuer']) for f in fills]}, "
              f"{len(adds)} appended {[(a['title'], a['issuer']) for a in adds]}, "
              f"{len(missing_cred)} title(s) with no credential record skipped "
              f"{missing_cred[:5]}")
    t_fills, t_missing = promote_trainers(overrides)
    if t_fills or t_missing:
        print(f"Mode A3 trainer promotion → credentials.json: "
              f"{len(t_fills)} filled {[(f['title'], f['trainer']) for f in t_fills]}, "
              f"{len(t_missing)} title(s) with no credential record skipped "
              f"{t_missing[:5]}")
    print("Review the diff, then commit kb/credential_review_overlay.json "
          "(+ kb/credentials.json when Modes A2/A3 promoted agencies).")


if __name__ == "__main__":
    main()
