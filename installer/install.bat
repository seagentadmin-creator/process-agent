@echo off
chcp 65001 >nul
title Process Agent - 설치
color 0A

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║       Process Agent - 설치 / 업데이트              ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ─────────────────────────────────────────
:: 설정 파일 읽기
:: ─────────────────────────────────────────
if not exist pa-config.ini (
    echo  ❌ pa-config.ini 파일을 찾을 수 없습니다.
    echo     Admin에게 pa-config.ini 파일을 요청하세요.
    echo     또는 admin-setup.bat를 먼저 실행하세요.
    echo.
    pause & exit /b 1
)

for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_OWNER" pa-config.ini') do set GITHUB_OWNER=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "GITHUB_REPO" pa-config.ini') do set GITHUB_REPO=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "EXTENSION_ID" pa-config.ini') do set EXTENSION_ID=%%b
for /f "tokens=1,* delims==" %%a in ('findstr "DEFAULT_INSTALL_DIR" pa-config.ini') do set DEFAULT_DIR=%%b

echo  ✅ 설정 파일 로드 완료
echo     Repository: %GITHUB_OWNER%/%GITHUB_REPO%
echo.

:: ─────────────────────────────────────────
:: 설치 모드 선택
:: ─────────────────────────────────────────
echo  ─── 실행할 작업을 선택하세요 ───
echo.
echo    [1] 최초 설치 (Extension + Native Host)
echo    [2] 업데이트 (최신 버전 다운로드)
echo    [3] Native Host만 설치/재설치
echo    [4] 설치 상태 확인
echo.
set /p MODE="  선택 (1-4): "

if "%MODE%"=="1" goto :FULL_INSTALL
if "%MODE%"=="2" goto :UPDATE
if "%MODE%"=="3" goto :NATIVE_HOST
if "%MODE%"=="4" goto :CHECK_STATUS
echo  ❌ 잘못된 선택입니다.
pause & exit /b 1

:: ═════════════════════════════════════════
:: 최초 설치
:: ═════════════════════════════════════════
:FULL_INSTALL
echo.
echo  ─── 최초 설치 시작 ───
echo.

:: 설치 경로 확인
echo  Extension 설치 경로를 지정하세요.
echo  (Enter를 누르면 기본 경로 사용)
echo.
set /p INSTALL_DIR="  설치 경로 [%DEFAULT_DIR%]: "
if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%

:: 경로를 사용자별 설정으로 저장
(
echo [User]
echo INSTALL_DIR=%INSTALL_DIR%
) > pa-user.ini

echo.
echo  [1/4] 폴더 생성 중...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo  [2/4] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo  [3/4] Native Host 설치 중...
call :DO_NATIVE_HOST
if errorlevel 1 goto :ERROR

echo  [4/4] 완료!
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  설치 완료!                                       ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║                                                  ║
echo  ║  Extension 등록 방법:                              ║
echo  ║                                                  ║
echo  ║  1. Chrome: chrome://extensions                   ║
echo  ║     Edge:   edge://extensions                     ║
echo  ║                                                  ║
echo  ║  2. "개발자 모드" 토글 ON                           ║
echo  ║                                                  ║
echo  ║  3. "압축해제된 확장 프로그램을 로드합니다" 클릭       ║
echo  ║                                                  ║
echo  ║  4. 아래 폴더 선택:                                ║
echo  ║     %INSTALL_DIR%
echo  ║                                                  ║
echo  ║  ⚠️ 등록 후 Extension ID가 변경되었다면             ║
echo  ║     Admin에게 알려주세요.                           ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: Extensions 페이지 자동 열기
set /p OPEN_BROWSER="  Chrome Extensions 페이지를 열까요? (Y/n): "
if /i "%OPEN_BROWSER%"=="n" goto :DONE
start chrome://extensions
goto :DONE

:: ═════════════════════════════════════════
:: 업데이트
:: ═════════════════════════════════════════
:UPDATE
echo.
echo  ─── 업데이트 시작 ───
echo.

:: 사용자 설정 읽기
if exist pa-user.ini (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" pa-user.ini') do set INSTALL_DIR=%%b
) else (
    set INSTALL_DIR=%DEFAULT_DIR%
)

echo  설치 경로: %INSTALL_DIR%
echo.

