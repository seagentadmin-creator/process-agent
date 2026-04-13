import { saveSettings as storageSave, loadSettings as storageLoad } from "./storage-helper";
/**
 * DataService — Settings 기반 Jira/Confluence 연결 및 데이터 조회
 * 
 * Flow:
 *   Settings (Jira URL + PAT) → chrome.storage 저장
 *   → DataService.init() → JiraClient/ConfluenceClient 생성
 *   → searchIssues(JQL) → Feature View에 데이터 전달
 */
import { JiraClient } from './api/jira-client';
import { ConfluenceClient } from './api/confluence-client';


export interface ConnectionConfig {
  jiraUrl: string;
  confluenceUrl: string;
  pat: string;
}

export interface IssueData {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  dueDate: string;
  issueType: string;
  components: string[];
  delay: number; // 음수 = 지연
  group: 'delay' | 'week' | 'twoWeeks' | 'done' | 'other';
}

export class DataService {
  private jira: JiraClient | null = null;
  private confluence: ConfluenceClient | null = null;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private config: ConnectionConfig | null = null;

  constructor() {
  }

  /** Settings에서 저장된 연결 정보 로드 */
  async loadConfig(): Promise<ConnectionConfig | null> {
    try {
      const result = await storageLoad(["pa-jira-url", "pa-confluence-url", "pa-pat"]);
      if (result['pa-jira-url'] && result['pa-pat']) {
        this.config = {
          jiraUrl: result['pa-jira-url'] as string,
          confluenceUrl: result['pa-confluence-url'] as string || '',
          pat: result['pa-pat'] as string,
        };
        return this.config;
      }
    } catch {}
    return null;
  }

  /** 연결 정보 저장 */
  async saveConfig(config: ConnectionConfig): Promise<void> {
    this.config = config;
    try {
      await storageSave({
        'pa-jira-url': config.jiraUrl,
        'pa-confluence-url': config.confluenceUrl,
        'pa-pat': config.pat,
      });
    } catch {}
    this.init();
  }

  /** API Client 초기화 */
  init(): boolean {
    if (!this.config || !this.config.jiraUrl || !this.config.pat) return false;
    this.jira = new JiraClient({ baseUrl: this.config.jiraUrl, pat: this.config.pat });
    if (this.config.confluenceUrl) {
      this.confluence = new ConfluenceClient({ baseUrl: this.config.confluenceUrl, pat: this.config.pat });
    }
    return true;
  }

  isConnected(): boolean {
    return this.jira !== null;
  }

  /** SLM 과제 조회 — Structure 기반 L5/L6 과제 */
  async getSLMIssues(projectKey: string): Promise<IssueData[]> {
    if (!this.jira) return [];
    const cacheKey = `slm-issues-${projectKey}`;
    const cached = this.cacheGet(cacheKey);
    if (cached) return cached;

    const jql = `project = ${projectKey} AND issuetype in (SW-Task, Requirement, Defect, Task, Sub-Task, Story) ORDER BY duedate ASC`;
    const result = await this.jira.searchIssues(jql, 200, 0, ['summary', 'status', 'assignee', 'duedate', 'issuetype', 'components']);
    if (!result.success || !result.data) return [];

    const issues = result.data.issues.map(i => this.mapIssue(i));
    this.cacheSet(cacheKey, issues);
    return issues;
  }

  /** 일반 과제 조회 — Sprint/Epic 기반 */
  async getGeneralIssues(projectKey: string, sprintId?: string): Promise<IssueData[]> {
    if (!this.jira) return [];
    const cacheKey = `general-issues-${projectKey}-${sprintId || 'all'}`;
    const cached = this.cacheGet(cacheKey);
    if (cached) return cached;

    let jql = `project = ${projectKey}`;
    if (sprintId) {
      jql += ` AND sprint = ${sprintId}`;
    }
    jql += ` ORDER BY duedate ASC`;
    const result = await this.jira.searchIssues(jql, 200, 0, ['summary', 'status', 'assignee', 'duedate', 'issuetype', 'components']);
    if (!result.success || !result.data) return [];

    const issues = result.data.issues.map(i => this.mapIssue(i));
    this.cacheSet(cacheKey, issues);
    return issues;
  }

  /** Structure 계층 조회 */
  async getStructure(structureId: string): Promise<any[]> {
    if (!this.jira) return [];
    // Structure for Jira REST API
    // GET /rest/structure/2.0/structure/{id}/forest
    // Fallback: JQL로 Epic-Link / Parent 기반 계층 구성
    return [];
  }

