# Spot-check receipts

COBIx, the team's reviewer, checks five records per college by hand against the catalog after a harvest wave and posts a `check JSON (schema 1)` block on the wave's pull request. That contract is on #3111, comment 6840743191. Each `<wave>.check.json` here is that fenced block, filed byte for byte as he posted it, with no value changed. The file holds the block's lines exactly, each ending in a newline. Anyone can check this by hashing the fenced text in the source comment.

The Commons data dashboard reads these files (`kb/_build_commons_data_status.py`, #3215). It reads each college's level of confidence from the newest receipt by `checked_at`.

| File | Source comment | sha256 |
|---|---|---|
| `pr-3194-santiago-canyon-reread.check.json` | [#3194 comment 6848711006](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3194#issuecomment-6848711006) | `0db5f750389daa78092cb1e47accaf6808ac6bf7de870ecd10a8787ed3d692fb` |
| `pr-3205-diablo-valley.check.json` | [#3205 comment 6848711688](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3205#issuecomment-6848711688) | `97bf8019d06c4b7383d5e380736694e52ee438cf19bc78727cd74f2b3c01e6d1` |
| `pr-3206-san-jose-city.check.json` | [#3206 comment 6848712362](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3206#issuecomment-6848712362) | `8edb1ca3a9d99df607771677bf22bcfdeee6f1c579d0e782bfaebc02506c4765` |
| `pr-3207-rescore-six.check.json` | [#3207 comment 6848713027](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3207#issuecomment-6848713027) | `ff7d9c953446c63e3ac3815d3f20a502b143804c49222eef4d2e25ecb64d7d23` |

## Ours, beside his

`pr-3207-rescore-six.later.json` was written by Sky (S647), not by COBIx. In [#3207 comment 6851481011](https://github.com/CPL-Initiative/cpl-project-tracker/pull/3207#issuecomment-6851481011), posted 2026-11-13, COBIx settled the receipt's two unreachable rows in prose, with no JSON: Grossmont 30977 and East Los Angeles 32154 agreed, read against the captured text in the run artifacts. The builder moves those two rows from unreachable to agreeing. His receipt stays as he posted it.

A superseding receipt from him goes in as a new file. The newest `checked_at` counts.
