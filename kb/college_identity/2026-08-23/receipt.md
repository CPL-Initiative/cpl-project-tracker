# College identity crosswalk — dry run 2026-08-23

MAP `college_id` is the key. Nothing here is written to Supabase.

- Colleges: **120**
- Carrying an MIS district/college code: **118** (0 via a curated bridge)
- Districts reached: **73**
- Still unresolved: **0**
- MIS rows matching no MAP college: **5**

## Source defects found in Appendix A

- `970/971` — district label carried over from the previous row; college name doubled by the PDF parse  
  before `{'district': 'CONTRA COSTA CCD', 'college': 'COPPER MOUNTAIN COPPER MOUNTAIN'}` → after `{'district': 'COPPER MOUNTAIN CCD', 'college': 'COPPER MOUNTAIN'}`
- `470/471` — spelling: source read EVERYGREEN VALLEY  
  before `{'college': 'EVERYGREEN VALLEY'}` → after `{'college': 'EVERGREEN VALLEY'}`

## Placeholder codes (Sam, 2026-08-12)

Non-numeric on purpose, so a placeholder can never be mistaken for or sorted beside a real MIS code. Every row also carries `mis_code_is_placeholder: true`.

- **Calbright College Non-Credit** (MAP id 24) → `X00/X02` — California Online Community College District
- **Madera College** (MAP id 77) → `570/X01` — State Center Community College District

## Colleges Appendix A does not carry (measured, not a join failure)

- None.

## Colleges with no MIS code — need a curator

None — every MAP college reached a district.

## Colleges in the 2026 CEO list that MAP does not carry

Each has its own CEO, so they are institutions rather than sites. These are the standalone continuing-education institutions the NC / Learning Partners workstream found sitting at ZERO in MAP.

- None.

## MIS rows matching no MAP college

Mostly standalone adult/continuing-education SITES, which Sam ruled worth keeping (they are a funded population). Not defects.

| district/college | name | district |
|---|---|---|
| 330/335 | MARIN CONTINUING | MARIN CCD |
| 870/872 | RANCHO SANTIAGO CED | RANCHO SANTIAGO CCD |
| 070/078 | SAN DIEGO CONTINUING | SAN DIEGO CCD |
| 360/363 | SAN FRANCISCO CTRS | SAN FRANCISCO CCD |
| 650/652 | SANTA BARBARA CONT | SANTA BARBARA CCD |
