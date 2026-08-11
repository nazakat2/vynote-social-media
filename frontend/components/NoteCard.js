'use client';
import { useState, useRef, useEffect } from 'react';

function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n || 0); }
const HEART = (f) => <svg width="15" height="15" viewBox="0 0 24 24" fill={f ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" /></svg>;

export default function NoteCard({ note, index, onClick, onLike, onCollect }) {
  const [liked, setLiked] = useState(note.is_liked || false);
  const [likes, setLikes] = useState(note.like_count || 0);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);

  const author = note.profiles || {};
  const authorName = author.display_name || author.username || 'Unknown';
  const authorAvatar = author.avatar_url || '/images/default-avatar.png';

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLiked(note.is_liked || false);
    setLikes(note.like_count || 0);
  }, [note.is_liked, note.like_count]);

  const handleLike = (e) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(l => newLiked ? l + 1 : Math.max(0, l - 1));
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
    onLike?.();
  };

  return (
    <article ref={imgRef} className="note-card" style={{ breakInside: 'avoid', marginBottom: 20, cursor: 'pointer', borderRadius: 12, background: 'var(--card-bg)', overflow: 'hidden' }} onClick={onClick}>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--input-bg)' }}>
        {!imgLoaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--input-bg)' }}>
            <div style={{ width: 24, height: 24, border: '2.5px solid var(--line)', borderTopColor: 'var(--rn-red, #ff2442)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}
        {visible && note.video_url ? (
          <video
            src={note.video_url}
            poster={note.image_url || undefined}
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setImgLoaded(true)}
            style={{ width: '100%', display: 'block', maxHeight: 520, aspectRatio: note.aspect_ratio || '4/5', objectFit: 'cover', background: '#000' }}
          />
        ) : visible && note.image_url && (
          <img src={note.image_url} alt="" loading="lazy" onLoad={() => setImgLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease, opacity 0.4s', opacity: imgLoaded ? 1 : 0, transform: imgLoaded ? 'scale(1)' : 'scale(1.05)' }} />
        )}
        {note.video_url && <span style={{ position: 'absolute', inset: 0, margin: 'auto', width: 52, height: 52, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(15,15,18,.58)', color: '#fff', pointerEvents: 'none', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.42)', boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ marginLeft: 3 }}><path d="M8 5.2v13.6c0 .9 1 1.4 1.8.9l10-6.8a1.1 1.1 0 0 0 0-1.8l-10-6.8A1.1 1.1 0 0 0 8 5.2Z" /></svg></span>}
        {note.category && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.42)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 10 }}>{note.category}</span>
        )}
      </div>
      <h3 style={{ margin: '9px 8px 7px', fontSize: 14, fontWeight: 600, lineHeight: 1.45, color: 'var(--ink)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <img src={authorAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 12, color: 'var(--sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authorName}</span>
        </div>
        <button onClick={handleLike} className="btn-hover" style={{ display: 'flex', alignItems: 'center', gap: 4, color: liked ? 'var(--rn-red, #ff2442)' : 'var(--sub)', padding: 4, borderRadius: 8, flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
          <span style={{ animation: animating ? 'pop .35s ease' : 'none', display: 'inline-flex' }}>{HEART(liked)}</span>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{fmt(likes)}</span>
        </button>
      </div>
    </article>
  );
}
