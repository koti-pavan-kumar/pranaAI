import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react';
import { useApp } from '../store';
import { generateAIResponse, getQuickSuggestions } from '../utils/ai';

export default function Chat() {
  const { chatMessages, addChatMessage, clearChat, currentMood } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    addChatMessage({ role: 'user', content: msg });
    setInput('');
    setIsTyping(true);
    setTimeout(async () => {
      const response = await generateAIResponse(msg);
      addChatMessage({ role: 'ai', content: response.text });
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  const suggestions = getQuickSuggestions(currentMood);

  return (
    <div>
      <div className="only-md-flex" style={{ flexDirection: 'column' }}>
        <ChatContent
          chatMessages={chatMessages} input={input} setInput={setInput}
          isTyping={isTyping} handleSend={handleSend} clearChat={clearChat}
          suggestions={suggestions} bottomRef={bottomRef}
        />
      </div>
      <div className="only-mobile">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <ChatContent
            chatMessages={chatMessages} input={input} setInput={setInput}
            isTyping={isTyping} handleSend={handleSend} clearChat={clearChat}
            suggestions={suggestions} bottomRef={bottomRef}
          />
        </div>
      </div>
    </div>
  );
}

// Defined OUTSIDE to prevent re-mount on every render
function ChatContent({ chatMessages, input, setInput, isTyping, handleSend, clearChat, suggestions, bottomRef }: {
  chatMessages: Array<{ id: string; role: string; content: string; timestamp: number }>;
  input: string; setInput: (v: string) => void;
  isTyping: boolean; handleSend: (text?: string) => void;
  clearChat: () => void; suggestions: string[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>AI Health Chat</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Powered by on-device Phi-3 · 100% private</p>
        </div>
        <button onClick={clearChat} style={{ width: 36, height: 36, borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }} title="Clear chat">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
        {chatMessages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={28} color="white" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Ask me anything about wellness</p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>I can help with breathing, mood, sleep, and stress management</p>
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: 10, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'ai' && (
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} color="white" />
              </div>
            )}
            <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #14b8a6, #06b6d4)' : 'white', color: msg.role === 'user' ? 'white' : '#1e293b', border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: 13, lineHeight: 1.6 }}>
              {msg.content.split('\n').map((line, i) => <p key={i} style={{ marginBottom: line ? 4 : 0 }}>{line}</p>)}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#64748b" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={16} color="white" /></div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: `pulse 1.4s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Suggestions */}
      {chatMessages.length === 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => handleSend(s)}
              style={{ padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
              <Sparkles size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about breathing, mood, sleep..." style={{ flex: 1, padding: '10px 14px', border: 'none', outline: 'none', fontSize: 14, color: '#1e293b', background: 'transparent' }} />
        <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
          style={{ width: 40, height: 40, borderRadius: 10, background: input.trim() ? 'linear-gradient(135deg, #14b8a6, #06b6d4)' : '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>
          <Send size={16} color={input.trim() ? 'white' : '#94a3b8'} />
        </button>
      </div>
    </div>
  );
}
