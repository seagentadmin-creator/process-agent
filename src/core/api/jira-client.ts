import { BaseClient, BaseClientConfig } from './base-client';
import { JiraIssue, JiraTransition, JiraField, Result } from '../../core/types';

export class JiraClient extends BaseClient {
  constructor(config: BaseClientConfig) {
    super(config);
  }

  async getIssue(key: string, fields?: string[]): Promise<Result<JiraIssue>> {
    const fieldParam = fields ? `?fields=${fields.join(',')}` : '';
    return this.request<JiraIssue>(`/rest/api/2/issue/${key}${fieldParam}`);
  }

  async searchIssues(jql: string, maxResults = 50, startAt = 0, fields?: string[]): Promise<Result<{ issues: JiraIssue[]; total: number }>> {
    return this.request('/rest/api/2/search', {
      method: 'POST',
      body: { jql, maxResults, startAt, fields: fields ?? ['summary', 'status', 'assignee', 'duedate', 'issuetype', 'priority', 'description', 'created', 'updated', 'resolutiondate', 'components', 'labels', 'attachment'] },
    });
  }

  async getTransitions(issueKey: string): Promise<Result<{ transitions: JiraTransition[] }>> {
    return this.request(`/rest/api/2/issue/${issueKey}/transitions`);
  }

  async doTransition(issueKey: string, transitionId: string, fields?: Record<string, any>): Promise<Result<void>> {
    const body: any = { transition: { id: transitionId } };
    if (fields) body.fields = fields;
    return this.request(`/rest/api/2/issue/${issueKey}/transitions`, { method: 'POST', body });
  }

  async updateIssue(issueKey: string, fields: Record<string, any>): Promise<Result<void>> {
    return this.request(`/rest/api/2/issue/${issueKey}`, { method: 'PUT', body: { fields } });
  }

  async createIssue(fields: Record<string, any>): Promise<Result<{ id: string; key: string }>> {
    return this.request('/rest/api/2/issue', { method: 'POST', body: { fields } });
  }

  async addComment(issueKey: string, body: string): Promise<Result<any>> {
    return this.request(`/rest/api/2/issue/${issueKey}/comment`, { method: 'POST', body: { body } });
  }

  async addWatcher(issueKey: string, username: string): Promise<Result<void>> {
    return this.request(`/rest/api/2/issue/${issueKey}/watchers`, { method: 'POST', body: `"${username}"` });
  }

  async getFields(): Promise<Result<JiraField[]>> {
    return this.request<JiraField[]>('/rest/api/2/field');
  }

  async setIssueProperty(issueKey: string, propertyKey: string, value: any): Promise<Result<void>> {
    return this.request(`/rest/api/2/issue/${issueKey}/properties/${propertyKey}`, { method: 'PUT', body: value });
  }

  async getSprints(boardId: string): Promise<Result<{ values: any[] }>> {
    return this.request(`/rest/agile/1.0/board/${boardId}/sprint`);
  }

  async getSprintIssues(sprintId: string): Promise<Result<{ issues: JiraIssue[] }>> {
    return this.request(`/rest/agile/1.0/sprint/${sprintId}/issue`);
  }

  async getBoardConfig(boardId: string): Promise<Result<any>> {
    return this.request(`/rest/agile/1.0/board/${boardId}/configuration`);
  }

  async getCurrentUser(): Promise<Result<any>> {
    return this.request('/rest/api/2/myself');
  }
}
