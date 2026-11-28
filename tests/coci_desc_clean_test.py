#!/usr/bin/env python3
"""COCI catalog descriptions read as the catalog wrote them (S747; f-coci-description-shards-mojibake-s744).

COCI's CatalogDescription carries Excel's escapes for control characters (_x000D_, about 78,800 in the Nov 2026
extract) and UTF-8 text read as cp1252, some of it twice ("studentâ€™s", "Ã‚Â" before a no-break space).
kb/_build_coci_lookup.py's clean_desc undoes both at the build.

  1. clean_desc repairs each shape seen in the extract and leaves real accented text alone.
  2. The committed shards (coci_lookup_desc_*.js) carry no Excel escape and no mojibake marker, so a rebuild
     that drops the cleaner, or a fresh extract with a new shape, fails here.

Run from the repo root: python3 tests/coci_desc_clean_test.py
"""
import glob
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build_coci_lookup", os.path.join(ROOT, "kb", "_build_coci_lookup.py"))
B = importlib.util.module_from_spec(spec)
sys.path.insert(0, os.path.join(ROOT, "kb"))
spec.loader.exec_module(B)

N, FAILS = [0], []


def check(name, ok, detail=""):
    N[0] += 1
    print(("PASS " if ok else "FAIL ") + name + ("" if ok else "  " + repr(detail)[:300]))
    if not ok:
        FAILS.append(name)


CASES = [
    ("an Excel carriage-return escape", "Topics include_x000D_\n recognition", "Topics include recognition"),
    ("a right quote read as cp1252", "increase studentâ€™s skill", "increase student’s skill"),
    ("a no-break space read as cp1252", "observations,Â\xa0police", "observations, police"),
    ("text read as cp1252 twice", "Advisory:Ã‚Â\xa0Intermediate", "Advisory: Intermediate"),
    ("a curly quote twice over", "emphasis on Ã¢â‚¬Å“hands-on", "emphasis on “hands-on"),
    ("a closing quote whose last byte cp1252 leaves undefined", "â€œquotedâ€\x9d", "“quoted”"),
    ("accented words", "paper mÃ¢chÃ©, the TaÃ\xadno", "paper mâché, the Taíno"),
    ("a trademark sign", "Special Needsâ„¢. This", "Special Needs™. This"),
    ("a bare Â left by a dropped no-break space", "reduced anxiety. ÂÂ", "reduced anxiety."),
    ("a trademark spelled out inside a quote", "an artisanâ€TMs view", "an artisan’s view"),
    ("real accented text stays", "naïve résumé, café, Âme", "naïve résumé, café, Âme"),
    ("plain punctuation stays", "units – 3 “lecture” …", "units – 3 “lecture” …"),
]
for name, raw, want in CASES:
    got = B.clean_desc(raw)
    check("(1) " + name, got == want, (raw, got, want))

ARTIFACT = re.compile(r"_x[0-9A-Fa-f]{4}_|â€|Ã[\x80-\xbf‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Â(?![^\W\d_])")
shards = sorted(glob.glob(os.path.join(ROOT, "coci_lookup_desc_*.js")))
check("(2) the description shards are committed", len(shards) >= 20, len(shards))
hits = []
for path in shards:
    text = open(path, encoding="utf-8").read()
    for m in ARTIFACT.finditer(text):
        hits.append((os.path.basename(path), text[max(0, m.start() - 30):m.end() + 15]))
check("(2) no committed description carries an Excel escape or a mojibake marker", not hits, hits[:5])

print("\n%d/%d checks passed" % (N[0] - len(FAILS), N[0]))
sys.exit(1 if FAILS else 0)
