@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title Process Agent Setup
color 0A
cls

echo.
echo  ==================================================
echo    Process Agent - Setup
echo  ==================================================
echo.
echo    [A] Admin  - GitHub, Extension ID 설정
echo    [U] User   - 설치, 업데이트
echo.
set /p ROLE="  선택 (A/U): "

if /i "%ROLE%"=="a" goto :ADMIN_MENU
if /i "%ROLE%"=="u" goto :USER_MENU
echo  잘못된 선택입니다.
pause & exit /b 1

:: ==================================================
::  ADMIN MENU
:: ==================================================
:ADMIN_MENU
cls
echo.
echo  ==================================================
echo    Admin Menu
echo  ==================================================
echo.
echo    [1] 최초 설정
echo    [2] 상태 확인
echo    [3] Native Host 재설치
echo    [4] 제거
echo.
set /p AM="  선택 (1-4): "

if "%AM%"=="1" goto :ADMIN_SETUP
if "%AM%"=="2" goto :STATUS
if "%AM%"=="3" goto :ADMIN_NH
if "%AM%"=="4" goto :UNINSTALL
echo  잘못된 선택입니다.
pause & goto :ADMIN_MENU

:: --------------------------------------------------
::  Admin 최초 설정
:: --------------------------------------------------
:ADMIN_SETUP
cls
echo.
echo  --------------------------------------------------
echo    Step 1/3 : Extension 등록 확인
echo  --------------------------------------------------
echo.
echo  Extension을 브라우저에 먼저 등록해야 합니다.
echo.
echo  [Chrome]
echo    1. 주소창에 chrome://extensions 입력
echo    2. 우측 상단 "개발자 모드" 스위치 ON
echo    3. 좌측 상단 "압축해제된 확장 프로그램을 로드합니다" 클릭
echo    4. 다운로드한 폴더 선택
echo.
echo  [Edge]
echo    1. 주소창에 edge://extensions 입력
echo    2. 좌측 하단 "개발자 모드" 스위치 ON
echo    3. 상단 "압축을 푼 항목 로드" 클릭
echo    4. 다운로드한 폴더 선택
echo.
set /p REG="  이미 등록했나요? (Y/n): "
if /i "%REG%"=="n" (
    echo.
    echo  브라우저에서 등록 후 아무 키나 누르세요.
    start chrome://extensions
    pause >nul
)

:: Extension ID
cls
echo.
echo  --------------------------------------------------
echo    Step 2/3 : Extension ID 입력
echo  --------------------------------------------------
echo.
echo  chrome://extensions 에서 Process Agent 카드를 찾으세요.
echo  카드 하단에 ID가 표시되어 있습니다.
echo.
echo    예: abcdefghijklmnopqrstuvwxyzabcdef
echo.
echo  * "개발자 모드"가 ON이어야 ID가 보입니다.
echo.
set /p EXT_ID="  Extension ID: "
if "%EXT_ID%"=="" (
    echo  Extension ID를 입력해주세요.
    pause & goto :ADMIN_SETUP
)

:: GitHub 정보
cls
echo.
echo  --------------------------------------------------
echo    Step 3/3 : GitHub 정보
echo  --------------------------------------------------
echo.
echo  자동 업데이트를 위한 GitHub 정보입니다.
echo.
echo    URL 예시: https://github.com/owner-name/repo-name
echo.

set DEFAULT_OWNER=seagentadmin-creator
set DEFAULT_REPO=process-agent

set /p GH_OWNER="  GitHub Owner [%DEFAULT_OWNER%]: "
if "%GH_OWNER%"=="" set GH_OWNER=%DEFAULT_OWNER%

set /p GH_REPO="  GitHub Repo  [%DEFAULT_REPO%]: "
if "%GH_REPO%"=="" set GH_REPO=%DEFAULT_REPO%

:: 설정 저장
(
echo [ProcessAgent]
echo GITHUB_OWNER=%GH_OWNER%
echo GITHUB_REPO=%GH_REPO%
echo EXTENSION_ID=%EXT_ID%
) > "%~dp0pa-config.ini"

