'use client';
import { useState, useEffect } from 'react';
import NoteCard from './NoteCard';
import { collections as collectionsApi, posts as postsApi } from '../lib/api/index';

export default function BookmarkModal({ collections: collectionsProp, setCollections: setCollectionsProp, selectedNoteId, onClose, addToast, userId }) {
  const [localCollections, setLocalCollections] = useState([]);
  const [activeCol, setActiveCol] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [savedNotes, setSavedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (activeCol) {
      loadNotes(activeCol);
    }
  }, [activeCol]);

  const loadCollections = async () => {
    setLoading(true);
    const { data } = await collectionsApi.list();
    if (data) {
      setLocalCollections(data);
      setCollectionsProp?.(data);
      if (data.length > 0 && !activeCol) {
        setActiveCol(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadNotes = async (collectionId) => {
    const { data } = await collectionsApi.getNotes(collectionId);
    if (data) setSavedNotes(data);
  };

  const toggleNote = async (note) => {
    if (!activeCol) return;
    const { data, error } = await collectionsApi.toggleNote(activeCol, note.id);
    if (data) {
      loadNotes(activeCol);
      addToast?.(data.added ? 'Added to collection' : 'Removed from collection');
    }
  };

  const addCollection = async () => {
    if (!newName.trim()) return;
    const { data, error } = await collectionsApi.create(newName);
    if (data) {
      setLocalCollections((prev) => [data, ...prev]);
      setNewName('');
      setShowCreate(false);
      setActiveCol(data.id);
      addToast?.('Collection created');
    }
  };

  const deleteCollection = async (collectionId) => {
    const { error } = await collectionsApi.delete(collectionId);
    if (!error) {
      setLocalCollections((prev) => prev.filter((c) => c.id !== collectionId));
      if (activeCol === collectionId) {
        setActiveCol(localCollections.find((c) => c.id !== collectionId)?.id || null);
      }
      addToast?.('Collection deleted');
    }
  };

  const renameCollection = async (collectionId, name) => {
    const { data } = await collectionsApi.update(collectionId, { name });
    if (data) {
      setLocalCollections((prev) => prev.map((c) => c.id === collectionId ? { ...c, name } : c));
    }
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(720px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: 'var(--card-bg, #ffffff)', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--ink, #222)' }}>Bookmark Collections</h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {localCollections.map((col) => (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setActiveCol(col.id)} style={{
                padding: '8px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600,
                border: '1.5px solid var(--line, #e5e5e5)', cursor: 'pointer',
                background: activeCol === col.id ? 'var(--rn-red, #ff2442)' : 'var(--chip, #f0f0f0)',
                color: activeCol === col.id ? '#fff' : 'var(--ink, #222)'
              }}>
                {col.icon} {col.name}
              </button>
              <button onClick={() => deleteCollection(col.id)} style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: 'none', background: 'none', color: '#ef4444',
                cursor: 'pointer', fontSize: 13, flexShrink: 0
              }}>x</button>
            </div>
          ))}
          <button onClick={() => setShowCreate(!showCreate)} style={{
            padding: '8px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600,
            border: '1.5px dashed var(--rn-red, #ff2442)', cursor: 'pointer',
            background: 'transparent', color: 'var(--rn-red, #ff2442)'
          }}>+ Create</button>
        </div>

        {showCreate && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Collection name"
              onKeyDown={e => e.key === 'Enter' && addCollection()}
              style={{
                flex: 1, height: 38, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)',
                background: 'var(--input-bg, #f5f5f5)', color: 'var(--ink, #222)', padding: '0 12px', fontSize: 13
              }} />
            <button onClick={addCollection} style={{
              height: 38, padding: '0 18px', borderRadius: 19, background: 'var(--rn-red, #ff2442)',
              color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13
            }}>Add</button>
          </div>
        )}

        <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--sub, #888)' }}>
          Click the bookmark icon on any note to add it to this collection.
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--sub, #888)' }}>Loading...</div>
        ) : (
          <div style={{ columnCount: 3, columnGap: 16 }}>
            {savedNotes.map(n => (
              <div key={n.id} style={{ position: 'relative', breakInside: 'avoid', marginBottom: 16 }}>
                <NoteCard note={n} index={0} onClick={() => {}} onLike={() => {}} />
                <button onClick={() => toggleNote(n)} style={{
                  position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
                  background: 'rgba(239,68,68,.85)', color: '#fff', cursor: 'pointer', fontSize: 12
                }}>x</button>
              </div>
            ))}
          </div>
        )}

        {!loading && !savedNotes.length && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--sub, #888)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>📌</span>
            No notes in this collection yet. Browse and save notes you love!
          </div>
        )}
      </div>
    </div>
  );
}
