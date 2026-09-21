import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import Card from '../../ui/Card';

export default function AIInsightCard({
  title = 'Mill Demand Forecast',
  desc = 'Somwar ko Gehun Pisai 30% increase hoti hai. Stone dressing aaj hi check karein.',
  type = 'prediction',
  onAction
}) {
  return (
    <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))', borderColor: 'hsl(var(--line))' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px'
            }}
          >
            <Sparkles size={18} />
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--ai-indigo))',
                border: '1px solid #FFFFFF'
              }}
            />
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
              {title}
            </h4>
            <p style={{ fontSize: '13px', color: 'hsl(var(--ink-2))', marginTop: '2px', lineHeight: '1.4' }}>
              {desc}
            </p>
          </div>
        </div>

        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="tap-effect"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </Card>
  );
}
