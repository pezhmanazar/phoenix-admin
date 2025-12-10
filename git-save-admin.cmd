@echo off
setlocal enabledelayedexpansion

REM دریافت پیام کامیت بدون باگ در فضای ویندوز
set MSG=%*
if "%MSG%"=="" (
    set MSG=chore: quick save (phoenix-admin)
)

echo.
echo [git-save-admin] Adding all changes...
git add -A

echo.
echo [git-save-admin] Committing with message: "!MSG!"
git commit -m "!MSG!"

if errorlevel 1 (
    echo.
    echo [git-save-admin] Commit failed (احتمالا چیزی برای کامیت نیست)
    goto end
)

echo.
echo [git-save-admin] Pushing to origin/main...
git push origin main

:end
echo.
echo [git-save-admin] Done.
exit /b