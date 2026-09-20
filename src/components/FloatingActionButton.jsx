import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '../utils/translations';

/**
 * Floating Action Button (FAB) for Chakkibook
 * 
 * Specs:
 * - 58px high-elevation Big '+' FAB pinned at bottom-right (`bottom: calc(76px + env(safe-area-inset-bottom))`).
 * - Rich saffron-gold gradient (#fbbf24 to #b45309).
 * - Ambient breathing ring pulse animation.
 * - Smooth spring press physics & icon rotation when entry active.
 * - 100% SVG Lucide React Plus icon (ZERO emojis).
 * - Full i18n support with useTranslation().
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

  const buttonTitle = t('fab.newEntryTitle') || t('fab.newEntry') || 'Nayi Entry';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`fab-btn ${isEntryActive ? 'active' : ''}`}
      aria-label={buttonTitle}
      title={buttonTitle}
      style={{
        position: 'fixed',
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        right: '18px',
        width: '58px',
        height: '58px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 85%, #b45309 100%)',
        color: '#ffffff',
        border: '1.5px solid rgba(255, 255, 255, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isEntryActive
          ? '0 0 0 4px rgba(217, 119, 6, 0.35), 0 12px 32px -2px rgba(217, 119, 6, 0.7)'
          : '0 10px 28px -2px rgba(217, 119, 6, 0.55), 0 4px 12px rgba(0, 0, 0, 0.15)',
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
          transform: isEntryActive ? 'rotate(90deg) scale(1.08)' : 'rotate(0deg)',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
        }}
      />
      {/* Visual pulse ring indicator */}
      <span className="fab-pulse-ring" />
    </button>
  );
}
