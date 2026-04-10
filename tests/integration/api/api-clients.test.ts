import { BaseClient } from '../../../src/core/api/base-client';
import { JiraClient } from '../../../src/core/api/jira-client';
import { ConfluenceClient } from '../../../src/core/api/confluence-client';

// Mock fetch
const mockFetch = jest.fn();
// @ts-ignore
globalThis.fetch = mockFetch;

function mockResponse(status: number, body: any = {}, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  } as Response;
}

describe('BaseClient', () => {
  let client: BaseClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new BaseClient({ baseUrl: 'https://jira.test.com', pat: 'test-pat', maxRetries: 3, retryDelayMs: 10 });
  });

  test('BC-01: 성공 응답', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { key: 'TASK-1' }));
    const result = await client.request('/test');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: 'TASK-1' });
  });

  test('BC-02: 401 인증 실패', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401));
    const result = await client.request('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('401');
  });

  test('BC-03: 403 권한 부족', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(403));
    const result = await client.request('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('403');
  });

  test('BC-04: 404 Not Found', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404));
    const result = await client.request('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('404');
  });

  test('BC-05: 500 → 재시도 → 성공', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(200, { ok: true }));
    const result = await client.request('/test');
    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('BC-06: 500 × 3 → 전부 실패', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(500));
    const result = await client.request('/test');
    expect(result.success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test('BC-07: 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(204));
    const result = await client.request('/test');
    expect(result.success).toBe(true);
  });

  test('BC-08: Authorization header 포함', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));
    await client.request('/test');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Authorization']).toBe('Bearer test-pat');
  });
});

describe('JiraClient', () => {
  let jira: JiraClient;

  beforeEach(() => {
    mockFetch.mockReset();
    jira = new JiraClient({ baseUrl: 'https://jira.test.com', pat: 'pat', maxRetries: 1, retryDelayMs: 10 });
  });

  test('JC-01: Issue 조회 성공', async () => {
    const issue = { key: 'TASK-1', fields: { summary: 'Test' } };
    mockFetch.mockResolvedValueOnce(mockResponse(200, issue));
    const result = await jira.getIssue('TASK-1');
    expect(result.success).toBe(true);
    expect(result.data?.key).toBe('TASK-1');
  });

  test('JC-02: Issue 조회 404', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404));
    const result = await jira.getIssue('NONEXIST-1');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('404');
  });

  test('JC-03: JQL 검색', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { issues: [{ key: 'T-1' }], total: 1 }));
    const result = await jira.searchIssues('project = SLM');
    expect(result.success).toBe(true);
    expect(result.data?.issues).toHaveLength(1);
  });

  test('JC-04: Transition 조회', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { transitions: [{ id: '11', name: 'Resolve' }] }));
    const result = await jira.getTransitions('TASK-1');
    expect(result.success).toBe(true);
    expect(result.data?.transitions).toHaveLength(1);
  });

  test('JC-05: Transition 실행', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(204));
    const result = await jira.doTransition('TASK-1', '11');
    expect(result.success).toBe(true);
  });

  test('JC-06: Issue 생성', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { id: '123', key: 'TASK-999' }));
    const result = await jira.createIssue({ summary: 'New Task', project: { key: 'SLM' }, issuetype: { name: 'Task' } });
    expect(result.success).toBe(true);
    expect(result.data?.key).toBe('TASK-999');
  });

  test('JC-07: 필드 목록 조회', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, [{ id: 'cf_101', name: '점검결과', custom: true }]));
    const result = await jira.getFields();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('JC-08: Sprint 목록', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { values: [{ id: 1, name: 'Sprint 14', state: 'active' }] }));
    const result = await jira.getSprints('10');
    expect(result.success).toBe(true);
    expect(result.data?.values).toHaveLength(1);
  });
});

describe('ConfluenceClient', () => {
  let confluence: ConfluenceClient;

  beforeEach(() => {
    mockFetch.mockReset();
    confluence = new ConfluenceClient({ baseUrl: 'https://confluence.test.com', pat: 'pat', maxRetries: 1, retryDelayMs: 10 });
  });

  test('CC-01: 페이지 조회', async () => {
    const page = { id: '1', title: 'test', version: { number: 5 }, body: { storage: { value: '{}' } }, space: { key: 'SLM' }, _links: { webui: '' } };
    mockFetch.mockResolvedValueOnce(mockResponse(200, page));
    const result = await confluence.getPage('1');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('1');
  });

  test('CC-02: 페이지 생성', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { id: '2', title: 'new', version: { number: 1 } }));
    const result = await confluence.createPage('SLM', 'new', '<p>content</p>');
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('2');
  });

  test('CC-03: 페이지 수정', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { id: '1', version: { number: 6 } }));
    const result = await confluence.updatePage('1', 'updated', '<p>new</p>', 5);
    expect(result.success).toBe(true);
  });

  test('CC-04: JSON 파싱', () => {
    const page = {
      id: '1', title: 'test', version: { number: 1 },
      body: { storage: { value: '<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[{"code":"A-001","title":"전기안전점검"}]]></ac:plain-text-body></ac:structured-macro>' } },
      space: { key: 'SLM' }, _links: { webui: '' },
    };
    const json = confluence.parseJsonFromPage(page as any);
    expect(json).toEqual({ code: 'A-001', title: '전기안전점검' });
  });

  test('CC-05: JSON 파싱 실패', () => {
    const page = {
      id: '1', title: 'test', version: { number: 1 },
      body: { storage: { value: '<p>일반 텍스트</p>' } },
      space: { key: 'SLM' }, _links: { webui: '' },
    };
    const json = confluence.parseJsonFromPage(page as any);
    expect(json).toBeNull();
  });

  test('CC-06: JSON 코드블록 래핑', () => {
    const wrapped = confluence.wrapJsonAsCodeBlock({ code: 'A-001' }, 'Process Agent 관리 페이지');
    expect(wrapped).toContain('ac:name="warning"');
    expect(wrapped).toContain('ac:name="code"');
    expect(wrapped).toContain('"code": "A-001"');
    expect(wrapped).toContain('Process Agent');
  });

  test('CC-07: CQL 검색', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { results: [{ id: '1' }] }));
    const result = await confluence.searchCQL('space=SLM');
    expect(result.success).toBe(true);
    expect(result.data?.results).toHaveLength(1);
  });
});
