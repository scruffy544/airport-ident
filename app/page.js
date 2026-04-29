'use client';

import { useState, useMemo, useEffect } from 'react';
import { AIRPORTS, STATES, parseRunways, getDiagramUrl } from '../data/airports';
import RunwayDiagram from '../components/RunwayDiagram';
import Header from '../components/Header';

var PER_PAGE = 48;

var PRODUCTS = [
  { id: 'mug', name: 'Coffee Mug', icon: '☕', price: 22.99, desc: '11oz white ceramic', printArea: '330x400 DPI' },
  { id: 'poster', name: 'Poster', icon: '🖼️', price: 24.99, desc: 'Museum-quality matte', printArea: '24x36 inches' },
  { id: 'tshirt', name: 'T-Shirt', icon: '👕', price: 29.99, desc: 'Unisex cotton blend', printArea: 'Front chest print' },
  { id: 'cap', name: 'Ball Cap', icon: '🧢', price: 27.99, desc: 'Embroidered dad hat', printArea: 'Front panel' },
  { id: 'sticker', name: 'Oval Sticker', icon: '📋', price: 4.99, desc: 'Die-cut vinyl', printArea: '3x4 inches' },
  { id: 'coaster', name: 'Drink Coaster', icon: '🍺', price: 9.99, desc: 'Cork-backed ceramic', printArea: '4x4 inches' },
  { id: 'towel', name: 'Beach Towel', icon: '🏖️', price: 39.99, desc: 'Full-print microfiber', printArea: '30x60 inches' }
];

function ProductPreview(props) {
  var airport = props.airport;
  var product = props.product;
  var selected = props.selected;
  var onSelect = props.onSelect;
  var isSelected = selected === product.id;

  return (
    <div
      onClick={function() { onSelect(product.id); }}
      style={{
        background: isSelected ? '#1e3828' : '#13261a',
        border: '1px solid ' + (isSelected ? '#3d7a52' : '#1a2e22'),
        borderRadius: 10,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isSelected ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected ? '0 4px 20px rgba(61,122,82,0.2)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{product.icon}</span>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: isSelected ? '#94e8b4' : '#8ab89a' }}>{product.name}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a' }}>{product.desc}</div>
        </div>
      </div>
      <div style={{ background: '#0c1a12', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
        <div style={{ textAlign: 'center' }}>
          <RunwayDiagram runways={airport.runways} size={60} color={isSelected ? '#94e8b4' : '#5a8a6a'} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500, color: isSelected ? '#94e8b4' : '#5a8a6a', letterSpacing: 3, marginTop: 4 }}>{airport.iata}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: '#94e8b4' }}>{'$' + product.price}</div>
        {isSelected && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#94e8b4', letterSpacing: 1 }}>SELECTED</div>
        )}
      </div>
    </div>
  );
}

