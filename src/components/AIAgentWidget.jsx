import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Mic, 
  Send, 
  X, 
  Scale, 
  Coins, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  User, 
  Clock 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { processAICommand } from '../services/aiAgent';

export default function AIAgentWidget({ forceOpen, onCloseTab }) {
  const [isOpen, setIsOpen] = useState(Boolean(forceOpen));
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof forceOpen === 'boolean') {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseTab) {
      onCloseTab();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const store = useStore((state) => state);

  const [messages, setMessages] = useState([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: 'Namaste! Main ChakkiBot AI Agent hoon. Aap bol kar ya likh kar koi bhi kaam karwa sakte hain (e.g. "Ramesh ki 50kg gehun bori jama karo", "Aaj ki kamai batao").',
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
          text: 'Action execute karne me error aaya. Kripya punah prayas karein.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    { label: 'Aaj Ka Summary', text: 'Aaj ka summary aur kamai batao', icon: TrendingUp },
    { label: '50kg Gehun Pisai', text: 'Ramesh Kumar ki 50kg gehun pisai bori jama karo', icon: Scale },
    { label: '₹500 Jama Record', text: 'Sunita Devi se 500 rupaye jama payment record karo', icon: Coins },
    { label: 'Udhar Check', text: 'Kiske paas sabse zyada udhar baki hai', icon: AlertTriangle },
    { label: 'Pisai Rate ₹5', text: 'Chakki pisai rate 5 rupaye set karo', icon: RefreshCw }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end'
      }}
    >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '85vh',
              backgroundColor: '#0f172a',
              borderTopLeftRadius: '1.5rem',
              borderTopRightRadius: '1.5rem',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.25)',
                      border: '1px solid rgba(129, 140, 248, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a5b4fc'
                    }}
                  >
                    <Bot size={20} />
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 6px #22c55e'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>ChakkiBot AI Agent</span>
                    <Sparkles size={14} style={{ color: '#fbbf24' }} />
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600 }}>
                    Full App Autonomous Assistant
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div
              style={{
                padding: '8px 14px',
                background: 'rgba(30, 41, 59, 0.6)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {quickPrompts.map((qp, idx) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(qp.text)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: '#c7d2fe',
                      borderRadius: 'var(--radius-pill)',
                      padding: '5px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={12} />
                    <span>{qp.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Messages Timeline */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        background: isUser ? '#4f46e5' : '#1e293b',
                        color: '#ffffff',
                        padding: '12px 16px',
                        borderRadius: isUser ? '1.2rem 1.2rem 0 1.2rem' : '1.2rem 1.2rem 1.2rem 0',
                        fontSize: '0.88rem',
                        lineHeight: 1.45,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        whiteSpace: 'pre-line',
                        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {msg.text}

                      {/* Tool Action Execution Card */}
                      {msg.action && (
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '8px 10px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            border: '1px solid rgba(34, 197, 94, 0.35)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            color: '#4ade80'
                          }}
                        >
                          <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={13} />
                            <span>Executed Tool: {msg.action.type}</span>
                          </div>
                          <div style={{ opacity: 0.9, marginTop: '3px' }}>{msg.action.details}</div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '0.66rem',
                        color: '#64748b',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '0 4px'
                      }}
                    >
                      <Clock size={10} />
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}

              {isProcessing && (
                <div 
                  style={{ 
                    alignSelf: 'flex-start', 
                    background: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '10px 16px', 
                    borderRadius: '1rem', 
                    color: '#818cf8', 
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Bot size={16} />
                  <span>AI Action Execute Ho Raha Hai...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div 
              style={{ 
                padding: '12px 14px', 
                background: '#1e293b', 
                borderTop: '1px solid rgba(255,255,255,0.08)', 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center' 
              }}
            >
              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={handleMicToggle}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: isListening ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  border: isListening ? '2px solid #fca5a5' : 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.6)' : 'none'
                }}
                title="Voice Input (Hindi/Hinglish)"
              >
                <Mic size={18} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Likho ya bolo (e.g. Ramesh 50kg gehun jama)..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  borderRadius: 'var(--radius-pill)',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  padding: '0 16px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                style={{
                  minHeight: '44px',
                  padding: '0 18px',
                  borderRadius: 'var(--radius-pill)',
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
  );
}
