'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AutoReply({ onClose, addToast }) {
  const [user, setUser] = useState(null);
  const [rules, setRules] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ keyword: '', reply: '', is_active: true });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      loadRules(user?.id);
    });
  }, []);

  const loadRules = async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from('auto_reply_rules').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setRules(data);
  };

  const addRule = async () => {
    if (!newRule.keyword.trim() || !newRule.reply.trim()) return;
    await supabase.from('auto_reply_rules').insert({ user_id: user.id, ...newRule });
    setNewRule({ keyword: '', reply: '', is_active: true });
    setShowAdd(false);
    loadRules(user.id);
    addToast?.('Auto-reply rule added!');
  };

  const toggleRule = async (id, active) => {
    await supabase.from('auto_reply_rules').update({ is_active: active }).eq('id', id);
    loadRules(user.id);
  };

  const deleteRule = async (id) => {
    await supabase.from('auto_reply_rules').delete().eq('id', id);
    loadRules(user.id);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(450px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>Auto-Reply</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ New</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        </div>

        {showAdd && (
          <div style={{ padding: 16, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newRule.keyword} onChange={e => setNewRule({ ...newRule, keyword: e.target.value })} placeholder="When someone says..." style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={newRule.reply} onChange={e => setNewRule({ ...newRule, reply: e.target.value })} placeholder="Auto reply message..." rows={2} style={{ width: '100%', borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
            <button onClick={addRule} disabled={!newRule.keyword.trim() || !newRule.reply.trim()} style={{ width: '100%', height: 38, borderRadius: 19, background: newRule.keyword.trim() && newRule.reply.trim() ? '#ff2442' : chip, color: newRule.keyword.trim() && newRule.reply.trim() ? '#fff' : sub, fontWeight: 600, fontSize: 13, border: 'none', cursor: newRule.keyword.trim() && newRule.reply.trim() ? 'pointer' : 'not-allowed' }}>Add Rule</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {rules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🤖</span>
              No auto-reply rules yet
            </div>
          ) : rules.map(rule => (
            <div key={rule.id} style={{ padding: 12, background: chip, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: sub }}>When someone says:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleRule(rule.id, !rule.is_active)} style={{ padding: '4px 10px', borderRadius: 8, background: rule.is_active ? '#10b981' : chip, color: rule.is_active ? '#fff' : sub, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 4 }}>"{rule.keyword}"</div>
              <div style={{ fontSize: 13, color: sub }}>{rule.reply}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