:: Native Host
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo  * Python 미설치 - 자동 업데이트 비활성화
    echo    https://www.python.org/downloads/
) else (
    set /p INH="  Native Host 설치 - 자동 업데이트 활성화 (Y/n): "
    if /i not "!INH!"=="n" call :DO_NATIVE_HOST
)

cls
echo.
echo  ==================================================
echo    Admin 설정 완료
echo  ==================================================
echo.
echo    Repository  : %GH_OWNER%/%GH_REPO%
echo    Extension ID: %EXT_ID%
echo.
echo    생성된 파일: pa-config.ini
echo.
echo    팀원에게 배포할 항목:
echo      1. GitHub Release URL
echo      2. pa-config.ini
echo.
echo    팀원은 Release에서 zip 다운로드 후
echo    setup.bat - [U] User 선택으로 설치합니다.
echo.
pause
goto :EOF

:: --------------------------------------------------
::  Admin Native Host 재설치
:: --------------------------------------------------
:ADMIN_NH
if not exist "%~dp0pa-config.ini" (
    echo.
    echo  pa-config.ini가 없습니다. [1] 최초 설정을 먼저 실행하세요.
    pause & goto :ADMIN_MENU
)
for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do set EXT_ID=%%b
call :DO_NATIVE_HOST
echo.
echo  Native Host 재설치 완료
pause
goto :EOF

:: ==================================================
::  USER MENU
:: ==================================================
:USER_MENU
cls
echo.
echo  ==================================================
echo    User Menu
echo  ==================================================
echo.
echo    [1] 최초 설치
echo    [2] 업데이트
echo    [3] 상태 확인
echo    [4] 제거
echo.
set /p UM="  선택 (1-4): "

if "%UM%"=="1" goto :USER_INSTALL
if "%UM%"=="2" goto :USER_UPDATE
if "%UM%"=="3" goto :STATUS
if "%UM%"=="4" goto :UNINSTALL
echo  잘못된 선택입니다.
pause & goto :USER_MENU

:: --------------------------------------------------
::  User 최초 설치
:: --------------------------------------------------
:USER_INSTALL
cls
echo.
echo  ==================================================
echo    Extension 최초 설치
echo  ==================================================
echo.

