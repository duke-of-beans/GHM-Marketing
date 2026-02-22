# ============================================================
# deploy-roundel-report.ps1
# Roundel Report BMW Satellite - Vercel Deployment Script
# Usage: .\deploy-roundel-report.ps1            (preview)
#        .\deploy-roundel-report.ps1 -Prod      (production)
# ============================================================

param(
    [switch]$Prod
)

$PROJECT_DIR = "D:\Work\ContentStudio\clients\german-auto-doctor\satellites\bmw"
$PROJECT_NAME = "roundel-report-bmw"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Roundel Report - Vercel Deploy Script " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify project directory
if (-not (Test-Path $PROJECT_DIR)) {
    Write-Host "[ERROR] Project directory not found: $PROJECT_DIR" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Project directory found" -ForegroundColor Green

# 2. Check required files
$required = @("index.html", "vercel.json", "assets\rr.css", "favicon.svg")
foreach ($file in $required) {
    $full = Join-Path $PROJECT_DIR $file
    if (-not (Test-Path $full)) {
        Write-Host "[ERROR] Required file missing: $file" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] Required files present" -ForegroundColor Green

# 3. Check Node.js
try {
    $nodeVer = & node --version 2>&1
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 4. Check / install Vercel CLI
# Resolve vercel — use npx as fallback if not yet on PATH after fresh install
$VERCEL_CMD = if (Get-Command vercel -ErrorAction SilentlyContinue) { "vercel" } else { "npx vercel" }
Write-Host "[INFO] Using vercel via: $VERCEL_CMD" -ForegroundColor Cyan

$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "[INFO] Vercel CLI not found. Installing globally..." -ForegroundColor Yellow
    & npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Vercel CLI installed" -ForegroundColor Green
} else {
    $vercelVer = & vercel --version 2>&1
    Write-Host "[OK] Vercel CLI $vercelVer" -ForegroundColor Green
}

# 5. Check login
Write-Host ""
Write-Host "[INFO] Checking Vercel auth..." -ForegroundColor Cyan
$whoami = Invoke-Expression "$VERCEL_CMD whoami 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Not logged in. Launching Vercel login..." -ForegroundColor Yellow
    Invoke-Expression "$VERCEL_CMD login"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Vercel login failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Logged in as: $whoami" -ForegroundColor Green
}

# 6. Move to project dir
Set-Location $PROJECT_DIR
Write-Host ""
Write-Host "[INFO] Working directory: $PROJECT_DIR" -ForegroundColor Cyan

# 7. Deploy
Write-Host ""
if ($Prod) {
    Write-Host "[DEPLOY] Deploying to PRODUCTION..." -ForegroundColor Magenta
    Write-Host "[WARN]   This will update your live domain." -ForegroundColor Yellow
    $confirm = Read-Host "         Type YES to continue"
    if ($confirm -ne "YES") {
        Write-Host "[ABORT] Cancelled." -ForegroundColor Yellow
        exit 0
    }
    Invoke-Expression "$VERCEL_CMD --prod --name $PROJECT_NAME --yes"
} else {
    Write-Host "[DEPLOY] Deploying PREVIEW..." -ForegroundColor Cyan
    Invoke-Expression "$VERCEL_CMD --name $PROJECT_NAME --yes"
}

# 8. Result
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deploy complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "  1. Review the preview URL above" -ForegroundColor White
    Write-Host "  2. Production deploy:" -ForegroundColor White
    Write-Host "     .\deploy-roundel-report.ps1 -Prod" -ForegroundColor Yellow
    Write-Host "  3. Add custom domain in Vercel dashboard:" -ForegroundColor White
    Write-Host "     bmw.germanautodoctorsimivalley.com" -ForegroundColor Yellow
    Write-Host "  4. DNS CNAME -> cname.vercel-dns.com" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Deploy failed. Check output above." -ForegroundColor Red
    exit 1
}
