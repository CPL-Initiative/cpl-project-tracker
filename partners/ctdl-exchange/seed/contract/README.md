# The exchange contract, version 0

**Status: draft.** Version 0 is what the first drops follow. Sam, Malone, WestEd's lead and Credential Engine's lead
read the first comparison together and then set version 1; until then any field below may change by decision.

Three more files complete the contract:

- [`identifiers.md`](identifiers.md): which number names a course, a program, a college and a published resource.
- [`ctdl-mapping.md`](ctdl-mapping.md): the CTDL class for each kind of record, and how a program's requirements
  become a `ceterms:Pathway`.
- [`file_kinds.json`](file_kinds.json) and [`schemas/`](schemas/): what `tools/check_drop.py` checks, as data.

## A drop

A drop is one dated folder of files from one party, added in one pull request and never edited afterward.

| Party | Folder | Example |
| --- | --- | --- |
| Credential Engine | `inbound/credential-engine/<college>/<date>/` | `inbound/credential-engine/antelope-valley/2026-10-27/` |
| WestEd | `inbound/wested/coci/<date>/` | `inbound/wested/coci/2026-10-27/` |
| COBI | `outbound/cobi/<date>/` | `outbound/cobi/2026-11-03/` |

`<college>` is the college's short name in lower case with hyphens (`antelope-valley`, `city-college-of-san-francisco`);
the manifest carries its full name. `<date>` is the day the drop was produced, `YYYY-MM-DD`. A second drop for the same
college on the same day takes the next day's date or waits; one folder per party, college and day keeps the history
readable.

## The manifest

Every drop holds a `manifest.json` that lists every other file in the folder. The schema is
[`schemas/manifest.schema.json`](schemas/manifest.schema.json).

| Field | Required | Holds |
| --- | --- | --- |
| `contract_version` | yes | `"0"` |
| `party` | yes | `credential-engine`, `wested` or `cobi`, matching the folder |
| `drop_date` | yes | the folder's date |
| `college` | Credential Engine drops | `{"name": "Antelope Valley College", "mis_code": "621"}`: the name as COCI spells it, and the three-character CCCCO MIS college code where known |
| `colleges` | no | the same shape, as a list, for a WestEd or COBI drop that covers several colleges |
| `produced_by` | yes | `{"tool": "xTRA", "version": "03a9a1b", "person": "..."}`: what made the files and who filed them |
| `supersedes` | no | the path of the drop this one corrects, for example `inbound/credential-engine/taft/2026-10-27` |
| `files` | yes | one entry per file: `path` (a file name in this folder), `kind` (below), `rows` (data rows, header excluded; for JSON-LD, the number of nodes in `@graph`) and `sha256` (the file's checksum) |
| `notes` | no | anything a reader of the drop should know, in plain words |

## File kinds

A file's kind says who may file it, its format and the columns it must carry. Columns beyond the required ones are
welcome; the check reads only the ones it names. Each kind is defined in [`file_kinds.json`](file_kinds.json).

| Kind | Party | Format | Required columns | Notes |
| --- | --- | --- | --- | --- |
| `ce.courses` | Credential Engine | CSV | `External Identifier`, `Learning Opportunity Name` | xTRA's course list as exported or as reviewed. `Coded Notation` carries the printed code; `CTID`, where present, must be a well-formed CTID. |
| `ce.learning_programs` | Credential Engine | CSV | `External Identifier`, `Learning Opportunity Name` | xTRA's learning program list. |
| `ce.credentials` | Credential Engine | CSV | `External Identifier`, `Credential Name`, `Credential Type` | xTRA's credential list. |
| `ce.competencies` | Credential Engine | CSV | `@type`, `@id` | frameworks and competencies, one row each. |
| `ce.registry_ctids` | Credential Engine | CSV | `resource_type`, `external_identifier`, `ctid` | once a college's resources are published: each one's CTID, so COBI can file it in the crosswalk. |
| `wested.coci_courses` | WestEd | CSV | `College`, `CourseControlNumber`, `Subject`, `Course_Number`, `CourseTitle` | the column names COCI's course list uses. |
| `wested.coci_programs` | WestEd | CSV | `College`, `ProgramControlNumber` | the remaining columns follow COCI's own export and are named in version 1 after the first sample. |
| `cobi.identifier_crosswalk` | COBI | CSV | see [`schemas/identifier_crosswalk.schema.json`](schemas/identifier_crosswalk.schema.json) | each COBI record and its other numbers. |
| `cobi.findings` | COBI | CSV | see [`schemas/finding.schema.json`](schemas/finding.schema.json) | what a second reading of a partner's file found, and who fixes it. |
| `cobi.pathway` | COBI | JSON-LD | see [`schemas/pathway.schema.json`](schemas/pathway.schema.json) | a program's requirements as a CTDL Pathway. |

## The identifier crosswalk

One row says that a COBI record and an outside number name the same thing. Rows are added, never edited: a match
that turns out wrong is answered by a row with `status` `retired`.

| Column | Holds |
| --- | --- |
| `cobi_kind` | `coci_course`, `coci_program` or `harvest_record` |
| `cobi_key` | the record's key in COBI: a course or program control number, or for a harvest record the program control number and catalog year (`02964 2026-2027`) |
| `scheme` | the outside numbering scheme: `coci_course_control_number`, `coci_program_control_number`, `ctid`, `c_id`, `ce_external_identifier` or `catalog_url` |
| `value` | the outside number |
| `source` | where the match came from: a drop path and file, or `coci` |
| `supplied_by`, `supplied_at` | who proposed the match (a party, or a person's name, never an email address) and when, as an ISO 8601 date-time |
| `status` | `proposed`, `confirmed` or `retired` |
| `confirmed_by`, `confirmed_at` | for a confirmed row: who confirmed it and when |
| `note` | optional, plain words |

## Findings

A finding is one thing a second reading caught in a partner's file before it was published. Each names who fixes it:
a catalog error goes to the college, a misread goes to the reader's procedure.

| Column | Holds |
| --- | --- |
| `college` | the college the file describes, as COCI spells it |
| `drop` | the drop's path |
| `file` | the file name inside the drop |
| `row` | the data row, counting from 1, where one applies |
| `field` | the column, where one applies |
| `finding` | `wrong_link`, `ctid_reused`, `code_masked`, `code_suffixed`, `kind_misfiled`, `framework_overloaded`, `wrong_college_file`, `no_match`, `disagrees_with_coci` or `other` |
| `detail` | what was found, in plain words, with the values that show it |
| `fix_owner` | `college`, `credential-engine`, `wested` or `cobi` |

## CSV

UTF-8, comma-separated, a header row, quoting as RFC 4180 describes, one record per row. An empty cell means no value.
A byte-order mark at the start is accepted.

## The check

`python3 tools/check_drop.py` checks every drop in the repository: the folder matches its party, the manifest
matches its schema and lists every file, each file's checksum and row count match, each CSV carries its kind's
required columns, every CTID is well formed and no CTID names two resources in one drop, and each crosswalk, finding
and Pathway file matches its schema. With `--base <ref>` it also refuses a change to a drop that already exists on
that ref, and with `--branch <name>` it refuses a party branch (`ce/`, `wested/`, `cobi/`) that touches another
party's folder. CI runs it with both on every pull request.
