#!/usr/bin/env python3
"""The exchange repository's seed (partners/ctdl-exchange/seed) checks what its contract says it checks.

Sheet 102 card 1 (Sam, 2026-10-20): a private exchange Malone administers. A session cannot create a repository in
the CPL-Initiative organization, so the tracker holds the seed until Malone copies it, and this test is what keeps
the copy honest: every failure below is one the contract names, and each was seen in Credential Engine's real files
(Taft's credential CTIDs equal to its competency ids, a row count that did not match its sheet).

Each case builds a throwaway git repository from the seed, files a drop, and runs tools/check_drop.py on it.
Pure standard library.
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, "partners", "ctdl-exchange", "seed")
sys.path.insert(0, os.path.join(SEED, "tools"))
import check_drop  # noqa: E402

CTID_A = "ce-0a1b2c3d-4e5f-4789-8bcd-ef0123456789"
CTID_B = "ce-1b2c3d4e-5f60-4789-8bcd-ef0123456789"
results = []


def check(name, ok, detail=""):
    results.append(ok)
    print(f"  {'ok ' if ok else 'FAIL'} {name}" + ("" if ok else f"  -- {detail}"))


def git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True)


def new_repo():
    tmp = tempfile.mkdtemp(prefix="exchange-")
    repo = os.path.join(tmp, "x")
    shutil.copytree(SEED, repo)
    git(repo, "init", "-q", "-b", "main")
    git(repo, "-c", "user.name=t", "-c", "user.email=t@example.org", "add", "-A")
    git(repo, "-c", "user.name=t", "-c", "user.email=t@example.org", "commit", "-q", "-m", "seed")
    return repo


def commit(repo, msg):
    git(repo, "-c", "user.name=t", "-c", "user.email=t@example.org", "add", "-A")
    git(repo, "-c", "user.name=t", "-c", "user.email=t@example.org", "commit", "-q", "-m", msg)


def write_drop(repo, rel, files, manifest_over=None, rows_over=None, sha_over=None, unlisted=None):
    folder = os.path.join(repo, rel)
    os.makedirs(folder, exist_ok=True)
    entries = []
    for name, kind, text in files:
        data = text.encode("utf-8")
        with open(os.path.join(folder, name), "wb") as f:
            f.write(data)
        if name.endswith(".csv"):
            rows = max(len([ln for ln in text.splitlines() if ln.strip()]) - 1, 0)
        else:
            rows = len(json.loads(text).get("@graph", []))
        entries.append({
            "path": name, "kind": kind,
            "rows": (rows_over or {}).get(name, rows),
            "sha256": (sha_over or {}).get(name, hashlib.sha256(data).hexdigest()),
        })
    party = rel.split("/")[1] if rel.startswith("inbound/") else "cobi"
    manifest = {
        "contract_version": "0",
        "party": party,
        "drop_date": rel.rsplit("/", 1)[1],
        "produced_by": {"tool": "test", "person": "Test Person"},
        "files": entries,
    }
    if party == "credential-engine":
        manifest["college"] = {"name": "Taft College", "mis_code": "561"}
    manifest.update(manifest_over or {})
    with open(os.path.join(folder, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    for name, text in (unlisted or {}).items():
        with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
            f.write(text)


def run(repo, *args):
    out = subprocess.run([sys.executable, os.path.join(repo, "tools", "check_drop.py"), *args],
                         cwd=repo, capture_output=True, text=True)
    return out.returncode, out.stdout + out.stderr


COURSES = (
    "External Identifier,Coded Notation,Learning Opportunity Name,CTID\n"
    f"CCC000425258,AB 300,Shop Math and Measurement,{CTID_A}\n"
    "CCC000436425,AB 389,Auto Body,\n"
)
CE = "inbound/credential-engine/taft/2026-10-27"


def main():
    print("ctdl exchange seed")

    # The seed itself: the nested CLAUDE.md would load in every tracker session that reads the folder.
    check("seed holds CLAUDE.exchange.md and no CLAUDE.md (no nested auto-load in the tracker)",
          os.path.isfile(os.path.join(SEED, "CLAUDE.exchange.md"))
          and not any("CLAUDE.md" in fs for _, _, fs in os.walk(SEED)))
    contract = check_drop.Contract(SEED)
    check("every schema uses only keywords the check implements, and the kinds agree",
          contract.problems() == [], contract.problems())

    repo = new_repo()
    code, out = run(repo)
    check("the empty seed passes", code == 0 and "0 drop(s)" in out, out)

    write_drop(repo, CE, [("courses.csv", "ce.courses", COURSES)])
    code, out = run(repo)
    check("a well-formed Credential Engine drop passes", code == 0, out)
    commit(repo, "first drop")

    # Taft: the same CTID on a credential and on a competency framework.
    taft = new_repo()
    write_drop(taft, CE, [
        ("credentials.csv", "ce.credentials",
         f"External Identifier,Credential Name,Credential Type,CTID\nx1,Welding,Certificate,{CTID_B}\n"),
        ("competencies.csv", "ce.competencies", f"@type,@id,ceasn:name\nceasn:CompetencyFramework,{CTID_B},Welding\n"),
    ])
    code, out = run(taft)
    check("one CTID naming two resources fails (Taft's case)", code == 1 and "names 2 resources" in out, out)

    def fails(name, needle, rel=CE, **kw):
        r = new_repo()
        files = kw.pop("files", [("courses.csv", "ce.courses", COURSES)])
        write_drop(r, rel, files, **kw)
        code, out = run(r)
        check(name, code == 1 and needle in out, out)

    fails("a row count that does not match the manifest fails", "the manifest says 5",
          rows_over={"courses.csv": 5})
    fails("a checksum that does not match fails", "sha256 does not match", sha_over={"courses.csv": "0" * 64})
    fails("a file the manifest does not list fails", "not in the manifest", unlisted={"extra.csv": "a\n1\n"})
    fails("a drop_date that is not the folder's date fails", "is not the folder's date",
          manifest_over={"drop_date": "2026-10-28"})
    fails("another party's manifest in Credential Engine's folder fails", "does not own this folder",
          manifest_over={"party": "wested"})
    r = new_repo()
    write_drop(r, CE, [("courses.csv", "ce.courses", COURSES)])
    path = os.path.join(r, CE, "manifest.json")
    m = json.load(open(path))
    del m["college"]
    json.dump(m, open(path, "w"))
    code, out = run(r)
    check("a Credential Engine drop without its college fails", code == 1 and "missing 'college'" in out, out)
    fails("a missing required column fails", "missing required column 'Learning Opportunity Name'",
          files=[("courses.csv", "ce.courses", "External Identifier,Name\nCCC000425258,x\n")])
    fails("a column named for student data fails", "reads as student data",
          files=[("courses.csv", "ce.courses",
                  "External Identifier,Learning Opportunity Name,Student ID\nCCC000425258,x,1\n")])
    fails("a malformed CTID fails", "is not a well-formed CTID",
          files=[("courses.csv", "ce.courses",
                  "External Identifier,Learning Opportunity Name,CTID\nCCC000425258,x,ce-123\n")])
    fails("a kind another party files fails", "is filed by cobi",
          files=[("x.csv", "cobi.findings", "college,drop,file,row,field,finding,detail,fix_owner\n")])

    xw = "outbound/cobi/2026-11-03"
    head = "cobi_kind,cobi_key,scheme,value,source,supplied_by,supplied_at,status,confirmed_by,confirmed_at,note\n"
    good = head + f"coci_course,CCC000425258,ctid,{CTID_A},{CE}/courses.csv,cobi,2026-11-03T10:00:00Z,proposed,,,\n"
    r = new_repo()
    write_drop(r, xw, [("identifier_crosswalk.csv", "cobi.identifier_crosswalk", good)])
    code, out = run(r)
    check("a well-formed crosswalk passes", code == 0, out)
    fails("a confirmed crosswalk row without who confirmed it fails", "missing 'confirmed_by'", rel=xw,
          files=[("identifier_crosswalk.csv", "cobi.identifier_crosswalk",
                  good.replace(",proposed,", ",confirmed,"))])
    fails("a course key that is not a control number fails", "does not match ^CCC", rel=xw,
          files=[("identifier_crosswalk.csv", "cobi.identifier_crosswalk", good.replace("CCC000425258", "AB 300"))])
    fails("an email address as the supplier fails", "does not match ^[^@]*$", rel=xw,
          files=[("identifier_crosswalk.csv", "cobi.identifier_crosswalk",
                  good.replace(",cobi,", ",someone@example.org,"))])

    pathway = json.dumps({"@context": "https://credreg.net/ctdl/schema/context/json", "@graph": [
        {"@id": "_:p02964", "@type": "ceterms:Pathway", "ceterms:name": {"en-US": "Foreign Languages"},
         "ceterms:hasDestinationComponent": "_:award"},
        {"@id": "_:award", "@type": "ceterms:CredentialComponent"}]})
    r = new_repo()
    write_drop(r, xw, [("pathway-02964.jsonld", "cobi.pathway", pathway)])
    code, out = run(r)
    check("a Pathway document passes", code == 0, out)
    fails("a Pathway document with no Pathway node fails", "no item matches", rel=xw,
          files=[("pathway-02964.jsonld", "cobi.pathway", pathway.replace("ceterms:Pathway", "ceterms:Course"))])

    # What a pull request may change: never a merged drop, and a party branch only its own folder.
    git(repo, "checkout", "-q", "-b", "ce/taft-fix")
    with open(os.path.join(repo, CE, "courses.csv"), "a", encoding="utf-8") as f:
        f.write("CCC000999999,ZZ 1,Late addition,\n")
    commit(repo, "edit a merged drop")
    code, out = run(repo, "--base", "main", "--branch", "ce/taft-fix")
    check("editing a merged drop fails", code == 1 and "is already merged and cannot change" in out, out)

    r = new_repo()
    git(r, "checkout", "-q", "-b", "ce/reach")
    write_drop(r, "outbound/cobi/2026-11-03", [("identifier_crosswalk.csv", "cobi.identifier_crosswalk", good)])
    commit(r, "reach into cobi")
    code, out = run(r, "--base", "main", "--branch", "ce/reach")
    check("a Credential Engine branch writing COBI's folder fails",
          code == 1 and "writes for credential-engine" in out, out)

    r = new_repo()
    git(r, "checkout", "-q", "-b", "ce/new-drop")
    write_drop(r, CE, [("courses.csv", "ce.courses", COURSES)])
    commit(r, "new drop")
    code, out = run(r, "--base", "main", "--branch", "ce/new-drop")
    check("a new drop on its own party's branch passes", code == 0, out)

    passed = sum(results)
    print(f"\n{passed}/{len(results)} checks passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
