import React from 'react';
import { MapPin, Users, Clock, IndianRupee } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';

export default function GaonSelector({
  selectedVillage = 'all',
  onSelectVillage,
  badgeType = 'pending', // 'pending' | 'customers' | 'dues' | 'none'
  allLabel,
  style = {}
}) {
  const { t } = useTranslation();
  const displayAllLabel = allLabel || t('common.allVillages');
  const getVillages = useStore((state) => state.getVillages);
  const villages = getVillages ? getVillages() : [];

  const handleSelect = (v) => {
    if (onSelectVillage) {
      onSelectVillage(v);
    }
  };

  // Compute total aggregates for "All" pill
  const totalCount = villages.reduce((sum, v) => {
    if (badgeType === 'pending') return sum + (v.pendingCount || 0);
    if (badgeType === 'customers') return sum + (v.customerCount || 0);
    if (badgeType === 'dues') return sum + (v.totalDues || 0);
    return sum;
  }, 0);

  return (
    <div
      className="gaon-selector-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        padding: '4px 2px',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* 1. "All Villages" Pill */}
      <button
        type="button"
        onClick={() => handleSelect('all')}
        style={{
          minHeight: '44px',
          height: '44px',
          padding: '0 14px',
          borderRadius: 'var(--radius-pill)',
          border: selectedVillage === 'all' 
            ? '2px solid var(--primary)' 
            : '1.5px solid var(--card-border)',
          backgroundColor: selectedVillage === 'all' 
            ? 'var(--primary)' 
            : 'var(--bg-elevated)',
          color: selectedVillage === 'all' 
            ? '#ffffff' 
            : 'var(--text-main)',
          fontSize: '0.82rem',
          fontWeight: selectedVillage === 'all' ? '800' : '700',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
          boxShadow: selectedVillage === 'all' 
            ? '0 3px 10px rgba(0,0,0,0.12)' 
            : '0 1px 3px rgba(0,0,0,0.03)',
          transition: 'all 0.15s ease'
        }}
      >
        <MapPin size={13} style={{ opacity: selectedVillage === 'all' ? 1 : 0.6 }} />
        <span>{displayAllLabel}</span>
        {badgeType !== 'none' && totalCount > 0 && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: selectedVillage === 'all' 
                ? 'rgba(255,255,255,0.25)' 
                : 'var(--primary-light)',
              color: selectedVillage === 'all' 
                ? '#ffffff' 
                : 'var(--primary-dark)',
              marginLeft: '2px'
            }}
          >
            {badgeType === 'dues' ? `₹${totalCount}` : totalCount}
          </span>
        )}
      </button>

      {/* 2. Individual Village Pills */}
      {villages.map((v) => {
        const isSelected = selectedVillage.toLowerCase() === v.name.toLowerCase();
        let badgeVal = null;
        if (badgeType === 'pending') badgeVal = v.pendingCount;
        else if (badgeType === 'customers') badgeVal = v.customerCount;
        else if (badgeType === 'dues') badgeVal = v.totalDues > 0 ? `₹${v.totalDues}` : null;

        return (
          <button
            key={v.name}
            type="button"
            onClick={() => handleSelect(v.name)}
            style={{
              minHeight: '44px',
              height: '44px',
              padding: '0 14px',
              borderRadius: 'var(--radius-pill)',
              border: isSelected 
                ? '2px solid var(--primary)' 
                : '1.5px solid var(--card-border)',
              backgroundColor: isSelected 
                ? 'var(--primary)' 
                : 'var(--bg-elevated)',
              color: isSelected 
                ? '#ffffff' 
                : 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: isSelected ? '800' : '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              boxShadow: isSelected 
                ? '0 3px 10px rgba(0,0,0,0.12)' 
                : '0 1px 3px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{v.name}</span>
            {badgeVal !== null && badgeVal !== undefined && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isSelected 
                    ? 'rgba(255,255,255,0.25)' 
                    : (badgeType === 'dues' ? 'var(--danger-bg)' : 'var(--primary-light)'),
                  color: isSelected 
                    ? '#ffffff' 
                    : (badgeType === 'dues' ? 'var(--danger)' : 'var(--primary-dark)'),
                  marginLeft: '2px'
                }}
              >
                {badgeVal}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
