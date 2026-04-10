import React, { useState, useCallback } from 'react';
import { Header, Tabs, Modal, Toast } from '../shared/components';
import { useTheme, useAIEnabled, useKeyboardShortcut } from '../shared/hooks';
import { DashboardView } from '../features/dashboard/DashboardView';
import { TaskListView } from '../features/task-list/TaskListView';
import { VOCView } from '../features/voc/VOCView';
import { AIChatView } from '../features/ai-chat/AIChatView';
import { SprintView } from '../features/sprint/SprintView';
import { HierarchyView } from '../features/hierarchy/HierarchyView';
import { StructureView, GlobalSearchModal } from '../features/common/CommonViews';

const MAIN_TABS = [
  { id: 'slm', label: 'SLM', icon: '📋' },
  { id: 'general', label: '일반', icon: '📁' },
  { id: 'voc', label: 'VOC', icon: '📝' },
  { id: 'ai', label: 'Ask AI', icon: '💬' },
];

const SLM_SUBS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'tasks', label: '과제', icon: '📁' },
  { id: 'hierarchy', label: '계층', icon: '🌳' },
  { id: 'structure', label: 'Structure', icon: '📐' },
];

const GEN_SUBS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'epics', label: 'Epic', icon: '📁' },
  { id: 'hierarchy', label: '계층', icon: '🌳' },
  { id: 'structure', label: 'Structure', icon: '📐' },
  { id: 'sprint', label: 'Sprint', icon: '🏃' },
];

export const App: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const [aiEnabled, setAIEnabled] = useAIEnabled();
  const [mainTab, setMainTab] = useState('slm');
  const [subTab, setSubTab] = useState('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message: msg, type }), []);
  const handleRefresh = useCallback(() => showToast('새로고침 완료'), [showToast]);
  const handlePopout = useCallback(() => { try { chrome.tabs?.create({ url: chrome.runtime.getURL('sidepanel/index.html') }); } catch {} }, []);

  useKeyboardShortcut('k', 'meta', () => setSearchOpen(true));

  const subTabs = mainTab === 'slm' ? SLM_SUBS : mainTab === 'general' ? GEN_SUBS : [];
  const viewType = mainTab as 'slm' | 'general';

  const renderContent = () => {
    if (mainTab === 'voc') return <VOCView />;
    if (mainTab === 'ai') return <AIChatView />;
    switch (subTab) {
      case 'dashboard': return <DashboardView type={viewType} />;
      case 'tasks': case 'epics': return <TaskListView type={viewType} />;
      case 'hierarchy': return <HierarchyView type={viewType} />;
      case 'structure': return <StructureView type={viewType} />;
      case 'sprint': return <SprintView />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header onPopout={handlePopout} onRefresh={handleRefresh} onSettings={() => setSettingsOpen(true)} onAdmin={() => {}} onKpi={() => {}} connectionStatus="connected" alertCount={0} />
      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={id => { setMainTab(id); setSubTab('dashboard'); }}
        rightContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '0 4px' }}>
            🤖 <span style={{ color: aiEnabled ? 'var(--success)' : 'var(--text-secondary)' }}>AI</span>
            <button onClick={() => setAIEnabled(!aiEnabled)} style={{ width: 32, height: 16, borderRadius: 8, border: 'none', background: aiEnabled ? 'var(--success)' : 'var(--bg-tertiary)', cursor: 'pointer', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 2, left: aiEnabled ? 18 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </div>
        }
      />
      {subTabs.length > 0 && <Tabs tabs={subTabs} active={subTab} onChange={setSubTab} />}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>{renderContent()}</div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="⚙️ 설정">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
          <label>테마 <select value={theme} onChange={e => setTheme(e.target.value)} style={{ marginLeft: 8, padding: '4px 8px' }}><option value="system">시스템</option><option value="light">라이트</option><option value="dark">다크</option></select></label>
          <label>PAT 저장 <select style={{ marginLeft: 8, padding: '4px 8px' }}><option>세션만 유지 (권장)</option><option>로컬 저장</option></select></label>
          <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 12 }}>🔄 온보딩 투어 다시 보기</button>
        </div>
      </Modal>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};
