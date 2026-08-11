'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PostInsights({ postId, onClose }) {
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => { loadInsights(); }, [period]);

  const loadInsights = async () => {
    const { data } = await supabase.from('post_analytics').select('*').eq('post_id', postId).single();
    if (data) setInsights(data);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  const stats = [
    { label: 'Views', value: insights?.views || 0, icon: '👁️', color: '#3b82f6' },
    { label: 'Likes', value: insights?.likes || 0, icon: '❤️', color: '#ef4444' },
    { label: 'Comments', value: insights?.comments || 0, icon: '💬', color: '#10b981' },
    { label: 'Shares', value: insights?.shares || 0, icon: '↗️', color: '#8b5cf6' },
    { label: 'Saves', value: insights?.saves || 0, icon: '🔖', color: '#f59e0b' },
    { label: 'Reach', value: insights?.reach || 0, icon: '📡', color: '#ec4899' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>Post Insights</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: `1px solid ${line}` }}>
          {['24h', '7d', '30d', 'All'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: period === p ? '#ff2442' : chip, color: period === p ? '#fff' : ink, border: 'none', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>

        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: chip, borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{s.icon}</span>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ background: chip, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 8 }}>Engagement Rate</div>
            <div style={{ height: 8, background: line, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(((insights?.likes || 0) + (insights?.comments || 0)) / Math.max(insights?.views || 1, 1) * 100, 100)}%`, background: 'linear-gradient(90deg, #ff2442, #ff7a59)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>
              {(((insights?.likes || 0) + (insights?.comments || 0)) / Math.max(insights?.views || 1, 1) * 100).toFixed(1)}% engagement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
