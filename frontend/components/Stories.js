'use client';
import { useEffect, useRef, useState } from 'react';
import { stories as storiesApi } from '../lib/api/index';
import { supabase } from '../lib/supabase';

export default function Stories({ addToast, me }) {
  const [stories, setStories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [preview, setPreview] = useState('');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null));
    loadStories();
    const channel = supabase.channel('stories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, loadStories)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!activeStory) return;
    const timer = setTimeout(() => setActiveStory(null), 7000);
    return () => clearTimeout(timer);
  }, [activeStory]);

  const loadStories = async () => {
    const { data, error } = await storiesApi.list();
    if (error) addToast?.(`Stories failed: ${error.message}`);
    if (data) setStories(data);
  };

  const ownStory = stories.find((story) => story.user_id === userId);
  const visibleStories = stories.filter((story) => story.user_id !== userId);

  const openStory = async (story) => {
    setActiveStory(story);
    if (story.user_id !== userId) await storiesApi.markAsViewed(story.id);
  };

  const handleOwnStory = () => {
    if (ownStory) openStory(ownStory);
    else setShowCreate(true);
  };

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      addToast?.('Please select an image');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      addToast?.('Story image must be under 10MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const publishStory = async () => {
    if (!file || !userId) return;
    setSaving(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('stories')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      addToast?.(`Story upload failed: ${uploadError.message}`);
      setSaving(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from('stories').getPublicUrl(path);
    const { data, error } = await storiesApi.create(publicUrl.publicUrl, caption.trim());
    if (error) {
      await supabase.storage.from('stories').remove([path]);
      addToast?.(`Story publish failed: ${error.message}`);
      setSaving(false);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
    setFile(null);
    setCaption('');
    setShowCreate(false);
    setSaving(false);
    addToast?.('Story published for 24 hours');
    await loadStories();
    setActiveStory(data);
  };

  const storyProfile = (story) => story?.profiles || {};
  const storyName = (story) => storyProfile(story).display_name || storyProfile(story).username || 'Story';
  const storyAvatar = (story) => storyProfile(story).avatar_url || '/images/default-avatar.png';

  return (
    <>
      <div style={{ position: 'sticky', top: 102, zIndex: 39, background: 'var(--bg, rgba(255,255,255,.95))', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line, #f0f0f0)', padding: '10px 20px 10px 24px', display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button type="button" onClick={handleOwnStory} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer', border: 0, background: 'transparent', padding: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', padding: 3, position: 'relative', background: ownStory ? 'linear-gradient(135deg, var(--rn-red, #ff2442), #ff7a59, #ffb199)' : 'var(--line, #e5e5e5)' }}>
            <img src={ownStory ? storyAvatar(ownStory) : (me?.avatar_url || '/images/default-avatar.png')} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #fff' }} />
            {!ownStory && <span style={{ position: 'absolute', right: -1, bottom: -1, width: 20, height: 20, borderRadius: '50%', background: 'var(--rn-red, #ff2442)', color: '#fff', border: '2px solid #fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>+</span>}
          </div>
          <span style={{ fontSize: 10.5, color: 'var(--sub, #888)', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me?.display_name || me?.username || 'Your Story'}</span>
        </button>

        {visibleStories.map((story) => (
          <button type="button" key={story.id} onClick={() => openStory(story)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, cursor: 'pointer', border: 0, background: 'transparent', padding: 0 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg, var(--rn-red, #ff2442), #ff7a59, #ffb199)' }}>
              <img src={storyAvatar(story)} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #fff' }} />
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--sub, #888)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storyName(story)}</span>
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="rn-sidebar-aware-overlay" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(10,10,15,.78)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={(event) => event.target === event.currentTarget && setShowCreate(false)}>
          <div style={{ width: 'min(420px, 94vw)', background: 'var(--card-bg, #fff)', borderRadius: 20, padding: 20, color: 'var(--ink, #222)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Add to Your Story</h3>
              <button onClick={() => setShowCreate(false)} style={{ border: 0, background: 'var(--chip, #f2f2f4)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>x</button>
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ width: '100%', height: 300, borderRadius: 16, border: '2px dashed var(--line, #ddd)', padding: 0, overflow: 'hidden', cursor: 'pointer', background: 'var(--input-bg, #f5f5f7)', color: 'var(--sub, #888)' }}>
              {preview ? <img src={preview} alt="Story preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'Choose a photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={selectFile} style={{ display: 'none' }} />
            <input value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={160} placeholder="Add a caption..." style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, height: 42, borderRadius: 12, border: '1px solid var(--line, #ddd)', padding: '0 12px', background: 'var(--input-bg, #f5f5f7)', color: 'var(--ink, #222)' }} />
            <button onClick={publishStory} disabled={!file || saving} style={{ width: '100%', height: 44, marginTop: 12, border: 0, borderRadius: 22, background: 'var(--rn-red, #ff2442)', color: '#fff', fontWeight: 700, cursor: file && !saving ? 'pointer' : 'not-allowed', opacity: file && !saving ? 1 : .55 }}>{saving ? 'Publishing...' : 'Share Story'}</button>
          </div>
        </div>
      )}

      {activeStory && (
        <div className="rn-sidebar-aware-overlay" style={{ position: 'fixed', inset: 0, zIndex: 125, background: 'rgba(0,0,0,.9)', display: 'grid', placeItems: 'center', padding: 16 }} onClick={(event) => event.target === event.currentTarget && setActiveStory(null)}>
          <div style={{ position: 'relative', width: 'min(430px, 96vw)', height: 'min(760px, 90vh)', borderRadius: 22, overflow: 'hidden', background: '#111' }}>
            <div style={{ position: 'absolute', top: 10, left: 12, right: 12, zIndex: 2, height: 3, borderRadius: 2, background: 'rgba(255,255,255,.35)', overflow: 'hidden' }}>
              <span key={activeStory.id} style={{ display: 'block', width: '100%', height: '100%', borderRadius: 2, background: '#fff', transformOrigin: 'left', animation: 'storyProgress 7s linear forwards' }} />
            </div>
            <div style={{ position: 'absolute', top: 22, left: 16, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textShadow: '0 1px 3px #000' }}>
              <img src={storyAvatar(activeStory)} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }} />
              <strong style={{ fontSize: 13 }}>{activeStory.user_id === userId ? 'Your Story' : storyName(activeStory)}</strong>
            </div>
            <button onClick={() => setActiveStory(null)} style={{ position: 'absolute', top: 20, right: 16, zIndex: 3, width: 34, height: 34, borderRadius: '50%', border: 0, background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer', fontSize: 18 }}>x</button>
            <img src={activeStory.image_url} alt="Story" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            {activeStory.caption && <div style={{ position: 'absolute', left: 18, right: 18, bottom: 26, color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: 600, textShadow: '0 2px 5px #000' }}>{activeStory.caption}</div>}
          </div>
          <style>{`@keyframes storyProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
        </div>
      )}
    </>
  );
}
