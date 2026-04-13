import React, { useState, useCallback, useEffect } from 'react';
import { dataService } from '../core/data-service';
import { saveSettings as storageSave, loadSettings as storageLoad, exportSettings, importSettings } from '../core/storage-helper';
import { Header, Tabs, Modal, Toast } from '../shared/components';
import { useTheme, useAIEnabled, useKeyboardShortcut } from '../shared/hooks';
import { DashboardView } from '../features/dashboard/DashboardView';
import { TaskListView } from '../features/task-list/TaskListView';
import { VOCView } from '../features/voc/VOCView';
import { AIChatView } from '../features/ai-chat/AIChatView';
import { SprintView } from '../features/sprint/SprintView';
import { HierarchyView } from '../features/hierarchy/HierarchyView';
import { GlobalSearchModal } from '../features/common/CommonViews';

const MAIN_TABS = [
  { id: 'slm', label: 'SLM', icon: '📋' },
  { id: 'general', label: '일반', icon: '📁' },
  { id: 'voc', label: 'VOC', icon: '📝' },
  { id: 'ai', label: 'Ask AI', icon: '💬' },
];
const SLM_SUBS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'tasks', label: '과제', icon: '📁' },
  { id: 'hierarchy', label: 'Structure', icon: '🌳' },
];
const GEN_SUBS = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'epics', label: 'Epic', icon: '📁' },
  { id: 'hierarchy', label: 'Structure', icon: '🌳' },
  { id: 'sprint', label: 'Sprint', icon: '🏃' },
];

const ADMIN_PASSWORD = 'P@ssw0rd##';

const ONBOARDING = [
  { title: 'Process Agent에 오신 것을 환영합니다', desc: 'Jira/Confluence 과제를 효율적으로 관리하는 Extension입니다.' },
  { title: '📋 SLM 탭', desc: 'SW 생명주기 과제를 관리합니다. 대시보드에서 현황을 파악하세요.' },
  { title: '📁 일반 탭', desc: 'Epic/Sprint 기반 일반 과제를 관리합니다.' },
  { title: '💬 Ask AI', desc: 'AI에게 과제 관련 질문을 할 수 있습니다.' },
  { title: '⚙️ 설정', desc: '우측 상단 ⚙️에서 Jira/Confluence URL과 PAT를 설정하세요.' },
];

