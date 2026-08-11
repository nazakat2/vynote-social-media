'use client';
import { useState, useRef, useCallback } from 'react';
import NoteCard from './NoteCard';
import LoadingSpinner from './LoadingSpinner';

export default function Feed({ notes, onNoteClick, onLike, onCollect, loading, refreshing, onRefresh, loadMoreRef, hasMore }) {
  const [pullStart, setPullStart] = useState(0);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      setPullStart(e.touches[0].clientY);
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling) return;
    const diff = e.touches[0].clientY - pullStart;
    if (diff > 80 && window.scrollY === 0) {
      onRefresh?.();
      setPulling(false);
    }
  }, [pulling, pullStart, onRefresh]);

  const handleTouchEnd = useCallback(() => { setPulling(false); }, []);

  if (!notes.length && !loading) {
    return (
      <main style={{ paddingTop: 130, paddingBottom: 90, paddingLeft: 20, paddingRight: 20, maxWidth: 1600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', color: 'var(--sub, #888)', padding: '60px 0', fontSize: 13 }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>No notes found</span>
          Try another keyword or create a note!
        </div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ paddingTop: 130, paddingBottom: 90, paddingLeft: 20, paddingRight: 20, maxWidth: 1600, margin: '0 auto' }}
    >
      {refreshing && (
        <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--rn-red, #ff2442)', fontSize: 13, fontWeight: 600 }}>
          Refreshing...
        </div>
      )}
      <div style={{ columnCount: 5, columnGap: 16 }}>
        {notes.map((n, i) => (
          <div key={n.id} className="animate-cardIn" style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>
            <NoteCard note={n} index={i} onClick={() => onNoteClick(n)} onLike={() => onLike?.(n)} onCollect={() => onCollect?.(n)} />
          </div>
        ))}
      </div>
      <div ref={loadMoreRef}>
        {loading && <LoadingSpinner />}
        {!hasMore && notes.length > 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--sub, #888)', fontSize: 13 }}>
            You've seen all notes
          </div>
        )}
      </div>
    </main>
  );
}
