import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Send, Bot, X, ChevronUp, Scale, Coins, BookOpen, CheckCircle2 } from 'lucide-react';
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
      text: 'Namaste! Main **ChakkiBot AI Agent** hoon. Aap bol kar ya likh kar koi bhi kaam karwa sakte hain (e.g. *"Ramesh ki 50kg gehun bori jama karo"*, *"Aaj ki kamai batao"*).',
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
        handleSendMessage(transcript);
      };

      recognition.onerror = (err) => {
        console.warn('Speech err:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setIsProcessing(true);

    try {
      const result = await processAICommand(textToSend, store);

      const aiMsg = {
        id: `m_${Date.now() + 1}`,
        sender: 'ai',
        text: result.message || 'Kaam complete ho gaya hai!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: result.actionExecuted || null
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `m_${Date.now() + 1}`,
          sender: 'ai',
          text: 'Maaf kijiye, is command ko samajhne me dikkat aayi. Kripya dhyan se dobara likhein.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '72px',
            right: '16px',
            zIndex: 99,
            background: 'linear-gradient(135deg, #d97706, #b45309)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '2rem',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.4)',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 800,
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}
        >
          <Sparkles size={18} />
          <span>ChakkiBot AI</span>
        </button>
      )}

      {/* Expanded Chat Drawer Container */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '64px',
          right: '12px',
          left: '12px',
          maxWidth: '440px',
          margin: '0 auto',
          height: '480px',
          maxHeight: '75vh',
          backgroundColor: '#ffffff',
          borderRadius: '1.25rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(217, 119, 6, 0.2)',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4a2f1a, #2d1a0e)',
            color: '#ffffff',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fef3c7' }}>ChakkiBot Assistant</div>
                <div style={{ fontSize: '0.68rem', color: '#fde68a', opacity: 0.9 }}>Autonomous AI Register Agent</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Command Chips */}
          <div style={{
            backgroundColor: '#fffbeb',
            padding: '8px 12px',
            borderBottom: '1px solid #fef3c7',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto'
          }}>
            {[
              'Ramesh 50kg gehun',
              'Aaj ki kamai',
              'Gehun rate ₹4',
              'Bijli bill ₹1200'
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(chip);
                  handleSendMessage(chip);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '1rem',
                  border: '1px solid #fde68a',
                  backgroundColor: '#ffffff',
                  color: '#92400e',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  backgroundColor: m.sender === 'user' ? '#d97706' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: m.sender === 'ai' ? '1px solid #e2e8f0' : 'none',
                  fontSize: '0.88rem',
                  lineHeight: 1.4
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                <div style={{
                  fontSize: '0.65rem',
                  marginTop: '4px',
                  textAlign: 'right',
                  opacity: 0.7,
                  color: m.sender === 'user' ? '#fef3c7' : '#94a3b8'
                }}>
                  {m.timestamp}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#d97706" />
                <span>ChakkiBot processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '10px 12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <button
              type="button"
              onClick={handleMicToggle}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isListening ? '#ef4444' : '#fef3c7',
                color: isListening ? '#ffffff' : '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Mic size={18} />
            </button>

            <input
              type="text"
              placeholder="Bol kar ya type karke command dein..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                height: '38px',
                padding: '0 12px',
                borderRadius: '0.75rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#d97706',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: !inputText.trim() || isProcessing ? 0.5 : 1
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
