"""
_probe_exhibit_evidence_fields.py — does the Exhibit CRs Catalog carry usable
"required evidence" text, and is it TRUNCATED?

Runs ON THE GITHUB ACTIONS RUNNER. A Claude session's container cannot reach the
MAP hosts (egress allowlist), which is why this is a workflow step and not
something a session can answer directly.

Sam, 2026-08-14: "Thinking about Sierra's My College responses and checking to
see if she has access or awareness of the EvidenceDescription field and
EvidenseTypeID field in the Exhibit CRs Catalog... It would be helpful to mention
any required evidence. The questioner mentions an AWS D1.1 welding certificate
with a 'practical test' -- maybe the required evidence might be the practical
test... Wanting to make sure the EvidenceDescription field is not truncated as it
appears to be in my json extract view."

Already established WITHOUT this probe (session 153, all three agree):
  * No Supabase column anywhere matches %evidence% → Sierra cannot see it.
  * No reference to either field anywhere in the repo.
  * fetch_custom_report.py requests 9 columns from View_ExhibitCRsCatalog_Dataset
    and neither evidence field is among them — so we never even ask MAP for it.

So this probe answers only what a session CANNOT: what MAP actually returns.

WHAT IT ANSWERS
  1. SPELLING — we do not know the real column names. Sam wrote "EvidenseTypeID";
     _discover_map_datasets.py's docstring only says "+ evidence/criteria". The
     probe requests a CANDIDATE LIST and reports which names the API honoured,
     rather than assuming one and reporting a false absence.
  2. TRUNCATION — the actual question. Decided by the LENGTH DISTRIBUTION, not by
     eyeballing: a pile of values landing on exactly 255 / 500 / 1000 / 4000 is a
     server-side cap; smoothly varying lengths with a max well past the display
     cut-off means the truncation Sam sees is his JSON VIEWER, not the data.
  3. FILL RATE — an un-truncated field that is 4% populated is not shippable to
     students either. Absence and truncation are different defects.
  4. VOCABULARY — is EvidenceTypeID a small controlled set (→ render a label) or
     open-ended?
  5. Sam's own case — the AWS D1.1 / welding rows, so he can read the real text.

COMMITS NOTHING. Prints to the run log, which Claude reads via the GitHub MCP.

PII posture (Session 34 data-minimisation, honoured here): evidence text describes
what a STUDENT must produce ("practical test", "certificate of completion"), not
who they are. Even so, sample values are printed only when the SAME string occurs
on >= MIN_OCCURRENCES_TO_PRINT rows — a string appearing on hundreds of rows
across many exhibits cannot be about one person. Rare/unique strings are counted
but never echoed. No student identifier is requested.
"""
import json
import urllib.request
import urllib.error
from collections import Counter, defaultdict

GETREPORT = "https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport"
VIEW = "View_ExhibitCRsCatalog_Dataset"

# Keys we already know are real (from fetch_custom_report.py) + every plausible
# spelling of the evidence fields. Requesting a name the view lacks is how we
# learn which one is right — see WHAT IT ANSWERS #1.
KNOWN_KEYS = ["ExhibitID", "SkillLevel", "CreditRecommendation", "Title"]
EVIDENCE_CANDIDATES = [
    "EvidenceDescription", "EvidenseTypeID", "EvidenceTypeID",
    "EvidenceType", "Evidence", "EvidenceCriteria",
    "Criteria", "CriteriaID", "CriteriaDescription",
]

# A string echoed to the log must be this common — see the PII posture above.
MIN_OCCURRENCES_TO_PRINT = 25
MAX_ECHO_CHARS = 400

# Lengths a varchar cap tends to land on. A spike here is the truncation tell.
SUSPICIOUS_LENGTHS = [50, 100, 128, 200, 250, 255, 256, 500, 512,
                      1000, 1024, 2000, 2048, 4000, 4096, 8000]


def post(cols):
    body = json.dumps([{"viewName": VIEW, "columnName": cols}]).encode()
    req = urllib.request.Request(
        GETREPORT, data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=900) as r:
        return json.loads(r.read())


def first_dataset(payload):
    if isinstance(payload, list):
        return payload[0] if payload else {}
    if isinstance(payload, dict):
        for k in ("data", "result", "datasets"):
            v = payload.get(k)
            if isinstance(v, list) and v:
                return v[0]
        return payload
    return {}


def probe_columns():
    """Return the evidence column names the API actually honours.

    Tried one at a time: a single bad name can make the whole request fail or
    silently drop, and we would not know WHICH name was the bad one.
    """
    honoured = []
    for cand in EVIDENCE_CANDIDATES:
        try:
            ds = first_dataset(post(KNOWN_KEYS[:1] + [cand]))
            returned = ds.get("columnName") or []
            if any(str(c).strip().lower() == cand.lower() for c in returned):
                honoured.append(cand)
                print(f"  ✓ {cand:<22} — honoured (returned {len(returned)} cols)")
            else:
                print(f"  ✗ {cand:<22} — not returned (view returned {returned})")
        except urllib.error.HTTPError as e:
            print(f"  ✗ {cand:<22} — HTTP {e.code}")
        except Exception as e:
            print(f"  ✗ {cand:<22} — {type(e).__name__}: {e}")
    return honoured


