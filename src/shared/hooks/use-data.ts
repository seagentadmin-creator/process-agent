/**
 * useDataService — Jira 데이터 조회 훅
 * 
 * 연결 상태: dataService.isConnected()
 *   true  → Jira API에서 실시간 데이터 조회
 *   false → Mock 데이터 표시 + 연결 안내
 */
import { useState, useEffect, useCallback } from 'react';
import { dataService, IssueData } from '../../core/data-service';

export function useConnection() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState('');

  useEffect(() => {
    (async () => {
      const config = await dataService.loadConfig();
      if (config) {
        dataService.init();
        const test = await dataService.testConnection();
        setConnected(test.jira);
        setUser(test.user || '');
      }
      setLoading(false);
    })();
  }, []);

  return { connected, loading, user };
}

export function useIssues(type: 'slm' | 'general', projectKey: string) {
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    if (!dataService.isConnected()) return;
    setLoading(true);
    setError('');
    try {
      const data = type === 'slm'
        ? await dataService.getSLMIssues(projectKey)
        : await dataService.getGeneralIssues(projectKey);
      setIssues(data);
    } catch (e: any) {
      setError(e.message || '조회 실패');
    }
    setLoading(false);
  }, [type, projectKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return { issues, loading, error, refetch: fetch };
}
