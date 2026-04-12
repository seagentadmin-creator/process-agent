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
echo    [A] Admin  - GitHub 설정, 팀 배포용
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
echo    [1] 최초 설정 (GitHub 정보 등록)
echo    [2] 상태 확인
echo    [3] Native Host 재설치
echo    [4] 제거
echo.
set /p AM="  선택 (1-4): "

if "%AM%"=="1" goto :ADMIN_SETUP
if "%AM%"=="2" goto :STATUS
if "%AM%"=="3" goto :INSTALL_NH
if "%AM%"=="4" goto :UNINSTALL
echo  잘못된 선택입니다.
pause & goto :ADMIN_MENU

:: --------------------------------------------------
::  Admin 최초 설정 (Extension ID 불필요)
:: --------------------------------------------------
:ADMIN_SETUP
cls
echo.
echo  ==================================================
echo    Admin 최초 설정
echo  ==================================================
echo.
echo  Extension 등록을 먼저 해야 합니다.
echo.
echo  [Chrome]
echo    1. 주소창에 chrome://extensions 입력
echo    2. 우측 상단 "개발자 모드" ON
echo    3. "압축해제된 확장 프로그램을 로드합니다" 클릭
echo    4. 다운로드한 폴더 선택
echo.
echo  [Edge]
echo    1. 주소창에 edge://extensions 입력
echo    2. 좌측 하단 "개발자 모드" ON
echo    3. "압축을 푼 항목 로드" 클릭
echo    4. 다운로드한 폴더 선택
echo.
set /p REG="  이미 등록했나요? (Y/n): "
if /i "%REG%"=="n" (
    start chrome://extensions
    echo.
    echo  등록 후 아무 키나 누르세요.
    pause >nul
)

:: GitHub 정보
cls
echo.
echo  ==================================================
echo    GitHub 정보 설정
echo  ==================================================
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

:: 설정 저장 (Extension ID는 포함하지 않음)
(
echo [ProcessAgent]
echo GITHUB_OWNER=%GH_OWNER%
echo GITHUB_REPO=%GH_REPO%
) > "%~dp0pa-config.ini"

:: Native Host 설치
echo.
call :INSTALL_NH

cls
echo.
echo  ==================================================
echo    Admin 설정 완료
echo  ==================================================
echo.
echo    Repository: %GH_OWNER%/%GH_REPO%
echo.
echo    생성된 파일: pa-config.ini
echo.
echo    팀원에게 배포:
echo      1. GitHub Release URL
echo      2. pa-config.ini 파일
echo.
echo    팀원은 Release zip 다운로드 후
echo    Setup 도구에서 [U] User 로 설치합니다.
echo.
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
echo  [3/3] Native Host 설치 (자동 업데이트)
call :INSTALL_NH

cls
echo.
echo  ==================================================
echo    설치 완료
echo  ==================================================
echo.
echo  브라우저에서 Process Agent 아이콘을 클릭하세요.
echo  Side Panel이 열리면 성공입니다.
echo.
echo  --------------------------------------------------
echo    업데이트 방법
echo  --------------------------------------------------
echo.
echo    [자동] Native Host 설치됨
echo      - Extension이 자동으로 업데이트합니다.
echo.
echo    [수동] Native Host 미설치
echo      - Setup 도구에서 [U] - [2] 업데이트 선택
echo      - chrome://extensions 에서 새로고침 클릭
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
::  Native Host 설치 (Extension ID 자동 감지)
:: ==================================================
:INSTALL_NH
echo.
echo  --------------------------------------------------
echo    Native Host 설치 (자동 업데이트)
echo  --------------------------------------------------
echo.

:: Python 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo  * Python이 설치되어 있지 않습니다.
    echo.
    echo  --------------------------------------------------
    echo    수동 업데이트 방법 안내
    echo  --------------------------------------------------
    echo.
    echo    새 버전이 나오면 아래 방법으로 업데이트하세요:
    echo.
    echo    1. Setup 도구 실행
    echo    2. [U] User 선택
    echo    3. [2] 업데이트 선택
    echo    4. 자동 다운로드 완료 후
    echo       chrome://extensions 에서 새로고침 클릭
    echo.
    echo    Python을 설치하면 자동 업데이트가 가능합니다.
    echo    https://www.python.org/downloads/
    echo    (설치 시 "Add Python to PATH" 반드시 체크)
    echo.
    set /p SKIP_NH="  Native Host를 건너뛸까요? (Y/n): "
    if /i not "!SKIP_NH!"=="n" exit /b 0
    echo  Python 설치 후 다시 시도하세요.
    exit /b 0
)

:: Extension ID 자동 감지
echo  Extension ID 자동 감지 중...
set EXT_ID=

:: Chrome Preferences 파일에서 Process Agent 검색
set PREFS_FILE=%LOCALAPPDATA%\Google\Chrome\User Data\Default\Preferences
if exist "%PREFS_FILE%" (
    for /f "tokens=*" %%a in ('powershell -Command "try { $j = Get-Content '%PREFS_FILE%' -Raw | ConvertFrom-Json; $j.extensions.settings.PSObject.Properties | ForEach-Object { if ($_.Value.manifest.name -eq 'Process Agent') { $_.Name } } } catch {}" 2^>nul') do set EXT_ID=%%a
)

:: Edge도 시도
if "%EXT_ID%"=="" (
    set PREFS_FILE=%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Preferences
    if exist "!PREFS_FILE!" (
        for /f "tokens=*" %%a in ('powershell -Command "try { $j = Get-Content '!PREFS_FILE!' -Raw | ConvertFrom-Json; $j.extensions.settings.PSObject.Properties | ForEach-Object { if ($_.Value.manifest.name -eq 'Process Agent') { $_.Name } } } catch {}" 2^>nul') do set EXT_ID=%%a
    )
)

:: 자동 감지 결과
if not "%EXT_ID%"=="" (
    echo  [OK] 자동 감지 성공: %EXT_ID%
    echo.
) else (
    echo  * 자동 감지 실패 - 수동 입력이 필요합니다.
    echo.
    echo  chrome://extensions 에서 Process Agent 카드의
    echo  ID를 복사하세요. (개발자 모드 ON 필요)
    echo.
    set /p EXT_ID="  Extension ID: "
    if "!EXT_ID!"=="" (
        echo  Extension ID가 없어 Native Host를 건너뜁니다.
        echo  수동 업데이트: Setup 도구에서 [2] 선택
        exit /b 0
    )
)

:: Native Host 파일 생성
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

:: Chrome + Edge 양쪽 등록
echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.chrome.json"
echo {"name":"com.process_agent.updater","description":"Process Agent Updater","path":"%NH_DIR:\=\\%\\run_updater.bat","type":"stdio","allowed_origins":["chrome-extension://%EXT_ID%/"]} > "%NH_DIR%\manifest.edge.json"

reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.chrome.json" /f >nul 2>&1
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\manifest.edge.json" /f >nul 2>&1

echo  [OK] Native Host 설치 완료 (자동 업데이트 활성화)
exit /b 0

:: ==================================================
::  상태 확인
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
::  제거
:: ==================================================
:UNINSTALL
cls
echo.
echo  ==================================================
echo    Process Agent 제거
echo  ==================================================
echo.
echo  Native Host + Registry를 제거합니다.
echo.
set /p CF="  계속? (y/N): "
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
::  다운로드 함수
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

:ERROR
echo.
echo  오류가 발생했습니다. Admin에게 문의하세요.
pause
goto :EOF
