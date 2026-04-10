import React, { useState } from 'react';
import { SplitPane, SearchInput, StatusBadge, EmptyState, Accordion, Modal } from '../../shared/components';

// === Structure Table View ===
const MOCK_STRUCTURE = [
  { row: 1, key: 'L4-001', summary: '2026년 정기점검', status: '', depth: 0, canCreate: false },
  { row: 2, key: 'L5-201', summary: '전기안전점검', status: 'In Progress', depth: 1, canCreate: true },
  { row: 3, key: 'L6-301', summary: '절연저항상세', status: 'In Progress', depth: 2, canCreate: true },
  { row: 4, key: 'L7-401', summary: '항목A', status: 'In Progress', depth: 3, canCreate: false },
  { row: 5, key: 'L7-402', summary: '항목B', status: 'Done', depth: 3, canCreate: false },
  { row: 6, key: 'L6-302', summary: '접지상태상세', status: 'To Do', depth: 2, canCreate: true },
  { row: 7, key: 'L5-202', summary: '소방설비점검', status: 'Done', depth: 1, canCreate: true },
  { row: 8, key: 'L5-203', summary: '가스누출점검', status: 'To Do', depth: 1, canCreate: true },
];

export const StructureView: React.FC<{ type: 'slm' | 'general' }> = ({ type }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [accordionId, setAccordionId] = useState<string | null>(null);

  const filtered = MOCK_STRUCTURE.filter(r => !keyword || r.summary.includes(keyword) || r.key.includes(keyword));
  const selectedRow = MOCK_STRUCTURE.find(r => r.key === selected);

  const table = (
    <div>
      <div style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
        <SearchInput value={keyword} onChange={setKeyword} placeholder="키워드 검색..." />
      </div>
      <div style={{ fontSize: 11 }}>
        <div style={{ display: 'flex', padding: '4px 8px', background: 'var(--bg-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
          <span style={{ width: 28 }}>#</span><span style={{ width: 70 }}>Key</span><span style={{ flex: 1 }}>Summary</span><span style={{ width: 70, textAlign: 'center' }}>Status</span><span style={{ width: 28 }}></span>
        </div>
        {filtered.map(row => (
          <div key={row.key} onClick={() => setSelected(row.key)}
            style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid var(--bg-tertiary)', cursor: 'pointer', background: selected === row.key ? 'var(--accent)08' : 'transparent' }}>
            <span style={{ width: 28, color: 'var(--text-secondary)' }}>{row.row}</span>
            <span style={{ width: 70, fontSize: 10 }}>{row.key}</span>
            <span style={{ flex: 1, paddingLeft: row.depth * 12 }}>{row.summary}</span>
            <span style={{ width: 70, textAlign: 'center' }}>{row.status && <StatusBadge status={row.status} />}</span>
            <span style={{ width: 28 }}>{row.canCreate && <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>➕</button>}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const preview = selectedRow ? (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{selectedRow.key} {selectedRow.summary}</div>
      {selectedRow.status && <div style={{ marginBottom: 8 }}><StatusBadge status={selectedRow.status} /></div>}
      <Accordion items={[
        ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드</div> }] : []),
        { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이</div> },
        { id: 'ref', icon: '📋', label: '참조', content: <div style={{ fontSize: 11 }}>참조</div> },
      ]} activeId={accordionId} onChange={setAccordionId} />
    </div>
  ) : (
    <EmptyState icon="📐" title="항목을 선택하세요" description="Structure 테이블에서 행을 클릭하세요" />
  );

  return <SplitPane top={table} bottom={preview} storageKey="pa-structure-ratio" />;
};

// === Global Search Modal ===
export const GlobalSearchModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const results = query.length >= 2 ? [
    { key: 'TASK-201', summary: '인덱스 추가', type: 'SLM', status: 'In Progress' },
    { key: 'TASK-098', summary: '전기점검 보고', type: 'SLM', status: 'In Progress' },
    { key: 'TASK-301', summary: 'gzip 적용', type: '일반', status: 'In Progress' },
  ].filter(r => r.summary.includes(query) || r.key.includes(query)) : [];

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', paddingTop: 80, zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 360, background: 'var(--bg-primary)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 과제 검색 (Cmd+K)"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {results.length === 0 && query.length >= 2 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>검색 결과 없음</div>}
          {results.map(r => (
            <div key={r.key} onClick={onClose} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>{r.key}</strong> {r.summary}</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{r.type}</span><StatusBadge status={r.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// === Issue Create Wizard (3-step) ===
export const IssueCreateView: React.FC<{ parentKey: string; parentSummary: string; onClose: () => void; type: 'slm' | 'general' }> = ({ parentKey, parentSummary, onClose, type }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issueType, setIssueType] = useState('SW-Task');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState('홍길동');
  const [created, setCreated] = useState(false);

  if (created) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Issue 생성 완료</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>TASK-999 {summary}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => window.open('#')} style={btnStyle}>🔗 Jira에서 열기</button>
          <button onClick={() => { setCreated(false); setStep(1); setSummary(''); }} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>➕ 추가 생성</button>
          <button onClick={onClose} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>← 목록</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>📝 Issue 생성 ({step}/3)</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>📂 위치: {parentKey} ({parentSummary}) 하위</div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Issue Type
            <select value={issueType} onChange={e => setIssueType(e.target.value)} style={inputStyle}>
              <option>SW-Task</option><option>Task</option><option>Bug</option>
            </select>
          </label>
          <label>Summary<input value={summary} onChange={e => setSummary(e.target.value)} placeholder="제목 입력..." style={inputStyle} /></label>
          <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} /></label>
          <div style={{ textAlign: 'right' }}><button onClick={() => setStep(2)} disabled={!summary} style={btnStyle}>다음 →</button></div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Due Date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} /></label>
          <label>Assignee<input value={assignee} onChange={e => setAssignee(e.target.value)} style={inputStyle} /></label>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>← 이전</button>
            <button onClick={() => setStep(3)} style={btnStyle}>다음 →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 'var(--radius)', fontSize: 11 }}>
            <Row l="Issue Type" r={issueType} /><Row l="Summary" r={summary} /><Row l="Due Date" r={dueDate || '미설정'} />
            <Row l="Assignee" r={assignee} /><Row l="상위 과제" r={parentKey} /><Row l="Status" r="To Do (기본)" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>← 이전</button>
            <button onClick={() => setCreated(true)} style={btnStyle}>✅ 생성</button>
          </div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ l: string; r: string }> = ({ l, r }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{l}</span><span style={{ fontWeight: 500 }}>{r}</span>
  </div>
);

const btnStyle: React.CSSProperties = { padding: '6px 16px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, marginTop: 4 };
