import React, { useState } from 'react';
import { Sparkles, Send, Mic, RefreshCw } from 'lucide-react';
import Modal from '../../ui/Modal';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Avatar from '../../ui/Avatar';
import { useStore } from '../../../store/useStore';
import { queryAIAgent } from '../../../services/aiAgent';

export default function AISheet({ isOpen, onClose }) {
  const chatHistory = useStore((state) => state.chatHistory);
  const addChatMessage = useStore((state) => state.addChatMessage);
  const boris = useStore((state) => state.boris);
  const customers = useStore((state) => state.customers);
  const inventory = useStore((state) => state.inventory);
  const shop = useStore((state) => state.shop);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const promptShortcuts = [
    'Aaj kitni pisai hui?',
    'Kiska udhar baki hai?',
    'Mustard oil stock kitna hai?'
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    addChatMessage({ sender: 'user', text });
    setInputMessage('');
    setLoading(true);

    try {
      const responseText = await queryAIAgent(text, {
        boris,
        customers,
        inventory,
        shop
      });
      addChatMessage({ sender: 'ai', text: responseText });
    } catch (e) {
      addChatMessage({
        sender: 'ai',
        text: 'Bhaiya, network issue tha. Phir se poochhein ya internet check karein!'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chakki AI Co-Pilot"
      subtitle="Voice & text assistant for flour mill operations"
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '480px' }}>
        {/* Chat History Messages Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '0.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
            marginBottom: '0.75rem'
          }}
        >
          {chatHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {!isUser ? (
                  <Avatar name="Chakki AI" size={32} hasAiDot={true} />
                ) : (
                  <Avatar name={shop?.ownerName || 'You'} size={32} />
                )}

                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isUser ? 'var(--primary-color)' : 'hsl(var(--surface-2))',
                    color: isUser ? '#FFFFFF' : 'hsl(var(--ink))',
                    border: isUser ? 'none' : '1px solid hsl(var(--line))',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--ink-3))', fontSize: '13px' }}>
              <RefreshCw size={14} className="spin" />
              <span>Chakki AI soch raha hai...</span>
            </div>
          )}
        </div>

        {/* Prompt Shortcuts */}
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}
        >
          {promptShortcuts.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(s)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'hsl(var(--surface-2))',
                border: '1px solid hsl(var(--line))',
                fontSize: '12px',
                fontWeight: '600',
                color: 'hsl(var(--ink-2))',
                cursor: 'pointer'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Aapka sawal bolo ya likho..."
            style={{ flex: 1 }}
          />

          <Button
            variant="brand"
            icon={Send}
            onClick={() => handleSend()}
            style={{ width: '48px', height: '48px', padding: 0 }}
          />
        </div>
      </div>
    </Modal>
  );
}
