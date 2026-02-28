@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard
git add -A
git commit -m "feat: 32-B DocuSign API routes - send envelope, status, webhook handler"
git push
del /f _commit_32b.bat
