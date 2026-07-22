# scripts/strapi-issue-order-token.ps1
#
# Issue a write-scoped Strapi API token named "Order writer" (Phase 2).
# Idempotent: if the token already exists, prints the existing accessKey.
#
# Behavior:
#   1. Admin login -> admin JWT.
#   2. Look up `Order writer` via GET /admin/api-tokens (filter by name).
#   3. If found -> print accessKey; exit 0.
#   4. Else POST /admin/api-tokens with permissions listed below.
#   5. Print the new accessKey + paste-ready line for .env.local.
#
# Permissions requested for Phase 2 Order writer:
#   - api::order.order.find
#   - api::order.order.findOne
#   - api::order.order.create
#   - api::order.order.update
#
# Prerequisites:
#   - Strapi running on http://localhost:1337 (use scripts/strapi-start.ps1).
#   - The `Order` content type must already exist (schema + rebuild) or the
#     API returns "Unknown permissions provided" 400.
#   - `STRAPI_ADMIN_EMAIL` and `STRAPI_ADMIN_PASSWORD` must be set in either
#     `backend/.env` or `.env.local` (this script reads .env.local first).
#
# Usage (from repo root, PowerShell 5.1 on Windows):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\strapi-issue-order-token.ps1

param([string]$Name = 'Order writer')

$ErrorActionPreference = 'Stop'

$envFile = Join-Path (Resolve-Path "$PSScriptRoot\..").Path '.env.local'
if (-not (Test-Path $envFile)) {
    $envFile = Join-Path (Resolve-Path "$PSScriptRoot\..").Path 'backend/.env'
}
if (-not (Test-Path $envFile)) {
    throw "No .env.local or backend/.env found."
}

function Get-EnvVar {
    param([string]$Path, [string]$Key)
    Get-Content $Path | ForEach-Object {
        if ($_ -match "^\s*$Key\s*=\s*(.+?)\s*$") { return $Matches[1] }
    } | Select-Object -First 1
}

$email    = Get-EnvVar -Path $envFile -Key 'STRAPI_ADMIN_EMAIL'
$password = Get-EnvVar -Path $envFile -Key 'STRAPI_ADMIN_PASSWORD'
if (-not $email -or -not $password) {
    throw "STRAPI_ADMIN_EMAIL or STRAPI_ADMIN_PASSWORD missing in $envFile."
}

$base = 'http://localhost:1337'

# 1. Login -> admin JWT
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json -Compress
$loginResp = Invoke-RestMethod -Uri "$base/admin/login" `
    -Method POST -ContentType 'application/json' -Body $loginBody
$adminToken = $loginResp.data.token
if (-not $adminToken) { throw "Admin login did not return a token." }

$hdr = @{ Authorization = "Bearer $adminToken" }

# 2. Look for an existing "Order writer" token by listing
try {
    $existing = Invoke-RestMethod -Uri "$base/admin/api-tokens" -Headers $hdr `
        -Method GET -TimeoutSec 10
    $match = $existing.data | Where-Object { $_.name -eq $Name } | Select-Object -First 1
    if ($match) {
        Write-Host "Order writer token already exists (id $($match.id))."
        Write-Host "AccessKey (paste into STRAPI_API_TOKEN_WRITE):"
        Write-Host $match.accessKey
        exit 0
    }
} catch {
    # fall through to create
}

# 3. Create the token
$createBody = @{
    name        = $Name
    description = 'Phase 2: order create/update from Next.js server. Least-privilege: Order only.'
    type        = 'custom'
    lifespan    = $null
    permissions = @(
        'api::order.order.find'
        'api::order.order.findOne'
        'api::order.order.create'
        'api::order.order.update'
    )
} | ConvertTo-Json -Compress -Depth 5

try {
    $created = Invoke-RestMethod -Uri "$base/admin/api-tokens" -Headers $hdr `
        -Method POST -ContentType 'application/json' -Body $createBody
} catch {
    $msg = ''
    if ($_.Exception.Response) { $msg = ($_.ErrorDetails.Message | Out-String).Trim() }
    if ($msg -match 'Unknown permissions') {
        Write-Error 'Strapi rejected the permissions. The Order content type probably does not exist yet. Run Stage 1 Step 1.2a (write schema.json + boilerplate files, then run cd backend; npm run build; then restart Strapi) first.'
        exit 1
    }
    throw
}

if (-not $created.data.accessKey) { throw "Token creation succeeded but no accessKey in response: $($created | ConvertTo-Json -Depth 4)" }

Write-Host ""
Write-Host "OK -- created API token '$Name' (id $($created.data.id))."
Write-Host "Add this line to .env.local:"
Write-Host ""
Write-Host "STRAPI_API_TOKEN_WRITE=$($created.data.accessKey)"
Write-Host ""
Write-Host "Or append idempotently: ./scripts/strapi-write-env-local.ps1 -AddOrderToken"
