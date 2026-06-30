import csv, os, html
import folium
from folium import plugins
import data

NAVY = "#1F355E"; CRIMSON = "#B22234"; GOLD = "#D4A843"; CObLUE = "#0066BA"
PORTAL = "https://map.rccd.edu/cpllandingpages/"

# per-college CPL landing URLs (editable CSV; defaults to portal)
cpl_url = {n: PORTAL for n, _, _ in data.COLLEGES}
if os.path.exists("colleges_cpl.csv"):
    for row in csv.DictReader(open("colleges_cpl.csv")):
        if row.get("college") and row.get("cpl_url"):
            cpl_url[row["college"].strip()] = row["cpl_url"].strip()

m = folium.Map(location=[37.2, -119.3], zoom_start=6, tiles="CartoDB positron",
               control_scale=True)

college_fg = folium.FeatureGroup(name="🎓 Community Colleges (115)", show=True)
base_fg = folium.FeatureGroup(name="★ Military Bases (44)", show=True)
pair_fg = folium.FeatureGroup(name="Demonstration-project pairings", show=True)

cpos = {n: (la, lo) for n, la, lo in data.COLLEGES}
bpos = {n: (la, lo) for n, la, lo in data.BASES}
key_colleges = {c for _, c in data.KEY_PAIRS}

CPL_BLURB = ("Credit for Prior Learning (CPL) turns military training (JST/CCAF), "
             "industry certifications, and work experience into college credit.")

for name, la, lo in data.COLLEGES:
    hi = name in key_colleges
    url = cpl_url.get(name, PORTAL)
    safe = html.escape(name)
    tooltip = (f"<div style='font-family:Arial;font-size:12px;max-width:230px'>"
               f"<b style='color:{NAVY}'>{safe}</b><br>"
               f"<span style='color:{CObLUE}'>Credit for Prior Learning</span><br>"
               f"<span style='color:#555'>{CPL_BLURB}</span><br>"
               f"<span style='color:#888;font-style:italic'>Click for the CPL landing page →</span></div>")
    popup = (f"<div style='font-family:Arial;font-size:13px;max-width:250px'>"
             f"<div style='font-size:14px;font-weight:bold;color:{NAVY}'>{safe}</div>"
             f"<div style='color:{CObLUE};font-weight:bold;margin:2px 0'>Credit for Prior Learning</div>"
             f"<div style='color:#444;margin-bottom:8px'>{CPL_BLURB}</div>"
             f"<a href='{html.escape(url)}' target='_blank' rel='noopener' "
             f"style='display:inline-block;background:{NAVY};color:#fff;text-decoration:none;"
             f"padding:6px 10px;border-radius:5px;font-weight:bold'>Open CPL Landing Page →</a></div>")
    folium.CircleMarker(
        location=[la, lo], radius=10 if hi else 8, color="white", weight=1.5,
        fill=True, fill_color=GOLD if hi else NAVY, fill_opacity=0.95,
        tooltip=folium.Tooltip(tooltip, sticky=True),
        popup=folium.Popup(popup, max_width=270),
    ).add_to(college_fg)

for name, la, lo in data.BASES:
    safe = html.escape(name)
    folium.Marker(
        location=[la, lo],
        icon=folium.Icon(color="red", icon_color="white", icon="star", prefix="fa"),
        tooltip=folium.Tooltip(f"<b style='color:{CRIMSON}'>{safe}</b><br>Military Installation", sticky=True),
        popup=folium.Popup(f"<b>{safe}</b><br>Military Installation", max_width=250),
    ).add_to(base_fg)

for b, c in data.KEY_PAIRS:
    folium.PolyLine([bpos[b], cpos[c]], color=GOLD, weight=4, opacity=0.9,
                    tooltip=f"{b}  ↔  {c}").add_to(pair_fg)

college_fg.add_to(m); base_fg.add_to(m); pair_fg.add_to(m)
folium.LayerControl(collapsed=False).add_to(m)
plugins.Fullscreen().add_to(m)
m.fit_bounds([[32.4, -124.5], [42.1, -114.0]])

title_html = f"""
<div style="position: fixed; top: 12px; left: 60px; z-index: 9999;
     background: white; padding: 10px 14px; border: 2px solid {NAVY}; border-radius: 8px;
     font-family: Arial, sans-serif; box-shadow: 0 1px 6px rgba(0,0,0,.25); max-width: 340px;">
  <div style="font-size:15px; font-weight:bold; color:{NAVY};">
     California Community Colleges &amp; Military Installations</div>
  <div style="font-size:11.5px; color:{CObLUE};">Credit for Prior Learning &mdash; 115 Colleges &nbsp;•&nbsp; 44 Bases</div>
  <div style="font-size:11px; margin-top:6px;">
     <span style="color:{NAVY};font-size:14px;">●</span> Community College &nbsp;
     <span style="color:{CRIMSON};font-size:14px;">★</span> Military Base &nbsp;
     <span style="color:{GOLD};">▬</span> Demo pairing<br>
     <span style="color:#666;">Hover for CPL info; click a college for its CPL landing page.</span></div>
</div>"""
m.get_root().html.add_child(folium.Element(title_html))

m.save("ca_cpl_map_web.html")
print("saved ca_cpl_map_web.html | colleges linked:", len(cpl_url))
