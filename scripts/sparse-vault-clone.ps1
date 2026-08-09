# sparse-vault-clone.ps1
#
# Shrinks the IN-VAULT clone of cpl-project-tracker from ~1.07 GB to ~11 MB by
# materialising only the files Obsidian actually reads (docs/ + root markdown).
#
# Why this exists
# ---------------
# The repo is cloned INTO the Obsidian vault so the vault indexes every .md the
# sessions write. But a clone brings the whole working tree with it: ~1,766
# files, ~1.07 GB, of which only ~440 files / ~11 MB are documentation. Obsidian
# watches all of it.
#
# The exclusion list in .obsidian/app.json does NOT fix this. Obsidian's
# "Excluded files" is a RELEVANCE filter — it drops paths from search, graph and
# link autocomplete, but the file watcher, the metadata cache and Obsidian Sync
# still see them. Excluding makes the vault tidier to browse; only removing the
# files from disk makes it lighter.
#
# Two clones, two jobs
# --------------------
#   Documents\GitHub\cpl-project-tracker                     <- WORKING clone. Full
#                                                               tree. Never touched
#                                                               by this script.
#   Documents\GitHub\COG-second-brain\cpl-project-tracker    <- VAULT clone. Read-only
#                                                               mirror, fast-forward
#                                                               pulled by
#                                                               sync-vault-clones.ps1.
#                                                               THIS is the target.
#
# The vault clone never builds anything, so it has no use for 1 GB of generated
# .js/.json. Note kb/row_audit/ alone is ~418 MB — and it is MARKDOWN, so a naive
# "markdown only" rule would not have helped. The patterns below are scoped to the
# doc lanes, not to a file extension.
#
# Safety
# ------
#   * Refuses to run outside the vault root unless -Force (so it can never
#     strip your working clone).
#   * Refuses on a dirty tree or unpushed commits.
#   * Idempotent — re-running is a no-op.
#   * Fully reversible: -Revert restores the complete tree. Nothing is deleted
#     from git, only from the working directory; every file is one command away.
#
# Usage
#   powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1 -DryRun
#   powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1
#   powershell -ExecutionPolicy Bypass -File .\scripts\sparse-vault-clone.ps1 -Revert
#
# Docs: docs/kb-notes/playbook-keep-build-artifacts-out-of-the-vault.md

[CmdletBinding()]
param(
    [string] $Path,
    [switch] $Revert,
    [switch] $DryRun,
    [switch] $Force
)

$ErrorActionPreference = "Stop"

$vaultRoot = Join-Path $env:USERPROFILE "Documents\GitHub\COG-second-brain"
if (-not $Path) { $Path = Join-Path $vaultRoot "cpl-project-tracker" }

# The doc lanes Obsidian reads. Everything else stays in git and off the disk.
# Non-cone sparse-checkout patterns (gitignore syntax; a match = INCLUDE).
$patterns = @(
    '/*.md',            # CLAUDE.md, README.md, the root-level notes
    '/docs/',           # kb-notes, lessons, handoffs, reference — the whole lane
    '/kb/README.md'     # the KB lane's own readme; NOT kb/row_audit (418 MB)
)

function Say { param([string]$m, [string]$c = "Gray") Write-Host $m -ForegroundColor $c }

function Get-TreeSize {
    param([string]$p)
    $sum = (Get-ChildItem -LiteralPath $p -Recurse -File -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch '\\\.git\\' } |
            Measure-Object -Property Length -Sum)
    $mb = 0
    if ($sum.Sum) { $mb = [math]::Round($sum.Sum / 1MB, 1) }
    return [pscustomobject]@{ Files = $sum.Count; MB = $mb }
}

# ── guards ────────────────────────────────────────────────────────────────
if (-not (Test-Path $Path)) {
    Say "FATAL: no clone at $Path" "Red"
    Say "       Pass -Path if your vault lives elsewhere." "Yellow"
    exit 1
}
if (-not (Test-Path (Join-Path $Path ".git"))) {
    Say "FATAL: $Path is not a git repository." "Red"
    exit 1
}

