import React from 'react';
import { Calendar } from 'lucide-react';
import Chip from '../ui/Chip';

export default function DateFilter({ selectedFilter = 'aaj', onSelectFilter }) {
  const filterOptions = [
    { id: 'aaj', label: 'Aaj' },
    { id: 'kal', label: 'Kal' },
    { id: 'hafta', label: '7 Din' },
    { id: 'mahina', label: 'Is Mahine' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        overflowX: 'auto',
        padding: '0.25rem 0',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Calendar size={14} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
      {filterOptions.map((opt) => (
        <Chip
          key={opt.id}
          label={opt.label}
          active={selectedFilter === opt.id}
          onClick={() => onSelectFilter(opt.id)}
        />
      ))}
    </div>
  );
}
