"""
Re-mint generator — STEP 1c-i: re-key coci_unified_courses.json cluster members
onto the new minted identities (via the 1a alias). Cluster ids (UC-#####) are
stable; only their `members` lists (old M-IDs) are re-keyed. Writes
kb/remint_out/coci_unified_courses.json (preview). No live or Supabase writes.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "remint_out")


def main():
    doc = json.load(open(os.path.join(HERE, "coci_unified_courses.json"), encoding="utf-8"))
    alias = json.load(open(os.path.join(OUT_DIR, "alias_map.json"), encoding="utf-8"))["alias"]
    clusters = doc["clusters"]
    rekeyed, missing = 0, set()
    for v in clusters.values():
        nm = []
        for m in v.get("members", []):
            if m in alias:
                nm.append(alias[m]); rekeyed += 1
            else:
                missing.add(m); nm.append(m)
        v["members"] = nm
    assert not missing, f"cluster members not in alias: {sorted(missing)[:5]}"
    doc["_status"] = "PREVIEW — step 1c-i: cluster members re-keyed onto re-minted M-IDs."
    with open(os.path.join(OUT_DIR, "coci_unified_courses.json"), "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"clusters: {len(clusters)} | member refs re-keyed: {rekeyed} | missing: {len(missing)}")
    print(f"wrote {os.path.join(OUT_DIR, 'coci_unified_courses.json')}")


if __name__ == "__main__":
    main()
