'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Photography', 'Food', 'Travel', 'Fashion', 'Beauty', 'Fitness', 'Home', 'Art', 'Pets', 'Gaming'];

export default function CreateModal({ onClose, onCreate, addToast }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Food');
  const [img, setImg] = useState('');
  const [tags, setTags] = useState('');
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      addToast?.('Upload failed');
      return null;
    }

    const { data } = supabase.storage.from('posts').getPublicUrl(filePath);
    return data?.publicUrl;
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast?.('Image must be less than 10MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast?.('Only images are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setImg(url);
    setUploading(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast?.('Image must be less than 10MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      addToast?.('Only images are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setImg(url);
    setUploading(false);
  };

  const handlePost = async () => {
    if (!title.trim()) return;
    setPosting(true);
    const created = await onCreate({
      title,
      description: desc,
      category: cat,
      image_url: img || `https://picsum.photos/seed/${Date.now()}/400/500`,
      tags: tags.split(/[,\s]+/).filter(Boolean)
    });
    setPosting(false);
    if (!created) return;
    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(520px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: 'var(--card-bg)', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.5)' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub, #888)', border: 'none', background: 'var(--input-bg, #f0f0f0)', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--ink)' }}>Create Note</h3>

        <div style={{ background: 'var(--input-bg, #f0f0f0)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a title" maxLength={100}
            style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--bg, #fff)', color: 'var(--ink)', padding: '0 12px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add content (optional)" rows={2}
            style={{ width: '100%', borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--bg, #fff)', color: 'var(--ink)', padding: '10px 12px', fontSize: 13, marginBottom: 10, resize: 'vertical', boxSizing: 'border-box' }} />

          <div style={{ marginBottom: 10 }}>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10 }} />
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13 }}>Uploading...</div>
                )}
                <button onClick={() => { setPreview(null); setImg(''); }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>x</button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--rn-red, #ff2442)' : 'var(--line, #e5e5e5)'}`,
                  borderRadius: 10, padding: '24px 0', textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.2s', background: dragOver ? 'rgba(255,36,66,0.05)' : 'transparent'
                }}
              >
                <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>📷</span>
                <p style={{ fontSize: 13, color: 'var(--sub, #888)', fontWeight: 600 }}>Click or drag to upload image</p>
                <p style={{ fontSize: 11, color: 'var(--sub, #888)', marginTop: 4 }}>Max 10MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            <input value={img} onChange={e => { setImg(e.target.value); setPreview(e.target.value || null); }} placeholder="Image URL (optional)"
              style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--bg, #fff)', color: 'var(--ink)', padding: '0 12px', fontSize: 13, marginTop: 8, boxSizing: 'border-box' }} />
          </div>

          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags: travel, summer, sunset"
            style={{ width: '100%', height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--bg, #fff)', color: 'var(--ink)', padding: '0 12px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' }} />

          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>Category</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, border: '1.5px solid var(--line, #e5e5e5)', cursor: 'pointer', background: cat === c ? 'var(--rn-red, #ff2442)' : 'var(--bg, #fff)', color: cat === c ? '#fff' : 'var(--ink)', transition: 'all .2s' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handlePost} disabled={posting || success || uploading} style={{ width: '100%', height: 44, borderRadius: 22, background: success ? '#22c55e' : 'linear-gradient(135deg, var(--rn-red, #ff2442), #ff7a59)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: posting || success || uploading ? 'not-allowed' : 'pointer', opacity: posting || success || uploading ? 0.7 : 1, transition: 'background .3s', boxShadow: '0 4px 14px rgba(255,36,66,.35)' }}>
          {success ? 'Posted!' : posting ? 'Publishing...' : uploading ? 'Uploading...' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
