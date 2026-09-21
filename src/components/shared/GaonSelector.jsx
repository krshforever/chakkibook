import React from 'react';
import { MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Chip from '../ui/Chip';

export default function GaonSelector({ selectedVillage, onSelectVillage, className = '' }) {
  const getVillages = useStore((state) => state.getVillages);
  const getVillageStats = useStore((state) => state.getVillageStats);
  const villages = getVillages() || [];

  const allStats = getVillageStats('all');

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.25rem 0.25rem 0.5rem',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'hsl(var(--ink-3))',
          fontSize: '12px',
          fontWeight: '600',
          paddingRight: '0.25rem',
          flexShrink: 0
        }}
      >
        <MapPin size={14} />
        <span>Gaon:</span>
      </div>

      {/* All Villages Chip */}
      <Chip
        label="Sabhi Gaon"
        count={allStats.pendingBoris || villages.length}
        active={!selectedVillage || selectedVillage === 'all'}
        onClick={() => onSelectVillage('all')}
      />

      {/* Individual Village Chips */}
      {villages.map((v) => {
        const stats = getVillageStats(v.name);
        return (
          <Chip
            key={v.name}
            label={v.name}
            count={stats.pendingBoris}
            active={selectedVillage === v.name}
            onClick={() => onSelectVillage(v.name)}
          />
        );
      })}
    </div>
  );
}
