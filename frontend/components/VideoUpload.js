'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const VIDEO_MAX_SIZE = 100 * 1024 * 1024;
const ACCEPTED_FORMATS = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

export default function VideoUpload({ onUpload, onClose, addToast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED_FORMATS.includes(f.type)) {
      addToast?.('Only video files are allowed');
      return;
    }
    if (f.size > VIDEO_MAX_SIZE) {
      addToast?.('Video must be less than 100MB');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const uploadVideo = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    setProgress(70);

    if (error) {
      addToast?.('Upload failed');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('posts').getPublicUrl(filePath);
    setProgress(100);

    if (data?.publicUrl) {
      onUpload?.({
        video_url: data.publicUrl,
        title: title || file.name,
        description,
        // The database uses `post` for every feed item; media kind is
        // determined by video_url/image_url.
        type: 'post'
      });
    }

    setUploading(false);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(520px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>Upload Video</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: 20 }}>
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ border: `2px dashed ${dragOver ? '#ff2442' : line}`, borderRadius: 14, padding: '40px 0', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(255,36,66,.05)' : chip }}
            >
              <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🎬</span>
              <p style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 4 }}>Click or drag to upload video</p>
              <p style={{ fontSize: 12, color: sub }}>MP4, WebM, MOV · Max 100MB</p>
            </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
              <video ref={videoRef} src={preview} controls style={{ width: '100%', maxHeight: 300, borderRadius: 14, background: '#000' }} />
              <button onClick={() => { setPreview(null); setFile(null); }} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="video/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />

          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 6, background: line, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #ff2442, #ff7a59)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 12, color: sub, marginTop: 6, textAlign: 'center' }}>{progress}% uploaded</p>
            </div>
          )}

          <button onClick={uploadVideo} disabled={!file || uploading} style={{ width: '100%', height: 44, borderRadius: 22, background: file && !uploading ? 'linear-gradient(135deg, #ff2442, #ff7a59)' : chip, color: file && !uploading ? '#fff' : sub, fontWeight: 700, fontSize: 15, border: 'none', cursor: file && !uploading ? 'pointer' : 'not-allowed', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      </div>
    </div>
  );
}
