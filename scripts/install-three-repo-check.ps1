# Installs the CPL three-repo check into the user-level Claude memory file
# (%USERPROFILE%\.claude\CLAUDE.md). One-time per machine; safe to re-run.
#
# Why user-level: a session with NO repos attached loads no project CLAUDE.md
# at all, so none of the team's standing instructions exist in it. The only
# place a check can live for that case is the machine itself. Ruled enforced
# by Sam, 2026-08-30 (all three repos).
#
# Mac/Linux: append the same block by hand to ~/.claude/CLAUDE.md.

$ErrorActionPreference = 'Stop'

$claudeDir = Join-Path $env:USERPROFILE '.claude'
$memFile   = Join-Path $claudeDir 'CLAUDE.md'
$marker    = '<!-- cpl-three-repo-check v1 -->'

$block = @"

$marker
## CPL Initiative three-repo check (installed $(Get-Date -Format 'yyyy-MM-dd'))
CPL / MAP / Veteran Sprint / COBI / Sierra work runs with ALL THREE repos
attached or mounted: cpl-knowledge-base, cpl-project-tracker, and CPLBrain
(COG-second-brain). At the start of any session touching that work: if any of
the three is not present, say which are missing in one line and ask before
proceeding.
"@

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir | Out-Null
}

if ((Test-Path $memFile) -and (Select-String -Path $memFile -SimpleMatch $marker -Quiet)) {
    Write-Host "Already installed in $memFile - nothing to do."
} else {
    Add-Content -Path $memFile -Value $block
    Write-Host "Installed the three-repo check into $memFile"
}
