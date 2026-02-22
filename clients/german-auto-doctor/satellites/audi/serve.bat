@echo off
cd /d D:\Work\ContentStudio\clients\german-auto-doctor\satellites\audi
echo Serving from: %CD%
python -m http.server 9001
