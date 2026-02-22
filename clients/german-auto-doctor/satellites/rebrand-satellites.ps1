# rebrand-satellites.ps1
# Rebrands both satellite sites in one pass:
#   Audi: "Quattro Authority" → "The Audi Auto Specialists"
#         canonical domain: audi.germanautodoctorsimivalley.com → theaudiautospecialistsimivalley.com
#   BMW:  "Roundel Report"   → "The BMW Auto Specialists"
#         canonical domain: bmw.germanautodoctorsimivalley.com  → thebmwautospecialistsimivalley.com

$base = "D:\Work\ContentStudio\clients\german-auto-doctor\satellites"

$sites = @(
    @{
        path       = "$base\audi"
        oldBrand   = "Quattro Authority"
        newBrand   = "The Audi Auto Specialists"
        oldDomain  = "audi.germanautodoctorsimivalley.com"
        newDomain  = "theaudiautospecialistsimivalley.com"
        oldCSSRef  = "qa.css"      # leave CSS filenames alone — no need to rename
    },
    @{
        path       = "$base\bmw"
        oldBrand   = "Roundel Report"
        newBrand   = "The BMW Auto Specialists"
        oldDomain  = "bmw.germanautodoctorsimivalley.com"
        newDomain  = "thebmwautospecialistsimivalley.com"
        oldCSSRef  = "rr.css"
    }
)

$totalFiles  = 0
$totalSwaps  = 0

foreach ($site in $sites) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $($site.oldBrand)  →  $($site.newBrand)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    $htmlFiles = Get-ChildItem -Path $site.path -Filter "*.html" -Recurse

    foreach ($file in $htmlFiles) {
        $content  = Get-Content $file.FullName -Raw -Encoding UTF8
        $original = $content

        # 1. Brand name (title tags, header, footer, copyright, meta descriptions)
        $content = $content -replace [regex]::Escape($site.oldBrand), $site.newBrand

        # 2. Canonical domain
        $content = $content -replace [regex]::Escape($site.oldDomain), $site.newDomain

        if ($content -ne $original) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            $swaps = ([regex]::Matches($original, [regex]::Escape($site.oldBrand))).Count `
                   + ([regex]::Matches($original, [regex]::Escape($site.oldDomain))).Count
            Write-Host "  ✅ $($file.FullName.Replace($site.path, ''))  ($swaps replacements)" -ForegroundColor Green
            $totalSwaps += $swaps
            $totalFiles++
        }
    }

    # Update vercel.json if it references the old domain
    $vj = "$($site.path)\vercel.json"
    if (Test-Path $vj) {
        $vjContent  = Get-Content $vj -Raw -Encoding UTF8
        $vjOriginal = $vjContent
        $vjContent  = $vjContent -replace [regex]::Escape($site.oldDomain), $site.newDomain
        $vjContent  = $vjContent -replace [regex]::Escape($site.oldBrand),  $site.newBrand
        if ($vjContent -ne $vjOriginal) {
            Set-Content -Path $vj -Value $vjContent -Encoding UTF8 -NoNewline
            Write-Host "  ✅ vercel.json updated" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "  New domain : $($site.newDomain)" -ForegroundColor Yellow
    Write-Host "  Pages updated: $($htmlFiles.Count)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host "  DONE — $totalFiles files modified, $totalSwaps string replacements" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify locally with serve.py" -ForegroundColor Gray
Write-Host "  2. cd audi then: vercel --prod" -ForegroundColor Gray
Write-Host "  3. cd bmw  then: vercel --prod" -ForegroundColor Gray
Write-Host "  4. Add custom domains in Vercel dashboard" -ForegroundColor Gray
Write-Host "     theaudiautospecialistsimivalley.com" -ForegroundColor Gray
Write-Host "     thebmwautospecialistsimivalley.com" -ForegroundColor Gray

