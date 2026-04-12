@echo off
chcp 65001 >nul
title Process Agent - 제거
color 0C

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║       Process Agent - 제거                        ║
echo  ╚══════════════════════════════════════════════════╝
echo.

echo  ⚠️ Process Agent를 완전히 제거합니다.
echo     Extension 파일, Native Host, Registry가 삭제됩니다.
echo.
set /p CONFIRM="  계속하시겠습니까? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo  취소되었습니다.
    pause & exit /b 0
)

echo.

:: 사용자 설정 읽기
if exist pa-user.ini (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" pa-user.ini') do set INSTALL_DIR=%%b
) else (
    if exist pa-config.ini (
        for /f "tokens=1,* delims==" %%a in ('findstr "DEFAULT_INSTALL_DIR" pa-config.ini') do set INSTALL_DIR=%%b
    ) else (
        set INSTALL_DIR=C:\Extensions\process-agent
    )
)

:: 1. Native Host Registry 제거
echo  [1/4] Registry 제거 중...
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
echo     ✅ Registry 제거 완료

:: 2. Native Host 파일 제거
echo  [2/4] Native Host 제거 중...
set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if exist "%NH_DIR%" (
    rmdir /s /q "%NH_DIR%"
    echo     ✅ Native Host 제거 완료
) else (
    echo     (설치되어 있지 않음)
)

:: 3. Extension 파일 제거
echo  [3/4] Extension 파일 제거 중...
if exist "%INSTALL_DIR%" (
    echo     경로: %INSTALL_DIR%
    rmdir /s /q "%INSTALL_DIR%"
    echo     ✅ Extension 파일 제거 완료
) else (
    echo     (설치되어 있지 않음)
)

:: 4. 로컬 설정 제거
echo  [4/4] 로컬 설정 제거 중...
if exist pa-user.ini del pa-user.ini
echo     ✅ 로컬 설정 제거 완료

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  제거 완료                                        ║
echo  ║                                                  ║
echo  ║  chrome://extensions 에서도                       ║
echo  ║  Process Agent를 삭제해주세요.                     ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
