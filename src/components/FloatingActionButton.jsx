import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../utils/translations';

/**
 * Floating Action Button (FAB) for Chakkibook
 * Prominent Big '+' button pinned at bottom-right.
 * Triggers "Nayi Entry" modal/tab from anywhere in the app with high thumb ergonomics.
 */
export default function FloatingActionButton({ activeTab, onOpenEntry }) {
  const { t } = useTranslation();
  const isEntryActive = activeTab === 'entry';

  const handleClick = (e) => {
    e.preventDefault();
    if (onOpenEntry) {
      onOpenEntry();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fab-btn ${isEntryActive ? 'active' : ''}`}
      aria-label={t('fab.newEntryTitle')}
      title={t('fab.newEntryTitle')}
      style={{
        position: 'fixed',
        bottom: '76px',
        right: '18px',
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 55%, #b45309 100%)',
        color: '#ffffff',
        border: '1.5px solid rgba(255, 255, 255, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isEntryActive
          ? '0 0 0 4px rgba(217, 119, 6, 0.35), 0 10px 28px -2px rgba(217, 119, 6, 0.65)'
          : '0 8px 24px -2px rgba(217, 119, 6, 0.5), 0 4px 10px rgba(0, 0, 0, 0.12)',
        cursor: 'pointer',
        zIndex: 99,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease'
      }}
    >
      <Plus 
        size={28} 
        strokeWidth={2.8} 
        style={{
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isEntryActive ? 'rotate(90deg) scale(1.05)' : 'rotate(0deg)'
        }}
      />
      {/* Visual pulse ring indicator */}
      <span className="fab-pulse-ring" />
    </button>
  );
}
