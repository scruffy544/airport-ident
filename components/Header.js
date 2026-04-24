'use client';

export default function Header() {
  return (
    <header style={{ borderBottom: '1px solid #1a2e22', padding: '16px 24px', position: 'sticky', top: 0, background: '#0c1a12ee', backdropFilter: 'blur(12px)', zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: '#94e8b4', letterSpacing: 3 }}>IDENT</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47', letterSpacing: 1 }}>U.S. Airport Identifiers</span>
        </div>
      </div>
    </header>
  );
}
