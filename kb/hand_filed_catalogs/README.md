# Hand-filed catalogs

A college catalog a person fetched by hand for the program requirements harvest,
where the college's host refuses the reader (Sam, 2026-10-17: automated reads still
name the CPL Initiative and respect blocks and robots.txt; a person may fetch a
public file by hand for the pipeline).

The first eight, filed S406 from the files Sam posted to the `catalog-files` release
on 2026-10-17: De Anza (its 2025-2026 catalog and spring addendum; no 2026-2027 PDF
exists) and City College of San Francisco (Cloudflare 403), American River, Cosumnes
River, Folsom Lake and Sacramento City (404), and Cerro Coso and Porterville
(robots.txt; Porterville with its two addenda).

## Filing one

1. Download the college's 2026-2027 catalog PDF from its public page.
2. Gzip it if it is over 25 MB: `gzip -k catalog.pdf`. Keep the file under 100 MB.
3. Name the file after the college's slug, `slug_of()` in the reader: the registry
   name in lower case, " college" dropped, other characters as underscores (De Anza
   College is `de_anza`, City College of San Francisco `city_of_san_francisco`):
   `de_anza.pdf` or `de_anza.pdf.gz`.
4. Write `<slug>.json` beside it:

   ```json
   {
    "college": "De Anza College",
    "url": "https://www.deanza.edu/catalog/...pdf",
    "fetched_by": "Sam Lee",
    "fetched_at": "2026-10-18",
    "catalog_year": "2026-2027",
    "file": "de_anza.pdf.gz",
    "sha256": "<sha256 of the PDF itself, before gzip>",
    "note": "Downloaded in a browser from the catalog page."
   }
   ```

   `sha256sum catalog.pdf` gives the hash. Every key but `catalog_year` and
   `note` is required.
5. Commit both on a `claude/` branch and dispatch `program-requirements-college.yml`
   with `college=` the college's registry name and `step=read`.

## Filing a release copy (S406)

The session's proxy refuses GitHub's attachment host, and a catalog in git weighs on
every clone and on the Pages site. So a file posted to the `catalog-files` release
(or any address a runner can fetch) is filed by its address alone:

```json
{
 "college": "De Anza College",
 "url": "https://www.deanza.edu/catalog/documents/dac_catalog_2025-2026.pdf",
 "fetched_by": "Sam Lee",
 "fetched_at": "2026-10-17",
 "catalog_year": "2025-2026",
 "copy_url": "https://github.com/user-attachments/files/<id>/<name>.pdf",
 "sha256": "",
 "addenda": [{"title": "Spring 2026 addendum", "url": "<the college's address>",
              "copy_url": "<the release copy>"}],
 "note": "..."
}
```

The read job's first step, `pin`, fetches the copy (and each addendum), writes its
sha256, size and run into the record, and the job commits the record with the run's
files. A pinned hash never changes: a copy that differs later is refused. `url` stays
the college's own address, the provenance a reader cites.

**Addenda** keep their provenance on the record and on the capture report. The reader
does not read them; which programs an addendum changes is the addenda reading agent's
(`program_source_addenda`).

The capture reads the file in place of any download whatever the registry row
names, refuses it when the hash differs from the record, and stamps who fetched it,
when and the hash on the report and on each record's source.
`kb/_program_requirements_college.py` (`hand_filed`, `pin`, `read_hand_filed`); guard:
`tests/program_requirements_college_test.py`.
