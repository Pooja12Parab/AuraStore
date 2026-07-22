# scripts/strapi-start.ps1
#
# Idempotent Strapi v5 dev-server bringup for AuraStore.
# Works on PowerShell 5.1 (Windows + Git Bash default shell).
#
# Usage (from repo root, PowerShell 5.1 on Windows):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\strapi-start.ps1           # foreground
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\strapi-start.ps1 -Async    # background
#
# Behavior:
#   - If something is already listening on :1337, exits 0 with the existing pid.
#   - Otherwise spawns `cd backend && npm run develop` in a new process and waits
#     for `/_health` to return 204 (≤ 90s).
#   - Captures logs to logs/strapi.log (rotated; not committed).
#
# Notes:
#   - PowerShell 5.1 rejects Bash-style `&` (background suffix). That's why this
#     script exists: it wraps the spawn in `Start-Process` which IS allowed.
#   - For Kilo's `background_process` tool, prefer that over `-Async` here.

[CmdletBinding()]
param(
    [switch]$Async,
    [int]$WaitSeconds = 90
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$logDir   = Join-Path $repoRoot 'logs'
$logFile  = Join-Path $logDir 'strapi.log'

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

function Is-StrapiHealthy {
    param([int]$TimeoutSec = 1)
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:1337/_health' `
            -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $r.StatusCode -eq 204
    } catch {
        return $false
    }
}

function Get-StrapiProc {
    $conn = Get-NetTCPConnection -LocalPort 1337 -State Listen -ErrorAction SilentlyContinue
    if ($conn) { return $conn[0].OwningProcess }
    return $null
}

# 1. Idempotency -- if already up, exit cleanly
$existing = Get-StrapiProc
if ($existing) {
    Write-Host "Strapi already running on :1337 (pid $existing). Nothing to do."
    exit 0
}

# 2. Start Strapi
Write-Host "Starting Strapi v5 dev server on :1337 ..."
Write-Host "  log: $logFile"

$backendDir = Join-Path $repoRoot 'backend'

if ($Async) {
    $proc = Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c',"cd /d `"$backendDir`" && npm run develop >> `"$logFile`" 2>&1" `
        -WindowStyle Hidden -PassThru
    Write-Host "  pid: $($proc.Id). Tailing $logFile is your way to follow."
    exit 0
}

# Foreground -- block until healthy, mirroring `npm run develop` semantics.
$proc = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c',"cd /d `"$backendDir`" && npm run develop >> `"$logFile`" 2>&1" `
    -WindowStyle Hidden -PassThru

# 3. Wait for /_health (one-shot check, no polling loop -- AGENTS.md G4).
$deadline = (Get-Date).AddSeconds($WaitSeconds)
do {
    Start-Sleep -Seconds 3
    if (Is-StrapiHealthy -TimeoutSec 1) {
        Write-Host "Strapi is healthy on http://localhost:1337 (pid $($proc.Id))."
        exit 0
    }
} while ((Get-Date) -lt $deadline)

Write-Error "Strapi did not become healthy in $WaitSeconds seconds."
Write-Error "Tail of log:"
Get-Content $logFile -Tail 50
exit 1