if not exist "%INSTALL_DIR%" (
    echo  ❌ 설치 폴더가 없습니다. 최초 설치를 먼저 실행하세요.
    pause & exit /b 1
)

:: 현재 버전 확인
if exist "%INSTALL_DIR%\manifest.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr "version" "%INSTALL_DIR%\manifest.json"') do (
        set CURRENT_VER=%%~a
    )
    echo  현재 버전: %CURRENT_VER%
)

echo  [1/2] 최신 버전 다운로드 중...
call :DO_DOWNLOAD
if errorlevel 1 goto :ERROR

echo  [2/2] 완료!
echo.

:: 새 버전 확인
if exist "%INSTALL_DIR%\manifest.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr "version" "%INSTALL_DIR%\manifest.json"') do (
        set NEW_VER=%%~a
    )
    echo  ✅ 업데이트 완료: %CURRENT_VER% → %NEW_VER%
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  업데이트 적용 방법:                               ║
echo  ║                                                  ║
echo  ║  chrome://extensions 에서                         ║
echo  ║  Process Agent 카드의 🔄 (새로고침) 클릭           ║
echo  ║                                                  ║
echo  ║  ✅ Native Host가 설치되어 있으면                   ║
echo  ║     Extension이 자동으로 새로고침됩니다              ║
echo  ╚══════════════════════════════════════════════════╝
echo.

set /p OPEN_BROWSER="  Extensions 페이지를 열까요? (Y/n): "
if /i not "%OPEN_BROWSER%"=="n" start chrome://extensions
goto :DONE

:: ═════════════════════════════════════════
:: Native Host 설치
:: ═════════════════════════════════════════
:NATIVE_HOST
echo.
echo  ─── Native Host 설치 ───
echo.

if exist pa-user.ini (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" pa-user.ini') do set INSTALL_DIR=%%b
) else (
    set /p INSTALL_DIR="  Extension 설치 경로 [%DEFAULT_DIR%]: "
    if "%INSTALL_DIR%"=="" set INSTALL_DIR=%DEFAULT_DIR%
)

call :DO_NATIVE_HOST
if errorlevel 1 goto :ERROR

echo.
echo  ✅ Native Host 설치 완료
echo     Extension에서 자동 업데이트가 활성화됩니다.
echo.
goto :DONE

:: ═════════════════════════════════════════
:: 설치 상태 확인
:: ═════════════════════════════════════════
:CHECK_STATUS
echo.
echo  ─── 설치 상태 확인 ───
echo.

:: 설치 경로
if exist pa-user.ini (
    for /f "tokens=1,* delims==" %%a in ('findstr "INSTALL_DIR" pa-user.ini') do set INSTALL_DIR=%%b
) else (
    set INSTALL_DIR=%DEFAULT_DIR%
)

:: Extension 파일
if exist "%INSTALL_DIR%\manifest.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr "version" "%INSTALL_DIR%\manifest.json"') do set VER=%%~a
    echo  ✅ Extension: 설치됨 (v%VER%)
    echo     경로: %INSTALL_DIR%
) else (
    echo  ❌ Extension: 미설치
    echo     경로: %INSTALL_DIR%
)

:: Native Host
set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if exist "%NH_DIR%\updater.py" (
    echo  ✅ Native Host: 설치됨
    echo     경로: %NH_DIR%
) else (
    echo  ❌ Native Host: 미설치
)

:: Registry
reg query "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (
    echo  ✅ Registry (Chrome): 등록됨
) else (
    echo  ❌ Registry (Chrome): 미등록
)

reg query "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" >nul 2>&1
if %errorlevel%==0 (
    echo  ✅ Registry (Edge): 등록됨
) else (
    echo  ❌ Registry (Edge): 미등록
)

:: Python
python --version >nul 2>&1
if %errorlevel%==0 (
    echo  ✅ Python: 설치됨
) else (
    echo  ⚠️ Python: 미설치 (Native Host에 필요)
)

:: GitHub 연결
curl -s --connect-timeout 5 https://api.github.com >nul 2>&1
if %errorlevel%==0 (
    echo  ✅ GitHub: 접속 가능
) else (
    echo  ❌ GitHub: 접속 불가
)

echo.
goto :DONE

