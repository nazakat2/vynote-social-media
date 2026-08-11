'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SchedulerModal({ onClose, addToast }) {
  const [scheduled, setScheduled] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Food', date: '', time: '09:00' });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('post_schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_published', false)
      .order('scheduled_for', { ascending: true });
    if (data) setScheduled(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.date) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const scheduledFor = new Date(`${form.date}T${form.time}`).toISOString();
    const { data, error } = await supabase
      .from('post_schedules')
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        scheduled_for: scheduledFor
      })
      .select()
      .single();
    if (data) {
      setScheduled((prev) => [data, ...prev]);
      setForm({ title: '', description: '', category: 'Food', date: '', time: '09:00' });
      setSuccess(true);
      addToast?.('Post scheduled');
      setTimeout(() => { setSuccess(false); setShowForm(false); }, 1500);
    }
  };

  const deleteScheduled = async (id) => {
    const { error } = await supabase.from('post_schedules').delete().eq('id', id);
    if (!error) {
      setScheduled((prev) => prev.filter((s) => s.id !== id));
      addToast?.('Schedule removed');
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(560px,96vw)', maxHeight: '90vh', overflowY: 'auto', background: 'var(--card-bg, #ffffff)', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--ink, #222)' }}>Post Scheduler</h3>

        <button onClick={() => setShowForm(!showForm)} style={{ height: 38, padding: '0 18px', borderRadius: 19, background: 'var(--rn-red, #ff2442)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
          {showForm ? 'Cancel' : '+ Schedule Post'}
        </button>

        {showForm && (
          <div style={{ background: 'var(--chip, #f0f0f0)', border: '1px solid var(--line, #e5e5e5)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Post title"
              style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '0 12px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Post description (optional)" rows={2}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '10px 12px', fontSize: 13, marginBottom: 10, resize: 'vertical', boxSizing: 'border-box' }} />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '0 12px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }}>
              {['Food', 'Fashion', 'Travel', 'Beauty', 'Fitness', 'Home', 'Pets', 'Art', 'Photography'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '0 12px', fontSize: 13 }} />
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                style={{ flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '0 12px', fontSize: 13 }} />
            </div>
            <button onClick={handleSubmit} style={{ width: '100%', height: 38, borderRadius: 19, background: success ? '#22c55e' : 'var(--rn-red, #ff2442)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 10, fontSize: 13, transition: 'background .3s' }}>
              {success ? 'Scheduled!' : 'Confirm Schedule'}
            </button>
          </div>
        )}

        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub, #888)', fontSize: 13 }}>Loading...</div>
          ) : scheduled.map(s => (
            <div key={s.id} style={{ background: 'var(--chip, #f0f0f0)', border: '1px solid var(--line, #e5e5e5)', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--rn-red, #ff2442), #ff7a59)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                📅
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink, #222)' }}>{s.title}</b>
                <span style={{ fontSize: 11, color: 'var(--sub, #888)' }}>{new Date(s.scheduled_for).toLocaleString()}</span>
              </div>
              <button onClick={() => deleteScheduled(s.id)} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', border: 'none', background: 'rgba(239,68,68,.1)', cursor: 'pointer', flexShrink: 0 }}>x</button>
            </div>
          ))}
          {!loading && !scheduled.length && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--sub, #888)', fontSize: 13 }}>No scheduled posts yet. Click "Schedule Post" to get started!</div>}
        </div>
      </div>
    </div>
  );
}
