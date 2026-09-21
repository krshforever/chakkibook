import React, { useState } from 'react';
import { Camera, CheckCircle2, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { analyzeGrainQuality } from '../../../services/grainQuality';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

export default function GrainQualityScanner({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedGrain, setSelectedGrain] = useState('Gehun');

  const handleScan = async (file) => {
    setLoading(true);
    try {
      const result = await analyzeGrainQuality(file, selectedGrain);
      setAnalysis(result);
    } catch (e) {
      console.warn('Grain analysis error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Photo Grain Quality Scanner"
      subtitle="AI-powered moisture, impurity & yield estimation"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))', display: 'block', marginBottom: '4px' }}>
            Anaj Type Select Karein
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {['Gehun', 'Bajra', 'Sarson'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGrain(g)}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: selectedGrain === g ? 'var(--primary-light)' : 'hsl(var(--surface-2))',
                  color: selectedGrain === g ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
                  border: selectedGrain === g ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Upload / Camera Trigger Box */}
        <div
          onClick={() => handleScan(null)}
          style={{
            padding: '2rem 1rem',
            border: '2px dashed var(--primary-color)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={32} className="spin" style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark)' }}>
                Sample Photo Scan Ho Raha Hai...
              </span>
            </>
          ) : (
            <>
              <Camera size={36} style={{ color: 'var(--primary-color)' }} />
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                Tap to Take Photo or Upload Grain Sample
              </span>
              <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))' }}>
                Instant Moisture & Yield Grade Calculation
              </span>
            </>
          )}
        </div>

        {/* Analysis Results Display */}
        {analysis && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'hsl(var(--surface-2))',
              border: '1px solid hsl(var(--line))',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--status-healthy-text))' }}>
                {analysis.qualityGrade}
              </span>
              <Sparkles size={16} style={{ color: 'var(--primary-color)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textTransform: 'capitalize' }}>
              <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Moisture</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--ink))' }}>{analysis.moistureContent}</span>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Impurities</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--ink))' }}>{analysis.impurityPercentage}</span>
              </div>
              <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Yield</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--ink))' }}>{analysis.estimatedYield}</span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', marginTop: '2px', lineHeight: '1.4' }}>
              {analysis.recommendation}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
