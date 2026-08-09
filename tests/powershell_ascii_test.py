#!/usr/bin/env python3
"""Guards scripts/*.ps1 against non-ASCII characters.

Why this test exists
--------------------
A `.ps1` file with no UTF-8 BOM is read by **Windows PowerShell 5.1 as ANSI**
(Windows-1252), not UTF-8. So an em dash written as UTF-8 `E2 80 94` is read as
three Windows-1252 characters: `a-circumflex`, `euro`, and **0x94 — which is
RIGHT DOUBLE QUOTATION MARK.**

PowerShell accepts curly quotes as string delimiters. So an em dash inside a
double-quoted string *silently closes that string*, and everything after it on
the line is parsed as code.

That is not theoretical. It shipped:

    Say "Already sparse - re-applying patterns (idempotent)."
                        ^ em dash here closed the string

and the parser then blew up 25 lines later on an unrelated line, reporting

    Say ("Removed from disk: {0} MB ({1}%)" -f `
    You must provide a value expression following the '%' operator.

because `%` was suddenly bare code. The reported error was nowhere near the
cause, the script would not run at all, and the first diagnosis (offered
confidently) was that it must still be running. Three scripts carried the same
latent defect at once.

The fix is to keep PowerShell sources pure ASCII. A BOM would also work, but
ASCII is the one that cannot be lost by an editor, a copy-paste, or a git
filter. These are operational scripts, not prose - they do not need typography.

Run: python3 tests/powershell_ascii_test.py   (exit 0 = all pass)
"""
import glob
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

results = []


def check(name, cond):
    results.append((name, bool(cond)))


scripts = sorted(glob.glob(os.path.join(ROOT, "scripts", "*.ps1")))
check("found PowerShell scripts to guard", len(scripts) > 0)

for path in scripts:
    rel = os.path.relpath(path, ROOT)
    raw = open(path, "rb").read()

    offenders = []
    for lineno, line in enumerate(raw.split(b"\n"), 1):
        for col, byte in enumerate(line, 1):
            if byte > 127:
                offenders.append((lineno, col, byte))
    detail = ""
    if offenders:
        ln, col, b = offenders[0]
        detail = f" (first: line {ln} col {col}, byte 0x{b:02X}; {len(offenders)} total)"
    check(f"{rel}: pure ASCII{detail}", not offenders)

    # A BOM would also fix the ANSI misread, but mixing the two is worse than
    # either: a BOM invites non-ASCII back in, and the ASCII rule then rots.
    check(f"{rel}: no UTF-8 BOM (ASCII rule is the guard, not a BOM)",
          raw[:3] != b"\xef\xbb\xbf")

    text = raw.decode("ascii", errors="replace")
    check(f"{rel}: balanced double quotes", text.count('"') % 2 == 0)
    check(f"{rel}: balanced braces", text.count("{") == text.count("}"))
    check(f"{rel}: balanced parens", text.count("(") == text.count(")"))

failed = [n for n, ok in results if not ok]
for n, ok in results:
    print(("  ok   " if ok else "  FAIL ") + n)
print(f"\n{len(results) - len(failed)}/{len(results)} passed")
if failed:
    print("\nA non-ASCII character in a .ps1 will break Windows PowerShell 5.1 at a")
    print("line far from the character itself. Replace it with ASCII (-- for an em")
    print("dash, | for a middle dot, -> for an arrow).")
sys.exit(1 if failed else 0)
