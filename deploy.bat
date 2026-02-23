@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard

echo.
echo ============================================================
echo  SYNC PROTOCOL — DOCS FIRST, GIT SECOND
echo ============================================================
echo.
echo  Before this deploy runs, confirm:
echo.
echo  [ ] 1. CHANGELOG.md — row added for each item shipped
echo  [ ] 2. BACKLOG.md   — item deleted (no checkmarks, just gone)
echo  [ ] 3. STATUS.md    — "Last Updated" line updated
echo.
echo  If you haven't done these, Ctrl+C now. Docs first.
echo.
echo ============================================================
echo.

set /p MSG="Commit message: "

git add -A
git commit -m "%MSG%"
npx vercel deploy --prod --yes

echo.
echo Done. Deployed to production.
