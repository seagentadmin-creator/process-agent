import React, { useState, useCallback } from 'react';
import { Card, Modal, EmptyState, SearchInput, StatusBadge } from '../../shared/components';

interface SprintIssue { key: string; summary: string; assignee: string; dueDate: string; status: string; }

const MOCK_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'];
const MOCK_ISSUES: SprintIssue[] = [
  { key: 'REQ-010', summary: '요구사항 추적표 작성', assignee: '홍길동', dueDate: '04/20', status: 'To Do' },
  { key: 'ANL-011', summary: '분석 문서 리뷰', assignee: '김철수', dueDate: '04/18', status: 'To Do' },
  { key: 'DES-012', summary: '설계 검증 수행', assignee: '홍길동', dueDate: '04/12', status: 'In Progress' },
  { key: 'IMP-013', summary: '모듈 구현 테스트', assignee: '이영희', dueDate: '04/15', status: 'In Progress' },
  { key: 'IMP-014', summary: '코드 리뷰 반영', assignee: '김철수', dueDate: '04/10', status: 'Review' },
  { key: 'TST-015', summary: '단위 테스트 작성', assignee: '이영희', dueDate: '04/05', status: 'Done' },
  { key: 'TST-016', summary: '통합 테스트 완료', assignee: '김철수', dueDate: '04/03', status: 'Done' },
];

export const SprintView: React.FC = () => {
  const [issues, setIssues] = useState(MOCK_ISSUES);
  const [keyword, setKeyword] = useState('');
  const [assignee, setAssignee] = useState('홍길동');
  const [excludeClosed, setExcludeClosed] = useState(true);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ key: string; from: string; to: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  const filtered = issues.filter(i => {
    if (keyword && !i.summary.includes(keyword) && !i.key.includes(keyword)) return false;
    if (assignee !== '전체' && i.assignee !== assignee) return false;
    if (excludeClosed && i.status === 'Closed') return false;
    return true;
  });

  const handleDrop = useCallback((column: string) => {
    if (!dragItem) return;
    const issue = issues.find(i => i.key === dragItem);
    if (!issue || issue.status === column) return;
    setConfirmMove({ key: dragItem, from: issue.status, to: column });
    setDragItem(null);
  }, [dragItem, issues]);

  const confirmTransition = useCallback(() => {
    if (!confirmMove) return;
    setIssues(prev => prev.map(i => i.key === confirmMove.key ? { ...i, status: confirmMove.to } : i));
    setConfirmMove(null);
    setLastUpdate(new Date().toLocaleTimeString());
  }, [confirmMove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>📌 Sprint 14 (Active)</span>
          <span style={{ color: 'var(--text-secondary)' }}>갱신: {lastUpdate} <button onClick={() => setLastUpdate(new Date().toLocaleTimeString())} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔄</button></span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 100 }}><SearchInput value={keyword} onChange={setKeyword} placeholder="검색..." /></div>
          <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ padding: '4px 6px', fontSize: 11, border: '1px solid var(--border)', borderRadius: 4 }}>
            <option>홍길동</option><option>김철수</option><option>이영희</option><option>전체</option>
          </select>
          <label style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
            <input type="checkbox" checked={excludeClosed} onChange={e => setExcludeClosed(e.target.checked)} /> Close 제외
          </label>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'auto', padding: 6, gap: 6 }}>
        {MOCK_COLUMNS.map(col => {
          const colIssues = filtered.filter(i => i.status === col);
          return (
            <div key={col} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col)}
              style={{ flex: 1, minWidth: 90, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 6, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 6, textAlign: 'center', color: 'var(--text-secondary)' }}>{col} ({colIssues.length})</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {colIssues.map(issue => (
                  <div key={issue.key} draggable onDragStart={() => setDragItem(issue.key)}
                    style={{ padding: 6, background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border)', cursor: 'grab', fontSize: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{issue.key}</div>
                    <div style={{ marginBottom: 2, lineHeight: 1.3 }}>{issue.summary}</div>
                    <div style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>👤{issue.assignee.charAt(0)}</span><span>📅{issue.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!confirmMove} onClose={() => setConfirmMove(null)} title="🔄 Status 변경 확인">
        {confirmMove && (
          <div style={{ fontSize: 12 }}>
            <p><strong>{confirmMove.key}</strong></p>
            <p>{confirmMove.from} → {confirmMove.to}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setConfirmMove(null)} style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', cursor: 'pointer', fontSize: 12 }}>취소</button>
              <button onClick={confirmTransition} style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✅ 변경</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
