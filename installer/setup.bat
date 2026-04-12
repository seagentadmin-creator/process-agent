@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Process Agent Setup
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Process Agent - 설정 도구                 ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo    당신의 역할을 선택하세요:
echo.
echo    [A] Admin  (최초 환경 구성, GitHub 설정)
echo    [U] User   (Extension 설치/업데이트)
echo.
set /p ROLE="  선택 (A/U): "

if /i "%ROLE%"=="a" goto :ADMIN_MENU
if /i "%ROLE%"=="u" goto :USER_MENU
echo  잘못된 선택입니다.
pause & exit /b 1

:: ═══════════════════════════════════════════
::  ADMIN 메뉴
:: ═══════════════════════════════════════════
:ADMIN_MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Admin 메뉴                                ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo    [1] 최초 설정 (GitHub + Extension ID 등록)
echo    [2] 상태 확인
echo    [3] Native Host 재설치
echo    [4] 제거
echo.
set /p ADMIN_MODE="  선택 (1-4): "

if "%ADMIN_MODE%"=="1" goto :ADMIN_SETUP
if "%ADMIN_MODE%"=="2" goto :STATUS
if "%ADMIN_MODE%"=="3" goto :ADMIN_NH
if "%ADMIN_MODE%"=="4" goto :UNINSTALL
echo  잘못된 선택입니다.
pause & goto :ADMIN_MENU

