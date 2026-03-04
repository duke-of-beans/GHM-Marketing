@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard
git add -A
git commit -m "Sprints 38-40: Affiliate vertical complete - 7 Prisma models, 15 API routes, 7 UI surfaces, Ridgeline demo, CSV import. Vertical 2 demo-ready."
git log --oneline -1
del "%~f0"