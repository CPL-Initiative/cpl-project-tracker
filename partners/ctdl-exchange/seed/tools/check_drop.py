#!/usr/bin/env python3
"""Check every drop in the exchange against the contract.

Run from the repository root:

    python3 tools/check_drop.py                         # every drop in the tree
    python3 tools/check_drop.py --base origin/main      # also: no merged drop was changed
    python3 tools/check_drop.py --base origin/main --branch ce/taft-2026-10-27
                                                        # also: a party branch wrote only its own folder

Exit 0 when everything passes, 1 when anything fails; each failure is printed on its own line.

Standard library only, so it runs wherever Python 3.9 or later does. The schemas under contract/schemas/ are
ordinary JSON Schema (draft 2020-12) that any validator can read; this file implements the keywords they use, listed
in SUPPORTED, and refuses a schema that uses any other keyword, so a schema can never ask for a check that does not
run.
"""
from __future__ import annotations

import argparse
import csv
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys

SUPPORTED = {
    "$schema", "$id", "title", "description", "$defs", "$ref",
    "type", "required", "properties", "additionalProperties",
    "enum", "const", "pattern", "minLength", "minimum",
    "items", "minItems", "contains", "allOf", "if", "then",
}

DROP_PATTERNS = {
    "credential-engine": re.compile(r"^inbound/credential-engine/([a-z0-9]+(?:-[a-z0-9]+)*)/([0-9]{4}-[0-9]{2}-[0-9]{2})$"),
    "wested": re.compile(r"^inbound/wested/coci/([0-9]{4}-[0-9]{2}-[0-9]{2})$"),
    "cobi": re.compile(r"^outbound/cobi/([0-9]{4}-[0-9]{2}-[0-9]{2})$"),
}
PARTY_ROOTS = {
    "credential-engine": "inbound/credential-engine/",
    "wested": "inbound/wested/",
    "cobi": "outbound/cobi/",
}
PARTY_PREFIXES = {
    "credential-engine": "ce/",
    "wested": "wested/",
    "cobi": "cobi/",
}
DROP_TOPS = ("inbound", "outbound")
RESOURCE_FAMILY = {
    "ce.courses": "course",
    "ce.learning_programs": "learning_program",
    "ce.credentials": "credential",
    "ce.competencies": "competency",
}

csv.field_size_limit(sys.maxsize)


# ── JSON Schema, the subset the contract uses ────────────────────────────────

def _type_ok(value, name):
    if name == "object":
        return isinstance(value, dict)
    if name == "array":
        return isinstance(value, list)
    if name == "string":
        return isinstance(value, str)
    if name == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if name == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if name == "boolean":
        return isinstance(value, bool)
    if name == "null":
        return value is None
    raise ValueError(f"unknown type {name!r}")


def _resolve(ref, root):
    if not ref.startswith("#/"):
        raise ValueError(f"only local $ref is supported, got {ref!r}")
    node = root
    for part in ref[2:].split("/"):
        node = node[part]
    return node


def validate(value, schema, root, where="$"):
    """Return a list of error strings; empty when `value` matches `schema`."""
    errors = []
    if "$ref" in schema:
        errors += validate(value, _resolve(schema["$ref"], root), root, where)
    if "type" in schema and not _type_ok(value, schema["type"]):
        return errors + [f"{where}: expected {schema['type']}"]
    if "const" in schema and value != schema["const"]:
        errors.append(f"{where}: must be {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{where}: {value!r} is not one of {schema['enum']}")
    if isinstance(value, str):
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{where}: is empty")
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{where}: {value!r} does not match {schema['pattern']}")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{where}: below {schema['minimum']}")
    if isinstance(value, dict):
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{where}: missing {key!r}")
        props = schema.get("properties", {})
        for key, sub in props.items():
            if key in value:
                errors += validate(value[key], sub, root, f"{where}.{key}")
        if schema.get("additionalProperties") is False:
            for key in value:
                if key not in props:
                    errors.append(f"{where}: unexpected {key!r}")
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{where}: needs at least {schema['minItems']} items")
        if "items" in schema:
            for i, item in enumerate(value):
                errors += validate(item, schema["items"], root, f"{where}[{i}]")
        if "contains" in schema and not any(not validate(item, schema["contains"], root) for item in value):
            errors.append(f"{where}: no item matches the required shape")
    for sub in schema.get("allOf", []):
        errors += validate(value, sub, root, where)
    if "if" in schema and not validate(value, schema["if"], root, where):
        errors += validate(value, schema.get("then", {}), root, where)
    return errors


def unsupported_keywords(schema, where="$"):
    """Keywords this checker would silently ignore. A schema using one is refused."""
    found = []
    if not isinstance(schema, dict):
        return found
    for key in schema:
        if key not in SUPPORTED:
            found.append(f"{where}.{key}")
    for key in ("items", "contains", "if", "then"):
        if key in schema:
            found += unsupported_keywords(schema[key], f"{where}.{key}")
    for key in ("properties", "$defs"):
        for name, sub in schema.get(key, {}).items():
            found += unsupported_keywords(sub, f"{where}.{key}.{name}")
    for i, sub in enumerate(schema.get("allOf", [])):
        found += unsupported_keywords(sub, f"{where}.allOf[{i}]")
    return found


