import React, { useState } from 'react';
import { SplitPane, Card, StatusBadge, SearchInput, EmptyState, Accordion } from '../../shared/components';

interface Props { type: 'slm' | 'general'; }

// Mock data for UI demonstration
const MOCK_TASKS = [
  { key: 'TASK-098', summary: '전기점검 보고', status: 'In Progress', assignee: '홍길동', dueDate: '2026-04-01', delay: -9, group: 'delay' },
  { key: 'TASK-077', summary: '소방설비 검토', status: 'In Progress', assignee: '홍길동', dueDate: '2026-03-28', delay: -13, group: 'delay' },
  { key: 'TASK-201', summary: '인덱스 추가', status: 'In Progress', assignee: '홍길동', dueDate: '2026-04-15', delay: 5, group: 'week' },
  { key: 'TASK-150', summary: '배관압력 시험', status: 'To Do', assignee: '홍길동', dueDate: '2026-04-22', delay: 12, group: 'twoWeeks' },
];

export const TaskListView: React.FC<Props> = ({ type }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [accordionId, setAccordionId] = useState<string | null>(null);

  const filtered = MOCK_TASKS.filter(t => !keyword || t.summary.includes(keyword));
  const selectedTask = MOCK_TASKS.find(t => t.key === selected);

  const taskList = (
    <div style={{ padding: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <SearchInput value={keyword} onChange={setKeyword} placeholder="키워드 검색..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과 없음" description="다른 키워드로 검색해보세요" />
      ) : (
        <>
          <TaskGroup title="🔴 Delay" tasks={filtered.filter(t => t.group === 'delay')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="🟡 7일 이내" tasks={filtered.filter(t => t.group === 'week')} selected={selected} onSelect={setSelected} />
          <TaskGroup title="🟢 14일 이내" tasks={filtered.filter(t => t.group === 'twoWeeks')} selected={selected} onSelect={setSelected} />
        </>
      )}
    </div>
  );

  const preview = selectedTask ? (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700 }}>{selectedTask.key} {selectedTask.summary}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>⭐</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔗</button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>⛶</button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
        <StatusBadge status={selectedTask.status} /> · {selectedTask.assignee} · Due: {selectedTask.dueDate} ({selectedTask.delay < 0 ? `${Math.abs(selectedTask.delay)}일 지연` : `D-${selectedTask.delay}`})
      </div>

      <Accordion
        items={[
          ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 내용이 여기에 표시됩니다.</div> }] : []),
          { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이 패널</div> },
          { id: 'ref', icon: '📋', label: '참조', content: <div style={{ fontSize: 11 }}>이전 과제 참조/복사</div> },
          { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 채팅</div> },
        ]}
        activeId={accordionId}
        onChange={setAccordionId}
      />
    </div>
  ) : (
    <EmptyState icon="📋" title="과제를 선택하세요" description="목록에서 과제를 클릭하면 상세 정보를 확인할 수 있습니다" />
  );

  return <SplitPane top={taskList} bottom={preview} storageKey="pa-tasklist-ratio" />;
};

const TaskGroup: React.FC<{ title: string; tasks: typeof MOCK_TASKS; selected: string | null; onSelect: (key: string) => void }> = ({ title, tasks, selected, onSelect }) => {
  const [collapsed, setCollapsed] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setCollapsed(!collapsed)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}>
        <span>{title} ({tasks.length}건)</span>
        <span>{collapsed ? '▶' : '▼'}</span>
      </div>
      {!collapsed && tasks.map(t => (
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
