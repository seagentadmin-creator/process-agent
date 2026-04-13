# Process Agent — 마스터 설계서 v1.0

## 1. 기능 목록 및 구현 현황

### 1.1 Core Layer (✅ 구현 완료)

| ID | 기능 | 파일 | 테스트 |
|----|------|------|--------|
| C-01 | 타입 정의 (40+ interfaces) | core/types/index.ts | - |
| C-02 | HTTP Client (재시도/타임아웃) | core/api/base-client.ts | ✅ 8건 |
| C-03 | Request Queue (스로틀링) | core/api/request-queue.ts | ✅ 5건 |
| C-04 | Jira Client (15 메서드) | core/api/jira-client.ts | ✅ 8건 |
| C-05 | Confluence Client (CRUD+JSON) | core/api/confluence-client.ts | ✅ 7건 |
| C-06 | Cache Manager (L1+L2+DI) | core/cache/cache-manager.ts | ✅ 10건 |
| C-07 | Auto Updater (Native Host) | core/updater/auto-updater.ts | - |

### 1.2 Domain Layer (✅ 구현 완료)

| ID | 기능 | 파일 | 테스트 |
|----|------|------|--------|
| D-01 | Guide Matcher (3단계 fallback) | domain/guide/guide-matcher.ts | ✅ 8건 |
| D-02 | Title Similarity (한국어) | domain/task/title-similarity.ts | ✅ 12건 |
| D-03 | Task Filter (다중 필터) | domain/task/task-filter.ts | ✅ 12건 |
| D-04 | Personal Stats | domain/task/personal-stats.ts | ✅ 4건 |
| D-05 | Field Resolver (공통+가변) | domain/transition/field-resolver.ts | ✅ 5건 |
| D-06 | Checklist Validator (3유형) | domain/transition/checklist-validator.ts | ✅ 9건 |
| D-07 | Output Validator (4단계) | domain/transition/output-validator.ts | ✅ 12건 |
| D-08 | Version Manager | domain/version/version-manager.ts | ✅ 5건 |
| D-09 | Error Analyzer | domain/config/error-analyzer.ts | ✅ 10건 |

### 1.3 Features Layer (UI 구현 현황)

| ID | 기능 | 상태 | 설명 |
|----|------|------|------|
| F-01 | Header | ✅ | 큐브 아이콘, 버전 자동, Pop-out, ESC |
| F-02 | Main Tabs (SLM/일반/VOC/AI) | ✅ | 탭 전환, AI 토글 |
| F-03 | Dashboard | ✅ | 숫자 클릭→상세, SLM/일반 분리 |
| F-04 | Task List | ✅ | 그룹 접힘, Issue Key 링크, 참조UI |
| F-05 | Structure (통합) | ✅ | Tree/Table, Status 필터, Close 제외, SLM/일반 Workflow |
| F-06 | Sprint Kanban | ✅ | 드래그, 확인 모달 |
| F-07 | VOC Wizard (3단계) | ✅ | 위치→내용→확인 |
| F-08 | AI Chat | ✅ | 채팅, AI ON/OFF 모드 |
| F-09 | Process Tailoring | ✅ | 단계 시각화, Tailoring 자동 적용 |
| F-10 | Settings | ✅ | Jira/Confluence URL, PAT, 테마 |
| F-11 | Admin Panel | ✅ | 비밀번호 인증, 프로세스/메타데이터/버전/사용자 관리 |
| F-12 | KPI Dashboard | ✅ | 업무/프로세스/사용 지표 표시 |
| F-13 | Alert/Notification | ✅ | 지연/마감/업데이트 알림 UI |
| F-14 | Onboarding Tour | ✅ | 5단계 가이드, 자동 표시, 다시보기 |
| F-15 | Global Search (Ctrl+F) | ✅ | 모달, ESC 닫기 |
| F-16 | Shortcut Settings | ✅ | 목록 모달 |
| F-17 | Issue Creation (Structure) | ✅ | [+]→3단계 Wizard, SLM(L4~L7)/일반(SW-Task+Component 등 7종), 기본값 자동 |
| F-18 | Reference/Reuse | ✅ | Jira API 유사과제 검색, 필드 선택, 클립보드 복사 |