:: ─── Admin 최초 설정 ───
:ADMIN_SETUP
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Admin 최초 설정                            ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  ─── Step 1/3: Extension 등록 확인 ───
echo.
echo  Extension을 브라우저에 먼저 등록해야 합니다.
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │ 등록 방법:                                       │
echo  │                                                 │
echo  │ 1. chrome://extensions 접속                      │
echo  │    (Edge: edge://extensions)                    │
echo  │                                                 │
echo  │ 2. "개발자 모드" 토글 ON                          │
echo  │                                                 │
echo  │ 3. "압축해제된 확장 프로그램을 로드합니다" 클릭      │
echo  │                                                 │
echo  │ 4. 이 프로젝트의 dist 폴더 선택                   │
echo  └─────────────────────────────────────────────────┘
echo.
set /p REGISTERED="  이미 등록했나요? (Y/n): "
if /i "%REGISTERED%"=="n" (
    start chrome://extensions
    echo.
    echo  브라우저에서 등록 후 Enter를 누르세요.
    pause
)

:: Extension ID
cls
echo.
echo  ─── Step 2/3: Extension ID 입력 ───
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │                                                 │
echo  │  chrome://extensions 에서                        │
echo  │  Process Agent 카드 하단의 ID를 복사하세요         │
echo  │                                                 │
echo  │  예: abcdefghijklmnopqrstuvwxyzabcdef            │
echo  │                                                 │
echo  │  ⚠ "개발자 모드"가 ON이어야 ID가 보입니다          │
echo  │                                                 │
echo  └─────────────────────────────────────────────────┘
echo.
set /p EXT_ID="  Extension ID: "
if "%EXT_ID%"=="" (
    echo  ❌ Extension ID를 입력해주세요.
    pause & goto :ADMIN_SETUP
)

:: GitHub 정보
cls
echo.
echo  ─── Step 3/3: GitHub 정보 ───
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │ GitHub URL 예시:                                 │
echo  │ https://github.com/owner-name/process-agent      │
echo  │                    ──────────  ─────────────     │
echo  │                    Owner       Repo              │
echo  └─────────────────────────────────────────────────┘
echo.

set DEFAULT_OWNER=seagentadmin-creator
set DEFAULT_REPO=process-agent

set /p GITHUB_OWNER="  GitHub Owner [%DEFAULT_OWNER%]: "
if "%GITHUB_OWNER%"=="" set GITHUB_OWNER=%DEFAULT_OWNER%

set /p GITHUB_REPO="  GitHub Repo  [%DEFAULT_REPO%]: "
if "%GITHUB_REPO%"=="" set GITHUB_REPO=%DEFAULT_REPO%

:: 설정 저장
(
echo [ProcessAgent]
echo GITHUB_OWNER=%GITHUB_OWNER%
echo GITHUB_REPO=%GITHUB_REPO%
echo EXTENSION_ID=%EXT_ID%
) > "%~dp0pa-config.ini"

echo.
echo  ✅ 설정 저장 완료 (pa-config.ini)
echo.

:: Native Host
python --version >nul 2>&1
if errorlevel 1 (
    echo  ⚠ Python 미설치 — 자동 업데이트 비활성화
    echo    https://www.python.org/downloads/
    echo    (설치 시 "Add Python to PATH" 체크)
) else (
    set /p INSTALL_NH="  Native Host 설치 (자동 업데이트)? (Y/n): "
    if /i not "!INSTALL_NH!"=="n" call :DO_NATIVE_HOST
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║  ✅ Admin 설정 완료!                               ║
echo  ║                                                  ║
echo  ║  팀원에게 배포할 항목:                              ║
echo  ║   1. GitHub Release URL                           ║
echo  ║   2. pa-config.ini (이 폴더에 생성됨)              ║
echo  ║                                                  ║
echo  ║  팀원은 Release에서 zip 다운로드 후                 ║
echo  ║  setup.bat → [U] User 선택으로 설치합니다           ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
goto :EOF

:: ─── Admin Native Host 재설치 ───
:ADMIN_NH
if not exist "%~dp0pa-config.ini" (
    echo  ❌ pa-config.ini가 없습니다. [1] 최초 설정을 먼저 실행하세요.
    pause & goto :ADMIN_MENU
)
for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do set EXT_ID=%%b
call :DO_NATIVE_HOST
echo.
echo  ✅ Native Host 재설치 완료
pause
goto :EOF

:: ═══════════════════════════════════════════
::  USER 메뉴
:: ═══════════════════════════════════════════
:USER_MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         User 메뉴                                 ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo    [1] 최초 설치
echo    [2] 업데이트
echo    [3] 상태 확인
echo    [4] 제거
echo.
set /p USER_MODE="  선택 (1-4): "

if "%USER_MODE%"=="1" goto :USER_INSTALL
if "%USER_MODE%"=="2" goto :USER_UPDATE
if "%USER_MODE%"=="3" goto :STATUS
if "%USER_MODE%"=="4" goto :UNINSTALL
echo  잘못된 선택입니다.
pause & goto :USER_MENU

:: ─── User 최초 설치 ───
:USER_INSTALL
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Extension 설치                             ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: pa-config.ini 확인
if not exist "%~dp0pa-config.ini" (
    echo  ❌ pa-config.ini 파일이 없습니다.
    echo     Admin에게 pa-config.ini 파일을 요청하세요.
    echo.
    pause & goto :EOF
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GITHUB_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GITHUB_REPO=%%b

echo  ✅ 설정 로드 완료
echo     Repository: %GITHUB_OWNER%/%GITHUB_REPO%
echo.

:: 설치 경로
set DEFAULT_DIR=C:\Extensions\process-agent
set /p INSTALL_DIR="  설치 경로 [%DEFAULT_DIR%]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%

:: 사용자 설정 저장
(
echo [User]
echo INSTALL_DIR=%INSTALL_DIR%
) > "%~dp0pa-user.ini"

:: 폴더 생성
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: 다운로드
echo.
echo  [1/3] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

:: Extension 등록 안내
echo.
echo  [2/3] 브라우저에 Extension 등록
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │                                                 │
echo  │ 1. chrome://extensions 접속                      │
echo  │    (Edge: edge://extensions)                    │
echo  │                                                 │
echo  │ 2. "개발자 모드" 토글 ON                          │
echo  │                                                 │
echo  │ 3. "압축해제된 확장 프로그램을 로드합니다" 클릭      │
echo  │                                                 │
echo  │ 4. 아래 폴더 선택:                                │
echo  │    %INSTALL_DIR%
echo  │                                                 │
echo  └─────────────────────────────────────────────────┘
echo.

set /p OPEN_EXT="  Extensions 페이지를 열까요? (Y/n): "
if /i not "%OPEN_EXT%"=="n" start chrome://extensions

echo.
echo  Extension 등록 후 Enter를 누르세요.
pause

:: Native Host (선택)
echo.
echo  [3/3] Native Host (자동 업데이트)
echo.

for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do set EXT_ID=%%b

python --version >nul 2>&1
if errorlevel 1 (
    echo  ⚠ Python 미설치 — 자동 업데이트 비활성화
    echo    수동 업데이트: setup.bat → [U] → [2]
) else (
    set /p INSTALL_NH="  자동 업데이트를 설치할까요? (Y/n): "
    if /i not "!INSTALL_NH!"=="n" call :DO_NATIVE_HOST
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║  ✅ 설치 완료!                                    ║
echo  ║                                                  ║
echo  ║  브라우저에서 Process Agent 아이콘 클릭            ║
echo  ║  → Side Panel이 열리면 성공!                       ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
goto :EOF

:: ─── User 업데이트 ───
:USER_UPDATE
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         업데이트                                   ║
echo  ╚══════════════════════════════════════════════════╝
echo.

if not exist "%~dp0pa-config.ini" (
    echo  ❌ pa-config.ini가 없습니다.
    echo     Admin에게 요청하거나 [1] 최초 설치를 실행하세요.
    pause & goto :EOF
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GITHUB_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GITHUB_REPO=%%b

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do set INSTALL_DIR=%%b
) else (
    set INSTALL_DIR=C:\Extensions\process-agent
)

echo  Repository: %GITHUB_OWNER%/%GITHUB_REPO%
echo  설치 경로: %INSTALL_DIR%
echo.

echo  [1/2] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo  [2/2] 완료!
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  ✅ 업데이트 완료!                                ║
echo  ║                                                  ║
echo  ║  chrome://extensions 에서                         ║
echo  ║  Process Agent 🔄 (새로고침) 클릭하세요            ║
echo  ╚══════════════════════════════════════════════════╝
echo.
set /p OPEN_EXT="  Extensions 페이지를 열까요? (Y/n): "
if /i not "%OPEN_EXT%"=="n" start chrome://extensions
pause
goto :EOF

:: ═══════════════════════════════════════════
::  공통: 상태 확인
:: ═══════════════════════════════════════════
:STATUS
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         설치 상태 확인                              ║
echo  ╚══════════════════════════════════════════════════╝
echo.

if exist "%~dp0pa-config.ini" (
    echo  ✅ 설정 파일: 있음
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do echo     GitHub: %%b
    for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do echo     Extension ID: %%b
) else (
    echo  ❌ 설정 파일: 없음
)

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do (
        set INSTALL_DIR=%%b
        echo  ✅ 설치 경로: %%b
    )
) else (
    echo  ⚠  사용자 설정: 없음
)

if exist "%LOCALAPPDATA%\ProcessAgent\updater.py" (
    echo  ✅ Native Host: 설치됨
) else (
    echo  ⚠  Native Host: 미설치
)

reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  ✅ Registry Chrome: 등록됨) else (echo  ⚠  Registry Chrome: 미등록)

reg query "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  ✅ Registry Edge: 등록됨) else (echo  ⚠  Registry Edge: 미등록)

python --version >nul 2>&1
if %errorlevel%==0 (echo  ✅ Python: 설치됨) else (echo  ⚠  Python: 미설치)

curl -s --connect-timeout 5 https://api.github.com >nul 2>&1
if %errorlevel%==0 (echo  ✅ GitHub: 접속 가능) else (echo  ❌ GitHub: 접속 불가)

echo.
pause
goto :EOF

:: ═══════════════════════════════════════════
::  공통: 제거
:: ═══════════════════════════════════════════
:UNINSTALL
cls
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Process Agent 제거                        ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  ⚠ Native Host + Registry를 제거합니다.
echo.
set /p CONFIRM="  계속? (y/N): "
if /i not "%CONFIRM%"=="y" (echo  취소됨. & pause & goto :EOF)

echo.
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
echo  ✅ Registry 제거

if exist "%LOCALAPPDATA%\ProcessAgent" (
    rmdir /s /q "%LOCALAPPDATA%\ProcessAgent"
    echo  ✅ Native Host 제거
)

if exist "%~dp0pa-config.ini" del "%~dp0pa-config.ini"
if exist "%~dp0pa-user.ini" del "%~dp0pa-user.ini"
echo  ✅ 설정 파일 제거

echo.
echo  chrome://extensions 에서 Extension도 삭제하세요.
echo.
pause
goto :EOF

:: ═══════════════════════════════════════════
::  함수: 다운로드
:: ═══════════════════════════════════════════
:DO_DOWNLOAD
set TEMP_DIR=%TEMP%\pa-update
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

curl -s "https://api.github.com/repos/%GITHUB_OWNER%/%GITHUB_REPO%/releases/latest" > "%TEMP_DIR%\release.json" 2>nul
if errorlevel 1 (
    echo  ❌ GitHub 접속 실패.
    exit /b 1
)

for /f "tokens=2 delims=:," %%a in ('findstr "tag_name" "%TEMP_DIR%\release.json"') do (
    set NEW_VER=%%~a
    echo  최신 버전: %%~a
)

set ZIP_URL=
for /f "usebackq tokens=2 delims=: " %%a in (`findstr "browser_download_url" "%TEMP_DIR%\release.json"`) do set ZIP_URL=%%~a
set ZIP_URL=https:%ZIP_URL%

if "%ZIP_URL%"=="https:" (
    echo  ❌ Release에 zip이 없습니다.
    exit /b 1
)

curl -sL -o "%TEMP_DIR%\update.zip" "%ZIP_URL%"
powershell -Command "Expand-Archive -Force '%TEMP_DIR%\update.zip' '%INSTALL_DIR%'" 2>nul

del /q "%TEMP_DIR%\release.json" "%TEMP_DIR%\update.zip" 2>nul
echo  ✅ 다운로드 완료
exit /b 0

:: ═══════════════════════════════════════════
::  함수: Native Host 설치
:: ═══════════════════════════════════════════
:DO_NATIVE_HOST
set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if not exist "%NH_DIR%" mkdir "%NH_DIR%"

for /f "tokens=*" %%a in ('where python 2^>nul') do set PYTHON_PATH=%%a

(
echo import sys,json,struct,os,zipfile,tempfile
echo from urllib.request import urlopen,Request
echo def read^(^):
echo     raw=sys.stdin.buffer.read^(4^)
echo     if not raw:return None
echo     return json.loads^(sys.stdin.buffer.read^(struct.unpack^('I',raw^)[0]^).decode^(^)^)
echo def send^(m^):
echo     d=json.dumps^(m^).encode^(^);sys.stdout.buffer.write^(struct.pack^('I',len^(d^)^)+d^);sys.stdout.buffer.flush^(^)
echo def update^(d,o,r^):
echo     try:
echo         with urlopen^(Request^(f'https://api.github.com/repos/{o}/{r}/releases/latest',headers={'User-Agent':'PA'}^),timeout=30^) as x:rel=json.loads^(x.read^(^)^)
echo         u=next^(^(a['browser_download_url'] for a in rel.get^('assets',[]^) if a['name'].endswith^('.zip'^)^),None^)
echo         if not u:return{'success':False,'error':'No zip'}
echo         t=os.path.join^(tempfile.gettempdir^(^),'pa.zip'^)
echo         with urlopen^(Request^(u,headers={'User-Agent':'PA'}^),timeout=120^) as x:open^(t,'wb'^).write^(x.read^(^)^)
echo         zipfile.ZipFile^(t^).extractall^(d^);os.remove^(t^)
echo         return{'success':True,'version':rel['tag_name']}
echo     except Exception as e:return{'success':False,'error':str^(e^)}
echo m=read^(^)
echo if m:
echo     if m.get^('action'^)=='update':send^(update^(m.get^('installDir',''^),m.get^('owner',''^),m.get^('repo',''^)^)^)
echo     elif m.get^('action'^)=='check':
echo         try:
echo             with urlopen^(Request^(f"https://api.github.com/repos/{m['owner']}/{m['repo']}/releases/latest",headers={'User-Agent':'PA'}^),timeout=30^) as x:send^(json.loads^(x.read^(^)^)^)
echo         except Exception as e:send^({'error':str^(e^)}^)
) > "%NH_DIR%\updater.py"

(echo @echo off
echo "%PYTHON_PATH%" "%NH_DIR%\updater.py") > "%NH_DIR%\run_updater.bat"

(echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]}) > "%NH_DIR%\manifest.chrome.json"
(echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]}) > "%NH_DIR%\manifest.edge.json"

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.chrome.json" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.edge.json" /f >nul 2>&1

echo  ✅ Native Host 설치 완료 (자동 업데이트 활성화)
exit /b 0

:ERROR
echo.
echo  ❌ 오류가 발생했습니다. Admin에게 문의하세요.
pause
goto :EOF
