# First Light reflections → Obsidian musings digest

First Light (the dashboard's daily painting greeting, `first_light.js`) invites
an **anonymous** one-line reflection. Those land in Supabase
`public.cpl_reflections` (anon INSERT only, **no public SELECT** — the
`chat_interactions` pattern). `build_reflections_digest.py` reads them with the
**service key** and renders a gentle per-week **"mashup of the week's musings"**
as Obsidian-friendly markdown.

```
SUPABASE_SERVICE_KEY=...  python3 reflections/build_reflections_digest.py --out <dir>
```

Writes `<dir>/YYYY-Www.md` (one ISO week each) + a rolling `<dir>/index.md`.
Idempotent — re-running overwrites the week files in place.

## Privacy contract (do not break)

- Reflections are **anonymous by design**: `first_light.js` posts only
  `{painting, reflection}` — no id, name, IP, or account. Users are told the
  words are kept anonymous and gathered only "to look for uplifting themes."
- The digest preserves that shape — painting + reflection + the calendar **day**,
  never an id or precise timestamp.
- The digest is for the **private `cpl-knowledge-base` vault**, **not this public
  repo**. The default `--out` (`reflections_out/`) is **gitignored** here, so no
  reflection text is ever committed to `cpl-project-tracker`. (Same rule as the
  raw MAP PII files — see `.gitignore`.)

## Two ways to run it

### A) Locally, on demand (simplest)

Point `--out` at your vault's `cpl-knowledge-base` clone; the vault-sync
(`scripts/sync-vault-clones.ps1`) surfaces it in Obsidian like any other note:

```
SUPABASE_SERVICE_KEY=$SVC python3 reflections/build_reflections_digest.py \
    --out "C:/Users/samuel.lee/Documents/GitHub/COG-second-brain/cpl-knowledge-base/musings"
```

### B) Weekly GitHub Action (automatic) — lives in `cpl-knowledge-base`

Add this workflow to the **`cpl-knowledge-base`** repo (it must hold the
`SUPABASE_SERVICE_KEY` secret). It commits the digest there, so the words never
touch the public tracker repo. Copy `build_reflections_digest.py` into that repo
(e.g. `tools/`) or `curl` it from raw at run time.

```yaml
# .github/workflows/weekly-musings.yml  (in cpl-knowledge-base)
name: Weekly First Light musings
on:
  schedule:
    - cron: "0 15 * * 1"   # Mondays ~15:00 UTC, after the week closes
  workflow_dispatch:
jobs:
  digest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-python@v6
        with: { python-version: "3.12" }
      - name: Build the musings digest
        env:
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python3 tools/build_reflections_digest.py --out musings
      - name: Commit if changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add musings
          git diff --cached --quiet || git commit -m "Weekly First Light musings digest"
          git push
```

The script **fails soft** everywhere: no service key, an HTTP error, or blocked
network → it prints a notice and exits `0`, so a workflow never goes red over a
transient hiccup.
