import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { processAICommand } from '../services/aiAgent';

export default function AIAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const store = useStore((state) => state);

  const [messages, setMessages] = useState([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: 'Namaste! 🙏 Main **ChakkiBot AI Agent** hoon. Aap bol kar ya likh kar koi bhi kaam karwa sakte hain (e.g. *"Ramesh ki 50kg gehun bori jama karo"*, *"Aaj ki kamai batao"*).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: null
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Speech Recognition
  const handleMicToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Aapke browser me Voice Speech recognition support nahi hai. Likh kar command dein!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hindi / Hinglish recognition
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        // Auto submit speech input
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // Call AI Agent Action Engine
    try {
      const result = await processAICommand(textToSend, store);

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: result.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: result.actionExecuted
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: '⚠️ Action execute karne me error aaya. Kripya punah prayas karein.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    { label: '📊 Aaj Ka Summary', text: 'Aaj ka summary aur kamai batao' },
    { label: '🌾 50kg Gehun Pisai', text: 'Ramesh Kumar ki 50kg gehun pisai bori jama karo' },
    { label: '💰 ₹500 Jama Record', text: 'Sunita Devi se 500 rupaye jama payment record karo' },
    { label: '⚠️ Udhar Check', text: 'Kiske paas sabse zyada udhar baki hai' },
    { label: '⚙️ Pisai Rate ₹5', text: 'Chakki pisai rate 5 rupaye set karo' }
  ];

  return (
    <>
      {/* Floating AI Agent Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '16px',
            zIndex: 999,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2rem',
            padding: '10px 18px',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          className="ai-float-btn"
        >
          <span style={{ fontSize: '1.2rem', animation: 'spin 4s linear infinite' }}>🤖</span>
          <span>Chakki AI</span>
        </button>
      )}

      {/* Full Glassmorphism Drawer Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              height: '85vh',
              backgroundColor: '#0f172a',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ fontSize: '1.6rem' }}>🤖</span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 6px #22c55e'
                    }}
                  ></span>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>ChakkiBot AI Agent</h3>
                  <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600 }}>
                    ⚡ Full App Autonomous Executor
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ✖
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(30, 41, 59, 0.5)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.text)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#c7d2fe',
                    borderRadius: '1rem',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  <div
                    style={{
                      background: msg.sender === 'user' ? '#4f46e5' : '#1e293b',
                      color: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                      fontSize: '0.88rem',
                      lineHeight: 1.45,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text}

                    {/* Tool Action Execution Card */}
                    {msg.action && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: 'rgba(34, 197, 94, 0.12)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          color: '#4ade80'
                        }}
                      >
                        <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          ⚡ Executed Tool: {msg.action.type}
                        </div>
                        <div style={{ opacity: 0.9, marginTop: '2px' }}>{msg.action.details}</div>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#64748b',
                      marginTop: '2px',
                      textAlign: msg.sender === 'user' ? 'right' : 'left'
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div style={{ alignSelf: 'flex-start', background: '#1e293b', padding: '10px 14px', borderRadius: '1rem', color: '#818cf8', fontSize: '0.85rem' }}>
                  🤖 AI Action Execute Ho Raha Hai...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '12px', background: '#1e293b', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleMicToggle}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isListening ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Voice Input (Hindi/Hinglish)"
              >
                {isListening ? '🎙️' : '🎤'}
              </button>

              <input
                type="text"
                placeholder="Likho ya bolo (e.g. Ramesh 50kg gehun jama)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  borderRadius: '1.5rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  padding: '0 16px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                style={{
                  minHeight: '44px',
                  padding: '0 18px',
                  borderRadius: '1.5rem',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Send 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