---

## 2. 미구현 기능 상세 설계

### F-05: Structure — Status 필터 + Close 제외

```
위치: features/hierarchy/HierarchyView.tsx

필터 바:
  [요구사항] [분석] [설계] [구현] [테스트] [검증] [완료]  ☐ Close 포함
  (SLM 기준, 일반은 To Do/In Progress/Review/Done)

동작:
  - 필터 선택 시 해당 Status만 표시
  - 미선택 = 전체 표시
  - Close 포함 체크 해제(기본) = Closed/완료 제외
  - 전체 펼치기/접기 + 🔄 초기화

현재 코드에 이미 statusFilter, includeClosed 로직 있음
→ 데모(JSX)에 반영 필요
```

### F-11: Admin — 메타데이터/버전 관리

```
Admin 인증 후 메뉴:

[1] 표준 프로세스 관리 ← ✅ 구현됨
  - 단계 CRUD, Tailoring 규칙

[2] 메타데이터 관리
  ┌────────────────────────────────────┐
  │ [가이드] [체크리스트] [AI지침] [필드] │
  │                                    │
  │ 엑셀형 테이블:                      │
  │ Code | IssueType | Title | 가이드  │
  │ A-001| Story     | 전기  | [편집]  │
  │ A-002| Task      | 소방  | [편집]  │
  │                                    │
  │ [+ 추가] [📥 Import] [📤 Export]    │
  └────────────────────────────────────┘

  저장: Confluence SLM-CONFIG 스페이스 JSON 코드블록
  Admin UI에서만 편집 → 파싱 안정성 100%

[3] 버전 관리
  ┌────────────────────────────────────┐
  │ 현재 버전: v2.3 (2026-04-10)       │
  │                                    │
  │ [🚀 정식 배포]  → manifest 갱신     │
  │ [📸 스냅샷]     → 현재 상태 저장    │
  │ [↩ Rollback]   → 이전 버전 복원    │
  │                                    │
  │ 배포 이력:                          │
  │ v2.3  04/10  변경 3건  [diff]      │
  │ v2.2  04/05  변경 1건  [diff]      │
  │ v2.1  04/01  최초 배포  [복원]      │
  └────────────────────────────────────┘

[4] 사용자 관리
  - 부관리자 추가/제거 (Jira PAT 기반)
  - 접근 권한 설정
```

### F-12: KPI Dashboard

```
모달 내용:

┌─── 업무 지표 ───────────────────────┐
│ 주간 처리 건수    5건 / 7건 목표     │
│ ━━━━━━━━━━━━━░░░ 71%               │
│                                     │
│ 30일 완료율      82%                 │
│ ━━━━━━━━━━━━━━━░░ 82%              │
│                                     │
│ 평균 소요일       8.5일              │
│ 지연율           15%                 │
└─────────────────────────────────────┘

┌─── 프로세스 준수율 ─────────────────┐
│ 전체 준수율      68%                │
│ ━━━━━━━━━━━━━░░░░░ 68%             │
│                                     │
│ 단계별:                              │
│ 요구사항 ━━━━━━━━━░ 90%             │
│ 설계     ━━━━━━━░░░ 70%             │
│ 구현     ━━━━━━░░░░ 60%             │
│ 테스트   ━━━░░░░░░░ 30%             │
└─────────────────────────────────────┘

┌─── 사용 지표 ───────────────────────┐
│ 가이드 조회     23회 (이번주)        │
│ AI 질문         12회                │
│ 재사용 복사      8회                │
│ VOC 등록         2건                │
└─────────────────────────────────────┘

데이터 소스:
  - 업무 지표: Jira JQL → personal-stats.ts
  - 프로세스: task.process → calcPct()
  - 사용 지표: chrome.storage.local 카운터
```