:: ═════════════════════════════════════════
:: 공통 함수: 다운로드
:: ═════════════════════════════════════════
:DO_DOWNLOAD
set TEMP_DIR=%TEMP%\pa-update
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: GitHub API로 최신 Release 확인
curl -s "https://api.github.com/repos/%GITHUB_OWNER%/%GITHUB_REPO%/releases/latest" > "%TEMP_DIR%\release.json" 2>nul
if errorlevel 1 (
    echo  ❌ GitHub 접속 실패. 네트워크를 확인하세요.
    exit /b 1
)

:: zip URL 추출
set ZIP_URL=
for /f "usebackq tokens=2 delims=: " %%a in (`findstr "browser_download_url" "%TEMP_DIR%\release.json"`) do (
    set ZIP_URL=%%~a
)

if "%ZIP_URL%"=="" (
    echo  ❌ 다운로드 가능한 Release를 찾을 수 없습니다.
    echo     GitHub Release에 zip 파일이 첨부되어 있는지 확인하세요.
    exit /b 1
)

:: 다운로드
echo     URL: %ZIP_URL%
curl -sL -o "%TEMP_DIR%\update.zip" "%ZIP_URL%"
if errorlevel 1 (
    echo  ❌ 다운로드 실패.
    exit /b 1
)

:: 압축 해제 (덮어쓰기)
echo     압축 해제 중...
powershell -Command "Expand-Archive -Force '%TEMP_DIR%\update.zip' '%INSTALL_DIR%'" 2>nul
if errorlevel 1 (
    echo  ❌ 압축 해제 실패.
    exit /b 1
)

:: 정리
del /q "%TEMP_DIR%\update.zip" "%TEMP_DIR%\release.json" 2>nul
echo     ✅ 다운로드 완료
exit /b 0

:: ═════════════════════════════════════════
:: 공통 함수: Native Host 설치
:: ═════════════════════════════════════════
:DO_NATIVE_HOST

:: Python 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ⚠️ Python이 설치되어 있지 않습니다.
    echo     Native Host는 Python이 필요합니다.
    echo.
    echo     Python 설치: https://www.python.org/downloads/
    echo     ✅ 설치 시 "Add Python to PATH" 반드시 체크
    echo.
    echo     Python 없이도 Extension은 사용 가능합니다.
    echo     자동 업데이트만 비활성화됩니다.
    echo     (수동 업데이트: install.bat에서 [2] 선택)
    echo.
    set /p SKIP_NH="  Native Host 설치를 건너뛸까요? (Y/n): "
    if /i not "%SKIP_NH%"=="n" exit /b 0
    echo  Python을 설치한 후 다시 시도하세요.
    exit /b 1
)

:: Native Host 폴더
set NH_DIR=%LOCALAPPDATA%\ProcessAgent
if not exist "%NH_DIR%" mkdir "%NH_DIR%"

:: Python 경로
for /f "tokens=*" %%a in ('where python') do set PYTHON_PATH=%%a

