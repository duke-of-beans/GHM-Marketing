@echo off
cd /d D:\Work\SEO-Services\ghm-dashboard
"D:\Program Files\Git\cmd\git.exe" diff --stat HEAD > _git_diff.txt 2>&1
type STATUS.md | more /P /C 6 > _status_top.txt 2>&1
