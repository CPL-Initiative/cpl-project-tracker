"""
What changed in the industry -> a markdown report of one credential-watch run.

The industry-credential watch agent (docs/reference/credential_watch_agent.md)
edits kb/reference/industry_credential_watch.json, then runs this to say what
the edit means: credentials the issuers added, retired, renamed or relaunched
since the committed version. The report is the PR body and the run's receipt,
so a reader learns what moved in the industry without reading a JSON diff.

Run from the repo root:
  python3 kb/_diff_credential_watch.py                    # working file vs HEAD
  python3 kb/_diff_credential_watch.py --base REF         # vs another git ref
  python3 kb/_diff_credential_watch.py --out PATH.md      # also write the report
Exit 0 always; "no change" is a normal outcome and prints as one line.
"""
import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REL = "kb/reference/industry_credential_watch.json"


def key(r):
    return (r.get("issuer", ""), (r.get("code") or r.get("name", "")).lower())


def load_ref(ref):
    try:
        txt = subprocess.run(["git", "show", f"{ref}:{REL}"], cwd=ROOT, check=True,
                             capture_output=True, text=True).stdout
        return json.loads(txt)
    except subprocess.CalledProcessError:
        return {"credentials": [], "partnerships": []}


def diff(old, new):
    o = {key(r): r for r in old.get("credentials", [])}
    n = {key(r): r for r in new.get("credentials", [])}
    added = [n[k] for k in n if k not in o]
    dropped = [o[k] for k in o if k not in n]
    changed = []
    for k in n.keys() & o.keys():
        a, b = o[k], n[k]
        moves = [(f, a.get(f), b.get(f)) for f in ("name", "status", "level", "url", "verified")
                 if a.get(f) != b.get(f)]
        if moves:
            changed.append((b, moves))
    po = {(p.get("issuer"), p.get("name")) for p in old.get("partnerships", [])}
    new_partnerships = [p for p in new.get("partnerships", [])
                        if (p.get("issuer"), p.get("name")) not in po]
    return added, dropped, changed, new_partnerships


def label(r):
    code = f" ({r['code']})" if r.get("code") else ""
    return f"{r.get('issuer')}: {r.get('name')}{code}"


def report(old, new):
    added, dropped, changed, partners = diff(old, new)
    out = [f"# Industry credential watch, {new.get('_verified_on', 'undated')}", ""]
    if not (added or dropped or changed or partners):
        out.append(f"No change since {old.get('_verified_on', 'the last run')}.")
        return "\n".join(out) + "\n"
    emerging = [r for r in added if r.get("emerging")]
    out.append(f"{len(added)} added ({len(emerging)} emerging), {len(changed)} changed, "
               f"{len(dropped)} dropped, {len(partners)} new California partnerships.")
    if added:
        out += ["", "## Added", ""]
        out += [f"- {label(r)} -- {r.get('kind', 'certification')}, {r.get('status', '')}"
                f"{', launched ' + str(r['launched']) if r.get('launched') else ''}."
                f" {r.get('url', '')}" for r in sorted(added, key=label)]
    if changed:
        out += ["", "## Changed", ""]
        for r, moves in sorted(changed, key=lambda t: label(t[0])):
            out.append(f"- {label(r)}: " + "; ".join(f"{f} {a!r} -> {b!r}" for f, a, b in moves))
    if dropped:
        out += ["", "## Dropped from the file", "",
                "A run marks a retired credential `retired`; it never deletes the row. "
                "Each line here needs a reason in the PR.", ""]
        out += [f"- {label(r)}" for r in sorted(dropped, key=label)]
    if partners:
        out += ["", "## New California partnerships", ""]
        out += [f"- {p.get('issuer')}: {p.get('name')} ({p.get('launched', '')}). {p.get('url', '')}"
                for p in partners]
    return "\n".join(out) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--base", default="HEAD")
    ap.add_argument("--out")
    a = ap.parse_args(argv)
    with open(os.path.join(ROOT, REL), encoding="utf-8") as fh:
        new = json.load(fh)
    text = report(load_ref(a.base), new)
    sys.stdout.write(text)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, "w", encoding="utf-8") as fh:
            fh.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