:: updater.py 생성
echo     updater.py 생성 중...
(
echo #!/usr/bin/env python3
echo """Process Agent Native Update Host"""
echo import sys, json, struct, os, zipfile, tempfile
echo try:
echo     from urllib.request import urlopen, Request
echo except ImportError:
echo     from urllib2 import urlopen, Request
echo.
echo CONFIG = {
echo     'github_owner': '%GITHUB_OWNER%',
echo     'github_repo': '%GITHUB_REPO%',
echo     'install_dir': r'%INSTALL_DIR%',
echo }
echo.
echo def read_message^(^):
echo     raw = sys.stdin.buffer.read^(4^)
echo     if not raw: return None
echo     length = struct.unpack^('I', raw^)[0]
echo     return json.loads^(sys.stdin.buffer.read^(length^).decode^('utf-8'^)^)
echo.
echo def send_message^(msg^):
echo     encoded = json.dumps^(msg^).encode^('utf-8'^)
echo     sys.stdout.buffer.write^(struct.pack^('I', len^(encoded^)^)^)
echo     sys.stdout.buffer.write^(encoded^)
echo     sys.stdout.buffer.flush^(^)
echo.
echo def get_latest_release^(owner, repo^):
echo     url = f'https://api.github.com/repos/{owner}/{repo}/releases/latest'
echo     req = Request^(url, headers={'User-Agent': 'ProcessAgent'}^)
echo     with urlopen^(req, timeout=30^) as r:
echo         return json.loads^(r.read^(^)^)
echo.
echo def download_and_extract^(zip_url, install_dir^):
echo     req = Request^(zip_url, headers={'User-Agent': 'ProcessAgent'}^)
echo     tmp = os.path.join^(tempfile.gettempdir^(^), 'pa-update.zip'^)
echo     with urlopen^(req, timeout=120^) as r:
echo         with open^(tmp, 'wb'^) as f:
echo             f.write^(r.read^(^)^)
echo     with zipfile.ZipFile^(tmp, 'r'^) as z:
echo         z.extractall^(install_dir^)
echo     os.remove^(tmp^)
echo.
echo def check_update^(^):
echo     try:
echo         release = get_latest_release^(CONFIG['github_owner'], CONFIG['github_repo']^)
echo         version = release['tag_name']
echo         zip_url = None
echo         for asset in release.get^('assets', []^):
echo             if asset['name'].endswith^('.zip'^):
echo                 zip_url = asset['browser_download_url']
echo                 break
echo         return {'version': version, 'zip_url': zip_url, 'notes': release.get^('body', ''^)}
echo     except Exception as e:
echo         return {'error': str^(e^)}
echo.
echo def do_update^(install_dir=None^):
echo     try:
echo         info = check_update^(^)
echo         if 'error' in info:
echo             return {'success': False, 'error': info['error']}
echo         if not info.get^('zip_url'^):
echo             return {'success': False, 'error': 'No zip asset found'}
echo         target = install_dir or CONFIG['install_dir']
echo         download_and_extract^(info['zip_url'], target^)
echo         return {'success': True, 'version': info['version']}
echo     except Exception as e:
echo         return {'success': False, 'error': str^(e^)}
echo.
echo if __name__ == '__main__':
echo     msg = read_message^(^)
echo     if not msg:
echo         sys.exit^(0^)
echo     action = msg.get^('action', ''^)
echo     if action == 'check':
echo         send_message^(check_update^(^)^)
echo     elif action == 'update':
echo         result = do_update^(msg.get^('installDir'^)^)
echo         send_message^(result^)
echo     else:
echo         send_message^({'error': f'Unknown action: {action}'}^)
) > "%NH_DIR%\updater.py"

:: Native Messaging Host manifest (Chrome)
echo     Chrome manifest 생성 중...
(
echo {
echo   "name": "com.process_agent.updater",
echo   "description": "Process Agent Auto Updater",
echo   "path": "%NH_DIR:\=\\%\\run_updater.bat",
echo   "type": "stdio",
echo   "allowed_origins": ["chrome-extension://%EXTENSION_ID%/"]
echo }
) > "%NH_DIR%\com.process_agent.updater.chrome.json"

:: Native Messaging Host manifest (Edge)
echo     Edge manifest 생성 중...
(
echo {
echo   "name": "com.process_agent.updater",
echo   "description": "Process Agent Auto Updater",
echo   "path": "%NH_DIR:\=\\%\\run_updater.bat",
echo   "type": "stdio",
echo   "allowed_origins": ["chrome-extension://%EXTENSION_ID%/"]
echo }
) > "%NH_DIR%\com.process_agent.updater.edge.json"

:: 실행용 bat (Python 호출)
echo     run_updater.bat 생성 중...
(
echo @echo off
echo "%PYTHON_PATH%" "%NH_DIR%\updater.py"
) > "%NH_DIR%\run_updater.bat"

:: Registry 등록 (Chrome)
echo     Chrome Registry 등록 중...
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\com.process_agent.updater.chrome.json" /f >nul 2>&1

:: Registry 등록 (Edge)
echo     Edge Registry 등록 중...
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.process_agent.updater" /ve /t REG_SZ /d "%NH_DIR%\com.process_agent.updater.edge.json" /f >nul 2>&1

echo     ✅ Native Host 설치 완료
echo        위치: %NH_DIR%
exit /b 0

:: ═════════════════════════════════════════
:: 에러/완료
:: ═════════════════════════════════════════
:ERROR
echo.
echo  ❌ 오류가 발생했습니다.
echo     위 메시지를 확인하고 Admin에게 문의하세요.
echo.
pause
exit /b 1

:DONE
echo.
pause
