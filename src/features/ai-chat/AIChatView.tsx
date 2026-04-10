import React, { useState, useRef, useEffect } from 'react';
import { EmptyState } from '../../shared/components';
import { useAIEnabled } from '../../shared/hooks';

interface Message { role: 'user' | 'assistant'; content: string; refs?: { title: string; link: string }[]; }

export const AIChatView: React.FC = () => {
  const [aiEnabled] = useAIEnabled();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        role: 'assistant',
        content: `${input.trim()}에 대한 답변입니다.\n\n${aiEnabled ? '(가이드 + RAG 컨텍스트 기반 답변)' : '(LLM 일반 지식 기반 답변)'}`,
        refs: aiEnabled ? [{ title: '관련 Confluence 문서', link: '#' }] : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!aiEnabled && (
        <div style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', fontSize: 11, color: 'var(--text-secondary)' }}>
          ℹ️ AI 추천 기능은 OFF 상태입니다. 직접 질문은 가능합니다.
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {messages.length === 0 ? (
          <EmptyState icon="💬" title="무엇이 궁금하신가요?" description="과제, 프로세스, 기술 질문 등 무엇이든 물어보세요." />
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: 12, background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)', color: msg.role === 'user' ? '#fff' : 'var(--text-primary)', fontSize: 12, lineHeight: 1.6 }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.refs && msg.refs.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 10 }}>
                    📚 참조: {msg.refs.map((r, j) => <a key={j} href={r.link} style={{ color: 'var(--accent)', marginLeft: 4 }}>{r.title}</a>)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 8 }}>🤖 답변 생성 중...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: 8, display: 'flex', gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="메시지 입력..." style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: !input.trim() || loading ? 0.5 : 1 }}>전송</button>
      </div>
    </div>
  );
};
