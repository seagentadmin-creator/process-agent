# Process Agent 설치 가이드

## Release zip 구성 (src 코드 미포함)

```
process-agent-vX.X.X.zip
├── manifest.json          ← 빌드된 Extension
├── sidepanel/
│   └── index.html
├── sidepanel.js
├── background/
│   └── service-worker.js
├── vendor.js
└── installer/
    ├── setup.bat          ← 설치/업데이트 도구
    ├── pa-config.ini      ← Admin이 생성 후 배포
    └── README.md
```

## 설치 순서

### Admin (1회)

```
1. GitHub Release에서 zip 다운로드
2. zip 압축 해제 → 차단 해제 (우클릭→속성→차단 해제)
3. 브라우저에 Extension 등록
4. installer\setup.bat 더블클릭
5. [A] Admin 선택 → [1] 최초 설정
6. 화면 안내대로 Extension ID, GitHub 정보 입력
7. pa-config.ini 생성됨
8. 팀원에게 배포: pa-config.ini + GitHub Release URL
```

### User (각자 PC에서)

```
1. GitHub Release에서 zip 다운로드 + Admin에게 받은 pa-config.ini 준비
2. zip 압축 해제 → installer 폴더에 pa-config.ini 복사
3. installer\setup.bat 더블클릭
4. [U] User 선택 → [1] 최초 설치
5. 자동: 다운로드 → 설치 → Extension 등록 안내
6. 완료
```

### 업데이트

```
setup.bat → [U] User → [2] 업데이트
또는 Native Host 설치 시 자동 업데이트
```

## 다중 사용자/장소

```
각 사용자가 각자 PC에서 독립적으로 설치
서로 영향 없음
설정 데이터는 Confluence를 통해 공유
```
