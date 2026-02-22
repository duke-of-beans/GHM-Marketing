# ============================================================
# deploy-all-satellites.ps1
# GAD Satellite Network - Deploy All 5 New Satellites
# Usage: .\deploy-all-satellites.ps1            (preview)
#        .\deploy-all-satellites.ps1 -Prod      (production)
# ============================================================

param([switch]$Prod)

$BASE = "D:\Work\ContentStudio\clients\german-auto-doctor\satellites"

$satellites = @(
    @{ name="gad-mercedes-satellite"; dir="mercedes"; domain="mercedesautorepairsimivalley.com" },
    @{ name="gad-vw-satellite";       dir="vw";       domain="vwrepairspecialistsimivalley.com" },
    @{ name="gad-porsche-satellite";  dir="porsche";  domain="porscheautospecialistsimivalley.com" },
    @{ name="gad-landrover-satellite";dir="landrover";domain="landroverrepairspecialistsimivalley.com" },
    @{ name="gad-european-satellite"; dir="european"; domain="europeanautospecialistsimivalley.com" }
)

$VERCEL_CMD = if (Get-Command vercel -ErrorAction SilentlyContinue) { "vercel" } else { "npx vercel" }

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  GAD Satellite Network - Assembly Line Deploy   " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Mode: $(if ($Prod) { 'PRODUCTION' } else { 'PREVIEW' })" -ForegroundColor $(if ($Prod) { 'Magenta' } else { 'Yellow' })
Write-Host "  Satellites: $($satellites.Count)" -ForegroundColor White
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verify auth
$whoami = Invoke-Expression "$VERCEL_CMD whoami 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Not logged into Vercel. Run: vercel login" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Vercel auth: $whoami" -ForegroundColor Green
Write-Host ""

if ($Prod) {
    Write-Host "[WARN] PRODUCTION deploy will go live on all 5 domains." -ForegroundColor Yellow
    $confirm = Read-Host "Type YES to continue"
    if ($confirm -ne "YES") { Write-Host "[ABORT]"; exit 0 }
}

$results = @()

foreach ($sat in $satellites) {
    $dir = Join-Path $BASE $sat.dir
    Write-Host ""
    Write-Host "--- Deploying: $($sat.name) ---" -ForegroundColor Cyan

    if (-not (Test-Path "$dir\index.html")) {
        Write-Host "[SKIP] index.html missing in $($sat.dir)" -ForegroundColor Red
        $results += @{ name=$sat.name; status="FAILED - missing index.html" }
        continue
    }

    Set-Location $dir

    if ($Prod) {
        $output = Invoke-Expression "$VERCEL_CMD --prod --name $($sat.name) --yes 2>&1"
    } else {
        $output = Invoke-Expression "$VERCEL_CMD --name $($sat.name) --yes 2>&1"
    }

    if ($LASTEXITCODE -eq 0) {
        $url = ($output | Where-Object { $_ -match "https://" } | Select-Object -Last 1)
        Write-Host "[OK] $($sat.name) -> $url" -ForegroundColor Green
        $results += @{ name=$sat.name; domain=$sat.domain; status="OK"; url=$url }
    } else {
        Write-Host "[FAIL] $($sat.name)" -ForegroundColor Red
        $results += @{ name=$sat.name; status="FAILED"; output=$output }
    }
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  DEPLOY SUMMARY" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
foreach ($r in $results) {
    $color = if ($r.status -eq "OK") { "Green" } else { "Red" }
    Write-Host "  $($r.name): $($r.status)" -ForegroundColor $color
    if ($r.url) { Write-Host "    URL: $($r.url)" -ForegroundColor Gray }
    if ($r.domain) { Write-Host "    Domain: $($r.domain)" -ForegroundColor Gray }
}
Write-Host ""
Write-Host "  NEXT: Add domains in Vercel dashboard for each project." -ForegroundColor Yellow
Write-Host "  Add BOTH apex + www for each domain." -ForegroundColor Yellow
Write-Host "  GoDaddy CNAME www -> cname.vercel-dns.com" -ForegroundColor Yellow
Write-Host "  GoDaddy A record @ -> 76.76.21.21" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
