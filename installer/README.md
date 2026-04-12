# Process Agent — 설치 가이드

## 배포 순서

### Admin (1회)

```
1. admin-setup.bat 더블클릭
2. GitHub Owner, Repo, Extension ID, 기본 경로 입력
3. pa-config.ini 생성됨
4. install.bat + pa-config.ini를 팀에 배포
```

### 사용자 (최초 1회)

```
1. Admin에게 받은 폴더 (install.bat + pa-config.ini) 준비
2. install.bat 더블클릭
3. [1] 최초 설치 선택
4. 설치 경로 확인 (Enter = 기본값)
5. 자동 진행: 다운로드 → 설치 → Native Host 등록
6. chrome://extensions에서 Extension 로드
```

### 사용자 (업데이트)

```
방법 A: 자동 (Native Host 설치됨)
  → Extension이 자동으로 업데이트 체크
  → 새 버전 감지 시 자동 다운로드 + 적용 + 재시작

방법 B: 수동 (Native Host 미설치)
  → install.bat 더블클릭 → [2] 업데이트 선택
  → chrome://extensions에서 🔄 클릭
```

## 파일 구성

| 파일 | 용도 | 배포 대상 |
|------|------|----------|
| admin-setup.bat | Admin 설정 생성 | Admin만 |
| install.bat | 설치/업데이트/상태확인 | 전체 팀 |
| pa-config.ini | 팀 공통 설정 (자동 생성) | 전체 팀 |
| pa-user.ini | 사용자별 설정 (자동 생성) | 자동 생성 |
| uninstall.bat | 완전 제거 | 전체 팀 |

## Native Host 요구사항

- Python 3.8+ (https://python.org)
- 설치 시 "Add Python to PATH" 체크 필수
- Python 없어도 Extension 사용 가능 (자동 업데이트만 비활성화)

## 문제 해결

```
install.bat → [4] 설치 상태 확인
→ Extension, Native Host, Registry, Python, GitHub 상태 표시
```