def length_report(label, values):
    """The truncation verdict. Length distribution decides it, not inspection."""
    lens = [len(v) for v in values if v]
    if not lens:
        print(f"\n{label}: no non-empty values — nothing to measure.")
        return
    lens.sort()
    n = len(lens)
    counts = Counter(lens)
    mx = lens[-1]
    print(f"\n{label} — LENGTH DISTRIBUTION over {n:,} non-empty values")
    print(f"  min {lens[0]} · median {lens[n // 2]} · p95 {lens[int(n * 0.95)]} · MAX {mx}")

    at_max = counts[mx]
    print(f"  values at the maximum length ({mx}): {at_max:,} "
          f"({100.0 * at_max / n:.1f}%)")

    spikes = [(L, counts[L]) for L in SUSPICIOUS_LENGTHS
              if counts.get(L, 0) >= max(5, n * 0.005)]
    if spikes:
        print("  ⚠️  SPIKES at cap-shaped lengths — consistent with SERVER-SIDE truncation:")
        for L, c in spikes:
            print(f"        length {L:>5}: {c:,} values ({100.0 * c / n:.1f}%)")
    else:
        print("  ✅ no spike at any cap-shaped length.")

    # The single clearest signal: a large share sharing one exact length.
    top_len, top_ct = counts.most_common(1)[0]
    if top_ct >= n * 0.05 and top_len >= 50:
        print(f"  ⚠️  {top_ct:,} values ({100.0 * top_ct / n:.1f}%) share the EXACT "
              f"length {top_len} — a cap, unless that string is genuinely boilerplate.")

    print("\n  VERDICT")
    if spikes or (at_max >= n * 0.05 and mx >= 50):
        print(f"    Looks TRUNCATED SERVER-SIDE at ~{mx} chars. The field cannot")
        print("    carry more than this no matter how we fetch it → upstream fix.")
    else:
        print(f"    NO server-side truncation evident. Longest value is {mx} chars")
        print("    and lengths vary freely, so a clipped value in a JSON viewer is")
        print("    the VIEWER, not the data.")


def main():
    print("=" * 78)
    print("Exhibit CRs Catalog — required-evidence probe")
    print("Question (Sam, 2026-08-14): does MAP expose usable required-evidence")
    print("text, and is EvidenceDescription truncated?")
    print("=" * 78)

    print("\n[1] Which evidence column names does the view honour?")
    honoured = probe_columns()
    if not honoured:
        print("\n❌ NONE of the candidate names were returned.")
        print("   The view does not expose evidence under any spelling tried.")
        print("   Next step is MAP-side: ask for the real column name, or whether")
        print("   evidence lives on a different view entirely.")
        return

    print(f"\n[2] Pulling {KNOWN_KEYS + honoured}")
    ds = first_dataset(post(KNOWN_KEYS + honoured))
    cols = ds.get("columnName") or []
    rows = ds.get("columnValue") or ds.get("data") or []
    ci = {str(c).strip(): i for i, c in enumerate(cols)}
    print(f"    dataCount={ds.get('dataCount')} parsed_rows={len(rows):,} columns={cols}")
    if not rows:
        print("    no rows returned — response keys:", list(ds.keys()))
        return

    def cell(r, name):
        i = ci.get(name)
        if i is None:
            return None
        if isinstance(r, list):
            return r[i] if i < len(r) else None
        return r.get(name) if isinstance(r, dict) else None

    for col in honoured:
        vals = [str(cell(r, col) or "").strip() for r in rows]
        nonempty = [v for v in vals if v]
        print("\n" + "-" * 78)
        print(f"[3] {col}")
        print(f"    fill rate: {len(nonempty):,}/{len(vals):,} "
              f"({100.0 * len(nonempty) / max(1, len(vals)):.1f}%) non-empty")
        print(f"    distinct non-empty values: {len(set(nonempty)):,}")

        if len(set(nonempty)) <= 40 and nonempty:
            print("    → SMALL CONTROLLED VOCABULARY. Full value list:")
            for v, c in Counter(nonempty).most_common():
                print(f"        {c:>7,}×  {v[:MAX_ECHO_CHARS]}")
        else:
            length_report(f"    {col}", nonempty)
            print(f"\n    Most common values (only those on >= "
                  f"{MIN_OCCURRENCES_TO_PRINT} rows — see PII posture):")
            shown = 0
            for v, c in Counter(nonempty).most_common(15):
                if c < MIN_OCCURRENCES_TO_PRINT:
                    continue
                echo = v[:MAX_ECHO_CHARS] + ("…[+%d chars]" % (len(v) - MAX_ECHO_CHARS)
                                             if len(v) > MAX_ECHO_CHARS else "")
                print(f"        {c:>7,}×  (len {len(v):>5})  {echo}")
                shown += 1
            if not shown:
                print("        (none common enough to echo — every value is rare)")

    # ── Sam's own case: AWS D1.1 / welding ─────────────────────────────────
    print("\n" + "=" * 78)
    print("[4] Sam's case — AWS D1.1 / welding rows")
    hits = 0
    for r in rows:
        title = str(cell(r, "Title") or "")
        rec = str(cell(r, "CreditRecommendation") or "")
        hay = (title + " " + rec).lower()
        if "weld" in hay or "d1.1" in hay or "aws" in hay:
            ev = " | ".join(
                f"{c}={str(cell(r, c) or '')[:MAX_ECHO_CHARS]}" for c in honoured)
            print(f"    {title[:60]:<60} :: {rec[:45]:<45} :: {ev}")
            hits += 1
            if hits >= 25:
                print("    …(capped at 25 — this is a sample, not a census)")
                break
    if not hits:
        print("    no welding/AWS rows matched in this pull.")

    print("\n" + "=" * 78)
    print("DONE. Nothing committed. Decide from the verdict above whether the")
    print("field is worth adding to fetch_custom_report.py and publishing to")
    print("Sierra — fill rate and truncation both have to pass first.")


if __name__ == "__main__":
    main()
