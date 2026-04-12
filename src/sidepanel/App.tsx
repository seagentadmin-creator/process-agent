import React, { useState, useCallback, useEffect } from 'react';
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

// Mock 알림 데이터
const ALERT_DATA = [
  { id: 1, type: 'delay' as const, key: 'REQ-001', msg: '9일 지연', time: '14:30' },
  { id: 2, type: 'warn' as const, key: 'DES-003', msg: '5일 후 마감', time: '10:00' },
  { id: 3, type: 'info' as const, key: '', msg: 'v1.0.1 업데이트 가능', time: '09:00' },
];

// Mock 메타데이터
const META_DATA = [
  { code: 'A-001', issueType: 'Story', title: '요구사항 분석', guide: 'O', checklist: 'O' },
  { code: 'A-002', issueType: 'Task', title: '설계 검토', guide: 'O', checklist: 'X' },
  { code: 'B-001', issueType: 'Bug', title: '버그 수정', guide: 'X', checklist: 'O' },
];

// Mock 버전 이력
const VERSION_HISTORY = [
  { ver: 'v2.4-draft', date: '2026-04-12', changes: 2, status: 'draft' },
  { ver: 'v2.3', date: '2026-04-10', changes: 3, status: 'current' },
  { ver: 'v2.2', date: '2026-04-05', changes: 1, status: 'previous' },
  { ver: 'v2.1', date: '2026-04-01', changes: 5, status: 'previous' },
];

