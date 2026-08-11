'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useGroups() {
  const listGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('groups')
      .select('*, creator:profiles!groups_creator_id_fkey(display_name, username, avatar_url), group_members(user_id)');
    return {
      data: data?.map(group => ({
        ...group,
        member_count: group.group_members?.length || 0,
        is_member: !!user && group.group_members?.some(member => member.user_id === user.id)
      })).sort((a, b) => b.member_count - a.member_count),
      error
    };
  };

  const createGroup = async ({ name, description, is_private }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('groups').insert({ name, description, is_private, creator_id: user.id });
  };

  const joinGroup = async (groupId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Please sign in first') };
    return supabase.from('group_members').upsert(
      { group_id: groupId, user_id: user.id, role: 'member' },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    );
  };

  const leaveGroup = async (groupId) => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
  };

  const getGroupPosts = async (groupId) => {
    return supabase.from('group_posts').select('*, profiles:user_id(display_name, username, avatar_url)').eq('group_id', groupId).order('created_at', { ascending: false });
  };

  return { listGroups, createGroup, joinGroup, leaveGroup, getGroupPosts };
}

export default function GroupsPage({ onClose, addToast }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const { listGroups, createGroup, joinGroup, leaveGroup } = useGroups();

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    const { data } = await listGroups();
    if (data) setGroups(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    await createGroup({ name: newGroupName, description: newGroupDesc, is_private: false });
    setCreating(false);
    setShowCreate(false);
    setNewGroupName('');
    setNewGroupDesc('');
    loadGroups();
    addToast?.('Group created!');
  };

  const handleJoin = async (groupId) => {
    const { error } = await joinGroup(groupId);
    if (error) {
      addToast?.(`Could not join: ${error.message}`);
      return;
    }
    addToast?.('Joined group!');
    loadGroups();
  };

  const handleLeave = async (groupId) => {
    const { error } = await leaveGroup(groupId);
    if (error) {
      addToast?.(`Could not leave: ${error.message}`);
      return;
    }
    addToast?.('Left group');
    loadGroups();
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(540px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 22, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(0,0,0,.28)' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div><h2 style={{ fontSize: 19, fontWeight: 800, color: ink, margin: 0 }}>Groups</h2><p style={{ margin: '3px 0 0', fontSize: 12, color: sub }}>Connect and share with your community</p></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ New</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        </div>

        {showCreate && (
          <div style={{ padding: 16, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group name" style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ width: '100%', borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
            <button onClick={handleCreate} disabled={creating || !newGroupName.trim()} style={{ width: '100%', height: 36, borderRadius: 18, background: newGroupName.trim() ? '#ff2442' : chip, color: newGroupName.trim() ? '#fff' : sub, fontWeight: 600, fontSize: 13, border: 'none', cursor: newGroupName.trim() ? 'pointer' : 'not-allowed' }}>
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>Loading...</div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>👥</span>
              No groups yet. Create one!
            </div>
          ) : groups.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: bg, border: `1px solid ${line}`, borderRadius: 16, marginBottom: 10, boxShadow: '0 5px 18px rgba(20,20,30,.05)' }}>
              <div style={{ width: 54, height: 54, flex: '0 0 54px', borderRadius: 16, background: `linear-gradient(135deg, #ff2442, #ff8068)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 7px 18px rgba(255,36,66,.22)' }}>
                👥
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 750, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                {g.description && <div style={{ fontSize: 12, color: sub, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.description}</div>}
                <div style={{ fontSize: 11, color: sub, marginTop: 5 }}>{g.member_count || 0} {g.member_count === 1 ? 'member' : 'members'}{g.creator?.display_name ? ` • by ${g.creator.display_name}` : ''}</div>
              </div>
              <button title={g.is_member ? 'Click to leave group' : 'Join group'} onClick={() => g.is_member ? handleLeave(g.id) : handleJoin(g.id)} style={{ minWidth: 78, padding: '8px 14px', borderRadius: 18, fontSize: 12, fontWeight: 700, background: g.is_member ? '#fff0f2' : '#ff2442', border: `1px solid ${g.is_member ? '#ffc1ca' : '#ff2442'}`, cursor: 'pointer', color: g.is_member ? '#ff2442' : '#fff' }}>
                {g.is_member ? '✓ Joined' : '+ Join'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
