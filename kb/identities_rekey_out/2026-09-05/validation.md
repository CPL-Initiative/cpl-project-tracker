# Identities map re-key — APPLY validation receipt

- applied: `2026-09-05T22:42:45Z`
- ruling: Sam, 2026-09-05 21:51 UTC, decision sheet 2026-09-05-ten-open-rulings item 4 'Re-key the two files through the alias chain' = yes; item 5 'What happens to the ids that resolve to nothing' = yes (a worklist, never a silent drop)
- ripple: dropped 56 · kept 921 · rekeyed 1,369

## Gates

- ✅ G1 every remaining key is a live catalog id
- ✅ G2 count = before - ghosts + rekeyed
- ✅ G3 every re-keyed entry carries its old key
- ✅ G4 untouched live entries byte-identical
- ✅ G5 no dropped key remains
