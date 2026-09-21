import React from 'react';
import { Mic } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export default function VoiceInput({ onSpeechResult, className = '' }) {
  const isVoiceListening = useStore((state) => state.isVoiceListening);
  const setVoiceListening = useStore((state) => state.setVoiceListening);

  const handleToggleVoice = () => {
    const newState = !isVoiceListening;
    setVoiceListening(newState);

    if (newState && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      try {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = 'hi-IN';
        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          onSpeechResult?.(text);
          setVoiceListening(false);
        };
        recognition.onerror = () => setVoiceListening(false);
        recognition.onend = () => setVoiceListening(false);
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition notice:', e);
      }
    } else if (!newState) {
      setVoiceListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleVoice}
      className={`tap-effect ${isVoiceListening ? 'voice-pulsing' : ''} ${className}`}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: isVoiceListening ? 'var(--primary-color)' : 'hsl(var(--surface))',
        color: isVoiceListening ? '#FFFFFF' : 'var(--primary-color)',
        border: '1.5px solid var(--primary-color)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(232, 139, 0, 0.2)',
        transition: 'all 0.2s ease'
      }}
      title="Voice Command (Speak in Hindi/Hinglish)"
    >
      <Mic size={24} />
    </button>
  );
}