export const App: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const [aiEnabled, setAIEnabled] = useAIEnabled();
  const [mainTab, setMainTab] = useState('slm');
  const [subTab, setSubTab] = useState('dashboard');
  const [modal, setModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminSubTab, setAdminSubTab] = useState('process');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [jiraUrl, setJiraUrl] = useState('');
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [pat, setPat] = useState('');
  const [defaultComponent, setDefaultComponent] = useState('Common');
  const [slmProject, setSlmProject] = useState('SLM');
  const [genProject, setGenProject] = useState('GEN');

  // Admin Confluence Space Key
  const [confluenceSpace, setConfluenceSpace] = useState('SLM-CONFIG');

  // Dynamic data (loaded from Jira/Confluence)
  const [alertData, setAlertData] = useState<any[]>([]);
  const [metaData, setMetaData] = useState<any[]>([]);
  const [versionManifest, setVersionManifest] = useState<any>(null);
  const [draftVersion, setDraftVersion] = useState<any>(null);
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);

  const isPopout = typeof window !== 'undefined' && window.location?.search?.includes('popout=true');
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message: msg, type }), []);
  const handleRefresh = useCallback(() => showToast('새로고침 완료'), [showToast]);
  const handlePopout = useCallback(() => { try { chrome.tabs?.create({ url: chrome.runtime.getURL('sidepanel/index.html?popout=true') }); } catch {} }, []);

  // ESC 핸들러
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modal) setModal(null);
        else if (isPopout) window.close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modal, isPopout]);

  useKeyboardShortcut('f', 'ctrl', () => setModal('search'));

  // 연결 상태
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [connectedUser, setConnectedUser] = useState('');
  const [testResult, setTestResult] = useState<{ jira: boolean; confluence: boolean; user: string; tested: boolean; testing: boolean }>({ jira: false, confluence: false, user: '', tested: false, testing: false });

  // Settings 로드
  useEffect(() => {
    (async () => {
      const config = await dataService.loadConfig();
      if (config) {
        setJiraUrl(config.jiraUrl);
        setConfluenceUrl(config.confluenceUrl);
        setPat(config.pat);
        dataService.init();
        const test = await dataService.testConnection();
        setConnectionStatus(test.jira ? 'connected' : 'disconnected');
        setConnectedUser(test.user || '');
      } else {
        setConnectionStatus('disconnected');
      }
      try {
        const stored = await storageLoad(['pa-default-component', 'pa-slm-project', 'pa-gen-project', 'pa-confluence-space']);
        if (stored['pa-default-component']) setDefaultComponent(stored['pa-default-component'] as string);
        if (stored['pa-slm-project']) setSlmProject(stored['pa-slm-project'] as string);
        if (stored['pa-gen-project']) setGenProject(stored['pa-gen-project'] as string);
        if (stored['pa-confluence-space']) setConfluenceSpace(stored['pa-confluence-space'] as string);
      } catch {}
      // 연결 성공 시 실시간 데이터 로드
      if (dataService.isConnected()) {
        loadLiveData();
      }
    })();
  }, []);

  // Settings 저장
  // 연결 테스트 (저장 없이 현재 입력값으로 테스트)
  const runConnectionTest = async () => {
    setTestResult(prev => ({ ...prev, testing: true, tested: false }));
    // 임시로 config 적용
    await dataService.saveConfig({ jiraUrl, confluenceUrl, pat });
    const result = await dataService.testConnection();
    setTestResult({ jira: result.jira, confluence: result.confluence, user: result.user || '', tested: true, testing: false });
    setConnectionStatus(result.jira ? 'connected' : 'disconnected');
    setConnectedUser(result.user || '');
    if (result.jira) loadLiveData();
  };

  // 실시간 데이터 로드
  const loadLiveData = async () => {
    try {
      const pk = slmProject || genProject;
      // 알림
      const alerts = await dataService.getAlerts(pk);
      setAlertData(alerts);
      // KPI
      const kpi = await dataService.getKPIMetrics(pk);
      if (kpi) setKpiMetrics(kpi);
      // Admin 데이터 (Confluence 연결 시)
      if (confluenceSpace) {
        const meta = await dataService.getMetadata(confluenceSpace);
        if (meta.length > 0) setMetaData(meta);
        const manifest = await dataService.getVersionManifest(confluenceSpace);
        if (manifest) setVersionManifest(manifest);
        const draft = await dataService.getDraft(confluenceSpace);
        if (draft) setDraftVersion(draft);
      }
    } catch {}
  };

  const saveSettings = async () => {
    await dataService.saveConfig({ jiraUrl, confluenceUrl, pat });
    await storageSave({ 'pa-default-component': defaultComponent, 'pa-slm-project': slmProject, 'pa-gen-project': genProject, 'pa-confluence-space': confluenceSpace });
    showToast('설정 저장 완료');
    // 저장 후 자동 연결 테스트
    await runConnectionTest();
  };

  // 온보딩
  useEffect(() => {
    try { storageLoad(['pa-onboarding-done']).then((r: any) => { if (!r['pa-onboarding-done']) setModal('onboarding'); }); } catch {}
  }, []);

  const finishOnboarding = () => { setModal(null); setOnboardingStep(0); storageSave({ 'pa-onboarding-done': 'true' }); };
  const handleAdminLogin = () => { if (adminPw === ADMIN_PASSWORD) { setAdminAuth(true); setAdminPw(''); } else { showToast('비밀번호가 올바르지 않습니다', 'error'); } };

  const subTabs = mainTab === 'slm' ? SLM_SUBS : mainTab === 'general' ? GEN_SUBS : [];
  const viewType = mainTab as 'slm' | 'general';
  const renderContent = () => {
    if (mainTab === 'voc') return <VOCView />;
    if (mainTab === 'ai') return <AIChatView />;
    switch (subTab) {
      case 'dashboard': return <DashboardView type={viewType} projectKey={viewType === 'slm' ? slmProject : genProject} />;
      case 'tasks': case 'epics': return <TaskListView type={viewType} projectKey={viewType === 'slm' ? slmProject : genProject} />;
      case 'hierarchy': return <HierarchyView type={viewType} viewMode="unified" projectKey={viewType === 'slm' ? slmProject : genProject} />;
      case 'sprint': return <SprintView />;
      default: return null;
    }
  };
  const inputSt: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, marginTop: 4 };
  const btnSt: React.CSSProperties = { padding: '6px 16px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 };
  const btnOut: React.CSSProperties = { ...btnSt, background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)' };
  const barPct = (pct: number, color = 'var(--accent)') => (<div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, marginTop: 4 }}><div style={{ height: 4, borderRadius: 2, background: color, width: pct + '%' }} /></div>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header onPopout={handlePopout} onRefresh={handleRefresh} onSettings={() => setModal('settings')} onAdmin={() => setModal('admin')} onKpi={() => setModal('kpi')} connectionStatus={connectionStatus} alertCount={alertData.length} onAlert={() => setModal('alert')} isPopout={isPopout} onClosePopout={() => window.close()} />
      <Tabs tabs={MAIN_TABS} active={mainTab} onChange={id => { setMainTab(id); setSubTab('dashboard'); }}
        rightContent={<div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '0 4px' }}>
          🤖 <span style={{ color: aiEnabled ? 'var(--success)' : 'var(--text-secondary)' }}>AI</span>
          <button onClick={() => setAIEnabled(!aiEnabled)} style={{ width: 32, height: 16, borderRadius: 8, border: 'none', background: aiEnabled ? 'var(--success)' : 'var(--bg-tertiary)', cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 2, left: aiEnabled ? 18 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} /></button>
        </div>} />
      {subTabs.length > 0 && <Tabs tabs={subTabs} active={subTab} onChange={setSubTab} />}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>{renderContent()}</div>

      {/* ===== 설정 ===== */}
      <Modal open={modal === 'settings'} onClose={() => setModal(null)} title="⚙️ 설정" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 12 }}>
          {/* 현재 버전 + 연결 상태 요약 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', fontSize: 10 }}>
            <span>Process Agent v{(() => { try { return chrome.runtime.getManifest().version; } catch { return '1.0.0'; } })()}</span>
            <span style={{ color: connectionStatus === 'connected' ? '#0f5132' : '#842029' }}>
              {connectionStatus === 'connected' ? `🟢 ${connectedUser}` : connectionStatus === 'checking' ? '🟡 확인중' : '🔴 미연결'}
            </span>
          </div>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11, padding: '0 4px' }}>🔗 시스템 연결</legend>
            <label style={{ display: 'block', marginBottom: 8 }}>Jira URL<input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="https://jira.company.com" style={inputSt} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Confluence URL<input value={confluenceUrl} onChange={e => setConfluenceUrl(e.target.value)} placeholder="https://confluence.company.com" style={inputSt} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Confluence Space Key<input value={confluenceSpace} onChange={e => setConfluenceSpace(e.target.value)} placeholder="SLM-CONFIG" style={inputSt} /><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Admin 설정이 저장되는 Confluence Space</div></label>
            <label style={{ display: 'block' }}>PAT<input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="Personal Access Token" style={inputSt} /></label>
          </fieldset>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11, padding: '0 4px' }}>📋 프로젝트 설정</legend>
            <label style={{ display: 'block', marginBottom: 8 }}>SLM Project Key<input value={slmProject} onChange={e => setSlmProject(e.target.value)} placeholder="예: SLMPROJ" style={inputSt} /><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>SLM 탭에서 조회할 Jira 프로젝트</div></label>
            <label style={{ display: 'block', marginBottom: 8 }}>일반 Project Key<input value={genProject} onChange={e => setGenProject(e.target.value)} placeholder="예: GENPROJ" style={inputSt} /><div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>일반 탭에서 조회할 Jira 프로젝트</div></label>
            <label style={{ display: 'block' }}>SW-Task Component (기본값)<input value={defaultComponent} onChange={e => setDefaultComponent(e.target.value)} placeholder="Common" style={inputSt} /></label>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Issue 생성 시 Component 필드에 자동 설정됩니다.</div>
          </fieldset>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11 }}>🎨 화면</legend>
            <label>테마 <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...inputSt, width: 'auto', marginLeft: 8 }}><option value="system">시스템</option><option value="light">라이트</option><option value="dark">다크</option></select></label>
          </fieldset>
          {/* 연결 상태 패널 */}
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11, padding: '0 4px' }}>🔌 연결 상태</legend>
            {testResult.testing ? (
              <div style={{ textAlign: 'center', padding: 8, color: 'var(--text-secondary)' }}>🔄 연결 테스트 중...</div>
            ) : testResult.tested ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{testResult.jira ? '✅' : '❌'}</span>
                  <span>Jira: {testResult.jira ? `연결됨 (${testResult.user})` : '연결 실패'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{testResult.confluence ? '✅' : '❌'}</span>
                  <span>Confluence: {testResult.confluence ? '연결됨' : confluenceUrl ? '연결 실패' : '미입력'}</span>
                </div>
                {!testResult.jira && <div style={{ padding: '4px 8px', background: '#f8d7da', borderRadius: 'var(--radius)', fontSize: 10, color: '#842029', marginTop: 4 }}>URL과 PAT를 확인하세요. PAT는 Jira 프로필 → Personal Access Tokens에서 생성합니다.</div>}
              </div>
            ) : connectionStatus === 'connected' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0f5132' }}>
                <span style={{ fontSize: 14 }}>✅</span> 연결됨: {connectedUser}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>아래 [🔌 연결 테스트] 버튼을 눌러 연결 상태를 확인하세요.</div>
            )}
          </fieldset>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={runConnectionTest} disabled={!jiraUrl || !pat} style={{ ...btnOut, flex: 1, opacity: jiraUrl && pat ? 1 : 0.5 }}>🔌 연결 테스트</button>
            <button onClick={saveSettings} style={{ ...btnSt, flex: 1 }}>💾 저장</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={() => { setModal('onboarding'); setOnboardingStep(0); }} style={{ ...btnOut, flex: 1, fontSize: 10 }}>🔄 온보딩 투어</button>
            <button onClick={() => setModal('shortcut')} style={{ ...btnOut, flex: 1, fontSize: 10 }}>⌨️ 단축키</button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button onClick={async () => {
              const json = await exportSettings();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'pa-settings.json'; a.click();
              URL.revokeObjectURL(url);
              showToast('설정 내보내기 완료 (pa-settings.json)');
            }} style={{ ...btnOut, flex: 1, fontSize: 10 }}>📤 설정 내보내기</button>
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file'; input.accept = '.json';
              input.onchange = async (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const ok = await importSettings(text);
                if (ok) { showToast('설정 가져오기 완료 — 새로고침합니다'); setTimeout(() => window.location.reload(), 1000); }
                else { showToast('가져오기 실패 — 올바른 JSON 파일을 선택하세요', 'error'); }
              };
              input.click();
            }} style={{ ...btnOut, flex: 1, fontSize: 10 }}>📥 설정 가져오기</button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
            💡 Extension 재설치 시 설정이 초기화됩니다. 내보내기로 백업하세요.
          </div>
        </div>
      </Modal>

      {/* ===== Admin ===== */}
      <Modal open={modal === 'admin'} onClose={() => { setModal(null); setAdminAuth(false); setAdminSubTab('process'); }} title="👤 Admin" width={440}>
        {!adminAuth ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            <div>Admin 비밀번호를 입력하세요.</div>
            <input type="password" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} placeholder="비밀번호" style={inputSt} autoFocus />
            <button onClick={handleAdminLogin} style={btnSt}>🔓 로그인</button>
          </div>
        ) : (
          <div style={{ fontSize: 12 }}>
            <div style={{ color: 'var(--success)', fontWeight: 600, marginBottom: 8 }}>✅ Admin 인증됨</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[{ id: 'process', l: '📊 프로세스' }, { id: 'meta', l: '📋 메타데이터' }, { id: 'version', l: '🔄 버전' }, { id: 'user', l: '👥 사용자' }].map(t => (
                <button key={t.id} onClick={() => setAdminSubTab(t.id)} style={{ ...adminSubTab === t.id ? btnSt : btnOut, padding: '4px 8px', fontSize: 10 }}>{t.l}</button>
              ))}
            </div>
            {adminSubTab === 'process' && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>SW 개발 표준 프로세스 v1.0</div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: 'var(--bg-tertiary)' }}><th style={{ padding: 4, textAlign: 'left' }}>#</th><th style={{ padding: 4, textAlign: 'left' }}>단계</th><th style={{ padding: 4, textAlign: 'center' }}>필수</th><th style={{ padding: 4, textAlign: 'center' }}>산출물</th></tr></thead>
                  <tbody>
                    {['요구사항 분석', '설계', '구현', '테스트', '검증', '배포'].map((s, i) => (
                      <tr key={s} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}><td style={{ padding: 4 }}>{i + 1}</td><td style={{ padding: 4 }}>{s}</td><td style={{ padding: 4, textAlign: 'center' }}>{i < 4 ? '✅' : '⬜'}</td><td style={{ padding: 4, textAlign: 'center' }}>{[2, 2, 2, 2, 1, 1][i]}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 8, fontWeight: 600 }}>Tailoring 규칙:</div>
                <div style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginTop: 4, fontSize: 11 }}><b>Bug</b> → 요구사항,설계,검증,배포 제외 (긴급 수정)</div>
                <div style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginTop: 4, fontSize: 11 }}><b>HotFix</b> → 요구사항,설계,검증 제외 (긴급 배포)</div>
                <div style={{ padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginTop: 4, fontSize: 11 }}><b>Task</b> → 검증 제외 (일반 작업)</div>
                <button style={{ marginTop: 8, ...btnSt, width: '100%' }}>💾 저장</button>
              </div>
            )}
            {adminSubTab === 'meta' && (
              <div>
                {!confluenceSpace ? (
                  <div style={{ padding: 8, background: '#fff3cd', borderRadius: 'var(--radius)', fontSize: 10, color: '#856404' }}>⚠️ ⚙️ 설정에서 Confluence Space Key를 입력하세요</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                      {['가이드', '체크리스트', 'AI 지침', '필드'].map(t => <button key={t} style={{ ...btnOut, padding: '3px 6px', fontSize: 10 }}>{t}</button>)}
                      <button onClick={() => { setMetaData(prev => [...prev, { code: `NEW-${Date.now() % 1000}`, issueType: 'Task', title: '새 항목', guide: 'X', checklist: 'X' }]); }} style={{ ...btnSt, padding: '3px 6px', fontSize: 10, marginLeft: 'auto' }}>+ 추가</button>
                    </div>
                    {metaData.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 11 }}>메타데이터가 없습니다. [+ 추가]로 생성하세요.</div>
                    ) : (
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'var(--bg-tertiary)' }}><th style={{ padding: 4, textAlign: 'left' }}>Code</th><th style={{ padding: 4, textAlign: 'left' }}>Type</th><th style={{ padding: 4, textAlign: 'left' }}>Title</th><th style={{ padding: 4, textAlign: 'center' }}>가이드</th><th style={{ padding: 4, textAlign: 'center' }}>CL</th><th style={{ padding: 4 }}></th></tr></thead>
                        <tbody>{metaData.map((m: any, idx: number) => (
                          <tr key={m.code || idx} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}>
                            <td style={{ padding: 4 }}>{m.code}</td><td style={{ padding: 4 }}>{m.issueType}</td><td style={{ padding: 4 }}>{m.title}</td><td style={{ padding: 4, textAlign: 'center' }}>{m.guide}</td><td style={{ padding: 4, textAlign: 'center' }}>{m.checklist}</td>
                            <td style={{ padding: 4 }}><button onClick={() => setMetaData(prev => prev.filter((_: any, i: number) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 10 }}>✕</button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <button onClick={async () => { const ok = await dataService.saveMetadata(confluenceSpace, metaData); showToast(ok ? '메타데이터 저장 완료' : '저장 실패 — Confluence 연결 확인', ok ? 'success' : 'error'); }} style={{ ...btnSt, fontSize: 10 }}>💾 Confluence 저장</button>
                      <button onClick={async () => { const data = await dataService.getMetadata(confluenceSpace); if (data.length > 0) { setMetaData(data); showToast('불러오기 완료'); } else showToast('데이터 없음', 'error'); }} style={{ ...btnOut, fontSize: 10 }}>🔄 불러오기</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {adminSubTab === 'version' && (
              <div>
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>정식 버전: {versionManifest?.version || '미배포'}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{versionManifest?.publishedAt || '아직 배포된 버전이 없습니다'}</div>
                </div>
                {draftVersion && (
                  <div style={{ padding: 8, border: '2px dashed var(--warning)', borderRadius: 'var(--radius)', marginBottom: 8, background: '#fff3cd08' }}>
                    <div style={{ fontWeight: 600 }}>🧪 테스트: {draftVersion.version || 'draft'}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>{draftVersion.changes?.join(', ') || '변경사항 없음'}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => showToast('미리보기 모드 적용')} style={{ ...btnOut, fontSize: 10, padding: '3px 8px' }}>🔍 미리보기</button>
                      <button onClick={async () => { const ok = await dataService.saveVersionManifest(confluenceSpace, { ...draftVersion, status: 'published', publishedAt: new Date().toISOString() }); await dataService.deleteDraft(confluenceSpace); if (ok) { showToast('정식 배포 완료'); loadLiveData(); } else showToast('배포 실패', 'error'); }} style={{ ...btnSt, fontSize: 10, padding: '3px 8px' }}>🚀 정식 배포</button>
                      <button onClick={async () => { await dataService.deleteDraft(confluenceSpace); setDraftVersion(null); showToast('삭제 완료'); }} style={{ ...btnOut, fontSize: 10, padding: '3px 8px', color: 'var(--danger)' }}>🗑 삭제</button>
                    </div>
                  </div>
                )}
                <button onClick={async () => { const draft = { version: (versionManifest?.version || 'v0.0') + '-draft', createdAt: new Date().toISOString(), changes: [] }; const ok = await dataService.saveDraft(confluenceSpace, draft); if (ok) { setDraftVersion(draft); showToast('테스트 버전 생성'); } else showToast('생성 실패 — Confluence 연결 확인', 'error'); }} style={{ ...btnOut, width: '100%', marginBottom: 12, fontSize: 11 }}>📝 새 테스트 버전 생성</button>
                {!confluenceSpace && <div style={{ padding: 8, background: '#fff3cd', borderRadius: 'var(--radius)', fontSize: 10, color: '#856404' }}>⚠️ ⚙️ 설정에서 Confluence Space Key를 입력하세요</div>}
              </div>
            )}
            {adminSubTab === 'user' && (
              <div style={{ color: 'var(--text-secondary)' }}>
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 6 }}><b>부관리자</b><div style={{ fontSize: 11, marginTop: 4 }}>Jira PAT 기반 인증 후 권한 부여</div><div style={{ fontSize: 11 }}>등록된 부관리자: 없음</div></div>
                <button style={{ ...btnOut, width: '100%' }}>+ 부관리자 추가</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ===== KPI ===== */}
      <Modal open={modal === 'kpi'} onClose={() => setModal(null)} title="📊 KPI Dashboard" width={420}>
        <div style={{ fontSize: 12 }}>
          {!kpiMetrics ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
              {dataService.isConnected() ? '🔄 KPI 로드 중...' : '🔗 Jira 연결 후 KPI가 표시됩니다.'}
            </div>
          ) : (
            <>
              <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>업무 지표</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>전체 과제</span><span>{kpiMetrics.total}건</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>완료</span><span>{kpiMetrics.done}건 ({kpiMetrics.completionRate}%)</span></div>
                {barPct(kpiMetrics.completionRate)}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>평균 소요일</span><span>{kpiMetrics.avgDays}일</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>지연 과제</span><span style={{ color: 'var(--danger)' }}>{kpiMetrics.delayCount}건 ({kpiMetrics.delayRate}%)</span></div>
                {barPct(kpiMetrics.delayRate, 'var(--danger)')}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ===== 알림 ===== */}
      <Modal open={modal === 'alert'} onClose={() => setModal(null)} title={`🔔 알림 (${alertData.length}건)`} width={380}>
        <div style={{ fontSize: 12 }}>
          {alertData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>새로운 알림이 없습니다</div>
          ) : alertData.map(a => (
            <div key={a.id} style={{ padding: '8px', borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>{a.type === 'delay' ? '🔴' : a.type === 'warn' ? '🟡' : '🔄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{a.key ? `${a.key} — ${a.msg}` : a.msg}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{a.time}</div>
              </div>
              {a.type === 'info' && <button style={{ ...btnSt, padding: '2px 8px', fontSize: 10 }}>적용</button>}
            </div>
          ))}
        </div>
      </Modal>

      {/* ===== 온보딩 ===== */}
      <Modal open={modal === 'onboarding'} onClose={finishOnboarding} title={`가이드 투어 (${onboardingStep + 1}/${ONBOARDING.length})`} width={380}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{ONBOARDING[onboardingStep]?.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{ONBOARDING[onboardingStep]?.desc}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
            {ONBOARDING.map((_, i) => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === onboardingStep ? 'var(--accent)' : 'var(--bg-tertiary)' }} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            {onboardingStep > 0 && <button onClick={() => setOnboardingStep(s => s - 1)} style={btnOut}>← 이전</button>}
            {onboardingStep < ONBOARDING.length - 1 ? (
              <button onClick={() => setOnboardingStep(s => s + 1)} style={btnSt}>다음 →</button>
            ) : (
              <button onClick={finishOnboarding} style={btnSt}>✅ 시작하기</button>
            )}
          </div>
          <button onClick={finishOnboarding} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, marginTop: 8 }}>건너뛰기</button>
        </div>
      </Modal>

      {/* ===== 단축키 ===== */}
      <Modal open={modal === 'shortcut'} onClose={() => setModal(null)} title="⌨️ 단축키" width={360}>
        <div style={{ fontSize: 12 }}>
          {[['Ctrl + F', '전체 검색'], ['ESC', '모달 닫기 / Pop-out 닫기']].map(([key, desc]) => (
            <div key={key as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <span style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{key}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </Modal>

      <GlobalSearchModal open={modal === 'search'} onClose={() => setModal(null)} />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};
