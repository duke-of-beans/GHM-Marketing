"D:\Program Files\Git\cmd\git.exe" add -A
"D:\Program Files\Git\cmd\git.exe" reset -- _commit.bat _tmp.txt _tmp2.txt
"D:\Program Files\Git\cmd\git.exe" status --short
"D:\Program Files\Git\cmd\git.exe" commit -m "docs: backlog sync — 8 new items, ARCH-002 infra fracture, sprint matrix through 33"
"D:\Program Files\Git\cmd\git.exe" push origin main
"D:\Program Files\Git\cmd\git.exe" log --oneline -3
