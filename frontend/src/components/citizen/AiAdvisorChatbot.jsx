import React, { useState, useRef, useEffect } from 'react';
import { getAiEnergyAdvisor } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { playChime } from '../../services/audio';

export default function AiAdvisorChatbot({ onNavigateTab }) {
  const { showToast } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello! I am your **GridPulse AI Energy Advisor**. I analyze your real-time DLMS smart meter telemetry and ToU tariffs to help you eliminate unnecessary charges and maximize solar savings. Ask me anything!',
      action: 'Check ToU Rate Schedule',
      savings: 'Save up to ₹1,200/mo',
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await getAiEnergyAdvisor(query);
      playChime('chime');
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        action: res.suggested_action,
        savings: res.projected_savings,
        time: res.timestamp
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Unable to reach the AI tariff advisor engine right now. Please try again shortly.',
          time: 'Now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const handleActionClick = (actionName) => {
    if (!actionName) return;
    if (actionName.includes('EV') && onNavigateTab) {
      onNavigateTab('tou-ev');
      setIsOpen(false);
    } else if (actionName.includes('ToU') && onNavigateTab) {
      onNavigateTab('tou-ev');
      setIsOpen(false);
    } else {
      showToast(`⚡ Selected: ${actionName}`);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e29623 0%, #2563eb 100%)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        title="Open GridPulse AI Energy Advisor"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 36px)',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, rgba(226, 150, 35, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--ink)' }}>
                  GridPulse AI Energy Advisor
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                Context-aware tariff &amp; load analytics
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: '14px' }}
            >
              ✕
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-subtle)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '10.5px', padding: '4px 8px', height: 'auto', flexShrink: 0 }}
              onClick={() => handleQuickPrompt('How can I save with solar net-metering?')}
            >
              ☀️ Solar ROI
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '10.5px', padding: '4px 8px', height: 'auto', flexShrink: 0 }}
              onClick={() => handleQuickPrompt('When should I charge my EV to save the most?')}
            >
              🚗 EV Charging
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '10.5px', padding: '4px 8px', height: 'auto', flexShrink: 0 }}
              onClick={() => handleQuickPrompt('How to cut AC consumption during peak hours?')}
            >
              ❄️ AC Peak Saver
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '10.5px', padding: '4px 8px', height: 'auto', flexShrink: 0 }}
              onClick={() => handleQuickPrompt('Why is my Power Factor low and how to fix it?')}
            >
              ⚡ Power Factor
            </button>
          </div>

          {/* Messages scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    background: m.sender === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: m.sender === 'user' ? '#fff' : 'var(--ink)',
                    padding: '10px 14px',
                    borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    border: m.sender === 'user' ? 'none' : '1px solid var(--border)'
                  }}
                >
                  {/* Basic markdown bold parsing */}
                  <span
                    dangerouslySetInnerHTML={{
                      __html: m.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>

                {/* AI Suggestions / Savings tag */}
                {m.sender === 'ai' && (m.savings || m.action) && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {m.savings && (
                      <span className="pill pill-good" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        💰 {m.savings}
                      </span>
                    )}
                    {m.action && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(m.action)}
                        style={{
                          background: 'rgba(37, 99, 235, 0.1)',
                          border: '1px solid rgba(37, 99, 235, 0.3)',
                          color: '#2563eb',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        &rarr; {m.action}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '9.5px', color: 'var(--ink-faint)', alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.time}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                Analyzing meter load &amp; calculating tariff differentials...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              background: 'var(--surface)'
            }}
          >
            <input
              type="text"
              className="input"
              style={{ flex: 1, fontSize: '12.5px', padding: '8px 12px' }}
              placeholder="Ask about tariffs, solar, EV savings..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0 12px', height: 'auto', fontSize: '14px' }}
              disabled={loading || !inputText.trim()}
            >
              &rarr;
            </button>
          </form>
        </div>
      )}
    </>
  );
}
