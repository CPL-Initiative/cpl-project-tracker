#!/usr/bin/env python3
"""Author chatbox/college_geo.json — a curated college -> {region, county} map so
Sierra can answer "which colleges NEAR me teach X". Region is a coarse ~10-way CA
macro-region for proximity grouping; county is the precise, unambiguous signal.
Names match the COCI course-list full names (see build_coci_offerings.py).

Run:  python3 chatbox/_seed_college_geo.py   (validates 100% coverage vs the payload)
"""
import os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "chatbox", "college_geo.json")
PAYLOAD = os.path.join(ROOT, "chatbox", "coci_offerings_payload.json")

# region -> [(college, county), ...]
REGIONS = {
    "Far North": [
        ("Butte College", "Butte"), ("College of the Redwoods", "Humboldt"),
        ("College of the Siskiyous", "Siskiyou"), ("Feather River College", "Plumas"),
        ("Lassen College", "Lassen"), ("Mendocino College", "Mendocino"),
        ("Shasta College", "Shasta"),
    ],
    "Greater Sacramento": [
        ("American River College", "Sacramento"), ("Cosumnes River College", "Sacramento"),
        ("Folsom Lake College", "Sacramento"), ("Sacramento City College", "Sacramento"),
        ("Sierra College", "Placer"), ("Lake Tahoe Community College", "El Dorado"),
        ("Woodland Community College", "Yolo"), ("Yuba College", "Yuba"),
    ],
    "Bay Area": [
        ("Berkeley City College", "Alameda"), ("Laney College", "Alameda"),
        ("Merritt College", "Alameda"), ("College of Alameda", "Alameda"),
        ("Chabot College", "Alameda"), ("Las Positas College", "Alameda"),
        ("Ohlone College", "Alameda"), ("City College of San Francisco", "San Francisco"),
        ("Skyline College", "San Mateo"), ("College of San Mateo", "San Mateo"),
        ("Cañada College", "San Mateo"), ("College of Marin", "Marin"),
        ("Contra Costa College", "Contra Costa"), ("Diablo Valley College", "Contra Costa"),
        ("Los Medanos College", "Contra Costa"), ("Solano Community College", "Solano"),
        ("Napa Valley College", "Napa"), ("Santa Rosa Junior College", "Sonoma"),
        ("Foothill College", "Santa Clara"), ("De Anza College", "Santa Clara"),
        ("Evergreen Valley College", "Santa Clara"), ("San Jose City College", "Santa Clara"),
        ("Mission College", "Santa Clara"), ("West Valley College", "Santa Clara"),
        ("Gavilan College", "Santa Clara"),
    ],
    "Central Coast": [
        ("Cabrillo College", "Santa Cruz"), ("Hartnell College", "Monterey"),
        ("Monterey Peninsula College", "Monterey"), ("Cuesta College", "San Luis Obispo"),
        ("Allan Hancock College", "Santa Barbara"), ("Santa Barbara City College", "Santa Barbara"),
        ("Ventura College", "Ventura"), ("Oxnard College", "Ventura"),
        ("Moorpark College", "Ventura"),
    ],
    "San Joaquin Valley": [
        ("Modesto Junior College", "Stanislaus"), ("San Joaquin Delta College", "San Joaquin"),
        ("Merced College", "Merced"), ("Columbia College", "Tuolumne"),
        ("Fresno City College", "Fresno"), ("Reedley College", "Fresno"),
        ("Clovis Community College", "Fresno"), ("Madera College", "Madera"),
        ("Coalinga College", "Fresno"), ("Lemoore College", "Kings"),
        ("College of the Sequoias", "Tulare"), ("Porterville College", "Tulare"),
        ("Taft College", "Kern"), ("Bakersfield College", "Kern"),
        ("Cerro Coso Community College", "Kern"),
    ],
    "Los Angeles": [
        ("Antelope Valley College", "Los Angeles"), ("College of the Canyons", "Los Angeles"),
        ("Glendale Community College", "Los Angeles"), ("Pasadena City College", "Los Angeles"),
        ("Citrus College", "Los Angeles"), ("Mt. San Antonio College", "Los Angeles"),
        ("Rio Hondo College", "Los Angeles"), ("Cerritos College", "Los Angeles"),
        ("El Camino College", "Los Angeles"), ("Compton College", "Los Angeles"),
        ("Long Beach City College", "Los Angeles"), ("Santa Monica College", "Los Angeles"),
        ("Los Angeles City College", "Los Angeles"), ("East Los Angeles College", "Los Angeles"),
        ("Los Angeles Harbor College", "Los Angeles"), ("Los Angeles Mission College", "Los Angeles"),
        ("Los Angeles Pierce College", "Los Angeles"), ("Los Angeles Southwest College", "Los Angeles"),
        ("Los Angeles Trade Technical College", "Los Angeles"), ("Los Angeles Valley College", "Los Angeles"),
        ("West Los Angeles College", "Los Angeles"),
    ],
    "Orange County": [
        ("Fullerton College", "Orange"), ("Cypress College", "Orange"),
        ("North Orange Continuing Education", "Orange"), ("North Orange Continuing Education Credit", "Orange"),
        ("Santiago Canyon College", "Orange"), ("Santa Ana College", "Orange"),
        ("Orange Coast College", "Orange"), ("Golden West College", "Orange"),
        ("Coastline Community College", "Orange"), ("Irvine Valley College", "Orange"),
        ("Saddleback College", "Orange"),
    ],
    "Inland Empire": [
        ("Chaffey College", "San Bernardino"), ("San Bernardino Valley College", "San Bernardino"),
        ("Crafton Hills College", "San Bernardino"), ("Victor Valley College", "San Bernardino"),
        ("Barstow Community College", "San Bernardino"), ("Copper Mountain College", "San Bernardino"),
        ("Riverside City College", "Riverside"), ("Moreno Valley College", "Riverside"),
        ("Norco College", "Riverside"), ("Mt. San Jacinto College", "Riverside"),
        ("College of the Desert", "Riverside"), ("Palo Verde College", "Riverside"),
    ],
    "San Diego – Imperial": [
        ("San Diego City College", "San Diego"), ("San Diego Mesa College", "San Diego"),
        ("San Diego Miramar College", "San Diego"), ("San Diego College of Continuing Education", "San Diego"),
        ("San Diego College of Continuing Education Credit", "San Diego"), ("Grossmont College", "San Diego"),
        ("Cuyamaca College", "San Diego"), ("Palomar College", "San Diego"),
        ("MiraCosta College", "San Diego"), ("Southwestern College", "San Diego"),
        ("Imperial Valley College", "Imperial"),
    ],
    "Statewide / Online": [
        ("Calbright College Credit", None),
    ],
}


def main():
    geo = []
    for region, colleges in REGIONS.items():
        for college, county in colleges:
            geo.append({"college": college, "region": region, "county": county})
    geo.sort(key=lambda g: g["college"])
    json.dump(geo, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"wrote {OUT}: {len(geo)} colleges across {len(REGIONS)} regions")

    # validate coverage against the catalog payload
    if os.path.exists(PAYLOAD):
        cat = {o["college"] for o in json.load(open(PAYLOAD))["offerings"]}
        geo_names = {g["college"] for g in geo}
        missing = sorted(cat - geo_names)
        extra = sorted(geo_names - cat)
        print(f"catalog colleges: {len(cat)} | geo: {len(geo_names)}")
        if missing:
            print(f"⚠ MISSING geo ({len(missing)}):", missing)
        if extra:
            print(f"⚠ geo names NOT in catalog ({len(extra)}):", extra)
        if not missing and not extra:
            print("✓ exact 1:1 coverage")


if __name__ == "__main__":
    main()
