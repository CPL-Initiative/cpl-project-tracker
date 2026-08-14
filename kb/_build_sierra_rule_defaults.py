#!/usr/bin/env python3
"""Emit the Sierra rule DEFAULTS from cpl-chat/index.ts into a browser-loadable file.

WHY THIS EXISTS
---------------
`sierra_rules` (the curator overlay) is seeded EMPTY on purpose: zero rows means
every rule comes from its code default, so the overlay is proven by construction
and the table reads as *what we deliberately changed* rather than a second copy
of index.ts.

That is right for the database and awkward for a UI. A curator opening the pane
would see nothing — and the whole point of the ADR is the opposite: what would
have saved Sam four hours on 2026-08-14 was not the power to edit STATEWIDE_RULE,
it was SEEING that it existed and was fighting his instruction. So the pane has
to render the ten built-in rules whether or not anyone has overridden one.

The rules therefore need to reach the browser. The tempting shortcut — retype
them into sierra_training.js — is the mistake this repo has already paid for
twice: a hand-copied mirror of something that legitimately changes is a stale
TEST BOUND waiting to happen (four red checks on main, 2026-08-14), and
`screen_profile()` re-deriving a normalisation instead of reading it blocked the
top of a worklist. So EMIT it, never re-derive it. index.ts stays the single
source of truth; this script is the only thing that copies, and
tests/sierra_rule_defaults.test.js fails if the emitted file drifts from it.

USAGE
-----
    python3 kb/_build_sierra_rule_defaults.py            # write sierra_rule_defaults.js
    python3 kb/_build_sierra_rule_defaults.py --check    # exit 1 if it would change

--check is what CI and the test use: it never writes, so a drifted file is a
loud failure rather than a silent regeneration nobody reviews.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "chatbox" / "supabase" / "functions" / "cpl-chat" / "index.ts"
OUT = REPO / "sierra_rule_defaults.js"

# Plain-English gloss for each applies_when key. The predicates themselves live
# in code (RULE_PREDICATES) on purpose — a curator picks from a known set, they
# never write boolean logic into a table — so this is a LABEL for the picker,
# not a second definition of the condition.
WHEN_LABEL = {
    "always": "Every question",
    "credential": "When the answer is about a specific credential",
    "credential_or_volume": "When it is about a credential, or how many students",
    "alignment": "When it is about articulating a credential at a college",
    "volume": "When it is about how many students",
    "credit": "When it is about what credit a college has acted on",
}


def fail(msg: str) -> "None":
    sys.stderr.write("ERROR: %s\n" % msg)
    raise SystemExit(2)


def read_source() -> str:
    if not SRC.exists():
        fail("cannot find %s" % SRC)
    return SRC.read_text(encoding="utf-8")


def template_literal(src: str, name: str) -> str:
    """Return the body of `const <name> = ` ... ` ;` as literal text.

    Deliberately strict: it walks the string rather than using a lazy regex, so a
    backtick inside a body (or an escaped one) cannot silently truncate the rule
    and ship a half-rule to the browser looking complete.
    """
    m = re.search(r"const\s+%s\s*=\s*`" % re.escape(name), src)
    if not m:
        fail("could not find `const %s = ...`" % name)
    i = m.end()
    out = []
    while i < len(src):
        ch = src[i]
        if ch == "\\":
            out.append(src[i:i + 2])
            i += 2
            continue
        if ch == "`":
            return "".join(out)
        out.append(ch)
        i += 1
    fail("unterminated template literal for %s" % name)
    return ""


def unescape(body: str, portal_url: str) -> str:
    """Resolve the JS escapes and the one interpolation the rule bodies use."""
    body = body.replace("${PORTAL_STUDENT_URL}", portal_url)
    left = re.findall(r"\$\{([^}]*)\}", body)
    if left:
        # An unresolved ${...} would reach a curator as literal source code and
        # read as a defect in the rule itself. Fail loudly instead.
        fail("unresolved interpolation(s) in a rule body: %s" % sorted(set(left)))
    return (body.replace("\\n", "\n").replace("\\t", "\t")
                .replace("\\`", "`").replace("\\$", "$").replace("\\\\", "\\"))


def parse_defaults(src: str) -> "list":
    m = re.search(r"const RULE_DEFAULTS[^=]*=\s*\[(.*?)\n\];", src, re.S)
    if not m:
        fail("could not find the RULE_DEFAULTS array")
    entries = re.findall(
        r"\{\s*key:\s*\"([^\"]+)\"\s*,\s*title:\s*\"([^\"]+)\"\s*,\s*body:\s*([A-Za-z0-9_]+)\s*,"
        r"\s*appliesWhen:\s*\"([^\"]+)\"\s*,\s*sortOrder:\s*(\d+)\s*\}",
        m.group(1),
    )
    if not entries:
        fail("RULE_DEFAULTS matched no entries — the shape changed")
    return entries


def parse_protected(src: str) -> "list":
    m = re.search(r"const PROTECTED_RULE_KEYS\s*=\s*new Set\(\[(.*?)\]\)", src, re.S)
    if not m:
        fail("could not find PROTECTED_RULE_KEYS")
    return re.findall(r"\"([^\"]+)\"", m.group(1))


def parse_predicates(src: str) -> "list":
    m = re.search(r"const RULE_PREDICATES[^=]*=\s*\{(.*?)\n\};", src, re.S)
    if not m:
        fail("could not find RULE_PREDICATES")
    return re.findall(r"^\s*([a-z_][a-z0-9_]*)\s*:", m.group(1), re.M)


def build() -> str:
    src = read_source()

    pm = re.search(r"const PORTAL_STUDENT_URL\s*=\s*\"([^\"]+)\"", src)
    if not pm:
        fail("could not find PORTAL_STUDENT_URL")
    portal_url = pm.group(1)

    protected = set(parse_protected(src))
    predicates = parse_predicates(src)

    unknown = [p for p in predicates if p not in WHEN_LABEL]
    if unknown:
        # A new predicate with no gloss would render in the picker as a bare
        # identifier — the kind of thing that teaches a curator the surface is
        # not for them. Make adding one a deliberate two-line change.
        fail("RULE_PREDICATES has key(s) with no WHEN_LABEL gloss: %s — add them to "
             "WHEN_LABEL in this script" % unknown)

    rules = []
    for key, title, const_name, applies_when, sort_order in parse_defaults(src):
        if applies_when not in WHEN_LABEL:
            fail("rule %r uses applies_when=%r, which is not a known predicate" % (key, applies_when))
        rules.append({
            "key": key,
            "title": title,
            "body": unescape(template_literal(src, const_name), portal_url).strip(),
            "applies_when": applies_when,
            "sort_order": int(sort_order),
            "protected": key in protected,
            "const": const_name,
        })
    rules.sort(key=lambda r: (r["sort_order"], r["key"]))

    payload = {
        "_about": "Sierra's built-in prompt rules, as shipped in cpl-chat/index.ts. "
                  "GENERATED by kb/_build_sierra_rule_defaults.py — do not hand-edit. "
                  "The sierra_rules table OVERLAYS these; it never replaces them.",
        "_source": "chatbox/supabase/functions/cpl-chat/index.ts",
        "when_labels": {k: WHEN_LABEL[k] for k in predicates},
        "protected": sorted(protected),
        "rules": rules,
    }

    return (
        "/* sierra_rule_defaults.js — GENERATED. Do not hand-edit.\n"
        " *\n"
        " * Source of truth: chatbox/supabase/functions/cpl-chat/index.ts (RULE_DEFAULTS\n"
        " * + the rule body consts). Regenerate with:\n"
        " *     python3 kb/_build_sierra_rule_defaults.py\n"
        " * tests/sierra_rule_defaults.test.js fails if this file drifts from index.ts.\n"
        " *\n"
        " * Consumed by sierra_training.js to render the built-in rules a curator is\n"
        " * about to override. The sierra_rules TABLE is seeded empty on purpose, so\n"
        " * without this the pane would show a curator nothing at all — and seeing the\n"
        " * rule that is fighting your instruction is the point of the whole layer.\n"
        " */\n"
        "window.SIERRA_RULE_DEFAULTS = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if the emitted file would change (never writes)")
    args = ap.parse_args()

    text = build()
    current = OUT.read_text(encoding="utf-8") if OUT.exists() else None

    if args.check:
        if current == text:
            print("sierra_rule_defaults.js is up to date")
            return 0
        print("sierra_rule_defaults.js is STALE — run: python3 kb/_build_sierra_rule_defaults.py")
        return 1

    if current == text:
        print("sierra_rule_defaults.js unchanged")
        return 0
    OUT.write_text(text, encoding="utf-8")
    n = text.count('"key":')
    print("wrote %s (%d rules)" % (OUT.relative_to(REPO), n))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
