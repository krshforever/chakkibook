import React from 'react';
import { LayoutDashboard, BookOpen, Package, Plus, AudioLines } from 'lucide-react';

/**
 * Bottom navigation.
 *
 * Four destinations, voice first. That ordering is the whole "AI-first"
 * argument in one decision: the tab an operator lands on is the one they can
 * drive without reading anything. Dashboard / Khata / Stock are the same
 * places as before, just one step further away.
 *
 * Each tab is colour-coded so the active state survives a glance rather than
 * relying on the label. Touch targets stay at 52px+ with generous hit padding.
 */
const TABS = [
  { id: 'voice', label: 'Bolo', Icon: AudioLines, tone: 'hsl(var(--ai-indigo))' },
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard, tone: 'hsl(var(--brand-500))' },
  { id: 'khata', label: 'Khata', Icon: BookOpen, tone: 'hsl(var(--brand-600))' },
  { id: 'stock', label: 'Stock', Icon: Package, tone: 'hsl(var(--spellar-500))' }
];

export default function BottomNav({ activeTab, setActiveTab, onOpenNewEntry }) {
  return (
    <>
      {/* Floating action — new entry by hand, one tap from anywhere */}
      <button
        type="button"
        onClick={onOpenNewEntry}
        className="fab-floating tap-effect"
        title="+ Nayi Bori Entry"
        aria-label="Nayi bori entry"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <nav
        className="nav"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '600px',
          zIndex: 100,
          backgroundColor: 'hsl(var(--surface))',
          borderTop: '1px solid hsl(var(--line))',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          paddingTop: '0.375rem',
          boxShadow: '0 -4px 20px rgba(33, 26, 18, 0.06)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            alignItems: 'center',
            height: '54px',
            padding: '0 0.25rem'
          }}
        >
          {TABS.map(({ id, label, Icon, tone }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="tap-effect"
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  background: 'none',
                  border: 'none',
                  color: active ? tone : 'hsl(var(--ink-3))',
                  cursor: 'pointer',
                  padding: '0.25rem 0.125rem',
                  minHeight: '50px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <Icon size={id === 'voice' ? 23 : 20} strokeWidth={active ? 2.5 : 1.8} />
                <span style={{ fontSize: '10.5px', fontWeight: active ? '800' : '600', letterSpacing: '0.01em' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
