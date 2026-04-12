import React, { useState, useCallback } from 'react';
import { SplitPane, SearchInput, StatusBadge, EmptyState, Accordion } from '../../shared/components';

interface TreeNode { key: string; summary: string; status: string; level: string; children: TreeNode[]; }

const MOCK_TREE: TreeNode[] = [
  { key: 'L4-001', summary: '2026 SW 생명주기 관리', status: '', level: 'L4', children: [
    { key: 'REQ-001', summary: '요구사항 정의서 작성', status: '구현', level: 'L5', children: [
      { key: 'REQ-001-A', summary: '기능 요구사항 상세', status: '구현', level: 'L6', children: [] },
      { key: 'REQ-001-B', summary: '비기능 요구사항 상세', status: '완료', level: 'L6', children: [] },
    ]},
    { key: 'ANL-002', summary: '시스템 분석 보고서', status: '구현', level: 'L5', children: [
      { key: 'ANL-002-A', summary: '현행 시스템 분석', status: '완료', level: 'L6', children: [] },
    ]},
    { key: 'DES-003', summary: '아키텍처 설계 검토', status: '요구사항', level: 'L5', children: [] },
    { key: 'IMP-004', summary: '모듈 구현 - 인증', status: '구현', level: 'L5', children: [] },
    { key: 'TST-005', summary: '통합 테스트 수행', status: '요구사항', level: 'L5', children: [] },
  ]},
];

export const HierarchyView: React.FC<{ type: 'slm' | 'general'; viewMode?: 'tree' | 'table' | 'unified' }> = ({ type, viewMode = 'unified' }) => {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [accordionId, setAccordionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'tree' | 'table'>(viewMode === 'table' ? 'table' : 'tree');

  const toggle = useCallback((key: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const expandAll = () => {
    const keys = new Set<string>();
    const collect = (nodes: TreeNode[]) => nodes.forEach(n => { keys.add(n.key); collect(n.children); });
    collect(MOCK_TREE);
    setExpanded(keys);
  };

  const matchesFilter = useCallback((node: TreeNode): boolean => {
    if (keyword && !node.summary.toLowerCase().includes(keyword.toLowerCase()) && !node.key.includes(keyword)) return node.children.some(matchesFilter);
    if (statusFilter.length > 0 && node.status && !statusFilter.includes(node.status)) return node.children.some(matchesFilter);
    if (!includeClosed && node.status === 'Closed') return false;
    return true;
  }, [keyword, statusFilter, includeClosed]);

  const flatNodes: { node: TreeNode; depth: number }[] = [];
  const flatten = (nodes: TreeNode[], depth: number) => {
    nodes.forEach(n => { if (matchesFilter(n)) { flatNodes.push({ node: n, depth }); if (expanded.has(n.key)) flatten(n.children, depth + 1); } });
  };
  flatten(MOCK_TREE, 0);

  const selectedNode = flatNodes.find(f => f.node.key === selected)?.node;

  const toolbar = (
    <div style={{ padding: 8, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ flex: 1 }}><SearchInput value={keyword} onChange={setKeyword} placeholder="검색..." /></div>
        <button onClick={() => setMode(mode === 'tree' ? 'table' : 'tree')} style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 10 }}>{mode === 'tree' ? '📐 Table' : '🌳 Tree'}</button>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, flexWrap: 'wrap' }}>
        {type === 'slm' ? ['요구사항', '분석', '설계', '구현', '테스트', '검증', '완료'] : ['To Do', 'In Progress', 'Review', 'Done'].map(s => (
          <button key={s} onClick={() => setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
            style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: statusFilter.includes(s) ? 'var(--accent)' : 'var(--bg-secondary)', color: statusFilter.includes(s) ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 10 }}>{s}</button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input type="checkbox" checked={includeClosed} onChange={e => setIncludeClosed(e.target.checked)} /> Close
        </label>
        <button onClick={expandAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 10 }}>전체 펼치기</button>
        <button onClick={() => setExpanded(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 10 }}>전체 접기</button>
        <button onClick={() => { setKeyword(''); setStatusFilter([]); setIncludeClosed(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 10 }}>🔄 초기화</button>
      </div>
    </div>
  );

  const treeView = (
    <div>
      {toolbar}
      {mode === 'tree' ? (
        <div>{flatNodes.map(({ node, depth }) => {
          const hasChildren = node.children.length > 0;
          const isExpanded = expanded.has(node.key);
          return (
            <div key={node.key} onClick={() => setSelected(node.key)}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', paddingLeft: 8 + depth * 16, cursor: 'pointer', background: selected === node.key ? 'var(--accent)08' : 'transparent', borderLeft: selected === node.key ? '3px solid var(--accent)' : '3px solid transparent', fontSize: 12 }}>
              {hasChildren ? <span onClick={e => { e.stopPropagation(); toggle(node.key); }} style={{ width: 16, cursor: 'pointer', color: 'var(--text-secondary)' }}>{isExpanded ? '▼' : '▶'}</span> : <span style={{ width: 16 }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.key}: {node.summary}</span>
              {node.status && <StatusBadge status={node.status} />}
            </div>
          );
        })}</div>
      ) : (
        <div style={{ fontSize: 11 }}>
          <div style={{ display: 'flex', padding: '4px 8px', background: 'var(--bg-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
            <span style={{ width: 28 }}>#</span><span style={{ width: 80 }}>Key</span><span style={{ flex: 1 }}>Summary</span><span style={{ width: 80, textAlign: 'center' }}>Status</span>
          </div>
          {flatNodes.map(({ node, depth }, i) => (
            <div key={node.key} onClick={() => setSelected(node.key)}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid var(--bg-tertiary)', cursor: 'pointer', background: selected === node.key ? 'var(--accent)08' : 'transparent' }}>
              <span style={{ width: 28, color: 'var(--text-secondary)' }}>{i + 1}</span>
              <span style={{ width: 80, fontSize: 10 }}>{node.key}</span>
              <span style={{ flex: 1, paddingLeft: depth * 12 }}>
                {node.children.length > 0 && <span onClick={e => { e.stopPropagation(); toggle(node.key); }} style={{ cursor: 'pointer', marginRight: 4 }}>{expanded.has(node.key) ? '▼' : '▶'}</span>}
                {node.summary}
              </span>
              <span style={{ width: 80, textAlign: 'center' }}>{node.status && <StatusBadge status={node.status} />}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const preview = selectedNode ? (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedNode.key} {selectedNode.summary}</div>
      {selectedNode.status && <div style={{ marginBottom: 8 }}><StatusBadge status={selectedNode.status} /></div>}
      <Accordion items={[
        ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 내용</div> }] : []),
        { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이</div> },
        { id: 'ref', icon: '📋', label: '참조', content: <div style={{ fontSize: 11 }}>이전 과제 참조</div> },
        { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 질문</div> },
      ]} activeId={accordionId} onChange={setAccordionId} />
    </div>
  ) : (
    <EmptyState icon="🌳" title="과제를 선택하세요" description="상단에서 ▶를 클릭하여 펼치고, 과제를 선택하세요" action={{ label: '▲ 전체 펼치기', onClick: expandAll }} />
  );

  return <SplitPane top={treeView} bottom={preview} storageKey="pa-hierarchy-ratio" />;
};