### F-13: Alert/Notification

```
알림 유형:
  1. Due date 사전 알림 (7일, 14일, 28일)
  2. 지연 알림 (Due date 초과)
  3. 버전 업데이트 알림
  4. 프로세스 미준수 알림

알림 UI:
  🔔 클릭 → 알림 목록 모달
  ┌────────────────────────────────────┐
  │ 🔔 알림 (3건)                      │
  │                                    │
  │ 🔴 REQ-001 — 9일 지연              │
  │    Due: 04/01  14:30               │
  │                                    │
  │ 🟡 DES-003 — 5일 후 마감           │
  │    Due: 04/15  10:00               │
  │                                    │
  │ 🔄 v1.0.1 업데이트 가능             │
  │    [적용]                           │
  │                                    │
  │ 알림 없으면: "새로운 알림이 없습니다"  │
  └────────────────────────────────────┘

생성 로직: service-worker.ts alarm (10분 주기)
  → Due date 체크 → 알림 목록 갱신 → alertCount 업데이트
```

### F-14: Onboarding Tour

```
최초 접속 시 자동 표시 (chrome.storage 'pa-onboarding-done' 체크)

5단계:
  1. "Process Agent에 오신 것을 환영합니다"
  2. "📋 SLM 탭에서 과제를 관리합니다"
  3. "📁 일반 탭에서 Epic/Sprint 과제를 관리합니다"
  4. "💬 AI에게 과제 관련 질문을 할 수 있습니다"
  5. "⚙️ 설정에서 Jira/Confluence를 연결하세요"

UI: 모달 (이전/다음/건너뛰기/완료)
설정에서 "온보딩 투어 다시 보기" 버튼
```

### F-17: Issue Creation (Structure에서)

```
Structure 노드 [➕] 클릭 → Issue 생성 Wizard

3단계:
  Step 1: Issue Type 선택 + Summary
  Step 2: Due Date + Assignee + 상세 필드
  Step 3: 확인 (상위 과제 자동 설정) → 생성

생성 후:
  → Jira API 호출
  → Structure에 자동 배치
  → 결과 화면 (Jira 링크 + 추가 생성)

현재 코드: features/common/CommonViews.tsx에 IssueCreateView 존재
→ Structure [➕]와 연결 필요
```

---

## 3. 데이터 모델

### 3.1 표준 프로세스

```typescript
interface StandardProcess {
  id: string;
  name: string;
  stages: { id: string; name: string; order: number; mandatory: boolean; outputs: string[] }[];
  tailoringRules: { issueType: string; excludeStages: string[]; reason: string }[];
}
```

### 3.2 Confluence 저장 구조

```
SLM-CONFIG Space
├── PA-MANIFEST           ← 버전 정보, publishedAt, changes
├── PA-META-{code}        ← 메타데이터 (가이드/CL/AI/필드) JSON
├── PA-PROCESS            ← 표준 프로세스 + Tailoring 규칙
├── PA-CONFIG-SNAPSHOT     ← 스냅샷 이력 (JSON Array)
└── PA-ADMIN              ← Admin 비밀번호(해시), 사용자 권한
```

### 3.3 chrome.storage 구조

```
Local:
  pa-theme          ← 테마 설정
  pa-onboarding-done ← 온보딩 완료 여부
  pa-favorites       ← 즐겨찾기 Issue Key 목록
  pa-usage-stats     ← 사용 지표 카운터
  pa-alert-list      ← 알림 목록

Session:
  pa-pat             ← PAT (세션 모드)
  pa-jira-url        ← Jira URL
  pa-confluence-url  ← Confluence URL
```

---

## 4. Admin 비밀번호

