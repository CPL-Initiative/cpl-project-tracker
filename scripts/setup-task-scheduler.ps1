# setup-task-scheduler.ps1
#
# Creates the "CPL Vault Sync" Windows scheduled task that runs
# sync-vault-clones.ps1 every N minutes (default 60). Idempotent --
# re-running with different cadence updates the existing task instead
# of erroring out.
#
# MUST be run in an elevated PowerShell session (Register-ScheduledTask
# requires admin). The script checks for this and exits with a helpful
# message if not.
#
# Usage:
#   # Default cadence (60 min):
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1
#
#   # Tighter cadence for an active-session day:
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1 -CadenceMinutes 30
#
#   # Remove the task entirely:
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1 -Remove
#
#   # If the hidden (S4U) run ever breaks git auth, fall back to a visible one:
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1 -Interactive
#
# Two behaviours changed 2026-08-09, both from Sam running this for real:
#
#   1. NO CONSOLE WINDOW. The task used to run with the default Interactive
#      logon, so Windows painted a terminal over whatever he was doing on every
#      tick. `-WindowStyle Hidden` never fixed that -- the principal did. See the
#      -Principal block below.
#   2. Default cadence 15 -> 60. Work lands a few times a day (session PRs plus
#      the three daily-dashboard crons at 06:17/09:17/12:17 UTC) and vault notes
#      are not time-critical: 24 pulls/day instead of 96. When you want the
#      vault current RIGHT NOW, run sync-vault-clones.ps1 by hand -- that is the
#      escape hatch, not a tighter cron.
#
# (1) is the actual fix. (2) is comfort -- a window that interrupts you hourly
# is still a window that interrupts you.
#
# To verify after setup:
#   Get-ScheduledTaskInfo -TaskName "CPL Vault Sync" |
#     Format-List LastRunTime, LastTaskResult, NextRunTime
#
# See docs/kb-notes/playbook-vault-sync-setup.md for the full playbook.

param(
    [int]$CadenceMinutes = 60,
    [switch]$Remove,
    [switch]$Interactive   # fall back to a visible console if S4U breaks git auth
)

$ErrorActionPreference = "Stop"
$taskName = "CPL Vault Sync"

# -- elevation check ---------------------------------------------------
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run from an elevated PowerShell session." -ForegroundColor Red
    Write-Host "       Right-click PowerShell -> 'Run as Administrator', then re-run." -ForegroundColor Red
    exit 1
}

# -- remove mode -------------------------------------------------------
if ($Remove) {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Removed scheduled task '$taskName'." -ForegroundColor Green
    } else {
        Write-Host "No scheduled task named '$taskName' was found. Nothing to remove." -ForegroundColor Yellow
    }
    exit 0
}

# -- compute paths -----------------------------------------------------
# The sync script lives next to this one in the same scripts/ directory.
$syncScript = Join-Path $PSScriptRoot "sync-vault-clones.ps1"
if (-not (Test-Path $syncScript)) {
    Write-Host "ERROR: sync-vault-clones.ps1 not found at $syncScript" -ForegroundColor Red
    Write-Host "       Run this from the cpl-project-tracker/scripts/ directory." -ForegroundColor Red
    exit 1
}

# -- build the task components -----------------------------------------
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -NoProfile -File `"$syncScript`""

