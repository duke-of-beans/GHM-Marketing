"D:\Program Files\Git\cmd\git.exe" rm --cached _commit.bat _tmp.txt _tmp2.txt
echo _commit.bat >> .gitignore
echo _tmp.txt >> .gitignore
echo _tmp2.txt >> .gitignore
echo _git_out.txt >> .gitignore
echo _git_err.txt >> .gitignore
"D:\Program Files\Git\cmd\git.exe" add .gitignore
"D:\Program Files\Git\cmd\git.exe" commit -m "chore: remove temp files from tracking, update gitignore"
"D:\Program Files\Git\cmd\git.exe" push origin main
"D:\Program Files\Git\cmd\git.exe" log --oneline -3
