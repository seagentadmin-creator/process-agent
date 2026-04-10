/**
 * E2E Test Specifications for Process Agent
 * Framework: Playwright
 * Targets: Chrome + Edge
 * 
 * Note: These specs require a running Extension environment.
 * Run with: npx playwright test
 */

// E2E-01: SLM Status 전이 전체 흐름
export const slmTransition = {
  id: 'E2E-01',
  name: 'SLM 과제 Status 전이',
  steps: [
    { action: 'Side Panel 열기', expect: '대시보드 표시' },
    { action: '과제 목록 서브탭 클릭', expect: 'Delay/Upcoming 그룹 표시' },
    { action: 'L5 과제 클릭', expect: '하단 미리보기 패널에 Compact 정보 표시' },
    { action: '[🔄 Status] 아코디언 클릭', expect: '전이 패널 확장, 다른 아코디언 접힘' },
    { action: 'Checklist 항목 체크', expect: '체크 상태 반영' },
    { action: '필수 필드 입력', expect: '입력값 반영' },
    { action: '[✅ Resolve] 클릭', expect: 'Jira API 호출 → Status 변경 → 토스트 "Status 변경 완료"' },
  ],
};

// E2E-02: 필드 재사용
export const fieldReuse = {
  id: 'E2E-02',
  name: '이전 과제 참조 복사',
  steps: [
    { action: '[📋 참조] 아코디언 클릭', expect: '참조 패널 표시' },
    { action: '추천 1건 확인', expect: '유사도 점수와 함께 표시' },
    { action: '[▼ 더보기] 클릭', expect: '즐겨찾기 + 자동 추천 확장' },
    { action: '과제 선택', expect: '비교 뷰 (좌: 원본, 우: 현재)' },
    { action: '필드 멀티 선택', expect: '체크박스 선택 반영' },
    { action: '[→ 선택 필드 복사] 클릭', expect: '값 복사 + 편집 가능 상태' },
    { action: '[💾 저장] 클릭', expect: 'Jira 반영 + SLM은 책임 문구 포함' },
  ],
};

// E2E-03: VOC 등록
export const vocSubmit = {
  id: 'E2E-03',
  name: 'VOC 등록 전체 흐름',
  steps: [
    { action: 'VOC 탭 클릭', expect: 'Step 1 (위치) 표시' },
    { action: 'Project 선택', expect: '선택 반영' },
    { action: '[다음] 클릭', expect: 'Step 2 (내용) 표시' },
    { action: '제목, 분류, 설명 입력', expect: '입력 반영' },
    { action: '[다음] 클릭', expect: 'Step 3 (확인) 표시 - 전체 정보 요약' },
    { action: '[✅ VOC 등록] 클릭', expect: 'Issue 생성 → Watcher 추가 → 완료 화면' },
  ],
};

// E2E-04: Admin 배포
export const adminPublish = {
  id: 'E2E-04',
  name: 'Admin 항목 추가 → 배포',
  steps: [
    { action: 'Admin 패널 진입', expect: 'PAT 기반 권한 확인 → Admin 화면' },
    { action: '메타 데이터 관리 진입', expect: '항목 테이블 표시' },
    { action: '[➕ 항목 추가] 클릭', expect: '새 행 추가' },
    { action: '가이드/CL 작성', expect: '탭별 입력' },
    { action: '[💾 저장] 클릭', expect: 'Confluence 반영 → 저장 완료 토스트' },
    { action: '[🚀 정식 배포] 클릭', expect: 'manifest 갱신 → 사용자 알림 트리거' },
  ],
};

// E2E-05: 버전 업데이트 적용
export const versionUpdate = {
  id: 'E2E-05',
  name: '사용자 업데이트 적용',
  steps: [
    { action: 'Side Panel 열기', expect: 'manifest 체크 → 업데이트 감지' },
    { action: '알림 배지 확인', expect: '🔔 배지에 숫자 표시' },
    { action: '[✅ 적용] 클릭', expect: '변경분 fetch → 캐시 갱신 → 토스트' },
    { action: '가이드 조회', expect: '새 버전 내용 표시' },
  ],
};

// E2E-06: Sprint 드래그
export const sprintDrag = {
  id: 'E2E-06',
  name: 'Sprint 칸반 Status 변경',
  steps: [
    { action: 'Sprint 뷰 서브탭 클릭', expect: '칸반 보드 표시' },
    { action: '카드 0.3초 hold 후 드래그', expect: '드래그 시작' },
    { action: '허용 컬럼으로 드롭', expect: '확인 모달 표시' },
    { action: '[✅ 변경] 클릭', expect: 'Status 변경 → 카드 이동' },
    { action: 'Undo 토스트 확인', expect: '5초간 [↩ 되돌리기] 버튼' },
  ],
};

// E2E-07: Issue 생성
export const issueCreate = {
  id: 'E2E-07',
  name: 'Issue 생성 3단계',
  steps: [
    { action: 'Structure 뷰에서 L5 [➕] 클릭', expect: 'Issue 생성 Wizard Step 1' },
    { action: 'Issue Type 선택 + Summary 입력', expect: '입력 반영' },
    { action: '[다음] 클릭', expect: 'Step 2 (상세 설정)' },
    { action: 'Due Date, Assignee 입력', expect: '입력 반영' },
    { action: '[다음] 클릭', expect: 'Step 3 (확인) - 전체 정보 + 자동 생성 정보' },
    { action: '[✅ 생성] 클릭', expect: 'Issue 생성 → 결과 화면' },
  ],
};

// E2E-08: 오류 VOC 자동 생성
export const errorVOC = {
  id: 'E2E-08',
  name: 'API 실패 시 자동 보고',
  steps: [
    { action: 'Status 전이 시도 (403 시뮬레이션)', expect: 'API 호출 실패' },
    { action: '오류 다이얼로그 확인', expect: '예상 원인 + 자체 해결 방안' },
    { action: '자동 VOC 생성 확인', expect: 'ERR-XXXX Issue 생성 알림' },
  ],
};

// E2E-09: 전역 검색
export const globalSearch = {
  id: 'E2E-09',
  name: '전역 과제 검색 (Cmd+K)',
  steps: [
    { action: 'Cmd+K 입력', expect: '검색 모달 표시' },
    { action: '키워드 입력', expect: '실시간 검색 결과' },
    { action: '결과 클릭', expect: '해당 과제로 이동' },
    { action: 'ESC 입력', expect: '모달 닫힘' },
  ],
};

export const ALL_E2E_SPECS = [slmTransition, fieldReuse, vocSubmit, adminPublish, versionUpdate, sprintDrag, issueCreate, errorVOC, globalSearch];
