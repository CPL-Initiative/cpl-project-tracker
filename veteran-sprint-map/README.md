# California CPL × Military Map — Veteran Sprint

An interactive map of California's **115 community colleges** and **44 military
installations**, built to show **where colleges can partner with bases to deliver
Credit for Prior Learning (CPL)** to service members and veterans.

> Part of the CPL Initiative / Veteran Sprint (MAP, CCCCO). College CPL landing
> links + per-college veteran counts are live data; base/college coordinates are
> campus/installation-level (illustrative).

## What's here

| File | Purpose |
|---|---|
| **`ca_cpl_map_selfcontained.html`** | **The deliverable.** A single, fully **self-contained** interactive map — *zero external dependencies* (no CDN, no tile server). Works offline, inside any iframe, and on locked-down networks. Click a ★ installation to rank the nearest partner colleges (with veteran counts + one-click CPL links); click a ● college for its CPL landing page. Zoom/pan, region presets, layer toggles, searchable directories. |
| `build_selfcontained.py` | Generator for the HTML above. Reads `data.py` + `colleges_cpl.csv` + `california.geojson` + `military_by_college.json`. |
| `build_static.py` | High-res slide/Word PNG (`ca_cpl_military_map.png`); college circles **sized by veterans served**. |
| `build_static_ref.py` | Numbered full-reference PNG (`ca_cpl_military_map_reference.png`) — every college + base labeled. |
| `extract_military.py` | Snapshots per-college service-member/veteran counts from `live_metrics.json` → `military_by_college.json`. |
| `data.py` | 115 colleges + 44 bases with coordinates, and the 3 demonstration-project pairings. |
| `colleges_cpl.csv` | Per-college CPL landing URLs (115/115 matched). |
| `military_by_college.json` | Per-college veterans-served snapshot (from `live_metrics.json`). |
| `california.geojson` | State boundary polygon (inlined into the HTML). |
| `build_web.py` | **Legacy** Folium/Leaflet generator (`ca_cpl_map_web.html`). Depends on ~6 external CDN scripts + a live tile server, so it renders **blank** where those are blocked (offline, gov networks, restrictive iframes). Superseded by `build_selfcontained.py`; kept for provenance. |

## Why self-contained

The original Folium build pulls Leaflet, jQuery, Bootstrap, FontAwesome, and map
tiles from external CDNs at runtime. On the locked-down networks, offline laptops,
and embedded iframes this map actually lands in, those requests are blocked and the
map shows as an empty box. The self-contained build draws the boundary, all markers,
and the partnership connectors as inline SVG + vanilla JS, so it always works.

## Refreshing the data

```bash
# 1. Veteran counts (after live_metrics.json updates — it's in the repo root):
python3 extract_military.py          # → military_by_college.json

# 2. CPL landing URLs: edit colleges_cpl.csv when the MAP Custom Report carries them.

# 3. Rebuild outputs:
python3 build_selfcontained.py       # → ca_cpl_map_selfcontained.html  (interactive)
python3 build_static.py              # → ca_cpl_military_map.png         (slide/Word)
python3 build_static_ref.py          # → ca_cpl_military_map_reference.png (numbered)
```

`extract_military.py` finds `live_metrics.json` at the repo root automatically
(or set `$LIVE_METRICS`). The PNG builders need `matplotlib`.

## Embedding

```html
<iframe src="veteran-sprint-map/ca_cpl_map_selfcontained.html" width="100%" height="700"
        style="border:0;" loading="lazy"
        title="California Community Colleges & Military Installations — CPL"></iframe>
```

## Demonstration-project pairings

Fort Irwin ↔ Barstow College · MCAGCC Twentynine Palms ↔ Copper Mountain College ·
MCB Camp Pendleton ↔ Palomar College.