```
Phase 1 (현재): 하드코딩 P@ssw0rd##
Phase 2: Confluence PA-ADMIN 페이지에 bcrypt 해시 저장
Phase 3: Jira 그룹 기반 인증 (비밀번호 불필요)
```

---

## 5. Workflow 정의

```
SLM: 요구사항 → 분석 → 설계 → 구현 → 테스트 → 검증 → 완료
일반: To Do → In Progress → Review → Done
```

---

## 6. 테스트 전략

### Unit Test (Jest) — 117건 ✅ PASS

```
domain/guide-matcher         8건
domain/title-similarity     12건
domain/task-filter          12건
domain/personal-stats        4건
domain/field-resolver        5건
domain/checklist-validator   9건
domain/output-validator     12건
domain/version-manager       5건
domain/error-analyzer       10건
shared/field-types           3건
api/base-client              8건
api/jira-client              8건
api/confluence-client        7건
cache/cache-manager         10건
api/request-queue            5건
```

### 통합 테스트 대상 (추가 필요)

```
☐ Confluence Publisher — 트랜잭션 패턴
☐ Process Tailoring Engine — 규칙 적용
☐ Alert Generator — Due date 기반 알림 생성
☐ KPI Calculator — 지표 계산 정확성
```

### E2E 시나리오 (9건 정의됨)

```
E2E-01: SLM Status 전이 전체 흐름
E2E-02: 필드 참조/복사
E2E-03: VOC 등록
E2E-04: Admin 배포
E2E-05: 버전 업데이트
E2E-06: Sprint 드래그
E2E-07: Issue 생성
E2E-08: 오류 VOC 자동 생성
E2E-09: 전역 검색
```

### 시스템 테스트 (29건 정의됨)

```
안정성  5건: 장시간, 대량 데이터, 탭 전환, 세트 전환, 동시 편집
성능   10건: 초기 로딩, 목록, 캐시, 필터, 세트전환, 업데이트, AI, Sprint, 검색
신뢰성 10건: 네트워크, Confluence, Jira, AI, Storage, Sync, Field, Structure, Workflow
보안    4건: PAT 만료, Admin 미인가, Session, 권한
```

---

## 7. 코드 리뷰 체크리스트

```
☐ DI 패턴 준수 (StorageAdapter 등)
☐ Result<T> 에러 처리
☐ 재시도/fallback 로직
☐ 타입 안전성 (strict mode 호환)
☐ 상태 관리 일관성
☐ 컴포넌트 단일 책임
☐ 상수 중앙 관리 (app-config, workflow)
☐ 메모리 누수 방지 (cleanup)
☐ 접근성 (ARIA 기본)
☐ 성능 (불필요한 리렌더링 방지)
```

---

## 8. 구현 우선순위

```
Priority 1 (즉시):
  ☐ F-05: Structure Status 필터 + Close 제외 반영
  ☐ F-13: Alert 알림 UI + 로직
  ☐ F-14: Onboarding 데모 반영
  ☐ F-12: KPI 실제 지표 표시

Priority 2 (이번 주):
  ☐ F-11: Admin 메타데이터/버전 관리 UI
  ☐ F-17: Structure Issue 생성 Wizard 연결
  ☐ 통합 테스트 추가 (4건)

Priority 3 (다음 주):
  ☐ E2E 테스트 실행 (Playwright)
  ☐ 시스템 테스트 실행
  ☐ Admin 비밀번호 Confluence 이관
  ☐ Jira 그룹 기반 인증
```

---

## 9. 파일 구조 (최종)

