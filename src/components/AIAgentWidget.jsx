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
  Clock, 
  RotateCcw,
  MapPin,
  BrainCircuit,
  Zap,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { processAICommand, generatePredictiveInsights, undoAIAction } from '../services/aiAgent';
import { useTranslation } from '../utils/translations';

export default function AIAgentWidget({ forceOpen, onCloseTab }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(Boolean(forceOpen));
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  const store = useStore((state) => state);

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

  const [messages, setMessages] = useState([
    {
      id: 'm_welcome',
      sender: 'ai',
      text: t('aiAgentWidget.welcome'),
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

  // Generate predictive insights from store
  const predictiveInsights = generatePredictiveInsights(store);

  // Handle Voice Speech Recognition Simulation & Web API
  const handleMicToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      // Simulation mode if Web Speech API not present
      setIsListening(true);
      const simulatedPhrases = [
        "Ramesh Kumar 50kg gehun pisai bori jama karo",
        "Sunita Devi se 500 rupaye jama payment record karo",
        "Aaj ki kul kamai aur pisai batao",
        "Rampur ke sabhi udhar grahak batao",
        "Gehun pisai rate 5 rupaye set karo"
      ];
      const randomPhrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];

      setTimeout(() => {
        setInputText(randomPhrase);
        setIsListening(false);
        handleSendMessage(randomPhrase);
      }, 2200);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
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
          text: t('aiAgentWidget.error'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async (msgId, action) => {
    if (!action || action.undone) return;

    const undoRes = await undoAIAction(action, store);

    // Update message state to show action undone
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.action) {
          return {
            ...m,
            action: {
              ...m.action,
              undone: true
            }
          };
        }
        return m;
      })
    );

    // Append AI reply for undo confirmation
    setMessages((prev) => [
      ...prev,
      {
        id: `undo_${Date.now()}`,
        sender: 'ai',
        text: undoRes.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: null
      }
    ]);
  };

  const quickPrompts = [
    { label: t('aiAgentWidget.quickSummary'), text: t('aiAgentWidget.quickSummaryText'), icon: TrendingUp },
    { label: t('aiAgentWidget.quickGehun'), text: t('aiAgentWidget.quickGehunText'), icon: Scale },
    { label: t('aiAgentWidget.quickJama'), text: t('aiAgentWidget.quickJamaText'), icon: Coins },
    { label: t('aiAgentWidget.quickVillageDebt'), text: t('aiAgentWidget.quickVillageDebtText'), icon: MapPin },
    { label: t('aiAgentWidget.quickRate'), text: t('aiAgentWidget.quickRateText'), icon: RefreshCw }
  ];

  if (!isOpen) return null;

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
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end'
      }}
    >
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.9; }
          50% { transform: scale(1.35); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.9; }
        }
        @keyframes pulseRingOuter {
          0% { transform: scale(0.85); opacity: 0.6; }
          50% { transform: scale(1.6); opacity: 0.1; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
      `}</style>

      <div
        style={{
          width: '100%',
          maxWidth: '560px',
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
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(129, 140, 248, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a5b4fc'
                }}
              >
                <Bot size={22} />
              </div>
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  boxShadow: '0 0 6px #22c55e'
                }}
              />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{t('aiAgentWidget.title')}</span>
                <Sparkles size={14} style={{ color: '#fbbf24' }} />
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={10} style={{ color: '#38bdf8' }} />
                <span>{t('aiAgentWidget.subtitle')}</span>
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

        {/* Smart Predictive Insights Banner Section */}
        {predictiveInsights.length > 0 && (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 14px'
            }}
          >
            <div
              onClick={() => setShowInsights(!showInsights)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24' }}>
                <BrainCircuit size={14} />
                <span>{t('aiAgentWidget.predictiveTitle')} ({predictiveInsights.length})</span>
              </div>
              <ChevronRight
                size={14}
                style={{
                  color: '#94a3b8',
                  transform: showInsights ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {showInsights && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {predictiveInsights.map((ins) => {
                  const isPickup = ins.type === 'peak_pickup_alert';
                  const isDemand = ins.type === 'grain_demand_prediction';
                  const Icon = isPickup ? ShieldAlert : isDemand ? TrendingUp : AlertTriangle;
                  const borderClr = isPickup ? 'rgba(239, 68, 68, 0.4)' : isDemand ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.4)';
                  const bgClr = isPickup ? 'rgba(239, 68, 68, 0.1)' : isDemand ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)';
                  const txtClr = isPickup ? '#fca5a5' : isDemand ? '#93c5fd' : '#fcd34d';

                  return (
                    <div
                      key={ins.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '0.5rem',
                        border: `1px solid ${borderClr}`,
                        background: bgClr,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <Icon size={15} style={{ color: txtClr, flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: txtClr }}>
                          {ins.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px', lineHeight: '1.3' }}>
                          {ins.message}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (ins.type === 'uncollected_debt_warning') {
                            handleSendMessage(t('aiAgentWidget.quickUdharText'));
                          } else if (ins.type === 'peak_pickup_alert') {
                            handleSendMessage('Uncollected boris batao');
                          } else {
                            handleSendMessage(t('aiAgentWidget.quickSummaryText'));
                          }
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '0.375rem',
                          padding: '4px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {ins.actionableText}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            const action = msg.action;

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
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
                    lineHeight: 1.48,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                    whiteSpace: 'pre-line',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  {msg.text}

                  {/* Autonomous Action Execution Confirmation Card */}
                  {action && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        background: action.undone ? 'rgba(100, 116, 139, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                        border: action.undone ? '1px dashed rgba(148, 163, 184, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '0.75rem',
                        fontSize: '0.76rem',
                        color: action.undone ? '#94a3b8' : '#4ade80'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {action.undone ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
                          <span>{action.undone ? t('aiAgentWidget.actionUndone') : `${t('aiAgentWidget.actionExecuted')}: ${action.title || action.type}`}</span>
                        </div>
                        {action.undoPayload && !action.undone && (
                          <button
                            type="button"
                            onClick={() => handleUndo(msg.id, action)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#fca5a5',
                              borderRadius: '0.375rem',
                              padding: '3px 8px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <RotateCcw size={10} />
                            <span>{t('aiAgentWidget.undoAction')}</span>
                          </button>
                        )}
                      </div>

                      <div style={{ opacity: 0.9, marginBottom: '6px' }}>{action.details}</div>

                      {/* State Modifications Table Badges */}
                      {action.stateModifications && action.stateModifications.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {action.stateModifications.map((mod, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '2px 6px',
                                borderRadius: '0.25rem',
                                fontSize: '0.68rem',
                                color: '#cbd5e1'
                              }}
                            >
                              <strong style={{ color: '#ffffff' }}>{mod.label}:</strong> {mod.value}
                            </span>
                          ))}
                        </div>
                      )}
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
              <span>{t('aiAgentWidget.executing')}</span>
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
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* Voice Mic Button with Pulsing Soundwave Animation */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid #ef4444',
                    animation: 'pulseRing 1.2s infinite ease-out'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: '2px solid #f87171',
                    animation: 'pulseRingOuter 1.5s infinite ease-out'
                  }}
                />
              </>
            )}

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
                boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
                zIndex: 2
              }}
              title={isListening ? t('aiAgentWidget.listeningVoice') : 'Voice Input'}
            >
              <Mic size={18} />
            </button>
          </div>

          {/* Text Input */}
          <input
            type="text"
            placeholder={isListening ? t('aiAgentWidget.listeningVoice') : t('aiAgentWidget.inputPlaceholder')}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{
              flex: 1,
              minHeight: '44px',
              borderRadius: 'var(--radius-pill)',
              background: '#0f172a',
              border: isListening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              padding: '0 16px',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s ease'
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
            <span>{t('aiAgentWidget.send')}</span>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
