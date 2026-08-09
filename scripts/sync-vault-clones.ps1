# sync-vault-clones.ps1
#
# Keeps the in-vault clones of CPL repos fresh by fast-forward pulling
# from origin. Designed to be run regularly via Windows Task Scheduler
# so Sam's Obsidian vault picks up checkpoint commits without manual
# git pull.
#
# Targets (relative to $env:USERPROFILE\Documents\GitHub\COG-second-brain\):
#   cpl-project-tracker/       (this repo -- main KB content lane)
#   cpl-knowledge-base/        (public KB)
#
# Behavior:
#   - Fast-forward ONLY. Never auto-merges, never auto-rebases. If the
#     vault clone has uncommitted work or diverged commits, the script
#     logs a warning and moves on (no destructive ops).
#   - Per-repo logging to .vault-sync.log at the COG-second-brain root.
#   - Silent on success; warns on skip/divergence/error so the log
#     stays readable.
#
# Setup: see docs/kb-notes/playbook-vault-sync-setup.md
#
# Manual run:
#   powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\sync-vault-clones.ps1"

$ErrorActionPreference = "Continue"

$vaultRoot = Join-Path $env:USERPROFILE "Documents\GitHub\COG-second-brain"
$repos = @("cpl-project-tracker", "cpl-knowledge-base")
$logFile = Join-Path $vaultRoot ".vault-sync.log"

# Cap log size to ~500 KB so it doesn't grow forever.
if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt 512KB)) {
    $tail = Get-Content $logFile -Tail 1000
    Set-Content -Path $logFile -Value $tail
}

function Log {
    param([string]$msg)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "$ts  $msg"
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

if (-not (Test-Path $vaultRoot)) {
    Log "FATAL: vault root not found at $vaultRoot"
    exit 1
}

foreach ($repo in $repos) {
    $path = Join-Path $vaultRoot $repo
    if (-not (Test-Path $path)) {
        Log "[$repo] SKIP -- directory not present at $path"
        continue
    }
    if (-not (Test-Path (Join-Path $path ".git"))) {
        Log "[$repo] SKIP -- not a git repository"
        continue
    }

    Push-Location $path
    try {
        # Bail on uncommitted work (we never want this script to clobber
        # local edits or unfinished commits).
        $porcelain = git status --porcelain 2>$null
        if ($LASTEXITCODE -ne 0) {
            Log "[$repo] ERROR -- git status failed; skipping"
            continue
        }
        if ($porcelain) {
            $nLines = ($porcelain -split "`n").Count
            Log "[$repo] SKIP -- $nLines uncommitted change(s); finish those first"
            continue
        }

        # Quiet fetch.
        git fetch origin main --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Log "[$repo] ERROR -- git fetch failed (network or auth)"
            continue
        }

        # Compute ahead/behind against origin/main.
        $rev = git rev-list --left-right --count "HEAD...origin/main" 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $rev) {
            Log "[$repo] ERROR -- could not compute ahead/behind"
            continue
        }
        $parts = $rev -split '\s+'
        $ahead = [int]$parts[0]
        $behind = [int]$parts[1]

        if ($behind -eq 0) {
            # Up-to-date -- quiet success.
            # (Uncomment next line if you prefer a heartbeat in the log.)
            # Log "[$repo] up-to-date"
            continue
        }
        if ($ahead -gt 0) {
            Log "[$repo] DIVERGED -- $ahead ahead, $behind behind; manual merge needed"
            continue
        }

        # Fast-forward only.
        git pull --ff-only origin main --quiet 2>$null
        if ($LASTEXITCODE -ne 0) {
            Log "[$repo] ERROR -- fast-forward pull failed"
            continue
        }
        Log "[$repo] pulled $behind commit(s) from origin/main"

        # Sparse-checkout watchdog (added 2026-08-09). The tracker's vault clone
        # is meant to be a docs-only checkout (~11 MB, not ~1.07 GB) — see
        # scripts/sparse-vault-clone.ps1. A pull preserves sparseness, but a
        # stray `git sparse-checkout disable` or a re-clone would silently
        # restore 1 GB of build artifacts into the vault, and the only symptom
        # is Obsidian getting slow again weeks later. Log it so the cause is
        # findable rather than mysterious. Report-only: never re-applies
        # sparseness on its own, because that would delete files a human may
        # have restored deliberately.
        if ($repo -eq "cpl-project-tracker") {
            $sparse = git config --get core.sparseCheckout 2>$null
            if ($sparse -ne "true") {
                Log "[$repo] NOTE -- full checkout (not sparse); vault carries the build artifacts. Run scripts\sparse-vault-clone.ps1 to shrink it."
            }
        }
    }
    catch {
        Log "[$repo] EXCEPTION -- $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
}
