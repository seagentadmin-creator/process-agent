import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState, useCallback, useEffect } from 'react';
import { SplitPane, SearchInput, StatusBadge, EmptyState, Accordion } from '../../shared/components';
import { IssueCreateView } from '../common/CommonViews';
import { dataService } from '../../core/data-service';

interface TreeNode { key: string; summary: string; status: string; level: string; children: TreeNode[]; }

export const HierarchyView: React.FC<{ type: 'slm' | 'general'; viewMode?: 'tree' | 'table' | 'unified'; projectKey?: string }> = ({ type, viewMode = 'unified', projectKey }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [accordionId, setAccordionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'tree' | 'table'>(viewMode === 'table' ? 'table' : 'tree');
  const [createParent, setCreateParent] = useState<{ key: string; summary: string } | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Jira 데이터 로드
  useEffect(() => {
    if (!dataService.isConnected() || !projectKey) return;
    setLoading(true);
    (async () => {
      try {
        const data = await dataService.getIssueTree(projectKey);
        setTreeData(data);
        if (data.length > 0) setExpanded(new Set([data[0].key]));
      } catch {}
      setLoading(false);
    })();
  }, [projectKey]);

  if (!dataService.isConnected()) {
    return (
      <div style={{ padding: 12 }}>
        <EmptyState icon="🔗" title="Jira에 연결되지 않았습니다" description="⚙️ 설정에서 Jira URL, PAT, Project Key를 입력하세요." />
      </div>
    );
  }

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>🔄 Structure 조회 중...</div>;

  const toggle = (key: string) => setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const expandAll = () => { const s = new Set<string>(); const c = (ns: TreeNode[]) => ns.forEach(n => { s.add(n.key); c(n.children); }); c(treeData); setExpanded(s); };

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
  flatten(treeData, 0);

  const selectedNode = flatNodes.find(f => f.node.key === selected)?.node;

  const ALL_STATUSES = type === 'slm'
    ? ['요구사항', '분석', '설계', '구현', '테스트', '검증', '완료']
    : ['To Do', 'In Progress', 'Review', 'Done', 'Open', 'Fixed', 'Verified', 'Draft', 'Approved'];

  const toolbar = (
    <div style={{ padding: 8, borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ padding: '4px 8px', background: '#d1e7dd', borderRadius: 'var(--radius)', fontSize: 10, color: '#0f5132' }}>✅ {projectKey} Structure ({flatNodes.length}건)</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <div style={{ flex: 1 }}><SearchInput value={keyword} onChange={setKeyword} placeholder="검색..." /></div>
        <button onClick={() => setMode(mode === 'tree' ? 'table' : 'tree')} style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 10 }}>{mode === 'tree' ? '📐 Table' : '🌳 Tree'}</button>
      </div>
      {showGuide && statusFilter.length === 0 && (
        <div onClick={() => setShowGuide(false)} style={{ padding: '6px 10px', background: 'linear-gradient(135deg, var(--accent)11, var(--accent)05)', border: '1px dashed var(--accent)', borderRadius: 'var(--radius)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🎯</span>
          <span>아래 Status 버튼을 클릭하면 해당 상태의 과제만 필터링됩니다. 여러 개 선택 가능!</span>
          <span style={{ marginLeft: 'auto', fontSize: 12 }}>✕</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', fontSize: 10, flexWrap: 'wrap' }}>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]); setShowGuide(false); }}
            style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: statusFilter.includes(s) ? 'var(--accent)' : 'var(--bg-secondary)', color: statusFilter.includes(s) ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 10, transition: 'all 0.15s' }}>{s}</button>
        ))}
        <span style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 2px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
          <input type="checkbox" checked={includeClosed} onChange={e => setIncludeClosed(e.target.checked)} style={{ accentColor: 'var(--accent)' }} /> Close
        </label>
        <span style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 2px' }} />
        <button onClick={expandAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 10 }}>전체 펼치기</button>
        <button onClick={() => setExpanded(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 10 }}>전체 접기</button>
        <button onClick={() => { setKeyword(''); setStatusFilter([]); setIncludeClosed(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 10 }}>🔄 초기화</button>
      </div>
      {statusFilter.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>🔍 필터:</span>
          {statusFilter.map(s => <span key={s} style={{ padding: '1px 6px', background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 9 }}>{s}</span>)}
          <button onClick={() => setStatusFilter([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 10 }}>해제</button>
        </div>
      )}
    </div>
  );

  const treeView = (
    <div>
      {toolbar}
      {flatNodes.length === 0 ? (
        <EmptyState icon="📋" title="과제가 없습니다" description="필터 조건을 확인하거나 Jira에서 과제를 생성하세요" />
      ) : mode === 'tree' ? (
        <div>{flatNodes.map(({ node, depth }) => {
          const hasChildren = node.children.length > 0;
          const isExpanded = expanded.has(node.key);
          return (
            <div key={node.key} onClick={() => { setSelected(node.key); setCreateParent(null); }}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', paddingLeft: 8 + depth * 16, cursor: 'pointer', background: selected === node.key ? 'var(--accent)08' : 'transparent', borderLeft: selected === node.key ? '3px solid var(--accent)' : '3px solid transparent', fontSize: 12 }}>
              {hasChildren ? <span onClick={e => { e.stopPropagation(); toggle(node.key); }} style={{ width: 16, cursor: 'pointer', color: 'var(--text-secondary)' }}>{isExpanded ? '▼' : '▶'}</span> : <span style={{ width: 16 }} />}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(node.key); }} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{node.key}</span>: {node.summary}</span>
              {node.status && <StatusBadge status={node.status} />}
              <button onClick={e => { e.stopPropagation(); setCreateParent({ key: node.key, summary: node.summary }); setSelected(null); }} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }} title="하위 Issue 생성">➕</button>
            </div>
          );
        })}</div>
      ) : (
        <div style={{ fontSize: 11 }}>
          <div style={{ display: 'flex', padding: '4px 8px', background: 'var(--bg-tertiary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
            <span style={{ width: 28 }}>#</span><span style={{ width: 80 }}>Key</span><span style={{ flex: 1 }}>Summary</span><span style={{ width: 80, textAlign: 'center' }}>Status</span><span style={{ width: 24 }}></span>
          </div>
          {flatNodes.map(({ node, depth }, i) => (
            <div key={node.key} onClick={() => { setSelected(node.key); setCreateParent(null); }}
              style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid var(--bg-tertiary)', cursor: 'pointer', background: selected === node.key ? 'var(--accent)08' : 'transparent' }}>
              <span style={{ width: 28, color: 'var(--text-secondary)' }}>{i + 1}</span>
              <span style={{ width: 80, fontSize: 10 }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(node.key); }} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{node.key}</span></span>
              <span style={{ flex: 1, paddingLeft: depth * 12 }}>
                {node.children.length > 0 && <span onClick={e => { e.stopPropagation(); toggle(node.key); }} style={{ cursor: 'pointer', marginRight: 4 }}>{expanded.has(node.key) ? '▼' : '▶'}</span>}
                {node.summary}
              </span>
              <span style={{ width: 80, textAlign: 'center' }}>{node.status && <StatusBadge status={node.status} />}</span>
              <button onClick={e => { e.stopPropagation(); setCreateParent({ key: node.key, summary: node.summary }); setSelected(null); }} style={{ width: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>➕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const preview = createParent ? (
    <IssueCreateView parentKey={createParent.key} parentSummary={createParent.summary} onClose={() => setCreateParent(null)} type={type} />
  ) : selectedNode ? (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}><span onClick={() => openJiraIssue(selectedNode.key)} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{selectedNode.key}</span> {selectedNode.summary}</div>
      {selectedNode.status && <div style={{ marginBottom: 8 }}><StatusBadge status={selectedNode.status} /></div>}
      <Accordion items={[
        ...(type === 'slm' ? [{ id: 'guide', icon: '📖', label: '가이드', content: <div style={{ fontSize: 11 }}>가이드 — Confluence 연동 후 자동 로드</div> }] : []),
        { id: 'status', icon: '🔄', label: 'Status', content: <div style={{ fontSize: 11 }}>Status 전이 — Jira API 연동</div> },
        { id: 'ref', icon: '📋', label: '참조', content: <div style={{ fontSize: 11 }}>이전 과제 참조</div> },
        { id: 'ai', icon: '💬', label: 'AI', content: <div style={{ fontSize: 11 }}>AI 질문</div> },
      ]} activeId={accordionId} onChange={setAccordionId} />
    </div>
  ) : (
    <EmptyState icon="🌳" title="과제를 선택하세요" description="상단에서 ▶를 클릭하여 펼치고, 과제를 선택하세요" action={{ label: '▲ 전체 펼치기', onClick: expandAll }} />
  );

  return <SplitPane top={treeView} bottom={preview} storageKey="pa-hierarchy-ratio" />;
};
