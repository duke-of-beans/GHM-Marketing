@echo off
cd /d "D:\Work\SEO-Services\ghm-dashboard"
"d:\Program Files\Git\cmd\git.exe" status --short
echo ---LOG---
"d:\Program Files\Git\cmd\git.exe" log --oneline -5
