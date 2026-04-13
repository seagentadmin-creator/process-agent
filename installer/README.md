# Process Agent — Installation Guide

## First Install (Admin)

```
1. setup.bat 실행 → [A] Admin
2. [1] Initial Setup
3. Chrome/Edge에서 Extension 등록 (이 폴더 선택)
4. GitHub URL 입력
5. 완료
```

## First Install (User)

```
1. Admin에게 설치 폴더 전달받기
2. setup.bat 실행 → [U] User → [1] First Install
3. Chrome/Edge에서 Extension 등록 (이 폴더 선택)
4. 완료
```

## Update

```
1. setup.bat 실행 → [U] User → [2] Update
   또는 [A] Admin → [2] Update
2. 최신 Release 자동 다운로드
3. 현재 폴더에 파일 덮어쓰기
4. Chrome에서 Extension Reload
5. 완료 — 설정은 Chrome sync에 저장되어 유지됨
```

## Settings Preservation

```
설정 저장: chrome.storage.sync (Chrome 계정 연동)
  → 같은 폴더에서 업데이트 → Extension ID 불변 → 설정 유지
  → Chrome 계정 로그인 시 → 다른 PC에서도 동기화

주의: 새 폴더에서 로드하면 ID 변경 → 설정 초기화
  → 반드시 같은 폴더에서 업데이트할 것
  → 만약 초기화된 경우 → ⚙️ 설정 → 📥 가져오기
```
