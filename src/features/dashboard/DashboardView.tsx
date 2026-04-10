import React from 'react';
import { Card, StatusBadge, EmptyState, Skeleton } from '../../shared/components';

interface Props { type: 'slm' | 'general'; }

export const DashboardView: React.FC<Props> = ({ type }) => {
  // In real app, these would come from hooks connected to Jira API
  const loading = false;
  const stats = { delay: 3, week: 2, twoWeeks: 4, total: 15 };
  const personal = { weeklyTarget: 5, completionRate: 82, avgDuration: 8.5 };

  if (loading) return <div style={{ padding: 16 }}><Skeleton count={4} height={48} /></div>;

  return (
    <div style={{ padding: 12 }}>
      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
        <StatCard emoji="🔴" label="지연" value={stats.delay} color="var(--danger)" />
        <StatCard emoji="🟡" label="7일" value={stats.week} color="var(--warning)" />
        <StatCard emoji="🟢" label="14일" value={stats.twoWeeks} color="var(--success)" />
        <StatCard emoji="📋" label="전체" value={stats.total} color="var(--text-secondary)" />
      </div>

      {/* Personal Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
        <StatCard emoji="✅" label="이번주" value={personal.weeklyTarget} color="var(--accent)" />
        <StatCard emoji="📊" label="완료율" value={`${personal.completionRate}%`} color="var(--accent)" />
        <StatCard emoji="⏱" label="평균" value={`${personal.avgDuration}일`} color="var(--accent)" />
      </div>

      {/* Urgent Tasks */}
      <Section title="🔴 긴급 과제">
        {stats.delay > 0 ? (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 12 }}>TASK-098 전기점검 보고</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅 04/01 · -9일</div>
              </div>
              <StatusBadge status="In Progress" />
            </div>
          </Card>
        ) : (
          <EmptyState icon="🎉" title="긴급 과제 없음" description="모든 과제가 기한 내에 있습니다" />
        )}
      </Section>

      {/* Favorites */}
      <Section title="⭐ 즐겨찾기">
        <EmptyState icon="⭐" title="즐겨찾기한 과제가 없습니다" description="과제에서 ⭐를 눌러 추가해보세요" />
      </Section>

      {/* Recent Activity */}
      <Section title="📝 최근 활동">
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          <div style={{ padding: '4px 0' }}>🔄 TASK-201 → Resolve · 10분 전</div>
          <div style={{ padding: '4px 0' }}>📖 A-001 가이드 조회 · 1시간 전</div>
        </div>
      </Section>
    </div>
  );
};

const StatCard: React.FC<{ emoji: string; label: string; value: string | number; color: string }> = ({ emoji, label, value, color }) => (
  <div style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', background: 'var(--bg-secondary)' }}>
    <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{emoji} {label}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{title}</div>
    {children}
  </div>
);
