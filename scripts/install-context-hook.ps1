# install-context-hook.ps1
#
# Registers the context-pressure meter as a Claude Code PostToolUse hook on
# Windows, so a session warns BEFORE it auto-compacts instead of discovering it
# after. See CLAUDE.md Rule 9a.
#
# Why a script and not "edit settings.json by hand":
#   - settings.json already holds other keys (model, and possibly the stop-hook).
#     A hand-edit that replaces the file loses them silently.
#   - PowerShell 5.1's ConvertTo-Json defaults to -Depth 2, which SILENTLY
#     truncates a nested hooks block into the string "System.Object[]". That is
#     a corrupted settings file that still looks like JSON.
#   - It must be safe to run twice. It is: an existing registration is detected
#     and left alone.
#
# Behavior:
#   - Backs up settings.json to settings.json.bak-<timestamp> before writing.
#   - Never touches the shell wrapper (scripts/context-pressure-hook.sh) --
#     Windows points straight at the Python module; there is no jq or bash
#     dependency on this path.
#   - Verifies by running the meter and printing your live context.
#
# Manual run:
#     powershell -ExecutionPolicy Bypass -File scripts\install-context-hook.ps1
#
# To remove later: delete the entry whose command contains "_context_budget.py"
# from the PostToolUse array in $env:USERPROFILE\.claude\settings.json.

[CmdletBinding()]
param(
    [string]$RepoPath,
    [string]$SettingsPath = (Join-Path $env:USERPROFILE ".claude\settings.json")
)

$ErrorActionPreference = "Stop"

# ConvertFrom-Json -AsHashtable is PowerShell 6+; Windows ships 5.1, where it
# is a parameter-binding error. Convert by hand so this runs on both.
function ConvertTo-Hashtable($obj) {
    if ($null -eq $obj) { return $null }
    if ($obj -is [System.Collections.IDictionary]) {
        $h = @{}; foreach ($k in $obj.Keys) { $h[$k] = ConvertTo-Hashtable $obj[$k] }; return $h
    }
    if ($obj -is [System.Management.Automation.PSCustomObject]) {
        $h = @{}
        foreach ($p in $obj.PSObject.Properties) { $h[$p.Name] = ConvertTo-Hashtable $p.Value }
        return $h
    }
    # A bare string is IEnumerable; test it before the array branch or every
    # string becomes a char array.
    if ($obj -is [string]) { return $obj }
    if ($obj -is [System.Collections.IEnumerable]) {
        return @(foreach ($i in $obj) { ConvertTo-Hashtable $i })
    }
    return $obj
}

function Fail($msg) { Write-Host "  [x] $msg" -ForegroundColor Red; exit 1 }
function Ok($msg)   { Write-Host "  [ok] $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "  $msg" -ForegroundColor Gray }

Write-Host "`nContext-pressure hook installer" -ForegroundColor Cyan
Write-Host ("-" * 50)

# --- 1. locate the repo ------------------------------------------------------
if (-not $RepoPath) {
    $candidates = @(
        (Join-Path $env:USERPROFILE "Documents\GitHub\cpl-project-tracker"),
        (Join-Path $env:USERPROFILE "Documents\GitHub\COG-second-brain\cpl-project-tracker"),
        (Get-Location).Path
    )
    $RepoPath = $candidates | Where-Object {
        Test-Path (Join-Path $_ "kb\_context_budget.py")
    } | Select-Object -First 1
}
if (-not $RepoPath) {
    Fail "cpl-project-tracker not found. Re-run with: -RepoPath C:\path\to\cpl-project-tracker"
}
$meter = Join-Path $RepoPath "kb\_context_budget.py"
if (-not (Test-Path $meter)) { Fail "no kb\_context_budget.py under $RepoPath" }
Ok "repo: $RepoPath"

# --- 2. locate python --------------------------------------------------------
$py = $null
foreach ($c in @("py", "python3", "python")) {
    $cmd = Get-Command $c -ErrorAction SilentlyContinue
    if ($cmd) {
        # `py` is the launcher; make sure it actually resolves an interpreter.
        try {
            $v = & $c -c "import sys;print(sys.version_info[0])" 2>$null
            if ($v -and [int]$v -ge 3) { $py = $c; break }
        } catch { }
    }
}
if (-not $py) { Fail "no Python 3 on PATH (tried py, python3, python)" }
Ok "python: $py"

# --- 3. prove the meter works BEFORE touching settings -----------------------
# A hook registered against a broken meter is worse than no hook: it fires,
# says nothing useful, and you stop trusting the warning.
$probe = & $py $meter 2>&1
# 0 ok / 1 unmeasurable / 3 warn / 4 emergency are all HEALTHY -- 3 and 4 just
# mean this very session is already under pressure. Anything else (2 = argparse,
# or a traceback) is a real failure.
if (@(0, 1, 3, 4) -notcontains $LASTEXITCODE) { Fail "meter returned $LASTEXITCODE : $probe" }
Ok "meter runs: $probe"

# --- 4. read existing settings (merge, never replace) ------------------------
$settingsDir = Split-Path $SettingsPath -Parent
if (-not (Test-Path $settingsDir)) { New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null }

if (Test-Path $SettingsPath) {
    $raw = Get-Content $SettingsPath -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) { $settings = @{} }
    else {
        try { $settings = ConvertTo-Hashtable ($raw | ConvertFrom-Json) }
        catch { Fail "settings.json is not valid JSON; fix or move it first: $SettingsPath" }
    }
    $stamp  = Get-Date -Format "yyyyMMdd-HHmmss"
    $backup = "$SettingsPath.bak-$stamp"
    Copy-Item $SettingsPath $backup -Force
    Ok "backed up -> $backup"
} else {
    $settings = @{}
    Info "no settings.json yet; creating one"
}
if (-not $settings) { $settings = @{} }

# --- 5. merge the hook -------------------------------------------------------
# Forward slashes: valid on Windows Python and free of JSON escaping traps.
$meterFwd = $meter -replace '\\', '/'
$command  = "$py `"$meterFwd`" --hook"

if (-not $settings.ContainsKey("hooks"))              { $settings["hooks"] = @{} }
if (-not $settings["hooks"].ContainsKey("PostToolUse")) { $settings["hooks"]["PostToolUse"] = @() }

$already = $false
foreach ($group in @($settings["hooks"]["PostToolUse"])) {
    foreach ($h in @($group["hooks"])) {
        if ($h["command"] -and $h["command"] -like "*_context_budget.py*") { $already = $true }
    }
}

if ($already) {
    Ok "already registered — nothing to change"
} else {
    $settings["hooks"]["PostToolUse"] = @($settings["hooks"]["PostToolUse"]) + @(
        @{ matcher = "*"; hooks = @(@{ type = "command"; command = $command }) }
    )
    # -Depth 10 is load-bearing: the 5.1 default of 2 silently flattens this
    # into "System.Object[]" and writes a corrupted file that still parses.
    $json = $settings | ConvertTo-Json -Depth 10
    # Set-Content -Encoding UTF8 emits a BOM on PowerShell 5.1, and a BOM can
    # break a strict JSON reader. Write UTF-8 without one.
    [System.IO.File]::WriteAllText($SettingsPath, $json, (New-Object System.Text.UTF8Encoding($false)))
    Ok "registered PostToolUse hook"
    Info "command: $command"
}

Write-Host ""
Write-Host "Done. Restart Claude Code, then confirm with:" -ForegroundColor Cyan
Write-Host "    $py `"$meterFwd`""
Write-Host ""
Write-Host "You'll be warned at ~110,000 tokens remaining and again at ~50,000." -ForegroundColor Gray
