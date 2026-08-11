'use client';
import { useState, useEffect } from 'react';
import { profiles, notifications } from '../../lib/api/index';
import { supabase } from '../../lib/supabase';

export default function SettingsPage({ onClose, addToast }) {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({
    likes: true, comments: true, replies: true, follows: true,
    follow_requests: true, mentions: true, reposts: true, messages: true,
    system: true, push_enabled: true
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data: p } = await profiles.get(user.id);
      if (p) {
        setDisplayName(p.display_name || '');
        setBio(p.bio || '');
        setWebsite(p.website || '');
        setIsPrivate(p.is_private || false);
      }
      const { data: pref } = await notifications.getPreferences();
      if (pref) setPrefs(pref);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await profiles.update({
      display_name: displayName, bio, website, is_private: isPrivate
    });
    setSaving(false);
    addToast?.(error ? `Update failed: ${error.message}` : 'Profile updated');
  };

  const savePrefs = async () => {
    setSaving(true);
    await notifications.updatePreferences(prefs);
    setSaving(false);
    addToast?.('Preferences saved');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';
  const inputBg = isDark ? '#2a2a2e' : '#f5f5f7';

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'account', label: 'Account' }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(580px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${line}`, padding: '0 20px', gap: 0, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '12px 16px', fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#ff2442' : sub, background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid #ff2442' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: 'block', marginBottom: 6 }}>Display Name</label>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: inputBg, color: ink, padding: '0 14px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: 'block', marginBottom: 6 }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={150} style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: inputBg, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                <span style={{ fontSize: 11, color: sub }}>{bio.length}/150</span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: 'block', marginBottom: 6 }}>Website</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: inputBg, color: ink, padding: '0 14px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ height: 42, borderRadius: 21, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { key: 'likes', label: 'Likes' },
                { key: 'comments', label: 'Comments' },
                { key: 'replies', label: 'Replies' },
                { key: 'follows', label: 'New Followers' },
                { key: 'follow_requests', label: 'Follow Requests' },
                { key: 'mentions', label: 'Mentions' },
                { key: 'reposts', label: 'Reposts' },
                { key: 'messages', label: 'Messages' },
                { key: 'system', label: 'System' },
                { key: 'push_enabled', label: 'Push Notifications' }
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${line}` }}>
                  <span style={{ fontSize: 14, color: ink }}>{label}</span>
                  <button onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))} style={{ width: 44, height: 24, borderRadius: 12, background: prefs[key] ? '#ff2442' : chip, border: `1px solid ${prefs[key] ? '#ff2442' : line}`, cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 1, left: prefs[key] ? 22 : 1, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                  </button>
                </div>
              ))}
              <button onClick={savePrefs} disabled={saving} style={{ marginTop: 12, height: 42, borderRadius: 21, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${line}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>Private Account</div>
                  <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Only followers can see your posts</div>
                </div>
                <button onClick={() => setIsPrivate(!isPrivate)} style={{ width: 44, height: 24, borderRadius: 12, background: isPrivate ? '#ff2442' : chip, border: `1px solid ${isPrivate ? '#ff2442' : line}`, cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 1, left: isPrivate ? 22 : 1, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </button>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ height: 42, borderRadius: 21, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          )}

          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 16, background: inputBg, borderRadius: 12 }}>
                <div style={{ fontSize: 13, color: sub }}>Email</div>
                <div style={{ fontSize: 14, color: ink, marginTop: 4 }}>{user?.email}</div>
              </div>
              <button onClick={signOut} style={{ height: 42, borderRadius: 21, background: chip, color: '#ff2442', fontWeight: 700, fontSize: 14, border: `1px solid ${line}`, cursor: 'pointer' }}>
                Sign Out
              </button>
              <button onClick={() => {}} style={{ height: 42, borderRadius: 21, background: 'transparent', color: '#ef4444', fontWeight: 600, fontSize: 14, border: `1px solid #ef4444`, cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
