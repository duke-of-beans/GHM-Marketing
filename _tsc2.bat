@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard
npx tsc --noEmit > _tsc_out.txt 2>&1
echo EXIT:%ERRORLEVEL% >> _tsc_out.txt
