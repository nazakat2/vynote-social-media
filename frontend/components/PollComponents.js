'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function PollCreator({ onAdd, addToast }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [showPoll, setShowPoll] = useState(false);

  const addOption = () => {
    if (options.length >= 6) { addToast?.('Max 6 options'); return; }
    setOptions([...options, '']);
  };

  const updateOption = (i, val) => {
    const newOpts = [...options];
    newOpts[i] = val;
    setOptions(newOpts);
  };

  const removeOption = (i) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const handleAdd = () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) {
      addToast?.('Need question and at least 2 options');
      return;
    }
    onAdd?.({ question, options: options.filter(o => o.trim()), type: 'poll' });
    setQuestion('');
    setOptions(['', '']);
    setShowPoll(false);
  };

  if (!showPoll) {
    return (
      <button onClick={() => setShowPoll(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 14, background: 'var(--chip, #f5f5f7)', border: '1px solid var(--line, #e5e5e5)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
        📊 Add Poll
      </button>
    );
  }

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ padding: 12, background: chip, borderRadius: 12, marginBottom: 10 }}>
      <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..." style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
      {options.map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1, height: 34, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, boxSizing: 'border-box' }} />
          {options.length > 2 && <button onClick={() => removeOption(i)} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 14 }}>x</button>}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={addOption} style={{ flex: 1, height: 34, borderRadius: 8, background: bg, border: `1px solid ${line}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: ink }}>+ Add Option</button>
        <button onClick={handleAdd} style={{ flex: 1, height: 34, borderRadius: 8, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Add Poll</button>
      </div>
    </div>
  );
}

export function PollDisplay({ poll, onVote }) {
  const [voted, setVoted] = useState(null);
  const [totalVotes, setTotalVotes] = useState(poll.votes?.reduce((a, b) => a + b, 0) || 0);

  const handleVote = async (index) => {
    if (voted !== null) return;
    setVoted(index);
    setTotalVotes(prev => prev + 1);
    onVote?.(index);
  };

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div style={{ padding: 14, background: 'var(--chip, #f5f5f7)', borderRadius: 12, marginTop: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>📊 {poll.question}</div>
      {poll.options?.map((opt, i) => {
        const pct = getPercentage(poll.votes?.[i] || 0);
        const isSelected = voted === i;
        return (
          <button key={i} onClick={() => handleVote(i)} disabled={voted !== null} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: isSelected ? 'rgba(255,36,66,.1)' : 'var(--bg, #fff)', border: `1px solid ${isSelected ? '#ff2442' : 'var(--line, #e5e5e5)'}`, cursor: voted !== null ? 'default' : 'pointer', position: 'relative', overflow: 'hidden', textAlign: 'left' }}>
            {voted !== null && (
              <div style={{ position: 'absolute', inset: 0, background: isSelected ? 'rgba(255,36,66,.08)' : 'rgba(0,0,0,.03)', width: `${pct}%`, transition: 'width 0.3s' }} />
            )}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ fontWeight: isSelected ? 600 : 400, color: 'var(--ink)' }}>{opt}</span>
              {voted !== null && <span style={{ color: 'var(--sub)', fontWeight: 600 }}>{pct}%</span>}
            </div>
          </button>
        );
      })}
      <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 4 }}>{totalVotes} votes</div>
    </div>
  );
}
