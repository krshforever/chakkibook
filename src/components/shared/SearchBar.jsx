import React from 'react';
import { Search, Mic, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Grahak naam, mobile, ya anaj search karein...'
}) {
  const isVoiceListening = useStore((state) => state.isVoiceListening);
  const setVoiceListening = useStore((state) => state.setVoiceListening);

  const toggleMic = () => {
    setVoiceListening(!isVoiceListening);
    if (!isVoiceListening && 'webkitSpeechRecognition' in window) {
      try {
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          onChange?.({ target: { value: text } });
          setVoiceListening(false);
        };
        recognition.onerror = () => setVoiceListening(false);
        recognition.onend = () => setVoiceListening(false);
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition notice:', e);
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          color: 'hsl(var(--ink-3))',
          pointerEvents: 'none'
        }}
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '48px',
          paddingLeft: '40px',
          paddingRight: '76px',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-pill)',
          fontSize: '14px',
          fontWeight: '500',
          color: 'hsl(var(--ink))',
          outline: 'none'
        }}
      />

      <div
        style={{
          position: 'absolute',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {value && (
          <button
            type="button"
            onClick={onClear}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--ink-3))',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={toggleMic}
          className={`tap-effect ${isVoiceListening ? 'voice-pulsing' : ''}`}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: isVoiceListening ? 'var(--primary-color)' : 'hsl(var(--surface-2))',
            color: isVoiceListening ? '#FFFFFF' : 'var(--primary-color)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Voice Search"
        >
          <Mic size={16} />
        </button>
      </div>
    </div>
  );
}