```
src/
├── manifest.json
├── background/service-worker.ts
├── core/
│   ├── types/index.ts
│   ├── api/ (base-client, request-queue, jira-client, confluence-client)
│   ├── cache/cache-manager.ts
│   └── updater/auto-updater.ts
├── domain/
│   ├── guide/guide-matcher.ts
│   ├── task/ (title-similarity, task-filter, personal-stats)
│   ├── transition/ (field-resolver, checklist-validator, output-validator)
│   ├── version/version-manager.ts
│   └── config/error-analyzer.ts
├── shared/
│   ├── components/index.tsx (Header,Tabs,SplitPane,Modal,Toast,EmptyState,Skeleton,StatusBadge,SearchInput,Card,Accordion)
│   ├── constants/ (app-config, field-types, workflow, jira-link)
│   └── hooks/index.ts (useLocalStorage,useTheme,useAI,usePolling,useDebounce,useKeyboardShortcut)
├── features/
│   ├── dashboard/DashboardView.tsx
│   ├── task-list/TaskListView.tsx
│   ├── hierarchy/HierarchyView.tsx (통합 Structure+계층)
│   ├── sprint/SprintView.tsx
│   ├── voc/VOCView.tsx
│   ├── ai-chat/AIChatView.tsx
│   └── common/CommonViews.tsx (GlobalSearch, IssueCreate)
├── sidepanel/ (App.tsx, index.html, index.tsx)
└── icons/ (icon-16/32/48/128.png)

tests/
├── unit/domain/ (5 suites, 79 tests)
├── integration/ (2 suites, 38 tests)
├── e2e/ (9 specs + 29 system specs)
└── results/

installer/
├── setup.bat (Admin/User 분리, Extension ID 자동감지)
├── updater.py (Native Host)
└── README.md
```

---


## 10. Admin 설정 버전 관리

### 개요

Admin이 Confluence에 배포하는 설정(메타데이터, 프로세스, 가이드 등)의
정식/테스트 버전을 관리한다.

### 버전 유형

```
테스트 버전 (Draft):
  → Admin만 확인 가능
  → 일반 사용자에게 미적용
  → 언제든 삭제 가능
  → 검증 후 정식으로 승격

정식 버전 (Published):
  → 전체 사용자에게 적용
  → 삭제 불가 (Rollback만 가능)
  → 배포 이력 보존
```

### Confluence 저장 구조

```
SLM-CONFIG Space
├── PA-MANIFEST              ← 현재 정식 버전 정보
│   {
│     "version": "v2.3",
│     "status": "published",
│     "publishedAt": "2026-04-10T09:00:00Z",
│     "publishedBy": "admin"
│   }
│
├── PA-DRAFT                 ← 테스트 버전 (1개만 유지)
│   {
│     "version": "v2.4-draft",
│     "status": "draft",
│     "createdAt": "2026-04-12T14:00:00Z",
│     "changes": ["가이드 3건 수정", "프로세스 규칙 추가"]
│   }
│
├── PA-SNAPSHOT/              ← 정식 배포 스냅샷 (이력)
│   ├── v2.3.json
│   ├── v2.2.json
│   └── v2.1.json
│
├── PA-META-{code}           ← 메타데이터 (현재 정식 기준)
├── PA-PROCESS               ← 표준 프로세스
└── PA-ADMIN                 ← Admin 설정
```

### Admin UI 흐름

```
Admin 인증 → 🔄 버전 관리 탭

┌─────────────────────────────────────────┐
│ 현재 정식 버전: v2.3 (2026-04-10)        │
│                                         │
│ ┌─── 테스트 버전 ─────────────────────┐  │
│ │ v2.4-draft (2026-04-12)             │  │
│ │ 변경: 가이드 3건 수정, 규칙 추가      │  │
│ │                                     │  │
│ │ [🔍 미리보기]  [🚀 정식 배포]        │  │
│ │ [🗑 삭제]                           │  │
│ └─────────────────────────────────────┘  │
│                                         │
│ [📝 새 테스트 버전 생성]                  │
│                                         │
│ ─── 배포 이력 ───                        │
│ v2.3  04/10  가이드 2건 추가    [↩ 복원] │
│ v2.2  04/05  프로세스 규칙 변경  [↩ 복원] │
│ v2.1  04/01  최초 배포                   │
└─────────────────────────────────────────┘
```

