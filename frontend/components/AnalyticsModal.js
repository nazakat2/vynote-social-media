'use client';
import { useState, useEffect } from 'react';
import { analytics } from '../lib/api/index';

export default function AnalyticsModal({ onClose, userId }) {
  const [stats, setStats] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [profileViews, setProfileViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    if (!userId) {
      setLoading(false);
      setError('User profile is not available.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const [profileStats, top, views] = await Promise.all([
        analytics.getProfileStats(userId),
        analytics.getTopPosts(userId),
        analytics.getProfileViews(userId)
      ]);

      const profile = profileStats?.data || {};
      setStats([
        { label: 'Followers', value: Number(profile.follower_count) || 0 },
        { label: 'Following', value: Number(profile.following_count) || 0 },
        { label: 'Posts', value: Number(profile.post_count) || 0 }
      ]);
      setTopPosts(Array.isArray(top?.data) ? top.data : []);
      setProfileViews(Number(views?.count ?? views) || 0);

      const apiError = profileStats?.error || top?.error || views?.error;
      if (apiError) setError(apiError.message || 'Some analytics could not be loaded.');
    } catch (requestError) {
      setError(requestError?.message || 'Analytics could not be loaded.');
      setStats([]);
      setTopPosts([]);
      setProfileViews(0);
    } finally {
      setLoading(false);
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(680px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: 'var(--card-bg, #ffffff)', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative' };
  const closeBtn = { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--ink, #222)' }}>Analytics Dashboard</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--sub, #888)' }}>Loading analytics...</div>
        ) : (
          <>
            {error && (
              <div style={{ padding: '10px 12px', marginBottom: 14, borderRadius: 10, background: '#fff0f1', color: '#d9273e', fontSize: 13 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 20 }}>
              {stats?.map((s) => (
                <div key={s.label} style={{ background: 'var(--chip, #f0f0f0)', border: '1px solid var(--line, #e5e5e5)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--rn-red)', display: 'block' }}>{s.value >= 1000 ? (s.value / 1000).toFixed(1) + 'k' : s.value}</span>
                  <span style={{ fontSize: 12, color: 'var(--sub, #888)', marginTop: 4, display: 'block' }}>{s.label}</span>
                </div>
              ))}
              <div style={{ background: 'var(--chip, #f0f0f0)', border: '1px solid var(--line, #e5e5e5)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--rn-red)', display: 'block' }}>{profileViews}</span>
                <span style={{ fontSize: 12, color: 'var(--sub, #888)', marginTop: 4, display: 'block' }}>Profile Views</span>
              </div>
            </div>
            <div style={{ background: 'var(--chip, #f0f0f0)', border: '1px solid var(--line, #e5e5e5)', borderRadius: 14, padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--ink, #222)' }}>Top Performing Posts</h4>
              {topPosts.map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink, #222)' }}>{p.title}</b>
                    <span style={{ fontSize: 11, color: 'var(--sub, #888)' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <b style={{ fontSize: 15, fontWeight: 800, color: 'var(--rn-red)', display: 'block' }}>{(Number(p.like_count) || 0) + (Number(p.comment_count) || 0) + (Number(p.collect_count) || 0)}</b>
                    <span style={{ fontSize: 10, color: 'var(--sub, #888)' }}>engagement</span>
                  </div>
                </div>
              ))}
              {topPosts.length === 0 && <p style={{ color: 'var(--sub, #888)', fontSize: 13, padding: 16, textAlign: 'center' }}>Create some notes to see analytics!</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
