/**
 * System Test Specifications for Process Agent
 * Categories: Stability, Performance, Reliability, Security
 */

// === STABILITY TESTS ===
export const stabilityTests = [
  {
    id: 'ST-01', name: '장시간 운영',
    method: 'Side Panel 8시간 연속 사용, 과제 조회/Status 변경 반복',
    criteria: '메모리 누수 없음 (힙 사용량 증가 < 10%), UI 정상 동작',
  },
  {
    id: 'ST-02', name: '대량 데이터',
    method: '과제 500건 + 계층 2000건 로드',
    criteria: '초기 로딩 3초 이내, 필터링 반응 즉시 (<50ms)',
  },
  {
    id: 'ST-03', name: '빈번한 탭 전환',
    method: 'SLM↔일반↔VOC↔AI 100회 전환',
    criteria: '상태 보존, 메모리 안정 (증가 < 5MB)',
  },
  {
    id: 'ST-04', name: '세트 전환 반복',
    method: '5개 세트 순환 20회',
    criteria: '캐시 정상 동작, 데이터 정확, L1 교체 정상',
  },
  {
    id: 'ST-05', name: '동시 Admin 편집',
    method: '2명 Admin 동시 편집 → 저장',
    criteria: '낙관적 잠금 충돌 감지, 올바른 해결 옵션 제공',
  },
];

// === PERFORMANCE TESTS ===
export const performanceTests = [
  {
    id: 'PT-01', name: 'Side Panel 초기 로딩',
    metric: 'First Meaningful Paint',
    criteria: '1초 이내',
  },
  {
    id: 'PT-02', name: '과제 목록 로드',
    metric: '데이터 표시 완료 시간',
    criteria: '500ms 이내',
  },
  {
    id: 'PT-03', name: '캐시 히트 응답',
    metric: 'L1/L2 캐시 응답 시간',
    criteria: 'L1: <1ms, L2: <5ms',
  },
  {
    id: 'PT-04', name: '캐시 미스 응답',
    metric: 'Confluence API 조회 시간',
    criteria: '500ms 이내',
  },
  {
    id: 'PT-05', name: '필터링 반응',
    metric: '키워드/Status 필터 반응 시간',
    criteria: '10ms 이내 (로컬 처리)',
  },
  {
    id: 'PT-06', name: '세트 전환',
    metric: '활성 세트 변경 시간',
    criteria: '캐시 히트: <100ms',
  },
  {
    id: 'PT-07', name: '버전 업데이트 적용',
    metric: '변경 3건 기준 갱신 시간',
    criteria: '300ms 이내',
  },
  {
    id: 'PT-08', name: 'AI 채팅 첫 응답',
    metric: '스트리밍 첫 토큰 도착',
    criteria: '1초 이내',
  },
  {
    id: 'PT-09', name: 'Sprint 보드 로드',
    metric: '칸반 표시 완료',
    criteria: '500ms 이내',
  },
  {
    id: 'PT-10', name: '전역 검색',
    metric: '결과 표시 시간',
    criteria: '캐시: <10ms, API: <500ms',
  },
];

// === RELIABILITY TESTS ===
export const reliabilityTests = [
  {
    id: 'RT-01', name: '네트워크 끊김',
    method: 'VPN 끊기',
    criteria: '읽기 전용 모드 + "네트워크 연결을 확인하세요" 안내',
  },
  {
    id: 'RT-02', name: '네트워크 복구',
    method: 'VPN 재연결',
    criteria: '자동 Refresh + 정상 복귀 + 토스트 "연결 복구됨"',
  },
  {
    id: 'RT-03', name: 'Confluence 다운',
    method: 'Confluence API 실패 시뮬레이션',
    criteria: '캐시 fallback 사용 + "Confluence 연결 실패" 안내',
  },
  {
    id: 'RT-04', name: 'Jira 다운',
    method: 'Jira API 실패 시뮬레이션',
    criteria: '조회는 캐시 사용, 전이 차단 + "Jira 연결 실패" 안내',
  },
  {
    id: 'RT-05', name: 'AI Provider 다운',
    method: 'AI API 연결 실패',
    criteria: 'AI OFF 모드 자동 전환 + 안내',
  },
  {
    id: 'RT-06', name: 'Storage 용량 초과',
    method: 'chrome.storage 8MB 근접',
    criteria: '경고 표시 + 자동 정리 제안',
  },
  {
    id: 'RT-07', name: 'Confluence Sync 충돌',
    method: 'Confluence 페이지 외부 수정',
    criteria: '충돌 감지 + 3옵션 해결 UI',
  },
  {
    id: 'RT-08', name: 'Custom Field 삭제',
    method: 'Jira Custom Field 삭제',
    criteria: '정합성 경고 + 영향 분석 + Admin 안내',
  },
  {
    id: 'RT-09', name: 'Structure API 실패',
    method: 'Structure Plugin 오류',
    criteria: 'Issue Link 기반 fallback + Structure 뷰 장애 안내',
  },
  {
    id: 'RT-10', name: 'Sprint Workflow 제한',
    method: '허용되지 않은 전이 드래그',
    criteria: '드롭 차단 (빨간 테두리) + 안내 메시지',
  },
];

// === SECURITY TESTS ===
export const securityTests = [
  {
    id: 'SEC-01', name: 'PAT 만료',
    method: '만료된 PAT로 API 호출',
    criteria: '401 → 재인증 안내 화면',
  },
  {
    id: 'SEC-02', name: 'Admin 미인가 접근',
    method: '일반 사용자가 Admin 패널 진입 시도',
    criteria: '"Admin 권한이 없습니다" 안내',
  },
  {
    id: 'SEC-03', name: 'PAT session 저장',
    method: '브라우저 닫기 → 재열기',
    criteria: 'PAT 삭제 확인 (session 모드)',
  },
  {
    id: 'SEC-04', name: 'Admin 권한 범위',
    method: '부관리자 접근',
    criteria: '허용된 탭만 표시, 다른 탭 접근 차단',
  },
];

// === SUMMARY ===
export const SYSTEM_TEST_SUMMARY = {
  stability: stabilityTests.length,   // 5
  performance: performanceTests.length, // 10
  reliability: reliabilityTests.length, // 10
  security: securityTests.length,       // 4
  total: stabilityTests.length + performanceTests.length + reliabilityTests.length + securityTests.length, // 29
};