### 동작 상세

```
[📝 새 테스트 버전 생성]
  → 현재 정식 설정 복사 → PA-DRAFT에 저장
  → Admin이 메타데이터/프로세스 수정
  → 수정사항은 PA-DRAFT에만 반영
  → 일반 사용자는 여전히 정식 버전 사용

[🔍 미리보기]
  → Admin의 Extension에서만 테스트 버전 적용
  → 가이드, 프로세스, 체크리스트 등 확인

[🚀 정식 배포]
  → PA-DRAFT → PA-MANIFEST로 승격
  → 현재 정식 → PA-SNAPSHOT에 보관
  → 전체 사용자 Extension에 반영 (polling 10분)
  → PA-DRAFT 삭제

[🗑 삭제]
  → PA-DRAFT 삭제
  → 정식 버전에 영향 없음

[↩ Rollback]
  → PA-SNAPSHOT에서 선택한 버전 복원
  → 현재 정식 → 스냅샷으로 보관
  → 복원 대상 → PA-MANIFEST로 설정
```

### 사용자 측 동작

```
일반 사용자:
  Extension 시작 시 PA-MANIFEST 버전 확인
  → 로컬 캐시 버전과 비교
  → 다르면 최신 설정 로드
  → Polling 10분 주기 자동 갱신

Admin:
  테스트 버전 존재 시
  → Header에 "🧪 Draft v2.4" 표시
  → 미리보기 모드 토글 가능
```

### 구현 파일

```
core/api/confluence-client.ts   ← CRUD (기존)
domain/version/version-manager.ts ← 버전 비교/승격 로직 (기존)
sidepanel/App.tsx               ← Admin 버전 관리 UI (구현됨)
background/service-worker.ts    ← Polling + 버전 체크 (기존)
```

---

## 11. Issue Key 링크 정책

### 전체 적용 현황

```
모든 Issue Key는 클릭 시 Jira 페이지로 이동:
  → openJiraIssue(key) → window.open(jiraUrl + '/browse/' + key)

적용 View:
  ✅ Dashboard    — 긴급 과제, 상세 모달
  ✅ TaskList     — 과제 목록, 선택 상세
  ✅ Hierarchy    — Tree 뷰, Table 뷰, 선택 상세
  ✅ Sprint       — 칸반 카드
  ✅ CommonViews  — Structure 테이블, Issue 생성 결과
  ✅ VOC          — 등록 결과
  ✅ AI Chat      — (import 준비)

스타일: color: accent, cursor: pointer, textDecoration: underline
유틸: shared/constants/jira-link.ts
```

### 참조/재사용 복사 기능

```
동작:
  1. 유사 과제 목록에서 과제 선택
  2. 복사할 필드 선택 (description, attachments 등)
  3. [→ 클립보드 복사] 클릭
  4. navigator.clipboard.writeText()로 복사
  5. 복사 완료 alert 표시

Phase 2:
  → 클립보드가 아닌 현재 과제 필드에 직접 주입
  → Jira API PUT /rest/api/2/issue/{key} 호출
```

---

## 12. 데이터 파이프라인

### 연결 흐름

```
⚙️ 설정에서 입력:
  Jira URL:       https://jira.company.com
  Confluence URL: https://confluence.company.com
  PAT:            personal-access-token
                    ↓
  [💾 저장] 클릭
                    ↓
  chrome.storage.local에 저장:
    pa-jira-url, pa-confluence-url, pa-pat
                    ↓
  dataService.saveConfig() → init()
    → JiraClient 생성 (baseUrl + PAT 인증)
    → ConfluenceClient 생성
                    ↓
  testConnection() → /rest/api/2/myself 호출
    → 성공: "연결 성공 (홍길동)" 토스트
    → 실패: "연결 실패 — URL/PAT 확인" 에러
```

### 데이터 조회