$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Repeating trigger -- the cmdlet doesn't let you set RepetitionInterval
# on the main trigger directly, so we create a throwaway trigger to lift
# its Repetition object onto the real one. RepetitionDuration must be
# finite (TimeSpan]::MaxValue serializes to a value Task Scheduler rejects),
# so we use ~27 years.
$triggerRepeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
$triggerRepeat.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes $CadenceMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 9999)).Repetition

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -RestartCount 3 `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -MultipleInstances IgnoreNew

# -- principal: this is what stops the console window flashing ----------
# `-WindowStyle Hidden` on powershell.exe is NOT enough. With no explicit
# principal, Register-ScheduledTask defaults to LogonType Interactive, so the
# task launches inside the logged-on desktop session and Windows paints a
# console window before PowerShell can hide itself. On a 15-minute cadence that
# is a terminal popping over whatever you are doing, four times an hour.
#
# S4U ("run whether the user is logged on or not", without a stored password)
# runs the task off the interactive desktop, so no window is ever created.
# This is the fix; the cadence change is only comfort.
#
# Caveat, and the reason for -Interactive below: an S4U token has restricted
# access to network resources and to Windows Credential Manager. Both synced
# repos are public, so `git pull` needs no credentials and S4U is fine. If a
# private repo is ever added to $repos in sync-vault-clones.ps1, the pull may
# start failing silently under S4U -- re-run with -Interactive to trade the
# hidden window back for full credentials.
$logonType = if ($Interactive) { "Interactive" } else { "S4U" }
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType $logonType `
    -RunLevel Limited

$description = "Pulls cpl-project-tracker + cpl-knowledge-base from origin every $CadenceMinutes min so Obsidian picks up checkpoint commits automatically."

# -- register (idempotent) ---------------------------------------------
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Updating existing task '$taskName' with cadence $CadenceMinutes min..." -ForegroundColor Yellow
    Set-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerLogon, $triggerRepeat) -Settings $settings -Principal $principal | Out-Null
} else {
    Write-Host "Registering new task '$taskName' with cadence $CadenceMinutes min..." -ForegroundColor Cyan
    Register-ScheduledTask -TaskName $taskName -Description $description -Action $action -Trigger @($triggerLogon, $triggerRepeat) -Settings $settings -Principal $principal | Out-Null
}

# -- verify ------------------------------------------------------------
$task = Get-ScheduledTask -TaskName $taskName
Write-Host ""
Write-Host "Task registered. State: $($task.State)" -ForegroundColor Green
Write-Host ""
Write-Host "Verify with:"
Write-Host "  Get-ScheduledTaskInfo -TaskName `"$taskName`" | Format-List LastRunTime, LastTaskResult, NextRunTime"
Write-Host ""
Write-Host "Fire now (one-shot):"
Write-Host "  Start-ScheduledTask -TaskName `"$taskName`""

# -- smoke test --------------------------------------------------------
# An S4U token has restricted credential access, so if a pull ever needs auth
# it fails SILENTLY -- the task still reports "Ready" and the vault just quietly
# stops updating. That is the same silent-failure shape as the sparse-checkout
# bug, so prove it works now rather than trusting it.
Write-Host ""
Write-Host "Smoke test: running the task once as $logonType ..." -ForegroundColor Cyan
Start-ScheduledTask -TaskName $taskName
$deadline = (Get-Date).AddSeconds(90)
do {
    Start-Sleep -Seconds 3
    $info = Get-ScheduledTaskInfo -TaskName $taskName
    $state = (Get-ScheduledTask -TaskName $taskName).State
} while ($state -eq "Running" -and (Get-Date) -lt $deadline)

if ($info.LastTaskResult -eq 0) {
    Write-Host "  PASS - exit 0. No console window should have appeared." -ForegroundColor Green
    Write-Host "  Confirm the pull landed:" -ForegroundColor Gray
    Write-Host "    Get-Content `"`$env:USERPROFILE\Documents\GitHub\COG-second-brain\.vault-sync.log`" -Tail 3" -ForegroundColor Gray
} else {
    Write-Host "  FAIL - LastTaskResult = $($info.LastTaskResult)" -ForegroundColor Red
    if (-not $Interactive) {
        Write-Host "  Most likely the S4U token cannot reach git. Re-run with -Interactive" -ForegroundColor Yellow
        Write-Host "  to restore full credentials (you get the console window back):" -ForegroundColor Yellow
        Write-Host "    .\setup-task-scheduler.ps1 -CadenceMinutes $CadenceMinutes -Interactive" -ForegroundColor Yellow
    }
    Write-Host "  Check .vault-sync.log for the underlying error." -ForegroundColor Yellow
}