# The important guard. Stripping the WORKING clone would delete the tree you
# build and run from — recoverable, but a genuinely bad afternoon.
$resolved = (Resolve-Path $Path).Path
if ($resolved -notlike "*COG-second-brain*" -and -not $Force) {
    Say "REFUSING: $resolved is not inside the vault ($vaultRoot)." "Red"
    Say "          This looks like your WORKING clone, which needs its full tree." "Yellow"
    Say "          If you really mean it, re-run with -Force." "Yellow"
    exit 1
}

Push-Location $Path
try {
    $dirty = git status --porcelain
    if ($dirty) {
        Say "REFUSING: the vault clone has uncommitted changes." "Red"
        Say "          Sparse-checkout would hide them. Commit or discard first:" "Yellow"
        $dirty | Select-Object -First 10 | ForEach-Object { Say "            $_" "Yellow" }
        exit 1
    }

    $upstream = git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
    if ($LASTEXITCODE -eq 0 -and $upstream) {
        $ahead = git rev-list --count "$upstream..HEAD" 2>$null
        if ($ahead -and [int]$ahead -gt 0) {
            Say "REFUSING: $ahead unpushed commit(s) here. Push them first." "Red"
            exit 1
        }
    }

    $before = Get-TreeSize $Path
    $isSparse = (git config --get core.sparseCheckout) -eq "true"

    # ── revert ────────────────────────────────────────────────────────────
    if ($Revert) {
        if (-not $isSparse) { Say "Already a full checkout — nothing to revert." "Green"; exit 0 }
        Say "Restoring the full tree at $Path ..." "Cyan"
        if ($DryRun) { Say "  [dry-run] would run: git sparse-checkout disable" "Yellow"; exit 0 }
        git sparse-checkout disable
        if ($LASTEXITCODE -ne 0) { Say "FAILED: git sparse-checkout disable" "Red"; exit 1 }
        $after = Get-TreeSize $Path
        Say ("  {0} files / {1} MB  ->  {2} files / {3} MB" -f `
             $before.Files, $before.MB, $after.Files, $after.MB) "Green"
        exit 0
    }

    # ── apply ─────────────────────────────────────────────────────────────
    if ($isSparse) { Say "Already sparse — re-applying patterns (idempotent)." "Gray" }
    Say "Vault clone : $Path" "Cyan"
    Say ("Before      : {0} files / {1} MB" -f $before.Files, $before.MB)
    Say "Keeping     : $($patterns -join '  ')" "Cyan"

    if ($DryRun) {
        Say "  [dry-run] would run: git sparse-checkout set --no-cone $($patterns -join ' ')" "Yellow"
        Say "  [dry-run] nothing changed." "Yellow"
        exit 0
    }

    git sparse-checkout set --no-cone @patterns
    if ($LASTEXITCODE -ne 0) { Say "FAILED: git sparse-checkout set" "Red"; exit 1 }

    $after = Get-TreeSize $Path
    Say ("After       : {0} files / {1} MB" -f $after.Files, $after.MB) "Green"
    if ($before.MB -gt 0) {
        Say ("Removed from disk: {0} MB ({1}%)" -f `
             ($before.MB - $after.MB),
             [math]::Round((($before.MB - $after.MB) / $before.MB) * 100, 1)) "Green"
    }

    # Sanity: the doc lanes must still be complete. A sparse checkout that
    # quietly dropped the docs would be worse than no sparse checkout at all.
    $notes    = @(Get-ChildItem -Path (Join-Path $Path "docs\kb-notes") -Filter *.md -ErrorAction SilentlyContinue).Count
    $handoffs = @(Get-ChildItem -Path (Join-Path $Path "docs") -Filter "session_*_handoff.md" -ErrorAction SilentlyContinue).Count
    $index    = Test-Path (Join-Path $Path "docs\INDEX.md")
    Say ""
    Say ("Verify      : kb-notes {0} · handoffs {1} · INDEX.md {2}" -f `
         $notes, $handoffs, $(if ($index) { "present" } else { "MISSING" })) `
         $(if ($notes -gt 0 -and $index) { "Green" } else { "Red" })
    if ($notes -eq 0 -or -not $index) {
        Say "WARNING: the docs lane looks empty. Run -Revert and report this." "Red"
        exit 1
    }
    Say ""
    Say "Done. Restart Obsidian to let it drop the removed files from its cache." "Cyan"
    Say "Reverse any time with:  .\scripts\sparse-vault-clone.ps1 -Revert" "Gray"
}
finally {
    Pop-Location
}