```
Feature View 렌더링 시:
  dataService.isConnected() 체크
                    ↓
  ┌─ true ──────────────────────────────┐
  │ dataService.getSLMIssues(projectKey) │
  │ → JiraClient.searchIssues(JQL)      │
  │ → CacheManager (10분 TTL)           │
  │ → IssueData[] 반환                  │
  │ → "✅ Jira 실시간 데이터" 배너       │
  └─────────────────────────────────────┘
                    ↓
  ┌─ false ─────────────────────────────┐
  │ Mock 데이터 표시                     │
  │ → "⚠️ 연결 안내" 배너             │
  │ → "⚙️ 설정에서 연결하세요" 안내      │
  └─────────────────────────────────────┘
```

### Polling (Service Worker)

```
chrome.alarms 'pa-polling' (10분 주기)
  → pa-jira-url + pa-pat 확인
  → CACHE_REFRESH 메시지 → UI 갱신
  → 캐시 만료 시 자동 재조회
```

### 파일 구성

```
core/data-service.ts    ← 연결 관리 + 데이터 조회 (싱글톤)
shared/hooks/use-data.ts ← React Hook (useConnection, useIssues)
sidepanel/App.tsx       ← Settings 저장/로드 + 연결 테스트
background/service-worker.ts ← Polling + 설정 변경 감지
features/*/View.tsx     ← isConnected() → 실시간 or Mock
```

### JQL 쿼리

```
SLM 과제:
  project = {SLM_PROJECT} AND issuetype in (SW-Task, Requirement, Defect, Task, Sub-Task, Story)
  ORDER BY duedate ASC

일반 과제:
  project = {GEN_PROJECT} [AND sprint = {sprintId}]
  ORDER BY duedate ASC
```

---

## 13. Settings 화면 구조

```
⚙️ 설정 모달

┌─── 🔗 시스템 연결 ──────────────────────────┐
│ Jira URL:       [https://jira.company.com ]  │
│ Confluence URL: [https://conf.company.com ]  │
│ PAT:            [••••••••••••••••          ]  │
└──────────────────────────────────────────────┘

┌─── 📋 프로젝트 설정 ────────────────────────┐
│ SLM Project Key:  [SLMPROJ]                  │
│  → SLM 탭에서 조회할 Jira 프로젝트            │
│                                              │
│ 일반 Project Key: [GENPROJ]                  │
│  → 일반 탭에서 조회할 Jira 프로젝트            │
│                                              │
│ SW-Task Component: [Common]                  │
└──────────────────────────────────────────────┘

┌─── 🎨 화면 ─────────────────────────────────┐
│ 테마: [시스템 ▼]                              │
└──────────────────────────────────────────────┘

✅ 연결됨: 홍길동                    ← 연결 상태 표시

[💾 저장 및 연결 테스트] [🔄 온보딩] [⌨️ 단축키]
```

### 저장 시 동작

```
[💾 저장] 클릭
  ↓
chrome.storage.local에 저장:
  pa-jira-url, pa-confluence-url, pa-pat
  pa-slm-project, pa-gen-project
  pa-default-component
  ↓
dataService.saveConfig() → JiraClient 초기화
  ↓
testConnection() → Jira /rest/api/2/myself 호출
  ↓
성공: "연결 성공 (홍길동)" + Header ● 초록
실패: "연결 실패" + Header ● 빨강
  ↓
Feature View 자동 갱신 (projectKey prop 반영)
```

### 미연결 시 Feature View

```
모든 Feature View (Dashboard, TaskList, Structure):
  미연결 → "🔗 Jira에 연결되지 않았습니다" EmptyState 표시
         → 연결 방법 안내 (5단계)
         → Mock 데이터 없음
```

---

## 14. 설정 영속성 (Storage)

### 문제
Extension 파일을 새 폴더에서 로드하면 Extension ID가 변경되고 chrome.storage.local이 초기화됨.

### 해결

