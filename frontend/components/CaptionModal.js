'use client';
import { useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const PRESET_STYLES = ['Travel Vlog', 'Recipe Share', 'OOTD', 'Sunset Mood', 'City Life', 'Cottagecore', 'Aesthetic'];
const PRESET_HASH_TAGS = ['#dailylook', '#travelgram', '#foodstagram', '#ootd', '#aesthetic', '#sunset', '#explorepage', '#fashionblogger', '#lifestyle', '#wanderlust'];

export default function CaptionModal({ onClose }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ai/captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: desc, style: selected, hashtags: selectedTags })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('AI Caption failed:', err);
    }
    setLoading(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(560px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>✨ AI Caption Generator</h3>

        <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Caption Style</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {PRESET_STYLES.map(s => (
              <button key={s} onClick={() => setSelected(selected === s ? null : s)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, border: '1.5px solid var(--line)', cursor: 'pointer', background: selected === s ? 'var(--rn-red)' : 'var(--bg)', color: selected === s ? '#fff' : 'var(--ink)', transition: 'all .2s' }}>
                {s}
              </button>
            ))}
          </div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Hashtags</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_HASH_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, border: '1.5px solid var(--line)', cursor: 'pointer', background: selectedTags.includes(t) ? 'var(--rn-red)' : 'var(--bg)', color: selectedTags.includes(t) ? '#fff' : 'var(--ink)', transition: 'all .2s' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title / main subject" style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', padding: '0 12px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Additional details — what happened? How do you feel?" rows={2} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', padding: '10px 12px', fontSize: 13, marginBottom: 12, resize: 'vertical', boxSizing: 'border-box' }} />

        <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', height: 40, borderRadius: 20, background: 'linear-gradient(135deg, var(--rn-red), #ff7a59)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 14 }}>
          {loading ? 'Generating…' : 'Generate Captions'}
        </button>

        {result && (
          <div style={{ background: 'var(--chip)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Generated Options</h4>
            {result.captions.map((c, i) => (
              <div key={i} style={{ padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', marginBottom: 8 }}>
                <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{c.text}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {c.tags.map(t => <span key={t} style={{ padding: '3px 10px', borderRadius: 10, background: 'rgba(255,107,107,.08)', color: 'var(--rn-red)', fontSize: 11, fontWeight: 600 }}>{t}</span>)}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(c.text + '\n\n' + c.tags.join(' ')); }} style={{ padding: '5px 12px', borderRadius: 12, background: 'var(--rn-red)', color: '#fff', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Copy</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(255,107,107,.05)', border: '1px dashed rgba(255,107,107,.2)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Best Practices</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--sub)', lineHeight: 1.7 }}>
                {result.bestPractices.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
