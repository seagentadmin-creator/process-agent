import { hasUpdate, hasPublishedAtChanged, getChangedItems, isTestVersion } from '../../../src/domain/version/version-manager';
import { filterTasks, groupByDueDate, getDelayDays, getDaysUntilDue } from '../../../src/domain/task/task-filter';
import { analyzeCause, getUserActions, shouldCreateVOC } from '../../../src/domain/config/error-analyzer';
import { getWeeklyTarget, getCompletionRate, getAvgDuration } from '../../../src/domain/task/personal-stats';
import { JiraIssue, ManifestData, VersionChanges } from '../../../src/core/types';

// === Helper: mock issue factory ===
function mockIssue(overrides: Partial<JiraIssue> = {}): JiraIssue {
  return {
    key: 'TASK-001', id: '1', fields: {},
    summary: 'Test Issue',
    status: { id: '1', name: 'In Progress', category: 'indeterminate' },
    assignee: { key: 'hong', name: 'hong', displayName: '홍길동', emailAddress: 'hong@test.com' },
    dueDate: null, issueType: { id: '1', name: 'Task', subtask: false },
    priority: { id: '3', name: 'Medium' }, description: null,
    created: '2026-03-01T00:00:00Z', updated: '2026-04-01T00:00:00Z',
    resolutionDate: null, components: [], labels: [], attachments: [],
    ...overrides,
  };
}

// === VersionManager Tests ===
describe('VersionManager', () => {
  const manifest: ManifestData = {
    currentVersion: 'v1.2',
    publishedAt: '2026-04-10T14:30:00Z',
    changes: { guide: ['A-001', 'A-004'], checklist: ['A-004'], aiDirectives: [], commonFields: false, commonChecklist: false },
    versions: [],
  };

  test('VM-01: 새 버전 감지', () => {
    expect(hasUpdate('v1.1', manifest)).toBe(true);
  });

  test('VM-02: 동일 버전', () => {
    expect(hasUpdate('v1.2', manifest)).toBe(false);
  });

  test('VM-03: publishedAt 변경 감지', () => {
    expect(hasPublishedAtChanged('2026-04-10T10:00:00Z', '2026-04-10T14:30:00Z')).toBe(true);
    expect(hasPublishedAtChanged('2026-04-10T14:30:00Z', '2026-04-10T14:30:00Z')).toBe(false);
  });

  test('VM-04: changes 파싱', () => {
    const items = getChangedItems(manifest.changes);
    expect(items).toContain('guide:A-001');
    expect(items).toContain('guide:A-004');
    expect(items).toContain('checklist:A-004');
    expect(items).not.toContain('commonFields');
  });

  test('VM-07: 테스트 버전 판별', () => {
    expect(isTestVersion('v1.2-test')).toBe(true);
    expect(isTestVersion('v1.2-draft')).toBe(true);
    expect(isTestVersion('v1.2')).toBe(false);
  });
});

// === TaskFilter Tests ===
describe('TaskFilter', () => {
  const today = new Date('2026-04-10');
  const issues: JiraIssue[] = [
    mockIssue({ key: 'T-1', summary: '전기안전점검', assignee: { key: 'hong', name: 'hong', displayName: '홍길동', emailAddress: '' }, dueDate: '2026-04-01', status: { id: '2', name: 'In Progress', category: 'indeterminate' } }),
    mockIssue({ key: 'T-2', summary: '소방설비검토', assignee: { key: 'kim', name: 'kim', displayName: '김철수', emailAddress: '' }, dueDate: '2026-04-15', status: { id: '2', name: 'In Progress', category: 'indeterminate' } }),
    mockIssue({ key: 'T-3', summary: '가스점검보고', assignee: { key: 'hong', name: 'hong', displayName: '홍길동', emailAddress: '' }, dueDate: '2026-04-25', status: { id: '3', name: 'Closed', category: 'done' } }),
    mockIssue({ key: 'T-4', summary: '전기설비유지', assignee: { key: 'hong', name: 'hong', displayName: '홍길동', emailAddress: '' }, dueDate: null, status: { id: '1', name: 'To Do', category: 'new' } }),
  ];

  test('TF-01: Assignee 필터', () => {
    const result = filterTasks(issues, { assignee: 'hong' });
    expect(result).toHaveLength(3);
    expect(result.every(i => i.assignee?.key === 'hong')).toBe(true);
  });

  test('TF-02: 즐겨찾기 필터', () => {
    const result = filterTasks(issues, { favoritesOnly: true, favorites: new Set(['T-1', 'T-3']) });
    expect(result).toHaveLength(2);
  });

  test('TF-05: Close 제외', () => {
    const result = filterTasks(issues, { excludeClosed: true });
    expect(result.find(i => i.key === 'T-3')).toBeUndefined();
  });

  test('TF-06: Close 포함', () => {
    const result = filterTasks(issues, { excludeClosed: false });
    expect(result.find(i => i.key === 'T-3')).toBeDefined();
  });

  test('TF-07: 키워드 필터', () => {
    const result = filterTasks(issues, { keyword: '전기' });
    expect(result).toHaveLength(2);
  });

  test('TF-08: Status 필터', () => {
    const result = filterTasks(issues, { statuses: ['In Progress'] });
    expect(result).toHaveLength(2);
  });

  test('TF-09: 복합 필터', () => {
    const result = filterTasks(issues, { assignee: 'hong', keyword: '안전', excludeClosed: true });
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('T-1');
  });

  test('groupByDueDate: Delay 그룹', () => {
    const groups = groupByDueDate(issues, today);
    expect(groups.delay.find(i => i.key === 'T-1')).toBeDefined();
  });

  test('groupByDueDate: 7일 이내 그룹', () => {
    const groups = groupByDueDate(issues, today);
    expect(groups.week.find(i => i.key === 'T-2')).toBeDefined();
  });

  test('groupByDueDate: Due date 없음 그룹', () => {
    const groups = groupByDueDate(issues, today);
    expect(groups.noDueDate.find(i => i.key === 'T-4')).toBeDefined();
  });

  test('getDelayDays', () => {
    expect(getDelayDays('2026-04-01', today)).toBe(9);
  });

  test('getDaysUntilDue', () => {
    expect(getDaysUntilDue('2026-04-15', today)).toBe(5);
  });
});

