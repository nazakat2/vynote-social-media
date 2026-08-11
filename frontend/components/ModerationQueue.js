'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FLAGGED_KEYWORDS = ['spam', 'scam', 'buy now', 'click here', 'free money', 'dm for', 'follow for follow', 'f4f', 'like4like'];

export function useContentModeration() {
  const [flaggedContent, setFlaggedContent] = useState([]);

  const scanText = (text) => {
    const lower = text.toLowerCase();
    const flags = FLAGGED_KEYWORDS.filter(kw => lower.includes(kw));
    return { isFlagged: flags.length > 0, keywords: flags, score: flags.length * 25 };
  };

  const reportContent = async (entityType, entityId, reason) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('reports').insert({
      reporter_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      reason
    });
  };

  const getReports = async (status = 'pending') => {
    return supabase.from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(display_name, username, avatar_url)')
      .eq('status', status)
      .order('created_at', { ascending: false });
  };

  const resolveReport = async (reportId, status, action) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    if (action === 'delete') {
      const { data: report } = await supabase.from('reports').select('entity_type, entity_id').eq('id', reportId).single();
      if (report) {
        const table = report.entity_type === 'post' ? 'posts' : report.entity_type === 'comment' ? 'comments' : 'profiles';
        await supabase.from(table).delete().eq('id', report.entity_id);
      }
    }
  };

  return { scanText, reportContent, getReports, resolveReport, flaggedContent };
}

export default function ModerationQueue({ onClose, addToast }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { resolveReport } = useContentModeration();

  useEffect(() => { loadReports(); }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(display_name, username, avatar_url)')
      .eq('status', filter)
      .order('created_at', { ascending: false });
    if (data) setReports(data);
    setLoading(false);
  };

  const handleAction = async (reportId, status, action) => {
    await resolveReport(reportId, status, action);
    setReports(prev => prev.filter(r => r.id !== reportId));
    addToast?.(`Report ${status}`);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(600px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>Moderation Queue</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: `1px solid ${line}` }}>
          {['pending', 'reviewed', 'resolved', 'dismissed'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: filter === s ? '#ff2442' : chip, color: filter === s ? '#fff' : ink, border: `1px solid ${filter === s ? '#ff2442' : line}`, cursor: 'pointer' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>Loading...</div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>No reports found</div>
          ) : reports.map(r => (
            <div key={r.id} style={{ padding: 16, background: chip, borderRadius: 12, marginBottom: 12, border: `1px solid ${line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src={r.reporter?.avatar_url || 'https://i.pravatar.cc/150'} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: ink }}>@{r.reporter?.username}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>{r.entity_type}</span>
                <span style={{ fontSize: 11, color: sub, marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 13, color: ink, marginBottom: 12 }}>{r.reason}</p>
              {filter === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleAction(r.id, 'resolved', 'delete')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete & Resolve</button>
                  <button onClick={() => handleAction(r.id, 'resolved')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer' }}>Dismiss Report</button>
                  <button onClick={() => handleAction(r.id, 'reviewed')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: chip, border: `1px solid ${line}`, cursor: 'pointer', color: ink }}>Mark Reviewed</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
