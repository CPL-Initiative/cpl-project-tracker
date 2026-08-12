# College identity crosswalk — dry run 2026-08-12

MAP `college_id` is the key. Nothing here is written to Supabase.

- Colleges: **116**
- Carrying an MIS district/college code: **114** (30 via a curated bridge)
- Districts reached: **72**
- Still unresolved: **0**
- MIS rows matching no MAP college: **7**

## Source defects found in Appendix A

- `970/971` — district label carried over from the previous row; college name doubled by the PDF parse  
  before `{'district': 'CONTRA COSTA CCD', 'college': 'COPPER MOUNTAIN COPPER MOUNTAIN'}` → after `{'district': 'COPPER MOUNTAIN CCD', 'college': 'COPPER MOUNTAIN'}`
- `470/471` — spelling: source read EVERYGREEN VALLEY  
  before `{'college': 'EVERYGREEN VALLEY'}` → after `{'college': 'EVERGREEN VALLEY'}`

## Colleges Appendix A does not carry (measured, not a join failure)

- **Calbright College Non-Credit** (MAP id 24) — not in the supplied Appendix A (searched CALBRIGHT); statewide online college, launched 2018
- **Madera College** (MAP id 77) — not in the supplied Appendix A (searched MADERA, WILLOW); State Center CCD holds only Clovis/Fresno City/Reedley there

## Colleges with no MIS code — need a curator

None — every MAP college reached a district.

## MIS rows matching no MAP college

Mostly standalone adult/continuing-education SITES, which Sam ruled worth keeping (they are a funded population). Not defects.

| district/college | name | district |
|---|---|---|
| 330/335 | MARIN CONTINUING | MARIN CCD |
| 860/863 | NORTH ORANGE ADULT | NORTH ORANGE CCD |
| 870/872 | RANCHO SANTIAGO CED | RANCHO SANTIAGO CCD |
| 070/076 | SAN DIEGO ADULT | SAN DIEGO CCD |
| 070/078 | SAN DIEGO CONTINUING | SAN DIEGO CCD |
| 360/363 | SAN FRANCISCO CTRS | SAN FRANCISCO CCD |
| 650/652 | SANTA BARBARA CONT | SANTA BARBARA CCD |