  /** Issue 생성 */
  async createIssue(fields: Record<string, any>): Promise<{ success: boolean; key?: string; error?: string }> {
    if (!this.jira) return { success: false, error: 'Not connected' };
    const result = await this.jira.createIssue(fields);
    if (result.success && result.data) {
      this.cache.clear(); // 캐시 무효화
      return { success: true, key: result.data.key };
    }
    return { success: false, error: result.error?.message || 'Unknown error' };
  }

  /** Status 전이 */
  async transitionIssue(issueKey: string, transitionId: string): Promise<boolean> {
    if (!this.jira) return false;
    const result = await this.jira.doTransition(issueKey, transitionId);
    if (result.success) this.cache.clear();
    return result.success;
  }

  /** Confluence 설정 조회 */
  async getConfig(spaceKey: string, pageTitle: string): Promise<any> {
    if (!this.confluence) return null;
    const result = await this.confluence.getPageByTitle(spaceKey, pageTitle);
    if (!result.success || !result.data) return null;
    try {
      const match = result.data.body?.storage?.value?.match(/<ac:structured-macro[^>]*ac:name="code"[^>]*>.*?<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
      return match ? JSON.parse(match[1]) : null;
    } catch { return null; }
  }

  /** 연결 테스트 */
  async testConnection(): Promise<{ jira: boolean; confluence: boolean; user?: string }> {
    let jiraOk = false, confOk = false, userName = '';
    if (this.jira) {
      const r = await this.jira.getCurrentUser();
      jiraOk = r.success;
      if (r.data) userName = r.data.displayName || r.data.name || '';
    }
    if (this.confluence) {
      const r = await this.confluence.searchCQL('type=page', 1);
      confOk = r.success;
    }
    return { jira: jiraOk, confluence: confOk, user: userName };
  }

  /** Issue 데이터 매핑 */
  private cacheGet(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { this.cache.delete(key); return null; }
    return entry.data;
  }

  private cacheSet(key: string, data: any, ttlMs = 10 * 60 * 1000): void {
    this.cache.set(key, { data, expires: Date.now() + ttlMs });
  }

  private mapIssue(raw: any): IssueData {
    const dueDate = raw.fields?.duedate || '';
    const now = new Date();
    const due = dueDate ? new Date(dueDate) : null;
    const diffDays = due ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : 999;
    const statusName = raw.fields?.status?.name || '';
    const doneStatuses = ['Done', 'Closed', '완료'];
    const isDone = doneStatuses.includes(statusName);

    let group: IssueData['group'] = 'other';
    if (isDone) group = 'done';
    else if (diffDays < 0) group = 'delay';
    else if (diffDays <= 7) group = 'week';
    else if (diffDays <= 14) group = 'twoWeeks';

    return {
      key: raw.key,
      summary: raw.fields?.summary || '',
      status: statusName,
      assignee: raw.fields?.assignee?.displayName || '미배정',
      dueDate: dueDate,
      issueType: raw.fields?.issuetype?.name || '',
      components: (raw.fields?.components || []).map((c: any) => c.name),
      delay: diffDays,
      group,
    };
  }

  /** 계층 구조 조회 — parent 기반 트리 구성 */
  async getIssueTree(projectKey: string): Promise<{ key: string; summary: string; status: string; level: string; children: any[] }[]> {
    if (!this.jira) return [];
    const cacheKey = `tree-${projectKey}`;
    const cached = this.cacheGet(cacheKey);
    if (cached) return cached;

    const jql = `project = ${projectKey} ORDER BY rank ASC`;
    const result = await this.jira.searchIssues(jql, 500, 0, ['summary', 'status', 'issuetype', 'parent']);
    if (!result.success || !result.data) return [];

    // flat → tree 변환
    const issues = result.data.issues;
    const map = new Map<string, any>();
    issues.forEach((i: any) => {
      map.set(i.key, {
        key: i.key,
        summary: i.fields?.summary || '',
        status: i.fields?.status?.name || '',
        level: i.fields?.issuetype?.name || '',
        children: [],
      });
    });

    const roots: any[] = [];
    issues.forEach((i: any) => {
      const node = map.get(i.key);
      const parentKey = i.fields?.parent?.key;
      if (parentKey && map.has(parentKey)) {
        map.get(parentKey).children.push(node);
      } else {
        roots.push(node);
      }
    });

    this.cacheSet(cacheKey, roots);
    return roots;
  }

  /** Sprint 목록 + 과제 조회 */
  async getSprintData(boardId: string): Promise<{ columns: string[]; issues: any[] }> {
    if (!this.jira) return { columns: [], issues: [] };
    const sprints = await this.jira.getSprints(boardId);
    if (!sprints.success || !sprints.data) return { columns: [], issues: [] };
    const activeSprint = sprints.data.values.find((s: any) => s.state === 'active');
    if (!activeSprint) return { columns: [], issues: [] };
    const sprintIssues = await this.jira.getSprintIssues(activeSprint.id);
    if (!sprintIssues.success || !sprintIssues.data) return { columns: [], issues: [] };
    const cols = [...new Set(sprintIssues.data.issues.map((i: any) => i.fields?.status?.name || 'To Do'))];
    return {
      columns: cols,
      issues: sprintIssues.data.issues.map((i: any) => ({
        key: i.key,
        summary: i.fields?.summary || '',
        status: i.fields?.status?.name || '',
        assignee: i.fields?.assignee?.displayName || '미배정',
        dueDate: i.fields?.duedate || '',
      })),
    };
  }


  /** 메타데이터 조회 */
  async getMetadata(spaceKey: string): Promise<any[]> {
    if (!this.confluence) return [];
    const result = await this.confluence.getPageByTitle(spaceKey, 'PA-META');
    if (!result.success || !result.data) return [];
    try {
      const match = result.data.body?.storage?.value?.match(/<ac:structured-macro[^>]*ac:name="code"[^>]*>.*?<ac:plain-text-body><!\[CDATA\[([\s\S]*?)\]\]><\/ac:plain-text-body>/);
      return match ? JSON.parse(match[1]) : [];
    } catch { return []; }
  }

  /** 메타데이터 저장 */
  async saveMetadata(spaceKey: string, data: any[]): Promise<boolean> {
    if (!this.confluence) return false;
    const page = await this.confluence.getPageByTitle(spaceKey, 'PA-META');
    const json = JSON.stringify(data, null, 2);
    const content = `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[${json}]]></ac:plain-text-body></ac:structured-macro>`;
    if (page.success && page.data) {
      const r = await this.confluence.updatePage(page.data.id, 'PA-META', content, (page.data as any).version?.number + 1 || 2);
      return r.success;
    } else {
      const r = await this.confluence.createPage(spaceKey, 'PA-META', content);
      return r.success;
    }
  }

  /** 버전 매니페스트 조회 */
  async getVersionManifest(spaceKey: string): Promise<any> {
    return this.getConfig(spaceKey, 'PA-MANIFEST');
  }

  /** 버전 매니페스트 저장 */
  async saveVersionManifest(spaceKey: string, manifest: any): Promise<boolean> {
    if (!this.confluence) return false;
    const page = await this.confluence.getPageByTitle(spaceKey, 'PA-MANIFEST');
    const json = JSON.stringify(manifest, null, 2);
    const content = `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[${json}]]></ac:plain-text-body></ac:structured-macro>`;
    if (page.success && page.data) {
      return (await this.confluence.updatePage(page.data.id, 'PA-MANIFEST', content, (page.data as any).version?.number + 1 || 2)).success;
    }
    return (await this.confluence.createPage(spaceKey, 'PA-MANIFEST', content)).success;
  }

  /** Draft 버전 조회 */
  async getDraft(spaceKey: string): Promise<any> {
    return this.getConfig(spaceKey, 'PA-DRAFT');
  }

  /** Draft 저장 */
  async saveDraft(spaceKey: string, draft: any): Promise<boolean> {
    if (!this.confluence) return false;
    const page = await this.confluence.getPageByTitle(spaceKey, 'PA-DRAFT');
    const json = JSON.stringify(draft, null, 2);
    const content = `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[${json}]]></ac:plain-text-body></ac:structured-macro>`;
    if (page.success && page.data) {
      return (await this.confluence.updatePage(page.data.id, 'PA-DRAFT', content, (page.data as any).version?.number + 1 || 2)).success;
    }
    return (await this.confluence.createPage(spaceKey, 'PA-DRAFT', content)).success;
  }

  /** Draft 삭제 (Confluence 페이지 본문 비우기) */
  async deleteDraft(spaceKey: string): Promise<boolean> {
    if (!this.confluence) return false;
    const page = await this.confluence.getPageByTitle(spaceKey, 'PA-DRAFT');
    if (page.success && page.data) {
      return (await this.confluence.updatePage(page.data.id, 'PA-DRAFT', '', (page.data as any).version?.number + 1 || 2)).success;
    }
    return true;
  }

  /** 알림 생성 — Due date 기반 */
  async getAlerts(projectKey: string): Promise<{ id: number; type: string; key: string; msg: string; time: string }[]> {
    if (!this.jira) return [];
    const alerts: any[] = [];
    // 지연 과제
    const delayJql = `project = ${projectKey} AND duedate < now() AND status not in (Done, Closed, 완료) ORDER BY duedate ASC`;
    const delayResult = await this.jira.searchIssues(delayJql, 10, 0, ['summary', 'duedate']);
    if (delayResult.success && delayResult.data) {
      delayResult.data.issues.forEach((i: any, idx: number) => {
        const due = i.fields?.duedate || '';
        const days = due ? Math.abs(Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)) : 0;
        alerts.push({ id: idx + 1, type: 'delay', key: i.key, msg: `${days}일 지연`, time: due });
      });
    }
    // 7일 이내 마감
    const warnJql = `project = ${projectKey} AND duedate <= endOfWeek() AND duedate >= now() AND status not in (Done, Closed, 완료)`;
    const warnResult = await this.jira.searchIssues(warnJql, 10, 0, ['summary', 'duedate']);
    if (warnResult.success && warnResult.data) {
      warnResult.data.issues.forEach((i: any, idx: number) => {
        const due = i.fields?.duedate || '';
        const days = due ? Math.ceil((new Date(due).getTime() - Date.now()) / 86400000) : 0;
        alerts.push({ id: 100 + idx, type: 'warn', key: i.key, msg: `${days}일 후 마감`, time: due });
      });
    }
    return alerts;
  }

