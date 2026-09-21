import React from 'react';
import { LayoutDashboard, BookOpen, Package, Plus } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenNewEntry }) {
  return (
    <>
      {/* V7 FAB Floating above nav */}
      <button
        type="button"
        onClick={onOpenNewEntry}
        className="fab-floating tap-effect"
        title="+ Nayi Bori Entry"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* V7 3-Tab Bottom Nav Only */}
      <nav
        className="nav"
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
          boxShadow: '0 -4px 20px rgba(33, 26, 18, 0.05)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            alignItems: 'center',
            height: '52px',
            padding: '0 1rem'
          }}
        >
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="tap-effect"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: activeTab === 'dashboard' ? 'hsl(var(--brand-500))' : 'hsl(var(--ink-2))',
              cursor: 'pointer'
            }}
          >
            <LayoutDashboard size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'dashboard' ? '700' : '500', marginTop: '2px' }}>
              Home
            </span>
          </button>

          {/* Tab 2: Khata */}
          <button
            type="button"
            onClick={() => setActiveTab('khata')}
            className="tap-effect"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: activeTab === 'khata' ? 'hsl(var(--brand-500))' : 'hsl(var(--ink-2))',
              cursor: 'pointer'
            }}
          >
            <BookOpen size={20} strokeWidth={activeTab === 'khata' ? 2.5 : 1.8} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'khata' ? '700' : '500', marginTop: '2px' }}>
              Khata
            </span>
          </button>

          {/* Tab 3: Stock */}
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className="tap-effect"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: activeTab === 'stock' ? 'hsl(var(--brand-500))' : 'hsl(var(--ink-2))',
              cursor: 'pointer'
            }}
          >
            <Package size={20} strokeWidth={activeTab === 'stock' ? 2.5 : 1.8} />
            <span style={{ fontSize: '11px', fontWeight: activeTab === 'stock' ? '700' : '500', marginTop: '2px' }}>
              Stock
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
