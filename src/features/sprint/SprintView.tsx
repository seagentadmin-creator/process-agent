import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState, useEffect } from 'react';
import { Card, Modal, EmptyState, StatusBadge } from '../../shared/components';
import { dataService } from '../../core/data-service';

interface SprintIssue { key: string; summary: string; assignee: string; dueDate: string; status: string; }

export const SprintView: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [issues, setIssues] = useState<SprintIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ key: string; from: string; to: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!dataService.isConnected()) return;
    setLoading(true);
    (async () => {
      try {
        // boardId는 추후 설정에서 관리
        const stored = await (async () => { try { return await chrome.storage.sync.get(['pa-board-id']); } catch { return chrome.storage.local.get(['pa-board-id']); } })();
        const boardId = (stored['pa-board-id'] as string) || '';
        if (boardId) {
          const data = await dataService.getSprintData(boardId);
          setColumns(data.columns.length > 0 ? data.columns : ['To Do', 'In Progress', 'Review', 'Done']);
          setIssues(data.issues);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (!dataService.isConnected()) {
    return (
      <div style={{ padding: 12 }}>
        <EmptyState icon="🔗" title="Jira에 연결되지 않았습니다" description="⚙️ 설정에서 Jira URL, PAT를 입력하세요." />
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>🔄 Sprint 조회 중...</div>;

  if (issues.length === 0) {
    return (
      <div style={{ padding: 12 }}>
        <EmptyState icon="🏃" title="Sprint 과제가 없습니다" description="활성 Sprint에 과제가 없거나, Board ID가 설정되지 않았습니다." />
        <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
          Board ID는 Jira 보드 URL에서 확인 가능합니다.<br/>
          예: https://jira.company.com/secure/RapidBoard.jspa?rapidView=<b>123</b>
        </div>
      </div>
    );
  }

  const confirmTransition = () => {
    if (!confirmMove) return;
    setIssues(prev => prev.map(i => i.key === confirmMove.key ? { ...i, status: confirmMove.to } : i));
    dataService.transitionIssue(confirmMove.key, confirmMove.to);
    setConfirmMove(null);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const displayCols = columns.length > 0 ? columns : ['To Do', 'In Progress', 'Review', 'Done'];

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 11 }}>
        <span style={{ fontWeight: 600 }}>🏃 Sprint ({issues.length}건)</span>
        <span style={{ color: 'var(--text-secondary)' }}>갱신: {lastUpdate} <button onClick={() => setLastUpdate(new Date().toLocaleTimeString())} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🔄</button></span>
      </div>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {displayCols.map(col => {
          const colIssues = issues.filter(i => i.status === col);
          return (
            <div key={col} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragItem) { const from = issues.find(i => i.key === dragItem)?.status || ''; if (from !== col) setConfirmMove({ key: dragItem, from, to: col }); setDragItem(null); } }}
              style={{ flex: 1, minWidth: 130, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>{col} ({colIssues.length})</div>
              {colIssues.map(issue => (
                <div key={issue.key} draggable onDragStart={() => setDragItem(issue.key)}
                  style={{ padding: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 4, cursor: 'grab', fontSize: 11 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(issue.key); }} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{issue.key}</span></div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{issue.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--text-secondary)' }}>
                    <span>👤{issue.assignee}</span><span>📅{issue.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <Modal open={!!confirmMove} onClose={() => setConfirmMove(null)} title="🔄 Status 변경 확인">
        {confirmMove && (
          <div style={{ fontSize: 12 }}>
            <div style={{ marginBottom: 8 }}><strong>{confirmMove.key}</strong> 를 이동합니다</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><StatusBadge status={confirmMove.from} /><span>→</span><StatusBadge status={confirmMove.to} /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmMove(null)} style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12 }}>취소</button>
              <button onClick={confirmTransition} style={{ padding: '6px 16px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✅ 변경</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