  /** KPI 계산 */
  async getKPIMetrics(projectKey: string): Promise<any> {
    if (!this.jira) return null;
    const allResult = await this.jira.searchIssues(`project = ${projectKey}`, 500, 0, ['status', 'duedate', 'resolutiondate', 'created']);
    if (!allResult.success || !allResult.data) return null;
    const issues = allResult.data.issues;
    const total = issues.length;
    const doneStatuses = ['Done', 'Closed', '완료'];
    const done = issues.filter((i: any) => doneStatuses.includes(i.fields?.status?.name || ''));
    const delayed = issues.filter((i: any) => {
      const due = i.fields?.duedate;
      return due && new Date(due) < new Date() && !doneStatuses.includes(i.fields?.status?.name || '');
    });
    // 평균 소요일
    const resolved = done.filter((i: any) => i.fields?.resolutiondate && i.fields?.created);
    const avgDays = resolved.length > 0
      ? (resolved.reduce((s: number, i: any) => s + (new Date(i.fields.resolutiondate).getTime() - new Date(i.fields.created).getTime()) / 86400000, 0) / resolved.length).toFixed(1)
      : '-';

    return {
      total,
      done: done.length,
      completionRate: total > 0 ? Math.round(done.length / total * 100) : 0,
      delayCount: delayed.length,
      delayRate: total > 0 ? Math.round(delayed.length / total * 100) : 0,
      avgDays,
    };
  }

  /** 참조 과제 조회 — 유사 과제 검색 */
  async findSimilarIssues(issueKey: string, projectKey: string): Promise<any[]> {
    if (!this.jira) return [];
    const issueResult = await this.jira.getIssue(issueKey, ['summary', 'issuetype']);
    if (!issueResult.success || !issueResult.data) return [];
    const summary = (issueResult.data as any).fields?.summary || '';
    const issueType = (issueResult.data as any).fields?.issuetype?.name || '';
    // 같은 Issue Type + 키워드 유사 과제
    const words = summary.split(/\s+/).slice(0, 3).join(' ');
    const jql = `project = ${projectKey} AND issuetype = "${issueType}" AND summary ~ "${words}" AND key != ${issueKey} ORDER BY updated DESC`;
    const result = await this.jira.searchIssues(jql, 5, 0, ['summary', 'description', 'components', 'labels', 'attachments']);
    if (!result.success || !result.data) return [];
    return result.data.issues.map((i: any) => ({
      key: i.key,
      summary: i.fields?.summary || '',
      fields: Object.keys(i.fields || {}).filter(k => i.fields[k] && k !== 'summary'),
    }));
  }
}

/** 싱글톤 인스턴스 */
export const dataService = new DataService();
