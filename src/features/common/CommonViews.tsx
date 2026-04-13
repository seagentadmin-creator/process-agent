import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState } from 'react';
import { SplitPane, SearchInput, StatusBadge, EmptyState, Accordion, Modal } from '../../shared/components';
import { dataService } from '../../core/data-service';

// === Global Search Modal ===
export const GlobalSearchModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const results = query.length >= 2 ? [
    { key: 'DES-003', summary: '아키텍처 설계 검토', type: 'SLM', status: 'In Progress' },
    { key: 'REQ-001', summary: '요구사항 정의서 작성', type: 'SLM', status: 'In Progress' },
    { key: 'IMP-004', summary: '모듈 구현 - 인증', type: '일반', status: 'In Progress' },
  ].filter(r => r.summary.includes(query) || r.key.includes(query)) : [];

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', paddingTop: 80, zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 360, background: 'var(--bg-primary)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="🔍 과제 검색 (Ctrl+F)"
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
export const IssueCreateView: React.FC<{ parentKey: string; parentSummary: string; onClose: () => void; type: 'slm' | 'general'; defaultComponent?: string }> = ({ parentKey, parentSummary, onClose, type, defaultComponent = 'Common' }) => {
  const ISSUE_TYPES = ['SW-Task', 'Requirement', 'Defect', 'Task', 'Sub-Task', 'Epic', 'Story'];
  const STATUS_MAP: Record<string, string[]> = {
    'SW-Task': ['To Do', 'In Progress', 'Review', 'Done'],
    'Requirement': ['Draft', 'Review', 'Approved', 'Closed'],
    'Defect': ['Open', 'In Progress', 'Fixed', 'Verified', 'Closed'],
    'Task': ['To Do', 'In Progress', 'Done'],
    'Sub-Task': ['To Do', 'In Progress', 'Done'],
    'Epic': ['To Do', 'In Progress', 'Done'],
    'Story': ['To Do', 'In Progress', 'Review', 'Done'],
  };

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [issueType, setIssueType] = useState('SW-Task');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [component, setComponent] = useState(defaultComponent);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [assignee, setAssignee] = useState('홍길동');
  const [created, setCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState('');
  const [createError, setCreateError] = useState('');

  const showComponent = issueType === 'SW-Task';
  const statuses = STATUS_MAP[issueType] || ['To Do', 'In Progress', 'Done'];
  const defaultStatus = statuses[0];

  if (created) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Issue 생성 완료</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{createdKey} {summary}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => openJiraIssue(createdKey)} style={btnStyle}>🔗 Jira에서 열기</button>
          <button onClick={() => { setCreated(false); setStep(1); setSummary(''); setDescription(''); setCreatedKey(''); }} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>➕ 추가 생성</button>
          <button onClick={onClose} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>← 목록</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>📝 Issue 생성 ({step}/3)</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>✕</button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>📂 상위: {parentKey} ({parentSummary})</div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Issue Type
            <select value={issueType} onChange={e => setIssueType(e.target.value)} style={inputStyle}>
              {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '3px 8px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)' }}>
            Status: {statuses.map((s, i) => <span key={s}>{i > 0 ? ' → ' : ''}<span style={{ fontWeight: 600 }}>{s}</span></span>)}
          </div>
          <label>Summary<input value={summary} onChange={e => setSummary(e.target.value)} placeholder="제목 입력..." style={inputStyle} autoFocus /></label>
          <label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="상세 내용..." style={{ ...inputStyle, resize: 'vertical' }} /></label>
          {showComponent && (
            <label>Component
              <input value={component} onChange={e => setComponent(e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>⚙️ 설정에서 기본값 변경 가능</div>
            </label>
          )}
          <div style={{ textAlign: 'right' }}><button onClick={() => setStep(2)} disabled={!summary} style={{ ...btnStyle, opacity: summary ? 1 : 0.5 }}>다음 →</button></div>
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
            <Row l="Issue Type" r={issueType} />
            <Row l="Summary" r={summary} />
            {showComponent && <Row l="Component" r={component} />}
            <Row l="Due Date" r={dueDate || '미설정'} />
            <Row l="Assignee" r={assignee} />
            <Row l="상위 과제" r={parentKey} />
            <Row l="초기 Status" r={defaultStatus} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} style={{ ...btnStyle, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>← 이전</button>
            <button onClick={async () => {
              setCreating(true); setCreateError('');
              const fields: Record<string, any> = {
                project: { key: parentKey.split('-')[0] || parentKey },
                issuetype: { name: issueType },
                summary,
                description,
                parent: { key: parentKey },
              };
              if (dueDate) fields.duedate = dueDate;
              if (assignee) fields.assignee = { name: assignee };
              if (showComponent && component) fields.components = [{ name: component }];
              const result = await dataService.createIssue(fields);
              setCreating(false);
              if (result.success && result.key) { setCreatedKey(result.key); setCreated(true); }
              else { setCreateError(result.error || '생성 실패'); }
            }} disabled={creating} style={{ ...btnStyle, opacity: creating ? 0.5 : 1 }}>{creating ? '⏳ 생성 중...' : '✅ 생성'}</button>
          </div>
          {createError && <div style={{ marginTop: 8, padding: '6px 10px', background: '#f8d7da', borderRadius: 'var(--radius)', fontSize: 11, color: '#842029' }}>❌ {createError}</div>}
          {!dataService.isConnected() && <div style={{ marginTop: 8, padding: '6px 10px', background: '#fff3cd', borderRadius: 'var(--radius)', fontSize: 11, color: '#856404' }}>⚠️ Jira 미연결 — ⚙️ 설정에서 연결하세요</div>}
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
