import React from 'react';
import { MapPin, Users, Clock, IndianRupee, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';

/**
 * GaonSelector Component for Chakkibook
 * 
 * Specs:
 * - Touch-scroll horizontal pill bar with touch physics (`overflowX: auto`).
 * - Live badges for pending queue, customer count, and village dues.
 * - 1-tap village filtering with vibrant active indicator.
 * - 100% SVG Lucide React icons (ZERO emojis).
 * - Full i18n support with useTranslation().
 */
export default function GaonSelector({
  selectedVillage = 'all',
  onSelectVillage,
  badgeType = 'pending', // 'pending' | 'customers' | 'dues' | 'none'
  allLabel,
  style = {}
}) {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme || 'light');
  const isDark = theme === 'dark';

  const displayAllLabel = allLabel || t('common.allVillages');
  const getVillages = useStore((state) => state.getVillages);
  const villages = getVillages ? getVillages() : [];

  const handleSelect = (v) => {
    if (onSelectVillage) {
      onSelectVillage(v);
    }
  };

  // Compute total aggregates for "All" pill
  const totalAggregate = villages.reduce((sum, v) => {
    if (badgeType === 'pending') return sum + (v.pendingCount || 0);
    if (badgeType === 'customers') return sum + (v.customerCount || 0);
    if (badgeType === 'dues') return sum + (v.totalDues || 0);
    return sum;
  }, 0);

  const isAllSelected = String(selectedVillage || 'all').toLowerCase() === 'all';

  return (
    <div
      className="gaon-selector-container"
      role="region"
      aria-label="Village Quick Filter"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '6px 4px',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* 1. "All Villages" Pill */}
      <button
        type="button"
        onClick={() => handleSelect('all')}
        aria-pressed={isAllSelected}
        style={{
          minHeight: '44px',
          height: '44px',
          padding: '0 14px',
          borderRadius: '9999px',
          border: isAllSelected
            ? '1.5px solid rgba(255, 255, 255, 0.4)'
            : (isDark ? '1px solid #334155' : '1px solid #cbd5e1'),
          backgroundColor: isAllSelected
            ? '#d97706'
            : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
          color: isAllSelected
            ? '#ffffff'
            : (isDark ? '#e2e8f0' : '#1e293b'),
          fontSize: '0.82rem',
          fontWeight: isAllSelected ? 800 : 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: isAllSelected
            ? '0 4px 14px rgba(217, 119, 6, 0.4)'
            : '0 1px 3px rgba(0, 0, 0, 0.04)',
          transform: isAllSelected ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {isAllSelected ? (
          <Check size={14} strokeWidth={3} />
        ) : (
          <MapPin size={14} style={{ opacity: 0.7 }} />
        )}
        <span>{displayAllLabel}</span>

        {/* Live Aggregate Badge */}
        {badgeType !== 'none' && totalAggregate > 0 && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: isAllSelected
                ? 'rgba(255, 255, 255, 0.25)'
                : (isDark ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.12)'),
              color: isAllSelected
                ? '#ffffff'
                : (isDark ? '#fbbf24' : '#b45309'),
              marginLeft: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            {badgeType === 'pending' && <Clock size={11} strokeWidth={2.5} />}
            {badgeType === 'customers' && <Users size={11} strokeWidth={2.5} />}
            {badgeType === 'dues' && <IndianRupee size={11} strokeWidth={2.5} />}
            {badgeType === 'dues' ? `${totalAggregate}` : totalAggregate}
          </span>
        )}
      </button>

      {/* 2. Individual Village Pills */}
      {villages.map((v) => {
        const isSelected = String(selectedVillage || 'all').toLowerCase() === String(v?.name || '').toLowerCase();
        let badgeVal = null;
        if (badgeType === 'pending') badgeVal = v.pendingCount;
        else if (badgeType === 'customers') badgeVal = v.customerCount;
        else if (badgeType === 'dues') badgeVal = v.totalDues > 0 ? v.totalDues : null;

        return (
          <button
            key={v.name}
            type="button"
            onClick={() => handleSelect(v.name)}
            aria-pressed={isSelected}
            style={{
              minHeight: '44px',
              height: '44px',
              padding: '0 14px',
              borderRadius: '9999px',
              border: isSelected
                ? '1.5px solid rgba(255, 255, 255, 0.4)'
                : (isDark ? '1px solid #334155' : '1px solid #cbd5e1'),
              backgroundColor: isSelected
                ? '#d97706'
                : (isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff'),
              color: isSelected
                ? '#ffffff'
                : (isDark ? '#e2e8f0' : '#1e293b'),
              fontSize: '0.82rem',
              fontWeight: isSelected ? 800 : 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              boxShadow: isSelected
                ? '0 4px 14px rgba(217, 119, 6, 0.4)'
                : '0 1px 3px rgba(0, 0, 0, 0.04)',
              transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {isSelected ? (
              <Check size={14} strokeWidth={3} />
            ) : (
              <MapPin size={14} style={{ opacity: 0.6 }} />
            )}
            <span>{v.name}</span>

            {/* Live Village Badge */}
            {badgeVal !== null && badgeVal !== undefined && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: isSelected
                    ? 'rgba(255, 255, 255, 0.25)'
                    : (badgeType === 'dues'
                        ? (isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.12)')
                        : (isDark ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.12)')),
                  color: isSelected
                    ? '#ffffff'
                    : (badgeType === 'dues'
                        ? '#dc2626'
                        : (isDark ? '#fbbf24' : '#b45309')),
                  marginLeft: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {badgeType === 'pending' && <Clock size={11} strokeWidth={2.5} />}
                {badgeType === 'customers' && <Users size={11} strokeWidth={2.5} />}
                {badgeType === 'dues' && <IndianRupee size={11} strokeWidth={2.5} />}
                {badgeVal}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
