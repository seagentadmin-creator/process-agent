import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState } from 'react';
import { Card, StatusBadge, EmptyState, Modal } from '../../shared/components';

interface Props { type: 'slm' | 'general'; }

const SLM_ISSUES = [
  { key: 'REQ-001', summary: '요구사항 정의서 작성', status: '구현', dueDate: '2026-04-01', delay: -9 },
  { key: 'ANL-002', summary: '시스템 분석 보고서', status: '분석', dueDate: '2026-03-28', delay: -13 },
  { key: 'DES-003', summary: '아키텍처 설계 검토', status: '설계', dueDate: '2026-04-15', delay: 5 },
  { key: 'IMP-004', summary: '모듈 구현 - 인증', status: '구현', dueDate: '2026-04-10', delay: 0 },
  { key: 'TST-005', summary: '통합 테스트 수행', status: '요구사항', dueDate: '2026-04-22', delay: 12 },
  { key: 'REQ-006', summary: '요구사항 변경 관리', status: '완료', dueDate: '2026-03-20', delay: 0 },
  { key: 'DES-007', summary: 'DB 설계서 작성', status: '완료', dueDate: '2026-03-25', delay: 0 },
];

const GENERAL_ISSUES = [
  { key: 'EPG-A01', summary: 'Sprint14 백엔드 개발', status: 'In Progress', dueDate: '2026-04-12', delay: -2 },
  { key: 'EPG-A02', summary: 'API 연동 테스트', status: 'To Do', dueDate: '2026-04-18', delay: 8 },
  { key: 'EPG-B01', summary: 'UI 리팩토링', status: 'In Progress', dueDate: '2026-04-20', delay: 10 },
  { key: 'EPG-B02', summary: '코드 리뷰 반영', status: 'Review', dueDate: '2026-04-14', delay: 4 },
  { key: 'EPG-C01', summary: '배포 스크립트 작성', status: 'Done', dueDate: '2026-04-05', delay: 0 },
];

export const DashboardView: React.FC<Props> = ({ type }) => {
  const [detailModal, setDetailModal] = useState<{ title: string; items: typeof SLM_ISSUES } | null>(null);
  const issues = type === 'slm' ? SLM_ISSUES : GENERAL_ISSUES;
  const doneStatuses = type === 'slm' ? ['완료'] : ['Done'];
  const isDone = (s: string) => doneStatuses.includes(s);

  const delay = issues.filter(i => i.delay < 0 && !isDone(i.status));
  const week = issues.filter(i => i.delay >= 0 && i.delay <= 7 && !isDone(i.status));
  const twoWeeks = issues.filter(i => i.delay > 7 && i.delay <= 14 && !isDone(i.status));
  const done = issues.filter(i => isDone(i.status));
  const active = issues.filter(i => !isDone(i.status));

  const openDetail = (title: string, items: typeof SLM_ISSUES) => setDetailModal({ title, items });

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <StatCard emoji="🔴" label="지연" value={delay.length} color="var(--danger)" tooltip="Due date 초과 미완료" onClick={() => openDetail('🔴 지연 과제', delay)} />
        <StatCard emoji="🟡" label="7일 이내" value={week.length} color="var(--warning)" tooltip="Due date 7일 이내" onClick={() => openDetail('🟡 7일 이내', week)} />
        <StatCard emoji="🟢" label="14일 이내" value={twoWeeks.length} color="var(--success)" tooltip="Due date 8~14일" onClick={() => openDetail('🟢 14일 이내', twoWeeks)} />
        <StatCard emoji="📋" label="전체" value={issues.length} color="var(--text-secondary)" tooltip="전체 과제" onClick={() => openDetail('📋 전체 과제', issues)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
        <StatCard emoji="✅" label="완료" value={done.length} color="var(--accent)" tooltip="완료 과제" onClick={() => openDetail('✅ 완료 과제', done)} />
        <StatCard emoji="📊" label="완료율" value={`${issues.length > 0 ? Math.round(done.length / issues.length * 100) : 0}%`} color="var(--accent)" tooltip="완료/전체 x 100" />
        <StatCard emoji="⏱" label="진행중" value={active.length} color="var(--accent)" tooltip="진행중 과제" onClick={() => openDetail('⏱ 진행중 과제', active)} />
      </div>

      <div style={{ marginBottom: 16, padding: 8, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>📌 {type === 'slm' ? 'SLM' : '일반'} 대시보드 지표</div>
        {type === 'slm' ? (
          <div>Workflow: 요구사항 → 분석 → 설계 → 구현 → 테스트 → 검증 → 완료</div>
        ) : (
          <div>Workflow: To Do → In Progress → Review → Done</div>
        )}
        <div>숫자를 클릭하면 해당 과제 상세 목록을 확인할 수 있습니다.</div>
      </div>

      <Section title="🔴 긴급 과제">
        {delay.length > 0 ? delay.map(t => (
          <Card key={t.key}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontWeight: 600, fontSize: 12 }}><span onClick={(e: any) => { e.stopPropagation(); openJiraIssue(t.key); }} style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>{t.key}</span> {t.summary}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅 {t.dueDate} · {Math.abs(t.delay)}일 지연</div></div><StatusBadge status={t.status} /></div></Card>
        )) : <EmptyState icon="🎉" title="긴급 과제 없음" description="모든 과제가 기한 내에 있습니다" />}
      </Section>

      <Section title="⭐ 즐겨찾기">
        <EmptyState icon="⭐" title="즐겨찾기한 과제가 없습니다" description="과제 목록에서 ⭐를 눌러 추가해보세요" />
      </Section>

      {/* 상세 모달 */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title || ''} width={400}>
        <div style={{ fontSize: 12 }}>
          {detailModal?.items.map(t => (
            <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
              <div><span onClick={() => openJiraIssue(t.key)} style={{ fontWeight: 600, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>{t.key}</span> {t.summary}</div>
              <StatusBadge status={t.status} />
            </div>
          ))}
          {detailModal?.items.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 16 }}>해당 과제가 없습니다</div>}
        </div>
      </Modal>
    </div>
  );
};

const StatCard: React.FC<{ emoji: string; label: string; value: string | number; color: string; tooltip?: string; onClick?: () => void }> = ({ emoji, label, value, color, tooltip, onClick }) => (
  <div title={tooltip} onClick={onClick} style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', background: 'var(--bg-secondary)', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{emoji} {label}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{title}</div>{children}</div>
);
