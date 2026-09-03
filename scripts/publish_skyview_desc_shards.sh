#!/usr/bin/env bash
# Publish SkyView's per-discipline course-description shards to the PUBLIC
# Supabase Storage bucket `ccr-desc`, where the deployed SkyView page
# (prototype/skyview.html → prototype/ccr_universe.js) fetches them on demand.
#
# WHY A BUCKET. The shards are ~50 MB of DERIVED text (catalog descriptions,
# titles and units keyed by control number, one JSON per subject area). They are
# gitignored — committing them would grow the repo and every vault clone by that
# much on every regeneration — and unified_courses_member_desc.js (48 MB) is too
# large to fetch on a click. Sam, 2026-08-24: "I expect we'll put the shards on
# supabase." Schema of record: kb/supabase_ccr_desc_bucket.sql.
#
# Runs on the Actions runner (a session's sandbox cannot reach *.supabase.co):
#   .github/workflows/skyview-desc-shards.yml   manual, any time
#   .github/workflows/daily-dashboard.yml       after the artifacts rebuild
#
# Needs SUPABASE_SERVICE_KEY (the service role bypasses RLS; the bucket has no
# write policy for anon or authenticated on purpose). Never echoes the key.
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-https://hvuwhnbuahrtptokpqfh.supabase.co}"
BUCKET="${SKYVIEW_DESC_BUCKET:-ccr-desc}"
DIR="${SKYVIEW_DESC_DIR:-prototype/ccr_desc}"

if [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
  echo "SUPABASE_SERVICE_KEY is not set — nothing published." >&2
  exit 2
fi
if ! ls "$DIR"/*.json >/dev/null 2>&1; then
  echo "No shards under $DIR — run: python3 kb/_build_ccr_universe.py --shards-only" >&2
  exit 2
fi

n=0; bytes=0; failed=0
for f in "$DIR"/*.json; do
  name=$(basename "$f")
  size=$(stat -c %s "$f" 2>/dev/null || stat -f %z "$f")
  # x-upsert replaces an existing object under the same name, so a renamed
  # discipline leaves a stale shard behind only until the manifest names it.
  if curl -sS -f -o /dev/null -X POST \
       "$SUPABASE_URL/storage/v1/object/$BUCKET/$name" \
       -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
       -H "apikey: $SUPABASE_SERVICE_KEY" \
       -H "Content-Type: application/json" \
       -H "Cache-Control: max-age=3600" \
       -H "x-upsert: true" \
       --data-binary @"$f"; then
    n=$((n+1)); bytes=$((bytes+size))
  else
    failed=$((failed+1)); echo "  !! upload failed: $name" >&2
  fi
done

# A small manifest so a reader (or a future client) can tell what is published
# without listing the bucket: the shard names and when they were built.
manifest=$(mktemp)
{
  printf '{"generated_at":"%s","bucket":"%s","shards":[' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BUCKET"
  first=1
  for f in "$DIR"/*.json; do
    name=$(basename "$f" .json)
    if [ $first -eq 0 ]; then printf ','; fi
    printf '"%s"' "$name"; first=0
  done
  printf ']}\n'
} > "$manifest"
curl -sS -f -o /dev/null -X POST "$SUPABASE_URL/storage/v1/object/$BUCKET/_manifest.json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" -H "x-upsert: true" --data-binary @"$manifest" \
  || { failed=$((failed+1)); echo "  !! manifest upload failed" >&2; }
rm -f "$manifest"

echo "published $n shard(s), $((bytes/1048576)) MB, to $SUPABASE_URL/storage/v1/object/public/$BUCKET/ ($failed failed)"
[ "$failed" -eq 0 ]
