/**
 * Issue Key → Jira 링크 생성
 * Jira URL은 설정에서 가져옴
 */
export function getJiraIssueUrl(issueKey: string, jiraBaseUrl?: string): string {
  const base = jiraBaseUrl || 'https://jira.company.com';
  return `${base}/browse/${issueKey}`;
}

export function openJiraIssue(issueKey: string, jiraBaseUrl?: string): void {
  window.open(getJiraIssueUrl(issueKey, jiraBaseUrl), '_blank');
}
