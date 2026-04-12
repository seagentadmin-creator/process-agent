import React, { useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { APP_CONFIG } from '../constants/app-config';

// === Header ===
interface HeaderProps {
  onPopout: () => void;
  onRefresh: () => void;
  onSettings: () => void;
  onAdmin: () => void;
  onKpi: () => void;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onPopout, onRefresh, onSettings, onAdmin, onKpi, connectionStatus, alertCount }) => (
  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
    <span style={{ fontWeight: 700, fontSize: 14 }}><img src="icons/icon-16.png" alt="" style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle' }} />{APP_CONFIG.name} v{APP_CONFIG.version}</span>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <IconBtn title="Pop-out" onClick={onPopout}>⛶</IconBtn>
      <IconBtn title="Refresh" onClick={onRefresh}>🔄</IconBtn>
      <span title={connectionStatus} style={{ fontSize: 10 }}>{connectionStatus === 'connected' ? '🟢' : connectionStatus === 'checking' ? '🟡' : '🔴'}</span>
      <IconBtn title="KPI" onClick={onKpi}>📊</IconBtn>
      <IconBtn title="Settings" onClick={onSettings}>⚙️</IconBtn>
      <IconBtn title="Admin" onClick={onAdmin}>👤</IconBtn>
      <span style={{ position: 'relative' }}>
        🔔{alertCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff', borderRadius: '50%', fontSize: 9, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{alertCount}</span>}
      </span>
    </div>
  </header>
);

const IconBtn: React.FC<{ title: string; onClick: () => void; children: ReactNode }> = ({ title, onClick, children }) => (
  <button title={title} onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4 }}>{children}</button>
);

// === Tabs ===
interface TabItem { id: string; label: string; icon: string; }

export const Tabs: React.FC<{ tabs: TabItem[]; active: string; onChange: (id: string) => void; rightContent?: ReactNode }> = ({ tabs, active, onChange, rightContent }) => (
  <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 8px', background: 'var(--bg-secondary)' }}>
    <div style={{ display: 'flex', gap: 2, flex: 1 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: active === t.id ? 700 : 400, color: active === t.id ? 'var(--accent)' : 'var(--text-secondary)', borderBottom: active === t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
    {rightContent}
  </div>
);

// === SplitPane (vertical) ===
export const SplitPane: React.FC<{ top: ReactNode; bottom: ReactNode; defaultRatio?: number; storageKey?: string }> = ({ top, bottom, defaultRatio = 0.6, storageKey }) => {
  const [ratio, setRatio] = useState(defaultRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback(() => { dragging.current = true; }, []);
  const onMouseUp = useCallback(() => {
    dragging.current = false;
    if (storageKey) chrome.storage.local.set({ [storageKey]: ratio });
  }, [ratio, storageKey]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = Math.max(0.2, Math.min(0.8, (e.clientY - rect.top) / rect.height));
    setRatio(newRatio);
  }, []);

  return (
    <div ref={containerRef} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ height: `${ratio * 100}%`, overflow: 'auto' }}>{top}</div>
      <div onMouseDown={onMouseDown} style={{ height: 4, background: 'var(--border)', cursor: 'row-resize', flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: 'auto' }}>{bottom}</div>
    </div>
  );
};

// === Modal ===
export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number }> = ({ open, onClose, title, children, width = 380 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
};

// === Toast ===
interface ToastData { message: string; type: 'success' | 'error' | 'info'; undoAction?: () => void; }

export const Toast: React.FC<ToastData & { onClose: () => void }> = ({ message, type, undoAction, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, undoAction ? 5000 : 3000); return () => clearTimeout(t); }, []);
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--accent)' };
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: colors[type], color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', display: 'flex', gap: 12, alignItems: 'center', zIndex: 2000, fontSize: 12 }}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} {message}</span>
      {undoAction && <button onClick={() => { undoAction(); onClose(); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>↩ 되돌리기</button>}
    </div>
  );
};

// === EmptyState ===
export const EmptyState: React.FC<{ icon: string; title: string; description: string; action?: { label: string; onClick: () => void } }> = ({ icon, title, description, action }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
    <span style={{ fontSize: 32, marginBottom: 12 }}>{icon}</span>
    <span style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{title}</span>
    <span style={{ fontSize: 12, marginBottom: 12, textAlign: 'center' }}>{description}</span>
    {action && <button onClick={action.onClick} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12 }}>{action.label}</button>}
  </div>
);

// === Skeleton ===
export const Skeleton: React.FC<{ width?: string; height?: number; count?: number }> = ({ width = '100%', height = 16, count = 1 }) => (
  <>{Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ width, height, background: 'var(--bg-tertiary)', borderRadius: 4, marginBottom: 8, animation: 'shimmer 1.5s infinite' }} />
  ))}</>
);

// === StatusBadge ===
const STATUS_COLORS: Record<string, string> = { 'To Do': '#6c757d', 'In Progress': '#ffc107', 'Review': '#0dcaf0', 'Resolve': '#198754', 'Done': '#198754', 'Closed': '#adb5bd' };
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: `${STATUS_COLORS[status] || '#6c757d'}22`, color: STATUS_COLORS[status] || '#6c757d' }}>{status}</span>
);

// === SearchInput ===
export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = '검색...' }) => (
  <div style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12 }}>🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '6px 8px 6px 28px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
  </div>
);

// === CollapsibleBar ===
export const CollapsibleBar: React.FC<{ summary: string; onEdit: () => void; expanded: boolean; children: ReactNode }> = ({ summary, onEdit, expanded, children }) => (
  <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
    {!expanded ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', fontSize: 12 }}>
        <span>📂 {summary}</span>
        <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✏️ 변경</button>
      </div>
    ) : (
      <div style={{ padding: 12 }}>{children}</div>
    )}
  </div>
);

// === Card ===
export const Card: React.FC<{ children: ReactNode; onClick?: () => void; selected?: boolean; style?: React.CSSProperties }> = ({ children, onClick, selected, style }) => (
  <div onClick={onClick} style={{ padding: '8px 12px', border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: selected ? 'var(--accent)08' : 'var(--bg-primary)', cursor: onClick ? 'pointer' : 'default', marginBottom: 6, ...style }}>
    {children}
  </div>
);

// === Accordion ===
export const Accordion: React.FC<{ items: { id: string; icon: string; label: string; content: ReactNode }[]; activeId: string | null; onChange: (id: string | null) => void }> = ({ items, activeId, onChange }) => (
  <div>
    <div style={{ display: 'flex', gap: 4, padding: '6px 0' }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(activeId === item.id ? null : item.id)}
          style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: activeId === item.id ? 'var(--accent)' : 'var(--bg-secondary)', color: activeId === item.id ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: 11 }}>
          {item.icon} {item.label}
        </button>
      ))}
    </div>
    {activeId && items.find(i => i.id === activeId) && (
      <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
        {items.find(i => i.id === activeId)!.content}
      </div>
    )}
  </div>
);
