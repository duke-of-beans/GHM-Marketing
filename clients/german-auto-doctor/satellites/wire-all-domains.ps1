# ============================================================
# wire-all-domains.ps1
# GAD Satellite Network - Full Domain Wiring
# - Assigns custom domains to Vercel projects (new 5 only)
# - Writes GoDaddy DNS for ALL 7 domains (fixes Audi/BMW apex too)
# ============================================================

$VERCEL_TOKEN = "vca_4s2DDUsioHBeBiSG0vhSthomcJK8DyopCkTwQ8R83F3Iqn8eCf08O5vi"
$VERCEL_TEAM  = "team_3Bg0XHuxlkLx71xnTGn2G6PA"
$VERCEL_HDR   = @{ Authorization = "Bearer $VERCEL_TOKEN"; "Content-Type" = "application/json" }

# GoDaddy keys injected at runtime from vault (set below before running)
$GD_KEY    = $env:GD_KEY
$GD_SECRET = $env:GD_SECRET
$GD_HDR    = @{ Authorization = "sso-key ${GD_KEY}:${GD_SECRET}"; "Content-Type" = "application/json" }

# ---- Domain map ----
# new5: need Vercel assignment + GoDaddy DNS
# audi/bmw: Vercel already done, GoDaddy apex A record missing

$new5 = @(
    @{ project="gad-mercedes-satellite"; apex="mercedesautorepairsimivalley.com" },
    @{ project="gad-vw-satellite";       apex="vwrepairspecialistsimivalley.com" },
    @{ project="gad-porsche-satellite";  apex="porscheautospecialistsimivalley.com" },
    @{ project="gad-landrover-satellite";apex="landroverrepairspecialistsimivalley.com" },
    @{ project="gad-european-satellite"; apex="europeanautospecialistsimivalley.com" }
)

$allDomains = @(
    "theaudiautospecialistsimivalley.com",
    "thebmwautospecialistsimivalley.com",
    "mercedesautorepairsimivalley.com",
    "vwrepairspecialistsimivalley.com",
    "porscheautospecialistsimivalley.com",
    "landroverrepairspecialistsimivalley.com",
    "europeanautospecialistsimivalley.com"
)

# Vercel apex IP + www CNAME target
$VERCEL_IP    = "76.76.21.21"
$VERCEL_CNAME = "cname.vercel-dns.com"

function Add-VercelDomain($project, $domain) {
    $body = @{ name = $domain } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$project/domains?teamId=$VERCEL_TEAM" `
            -Headers $VERCEL_HDR -Method POST -Body $body
        Write-Host "  [Vercel] Added $domain -> $project" -ForegroundColor Green
    } catch {
        $msg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($msg.error.code -eq "domain_already_in_use" -or $msg.error.code -eq "domain_already_exists") {
            Write-Host "  [Vercel] $domain already assigned (OK)" -ForegroundColor Yellow
        } else {
            Write-Host "  [Vercel] FAIL $domain`: $($msg.error.message)" -ForegroundColor Red
        }
    }
}

function Set-GoDaddyDNS($domain) {
    # Set A record for apex (@)
    $aBody = '[{"type":"A","name":"@","data":"' + $VERCEL_IP + '","ttl":600}]'
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain/records/A/@" `
            -Headers $GD_HDR -Method PUT -Body $aBody | Out-Null
        Write-Host "  [GoDaddy] A @ -> $VERCEL_IP  ($domain)" -ForegroundColor Green
    } catch {
        Write-Host "  [GoDaddy] FAIL A record $domain`: $_" -ForegroundColor Red
    }

    # Set CNAME for www
    $cBody = '[{"type":"CNAME","name":"www","data":"' + $VERCEL_CNAME + '","ttl":600}]'
    try {
        Invoke-RestMethod -Uri "https://api.godaddy.com/v1/domains/$domain/records/CNAME/www" `
            -Headers $GD_HDR -Method PUT -Body $cBody | Out-Null
        Write-Host "  [GoDaddy] CNAME www -> $VERCEL_CNAME  ($domain)" -ForegroundColor Green
    } catch {
        Write-Host "  [GoDaddy] FAIL CNAME record $domain`: $_" -ForegroundColor Red
    }
}

# ---- MAIN ----

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  GAD Satellite Network - Domain Wiring      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if (-not $GD_KEY -or -not $GD_SECRET) {
    Write-Host "[ERROR] GoDaddy credentials not set. Run with GD_KEY and GD_SECRET env vars." -ForegroundColor Red
    exit 1
}

# STEP 1: Assign domains to new 5 Vercel projects
Write-Host ""
Write-Host "STEP 1 — Assigning custom domains in Vercel (new 5)..." -ForegroundColor Cyan
foreach ($sat in $new5) {
    Write-Host " $($sat.project):" -ForegroundColor White
    Add-VercelDomain $sat.project $sat.apex
    Add-VercelDomain $sat.project "www.$($sat.apex)"
}

# STEP 2: Write GoDaddy DNS for all 7
Write-Host ""
Write-Host "STEP 2 — Writing GoDaddy DNS for all 7 domains..." -ForegroundColor Cyan
foreach ($domain in $allDomains) {
    Write-Host " $domain" -ForegroundColor White
    Set-GoDaddyDNS $domain
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  DONE. DNS propagation: 5-30 minutes." -ForegroundColor Green
Write-Host "  Vercel will auto-provision SSL once DNS resolves." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
