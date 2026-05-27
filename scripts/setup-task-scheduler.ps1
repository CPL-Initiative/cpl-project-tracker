# setup-task-scheduler.ps1
#
# Creates the "CPL Vault Sync" Windows scheduled task that runs
# sync-vault-clones.ps1 every N minutes (default 15). Idempotent --
# re-running with different cadence updates the existing task instead
# of erroring out.
#
# MUST be run in an elevated PowerShell session (Register-ScheduledTask
# requires admin). The script checks for this and exits with a helpful
# message if not.
#
# Usage:
#   # Default cadence (15 min):
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1
#
#   # Custom cadence (every 5 min for active-session days):
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1 -CadenceMinutes 5
#
#   # Remove the task entirely:
#   powershell -ExecutionPolicy Bypass -File setup-task-scheduler.ps1 -Remove
#
# To verify after setup:
#   Get-ScheduledTaskInfo -TaskName "CPL Vault Sync" |
#     Format-List LastRunTime, LastTaskResult, NextRunTime
#
# See docs/kb-notes/playbook-vault-sync-setup.md for the full playbook.

param(
    [int]$CadenceMinutes = 15,
    [switch]$Remove
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

$description = "Pulls cpl-project-tracker + cpl-knowledge-base from origin every $CadenceMinutes min so Obsidian picks up checkpoint commits automatically."

# -- register (idempotent) ---------------------------------------------
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Updating existing task '$taskName' with cadence $CadenceMinutes min..." -ForegroundColor Yellow
    Set-ScheduledTask -TaskName $taskName -Action $action -Trigger @($triggerLogon, $triggerRepeat) -Settings $settings | Out-Null
} else {
    Write-Host "Registering new task '$taskName' with cadence $CadenceMinutes min..." -ForegroundColor Cyan
    Register-ScheduledTask -TaskName $taskName -Description $description -Action $action -Trigger @($triggerLogon, $triggerRepeat) -Settings $settings | Out-Null
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
