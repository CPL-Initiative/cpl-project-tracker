"""Text repair shared by the COCI loaders.

fix_moji — UTF-8 text that was read back as cp1252 (or latin-1), once or twice.

Measured on the live tables 2026-09-18 (S274): 381 of 141,696 course titles
across 84 colleges carried it, and 186 of 16,097 offerings rows. The shapes,
with their exact code points read back from the table:

    "Ã¢â‚¬â€œ"      an en dash decoded wrong TWICE   (– → â€“ → Ã¢â‚¬â€œ)
    "Ã¢â‚¬â€\x9d"   an em dash decoded wrong twice; its last byte is the C1
                    control U+009D, which cp1252 leaves undefined
    "â€™"          a right quote decoded wrong ONCE
    "â„¢"          a trademark decoded wrong once — no "Ã", no "â€"
    "Ã‚Â\xa0"      a no-break space decoded wrong twice; the builder's
                    whitespace collapse turned that no-break space into a
                    plain space BEFORE the old repair ran, so the round trip
                    could never close — repair first, then clean

The earlier repair lived in two builders as two copies, round-tripped through
LATIN-1 and fired only on "Ã", so it fixed "CaÃ±ada" and none of the above:
the double-encoded forms contain cp1252-only characters (‚ € œ ™) that latin-1
cannot encode, and the single round-trips never contained "Ã". And both
builders applied it to the COLLEGE name only, never to the course title, which
is what Sierra renders to students. One copy now, imported by both.

Mechanics: encode as cp1252, mapping the five code points cp1252 leaves
undefined (U+0081, U+008D, U+008F, U+0090, U+009D) straight to their byte, then
decode as UTF-8; up to three passes until the text stops changing. A string
that is not mojibake fails the UTF-8 decode and comes back untouched, which is
the safety property tests/course_title_mojibake_test.py pins.
"""
import codecs
import re

# cp1252's 0x80–0x9F block, as the characters a wrong decode produces after "â",
# plus the Latin-1 supplement. "Ã" and "Â" mark the two-byte lead bytes.
_MOJI_RE = re.compile(
    "Ã|Â|â[\u0080-\u00bf\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030"
    "\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc"
    "\u2122\u0161\u203a\u0153\u017e\u0178]"
)


def _c1_passthrough(err):
    """The five bytes cp1252 leaves undefined came through a lenient decoder as
    C1 controls; hand them back as the byte they were."""
    chunk = err.object[err.start:err.end]
    if all(0x80 <= ord(c) <= 0x9F for c in chunk):
        return bytes(ord(c) for c in chunk), err.end
    raise err


codecs.register_error("moji_c1", _c1_passthrough)


def fix_moji(s):
    """Repair UTF-8 that was decoded as cp1252 (or latin-1), once or twice."""
    if not isinstance(s, str) or not s:
        return s
    for _ in range(3):
        if not _MOJI_RE.search(s):
            break
        repaired = None
        for codec in ("cp1252", "latin-1"):
            try:
                repaired = s.encode(codec, "moji_c1").decode("utf-8")
                break
            except (UnicodeEncodeError, UnicodeDecodeError):
                continue
        if repaired is None or repaired == s:
            break
        s = repaired
    return s