# ── the contract ─────────────────────────────────────────────────────────────

class Contract:
    def __init__(self, root):
        self.root = root
        base = os.path.join(root, "contract")
        with open(os.path.join(base, "file_kinds.json"), encoding="utf-8") as f:
            self.spec = json.load(f)
        self.kinds = self.spec["kinds"]
        self.ctid_re = re.compile(self.spec["ctid_pattern"])
        self.ctid_columns = set(self.spec["ctid_columns"])
        self.refused_re = re.compile(self.spec["refused_column_pattern"])
        self.schemas = {}
        names = {"schemas/manifest.schema.json"}
        for kind in self.kinds.values():
            for key in ("row_schema", "document_schema"):
                if key in kind:
                    names.add(kind[key])
        for name in sorted(names):
            with open(os.path.join(base, name), encoding="utf-8") as f:
                self.schemas[name] = json.load(f)

    def problems(self):
        out = []
        for name, schema in self.schemas.items():
            for kw in unsupported_keywords(schema):
                out.append(f"contract/{name}: keyword {kw} is not checked by tools/check_drop.py")
        manifest_kinds = set(self.schemas["schemas/manifest.schema.json"]["properties"]["files"]["items"]["properties"]["kind"]["enum"])
        if manifest_kinds != set(self.kinds):
            out.append("contract: the manifest schema's kinds and file_kinds.json disagree: "
                       f"{sorted(manifest_kinds ^ set(self.kinds))}")
        return out


# ── one drop ─────────────────────────────────────────────────────────────────

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def check_drop(contract, rel):
    """Errors for one drop folder, `rel` relative to the repository root."""
    errs = []
    say = lambda msg: errs.append(f"{rel}: {msg}")
    folder = os.path.join(contract.root, rel)
    party, folder_date = None, None
    for name, pat in DROP_PATTERNS.items():
        m = pat.match(rel)
        if m:
            party, folder_date = name, m.groups()[-1]
    if party is None:
        say("is not a drop folder the contract names (see contract/README.md, A drop)")
        return errs
    try:
        datetime.date.fromisoformat(folder_date)
    except ValueError:
        say(f"{folder_date} is not a calendar date")

    try:
        with open(os.path.join(folder, "manifest.json"), encoding="utf-8") as f:
            manifest = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        say(f"manifest.json cannot be read: {e}")
        return errs
    schema = contract.schemas["schemas/manifest.schema.json"]
    for e in validate(manifest, schema, schema, "manifest"):
        say(e)
    if errs:
        return errs
    if manifest["party"] != party:
        say(f"manifest party {manifest['party']!r} does not own this folder ({party!r} does)")
    if manifest["drop_date"] != folder_date:
        say(f"manifest drop_date {manifest['drop_date']} is not the folder's date {folder_date}")

    listed = [f["path"] for f in manifest["files"]]
    present = sorted(n for n in os.listdir(folder) if n != "manifest.json")
    for name in sorted(set(listed)):
        if listed.count(name) > 1:
            say(f"{name} is listed twice")
    for name in present:
        if name not in listed:
            say(f"{name} is in the folder but not in the manifest")

    ctids = {}  # ctid -> {(family, key)}
    for entry in manifest["files"]:
        name, kind_name = entry["path"], entry["kind"]
        kind = contract.kinds[kind_name]
        path = os.path.join(folder, name)
        if kind["party"] != party:
            say(f"{name}: kind {kind_name} is filed by {kind['party']}, not {party}")
            continue
        if not os.path.isfile(path):
            say(f"{name}: listed but missing")
            continue
        if sha256(path) != entry["sha256"]:
            say(f"{name}: sha256 does not match the manifest")
        if kind["format"] == "csv":
            if not name.endswith(".csv"):
                say(f"{name}: kind {kind_name} is CSV")
                continue
            errs += [f"{rel}/{e}" for e in check_csv(contract, path, name, kind_name, kind, entry["rows"], ctids)]
        else:
            if not name.endswith(".jsonld"):
                say(f"{name}: kind {kind_name} is JSON-LD")
                continue
            errs += [f"{rel}/{e}" for e in check_jsonld(contract, path, name, kind, entry["rows"])]
    for ctid, owners in sorted(ctids.items()):
        if len(owners) > 1:
            shown = ", ".join(f"{fam} {key!r}" for fam, key in sorted(owners))
            say(f"CTID {ctid} names {len(owners)} resources: {shown}")
    return errs


def _family(kind_name, row):
    if kind_name in RESOURCE_FAMILY:
        return RESOURCE_FAMILY[kind_name]
    return re.sub(r"[^a-z]+", "_", (row.get("resource_type") or "").lower()).strip("_") or "unknown"


