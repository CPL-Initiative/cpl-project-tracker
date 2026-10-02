"""Each scene's [t0, t1] in film seconds, read from the page source's scene() calls.

narrate.py and cues.py both read the picture's clock through this one function.
The targets slide (`HOW`: the introductions, and Scenario 2's narrated cut since
2026-10-02) plays at 46 s for D seconds, after the priorities; the source moves
every later scene D seconds on (LS(t)), and so does this.
"""
import re

SLIDE = 'How a target is set'  # the slide's scene name in the source, and in a narration that voices it


def film_spans(src, slide):
    spans = [(float(a), float(b)) for a, b in re.findall(r'=scene\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),', src)]
    assert spans and all(spans[i][1] == spans[i + 1][0] for i in range(len(spans) - 1)), spans
    if slide:
        d = float(re.search(r'D=HOW\?([\d.]+):0', src).group(1))
        k = next(i for i, (a, _) in enumerate(spans) if a >= 46)
        spans = spans[:k] + [(46.0, 46.0 + d)] + [(a + d, b + d) for a, b in spans[k:]]
    return spans
