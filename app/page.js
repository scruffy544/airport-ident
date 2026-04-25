'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { AIRPORTS, STATES } from '../data/airports';
import RunwayDiagram from '../components/RunwayDiagram';
import AirportDetail from '../components/AirportDetail';
import Header from '../components/Header';

const PER_PAGE = 48;

export default function Home() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = AIRPORTS;
    if (stateFilter) list = list.filter(a => a.state === stateFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(a =>
        a.faa.toLowerCase().includes(q) ||
        a.iata.toLowerCase().includes(q) ||
        a.icao.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, stateFilter]);

  useEffect(() => { setPage(0); }, [query, stateFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (selected) {
    return (
      <>
        <Header />
        <AirportDetail airport={selected} onBack={() => setSelected(null)} />
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Hero */}
        <div style={{ marginBottom: 40, maxWidth: 600 }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
            Look up any<br /><span style={{ color: '#94e8b4' }}>U.S. airport</span>
          </h1>
          <p style={{ fontSize: 16, color: '#6a9a7a', lineHeight: 1.5 }}>
            Search {AIRPORTS.length} airports by FAA, IATA, or ICAO code — or by name, city, or state.
            View runway configurations, elevation data, and identifier details.
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by code, name, city, or state..."
            style={{ flex: 1, minWidth: 240, padding: '13px 18px', background: '#13261a', border: '1px solid #1e3828', borderRadius: 8, color: '#d4e8dc', fontSize: 15, fontFamily: "'DM Mono', monospace", transition: 'border-color 0.15s' }}
          />
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            style={{ padding: '13px 14px', background: '#13261a', border: '1px solid #1e3828', borderRadius: 8, color: '#8ab89a', fontSize: 13, fontFamily: "'DM Mono', monospace", minWidth: 160, cursor: 'pointer' }}
          >
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Count */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47', marginBottom: 14, letterSpacing: 1, display: 'flex', justifyContent: 'space-between' }}>
          <span>{filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}</span>
          {totalPages > 1 && <span>PAGE {page + 1} / {totalPages}</span>}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {visible.map((apt, i) => (
            <div
              key={apt.faa + apt.icao}
              className="card"
              onClick={() => { setSelected(apt); window.scrollTo(0, 0); }}
              style={{ background: '#13261a', border: '1px solid #1a2e22', borderRadius: 10, padding: '18px 20px', animation: `fadeUp 0.25s ease ${Math.min(i * 0.02, 0.4)}s both` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color: '#94e8b4', letterSpacing: 4, lineHeight: 1 }}>{apt.iata}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginTop: 4 }}>{apt.faa} / {apt.icao}</div>
                </div>
                <RunwayDiagram runways={apt.runways} size={48} />
              </div>
              <div style={{ fontSize: 14, color: '#aacaba', lineHeight: 1.3, marginBottom: 4 }}>{apt.name}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47' }}>{apt.city}, {apt.state} · {apt.elev.toLocaleString()} ft</div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3d5a47' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>✈</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14 }}>No airports match your search</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button className="btn" disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 6, padding: '10px 18px', color: page === 0 ? '#1e3828' : '#8ab89a', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>← PREV</button>
            <button className="btn" disabled={page === totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 6, padding: '10px 18px', color: page === totalPages - 1 ? '#1e3828' : '#8ab89a', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>NEXT →</button>
          </div>
        )}
      </div>

      <footer style={{ borderTop: '1px solid #1a2e22', padding: 20, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1e3828', marginTop: 48 }}>
        IDENT · {AIRPORTS.length} U.S. AIRPORTS · NOT FOR NAVIGATION · DATA SOURCE: FAA
      </footer>
    </>
  );
}