function ShopSection(props) {
  var airport = props.airport;
  var selectedProduct = props.selectedProduct;
  var setSelectedProduct = props.setSelectedProduct;

  var currentProduct = PRODUCTS.find(function(p) { return p.id === selectedProduct; });

  function handleOrder() {
    window.open('https://www.etsy.com/shop/AirportIDGear', '_blank');
  }

  return (
    <div style={{ marginTop: 40, borderTop: '1px solid #1e3828', paddingTop: 32 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#94e8b4', letterSpacing: 4, marginBottom: 8 }}>SHOP MERCHANDISE</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#d4e8dc', marginBottom: 4 }}>
        Put {airport.iata} on your gear
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#5a8a6a', marginBottom: 24 }}>
        Select a product below to see preview and pricing
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {PRODUCTS.map(function(product) {
          return (
            <ProductPreview
              key={product.id}
              airport={airport}
              product={product}
              selected={selectedProduct}
              onSelect={setSelectedProduct}
            />
          );
        })}
      </div>

      {selectedProduct && currentProduct && (
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, padding: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto', background: '#0c1a12', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 160 }}>
            <div style={{ fontSize: 36 }}>{currentProduct.icon}</div>
            <RunwayDiagram runways={airport.runways} size={100} />
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500, color: '#94e8b4', letterSpacing: 4 }}>{airport.iata}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a' }}>{airport.city}, {airport.state}</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', letterSpacing: 2, marginBottom: 6 }}>YOUR ORDER</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#d4e8dc', marginBottom: 4 }}>{airport.iata} {currentProduct.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#8ab89a', marginBottom: 16 }}>
              {airport.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>
                Product: {currentProduct.desc}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>
                Design: SVG Runway Diagram + IATA Code
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a' }}>
                Print Area: {currentProduct.printArea}
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: '#94e8b4', marginBottom: 16 }}>
              {'$' + currentProduct.price}
            </div>
            <button
              onClick={handleOrder}
              style={{
                padding: '14px 32px',
                background: '#94e8b4',
                color: '#0c1a12',
                border: 'none',
                borderRadius: 8,
                fontFamily: "'DM Mono', monospace",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: 2,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ORDER ON ETSY →
            </button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3d5a47', marginTop: 10 }}>
              Opens our Etsy shop. Printed and shipped by our print partner. Usually arrives in 5-8 business days.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AirportDetail(props) {
  var airport = props.airport;
  var onBack = props.onBack;
  var rwys = parseRunways(airport.runways);
  var longestRwy = Math.max.apply(null, rwys.map(function(r) { return r.lengthNum; }));
  var _selectedProduct = useState(null);
  var selectedProduct = _selectedProduct[0];
  var setSelectedProduct = _selectedProduct[1];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px' }}>
      <button className="btn" onClick={onBack} style={{ background: 'none', border: 'none', color: '#5a8a6a', fontFamily: "'DM Mono', monospace", fontSize: 13, cursor: 'pointer', letterSpacing: 1, padding: '12px 0', marginBottom: 16 }}>
        ← ALL AIRPORTS
      </button>
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', marginBottom: 48, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', letterSpacing: 4, marginBottom: 8 }}>AIRPORT IDENTIFIER</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(56px, 10vw, 80px)', fontWeight: 500, color: '#94e8b4', letterSpacing: 8, lineHeight: 1 }}>{airport.iata}</div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, marginTop: 12, lineHeight: 1.2 }}>{airport.name}</h1>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#5a8a6a', marginTop: 8 }}>{airport.city}, {airport.state}</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <RunwayDiagram runways={airport.runways} size={200} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 40 }}>
        {[
          { label: 'FAA', value: airport.faa },
          { label: 'IATA', value: airport.iata },
          { label: 'ICAO', value: airport.icao },
          { label: 'ELEVATION', value: airport.elev.toLocaleString() + ' ft' },
        ].map(function(item) {
          return (
            <div key={item.label} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color: '#94e8b4' }}>{item.value}</div>
            </div>
          );
        })}
      </div>
      {getDiagramUrl(airport.faa, airport.icao) && (
        <div style={{ marginBottom: 24 }}>
          <a href={getDiagramUrl(airport.faa, airport.icao)} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'inline-block', padding: '14px 28px', background: '#1e3828', border: '1px solid #3d7a52', borderRadius: 8, color: '#94e8b4', fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, letterSpacing: 1, textDecoration: 'none' }}>
            VIEW FAA AIRPORT DIAGRAM →
          </a>
        </div>
      )}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5a8a6a', letterSpacing: 3, marginBottom: 16 }}>RUNWAY DATA</div>
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '12px 18px', borderBottom: '1px solid #1e3828', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2 }}>
            <span>RUNWAY</span><span>LENGTH</span><span>WIDTH</span><span>RELATIVE</span>
          </div>
          {rwys.map(function(r, i) {
            var pct = (r.lengthNum / longestRwy) * 100;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 18px', borderBottom: i < rwys.length - 1 ? '1px solid #1a2e22' : 'none', alignItems: 'center' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: '#94e8b4' }}>{r.id}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#d4e8dc' }}>{r.length} ft</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#8ab89a' }}>{r.width} ft</span>
                <div style={{ height: 6, background: '#1a2e22', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg, #3d7a52, #94e8b4)', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 0 }}>
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 6 }}>RUNWAYS</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: '#94e8b4' }}>{rwys.length}</div>
        </div>
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 6 }}>LONGEST RUNWAY</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color: '#94e8b4' }}>{longestRwy.toLocaleString()} <span style={{ fontSize: 14, color: '#5a8a6a' }}>ft</span></div>
        </div>
        <div style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5a8a6a', letterSpacing: 2, marginBottom: 6 }}>STATE / TERRITORY</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#d4e8dc' }}>{airport.state}</div>
        </div>
      </div>

      <ShopSection airport={airport} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct} />
    </div>
  );
}

