'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', icon: '🚫' },
  { id: 'nudity', label: 'Nudity or sexual content', icon: '⚠️' },
  { id: 'violence', label: 'Violence or dangerous content', icon: '🔫' },
  { id: 'hate', label: 'Hate speech or symbols', icon: '💢' },
  { id: 'harassment', label: 'Harassment or bullying', icon: '😤' },
  { id: 'misinformation', label: 'False information', icon: '❌' },
  { id: 'scam', label: 'Scam or fraud', icon: '💰' },
  { id: 'intellectual', label: 'Intellectual property violation', icon: '©️' },
  { id: 'other', label: 'Other', icon: '📝' }
];

export default function ReportModal({ entityType, entityId, onClose, addToast }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      addToast?.('Please log in to report');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      reason: `${reason}${details ? ': ' + details : ''}`
    });

    setSubmitting(false);
    if (error) {
      addToast?.('Failed to submit report');
    } else {
      setSubmitted(true);
      addToast?.('Report submitted. Thank you!');
      setTimeout(() => onClose(), 1500);
    }
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  if (submitted) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
        <div style={{ width: 340, background: bg, borderRadius: 20, padding: 40, textAlign: 'center', animation: 'modalIn .25s ease' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: ink, marginBottom: 8 }}>Report Submitted</h3>
          <p style={{ fontSize: 13, color: sub }}>We'll review this and take action if needed.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(440px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>Report</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: sub, marginBottom: 16 }}>Why are you reporting this {entityType}?</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {REPORT_REASONS.map(r => (
              <button
                key={r.id}
                onClick={() => setReason(r.label)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: reason === r.label ? 'rgba(255,36,66,.08)' : 'transparent', border: `1px solid ${reason === r.label ? '#ff2442' : 'transparent'}`, cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}
              >
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span style={{ fontSize: 14, color: reason === r.label ? '#ff2442' : ink, fontWeight: reason === r.label ? 600 : 400 }}>{r.label}</span>
              </button>
            ))}
          </div>

          {reason && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: sub, display: 'block', marginBottom: 6 }}>Additional details (optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Provide more context..."
                style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            style={{ width: '100%', height: 44, borderRadius: 22, background: reason ? '#ef4444' : chip, color: reason ? '#fff' : sub, fontWeight: 700, fontSize: 14, border: 'none', cursor: reason ? 'pointer' : 'not-allowed', opacity: submitting ? 0.6 : 1, transition: 'all .2s' }}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
