# Identities re-key — the dead remainder (3)

APPLIED 2026-09-05T22:42:45Z

Sam's ruling 5, 2026-09-05: the genuinely dead remainder is a worklist, never a silent drop.

These identities were REMOVED from kb/coci_articulations.json's identities map. Their articulation records are untouched and still name them, so nothing is lost: restoring one means fixing its key at the seed (kb/_seed_coci_articulations.py) and rebuilding.

| identity | system | records | colleges | malformed | credentials |
|---|---|---|---|---|---|
| `AG-AB 108 108` | C-ID | 1 | 19 | yes | Agricultural Computer Applications |
| `AG-PS 128 128 L` | C-ID | 2 | 25 | yes | Biodynamic Farmer Foundation Year Certificate, Credit by Exam |
| `NULL` | C-ID | 2 | 76 | yes | Cisco Networking Academy — Networking Essentials, Water Supply Technology |

## What a curator does with this

1. A malformed key (a doubled course number, `NULL`) is a SEED defect — fix the
   join in `kb/_seed_coci_articulations.py` so the row resolves, then rebuild.
2. A well-formed key that nothing names again is a genuine retirement: confirm
   against `kb/reference/coci_courses.json` and the alias receipts before
   accepting the loss of its articulation records.