if not exist "%~dp0pa-config.ini" (
    echo  pa-config.ini 파일이 없습니다.
    echo  Admin에게 pa-config.ini 파일을 요청하세요.
    echo.
    pause & goto :EOF
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GH_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GH_REPO=%%b

echo  Repository: %GH_OWNER%/%GH_REPO%
echo.

set DEFAULT_DIR=C:\Extensions\process-agent
set /p INSTALL_DIR="  설치 경로 [%DEFAULT_DIR%]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%

(
echo [User]
echo INSTALL_DIR=%INSTALL_DIR%
) > "%~dp0pa-user.ini"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo.
echo  [1/3] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo.
echo  [2/3] 브라우저에 Extension 등록
echo.
echo  [Chrome]
echo    1. 주소창에 chrome://extensions 입력
echo    2. 우측 상단 "개발자 모드" ON
echo    3. "압축해제된 확장 프로그램을 로드합니다" 클릭
echo    4. 폴더 선택: %INSTALL_DIR%
echo.
echo  [Edge]
echo    1. 주소창에 edge://extensions 입력
echo    2. 좌측 하단 "개발자 모드" ON
echo    3. "압축을 푼 항목 로드" 클릭
echo    4. 폴더 선택: %INSTALL_DIR%
echo.

set /p OPEN_EXT="  Extensions 페이지 열기 (Y/n): "
if /i not "%OPEN_EXT%"=="n" start chrome://extensions

echo.
echo  Extension 등록 후 아무 키나 누르세요.
pause >nul

echo.
echo  [3/3] Native Host 설치
echo.

for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do set EXT_ID=%%b

python --version >nul 2>&1
if errorlevel 1 (
    echo  * Python 미설치 - 자동 업데이트 비활성화
    echo    수동 업데이트: setup.bat - [U] - [2]
) else (
    set /p INH="  자동 업데이트 설치 (Y/n): "
    if /i not "!INH!"=="n" call :DO_NATIVE_HOST
)

cls
echo.
echo  ==================================================
echo    설치 완료
echo  ==================================================
echo.
echo  브라우저에서 Process Agent 아이콘을 클릭하세요.
echo  Side Panel이 열리면 성공입니다.
echo.
pause
goto :EOF

:: --------------------------------------------------
::  User 업데이트
:: --------------------------------------------------
:USER_UPDATE
cls
echo.
echo  ==================================================
echo    업데이트
echo  ==================================================
echo.

if not exist "%~dp0pa-config.ini" (
    echo  pa-config.ini가 없습니다.
    echo  [1] 최초 설치를 먼저 실행하세요.
    pause & goto :EOF
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do set GH_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" "%~dp0pa-config.ini"') do set GH_REPO=%%b

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do set INSTALL_DIR=%%b
) else (
    set INSTALL_DIR=C:\Extensions\process-agent
)

echo  Repository : %GH_OWNER%/%GH_REPO%
echo  설치 경로  : %INSTALL_DIR%
echo.

echo  [1/2] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo.
echo  ==================================================
echo    업데이트 완료
echo  ==================================================
echo.
echo  chrome://extensions 에서
echo  Process Agent 새로고침 버튼을 클릭하세요.
echo.
set /p OE="  Extensions 페이지 열기 (Y/n): "
if /i not "%OE%"=="n" start chrome://extensions
pause
goto :EOF

:: ==================================================
::  공통: 상태 확인
:: ==================================================
:STATUS
cls
echo.
echo  ==================================================
echo    설치 상태 확인
echo  ==================================================
echo.

if exist "%~dp0pa-config.ini" (
    echo  [OK] 설정 파일 있음
    for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" "%~dp0pa-config.ini"') do echo       GitHub: %%b
    for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" "%~dp0pa-config.ini"') do echo       Extension ID: %%b
) else (
    echo  [--] 설정 파일 없음
)

if exist "%~dp0pa-user.ini" (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" "%~dp0pa-user.ini"') do echo  [OK] 설치 경로: %%b
) else (
    echo  [--] 사용자 설정 없음
)

if exist "%LOCALAPPDATA%\ProcessAgent\updater.py" (
    echo  [OK] Native Host 설치됨
) else (
    echo  [--] Native Host 미설치
)

reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  [OK] Registry Chrome 등록됨) else (echo  [--] Registry Chrome 미등록)

reg query "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (echo  [OK] Registry Edge 등록됨) else (echo  [--] Registry Edge 미등록)

python --version >nul 2>&1
if %errorlevel%==0 (echo  [OK] Python 설치됨) else (echo  [--] Python 미설치)

curl -s --connect-timeout 5 https://api.github.com >nul 2>&1
if %errorlevel%==0 (echo  [OK] GitHub 접속 가능) else (echo  [--] GitHub 접속 불가)

echo.
pause
goto :EOF

:: ==================================================
::  공통: 제거
:: ==================================================
:UNINSTALL
cls
echo.
echo  ==================================================
echo    Process Agent 제거
echo  ==================================================
echo.
echo  Native Host와 Registry를 제거합니다.
echo.
set /p CF="  계속 하시겠습니까? (y/N): "
if /i not "%CF%"=="y" (echo  취소됨. & pause & goto :EOF)

echo.
reg delete "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /f >nul 2>&1
echo  [OK] Registry 제거

if exist "%LOCALAPPDATA%\ProcessAgent" (
    rmdir /s /q "%LOCALAPPDATA%\ProcessAgent"
    echo  [OK] Native Host 제거
)