def check_csv(contract, path, name, kind_name, kind, rows_claimed, ctids):
    errs = []
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            return [f"{name}: is empty; a CSV needs its header row"]
        except UnicodeDecodeError:
            return [f"{name}: is not UTF-8"]
        header = [h.strip() for h in header]
        for col in kind.get("required_columns", []):
            if col not in header:
                errs.append(f"{name}: missing required column {col!r}")
        for col in header:
            if contract.refused_re.search(col):
                errs.append(f"{name}: column {col!r} reads as student data, which never enters the exchange")
        if errs:
            return errs
        row_schema = contract.schemas.get(kind.get("row_schema", ""))
        key_col = kind.get("resource_key")
        count = 0
        try:
            for count, cells in enumerate(reader, start=1):
                if len(cells) != len(header):
                    errs.append(f"{name}: row {count} has {len(cells)} cells; the header has {len(header)}")
                    continue
                row = {h: c.strip() for h, c in zip(header, cells) if c.strip() != ""}
                if row_schema is not None:
                    errs += [f"{name}: row {count}: {e}" for e in validate(row, row_schema, row_schema, "row")]
                key = row.get(key_col) if key_col else None
                for col in contract.ctid_columns:
                    v = row.get(col)
                    if v is None:
                        continue
                    if not contract.ctid_re.match(v):
                        errs.append(f"{name}: row {count}: {col} {v!r} is not a well-formed CTID")
                    elif key is not None:
                        ctids.setdefault(v, set()).add((_family(kind_name, row), key))
                if kind_name == "ce.competencies" and key and contract.ctid_re.match(key):
                    ctids.setdefault(key, set()).add(("competency", key))
        except UnicodeDecodeError:
            return errs + [f"{name}: is not UTF-8"]
    if count != rows_claimed:
        errs.append(f"{name}: holds {count} data rows; the manifest says {rows_claimed}")
    return errs


def check_jsonld(contract, path, name, kind, rows_claimed):
    try:
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
    except (OSError, json.JSONDecodeError, UnicodeDecodeError) as e:
        return [f"{name}: cannot be read as JSON: {e}"]
    schema = contract.schemas[kind["document_schema"]]
    errs = [f"{name}: {e}" for e in validate(doc, schema, schema, "doc")]
    graph = doc.get("@graph") if isinstance(doc, dict) else None
    n = len(graph) if isinstance(graph, list) else 0
    if n != rows_claimed:
        errs.append(f"{name}: holds {n} nodes in @graph; the manifest says {rows_claimed}")
    return errs


# ── the tree, and what a pull request may change ────────────────────────────

def find_drops(root):
    drops, strays = [], []
    for top in DROP_TOPS:
        for dirpath, dirnames, filenames in os.walk(os.path.join(root, top)):
            dirnames.sort()
            rel = os.path.relpath(dirpath, root).replace(os.sep, "/")
            if "manifest.json" in filenames:
                drops.append(rel)
                dirnames[:] = []
            else:
                strays += [f"{rel}/{n}" for n in filenames if n != ".gitkeep"]
    return drops, strays


def git(root, *args):
    return subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, text=True).stdout


def changed_paths(root, base):
    merge_base = git(root, "merge-base", base, "HEAD").strip()
    out = git(root, "diff", "--name-status", "--no-renames", merge_base, "HEAD")
    pairs = []
    for line in out.splitlines():
        status, path = line.split("\t", 1)
        pairs.append((status, path))
    base_files = git(root, "ls-tree", "-r", "--name-only", merge_base, "--", *DROP_TOPS).splitlines()
    base_drops = {os.path.dirname(p) for p in base_files if p.endswith("/manifest.json")}
    return pairs, base_drops


def check_changes(root, base, branch):
    errs = []
    pairs, base_drops = changed_paths(root, base)
    for status, path in pairs:
        drop = next((d for d in base_drops if path.startswith(d + "/")), None)
        if drop is not None:
            errs.append(f"{path}: drop {drop} is already merged and cannot change; file a new drop with supersedes")
    if branch:
        party = next((p for p, spec in PARTY_PREFIXES.items() if branch.startswith(spec)), None)
        for status, path in pairs:
            if party is not None and not path.startswith(PARTY_ROOTS[party]):
                errs.append(f"{path}: branch {branch} writes for {party}, whose folder is {PARTY_ROOTS[party]}")
            if party is None and path.split("/", 1)[0] in DROP_TOPS:
                errs.append(f"{path}: drops come from a party branch (ce/, wested/ or cobi/), not {branch}")
    return errs



def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--root", default=".", help="the repository root (default: here)")
    ap.add_argument("--base", help="a git ref; refuse any change to a drop that exists there")
    ap.add_argument("--branch", help="the pull request's branch; a party branch may write only its own folder")
    args = ap.parse_args(argv)
    if args.branch and not args.base:
        ap.error("--branch needs --base")
    root = os.path.abspath(args.root)

    contract = Contract(root)
    errs = contract.problems()
    drops, strays = find_drops(root)
    errs += [f"{s}: sits outside any drop (a drop folder holds a manifest.json)" for s in strays]
    for rel in drops:
        errs += check_drop(contract, rel)
    if args.base:
        errs += check_changes(root, args.base, args.branch)

    for e in errs:
        print(e)
    print(f"{'FAIL' if errs else 'ok'}: {len(drops)} drop(s) checked, {len(errs)} problem(s)")
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
