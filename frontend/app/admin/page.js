'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => { checkAdmin(); }, [user]);

  const checkAdmin = async () => {
    if (!user) { setChecking(false); return; }
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role === 'admin' || data?.role === 'moderator') {
      setIsAdmin(true);
      loadDashboard();
    } else {
      setChecking(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    const [usersRes, postsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, avatar_url, role, created_at, is_verified'),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(display_name, username)').order('created_at', { ascending: false }).limit(50)
    ]);
    setUsers(usersRes.data || []);
    setStats({ users: usersRes.data?.length || 0, posts: postsRes.count || 0, reports: reportsRes.data?.length || 0 });
    setReports(reportsRes.data || []);
    setLoading(false);
    setChecking(false);
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const banUser = async (userId) => {
    if (!confirm('Ban this user?')) return;
    await supabase.from('profiles').update({ role: 'banned' }).eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const resolveReport = async (reportId, status) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const deleteContent = async (entityType, entityId) => {
    if (!confirm(`Delete this ${entityType}?`)) return;
    const table = entityType === 'post' ? 'posts' : 'comments';
    await supabase.from(table).delete().eq('id', entityId);
    setReports(prev => prev.filter(r => r.entity_id !== entityId));
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Admin Login Required</h2>
          <p style={{ color: '#888', marginBottom: 16 }}>Please log in to access the admin dashboard.</p>
          <a href="/auth/login" style={{ padding: '10px 24px', borderRadius: 20, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Login</a>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🔒</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: '#888', marginBottom: 16 }}>You need admin privileges to access this page.</p>
          <a href="/" style={{ padding: '10px 24px', borderRadius: 20, background: '#ff2442', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Go Home</a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 14, color: '#888', textDecoration: 'none' }}>&larr; Back</a>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? '#ff2442' : '#888', background: activeTab === t.id ? 'rgba(255,36,66,.08)' : 'transparent', border: 'none', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Users', value: stats.users, icon: '👥', color: '#3b82f6' },
              { label: 'Total Posts', value: stats.posts, icon: '📝', color: '#22c55e' },
              { label: 'Open Reports', value: stats.reports, icon: '🚩', color: '#ef4444' }
            ].map(s => (
              <div key={s.label} style={{ padding: 24, background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {loading ? <p style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading...</p> : users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <img src={u.avatar_url || `https://i.pravatar.cc/150?u=${u.id}`} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{u.display_name} {u.is_verified && '✅'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>@{u.username}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: u.role === 'admin' ? '#eff6ff' : u.role === 'banned' ? '#fef2f2' : '#f0fdf4', color: u.role === 'admin' ? '#3b82f6' : u.role === 'banned' ? '#ef4444' : '#22c55e' }}>
                  {u.role}
                </span>
                <button onClick={() => toggleRole(u.id, u.role)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#f5f5f7', border: '1px solid #e5e5e5', cursor: 'pointer' }}>
                  {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                </button>
                <button onClick={() => banUser(u.id)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer' }}>
                  Ban
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', overflow: 'hidden' }}>
            {loading ? <p style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading...</p> : reports.length === 0 ? (
              <p style={{ padding: 40, textAlign: 'center', color: '#888' }}>No pending reports</p>
            ) : reports.map(r => (
              <div key={r.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#ef4444' }}>{r.entity_type}</span>
                  <span style={{ fontSize: 12, color: '#888' }}>by @{r.reporter?.username}</span>
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 13, marginBottom: 10 }}>{r.reason}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => deleteContent(r.entity_type, r.entity_id)} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
                  <button onClick={() => resolveReport(r.id, 'resolved')} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer' }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
