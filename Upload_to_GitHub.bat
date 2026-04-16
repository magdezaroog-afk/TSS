@echo off
echo [TSS] Starting GitHub Upload Process...
echo.
echo Checking for Git...
git --version
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on this machine! 
    echo Please install Git from https://git-scm.com/ and try again.
    pause
    exit
)

git init
git add .
git commit -m "Initial Enterprise TSS Update"
git branch -M main
git remote add origin https://github.com/magdezaroog-afk/TSS.git
if %errorlevel% neq 0 (
    echo [NOTE] Remote origin might already exist, attempting to update it...
    git remote set-url origin https://github.com/magdezaroog-afk/TSS.git
)

echo.
echo [TSS] Attempting to push to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo [ERROR] Push failed. 
) else (
    echo [SUCCESS] Your system is now on GitHub!
)

echo.
echo Press any key to close this window.
pause
