import React, { useState } from 'react';
import { SplitPane, Card, StatusBadge, SearchInput, EmptyState, Accordion } from '../../shared/components';

interface Props { type: 'slm' | 'general'; }

const SLM_TASKS = [
  { key: 'REQ-001', summary: '요구사항 정의서 작성', status: '구현', assignee: '홍길동', dueDate: '2026-04-01', delay: -9, group: 'delay' },
  { key: 'ANL-002', summary: '시스템 분석 보고서', status: '분석', assignee: '홍길동', dueDate: '2026-03-28', delay: -13, group: 'delay' },
  { key: 'DES-003', summary: '아키텍처 설계 검토', status: '설계', assignee: '홍길동', dueDate: '2026-04-15', delay: 5, group: 'week' },
  { key: 'IMP-004', summary: '모듈 구현 - 인증', status: '구현', assignee: '홍길동', dueDate: '2026-04-10', delay: 0, group: 'week' },
  { key: 'TST-005', summary: '통합 테스트 수행', status: '요구사항', assignee: '김철수', dueDate: '2026-04-22', delay: 12, group: 'twoWeeks' },
];

const GENERAL_TASKS = [
  { key: 'EPG-A01', summary: 'Sprint14 백엔드 개발', status: 'In Progress', assignee: '홍길동', dueDate: '2026-04-12', delay: -2, group: 'delay' },
  { key: 'EPG-A02', summary: 'API 연동 테스트', status: 'To Do', assignee: '홍길동', dueDate: '2026-04-18', delay: 8, group: 'twoWeeks' },
  { key: 'EPG-B01', summary: 'UI 리팩토링', status: 'In Progress', assignee: '이영희', dueDate: '2026-04-20', delay: 10, group: 'twoWeeks' },
  { key: 'EPG-B02', summary: '코드 리뷰 반영', status: 'Review', assignee: '김철수', dueDate: '2026-04-14', delay: 4, group: 'week' },
];

// 이전 과제 참조 데이터
const REFERENCE_DATA = [
  { key: 'REQ-R01', summary: '2025 요구사항 정의서', score: 92, fields: ['description', 'attachments', 'components'] },
  { key: 'DES-R02', summary: '2025 아키텍처 설계서', score: 78, fields: ['description', 'labels'] },
  { key: 'IMP-R03', summary: '2025 모듈 구현 결과', score: 65, fields: ['description', 'fixVersions'] },
];

export const TaskListView: React.FC<Props> = ({ type }) => {
  const tasks = type === 'slm' ? SLM_TASKS : GENERAL_TASKS;
  const [selected, setSelected] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [accordionId, setAccordionId] = useState<string | null>(null);
  const [refSelected, setRefSelected] = useState<string | null>(null);
  const [refFields, setRefFields] = useState<string[]>([]);

  const filtered = tasks.filter(t => !keyword || t.summary.includes(keyword) || t.key.includes(keyword));
  const selectedTask = tasks.find(t => t.key === selected);

  const toggleRefField = (f: string) => setRefFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const referenceUI = (
    <div style={{ fontSize: 11 }}>
      <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>유사 과제에서 필드를 복사할 수 있습니다.</div>
      {REFERENCE_DATA.map(r => (
        <div key={r.key} onClick={() => setRefSelected(r.key)} style={{ padding: '6px 8px', border: `1px solid ${refSelected === r.key ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', marginBottom: 4, cursor: 'pointer', background: refSelected === r.key ? 'var(--accent)08' : 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>{r.key} {r.summary}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{r.score}%</span>
          </div>
          {refSelected === r.key && (
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <div style={{ marginBottom: 4, fontWeight: 600 }}>복사할 필드 선택:</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {r.fields.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 4, background: refFields.includes(f) ? 'var(--accent)' : 'var(--bg-secondary)', color: refFields.includes(f) ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 10 }}>
                    <input type="checkbox" checked={refFields.includes(f)} onChange={() => toggleRefField(f)} style={{ display: 'none' }} />{f}
                  </label>
                ))}
              </div>
              {refFields.length > 0 && (
                <button style={{ marginTop: 6, padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>→ 선택 필드 복사 ({refFields.length}개)</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const taskList = (
    <div style={{ padding: 8 }}>
      <div style={{ marginBottom: 8 }}><SearchInput value={keyword} onChange={setKeyword} placeholder="키워드 검색..." /></div>
      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과 없음" description="다른 키워드로 검색해보세요" />
      ) : (
        <>
          <TaskGroup title="🔴 Delay" tasks={filtered.filter(t => t.group === 'delay')} selected={selected} onSelect={setSelected} defaultOpen={false} />
          <TaskGroup title="🟡 7일 이내" tasks={filtered.filter(t => t.group === 'week')} selected={selected} onSelect={setSelected} defaultOpen={false} />
          <TaskGroup title="🟢 14일 이내" tasks={filtered.filter(t => t.group === 'twoWeeks')} selected={selected} onSelect={setSelected} defaultOpen={false} />
        </>
      )}
    </div>
  );

  const preview = selectedTask ? (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700 }}>{selectedTask.key} {selectedTask.summary}</span>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>⭐</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <StatusBadge status={selectedTask.status} /> · {selectedTask.assignee} · 📅 {selectedTask.dueDate}
      </div>
      <Accordion
        items={[
          { id: 'process', icon: '📊', label: 'Process', content: <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>표준 프로세스 Tailoring 시각화<br/>Jira 연동 후 단계별 진행 상태 표시</div> },
          ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 내용이 여기에 표시됩니다.</div> }] : []),
          { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이 패널</div> },
          { id: 'ref', icon: '📋', label: '참조/재사용', content: referenceUI },
          { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 채팅</div> },
        ]}
        activeId={accordionId} onChange={setAccordionId}
      />
    </div>
  ) : (
    <EmptyState icon="📋" title="과제를 선택하세요" description="▲ 상단 그룹을 펼치고 과제를 클릭하세요" action={{ label: '▲ 그룹 펼치기', onClick: () => {} }} />
  );

  return <SplitPane top={taskList} bottom={preview} storageKey="pa-tasklist-ratio" />;
};

const TaskGroup: React.FC<{ title: string; tasks: any[]; selected: string | null; onSelect: (key: string) => void; defaultOpen: boolean }> = ({ title, tasks, selected, onSelect, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
        <span>{title} ({tasks.length}건)</span>
        <span style={{ fontSize: 10 }}>{open ? '▼' : '▶'}</span>
      </div>
      {open && tasks.map((t: any) => (
        <Card key={t.key} selected={selected === t.key} onClick={() => onSelect(t.key)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{t.key} {t.summary}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>📅 {t.dueDate} · {t.delay < 0 ? `${Math.abs(t.delay)}일 지연` : `D-${t.delay}`}</div>
            </div>
            <StatusBadge status={t.status} />
          </div>
        </Card>
      ))}
    </div>
  );
};
