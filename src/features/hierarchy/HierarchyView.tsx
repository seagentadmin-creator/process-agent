import React, { useState, useCallback } from 'react';
import { SplitPane, SearchInput, StatusBadge, EmptyState, Accordion } from '../../shared/components';

interface TreeNode { key: string; summary: string; status: string; level: string; children: TreeNode[]; }

const MOCK_TREE: TreeNode[] = [
  { key: 'L4-001', summary: '2026년 정기점검', status: '', level: 'L4', children: [
    { key: 'L5-201', summary: '전기안전점검-2공장', status: 'In Progress', level: 'L5', children: [
      { key: 'L6-301', summary: '절연저항상세', status: 'In Progress', level: 'L6', children: [
        { key: 'L7-401', summary: '항목A', status: 'In Progress', level: 'L7', children: [] },
        { key: 'L7-402', summary: '항목B', status: 'Done', level: 'L7', children: [] },
      ]},
      { key: 'L6-302', summary: '접지상태상세', status: 'To Do', level: 'L6', children: [] },
    ]},
    { key: 'L5-202', summary: '소방설비점검-2공장', status: 'Done', level: 'L5', children: [] },
    { key: 'L5-203', summary: '가스누출점검-1공장', status: 'To Do', level: 'L5', children: [] },
  ]},
];

export const HierarchyView: React.FC<{ type: 'slm' | 'general' }> = ({ type }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['L4-001', 'L5-201', 'L6-301']));
  const [accordionId, setAccordionId] = useState<string | null>(null);

  const toggle = useCallback((key: string) => {
    setExpanded(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }, []);

  const matchesFilter = useCallback((node: TreeNode): boolean => {
    if (keyword && !node.summary.toLowerCase().includes(keyword.toLowerCase()) && !node.key.includes(keyword)) {
      return node.children.some(matchesFilter);
    }
    if (statusFilter.length > 0 && node.status && !statusFilter.includes(node.status)) {
      return node.children.some(matchesFilter);
    }
    if (!includeClosed && node.status === 'Closed') return false;
    return true;
  }, [keyword, statusFilter, includeClosed]);

  const countMatches = (nodes: TreeNode[]): number => nodes.reduce((sum, n) => sum + (matchesFilter(n) ? 1 : 0) + countMatches(n.children), 0);
  const totalCount = (nodes: TreeNode[]): number => nodes.reduce((sum, n) => sum + 1 + totalCount(n.children), 0);

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    if (!matchesFilter(node)) return null;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.key);

    return (
      <React.Fragment key={node.key}>
        <div onClick={() => setSelected(node.key)}
          style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', paddingLeft: 8 + depth * 16, cursor: 'pointer', background: selected === node.key ? 'var(--accent)08' : 'transparent', borderLeft: selected === node.key ? '3px solid var(--accent)' : '3px solid transparent', fontSize: 12 }}>
          {hasChildren ? (
            <span onClick={e => { e.stopPropagation(); toggle(node.key); }} style={{ width: 16, cursor: 'pointer', color: 'var(--text-secondary)' }}>{isExpanded ? '▼' : '▶'}</span>
          ) : <span style={{ width: 16 }} />}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.key}: {node.summary}</span>
          {node.status && <StatusBadge status={node.status} />}
        </div>
        {isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  const selectedNode = findNode(MOCK_TREE, selected);

  const tree = (
    <div>
      <div style={{ padding: 8, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SearchInput value={keyword} onChange={setKeyword} placeholder="키워드 검색..." />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, flexWrap: 'wrap' }}>
          <span>Status:</span>
          {['To Do', 'In Progress', 'Review', 'Done'].map(s => (
            <button key={s} onClick={() => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
              style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: statusFilter.includes(s) ? 'var(--accent)' : 'var(--bg-secondary)', color: statusFilter.includes(s) ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 10 }}>{s}</button>
          ))}
          <label style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
            <input type="checkbox" checked={includeClosed} onChange={e => setIncludeClosed(e.target.checked)} /> Close 포함
          </label>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>적용: {countMatches(MOCK_TREE)}건 / 전체 {totalCount(MOCK_TREE)}건</span>
          <button onClick={() => { setKeyword(''); setStatusFilter([]); setIncludeClosed(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 10 }}>🔄 초기화</button>
        </div>
      </div>
      <div>{MOCK_TREE.map(node => renderNode(node, 0))}</div>
    </div>
  );

  const preview = selectedNode ? (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedNode.key} {selectedNode.summary}</div>
      {selectedNode.status && <div style={{ marginBottom: 8 }}><StatusBadge status={selectedNode.status} /></div>}
      <Accordion
        items={[
          ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 내용</div> }] : []),
          { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이</div> },
          { id: 'ref', icon: '📋', label: '참조', content: <div style={{ fontSize: 11 }}>이전 과제 참조</div> },
          { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 질문</div> },
        ]}
        activeId={accordionId} onChange={setAccordionId}
      />
    </div>
  ) : (
    <EmptyState icon="🌳" title="과제를 선택하세요" description="트리에서 과제를 클릭하면 상세 정보를 확인할 수 있습니다" />
  );

  return <SplitPane top={tree} bottom={preview} storageKey="pa-hierarchy-ratio" />;
};

function findNode(nodes: TreeNode[], key: string | null): TreeNode | null {
  if (!key) return null;
  for (const n of nodes) {
    if (n.key === key) return n;
    const found = findNode(n.children, key);
    if (found) return found;
  }
  return null;
}
