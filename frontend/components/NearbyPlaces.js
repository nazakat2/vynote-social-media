'use client';
import { useState } from 'react';

const MOCK_PLACES = [
  { id: 1, name: 'Blue Bottle Coffee', category: 'Coffee', rating: 4.5, distance: '0.2 km', address: '123 Main St', icon: '☕' },
  { id: 2, name: 'Central Park', category: 'Park', rating: 4.8, distance: '0.5 km', address: '456 Park Ave', icon: '🌳' },
  { id: 3, name: 'The Pizza Place', category: 'Restaurant', rating: 4.3, distance: '0.8 km', address: '789 Oak St', icon: '🍕' },
  { id: 4, name: 'City Museum', category: 'Museum', rating: 4.7, distance: '1.2 km', address: '321 Museum Rd', icon: '🏛️' },
  { id: 5, name: 'Riverside Gym', category: 'Gym', rating: 4.1, distance: '1.5 km', address: '555 River Rd', icon: '💪' },
  { id: 6, name: 'Sunset Cinema', category: 'Cinema', rating: 4.4, distance: '2.0 km', address: '888 Sunset Blvd', icon: '🎬' },
  { id: 7, name: 'Fresh Market', category: 'Market', rating: 4.6, distance: '0.3 km', address: '222 Market St', icon: '🛒' },
  { id: 8, name: 'Book Haven', category: 'Bookstore', rating: 4.9, distance: '0.7 km', address: '444 Library Ln', icon: '📚' },
  { id: 9, name: 'Yoga Studio', category: 'Wellness', rating: 4.2, distance: '1.0 km', address: '777 Zen Way', icon: '🧘' },
  { id: 10, name: 'Art Gallery', category: 'Gallery', rating: 4.5, distance: '1.8 km', address: '999 Art Ave', icon: '🎨' },
];

const CATEGORIES = ['All', 'Coffee', 'Restaurant', 'Park', 'Museum', 'Gym', 'Cinema', 'Market', 'Bookstore', 'Wellness', 'Gallery'];

export default function NearbyPlaces({ onClose, addToast }) {
  const [places, setPlaces] = useState(MOCK_PLACES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredPlaces = places.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openDirections = (place) => {
    const query = encodeURIComponent(`${place.name}, ${place.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(540px,96vw)', height: 'min(760px,90vh)', background: bg, borderRadius: 22, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.3)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>📍 Nearby Places</h2>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: sub }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search places..." style={{ width: '100%', height: 38, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 12px 0 32px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ padding: '8px 12px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 6, scrollbarWidth: 'none', borderBottom: `1px solid ${line}` }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: selectedCategory === cat ? '#ff2442' : chip, color: selectedCategory === cat ? '#fff' : ink, border: 'none', cursor: 'pointer' }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {filteredPlaces.map(place => (
            <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, background: bg, border: `1px solid ${line}`, borderRadius: 15, marginBottom: 9, cursor: 'pointer', boxShadow: '0 4px 14px rgba(20,20,30,.04)' }} onClick={() => openDirections(place)}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,36,66,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {place.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 2 }}>{place.name}</div>
                <div style={{ fontSize: 12, color: sub }}>{place.category} · {place.distance}</div>
                <div style={{ fontSize: 11, color: sub }}>{place.address}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>⭐ {place.rating}</div>
                <button onClick={(e) => { e.stopPropagation(); openDirections(place); }} style={{ marginTop: 5, padding: '5px 11px', borderRadius: 9, background: '#fff0f2', color: '#ff2442', border: '1px solid #ffd3da', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Directions
                </button>
              </div>
            </div>
          ))}
          {filteredPlaces.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>No places found</div>
          )}
        </div>
      </div>
    </div>
  );
}