// === ErrorAnalyzer Tests ===
describe('ErrorAnalyzer', () => {
  test('EA-01: 403 분석', () => {
    const causes = analyzeCause('403');
    expect(causes[0].cause).toContain('권한');
  });

  test('EA-02: 404 분석', () => {
    const causes = analyzeCause('404');
    expect(causes[0].cause).toContain('삭제');
  });

  test('EA-03: 500 분석', () => {
    const causes = analyzeCause('500');
    expect(causes[0].cause).toContain('서버');
  });

  test('EA-04: TIMEOUT 분석', () => {
    const causes = analyzeCause('TIMEOUT');
    expect(causes[0].cause).toContain('네트워크');
  });

  test('EA-05: PARSE_ERROR 분석', () => {
    const causes = analyzeCause('PARSE_ERROR');
    expect(causes[0].cause).toContain('형식');
  });

  test('EA-06: AI_AUTH 분석', () => {
    const causes = analyzeCause('AI_AUTH');
    expect(causes[0].cause).toContain('API Key');
  });

  test('getUserActions: 403 → 권한 확인 링크', () => {
    const actions = getUserActions('403', 'TASK-201');
    expect(actions.some(a => a.link?.includes('TASK-201'))).toBe(true);
  });

  test('shouldCreateVOC: 중복 방지', () => {
    const recent = [{ hash: 'abc123', timestamp: new Date().toISOString() }];
    expect(shouldCreateVOC('500', recent, 'abc123')).toBe(false);
  });

  test('shouldCreateVOC: 사용자 입력 오류 미생성', () => {
    expect(shouldCreateVOC('VALIDATION', [], 'xyz')).toBe(false);
    expect(shouldCreateVOC('CANCELLED', [], 'xyz')).toBe(false);
  });

  test('shouldCreateVOC: 일반 오류 생성', () => {
    expect(shouldCreateVOC('500', [], 'xyz')).toBe(true);
  });
});

// === PersonalStats Tests ===
describe('PersonalStats', () => {
  const today = new Date('2026-04-10');

  test('PS-01: 이번주 처리 대상', () => {
    const issues = [
      mockIssue({ key: 'T-1', dueDate: '2026-04-12', status: { id: '2', name: 'In Progress', category: 'indeterminate' } }),
      mockIssue({ key: 'T-2', dueDate: '2026-04-12', status: { id: '1', name: 'To Do', category: 'new' } }),
      mockIssue({ key: 'T-3', dueDate: '2026-04-20', status: { id: '1', name: 'To Do', category: 'new' } }),
      mockIssue({ key: 'T-4', dueDate: '2026-04-10', status: { id: '3', name: 'Done', category: 'done' } }),
    ];
    expect(getWeeklyTarget(issues, today)).toBe(2); // T-1, T-2 (T-3 다음주, T-4 완료)
  });

  test('PS-02: 30일 완료율', () => {
    const issues = [
      mockIssue({ key: 'T-1', dueDate: '2026-04-05', resolutionDate: '2026-04-04', status: { id: '3', name: 'Done', category: 'done' } }),
      mockIssue({ key: 'T-2', dueDate: '2026-04-01', resolutionDate: '2026-04-05', status: { id: '3', name: 'Done', category: 'done' } }),
      mockIssue({ key: 'T-3', dueDate: '2026-03-20', resolutionDate: '2026-03-18', status: { id: '3', name: 'Done', category: 'done' } }),
    ];
    // 기한 내 완료: T-1, T-3 = 2건, 전체 완료: 3건 → 67%
    expect(getCompletionRate(issues, 30, today)).toBe(67);
  });

  test('PS-03: 평균 소요일', () => {
    const issues = [
      mockIssue({ key: 'T-1', created: '2026-04-01T00:00:00Z', resolutionDate: '2026-04-06T00:00:00Z', status: { id: '3', name: 'Done', category: 'done' } }), // 5일
      mockIssue({ key: 'T-2', created: '2026-03-25T00:00:00Z', resolutionDate: '2026-04-04T00:00:00Z', status: { id: '3', name: 'Done', category: 'done' } }), // 10일
    ];
    expect(getAvgDuration(issues, 30, today)).toBe(7.5); // (5+10)/2
  });

  test('빈 데이터 처리', () => {
    expect(getWeeklyTarget([], today)).toBe(0);
    expect(getCompletionRate([], 30, today)).toBe(0);
    expect(getAvgDuration([], 30, today)).toBe(0);
  });
});