if exist "%~dp0pa-config.ini" del "%~dp0pa-config.ini"
if exist "%~dp0pa-user.ini" del "%~dp0pa-user.ini"
echo  [OK] 설정 파일 제거

echo.
echo  chrome://extensions 에서 Extension도 삭제하세요.
echo.
pause
goto :EOF

:: ==================================================
::  함수: 다운로드
:: ==================================================
:DO_DOWNLOAD
set TEMP_DIR=%TEMP%\pa-update
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

curl -s "https://api.github.com/repos/%GH_OWNER%/%GH_REPO%/releases/latest" > "%TEMP_DIR%\release.json" 2>nul
if errorlevel 1 (
    echo  GitHub 접속 실패. 네트워크를 확인하세요.
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
    echo  Release에 zip 파일이 없습니다.
    exit /b 1
)

curl -sL -o "%TEMP_DIR%\update.zip" "%ZIP_URL%"
powershell -Command "Expand-Archive -Force '%TEMP_DIR%\update.zip' '%INSTALL_DIR%'" 2>nul

del /q "%TEMP_DIR%\release.json" "%TEMP_DIR%\update.zip" 2>nul
echo  [OK] 다운로드 완료
exit /b 0

:: ==================================================
::  함수: Native Host 설치
:: ==================================================
:DO_NATIVE_HOST
set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if not exist "%NH_DIR%" mkdir "%NH_DIR%"

for /f "tokens=*" %%a in ('where python 2^>nul') do set PY_PATH=%%a

(
echo import sys,json,struct,os,zipfile,tempfile
echo from urllib.request import urlopen,Request
echo def read_msg():
echo     raw=sys.stdin.buffer.read(4^)
echo     if not raw:return None
echo     return json.loads(sys.stdin.buffer.read(struct.unpack('I',raw^)[0]^).decode(^)^)
echo def send_msg(m^):
echo     d=json.dumps(m^).encode(^);sys.stdout.buffer.write(struct.pack('I',len(d^)^)+d^);sys.stdout.buffer.flush(^)
echo def update(d,o,r^):
echo     try:
echo         with urlopen(Request(f'https://api.github.com/repos/{o}/{r}/releases/latest',headers={'User-Agent':'PA'}^),timeout=30^) as x:rel=json.loads(x.read(^)^)
echo         u=next((a['browser_download_url'] for a in rel.get('assets',[]^) if a['name'].endswith('.zip'^)^),None^)
echo         if not u:return{'success':False,'error':'No zip'}
echo         t=os.path.join(tempfile.gettempdir(^),'pa.zip'^)
echo         with urlopen(Request(u,headers={'User-Agent':'PA'}^),timeout=120^) as x:open(t,'wb'^).write(x.read(^)^)
echo         zipfile.ZipFile(t^).extractall(d^);os.remove(t^)
echo         return{'success':True,'version':rel['tag_name']}
echo     except Exception as e:return{'success':False,'error':str(e^)}
echo msg=read_msg(^)
echo if msg:
echo     if msg.get('action'^)=='update':send_msg(update(msg.get('installDir',''^),msg.get('owner',''^),msg.get('repo',''^)^)^)
echo     elif msg.get('action'^)=='check':
echo         try:
echo             with urlopen(Request(f"https://api.github.com/repos/{msg['owner']}/{msg['repo']}/releases/latest",headers={'User-Agent':'PA'}^),timeout=30^) as x:send_msg(json.loads(x.read(^)^)^)
echo         except Exception as e:send_msg({'error':str(e^)}^)
) > "%NH_DIR%\updater.py"

(
echo @echo off
echo "%PY_PATH%" "%NH_DIR%\updater.py"
) > "%NH_DIR%\run_updater.bat"

echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.chrome.json"
echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.edge.json"

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.chrome.json" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.edge.json" /f >nul 2>&1

echo  [OK] Native Host 설치 완료
exit /b 0

:ERROR
echo.
echo  오류가 발생했습니다. Admin에게 문의하세요.
pause
goto :EOF
