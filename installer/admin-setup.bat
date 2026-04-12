@echo off
chcp 65001 >nul
title Process Agent - Admin 설정
color 0B

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║       Process Agent - Admin 초기 설정             ║
echo  ║       팀 배포용 설정 파일을 생성합니다              ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────
:: Step 1: GitHub 정보
:: ─────────────────────────────────────────
echo  ─── Step 1/3: GitHub Repository 정보 ───
echo.
echo  GitHub Repository URL 예시:
echo    https://github.com/seagentadmin-creator/process-agent
echo.
set /p GITHUB_OWNER="  GitHub Owner (예: seagentadmin-creator): "
set /p GITHUB_REPO="  GitHub Repo  (예: process-agent): "

if "%GITHUB_OWNER%"=="" (
    echo  ❌ GitHub Owner를 입력해주세요.
    pause & exit /b 1
)
if "%GITHUB_REPO%"=="" (
    echo  ❌ GitHub Repo를 입력해주세요.
    pause & exit /b 1
)

echo.
echo  ✅ Repository: %GITHUB_OWNER%/%GITHUB_REPO%
echo.

:: ─────────────────────────────────────────
:: Step 2: Extension ID
:: ─────────────────────────────────────────
echo  ─── Step 2/3: Extension ID ───
echo.
echo  Extension ID 확인 방법:
echo    1. chrome://extensions 접속
echo    2. Process Agent 카드의 ID 복사
echo       (예: abcdefghijklmnopqrstuvwxyzabcdef)
echo.
echo  ⚠️  아직 Extension을 설치하지 않았다면
echo      설치 후 이 스크립트를 다시 실행하세요.
echo.
set /p EXT_ID="  Extension ID: "

if "%EXT_ID%"=="" (
    echo  ❌ Extension ID를 입력해주세요.
    pause & exit /b 1
)

echo.
echo  ✅ Extension ID: %EXT_ID%
echo.

:: ─────────────────────────────────────────
:: Step 3: 기본 설치 경로
:: ─────────────────────────────────────────
echo  ─── Step 3/3: 기본 설치 경로 ───
echo.
echo  사용자들이 Extension을 설치할 기본 경로를 지정하세요.
echo  사용자별로 설치 시 변경 가능합니다.
echo.
set DEFAULT_DIR=C:\Extensions\process-agent
set /p INSTALL_DIR="  설치 경로 (Enter=기본값 %DEFAULT_DIR%): "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%

echo.
echo  ✅ 기본 설치 경로: %INSTALL_DIR%
echo.

:: ─────────────────────────────────────────
:: 설정 파일 생성
:: ─────────────────────────────────────────
echo  ─── 설정 파일 생성 중... ───
echo.

:: pa-config.ini 생성
(
echo [ProcessAgent]
echo GITHUB_OWNER=%GITHUB_OWNER%
echo GITHUB_REPO=%GITHUB_REPO%
echo EXTENSION_ID=%EXT_ID%
echo DEFAULT_INSTALL_DIR=%INSTALL_DIR%
) > pa-config.ini

echo  ✅ pa-config.ini 생성 완료
echo.

:: ─────────────────────────────────────────
:: 확인
:: ─────────────────────────────────────────
echo  ╔══════════════════════════════════════════════════╗
echo  ║  설정 완료!                                       ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║                                                  ║
echo  ║  Repository: %GITHUB_OWNER%/%GITHUB_REPO%
echo  ║  Extension:  %EXT_ID%
echo  ║  설치 경로:  %INSTALL_DIR%
echo  ║                                                  ║
echo  ║  생성된 파일: pa-config.ini                        ║
echo  ║                                                  ║
echo  ║  다음 단계:                                       ║
echo  ║  1. pa-config.ini를 팀에 배포하세요                ║
echo  ║  2. 팀원은 install.bat를 실행하면 됩니다            ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