```
저장: chrome.storage.sync (우선) + chrome.storage.local (백업)
로드: sync 우선 → local fallback

sync: Chrome 계정에 연동 → Extension ID 변경에도 유지
local: 같은 Extension ID 내에서 빠른 접근

core/storage-helper.ts:
  saveSettings(data)     → sync + local 동시 저장
  loadSettings(keys)     → sync 우선, local fallback
  exportSettings()       → JSON 파일 다운로드
  importSettings(json)   → JSON 파일에서 복원
```

### 설정 내보내기/가져오기

```
⚙️ 설정 모달 하단:
  [📤 설정 내보내기] → pa-settings.json 다운로드
  [📥 설정 가져오기] → JSON 파일 선택 → 복원 → 새로고침

용도:
  - Extension 재설치 시 백업/복원
  - 팀원에게 설정 공유
  - 다른 PC로 설정 이전
```

### 영속성 보장 순서

```
1차: chrome.storage.sync (Chrome 계정 연동 시 유지)
2차: chrome.storage.local (같은 Extension ID 내 유지)
3차: pa-settings.json 내보내기/가져오기 (수동 백업)
4차: Confluence PA-CONFIG 페이지 (Phase 2, 서버 백업)
```

---

## 15. GitHub URL 및 Admin 충돌 관리

### GitHub Enterprise 지원

```
setup.bat 실행 시:

  GitHub URL [https://github.com/seagentadmin-creator/process-agent]:
  > https://github.company.com/team/process-agent

  자동 파싱:
    Host:  github.company.com
    Owner: team
    Repo:  process-agent
    API:   https://github.company.com/api/v3   ← Enterprise

  Public GitHub 입력 시:
    Host:  github.com
    Owner: seagentadmin-creator
    Repo:  process-agent
    API:   https://api.github.com               ← Public
```

### pa-config.ini 구조

```
[ProcessAgent]
GITHUB_URL=https://github.company.com/team/process-agent
GITHUB_API=https://github.company.com/api/v3
GITHUB_OWNER=team
GITHUB_REPO=process-agent
```

### Admin 충돌 시나리오

```
상황:
  Admin A: 회사 GitHub (github.company.com/team/process-agent)
  Admin B: 외부 GitHub (github.com/seagentadmin-creator/process-agent)

  → 같은 설치 폴더에 pa-config.ini가 1개만 존재
  → 나중에 setup.bat 실행한 Admin의 설정으로 덮어쓰기
```

### 충돌 방지 정책

```
정책 1: 팀별 단일 Admin (권장)
  → 1개 팀 = 1명 Admin = 1개 GitHub URL
  → pa-config.ini는 Admin이 최초 1회만 설정
  → User는 setup.bat → User 메뉴로 설치 (GitHub 입력 불필요)
  → User는 Admin이 설정한 GitHub에서 자동 업데이트

정책 2: 다중 GitHub (고급)
  → 회사 GitHub = 소스 코드 관리 (개발용)
  → 외부 GitHub = Release 배포 (팀원용)
  → setup.bat에는 Release 배포용 GitHub만 입력
  → 개발자는 별도로 git remote 관리

정책 3: Confluence 기반 배포 (Phase 2)
  → GitHub 대신 Confluence에서 zip 배포
  → pa-config.ini에 GitHub 불필요
  → Admin이 Confluence에 zip 업로드 → 팀원 자동 업데이트
```

### 파일별 역할

```
pa-config.ini (설치 폴더):
  → GitHub URL, API, Owner, Repo
  → setup.bat (Admin) 실행 시 생성
  → User는 수정하지 않음
  → updater.py가 읽어서 업데이트 체크

updater.py:
  → pa-config.ini에서 GITHUB_API 로드
  → Public: api.github.com/repos/{owner}/{repo}/releases/latest
  → Enterprise: github.company.com/api/v3/repos/{owner}/{repo}/releases/latest
  → config가 없으면 api.github.com fallback
```
