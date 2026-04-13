import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState, useEffect } from 'react';
import { dataService, IssueData } from '../../core/data-service';
import { SplitPane, Card, StatusBadge, SearchInput, EmptyState, Accordion } from '../../shared/components';

interface Props { type: 'slm' | 'general'; projectKey: string; }


export const TaskListView: React.FC<Props> = ({ type, projectKey }) => {
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [accordionId, setAccordionId] = useState<string | null>(null);
  const [refSelected, setRefSelected] = useState<string | null>(null);
  const [refFields, setRefFields] = useState<string[]>([]);
  const [refData, setRefData] = useState<any[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  useEffect(() => {
    if (!dataService.isConnected()) return;
    setLoading(true);
    (async () => {
      try {
        const data = type === 'slm'
          ? await dataService.getSLMIssues(projectKey)
          : await dataService.getGeneralIssues(projectKey);
        setIssues(data);
      } catch {}
      setLoading(false);
    })();
  }, [type, projectKey]);

  // 참조 과제 로드 (과제 선택 + 참조 탭 열림 시)
  useEffect(() => {
    if (!selected || accordionId !== 'ref' || !dataService.isConnected()) return;
    setRefLoading(true);
    (async () => {
      try {
        const refs = await dataService.findSimilarIssues(selected, projectKey);
        setRefData(refs);
      } catch {}
      setRefLoading(false);
    })();
  }, [selected, accordionId, projectKey]);

  if (!dataService.isConnected()) {
    return (
      <div style={{ padding: 12 }}>
        <EmptyState icon="🔗" title="Jira에 연결되지 않았습니다" description="⚙️ 설정에서 Jira URL, PAT, Project Key를 입력하세요." />
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>🔄 과제 조회 중...</div>;

  const filtered = issues.filter(t => !keyword || t.summary.includes(keyword) || t.key.includes(keyword));
  const selectedTask = issues.find(t => t.key === selected);

  const toggleRefField = (f: string) => setRefFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const referenceUI = (
    <div style={{ fontSize: 11 }}>
      <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>유사 과제에서 필드를 복사할 수 있습니다.</div>
      {refLoading ? <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-secondary)', fontSize: 11 }}>🔄 유사 과제 검색 중...</div>
      : refData.length === 0 ? <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-secondary)', fontSize: 11 }}>유사 과제가 없습니다</div>
      : refData.map(r => (
        <div key={r.key} onClick={() => { setRefSelected(r.key); setRefFields([]); }} style={{ padding: '6px 8px', border: `1px solid ${refSelected === r.key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', marginBottom: 4, cursor: 'pointer', background: refSelected === r.key ? 'var(--accent)08' : 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>{r.key} {r.summary}</span></div>
          {refSelected === r.key && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>복사할 필드:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{r.fields.map(f => (
                <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4, background: refFields.includes(f) ? 'var(--accent)' : 'var(--bg-secondary)', color: refFields.includes(f) ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 10 }}>
                  <input type="checkbox" checked={refFields.includes(f)} onChange={() => toggleRefField(f)} style={{ display: 'none' }} />{f}
                </label>
              ))}</div>
              {refFields.length > 0 && (
                <button onClick={() => { const ref = refData.find(x => x.key === refSelected); const copyText = refFields.map(f => `[${f}] ${ref?.key || ''} → 복사됨`).join('\n'); try { navigator.clipboard.writeText(copyText); } catch {} alert(`${refFields.length}개 필드 복사 완료:\n${refFields.join(', ')}`); }} style={{ marginTop: 6, padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>→ 클립보드 복사 ({refFields.length}개)</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const taskList = (
    <div style={{ padding: 8 }}>
      <div style={{ padding: '4px 8px', background: '#d1e7dd', borderRadius: 'var(--radius)', fontSize: 10, color: '#0f5132', marginBottom: 8 }}>✅ {projectKey} ({issues.length}건)</div>
      <div style={{ marginBottom: 8 }}><SearchInput value={keyword} onChange={setKeyword} placeholder="키워드 검색..." /></div>
      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과 없음" description="다른 키워드로 검색해보세요" />
      ) : (
        <>
          <TaskGroup title="🔴 Delay" tasks={filtered.filter(t => t.group === 'delay')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="🟡 7일 이내" tasks={filtered.filter(t => t.group === 'week')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="🟢 14일 이내" tasks={filtered.filter(t => t.group === 'twoWeeks')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="✅ 완료" tasks={filtered.filter(t => t.group === 'done')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="📋 기타" tasks={filtered.filter(t => t.group === 'other')} selected={selected} onSelect={setSelected} />
        </>
      )}
    </div>
  );

  const preview = selectedTask ? (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700 }}><span onClick={() => openJiraIssue(selectedTask.key)} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{selectedTask.key}</span> {selectedTask.summary}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <StatusBadge status={selectedTask.status} /> · {selectedTask.assignee} · 📅 {selectedTask.dueDate} · {selectedTask.issueType}
        {selectedTask.components.length > 0 && ` · 📦 ${selectedTask.components.join(', ')}`}
      </div>
      <Accordion
        items={[
          { id: 'process', icon: '📊', label: 'Process', content: <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>표준 프로세스 Tailoring 시각화<br/>Confluence 연동 후 단계별 진행 상태 표시</div> },
          ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 — Confluence 연동 후 자동 로드</div> }] : []),
          { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이 — Jira API 연동</div> },
          { id: 'ref', icon: '📋', label: '참조/재사용', content: referenceUI },
          { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 채팅</div> },
        ]}
        activeId={accordionId} onChange={setAccordionId}
      />
    </div>
  ) : (
    <EmptyState icon="📋" title="과제를 선택하세요" description="▲ 상단 그룹을 펼치고 과제를 클릭하세요" />
  );

  return <SplitPane top={taskList} bottom={preview} storageKey="pa-tasklist-ratio" />;
};

const TaskGroup: React.FC<{ title: string; tasks: IssueData[]; selected: string | null; onSelect: (key: string) => void }> = ({ title, tasks, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
        <span>{title} ({tasks.length}건)</span>
        <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span>
      </div>
      {open && tasks.map(t => (
        <Card key={t.key} selected={selected === t.key} onClick={() => onSelect(t.key)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(t.key); }} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{t.key}</span> {t.summary}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>📅 {t.dueDate} · {t.delay < 0 ? `${Math.abs(t.delay)}일 지연` : `D-${t.delay}`} · {t.issueType}</div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        </Card>
      ))}
    </div>
  );
};
