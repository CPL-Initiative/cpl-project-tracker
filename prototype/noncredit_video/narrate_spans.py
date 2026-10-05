"""Each scene's [t0, t1] in film seconds, read from the page source.

narrate.py and cues.py both read the picture's clock through this one function.
The four learners are built by person(t0, t1, P), the other scenes by
scene(t0, t1, ...); both carry the span as their first two arguments.
"""
import re


def film_spans(src):
    spans = [(float(a), float(b)) for a, b in re.findall(r'(?:=scene|person)\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),', src)]
    assert spans and spans[0][0] == 0 and all(spans[i][1] == spans[i + 1][0] for i in range(len(spans) - 1)), spans
    return spans