export default function Home() {
  var _query = useState('');
  var query = _query[0];
  var setQuery = _query[1];
  var _stateFilter = useState('');
  var stateFilter = _stateFilter[0];
  var setStateFilter = _stateFilter[1];
  var _selected = useState(null);
  var selected = _selected[0];
  var setSelected = _selected[1];
  var _page = useState(0);
  var page = _page[0];
  var setPage = _page[1];

  var filtered = useMemo(function() {
    var list = AIRPORTS;
    if (stateFilter) list = list.filter(function(a) { return a.state === stateFilter; });
    if (query.trim()) {
      var q = query.trim().toLowerCase();
      list = list.filter(function(a) {
        return a.faa.toLowerCase().includes(q) ||
          a.iata.toLowerCase().includes(q) ||
          a.icao.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q);
      });
    }
    return list;
  }, [query, stateFilter]);

  useEffect(function() { setPage(0); }, [query, stateFilter]);

  var totalPages = Math.ceil(filtered.length / PER_PAGE);
  var visible = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (selected) {
    return (
      <>
        <Header />
        <AirportDetail airport={selected} onBack={function() { setSelected(null); }} />
        <footer style={{ borderTop: '1px solid #1a2e22', padding: 20, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1e3828', marginTop: 48 }}>
          IDENT · {AIRPORTS.length} U.S. AIRPORTS · NOT FOR NAVIGATION · DATA SOURCE: FAA
        </footer>
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 40, maxWidth: 600 }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 12 }}>
            Look up any<br /><span style={{ color: '#94e8b4' }}>U.S. airport</span>
          </h1>
          <p style={{ fontSize: 16, color: '#6a9a7a', lineHeight: 1.5 }}>
            Search {AIRPORTS.length} airports by FAA, IATA, or ICAO code — or by name, city, or state.
            View runway configurations, elevation data, and identifier details. Put your favorite airport on a mug, poster, tee, or more.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <input
            className="search-input"
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
            placeholder="Search by code, name, city, or state..."
            style={{ flex: 1, minWidth: 240, padding: '13px 18px', background: '#13261a', border: '1px solid #1e3828', borderRadius: 8, color: '#d4e8dc', fontSize: 15, fontFamily: "'DM Mono', monospace", transition: 'border-color 0.15s' }}
          />
          <select
            value={stateFilter}
            onChange={function(e) { setStateFilter(e.target.value); }}
            style={{ padding: '13px 14px', background: '#13261a', border: '1px solid #1e3828', borderRadius: 8, color: '#8ab89a', fontSize: 13, fontFamily: "'DM Mono', monospace", minWidth: 160, cursor: 'pointer' }}
          >
            <option value="">All States</option>
            {STATES.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
          </select>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#3d5a47', marginBottom: 14, letterSpacing: 1, display: 'flex', justifyContent: 'space-between' }}>
          <span>{filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}</span>
          {totalPages > 1 && <span>PAGE {page + 1} / {totalPages}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {visible.map(function(apt, i) {
            return (
              <div
                key={apt.faa + apt.icao}
                className="card"
                onClick={function() { setSelected(apt); window.scrollTo(0, 0); }}
                style={{ background: '#13261a', border: '1px solid #1a2e22', borderRadius: 10, padding: '18px 20px', animation: 'fadeUp 0.25s ease ' + Math.min(i * 0.02, 0.4) + 's both' }}
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
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3d5a47' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>✈</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14 }}>No airports match your search</div>
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            <button className="btn" disabled={page === 0} onClick={function() { setPage(function(p) { return p - 1; }); window.scrollTo(0, 0); }} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 6, padding: '10px 18px', color: page === 0 ? '#1e3828' : '#8ab89a', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>← PREV</button>
            <button className="btn" disabled={page === totalPages - 1} onClick={function() { setPage(function(p) { return p + 1; }); window.scrollTo(0, 0); }} style={{ background: '#13261a', border: '1px solid #1e3828', borderRadius: 6, padding: '10px 18px', color: page === totalPages - 1 ? '#1e3828' : '#8ab89a', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>NEXT →</button>
          </div>
        )}
      </div>
      <footer style={{ borderTop: '1px solid #1a2e22', padding: 20, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1e3828', marginTop: 48 }}>
        IDENT · {AIRPORTS.length} U.S. AIRPORTS · NOT FOR NAVIGATION · DATA SOURCE: FAA
      </footer>
    </>
  );
}
