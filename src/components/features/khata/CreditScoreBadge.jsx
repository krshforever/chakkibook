import React, { useMemo } from 'react';
import { ShieldCheck, Award, AlertCircle } from 'lucide-react';
import { calculateCreditScore } from '../../../services/credit';
import { useStore } from '../../../store/useStore';

export default function CreditScoreBadge({ customer, showDetail = false }) {
  const boris = useStore((state) => state.boris);

  const credit = useMemo(() => {
    return calculateCreditScore(customer, boris);
  }, [customer, boris]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.55rem',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: credit.bg,
          color: credit.color,
          fontSize: '11px',
          fontWeight: '700'
        }}
      >
        <ShieldCheck size={12} />
        <span>Score: {credit.score}/100</span>
      </div>

      {showDetail && (
        <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))' }}>
          {credit.recommendation}
        </span>
      )}
    </div>
  );
}