// KPI 지표 계산
const KPI_METRICS = {
  weeklyDone: 5, weeklyTarget: 7,
  monthlyRate: 82, avgDays: 8.5, delayRate: 15,
  processRate: 68,
  stageRates: [
    { name: '요구사항', rate: 90 }, { name: '설계', rate: 70 },
    { name: '구현', rate: 60 }, { name: '테스트', rate: 30 },
  ],
  guideViews: 23, aiQuestions: 12, reuseCount: 8, vocCount: 2,
};

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

  // 온보딩
  useEffect(() => {
    try { chrome.storage.local.get('pa-onboarding-done').then((r: any) => { if (!r['pa-onboarding-done']) setModal('onboarding'); }); } catch {}
  }, []);

  const finishOnboarding = () => { setModal(null); setOnboardingStep(0); try { chrome.storage.local.set({ 'pa-onboarding-done': true }); } catch {} };
  const handleAdminLogin = () => { if (adminPw === ADMIN_PASSWORD) { setAdminAuth(true); setAdminPw(''); } else { showToast('비밀번호가 올바르지 않습니다', 'error'); } };

  const subTabs = mainTab === 'slm' ? SLM_SUBS : mainTab === 'general' ? GEN_SUBS : [];
  const viewType = mainTab as 'slm' | 'general';
  const renderContent = () => {
    if (mainTab === 'voc') return <VOCView />;
    if (mainTab === 'ai') return <AIChatView />;
    switch (subTab) {
      case 'dashboard': return <DashboardView type={viewType} />;
      case 'tasks': case 'epics': return <TaskListView type={viewType} />;
      case 'hierarchy': return <HierarchyView type={viewType} viewMode="unified" />;
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
      <Header onPopout={handlePopout} onRefresh={handleRefresh} onSettings={() => setModal('settings')} onAdmin={() => setModal('admin')} onKpi={() => setModal('kpi')} connectionStatus="connected" alertCount={ALERT_DATA.length} onAlert={() => setModal('alert')} isPopout={isPopout} onClosePopout={() => window.close()} />
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
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11, padding: '0 4px' }}>🔗 시스템 연결</legend>
            <label style={{ display: 'block', marginBottom: 8 }}>Jira URL<input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="https://jira.company.com" style={inputSt} /></label>
            <label style={{ display: 'block', marginBottom: 8 }}>Confluence URL<input value={confluenceUrl} onChange={e => setConfluenceUrl(e.target.value)} placeholder="https://confluence.company.com" style={inputSt} /></label>
            <label style={{ display: 'block' }}>PAT<input type="password" value={pat} onChange={e => setPat(e.target.value)} placeholder="Personal Access Token" style={inputSt} /></label>
          </fieldset>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11, padding: '0 4px' }}>📋 Issue 기본값</legend>
            <label style={{ display: 'block' }}>SW-Task Component (기본값)<input value={defaultComponent} onChange={e => setDefaultComponent(e.target.value)} placeholder="Common" style={inputSt} /></label>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Issue 생성 시 Component 필드에 자동 설정됩니다.</div>
          </fieldset>
          <fieldset style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <legend style={{ fontWeight: 700, fontSize: 11 }}>🎨 화면</legend>
            <label>테마 <select value={theme} onChange={e => setTheme(e.target.value)} style={{ ...inputSt, width: 'auto', marginLeft: 8 }}><option value="system">시스템</option><option value="light">라이트</option><option value="dark">다크</option></select></label>
          </fieldset>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { showToast('설정 저장 완료'); setModal(null); }} style={{ ...btnSt, flex: 1 }}>💾 저장</button>
            <button onClick={() => { setModal('onboarding'); setOnboardingStep(0); }} style={{ ...btnOut, flex: 1 }}>🔄 온보딩</button>
            <button onClick={() => setModal('shortcut')} style={{ ...btnOut, flex: 1 }}>⌨️ 단축키</button>
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
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {['가이드', '체크리스트', 'AI 지침', '필드'].map(t => <button key={t} style={{ ...btnOut, padding: '3px 6px', fontSize: 10 }}>{t}</button>)}
                  <button style={{ ...btnSt, padding: '3px 6px', fontSize: 10, marginLeft: 'auto' }}>+ 추가</button>
                </div>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: 'var(--bg-tertiary)' }}><th style={{ padding: 4, textAlign: 'left' }}>Code</th><th style={{ padding: 4, textAlign: 'left' }}>Type</th><th style={{ padding: 4, textAlign: 'left' }}>Title</th><th style={{ padding: 4, textAlign: 'center' }}>가이드</th><th style={{ padding: 4, textAlign: 'center' }}>CL</th></tr></thead>
                  <tbody>{META_DATA.map(m => (
                    <tr key={m.code} style={{ borderBottom: '1px solid var(--bg-tertiary)' }}><td style={{ padding: 4 }}>{m.code}</td><td style={{ padding: 4 }}>{m.issueType}</td><td style={{ padding: 4 }}>{m.title}</td><td style={{ padding: 4, textAlign: 'center' }}>{m.guide}</td><td style={{ padding: 4, textAlign: 'center' }}>{m.checklist}</td></tr>
                  ))}</tbody>
                </table>
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}><button style={{ ...btnOut, fontSize: 10 }}>📥 Import</button><button style={{ ...btnOut, fontSize: 10 }}>📤 Export</button></div>
              </div>
            )}
            {adminSubTab === 'version' && (
              <div>
                <div style={{ padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>정식 버전: v2.3 (2026-04-10)</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>전체 사용자에게 적용 중</div>
                </div>
                {VERSION_HISTORY.filter(v => v.status === 'draft').map(v => (
                  <div key={v.ver} style={{ padding: 8, border: '2px dashed var(--warning)', borderRadius: 'var(--radius)', marginBottom: 8, background: '#fff3cd08' }}>
                    <div style={{ fontWeight: 600 }}>🧪 테스트 버전: {v.ver} ({v.date})</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>변경 {v.changes}건 · Admin만 미리보기 가능</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => showToast('미리보기 모드 적용')} style={{ ...btnOut, fontSize: 10, padding: '3px 8px' }}>🔍 미리보기</button>
                      <button onClick={() => showToast('정식 배포 완료')} style={{ ...btnSt, fontSize: 10, padding: '3px 8px' }}>🚀 정식 배포</button>
                      <button onClick={() => showToast('테스트 버전 삭제')} style={{ ...btnOut, fontSize: 10, padding: '3px 8px', color: 'var(--danger)' }}>🗑 삭제</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => showToast('테스트 버전 생성')} style={{ ...btnOut, width: '100%', marginBottom: 12, fontSize: 11 }}>📝 새 테스트 버전 생성</button>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>배포 이력:</div>
                {VERSION_HISTORY.filter(v => v.status !== 'draft').map(v => (
                  <div key={v.ver} style={{ padding: '4px 8px', borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span><b>{v.ver}</b> {v.date} · 변경 {v.changes}건</span>
                    {v.status === 'current' ? <span style={{ color: 'var(--success)' }}>현재</span> : <button onClick={() => showToast(v.ver + ' 복원 완료')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 10 }}>↩ 복원</button>}
                  </div>
                ))}
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
          <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>업무 지표</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>주간 처리</span><span>{KPI_METRICS.weeklyDone}건 / {KPI_METRICS.weeklyTarget}건</span></div>
            {barPct(Math.round(KPI_METRICS.weeklyDone / KPI_METRICS.weeklyTarget * 100))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>30일 완료율</span><span>{KPI_METRICS.monthlyRate}%</span></div>
            {barPct(KPI_METRICS.monthlyRate)}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>평균 소요일</span><span>{KPI_METRICS.avgDays}일</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}><span>지연율</span><span style={{ color: 'var(--danger)' }}>{KPI_METRICS.delayRate}%</span></div>
          </div>
          <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>프로세스 준수율</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>전체</span><span>{KPI_METRICS.processRate}%</span></div>
            {barPct(KPI_METRICS.processRate)}
            {KPI_METRICS.stageRates.map(s => (
              <div key={s.name} style={{ marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><span>{s.name}</span><span>{s.rate}%</span></div>
                {barPct(s.rate, s.rate >= 70 ? 'var(--success)' : s.rate >= 50 ? 'var(--warning)' : 'var(--danger)')}
              </div>
            ))}
          </div>
          <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>사용 지표</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>가이드 조회</span><span>{KPI_METRICS.guideViews}회</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>AI 질문</span><span>{KPI_METRICS.aiQuestions}회</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>재사용 복사</span><span>{KPI_METRICS.reuseCount}회</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VOC 등록</span><span>{KPI_METRICS.vocCount}건</span></div>
          </div>
        </div>
      </Modal>

      {/* ===== 알림 ===== */}
      <Modal open={modal === 'alert'} onClose={() => setModal(null)} title={`🔔 알림 (${ALERT_DATA.length}건)`} width={380}>
        <div style={{ fontSize: 12 }}>
          {ALERT_DATA.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>새로운 알림이 없습니다</div>
          ) : ALERT_DATA.map(a => (
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
