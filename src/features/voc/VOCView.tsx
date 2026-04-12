import { openJiraIssue } from '../../shared/constants/jira-link';
import React, { useState } from 'react';
import { Card, EmptyState, SearchInput } from '../../shared/components';
import { APP_CONFIG } from '../../shared/constants/app-config';

type Step = 1 | 2 | 3;

interface VOCData {
  project: string;
  structure: string;
  parentIssue: string;
  summary: string;
  description: string;
  category: string;
  priority: string;
}

export const VOCView: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<VOCData>({ project: '', structure: '', parentIssue: '', summary: '', description: '', category: '개선요청', priority: 'Medium' });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>VOC 등록 완료</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>TASK-VOC-001이 생성되었습니다.<br/>Watcher에게 알림이 전송됩니다.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Btn onClick={() => openJiraIssue('VOC-001')}>🔗 Jira에서 열기</Btn>
          <Btn variant="secondary" onClick={() => { setSubmitted(false); setStep(1); setData({ project: '', structure: '', parentIssue: '', summary: '', description: '', category: '개선요청', priority: 'Medium' }); }}>➕ 추가 등록</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 VOC 등록 ({step}/3)</div>
      <StepIndicator current={step} steps={['위치', '내용', '확인']} />

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <Field label="Project" required><input value={data.project} onChange={e => setData({ ...data, project: e.target.value })} placeholder="프로젝트 선택..." style={inputStyle} /></Field>
          <Field label="Structure"><input value={data.structure} onChange={e => setData({ ...data, structure: e.target.value })} placeholder="Structure 선택..." style={inputStyle} /></Field>
          <Field label="상위 과제"><input value={data.parentIssue} onChange={e => setData({ ...data, parentIssue: e.target.value })} placeholder="Epic 또는 Story 선택..." style={inputStyle} /></Field>
          <div style={{ textAlign: 'right', marginTop: 8 }}><Btn onClick={() => setStep(2)} disabled={!data.project}>다음 →</Btn></div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <Field label="제목" required><input value={data.summary} onChange={e => setData({ ...data, summary: e.target.value })} placeholder="VOC 제목 입력..." style={inputStyle} /></Field>
          <Field label="분류">
            <select value={data.category} onChange={e => setData({ ...data, category: e.target.value })} style={inputStyle}>
              <option>개선요청</option><option>오류보고</option><option>문의</option><option>기타</option>
            </select>
          </Field>
          <Field label="우선순위">
            <select value={data.priority} onChange={e => setData({ ...data, priority: e.target.value })} style={inputStyle}>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </Field>
          <Field label="설명"><textarea value={data.description} onChange={e => setData({ ...data, description: e.target.value })} placeholder="상세 내용을 입력하세요..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setStep(1)}>← 이전</Btn>
            <Btn onClick={() => setStep(3)} disabled={!data.summary}>다음 →</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>등록 확인</div>
          <Card>
            <ConfirmRow label="Project" value={data.project} />
            <ConfirmRow label="Structure" value={data.structure || '(미선택)'} />
            <ConfirmRow label="상위 과제" value={data.parentIssue || '(미선택)'} />
            <ConfirmRow label="제목" value={data.summary} />
            <ConfirmRow label="분류" value={data.category} />
            <ConfirmRow label="우선순위" value={data.priority} />
            <ConfirmRow label="설명" value={data.description || '(없음)'} />
            <ConfirmRow label="Watcher" value="Admin 전원 자동 추가" />
          </Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <Btn variant="secondary" onClick={() => setStep(2)}>← 이전</Btn>
            <Btn onClick={() => setSubmitted(true)}>✅ VOC 등록</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

const StepIndicator: React.FC<{ current: number; steps: string[] }> = ({ current, steps }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: i + 1 <= current ? 'var(--accent)' : 'var(--bg-tertiary)', color: i + 1 <= current ? '#fff' : 'var(--text-secondary)' }}>{i + 1}</div>
        <span style={{ fontSize: 10, color: i + 1 <= current ? 'var(--accent)' : 'var(--text-secondary)' }}>{s}</span>
        {i < steps.length - 1 && <div style={{ width: 24, height: 2, background: i + 1 < current ? 'var(--accent)' : 'var(--bg-tertiary)' }} />}
      </React.Fragment>
    ))}
  </div>
);

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label style={{ fontSize: 12 }}><span style={{ fontWeight: 600 }}>{label}{required && <span style={{ color: 'var(--danger)' }}>*</span>}</span>{children}</label>
);

const ConfirmRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, borderBottom: '1px solid var(--bg-tertiary)' }}>
    <span style={{ color: 'var(--text-secondary)' }}>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
  </div>
);

const Btn: React.FC<{ onClick: () => void; disabled?: boolean; variant?: 'primary' | 'secondary'; children: React.ReactNode }> = ({ onClick, disabled, variant = 'primary', children }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: '6px 16px', borderRadius: 'var(--radius)', border: variant === 'secondary' ? '1px solid var(--border)' : 'none', background: variant === 'primary' ? (disabled ? 'var(--bg-tertiary)' : 'var(--accent)') : 'var(--bg-primary)', color: variant === 'primary' ? '#fff' : 'var(--text-primary)', cursor: disabled ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}>{children}</button>
);

const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, marginTop: 4 };
