@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard
"D:\Program Files\Git\cmd\git.exe" add src/app/(onboarding)/brochure/page.tsx src/lib/audit/template.ts src/lib/tenant/config.ts src/lib/wave/client.ts src/components/settings/WaveSettingsTab.tsx CHANGELOG.md STATUS.md
echo --- git status ---
"D:\Program Files\Git\cmd\git.exe" status --short
echo --- committing ---
"D:\Program Files\Git\cmd\git.exe" commit -m "feat: 29-B contract templates verified tenant-ready, feat: 29-C wave per-tenant API key scaffolding"
echo --- pushing ---
"D:\Program Files\Git\cmd\git.exe" push
echo --- done ---
"D:\Program Files\Git\cmd\git.exe" log --oneline -3
