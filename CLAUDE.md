# Process Agent — Chrome/Edge Extension

## 프로젝트 개요
Jira DC + Confluence DC + Structure Plugin 연동 AI 기반 과제 관리 Extension
Manifest V3, Side Panel + Pop-out 방식

## Commands
- `npm install` — 의존성 설치
- `npm test` — Jest 테스트 (117건)
- `npx webpack --mode production` — 프로덕션 빌드 (dist/)
- `npx jest --coverage` — 커버리지 리포트

## Architecture
```
src/
├── manifest.json           — MV3 Extension 매니페스트
├── background/             — Service Worker (알람, 사이드패널, 업데이트)
├── core/
│   ├── types/index.ts      — 40+ 인터페이스
│   ├── api/                — BaseClient(재시도), RequestQueue, JiraClient, ConfluenceClient
│   ├── cache/              — 3계층 캐시 (L1 메모리 → L2 chrome.storage → L3 Confluence)
│   └── updater/            — Native Host 자동 업데이트
├── domain/                 — 비즈니스 로직 (guide-matcher, task-filter, field-resolver 등)
├── shared/
│   ├── components/         — Header, Tabs, SplitPane, Modal, Toast, EmptyState, StatusBadge 등
│   ├── constants/          — app-config, workflow, jira-link, field-types
│   └── hooks/              — useTheme, useAIEnabled, useKeyboardShortcut 등
├── features/
│   ├── dashboard/          — SLM/일반 대시보드 (숫자 클릭→상세, 지표)
│   ├── task-list/          — 과제 목록 (그룹 접힘, 참조/재사용, Process Tailoring)
│   ├── hierarchy/          — 통합 Structure (Tree/Table, Status 필터, Close 제외, Issue 생성)
│   ├── sprint/             — Sprint 칸반 (드래그, Status 변경)
│   ├── voc/                — VOC 3단계 Wizard
│   ├── ai-chat/            — AI 채팅 (ON/OFF)
│   └── common/             — GlobalSearch, IssueCreate
├── sidepanel/              — App.tsx (메인 레이아웃, 모든 모달)
└── icons/                  — 큐브 아이콘 (16/32/48/128px)
```

## Key Design Decisions
- Data Pipeline: Settings → chrome.storage → DataService(싱글톤) → JiraClient/ConfluenceClient → Feature Views (Mock 없음)
- 연결 안됨 → Mock 데이터 + 안내 배너, 연결됨 → Jira 실시간 데이터 + 캐시
- Admin 비밀번호: P@ssw0rd## (하드코딩, Phase 2 → Confluence)
- SLM Workflow: 요구사항→분석→설계→구현→테스트→검증→완료
- General Workflow: To Do→In Progress→Review→Done
- 설정 저장: Confluence SLM-CONFIG 스페이스 JSON 코드블록
- Process Tailoring: Issue Type별 자동 Tailoring (Stages 방식)
- Release: dist/ + installer/ 만 zip 배포 (src 미포함)
- 업데이트: setup.bat → Update (같은 폴더 덮어쓰기, Extension ID 불변)

## Conventions
- TypeScript strict: false (chrome 타입 호환)
- tsconfig: ignoreDeprecations "6.0", types ["chrome", "jest"]
- Issue Key는 모든 View에서 클릭 → Jira 링크 열기 (openJiraIssue)
- 이모티콘: 기본 유니코드 이모지 사용 (커스텀 아이콘 사용 안 함)
- 그룹핑: 기본 접힘 상태, 클릭으로 펼침

## Testing
- Unit: domain/ 79건, integration: api+cache 38건 (총 117건)
- tsconfig.test.json: 테스트 전용 설정
- jest.config.js: ts-jest, moduleNameMapper 경로 별칭

## 설계 문서
- docs/master-design.md — 전체 기능 목록, 데이터 모델, 테스트 전략, 구현 현황

## Installer
- installer/setup.bat — Admin/User 분리, Extension ID 자동감지, 영문 전용
- installer/updater.py — Native Host Python (별도 파일, bat에서 생성 안 함)

## Git
- GitHub Actions: .github/workflows/release.yml (v* 태그 → 빌드 → Release)
- 회사 GitHub: origin (주 작업), 외부: home (미러링, 집에서만 동기화)
