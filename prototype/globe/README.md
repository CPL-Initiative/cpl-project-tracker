# The SkyView globe prototype — how it is built

A throwaway, kept because Sam asked for three rounds of it in one afternoon
(2026-09-07) and may ask for a fourth. The page is
`docs/visuals/2026-09-07-skyview-globe-prototype.html`; nothing here touches
`prototype/ccr_universe.js` or the SkyView build.

Three steps, run from the repo root, each reading and writing beside itself:

1. `python3 prototype/globe/extract_globe_data.py` — the committed layout out of
   `prototype/ccr_universe.json` (islands and points), about 2 MB.
2. `python3 prototype/globe/globe_layout.py 0.62` — every point island-relative,
   plus three island placements on the sphere: committed, spread (eased apart,
   neighbors kept) and **by kind** (CTE disciplines one side, academic the other,
   the mixed and unread ones along the boundary). The kind is TOP's one sanctioned
   use — the manual's CTE flag on each identity's TOP code — as a share per
   discipline. The argument is the island scale as a share of the first round's;
   0.62 fits the round caps with room. About 90 s of pure Python.
3. `python3 prototype/globe/build_globe.py` — inlines the data into the page.

The JSON files are derived and gitignored. Look at the result in a browser
before publishing it (the artifact link lives in the SkyView lane); the
`docs/visuals/README.md` row and `docs/skyview_backlog.md` ①d hold the history.
