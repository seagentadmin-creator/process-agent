import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState, useEffect } from 'react';
import { Card, StatusBadge, EmptyState, Modal } from '../../shared/components';
import { dataService, IssueData } from '../../core/data-service';

interface Props { type: 'slm' | 'general'; projectKey: string; }

export const DashboardView: React.FC<Props> = ({ type, projectKey }) => {
  const [detailModal, setDetailModal] = useState<{ title: string; items: IssueData[] } | null>(null);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dataService.isConnected()) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const data = type === 'slm'
          ? await dataService.getSLMIssues(projectKey)
          : await dataService.getGeneralIssues(projectKey);
        setIssues(data);
      } catch (e: any) {
        setError(e.message || '조회 실패');
      }
      setLoading(false);
    })();
  }, [type, projectKey]);

  // 미연결 상태
  if (!dataService.isConnected()) {
    return (
      <div style={{ padding: 12 }}>
        <EmptyState
          icon="🔗"
          title="Jira에 연결되지 않았습니다"
          description="⚙️ 설정에서 Jira URL, PAT를 입력하고 저장하세요."
        />
        <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>연결 방법:</div>
          <div>1. 우측 상단 ⚙️ 클릭</div>
          <div>2. Jira URL 입력 (예: https://jira.company.com)</div>
          <div>3. PAT (Personal Access Token) 입력</div>
          <div>4. {type === 'slm' ? 'SLM' : '일반'} Project Key 입력 (예: {projectKey || 'PROJ'})</div>
          <div>5. 💾 저장 클릭</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>🔄 {projectKey} 과제 조회 중...</div>;
  }

  if (error) {
    return <div style={{ padding: 12 }}><EmptyState icon="❌" title="조회 실패" description={error} /></div>;
  }

  const doneStatuses = ['완료', 'Done', 'Closed'];
  const isDone = (s: string) => doneStatuses.includes(s);
  const delay = issues.filter(i => i.delay < 0 && !isDone(i.status));
  const week = issues.filter(i => i.delay >= 0 && i.delay <= 7 && !isDone(i.status));
  const twoWeeks = issues.filter(i => i.delay > 7 && i.delay <= 14 && !isDone(i.status));
  const done = issues.filter(i => isDone(i.status));
  const active = issues.filter(i => !isDone(i.status));

  return (
    <div style={{ padding: 12 }}>
      <div style={{ padding: '4px 10px', background: '#d1e7dd', borderRadius: 'var(--radius)', fontSize: 10, color: '#0f5132', marginBottom: 10 }}>
        ✅ {projectKey} 실시간 데이터 ({issues.length}건)
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        <StatCard emoji="🔴" label="지연" value={delay.length} color="var(--danger)" onClick={() => setDetailModal({ title: '🔴 지연', items: delay })} />
        <StatCard emoji="🟡" label="7일 이내" value={week.length} color="var(--warning)" onClick={() => setDetailModal({ title: '🟡 7일 이내', items: week })} />
        <StatCard emoji="🟢" label="14일 이내" value={twoWeeks.length} color="var(--success)" onClick={() => setDetailModal({ title: '🟢 14일 이내', items: twoWeeks })} />
        <StatCard emoji="📋" label="전체" value={issues.length} color="var(--text-secondary)" onClick={() => setDetailModal({ title: '📋 전체', items: issues })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        <StatCard emoji="✅" label="완료" value={done.length} color="var(--accent)" onClick={() => setDetailModal({ title: '✅ 완료', items: done })} />
        <StatCard emoji="📊" label="완료율" value={`${issues.length > 0 ? Math.round(done.length / issues.length * 100) : 0}%`} color="var(--accent)" />
        <StatCard emoji="⏱" label="진행중" value={active.length} color="var(--accent)" onClick={() => setDetailModal({ title: '⏱ 진행중', items: active })} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🔴 긴급 과제</div>
      {delay.length > 0 ? delay.map(t => (
        <Card key={t.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12 }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(t.key); }} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{t.key}</span> {t.summary}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅 {t.dueDate} · {Math.abs(t.delay)}일 지연 · {t.issueType}</div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        </Card>
      )) : <EmptyState icon="🎉" title="긴급 과제 없음" description="모든 과제가 기한 내에 있습니다" />}

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title || ''} width={400}>
        <div style={{ fontSize: 12 }}>
          {detailModal?.items.map(t => (
            <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <div><span onClick={() => openJiraIssue(t.key)} style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{t.key}</span> {t.summary} <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.issueType}</span></div>
              <StatusBadge status={t.status} />
            </div>
          ))}
          {(!detailModal?.items || detailModal.items.length === 0) && <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>해당 과제가 없습니다</div>}
        </div>
      </Modal>
    </div>
  );
};

const StatCard: React.FC<{ emoji: string; label: string; value: string | number; color: string; onClick?: () => void }> = ({ emoji, label, value, color, onClick }) => (
  <div onClick={onClick} style={{ padding: 8, border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', background: 'var(--bg-secondary)', cursor: onClick ? 'pointer' : 'default' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{emoji} {label}</div>
  </div>
);
